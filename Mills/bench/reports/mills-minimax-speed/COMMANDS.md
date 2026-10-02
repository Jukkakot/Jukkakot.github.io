# Saved run "mills-minimax-speed"

## strength

```
node Mills/bench/bench.js strength random minimax@d1 minimax@d4 iterative@d4 --games 20 --seed 1 --cap 200 --jobs 4 --compare baseline --save mills-minimax-speed --notes 'mills-minimax-speed: the fast strength baseline command on the faster worker code.'
```

- Code: 54c3f83
- Machine: Intel(R) Xeon(R) Processor @ 2.10GHz (4 threads), Node v22.22.0
- Started 2026-10-02T01:04:27.737Z, took 1.5 min, 4 jobs

mills-minimax-speed: the fast strength baseline command on the faster worker code.

## speed

```
node Mills/bench/bench.js speed random minimax@d1 minimax@d4 minimax@d6 iterative@500ms iterative@1000ms iterative@3000ms iterative@d4 iterative@d6 mcts@i5000 --jobs 1 --compare baseline --save mills-minimax-speed --notes 'mills-minimax-speed: the baseline speed command on the faster worker code.'
```

- Code: 54c3f83
- Machine: Intel(R) Xeon(R) Processor @ 2.10GHz (4 threads), Node v22.22.0
- Started 2026-10-02T00:52:18.014Z, took 11.7 min, 1 jobs

mills-minimax-speed: the baseline speed command on the faster worker code.
