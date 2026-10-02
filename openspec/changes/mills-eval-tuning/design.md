## Context

The leaf evaluation is `fastNewEvaluateBoard` → `fastEvaluateBoard` → `fastStage1Score` /
`fastStage2Score` in `Mills/workers/MinmaxWorker.js`. The weights are literals in those
functions, plus 3000 / 4500 for new mills in two places: the fresh path and `getCalcedValue` in
`WorkerHelpers.js`. Observed gaps:

- **Material while placing:** `chipCountDiff` (opponent chips at the search root minus now) is
  added only when the evaluated player is not placing. While placing, the opponent's chip count
  also rises as it places, so this term would be wrong there anyway. A capture in the placing
  stage is worth only the new-mill bonus.
- **Cached leaves:** `getCalcedValue` adds new-mill bonuses with `if … else if` per window, while
  the fresh path counts both players' new mills. The same position can get two values. This was
  kept on purpose in `mills-minimax-speed` so that no decision changed.
- **Flying:** stage 3 reuses `fastStage2Score`. A flying player's "two in a line plus an
  empty point" is a threat it can complete from anywhere, and nothing scores that.
- Milestone 1: `minimax@d1` draws 18/20 against `random` (move cap). Shallow bots get little
  guidance from the evaluation.

The benchmark runs both players of a game in one vm sandbox (shared worker globals, as in the
browser), and `fastFindBestMove` clears the leaf cache and TT at the start of every search.
User decisions (2026-10-02): hand fixes **and** automatic tuning; acceptance is measured at
`minimax@d2` and `minimax@d4` (repeatable), with one informative timed run.

## Goals / Non-Goals

**Goals:**
- One weight set drives the whole evaluation. `v0` reproduces today exactly.
- Three hand fixes, each switchable by weight.
- A repeatable, resumable SPSA tuner in the benchmark.
- New defaults only when they measurably beat `v0`.

**Non-Goals:**
- New evaluation ideas beyond the three fixes (pattern tables, learned/NN evaluation, endgame
  databases).
- Search changes (quiescence, null move, reductions) and MCTS (it does not use the evaluation).
- Tuning per bot or per time budget: there is one default set for all minimax/iterative options.
- A UI option to pick a weight set.

## Decisions

### 1. Weight set in the worker

`MinmaxWorker.js` gets `const EVAL_WEIGHTS = { … }` (the defaults) and a global `evalWeights`.
At the start of every search, `fastFindBestMove(options)` sets
`evalWeights = options.evalWeights ? { ...EVAL_WEIGHTS, ...options.evalWeights } : EVAL_WEIGHTS`.
That is per search, so in a shared sandbox the two sides never leak weights into each other
(the leaf cache is already cleared per search). Every literal in the evaluation and in
`getCalcedValue` reads `evalWeights.<name>`. The `d` debug path reads it the same way. The game
never sends `evalWeights`.

Weight names (v0 value):

| Name | v0 | Where |
|---|---:|---|
| `placingNeighbour` | 1 | stage 1, per free neighbour of own chips |
| `placingBlockOppMill` | 400 | stage 1, opponent placing |
| `placingBlockOppMillMoving` | 400 | stage 1, opponent moving |
| `placingAlmostMill` | 100 | stage 1 |
| `placingMill` | 250 | stage 1 |
| `placingSafeOpenMill` | 300 | stage 1 |
| `movableChip` | 50 | stage 2 |
| `chipTaken` | 1000 | stages 2–3 |
| `doubleMill` | 3500 | stages 2–3 |
| `safeOpenMill` | 1500 | stages 2–3 |
| `mill` | 1500 | stages 2–3 |
| `oppMillStuck` | 400 | stages 2–3 |
| `blockOppMillFlying` | 400 | stages 2–3, opponent flying |
| `blockOppMillMoving` | 400 | stages 2–3, opponent moving |
| `newMillOwn` | 3000 | fresh and cached path |
| `newMillOpp` | 4500 | fresh and cached path |
| `chipTakenPlacing` | 0 | **new**, stage 1 |
| `flyingThreat` | 0 | **new**, stage 3 |

Alternative: a weight array indexed by constants. It is faster to read but harder to keep in
sync with JSON files and reports. Property reads on a stable object are cheap; the speed check
(§6) confirms it.

### 2. The three hand fixes

