# Código 120 - NO ENCONTRADO

## 📋 Descripción del Problema

Cuando consultas el estatus de un documento en TheFactoryHKA, puedes recibir el código **120** con el mensaje **"No se encuentra información del documento en BD."**

## 🔍 ¿Qué Significa?

Este código indica que:

1. ❌ **El documento NO existe en la base de datos de TheFactoryHKA**
2. ❌ **El NCF consultado no fue enviado previamente**
3. ❌ **No hay registro de ese documento en el sistema**

## 📊 Ejemplo de Respuesta

```json
{
  "data": {
    "datosCompletos": {
      "codigo": 120,
      "mensaje": "No se encuentra información del documento en BD.",
      "procesado": false
    },
    "estado": "NO_ENCONTRADO",
    "estadoOriginal": "No se encuentra información del documento en BD.",
    "fechaConsulta": "2025-10-20T00:35:02.628Z",
    "mensaje": "No se encuentra información del documento en BD.",
    "ncf": "E430000000014"
  },
  "message": "Consulta de estatus realizada exitosamente",
  "status": "success"
}
```

## 🎯 Estado Normalizado

El código 120 se mapea a **`NO_ENCONTRADO`** porque:

- El documento no existe en la base de datos
- No fue enviado previamente a TheFactoryHKA
- Es un error de consulta, no de procesamiento

## ⚠️ Causas Comunes

### 1. **Documento No Enviado** (Más Común)

El documento nunca fue enviado a TheFactoryHKA.

**Solución:**

- ✅ Enviar el documento primero
- ✅ Esperar la confirmación de envío
- ✅ Luego consultar el estatus

### 2. **NCF Incorrecto**

Estás consultando un NCF que no existe o está mal escrito.

**Solución:**

- ✅ Verificar que el NCF sea correcto
- ✅ Revisar espacios o caracteres especiales
- ✅ Confirmar el formato del NCF

### 3. **Error de Tipeo**

Error al escribir el NCF en la consulta.

**Solución:**

- ✅ Copiar y pegar el NCF desde el registro original
- ✅ Verificar cada carácter del NCF

### 4. **Documento Muy Antiguo**

TheFactoryHKA puede tener políticas de retención de datos.

**Solución:**

- ✅ Verificar la fecha del documento
- ✅ Contactar a TheFactoryHKA si es un documento antiguo

### 5. **Sincronización de Bases de Datos**

En casos raros, puede haber un problema de sincronización.

**Solución:**

- ✅ Esperar unos minutos y volver a consultar
- ✅ Contactar a TheFactoryHKA si persiste

## 🛠️ ¿Cómo Manejarlo?

### 1. **En el Backend (Node.js)**

El código ya está implementado:

```javascript
// En normalizarEstadoFactura()
case 120:
  return 'NO_ENCONTRADO'; // Documento no existe en BD de TheFactoryHKA
```

### 2. **En FileMaker**

```javascript
// Ejemplo de manejo en FileMaker
If ( estado = "NO_ENCONTRADO" and codigo = 120 )

  // Mostrar mensaje al usuario
  Set Field [ Estado_Visual ; "❌ Documento no encontrado" ]
  Set Field [ Color_Estado ; "rojo" ]
  Set Field [ Mensaje_Usuario ;
    "El documento no existe en el sistema de TheFactoryHKA. " &
    "Esto significa que NO fue enviado previamente. " & ¶ &
    "Acción requerida: Enviar el documento primero."
  ]

  // Marcar como pendiente de envío
  Set Field [ Estado_Envio ; "PENDIENTE" ]

  // Log del evento
  Set Field [ Log ;
    Log & ¶ &
    "[" & Get(CurrentTimestamp) & "] " &
    "Código 120 - Documento no encontrado. NCF: " & NCF & ". " &
    "El documento debe ser enviado."
  ]

  // Mostrar alerta al usuario
  Show Custom Dialog [ "Documento No Encontrado" ;
    "❌ El NCF consultado no existe en TheFactoryHKA" & ¶ & ¶ &
    "NCF: " & NCF & ¶ & ¶ &
    "Causas posibles:" & ¶ &
    "• El documento no fue enviado" & ¶ &
    "• NCF incorrecto" & ¶ &
    "• Error de tipeo" & ¶ & ¶ &
    "Acción: Verifique el NCF y envíe el documento."
  ]

End If
```

### 3. **Flujo Recomendado**

```
Usuario consulta NCF
    ↓
Backend devuelve código 120
    ↓
Sistema muestra: "Documento no encontrado"
    ↓
Usuario verifica:
  1. ¿El documento fue enviado?
  2. ¿El NCF es correcto?
  3. ¿Hay error de tipeo?
    ↓
Si NO fue enviado → Enviar documento
Si fue enviado → Verificar NCF
Si NCF correcto → Contactar soporte
```

## 📈 Diferencias con Otros Códigos

### Código 120 vs Código 99

| Aspecto               | Código 120           | Código 99                |
| --------------------- | -------------------- | ------------------------ |
| **Significado**       | Documento no existe  | Esperando respuesta DGII |
| **Documento enviado** | ❌ NO                | ✅ SÍ                    |
| **Estado**            | `NO_ENCONTRADO`      | `EN_PROCESO`             |
| **Acción**            | Enviar documento     | Esperar validación       |
| **Gravedad**          | ⚠️ Error de consulta | ⏳ Estado normal         |

### Código 120 vs Código 108

| Aspecto               | Código 120          | Código 108        |
| --------------------- | ------------------- | ----------------- |
| **Significado**       | Documento no existe | NCF ya usado      |
| **Documento enviado** | ❌ NO               | ✅ SÍ (duplicado) |
| **Estado**            | `NO_ENCONTRADO`     | `NCF_INVALIDO`    |
| **Acción**            | Enviar documento    | Usar nuevo NCF    |
| **Problema**          | Consulta incorrecta | NCF duplicado     |

