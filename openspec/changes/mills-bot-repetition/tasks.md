# Tasks

## 1. History in the worker

- [ ] 1.1 `Game.findBestMove` / `getBestMoves` send `positionCounts`; `handleGetMove` and the multi lookup handler set `gameHistory`; the sandbox sets it from the referee state (design §1); verify the golden tests still pass

## 2. Search

- [ ] 2.1 `repKey`, `searchPath`, `searchPly`, `repetitionDrawCount` and the draw check in `fastMinimaxNode`; the TT wrapper skips storing when a draw was met (design §2, §3); verify golden tests pass unchanged
- [ ] 2.2 Repetition test (design §4): avoids the third occurrence when ahead, takes it when behind; verify it passes and fails with the draw check disabled (reverted)

## 3. Measurement and docs

- [ ] 3.1 Benchmark run (strength, light): design §5.1; record Elo and repetition-draw counts in `design.md`
- [ ] 3.2 Benchmark run (speed, light): design §5.2; record the ratios in `design.md`
- [ ] 3.3 Browser check: Light (Iterative 3s) plays its first move, no console errors; repetition draw screen still works (the threefold script); `Mills/OVERVIEW.md` updated; verify `node --test "Mills/bench/test/*.test.js"` and `openspec validate mills-bot-repetition --strict`
