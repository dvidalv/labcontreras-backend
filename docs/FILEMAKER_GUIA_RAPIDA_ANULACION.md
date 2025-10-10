# 🚀 Guía Rápida: Anulación desde FileMaker

> **💡 Importante**: Esta guía usa las **funciones JSON nativas de FileMaker** (`JSONSetElement`, `JSONGetElement`), disponibles desde FileMaker 16. Son **más seguras y limpias** que construir JSON manualmente.

## Lo Esencial en 5 Pasos

### 1️⃣ Tener el Token JWT

```fmscript
# Debe estar guardado en una variable global o campo
Set Variable [ $token ; Value: Globals::gTokenJWT ]
```

### 2️⃣ Construir el JSON

**✅ Forma Recomendada (Funciones JSON de FileMaker):**

```fmscript
# Construir usando JSONSetElement (más limpio y seguro)
Set Variable [ $json ; Value: "{}" ]
Set Variable [ $json ; Value: JSONSetElement ( $json ;
    [ "rnc" ; "130960054" ; JSONString ] ;
    [ "anulaciones[0].tipoDocumento" ; "31" ; JSONString ] ;
    [ "anulaciones[0].ncf" ; "E310000000098" ; JSONString ]
) ]
```

**Forma Alternativa (String manual - no recomendada):**

```fmscript
Set Variable [ $json ; Value:
    "{" &
    "\"rnc\":\"130960054\"," &
    "\"anulaciones\":[{" &
    "\"tipoDocumento\":\"31\"," &
    "\"ncf\":\"E310000000098\"" &
    "}]}"
]
```

### 3️⃣ Preparar la URL y Headers

```fmscript
Set Variable [ $url ; Value: "https://tu-api.com/comprobantes/anular" ]

Set Variable [ $curlOptions ; Value:
    "-X POST" &
    " -H \"Authorization: Bearer " & $token & "\"" &
    " -H \"Content-Type: application/json\"" &
    " --data-binary @$"
]
```

### 4️⃣ Enviar la Petición

```fmscript
Insert from URL [
    With Dialog: Off ;
    Target: $$resultado ;
    $url ;
    cURL options: $curlOptions
]
```

### 5️⃣ Procesar la Respuesta

```fmscript
If [ JSONGetElement ( $$resultado ; "status" ) = "success" ]
    # Actualizar registro
    Set Field [ Comprobantes::Estado ; "ANULADO" ]
    Set Field [ Comprobantes::FechaAnulacion ; Get ( CurrentDate ) ]
    Show Custom Dialog [ "✅ Éxito" ; "NCF anulado correctamente" ]
Else
    # Mostrar error
    Set Variable [ $error ; Value: JSONGetElement ( $$resultado ; "message" ) ]
    Show Custom Dialog [ "❌ Error" ; $error ]
End If
```

---

## 📝 Ejemplo Completo Mínimo

### ✅ Versión Simple: Anular UN solo comprobante (lo más común)

```fmscript
# ========== SCRIPT: Anular UN NCF (Usando Funciones JSON) ==========

# Configuración
Set Variable [ $url ; Value: "https://tu-api.com/comprobantes/anular" ]
Set Variable [ $token ; Value: Globals::gTokenJWT ]

# JSON - Usando funciones nativas de FileMaker (RECOMENDADO)
Set Variable [ $json ; Value: "{}" ]
Set Variable [ $json ; Value: JSONSetElement ( $json ;
    [ "rnc" ; Comprobantes::RNC ; JSONString ] ;
    [ "anulaciones[0].tipoDocumento" ; Comprobantes::TipoDocumento ; JSONString ] ;
    [ "anulaciones[0].ncf" ; Comprobantes::NCF ; JSONString ]
) ]

# Enviar
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

# Procesar
If [ JSONGetElement ( $$resultado ; "status" ) = "success" ]
    Set Field [ Comprobantes::Estado ; "ANULADO" ]
    Show Custom Dialog [ "Éxito" ; "NCF anulado" ]
Else
    Show Custom Dialog [ "Error" ; JSONGetElement ( $$resultado ; "message" ) ]
End If
```

### 📊 Versión para Rango: Anular múltiples comprobantes consecutivos

```fmscript
# ========== SCRIPT: Anular RANGO de NCF (Usando Funciones JSON) ==========

# Configuración
Set Variable [ $url ; Value: "https://tu-api.com/comprobantes/anular" ]
Set Variable [ $token ; Value: Globals::gTokenJWT ]

# JSON - Para anular un rango (usar funciones JSON)
Set Variable [ $json ; Value: "{}" ]
Set Variable [ $json ; Value: JSONSetElement ( $json ;
    [ "rnc" ; Comprobantes::RNC ; JSONString ] ;
    [ "anulaciones[0].tipoDocumento" ; Comprobantes::TipoDocumento ; JSONString ] ;
    [ "anulaciones[0].ncfDesde" ; Comprobantes::NCF_Desde ; JSONString ] ;
    [ "anulaciones[0].ncfHasta" ; Comprobantes::NCF_Hasta ; JSONString ]
) ]

# Enviar (igual que el ejemplo anterior)
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

# Procesar
If [ JSONGetElement ( $$resultado ; "status" ) = "success" ]
    Set Variable [ $cantidad ; Value: JSONGetElement ( $$resultado ; "data.cantidadAnulada" ) ]
    Show Custom Dialog [ "Éxito" ; "Se anularon " & $cantidad & " NCF" ]
Else
    Show Custom Dialog [ "Error" ; JSONGetElement ( $$resultado ; "message" ) ]
End If
```

