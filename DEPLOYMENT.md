# Deployment

The app needs a Node.js server and PostgreSQL. It cannot run its API or save assessments on GitHub Pages.

## Railway deployment (Docker)

1. Push the `main` branch to GitHub and sign in to Railway.
2. Create a project and choose **Deploy from GitHub repo**, selecting `Joetheuri/Web-App-pen-testing-app`.
3. Add a PostgreSQL service to the Railway project.
4. In the web service Variables, configure:
   - `DATABASE_URL`: reference the PostgreSQL service's `DATABASE_URL` variable (Railway provides this reference option).
   - `APP_BASIC_AUTH_USER`: a unique operator username.
   - `APP_BASIC_AUTH_PASSWORD`: a long, unique random password; keep it secret.
   - `PASSIVE_SCAN_ALLOWED_HOSTS`: comma-separated exact hostnames for authorized HTTPS assets only, without scheme or path, e.g. `portal.example.com`.
   - `NODE_ENV`: `production`.
5. Set the web service to build using the repository `Dockerfile`. The container starts the app after applying the Prisma schema and listens on port 3000. Use Railway's generated HTTPS domain.
6. Open the public domain and sign in with the Basic Auth credentials. Create an authorized assessment and test against an allowlisted hostname only.

Use a persistent/paid PostgreSQL plan for real data; confirm backup and retention settings. Do not use demo/public hosting for sensitive engagement data. Keep credentials and database URLs out of Git.

## Local Docker deployment

Copy `.env.example` to `.env`, set strong secrets and a strong `POSTGRES_PASSWORD`, then start:

```bash
docker compose up --build -d
```

Open `http://localhost:3000`. For internet-facing use, put it behind HTTPS and restrict network access. The included app-level Basic Auth is a minimal gate; consider an identity-aware proxy or proper user authentication before sharing with a team.

## Passive check boundaries

The passive check is one HTTPS `HEAD` request to the exact authorized origin, with redirects disabled and a timeout. It is not a vulnerability scanner and does not crawl, send test payloads, exploit, brute-force, scan ports, or execute arbitrary tools. Check observations manually before recording findings.
