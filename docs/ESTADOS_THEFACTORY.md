# 📊 Estados de TheFactoryHKA - Guía Completa

## 🎯 Estados Normalizados del Sistema

| **Estado Normalizado** | **Descripción**                    | **Acción FileMaker**       |
| ---------------------- | ---------------------------------- | -------------------------- |
| `APROBADA`             | ✅ Documento aceptado oficialmente | ✅ Proceso completo        |
| `EN_PROCESO`           | ⏳ Siendo procesado/validado       | 🔄 Consultar después       |
| `NCF_INVALIDO`         | ❌ NCF ya usado o inválido         | 🔢 Generar nuevo NCF       |
| `NCF_VENCIDO`          | ❌ NCF vencido o fuera de rango    | 🔢 Generar nuevo NCF       |
| `RNC_NO_AUTORIZADO`    | ❌ RNC sin permisos                | ⚙️ Verificar configuración |
| `DATOS_INVALIDOS`      | ❌ Error en datos/estructura       | 📝 Revisar y corregir      |
| `RECHAZADA`            | ❌ Rechazada por DGII              | 📋 Revisar normativas      |
| `ANULADA`              | 🚫 Documento cancelado             | ❌ No se puede usar        |
| `ERROR`                | ❓ Error desconocido               | 📞 Contactar soporte       |
| `DESCONOCIDO`          | ❓ Estado no reconocido            | 📞 Contactar soporte       |

---

## 🔢 Códigos de TheFactoryHKA Mapeados

### ✅ **Estados Exitosos**

| **Código** | **Mensaje Típico**                  | **Estado Normalizado** |
| ---------- | ----------------------------------- | ---------------------- |
| `0`        | "Documento procesado correctamente" | `APROBADA`             |
| `1`        | "Aceptado"                          | `APROBADA`             |

### ⏳ **Estados en Proceso**

| **Código** | **Mensaje Típico**                           | **Estado Normalizado** |
| ---------- | -------------------------------------------- | ---------------------- |
| `2`        | "En proceso de validación DGII"              | `EN_PROCESO`           |
| `10`       | "Documento en cola de procesamiento"         | `EN_PROCESO`           |
| `15`       | "Validando estructura del documento"         | `EN_PROCESO`           |
| `95`       | "Documento pendiente por ser enviado a DGII" | `EN_PROCESO`           |
| `99`       | "SIN RESPUESTA DGII"                         | `EN_PROCESO`           |

### ❌ **Errores de NCF**

| **Código** | **Mensaje Típico**                                 | **Estado Normalizado** |
| ---------- | -------------------------------------------------- | ---------------------- |
| `108`      | "El documento NCF ya fue presentado anteriormente" | `NCF_INVALIDO`         |
| `109`      | "NCF vencido o fuera de rango"                     | `NCF_VENCIDO`          |

### ❌ **Errores de Autorización**

| **Código** | **Mensaje Típico**                           | **Estado Normalizado** |
| ---------- | -------------------------------------------- | ---------------------- |
| `110`      | "RNC no autorizado para emisión electrónica" | `RNC_NO_AUTORIZADO`    |

### ❌ **Errores de Validación**

| **Código** | **Mensaje Típico**                    | **Estado Normalizado** |
| ---------- | ------------------------------------- | ---------------------- |
| `111`      | "Datos del documento inválidos"       | `DATOS_INVALIDOS`      |
| `112`      | "Error en la estructura del XML"      | `DATOS_INVALIDOS`      |
| `113`      | "Totales no coinciden con el detalle" | `DATOS_INVALIDOS`      |
| `114`      | "Fecha de emisión inválida"           | `DATOS_INVALIDOS`      |

### ❌ **Errores de Rechazo DGII**

| **Código** | **Mensaje Típico**                        | **Estado Normalizado** |
| ---------- | ----------------------------------------- | ---------------------- |
| `200`      | "Documento rechazado por DGII"            | `RECHAZADA`            |
| `201`      | "RNC del comprador inválido"              | `RECHAZADA`            |
| `202`      | "Monto excede límites permitidos"         | `RECHAZADA`            |
| `203`      | "Documento no cumple normativas fiscales" | `RECHAZADA`            |

### 🚫 **Estados de Cancelación**

| **Código** | **Mensaje Típico**                | **Estado Normalizado** |
| ---------- | --------------------------------- | ---------------------- |
| `300`      | "Documento anulado por el emisor" | `ANULADA`              |
| `301`      | "Documento cancelado por DGII"    | `ANULADA`              |

---

## 🎯 Lógica de Normalización

El sistema utiliza un enfoque de **3 prioridades** para determinar el estado:

### **PRIORIDAD 1:** Campo `procesado` + código numérico

```javascript
if (procesado === true && codigo === 0) return 'APROBADA';
if (procesado === true && codigo === 108) return 'NCF_INVALIDO';
```

### **PRIORIDAD 2:** Análisis del texto del mensaje

```javascript
if (mensaje.includes('ACEPTADO')) return 'APROBADA';
if (mensaje.includes('PROCESO')) return 'EN_PROCESO';
```

### **PRIORIDAD 3:** Solo código numérico (fallback)

```javascript
if (codigo === 1) return 'APROBADA';
```

---

## 📝 Ejemplos de Respuestas

### ✅ **Caso Exitoso**

```json
{
  "codigo": 1,
  "mensaje": "Aceptado",
  "procesado": true,
  "codigoSeguridad": "ABC123"
}
→ Estado normalizado: "APROBADA"
```

### ⏳ **Caso en Proceso**

```json
{
  "codigo": 95,
  "mensaje": "Documento pendiente por ser enviado a DGII",
  "procesado": true
}
→ Estado normalizado: "EN_PROCESO"
```

### ❌ **Caso de Error**

```json
{
  "codigo": 108,
  "mensaje": "El documento NCF ya fue presentado anteriormente",
  "procesado": false
}
→ Estado normalizado: "NCF_INVALIDO"
```

---

## 🔄 Flujo Típico de Estados

```
1. Envío → codigo: 0 → "APROBADA" (por TheFactoryHKA)
2. Consulta inmediata → codigo: 95 → "EN_PROCESO" (pendiente DGII)
3. Consulta posterior → codigo: 1 → "APROBADA" (aceptado por DGII)
```

---

## 🎨 Códigos de Color para FileMaker

- **Verde** (`#28a745`): APROBADA
- **Amarillo** (`#ffc107`): EN_PROCESO
- **Rojo** (`#dc3545`): NCF_INVALIDO, NCF_VENCIDO, RECHAZADA, DATOS_INVALIDOS
- **Naranja** (`#fd7e14`): RNC_NO_AUTORIZADO
- **Gris** (`#6c757d`): ANULADA, ERROR, DESCONOCIDO