## 🎨 Presentación en FileMaker

### Sugerencia de Mensaje al Usuario

**Estado**: NO_ENCONTRADO (código 120)

**Mensaje Visual**:

```
❌ Documento No Encontrado en TheFactoryHKA

El NCF consultado no existe en el sistema.

NCF: [NCF_CONSULTADO]

📋 CAUSAS POSIBLES:
• El documento NO fue enviado a TheFactoryHKA
• NCF incorrecto o mal escrito
• Error al copiar el NCF

✅ ACCIÓN REQUERIDA:
1. Verificar que el NCF sea correcto
2. Si es correcto, enviar el documento
3. Si ya fue enviado, contactar soporte

Estado de consulta: [FECHA_HORA]
```

**Color**: Rojo (#DC3545)

## ⚠️ Importante

### ❌ El Documento NO Existe

A diferencia del código 99 (que indica proceso), el código 120 significa:

- ❌ NO hay registro del documento
- ❌ NO fue enviado a TheFactoryHKA
- ❌ NO está en proceso
- ❌ NO tiene XML generado
- ❌ NO tiene código QR

### ✅ Acción Requerida

**Debes:**

1. ✅ Verificar el NCF consultado
2. ✅ Si el NCF es correcto, enviar el documento
3. ✅ Si el documento fue enviado, verificar que el envío fue exitoso

**NO debes:**

- ❌ Esperar que el documento aparezca
- ❌ Consultar repetidamente sin verificar
- ❌ Asumir que el documento está en proceso

## 🔄 Flujo de Trabajo Típico

### Caso 1: Documento No Enviado

```
1. Usuario intenta consultar estatus
   └─> Código: 120
   └─> "Documento no encontrado"

2. Sistema verifica registro local
   └─> Estado local: "PENDIENTE_ENVIO"

3. Acción: Enviar documento
   └─> Llamar endpoint de envío
   └─> Esperar respuesta

4. Respuesta de envío
   └─> Código: 0 (APROBADA)
   └─> Documento ahora existe en TheFactoryHKA

5. Ahora se puede consultar estatus
   └─> Código: 95, 99, o 1
```

### Caso 2: NCF Incorrecto

```
1. Usuario consulta NCF: "E430000000014"
   └─> Código: 120
   └─> "Documento no encontrado"

2. Sistema verifica registro local
   └─> NCF real: "E430000000015" (diferente)

3. Acción: Corregir NCF
   └─> Usar NCF correcto

4. Consultar nuevamente con NCF correcto
   └─> Código: 99 o 1
   └─> Documento encontrado
```

## 📝 Código Implementado

### En el Backend

```javascript
// controllers/comprobantes.js - línea ~408 y ~526
case 120:
  return 'NO_ENCONTRADO'; // Documento no existe en BD de TheFactoryHKA
```

### Estados Mapeados

| Código Original | Estado Normalizado  | Acción Recomendada           |
| --------------- | ------------------- | ---------------------------- |
| **120**         | **`NO_ENCONTRADO`** | **🔍 Verificar NCF y envío** |
| 99              | `EN_PROCESO`        | ⏳ Esperar respuesta DGII    |
| 108             | `NCF_INVALIDO`      | ❌ Generar nuevo NCF         |
| 200-299         | `RECHAZADA`         | ❌ Revisar y corregir        |

## 🔍 Cómo Prevenir Este Error

### 1. **Enviar Antes de Consultar**

```javascript
// Flujo correcto
1. Enviar documento → recibir respuesta
2. Guardar NCF y código de seguridad
3. Esperar unos segundos
4. Consultar estatus con el NCF correcto
```

### 2. **Validar NCF Antes de Consultar**

```javascript
// En FileMaker
If ( IsEmpty ( NCF ) or Length ( NCF ) ≠ 13 )
  Show Custom Dialog [ "Error" ; "NCF inválido" ]
  Exit Script
End If

// Consultar solo si el NCF es válido
Perform Script [ "ConsultarEstatus" ; Parameter: NCF ]
```

### 3. **Mantener Registro Local**

```javascript
// Tabla: FacturasEnviadas
- NCF (Texto)
- FechaEnvio (Timestamp)
- CodigoSeguridad (Texto)
- EstadoUltimaConsulta (Texto)

// Antes de consultar, verificar que existe localmente
If ( Count ( FacturasEnviadas::NCF ) = 0 )
  Show Custom Dialog [ "Error" ; "El documento no fue enviado" ]
  Exit Script
End If
```

## 📞 Soporte

Si recibes código 120 y estás seguro de que:

- ✅ El documento fue enviado exitosamente
- ✅ El NCF es correcto
- ✅ Tienes confirmación del envío
- ✅ El envío fue reciente (menos de 24 horas)

**Entonces:**

1. ✅ Revisar logs de envío en tu sistema
2. ✅ Verificar respuesta original del envío
3. ✅ Contactar a TheFactoryHKA con:
   - NCF consultado
   - Fecha/hora del envío
   - Código de seguridad (si lo tienes)
   - Respuesta original del envío

## 📚 Referencias

- [ESTADOS_THEFACTORY.md](./ESTADOS_THEFACTORY.md) - Todos los estados
- [CODIGOS_ERROR_DGII_COMPLETOS.md](./CODIGOS_ERROR_DGII_COMPLETOS.md) - Códigos completos
- [CODIGO_99_SIN_RESPUESTA_DGII.md](./CODIGO_99_SIN_RESPUESTA_DGII.md) - Código 99

---

**Última actualización:** 20 de octubre de 2025  
**Versión:** 1.0
