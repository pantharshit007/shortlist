import type { NextFunction, Request, Response } from "express";
import { trackServer } from "../lib/analytics.js";

// Every failed or slow request is recorded; a sample of the rest keeps PostHog inside its free tier.
// For request counts, weight each event by 1 / sample_rate.
const SAMPLE_RATE = 0.1;
const SLOW_MS = 1000;

// The matched pattern (/v1/resumes/:resumeId), never the real path, which holds ids. Express clears
// baseUrl when a route passes an error on, so the /v1 mount is restored from the original URL then.
function routePattern(req: Request) {
  if (!req.route) return "unmatched";
  const base = req.baseUrl || (req.originalUrl.startsWith("/v1/") ? "/v1" : "");
  return `${base}${String(req.route.path)}`;
}

export function requestMetrics(req: Request, res: Response, next: NextFunction) {
  if (req.path === "/health") return next();
  const started = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    const always = res.statusCode >= 500 || durationMs >= SLOW_MS;
    if (!always && Math.random() >= SAMPLE_RATE) return;
    trackServer("api_request", {
      method: req.method,
      route: routePattern(req),
      status: res.statusCode,
      duration_ms: Math.round(durationMs),
      sample_rate: always ? 1 : SAMPLE_RATE,
    });
  });
  next();
}
