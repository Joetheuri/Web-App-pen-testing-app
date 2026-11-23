# Deployment

The app needs a Node.js server and PostgreSQL. It cannot run its API or save assessments on GitHub Pages.

## Railway deployment (Docker)

1. Confirm your GitHub repository contains the latest schema fix, then sign in to Railway.
2. Create a project and choose **Deploy from GitHub repo**, selecting `Joetheuri/Web-App-pen-testing-app`.
3. Add a PostgreSQL service to the Railway project.
4. In the web service Variables, configure:
   - `DATABASE_URL`: reference the PostgreSQL service's `DATABASE_URL` variable.
   - `APP_BASIC_AUTH_USER`: a unique operator username.
   - `APP_BASIC_AUTH_PASSWORD`: a long, unique, randomly generated ASCII password; keep it secret.
   - `PASSIVE_SCAN_ALLOWED_HOSTS`: comma-separated exact hostnames for authorized HTTPS assets only, without scheme or path, e.g. `portal.example.com`.
   - `EXTERNAL_WORKSTATION_URL`: optional HTTPS URL to your approved, separately managed workstation portal.
   - `NODE_ENV`: `production`.
5. Deploy with the repository `Dockerfile`. The container applies the Prisma schema at startup and listens on port 3000. Use Railway's generated HTTPS domain.
6. Confirm the deployment logs show a successful Prisma schema update and Next.js server startup. Open the domain and sign in with the Basic Auth credentials.
7. Create an authorized assessment and test only against a host you control or have written permission to assess and that is in the host allowlist.

Use persistent PostgreSQL storage and enable backups before entering real data. The current Basic Auth gate is a shared single-operator gate, not individual accounts or role-based access control. Do not expose sensitive, client, or regulated assessment data to an internet-facing instance until you add proper user identity, authorization, CSRF protections, secure evidence storage, and a reviewed backup/retention policy. Keep credentials and database URLs out of Git.

## Local Docker deployment

Copy `.env.example` to `.env`, set strong secrets and a strong `POSTGRES_PASSWORD`, then start:

```bash
docker compose up --build -d
```

Open `http://localhost:3000`. For internet-facing use, put it behind HTTPS and restrict network access.

## Passive check boundaries

The passive check is one HTTPS `HEAD` request to the exact authorized origin, with redirects disabled and a timeout. It is not a vulnerability scanner and does not crawl, send test payloads, exploit, brute-force, scan ports, or execute arbitrary tools. Check observations manually before recording findings.
