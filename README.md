# eseielts

Web app for **IELTS Writing** practice: timed tasks, optional visuals for Task 1, and **AI feedback** via a **Netlify serverless function** (Google Gemini). Optional **Firebase** (Auth, Firestore, Storage) powers sign-in, saving attempts, prompts, and a small backoffice.

---

## Table of contents

- [eseielts](#eseielts)
  - [Table of contents](#table-of-contents)
  - [Stack](#stack)
  - [Prerequisites](#prerequisites)
  - [Getting started](#getting-started)
  - [Environment variables](#environment-variables)
    - [Client (Vite) — `VITE_*`](#client-vite--vite_)
    - [Netlify Functions — `GEMINI_*`](#netlify-functions--gemini_)
  - [Local development](#local-development)
    - [Recommended: one command, full stack](#recommended-one-command-full-stack)
    - [Plain Vite only (`yarn dev`)](#plain-vite-only-yarn-dev)
    - [SPA routing in dev vs production](#spa-routing-in-dev-vs-production)
  - [Building and preview](#building-and-preview)
  - [Deploying on Netlify](#deploying-on-netlify)
  - [Project layout](#project-layout)
  - [Scripts](#scripts)
  - [Troubleshooting](#troubleshooting)
  - [License](#license)

---

## Stack

| Area                   | Technology                                                                  |
| ---------------------- | --------------------------------------------------------------------------- |
| UI                     | React 19, TypeScript, Vite 8                                                |
| Routing                | React Router 7                                                              |
| Styling                | Tailwind CSS 4, Radix primitives, shadcn-style UI under `src/components/ui` |
| Validation             | Zod                                                                         |
| Backend (feedback)     | Netlify Function `gemini-feedback` + `@google/generative-ai`                |
| Data / auth (optional) | Firebase (Auth, Firestore, Storage)                                         |
| Hosting                | Netlify (static `dist` + functions)                                         |

Package manager: **Yarn** (v1).

---

## Prerequisites

- **Node.js** (LTS recommended; matches Vite / tooling expectations)
- **Yarn** (`yarn install`)
- **Netlify CLI** — already in `devDependencies`; `yarn dev:netlify` runs it via `netlify dev`

---

## Getting started

```bash
git clone <repository-url>
cd eseielts
yarn install
cp .env.example .env
```

Edit `.env` with your Firebase web config (if you use Firebase) and Gemini-related values for local functions (see below).

---

## Environment variables

### Client (Vite) — `VITE_*`

These are embedded in the browser bundle. Set them in **`.env`** locally and in **Netlify → Site configuration → Environment variables** for production builds.

| Variable                            | Purpose              |
| ----------------------------------- | -------------------- |
| `VITE_FIREBASE_API_KEY`             | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Auth domain          |
| `VITE_FIREBASE_PROJECT_ID`          | Project ID           |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Storage bucket       |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID  |
| `VITE_FIREBASE_APP_ID`              | App ID               |

If Firebase vars are missing, parts of the app that depend on Firebase may degrade gracefully (e.g. feedback can still work; saving/history/backoffice may not).

| Variable                   | Purpose                                                                                                                                                                                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_GEMINI_FEEDBACK_URL` | **Optional.** Full URL to the feedback function. Use only if the UI and the function run on **different** origins (see [Local development](#local-development)). If unset, the app calls `/.netlify/functions/gemini-feedback` on the **same** host as the page. |

**Do not** prefix secrets with `VITE_` — they would be exposed to the client.

### Netlify Functions — `GEMINI_*`

Used only by **`netlify/functions/gemini-feedback.ts`** at runtime. Set in **`.env`** for `netlify dev` and in **Netlify** for production (not `VITE_`).

| Variable         | Purpose                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/) / Gemini API key for `generativelanguage.googleapis.com`                                   |
| `GEMINI_MODEL`   | Optional. Model id (default in code: **`gemini-2.5-flash`**). Older ids such as `gemini-2.0-flash` may return **404** for new API projects. |

---

## Local development

### Recommended: one command, full stack

```bash
yarn dev:netlify
```

- Opens the **Netlify Dev** proxy (configured as **port `8888`** in `netlify.toml`) and starts **Vite** on **`5173`**.
- **Open the app at `http://localhost:8888`** (use the exact URL the CLI prints).
- Serverless functions are available at **`/.netlify/functions/gemini-feedback`** on that same origin, so leave **`VITE_GEMINI_FEEDBACK_URL`** unset unless you know you need it.

**Why not `http://localhost:5173` with `yarn dev:netlify`?**  
`5173` is only the inner Vite server. Functions are wired through the Netlify dev URL (**`8888`**), not through Vite alone.

### Plain Vite only (`yarn dev`)

```bash
yarn dev
```

- UI at **`http://localhost:5173`** works for static browsing, but **`/.netlify/functions/*` does not exist** on that origin.
- **Writing feedback (Submit)** will fail unless you either:
  - run **`yarn dev:netlify`** and use **`:8888`**, or
  - run a **separate** functions server and set **`VITE_GEMINI_FEEDBACK_URL`**, for example:

    ```bash
    # Terminal 1
    yarn dev

    # Terminal 2 (example; check the port Netlify prints)
    yarn netlify functions:serve
    ```

    Then in `.env`:

    ```bash
    VITE_GEMINI_FEEDBACK_URL=http://localhost:9999/.netlify/functions/gemini-feedback
    ```

    Restart Vite after changing `VITE_*` variables.

### SPA routing in dev vs production

- **Production** SPA fallback is **`public/_redirects`** (copied into **`dist`** on build).
- **Local `netlify dev`** uses an empty **`dev-publish/`** publish directory so a previous **`dist/_redirects`** does not break Vite module loading (e.g. `/src/main.tsx`). See comments in `netlify.toml`.

---

## Building and preview

```bash
yarn build    # tsc -b && vite build → output in dist/
yarn preview  # local static preview of dist (no Netlify functions)
```

`yarn preview` does not run Netlify functions; use **`yarn dev:netlify`** or a deployed site to test the full feedback flow end-to-end.

---

## Deploying on Netlify

1. **Build settings** (often auto-detected from `netlify.toml`):
   - Build command: **`yarn build`**
   - Publish directory: **`dist`**
2. **Functions**: `netlify/functions` (see `netlify.toml` `[functions]`).
3. **Environment variables** in the Netlify UI:
   - All **`VITE_FIREBASE_*`** (and any other `VITE_*` you use) for the frontend build.
   - **`GEMINI_API_KEY`** (required for feedback).
   - **`GEMINI_MODEL`**: set to a supported model (e.g. **`gemini-2.5-flash`**) or omit to use the default in code.
4. **Do not** set **`VITE_GEMINI_FEEDBACK_URL`** in production unless you intentionally call another URL; the default relative path is correct on Netlify.
5. Redeploy after changing environment variables.

---

## Project layout

```text
eseielts/
├── dev-publish/          # empty dir; netlify dev publish root (avoids stale dist/_redirects locally)
├── netlify/
│   └── functions/
│       └── gemini-feedback.ts
├── public/               # static assets + _redirects (SPA rewrite for production)
├── src/
│   ├── components/       # layout, auth toolbar, theme, ui/
│   ├── constants/
│   ├── contexts/         # auth
│   ├── hooks/
│   ├── lib/              # firebase
│   ├── pages/            # home, sign-in, writing, history, backoffice, etc.
│   ├── schemas/
│   ├── services/         # gemini feedback client, firestore, storage
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── netlify.toml
├── vite.config.ts
└── package.json
```

---

## Scripts

| Command             | Description                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| `yarn dev`          | Vite dev server only (port **5173**; no Netlify functions on that origin). |
| `yarn dev:netlify`  | Netlify Dev + Vite; use **port 8888** in the browser.                      |
| `yarn build`        | Typecheck and production build to **`dist`**.                              |
| `yarn preview`      | Serve **`dist`** locally (static).                                         |
| `yarn lint`         | ESLint.                                                                    |
| `yarn format`       | Prettier write.                                                            |
| `yarn format:check` | Prettier check.                                                            |

---

## Troubleshooting

| Symptom                                     | Likely cause                                | What to try                                                                                                                              |
| ------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Failed to fetch** (Submit)                | Wrong function URL / nothing listening      | Use **`yarn dev:netlify`** and **`:8888`**, or set **`VITE_GEMINI_FEEDBACK_URL`** to a running `functions:serve` URL.                    |
| **Feedback endpoint not found (404)**       | Page on **5173** instead of Netlify dev URL | Open **`http://localhost:8888`** when using `yarn dev:netlify`.                                                                          |
| **MIME / module script** errors on **8888** | Stale or conflicting SPA rewrites           | Ensure **`netlify.toml`** `[dev] publish` is **`dev-publish`** and you are not loading **`dist/_redirects`** in dev; rebuild docs above. |
| **Gemini 404 / model not available**        | Deprecated or restricted model id           | Set **`GEMINI_MODEL=gemini-2.5-flash`** (locally and on Netlify) or remove it to use the code default.                                   |
| Env changes ignored                         | Vite / Netlify cache                        | Restart **`yarn dev:netlify`** after editing **`.env`**.                                                                                 |

---

## License

This project is **private** (`"private": true` in `package.json`). Add a license file if you open-source it.
