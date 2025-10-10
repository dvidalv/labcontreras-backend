# Scripts de FileMaker para Anulación de Comprobantes

## 📋 Descripción

Esta carpeta contiene scripts de FileMaker listos para usar que integran con el endpoint de anulación de comprobantes fiscales (NCF).

## ✅ Scripts Disponibles

### 1. `FileMaker_Script_Anulacion_Simple.fmfn` ⭐ RECOMENDADO

**Uso**: Anular **UN** solo comprobante fiscal (caso más común).

**Características**:

- ✅ Versión simplificada y más corta
- ✅ Usa funciones JSON nativas (`JSONSetElement`, `JSONGetElement`)
- ✅ Menos código = menos errores
- ✅ Ideal para el 90% de los casos

**Campos requeridos**:

- `Comprobantes::RNC`
- `Comprobantes::TipoDocumento`
- `Comprobantes::NCF` (un solo campo)

**Ejemplo de uso**:

```
NCF: E310000000098
```

---

### 2. `FileMaker_Script_Anulacion.fmfn`

**Uso**: Anular **rangos** de comprobantes fiscales.

**Características**:

- ✅ Versión completa con validaciones exhaustivas
- ✅ Usa funciones JSON nativas
- ✅ Soporta anulación de rangos
- ✅ Más validaciones y confirmaciones

**Campos requeridos**:

- `Comprobantes::RNC`
- `Comprobantes::TipoDocumento`
- `Comprobantes::NCF_Desde`
- `Comprobantes::NCF_Hasta`

**Ejemplo de uso**:

```
NCF Desde: E310000000098
NCF Hasta: E310000000105
```

---

## 🔧 Requisitos

### FileMaker

- **Versión mínima**: FileMaker 16 (para funciones JSON nativas)
- **Recomendado**: FileMaker 18 o superior

### Backend

- Endpoint activo: `/comprobantes/anular`
- Token JWT válido guardado en `Globals::gTokenJWT`
- URL base guardada en `Globals::gURLBase`

### Campos en FileMaker

**Tabla: Comprobantes**

```
RNC                  (Texto, 9-11 caracteres)
TipoDocumento        (Texto, 2 caracteres: "31", "32", etc.)
NCF                  (Texto, 11 caracteres) - Para script simple
NCF_Desde            (Texto, 11 caracteres) - Para script completo
NCF_Hasta            (Texto, 11 caracteres) - Para script completo
Estado               (Texto: "ACTIVO", "ANULADO")
FechaAnulacion       (Fecha)
HoraAnulacion        (Hora)
UsuarioAnulacion     (Texto)
CantidadAnulada      (Número)
RespuestaAPI         (Texto, para JSON completo)
UltimoError          (Texto)
FechaUltimoError     (Marca de tiempo)
```

**Tabla: Globals**

```
gTokenJWT            (Global, Texto)
gURLBase             (Global, Texto: "https://tu-api.com")
gRNC                 (Global, Texto: "130960054")
```

---

## 🚀 Instalación

### Paso 1: Copiar el Script

1. Abre el archivo `.fmfn` en un editor de texto
2. Copia todo el contenido
3. En FileMaker, ve a **Scripts → Administrar Scripts**
4. Crea un nuevo script
5. Pega el contenido
6. Guarda el script

### Paso 2: Configurar Variables Globales

En FileMaker, crea estos campos globales:

```fmscript
# En la tabla "Globals" o como variables globales
Globals::gURLBase = "https://tu-api.com"
Globals::gTokenJWT = "[obtenido del login]"
Globals::gRNC = "130960054"
```

### Paso 3: Ajustar Referencias a Campos

**Importante**: Ajusta las referencias a campos según tu base de datos:

- Si tu tabla se llama diferente, cambia `Comprobantes::` por `TuTabla::`
- Si tus campos tienen nombres diferentes, actualízalos en el script

---

## 📖 Cómo Usar

### Opción 1: Script Simple (Recomendado)

```fmscript
# 1. El usuario está en un registro con:
Comprobantes::NCF = "E310000000098"
Comprobantes::TipoDocumento = "31"
Comprobantes::RNC = "130960054"

# 2. Ejecutar script
Perform Script [ "Anular UN Comprobante" ]

# 3. El script:
# - Confirma con el usuario
# - Envía la anulación
# - Actualiza el registro
# - Muestra resultado
```

### Opción 2: Script Completo (Para Rangos)

```fmscript
# 1. El usuario está en un registro con:
Comprobantes::NCF_Desde = "E310000000098"
Comprobantes::NCF_Hasta = "E310000000105"
Comprobantes::TipoDocumento = "31"
Comprobantes::RNC = "130960054"

# 2. Ejecutar script
Perform Script [ "Anular Rango de Comprobantes" ]

# 3. El script anula del 098 al 105 (8 comprobantes)
```

---

## 🔍 Debugging

Ambos scripts guardan variables globales para debugging:

```fmscript
# Ver el JSON enviado
$$ultimoJSON

# Ver el JSON formateado (más legible)
$$ultimoJSONFormateado

# Ver la respuesta completa de la API
$$resultado

# Ver el JSON de anulación
$$resultadoAnulacion
```

**Cómo ver estas variables**:

1. Ve a **Herramientas → Visor de Datos**
2. Pestaña "Actual"
3. Busca las variables que comienzan con `$$`

---

## ⚠️ Validaciones Incluidas

Ambos scripts validan:

