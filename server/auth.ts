import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import {
  adminPassword,
  adminSessionCookieName,
  adminSessionTtlMs,
  adminUsername,
  productionMode,
  publicOrigin,
} from "./config";
import {
  createSession,
  deleteExpiredSessions,
  getAdminUserById,
  getAdminUserByUsername,
  getSessionByTokenHash,
  revokeSessionById,
  rotateAdminUserCredentials,
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

const passwordSaltHexLength = 32;
const passwordHashHexLength = 128;

function derivePasswordKey(password: string, salt: Buffer, length: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, length, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

function nowIso(): string {
  return new Date().toISOString();
}

function addMilliseconds(iso: string, amount: number): string {
  return new Date(Date.parse(iso) + amount).toISOString();
}

async function createPasswordRecord(password: string): Promise<{ saltHex: string; hashHex: string }> {
  const salt = crypto.randomBytes(16);
  const hash = await derivePasswordKey(password, salt, 64);

  return {
    saltHex: salt.toString("hex"),
    hashHex: Buffer.from(hash).toString("hex"),
  };
}

async function verifyPassword(password: string, saltHex: string, expectedHashHex: string): Promise<boolean> {
  if (saltHex.length !== passwordSaltHexLength
    || expectedHashHex.length !== passwordHashHexLength
    || !/^[0-9a-f]+$/i.test(saltHex)
    || !/^[0-9a-f]+$/i.test(expectedHashHex)) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(expectedHashHex, "hex");
  const actual = await derivePasswordKey(password, salt, expected.length);

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function expectedRequestOrigin(request: Request): string | null {
  if (publicOrigin) {
    return publicOrigin;
  }

  const host = request.get("host");

  return host ? `${request.protocol}://${host}` : null;
}

function headerOrigin(headerValue: string): string | null {
  try {
    return new URL(headerValue).origin;
  } catch {
    return null;
  }
}

export function requireAdminSameOrigin(request: Request, response: Response, next: NextFunction): void {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
    next();
    return;
  }

  const expectedOrigin = expectedRequestOrigin(request);
  const originHeader = request.get("origin");
  const refererHeader = request.get("referer");
  const suppliedOrigin = originHeader ? headerOrigin(originHeader) : refererHeader ? headerOrigin(refererHeader) : null;

  if (!expectedOrigin || suppliedOrigin !== expectedOrigin) {
    response.status(403).json({ error: "Request origin is not allowed." });
    return;
  }

  next();
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

export async function initializeAdminAuth(): Promise<AdminUserRow> {
  const now = nowIso();
  await deleteExpiredSessions(now);

  const existing = await getAdminUserById(PRIMARY_ADMIN_USER_ID);

  if (!existing) {
    const { saltHex, hashHex } = await createPasswordRecord(adminPassword);

    await upsertAdminUser({
      id: PRIMARY_ADMIN_USER_ID,
      username: adminUsername,
      passwordHash: hashHex,
      passwordSalt: saltHex,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
      disabledAt: null,
    });

    return (await getAdminUserById(PRIMARY_ADMIN_USER_ID)) as AdminUserRow;
  }

  const passwordMatches = existing.disabled_at === null && existing.username === adminUsername
    && await verifyPassword(adminPassword, existing.password_salt, existing.password_hash);

  if (passwordMatches) {
    return existing;
  }

  const { saltHex, hashHex } = await createPasswordRecord(adminPassword);

  await rotateAdminUserCredentials({
    id: PRIMARY_ADMIN_USER_ID,
    username: adminUsername,
    passwordHash: hashHex,
    passwordSalt: saltHex,
    createdAt: existing.created_at,
    updatedAt: now,
    lastLoginAt: existing.last_login_at,
    disabledAt: null,
  }, now);

  return (await getAdminUserById(PRIMARY_ADMIN_USER_ID)) as AdminUserRow;
}

export async function loginAdmin(username: string, password: string): Promise<AdminLoginResult | null> {
  const normalizedUsername = username.trim();

  if (normalizedUsername.length === 0) {
    return null;
  }

  const now = nowIso();
  await deleteExpiredSessions(now);

  const user = await getAdminUserByUsername(normalizedUsername);

  if (!user || user.disabled_at !== null) {
    return null;
  }

  if (!await verifyPassword(password, user.password_salt, user.password_hash)) {
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

  await createSession(session);
  await updateAdminUserLoginTime(user.id, now);

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

export async function resolveAdminAuth(request: Request): Promise<AdminAuthContext | null> {
  const token = getCookieValue(request, adminSessionCookieName);

  if (!token) {
    return null;
  }

  const now = nowIso();
  const session = await getSessionByTokenHash(hashSessionToken(token));

  if (!session) {
    return null;
  }

  if (session.revoked_at !== null) {
    return null;
  }

  if (session.expires_at <= now) {
    await revokeSessionById(session.id, now);
    return null;
  }

  const user = await getAdminUserById(session.admin_user_id);

  if (!user || user.disabled_at !== null) {
    await revokeSessionById(session.id, now);
    return null;
  }

  await touchSession(session.id, now);

  return {
    user,
    session: {
      ...session,
      last_seen_at: now,
    },
  };
}

export async function requireAdminAuth(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const auth = await resolveAdminAuth(request);

    if (!auth) {
      clearAdminSessionCookie(response);
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    (response.locals as { adminAuth?: AdminAuthContext }).adminAuth = auth;
    next();
  } catch (error) {
    next(error);
  }
}

export async function logoutAdminSession(request: Request, response: Response): Promise<void> {
  const token = getCookieValue(request, adminSessionCookieName);

  if (token) {
    const session = await getSessionByTokenHash(hashSessionToken(token));

    if (session) {
      await revokeSessionById(session.id, nowIso());
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
