# Mills bot speed

- Bots: minimax@d4, minimax@d6, iterative@d6, iterative@1000ms
- Positions: 10 (Mills/bench/positions-quick.json), hash 5fb9789b29
- Jobs: 1; code: 80cb16f; Node v22.22.0; Intel(R) Xeon(R) Processor @ 2.10GHz (4 threads)
- Started 2026-10-02T05:16:36.869Z, took 0.6 min
- **Not repeatable:** iterative@1000ms use a time limit, so results depend on the machine and its load.

## Median ms per move

| Bot | placing-early | placing-late | moving | flying | all | max (all) |
|---|---:|---:|---:|---:|---:|---:|
| minimax@d4 (Minmax 4) | 88.0 | 42.0 | 30.6 | 53.7 | 63.5 | 178 |
| minimax@d6 (Minmax 6) | 1289 | 416 | 450 | 812 | 498 | 4733 |
| iterative@d6 (Iterative D 6) | 1310 | 624 | 686 | 858 | 853 | 4802 |
| iterative@1000ms (Iterative 1s) | 1001 | 1002 | 1001 | 1000 | 1001 | 1002 |

## Leaves per move (MCTS: playouts)

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| minimax@d4 (Minmax 4) | 3359 | 754 | 700 | 1472 | 1663 |
| minimax@d6 (Minmax 6) | 103314 | 10486 | 13896 | 31714 | 43603 |
| iterative@d6 (Iterative D 6) | 101690 | 18231 | 19504 | 34397 | 46884 |
| iterative@1000ms (Iterative 1s) | 47883 | 25584 | 30190 | 32490 | 35037 |

## Depth reached by time-limited bots (median, min–max)

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| iterative@1000ms (Iterative 1s) | 5 (4–6) | 7 (6–7) | 6 (6–7) | 7 (5–8) | 6 (4–8) |
