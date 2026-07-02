import postgres, { type Sql } from "postgres";
import { blogDbSchema, databaseUrl } from "./config";

type UnsafeParameters = NonNullable<Parameters<Sql["unsafe"]>[1]>;

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

export interface BlogLikeSeed {
  id: string;
  postId: string;
  visitorKey: string;
  createdAt: string;
}

export interface ReplyLikeSeed {
  id: string;
  replyId: string;
  visitorKey: string;
  createdAt: string;
}

export interface ReplyRow {
  id: string;
  post_id: string;
  parent_reply_id: string | null;
  author_name: string;
  author_email: string | null;
  body: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ReplyLikeCountRow {
  reply_id: string;
  like_count: number;
}

export interface ReplyWithPostRow extends ReplyRow {
  post_slug: string;
  post_title: string;
  post_summary: string | null;
  post_status: string;
  post_published_at: string | null;
  post_created_at: string;
  post_updated_at: string;
}

export interface ReplySeed {
  id: string;
  postId: string;
  parentReplyId: string | null;
  authorName: string;
  authorEmail: string | null;
  body: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

let sqlClient: Sql | null = null;

export interface PublishedBlogPostSummaryRow {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  like_count: number;
}

export interface PublishedBlogPostDetailRow extends PublishedBlogPostSummaryRow {
  content: string;
}

export interface AdminPostRow {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  cover_image_url: string | null;
  content: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminPostSeed {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  content: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function requireDatabaseUrl(): string {
  if (databaseUrl.length === 0) {
    throw new Error("DATABASE_URL is required.");
  }

  return databaseUrl;
}

function requireSchemaName(): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(blogDbSchema)) {
    throw new Error(`Invalid BLOG_DB_SCHEMA: ${blogDbSchema}`);
  }

  return blogDbSchema;
}

function shouldRequireSsl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const sslMode = parsed.searchParams.get("sslmode")?.toLowerCase();

    if (sslMode === "disable") {
      return false;
    }

    if (sslMode === "require") {
      return true;
    }

    return parsed.hostname.includes("supabase");
  } catch {
    return false;
  }
}

function tableName(name: string): string {
  return `"${requireSchemaName()}"."${name}"`;
}

function getSql(): Sql {
  if (!sqlClient) {
    const url = requireDatabaseUrl();

    sqlClient = postgres(url, {
      max: 10,
      connect_timeout: 10,
      idle_timeout: 20,
      ssl: shouldRequireSsl(url) ? "require" : undefined,
    });
  }

  return sqlClient;
}

async function queryOne<T>(query: string, params: UnsafeParameters = []): Promise<T | undefined> {
  const rows = await getSql().unsafe<T[]>(query, params);

  return rows[0];
}

async function queryAll<T>(query: string, params: UnsafeParameters = []): Promise<T[]> {
  return getSql().unsafe<T[]>(query, params);
}

async function run(query: string, params: UnsafeParameters = []): Promise<void> {
  await getSql().unsafe(query, params);
}

export async function initializeStorage(): Promise<void> {
  await getSql()`select 1`;
}

export function closeStorage(): Promise<void> {
  if (!sqlClient) {
    return Promise.resolve();
  }

  const client = sqlClient;
  sqlClient = null;

  return client.end({ timeout: 5 });
}

export function isUniqueConstraintError(error: unknown, constraintName?: string): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const code = (error as { code?: unknown }).code;
  const constraint = (error as { constraint_name?: unknown }).constraint_name;

  return typeof code === "string"
    && code === "23505"
    && (constraintName === undefined || constraint === constraintName);
}

export function getAdminUserById(id: string): Promise<AdminUserRow | undefined> {
  return queryOne<AdminUserRow>(`SELECT * FROM ${tableName("admin_users")} WHERE id = $1 LIMIT 1`, [id]);
}

export function getAdminUserByUsername(username: string): Promise<AdminUserRow | undefined> {
  return queryOne<AdminUserRow>(`SELECT * FROM ${tableName("admin_users")} WHERE username = $1 LIMIT 1`, [username]);
}

