import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { env } from "./config/env.js";
import { pool } from "./db/index.js";
import { type MaintenanceTask, maintenanceTasks } from "./jobs/maintenance.js";
import { logger } from "./lib/logger.js";

// Runs scheduled maintenance. Start one instance alongside the API: `pnpm worker`.

if (!env.REDIS_URL) {
  logger.fatal("REDIS_URL is required to run the worker");
  process.exit(1);
}

// BullMQ requires maxRetriesPerRequest: null on its connections.
const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
const queue = new Queue("maintenance", { connection });

const schedules: Record<MaintenanceTask, string> = {
  "expire-subscriptions": "0 * * * *",
  "purge-deleted-resumes": "30 2 * * *",
  "purge-old-uploads": "45 2 * * *",
  "purge-guest-users": "0 3 * * *",
};

for (const [task, pattern] of Object.entries(schedules)) {
  await queue.upsertJobScheduler(task, { pattern, tz: "Asia/Kolkata" }, { name: task });
}

const worker = new Worker(
  "maintenance",
  async (job) => {
    const task = maintenanceTasks[job.name as MaintenanceTask];
    if (!task) throw new Error(`Unknown maintenance task: ${job.name}`);
    await task();
  },
  { connection, concurrency: 1 },
);

worker.on("failed", (job, err) => logger.error({ err, task: job?.name }, "Maintenance task failed"));
logger.info("Worker started");

async function shutdown() {
  await worker.close();
  await queue.close();
  await connection.quit();
  await pool.end();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
