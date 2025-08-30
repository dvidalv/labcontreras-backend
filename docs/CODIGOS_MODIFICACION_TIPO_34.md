# Códigos de Modificación para Notas de Crédito (Tipo 34)

## Códigos Disponibles

| Código | Descripción                         | Casos de Uso                             | Campos Adicionales           |
| ------ | ----------------------------------- | ---------------------------------------- | ---------------------------- |
| **01** | Devolución de mercancía             | Productos defectuosos, no conformes      | `ItemsDevueltos` recomendado |
| **02** | Rebaja o descuento en ventas        | Descuentos posteriores, promociones      | Monto parcial                |
| **03** | Corrección de errores en la factura | Errores de datos, información incorrecta | ✅ **PROBADO**               |
| **04** | Anulación de la operación           | Cancelación total de la factura          | Monto total igual            |
| **05** | Ajustes por diferencias en cambio   | Facturas en moneda extranjera            | Tipo de cambio               |
| **06** | Otros                               | Casos no contemplados anteriormente      | Descripción detallada        |

## Estructura JSON Base

```json
{
  "comprador": { ... },
  "emisor": { ... },
  "factura": {
    "fecha": "DD-MM-YYYY",
    "fechaVencNCF": "DD/MM/YYYY",
    "id": "405660",
    "ncf": "E340000000XXX",
    "tipo": "34",
    "total": "MONTO_A_ACREDITAR"
  },
  "items": [
    {
      "nombre": "Descripción del servicio/producto",
      "precio": "MONTO_ITEM"
    }
  ],
  "modificacion": {
    "CodigoModificacion": "01|02|03|04|05|06",
    "FechaNCFModificado": "DD-MM-YYYY",
    "NCFModificado": "E310000000XXX",
    "RazonModificacion": "Descripción específica del motivo"
  }
}
```

## Ejemplos por Código

### Código 01 - Devolución de mercancía

```json
{
  "modificacion": {
    "CodigoModificacion": "01",
    "RazonModificacion": "Devolución de productos defectuosos"
  }
}
```

### Código 02 - Rebaja o descuento

```json
{
  "modificacion": {
    "CodigoModificacion": "02",
    "RazonModificacion": "Descuento por volumen aplicado posteriormente"
  }
}
```

### Código 04 - Anulación total

```json
{
  "modificacion": {
    "CodigoModificacion": "04",
    "RazonModificacion": "Anulación total de la operación por cancelación del servicio"
  }
}
```

### Código 05 - Diferencias en cambio

```json
{
  "modificacion": {
    "CodigoModificacion": "05",
    "RazonModificacion": "Ajuste por diferencia en tipo de cambio USD/DOP"
  }
}
```

### Código 06 - Otros

```json
{
  "modificacion": {
    "CodigoModificacion": "06",
    "RazonModificacion": "Ajuste por resolución judicial/administrativa"
  }
}
```

## Campos Obligatorios para Todos los Tipos

- ✅ `CodigoModificacion`: Debe ser string "01" a "06"
- ✅ `FechaNCFModificado`: Fecha de la factura original
- ✅ `NCFModificado`: NCF de la factura original
- ✅ `RazonModificacion`: Descripción clara del motivo

## Validaciones del Sistema

El sistema actual valida:

1. Presencia de todos los campos obligatorios
2. Formato correcto de fechas (DD-MM-YYYY)
3. Mapeo automático de `modificacion` → `InformacionReferencia`
4. Estructura específica para tipo 34 (sin fechaVencimientoSecuencia)
