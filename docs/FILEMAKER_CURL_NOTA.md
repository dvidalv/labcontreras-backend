# Nota Importante: cURL en FileMaker

## ❌ Error Común: `--data-binary @$`

### Problema

Es común ver en ejemplos de cURL el uso de `@$` para pasar datos, pero esto **NO funciona en FileMaker**.

```fmscript
# ❌ INCORRECTO - No funciona en FileMaker
Set Variable [ $curlOptions ; Value:
    "-X POST" &
    " -H \"Content-Type: application/json\"" &
    " --data-binary @$"
]
```

### ¿Por qué no funciona?

En **cURL de línea de comandos**, `@filename` lee datos desde un archivo:

```bash
# En terminal (fuera de FileMaker)
curl -X POST --data @archivo.json https://api.com
```

Y `@-` lee desde stdin. Pero **FileMaker no interpreta `@$` de esta manera**.

---

## ✅ Solución Correcta en FileMaker

En FileMaker, tienes **DOS opciones correctas**:

### Opción 1: Usar `--data-raw` + `Quote()` (RECOMENDADO para JSON)

```fmscript
# ✅ MEJOR para JSON - Usa función Quote() de FileMaker
Set Variable [ $curlOptions ; Value:
    "--header \"Content-Type: application/json\"" & " " &
    "--data-raw " & Quote ( $json )
]
```

**Ventajas**:

- ✅ `--data-raw` NO hace URL encoding (perfecto para JSON)
- ✅ `Quote()` es una función nativa que escapa correctamente
- ✅ Maneja caracteres especiales automáticamente

### Opción 2: Usar `--data` con comillas simples

```fmscript
# ✅ También funciona
Set Variable [ $curlOptions ; Value:
    "-X POST" &
    " -H \"Content-Type: application/json\"" &
    " --data '" & $json & "'"
]
```

**Limitaciones**:

- ⚠️ `--data` hace URL encoding de algunos caracteres
- ⚠️ Puede fallar si el JSON contiene comillas simples

### Explicación de la Opción 1 (Recomendada)

1. `"--data-raw "` - Parámetro que envía datos sin encoding
2. `& Quote ( $json )` - La función `Quote()` escapa comillas dobles
3. FileMaker maneja el resto automáticamente

**Resultado final**: `--data-raw "{\"rnc\":\"130960054\",\"anulaciones\":[...]}"`

---

## 📊 Comparación Completa

| Sintaxis                          | Terminal/cURL        | FileMaker          | Para JSON               |
| --------------------------------- | -------------------- | ------------------ | ----------------------- |
| `--data @archivo.json`            | ✅ Lee desde archivo | ❌ No funciona     | N/A                     |
| `--data @$`                       | ❌ No válido         | ❌ No funciona     | ❌                      |
| `--data '{"key":"value"}'`        | ✅ Funciona          | ⚠️ Estático        | ⚠️ Solo valores fijos   |
| `--data '" & $json & "'`          | ❌ No válido         | ✅ Funciona        | ⚠️ Puede fallar con `'` |
| **`--data-raw " & Quote($json)`** | ✅ Funciona          | ✅ **RECOMENDADO** | ✅ **MEJOR OPCIÓN**     |

### Detalles de Cada Opción

| Opción                        | URL Encoding              | Manejo de `"`        | Manejo de `'` | Recomendado |
| ----------------------------- | ------------------------- | -------------------- | ------------- | ----------- |
| `--data '" & $json & "'`      | ✅ Sí (puede romper JSON) | ✅ OK                | ❌ Rompe      | No          |
| `--data-raw " & Quote($json)` | ✅ No (perfecto)          | ✅ Escapa automático | ✅ OK         | **Sí** ✅   |

---

## 🎯 Ejemplos Correctos

### Ejemplo 1: JSON Simple (Método Recomendado)

```fmscript
# Construir JSON
Set Variable [ $json ; Value: "{\"rnc\":\"130960054\"}" ]

# Opciones cURL CORRECTAS (usando Quote)
Set Variable [ $curlOptions ; Value:
    "--header \"Content-Type: application/json\"" & " " &
    "--data-raw " & Quote ( $json )
]

# Enviar
Insert from URL [
    With Dialog: Off ;
    Target: $$resultado ;
    $url ;
    cURL options: $curlOptions
]
```

### Ejemplo 2: Con Funciones JSON (Método Recomendado)

```fmscript
# Construir JSON con JSONSetElement
Set Variable [ $json ; Value: "{}" ]
Set Variable [ $json ; Value: JSONSetElement ( $json ;
    [ "rnc" ; "130960054" ; JSONString ] ;
    [ "anulaciones[0].tipoDocumento" ; "31" ; JSONString ] ;
    [ "anulaciones[0].ncf" ; "E310000000098" ; JSONString ]
) ]

# Opciones cURL CORRECTAS (usando --data-raw y Quote)
Set Variable [ $curlOptions ; Value:
    "--header \"Authorization: Bearer " & $token & "\"" & " " &
    "--header \"Content-Type: application/json\"" & " " &
    "--data-raw " & Quote ( $json )
]

# Enviar
Insert from URL [
    With Dialog: Off ;
    Target: $$resultado ;
    $url ;
    cURL options: $curlOptions
]
```

