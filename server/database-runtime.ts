import type { Sql } from "postgres";
import { isIP } from "node:net";

const REQUIRED_COLUMNS = {
  admin_users: ["id", "username", "password_hash", "password_salt", "created_at", "updated_at", "last_login_at", "disabled_at"],
  likes: ["id", "post_id", "visitor_key", "created_at"],
  post_tags: ["post_id", "tag_id", "created_at"],
  posts: ["id", "slug", "title", "summary", "cover_image_url", "content", "status", "published_at", "created_at", "updated_at"],
  replies: ["id", "post_id", "parent_reply_id", "author_name", "author_email", "body", "status", "created_at", "updated_at"],
  reply_likes: ["id", "reply_id", "visitor_key", "created_at"],
  sessions: ["id", "admin_user_id", "token_hash", "created_at", "last_seen_at", "expires_at", "revoked_at"],
  tags: ["id", "slug", "name", "created_at", "updated_at"],
} as const;
const REQUIRED_NOT_NULL = {
  admin_users: ["id", "username", "password_hash", "password_salt", "created_at", "updated_at"],
  likes: ["id", "post_id", "visitor_key", "created_at"],
  post_tags: ["post_id", "tag_id", "created_at"],
  posts: ["id", "slug", "title", "content", "status", "created_at", "updated_at"],
  replies: ["id", "post_id", "author_name", "body", "status", "created_at", "updated_at"],
  reply_likes: ["id", "reply_id", "visitor_key", "created_at"],
  sessions: ["id", "admin_user_id", "token_hash", "created_at", "last_seen_at", "expires_at"],
  tags: ["id", "slug", "name", "created_at", "updated_at"],
} as const;
const REQUIRED_CONSTRAINTS = {
  admin_users: {
    admin_users_pkey: "PRIMARY KEY",
    admin_users_username_key: "UNIQUE",
  },
  likes: {
    likes_pkey: "PRIMARY KEY",
    likes_post_id_fkey: "FOREIGN KEY",
    likes_post_id_visitor_key_key: "UNIQUE",
  },
  post_tags: {
    post_tags_pkey: "PRIMARY KEY",
    post_tags_post_id_fkey: "FOREIGN KEY",
    post_tags_tag_id_fkey: "FOREIGN KEY",
  },
  posts: {
    posts_pkey: "PRIMARY KEY",
    posts_slug_key: "UNIQUE",
    posts_status_check: "CHECK",
  },
  replies: {
    replies_pkey: "PRIMARY KEY",
    replies_parent_reply_id_fkey: "FOREIGN KEY",
    replies_post_id_fkey: "FOREIGN KEY",
    replies_status_check: "CHECK",
  },
  reply_likes: {
    reply_likes_pkey: "PRIMARY KEY",
    reply_likes_reply_id_fkey: "FOREIGN KEY",
    reply_likes_reply_id_visitor_key_key: "UNIQUE",
  },
  sessions: {
    sessions_admin_user_id_fkey: "FOREIGN KEY",
    sessions_pkey: "PRIMARY KEY",
    sessions_token_hash_key: "UNIQUE",
  },
  tags: {
    tags_pkey: "PRIMARY KEY",
    tags_slug_key: "UNIQUE",
  },
} as const;
const REQUIRED_CASCADE_FOREIGN_KEYS = new Set([
  "likes_post_id_fkey",
  "post_tags_post_id_fkey",
  "post_tags_tag_id_fkey",
  "replies_parent_reply_id_fkey",
  "replies_post_id_fkey",
  "reply_likes_reply_id_fkey",
  "sessions_admin_user_id_fkey",
]);
export const CURRENT_SCHEMA_VERSION = "001";

type SchemaColumnRow = {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: "YES" | "NO";
};

type ConstraintRow = {
  table_name: string;
  constraint_name: string;
  constraint_type: string;
};

type ReferentialRuleRow = {
  constraint_name: string;
  delete_rule: string;
};

type CheckConstraintRow = {
  constraint_name: string;
  check_clause: string;
};

