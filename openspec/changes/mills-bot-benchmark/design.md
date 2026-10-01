# Design

## Context

- The bots live in three classic worker scripts (`Mills/workers/`) that share globals
  (`workerGame`, `MAXDEPTH`, `checkedBoards`, `prevBestMoves` …) and are tied together with
  `importScripts`. `WorkerHelpers.js` registers a `self.addEventListener("message")` handler.
- The search entry is `fastFindBestMove(options)`. It reads `workerGame` (`turn`, `playerLight`,
  `playerDark` with fast mills, `fastDots`, `eatMode`, `winner`, `turnNum`) and returns
  `{ move: [dotMove, type], moveData }`. Moves use `{l, d}` dots, `type` ∈ placing / moving /
  eating.
- Randomness: `Math.random` (tie-breaks in minimax, random bot, MCTS expansion and playouts).
  Time: `new Date().getTime()` (iterative deadlines, move timing).
- The game's turn bookkeeping lives in `Game.js` (`switchTurn`, `eatChip`) and differs from the
  worker's internal `fastPlayRound`: the game adds a turn only once per full turn (move plus any
  removal), and a new mill's `uniqNum` is the owner's `turns` at that time. `isNewMill` in the
  search compares against `workerGame`'s mills, so the referee must reproduce the game's numbers.
- The repo has no `package.json`; Node 22 is installed.

## Goals / Non-Goals

**Goals:**
- Measure the current bots without editing any file the game page loads.
- Results that compare across later changes: fixed seeds, fixed positions, recorded commands.
- Same conventions as the game kit's tournaments, so numbers read the same way across projects.

**Non-Goals:**
- No bot fixes, even obvious ones (MCTS defects stay; they are measured as they are).
- No threefold-repetition rule (a later change); the move cap stands in for it.
- No CI workflow for heavy runs (possible later; local runs are enough now).
- No dependency on `@game-kit/bots`; no TypeScript.

## Decisions

### 1. Sandbox with `node:vm`, bot files loaded as is

One `vm` context per game or position task. Before loading, the context gets: `self` (with a
no-op `addEventListener`, `postMessage`, `close`), `importScripts` that reads the named files
from `Mills/workers/` and runs them in the same context, a quiet `console` (`log` dropped,
`error` counted per bot and kept as samples for the report), a seeded `Math` (`Object.create(Math)`
with our `random`), and a `Date` whose `getTime`/`now` read `performance.now()`-based real time.
Then `WorkerHelpers.js` is run as a script, so its top-level `let`/`const`/functions become
context globals, as in the worker.

- Alternative: copy the bot code into ES modules. Rejected: two copies drift, and the point is
  measuring the code the game runs.
- Alternative: real `worker_threads` with a `self` shim. More moving parts and no gain; `vm` is
  synchronous and easy to drive.

Calling the bot: the harness sets the globals exactly as `handleGetMove` does (`MAXDEPTH`,
`workerGame`, fast mills, `fastDots`, `DEBUG = false`, `NODELAY = true`) by running a small
script inside the context, then calls `fastFindBestMove(options)` and reads `move` and
`moveData` (time, leaf count, depth). We skip `handleGetMove` only because it needs the 2-D `dots`
array and posts the result with a delay; the globals it sets are the same.

Fresh context per game: no leftovers between games (globals like `prevBestMoves`). Cost is a
few milliseconds per game.

### 2. Bot registry maps names to the game's `OPTIONS`

A table maps each benchmark name to the option object the game would send (copied from
`sketch.js`, with the UI text kept in `text` for the report):
`random` → `{random: true}`, `minimax@dN` → `{difficulty: N}`, `iterative@dN` →
`{iterative: true, time: 60000, maxDepth: N}`, `iterative@Nms` → `{iterative: true, time: N}`,
`mcts@i5000` → `{mcts: true, args: "visits"}`. Supported depths: any 1–15 for both kinds
(Minmax 1/4/6 and D 4/D 6 are the UI's). MCTS iterations: only 5000 (the constant in
`MCTSWorker.js`); other values are refused per the spec.

### 3. Referee in plain JS, mirroring `Game.js`

`bench/referee.js` holds the authoritative game state: board string, both players
(`char`, `name`, `chipCount`, `chipsToAdd`, `turns`, `stage3Turns`, `mills` in fast form),
`turn`, `eatMode`, `winner`, `turnNum`. It applies a move like the game:

- placing / moving → update board; if the mover has a new mill (same rule as
  `Player.getUpdatedMills`: keep old mill objects, new ones get `uniqNum = turns`) → eat mode,
  same player again, no turn counted;
