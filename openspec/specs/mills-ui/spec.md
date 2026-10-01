# mills-ui Specification

## Purpose

The look and controls of the Mills game. **The UI is frozen.** This is the user's absolute rule
for a project that matters a lot to them.

## Requirements

### Requirement: Visual freeze

The rendered UI SHALL stay visually identical: layout, board drawing, chip and button images,
colours, fonts (Holtwood One SC), sizes, animations (chip easing, moving and eating animations),
cursors, sounds and all on-screen texts ("<name> won!", "<name> turn", "Place a chip", "Mill!",
"AUTOPLAY", button texts). UI code MAY be refactored internally only if the result looks the same.
Any change that would alter the look SHALL be approved by the user first.

#### Scenario: Refactoring UI code
- **WHEN** a change touches `sketch.js`, `classes/*` or `style.css`
- **THEN** the game looks and sounds the same before and after, in the same states

#### Scenario: Approved exception: draw
- **WHEN** a draw rule is added (see mills-rules)
- **THEN** the draw is announced in exactly the same style and place as the win text; this is the only approved visual addition

#### Scenario: Approved exception: new bot options
- **WHEN** a bot option is added
- **THEN** it appears only as a new text in the existing player button cycle

### Requirement: Controls

The game SHALL offer the buttons Restart, Suggestion, Autoplay, Generate gamestate, a sound
toggle, and one bot-option button per player. Chips are placed by clicking/tapping, and moved by
dragging or by clicking a chip and then a target. Touch input SHALL work on mobile without
double taps or text selection on buttons.

#### Scenario: Human move during a bot's turn
- **WHEN** it is a bot's turn or the game is over
- **THEN** clicks on the board do nothing

### Requirement: Static hosting, no build step

The game SHALL run as static files from `Mills/` (served by the games
site on GitHub Pages), with p5.js 0.9 and axios loaded from CDNs and plain `<script>` tags.

#### Scenario: Open the page
- **WHEN** `Mills/index.html` is opened from the deployed site
- **THEN** the game starts with no build or server-side code
