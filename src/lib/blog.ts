export type BlogListItem = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
};

export type BlogPost = BlogListItem & {
  content: string;
};

type BlogListResponse = {
  posts: BlogListItem[];
};

type BlogPostResponse = {
  post: BlogPost;
};

export class BlogApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BlogApiError";
    this.status = status;
  }
}

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    headers: {
      Accept: "application/json",
    },
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
        : "Unable to load blog content.";

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
