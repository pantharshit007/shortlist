import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env.js";
import * as schema from "./schema/index.js";

// Explicit limits, so a stuck database fails requests in seconds instead of leaving them hanging.
// Migrations opt out of the statement timeout: building an index on a big table can rightly take longer.
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
  ...(process.env.DB_NO_STATEMENT_TIMEOUT ? {} : { statement_timeout: 15_000 }),
});

export const db = drizzle({ client: pool, schema, casing: "snake_case" });
