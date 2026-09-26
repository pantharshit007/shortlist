import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../db/index.js";

// Applies pending migrations at deploy time (drizzle-kit is a dev-only tool).
await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrations applied");
await pool.end();
