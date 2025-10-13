# Scripts de FileMaker - Facturación Electrónica

## 📋 Descripción

Esta carpeta contiene scripts de FileMaker listos para usar que integran con los endpoints de facturación electrónica:

- **Anulación** de comprobantes fiscales (NCF)
- **Descarga** de archivos XML y PDF de documentos electrónicos

## 📂 Categorías de Scripts

### 🚫 Scripts de Anulación de Comprobantes

- [Ver documentación completa de Anulación →](#scripts-de-anulación)

### 📥 Scripts de Descarga de Archivos

- [Ver documentación completa de Descarga →](#scripts-de-descarga-de-archivos)

---

## 🚫 Scripts de Anulación

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

## 📥 Scripts de Descarga de Archivos

### 1. `FileMaker_Script_DescargarArchivo_Simple.fmfn` ⭐ RECOMENDADO

**Uso**: Descargar **UN** tipo de archivo (XML o PDF) de un e-NCF.

**Características**:

- ✅ Versión simplificada
- ✅ Descarga XML o PDF (configurable)
- ✅ Guardado automático en campos
- ✅ Ideal para uso manual ocasional

**Campos requeridos**:

- `Facturas::RNC`
- `Facturas::eNCF`
- `Facturas::ArchivoXML_Base64` o `Facturas::ArchivoPDF_Base64`

**Ejemplo de uso**:

```
eNCF: E310000000033
Extensión: xml (o pdf)
```

---

### 2. `FileMaker_Script_DescargarArchivo_Completo.fmfn`

**Uso**: Descargar archivos con interfaz completa y opciones.

**Características**:

- ✅ Permite elegir entre XML o PDF
- ✅ Validaciones exhaustivas
- ✅ Opción de exportar archivo a disco
- ✅ Decodificación automática (FileMaker 19+)
- ✅ Registro en log de actividades
- ✅ Ideal para usuarios finales

**Campos requeridos**:

- `Facturas::RNC`
- `Facturas::eNCF`
- `Facturas::ArchivoXML_Base64`, `Facturas::ArchivoXML`
- `Facturas::ArchivoPDF_Base64`, `Facturas::ArchivoPDF`
- `Facturas::TieneXML`, `Facturas::TienePDF`
- `Facturas::FechaDescargaXML`, `Facturas::FechaDescargaPDF`

**Ejemplo de uso**:

```
1. Usuario elige XML o PDF
2. Archivo se descarga
3. Opcionalmente se exporta a disco
```

---

### 3. `FileMaker_Script_DescargarArchivo_Automatico.fmfn`

**Uso**: Descargar **AMBOS** archivos (XML y PDF) automáticamente.

**Características**:

- ✅ Descarga XML y PDF en un solo script
- ✅ Sin intervención del usuario
- ✅ Ideal para procesos automatizados
- ✅ Retorna resultado detallado
- ✅ Perfecto para llamar después de enviar factura

**Campos requeridos**:

- Mismos campos que el script completo
- `Facturas::DescargasExitosas` (contador)

**Ejemplo de uso**:

```
Perform Script [ "Descargar Archivos Automáticamente" ]
Set Variable [ $resultado ; Value: Get ( ScriptResult ) ]

# Resultado: "success|mensaje|tiempo" o "error|mensaje|tiempo"
```

---

### 📚 Documentación de Descarga de Archivos

- **[README Completo](./README_SCRIPTS_DESCARGAR_ARCHIVO.md)** - Guía rápida de scripts
- **[Guía FileMaker](../docs/FILEMAKER_DESCARGAR_ARCHIVO.md)** - Documentación exhaustiva
- **[Guía API](../docs/DESCARGAR_ARCHIVO_GUIA.md)** - Detalles del endpoint

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
NCF                  (Texto, 11-13 caracteres) - Para script simple
NCF_Desde            (Texto, 11-13 caracteres) - Para script completo
NCF_Hasta            (Texto, 11-13 caracteres) - Para script completo
Estado               (Texto: "ACTIVO", "ANULADO", "CONSUMIDO")
FechaAnulacion       (Fecha)
HoraAnulacion        (Hora)
UsuarioAnulacion     (Texto)
CantidadAnulada      (Número)
CodigoDGII           (Número, código de respuesta: 100=éxito)
XMLAnulacion         (Texto, XML firmado en Base64)
RespuestaAPI         (Texto, JSON completo de respuesta)
UltimoError          (Texto)
FechaUltimoError     (Marca de tiempo)
```

**Formatos NCF soportados**:

- Estándar: 11 caracteres (E + 2 + 8) ej: `E3100000098`
- Extendido: 13 caracteres (E + 2 + 10) ej: `E310000000147`

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

### Anulación de Comprobantes

- **Guía Rápida FileMaker**: `docs/FILEMAKER_GUIA_RAPIDA_ANULACION.md`
- **Guía Completa**: `docs/FILEMAKER_ANULACION_INTEGRACION.md`
- **Comparación JSON**: `docs/FILEMAKER_JSON_COMPARACION.md`
- **API Backend**: `docs/ANULACION_COMPROBANTES.md`

### Descarga de Archivos

- **Guía FileMaker**: `docs/FILEMAKER_DESCARGAR_ARCHIVO.md`
- **README Scripts**: `scripts/README_SCRIPTS_DESCARGAR_ARCHIVO.md`
- **Guía API**: `docs/DESCARGAR_ARCHIVO_GUIA.md`
- **Quick Start**: `docs/DESCARGAR_ARCHIVO_QUICK_START.md`

---

## 📞 Soporte

**Email**: servicios@contrerasrobledo.com.do  
**Documentación**: Ver carpeta `/docs`

---

## 📝 Changelog

### v2.2 (Octubre 2024)

- ✨ **NUEVO**: Scripts de descarga de archivos XML/PDF
- ✨ 3 versiones: Simple, Completo y Automático
- 📥 Descarga desde TheFactoryHKA
- 🔄 Decodificación Base64 automática (FM 19+)
- 📝 Documentación completa FileMaker

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