---

## 🔍 Estructura del JSON

### ✅ Opción A: Un Solo Comprobante (RECOMENDADO - Lo más común)

```json
{
  "rnc": "130960054",
  "anulaciones": [
    {
      "tipoDocumento": "31",
      "ncf": "E310000000098"
    }
  ]
}
```

### Opción A.1: Un Solo Comprobante (forma alternativa)

```json
{
  "rnc": "130960054",
  "anulaciones": [
    {
      "tipoDocumento": "31",
      "ncfDesde": "E310000000098"
    }
  ]
}
```

### Opción B: Un Rango de Comprobantes

```json
{
  "rnc": "130960054",
  "anulaciones": [
    {
      "tipoDocumento": "31",
      "ncfDesde": "E310000000098",
      "ncfHasta": "E310000000099"
    }
  ]
}
```

### Opción B: Múltiples Rangos

```json
{
  "rnc": "130960054",
  "anulaciones": [
    {
      "tipoDocumento": "31",
      "ncfDesde": "E310000000098",
      "ncfHasta": "E310000000099"
    },
    {
      "tipoDocumento": "34",
      "ncfDesde": "E340000000050",
      "ncfHasta": "E340000000052"
    }
  ]
}
```

### Opción C: Con Fecha Específica

```json
{
  "rnc": "130960054",
  "fechaHoraAnulacion": "09-10-2024 14:30:00",
  "anulaciones": [
    {
      "tipoDocumento": "31",
      "ncfDesde": "E310000000098",
      "ncfHasta": "E310000000099"
    }
  ]
}
```

---

## ✅ Respuesta Exitosa

```json
{
  "status": "success",
  "message": "Secuencias anuladas exitosamente",
  "data": {
    "codigo": 0,
    "mensaje": "Secuencias anuladas exitosamente",
    "cantidadAnulada": 2,
    "detalles": [...]
  }
}
```

**Cómo extraer datos:**

```fmscript
Set Variable [ $status ; Value: JSONGetElement ( $$resultado ; "status" ) ]
Set Variable [ $mensaje ; Value: JSONGetElement ( $$resultado ; "message" ) ]
Set Variable [ $cantidad ; Value: JSONGetElement ( $$resultado ; "data.cantidadAnulada" ) ]
```

---

## ❌ Respuesta de Error

```json
{
  "status": "error",
  "message": "NCF Desde tiene formato inválido...",
  "details": {...}
}
```

**Cómo extraer error:**

```fmscript
Set Variable [ $error ; Value: JSONGetElement ( $$resultado ; "message" ) ]
Show Custom Dialog [ "Error" ; $error ]
```

---

## 🛡️ Validaciones Importantes

### Antes de enviar, verifica:

✅ **RNC**: 9 u 11 dígitos  
✅ **Tipo de documento**: 31, 32, 33, 34, 41, 43, 44, 45, 46, 47  
✅ **NCF Desde/Hasta**: Exactamente 11 caracteres (E + tipo + secuencia)  
✅ **NCF Hasta >= NCF Desde**  
✅ **Token JWT**: No vacío y válido

### Ejemplo de validación:

```fmscript
# Validar NCF
If [ Length ( Comprobantes::NCF_Desde ) ≠ 11 ]
    Show Custom Dialog [ "Error" ; "NCF debe tener 11 caracteres" ]
    Exit Script
End If

# Validar token
If [ IsEmpty ( Globals::gTokenJWT ) ]
    Show Custom Dialog [ "Error" ; "Debe iniciar sesión primero" ]
    Exit Script
End If
```

---

## 🔐 Obtener Token JWT (Login)

```fmscript
# ========== SCRIPT: Login ==========

Set Variable [ $urlLogin ; Value: "https://tu-api.com/users/signin" ]

Set Variable [ $jsonLogin ; Value:
    "{" &
    "\"email\":\"" & Globals::gEmail & "\"," &
    "\"password\":\"" & Globals::gPassword & "\"" &
    "}"
]

Insert from URL [
    With Dialog: Off ;
    Target: $$login ;
    $urlLogin ;
    cURL options: "-X POST -H \"Content-Type: application/json\" --data '" & $jsonLogin & "'"
]

# Guardar token
Set Field [ Globals::gTokenJWT ; JSONGetElement ( $$login ; "token" ) ]

If [ IsEmpty ( Globals::gTokenJWT ) ]
    Show Custom Dialog [ "Error" ; "Login falló" ]
Else
    Show Custom Dialog [ "Éxito" ; "Login exitoso" ]
End If
```

