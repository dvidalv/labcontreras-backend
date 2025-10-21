# 🔄 Flujo del Código de Modificación (Tipo 33/34)

## 📍 **Ruta Completa del Código de Modificación**

Este documento explica exactamente cómo viaja el `CodigoModificacion` desde FileMaker hasta TheFactoryHKA.

---

## 🚀 **Flujo Paso a Paso:**

### **1️⃣ FileMaker (Origen)**

📍 **Ubicación:** `scripts/FileMaker_Script_Tipo33_NotaDebito.fmfn` línea 92

```javascript
# Usuario ingresa en FileMaker:
Facturas::CodigoModificacion = "05"  // ← String con 2 dígitos

# Script construye JSON:
Set Variable [ $json ; Value: JSONSetElement (
    $json ;
    "modificacion.CodigoModificacion" ;
    Facturas::CodigoModificacion ;    // "05"
    JSONString
) ]
```

**JSON enviado a la API:**

```json
{
  "modificacion": {
    "CodigoModificacion": "05", // ← Con cero inicial
    "NCFModificado": "E310000000098",
    "FechaNCFModificado": "10-09-2025",
    "RazonModificacion": "Cargos adicionales..."
  }
}
```

---

### **2️⃣ API Node.js - Recepción**

📍 **Ubicación:** `controllers/comprobantes.js` líneas 1109-1128

```javascript
const transformarFacturaParaTheFactory = (facturaSimple, token) => {
  const {
    comprador,
    emisor,
    factura,
    items,
    ItemsDevueltos,
    modificacion,  // ← AQUÍ SE RECIBE desde FileMaker
    descuentos,
    DescuentosORecargos,
  } = facturaSimple;

  // modificacion = {
  //   CodigoModificacion: "05",
  //   NCFModificado: "E310000000098",
  //   FechaNCFModificado: "10-09-2025",
  //   RazonModificacion: "..."
  // }
```

---

### **3️⃣ API Node.js - Transformación**

📍 **Ubicación:** `controllers/comprobantes.js` líneas 1135-1160

```javascript
// 🔧 ADAPTACIÓN PARA TIPOS 33 Y 34: Mapear estructura específica de FileMaker
if ((factura?.tipo === '33' || factura?.tipo === '34') && modificacion) {
  console.log(
    `🔧 Adaptando estructura de tipo ${factura.tipo} desde FileMaker...`,
  );

  // Mapear campos de modificacion a factura (PascalCase → camelCase)
  facturaAdaptada = {
    ...facturaAdaptada,
    ncfModificado: modificacion.NCFModificado,
    fechaNCFModificado: modificacion.FechaNCFModificado,

    // ⚠️ AQUÍ SE TRANSFORMA EL CÓDIGO:
    codigoModificacion:
      modificacion.CodigoModificacion?.replace(/^0+/, '') || // "05" → "5"
      modificacion.CodigoModificacion, // Si no tiene ceros, dejar igual

    razonModificacion: modificacion.RazonModificacion,
  };

  console.log(`📋 Campos de modificación mapeados para tipo ${factura.tipo}:`, {
    ncfModificado: facturaAdaptada.ncfModificado,
    fechaNCFModificado: facturaAdaptada.fechaNCFModificado,
    codigoModificacion: facturaAdaptada.codigoModificacion, // "5" (sin cero)
    razonModificacion: facturaAdaptada.razonModificacion,
  });
}
```

**🔍 Explicación de la transformación:**

```javascript
// Expresión regular: /^0+/
// ^ = inicio del string
// 0+ = uno o más ceros
// .replace(/^0+/, '') = reemplazar ceros iniciales con string vacío

"01" → "1"   // Se remueve el cero inicial
"05" → "5"   // Se remueve el cero inicial
"06" → "6"   // Se remueve el cero inicial
"1"  → "1"   // No tiene ceros iniciales, queda igual
```

---

### **4️⃣ API Node.js - Validación**

📍 **Ubicación:** `controllers/comprobantes.js` líneas 2078-2112

