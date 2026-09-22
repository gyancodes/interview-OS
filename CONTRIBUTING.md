# Contributing to InterviewOS

Thank you for considering a contribution. This document explains how to set up the project, how to report issues, and what is expected in a pull request.

## Code of Conduct

Be respectful and constructive in issues, discussions, and code review. Assume good faith.

## Getting Started

1. Fork the repository and clone your fork:

   ```bash
   git clone https://github.com/<your-username>/interview-OS.git
   cd interview-OS
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env.local` from `.env.example` and set your `GROQ_API_KEY`.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Before pushing any change, make sure both checks pass:

   ```bash
   npm run typecheck
   npm run build
   ```

## Finding Work

- Look for issues labeled `good first issue` — these are self-contained and well-suited for a first contribution.
- Issues labeled `ui` involve components, styling, or page-level work in `src/app` and `src/components`.
- If you want to work on something not already tracked, open an issue first so it can be discussed before you invest time.

## How to Contribute

1. Open or claim an issue and comment that you are picking it up.
2. Create a branch from the latest `master`:

   ```bash
   git checkout -b feat/<short-description>
   ```

   Branch prefixes: `feat/` for features, `fix/` for bug fixes, `docs/` for documentation, `ui/` for interface-only changes.
3. Make your changes. Keep them focused — one issue per pull request.
4. Run `npm run typecheck` and `npm run build` and fix any failures.
5. Commit with clear, imperative messages, for example:

   ```text
   feat: add keyboard shortcuts to practice session
   fix: prevent duplicate explanation requests on retry
   docs: clarify environment setup in README
   ```
6. Push your branch and open a pull request against `master`, filling in the pull request template.

## Code Guidelines

- **TypeScript everywhere.** No `any` unless there is no reasonable alternative; explain it in a comment if used.
- **Follow existing patterns.** Server-side AI calls go through `src/lib/groq.ts`; browser AI calls through `src/lib/ai-client.ts`; LocalStorage access only through `src/lib/storage.ts`; prompts live in `src/lib/prompts.ts`.
- **Styling.** Use the existing Tailwind design tokens (`surface`, `border`, `accent`, `muted`, `faint`, etc.) defined in `src/app/globals.css`. Do not hard-code colors.
- **Components.** Prefer small, focused components. Reuse the primitives in `src/components/ui.tsx` (buttons, empty states, error notes, progress bars) instead of duplicating them.
- **Error handling.** User-facing failures must render a readable message and a retry path, consistent with the existing `ErrorNote` usage.

## Reporting Issues

Use the issue templates:

- **Bug report** — include steps to reproduce, expected behavior, actual behavior, browser, and screenshots if visual.
- **Feature request** — describe the problem first, then the proposed solution.
- **Good first issue (maintainers)** — propose a small, well-scoped task with acceptance criteria.

## Pull Request Review

- Maintainers aim to review pull requests within a few days.
- Changes may be requested; this is normal and not a judgment on the contributor.
- Pull requests are squash-merged to keep history readable.

## Questions

Open a discussion or comment on the relevant issue. When in doubt, ask before building.
