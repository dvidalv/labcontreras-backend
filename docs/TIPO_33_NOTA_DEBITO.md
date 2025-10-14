# 📋 Nota de Débito (Tipo 33) - Especificaciones

## 🎯 **¿Qué es una Nota de Débito?**

Una **Nota de Débito (Tipo 33)** es un documento fiscal que se emite para **aumentar** el valor de una factura previamente emitida. Se usa cuando:

- ✅ Se deben cobrar servicios adicionales no incluidos en la factura original
- ✅ Se aplican recargos por servicios especiales
- ✅ Se corrigen errores que resultan en un monto mayor
- ✅ Se agregan intereses por mora o penalidades

## 🔧 **Diferencias con otros tipos:**

| Aspecto                   | **Tipo 31** (Factura) | **Tipo 33** (Nota Débito) | **Tipo 34** (Nota Crédito) |
| ------------------------- | --------------------- | ------------------------- | -------------------------- |
| **Propósito**             | Facturación original  | Aumentar monto            | Disminuir monto            |
| **InformacionReferencia** | ❌ No requiere        | ✅ **OBLIGATORIA**        | ✅ **OBLIGATORIA**         |
| **TipoIngresos**          | "01"                  | **"03"** (específico)     | "01"                       |
| **TablaFormasPago**       | ✅ Incluye            | ✅ **Incluye**            | ❌ No incluye              |
| **RNC Comprador**         | ✅ Obligatorio        | ✅ **Obligatorio**        | ✅ Obligatorio             |

## 📋 **Campos Obligatorios para Tipo 33:**

### **1. Sección `factura`:**

```json
{
  "factura": {
    "ncf": "E330000000001", // ✅ OBLIGATORIO - NCF tipo 33
    "tipo": "33", // ✅ OBLIGATORIO - Debe ser "33"
    "fecha": "15-09-2025", // ✅ OBLIGATORIO
    "total": "15000.00", // ✅ OBLIGATORIO
    "id": "ND-001" // ✅ RECOMENDADO
  }
}
```

### **2. Sección `modificacion` (OBLIGATORIA):**

```json
{
  "modificacion": {
    "CodigoModificacion": "01", // ✅ OBLIGATORIO - Código 1-6
    "FechaNCFModificado": "10-09-2025", // ✅ OBLIGATORIO - Fecha factura original
    "NCFModificado": "E310000000098", // ✅ OBLIGATORIO - NCF factura original
    "RazonModificacion": "Descripción del cargo adicional" // ✅ OBLIGATORIO
  }
}
```

### **3. Sección `comprador` (OBLIGATORIA):**

```json
{
  "comprador": {
    "rnc": "131880681", // ✅ OBLIGATORIO - NO puede ser null
    "nombre": "Empresa Cliente", // ✅ OBLIGATORIO
    "correo": "cliente@empresa.com" // ✅ RECOMENDADO
  }
}
```

## 🔢 **Códigos de Modificación para Tipo 33:**

| Código | Descripción                   | Uso Común                   |
| ------ | ----------------------------- | --------------------------- |
| **01** | Texto incorrecto              | Corrección de descripciones |
| **02** | Valor incorrecto              | Ajuste de montos            |
| **03** | Fecha incorrecta              | Corrección de fechas        |
| **04** | Referencia a otros documentos | Referencias adicionales     |
| **05** | Otros                         | Casos especiales            |
| **06** | Ajuste de precio              | Cambios de precios          |

## 📊 **Estructura JSON Completa (FileMaker → API):**

```json
{
  "comprador": {
    "correo": "cliente@empresa.com",
    "nombre": "Empresa Cliente S.A.",
    "rnc": "131880681",
    "direccion": "Calle Principal No. 123",
    "municipio": "010100",
    "provincia": "010000"
  },
  "emisor": {
    "correo": "informacion@contrerasrobledo.com.do",
    "direccion": "Av. Juan Pablo Duarte No. 176",
    "razonSocial": "Clínica Universitaria Unión Médica Torre A",
    "rnc": "130085765",
    "telefono": ["809-580-1429"]
  },
  "factura": {
    "fecha": "15-09-2025",
    "fechaVencNCF": "31/12/2025",
    "id": "ND-001",
    "ncf": "E330000000001",
    "tipo": "33",
    "total": "15000.00"
  },
  "items": [
    {
      "nombre": "Cargo adicional por servicios especiales",
      "precio": "10000.00"
    },
    {
      "nombre": "Recargo por procesamiento urgente",
      "precio": "5000.00"
    }
  ],
  "modificacion": {
    "CodigoModificacion": "01",
    "FechaNCFModificado": "10-09-2025",
    "NCFModificado": "E310000000098",
    "RazonModificacion": "Cargo adicional por servicios no incluidos en la factura original"
  }
}
```

## 🚀 **Flujo de Trabajo:**

1. **📋 FileMaker prepara datos** con estructura simplificada
2. **🔄 API transforma** a formato TheFactoryHKA
3. **📤 Envío a DGII** vía TheFactoryHKA
4. **📱 Generación QR** automática tras aprobación
5. **✅ Respuesta** con estatus y QR

## ⚠️ **Validaciones Específicas:**

- ✅ **NCF debe empezar con "E33"**
- ✅ **Debe referenciar factura original válida**
- ✅ **Fecha de modificación debe ser posterior a la original**
- ✅ **RNC comprador es obligatorio** (no es consumidor final)
- ✅ **Monto debe ser positivo** (es un cargo adicional)

## 🔗 **Endpoints Relacionados:**

- `POST /comprobantes/enviar-electronica` - Enviar Nota de Débito
- `POST /comprobantes/consultar-estatus` - Consultar estado
- `POST /comprobantes/generar-qr` - Generar QR independiente

## 📝 **Ejemplo de Respuesta Exitosa:**

```json
{
  "status": "success",
  "message": "Factura electrónica enviada exitosamente",
  "data": {
    "ncfGenerado": "E330000000001",
    "codigoSeguridad": "ABC123",
    "fechaFirma": "15-09-2025 14:30:45",
    "urlQR": "https://ecf.dgii.gov.do/testecf/ConsultaTimbre?RncEmisor=130085765&RncComprador=131880681&ENCF=E330000000001&...",
    "estatusInicial": {
      "consultaExitosa": true,
      "datosEstatus": {
        "codigo": 0,
        "mensaje": "Documento procesado correctamente"
      }
    }
  }
}
```
