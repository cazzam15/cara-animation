# Cara the Capybara: style guide

This is the house style for every *Cara the Capybara* episode. [ANIMATION_GUIDE.md](ANIMATION_GUIDE.md) holds the general
rules and the engine reference; **where the two disagree, this file wins.** Read both before drawing anything.

The audience is young children (roughly 2–6). Everything below serves three things: **warm** (Cara is kind, the world is
safe), **clear** (one thing at a time, big and slow enough to follow), and **handmade** (it looks painted, not rendered).

Model sheets: [docs/cara_poses.jpg](docs/cara_poses.jpg) (Cara's views and poses) and
[docs/dewi.jpg](docs/dewi.jpg) (Dewi the Welsh dragon). Scrub them live at `studio.html?loop=cara` and `?loop=dragon`.

---

## 1. Cara

A friendly, upright capybara, drawn to match her turnaround sheet: a big round head (wider than her body), a lighter
muzzle, a large dark nose, **two white buck teeth** (they show in every mouth shape), whiskers and big brown eyes.
Dark-brown paws and big dark-brown feet. She always wears:

- **big pink glasses**: rounded-square frames that span almost the whole width of her face, with *clear* lenses. Her
  eyes must always read through them. Children follow faces, so never tint the lenses dark.
- **a straw boater**: a wide brim, a low crown and a pink band, tilted back on her head.
- **a tartan scarf**: red with green bars and fine cream lines, wrapped round her neck, with one fringed end hanging
  down the front.
- **a pink dress**: sleeveless, with a fitted bodice, a waist seam and a gathered A-line skirt to mid-shin.

Keep her **on model**: the same shape, colours and accessories in every shot. She is never scary, sad for long, hurt, or
in danger. When she's worried it's mild and resolves quickly.

### Sizes (`u`)

She's about 6.5u wide and 12.5u tall with her hat (modelled 15 units tall and drawn at `CARA_SCALE` 0.82).

| shot | u | notes |
|---|---|---|
| wide / establishing | 16–24 | only while the place is the story; never for a whole episode |
| medium (the usual acting size) | 26–36 | |
| close-up | 45–70 | faces carry the story here |

In vertical (Shorts) framing she should fill at least a quarter of the frame height when she's acting.

### Poses (in [src/cara.js](src/cara.js))

| pose | how to get it |
|---|---|
| idle | `caraPose('idle', t)`: breathing, a slow bob and blinks |
| walk | `caraWalk(t, t0, t1, x0, x1, u)`: eased, 3/4 view, bob, arm swing and hat lag. Use its `.x` as her x |
| wave | `caraPose('wave', t)`: her screen-right arm waves, with a bend in the elbow |
| happy jump | `caraHop(t, t0, t1, h)`: crouch, arms up, squash on landing, and her hat lifts and settles |
| surprised | `caraPose('surprised', t)`: wide eyes, an "O" mouth and a "!". A gentle take, never a jolt |
| talking | `talk(t, lines)`: mouth open and shut over placeholder spans, or `talk(t, 'track')` from a real voiceover |
| also | `happy`, `curious` ("?" and a head tilt), `excited`, `talk` (body language for speaking) |

- **Change moods with `caraActs(t, keys)`**, never by swapping fields between two frames. It blinks through the change,
  plays a soft take and eases into the new pose.
- **Combine pieces with `mixPose(...)`**, which adds up `dx`, `dy`, `sq` and `rot` instead of letting the last piece win:
  `cara(x, y, u, mixPose(caraActs(t, keys), caraHop(t, 5, 5.5), talk(t, LINES), { view: 'q' }))`.
- **Views:** `front`, `q` (3/4) and `side`, all facing screen-right; `flip: true` faces left. Turn with
  `caraTurn(t, t0, t1, a0, a1)` (0 = front, .125 = 3/4, .25 = side). There is no back view yet; add one to `CARA_VIEWS`
  if a story needs it.
- **Hooks:** `armL` / `armR` draw a held prop at the paw; `draw` paints on her body.

## 2. Supporting cast

- **Dewi** ([src/dragon.js](src/dragon.js)): a small, round, red Welsh dragon with a cream tummy, soft horns, little
  wings and an arrow-tipped tail. `dragon(x, y, u, o)` with `turn`, `lookX`, `aL`/`aR`, `flap`, `wag`, `eyes`, `mouth`.
  **He never breathes fire**; he puffs soft smoke, including pink hearts (`puff(x, y, r, k, { heart: true })`).
- New characters: build them the same way (wash and ink, one outline per shape, a boil seed per part, a size unit `u`),
  give them round shapes and big friendly eyes, and add them to `sheets.js` as a model-sheet loop before using them.

## 3. Palette

Use `SOFT` (in [src/core.js](src/core.js)) for the world, `CARA` for Cara and `DEWI` for Dewi. Bright but soft: pastel
skies, fresh greens, warm creams. **No pure black or white** (`PAL.ink`, `SOFT.white`, `PAL.cream`), and no neon.

| token | hex | use |
|---|---|---|
| `SOFT.sky` / `skyDeep` | #BFE3F2 / #93CBE6 | sky, water shadows |
| `SOFT.cloud` / `sun` | #FFF8EC / #FFE08A | clouds, sunshine |
| `SOFT.grass` / `meadow` / `hillMid` / `hillFar` | #9CD37F / #7CC06E / #79B77A / #8FC2A4 | near to far greens |
| `SOFT.mountain` / `lilac` | #A9B8D6 / #C9B3E6 | distance (farther = bluer and paler) |
| `SOFT.stone` / `stoneDk` | #C4BBB0 / #978D84 | rocks, walls |
| `SOFT.path` / `earth` / `sand` | #E8D3A6 / #C9A578 / #F2DDB0 | paths, beaches |
| `SOFT.flowerY` / `flowerP` / `water` | #FFD65C / #F59BC0 / #8FD0E0 | accents |
| `CARA.fur` / `dress` / `frame` / `straw` | #B7804F / #EC4F9A / #EC4F9A / #D9B178 | Cara (keep exactly these) |
| `CARA.scarfR` / `scarfG` / `paw` | #C63A3F / #2F7B4A / #5B3F36 | her scarf and paws |
| `DEWI.red` / `belly` | #E4574F / #FFE3BA | Dewi |

- Cara must separate from every background: warm brown and pink against cool greens and blues. Don't put her on a pink
  or brown ground without a lighter halo of sky, grass or sand behind her.
- One colour arc per episode, and a gentle one (morning → warmer light as things go well).

## 4. Brush and line

- **Characters:** flat `wash` plus an ink outline in `CARA.ink` (#3A2E3A, a soft plum-black). Line weight comes from
  `u` (`sw ≈ u / 16 × 0.85`), so outlines are bold but rounded, never scratchy.
- **Backgrounds:** big flat washes with *thin* outlines (sw 0.5–0.9) in a darker mix of the fill colour, not black.
  Texture comes from a few medium-sized watercolour `fill` patches (meadow patches, shading under a rock), not from
  filling huge shapes.
- **Performance rule for this machine (Intel iGPU):** watercolour `fill` on shapes much bigger than the frame is slow,
  and hundreds of tiny painted polygons can make WebGL lose its context (frames come out black). Draw fine repeated
  detail (stones in a wall, grass) as `inkLine` strokes. Aim for ≤ 2 s per frame; the render log prints ms/frame.
- **Boil** at 10 drawings a second (`PROJECT.boil`), i.e. a new drawing every 3 frames at 30 fps: calm, not jittery.
  Give every element its own `boilSeed(key)`.
- **No text on screen.** Reactions are painted emotes. Friendly emotes only: `!` `?` `spark` `heart` `hearts` `music`
  `bulb` `stars` `dots`. Never `anger`, `steam` or `scribble`.

## 5. Pacing for young children

- **Slow cuts.** Prefer one continuous set with camera moves between shots (as in the Wales test) over cuts. Shots last
  at least 4 s. The only hard cut allowed is a gentle cut on action.
- **One read at a time, and hold it.** Give each read at least 1 s (30 frames), and 1.5–2 s for anything new or
  important. Every reaction waits until its cause has fully landed.
- **Camera:** eased moves only, taking at least 1.2 s to travel. Slow drifts and pushes are fine. No whip pans, no shake,
  no crash zooms, no spinning.
- **No flashing.** Never use `flash()`. No strobing, no rapid brightness or colour changes (stay well inside the
  3-flashes-a-second photosensitivity limit: aim for zero). Glows fade in over at least 0.3 s.
- **No sudden scares.** Anything that appears unexpectedly is signalled first (a wobble, a sound cue in the voiceover, a
  peek) and is smiling from its first frame. No looming shadows, no jump-outs, no loud-looking takes. Surprise takes use
  `caraActs` defaults (already softened); don't scale them past `take: 1`.
- **Transitions:** soft ones: an iris from paper, a slow camera move, a brush wipe in `SOFT` greens. Open and close
  every episode with an iris on Cara, so every episode rhymes.
- **Repetition is good.** Toddlers love a repeated action with a small change the third time.

## 6. How subagents structure scene code

Episodes can be built in parallel: one subagent per scene file. The rules:

1. **Storyboard first.** The lead writes `STORYBOARD.md` (the format is in ANIMATION_GUIDE.md) with every shot's reads
   and times. Each subagent gets its shot range, its reads, the world layout (key positions, `GROUND`, where each
   character stands) and this guide.
2. **One file per subagent:** `src/scenes/<episode>-<part>.js`, wrapped in an IIFE, ending with `shots([...])` for its
   own time range only. **Never edit shared files** (`core.js`, `cara.js`, `dragon.js`, `emotes.js`, `timeline.js`,
   `render.mjs`, `studio.html`, `config.js`). If a helper is missing, write it privately inside your IIFE. If a shared
   file has a real bug, report it to the lead.
3. **Same order in every file:**
   ```js
   // src/scenes/ep02-beach-a.js: shots A–B of "Cara at the beach" (0–9.5 s). See STORYBOARD.md.
   (() => {
     const LINES = [[2.1, 3.0]];                     // voiceover slot: placeholder talking spans, or a mouth track name
     const GROUND = 940, U = 30;                     // constants shared with the storyboard's world layout
     const CAM_L = [[0, 960, 540, 1], ...], CAM_V = [[0, 960, 700, 1.3], ...];   // [t, cx, cy, zoom] per format
     function camera(t) { const c = kf(t, fmt(CAM_L, CAM_V).map(([k, ...v]) => [k, v])); camBegin(c[0], c[1], c[2]); }
     // set pieces (sky, hills, props): each starts with boilSeed('name')
     // cast (caraAt(t), friendAt(t)): the whole performance as functions of video time
     function world(t) { camera(t); /* back to front */ camEnd(); }
     function shotA(t, lt, dur) { world(t); /* transition in */ }
     function shotB(t, lt, dur) { world(t); /* transition out */ }
     shots([[0, shotA], [4.6, shotB]]);
   })();
   ```
4. **Pure functions of time.** Every frame is `fn(t)`: no state between frames, no `Math.random()`, no counters. Use
   `hash(i)` for fixed variety and `kf`, `seg` and `ease` for motion.
5. **Always handle both formats.** Keep a landscape and a vertical camera path (`fmt(landscape, vertical)`), paint
   backgrounds oversized (the vertical frame sees much more sky and ground), and check both. Keep the key action within
   the middle 1080 px of the landscape frame, so a centre crop would still work too.
6. **Seams:** the part that owns a seam draws both halves of its transition. Agree seam times and camera positions in
   the storyboard, so a camera move carries from one file into the next.
7. **Check your own work before handing back:** a contact sheet of your range, a strip of every key motion and
   transition, and a vertical sheet (`--vertical`). Report the ms/frame.

## 7. Audio and lip-sync

Episodes are rendered silent until the ElevenLabs audio arrives. Then:

1. Put the files in `assets/audio/`, one voice-only track per character if possible, plus music.
2. Set `PROJECT.audio` in `src/config.js`: `[{ src: 'assets/audio/ep02-cara.mp3', at: 0.4 }, { src: 'assets/audio/theme.mp3', gain: 0.3 }]`.
3. `node tools/mouth_track.mjs assets/audio/ep02-cara.mp3 --at=0.4` writes `src/audio/ep02-cara.mouth.js`. Add it to
   `studio.html` before the scene, and replace the scene's `LINES` spans with `'ep02-cara'`.
4. Re-time reads to the real lines: a line and the action it describes should land together, and every line ends at
   least 0.5 s before a transition starts.
