import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { z } from "zod";
import { ValidationError } from "../lib/errors.js";

type Schemas = {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
};

type Parsed<S extends Schemas, K extends keyof Schemas> = S[K] extends z.ZodType
  ? z.infer<S[K]>
  : Request[K];

// Request type for a handler behind `validate(schemas)`.
export type ValidatedRequest<S extends Schemas> = Request<
  Parsed<S, "params">,
  unknown,
  Parsed<S, "body">,
  Parsed<S, "query">
>;

export function validate<S extends Schemas>(schemas: S) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const issues: { location: string; path: string; message: string }[] = [];

    for (const location of ["params", "query", "body"] as const) {
      const schema = schemas[location];
      if (!schema) continue;

      const result = schema.safeParse(req[location]);
      if (!result.success) {
        for (const issue of result.error.issues) {
          issues.push({ location, path: issue.path.join("."), message: issue.message });
        }
        continue;
      }

      // Express 5 exposes req.query as a getter, so it has to be redefined, not assigned.
      Object.defineProperty(req, location, {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }
    next();
  };
}

// Pairs validation with a handler typed from the same schemas. Express's own route types
// assume string query values, so the typed handler is widened once here instead of in every route.
export function validated<S extends Schemas>(
  schemas: S,
  handler: (req: ValidatedRequest<S>, res: Response) => unknown,
): RequestHandler[] {
  return [validate(schemas), handler as unknown as RequestHandler];
}
