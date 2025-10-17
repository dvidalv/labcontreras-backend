# ❓ FAQ - Código 99: SIN RESPUESTA DGII

## Preguntas Frecuentes sobre el Código 99

---

### 1. ¿Qué significa el código 99?

**Respuesta:**

El código 99 con mensaje "SIN RESPUESTA DGII" significa que:

- ✅ Tu factura fue procesada correctamente por TheFactoryHKA
- ✅ El documento fue firmado digitalmente y enviado a DGII
- ⏳ DGII aún no ha respondido con la validación final

**Es un estado NORMAL y TEMPORAL, no es un error.**

---

### 2. ¿Puedo entregar la factura al cliente con código 99?

**Respuesta: ✅ SÍ**

La factura es completamente válida aunque tenga código 99 porque:

- ✅ Tiene XML firmado digitalmente
- ✅ Tiene código QR válido
- ✅ Cumple con los requisitos legales de DGII
- ✅ TheFactoryHKA ya la procesó exitosamente

El código 99 solo indica que falta la confirmación final de DGII, pero el documento es legal y válido.

---

### 3. ¿Cuánto tiempo tarda DGII en responder?

**Respuesta:**

Los tiempos varían según la carga del sistema de DGII:

| Escenario          | Tiempo Típico  |
| ------------------ | -------------- |
| **Normal**         | 5-30 minutos   |
| **Carga Alta**     | 1-6 horas      |
| **Problemas DGII** | Hasta 24 horas |

**Recomendación:** Esperar al menos 30 minutos antes de preocuparse.

---

### 4. ¿Debo reenviar el documento si veo código 99?

**Respuesta: ❌ NO**

**NUNCA reenvíes un documento con código 99** porque:

- El documento ya fue procesado exitosamente
- Ya está en los sistemas de DGII
- Reenviar podría causar duplicados
- Solo debes esperar y consultar el estatus nuevamente

**Acción correcta:** Consultar el estatus cada 5-30 minutos.

---

### 5. ¿Qué es el código de observación 7777?

**Respuesta:**

El código **7777** con mensaje "Secuencia reutilizable" es una observación adicional que indica:

- El NCF puede ser reutilizado si es necesario
- No es un error crítico
- Es información complementaria sobre el estado

**No requiere ninguna acción de tu parte.**

---

### 6. ¿Cada cuánto debo consultar el estatus?

**Respuesta:**

Sigue esta estrategia de consulta progresiva:

| Intento       | Tiempo de Espera | Tiempo Acumulado |
| ------------- | ---------------- | ---------------- |
| 1º consulta   | 5 minutos        | 5 min            |
| 2º consulta   | 10 minutos       | 15 min           |
| 3º consulta   | 15 minutos       | 30 min           |
| 4º+ consultas | 30 minutos       | Cada 30 min      |

**Consultar hasta por 24 horas máximo.**

---

### 7. ¿Qué hago si después de 24 horas sigue en código 99?

**Respuesta:**

Si después de 24 horas el documento sigue con código 99:

1. ✅ **Verificar el Portal de DGII**

   - Ingresa al portal oficial de DGII
   - Busca el documento por NCF
   - Verifica su estado directamente

2. ✅ **Contactar a TheFactoryHKA**

   - Reporta el caso al soporte técnico
   - Proporciona el NCF y código de seguridad
   - Solicita verificación del envío a DGII

3. ✅ **Revisar Logs**

   - Verifica los logs de tu sistema
   - Confirma que no haya errores de red
   - Valida que las consultas se estén realizando correctamente

4. ✅ **Considerar el documento válido**
   - Si todo lo demás está correcto
   - El documento sigue siendo legal
   - DGII podría tener problemas temporales

---

### 8. ¿El documento con código 99 es válido para auditorías?

**Respuesta: ✅ SÍ**

El documento con código 99 es válido porque:

- ✅ Fue procesado por el PSE certificado (TheFactoryHKA)
- ✅ Tiene firma digital válida
- ✅ Tiene XML conforme a las normas DGII
- ✅ Cumple con la Norma 06-2018 de DGII

**El código 99 no invalida el documento, solo indica que falta la respuesta final de DGII.**

---

