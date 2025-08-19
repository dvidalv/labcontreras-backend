# Configuración de Brevo para Envío de Emails

> **Nota:** Este proyecto utiliza el SDK oficial de Brevo (`sib-api-v3-sdk`) para el envío de emails transaccionales.

## Variables de Entorno Necesarias

Agrega las siguientes variables a tu archivo `.env`:

```bash
# Configuración de Brevo
BREVO_API_KEY=your_brevo_api_key_here
BREVO_FROM_EMAIL=servicios@contrerasrobledo.com.do
BREVO_FROM_NAME=Lab Contreras

# Email de pruebas (opcional)
TEST_EMAIL=test@example.com
```

## Cómo Obtener tu API Key de Brevo

1. Crea una cuenta en [Brevo](https://www.brevo.com) si no tienes una
2. Inicia sesión en tu cuenta
3. Ve a **Settings** > **SMTP & API**
4. En la pestaña **API Keys**, haz clic en **Generate a new API key**
5. Dale un nombre a tu API key (ej: "Lab Contreras Backend")
6. Copia la API key generada y pégala en tu archivo `.env`

## Instalación del SDK

El proyecto utiliza el SDK oficial de Brevo:

```bash
npm install sib-api-v3-sdk
```

> **Nota:** Aunque el paquete muestra un warning de deprecated, sigue siendo el SDK oficial recomendado por Brevo para Node.js.

## Configuración del Dominio de Envío

Para mejorar la entregabilidad de tus emails:

1. Ve a **Senders & Domains** en tu cuenta de Brevo
2. Agrega tu dominio `contrerasrobledo.com.do`
3. Configura los registros DNS requeridos
4. Verifica el dominio

## Funciones Disponibles

### `sendMail(req, res)`

Controlador para la API REST - mantiene compatibilidad con el código existente

### `sendEmail(emailData)`

Función de utilidad para enviar emails programáticamente:

```javascript
const { sendEmail } = require('./api/api-mail_brevo');

await sendEmail({
  to: 'usuario@example.com',
  subject: 'Asunto del email',
  htmlContent: '<h1>Contenido HTML</h1>',
  textContent: 'Contenido en texto plano',
});
```

### `sendNotificationEmail(to, subject, content, options)`

Para emails de notificación del sistema

### `testBrevoConfiguration()`

Prueba la configuración de Brevo

## Migración desde SendGrid

El nuevo servicio de Brevo mantiene la misma interfaz que SendGrid, por lo que no necesitas cambiar tu código existente. Solo cambia el import:

```javascript
// Antes (SendGrid)
const { sendMail } = require('./api/api-mail');

// Después (Brevo)
const { sendMail } = require('./api/api-mail_brevo');
```

## Límites y Consideraciones

- Brevo ofrece 300 emails gratuitos por día
- Mejor entregabilidad que muchos otros proveedores
- Soporte para plantillas HTML avanzadas
- Estadísticas detalladas de entrega

## Prueba de Configuración

Ejecuta la función de prueba para verificar que todo esté configurado correctamente:

```javascript
const { testBrevoConfiguration } = require('./api/api-mail_brevo');

testBrevoConfiguration()
  .then((result) => console.log('✅ Brevo configurado correctamente'))
  .catch((error) => console.error('❌ Error en configuración:', error));
```
