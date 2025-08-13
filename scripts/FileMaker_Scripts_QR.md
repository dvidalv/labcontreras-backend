# 📱 Scripts de FileMaker para Generar Códigos QR

## 🎯 Scripts para integración con el endpoint `/comprobantes/generar-qr`

---

## 📋 **Script 1: Generar QR Básico**

### **Nombre del Script:** `GenerarQR_Basico`

```javascript
# Configurar variables
Set Variable [ $token ; Value: "tu_token_aqui" ]
Set Variable [ $servidor ; Value: "https://tu-servidor.com" ]

# Obtener datos de la factura
Set Variable [ $rnc ; Value: Facturas::EmisorRNC ]
Set Variable [ $ncf ; Value: Facturas::NCF ]
Set Variable [ $codigo ; Value: Facturas::CodigoSeguridad ]
Set Variable [ $fecha ; Value: Facturas::FechaEmision ]
Set Variable [ $monto ; Value: Facturas::Total ]

# Validar datos obligatorios
If [ IsEmpty ( $rnc ) or IsEmpty ( $ncf ) or IsEmpty ( $codigo ) or IsEmpty ( $fecha ) ]
    Show Custom Dialog [ "Datos Incompletos" ; "❌ Faltan datos obligatorios para el QR" ]
    Exit Script [ Text Result: "Error: Datos incompletos" ]
End If

# Preparar la petición HTTP
Set Variable [ $headers ; Value: "Authorization: Bearer " & $token & ¶ & "Content-Type: application/json" ]
Set Variable [ $body ; Value: JSONSetElement ( "{}" ;
    [ "rnc" ; $rnc ; JSONString ] ;
    [ "ncf" ; $ncf ; JSONString ] ;
    [ "codigo" ; $codigo ; JSONString ] ;
    [ "fecha" ; $fecha ; JSONString ] ;
    [ "monto" ; $monto ; JSONString ]
) ]

# Hacer la petición al endpoint
Insert from URL [
    $servidor & "/comprobantes/generar-qr" ;
    Headers: $headers ;
    Target: $resultado ;
    Request Data: $body ;
    Verify SSL Certificates: Off
]

# Procesar la respuesta
Set Variable [ $status ; Value: JSONGetElement ( $resultado ; "status" ) ]

If [ $status = "success" ]
    # Extraer el QR Code
    Set Variable [ $qr_code ; Value: JSONGetElement ( $resultado ; "data.qrCode" ) ]
    Set Variable [ $formato ; Value: JSONGetElement ( $resultado ; "data.formato" ) ]
    Set Variable [ $tamaño ; Value: JSONGetElement ( $resultado ; "data.tamaño" ) ]

    # Guardar en el campo
    Set Field [ Facturas::QRCode ; $qr_code ]
    Set Field [ Facturas::QRFormato ; $formato ]
    Set Field [ Facturas::QRTamaño ; $tamaño ]

    # Mostrar confirmación
    Show Custom Dialog [ "QR Generado" ; "Código QR generado exitosamente¶Formato: " & $formato & "¶Tamaño: " & $tamaño & "px" ]

Else
    # Manejar error
    Set Variable [ $error_msg ; Value: JSONGetElement ( $resultado ; "message" ) ]
    Show Custom Dialog [ "Error al generar QR" ; $error_msg ]
End If
```

---

## 📄 **Script 2: Generar QR para Impresión**

### **Nombre del Script:** `GenerarQR_Impresion`

