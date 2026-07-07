# The Gilded Needle — Technical Spec (v1)

This document is the **binding contract** between modules. Design content (names, numbers,
colors, dialogue) lives in `design/world.md`, `design/systems.md`, `design/art.md` — follow
those for CONTENT. Follow THIS file for STRUCTURE. If a design doc conflicts with a contract
here, the contract wins; note the deviation in a comment at the top of your file.

## Stack & hard rules

- Pure browser JavaScript, **classic scripts** — NO ES modules, NO `import`/`export`, no bundler.
- Every file starts with `'use strict';` and `window.G = window.G || {};`, then attaches its API to `G`.
  Wrap file bodies in an IIFE if you want private scope.
- Canvas: internal resolution **480×270** (`G.W`, `G.H`), CSS-scaled, pixelated. **TILE = 16** (`G.TILE`).
- **Zero external assets.** All art is procedural pixel art rendered to offscreen canvases at init.
  All audio is WebAudio oscillators/noise. Fonts come from CSS (`'VT323'` body, `'Press Start 2P'` headings).
- No network calls. `Math.random()` is fine. Save via `localStorage`.
- Never throw at script-load time. Heavy work goes in `init()` functions that `main.js` calls in order.
- Do not edit `index.html`, `css/style.css`, or `js/main.js` — they are owned by the orchestrator.
- Before finishing, run `node --check js/<yourfile>.js` to verify syntax.

## Load order (fixed, from index.html)

`palette.js → engine.js → art-sprites.js → art-tiles.js → data.js → maps.js → systems.js → ui.js → scenes.js → main.js`

Boot (`main.js`, already written): `G.Engine.init('game')` → `G.Sprites.init()` → `G.Tiles.init()`
→ `G.Maps.init()` → `G.Audio.init()` → `G.setScene('title')` → `G.Engine.start()`.

---

## palette.js (orchestrator-owned)

`G.Palette` — flat object of named hex strings from `design/art.md` (e.g. `G.Palette.outline`,
`G.Palette.grass1..3`, `G.Palette.gold`, tier accents, skin ramps). Also
`G.Palette.ramp(name) -> [hex,...]` helper if useful. All other files use `G.Palette.*` — never
hardcode hex except for one-off tints/alphas.

## engine.js

```js
G.W = 480; G.H = 270; G.TILE = 16;

G.Engine = {
  init(canvasId),      // grab canvas/ctx, imageSmoothing off, wire G.Input
  start(),             // rAF loop; dt seconds clamped to <= 0.05
  canvas, ctx,
  time,                // seconds since start (float)
  shake(intensity, duration),  // screen shake, applied during draw
};
// Loop each frame: scene.update(dt) → G.UI.update(dt) → scene.draw(ctx) → G.UI.draw(ctx) → G.Input.endFrame()
// When G.UI.modal() is true, the scene's update should still be called (scenes check modal() themselves
// to freeze the player) — the engine does NOT skip anything.

G.Input = {
  down(code),          // 'KeyW', 'ArrowLeft', 'Space', 'KeyE', ... true while held
  pressed(code),       // true only on the frame the key went down (cleared in endFrame)
  axis(),              // {x:-1..1, y:-1..1} normalized, from WASD+arrows
  mouse: { x, y, down, clicked },  // internal 480×270 coords; clicked = one frame
  endFrame(),
};
// preventDefault on arrows/space/tab so the page never scrolls. First keydown/click calls G.Audio.unlock().

G.Camera = {
  x, y,
  follow(px, py, mapWpx, mapHpx),  // center on point, clamp to map bounds (handle maps smaller than screen)
  begin(ctx),          // save + translate(-x, -y) (+ shake offset)
  end(ctx),            // restore
};

G.registerScene(name, scene);      // scene: { enter(params), update(dt), draw(ctx), exit() } (all optional but update/draw)
G.setScene(name, params);          // calls old.exit(), new.enter(params); sets G.scene
G.scene;                           // current scene object; G.sceneName — current name

G.Save = {
  KEY: 'gilded_needle_save',
  save(),              // JSON.stringify(G.state) → localStorage; returns bool
  load(),              // parse into G.state (merge over G.newGameState() defaults for forward-compat); bool
  has(), clear(),
};

G.Audio = {
  init(), unlock(),            // create AudioContext lazily; resume on first gesture
  playMusic(id), stopMusic(),  // ids: 'title','train','city','shop','mill','warehouse','grove','vault','royal'
  sfx(id),                     // 'snip','stitch','stitch_perfect','coin','pickup','hurt','step','ui','doorbell','whistle','fanfare','thud'
  muted, toggleMute(),
};
// Music = looping scheduler on the WebAudio clock playing the chord progressions from design/art.md
// (bass + lead + soft pad, gentle envelopes, low volume ~0.12). playMusic twice with same id = no restart.

G.Utils = {
  clamp(v,a,b), lerp(a,b,t), dist(x1,y1,x2,y2),
  aabb(a,b),                       // rects {x,y,w,h}
  rand(a,b), irand(a,b), pick(arr), chance(p),
  text(ctx, str, x, y, opts),      // opts: {size=10, color, align:'left'|'center'|'right', font:'body'|'head', shadow=true}
                                   // body → `${size}px VT323`, head → `${size}px "Press Start 2P"`; shadow = outline-color offset +1,+1
  wrapText(ctx, str, maxWidth, size, font) -> [lines],
  roundRect(ctx, x, y, w, h, r),   // path only; caller fills/strokes
};
```

