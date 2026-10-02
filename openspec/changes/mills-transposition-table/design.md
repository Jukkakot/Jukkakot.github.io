# Design

## Context

- `fastMinimax` (MinmaxWorker.js) is a plain alpha-beta search over `fastGetMoves` with
  random tie-breaks (`RANDOMMOVES`). Eat plies keep the depth and the side; wins score
  `WIN * remaining depth`, so a score is only comparable at the same remaining depth.
- The only memory today is `checkedBoards`, a per-move cache of leaf scores keyed by
  `addInfo` (stages, chars, board). It stays as is (its key ignores mill identity, a known quirk
  listed in `OVERVIEW.md`).
- Evaluation depends on more than the board: `isNewMill` compares the search's mills with the
  root position's mills (`workerGame`) by `fastUniqId`; `chipCountDiff` compares chip counts with
  the root. Both are fixed for one move search, so a table is only valid within one search.
- Iterative deepening records the root moves' scores in `iterativeMoveScores` at nodes with
  `depth === startDepthNum` (the root and an eat ply right after it), and orders the next
  iteration's root moves by them.
- A spike (proposal) confirmed: same root score in 120/120 fixed-depth searches, large node
  savings, and that a sorted, JSON-like string key costs most of the time saved.
- The golden fixture (`bench/test/golden-search.json`) pins the current search exactly,
  including random draws.

## Goals / Non-Goals

**Goals:**
- Same root score as the search without the table for every fixed-depth search.
- Fewer searched positions; time-limited bots reach deeper; no bot slower.
- Bounded memory in the browser worker.

**Non-Goals:**
- No table across moves (root-relative evaluation makes old entries wrong).
- No change to the leaf cache, evaluation, move generation order, MCTS, or the random
  tie-break rule.
- No repetition handling (step 4 of the plan).
- No UI option for the table; it is always on in the game.

## Decisions

### 1. One table per move search

A `Map` (`ttTable`) in WorkerHelpers.js globals, cleared in `fastFindBestMove` next to
`checkedBoards.clear()`. It lives through all iterations of iterative deepening, which is where
the move-ordering gain comes from. Alternative (keep across moves) rejected: entries depend on
the root's mills and chip counts.

### 2. Key

`ttKey(board, player, oppPlayer, eatMode, isMaximizing)` = the 24-char board, then one char for
side and eat mode (`'a'`–`'d'`), the two `chipsToAdd` digits, then one char per mill of `player`
and then `oppPlayer`, in their `mills` order (window order, as `fastGetUpdatedMills` builds it):
`'R'`/`'r'` if the mill's `fastUniqId` equals the root mill's in that window (new / not new),
`'S'`/`'s'` otherwise, with a `'|'` between the two players.

Why this is complete: chip counts and stages follow from the board and `chipsToAdd`; which
windows hold mills follows from the board; the search reads a mill's identity only through
`isNewMill` (equal to the root's `fastUniqId` or not) and its `new` flag (eat mode after a move,
`m.new = false` after eating). `turns`/`stage3Turns` only feed new mills' `uniqNum`, which is
always different from the root's. Leaving the raw `uniqNum` out of the key lets transpositions
with mills formed at different plies match. The root mills per window are looked up once per
search into a 16-slot array.

Alternative (JSON or sorted id lists, as in the spike) rejected for cost.

### 3. Entry and use

Entry `{ depth, value, flag, move, type }`, `flag` = 0 exact, 1 lower bound (value ≥ beta),
2 upper bound (value ≤ alpha), from the window the node was searched with (fail-soft values as
`fastMinimax` returns them today).

At a node with `depth > 0` and `depth !== startDepthNum`:
- **Cutoff:** entry with `entry.depth === depth` and (exact, or lower bound ≥ beta, or upper
  bound ≤ alpha) → return `[entry.move, entry.value, entry.type]`, counted in a new `ttHitCount`.
  Exact depth only, because win scores scale with remaining depth.
- **Ordering:** otherwise, an entry's `move` (any depth) is moved to the front of `moves`;
  the rest keep their order. Compared as index (placing/eating) or `[from, to]` pair.
- **Store:** after the search of the node, unless the time ran out during it
  (`iterativeEndTime` passed: its leaves were cut short, so the value is not a real depth-`depth`
  value). Replace an existing entry only when the new depth is ≥ the stored one. Store no new
  key once the table holds `TT_MAX_ENTRIES` (500 000); existing keys can still be replaced.

Nodes with `depth === startDepthNum` (the root and the eat ply right after it) are never cut
or reordered, so `iterativeMoveScores` and root ordering work as today. Nodes at `depth <= 0`
(leaves) are left to the leaf cache.

### 4. Switch and counters

`TT_ENABLED` (worker global, default `true`). When false, `fastMinimax` behaves exactly as
today (the existing golden test runs with it false and must still pass unchanged).
`ttHitCount` is reset per move and added to the move's debug data (`data.ttHits`) and the
`console.log` line; the benchmark sandbox exposes it as `ttHits` beside `leaves`.

### 5. Checks

- Golden fixture, table off: `golden.js` gets an option `{ tt: false }` that sets
  `TT_ENABLED = false` in the sandbox; `golden.test.js` uses it. Fixture unchanged.
- Score test, table on: the same 200 records re-run with the table on; every record's `score`
  equals the fixture's (moves and counters may differ). A failure means the key or the bounds
  are wrong; never update the fixture to make it pass.
- Memory: one `iterative@10000ms` search on each of the 10 quick positions in one process; the heap
  after a forced GC between moves stays under 200 MB above the start. Over it: halve
  `TT_MAX_ENTRIES` and re-check, record the final value here.

### 6. Measurement

Light per-change check (`CLAUDE.md`); the full baseline set is left to the next milestone.

1. Before code: `speed minimax@d4 minimax@d6 iterative@d6 iterative@1000ms --positions
   Mills/bench/positions-quick.json --jobs 1 --save mills-transposition-table-before`.
2. After: the same command with `--compare mills-transposition-table-before --save
   mills-transposition-table`. Goals: leaves per move (all quick positions) ≥ 30 % fewer for
   `minimax@d6`, ≥ 50 % fewer for `iterative@d6`; no fixed-depth bot's median time worse by more
   than 5 % (noise); median depth of `iterative@1000ms` higher. A missed goal is reported in this
   file, not forced.
3. Strength: `strength random minimax@d1 minimax@d4 iterative@d4 --games 20 --seed 1 --cap 200
   --jobs 4 --compare baseline --save mills-transposition-table`: each fixed-depth bot's Elo
   inside its baseline 95 % interval (identical games are not expected: tie-breaks see other move
   orders). A drop outside the interval is a bug to find, not accepted.

## Risks / Trade-offs

- [Key misses something the search depends on → wrong cutoffs] → score test over 200 records;
  mill identity reduced to "same as root or not" is the risky part and is covered by eat-mode
  and moving positions in the fixture.
- [Values from a timed-out iteration poison the table] → no store after the time ran out.
- [Leaf cache quirk interacts with new visit order] → the score test would show it; the spike
  saw no difference.
- [Memory in the browser] → entry cap and the memory check.
- [Random tie-breaks see a different order, so the bots play other (equal-score) moves] →
  accepted; the spec's random tie-break rule still holds. Strength is checked by Elo, not by
  identical games.
