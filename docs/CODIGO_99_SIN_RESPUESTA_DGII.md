# Código 99 - SIN RESPUESTA DGII

## 📋 Descripción del Problema

Cuando consultas el estatus de un documento en TheFactoryHKA, puedes recibir el código **99** con el mensaje **"SIN RESPUESTA DGII"**.

## 🔍 ¿Qué Significa?

Este código indica que:

1. ✅ **TheFactoryHKA procesó el documento correctamente** (`procesado: true`)
2. ✅ **El documento fue enviado a DGII** (firmado digitalmente)
3. ⏳ **DGII aún no ha respondido** con la validación final

## 📊 Ejemplo de Respuesta

```json
{
  "codigo": 99,
  "codigoSeguridad": "FtmM2u",
  "fechaEmision": "15-10-2025 00:00:00",
  "fechaFirma": "15-10-2025 15:26:06",
  "mensaje": "SIN RESPUESTA DGII",
  "observaciones": [
    {
      "codigo": 7777,
      "mensaje": "Secuencia reutilizable"
    },
    {
      "codigo": 0,
      "mensaje": ""
    }
  ],
  "procesado": true
}
```

## 🎯 Estado Normalizado

El código 99 se mapea a **`EN_PROCESO`** porque:

- El documento está en espera de la respuesta de DGII
- No es un error, sino un estado transitorio
- Debe consultarse nuevamente después

## 🔢 Código de Observación 7777

El código **7777** con mensaje **"Secuencia reutilizable"** es una observación adicional que indica:

- El NCF puede ser reutilizado si es necesario
- No es un error crítico
- Es información complementaria sobre el estado del documento

### Códigos de Observación Comunes

| Código   | Mensaje                | Significado                               |
| -------- | ---------------------- | ----------------------------------------- |
| **0**    | (vacío)                | Sin observaciones                         |
| **7777** | Secuencia reutilizable | NCF puede ser reutilizado si es necesario |

## 🛠️ ¿Cómo Manejarlo?

### 1. **En el Backend (Node.js)**

El código ya está implementado para manejar el código 99:

```javascript
// En normalizarEstadoFactura()
case 99: // Sin respuesta DGII - documento enviado pero pendiente de respuesta
  return 'EN_PROCESO';
```

### 2. **En FileMaker**

Cuando recibas `estado: "EN_PROCESO"` con el código 99:

```javascript
// Ejemplo de manejo en FileMaker
If ( estado = "EN_PROCESO" and codigo = 99 )
  // Mostrar mensaje al usuario
  Set Field [ Estado_Visual ; "⏳ Esperando respuesta de DGII" ]
  Set Field [ Color_Estado ; "amarillo" ]

  // Programar una nueva consulta en 5-10 minutos
  // El documento fue procesado correctamente, solo falta confirmación de DGII
End If
```

### 3. **Recomendaciones**

- ⏰ **Esperar 5-10 minutos** antes de consultar nuevamente
- 🔄 **No reenviar el documento** - ya está procesado
- 📊 **Monitorear el estado** consultando periódicamente
- ✅ **El documento es válido** - tiene XML firmado y código QR

## 📈 Flujo Típico de Estados

```
1. Envío inicial
   └─> codigo: 0, mensaje: "Documento procesado correctamente"
   └─> Estado: APROBADA (TheFactoryHKA)

2. Primera consulta de estatus (inmediata)
   └─> codigo: 95, mensaje: "Documento pendiente por ser enviado a DGII"
   └─> Estado: EN_PROCESO

3. Segunda consulta (después de unos minutos)
   └─> codigo: 99, mensaje: "SIN RESPUESTA DGII"
   └─> Estado: EN_PROCESO
   └─> Observación: 7777 - "Secuencia reutilizable"

4. Consulta final (después de más tiempo)
   └─> codigo: 1, mensaje: "Aceptado"
   └─> Estado: APROBADA (DGII confirmó)
```

## ⚠️ Importante

### ✅ El Documento es Válido

Aunque DGII no haya respondido, el documento:

- ✅ Tiene XML firmado digitalmente
- ✅ Tiene código QR válido
- ✅ Puede ser enviado al cliente
- ✅ Es legalmente válido

### 🕒 Tiempo de Respuesta de DGII

- **Normal**: 5-30 minutos
- **Carga alta**: Puede tomar varias horas
- **Problemas DGII**: Puede demorar hasta 24 horas

### 🔄 ¿Cuándo Consultar?

1. **Primera consulta**: Inmediatamente después del envío
2. **Segunda consulta**: 5 minutos después
3. **Tercera consulta**: 15 minutos después
4. **Consultas adicionales**: Cada 30 minutos hasta 24 horas

## 📝 Código Implementado

### En el Backend

```javascript
// controllers/comprobantes.js - línea ~386 y ~500
case 99: // Sin respuesta DGII - documento enviado pero pendiente de respuesta
  return 'EN_PROCESO';
```

### Estados Mapeados

| Código Original | Estado Normalizado | Acción Recomendada              |
| --------------- | ------------------ | ------------------------------- |
| 0, 1            | `APROBADA`         | ✅ Proceso completo             |
| 2, 10, 15       | `EN_PROCESO`       | ⏳ Consultar después            |
| 95              | `EN_PROCESO`       | ⏳ Pre-envío a DGII             |
| **99**          | **`EN_PROCESO`**   | **⏳ Esperando respuesta DGII** |
| 108             | `NCF_INVALIDO`     | ❌ Generar nuevo NCF            |
| 200-299         | `RECHAZADA`        | ❌ Revisar y corregir           |
| 300-301         | `ANULADA`          | 🚫 Documento cancelado          |

## 🎨 Presentación en FileMaker

### Sugerencia de Mensaje al Usuario

**Estado**: EN_PROCESO (código 99)

**Mensaje Visual**:

```
⏳ Factura Procesada - Esperando Confirmación DGII

El documento fue enviado exitosamente a la DGII
y está pendiente de validación final.

✅ Puede entregar la factura al cliente
✅ El XML y código QR son válidos
⏰ La confirmación final puede tomar hasta 24 horas

Última consulta: [fecha/hora]
```

**Color**: Amarillo/Naranja (#FFC107)

## 📞 Soporte

Si después de 24 horas el estado sigue siendo código 99:

1. Verificar el portal de DGII directamente
2. Contactar a TheFactoryHKA
3. Revisar los logs del sistema
4. Validar que no haya problemas de red o conectividad

## 📚 Referencias

- [ESTADOS_THEFACTORY.md](./ESTADOS_THEFACTORY.md)
- [CODIGOS_ERROR_DGII_COMPLETOS.md](./CODIGOS_ERROR_DGII_COMPLETOS.md)
- Portal DGII: https://dgii.gov.do/
