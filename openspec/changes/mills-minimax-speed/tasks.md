# Tasks

## 1. Identical-games check in the benchmark

- [x] 1.1 In `Mills/bench/analyze.js` `compare()` for strength runs, pair games by (pairing, seed, swapped) and report identical / differing / skipped (time-limited) games with up to 5 differing ones (design §3); show it in `report.js` and `html.js`; verify tests: identical runs → all identical, one changed `plies` → named as differing, a time-limited bot's games → skipped

## 2. Safety net before touching the bot code

- [x] 2.1 Add `Mills/bench/make-golden.js` and record `Mills/bench/test/golden-search.json` on the unchanged worker code (design §1: 40 positions × `minimax@d1..d4`, `iterative@d3`; move, type, score, leaf, skip and prune counts, random calls), plus `test/golden.test.js` comparing the current code with it; verify the test passes on the unchanged code and fails after a deliberate one-line change to a move-ordering rule (reverted)
- [x] 2.2 Profile `minimax@d4` on the 40 positions with `node --cpu-prof` and list the top functions by self time in `design.md` (short table); verify the list exists and the order of work in group 3 follows it

## 3. Behaviour-preserving speed-ups (golden test after each)

- [ ] 3.1 Grep every player property the worker reads or writes, then replace the JSON clones in `fastMinimax` with `clonePlayer` (design §2); verify golden test passes
- [ ] 3.2 `setCharAt` with `slice`; precomputed frozen neighbour table; `Set`-based duplicate checks in `fastGetS2Moves`/`fastGetS3Moves`; verify golden test passes
- [ ] 3.3 `fastCheckWin` builds its key only on a win/loss; `Date.now()` time checks; verify golden test passes
- [ ] 3.4 Evaluation: one-pass window counts, precomputed window ids and early exit in `isNewMill`; verify golden test passes and `d` debug output keys are unchanged (compare `scoreObject` keys for 5 positions before/after)
- [ ] 3.5 Re-profile; continue with the next top item only while it is a clear win; record the final profile table in `design.md`; verify golden test passes

## 4. Measurement against the baseline

- [ ] 4.1 Benchmark run (speed): the baseline speed command with `--compare baseline --save mills-minimax-speed`; verify the report shows the ratios and record whether the 2× goal for `minimax@d4`/`d6` was met in `design.md`
- [ ] 4.2 Benchmark run (strength): both baseline strength commands with `--compare baseline` / `--compare baseline-mcts`, saved as `mills-minimax-speed` / `mills-minimax-speed-mcts`; verify the reports say every shared game is identical (any difference: fix the code, never accept it)

## 5. Game check and docs

- [ ] 5.1 Serve the repo with a static server, open `Mills/index.html`, let Light (Iterative 3s) play its first move; verify a chip appears on the board (DOM/state query) and the console shows no errors
- [ ] 5.2 Update `Mills/OVERVIEW.md`: remove the "JSON clone is the biggest cost" weak spot, note the speed-up and where the numbers are (`reports/mills-minimax-speed/`), list the quirks left on purpose; verify `node --test "Mills/bench/test/*.test.js"` passes and `openspec validate mills-minimax-speed --strict` is clean
