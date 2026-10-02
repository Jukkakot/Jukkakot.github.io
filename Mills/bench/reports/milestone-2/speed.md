# Mills bot speed

- Bots: random, minimax@d1, minimax@d4, minimax@d6, iterative@500ms, iterative@1000ms, iterative@3000ms, iterative@d4, iterative@d6, mcts@i61000
- Positions: 40 (Mills/bench/positions.json), hash 3a141c7dd7
- Jobs: 1; code: 559cc12d; Node v22.13.0; Intel(R) Core(TM) i5-8600K CPU @ 3.60GHz (6 threads)
- Started 2026-10-02T15:03:44.920Z, took 11.4 min
- **Not repeatable:** iterative@500ms, iterative@1000ms, iterative@3000ms use a time limit, so results depend on the machine and its load.

## Median ms per move

| Bot | placing-early | placing-late | moving | flying | all | max (all) |
|---|---:|---:|---:|---:|---:|---:|
| random (Random) | 0.22 | 0.23 | 0.32 | 0.30 | 0.28 | 1.50 |
| minimax@d1 (Minmax 1) | 1.74 | 1.58 | 1.40 | 4.67 | 1.71 | 7.73 |
| minimax@d4 (Minmax 4) | 158 | 49.9 | 30.6 | 69.4 | 55.7 | 1317 |
| minimax@d6 (Minmax 6) | 1420 | 405 | 320 | 450 | 474 | 18838 |
| iterative@500ms (Iterative 0.5s) | 501 | 501 | 501 | 501 | 501 | 534 |
| iterative@1000ms (Iterative 1s) | 1001 | 1001 | 1001 | 1002 | 1001 | 1003 |
| iterative@3000ms (Iterative 3s) | 3001 | 3001 | 3002 | 3002 | 3001 | 3007 |
| iterative@d4 (Iterative D 4) | 131 | 47.4 | 29.3 | 121 | 71.0 | 1438 |
| iterative@d6 (Iterative D 6) | 1170 | 271 | 171 | 696 | 446 | 13173 |
| mcts@i61000 (MCTS) | 9062 | 12958 | 13930 | 4858 | 10842 | 15374 |

## Leaves per move (MCTS: playouts)

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| random (Random) | 0 | 0 | 0 | 0 | 0 |
| minimax@d1 (Minmax 1) | 16 | 12 | 10 | 34 | 18 |
| minimax@d4 (Minmax 4) | 2822 | 690 | 936 | 5450 | 2474 |
| minimax@d6 (Minmax 6) | 43091 | 7497 | 10110 | 77166 | 34466 |
| iterative@500ms (Iterative 0.5s) | 11534 | 7963 | 6003 | 12098 | 9400 |
| iterative@1000ms (Iterative 1s) | 23451 | 15950 | 12914 | 24035 | 19087 |
| iterative@3000ms (Iterative 3s) | 71395 | 46270 | 47661 | 79514 | 61210 |
| iterative@d4 (Iterative D 4) | 2625 | 796 | 1269 | 7482 | 3043 |
| iterative@d6 (Iterative D 6) | 31330 | 5236 | 19900 | 58466 | 28733 |
| mcts@i61000 (MCTS) | 61000 | 61000 | 61000 | 61000 | 61000 |

## Depth reached by time-limited bots (median, min–max)

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| iterative@500ms (Iterative 0.5s) | 5 (4–6) | 6 (5–7) | 6 (2–8) | 5 (3–7) | 5 (2–8) |
| iterative@1000ms (Iterative 1s) | 5 (4–6) | 7 (6–9) | 7 (2–9) | 6 (3–9) | 6 (2–9) |
| iterative@3000ms (Iterative 3s) | 6 (5–7) | 8 (7–10) | 8 (2–10) | 8 (4–10) | 8 (2–10) |

## Compared with saved run "baseline"

Setup differences (not compared):

- only in baseline: mcts@i5000
- only in this run: mcts@i61000

Speed ratio = median before / median after (above 1 = faster now).

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| random | 1.09× | 1.36× | 1.75× | 1.60× | 1.54× |
| minimax@d1 | 1.41× | 1.16× | 1.00× | 0.84× | 1.29× |
| minimax@d4 | 1.05× | 1.02× | 1.20× | 1.10× | 1.25× |
| minimax@d6 | 1.83× | 1.51× | 2.02× | 2.47× | 1.65× |
| iterative@500ms | 1.00× | 1.00× | 1.00× | 1.00× | 1.00× |
| iterative@1000ms | 1.00× | 1.00× | 1.00× | 1.00× | 1.00× |
| iterative@3000ms | 1.00× | 1.00× | 1.00× | 1.00× | 1.00× |
| iterative@d4 | 1.24× | 0.99× | 1.07× | 0.83× | 1.31× |
| iterative@d6 | 2.99× | 2.87× | 2.02× | 2.22× | 2.84× |
