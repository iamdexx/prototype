# Ape Studio Metaverse

A cross-platform WebXR "metaverse studio" prototype (Spatial.io-like) that runs
in the Quest browser (VR), on PC (mouse/keyboard/gamepad) and on mobile
(touch) — and works as an ApeChain dApp.

## Stack

Vite + React 18 + TypeScript · three / @react-three/fiber / @react-three/drei /
@react-three/xr v6 · zustand · peerjs (public PeerJS cloud broker) ·
wagmi + viem + @tanstack/react-query · ESLint flat config.

## Run

```bash
npm i
npm run dev -- --host
```

The dev server serves **HTTPS** (`@vitejs/plugin-basic-ssl`) — WebXR,
microphone and screen capture all require a secure context, so accept the
self-signed certificate warning on each device. Open
`https://<lan-ip>:5173/?room=myroom` on every device that should join the same
room (the `?room=` param picks the room; default is `lobby`).

```bash
npm run build   # typecheck + bundle
npm run lint    # eslint (typescript-eslint flat config)
```

## Features

- **Two separate environments** — a **recording studio** (24m x 6m x 16m) and
  a **DJ club** (26m x 7m x 18m) in a dark, minimal, architectural style with
  real Poly Haven CC0 textures. Each zone has a 3m x 8m black hallway ending
  in a glowing **portal ring**: walk into it and the screen fades to black,
  the other zone loads, and you spawn just outside its portal. Peers,
  avatars, panels and audio are all filtered per-zone (you only see/hear
  people in your environment). Append `?zone=club` to spawn in the club
  (default is the studio).
  - **Recording studio** — charcoal fabric acoustic walls framed by brushed
    metal, dark wood floor, amber light cove, mixing desk + monitors, a glass
    wall into a lit "live room" behind the desk, a big +z window overlooking
    sky and ocean, a glass **soundproof vocal booth**, and black/chrome
    lounge + gear props. Single accent: warm amber `#ffb454`.
  - **DJ club** — near-black polished concrete, dark plaster walls, chrome PA
    stacks + truss, a monochrome-blue pulsing LED dance floor, a blue/white
    waveform LED wall, a bar, a lounge with a chrome ring sculpture, and a
    wide opening behind the stage framing the night sky/ocean. Single
    accent: royal blue `#1f3bff`.
  - Bloom/vignette post-processing on capable devices — append `?fx=0` to
    disable it (also auto-disabled in XR sessions and on very low-end
    devices). Player movement is clamped to the zone's room + hallway.
- **Vocal booth audio isolation** — when you are inside the booth, all remote
  audio from outside is low-pass filtered + attenuated, and vice versa
  (per-source `BiquadFilterNode`, evaluated each frame).
- **Multiplayer** — PeerJS full mesh. The first peer in a room claims the
  deterministic id `ape-studio-<room>-host` and relays the peer list so late
  joiners form a mesh (fine for ~8 people). State is broadcast at 15 Hz:
  position, yaw, head pose, 25-joint x 2-hand hand-tracking data, mic-derived
  mouth openness, display name and short wallet address. Mic + screen streams
  are WebRTC media calls.
- **Avatars** — capsule body, sphere head, eyes, and a mouth that scales with
  the speaker's actual mic level (AnalyserNode RMS, smoothed). Nametag above
  the head. When a peer is hand-tracked, 25 joint spheres per hand are
  rendered from the streamed joint data.
- **Spatial audio** — every remote mic/screen stream runs through
  `MediaStreamSource -> booth BiquadFilter -> per-source Gain -> PannerNode
  (HRTF, inverse distance, ref 1m, max 25m, rolloff 1.5) -> master Gain`.
  The Audio settings drawer toggles spatial/non-spatial, falloff distance,
  rolloff, master volume and per-source volume.
- **Screenshare panels** — `getDisplayMedia({video,audio})` on PC/mobile.
  Panels are floating grabbable planes (drag to move, scroll wheel to scale;
  VR rays/pointers work through R3F pointer events) and their transform is
  synced to all peers. Panel screens are spatial audio sources located at the
  panel. **Quest note:** the Quest browser has no `getDisplayMedia` — use
  "Share cam" (camera passthrough) or "Share URL" (image/URL panel) instead.
- **DJ board** — a two-deck controller on the stage: file loading or a
  built-in synthesized loop, play/pause/cue, pitch, 3-band EQ, volume faders,
  crossfader, an FX filter knob and a 4x4 synthesized sample-pad grid
  (kick/snare/hat/clap). All controls are 3D meshes with pointer events
  (mouse, touch and VR rays/hands all hit them); a 2D HTML fallback panel is
  available from the DJ button. Deck output is mixed into your outgoing
  WebRTC audio so remote users hear it spatially.
- **Wallet / dApp** — wagmi configured for ApeChain mainnet (33139), Curtis
  testnet (33111), mainnet, base and arbitrum; injected + WalletConnect
  connectors (`VITE_WC_PROJECT_ID` env). HUD shows connect, short address,
  APE balance and a chain switcher. `src/web3/contract.ts` holds a stub ABI
  and `useProductContract` placeholder for the future product contract.

## Controls

| Platform | Move | Look | Notes |
|---|---|---|---|
| PC | WASD / arrows, Shift = sprint | Mouse (click canvas for pointer lock) | Scroll on a panel to resize |
| Gamepad (Xbox/PS) | Left stick | Right stick (turn) | A/X = interact |
| Mobile | Left on-screen joystick | Right on-screen joystick | Touch appears automatically |
| VR (Quest etc.) | Left thumbstick smooth move | Right thumbstick 45° snap turn | Hand tracking streams joint data; Enter VR/AR buttons in the top bar |

## Rooms

Share the URL — `?room=<name>` selects the room. Everyone with the same room
name ends up in the same PeerJS mesh. `?zone=<studio|club>` selects the
starting environment.

## Texture credits

World textures in `public/textures/` are CC0 assets from
[Poly Haven](https://polyhaven.com) (see `public/textures/LICENSE.md`).
Re-fetch them with `node scripts/fetch-textures.mjs`.
