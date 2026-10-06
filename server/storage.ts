import postgres, { type Sql } from "postgres";
import { blogDbSchema, databaseUrl, productionMode } from "./config";
import {
  databaseConnectionOptions,
  requireSchemaName,
  validateMigrationState,
  validateRequiredConstraints,
  validateRequiredSchema,
} from "./database-runtime";

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

export interface SessionWithAdminUserRow {
  session: SessionRow;
  user: AdminUserRow | null;
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

export interface PublishedBlogPostMetaRow {
  slug: string;
  title: string;
  summary: string | null;
  cover_image_url: string | null;
}

export interface SitemapPublishedPostRow {
  slug: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
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

export type AdminPostSummaryRow = Omit<AdminPostRow, "content">;

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

function tableName(name: string): string {
  return `"${requireSchemaName(blogDbSchema)}"."${name}"`;
}

function getSql(): Sql {
  if (!sqlClient) {
    const url = requireDatabaseUrl();

    sqlClient = postgres(url, databaseConnectionOptions(url, productionMode));
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
  await checkStorageReadiness();
  await validateRequiredSchema(getSql(), blogDbSchema);
  await validateRequiredConstraints(getSql(), blogDbSchema);

  if (productionMode) {
    await validateMigrationState(getSql(), blogDbSchema);
  }

  await Promise.all([
    run(`CREATE INDEX IF NOT EXISTS idx_posts_published_sort ON ${tableName("posts")} (COALESCE(published_at, created_at) DESC, created_at DESC) WHERE status = 'published'`),
    run(`CREATE INDEX IF NOT EXISTS idx_posts_admin_sort ON ${tableName("posts")} (updated_at DESC, created_at DESC, id DESC)`),
    run(`CREATE INDEX IF NOT EXISTS idx_replies_post_status_created ON ${tableName("replies")} (post_id, status, created_at ASC, id ASC)`),
  ]);
}

export async function checkStorageReadiness(): Promise<void> {
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

export async function rotateAdminUserCredentials(seed: AdminUserSeed, revokedAt: string): Promise<void> {
  await getSql().begin(async (transaction) => {
    await transaction.unsafe(
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
    await transaction.unsafe(
      `UPDATE ${tableName("sessions")} SET revoked_at = $1 WHERE admin_user_id = $2 AND revoked_at IS NULL`,
      [revokedAt, seed.id],
    );
  });
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

type RawSessionWithAdminUserRow = SessionRow & {
  user_id: string | null;
  user_username: string | null;
  user_password_hash: string | null;
  user_password_salt: string | null;
  user_created_at: string | null;
  user_updated_at: string | null;
  user_last_login_at: string | null;
  user_disabled_at: string | null;
};

export async function getSessionWithAdminUserByTokenHash(tokenHash: string): Promise<SessionWithAdminUserRow | undefined> {
  const row = await queryOne<RawSessionWithAdminUserRow>(
    `SELECT
      s.id,
      s.admin_user_id,
      s.token_hash,
      s.created_at,
      s.last_seen_at,
      s.expires_at,
      s.revoked_at,
      u.id AS user_id,
      u.username AS user_username,
      u.password_hash AS user_password_hash,
      u.password_salt AS user_password_salt,
      u.created_at AS user_created_at,
      u.updated_at AS user_updated_at,
      u.last_login_at AS user_last_login_at,
      u.disabled_at AS user_disabled_at
    FROM ${tableName("sessions")} AS s
    LEFT JOIN ${tableName("admin_users")} AS u ON u.id = s.admin_user_id
    WHERE s.token_hash = $1
    LIMIT 1`,
    [tokenHash],
  );

  if (!row) {
    return undefined;
  }

  const session: SessionRow = {
    id: row.id,
    admin_user_id: row.admin_user_id,
    token_hash: row.token_hash,
    created_at: row.created_at,
    last_seen_at: row.last_seen_at,
    expires_at: row.expires_at,
    revoked_at: row.revoked_at,
  };

  const user: AdminUserRow | null = row.user_id !== null
    && row.user_username !== null
    && row.user_password_hash !== null
    && row.user_password_salt !== null
    && row.user_created_at !== null
    && row.user_updated_at !== null
    ? {
      id: row.user_id,
      username: row.user_username,
      password_hash: row.user_password_hash,
      password_salt: row.user_password_salt,
      created_at: row.user_created_at,
      updated_at: row.user_updated_at,
      last_login_at: row.user_last_login_at,
      disabled_at: row.user_disabled_at,
    }
    : null;

  return { session, user };
}

export function touchSession(sessionId: string, lastSeenAt: string): Promise<void> {
  return run(`UPDATE ${tableName("sessions")} SET last_seen_at = $1 WHERE id = $2`, [lastSeenAt, sessionId]);
}

export function revokeSessionById(sessionId: string, revokedAt: string): Promise<void> {
  return run(`UPDATE ${tableName("sessions")} SET revoked_at = $1 WHERE id = $2 AND revoked_at IS NULL`, [revokedAt, sessionId]);
}

export function revokeSessionByTokenHash(tokenHash: string, revokedAt: string): Promise<void> {
  return run(`UPDATE ${tableName("sessions")} SET revoked_at = $1 WHERE token_hash = $2 AND revoked_at IS NULL`, [revokedAt, tokenHash]);
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

export function getSitemapPublishedPosts(limit?: number): Promise<SitemapPublishedPostRow[]> {
  const sql = `SELECT
      slug,
      published_at,
      created_at,
      updated_at
    FROM ${tableName("posts")}
    WHERE status = 'published'
    ORDER BY COALESCE(published_at, created_at) DESC, created_at DESC`;

  if (typeof limit === "number") {
    return queryAll<SitemapPublishedPostRow>(`${sql} LIMIT $1`, [limit]);
  }

  return queryAll<SitemapPublishedPostRow>(sql);
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

export function getPublishedBlogPostIdBySlug(slug: string): Promise<{ id: string } | undefined> {
  return queryOne<{ id: string }>(
    `SELECT id
    FROM ${tableName("posts")}
    WHERE slug = $1 AND status = 'published'
    LIMIT 1`,
    [slug],
  );
}

export function getPublishedBlogPostMetaBySlug(slug: string): Promise<PublishedBlogPostMetaRow | undefined> {
  return queryOne<PublishedBlogPostMetaRow>(
    `SELECT
      slug,
      title,
      summary,
      cover_image_url
    FROM ${tableName("posts")}
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

export function getPublishedBlogPostIdById(id: string): Promise<{ id: string } | undefined> {
  return queryOne<{ id: string }>(
    `SELECT id
    FROM ${tableName("posts")}
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

export async function toggleBlogLike(seed: BlogLikeSeed): Promise<{ liked: boolean; likeCount: number }> {
  const row = await queryOne<{ liked: boolean; like_count: number }>(
    `WITH deleted AS (
      DELETE FROM ${tableName("likes")}
      WHERE post_id = $2 AND visitor_key = $3
      RETURNING id
    ),
    inserted AS (
      INSERT INTO ${tableName("likes")} (id, post_id, visitor_key, created_at)
      SELECT $1, $2, $3, $4
      WHERE NOT EXISTS (SELECT 1 FROM deleted)
      ON CONFLICT (post_id, visitor_key) DO NOTHING
      RETURNING id
    )
    SELECT
      EXISTS (SELECT 1 FROM inserted) AS liked,
      ((SELECT COUNT(*)::int FROM ${tableName("likes")} WHERE post_id = $2)
        + (SELECT COUNT(*)::int FROM inserted)
        - (SELECT COUNT(*)::int FROM deleted)) AS like_count`,
    [seed.id, seed.postId, seed.visitorKey, seed.createdAt],
  );

  return {
    liked: row?.liked ?? false,
    likeCount: row?.like_count ?? 0,
  };
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

export async function toggleReplyLike(seed: ReplyLikeSeed): Promise<{ liked: boolean; likeCount: number }> {
  const row = await queryOne<{ liked: boolean; like_count: number }>(
    `WITH deleted AS (
      DELETE FROM ${tableName("reply_likes")}
      WHERE reply_id = $2 AND visitor_key = $3
      RETURNING id
    ),
    inserted AS (
      INSERT INTO ${tableName("reply_likes")} (id, reply_id, visitor_key, created_at)
      SELECT $1, $2, $3, $4
      WHERE NOT EXISTS (SELECT 1 FROM deleted)
      ON CONFLICT (reply_id, visitor_key) DO NOTHING
      RETURNING id
    )
    SELECT
      EXISTS (SELECT 1 FROM inserted) AS liked,
      ((SELECT COUNT(*)::int FROM ${tableName("reply_likes")} WHERE reply_id = $2)
        + (SELECT COUNT(*)::int FROM inserted)
        - (SELECT COUNT(*)::int FROM deleted)) AS like_count`,
    [seed.id, seed.replyId, seed.visitorKey, seed.createdAt],
  );

  return {
    liked: row?.liked ?? false,
    likeCount: row?.like_count ?? 0,
  };
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
    ORDER BY created_at ASC, id ASC
    LIMIT 500`,
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
    ORDER BY created_at ASC, id ASC
    LIMIT 500`,
    [postId, status],
  );
}

export function getApprovedRepliesWithLikesByPostId(postId: string): Promise<(ReplyRow & { like_count: number })[]> {
  return queryAll<ReplyRow & { like_count: number }>(
    `SELECT
      replies.id,
      replies.post_id,
      replies.parent_reply_id,
      replies.author_name,
      replies.author_email,
      replies.body,
      replies.status,
      replies.created_at,
      replies.updated_at,
      COALESCE(rl.like_count, 0)::int AS like_count
    FROM ${tableName("replies")} AS replies
    LEFT JOIN (
      SELECT reply_id, COUNT(*)::int AS like_count
      FROM ${tableName("reply_likes")}
      GROUP BY reply_id
    ) AS rl ON rl.reply_id = replies.id
    WHERE replies.post_id = $1
      AND replies.status = 'approved'
      AND (
        replies.parent_reply_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM ${tableName("replies")} AS parent
          WHERE parent.id = replies.parent_reply_id
            AND parent.post_id = $1
            AND parent.status = 'approved'
            AND parent.parent_reply_id IS NULL
        )
      )
    ORDER BY replies.created_at ASC, replies.id ASC
    LIMIT 500`,
    [postId],
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
    END, replies.created_at DESC, replies.id DESC
    LIMIT 500`,
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

export function getAdminPosts(): Promise<AdminPostSummaryRow[]> {
  return queryAll<AdminPostSummaryRow>(`SELECT
      id,
      slug,
      title,
      summary,
      cover_image_url,
      status,
      published_at,
      created_at,
      updated_at
    FROM ${tableName("posts")}
    ORDER BY updated_at DESC, created_at DESC, id DESC
    LIMIT 500`);
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

export async function deleteAdminPostById(id: string): Promise<boolean> {
  const rows = await queryAll<{ id: string }>(
    `DELETE FROM ${tableName("posts")} WHERE id = $1 RETURNING id`,
    [id],
  );

  return rows.length > 0;
}
