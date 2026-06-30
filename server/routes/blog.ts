import { Router, type Request, type Response } from "express";
import { listPublishedBlogPosts, readPublishedBlogPostBySlug } from "../blog";

const blogRouter = Router();

blogRouter.get("/", (request: Request, response: Response) => {
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
});

blogRouter.get("/:slug", (request: Request, response: Response) => {
  const slugValue = request.params.slug;
  const slug = Array.isArray(slugValue) ? (slugValue[0] ?? "").trim() : slugValue.trim();

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
});

export default blogRouter;
