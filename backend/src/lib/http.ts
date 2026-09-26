import type { Response } from "express";
import type { z } from "zod";
import { env } from "../config/env.js";

// Response bodies are checked against their schema outside production to catch contract drift early.
export function sendData<S extends z.ZodType>(
  res: Response,
  schema: S,
  data: z.input<S>,
  status = 200,
) {
  const body = env.NODE_ENV === "production" ? data : schema.parse(data);
  res.status(status).json({ data: body });
}
