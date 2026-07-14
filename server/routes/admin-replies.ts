import { Router, type NextFunction, type Request, type Response } from "express";
import { deleteAdminReply, listAdminReplies, ReplyError, updateAdminReplyStatus } from "../replies";
import { readRouteParam } from "./params";

const adminRepliesRouter = Router();

function respondWithAdminReplyError(response: Response, error: unknown, next: NextFunction): void {
  if (error instanceof ReplyError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  next(error);
}

adminRepliesRouter.get("/", async (_request: Request, response: Response, next: NextFunction) => {
  try {
    response.json({ replies: await listAdminReplies() });
  } catch (error) {
    respondWithAdminReplyError(response, error, next);
  }
});

adminRepliesRouter.patch("/:id", async (request: Request, response: Response, next: NextFunction) => {
  try {
    await updateAdminReplyStatus(readRouteParam(request.params.id), request.body);
    response.json({ ok: true });
  } catch (error) {
    respondWithAdminReplyError(response, error, next);
  }
});

adminRepliesRouter.delete("/:id", async (request: Request, response: Response, next: NextFunction) => {
  try {
    await deleteAdminReply(readRouteParam(request.params.id));
    response.json({ ok: true });
  } catch (error) {
    respondWithAdminReplyError(response, error, next);
  }
});

export default adminRepliesRouter;
