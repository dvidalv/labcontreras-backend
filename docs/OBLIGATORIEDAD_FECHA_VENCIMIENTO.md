# 📅 Obligatoriedad de Fecha de Vencimiento por Tipo de NCF

## 🎯 Según Documentación Oficial de la DGII

Basado en la tabla de obligatoriedad de campos de la DGII, el campo `fechaVencimientoSecuencia` tiene diferentes requisitos según el tipo de documento.

---

## ✅ **TIPOS CON FECHA OBLIGATORIA (Valor: 1)**

| **Tipo** | **Descripción**               | **Uso Común**                      |
| -------- | ----------------------------- | ---------------------------------- |
| `31`     | **Factura de Crédito Fiscal** | ✅ Servicios médicos, consultorías |
| `33`     | **Nota de Débito**            | ✅ Correcciones al alza            |
| `34`     | **Nota de Crédito**           | ✅ Devoluciones, descuentos        |
| `41`     | **Compras**                   | ✅ Adquisiciones                   |
| `44`     | **Regímenes Especiales**      | ✅ Casos especiales                |
| `45`     | **Gubernamental**             | ✅ Transacciones con el Estado     |
| `46`     | **Exportación**               | ✅ Ventas al exterior              |
| `47`     | **Pagos al Exterior**         | ✅ Pagos internacionales           |

## ❌ **TIPOS CON FECHA OPCIONAL (Valor: 0)**

| **Tipo** | **Descripción**        | **Uso Común**                 |
| -------- | ---------------------- | ----------------------------- |
| `32`     | **Factura de Consumo** | ❌ Ventas al consumidor final |
| `43`     | **Gastos Menores**     | ❌ Compras pequeñas           |

---

## 🔧 **Implementación del Sistema**

### **Función de validación:**

```javascript
const esFechaVencimientoObligatoria = (tipoDocumento) => {
  const tiposObligatorios = ['31', '33', '34', '41', '44', '45', '46', '47'];
  return tiposObligatorios.includes(tipoDocumento);
};
```

### **Aplicación en el XML:**

```javascript
fechaVencimientoSecuencia: esFechaVencimientoObligatoria(factura.tipo)
  ? fechaVencimientoFormateada
  : null;
```

---

## 📊 **Ejemplos de Comportamiento**

### **Tipo 31 (Obligatorio) - Tu caso de laboratorio:**

```xml
<identificacionDocumento>
  <tipoDocumento>31</tipoDocumento>
  <ncf>E310000000051</ncf>
  <fechaVencimientoSecuencia>31-12-2025</fechaVencimientoSecuencia>
</identificacionDocumento>
```

### **Tipo 32 (Opcional):**

```xml
<identificacionDocumento>
  <tipoDocumento>32</tipoDocumento>
  <ncf>B320000000051</ncf>
  <!-- fechaVencimientoSecuencia NO se incluye -->
</identificacionDocumento>
```

### **Tipo 43 (Opcional):**

```xml
<identificacionDocumento>
  <tipoDocumento>43</tipoDocumento>
  <ncf>B430000000051</ncf>
  <!-- fechaVencimientoSecuencia NO se incluye -->
</identificacionDocumento>
```

---

## 📝 **Logs del Sistema**

### **Para tipos obligatorios:**

```
📅 Fecha vencimiento para tipo 31: OBLIGATORIA
📅 fechaVencNCF no proporcionada, usando fecha calculada: 31-12-2025
📅 Fecha vencimiento NCF final: 31-12-2025 (tipo: 31)
```

### **Para tipos opcionales:**

```
📅 Fecha vencimiento para tipo 32: OPCIONAL
📅 Campo fechaVencimientoSecuencia omitido para tipo 32
```

---

## ✅ **Beneficios de esta Implementación**

1. **🎯 Cumplimiento exacto:** Respeta la documentación oficial de la DGII
2. **⚡ Automático:** No requiere configuración manual por tipo
3. **🛡️ Previene errores:** Evita enviar campos no requeridos
4. **📊 Optimización:** XML más limpio para tipos opcionales
5. **🔍 Transparencia:** Logs claros sobre qué se está aplicando

---

## 🚨 **Casos Especiales**

### **Tu laboratorio médico (Tipo 31):**

- ✅ **Fecha OBLIGATORIA**
- ✅ **Se incluye siempre** en el XML
- ✅ **Calculada automáticamente** si FileMaker no la envía

### **Si usaras Factura de Consumo (Tipo 32):**

- ❌ **Fecha OPCIONAL**
- ❌ **NO se incluye** en el XML (valor `null`)
- ✅ **XML más limpio** y conforme a normativas

---

## 🔄 **Prioridad del Sistema**

1. **Verificar obligatoriedad** según tipo de documento
2. **Si es opcional** → enviar `null` (no incluir en XML)
3. **Si es obligatorio** → usar fecha de FileMaker o calcular automáticamente
