# Project instructions

## Mills (personalsite/public/Mills)

- **Hard rule: the Mills UI must not change visually.** Layout, images, colours, fonts, sizes,
  animations, sounds and all on-screen texts stay exactly as they are. UI code may be refactored
  internally only if the rendered result stays identical. If a change seems to need a visual
  change, stop and ask the user.
- Mills logic stays in this project; it is not moved into a shared game kit.
- Work goes through OpenSpec (`openspec/`). Bot changes are measured against the recorded
  benchmark baseline before and after.
- Overview of the code: `personalsite/public/Mills/OVERVIEW.md`.
