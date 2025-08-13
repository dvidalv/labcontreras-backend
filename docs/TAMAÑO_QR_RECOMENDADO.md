# 📏 Tamaño Recomendado para Códigos QR - Facturas Electrónicas

## 🎯 **Información general**

Aunque la **DGII de República Dominicana** no especifica un tamaño mínimo exacto para códigos QR en facturas electrónicas, existen estándares internacionales y mejores prácticas que garantizan la legibilidad.

---

## 📐 **Tamaños recomendados**

### **🔍 Tamaños mínimos:**

- **Absoluto mínimo**: 2.0 cm x 2.0 cm (20mm x 20mm)
- **Recomendado**: 2.5 cm x 2.5 cm (25mm x 25mm)
- **Óptimo**: 3.0 cm x 3.0 cm (30mm x 30mm)

### **💻 En píxeles (para impresión):**

- **150 DPI**: 118px x 118px (mínimo), 150px x 150px (recomendado)
- **300 DPI**: 236px x 236px (mínimo), 300px x 300px (recomendado)
- **600 DPI**: 472px x 472px (mínimo), 600px x 600px (recomendado)

---

## 🎯 **Factores críticos para la legibilidad**

### **📱 Distancia de lectura:**

- **Regla general**: Distancia = 10 veces el ancho del código
- **Ejemplo**: QR de 2.5cm → legible hasta 25cm de distancia

### **🖨️ Resolución de impresión:**

- **Mínima**: 150 DPI
- **Recomendada**: 300 DPI
- **Profesional**: 600 DPI

### **⚪ Zona silenciosa (margen):**

- **Mínimo**: 4 módulos de ancho alrededor del código
- **Recomendado**: Margen blanco de al menos 3mm

---

## ⚙️ **Configuración implementada**

Nuestro sistema usa las siguientes especificaciones optimizadas:

```javascript
const opcionesQR = {
  version: 8, // Versión 8 (recomendada por DGII)
  errorCorrectionLevel: 'M', // Nivel medio de corrección de errores
  margin: 4, // 4 módulos de margen (óptimo)
  width: Math.max(tamaño, 150), // Mínimo 150px (~2.5cm a 150 DPI)
  quality: 0.92, // Alta calidad para impresión
};
```

### **🎯 Validaciones automáticas:**

- ✅ **Tamaño mínimo**: 150px garantizado
- ✅ **Margen amplio**: 4 módulos para mejor lectura
- ✅ **Alta calidad**: 92% para impresión profesional
- ✅ **Versión 8**: Compatible con URLs largas de DGII

---

## 📊 **Tabla de equivalencias**

| **Píxeles** | **cm (150 DPI)** | **cm (300 DPI)** | **Uso recomendado** |
| ----------- | ---------------- | ---------------- | ------------------- |
| 150px       | 2.5 cm           | 1.3 cm           | Mínimo funcional    |
| 200px       | 3.4 cm           | 1.7 cm           | Facturas estándar   |
| 250px       | 4.2 cm           | 2.1 cm           | Tamaño cómodo       |
| 300px       | 5.1 cm           | 2.5 cm           | **Por defecto**     |
| 400px       | 6.8 cm           | 3.4 cm           | Tamaño grande       |

---

## 📋 **Recomendaciones específicas**

### **📄 Para facturas físicas:**

- **Tamaño**: 2.5 - 3.0 cm
- **Resolución**: 300 DPI mínimo
- **Posición**: Esquina inferior derecha
- **Contraste**: Negro sobre fondo blanco

### **💻 Para facturas digitales:**

- **Tamaño**: 200-300px
- **Formato**: PNG con transparencia
- **Calidad**: 92% o superior

### **📱 Para visualización móvil:**

- **Tamaño**: 150-250px
- **Formato**: SVG (escalable)
- **Responsive**: Adaptable al dispositivo

---

## 🔧 **Uso del endpoint**

### **📝 Generar QR con tamaño específico:**

```javascript
POST /comprobantes/generar-qr
{
  "rnc": "130085765",
  "ncf": "E310000000063",
  "codigo": "MkE6SW",
  "fecha": "07-03-2025",
  "monto": "50600.00",
  "formato": "png",
  "tamaño": 250        // 250px → ~4.2cm a 150 DPI
}
```

### **📏 Tamaños automáticos:**

- Si no especificas `tamaño`: **300px** (por defecto)
- Si especificas menos de 150px: **150px** (mínimo forzado)
- Máximo recomendado: **600px** (para impresión profesional)

---

## ✅ **Verificación de calidad**

### **🔍 Pruebas recomendadas:**

1. **Escanear desde 20cm** → Debe leer correctamente
2. **Imprimir y escanear** → Verificar calidad de impresión
3. **Diferentes apps** → Cámara nativa, Google Lens, etc.
4. **Distintas condiciones** → Luz natural, artificial, sombra

### **📱 Apps para pruebas:**

- **Cámara nativa** (iOS/Android)
- **Google Lens**
- **QR Code Reader**
- **Scanner Pro**

---

## 🎯 **Estado actual**

### **✅ Implementado:**

- ✅ Tamaño mínimo garantizado (150px)
- ✅ Margen óptimo (4 módulos)
- ✅ Versión 8 compatible con DGII
- ✅ Alta calidad para impresión
- ✅ URLs oficiales de DGII según monto

### **📊 Estadísticas típicas:**

- **QR 150px**: Perfecto para facturas pequeñas
- **QR 250px**: Ideal para facturas estándar
- **QR 300px**: Óptimo para impresión profesional
- **QR 400px+**: Para casos especiales o pantallas grandes

---

## 📞 **Contacto técnico**

Si necesitas ajustar tamaños específicos o tienes problemas de legibilidad:

**💬 Endpoint de soporte:** `POST /comprobantes/generar-qr`  
**📏 Tamaños disponibles:** 150px - 600px  
**🎨 Formatos:** PNG, SVG  
**📱 Compatible:** Todos los scanners estándar

**¡Los códigos QR ahora están optimizados para máxima legibilidad según mejores prácticas internacionales!** 🇩🇴✨