```javascript
// Para tipos 33 y 34: Agregar InformacionReferencia OBLIGATORIA (con validación)
...((facturaAdaptada.tipo === '33' || facturaAdaptada.tipo === '34') &&
  (() => {
    // ✅ VALIDACIONES OBLIGATORIAS:

    if (!facturaAdaptada.ncfModificado) {
      throw new Error(
        `❌ Tipo ${facturaAdaptada.tipo} requiere "ncfModificado": NCF de la factura original`,
      );
    }

    if (!facturaAdaptada.fechaNCFModificado) {
      throw new Error(
        `❌ Tipo ${facturaAdaptada.tipo} requiere "fechaNCFModificado": Fecha de la factura original`,
      );
    }

    // ⚠️ VALIDACIÓN DEL CÓDIGO DE MODIFICACIÓN:
    if (!facturaAdaptada.codigoModificacion) {
      throw new Error(
        `❌ Tipo ${facturaAdaptada.tipo} requiere "codigoModificacion": Código que indica el tipo de modificación (1,2,3,4,5,6)`,
      );
    }

    if (!facturaAdaptada.razonModificacion) {
      throw new Error(
        `❌ Tipo ${facturaAdaptada.tipo} requiere "razonModificacion": Razón descriptiva`,
      );
    }

    // ✅ SI PASA TODAS LAS VALIDACIONES, SE CONSTRUYE InformacionReferencia:
    return {
      InformacionReferencia: {
        NCFModificado: facturaAdaptada.ncfModificado,
        FechaNCFModificado: formatearFecha(
          facturaAdaptada.fechaNCFModificado,
        ),
        CodigoModificacion: facturaAdaptada.codigoModificacion,  // "5" (ya sin cero)
        RazonModificacion: facturaAdaptada.razonModificacion,
      },
    };
  })()),
```

---

### **5️⃣ Envío a TheFactoryHKA**

📍 **Ubicación:** `controllers/comprobantes.js` líneas 2102-2116

**JSON enviado a TheFactoryHKA:**

```json
{
  "Token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "DocumentoElectronico": {
    "Encabezado": {
      "IdentificacionDocumento": { ... },
      "Emisor": { ... },
      "comprador": { ... },
      "Totales": { ... }
    },
    "DetallesItems": [ ... ],
    "InformacionReferencia": {
      "NCFModificado": "E310000000098",
      "FechaNCFModificado": "10-09-2025",
      "CodigoModificacion": "5",  // ← AQUÍ VA SIN CERO INICIAL
      "RazonModificacion": "Cargos adicionales no incluidos..."
    }
  }
}
```

---

## 📊 **Diagrama del Flujo:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1️⃣ FILEMAKER                                                    │
├─────────────────────────────────────────────────────────────────┤
│ Campo: Facturas::CodigoModificacion = "05"                      │
│ ↓                                                               │
│ Script: JSONSetElement()                                        │
│ ↓                                                               │
│ JSON: { "modificacion": { "CodigoModificacion": "05" } }       │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP POST
                         │ /comprobantes/enviar-electronica
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2️⃣ NODE.JS API - RECEPCIÓN                                      │
├─────────────────────────────────────────────────────────────────┤
│ controllers/comprobantes.js:1125                                │
│ const { modificacion } = facturaSimple                          │
│ ↓                                                               │
│ modificacion.CodigoModificacion = "05"                          │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3️⃣ NODE.JS API - TRANSFORMACIÓN                                 │
├─────────────────────────────────────────────────────────────────┤
│ controllers/comprobantes.js:1145-1147                           │
│ codigoModificacion:                                             │
│   modificacion.CodigoModificacion?.replace(/^0+/, '')           │
│ ↓                                                               │
│ "05" → "5"  (se remueven ceros iniciales)                       │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4️⃣ NODE.JS API - VALIDACIÓN                                     │
├─────────────────────────────────────────────────────────────────┤
│ controllers/comprobantes.js:2091-2095                           │
│ if (!facturaAdaptada.codigoModificacion) {                      │
│   throw new Error("❌ Tipo 33 requiere codigoModificacion")     │
│ }                                                               │
│ ✅ Validación exitosa                                           │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5️⃣ NODE.JS API - CONSTRUCCIÓN PAYLOAD                           │
├─────────────────────────────────────────────────────────────────┤
│ controllers/comprobantes.js:2102-2112                           │
│ InformacionReferencia: {                                        │
│   NCFModificado: "E310000000098",                               │
│   FechaNCFModificado: "10-09-2025",                             │
│   CodigoModificacion: "5",  ← SIN CERO                          │
│   RazonModificacion: "..."                                      │
│ }                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP POST
                         │ https://demoemision.thefactoryhka.com.do/api/Enviar
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6️⃣ THEFACTORY HKA                                               │
├─────────────────────────────────────────────────────────────────┤
│ Recibe: CodigoModificacion = "5"                                │
│ ↓                                                               │
│ Procesa y envía a DGII                                          │
│ ↓                                                               │
│ Responde: { codigo: 0, mensaje: "Documento procesado..." }     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 **Ejemplos de Transformación:**

