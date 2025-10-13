# Guía: Descarga de Archivos XML/PDF desde TheFactoryHKA

## Descripción General

El endpoint `/comprobantes/descargar-archivo` permite descargar archivos XML o PDF de documentos electrónicos (e-NCF) que han sido enviados previamente a TheFactoryHKA.

## Características

- ✅ Descarga de archivos XML (estructura del e-NCF)
- ✅ Descarga de archivos PDF (representación visual del e-NCF)
- ✅ Autenticación automática con TheFactoryHKA
- ✅ Validación completa de parámetros
- ✅ Manejo robusto de errores
- ✅ Archivo devuelto en formato Base64

## Información del Endpoint

- **URL**: `POST /comprobantes/descargar-archivo`
- **Autenticación**: Bearer Token (JWT)
- **Content-Type**: `application/json`
- **Timeout**: 30 segundos

## Parámetros de Entrada

### Request Body (JSON)

```json
{
  "rnc": "130960088",
  "documento": "E310000000033",
  "extension": "xml"
}
```

| Campo       | Tipo   | Requerido | Descripción                     | Valores Permitidos   |
| ----------- | ------ | --------- | ------------------------------- | -------------------- |
| `rnc`       | string | ✅ Sí     | RNC del emisor del documento    | Cualquier RNC válido |
| `documento` | string | ✅ Sí     | Número del e-NCF a descargar    | Ej: "E310000000033"  |
| `extension` | string | ✅ Sí     | Formato del archivo a descargar | `"xml"` o `"pdf"`    |

## Respuestas

### Respuesta Exitosa (200 OK)

```json
{
  "status": "success",
  "message": "Archivo descargado exitosamente",
  "data": {
    "archivo": "PEVDRiB4bWxuczp4c2k9Imh0dHA6Ly93d3cudzMub3JnLzIwMDEvWE1MU2NoZW1hLWluc3RhbmNlIiB4c2k6...",
    "extension": "xml",
    "documento": "E310000000033",
    "rnc": "130960088",
    "procesado": true,
    "codigo": 130,
    "mensaje": "Descarga exitosa"
  }
}
```

### Respuesta de Error (400 Bad Request)

```json
{
  "status": "error",
  "message": "Error al descargar archivo: Documento no encontrado",
  "details": {
    "codigo": 404,
    "mensaje": "Documento no encontrado",
    "procesado": false
  }
}
```

### Códigos de Respuesta de TheFactoryHKA

| Código | Significado               |
| ------ | ------------------------- |
| 130    | Descarga exitosa          |
| 404    | Documento no encontrado   |
| 401    | Token inválido o expirado |
| 400    | Parámetros incorrectos    |

## Ejemplos de Uso

### 1. Usando cURL

```bash
curl -X POST http://localhost:3001/comprobantes/descargar-archivo \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rnc": "130960088",
    "documento": "E310000000033",
    "extension": "xml"
  }'
```

### 2. Usando JavaScript/Node.js

```javascript
const axios = require('axios');

async function descargarArchivoXML() {
  try {
    const response = await axios.post(
      'http://localhost:3001/comprobantes/descargar-archivo',
      {
        rnc: '130960088',
        documento: 'E310000000033',
        extension: 'xml',
      },
      {
        headers: {
          Authorization: 'Bearer YOUR_JWT_TOKEN',
          'Content-Type': 'application/json',
        },
      },
    );

    // El archivo viene en Base64
    const archivoBase64 = response.data.data.archivo;

    // Decodificar y guardar
    const buffer = Buffer.from(archivoBase64, 'base64');
    const fs = require('fs');
    fs.writeFileSync('documento.xml', buffer);

    console.log('Archivo descargado exitosamente');
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

descargarArchivoXML();
```

### 3. Usando JavaScript/Fetch API

