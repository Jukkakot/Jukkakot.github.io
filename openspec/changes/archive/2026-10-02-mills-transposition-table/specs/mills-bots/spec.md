# Spec Delta

## MODIFIED Requirements

### Requirement: Minimax bots

"Minmax N" SHALL search with alpha-beta to depth N. "Iterative <time>" SHALL deepen one ply at
a time until the time runs out (max depth 15) and use the last fully searched depth.
"Iterative D N" SHALL deepen up to depth N. Removing a chip after a mill SHALL be searched as an
extra ply by the same player without using up depth. Wins SHALL score higher the sooner they come.
Equal-score moves SHALL be chosen randomly, so bot-vs-bot games vary.

Within one move's search, a position reached again by another move order SHALL reuse what was
learned about it: its score when it was already searched to the same remaining depth, and its
best move as the first move to try otherwise. This SHALL NOT change the score of the chosen
move: a fixed-depth search SHALL give the same score as a search without this reuse. Nothing
SHALL be reused from one move's search to the next.

#### Scenario: Only one legal move
- **WHEN** the player has exactly one legal move
- **THEN** it is played without searching

#### Scenario: Same score with fewer positions
- **WHEN** a fixed-depth minimax bot searches a position with and without reuse
- **THEN** the chosen move's score is the same, and the search with reuse visits no more leaf positions in total over the benchmark's test positions

#### Scenario: Time-limited search goes deeper
- **WHEN** a time-limited bot searches the benchmark's test positions with reuse
- **THEN** its median depth reached is higher than without reuse, on the same machine
