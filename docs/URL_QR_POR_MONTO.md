# 📱 URLs del Código QR según el Monto de la Factura

## 🎯 Normativas de la DGII

Según las regulaciones de la DGII para comprobantes electrónicos, la **URL del código QR debe variar según el monto total** de la factura, utilizando diferentes endpoints y parámetros.

---

## 💰 **Reglas por Monto**

### **🔍 MONTOS MENORES a RD$250,000**

- **Endpoint:** `/consulta/`
- **Validación:** Básica
- **Parámetro monto:** ❌ No requerido

### **🔍 MONTOS MAYORES o IGUALES a RD$250,000**

- **Endpoint:** `/validacion/`
- **Validación:** Extendida
- **Parámetro monto:** ✅ Obligatorio

---

## 📋 **Formatos de URL**

### **Para facturas < RD$250,000:**

```
https://dgii.gov.do/ecf/consulta/?rnc={rnc}&ncf={ncf}&codigo={codigo}&fecha={fecha}
```

### **Para facturas ≥ RD$250,000:**

```
https://dgii.gov.do/ecf/validacion/?rnc={rnc}&ncf={ncf}&codigo={codigo}&fecha={fecha}&monto={monto}
```

---

## 📊 **Ejemplos Reales**

### **Ejemplo 1: Factura de RD$15,000 (Consulta Básica)**

```
https://dgii.gov.do/ecf/consulta/?rnc=130085765&ncf=E310000000051&codigo=ABC123&fecha=05-02-2025
```

### **Ejemplo 2: Factura de RD$350,000 (Validación Extendida)**

```
https://dgii.gov.do/ecf/validacion/?rnc=130085765&ncf=E310000000051&codigo=ABC123&fecha=05-02-2025&monto=350000.00
```

### **Ejemplo 3: Tu laboratorio - RD$66,500 (Consulta Básica)**

```
https://dgii.gov.do/ecf/consulta/?rnc=130085765&ncf=E310000000051&codigo=GNGhsV&fecha=05-02-2025
```

---

## 🔧 **Implementación del Sistema**

### **Función automática:**

```javascript
const generarUrlQR = (responseData, facturaOriginal) => {
  const montoTotal = parseFloat(facturaOriginal.factura.total || 0);
  const LIMITE_MONTO = 250000; // RD$250,000

  const esMontoAlto = montoTotal >= LIMITE_MONTO;
  const endpoint = esMontoAlto ? 'validacion' : 'consulta';
  const baseUrl = `https://dgii.gov.do/ecf/${endpoint}/`;

  const params = new URLSearchParams({
    rnc: facturaOriginal.emisor.rnc,
    ncf: facturaOriginal.factura.ncf,
    codigo: responseData.codigoSeguridad,
    fecha: responseData.fechaEmision,
  });

  // Agregar monto solo si es requerido
  if (esMontoAlto) {
    params.append('monto', montoTotal.toFixed(2));
  }

  return `${baseUrl}?${params.toString()}`;
};
```

---

## 📝 **Logs del Sistema**

### **Para montos bajos:**

```
📱 URL QR generada para monto RD$15,000: https://dgii.gov.do/ecf/consulta/...
📊 Tipo validación: BÁSICA (<$250K)
```

### **Para montos altos:**

```
📱 URL QR generada para monto RD$350,000: https://dgii.gov.do/ecf/validacion/...
📊 Tipo validación: EXTENDIDA (≥$250K)
```

---

## 📊 **Comparación de Endpoints**

| **Aspecto**              | **Consulta Básica** | **Validación Extendida** |
| ------------------------ | ------------------- | ------------------------ |
| **Monto**                | < RD$250,000        | ≥ RD$250,000             |
| **URL**                  | `/consulta/`        | `/validacion/`           |
| **Parámetros**           | 4 básicos           | 5 (incluye monto)        |
| **Validación DGII**      | Estándar            | Reforzada                |
| **Tiempo procesamiento** | Rápido              | Más detallado            |

---

## ✅ **Beneficios del Sistema Automático**

1. **🎯 Cumplimiento normativo:** Usa el endpoint correcto según el monto
2. **⚡ Automático:** Decide sin intervención manual
3. **🛡️ Validación apropiada:** Nivel de verificación según criticidad
4. **📊 Transparencia:** Logs claros sobre qué tipo se está usando
5. **💰 Precisión:** Maneja correctamente el límite de RD$250,000

---

## 🚨 **Casos Especiales**

### **Tu laboratorio médico:**

- **Servicios típicos:** RD$5,000 - RD$150,000
- **Endpoint usual:** `/consulta/` (validación básica)
- **URL típica:** Sin parámetro `monto`

### **Procedimientos costosos:**

- **Cirugías, estudios especiales:** > RD$250,000
- **Endpoint:** `/validacion/` (validación extendida)
- **URL:** Con parámetro `monto` obligatorio

---

## 📱 **Para FileMaker**

### **Uso de la URL generada:**

```javascript
// FileMaker recibe la URL ya preparada:
const urlQR = response.data.urlQR;

// Generar QR Code:
const qrImage = generarCodigoQR(urlQR);

// La URL ya tiene el formato correcto según el monto
```

### **No necesitas:**

- ❌ Verificar manualmente el monto
- ❌ Elegir entre endpoints
- ❌ Decidir qué parámetros incluir

### **El sistema hace todo automáticamente:**

- ✅ Detecta el monto de la factura
- ✅ Elige el endpoint correcto
- ✅ Incluye los parámetros apropiados
- ✅ Genera la URL completa
