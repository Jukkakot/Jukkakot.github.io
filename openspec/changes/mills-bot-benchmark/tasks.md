# Tasks

## 1. Referee and seeded random

- [x] 1.1 Add `Mills/bench/rng.js` (mulberry32, seed → `random()`) and `Mills/bench/referee.js` (state, legal moves per stage, apply move with `Game.js` turn and mill bookkeeping, loss checks, move cap); verify with `node --test "Mills/bench/test/*.test.js"` covering: placing to moving switch, flying at 3 chips, new mill → eat mode without a turn, removal not from a mill unless all are in mills, mill `uniqNum` = owner's turns, re-formed mill counts as new, loss by 2 chips, loss by blocking (both check points), illegal move rejected, same seed → same sequence
- [x] 1.2 Add `.gitignore` entry `Mills/bench/results/`; verify `git check-ignore Mills/bench/results/x.json` succeeds

## 2. Sandbox and bot registry

- [x] 2.1 Add `Mills/bench/sandbox.js`: `vm` context with `self`/`importScripts`/quiet `console` (errors counted)/seeded `Math`, loads `Mills/workers/WorkerHelpers.js` unchanged, exposes `chooseMove(state, options)` that sets the globals as `handleGetMove` does and returns move, type, time, leaf count, depth; verify a test that runs `minimax@d1` on the start position returns a legal placing move and that `git diff --stat Mills/workers` is empty
- [x] 2.2 Add `Mills/bench/bots.js` (name parsing and the option table from design §2, refusing unsupported budgets); verify tests for every in-game option name and for the `mcts@i800` refusal message
- [x] 2.3 Cross-check the referee against the worker: replay 5 seeded `minimax@d1` vs `random` games and compare each board and eat mode with what the worker's own helpers produce; verify a test that passes, and record any rule difference found in this file and `design.md` before moving on

## 3. Strength mode

- [x] 3.1 Add `Mills/bench/tournament.js` (schedule per kit convention, game loop with move cap, results) and `Mills/bench/report.js` (Bradley–Terry Elo with `random` = 1000, Wilson 95 % interval, standings, pairing table, timing, illegal-move and error counts, setup block with commit and Node version); verify tests: schedule shape, Elo of a known 2-bot result, interval bounds
- [x] 3.2 Add `Mills/bench/bench.js` CLI (`strength`, flags `--games --seed --cap --jobs`) with `worker_threads` jobs and JSON output to `Mills/bench/results/`; verify `node Mills/bench/bench.js strength random minimax@d1 --games 4 --jobs 1` and `--jobs 2` print identical standings, and a test asserting the same

## 4. Speed mode

- [x] 4.1 Add `Mills/bench/make-positions.js` and generate the committed `Mills/bench/positions.json` (40 positions, 10 per class: placing early, placing late, moving, flying; at least 2 per class in eat mode, design §6); verify a test that every position is undecided, has more than one legal move, and the class and eat-mode counts match
- [x] 4.2 Add the `speed` command (per bot × stage: median/mean/max ms, leaf positions per move, depth for `@ms` bots); verify `node Mills/bench/bench.js speed minimax@d1 iterative@500ms` prints the table with depth only for the `@ms` bot

## 5. Saved runs, comparison and visual report

- [x] 5.1 Results housekeeping (design §9): every run writes `<mode>-<timestamp>.{json,md,html}` to `Mills/bench/results/` and prunes it to the 10 newest runs; `--save <name>` writes `Mills/bench/reports/<name>/` with `COMMANDS.md`, refusing an existing name without `--force`; verify tests: 12 runs leave 10, a non-run file in `results/` survives, saving twice without `--force` fails
- [x] 5.2 `--compare <name>` (spec → Comparison with a saved run): Elo change per bot and speed ratio per bot × stage over the shared setup, differences in setup listed; verify a test with two small hand-made run JSONs
- [x] 5.3 Load the `dataviz` skill, then add `Mills/bench/html.js` and the `report <run.json>` command (design §10): strength charts, speed charts, compare charts, light and dark, no network; `--no-html` switches it off; verify tests that the page contains one SVG per chart and no `http` URL, then open a small run's page once in light and dark (one screenshot each) to judge legibility

## 6. Baseline run and docs

- [ ] 6.1 Trial run: time one `minimax@d4` vs `mcts@i5000` game pair and one `iterative@d6` game; decide per design §11 whether d6 bots join the strength baseline; record the decision and timings for `reports/baseline/COMMANDS.md`
- [ ] 6.2 Benchmark run (the baseline): run the strength and speed commands from design §11 with `--save baseline` on a clean tree at the current bot code; commit `Mills/bench/reports/baseline/` (JSON, Markdown, HTML, `COMMANDS.md` with commands, commit, CPU, Node); verify `git diff --stat Mills/workers Mills/classes Mills/sketch.js Mills/index.html` is empty
- [ ] 6.3 Add a short "Benchmark" section to `Mills/OVERVIEW.md` (what it is, the commands incl. `--save`/`--compare`/`report`, where saved runs live, depth/iteration budgets are repeatable, time budgets are not); verify the documented commands run as written
- [ ] 6.4 Note in the `mills-improvement-plan` memory that the baseline exists and later changes use `--compare baseline` and save their own run as `--save <change-name>`; verify `node --test "Mills/bench/test/*.test.js"` passes and `openspec validate mills-bot-benchmark --strict` is clean
