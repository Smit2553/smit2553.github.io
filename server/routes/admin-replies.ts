import { Router, type Request, type Response } from "express";
import { deleteAdminReply, listAdminReplies, ReplyError, updateAdminReplyStatus } from "../replies";
import { readRouteParam } from "./params";

const adminRepliesRouter = Router();

function respondWithAdminReplyError(response: Response, error: unknown): void {
  if (error instanceof ReplyError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  response.status(500).json({ error: "Unable to process reply." });
}

adminRepliesRouter.get("/", async (_request: Request, response: Response) => {
  try {
    response.json({ replies: await listAdminReplies() });
  } catch (error) {
    respondWithAdminReplyError(response, error);
  }
});

adminRepliesRouter.patch("/:id", async (request: Request, response: Response) => {
  try {
    await updateAdminReplyStatus(readRouteParam(request.params.id), request.body);
    response.json({ ok: true });
  } catch (error) {
    respondWithAdminReplyError(response, error);
  }
});

adminRepliesRouter.delete("/:id", async (request: Request, response: Response) => {
  try {
    await deleteAdminReply(readRouteParam(request.params.id));
    response.json({ ok: true });
  } catch (error) {
    respondWithAdminReplyError(response, error);
  }
});

export default adminRepliesRouter;
