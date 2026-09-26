import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { auth } from "../lib/auth.js";

// Attaches the user when signed in, but never rejects the request.
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const result = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) }).catch(() => null);
  if (result) {
    req.user = result.user;
    req.session = result.session;
  }
  next();
}
