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

## Self-hosting with Docker Compose

The production Compose stack is intended for a single Linux Mini PC. It contains:

- `duesoon-app`: the non-root Next.js standalone server, published only on host loopback.
- `duesoon-db`: PostgreSQL 17, reachable only on the Compose network and backed by the `duesoon-db-data` named volume.
- `duesoon-migrate`: a one-shot container that runs `prisma migrate deploy` after PostgreSQL becomes healthy. The app starts only after it succeeds.

Local Windows development remains unchanged: continue using your locally installed Node.js and PostgreSQL with `npm run dev`. Docker is only the production deployment path.

### First-time deployment

Install Docker Engine with the Compose plugin on the Mini PC, clone the repository, then create the runtime environment file:

```bash
cp .env.production.example .env
nano .env
```

Replace every placeholder. `POSTGRES_PASSWORD` and the password embedded in `DATABASE_URL` must represent the same value; URL-encode reserved characters in the connection string. Generate `AUTH_SECRET` with `npx auth secret` on a trusted machine. The populated `.env` is ignored by Git and must remain only on the server.

Build the Linux images, apply all committed migrations, and start the stack:

```bash
docker compose build
docker compose run --rm duesoon-migrate
docker compose up -d duesoon-app
docker compose ps
```

The final command also starts PostgreSQL. The migration command is safe to repeat: Prisma applies only migrations that have not already been recorded. The app health check calls `/api/health`, which verifies database connectivity without returning credentials or internal error details.

View status and logs with:

```bash
docker compose ps
docker compose logs --tail=100 duesoon-app
docker compose logs --tail=100 duesoon-db
```

### Reverse proxy and HTTPS

Keep the app bound to `127.0.0.1:3000` (or the loopback port selected with `DUESOON_PORT`) and place Caddy, Nginx, or another maintained reverse proxy in front of it. The proxy should:

- terminate HTTPS with a valid certificate;
- proxy to `http://127.0.0.1:3000`;
- replace the upstream `Host`, `X-Forwarded-Host`, and `X-Forwarded-Proto` headers with trusted values rather than accepting client-supplied forwarded headers;
- redirect plain HTTP to HTTPS and pass the original HTTPS scheme to Auth.js.

`AUTH_TRUST_HOST=true` is required for this self-hosted Auth.js setup because Auth.js constructs callback URLs from those trusted headers. Do not expose port 3000 directly to the internet. Run one app replica unless the authentication/session design is reviewed for a multi-instance deployment.

Example Caddy configuration:

```caddyfile
duesoon.example.ie {
    reverse_proxy 127.0.0.1:3000
}
```

### Updating safely

Back up the database first. Then fetch the reviewed application changes and run:

```bash
docker compose stop duesoon-app
docker compose build duesoon-app duesoon-migrate
docker compose run --rm duesoon-migrate
docker compose up -d --no-deps duesoon-app
docker compose ps
```

Stopping the app before migration avoids old application code serving against a newly migrated schema. Deploy database changes that are backward-compatible whenever possible. If migration fails, the app remains stopped; inspect the migration logs and restore from a tested backup if rollback is required. Do not run `prisma migrate dev` or `prisma migrate reset` in production.

### Backup and restore

Create a timestamped custom-format backup in the ignored `backups/` directory:

```bash
sh scripts/backup-db.sh
```

Copy backups off the Mini PC and periodically test restoration. To restore, stop the app, select the backup explicitly, recreate the application database, and restore it:

```bash
docker compose stop duesoon-app
docker compose exec -T duesoon-db sh -c 'dropdb --if-exists -U "$POSTGRES_USER" "$POSTGRES_DB" && createdb -U "$POSTGRES_USER" "$POSTGRES_DB"'
docker compose exec -T duesoon-db sh -c 'pg_restore --exit-on-error --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < backups/duesoon-YYYYMMDDTHHMMSSZ.dump
docker compose up -d duesoon-app
```

The database recreation command is destructive. Verify the backup filename, the Compose project, and the target server before running it. The named volume survives ordinary container replacement and `docker compose down`; never use `docker compose down --volumes` unless permanent database deletion is intended and a verified backup exists.

### Operational notes

- Pin and review image/dependency updates regularly; PostgreSQL is intentionally pinned to major version 17 rather than `latest`.
- Restrict SSH and firewall access to the Mini PC, install operating-system security updates, and monitor free disk space and backup success.
- Rotate `AUTH_SECRET` and database credentials through the server-side `.env`; changing `AUTH_SECRET` signs users out.
- The image build installs dependencies and generates Prisma Client inside Linux, so Windows-generated Prisma binaries are never copied into the production image.
- The runtime image contains only the Next.js standalone output and runs as the unprivileged `nextjs` user. Secrets are supplied only when containers start, not during image build.
