# Guía de Integración FileMaker: Descarga de Archivos XML/PDF

## Descripción General

Esta guía te ayudará a integrar la funcionalidad de descarga de archivos XML y PDF de documentos electrónicos (e-NCF) desde TheFactoryHKA en tu solución FileMaker.

## Scripts Disponibles

Se incluyen tres scripts de FileMaker para diferentes necesidades:

| Script                                              | Descripción                                  | Nivel de Complejidad | Uso Recomendado          |
| --------------------------------------------------- | -------------------------------------------- | -------------------- | ------------------------ |
| `FileMaker_Script_DescargarArchivo_Simple.fmfn`     | Descarga un solo tipo de archivo (XML o PDF) | ⭐ Básico            | Pruebas y uso ocasional  |
| `FileMaker_Script_DescargarArchivo_Completo.fmfn`   | Descarga con interfaz completa y opciones    | ⭐⭐ Intermedio      | Uso manual por usuarios  |
| `FileMaker_Script_DescargarArchivo_Automatico.fmfn` | Descarga automática de XML y PDF             | ⭐⭐⭐ Avanzado      | Integración automatizada |

---

## Requisitos Previos

### 1. Versión de FileMaker

- **Mínimo:** FileMaker Pro 16 (para soporte de JSONSetElement/JSONGetElement)
- **Recomendado:** FileMaker Pro 19+ (para decodificación Base64 nativa)

### 2. Configuración de Variables Globales

Debes tener configuradas las siguientes variables globales:

```
Globals::gURLBase = "https://tu-servidor.com"
Globals::gTokenJWT = "tu_token_jwt_aqui"
```

### 3. Estructura de Campos Requerida

#### Tabla: Facturas

**Campos de Datos:**

```
Facturas::ID               (número, auto-incremento)
Facturas::RNC              (texto)
Facturas::eNCF             (texto)
```

**Campos para Archivos XML:**

```
Facturas::ArchivoXML_Base64       (texto)
Facturas::ArchivoXML              (contenedor) [FileMaker 19+]
Facturas::TieneXML                (número, 0 o 1)
Facturas::FechaDescargaXML        (timestamp)
```

**Campos para Archivos PDF:**

```
Facturas::ArchivoPDF_Base64       (texto)
Facturas::ArchivoPDF              (contenedor) [FileMaker 19+]
Facturas::TienePDF                (número, 0 o 1)
Facturas::FechaDescargaPDF        (timestamp)
```

**Campos Adicionales:**

```
Facturas::UltimaDescarga          (timestamp)
Facturas::CodigoDescarga          (número)
Facturas::DescargasExitosas       (número)
Facturas::g_ResponseJSON          (texto, global)
```

#### Tabla: Logs (Opcional pero recomendada)

```
Logs::ID                   (número, auto-incremento)
Logs::Fecha                (timestamp)
Logs::Usuario              (texto)
Logs::Accion               (texto)
Logs::Detalle              (texto)
Logs::Resultado            (texto)
```

---

## Instalación de Scripts

### Paso 1: Copiar Scripts a FileMaker

1. Abre FileMaker Pro
2. Ve a **Scripts → Administrar Scripts**
3. Crea un nuevo script
4. Copia el contenido del archivo `.fmfn` correspondiente
5. Pega en el editor de scripts de FileMaker
6. Guarda el script con el nombre apropiado

### Paso 2: Configurar Variables Globales

Crea un script de inicialización:

```
# Script: Configurar Variables Globales

Set Field [ Globals::gURLBase ; "https://tu-servidor.com" ]
Set Field [ Globals::gTokenJWT ; "" ]  // Se establecerá al hacer login
```

### Paso 3: Configurar Tabla de Globals

Si no existe, crea una tabla para variables globales:

1. **Archivo → Administrar → Base de Datos**
2. Crear nueva tabla: `Globals`
3. Agregar campos:
   - `gURLBase` (texto, almacenamiento global)
   - `gTokenJWT` (texto, almacenamiento global)
4. Crear un solo registro en esta tabla

---

## Uso de los Scripts

### Script 1: Versión Simple

**Cuándo usar:**

- Necesitas descargar solo XML o solo PDF
- Para pruebas iniciales
- Uso ocasional y manual

**Cómo usar:**

1. Navega al registro de la factura que deseas descargar
2. Ejecuta el script "Descargar Archivo Simple"
3. Confirma la descarga
4. El archivo en Base64 se guardará en el campo correspondiente

**Modificar para descargar PDF:**

```
# Línea 30 del script:
Set Variable [ $extension ; Value: "pdf" ]  // Cambiar de "xml" a "pdf"
```

### Script 2: Versión Completa

