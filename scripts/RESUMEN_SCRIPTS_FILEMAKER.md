# ✅ Scripts FileMaker - Descarga de Archivos XML/PDF

## 📋 Resumen de Implementación

Se han creado **3 scripts de FileMaker** para descargar archivos XML y PDF de documentos electrónicos desde TheFactoryHKA.

**Fecha:** 13 de Octubre, 2025  
**Estado:** ✅ Listos para usar  
**Versión:** 1.0.0

---

## 📁 Archivos Creados

| Archivo                                             | Tamaño      | Descripción                   |
| --------------------------------------------------- | ----------- | ----------------------------- |
| `FileMaker_Script_DescargarArchivo_Simple.fmfn`     | ~200 líneas | Script básico para un archivo |
| `FileMaker_Script_DescargarArchivo_Completo.fmfn`   | ~450 líneas | Script completo con interfaz  |
| `FileMaker_Script_DescargarArchivo_Automatico.fmfn` | ~350 líneas | Script automático XML + PDF   |
| `README_SCRIPTS_DESCARGAR_ARCHIVO.md`               | ~600 líneas | Guía rápida de scripts        |

---

## 🎯 ¿Cuál Script Usar?

### Para Pruebas Iniciales

→ **Script Simple** (`FileMaker_Script_DescargarArchivo_Simple.fmfn`)

- ✅ Fácil de implementar
- ✅ Mínima configuración
- ✅ Perfecto para familiarizarse

### Para Usuarios Finales

→ **Script Completo** (`FileMaker_Script_DescargarArchivo_Completo.fmfn`)

- ✅ Interfaz amigable
- ✅ Múltiples opciones
- ✅ Exportación a disco
- ✅ Validaciones exhaustivas

### Para Automatización

→ **Script Automático** (`FileMaker_Script_DescargarArchivo_Automatico.fmfn`)

- ✅ Descarga XML y PDF juntos
- ✅ Sin intervención del usuario
- ✅ Ideal para flujos automatizados
- ✅ Llamar después de enviar factura

---

## 🚀 Inicio Rápido

### Paso 1: Copiar Script

```
1. Abrir archivo .fmfn en editor de texto
2. Copiar todo el contenido
3. En FileMaker: Scripts → Administrar Scripts
4. Crear nuevo script
5. Pegar contenido
6. Guardar
```

### Paso 2: Configurar Variables Globales

```
Globals::gURLBase = "https://tu-servidor.com"
Globals::gTokenJWT = "tu_token_jwt"
```

### Paso 3: Crear Campos

**Campos mínimos requeridos:**

```
Facturas::RNC                  (texto)
Facturas::eNCF                 (texto)
Facturas::ArchivoXML_Base64    (texto)
Facturas::g_ResponseJSON       (texto, global)
```

### Paso 4: Probar

```
1. Navegar a registro con factura
2. Ejecutar script
3. Verificar descarga
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Descargar XML

```
# Usuario en registro de factura
Facturas::eNCF = "E310000000033"
Facturas::RNC = "130960088"

# Ejecutar script simple
Perform Script [ "Descargar Archivo Simple" ]

# Resultado: XML guardado en Facturas::ArchivoXML_Base64
```

### Ejemplo 2: Descargar con Opciones

```
# Usuario ejecuta script completo
Perform Script [ "Descargar Archivo Completo" ]

# El script pregunta:
# - ¿XML o PDF?
# - ¿Exportar a disco?

# Usuario elige y archivo se descarga
```

### Ejemplo 3: Automatización Completa

```
# Script Maestro: Envío Completo

# 1. Enviar factura
Perform Script [ "Enviar Factura Electrónica" ]

# 2. Si exitoso, descargar archivos
If [ Get ( ScriptResult ) = "success" ]
    Pause/Resume Script [ Duration (seconds): 2 ]

    # 3. Descargar XML y PDF automáticamente
    Perform Script [ "Descargar Archivos Automáticamente" ]

    Set Variable [ $resultado ; Value: Get ( ScriptResult ) ]
    Set Variable [ $estado ; Value: GetValue ( Substitute ( $resultado ; "|" ; ¶ ) ; 1 ) ]

    # 4. Verificar resultado
    If [ $estado = "success" ]
        Show Custom Dialog [ "Éxito" ; "Factura enviada y archivos descargados" ]
    End If