```javascript
# Configurar variables para impresión optimizada
Set Variable [ $token ; Value: "tu_token_aqui" ]
Set Variable [ $servidor ; Value: "https://tu-servidor.com" ]
Set Variable [ $url_qr ; Value: Facturas::urlQR ]

# Configuración específica para impresión
Set Variable [ $tamaño_impresion ; Value: 180 ]  # Tamaño optimizado para facturas impresas
Set Variable [ $formato_impresion ; Value: "png" ]  # PNG es mejor para impresión

# Validaciones
If [ IsEmpty ( $url_qr ) ]
    Show Custom Dialog [ "Error" ; "No se encontró la URL del QR para esta factura" ]
    Exit Script [ Text Result: "Error: URL faltante" ]
End If

# Preparar petición con parámetros de impresión
Set Variable [ $headers ; Value: "Authorization: Bearer " & $token & ¶ & "Content-Type: application/json" ]
Set Variable [ $body ; Value: JSONSetElement ( "{}" ;
    [ "url" ; $url_qr ; JSONString ] ;
    [ "formato" ; $formato_impresion ; JSONString ] ;
    [ "tamaño" ; $tamaño_impresion ; JSONNumber ]
) ]

# Ejecutar petición
Insert from URL [
    $servidor & "/comprobantes/generar-qr" ;
    Headers: $headers ;
    Target: $resultado ;
    Request Data: $body ;
    Verify SSL Certificates: Off
]

# Procesar respuesta
Set Variable [ $status ; Value: JSONGetElement ( $resultado ; "status" ) ]

If [ $status = "success" ]
    # Extraer datos del QR
    Set Variable [ $qr_code ; Value: JSONGetElement ( $resultado ; "data.qrCode" ) ]
    Set Variable [ $cumple_dgii ; Value: JSONGetElement ( $resultado ; "data.especificaciones.cumpleNormativaDGII" ) ]

    # Guardar para impresión
    Set Field [ Facturas::QRCode_Impresion ; $qr_code ]
    Set Field [ Facturas::FechaQR ; Get ( CurrentTimeStamp ) ]

    # Confirmar cumplimiento DGII
    If [ $cumple_dgii = True ]
        Show Custom Dialog [ "QR para Impresión Listo" ; "QR optimizado para impresión generado¶✅ Cumple normativas DGII¶Tamaño: " & $tamaño_impresion & "px" ]
    End If

Else
    Set Variable [ $error_msg ; Value: JSONGetElement ( $resultado ; "message" ) ]
    Show Custom Dialog [ "Error" ; "No se pudo generar el QR para impresión¶" & $error_msg ]
End If
```

---

## 🔄 **Script 3: Procesar Factura Completa**

### **Nombre del Script:** `ProcesarFactura_ConQR`

```javascript
# Script completo: Enviar factura + Generar QR automáticamente
Set Variable [ $token ; Value: "tu_token_aqui" ]
Set Variable [ $servidor ; Value: "https://tu-servidor.com" ]

# Variables de la factura
Set Variable [ $factura_json ; Value: JSONSetElement ( "{}" ;
    [ "comprador.correo" ; Facturas::CompradorCorreo ; JSONString ] ;
    [ "comprador.nombre" ; Facturas::CompradorNombre ; JSONString ] ;
    [ "comprador.rnc" ; Facturas::CompradorRNC ; JSONString ] ;
    [ "emisor.correo" ; Facturas::EmisorCorreo ; JSONString ] ;
    [ "emisor.direccion" ; Facturas::EmisorDireccion ; JSONString ] ;
    [ "emisor.razonSocial" ; Facturas::EmisorRazonSocial ; JSONString ] ;
    [ "emisor.rnc" ; Facturas::EmisorRNC ; JSONString ] ;
    [ "emisor.telefono[0]" ; Facturas::EmisorTelefono ; JSONString ] ;
    [ "factura.fecha" ; Facturas::Fecha ; JSONString ] ;
    [ "factura.id" ; Facturas::ID ; JSONString ] ;
    [ "factura.ncf" ; Facturas::NCF ; JSONString ] ;
    [ "factura.fechaVencNCF" ; Facturas::FechaVencNCF ; JSONString ] ;
    [ "factura.tipo" ; Facturas::Tipo ; JSONString ] ;
    [ "factura.total" ; Facturas::Total ; JSONString ] ;
    [ "items[0].nombre" ; Facturas::ItemNombre ; JSONString ] ;
    [ "items[0].precio" ; Facturas::ItemPrecio ; JSONString ]
) ]

# PASO 1: Enviar factura electrónica
Set Variable [ $headers ; Value: "Authorization: Bearer " & $token & ¶ & "Content-Type: application/json" ]

Insert from URL [
    $servidor & "/comprobantes/enviar-electronica" ;
    Headers: $headers ;
    Target: $resultado_envio ;
    Request Data: $factura_json ;
    Verify SSL Certificates: Off
]

# Verificar envío exitoso
Set Variable [ $status_envio ; Value: JSONGetElement ( $resultado_envio ; "status" ) ]

If [ $status_envio = "success" ]
    # Extraer datos del envío
    Set Variable [ $url_qr ; Value: JSONGetElement ( $resultado_envio ; "data.urlQR" ) ]
    Set Variable [ $codigo_seguridad ; Value: JSONGetElement ( $resultado_envio ; "data.codigoSeguridad" ) ]
    Set Variable [ $ncf_generado ; Value: JSONGetElement ( $resultado_envio ; "data.ncfGenerado" ) ]

    # Guardar datos del envío
    Set Field [ Facturas::urlQR ; $url_qr ]
    Set Field [ Facturas::CodigoSeguridad ; $codigo_seguridad ]
    Set Field [ Facturas::EstadoEnvio ; "Enviado" ]

    # PASO 2: Generar QR automáticamente
    Set Variable [ $body_qr ; Value: JSONSetElement ( "{}" ;
        [ "url" ; $url_qr ; JSONString ] ;
        [ "formato" ; "png" ; JSONString ] ;
        [ "tamaño" ; 200 ; JSONNumber ]
    ) ]

    Insert from URL [
        $servidor & "/comprobantes/generar-qr" ;
        Headers: $headers ;
        Target: $resultado_qr ;
        Request Data: $body_qr ;
        Verify SSL Certificates: Off
    ]

    # Verificar QR generado
    Set Variable [ $status_qr ; Value: JSONGetElement ( $resultado_qr ; "status" ) ]

    If [ $status_qr = "success" ]
        Set Variable [ $qr_code ; Value: JSONGetElement ( $resultado_qr ; "data.qrCode" ) ]
        Set Field [ Facturas::QRCode ; $qr_code ]
        Set Field [ Facturas::FechaQR ; Get ( CurrentTimeStamp ) ]

        # Éxito completo
        Show Custom Dialog [ "Proceso Completo" ; "✅ Factura enviada exitosamente¶✅ QR Code generado¶NCF: " & $ncf_generado & "¶Código: " & $codigo_seguridad ]

    Else
        # Envío ok, pero QR falló
        Show Custom Dialog [ "Envío OK, QR Error" ; "✅ Factura enviada correctamente¶❌ Error al generar QR¶Puede generarlo manualmente después" ]
    End If

Else
    # Error en el envío
    Set Variable [ $error_envio ; Value: JSONGetElement ( $resultado_envio ; "message" ) ]
    Show Custom Dialog [ "Error en Envío" ; "❌ No se pudo enviar la factura¶" & $error_envio ]
End If
```

