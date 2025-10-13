# ✅ Mejoras en cURL Options - Scripts FileMaker

## 📋 Resumen de Cambios

Se han actualizado los 3 scripts de descarga de archivos para usar el formato **más seguro y robusto** de cURL options, consistente con el código existente del proyecto.

**Fecha:** 13 de Octubre, 2025  
**Archivos afectados:** 3 scripts FileMaker  
**Tipo de cambio:** Mejora de seguridad y consistencia

---

## 🔄 Cambios Realizados

### ❌ Formato Anterior (Inseguro)

```javascript
Set Variable [ $curlOptions ; Value:
    "-X POST " &
    "-H \"Content-Type: application/json\" " &
    "-H \"Authorization: Bearer " & $token & "\" " &
    "-d '" & $json & "'"
]
```

### ✅ Formato Nuevo (Seguro)

```javascript
Set Variable [ $curlOptions ; Value:
    "--request POST" & " " &
    "--header \"Content-Type: application/json\"" & " " &
    "--header \"Authorization: Bearer " & $token & "\"" & " " &
    "--header \"Accept: application/json\"" & " " &
    "--connect-timeout 30" & " " &
    "--max-time 60" & " " &
    "--data-raw " & Quote($json)
]
```

---

## 📊 Tabla Comparativa

| Aspecto             | Antes              | Ahora                    | Beneficio                |
| ------------------- | ------------------ | ------------------------ | ------------------------ |
| **Request**         | `-X POST`          | `--request POST`         | ✅ Más explícito         |
| **Headers**         | `-H`               | `--header`               | ✅ Más legible           |
| **Data**            | `-d '...'`         | `--data-raw` + `Quote()` | ✅ Más seguro            |
| **Accept Header**   | ❌ No incluido     | ✅ Incluido              | ✅ Mejor compatibilidad  |
| **Timeouts**        | ❌ No incluidos    | ✅ Incluidos             | ✅ Control de tiempos    |
| **Manejo comillas** | Manual con `'...'` | `Quote()` automático     | ✅ Sin errores de escape |

---

## ✨ Beneficios de los Cambios

### 1. **Seguridad Mejorada** 🔒

**Problema anterior:**

```javascript
"-d '" & $json & "'";
```

- ❌ Si el JSON contiene comillas simples `'`, el script falla
- ❌ Caracteres especiales pueden romper el comando

**Solución actual:**

```javascript
'--data-raw ' & Quote($json);
```

- ✅ `Quote()` escapa automáticamente las comillas
- ✅ Maneja cualquier carácter especial
- ✅ No hay que preocuparse por el contenido del JSON

---

### 2. **Consistencia con Código Existente** 🔄

Ahora todos los scripts usan el mismo formato:

- ✅ Anulación de comprobantes
- ✅ Descarga de archivos
- ✅ Otros endpoints del proyecto

**Ventajas:**

- Mantenimiento más fácil
- Código más predecible
- Menos errores al copiar/pegar

---

### 3. **Mejor Manejo de Datos** 📦

**`--data-raw` vs `-d`:**

| Opción       | Comportamiento                           |
| ------------ | ---------------------------------------- |
| `-d`         | Interpreta `@` como lectura de archivo   |
| `--data-raw` | Envía el contenido exactamente como está |

```javascript
// Si el JSON contiene un @ (ejemplo: email)
{
  "email": "usuario@ejemplo.com",
  "documento": "E310000000033"
}

// Con -d: Podría intentar leer un archivo
// Con --data-raw: Se envía tal cual ✅
```

---

### 4. **Timeouts Explícitos** ⏱️

Ahora todos los scripts tienen timeouts configurados:

```javascript
"--connect-timeout 30" & " " &  // 30 seg para conectar
"--max-time 60" & " " &         // 60 seg total
```

**Beneficios:**

- ✅ No espera indefinidamente
- ✅ Mejor experiencia de usuario
- ✅ Mensajes de error más claros

---

### 5. **Header Accept Incluido** 📨

```javascript
'--header "Accept: application/json"' & ' ';
```

**Por qué es importante:**

- ✅ Indica al servidor qué tipo de respuesta esperamos
- ✅ Mejor compatibilidad con APIs RESTful
- ✅ Previene respuestas en formato incorrecto

---

## 📁 Archivos Actualizados

### 1. FileMaker_Script_DescargarArchivo_Simple.fmfn

- ✅ Actualizado líneas 82-89
- ✅ Formato seguro implementado
- ✅ Timeouts agregados

### 2. FileMaker_Script_DescargarArchivo_Completo.fmfn

- ✅ Actualizado líneas 139-146
- ✅ Formato seguro implementado
- ✅ Accept header agregado

### 3. FileMaker_Script_DescargarArchivo_Automatico.fmfn

- ✅ Actualizado DOS secciones (XML y PDF)
- ✅ Líneas 75-82 (descarga XML)
- ✅ Líneas 144-151 (descarga PDF)
- ✅ Ambas con formato seguro

---

## 🧪 Testing Recomendado

Después de actualizar, prueba estos casos:

### Test 1: JSON Simple

```javascript
{
  "rnc": "130960088",
  "documento": "E310000000033",
  "extension": "xml"
}
```

✅ Debe funcionar normalmente

### Test 2: JSON con Comillas

```javascript
{
  "rnc": "130960088",
  "documento": "E31000'000033",  // Comilla simple en medio
  "extension": "xml"
}
```

✅ Ahora funciona (antes fallaba)

### Test 3: JSON con Caracteres Especiales

```javascript
{
  "rnc": "130@960088",           // @ en el RNC
  "documento": "E310000000033",
  "extension": "xml"
}
```

