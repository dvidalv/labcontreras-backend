# 📋 Formatos de Anulación - Comparación

## 🎯 3 Formas de Anular Comprobantes

Este endpoint soporta **3 formatos diferentes** para máxima flexibilidad:

---

## ✅ Formato 1: Un Solo Comprobante (RECOMENDADO)

**Cuándo usar**: Cuando solo necesitas anular **UN** comprobante específico (caso más común).

### JSON:

```json
{
  "rnc": "130960054",
  "anulaciones": [
    {
      "tipoDocumento": "31",
      "ncf": "E310000000098"
    }
  ]
}
```

### FileMaker (Funciones JSON - RECOMENDADO):

```fmscript
# Usando JSONSetElement (más limpio)
Set Variable [ $json ; Value: "{}" ]
Set Variable [ $json ; Value: JSONSetElement ( $json ;
    [ "rnc" ; $rnc ; JSONString ] ;
    [ "anulaciones[0].tipoDocumento" ; $tipo ; JSONString ] ;
    [ "anulaciones[0].ncf" ; $ncf ; JSONString ]
) ]
```

### FileMaker (String manual - no recomendado):

```fmscript
# Forma antigua (propensa a errores)
Set Variable [ $json ; Value:
    "{\"rnc\":\"" & $rnc & "\"," &
    "\"anulaciones\":[{" &
    "\"tipoDocumento\":\"" & $tipo & "\"," &
    "\"ncf\":\"" & $ncf & "\"" &
    "}]}"
]
```

### Lo que envía al backend de TheFactory:

```json
{
  "token": "...",
  "Anulacion": {
    "Encabezado": {
      "RNC": "130960054",
      "Cantidad": "01",
      "FechaHoraAnulacioneNCF": "09-10-2024 14:30:00"
    },
    "DetallesAnulacion": [
      {
        "NumeroLinea": "1",
        "TipoDocumento": "31",
        "TablaSecuenciasAnuladas": [
          {
            "NCFDesde": "E310000000098",
            "NCFHasta": "E310000000098"
          }
        ],
        "Cantidad": "01"
      }
    ]
  }
}
```

**Ventajas**:

- ✅ Más simple y conciso
- ✅ Menos caracteres que escribir
- ✅ Más claro semánticamente
- ✅ Ideal para FileMaker

---

## 📄 Formato 2: Un Solo Comprobante (Alternativo)

**Cuándo usar**: Cuando prefieres usar `ncfDesde` pero solo necesitas anular uno.

### JSON:

```json
{
  "rnc": "130960054",
  "anulaciones": [
    {
      "tipoDocumento": "31",
      "ncfDesde": "E310000000098"
    }
  ]
}
```

### FileMaker:

```fmscript
Set Variable [ $json ; Value:
    "{\"rnc\":\"" & $rnc & "\"," &
    "\"anulaciones\":[{" &
    "\"tipoDocumento\":\"" & $tipo & "\"," &
    "\"ncfDesde\":\"" & $ncfDesde & "\"" &
    "}]}"
]
```

### Lo que envía al backend de TheFactory:

```json
{
  "token": "...",
  "Anulacion": {
    "Encabezado": {
      "RNC": "130960054",
      "Cantidad": "01",
      "FechaHoraAnulacioneNCF": "09-10-2024 14:30:00"
    },
    "DetallesAnulacion": [
      {
        "NumeroLinea": "1",
        "TipoDocumento": "31",
        "TablaSecuenciasAnuladas": [
          {
            "NCFDesde": "E310000000098",
            "NCFHasta": "E310000000098"
          }
        ],
        "Cantidad": "01"
      }
    ]
  }
}
```

**Nota**: El endpoint detecta automáticamente que solo enviaste `ncfDesde` y copia ese valor a `ncfHasta`.

---

## 📊 Formato 3: Rango de Comprobantes

**Cuándo usar**: Cuando necesitas anular **múltiples** comprobantes consecutivos.

### JSON:

```json
{
  "rnc": "130960054",
  "anulaciones": [
    {
      "tipoDocumento": "31",
      "ncfDesde": "E310000000098",
      "ncfHasta": "E310000000105"
    }
  ]
}
```

### FileMaker:

