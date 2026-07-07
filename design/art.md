# The Gilded Needle — Art Direction & Audio Design
Internal resolution 480x270, 16px tiles, 100% procedural pixel art. Warm painterly-pixel, cozy-adventurous.
All sprites outlined in Warm Ink `#2a1f2b` — never pure black. Dithering only in 2x2 checker, used sparingly for gradients on large surfaces (sky, water, wall washes).

---

## 1. MASTER PALETTE

| Name | Hex | Usage |
|---|---|---|
| Warm Ink | `#2a1f2b` | Universal outline, darkest shadow, text on linen |
| Soot Plum | `#463a4b` | Secondary shadow, night masses, hair shadow |
| Ash Taupe | `#8c7f78` | Neutral mid — dust, worn cloth, road grime |
| Cream Linen | `#f3e5c8` | UI panel fill, shirt whites, daylight highlight |
| Parchment | `#e6cfa3` | Paper, labels, plaster walls, price tags |
| Meadow Deep | `#35592b` | Grass shadow, hedge cores, foliage dark |
| Meadow Mid | `#4f7a3a` | Base grass tile, tree canopies |
| Meadow Light | `#7aa74f` | Grass highlight, sunlit leaf tips |
| Bark Deep | `#5e3a22` | Wood shadow, beams, crate seams |
| Bark Mid | `#8a5a33` | Base wood — floors, fences, furniture |
| Bark Light | `#b5824a` | Wood highlight, worn plank edges |
| Stone Deep | `#4c4852` | Stone shadow, mortar lines, cellar dark |
| Stone Mid | `#6f6a75` | Base cobbles, walls, mill machinery |
| Stone Light | `#9a94a0` | Stone highlight, rain-polished cobble tops |
| River Deep | `#2e5d73` | Water shadow, dye-vat depths |
| River Mid | `#4a86a0` | Base water, canal surface |
| River Light | `#7fb7c7` | Water sparkle rows, wet reflections |
| Skin Fair | `#f0c8a0` | Skin tone A base (heroine) |
| Skin Fair Shade | `#c98a62` | Skin tone A shadow / blush |
| Skin Umber | `#a9714b` | Skin tone B base |
| Skin Umber Shade | `#7c4e33` | Skin tone B shadow |
| Poor Indigo | `#5a6b8c` | Tier 1 accent — washed workwear, shutters |
| Poor Fade | `#8fa0b5` | Tier 1 highlight — sun-bleached cloth |
| Patch Brown | `#7a5c48` | Tier 1 — patched elbows, sack cloth |
| Market Green | `#5f8f4e` | Tier 2 accent — awnings, apron trim |
| Terracotta | `#c46a3f` | Tier 2 — roof tiles, pottery, warm signage |
| Terracotta Pale | `#e09a6a` | Tier 2 highlight — plaster glow, bread crusts |
| Plum Noble | `#6d3a67` | Tier 3 accent — gowns, banners, doors |
| Plum Deep | `#4a2748` | Tier 3 shadow — velvet folds |
| Silver Court | `#c0c3cf` | Tier 3 — jewelry, embroidery, wig powder |
| Crimson Royal | `#a32638` | Tier 4 accent — carpets, guard livery, the gown |
| Crimson Deep | `#701a28` | Tier 4 shadow — banner folds, throne velvet |
| Gold Regal | `#e0a933` | Tier 4 — crowns, filigree, coin faces |
| Thread Gold | `#f2c14e` | THE signature accent: UI stitch borders, quest markers, node sparkles, perfect-stitch flash |

34 colors. Rule: every scene uses Warm Ink + one neutral + at most two ramps + its tier accent. Thread Gold appears in every scene at least once (a glint, a marker, a stitch).

---

## 2. THEME TILE GUIDES