**Cuándo usar:**

- Uso por usuarios finales
- Necesitas elegir entre XML o PDF
- Quieres exportar el archivo al disco
- Requieres manejo completo de errores

**Cómo usar:**

1. Navega al registro de la factura
2. Ejecuta el script "Descargar Archivo Completo"
3. Selecciona el tipo de archivo (XML o PDF)
4. Confirma la descarga
5. Opcionalmente exporta el archivo a tu computadora

**Características:**

- ✅ Interfaz de usuario amigable
- ✅ Validaciones completas
- ✅ Opción de exportar archivo
- ✅ Decodificación automática (FileMaker 19+)
- ✅ Registro en log de actividades

### Script 3: Versión Automática

**Cuándo usar:**

- Después de enviar una factura electrónica
- Procesos automatizados
- Batch processing
- Sin intervención del usuario

**Cómo usar:**

#### Opción A: Sin parámetros (usa registro actual)

```
Perform Script [ "Descargar Archivos Automáticamente" ]
```

#### Opción B: Con parámetros

```
Set Variable [ $parametro ; Value: Facturas::RNC & "|" & Facturas::eNCF ]
Perform Script [ "Descargar Archivos Automáticamente" ; Parameter: $parametro ]
```

#### Interpretar resultado:

```
Set Variable [ $resultado ; Value: Get ( ScriptResult ) ]
Set Variable [ $estado ; Value: GetValue ( Substitute ( $resultado ; "|" ; ¶ ) ; 1 ) ]

If [ $estado = "success" ]
    Show Custom Dialog [ "Éxito" ; "Ambos archivos descargados correctamente" ]
Else If [ $estado = "parcial" ]
    Show Custom Dialog [ "Advertencia" ; "Solo un archivo fue descargado" ]
Else
    Show Custom Dialog [ "Error" ; "No se pudieron descargar los archivos" ]
End If
```

---

## Flujo de Trabajo Recomendado

### Flujo Completo de Facturación Electrónica

```
1. Crear Factura
   ↓
2. Enviar a TheFactoryHKA
   Perform Script [ "Enviar Factura Electrónica" ]
   ↓
3. Verificar Envío Exitoso
   If [ Get ( ScriptResult ) = "success" ]
   ↓
4. Descargar Archivos Automáticamente
   Perform Script [ "Descargar Archivos Automáticamente" ]
   ↓
5. Enviar Email con Archivos (Opcional)
   Perform Script [ "Enviar Email Factura" ]
   ↓
6. Marcar como Procesada
   Set Field [ Facturas::Procesada ; 1 ]
```

### Script Maestro de Ejemplo

```
# Script: Proceso Completo Factura Electrónica

# 1. Validar datos
If [ IsEmpty ( Facturas::RNC ) or IsEmpty ( Facturas::eNCF ) ]
    Show Custom Dialog [ "Error" ; "Datos incompletos" ]
    Exit Script
End If

# 2. Enviar factura
Perform Script [ "Enviar Factura Electrónica" ]
Set Variable [ $resultado ; Value: Get ( ScriptResult ) ]

If [ $resultado ≠ "success" ]
    Show Custom Dialog [ "Error" ; "No se pudo enviar la factura" ]
    Exit Script
End If

# 3. Esperar un momento (opcional)
Pause/Resume Script [ Duration (seconds): 2 ]

# 4. Descargar archivos automáticamente
Perform Script [ "Descargar Archivos Automáticamente" ]
Set Variable [ $descarga ; Value: Get ( ScriptResult ) ]
Set Variable [ $estadoDescarga ; Value: GetValue ( Substitute ( $descarga ; "|" ; ¶ ) ; 1 ) ]

# 5. Verificar descargas
If [ $estadoDescarga = "success" ]
    # Ambos archivos descargados
    Set Field [ Facturas::EstadoProceso ; "Completo" ]

    # 6. Preguntar si enviar email
    Show Custom Dialog [ "Factura Procesada" ;
        "Factura enviada y archivos descargados." & ¶ &
        "¿Desea enviar el email al cliente?"
    ]

    If [ Get ( LastMessageChoice ) = 1 ]
        Perform Script [ "Enviar Email Factura" ]
    End If

Else If [ $estadoDescarga = "parcial" ]
    # Solo un archivo descargado
    Set Field [ Facturas::EstadoProceso ; "Parcial" ]
    Show Custom Dialog [ "Advertencia" ; "Factura enviada pero solo se descargó un archivo" ]

Else
    # No se descargaron archivos
    Set Field [ Facturas::EstadoProceso ; "Sin Archivos" ]
    Show Custom Dialog [ "Advertencia" ;
        "Factura enviada pero no se pudieron descargar los archivos." & ¶ &
        "Puede intentar descargarlos manualmente más tarde."
    ]
End If

# 7. Actualizar campos
Set Field [ Facturas::FechaProceso ; Get ( CurrentTimestamp ) ]
Set Field [ Facturas::UsuarioProceso ; Get ( AccountName ) ]

# 8. Ir a siguiente registro (opcional)
Go to Record/Request/Page [ Next ; Exit after last: On ]
```

