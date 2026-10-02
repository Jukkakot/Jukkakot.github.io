# mills-benchmark Specification

## Purpose
A headless benchmark that measures how strong and how fast the Mills bots are, with repeatable
runs and a recorded baseline that every later bot change is compared against.

## Requirements

### Requirement: Same bot code as the game

The benchmark SHALL run the bot code the game page loads, unchanged, without a browser. It SHALL
NOT need a build step or third-party packages; Node 22 is enough. Running it SHALL NOT change any
file the game page loads.

#### Scenario: Bot code changes reach the benchmark
- **WHEN** a bot's search or evaluation code is edited
- **THEN** the next benchmark run measures the edited code without any change to the benchmark

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

### Requirement: Referee follows the game's rules

The benchmark SHALL play complete games with the game's rules: 9 chips each, placing, then
moving to a neighbour, flying with 3 chips, removing a chip after a new mill (not from a mill
unless all the opponent's chips are in mills), and a loss when a player has fewer than 3 chips
or cannot move. Turn and mill bookkeeping SHALL match the game, so the bots see the same
positions they would see in the browser. A move that is not legal SHALL lose the game for the
bot that made it, and the report SHALL count such moves.

#### Scenario: Win by reducing to two chips
- **WHEN** a player removes a chip and the opponent is left with 2 chips
- **THEN** the game ends and the remover wins

#### Scenario: Win by blocking
- **WHEN** after a move the player to move in the moving stage has no legal move
- **THEN** the game ends and that player loses

#### Scenario: Illegal move
- **WHEN** a bot returns a move that is not legal in the position
- **THEN** that bot loses the game and the report lists the illegal move

### Requirement: Move cap

A game SHALL end as "capped" when it reaches the move cap without a winner (default 200 turns
per player, configurable). A capped game SHALL count as a draw in the standings, and the report
SHALL show how many games were capped.

#### Scenario: Endless shuffling
- **WHEN** two bots move back and forth without either winning until the cap
- **THEN** the game ends as capped and counts half a point to each

### Requirement: Repeatable runs

All randomness the bots and the benchmark use SHALL come from a seeded source. With the same
seed, bots and depth or iteration budgets, a run SHALL give the same games and results on any
machine and with any number of parallel jobs. Time-limited bots are not repeatable; a report
that includes one SHALL say so.

#### Scenario: Same seed twice
- **WHEN** the same strength run with depth and iteration budgets is started twice, once with 1 job and once with 4
- **THEN** both runs report identical games and standings

### Requirement: Strength mode

The strength mode SHALL play a round robin between the named bots: every two bots play the same
even number of games, each seed once with each bot as Light (Light moves first, as in the game).
The report SHALL show, per bot, its Elo rating (Bradley–Terry, draws as half points, `random`
anchored at 1000 when it plays), and per pairing the score share with a 95 % interval, wins,
losses, capped games and average game length. It SHALL also show the setup: bots, games per
pairing, first seed, move cap, job count and code version (git commit).

#### Scenario: Round robin report
- **WHEN** a strength run is started for `random`, `minimax@d1` and `minimax@d4` with 20 games per pairing
- **THEN** 60 games are played and the report lists three ratings and three pairings with their shares and intervals

### Requirement: Speed mode

The speed mode SHALL run each named bot once on every position of a fixed, committed set of test
positions covering placing, moving, flying and eat-mode positions. The report SHALL show per bot
and per stage: median, mean and maximum time per move, searched leaf positions per move, and for
time-limited bots the depth reached. The positions SHALL stay fixed across runs so before/after
numbers are comparable.

#### Scenario: Speed report
- **WHEN** a speed run is started for `minimax@d4` and `iterative@1000ms`
- **THEN** the report shows for each stage the time and leaf counts of both bots, and the depth reached by `iterative@1000ms`

### Requirement: Reports and recorded baseline

Each run SHALL print a Markdown report and write a JSON file with every game or position result
to a folder that git ignores. That folder SHALL keep only the 10 latest runs; older ones are
removed automatically. A run SHALL be kept permanently only when asked by name (`--save <name>`),
which stores its JSON, Markdown and HTML report in a committed folder under that name. The
baseline, the strength and speed reports of the bots as they were before any bot change, SHALL
be saved this way with the exact commands that produced it, so later changes can re-run them and
compare.

#### Scenario: Results do not pile up
- **WHEN** a twelfth run finishes without `--save`
- **THEN** the git-ignored results folder holds the 10 latest runs and no committed file changes

#### Scenario: Saving a run
- **WHEN** a run is started with `--save baseline`
- **THEN** its JSON, Markdown and HTML reports are stored in the committed reports folder under `baseline`

### Requirement: Visual report

Each run SHALL also produce a self-contained HTML page (no network, no dependencies) unless
switched off with `--no-html`; any earlier run's JSON SHALL be renderable into the page later.
The page SHALL follow the system's light or dark setting. A strength run SHALL show: an Elo
ladder with intervals, a head-to-head matrix of score shares, outcome bars per pairing (wins,
losses, capped; how games ended) and strength against the median thinking time per move
measured during the tournament. A speed run SHALL show time per move per game stage for each bot
and the depth reached by time-limited bots.

#### Scenario: Turning the page off
- **WHEN** a run is started with `--no-html`
- **THEN** only the Markdown and JSON are written

#### Scenario: Rendering later
- **WHEN** the report command is given a run's JSON file
- **THEN** it writes that run's HTML page without playing any games

### Requirement: Comparison with a saved run

A run started with `--compare <name>` SHALL compare itself with that saved run, in the Markdown
and the HTML page: per bot the Elo change, and per bot and stage the speed ratio (for example
"3.2× faster"), counting only bots, seeds, positions and budgets both runs share. Differences in
setup SHALL be listed instead of compared.

#### Scenario: Before and after a speed change
- **WHEN** a speed run of `minimax@d4` is started with `--compare baseline`
- **THEN** the report shows the ratio of its median times to the baseline's per stage

#### Scenario: Comparing a bot change
- **WHEN** a later change re-runs the baseline commands
- **THEN** its reports can be put side by side with the recorded baseline (same bots, seeds, positions and budgets)

### Requirement: Identical-games check

A strength run compared with a saved run (`--compare <name>`) SHALL report, for the games both
runs share (same pairing, seed and sides), how many are identical: same winner, same ending,
same number of plies and the same number of searched leaves for each bot. The Markdown and the
HTML report SHALL show the count and list the first differing games. Games with a time-limited
bot SHALL be left out of the check and counted separately, since they are not repeatable.

#### Scenario: A pure speed change
- **WHEN** a change only makes the bot code faster and the baseline strength command is re-run with `--compare baseline`
- **THEN** the report says all shared games are identical

#### Scenario: A behaviour change slips in
- **WHEN** a change alters which move a fixed-depth bot picks in one game
- **THEN** the report shows fewer identical games than shared games and names the differing game with its pairing and seed

### Requirement: Repetition draws

The referee SHALL apply the game's threefold repetition rule. A game ending this way SHALL count
as a draw (half a point each), like a capped game, and the report SHALL show repetition draws
and capped games separately per pairing.

#### Scenario: Bots shuffling
- **WHEN** two bots repeat the same position with the same player to move for the third time before the cap
- **THEN** the game ends as a draw with the ending "repetition"

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