| Theme | Ground trio (shadow/base/light) | Walls / structures | 2 signature props | Atmosphere note |
|---|---|---|---|---|
| village | `#35592b` `#4f7a3a` `#7aa74f` | Timber `#8a5a33` on plaster `#e6cfa3`, thatch `#b5824a` | Spinning wheel on a porch; laundry line with indigo sheets | Dawn-gold mountain hamlet; woodsmoke ribbons from squat chimneys |
| train | Rail bed `#4c4852` `#6f6a75` gravel `#8c7f78` | Carriage panels `#701a28` with `#e0a933` coach lining, brass fittings | Leather suitcase with tag; swaying oil lantern | Rhythmic sway; window light strobes warm across the seats |
| station | Platform `#4c4852` `#6f6a75` `#9a94a0` | Iron columns `#463a4b`, glass canopy catching `#f2c14e` glints | Station clock on post; luggage trolley stacked three high | Steam drifting under a vaulted glass roof, pigeons on beams |
| city_poor | Mud-cobble `#463a4b` `#6f6a75` `#8c7f78` | Leaning brick `#7a5c48`, shutters `#5a6b8c`, patched tarps `#8fa0b5` | Rag-and-bone cart; smoking chimney pipe jutting from a window | Narrow lanes, crisscross laundry lines, warm candle squares at dusk |
| city_market | Cobble `#4c4852` `#6f6a75` `#9a94a0` | Plaster `#e6cfa3` + timber `#8a5a33`, awnings `#5f8f4e`/`#c46a3f` stripes | Fabric bolt stall (3 bolts fanned); hanging scale with brass pans | Bustle and bunting; terracotta roofs stepping uphill |
| city_noble | Pale flagstone `#8c7f78` `#9a94a0` `#c0c3cf` | Limestone `#e6cfa3`, doors `#6d3a67`, wrought iron `#2a1f2b` | Topiary in urn; gas lamp with `#f2c14e` flame | Wide quiet avenues, clipped hedges, silver-trimmed carriages |
| city_royal | Marble `#9a94a0` `#c0c3cf` `#f3e5c8` | Palace wall `#f3e5c8`, roofs `#2e5d73` copper-teal, gates `#e0a933` | Crimson banner with gold needle crest; guard box striped `#a32638`/`#f3e5c8` | Everything vertical and gleaming; fountains throw Thread Gold sparks |
| shop | Plank floor `#5e3a22` `#8a5a33` `#b5824a` | Warm plaster `#e6cfa3` over walnut wainscot `#5e3a22` | The sewing table (brass machine + `#f2c14e` thread spool); dressmaker's dummy | Honeyed lamplight; dust motes over folded fabric stacks |
| mill | Worn boards `#463a4b` `#5e3a22` `#8a5a33` | Crumbling brick `#7a5c48`, broken looms `#6f6a75`, holes to sky | Great rusted loom wheel; torn warp threads hanging like vines | Slanted light shafts full of dust; moths flicker lavender in the gloom |
| warehouse | Wet stone `#2e5d73` `#4c4852` `#6f6a75` | Stacked dye barrels `#5a6b8c`/`#6d3a67`/`#c46a3f`, crane beams `#5e3a22` | Dye vat glowing river-blue; rope pulley with hanging cloth bolt | Everything stained in spilled rainbows; drips echo off the canal |
| grove | Moss `#35592b` `#4f7a3a` `#7aa74f` | Overgrown trellis `#8a5a33`, cracked greenhouse glass `#7fb7c7` | Mulberry tree heavy with leaves; silk cocoon clusters like paper lanterns | Dappled jade light; cocoons glint `#f2c14e` when the canopy sways |
| vault | Old flags `#2a1f2b` `#463a4b` `#4c4852` | Carved stone `#4c4852`, verdigris doors `#5f8f4e` on bronze `#8a5a33` | Loom sentinel alcove; chest spilling crimson-and-gold brocade | Cold blue dark broken by torch pools; your footsteps are the loudest thing |
| palace_hall | Red carpet `#701a28` `#a32638` on marble `#c0c3cf` | Columns `#f3e5c8`, drapes `#a32638` with `#e0a933` cords | Twin thrones; row of pennant chandeliers | Sun through high windows; the whole tier-4 ramp singing at once |

---

## 3. HEROINE SPRITE SPEC — "Odette"

