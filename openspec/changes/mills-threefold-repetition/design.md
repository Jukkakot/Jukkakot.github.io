# Design

## Context

- `Game.switchTurn` (classes/Game.js) ends every move: new mill → eat mode (same player, no turn
  counted); otherwise turn counters, loss check of the mover, turn change, loss check of the new
  player to move, then the bot's next search. `eatChip` calls `switchTurn` too.
- Game over is `this.winner` set. It is read in `Game.draw` (win text vs turn text, AUTOPLAY
  label), `Game.click`, `sketch.js` `windowResized` (restart button layout) and `updateButtons`
  (autoplay button). `setWinner` logs, sends data (`SENDDATA`, off), resets the worker, restyles
  the Restart button, hides the other buttons and, in autoplay, restarts after a delay.
- `setState` (random game state generator, key `p`) jumps to an arbitrary position.
- The benchmark referee (`bench/referee.js`) mirrors `switchTurn`; `bench/game.js` ends games by
  winner or cap; `stats.js` counts `winner === null` as a capped draw.

## Goals / Non-Goals

**Goals:** the WMD threefold repetition draw in the game and the referee, shown as agreed; every
other screen pixel-identical.

**Non-Goals:** bots that take repetition into account (next change); repetition during the
placing stage beyond what the key gives naturally; any change to win/loss rules or texts; the
50-move or other draw rules.

## Decisions

### 1. Position key and when it is counted

Key: the 24-char board (`stringify`) + the char of the player to move + both players'
`chipsToAdd` (Light first). Counted at the end of `switchTurn`, after the turn has changed and
both loss checks found no loser, and never in eat mode (the turn is not complete). The game's
start position is counted in the constructor. A count of 3 ends the game as a draw before the
next bot search is started. Including `chipsToAdd` keeps placing-stage positions with different
chips in hand apart, as WMD treats them.

Alternative (count after every ply incl. eat mode) rejected: a mid-turn state is not a position
with a player to move.

### 2. Game-over state

`this.isDraw = false` in the constructor, `isOver()` = `this.winner !== undefined || this.isDraw`.
Every game-over read listed in Context uses `isOver()` instead of `this.winner` (same result
whenever there is no draw). `setWinner(player)` keeps its body; its UI tail (worker reset, loading
off, Restart restyle, hide buttons, autoplay restart) moves into `finishGame()`, which
`setDraw()` calls too. `setDraw()` sets `isDraw`, logs "Draw by threefold repetition" with turn
count and time, and with `SENDDATA` sends `{ draw: true, players: { playerLight, playerDark },
game: … }` in the same shape as a win otherwise.

### 3. Display

`drawWinner()`: for a draw, `stroke(this.playerDark.color)` and `text("Draw!", 0, -circleSize)`;
everything else (push/pop, align, size `circleSize * 2.5`, white fill, position) is shared with
the win text. Chosen by the user: text "Draw!", Dark wood outline.

### 4. State jumps

`setState` clears the counts and counts the new position once. Restart creates a new `Game`, so
counts start empty there anyway.

### 5. Referee

`newGame()` gets `positions: {}` (plain object so the JSON clone keeps it) and counts the start
position. `switchTurn` counts with the same key after the turn change and both loss checks; at 3
it sets `s.draw = 'repetition'`. `bench/game.js` ends such a game with
`{ winner: null, reason: 'repetition' }`. `stats.js`: a pairing's `capped` field becomes `draws`
(winner `null`) with `endings.capped` / `endings.repetition`; `report.js` and `html.js` show the
column "Draws (capped / repetition)" and tooltips accordingly; points stay 0.5 per draw. Old
saved runs (no `repetition` games) render as before with 0 repetitions.

### 6. Checks

- Referee tests: a shuffle back and forth ends as a draw at the third occurrence, not the second;
  the same board with the other player to move does not count; eat mode positions are not
  counted; a loss in the same switch wins over the draw.
- Browser (Playwright on a local static server, CDN libraries routed to npm copies as in the
  earlier checks): both players Manual, a stage-2 position set with `setState`, two shuffles →
  "Draw!" shown, game over (clicks ignored, Restart restyled); a screenshot is kept in the change
  folder for the user.
- Pixel identity: the same script on the old code (a git worktree of the commit before) and the
  new code takes screenshots of the start screen, a placing position, a mill ("Mill!") and a won
  game set with `setState`; all four pairs must be byte-identical PNGs (animations waited out).

### 7. Measurement

Fast strength command with `--compare baseline --save mills-threefold-repetition`: each bot's
Elo inside its baseline 95 % interval; report how many capped games became repetition draws.

## Risks / Trade-offs

- [A game-over check missed → a bot keeps moving after a draw] → grep for every `winner` read in
  UI code (task) and the browser test checks no move happens after "Draw!".
- [Visual drift elsewhere] → byte-identical screenshots of four states.
- [Bots now walk into draws they could avoid] → accepted until the next change; strength impact
  measured.
- [Benchmark results change (capped → repetition)] → the identical-games check will show
  differing games; Elo is the criterion here.