export function requireSchemaName(value: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Invalid BLOG_DB_SCHEMA: ${value}`);
  }

  return value;
}

function readBooleanEnv(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();

  if (!value) {
    return false;
  }

  if (value === "1" || value === "true") {
    return true;
  }

  if (value === "0" || value === "false") {
    return false;
  }

  throw new Error(`${name} must be "1", "true", "0", or "false"`);
}

function isPrivateDatabaseHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (host === "localhost" || host === "::1" || host.endsWith(".local")) {
    return true;
  }

  if (!host.includes(".") && !host.includes(":")) {
    // Single-label DNS names are commonly private service names in Docker/Coolify.
    return true;
  }

  const ipv4 = host.split(".").map(Number);

  if (ipv4.length === 4 && ipv4.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    return ipv4[0] === 10
      || ipv4[0] === 127
      || (ipv4[0] === 172 && ipv4[1] >= 16 && ipv4[1] <= 31)
      || (ipv4[0] === 192 && ipv4[1] === 168);
  }

  if (isIP(host) === 6) {
    const firstGroup = Number.parseInt(host.split(":")[0] || "0", 16);

    return (firstGroup & 0xfe00) === 0xfc00 || (firstGroup & 0xffc0) === 0xfe80;
  }

  return false;
}

export function databaseSsl(databaseUrl: string, production: boolean): "verify-full" | undefined {
  let parsed: URL;

  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid Postgres URL.");
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use the postgres:// or postgresql:// protocol.");
  }

  const sslMode = parsed.searchParams.get("sslmode")?.toLowerCase();
  const insecurePrivateAllowed = readBooleanEnv("BLOG_DATABASE_ALLOW_INSECURE_PRIVATE_NETWORK");
  const privateHost = isPrivateDatabaseHost(parsed.hostname);

  if (production) {
    if (insecurePrivateAllowed) {
      if (!privateHost) {
        throw new Error("BLOG_DATABASE_ALLOW_INSECURE_PRIVATE_NETWORK may only be used with a local/private database host.");
      }

      return undefined;
    }

    if (sslMode === "disable") {
      throw new Error("Production Postgres cannot disable TLS unless BLOG_DATABASE_ALLOW_INSECURE_PRIVATE_NETWORK=1 and the host is private.");
    }

    return "verify-full";
  }

  return sslMode === "require" || sslMode === "verify-full" ? "verify-full" : undefined;
}

export function databaseConnectionOptions(databaseUrl: string, production: boolean, max = 10) {
  return {
    max,
    connect_timeout: 10,
    idle_timeout: 20,
    ssl: databaseSsl(databaseUrl, production),
    connection: {
      application_name: "smit-portfolio-blog",
      statement_timeout: 15_000,
      lock_timeout: 5_000,
      idle_in_transaction_session_timeout: 15_000,
    },
  } as const;
}

export async function validateRequiredSchema(sql: Pick<Sql, "unsafe">, schemaValue: string): Promise<void> {
  const schema = requireSchemaName(schemaValue);
  const rows = await sql.unsafe<SchemaColumnRow[]>(
    `SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = $1
      ORDER BY table_name, ordinal_position`,
    [schema],
  );
  const actual = new Map<string, Map<string, { dataType: string; nullable: boolean }>>();

  for (const row of rows) {
    const columns = actual.get(row.table_name) ?? new Map<string, { dataType: string; nullable: boolean }>();
    columns.set(row.column_name, { dataType: row.data_type, nullable: row.is_nullable === "YES" });
    actual.set(row.table_name, columns);
  }

  const problems: string[] = [];

  for (const [table, requiredColumns] of Object.entries(REQUIRED_COLUMNS)) {
    const actualColumns = actual.get(table);

    if (!actualColumns) {
      problems.push(`missing table ${schema}.${table}`);
      continue;
    }

    for (const column of requiredColumns) {
      const columnDetails = actualColumns.get(column);

      if (!columnDetails) {
        problems.push(`missing column ${schema}.${table}.${column}`);
      } else if (columnDetails.dataType !== "text") {
        problems.push(`${schema}.${table}.${column} must be text (found ${columnDetails.dataType})`);
      }
    }
  }

  for (const [table, requiredColumns] of Object.entries(REQUIRED_NOT_NULL)) {
    const actualColumns = actual.get(table);

    for (const column of requiredColumns) {
      if (actualColumns?.get(column)?.nullable) {
        problems.push(`${schema}.${table}.${column} must be NOT NULL`);
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(`Database schema is not ready:\n- ${problems.join("\n- ")}\nRun the database migrations before starting the application.`);
  }
}

export async function validateRequiredConstraints(sql: Pick<Sql, "unsafe">, schemaValue: string): Promise<void> {
  const schema = requireSchemaName(schemaValue);
  const constraintRows = await sql.unsafe<ConstraintRow[]>(
    `SELECT table_name, constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE constraint_schema = $1`,
    [schema],
  );
  const referentialRows = await sql.unsafe<ReferentialRuleRow[]>(
    `SELECT constraint_name, delete_rule
      FROM information_schema.referential_constraints
      WHERE constraint_schema = $1`,
    [schema],
  );
  const checkRows = await sql.unsafe<CheckConstraintRow[]>(
    `SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_schema = $1`,
    [schema],
  );
  const constraints = new Map(constraintRows.map((row) => [
    `${row.table_name}.${row.constraint_name}`,
    row.constraint_type,
  ]));
  const deleteRules = new Map(referentialRows.map((row) => [row.constraint_name, row.delete_rule]));
  const checkClauses = new Map(checkRows.map((row) => [row.constraint_name, row.check_clause.toLowerCase()]));
  const problems: string[] = [];

  for (const [table, requiredConstraints] of Object.entries(REQUIRED_CONSTRAINTS)) {
    for (const [constraintName, constraintType] of Object.entries(requiredConstraints)) {
      const actualType = constraints.get(`${table}.${constraintName}`);

      if (!actualType) {
        problems.push(`missing constraint ${schema}.${table}.${constraintName}`);
      } else if (actualType !== constraintType) {
        problems.push(`${schema}.${table}.${constraintName} must be ${constraintType} (found ${actualType})`);
      }
    }
  }

  for (const constraintName of REQUIRED_CASCADE_FOREIGN_KEYS) {
    const deleteRule = deleteRules.get(constraintName);

    if (deleteRule !== "CASCADE") {
      problems.push(`${schema}.${constraintName} must use ON DELETE CASCADE (found ${deleteRule ?? "none"})`);
    }
  }

  const requiredCheckValues = {
    posts_status_check: ["status", "draft", "published", "archived"],
    replies_status_check: ["status", "pending", "approved", "rejected"],
  } as const;

  for (const [constraintName, requiredValues] of Object.entries(requiredCheckValues)) {
    const clause = checkClauses.get(constraintName) ?? "";

    if (!requiredValues.every((value) => clause.includes(value))) {
      problems.push(`${schema}.${constraintName} does not enforce the expected status values`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`Database constraints are not ready:\n- ${problems.join("\n- ")}\nRepair the schema before marking the migration current.`);
  }
}

export async function validateMigrationState(sql: Pick<Sql, "unsafe">, schemaValue: string): Promise<void> {
  const schema = requireSchemaName(schemaValue);
  const migrationTable = `"${schema}"."schema_migrations"`;
  const tableRows = await sql.unsafe<{ exists: boolean }[]>(
    `SELECT to_regclass($1) IS NOT NULL AS exists`,
    [`${schema}.schema_migrations`],
  );

  if (!tableRows[0]?.exists) {
    throw new Error(`Database schema ${schema} has not been migrated. Run npm run db:migrate before starting production.`);
  }

  const versionRows = await sql.unsafe<{ version: string }[]>(
    `SELECT version FROM ${migrationTable} ORDER BY version DESC LIMIT 1`,
  );
  const version = versionRows[0]?.version;

  if (version !== CURRENT_SCHEMA_VERSION) {
    throw new Error(`Database schema ${schema} is at migration ${version ?? "none"}; expected ${CURRENT_SCHEMA_VERSION}. Run npm run db:migrate.`);
  }
}
