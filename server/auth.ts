import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import {
  adminPassword,
  adminSessionCookieName,
  adminSessionTtlMs,
  adminUsername,
  productionMode,
} from "./config";
import {
  createSession,
  deleteExpiredSessions,
  getAdminUserById,
  getAdminUserByUsername,
  getSessionByTokenHash,
  revokeSessionById,
  revokeSessionsByAdminUserId,
  touchSession,
  type AdminUserRow,
  type SessionRow,
  updateAdminUserLoginTime,
  upsertAdminUser,
} from "./storage";

export const PRIMARY_ADMIN_USER_ID = "primary-admin";

export interface PublicAdminUser {
  id: string;
  username: string;
  lastLoginAt: string | null;
}

export interface PublicAdminSession {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
}

export interface AdminAuthContext {
  user: AdminUserRow;
  session: SessionRow;
}

export interface AdminLoginResult {
  user: PublicAdminUser;
  session: PublicAdminSession;
  token: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function addMilliseconds(iso: string, amount: number): string {
  return new Date(Date.parse(iso) + amount).toISOString();
}

function createPasswordRecord(password: string): { saltHex: string; hashHex: string } {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);

  return {
    saltHex: salt.toString("hex"),
    hashHex: Buffer.from(hash).toString("hex"),
  };
}

function verifyPassword(password: string, saltHex: string, expectedHashHex: string): boolean {
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(expectedHashHex, "hex");
  const actual = Buffer.from(crypto.scryptSync(password, salt, expected.length));

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function createSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getCookieValue(request: Request, cookieName: string): string | undefined {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return undefined;
  }

  for (const chunk of cookieHeader.split(";")) {
    const trimmed = chunk.trim();
    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex);

    if (key !== cookieName) {
      continue;
    }

    const rawValue = trimmed.slice(equalsIndex + 1);

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return undefined;
}

export function setAdminSessionCookie(response: Response, token: string): void {
  response.cookie(adminSessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: productionMode,
    path: "/",
    maxAge: adminSessionTtlMs,
  });
}

function clearAdminSessionCookie(response: Response): void {
  response.clearCookie(adminSessionCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: productionMode,
    path: "/",
  });
}

function toPublicAdminUser(user: Pick<AdminUserRow, "id" | "username" | "last_login_at">): PublicAdminUser {
  return {
    id: user.id,
    username: user.username,
    lastLoginAt: user.last_login_at,
  };
}

function toPublicAdminSession(session: Pick<SessionRow, "id" | "created_at" | "last_seen_at" | "expires_at">): PublicAdminSession {
  return {
    id: session.id,
    createdAt: session.created_at,
    lastSeenAt: session.last_seen_at,
    expiresAt: session.expires_at,
  };
}

export function initializeAdminAuth(): AdminUserRow {
  const now = nowIso();
  deleteExpiredSessions(now);

  const existing = getAdminUserById(PRIMARY_ADMIN_USER_ID);

  if (!existing) {
    const { saltHex, hashHex } = createPasswordRecord(adminPassword);

    upsertAdminUser({
      id: PRIMARY_ADMIN_USER_ID,
      username: adminUsername,
      passwordHash: hashHex,
      passwordSalt: saltHex,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
      disabledAt: null,
    });

    return getAdminUserById(PRIMARY_ADMIN_USER_ID) as AdminUserRow;
  }

  const passwordMatches = existing.disabled_at === null && existing.username === adminUsername
    && verifyPassword(adminPassword, existing.password_salt, existing.password_hash);

  if (passwordMatches) {
    return existing;
  }

  const { saltHex, hashHex } = createPasswordRecord(adminPassword);

  upsertAdminUser({
    id: PRIMARY_ADMIN_USER_ID,
    username: adminUsername,
    passwordHash: hashHex,
    passwordSalt: saltHex,
    createdAt: existing.created_at,
    updatedAt: now,
    lastLoginAt: existing.last_login_at,
    disabledAt: null,
  });
  revokeSessionsByAdminUserId(PRIMARY_ADMIN_USER_ID, now);

  return getAdminUserById(PRIMARY_ADMIN_USER_ID) as AdminUserRow;
}

export function loginAdmin(username: string, password: string): AdminLoginResult | null {
  const normalizedUsername = username.trim();

  if (normalizedUsername.length === 0) {
    return null;
  }

  const now = nowIso();
  deleteExpiredSessions(now);

  const user = getAdminUserByUsername(normalizedUsername);

  if (!user || user.disabled_at !== null) {
    return null;
  }

  if (!verifyPassword(password, user.password_salt, user.password_hash)) {
    return null;
  }

  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const session = {
    id: crypto.randomUUID(),
    adminUserId: user.id,
    tokenHash,
    createdAt: now,
    lastSeenAt: now,
    expiresAt: addMilliseconds(now, adminSessionTtlMs),
    revokedAt: null,
  };

  createSession(session);
  updateAdminUserLoginTime(user.id, now);

  return {
    user: toPublicAdminUser({ ...user, last_login_at: now }),
    session: toPublicAdminSession({
      id: session.id,
      created_at: session.createdAt,
      last_seen_at: session.lastSeenAt,
      expires_at: session.expiresAt,
    }),
    token,
  };
}

export function resolveAdminAuth(request: Request): AdminAuthContext | null {
  const token = getCookieValue(request, adminSessionCookieName);

  if (!token) {
    return null;
  }

  const now = nowIso();
  const session = getSessionByTokenHash(hashSessionToken(token));

  if (!session) {
    return null;
  }

  if (session.revoked_at !== null) {
    return null;
  }

  if (session.expires_at <= now) {
    revokeSessionById(session.id, now);
    return null;
  }

  const user = getAdminUserById(session.admin_user_id);

  if (!user || user.disabled_at !== null) {
    revokeSessionById(session.id, now);
    return null;
  }

  touchSession(session.id, now);

  return {
    user,
    session: {
      ...session,
      last_seen_at: now,
    },
  };
}

export function requireAdminAuth(request: Request, response: Response, next: NextFunction): void {
  const auth = resolveAdminAuth(request);

  if (!auth) {
    clearAdminSessionCookie(response);
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  (response.locals as { adminAuth?: AdminAuthContext }).adminAuth = auth;
  next();
}

export function logoutAdminSession(request: Request, response: Response): void {
  const token = getCookieValue(request, adminSessionCookieName);

  if (token) {
    const session = getSessionByTokenHash(hashSessionToken(token));

    if (session) {
      revokeSessionById(session.id, nowIso());
    }
  }

  clearAdminSessionCookie(response);
}

export function publicAdminUser(user: AdminUserRow): PublicAdminUser {
  return toPublicAdminUser(user);
}

export function publicAdminSession(session: SessionRow): PublicAdminSession {
  return toPublicAdminSession(session);
}
