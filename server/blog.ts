import crypto from "node:crypto";
import {
  getPublishedBlogPostBySlug,
  getPublishedBlogPostIdById,
  getPublishedBlogPostIdBySlug,
  getPublishedBlogPostMetaBySlug,
  getPublishedBlogPosts,
  getSitemapPublishedPosts,
  toggleBlogLike,
  type PublishedBlogPostDetailRow,
  type PublishedBlogPostMetaRow,
  type PublishedBlogPostSummaryRow,
  type SitemapPublishedPostRow,
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

export interface PublicBlogPostMeta {
  slug: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  excerpt: string;
}

export interface SitemapPublishedBlogPost {
  slug: string;
  publishedAt: string;
  updatedAt: string;
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

function toExcerpt(summary: string): string {
  return summary.length === 0
    ? "No preview available yet."
    : summary.length <= 180
      ? summary
      : `${summary.slice(0, 177).trimEnd()}...`;
}

function toPublicBlogPostSummary(row: PublishedBlogPostSummaryRow): PublicBlogPostSummary {
  const normalizedSummary = normalizeNullableText(row.summary);
  const summary = normalizedSummary ?? "";

  return {
    id: row.id,
    slug: normalizeText(row.slug),
    title: normalizeText(row.title),
    summary: normalizedSummary,
    coverImageUrl: normalizeNullableText(row.cover_image_url),
    excerpt: toExcerpt(summary),
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

function toPublicBlogPostMeta(row: PublishedBlogPostMetaRow): PublicBlogPostMeta {
  const normalizedSummary = normalizeNullableText(row.summary);
  const summary = normalizedSummary ?? "";

  return {
    slug: normalizeText(row.slug),
    title: normalizeText(row.title),
    summary: normalizedSummary,
    coverImageUrl: normalizeNullableText(row.cover_image_url),
    excerpt: toExcerpt(summary),
  };
}

function toSitemapPublishedBlogPost(row: SitemapPublishedPostRow): SitemapPublishedBlogPost {
  return {
    slug: normalizeText(row.slug),
    publishedAt: row.published_at ?? row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createLikeResult(postId: string, visitorKey: string): Promise<PublicBlogLikeResult> {
  const { liked, likeCount } = await toggleBlogLike({
    id: crypto.randomUUID(),
    postId,
    visitorKey,
    createdAt: nowIso(),
  });

  return {
    ok: true,
    liked,
    likeCount,
  };
}

export async function listPublishedBlogPosts(limit?: number): Promise<PublicBlogPostSummary[]> {
  return (await getPublishedBlogPosts(limit)).map(toPublicBlogPostSummary);
}

export async function listSitemapPublishedPosts(limit?: number): Promise<SitemapPublishedBlogPost[]> {
  return (await getSitemapPublishedPosts(limit)).map(toSitemapPublishedBlogPost);
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

export async function readPublishedBlogPostMetaBySlug(slug: string): Promise<PublicBlogPostMeta | null> {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    return null;
  }

  const post = await getPublishedBlogPostMetaBySlug(normalizedSlug);

  if (!post) {
    return null;
  }

  return toPublicBlogPostMeta(post);
}

export async function likePublishedBlogPostBySlug(slug: string, visitorKey: string): Promise<PublicBlogLikeResult> {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    throw new BlogError(400, "Slug is required.");
  }

  const post = await getPublishedBlogPostIdBySlug(normalizedSlug);

  if (!post) {
    throw new BlogError(404, "Post not found.");
  }

  return createLikeResult(post.id, visitorKey);
}

export async function likePublishedBlogPostById(id: string, visitorKey: string): Promise<PublicBlogLikeResult> {
  const normalizedId = normalizePostId(id);

  if (!normalizedId) {
    throw new BlogError(400, "Post id is required.");
  }

  const post = await getPublishedBlogPostIdById(normalizedId);

  if (!post) {
    throw new BlogError(404, "Post not found.");
  }

  return createLikeResult(post.id, visitorKey);
}