## art-sprites.js

```js
G.Sprites = {
  init(),                          // build every sprite to offscreen canvases, store in a map
  get(name) -> canvas,             // static sprites/icons; MUST return a visible magenta 12×12 placeholder (and console.warn once) for unknown names
  anim(base, dir, frame) -> canvas,// characters: dir 'down'|'up'|'left'|'right', frame int (mod frame count)
  has(name) -> bool,
};
```

Technique: pixel-lattice strings — arrays of strings, one char per pixel, with a per-sprite
char→palette map; a private `build(rows, charMap, scale=1)` renders to a canvas. Outline in
`G.Palette.outline` (warm near-black), never pure black. Follow `design/art.md` for all colors.

Required inventory (ids must match `design/systems.md` / data.js):
- `anim('player', dir, 0..3)` — heroine 16×24, 4-dir 4-frame walk (frame 0 = idle). Plus
  `get('player_action_<dir>')` kneel/reach pose, `get('swipe_<dir>')` scissor-arc effect ~16×16.
- `anim('npc_<id>', dir, 0..1)` for EVERY npc id in design/world.md — 16×24, at least down/left/right,
  idle bob 2 frames; class-differentiated per art doc. (Generic fallback bodies with palette swaps are fine
  as long as hair/hat/garment colors differ per NPC.)
- Enemies per design/systems.md (e.g. `anim('moth'|'dye_rat'|'guard_hound'|'loom_sentinel', dir, 0..1)`).
- Icons 12×12: `get('fabric_<id>')` for every fabric (bolt-of-cloth shape, fabric-colored),
  `get('garment_<id>')` for every garment (readable silhouettes: coat, dress, gloves, gown...).
- Icons small: `get('heart')`, `get('heart_empty')`, `get('coin')`, `get('bolt')` (stamina), `get('star')`,
  `get('star_empty')`, `get('rep')` (spool), `get('needle')`, `get('cursor')`.
- Set pieces: `get('train_side')` (~192×48 steam engine + carriage, side view, for cinematic),
  `get('node_glint')` 2-frame sparkle via get('node_glint_0'|'node_glint_1').

## art-tiles.js

