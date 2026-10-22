#!/bin/bash

# Script para actualizar la URI del cluster en todos los archivos necesarios
# Uso: ./update_cluster_uri.sh "nueva_uri_completa"

if [ -z "$1" ]; then
    echo "❌ Error: Debes proporcionar la nueva URI como parámetro"
    echo "📋 Uso: ./update_cluster_uri.sh \"mongodb+srv://usuario:password@nuevo-cluster.mongodb.net/LPCR\""
    exit 1
fi

NEW_URI="$1"
echo "🔄 Actualizando URI del cluster..."

if [ ! -f .env ]; then
    echo "No existe .env"
    exit 1
fi

# Crear backup de .env. Queda cubierto por .gitignore.
echo "💾 Creando backup de .env..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Actualizar .env sin dejar un .env.bak con la URI anterior
echo "📝 Actualizando .env..."
tmp="$(mktemp)"
if grep -q "^ATLAS_URI=" .env; then
    sed "s|^ATLAS_URI=.*|ATLAS_URI=$NEW_URI|" .env > "$tmp"
else
    cat .env > "$tmp"
    printf '\nATLAS_URI=%s\n' "$NEW_URI" >> "$tmp"
fi
mv "$tmp" .env

echo "✅ Actualización completada!"
echo ""
echo "📋 Archivo actualizado:"
echo "   - .env"
echo ""
echo "export_commands.sh lee ATLAS_URI desde .env. No guarda la URI en el repo."
echo ""
echo "🚀 Ahora puedes:"
echo "   1. Probar la conexión: npm run dev"
echo "   2. Exportar datos: ./export_commands.sh"
