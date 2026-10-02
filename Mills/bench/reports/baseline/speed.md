# Mills bot speed

- Bots: random, minimax@d1, minimax@d4, minimax@d6, iterative@500ms, iterative@1000ms, iterative@3000ms, iterative@d4, iterative@d6, mcts@i5000
- Positions: 40 (Mills/bench/positions.json), hash 3a141c7dd7
- Jobs: 1; code: 0981904; Node v22.22.0; Intel(R) Xeon(R) Processor @ 2.10GHz (4 threads)
- Started 2026-10-02T00:29:33.582Z, took 21.6 min
- **Not repeatable:** iterative@500ms, iterative@1000ms, iterative@3000ms use a time limit, so results depend on the machine and its load.

## Median ms per move

| Bot | placing-early | placing-late | moving | flying | all | max (all) |
|---|---:|---:|---:|---:|---:|---:|
| random (Random) | 0.24 | 0.32 | 0.55 | 0.48 | 0.43 | 1.78 |
| minimax@d1 (Minmax 1) | 2.46 | 1.83 | 1.41 | 3.94 | 2.21 | 12.0 |
| minimax@d4 (Minmax 4) | 167 | 50.7 | 36.8 | 76.3 | 69.8 | 3615 |
| minimax@d6 (Minmax 6) | 2596 | 610 | 647 | 1112 | 780 | 430623 |
| iterative@500ms (Iterative 0.5s) | 501 | 501 | 501 | 502 | 501 | 503 |
| iterative@1000ms (Iterative 1s) | 1001 | 1001 | 1000 | 1002 | 1001 | 1003 |
| iterative@3000ms (Iterative 3s) | 3001 | 3001 | 3001 | 3003 | 3001 | 3004 |
| iterative@d4 (Iterative D 4) | 162 | 47.0 | 31.3 | 100 | 93.3 | 2969 |
| iterative@d6 (Iterative D 6) | 3497 | 778 | 344 | 1543 | 1267 | 60001 |
| mcts@i5000 (MCTS) | 829 | 16540 | 19696 | 2208 | 10212 | 43867 |

## Leaves per move (MCTS: playouts)

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| random (Random) | 0 | 0 | 0 | 0 | 0 |
| minimax@d1 (Minmax 1) | 16 | 12 | 10 | 34 | 18 |
| minimax@d4 (Minmax 4) | 3554 | 935 | 1085 | 6290 | 2966 |
| minimax@d6 (Minmax 6) | 81487 | 16730 | 36279 | 685891 | 205097 |
| iterative@500ms (Iterative 0.5s) | 11871 | 9887 | 6627 | 7940 | 9081 |
| iterative@1000ms (Iterative 1s) | 29109 | 21924 | 14306 | 16889 | 20557 |
| iterative@3000ms (Iterative 3s) | 91043 | 67670 | 42019 | 48186 | 62229 |
| iterative@d4 (Iterative D 4) | 4631 | 1168 | 1161 | 4261 | 2805 |
| iterative@d6 (Iterative D 6) | 100585 | 20540 | 36897 | 187016 | 86260 |
| mcts@i5000 (MCTS) | 5000 | 5000 | 5000 | 5000 | 5000 |

## Depth reached by time-limited bots (median, min–max)

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| iterative@500ms (Iterative 0.5s) | 4 (4–5) | 5 (4–7) | 5 (2–7) | 4 (3–6) | 5 (2–7) |
| iterative@1000ms (Iterative 1s) | 5 (4–6) | 6 (5–7) | 6 (2–7) | 5 (3–7) | 5 (2–7) |
| iterative@3000ms (Iterative 3s) | 6 (5–6) | 7 (6–8) | 7 (2–8) | 6 (4–8) | 6 (2–8) |
