# Mills bot strength

- Bots: random, minimax@d1, minimax@d4, iterative@d4
- Games per pairing: 20, first seed 1, move cap 200 turns per player
- Jobs: 4; code: df02bad; Node v22.22.0; Intel(R) Xeon(R) Processor @ 2.10GHz (4 threads)
- Started 2026-10-01T23:35:22.929Z, took 3.2 min

## Standings

| Bot | Elo | 95 % interval | Score | Median ms/move | Max ms | Leaves/move |
|---|---:|---:|---:|---:|---:|---:|
| minimax@d4 (Minmax 4) | 1613 | 1550–1711 | 83.3 % | 70.0 | 4387 | 1990 |
| iterative@d4 (Iterative D 4) | 1605 | 1521–1719 | 82.5 % | 86.1 | 3727 | 3085 |
| minimax@d1 (Minmax 1) | 1007 | 1000–1021 | 17.5 % | 0.87 | 23.4 | 19 |
| random (Random) | 1000 | 1000–1000 | 16.7 % | 0.07 | 8.68 | 0 |

Elo: Bradley–Terry, draws (capped games) half a point, random = 1000; interval by bootstrap.

## Pairings

| Pairing | Share of first | 95 % interval | W | L | Capped | By chips | By blocking | Illegal | Avg plies |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| random vs minimax@d1 | 50.0 % | 29.9 %–70.1 % | 0 | 0 | 20 | 0 | 0 | 0 | 408 |
| random vs minimax@d4 | 0.0 % | 0.0 %–16.1 % | 0 | 20 | 0 | 15 | 5 | 0 | 38 |
| random vs iterative@d4 | 0.0 % | 0.0 %–16.1 % | 0 | 20 | 0 | 16 | 4 | 0 | 41 |
| minimax@d1 vs minimax@d4 | 0.0 % | 0.0 %–16.1 % | 0 | 20 | 0 | 8 | 12 | 0 | 49 |
| minimax@d1 vs iterative@d4 | 2.5 % | 0.3 %–20.0 % | 0 | 19 | 1 | 13 | 6 | 0 | 73 |
| minimax@d4 vs iterative@d4 | 50.0 % | 29.9 %–70.1 % | 10 | 10 | 0 | 17 | 3 | 0 | 77 |

Capped games: 21. Games lost by an illegal or missing move: 0.
