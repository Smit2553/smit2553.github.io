import { Router, type Request, type Response } from "express";
import {
  loginAdmin,
  logoutAdminSession,
  publicAdminSession,
  publicAdminUser,
  requireAdminAuth,
  setAdminSessionCookie,
  type AdminAuthContext,
} from "../auth";
import adminPostsRouter from "./admin-posts";

const adminRouter = Router();

adminRouter.post("/login", (request: Request, response: Response) => {
  const body = (request.body ?? {}) as { username?: unknown; password?: unknown };

  if (typeof body.username !== "string" || typeof body.password !== "string") {
    response.status(400).json({ error: "Username and password are required." });
    return;
  }

  const username = body.username.trim();

  if (username.length === 0) {
    response.status(400).json({ error: "Username and password are required." });
    return;
  }

  const login = loginAdmin(username, body.password);

  if (!login) {
    response.status(401).json({ error: "Invalid credentials." });
    return;
  }

  setAdminSessionCookie(response, login.token);
  response.json({ ok: true, admin: login.user, session: login.session });
});

adminRouter.post("/logout", (request: Request, response: Response) => {
  logoutAdminSession(request, response);
  response.json({ ok: true });
});

adminRouter.get("/health", requireAdminAuth, (_request: Request, response: Response) => {
  const auth = (response.locals as { adminAuth: AdminAuthContext }).adminAuth;

  response.json({
    ok: true,
    admin: publicAdminUser(auth.user),
    session: publicAdminSession(auth.session),
  });
});

adminRouter.use("/posts", requireAdminAuth, adminPostsRouter);

export default adminRouter;
