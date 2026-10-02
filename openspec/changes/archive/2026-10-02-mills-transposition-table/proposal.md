# Proposal

## Why

The minimax bots search the same position again and again: in the placing stage almost every
position is reached by several move orders, and iterative deepening repeats the whole tree at
every depth. The search keeps no memory of positions it has already searched (only a cache of
leaf scores). A transposition table is step 3 of the improvement plan: fewer searched positions
for the same result, so the time-limited bots ("Iterative 0.5s … 10s") reach deeper.

A spike on the current code (table per search, exact-depth cutoffs, mill identity in the key)
kept the root score identical in 120/120 fixed-depth searches (40 positions × depth 2–4) and cut
searched positions by 28 % at `minimax@d4`, 40 % at `minimax@d6` and 63 % at `iterative@d6`;
`iterative@1000ms` reached depth 10 instead of 8. The spike's string key cost most of the gain
in time at fixed depth, so key cost is part of the design.

## What Changes

- The minimax search (`fastMinimax`, all minimax and iterative bots) gets a transposition
  table: one per move search, cleared at the start of each move like the leaf cache.
  - An entry holds the score, its bound type (exact / at least / at most), the remaining depth
    and the best move.
  - A stored score ends the search of a position only at the **same remaining depth**; the
    stored best move is tried first at any depth.
  - The key covers everything the search result depends on: board, side to move, eat mode,
    chips still to place for both players and the identity of every mill (when it was formed and
    whether it is new).
  - Size cap, so the browser worker's memory stays bounded.
- **The search result does not change:** for fixed-depth bots the chosen move's score is the
  same as without the table. The chosen move itself can differ between equal-score moves (the
  random tie-break sees the moves in another order), so games are no longer identical to the
  baseline's.
- A switch (`TT_ENABLED`, worker global, default on) turns the table off. The page never turns
  it off; the benchmark and tests use it, so the existing golden fixture keeps checking the
  table-off search exactly.
- MCTS, the evaluation, the leaf cache and the game rules are unchanged.
- **No visual effect on the Mills UI:** only `workers/MinmaxWorker.js` / `WorkerHelpers.js`
  (Web Worker) and `bench/` change. The page and its texts stay the same; bots may answer
  sooner, but the 500 ms minimum pace stays.

Measurement (light per-change check, `CLAUDE.md`; the full set waits for a milestone):
- Correctness: a test that the table-on search gives the golden fixture's score for every
  fixed-depth record, and the existing golden test with the table off.
- Speed: quick speed run (`positions-quick.json`) of `minimax@d4 minimax@d6 iterative@d6
  iterative@1000ms`, before the code change (`--save mills-transposition-table-before`) and after
  (`--compare mills-transposition-table-before`). Goals: searched positions per move at least
  30 % fewer for `minimax@d6` and 50 % fewer for `iterative@d6`; no fixed-depth bot slower;
  deeper median depth for `iterative@1000ms`.
- Strength: the fast strength command with `--compare baseline` (each fixed-depth bot's Elo
  within its baseline 95 % interval).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `mills-bots`: "Minimax bots" requirement: positions reached by different move orders are
  searched once per depth (transposition table), with the same result.

## Impact

- `Mills/workers/MinmaxWorker.js` (`fastMinimax` gets the table, `fastFindBestMove` clears it),
  `Mills/workers/WorkerHelpers.js` (table helpers, key).
- `Mills/bench/golden.js`, tests (table off for the existing fixture, score check with it on).
- Saved runs `Mills/bench/reports/mills-transposition-table-before/` and
  `Mills/bench/reports/mills-transposition-table/`; `Mills/OVERVIEW.md`.
