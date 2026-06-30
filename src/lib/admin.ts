export type AdminPostStatus = "draft" | "published";

export interface AdminPostSummary {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
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
  content: string;
  status: AdminPostStatus;
}

export class AdminApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

type AdminPostsResponse = {
  posts: AdminPostSummary[];
};

type AdminPostResponse = {
  post: AdminPost;
};

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

export async function fetchAdminHealth(): Promise<void> {
  await requestAdmin("/api/admin/health", { method: "GET" }, "Unable to verify admin session.");
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
  await requestAdmin("/api/admin/logout", { method: "POST" }, "Unable to sign out.");
}

export async function fetchAdminPosts(): Promise<AdminPostSummary[]> {
  const response = (await requestAdmin("/api/admin/posts", { method: "GET" }, "Unable to load posts.")) as AdminPostsResponse;

  return response.posts;
}

export async function fetchAdminPost(id: string): Promise<AdminPost> {
  const response = (await requestAdmin(
    `/api/admin/posts/${encodeURIComponent(id)}`,
    { method: "GET" },
    "Unable to load the post.",
  )) as AdminPostResponse;

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
