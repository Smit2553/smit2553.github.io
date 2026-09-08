-- Initial idempotent blog schema. The migration runner safely replaces the
-- schema placeholder after validating BLOG_DB_SCHEMA as an identifier.

CREATE TABLE IF NOT EXISTS __BLOG_DB_SCHEMA__.posts (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text,
  cover_image_url text,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at text,
  created_at text NOT NULL,
  updated_at text NOT NULL
);

ALTER TABLE __BLOG_DB_SCHEMA__.posts ADD COLUMN IF NOT EXISTS cover_image_url text;

CREATE TABLE IF NOT EXISTS __BLOG_DB_SCHEMA__.tags (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at text NOT NULL,
  updated_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS __BLOG_DB_SCHEMA__.post_tags (
  post_id text NOT NULL REFERENCES __BLOG_DB_SCHEMA__.posts(id) ON DELETE CASCADE,
  tag_id text NOT NULL REFERENCES __BLOG_DB_SCHEMA__.tags(id) ON DELETE CASCADE,
  created_at text NOT NULL,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS __BLOG_DB_SCHEMA__.likes (
  id text PRIMARY KEY,
  post_id text NOT NULL REFERENCES __BLOG_DB_SCHEMA__.posts(id) ON DELETE CASCADE,
  visitor_key text NOT NULL,
  created_at text NOT NULL,
  UNIQUE (post_id, visitor_key)
);

CREATE TABLE IF NOT EXISTS __BLOG_DB_SCHEMA__.replies (
  id text PRIMARY KEY,
  post_id text NOT NULL REFERENCES __BLOG_DB_SCHEMA__.posts(id) ON DELETE CASCADE,
  parent_reply_id text REFERENCES __BLOG_DB_SCHEMA__.replies(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at text NOT NULL,
  updated_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS __BLOG_DB_SCHEMA__.reply_likes (
  id text PRIMARY KEY,
  reply_id text NOT NULL REFERENCES __BLOG_DB_SCHEMA__.replies(id) ON DELETE CASCADE,
  visitor_key text NOT NULL,
  created_at text NOT NULL,
  UNIQUE (reply_id, visitor_key)
);

CREATE TABLE IF NOT EXISTS __BLOG_DB_SCHEMA__.admin_users (
  id text PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  created_at text NOT NULL,
  updated_at text NOT NULL,
  last_login_at text,
  disabled_at text
);

CREATE TABLE IF NOT EXISTS __BLOG_DB_SCHEMA__.sessions (
  id text PRIMARY KEY,
  admin_user_id text NOT NULL REFERENCES __BLOG_DB_SCHEMA__.admin_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at text NOT NULL,
  last_seen_at text NOT NULL,
  expires_at text NOT NULL,
  revoked_at text
);

CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON __BLOG_DB_SCHEMA__.post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON __BLOG_DB_SCHEMA__.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_replies_post_id ON __BLOG_DB_SCHEMA__.replies(post_id);
CREATE INDEX IF NOT EXISTS idx_replies_parent_reply_id ON __BLOG_DB_SCHEMA__.replies(parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_reply_likes_reply_id ON __BLOG_DB_SCHEMA__.reply_likes(reply_id);
CREATE INDEX IF NOT EXISTS idx_sessions_admin_user_id ON __BLOG_DB_SCHEMA__.sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON __BLOG_DB_SCHEMA__.sessions(expires_at);
