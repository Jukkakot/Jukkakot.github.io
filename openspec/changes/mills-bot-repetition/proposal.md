# Proposal

## Why

Since `mills-threefold-repetition` the third occurrence of a position is a draw, but the
minimax bots cannot see that: they walk from winning positions into draws. In the light check
`iterative@d4` fell from Elo 1605 to 1448 (outside its baseline interval), all through repetition
draws. The bots need to score a repeated position as the draw it is.

## What Changes

- The game sends its position counts (the repetition rule's key → count) with every bot
  request (move, suggestion, multi lookup). The worker keeps them for that search.
- The minimax search scores a position reached after a completed turn as a **draw (0)** when it
  would be its third occurrence, counting the game's history plus the positions on the current
  search path. A win or loss in the same position comes first, as in the game.
- Transposition table: a result whose search met such a draw depends on the path, so it is not
  stored.
- With no history (fresh positions, the golden fixture), searches up to depth 6 cannot reach a
  third occurrence, so they stay exactly as before.
- MCTS and the random bot are unchanged (MCTS is step 5).
- **No visual effect on the Mills UI:** `Game.js` only adds data to the worker message;
  nothing on screen changes.

Measurement (light check, `CLAUDE.md`):
- Correctness: the golden tests stay green unchanged; a test that a bot with a positive score
  avoids the move into a third occurrence, and one with a negative score takes it.
- Strength: the fast strength command with `--compare baseline`: each fixed-depth bot's Elo
  back inside its baseline 95 % interval (the goal handed over by `mills-threefold-repetition`),
  and fewer repetition draws than `mills-threefold-repetition`'s run in the d4 pairings.
- Speed: quick speed run of `minimax@d4 minimax@d6 iterative@d6` against
  `mills-transposition-table`: no bot more than 5 % slower.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `mills-bots`: "Minimax bots" requirement: repeated positions are scored as draws.

## Impact

- `Mills/workers/WorkerHelpers.js`, `MinmaxWorker.js` (history, path, draw score, TT store rule).
- `Mills/classes/Game.js` (position counts in the worker messages).
- `Mills/bench/sandbox.js` (passes the referee's counts), tests; saved run
  `Mills/bench/reports/mills-bot-repetition/`; `Mills/OVERVIEW.md`.
