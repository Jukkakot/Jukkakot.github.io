# Mills bot speed

- Bots: minimax@d4, minimax@d6, iterative@d6, iterative@1000ms
- Positions: 10 (Mills/bench/positions-quick.json), hash 5fb9789b29
- Jobs: 1; code: f6be4df; Node v22.22.0; Intel(R) Xeon(R) Processor @ 2.10GHz (4 threads)
- Started 2026-10-02T05:25:40.688Z, took 0.4 min
- **Not repeatable:** iterative@1000ms use a time limit, so results depend on the machine and its load.

## Median ms per move

| Bot | placing-early | placing-late | moving | flying | all | max (all) |
|---|---:|---:|---:|---:|---:|---:|
| minimax@d4 (Minmax 4) | 78.4 | 33.9 | 24.9 | 54.2 | 49.2 | 144 |
| minimax@d6 (Minmax 6) | 921 | 274 | 440 | 548 | 393 | 3299 |
| iterative@d6 (Iterative D 6) | 968 | 304 | 340 | 452 | 435 | 1731 |
| iterative@1000ms (Iterative 1s) | 1000 | 1001 | 1001 | 1002 | 1001 | 1003 |

## Leaves per move (MCTS: playouts)

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| minimax@d4 (Minmax 4) | 2953 | 552 | 547 | 1323 | 1425 |
| minimax@d6 (Minmax 6) | 63075 | 5607 | 8967 | 15111 | 25756 |
| iterative@d6 (Iterative D 6) | 36142 | 6114 | 6672 | 16157 | 17298 |
| iterative@1000ms (Iterative 1s) | 37627 | 19022 | 24914 | 35069 | 29581 |

## Depth reached by time-limited bots (median, min–max)

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| iterative@1000ms (Iterative 1s) | 6 (5–7) | 7 (6–8) | 7 (6–7) | 8 (6–9) | 7 (5–9) |

## Compared with saved run "mills-transposition-table-before"

Speed ratio = median before / median after (above 1 = faster now).

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| minimax@d4 | 1.12× | 1.24× | 1.23× | 0.99× | 1.29× |
| minimax@d6 | 1.40× | 1.52× | 1.02× | 1.48× | 1.27× |
| iterative@d6 | 1.35× | 2.05× | 2.02× | 1.90× | 1.96× |
| iterative@1000ms | 1.00× | 1.00× | 1.00× | 1.00× | 1.00× |
