# Scripts FileMaker: Descarga de Archivos XML/PDF

## 📚 Descripción

Scripts de FileMaker para descargar archivos XML y PDF de documentos electrónicos (e-NCF) desde TheFactoryHKA.

---

## 📁 Archivos Incluidos

| Archivo                                             | Nivel           | Descripción                               | Líneas |
| --------------------------------------------------- | --------------- | ----------------------------------------- | ------ |
| `FileMaker_Script_DescargarArchivo_Simple.fmfn`     | ⭐ Básico       | Descarga un tipo de archivo (XML o PDF)   | ~200   |
| `FileMaker_Script_DescargarArchivo_Completo.fmfn`   | ⭐⭐ Intermedio | Descarga con interfaz completa y opciones | ~450   |
| `FileMaker_Script_DescargarArchivo_Automatico.fmfn` | ⭐⭐⭐ Avanzado | Descarga automática de XML y PDF          | ~350   |

---

## 🚀 Inicio Rápido

### 1. Script Simple (Para Empezar)

**Características:**

- ✅ Fácil de implementar
- ✅ Mínima configuración
- ✅ Ideal para pruebas

**Uso:**

```
1. Copiar script a FileMaker
2. Navegar a registro de factura
3. Ejecutar script
4. Confirmar descarga
```

**Configuración:**

```
# Para descargar XML (por defecto)
Set Variable [ $extension ; Value: "xml" ]

# Para descargar PDF
Set Variable [ $extension ; Value: "pdf" ]
```

---

### 2. Script Completo (Para Producción)

**Características:**

- ✅ Interfaz de usuario completa
- ✅ Validaciones exhaustivas
- ✅ Opción de exportar archivo
- ✅ Manejo de errores robusto
- ✅ Registro en log

**Uso:**

```
1. Copiar script a FileMaker
2. Navegar a registro de factura
3. Ejecutar script
4. Seleccionar tipo de archivo (XML o PDF)
5. Confirmar descarga
6. Opcionalmente exportar a disco
```

---

### 3. Script Automático (Para Integración)

**Características:**

- ✅ Descarga XML y PDF automáticamente
- ✅ Sin intervención del usuario
- ✅ Ideal para procesos automatizados
- ✅ Retorna resultado detallado

**Uso:**

**Opción A - Sin parámetros:**

```
Perform Script [ "Descargar Archivos Automáticamente" ]
```

**Opción B - Con parámetros:**

```
Set Variable [ $param ; Value: "130960088|E310000000033" ]
Perform Script [ "Descargar Archivos Automáticamente" ; Parameter: $param ]
```

**Interpretar resultado:**

```
Set Variable [ $resultado ; Value: Get ( ScriptResult ) ]
Set Variable [ $estado ; Value: GetValue ( Substitute ( $resultado ; "|" ; ¶ ) ; 1 ) ]

If [ $estado = "success" ]
    # Ambos archivos descargados
Else If [ $estado = "parcial" ]
    # Solo un archivo descargado
Else
    # Ningún archivo descargado
End If
```

---

## 📋 Requisitos

### FileMaker

- **Mínimo:** FileMaker Pro 16
- **Recomendado:** FileMaker Pro 19+ (para decodificación Base64)

### Variables Globales

```
Globals::gURLBase = "https://tu-servidor.com"
Globals::gTokenJWT = "tu_token_jwt"
```

### Campos Requeridos

#### Para XML:

```
Facturas::ArchivoXML_Base64    (texto)
Facturas::ArchivoXML           (contenedor) [FM 19+]
Facturas::TieneXML             (número)
Facturas::FechaDescargaXML     (timestamp)
```

#### Para PDF:

```
Facturas::ArchivoPDF_Base64    (texto)
Facturas::ArchivoPDF           (contenedor) [FM 19+]
Facturas::TienePDF             (número)
Facturas::FechaDescargaPDF     (timestamp)
```

#### Campos Comunes:

```
Facturas::RNC                  (texto)
Facturas::eNCF                 (texto)
Facturas::g_ResponseJSON       (texto, global)
Facturas::UltimaDescarga       (timestamp)
```

---

## 🎯 Casos de Uso

### Caso 1: Descarga Manual Ocasional

**Script:** Simple  
**Escenario:** Usuario necesita descargar un archivo específico

```
Usuario → Ve factura → Click "Descargar XML" → Archivo guardado
```

---

### Caso 2: Descarga con Opciones

**Script:** Completo  
**Escenario:** Usuario elige tipo y puede exportar

```
Usuario → Ve factura → Click "Descargar"
        → Elige XML o PDF → Descarga
        → Pregunta si exportar → Exporta (opcional)
```

---

### Caso 3: Proceso Automatizado

**Script:** Automático  
**Escenario:** Después de enviar factura, descargar archivos automáticamente

