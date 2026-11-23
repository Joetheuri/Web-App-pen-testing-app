# Web-App-pen-testing-app

An authorization-first assessment workspace built with Next.js, TypeScript, PostgreSQL, and Prisma.

## Assessment tools, reports, and evidence

Open `/tools` to record tester-operated tool activity, import a vendor-neutral JSON findings report, add findings/evidence notes, and optionally open a separately managed workstation portal. The app records workflow information but does not execute tools, commands, exploits, or brute-force attempts.

Report import accepts JSON up to 1 MB with at most 100 findings. Example format:

```json
{
  "tool": "OWASP ZAP",
  "findings": [
    {
      "title": "Example observation",
      "description": "A tester-reviewed description of the observation.",
      "severity": "LOW",
      "assetUrl": "https://portal.example.com",
      "impact": "Potential impact",
      "remediation": "Suggested remediation"
    }
  ]
}
```

`assetUrl`, when provided, must match an in-scope asset already recorded for that assessment. Imported items are unverified observations. Redact secrets and personal information before recording or importing evidence.

## Run the application

This app requires a Node.js server and PostgreSQL; GitHub Pages/static hosting cannot run its API or store records.

1. Configure PostgreSQL and `DATABASE_URL`.
2. Set `PASSIVE_SCAN_ALLOWED_HOSTS` to exact authorized hostnames, comma-separated.
3. Configure `APP_BASIC_AUTH_USER` and a long random `APP_BASIC_AUTH_PASSWORD` before production use.
4. Optionally set `EXTERNAL_WORKSTATION_URL` to an approved HTTPS workstation portal.
5. Install and initialize:

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Open http://localhost:3000. For deployment, see `DEPLOYMENT.md`.

## Passive check boundaries

The passive check is one HTTPS `HEAD` request to the exact authorized origin, with redirects disabled and a timeout. It is not a vulnerability scanner and does not crawl, submit forms, exploit, brute-force, scan ports, or execute arbitrary tools. Results require manual review.
