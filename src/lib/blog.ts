export type BlogListItem = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  likeCount: number;
};

export type BlogPost = BlogListItem & {
  content: string;
};

export type BlogLikeResult = {
  ok: true;
  liked: boolean;
  likeCount: number;
};

export type BlogReply = {
  id: string;
  parentReplyId: string | null;
  authorName: string;
  body: string;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
};

type BlogReplySubmission = {
  authorName: string;
  body: string;
  parentReplyId?: string | null;
  website?: string;
};

type BlogListResponse = {
  posts: BlogListItem[];
};

type BlogPostResponse = {
  post: BlogPost;
};

type BlogLikeResponse = BlogLikeResult;

type BlogRepliesResponse = {
  replies: BlogReply[];
};

type BlogReplySubmissionResponse = {
  ok: true;
};

const likedPostStorageKey = "blog:liked-post-ids";
const legacyLikedPostCookieName = "blog-liked-post-ids";
const likedReplyStorageKey = "blog:liked-reply-ids";
const legacyLikedReplyCookieName = "blog-liked-reply-ids";

let likedPostIdsCache: Set<string> | null = null;
let likedReplyIdsCache: Set<string> | null = null;

export class BlogApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BlogApiError";
    this.status = status;
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isBlogListItem(value: unknown): value is BlogListItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.slug === "string" &&
    typeof value.title === "string" &&
    isNullableString(value.summary) &&
    isNullableString(value.coverImageUrl) &&
    typeof value.excerpt === "string" &&
    typeof value.publishedAt === "string" &&
    typeof value.updatedAt === "string" &&
    typeof value.likeCount === "number" &&
    Number.isFinite(value.likeCount)
  );
}

function isBlogPost(value: unknown): value is BlogPost {
  return isBlogListItem(value) && typeof (value as Record<string, unknown>).content === "string";
}

function isBlogReply(value: unknown): value is BlogReply {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isNullableString(value.parentReplyId) &&
    typeof value.authorName === "string" &&
    typeof value.body === "string" &&
    typeof value.likeCount === "number" &&
    Number.isFinite(value.likeCount) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isBlogLikeResult(value: unknown): value is BlogLikeResult {
  return (
    isRecord(value) &&
    value.ok === true &&
    typeof value.liked === "boolean" &&
    typeof value.likeCount === "number" &&
    Number.isFinite(value.likeCount)
  );
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  fallbackErrorMessage = "Unable to load blog content.",
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body !== undefined && init.body !== null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    cache: init?.method && init.method !== "GET" ? "no-store" : "no-cache",
    headers,
  });

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error?: unknown }).error === "string"
        ? (body as { error: string }).error
        : fallbackErrorMessage;

    throw new BlogApiError(response.status, message);
  }

  return body as T;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatBlogDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateFormatter.format(date);
}

export function getBlogErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load blog content.";
}

function readCookieValue(cookieName: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookiePrefix = `${encodeURIComponent(cookieName)}=`;

  for (const cookieChunk of document.cookie.split(";")) {
    const cookie = cookieChunk.trim();

    if (!cookie.startsWith(cookiePrefix)) {
      continue;
    }

    try {
      return decodeURIComponent(cookie.slice(cookiePrefix.length));
    } catch {
      return null;
    }
  }

  return null;
}

