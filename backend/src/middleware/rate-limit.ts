import type { Request } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { redis } from "../lib/redis.js";

function limiter(name: string, windowMs: number, limit: number) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    // Signed-in users are limited per account, everyone else per IP.
    keyGenerator: (req: Request) => req.user?.id ?? ipKeyGenerator(req.ip ?? "unknown"),
    ...(redis && {
      store: new RedisStore({
        prefix: `rl:${name}:`,
        sendCommand: (command: string, ...args: string[]) => redis!.call(command, ...args) as Promise<RedisReply>,
      }),
    }),
    handler: (_req, res) => {
      res.status(429).json({ error: { code: "RATE_LIMITED", message: "Too many requests. Try again in a minute." } });
    },
  });
}

const minute = 60_000;

export const apiLimiter = limiter("api", minute, 300);
export const publicLimiter = limiter("public", minute, 120);
export const compileLimiter = limiter("compile", minute, 30);
export const aiLimiter = limiter("ai", minute, 10);
