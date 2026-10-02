# Saved run "mills-eval-tuning"

## strength

```
node Mills/bench/bench.js strength minimax@d4:t1 minimax@d4:v0 --games 200 --seed 1 --cap 200 --jobs 5 --save mills-eval-tuning
```

- Code: a4cd1a94
- Machine: Intel(R) Core(TM) i5-8600K CPU @ 3.60GHz (6 threads), Node v22.13.0
- Started 2026-10-02T10:37:05.401Z, took 4.8 min, 5 jobs

## tune

Timed: 10 iterations (`--iterations 10`, same arguments) took 136 s with `--jobs 5` (13.6 s per
iteration), so 480 iterations take about 1 h 50 min (actual: 6833 s).

```
node Mills/bench/bench.js tune --from h1 --depth 3 --pairs 4 --seed 1 --cap 200 --jobs 5 --iterations 480 --force --save t1
```

If it stops: the same command with `--resume` instead of `--force`.
