import { migrate } from "drizzle-orm/node-postgres/migrator";
// Set before the pool is created, so migrations run without its statement timeout.
process.env.DB_NO_STATEMENT_TIMEOUT = "1";
const { db, pool } = await import("../db/index.js");

// Applies pending migrations at deploy time (drizzle-kit is a dev-only tool).
await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrations applied");
await pool.end();
