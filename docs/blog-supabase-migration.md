# Blog Migration Plan

Phase 2 keeps the blog inside this repo with a Node backend and a Vite frontend. The browser talks to backend `/api/*` endpoints only.

## Architecture
- `src/` remains the client app and renders the portfolio plus blog UI.
- `server/` owns the API and persistence.
- SQLite is the Phase 2 database.
- Admin auth and sessions live in the backend so later phases can swap storage without changing the client contract.
- Supabase comes later behind the same API, without changing the client contract.

## Rules
- Do not read or write Supabase directly from the frontend.
- Keep a single admin login for later; backend write routes stay internal until then.
- Run local dev with `BLOG_ALLOW_DEV_ADMIN_DEFAULTS=1 npm run dev` to use the fallback admin credentials (`BLOG_ADMIN_USERNAME=admin`, `BLOG_ADMIN_PASSWORD=admin-dev-only`); otherwise both admin env vars are required.
- Preserve likes, replies, and drafts in the backend schema from day one so they migrate intact.

## Migration
1. Serve blog data from backend `/api/*` endpoints only.
2. Store posts, drafts, likes, replies, and metadata in SQLite now.
3. Migrate the same records to Supabase later behind the API.
4. Keep client routes and payload shapes stable across the storage swap.
