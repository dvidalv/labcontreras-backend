# Códigos de Error y Estado DGII - Facturación Electrónica

## 📋 Códigos Identificados en Nuestro Sistema

### ✅ **Códigos de Éxito (0-99)**

| Código | Descripción                       | Estado Normalizado | Comentarios               |
| ------ | --------------------------------- | ------------------ | ------------------------- |
| **0**  | Documento procesado correctamente | `APROBADA`         | ✅ Éxito total            |
| **1**  | Aceptado                          | `APROBADA`         | ✅ Procesado exitosamente |

### ⏳ **Códigos de Proceso (100-199)**

| Código | Descripción                                | Estado Normalizado | Comentarios                |
| ------ | ------------------------------------------ | ------------------ | -------------------------- |
| **2**  | En proceso de validación                   | `EN_PROCESO`       | ⏳ Pendiente DGII          |
| **10** | Pendiente de procesamiento                 | `EN_PROCESO`       | ⏳ En cola                 |
| **15** | En validación                              | `EN_PROCESO`       | ⏳ Validando datos         |
| **95** | Documento pendiente por ser enviado a DGII | `EN_PROCESO`       | ⏳ Pre-envío               |
| **99** | Sin respuesta DGII                         | `EN_PROCESO`       | ⏳ Enviado, esperando DGII |

### ❌ **Códigos de Error NCF (108-110)**

| Código  | Descripción                                     | Estado Normalizado  | Solución                     |
| ------- | ----------------------------------------------- | ------------------- | ---------------------------- |
| **108** | NCF ya presentado anteriormente                 | `NCF_INVALIDO`      | Usar NCF diferente           |
| **109** | NCF vencido o fuera de rango                    | `NCF_VENCIDO`       | Verificar vigencia del rango |
| **110** | RNC no autorizado para este tipo de comprobante | `RNC_NO_AUTORIZADO` | Verificar autorización DGII  |

### ❌ **Códigos de Validación de Datos (111-114)**

| Código  | Descripción                         | Estado Normalizado | Solución                |
| ------- | ----------------------------------- | ------------------ | ----------------------- |
| **111** | Datos de la factura inválidos       | `DATOS_INVALIDOS`  | Revisar estructura JSON |
| **112** | Estructura del documento incorrecta | `DATOS_INVALIDOS`  | Validar schema XSD      |
| **113** | Totales inconsistentes              | `DATOS_INVALIDOS`  | Verificar cálculos      |
| **114** | Campos obligatorios faltantes       | `DATOS_INVALIDOS`  | Completar información   |

### 🚫 **Códigos de Rechazo DGII (200-299)**

| Código  | Descripción                               | Estado Normalizado | Acción                  |
| ------- | ----------------------------------------- | ------------------ | ----------------------- |
| **200** | Rechazado por DGII - Datos inconsistentes | `RECHAZADA`        | Revisar y reenviar      |
| **201** | Rechazado - RNC inválido                  | `RECHAZADA`        | Verificar RNC           |
| **202** | Rechazado - Estructura incorrecta         | `RECHAZADA`        | Validar formato         |
| **203** | Rechazado - Firma digital inválida        | `RECHAZADA`        | Problema de certificado |

### 🚫 **Códigos de Cancelación (300-399)**

| Código  | Descripción                     | Estado Normalizado | Comentarios            |
| ------- | ------------------------------- | ------------------ | ---------------------- |
| **300** | Documento anulado por el emisor | `ANULADA`          | Cancelación voluntaria |
| **301** | Documento cancelado por DGII    | `ANULADA`          | Cancelación oficial    |

### 🔴 **Códigos de Error DGII (600-699)**

| Código  | Descripción                                                               | Estado Normalizado | Causa Común                      |
| ------- | ------------------------------------------------------------------------- | ------------------ | -------------------------------- |
| **613** | Los comprobantes electrónicos no pueden reemplazarse entre ellos mismos   | `RECHAZADA`        | ❌ **Detectado en nuestro caso** |
| **634** | El valor del campo FechaNCFModificado no coincide con la fecha de emisión | `RECHAZADA`        | ❌ **Detectado en nuestro caso** |

## 🔍 **Análisis del Error 613**

### **Descripción Completa:**

```json
{
  "codigo": 613,
  "mensaje": "Los comprobantes electrónicos no pueden reemplazarse entre ellos mismos."
}
```

### **Causas Identificadas:**

1. **NCF ya modificado**: El NCF original ya tiene una nota de crédito
2. **Referencia circular**: Se intenta modificar un e-CF con otro e-CF del mismo tipo
3. **Reglas DGII**: Violación de reglas específicas de modificación
4. **Fechas inconsistentes**: Problemas temporales en las referencias

### **Soluciones:**

- ✅ Verificar que el NCF original no tenga modificaciones previas
- ✅ Usar código de modificación apropiado (01-06)
- ✅ Validar fechas de emisión vs modificación
- ✅ Consultar estado del NCF original antes de crear nota de crédito

## 📊 **Patrones de Códigos Observados**

### **Rango 0-99**: Éxito

- Documento procesado correctamente
- Sin errores de validación

### **Rango 100-199**: En Proceso

- Documentos en cola de procesamiento
- Pendientes de validación DGII

### **Rango 200-299**: Rechazo DGII

- Problemas con la estructura o datos
- Requieren corrección y reenvío

### **Rango 300-399**: Cancelación

- Documentos anulados o cancelados
- Estado final del documento

### **Rango 600-699**: Errores de Reglas de Negocio

- Violaciones de reglas específicas DGII
- Errores de lógica de facturación

## 🛠️ **Cómo Manejar Cada Tipo de Error**

### **Para Códigos 0-1**: ✅ Continuar

```javascript
if (codigo === 0 || codigo === 1) {
  // Documento exitoso, continuar con QR
}
```

### **Para Códigos 2, 10, 15, 95, 99**: ⏳ Esperar

```javascript
if ([2, 10, 15, 95, 99].includes(codigo)) {
  // Consultar estado nuevamente en unos minutos
  setTimeout(() => consultarEstatus(), 300000); // 5 minutos
}
```

### **Para Códigos 108-114**: ❌ Corregir

```javascript
if (codigo >= 108 && codigo <= 114) {
  // Problema con NCF, RNC o datos - corregir antes de reenviar
}
```

### **Para Códigos 200-299**: 🔄 Revisar y Reenviar

```javascript
if (codigo >= 200 && codigo <= 299) {
  // Rechazado por DGII - revisar datos y reenviar
}
```

### **Para Códigos 600-699**: 🚫 Analizar Reglas

```javascript
if (codigo >= 600 && codigo <= 699) {
  // Error de reglas de negocio - revisar lógica
  if (codigo === 613) {
    // Problema específico con notas de crédito
  }
}
```

## 📚 **Fuentes de Información**

1. **Documentación DGII**: [Portal Oficial](https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/)
2. **TheFactoryHKA API**: Respuestas observadas en producción
3. **Experiencia práctica**: Códigos identificados en este proyecto
4. **Esquemas XSD**: Validaciones oficiales de la DGII

## 📝 **Notas Importantes**

- ⚠️ La DGII no publica una lista oficial completa de códigos
- 🔄 Los códigos pueden cambiar con actualizaciones del sistema
- 📞 Para casos complejos, contactar directamente a la DGII
- 📊 Implementar logging detallado para identificar nuevos códigos
