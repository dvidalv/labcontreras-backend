# Integración QR Code DGII - Guía Completa

## 📋 Resumen

Esta documentación describe la integración completa para generar códigos QR que funcionan correctamente con el sistema de verificación de facturas electrónicas de la DGII (Dirección General de Impuestos Internos) de República Dominicana.

## 🎯 Objetivo

Generar códigos QR que al ser escaneados redirijan al sitio oficial de DGII y muestren la información completa de la factura electrónica, incluyendo:

- RNC Emisor y Razón Social
- RNC Comprador y Razón Social
- e-NCF (Número de Comprobante Fiscal Electrónico)
- Fecha de Emisión
- Monto Total
- Estado (Aceptado/Rechazado)

## 🚨 Problemas Resueltos

### 1. **Parámetros Incorrectos (Solucionado)**

- **Problema**: Usábamos nombres de parámetros incorrectos
- **Solución**: Usar la nomenclatura oficial de DGII

### 2. **Datos Faltantes (Solucionado)**

- **Problema**: No enviábamos RNC del comprador ni fecha de firma
- **Solución**: Incluir todos los parámetros obligatorios

### 3. **Formato de Fecha Incorrecto (Solucionado)**

- **Problema**: Enviábamos solo fecha sin hora en FechaFirma
- **Solución**: Incluir fecha Y hora completa

## ✅ Especificación Oficial DGII

### **URL Base:**

```
https://ecf.dgii.gov.do/testecf/ConsultaTimbre    # Para ambiente de pruebas
https://ecf.dgii.gov.do/ecf/ConsultaTimbre       # Para producción
```

### **Parámetros Obligatorios:**

| Parámetro         | Descripción                              | Formato                 | Ejemplo               |
| ----------------- | ---------------------------------------- | ----------------------- | --------------------- |
| `RncEmisor`       | RNC de quien emite la factura            | 9 dígitos               | `130085765`           |
| `RncComprador`    | RNC de quien compra                      | 9 dígitos               | `131695426`           |
| `ENCF`            | Número de Comprobante Fiscal Electrónico | E + 11 dígitos          | `E310000000131`       |
| `FechaEmision`    | Fecha de emisión de la factura           | DD-MM-YYYY              | `08-09-2025`          |
| `MontoTotal`      | Monto total de la factura                | Decimal con 2 decimales | `4000.00`             |
| `FechaFirma`      | Fecha y hora de firma digital            | DD-MM-YYYY HH:MM:SS     | `08-09-2025 23:23:53` |
| `CodigoSeguridad` | Código de seguridad de TheFactory        | Alfanumérico            | `ZJPGsn`              |

### **URL Completa de Ejemplo:**

```
https://ecf.dgii.gov.do/testecf/ConsultaTimbre?RncEmisor=130085765&RncComprador=131695426&ENCF=E310000000131&FechaEmision=08-09-2025&MontoTotal=4000.00&FechaFirma=08-09-2025%2023:23:53&CodigoSeguridad=ZJPGsn
```

## 🔧 Implementación Técnica

### **1. Endpoint Backend: `/comprobantes/generar-qr`**

**Método:** `POST`

**Request Body:**

```json
{
  "rnc": "130085765", // RNC del emisor
  "rncComprador": "131695426", // RNC del comprador
  "ncf": "E310000000131", // Número de comprobante
  "codigo": "ZJPGsn", // Código de seguridad
  "fecha": "08-09-2025", // Fecha de emisión
  "fechaFirma": "08-09-2025 23:23:53", // Fecha y HORA de firma
  "monto": "4000.00", // Monto total
  "formato": "png", // Formato del QR
  "tamaño": 200 // Tamaño en píxeles
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Código QR generado exitosamente",
  "data": {
    "url": "https://ecf.dgii.gov.do/testecf/ConsultaTimbre?...",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "formato": "png",
    "tamaño": 200,
    "versionCalculada": "auto",
    "especificaciones": {
      "errorCorrection": "M",
      "cumpleNormativaDGII": true,
      "versionOptimizada": true
    }
  }
}
```

