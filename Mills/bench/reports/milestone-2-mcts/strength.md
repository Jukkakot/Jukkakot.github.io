# Mills bot strength

- Bots: random, minimax@d1, minimax@d4, iterative@d4, mcts@i61000
- Games per pairing: 6, first seed 1, move cap 200 turns per player
- Jobs: 4; code: 559cc12d; Node v22.13.0; Intel(R) Core(TM) i5-8600K CPU @ 3.60GHz (6 threads)
- Started 2026-10-02T15:15:08.219Z, took 40.6 min

## Standings

| Bot | Elo | 95 % interval | Score | Median ms/move | Max ms | Leaves/move |
|---|---:|---:|---:|---:|---:|---:|
| iterative@d4 (Iterative D 4) | 1492 | 1391–1628 | 83.3 % | 41.7 | 438 | 1067 |
| mcts@i61000 (MCTS) | 1420 | 1342–1526 | 72.9 % | 14394 | 17434 | 60808 |
| minimax@d4 (Minmax 4) | 1379 | 1286–1487 | 66.7 % | 57.4 | 637 | 2532 |
| minimax@d1 (Minmax 1) | 1017 | 1000–1048 | 14.6 % | 1.05 | 16.1 | 18 |
| random (Random) | 1000 | 1000–1000 | 12.5 % | 0.13 | 5.28 | 0 |

Elo: Bradley–Terry, draws (capped or repetition) half a point, random = 1000; interval by bootstrap.

## Pairings

| Pairing | Share of first | 95 % interval | W | L | Draws (capped / repetition) | By chips | By blocking | Illegal | Avg plies |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| random vs minimax@d1 | 50.0 % | 18.8 %–81.2 % | 0 | 0 | 6 (6 / 0) | 0 | 0 | 0 | 407 |
| random vs minimax@d4 | 0.0 % | 0.0 %–39.0 % | 0 | 6 | 0 (0 / 0) | 5 | 1 | 0 | 42 |
| random vs iterative@d4 | 0.0 % | 0.0 %–39.0 % | 0 | 6 | 0 (0 / 0) | 6 | 0 | 0 | 41 |
| random vs mcts@i61000 | 0.0 % | 0.0 %–39.0 % | 0 | 6 | 0 (0 / 0) | 6 | 0 | 0 | 47 |
| minimax@d1 vs minimax@d4 | 8.3 % | 0.9 %–48.3 % | 0 | 5 | 1 (1 / 0) | 2 | 3 | 0 | 104 |
| minimax@d1 vs iterative@d4 | 0.0 % | 0.0 %–39.0 % | 0 | 6 | 0 (0 / 0) | 4 | 2 | 0 | 49 |
| minimax@d1 vs mcts@i61000 | 0.0 % | 0.0 %–39.0 % | 0 | 6 | 0 (0 / 0) | 5 | 1 | 0 | 44 |
| minimax@d4 vs iterative@d4 | 33.3 % | 9.7 %–70.0 % | 1 | 3 | 2 (0 / 2) | 3 | 1 | 0 | 70 |
| minimax@d4 vs mcts@i61000 | 41.7 % | 13.9 %–75.9 % | 2 | 3 | 1 (0 / 1) | 4 | 1 | 0 | 54 |
| iterative@d4 vs mcts@i61000 | 66.7 % | 30.0 %–90.3 % | 4 | 2 | 0 (0 / 0) | 4 | 2 | 0 | 53 |

Draws: 10 (capped 7, repetition 3). Games lost by an illegal or missing move: 0.

## Compared with saved run "baseline-mcts"

Setup differences (not compared):

- only in baseline-mcts: mcts@i5000
- only in this run: mcts@i61000

| Bot | Elo before | Elo after | Change | Median ms before | after |
|---|---:|---:|---:|---:|---:|
| random | 1000 | 1000 | +0 | 0.08 | 0.13 |
| minimax@d1 | 1093 | 1017 | -75 | 1.01 | 1.05 |
| minimax@d4 | 1588 | 1379 | -209 | 84.2 | 57.4 |
| iterative@d4 | 1516 | 1492 | -24 | 81.9 | 41.7 |

Identical games: 0/36

Differing games (first 5 of 36):

- random vs minimax@d1, seed 1, random light / minimax@d1 dark: plies 410 → 407; minimax@d1 leaves 3287 → 4276
- random vs minimax@d1, seed 1, minimax@d1 light / random dark: plies 408 → 407; minimax@d1 leaves 3880 → 3934
- random vs minimax@d1, seed 2, random light / minimax@d1 dark: minimax@d1 leaves 4732 → 4823
- random vs minimax@d1, seed 2, minimax@d1 light / random dark: plies 407 → 409; minimax@d1 leaves 3985 → 3240
- random vs minimax@d1, seed 3, random light / minimax@d1 dark: plies 408 → 407; minimax@d1 leaves 3948 → 4252
