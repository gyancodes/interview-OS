# Good First Issues — UI Backlog

Ready-to-open issues for first-time contributors. All of them are UI-focused and scoped to `src/app` and `src/components` only — no AI or storage changes required.

To publish each one, open a new issue on GitHub, paste the title and body, and add the labels `good first issue` and `ui`. If the [GitHub CLI](https://cli.github.com) is installed and authenticated, the issues can be created in bulk with `gh issue create --title "..." --body-file <file> --label "good first issue" --label "ui"`.

---

## 1. Add copy-to-clipboard buttons for questions and AI answers

**Area:** UI / practice session

**Task:** Add a small "Copy" button to `src/components/QuestionCard.tsx` and `src/components/AiResponse.tsx` that copies the question text (and, in `AiResponse`, the generated answer) to the clipboard using `navigator.clipboard.writeText`.

**Why it matters:** Users often paste questions or model answers into notes. Today the only option is manual text selection.

**Where to start:**

- `src/components/QuestionCard.tsx`
- `src/components/AiResponse.tsx`
- Reuse `buttonStyles.ghost` from `src/components/ui.tsx` for consistent styling.

**Acceptance criteria:**

- [ ] Copy button on the question card and inside AI response cards
- [ ] Button shows "Copied" for about two seconds after clicking
- [ ] Handles the clipboard promise failure silently (no console crash)
- [ ] `npm run typecheck` and `npm run build` pass

**Skills needed:** React basics, Tailwind CSS

---

## 2. Build a Saved Questions page

**Area:** UI / navigation

**Task:** Create a `/saved` page that lists questions saved by the user and lets them remove items. The storage layer already provides everything needed: `getSavedQuestions`, `saveQuestion`, and `getFavoriteQuestionIds` in `src/lib/storage.ts` — but no UI uses them yet. Add a "Save" action in the practice session and a nav entry in `src/components/Header.tsx`.

**Why it matters:** Users cannot revisit questions they found hard or interesting. The persistence layer exists and is unused, so this is pure UI work.

**Where to start:**

- `src/lib/storage.ts` (read-only — helpers already exist)
- `src/components/Header.tsx`
- New file: `src/app/saved/page.tsx`
- Follow the list/card patterns in `src/app/page.tsx` (Recent Questions section).

**Acceptance criteria:**

- [ ] `/saved` renders saved questions with topic, category, level, and saved date
- [ ] Each item has a remove action that updates the list immediately
- [ ] Empty state uses `EmptyState` from `src/components/ui.tsx`
- [ ] Page is responsive and matches the existing design tokens
- [ ] `npm run typecheck` and `npm run build` pass

**Skills needed:** React basics, Tailwind CSS

---

## 3. Add keyboard shortcuts to the practice session

**Area:** UI / practice session

**Task:** Add keyboard shortcuts to the practice screen: `Ctrl+Enter` (or `Cmd+Enter` on macOS) submits/reveals the answer, `1`/`2`/`3` select confidence ("Didn't know" / "Partially knew" / "Knew it") once the answer is revealed, and `Enter` continues to the next question. Show a small legend of the shortcuts under the answer editor.

**Why it matters:** Faster, more realistic practice flow — real interviews reward thinking and answering without breaking rhythm.

**Where to start:**

- `src/app/practice/page.tsx` (session screen: `advance`, `reveal`, `runEvaluation`)
- `src/components/AnswerEditor.tsx`
- Attach the key handler with a `useEffect` and make sure it never fires while the user is typing in the textarea (except `Ctrl+Enter`).

**Acceptance criteria:**

- [ ] Shortcuts work as described and never trigger while typing a plain answer (except `Ctrl+Enter`)
- [ ] Visible shortcut legend rendered on the session screen
- [ ] No duplicate submissions on repeated key presses
- [ ] `npm run typecheck` and `npm run build` pass

**Skills needed:** React hooks (`useEffect`, refs), DOM events

---

## 4. Add per-level progress breakdown to the dashboard

**Area:** UI / dashboard

**Task:** Extend the topic cards in `src/components/TopicCard.tsx` to show the number of attempts per skill level (Beginner / Intermediate / Advanced / Expert) as small stat chips, using the data already available in `Attempt` records (`attempt.difficulty`).

**Why it matters:** Users currently see one mastery percentage per topic; seeing where they practice (mostly beginner vs. advanced) makes the dashboard genuinely informative.

**Where to start:**

- `src/components/TopicCard.tsx`
- `src/app/page.tsx` (attempts are already loaded here)
- Use the level color conventions from `src/components/QuestionCard.tsx` (green/amber/red/blue).

**Acceptance criteria:**

- [ ] Chips only appear for levels with at least one attempt
- [ ] Colors match the level badge conventions used on question cards
- [ ] Cards still render cleanly when there are zero attempts
- [ ] `npm run typecheck` and `npm run build` pass

**Skills needed:** React basics, Tailwind CSS

---

## 5. Replace AI loading spinners with skeleton placeholders

**Area:** UI / loading states

**Task:** Replace the spinner-based loading state used while AI responses stream in (`AiResponse` with the `loading` prop, and the generating state in the practice session) with lightweight skeleton blocks (gray animated placeholder lines for the title, body, and key points), using Tailwind's `animate-pulse`.

**Why it matters:** AI calls take several seconds; skeletons communicate structure and reduce perceived waiting time compared to a single spinner.

**Where to start:**

- `src/components/AiResponse.tsx`
- `src/components/ui.tsx` (add a reusable `Skeleton` component here)
- `src/app/practice/page.tsx` (loading usage)

**Acceptance criteria:**

- [ ] Reusable `Skeleton` primitive in `src/components/ui.tsx`
- [ ] AI response loading uses the skeleton layout
- [ ] No layout shift when the real content replaces the skeleton
- [ ] `npm run typecheck` and `npm run build` pass

**Skills needed:** React basics, Tailwind CSS

---

## 6. Add a "clear data" section to the dashboard

**Area:** UI / dashboard, settings

**Task:** Add a small "Data" section at the bottom of the dashboard with buttons to clear attempt history, recent questions, and mock interview history. The storage layer already provides `clearAttempts`, `clearRecentQuestions`, and `clearMockInterviewHistory` in `src/lib/storage.ts` — none are exposed in the UI.

**Why it matters:** Users testing the app or sharing a machine need a way to reset their local data without opening browser dev tools.

**Where to start:**

- `src/app/page.tsx` (add the section and refresh local state after clearing)
- `src/lib/storage.ts` (read-only — helpers already exist)
- Use `buttonStyles.secondary`/`ghost` and follow a confirm-then-act pattern (a simple two-step button: first click shows "Click again to confirm").

**Acceptance criteria:**

- [ ] Three clear actions with a confirmation step (no accidental data loss)
- [ ] Dashboard stats refresh immediately after clearing
- [ ] Section is visually low-key at the bottom of the page
- [ ] `npm run typecheck` and `npm run build` pass

**Skills needed:** React state, Tailwind CSS
