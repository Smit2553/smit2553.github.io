type SmokeRow = {
  current_database: string;
  current_user: string;
  schema_access: boolean;
  migration_count: number;
};

import { databaseConnectionOptions, requireSchemaName, validateMigrationState, validateRequiredConstraints, validateRequiredSchema } from "./database-runtime";

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

async function main(): Promise<void> {
  loadRepoEnvFile();

  const postgresModule = await import("postgres");
  const postgres = postgresModule.default;
  const url = requireDatabaseUrl(process.env.DATABASE_URL ?? "");
  const appEnv = process.env.BLOG_APP_ENV?.trim().toLowerCase();

  if (appEnv !== "development" && appEnv !== "production") {
    throw new Error('BLOG_APP_ENV must be "development" or "production".');
  }

  const production = appEnv === "production";

  if (production !== (process.env.NODE_ENV === "production")) {
    throw new Error("NODE_ENV and BLOG_APP_ENV must both select production or both select development.");
  }

  const blogDbSchema = requireSchemaName(process.env.BLOG_DB_SCHEMA?.trim() || (production ? "blog_prod" : "blog_dev"));

  const sql = postgres(url, databaseConnectionOptions(url, production, 1));

  try {
    const [row] = await sql<SmokeRow[]>`
      select
        current_database() as current_database,
        current_user as current_user,
        coalesce((
          select has_schema_privilege(nspname, 'USAGE')
          from pg_namespace
          where nspname = ${blogDbSchema}
        ), false) as schema_access,
        coalesce((
          select count(*)::int
          from information_schema.tables
          where table_schema = ${blogDbSchema}
            and table_name = 'schema_migrations'
        ), 0) as migration_count
    `;

    if (!row) {
      throw new Error("Unable to read database metadata.");
    }

    if (!row.schema_access) {
      throw new Error(`Schema ${blogDbSchema} is not accessible.`);
    }

    await validateRequiredSchema(sql, blogDbSchema);
    await validateRequiredConstraints(sql, blogDbSchema);

    if (production) {
      await validateMigrationState(sql, blogDbSchema);
    }

    console.log(
      `Postgres readiness check passed: database=${row.current_database} user=${row.current_user} schema=${blogDbSchema} migrations_table=${row.migration_count === 1 ? "present" : "legacy"}`,
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
