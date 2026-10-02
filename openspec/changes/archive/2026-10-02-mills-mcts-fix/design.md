# Design

## Context

- `MCTSFindBestMove` is called from `fastFindBestMove` when `options.mcts`; it returns
  `{ result: [move, type], data }`. The benchmark reads `data.playoutCount` as "leaves".
- The worker helpers give everything a search needs: `fastGetUnOrderedMoves(board, mover,
  other, eatMode)` → `{ moves, type }`, `fastPlayRound({ move, type, board, player: mover,
  oppPlayer: other })` → `{ board, eatMode }` (mutates the mover's turns and mills and, when
  eating, the victim's mills), `fastCheckWin(board, player, oppPlayer, 1, eatMode)`,
  `clonePlayer`, `repKey`, `gameHistory`.
- `Node`, `playMove` and `generateRandomState` also serve the random game state generator
  (`getRandomGameState`); that feature must keep working.
- Randomness comes from `Math.random` (seeded in the benchmark), so runs stay repeatable.

## Goals / Non-Goals

**Goals:** a correct UCT search for both sides; bounded playouts; much less time per move at
the same 5000 iterations; a clearly stronger bot.

**Non-Goals:** time-limited MCTS budgets or new UI options; heuristic (evaluation-guided)
playouts; tree reuse between moves; MCTS-RAVE or other variants; changes to the generator.

## Decisions

### 1. Tree node

`{ move, type, board, me, opp, rootToMove, eatMode, children, untried, visits, value, terminal }`
where `me`/`opp` are cloned copies of the root player and the opponent in this state,
`rootToMove` says whose turn it is, and `value` sums rewards **from the view of the player who
made the move into this node** (for the root: unused). `untried` is the list of legal moves,
taken in random order (`Math.random`) when expanding.

### 2. Terminal states and rewards

A reward is from the root player's view: 1 win, 0 loss, 0.5 draw. A node is terminal when
`fastCheckWin(board, me, opp, 1, eatMode)` gives WIN (1) or LOST (0), when the side to move has
no legal move (loss for it), or when, after a completed turn outside the placing stage, its
`repKey` already has a count of 2 in `gameHistory` (draw 0.5). Terminal nodes are not
expanded; their reward is exact every visit.

### 3. Iteration

Select with UCT from the root while a node is fully expanded and not terminal:
`value/visits + 1.41 * sqrt(ln(parent.visits) / visits)` (child values are already from the view
of the player choosing at the parent). Expand one untried move. Playout from the new node with
random legal moves on throwaway copies (`clonePlayer`, board string) until terminal or 200 plies
(draw 0.5). Backpropagate: each node on the path adds the reward if the root player made the
move into it, else `1 - reward`; visits + 1.

### 4. Final move

The root child with the most visits; ties broken by the higher `value / visits`, then by order.
`args` other than `"visits"` (only `"visits"` exists in OPTIONS) is ignored. With one legal
move it is returned at once (as now).

### 5. Tests (bench)

- MCTS takes an immediate win: a moving-stage position where one move closes a mill that wins
  (opponent at 3 chips → 2) → it is chosen.
- MCTS does not give away a mill: a position where all but one move let the opponent close a
  mill next turn; with 5000 iterations it picks the safe move (the old code fails this).
- Repeatable: same seed → same move; move data has `playoutCount` 5000 or fewer (terminal hits
  count as playouts).
- Generator: `getRandomGameState` still returns a valid state (board of 24, no error).

### 6. Measurement (milestone 1)

1. `strength random minimax@d1 minimax@d4 iterative@d4 mcts@i5000 --games 6 --seed 1 --cap 200
   --jobs 4 --compare baseline-mcts --save milestone-1-mcts`: goals in the proposal.
2. Baseline speed command with `--compare baseline --save milestone-1`.
3. `strength random minimax@d1 minimax@d4 iterative@d4 --games 20 --seed 1 --cap 200 --jobs 4
   --compare baseline --save milestone-1`.
Results and whether each goal was met are recorded here; misses are reported, not forced.

## Risks / Trade-offs

- [Playout cap 200 hides slow wins] → accepted; draws keep the search neutral there.
- [Random playouts are weak in Mills] → expected; heuristic playouts are a later option.
- [Generator breaks] → kept on its own code path, tested.

## Results (milestone 1, 2026-10-02)

Runs on an i5-8600K (6 threads); the baselines ran on a cloud Xeon, so times are compared on
the same machine where it matters (noted below). Saved: `Mills/bench/reports/milestone-1-mcts/`
(strength with MCTS) and `Mills/bench/reports/milestone-1/` (fast strength, speed).

- **§6.1 Strength, MCTS** (60 games): MCTS Elo **1299** (interval 1299–1301), baseline 1179
  (1179–1180): **goal met**. Against `minimax@d1` MCTS won **6/6** (baseline: all capped):
  **goal met**. It beat `random` 6/6 and still lost every game against `minimax@d4` and
  `iterative@d4` (0/12). Other bots: `minimax@d4` 1616 (+28), `iterative@d4` 1580 (+64),
  `minimax@d1` 1000 (−93: its capped draws against MCTS in the baseline are now losses).
- **§6.3 Strength, fast** (120 games, `--compare baseline`): `minimax@d4` 1640 (baseline 1613,
  +27), `iterative@d4` 1535 (1605, −71), `minimax@d1` 1015 (1007, +7). Intervals overlap
  (`iterative@d4` 1455–1624 now); 15/120 games identical, the rest differ because the
  transposition table and the repetition rule change move choices. Draws: 25 (18 capped,
  7 repetition). No illegal moves.
- **§6.2 Speed** (40 positions, `--compare baseline`): MCTS median **10.97 s** per move
  against the baseline's 10.2 s: **goal missed** overall. By stage (baseline / now): placing-early
  0.83 s / 14.3 s, placing-late 16.5 s / 11.3 s, moving 19.7 s / 9.7 s, flying 2.2 s / 1.2 s. The
  early-placing baseline was cheap only because the old search barely ran there: on the first
  placing-early position the old code built 15 nodes with playouts of 1 ply on average (0.3 s);
  the new one builds 5000 nodes with 138-ply playouts (14.3 s). In the stages where the old
  search did run, the new one is 1.5–2× faster, and on the same machine (8 moving positions,
  i5-8600K) old 20–59 s against new 7–16 s per move. Minimax bots: `minimax@d6` 1.55× and
  `iterative@d6` 2.62× faster than the baseline (different machine; leaves per move are the
  machine-independent measure, in the saved report).