```
# Script Maestro

1. Enviar Factura Electrónica
2. If [ éxito ]
3.   Perform Script [ "Descargar Archivos Automáticamente" ]
4.   If [ Get ( ScriptResult ) = "success" ]
5.     Perform Script [ "Enviar Email con Archivos" ]
6.   End If
7. End If
```

---

## 💡 Ejemplos de Implementación

### Ejemplo 1: Botón Simple

**Layout: Facturas**

```
Botón "📥 Descargar XML"

Script Steps:
If [ IsEmpty ( Facturas::eNCF ) ]
    Show Custom Dialog [ "Error" ; "No hay e-NCF para descargar" ]
    Exit Script
End If

Perform Script [ "Descargar Archivo Simple" ]
```

---

### Ejemplo 2: Portal con Botones

**Layout: Lista de Facturas**

```
Portal: Facturas

[eNCF] | [Fecha] | [Monto] | [📥 XML] | [📥 PDF]

Botón XML:
  Perform Script [ "Descargar Archivo Simple (XML)" ]

Botón PDF:
  Perform Script [ "Descargar Archivo Simple (PDF)" ]
```

---

### Ejemplo 3: Proceso Batch

```
# Script: Descargar Archivos Pendientes

Go to Layout [ "Facturas" ]
Enter Find Mode
Set Field [ Facturas::TieneXML ; "" ]  # Buscar sin XML
Perform Find

If [ Get ( FoundCount ) > 0 ]
    Go to Record/Request/Page [ First ]

    Loop
        Perform Script [ "Descargar Archivos Automáticamente" ]
        Pause/Resume Script [ Duration (seconds): 1 ]

        Go to Record/Request/Page [ Next ; Exit after last: On ]
        Exit Loop If [ Get ( RecordNumber ) = Get ( FoundCount ) ]
    End Loop

    Show Custom Dialog [ "Completado" ;
        "Se procesaron " & Get ( FoundCount ) & " facturas"
    ]
End If
```

---

### Ejemplo 4: Integración Completa

```
# Script: Facturación Electrónica Completa

# Paso 1: Validar datos
If [ IsEmpty ( Facturas::RNC ) or IsEmpty ( Facturas::eNCF ) ]
    Show Custom Dialog [ "Error" ; "Datos incompletos" ]
    Exit Script
End If

# Paso 2: Enviar factura
Perform Script [ "Enviar Factura Electrónica" ]
Set Variable [ $envio ; Value: Get ( ScriptResult ) ]

If [ $envio ≠ "success" ]
    Exit Script
End If

# Paso 3: Esperar procesamiento
Pause/Resume Script [ Duration (seconds): 3 ]

# Paso 4: Descargar archivos
Perform Script [ "Descargar Archivos Automáticamente" ]
Set Variable [ $descarga ; Value: Get ( ScriptResult ) ]
Set Variable [ $estado ; Value: GetValue ( Substitute ( $descarga ; "|" ; ¶ ) ; 1 ) ]

# Paso 5: Verificar y notificar
If [ $estado = "success" ]
    # Paso 6: Enviar email (opcional)
    Show Custom Dialog [ "Enviar Email" ;
        "Archivos descargados. ¿Enviar email al cliente?"
    ]

    If [ Get ( LastMessageChoice ) = 1 ]
        Perform Script [ "Enviar Email Factura" ]
    End If

    Set Field [ Facturas::EstadoProceso ; "Completado" ]
Else
    Set Field [ Facturas::EstadoProceso ; "Parcial" ]
    Show Custom Dialog [ "Advertencia" ;
        "Factura enviada pero no se pudieron descargar todos los archivos"
    ]
End If
```

---

## 🔧 Personalización

### Cambiar Timeout

```
# En la sección de cURL options:
Set Variable [ $curlOptions ; Value:
    "--request POST" & " " &
    "--header \"Content-Type: application/json\"" & " " &
    "--header \"Authorization: Bearer " & $token & "\"" & " " &
    "--header \"Accept: application/json\"" & " " &
    "--connect-timeout 30" & " " &    # Conexión: 30 segundos
    "--max-time 120" & " " &          # Total: 120 segundos (cambiar aquí)
    "--data-raw " & Quote($json)
]
```

### Agregar Notificación por Email

```
# Después de descarga exitosa:
If [ $status = "success" ]
    # ... código existente ...

    # Enviar notificación
    Send Mail [
        To: Get ( AccountEmail ) ;
        Subject: "Archivo descargado: " & $documento ;
        Message: "El archivo " & $extension & " se descargó correctamente"
    ]
End If
```

### Limitar Intentos de Descarga

