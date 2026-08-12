# Business Management API

Fastify API for the Business Management System. It provides public service and
booking endpoints plus Clerk-protected, role-authorized business APIs backed by
PostgreSQL and Prisma.

## Prerequisites

- Node.js 20.19 or newer
- PostgreSQL 16 or a compatible supported PostgreSQL release
- A Clerk application with publishable and secret keys

## Install

```bash
npm install
```

## Environment setup

Copy `.env.example` to `.env` and replace its placeholders locally. Never commit
the resulting `.env` file.

## Development

```bash
npm run dev
```

The default address is `http://127.0.0.1:3001`.

Generate the Prisma client and apply committed migrations before first use:

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
npm run db:seed
```

Use a separate database supplied through `TEST_DATABASE_URL` for integration
tests. Never run destructive test setup against production data.

## Verification

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Start the compiled application with:

```bash
npm start
```

## Endpoint groups

- `GET /health` — public health check.
- `/api/v1/public/*` — public service, availability, booking, and lookup routes.
- `GET /api/v1/me` — authenticated application user and business identity.
- `/api/v1/*` — protected business-scoped services, bookings, customers,
  products, inventory, sales, payments, employees, reports, and settings.

The API derives the user, role, and business scope from the verified Clerk
identity. Clients must not provide authoritative role, business, pricing, tax,
or stock values.
