# Proposal

## Why

The improvement plan changes the Mills bots step by step (minimax speed, transposition table,
threefold repetition, MCTS fix, evaluation tuning). Each step must show that it really helps, so
the current bots have to be measured first, before any bot code changes. Today the only way to compare bots is
to watch autoplay in the browser, which is slow, random and leaves no record.

## What Changes

- A headless Node benchmark in `Mills/bench/` (plain JS, no dependencies, no build step). It
  loads the **unchanged** worker files (`WorkerHelpers.js`, `MinmaxWorker.js`, `MCTSWorker.js`)
  into a sandbox, so the browser and the benchmark run the same bot code.
- A referee that plays full games with the same rules and turn bookkeeping as `Game.js`
  (placing, moving, flying, eat mode, mill identity, win and loss checks), with a move cap that
  ends endless games as "capped".
- Deterministic runs: a seeded random source replaces `Math.random` inside the sandbox, so the
  same seed and depth/iteration budgets give the same games on any machine.
- **Strength mode:** a round robin tournament following the game kit's conventions (bot names
  carry budgets `@d<n>`, `@i<n>`, `@<n>ms`; each seed played from both sides; Elo with `random`
  anchored at 1000; Markdown report to stdout, JSON per game to a git-ignored folder; parallel
  jobs with identical results).
- **Speed mode:** every bot on a fixed, committed set of test positions from all game stages:
  time per move, searched nodes, depth reached by time-limited bots.
- **Recorded baseline:** the strength and speed reports of the current bots, committed, so later
  changes compare against them.
- No change to bot behaviour, game rules or the UI. **No visual effect on the Mills UI**: no file
  the page loads is edited. `bench/` is a new folder the page never loads.

Measurement against the baseline: this change *creates* the baseline. Later bot changes re-run
the same commands (same seeds, positions and budgets) and compare with the recorded reports.

## Capabilities

### New Capabilities
- `mills-benchmark`: the headless bot benchmark (sandboxed bot code, referee, seeded runs,
  strength and speed modes, reports) and the recorded baseline.

### Modified Capabilities
<!-- none: bot behaviour and game rules do not change -->

## Impact

- New: `Mills/bench/` (runner, referee, sandbox loader, tests via `node --test`, position fixture,
  baseline reports); `.gitignore` entry for raw results.
- Unchanged: everything the game page loads (`index.html`, `sketch.js`, `classes/`, `workers/`).
- Requires Node 22 locally (already installed). No npm packages.
- Docs: `Mills/OVERVIEW.md` gets a short "Benchmark" section.
