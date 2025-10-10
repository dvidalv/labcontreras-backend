# FileMaker: Construcción de JSON - Comparación

## ❌ Forma Manual (No Recomendada)

### Ejemplo: Anular un comprobante

```fmscript
# Construir JSON concatenando strings
Set Variable [ $json ; Value:
    "{" &
    "\"rnc\":\"" & Comprobantes::RNC & "\"," &
    "\"anulaciones\":[{" &
    "\"tipoDocumento\":\"" & Comprobantes::TipoDocumento & "\"," &
    "\"ncf\":\"" & Comprobantes::NCF & "\"" &
    "}]}"
]
```

### Problemas:

❌ **Comillas escapadas**: Difícil de leer `\"`  
❌ **Comas**: Fácil olvidar o poner de más  
❌ **Caracteres especiales**: Si el campo contiene `"` o `\`, rompe el JSON  
❌ **Mantenimiento**: Difícil agregar/quitar campos  
❌ **Debugging**: Complicado encontrar errores  
❌ **Validación**: No hay validación automática

### Ejemplo de Error Común:

```fmscript
# Si Comprobantes::RNC contiene comillas o caracteres especiales, esto FALLA:
Set Variable [ $rnc ; Value: "130"960"054" ]  # RNC con comillas
Set Variable [ $json ; Value: "{\"rnc\":\"" & $rnc & "\"}" ]
# Resultado: {"rnc":"130"960"054"}  ← JSON INVÁLIDO!
```

---

## ✅ Funciones JSON Nativas (RECOMENDADO)

### Mismo ejemplo con `JSONSetElement`:

```fmscript
# Construir JSON con funciones nativas
Set Variable [ $json ; Value: "{}" ]
Set Variable [ $json ; Value: JSONSetElement ( $json ;
    [ "rnc" ; Comprobantes::RNC ; JSONString ] ;
    [ "anulaciones[0].tipoDocumento" ; Comprobantes::TipoDocumento ; JSONString ] ;
    [ "anulaciones[0].ncf" ; Comprobantes::NCF ; JSONString ]
) ]
```

### Ventajas:

✅ **Sin comillas escapadas**: Código más limpio  
✅ **Sin preocuparse por comas**: FileMaker las maneja  
✅ **Escapa automáticamente**: Caracteres especiales se manejan correctamente  
✅ **Fácil mantenimiento**: Agregar campos es simple  
✅ **Debugging sencillo**: Usa `JSONFormatElements()` para ver el resultado  
✅ **Validación automática**: FileMaker valida la sintaxis

### El mismo error NO ocurre:

```fmscript
# Aunque Comprobantes::RNC contenga comillas, JSONSetElement lo escapa:
Set Variable [ $rnc ; Value: "130\"960\"054" ]
Set Variable [ $json ; Value: JSONSetElement ( "{}" ; "rnc" ; $rnc ; JSONString ) ]
# Resultado: {"rnc":"130\"960\"054"}  ← JSON VÁLIDO! ✅
```

---

## 📊 Comparación Lado a Lado

| Aspecto                 | Manual | JSONSetElement |
| ----------------------- | ------ | -------------- |
| **Legibilidad**         | ⭐⭐   | ⭐⭐⭐⭐⭐     |
| **Seguridad**           | ⭐     | ⭐⭐⭐⭐⭐     |
| **Mantenimiento**       | ⭐⭐   | ⭐⭐⭐⭐⭐     |
| **Menos errores**       | ⭐     | ⭐⭐⭐⭐⭐     |
| **Debugging**           | ⭐⭐   | ⭐⭐⭐⭐⭐     |
| **Validación**          | ❌     | ✅             |
| **Escaping automático** | ❌     | ✅             |

---

## 🎯 Casos de Uso Comparados

### Caso 1: Un Solo Comprobante

#### Manual:

```fmscript
Set Variable [ $json ; Value:
    "{\"rnc\":\"" & $rnc & "\",\"anulaciones\":[{\"tipoDocumento\":\"" & $tipo & "\",\"ncf\":\"" & $ncf & "\"}]}"
]
```

#### Con funciones JSON:

```fmscript
Set Variable [ $json ; Value: "{}" ]
Set Variable [ $json ; Value: JSONSetElement ( $json ;
    [ "rnc" ; $rnc ; JSONString ] ;
    [ "anulaciones[0].tipoDocumento" ; $tipo ; JSONString ] ;
    [ "anulaciones[0].ncf" ; $ncf ; JSONString ]
) ]
```

**Ganador**: JSONSetElement (más legible)

---

### Caso 2: Con Fecha Opcional

#### Manual:

```fmscript
If [ IsEmpty ( $fecha ) ]
    Set Variable [ $json ; Value:
        "{\"rnc\":\"" & $rnc & "\",\"anulaciones\":[{\"tipoDocumento\":\"" & $tipo & "\",\"ncf\":\"" & $ncf & "\"}]}"
    ]
Else
    Set Variable [ $json ; Value:
        "{\"rnc\":\"" & $rnc & "\",\"fechaHoraAnulacion\":\"" & $fecha & "\",\"anulaciones\":[{\"tipoDocumento\":\"" & $tipo & "\",\"ncf\":\"" & $ncf & "\"}]}"
    ]
End If
```

#### Con funciones JSON:

```fmscript
Set Variable [ $json ; Value: "{}" ]
Set Variable [ $json ; Value: JSONSetElement ( $json ;
    [ "rnc" ; $rnc ; JSONString ] ;
    [ "anulaciones[0].tipoDocumento" ; $tipo ; JSONString ] ;
    [ "anulaciones[0].ncf" ; $ncf ; JSONString ]
) ]

