import { Router, type NextFunction, type Request, type Response } from "express";
import { assertRateLimit, RateLimitError } from "../rate-limit";
import {
  BlogError,
  likePublishedBlogPostById,
  likePublishedBlogPostBySlug,
  listPublishedBlogPosts,
  readPublishedBlogPostBySlug,
} from "../blog";
import {
  createPublishedBlogReplyBySlug,
  likePublishedBlogReplyBySlug,
  listPublishedBlogRepliesBySlug,
  ReplyError,
} from "../replies";
import { getOrCreateVisitorId } from "../visitor";
import { readPositiveIntegerQueryParam, readRouteParam } from "./params";

const blogRouter = Router();
const defaultPostLimit = 50;
const maximumPostLimit = 100;

function respondWithBlogError(response: Response, error: unknown, next: NextFunction): void {
  if (error instanceof RateLimitError) {
    response.set("Retry-After", String(error.retryAfterSeconds));
    response.status(error.status).json({ error: error.message });
    return;
  }

  if (error instanceof BlogError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  next(error);
}

function respondWithReplyError(response: Response, error: unknown, next: NextFunction): void {
  if (error instanceof RateLimitError) {
    response.set("Retry-After", String(error.retryAfterSeconds));
    response.status(error.status).json({ error: error.message });
    return;
  }

  if (error instanceof ReplyError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  next(error);
}

blogRouter.get("/", async (request: Request, response: Response, next: NextFunction) => {
  try {
    const parsedLimit = readPositiveIntegerQueryParam(request.query.limit, maximumPostLimit);

    if (parsedLimit === null) {
      response.status(400).json({ error: `limit must be an integer between 1 and ${maximumPostLimit}.` });
      return;
    }

    const posts = await listPublishedBlogPosts(parsedLimit ?? defaultPostLimit);

    response.json({ posts });
  } catch (error) {
    respondWithBlogError(response, error, next);
  }
});

blogRouter.get("/:slug", async (request: Request, response: Response, next: NextFunction) => {
  try {
    const slug = readRouteParam(request.params.slug);

    if (slug.length === 0) {
      response.status(400).json({ error: "Slug is required." });
      return;
    }

    const post = await readPublishedBlogPostBySlug(slug);

    if (!post) {
      response.status(404).json({ error: "Post not found." });
      return;
    }

    response.json({ post });
  } catch (error) {
    respondWithBlogError(response, error, next);
  }
});

blogRouter.get("/:slug/replies", async (request: Request, response: Response, next: NextFunction) => {
  try {
    const slug = readRouteParam(request.params.slug);
    const replies = await listPublishedBlogRepliesBySlug(slug);

    response.json({ replies });
  } catch (error) {
    respondWithReplyError(response, error, next);
  }
});

blogRouter.post("/:slug/replies", async (request: Request, response: Response, next: NextFunction) => {
  try {
    const slug = readRouteParam(request.params.slug);
    assertRateLimit(request, "reply:create", 5, 1000 * 60 * 10);

    await createPublishedBlogReplyBySlug(slug, request.body);
    response.json({ ok: true });
  } catch (error) {
    respondWithReplyError(response, error, next);
  }
});

blogRouter.post("/:slug/replies/:replyId/likes", async (request: Request, response: Response, next: NextFunction) => {
  try {
    const slug = readRouteParam(request.params.slug);
    const replyId = readRouteParam(request.params.replyId);
    const visitorId = getOrCreateVisitorId(request, response);
    assertRateLimit(request, "reply:like:ip", 60, 1000 * 60 * 60);
    assertRateLimit(request, "reply:like", 30, 1000 * 60 * 60, visitorId);
    const result = await likePublishedBlogReplyBySlug(slug, replyId, visitorId);

    response.json(result);
  } catch (error) {
    respondWithReplyError(response, error, next);
  }
});

async function handleLikeRequest(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const slug = readRouteParam(request.params.slug);
    const visitorId = getOrCreateVisitorId(request, response);
    assertRateLimit(request, "post:like:ip", 60, 1000 * 60 * 60);
    assertRateLimit(request, "post:like", 30, 1000 * 60 * 60, visitorId);
    const result = await likePublishedBlogPostBySlug(slug, visitorId);

    response.json(result);
  } catch (error) {
    respondWithBlogError(response, error, next);
  }
}

async function handleLikeRequestById(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const id = readRouteParam(request.params.id);
    const visitorId = getOrCreateVisitorId(request, response);
    assertRateLimit(request, "post:like:ip", 60, 1000 * 60 * 60);
    assertRateLimit(request, "post:like", 30, 1000 * 60 * 60, visitorId);
    const result = await likePublishedBlogPostById(id, visitorId);

    response.json(result);
  } catch (error) {
    respondWithBlogError(response, error, next);
  }
}

blogRouter.post("/:slug/likes", handleLikeRequest);
blogRouter.post("/:slug/like", handleLikeRequest);
blogRouter.post("/id/:id/likes", handleLikeRequestById);

export default blogRouter;
