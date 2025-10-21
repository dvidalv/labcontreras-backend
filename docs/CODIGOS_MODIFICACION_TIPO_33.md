# 📋 Códigos de Modificación para Notas de Débito (Tipo 33)

## 🎯 **¿Qué es el Código de Modificación?**

El **Código de Modificación** es un campo **OBLIGATORIO** en las Notas de Débito (Tipo 33) que indica **por qué se está aumentando el monto** de una factura previamente emitida. Este código debe enviarse desde FileMaker en el campo `Facturas::CodigoModificacion`.

## 📊 **Códigos Disponibles para Tipo 33:**

| Código | Descripción                   | Casos de Uso Típicos                                     | Ejemplo Práctico                                                 |
| ------ | ----------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| **01** | Texto incorrecto              | Corrección de descripciones que implican cargo adicional | Se describió "Consulta básica" pero fue "Consulta especializada" |
| **02** | Valor incorrecto              | Ajuste de montos facturados por debajo del real          | Se facturó RD$1,000 pero debió ser RD$1,500                      |
| **03** | Fecha incorrecta              | Corrección de fechas que afectan tarifas                 | Servicio facturado con tarifa de día común, pero fue día festivo |
| **04** | Referencia a otros documentos | Cargos relacionados con documentos adicionales           | Cargos por órdenes médicas complementarias                       |
| **05** | Otros cargos adicionales      | Servicios adicionales no incluidos en factura original   | Recargos por urgencia, procesamiento especial, insumos extra     |
| **06** | Ajuste de precio              | Cambios de precios o tarifas aplicables                  | Actualización de tarifa vigente al momento del servicio          |

## ✅ **Validaciones del Backend:**

Tu backend **NO valida el código específico** (puede ser "01" a "06"), solo valida que:

1. ✅ El campo `CodigoModificacion` **no esté vacío**
2. ✅ Sea enviado como **string** (no número)
3. ✅ Esté presente en la sección `modificacion`

### **⚠️ Formato correcto desde FileMaker:**

```javascript
// ✅ CORRECTO - Enviar como string con 2 dígitos
Set Variable [ $json ; Value: JSONSetElement ( $json ; "modificacion.CodigoModificacion" ; "01" ; JSONString ) ]

// ✅ CORRECTO - Si viene con ceros iniciales
Set Variable [ $json ; Value: JSONSetElement ( $json ; "modificacion.CodigoModificacion" ; "03" ; JSONString ) ]

// ❌ INCORRECTO - Enviar como número
Set Variable [ $json ; Value: JSONSetElement ( $json ; "modificacion.CodigoModificacion" ; 1 ; JSONNumber ) ]
```

## 🔧 **Comportamiento del Backend:**

```javascript
// Tu backend REMUEVE ceros iniciales automáticamente:
"01" → se envía como "1" a TheFactoryHKA
"03" → se envía como "3" a TheFactoryHKA
"06" → se envía como "6" a TheFactoryHKA

// Código en controllers/comprobantes.js línea 1136:
codigoModificacion: modificacion.CodigoModificacion?.replace(/^0+/, '') || modificacion.CodigoModificacion
```

## 📋 **Ejemplos Completos por Código:**

### **Código 01 - Texto Incorrecto**

**Escenario:** Se facturó "Consulta médica" pero era "Consulta de especialidad"

```json
{
  "factura": {
    "ncf": "E330000000001",
    "tipo": "33",
    "total": "2000.00"
  },
  "items": [
    {
      "nombre": "Diferencia por consulta de especialidad",
      "precio": "2000.00"
    }
  ],
  "modificacion": {
    "CodigoModificacion": "01",
    "NCFModificado": "E310000000098",
    "FechaNCFModificado": "10-09-2025",
    "RazonModificacion": "Corrección: Se facturó consulta general pero fue consulta de especialidad"
  }
}
```

### **Código 02 - Valor Incorrecto**

**Escenario:** Se facturó RD$5,000 por error, debió ser RD$8,000

