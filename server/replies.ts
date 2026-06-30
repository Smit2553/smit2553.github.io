import crypto from "node:crypto";
import {
  deleteReplyById as deleteReplyRow,
  getAdminReplies as getAdminReplyRows,
  getPublishedBlogPostBySlug,
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
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
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

function toReplyStatus(value: string): ReplyStatus {
  if (value === "pending" || value === "approved" || value === "rejected") {
    return value;
  }

  throw new ReplyError(500, "Invalid reply status.");
}

function toPublicReply(row: ReplyRow): PublicReply {
  return {
    id: row.id,
    authorName: normalizeText(row.author_name),
    body: row.body,
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

function getPublishedReplyPost(slug: string) {
  const normalizedSlug = normalizeSlug(slug);
  const post = getPublishedBlogPostBySlug(normalizedSlug);

  if (!post) {
    throw new ReplyError(404, "Post not found.");
  }

  return post;
}

export function listPublishedBlogRepliesBySlug(slug: string): PublicReply[] {
  const post = getPublishedReplyPost(slug);

  // Public replies are flat only; hide any legacy threaded rows from the public API.
  return getRepliesByPostIdAndStatus(post.id, "approved")
    .filter((reply) => reply.parent_reply_id === null)
    .map(toPublicReply);
}

export function createPublishedBlogReplyBySlug(slug: string, body: unknown): PublicReply {
  const post = getPublishedReplyPost(slug);
  const payload = requireObjectBody(body);
  const authorName = readRequiredTextField(payload.authorName ?? payload.author_name, "Author name");
  const replyBody = readRequiredPlainTextField(payload.body, "Reply body");
  const authorEmail = readOptionalTextField(payload.authorEmail ?? payload.author_email, "Author email");
  const parentReplyIdValue = payload.parentReplyId ?? payload.parent_reply_id;
  const parentReplyId = readOptionalTextField(parentReplyIdValue, "Parent reply id");

  if (parentReplyId !== null) {
    throw new ReplyError(400, "Nested replies are not supported.");
  }

  const now = nowIso();
  const seed: ReplySeed = {
    id: crypto.randomUUID(),
    postId: post.id,
    parentReplyId: null,
    authorName,
    authorEmail,
    body: replyBody,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  insertReplyRow(seed);

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
  });
}

export function listAdminReplies(): AdminReply[] {
  return getAdminReplyRows().map(toAdminReply);
}

export function updateAdminReplyStatus(id: string, body: unknown): void {
  const replyId = normalizeReplyId(id);
  const existing = getReplyById(replyId);

  if (!existing) {
    throw new ReplyError(404, "Reply not found.");
  }

  const payload = requireObjectBody(body) as ReplyStatusPayload;
  const status = readReplyStatus(payload.status);

  updateReplyRowStatus(replyId, status, nowIso());
}

export function deleteAdminReply(id: string): void {
  const replyId = normalizeReplyId(id);
  const existing = getReplyById(replyId);

  if (!existing) {
    throw new ReplyError(404, "Reply not found.");
  }

  deleteReplyRow(replyId);
}
