# CANON — binding conflict resolutions & addenda

Where design docs disagree, THIS file wins. Rule of thumb applied: `world.md` wins names/story/dialogue,
`systems.md` wins ids/numbers/recipes, `art.md` wins colors/aesthetics.

## Names
- Heroine: **Marielle Thimm** ("Mari"). art.md §3 calls her "Odette" — superseded; the visual spec itself stands.
- City: **Auberlin**. Village: **Hartsfell**. Mentor: **Grandmother Brida Thimm**. Shop: **The Gilded Needle**, Spindle Square.
- Districts: Cinder Row (W, poor), Ribbon Row (S, market), Larkspur Boulevard (E, noble), Crownway (N, palace).
- Zone display names: old_mill "The Weftworks", river_warehouse "The Madder Docks", silk_grove "The Larkspur Silk Garden", palace_vaults "The Underspool".

## Numbers & ids (systems.md wins)
- Rep thresholds: tier 2 = **60**, tier 3 = **200**, tier 4 = **450**. world.md's "rep 10/25/50/80" quest numbers are superseded.
- coronation_gown recipe: **3 moonweave + 2 cloth_of_gold + 1 ermine_trim** (world.md's "5 moonweave + 2 grovesilk" superseded).
- Fabric/garment name mapping (world.md prose → systems.md ids):
  Millspun Cotton→rough_cotton, Homespun Wool→plain_wool, Riverflax Linen→indigo_calico,
  Madder Damask→madder_wool, Grovesilk→raw_silk, Fairday Dress→calico_day_dress,
  Verdigris Evening Gown→satin_evening_gown, Patched Winter Coat→mended_work_coat.

## Zone enemies (stats from systems.md §5; placement adjusted to fit the story)
- old_mill: fabric_moth ×3, mill_rat ×2
- river_warehouse: mill_rat ×3, fabric_moth ×1
- silk_grove: guard_hound ×2 (they ARE Pom & Frideric — name them in dialogue, not HUD), silk_spinner ×2
- palace_vaults: dust_wisp ×2, clockwork_sentry ×2
- Flavor names in dialogue only ("lintmoths", "dye-rats"); HUD/data use systems display names.

## Visual addenda (extends art.md §4)
- silk_spinner: 14×12 pale ivory spinneret-critter — body #f3e5c8/#c0c3cf, legs #8c7f78, front-legs-curl telegraph.
- dust_wisp: 12×14 translucent wisp — #e6cfa3 at ~70% alpha, #f2c14e core pixel, brightens to white before its dive.
- Walk-in customers: generic sprites `customer_<tier>_<n>` for tier ∈ poor|middle|noble|royal, n ∈ 0..1 (8 total),
  palette-swapped per art.md §4 class language. Systems picks one at random per customer.

## Extra NPCs
- **mrs_tansy** (tier 1): tutorial customer, scripted Day-1 visit to the shop with a torn coat. Warm, tiny, deaf in one ear. 3 lines in tone-guide voice (data.js writes them).
- **conductor_cobb**: intro cinematic cameo only, not a walkable NPC.
- **princess_adelina**: palace_hall / ending only.
- Walkable NPC placement: shop → odile_marchand; city plaza → pim, iva; Cinder Row arm → berta_klee; Ribbon Row arm → sylvie_marsh; Larkspur arm → countess_elowen, corvin_alba (near Alba & Sons); Crownway arm → steward_quill (near palace gate). data.js sets tx/ty using maps.js hints; the integrator verifies every NPC stands on a walkable tile.

## Canonical quest arc (12 sequential steps, ONE goal each — replaces world.md §6 structure; keeps its story beats & payoff lines)
| # | id | title | goal | reward | payoff (see world.md §6 for full flavor) |
|---|----|-------|------|--------|------------------------------------------|
| 1 | stitch_one | Stitch One | talk: odile_marchand | rep +5 | Keys to the shop; the Weftworks marked |
| 2 | moths_in_the_weftworks | Moths in the Weftworks | gather: 8 tier-1 fabrics (any) | rep +10, unlock recipe mended_work_coat | Swipe tutorial; the abandoned baby blanket |
| 3 | tansys_coat | Tansy's Coat | craft: mended_work_coat ×1 | gold +40, rep +35, take: mended_work_coat | Mrs. Tansy pays & tells all of Cinder Row |
| 4 | cinder_rows_own | Cinder Row's Own | sell: 3 garments | rep +10 | Berta: "you're ours now" |
| 5 | barely_spoiled | Barely Spoiled | rep: 60 | gold +20 | Sylvie's credit; Madder Docks open (tier 2) |
| 6 | the_fairday_dress | The Fairday Dress | craft: calico_day_dress ×1 | rep +15 | Sylvie under the Ribbon Arch; Corvin's first sneer |
| 7 | the_boulevard_beckons | The Boulevard Beckons | rep: 200 | gold +40 | The Countess's invitation; Silk Garden opens (tier 3) |
| 8 | tea_with_the_countess | Tea with the Countess | gather: raw_silk ×6 | rep +15 | The silk rosebud in the glasshouse |
| 9 | the_boulevard_bows | The Boulevard Bows | craft: satin_evening_gown ×1 | gold +220, rep +20, take: satin_evening_gown | Elowen wears new silk; Corvin complains; Quill investigates |
| 10 | the_name_in_the_ledger | The Name in the Ledger | rep: 450 | — | The 1861 truth; Queen's Old Gate opens (tier 4) |
| 11 | the_underspool | The Underspool | gather: moonweave ×3 | rep +20 | Brida's docket and the original sketch |
| 12 | a_gown_that_cant_lie | A Gown That Can't Lie | craft: coronation_gown ×1 | rep +20 | Corvin withdraws his gown; "take it to the palace" |

- After step 12 completes: `flags.readyForEnding = true`; the palace_hall portal on Crownway becomes active;
  entering palace_hall with that flag plays the **ending** scene. (No step 13.)
- goal.type 'take' in rewards = remove that garment from inventory (an NPC receives it).
- Recipe knowledge: all tier-1 recipes known at start EXCEPT mended_work_coat (step 2 reward); tier 2/3/4
  recipes unlock at their rep thresholds; coronation_gown unlocks at step 11 completion.
- First-ever craft uses widened 30% gold zones (flags.firstCraftDone).

## SPEC addenda
- shop map object MUST expose `sewingTable: {tx,ty}` and `counter: {tx,ty}` (two 'T' clusters are otherwise ambiguous).
- Music per map: city→'city', shop→'shop', old_mill→'mill', river_warehouse→'warehouse', silk_grove→'grove',
  palace_vaults→'vault', palace_hall→'royal'; title scene 'title', intro 'train'.
- Parallax strips: 'sky_day', 'sky_dusk', 'mountains', 'hills', 'fields', 'poles', 'rails', 'city_skyline'.
- Tutorial (systems.md §9) is expressed through quest steps 1–4 + UI prompts; there is no separate tutorial system.
