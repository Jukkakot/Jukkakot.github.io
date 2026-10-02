# Saved run "baseline"

## strength

```
node Mills/bench/bench.js strength random minimax@d1 minimax@d4 iterative@d4 --games 20 --seed 1 --cap 200 --jobs 4 --save baseline --notes 'Fast part of the strength baseline (design §11): the four bots without MCTS, 120 games. Later changes repeat this command with --compare baseline.'
```

- Code: df02bad
- Machine: Intel(R) Xeon(R) Processor @ 2.10GHz (4 threads), Node v22.22.0
- Started 2026-10-01T23:35:22.929Z, took 3.2 min, 4 jobs

Fast part of the strength baseline (design §11): the four bots without MCTS, 120 games. Later changes repeat this command with --compare baseline.

## speed

```
node Mills/bench/bench.js speed random minimax@d1 minimax@d4 minimax@d6 iterative@500ms iterative@1000ms iterative@3000ms iterative@d4 iterative@d6 mcts@i5000 --jobs 1 --save baseline --notes 'Speed baseline (design §11): every in-game option except iterative@5000ms/10000ms, all 40 positions, one job. Time-limited bots (@ms) depend on the machine.'
```

- Code: 0981904
- Machine: Intel(R) Xeon(R) Processor @ 2.10GHz (4 threads), Node v22.22.0
- Started 2026-10-02T00:29:33.582Z, took 21.6 min, 1 jobs

Speed baseline (design §11): every in-game option except iterative@5000ms/10000ms, all 40 positions, one job. Time-limited bots (@ms) depend on the machine.