---

## Trabajar con Archivos Base64

### ¿Qué es Base64?

Base64 es un método de codificación que convierte archivos binarios (como XML o PDF) en texto. Esto permite transmitir archivos a través de JSON.

### Decodificar Base64

#### FileMaker 19 o superior:

```
Set Variable [ $archivoBase64 ; Value: Facturas::ArchivoXML_Base64 ]
Set Variable [ $contenido ; Value: Base64Decode ( $archivoBase64 ; "documento.xml" ) ]
Set Field [ Facturas::ArchivoXML ; $contenido ]
```

#### FileMaker 18 o anterior:

Necesitarás usar una herramienta externa o plugin:

- BaseElements Plugin
- MBS FileMaker Plugin
- Herramienta web externa

### Exportar Archivos

#### Exportar desde campo contenedor:

```
Export Field Contents [ Facturas::ArchivoXML ; "archivo.xml" ]
```

#### Exportar con diálogo de guardar:

```
Export Field Contents [ Facturas::ArchivoXML ; "$nombreArchivo" ]
# El $ permite al usuario elegir dónde guardar
```

---

## Ejemplos de Layouts

### Layout para Visualizar Archivos Descargados

**Campos a incluir:**

```
[Facturas::eNCF]
[Facturas::RNC]

Archivos Descargados:
☑ XML  [Facturas::FechaDescargaXML]  [Botón: Ver XML]
☑ PDF  [Facturas::FechaDescargaPDF]  [Botón: Ver PDF]

[Última Descarga: Facturas::UltimaDescarga]
```

**Botones:**

```
Botón "Descargar XML"
→ Perform Script [ "Descargar Archivo Simple" ]

Botón "Descargar PDF"
→ Modificar script para $extension = "pdf"
→ Perform Script [ "Descargar Archivo Simple (PDF)" ]

Botón "Descargar Ambos"
→ Perform Script [ "Descargar Archivos Automáticamente" ]

Botón "Ver XML"
→ Export Field Contents [ Facturas::ArchivoXML ]
→ Abrir archivo con aplicación predeterminada

Botón "Ver PDF"
→ Export Field Contents [ Facturas::ArchivoPDF ]
→ Abrir archivo con aplicación predeterminada
```

### Layout de Portal para Historial

```
Portal: Logs relacionados con Facturas::ID

[Logs::Fecha] | [Logs::Accion] | [Logs::Resultado]
─────────────────────────────────────────────────
13/10/24 14:30 | Descarga XML   | Exitoso
13/10/24 14:31 | Descarga PDF   | Exitoso
```

---

## Solución de Problemas

### Problema 1: "No hay token de autenticación"

**Causa:** El campo `Globals::gTokenJWT` está vacío

**Solución:**

1. Asegúrate de haber iniciado sesión
2. Verifica que el script de login establezca el token:
   ```
   Set Field [ Globals::gTokenJWT ; $tokenRecibido ]
   ```

### Problema 2: "No se recibió respuesta del servidor"

**Causa:** Problemas de conexión o URL incorrecta

**Solución:**

1. Verifica `Globals::gURLBase` sea correcta
2. Comprueba conexión a internet
3. Verifica que el servidor esté en línea

### Problema 3: "Documento no encontrado"

**Causa:** El e-NCF no existe en TheFactoryHKA

**Solución:**

1. Verifica que el e-NCF sea correcto
2. Asegúrate de haber enviado la factura primero
3. Verifica que el RNC sea del emisor correcto

### Problema 4: "Error 404"

**Causa:** El documento no existe en el sistema

**Solución:**

1. Verifica el número de e-NCF
2. Confirma que la factura fue enviada exitosamente
3. Espera unos segundos después del envío antes de descargar

### Problema 5: Base64Decode no funciona

**Causa:** Versión de FileMaker anterior a 19

**Solución:**

- Actualizar a FileMaker 19+
- Usar plugin como MBS o BaseElements
- Usar herramienta web externa para decodificar

---

## Optimizaciones y Mejores Prácticas

### 1. Cache de Archivos

```
# No descargar si ya existe
If [ not IsEmpty ( Facturas::ArchivoXML_Base64 ) ]
    Show Custom Dialog [ "Archivo Existente" ;
        "El archivo XML ya está descargado." & ¶ &
        "¿Desea descargarlo nuevamente?"
    ]
    If [ Get ( LastMessageChoice ) = 2 ]
        Exit Script
    End If
End If
```

