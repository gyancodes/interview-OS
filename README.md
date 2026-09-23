# InterviewOS

AI-powered interview preparation for software engineers. Practice with questions generated live by AI, learn from structured study material, and run full mock interviews — all in the browser.

## Features

- **Live question generation** — every practice question is generated on the fly for the selected topic and skill level. There is no static question bank, so no two sessions are the same.
- **Skill levels** — questions are calibrated to four levels: Beginner, Intermediate, Advanced, and Expert, plus a Mixed mode for varied sessions.
- **AI evaluation and feedback** — answers are scored with strengths, missing concepts, corrections, and a follow-up question, the way a real interviewer would probe.
- **Learning materials** — AI-generated study guides per topic and level: concept walkthroughs, code examples, common mistakes, interview focus areas, and a practice checklist.
- **AI mock interviews** — timed, role-based mock interviews (frontend, backend, full stack, Node.js, DevOps) with a summary and suggested practice areas at the end.
- **Progress tracking** — attempts, weak areas, per-topic mastery, and overall readiness are tracked locally in the browser.
- **Accounts and sessions** — email/password sign up and sign in backed by Appwrite. The dashboard, practice, study guides and mock interviews all live behind an authenticated session.
- **Enhanced landing page** — a public marketing page with the curriculum, feedback loop and FAQ, which adapts its call to action once you are signed in.

## Tech Stack

- [Next.js](https://nextjs.org) 15 (App Router) with React 19
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com) 4
- [Groq](https://groq.com) API for AI generation (model configurable via environment variable)
- LocalStorage for persistence (attempts, saved questions, mock interview history), namespaced per account
- [Appwrite](https://appwrite.io) for accounts and sessions, using the server-side Node SDK with an HTTP-only session cookie

## Getting Started

### Prerequisites

- Node.js 18.18 or later
- A Groq API key (free at [console.groq.com](https://console.groq.com))
- An Appwrite project (free at [cloud.appwrite.io](https://cloud.appwrite.io))

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/gyancodes/interview-OS.git
   cd interview-OS
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your environment file:

   ```bash
   cp .env.example .env.local
   ```

   Then set `GROQ_API_KEY` in `.env.local`. Optionally set `GROQ_MODEL` to override the default model.

   For Appwrite, set the following in `.env.local` as well:

   | Variable | Scope | Purpose |
   | --- | --- | --- |
   | `NEXT_PUBLIC_APPWRITE_ENDPOINT` | public | Appwrite endpoint, e.g. `https://cloud.appwrite.io/v1` |
   | `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | public | Project ID from the Appwrite console |
   | `APPWRITE_API_KEY` | server only | Creates accounts and sessions from the server |

   1. Create a project, then add a **Web platform** with the hostname `localhost` (add your production domain later).
   2. Create an **API key** with the `users.write` and `sessions.write` scopes.
   3. Restart the dev server after saving `.env.local`.

   Until Appwrite is configured, the sign-in pages show setup instructions instead of a broken form.

4. Start the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | Run TypeScript type checking |

## Project Structure

```
src/
├── app/                      # Pages and API route handlers
│   ├── (marketing)/          # Public landing page at /
│   ├── (auth)/               # Sign in / sign up (split-screen auth shell)
│   ├── (app)/                # Authenticated area: dashboard, practice, learn, mock-interview, profile
│   └── api/ai/               # Server-side AI endpoints (question, evaluate, explain, learn, interview)
├── middleware.ts             # Redirects unauthenticated requests to /login
├── components/               # Reusable UI components
│   ├── auth/                 # AuthProvider, auth forms, user menu, account panel
│   └── landing/              # Landing page sections (hero, features, showcase, curriculum, FAQ)
├── data/                     # Topic catalogue
└── lib/                      # Core logic: AI client, prompts, storage, progress, types
    └── appwrite/             # Appwrite config, server clients, auth actions, error mapping
```

The Groq API key is only read inside server-side route handlers (`src/lib/groq.ts`) and is never sent to the browser. The Appwrite API key is server-only too (`src/lib/appwrite/server.ts`); the browser only ever receives an HTTP-only session cookie, and authentication state is re-verified against Appwrite on every request.

## License

This project is open source. Add a license (for example, MIT) if you want it governed by specific terms.
