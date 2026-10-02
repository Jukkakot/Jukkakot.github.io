# Mills bot speed

- Bots: minimax@d4, minimax@d6, iterative@d6
- Positions: 10 (Mills/bench/positions-quick.json), hash 5fb9789b29
- Jobs: 1; code: 7a8458e (uncommitted changes); Node v22.22.0; Intel(R) Xeon(R) Processor @ 2.10GHz (4 threads)
- Started 2026-10-02T05:43:16.622Z, took 0.2 min

## Median ms per move

| Bot | placing-early | placing-late | moving | flying | all | max (all) |
|---|---:|---:|---:|---:|---:|---:|
| minimax@d4 (Minmax 4) | 86.6 | 39.7 | 26.2 | 58.8 | 55.3 | 164 |
| minimax@d6 (Minmax 6) | 997 | 293 | 458 | 581 | 437 | 3808 |
| iterative@d6 (Iterative D 6) | 929 | 321 | 380 | 483 | 451 | 1655 |

## Leaves per move (MCTS: playouts)

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| minimax@d4 (Minmax 4) | 2953 | 552 | 547 | 1323 | 1425 |
| minimax@d6 (Minmax 6) | 63075 | 5607 | 8967 | 15111 | 25756 |
| iterative@d6 (Iterative D 6) | 36142 | 6114 | 6672 | 16157 | 17298 |

## Compared with saved run "mills-transposition-table"

Setup differences (not compared):

- only in mills-transposition-table: iterative@1000ms

Speed ratio = median before / median after (above 1 = faster now).

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| minimax@d4 | 0.91× | 0.85× | 0.95× | 0.92× | 0.89× |
| minimax@d6 | 0.92× | 0.94× | 0.96× | 0.94× | 0.90× |
| iterative@d6 | 1.04× | 0.95× | 0.90× | 0.93× | 0.97× |
