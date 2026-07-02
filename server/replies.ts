import crypto from "node:crypto";
import {
  createReplyLike,
  deleteReplyLike,
  deleteReplyById as deleteReplyRow,
  getAdminReplies as getAdminReplyRows,
  getPublishedBlogPostBySlug,
  getReplyLikeCountByReplyId,
  getReplyLikeCountsByReplyIds,
  getReplyById,
  getRepliesByPostIdAndStatus,
  insertReply as insertReplyRow,
  updateReplyStatus as updateReplyRowStatus,
  type ReplyRow,
  type ReplySeed,
  type ReplyWithPostRow,
} from "./storage";
import { normalizeNullableText, normalizeText } from "./normalize";

export type ReplyStatus = "pending" | "approved" | "rejected";

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
}

interface ReplyStatusPayload {
  status?: unknown;
}

const visitorKeyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function readRequiredTextField(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new ReplyError(400, `${fieldName} is required.`);
  }

  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new ReplyError(400, `${fieldName} is required.`);
  }

  return normalized;
}

function readRequiredPlainTextField(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new ReplyError(400, `${fieldName} is required.`);
  }

  if (value.trim().length === 0) {
    throw new ReplyError(400, `${fieldName} is required.`);
  }

  return value;
}

function readOptionalTextField(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ReplyError(400, `${fieldName} must be a string or null.`);
  }

  const normalized = value.trim();

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

function readVisitorKey(value: unknown): string {
  if (typeof value !== "string") {
    throw new ReplyError(400, "Visitor key is required.");
  }

  const normalized = value.trim().toLowerCase();

  if (normalized.length === 0) {
    throw new ReplyError(400, "Visitor key is required.");
  }

  if (!visitorKeyPattern.test(normalized)) {
    throw new ReplyError(400, "Visitor key must be a UUID.");
  }

  return normalized;
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

function toAdminReply(row: ReplyWithPostRow): AdminReply {
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
    authorName: normalizeText(row.author_name),
    authorEmail: normalizeNullableText(row.author_email),
    body: row.body,
    status: toReplyStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getPublishedReplyPost(slug: string) {
  const normalizedSlug = normalizeSlug(slug);
  const post = await getPublishedBlogPostBySlug(normalizedSlug);

  if (!post) {
    throw new ReplyError(404, "Post not found.");
  }

  return post;
}

export async function listPublishedBlogRepliesBySlug(slug: string): Promise<PublicReply[]> {
  const post = await getPublishedReplyPost(slug);
  const approvedReplies = await getRepliesByPostIdAndStatus(post.id, "approved");
  const approvedReplyLookup = new Map(approvedReplies.map((reply) => [reply.id, reply]));
  const visibleReplies = approvedReplies.filter((reply) => {
    if (reply.parent_reply_id === null) {
      return true;
    }

    const parentReply = approvedReplyLookup.get(reply.parent_reply_id);

    return parentReply !== undefined && parentReply.parent_reply_id === null;
  });
  const likeCounts = await getReplyLikeCountsByReplyIds(visibleReplies.map((reply) => reply.id));

  return visibleReplies.map((reply) => toPublicReply(reply, likeCounts.get(reply.id) ?? 0));
}

export async function createPublishedBlogReplyBySlug(slug: string, body: unknown): Promise<PublicReply> {
  const post = await getPublishedReplyPost(slug);
  const payload = requireObjectBody(body);
  const authorName = readRequiredTextField(payload.authorName ?? payload.author_name, "Author name");
  const replyBody = readRequiredPlainTextField(payload.body, "Reply body");
  const authorEmail = readOptionalTextField(payload.authorEmail ?? payload.author_email, "Author email");
  const parentReplyIdValue = payload.parentReplyId ?? payload.parent_reply_id;
  const parentReplyId = readOptionalTextField(parentReplyIdValue, "Parent reply id");

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

export async function likePublishedBlogReplyBySlug(slug: string, replyId: string, body: unknown): Promise<PublicReplyLikeResult> {
  const post = await getPublishedReplyPost(slug);
  const normalizedReplyId = normalizeReplyId(replyId);
  const payload = requireObjectBody(body);
  const visitorKey = readVisitorKey(payload.visitorKey ?? payload.visitor_key);
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

  const created = await createReplyLike({
    id: crypto.randomUUID(),
    replyId: reply.id,
    visitorKey,
    createdAt: nowIso(),
  });

  const liked = created ? true : !(await deleteReplyLike(reply.id, visitorKey));

  return {
    ok: true,
    liked,
    likeCount: await getReplyLikeCountByReplyId(reply.id),
  };
}

export async function listAdminReplies(): Promise<AdminReply[]> {
  return (await getAdminReplyRows()).map(toAdminReply);
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
