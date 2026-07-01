import path from "node:path";

try {
  process.loadEnvFile();
} catch (error) {
  if (typeof error !== "object" || error === null || !("code" in error) || error.code !== "ENOENT") {
    throw error;
  }
}

const parsedPort = Number(process.env.PORT ?? process.env.API_PORT);
const isProduction = process.env.NODE_ENV === "production";
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
export const blogDbSchema = process.env.BLOG_DB_SCHEMA?.trim() || (isProduction ? "blog_prod" : "blog_dev");
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
