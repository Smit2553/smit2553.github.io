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
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type BlogReplySubmission = {
  authorName: string;
  body: string;
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

const visitorKeyStorageKey = "blog:visitor-key";
const visitorKeyCookieName = "blog-visitor-key";
const likedPostStorageKey = "blog:liked-post-ids";
const likedPostCookieName = "blog-liked-post-ids";
const cookieMaxAgeSeconds = 60 * 60 * 24 * 365;
const visitorKeyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class BlogApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BlogApiError";
    this.status = status;
  }
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
    cache: "no-store",
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

function createVisitorKey(): string {
  const visitorKey = globalThis.crypto?.randomUUID?.();

  if (!visitorKey) {
    throw new Error("Unable to generate a visitor key.");
  }

  return visitorKey;
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

function writeCookieValue(cookieName: string, value: string): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${encodeURIComponent(cookieName)}=${encodeURIComponent(value)}; path=/; max-age=${cookieMaxAgeSeconds}; samesite=lax`;
}

function readPersistedValue(storageKey: string, cookieName: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey);

    if (storedValue !== null) {
      return storedValue;
    }
  } catch {
    // Fall through to the cookie fallback.
  }

  const cookieValue = readCookieValue(cookieName);

  if (cookieValue !== null) {
    try {
      window.localStorage.setItem(storageKey, cookieValue);
    } catch {
      // Ignore storage failures and keep using the cookie.
    }
  }

  return cookieValue;
}

function writePersistedValue(storageKey: string, cookieName: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, value);
  } catch {
    // Keep the cookie fallback in sync even if localStorage is unavailable.
  }

  writeCookieValue(cookieName, value);
}

export function getBlogVisitorKey(): string {
  if (typeof window === "undefined") {
    return createVisitorKey();
  }

  const storedKey = readPersistedValue(visitorKeyStorageKey, visitorKeyCookieName);

  if (storedKey) {
    const normalizedKey = storedKey.trim().toLowerCase();

    if (visitorKeyPattern.test(normalizedKey)) {
      return normalizedKey;
    }
  }

  const visitorKey = createVisitorKey();

  writePersistedValue(visitorKeyStorageKey, visitorKeyCookieName, visitorKey);

  return visitorKey;
}

function readLikedBlogPostIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue = readPersistedValue(likedPostStorageKey, likedPostCookieName);

  if (!storedValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedValue) as unknown;

    if (!Array.isArray(parsed) || !parsed.every((postId) => typeof postId === "string")) {
      return [];
    }

    return parsed.map((postId) => postId.trim()).filter((postId) => postId.length > 0);
  } catch {
    return [];
  }
}

function writeLikedBlogPostIds(postIds: string[]): void {
  if (typeof window === "undefined") {
    return;
  }

  writePersistedValue(likedPostStorageKey, likedPostCookieName, JSON.stringify(postIds));
}

function normalizePostId(postId: string): string {
  return postId.trim();
}

export function hasLikedBlogPost(postId: string): boolean {
  const normalizedPostId = normalizePostId(postId);

  if (normalizedPostId.length === 0) {
    return false;
  }

  return readLikedBlogPostIds().includes(normalizedPostId);
}

export function markBlogPostLiked(postId: string): void {
  const normalizedPostId = normalizePostId(postId);

  if (normalizedPostId.length === 0) {
    return;
  }

  const likedPostIds = readLikedBlogPostIds();

  if (likedPostIds.includes(normalizedPostId)) {
    return;
  }

  writeLikedBlogPostIds([...likedPostIds, normalizedPostId]);
}

export function unmarkBlogPostLiked(postId: string): void {
  const normalizedPostId = normalizePostId(postId);

  if (normalizedPostId.length === 0) {
    return;
  }

  writeLikedBlogPostIds(readLikedBlogPostIds().filter((likedPostId) => likedPostId !== normalizedPostId));
}

export async function fetchBlogPosts(limit?: number): Promise<BlogListItem[]> {
  const query = typeof limit === "number" ? `?limit=${limit}` : "";
  const response = await requestJson<BlogListResponse>(`/api/posts${query}`);

  return response.posts;
}

export async function fetchBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await requestJson<BlogPostResponse>(
      `/api/posts/${encodeURIComponent(slug)}`,
    );

    return response.post;
  } catch (error) {
    if (error instanceof BlogApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function fetchBlogReplies(slug: string): Promise<BlogReply[]> {
  const response = await requestJson<BlogRepliesResponse>(
    `/api/posts/${encodeURIComponent(slug)}/replies`,
    {},
    "Unable to load replies.",
  );

  return response.replies;
}

export async function submitBlogReply(slug: string, reply: BlogReplySubmission): Promise<void> {
  await requestJson<BlogReplySubmissionResponse>(
    `/api/posts/${encodeURIComponent(slug)}/replies`,
    {
      method: "POST",
      body: JSON.stringify(reply),
    },
    "Unable to submit reply.",
  );
}

async function requestBlogLike(path: string, visitorKey: string): Promise<BlogLikeResult> {
  const response = await requestJson<BlogLikeResponse>(
    path,
    {
      method: "POST",
      body: JSON.stringify({ visitorKey }),
    },
    "Unable to like blog post.",
  );

  return response;
}

export async function likeBlogPost(
  slug: string,
  visitorKey = getBlogVisitorKey(),
): Promise<BlogLikeResult> {
  return requestBlogLike(`/api/posts/${encodeURIComponent(slug)}/likes`, visitorKey);
}

export async function likeBlogPostById(
  postId: string,
  visitorKey = getBlogVisitorKey(),
): Promise<BlogLikeResult> {
  return requestBlogLike(`/api/posts/id/${encodeURIComponent(postId)}/likes`, visitorKey);
}
