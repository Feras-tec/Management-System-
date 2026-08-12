# Business Management System

React and Fastify business-management application for automotive services. It includes a public service catalogue and booking flow plus an authenticated administration area for bookings, customers, products and inventory, sales and payments, employees, reports, and business settings.

## Architecture

- Frontend: React 19, TypeScript, Vite, TanStack Router/Query/Form, Zod, Clerk, Tailwind/DaisyUI, Framer Motion.
- Backend: Fastify, TypeScript, Clerk authentication and role authorization.
- Persistence: PostgreSQL with Prisma migrations and business-scoped records.
- Default local URLs: `http://localhost:5173` and `http://127.0.0.1:3001`.

## Prerequisites

- Node.js 20.19 or newer and npm.
- PostgreSQL 16 or a compatible supported PostgreSQL release.
- A Clerk application with matching frontend publishable and backend credentials.

## Environment

Copy `.env.example` to `.env` for the frontend and `server/.env.example` to `server/.env` for the API. Replace placeholders locally; never commit either real environment file.

Frontend variables:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_API_BASE_URL`

Backend variables:

- `NODE_ENV`, `HOST`, `PORT`, `LOG_LEVEL`
- `FRONTEND_ORIGIN`
- `DATABASE_URL`
- `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`

## Install and database setup

```bash
npm install
cd server
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
npm run db:seed
```

Use a dedicated database for tests through `TEST_DATABASE_URL`. Do not point tests at production data. Admin bootstrap is explicit: supply `BOOTSTRAP_ADMIN_CLERK_USER_ID` only for the intended initial Clerk user when running the seed.

## Development

In separate terminals:

```bash
npm run dev
```

```bash
cd server
npm run dev
```

## Verification

Frontend:

```bash
npm test
npm run lint
npm run build
```

Backend:

```bash
cd server
npm test
npm run lint
npm run typecheck
npm run build
npm run prisma:validate
npm run prisma:migrate:status
```

## Production startup

Build the frontend and serve `dist/` from a static host with SPA fallback. Build and start the API with:

```bash
cd server
npm run build
npm start
```

Apply committed migrations with `npm run prisma:migrate:deploy` before starting a production release. Do not use `prisma db push` for releases.

## Release checklist

- Configure production Clerk keys, API URL, frontend origin, and PostgreSQL URL in the deployment platform.
- Apply migrations and verify `/health`.
- Confirm Clerk login, `/api/v1/me`, role policies, booking, inventory, sales, and payments.
- Supply verified legal Impressum and contact details before a public launch.
- Run frontend and backend verification commands and perform a secret scan.
- Review migrations, backups, monitoring, CORS, TLS, and rollback procedures before deployment.

The source catalogue directory `.catalog-source/`, local `.env` files, build outputs, and credentials must remain untracked.
