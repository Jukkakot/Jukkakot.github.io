# Mills bot strength

- Bots: random, minimax@d1, minimax@d4, iterative@d4, mcts@i5000
- Games per pairing: 6, first seed 1, move cap 200 turns per player
- Jobs: 4; code: df02bad; Node v22.22.0; Intel(R) Xeon(R) Processor @ 2.10GHz (4 threads)
- Started 2026-10-01T23:38:58.126Z, took 50.2 min

## Standings

| Bot | Elo | 95 % interval | Score | Median ms/move | Max ms | Leaves/move |
|---|---:|---:|---:|---:|---:|---:|
| minimax@d4 (Minmax 4) | 1588 | 1487–1708 | 91.7 % | 84.2 | 4413 | 2881 |
| iterative@d4 (Iterative D 4) | 1516 | 1461–1638 | 83.3 % | 81.9 | 1262 | 2122 |
| mcts@i5000 (MCTS) | 1179 | 1179–1180 | 37.5 % | 3205 | 45775 | 4994 |
| minimax@d1 (Minmax 1) | 1093 | 1093–1093 | 25.0 % | 1.01 | 17.8 | 19 |
| random (Random) | 1000 | 1000–1000 | 12.5 % | 0.08 | 5.11 | 0 |

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
