# ✅ Resumen: Implementación Código 120 - NO ENCONTRADO

## 🎯 Problema Identificado

**Fecha**: 20 de octubre de 2025

El backend recibió una consulta de estatus con el código **120** y mensaje **"No se encuentra información del documento en BD."** que no estaba siendo manejado correctamente.

### Contexto

El usuario intentó consultar el estatus de un documento que **NO había sido enviado previamente** a TheFactoryHKA.

### Respuesta Recibida

```json
{
  "data": {
    "datosCompletos": {
      "codigo": 120,
      "mensaje": "No se encuentra información del documento en BD.",
      "procesado": false
    },
    "estado": "ERROR",
    "estadoOriginal": "No se encuentra información del documento en BD.",
    "fechaConsulta": "2025-10-20T00:35:02.628Z",
    "mensaje": "No se encuentra información del documento en BD.",
    "ncf": "E430000000014"
  },
  "message": "Consulta de estatus realizada exitosamente",
  "status": "success"
}
```

### Estado Devuelto (Antes)

El sistema devolvía `ERROR` con un warning en consola:

```
⚠️ Código de TheFactoryHKA no mapeado: 120
```

## ✅ Solución Implementada

### 1. **Actualización del Controlador**

**Archivo**: `controllers/comprobantes.js`

Se agregó el código 120 al mapeo de estados en dos lugares, creando un nuevo estado `NO_ENCONTRADO`:

```javascript
// PRIORIDAD 1: Switch principal (línea ~408)
case 120:
  return 'NO_ENCONTRADO'; // Documento no existe en BD de TheFactoryHKA

// PRIORIDAD 3: Switch de fallback (línea ~526)
case 120:
  return 'NO_ENCONTRADO'; // Documento no existe en BD de TheFactoryHKA
```

### 2. **Nuevo Estado Normalizado**

Se creó el estado **`NO_ENCONTRADO`** para distinguirlo de otros errores:

| Estado            | Significado               | Uso                           |
| ----------------- | ------------------------- | ----------------------------- |
| `NO_ENCONTRADO`   | Documento no existe en BD | Código 120                    |
| `ERROR`           | Error desconocido         | Otros errores no clasificados |
| `DATOS_INVALIDOS` | Error en datos/estructura | Códigos 111-114               |

### 3. **Actualización de Documentación**

**Archivos modificados:**

1. **ESTADOS_THEFACTORY.md**

   - Agregado estado `NO_ENCONTRADO` a la tabla de estados normalizados

2. **CODIGOS_ERROR_DGII_COMPLETOS.md**

   - Agregada nueva sección: "Códigos de Búsqueda/No Encontrado (120)"
   - Documentado el código 120

3. **CODIGO_120_NO_ENCONTRADO.md** (NUEVO)
   - Guía completa sobre el código 120
   - Causas comunes del error
   - Diferencias con otros códigos
   - Implementación en FileMaker
   - Flujo de trabajo recomendado

## 📊 Estado Normalizado

| Código  | Mensaje                                         | Estado Normalizado | Acción                   |
| ------- | ----------------------------------------------- | ------------------ | ------------------------ |
| **120** | No se encuentra información del documento en BD | `NO_ENCONTRADO`    | 🔍 Verificar NCF y envío |

## 🔍 Significado del Código 120

El código 120 indica que:

❌ **El documento NO existe en la base de datos de TheFactoryHKA**

- No fue enviado previamente
- No hay registro del documento
- No tiene XML ni código QR

## ⚠️ Causas Comunes

1. **Documento No Enviado** (más común)

   - El documento nunca fue enviado a TheFactoryHKA
   - **Solución:** Enviar el documento primero

2. **NCF Incorrecto**

   - Error al escribir el NCF
   - **Solución:** Verificar y corregir el NCF

3. **Error de Tipeo**

   - NCF mal copiado o pegado
   - **Solución:** Copiar el NCF desde el registro original

4. **Consulta Prematura**
   - Consultando antes de enviar
   - **Solución:** Enviar antes de consultar

## 🛠️ Implementación en FileMaker

### Código Sugerido

```javascript
If ( estado = "NO_ENCONTRADO" and codigo = 120 )

  // Mostrar mensaje al usuario
  Set Field [ Estado_Visual ; "❌ Documento no encontrado" ]
  Set Field [ Color_Estado ; RGB(220, 53, 69) ] // Rojo
  Set Field [ Mensaje_Usuario ;
    "El documento no existe en TheFactoryHKA. " &
    "Debe ser enviado primero." & ¶ &
    "NCF: " & NCF
  ]

  // Marcar como pendiente de envío
  Set Field [ Estado_Envio ; "PENDIENTE" ]

  // Log del evento
  Set Field [ Log ;
    Log & ¶ &
    "[" & Get(CurrentTimestamp) & "] " &
    "Código 120 - Documento no encontrado. NCF: " & NCF
  ]

  // Alerta al usuario
  Show Custom Dialog [ "Documento No Encontrado" ;
    "❌ El NCF consultado no existe en TheFactoryHKA" & ¶ & ¶ &
    "NCF: " & NCF & ¶ & ¶ &
    "El documento no fue enviado. " &
    "Por favor, envíelo primero."
  ]

End If
```

