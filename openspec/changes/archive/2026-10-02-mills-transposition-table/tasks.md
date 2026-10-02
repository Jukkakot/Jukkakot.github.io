# Tasks

## 1. Before measurement

- [x] 1.1 On the unchanged code, run the quick speed command of design §6.1 (`--save mills-transposition-table-before`); verify `Mills/bench/reports/mills-transposition-table-before/COMMANDS.md` exists and `git diff --stat Mills/workers` is empty

## 2. Switch and test harness

- [x] 2.1 Add `TT_ENABLED` (default `true`), `ttTable`, `ttHitCount`, `TT_MAX_ENTRIES = 500000` to the worker globals, the table clear and counter reset in `fastFindBestMove`, `data.ttHits` in the move data; with nothing else using them yet, verify the golden test passes
- [x] 2.2 `golden.js` option `{ tt }` (sets `TT_ENABLED` in the sandbox), `golden.test.js` runs with `tt: false`; add the score test (table on, every record's `score` equals the fixture's) marked `todo` until 3.x; sandbox reports `ttHits`; verify the golden test passes

## 3. Transposition table

- [x] 3.1 `ttKey` with the per-search root-mill lookup (design §2) and a unit test: two move orders reaching the same position give the same key; a mill re-formed in the search gives a different key from the root's mill in the same window; eat mode and side change the key
- [x] 3.2 Cutoff, ordering and store in `fastMinimax` (design §3: exact-depth cutoffs, best move first, no store after time-out, replace on deeper or equal depth, entry cap, skip at `depth === startDepthNum` and leaves); enable the score test; verify the table-off golden test and the table-on score test both pass
- [x] 3.3 Memory check (design §5): `iterative@10000ms` on the 10 quick positions in one process, heap growth under 200 MB after forced GC; record the result and the final `TT_MAX_ENTRIES` in `design.md`

## 4. Measurement (light check)

- [x] 4.1 Benchmark run (speed, light): design §6.2 with `--compare mills-transposition-table-before --save mills-transposition-table`; record in `design.md` whether each goal was met
- [x] 4.2 Benchmark run (strength, light): design §6.3; verify each fixed-depth bot's Elo is inside its baseline interval and record the numbers in `design.md`

## 5. Game check and docs

- [x] 5.1 Serve the repo, open `Mills/index.html`, let Light (Iterative 3s) play its first move; verify a chip appears and the console shows no errors except blocked external fonts
- [x] 5.2 `Mills/OVERVIEW.md`: the table under Minimax (what is reused, per move, the switch), results pointer `reports/mills-transposition-table/`; verify `node --test "Mills/bench/test/*.test.js"` passes and `openspec validate mills-transposition-table --strict` is clean
