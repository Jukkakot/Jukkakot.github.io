# Spec Delta

## ADDED Requirements

### Requirement: Draw by threefold repetition

After every completed turn, the game SHALL count the position: the board, the player to move and
the chips both players still have to place. When the same position occurs for the third time,
the game SHALL end as a draw. A position in the middle of a turn (while the mover removes a chip
after a mill) SHALL NOT be counted. If the same turn change also ends the game by a win or loss,
the win or loss SHALL stand. Jumping to a generated game state SHALL start a new count.

#### Scenario: Shuffling back and forth
- **WHEN** both players move a chip back and forth so that the same position with the same player to move occurs a third time
- **THEN** the game ends as a draw and "Draw!" is shown

#### Scenario: Second occurrence
- **WHEN** a position occurs for the second time
- **THEN** the game continues

#### Scenario: Same board, other player to move
- **WHEN** the board is the same as before but the other player is to move
- **THEN** it counts as a different position

## REMOVED Requirements

### Requirement: No draws (current state)
**Reason**: replaced by the agreed WMD threefold repetition rule.
**Migration**: none; games that repeated forever now end as a draw.
