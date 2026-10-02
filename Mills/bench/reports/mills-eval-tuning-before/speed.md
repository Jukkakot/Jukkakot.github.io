# Mills bot speed

- Bots: minimax@d4, iterative@d4, iterative@1000ms
- Positions: 10 (Mills/bench/positions-quick.json), hash 5fb9789b29
- Jobs: 1; code: db2363c1; Node v22.13.0; Intel(R) Core(TM) i5-8600K CPU @ 3.60GHz (6 threads)
- Started 2026-10-02T08:25:15.831Z, took 0.2 min
- **Not repeatable:** iterative@1000ms use a time limit, so results depend on the machine and its load.

## Median ms per move

| Bot | placing-early | placing-late | moving | flying | all | max (all) |
|---|---:|---:|---:|---:|---:|---:|
| minimax@d4 (Minmax 4) | 118 | 49.5 | 34.5 | 78.2 | 72.6 | 234 |
| iterative@d4 (Iterative D 4) | 108 | 49.3 | 57.6 | 145 | 81.6 | 188 |
| iterative@1000ms (Iterative 1s) | 1001 | 1001 | 1002 | 1002 | 1001 | 1003 |

## Leaves per move (MCTS: playouts)

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| minimax@d4 (Minmax 4) | 2953 | 552 | 547 | 1323 | 1425 |
| iterative@d4 (Iterative D 4) | 2700 | 644 | 650 | 2974 | 1729 |
| iterative@1000ms (Iterative 1s) | 22729 | 13473 | 15123 | 20143 | 18079 |

## Depth reached by time-limited bots (median, min–max)

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| iterative@1000ms (Iterative 1s) | 5 (4–6) | 7 (6–7) | 6 (6–7) | 7 (5–9) | 6 (4–9) |