### 9. ¿Puedo imprimir la factura con código 99?

**Respuesta: ✅ SÍ**

Puedes imprimir y entregar la factura porque:

- ✅ El XML está firmado y es válido
- ✅ El código QR funciona correctamente
- ✅ Todos los datos fiscales son correctos
- ✅ El documento cumple con la normativa

**El cliente puede usar el código QR para verificar el documento en el portal de DGII.**

---

### 10. ¿Por qué primero dice "APROBADA" y luego código 99?

**Respuesta:**

Es normal y se debe al flujo de procesamiento:

```
1. Envío inicial → APROBADA (por TheFactoryHKA)
   - TheFactoryHKA validó y procesó el documento
   - Generó XML firmado
   - Código: 0

2. Primera consulta → EN_PROCESO (código 95)
   - Documento en cola para envío a DGII
   - TheFactoryHKA lo preparó para DGII

3. Segunda consulta → EN_PROCESO (código 99)
   - Documento ya enviado a DGII
   - Esperando respuesta de validación

4. Consulta final → APROBADA (código 1)
   - DGII confirmó y validó el documento
   - Estado final aprobado
```

**La "APROBADA" inicial es de TheFactoryHKA, no de DGII.**

---

### 11. ¿Debo mostrar algún mensaje especial al usuario?

**Respuesta: ✅ SÍ, recomendado**

Muestra un mensaje claro y tranquilizador:

```
⏳ FACTURA EN VALIDACIÓN

El documento fue procesado y enviado exitosamente a la DGII.
Está pendiente de confirmación final.

✅ PUEDE ENTREGAR LA FACTURA AL CLIENTE
✅ El XML y código QR son válidos
✅ El documento es legalmente válido

La confirmación de DGII puede tomar desde minutos hasta 24 horas.
El sistema volverá a consultar automáticamente.
```

**Color sugerido:** Amarillo/Naranja (indica proceso, no error)

---

### 12. ¿El código 99 afecta mi secuencia de NCF?

**Respuesta: ❌ NO**

El NCF ya fue asignado y utilizado, independientemente del código 99:

- ✅ El NCF está consumido (no se puede usar para otro documento)
- ✅ La secuencia ya avanzó al siguiente número
- ✅ El código 99 no causa desperdicio de NCF

**Nota:** La observación "Secuencia reutilizable" (código 7777) puede aparecer, pero no significa que debas o puedas reutilizar el NCF.

---

### 13. ¿Puedo cancelar/anular un documento con código 99?

**Respuesta: ⚠️ ESPERA PRIMERO**

Antes de anular:

1. ✅ **Espera al menos 1-2 horas** para la respuesta de DGII
2. ✅ **Consulta el estado** varias veces
3. ✅ **Verifica en el portal de DGII** directamente

**Si necesitas anular:**

- ✅ Sí, puedes anular el documento aunque tenga código 99
- ✅ Usa el proceso normal de anulación
- ✅ TheFactoryHKA procesará la anulación

**Recomendación:** Solo anula si realmente es necesario, no solo por el código 99.

---

### 14. ¿El código 99 consume créditos/transacciones?

**Respuesta:**

**Consultas de estatus:**

- ❌ NO consumen créditos adicionales
- ✅ Puedes consultar libremente
- ✅ No hay límite de consultas

**Documento enviado:**

- ✅ El crédito ya fue consumido al enviar el documento
- ❌ El código 99 no genera cargos adicionales

---

### 15. ¿Hay diferencia entre código 95 y código 99?

**Respuesta: ✅ SÍ**

| Aspecto              | Código 95                 | Código 99                |
| -------------------- | ------------------------- | ------------------------ |
| **Estado**           | Pendiente de envío a DGII | Ya enviado a DGII        |
| **Significado**      | En cola de TheFactoryHKA  | Esperando respuesta DGII |
| **Tiempo típico**    | 1-5 minutos               | 5-30 minutos (o más)     |
| **Acción**           | Esperar envío             | Esperar validación       |
| **Documento válido** | ✅ Sí                     | ✅ Sí                    |

**Ambos son estados EN_PROCESO pero en diferentes etapas.**

---

### 16. ¿Debo informar a DGII sobre el código 99?

