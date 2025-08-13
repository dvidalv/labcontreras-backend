# 🌐 URL Oficial DGII para QR Codes - e-CF

## 📋 **Información oficial**

Según el [Informe Técnico de Comprobante Fiscal Electrónico v1.0](https://felwiki.thefactoryhka.com.do/lib/exe/fetch.php?media=informe_tecnico_e-cf_v1.0.pdf), existen **dos endpoints oficiales** según el monto de la factura:

### **✅ Endpoints oficiales:**

#### **📊 Facturas estándar (< RD$250,000):**

```
https://fc.dgii.gov.do/eCF/ConsultaTimbreFC
```

#### **💎 Facturas de alto valor (≥ RD$250,000):**

```
https://ecf.dgii.gov.do/ecf/ConsultaTimbre
```

---

## 🔧 **Implementación actualizada**

### **📱 Estructura del QR Code:**

```
https://fc.dgii.gov.do/eCF/ConsultaTimbreFC?rnc=130085765&ncf=E310000000063&codigo=MkE6SW&fecha=07-03-2025
```

### **📋 Parámetros obligatorios:**

| **Parámetro** | **Descripción**            | **Ejemplo**     |
| ------------- | -------------------------- | --------------- |
| `rnc`         | RNC del emisor             | `130085765`     |
| `ncf`         | NCF del documento          | `E310000000063` |
| `codigo`      | Código de seguridad        | `MkE6SW`        |
| `fecha`       | Fecha emisión (DD-MM-YYYY) | `07-03-2025`    |

### **💰 Parámetro condicional:**

| **Parámetro** | **Cuándo**   | **Descripción**           | **Ejemplo** |
| ------------- | ------------ | ------------------------- | ----------- |
| `monto`       | ≥ RD$250,000 | Monto total de la factura | `350000.00` |

---

## 🎯 **Ejemplos de URLs generadas**

### **📊 Factura estándar (< RD$250,000):**

```
https://fc.dgii.gov.do/eCF/ConsultaTimbreFC?rnc=130085765&ncf=E310000000063&codigo=MkE6SW&fecha=07-03-2025
```

### **💎 Factura de alto valor (≥ RD$250,000):**

```
https://ecf.dgii.gov.do/ecf/ConsultaTimbre?rnc=130085765&ncf=E320000000001&codigo=RzYCb&fecha=27-01-2020&monto=394474.00
```

---

## 🔄 **Cambios realizados**

### **❌ Antes (JSON temporal):**

```json
{
  "t": "e-CF",
  "n": "E310000000063",
  "r": "130085765",
  "c": "MkE6SW",
  "f": "07-03-2025",
  "m": "50600.00",
  "cat": "S"
}
```

### **✅ Ahora (URLs oficiales según monto):**

**Factura estándar:**

```
https://fc.dgii.gov.do/eCF/ConsultaTimbreFC?rnc=130085765&ncf=E310000000063&codigo=MkE6SW&fecha=07-03-2025
```

**Factura de alto valor:**

```
https://ecf.dgii.gov.do/ecf/ConsultaTimbre?rnc=130085765&ncf=E320000000001&codigo=RzYCb&fecha=27-01-2020&monto=394474.00
```

---

## 📱 **Comportamiento del QR**

### **🔍 Al escanear:**

1. **Scanner detecta URL** → Abre automáticamente en navegador
2. **Usuario accede** → Página oficial de consulta DGII
3. **Verificación automática** → Usando parámetros del QR
4. **Resultado oficial** → Estado y validez del e-CF

### **✅ Ventajas:**

- **📱 Acceso directo** → Un clic desde el scanner
- **🌐 Oficial** → Sitio web de la DGII
- **🔒 Seguro** → Verificación en tiempo real
- **📊 Completo** → Toda la información de la factura

---

## 🎯 **Compatibilidad**

### **✅ QR Code versión 8:**

- **URL típica:** ~120 caracteres
- **Capacidad QR v8:** ~370 caracteres
- **Margen:** 250+ caracteres disponibles

### **📱 Scanners:**

- **Cámara nativa** → Detecta URL automáticamente
- **Apps de QR** → Abren directamente en navegador
- **No más confusión** → Solo muestra la URL

---

## 🚀 **Ejemplo real:**

### **📋 Datos de factura:**

- **RNC:** 130085765
- **NCF:** E310000000063
- **Código:** MkE6SW
- **Fecha:** 07-03-2025
- **Monto:** RD$50,600.00

### **📱 QR generado:**

```
https://fc.dgii.gov.do/eCF/ConsultaTimbreFC?rnc=130085765&ncf=E310000000063&codigo=MkE6SW&fecha=07-03-2025
```

### **🔍 Al escanear:**

- Scanner muestra: `https://fc.dgii.gov.do/eCF/ConsultaTimbreFC?rnc=130085765&ncf=E310000000063&codigo=MkE6SW&fecha=07-03-2025`
- Usuario toca: Abre página oficial DGII
- Resultado: Verificación automática del e-CF

---

## ✅ **Estado actual**

### **🎉 Implementado:**

- ✅ **Dos endpoints oficiales** según monto de factura
- ✅ **Estándar:** `https://fc.dgii.gov.do/eCF/ConsultaTimbreFC` (< RD$250K)
- ✅ **Alto valor:** `https://ecf.dgii.gov.do/ecf/ConsultaTimbre` (≥ RD$250K)
- ✅ Parámetros según especificación DGII
- ✅ Lógica automática de selección de endpoint
- ✅ Compatible con QR versión 8
- ✅ Funciona en todos los scanners

### **📋 Según informe técnico página 35:**

- ✅ Endpoint correcto implementado
- ✅ Parámetros según normativa
- ✅ Diferenciación por monto de factura

**¡QR codes ahora usan la URL oficial de la DGII según especificación técnica!** 🇩🇴
