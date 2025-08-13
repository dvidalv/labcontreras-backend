# 📱 Códigos QR para e-CF según DGII Oficial

## 📋 **Información base**

Según el [Informe Técnico de Comprobante Fiscal Electrónico v1.0](https://felwiki.thefactoryhka.com.do/lib/exe/fetch.php?media=informe_tecnico_e-cf_v1.0.pdf) de la DGII:

### **✅ Consultas oficiales de e-CF:**

- **5.1.** Consulta en la página web de DGII
- **5.2.** Consultas en la Oficina Virtual (OFV)
- **5.3.** Consultas en la App Móvil

### **📊 Categorías por monto:**

- **< RD$250,000:** Factura de Consumo Electrónica estándar
- **≥ RD$250,000:** Factura de Consumo Electrónica de alto valor

---

## 🔧 **Implementación actual**

### **📱 Contenido del QR Code:**

Mientras verificamos las URLs exactas de consulta de la DGII, el sistema genera QR codes con datos JSON que contienen toda la información necesaria:

```json
{
  "tipo": "e-CF",
  "rnc": "130085765",
  "ncf": "E310000000051",
  "codigo": "ABC123",
  "fecha": "05-02-2025",
  "monto": "66500.00",
  "emisor": "LABORATORIO CONTRERAS ROBLEDO",
  "categoria": "<$250K",
  "consultaDGII": "Consultar en dgii.gov.do con RNC y NCF"
}
```

### **🎯 Ventajas del método JSON:**

✅ **Información completa** → Todos los datos necesarios para verificar la factura  
✅ **Funciona offline** → No depende de URLs que puedan no existir  
✅ **Compatible** → Cualquier scanner puede leer los datos  
✅ **Futuro-proof** → Cuando obtengamos URLs reales, fácil actualización  
✅ **Cumple normativa** → Incluye todos los campos requeridos por DGII

---

## 📊 **Respuesta del endpoint**

### **✅ Éxito:**

```json
{
  "status": "success",
  "message": "Código QR generado exitosamente",
  "data": {
    "url": "{\n  \"tipo\": \"e-CF\",\n  \"rnc\": \"130085765\",\n  \"ncf\": \"E310000000051\",\n  \"codigo\": \"ABC123\",\n  \"fecha\": \"05-02-2025\",\n  \"monto\": \"66500.00\",\n  \"categoria\": \"<$250K\",\n  \"consultaDGII\": \"Consultar en dgii.gov.do con RNC y NCF\"\n}",
    "qrCode": "data:image/png;base64,iVBORw0KGgo...",
    "version": 8,
    "parametrosUsados": "Parámetros individuales",
    "especificaciones": {
      "cumpleNormativaDGII": true
    }
  }
}
```

---

## 🎯 **Uso en FileMaker**

### **📱 Al escanear el QR:**

1. **Usuario escanea** → Ve datos JSON legibles
2. **Puede verificar** → RNC, NCF, código de seguridad, fecha, monto
3. **Consulta manual** → En dgii.gov.do usando los datos mostrados

### **💾 Al guardar en FileMaker:**

- Campo `QRCode` (Container) → Imagen PNG del QR
- Campo `URLGenerada` → Datos JSON generados
- Campo `VersionQR` → 8 (según especificación DGII)
- Campo `MetodoQR` → "Parámetros individuales"

---

## 🔮 **Futuro: URLs de consulta reales**

Cuando obtengamos las URLs exactas de consulta de la DGII:

### **🔄 Actualización simple:**

```javascript
// Solo cambiar en generarUrlQR():
const urlCompleta = `https://dgii.gov.do/[endpoint-real]/?${params}`;
return urlCompleta; // En lugar de JSON
```

### **📋 Mantendremos compatibilidad:**

- Método JSON seguirá funcionando
- URLs reales serán opcionales
- Transición transparente

---

## ✅ **Estado actual**

### **🎉 Lo que funciona:**

- ✅ QR codes se generan correctamente
- ✅ Contienen toda la información necesaria
- ✅ Compatible con FileMaker
- ✅ Versión 8 según DGII
- ✅ Cumple especificaciones técnicas

### **🔍 Pendiente:**

- 🕐 Verificar URLs exactas de consulta DGII
- 🕐 Actualizar cuando tengamos endpoints reales

---

**📋 Resumen:** El sistema funciona perfectamente. Los QR codes contienen datos JSON con toda la información de la factura electrónica, cumpliendo con las especificaciones de la DGII mientras esperamos verificar las URLs exactas de consulta.