| Desde FileMaker | Procesado en Node.js | Enviado a TheFactory | Descripción                   |
| --------------- | -------------------- | -------------------- | ----------------------------- |
| `"01"`          | `"1"`                | `"1"`                | Texto incorrecto              |
| `"02"`          | `"2"`                | `"2"`                | Valor incorrecto              |
| `"03"`          | `"3"`                | `"3"`                | Fecha incorrecta              |
| `"04"`          | `"4"`                | `"4"`                | Referencia a otros documentos |
| `"05"`          | `"5"`                | `"5"`                | Otros cargos adicionales      |
| `"06"`          | `"6"`                | `"6"`                | Ajuste de precio              |
| `"1"`           | `"1"`                | `"1"`                | Sin cambio (ya sin cero)      |

---

## ⚠️ **Puntos Importantes:**

### **1. ¿Por qué se remueven los ceros iniciales?**

TheFactoryHKA y DGII esperan los códigos **sin ceros iniciales** (`"1"`, `"2"`, etc.), no con formato de dos dígitos (`"01"`, `"02"`).

### **2. ¿Qué pasa si FileMaker envía sin ceros?**

```javascript
// Si FileMaker envía "5" en lugar de "05":
codigoModificacion: modificacion.CodigoModificacion?.replace(/^0+/, '') ||
  modificacion.CodigoModificacion;

// "5".replace(/^0+/, '') = "5"  (no hay ceros, queda igual)
// Resultado: "5" ✅
```

### **3. ¿El backend valida el rango (1-6)?**

**NO.** El backend solo valida que:

- ✅ El campo `codigoModificacion` **no esté vacío**
- ✅ Sea de tipo **string**

La validación del rango **debe hacerse en FileMaker** antes de enviar.

### **4. ¿Dónde se loggea la transformación?**

```javascript
console.log(`📋 Campos de modificación mapeados para tipo ${factura.tipo}:`, {
  codigoModificacion: facturaAdaptada.codigoModificacion, // Aquí se muestra
});
```

Esto aparece en los logs de Vercel/servidor cuando se envía la factura.

---

## 🐛 **Debugging:**

### **Ver el código en los logs:**

1. Enviar factura desde FileMaker
2. Revisar respuesta de la API
3. Buscar en logs: `"Campos de modificación mapeados"`

### **Errores comunes:**

| Error                                 | Causa                        | Solución                                               |
| ------------------------------------- | ---------------------------- | ------------------------------------------------------ |
| `requiere "codigoModificacion"`       | Campo vacío en FileMaker     | Validar que `Facturas::CodigoModificacion` tenga valor |
| `Cannot read properties of undefined` | Falta sección `modificacion` | Asegurar que el JSON incluya `modificacion: {...}`     |
| Código 613 de DGII                    | Código inválido para el tipo | Verificar que sea 1-6 y apropiado para el tipo         |

---

## ✅ **Checklist de Validación:**

Antes de enviar desde FileMaker:

- [ ] `CodigoModificacion` tiene valor (no vacío)
- [ ] Está en el rango "01" a "06"
- [ ] Es apropiado para el tipo de modificación
- [ ] Coincide con la `RazonModificacion`

---

**Última actualización:** Octubre 2025  
**Archivo relacionado:** `controllers/comprobantes.js` líneas 1145-1147, 2091-2112
