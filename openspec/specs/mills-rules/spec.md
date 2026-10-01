# mills-rules Specification

## Purpose

The rules of Nine Men's Morris as the Mills game plays them. The rules are implemented twice:
in the UI classes (`classes/Game.js`, `classes/Player.js`) for the real game, and in the worker
(`workers/WorkerHelpers.js`) on a 24-char string board for the bots. Both must agree.

## Requirements

### Requirement: Board and pieces

The board SHALL have 24 points on three square rings (8 points each). Points along each ring are
adjacent. The middle points of the sides (odd indices) also connect to the same point on the
neighbouring ring. Each player SHALL have 9 chips. The players are "Light wood" and "Dark wood",
and Light wood moves first.

#### Scenario: Worker board encoding
- **WHEN** a position is sent to the worker
- **THEN** it is a 24-char string with index `ring * 8 + i`, `'0'` for empty and the player's char otherwise

### Requirement: Game stages

Each player SHALL be in one of three stages, independent of the opponent:
1 placing (chips left to place), 2 moving (all placed, more than 3 chips), 3 flying (all placed,
exactly 3 chips).

#### Scenario: Placing
- **WHEN** a player in stage 1 has the turn
- **THEN** they place one chip on any empty point

#### Scenario: Moving
- **WHEN** a player in stage 2 has the turn
- **THEN** they move one own chip to an adjacent empty point

#### Scenario: Flying
- **WHEN** a player in stage 3 has the turn
- **THEN** they move one own chip to any empty point

### Requirement: Mills and removing chips

Three own chips on a line (one of the 16 mill lines) SHALL form a mill. Forming a new mill SHALL
let the same player remove exactly one opponent chip before the turn passes, even if the move
formed two mills at once. A chip that is in a mill SHALL NOT be removed unless all of the
opponent's chips are in mills.

#### Scenario: New mill
- **WHEN** a player's move forms a new mill
- **THEN** the game enters eat mode ("Mill!") and the same player removes one opponent chip

#### Scenario: Protected chips
- **WHEN** the opponent has chips both in and outside mills
- **THEN** only chips outside mills can be removed

#### Scenario: Double mill
- **WHEN** one move forms two mills
- **THEN** only one chip is removed

### Requirement: Winning

A player SHALL lose when, on their turn, they have fewer than 3 chips (on the board plus still
to place) or, in stage 2, no legal move.

#### Scenario: Down to two chips
- **WHEN** a player's chips drop to 2
- **THEN** the opponent wins and "<name> won!" is shown

#### Scenario: Blocked
- **WHEN** a player in stage 2 has no chip with an empty adjacent point
- **THEN** the opponent wins

### Requirement: No draws (current state)

The game currently SHALL NOT end in a draw. Games can go on without end. (Agreed future change:
WMD threefold repetition. The same position with the same player to move for the third time
ends the game automatically as a draw, shown in the same style as the win text.)

#### Scenario: Repeating positions
- **WHEN** the same position keeps repeating
- **THEN** the game continues