```json
{
  "factura": {
    "ncf": "E330000000002",
    "tipo": "33",
    "total": "3000.00"
  },
  "items": [
    {
      "nombre": "Ajuste por diferencia de precio",
      "precio": "3000.00"
    }
  ],
  "modificacion": {
    "CodigoModificacion": "02",
    "NCFModificado": "E310000000099",
    "FechaNCFModificado": "12-09-2025",
    "RazonModificacion": "Se facturó RD$5,000 por error, el monto correcto es RD$8,000. Diferencia a cobrar: RD$3,000"
  }
}
```

### **Código 03 - Fecha Incorrecta**

**Escenario:** Servicio en día festivo con tarifa especial no aplicada

```json
{
  "factura": {
    "ncf": "E330000000003",
    "tipo": "33",
    "total": "1500.00"
  },
  "items": [
    {
      "nombre": "Recargo por tarifa de día festivo",
      "precio": "1500.00"
    }
  ],
  "modificacion": {
    "CodigoModificacion": "03",
    "NCFModificado": "E310000000100",
    "FechaNCFModificado": "01-01-2025",
    "RazonModificacion": "Servicio realizado en día festivo (01-01-2025), se aplicó tarifa regular por error. Recargo correspondiente."
  }
}
```

### **Código 04 - Referencia a Otros Documentos**

**Escenario:** Cargos por estudios complementarios ordenados posteriormente

```json
{
  "factura": {
    "ncf": "E330000000004",
    "tipo": "33",
    "total": "15000.00"
  },
  "items": [
    {
      "nombre": "Estudios complementarios según orden médica OM-2025-0145",
      "precio": "15000.00"
    }
  ],
  "modificacion": {
    "CodigoModificacion": "04",
    "NCFModificado": "E310000000101",
    "FechaNCFModificado": "05-09-2025",
    "RazonModificacion": "Cargos adicionales según orden médica complementaria OM-2025-0145 emitida el 06-09-2025"
  }
}
```

### **Código 05 - Otros Cargos Adicionales**

**Escenario:** Servicios adicionales no incluidos en la factura original

```json
{
  "factura": {
    "ncf": "E330000000005",
    "tipo": "33",
    "total": "8500.00"
  },
  "items": [
    {
      "nombre": "Recargo por atención fuera de horario",
      "precio": "3000.00"
    },
    {
      "nombre": "Insumos médicos especiales no incluidos",
      "precio": "4500.00"
    },
    {
      "nombre": "Cargo por procesamiento urgente de resultados",
      "precio": "1000.00"
    }
  ],
  "modificacion": {
    "CodigoModificacion": "05",
    "NCFModificado": "E310000000102",
    "FechaNCFModificado": "08-09-2025",
    "RazonModificacion": "Cargos adicionales no incluidos en factura original: atención fuera de horario, insumos especiales y procesamiento urgente"
  }
}
```

### **Código 06 - Ajuste de Precio**

**Escenario:** Actualización de tarifa vigente no aplicada

```json
{
  "factura": {
    "ncf": "E330000000006",
    "tipo": "33",
    "total": "4500.00"
  },
  "items": [
    {
      "nombre": "Ajuste por actualización de tarifa",
      "precio": "4500.00"
    }
  ],
  "modificacion": {
    "CodigoModificacion": "06",
    "NCFModificado": "E310000000103",
    "FechaNCFModificado": "10-09-2025",
    "RazonModificacion": "Ajuste de tarifa según resolución No. 2025-045 vigente desde el 01-09-2025. Diferencia entre tarifa anterior y actual."
  }
}
```

## 🏥 **Casos de Uso Específicos para Clínica:**

### **1. Servicios Adicionales No Incluidos (MÁS COMÚN):**

- **Código recomendado:** `05` - Otros cargos adicionales
- **Ejemplos:**
  - Estudios complementarios solicitados después
  - Insumos médicos especiales no incluidos originalmente
  - Medicamentos administrados durante procedimiento
  - Interconsultas con especialistas adicionales

### **2. Recargos por Urgencia/Horario:**

- **Código recomendado:** `05` - Otros cargos adicionales
- **Ejemplos:**
  - Atención fuera de horario regular
  - Procesamiento urgente de resultados
  - Servicios en días festivos
  - Atención de emergencia con recargo

### **3. Cargos por Órdenes Médicas Adicionales:**

