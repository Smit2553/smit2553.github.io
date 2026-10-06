import crypto from "node:crypto";
import { getReplySpamBlockReason, moderateReply, type ReplyModeration } from "./reply-moderation";
import {
  deleteReplyById as deleteReplyRow,
  getAdminReplies as getAdminReplyRows,
  getApprovedRepliesWithLikesByPostId,
  getPublishedBlogPostIdBySlug,
  getReplyById,
  insertReply as insertReplyRow,
  toggleReplyLike,
  updateReplyStatus as updateReplyRowStatus,
  type ReplyRow,
  type ReplySeed,
  type ReplyWithPostRow,
} from "./storage";
import { normalizeNullableText, normalizeText } from "./normalize";

export type ReplyStatus = "pending" | "approved" | "rejected";
type ReplyModerationResult = ReplyModeration;

const moderationCache = new Map<string, ReplyModerationResult>();
const maxModerationCacheEntries = 2_000;
const asciiControlCharacterPattern = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

export interface PublicReply {
  id: string;
  parentReplyId: string | null;
  authorName: string;
  body: string;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicReplyLikeResult {
  ok: true;
  liked: boolean;
  likeCount: number;
}

export interface AdminReplyPost {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReply {
  id: string;
  post: AdminReplyPost;
  parentReplyId: string | null;
  authorName: string;
  authorEmail: string | null;
  body: string;
  status: ReplyStatus;
  moderation: ReplyModeration;
  createdAt: string;
  updatedAt: string;
}

export class ReplyError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ReplyError";
    this.status = status;
  }
}

interface ReplyPayload {
  authorName?: unknown;
  author_name?: unknown;
  authorEmail?: unknown;
  author_email?: unknown;
  body?: unknown;
  parentReplyId?: unknown;
  parent_reply_id?: unknown;
  visitorKey?: unknown;
  visitor_key?: unknown;
  website?: unknown;
  website_url?: unknown;
}

interface ReplyStatusPayload {
  status?: unknown;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeSlug(slug: string): string {
  const normalized = slug.trim();

  if (normalized.length === 0) {
    throw new ReplyError(400, "Slug is required.");
  }

  return normalized;
}

function normalizeReplyId(id: string): string {
  const normalized = id.trim();

  if (normalized.length === 0) {
    throw new ReplyError(400, "Reply id is required.");
  }

  return normalized;
}

function requireObjectBody(body: unknown): ReplyPayload {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ReplyError(400, "Reply payload must be an object.");
  }

  return body as ReplyPayload;
}

function readRequiredTextField(value: unknown, fieldName: string, maximumLength: number): string {
  if (typeof value !== "string") {
    throw new ReplyError(400, `${fieldName} is required.`);
  }

  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new ReplyError(400, `${fieldName} is required.`);
  }

  if (normalized.length > maximumLength) {
    throw new ReplyError(400, `${fieldName} must not exceed ${maximumLength} characters.`);
  }

  return normalized;
}

function readRequiredPlainTextField(value: unknown, fieldName: string, maximumLength: number): string {
  if (typeof value !== "string") {
    throw new ReplyError(400, `${fieldName} is required.`);
  }

  if (asciiControlCharacterPattern.test(value)) {
    throw new ReplyError(400, `${fieldName} must not contain control characters.`);
  }

  const normalized = value
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (normalized.length === 0) {
    throw new ReplyError(400, `${fieldName} is required.`);
  }

  if (normalized.length > maximumLength) {
    throw new ReplyError(400, `${fieldName} must not exceed ${maximumLength} characters.`);
  }

  return normalized;
}

function readOptionalTextField(value: unknown, fieldName: string, maximumLength: number): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ReplyError(400, `${fieldName} must be a string or null.`);
  }

  const normalized = value.trim();

  if (normalized.length > maximumLength) {
    throw new ReplyError(400, `${fieldName} must not exceed ${maximumLength} characters.`);
  }

  return normalized.length === 0 ? null : normalized;
}

function readReplyStatus(value: unknown): ReplyStatus {
  if (typeof value !== "string") {
    throw new ReplyError(400, "Status must be approved or rejected.");
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "approved" || normalized === "rejected") {
    return normalized;
  }

  throw new ReplyError(400, "Status must be approved or rejected.");
}

function toReplyStatus(value: string): ReplyStatus {
  if (value === "pending" || value === "approved" || value === "rejected") {
    return value;
  }

  throw new ReplyError(500, "Invalid reply status.");
}

