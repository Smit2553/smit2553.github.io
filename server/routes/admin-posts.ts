import { Router, type Request, type Response } from "express";
import {
  AdminPostError,
  createAdminPost,
  deleteAdminPost,
  listAdminPosts,
  readAdminPostById,
  updateAdminPost,
} from "../admin-posts";

const adminPostsRouter = Router();

function readPostIdParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function respondWithAdminPostError(response: Response, error: unknown): void {
  if (error instanceof AdminPostError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  response.status(500).json({ error: "Unable to process post." });
}

adminPostsRouter.get("/", (_request: Request, response: Response) => {
  try {
    response.json({ posts: listAdminPosts() });
  } catch (error) {
    respondWithAdminPostError(response, error);
  }
});

adminPostsRouter.get("/:id", (request: Request, response: Response) => {
  try {
    const post = readAdminPostById(readPostIdParam(request.params.id));

    if (!post) {
      response.status(404).json({ error: "Post not found." });
      return;
    }

    response.json({ post });
  } catch (error) {
    respondWithAdminPostError(response, error);
  }
});

adminPostsRouter.post("/", (request: Request, response: Response) => {
  try {
    createAdminPost(request.body);
    response.json({ ok: true });
  } catch (error) {
    respondWithAdminPostError(response, error);
  }
});

adminPostsRouter.patch("/:id", (request: Request, response: Response) => {
  try {
    updateAdminPost(readPostIdParam(request.params.id), request.body);
    response.json({ ok: true });
  } catch (error) {
    respondWithAdminPostError(response, error);
  }
});

adminPostsRouter.delete("/:id", (request: Request, response: Response) => {
  try {
    deleteAdminPost(readPostIdParam(request.params.id));
    response.json({ ok: true });
  } catch (error) {
    respondWithAdminPostError(response, error);
  }
});

export default adminPostsRouter;
