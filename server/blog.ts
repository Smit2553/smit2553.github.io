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

async function createLikeResult(post: PublishedBlogPostSummaryRow, visitorKey: string): Promise<PublicBlogLikeResult> {
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

export async function likePublishedBlogPostBySlug(slug: string, visitorKey: string): Promise<PublicBlogLikeResult> {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    throw new BlogError(400, "Slug is required.");
  }

  const post = await getPublishedBlogPostBySlug(normalizedSlug);

  if (!post) {
    throw new BlogError(404, "Post not found.");
  }

  return createLikeResult(post, visitorKey);
}

export async function likePublishedBlogPostById(id: string, visitorKey: string): Promise<PublicBlogLikeResult> {
  const normalizedId = normalizePostId(id);

  if (!normalizedId) {
    throw new BlogError(400, "Post id is required.");
  }

  const post = await getPublishedBlogPostById(normalizedId);

  if (!post) {
    throw new BlogError(404, "Post not found.");
  }

  return createLikeResult(post, visitorKey);
}
