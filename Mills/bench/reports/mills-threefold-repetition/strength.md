# Mills bot strength

- Bots: random, minimax@d1, minimax@d4, iterative@d4
- Games per pairing: 20, first seed 1, move cap 200 turns per player
- Jobs: 4; code: 1014b9a; Node v22.22.0; Intel(R) Xeon(R) Processor @ 2.10GHz (4 threads)
- Started 2026-10-02T05:34:33.294Z, took 1.0 min

## Standings

| Bot | Elo | 95 % interval | Score | Median ms/move | Max ms | Leaves/move |
|---|---:|---:|---:|---:|---:|---:|
| minimax@d4 (Minmax 4) | 1574 | 1487–1679 | 88.3 % | 46.8 | 789 | 1288 |
| iterative@d4 (Iterative D 4) | 1448 | 1385–1532 | 73.3 % | 55.1 | 1249 | 1663 |
| minimax@d1 (Minmax 1) | 1041 | 1021–1070 | 21.7 % | 0.67 | 16.8 | 18 |
| random (Random) | 1000 | 1000–1000 | 16.7 % | 0.07 | 8.19 | 0 |

Elo: Bradley–Terry, draws (capped or repetition) half a point, random = 1000; interval by bootstrap.

## Pairings

| Pairing | Share of first | 95 % interval | W | L | Draws (capped / repetition) | By chips | By blocking | Illegal | Avg plies |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| random vs minimax@d1 | 50.0 % | 29.9 %–70.1 % | 0 | 0 | 20 (15 / 5) | 0 | 0 | 0 | 369 |
| random vs minimax@d4 | 0.0 % | 0.0 %–16.1 % | 0 | 20 | 0 (0 / 0) | 18 | 2 | 0 | 41 |
| random vs iterative@d4 | 0.0 % | 0.0 %–16.1 % | 0 | 20 | 0 (0 / 0) | 18 | 2 | 0 | 40 |
| minimax@d1 vs minimax@d4 | 2.5 % | 0.3 %–20.0 % | 0 | 19 | 1 (0 / 1) | 9 | 10 | 0 | 48 |
| minimax@d1 vs iterative@d4 | 12.5 % | 4.0 %–33.1 % | 0 | 15 | 5 (0 / 5) | 4 | 11 | 0 | 53 |
| minimax@d4 vs iterative@d4 | 67.5 % | 45.7 %–83.7 % | 11 | 4 | 5 (0 / 5) | 13 | 2 | 0 | 56 |

Draws: 31 (capped 15, repetition 16). Games lost by an illegal or missing move: 0.

## Compared with saved run "baseline"

| Bot | Elo before | Elo after | Change | Median ms before | after |
|---|---:|---:|---:|---:|---:|
| random | 1000 | 1000 | +0 | 0.07 | 0.07 |
| minimax@d1 | 1007 | 1041 | +33 | 0.87 | 0.67 |
| minimax@d4 | 1613 | 1574 | -38 | 70.0 | 46.8 |
| iterative@d4 | 1605 | 1448 | -158 | 86.1 | 55.1 |

Identical games: 15/120

Differing games (first 5 of 105):

- random vs minimax@d1, seed 3, random light / minimax@d1 dark: ending capped → repetition; plies 408 → 316; minimax@d1 leaves 3948 → 2988
- random vs minimax@d1, seed 4, random light / minimax@d1 dark: ending capped → repetition; plies 408 → 70; minimax@d1 leaves 4204 → 549
- random vs minimax@d1, seed 6, random light / minimax@d1 dark: ending capped → repetition; plies 408 → 247; minimax@d1 leaves 4197 → 2410
- random vs minimax@d1, seed 6, minimax@d1 light / random dark: ending capped → repetition; plies 406 → 257; minimax@d1 leaves 4873 → 2942
- random vs minimax@d1, seed 8, random light / minimax@d1 dark: ending capped → repetition; plies 406 → 374; minimax@d1 leaves 4533 → 4184