✅ Token JWT presente  
✅ Campos requeridos no vacíos  
✅ Longitud del RNC (9 u 11 dígitos)  
✅ Formato NCF (11 caracteres, comienza con 'E')  
✅ Confirmación del usuario

**El script completo también valida**:
✅ Rango válido (Hasta >= Desde)  
✅ Formato de ambos NCF

---

## 📊 Flujo del Script

```
┌─────────────────────────┐
│ Inicio del Script       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Validar Token JWT       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Obtener Datos           │
│ del Registro            │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Validar Datos           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Confirmar con Usuario   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Construir JSON          │
│ (JSONSetElement)        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Enviar a Backend        │
│ (Insert from URL)       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Procesar Respuesta      │
│ (JSONGetElement)        │
└───────────┬─────────────┘
            │
       ┌────┴────┐
       ▼         ▼
  ┌────────┐  ┌────────┐
  │ Éxito  │  │ Error  │
  └────────┘  └────────┘
       │         │
       ▼         ▼
  ┌──────────────────────┐
  │ Actualizar Registro  │
  │ Mostrar Mensaje      │
  └──────────────────────┘
```

---

## 🎯 Casos de Uso

### Caso 1: Cliente Canceló una Factura

```
Usuario: Selecciona registro con NCF = E310000000098
Acción: Ejecutar script simple
Resultado: Factura anulada en DGII vía TheFactory
```

### Caso 2: Error en Numeración

```
Usuario: Necesita anular del E310000005000 al E310000005009
Acción: Ejecutar script completo
Resultado: 10 facturas anuladas en un solo envío
```

### Caso 3: Anular Múltiples NO Consecutivos

```
Usuario: Tiene 5 facturas NO consecutivas para anular
Acción: Ejecutar script simple 5 veces (una por factura)
Alternativa: Modificar script para loop sobre registros seleccionados
```

---

## 🛠️ Personalización

### Agregar Campos Personalizados

Si necesitas campos adicionales, agrégalos en la construcción del JSON:

```fmscript
# Ejemplo: Agregar campo de motivo
Set Variable [ $json ; Value: JSONSetElement ( $json ;
    [ "rnc" ; $rnc ; JSONString ] ;
    [ "anulaciones[0].tipoDocumento" ; $tipoDocumento ; JSONString ] ;
    [ "anulaciones[0].ncf" ; $ncf ; JSONString ] ;
    [ "motivo" ; Comprobantes::MotivoAnulacion ; JSONString ]  ← Nuevo campo
) ]
```

### Cambiar Confirmación

Para cambiar el diálogo de confirmación:

```fmscript
# Ubicación en el script: PASO 4 (script completo) o sección CONFIRMACIÓN (script simple)
Show Custom Dialog [ "Tu Título" ; "Tu mensaje personalizado" ]
```

### Logging Personalizado

Agregar después de la respuesta exitosa:

```fmscript
# Crear registro de log
New Record/Request
Set Field [ Log::Fecha ; Get ( CurrentDate ) ]
Set Field [ Log::Usuario ; Get ( AccountName ) ]
Set Field [ Log::NCF ; $ncf ]
Set Field [ Log::Resultado ; $$resultado ]
Commit Records/Requests
```

---

## ❓ Preguntas Frecuentes

### ¿Qué script debo usar?

- **90% de casos**: Usa el script **simple** (anular un NCF a la vez)
- **Rangos grandes**: Usa el script **completo** (anular del 001 al 100)

### ¿Funciona en FileMaker Go (iPad/iPhone)?

Sí, ambos scripts funcionan en FileMaker Go 16 o superior.

### ¿Puedo anular múltiples NCF NO consecutivos?

Con el script actual, ejecuta el script simple múltiples veces. O modifica el script completo para agregar más elementos al array.

### ¿Qué pasa si mi internet falla?

El script detecta errores de conexión y muestra un mensaje apropiado. No se actualiza el registro en FileMaker.

### ¿Se puede deshacer una anulación?

**NO**. La anulación en DGII es irreversible. Por eso el script pide confirmación.

---

## 📚 Documentación Relacionada

- **Guía Rápida FileMaker**: `docs/FILEMAKER_GUIA_RAPIDA_ANULACION.md`
- **Guía Completa**: `docs/FILEMAKER_ANULACION_INTEGRACION.md`
- **Comparación JSON**: `docs/FILEMAKER_JSON_COMPARACION.md`
- **API Backend**: `docs/ANULACION_COMPROBANTES.md`

---

## 📞 Soporte

**Email**: servicios@contrerasrobledo.com.do  
**Documentación**: Ver carpeta `/docs`

---

## 📝 Changelog

### v2.0 (Octubre 2024)

- ✨ Migración a funciones JSON nativas
- ✨ Nuevo script simple para un solo NCF
- 📝 Documentación mejorada
- 🐛 Mejor manejo de errores

### v1.0 (Octubre 2024)

- 🚀 Primera versión
- 📊 Construcción manual de JSON

---

## ✅ Checklist de Instalación

- [ ] FileMaker 16 o superior instalado
- [ ] Script copiado y guardado en FileMaker
- [ ] Variables globales configuradas (`gURLBase`, `gTokenJWT`)
- [ ] Campos de base de datos creados
- [ ] Nombres de campos ajustados si es necesario
- [ ] Script probado con un NCF de prueba
- [ ] Debugging verificado (variables `$$` visibles)
- [ ] Usuario entrenado en uso del script

---

**¡Listo para usar!** 🚀
