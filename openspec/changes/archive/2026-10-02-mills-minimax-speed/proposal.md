# Proposal

## Why

The minimax bots spend most of their time on bookkeeping, not search: every node clones both
players with `JSON.parse(JSON.stringify())`, every board edit rebuilds the 24-char string with a
regular expression, move generation compares moves with `JSON.stringify`, and neighbour lists
are rebuilt on every call. Faster search means the time-limited bots ("Iterative 0.5s … 10s")
reach deeper in the same time, which is step 2 of the improvement plan and the base for the
transposition table (step 3).

## What Changes

- Speed up the bot worker's hot paths without changing what the bots decide: player cloning,
  board edits, move generation and its duplicate checks, neighbour lookups, window counting,
  mill-identity checks and the time checks in iterative deepening. Exact list and order come from
  a profile of the baseline (design).
- **Behaviour is preserved bit for bit** for every bot that is not time-limited: with the same
  seed, the same moves are chosen, with the same scores, the same random draws and the same
  number of searched leaves. Known quirks (cache bonus asymmetry, MCTS defects) stay; fixing
  them belongs to later changes.
- The benchmark learns to check that: a strength run compared with a saved run reports how many
  games are identical (same winner, ending, length and searched leaves per bot).
- No change to the game rules, the UI, or MCTS-only code (that is step 5); MCTS still gets
  faster through the shared helpers.
- **No visual effect on the Mills UI:** only `workers/` (loaded by the Web Worker) and `bench/`
  change; the page, its texts and its timing (the 500 ms minimum pace) stay the same.

Measurement against the baseline:
- Speed: `speed` run with the baseline's bots and positions, `--compare baseline`. Goal: median
  time per move at least 2× faster for `minimax@d4` and `minimax@d6` over all positions.
- Behaviour: the baseline's strength commands (`baseline` and `baseline-mcts`) re-run with
  `--compare`, every game identical.
- Saved as `--save mills-minimax-speed`.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `mills-benchmark`: comparison with a saved run also reports identical games (added
  requirement). Bot behaviour (`mills-bots`) does not change.

## Impact

- `Mills/workers/WorkerHelpers.js`, `Mills/workers/MinmaxWorker.js` (internal rewrites of hot
  functions; same names and messages, so `Game.js` and `MCTSWorker.js` keep working).
- `Mills/bench/analyze.js`, `report.js`, `html.js` (identical-games check), tests.
- Saved run `Mills/bench/reports/mills-minimax-speed/`.
