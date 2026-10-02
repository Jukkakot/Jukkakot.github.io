# Spec Delta

## MODIFIED Requirements

### Requirement: Visual freeze

The rendered UI SHALL stay visually identical: layout, board drawing, chip and button images,
colours, fonts (Holtwood One SC), sizes, animations (chip easing, moving and eating animations),
cursors, sounds and all on-screen texts ("<name> won!", "Draw!", "<name> turn", "Place a chip",
"Mill!", "AUTOPLAY", button texts). UI code MAY be refactored internally only if the result looks the same.
Any change that would alter the look SHALL be approved by the user first.

#### Scenario: Refactoring UI code
- **WHEN** a change touches `sketch.js`, `classes/*` or `style.css`
- **THEN** the game looks and sounds the same before and after, in the same states

#### Scenario: Approved exception: draw
- **WHEN** a draw rule is added (see mills-rules)
- **THEN** the draw is announced as "Draw!" in exactly the same place, font, size and fill as the win text, outlined in the Dark wood colour; this is the only approved visual addition

#### Scenario: Approved exception: new bot options
- **WHEN** a bot option is added
- **THEN** it appears only as a new text in the existing player button cycle
