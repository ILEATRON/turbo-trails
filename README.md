# Turbo Trails 3D

A lightweight 3D browser kart racer with a perspective chase camera, three tracks, drifting, power-ups and online room-code multiplayer for up to six players. No runtime dependencies or downloaded art. Designed for modest laptops and Chromebooks.

## Play

- WASD / arrow keys: drive and brake.
- Shift while steering: charge a drift, then release for a boost.
- Space: use Boost, Shield or Pulse.
- P / Escape: pause solo races. Online races continue if you switch tabs or pause.
- Touch buttons are available on touch devices.

Select Race Solo to race five computer opponents. For multiplayer, enter a name and choose Create room. Friends open the same website, enter the six-character room code and choose Join. The host starts when everyone is ready; AI fills empty slots. Online races use Normal difficulty and distinct kart colors. Race standings include time penalties and remain provisional until all racers finish (or the ten-minute race limit).

## Off-track penalties

Grass cuts maximum speed to 60 simulation units (about 42 displayed km/h), removes boost and stops drift charging. Staying off-road for 2.5 seconds or straying more than 110 units from the track center resets the kart to its last valid on-road position with a three-second time penalty. Shortcuts cannot advance the saved checkpoint. The server calculates all online movement, items, checkpoints and penalties; clients only send controls.

## Run locally

Node 18 or newer:

```
npm start
```

Open http://localhost:3000. Multiple browser tabs or devices on the same LAN can join the same room using the server's address. Run `npm test` for physics and actual HTTP multiplayer tests. `npm run build` creates a static solo-play build in `dist`.

## Render — multiplayer requires a Web Service

The old Static Site can run solo mode but cannot host multiplayer. Deploy this repository as a **Web Service**, using the Free instance:

| Setting | Value |
| --- | --- |
| Branch | main |
| Runtime | Node |
| Build command | node build.cjs |
| Start command | node server.cjs |
| Health check | /health |

No secrets or environment variables are needed. The server honors Render's PORT variable. `render.yaml` defines the same Free web service for Blueprint deployment. Share the new Web Service URL with friends.

Free Render services sleep after inactivity and can take about a minute to wake. Rooms are held in memory on a single server instance and expire after two hours; restarts or redeploys clear them. Disconnected racers become AI after 30 seconds; host ownership passes to another connected player. Create a new room to race again. This is casual multiplayer, with server-authoritative controls and HTTP state synchronization; latency depends on the connection. Physical Chromebook performance has not been measured.

## Implementation

`sim.js`: shared track geometry and physics. `game.js`: clipped, depth-sorted world-space 3D polygons, camera and UI. `server.cjs`: room server and static files. No external libraries, paid assets, Nintendo branding, characters or music.
