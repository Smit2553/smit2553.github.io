# Blog Migration Plan

Phase 1 keeps the blog inside this repo with a Node backend and a Vite frontend. The browser talks to backend `/api/*` endpoints only.

## Architecture
- `src/` remains the client app and renders the portfolio plus blog UI.
- `server/` owns the API and persistence.
- SQLite is the Phase 1 database.
- Supabase comes later behind the same API, without changing the client contract.

## Rules
- Do not read or write Supabase directly from the frontend.
- Keep a single admin login for later; backend write routes stay internal until then.
- Preserve likes, replies, and drafts in the backend schema from day one so they migrate intact.

## Migration
1. Serve blog data from backend `/api/*` endpoints only.
2. Store posts, drafts, likes, replies, and metadata in SQLite now.
3. Migrate the same records to Supabase later behind the API.
4. Keep client routes and payload shapes stable across the storage swap.