- **Canvas:** 16x24 px per frame; 4 directions (down/up/left/right — left is flipped right), 4-frame walk (contact/pass/contact/pass), 6-8px head, big readable eyes (2px, `#2a1f2b` with 1px `#f3e5c8` catchlight facing camera).
- **Hair:** Chestnut bun — base `#8a5a33`, shadow `#5e3a22`, highlight `#b5824a`. A round 4px bun on top-back with two 1px loose strands at the temples; the bun silhouette is her ID at any distance.
- **Skin:** Skin Fair `#f0c8a0`, shade `#c98a62` (jaw underside, hands).
- **Outfit (reads "tailor" at a glance):** Poor Indigo `#5a6b8c` work dress, skirt shadow `#463a4b`; Cream Linen `#f3e5c8` apron front with 2 visible `#2a1f2b` pin dashes; **measuring-tape sash** — 1px diagonal band `#e6cfa3` with alternating `#2a1f2b` tick pixels, right shoulder to left hip; **pincushion wristband** — 2x2 `#a32638` dot with 1 `#c0c3cf` pin pixel on the left wrist; boots `#5e3a22`.
- **Outline:** Warm Ink `#2a1f2b` full body; interior lines only under chin and apron edge.
- **Animation tricks:** 1px vertical head-bob on pass frames; skirt hem alternates 1px left/right sway (draw hem row shifted); on up-facing walk the bun bobs instead of the face; idle = 2-frame breath, shoulders down 1px every 900ms; blink every ~4s (eyes to 1px line for 100ms).
- **Harvest pose (kneel-reach):** 16x20, skirt pooled 2px wider, one arm extended full 5px toward node, head tilted 1px down; 2 frames alternating hand open/closed at 6 fps while gathering.
- **Scissor-swipe effect:** on Space, a 12px arc of 3 crescent slashes `#f3e5c8` core with `#f2c14e` edge sweeps 90° in front of her over 3 frames (5,3,2 px thick, fading); scissors themselves flash as a 4px `#c0c3cf` X on frame 1. Hit sparks: 3 Thread Gold pixels scatter.

---

## 4. NPC & ENEMY VISUAL LANGUAGE

NPCs are 16x24, same outline. **Tier is read by silhouette + accent before any dialogue:**
- **Poor (tier 1):** Rounded, hunched, layered silhouettes — shawls, caps. Palette: Poor Indigo `#5a6b8c`, Patch Brown `#7a5c48`, faded `#8fa0b5`; 1-2 contrasting patch pixels per garment. Colors 15% desaturated vs heroine.
- **Middle (tier 2):** Upright, square, sleeves-rolled. Aprons `#f3e5c8` over Market Green `#5f8f4e` or Terracotta `#c46a3f`; tool-in-hand props (ladle, hammer, bolt of cloth).
- **Noble (tier 3):** Tall (16x26, +2px legs), narrow, vertical lines — canes, high collars, gown trains 1 tile long. Plum Noble `#6d3a67` + Plum Deep `#4a2748` with Silver Court `#c0c3cf` trim rows; powdered hair `#c0c3cf`.
- **Royal (tier 4):** Widest silhouettes — mantles. Crimson Royal `#a32638`/Deep `#701a28`, Gold Regal `#e0a933` crown/chains, **ermine trim** = `#f3e5c8` band with `#2a1f2b` flecks every 3px.

**Enemies (all cozy, cartoon-eyed, never gory — defeat = puff of matching-color motes + a fabric drop):**

| Enemy | Size | Palette | Telegraph (0.5s before attack) |
|---|---|---|---|
| Fabric Moth | 12x10 | Dusty lavender wings `#9b8bb0`, shade `#6d5f85`, body `#8c7f78`, eye dots `#2a1f2b` | **Wing-flash:** wings blink `#f3e5c8` twice, then a wobbly dive |
| Dye Rat | 14x8 | Ink-stained — body `#463a4b`, belly `#8c7f78`, random 2px dye splotches `#4a86a0`/`#6d3a67`, pink tail `#c98a62` | **Tail-up:** tail snaps vertical + 1px body crouch, then a straight dash |
| Guard Hound | 18x14 | Tawny `#8a5a33`/`#5e3a22`, muzzle `#e6cfa3`, **brass collar** `#e0a933` with 1px tag glint | **Crouch:** front drops 2px, ears flatten, collar tag flashes `#f2c14e`, then lunge |
| Loom Sentinel | 20x28 | Verdigris bronze — body `#5f8f4e` over `#8a5a33`, joints `#463a4b`, chest bobbin `#a32638` | **Eye-glow:** single eye charges `#f2c14e` over 3 brightening frames, then a slow arm sweep |

Hit-stun: 2 frames of `#f3e5c8` whiteout. Danger never darkens the palette — threat is choreography, not grimness.

---

## 5. UI STYLE

