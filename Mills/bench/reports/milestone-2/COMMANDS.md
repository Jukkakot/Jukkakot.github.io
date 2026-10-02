# Saved run "milestone-2"

## strength

```
node Mills/bench/bench.js strength random minimax@d1 minimax@d4 iterative@d4 --games 20 --seed 1 --cap 200 --jobs 2 --compare baseline --save milestone-2 --notes 'Milestone 2 (mills-mcts-playouts design §6.4): fast strength set against the baseline.'
```

- Code: 559cc12d
- Machine: Intel(R) Core(TM) i5-8600K CPU @ 3.60GHz (6 threads), Node v22.13.0
- Started 2026-10-02T15:00:16.883Z, took 3.5 min, 2 jobs

Milestone 2 (mills-mcts-playouts design §6.4): fast strength set against the baseline.

## speed

```
node Mills/bench/bench.js speed random minimax@d1 minimax@d4 minimax@d6 iterative@500ms iterative@1000ms iterative@3000ms iterative@d4 iterative@d6 mcts@i61000 --jobs 1 --compare baseline --save milestone-2 --notes 'Milestone 2 (mills-mcts-playouts design §6.4): speed set against the baseline. MCTS is now mcts@i61000 (heuristic playouts, cutoff 6); the old mcts@i5000 row is in reports/milestone-1.'
```

- Code: 559cc12d
- Machine: Intel(R) Core(TM) i5-8600K CPU @ 3.60GHz (6 threads), Node v22.13.0
- Started 2026-10-02T15:03:44.920Z, took 11.4 min, 1 jobs

Milestone 2 (mills-mcts-playouts design §6.4): speed set against the baseline. MCTS is now mcts@i61000 (heuristic playouts, cutoff 6); the old mcts@i5000 row is in reports/milestone-1.
