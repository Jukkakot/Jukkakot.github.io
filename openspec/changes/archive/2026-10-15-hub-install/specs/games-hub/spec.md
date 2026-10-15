## ADDED Requirements

### Requirement: Installable games page
The games page at the site root SHALL be installable as a web app on Android browsers (Chrome and Samsung
Internet): it SHALL have a manifest with an id, a scope of the whole site, standalone display and icons, and a
service worker controlling the page. The service worker SHALL NOT change what the page or any game shows and
SHALL leave requests outside the page's own files to the browser. An opened installed app SHALL bring its open
window forward instead of opening another, where the browser supports it.

#### Scenario: Install instead of a shortcut
- **WHEN** the user adds the page to the home screen in Samsung Internet
- **THEN** it is offered as an app to install, and the home-screen icon has no browser badge

#### Scenario: Reopen
- **WHEN** the installed app is open and the user taps its home-screen icon again
- **THEN** the open window comes forward, no new browser tab opens

#### Scenario: Games unchanged
- **WHEN** the user opens any game from the page
- **THEN** the game loads and looks exactly as before
