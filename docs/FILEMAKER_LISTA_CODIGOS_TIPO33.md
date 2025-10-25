# 📋 FileMaker: Lista de Valores para Códigos de Modificación (Tipo 33)

## 🎯 **Lista Desplegable Recomendada**

### **Opción 1: Lista Completa (Todos los Códigos)**

```
01 - Intereses por mora
02 - Costos de cobranza
03 - Gastos de transporte
04 - Bonificaciones y rebajas
05 - Referencia a Factura de Consumo (E32 - Uso Especial)
06 - Otros cargos adicionales
```

**Valor por defecto:** `06`

---

### **Opción 2: Lista Simplificada (Recomendada para Clínicas)** ⭐

```
01 - Intereses por mora
03 - Gastos de transporte
06 - Otros cargos adicionales
```

**Valor por defecto:** `06`

**Por qué esta lista:** Cubre el 95% de los casos de uso reales en clínicas. Los códigos 02, 04 y 05 son muy poco usados.

---

## 🔧 **Configuración en FileMaker**

### **Paso 1: Crear Campo de Lista de Valores**

```filemaker
Campo: CodigoModificacion
Tipo: Text
Control: Popup Menu (o Dropdown List)
Lista de Valores: "Codigos_Nota_Debito_Tipo33"
```

### **Paso 2: Definir Lista de Valores**

**Nombre:** `Codigos_Nota_Debito_Tipo33`

**Valores:**

⚠️ **IMPORTANTE:** Los códigos DEBEN tener siempre 2 dígitos (incluir el cero inicial)

```
Opción Simplificada:
01
03
06

O Opción Completa:
01
02
03
04
05
06
```

### **Paso 3: Definir Etiquetas Descriptivas**

Usa **"Usar valores de segundo campo como etiquetas de visualización"**

**Campo 1 (Valor):** Código numérico
**Campo 2 (Etiqueta):** Descripción

```
Valor | Etiqueta
------|----------
01    | Intereses por mora
02    | Costos de cobranza
03    | Gastos de transporte
04    | Bonificaciones y rebajas
05    | Referencia a Factura de Consumo (E32 - Uso Especial)
06    | Otros cargos adicionales
```

---

## 💡 **Configuración Recomendada con Auto-Complete**

```filemaker
// Script: Configurar_Nota_Debito_Nuevo

// Al crear nueva Nota de Débito, pre-seleccionar código 06
Set Field [ Facturas::CodigoModificacion ; "06" ]
Set Field [ Facturas::RazonModificacion ; "Cargos adicionales por " ]  // Prefijo

// Colocar cursor en campo Razón para que el usuario complete
Go to Field [ Facturas::RazonModificacion ]
```

---

## 🎨 **Formato Condicional (Opcional)**

Para advertir sobre código 05:

```filemaker
// Formato Condicional en campo CodigoModificacion
If ( Facturas::CodigoModificacion = "05" )
  Fill Color: RGB(255, 200, 200)  // Rojo claro
  TextColor: RGB(200, 0, 0)       // Rojo oscuro
End If
```

---

## 📝 **Ayuda Contextual (Tooltip)**

```filemaker
Campo: CodigoModificacion

Tooltip:
"Código 06 (Otros cargos adicionales) cubre la mayoría de casos.

⚠️ Código 05: Solo usar si modificas Factura de Consumo (E32)"
```

---

## 🔍 **Validación del Campo**

```filemaker
// Validación personalizada
If ( Facturas::CodigoModificacion = "05" and
     Left ( Facturas::NCFModificado ; 3 ) ≠ "E32" )

  Show Custom Dialog [ "Advertencia" ;
    "El código 05 solo debe usarse para modificar Facturas de Consumo (E32).

    Tu NCF modificado es tipo " & Middle ( Facturas::NCFModificado ; 2 ; 2 ) & ".

    ¿Quieres usar código 06 en su lugar?" ;
    Buttons: "Sí, usar 06" ; "No, mantener 05" ]

  If [ Get ( LastMessageChoice ) = 1 ]
    Set Field [ Facturas::CodigoModificacion ; "06" ]
  End If

End If
```

---

## 🎯 **Script Completo: Validar Código Modificación**

