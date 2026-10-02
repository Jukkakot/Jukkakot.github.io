# Tasks

## 1. Search

- [x] 1.1 Rewrite the MCTS search in `MCTSWorker.js` (design §1–§4) behind `MCTSFindBestMove`, keeping `Node`, `playMove`, `generateRandomState`, `getRandomGameState` for the generator; remove the old search functions that nothing uses any more
- [x] 1.2 MCTS tests (design §5) in `Mills/bench/test/mcts.test.js`; verify they pass, and that the "does not give away a mill" test fails on the old code (run it against a worktree of the previous commit)

## 2. Milestone 1

- [x] 2.1 Benchmark run (strength, MCTS): design §6.1; record Elo, score against `minimax@d1` and goals in `design.md`
- [x] 2.2 Benchmark run (speed): design §6.2; record MCTS time per move against the baseline
- [x] 2.3 Benchmark run (strength, fast): design §6.3; record the Elo of all bots against the baseline (first milestone since the baseline: speed-up, transposition table, repetition)

## 3. Game check and docs

- [x] 3.1 Browser: Light set to MCTS plays its first move with no console errors; "Generate gamestate" still works
- [x] 3.2 `Mills/OVERVIEW.md`: MCTS section and weak spots updated, milestone pointer; verify `node --test "Mills/bench/test/*.test.js"` and `openspec validate mills-mcts-fix --strict`
