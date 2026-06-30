# Blog Runtime Notes

The blog, likes, replies, and admin routes stay in this repo behind the `/api/*` contract.

## Local Auth
- `BLOG_ALLOW_DEV_ADMIN_DEFAULTS=1 npm run dev`
- Fallback admin creds: `admin` / `admin-dev-only`
- Without that flag, set `BLOG_ADMIN_USERNAME` and `BLOG_ADMIN_PASSWORD`

## Runtime
- `npm run build` produces `dist/` and `server-dist/`
- `npm start` runs `server-dist/index.js`
- SQLite defaults to `data/blog.sqlite`; override with `BLOG_SQLITE_PATH` or `DATABASE_PATH`
