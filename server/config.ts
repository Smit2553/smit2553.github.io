import path from "node:path";

try {
  process.loadEnvFile();
} catch (error) {
  if (typeof error !== "object" || error === null || !("code" in error) || error.code !== "ENOENT") {
    throw error;
  }
}

const parsedPort = Number(process.env.PORT ?? process.env.API_PORT);
const appEnv = readAppEnv();
const isProduction = appEnv === "production";
const allowDevAdminDefaults = parseBooleanEnv("BLOG_ALLOW_DEV_ADMIN_DEFAULTS");

function parseBooleanEnv(name: string): boolean {
  const value = process.env[name];

  if (!value || value.length === 0) {
    return false;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "1" || normalized === "true") {
    return true;
  }

  if (normalized === "0" || normalized === "false") {
    return false;
  }

  throw new Error(`${name} must be "1" or "true"`);
}

function readAppEnv(): "development" | "production" {
  const value = process.env.BLOG_APP_ENV?.trim().toLowerCase();

  if (value === "development" || value === "production") {
    return value;
  }

  throw new Error('BLOG_APP_ENV must be "development" or "production"');
}

function envOrDevDefault(name: string, devDefault: string): string {
  const value = process.env[name];

  if (value && value.length > 0) {
    return value;
  }

  if (isProduction) {
    throw new Error(`${name} is required in production`);
  }

  if (!allowDevAdminDefaults) {
    throw new Error(`${name} is required unless BLOG_ALLOW_DEV_ADMIN_DEFAULTS is enabled`);
  }

  // Explicit opt-in for local dev fallback credentials.
  return devDefault;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function readBlogDbSchema(): string {
  const schema = process.env.BLOG_DB_SCHEMA?.trim();

  if (!schema) {
    if (isProduction) {
      throw new Error("BLOG_DB_SCHEMA is required in production");
    }

    return "blog_dev";
  }

  if (schema !== "blog_dev" && schema !== "blog_prod") {
    throw new Error('BLOG_DB_SCHEMA must be "blog_dev" or "blog_prod"');
  }

  if (isProduction && schema !== "blog_prod") {
    throw new Error('BLOG_DB_SCHEMA must be "blog_prod" when BLOG_APP_ENV is production');
  }

  return schema;
}

function readVisitorCookieSecret(): string {
  if (!isProduction) {
    return process.env.BLOG_VISITOR_COOKIE_SECRET?.trim() || "dev-visitor-cookie-secret-not-for-production";
  }

  const secret = requireEnv("BLOG_VISITOR_COOKIE_SECRET");

  if (secret.length < 32) {
    throw new Error("BLOG_VISITOR_COOKIE_SECRET must be at least 32 characters in production");
  }

  return secret;
}

function parseNumberEnv(name: string, fallback: number): number {
  const value = process.env[name];

  if (!value || value.length === 0) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number`);
  }

  return parsed;
}

export const PORT = Number.isFinite(parsedPort) ? parsedPort : 3001;
export const clientDistPath = path.resolve(process.cwd(), "dist");
export const clientIndexPath = path.join(clientDistPath, "index.html");
export const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
export const blogDbSchema = readBlogDbSchema();
const sqlitePathEnv = process.env.BLOG_SQLITE_PATH || process.env.DATABASE_PATH;
export const sqlitePath = path.resolve(
  process.cwd(),
  sqlitePathEnv ?? "data/blog.sqlite",
);
export const adminUsername = envOrDevDefault("BLOG_ADMIN_USERNAME", "admin");
export const adminPassword = envOrDevDefault("BLOG_ADMIN_PASSWORD", "admin-dev-only");
export const adminSessionCookieName = process.env.BLOG_ADMIN_SESSION_COOKIE_NAME || "blog_admin_session";
export const adminSessionTtlMs = parseNumberEnv("BLOG_ADMIN_SESSION_TTL_MS", 1000 * 60 * 60 * 24 * 7);
export const productionMode = isProduction;
export const visitorCookieName = process.env.BLOG_VISITOR_COOKIE_NAME || "blog_visitor";
export const visitorCookieSecret = readVisitorCookieSecret();