**Respuesta: ❌ NO**

El código 99 es parte del flujo normal de TheFactoryHKA:

- ❌ No es necesario reportar a DGII
- ❌ No es un error del sistema de DGII
- ✅ Es un estado temporal normal
- ✅ DGII procesará el documento automáticamente

**Solo contacta a DGII si:**

- El código 99 persiste por más de 48 horas
- El portal de DGII muestra información contradictoria
- Tienes dudas sobre la validez legal del documento

---

### 17. ¿Qué registros debo guardar de un documento con código 99?

**Respuesta:**

Guarda la siguiente información:

```javascript
✅ Datos a Registrar:
- NCF del documento
- Código de seguridad
- Fecha de envío inicial
- Fecha de primera aparición del código 99
- Cantidad de consultas realizadas
- Fecha de última consulta
- XML firmado (ya lo tienes del envío inicial)
- Código QR (ya lo tienes del envío inicial)
- Logs de todas las consultas de estatus
```

**Estos registros son útiles para:**

- Auditorías futuras
- Resolución de problemas
- Métricas de desempeño del sistema

---

### 18. ¿El código 99 puede convertirse en error?

**Respuesta: ⚠️ RARO, pero posible**

**Escenarios:**

1. **Normal (99% de casos):**

   ```
   Código 99 → Código 1 (APROBADA)
   ```

2. **Rechazo tardío (raro):**

   ```
   Código 99 → Código 200+ (RECHAZADA)
   ```

   Puede ocurrir si DGII detecta un problema al validar

3. **Timeout (muy raro):**
   ```
   Código 99 → Persiste indefinidamente
   ```
   Problema en los sistemas de DGII

**En todos los casos, el documento inicial sigue siendo válido hasta que DGII indique lo contrario.**

---

### 19. ¿Afecta el código 99 mi certificado digital?

**Respuesta: ❌ NO**

El código 99 no tiene ninguna relación con tu certificado digital:

- ✅ Tu certificado sigue siendo válido
- ✅ La firma digital del documento es correcta
- ✅ No necesitas renovar o actualizar nada

**El código 99 solo indica que DGII está procesando la validación.**

---

### 20. ¿Dónde puedo encontrar más información?

**Respuesta:**

**Documentación del Sistema:**

- [CODIGO_99_SIN_RESPUESTA_DGII.md](./CODIGO_99_SIN_RESPUESTA_DGII.md) - Guía completa
- [RESUMEN_CODIGO_99.md](./RESUMEN_CODIGO_99.md) - Resumen ejecutivo
- [ESTADOS_THEFACTORY.md](./ESTADOS_THEFACTORY.md) - Todos los estados
- [CODIGOS_ERROR_DGII_COMPLETOS.md](./CODIGOS_ERROR_DGII_COMPLETOS.md) - Códigos completos

**Scripts de FileMaker:**

- [FileMaker_Manejo_Codigo99.fmfn](../scripts/FileMaker_Manejo_Codigo99.fmfn) - Implementación

**Recursos Externos:**

- Portal DGII: https://dgii.gov.do/
- Portal de consulta de e-CF: https://fc.dgii.gov.do/

**Soporte Técnico:**

- TheFactoryHKA: soporte@thefactoryhka.com.do
- DGII: 809-689-3444

---

## 🎯 Resumen Rápido

| Pregunta                    | Respuesta Corta                      |
| --------------------------- | ------------------------------------ |
| ¿Es un error?               | ❌ NO - Es un estado temporal normal |
| ¿Puedo entregar la factura? | ✅ SÍ - El documento es válido       |
| ¿Debo reenviar?             | ❌ NO - Solo esperar y consultar     |
| ¿Cuánto esperar?            | ⏰ 5-30 minutos (hasta 24h max)      |
| ¿Cada cuánto consultar?     | 🔄 Cada 5-30 minutos                 |
| ¿Es válido legalmente?      | ✅ SÍ - Completamente válido         |
| ¿Afecta el NCF?             | ❌ NO - NCF ya consumido             |
| ¿Puedo imprimir?            | ✅ SÍ - Sin problemas                |

---

**Última actualización:** 17 de octubre de 2025  
**Versión:** 1.0
