# BOTUBS Pensioners Portal

Monthly pension collection tracking for BOTUBS members. Reads member profiles from `btuburia_web`.`Members-New` and stores collection records in `btuburia_pensioner`.

**Production URL:** `https://pensioners.btuburial.co.bw`

## Structure

```text
pensioners-portal/
├── backend/     Express API (TypeScript → dist/app.js)
├── frontend/    Next.js static export
└── deploy/      SQL schema, sample Excel, cPanel build scripts
```

## Local development

### 1. Database

Import `deploy/schema.sql` in phpMyAdmin, or let the API auto-create tables on first start.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials
npm install
npm run dev
```

API health check: `http://localhost:8001/api/health`

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

UI: `http://localhost:3000` — log in with a user that has role `admin`, `manager`, or `data_analyst`.

### 4. Test upload

Upload → select `deploy/sample_may_2026.xlsx` → Month **May**, Year **2026**.

## Environment variables

### Backend (`backend/.env.example`)

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` or `production` |
| `PORT` | API port (default `8001`; omit on cPanel) |
| `PENSIONERS_DB_HOST` | MySQL host |
| `PENSIONERS_DB_PORT` | MySQL port (default `3306`) |
| `PENSIONERS_DB_USER` | Database user |
| `PENSIONERS_DB_PASSWORD` | Database password |
| `PENSIONERS_DB_NAME` | `btuburia_pensioner` |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated |

### Frontend (`frontend/.env.example`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE_PATH` | API path prefix (default `/api`) |
| `NEXT_PUBLIC_BASE_PATH` | App base path (empty for subdomain deploy) |

## Production deployment (cPanel)

### Prerequisites

- cPanel with **Setup Node.js App**
- MySQL database `btuburia_pensioner`
- Subdomain `pensioners.btuburial.co.bw` with document root `/pensioners.btuburial.co.bw`

### Steps

1. **Database** — Import `deploy/production_setup.sql` via phpMyAdmin. Create admin users manually after import.

2. **Build zips** — Run `deploy/cpanel/build-standalone-zip.sh`. Outputs `pensioners-api.zip` and `pensioners-frontend.zip` on your Desktop.

3. **Upload API** — Extract `pensioners-api.zip` into `pensioners.btuburial.co.bw/`. Create `.env` from `.env.example` with production credentials.

4. **Node.js app** — Application root: `pensioners.btuburial.co.bw`, startup file: `dist/app.js`, Node 18 or 20. Click **Run NPM Install**, then **Restart**.

5. **Upload frontend** — Extract `pensioners-frontend.zip` into the same folder.

6. **Verify**

   | Test | URL |
   |------|-----|
   | API | `https://pensioners.btuburial.co.bw/api/health` |
   | Login | `https://pensioners.btuburial.co.bw/login/` |

### Server `.env` example

```env
NODE_ENV=production
PENSIONERS_DB_HOST=localhost
PENSIONERS_DB_PORT=3306
PENSIONERS_DB_USER=your_db_user
PENSIONERS_DB_PASSWORD=your_db_password
PENSIONERS_DB_NAME=btuburia_pensioner
CORS_ORIGIN=https://pensioners.btuburial.co.bw,http://pensioners.btuburial.co.bw
```

Do not set `PORT` on cPanel — it is assigned automatically.

## Architecture

- **Express API** — `backend/src/app.ts` mounts routes under `/api`
- **Auth** — `POST /api/auth/login` returns user role; frontend sends `x-user-role` header on subsequent requests
- **Excel import** — Multi-sheet workbook upload with preview and batch confirmation
- **Reports** — Monthly collections, missing payments, upload history, inactive members
- **Roles** — `admin`, `manager`, `data_analyst` (full access); `employee`, `sales`, `marketing` (limited)

## API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Login |
| GET | `/api/pensioners` | Member list |
| GET | `/api/pensioners/:payroll` | Member profile |
| POST | `/api/pensioners/upload/*` | Excel upload flow |
| GET | `/api/reports/*` | Reports |
| GET | `/api/dashboard` | Dashboard KPIs |
