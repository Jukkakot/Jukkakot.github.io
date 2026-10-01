# Design

## Context

- Search lives in `MinmaxWorker.js` (`fastMinimax`, evaluation) on helpers in
  `WorkerHelpers.js` (move generation, board edits, mills, win check). `MCTSWorker.js` uses the
  same helpers.
- Observed costs per node (code reading; the profile in task 2.2 confirms the order):
  - `JSON.parse(JSON.stringify(player))` twice per child in `fastMinimax`;
  - `setCharAt` rebuilds the board with `str.replace(/./g, …)` (a regex callback per char), twice
    per move;
  - `fastIsArrayInArray` compares moves with `JSON.stringify` inside move generation (quadratic);
  - `getNeighboursIndexes` allocates and recomputes on every call (dozens per evaluation);
  - `fastCheckWin` runs at every node and always builds the `addInfo` key string;
  - evaluation counts each of 16 windows three times (`getBoardDotsFromWindow`) and calls
    `isNewMill` per window, which builds strings with `reduce`;
  - iterative deepening calls `new Date().getTime()` at every node.
- The benchmark baseline exists (`Mills/bench/reports/baseline*`), and fixed-depth runs are
  repeatable, so "same behaviour" can be checked exactly.

## Goals / Non-Goals

**Goals:**
- Same decisions, faster: for fixed budgets the search tree, scores, random draws and leaf
  counts stay identical.
- At least 2× lower median time per move for `minimax@d4` / `minimax@d6` (speed baseline, all
  positions).

**Non-Goals:**
- No transposition table, move-ordering or evaluation changes (steps 3 and 6).
- No fixes to known quirks, even where a rewrite makes them obvious: the cached-value path adds
  new-mill bonuses with `else if` while the fresh path counts both; `depth` reporting; MCTS
  defects. Note them for later changes instead.
- No change to message formats between `Game.js` and the worker.
- No restructuring of the global state (separate, riskier change).

## Decisions

### 1. Equivalence first: golden search fixture

Before touching worker code, record `bench/test/golden-search.json`: for each of the 40 speed
positions and each of `minimax@d1`, `minimax@d2`, `minimax@d3`, `minimax@d4`, `iterative@d3`
(fixed seed per position): the chosen move and type, the score, `leafNodeCount`, `skipCount`,
`pruneCount` and the number of `Math.random` calls. A test re-runs them on the current code and
must match exactly. It runs in seconds, so it guards every step; the full strength comparison
(decision 3) is the final check.

Why also count random calls: a tie-break that consumes the random stream differently would show
up only games later; counting catches it at the position.

### 2. Optimisations, behaviour-preserving

Applied one at a time, golden test after each; kept only if it helps in the profile.

- **Player clone:** a hand-written `clonePlayer(p)` copying the fields the search reads and
  writes (`name`, `char`, `chipCount`, `chipsToAdd`, `turns`, `stage3Turns`, `movableDots`,
  `mills` with each mill object copied, its `fastDots` array shared because nothing mutates it).
  Field set checked against every property the worker reads (task), so JSON round-trip quirks
  (e.g. `undefined` dropped) cannot change results.
- **Board edits:** `setCharAt` with `slice` (same result for valid indices).
- **Duplicate checks in move generation:** a `Set` of `from * 24 + to` beside the `moves` array,
  so insertion order (= move ordering) is unchanged.
- **Neighbours:** a precomputed table of 24 frozen arrays, same order as today. Callers that
  mutate the result would throw on a frozen array; the golden test would catch it.
- **Win check:** build the `addInfo` key only when a win or loss is found (it is only used to
  store that value).
- **Evaluation:** count player/opponent/empty points of a window in one pass; precompute window
  ids for `isNewMill`; check the three points before any string work. Same arithmetic, same
  `scoreObject` keys (the `d` debug key prints them).
- **Time checks:** `Date.now()` instead of `new Date().getTime()` (same value).

`MCTSWorker.js` itself is not edited.

