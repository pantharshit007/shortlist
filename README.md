# Shortlist

An AI resume builder for Indian CS students and developers, live at [shortlist.co.in](https://shortlist.co.in).
Write a resume in a form or in LaTeX, tailor it to a job post with AI, download a real LaTeX PDF and share it
with a link that tells you who opened it.

## What it does

- **Two editors.** A form editor for most people, and a LaTeX editor with live errors for people who want full
  control. Both render through the same LaTeX templates: Developer, Jake's Resume, Compact and Modern.
- **Import.** Upload a PDF, LaTeX file or pasted text; AI reads it into an editable resume.
- **Tailoring.** Paste a job post or its URL. AI suggests changes drawn only from the person's own profile, and
  every change is shown for review before it is applied.
- **Versions.** Every save is a version, so any earlier state can be restored.
- **Share links.** Public links at `shortlist.co.in/<username>/<slug>`, optionally password protected, with
  view analytics (when, how often, where from).
- **Custom templates.** Save any resume or LaTeX file as a starting point.
- **Bring your own key.** People can add their own OpenAI, Anthropic or OpenRouter key; AI limits then don't apply.
- **Plans.** Free: unlimited resumes you write yourself and 3 AI-tailored resumes a month. Season Pass (₹499 for
  6 months) and Pro (₹129 a month) raise the AI limits. Payments go through Razorpay.
- **Admin dashboard** at `/admin` for the emails in `ADMIN_EMAILS`: product numbers, users (with suspend, sign
  out and free plans), AI cost, revenue, content, PostHog traffic and system health.

Sign-in is Google or GitHub, plus one-click guest accounts in development. Sign in with ChatGPT is built and
turns on once OpenAI grants partner access.

## Repository

| Folder      | What it is                                                                         | Hosted on               |
| ----------- | ---------------------------------------------------------------------------------- | ----------------------- |
| `frontend/` | TanStack Start (React 19, Vite), TanStack Router and Query, shadcn/ui, Tailwind v4 | Vercel                  |
| `backend/`  | Express 5 API, Drizzle ORM on Postgres 17, Better Auth, Tectonic LaTeX compiler    | Docker Compose on a VPS |
| `.github/`  | CI for both apps, and the backend deploy                                           | GitHub Actions          |

Each app has its own README with setup, scripts and layout: [frontend](frontend/README.md),
[backend](backend/README.md). Coding rules for people and agents are in [CLAUDE.md](CLAUDE.md) and
[AGENTS.md](AGENTS.md).

## Run it locally

You need Node 24, pnpm 11, Docker and [Tectonic](https://tectonic-typesetting.github.io) (`brew install tectonic`).

```sh
# API on http://localhost:4000
cd backend
pnpm install
cp .env.example .env              # set BETTER_AUTH_SECRET: openssl rand -hex 32
pnpm services:up                  # Postgres in Docker
pnpm db:migrate && pnpm db:seed
pnpm dev

# App on http://localhost:3000, in a second terminal
cd frontend
pnpm install
cp .env.example .env
pnpm dev
```

Use "Continue as guest" to sign in before any OAuth app is set up. Without an AI key, AI features return a clear
error and everything else works.

## How production fits together

```
shortlist.co.in  ->  Vercel (frontend)
                        |  fetch with the session cookie (shared on .shortlist.co.in)
api.shortlist.co.in  ->  VPS: existing Caddy (HTTPS)  ->  api  ->  Postgres
                                                           |-> compiler (isolated, no internet)
                                                           |-> Cloudflare R2 (PDFs, uploads, backups)
                                                           |-> OpenAI, PostHog, Razorpay
                         worker (scheduled cleanup), backup (nightly, encrypted, to R2)
```

- DNS is on Cloudflare, with every record set to DNS only.
- The API shares the VPS and its Caddy with another app; see [backend/README.md](backend/README.md#deploy-to-the-vps).
- There is no Redis. Rate limits count in memory, scheduled jobs take Postgres advisory locks, and webhook
  de-duplication is a Postgres table.

## Deploys

- **Frontend:** Vercel builds every push to `main` (project root `frontend`).
- **Backend:** `.github/workflows/deploy-backend.yml` runs on pushes to `main` that change `backend/`. It runs
  typecheck, lint and tests, then connects to the VPS over SSH (pinned host key), pulls, rebuilds with Docker
  Compose and checks `https://api.shortlist.co.in/health`. Frontend-only pushes never touch the VPS.
- **CI:** `.github/workflows/ci.yml` checks both apps on every push and pull request.

Secrets for the deploy live in GitHub Actions: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (a key used only for
deploys) and `VPS_FINGERPRINT` (the server's ECDSA host key).

## Analytics and privacy

PostHog receives page views, product events (ids, counts and choices, never resume content) and sampled API
timings. Session recordings mask all text and inputs. The admin dashboard reads PostHog back through the API, so
the personal API key never reaches a browser.