- **Código recomendado:** `04` - Referencia a otros documentos
- **Ejemplos:**
  - Estudios ordenados posteriormente por el médico
  - Procedimientos complementarios según nueva orden
  - Referencias a órdenes médicas específicas

### **4. Corrección de Tarifas:**

- **Código recomendado:** `02` - Valor incorrecto o `06` - Ajuste de precio
- **Ejemplos:**
  - Se aplicó tarifa incorrecta (usar `02`)
  - Actualización de lista de precios (usar `06`)
  - Diferencia por tipo de aseguradora

### **5. Servicios Mal Clasificados:**

- **Código recomendado:** `01` - Texto incorrecto
- **Ejemplos:**
  - Se facturó consulta general pero fue especializada
  - Se describió como procedimiento simple pero fue complejo
  - Error en la descripción del servicio que afecta el precio

## 🔍 **Validaciones que Realiza Tu Backend:**

```javascript
// 1. Validar que existe el campo
if (!facturaAdaptada.codigoModificacion) {
  throw new Error("❌ Tipo 33 requiere 'codigoModificacion'");
}

// 2. Validar que existe la razón
if (!facturaAdaptada.razonModificacion) {
  throw new Error("❌ Tipo 33 requiere 'razonModificacion'");
}

// 3. Validar que existe el NCF modificado
if (!facturaAdaptada.ncfModificado) {
  throw new Error("❌ Tipo 33 requiere 'ncfModificado'");
}

// 4. Validar que existe la fecha del NCF modificado
if (!facturaAdaptada.fechaNCFModificado) {
  throw new Error("❌ Tipo 33 requiere 'fechaNCFModificado'");
}
```

## 📱 **Configuración en FileMaker:**

### **Campo en la Tabla:**

```
Facturas::CodigoModificacion (Text, 2 caracteres)
```

### **Lista de Valores Recomendada:**

```
01 - Texto incorrecto
02 - Valor incorrecto
03 - Fecha incorrecta
04 - Referencia a otros documentos
05 - Otros cargos adicionales ⭐ (MÁS COMÚN)
06 - Ajuste de precio
```

### **Script de Validación:**

```javascript
# Validar que el código esté en el rango correcto
If [ Facturas::CodigoModificacion < "01" or Facturas::CodigoModificacion > "06" ]
    Show Custom Dialog [ "Error" ; "Código de modificación debe estar entre 01 y 06" ]
    Exit Script [ Text Result: "Error" ]
End If
```

## ⚠️ **Notas Importantes:**

1. **📝 Razón de Modificación:** Debe ser **descriptiva y clara**, explicando exactamente por qué se genera el cargo adicional.

2. **📅 Fecha del NCF Modificado:** Debe coincidir **exactamente** con la fecha de emisión de la factura original (código DGII 634 si no coincide).

3. **💰 Monto:** El total de la Nota de Débito debe ser **solo el cargo adicional**, NO el total acumulado con la factura original.

4. **🔗 NCF Modificado:** Debe ser un NCF **válido y previamente emitido** (usualmente tipo 31 o 32).

## 🚀 **Flujo Completo desde FileMaker:**

```mermaid
graph TD
    A[Usuario ingresa datos] --> B{¿Código 01-06?}
    B -->|No| C[Mostrar error]
    B -->|Sí| D[Validar NCF original existe]
    D --> E[Construir JSON con JSONSetElement]
    E --> F[Enviar a /comprobantes/enviar-electronica]
    F --> G{¿Respuesta exitosa?}
    G -->|Sí| H[Guardar código de seguridad]
    G -->|No| I[Mostrar error DGII]
```

## ✅ **Checklist antes de Enviar:**

- [ ] Código de modificación entre "01" y "06"
- [ ] NCF modificado existe y está aprobado
- [ ] Fecha del NCF modificado es correcta
- [ ] Razón de modificación es descriptiva (mínimo 10 caracteres)
- [ ] RNC del comprador es válido (tipo 33 NO permite consumidor final)
- [ ] Items describen claramente los cargos adicionales
- [ ] Total es SOLO el cargo adicional, no el acumulado

---

**Última actualización:** Octubre 2025  
**Versión API:** Compatible con TheFactoryHKA v2.0+
