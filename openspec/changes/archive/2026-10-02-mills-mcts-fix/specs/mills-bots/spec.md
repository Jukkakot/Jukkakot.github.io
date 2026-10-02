# Spec Delta

## MODIFIED Requirements

### Requirement: MCTS bot

"MCTS" SHALL run Monte Carlo tree search (UCT, `c = 1.41`, random playouts, 5000 iterations per
move). Each player's choices in the tree SHALL be judged from that player's own view. Won, lost
and repeated (third occurrence) positions SHALL be scored exactly. A random playout SHALL stop
after 200 plies and count as a draw. The bot SHALL play the most visited move.

#### Scenario: MCTS move
- **WHEN** MCTS has the turn and more than one legal move exists
- **THEN** it runs 5000 iterations and plays the most visited root move

#### Scenario: Immediate win
- **WHEN** one of MCTS's moves wins the game at once
- **THEN** it plays that move
