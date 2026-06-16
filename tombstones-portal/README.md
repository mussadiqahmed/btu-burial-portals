# BOTUBS Tombstones Portal

Monthly tombstone collection tracking for BOTUBS members. Reads member profiles from `btuburia_web`.`Members-New` and stores collection records in `btuburia_tombstones`. Uploads never create members — they only record collections matched by `PayrollNumber`.

**Production URL:** `https://tombstones.btuburial.co.bw`

## Structure

```text
tombstones-portal/
├── backend/     Express API (TypeScript → dist/app.js)
├── frontend/    Next.js static export
└── deploy/      SQL schema, sample Excel, cPanel build scripts
```

## Local development

### 1. Database

Import `deploy/tombstones-production-schema.sql` in phpMyAdmin on database `btuburia_tombstones`. Create portal users manually after import (no seed users in production schema).

For local testing with sample members: `deploy/seed_members_new_test.sql` (test database only).

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — requires access to btuburia_tombstones AND btuburia_web
npm install
npm run dev
```

API health check: `http://localhost:8002/api/health`

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

UI: `http://localhost:3000`

### 4. Test upload

Upload → select `deploy/sample_may_2026.xlsx` → choose sheet(s) → preview → confirm.

## Environment variables

### Backend (`backend/.env.example`)

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` or `production` |
| `PORT` | API port (default `8002`; omit on cPanel) |
| `TOMBSTONES_DB_*` | Portal database (`btuburia_tombstones`) |
| `BTU_WEB_DB_*` | Member source database (`btuburia_web`, read-only) |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated |

### Frontend (`frontend/.env.example`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE_PATH` | API path prefix (default `/api`) |
| `NEXT_PUBLIC_BASE_PATH` | App base path (empty for subdomain deploy) |

## Net Premium (Excel comparison)

Expected collection amounts are calculated from `Members-New` using the same logic as BTU-Web `member-profile.php`:

- **Net Premium** = `Premium` + sum of non-empty `C1Premium` … `C20Premium` (PHP `empty()` semantics)
- Upload comparison flags: match, underpaid, overpaid, missing

Do not use the legacy `deduction-details.php` formula.

## Production deployment (cPanel)

### Prerequisites

- cPanel with **Setup Node.js App**
- MySQL database `btuburia_tombstones`
- DB user with read access to `btuburia_web`.`Members-New`
- Subdomain `tombstones.btuburial.co.bw` with document root `/tombstones.btuburial.co.bw`

### Steps

1. **Database** — Import `deploy/tombstones-production-schema.sql`. Create admin users in phpMyAdmin.

2. **Build zips** — Run `deploy/cpanel/build-standalone-zip.sh`. Outputs `tombstones-api.zip` and `tombstones-frontend.zip` on your Desktop.

3. **Upload API** — Extract into `tombstones.btuburial.co.bw/`. Copy `.env.cpanel.example` to `.env` and set credentials.

4. **Node.js app** — Application root: `tombstones.btuburial.co.bw`, startup file: `dist/app.js`, Node **18 or 20**. Click **Run NPM Install**, then **Restart**. Do not upload `node_modules` in the zip.

5. **Upload frontend** — Extract `tombstones-frontend.zip` into the same folder.

6. **Verify**

   | Test | URL |
   |------|-----|
   | API | `https://tombstones.btuburial.co.bw/api/health` |
   | Login | `https://tombstones.btuburial.co.bw/login/` |

### Server `.env` example

```env
NODE_ENV=production

TOMBSTONES_DB_HOST=localhost
TOMBSTONES_DB_PORT=3306
TOMBSTONES_DB_USER=your_db_user
TOMBSTONES_DB_PASSWORD=your_db_password
TOMBSTONES_DB_NAME=btuburia_tombstones

BTU_WEB_DB_HOST=localhost
BTU_WEB_DB_PORT=3306
BTU_WEB_DB_USER=your_db_user
BTU_WEB_DB_PASSWORD=your_db_password
BTU_WEB_DB_NAME=btuburia_web

CORS_ORIGIN=https://tombstones.btuburial.co.bw,http://tombstones.btuburial.co.bw
```

## Architecture

- **Dual database pools** — portal DB for collections/users; BTU web DB for `Members-New` (read-only)
- **No `tombstone_members` table** — members always come from `Members-New`
- **Multi-sheet Excel** — select sheets, preview rows, confirm import per sheet
- **Auth** — same pattern as Pensioners Portal (`x-user-role` header)
- **Roles** — `admin`, `manager`, `data_analyst` (full); others limited

## API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Login |
| GET | `/api/tombstones/members` | Member list |
| GET | `/api/tombstones/members/:payroll` | Member profile + payment history |
| POST | `/api/tombstones/upload/*` | Multi-sheet Excel upload |
| GET | `/api/tombstones/reports/*` | Reports |
| GET | `/api/tombstones/dashboard` | Dashboard KPIs |
