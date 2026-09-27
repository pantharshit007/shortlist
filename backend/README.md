# Resume Builder API

Express + TypeScript backend for the resume builder: auth, resumes and versions, LaTeX compilation,
AI tailoring, share links, billing. The frontend lives in `../frontend`.

## Run locally

Requirements: Node 24, pnpm 11, Docker, and [Tectonic](https://tectonic-typesetting.github.io) (`brew install tectonic`).

```sh
pnpm install
cp .env.example .env              # then set BETTER_AUTH_SECRET: openssl rand -hex 32
pnpm services:up                  # Postgres + Redis in Docker
pnpm db:migrate && pnpm db:seed   # tables + templates
pnpm dev                          # API on http://localhost:4000
pnpm worker                       # optional: scheduled maintenance jobs
```

Before OAuth apps are set up, use "Continue as guest" on the sign-in page (on by default in development).
Without an AI key, AI endpoints return `AI_NOT_CONFIGURED`; everything else works.

## Scripts

| Script                                         | What it does                                              |
| ---------------------------------------------- | --------------------------------------------------------- |
| `pnpm dev`                                     | API with reload                                           |
| `pnpm worker`                                  | Background worker (subscription expiry, cleanup)          |
| `pnpm compiler`                                | Standalone LaTeX compiler service, as used in production  |
| `pnpm test`                                    | Unit tests (template tests need Tectonic installed)       |
| `pnpm lint` / `pnpm format` / `pnpm typecheck` | Code quality                                              |
| `pnpm db:generate`                             | Create a migration after changing `src/db/schema`         |
| `pnpm db:migrate` / `pnpm db:seed`             | Apply migrations / sync templates (development)           |
| `pnpm db:studio`                               | Browse the database                                       |
| `pnpm openapi`                                 | Regenerate `openapi.json` for the frontend's typed client |
| `pnpm build` then `pnpm start`                 | Production build                                          |

## Layout

```
src/
  server.ts            API entry            worker.ts          scheduled jobs
  app.ts               middleware + routes  compiler-server.ts isolated LaTeX compiler
  config/env.ts        validated env vars   openapi.ts         API spec from Zod schemas
  db/                  Drizzle schema, client, seed
  lib/                 auth, ai, latex, storage, email, errors, rate limits, razorpay
  middleware/          requireAuth, validate, rate limits, errors
  modules/<name>/      routes -> controller -> service, plus Zod schemas
  schemas/             resume content schema shared by every module
  templates/           LaTeX templates (Developer, Jake's, Compact, Modern)
drizzle/               SQL migrations
deploy/                Caddyfile, backup script
```

Services never touch `req`/`res`, so the same logic can be reused by the worker or a future MCP server.
The API is resource-oriented: actions like restoring or applying an AI suggestion are modelled as creating a
version (`POST /v1/resumes/:id/versions`), not as action URLs.

## API

The full spec is served at `GET /v1/openapi.json` and committed as `openapi.json`. Auth is handled by Better Auth
under `/api/auth/*` (session cookie). Errors always look like `{ "error": { "code", "message", "details" } }`.

| Area                  | Endpoints                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------- |
| Account               | `GET/PATCH/DELETE /v1/me`, `GET /v1/me/data`, `GET /v1/usernames/:username`, `GET /v1/usage` |
| Profile and templates | `GET/PUT /v1/profile`, `GET /v1/templates`                                                   |
| Resumes               | `GET/POST /v1/resumes`, `GET/PATCH/DELETE /v1/resumes/:id`                                   |
| Versions              | `GET/POST /v1/resumes/:id/versions`, `GET/PATCH /v1/resumes/:id/versions/:versionId`         |
| Output                | `GET /v1/resumes/:id/pdf`, `/tex`, `/json-resume`, `POST /v1/previews`                       |
| Import                | `POST /v1/uploads`, `POST /v1/imports`                                                       |
| Jobs and AI           | `GET/POST /v1/jobs`, `POST /v1/resumes/:id/suggestions`, `GET /v1/resumes/:id/coverage`      |
| Sharing               | `/v1/resumes/:id/share-links`, `/v1/share-links/:id`, `/v1/share-links/:id/stats`            |
| Public                | `GET /v1/public/users/:username`, `/v1/public/users/:username/resumes/:slug` (+ `/pdf`)      |
| Billing               | `POST /v1/checkouts`, `GET/DELETE /v1/subscription`, `POST /v1/webhooks/razorpay`            |

## Credentials

Every variable is listed in `.env.example`. Where to get them:

| Variable                                                      | Source                                                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`, `BACKUP_ENCRYPTION_KEY`                 | `openssl rand -hex 32` (keep a copy of the backup key outside the server)                                           |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `OPENROUTER_API_KEY` | Provider dashboard; set `AI_PROVIDER` to match                                                                      |
| `GOOGLE_CLIENT_ID/SECRET`                                     | Google Cloud Console, OAuth client, redirect `<BETTER_AUTH_URL>/api/auth/callback/google`                           |
| `GITHUB_CLIENT_ID/SECRET`                                     | GitHub Developer Settings, OAuth App, callback `<BETTER_AUTH_URL>/api/auth/callback/github`                         |
| `CHATGPT_CLIENT_ID/SECRET`                                    | OpenAI platform console, Sign in with ChatGPT (beta), redirect `<BETTER_AUTH_URL>/api/auth/callback/chatgpt`        |
| `R2_*`                                                        | Cloudflare dashboard, R2, bucket + API token with read/write on it                                                  |
| `RAZORPAY_KEY_ID/SECRET`                                      | Razorpay dashboard, API keys                                                                                        |
| `RAZORPAY_PRO_PLAN_ID`                                        | Razorpay dashboard, Subscriptions, create a monthly plan (₹129)                                                     |
| `RAZORPAY_WEBHOOK_SECRET`                                     | Razorpay dashboard, Webhooks, URL `<BETTER_AUTH_URL>/v1/webhooks/razorpay` with the events listed in `.env.example` |
| `JINA_API_KEY`                                                | Optional, jina.ai, raises the limit for fetching job posts by URL                                                   |

## Deploy to the VPS

The production stack (`docker-compose.prod.yml`) runs Caddy (HTTPS), the API, the worker, the LaTeX compiler,
Postgres, Redis and nightly encrypted backups.

The compiler runs untrusted LaTeX, so it holds no secrets, has no internet access (the TeX packages are
downloaded when the image is built), runs as a non-root user on a read-only filesystem, and has CPU, memory and
process limits. Postgres, Redis and the compiler are on internal networks only.

1. Harden the server once: create a sudo user, log in with SSH keys, disable root and password login, allow only
   ports 22, 80 and 443 (`ufw`), install `fail2ban` and `unattended-upgrades`, install Docker.
2. Point DNS for `api.<domain>` at the server.
3. On the server:
   ```sh
   git clone <repo> && cd resumebuilder/backend
   cp .env.example .env.production   # fill in production values, NODE_ENV=production, STORAGE_DRIVER=r2
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
   ```
   The API container applies migrations and syncs templates on start.
4. Set `FRONTEND_URL` to the deployed frontend, `BETTER_AUTH_URL` to `https://api.<domain>` and `COOKIE_DOMAIN`
   to `.<domain>` so the frontend and API share the session cookie.

Update: `git pull && docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build`.

## Backups

The `backup` service dumps Postgres every 24 hours, encrypts it with `BACKUP_ENCRYPTION_KEY` and uploads it to
`backups/postgres/` in the R2 bucket. Add an R2 lifecycle rule to delete old backups (e.g. after 30 days).

Restore (test this once before launch):

```sh
aws s3 cp s3://$R2_BUCKET/backups/postgres/<file>.sql.gz.enc . --endpoint-url https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com
openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_ENCRYPTION_KEY -in <file>.sql.gz.enc | gunzip \
  | docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d resumebuilder
```
