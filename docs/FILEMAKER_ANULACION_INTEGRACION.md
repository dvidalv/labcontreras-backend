# Integración FileMaker - Anulación de Comprobantes

## Descripción General

Esta guía explica cómo integrar FileMaker con el endpoint de anulación de comprobantes fiscales del backend.

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Estructura de Datos en FileMaker](#estructura-de-datos-en-filemaker)
3. [Script Básico de Anulación](#script-básico-de-anulación)
4. [Escenarios de Uso](#escenarios-de-uso)
5. [Manejo de Errores](#manejo-de-errores)
6. [Funciones Personalizadas](#funciones-personalizadas)
7. [Mejores Prácticas](#mejores-prácticas)

---

## Requisitos Previos

### 1. Token de Autenticación

Antes de poder anular comprobantes, necesitas tener un token JWT válido. Este token se obtiene al iniciar sesión:

```fmscript
# Script: Obtener Token JWT
Set Variable [ $urlLogin ; Value: "https://tu-api.com/users/signin" ]
Set Variable [ $email ; Value: Globals::gUsuarioEmail ]
Set Variable [ $password ; Value: Globals::gUsuarioPassword ]

Set Variable [ $jsonLogin ; Value:
    "{" &
    "\"email\": \"" & $email & "\"," &
    "\"password\": \"" & $password & "\"" &
    "}"
]

Insert from URL [
    With Dialog: Off ;
    Target: $$respuestaLogin ;
    $urlLogin ;
    cURL options: "-X POST -H \"Content-Type: application/json\" --data '" & $jsonLogin & "'"
]

# Extraer y guardar el token
Set Field [ Globals::gTokenJWT ; JSONGetElement ( $$respuestaLogin ; "token" ) ]
```

### 2. Variables Globales Necesarias

En FileMaker, crea estas variables globales:

| Variable             | Tipo  | Descripción                               |
| -------------------- | ----- | ----------------------------------------- |
| `Globals::gTokenJWT` | Texto | Token de autenticación                    |
| `Globals::gURLBase`  | Texto | URL base del API (ej: https://tu-api.com) |
| `Globals::gRNC`      | Texto | RNC de la empresa                         |

---

## Estructura de Datos en FileMaker

### Tabla: Comprobantes

Campos recomendados para la tabla de comprobantes:

```
Comprobantes
├── id_comprobante (Número, clave primaria)
├── RNC (Texto, 9-11 caracteres)
├── TipoDocumento (Texto, 2 caracteres: "31", "32", etc.)
├── NCF_Desde (Texto, 11 caracteres: "E310000000098")
├── NCF_Hasta (Texto, 11 caracteres: "E310000000099")
├── Estado (Texto: "ACTIVO", "ANULADO", "CONSUMIDO")
├── FechaCreacion (Fecha)
├── FechaAnulacion (Fecha)
├── HoraAnulacion (Hora)
├── UsuarioAnulacion (Texto)
├── CantidadAnulada (Número)
├── RespuestaAPI (Texto, JSON de respuesta)
├── UltimoError (Texto)
├── FechaUltimoError (Marca de tiempo)
```

---

## Script Básico de Anulación

### Opción 1: Anular UN Comprobante (Más Simple) - Con Funciones JSON

```fmscript
# ==========================================
# ANULAR COMPROBANTES - VERSIÓN SIMPLE CON JSON NATIVO
# ==========================================

# 1. Configuración
Set Variable [ $url ; Value: Globals::gURLBase & "/comprobantes/anular" ]
Set Variable [ $token ; Value: Globals::gTokenJWT ]

# 2. Datos del registro actual
Set Variable [ $rnc ; Value: Comprobantes::RNC ]
Set Variable [ $tipo ; Value: Comprobantes::TipoDocumento ]
Set Variable [ $ncf ; Value: Comprobantes::NCF ]

# 3. Construir JSON usando funciones nativas (RECOMENDADO)
Set Variable [ $json ; Value: "{}" ]
Set Variable [ $json ; Value: JSONSetElement ( $json ;
    [ "rnc" ; $rnc ; JSONString ] ;
    [ "anulaciones[0].tipoDocumento" ; $tipo ; JSONString ] ;
    [ "anulaciones[0].ncf" ; $ncf ; JSONString ]
) ]

# 4. Enviar petición
Insert from URL [
    With Dialog: Off ;
    Target: $$resultado ;
    $url ;
    cURL options:
        "-X POST" &
        " -H \"Authorization: Bearer " & $token & "\"" &
        " -H \"Content-Type: application/json\"" &
        " --data '" & $json & "'"
]

# 5. Procesar respuesta
If [ JSONGetElement ( $$resultado ; "status" ) = "success" ]
    Set Field [ Comprobantes::Estado ; "ANULADO" ]
    Set Field [ Comprobantes::FechaAnulacion ; Get ( CurrentDate ) ]
    Show Custom Dialog [ "Éxito" ; "NCF anulado correctamente" ]
Else
    Show Custom Dialog [ "Error" ; JSONGetElement ( $$resultado ; "message" ) ]
End If
```

---

## Escenarios de Uso

### Escenario 1: Anular Múltiples Rangos a la Vez

```fmscript
# ==========================================
# ANULAR MÚLTIPLES RANGOS
# ==========================================

# 1. Ir al primer registro del conjunto encontrado
Go to Record/Request/Page [ First ]

# 2. Inicializar array de anulaciones
Set Variable [ $anulaciones ; Value: "[" ]
Set Variable [ $contador ; Value: 0 ]

# 3. Loop por todos los registros seleccionados
Loop
    # Solo incluir registros ACTIVOS
    If [ Comprobantes::Estado = "ACTIVO" ]

        # Agregar coma si no es el primero
        If [ $contador > 0 ]
            Set Variable [ $anulaciones ; Value: $anulaciones & "," ]
        End If

        # Agregar este registro al array
        Set Variable [ $anulaciones ; Value: $anulaciones &
            "{" &
            "\"tipoDocumento\":\"" & Comprobantes::TipoDocumento & "\"," &
            "\"ncfDesde\":\"" & Comprobantes::NCF_Desde & "\"," &
            "\"ncfHasta\":\"" & Comprobantes::NCF_Hasta & "\"" &
            "}"
        ]

        Set Variable [ $contador ; Value: $contador + 1 ]
    End If

    # Ir al siguiente registro
    Go to Record/Request/Page [ Next ; Exit after last: On ]

End Loop

# 4. Cerrar array y construir JSON completo
Set Variable [ $anulaciones ; Value: $anulaciones & "]" ]

Set Variable [ $json ; Value:
    "{" &
    "\"rnc\":\"" & Globals::gRNC & "\"," &
    "\"anulaciones\":" & $anulaciones &
    "}"
]

# 5. Enviar petición
Set Variable [ $url ; Value: Globals::gURLBase & "/comprobantes/anular" ]

Insert from URL [
    With Dialog: Off ;
    Target: $$resultado ;
    $url ;
    cURL options:
        "-X POST" &
        " -H \"Authorization: Bearer " & Globals::gTokenJWT & "\"" &
        " -H \"Content-Type: application/json\"" &
        " --data '" & $json & "'"
]

# 6. Si fue exitoso, actualizar todos los registros
If [ JSONGetElement ( $$resultado ; "status" ) = "success" ]
    Go to Record/Request/Page [ First ]
    Loop
        If [ Comprobantes::Estado = "ACTIVO" ]
            Set Field [ Comprobantes::Estado ; "ANULADO" ]
            Set Field [ Comprobantes::FechaAnulacion ; Get ( CurrentDate ) ]
        End If
        Go to Record/Request/Page [ Next ; Exit after last: On ]
    End Loop

    Show Custom Dialog [ "Éxito" ;
        "Se anularon " & $contador & " rangos de NCF correctamente"
    ]
Else
    Show Custom Dialog [ "Error" ; JSONGetElement ( $$resultado ; "message" ) ]
End If
```

### Escenario 2: Anular con Fecha Específica

```fmscript
# ==========================================
# ANULAR CON FECHA PERSONALIZADA
# ==========================================

# 1. Mostrar diálogo para seleccionar fecha
Show Custom Dialog [ "Fecha de Anulación" ;
    "Ingrese la fecha y hora de anulación (o deje en blanco para usar la actual):" ;
    Globals::gFechaAnulacion
]

# 2. Si el usuario canceló, salir
If [ Get ( LastMessageChoice ) = 2 ]
    Exit Script
End If

# 3. Formatear la fecha al formato requerido: DD-MM-YYYY HH:mm:ss
If [ not IsEmpty ( Globals::gFechaAnulacion ) ]
    # Convertir fecha de FileMaker al formato requerido
    Set Variable [ $dia ; Value: Right ( "0" & Day ( Globals::gFechaAnulacion ) ; 2 ) ]
    Set Variable [ $mes ; Value: Right ( "0" & Month ( Globals::gFechaAnulacion ) ; 2 ) ]
    Set Variable [ $anio ; Value: Year ( Globals::gFechaAnulacion ) ]
    Set Variable [ $hora ; Value: Right ( "0" & Hour ( Get ( CurrentTime ) ) ; 2 ) ]
    Set Variable [ $minutos ; Value: Right ( "0" & Minute ( Get ( CurrentTime ) ) ; 2 ) ]
    Set Variable [ $segundos ; Value: Right ( "0" & Seconds ( Get ( CurrentTime ) ) ; 2 ) ]

    Set Variable [ $fechaFormateada ; Value:
        $dia & "-" & $mes & "-" & $anio & " " & $hora & ":" & $minutos & ":" & $segundos
    ]

    # Construir JSON con fecha
    Set Variable [ $json ; Value:
        "{" &
        "\"rnc\":\"" & Comprobantes::RNC & "\"," &
        "\"fechaHoraAnulacion\":\"" & $fechaFormateada & "\"," &
        "\"anulaciones\":[{" &
        "\"tipoDocumento\":\"" & Comprobantes::TipoDocumento & "\"," &
        "\"ncfDesde\":\"" & Comprobantes::NCF_Desde & "\"," &
        "\"ncfHasta\":\"" & Comprobantes::NCF_Hasta & "\"" &
        "}]}"
    ]
Else
    # JSON sin fecha (se usará la actual)
    Set Variable [ $json ; Value:
        "{" &
        "\"rnc\":\"" & Comprobantes::RNC & "\"," &
        "\"anulaciones\":[{" &
        "\"tipoDocumento\":\"" & Comprobantes::TipoDocumento & "\"," &
        "\"ncfDesde\":\"" & Comprobantes::NCF_Desde & "\"," &
        "\"ncfHasta\":\"" & Comprobantes::NCF_Hasta & "\"" &
        "}]}"
    ]
End If

# 4. Enviar petición (resto del código igual al ejemplo básico)
```

### Escenario 3: Anular Diferentes Tipos de Documentos

```fmscript
# ==========================================
# ANULAR DIFERENTES TIPOS EN UNA SOLA PETICIÓN
# ==========================================

# Ejemplo: Anular facturas tipo 31 Y notas de crédito tipo 34

Set Variable [ $json ; Value:
    "{" &
    "\"rnc\":\"130960054\"," &
    "\"anulaciones\":[" &
    "{" &
    "\"tipoDocumento\":\"31\"," &
    "\"ncfDesde\":\"E310000000098\"," &
    "\"ncfHasta\":\"E310000000099\"" &
    "}," &
    "{" &
    "\"tipoDocumento\":\"34\"," &
    "\"ncfDesde\":\"E340000000050\"," &
    "\"ncfHasta\":\"E340000000052\"" &
    "}" &
    "]" &
    "}"
]

# Continuar con el envío...
```

---

## Manejo de Errores

### Códigos de Error Comunes

```fmscript
# ==========================================
# FUNCIÓN: Procesar Errores de Anulación
# ==========================================

# Extraer información del error
Set Variable [ $status ; Value: JSONGetElement ( $$resultado ; "status" ) ]
Set Variable [ $mensaje ; Value: JSONGetElement ( $$resultado ; "message" ) ]

# Determinar tipo de error y acción
If [ $status = "error" ]

    # Error de validación (campos faltantes o formato incorrecto)
    If [ PatternCount ( $mensaje ; "obligatorio" ) > 0 or
         PatternCount ( $mensaje ; "inválido" ) > 0 ]

        Show Custom Dialog [ "Error de Validación" ;
            "Hay un problema con los datos ingresados:" & ¶ & ¶ &
            $mensaje & ¶ & ¶ &
            "Por favor revise los campos y vuelva a intentar."
        ]

    # Error de NCF ya anulado
    Else If [ PatternCount ( $mensaje ; "ya fue anulado" ) > 0 ]

        Show Custom Dialog [ "NCF Ya Anulado" ;
            "Este NCF ya fue anulado anteriormente." & ¶ & ¶ &
            "No se puede anular nuevamente."
        ]

        # Actualizar estado local
        Set Field [ Comprobantes::Estado ; "ANULADO" ]

    # Error de token expirado
    Else If [ PatternCount ( $mensaje ; "token" ) > 0 or
              PatternCount ( $mensaje ; "autenticación" ) > 0 ]

        Show Custom Dialog [ "Sesión Expirada" ;
            "Su sesión ha expirado." & ¶ & ¶ &
            "Por favor inicie sesión nuevamente."
        ]

        # Limpiar token y redirigir al login
        Set Field [ Globals::gTokenJWT ; "" ]
        Go to Layout [ "Login" ]

    # Error genérico
    Else

        Show Custom Dialog [ "Error" ;
            "Ocurrió un error al anular:" & ¶ & ¶ &
            $mensaje
        ]

    End If

# Error de conexión
Else If [ Get ( LastError ) ≠ 0 ]

    Show Custom Dialog [ "Error de Conexión" ;
        "No se pudo conectar con el servidor." & ¶ & ¶ &
        "Código de error: " & Get ( LastError ) & ¶ & ¶ &
        "Verifique su conexión a internet."
    ]

End If
```

---

## 🔧 Funciones JSON de FileMaker (Recomendado)

FileMaker incluye funciones nativas para trabajar con JSON desde la versión 16. **Es altamente recomendado usar estas funciones** en lugar de construir JSON manualmente.

### Funciones Principales

#### `JSONSetElement ( json ; keyOrIndexOrPath ; value ; type )`

Crea o modifica elementos JSON.

**Tipos de datos:**

- `JSONString` - Texto
- `JSONNumber` - Número
- `JSONBoolean` - Booleano (True/False)
- `JSONObject` - Objeto {}
- `JSONArray` - Array []

**Ejemplo básico:**

```fmscript
# Crear JSON vacío
Set Variable [ $json ; Value: "{}" ]

# Agregar campos
Set Variable [ $json ; Value: JSONSetElement ( $json ;
    [ "rnc" ; "130960054" ; JSONString ] ;
    [ "anulaciones[0].tipoDocumento" ; "31" ; JSONString ] ;
    [ "anulaciones[0].ncf" ; "E310000000098" ; JSONString ]
) ]

# Resultado:
# {"rnc":"130960054","anulaciones":[{"tipoDocumento":"31","ncf":"E310000000098"}]}
```

#### `JSONGetElement ( json ; keyOrIndexOrPath )`

Extrae un valor del JSON.

```fmscript
Set Variable [ $status ; Value: JSONGetElement ( $$resultado ; "status" ) ]
Set Variable [ $mensaje ; Value: JSONGetElement ( $$resultado ; "message" ) ]
Set Variable [ $cantidad ; Value: JSONGetElement ( $$resultado ; "data.cantidadAnulada" ) ]
```

#### `JSONFormatElements ( json )`

Formatea JSON para mejor legibilidad (útil para debugging).

```fmscript
# JSON compacto
Set Variable [ $json ; Value: '{"rnc":"130960054","anulaciones":[...]}' ]

# JSON formateado (con indentación)
Set Variable [ $jsonLegible ; Value: JSONFormatElements ( $json ) ]

# Resultado:
# {
#   "rnc": "130960054",
#   "anulaciones": [
#     ...
#   ]
# }
```

### Ejemplo Completo con Funciones JSON

```fmscript
# ==========================================
# EJEMPLO: Anular con JSONSetElement
# ==========================================

# Inicializar JSON vacío
Set Variable [ $json ; Value: "{}" ]

# Construir estructura completa
Set Variable [ $json ; Value: JSONSetElement ( $json ;
    # Encabezado
    [ "rnc" ; Comprobantes::RNC ; JSONString ] ;

    # Primera anulación
    [ "anulaciones[0].tipoDocumento" ; Comprobantes::TipoDocumento ; JSONString ] ;
    [ "anulaciones[0].ncf" ; Comprobantes::NCF ; JSONString ]
) ]

# Si quieres agregar fecha (opcional)
If [ not IsEmpty ( Globals::gFechaAnulacion ) ]
    Set Variable [ $json ; Value: JSONSetElement ( $json ;
        [ "fechaHoraAnulacion" ; Globals::gFechaAnulacion ; JSONString ]
    ) ]
End If

# Enviar petición
Insert from URL [ With Dialog: Off ; Target: $$resultado ; $url ; cURL options: $curlOptions ]

# Procesar respuesta usando JSONGetElement
Set Variable [ $status ; Value: JSONGetElement ( $$resultado ; "status" ) ]
Set Variable [ $mensaje ; Value: JSONGetElement ( $$resultado ; "message" ) ]

If [ $status = "success" ]
    Set Variable [ $cantidadAnulada ; Value: JSONGetElement ( $$resultado ; "data.cantidadAnulada" ) ]
    Show Custom Dialog [ "Éxito" ; "Se anularon " & $cantidadAnulada & " comprobantes" ]
Else
    Show Custom Dialog [ "Error" ; $mensaje ]
End If
```

### Ventajas de Usar Funciones JSON Nativas

| Aspecto           | Construcción Manual                | Funciones JSON                   |
| ----------------- | ---------------------------------- | -------------------------------- |
| **Seguridad**     | Vulnerable a caracteres especiales | Escapa automáticamente           |
| **Legibilidad**   | Difícil de leer                    | Muy clara                        |
| **Mantenimiento** | Difícil modificar                  | Fácil agregar/quitar campos      |
| **Errores**       | Propenso a errores de sintaxis     | Validación automática            |
| **Debugging**     | Complicado                         | Fácil con `JSONFormatElements()` |

### Caso de Uso: Agregar Múltiples Anulaciones

```fmscript
# Inicializar
Set Variable [ $json ; Value: "{}" ]
Set Variable [ $json ; Value: JSONSetElement ( $json ; "rnc" ; $rnc ; JSONString ) ]

# Agregar primera anulación
Set Variable [ $json ; Value: JSONSetElement ( $json ;
    [ "anulaciones[0].tipoDocumento" ; "31" ; JSONString ] ;
    [ "anulaciones[0].ncfDesde" ; "E310000000098" ; JSONString ] ;
    [ "anulaciones[0].ncfHasta" ; "E310000000099" ; JSONString ]
) ]

# Agregar segunda anulación (diferente tipo)
Set Variable [ $json ; Value: JSONSetElement ( $json ;
    [ "anulaciones[1].tipoDocumento" ; "34" ; JSONString ] ;
    [ "anulaciones[1].ncfDesde" ; "E340000000050" ; JSONString ] ;
    [ "anulaciones[1].ncfHasta" ; "E340000000052" ; JSONString ]
) ]
```

---

## Funciones Personalizadas

### Función 1: Validar Formato NCF

```fmscript
# Función Personalizada: ValidarNCF ( ncf )
# Retorna: 1 si es válido, 0 si no

Let ( [
    ~longitud = Length ( ncf ) ;
    ~primeraLetra = Left ( ncf ; 1 ) ;
    ~tipo = Middle ( ncf ; 2 ; 2 ) ;
    ~secuencia = Right ( ncf ; 8 ) ;
    ~tiposValidos = "31,32,33,34,41,43,44,45,46,47"
] ;

    # Validaciones
    ~longitud = 11 and
    ~primeraLetra = "E" and
    PatternCount ( ~tiposValidos ; ~tipo ) > 0 and
    IsValid ( GetAsNumber ( ~secuencia ) )
)
```

### Función 2: Construir JSON de Anulación

```fmscript
# Función Personalizada: ConstruirJSONAnulacion ( rnc ; tipo ; desde ; hasta )

Let ( [
    ~json =
        "{" &
        "\"rnc\":\"" & rnc & "\"," &
        "\"anulaciones\":[{" &
        "\"tipoDocumento\":\"" & tipo & "\"," &
        "\"ncfDesde\":\"" & desde & "\"," &
        "\"ncfHasta\":\"" & hasta & "\"" &
        "}]}"
] ;
    ~json
)
```

### Función 3: Formatear Fecha para API

```fmscript
# Función Personalizada: FormatearFechaAPI ( fecha ; hora )
# Formato requerido: DD-MM-YYYY HH:mm:ss

Let ( [
    ~dia = Right ( "0" & Day ( fecha ) ; 2 ) ;
    ~mes = Right ( "0" & Month ( fecha ) ; 2 ) ;
    ~anio = Year ( fecha ) ;
    ~horas = Right ( "0" & Hour ( hora ) ; 2 ) ;
    ~minutos = Right ( "0" & Minute ( hora ) ; 2 ) ;
    ~segundos = Right ( "0" & Seconds ( hora ) ; 2 )
] ;
    ~dia & "-" & ~mes & "-" & ~anio & " " & ~horas & ":" & ~minutos & ":" & ~segundos
)
```

---

## Mejores Prácticas

### 1. Seguridad del Token

```fmscript
# ❌ MAL: Guardar token en campo normal
Set Field [ Comprobantes::Token ; $token ]

# ✅ BIEN: Guardar en variable global (no se guarda en disco)
Set Variable [ $$tokenJWT ; Value: $token ]
```

### 2. Logging de Operaciones

```fmscript
# Crear tabla de log
Tabla: Log_Anulaciones
├── id_log
├── fecha_hora
├── usuario
├── rnc
├── ncf_desde
├── ncf_hasta
├── resultado (éxito/error)
├── mensaje
└── json_completo

# En el script, después de la anulación:
Set Variable [ $nuevoLog ; Value: True ]
Go to Layout [ "Log_Anulaciones" ]
New Record/Request
Set Field [ Log_Anulaciones::fecha_hora ; Get ( CurrentTimeStamp ) ]
Set Field [ Log_Anulaciones::usuario ; Get ( AccountName ) ]
Set Field [ Log_Anulaciones::json_completo ; $$resultado ]
# ... etc
Commit Records/Requests
```

### 3. Confirmación del Usuario

```fmscript
# Siempre confirmar antes de anular
Show Custom Dialog [ "⚠️ Confirmar Anulación" ;
    "Esta acción es IRREVERSIBLE." & ¶ & ¶ &
    "¿Está completamente seguro que desea anular estos comprobantes?"
]

If [ Get ( LastMessageChoice ) = 2 ]
    Exit Script [ Text Result: "cancelado" ]
End If
```

### 4. Manejo de Timeouts

```fmscript
# Agregar timeout a la petición (30 segundos)
Set Variable [ $curlOptions ; Value:
    "-X POST" &
    " -H \"Authorization: Bearer " & $token & "\"" &
    " -H \"Content-Type: application/json\"" &
    " --connect-timeout 30" &
    " --max-time 30" &
    " --data '" & $json & "'"
]
```

### 5. Validación Pre-Envío

```fmscript
# Validar datos antes de enviar
Set Variable [ $errores ; Value: "" ]

If [ IsEmpty ( $rnc ) ]
    Set Variable [ $errores ; Value: $errores & "- RNC es obligatorio" & ¶ ]
End If

If [ Length ( $ncfDesde ) ≠ 11 ]
    Set Variable [ $errores ; Value: $errores & "- NCF Desde debe tener 11 caracteres" & ¶ ]
End If

If [ not IsEmpty ( $errores ) ]
    Show Custom Dialog [ "Errores de Validación" ; $errores ]
    Exit Script
End If
```

---

## Resumen de Flujo

```
1. Usuario selecciona registro(s) a anular
   ↓
2. Script valida datos localmente
   ↓
3. Usuario confirma la anulación
   ↓
4. Script construye JSON
   ↓
5. Script envía petición HTTP POST con token JWT
   ↓
6. Backend valida y procesa
   ↓
7. Script recibe respuesta
   ↓
8. Si éxito: Actualizar registros en FileMaker
   Si error: Mostrar mensaje y registrar en log
```

---

## Troubleshooting

### Problema 1: "Token inválido"

**Solución**: Volver a iniciar sesión para obtener un token nuevo

### Problema 2: "NCF tiene formato inválido"

**Solución**: Verificar que sea exactamente 11 caracteres: E + 2 dígitos tipo + 8 dígitos secuencia

### Problema 3: "Error de conexión"

**Solución**: Verificar URL, conexión a internet y que el servidor esté activo

### Problema 4: JSON mal formado

**Solución**: Usar `$$ultimoJSON` para debug, verificar comillas y formato

---

## Recursos Adicionales

- Ver script completo: `scripts/FileMaker_Script_Anulacion.fmfn`
- Documentación API: `docs/ANULACION_COMPROBANTES.md`
- Ejemplos JSON: `utils/ejemplo-anulacion-comprobantes.json`

---

## Soporte

Para soporte adicional, contactar a: servicios@contrerasrobledo.com.do
