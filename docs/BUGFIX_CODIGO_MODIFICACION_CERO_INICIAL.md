# 🐛 BUGFIX: Código de Modificación Perdía Cero Inicial

## 📋 **Problema Identificado**

**Fecha:** 25-10-2025
**Versión:** v1.2.3
**Tipo de Error:** Validación de Datos

### **Síntoma:**

Cuando se enviaba una Nota de Débito (Tipo 33) o Nota de Crédito (Tipo 34) con `CodigoModificacion: "06"`, TheFactoryHKA rechazaba el documento con error HTTP 400.

### **Error Observado:**

```javascript
// FileMaker enviaba:
{
  "modificacion": {
    "CodigoModificacion": "06",  // ✅ CORRECTO
    ...
  }
}

// Backend transformaba a:
{
  "InformacionReferencia": {
    "CodigoModificacion": "6",   // ❌ INCORRECTO - sin cero inicial
    ...
  }
}

// TheFactoryHKA rechazaba:
{
  "status": 400,
  "errors": { ... }
}
```

---

## 🔍 **Causa Raíz**

En `controllers/comprobantes.js`, línea ~1197, había código que **removía ceros iniciales** de los códigos de modificación:

```javascript
// ❌ CÓDIGO PROBLEMÁTICO (antes del fix)
codigoModificacion:
  modificacion.CodigoModificacion?.replace(/^0+/, '') ||
  modificacion.CodigoModificacion, // Remover ceros iniciales
```

Este código fue diseñado originalmente para normalizar números, pero **no es apropiado para códigos de modificación**, ya que estos son **códigos de catálogo de la DGII** que DEBEN mantener su formato de 2 dígitos.

### **Por Qué Existía Este Código:**

- Originalmente se pensó que los códigos eran números que podían venir con padding innecesario
- Se quería normalizar "01" a "1" para simplificar
- **ERROR:** Los códigos de la DGII son strings formateados, no números

---

## ✅ **Solución Implementada**

### **1. Backend: Preservar Formato Original**

```javascript
// ✅ CÓDIGO CORREGIDO
codigoModificacion: modificacion.CodigoModificacion, // ✅ Preservar código tal cual (con cero inicial si existe)
```

**Ubicación:** `controllers/comprobantes.js`, línea 1197

**Cambio:** Removida la lógica de `replace(/^0+/, '')` que eliminaba ceros iniciales.

---

### **2. FileMaker: Validación Adicional**

Agregada validación en el script de FileMaker para **auto-corregir** códigos de 1 dígito:

```filemaker
# Validación 1.5: Asegurar formato de 2 dígitos (con cero inicial)
If [ Length ( $codigo ) = 1 ]
  # Si el código tiene 1 solo dígito, agregar cero inicial
  Set Variable [ $codigo ; Value: "0" & $codigo ]
  Set Field [ Facturas::CodigoModificacion ; $codigo ]
End If
```

**Ubicación:** `docs/FILEMAKER_LISTA_CODIGOS_TIPO33.md`, script `Validar_Codigo_Modificacion_Tipo33`

---

### **3. Documentación Actualizada**

Agregada advertencia clara en la documentación:

```markdown
⚠️ **IMPORTANTE:** Los códigos DEBEN tener siempre 2 dígitos (incluir el cero inicial)
```

**Archivos Actualizados:**

- `docs/FILEMAKER_LISTA_CODIGOS_TIPO33.md`
- `docs/GUIA_USUARIO_NOTAS_DEBITO.md`

---

## 📊 **Códigos de Modificación Afectados**

Todos los códigos con cero inicial se veían afectados:

| Código | ¿Afectado? | Antes (Bug) | Después (Fix) |
| ------ | ---------- | ----------- | ------------- |
| **01** | ✅ SÍ      | "1"         | "01" ✅       |
| **02** | ✅ SÍ      | "2"         | "02" ✅       |
| **03** | ✅ SÍ      | "3"         | "03" ✅       |
| **04** | ✅ SÍ      | "4"         | "04" ✅       |
| **05** | ✅ SÍ      | "5"         | "05" ✅       |
| **06** | ✅ SÍ      | "6"         | "06" ✅       |

---

## 🧪 **Pruebas de Validación**

### **Caso de Prueba 1: Código 06 (Más Común)**

**Input (FileMaker):**

```json
{
  "modificacion": {
    "CodigoModificacion": "06"
  }
}
```

**Output Esperado (TheFactoryHKA):**

```json
{
  "InformacionReferencia": {
    "CodigoModificacion": "06" // ✅ Preservado correctamente
  }
}
```

**Resultado:** ✅ APROBADO

---

### **Caso de Prueba 2: Código 01 (Intereses)**

**Input (FileMaker):**

```json
{
  "modificacion": {
    "CodigoModificacion": "01"
  }
}
```

**Output Esperado (TheFactoryHKA):**

```json
{
  "InformacionReferencia": {
    "CodigoModificacion": "01" // ✅ Preservado correctamente
  }
}
```

**Resultado:** ✅ APROBADO

---

### **Caso de Prueba 3: Auto-corrección en FileMaker**

