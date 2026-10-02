# Saved run "mills-transposition-table"

## strength

```
node Mills/bench/bench.js strength random minimax@d1 minimax@d4 iterative@d4 --games 20 --seed 1 --cap 200 --jobs 4 --compare baseline --save mills-transposition-table --notes 'mills-transposition-table: light strength check against the baseline.'
```

- Code: f6be4df
- Machine: Intel(R) Xeon(R) Processor @ 2.10GHz (4 threads), Node v22.22.0
- Started 2026-10-02T05:22:57.955Z, took 2.3 min, 4 jobs

mills-transposition-table: light strength check against the baseline.

## speed

```
node Mills/bench/bench.js speed minimax@d4 minimax@d6 iterative@d6 iterative@1000ms --positions Mills/bench/positions-quick.json --jobs 1 --compare mills-transposition-table-before --save mills-transposition-table --notes 'mills-transposition-table: quick speed check after the change.'
```

- Code: f6be4df
- Machine: Intel(R) Xeon(R) Processor @ 2.10GHz (4 threads), Node v22.22.0
- Started 2026-10-02T05:25:40.688Z, took 0.4 min, 1 jobs

mills-transposition-table: quick speed check after the change.
