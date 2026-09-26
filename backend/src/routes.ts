import { Router } from "express";
import { importsRouter } from "./modules/imports/imports.routes.js";
import { jobsRouter } from "./modules/jobs/jobs.routes.js";
import { pdfsRouter } from "./modules/pdfs/pdfs.routes.js";
import { profilesRouter } from "./modules/profiles/profiles.routes.js";
import { publicRouter } from "./modules/public/public.routes.js";
import { resumesRouter } from "./modules/resumes/resumes.routes.js";
import { shareLinksRouter } from "./modules/share-links/share-links.routes.js";
import { suggestionsRouter } from "./modules/suggestions/suggestions.routes.js";
import { templatesRouter } from "./modules/templates/templates.routes.js";
import { uploadsRouter } from "./modules/uploads/uploads.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";

export const v1 = Router();

v1.use(usersRouter);
v1.use(profilesRouter);
v1.use(templatesRouter);
v1.use(resumesRouter);
v1.use(pdfsRouter);
v1.use(uploadsRouter);
v1.use(importsRouter);
v1.use(jobsRouter);
v1.use(suggestionsRouter);
v1.use(shareLinksRouter);
v1.use(publicRouter);
