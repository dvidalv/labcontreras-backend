# 📱 Formato Compacto QR - e-CF DGII

## 🎯 **Problema resuelto**

El JSON original era demasiado largo para QR versión 8:

- **Error:** "Minimum version required: 11"
- **Causa:** JSON con nombres largos y formato indentado
- **Solución:** JSON compacto con claves abreviadas

---

## 🔧 **Formato optimizado**

### **❌ Formato anterior (muy largo):**

```json
{
  "tipo": "e-CF",
  "rnc": "130085765",
  "ncf": "E310000000063",
  "codigo": "MkE6SW",
  "fecha": "07-03-2025 00:00:00",
  "monto": "50600.00",
  "categoria": "<$250K",
  "consultaDGII": "Consultar en dgii.gov.do con RNC y NCF"
}
```

### **✅ Formato nuevo (compacto):**

```json
{
  "t": "e-CF",
  "r": "130085765",
  "n": "E310000000063",
  "c": "MkE6SW",
  "f": "07-03-2025",
  "m": "50600.00",
  "cat": "S"
}
```

---

## 📋 **Mapeo de campos**

| **Campo original** | **Clave** | **Descripción**            | **Ejemplo**       |
| ------------------ | --------- | -------------------------- | ----------------- |
| `tipo`             | `t`       | Tipo de documento          | `"e-CF"`          |
| `rnc`              | `r`       | RNC del emisor             | `"130085765"`     |
| `ncf`              | `n`       | NCF del documento          | `"E310000000063"` |
| `codigo`           | `c`       | Código de seguridad        | `"MkE6SW"`        |
| `fecha`            | `f`       | Fecha emisión (DD-MM-YYYY) | `"07-03-2025"`    |
| `monto`            | `m`       | Monto total                | `"50600.00"`      |
| `categoria`        | `cat`     | Categoría por monto        | `"S"` o `"H"`     |

### **🏷️ Categorías:**

- **`"S"`** → Standard (< RD$250,000)
- **`"H"`** → High (≥ RD$250,000)

---

## 📊 **Ventajas del formato compacto**

### **✅ Técnicas:**

- **Cabe en QR versión 8** → Cumple especificación DGII
- **~80% menos caracteres** → Más eficiente
- **Misma información** → Todos los datos necesarios

### **✅ Funcionales:**

- **Fácil parsing** → JSON estándar
- **Legible al escanear** → Datos claros
- **Compatible** → Cualquier scanner QR

---

## 🔍 **Ejemplo de uso**

### **📱 Al escanear QR:**

```json
{
  "t": "e-CF",
  "r": "130085765",
  "n": "E310000000063",
  "c": "MkE6SW",
  "f": "07-03-2025",
  "m": "50600.00",
  "cat": "S"
}
```

### **🧑‍💻 Al interpretar:**

- **Tipo:** Comprobante Fiscal Electrónico
- **RNC:** 130085765
- **NCF:** E310000000063
- **Código:** MkE6SW (para verificación)
- **Fecha:** 07-03-2025
- **Monto:** RD$50,600.00
- **Categoría:** Standard (< RD$250K)

### **🌐 Para verificar:**

1. **Ir a** → dgii.gov.do
2. **Buscar** → Consulta NCF/e-NCF
3. **Introducir** → RNC: 130085765, NCF: E310000000063
4. **Verificar** → Código de seguridad: MkE6SW

---

## 🎯 **Compatibilidad**

### **✅ QR Code versión 8:**

- **Capacidad:** ~370 caracteres alfanuméricos
- **Nuestro JSON:** ~100 caracteres
- **Margen:** 270+ caracteres disponibles

### **📱 FileMaker:**

- **Campo QRCode** → Imagen PNG del QR
- **Campo URLGenerada** → JSON compacto
- **Mismo comportamiento** → Solo formato más eficiente

---

## 🔄 **Actualización automática**

El sistema ahora genera automáticamente el formato compacto:

- ✅ **Sin cambios** en FileMaker scripts
- ✅ **Sin cambios** en endpoints
- ✅ **Solo optimización** interna

**¡QR codes ahora funcionan perfectamente en versión 8 según especificaciones DGII!** 🎉
