# Design

## Context

MCTS (`Mills/workers/MCTSWorker.js`, rewritten in `mills-mcts-fix`) is a correct UCT search with
purely random playouts, 5000 iterations per move. Milestone 1: Elo 1299, 0/6 against
`minimax@d4` and `iterative@d4`, median 11 s per move in the speed run (`reports/milestone-1/`).
Random playouts in Mills give mills away constantly and run up to the 200-ply cap, so each one is
slow and says little.

The worker already has everything a better playout needs: `fastGetUnOrderedMoves`,
`fastPlayRound`, `millWindows`, and the tuned evaluation `fastNewEvaluateBoard` (weights t1 are
set in `evalWeights` by `fastFindBestMove` before it calls MCTS). `MCTSFindBestMove` is called from
`fastFindBestMove` (`MinmaxWorker.js`, `options.mcts`) with `options.args`.

The user decided (2026-10-02): build both playout ideas and let the benchmark pick the in-game
default; the in-game iteration count is set so the median time per move is not above today's.

## Goals / Non-Goals

**Goals:**
- Heuristic playout policy and evaluation cutoff, each selectable, combinable, and the old
  random playout kept exactly.
- Iteration count and playout method as search options; the benchmark can name any of them.
- The in-game "MCTS" plays the best measured variant at no more time per move than today.
- Milestone 2 (full baseline set), since MCTS code changes.

**Non-Goals:**
- Tree reuse between moves, a time limit for MCTS, RAVE/progressive bias, changing UCT `c`.
- New in-game options or any change to `sketch.js` (the button keeps "MCTS").
- Changing the evaluation or its weights.

## Decisions

### 1. Options

`MCTSFindBestMove(board, player, oppPlayer, eatMode, args, options = {})`; `fastFindBestMove`
passes its `options`. Read from it:
- `options.mctsIterations` (default `MCTS_ITERATIONS`, the renamed `iterations` constant);
- `options.mctsPlayout = { policy: 'random' | 'heuristic', cutoff: <plies, 0 = none> }`
  (default `MCTS_DEFAULT_PLAYOUT`).

Both defaults are top-of-file constants; after the selection (§6) they hold the chosen values.
The game never sends these fields, so the game always plays the defaults.

### 2. Random playout unchanged

With `{ policy: 'random', cutoff: 0 }` the playout calls `Math.random` exactly as now, so
`mcts@i5000:random` makes the same moves as the milestone-1 `mcts@i5000` for the same seed
(checked in §6.0). New code paths branch around the existing loop; they do not reorder its calls.

### 3. Heuristic policy

A table `POINT_WINDOWS[i]` (the two mill windows through point i, as index triples) is built once
from `millWindows` at the top of `MCTSWorker.js`. For the side to move, with chars `me` / `opp`:
- placing / moving / flying move `(from, to)` (placing: no `from`):
  - **closes** if some window through `to` has its other two points = `me` and neither is `from`;
  - **blocks** if some window through `to` has its other two points = `opp`.
- removal of `i` (from the eatable list): **preferred** if some window through `i` holds exactly
  two `opp` chips (i one of them) and one empty point.

One pass over the move list collects closing moves and blocking moves; the playout plays a random
closing move, else a random blocking move, else a random move (removal: random preferred, else
random). Moves are in the formats `fastGetUnOrderedMoves` returns (placing: index; moving:
`[from, to]`; eating: index). No epsilon-random mixing: kept simple; diversity comes from the
random ties and the tree.

### 4. Evaluation cutoff

The playout counts its plies (a removal is a ply). When `cutoff > 0`, `ply >= cutoff`, the
state is not in eat mode and not terminal, it stops and scores:
`v = fastNewEvaluateBoard(board, me, opp)` (root player's view; `chipCount` of both refreshed
first with `fastGetPlayerDots`), reward `= 1 / (1 + exp(-v / MCTS_EVAL_SCALE))`. Start value
`MCTS_EVAL_SCALE = 2000` (one chip ≈ 1018 → 0.62; a new mill plus a chip ≈ 0.9); §6.1 tries
other scales. The 200-ply cap still applies (draw) when no cutoff is set. Evaluation results go
into the existing `checkedBoards` map, which `fastFindBestMove` clears every move.

### 5. Benchmark names (`bench/bots.js`)

- `mcts@i<n>`, 1 ≤ n ≤ 1 000 000 → `options.mctsIterations = n`.
- Suffix `:random` → `{random, 0}`, `:heur` → `{heuristic, 0}`, `:cut<k>` → `{random, k}`,
  `:heurcut<k>` → `{heuristic, k}`, 1 ≤ k ≤ 200; no suffix → no field (the worker default).
  Anything else is refused listing the suffixes. `MCTS_EVAL_SCALE` is not a name parameter;
  §6.1 varies it with a temporary bench-only option `options.mctsEvalScale`, which the worker
  reads (default the constant) and the name suffix `:…s<scale>` sets (e.g. `:cut12s1000`) — kept
  afterwards since it costs nothing.
