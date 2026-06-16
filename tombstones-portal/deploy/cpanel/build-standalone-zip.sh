#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STAGING="$(mktemp -d)"
DESKTOP="${HOME}/Desktop"

echo "Building backend..."
cd "$ROOT/backend"
npm run build

echo "Staging standalone package (no node_modules — cPanel Run NPM Install creates symlink)..."
cp -R dist "$STAGING/dist"
cp package.json package-lock.json "$STAGING/"
if [ -f .env.cpanel ]; then
  cp .env.cpanel "$STAGING/.env"
else
  cp .env.cpanel.example "$STAGING/.env"
  echo "Warning: using .env.cpanel.example — set real values on server"
fi

cd "$STAGING"
zip -rq "${DESKTOP}/tombstones-api.zip" .

echo "Building frontend..."
cd "$ROOT/frontend"
NODE_ENV=production npm run build
cd out
zip -rq "${DESKTOP}/tombstones-frontend.zip" .

rm -rf "$STAGING"

echo ""
echo "Done — on your Desktop:"
echo "  tombstones-api.zip       → Node app folder (startup: dist/app.js)"
echo "  tombstones-frontend.zip  → subdomain document root"
echo ""
echo "cPanel: do NOT upload node_modules. After extract, click Run NPM Install, then Restart."
