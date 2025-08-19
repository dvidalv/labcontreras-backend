#!/bin/bash

# Script para actualizar las credenciales correctas del nuevo cluster

echo "🔧 Actualizando credenciales de ATLAS_URI_2..."

# Hacer backup del .env actual
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Actualizar ATLAS_URI_2 con las credenciales correctas
sed -i.bak 's|ATLAS_URI_2=.*|ATLAS_URI_2=mongodb+srv://dvidalv:KeibbxUKbCwOxZWD@cluster1.hycui.mongodb.net/LPCR?retryWrites=true&w=majority&appName=Cluster1|' .env

echo "✅ ATLAS_URI_2 actualizada con credenciales funcionales"
echo "📋 Nueva configuración:"
grep ATLAS_URI_2 .env
echo ""
echo "🚀 Ahora puedes probar: npm run dev"
