# Anulación de Comprobantes Fiscales

## Descripción General

Este endpoint permite anular secuencias de comprobantes fiscales (NCF) utilizando la API de TheFactory HKA. La anulación es necesaria cuando se necesita invalidar uno o más NCF que no han sido utilizados o fueron emitidos incorrectamente.

## Endpoint

```
POST /comprobantes/anular
```

**Requiere autenticación**: Sí (JWT Token)

## Formato de Solicitud

### Entrada Simplificada

El endpoint acepta un formato simplificado que luego se transforma automáticamente al formato requerido por TheFactory HKA.

#### ✅ Opción 1: Anular UN solo comprobante (Lo más común)

```json
{
  "rnc": "130960054",
  "anulaciones": [
    {
      "tipoDocumento": "31",
      "ncf": "E310000000098"
    }
  ]
}
```

#### Opción 2: Anular UN comprobante (forma alternativa)

```json
{
  "rnc": "130960054",
  "anulaciones": [
    {
      "tipoDocumento": "31",
      "ncfDesde": "E310000000098"
    }
  ]
}
```

> **Nota**: Si solo se proporciona `ncfDesde`, se asume que se anula un solo comprobante (ncfHasta = ncfDesde).

#### Opción 3: Anular un RANGO de comprobantes

```json
{
  "rnc": "130960054",
  "fechaHoraAnulacion": "16-06-2022 09:23:59", // Opcional
  "anulaciones": [
    {
      "tipoDocumento": "31",
      "ncfDesde": "E310000000098",
      "ncfHasta": "E310000000099"
    }
  ]
}
```

### Campos

| Campo                         | Tipo   | Requerido           | Descripción                                                                                                   |
| ----------------------------- | ------ | ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `rnc`                         | string | Sí                  | RNC del emisor (9 u 11 dígitos)                                                                               |
| `fechaHoraAnulacion`          | string | No                  | Fecha/hora de anulación en formato `DD-MM-YYYY HH:mm:ss`. Si no se proporciona, se usa la fecha/hora actual   |
| `anulaciones`                 | array  | Sí                  | Array de objetos con las secuencias a anular                                                                  |
| `anulaciones[].tipoDocumento` | string | Sí                  | Tipo de comprobante (31-47)                                                                                   |
| `anulaciones[].ncf`           | string | Condicional\*       | NCF a anular (para un solo comprobante). Si se usa, no es necesario `ncfDesde`/`ncfHasta`                     |
| `anulaciones[].ncfDesde`      | string | Condicional\*       | NCF inicial del rango a anular. Si solo se proporciona este, se asume anulación de un solo comprobante        |
| `anulaciones[].ncfHasta`      | string | No (si solo un NCF) | NCF final del rango a anular. Solo necesario para rangos. Si no se proporciona, se usa el valor de `ncfDesde` |

\* **Nota**: Debes proporcionar **al menos uno** de: `ncf` O `ncfDesde`. Si solo proporcionas `ncfDesde` (sin `ncfHasta`), se anula un solo comprobante.

## Validaciones Implementadas

### 1. Validación de Campos Requeridos

- El campo `rnc` es obligatorio
- El array `anulaciones` debe contener al menos un elemento

### 2. Validación de Tipos de Documento

Tipos válidos: `31`, `32`, `33`, `34`, `41`, `43`, `44`, `45`, `46`, `47`

**Descripción de tipos:**

- **31**: Factura de crédito fiscal
- **32**: Factura de consumo
- **33**: Nota de débito
- **34**: Nota de crédito
- **41**: Compras
- **43**: Gastos menores
- **44**: Regímenes especiales
- **45**: Gubernamental
- **46**: Exportaciones
- **47**: Pagos al exterior

### 3. Validación de Formato NCF

- **Formato estándar**: `E` + tipo (2 dígitos) + secuencia (8 dígitos) = **11 caracteres**
  - Ejemplo: `E3100000098`
- **Formato extendido**: `E` + tipo (2 dígitos) + secuencia (10 dígitos) = **13 caracteres**
  - Ejemplo: `E310000000147`
- El tipo en el NCF debe coincidir con el `tipoDocumento`
- Se aceptan ambos formatos (11 o 13 caracteres)

### 4. Validación de Rangos

- `ncfHasta` debe ser mayor o igual a `ncfDesde`
- Ambos NCF deben ser del mismo tipo de documento

### 5. Validación de Fecha

- Formato: `DD-MM-YYYY HH:mm:ss`
- Ejemplo: `16-06-2022 09:23:59`

## Transformación Automática

El endpoint transforma automáticamente la entrada simplificada al formato requerido por TheFactory HKA:

