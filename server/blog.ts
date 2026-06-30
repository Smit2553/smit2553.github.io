import {
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
  type PublishedBlogPostDetailRow,
  type PublishedBlogPostSummaryRow,
} from "./storage";

export interface PublicBlogPostSummary {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
}

export interface PublicBlogPostDetail extends PublicBlogPostSummary {
  content: string;
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
  };
}

function toPublicBlogPostDetail(row: PublishedBlogPostDetailRow): PublicBlogPostDetail {
  return {
    ...toPublicBlogPostSummary(row),
    content: row.content,
  };
}

export function listPublishedBlogPosts(limit?: number): PublicBlogPostSummary[] {
  return getPublishedBlogPosts(limit).map(toPublicBlogPostSummary);
}

export function readPublishedBlogPostBySlug(slug: string): PublicBlogPostDetail | null {
  const normalizedSlug = slug.trim();

  if (normalizedSlug.length === 0) {
    return null;
  }

  const post = getPublishedBlogPostBySlug(normalizedSlug);

  if (!post) {
    return null;
  }

  return toPublicBlogPostDetail(post);
}
