import { app } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/index.js";
import { logger } from "./lib/logger.js";
import { redis } from "./lib/redis.js";

const server = app.listen(env.PORT, () => {
  logger.info(`Backend listening on http://localhost:${env.PORT}`);
});

function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  server.close(async () => {
    await pool.end();
    await redis?.quit();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
