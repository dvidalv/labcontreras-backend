# QR DGII - Ejemplos de Uso

## 📋 Casos de Uso Completos

### 1. Flujo Completo desde FileMaker

#### Script FileMaker para generar QR después de enviar factura:

```filemaker
# ================================
# Script: Generar QR Code DGII
# Descripción: Genera QR para verificación en DGII
# ================================

# 1. Obtener token de autenticación
Set Variable [ $token ; Value: CONFIGURACION::API_TOKEN ]

# 2. Preparar datos para QR
Set Variable [ $rnc ; Value: "130085765" ]  # RNC de la clínica
Set Variable [ $rncComprador ; Value: PACIENTES_FACTURAS::RNC ]
Set Variable [ $ncf ; Value: FACTURAS::NCF ]
Set Variable [ $codigo ; Value: FACTURAS::CODIGO_SEGURIDAD ]
Set Variable [ $fecha ; Value: FACTURAS::FECHA_EMISION ]
Set Variable [ $fechaFirma ; Value: FACTURAS::FECHA_EMISION & " " & FACTURAS::HORA_FIRMA ]
Set Variable [ $monto ; Value: FACTURAS::MONTO_TOTAL ]

# 3. Construir JSON para API
Set Variable [ $qr_json ; Value: JSONSetElement ( "{}" ;
    [ "rnc" ; $rnc ; JSONString ] ;
    [ "rncComprador" ; $rncComprador ; JSONString ] ;
    [ "ncf" ; $ncf ; JSONString ] ;
    [ "codigo" ; $codigo ; JSONString ] ;
    [ "fecha" ; $fecha ; JSONString ] ;
    [ "fechaFirma" ; $fechaFirma ; JSONString ] ;
    [ "monto" ; $monto ; JSONString ] ;
    [ "formato" ; "png" ; JSONString ] ;
    [ "tamaño" ; 200 ; JSONNumber ]
) ]

# 4. Generar QR via API
Insert from URL [
    Target: $qr_resultado ;
    URL: "https://tu-servidor.com/comprobantes/generar-qr" ;
    Verify SSL Certificates: Off ;
    cURL options: "--header \"Authorization: Bearer " & $token & "\" " &
                  "--header \"Content-Type: application/json\" " &
                  "--header \"Accept: application/json\" " &
                  "--data-raw " & Quote($qr_json)
]

# 5. Verificar resultado y guardar QR
If [ JSONGetElement($qr_resultado; "status") = "success" ]
    # Extraer imagen QR en base64
    Set Field [ FACTURAS::QR_IMAGE ; JSONGetElement($qr_resultado; "data.qrCode") ]
    Set Field [ FACTURAS::QR_URL ; JSONGetElement($qr_resultado; "data.url") ]
    Set Field [ FACTURAS::QR_GENERADO ; Get(CurrentTimestamp) ]

    Show Custom Dialog [ "✅ Éxito" ; "QR Code generado correctamente" ]
Else
    # Mostrar error
    Set Variable [ $error ; Value: JSONGetElement($qr_resultado; "message") ]
    Show Custom Dialog [ "❌ Error" ; "Error al generar QR: " & $error ]
End If
```

### 2. Integración con envío automático de facturas

#### Script que combina envío de factura + generación de QR:

```filemaker
# ================================
# Script: Procesar Factura Completa
# Descripción: Envía factura a TheFactory + genera QR
# ================================

# 1. Enviar factura a TheFactory HKA
Perform Script [ "Enviar Factura Electronica" ]

# 2. Verificar que se envió correctamente
If [ FACTURAS::ESTADO_THEFACTORY = "Aceptado" ]

    # 3. Esperar 5 segundos para que se procese
    Pause/Resume Script [ Duration (seconds): 5 ]

    # 4. Generar QR Code
    Perform Script [ "Generar QR Code DGII" ]

    # 5. Opcional: Enviar email con QR
    If [ PACIENTES_FACTURAS::EMAIL ≠ "" ]
        Perform Script [ "Enviar Email con QR" ]
    End If

Else
    Show Custom Dialog [ "❌ Error" ; "No se puede generar QR. La factura no fue aceptada por TheFactory HKA." ]
End If
```

## 🧪 Ejemplos de Testing

### 1. Test desde Postman/Insomnia

```http
POST https://tu-servidor.com/comprobantes/generar-qr
Authorization: Bearer tu_token_aqui
Content-Type: application/json

{
  "rnc": "130085765",
  "rncComprador": "131695426",
  "ncf": "E310000000131",
  "codigo": "ZJPGsn",
  "fecha": "08-09-2025",
  "fechaFirma": "08-09-2025 23:23:53",
  "monto": "4000.00",
  "formato": "png",
  "tamaño": 200
}
```

