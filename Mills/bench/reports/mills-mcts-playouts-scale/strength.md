# Mills bot strength

- Bots: minimax@d4, mcts@i11000:heurcut6s1000, mcts@i11000:heurcut6, mcts@i11000:heurcut6s4000
- Games per pairing: 10, first seed 1, move cap 200 turns per player
- Jobs: 4; code: ba881c06; Node v22.13.0; Intel(R) Core(TM) i5-8600K CPU @ 3.60GHz (6 threads)
- Started 2026-10-02T13:05:15.224Z, took 32.5 min

## Standings

| Bot | Elo | 95 % interval | Score | Median ms/move | Max ms | Leaves/move |
|---|---:|---:|---:|---:|---:|---:|
| minimax@d4 (Minmax 4) | 1000 | 1000–1000 | 75.0 % | 46.6 | 1193 | 2095 |
| mcts@i11000:heurcut6s1000 | 901 | 772–1019 | 56.7 % | 2585 | 3120 | 10973 |
| mcts@i11000:heurcut6 | 849 | 708–983 | 46.7 % | 2673 | 3158 | 10965 |
| mcts@i11000:heurcut6s4000 | 713 | 534–860 | 21.7 % | 2656 | 3168 | 10924 |

Elo: Bradley–Terry, draws (capped or repetition) half a point, minimax@d4 = 1000; interval by bootstrap.

## Pairings

| Pairing | Share of first | 95 % interval | W | L | Draws (capped / repetition) | By chips | By blocking | Illegal | Avg plies |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| minimax@d4 vs mcts@i11000:heurcut6s1000 | 70.0 % | 39.7 %–89.2 % | 6 | 2 | 2 (1 / 1) | 6 | 2 | 0 | 102 |
| minimax@d4 vs mcts@i11000:heurcut6 | 75.0 % | 44.2 %–91.9 % | 7 | 2 | 1 (0 / 1) | 4 | 5 | 0 | 44 |
| minimax@d4 vs mcts@i11000:heurcut6s4000 | 80.0 % | 49.0 %–94.3 % | 8 | 2 | 0 (0 / 0) | 7 | 3 | 0 | 58 |
| mcts@i11000:heurcut6s1000 vs mcts@i11000:heurcut6 | 55.0 % | 27.4 %–79.9 % | 3 | 2 | 5 (0 / 5) | 5 | 0 | 0 | 79 |
| mcts@i11000:heurcut6s1000 vs mcts@i11000:heurcut6s4000 | 85.0 % | 54.1 %–96.5 % | 8 | 1 | 1 (0 / 1) | 8 | 1 | 0 | 63 |
| mcts@i11000:heurcut6 vs mcts@i11000:heurcut6s4000 | 70.0 % | 39.7 %–89.2 % | 4 | 0 | 6 (0 / 6) | 4 | 0 | 0 | 65 |

Draws: 15 (capped 1, repetition 14). Games lost by an illegal or missing move: 0.
