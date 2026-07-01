type SmokeRow = {
  current_database: string;
  current_user: string;
  schema_exists: boolean;
  schema_access: boolean;
  table_count: number;
};

function isMissingEnvFile(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: string }).code === "ENOENT";
}

function loadRepoEnvFile(): void {
  const existingNodeEnv = process.env.NODE_ENV;
  const existingDatabaseUrl = process.env.DATABASE_URL;
  const existingBlogDbSchema = process.env.BLOG_DB_SCHEMA;

  try {
    process.loadEnvFile();
  } catch (error) {
    if (!isMissingEnvFile(error)) {
      throw error;
    }
  }

  if (existingNodeEnv !== undefined) {
    process.env.NODE_ENV = existingNodeEnv;
  }

  if (existingDatabaseUrl !== undefined) {
    process.env.DATABASE_URL = existingDatabaseUrl;
  }

  if (existingBlogDbSchema !== undefined) {
    process.env.BLOG_DB_SCHEMA = existingBlogDbSchema;
  }
}

function requireDatabaseUrl(databaseUrl: string): string {
  const trimmed = databaseUrl.trim();

  if (trimmed.length === 0) {
    throw new Error("DATABASE_URL is required.");
  }

  return trimmed;
}

function shouldRequireSsl(databaseUrl: string): boolean {
  try {
    const url = new URL(databaseUrl);
    const sslMode = url.searchParams.get("sslmode")?.toLowerCase();

    if (sslMode === "disable") {
      return false;
    }

    if (sslMode === "require") {
      return true;
    }

    return url.hostname.includes("supabase");
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  loadRepoEnvFile();

  const postgresModule = await import("postgres");
  const postgres = postgresModule.default;
  const url = requireDatabaseUrl(process.env.DATABASE_URL ?? "");
  const blogDbSchema = process.env.BLOG_DB_SCHEMA?.trim() || (process.env.NODE_ENV === "production" ? "blog_prod" : "blog_dev");

  const sql = postgres(url, {
    max: 1,
    connect_timeout: 5,
    idle_timeout: 5,
    ssl: shouldRequireSsl(url) ? "require" : undefined,
  });

  try {
    const [row] = await sql<SmokeRow[]>`
      select
        current_database() as current_database,
        current_user as current_user,
        exists (
          select 1
          from pg_namespace
          where nspname = ${blogDbSchema}
        ) as schema_exists,
        coalesce((
          select has_schema_privilege(nspname, 'USAGE')
          from pg_namespace
          where nspname = ${blogDbSchema}
        ), false) as schema_access,
        coalesce((
          select count(*)::int
          from information_schema.tables
          where table_schema = ${blogDbSchema}
        ), 0) as table_count
    `;

    if (!row) {
      throw new Error("Unable to read database metadata.");
    }

    if (!row.schema_exists) {
      throw new Error(`Schema ${blogDbSchema} does not exist.`);
    }

    if (!row.schema_access) {
      throw new Error(`Schema ${blogDbSchema} is not accessible.`);
    }

    console.log(
      `Postgres smoke check passed: database=${row.current_database} user=${row.current_user} schema=${blogDbSchema} tables=${row.table_count}`,
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
