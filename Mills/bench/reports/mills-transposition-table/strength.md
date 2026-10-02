# Mills bot strength

- Bots: random, minimax@d1, minimax@d4, iterative@d4
- Games per pairing: 20, first seed 1, move cap 200 turns per player
- Jobs: 4; code: f6be4df; Node v22.22.0; Intel(R) Xeon(R) Processor @ 2.10GHz (4 threads)
- Started 2026-10-02T05:22:57.955Z, took 2.3 min

## Standings

| Bot | Elo | 95 % interval | Score | Median ms/move | Max ms | Leaves/move |
|---|---:|---:|---:|---:|---:|---:|
| minimax@d4 (Minmax 4) | 1650 | 1559–1780 | 89.2 % | 54.1 | 1016 | 1170 |
| iterative@d4 (Iterative D 4) | 1529 | 1430–1631 | 75.8 % | 84.3 | 1800 | 2676 |
| minimax@d1 (Minmax 1) | 1015 | 1000–1035 | 18.3 % | 0.66 | 28.8 | 18 |
| random (Random) | 1000 | 1000–1000 | 16.7 % | 0.06 | 16.2 | 0 |

Elo: Bradley–Terry, draws (capped games) half a point, random = 1000; interval by bootstrap.

## Pairings

| Pairing | Share of first | 95 % interval | W | L | Capped | By chips | By blocking | Illegal | Avg plies |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| random vs minimax@d1 | 50.0 % | 29.9 %–70.1 % | 0 | 0 | 20 | 0 | 0 | 0 | 408 |
| random vs minimax@d4 | 0.0 % | 0.0 %–16.1 % | 0 | 20 | 0 | 18 | 2 | 0 | 41 |
| random vs iterative@d4 | 0.0 % | 0.0 %–16.1 % | 0 | 20 | 0 | 18 | 2 | 0 | 40 |
| minimax@d1 vs minimax@d4 | 0.0 % | 0.0 %–16.1 % | 0 | 20 | 0 | 10 | 10 | 0 | 50 |
| minimax@d1 vs iterative@d4 | 5.0 % | 0.9 %–23.6 % | 0 | 18 | 2 | 7 | 11 | 0 | 108 |
| minimax@d4 vs iterative@d4 | 67.5 % | 45.7 %–83.7 % | 13 | 6 | 1 | 17 | 2 | 0 | 87 |

Capped games: 23. Games lost by an illegal or missing move: 0.

## Compared with saved run "baseline"

| Bot | Elo before | Elo after | Change | Median ms before | after |
|---|---:|---:|---:|---:|---:|
| random | 1000 | 1000 | +0 | 0.07 | 0.06 |
| minimax@d1 | 1007 | 1015 | +7 | 0.87 | 0.66 |
| minimax@d4 | 1613 | 1650 | +37 | 70.0 | 54.1 |
| iterative@d4 | 1605 | 1529 | -76 | 86.1 | 84.3 |

Identical games: 20/120

Differing games (first 5 of 100):

- random vs minimax@d4, seed 1, random light / minimax@d4 dark: plies 35 → 51; minimax@d4 leaves 33378 → 26968
- random vs minimax@d4, seed 1, minimax@d4 light / random dark: plies 46 → 40; minimax@d4 leaves 30608 → 33145
- random vs minimax@d4, seed 2, random light / minimax@d4 dark: ending blocked → chips; plies 30 → 39; minimax@d4 leaves 26964 → 31864
- random vs minimax@d4, seed 2, minimax@d4 light / random dark: plies 40 → 42; minimax@d4 leaves 34427 → 32713
- random vs minimax@d4, seed 3, random light / minimax@d4 dark: ending blocked → chips; plies 19 → 45; minimax@d4 leaves 25429 → 29306
