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
- `BLOG_ALLOW_DEV_ADMIN_DEFAULTS=1 npm run dev`
- Fallback admin creds: `admin` / `admin-dev-only`
- Without the fallback flag, set `BLOG_ADMIN_USERNAME` and `BLOG_ADMIN_PASSWORD`
- `npm run dev:client` or `npm run dev:server` if you only need one side
- Open `http://localhost:5173`; `/api/*` proxies to `127.0.0.1:3001`

## Runtime

- Build: `npm run build`
- Run built app: `npm start`
- Coolify/Nixpacks should use `npm start`
- SQLite defaults to `data/blog.sqlite`; override with `BLOG_SQLITE_PATH` or `DATABASE_PATH`
