# 📧 The Factory HKA - Email Integration

## 🚀 Integración Completa con API de Envío de Correos

Esta implementación permite enviar emails de documentos electrónicos a través de The Factory HKA según la [documentación oficial](https://felwiki.thefactoryhka.com.do/doku.php?id=restapienviocorreo).

### ✅ Características Implementadas

- ✅ **Reutilización de tokens**: Usa el mismo sistema de autenticación que la facturación electrónica
- ✅ **Validación robusta**: Valida emails, documentos y parámetros requeridos
- ✅ **Manejo de errores**: Incluye manejo completo de errores de API y red
- ✅ **Logging detallado**: Para debugging y monitoreo
- ✅ **Múltiples destinatarios**: Soporte para hasta 10 correos por solicitud
- ✅ **Respuestas normalizadas**: Interfaz consistente con el resto del sistema

## 🔧 Configuración

### Variables de Entorno

Reutiliza las mismas variables de The Factory HKA ya configuradas:

```bash
# TheFactoryHKA (ya configuradas para facturación electrónica)
THEFACTORY_USUARIO=tu_usuario_thefactory
THEFACTORY_CLAVE=tu_password_thefactory
THEFACTORY_RNC=tu_rnc_empresa
```

## 📋 Endpoint

**URL:** `POST /comprobantes/enviar-email`  
**Autenticación:** Bearer Token (JWT del sistema)

### Request Headers

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer tu_jwt_token"
}
```

### Request Body

```json
{
  "documento": "E310000000051",
  "correos": ["cliente@email.com", "contador@empresa.com"],
  "rnc": "130960054"
}
```

### Parámetros

| Campo       | Tipo     | Requerido | Descripción                                               |
| ----------- | -------- | --------- | --------------------------------------------------------- |
| `documento` | string   | ✅        | Número de comprobante fiscal (NCF) del documento a enviar |
| `correos`   | string[] | ✅        | Array de emails destinatarios (máximo 10)                 |
| `rnc`       | string   | ❌        | RNC del emisor (usa el del .env si no se proporciona)     |

## 📊 Respuestas

### ✅ Email Encolado (200) - Respuesta Normal

```json
{
  "status": "success",
  "message": "Correo electrónico pendiente por ser enviado",
  "data": {
    "documento": "E310000000051",
    "correos": ["cliente@email.com"],
    "rnc": "130960054",
    "codigo": 0,
    "procesado": false,
    "respuestaCompleta": {
      "procesado": false,
      "codigo": 0,
      "mensaje": "Correo electrónico pendiente por ser enviado"
    }
  }
}
```

### ✅ Email Procesado (200) - Respuesta Alternativa

```json
{
  "status": "success",
  "message": "Correo electrónico enviado exitosamente",
  "data": {
    "documento": "E310000000051",
    "correos": ["cliente@email.com"],
    "rnc": "130960054",
    "codigo": 0,
    "procesado": true,
    "respuestaCompleta": {
      "procesado": true,
      "codigo": 0,
      "mensaje": "Correo electrónico enviado exitosamente"
    }
  }
}
```

### ❌ Errores Comunes

#### Documento Faltante (400)

```json
{
  "status": "error",
  "message": "El número de documento (NCF) es requerido",
  "details": "Debe proporcionar el NCF del documento a enviar por email"
}
```

#### Correos Inválidos (400)

```json
{
  "status": "error",
  "message": "Emails inválidos: correo-invalido@",
  "details": "Uno o más emails no tienen formato válido"
}
```

#### Demasiados Destinatarios (400)

```json
{
  "status": "error",
  "message": "Máximo 10 destinatarios por solicitud",
  "details": "Para mejores resultados, limite el envío a máximo 10 correos por llamada"
}
```

#### Error de Autenticación (500)

```json
{
  "status": "error",
  "message": "Error al enviar email",
  "details": "Credenciales inválidas para TheFactoryHKA"
}
```

#### Documento No Encontrado (400)

```json
{
  "status": "error",
  "message": "Documento no encontrado o no disponible para envío",
  "details": {
    "codigo": 404,
    "mensaje": "El documento especificado no existe",
    "procesado": false
  }
}
```

## 🔄 Flujo de Funcionamiento

1. **Validación de entrada**: Se validan el NCF y los emails
2. **Autenticación**: Se obtiene/reutiliza token de The Factory HKA
3. **Envío de solicitud**: Se envía la solicitud a The Factory HKA
4. **Procesamiento**: The Factory HKA encola o envía inmediatamente
5. **Respuesta**: Se devuelve el status del procesamiento

## 📝 Uso Programático

### Usando el Servicio Directamente

```javascript
const { enviarEmailTheFactory } = require('./api/thefactory-email');