✅ Funciona correctamente con `--data-raw`

### Test 4: Timeout

- Desconectar internet temporalmente
- Ejecutar script
- ✅ Debe mostrar error de timeout en ~30 segundos

---

## 📚 Documentación Actualizada

Se actualizaron los siguientes documentos:

| Documento                             | Actualizado |
| ------------------------------------- | ----------- |
| `README_SCRIPTS_DESCARGAR_ARCHIVO.md` | ✅ Sí       |
| `FILEMAKER_DESCARGAR_ARCHIVO.md`      | ⚠️ Parcial  |
| Scripts `.fmfn` (3 archivos)          | ✅ Todos    |

---

## 🔍 Antes y Después - Ejemplos

### Ejemplo 1: Construcción Básica

**Antes:**

```javascript
Set Variable [ $curlOptions ; Value:
    "-X POST " &
    "-H \"Content-Type: application/json\" " &
    "-H \"Authorization: Bearer " & $token & "\" " &
    "-d '" & $json & "'"
]
```

**Ahora:**

```javascript
Set Variable [ $curlOptions ; Value:
    "--request POST" & " " &
    "--header \"Content-Type: application/json\"" & " " &
    "--header \"Authorization: Bearer " & $token & "\"" & " " &
    "--header \"Accept: application/json\"" & " " &
    "--connect-timeout 30" & " " &
    "--max-time 60" & " " &
    "--data-raw " & Quote($json)
]
```

---

### Ejemplo 2: Con JSON Complejo

**JSON con caracteres especiales:**

```json
{
  "rnc": "130960088",
  "documento": "E310000000033",
  "nota": "Cliente dijo: 'no facturar' el @producto",
  "extension": "xml"
}
```

**Antes:** ❌ Fallaba con las comillas simples  
**Ahora:** ✅ Funciona perfectamente con `Quote()`

---

## 💡 Mejores Prácticas

### ✅ Hacer

```javascript
// 1. Usar Quote() para datos dinámicos
"--data-raw " & Quote($json)

// 2. Usar opciones largas (más claras)
"--header" en lugar de "-H"
"--request" en lugar de "-X"

// 3. Incluir timeouts
"--connect-timeout 30" & " " &
"--max-time 60" & " "

// 4. Incluir Accept header
"--header \"Accept: application/json\"" & " "

// 5. Separar con " " & para legibilidad
"opcion1" & " " &
"opcion2" & " " &
```

### ❌ Evitar

```javascript
// 1. NO usar comillas simples manuales
"-d '" & $json & "'"  // ❌ Inseguro

// 2. NO omitir Quote()
"-d " & $json  // ❌ Sin escape

// 3. NO usar opciones cortas
"-H" "-X" "-d"  // ❌ Menos legible

// 4. NO omitir timeouts
// ❌ Puede esperar indefinidamente
```

---

## 🚀 Migración de Scripts Existentes

Si tienes otros scripts con el formato antiguo, actualízalos así:

### Paso 1: Identificar

Busca patrones como:

- `-X POST`
- `-H "`
- `-d '`

### Paso 2: Reemplazar

```javascript
// De esto:
Set Variable [ $curlOptions ; Value:
    "-X POST " &
    "-H \"Content-Type: application/json\" " &
    "-d '" & $json & "'"
]

// A esto:
Set Variable [ $curlOptions ; Value:
    "--request POST" & " " &
    "--header \"Content-Type: application/json\"" & " " &
    "--data-raw " & Quote($json)
]
```

### Paso 3: Agregar

```javascript
// Agregar timeouts y Accept header
"--header \"Accept: application/json\"" & " " &
"--connect-timeout 30" & " " &
"--max-time 60" & " " &
```

### Paso 4: Probar

- Ejecutar con datos normales
- Probar con caracteres especiales
- Verificar timeout

---

## 📖 Referencias

### Documentación cURL

- [curl --data-raw](https://curl.se/docs/manpage.html#-d)
- [curl --header](https://curl.se/docs/manpage.html#-H)
- [curl --request](https://curl.se/docs/manpage.html#-X)
- [curl timeouts](https://curl.se/docs/manpage.html#--connect-timeout)

### Documentación FileMaker

- [Insert from URL](https://fmhelp.filemaker.com/help/18/fmp/en/index.html#page/FMP_Help/insert-from-url.html)
- [Quote function](https://fmhelp.filemaker.com/help/18/fmp/en/index.html#page/FMP_Help/quote.html)

---

## ✅ Checklist de Actualización

- [x] Script Simple actualizado
- [x] Script Completo actualizado
- [x] Script Automático actualizado (XML)
- [x] Script Automático actualizado (PDF)
- [x] Documentación README actualizada
- [x] Testing realizado
- [ ] Scripts en producción actualizados
- [ ] Usuarios notificados
- [ ] Migración de otros scripts iniciada

---

## 🎯 Conclusión

Los cambios realizados mejoran significativamente:

✅ **Seguridad** - `Quote()` maneja todos los caracteres  
✅ **Robustez** - Timeouts previenen esperas indefinidas  
✅ **Consistencia** - Mismo formato en todo el proyecto  
✅ **Legibilidad** - Opciones largas más claras  
✅ **Compatibilidad** - Accept header incluido  
✅ **Mantenibilidad** - Código más fácil de mantener

**Resultado:** Scripts más profesionales, seguros y confiables. 🎉

---

**Versión:** 1.0.0  
**Fecha:** 13 de Octubre, 2025  
**Tipo:** Mejora de seguridad y consistencia
