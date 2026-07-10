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
- Postgres foundation: set `DATABASE_URL` and `BLOG_DB_SCHEMA` (`blog_dev` or `blog_prod`)
- Production deploys must set `BLOG_APP_ENV=production`, `BLOG_DB_SCHEMA=blog_prod`, `BLOG_ADMIN_USERNAME`, `BLOG_ADMIN_PASSWORD`, and a 32+ character `BLOG_VISITOR_COOKIE_SECRET`
- `npm run db:smoke` checks connection and schema access
- Bootstrap SQL lives in `db/blog_dev.sql` and `db/blog_prod.sql`
