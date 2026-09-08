# Blog Runtime Notes

The blog, likes, replies, and admin routes stay in this repo behind the `/api/*` contract.

## Local Auth
- `npm run dev`
- Fallback admin creds: `admin` / `admin-dev-only`
- `npm run dev` enables the local fallback automatically
- Without the fallback path, set `BLOG_ADMIN_USERNAME` and `BLOG_ADMIN_PASSWORD`

## Runtime
- `npm run build` produces `dist/` and `server-dist/`
- `npm start` runs `server-dist/index.js`

## Postgres Foundation
- `DATABASE_URL` points at the Postgres/Supabase database
- `BLOG_DB_SCHEMA` selects `blog_dev` or `blog_prod`
- `npm run db:smoke` checks connectivity and schema access
- Bootstrap SQL lives in `db/blog_dev.sql` and `db/blog_prod.sql`
- The backend storage layer now uses Postgres directly via `postgres`
