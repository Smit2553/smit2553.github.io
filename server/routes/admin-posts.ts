import { Router, type NextFunction, type Request, type Response } from "express";
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

function respondWithAdminPostError(response: Response, error: unknown, next: NextFunction): void {
  if (error instanceof AdminPostError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  next(error);
}

adminPostsRouter.get("/", async (_request: Request, response: Response, next: NextFunction) => {
  try {
    response.json({ posts: await listAdminPosts() });
  } catch (error) {
    respondWithAdminPostError(response, error, next);
  }
});

adminPostsRouter.get("/:id", async (request: Request, response: Response, next: NextFunction) => {
  try {
    const post = await readAdminPostById(readRouteParam(request.params.id));

    if (!post) {
      response.status(404).json({ error: "Post not found." });
      return;
    }

    response.json({ post });
  } catch (error) {
    respondWithAdminPostError(response, error, next);
  }
});

adminPostsRouter.post("/", async (request: Request, response: Response, next: NextFunction) => {
  try {
    await createAdminPost(request.body);
    response.json({ ok: true });
  } catch (error) {
    respondWithAdminPostError(response, error, next);
  }
});

adminPostsRouter.patch("/:id", async (request: Request, response: Response, next: NextFunction) => {
  try {
    await updateAdminPost(readRouteParam(request.params.id), request.body);
    response.json({ ok: true });
  } catch (error) {
    respondWithAdminPostError(response, error, next);
  }
});

adminPostsRouter.delete("/:id", async (request: Request, response: Response, next: NextFunction) => {
  try {
    await deleteAdminPost(readRouteParam(request.params.id));
    response.json({ ok: true });
  } catch (error) {
    respondWithAdminPostError(response, error, next);
  }
});

export default adminPostsRouter;
