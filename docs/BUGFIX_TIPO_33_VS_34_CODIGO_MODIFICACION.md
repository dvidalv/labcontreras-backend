# 🐛 CORRECCIÓN FINAL: Tipo 33 y 34 Usan Formatos Diferentes para CodigoModificacion

## 📋 **Descubrimiento Importante**

**Fecha:** 25-10-2025  
**Tipo:** Diferencia de Formato entre Tipos

### **El Problema Real:**

Después de corregir los 3 bugs anteriores, TheFactoryHKA rechazaba con error específico:

```json
{
  "errors": {
    "DocumentoElectronico.InformacionReferencia.CodigoModificacion": [
      "0102|El campo no cumple con el formato correcto"
    ]
  }
}
```

---

## 🔍 **La Diferencia Crítica**

### **Tipo 33 (Nota de Débito)** vs **Tipo 34 (Nota de Crédito)**

| Aspecto                   | Tipo 33 (Nota de Débito)                 | Tipo 34 (Nota de Crédito)      |
| ------------------------- | ---------------------------------------- | ------------------------------ |
| **CodigoModificacion**    | `"6"` (sin ceros)                        | `"06"` (con ceros)             |
| **Formato TheFactoryHKA** | **Número** (string numérico sin padding) | **String** (con cero inicial)  |
| **Ejemplo**               | `"1"`, `"2"`, `"3"`, `"6"`               | `"01"`, `"02"`, `"03"`, `"06"` |

### **¿Por qué esta diferencia?**

TheFactoryHKA y la DGII tienen **esquemas de validación diferentes** para Tipo 33 y Tipo 34:

- **Tipo 33:** El campo se valida como **tipo numérico** → requiere `"6"` sin ceros
- **Tipo 34:** El campo se valida como **string de catálogo** → requiere `"06"` con ceros

---

## ✅ **Solución Implementada**

### **Código Corregido:**

```javascript
// Mapear campos de modificacion a factura (PascalCase → camelCase)
facturaAdaptada = {
  ...facturaAdaptada,
  ncfModificado: modificacion.NCFModificado,
  fechaNCFModificado: modificacion.FechaNCFModificado,

  // ⚠️ DIFERENCIA CRÍTICA: Tipo 33 requiere código sin ceros, Tipo 34 con ceros
  codigoModificacion:
    factura.tipo === '33'
      ? modificacion.CodigoModificacion?.replace(/^0+/, '') ||
        modificacion.CodigoModificacion // Tipo 33: remover ceros ("06" → "6")
      : modificacion.CodigoModificacion, // Tipo 34: preservar ceros ("06" → "06")

  razonModificacion: modificacion.RazonModificacion,
};
```

**Ubicación:** `controllers/comprobantes.js`, líneas 1193-1203

**Lógica:**

1. **Si es Tipo 33:** Remover ceros iniciales con `replace(/^0+/, '')`
2. **Si es Tipo 34:** Preservar el código tal cual (con ceros)

---

## 📊 **Tabla de Transformación**

### **Para Tipo 33 (Nota de Débito):**

| FileMaker Envía | Backend Transforma | TheFactoryHKA Recibe |
| --------------- | ------------------ | -------------------- |
| `"01"`          | → `"1"`            | ✅ `"1"`             |
| `"02"`          | → `"2"`            | ✅ `"2"`             |
| `"03"`          | → `"3"`            | ✅ `"3"`             |
| `"04"`          | → `"4"`            | ✅ `"4"`             |
| `"05"`          | → `"5"`            | ✅ `"5"`             |
| `"06"`          | → `"6"`            | ✅ `"6"`             |

### **Para Tipo 34 (Nota de Crédito):**

| FileMaker Envía | Backend Transforma | TheFactoryHKA Recibe |
| --------------- | ------------------ | -------------------- |
| `"01"`          | → `"01"`           | ✅ `"01"`            |
| `"02"`          | → `"02"`           | ✅ `"02"`            |
| `"03"`          | → `"03"`           | ✅ `"03"`            |
| `"04"`          | → `"04"`           | ✅ `"04"`            |

---

## 🧪 **Ejemplos de JSON Enviado**

### **Ejemplo 1: Tipo 33 (Nota de Débito) - CORRECTO**

**FileMaker envía:**

```json
{
  "factura": { "tipo": "33" },
  "modificacion": {
    "CodigoModificacion": "06"
  }
}
```

**Backend transforma a:**

```json
{
  "InformacionReferencia": {
    "CodigoModificacion": "6" // ✅ Sin cero inicial
  }
}
```

