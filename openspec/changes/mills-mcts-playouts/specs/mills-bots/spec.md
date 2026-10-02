## MODIFIED Requirements

### Requirement: MCTS bot

"MCTS" SHALL run Monte Carlo tree search (UCT, `c = 1.41`) with a fixed number of iterations per
move. Each player's choices in the tree SHALL be judged from that player's own view. Won, lost
and repeated (third occurrence) positions SHALL be scored exactly. The bot SHALL play the most
visited move.

A search SHALL support these playout methods:
- **random**: random moves until the game is decided; after 200 plies the playout counts as a draw;
- **heuristic**: like random, but a move that closes an own mill SHALL be preferred, then a move
  that occupies the empty point of an opponent's two-in-a-row; a removal SHALL prefer a chip that
  belongs to an opponent's two-in-a-row; ties are random;
- **cutoff**: random or heuristic moves for a fixed number of plies; if the game is not decided
  by then (and no removal is pending), the position SHALL be scored with the minimax evaluation
  mapped monotonically to a value strictly between loss (0) and win (1).

The in-game option SHALL use the playout method and iteration count chosen by the benchmark
(recorded in the change's design and in `Mills/OVERVIEW.md`), with a median time per move not
above the earlier 5000-iteration random-playout bot on the same machine. A search MAY be given
another iteration count or playout method (only the benchmark does).

#### Scenario: MCTS move
- **WHEN** MCTS has the turn and more than one legal move exists
- **THEN** it runs its configured number of iterations and plays the most visited root move

#### Scenario: Immediate win
- **WHEN** one of MCTS's moves wins the game at once
- **THEN** it plays that move, with every playout method

#### Scenario: Heuristic playout closes a mill
- **WHEN** a heuristic playout reaches a position where the side to move can close a mill
- **THEN** it plays a mill-closing move

#### Scenario: Cutoff score
- **WHEN** a cutoff playout ends undecided in a position the evaluation scores in the root player's favour
- **THEN** the reward is above 0.5 and below 1; a position scored against the root player gives a reward below 0.5 and above 0
