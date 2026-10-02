# Mills bot strength

- Bots: random, minimax@d1, minimax@d4, iterative@d4, mcts@i5000
- Games per pairing: 6, first seed 1, move cap 200 turns per player
- Jobs: 4; code: de60c4f7; Node v22.13.0; Intel(R) Core(TM) i5-8600K CPU @ 3.60GHz (6 threads)
- Started 2026-10-02T06:03:40.854Z, took 32.5 min

## Standings

| Bot | Elo | 95 % interval | Score | Median ms/move | Max ms | Leaves/move |
|---|---:|---:|---:|---:|---:|---:|
| minimax@d4 (Minmax 4) | 1616 | 1549–1756 | 89.6 % | 52.4 | 396 | 1198 |
| iterative@d4 (Iterative D 4) | 1580 | 1507–1660 | 85.4 % | 64.6 | 1518 | 1833 |
| mcts@i5000 (MCTS) | 1299 | 1299–1301 | 50.0 % | 9634 | 24875 | 4925 |
| random (Random) | 1000 | 1000–1000 | 12.5 % | 0.13 | 7.15 | 0 |
| minimax@d1 (Minmax 1) | 1000 | 1000–1000 | 12.5 % | 1.07 | 30.5 | 19 |

Elo: Bradley–Terry, draws (capped or repetition) half a point, random = 1000; interval by bootstrap.

## Pairings

| Pairing | Share of first | 95 % interval | W | L | Draws (capped / repetition) | By chips | By blocking | Illegal | Avg plies |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| random vs minimax@d1 | 50.0 % | 18.8 %–81.2 % | 0 | 0 | 6 (5 / 1) | 0 | 0 | 0 | 396 |
| random vs minimax@d4 | 0.0 % | 0.0 %–39.0 % | 0 | 6 | 0 (0 / 0) | 6 | 0 | 0 | 43 |
| random vs iterative@d4 | 0.0 % | 0.0 %–39.0 % | 0 | 6 | 0 (0 / 0) | 6 | 0 | 0 | 41 |
| random vs mcts@i5000 | 0.0 % | 0.0 %–39.0 % | 0 | 6 | 0 (0 / 0) | 6 | 0 | 0 | 54 |
| minimax@d1 vs minimax@d4 | 0.0 % | 0.0 %–39.0 % | 0 | 6 | 0 (0 / 0) | 1 | 5 | 0 | 32 |
| minimax@d1 vs iterative@d4 | 0.0 % | 0.0 %–39.0 % | 0 | 6 | 0 (0 / 0) | 2 | 4 | 0 | 62 |
| minimax@d1 vs mcts@i5000 | 0.0 % | 0.0 %–39.0 % | 0 | 6 | 0 (0 / 0) | 6 | 0 | 0 | 93 |
| minimax@d4 vs iterative@d4 | 58.3 % | 24.1 %–86.1 % | 3 | 2 | 1 (0 / 1) | 5 | 0 | 0 | 66 |
| minimax@d4 vs mcts@i5000 | 100.0 % | 61.0 %–100.0 % | 6 | 0 | 0 (0 / 0) | 3 | 3 | 0 | 48 |
| iterative@d4 vs mcts@i5000 | 100.0 % | 61.0 %–100.0 % | 6 | 0 | 0 (0 / 0) | 5 | 1 | 0 | 50 |

Draws: 7 (capped 5, repetition 2). Games lost by an illegal or missing move: 0.

## Compared with saved run "baseline-mcts"

| Bot | Elo before | Elo after | Change | Median ms before | after |
|---|---:|---:|---:|---:|---:|
| random | 1000 | 1000 | +0 | 0.08 | 0.13 |
| minimax@d1 | 1093 | 1000 | -93 | 1.01 | 1.07 |
| minimax@d4 | 1588 | 1616 | +28 | 84.2 | 52.4 |
| iterative@d4 | 1516 | 1580 | +64 | 81.9 | 64.6 |
| mcts@i5000 | 1179 | 1299 | +120 | 3205 | 9634 |

Identical games: 5/60

Differing games (first 5 of 55):

- random vs minimax@d1, seed 3, random light / minimax@d1 dark: ending capped → repetition; plies 408 → 337; minimax@d1 leaves 3948 → 3179
- random vs minimax@d4, seed 1, random light / minimax@d4 dark: plies 35 → 51; minimax@d4 leaves 33378 → 26968
- random vs minimax@d4, seed 1, minimax@d4 light / random dark: plies 46 → 40; minimax@d4 leaves 30608 → 33145
- random vs minimax@d4, seed 2, random light / minimax@d4 dark: ending blocked → chips; plies 30 → 39; minimax@d4 leaves 26964 → 31864
- random vs minimax@d4, seed 2, minimax@d4 light / random dark: plies 40 → 42; minimax@d4 leaves 34427 → 32713
