## MODIFIED Requirements

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