### **2. Configuración QR Code**

```javascript
const opcionesQR = {
  // Versión automática según contenido (URLs largas requieren versión 10+)
  errorCorrectionLevel: 'M', // Nivel medio de corrección
  type: 'image/png', // Formato de salida
  quality: 0.92, // Calidad de imagen
  margin: 1, // Margen recomendado
  color: {
    dark: '#000000', // Color del QR
    light: '#FFFFFF', // Color de fondo
  },
  width: 200, // Tamaño mínimo recomendado
};
```

## 📤 Integración FileMaker

### **Script para Generar QR:**

```filemaker
# Configurar variables con datos de la factura
Set Variable [ $rnc ; Value: "130085765" ]
Set Variable [ $rncComprador ; Value: PACIENTES_FACTURAS::RNC ]
Set Variable [ $ncf ; Value: FACTURAS::NCF ]
Set Variable [ $codigo ; Value: FACTURAS::CODIGO_SEGURIDAD ]
Set Variable [ $fecha ; Value: FACTURAS::FECHA_EMISION ]
Set Variable [ $fechaFirma ; Value: FACTURAS::FECHA_EMISION & " " & FACTURAS::HORA_FIRMA ]
Set Variable [ $monto ; Value: FACTURAS::MONTO_TOTAL ]

# Construir JSON
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

# Realizar petición
Insert from URL [
    Target: $resultado ;
    URL: "https://tu-servidor.com/comprobantes/generar-qr" ;
    Verify SSL Certificates: Off ;
    cURL options: "--header \"Authorization: Bearer " & $token & "\" " &
                  "--header \"Content-Type: application/json\" " &
                  "--header \"Accept: application/json\" " &
                  "--data-raw " & Quote($qr_json)
]

# Extraer imagen QR del resultado
Set Field [ FACTURAS::QR_IMAGE ; JSONGetElement($resultado; "data.qrCode") ]
```

## ⚠️ Puntos Críticos

### **1. FechaFirma DEBE incluir hora**

```
✅ Correcto: "08-09-2025 23:23:53"
❌ Incorrecto: "08-09-2025"
```

### **2. Todos los parámetros son obligatorios**

```
✅ Correcto: Incluir RncEmisor, RncComprador, ENCF, FechaEmision, MontoTotal, FechaFirma, CodigoSeguridad
❌ Incorrecto: Omitir cualquier parámetro
```

### **3. URL Encoding automático**

```
✅ Correcto: URLSearchParams maneja la codificación automáticamente
❌ Incorrecto: Codificar manualmente
```

### **4. Versión QR automática**

```
✅ Correcto: Dejar que la librería calcule la versión según el contenido
❌ Incorrecto: Forzar versión 8 (muy pequeña para URLs largas)
```

## 🧪 Testing

### **Verificar URL manualmente:**

1. Copiar la URL generada
2. Pegarla en el navegador
3. Debe mostrar: "Estado: Aceptado" con todos los datos

### **Verificar QR:**

1. Escanear el QR con cualquier lector
2. Debe abrir la URL de DGII
3. Debe mostrar información completa de la factura

## 🚀 Ambientes

### **Test:**

- URL Base: `https://ecf.dgii.gov.do/testecf/ConsultaTimbre`
- Para pruebas y desarrollo

### **Producción:**

- URL Base: `https://ecf.dgii.gov.do/ecf/ConsultaTimbre`
- Para facturas reales

## 📞 Soporte

Para problemas con la integración:

1. Verificar que todos los parámetros estén presentes
2. Confirmar formato de FechaFirma con hora
3. Validar que la factura esté procesada en DGII
4. Revisar logs del servidor para debugging

---

**Fecha de documentación:** $(date)
**Versión:** 1.0
**Estado:** ✅ Funcional y probado
