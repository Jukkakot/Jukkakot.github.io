## MODIFIED Requirements

### Requirement: Bot names and budgets

Bots SHALL be named by kind plus a budget, in the game kit's notation: `random`,
`minimax@d<n>` (fixed depth n), `iterative@d<n>` (iterative deepening to depth n),
`iterative@<n>ms` (iterative deepening with a time limit), `mcts@i<n>` (MCTS with n iterations,
any n from 1 to 1 000 000). Each in-game bot option SHALL have a benchmark name: Random =
`random`, Minmax 1/4/6 = `minimax@d1/d4/d6`, Iterative 0.5s/1s/3s/5s/10s =
`iterative@500ms/1000ms/3000ms/5000ms/10000ms`, Iterative D 4/D 6 = `iterative@d4/d6`, MCTS =
`mcts@i61000` (the in-game iteration count). A budget the current code cannot honour SHALL be
refused with a message, not silently changed.

A minimax or iterative bot name MAY end in `:<set>` (for example `minimax@d4:v0`). The bot then
searches with the evaluation weight set stored as `<set>` in the benchmark's weights folder, and
the name keeps the suffix in every report. A missing set, or a set naming a weight the bot code
does not have, SHALL be refused before playing.

An MCTS bot name MAY end in a playout suffix: `:random`, `:heur`, `:cut<k>` (random moves, cutoff
after k plies) or `:heurcut<k>` (heuristic moves, cutoff after k plies), k from 1 to 200; a cutoff suffix MAY end in `s<scale>` (for example `:cut12s1000`)
to set the scale that maps the evaluation to a reward. Without
a suffix the bot uses the in-game playout method. The name keeps the suffix in every report. Any
other suffix SHALL be refused before playing. `random` SHALL refuse a suffix.

#### Scenario: Unknown or unsupported bot
- **WHEN** a run names `mcts@i0` or `minimax@d99`
- **THEN** the run stops before playing and says which bots and budgets are supported

#### Scenario: Old and new evaluation head-to-head
- **WHEN** a strength run names `minimax@d4` and `minimax@d4:v0`
- **THEN** both play as separate bots in one round robin, the first with the default weights and the second with the `v0` weights

#### Scenario: Unknown weight set
- **WHEN** a run names `minimax@d4:nosuch` and no such weight set exists
- **THEN** the run stops before playing and names the missing set

#### Scenario: MCTS playout variants head-to-head
- **WHEN** a strength run names `mcts@i5000:random` and `mcts@i2000:heurcut12`
- **THEN** both play as separate MCTS bots, the first with random playouts and 5000 iterations, the second with heuristic playouts cut off after 12 plies and 2000 iterations

#### Scenario: Unknown playout suffix
- **WHEN** a run names `mcts@i5000:fast`
- **THEN** the run stops before playing and lists the supported playout suffixes
