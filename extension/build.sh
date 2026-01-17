#!/bin/bash
set -e

PROD_URL="${1:-https://canvas.devosurf.dev}"
BROWSER="${2:-chrome}"

if [ "$BROWSER" = "firefox" ]; then
  BUILD_DIR="dist-firefox"
  MANIFEST="manifest.firefox.json"
else
  BUILD_DIR="dist-chrome"
  MANIFEST="manifest.json"
fi

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/src" "$BUILD_DIR/icons"

cp "$MANIFEST" "$BUILD_DIR/manifest.json"
cp src/content.css "$BUILD_DIR/src/"
cp icons/* "$BUILD_DIR/icons/" 2>/dev/null || true

sed "s|http://localhost:3000|$PROD_URL|g" src/content.js > "$BUILD_DIR/src/content.js"
sed "s|http://localhost:3000|$PROD_URL|g" src/background.js > "$BUILD_DIR/src/background.js"

echo "Built $BROWSER extension with server URL: $PROD_URL"
echo "Load unpacked from: extension/$BUILD_DIR"
