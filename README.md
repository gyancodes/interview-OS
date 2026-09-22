# InterviewOS

AI-powered interview preparation for software engineers. Practice with questions generated live by AI, learn from structured study material, and run full mock interviews — all in the browser.

## Features

- **Live question generation** — every practice question is generated on the fly for the selected topic and skill level. There is no static question bank, so no two sessions are the same.
- **Skill levels** — questions are calibrated to four levels: Beginner, Intermediate, Advanced, and Expert, plus a Mixed mode for varied sessions.
- **AI evaluation and feedback** — answers are scored with strengths, missing concepts, corrections, and a follow-up question, the way a real interviewer would probe.
- **Learning materials** — AI-generated study guides per topic and level: concept walkthroughs, code examples, common mistakes, interview focus areas, and a practice checklist.
- **AI mock interviews** — timed, role-based mock interviews (frontend, backend, full stack, Node.js, DevOps) with a summary and suggested practice areas at the end.
- **Progress tracking** — attempts, weak areas, per-topic mastery, and overall readiness are tracked locally in the browser.

## Tech Stack

- [Next.js](https://nextjs.org) 15 (App Router) with React 19
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com) 4
- [Groq](https://groq.com) API for AI generation (model configurable via environment variable)
- LocalStorage for persistence (attempts, saved questions, mock interview history)

## Getting Started

### Prerequisites

- Node.js 18.18 or later
- A Groq API key (free at [console.groq.com](https://console.groq.com))

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
├── app/                  # Pages and API route handlers
│   ├── api/ai/           # Server-side AI endpoints (question, evaluate, explain, learn, interview)
│   ├── learn/            # Learning materials page
│   ├── mock-interview/   # AI mock interview page
│   └── practice/         # Practice session page
├── components/           # Reusable UI components
├── data/                 # Topic catalogue
└── lib/                  # Core logic: AI client, prompts, storage, progress, types
```

The Groq API key is only read inside server-side route handlers (`src/lib/groq.ts`) and is never sent to the browser.

## License

This project is open source. Add a license (for example, MIT) if you want it governed by specific terms.
