#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
STAGING="$(mktemp -d)"

echo "Building backend..."
cd "$ROOT"
npm run build

mkdir -p "$STAGING/database"
cp -r dist package.json package-lock.json "$STAGING/"
cp database/migration_v2_enhancements.sql "$STAGING/database/"
cp .env.example "$STAGING/.env.example"

# Never ship .env — it overwrites live credentials on cPanel extract.
cd "$STAGING"
rm -f "$ROOT/backend_cpanel.zip" "$ROOT/../deploy/backend_cpanel.zip" "$HOME/Desktop/backend_cpanel.zip"
zip -rq "$ROOT/backend_cpanel.zip" .
cp "$ROOT/backend_cpanel.zip" "$ROOT/../deploy/backend_cpanel.zip"
cp "$ROOT/backend_cpanel.zip" "$HOME/Desktop/backend_cpanel.zip"
rm -rf "$STAGING"

echo "Done: $ROOT/backend_cpanel.zip (no .env included — your server .env is preserved)"