**Entrada del usuario:**

```json
{
  "rnc": "130960054",
  "anulaciones": [
    {
      "tipoDocumento": "31",
      "ncfDesde": "E310000000098",
      "ncfHasta": "E310000000099"
    }
  ]
}
```

**Transformado a TheFactory HKA:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Anulacion": {
    "Encabezado": {
      "RNC": "130960054",
      "Cantidad": "02",
      "FechaHoraAnulacioneNCF": "16-06-2022 09:23:59"
    },
    "DetallesAnulacion": [
      {
        "NumeroLinea": "1",
        "TipoDocumento": "31",
        "TablaSecuenciasAnuladas": [
          {
            "NCFDesde": "E310000000098",
            "NCFHasta": "E310000000099"
          }
        ],
        "Cantidad": "02"
      }
    ]
  }
}
```

### Cálculos Automáticos

1. **Cantidad por rango**: Se calcula automáticamente: `(ncfHasta - ncfDesde) + 1`
2. **Cantidad total**: Suma de todas las cantidades de todos los rangos
3. **Fecha/hora**: Si no se proporciona, se genera automáticamente en el formato correcto
4. **Número de línea**: Se asigna automáticamente (1, 2, 3, ...)
5. **Padding de cantidades**: Se formatean con ceros a la izquierda (02, 10, etc.)

## Respuestas

### Respuesta Exitosa (200 OK)

```json
{
  "status": "success",
  "message": "Secuencias anuladas exitosamente",
  "data": {
    "codigo": 100,
    "mensaje": "Secuencias anuladas exitosamente",
    "procesado": true,
    "xmlBase64": "PEFORUNGIHhtbG5zOnhzaT0i...",
    "cantidadAnulada": 2,
    "detalles": [
      {
        "tipoDocumento": "31",
        "ncfDesde": "E310000000147",
        "ncfHasta": "E310000000148",
        "cantidad": "02"
      }
    ]
  }
}
```

**Nota**: TheFactory retorna:

- `codigo: 100` para anulaciones exitosas (no `0`)
- `procesado: true` cuando se procesó correctamente
- `xmlBase64`: XML firmado de la anulación (para auditoría DGII)

### Respuesta de Error de Validación (400 Bad Request)

```json
{
  "status": "error",
  "message": "Anulación 1: NCF Desde tiene formato inválido. Debe ser E + tipo (2 dígitos) + secuencia (8 dígitos). Ejemplo: E310000000098"
}
```

### Respuesta de Error de TheFactory HKA (400 Bad Request)

```json
{
  "status": "error",
  "message": "Error al anular: NCF ya fue anulado anteriormente",
  "details": {
    "codigo": 108,
    "mensaje": "NCF ya fue anulado anteriormente",
    "procesado": false
  }
}
```

### Respuesta de Error del Servidor (500 Internal Server Error)

```json
{
  "status": "error",
  "message": "Error en la respuesta de TheFactoryHKA",
  "details": {
    "status": 500,
    "data": { ... }
  }
}
```

### Respuesta de Timeout (408 Request Timeout)

```json
{
  "status": "error",
  "message": "Timeout al conectar con TheFactoryHKA"
}
```

## Ejemplos de Uso

### Ejemplo 1: Anular UN Solo Comprobante (Más Común) ✅

```bash
curl -X POST https://api.ejemplo.com/comprobantes/anular \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rnc": "130960054",
    "anulaciones": [
      {
        "tipoDocumento": "31",
        "ncf": "E310000000098"
      }
    ]
  }'
```

### Ejemplo 2: Anular un Rango de Comprobantes

```bash
curl -X POST https://api.ejemplo.com/comprobantes/anular \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rnc": "130960054",
    "anulaciones": [
      {
        "tipoDocumento": "31",
        "ncfDesde": "E310000000098",
        "ncfHasta": "E310000000099"
      }
    ]
  }'
```

### Ejemplo 3: Anular Múltiples Rangos de Diferentes Tipos

```bash
curl -X POST https://api.ejemplo.com/comprobantes/anular \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rnc": "130960054",
    "anulaciones": [
      {
        "tipoDocumento": "31",
        "ncfDesde": "E310000000098",
        "ncfHasta": "E310000000099"
      },
      {
        "tipoDocumento": "33",
        "ncfDesde": "E330000000050",
        "ncfHasta": "E330000000052"
      }
    ]
  }'
```

### Ejemplo 4: Anular con Fecha Específica

```bash
curl -X POST https://api.ejemplo.com/comprobantes/anular \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rnc": "130960054",
    "fechaHoraAnulacion": "16-06-2022 09:23:59",
    "anulaciones": [
      {
        "tipoDocumento": "31",
        "ncfDesde": "E310000000098",
        "ncfHasta": "E310000000098"
      }
    ]
  }'
