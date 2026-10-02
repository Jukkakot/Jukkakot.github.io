# Design

## Context

- The rule's key (Game.countPosition / referee positionKey): 24-char board + char of the player
  to move + Light's `chipsToAdd` + Dark's `chipsToAdd`, counted after every completed turn.
- `fastMinimax` (TT wrapper) → `fastMinimaxNode` (win check, leaf, children). A child call with
  `eatMode` false is a position after a completed turn; the side to move is `player` when
  `isMaximizing`, else `oppPlayer`. Scores are from the root player's view (own − opponent), so
  0 is an even position.
- `handleGetMove` builds `workerGame` from `data.game`; `deepClone` of the game would not carry a
  `Map`, so the counts must be sent explicitly.

## Goals / Non-Goals

**Goals:** bots see repetition draws; fixed-depth searches without history unchanged; no
slowdown beyond noise.

**Non-Goals:** MCTS; a contempt factor (draw = exactly 0); changing evaluation weights.

## Decisions

### 1. History into the worker

`Game.findBestMove` and `getBestMoves` add `positionCounts: Array.from(this.positionCounts)` to
the message. `handleGetMove` (and the multi lookup handler) set the global
`gameHistory = new Map(data.positionCounts || [])`. The benchmark sandbox sets it from the
referee state's `positions` before each search. Missing data → empty history (old behaviour).

### 2. Path and draw check

Globals `searchPath` (Map key → count) and `searchPly`. In `fastMinimaxNode`, after the win
check and only when `eatMode` is false and `searchPly > 0` (not the root, whose occurrence is
already in the history): key as in the game (`repKey`), `n = gameHistory count + searchPath
count`; if `n >= 2` this is the third occurrence → `repetitionDrawCount++` and return
`[undefined, 0]` (counted as a leaf). Otherwise add the key to `searchPath` for the children and
remove it on return. `searchPly` goes up/down around the node's children. Cost when the history
is empty and no repetition is near: one string and two Map lookups per non-eat node.

Win/loss first: the check sits after `fastCheckWin`, so a position that is lost or won is
scored as such even if it repeats (the game does the same).

### 3. Transposition table

The wrapper notes `repetitionDrawCount` before searching a node; if it grew, the result is not
stored (it depends on the path). Cutoffs from earlier entries stay valid: those entries were
stored only from subtrees without repetition draws, and the table is per search. A position
whose key is in `gameHistory` with count ≥ 1 could still repeat inside a stored subtree's
different path, but then the draw count grows and nothing is stored.

### 4. Tests

- Golden: unchanged (no history; depth ≤ 4 cannot reach a third occurrence on a path).
- Repetition test (bench): on the quick positions, find a stage-2 position where `minimax@d2`
  picks a moving move M with score > 0 and another move exists; mark the position after M as
  seen twice; the bot must pick another move. Mirror: a position with score < 0 where a move N
  leads to a position marked twice, and N's draw (0) beats the best score → the bot picks N.
  Picked at runtime from the positions so the test needs no hand-made boards.

### 5. Measurement

1. Fast strength command with `--compare baseline --save mills-bot-repetition`: each
   fixed-depth bot's Elo inside its baseline interval; repetition draws in the d4 pairings
   fewer than in `mills-threefold-repetition` (record both).
2. Quick speed `minimax@d4 minimax@d6 iterative@d6 --positions positions-quick.json` with
   `--compare mills-transposition-table --save mills-bot-repetition`: no median more than 5 %
   slower.

### 6. Results

Strength (task 3.1), fast command against `baseline`, saved as `reports/mills-bot-repetition/`:

| Bot | Baseline (95 %) | Rule only (`mills-threefold-repetition`) | Now |
|---|---:|---:|---:|
| `minimax@d1` | 1007 (1000–1021) | 1041 | 1015 |
| `minimax@d4` | 1613 (1550–1711) | 1574 | 1640 |
| `iterative@d4` | 1605 (1521–1719) | 1448 | 1535 |

All inside their baseline intervals again. Repetition draws in the d4 pairings: 11 → 5
(`minimax@d1` vs `iterative@d4` 5 → 1, `minimax@d4` vs `iterative@d4` 5 → 3, `minimax@d1` vs
`minimax@d4` 1 → 1); `random` vs `minimax@d1` 5 → 2 (both sides near 0, so a draw is fine).

Speed (task 3.2): the saved quick run against `mills-transposition-table` showed 0.81× for
`minimax@d4` at first. The check then got cheaper: skipped while a player still places (no
position can repeat then) and the root marked by a flag instead of a ply counter with
`try/finally`. Re-run: 0.89× / 0.90× / 0.97× (d4 / d6 / iterative@d6), but even the placing stage,
where the check does nothing, came out 0.91×, so the saved runs (hours apart) mostly show machine
noise. Back-to-back A/B, 5 rounds each, old code (commit 2ca5910) vs new, quick positions,
median of the per-round medians: `minimax@d4` 51.2 → 52.8 ms (+3 %), `minimax@d6` 412 → 416 ms
(+1 %). Within the 5 % goal.

Side finding: `bots.test.js` asserted `git diff Mills/workers` empty, so it failed whenever
worker code was uncommitted (the "intermittent" failure seen in `mills-transposition-table`). It
now checks that running the sandbox leaves the worker files unchanged, which was its intent.

## Risks / Trade-offs

- [Draw = 0 makes a slightly losing bot happy to repeat] → intended (that is the rule's point).
- [Path-dependent values in the table] → not stored when a draw was met (§3).
- [Cost per node] → measured in §5.2.
- [Elo still outside the interval] → if the bots now avoid draws and Elo is still low, look at
  the games before accepting; record the finding.
