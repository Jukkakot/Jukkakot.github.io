## 1. Before-measurement

- [x] 1.1 On the unchanged code, run the quick speed set: `node Mills/bench/bench.js speed minimax@d4 iterative@d4 iterative@1000ms --positions Mills/bench/positions-quick.json --jobs 1 --save mills-eval-tuning-before`. Verify: `bench/reports/mills-eval-tuning-before/` exists with `COMMANDS.md`.

## 2. Weight set (behaviour unchanged)

- [x] 2.1 Add `EVAL_WEIGHTS` and the per-search `evalWeights` (design §1) and replace every evaluation literal, including the 3000/4500 in `getCalcedValue`, with weight reads. The three new entries are 0. Verify: `node --test "Mills/bench/test/*.test.js"` passes unchanged (the golden fixture proves identical decisions).
- [x] 2.2 Add `Mills/bench/weights/v0.json` (all weights, today's values). Teach `parseBot` the `:<set>` suffix: load the file, refuse a missing set, unknown keys, and a suffix on `random`/`mcts`; use the name without the suffix for `GAME_NAMES`. Make `golden.js` run with `v0` weights while keeping the record bot names. Tests in `bots.test.js`: suffix parsed, missing set refused, unknown key refused, suffix on `mcts` refused. Plus a worker test: partial weights in the options apply to that search only. Verify: all tests pass, and `golden-search.json` is unchanged (`git diff --stat`).

## 3. Hand fixes

- [x] 3.1 Material in every stage: `chipCount + chipsToAdd`, weights `chipTaken` / `chipTakenPlacing` (design §2). Test: two placing positions differing by one taken opponent chip score as the spec scenario says when `chipTakenPlacing > 0`, and equal when it is 0. Verify: tests pass, golden unchanged.
- [x] 3.2 `exactCachedNewMills` in `getCalcedValue` (dropped: the cached path already matches, see design §2). Test: a cached leaf with new mills for both players equals a fresh `fastNewEvaluateBoard`. Verify: tests pass, golden unchanged.
- [x] 3.3 `flyingThreat` in stage 3 (window with 2 own + 1 empty, scoreObject key `flyingThreat`). Test: a flying position gains `flyingThreat` per such window. Verify: tests pass, golden unchanged.
- [ ] 3.4 Add `weights/h1.json` (design §2). Benchmark check: `node Mills/bench/bench.js strength minimax@d4:h1 minimax@d4:v0 --games 200 --seed 1 --cap 200 --jobs 5` and the same at d2. Record the shares in a Results section at the end of `design.md`. Commit.

## 4. Tune mode

- [ ] 4.1 `playGame` / `runner.js`: optional `openingPlies` (random bot plies at the start) and per-side `evalWeights` objects. Existing modes are unchanged. Verify: tests pass; a strength run of `random minimax@d1 --games 4 --seed 1` is unchanged (identical-games check against a run made before the edit).
- [ ] 4.2 `bench/tune.js` + `tune` command in `bench.js` (design §4): `TUNABLE` ranges/steps, seeded Δ and game seeds, SPSA update, clamping, per-iteration output `bench/results/tune-<seed>.json`, `--resume` (refuses changed arguments), `--save <set>`, and progress lines. Tests (`tune.test.js`, depth 1, 3 iterations, 1 pair): same arguments → same weights with `--jobs 1` and `--jobs 2`; stop after 2 + resume = unbroken run; weights are integers within range, and non-tunable ones are unchanged.
- [ ] 4.3 Document the tune mode, the `:<set>` suffix and the `weights/` folder in `Mills/OVERVIEW.md` → Benchmark. Verify: the commands in the text run.

## 5. Tuning run

- [ ] 5.1 Time a 10-iteration run (`tune --from h1 --depth 3 --pairs 4 --seed 1 --cap 200 --jobs 5 --iterations 10`). Choose the iteration count for at most ~2 h. Write the command into `bench/reports/mills-eval-tuning/COMMANDS.md`.
- [ ] 5.2 Run the full tune in the background, with `--save t1`. Verify: `weights/t1.json` exists. The final moving average of r is noted in design Results. Commit `t1.json` and `COMMANDS.md`.

## 6. Acceptance and new defaults

- [ ] 6.1 Run the head-to-heads of design §5 (t1 vs v0 at d4 and d2, t1 vs h1 at d4; the h1 runs from 3.4 count). Apply the pass rule and choose `t1`, `h1` or `v0`. Record all shares and the choice in design Results. Save the deciding d4 run with `--save mills-eval-tuning`.
- [ ] 6.2 Put the chosen values into `EVAL_WEIGHTS` and copy them to `weights/v1.json`. Fix tests that broke only because the default moves changed: run search-mechanics tests with `:v0`/`v0` weights, keeping their intent. Verify: all tests pass, and `golden-search.json` is still unchanged.
- [ ] 6.3 Light check (design §6): the quick speed set with `--compare mills-eval-tuning-before`; the fast strength command (`random minimax@d1 minimax@d4 iterative@d4 --games 20 --seed 1 --cap 200 --jobs 4 --compare baseline`); `iterative@1000ms` vs `iterative@1000ms:v0`, 40 games. If minimax@d4's median time rose by more than 10 %, apply the local-const mitigation (design Risks) and re-measure. Record the numbers in design Results.
- [ ] 6.4 Update `Mills/OVERVIEW.md` → Evaluation (weight names, the three fixes, the chosen set and its results) and the "Known weak spots" list. Browser check: the game loads, a bot-vs-bot autoplay game (Iterative 1s vs Minmax 4) runs to the end without console errors, and nothing looks different. Commit.
