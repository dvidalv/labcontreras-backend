#!/bin/bash

# Actualiza ATLAS_URI_2 en .env.
# Uso: ./fix_env.sh "mongodb+srv://usuario:password@cluster.mongodb.net/LPCR"
#   o: ATLAS_URI_2="mongodb+srv://..." ./fix_env.sh

set -euo pipefail

NEW_URI="${1:-${ATLAS_URI_2:-}}"

if [ -z "$NEW_URI" ]; then
  echo "Pasa la URI como argumento o en ATLAS_URI_2."
  echo "Uso: ./fix_env.sh \"mongodb+srv://usuario:password@cluster.mongodb.net/LPCR\""
  exit 1
fi

if [ ! -f .env ]; then
  echo "No existe .env"
  exit 1
fi

cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"

tmp="$(mktemp)"
if grep -q '^ATLAS_URI_2=' .env; then
  sed "s|^ATLAS_URI_2=.*|ATLAS_URI_2=${NEW_URI}|" .env > "$tmp"
else
  cat .env > "$tmp"
  printf '\nATLAS_URI_2=%s\n' "$NEW_URI" >> "$tmp"
fi
mv "$tmp" .env

echo "ATLAS_URI_2 actualizada en .env"
echo "El respaldo .env.backup.* queda ignorado por git. No lo subas."
