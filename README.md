# Lab Contreras Backend

Backend del sistema de gestión para Lab Contreras, desarrollado con Node.js, Express y MongoDB.

## 🚀 Características

- **API REST** para gestión de usuarios, médicos y sugerencias
- **Autenticación JWT** con roles de usuario
- **Envío de emails** con Brevo (transaccionales y notificaciones)
- **Upload de archivos** con Cloudinary
- **Base de datos** MongoDB con Mongoose
- **QR Code** generación para comprobantes

## 📧 Sistema de Emails

El sistema utiliza **Brevo** para el envío de emails transaccionales:

- Emails de recuperación de contraseña
- Invitaciones a nuevos usuarios
- Notificaciones de sugerencias
- Emails de contacto desde el sitio web

Ver documentación completa en [docs/BREVO_SETUP.md](docs/BREVO_SETUP.md)

## 🛠️ Instalación

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd labcontreras-backend
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**
   Crear archivo `.env` con:

```bash
# Base de datos
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Brevo Email Service
BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=servicios@contrerasrobledo.com.do
BREVO_FROM_NAME=Lab Contreras

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Servidor
PORT=3000
```

4. **Probar configuración de emails**

```bash
node utils/testBrevo.js
```

5. **Iniciar servidor**

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📁 Estructura del Proyecto

```
├── api/
│   ├── api-mail_brevo.js      # Servicio de emails con Brevo
│   ├── cloudinaryConfig.js    # Configuración de Cloudinary
│   └── index.js               # Punto de entrada de la API
├── controllers/               # Controladores de la API
├── models/                    # Modelos de MongoDB
├── routes/                    # Rutas de la API
├── middleware/                # Middleware personalizado
├── utils/                     # Utilidades y scripts
├── scripts/                   # Scripts de mantenimiento
└── docs/                      # Documentación
```

## 🔧 Scripts Disponibles

- `npm start` - Iniciar servidor en producción
- `npm run dev` - Iniciar servidor en desarrollo con nodemon
- `npm run lint` - Ejecutar ESLint
- `npm test` - Ejecutar tests
- `node utils/testBrevo.js` - Probar configuración de Brevo
- `node scripts/migrarABrevo.js` - Herramienta de migración de emails

## 📚 API Endpoints

### Autenticación

- `POST /users/signin` - Iniciar sesión
- `POST /users/signup` - Registrar usuario
- `POST /users/forgot-password` - Recuperar contraseña
- `POST /users/reset-password` - Restablecer contraseña

### Usuarios

- `GET /users/me` - Obtener usuario actual
- `PATCH /users/me` - Actualizar perfil
- `POST /users/invite` - Invitar nuevo usuario

### Emails

- `POST /api/contact` - Enviar email de contacto

### Otros

- `GET /medicos` - Listado de médicos
- `POST /api/sugerencias` - Enviar sugerencias
- `POST /comprobantes` - Generar comprobantes con QR

## 🔐 Seguridad

- Autenticación JWT con expiración
- Validación de datos con Celebrate/Joi
- Encriptación de contraseñas con bcrypt
- CORS configurado para dominios específicos
- Rate limiting (próximamente)

## 📊 Monitoreo

- Logs estructurados con Winston
- Manejo de errores centralizado
- Validación de entrada de datos

## 🚀 Deployment

El proyecto está configurado para deployment en Vercel:

```bash
npm run build
vercel --prod
```

Variables de entorno necesarias en Vercel:

- Todas las variables del archivo `.env`
- `NODE_ENV=production`

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para nueva feature (`git checkout -b feature/nueva-feature`)
3. Commit cambios (`git commit -am 'Agregar nueva feature'`)
4. Push a la rama (`git push origin feature/nueva-feature`)
5. Crear Pull Request

## 📝 Changelog

### v2.0.0 (2024)

- ✨ Migración completa de SendGrid a Brevo
- 🎨 Mejoras en el diseño de emails HTML
- 📧 Nuevos templates para emails transaccionales
- 🔧 Scripts de migración y testing

### v1.0.0 (2024)

- 🚀 Versión inicial del sistema
- 👤 Sistema de autenticación completo
- 📊 API para gestión de datos médicos
- 📱 Integración con QR codes

## 📞 Soporte

Para soporte técnico, contactar a [servicios@contrerasrobledo.com.do](mailto:servicios@contrerasrobledo.com.do)

## 📄 Licencia

Este proyecto es propiedad de Lab Contreras y está protegido bajo acuerdos de confidencialidad.