```fmscript
Set Variable [ $json ; Value:
    "{\"rnc\":\"" & $rnc & "\"," &
    "\"anulaciones\":[{" &
    "\"tipoDocumento\":\"" & $tipo & "\"," &
    "\"ncfDesde\":\"" & $ncfDesde & "\"," &
    "\"ncfHasta\":\"" & $ncfHasta & "\"" &
    "}]}"
]
```

### Lo que envía al backend de TheFactory:

```json
{
  "token": "...",
  "Anulacion": {
    "Encabezado": {
      "RNC": "130960054",
      "Cantidad": "08",
      "FechaHoraAnulacioneNCF": "09-10-2024 14:30:00"
    },
    "DetallesAnulacion": [
      {
        "NumeroLinea": "1",
        "TipoDocumento": "31",
        "TablaSecuenciasAnuladas": [
          {
            "NCFDesde": "E310000000098",
            "NCFHasta": "E310000000105"
          }
        ],
        "Cantidad": "08"
      }
    ]
  }
}
```

**Nota**: El endpoint calcula automáticamente la cantidad: (105 - 98) + 1 = 8

---

## 🔄 Comparación Lado a Lado

| Aspecto              | Formato 1 (`ncf`)    | Formato 2 (`ncfDesde` solo) | Formato 3 (`ncfDesde` + `ncfHasta`) |
| -------------------- | -------------------- | --------------------------- | ----------------------------------- |
| **Caso de uso**      | Un solo comprobante  | Un solo comprobante         | Rango de comprobantes               |
| **Caracteres JSON**  | Menos                | Medio                       | Más                                 |
| **Simplicidad**      | ⭐⭐⭐⭐⭐           | ⭐⭐⭐⭐                    | ⭐⭐⭐                              |
| **Claridad**         | Muy clara            | Clara                       | Clara                               |
| **FileMaker**        | Más fácil            | Fácil                       | Requiere 2 campos                   |
| **Recomendado para** | Anulación individual | Anulación individual        | Anulación masiva                    |

---

## 🎬 Ejemplos Reales

### Caso 1: Cliente que canceló una factura

```json
{
  "rnc": "130960054",
  "anulaciones": [
    {
      "tipoDocumento": "31",
      "ncf": "E310000005678"
    }
  ]
}
```

### Caso 2: Error en secuencia, anular 10 facturas

```json
{
  "rnc": "130960054",
  "anulaciones": [
    {
      "tipoDocumento": "31",
      "ncfDesde": "E310000005000",
      "ncfHasta": "E310000005009"
    }
  ]
}
```

### Caso 3: Anular varios comprobantes de diferentes tipos

```json
{
  "rnc": "130960054",
  "anulaciones": [
    {
      "tipoDocumento": "31",
      "ncf": "E310000005678"
    },
    {
      "tipoDocumento": "34",
      "ncfDesde": "E340000001000",
      "ncfHasta": "E340000001002"
    }
  ]
}
```

---

## 🧩 Cómo Funciona Internamente

El endpoint aplica estas reglas automáticamente:

```javascript
// Regla 1: Si usa 'ncf', copiar a ncfDesde y ncfHasta
if (anulacion.ncf && !anulacion.ncfDesde) {
  anulacion.ncfDesde = anulacion.ncf;
  anulacion.ncfHasta = anulacion.ncf;
}

// Regla 2: Si solo tiene ncfDesde, copiar a ncfHasta
else if (anulacion.ncfDesde && !anulacion.ncfHasta) {
  anulacion.ncfHasta = anulacion.ncfDesde;
}

// Resultado: Siempre tenemos ncfDesde y ncfHasta para TheFactory
```

---

## 💡 Recomendaciones

### Para FileMaker:

#### ✅ Recomendación: Usar Funciones JSON Nativas

**Si tienes UN campo NCF:**

```fmscript
# Formato 1 con JSONSetElement (RECOMENDADO)
Set Variable [ $json ; Value: "{}" ]
Set Variable [ $json ; Value: JSONSetElement ( $json ;
    [ "rnc" ; Comprobantes::RNC ; JSONString ] ;
    [ "anulaciones[0].tipoDocumento" ; Comprobantes::TipoDocumento ; JSONString ] ;
    [ "anulaciones[0].ncf" ; Comprobantes::NCF ; JSONString ]
) ]
```

