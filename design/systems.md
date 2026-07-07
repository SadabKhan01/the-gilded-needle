# The Gilded Needle — Systems & Balance Design
Version 1.0 — Systems & Balance Designer. All ids are final snake_case data-table ids. All numbers are final unless playtest notes say otherwise.

---

## 1. FABRICS (16)

Rarity node weights (see §5): common 55%, uncommon 30%, rare 15%.

| id | Display Name | Tier | Zone | Rarity | Base Value (g) | Description |
|---|---|---|---|---|---|---|
| rough_cotton | Rough Cotton | 1 | old_mill | common | 3 | Scratchy off-white cotton, still smelling of mill dust. |
| burlap | Burlap | 1 | old_mill | common | 2 | Coarse sacking cloth; honest, itchy, everywhere. |
| plain_wool | Plain Wool | 1 | old_mill | uncommon | 5 | Undyed grey wool wound on abandoned bobbins. |
| mill_linen | Mill Linen | 1 | old_mill | rare | 8 | Fine linen from the mill's last good loom run. |
| indigo_calico | Indigo Calico | 2 | river_warehouse | common | 10 | Deep blue printed cotton, the dockworkers' favorite. |
| madder_wool | Madder Wool | 2 | river_warehouse | common | 9 | Warm brick-red wool dyed in river vats. |
| waxed_canvas | Waxed Canvas | 2 | river_warehouse | uncommon | 13 | Rain-shedding canvas that crackles softly when folded. |
| storm_flax | Storm Flax | 2 | river_warehouse | rare | 18 | Silvery-grey linen said to be woven during thunderstorms. |
| raw_silk | Raw Silk | 3 | silk_grove | common | 22 | Nubby ivory silk pulled from grove cocoons. |
| dew_satin | Dew Satin | 3 | silk_grove | common | 24 | Pale green satin with a sheen like wet leaves. |
| emerald_brocade | Emerald Brocade | 3 | silk_grove | uncommon | 32 | Leaf-patterned brocade grown thick with the garden. |
| mothwing_gauze | Mothwing Gauze | 3 | silk_grove | rare | 45 | Translucent gauze shed by the grove's giant fabric moths. |
| midnight_velvet | Midnight Velvet | 4 | palace_vaults | common | 55 | Blue-black velvet that drinks the lantern light. |
| cloth_of_gold | Cloth of Gold | 4 | palace_vaults | common | 60 | True metal-thread cloth from the old treasury looms. |
| ermine_trim | Ermine Trim | 4 | palace_vaults | uncommon | 75 | White winter fur bands reserved for crowned heads. |
| moonweave | Moonweave | 4 | palace_vaults | rare | 110 | Faintly glowing silver cloth; it hums when moonlight touches it. |

---

## 2. GARMENTS (18)

Craft margin target 1.8–2.5x ingredient value. Sell price = 1-star base; quality multiplies it (§6).

