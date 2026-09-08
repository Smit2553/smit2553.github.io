# Smit's Personal Website

Portfolio site with a Vite/React frontend and a same-repo Node/Express backend for the blog, likes, replies, and admin moderation.

Live site: https://smit-dev.codestacx.com

## Route Map

- `/` portfolio home
- `/blog` blog index
- `/blog/:slug` blog post, likes, replies
- `/admin/login` admin sign-in
- `/admin/posts` post editor
- `/admin/replies` reply moderation

## Local Dev

- `npm install`
- `npm run dev`
- Fallback admin creds: `admin` / `admin-dev-only`
- `npm run dev` includes `BLOG_APP_ENV=development`, `BLOG_DB_SCHEMA=blog_dev`, and the local fallback flag automatically
- Without the fallback path, set `BLOG_APP_ENV`, `BLOG_DB_SCHEMA`, `BLOG_ADMIN_USERNAME`, and `BLOG_ADMIN_PASSWORD`
- `npm run dev:client` or `npm run dev:server` if you only need one side
- Open `http://localhost:5173`; `/api/*` proxies to `127.0.0.1:3001`

## Runtime

- Build: `npm run build`
- Run built app: `npm start`
- Coolify/Nixpacks should use `npm start`
- The server listens for `SIGTERM`/`SIGINT`, stops accepting traffic, drains HTTP requests, and closes the Postgres pool before exit. Give it at least 10 seconds of shutdown grace in Coolify.

## Coolify health checks

Configure the application health check in Coolify with:

- Protocol: `HTTP`
- Port: `3001` (or the value of `PORT` if you override it)
- Path: `/api/health`
- Expected status: `200`
- Interval: `30s`
- Timeout: `5s`
- Retries: `3`
- Start period: at least `30s`; use a longer value if the database migration/release job runs as part of deployment

`/api/health` is a cheap liveness check and does not require Postgres, so it is appropriate for restarting an unresponsive container. Use `/api/ready` for a database-backed readiness check or external monitoring: it returns `200` with `{ "ok": true }` only when the application schema and storage are available, and fails when Postgres is unavailable. Run `npm run db:migrate` as a pre-deploy/release task before relying on readiness.

The app listens on `PORT` (default `3001`) and should remain private behind Coolify's proxy. For a local check, run `curl -i http://127.0.0.1:3001/api/health` and expect `HTTP/1.1 200` with `{ "ok": true }`.

## Production configuration

Required production values:

- `NODE_ENV=production` and `BLOG_APP_ENV=production` (startup rejects a mismatch)
- `DATABASE_URL` and `BLOG_DB_SCHEMA=blog_prod`
- `BLOG_PUBLIC_ORIGIN=https://your-public-host` for admin origin and CSRF checks
- `BLOG_ADMIN_USERNAME` and a unique, strong `BLOG_ADMIN_PASSWORD`
- `BLOG_VISITOR_COOKIE_SECRET` containing at least 32 random characters

Keep database credentials, admin credentials, and the visitor-cookie secret in Coolify secrets rather than the image or repository. Rotate them if they are exposed. Do not enable `BLOG_ALLOW_DEV_ADMIN_DEFAULTS` in production.

Remote production Postgres connections use hostname-verified TLS by default. A Coolify/Docker database on a private IP or single-label internal service name may run without TLS only when `BLOG_DATABASE_ALLOW_INSECURE_PRIVATE_NETWORK=1` is explicitly set. The application rejects that exception for public database hosts. Connections also enforce statement, lock, and idle-transaction timeouts.

## Database deployment

Versioned migrations live in `db/migrations/`. Run the migration command once as a pre-deploy/release task, before starting the new application version:

```sh
npm run db:migrate
npm run db:smoke
npm run build
npm start
```

The migration runner uses a per-schema advisory lock, records applied versions in `schema_migrations`, and runs pending migrations in a transaction. Migration `001` is idempotent and safely adopts databases previously created from `db/blog_dev.sql` or `db/blog_prod.sql`. Before a migration can be recorded, and again during startup/smoke checks, the app validates the current version plus required tables, columns, nullability, keys, uniqueness, status checks, foreign keys, and cascade rules. Incomplete legacy schemas fail closed instead of being marked current. The older bootstrap SQL files remain for reference; use migrations for future deployment changes.

Run migration and smoke-check jobs with the same `NODE_ENV`, `BLOG_APP_ENV`, `DATABASE_URL`, `BLOG_DB_SCHEMA`, and database TLS settings as the application. The migration database role needs DDL permissions; the runtime role only needs access to the application schema and data after migrations complete.

## Backups and recovery

Enable automated Postgres backups in the database platform and retain copies outside the application container. Replies, likes, sessions, and posts are stored only in Postgres; post deletion cascades to related replies and likes.

Before each schema migration, take or verify a recent backup. Regularly test a restore into an isolated database/schema, then run `npm run db:smoke` against the restored copy. Document the target recovery point and who can restore production; an untested backup should not be treated as a recovery plan.

## Scaling and rate limits

The built-in request limiter is deliberately bounded but process-local. Run one application replica unless the reverse proxy provides global rate limiting. Before scaling to multiple Node replicas, move login/reply/like rate limits to an atomic shared store such as Redis. Keep the application port private behind Coolify; Express trusts forwarded client addresses only from loopback and private-network proxy hops.
