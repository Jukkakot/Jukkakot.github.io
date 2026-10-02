# Proposal

## Why

The MCTS bot (in-game "MCTS") is step 5 of the improvement plan. Its search is broken in ways
that make it both weak and slow (baseline: Elo 1179, below `minimax@d4` by 400, 10 s per move):
rewards are counted for the bot at every node, so at the opponent's nodes the search picks the
opponent's worst replies; a won position marks its parent as won ("Infinity") whoever moved;
the final choice compares visits with wins; random playouts run until someone wins, which in
the moving stage can take thousands of plies; and every step copies the whole state as JSON.

## What Changes

- A rewritten MCTS search in `MCTSWorker.js` behind the same entry point
  (`MCTSFindBestMove(board, player, oppPlayer, eatMode, args)`) and the same move data
  (`playoutCount`, `nodeCount`, playout turn statistics):
  - each node's value is kept from the view of the player who moved into it, so both sides
    choose their own best replies (UCT, `c = 1.41`, unchanged);
  - terminal positions (win, loss, no legal move) score exactly; a third repetition of a game
    position in the tree is a draw (0.5), using the game history the worker already has;
  - random playouts stop after 200 plies and count as a draw (0.5);
  - the final move is the most visited root child (ties: the higher value);
  - states are copied with `clonePlayer`, not JSON.
- Still 5000 iterations per move (the bot name `mcts@i5000` and the option text stay).
- The random game state generator (key `p`, "Generate gamestate") keeps its own code path.
- **No visual effect on the Mills UI:** only the worker's MCTS code changes.

Measurement (first milestone, `CLAUDE.md`: MCTS code changes): the full baseline set, saved as
`milestone-1`:
- `baseline-mcts` strength command with `--compare baseline-mcts`. Goals: MCTS Elo above its
  baseline interval (1179–1180), and MCTS scores more than 50 % against `minimax@d1` (baseline:
  every game capped).
- Baseline speed command with `--compare baseline`: MCTS median time per move lower than the
  baseline's 10.2 s.
- The fast strength command with `--compare baseline`, as every milestone does.
- Correctness: MCTS tests (design §5): immediate win, no mill given away, repeatable, generator intact.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `mills-bots`: "MCTS bot" requirement: correct per-player values, playout cap, final choice.

## Impact

- `Mills/workers/MCTSWorker.js` (search rewritten; generator code kept).
- `Mills/bench/test/` (MCTS tests); saved run `Mills/bench/reports/milestone-1/`;
  `Mills/OVERVIEW.md` (MCTS section, weak spots).