export function upsertAdminUser(seed: AdminUserSeed): Promise<void> {
  return run(
    `INSERT INTO ${tableName("admin_users")} (
      id,
      username,
      password_hash,
      password_salt,
      created_at,
      updated_at,
      last_login_at,
      disabled_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
    ] as const,
  );
}

export function updateAdminUserLoginTime(adminUserId: string, lastLoginAt: string): Promise<void> {
  return run(`UPDATE ${tableName("admin_users")} SET last_login_at = $1, updated_at = $2 WHERE id = $3`, [lastLoginAt, lastLoginAt, adminUserId]);
}

export function createSession(seed: SessionSeed): Promise<void> {
  return run(
    `INSERT INTO ${tableName("sessions")} (
      id,
      admin_user_id,
      token_hash,
      created_at,
      last_seen_at,
      expires_at,
      revoked_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      seed.id,
      seed.adminUserId,
      seed.tokenHash,
      seed.createdAt,
      seed.lastSeenAt,
      seed.expiresAt,
      seed.revokedAt,
    ] as const,
  );
}

export function getSessionByTokenHash(tokenHash: string): Promise<SessionRow | undefined> {
  return queryOne<SessionRow>(`SELECT * FROM ${tableName("sessions")} WHERE token_hash = $1 LIMIT 1`, [tokenHash]);
}

export function touchSession(sessionId: string, lastSeenAt: string): Promise<void> {
  return run(`UPDATE ${tableName("sessions")} SET last_seen_at = $1 WHERE id = $2`, [lastSeenAt, sessionId]);
}

export function revokeSessionById(sessionId: string, revokedAt: string): Promise<void> {
  return run(`UPDATE ${tableName("sessions")} SET revoked_at = $1 WHERE id = $2 AND revoked_at IS NULL`, [revokedAt, sessionId]);
}

export function revokeSessionsByAdminUserId(adminUserId: string, revokedAt: string): Promise<void> {
  return run(`UPDATE ${tableName("sessions")} SET revoked_at = $1 WHERE admin_user_id = $2 AND revoked_at IS NULL`, [revokedAt, adminUserId]);
}

export function deleteExpiredSessions(nowIso: string): Promise<void> {
  return run(`DELETE FROM ${tableName("sessions")} WHERE expires_at <= $1`, [nowIso]);
}

export function getPublishedBlogPosts(limit?: number): Promise<PublishedBlogPostSummaryRow[]> {
  const sql = `SELECT
      id,
      slug,
      title,
      summary,
      cover_image_url,
      published_at,
      created_at,
      updated_at,
      (SELECT COUNT(*)::int FROM ${tableName("likes")} WHERE likes.post_id = posts.id) AS like_count
    FROM ${tableName("posts")} AS posts
    WHERE status = 'published'
    ORDER BY COALESCE(published_at, created_at) DESC, created_at DESC`;

  if (typeof limit === "number") {
    return queryAll<PublishedBlogPostSummaryRow>(`${sql} LIMIT $1`, [limit]);
  }

  return queryAll<PublishedBlogPostSummaryRow>(sql);
}

export function getPublishedBlogPostBySlug(slug: string): Promise<PublishedBlogPostDetailRow | undefined> {
  return queryOne<PublishedBlogPostDetailRow>(
    `SELECT
      id,
      slug,
      title,
      summary,
      cover_image_url,
      content,
      published_at,
      created_at,
      updated_at,
      (SELECT COUNT(*)::int FROM ${tableName("likes")} WHERE likes.post_id = posts.id) AS like_count
    FROM ${tableName("posts")} AS posts
    WHERE slug = $1 AND status = 'published'
    LIMIT 1`,
    [slug],
  );
}

export function getPublishedBlogPostById(id: string): Promise<PublishedBlogPostDetailRow | undefined> {
  return queryOne<PublishedBlogPostDetailRow>(
    `SELECT
      id,
      slug,
      title,
      summary,
      cover_image_url,
      content,
      published_at,
      created_at,
      updated_at,
      (SELECT COUNT(*)::int FROM ${tableName("likes")} WHERE likes.post_id = posts.id) AS like_count
    FROM ${tableName("posts")} AS posts
    WHERE id = $1 AND status = 'published'
    LIMIT 1`,
    [id],
  );
}

