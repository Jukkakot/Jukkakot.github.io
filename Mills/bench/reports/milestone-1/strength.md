# Mills bot strength

- Bots: random, minimax@d1, minimax@d4, iterative@d4
- Games per pairing: 20, first seed 1, move cap 200 turns per player
- Jobs: 2; code: de60c4f7; Node v22.13.0; Intel(R) Core(TM) i5-8600K CPU @ 3.60GHz (6 threads)
- Started 2026-10-02T06:03:44.611Z, took 3.1 min

## Standings

| Bot | Elo | 95 % interval | Score | Median ms/move | Max ms | Leaves/move |
|---|---:|---:|---:|---:|---:|---:|
| minimax@d4 (Minmax 4) | 1640 | 1542–1772 | 88.3 % | 61.6 | 1392 | 1274 |
| iterative@d4 (Iterative D 4) | 1535 | 1455–1624 | 76.7 % | 85.7 | 2240 | 1943 |
| minimax@d1 (Minmax 1) | 1015 | 1000–1035 | 18.3 % | 1.06 | 74.7 | 19 |
| random (Random) | 1000 | 1000–1000 | 16.7 % | 0.12 | 21.1 | 0 |

Elo: Bradley–Terry, draws (capped or repetition) half a point, random = 1000; interval by bootstrap.

## Pairings

| Pairing | Share of first | 95 % interval | W | L | Draws (capped / repetition) | By chips | By blocking | Illegal | Avg plies |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| random vs minimax@d1 | 50.0 % | 29.9 %–70.1 % | 0 | 0 | 20 (18 / 2) | 0 | 0 | 0 | 396 |
| random vs minimax@d4 | 0.0 % | 0.0 %–16.1 % | 0 | 20 | 0 (0 / 0) | 18 | 2 | 0 | 40 |
| random vs iterative@d4 | 0.0 % | 0.0 %–16.1 % | 0 | 20 | 0 (0 / 0) | 18 | 2 | 0 | 40 |
| minimax@d1 vs minimax@d4 | 2.5 % | 0.3 %–20.0 % | 0 | 19 | 1 (0 / 1) | 9 | 10 | 0 | 47 |
| minimax@d1 vs iterative@d4 | 2.5 % | 0.3 %–20.0 % | 0 | 19 | 1 (0 / 1) | 8 | 11 | 0 | 62 |
| minimax@d4 vs iterative@d4 | 67.5 % | 45.7 %–83.7 % | 12 | 5 | 3 (0 / 3) | 14 | 3 | 0 | 59 |

Draws: 25 (capped 18, repetition 7). Games lost by an illegal or missing move: 0.

## Compared with saved run "baseline"

| Bot | Elo before | Elo after | Change | Median ms before | after |
|---|---:|---:|---:|---:|---:|
| random | 1000 | 1000 | +0 | 0.07 | 0.12 |
| minimax@d1 | 1007 | 1015 | +7 | 0.87 | 1.06 |
| minimax@d4 | 1613 | 1640 | +27 | 70.0 | 61.6 |
| iterative@d4 | 1605 | 1535 | -71 | 86.1 | 85.7 |

Identical games: 15/120

Differing games (first 5 of 105):

- random vs minimax@d1, seed 3, random light / minimax@d1 dark: ending capped → repetition; plies 408 → 337; minimax@d1 leaves 3948 → 3179
- random vs minimax@d1, seed 4, random light / minimax@d1 dark: plies 408 → 406; minimax@d1 leaves 4204 → 4743
- random vs minimax@d1, seed 6, random light / minimax@d1 dark: ending capped → repetition; plies 408 → 247; minimax@d1 leaves 4197 → 2410
- random vs minimax@d1, seed 6, minimax@d1 light / random dark: minimax@d1 leaves 4873 → 4712
- random vs minimax@d1, seed 8, random light / minimax@d1 dark: minimax@d1 leaves 4533 → 4518
