#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STAGING="$(mktemp -d)"

echo "Building backend..."
cd "$ROOT/backend"
npm run build

echo "Staging standalone package..."
cp -R dist "$STAGING/dist"
cp package.json package-lock.json "$STAGING/"
cp .env.cpanel "$STAGING/.env"

echo "Installing production node_modules..."
cd "$STAGING"
npm install --omit=dev

cd "$STAGING"
zip -rq /Users/mac/Desktop/pensioners-api.zip .

echo "Building frontend..."
cd "$ROOT/frontend"
NODE_ENV=production npm run build
cd out
zip -rq /Users/mac/Desktop/pensioners-frontend.zip .

rm -rf "$STAGING"

echo ""
echo "Done — on your Desktop:"
echo "  pensioners-api.zip       → upload to pensioners.btuburial.co.bw Node app folder"
echo "  pensioners-frontend.zip  → upload to pensioners.btuburial.co.bw document root (static)"
