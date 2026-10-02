# Tasks

## 1. Referee

- [ ] 1.1 Position count and repetition draw in `bench/referee.js` and `bench/game.js` (design §5); verify referee tests: draw at the third occurrence not the second, other player to move is another position, eat-mode states not counted, a loss in the same switch wins over the draw
- [ ] 1.2 `stats.js`, `report.js`, `html.js`: draws with capped / repetition endings (design §5); verify tests: a repetition game counts half a point, the pairing table shows both counts, an old run without repetitions still renders

## 2. Game

- [ ] 2.1 Before touching UI code: a Playwright script (scratchpad) that, for a given served root, takes screenshots of the start screen, a placing position, a mill and a won game (design §6); run it on the current code and keep the PNGs
- [ ] 2.2 `Game.js`: position count, `isDraw`, `isOver()`, `setDraw()`, `finishGame()`, "Draw!" in `drawWinner()`; `sketch.js`: the two game-over checks use `isOver()`; grep that no UI code reads `winner` for game over any more
- [ ] 2.3 Browser test: both Manual, stage-2 position via `setState`, two shuffles → "Draw!", clicks ignored afterwards, no console errors; save the draw screenshot as `openspec/changes/mills-threefold-repetition/draw.png`
- [ ] 2.4 Pixel identity: the 2.1 script on the new code; verify all four screenshots are byte-identical to the old ones

## 3. Measurement and docs

- [ ] 3.1 Benchmark run (strength, light): fast strength command with `--compare baseline --save mills-threefold-repetition`; verify every bot's Elo is inside its baseline interval and record the capped → repetition numbers in `design.md`
- [ ] 3.2 `Mills/OVERVIEW.md` (rule, where it is counted, benchmark ending); verify `node --test "Mills/bench/test/*.test.js"` passes and `openspec validate mills-threefold-repetition --strict` is clean
