# Proposal

## Why

On the user's Android phone (Samsung Internet) the games page's home-screen icon "Pelit" carries a small globe
badge: it is a browser shortcut, not an installed web app, so every tap opens a new browser tab (user
2026-10-15). The page has a manifest but no service worker, which Samsung Internet needs before it offers to
install a page as an app.

## What Changes

- A small service worker (`sw.js` at the root) with a fetch handler that passes the page's own requests to the
  network (no offline cache), registered from `index.html`.
- The manifest gets `id`, `scope` and `launch_handler` (focus an open window instead of opening a new one).
- No change to the page's look or to any game. No visual effect on the Mills UI: Mills files are not touched,
  and the service worker leaves requests outside the page's own files alone.

## Capabilities

### New Capabilities

- `games-hub`: the games page at the site root, installable as a web app.

### Modified Capabilities

None.

## Impact

`index.html`, `manifest.webmanifest`, new `sw.js`. The user re-adds the page to the home screen once.