### Ejemplo 3: Con Headers Completos y Timeouts

```fmscript
Set Variable [ $curlOptions ; Value:
    "--header \"Authorization: Bearer " & $token & "\"" & " " &
    "--header \"Content-Type: application/json\"" & " " &
    "--header \"Accept: application/json\"" & " " &
    "--connect-timeout 30" & " " &
    "--max-time 60" & " " &
    "--data-raw " & Quote ( $json )  # ← MEJOR método para JSON
]
```

---

## ⚠️ Casos Especiales

### JSON con Comillas Simples o Dobles

**Con `Quote()`** (recomendado), no te preocupes por esto:

```fmscript
# JSON con comillas simples o dobles
Set Variable [ $json ; Value: "{\"nombre\":\"O'Brien\",\"frase\":\"Dijo \\\"hola\\\"\"}" ]

# Quote() maneja todo automáticamente ✅
Set Variable [ $curlOptions ; Value:
    "--data-raw " & Quote ( $json )
]
```

**Sin `Quote()`** (no recomendado), tienes que manejarlo manualmente:

```fmscript
# JSON con comillas simples
Set Variable [ $json ; Value: "{\"nombre\":\"O'Brien\"}" ]

# ⚠️ Esto ROMPE si usas comillas simples:
# " --data '" & $json & "'"  ❌ FALLA

# Tendrías que escapar manualmente (complicado):
Set Variable [ $curlOptions ; Value:
    "-X POST" &
    " --data " & Quote ( $json )  # ← Mejor usar Quote() siempre
]
```

### JSON Muy Largo

Para JSON muy largos (varios KB), el mismo método funciona perfectamente:

```fmscript
# JSON largo construido con JSONSetElement
Set Variable [ $json ; Value: "{}" ]

# Agregar muchos elementos...
Set Variable [ $json ; Value: JSONSetElement ( $json ;
    [ "rnc" ; "130960054" ; JSONString ] ;
    [ "anulaciones[0].tipoDocumento" ; "31" ; JSONString ] ;
    # ... más campos ...
    [ "anulaciones[99].ncf" ; "E310000099999" ; JSONString ]
) ]

# Quote() maneja JSON grandes sin problema ✅
Set Variable [ $curlOptions ; Value:
    "--data-raw " & Quote ( $json )
]
```

FileMaker maneja strings de hasta **2GB**, así que no hay problema con JSON grandes.

---

## 🔍 Debugging

### Ver el cURL Command Completo

Para debugging, puedes ver el comando cURL completo que se está enviando:

```fmscript
# Construir el comando completo
Set Variable [ $comandoCompleto ; Value:
    "curl " & $curlOptions & " " & $url
]

# Guardarlo en variable global para ver en el visor de datos
Set Variable [ $$debugCurlCommand ; Value: $comandoCompleto ]

# Ver en un diálogo (para debugging)
Show Custom Dialog [ "cURL Command" ; $comandoCompleto ]
```

### Verificar el JSON antes de Enviar

```fmscript
# Ver JSON formateado
Set Variable [ $$debugJSON ; Value: JSONFormatElements ( $json ) ]

# Verificar que sea JSON válido
If [ JSONGetElement ( $json ; "$" ) = "?" ]
    Show Custom Dialog [ "Error" ; "JSON inválido" ]
    Exit Script
End If
```

---

## 📚 Documentación Oficial

- **FileMaker Insert from URL**: [Claris Help](https://help.claris.com/en/pro-help/content/insert-from-url.html)
- **cURL Documentation**: [curl.se](https://curl.se/docs/manual.html)

---

## ✅ Checklist de Corrección

Si estás migrando código que usaba `--data-binary @$`:

- [ ] Buscar todas las instancias de `--data-binary @$`
- [ ] Buscar todas las instancias de `--data @$`
- [ ] Reemplazar con `" --data '" & $json & "'"`
- [ ] Verificar que la variable `$json` existe antes del cURL
- [ ] Probar con un caso de prueba
- [ ] Verificar que el JSON se envía correctamente

---

## 🎓 Resumen

| Lo que **NO** funciona | Lo que **SÍ** funciona    | Mejor Opción                     |
| ---------------------- | ------------------------- | -------------------------------- |
| `--data @$`            | `--data '" & $json & "'"` | `--data-raw " & Quote($json)` ✅ |
| `--data-binary @$`     | `--data '" & $json & "'"` | `--data-raw " & Quote($json)` ✅ |
| `--data @archivo`      | `--data '" & $json & "'"` | `--data-raw " & Quote($json)` ✅ |

**Reglas simples**:

1. ✅ **MEJOR**: Usa `--data-raw` + `Quote()` para JSON
2. ⚠️ **También funciona**: `--data` con comillas simples (pero puede fallar)
3. ❌ **NUNCA uses**: `@$` o `@archivo` (no funciona en FileMaker)

---

**Última actualización**: Octubre 2024
