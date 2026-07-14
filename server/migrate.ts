import { promises as fs } from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { databaseConnectionOptions, requireSchemaName, validateMigrationState, validateRequiredConstraints, validateRequiredSchema } from "./database-runtime";

type AppliedMigrationRow = { version: string };

function isMissingEnvFile(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: string }).code === "ENOENT";
}

function loadRepoEnvFile(): void {
  try {
    process.loadEnvFile();
  } catch (error) {
    if (!isMissingEnvFile(error)) {
      throw error;
    }
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

async function main(): Promise<void> {
  loadRepoEnvFile();

  const databaseUrl = requiredEnv("DATABASE_URL");
  const appEnv = process.env.BLOG_APP_ENV?.trim().toLowerCase();

  if (appEnv !== "development" && appEnv !== "production") {
    throw new Error('BLOG_APP_ENV must be "development" or "production".');
  }

  const production = appEnv === "production";

  if (production !== (process.env.NODE_ENV === "production")) {
    throw new Error("NODE_ENV and BLOG_APP_ENV must both select production or both select development.");
  }

  const schema = requireSchemaName(requiredEnv("BLOG_DB_SCHEMA"));

  if (production && schema !== "blog_prod") {
    throw new Error('BLOG_DB_SCHEMA must be "blog_prod" in production.');
  }

  const migrationsDirectory = path.resolve(process.cwd(), "db/migrations");
  const migrationFiles = (await fs.readdir(migrationsDirectory))
    .filter((file) => /^\d{3}_[a-z0-9_]+\.sql$/.test(file))
    .sort();

  if (migrationFiles.length === 0) {
    throw new Error(`No migrations found in ${migrationsDirectory}.`);
  }

  const sql = postgres(databaseUrl, databaseConnectionOptions(databaseUrl, production, 1));
  const quotedSchema = `"${schema}"`;

  try {
    await sql.begin(async (transaction) => {
      await transaction`select pg_advisory_xact_lock(hashtext(${'smit-portfolio-blog:' + schema}))`;
      await transaction.unsafe(`CREATE SCHEMA IF NOT EXISTS ${quotedSchema}`);
      await transaction.unsafe(`CREATE TABLE IF NOT EXISTS ${quotedSchema}.schema_migrations (
        version text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )`);

      const appliedRows = await transaction.unsafe<AppliedMigrationRow[]>(
        `SELECT version FROM ${quotedSchema}.schema_migrations`,
      );
      const applied = new Set(appliedRows.map((row) => row.version));

      for (const file of migrationFiles) {
        const version = file.slice(0, 3);

        if (applied.has(version)) {
          continue;
        }

        const source = await fs.readFile(path.join(migrationsDirectory, file), "utf8");
        const migration = source.split("__BLOG_DB_SCHEMA__").join(quotedSchema);

        await transaction.unsafe(migration);
        await transaction.unsafe(
          `INSERT INTO ${quotedSchema}.schema_migrations (version) VALUES ($1)`,
          [version],
        );
        console.log(`Applied migration ${file} to ${schema}.`);
      }

      await validateRequiredSchema(transaction, schema);
      await validateRequiredConstraints(transaction, schema);
    });

    await validateRequiredSchema(sql, schema);
    await validateRequiredConstraints(sql, schema);
    await validateMigrationState(sql, schema);
    console.log(`Database migrations are current for ${schema}.`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
