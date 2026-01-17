#!/bin/bash
set -e

PROD_URL="${1:-https://canvas.devosurf.dev}"
BUILD_DIR="dist"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/src" "$BUILD_DIR/icons"

cp manifest.json "$BUILD_DIR/"
cp src/content.css "$BUILD_DIR/src/"
cp icons/* "$BUILD_DIR/icons/" 2>/dev/null || true

sed "s|http://localhost:3000|$PROD_URL|g" src/content.js > "$BUILD_DIR/src/content.js"
sed "s|http://localhost:3000|$PROD_URL|g" src/background.js > "$BUILD_DIR/src/background.js"

echo "Built extension with server URL: $PROD_URL"
echo "Load unpacked from: extension/$BUILD_DIR"
