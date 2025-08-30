# Error DGII 613: "Los comprobantes electrónicos no pueden reemplazarse entre ellos mismos"

## Información del Error

- **NCF Nota de Crédito**: E340000000035
- **NCF Original Referenciado**: E310000000108
- **Código DGII**: 613
- **Fecha Consulta**: 30-08-2025 06:32:31
- **Estado DGII**: Rechazado

## Análisis del Problema

### Posibles Causas

1. **NCF ya modificado anteriormente**

   - El NCF E310000000108 ya tiene una nota de crédito asociada
   - DGII no permite múltiples modificaciones al mismo NCF

2. **Código de modificación incorrecto**

   - Código "03" (Corrección de errores) puede no ser válido
   - Algunos códigos tienen restricciones específicas

3. **Fechas inconsistentes**

   - FechaNCFModificado: "29-08-2025"
   - Fecha emisión NC: "11-08-2025"
   - Posible inconsistencia temporal

4. **Monto o estructura inválida**
   - Restricciones en montos parciales vs totales
   - Validaciones específicas por tipo de modificación

## Datos del JSON Enviado

```json
{
  "modificacion": {
    "CodigoModificacion": "03",
    "FechaNCFModificado": "29-08-2025",
    "NCFModificado": "E310000000108",
    "RNCOtroContribuyente": null,
    "RazonModificacion": "Corrección de errores en la factura"
  }
}
```

## Verificaciones Necesarias

### 1. Consultar el NCF original

- ¿Existe realmente E310000000108?
- ¿Cuál es su estado actual?
- ¿Ya tiene notas de crédito asociadas?

### 2. Verificar fechas

- ¿La fecha 29-08-2025 es correcta para E310000000108?
- ¿La nota de crédito puede ser anterior al documento original?

### 3. Validar código de modificación

- ¿El código "03" es apropiado para este caso?
- ¿Debería ser "04" (anulación) en su lugar?

## Soluciones Propuestas

### Opción A: Cambiar código de modificación

```json
{
  "modificacion": {
    "CodigoModificacion": "04", // Anulación total
    "RazonModificacion": "Anulación de la operación"
  }
}
```

### Opción B: Verificar NCF original

- Consultar estado de E310000000108
- Confirmar que no tenga modificaciones previas

### Opción C: Usar NCF diferente

- Si E310000000108 ya fue modificado
- Buscar la factura original correcta

### Opción D: Verificar fechas

- Confirmar fecha exacta de E310000000108
- Ajustar FechaNCFModificado si es necesario

## Comandos de Verificación

### Consultar NCF original

```bash
POST /comprobantes/consultar-estatus
{
  "ncf": "E310000000108"
}
```

### Consultar base de datos local

```sql
SELECT * FROM facturas WHERE ncf = 'E310000000108';
```
