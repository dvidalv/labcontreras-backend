# Código 120: Documento No Encontrado en TheFactoryHKA

## 🚨 **Problema**

El backend devuelve:

```json
{
  "codigo": 120,
  "mensaje": "No se encuentra información del documento en BD.",
  "procesado": false
}
```

Pero el portal web de TheFactoryHKA muestra que el documento **SÍ existe** con estado "Rechazada".

---

## 🔍 **Causas Posibles**

### **1. Diferencia de Ambientes (Demo vs Producción)**

#### **Verificación:**

```javascript
// En utils/constants.js
THEFACTORY_BASE_URL = 'https://demoemision.thefactoryhka.com.do/api';
```

#### **Ambientes de TheFactoryHKA:**

- **Demo**: `https://demoemision.thefactoryhka.com.do`
- **Producción**: `https://emision.thefactoryhka.com.do`

#### **Problema:**

Si tu backend consulta en **DEMO** pero el NCF fue enviado a **PRODUCCIÓN** (o viceversa), no lo encontrará.

#### **Solución:**

Asegúrate de que tanto el envío como la consulta usen el **mismo ambiente**.

---

### **2. RNC Incorrecto en la Consulta**

#### **Verificación en Logs:**

```
🏢 RNC usado para consulta: 130085765
```

#### **Problema:**

Si el RNC usado para consultar no coincide con el RNC que envió el documento, TheFactoryHKA no lo encontrará.

#### **Solución:**

Verifica que `THEFACTORY_RNC` en tu `.env` sea `130085765`.

---

### **3. Documento Enviado desde Otro Sistema**

#### **Problema:**

Si el NCF fue enviado desde otro sistema (no desde tu backend), TheFactoryHKA puede requerir credenciales diferentes para consultarlo.

#### **Verificación:**

Busca en los logs de tu backend si ese NCF fue enviado:

```bash
grep "E330000000027" logs/*
```

#### **Solución:**

Si el documento fue enviado desde otro sistema, contacta a TheFactoryHKA para verificar permisos de consulta.

---

### **4. Delay de Sincronización**

#### **Problema:**

TheFactoryHKA puede tener un delay entre el envío y la disponibilidad del documento para consulta vía API.

#### **Solución Implementada:**

Ahora puedes usar el parámetro `reintentar` para esperar 2 segundos antes de consultar:

```json
POST /comprobantes/consultar-estatus
{
  "ncf": "E330000000027",
  "reintentar": true
}
```

---

## 🛠️ **Diagnóstico Paso a Paso**

### **Paso 1: Verificar Logs Completos**

Consulta el estatus del NCF y revisa:

```
📋 ==================== ENDPOINT CONSULTAR ESTATUS ====================
📥 Request body recibido: { "ncf": "E330000000027" }
🔍 Consulta de estatus solicitada para NCF: E330000000027

🔍 ==================== INICIO CONSULTA ESTATUS ====================
📄 NCF a consultar: E330000000027
🔐 Token obtenido: eyJhbGciOiJIUzI1NiIs...
📤 Payload enviado a TheFactoryHKA:
{
  "token": "...",
  "rnc": "130085765",  ← VERIFICA ESTE RNC
  "documento": "E330000000027"
}
🌐 URL de consulta: https://demoemision.thefactoryhka.com.do/api/EstatusDocumento  ← VERIFICA ESTE AMBIENTE
🏢 RNC usado para consulta: 130085765
```

### **Paso 2: Comparar con Portal Web**

1. Abre el portal web de TheFactoryHKA
2. Verifica que estés en el **mismo ambiente** (Demo vs Producción)
3. Busca el NCF `E330000000027`
4. Compara:
   - RNC emisor
   - Fecha de envío
   - Estado

### **Paso 3: Verificar Variables de Entorno**

```bash
# En el servidor o .env
THEFACTORY_BASE_URL=https://demoemision.thefactoryhka.com.do/api  # ¿Demo o Producción?
THEFACTORY_RNC=130085765                                          # ¿Correcto?
THEFACTORY_USUARIO=tu_usuario
THEFACTORY_CLAVE=tu_clave
```

### **Paso 4: Contactar Soporte TheFactoryHKA**

Si todo lo anterior está correcto, contacta a TheFactoryHKA con:

- NCF específico: `E330000000027`
- RNC: `130085765`
- Ambiente: Demo/Producción
- Fecha/hora de consulta
- Token usado (primeros 20 caracteres)

---

## 📊 **Respuesta Mejorada del Backend**

Ahora, cuando el documento no se encuentre (código 120), recibirás:

```json
{
  "status": "success",
  "message": "Consulta de estatus realizada exitosamente",
  "data": {
    "ncf": "E330000000027",
    "estado": "NO_ENCONTRADO",
    "estadoOriginal": "No se encuentra información del documento en BD.",
    "mensaje": "No se encuentra información del documento en BD.",
    "fechaConsulta": "2025-10-25T04:57:05.269Z",
    "datosCompletos": {
      "procesado": false,
      "codigo": 120,
      "mensaje": "No se encuentra información del documento en BD."
    },
    "advertencia": "El documento no se encuentra en la base de datos de TheFactoryHKA. Posibles causas: 1) El documento nunca fue enviado, 2) Diferencia de ambiente (Demo vs Producción), 3) RNC incorrecto en la consulta, 4) Delay en la sincronización de TheFactoryHKA."
  }
}
```

---

## 🎯 **Acciones Inmediatas**

1. **Consulta el estatus nuevamente** y comparte los logs completos que incluyan:

   - `🏢 RNC usado para consulta`
   - `🌐 URL de consulta`
   - Payload completo

2. **Verifica tu archivo `.env`**:

   ```bash
   cat .env | grep THEFACTORY
   ```

3. **Confirma el ambiente del portal web** donde ves el NCF como "Rechazada"

4. **Intenta con reintentar**:
   ```json
   {
     "ncf": "E330000000027",
     "reintentar": true
   }
   ```

---

## 📝 **Notas Importantes**

- El código **120** es el esperado cuando un documento no existe en la BD de TheFactoryHKA
- Si el portal web muestra el documento, hay una **inconsistencia** entre API y portal
- Esta inconsistencia suele deberse a **diferencia de ambientes** o **permisos de consulta**
- TheFactoryHKA puede tener **bases de datos separadas** para Demo y Producción
