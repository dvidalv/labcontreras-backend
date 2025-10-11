# Ajustes Importantes - Endpoint de Anulación

## 🔍 Descubrimientos Durante la Implementación

Durante las pruebas reales con TheFactory HKA, identificamos varias diferencias entre la documentación y la implementación real. Este documento resume los ajustes realizados.

---

## 1️⃣ Formato de NCF: 13 Caracteres (No 11)

### ❌ Suposición Inicial

- Formato NCF: E + tipo (2) + secuencia (8) = **11 caracteres**
- Ejemplo: `E3100000098`

### ✅ Realidad del Sistema

- Formato NCF: E + tipo (2) + secuencia (**10**) = **13 caracteres**
- Ejemplo: `E310000000147`

### 🔧 Solución Implementada

**Backend** (`controllers/comprobantes.js`):

```javascript
// Antes: Solo 8 dígitos
const ncfRegex = /^E\d{2}\d{8}$/;

// Ahora: 8-10 dígitos (acepta 11 o 13 caracteres)
const ncfRegex = /^E\d{2}\d{8,10}$/;
```

**Mensajes de error actualizados**:

```javascript
'Debe ser E + tipo (2 dígitos) + secuencia (8-10 dígitos). Ejemplos: E310000000098 o E310000000147';
```

---

## 2️⃣ Código de Respuesta: 100 (No 0)

### ❌ Según Documentación

La documentación de TheFactory indicaba:

```json
{
  "codigo": 0,
  "mensaje": "Secuencias anuladas exitosamente",
  "procesado": false
}
```

### ✅ Respuesta Real

TheFactory realmente retorna:

```json
{
  "codigo": 100,
  "mensaje": "Secuencias anuladas exitosamente",
  "procesado": true,
  "xmlBase64": "PEFORUNGIHhtbG5z..."
}
```

### 🔧 Solución Implementada

**Backend** (`controllers/comprobantes.js`):

```javascript
// Antes: Solo validaba código 0
if (response.data.codigo === 0) {

// Ahora: Valida procesado:true O código 0 O código 100
if (response.data.procesado === true ||
    response.data.codigo === 0 ||
    response.data.codigo === 100) {
```

**Explicación**:

- `procesado: true` es el indicador principal de éxito
- Código `100` indica anulación procesada exitosamente
- Código `0` para compatibilidad con otros endpoints

---

## 3️⃣ XML Firmado en la Respuesta

### 🆕 Campo Adicional Descubierto

TheFactory incluye un campo `xmlBase64` que contiene el **XML firmado digitalmente** de la anulación.

**Ejemplo**:

```json
{
  "xmlBase64": "PEFORUNGIHhtbG5zOnhzaT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS9YTUxTY2hlbWEtaW5zdGFuY2UiIHhzaTpub05hbWVzcGFjZVNjaGVtYUxvY2F0aW9uPSJzY2hlbWEueHNkIj4..."
}
```

### 🔧 Solución Implementada

**Backend**: Ahora retorna el `xmlBase64` en la respuesta:

```javascript
return res.status(httpStatus.OK).json({
  status: 'success',
  data: {
    xmlBase64: response.data.xmlBase64, // ← Nuevo campo
    // ... otros campos
  },
});
```

**FileMaker**: Scripts actualizados para guardar el XML:

```fmscript
Set Variable [ $xmlBase64 ; Value: JSONGetElement ( $$resultado ; "data.xmlBase64" ) ]
Set Field [ Comprobantes::XMLAnulacion ; $xmlBase64 ]
```

**Uso del XML**:

- Auditoría y trazabilidad
- Cumplimiento normativo DGII
- Puede decodificarse para obtener los detalles firmados

---

## 4️⃣ Opciones cURL en FileMaker

### ❌ Forma Incorrecta (no funciona)

```fmscript
" --data-binary @$"
```

### ✅ Forma Correcta

```fmscript
" --data-raw " & Quote ( $json )
```

### 🔧 Por qué es Mejor

| Aspecto        | `--data` + comillas | `--data-raw` + `Quote()` |
| -------------- | ------------------- | ------------------------ |
| URL Encoding   | Sí (rompe JSON)     | No (perfecto) ✅         |
| Manejo de `"`  | Manual              | Automático ✅            |
| Manejo de `'`  | Rompe               | OK ✅                    |
| Función nativa | No                  | Sí (`Quote()`) ✅        |

**Ver más**: `docs/FILEMAKER_CURL_NOTA.md`

---

## 5️⃣ Campos Adicionales en FileMaker

### Campos Nuevos Recomendados

Agrega estos campos a tu tabla de Comprobantes:

```
CodigoDGII      (Número)
XMLAnulacion    (Texto)
```

**CodigoDGII**: Almacena el código de respuesta de DGII

- `100` = Anulación exitosa
- Otros códigos = Errores específicos

**XMLAnulacion**: Almacena el XML firmado en Base64

- Para auditoría
- Para cumplimiento normativo
- Puede decodificarse si es necesario

---

## 📊 Resumen de Cambios

| Aspecto               | Antes              | Ahora                         | Archivo                       |
| --------------------- | ------------------ | ----------------------------- | ----------------------------- |
| **NCF Longitud**      | Solo 11 chars      | 11 o 13 chars                 | `controllers/comprobantes.js` |
| **Código Éxito**      | Solo `0`           | `0`, `100` o `procesado:true` | `controllers/comprobantes.js` |
| **XML en respuesta**  | No manejado        | Guardado y retornado          | Backend + Scripts             |
| **cURL data**         | `--data-binary @$` | `--data-raw " & Quote()`      | Todos los scripts             |
| **Construcción JSON** | String manual      | `JSONSetElement()`            | Todos los scripts             |

