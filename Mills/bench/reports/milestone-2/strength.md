# Mills bot strength

- Bots: random, minimax@d1, minimax@d4, iterative@d4
- Games per pairing: 20, first seed 1, move cap 200 turns per player
- Jobs: 2; code: 559cc12d; Node v22.13.0; Intel(R) Core(TM) i5-8600K CPU @ 3.60GHz (6 threads)
- Started 2026-10-02T15:00:16.883Z, took 3.5 min

## Standings

| Bot | Elo | 95 % interval | Score | Median ms/move | Max ms | Leaves/move |
|---|---:|---:|---:|---:|---:|---:|
| iterative@d4 (Iterative D 4) | 1592 | 1506–1739 | 85.8 % | 55.5 | 697 | 1829 |
| minimax@d4 (Minmax 4) | 1515 | 1442–1621 | 76.7 % | 56.5 | 1126 | 1908 |
| minimax@d1 (Minmax 1) | 1091 | 1042–1153 | 24.2 % | 1.06 | 25.6 | 18 |
| random (Random) | 1000 | 1000–1000 | 13.3 % | 0.12 | 20.4 | 0 |

Elo: Bradley–Terry, draws (capped or repetition) half a point, random = 1000; interval by bootstrap.

## Pairings

| Pairing | Share of first | 95 % interval | W | L | Draws (capped / repetition) | By chips | By blocking | Illegal | Avg plies |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| random vs minimax@d1 | 40.0 % | 21.9 %–61.3 % | 0 | 4 | 16 (16 / 0) | 4 | 0 | 0 | 392 |
| random vs minimax@d4 | 0.0 % | 0.0 %–16.1 % | 0 | 20 | 0 (0 / 0) | 16 | 4 | 0 | 42 |
| random vs iterative@d4 | 0.0 % | 0.0 %–16.1 % | 0 | 20 | 0 (0 / 0) | 16 | 4 | 0 | 40 |
| minimax@d1 vs minimax@d4 | 10.0 % | 2.8 %–30.1 % | 0 | 16 | 4 (1 / 3) | 9 | 7 | 0 | 63 |
| minimax@d1 vs iterative@d4 | 2.5 % | 0.3 %–20.0 % | 0 | 19 | 1 (1 / 0) | 11 | 8 | 0 | 58 |
| minimax@d4 vs iterative@d4 | 40.0 % | 21.9 %–61.3 % | 5 | 9 | 6 (0 / 6) | 12 | 2 | 0 | 81 |

Draws: 27 (capped 18, repetition 9). Games lost by an illegal or missing move: 0.

## Compared with saved run "baseline"

| Bot | Elo before | Elo after | Change | Median ms before | after |
|---|---:|---:|---:|---:|---:|
| random | 1000 | 1000 | +0 | 0.07 | 0.12 |
| minimax@d1 | 1007 | 1091 | +84 | 0.87 | 1.06 |
| minimax@d4 | 1613 | 1515 | -98 | 70.0 | 56.5 |
| iterative@d4 | 1605 | 1592 | -13 | 86.1 | 55.5 |

Identical games: 0/120

Differing games (first 5 of 120):

- random vs minimax@d1, seed 1, random light / minimax@d1 dark: plies 410 → 407; minimax@d1 leaves 3287 → 4276
- random vs minimax@d1, seed 1, minimax@d1 light / random dark: plies 408 → 407; minimax@d1 leaves 3880 → 3934
- random vs minimax@d1, seed 2, random light / minimax@d1 dark: minimax@d1 leaves 4732 → 4823
- random vs minimax@d1, seed 2, minimax@d1 light / random dark: plies 407 → 409; minimax@d1 leaves 3985 → 3240
- random vs minimax@d1, seed 3, random light / minimax@d1 dark: plies 408 → 407; minimax@d1 leaves 3948 → 4252
