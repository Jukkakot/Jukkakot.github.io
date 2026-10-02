# Saved run "milestone-1"

## strength

```
node Mills/bench/bench.js strength random minimax@d1 minimax@d4 iterative@d4 --games 20 --seed 1 --cap 200 --jobs 2 --compare baseline --save milestone-1 --notes 'Milestone 1 (mills-mcts-fix design §6.3): fast strength set against the baseline; first milestone since the baseline (minimax speed-up, transposition table, repetition).'
```

- Code: de60c4f7
- Machine: Intel(R) Core(TM) i5-8600K CPU @ 3.60GHz (6 threads), Node v22.13.0
- Started 2026-10-02T06:03:44.611Z, took 3.1 min, 2 jobs

Milestone 1 (mills-mcts-fix design §6.3): fast strength set against the baseline; first milestone since the baseline (minimax speed-up, transposition table, repetition).

## speed

```
node Mills/bench/bench.js speed random minimax@d1 minimax@d4 minimax@d6 iterative@500ms iterative@1000ms iterative@3000ms iterative@d4 iterative@d6 mcts@i5000 --jobs 1 --compare baseline --save milestone-1 --notes 'Milestone 1 (mills-mcts-fix design §6.2): speed set against the baseline. Different machine from the baseline (i5-8600K vs cloud Xeon), so absolute times are not directly comparable; leaves and depth are.'
```

- Code: 1bddbd27
- Machine: Intel(R) Core(TM) i5-8600K CPU @ 3.60GHz (6 threads), Node v22.13.0
- Started 2026-10-02T06:36:22.586Z, took 10.6 min, 1 jobs

Milestone 1 (mills-mcts-fix design §6.2): speed set against the baseline. Different machine from the baseline (i5-8600K vs cloud Xeon), so absolute times are not directly comparable; leaves and depth are.
