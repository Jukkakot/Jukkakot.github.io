# mills-eval-tuning: tune run

Timed: 10 iterations (`--iterations 10`, same arguments) took 136 s with `--jobs 5` (13.6 s per
iteration), so 480 iterations take about 1 h 50 min.

```
node Mills/bench/bench.js tune --from h1 --depth 3 --pairs 4 --seed 1 --cap 200 --jobs 5 --iterations 480 --force --save t1
```

If it stops: the same command with `--resume` instead of `--force`.