- **Material in every stage:** while placing, count material as `chipCount + chipsToAdd` (chips on board plus
  still to place). Chips taken = opponent's material at the search root (`workerGame`) minus its
  material now. *(Apply finding: when the evaluated player moves or flies, the term stays today's
  `chipCount` difference. The opponent may still be placing its last chip then, and counting its
  chips in hand changed a golden decision, so `v0` would not reproduce 2021.)* The weight
  is `chipTaken` when the evaluated player is moving or flying, and `chipTakenPlacing` when it
  is placing. `v0` has `chipTakenPlacing = 0`, which gives today's behaviour.
- **Cached = fresh:** *(Apply finding: no change needed. The `else if` is per window, and a window
  is never both players' mill, so the cached path already counts both players' new mills; a test
  proves cached = fresh. The planned switch `exactCachedNewMills` was dropped.)* Planned: with `exactCachedNewMills = 1`, `getCalcedValue` adds `newMillOwn` for
  every own new mill **and** subtracts `newMillOpp` for every opponent new mill, as the fresh
  path does. With 0 it keeps the `else if`.
- **Flying threat:** in stage 3, each window with 2 own chips and 1 empty point adds
  `flyingThreat` (scoreObject key `flyingThreat`). This is only for the flying player; the
  moving-stage features stay as they are.

Hand-fixed starting set `h1` = `v0` plus `chipTakenPlacing 1000`, `flyingThreat 1000`,
(`exactCachedNewMills` dropped, see above).

### 3. Benchmark: weight sets in bot names