```

### Ejemplo 5: JavaScript/Node.js

```javascript
const axios = require('axios');

async function anularUnComprobante() {
  try {
    const response = await axios.post(
      'https://api.ejemplo.com/comprobantes/anular',
      {
        rnc: '130960054',
        anulaciones: [
          {
            tipoDocumento: '31',
            ncf: 'E310000000098', // ✅ Forma simple para un solo comprobante
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('Anulación exitosa:', response.data);
  } catch (error) {
    console.error('Error al anular:', error.response.data);
  }
}

anularUnComprobante();
```

## Mensajes de Error Comunes

| Código | Mensaje                                                   | Solución                                                                            |
| ------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 400    | "El campo RNC es obligatorio"                             | Incluir el campo `rnc` en la solicitud                                              |
| 400    | "NCF Desde tiene formato inválido"                        | Verificar que el NCF tenga exactamente 11 caracteres: E + 2 dígitos + 8 dígitos     |
| 400    | "Tipo de documento inválido"                              | Usar solo tipos válidos: 31-34, 41, 43-47                                           |
| 400    | "NCF Hasta debe ser mayor o igual a NCF Desde"            | Verificar que el rango sea válido                                                   |
| 400    | "El tipo de documento no coincide con el prefijo del NCF" | El tipo en tipoDocumento debe coincidir con los 2 dígitos después de la E en el NCF |
| 408    | "Timeout al conectar con TheFactoryHKA"                   | Reintentar la solicitud o verificar conectividad                                    |
| 500    | "Error en la respuesta de TheFactoryHKA"                  | Revisar los detalles del error en la respuesta                                      |

## Notas Importantes

1. **Autenticación**: Este endpoint requiere un token JWT válido en el header `Authorization`
2. **Token de TheFactory**: El endpoint maneja automáticamente la autenticación con TheFactory HKA
3. **Cache de token**: Los tokens de TheFactory se cachean automáticamente para optimizar el rendimiento
4. **Timeout**: Las solicitudes tienen un timeout de 30 segundos
5. **Formato de fecha**: Si proporcionas una fecha, debe estar en formato dominicano (DD-MM-YYYY)
6. **NCF únicos**: No puedes anular un NCF que ya fue anulado anteriormente
7. **Irreversible**: La anulación de NCF es una operación irreversible

## Integración con FileMaker

Para integrar este endpoint desde FileMaker, puedes usar el siguiente script:

```fmscript
# Variables
Set Variable [ $url ; Value: "https://api.ejemplo.com/comprobantes/anular" ]
Set Variable [ $token ; Value: "YOUR_JWT_TOKEN" ]
Set Variable [ $rnc ; Value: "130960054" ]
Set Variable [ $tipo ; Value: "31" ]
Set Variable [ $desde ; Value: "E310000000098" ]
Set Variable [ $hasta ; Value: "E310000000099" ]

# Construir JSON
Set Variable [ $json ; Value:
  "{" &
  "\"rnc\": \"" & $rnc & "\"," &
  "\"anulaciones\": [{" &
    "\"tipoDocumento\": \"" & $tipo & "\"," &
    "\"ncfDesde\": \"" & $desde & "\"," &
    "\"ncfHasta\": \"" & $hasta & "\"" &
  "}]" &
  "}"
]

# Realizar petición
Insert from URL [
  With Dialog: Off ;
  Target: $$resultado ;
  $url ;
  Verify SSL Certificates ;
  cURL options:
    "-X POST" &
    " -H \"Authorization: Bearer " & $token & "\"" &
    " -H \"Content-Type: application/json\"" &
    " -d '" & $json & "'"
]

# Procesar resultado
If [ JSONGetElement ( $$resultado ; "status" ) = "success" ]
  Show Custom Dialog [ "Éxito" ; JSONGetElement ( $$resultado ; "message" ) ]
Else
  Show Custom Dialog [ "Error" ; JSONGetElement ( $$resultado ; "message" ) ]
End If
```

## Referencias

- [Documentación oficial de TheFactory HKA](https://felwiki.thefactoryhka.com.do/doku.php?id=restapianulacion)
- [Especificaciones DGII para NCF](https://dgii.gov.do)

## Changelog

- **2024-10-09**: Versión inicial del endpoint de anulación
  - Implementación de validaciones completas
  - Transformación automática de formato simplificado a TheFactory HKA
  - Cálculo automático de cantidades y fechas
  - Manejo robusto de errores
