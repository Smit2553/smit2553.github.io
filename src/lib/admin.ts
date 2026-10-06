export type AdminPostStatus = "draft" | "published" | "archived";

export type AdminReplyStatus = "pending" | "approved" | "rejected";

export type AdminReplyModerationStatus = Exclude<AdminReplyStatus, "pending">;

export interface AdminPostSummary {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  status: AdminPostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPost extends AdminPostSummary {
  content: string;
}

export interface AdminPostInput {
  slug: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  content: string;
  status: AdminPostStatus;
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
  status: AdminReplyStatus;
  moderation: {
    flagged: boolean;
    reasons: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export class AdminApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

const adminDraftStoragePrefix = "admin-post-editor:";

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

function isAdminPostStatus(value: unknown): value is AdminPostStatus {
  return value === "draft" || value === "published" || value === "archived";
}

function isAdminReplyStatus(value: unknown): value is AdminReplyStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

function isAdminPostSummary(value: unknown): value is AdminPostSummary {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.slug === "string" &&
    typeof value.title === "string" &&
    isNullableString(value.summary) &&
    isNullableString(value.coverImageUrl) &&
    isAdminPostStatus(value.status) &&
    isNullableString(value.publishedAt) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isAdminPost(value: unknown): value is AdminPost {
  return isAdminPostSummary(value) && typeof (value as unknown as Record<string, unknown>).content === "string";
}

function isAdminReplyPost(value: unknown): value is AdminReplyPost {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.slug === "string" &&
    typeof value.title === "string" &&
    isNullableString(value.summary) &&
    typeof value.status === "string" &&
    isNullableString(value.publishedAt) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isAdminReply(value: unknown): value is AdminReply {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isAdminReplyPost(value.post) &&
    isNullableString(value.parentReplyId) &&
    typeof value.authorName === "string" &&
    isNullableString(value.authorEmail) &&
    typeof value.body === "string" &&
    isAdminReplyStatus(value.status) &&
    isRecord(value.moderation) &&
    typeof value.moderation.flagged === "boolean" &&
    Array.isArray(value.moderation.reasons) &&
    value.moderation.reasons.every((reason) => typeof reason === "string") &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

export function clearAllAdminPostDrafts(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const keysToRemove: string[] = [];

    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);

      if (key && key.startsWith(adminDraftStoragePrefix)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore sessionStorage errors during draft cleanup.
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (text.length === 0) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function readErrorMessage(body: unknown, fallbackMessage: string): string {
  if (typeof body === "object" && body !== null) {
    const error = (body as { error?: unknown }).error;

    if (typeof error === "string" && error.trim().length > 0) {
      return error;
    }

    const message = (body as { message?: unknown }).message;

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  if (typeof body === "string" && body.trim().length > 0) {
    return body;
  }

  return fallbackMessage;
}

const adminTimestampFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

async function requestAdmin(path: string, init: RequestInit = {}, fallbackMessage = "Unable to load admin data."): Promise<unknown> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body !== undefined && init.body !== null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    credentials: "include",
    headers,
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new AdminApiError(response.status, readErrorMessage(body, fallbackMessage));
  }

  return body;
}

export async function fetchAdminHealth(signal?: AbortSignal): Promise<void> {
  await requestAdmin("/api/admin/health", { method: "GET", signal }, "Unable to verify admin session.");
}

export async function loginAdmin(username: string, password: string): Promise<void> {
  await requestAdmin(
    "/api/admin/login",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    },
    "Unable to sign in.",
  );
}

export async function logoutAdmin(): Promise<void> {
  try {
    await requestAdmin("/api/admin/logout", { method: "POST" }, "Unable to sign out.");
  } finally {
    clearAllAdminPostDrafts();
  }
}

export async function fetchAdminPosts(signal?: AbortSignal): Promise<AdminPostSummary[]> {
  const response = await requestAdmin("/api/admin/posts", { method: "GET", signal }, "Unable to load posts.");

  if (!isRecord(response) || !Array.isArray(response.posts) || !response.posts.every(isAdminPostSummary)) {
    throw new AdminApiError(502, "Received an invalid admin posts response.");
  }

  return response.posts;
}

export async function fetchAdminPost(id: string, signal?: AbortSignal): Promise<AdminPost> {
  const response = await requestAdmin(
    `/api/admin/posts/${encodeURIComponent(id)}`,
    { method: "GET", signal },
    "Unable to load the post.",
  );

  if (!isRecord(response) || !isAdminPost(response.post)) {
    throw new AdminApiError(502, "Received an invalid admin post response.");
  }

  return response.post;
}

export async function createAdminPost(post: AdminPostInput): Promise<void> {
  await requestAdmin(
    "/api/admin/posts",
    {
      method: "POST",
      body: JSON.stringify(post),
    },
    "Unable to save the post.",
  );
}

export async function updateAdminPost(id: string, post: AdminPostInput): Promise<void> {
  await requestAdmin(
    `/api/admin/posts/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(post),
    },
    "Unable to save the post.",
  );
}

export async function deleteAdminPost(id: string): Promise<void> {
  await requestAdmin(
    `/api/admin/posts/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    "Unable to delete the post.",
  );
}

export async function fetchAdminReplies(signal?: AbortSignal): Promise<AdminReply[]> {
  const response = await requestAdmin(
    "/api/admin/replies",
    { method: "GET", signal },
    "Unable to load replies.",
  );

  if (!isRecord(response) || !Array.isArray(response.replies) || !response.replies.every(isAdminReply)) {
    throw new AdminApiError(502, "Received an invalid admin replies response.");
  }

  return response.replies;
}

export async function updateAdminReplyStatus(id: string, status: AdminReplyModerationStatus): Promise<void> {
  await requestAdmin(
    `/api/admin/replies/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    "Unable to update the reply.",
  );
}

export async function deleteAdminReply(id: string): Promise<void> {
  await requestAdmin(
    `/api/admin/replies/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    "Unable to delete the reply.",
  );
}

export function formatAdminTimestamp(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return adminTimestampFormatter.format(date);
}

export function getAdminErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load admin data.";
}

export function getAdminReturnPath(state: unknown): string | undefined {
  if (typeof state !== "object" || state === null || !("from" in state)) {
    return undefined;
  }

  const from = (state as { from?: unknown }).from;

  if (typeof from !== "string") {
    return undefined;
  }

  const normalized = from.trim();

  if (!normalized.startsWith("/admin") || normalized === "/admin/login") {
    return undefined;
  }

  return normalized;
}
