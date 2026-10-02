## MODIFIED Requirements

### Requirement: Bot names and budgets

Bots SHALL be named by kind plus a budget, in the game kit's notation: `random`,
`minimax@d<n>` (fixed depth n), `iterative@d<n>` (iterative deepening to depth n),
`iterative@<n>ms` (iterative deepening with a time limit), `mcts@i<n>` (MCTS with n iterations).
Each in-game bot option SHALL have a benchmark name: Random = `random`, Minmax 1/4/6 =
`minimax@d1/d4/d6`, Iterative 0.5s/1s/3s/5s/10s = `iterative@500ms/1000ms/3000ms/5000ms/10000ms`,
Iterative D 4/D 6 = `iterative@d4/d6`, MCTS = `mcts@i5000`. A budget the current code cannot
honour (for example MCTS iterations other than 5000) SHALL be refused with a message, not
silently changed.

A minimax or iterative bot name MAY end in `:<set>` (for example `minimax@d4:v0`). The bot then
searches with the evaluation weight set stored as `<set>` in the benchmark's weights folder, and
the name keeps the suffix in every report. A missing set, or a set naming a weight the bot code
does not have, SHALL be refused before playing. `random` and `mcts` SHALL refuse a suffix.

#### Scenario: Unknown or unsupported bot
- **WHEN** a run names `mcts@i800` while MCTS only supports 5000 iterations
- **THEN** the run stops before playing and says which bots and budgets are supported

#### Scenario: Old and new evaluation head-to-head
- **WHEN** a strength run names `minimax@d4` and `minimax@d4:v0`
- **THEN** both play as separate bots in one round robin, the first with the default weights and the second with the `v0` weights

#### Scenario: Unknown weight set
- **WHEN** a run names `minimax@d4:nosuch` and no such weight set exists
- **THEN** the run stops before playing and names the missing set

## ADDED Requirements

### Requirement: Tune mode

A tune mode SHALL search the evaluation weights by self-play. It starts from a named weight set
and plays a fixed-depth minimax bot against itself with two slightly different weight sets
(SPSA). After every batch of games it moves the weights toward the side that scored better.
The run SHALL take a depth, an iteration count, a first seed, a move cap and a job count. With
the same arguments and job count it SHALL give the same weights. It SHALL print progress and
write the current weights and a history to a git-ignored output after every batch, so a run
that stops can continue with `--resume`. Only weights listed as tunable SHALL change, each
within its own allowed range. The result SHALL be saved as a new weight set only on request
(`--save <set>`).

#### Scenario: Repeatable tuning
- **WHEN** the same short tune run is started twice with the same arguments and job count
- **THEN** both runs end with the same weights

#### Scenario: Resume after a stop
- **WHEN** a tune run is stopped after some batches and started again with `--resume`
- **THEN** it continues from the last written batch and ends with the same weights as an unbroken run

#### Scenario: Weights stay in range
- **WHEN** a tune run finishes
- **THEN** every weight is an integer within its allowed range, and weights not listed as tunable are unchanged
