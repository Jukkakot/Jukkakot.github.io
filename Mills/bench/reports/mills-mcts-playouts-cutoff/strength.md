# Mills bot strength

- Bots: minimax@d4, mcts@i11000:heurcut6, mcts@i7000:heurcut12, mcts@i3500:heurcut24
- Games per pairing: 10, first seed 1, move cap 200 turns per player
- Jobs: 4; code: ba881c06; Node v22.13.0; Intel(R) Core(TM) i5-8600K CPU @ 3.60GHz (6 threads)
- Started 2026-10-02T12:39:10.011Z, took 25.9 min

## Standings

| Bot | Elo | 95 % interval | Score | Median ms/move | Max ms | Leaves/move |
|---|---:|---:|---:|---:|---:|---:|
| minimax@d4 (Minmax 4) | 1000 | 1000–1000 | 85.0 % | 37.4 | 308 | 1014 |
| mcts@i11000:heurcut6 | 773 | 590–906 | 45.0 % | 2506 | 3154 | 10933 |
| mcts@i3500:heurcut24 | 729 | 578–847 | 36.7 % | 2156 | 3166 | 3477 |
| mcts@i7000:heurcut12 | 711 | 539–864 | 33.3 % | 2472 | 3215 | 6927 |

Elo: Bradley–Terry, draws (capped or repetition) half a point, minimax@d4 = 1000; interval by bootstrap.

## Pairings

| Pairing | Share of first | 95 % interval | W | L | Draws (capped / repetition) | By chips | By blocking | Illegal | Avg plies |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| minimax@d4 vs mcts@i11000:heurcut6 | 75.0 % | 44.2 %–91.9 % | 7 | 2 | 1 (0 / 1) | 4 | 5 | 0 | 44 |
| minimax@d4 vs mcts@i7000:heurcut12 | 80.0 % | 49.0 %–94.3 % | 8 | 2 | 0 (0 / 0) | 8 | 2 | 0 | 52 |
| minimax@d4 vs mcts@i3500:heurcut24 | 100.0 % | 72.2 %–100.0 % | 10 | 0 | 0 (0 / 0) | 6 | 4 | 0 | 46 |
| mcts@i11000:heurcut6 vs mcts@i7000:heurcut12 | 60.0 % | 31.3 %–83.2 % | 5 | 3 | 2 (0 / 2) | 6 | 2 | 0 | 55 |
| mcts@i11000:heurcut6 vs mcts@i3500:heurcut24 | 50.0 % | 23.7 %–76.3 % | 4 | 4 | 2 (0 / 2) | 8 | 0 | 0 | 67 |
| mcts@i7000:heurcut12 vs mcts@i3500:heurcut24 | 40.0 % | 16.8 %–68.7 % | 3 | 5 | 2 (0 / 2) | 7 | 1 | 0 | 71 |

Draws: 7 (capped 0, repetition 7). Games lost by an illegal or missing move: 0.
