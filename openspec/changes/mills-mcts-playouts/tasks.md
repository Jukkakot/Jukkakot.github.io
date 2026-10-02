# Tasks

## 1. Before

- [x] 1.1 Before any code edit: run design §6.0's before command (`--save mills-mcts-playouts-before`); verify `Mills/bench/reports/mills-mcts-playouts-before/` exists and lists 10 positions

## 2. Worker and benchmark names

- [x] 2.1 `MCTSWorker.js`: options (design §1), random path unchanged (§2), heuristic policy with `POINT_WINDOWS` (§3), evaluation cutoff with `MCTS_EVAL_SCALE` / `options.mctsEvalScale` (§4); `MinmaxWorker.js` passes `options`. Defaults stay `5000` / random for now. Verify: `node --test "Mills/bench/test/*.test.js"` passes unchanged
- [x] 2.2 `bench/bots.js`: names and suffixes of design §5, `MCTS_ITERATIONS` read from the worker; verify with the `bots.test.js` cases of design §7
- [x] 2.3 MCTS tests of design §7 (policy, cutoff reward, existing tests for default, `:random`, immediate win for `:heurcut12`); verify all tests pass
- [x] 2.4 Identity check (design §6.0): after-run with `mcts@i5000:random` chooses the same move on every quick position as the before-run; record in design §Results

## 3. Selection

- [x] 3.1 Benchmark run: design §6.1 step 1 (cost per iteration) and step 2 (playout method); record the table and the winner in design §Results
- [x] 3.2 Benchmark run: design §6.1 step 3 (cutoff length and scale), only if a cutoff variant won; record results and chosen values
- [x] 3.3 Benchmark run: design §6.2; set `MCTS_ITERATIONS`, `MCTS_DEFAULT_PLAYOUT` (and `MCTS_EVAL_SCALE`) to the chosen values; verify the speed run's overall median ≤ the old bot's and tests pass (the `mcts@i5000` references in tests updated to the default name where they mean "the game's MCTS")

## 4. Goal check and milestone 2

- [ ] 4.1 Benchmark run: design §6.3 (`--save mills-mcts-playouts`); record the score against the goal (≥ 70 %), follow §6.3's rule if missed
- [ ] 4.2 Benchmark run: milestone 2, design §6.4 (`milestone-2`, `milestone-2-mcts`, each with `COMMANDS.md`); record Elo of every bot and the MCTS goal in design §Results

## 5. Game check and docs

- [ ] 5.1 Browser: Light set to MCTS plays its first move with no console errors and in about the measured time; "Generate gamestate" still works; nothing on screen differs
- [ ] 5.2 Fill the chosen playout method and iteration count into the delta spec `specs/mills-bots/spec.md` (replace "chosen by the benchmark" with the values) and the benchmark spec's MCTS game name; update `Mills/OVERVIEW.md` (MCTS section, benchmark names, weak spots, milestone pointer); verify `openspec validate mills-mcts-playouts --strict`
