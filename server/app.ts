import express, { type NextFunction, type Request, type Response } from "express";
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import adminRouter from "./routes/admin";
import blogRouter from "./routes/blog";
import { listPublishedBlogPosts, readPublishedBlogPostBySlug } from "./blog";
import { blogDbSchema, clientDistPath, clientIndexPath, productionMode, publicOrigin } from "./config";
import { checkStorageReadiness } from "./storage";

export const app = express();
let clientIndexTemplatePromise: Promise<string> | null = null;

app.disable("x-powered-by");
// Coolify reaches the app over a private network. Trust only private proxy hops
// so a directly reachable public client cannot spoof X-Forwarded-For.
app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);

function setSecurityHeaders(_request: Request, response: Response, next: NextFunction): void {
  response.setHeader("Content-Security-Policy", [
    "default-src 'self'",
    "base-uri 'self'",
    "connect-src 'self'",
    "font-src 'self' https://fonts.gstatic.com",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: https:",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  ].join("; "));
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  response.setHeader("Permissions-Policy", "camera=(), geolocation=(), microphone=()");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");

  if (productionMode) {
    response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
}

function assignRequestId(request: Request, response: Response, next: NextFunction): void {
  const incomingRequestId = request.get("x-request-id")?.trim();
  const requestId = incomingRequestId && incomingRequestId.length <= 128
    ? incomingRequestId
    : crypto.randomUUID();

  response.locals.requestId = requestId;
  response.setHeader("X-Request-ID", requestId);
  next();
}

function logApiRequest(request: Request, response: Response, next: NextFunction): void {
  if (request.path === "/api" || request.path.startsWith("/api/")) {
    const startedAt = process.hrtime.bigint();

    response.once("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      console.log(JSON.stringify({
        level: "info",
        method: request.method,
        path: request.path,
        requestId: String(response.locals.requestId ?? "unknown"),
        status: response.statusCode,
        durationMs: Math.round(durationMs * 10) / 10,
      }));
    });
  }

  next();
}

