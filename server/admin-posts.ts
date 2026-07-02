import crypto from "node:crypto";
import {
  deleteAdminPostById as deleteAdminPostRow,
  getAdminPostById as getAdminPostRowById,
  getAdminPostBySlug as getAdminPostRowBySlug,
  getAdminPosts as getAdminPostRows,
  isUniqueConstraintError,
  insertAdminPost as insertAdminPostRow,
  updateAdminPost as updateAdminPostRow,
  type AdminPostRow,
  type AdminPostSeed,
} from "./storage";
import { normalizeNullableText, normalizeText } from "./normalize";

export interface AdminPostSummary {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPostDetail extends AdminPostSummary {
  content: string;
}

export class AdminPostError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminPostError";
    this.status = status;
  }
}

interface AdminPostPayload {
  title?: unknown;
  slug?: unknown;
  summary?: unknown;
  coverImageUrl?: unknown;
  cover_image_url?: unknown;
  content?: unknown;
  status?: unknown;
}

type EditableStatus = "draft" | "published";

function nowIso(): string {
  return new Date().toISOString();
}

function normalizePostId(id: string): string {
  const normalized = id.trim();

  if (normalized.length === 0) {
    throw new AdminPostError(400, "Post id is required.");
  }

  return normalized;
}

function requireObjectBody(body: unknown): AdminPostPayload {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new AdminPostError(400, "Post payload must be an object.");
  }

  return body as AdminPostPayload;
}

function readRequiredTextField(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new AdminPostError(400, `${fieldName} is required.`);
  }

  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new AdminPostError(400, `${fieldName} is required.`);
  }

  return normalized;
}

function readSummaryField(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AdminPostError(400, "Summary must be a string or null.");
  }

  const normalized = value.trim();

  return normalized.length === 0 ? null : normalized;
}

function readCoverImageUrlField(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AdminPostError(400, "Cover image URL must be a string or null.");
  }

  const normalized = value.trim();

  if (normalized.length === 0) {
    return null;
  }

  try {
    const parsed = new URL(normalized);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("invalid");
    }
  } catch {
    throw new AdminPostError(400, "Cover image URL must be a valid http or https URL.");
  }

  return normalized;
}

function readContentField(value: unknown): string {
  if (typeof value !== "string") {
    throw new AdminPostError(400, "Content is required.");
  }

  if (value.trim().length === 0) {
    throw new AdminPostError(400, "Content is required.");
  }

  return value;
}

function readEditableStatus(value: unknown): EditableStatus {
  if (typeof value !== "string") {
    throw new AdminPostError(400, "Status must be draft or published.");
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "draft" || normalized === "published") {
    return normalized;
  }

  throw new AdminPostError(400, "Status must be draft or published.");
}

function isSlugConstraintError(error: unknown): boolean {
  return isUniqueConstraintError(error, "posts_slug_key");
}