End If
```

---

## 📋 Campos Requeridos por Script

### Script Simple

```
✅ Facturas::RNC
✅ Facturas::eNCF
✅ Facturas::ArchivoXML_Base64    (para XML)
✅ Facturas::ArchivoPDF_Base64    (para PDF)
✅ Facturas::g_ResponseJSON       (global)
```

### Script Completo

```
✅ Todos los campos del Simple +
✅ Facturas::ArchivoXML           (contenedor, FM 19+)
✅ Facturas::ArchivoPDF           (contenedor, FM 19+)
✅ Facturas::TieneXML             (número 0/1)
✅ Facturas::TienePDF             (número 0/1)
✅ Facturas::FechaDescargaXML     (timestamp)
✅ Facturas::FechaDescargaPDF     (timestamp)
✅ Facturas::UltimaDescarga       (timestamp)
✅ Logs::*                        (tabla opcional)
```

### Script Automático

```
✅ Todos los campos del Completo +
✅ Facturas::DescargasExitosas    (número)
```

---

## 🎨 Configuración de Layouts

### Layout: Vista de Factura

```
┌─────────────────────────────────────┐
│ Factura Electrónica                 │
├─────────────────────────────────────┤
│ e-NCF: [E310000000033]              │
│ RNC:   [130960088]                  │
│                                      │
│ Archivos Descargados:               │
│ ☑ XML  [13/10/24 14:30] [Ver] [⬇️]  │
│ ☑ PDF  [13/10/24 14:31] [Ver] [⬇️]  │
│                                      │
│ [Descargar XML] [Descargar PDF]     │
│ [Descargar Ambos]                   │
└─────────────────────────────────────┘
```

**Botones:**

```
Botón "Descargar XML":
  Perform Script [ "Descargar Archivo Simple (XML)" ]

Botón "Descargar PDF":
  Perform Script [ "Descargar Archivo Simple (PDF)" ]

Botón "Descargar Ambos":
  Perform Script [ "Descargar Archivos Automáticamente" ]

Botón "Ver XML":
  If [ not IsEmpty ( Facturas::ArchivoXML ) ]
    Export Field Contents [ Facturas::ArchivoXML ; "temp.xml" ]
    # Abrir con aplicación predeterminada
  End If
```

### Portal: Historial de Descargas

```
┌─────────────────────────────────────────────┐
│ Historial de Actividad                     │
├─────────────────────────────────────────────┤
│ Fecha/Hora    │ Acción          │ Resultado │
│ 13/10 14:30   │ Descarga XML    │ ✅ Éxito  │
│ 13/10 14:31   │ Descarga PDF    │ ✅ Éxito  │
│ 13/10 14:25   │ Envío Factura   │ ✅ Éxito  │
└─────────────────────────────────────────────┘
```

---

## 🔧 Personalización

### Cambiar Tipo de Archivo (Script Simple)

```
# Línea ~30 del script:

# Para XML:
Set Variable [ $extension ; Value: "xml" ]

# Para PDF:
Set Variable [ $extension ; Value: "pdf" ]
```

### Agregar Validación Personalizada

```
# Después de validaciones existentes, agregar:

# Validar que no se ha descargado antes
If [ not IsEmpty ( Facturas::ArchivoXML_Base64 ) ]
    Show Custom Dialog [ "Archivo Existente" ;
        "El archivo ya fue descargado. ¿Descargar nuevamente?"
    ]
    If [ Get ( LastMessageChoice ) = 2 ]
        Exit Script
    End If
End If
```

### Agregar Notificación

```
# Después de descarga exitosa:

# Enviar notificación
Send Mail [
    To: Facturas::EmailCliente ;
    Subject: "Documento descargado: " & Facturas::eNCF ;
    Message: "Su factura está disponible para descarga"
]
```

---

## 🐛 Solución de Problemas Comunes

### Error: "No hay token de autenticación"

**Causa:** `Globals::gTokenJWT` está vacío

**Solución:**

```
1. Verificar que haya iniciado sesión
2. Ejecutar script de login
3. Verificar que se establece el token:
   Set Field [ Globals::gTokenJWT ; $tokenRecibido ]
```

### Error: "Documento no encontrado"

**Causa:** El e-NCF no existe en TheFactoryHKA

**Solución:**

```
1. Verificar que el e-NCF sea correcto
2. Asegurarse de haber enviado la factura primero
3. Verificar que el RNC sea del emisor
```

### Error: "Base64Decode no funciona"

**Causa:** FileMaker versión < 19

**Solución:**

```
1. Actualizar a FileMaker 19+
2. Usar plugin (MBS, BaseElements)
3. Guardar solo el Base64 y decodificar externamente
```

### Archivo descargado está vacío

**Causa:** Error en la descarga o timeout

**Solución:**

```
1. Revisar campo g_ResponseJSON para ver respuesta
2. Verificar conexión a internet
3. Aumentar timeout en cURL options
4. Reintentar la descarga
```

---

## 📊 Flujos de Trabajo Recomendados

### Flujo 1: Facturación Manual

```
1. Crear factura en FileMaker
2. Usuario llena datos
3. Click "Enviar Factura"
4. Esperar confirmación
5. Click "Descargar Archivos"
6. Elegir XML o PDF
7. Opcionalmente exportar
```

### Flujo 2: Facturación Automatizada

```
1. Sistema crea factura
2. Script: Enviar Factura Electrónica
3. If exitoso: Script Automático (XML+PDF)
4. Script: Enviar Email con archivos
5. Marcar como procesada
```

### Flujo 3: Descarga Batch

```
1. Buscar facturas sin archivos
2. Loop por cada registro:
   - Descargar Archivos Automáticamente
   - Esperar 1 segundo
   - Siguiente registro
