import type { AuthSession, AuthUser } from "../lib/auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      session?: AuthSession;
    }
  }
}

export {};