try {
  const resultado = await enviarEmailTheFactory({
    documento: 'E310000000051',
    correos: ['cliente@email.com', 'contador@empresa.com'],
    rnc: '130960054', // Opcional
  });

  if (resultado.success) {
    console.log('Email enviado:', resultado.message);
  } else {
    console.error('Error:', resultado.message);
  }
} catch (error) {
  console.error('Error de sistema:', error.message);
}
```

### Integración con Flujo de Facturación

```javascript
// Después de enviar factura electrónica exitosamente
try {
  // 1. Enviar factura a The Factory HKA
  const facturaResult = await enviarFacturaElectronica(facturaData);

  if (facturaResult.success) {
    // 2. Enviar email automáticamente
    await enviarEmailTheFactory({
      documento: facturaData.factura.ncf,
      correos: [facturaData.comprador.correo],
    });
  }
} catch (error) {
  console.error('Error en flujo completo:', error);
}
```

## 🔍 Debugging y Monitoreo

### Logs Disponibles

Los logs incluyen información detallada sobre:

- 📧 Inicio de solicitud de email
- 🔐 Estado de autenticación/token
- 📤 Envío de solicitud a The Factory HKA
- 📨 Respuesta recibida
- ✅/❌ Resultado final

### Ejemplo de Logs

```
📧 Solicitud de envío de email recibida: {"documento":"E310000000051","correos":2,"rnc":"usando RNC del sistema"}
♻️ Reutilizando token válido (142 min restantes)
📤 Enviando solicitud de email a The Factory HKA... {"url":"https://demoemision.thefactoryhka.com.do/api/EnvioCorreo","documento":"E310000000051","destinatarios":2}
📨 Respuesta de The Factory HKA: {"procesado":false,"codigo":0,"mensaje":"Correo electrónico pendiente por ser enviado"}
```

## 🚨 Consideraciones Importantes

### Limitaciones de The Factory HKA

1. **Queue System**: Los emails se procesan de manera asíncrona
2. **Rate Limiting**: Evitar envíos masivos simultáneos
3. **Documento Válido**: El NCF debe existir y estar procesado en The Factory HKA
4. **Token Sharing**: Reutiliza tokens de autenticación del sistema principal

### Mejores Prácticas

1. **Validar Documento**: Asegúrate de que el NCF esté procesado antes de enviar email
2. **Manejar Errores**: Implementa retry logic para errores temporales
3. **Lote Pequeño**: Máximo 10 destinatarios por solicitud
4. **Monitoreo**: Revisar logs para identificar problemas de entrega

### Integración Recomendada

```javascript
// Flujo completo recomendado
async function procesarFacturaCompleta(facturaData) {
  try {
    // 1. Enviar factura electrónica
    console.log('📄 Enviando factura electrónica...');
    const facturaResult = await enviarFacturaElectronica(facturaData);

    if (!facturaResult.success) {
      throw new Error(`Error en factura: ${facturaResult.message}`);
    }

    // 2. Esperar un momento para que se procese
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3. Enviar email con el documento
    if (facturaData.comprador.correo) {
      console.log('📧 Enviando email del documento...');
      const emailResult = await enviarEmailTheFactory({
        documento: facturaData.factura.ncf,
        correos: [facturaData.comprador.correo],
      });

      console.log('📨 Email:', emailResult.message);
    }

    return {
      factura: facturaResult,
      email: emailResult || { message: 'Email no solicitado' },
    };
  } catch (error) {
    console.error('❌ Error en proceso completo:', error);
    throw error;
  }
}
```

## 🔗 Referencias

- [Documentación oficial de The Factory HKA - EnvioCorreo](https://felwiki.thefactoryhka.com.do/doku.php?id=restapienviocorreo)
- [Documentación de Facturación Electrónica](./FACTURACION_ELECTRONICA.md)
- [Configuración de Brevo](./BREVO_SETUP.md) (sistema alternativo de emails)
