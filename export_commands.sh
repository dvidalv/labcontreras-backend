#!/bin/bash

# MongoDB Export Commands
# Ejecutar cuando el cluster esté activo (no "Degraded")

# Variables de configuración. La URI se lee del entorno o de .env, nunca del repo.
read_env_value() {
  local key="$1"
  local line
  line="$(grep -E "^${key}=" .env 2>/dev/null | tail -1 || true)"
  printf '%s' "${line#*=}"
}

URI="${ATLAS_URI:-${MONGODB_URI:-}}"
if [ -z "$URI" ] && [ -f .env ]; then
  URI="$(read_env_value ATLAS_URI)"
  if [ -z "$URI" ]; then
    URI="$(read_env_value MONGODB_URI)"
  fi
fi

if [ -z "$URI" ]; then
  echo "Define ATLAS_URI o MONGODB_URI en el entorno o en .env"
  exit 1
fi

OUTPUT_DIR="./exports"

# Crear directorio de exports si no existe
mkdir -p $OUTPUT_DIR

echo "🚀 Iniciando exportación de colecciones..."

# Exportar colección de médicos
echo "📋 Exportando médicos..."
mongoexport --uri "$URI" --collection medicos --type json --out "$OUTPUT_DIR/medicos.json"

# Exportar colección de usuarios
echo "👥 Exportando usuarios..."
mongoexport --uri "$URI" --collection users --type json --out "$OUTPUT_DIR/users.json"

# Exportar colección de comprobantes
echo "🧾 Exportando comprobantes..."
mongoexport --uri "$URI" --collection comprobantes --type json --out "$OUTPUT_DIR/comprobantes.json"

# Exportar colección de sugerencias
echo "💡 Exportando sugerencias..."
mongoexport --uri "$URI" --collection sugerencias --type json --out "$OUTPUT_DIR/sugerencias.json"

# Exportar colección de sugerenciasEmpresas
echo "🏢 Exportando sugerenciasEmpresas..."
mongoexport --uri "$URI" --collection sugerenciasEmpresas --type json --out "$OUTPUT_DIR/sugerenciasEmpresas.json"

# Exportar colección de sugerenciasMedicos
echo "👨‍⚕️ Exportando sugerenciasMedicos..."
mongoexport --uri "$URI" --collection sugerenciasMedicos --type json --out "$OUTPUT_DIR/sugerenciasMedicos.json"

# Exportar colección de sugerenciasPacientes
echo "🤒 Exportando sugerenciasPacientes..."
mongoexport --uri "$URI" --collection sugerenciasPacientes --type json --out "$OUTPUT_DIR/sugerenciasPacientes.json"

# Exportar colección de medicosWhiteList
echo "✅ Exportando medicosWhiteList..."
mongoexport --uri "$URI" --collection medicosWhiteList --type json --out "$OUTPUT_DIR/medicosWhiteList.json"

# Exportar colección de fingerprints
echo "🔒 Exportando fingerprints..."
mongoexport --uri "$URI" --collection fingerprints --type json --out "$OUTPUT_DIR/fingerprints.json"

# Exportar colección de cards
echo "💳 Exportando cards..."
mongoexport --uri "$URI" --collection cards --type json --out "$OUTPUT_DIR/cards.json"

echo "✅ Exportación completada! Archivos guardados en $OUTPUT_DIR"

# Comandos adicionales con filtros específicos
echo ""
echo "📌 Comandos adicionales disponibles:"
echo ""
echo "# Exportar solo médicos activos:"
echo "mongoexport --uri \"$URI\" --collection medicos --query '{\"active\": true}' --type json --out \"$OUTPUT_DIR/medicos_activos.json\""
echo ""
echo "# Exportar en formato CSV (ejemplo con médicos):"
echo "mongoexport --uri \"$URI\" --collection medicos --type csv --out \"$OUTPUT_DIR/medicos.csv\" --fields \"nombre,especialidad,email,telefono\""
echo ""
echo "# Exportar con límite de documentos:"
echo "mongoexport --uri \"$URI\" --collection comprobantes --limit 100 --type json --out \"$OUTPUT_DIR/comprobantes_sample.json\""
echo ""
echo "# Exportar documentos desde una fecha específica:"
echo "mongoexport --uri \"$URI\" --collection comprobantes --query '{\"createdAt\": {\"\$gte\": {\"\$date\": \"2024-01-01T00:00:00.000Z\"}}}' --type json --out \"$OUTPUT_DIR/comprobantes_2024.json\""
