# Proposal

## Why

MCTS is the weakest search bot: after the rewrite (milestone 1) it has Elo 1299, loses every
game to the depth-4 bots and still takes about 10 s per move. Its playouts are purely random,
which in Mills says little about a position (random play gives mills away all the time) and
runs long (up to the 200-ply cap). Better playouts are the known next step (`OVERVIEW.md`, weak
spots).

## What Changes

- Two new playout methods in `MCTSWorker.js`, selectable per search, next to the current one:
  - **heuristic policy**: a playout move closes an own mill if it can, otherwise blocks an
    opponent's open two-in-a-row, otherwise is random; a removal prefers a chip of an opponent's
    two-in-a-row;
  - **evaluation cutoff**: the playout stops after a fixed number of plies and the position is
    scored with the minimax evaluation (`fastNewEvaluateBoard`, current default weights) mapped
    to 0…1.
  - Both can be combined (heuristic policy, then cutoff). The current random-to-200-plies playout
    stays available as `random`.
- The iteration count becomes a search option (`options.mctsIterations`); the worker constant is
  the in-game default.
- The in-game "MCTS" option gets the playout method that wins the benchmark, and an iteration
  count chosen so its median time per move is not above the current one (milestone 1: 9.6 s).
  The button text stays "MCTS".
- Benchmark: `mcts@i<n>` accepts any iteration count, and an optional suffix selects the playout:
  `mcts@i<n>:random`, `:heur`, `:cut<k>`, `:heurcut<k>`. Without a suffix the bot plays the
  in-game default.
- **No visual effect on the Mills UI:** only worker code and the benchmark change; the option
  list in `sketch.js` is not touched.

Measurement:
- Selection: MCTS variants against each other and `minimax@d1` / `minimax@d4` at a roughly equal
  time per move (design §6.1), then the iteration count for the game (design §6.2).
- MCTS code changes, so this change ends with **milestone 2** (`CLAUDE.md`): the full baseline
  commands with `--compare baseline` / `--compare baseline-mcts`, saved as `milestone-2` /
  `milestone-2-mcts`. Goals: the new default scores at least 70 % against the milestone-1 MCTS
  (`mcts@i5000:random`), and its Elo is above milestone 1's 1299.
- Correctness: existing MCTS tests pass for the default and for `:random`; new tests for the
  playout policy, the cutoff score and the bot names.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mills-bots`: the MCTS bot requirement (playout method, cutoff scoring, iteration count).
- `mills-benchmark`: bot names and budgets (`mcts@i<n>` with any n, playout suffix).

## Impact

- `Mills/workers/MCTSWorker.js` (playouts, iteration option, default constants).
- `Mills/workers/WorkerHelpers.js` only if a small precomputed table (mill windows per point) is
  added there.
- `Mills/bench/bots.js`, `Mills/bench/test/*` (MCTS and bot-name tests).
- `Mills/OVERVIEW.md`, `bench/reports/milestone-2*/`.
