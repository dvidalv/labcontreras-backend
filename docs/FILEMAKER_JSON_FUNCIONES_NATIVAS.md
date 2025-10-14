# 🚀 FileMaker: Funciones JSON Nativas vs Concatenación

## 🎯 **¿Por qué usar funciones JSON nativas?**

### **❌ Método Anterior (Concatenación de Strings):**

```javascript
Set Variable [ $json ; Value:
    "{\"nombre\": \"" & Cliente::Nombre & "\", \"precio\": \"" & Precio & "\"}"
]
```

### **✅ Método Mejorado (Funciones JSON Nativas):**

```javascript
Set Variable [ $json ; Value: "{}" ]
Set Variable [ $json ; Value: JSONSetElement ( $json ; "nombre" ; Cliente::Nombre ; JSONString ) ]
Set Variable [ $json ; Value: JSONSetElement ( $json ; "precio" ; Precio ; JSONString ) ]
```

## 🔍 **Comparación Detallada:**

| Aspecto                   | **Concatenación**              | **Funciones JSON**            |
| ------------------------- | ------------------------------ | ----------------------------- |
| **Escape de caracteres**  | ❌ Manual y propenso a errores | ✅ **Automático**             |
| **Comillas en datos**     | ❌ Rompe el JSON               | ✅ **Maneja automáticamente** |
| **Caracteres especiales** | ❌ Problemático                | ✅ **Escape automático**      |
| **Validación**            | ❌ No hay validación           | ✅ **Validación integrada**   |
| **Legibilidad**           | ❌ Difícil de leer             | ✅ **Muy legible**            |
| **Mantenimiento**         | ❌ Difícil modificar           | ✅ **Fácil modificar**        |
| **Debugging**             | ❌ Complejo debuggear          | ✅ **Fácil debuggear**        |
| **Tipos de datos**        | ❌ Todo es string              | ✅ **Tipos específicos**      |

## 🛡️ **Problemas que resuelve:**

### **1. Escape de Comillas:**

```javascript
# ❌ PROBLEMÁTICO:
Set Variable [ $nombre ; Value: "Juan \"El Rápido\" Pérez" ]
Set Variable [ $json ; Value: "{\"nombre\": \"" & $nombre & "\"}" ]
# Resultado: {"nombre": "Juan "El Rápido" Pérez"} ← JSON INVÁLIDO

# ✅ SEGURO:
Set Variable [ $json ; Value: JSONSetElement ( "{}" ; "nombre" ; $nombre ; JSONString ) ]
# Resultado: {"nombre": "Juan \"El Rápido\" Pérez"} ← JSON VÁLIDO
```

### **2. Saltos de Línea:**

```javascript
# ❌ PROBLEMÁTICO:
Set Variable [ $direccion ; Value: "Calle Principal¶Santo Domingo" ]
Set Variable [ $json ; Value: "{\"direccion\": \"" & $direccion & "\"}" ]
# Resultado: JSON INVÁLIDO (salto de línea sin escape)

# ✅ SEGURO:
Set Variable [ $json ; Value: JSONSetElement ( "{}" ; "direccion" ; $direccion ; JSONString ) ]
# Resultado: {"direccion": "Calle Principal\nSanto Domingo"} ← JSON VÁLIDO
```

### **3. Caracteres Unicode:**

```javascript
# ❌ PROBLEMÁTICO:
Set Variable [ $nombre ; Value: "José María Ñoño" ]
# Puede causar problemas de encoding

# ✅ SEGURO:
Set Variable [ $json ; Value: JSONSetElement ( "{}" ; "nombre" ; $nombre ; JSONString ) ]
# Maneja correctamente caracteres especiales
```

## 📋 **Funciones JSON Principales:**

### **1. JSONSetElement - Crear/Modificar:**

```javascript
# Sintaxis:
JSONSetElement ( json ; keyOrIndexOrPath ; value ; type )

# Ejemplos:
Set Variable [ $json ; Value: JSONSetElement ( "{}" ; "nombre" ; "Juan" ; JSONString ) ]
Set Variable [ $json ; Value: JSONSetElement ( $json ; "edad" ; 30 ; JSONNumber ) ]
Set Variable [ $json ; Value: JSONSetElement ( $json ; "activo" ; 1 ; JSONBoolean ) ]
Set Variable [ $json ; Value: JSONSetElement ( $json ; "items[0]" ; "Item 1" ; JSONString ) ]
```

### **2. JSONGetElement - Leer:**

```javascript
# Extraer valores del JSON de respuesta:
Set Variable [ $codigo ; Value: JSONGetElement ( $respuesta ; "data.codigoSeguridad" ) ]
Set Variable [ $ncf ; Value: JSONGetElement ( $respuesta ; "data.ncfGenerado" ) ]
Set Variable [ $status ; Value: JSONGetElement ( $respuesta ; "status" ) ]
```