# Agregar fecha solo si existe
If [ not IsEmpty ( $fecha ) ]
    Set Variable [ $json ; Value: JSONSetElement ( $json ;
        "fechaHoraAnulacion" ; $fecha ; JSONString
    ) ]
End If
```

**Ganador**: JSONSetElement (mucho más limpio y DRY)

---

### Caso 3: Múltiples Anulaciones

#### Manual:

```fmscript
Set Variable [ $json ; Value:
    "{\"rnc\":\"" & $rnc & "\",\"anulaciones\":[" &
    "{\"tipoDocumento\":\"31\",\"ncf\":\"E310000000098\"}," &
    "{\"tipoDocumento\":\"34\",\"ncf\":\"E340000000050\"}" &
    "]}"
]
```

#### Con funciones JSON:

```fmscript
Set Variable [ $json ; Value: "{}" ]
Set Variable [ $json ; Value: JSONSetElement ( $json ;
    [ "rnc" ; $rnc ; JSONString ] ;
    [ "anulaciones[0].tipoDocumento" ; "31" ; JSONString ] ;
    [ "anulaciones[0].ncf" ; "E310000000098" ; JSONString ] ;
    [ "anulaciones[1].tipoDocumento" ; "34" ; JSONString ] ;
    [ "anulaciones[1].ncf" ; "E340000000050" ; JSONString ]
) ]
```

**Ganador**: JSONSetElement (escalable y mantenible)

---

## 🛠️ Funciones JSON Útiles

### 1. JSONSetElement

Crea o modifica JSON.

```fmscript
JSONSetElement ( json ; keyOrPath ; value ; type )
```

**Tipos:**

- `JSONString` - Texto
- `JSONNumber` - Número
- `JSONBoolean` - Booleano
- `JSONObject` - Objeto {}
- `JSONArray` - Array []

### 2. JSONGetElement

Extrae valores del JSON.

```fmscript
# Extraer campo simple
JSONGetElement ( $json ; "rnc" )

# Extraer de array
JSONGetElement ( $json ; "anulaciones[0].ncf" )

# Extraer anidado
JSONGetElement ( $json ; "data.cantidadAnulada" )
```

### 3. JSONFormatElements

Formatea JSON para debugging.

```fmscript
# JSON compacto
{"rnc":"130960054","anulaciones":[{"ncf":"E310000000098"}]}

# Después de JSONFormatElements:
{
  "rnc": "130960054",
  "anulaciones": [
    {
      "ncf": "E310000000098"
    }
  ]
}
```

### 4. JSONListKeys

Lista todas las claves en el JSON.

```fmscript
JSONListKeys ( $json ; "anulaciones[0]" )
# Resultado: tipoDocumento¶ncf
```

### 5. JSONListValues

Lista todos los valores en un array.

```fmscript
JSONListValues ( $json ; "anulaciones" )
# Lista todos los objetos del array
```

---

## 💡 Tips y Mejores Prácticas

### Tip 1: Inicializar Siempre con "{}"

```fmscript
# ✅ BIEN
Set Variable [ $json ; Value: "{}" ]
Set Variable [ $json ; Value: JSONSetElement ( $json ; "rnc" ; $rnc ; JSONString ) ]

# ❌ MAL (puede fallar)
Set Variable [ $json ; Value: "" ]
Set Variable [ $json ; Value: JSONSetElement ( $json ; "rnc" ; $rnc ; JSONString ) ]
```

### Tip 2: Usar el Visor de Datos

```fmscript
# Durante desarrollo, guardar en variable global para ver en el visor
Set Variable [ $$debugJSON ; Value: JSONFormatElements ( $json ) ]
```

### Tip 3: Validar JSON Antes de Enviar

```fmscript
# Verificar que el JSON es válido
If [ JSONGetElement ( $json ; "rnc" ) = "?" ]
    Show Custom Dialog [ "Error" ; "JSON inválido" ]
    Exit Script
End If
```

### Tip 4: Arrays Dinámicos con Loop

```fmscript
# Agregar múltiples items en un loop
Set Variable [ $json ; Value: "{}" ]
Set Variable [ $contador ; Value: 0 ]

Go to Record/Request/Page [ First ]
Loop
    Set Variable [ $json ; Value: JSONSetElement ( $json ;
        [ "anulaciones[" & $contador & "].tipoDocumento" ; Comprobantes::TipoDocumento ; JSONString ] ;
        [ "anulaciones[" & $contador & "].ncf" ; Comprobantes::NCF ; JSONString ]
    ) ]

    Set Variable [ $contador ; Value: $contador + 1 ]
    Go to Record/Request/Page [ Next ; Exit after last: On ]
End Loop
```

---

## 🎓 Recursos de Aprendizaje

### Documentación Oficial FileMaker

- [JSONSetElement](https://help.claris.com/en/pro-help/content/jsonseteleme.html)
- [JSONGetElement](https://help.claris.com/en/pro-help/content/jsongetelement.html)
- [JSONFormatElements](https://help.claris.com/en/pro-help/content/jsonformatelements.html)

### En Este Proyecto

- **Guía Rápida**: `docs/FILEMAKER_GUIA_RAPIDA_ANULACION.md`
- **Guía Completa**: `docs/FILEMAKER_ANULACION_INTEGRACION.md`
- **Ejemplos**: `docs/ANULACION_FORMATOS_EJEMPLOS.md`

---

## ✅ Conclusión

**Para cualquier proyecto FileMaker moderno (16+):**

1. ✅ **USA** `JSONSetElement` y `JSONGetElement`
2. ❌ **EVITA** construir JSON con strings manuales
3. 🔍 **USA** `JSONFormatElements` para debugging
4. 📚 **APRENDE** las funciones JSON nativas de FileMaker

**Resultado:** Código más limpio, seguro y mantenible.