- eating → remove chip, opponent's mills recomputed, mover's mills marked not new, then the
  turn is counted (`turns++`, `turnNum++`, `stage3Turns++` in stage 3);
- after counting: loss check for the mover, switch, loss check for the new player to move
  (fewer than 3 chips counting chips still to place, or no legal move in stage 2).

Legality is checked against the referee's own move generator (not the bot's), so a bot bug
cannot hide behind its own generator. The referee is pure (no `vm`) and has its own unit tests.

- Alternative: drive games with the worker's `fastPlayRound`. Rejected: its turn counting
  differs from the game (it counts the removal as a turn), which changes mill `uniqNum`s and so
  what the bots see.

### 4. Seeds and randomness

PRNG: mulberry32 (tiny, good enough, well known). Game *k* of a pairing uses seed
`firstSeed + ⌊k/2⌋`, and odd *k* swaps sides (kit convention). One PRNG stream per game, shared by
both bots in move order. That is deterministic because move order is. Speed mode seeds each
(bot, position) task with the position's index.

Real time stays real (deadlines must work); only time-limited bots become non-repeatable, and
the report says so (spec).

### 5. Parallel jobs

`--jobs N` runs tasks (one game or one speed position) in `worker_threads`, each building its own
`vm` context. Results are sorted by task index before reporting, so output does not depend on N.
Speed mode defaults to 1 job (timing noise from parallel load); strength defaults to
`os.availableParallelism() - 1`.

### 6. Speed positions

`bench/positions.json`, committed: 40 positions, 10 per class (placing early, placing late,
moving, flying), of which at least 2 per class are in eat mode; each with board, both players' counters and mills, turn and eat mode. Made
once by `bench/make-positions.js` from seeded `random`-vs-`minimax@d1` games, sampling positions
that match each class (no game already decided, more than one legal move). The generator is
kept so the set can be inspected or rebuilt, but the baseline always uses the committed file.

### 7. Reports

Markdown to stdout; JSON to `Mills/bench/results/<mode>-<timestamp>.json` (git-ignored).
Strength: setup block, standings by Elo, pairing table (share ± 95 % Wilson interval, W/L/capped,
average plies), move timing per bot (mean/max ms), illegal-move and `console.error` counts.
Elo: Bradley–Terry with minorization-maximization and one virtual draw per pairing (same method as
the kit, written again in a few lines of JS). Speed: table per stage × bot (median/mean/max ms,
leaf positions per move, depth reached for `@ms` bots).

### 8. CLI

```
node Mills/bench/bench.js strength <bot> <bot> ... [--games 20] [--seed 1] [--cap 200] [--jobs N]
node Mills/bench/bench.js speed <bot> ... [--positions Mills/bench/positions.json] [--jobs 1]
```

Tests: `node --test Mills/bench/` (referee rules, PRNG determinism, registry parsing, a tiny
strength run being identical with 1 and 2 jobs).

### 9. The baseline run

Recorded in `Mills/bench/BASELINE.md` (report plus exact commands and commit):

- Strength: `random minimax@d1 minimax@d4 iterative@d4 mcts@i5000`, 20 games per pairing,
  seed 1, cap 200 (200 games). `minimax@d6` / `iterative@d6` join if a trial shows the whole run
  stays under about an hour on this machine; otherwise they are left out of strength and only
  timed in speed mode. The choice is written into `BASELINE.md`.
- Speed: every in-game option (`random`, `minimax@d1/d4/d6`, `iterative@500ms/1000ms/3000ms`,
  `iterative@d4/d6`, `mcts@i5000`) on all 40 positions. `iterative@5000ms/10000ms` are left out:
  they only show depth reached and would take more than 10 minutes on their own. They can be
  added later.

## Risks / Trade-offs

- [Referee drifts from `Game.js`] → unit tests built from the game's code paths (mill identity,
  eat after double mill, loss checks at both points of `switchTurn`); a cross-check task replays a
  few benchmark games' moves through the real worker helpers and compares boards.
- [MCTS 5000 iterations per move is slow, maybe seconds] → measured in the trial run; if a
  game takes too long, fewer MCTS games, never fewer iterations (the budget is the bot).
- [Globals shared across bot kinds inside one context] → that is also true in the browser
  (one worker per game), so the benchmark reproduces it instead of hiding it.
- [Timing noise on a desktop machine] → speed runs single-job, report medians; the baseline
  notes the machine (CPU, Node version).
- [The game page could load `bench/`] → it never does (`index.html` lists its scripts); the folder
  is served by Pages but unused.