`Mills/bench/weights/<set>.json` holds a partial or full weight object (committed). `parseBot`
splits an optional `:<set>` off the name. Allowed for `minimax` / `iterative` only. It loads the
file, refuses unknown keys (checked against the worker's `EVAL_WEIGHTS`, read once from a
sandbox) and puts the object in `options.evalWeights`. The full name (`minimax@d4:v0`) is the
bot's identity in Elo tables, comparisons and identical-game checks. `GAME_NAMES` lookup uses
the name without the suffix. Sets shipped: `v0.json` (all weights, today's values) and `h1.json`.
Later: `t1.json` (tuner output) and `v1.json` (the accepted default, a copy, so later changes
can compare against it).

The golden fixture (`golden.js`) runs its bots with `v0` weights but keeps the bot names in
the records, so `golden-search.json` stays byte-identical and keeps proving `v0` = 2021.

### 4. Tune mode (SPSA)

`node Mills/bench/bench.js tune --from h1 --depth 3 --iterations <n> --pairs 4 --seed 1 --cap 200 --jobs 5 [--resume] [--save t1]`

- Tunable weights and their ranges/steps live in `bench/tune.js` (`TUNABLE`). That is every
  weight in the table. Each has `min` (0), `max` (4 × its h1 value, at least 4000) and `step` R = max(20,
  10 % of its h1 value).
- Iteration k (0-based): Δ ∈ {−1, +1}ⁿ from an RNG seeded by `seed` and k. Perturbation
  c_k = 1 / (k + 1)^0.101 (in units of R). θ± = round(θ ± c_k·Δ·R). It plays `pairs` game pairs
  `minimax@d<depth>` θ+ vs θ−. Each pair is one seed (derived from `seed`, k and the pair
  index) played once from each side. Each game opens with 4 random plies (the `random` bot, in
  the same sandbox, from the game seed), so the games do not all follow one opening.
- r = (points θ+ − points θ−) / games, which lies in [−1, 1]. Update θ_i += a_k · r · Δ_i ·
  R_i, with a_k = 2 / (k + 1 + 50)^0.602. Then clamp to [min, max]. θ is kept as floats and
  rounded only to play and to save.
- Repeatable: every random choice comes from (seed, k, pair). Game results come back in task
  order (`runTasks`), so the job count does not change the result.
- After every iteration, `bench/results/tune-<seed>.json` (git-ignored) is written: arguments,
  k, θ, and the history (k, r, θ). `--resume` reads it and continues from k + 1 with the same
  arguments (a mismatch is refused). The console shows k, r, a moving average of r and elapsed
  time.
- `--save <set>` writes the rounded final θ to `bench/weights/<set>.json`.
- `playGame` gets `openingPlies` (default 0, so existing modes are unchanged) and per-side
  `evalWeights` objects (the tuner passes θ± directly, without files). `runner.js` passes both
  through.

Alternatives: Texel-style tuning (fit weights to game outcomes on recorded positions) needs a
large labelled position set we don't have. A plain local search (one weight at a time) costs n×
more games. SPSA moves all weights with two players per iteration, which fits self-play.

Tuning depth 3: about 4× more games than depth 4 in the same time. It is also neither of the two
acceptance depths, so a set that only exploits one depth's horizon will not pass. Run length:
the first task measures a 10-iteration run, and the iteration count is chosen so the run takes
at most ~2 h with `--jobs 5` (expected 600–1500 iterations). The chosen command goes into
`bench/reports/mills-eval-tuning/COMMANDS.md`.

### 5. Acceptance and choosing the default

Head-to-head strength runs, 200 games each (`--games 200 --seed 1 --cap 200 --jobs 5`):

1. `minimax@d4:t1` vs `minimax@d4:v0`, and `minimax@d2:t1` vs `minimax@d2:v0`.
2. The same for `h1`, plus `minimax@d4:t1` vs `minimax@d4:h1`.

A candidate **passes** when its share against `v0` has a 95 % interval lower bound above 50 % at
d4, and a point estimate of at least 50 % at d2. Choice: `t1` if it passes and scores ≥ 50 %
against `h1` at d4; otherwise `h1` if it passes; otherwise the defaults stay `v0`. In that last
case the change still lands the weight set, fixes (off), and tuner, and the result is
recorded. The chosen set's values go into `EVAL_WEIGHTS` and are copied to `weights/v1.json`.
The run that decides is saved with `--save mills-eval-tuning`. The other runs are recorded as
numbers in this design's Results section (added during apply).

### 6. Per-change light check

Per the project rules: tests; the quick speed run `minimax@d4 iterative@d4 iterative@1000ms`
on `positions-quick.json` before the first code change (`--save mills-eval-tuning-before`) and
after the default switch (`--compare mills-eval-tuning-before`); the fast strength command with
`--compare baseline`. Plus, for information only: `iterative@1000ms` vs `iterative@1000ms:v0`,
40 games. If the evaluation costs time, it shows here as a lower median depth. No full
milestone: milestone 1 was just done.

## Risks / Trade-offs

- [Self-play overfits to the tuning depth or to playing itself] → Acceptance runs at two other
  depths against `v0`. `h1` is the fallback, and `v0` the final one.
- [Noisy SPSA with few games per iteration] → Small a_k with a stability offset (50) and 4
  pairs per iteration. The moving average of r is shown, so a stuck run is visible. Ranges stop
  runaway weights.
- [Weight object reads slow the evaluation] → Measured in the quick speed run. If minimax@d4 is
  more than 10 % slower at median, cache the weights in local `const`s at the top of the
  evaluation functions (same behaviour).
- [Root-relative material in a shared sandbox] → `workerGame` is set per search, as today, so
  it is unchanged.
- [Tests that assert a specific bot move] (`repetition-bot`, `bots`, `crosscheck`) may change
  with new defaults → run them with `v0` only where they test search mechanics, not evaluation.
  Their intent must not change. A test that fails for a real reason is a bug to fix.
- [Long tune run blocks the session] → Run it in the background with `--resume` available. Its
  output is git-ignored until `--save`.

## Results

### Hand fixes (`h1` vs `v0`, 200 games, `--seed 1 --cap 200`)

| Pairing | Share of h1 | 95 % interval | W–L–D |
|---|---:|---|---|
| `minimax@d4:h1` vs `minimax@d4:v0` | 49.0 % | 42.2–55.9 % | 72–76–52 |
| `minimax@d2:h1` vs `minimax@d2:v0` | 52.5 % | 45.6–59.3 % | 46–36–118 |

Neither better nor worse: `h1` alone does not pass (§5).

### Tune run (`t1`)

480 iterations, `--from h1 --depth 3 --pairs 4 --seed 1 --cap 200 --jobs 5`, 6833 s. Mean r over
the run −0.006 (last 100: −0.003, final moving average of 20: +0.075): no clear direction. Largest
moves from h1: placingNeighbour 1 → 29, doubleMill 3500 → 3221, safeOpenMill 1500 → 1725,
newMillOpp 4500 → 4189, mill 1500 → 1364; the rest within ±13 %.