### 3. Identical-games check in the benchmark

`compare()` for strength runs pairs games by (pairing, seed, swapped) and compares winner,
reason, plies and both bots' leaves. Games involving a time-limited bot are skipped and counted.
Report: "Identical games: 60/60" and up to 5 differing games (pairing, seed, sides, what
differs). The HTML page shows the same line above the Elo slope. The baseline's game records
already hold these fields, so no re-run of the baseline is needed.

### 4. How the change is measured

1. `speed` with the baseline's ten bots (command in `reports/baseline/COMMANDS.md`),
   `--compare baseline --save mills-minimax-speed`.
2. Both baseline strength commands with `--compare baseline` / `--compare baseline-mcts`,
   saved under the same name (`baseline-mcts` result saved as `mills-minimax-speed-mcts`).
   Expected: all games identical. A difference stops the change: find and fix it, never accept it.

### 5. The game in the browser

The worker scripts are what the page loads, so a syntax or global-name slip would break the
game. One check: open the game page (local static server), let Light (Iterative 3s) make its
first move and confirm no console error. No screenshot needed: nothing visual changes.

### 6. Profile of the baseline (task 2.2)

`minimax@d4` on the 40 speed positions, `node --cpu-prof`, self time (10.3 s in total on the
benchmark machine, under load from a parallel run):

| Self time | Function | Covered by |
|---:|---|---|
| 34.1 % | `fastIsArrayInArray` (JSON.stringify per comparison, inline arrow) | 3.2 `Set` duplicate checks |
| 8.3 % | `fastMinimax` (incl. the inlined JSON player clones) | 3.1 `clonePlayer` |
| 7.7 % | garbage collector | 3.1, 3.2 (fewer temporary strings) |
| 5.6 % | `fastEvaluateWindow` | 3.4 |
| 4.3 % | `fastStage2Score` | 3.4 |
| 3.5 % | `fastStage1Score` | 3.4 |
| 3.5 % | `fastEvaluateBoard` | 3.4 |
| 3.0 % | `isNewMill` | 3.4 |
| 2.6 % | `fastGetUpdatedMills` | 3.4 (window ids) |
| 2.6 % | `setCharAt` | 3.2 |
| 2.2 % | `getCalcedValue` | – |
| 2.1 % | `getLayer` | – |
| 1.5 % | `getNeighboursIndexes` | 3.2 |

Order of work from this: 3.2 (duplicate checks first, then `setCharAt` and neighbours), 3.1,
3.4, 3.3 (time checks matter only for the time-limited bots, not in this profile).

Final profile after group 3 (same command, same load): 4.5 s in total (from 10.3 s).

| Self time | Function |
|---:|---|
| 10.9 % | `fastEvaluateWindow` |
| 10.8 % | garbage collector |
| 8.1 % | `fastMinimax` |
| 7.6 % | `fastEvaluateBoard` |
| 7.0 % | `fastGetUpdatedMills` |
| 6.0 % | `fastStage2Score` |
| 5.7 % | `getCalcedValue` |
| 4.5 % | `fastStage1Score` |

Tried in 3.5 and dropped (no measurable gain): character checks instead of `windowToStr` in
`fastGetUpdatedMills`, and neighbour indexes instead of the neighbour string in
`fastGetMoveableDots`. What is left is spread over the evaluation itself; a further cut needs
an incremental evaluation or a transposition table, both outside this change.

## Risks / Trade-offs

- [A rewrite changes a tie-break or a cache key subtly] → golden fixture with random-call counts
  per position; full strength comparison at the end.
- [Hidden readers of a cloned field] → task greps every `player.`/`oppPlayer.` property the
  worker touches before writing `clonePlayer`.
- [Speed-up smaller than hoped] → the change still lands if behaviour is identical and it is
  faster; the 2× goal is reported, not forced by changing behaviour.
- [Time-limited bots now search deeper, so their play changes] → expected and wanted; their
  strength gain shows in a later strength run including them.
