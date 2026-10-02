# Mills bot strength

- Bots: minimax@d1, minimax@d4, mcts@i1000:random, mcts@i1500:heur, mcts@i7000:cut12, mcts@i7000:heurcut12
- Games per pairing: 10, first seed 1, move cap 200 turns per player
- Jobs: 4; code: ba881c06; Node v22.13.0; Intel(R) Core(TM) i5-8600K CPU @ 3.60GHz (6 threads)
- Started 2026-10-02T11:49:44.462Z, took 49.0 min

## Standings

| Bot | Elo | 95 % interval | Score | Median ms/move | Max ms | Leaves/move |
|---|---:|---:|---:|---:|---:|---:|
| minimax@d4 (Minmax 4) | 1624 | 1499–1802 | 87.0 % | 47.7 | 1110 | 2009 |
| mcts@i7000:heurcut12 | 1515 | 1401–1667 | 74.0 % | 2428 | 3175 | 6961 |
| mcts@i7000:cut12 | 1425 | 1307–1548 | 62.0 % | 2150 | 3034 | 6961 |
| mcts@i1500:heur | 1337 | 1216–1462 | 50.0 % | 1360 | 3226 | 1495 |
| mcts@i1000:random | 1070 | 948–1173 | 17.0 % | 1776 | 3590 | 981 |
| minimax@d1 (Minmax 1) | 1000 | 1000–1000 | 10.0 % | 0.75 | 6.04 | 13 |

Elo: Bradley–Terry, draws (capped or repetition) half a point, minimax@d1 = 1000; interval by bootstrap.

## Pairings

| Pairing | Share of first | 95 % interval | W | L | Draws (capped / repetition) | By chips | By blocking | Illegal | Avg plies |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| minimax@d1 vs minimax@d4 | 5.0 % | 0.5 %–34.5 % | 0 | 9 | 1 (1 / 0) | 5 | 4 | 0 | 82 |
| minimax@d1 vs mcts@i1000:random | 35.0 % | 13.7 %–64.6 % | 2 | 5 | 3 (0 / 3) | 7 | 0 | 0 | 84 |
| minimax@d1 vs mcts@i1500:heur | 5.0 % | 0.5 %–34.5 % | 0 | 9 | 1 (0 / 1) | 9 | 0 | 0 | 140 |
| minimax@d1 vs mcts@i7000:cut12 | 5.0 % | 0.5 %–34.5 % | 0 | 9 | 1 (0 / 1) | 8 | 1 | 0 | 68 |
| minimax@d1 vs mcts@i7000:heurcut12 | 0.0 % | 0.0 %–27.8 % | 0 | 10 | 0 (0 / 0) | 10 | 0 | 0 | 72 |
| minimax@d4 vs mcts@i1000:random | 100.0 % | 72.2 %–100.0 % | 10 | 0 | 0 (0 / 0) | 7 | 3 | 0 | 42 |
| minimax@d4 vs mcts@i1500:heur | 90.0 % | 59.6 %–98.2 % | 9 | 1 | 0 (0 / 0) | 8 | 2 | 0 | 73 |
| minimax@d4 vs mcts@i7000:cut12 | 70.0 % | 39.7 %–89.2 % | 7 | 3 | 0 (0 / 0) | 5 | 5 | 0 | 48 |
| minimax@d4 vs mcts@i7000:heurcut12 | 80.0 % | 49.0 %–94.3 % | 8 | 2 | 0 (0 / 0) | 8 | 2 | 0 | 52 |
| mcts@i1000:random vs mcts@i1500:heur | 20.0 % | 5.7 %–51.0 % | 2 | 8 | 0 (0 / 0) | 10 | 0 | 0 | 74 |
| mcts@i1000:random vs mcts@i7000:cut12 | 0.0 % | 0.0 %–27.8 % | 0 | 10 | 0 (0 / 0) | 9 | 1 | 0 | 43 |
| mcts@i1000:random vs mcts@i7000:heurcut12 | 0.0 % | 0.0 %–27.8 % | 0 | 10 | 0 (0 / 0) | 8 | 2 | 0 | 49 |
| mcts@i1500:heur vs mcts@i7000:cut12 | 50.0 % | 23.7 %–76.3 % | 5 | 5 | 0 (0 / 0) | 9 | 1 | 0 | 76 |
| mcts@i1500:heur vs mcts@i7000:heurcut12 | 15.0 % | 3.5 %–45.9 % | 1 | 8 | 1 (0 / 1) | 7 | 2 | 0 | 51 |
| mcts@i7000:cut12 vs mcts@i7000:heurcut12 | 35.0 % | 13.7 %–64.6 % | 3 | 6 | 1 (0 / 1) | 7 | 2 | 0 | 46 |

Draws: 8 (capped 1, repetition 7). Games lost by an illegal or missing move: 0.