```javascript
async function descargarArchivoPDF() {
  const response = await fetch(
    'http://localhost:3001/comprobantes/descargar-archivo',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer YOUR_JWT_TOKEN',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rnc: '130960088',
        documento: 'E310000000033',
        extension: 'pdf',
      }),
    },
  );

  const data = await response.json();

  if (data.status === 'success') {
    // Decodificar Base64 en el navegador
    const archivoBase64 = data.data.archivo;
    const blob = base64ToBlob(archivoBase64, 'application/pdf');

    // Crear enlace de descarga
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.data.documento}.pdf`;
    a.click();
  }
}

// Función auxiliar para convertir Base64 a Blob
function base64ToBlob(base64, mimeType) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
```

### 4. Usando Python

```python
import requests
import base64

def descargar_archivo():
    url = 'http://localhost:3001/comprobantes/descargar-archivo'
    headers = {
        'Authorization': 'Bearer YOUR_JWT_TOKEN',
        'Content-Type': 'application/json'
    }
    payload = {
        'rnc': '130960088',
        'documento': 'E310000000033',
        'extension': 'xml'
    }

    response = requests.post(url, json=payload, headers=headers)
    data = response.json()

    if data['status'] == 'success':
        # Decodificar Base64
        archivo_base64 = data['data']['archivo']
        archivo_contenido = base64.b64decode(archivo_base64)

        # Guardar archivo
        with open('documento.xml', 'wb') as f:
            f.write(archivo_contenido)

        print('Archivo descargado exitosamente')
    else:
        print(f"Error: {data['message']}")

descargar_archivo()
```

## Manejo del Archivo Base64

El archivo se devuelve codificado en Base64 en el campo `data.archivo`. Aquí están las formas de decodificarlo:

### Node.js

```javascript
const buffer = Buffer.from(archivoBase64, 'base64');

// Guardar como archivo
const fs = require('fs');
fs.writeFileSync('documento.xml', buffer);

// O obtener como string (para XML)
const contenido = buffer.toString('utf-8');
console.log(contenido);
```

### Navegador

```javascript
// Convertir a Blob para descarga
function base64ToBlob(base64, mimeType) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// Para XML
const blob = base64ToBlob(archivoBase64, 'application/xml');

// Para PDF
const blob = base64ToBlob(archivoBase64, 'application/pdf');
```

### Python

```python
import base64

# Decodificar
archivo_contenido = base64.b64decode(archivo_base64)

# Guardar
with open('documento.xml', 'wb') as f:
    f.write(archivo_contenido)
```

## Validaciones

El endpoint realiza las siguientes validaciones:

1. **RNC**: Debe estar presente en el request body
2. **Documento**: Debe estar presente y ser un e-NCF válido
3. **Extensión**: Debe ser "xml" o "pdf" (case-insensitive)
4. **Autenticación**: Debe incluir un token JWT válido

## Errores Comunes

### 1. Token de autenticación inválido

```json
{
  "status": "error",
  "message": "Token inválido o expirado"
}
```

**Solución**: Verificar que el token JWT sea válido y no haya expirado.

### 2. Documento no encontrado

```json
{
  "status": "error",
  "message": "Error al descargar archivo: Documento no encontrado",
  "details": {
    "codigo": 404,
    "mensaje": "Documento no encontrado"
  }
}
```

**Solución**: Verificar que:

- El número de documento (e-NCF) sea correcto
- El documento haya sido enviado previamente a TheFactoryHKA
- El RNC corresponda al emisor del documento

### 3. Extensión inválida

```json
{
  "status": "error",
  "message": "El parámetro \"extension\" debe ser \"xml\" o \"pdf\""
}
```

**Solución**: Usar solo "xml" o "pdf" como extensión.

### 4. Parámetros faltantes

```json
{
  "status": "error",
  "message": "El parámetro \"rnc\" es obligatorio"
}
```

**Solución**: Incluir todos los parámetros requeridos (rnc, documento, extension).

### 5. Timeout de conexión

```json
{
  "status": "error",
  "message": "Timeout al conectar con TheFactoryHKA"
}
```

**Solución**:

- Verificar conexión a internet
- Verificar que TheFactoryHKA esté disponible
- Reintentar la solicitud

## Pruebas

### Script de Prueba

Ejecutar el script de prueba incluido:

```bash
# Configurar token de autenticación
export TEST_AUTH_TOKEN="tu_token_jwt_aqui"