```
# Al inicio del script:
If [ Facturas::IntentosDescarga ≥ 3 ]
    Show Custom Dialog [ "Límite Alcanzado" ;
        "Se han realizado 3 intentos. Contacte soporte."
    ]
    Exit Script
End If

# Incrementar contador
Set Field [ Facturas::IntentosDescarga ; Facturas::IntentosDescarga + 1 ]

# Al final si es exitoso:
Set Field [ Facturas::IntentosDescarga ; 0 ]  # Reset
```

---

## 🐛 Solución de Problemas

### Problema: "Token inválido"

```
✅ Verificar:
- Globals::gTokenJWT tiene valor
- Token no ha expirado
- Token es correcto

🔧 Solución:
- Volver a iniciar sesión
- Ejecutar script de autenticación
```

### Problema: "No se recibió respuesta"

```
✅ Verificar:
- Conexión a internet activa
- URL correcta en Globals::gURLBase
- Servidor en línea

🔧 Solución:
- Verificar URL
- Probar conexión
- Contactar IT
```

### Problema: "Documento no encontrado"

```
✅ Verificar:
- e-NCF es correcto
- Factura fue enviada primero
- RNC corresponde al emisor

🔧 Solución:
- Verificar datos
- Enviar factura primero
- Revisar RNC
```

### Problema: "Base64Decode no funciona"

```
✅ Verificar:
- Versión de FileMaker (debe ser 19+)

🔧 Solución:
- Actualizar FileMaker a 19+
- Usar plugin (MBS, BaseElements)
- Usar archivo Base64 directamente
```

---

## 📊 Campos Calculados Útiles

### Indicador de Archivos Disponibles

```
# Campo: c_ArchivosDisponibles
Case (
    Facturas::TieneXML and Facturas::TienePDF ; "✅ XML y PDF" ;
    Facturas::TieneXML ; "📄 Solo XML" ;
    Facturas::TienePDF ; "📄 Solo PDF" ;
    "❌ Sin archivos"
)
```

### Tamaño de Archivos

```
# Campo: c_TamañoXML_MB
Round ( Length ( Facturas::ArchivoXML_Base64 ) / 1048576 ; 2 ) & " MB"
```

### Estado de Descarga

```
# Campo: c_EstadoDescarga
Let ( [
    ~diasDesdeEnvio = Get ( CurrentDate ) - Date ( Facturas::FechaEnvio ) ;
    ~tieneArchivos = Facturas::TieneXML or Facturas::TienePDF
] ;
    Case (
        ~tieneArchivos ; "Descargado" ;
        ~diasDesdeEnvio > 7 ; "⚠️ Pendiente (>7 días)" ;
        "Pendiente"
    )
)
```

---

## 📚 Documentación Completa

- **[Guía FileMaker Completa](../docs/FILEMAKER_DESCARGAR_ARCHIVO.md)** - Documentación exhaustiva
- **[Guía API](../docs/DESCARGAR_ARCHIVO_GUIA.md)** - Detalles del endpoint
- **[Quick Start](../docs/DESCARGAR_ARCHIVO_QUICK_START.md)** - Inicio rápido
- **[Implementación](../docs/IMPLEMENTACION_DESCARGAR_ARCHIVO.md)** - Detalles técnicos

---

## 🎓 Recursos de Aprendizaje

### Videos Sugeridos

- FileMaker JSON Functions
- Insert from URL Tutorial
- Working with Base64 in FileMaker

### Lecturas Recomendadas

- FileMaker REST API Guide
- JSON in FileMaker Best Practices
- FileMaker Container Fields Guide

---

## ✅ Checklist de Implementación

- [ ] Copiar scripts a FileMaker
- [ ] Configurar variables globales
- [ ] Crear campos requeridos
- [ ] Crear tabla Logs (opcional)
- [ ] Probar script simple
- [ ] Probar script completo
- [ ] Probar script automático
- [ ] Crear botones en layouts
- [ ] Configurar permisos
- [ ] Documentar para usuarios
- [ ] Capacitar usuarios
- [ ] Monitorear en producción

---

## 🆘 Soporte

**Dudas o problemas:**

1. Consultar documentación completa
2. Revisar campo `g_ResponseJSON` para ver respuestas
3. Verificar tabla Logs para historial
4. Contactar soporte técnico

---

## 📄 Licencia

Scripts desarrollados para Lab Contreras.  
Uso interno exclusivo.

---

**Versión:** 1.0.0  
**Fecha:** 13 de Octubre, 2025  
**Autor:** Lab Contreras - Equipo de Desarrollo

---

## 🚀 Próximos Pasos

1. **Leer documentación completa:** [FILEMAKER_DESCARGAR_ARCHIVO.md](../docs/FILEMAKER_DESCARGAR_ARCHIVO.md)
2. **Implementar script simple** para pruebas
3. **Probar con documentos reales**
4. **Implementar scripts completos** en producción
5. **Capacitar usuarios** en el uso de los scripts

¡Feliz desarrollo! 🎉
