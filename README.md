# DueSoon

DueSoon is a private deadline and assessment tracker designed around Irish college semesters. It uses Next.js, Auth.js, Prisma and PostgreSQL.

## Requirements

- Node.js 24 (the automated test command uses Node's TypeScript test support)
- PostgreSQL

## Environment

Copy `.env.example` to `.env` or `.env.local` and replace every placeholder. These local files are ignored by Git.

Required variables:

- `DATABASE_URL`: server-only PostgreSQL connection string used by Prisma.
- `AUTH_SECRET`: strong Auth.js secret. Generate one with `npx auth secret`.

Never expose either value through a `NEXT_PUBLIC_` variable or commit a populated environment file.

## Local setup

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open `http://localhost:3000` for local development.

## Checks

```bash
npm test
npm run lint
npx tsc --noEmit
npx prisma validate
npm run build
```

## Production database migrations

Apply committed migrations without creating or modifying migration files:

```bash
npx prisma migrate deploy
```

To verify the complete migration history safely before deployment, create a separate disposable PostgreSQL database, point `DATABASE_URL` at that database only, run `npx prisma migrate deploy`, and then run `npx prisma migrate status`. Never use `prisma migrate reset` against the current or production database.

After migrations and a successful build, start the production server with:

```bash
npm start
```
