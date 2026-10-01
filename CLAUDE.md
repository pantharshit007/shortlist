@AGENTS.md

# Shortlist

Resume builder for students and professionals in every field (software, data, banking, finance, consulting, marketing, design and more), built in India, at shortlist.co.in. `frontend/` is TanStack Start, `backend/` is Express + Postgres. Each has its own README with setup and scripts.

## Conventions

- Small, atomic commits, one step at a time. Never add a Co-Authored-By line.
- Never use em dashes, in code, copy, docs or commit messages.
- Resource-oriented REST. Zod schemas validate input and output; regenerate `backend/openapi.json` and `frontend/src/lib/api/schema.d.ts` after API changes (`pnpm openapi`, then `pnpm api:types`).
- Comments only where the code can't say it.
- Credentials go in `.env.example` with a comment on where to get them.
- UI work: follow the `ui-ux-pro-max` skill's checks, and keep the existing tokens in `frontend/src/styles.css` (no purple, light mode is off-white paper, never pure white).
