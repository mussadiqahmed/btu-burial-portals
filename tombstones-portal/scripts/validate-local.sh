#!/bin/bash
# Pensioners Portal — local validation script
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API="${API_URL:-http://localhost:8001}"
MYSQL="${MYSQL_BIN:-/Applications/XAMPP/xamppfiles/bin/mysql}"
DB_NAME="${DB_NAME:-endless_eternity_memorials_system}"
SAMPLE_XLSX="$ROOT/deploy/sample_may_2026.xlsx"
LOG="$ROOT/validation-report.log"

exec > >(tee "$LOG") 2>&1

echo "========== PENSIONERS PORTAL LOCAL VALIDATION =========="
echo "Started: $(date)"
echo ""

pass() { echo "  PASS: $1"; }
fail() { echo "  FAIL: $1"; FAILED=1; }

FAILED=0

echo "--- 1. Backend install & build ---"
cd "$ROOT/backend"
npm install --silent
npm run build
pass "backend npm run build"

echo ""
echo "--- 2. Frontend install, tsc, build ---"
cd "$ROOT/frontend"
npm install --silent
npx tsc --noEmit
pass "frontend tsc --noEmit"
npm run build
pass "frontend npm run build"

echo ""
echo "--- 3. Database ---"
if "$MYSQL" -u root -e "SELECT 1" &>/dev/null; then
  "$MYSQL" -u root "$DB_NAME" < "$ROOT/deploy/schema.sql"
  pass "schema.sql applied"
  "$MYSQL" -u root "$DB_NAME" -e "SHOW TABLES LIKE 'pensioner%';"
  "$MYSQL" -u root "$DB_NAME" -e "SHOW CREATE TABLE pensioner_monthly_collections\G" | head -20
else
  fail "MySQL not reachable — start XAMPP MySQL or Docker MySQL first"
fi

echo ""
echo "--- 4. API health ---"
if curl -sf "$API/api/health" | grep -q '"status":"ok"'; then
  pass "GET /api/health"
else
  fail "GET /api/health (is backend running on $API?)"
fi

echo ""
echo "--- 5. Excel parse (offline) ---"
cd "$ROOT/backend"
node -e "
const fs=require('fs');
const {parsePensionersExcel}=require('./dist/modules/pensioners/excelImport.service');
const buf=fs.readFileSync('$SAMPLE_XLSX');
const rows=parsePensionersExcel(buf);
console.log('Parsed rows:', rows.length);
if(rows.length<1000) process.exit(1);
console.log('Sample:', rows[0]);
"
pass "Excel parse ($SAMPLE_XLSX)"

echo ""
echo "--- 6. API integration (requires running server + DB) ---"
for role in pension_admin pension_manager pension_analyst; do
  case $role in
    pension_admin) r=admin ;;
    pension_manager) r=manager ;;
    pension_analyst) r=data_analyst ;;
  esac
  # ensure test users exist
  if "$MYSQL" -u root "$DB_NAME" -e "SELECT 1" &>/dev/null 2>&1; then
    "$MYSQL" -u root "$DB_NAME" -e "INSERT IGNORE INTO users (username,password,role) VALUES ('$role','test123','$r');" 2>/dev/null || true
  fi
done

login() {
  curl -sf -X POST "$API/api/login" -H 'Content-Type: application/json' \
    -d "{\"username\":\"$1\",\"password\":\"test123\"}"
}

ADMIN_JSON=$(login pension_admin 2>/dev/null || echo '{}')
if echo "$ADMIN_JSON" | grep -q '"role":"admin"'; then
  pass "Admin login"
else
  fail "Admin login"
fi

echo ""
echo "Finished: $(date)"
if [ "$FAILED" = "1" ]; then
  echo "RESULT: SOME CHECKS FAILED — see $LOG"
  exit 1
fi
echo "RESULT: ALL CHECKS PASSED"
exit 0
