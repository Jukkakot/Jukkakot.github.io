# Saved run "mills-bot-repetition"

## strength

```
node Mills/bench/bench.js strength random minimax@d1 minimax@d4 iterative@d4 --games 20 --seed 1 --cap 200 --jobs 4 --compare baseline --save mills-bot-repetition --notes 'mills-bot-repetition: light strength check against the baseline.'
```

- Code: b9222b8 (uncommitted changes)
- Machine: Intel(R) Xeon(R) Processor @ 2.10GHz (4 threads), Node v22.22.0
- Started 2026-10-02T05:40:21.749Z, took 1.1 min, 4 jobs

mills-bot-repetition: light strength check against the baseline.

## speed

```
node Mills/bench/bench.js speed minimax@d4 minimax@d6 iterative@d6 --positions Mills/bench/positions-quick.json --jobs 1 --compare mills-transposition-table --save mills-bot-repetition --force --notes 'mills-bot-repetition: quick speed check against mills-transposition-table.'
```

- Code: 7a8458e (uncommitted changes)
- Machine: Intel(R) Xeon(R) Processor @ 2.10GHz (4 threads), Node v22.22.0
- Started 2026-10-02T05:43:16.622Z, took 0.2 min, 1 jobs

mills-bot-repetition: quick speed check against mills-transposition-table.