## 📈 Flujo de Estados Documentado

### Flujo Correcto

```
Paso 1: Enviar Documento
└─> codigo: 0 → APROBADA (TheFactoryHKA recibió)

Paso 2: Consultar Estatus (después de unos segundos)
└─> codigo: 95, 99, o 1 → EN_PROCESO o APROBADA
```

### Flujo Incorrecto (que genera código 120)

```
Paso 1: Consultar Estatus (SIN enviar antes)
└─> codigo: 120 → NO_ENCONTRADO

Acción Correctiva: Enviar el documento primero
```

## 📊 Comparación con Otros Códigos

### Código 120 vs Código 99

| Aspecto           | Código 120       | Código 99    |
| ----------------- | ---------------- | ------------ |
| Documento enviado | ❌ NO            | ✅ SÍ        |
| Estado            | `NO_ENCONTRADO`  | `EN_PROCESO` |
| Gravedad          | ⚠️ Error         | ⏳ Normal    |
| Acción            | Enviar documento | Esperar      |

### Código 120 vs Código 108

| Aspecto          | Código 120      | Código 108     |
| ---------------- | --------------- | -------------- |
| Documento existe | ❌ NO           | ✅ SÍ          |
| Problema         | No enviado      | NCF duplicado  |
| Estado           | `NO_ENCONTRADO` | `NCF_INVALIDO` |
| Acción           | Enviar          | Nuevo NCF      |

## 📁 Archivos Modificados

```
✅ controllers/comprobantes.js (líneas ~408 y ~526)
✅ docs/ESTADOS_THEFACTORY.md
✅ docs/CODIGOS_ERROR_DGII_COMPLETOS.md

✨ docs/CODIGO_120_NO_ENCONTRADO.md (NUEVO)
✨ docs/RESUMEN_CODIGO_120.md (NUEVO - este archivo)
```

## ✅ Testing

### Caso de Prueba

**Input**:

```json
{
  "codigo": 120,
  "mensaje": "No se encuentra información del documento en BD.",
  "procesado": false
}
```

**Output Esperado**:

```javascript
estado: 'NO_ENCONTRADO';
```

**Resultado**: ✅ PASÓ

### Verificación

```bash
# Sin errores de linting
✅ No linter errors found

# Backend procesa correctamente
✅ Código 120 → NO_ENCONTRADO

# Documentación actualizada
✅ 2 archivos actualizados
✅ 2 archivos nuevos creados
```

## 🎯 Próximos Pasos

### Para el Usuario (FileMaker)

1. ✅ **Actualizar scripts de FileMaker** para manejar código 120
2. ✅ **Mostrar mensaje claro** al usuario sobre el error
3. ✅ **Validar NCF antes de consultar**
4. ✅ **Verificar envío previo** antes de consultar estatus

### Mejoras Sugeridas

1. ✅ **Validación Preventiva**

   - Verificar en BD local que el documento fue enviado
   - Mostrar alerta si no existe registro de envío

2. ✅ **Flujo Guiado**

   - Si código 120, preguntar al usuario si desea enviar ahora
   - Botón de "Enviar Documento" en el mensaje de error

3. ✅ **Registro Local**
   - Mantener tabla de documentos enviados
   - Consultar solo documentos con registro de envío exitoso

## 📞 Soporte

Si después de verificar todo recibes código 120:

1. ✅ Verificar que el NCF sea correcto
2. ✅ Confirmar que el documento fue enviado
3. ✅ Revisar logs de envío
4. ✅ Contactar a TheFactoryHKA si todo lo anterior es correcto

## 📚 Referencias

- [CODIGO_120_NO_ENCONTRADO.md](./CODIGO_120_NO_ENCONTRADO.md) - Guía detallada
- [ESTADOS_THEFACTORY.md](./ESTADOS_THEFACTORY.md) - Todos los estados
- [CODIGOS_ERROR_DGII_COMPLETOS.md](./CODIGOS_ERROR_DGII_COMPLETOS.md) - Códigos completos
- [CODIGO_99_SIN_RESPUESTA_DGII.md](./CODIGO_99_SIN_RESPUESTA_DGII.md) - Código 99 (comparación)

---

## 🎨 Colores para UI/UX

### Código 120 - NO_ENCONTRADO

**Color Primario:** `#DC3545` (Rojo)

- RGB: `220, 53, 69`
- Hex: `#DC3545`

**Uso:**

- Fondo de alertas de error
- Color de texto de estado
- Indicadores visuales de error

**Mensaje Visual:**

```
❌ Documento no encontrado
```

---

**Estado**: ✅ Implementado y Documentado  
**Fecha**: 20 de octubre de 2025  
**Versión**: 1.0  
**Autor**: Sistema de facturación LabContreras
