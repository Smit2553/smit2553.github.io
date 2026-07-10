import { Router, type Request, type Response } from "express";
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

function respondWithBlogError(response: Response, error: unknown, fallbackMessage: string): void {
  if (error instanceof RateLimitError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  if (error instanceof BlogError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  response.status(500).json({ error: fallbackMessage });
}

function respondWithReplyError(response: Response, error: unknown, fallbackMessage: string): void {
  if (error instanceof RateLimitError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  if (error instanceof ReplyError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  response.status(500).json({ error: fallbackMessage });
}

blogRouter.get("/", async (request: Request, response: Response) => {
  try {
    const parsedLimit = readPositiveIntegerQueryParam(request.query.limit);

    if (parsedLimit === null) {
      response.status(400).json({ error: "limit must be a positive integer." });
      return;
    }

    const posts = await listPublishedBlogPosts(parsedLimit);

    response.json({ posts });
  } catch (error) {
    respondWithBlogError(response, error, "Unable to load blog content.");
  }
});

blogRouter.get("/:slug", async (request: Request, response: Response) => {
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
    respondWithBlogError(response, error, "Unable to load blog content.");
  }
});

blogRouter.get("/:slug/replies", async (request: Request, response: Response) => {
  try {
    const slug = readRouteParam(request.params.slug);
    const replies = await listPublishedBlogRepliesBySlug(slug);

    response.json({ replies });
  } catch (error) {
    respondWithReplyError(response, error, "Unable to load replies.");
  }
});

blogRouter.post("/:slug/replies", async (request: Request, response: Response) => {
  try {
    const slug = readRouteParam(request.params.slug);
    assertRateLimit(request, "reply:create", 5, 1000 * 60 * 10);

    await createPublishedBlogReplyBySlug(slug, request.body);
    response.json({ ok: true });
  } catch (error) {
    respondWithReplyError(response, error, "Unable to submit reply.");
  }
});

blogRouter.post("/:slug/replies/:replyId/likes", async (request: Request, response: Response) => {
  try {
    const slug = readRouteParam(request.params.slug);
    const replyId = readRouteParam(request.params.replyId);
    const visitorId = getOrCreateVisitorId(request, response);
    assertRateLimit(request, "reply:like:ip", 60, 1000 * 60 * 60);
    assertRateLimit(request, "reply:like", 30, 1000 * 60 * 60, visitorId);
    const result = await likePublishedBlogReplyBySlug(slug, replyId, visitorId);

    response.json(result);
  } catch (error) {
    respondWithReplyError(response, error, "Unable to like reply.");
  }
});

async function handleLikeRequest(request: Request, response: Response): Promise<void> {
  try {
    const slug = readRouteParam(request.params.slug);
    const visitorId = getOrCreateVisitorId(request, response);
    assertRateLimit(request, "post:like:ip", 60, 1000 * 60 * 60);
    assertRateLimit(request, "post:like", 30, 1000 * 60 * 60, visitorId);
    const result = await likePublishedBlogPostBySlug(slug, visitorId);

    response.json(result);
  } catch (error) {
    respondWithBlogError(response, error, "Unable to like blog post.");
  }
}

async function handleLikeRequestById(request: Request, response: Response): Promise<void> {
  try {
    const id = readRouteParam(request.params.id);
    const visitorId = getOrCreateVisitorId(request, response);
    assertRateLimit(request, "post:like:ip", 60, 1000 * 60 * 60);
    assertRateLimit(request, "post:like", 30, 1000 * 60 * 60, visitorId);
    const result = await likePublishedBlogPostById(id, visitorId);

    response.json(result);
  } catch (error) {
    respondWithBlogError(response, error, "Unable to like blog post.");
  }
}

blogRouter.post("/:slug/likes", handleLikeRequest);
blogRouter.post("/:slug/like", handleLikeRequest);
blogRouter.post("/id/:id/likes", handleLikeRequestById);

export default blogRouter;
