import { Router, type Request, type Response } from "express";
import {
  BlogError,
  likePublishedBlogPostById,
  likePublishedBlogPostBySlug,
  listPublishedBlogPosts,
  readPublishedBlogPostBySlug,
} from "../blog";

const blogRouter = Router();

function readSlugParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function readPostIdParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function respondWithBlogError(response: Response, error: unknown, fallbackMessage: string): void {
  if (error instanceof BlogError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  response.status(500).json({ error: fallbackMessage });
}

blogRouter.get("/", (request: Request, response: Response) => {
  try {
    const { limit } = request.query;

    if (Array.isArray(limit)) {
      response.status(400).json({ error: "limit must be a positive integer." });
      return;
    }

    let parsedLimit: number | undefined;

    if (typeof limit === "string" && limit.length > 0) {
      const numericLimit = Number(limit);

      if (!Number.isInteger(numericLimit) || numericLimit <= 0) {
        response.status(400).json({ error: "limit must be a positive integer." });
        return;
      }

      parsedLimit = numericLimit;
    }

    const posts = listPublishedBlogPosts(parsedLimit);

    response.json({ posts });
  } catch (error) {
    respondWithBlogError(response, error, "Unable to load blog content.");
  }
});

blogRouter.get("/:slug", (request: Request, response: Response) => {
  try {
    const slug = readSlugParam(request.params.slug).trim();

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

function handleLikeRequest(request: Request, response: Response): void {
  try {
    const slug = readSlugParam(request.params.slug);
    const result = likePublishedBlogPostBySlug(slug, request.body);

    response.json(result);
  } catch (error) {
    respondWithBlogError(response, error, "Unable to like blog post.");
  }
}

function handleLikeRequestById(request: Request, response: Response): void {
  try {
    const id = readPostIdParam(request.params.id);
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
