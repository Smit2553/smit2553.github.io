-- Bootstrap schema for blog_dev.
-- Text columns match the current app storage layer.

CREATE SCHEMA IF NOT EXISTS blog_dev;
SET search_path = blog_dev, public;

CREATE TABLE IF NOT EXISTS posts (
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

CREATE TABLE IF NOT EXISTS tags (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at text NOT NULL,
  updated_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id text NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id text NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at text NOT NULL,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS likes (
  id text PRIMARY KEY,
  post_id text NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  visitor_key text NOT NULL,
  created_at text NOT NULL,
  UNIQUE (post_id, visitor_key)
);

CREATE TABLE IF NOT EXISTS replies (
  id text PRIMARY KEY,
  post_id text NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_reply_id text REFERENCES replies(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at text NOT NULL,
  updated_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_users (
  id text PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  created_at text NOT NULL,
  updated_at text NOT NULL,
  last_login_at text,
  disabled_at text
);

CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY,
  admin_user_id text NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at text NOT NULL,
  last_seen_at text NOT NULL,
  expires_at text NOT NULL,
  revoked_at text
);

CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_replies_post_id ON replies(post_id);
CREATE INDEX IF NOT EXISTS idx_replies_parent_reply_id ON replies(parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_sessions_admin_user_id ON sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
