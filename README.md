# Web-App-pen-testing-app

An authorization-first assessment workspace built with Next.js, TypeScript, PostgreSQL, and Prisma.

## Run the application

This is a server-rendered app and must run on a Node.js host with PostgreSQL; GitHub Pages/static hosting cannot run its API or database.

1. Configure an HTTPS PostgreSQL database and set `DATABASE_URL`.
2. Set `PASSIVE_SCAN_ALLOWED_HOSTS` to a comma-separated exact hostname allowlist, for example `app.your-authorized-domain.example`. Only add domains you are authorized to assess.
3. For production, set `APP_BASIC_AUTH_USER` and a long random `APP_BASIC_AUTH_PASSWORD`. The built-in Basic Auth gate protects the UI and API; deploy only behind HTTPS.
4. Install and initialize:

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Open http://localhost:3000 for local development. For a production deployment use `npm run build && npm start` on a Node-compatible host. Do not expose a production instance until secrets and database access controls are configured.

## What the passive check does

For an authorized, in-scope HTTPS origin whose exact hostname is listed in `PASSIVE_SCAN_ALLOWED_HOSTS`, the app sends one `HEAD` request with redirects disabled and an eight-second timeout. It records HTTP status and selected response headers in PostgreSQL. There is no crawling, form submission, payload testing, exploitation, brute force, port scanning, or arbitrary command execution. Observations must be manually validated and are not a complete security assessment.

Assessments, assets, check results, and audit events are stored in PostgreSQL. The app requires explicit written-authorization notes and a scope confirmation when creating an engagement.