function toPublicReply(row: ReplyRow, likeCount = 0): PublicReply {
  return {
    id: row.id,
    parentReplyId: row.parent_reply_id,
    authorName: normalizeText(row.author_name),
    body: row.body,
    likeCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getCachedReplyModeration(
  rowId: string,
  updatedAt: string,
  authorName: string,
  authorEmail: string | null,
  body: string,
): ReplyModerationResult {
  const cacheKey = `${rowId}:${updatedAt}`;
  const cached = moderationCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const result = moderateReply(authorName, authorEmail, body);

  if (moderationCache.size >= maxModerationCacheEntries) {
    const oldestKey = moderationCache.keys().next().value;
    if (oldestKey !== undefined) {
      moderationCache.delete(oldestKey);
    }
  }

  moderationCache.set(cacheKey, result);
  return result;
}

function toAdminReply(row: ReplyWithPostRow): AdminReply {
  const authorName = normalizeText(row.author_name);
  const authorEmail = normalizeNullableText(row.author_email);

  return {
    id: row.id,
    post: {
      id: row.post_id,
      slug: normalizeText(row.post_slug),
      title: normalizeText(row.post_title),
      summary: normalizeNullableText(row.post_summary),
      status: row.post_status,
      publishedAt: row.post_published_at,
      createdAt: row.post_created_at,
      updatedAt: row.post_updated_at,
    },
    parentReplyId: row.parent_reply_id,
    authorName,
    authorEmail,
    body: row.body,
    status: toReplyStatus(row.status),
    moderation: getCachedReplyModeration(row.id, row.updated_at, authorName, authorEmail, row.body),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getPublishedReplyPost(slug: string): Promise<{ id: string }> {
  const normalizedSlug = normalizeSlug(slug);
  const post = await getPublishedBlogPostIdBySlug(normalizedSlug);

  if (!post) {
    throw new ReplyError(404, "Post not found.");
  }

  return post;
}

export async function listPublishedBlogRepliesBySlug(slug: string): Promise<PublicReply[]> {
  const post = await getPublishedReplyPost(slug);
  const approvedReplies = await getApprovedRepliesWithLikesByPostId(post.id);

  return approvedReplies.map((reply) => toPublicReply(reply, reply.like_count));
}

export async function createPublishedBlogReplyBySlug(slug: string, body: unknown): Promise<PublicReply> {
  const post = await getPublishedReplyPost(slug);
  const payload = requireObjectBody(body);

  const honeypotValue = payload.website ?? payload.website_url;

  if (typeof honeypotValue === "string" && honeypotValue.trim().length > 0) {
    throw new ReplyError(400, "Unable to submit reply.");
  }

  const authorName = readRequiredTextField(payload.authorName ?? payload.author_name, "Author name", 80);
  const replyBody = readRequiredPlainTextField(payload.body, "Reply body", 4000);
  const authorEmail = readOptionalTextField(payload.authorEmail ?? payload.author_email, "Author email", 254);
  const parentReplyIdValue = payload.parentReplyId ?? payload.parent_reply_id;
  const parentReplyId = readOptionalTextField(parentReplyIdValue, "Parent reply id", 128);
  const moderation = moderateReply(authorName, authorEmail, replyBody);
  const spamBlockReason = getReplySpamBlockReason(moderation, replyBody);

  if (spamBlockReason !== null) {
    throw new ReplyError(400, `${spamBlockReason} If this was a mistake, try rewriting the reply without promotional wording or link-heavy text.`);
  }

  if (parentReplyId !== null) {
    const parentReply = await getReplyById(parentReplyId);

    if (!parentReply || parentReply.post_id !== post.id) {
      throw new ReplyError(404, "Parent reply not found.");
    }

    if (parentReply.parent_reply_id !== null) {
      throw new ReplyError(400, "Replies can only be nested one level deep.");
    }

    if (parentReply.status !== "approved") {
      throw new ReplyError(400, "You can only reply to approved replies.");
    }
  }

  const now = nowIso();
  const seed: ReplySeed = {
    id: crypto.randomUUID(),
    postId: post.id,
    parentReplyId,
    authorName,
    authorEmail,
    body: replyBody,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await insertReplyRow(seed);

  return toPublicReply({
    id: seed.id,
    post_id: seed.postId,
    parent_reply_id: seed.parentReplyId,
    author_name: seed.authorName,
    author_email: seed.authorEmail,
    body: seed.body,
    status: seed.status,
    created_at: seed.createdAt,
    updated_at: seed.updatedAt,
  }, 0);
}

export async function likePublishedBlogReplyBySlug(slug: string, replyId: string, visitorKey: string): Promise<PublicReplyLikeResult> {
  const post = await getPublishedReplyPost(slug);
  const normalizedReplyId = normalizeReplyId(replyId);
  const reply = await getReplyById(normalizedReplyId);

  if (!reply || reply.post_id !== post.id || reply.status !== "approved") {
    throw new ReplyError(404, "Reply not found.");
  }

  if (reply.parent_reply_id !== null) {
    const parentReply = await getReplyById(reply.parent_reply_id);

    if (!parentReply || parentReply.status !== "approved" || parentReply.parent_reply_id !== null) {
      throw new ReplyError(404, "Reply not found.");
    }
  }

  const { liked, likeCount } = await toggleReplyLike({
    id: crypto.randomUUID(),
    replyId: reply.id,
    visitorKey,
    createdAt: nowIso(),
  });

  return {
    ok: true,
    liked,
    likeCount,
  };
}

export async function listAdminReplies(): Promise<AdminReply[]> {
  return (await getAdminReplyRows())
    .map(toAdminReply)
    .sort((left, right) => Number(right.moderation.flagged) - Number(left.moderation.flagged));
}

export async function updateAdminReplyStatus(id: string, body: unknown): Promise<void> {
  const replyId = normalizeReplyId(id);
  const existing = await getReplyById(replyId);

  if (!existing) {
    throw new ReplyError(404, "Reply not found.");
  }

  const payload = requireObjectBody(body) as ReplyStatusPayload;
  const status = readReplyStatus(payload.status);

  await updateReplyRowStatus(replyId, status, nowIso());
}

export async function deleteAdminReply(id: string): Promise<void> {
  const replyId = normalizeReplyId(id);
  const existing = await getReplyById(replyId);

  if (!existing) {
    throw new ReplyError(404, "Reply not found.");
  }

  await deleteReplyRow(replyId);
}
