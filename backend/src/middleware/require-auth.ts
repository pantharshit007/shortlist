import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { auth, type AuthUser } from "../lib/auth.js";
import { UnauthorizedError } from "../lib/errors.js";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const result = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!result) throw new UnauthorizedError();
  req.user = result.user;
  req.session = result.session;
  next();
}

// For handlers behind requireAuth.
export function currentUser(req: Request): AuthUser {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}
