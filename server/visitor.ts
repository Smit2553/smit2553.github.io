import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { productionMode, publicOrigin, visitorCookieName, visitorCookieSecret } from "./config";

const visitorIdPattern = /^[0-9a-f]{32}$/;
const visitorCookieMaxAgeMs = 1000 * 60 * 60 * 24 * 365;

function signVisitorId(visitorId: string): string {
  return crypto.createHmac("sha256", visitorCookieSecret).update(visitorId).digest("base64url");
}

function readCookieValues(request: Request, cookieName: string): string[] {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return [];
  }

  const values: string[] = [];

  for (const chunk of cookieHeader.split(";")) {
    const trimmed = chunk.trim();
    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex === -1 || trimmed.slice(0, equalsIndex) !== cookieName) {
      continue;
    }

    const rawValue = trimmed.slice(equalsIndex + 1);

    try {
      values.push(decodeURIComponent(rawValue));
    } catch {
      values.push(rawValue);
    }
  }

  return values;
}

export function verifySignedVisitorCookie(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const [visitorId, signature] = value.split(".");

  if (!visitorIdPattern.test(visitorId) || !signature) {
    return null;
  }

  const expectedSignature = signVisitorId(visitorId);

  if (signature.length !== expectedSignature.length) {
    return null;
  }

  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (!crypto.timingSafeEqual(actual, expected)) {
    return null;
  }

  return visitorId;
}

function setVisitorCookie(response: Response, visitorId: string): void {
  response.cookie(visitorCookieName, `${visitorId}.${signVisitorId(visitorId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: productionMode,
    path: "/",
    maxAge: visitorCookieMaxAgeMs,
  });
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

export function requirePublicSameOrigin(request: Request, response: Response, next: NextFunction): void {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
    next();
    return;
  }

  const secFetchSite = request.get("sec-fetch-site")?.trim().toLowerCase();

  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
    response.status(403).json({
      error: "Cross-origin requests are not allowed.",
      message: "Cross-origin requests are not allowed.",
    });
    return;
  }

  const originHeader = request.get("origin");
  const refererHeader = request.get("referer");

  if (originHeader || refererHeader) {
    const expectedOrigin = expectedRequestOrigin(request);
    const suppliedOrigin = originHeader ? headerOrigin(originHeader) : refererHeader ? headerOrigin(refererHeader) : null;

    if (!expectedOrigin || suppliedOrigin !== expectedOrigin) {
      response.status(403).json({
        error: "Cross-origin requests are not allowed.",
        message: "Cross-origin requests are not allowed.",
      });
      return;
    }
  }

  next();
}

export function getOrCreateVisitorId(request: Request, response: Response): string {
  for (const cookieValue of readCookieValues(request, visitorCookieName)) {
    const existingVisitorId = verifySignedVisitorCookie(cookieValue);

    if (existingVisitorId) {
      return existingVisitorId;
    }
  }

  const visitorId = crypto.randomBytes(16).toString("hex");
  setVisitorCookie(response, visitorId);

  return visitorId;
}
