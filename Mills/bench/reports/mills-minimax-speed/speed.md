# Mills bot speed

- Bots: random, minimax@d1, minimax@d4, minimax@d6, iterative@500ms, iterative@1000ms, iterative@3000ms, iterative@d4, iterative@d6, mcts@i5000
- Positions: 40 (Mills/bench/positions.json), hash 3a141c7dd7
- Jobs: 1; code: 54c3f83; Node v22.22.0; Intel(R) Xeon(R) Processor @ 2.10GHz (4 threads)
- Started 2026-10-02T00:52:18.014Z, took 11.7 min
- **Not repeatable:** iterative@500ms, iterative@1000ms, iterative@3000ms use a time limit, so results depend on the machine and its load.

## Median ms per move

| Bot | placing-early | placing-late | moving | flying | all | max (all) |
|---|---:|---:|---:|---:|---:|---:|
| random (Random) | 0.12 | 0.14 | 0.24 | 0.20 | 0.19 | 0.92 |
| minimax@d1 (Minmax 1) | 1.25 | 0.97 | 0.95 | 2.75 | 1.16 | 3.86 |
| minimax@d4 (Minmax 4) | 93.9 | 34.3 | 26.1 | 44.1 | 42.1 | 724 |
| minimax@d6 (Minmax 6) | 1337 | 353 | 301 | 488 | 480 | 61797 |
| iterative@500ms (Iterative 0.5s) | 500 | 500 | 500 | 501 | 500 | 502 |
| iterative@1000ms (Iterative 1s) | 1001 | 1000 | 1000 | 1001 | 1001 | 1001 |
| iterative@3000ms (Iterative 3s) | 3000 | 3000 | 3000 | 3001 | 3000 | 3003 |
| iterative@d4 (Iterative D 4) | 123 | 39.1 | 26.6 | 63.0 | 56.5 | 418 |
| iterative@d6 (Iterative D 6) | 1666 | 426 | 221 | 782 | 671 | 19246 |
| mcts@i5000 (MCTS) | 776 | 14180 | 15280 | 1491 | 7705 | 33458 |

## Leaves per move (MCTS: playouts)

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| random (Random) | 0 | 0 | 0 | 0 | 0 |
| minimax@d1 (Minmax 1) | 16 | 12 | 10 | 34 | 18 |
| minimax@d4 (Minmax 4) | 3554 | 935 | 1085 | 6290 | 2966 |
| minimax@d6 (Minmax 6) | 81487 | 16730 | 36279 | 685891 | 205097 |
| iterative@500ms (Iterative 0.5s) | 23028 | 18136 | 12575 | 22735 | 19119 |
| iterative@1000ms (Iterative 1s) | 49643 | 36532 | 28319 | 51145 | 41410 |
| iterative@3000ms (Iterative 3s) | 171957 | 123402 | 100927 | 198482 | 148692 |
| iterative@d4 (Iterative D 4) | 4631 | 1168 | 1161 | 4261 | 2805 |
| iterative@d6 (Iterative D 6) | 100585 | 20540 | 36897 | 226536 | 96140 |
| mcts@i5000 (MCTS) | 5000 | 5000 | 5000 | 5000 | 5000 |

## Depth reached by time-limited bots (median, min–max)

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| iterative@500ms (Iterative 0.5s) | 5 (4–6) | 6 (5–7) | 6 (2–7) | 5 (4–8) | 5 (2–8) |
| iterative@1000ms (Iterative 1s) | 5 (4–6) | 6 (5–8) | 7 (2–8) | 6 (4–8) | 6 (2–8) |
| iterative@3000ms (Iterative 3s) | 6 (5–7) | 7 (6–9) | 7 (2–9) | 6 (4–10) | 6 (2–10) |

## Compared with saved run "baseline"

Speed ratio = median before / median after (above 1 = faster now).

| Bot | placing-early | placing-late | moving | flying | all |
|---|---:|---:|---:|---:|---:|
| random | 2.00× | 2.37× | 2.29× | 2.46× | 2.26× |
| minimax@d1 | 1.97× | 1.88× | 1.47× | 1.43× | 1.91× |
| minimax@d4 | 1.78× | 1.48× | 1.41× | 1.73× | 1.66× |
| minimax@d6 | 1.94× | 1.73× | 2.15× | 2.28× | 1.62× |
| iterative@500ms | 1.00× | 1.00× | 1.00× | 1.00× | 1.00× |
| iterative@1000ms | 1.00× | 1.00× | 1.00× | 1.00× | 1.00× |
| iterative@3000ms | 1.00× | 1.00× | 1.00× | 1.00× | 1.00× |
| iterative@d4 | 1.32× | 1.20× | 1.18× | 1.59× | 1.65× |
| iterative@d6 | 2.10× | 1.82× | 1.56× | 1.97× | 1.89× |
| mcts@i5000 | 1.07× | 1.17× | 1.29× | 1.48× | 1.33× |
