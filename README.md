# Turbo Trails

An original, top-down arcade kart racer built for the browser. Six racers, three circuits, three difficulty levels, drift boosts, boost pads, and collectible Boost, Shield, and Pulse items. No external libraries, downloads, accounts, or paid assets. Single-player against five computer racers.

## Play

Open `index.html` in Chrome, or run `npm start` and visit http://localhost:3000. Use WASD or arrow keys to accelerate, brake, and steer. Hold Shift while turning at speed for at least one second, then release for a drift boost. Press Space to use an item, P or Escape to pause. Touch controls are included. Sound is optional. Best race times are saved on your device when browser storage is available.

Stay on the circuit: grass slows your kart, and off-track shortcuts do not earn race progress. Cross the start line after three complete laps to finish. Pulse slows the closest rival ahead within range; Shield protects against collision slowdown for six seconds.

## Deploy on Render

Create a **Static Site**, connect this repository, and use:

| Setting | Value |
| --- | --- |
| Branch | `main` |
| Build command | `npm run build` |
| Publish directory | `dist` |

No environment variables are required. `render.yaml` is also included for Blueprint deployment. For a Node Web Service instead, use `npm start`; the server respects Render's `PORT` environment variable.

## Development

Requires Node 18+ for the optional local server, build and tests. Run `npm test` for simulation checks. The game itself only needs a modern browser. Canvas rendering uses a fixed 1200×760 internal resolution to limit work on modest hardware. It has been browser-tested, but performance on a physical Chromebook has not been measured.

All game art is drawn with Canvas. No Nintendo characters, branding, music, or assets are included.