3. Mostrar resumen
```

---

## 📚 Documentación Completa

### Guías Principales

| Documento                                                                    | Descripción             | Para Quién      |
| ---------------------------------------------------------------------------- | ----------------------- | --------------- |
| [README_SCRIPTS_DESCARGAR_ARCHIVO.md](./README_SCRIPTS_DESCARGAR_ARCHIVO.md) | Guía rápida scripts     | Desarrolladores |
| [FILEMAKER_DESCARGAR_ARCHIVO.md](../docs/FILEMAKER_DESCARGAR_ARCHIVO.md)     | Guía completa FileMaker | Todos           |
| [DESCARGAR_ARCHIVO_GUIA.md](../docs/DESCARGAR_ARCHIVO_GUIA.md)               | Guía API                | Desarrolladores |
| [DESCARGAR_ARCHIVO_QUICK_START.md](../docs/DESCARGAR_ARCHIVO_QUICK_START.md) | Inicio rápido           | Usuarios        |

### Videos y Tutoriales

- FileMaker JSON Functions
- Insert from URL Tutorial
- Base64 in FileMaker
- Container Fields Guide

---

## ✅ Checklist de Implementación

### Configuración Inicial

- [ ] FileMaker 16+ instalado
- [ ] Scripts copiados a FileMaker
- [ ] Variables globales configuradas
- [ ] Campos de BD creados
- [ ] Tabla Logs creada (opcional)

### Testing

- [ ] Script Simple probado con XML
- [ ] Script Simple probado con PDF
- [ ] Script Completo probado
- [ ] Script Automático probado
- [ ] Exportación de archivos probada

### Producción

- [ ] Layouts creados con botones
- [ ] Permisos configurados
- [ ] Usuarios capacitados
- [ ] Documentación distribuida
- [ ] Soporte técnico informado

### Monitoreo

- [ ] Logs verificados
- [ ] Errores monitoreados
- [ ] Performance verificada
- [ ] Usuarios satisfechos

---

## 🎓 Capacitación de Usuarios

### Nivel Básico (15 min)

```
1. Mostrar dónde está el botón "Descargar"
2. Demostrar descarga de XML
3. Demostrar descarga de PDF
4. Mostrar cómo ver los archivos
5. Q&A
```

### Nivel Intermedio (30 min)

```
1. Revisar flujo completo de facturación
2. Demostrar script completo con opciones
3. Exportación de archivos
4. Solución de problemas comunes
5. Prácticas con datos de prueba
6. Q&A
```

### Nivel Avanzado (1 hora)

```
1. Arquitectura de los scripts
2. Personalización y modificación
3. Integración con otros procesos
4. Debugging y troubleshooting
5. Optimización de performance
6. Mejores prácticas
7. Q&A
```

---

## 🔐 Seguridad

### Recomendaciones

✅ **Token JWT**

- No mostrar en layouts
- Usar campo global oculto
- Limpiar al cerrar sesión

✅ **Permisos**

- Restringir scripts a usuarios autorizados
- Usar privilegios de FileMaker
- Registrar todas las descargas

✅ **Archivos**

- No compartir archivos sensibles
- Cifrar campos si es necesario
- Respetar privacidad de datos

✅ **Logs**

- Registrar todas las operaciones
- Revisar logs regularmente
- Alertar sobre actividad inusual

---

## 📞 Soporte

### Recursos de Ayuda

1. **Documentación**

   - Revisar guías en `/docs`
   - Consultar README de scripts
   - Buscar en Wiki interna

2. **Debugging**

   - Revisar campo `g_ResponseJSON`
   - Verificar tabla Logs
   - Activar Data Viewer en FileMaker

3. **Contacto**
   - Email: servicios@contrerasrobledo.com.do
   - Wiki: [Documentación interna]
   - Soporte IT: [Extensión]

---

## 🚀 Próximos Pasos

### Inmediatos

1. ✅ Leer documentación completa
2. ✅ Implementar script simple
3. ✅ Probar con datos de prueba
4. ✅ Capacitar usuarios

### Corto Plazo

1. 📋 Implementar scripts completos
2. 📋 Crear layouts personalizados
3. 📋 Configurar logs y monitoreo
4. 📋 Documentar procesos internos

### Largo Plazo

1. 🔄 Automatizar flujos completos
2. 🔄 Optimizar performance
3. 🔄 Agregar funcionalidades
4. 🔄 Capacitación continua

---

## 📈 Mejoras Futuras

### Funcionalidades Planeadas

- [ ] Visor de XML integrado
- [ ] Previsualización de PDF
- [ ] Descarga masiva mejorada
- [ ] Sincronización automática
- [ ] Dashboard de monitoreo
- [ ] Alertas automáticas
- [ ] Backup automático de archivos
- [ ] Integración con sistema de correos

---

**Versión:** 1.0.0  
**Fecha:** 13 de Octubre, 2025  
**Estado:** ✅ Producción

---

¡Scripts listos para usar! 🎉

Para comenzar, lee la [Guía Completa FileMaker](../docs/FILEMAKER_DESCARGAR_ARCHIVO.md).
