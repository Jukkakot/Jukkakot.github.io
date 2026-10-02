# Spec Delta

## ADDED Requirements

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