---

## 🖼️ **Script 4: Mostrar QR en Layout**

### **Nombre del Script:** `MostrarQR_EnLayout`

```javascript
# Script para mostrar el QR en un layout de FileMaker
Set Variable [ $qr_data ; Value: Facturas::QRCode ]

# Verificar que tenemos el QR
If [ IsEmpty ( $qr_data ) ]
    Show Custom Dialog [ "QR No Disponible" ; "No hay un código QR generado para esta factura.¶¿Desea generarlo ahora?" ; "Generar" ; "Cancelar" ]

    If [ Get ( LastMessageChoice ) = 1 ]
        # Llamar script de generación
        Perform Script [ "GenerarQR_Basico" ]
        Set Variable [ $qr_data ; Value: Facturas::QRCode ]
    Else
        Exit Script [ Text Result: "Cancelado por usuario" ]
    End If
End If

# Si tenemos QR, mostrarlo
If [ not IsEmpty ( $qr_data ) ]
    # Ir al layout de vista de QR
    Go to Layout [ "Layout_VistaQR" ]

    # El campo container Facturas::QRCode mostrará automáticamente el QR
    # ya que contiene el data URL del QR Code

    # Opcional: Agregar información adicional
    Set Field [ Info::TituloQR ; "Código QR - Factura " & Facturas::NCF ]
    Set Field [ Info::FechaGeneracion ; "Generado: " & Facturas::FechaQR ]

End If
```

---

## ⚙️ **Script 5: Configuración de Conexión**

### **Nombre del Script:** `ConfigurarConexion_API`

