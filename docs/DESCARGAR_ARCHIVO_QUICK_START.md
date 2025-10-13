# Quick Start: Descargar Archivos XML/PDF

## 🚀 Uso Rápido

### Endpoint

```
POST /comprobantes/descargar-archivo
```

### Request Mínimo

```bash
curl -X POST https://tu-servidor.com/comprobantes/descargar-archivo \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "rnc": "130960088",
    "documento": "E310000000033",
    "extension": "xml"
  }'
```

### Request Body

```json
{
  "rnc": "130960088", // RNC del emisor
  "documento": "E310000000033", // Número de e-NCF
  "extension": "xml" // "xml" o "pdf"
}
```

### Response

```json
{
  "status": "success",
  "message": "Archivo descargado exitosamente",
  "data": {
    "archivo": "PEVDRiB4bWxuczp4c2k9...", // Base64
    "extension": "xml",
    "documento": "E310000000033",
    "rnc": "130960088",
    "procesado": true,
    "codigo": 130,
    "mensaje": "Descarga exitosa"
  }
}
```

## 💻 Código JavaScript

```javascript
const axios = require('axios');
const fs = require('fs');

async function descargar() {
  const response = await axios.post(
    'https://tu-servidor.com/comprobantes/descargar-archivo',
    {
      rnc: '130960088',
      documento: 'E310000000033',
      extension: 'xml', // o 'pdf'
    },
    {
      headers: {
        Authorization: 'Bearer TU_TOKEN',
        'Content-Type': 'application/json',
      },
    },
  );

  // Guardar archivo
  const buffer = Buffer.from(response.data.data.archivo, 'base64');
  fs.writeFileSync('documento.xml', buffer);
}
```

## 🧪 Testing

```bash
# 1. Configurar token
export TEST_AUTH_TOKEN="tu_token_jwt"

# 2. Ejecutar test
node utils/testDescargarArchivo.js
```

## 📚 Más Información

- [Guía Completa](./DESCARGAR_ARCHIVO_GUIA.md)
- [Detalles de Implementación](./IMPLEMENTACION_DESCARGAR_ARCHIVO.md)
- [Ejemplos JSON](../utils/ejemplo-descargar-archivo.json)
