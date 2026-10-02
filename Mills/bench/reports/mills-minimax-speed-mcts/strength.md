# Mills bot strength

- Bots: random, minimax@d1, minimax@d4, iterative@d4, mcts@i5000
- Games per pairing: 6, first seed 1, move cap 200 turns per player
- Jobs: 4; code: 54c3f83; Node v22.22.0; Intel(R) Xeon(R) Processor @ 2.10GHz (4 threads)
- Started 2026-10-02T01:06:01.654Z, took 39.7 min

## Standings

| Bot | Elo | 95 % interval | Score | Median ms/move | Max ms | Leaves/move |
|---|---:|---:|---:|---:|---:|---:|
| minimax@d4 (Minmax 4) | 1588 | 1487–1708 | 91.7 % | 48.1 | 584 | 2881 |
| iterative@d4 (Iterative D 4) | 1516 | 1461–1638 | 83.3 % | 44.9 | 490 | 2122 |
| mcts@i5000 (MCTS) | 1179 | 1179–1180 | 37.5 % | 2556 | 38863 | 4994 |
| minimax@d1 (Minmax 1) | 1093 | 1093–1093 | 25.0 % | 0.64 | 16.5 | 19 |
| random (Random) | 1000 | 1000–1000 | 12.5 % | 0.06 | 16.2 | 0 |

Elo: Bradley–Terry, draws (capped games) half a point, random = 1000; interval by bootstrap.

## Pairings

| Pairing | Share of first | 95 % interval | W | L | Capped | By chips | By blocking | Illegal | Avg plies |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| random vs minimax@d1 | 50.0 % | 18.8 %–81.2 % | 0 | 0 | 6 | 0 | 0 | 0 | 408 |
| random vs minimax@d4 | 0.0 % | 0.0 %–39.0 % | 0 | 6 | 0 | 3 | 3 | 0 | 35 |
| random vs iterative@d4 | 0.0 % | 0.0 %–39.0 % | 0 | 6 | 0 | 5 | 1 | 0 | 44 |
| random vs mcts@i5000 | 0.0 % | 0.0 %–39.0 % | 0 | 6 | 0 | 6 | 0 | 0 | 72 |
| minimax@d1 vs minimax@d4 | 0.0 % | 0.0 %–39.0 % | 0 | 6 | 0 | 3 | 3 | 0 | 71 |
| minimax@d1 vs iterative@d4 | 0.0 % | 0.0 %–39.0 % | 0 | 6 | 0 | 4 | 2 | 0 | 44 |
| minimax@d1 vs mcts@i5000 | 50.0 % | 18.8 %–81.2 % | 0 | 0 | 6 | 0 | 0 | 0 | 407 |
| minimax@d4 vs iterative@d4 | 66.7 % | 30.0 %–90.3 % | 4 | 2 | 0 | 5 | 1 | 0 | 60 |
| minimax@d4 vs mcts@i5000 | 100.0 % | 61.0 %–100.0 % | 6 | 0 | 0 | 6 | 0 | 0 | 40 |
| iterative@d4 vs mcts@i5000 | 100.0 % | 61.0 %–100.0 % | 6 | 0 | 0 | 4 | 2 | 0 | 36 |

Capped games: 12. Games lost by an illegal or missing move: 0.

## Compared with saved run "baseline-mcts"

| Bot | Elo before | Elo after | Change | Median ms before | after |
|---|---:|---:|---:|---:|---:|
| random | 1000 | 1000 | +0 | 0.08 | 0.06 |
| minimax@d1 | 1093 | 1093 | +0 | 1.01 | 0.64 |
| minimax@d4 | 1588 | 1588 | +0 | 84.2 | 48.1 |
| iterative@d4 | 1516 | 1516 | +0 | 81.9 | 44.9 |
| mcts@i5000 | 1179 | 1179 | +0 | 3205 | 2556 |

Identical games: 60/60