export async function getPublishedBlogPostLikeCountByPostId(postId: string): Promise<number> {
  const row = await queryOne<{ like_count: number }>(`SELECT COUNT(*)::int AS like_count FROM ${tableName("likes")} WHERE post_id = $1`, [postId]);

  return row?.like_count ?? 0;
}

export async function createBlogLike(seed: BlogLikeSeed): Promise<boolean> {
  const result = await queryAll<{ id: string }>(
    `INSERT INTO ${tableName("likes")} (
        id,
        post_id,
        visitor_key,
        created_at
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (post_id, visitor_key) DO NOTHING
      RETURNING id`,
    [seed.id, seed.postId, seed.visitorKey, seed.createdAt],
  );

  return result.length > 0;
}

export async function deleteBlogLike(postId: string, visitorKey: string): Promise<boolean> {
  const result = await queryAll<{ id: string }>(
    `DELETE FROM ${tableName("likes")}
      WHERE post_id = $1 AND visitor_key = $2
      RETURNING id`,
    [postId, visitorKey],
  );

  return result.length > 0;
}

export async function createReplyLike(seed: ReplyLikeSeed): Promise<boolean> {
  const result = await queryAll<{ id: string }>(
    `INSERT INTO ${tableName("reply_likes")} (
        id,
        reply_id,
        visitor_key,
        created_at
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (reply_id, visitor_key) DO NOTHING
      RETURNING id`,
    [seed.id, seed.replyId, seed.visitorKey, seed.createdAt],
  );

  return result.length > 0;
}

export async function deleteReplyLike(replyId: string, visitorKey: string): Promise<boolean> {
  const result = await queryAll<{ id: string }>(
    `DELETE FROM ${tableName("reply_likes")}
      WHERE reply_id = $1 AND visitor_key = $2
      RETURNING id`,
    [replyId, visitorKey],
  );

  return result.length > 0;
}

export async function getReplyLikeCountByReplyId(replyId: string): Promise<number> {
  const row = await queryOne<{ like_count: number }>(`SELECT COUNT(*)::int AS like_count FROM ${tableName("reply_likes")} WHERE reply_id = $1`, [replyId]);

  return row?.like_count ?? 0;
}

export async function getReplyLikeCountsByReplyIds(replyIds: readonly string[]): Promise<Map<string, number>> {
  if (replyIds.length === 0) {
    return new Map();
  }

  const rows = await queryAll<ReplyLikeCountRow>(
    `SELECT reply_id, COUNT(*)::int AS like_count
      FROM ${tableName("reply_likes")}
      WHERE reply_id = ANY($1)
      GROUP BY reply_id`,
    [replyIds],
  );

  return new Map(rows.map((row) => [row.reply_id, row.like_count]));
}

export function getReplyById(id: string): Promise<ReplyRow | undefined> {
  return queryOne<ReplyRow>(
    `SELECT
      id,
      post_id,
      parent_reply_id,
      author_name,
      author_email,
      body,
      status,
      created_at,
      updated_at
    FROM ${tableName("replies")}
    WHERE id = $1
    LIMIT 1`,
    [id],
  );
}

export function getRepliesByPostId(postId: string): Promise<ReplyRow[]> {
  return queryAll<ReplyRow>(
    `SELECT
      id,
      post_id,
      parent_reply_id,
      author_name,
      author_email,
      body,
      status,
      created_at,
      updated_at
    FROM ${tableName("replies")}
    WHERE post_id = $1
    ORDER BY created_at ASC, id ASC`,
    [postId],
  );
}

export function getRepliesByPostIdAndStatus(postId: string, status: string): Promise<ReplyRow[]> {
  return queryAll<ReplyRow>(
    `SELECT
      id,
      post_id,
      parent_reply_id,
      author_name,
      author_email,
      body,
      status,
      created_at,
      updated_at
    FROM ${tableName("replies")}
    WHERE post_id = $1 AND status = $2
    ORDER BY created_at ASC, id ASC`,
    [postId, status],
  );
}

