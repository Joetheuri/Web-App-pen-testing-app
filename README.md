# Web-App-pen-testing-app

An authorization-first workspace for planning and documenting web application security assessments. Built with Next.js, TypeScript, and a PostgreSQL-ready Prisma schema.

## Included

- Assessment dashboard and workflow status
- Engagement, authorization, scope, and exclusions data model
- Asset inventory and findings schema
- Evidence, confidence, remediation, and retest lifecycle fields
- Audit event model
- Demo dashboard data for the initial UI

This version is a workspace foundation, not a scanner. It does not execute scans, exploits, brute-force attempts, or commands. Only assess systems you own or have explicit permission to test.

## Run locally

Requirements: Node.js 20+ and PostgreSQL 16+.

```bash
cp .env.example .env.local
# Set DATABASE_URL in .env.local
npm install
npm run db:generate
npm run db:push
npm run dev
```

Open http://localhost:3000.

## Database

Prisma models are in `prisma/schema.prisma`. `npm run db:push` applies the schema to your configured database. The UI currently uses clearly labeled sample data; connect persistence only after adding authentication and per-engagement access controls before hosting it for multiple users.

## Scripts

- `npm run dev` — local development server
- `npm run build` — production build
- `npm run db:generate` — generate Prisma Client
- `npm run db:push` — apply schema to the configured PostgreSQL database
