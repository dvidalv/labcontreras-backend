# 📱 Endpoint para Generar Códigos QR - Especificaciones DGII

## 🎯 Según Documentación Técnica de la DGII

Basado en la [documentación oficial de la DGII](https://felwiki.thefactoryhka.com.do/lib/exe/fetch.php?media=descripcion-tecnica-de-facturacion-electronica_nuevo.pdf), este endpoint genera códigos QR con **versión 8** recomendada.

---

## 📋 **Información del Endpoint**

| **Aspecto**           | **Detalle**                     |
| --------------------- | ------------------------------- |
| **URL**               | `POST /comprobantes/generar-qr` |
| **Autenticación**     | ✅ Token Bearer requerido       |
| **Tipo de contenido** | `application/json`              |
| **Versión QR**        | 8 (recomendada por DGII)        |
| **Error Correction**  | Level M (medio)                 |

---

## 🔧 **Parámetros de Entrada**

### **📋 Método 1: URL Completa (Tradicional)**

| **Campo** | **Tipo** | **Descripción**                            |
| --------- | -------- | ------------------------------------------ |
| `url`     | String   | URL del comprobante electrónico de la DGII |

### **🎯 Método 2: Parámetros Individuales (RECOMENDADO)**

| **Campo** | **Tipo** | **Obligatorio** | **Descripción**                      |
| --------- | -------- | --------------- | ------------------------------------ |
| `rnc`     | String   | ✅              | RNC del emisor                       |
| `ncf`     | String   | ✅              | NCF del documento                    |
| `codigo`  | String   | ✅              | Código de seguridad de TheFactoryHKA |
| `fecha`   | String   | ✅              | Fecha de emisión (DD-MM-YYYY)        |
| `monto`   | String   | ❌              | Monto total (determina endpoint)     |

### **Opcionales (ambos métodos):**

| **Campo** | **Tipo** | **Defecto** | **Descripción**                      |
| --------- | -------- | ----------- | ------------------------------------ |
| `formato` | String   | `"png"`     | Formato de salida: `"png"` o `"svg"` |
| `tamaño`  | Number   | `300`       | Tamaño en píxeles (100-1000)         |

---

## 📤 **Ejemplo de Solicitud**

### **🎯 Método Recomendado: Parámetros Individuales**

```javascript
POST /comprobantes/generar-qr
Authorization: Bearer your-token-here
Content-Type: application/json

{
  "rnc": "130085765",
  "ncf": "E310000000051",
  "codigo": "GNGhsV",
  "fecha": "05-02-2025",
  "monto": "66500.00",
  "formato": "png",
  "tamaño": 200
}
```

### **📋 Método Tradicional: URL Completa**

```javascript
POST /comprobantes/generar-qr
Authorization: Bearer your-token-here
Content-Type: application/json

{
  "url": "https://dgii.gov.do/ecf/consulta/?rnc=130085765&ncf=E310000000051&codigo=GNGhsV&fecha=05-02-2025"
}
```

### **💰 Factura de Alto Valor (≥ RD$250,000)**

```javascript
POST /comprobantes/generar-qr
Authorization: Bearer your-token-here
Content-Type: application/json

{
  "rnc": "130085765",
  "ncf": "E310000000051",
  "codigo": "ABC123",
  "fecha": "05-02-2025",
  "monto": "350000.00",
  "formato": "svg",
  "tamaño": 400
}
```

---

## 📥 **Respuesta Exitosa**

```json
{
  "status": "success",
  "message": "Código QR generado exitosamente",
  "data": {
    "url": "https://dgii.gov.do/ecf/consulta/?rnc=130085765&ncf=E310000000051&codigo=GNGhsV&fecha=05-02-2025",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51...",
    "formato": "png",
    "tamaño": 300,
    "version": 8,
    "parametrosUsados": "Parámetros individuales",
    "especificaciones": {
      "errorCorrection": "M",
      "cumpleNormativaDGII": true,
      "versionRecomendada": 8
    },
    "timestamp": "2025-08-11T05:30:00.000Z"
  }
}
```

### **Campos de respuesta:**

| **Campo**                              | **Descripción**                                          |
| -------------------------------------- | -------------------------------------------------------- |
| `url`                                  | URL final construida para el QR                          |
| `qrCode`                               | Código QR en formato Data URL (listo para usar)          |
| `version`                              | Versión del QR (siempre 8)                               |
| `parametrosUsados`                     | Método usado: "URL completa" o "Parámetros individuales" |
| `especificaciones.cumpleNormativaDGII` | Confirmación de cumplimiento                             |

---

## ❌ **Respuestas de Error**

### **Parámetros insuficientes (400):**

```json
{
  "status": "error",
  "message": "Parámetros insuficientes para generar el código QR",
  "details": "Debe proporcionar: url completa O (rnc + ncf + codigo + fecha + monto opcional)"
}
```

### **Error interno (500):**

```json
{
  "status": "error",
  "message": "Error interno al generar el código QR",
  "details": "Descripción del error técnico"
}
```

---

## 🎯 **Especificaciones Técnicas DGII**

### **Configuración implementada:**

```javascript
{
  version: 8,                    // ✅ Versión recomendada por DGII
  errorCorrectionLevel: 'M',     // ✅ Nivel medio de corrección
  color: {
    dark: '#000000',             // ✅ Negro estándar
    light: '#FFFFFF'             // ✅ Fondo blanco
  },
  margin: 1,                     // ✅ Margen mínimo
  quality: 0.92                  // ✅ Alta calidad
}
```

### **Cumplimiento normativo:**

- ✅ **Versión 8:** Según documentación técnica de mayo 2023
- ✅ **Caracteres especiales:** Manejados correctamente en URLs
- ✅ **Error correction M:** Nivel apropiado para impresión
- ✅ **Formato estándar:** Compatible con representaciones impresas

---

## 📱 **Para FileMaker**

### **Flujo completo:**

```javascript
// 1. Obtener URL del endpoint de envío
const response1 = await enviarFactura(datosFactura);
const urlQR = response1.data.urlQR;

// 2. Generar QR Code
const response2 = await fetch('/comprobantes/generar-qr', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: urlQR,
    formato: 'png',
    tamaño: 200, // Tamaño para impresión
  }),
});

// 3. Usar el QR en la factura
const qrData = response2.data.qrCode; // Data URL listo para usar
mostrarQREnFactura(qrData);
```

### **Ventajas para FileMaker:**

- ✅ **Data URL directo:** No necesita guardar archivos temporales
- ✅ **Formato flexible:** PNG para impresión, SVG para pantalla
- ✅ **Tamaño personalizable:** Optimizado para cada uso
- ✅ **Cumplimiento automático:** Especificaciones DGII incluidas

---

## 🔍 **Casos de Uso**

### **1. Facturas impresas (PNG pequeño):**

```json
{
  "url": "https://dgii.gov.do/ecf/consulta/...",
  "formato": "png",
  "tamaño": 150
}
```

### **2. Facturas digitales (SVG escalable):**

```json
{
  "url": "https://dgii.gov.do/ecf/validacion/...",
  "formato": "svg",
  "tamaño": 300
}
```

### **3. Facturas de alto valor (validación extendida):**

```json
{
  "url": "https://dgii.gov.do/ecf/validacion/?rnc=130085765&ncf=E310000000051&codigo=ABC123&fecha=05-02-2025&monto=350000.00",
  "formato": "png",
  "tamaño": 200
}
```

---

## 📊 **Logs del Sistema**

```
📱 Generando QR Code versión 8 para URL: https://dgii.gov.do/ecf/consulta/...
📏 Configuración: PNG, 300px
✅ QR generado exitosamente con especificaciones DGII
```

---

## ✅ **Beneficios**

1. **📖 Cumple normativa:** Versión 8 según documentación oficial
2. **🎨 Calidad profesional:** Configuración optimizada para impresión
3. **⚡ Respuesta inmediata:** Data URL listo para usar
4. **🔧 Flexible:** Múltiples formatos y tamaños
5. **🛡️ Robusto:** Manejo de errores completo
6. **📱 Fácil integración:** API simple para FileMaker
