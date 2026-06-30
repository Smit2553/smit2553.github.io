import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { sqlitePath } from "./config";

export interface AdminUserRow {
  id: string;
  username: string;
  password_hash: string;
  password_salt: string;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  disabled_at: string | null;
}

export interface SessionRow {
  id: string;
  admin_user_id: string;
  token_hash: string;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  revoked_at: string | null;
}

export interface AdminUserSeed {
  id: string;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  disabledAt: string | null;
}

export interface SessionSeed {
  id: string;
  adminUserId: string;
  tokenHash: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

type SqlValue = string | number | bigint | null;

let database: DatabaseSync | null = null;

export interface PublishedBlogPostSummaryRow {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublishedBlogPostDetailRow extends PublishedBlogPostSummaryRow {
  content: string;
}

const schemaSql = `
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  visitor_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (post_id, visitor_key)
);

CREATE TABLE IF NOT EXISTS replies (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_reply_id TEXT REFERENCES replies(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT,
  disabled_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_replies_post_id ON replies(post_id);
CREATE INDEX IF NOT EXISTS idx_replies_parent_reply_id ON replies(parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_sessions_admin_user_id ON sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
`;

function openDatabase(): DatabaseSync {
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });

  const db = new DatabaseSync(sqlitePath, {
    enableForeignKeyConstraints: true,
    timeout: 5000,
    defensive: true,
  });

  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA synchronous = NORMAL;");
  db.exec(schemaSql);

  return db;
}

function getDatabase(): DatabaseSync {
  if (!database) {
    database = openDatabase();
  }

  return database;
}

function queryOne<T>(sql: string, params: SqlValue[] = []): T | undefined {
  return getDatabase().prepare(sql).get(...params) as T | undefined;
}

function queryAll<T>(sql: string, params: SqlValue[] = []): T[] {
  return getDatabase().prepare(sql).all(...params) as T[];
}

function run(sql: string, params: SqlValue[] = []): void {
  getDatabase().prepare(sql).run(...params);
}

export function initializeStorage(): DatabaseSync {
  return getDatabase();
}

export function getAdminUserById(id: string): AdminUserRow | undefined {
  return queryOne<AdminUserRow>("SELECT * FROM admin_users WHERE id = ? LIMIT 1", [id]);
}

export function getAdminUserByUsername(username: string): AdminUserRow | undefined {
  return queryOne<AdminUserRow>("SELECT * FROM admin_users WHERE username = ? LIMIT 1", [username]);
}

export function upsertAdminUser(seed: AdminUserSeed): void {
  run(
    `INSERT INTO admin_users (
      id,
      username,
      password_hash,
      password_salt,
      created_at,
      updated_at,
      last_login_at,
      disabled_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      username = excluded.username,
      password_hash = excluded.password_hash,
      password_salt = excluded.password_salt,
      updated_at = excluded.updated_at,
      last_login_at = excluded.last_login_at,
      disabled_at = excluded.disabled_at`,
    [
      seed.id,
      seed.username,
      seed.passwordHash,
      seed.passwordSalt,
      seed.createdAt,
      seed.updatedAt,
      seed.lastLoginAt,
      seed.disabledAt,
    ],
  );
}

export function updateAdminUserLoginTime(adminUserId: string, lastLoginAt: string): void {
  run("UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE id = ?", [lastLoginAt, lastLoginAt, adminUserId]);
}

export function createSession(seed: SessionSeed): void {
  run(
    `INSERT INTO sessions (
      id,
      admin_user_id,
      token_hash,
      created_at,
      last_seen_at,
      expires_at,
      revoked_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      seed.id,
      seed.adminUserId,
      seed.tokenHash,
      seed.createdAt,
      seed.lastSeenAt,
      seed.expiresAt,
      seed.revokedAt,
    ],
  );
}

export function getSessionByTokenHash(tokenHash: string): SessionRow | undefined {
  return queryOne<SessionRow>("SELECT * FROM sessions WHERE token_hash = ? LIMIT 1", [tokenHash]);
}

export function touchSession(sessionId: string, lastSeenAt: string): void {
  run("UPDATE sessions SET last_seen_at = ? WHERE id = ?", [lastSeenAt, sessionId]);
}

export function revokeSessionById(sessionId: string, revokedAt: string): void {
  run("UPDATE sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL", [revokedAt, sessionId]);
}

export function revokeSessionsByAdminUserId(adminUserId: string, revokedAt: string): void {
  run("UPDATE sessions SET revoked_at = ? WHERE admin_user_id = ? AND revoked_at IS NULL", [revokedAt, adminUserId]);
}

export function deleteExpiredSessions(nowIso: string): void {
  run("DELETE FROM sessions WHERE expires_at <= ?", [nowIso]);
}

export function getPublishedBlogPosts(limit?: number): PublishedBlogPostSummaryRow[] {
  const sql = `SELECT
      id,
      slug,
      title,
      summary,
      published_at,
      created_at,
      updated_at
    FROM posts
    WHERE status = 'published'
    ORDER BY COALESCE(published_at, created_at) DESC, created_at DESC`;

  if (typeof limit === "number") {
    return queryAll<PublishedBlogPostSummaryRow>(`${sql} LIMIT ?`, [limit]);
  }

  return queryAll<PublishedBlogPostSummaryRow>(sql);
}

export function getPublishedBlogPostBySlug(slug: string): PublishedBlogPostDetailRow | undefined {
  return queryOne<PublishedBlogPostDetailRow>(
    `SELECT
      id,
      slug,
      title,
      summary,
      content,
      published_at,
      created_at,
      updated_at
    FROM posts
    WHERE slug = ? AND status = 'published'
    LIMIT 1`,
    [slug],
  );
}
