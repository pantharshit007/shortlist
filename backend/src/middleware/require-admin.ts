import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { ForbiddenError } from "../lib/errors.js";
import { currentUser } from "./require-auth.js";

// An unverified email could be claimed by anyone at the provider, so it never grants admin.
export const isAdmin = (user: { email: string; emailVerified: boolean }) =>
  user.emailVerified && env.ADMIN_EMAILS.includes(user.email.toLowerCase());

// For routes behind requireAuth.
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!isAdmin(currentUser(req))) throw new ForbiddenError();
  next();
}
