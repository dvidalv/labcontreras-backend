# QR DGII - Guía de Resolución de Problemas

## 🚨 Errores Comunes y Soluciones

### 1. "No fue encontrada la factura (e-CF)"

**Síntomas:**

- El QR se genera correctamente
- Al escanear muestra mensaje de DGII: "No fue encontrada la factura"

**Causas posibles:**

#### A) Falta la hora en FechaFirma

```
❌ Incorrecto: FechaFirma=08-09-2025
✅ Correcto: FechaFirma=08-09-2025%2023:23:53
```

**Solución:**

```javascript
// En FileMaker, asegurar que fechaFirma incluya hora:
"fechaFirma": "08-09-2025 23:23:53"  // No solo "08-09-2025"
```

#### B) RncComprador faltante o vacío

```
❌ Incorrecto: RncComprador=
✅ Correcto: RncComprador=131695426
```

**Solución:**

```javascript
// Verificar que FileMaker envíe el RNC del comprador:
"rncComprador": PACIENTES_FACTURAS::RNC
```

#### C) Monto incorrecto

```
❌ Incorrecto: MontoTotal=0.00
✅ Correcto: MontoTotal=4000.00
```

#### D) Factura no procesada en DGII

- La factura puede estar pendiente de procesamiento
- Verificar estatus con `/consultar-estatus`

### 2. "Error al generar código QR: version cannot contain this amount of data"

**Causa:** URL demasiado larga para QR versión 8

**Solución aplicada:**

```javascript
const opcionesQR = {
  // No especificar version - se calcula automáticamente
  errorCorrectionLevel: 'M',
  // ... resto de opciones
};
```

### 3. FileMaker no envía todos los campos

**Síntomas en logs del servidor:**

```
rncComprador: undefined
fechaFirma: undefined
```

**Solución:**
Verificar desestructuración en el endpoint:

```javascript
const {
  rnc,
  rncComprador, // ✅ Debe estar incluido
  ncf,
  codigo,
  fecha,
  fechaFirma, // ✅ Debe estar incluido
  monto,
  formato = 'png',
  tamaño = 300,
} = req.body;
```

## 🔍 Debugging

### 1. Activar logs detallados

En `controllers/comprobantes.js`:

```javascript
console.log('🔍 === DEBUG generarCodigoQR ===');
console.log('req.body completo:', JSON.stringify(req.body, null, 2));
console.log('🔍 Parámetros extraídos:');
console.log('rnc:', rnc);
console.log('rncComprador:', rncComprador);
console.log('fechaFirma:', fechaFirma);
console.log('🎯 URL generada:', urlParaQR);
```

### 2. Verificar URL manualmente

Copiar la URL del log y probarla directamente en el navegador:

```
https://ecf.dgii.gov.do/testecf/ConsultaTimbre?RncEmisor=130085765&RncComprador=131695426&ENCF=E310000000131&FechaEmision=08-09-2025&MontoTotal=4000.00&FechaFirma=08-09-2025%2023:23:53&CodigoSeguridad=ZJPGsn
```

### 3. Comparar con URL de TheFactory

Usar la URL que genera TheFactory como referencia:

```javascript
// En la respuesta de envío de factura:
data.urlQR; // URL generada por nuestro sistema
// vs
// URL que aparece en el panel de TheFactory
```

## 📋 Checklist de Verificación

### Antes de generar QR:

- [ ] ✅ Factura enviada exitosamente a TheFactory HKA
- [ ] ✅ Estado de factura = "Aceptado" en DGII
- [ ] ✅ Todos los datos están disponibles en FileMaker

### Al generar QR:

- [ ] ✅ `rnc` (emisor) presente
- [ ] ✅ `rncComprador` presente y no vacío
- [ ] ✅ `ncf` correcto
- [ ] ✅ `codigo` de seguridad presente
- [ ] ✅ `fecha` en formato DD-MM-YYYY
- [ ] ✅ `fechaFirma` con hora (DD-MM-YYYY HH:MM:SS)
- [ ] ✅ `monto` decimal con 2 decimales

### Después de generar QR:

- [ ] ✅ URL generada incluye todos los parámetros
- [ ] ✅ FechaFirma incluye %20 (espacio codificado)
- [ ] ✅ QR se genera sin errores
- [ ] ✅ Al escanear, redirige a DGII
- [ ] ✅ DGII muestra información completa

## 🔧 Herramientas de Debugging

### 1. Endpoint de consulta de estatus

```
POST /comprobantes/consultar-estatus
{
  "ncf": "E310000000131"
}
```

### 2. QR Code reader online

Usar cualquier lector QR online para verificar la URL contenida

### 3. URL decoder

Para verificar que %20 se decodifica correctamente a espacio

### 4. DGII Test Environment

Usar siempre el ambiente de test primero:
`https://ecf.dgii.gov.do/testecf/ConsultaTimbre`

## 📞 Escalación

Si después de seguir esta guía el problema persiste:

1. **Recopilar información:**

   - Logs completos del servidor
   - JSON enviado desde FileMaker
   - URL generada
   - Respuesta de DGII

2. **Verificar con TheFactory HKA:**

   - ¿La factura aparece como procesada en su sistema?
   - ¿Qué URL genera su panel?

3. **Contactar soporte DGII:**
   - Solo si la URL de TheFactory tampoco funciona
   - Proporcionar NCF específico

---

**Última actualización:** $(date)
**Mantenido por:** Equipo de Desarrollo
