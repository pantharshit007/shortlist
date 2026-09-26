# Resume Builder web app

TanStack Start (React, Vite) frontend for the resume builder. It talks to the Express API in `../backend`.

## Run locally

Start the backend first (see `../backend/README.md`), then:

```sh
pnpm install
cp .env.example .env   # defaults point at http://localhost:4000
pnpm dev               # http://localhost:3000
```

Sign in with a magic link: without an email provider configured, the backend prints the link in its log.

## Scripts

| Script                        | What it does                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm dev`                    | Dev server on port 3000                                                               |
| `pnpm build` / `pnpm preview` | Production build and local preview                                                    |
| `pnpm lint` / `pnpm format`   | ESLint and Prettier                                                                   |
| `pnpm api:types`              | Regenerate `src/lib/api/schema.d.ts` from `../backend/openapi.json` after API changes |

## Layout

```
src/
  routes/
    _site/*            public pages: landing, pricing, templates, privacy, terms
    login.tsx          sign in (Google, GitHub, email link)
    _app/*             signed-in app: dashboard, resumes/new, resumes/$resumeId (editor), profile, jobs, settings
    $username/*        public profile and share pages, rendered on the server
  components/
    ui/                shadcn/ui components (generated, not linted)
    landing, site      public site
    app                app shell and shared app pieces
    editor             content editor, LaTeX editor, PDF preview, history and share panels
    ai                 tailoring, edits and change review
    public             share page rendering
  lib/
    api/               typed client (openapi-fetch), queries, types
    auth-client.ts     Better Auth client
    theme.tsx          light, dark and system themes
    site.ts            product name and URLs (change the working name here)
```

## Design

- Light mode is a cool paper grey, not white; dark mode is a green-tinted charcoal. Tokens live in `src/styles.css`.
- Accent is fountain-pen teal; the highlighter color marks AI changes. No purple.
- Fonts: Source Serif 4 for headings, Hanken Grotesk for the interface, JetBrains Mono in the LaTeX editor.
- Template previews in `public/templates` are real renders from the backend's templates.

## Deploy

Deploys to Vercel (`vercel.json`). Set `VITE_API_URL` to the API's public URL and `VITE_SITE_URL` to this site's URL.
In production the API sets its session cookie on the shared parent domain (`COOKIE_DOMAIN` in the backend).