```js
G.Tiles = {
  init(),
  get(ch, theme) -> canvas(16×16),  // theme-variant tile; cache per (ch,theme); unknown → magenta tile + warn once
  solid(ch) -> bool,                // theme-independent
  strip(name) -> canvas,            // parallax backdrops, >= 960 wide: 'sky_day','sky_dusk','mountains','hills',
                                    // 'fields','rails','city_skyline' (heights per design/art.md §7)
};
```

**Global tile legend** (maps use ONLY these chars; solidity fixed here):

| ch | meaning | solid |
|----|---------|-------|
| `.` | ground primary (grass/cobble/floor per theme) | no |
| `,` | ground variant (texture break-up) | no |
| `-` | path / road | no |
| `=` | plaza / fine paving | no |
| `#` | wall / building mass | yes |
| `B` | building facade w/ window (lit at night if easy) | yes |
| `D` | door (walkable; portals placed on these) | no |
| `w` | water / canal | yes |
| `t` | tree / mulberry / large plant | yes |
| `f` | flowers / small decor | no |
| `F` | fence / railing | yes |
| `l` | lamp post (warm glow disc at night) | yes |
| `c` | crate / barrel / dye vat | yes |
| `T` | table / counter / sewing table | yes |
| `S` | shelf / fabric rack | yes |
| `m` | machine / loom | yes |
| `r` | rubble / debris | yes |
| `b` | bridge / plank | no |
| `x` | hazard floor (crumbling/inky — damages on step) | no |
| `n` | fabric node spawn point (renders as ground; node visuals drawn by systems) | no |
| `g` | tall grass / thread tufts (walkable) | no |
| `h` | chair / stool | yes |
| `e` | bed | yes |
| `_` | pit / void | yes |
| `~` | rail track | no |
| ` ` | empty void (outside map) | yes |

Themes: `village, train, station, city_poor, city_market, city_noble, city_royal, city, shop, mill, warehouse, grove, vault, palace`.
(`city` = plaza default; district chars still use one city map — see maps.) Follow design/art.md §2
for colors. Add subtle per-tile variation by hashing (x,y) is NOT possible (get is per-char) — instead
bake 2 variants for `.` and `,` per theme and alternate by char choice in maps.

## data.js

```js
G.Data = {
  fabrics:   { id: { id, name, tier, zone, rarity, value, color /*hex or palette key*/, desc } },
  garments:  { id: { id, name, tier, recipe: { fabricId: qty }, price, desc } },
  npcs:      { id: { id, name, role, tier, map, tx, ty, dir, lines: { greet:[...], hint:[...], warm:[...] }, quest?: {...} } },
  zones:     { id: { id, name, theme, mapId, tier, danger, fabrics:[ids], enemies:[{type, count}], desc, music } },
  tiers:     [ { id:'poor'|'middle'|'noble'|'royal', name, repNeed, color, priceMult } ],  // repNeed cumulative
  quests:    [ { id, title, desc, hint, goal: {type:'gather'|'craft'|'sell'|'talk'|'rep'|'gold', target?, qty?, tier?}, reward: {gold?, rep?, unlock?}, payoff } ],
  customers: { spawnMinutes:[min,max], tierWeights..., specificChance, moodMults, patience... },
  upgrades:  { id: { id, name, price, desc, effect } },
  strings:   { intro:[...beats], ending:[...lines], ... any longform text },
};
```

Transcribe from `design/systems.md` (numbers/ids win) + `design/world.md` (names/dialogue/quests win).
Keep ids snake_case, consistent everywhere. `npcs[].map`/`tx`/`ty` place NPCs on maps (coordinate with maps.js sizes — see maps contract; if unsure place on 'city' near plaza and scenes clamp).

## maps.js

