# AGENTS.md

## Repo Shape
- Vite + React + TypeScript frontend with a same-repo Node backend.
- App entrypoint is `src/main.tsx`; backend entrypoint is `server/index.ts`.
- The page is primarily composed in `src/App.tsx`; reusable UI pieces live in `src/components/`.
- Global styles are in `src/index.css`; component and page styles use CSS modules.

## Commands
- Install: `npm install`
- Dev client: `npm run dev:client`
- Dev server: `npm run dev:server`
- Dev both: `npm run dev`
- Build client: `npm run build:client`
- Build server: `npm run build:server`
- Build all: `npm run build`
- Run production: `npm start` (`npm run preview` is an alias)

## Verification
- There is no separate lint or test script configured.
- Use `npm run build` as the default verification step because it runs the client typecheck/build and the server typecheck.

## Deployment
- Production deploy targets Coolify with Nixpacks using `npm start`.

## Agent Workflow
- Prefer using subagents wherever possible for repo exploration or other parallelizable investigation work.
