# Smit Devrukhkar — Portfolio & Blog

Personal portfolio, research profile, and technical blog for Smit Devrukhkar (`smit.codestacx.com`), built as a full-stack TypeScript application with a React + Vite frontend and an Express + PostgreSQL backend.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, React Router, Framer Motion, CSS Modules
- **Markdown Rendering:** `react-markdown`, `remark-gfm`, `rehype-sanitize`
- **Backend:** Node.js 22, Express 5, TypeScript
- **Database:** PostgreSQL (`postgres` driver) with schema-isolated environments (`blog_dev` / `blog_prod`)

## Local Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**

   Copy `.env.example` to `.env` and adjust values as needed for your local PostgreSQL instance:

   ```bash
   cp .env.example .env
   ```

3. **Run database migrations:**

   ```bash
   npm run db:migrate
   ```

4. **Start the development client and API server:**

   ```bash
   npm run dev
   ```

   - `npm run dev` runs both the Vite client (`npm run dev:client`) and the Express server (`npm run dev:server`) with `BLOG_APP_ENV=development`, `BLOG_DB_SCHEMA=blog_dev`, and `BLOG_ALLOW_DEV_ADMIN_DEFAULTS=1` (seeding local fallback admin credentials `admin` / `admin-dev-only`).
   - Vite proxies `/api/*` requests to `http://127.0.0.1:3001` (configurable via `API_PORT`).

## Environment Variables

See [`.env.example`](.env.example) for a complete template:

| Variable | Description |
| --- | --- |
| `BLOG_APP_ENV` | Application environment (`development` or `production`). |
| `NODE_ENV` | Node runtime environment (`development` or `production`). |
| `DATABASE_URL` | PostgreSQL connection string (`postgres://user:password@host:5432/blog`). |
| `BLOG_DB_SCHEMA` | PostgreSQL schema (`blog_dev` for development, `blog_prod` for production). |
| `BLOG_DATABASE_ALLOW_INSECURE_PRIVATE_NETWORK` | Set to `1` only when connecting to a private Docker/Coolify Postgres network without TLS. |
| `BLOG_ALLOW_DEV_ADMIN_DEFAULTS` | Enables local fallback admin credentials (`admin` / `admin-dev-only`) in development only. Never enable in production. |
| `BLOG_ADMIN_USERNAME` | Admin sign-in username (required in production). |
| `BLOG_ADMIN_PASSWORD` | Admin sign-in password (required in production). |
| `BLOG_VISITOR_COOKIE_SECRET` | Secret for signing visitor cookies (required in production, minimum 32 characters). |
| `BLOG_PUBLIC_ORIGIN` | Canonical public origin without trailing slash (e.g., `https://smit.codestacx.com`), required in production for origin/CSRF verification. |

## Database Migrations & Smoke Testing

- **Apply schema migrations:**

  ```bash
  npm run db:migrate
  ```

- **Run PostgreSQL smoke tests:**

  ```bash
  npm run db:smoke
  ```

## Production Build & Runtime

Build both the client bundle (`dist/`) and compiled server (`server-dist/`):

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Coolify Deployment & Healthcheck

- **Build command:** `npm run build`
- **Start command:** `npm start` (runs `node server-dist/index.js`)
- **Healthcheck endpoint:** `GET /api/health` — verifies server readiness and PostgreSQL connectivity.