# Ejecutar prueba
node utils/testDescargarArchivo.js
```

### Ejemplo de Prueba Manual

```bash
# 1. Autenticarse primero (obtener token)
TOKEN=$(curl -X POST http://localhost:3001/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tupassword"}' \
  | jq -r '.token')

# 2. Descargar archivo XML
curl -X POST http://localhost:3001/comprobantes/descargar-archivo \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rnc": "130960088",
    "documento": "E310000000033",
    "extension": "xml"
  }' | jq '.'

# 3. Descargar archivo PDF
curl -X POST http://localhost:3001/comprobantes/descargar-archivo \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rnc": "130960088",
    "documento": "E310000000033",
    "extension": "pdf"
  }' | jq '.'
```

## Flujo de Trabajo Completo

1. **Enviar factura electrónica** usando `/comprobantes/enviar-electronica`
2. **Consultar estatus** usando `/comprobantes/consultar-estatus`
3. **Descargar archivo** usando `/comprobantes/descargar-archivo`
4. **Enviar por email** (opcional) usando `/comprobantes/enviar-email`

### Ejemplo de Flujo

```javascript
const axios = require('axios');

async function flujoCompleto() {
  const baseURL = 'http://localhost:3001';
  const token = 'YOUR_JWT_TOKEN';
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // 1. Enviar factura
  const envioResp = await axios.post(
    `${baseURL}/comprobantes/enviar-electronica`,
    {
      /* datos de factura */
    },
    config,
  );

  const eNCF = envioResp.data.data.eNCF;

  // 2. Consultar estatus
  const estatusResp = await axios.post(
    `${baseURL}/comprobantes/consultar-estatus`,
    {
      rnc: '130960088',
      documento: eNCF,
    },
    config,
  );

  // 3. Descargar XML
  const xmlResp = await axios.post(
    `${baseURL}/comprobantes/descargar-archivo`,
    {
      rnc: '130960088',
      documento: eNCF,
      extension: 'xml',
    },
    config,
  );

  // 4. Descargar PDF
  const pdfResp = await axios.post(
    `${baseURL}/comprobantes/descargar-archivo`,
    {
      rnc: '130960088',
      documento: eNCF,
      extension: 'pdf',
    },
    config,
  );

  console.log('Flujo completado exitosamente');
}
```

## Notas Importantes

1. **Cache de Token**: El endpoint maneja automáticamente la autenticación con TheFactoryHKA y cachea el token para mejor rendimiento.

2. **Tamaño de Archivos**: Los archivos XML suelen ser más pequeños que los PDF. Ten en cuenta esto al planificar el almacenamiento.

3. **Base64 Encoding**: El archivo se devuelve en Base64 para garantizar la integridad durante la transmisión JSON.

4. **Timeout**: El timeout está configurado en 30 segundos. Si necesitas descargar archivos muy grandes, considera aumentar este valor.

5. **Documentos Válidos**: Solo puedes descargar documentos que hayan sido previamente enviados y aceptados por TheFactoryHKA.

## Archivos Relacionados

- **Controlador**: `controllers/comprobantes.js` - Función `descargarArchivo`
- **Ruta**: `routes/comprobantes.js` - Ruta `/descargar-archivo`
- **Constantes**: `utils/constants.js` - `THEFACTORY_DESCARGA_URL`
- **Ejemplo JSON**: `utils/ejemplo-descargar-archivo.json`
- **Script de Prueba**: `utils/testDescargarArchivo.js`

## Soporte

Para más información sobre la API de TheFactoryHKA, consulta:

- [Documentación oficial de TheFactoryHKA](https://felwiki.thefactoryhka.com.do/)
- Documentación interna en `/docs/`

## Changelog

- **v1.0.0** (2025-10-13): Implementación inicial del endpoint de descarga de archivos
