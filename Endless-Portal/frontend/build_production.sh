#!/bin/bash
# Production frontend build — MUST NOT use .env.local (it overrides production API URL)
set -e
cd "$(dirname "$0")"
LOCAL_ENV=".env.local"
BAK=".env.local.build-bak"

if [ -f "$LOCAL_ENV" ]; then
  echo "Temporarily moving $LOCAL_ENV aside (it forces localhost:8000 in builds)"
  mv "$LOCAL_ENV" "$BAK"
fi

NODE_ENV=production npm run build

if [ -f "$BAK" ]; then
  mv "$BAK" "$LOCAL_ENV"
fi

if grep -rq "localhost:8000" out/_next/static/chunks/app/dashboard/orders 2>/dev/null; then
  echo "ERROR: Build still contains localhost:8000 — fix .env.production"
  exit 1
fi
echo "OK: Production build uses $(grep -roh 'https://api[^\"'\'' ]*' out/_next/static/chunks/app/dashboard/orders | head -1)"