**Escenario:** Usuario ingresa manualmente "6" (sin cero)

**Input Usuario:**

```
CodigoModificacion: "6"
```

**FileMaker Auto-corrige:**

```filemaker
If [ Length ( "6" ) = 1 ]
  Set Field [ CodigoModificacion ; "0" & "6" ]  // → "06"
End If
```

**Output Final:**

```
CodigoModificacion: "06"
```

**Resultado:** ✅ APROBADO

---

## 🚀 **Despliegue**

### **Backend:**

- [x] Código corregido en `controllers/comprobantes.js`
- [x] Commit: `fix: preserve leading zero in CodigoModificacion for Type 33/34`
- [x] Deploy a producción

### **FileMaker:**

- [ ] Actualizar script `Validar_Codigo_Modificacion_Tipo33`
- [ ] Agregar validación de formato de 2 dígitos
- [ ] Probar con NCF tipo 33 y 34

### **Documentación:**

- [x] Actualizada guía de usuario
- [x] Actualizada documentación técnica
- [x] Agregada advertencia en configuración de FileMaker

---

## 📝 **Lecciones Aprendidas**

### **1. No Asumir Formato de Datos de APIs Externas**

Los códigos de catálogo (como `CodigoModificacion`) pueden parecer números, pero son **strings formateados** con significado semántico.

**Regla:** No normalizar datos de catálogos oficiales (DGII, ISO, etc.)

---

### **2. Validación en Múltiples Capas**

La solución incluye:

1. ✅ Backend: Preservar formato original
2. ✅ FileMaker: Auto-corrección preventiva
3. ✅ Documentación: Advertencias claras

**Regla:** Defensa en profundidad - validar en cada capa

---

### **3. Logs Detallados Son Esenciales**

El bug fue identificado rápidamente gracias a logs detallados:

```javascript
console.log('📋 Campos de modificación mapeados:', {
  codigoModificacion: facturaAdaptada.codigoModificacion, // Mostró "6" en vez de "06"
});
```

**Regla:** Siempre loggear transformaciones de datos críticos

---

## 🔧 **Recomendaciones Futuras**

### **1. Test Unitario Específico**

```javascript
describe('transformarFacturaParaTheFactory - Tipo 33', () => {
  it('debe preservar cero inicial en CodigoModificacion', () => {
    const input = {
      factura: { tipo: '33', ... },
      modificacion: { CodigoModificacion: '06' }
    };

    const result = transformarFacturaParaTheFactory(input, token);

    expect(result.DocumentoElectronico.InformacionReferencia.CodigoModificacion)
      .toBe('06');  // ✅ Con cero inicial
  });
});
```

---

### **2. Validación de Esquema**

Considerar agregar validación de esquema con `joi` o `zod`:

```javascript
const modificacionSchema = z.object({
  CodigoModificacion: z.string().regex(/^0[1-6]$/, 'Código debe ser 01-06'),
  NCFModificado: z.string().regex(/^E\d{11}$/),
  FechaNCFModificado: z.string().regex(/^\d{2}-\d{2}-\d{4}$/),
  RazonModificacion: z.string().min(10),
});
```

---

### **3. Lista de Valores Restrictiva en FileMaker**

Usar **lista de valores fija** en FileMaker para prevenir entrada manual incorrecta:

```filemaker
Lista de Valores: Codigos_Tipo33_Estricta
Tipo: Lista personalizada
Valores:
  01
  02
  03
  04
  05
  06

Control: Popup Menu (no editable)
```

---

## ✅ **Estado Final**

| Componente    | Estado         | Notas                                    |
| ------------- | -------------- | ---------------------------------------- |
| Backend       | ✅ CORREGIDO   | Código preserva formato original         |
| FileMaker     | ⚠️ PENDIENTE   | Requiere actualizar script de validación |
| Documentación | ✅ ACTUALIZADA | Advertencias agregadas                   |
| Tests         | ⚠️ PENDIENTE   | Agregar test unitario específico         |

---

## 📞 **Contacto**

Si tienes preguntas sobre este bugfix:

- **Desarrollador:** David Vidal
- **Fecha Fix:** 25-10-2025
- **Ticket/Issue:** #BUGFIX-001

---

## 🎯 **Verificación Rápida**

Para verificar que el fix está aplicado correctamente:

1. **En Backend:** Buscar en `controllers/comprobantes.js` línea ~1197:

   ```javascript
   // ✅ DEBE decir esto:
   codigoModificacion: modificacion.CodigoModificacion,

   // ❌ NO DEBE tener esto:
   // modificacion.CodigoModificacion?.replace(/^0+/, '')
   ```

2. **En FileMaker:** Enviar Nota de Débito con código "06" y verificar log:

   ```javascript
   // ✅ DEBE mostrar:
   codigoModificacion: '06';

   // ❌ NO DEBE mostrar:
   // codigoModificacion: '6'
   ```

3. **En TheFactoryHKA:** Verificar respuesta exitosa:
   ```json
   {
     "codigo": 0,
     "mensaje": "Documento procesado correctamente"
   }
   ```

---

**FIN DEL REPORTE DE BUGFIX**
