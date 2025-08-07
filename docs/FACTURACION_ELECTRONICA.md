# 📄 Facturación Electrónica - TheFactoryHKA

## 🚀 Implementación Completa con Autenticación Dinámica

Esta implementación permite enviar facturas electrónicas a TheFactoryHKA usando autenticación dinámica según la [documentación oficial](https://felwiki.thefactoryhka.com.do/doku.php?id=restapiautenticacion).

### ✅ Características Implementadas

- ✅ **Autenticación dinámica**: Obtiene tokens automáticamente
- ✅ **Cache inteligente**: Reutiliza tokens válidos por eficiencia
- ✅ **Auto-renovación**: Renueva tokens antes de que expiren
- ✅ **Transformación automática**: JSON simple → Formato completo TheFactoryHKA
- ✅ **Manejo robusto de errores**: Incluye errores de autenticación
- ✅ **Validaciones completas**: Datos obligatorios y formato
- ✅ **Logging detallado**: Para debugging y monitoreo

## 🔧 Configuración

### Variables de Entorno Requeridas

Añade las siguientes variables a tu archivo `.env` y `.env.local`:

```bash
# TheFactoryHKA Facturación Electrónica
THEFACTORY_USUARIO=tu_usuario_thefactory
THEFACTORY_CLAVE=tu_password_thefactory
THEFACTORY_RNC=tu_rnc_empresa
```

## 📋 Endpoint

**URL:** `POST /comprobantes/enviar-electronica`  
**Autenticación:** Bearer Token (JWT del sistema)

### Request Headers

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer tu_jwt_token"
}
```

### Request Body (JSON Simplificado)

```json
{
  "comprador": {
    "correo": "cliente@email.com",
    "nombre": "Romelia Nuñez Ventura",
    "rnc": "01800322305",
    "direccion": "Calle Principal #123"
  },
  "emisor": {
    "correo": "informacion@contrerasrobledo.com.do",
    "direccion": "Av. Juan Pablo Duarte No. 76",
    "razonSocial": "LABORATORIO DE PATOLOGIA CONTRERAS ROBLEDO",
    "rnc": "130085765",
    "telefono": ["809-580-1428"]
  },
  "factura": {
    "fecha": "01-07-2025",
    "id": "399515",
    "ncf": "E310000000031",
    "tipo": "31",
    "total": "19000.00"
  },
  "items": [
    {
      "nombre": "Hígado",
      "precio": "5000.00",
      "descripcion": "Análisis completo"
    },
    {
      "nombre": "Inmunohistoquimica",
      "precio": "14000.00"
    }
  ]
}
```

## 📊 Respuestas

### ✅ Éxito (200)

```json
{
  "status": "success",
  "message": "Factura electrónica enviada exitosamente",
  "data": {
    "facturaOriginal": {
      /* tu JSON original */
    },
    "respuestaTheFactory": {
      "xmlBase64": "...",
      "procesado": true,
      "codigoSeguridad": "AzaICL",
      "fechaFirma": "11-03-2024 12:32:09",
      "codigo": 0,
      "mensaje": "Documento procesado correctamente"
    },
    "ncfGenerado": "E310000000031"
  }
}
```

### ❌ Errores Comunes

#### Error de Autenticación (401)

```json
{
  "status": "error",
  "message": "Error de autenticación con TheFactoryHKA",
  "details": "Credenciales inválidas"
}
```

#### Datos Faltantes (400)

```json
{
  "status": "error",
  "message": "Faltan datos obligatorios en la factura"
}
```

#### Timeout (408)

```json
{
  "status": "error",
  "message": "Timeout en la autenticación con TheFactoryHKA"
}
```

## 🔄 Flujo de Autenticación

1. **Primera llamada**: Se obtiene token de TheFactoryHKA
2. **Cache**: Token se guarda en memoria con fecha de expiración
3. **Siguientes llamadas**: Se reutiliza token del cache
4. **Auto-renovación**: Si token expira en <5 min, se renueva automáticamente
5. **Limpieza de cache**: En caso de error 401/403, se limpia el cache

## 🔒 Seguridad

- **Credenciales seguras**: Solo en variables de entorno
- **Tokens temporales**: No se almacenan permanentemente
- **Validación JWT**: Requiere autenticación del usuario
- **Timeouts**: Evita bloqueos por conexiones lentas

## 🧪 Testing

Usar el archivo de ejemplo: `utils/ejemplo-factura-electronica.json`

```bash
curl -X POST http://localhost:3001/comprobantes/enviar-electronica \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_jwt_token" \
  -d @utils/ejemplo-factura-electronica.json
```

## 📋 Campos Automáticos

El sistema completa automáticamente:

- **Municipio/Provincia**: Santo Domingo por defecto
- **Tipo de pago**: Efectivo
- **Cantidad items**: 1.00 por defecto
- **Unidad de medida**: Servicios (47)
- **Montos**: Exento de ITBIS por defecto
- **Observaciones**: "FACTURA ELECTRONICA"

## 🔧 Personalización

Para modificar valores por defecto, editar la función `transformarFacturaParaTheFactory` en `controllers/comprobantes.js`.

## 📞 Soporte

Para problemas con la integración de TheFactoryHKA, consultar:

- [Documentación oficial](https://felwiki.thefactoryhka.com.do/)
- [API de Autenticación](https://felwiki.thefactoryhka.com.do/doku.php?id=restapiautenticacion)
- [API de Envío](https://felwiki.thefactoryhka.com.do/doku.php?id=restapienviar)