function toAdminPostSummary(row: AdminPostRow): AdminPostSummary {
  return {
    id: row.id,
    slug: normalizeText(row.slug),
    title: normalizeText(row.title),
    summary: normalizeNullableText(row.summary),
    coverImageUrl: normalizeNullableText(row.cover_image_url),
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toAdminPostDetail(row: AdminPostRow): AdminPostDetail {
  return {
    ...toAdminPostSummary(row),
    content: row.content,
  };
}

function toAdminPostDetailFromValues(values: AdminPostSeed): AdminPostDetail {
  return {
    id: values.id,
    slug: normalizeText(values.slug),
    title: normalizeText(values.title),
    summary: normalizeNullableText(values.summary),
    coverImageUrl: normalizeNullableText(values.coverImageUrl),
    status: values.status,
    publishedAt: values.publishedAt,
    createdAt: values.createdAt,
    updatedAt: values.updatedAt,
    content: values.content,
  };
}

async function assertSlugIsAvailable(slug: string, currentPostId?: string): Promise<void> {
  const existing = await getAdminPostRowBySlug(slug);

  if (existing && existing.id !== currentPostId) {
    throw new AdminPostError(409, "Slug already exists.");
  }
}

export async function listAdminPosts(): Promise<AdminPostSummary[]> {
  return (await getAdminPostRows()).map(toAdminPostSummary);
}

export async function readAdminPostById(id: string): Promise<AdminPostDetail | null> {
  const postId = normalizePostId(id);
  const row = await getAdminPostRowById(postId);

  if (!row) {
    return null;
  }

  return toAdminPostDetail(row);
}

export async function createAdminPost(body: unknown): Promise<AdminPostDetail> {
  const payload = requireObjectBody(body);
  const title = readRequiredTextField(payload.title, "Title");
  const slug = readRequiredTextField(payload.slug, "Slug");
  const summary = Object.prototype.hasOwnProperty.call(payload, "summary")
    ? readSummaryField(payload.summary)
    : null;
  const coverImageUrl = Object.prototype.hasOwnProperty.call(payload, "coverImageUrl") || Object.prototype.hasOwnProperty.call(payload, "cover_image_url")
    ? readCoverImageUrlField(payload.coverImageUrl ?? payload.cover_image_url)
    : null;
  const content = readContentField(payload.content);
  const status = Object.prototype.hasOwnProperty.call(payload, "status")
    ? readEditableStatus(payload.status)
    : "draft";
  const now = nowIso();

  await assertSlugIsAvailable(slug);

  const post: AdminPostSeed = {
    id: crypto.randomUUID(),
    slug,
    title,
    summary,
    coverImageUrl,
    content,
    status,
    publishedAt: status === "published" ? now : null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await insertAdminPostRow(post);
  } catch (error) {
    if (isSlugConstraintError(error)) {
      throw new AdminPostError(409, "Slug already exists.");
    }

    throw error;
  }

  return toAdminPostDetailFromValues(post);
}

export async function updateAdminPost(id: string, body: unknown): Promise<AdminPostDetail> {
  const postId = normalizePostId(id);
  const existing = await getAdminPostRowById(postId);

  if (!existing) {
    throw new AdminPostError(404, "Post not found.");
  }

  const payload = requireObjectBody(body);
  const hasTitle = Object.prototype.hasOwnProperty.call(payload, "title");
  const hasSlug = Object.prototype.hasOwnProperty.call(payload, "slug");
  const hasSummary = Object.prototype.hasOwnProperty.call(payload, "summary");
  const hasContent = Object.prototype.hasOwnProperty.call(payload, "content");
  const hasStatus = Object.prototype.hasOwnProperty.call(payload, "status");
  const hasCoverImageUrl = Object.prototype.hasOwnProperty.call(payload, "coverImageUrl") || Object.prototype.hasOwnProperty.call(payload, "cover_image_url");

  if (!hasTitle && !hasSlug && !hasSummary && !hasCoverImageUrl && !hasContent && !hasStatus) {
    throw new AdminPostError(400, "At least one post field is required.");
  }

  const title = hasTitle ? readRequiredTextField(payload.title, "Title") : existing.title;
  const slug = hasSlug ? readRequiredTextField(payload.slug, "Slug") : existing.slug;
  const summary = hasSummary ? readSummaryField(payload.summary) : existing.summary;
  const coverImageUrl = hasCoverImageUrl
    ? readCoverImageUrlField(payload.coverImageUrl ?? payload.cover_image_url)
    : existing.cover_image_url;
  const content = hasContent ? readContentField(payload.content) : existing.content;
  const status = hasStatus ? readEditableStatus(payload.status) : existing.status;
  const now = nowIso();
  const publishedAt = status === "published" ? existing.published_at ?? now : existing.published_at;
  const updatedAt = now;

  if (slug !== existing.slug) {
    await assertSlugIsAvailable(slug, existing.id);
  }

  const post: AdminPostSeed = {
    id: existing.id,
    slug,
    title,
    summary,
    coverImageUrl,
    content,
    status,
    publishedAt,
    createdAt: existing.created_at,
    updatedAt,
  };

  try {
    await updateAdminPostRow(post);
  } catch (error) {
    if (isSlugConstraintError(error)) {
      throw new AdminPostError(409, "Slug already exists.");
    }

    throw error;
  }

  return toAdminPostDetailFromValues(post);
}

export async function deleteAdminPost(id: string): Promise<void> {
  const postId = normalizePostId(id);
  const existing = await getAdminPostRowById(postId);

  if (!existing) {
    throw new AdminPostError(404, "Post not found.");
  }

  await deleteAdminPostRow(postId);
}
