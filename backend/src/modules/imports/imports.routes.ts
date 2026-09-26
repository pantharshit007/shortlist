import { Router } from "express";
import { sendData } from "../../lib/http.js";
import { currentUser, requireAuth } from "../../middleware/require-auth.js";
import { aiLimiter } from "../../middleware/rate-limit.js";
import { validated } from "../../middleware/validate.js";
import { createImportBody, importResponse } from "./imports.schemas.js";
import { createImport } from "./imports.service.js";

export const importsRouter = Router();

// Returns extracted content; the client saves it with PUT /profile or POST /resumes.
importsRouter.post(
  "/imports",
  requireAuth,
  aiLimiter,
  ...validated({ body: createImportBody }, async (req, res) => {
    sendData(res, importResponse, await createImport(currentUser(req).id, req.body), 201);
  }),
);