### **3. JSONFormatElements - Validar:**

```javascript
# Validar que el JSON es correcto:
Set Variable [ $jsonValido ; Value: JSONFormatElements ( $json ) ]
If [ IsEmpty($jsonValido) ]
    # JSON inválido
    Show Custom Dialog [ "Error" ; "JSON malformado" ]
End If
```

### **4. JSONListKeys - Explorar:**

```javascript
# Listar todas las claves del JSON:
Set Variable [ $claves ; Value: JSONListKeys ( $respuesta ; "" ) ]
```

## 🎯 **Tipos de Datos JSON:**

| Tipo FileMaker  | Descripción | Ejemplo          |
| --------------- | ----------- | ---------------- |
| **JSONString**  | Texto       | `"Hola Mundo"`   |
| **JSONNumber**  | Número      | `123.45`         |
| **JSONBoolean** | Booleano    | `true` / `false` |
| **JSONNull**    | Nulo        | `null`           |
| **JSONObject**  | Objeto      | `{}`             |
| **JSONArray**   | Array       | `[]`             |

## 🚀 **Script Mejorado - Ejemplo Completo:**

```javascript
# ====== CONSTRUCCIÓN JSON ROBUSTA ======
Set Variable [ $json ; Value: "{}" ]

# Datos obligatorios
Set Variable [ $json ; Value: JSONSetElement ( $json ; "comprador.rnc" ; Clientes::RNC ; JSONString ) ]
Set Variable [ $json ; Value: JSONSetElement ( $json ; "comprador.nombre" ; Clientes::Nombre ; JSONString ) ]

# Datos opcionales (solo si no están vacíos)
If [ Not IsEmpty(Clientes::Email) ]
    Set Variable [ $json ; Value: JSONSetElement ( $json ; "comprador.correo" ; Clientes::Email ; JSONString ) ]
End If

# Arrays dinámicos
Set Variable [ $i ; Value: 0 ]
Loop
    Exit Loop If [ $i ≥ Get(FoundCount) ]
    Set Variable [ $json ; Value: JSONSetElement ( $json ; "items[" & $i & "].nombre" ; Items::Nombre ; JSONString ) ]
    Set Variable [ $json ; Value: JSONSetElement ( $json ; "items[" & $i & "].precio" ; Items::Precio ; JSONNumber ) ]
    Set Variable [ $i ; Value: $i + 1 ]
    Go to Record/Request/Page [ Next ; Exit after last: On ]
End Loop

# Validación final
Set Variable [ $jsonValido ; Value: JSONFormatElements ( $json ) ]
If [ IsEmpty($jsonValido) ]
    Show Custom Dialog [ "Error" ; "JSON inválido generado" ]
    Exit Script [ Text Result: "ERROR" ]
End If
```

## 🔧 **Mejores Prácticas:**

### **1. Siempre validar:**

```javascript
Set Variable [ $jsonValido ; Value: JSONFormatElements ( $json ) ]
If [ IsEmpty($jsonValido) ]
    # Manejar error
End If
```

### **2. Usar tipos apropiados:**

```javascript
# ✅ CORRECTO:
Set Variable [ $json ; Value: JSONSetElement ( $json ; "precio" ; 100.50 ; JSONNumber ) ]
Set Variable [ $json ; Value: JSONSetElement ( $json ; "activo" ; 1 ; JSONBoolean ) ]

# ❌ INCORRECTO:
Set Variable [ $json ; Value: JSONSetElement ( $json ; "precio" ; "100.50" ; JSONString ) ]
```

### **3. Manejar campos opcionales:**

```javascript
# Solo agregar si tiene valor
If [ Not IsEmpty(Campo::Opcional) ]
    Set Variable [ $json ; Value: JSONSetElement ( $json ; "opcional" ; Campo::Opcional ; JSONString ) ]
End If
```

### **4. Debug durante desarrollo:**

```javascript
# Mostrar JSON generado (comentar en producción)
# Show Custom Dialog [ "DEBUG JSON" ; JSONFormatElements ( $json ) ]
```

## ✅ **Ventajas del Método Mejorado:**

1. **🛡️ Seguridad:** Escape automático de caracteres especiales
2. **🔍 Validación:** Detección automática de JSON malformado
3. **📝 Legibilidad:** Código más claro y mantenible
4. **🚀 Robustez:** Manejo correcto de todos los tipos de datos
5. **🔧 Flexibilidad:** Fácil agregar/quitar campos
6. **🐛 Debugging:** Mejor capacidad de depuración
7. **📊 Tipos:** Soporte nativo para números, booleanos, null

## 🎉 **Resultado:**

JSON **perfecto, válido y robusto** que funciona correctamente con cualquier API REST moderna.
