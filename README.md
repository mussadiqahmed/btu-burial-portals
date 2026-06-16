# BTU Burial Portals

Production-ready web portals for **BOTUBS** (Burial Society) — pensioners and tombstones collection tracking.

| Portal | Subdomain | Database |
|--------|-----------|----------|
| [Pensioners Portal](./pensioners-portal/) | `pensioners.btuburial.co.bw` | `btuburia_pensioner` |
| [Tombstones Portal](./tombstones-portal/) | `tombstones.btuburial.co.bw` | `btuburia_tombstones` |
| [Endless Portal](./Endless-Portal/) | `eem.co.bw` / `api.eem.co.bw` | `endlesse_website` |

Both portals share the same architecture: **Next.js** static frontend + **Node.js/Express** API on cPanel, with member data read from `btuburia_web`.`Members-New`.

## Repository structure

```text
btu-burial-portals/
├── pensioners-portal/
│   ├── backend/          Express API
│   ├── frontend/         Next.js UI
│   └── deploy/           SQL schemas & cPanel build scripts
└── tombstones-portal/
    ├── backend/
    ├── frontend/
    └── deploy/
└── Endless-Portal/
    ├── backend/
    ├── frontend/
    └── deploy/
```

## Quick start (local)

Each portal is independent. See the portal README for setup:

- [Pensioners Portal — README](./pensioners-portal/README.md)
- [Tombstones Portal — README](./tombstones-portal/README.md)
- [Endless Portal — README](./Endless-Portal/README.md)

## Production deployment

Both portals deploy to **cPanel** as standalone Node.js applications on their own subdomains:

1. Create subdomain with document root matching the subdomain folder (e.g. `pensioners.btuburial.co.bw`)
2. Import the production SQL schema from `deploy/`
3. Upload the API zip → **Run NPM Install** → **Restart**
4. Upload the frontend static export to the same folder
5. Configure `.env` on the server (see each portal's `.env.example`)

Build deployment zips:

```bash
# Pensioners
pensioners-portal/deploy/cpanel/build-standalone-zip.sh

# Tombstones
tombstones-portal/deploy/cpanel/build-standalone-zip.sh
```

## Authentication

Both portals use the same pattern as the legacy BTU system: plain-text passwords in the `users` table and an `x-user-role` request header after login. No JWT or OAuth.

## License

Proprietary — BOTUBS / BTU Burial Society.