### 2. Descarga en Lote

```
# Script: Descargar Archivos en Lote

Go to Record/Request/Page [ First ]

Loop
    # Solo descargar si no tiene archivos
    If [ IsEmpty ( Facturas::ArchivoXML_Base64 ) ]
        Perform Script [ "Descargar Archivos Automáticamente" ]
        Pause/Resume Script [ Duration (seconds): 1 ]
    End If

    Go to Record/Request/Page [ Next ; Exit after last: On ]
    Exit Loop If [ Get ( RecordNumber ) = Get ( FoundCount ) ]
End Loop
```

### 3. Validación de Tamaño

```
# Verificar tamaño del archivo Base64
Set Variable [ $tamañoBase64 ; Value: Length ( Facturas::ArchivoXML_Base64 ) ]

If [ $tamañoBase64 > 10000000 ] # 10 MB en Base64
    Show Custom Dialog [ "Archivo Grande" ;
        "El archivo es muy grande (" & Round ( $tamañoBase64 / 1000000 ; 2 ) & " MB)." & ¶ &
        "Esto puede afectar el rendimiento."
    ]
End If
```

### 4. Reintentos Automáticos

```
Set Variable [ $intentos ; Value: 0 ]
Set Variable [ $maxIntentos ; Value: 3 ]

Loop
    Perform Script [ "Descargar Archivo Simple" ]
    Set Variable [ $resultado ; Value: Get ( ScriptResult ) ]

    Exit Loop If [ $resultado = "success" ]

    Set Variable [ $intentos ; Value: $intentos + 1 ]
    Exit Loop If [ $intentos ≥ $maxIntentos ]

    Pause/Resume Script [ Duration (seconds): 2 ]
End Loop
```

---

## Integración con WebViewer

### Mostrar PDF en WebViewer

```javascript
// Código JavaScript en WebViewer
'data:application/pdf;base64,' + Facturas::ArchivoPDF_Base64;
```

### Mostrar XML formateado

```javascript
// Código JavaScript en WebViewer
'data:text/xml;base64,' + Facturas::ArchivoXML_Base64;
```

---

## Seguridad

### 1. Proteger Token JWT

```
# El token NO debe ser visible en layouts
# Usar campo global oculto
# Limpiar al cerrar sesión

Set Field [ Globals::gTokenJWT ; "" ]
```

### 2. Permisos de Scripts

- Restringir ejecución de scripts a usuarios autorizados
- Usar privilegios personalizados en FileMaker
- Registrar todas las descargas en log

### 3. Validar Origen de Datos

```
# Siempre validar que el e-NCF pertenece al usuario actual
If [ Facturas::UsuarioCreador ≠ Get ( AccountName ) ]
    # Verificar permisos especiales
    If [ Get ( PrivilegeSetName ) ≠ "Full Access" ]
        Show Custom Dialog [ "Acceso Denegado" ; "No tiene permisos" ]
        Exit Script
    End If
End If
```

---

## Recursos Adicionales

### Documentación Relacionada

- [Guía de Usuario API](./DESCARGAR_ARCHIVO_GUIA.md)
- [Quick Start](./DESCARGAR_ARCHIVO_QUICK_START.md)
- [Implementación Técnica](./IMPLEMENTACION_DESCARGAR_ARCHIVO.md)

### Funciones FileMaker Útiles

| Función                 | Uso                         |
| ----------------------- | --------------------------- |
| `JSONGetElement()`      | Extraer valores de JSON     |
| `JSONSetElement()`      | Construir JSON              |
| `Base64Decode()`        | Decodificar Base64 (FM 19+) |
| `Insert from URL`       | Hacer peticiones HTTP       |
| `Export Field Contents` | Exportar archivos           |

### Enlaces Útiles

- [FileMaker JSON Functions](https://fmhelp.filemaker.com/help/18/fmp/en/index.html#page/FMP_Help/json-functions.html)
- [Insert from URL](https://fmhelp.filemaker.com/help/18/fmp/en/index.html#page/FMP_Help/insert-from-url.html)
- [Base64Decode](https://fmhelp.filemaker.com/help/19/fmp/en/index.html#page/FMP_Help/base64decode.html)

---

## Soporte

Para preguntas o problemas:

1. Revisar esta documentación
2. Consultar logs de FileMaker
3. Verificar respuestas JSON en campo `g_ResponseJSON`
4. Contactar soporte técnico

---

**Última actualización:** 13 de Octubre, 2025  
**Versión:** 1.0.0
