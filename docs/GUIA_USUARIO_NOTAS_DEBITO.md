# 📋 Guía del Usuario: Notas de Débito (Tipo 33)

## 🎯 ¿Qué es una Nota de Débito?

Una **Nota de Débito** es un documento que **aumenta el monto** de una factura ya emitida. Se usa cuando necesitas cobrar algo adicional después de haber enviado la factura original.

---

## 🏥 **Casos de Uso en la Clínica:**

### ✅ **Cuándo Crear una Nota de Débito:**

1. **Servicios adicionales no incluidos** (más común)

   - Estudios complementarios solicitados después
   - Insumos médicos especiales no previstos
   - Procesamiento urgente de resultados

2. **Corrección de montos**

   - Se facturó menos de lo debido
   - Se aplicó un descuento que no correspondía

3. **Intereses por mora**

   - El cliente pagó después de la fecha límite

4. **Gastos de transporte**
   - Envío urgente de resultados
   - Traslado de muestras a laboratorio externo

---

## 📝 **Códigos de Modificación: Guía Simplificada**

### **🔹 Los 3 Códigos Más Usados:**

| Código | Cuándo Usarlo                | Ejemplo                                                  |
| ------ | ---------------------------- | -------------------------------------------------------- |
| **06** | **Otros cargos adicionales** | ✅ **USAR ESTE POR DEFECTO** - Cubre el 80% de los casos |
| **01** | Intereses por mora           | Cliente pagó tarde, cobrar intereses                     |
| **03** | Gastos de transporte         | Envío urgente de resultados                              |

### **🔹 Códigos Menos Comunes:**

| Código | Cuándo Usarlo                          | Ejemplo                                                 |
| ------ | -------------------------------------- | ------------------------------------------------------- |
| **02** | Costos de cobranza                     | Gastos administrativos por gestión de cobranza          |
| **04** | Bonificaciones incorrectas             | Se aplicó descuento que no debía aplicarse              |
| **05** | ⚠️ **Referencia a Factura de Consumo** | **MUY RARO** - Solo si modificas NCF tipo E32 (Consumo) |

---

## 🚀 **Proceso Rápido: Crear Nota de Débito**

### **Paso 1: Información Básica**

```
NCF Tipo 33:        E330000000XXX (asignado automáticamente)
Fecha de Emisión:   (fecha actual)
Total a Cobrar:     RD$ (monto del cargo adicional)
```

### **Paso 2: Factura Original**

```
NCF Original:       E310000000XXX (la factura que vas a modificar)
Fecha Original:     (fecha exacta de la factura original)
```

### **Paso 3: Motivo (Código de Modificación)**

**✅ RECOMENDACIÓN:** Si no estás seguro, **siempre usa código 06**

```
Código:    06 - Otros cargos adicionales
Razón:     (descripción clara del cargo)
```

**Ejemplo de razón:**

- "Cargos adicionales por estudios complementarios no incluidos en la factura original"
- "Recargo por procesamiento urgente de resultados solicitado posteriormente"
- "Insumos médicos especiales requeridos durante el procedimiento"

### **Paso 4: Items**

```
Item 1:
  Nombre:     Estudios complementarios
  Precio:     RD$ 5,000.00

Item 2:
  Nombre:     Procesamiento urgente
  Precio:     RD$ 1,500.00
```

---

## ⚠️ **Errores Comunes y Soluciones**

### **Error 1: "El código de modificación no puede ser utilizado en este tipo de comprobante"**

**Causa:** Usaste código **05** para modificar una factura tipo E31

**Solución:** Cambia a código **06** (Otros cargos adicionales)

---

### **Error 2: "FechaNCFModificado no coincide"**

**Causa:** La fecha de la factura original no coincide con la registrada en DGII

**Solución:** Verifica la fecha exacta de la factura original en el sistema

---

### **Error 3: "Los comprobantes no pueden reemplazarse entre ellos mismos"**

**Causa:** El NCF original ya tiene una nota de débito/crédito

**Solución:** Crea una nueva nota de débito sobre la nota anterior (no sobre la factura original)

---

## 📊 **Tabla de Decisión Rápida**

| Situación              | Código a Usar | Razón Sugerida                                          |
| ---------------------- | ------------- | ------------------------------------------------------- |
| Servicios adicionales  | **06**        | "Cargos adicionales por servicios complementarios"      |
| Insumos extras         | **06**        | "Insumos médicos especiales no incluidos originalmente" |
| Procesamiento urgente  | **06**        | "Recargo por procesamiento urgente de resultados"       |
| Cliente pagó tarde     | **01**        | "Intereses por mora según contrato"                     |
| Envío urgente          | **03**        | "Gastos de transporte urgente de resultados"            |
| Descuento aplicado mal | **04**        | "Anulación de descuento aplicado incorrectamente"       |

---

## 💡 **Consejos Prácticos**

### ✅ **Buenas Prácticas:**

1. **Usa siempre código 06 cuando tengas duda**

   - Es el más flexible y cubre la mayoría de casos

2. **Sé específico en la razón de modificación**

   - Mal: "Cargos adicionales"
   - Bien: "Cargos adicionales por estudios complementarios solicitados el 10/10/2025"

3. **Verifica la fecha de la factura original**

   - Debe ser la fecha exacta de emisión, no la fecha de pago

4. **Mantén el monto claro**
   - El total de la Nota de Débito es SOLO el monto adicional
   - No sumes el monto de la factura original

### ❌ **Evita:**

1. **No uses código 05** a menos que realmente estés modificando una factura de consumo (E32)

2. **No inventes razones vagas**

   - La DGII puede auditar y pedir detalles

3. **No modifiques documentos ya modificados**
   - Si ya existe una nota de débito/crédito, consulta primero

---

## 🔍 **Validaciones Automáticas del Sistema**

El sistema valida automáticamente:

✅ Que el NCF original exista
✅ Que no esté vencido
✅ Que la fecha coincida con la registrada en DGII
✅ Que no esté ya anulado

---

## 📞 **¿Necesitas Ayuda?**

Si tienes dudas:

1. **Usa código 06** - Es el más seguro
2. Revisa los ejemplos en esta guía
3. Consulta con el departamento de facturación

---

## 📅 **Recordatorio: Fechas**

**Fecha de Emisión de la Nota de Débito:**

- Fecha actual (cuando la creas)

**Fecha NCF Modificado (FechaNCFModificado):**

- **MUY IMPORTANTE:** Fecha exacta de la factura ORIGINAL
- Debe coincidir con la fecha registrada en DGII
- Si no estás seguro, verifica en el portal de TheFactoryHKA

---

## ✅ **Checklist Final Antes de Enviar**

- [ ] ¿El NCF es tipo E33?
- [ ] ¿El NCF original es correcto?
- [ ] ¿La fecha del NCF original es exacta?
- [ ] ¿El código de modificación es 06? (en la mayoría de casos)
- [ ] ¿La razón de modificación es clara y específica?
- [ ] ¿El total es solo el cargo adicional (no incluye el monto original)?
- [ ] ¿Los items están bien detallados?

---

**💡 TIP FINAL:** Cuando tengas duda sobre el código de modificación, **usa el 06 (Otros cargos adicionales)** - Es el más flexible y cubre la mayoría de situaciones en la clínica.