| id | Display Name | Tier | Recipe | Sell Price (g) | Description |
|---|---|---|---|---|---|
| patch_cap | Patch Cap | 1 | 2 rough_cotton | 13 | A jaunty patched cap for cold mornings. |
| burlap_apron | Burlap Apron | 1 | 2 burlap, 1 rough_cotton | 15 | Sturdy apron beloved by bakers and smiths. |
| simple_dress | Simple Dress | 1 | 3 rough_cotton | 20 | Plain, clean, and cut with more care than it cost. |
| wool_scarf | Wool Scarf | 1 | 2 plain_wool | 22 | Thick grey scarf; the poor quarter's winter armor. |
| mended_work_coat | Mended Work Coat | 1 | 2 burlap, 2 plain_wool | 30 | QUEST (early): old Tansy's coat, reborn with visible mending. |
| linen_shirt | Linen Shirt | 1 | 2 mill_linen, 1 rough_cotton | 40 | Crisp shirt that punches above the poor quarter. |
| calico_day_dress | Calico Day Dress | 2 | 3 indigo_calico | 65 | Blue printed dress for market days and river strolls. |
| canvas_work_jacket | Canvas Work Jacket | 2 | 2 waxed_canvas, 1 madder_wool | 75 | Rainproof jacket with a warm red lining. |
| madder_cloak | Madder Cloak | 2 | 3 madder_wool, 1 indigo_calico | 80 | Brick-red hooded cloak with indigo facing. |
| storm_coat | Storm Coat | 2 | 2 storm_flax, 2 waxed_canvas | 130 | Silver-grey overcoat that seems to repel bad weather. |
| silk_blouse | Silk Blouse | 3 | 2 raw_silk, 1 dew_satin | 145 | Ivory blouse with a satin collar; quiet luxury. |
| brocade_waistcoat | Brocade Waistcoat | 3 | 2 emerald_brocade, 1 raw_silk | 185 | Leaf-green waistcoat for gentlemen with opinions. |
| satin_evening_gown | Satin Evening Gown | 3 | 3 dew_satin, 1 raw_silk | 200 | Dew-sheen gown that turns heads at the opera. |
| gauze_ballgown | Gauze Ballgown | 3 | 2 mothwing_gauze, 2 dew_satin | 290 | Layered translucent gown that floats when she turns. |
| velvet_court_robe | Velvet Court Robe | 4 | 3 midnight_velvet, 1 cloth_of_gold | 470 | Midnight robe edged in gold; standard court armor. |
| gold_ceremony_mantle | Gold Ceremony Mantle | 4 | 2 cloth_of_gold, 2 ermine_trim | 560 | Blazing mantle for state occasions. |
| moonlit_stole | Moonlit Stole | 4 | 2 moonweave, 1 midnight_velvet | 580 | A stole that glows softly; royals fight over it politely. |
| coronation_gown | Coronation Gown | 4 | 3 moonweave, 2 cloth_of_gold, 1 ermine_trim | 1200 | QUEST (finale): the gown that crowns a queen — and a tailor's name. |

---

## 3. ECONOMY & PROGRESSION MATH

- **Starting gold:** 25.
- **Reputation:** one cumulative track, never decreases. Rep per sale = `tier x 10 x quality_mult`, rounded (quality_mult = 1.0 / 1.3 / 1.6 for 1/2/3 stars). So: tier 1 sale = 10–16 rep, tier 2 = 20–32, tier 3 = 30–48, tier 4 = 40–64. Quest turn-ins (mended_work_coat, coronation_gown) grant a flat bonus +20 rep on top of sale rep.

**Unlock thresholds** (customers, district gate, gathering zone, and recipes all unlock together at each threshold):

| Threshold | Rep | Unlocks |
|---|---|---|
| Tier 2 | 60 | Middle district, river_warehouse, tier-2 recipes & customers |
| Tier 3 | 200 | Noble district, silk_grove, tier-3 recipes & customers |
| Tier 4 | 450 | Palace gate, palace_vaults, tier-4 recipes & customers; royal commission quest begins |

**Expected pacing** (avg quality 2 stars, so avg rep/sale = tier x 13):

| Stage | Rep needed | Sales needed | Days | Real minutes (cumulative) |
|---|---|---|---|---|
| 0 → 60 (tier 2) | 60 | ~5 tier-1 sales | Days 1–2 | ~11 |
| 60 → 200 (tier 3) | 140 | ~5–6 tier-2 sales | Days 3–4 | ~22 |
| 200 → 450 (tier 4) | 250 | ~6–7 tier-3 sales | Days 5–6 | ~33 |
| Finale | — | gather vaults + coronation_gown + ceremony | Day 7 | ~38–42 |

Total arc: 7 in-game days ≈ 35–42 real minutes (players who sleep early shorten days; see §4).

