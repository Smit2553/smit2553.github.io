# AGENTS.md

## Repo Shape
- Vite + React + TypeScript frontend with a same-repo Node/Express backend and SQLite-backed blog/admin/replies storage.
- App entrypoint is `src/main.tsx`; backend entrypoint is `server/index.ts`.
- The page is primarily composed in `src/App.tsx`; reusable UI pieces live in `src/components/`.
- Global styles are in `src/index.css`; component and page styles use CSS modules.

## Commands
- Install: `npm install`
- Dev client: `npm run dev:client`
- Dev server: `npm run dev:server`
- Dev both: `BLOG_ALLOW_DEV_ADMIN_DEFAULTS=1 npm run dev` when you need the local admin fallback; otherwise set `BLOG_ADMIN_USERNAME` and `BLOG_ADMIN_PASSWORD` first
- Build client: `npm run build:client`
- Build server: `npm run build:server`
- Build all: `npm run build`
- Run production: `npm start`

## Runtime
- `npm start` runs `server-dist/index.js`; Coolify/Nixpacks should use it after `npm run build`
- `BLOG_ALLOW_DEV_ADMIN_DEFAULTS=1` seeds `admin` / `admin-dev-only` for local sign-in
- SQLite defaults to `data/blog.sqlite`; override with `BLOG_SQLITE_PATH` or `DATABASE_PATH`

## Verification
- There is no separate lint or test script configured.
- Use `npm run build` as the default verification step because it runs the client typecheck/build and the server typecheck.

## Agent Workflow
- Prefer using subagents wherever possible for repo exploration or other parallelizable investigation work.
