# Proposal

## Why

Mills games can go on forever: two players (or two bots) shuffle chips back and forth and the
game never ends. The agreed fix (mills-rules, "No draws (current state)") is the WMD threefold
repetition rule: the same position with the same player to move for the third time ends the
game as a draw. It is step 4 of the improvement plan and the basis for bots that avoid or seek
repetition (the next change). The benchmark referee has to follow the same rule, or its games
stop matching the game.

## What Changes

- **Rule:** after every completed turn (not in the middle of a mill's removal), the position
  (board, player to move, chips still to place for both) is counted. Its third occurrence ends
  the game as a draw. A win or loss found in the same turn switch comes first.
- **Display (the approved exception in mills-ui):** the draw is announced as **"Draw!"** in the
  same place, font, size and fill as "<name> won!", with the Dark wood colour as its outline (the
  user's choice, 2026-10-02). After a draw the game behaves as after a win: the board stays,
  the Restart button grows as it does after a win, the other buttons hide, autoplay restarts.
  **No other visual change:** every other screen stays pixel-identical.
- The random game state generator and restored states start a fresh position count.
- **Benchmark referee:** the same rule; a game ending this way is a draw with the ending
  `repetition`, counted half a point like a capped game. Reports show repetition draws beside
  capped games.
- Bots do not know about the rule yet (non-goal; next change).

Measurement against the benchmark (light check, `CLAUDE.md`):
- Correctness: referee unit tests for the rule; a browser test that plays a repetition and
  shows "Draw!", and pixel comparisons of the start, in-game and win screens before and after.
- Strength: the fast strength command with `--compare baseline`: every bot's Elo inside its
  baseline 95 % interval; capped games partly turn into repetition draws (reported, not a goal).
  No speed run: no bot code changes.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `mills-rules`: "No draws (current state)" is replaced by the threefold repetition draw.
- `mills-ui`: the visual freeze lists "Draw!" among the on-screen texts.
- `mills-benchmark`: games can end in a repetition draw, reported beside capped games.

## Impact

- `Mills/classes/Game.js` (position count, draw, game-over checks), `Mills/sketch.js` (two
  game-over checks).
- `Mills/bench/referee.js`, `game.js`, `stats.js`, `report.js`, `html.js`, tests.
- Saved run `Mills/bench/reports/mills-threefold-repetition/`; `Mills/OVERVIEW.md`.
