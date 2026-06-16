# Endless Eternity Memorials — Operations Portal

Memorial operations system for **EEM** (Endless Eternity Memorials): orders, inventory, production, design types, marketing, quotations, and reports.

**Production URLs:** `https://eem.co.bw` (frontend) · `https://api.eem.co.bw` (API)

## Structure

```text
Endless-Portal/
├── backend/     Express API (TypeScript)
├── frontend/    Next.js UI
└── deploy/      SQL migrations and deployment assets
```

## Local development

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API: `http://localhost:8000`

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

UI: `http://localhost:3000`

## Environment variables

### Backend (`backend/.env.example`)

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `8000`) |
| `NODE_ENV` | `development` or `production` |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` | MySQL connection |
| `SMTP_*` | Email for quotation PDFs (production only) |

### Frontend (`frontend/.env.example`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_OPERATIONS_TOOL_SHARE_URL` | OneDrive share link (optional) |
| `NEXT_PUBLIC_OPERATIONS_TOOL_EMBED_URL` | OneDrive embed URL for operations tool iframe (optional) |

## Production deployment (cPanel)

1. Build backend: `npm run build` → upload `dist/`, `package.json`, `package-lock.json`, `.env`
2. Build frontend: `npm run build` → upload `out/` to web root
3. Import SQL from `deploy/production_import.sql` or run migrations in `deploy/`
4. Restart Node.js application

See `build_cpanel_zip.sh` (backend) and `build_for_cpanel.sh` (frontend) for packaging scripts.

## Modules

- **Orders** — design-based ordering with automatic stock deduction
- **Inventory** — materials and stock levels
- **Production** — production workflow tracking
- **Design types** — tombstone design catalogue with pricing
- **Marketing** — leads, quotations, documents
- **Reports** — operational reporting
- **Follow-ups** — client follow-up tracking