- **Panel:** dark walnut frame `#5e3a22` (2px, corners notched 1px, outline `#2a1f2b`), fill Cream Linen `#f3e5c8`, and a **golden running-stitch border**: 1px dashed `#f2c14e` (3px dash / 2px gap) inset 2px from the frame. Drop shadow: 1px `#2a1f2b` at 40% right+below.
- **Buttons:** idle = linen fill, `#2a1f2b` text; hover = fill `#e6cfa3`, stitch border animates (dash offset scrolls 1px/100ms); pressed = fill `#b5824a`, contents nudge down 1px; disabled = fill `#8c7f78`, text `#463a4b`, no stitch.
- **Icons (8x8):** Heart = `#a32638` fill, `#e09a6a` top-left shine px, empty = `#463a4b` outline only. Stamina = lightning-bobbin `#f2c14e` on `#5a6b8c` pips. Gold = coin `#e0a933`, rim `#b5824a`, `#f3e5c8` glint px. Reputation = 4-point star `#f2c14e` that fills tier-accent colored sockets (indigo→green→plum→crimson).
- **HUD:** hearts top-left (row of 8x8), stamina pips beneath; gold + rep top-right with icon-then-number; clock top-center as a small 24x10 walnut plaque, VT323.
- **Dialogue box:** bottom-anchored 456x64 panel (12px margins). Portrait left 24x24 in its own 28x28 stitched frame; **name tag styled as a fabric label** — small parchment `#e6cfa3` tab overlapping the box top-left, `#2a1f2b` text, one `#f2c14e` stitch px at each end. Text area 380px, 2 lines VT323 12px, typewriter 40 chars/s, `▼` bounce prompt.
- **Toast:** 160px-wide mini panel slides down from top-center, 8px tall stitch flourish; auto-dismiss 2.5s. Item toasts show icon + "+1 Moth Silk".
- **Fonts @480x270:** Press Start 2P — 8px UI headings/buttons, 16px title screen only. VT323 — 12px body dialogue, 10px numbers/tooltips. Never render either at fractional sizes; snap all text to whole pixels.

---

## 6. LIGHT & PARTICLES

**Day tint** = fullscreen multiply/overlay rect, lerped between stops (hold 11:00–16:00 clear):

| Time | Overlay rgba |
|---|---|
| 6:00 | `rgba(255, 190, 120, 0.18)` soft gold dawn |
| 12:00 | `rgba(0, 0, 0, 0)` clear |
| 18:00 | `rgba(255, 150, 80, 0.22)` amber dusk |
| 22:00 | `rgba(30, 40, 90, 0.42)` deep blue night |

After 19:00, windows/lamps draw an additive `#f2c14e` glow (radial, alpha 0.35, radius 12px) punched through the tint — the city becomes a constellation.

**Particle recipes:**
- **Drifting leaves (city/grove):** 1-3px quads, `#7aa74f`/`#c46a3f`, spawn top edge, fall 8-14px/s with sine sway ±6px, spin via frame-flip, ~10 alive.
- **Mill dust motes:** 1px `#e6cfa3` at 30% alpha, drift up-right 3px/s inside light-shaft rects only, ~25 alive, twinkle by alpha wobble.
- **Node sparkle:** 4-point twinkle on gatherables — draw a `#f2c14e` plus-sign growing 1→3→1 px over 600ms, 1px `#f3e5c8` core, every 1.5s per node.
- **Train steam:** 8px `#f3e5c8` circles at 70% alpha from the stack, grow +1px/100ms, fade over 1.4s, drift back with scroll.
- **Coronation confetti:** 2px squares in `#a32638` `#e0a933` `#f3e5c8` `#6d3a67`, burst 60 from screen top, fall 20px/s with strong sway, land and linger 2s on the carpet.

---

## 7. PARALLAX BACKDROPS (intro cinematic + title)

Scroll speeds relative to foreground = 1.0. Layers back-to-front:

1. **Sky gradient** — `#ffd9a0` (horizon) → `#7fb7c7` (zenith) at dawn; speed 0.
2. **Far mountains** — flat `#5a6b8c` peaks, snow caps `#f3e5c8`; speed 0.05.
3. **Hills** — `#4f7a3a` rolls with `#35592b` tree clumps; speed 0.15.
4. **Fields + hay bales** — `#7aa74f` strips, bale dots `#b5824a` with `#e6cfa3` tops; speed 0.35.
5. **Telegraph poles** — `#463a4b` posts with 1px sagging wire, every ~90px; speed 0.7.
6. **Rail bed** — gravel `#6f6a75`, sleepers `#5e3a22`, rails `#9a94a0` with `#f3e5c8` sun-glint px; speed 1.0.