**Resultado TheFactoryHKA:** ✅ APROBADO

---

### **Ejemplo 2: Tipo 34 (Nota de Crédito) - CORRECTO**

**FileMaker envía:**

```json
{
  "factura": { "tipo": "34" },
  "modificacion": {
    "CodigoModificacion": "03"
  }
}
```

**Backend transforma a:**

```json
{
  "InformacionReferencia": {
    "CodigoModificacion": "03" // ✅ Con cero inicial
  }
}
```

**Resultado TheFactoryHKA:** ✅ APROBADO

---

## 📝 **Documentación para FileMaker**

### **Importante:**

Desde FileMaker, **SIEMPRE enviar el código con 2 dígitos** (con cero inicial):

```filemaker
Set Variable [ $codigoModificacion ; Value: "06" ]  // ✅ Siempre con 2 dígitos
```

**El backend se encarga de transformarlo según el tipo:**

- **Tipo 33:** Removerá el cero automáticamente → `"6"`
- **Tipo 34:** Lo enviará tal cual → `"06"`

---

## 🔄 **Cronología de Bugs**

| Bug    | Problema                                        | Solución Original                   | Corrección Final               |
| ------ | ----------------------------------------------- | ----------------------------------- | ------------------------------ |
| **#1** | Código perdía cero inicial para TODOS los tipos | Preservar ceros para todos          | ⚠️ **PARCIALMENTE INCORRECTO** |
| **#2** | Tipo 33 usaba `TipoIngresos: "01"`              | Cambiar a `TipoIngresos: "03"`      | ✅ CORRECTO                    |
| **#3** | Tipo 33 incluía `FechaVencimientoSecuencia`     | Remover el campo                    | ✅ CORRECTO                    |
| **#4** | **Tipo 33 rechaza código con ceros**            | **Remover ceros SOLO para Tipo 33** | ✅ **SOLUCIÓN FINAL**          |

---

## ✅ **Resumen Final de Configuración**

### **Tipo 33 (Nota de Débito):**

```json
{
  "IdentificacionDocumento": {
    "TipoDocumento": "33",
    "NCF": "E330000000043",
    // ❌ NO incluir FechaVencimientoSecuencia
    "TipoIngresos": "03",  // ✅ Específico para Tipo 33
    "TablaFormasPago": [...]
  },
  "InformacionReferencia": {
    "NCFModificado": "E310000000174",
    "FechaNCFModificado": "09-07-2025",
    "CodigoModificacion": "6",  // ✅ SIN cero inicial
    "RazonModificacion": "Otros cargos adicionales"
  }
}
```

### **Tipo 34 (Nota de Crédito):**

```json
{
  "IdentificacionDocumento": {
    "TipoDocumento": "34",
    "NCF": "E340000000XXX",
    // ❌ NO incluir FechaVencimientoSecuencia
    "IndicadorNotaCredito": "0",
    "TipoIngresos": "01",
    "TipoPago": "1"
  },
  "InformacionReferencia": {
    "NCFModificado": "E310000000XXX",
    "FechaNCFModificado": "DD-MM-YYYY",
    "CodigoModificacion": "03", // ✅ CON cero inicial
    "RazonModificacion": "Corrección de errores"
  }
}
```

---

## 🚀 **Estado Final**

| Componente                          | Estado         | Notas                                |
| ----------------------------------- | -------------- | ------------------------------------ |
| Tipo 33 - CodigoModificacion        | ✅ CORREGIDO   | Remover ceros iniciales              |
| Tipo 34 - CodigoModificacion        | ✅ CORRECTO    | Preservar ceros iniciales            |
| Tipo 33 - TipoIngresos              | ✅ CORRECTO    | `"03"`                               |
| Tipo 33 - FechaVencimientoSecuencia | ✅ CORRECTO    | No incluir                           |
| Documentación                       | ✅ ACTUALIZADA | Diferencia Tipo 33 vs 34 documentada |

---

## 📞 **Contacto**

Si tienes preguntas sobre esta corrección:

- **Desarrollador:** David Vidal
- **Fecha:** 25-10-2025
- **Relacionado con:** Bugs #1, #2, #3

---

## 💡 **Lección Final**

**No asumir que tipos de comprobante similares (33 y 34) usan el mismo formato.**

Cada tipo de comprobante en la DGII puede tener:

- ✅ Campos obligatorios diferentes
- ✅ Formatos de datos diferentes
- ✅ Validaciones diferentes

**Regla de Oro:** Probar cada tipo de comprobante individualmente y consultar documentación oficial de DGII para cada caso.

---

**FIN DEL REPORTE**
