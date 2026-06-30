import { Router, type Request, type Response } from "express";
import { deleteAdminReply, listAdminReplies, ReplyError, updateAdminReplyStatus } from "../replies";

const adminRepliesRouter = Router();

function readReplyIdParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function respondWithAdminReplyError(response: Response, error: unknown): void {
  if (error instanceof ReplyError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  response.status(500).json({ error: "Unable to process reply." });
}

adminRepliesRouter.get("/", (_request: Request, response: Response) => {
  try {
    response.json({ replies: listAdminReplies() });
  } catch (error) {
    respondWithAdminReplyError(response, error);
  }
});

adminRepliesRouter.patch("/:id", (request: Request, response: Response) => {
  try {
    updateAdminReplyStatus(readReplyIdParam(request.params.id), request.body);
    response.json({ ok: true });
  } catch (error) {
    respondWithAdminReplyError(response, error);
  }
});

adminRepliesRouter.delete("/:id", (request: Request, response: Response) => {
  try {
    deleteAdminReply(readReplyIdParam(request.params.id));
    response.json({ ok: true });
  } catch (error) {
    respondWithAdminReplyError(response, error);
  }
});

export default adminRepliesRouter;