**Respuesta esperada:**

```json
{
  "status": "success",
  "message": "Código QR generado exitosamente",
  "data": {
    "url": "https://ecf.dgii.gov.do/testecf/ConsultaTimbre?RncEmisor=130085765&RncComprador=131695426&ENCF=E310000000131&FechaEmision=08-09-2025&MontoTotal=4000.00&FechaFirma=08-09-2025%2023:23:53&CodigoSeguridad=ZJPGsn",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "formato": "png",
    "tamaño": 200,
    "versionCalculada": "auto",
    "especificaciones": {
      "errorCorrection": "M",
      "cumpleNormativaDGII": true,
      "versionOptimizada": true
    },
    "timestamp": "2025-01-09T02:37:36.000Z"
  }
}
```

### 2. Test con datos mínimos

```json
{
  "rnc": "130085765",
  "rncComprador": "131695426",
  "ncf": "E310000000131",
  "codigo": "ZJPGsn",
  "fecha": "08-09-2025",
  "fechaFirma": "08-09-2025 23:23:53",
  "monto": "4000.00"
}
```

### 3. Test con URL completa (método alternativo)

```json
{
  "url": "https://ecf.dgii.gov.do/testecf/ConsultaTimbre?RncEmisor=130085765&RncComprador=131695426&ENCF=E310000000131&FechaEmision=08-09-2025&MontoTotal=4000.00&FechaFirma=08-09-2025%2023:23:53&CodigoSeguridad=ZJPGsn",
  "formato": "png",
  "tamaño": 300
}
```

## 📱 Formatos de QR Soportados

### PNG (Recomendado)

```json
{
  "formato": "png",
  "tamaño": 200
}
```

- **Uso:** Impresión, mostrar en pantalla
- **Ventajas:** Buena calidad, compatible universalmente
- **Desventajas:** Tamaño de archivo mayor

### SVG (Para web)

```json
{
  "formato": "svg",
  "tamaño": 200
}
```

- **Uso:** Páginas web, escalado infinito
- **Ventajas:** Tamaño pequeño, escalable
- **Desventajas:** Menos compatible para impresión

## 🎨 Personalización del QR

### Configuración avanzada:

```javascript
// En el código backend, puedes personalizar:
const opcionesQR = {
  errorCorrectionLevel: 'M', // L, M, Q, H
  margin: 1, // Margen en módulos
  color: {
    dark: '#000000', // Color del QR
    light: '#FFFFFF', // Color de fondo
  },
  width: 200, // Tamaño en píxeles
};
```

## 📊 Monitoreo y Logs

### Logs útiles para debugging:

```javascript
// En el servidor verás estos logs:
console.log('🔍 === DEBUG generarCodigoQR ===');
console.log('req.body completo:', JSON.stringify(req.body, null, 2));
console.log('🔍 Parámetros extraídos:');
console.log('rnc:', rnc);
console.log('rncComprador:', rncComprador);
console.log('fechaFirma:', fechaFirma);
console.log('🎯 URL generada:', urlParaQR);
console.log('📅 ¿Incluye hora?', params.get('FechaFirma').includes(' '));
```

### Verificación manual de URL:

1. Copiar URL del log
2. Pegar en navegador
3. Verificar que muestre datos de la factura

## 🚀 Casos de Uso Avanzados

### 1. Generación masiva de QR

```filemaker
# Script para generar QR para múltiples facturas
Go to Record/Request/Page [ First ]
Loop
    Perform Script [ "Generar QR Code DGII" ]
    Go to Record/Request/Page [ Next; Exit after last: On ]
End Loop
```

### 2. QR con validación previa

```filemaker
# Verificar estado antes de generar QR
If [ FACTURAS::ESTADO_THEFACTORY = "Aceptado" and FACTURAS::CODIGO_SEGURIDAD ≠ "" ]
    Perform Script [ "Generar QR Code DGII" ]
Else
    Show Custom Dialog [ "Advertencia" ; "La factura no está lista para generar QR" ]
End If
```

### 3. QR para diferentes ambientes

```filemaker
# Cambiar URL según ambiente
If [ CONFIGURACION::AMBIENTE = "PRODUCCION" ]
    Set Variable [ $url_base ; Value: "https://ecf.dgii.gov.do/ecf/ConsultaTimbre" ]
Else
    Set Variable [ $url_base ; Value: "https://ecf.dgii.gov.do/testecf/ConsultaTimbre" ]
End If
```

---

**Fecha:** $(date)
**Versión:** 1.0
**Ejemplos probados:** ✅
