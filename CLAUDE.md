# Project instructions

## Mills (`Mills/`)

- **Hard rule: the Mills UI must not change visually.** Layout, images, colours, fonts, sizes,
  animations, sounds and all on-screen texts stay exactly as they are. UI code may be refactored
  internally only if the rendered result stays identical. If a change seems to need a visual
  change, stop and ask the user.
- Mills logic stays in this project; it is not moved into a shared game kit.
- Work goes through OpenSpec (`openspec/`). Bot changes are measured against the recorded
  benchmark baseline before and after.
- Overview of the code: `Mills/OVERVIEW.md`.
- Bot measurement follows the game kit's tournament conventions (`../../ProcessingProjects/game-kit`,
  `packages/bots`): budgets in bot names (`@d<n>` depth, `@i<n>` iterations, `@<n>ms` time; only
  depth and iteration runs are machine-independent), each seed played once from each side, Elo with
  `random` anchored at 1000, Markdown report to stdout and JSON to a git-ignored folder. The code
  is our own plain JS; no dependency on the kit.

## Working agreements

- **Session start:** before anything else, run `openspec list` and tell the user in two or three
  lines where the work stands (last finished change, active change and its task progress, the
  natural next step).
- **Two phases.** Spec phase: write proposal, design, specs and tasks for one change, then stop
  for the user's review before the next; ask opinion questions with AskUserQuestion. Every change
  must be implementable without asking: decisions go into `design.md`, scope and non-goals are
  explicit. **Autopilot** is **ON** (since 2026-10-01; the user turns it off with a word). When on: apply → verify → commit → archive → commit → push → next specced change,
  without review stops; stop only for money, anything irreversible outside the repo, a decision
  that forces rework, or failing checks you cannot fix.
- **Push:** commit and push to `master` yourself (standing permission for this repo; overrides
  the global "don't push" rule), at the latest before giving a summary.
- **Git:** run git with `GIT_EDITOR=true` and `GIT_PAGER=cat` so nothing waits for an editor or pager.
- **Handover** (overrides the global format): at most two lines; the next session rebuilds the
  rest from `openspec list` and the change's `tasks.md`.

  ```
  Jatka: /opsx:apply <change> (seuraava <task no.>)      ← or /opsx:propose <item>, /opsx:archive <change>
  Huom: <only what is not in the repo>
  ```