---

## ✅ Verificación de Funcionalidad

### Test Realizado

**Request enviado**:

```json
{
  "rnc": "130085765",
  "anulaciones": [
    {
      "tipoDocumento": "32",
      "ncf": "E320000000820"
    }
  ]
}
```

**Response recibida**:

```json
{
  "procesado": true,
  "xmlBase64": "PEFORUNGIHhtbG5z...",
  "codigo": 100,
  "mensaje": "Secuencias anuladas exitosamente"
}
```

**Resultado**: ✅ **Funcionando correctamente**

---

## 📚 Archivos Actualizados

### Backend

- ✅ `controllers/comprobantes.js` - Validación NCF flexible, código 100, xmlBase64
- ✅ `utils/constants.js` - URL de anulación
- ✅ `routes/comprobantes.js` - Ruta `/anular`

### Scripts FileMaker

- ✅ `scripts/FileMaker_Script_Anulacion_Simple.fmfn` - cURL corregido, campos nuevos
- ✅ `scripts/FileMaker_Script_Anulacion.fmfn` - cURL corregido, campos nuevos
- ✅ `scripts/README_SCRIPTS_FILEMAKER.md` - Campos actualizados

### Documentación

- ✅ `docs/ANULACION_COMPROBANTES.md` - Formatos NCF, código 100
- ✅ `docs/FILEMAKER_GUIA_RAPIDA_ANULACION.md` - Campos actualizados
- ✅ `docs/FILEMAKER_ANULACION_INTEGRACION.md` - Campos y ejemplos
- ✅ `docs/FILEMAKER_JSON_COMPARACION.md` - Funciones JSON nativas
- ✅ `docs/FILEMAKER_CURL_NOTA.md` - Explicación cURL correcto
- 🆕 `docs/ANULACION_FORMATOS_EJEMPLOS.md` - Comparación formatos
- 🆕 `docs/ANULACION_AJUSTES_IMPORTANTES.md` - Este documento

### Ejemplos

- ✅ `utils/ejemplo-anulacion-comprobantes.json` - Respuestas actualizadas

---

## 🎯 Lecciones Aprendidas

### 1. Validar con Datos Reales

No confiar solo en la documentación. Probar con el API real para descubrir:

- Códigos de respuesta reales
- Campos adicionales
- Formatos específicos del sistema

### 2. Flexibilidad en Validaciones

```javascript
// ❌ Muy estricto
const ncfRegex = /^E\d{2}\d{8}$/;

// ✅ Flexible
const ncfRegex = /^E\d{2}\d{8,10}$/;
```

### 3. Validación por Múltiples Criterios

```javascript
// ❌ Solo un criterio
if (codigo === 0)

// ✅ Múltiples criterios de éxito
if (procesado === true || codigo === 0 || codigo === 100)
```

### 4. Usar Funciones Nativas

```fmscript
// ❌ String manual
"{\"rnc\":\"" & $rnc & "\"}"

// ✅ Funciones nativas
JSONSetElement ( "{}" ; "rnc" ; $rnc ; JSONString )

// ✅ Quote nativo para cURL
Quote ( $json )
```

---

## 🚀 Estado Final

| Componente        | Estado         | Nota                                  |
| ----------------- | -------------- | ------------------------------------- |
| Backend API       | ✅ Funcionando | Acepta 11 y 13 caracteres, código 100 |
| Scripts FileMaker | ✅ Funcionando | Usan funciones nativas, cURL correcto |
| Documentación     | ✅ Completa    | 8 documentos actualizados             |
| Validaciones      | ✅ Robustas    | Múltiples formatos soportados         |
| Respuestas        | ✅ Completas   | Incluyen xmlBase64 y todos los datos  |

---

## 📞 Campos Críticos para FileMaker

### Mínimos Requeridos

```
✅ RNC
✅ TipoDocumento
✅ NCF (o NCF_Desde/NCF_Hasta)
✅ Estado
```

### Altamente Recomendados

```
✅ FechaAnulacion
✅ HoraAnulacion
✅ UsuarioAnulacion
✅ CodigoDGII (para verificar código 100)
✅ XMLAnulacion (para auditoría DGII)
✅ RespuestaAPI (para debugging)
```

### Opcionales pero Útiles

```
- CantidadAnulada
- UltimoError
- FechaUltimoError
```

---

## 🎓 Próximos Pasos

1. ✅ **El endpoint está funcionando** - Probado con datos reales
2. ✅ **Scripts FileMaker listos** - Usan mejores prácticas
3. ✅ **Documentación completa** - 8 documentos de referencia
4. 📝 **Agregar campos** a tu tabla de FileMaker si aún no existen:
   - `CodigoDGII`
   - `XMLAnulacion`
5. 🧪 **Probar** en ambiente de prueba antes de producción
6. 📋 **Entrenar** usuarios en el uso del script

---

## 📚 Referencias Rápidas

| Documento                                | Para qué sirve                   |
| ---------------------------------------- | -------------------------------- |
| `FILEMAKER_GUIA_RAPIDA_ANULACION.md`     | Referencia rápida, copiar/pegar  |
| `FILEMAKER_ANULACION_INTEGRACION.md`     | Guía completa, casos de uso      |
| `FileMaker_Script_Anulacion_Simple.fmfn` | Script para UN comprobante       |
| `FileMaker_Script_Anulacion.fmfn`        | Script para RANGOS               |
| `FILEMAKER_CURL_NOTA.md`                 | Explicación de cURL en FileMaker |
| `ANULACION_COMPROBANTES.md`              | Documentación API completa       |

---

**Última actualización**: Octubre 11, 2024  
**Estado**: ✅ Completamente funcional y probado
