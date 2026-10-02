# Saved run "baseline-mcts"

## strength

```
node Mills/bench/bench.js strength random minimax@d1 minimax@d4 iterative@d4 mcts@i5000 --games 6 --seed 1 --cap 200 --jobs 4 --save baseline-mcts --notes 'MCTS part of the strength baseline (design §11). Trial (task 6.1): a minimax@d4 vs mcts@i5000 game pair took 4.3 min with 2 jobs (MCTS median 11.3 s/move), an iterative@d6 vs minimax@d4 pair 1.2 min; so minimax@d6 and iterative@d6 are only timed in speed mode. A first run with 20 games per pairing hit the 2-hour limit for background commands at 168/200 games (MCTS games about 9 CPU-minutes each), so this run plays 6 games per pairing; MCTS keeps its full 5000 iterations.'
```

- Code: df02bad
- Machine: Intel(R) Xeon(R) Processor @ 2.10GHz (4 threads), Node v22.22.0
- Started 2026-10-01T23:38:58.126Z, took 50.2 min, 4 jobs

MCTS part of the strength baseline (design §11). Trial (task 6.1): a minimax@d4 vs mcts@i5000 game pair took 4.3 min with 2 jobs (MCTS median 11.3 s/move), an iterative@d6 vs minimax@d4 pair 1.2 min; so minimax@d6 and iterative@d6 are only timed in speed mode. A first run with 20 games per pairing hit the 2-hour limit for background commands at 168/200 games (MCTS games about 9 CPU-minutes each), so this run plays 6 games per pairing; MCTS keeps its full 5000 iterations.