**Worked example — Day 3 (rep 74, tier 2 just unlocked):** Wake 6:00 with 40g. Travel to river_warehouse, harvest 7 nodes (~9 fabric: 4 indigo_calico, 3 madder_wool, 1 waxed_canvas, 1 storm_flax; 56 stamina spent), take 2 hits from a guard_hound (-2 hp, -10 stamina). Back by 10:00; craft calico_day_dress (2 stars) and madder_cloak (3 stars). Customers 10:30–18:00: sell day dress for 65x1.3 = 84g (+26 rep), cloak for 80x1.6x1.0 = 128g (+32 rep). End of day: 252g, rep 132 — on pace for tier 3 by end of Day 4. Buys steel_shears (120g), sleeps.

---

## 4. DAY & STAMINA

- **Clock:** 6:00–24:00; **0.35 real seconds per in-game minute** → full day = 378s ≈ 6.3 min. Sleeping any time after 18:00 skips to next day 6:00 (typical played day: 4.5–5.5 real min). At 24:00 the heroine collapses asleep wherever she is; wakes in shop, no penalty except a yawn animation.
- **Stamina:** max 100 (120 with brass_bed). Costs: harvest a node **8**; scissor swipe **3**; hit by enemy **5**; crafting session **6** per garment. Regen: none during the day; **sleep restores all stamina and saves the game**. At 0 stamina: walk speed halved, harvesting disabled (swipes still allowed), heroine slumps visibly.
- **HP:** 6 half-hearts (hp 6). All enemies and hazards deal 1. Hearts refill fully on sleep. At 0 hp: screen tumbles to black with a soft "oh no…", wake in shop bed next morning **losing 25% of carried FABRICS** (rounded down per stack, min 0) — never garments, never gold.

---

## 5. GATHERING & HAZARDS

- **Nodes:** per zone visit — old_mill **7**, river_warehouse **7**, silk_grove **6**, palace_vaults **6**. Node = glowing fabric bundle; hold **E for 0.8s** (0.5s with steel_shears) with a sparkle burst on completion. Node rolls one zone fabric: common 55% / uncommon 30% / rare 15%; yields **2 units 40% of the time** (rare fabrics always yield 1). Nodes respawn on sleep (daily). Zones lock behind rep thresholds (§3).
- **Combat:** Space = scissor swipe, 1 damage in a short frontal arc, 0.4s cooldown, 3 stamina. Defeated enemies pop into a puff of thread; they respawn daily.

**Enemy roster** (all deal 1 damage on contact):

| id | Name | HP | Speed (px/s) | Behavior | Telegraph |
|---|---|---|---|---|---|
| fabric_moth | Fabric Moth | 1 | 40 | drift toward player, slow dive | wings shimmer gold 0.5s before dive |
| mill_rat | Mill Rat | 1 | 70 | patrol; charge within 48px | squeaks and rears up 0.4s |
| guard_hound | Guard Hound | 3 | 85 | guard a node cluster; charge intruders | bark + crouch 0.6s |
| silk_spinner | Silk Spinner | 2 | 30 | drift; short lunge | front legs curl 0.5s |
| dust_wisp | Dust Wisp | 1 | 55 | sine-wave drift, phases toward player | brightens to white 0.5s |
| clockwork_sentry | Clockwork Sentry | 3 | 50 | patrol fixed route; speed-burst on sight | eye lamp turns red 0.6s |

**Zone assignments & hazard tiles** (hazards deal 1 on step, with screen shake; 1s immunity after any hit):

| Zone | Enemies | Hazard tile |
|---|---|---|
| old_mill | fabric_moth x3, mill_rat x2 | loose_floorboard — snaps underfoot |
| river_warehouse | mill_rat x2, guard_hound x1 | dye_spill — stinging fumes, brief purple tint |
| silk_grove | fabric_moth x2, silk_spinner x2, dust_wisp x1 | thorn_bramble — overgrown rose canes |
| palace_vaults | dust_wisp x2, clockwork_sentry x2, guard_hound x1 | crumbling_floor — tile falls away after the shake, leaving a pit |

