# Spec Delta

## ADDED Requirements

### Requirement: Repetition draws

The referee SHALL apply the game's threefold repetition rule. A game ending this way SHALL count
as a draw (half a point each), like a capped game, and the report SHALL show repetition draws
and capped games separately per pairing.

#### Scenario: Bots shuffling
- **WHEN** two bots repeat the same position with the same player to move for the third time before the cap
- **THEN** the game ends as a draw with the ending "repetition"