```filemaker
# Script: Validar_Codigo_Modificacion_Tipo33
# Trigger: OnObjectExit en campo CodigoModificacion

# Variables
Set Variable [ $codigo ; Value: Facturas::CodigoModificacion ]
Set Variable [ $ncfModificado ; Value: Facturas::NCFModificado ]
Set Variable [ $tipoNCF ; Value: Middle ( $ncfModificado ; 2 ; 2 ) ]

# Validación 1: Campo no vacío
If [ IsEmpty ( $codigo ) ]
  Show Custom Dialog [ "Error" ; "El código de modificación es obligatorio" ]
  Exit Script [ Text Result: "ERROR" ]
End If

# Validación 1.5: Asegurar formato de 2 dígitos (con cero inicial)
If [ Length ( $codigo ) = 1 ]
  # Si el código tiene 1 solo dígito, agregar cero inicial
  Set Variable [ $codigo ; Value: "0" & $codigo ]
  Set Field [ Facturas::CodigoModificacion ; $codigo ]
End If

# Validación 2: Código 05 solo para E32
If [ $codigo = "05" and $tipoNCF ≠ "32" ]
  Show Custom Dialog [ "Advertencia - Código 05" ;
    "El código 05 (Referencia a Factura de Consumo) solo debe usarse para modificar NCF tipo E32 (Factura de Consumo).

    Tu NCF modificado es tipo E" & $tipoNCF & " (Factura de Crédito Fiscal).

    Para cargos adicionales en facturas E31, usa código 06." ;
    Buttons: "Usar código 06" ; "Mantener código 05" ]

  If [ Get ( LastMessageChoice ) = 1 ]
    Set Field [ Facturas::CodigoModificacion ; "06" ]
    Set Field [ Facturas::RazonModificacion ; "Cargos adicionales por " ]
    Go to Field [ Facturas::RazonModificacion ]
  End If
End If

# Validación 3: Sugerir razón por defecto según código
If [ IsEmpty ( Facturas::RazonModificacion ) ]
  Case (
    $codigo = "01" ; Set Field [ Facturas::RazonModificacion ; "Intereses por mora según contrato" ] ;
    $codigo = "03" ; Set Field [ Facturas::RazonModificacion ; "Gastos de transporte urgente de " ] ;
    $codigo = "04" ; Set Field [ Facturas::RazonModificacion ; "Anulación de bonificación aplicada incorrectamente" ] ;
    $codigo = "06" ; Set Field [ Facturas::RazonModificacion ; "Cargos adicionales por " ]
  )
  Go to Field [ Facturas::RazonModificacion ]
End If

Exit Script [ Text Result: "OK" ]
```

---

## 📊 **Layout Recomendado**

```
┌─────────────────────────────────────────┐
│  NOTA DE DÉBITO (Tipo 33)              │
├─────────────────────────────────────────┤
│                                         │
│  Factura Original a Modificar:         │
│  ┌─────────────────────┐               │
│  │ E310000000167       │ [🔍 Buscar]   │
│  └─────────────────────┘               │
│  Fecha: 16-10-2025                      │
│                                         │
│  Motivo de la Nota de Débito:          │
│  ┌─────────────────────┐               │
│  │ 06 - Otros cargos ▼ │               │
│  └─────────────────────┘               │
│                                         │
│  Razón detallada:                       │
│  ┌─────────────────────────────────┐   │
│  │ Cargos adicionales por          │   │
│  │ _____________________________   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [💡 Tip: Usa código 06 para la        │
│   mayoría de cargos adicionales]       │
│                                         │
└─────────────────────────────────────────┘
```

---

## ✅ **Checklist de Implementación**

- [ ] Crear campo `CodigoModificacion` (Text)
- [ ] Crear lista de valores `Codigos_Nota_Debito_Tipo33`
- [ ] Configurar lista con etiquetas descriptivas
- [ ] Establecer valor por defecto `06`
- [ ] Agregar tooltip de ayuda
- [ ] Implementar validación de código 05
- [ ] Configurar formato condicional (opcional)
- [ ] Agregar script de auto-complete para razón
- [ ] Probar con diferentes escenarios

---

## 🎯 **Resumen para el Usuario Final**

**"¿Qué código usar?"**

```
┌─────────────────────────────────────────────┐
│                                             │
│  🎯 ¿Qué código de modificación usar?      │
│                                             │
│  ✅ SI TIENES DUDA → USA CÓDIGO 06         │
│                                             │
│  Código 06 cubre:                           │
│  • Servicios adicionales                    │
│  • Insumos extras                           │
│  • Procesamiento urgente                    │
│  • Estudios complementarios                 │
│  • Cualquier cargo adicional general        │
│                                             │
│  ⚠️ Código 05: MUY RARO                     │
│  Solo si modificas Factura de Consumo (E32) │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📞 **Soporte**

Si el sistema rechaza tu código de modificación:

1. **Verifica el tipo de NCF original**

   - ¿Es E31, E32, E33 o E34?

2. **Si es E31 (lo más común)**

   - Usa código **06** para cargos adicionales

3. **Si es E32 (raro en clínicas)**

   - Puedes usar código **05** si aplica

4. **Cualquier otro caso**
   - Usa código **06** (el más seguro)