---

## 6. CRAFTING MINIGAME — "THE SEAM"

A needle marker sweeps left↔right along a horizontal seam bar; press **Space** while the needle is inside a golden segment to land a stitch. Gold segments re-randomize position per stitch. **3 stitches** per garment (tiers 1–3), **5 stitches** for tier 4. Missing every stitch still crafts the garment at 1 star.

| Tier | Gold zone width (fraction of bar) | Sweep time (one full traverse) |
|---|---|---|
| 1 | 22% | 1.6s |
| 2 | 18% | 1.4s |
| 3 | 14% | 1.2s |
| 4 | 10% | 1.0s |

**Quality:** 3-stitch garments — 3 hits = 3★, 2 hits = 2★, 0–1 = 1★. 5-stitch (tier 4) — 5 hits = 3★, 3–4 = 2★, 0–2 = 1★.
**Price multiplier:** 1★ x1.0, 2★ x1.3, 3★ x1.6 (also drives rep, §3).

---

## 7. CUSTOMERS

- Customers walk in only while the player is inside the shop, **8:00–18:00**. Arrival interval (in-game minutes), rolled uniformly:

| Rep | Interval |
|---|---|
| 0–59 | 65–75 |
| 60–199 | 55–70 |
| 200–449 | 50–60 |
| 450+ | 45–55 |

- **Customer tier:** weighted toward the highest unlocked tier — highest 50%, one below 30%, remaining lower tiers split 20%. (Tier 4 walk-ins are nobles shopping "for the palace"; true royal commissions are quest-driven, never walk-ins.)
- **Request:** 60% a specific unlocked garment id of their tier; 40% "any tier-N garment."
- **Payment** = sell price x quality mult (x1.0/x1.3/x1.6) x **tier-mood mult**: tier 1 x0.9 (they haggle), tier 2 x1.0, tier 3 x1.1, tier 4 x1.25. Round to whole gold.
- **Rep on sale** = tier x 10 x quality mult (§3). "Any-garment" requests earn the same rep as specific ones.
- No stock / wrong stock: customer sighs kindly and leaves. **No penalty of any kind.**

---

## 8. SHOP UPGRADES (gold sinks, bought at the shop counter menu)

| id | Name | Price (g) | Effect |
|---|---|---|---|
| steel_shears | Steel Shears | 120 | Harvest hold time 0.8s → 0.5s |
| oak_mannequin | Oak Mannequin | 250 | +10% on all garment sale payments |
| brass_bed | Brass Bed | 400 | Max stamina 100 → 120 |
| gilded_sign | Gilded Shop Sign | 600 | Customer arrival intervals reduced by a further 10 in-game minutes (floor 40) |

No carry limits in this game — the satchel is bottomless by design.

---

## 9. STARTING STATE

- **Inventory:** 4 rough_cotton, 1 simple_dress (grandmother's parting gift, pre-crafted at 2★).
- **Gold:** 25. **Rep:** 0. **Day 1, 6:00**, waking in the shop bed straight after the train cinematic. All tier-1 recipes known except mended_work_coat (granted by the quest); stamina 100/100, hp 6/6.

**Tutorial flow (Day 1):** The heroine wakes; a prompt teaches movement to the counter. Old Mrs. Tansy is waiting with a torn work coat — she asks for a **mended_work_coat**, unlocking the recipe and marking **old_mill** on the city map. Walking to the mill teaches the city hub and zone gate; inside, a guided harvest (hold E) on the first node and one fabric_moth encounter teach gathering and the scissor swipe. Back home, the sewing table runs a slowed-down first "seam" (gold zones 30% wide for this one craft). Selling the coat to Tansy (30g x quality, +10–16 rep, +20 quest bonus) opens normal customer traffic and displays the reputation bar with the 60-rep tier-2 marker. Sleeping ends the tutorial and saves.