**Si tienes campos NCF_Desde y NCF_Hasta:**

```fmscript
# Usar JSONSetElement con condicional
Set Variable [ $json ; Value: "{}" ]
Set Variable [ $json ; Value: JSONSetElement ( $json ;
    [ "rnc" ; Comprobantes::RNC ; JSONString ] ;
    [ "anulaciones[0].tipoDocumento" ; Comprobantes::TipoDocumento ; JSONString ] ;
    [ "anulaciones[0].ncfDesde" ; Comprobantes::NCF_Desde ; JSONString ] ;
    [ "anulaciones[0].ncfHasta" ; Comprobantes::NCF_Hasta ; JSONString ]
) ]
```

**Ventajas de JSONSetElement:**

- ✅ Escapa caracteres especiales automáticamente
- ✅ Menos propenso a errores de sintaxis
- ✅ Más fácil de leer y mantener
- ✅ FileMaker valida la estructura

#### ⚠️ Forma Antigua (String manual - no recomendada):

```fmscript
# Si son iguales, usar Formato 1
If [ Comprobantes::NCF_Desde = Comprobantes::NCF_Hasta ]
    "\"ncf\":\"" & Comprobantes::NCF_Desde & "\""
# Si son diferentes, usar Formato 3
Else
    "\"ncfDesde\":\"" & Comprobantes::NCF_Desde & "\"," &
    "\"ncfHasta\":\"" & Comprobantes::NCF_Hasta & "\""
End If
```

### Para API REST:

#### POST simple:

```bash
# Formato 1 - Más corto
curl -X POST https://api.com/comprobantes/anular \
  -d '{"rnc":"130960054","anulaciones":[{"tipoDocumento":"31","ncf":"E310000000098"}]}'
```

#### POST rango:

```bash
# Formato 3 - Para rangos
curl -X POST https://api.com/comprobantes/anular \
  -d '{"rnc":"130960054","anulaciones":[{"tipoDocumento":"31","ncfDesde":"E310000000098","ncfHasta":"E310000000105"}]}'
```

---

## ⚠️ Errores Comunes

### ❌ Error: Enviar campos vacíos

```json
{
  "rnc": "130960054",
  "anulaciones": [
    {
      "tipoDocumento": "31",
      "ncfDesde": "",
      "ncfHasta": ""
    }
  ]
}
```

**Error**: "Debe proporcionar 'ncf' o 'ncfDesde'"

### ✅ Solución:

```json
{
  "rnc": "130960054",
  "anulaciones": [
    {
      "tipoDocumento": "31",
      "ncf": "E310000000098"
    }
  ]
}
```

---

### ❌ Error: Rango invertido

```json
{
  "anulaciones": [
    {
      "tipoDocumento": "31",
      "ncfDesde": "E310000000105",
      "ncfHasta": "E310000000098"
    }
  ]
}
```

**Error**: "NCF Hasta debe ser mayor o igual a NCF Desde"

### ✅ Solución:

```json
{
  "anulaciones": [
    {
      "tipoDocumento": "31",
      "ncfDesde": "E310000000098",
      "ncfHasta": "E310000000105"
    }
  ]
}
```

---

## 📚 Documentación Relacionada

- **Guía completa**: `docs/ANULACION_COMPROBANTES.md`
- **FileMaker guía rápida**: `docs/FILEMAKER_GUIA_RAPIDA_ANULACION.md`
- **FileMaker integración**: `docs/FILEMAKER_ANULACION_INTEGRACION.md`
- **Script completo**: `scripts/FileMaker_Script_Anulacion.fmfn`
- **Ejemplos JSON**: `utils/ejemplo-anulacion-comprobantes.json`

---

## 🎯 Resumen Ejecutivo

| Necesitas anular... | Usa formato... | Campo(s) a enviar       |
| ------------------- | -------------- | ----------------------- |
| 1 comprobante       | Formato 1 ✅   | `ncf`                   |
| 1 comprobante       | Formato 2      | `ncfDesde`              |
| Varios consecutivos | Formato 3      | `ncfDesde` + `ncfHasta` |

**Recomendación general**: Usa **Formato 1** (`ncf`) para el 90% de los casos. Es más simple, más claro y más fácil de implementar en FileMaker.
