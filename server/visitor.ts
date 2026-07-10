import crypto from "node:crypto";
import type { Request, Response } from "express";
import { productionMode, visitorCookieName, visitorCookieSecret } from "./config";

const visitorIdPattern = /^[0-9a-f]{32}$/;
const visitorCookieMaxAgeMs = 1000 * 60 * 60 * 24 * 365;

function signVisitorId(visitorId: string): string {
  return crypto.createHmac("sha256", visitorCookieSecret).update(visitorId).digest("base64url");
}

function readCookieValue(request: Request, cookieName: string): string | undefined {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return undefined;
  }

  for (const chunk of cookieHeader.split(";")) {
    const trimmed = chunk.trim();
    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex === -1 || trimmed.slice(0, equalsIndex) !== cookieName) {
      continue;
    }

    try {
      return decodeURIComponent(trimmed.slice(equalsIndex + 1));
    } catch {
      return trimmed.slice(equalsIndex + 1);
    }
  }

  return undefined;
}

function parseVisitorCookie(value: string | undefined): string | null {
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

export function getOrCreateVisitorId(request: Request, response: Response): string {
  const existingVisitorId = parseVisitorCookie(readCookieValue(request, visitorCookieName));

  if (existingVisitorId) {
    return existingVisitorId;
  }

  const visitorId = crypto.randomBytes(16).toString("hex");
  setVisitorCookie(response, visitorId);

  return visitorId;
}