- `MCTS_ITERATIONS` in `bots.js` is read from the worker (sandbox, like `defaultEvalWeights`), so
  `GAME_NAMES` maps "MCTS" to `mcts@i<current default>` without a mirrored constant.
- `random` still refuses any suffix; MCTS refuses weight sets (the cutoff uses the default
  weights).

### 6. Measurement

All commands from the repo root; `--jobs 4` for strength, `--jobs 1` for speed.

**6.0 Before (old code, before any edit):**
`node Mills/bench/bench.js speed mcts@i5000 --positions Mills/bench/positions-quick.json --jobs 1 --save mills-mcts-playouts-before`.
After the code change, the same with `mcts@i5000:random` must choose the same move on every
position (compare the two JSON files' moves with a short node script; differing moves = a bug in
§2) and take about the same time.

**6.1 Selection.**
1. Cost per iteration: speed on `positions-quick.json` with `mcts@i2000:random mcts@i2000:heur
   mcts@i2000:cut12 mcts@i2000:heurcut12`. For each variant pick n (multiple of 500) so its
   overall median ≈ 2 s per move.
2. Playout method: `strength minimax@d1 minimax@d4 mcts@i<a>:random mcts@i<b>:heur
   mcts@i<c>:cut12 mcts@i<d>:heurcut12 --games 10 --seed 1 --cap 200 --jobs 4`. The winner is
   the highest Elo; within 30 Elo the faster (lower median ms) wins.
3. Only if a cutoff variant wins: cutoff length, same time budget per move (re-cost as in 1):
   `<policy>cut6`, `cut12`, `cut24` with `minimax@d4`, 10 games. Then the scale for the best
   length: `s1000`, `s2000`, `s4000`, same way. Each step keeps the previous winner unless
   another is ahead by more than 30 Elo. Results and chosen values go into §Results.

**6.2 In-game iteration count.** Speed on the full `positions.json` with the winner at 2000
iterations → median ms per iteration; N = largest multiple of 1000 with N × that ≤ the old bot's
overall median from the milestone-1 speed run on this machine (10 968 ms; re-run
`speed mcts@i5000:random --jobs 1` on the full set if the machine differs). Verify: speed run with
`mcts@i<N>` (defaults set) has overall median ≤ the old one; if not, step N down by 1000.

**6.3 Goal check:** `strength mcts@i<N> mcts@i5000:random --games 20 --seed 1 --cap 200 --jobs 4
--save mills-mcts-playouts`. Goal: ≥ 70 % for the new default. Not reached → record it, keep the
new default only if it still scores above 50 %, otherwise stop and ask the user.

**6.4 Milestone 2:** the milestone-1 commands (`reports/milestone-1*/COMMANDS.md`) with
`mcts@i5000` replaced by `mcts@i<N>`: fast strength with `--compare baseline --save milestone-2`,
speed with `--compare baseline --save milestone-2`, MCTS strength (6 games) with
`--compare baseline-mcts --save milestone-2-mcts`. Goal: MCTS Elo above 1299. Since the bot name
changes, the comparison table shows the MCTS row as new; record the old row's numbers by hand.

### 7. Tests (`bench/test/`)

- `mcts.test.js`: the existing tests run for the default and for `mcts@i5000:random`; the
  "playoutCount ≤ 5000" check uses the bot's iteration count; immediate win also for `:heurcut12`.
- New: heuristic policy picks a closing move when one exists and a blocking move otherwise, and a
  preferred removal (call the worker's policy function in a sandbox on fixed boards); cutoff
  reward is in (0, 1), > 0.5 for a position where the root player is two chips up, < 0.5 mirrored.
- `bots.test.js`: `mcts@i800` now accepted (iterations 800), `mcts@i0` and `mcts@i5000:fast`
  refused, suffix parsing for each form, `mcts@i5000:v0` refused.

## Risks / Trade-offs

- **Greedy heuristic** makes playouts deterministic-ish where tactics exist, which may bias the
  tree. → Measured against random; ties stay random.
- **Cutoff makes MCTS lean on the same evaluation as minimax**, so it may inherit its blind
  spots. → Accepted: the goal is the strongest bot; random stays available.
- **Equal-time comparison uses one machine's timings**; iteration counts keep runs repeatable,
  the chosen N fits this machine's 11 s. → Documented; other machines scale proportionally.
- **10-game selection rounds are noisy.** → The 30-Elo rule prefers the simpler/faster variant;
  the 20-game goal check (§6.3) and the milestone guard the final choice.

## Results

**§6.0 Identity check.** The speed JSON did not record the chosen move, so `runSpeedTask`
(`bench/game.js`) now stores `type` and `move`; the before-run was then repeated on the
unchanged worker code (`reports/mills-mcts-playouts-before`). After the code change
`mcts@i5000:random` chose the same move on all 10 quick positions; overall median 11 845 ms vs
11 743 ms before.
