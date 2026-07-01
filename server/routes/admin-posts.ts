import { Router, type Request, type Response } from "express";
import {
  AdminPostError,
  createAdminPost,
  deleteAdminPost,
  listAdminPosts,
  readAdminPostById,
  updateAdminPost,
} from "../admin-posts";
import { readRouteParam } from "./params";

const adminPostsRouter = Router();

function respondWithAdminPostError(response: Response, error: unknown): void {
  if (error instanceof AdminPostError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  response.status(500).json({ error: "Unable to process post." });
}

adminPostsRouter.get("/", async (_request: Request, response: Response) => {
  try {
    response.json({ posts: await listAdminPosts() });
  } catch (error) {
    respondWithAdminPostError(response, error);
  }
});

adminPostsRouter.get("/:id", async (request: Request, response: Response) => {
  try {
    const post = await readAdminPostById(readRouteParam(request.params.id));

    if (!post) {
      response.status(404).json({ error: "Post not found." });
      return;
    }

    response.json({ post });
  } catch (error) {
    respondWithAdminPostError(response, error);
  }
});

adminPostsRouter.post("/", async (request: Request, response: Response) => {
  try {
    await createAdminPost(request.body);
    response.json({ ok: true });
  } catch (error) {
    respondWithAdminPostError(response, error);
  }
});

adminPostsRouter.patch("/:id", async (request: Request, response: Response) => {
  try {
    await updateAdminPost(readRouteParam(request.params.id), request.body);
    response.json({ ok: true });
  } catch (error) {
    respondWithAdminPostError(response, error);
  }
});

adminPostsRouter.delete("/:id", async (request: Request, response: Response) => {
  try {
    await deleteAdminPost(readRouteParam(request.params.id));
    response.json({ ok: true });
  } catch (error) {
    respondWithAdminPostError(response, error);
  }
});

export default adminPostsRouter;
