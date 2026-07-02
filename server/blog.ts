import crypto from "node:crypto";
import {
  createBlogLike,
  deleteBlogLike,
  getPublishedBlogPostById,
  getPublishedBlogPostBySlug,
  getPublishedBlogPostLikeCountByPostId,
  getPublishedBlogPosts,
  type PublishedBlogPostDetailRow,
  type PublishedBlogPostSummaryRow,
} from "./storage";
import { normalizeNullableText, normalizeText } from "./normalize";

export class BlogError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BlogError";
    this.status = status;
  }
}

interface BlogLikePayload {
  visitorKey?: unknown;
  visitor_key?: unknown;
}

const visitorKeyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function nowIso(): string {
  return new Date().toISOString();
}

export interface PublicBlogPostSummary {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  likeCount: number;
}

export interface PublicBlogPostDetail extends PublicBlogPostSummary {
  content: string;
}

export interface PublicBlogLikeResult {
  ok: true;
  liked: boolean;
  likeCount: number;
}

function normalizeSlug(slug: string): string | null {
  const normalized = slug.trim();

  return normalized.length === 0 ? null : normalized;
}

function normalizePostId(postId: string): string | null {
  const normalized = postId.trim();

  return normalized.length === 0 ? null : normalized;
}

function readLikePayload(body: unknown): BlogLikePayload {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new BlogError(400, "Request body must be an object.");
  }

  return body as BlogLikePayload;
}

function readVisitorKey(value: unknown): string {
  if (typeof value !== "string") {
    throw new BlogError(400, "Visitor key is required.");
  }

  const normalized = value.trim().toLowerCase();

  if (normalized.length === 0) {
    throw new BlogError(400, "Visitor key is required.");
  }

  if (!visitorKeyPattern.test(normalized)) {
    throw new BlogError(400, "Visitor key must be a UUID.");
  }

  return normalized;
}

function toPublicBlogPostSummary(row: PublishedBlogPostSummaryRow): PublicBlogPostSummary {
  const summary = normalizeNullableText(row.summary) ?? "";

  return {
    id: row.id,
    slug: normalizeText(row.slug),
    title: normalizeText(row.title),
    summary: normalizeNullableText(row.summary),
    coverImageUrl: normalizeNullableText(row.cover_image_url),
    excerpt: summary.length === 0 ? "No preview available yet." : summary.length <= 180 ? summary : `${summary.slice(0, 177).trimEnd()}...`,
    publishedAt: row.published_at ?? row.created_at,
    updatedAt: row.updated_at,
    likeCount: row.like_count,
  };
}

function toPublicBlogPostDetail(row: PublishedBlogPostDetailRow): PublicBlogPostDetail {
  return {
    ...toPublicBlogPostSummary(row),
    content: row.content,
  };
}

async function createLikeResult(post: PublishedBlogPostSummaryRow, payload: BlogLikePayload): Promise<PublicBlogLikeResult> {
  const visitorKey = readVisitorKey(payload.visitorKey ?? payload.visitor_key);

  const created = await createBlogLike({
    id: crypto.randomUUID(),
    postId: post.id,
    visitorKey,
    createdAt: nowIso(),
  });

  const liked = created ? true : !(await deleteBlogLike(post.id, visitorKey));

  return {
    ok: true,
    liked,
    likeCount: await getPublishedBlogPostLikeCountByPostId(post.id),
  };
}

export async function listPublishedBlogPosts(limit?: number): Promise<PublicBlogPostSummary[]> {
  return (await getPublishedBlogPosts(limit)).map(toPublicBlogPostSummary);
}

export async function readPublishedBlogPostBySlug(slug: string): Promise<PublicBlogPostDetail | null> {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    return null;
  }

  const post = await getPublishedBlogPostBySlug(normalizedSlug);

  if (!post) {
    return null;
  }

  return toPublicBlogPostDetail(post);
}

export async function likePublishedBlogPostBySlug(slug: string, body: unknown): Promise<PublicBlogLikeResult> {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    throw new BlogError(400, "Slug is required.");
  }

  const payload = readLikePayload(body);
  const post = await getPublishedBlogPostBySlug(normalizedSlug);

  if (!post) {
    throw new BlogError(404, "Post not found.");
  }

  return createLikeResult(post, payload);
}

export async function likePublishedBlogPostById(id: string, body: unknown): Promise<PublicBlogLikeResult> {
  const normalizedId = normalizePostId(id);

  if (!normalizedId) {
    throw new BlogError(400, "Post id is required.");
  }

  const payload = readLikePayload(body);
  const post = await getPublishedBlogPostById(normalizedId);

  if (!post) {
    throw new BlogError(404, "Post not found.");
  }

  return createLikeResult(post, payload);
}
