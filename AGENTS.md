# AGENTS.md

## Repo Shape
- Vite + React + TypeScript frontend with a same-repo Node/Express backend and Postgres-backed blog/admin/replies storage.
- App entrypoint is `src/main.tsx`; backend entrypoint is `server/index.ts`.
- The page is primarily composed in `src/App.tsx`; reusable UI pieces live in `src/components/`.
- Global styles are in `src/index.css`; component and page styles use CSS modules.

## Commands
- Install: `npm install`
- Dev client: `npm run dev:client`
- Dev server: `npm run dev:server`
- Dev both: `npm run dev` (includes the local admin fallback); otherwise set `BLOG_ADMIN_USERNAME` and `BLOG_ADMIN_PASSWORD` first if you are not using the fallback path
- Build client: `npm run build:client`
- Build server: `npm run build:server`
- Build all: `npm run build`
- Run production: `npm start`

## Runtime
- `npm start` runs `server-dist/index.js`; Coolify/Nixpacks should use it after `npm run build`
- `BLOG_ALLOW_DEV_ADMIN_DEFAULTS=1` seeds `admin` / `admin-dev-only` for local sign-in
- Postgres uses `DATABASE_URL`; select `blog_dev` or `blog_prod` with `BLOG_DB_SCHEMA`

## Design Direction
- Preserve the current calm dev-portfolio/editorial feel: monospace typography, light surfaces, soft shadows, rounded cards, and restrained motion.
- Primary palette: page background `#eeeeee`, main text `#222831`, accent teal `#76abae`, deeper teal accents `#3d6568` and `#35585a`.
- Supporting neutrals: white and near-white surfaces like `#ffffff` and `#f9f9f9`, with muted text in the `#333` to `#777` range.
- Keep layouts spacious and centered, usually in `900px` to `1200px` content shells with responsive stacking instead of dense dashboards.
- Reuse subtle transitions, focus glows, and small hover shifts; avoid flashy animation, gradients, neon accents, or a dark-theme visual jump unless explicitly requested.
- Prefer module-scoped CSS and existing visual patterns over introducing a new design language for one section.

## Verification
- There is no separate lint or test script configured.
- Use `npm run build` as the default verification step because it runs the client typecheck/build and the server typecheck.

## Agent Workflow
- Prefer using subagents wherever possible for repo exploration or other parallelizable investigation work.
