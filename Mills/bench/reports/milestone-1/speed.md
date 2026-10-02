# Mills bot speed

- Bots: random, minimax@d1, minimax@d4, minimax@d6, iterative@500ms, iterative@1000ms, iterative@3000ms, iterative@d4, iterative@d6, mcts@i5000
- Positions: 40 (Mills/bench/positions.json), hash 3a141c7dd7
- Jobs: 1; code: 1bddbd27; Node v22.13.0; Intel(R) Core(TM) i5-8600K CPU @ 3.60GHz (6 threads)
- Started 2026-10-02T06:36:22.586Z, took 10.6 min
- **Not repeatable:** iterative@500ms, iterative@1000ms, iterative@3000ms use a time limit, so results depend on the machine and its load.

## Median ms per move

| Bot | placing-early | placing-late | moving | flying | all | max (all) |
|---|---:|---:|---:|---:|---:|---:|
| random (Random) | 0.21 | 0.24 | 0.34 | 0.32 | 0.30 | 1.74 |
| minimax@d1 (Minmax 1) | 1.94 | 1.77 | 1.46 | 4.55 | 1.92 | 8.54 |
| minimax@d4 (Minmax 4) | 171 | 52.9 | 33.5 | 69.3 | 59.5 | 918 |
| minimax@d6 (Minmax 6) | 1593 | 425 | 347 | 476 | 503 | 11742 |
| iterative@500ms (Iterative 0.5s) | 501 | 501 | 501 | 502 | 501 | 507 |
| iterative@1000ms (Iterative 1s) | 1001 | 1001 | 1001 | 1002 | 1001 | 1005 |
| iterative@3000ms (Iterative 3s) | 3001 | 3001 | 3001 | 3002 | 3001 | 3009 |
| iterative@d4 (Iterative D 4) | 144 | 52.0 | 26.4 | 96.0 | 70.8 | 650 |
| iterative@d6 (Iterative D 6) | 1466 | 291 | 193 | 387 | 484 | 11558 |
| mcts@i5000 (MCTS) | 14349 | 11338 | 9655 | 1182 | 10968 | 16393 |

## Leaves per move (MCTS: playouts)

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| random (Random) | 0 | 0 | 0 | 0 | 0 |
| minimax@d1 (Minmax 1) | 16 | 12 | 10 | 34 | 18 |
| minimax@d4 (Minmax 4) | 2903 | 686 | 972 | 3950 | 2128 |
| minimax@d6 (Minmax 6) | 44374 | 7710 | 9883 | 52532 | 28625 |
| iterative@500ms (Iterative 0.5s) | 10588 | 7396 | 5728 | 11376 | 8772 |
| iterative@1000ms (Iterative 1s) | 22301 | 15474 | 11964 | 21416 | 17789 |
| iterative@3000ms (Iterative 3s) | 66559 | 43585 | 44066 | 77232 | 57861 |
| iterative@d4 (Iterative D 4) | 2976 | 799 | 1248 | 4183 | 2302 |
| iterative@d6 (Iterative D 6) | 35570 | 5386 | 19997 | 47524 | 27119 |
| mcts@i5000 (MCTS) | 5000 | 5000 | 5000 | 5000 | 5000 |

## Depth reached by time-limited bots (median, min–max)

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| iterative@500ms (Iterative 0.5s) | 5 (4–6) | 6 (5–7) | 6 (2–7) | 6 (3–7) | 5 (2–7) |
| iterative@1000ms (Iterative 1s) | 5 (4–6) | 7 (6–8) | 7 (2–8) | 7 (4–9) | 6 (2–9) |
| iterative@3000ms (Iterative 3s) | 6 (5–7) | 8 (7–10) | 8 (2–9) | 8 (4–10) | 8 (2–10) |

## Compared with saved run "baseline"

Speed ratio = median before / median after (above 1 = faster now).

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| random | 1.17× | 1.33× | 1.62× | 1.52× | 1.41× |
| minimax@d1 | 1.26× | 1.04× | 0.97× | 0.86× | 1.15× |
| minimax@d4 | 0.98× | 0.96× | 1.10× | 1.10× | 1.17× |
| minimax@d6 | 1.63× | 1.43× | 1.87× | 2.34× | 1.55× |
| iterative@500ms | 1.00× | 1.00× | 1.00× | 1.00× | 1.00× |
| iterative@1000ms | 1.00× | 1.00× | 1.00× | 1.00× | 1.00× |
| iterative@3000ms | 1.00× | 1.00× | 1.00× | 1.00× | 1.00× |
| iterative@d4 | 1.13× | 0.90× | 1.19× | 1.05× | 1.32× |
| iterative@d6 | 2.39× | 2.67× | 1.78× | 3.99× | 2.62× |
| mcts@i5000 | 0.06× | 1.46× | 2.04× | 1.87× | 0.93× |
