# mills-bots Specification

## Purpose

The computer players of the Mills game and how they run. The goal is the strongest possible
bot; thinking time per move is open and is chosen from benchmark results.

## Requirements

### Requirement: Bot options per player

Each player SHALL have a bot option, cycled with that player's button, which shows the option
text. The existing options and their texts SHALL stay. New options MAY be added to the cycle.
Current list (`OPTIONS` in `sketch.js`): Manual, Random, Minmax 1, Minmax 4, Minmax 6,
Iterative 0.5s, Iterative 1s, Iterative 3s, Iterative 5s, Iterative 10s, Iterative D 4,
Iterative D 6, MCTS. Defaults: Light wood = Iterative 3s, Dark wood = Manual.

#### Scenario: Toggle a player
- **WHEN** the user presses a player's button
- **THEN** that player switches to the next option, and if it is now their turn and the option is a bot, the bot starts thinking

### Requirement: Bots run off the main thread

Bot searches SHALL run in a Web Worker (`workers/WorkerHelpers.js`, which loads
`MinmaxWorker.js` and `MCTSWorker.js`) so the UI keeps animating. The game SHALL send the
position and options (`findMove`, `suggestion`, `randomGameStage`, `multiLookup`). The worker
SHALL reply with the move and move data. A running search SHALL be cancelled when the game
restarts or a player's option changes (currently by terminating and recreating the worker).

#### Scenario: Restart while a bot thinks
- **WHEN** the user restarts during a bot search
- **THEN** the old search result is never played in the new game

#### Scenario: Minimum pace
- **WHEN** a bot finds a move faster than its delay setting
- **THEN** the reply is held back to 500 ms so the move can be followed (unless no-delay is on, key `e`)

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

The search SHALL know the threefold repetition rule: a position after a completed turn that
would occur for the third time, counting the game so far and the moves searched on the way to
it, SHALL be scored as a draw, unless it is won or lost.

#### Scenario: Only one legal move
- **WHEN** the player has exactly one legal move
- **THEN** it is played without searching

#### Scenario: Same score with fewer positions
- **WHEN** a fixed-depth minimax bot searches a position with and without reuse
- **THEN** the chosen move's score is the same, and the search with reuse visits no more leaf positions in total over the benchmark's test positions

#### Scenario: Time-limited search goes deeper
- **WHEN** a time-limited bot searches the benchmark's test positions with reuse
- **THEN** its median depth reached is higher than without reuse, on the same machine

#### Scenario: Avoiding a draw when ahead
- **WHEN** the bot's best move would repeat a position for the third time and the bot has another move it scores better than a draw
- **THEN** it plays that other move

#### Scenario: Taking a draw when behind
- **WHEN** every move scores worse than a draw except one that repeats a position for the third time
- **THEN** the bot plays the repeating move

### Requirement: Board evaluation

Minimax leaves SHALL be scored as own score minus opponent score, from per-stage features:
mobility, mills, almost-mills, safe open mills, double mills, blocks, chips taken, the new-mill
bonus and a flying threat. Every feature's weight SHALL come from one named weight set. The
game SHALL always use the built-in default weight set. A search MAY be given another weight set
in its move options; any weight it does not name keeps its default.

Chips taken SHALL count in every stage, the placing stage included, with its own placing-stage
weight. A leaf scored from the per-search leaf cache SHALL get the same value as a fresh
evaluation of the same position: both players' new mills count. A player who can fly SHALL
score each mill line holding two of its own chips and one empty point as a threat.

The weight set `v0` SHALL reproduce the 2021 evaluation exactly. With it, fixed-depth searches
SHALL decide as before, down to scores and random draws. The default weight set SHALL replace
`v0` only after it beats `v0` head-to-head in the benchmark (see design).

#### Scenario: Debug breakdown
- **WHEN** the user presses `d`
- **THEN** the worker logs where the current position's score comes from

#### Scenario: Old evaluation reproduced
- **WHEN** the golden fixture's fixed-depth searches run with the weight set `v0`
- **THEN** every move, score, counter and random draw matches the fixture

#### Scenario: Chip taken while placing
- **WHEN** two placing-stage positions differ only in that the opponent has one chip fewer (taken by the player), and the placing-stage material weight is above zero
- **THEN** the position with the taken chip scores higher for the player

#### Scenario: Cached leaf equals fresh leaf
- **WHEN** a position whose leaf value is already cached is reached again in the same search, with new mills for both players
- **THEN** the value used equals a fresh evaluation of that position

#### Scenario: Weights from the move options
- **WHEN** a search is given a weight set that names only some weights
- **THEN** those weights are used, every other weight keeps its default, and the next search without a weight set uses the defaults again

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

### Requirement: Random bot and suggestions

"Random" SHALL play a random legal move. The Suggestion button (key `s`) SHALL highlight the
move that the "Iterative 3s" bot would play for a human player.

#### Scenario: Suggestion
- **WHEN** a human player presses Suggestion
- **THEN** the suggested point(s) are highlighted on the board and nothing is moved

### Requirement: Developer tools

Keyboard shortcuts SHALL stay available: `h` help, `r` restart, `e` no delay, `t` send data to
the backend (localhost:3001), `s` suggestion, `d` debug, `m` mute, `a` autoplay, `p` random game
state, `o` auto multi-lookup, `1`/`2` toggle light/dark player. The backend data collection
stays as it is.

#### Scenario: Bot-vs-bot autoplay
- **WHEN** both players are bots
- **THEN** "AUTOPLAY" is shown and a new game starts automatically 500 ms after a game ends