**City arrival / title variant:** replace layers 2-4 with skyline `#463a4b` silhouette — cathedral spire + dome center, chimney rows exhaling `#8c7f78` smoke curls, window pinpricks `#f2c14e`; sky shifts to dusk `#ffb070`→`#6d3a67`. Title logo: Press Start 2P 16px "The Gilded Needle" in `#f2c14e` with `#2a1f2b` 1px drop, a needle-and-thread flourish underlining it in animated running stitch.

---

## 8. MUSIC (procedural WebAudio chiptune — loops of 8 bars, chords 2 bars each unless noted)

| Track | Key | BPM | Mood | Progression | Lead | Bass pattern |
|---|---|---|---|---|---|---|
| title | C major | 92 | Warm, hopeful, curtains opening | C – Am – F – G | Triangle, slow attack 80ms, gentle 5Hz vibrato | Root half-notes, walk up fifth on bar ends |
| train | D major | 112 | Chugging optimism, wind in hair | D – Bm – G – A | Square 25% duty, staccato, echo (150ms delay, 0.25 fb) | Eighth-note chug: root-root-fifth-root (wheel rhythm) |
| city | G major | 100 | Bustling folk market | G – Em – C – D | Square 50% duty, bouncy 8th melody, quick 10ms attack | Walking quarters: root-3rd-5th-3rd |
| shop | F major | 76 (3/4) | Cozy hearth waltz | F – Dm – B♭ – C | Sine, soft 120ms attack, sparse — leaves silence | Waltz oom-pah-pah: bass root beat 1, triangle 5th+octave chord stabs 2-3 |
| mill | A minor | 84 | Dusty, mysterious-but-cozy | Am – F – C – E | Triangle, long notes, 4Hz vibrato onset after 300ms | Root+fifth drone half-notes, octave drop each 4th bar |
| warehouse | D minor | 96 | Watery, playful-sneaky | Dm – B♭ – F – C | Square 12.5% duty, plucky 60ms decay "drips" | Syncopated root-octave hops on off-beats |
| grove | E minor | 72 | Lush, dreamy, green | Em – C – G – D | Sine with slow 3Hz vibrato + soft square echo doubling | Slow rising arpeggio: root-5th-octave over each chord |
| vault | C minor | 100 | Tense, held-breath | Cm – A♭ – Fm – G | Square 25% low-register, staccato, minimal | Pulsing eighth-note root ostinato; slips to D♭ for 2 beats each 4th bar |
| royal/finale | C major | 120 | Triumphant coronation | C – F – Am – G (final loop resolves G→C fanfare) | Square 50% "brass", fast attack, octave doubling | March: quarter root-root-fifth-octave + triangle timpani-thud on 1 |

Percussion everywhere = filtered noise: hat (highpass 6kHz, 30ms), snare (bandpass 1.8kHz, 80ms), kick (sine drop 120→50Hz, 90ms). Zones drop hats; vault keeps only the kick like a heartbeat.

---

## 9. SFX RECIPES (WebAudio oscillator sketches)

| SFX | Recipe |
|---|---|
| snip | Two square blips: 2200→1400 Hz downward sweep, 60ms each, 30ms apart — "shk-shk" |
| sew stitch (good) | Sine 660→880 Hz up-chirp, 80ms, quick decay |
| sew stitch (perfect) | Sine 880→1320 Hz, 100ms + layered square 1760 Hz sparkle 40ms tail — rings brighter |
| coin | Square 988 Hz (B5) 50ms → 1319 Hz (E6) 120ms decay, classic two-tone chime |
| pickup | Triangle sweep 523→1046 Hz over 100ms, soft attack — a pop of delight |
| hurt | Square 220→110 Hz down-slide, 200ms, slight pitch wobble; never harsh, more "oof" than scream |
| footstep | Noise burst through lowpass 400 Hz, 40ms, alternate ±10% volume per foot; stone variant lowpass 900 Hz |
| ui_click | Square 1200 Hz, 30ms, instant decay — dry thimble tap |
| doorbell | Two sines 1568 Hz (G6) + 1319 Hz (E6) struck 80ms apart, each 300ms exponential decay, ±3 Hz detune shimmer |
| train whistle | Two detuned triangles 440 + 554 Hz (A4+C♯5), 300ms swell attack, 900ms hold-fall — lonely and warm |
| fanfare | Square ascending C5-E5-G5 (120ms each) → C6 held 600ms with 6Hz vibrato + triangle octave under — coronation stinger |

Master bus: gentle lowpass at 9kHz + soft-knee compression so chiptune stays warm, not shrill. SFX duck music by -4dB for 200ms.