function clearLegacyCookie(cookieName: string): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${encodeURIComponent(cookieName)}=; path=/; Max-Age=0; samesite=lax`;
}

function hydrateLikedIdSet(storageKey: string, legacyCookieName: string): Set<string> {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  let storedValue: string | null = null;

  try {
    storedValue = window.localStorage.getItem(storageKey);
  } catch {
    storedValue = null;
  }

  const cookieValue = readCookieValue(legacyCookieName);

  if (storedValue === null && cookieValue !== null) {
    storedValue = cookieValue;

    try {
      window.localStorage.setItem(storageKey, cookieValue);
    } catch {
      // Ignore storage write failures when migrating legacy cookies.
    }
  }

  if (cookieValue !== null) {
    clearLegacyCookie(legacyCookieName);
  }

  if (!storedValue) {
    return new Set<string>();
  }

  try {
    const parsed = JSON.parse(storedValue) as unknown;

    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
      return new Set<string>();
    }

    return new Set(
      parsed.map((item) => item.trim()).filter((item) => item.length > 0),
    );
  } catch {
    return new Set<string>();
  }
}

function persistLikedIdSet(storageKey: string, ids: Set<string>): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(Array.from(ids)));
  } catch {
    // Keep the in-memory Set updated even if localStorage is unavailable.
  }
}

function getLikedPostIds(): Set<string> {
  if (likedPostIdsCache === null) {
    likedPostIdsCache = hydrateLikedIdSet(likedPostStorageKey, legacyLikedPostCookieName);
  }

  return likedPostIdsCache;
}

function getLikedReplyIds(): Set<string> {
  if (likedReplyIdsCache === null) {
    likedReplyIdsCache = hydrateLikedIdSet(likedReplyStorageKey, legacyLikedReplyCookieName);
  }

  return likedReplyIdsCache;
}

function normalizeId(value: string): string {
  return value.trim();
}

export function hasLikedBlogPost(postId: string): boolean {
  const normalizedPostId = normalizeId(postId);

  if (normalizedPostId.length === 0) {
    return false;
  }

  return getLikedPostIds().has(normalizedPostId);
}

export function markBlogPostLiked(postId: string): void {
  const normalizedPostId = normalizeId(postId);

  if (normalizedPostId.length === 0) {
    return;
  }

  const likedPostIds = getLikedPostIds();

  if (likedPostIds.has(normalizedPostId)) {
    return;
  }

  likedPostIds.add(normalizedPostId);
  persistLikedIdSet(likedPostStorageKey, likedPostIds);
}

export function unmarkBlogPostLiked(postId: string): void {
  const normalizedPostId = normalizeId(postId);

  if (normalizedPostId.length === 0) {
    return;
  }

  const likedPostIds = getLikedPostIds();

  if (!likedPostIds.delete(normalizedPostId)) {
    return;
  }

  persistLikedIdSet(likedPostStorageKey, likedPostIds);
}

export function hasLikedBlogReply(replyId: string): boolean {
  const normalizedReplyId = normalizeId(replyId);

  if (normalizedReplyId.length === 0) {
    return false;
  }

  return getLikedReplyIds().has(normalizedReplyId);
}

export function markBlogReplyLiked(replyId: string): void {
  const normalizedReplyId = normalizeId(replyId);

  if (normalizedReplyId.length === 0) {
    return;
  }

  const likedReplyIds = getLikedReplyIds();

  if (likedReplyIds.has(normalizedReplyId)) {
    return;
  }

  likedReplyIds.add(normalizedReplyId);
  persistLikedIdSet(likedReplyStorageKey, likedReplyIds);
}

export function unmarkBlogReplyLiked(replyId: string): void {
  const normalizedReplyId = normalizeId(replyId);

  if (normalizedReplyId.length === 0) {
    return;
  }

  const likedReplyIds = getLikedReplyIds();

  if (!likedReplyIds.delete(normalizedReplyId)) {
    return;
  }

  persistLikedIdSet(likedReplyStorageKey, likedReplyIds);
}

export async function fetchBlogPosts(
  limit?: number,
  signal?: AbortSignal,
): Promise<BlogListItem[]> {
  const query = typeof limit === "number" ? `?limit=${limit}` : "";
  const response = await requestJson<BlogListResponse>(`/api/posts${query}`, { signal });

  if (!isRecord(response) || !Array.isArray(response.posts) || !response.posts.every(isBlogListItem)) {
    throw new BlogApiError(502, "Received an invalid blog posts response.");
  }

  return response.posts;
}

export async function fetchBlogPost(
  slug: string,
  signal?: AbortSignal,
): Promise<BlogPost | null> {
  try {
    const response = await requestJson<BlogPostResponse>(
      `/api/posts/${encodeURIComponent(slug)}`,
      { signal },
    );

    if (!isRecord(response) || !isBlogPost(response.post)) {
      throw new BlogApiError(502, "Received an invalid blog post response.");
    }

    return response.post;
  } catch (error) {
    if (error instanceof BlogApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function fetchBlogReplies(
  slug: string,
  signal?: AbortSignal,
): Promise<BlogReply[]> {
  const response = await requestJson<BlogRepliesResponse>(
    `/api/posts/${encodeURIComponent(slug)}/replies`,
    { signal },
    "Unable to load replies.",
  );

  if (!isRecord(response) || !Array.isArray(response.replies) || !response.replies.every(isBlogReply)) {
    throw new BlogApiError(502, "Received an invalid replies response.");
  }

  return response.replies;
}

export async function submitBlogReply(slug: string, reply: BlogReplySubmission): Promise<void> {
  const response = await requestJson<BlogReplySubmissionResponse>(
    `/api/posts/${encodeURIComponent(slug)}/replies`,
    {
      method: "POST",
      body: JSON.stringify(reply),
    },
    "Unable to submit reply.",
  );

  if (!isRecord(response) || response.ok !== true) {
    throw new BlogApiError(502, "Unable to submit reply.");
  }
}

export const createBlogReply = submitBlogReply;

async function requestBlogLike(
  path: string,
  fallbackErrorMessage = "Unable to like blog post.",
): Promise<BlogLikeResult> {
  const response = await requestJson<BlogLikeResponse>(
    path,
    {
      method: "POST",
    },
    fallbackErrorMessage,
  );

  if (!isBlogLikeResult(response)) {
    throw new BlogApiError(502, fallbackErrorMessage);
  }

  return response;
}

export async function likeBlogPostById(
  postId: string,
): Promise<BlogLikeResult> {
  return requestBlogLike(
    `/api/posts/id/${encodeURIComponent(postId)}/likes`,
    "Unable to like blog post.",
  );
}

export async function likeBlogReply(
  slug: string,
  replyId: string,
): Promise<BlogLikeResult> {
  return requestBlogLike(
    `/api/posts/${encodeURIComponent(slug)}/replies/${encodeURIComponent(replyId)}/likes`,
    "Unable to like reply.",
  );
}
