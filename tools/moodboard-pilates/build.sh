#!/bin/sh
# Reconstruit public/moodboard-pilates/ à partir de ce dossier.
# Première fois : npm install. Puis : npm run build (ou npm run textures pour régénérer aussi les textures).
set -e
cd "$(dirname "$0")"
OUT=../../public/moodboard-pilates
mkdir -p "$OUT/tex"
if [ "$1" = "--textures" ]; then python3 -I textures.py "$OUT/tex"; fi
npx esbuild src/main.js --bundle --minify --format=iife --target=es2020 \
  --alias:three/addons=three/examples/jsm --outfile="$OUT/app.js" --log-level=warning
python3 -I assemble.py page.html ../../public/fonts "$OUT/index.html"
