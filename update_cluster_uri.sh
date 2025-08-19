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

# Crear backup de archivos originales
echo "💾 Creando backups..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
cp export_commands.sh export_commands.sh.backup.$(date +%Y%m%d_%H%M%S)

# Actualizar .env
echo "📝 Actualizando .env..."
if grep -q "ATLAS_URI=" .env; then
    # Reemplazar URI existente
    sed -i.bak "s|ATLAS_URI=.*|ATLAS_URI=$NEW_URI|" .env
else
    # Agregar nueva URI
    echo "ATLAS_URI=$NEW_URI" >> .env
fi

# Actualizar export_commands.sh
echo "📝 Actualizando export_commands.sh..."
sed -i.bak "s|URI=\".*\"|URI=\"$NEW_URI\"|" export_commands.sh

echo "✅ Actualización completada!"
echo ""
echo "📋 Archivos actualizados:"
echo "   - .env"
echo "   - export_commands.sh"
echo ""
echo "💾 Backups creados:"
echo "   - .env.backup.*"
echo "   - export_commands.sh.backup.*"
echo ""
echo "🚀 Ahora puedes:"
echo "   1. Probar la conexión: npm run dev"
echo "   2. Exportar datos: ./export_commands.sh"
echo ""
echo "🔗 Nueva URI configurada:"
echo "   $NEW_URI"