```javascript
# Script para configurar la conexión con el servidor
Set Variable [ $servidor_actual ; Value: GetField ( Configuracion::ServidorAPI ) ]
Set Variable [ $token_actual ; Value: GetField ( Configuracion::TokenAPI ) ]

# Mostrar diálogo de configuración
Show Custom Dialog [ "Configuración API" ; "Servidor actual: " & $servidor_actual ; "Servidor:" ; $servidor_actual ; "Token:" ; $token_actual ]

If [ Get ( LastMessageChoice ) = 1 ]
    # Usuario aceptó, guardar nueva configuración
    Set Variable [ $nuevo_servidor ; Value: Get ( ScriptParameter ) ]  # Primer parámetro
    Set Variable [ $nuevo_token ; Value: Get ( ScriptResult ) ]  # Segundo parámetro

    # Validar servidor (debe empezar con https://)
    If [ Left ( $nuevo_servidor ; 8 ) ≠ "https://" ]
        Show Custom Dialog [ "Error" ; "El servidor debe empezar con https://" ]
        Exit Script [ Text Result: "Error: Servidor inválido" ]
    End If

    # Validar token (no debe estar vacío)
    If [ IsEmpty ( $nuevo_token ) ]
        Show Custom Dialog [ "Error" ; "El token no puede estar vacío" ]
        Exit Script [ Text Result: "Error: Token vacío" ]
    End If

    # Guardar configuración
    Set Field [ Configuracion::ServidorAPI ; $nuevo_servidor ]
    Set Field [ Configuracion::TokenAPI ; $nuevo_token ]
    Set Field [ Configuracion::FechaConfiguracion ; Get ( CurrentTimeStamp ) ]

    # Confirmar
    Show Custom Dialog [ "Configuración Guardada" ; "✅ Nueva configuración guardada¶Servidor: " & $nuevo_servidor ]

    # Opcional: Probar conexión
    Show Custom Dialog [ "Probar Conexión" ; "¿Desea probar la conexión ahora?" ; "Probar" ; "Después" ]

    If [ Get ( LastMessageChoice ) = 1 ]
        Perform Script [ "ProbarConexion_API" ]
    End If
End If
```

---

## 🧪 **Script 6: Probar Conexión**

### **Nombre del Script:** `ProbarConexion_API`

```javascript
# Script para probar la conexión con el API
Set Variable [ $servidor ; Value: GetField ( Configuracion::ServidorAPI ) ]
Set Variable [ $token ; Value: GetField ( Configuracion::TokenAPI ) ]

# Preparar petición de prueba (usar endpoint de test-auth)
Set Variable [ $headers ; Value: "Authorization: Bearer " & $token ]

Insert from URL [
    $servidor & "/comprobantes/test-auth" ;
    Headers: $headers ;
    Target: $resultado ;
    Verify SSL Certificates: Off
]

# Procesar respuesta
Set Variable [ $status ; Value: JSONGetElement ( $resultado ; "status" ) ]

If [ $status = "success" ]
    Set Variable [ $mensaje ; Value: JSONGetElement ( $resultado ; "message" ) ]
    Show Custom Dialog [ "Conexión Exitosa" ; "✅ " & $mensaje & "¶La configuración es correcta" ]
    Set Field [ Configuracion::EstadoConexion ; "Conectado" ]
    Set Field [ Configuracion::UltimaPrueba ; Get ( CurrentTimeStamp ) ]
Else
    Set Variable [ $error ; Value: JSONGetElement ( $resultado ; "message" ) ]
    Show Custom Dialog [ "Error de Conexión" ; "❌ " & $error & "¶Verifique servidor y token" ]
    Set Field [ Configuracion::EstadoConexion ; "Error" ]
End If
```

---

## 📋 **Campos Requeridos en FileMaker**

### **Tabla: Facturas**

- `urlQR` (Texto)
- `QRCode` (Container)
- `QRCode_Impresion` (Container)
- `QRFormato` (Texto)
- `QRTamaño` (Número)
- `FechaQR` (Timestamp)
- `CodigoSeguridad` (Texto)
- `EstadoEnvio` (Texto)
- `NCF` (Texto)
- `Total` (Número)

### **Tabla: Configuracion**

- `ServidorAPI` (Texto)
- `TokenAPI` (Texto)
- `EstadoConexion` (Texto)
- `FechaConfiguracion` (Timestamp)
- `UltimaPrueba` (Timestamp)

---

## 🎯 **Instrucciones de Uso**

1. **Configurar:** Ejecutar `ConfigurarConexion_API` primero
2. **Probar:** Usar `ProbarConexion_API` para verificar
3. **Procesar:** Usar `ProcesarFactura_ConQR` para envío completo
4. **Generar QR:** Usar `GenerarQR_Basico` o `GenerarQR_Impresion` según necesidad
5. **Mostrar:** Usar `MostrarQR_EnLayout` para visualizar

**¡Scripts listos para implementar en FileMaker con integración completa al sistema de facturación electrónica!** 🚀
