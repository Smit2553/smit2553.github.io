import crypto from "node:crypto";
import {
  createBlogLike,
  getPublishedBlogPostById,
  getPublishedBlogPostBySlug,
  getPublishedBlogPostLikeCountByPostId,
  getPublishedBlogPosts,
  type PublishedBlogPostDetailRow,
  type PublishedBlogPostSummaryRow,
} from "./storage";

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
  const summary = row.summary?.trim() ?? "";

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
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

function createLikeResult(post: PublishedBlogPostSummaryRow, payload: BlogLikePayload): PublicBlogLikeResult {
  const visitorKey = readVisitorKey(payload.visitorKey ?? payload.visitor_key);

  const liked = createBlogLike({
    id: crypto.randomUUID(),
    postId: post.id,
    visitorKey,
    createdAt: nowIso(),
  });

  return {
    ok: true,
    liked,
    likeCount: getPublishedBlogPostLikeCountByPostId(post.id),
  };
}

export function listPublishedBlogPosts(limit?: number): PublicBlogPostSummary[] {
  return getPublishedBlogPosts(limit).map(toPublicBlogPostSummary);
}

export function readPublishedBlogPostBySlug(slug: string): PublicBlogPostDetail | null {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    return null;
  }

  const post = getPublishedBlogPostBySlug(normalizedSlug);

  if (!post) {
    return null;
  }

  return toPublicBlogPostDetail(post);
}

export function likePublishedBlogPostBySlug(slug: string, body: unknown): PublicBlogLikeResult {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    throw new BlogError(400, "Slug is required.");
  }

  const payload = readLikePayload(body);
  const post = getPublishedBlogPostBySlug(normalizedSlug);

  if (!post) {
    throw new BlogError(404, "Post not found.");
  }

  return createLikeResult(post, payload);
}

export function likePublishedBlogPostById(id: string, body: unknown): PublicBlogLikeResult {
  const normalizedId = normalizePostId(id);

  if (!normalizedId) {
    throw new BlogError(400, "Post id is required.");
  }

  const payload = readLikePayload(body);
  const post = getPublishedBlogPostById(normalizedId);

  if (!post) {
    throw new BlogError(404, "Post not found.");
  }

  return createLikeResult(post, payload);
}
