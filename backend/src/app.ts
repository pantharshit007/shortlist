import cors from "cors";
import express from "express";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { auth } from "./lib/auth.js";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { apiLimiter } from "./middleware/rate-limit.js";
import { v1 } from "./routes.js";

export const app = express();

// In production the app sits behind Caddy; trust its X-Forwarded-* headers for client IPs.
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(pinoHttp({ logger }));

// Better Auth reads the raw request body, so it is mounted before express.json().
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/v1", apiLimiter, v1);

app.use(notFound);
app.use(errorHandler);