export function getAdminReplies(): Promise<ReplyWithPostRow[]> {
  return queryAll<ReplyWithPostRow>(
    `SELECT
      replies.id AS id,
      replies.post_id AS post_id,
      replies.parent_reply_id AS parent_reply_id,
      replies.author_name AS author_name,
      replies.author_email AS author_email,
      replies.body AS body,
      replies.status AS status,
      replies.created_at AS created_at,
      replies.updated_at AS updated_at,
      posts.slug AS post_slug,
      posts.title AS post_title,
      posts.summary AS post_summary,
      posts.status AS post_status,
      posts.published_at AS post_published_at,
      posts.created_at AS post_created_at,
      posts.updated_at AS post_updated_at
    FROM ${tableName("replies")} AS replies
    INNER JOIN ${tableName("posts")} AS posts ON posts.id = replies.post_id
    ORDER BY CASE replies.status
      WHEN 'pending' THEN 0
      WHEN 'approved' THEN 1
      WHEN 'rejected' THEN 2
      ELSE 3
    END, replies.created_at DESC, replies.id DESC`,
  );
}

export function insertReply(seed: ReplySeed): Promise<void> {
  return run(
    `INSERT INTO ${tableName("replies")} (
      id,
      post_id,
      parent_reply_id,
      author_name,
      author_email,
      body,
      status,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      seed.id,
      seed.postId,
      seed.parentReplyId,
      seed.authorName,
      seed.authorEmail,
      seed.body,
      seed.status,
      seed.createdAt,
      seed.updatedAt,
    ] as const,
  );
}

export function updateReplyStatus(id: string, status: string, updatedAt: string): Promise<void> {
  return run(`UPDATE ${tableName("replies")} SET status = $1, updated_at = $2 WHERE id = $3`, [status, updatedAt, id]);
}

export function deleteReplyById(id: string): Promise<void> {
  return run(`DELETE FROM ${tableName("replies")} WHERE id = $1`, [id]);
}

export function getAdminPosts(): Promise<AdminPostRow[]> {
  return queryAll<AdminPostRow>(`SELECT
      id,
      slug,
      title,
      summary,
      cover_image_url,
      content,
      status,
      published_at,
      created_at,
      updated_at
    FROM ${tableName("posts")}
    ORDER BY updated_at DESC, created_at DESC, id DESC`);
}

export function getAdminPostById(id: string): Promise<AdminPostRow | undefined> {
  return queryOne<AdminPostRow>(
    `SELECT
      id,
      slug,
      title,
      summary,
      cover_image_url,
      content,
      status,
      published_at,
      created_at,
      updated_at
    FROM ${tableName("posts")}
    WHERE id = $1
    LIMIT 1`,
    [id],
  );
}

export function getAdminPostBySlug(slug: string): Promise<AdminPostRow | undefined> {
  return queryOne<AdminPostRow>(
    `SELECT
      id,
      slug,
      title,
      summary,
      cover_image_url,
      content,
      status,
      published_at,
      created_at,
      updated_at
    FROM ${tableName("posts")}
    WHERE slug = $1
    LIMIT 1`,
    [slug],
  );
}

export function insertAdminPost(seed: AdminPostSeed): Promise<void> {
  return run(
    `INSERT INTO ${tableName("posts")} (
      id,
      slug,
      title,
      summary,
      cover_image_url,
      content,
      status,
      published_at,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      seed.id,
      seed.slug,
      seed.title,
      seed.summary,
      seed.coverImageUrl,
      seed.content,
      seed.status,
      seed.publishedAt,
      seed.createdAt,
      seed.updatedAt,
    ] as const,
  );
}

export function updateAdminPost(seed: AdminPostSeed): Promise<void> {
  return run(
    `UPDATE ${tableName("posts")} SET
      slug = $1,
      title = $2,
      summary = $3,
      cover_image_url = $4,
      content = $5,
      status = $6,
      published_at = $7,
      updated_at = $8
    WHERE id = $9`,
    [
      seed.slug,
      seed.title,
      seed.summary,
      seed.coverImageUrl,
      seed.content,
      seed.status,
      seed.publishedAt,
      seed.updatedAt,
      seed.id,
    ] as const,
  );
}

export function deleteAdminPostById(id: string): Promise<void> {
  return run(`DELETE FROM ${tableName("posts")} WHERE id = $1`, [id]);
}
