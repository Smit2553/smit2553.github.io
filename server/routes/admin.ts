import { Router, type Request, type Response } from "express";
import {
  loginAdmin,
  logoutAdminSession,
  publicAdminSession,
  publicAdminUser,
  requireAdminAuth,
  requireAdminSameOrigin,
  setAdminSessionCookie,
  type AdminAuthContext,
} from "../auth";
import { assertRateLimit, getClientIp, RateLimitError } from "../rate-limit";
import adminRepliesRouter from "./admin-replies";
import adminPostsRouter from "./admin-posts";

const adminRouter = Router();
const maxLoginUsernameLength = 128;
const maxLoginPasswordLength = 1024;
const loginRateLimitWindowMs = 1000 * 60 * 15;

adminRouter.use((_request, response, next) => {
  response.set("Cache-Control", "no-store");
  next();
});

function isLoginPayload(body: unknown): body is { username?: unknown; password?: unknown } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return false;
  }

  return true;
}

adminRouter.use(requireAdminSameOrigin);

adminRouter.post("/login", async (request: Request, response: Response) => {
  if (!isLoginPayload(request.body)) {
    response.status(400).json({ error: "Username and password are required." });
    return;
  }

  const body = request.body;

  if (typeof body.username !== "string"
    || body.username.trim().length === 0
    || body.username.length > maxLoginUsernameLength
    || typeof body.password !== "string"
    || body.password.length === 0
    || body.password.length > maxLoginPasswordLength) {
    response.status(400).json({ error: "Username and password are required." });
    return;
  }

  const username = body.username.trim();
  const normalizedUsername = username.toLowerCase();
  const clientIp = getClientIp(request);

  try {
    assertRateLimit(request, "admin:login:ip", 20, loginRateLimitWindowMs);
    assertRateLimit(request, "admin:login:account", 5, loginRateLimitWindowMs, `${clientIp}:${normalizedUsername}`);
    assertRateLimit(request, "admin:login:username", 10, loginRateLimitWindowMs, normalizedUsername);
  } catch (error) {
    if (error instanceof RateLimitError) {
      response.set("Retry-After", String(error.retryAfterSeconds));
      response.status(error.status).json({ error: error.message });
      return;
    }

    throw error;
  }

  const login = await loginAdmin(username, body.password);

  if (!login) {
    response.status(401).json({ error: "Invalid credentials." });
    return;
  }

  setAdminSessionCookie(response, login.token);
  response.json({ ok: true, admin: login.user, session: login.session });
});

adminRouter.post("/logout", async (request: Request, response: Response) => {
  await logoutAdminSession(request, response);
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
adminRouter.use("/replies", requireAdminAuth, adminRepliesRouter);

export default adminRouter;