function sendClientIndex(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(clientIndexPath, (error) => {
    if (error) {
      next(error);
    }
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function redactErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown error";

  return message
    .replace(/(postgres(?:ql)?:\/\/[^:\s/]+:)[^@\s/]+@/gi, "$1[REDACTED]@")
    .replace(/((?:password|secret|token)=)[^&\s]+/gi, "$1[REDACTED]");
}

function replaceMetaTag(html: string, attribute: "name" | "property", key: string, content: string): string {
  const tagPattern = new RegExp(`<meta\\s+${attribute}=["']${key}["'][^>]*>`, "i");
  const tag = `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`;

  return tagPattern.test(html) ? html.replace(tagPattern, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

function clientIndexTemplate(): Promise<string> {
  clientIndexTemplatePromise ??= fs.readFile(clientIndexPath, "utf8");

  return clientIndexTemplatePromise;
}

function absolutePublicUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, `${publicOrigin ?? "https://smit.codestacx.com"}/`).toString();
}

type PageMetadata = {
  canonicalPath: string;
  description: string;
  noIndex?: boolean;
  title: string;
};

async function sendMetadataClientIndex(response: Response, next: NextFunction, metadata: PageMetadata): Promise<void> {
  try {
    const canonicalUrl = absolutePublicUrl(metadata.canonicalPath);
    let html = await clientIndexTemplate();

    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(metadata.title)}</title>`);
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);
    html = replaceMetaTag(html, "name", "description", metadata.description);
    html = replaceMetaTag(html, "name", "robots", metadata.noIndex ? "noindex, nofollow" : "index, follow");
    html = replaceMetaTag(html, "property", "og:title", metadata.title);
    html = replaceMetaTag(html, "property", "og:description", metadata.description);
    html = replaceMetaTag(html, "property", "og:url", canonicalUrl);
    html = replaceMetaTag(html, "name", "twitter:title", metadata.title);
    html = replaceMetaTag(html, "name", "twitter:description", metadata.description);

    response.setHeader("Cache-Control", "no-cache");
    response.type("html").send(html);
  } catch (error) {
    next(error);
  }
}

function sendBlogIndex(_request: Request, response: Response, next: NextFunction): void {
  void sendMetadataClientIndex(response, next, {
    canonicalPath: "/blog",
    description: "Essays, project notes, and technical writing from Smit Devrukhkar.",
    title: "Writing | Smit Devrukhkar",
  });
}

function sendAdminIndex(request: Request, response: Response, next: NextFunction): void {
  void sendMetadataClientIndex(response, next, {
    canonicalPath: request.path,
    description: "Private blog administration for Smit Devrukhkar.",
    noIndex: true,
    title: "Blog Admin | Smit Devrukhkar",
  });
}

function sendNotFoundIndex(request: Request, response: Response, next: NextFunction): void {
  void sendMetadataClientIndex(response, next, {
    canonicalPath: request.path,
    description: "The requested page could not be found.",
    noIndex: true,
    title: "Page Not Found | Smit Devrukhkar",
  });
}

async function sendBlogClientIndex(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const slug = String(request.params.slug ?? "").trim();
    const post = slug ? await readPublishedBlogPostBySlug(slug) : null;
    let html = await clientIndexTemplate();

    if (!post) {
      response.status(404);
      const canonicalUrl = absolutePublicUrl(`/blog/${encodeURIComponent(slug)}`);
      html = html.replace(/<title>[^<]*<\/title>/i, "<title>Post Not Found | Smit Devrukhkar</title>");
      html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);
      html = replaceMetaTag(html, "name", "description", "The requested blog post could not be found.");
      html = replaceMetaTag(html, "name", "robots", "noindex, nofollow");
      html = replaceMetaTag(html, "property", "og:title", "Post Not Found | Smit Devrukhkar");
      html = replaceMetaTag(html, "property", "og:description", "The requested blog post could not be found.");
      html = replaceMetaTag(html, "property", "og:url", canonicalUrl);
    } else {
      const title = `${post.title} | Smit Devrukhkar`;
      const description = post.summary || post.excerpt;
      const canonicalUrl = absolutePublicUrl(`/blog/${encodeURIComponent(post.slug)}`);

      html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
      html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);
      html = replaceMetaTag(html, "name", "description", description);
      html = replaceMetaTag(html, "property", "og:title", title);
      html = replaceMetaTag(html, "property", "og:description", description);
      html = replaceMetaTag(html, "property", "og:type", "article");
      html = replaceMetaTag(html, "property", "og:url", canonicalUrl);
      html = replaceMetaTag(html, "name", "twitter:card", post.coverImageUrl ? "summary_large_image" : "summary");
      html = replaceMetaTag(html, "name", "twitter:title", title);
      html = replaceMetaTag(html, "name", "twitter:description", description);

      if (post.coverImageUrl) {
        const imageUrl = absolutePublicUrl(post.coverImageUrl);
        html = replaceMetaTag(html, "property", "og:image", imageUrl);
        html = replaceMetaTag(html, "name", "twitter:image", imageUrl);
      }
    }

    response.setHeader("Cache-Control", "no-cache");
    response.type("html").send(html);
  } catch (error) {
    next(error);
  }
}

app.use(setSecurityHeaders);
app.use(assignRequestId);
app.use(logApiRequest);
app.use(express.json({ limit: "32kb", type: "application/json" }));

app.get("/api/health", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ ok: true });
});

app.get("/api/ready", async (_request, response, next) => {
  try {
    await checkStorageReadiness();
    response.setHeader("Cache-Control", "no-store");
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/site", (_req, res) => {
  res.json({
    developmentWebsite: blogDbSchema === "blog_dev",
    productionWebsiteUrl: "https://smit.codestacx.com",
  });
});

app.get("/sitemap.xml", async (_request, response, next) => {
  try {
    const posts = await listPublishedBlogPosts(1000);
    const urls = [
      { location: absolutePublicUrl("/"), updatedAt: null },
      { location: absolutePublicUrl("/blog"), updatedAt: posts[0]?.updatedAt ?? null },
      ...posts.map((post) => ({
        location: absolutePublicUrl(`/blog/${encodeURIComponent(post.slug)}`),
        updatedAt: post.updatedAt,
      })),
    ];
    const body = urls.map(({ location, updatedAt }) => [
      "  <url>",
      `    <loc>${escapeHtml(location)}</loc>`,
      updatedAt ? `    <lastmod>${escapeHtml(updatedAt)}</lastmod>` : null,
      "  </url>",
    ].filter(Boolean).join("\n")).join("\n");

    response.setHeader("Cache-Control", "public, max-age=300");
    response.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
  } catch (error) {
    next(error);
  }
});

app.use("/api/posts", blogRouter);

app.use("/api/admin", adminRouter);

app.use("/assets", express.static(path.join(clientDistPath, "assets"), {
  immutable: true,
  maxAge: "1y",
}));
app.use(express.static(clientDistPath, {
  index: false,
  maxAge: "1d",
}));

app.get("/", sendClientIndex);
app.get("/blog", sendBlogIndex);
app.get([
  "/admin",
  "/admin/login",
  "/admin/posts",
  "/admin/posts/new",
  "/admin/posts/:id/edit",
  "/admin/replies",
], sendAdminIndex);

app.get("/blog/:slug", sendBlogClientIndex);

app.use((request, response, next) => {
  if (request.path === "/api" || request.path.startsWith("/api/")) {
    response.status(404).json({ error: "Not found." });
    return;
  }

  if ((request.method === "GET" || request.method === "HEAD") && !path.extname(request.path)) {
    response.status(404);
    sendNotFoundIndex(request, response, next);
    return;
  }

  response.status(404).type("text/plain").send("Not found.");
});

app.use((error: unknown, request: Request, response: Response, next: NextFunction) => {
  const requestId = String(response.locals.requestId ?? "unknown");
  const status = typeof error === "object"
    && error !== null
    && "status" in error
    && typeof error.status === "number"
    && error.status >= 400
    && error.status < 600
    ? error.status
    : 500;

  console.error(JSON.stringify({
    level: "error",
    method: request.method,
    path: request.path,
    requestId,
    status,
    error: redactErrorMessage(error),
  }));

  if (response.headersSent) {
    next(error);
    return;
  }

  const message = status >= 500 ? "Internal server error." : "Request failed.";

  if (request.path === "/api" || request.path.startsWith("/api/")) {
    response.status(status).json({ error: message, requestId });
    return;
  }

  response.status(status).type("text/plain").send(`${message} Request ID: ${requestId}`);
});
