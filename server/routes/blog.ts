import { Router, type Request, type Response } from "express";
import {
  BlogError,
  likePublishedBlogPostById,
  likePublishedBlogPostBySlug,
  listPublishedBlogPosts,
  readPublishedBlogPostBySlug,
} from "../blog";
import {
  createPublishedBlogReplyBySlug,
  listPublishedBlogRepliesBySlug,
  ReplyError,
} from "../replies";
import { readPositiveIntegerQueryParam, readRouteParam } from "./params";

const blogRouter = Router();

function respondWithBlogError(response: Response, error: unknown, fallbackMessage: string): void {
  if (error instanceof BlogError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  response.status(500).json({ error: fallbackMessage });
}

function respondWithReplyError(response: Response, error: unknown, fallbackMessage: string): void {
  if (error instanceof ReplyError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  response.status(500).json({ error: fallbackMessage });
}

blogRouter.get("/", (request: Request, response: Response) => {
  try {
    const parsedLimit = readPositiveIntegerQueryParam(request.query.limit);

    if (parsedLimit === null) {
      response.status(400).json({ error: "limit must be a positive integer." });
      return;
    }

    const posts = listPublishedBlogPosts(parsedLimit);

    response.json({ posts });
  } catch (error) {
    respondWithBlogError(response, error, "Unable to load blog content.");
  }
});

blogRouter.get("/:slug", (request: Request, response: Response) => {
  try {
    const slug = readRouteParam(request.params.slug);

    if (slug.length === 0) {
      response.status(400).json({ error: "Slug is required." });
      return;
    }

    const post = readPublishedBlogPostBySlug(slug);

    if (!post) {
      response.status(404).json({ error: "Post not found." });
      return;
    }

    response.json({ post });
  } catch (error) {
    respondWithBlogError(response, error, "Unable to load blog content.");
  }
});

blogRouter.get("/:slug/replies", (request: Request, response: Response) => {
  try {
    const slug = readRouteParam(request.params.slug);
    const replies = listPublishedBlogRepliesBySlug(slug);

    response.json({ replies });
  } catch (error) {
    respondWithReplyError(response, error, "Unable to load replies.");
  }
});

blogRouter.post("/:slug/replies", (request: Request, response: Response) => {
  try {
    const slug = readRouteParam(request.params.slug);

    createPublishedBlogReplyBySlug(slug, request.body);
    response.json({ ok: true });
  } catch (error) {
    respondWithReplyError(response, error, "Unable to submit reply.");
  }
});

function handleLikeRequest(request: Request, response: Response): void {
  try {
    const slug = readRouteParam(request.params.slug);
    const result = likePublishedBlogPostBySlug(slug, request.body);

    response.json(result);
  } catch (error) {
    respondWithBlogError(response, error, "Unable to like blog post.");
  }
}

function handleLikeRequestById(request: Request, response: Response): void {
  try {
    const id = readRouteParam(request.params.id);
    const result = likePublishedBlogPostById(id, request.body);

    response.json(result);
  } catch (error) {
    respondWithBlogError(response, error, "Unable to like blog post.");
  }
}

blogRouter.post("/:slug/likes", handleLikeRequest);
blogRouter.post("/:slug/like", handleLikeRequest);
blogRouter.post("/id/:id/likes", handleLikeRequestById);

export default blogRouter;