```js
G.Maps = {
  init(),               // parse all defs: build collision, extract 'n' node spots, keep row strings
  get(id) -> map,
};
// map = {
//   id, name, theme, music,
//   w, h,                    // in tiles
//   rows: [string],          // h strings of length w (the ASCII art)
//   solidAt(tx, ty) -> bool, // true outside bounds
//   charAt(tx, ty) -> ch,
//   portals: [ { tx, ty, to, ttx, tty, dir, label } ],   // stepping on/near + E (scenes handle) → G.setScene('world',{map:to,spawn:{tx:ttx,ty:tty},dir})
//   spawn: { tx, ty },       // default entry
//   nodeSpots: [ {tx, ty} ], // from 'n' chars
//   zone: zoneId | null,     // gathering zones link back to G.Data.zones
// }
```

Maps to author as ASCII (sizes are guides): `city` (~64×44 — central plaza with the shop door,
four district arms per world.md, gates/doors to the four zones at the arms' ends + palace gate),
`shop` (~22×14 interior: sewing table `T`, counter `T`, fabric shelves `S`, bed `e`, door `D` at bottom),
`old_mill` (~42×30), `river_warehouse` (~44×30), `silk_grove` (~42×32), `palace_vaults` (~44×32),
`palace_hall` (~26×16 throne room). Zones: scatter 8-12 `n` spots, use `x` hazard patches sparingly
(vaults most), make layouts loop nicely (no dead-end mazes), doors `D` back to city at the entry edge.
Every map edge must be solid (or void ` `). Portals list must make the whole world reachable:
city ↔ shop, city ↔ each zone (zone gating by tier happens in scenes/systems, not maps), city ↔ palace_hall.
Keep district flavor INSIDE the single city map by leaning on `B/f/l/c` density per arm (theme stays 'city';
tiles for 'city' should read as warm plaza cobble that works everywhere).

## systems.js

```js
G.newGameState() -> void  // sets G.state to the exact starting state from design/systems.md §9
G.state = {
  day, time,                    // time = minutes, 360..1440 (6:00–24:00)
  gold, rep, tier,              // tier = highest unlocked index into G.Data.tiers (0..3)
  inv: { fabrics:{id:qty}, garments:{id:[quality,...]}}, // garments stored as arrays of star-qualities (1..3)
  player: { x, y, map, dir, hp, maxHp, sta, maxSta },    // x,y in PIXELS
  quests: { step, done:{} },    // step = index into G.Data.quests
  upgrades: {id:true},
  flags: {},                    // introSeen, tutorialDone, endingSeen, firstSale, etc.
  stats: { gathered, crafted, sold, earned, days },
};

G.Player = {
  update(dt, map),   // movement w/ collision (8×6 feet box at sprite bottom), walk anim timer, swipe cooldown,
                     // Space = scissor swipe (spawns attack arc, G.Hazards.hit(rect, dmg)), stamina drain rules,
                     // frozen while G.UI.modal() or scene cutscene flag
  draw(ctx),         // y-sort handled by scenes; draw shadow ellipse + sprite + swipe fx
  rect() -> {x,y,w,h},
  facingTile() -> {tx, ty},
  damage(n, fromX, fromY),      // i-frames 0.8s, knockback, G.Engine.shake, hurt sfx; at hp<=0 → G.Systems.collapse()
  heal(n), spendStamina(n) -> bool,
};

G.Inventory = {
  addFabric(id, n), addGarment(id, quality), removeFabric(id, n) -> bool, takeGarment(id, minQuality?) -> quality|null,
  fabricCount(id), garmentCount(id), fabricTotal(),
  list(kind) -> [{id, qty, ...}] sorted by tier,
};

G.Craft = {
  available() -> [garmentIds unlocked at G.state.tier, incl. quest garments when quest active],
  canCraft(id) -> bool,
  consume(id),                  // remove recipe fabrics (call only after minigame)
  finish(id, quality),          // add garment, stats, quest trigger 'craft'
};

G.Economy = {
  priceFor(garmentId, quality, tierIdx) -> int,   // price * qualityMult * tier priceMult (from Data)
  sell(garmentId, quality, customer) -> {gold, rep},  // applies gold/rep, stats, quest trigger 'sell', sfx coin
  addRep(n),                    // handles tier unlock checks → G.UI.notify tier-up + fanfare + quest trigger 'rep'
  customerTick(dt),             // only called by shop scene: spawn walk-in customers per design §7
  customers: [...],             // active customer objects {npcSprite, tier, want:{garmentId|null, tier}, state, x, y, timer}
};

G.Time = {
  advance(dt),        // scenes call in world/shop; minutes += dt * rate (design §4); at 24:00 force sleep (collapse-free)
  clock() -> 'H:MM', phase() -> 'day'|'dusk'|'night',
  tint(ctx),          // full-screen overlay per art.md §6 (skip in interiors except window glow — keep simple: interiors get 50% strength)
  sleep(),            // day++, restore hp/sta, respawn nodes flag, autosave, G.UI.notify morning line
};

G.Hazards = {
  load(zoneId),       // build nodes from map.nodeSpots (pick per-zone fabrics by rarity; ~design §5 count, respawn daily),
                      // spawn enemies per Data.zones[].enemies
  clear(),
  update(dt, map),    // enemy behaviors (drift/patrol/charge/guard per design), contact damage, hazard 'x' tiles damage-on-step (0.7s recheck)
  draw(ctx, layer),   // layer 'under' (nodes) and 'over' if needed; sparkles on nodes
  nodes: [ {tx, ty, fabricId, taken, t} ],
  nodeAt(tx, ty) -> node|null,
  harvest(node),      // hold-E handled by scenes → progress; on complete: fabrics + sfx + sparkle burst + stamina cost
  hit(rect, dmg),     // player attack vs enemies; enemy death poof
  enemies: [...],
};

G.Quests = {
  current() -> quest|null,
  trigger(evt, payload),   // evt: 'gather'|'craft'|'sell'|'talk'|'rep'|'gold' — checks current quest goal, advances,
                           // applies reward, G.UI.notify with payoff line, autosave; final quest → G.setScene('ending')
  progressText() -> 'Sell garments to the poor quarter (2/3)',
};
G.Systems = { collapse() /* hp 0: fade, lose 25% fabrics, wake in shop next morning */ };
```

## ui.js

```js
G.UI = {
  update(dt), draw(ctx),
  modal() -> bool,          // any dialogue/menu/minigame open (scenes freeze player + time on modal)
  handleEscape?,            // Esc: close top layer, else open pause menu

  // building blocks
  panel(ctx, x, y, w, h, opts),   // walnut frame + linen fill + golden running-stitch border per art.md §5
  button(ctx, {x,y,w,h,label,size}) -> bool,  // draws w/ hover state (mouse), returns true if clicked this frame
  drawIcon(ctx, name, x, y),

  hud: {},                  // top-left: hearts + stamina bar; top-right: gold + day/clock + tier badge (spool);
                            // bottom-left: current quest hint line (G.Quests.progressText()); context prompt ("E — Talk") when scenes set G.UI.prompt
  prompt,                   // string|null — scenes set each frame, hud draws it bottom-center

  dialogue: { open(name, lines, opts?), active, /* typewriter text, Space/E/click advances, opts.onDone, opts.portrait (sprite name) */ },
  notify(text, opts?),      // toast queue top-center, ~2.5s, stitch-border chip
  confirm(text, onYes),     // small yes/no modal

  inventory: { open() },    // 'I' — two tabs (fabrics/garments) grid w/ icons, qty, tier-colored labels, tooltips
  crafting:  { open() },    // at sewing table: recipe list (locked ones greyed w/ tier tag), ingredients have/need,
                            // Craft → runs the seam minigame (design §6) inline in this panel → G.Craft.consume/finish
  shopSell:  { open(customer) },  // customer request card + matching stock list → G.Economy.sell; polite decline button
  pause:     { open() },    // Resume / Save / Mute / Controls / Quit-to-title
  sleepPrompt(onYes),       // at bed
};
```

The seam minigame runs INSIDE ui.crafting (it's modal): seam bar ~260px wide, needle marker sweeps,
Space to stitch, gold-zone widths/speeds per design §6, star result → `G.Craft.finish(id, stars)`.
Visual: fabric swatch bg in the garment's fabric color, stitches appear along the seam, sparkle on perfect.

## scenes.js

Register: `title`, `intro`, `world`, `ending`.

- **title**: city-skyline parallax strip + drifting leaves; logo "The Gilded Needle" (Press Start 2P,
  gold, stitch underline) + "A Tailor's Tale"; buttons: New Game / Continue (if `G.Save.has()`) / Mute.
  New Game → `G.newGameState()` → `intro`. Continue → `G.Save.load()` → `world` at saved map. Music 'title'.
- **intro**: skippable (Esc/Enter "Skip") scripted cinematic from `G.Data.strings.intro` + world.md beats:
  village vignette → parallax train ride (strips + train_side + steam particles + whistle) → station arrival.
  Narration via letterboxed text. Music 'train'. Ends → `world` {map:'shop'} with landlady/keys dialogue kicked
  off via quest 0 / tutorial flow (design §9).
- **world** `{map, spawn?, dir?}`: THE scene for city/shop/zones/palace_hall. Duties:
  - draw: tiles (two passes: ground chars then solid/props for slight y-illusion is fine), nodes (Hazards),
    y-sorted entities (player, npcs, enemies, customers), overlays: Time.tint, particles per theme
    (leaves/dust/sparkle per art.md §6), map-name banner on enter.
  - update: Player, Hazards (zones only), Economy.customerTick (shop only, open hours), Time.advance
    (frozen while modal), NPC idle + facing player when near.
  - interact (E): priority — customer at counter → shopSell; npc → dialogue (greet/hint/warm by rep,
    quest 'talk' trigger); node → hold-E harvest w/ radial progress; sewing table → crafting; bed → sleepPrompt;
    portal → transition (fade out/in). Zone portals check tier locks → locked line via notify + doorbell-sad.
  - zone entry: `G.Hazards.load(zone)`, music switch; leaving zone → `clear()`.
  - Esc → pause. Music per map.
- **ending**: palace_hall coronation: scripted walk, `G.Data.strings.ending` lines, confetti particles,
  fanfare, then stats card (days, gold earned, garments sewn) + "The shop of <heroine> — by royal
  appointment" epilogue + back-to-title. Sets flags.endingSeen; game continues free-play after if they return.

Scene transitions: simple 0.3s fade to `G.Palette.outline` handled inside world scene enter/exit.

## Definition of done (integrator checklist)

1. `node --check` passes on every js file.
2. Game boots to title with zero console errors; New Game → intro → shop with tutorial dialogue.
3. Full loop playable: gather in old_mill → craft at table (minigame) → sell to a walk-in → rep rises.
4. All four zones reachable and gated by tier; enemies damage/die; collapse works; sleep/save/load works.
5. Quest arc advances end-to-end (cheat-test by granting rep/fabrics via console) → ending plays.
6. No magenta placeholder sprites/tiles visible on any map with default progression.

## Cozy-revamp legend addendum (v2)

| ch | meaning | solid |
|----|---------|-------|
| `o` | sofa (cream, plaid cushion) | yes |
| `u` | woven rug | no |
| `k` | stone fireplace (lit) | yes |
| `M` | dress-form mannequin — E opens the Wardrobe; worn garment overlaid by scenes from `G.state.mannequins[mapId_tx_ty]` | yes |
| `C` | coffee station — E: +20 stamina once per day (`flags.coffeeToday`) | yes |
| `R` | clothes rack with hanging tops | yes |
| `P` | potted plant | yes |
| `W` | shopfront display window (lit, awning) | yes |
| `Q` | hanging shop sign (gilded needle) | yes |

`G.UI.wardrobe.open(key)` — showcase-shelf grid of owned garments + bare option, dress-form preview, Dress button.
