## Why

The search side of the minimax bots is now fast (speed-up, transposition table) and knows the
repetition draw, but the leaf evaluation is still the 2021 hand-tuned one. Its weights are
scattered constants, nobody has measured them, and it has gaps: a chip taken during the placing
stage counts for nothing, the cached-leaf path scores new mills differently from a fresh
evaluation, and flying (3 chips) reuses the moving-stage features. This is step 6 of the
improvement plan. It is the last big strength lever before MCTS work continues.

## What Changes

- The evaluation weights move into one named weight set, and the search reads them from there.
  The current weights are kept as the weight set `v0`. With `v0`, the bots decide exactly as
  they do today (golden fixture).
- Hand fixes, each behind its own weight or switch (all off in `v0`):
  - material counted in the placing stage too;
  - the cached-leaf path scores new mills exactly as a fresh evaluation does;
  - a flying-stage threat feature (two own chips plus an empty point in a mill line is a
    direct threat when the player can fly).
- A search may get its own weight set in the move options. The game never sends one, so it
  always uses the built-in defaults. The benchmark uses this to play weight sets against each other.
- Benchmark: a bot name may carry a weight set (`minimax@d4:v0` loads
  `Mills/bench/weights/v0.json`), so old and new evaluations can meet in one strength run.
- Benchmark: a new `tune` mode searches the weights automatically by self-play at a fixed depth
  (SPSA), with jobs, a seed, a progress log and resumable output.
- The tuned weights (or the hand-fixed ones, if tuning does not beat them) become the new
  defaults, but only if they beat `v0` head-to-head at depth 4 and do not lose at depth 2.
- **No visual effect on the Mills UI:** no UI file changes. Bot options, texts and timings stay.
  Bots will choose different (better) moves.

Measured against the benchmark: head-to-head new vs `v0` (`minimax@d2` and `minimax@d4`, 200
games each), the per-change light check (tests, fast strength `--compare baseline`, quick speed
before/after), and one informative `iterative@1000ms` head-to-head to see that a slower
evaluation does not cost the timed bots their depth.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `mills-bots`: the Board evaluation requirement changes. Weights come from one weight set, the
  placing stage counts material, cached and fresh leaves score the same, flying has its own
  threat feature, and a search can take a weight set from its options.
- `mills-benchmark`: bot names may carry a weight set, and a new tune mode is added.

## Impact

- `Mills/workers/MinmaxWorker.js` (evaluation, weight set, options), `Mills/workers/WorkerHelpers.js`
  (`getCalcedValue`).
- `Mills/bench/`: `bots.js` (weight-set suffix), `game.js` / `runner.js` (weights per side),
  new `tune.js`, new `weights/` folder, `golden.js` (fixture runs with `v0`), tests.
- `Mills/OVERVIEW.md` (evaluation section, benchmark section).
- No change to the main thread code, the UI, MCTS or the backend.