---

## 📊 Campos Recomendados en FileMaker

```
Tabla: Comprobantes
├── RNC (texto, 11 caracteres)
├── TipoDocumento (texto, 2 caracteres: "31", "32", etc.)
├── NCF_Desde (texto, 11 caracteres: "E310000000098")
├── NCF_Hasta (texto, 11 caracteres: "E310000000099")
├── Estado (texto: "ACTIVO" | "ANULADO")
├── FechaAnulacion (fecha)
├── UsuarioAnulacion (texto)
└── RespuestaAPI (texto, para guardar JSON completo)

Tabla: Globals
├── gTokenJWT (global, texto)
├── gURLBase (global, texto: "https://tu-api.com")
└── gRNC (global, texto: "130960054")
```

---

## 🚨 Errores Comunes y Soluciones

| Error                         | Causa                                       | Solución                             |
| ----------------------------- | ------------------------------------------- | ------------------------------------ |
| "Token inválido"              | Token expirado o incorrecto                 | Volver a hacer login                 |
| "NCF tiene formato inválido"  | No tiene 11 caracteres o formato incorrecto | Verificar: E + 2 dígitos + 8 dígitos |
| "Error de conexión"           | Sin internet o URL incorrecta               | Verificar conexión y URL             |
| "RNC es obligatorio"          | Campo RNC vacío                             | Verificar que el campo tenga valor   |
| "NCF Hasta debe ser mayor..." | Rango inválido                              | Verificar que Hasta >= Desde         |

---

## 💡 Tips Prácticos

### Tip 1: ¿Por qué usar funciones JSON de FileMaker?

**Ventajas de `JSONSetElement()`:**

✅ **Más seguro**: Escapa automáticamente caracteres especiales  
✅ **Menos errores**: No hay que preocuparse por comillas y comas  
✅ **Más legible**: Código más claro y fácil de mantener  
✅ **Validación automática**: FileMaker valida la estructura  
✅ **Modificable**: Fácil agregar/quitar campos

**Comparación:**

```fmscript
# ❌ Forma manual (propensa a errores)
Set Variable [ $json ; Value:
    "{\"rnc\":\"" & $rnc & "\",\"anulaciones\":[{\"tipoDocumento\":\"" & $tipo & "\"}]}"
]

# ✅ Forma con JSONSetElement (limpia y segura)
Set Variable [ $json ; Value: JSONSetElement ( "{}" ;
    [ "rnc" ; $rnc ; JSONString ] ;
    [ "anulaciones[0].tipoDocumento" ; $tipo ; JSONString ]
) ]
```

### Tip 2: Usar Variables Globales para Debug

```fmscript
# Guardar JSON para revisarlo
Set Variable [ $$ultimoJSON ; Value: $json ]
Set Variable [ $$ultimaRespuesta ; Value: $$resultado ]

# Ver el JSON formateado (más legible)
Set Variable [ $$jsonFormateado ; Value: JSONFormatElements ( $json ) ]

# Luego puedes verlos en el visor de datos o en un campo
```

### Tip 3: Confirmación de Usuario

```fmscript
Show Custom Dialog [ "Confirmar" ;
    "¿Anular NCF del " & Comprobantes::NCF_Desde & " al " & Comprobantes::NCF_Hasta & "?"
]

If [ Get ( LastMessageChoice ) = 2 ]  # Usuario canceló
    Exit Script
End If
```

### Tip 4: Log de Operaciones

```fmscript
# Después de cada anulación, crear registro de log
New Record/Request
Set Field [ Log::Fecha ; Get ( CurrentDate ) ]
Set Field [ Log::Usuario ; Get ( AccountName ) ]
Set Field [ Log::Accion ; "ANULACION" ]
Set Field [ Log::NCF ; Comprobantes::NCF_Desde & " - " & Comprobantes::NCF_Hasta ]
Set Field [ Log::Resultado ; $$resultado ]
Commit Records/Requests
```

---

## 📚 Documentación Completa

- **Guía detallada de integración**: `docs/FILEMAKER_ANULACION_INTEGRACION.md`
- **Comparación JSON Manual vs Nativo**: `docs/FILEMAKER_JSON_COMPARACION.md`
- **Scripts FileMaker**:
  - **Simple (Recomendado)**: `scripts/FileMaker_Script_Anulacion_Simple.fmfn` ⭐
  - **Completo (Rangos)**: `scripts/FileMaker_Script_Anulacion.fmfn`
  - **README**: `scripts/README_SCRIPTS_FILEMAKER.md`
- **Documentación API**: `docs/ANULACION_COMPROBANTES.md`
- **Ejemplos JSON**: `utils/ejemplo-anulacion-comprobantes.json`

---

## 📞 Soporte

**Email**: servicios@contrerasrobledo.com.do  
**Documentación completa**: Ver carpeta `/docs`
