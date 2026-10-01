# Jukkakot.github.io

Front page linking to my browser games: https://jukkakot.github.io

Plain HTML and CSS, no build step. Served by GitHub Pages from the root of `master`.
The older games (Battleship, Connectfour, Mills, MineSweeper) live in this repo; the newer
ones are served by their own repositories' Pages sites.

New games add and refresh their own card with `npm run homepage-card` (game-kit template,
`tools/homepage/card.mjs`): a screenshot in `images/<name>.jpg` and an `<a class="card" data-game="<name>">`
in `index.html`. A card marked "Tulossa" (`.soon`) links to the repo until the game is deployed.
