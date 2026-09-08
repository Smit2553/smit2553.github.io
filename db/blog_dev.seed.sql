-- Demo posts for local development.
SET search_path = blog_dev, public;

INSERT INTO posts (
  id,
  slug,
  title,
  summary,
  content,
  status,
  published_at,
  created_at,
  updated_at
) VALUES
  (
    'demo-post-ship-small',
    'ship-small-ship-often',
    'Ship Small, Ship Often',
    'Why small, reviewable changes make a personal product easier to grow.',
    '# Ship Small, Ship Often

The fastest way to learn from a project is to keep the feedback loop tight.

## What that looks like

- Keep each change focused on one user-visible improvement.
- Make sure the app still builds after every step.
- Prefer a direct fix over a clever abstraction.

That discipline matters even more on a solo project. Smaller releases make regressions easier to spot and easier to undo.

## A practical rule

If a change is hard to describe in two sentences, it is probably doing too much.
','published','2026-06-01T14:00:00.000Z','2026-06-01T14:00:00.000Z','2026-06-01T14:00:00.000Z'
  ),
  (
    'demo-post-postgres-cutover',
    'moving-from-sqlite-to-postgres',
    'Moving From SQLite to Postgres',
    'Notes from replacing a simple local database with a hosted Postgres setup.',
    '# Moving From SQLite to Postgres

The migration was less about swapping libraries and more about tightening runtime assumptions.

## The key pieces

- load environment variables consistently
- make storage calls async end to end
- keep API response shapes stable
- verify the schema exists before relying on it

The frontend did not need to know about the database change. That was the main win.

## Takeaway

Good boundaries make infrastructure changes cheaper than they look at first glance.
','published','2026-06-08T14:00:00.000Z','2026-06-08T14:00:00.000Z','2026-06-08T14:00:00.000Z'
  ),
  (
    'demo-post-replies-moderation',
    'designing-lightweight-reply-moderation',
    'Designing Lightweight Reply Moderation',
    'A simple moderation flow can go a long way when the product is still small.',
    '# Designing Lightweight Reply Moderation

Community features do not need a huge control panel on day one.

## A lightweight moderation model

Use a small status model:

- pending
- approved
- rejected

That keeps the public experience clean while still letting people participate.

## Why it works

The simpler the moderation path is, the more likely it is to actually get used and maintained.
','published','2026-06-15T14:00:00.000Z','2026-06-15T14:00:00.000Z','2026-06-15T14:00:00.000Z'
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  content = EXCLUDED.content,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  updated_at = EXCLUDED.updated_at;
