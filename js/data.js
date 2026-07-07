'use strict';
// The Gilded Needle — data.js (GAME DATA). Pure data + tiny helpers.
// Sources: design/systems.md (ids & numbers, verbatim), design/world.md (names, dialogue,
// narration, verbatim), design/CANON.md (quest table, enemy placement, NPC placement, music).
//
// Notes for integrators (no contract deviations):
// - Tier fields on fabrics/garments/npcs/zones are 1-based (1..4) exactly as in systems.md.
//   G.state.tier and G.Data.tiers are 0-based indexes (0..3); tierIdx = tier - 1.
// - The "QUEST (early)/(finale)" markers in systems.md garment descriptions are designer
//   annotations, not display prose — stripped from desc, preserved as quest:true flags.
// - All npc tx/ty are flagged approx:true per CANON: plausible coords for a 64x44 city /
//   22x14 shop / 26x16 palace_hall; the integrator fine-places them on walkable tiles.
// - conductor_cobb is included flagged cinematicOnly:true, map:null (CANON-sanctioned).
// - mrs_tansy's three lines are newly written per CANON in the world.md §8 tone.
window.G = window.G || {};

(function () {

  var Data = {};

  // ------------------------------------------------------------------
  // FABRICS — systems.md §1 (16). color = sensible hex for icon/UI tint.
  // ------------------------------------------------------------------
  Data.fabrics = {
    rough_cotton:    { id: 'rough_cotton',    name: 'Rough Cotton',    tier: 1, zone: 'old_mill',        rarity: 'common',   value: 3,   color: '#e4d8bc', desc: 'Scratchy off-white cotton, still smelling of mill dust.' },
    burlap:          { id: 'burlap',          name: 'Burlap',          tier: 1, zone: 'old_mill',        rarity: 'common',   value: 2,   color: '#ad8a56', desc: 'Coarse sacking cloth; honest, itchy, everywhere.' },
    plain_wool:      { id: 'plain_wool',      name: 'Plain Wool',      tier: 1, zone: 'old_mill',        rarity: 'uncommon', value: 5,   color: '#a19b93', desc: 'Undyed grey wool wound on abandoned bobbins.' },
    mill_linen:      { id: 'mill_linen',      name: 'Mill Linen',      tier: 1, zone: 'old_mill',        rarity: 'rare',     value: 8,   color: '#f3e5c8', desc: "Fine linen from the mill's last good loom run." },
    indigo_calico:   { id: 'indigo_calico',   name: 'Indigo Calico',   tier: 2, zone: 'river_warehouse', rarity: 'common',   value: 10,  color: '#3c568e', desc: "Deep blue printed cotton, the dockworkers' favorite." },
    madder_wool:     { id: 'madder_wool',     name: 'Madder Wool',     tier: 2, zone: 'river_warehouse', rarity: 'common',   value: 9,   color: '#ae4b2e', desc: 'Warm brick-red wool dyed in river vats.' },
    waxed_canvas:    { id: 'waxed_canvas',    name: 'Waxed Canvas',    tier: 2, zone: 'river_warehouse', rarity: 'uncommon', value: 13,  color: '#8f7f52', desc: 'Rain-shedding canvas that crackles softly when folded.' },
    storm_flax:      { id: 'storm_flax',      name: 'Storm Flax',      tier: 2, zone: 'river_warehouse', rarity: 'rare',     value: 18,  color: '#a9b6c4', desc: 'Silvery-grey linen said to be woven during thunderstorms.' },
    raw_silk:        { id: 'raw_silk',        name: 'Raw Silk',        tier: 3, zone: 'silk_grove',      rarity: 'common',   value: 22,  color: '#f7f0dc', desc: 'Nubby ivory silk pulled from grove cocoons.' },
    dew_satin:       { id: 'dew_satin',       name: 'Dew Satin',       tier: 3, zone: 'silk_grove',      rarity: 'common',   value: 24,  color: '#a8cf9a', desc: 'Pale green satin with a sheen like wet leaves.' },
    emerald_brocade: { id: 'emerald_brocade', name: 'Emerald Brocade', tier: 3, zone: 'silk_grove',      rarity: 'uncommon', value: 32,  color: '#2f7a4a', desc: 'Leaf-patterned brocade grown thick with the garden.' },
    mothwing_gauze:  { id: 'mothwing_gauze',  name: 'Mothwing Gauze',  tier: 3, zone: 'silk_grove',      rarity: 'rare',     value: 45,  color: '#c3b2d9', desc: "Translucent gauze shed by the grove's giant fabric moths." },
    midnight_velvet: { id: 'midnight_velvet', name: 'Midnight Velvet', tier: 4, zone: 'palace_vaults',   rarity: 'common',   value: 55,  color: '#262c4e', desc: 'Blue-black velvet that drinks the lantern light.' },
    cloth_of_gold:   { id: 'cloth_of_gold',   name: 'Cloth of Gold',   tier: 4, zone: 'palace_vaults',   rarity: 'common',   value: 60,  color: '#e0a933', desc: 'True metal-thread cloth from the old treasury looms.' },
    ermine_trim:     { id: 'ermine_trim',     name: 'Ermine Trim',     tier: 4, zone: 'palace_vaults',   rarity: 'uncommon', value: 75,  color: '#f8f3e6', desc: 'White winter fur bands reserved for crowned heads.' },
    moonweave:       { id: 'moonweave',       name: 'Moonweave',       tier: 4, zone: 'palace_vaults',   rarity: 'rare',     value: 110, color: '#d9e8f5', desc: 'Faintly glowing silver cloth; it hums when moonlight touches it.' },
  };

  // ------------------------------------------------------------------
  // GARMENTS — systems.md §2 (18). price = 1-star base sell price.
  // ------------------------------------------------------------------
  Data.garments = {
    patch_cap:            { id: 'patch_cap',            name: 'Patch Cap',            tier: 1, recipe: { rough_cotton: 2 },                                   price: 13,   desc: 'A jaunty patched cap for cold mornings.' },
    burlap_apron:         { id: 'burlap_apron',         name: 'Burlap Apron',         tier: 1, recipe: { burlap: 2, rough_cotton: 1 },                        price: 15,   desc: 'Sturdy apron beloved by bakers and smiths.' },
    simple_dress:         { id: 'simple_dress',         name: 'Simple Dress',         tier: 1, recipe: { rough_cotton: 3 },                                   price: 20,   desc: 'Plain, clean, and cut with more care than it cost.' },
    wool_scarf:           { id: 'wool_scarf',           name: 'Wool Scarf',           tier: 1, recipe: { plain_wool: 2 },                                     price: 22,   desc: "Thick grey scarf; the poor quarter's winter armor." },
    mended_work_coat:     { id: 'mended_work_coat',     name: 'Mended Work Coat',     tier: 1, recipe: { burlap: 2, plain_wool: 2 },                          price: 30,   quest: true, desc: "Old Tansy's coat, reborn with visible mending." },
    linen_shirt:          { id: 'linen_shirt',          name: 'Linen Shirt',          tier: 1, recipe: { mill_linen: 2, rough_cotton: 1 },                    price: 40,   desc: 'Crisp shirt that punches above the poor quarter.' },
    calico_day_dress:     { id: 'calico_day_dress',     name: 'Calico Day Dress',     tier: 2, recipe: { indigo_calico: 3 },                                  price: 65,   desc: 'Blue printed dress for market days and river strolls.' },
    canvas_work_jacket:   { id: 'canvas_work_jacket',   name: 'Canvas Work Jacket',   tier: 2, recipe: { waxed_canvas: 2, madder_wool: 1 },                   price: 75,   desc: 'Rainproof jacket with a warm red lining.' },
    madder_cloak:         { id: 'madder_cloak',         name: 'Madder Cloak',         tier: 2, recipe: { madder_wool: 3, indigo_calico: 1 },                  price: 80,   desc: 'Brick-red hooded cloak with indigo facing.' },
    storm_coat:           { id: 'storm_coat',           name: 'Storm Coat',           tier: 2, recipe: { storm_flax: 2, waxed_canvas: 2 },                    price: 130,  desc: 'Silver-grey overcoat that seems to repel bad weather.' },
    silk_blouse:          { id: 'silk_blouse',          name: 'Silk Blouse',          tier: 3, recipe: { raw_silk: 2, dew_satin: 1 },                         price: 145,  desc: 'Ivory blouse with a satin collar; quiet luxury.' },
    brocade_waistcoat:    { id: 'brocade_waistcoat',    name: 'Brocade Waistcoat',    tier: 3, recipe: { emerald_brocade: 2, raw_silk: 1 },                   price: 185,  desc: 'Leaf-green waistcoat for gentlemen with opinions.' },
    satin_evening_gown:   { id: 'satin_evening_gown',   name: 'Satin Evening Gown',   tier: 3, recipe: { dew_satin: 3, raw_silk: 1 },                         price: 200,  desc: 'Dew-sheen gown that turns heads at the opera.' },
    gauze_ballgown:       { id: 'gauze_ballgown',       name: 'Gauze Ballgown',       tier: 3, recipe: { mothwing_gauze: 2, dew_satin: 2 },                   price: 290,  desc: 'Layered translucent gown that floats when she turns.' },
    velvet_court_robe:    { id: 'velvet_court_robe',    name: 'Velvet Court Robe',    tier: 4, recipe: { midnight_velvet: 3, cloth_of_gold: 1 },              price: 470,  desc: 'Midnight robe edged in gold; standard court armor.' },
    gold_ceremony_mantle: { id: 'gold_ceremony_mantle', name: 'Gold Ceremony Mantle', tier: 4, recipe: { cloth_of_gold: 2, ermine_trim: 2 },                  price: 560,  desc: 'Blazing mantle for state occasions.' },
    moonlit_stole:        { id: 'moonlit_stole',        name: 'Moonlit Stole',        tier: 4, recipe: { moonweave: 2, midnight_velvet: 1 },                  price: 580,  desc: 'A stole that glows softly; royals fight over it politely.' },
    coronation_gown:      { id: 'coronation_gown',      name: 'Coronation Gown',      tier: 4, recipe: { moonweave: 3, cloth_of_gold: 2, ermine_trim: 1 },    price: 1200, quest: true, desc: "The gown that crowns a queen — and a tailor's name." },
  };

  // ------------------------------------------------------------------
  // NPCS — world.md §5 (10) + mrs_tansy (CANON). Lines verbatim.
  // Placement per CANON; tx/ty approx:true — integrator fine-places.
  // Tier: 1 poor, 2 middle, 3 noble, 4 royal.
  // ------------------------------------------------------------------
  Data.npcs = {
    odile_marchand: {
      id: 'odile_marchand', name: 'Odile Marchand', role: 'Retired Tailor & Landlady', tier: 2,
      map: 'shop', tx: 4, ty: 4, dir: 'down', approx: true,
      lines: {
        greet: ["Rent's due when the month is, and the kettle's on when it isn't. In you come."],
        hint: ["The Weftworks past Cinder Row — my old suppliers left half their stock to rot there.",
               "Mind the floorboards. And the moths. Mostly the moths."],
        warm: ["Brida Thimm's granddaughter under my roof. Ha. She'd have laughed her needle loose.",
               "She'd also have been proud, girl. So am I."],
      },
    },
    conductor_cobb: {
      id: 'conductor_cobb', name: 'Conductor Cobb', role: 'Conductor of the 7:12', tier: 1,
      map: null, tx: 0, ty: 0, dir: 'down', cinematicOnly: true,
      lines: {
        greet: ["Ticket! ...Ah, the Hartsfell flag-down.",
                "Sit anywhere, miss, the whole carriage is first class if you close one eye."],
        hint: ["Freight manifest says half of Auberlin's cloth sits impounded down the Madder Docks.",
               "Shame, that. Somebody handy ought to do something about it."],
        warm: ["I pass Hartsfell twice a week. Say the word and I'll wave at the mountain for you."],
      },
    },
    berta_klee: {
      id: 'berta_klee', name: 'Berta Klee', role: 'Washerwoman of Cinder Row', tier: 1,
      map: 'city', tx: 11, ty: 21, dir: 'right', approx: true,
      lines: {
        greet: ["New needle on the square! Let's see your hands.",
                "Hm. Honest calluses. You'll do."],
        hint: ["Millspun from the Weftworks washes up lovely if you can get it past them lintmoths.",
               "Take my old beater-paddle— no? Suit yourself, scissors it is."],
        warm: ["Winter coat you made Tomas fits like a hug, love.",
               "Cinder Row looks after its own, and you're ours now."],
      },
    },
    sylvie_marsh: {
      id: 'sylvie_marsh', name: 'Sylvie Marsh', role: 'Of Marsh & Daughter, Dyes', tier: 2,
      map: 'city', tx: 31, ty: 35, dir: 'right', approx: true,
      lines: {
        greet: ["You're the needle from the square! I'm the daughter from the sign.",
                "We should be friends immediately."],
        hint: ["Papa's 'spoiled' lots at the bonded warehouse are barely spoiled — the excise man just can't tell madder from mud.",
               "Dye-rats can, mind. Watch your satchel."],
        warm: ["When you're famous, tell everyone your reds were Marsh reds.",
               "And when I run the company, your thread is free."],
      },
    },
    countess_elowen: {
      id: 'countess_elowen', name: 'Countess Elowen Larkspur', role: 'Mistress of Larkspur House', tier: 3,
      map: 'city', tx: 52, ty: 19, dir: 'left', approx: true,
      lines: {
        greet: ["A tailor who walks instead of bowing and scraping her way up the boulevard.",
                "How refreshing. Do come in before you develop manners."],
        hint: ["My grandmother's silk garden still fruits, after a fashion.",
               "Mind Pom and Frideric — they have never once caught a burglar but they do try so hard."],
        warm: ["This sleeve. My dear girl.",
               "I have not worn a new gown since the old queen's day — you may consider that habit broken."],
      },
    },
    steward_quill: {
      id: 'steward_quill', name: 'Steward Reinholt Quill', role: 'Royal Steward', tier: 4,
      map: 'city', tx: 33, ty: 6, dir: 'down', approx: true,
      lines: {
        greet: ["You have thirty seconds of my day.",
                "...You are Thimm's granddaughter. You have five minutes of my day."],
        hint: ["The moonweave sleeps in the Underspool, past the Queen's Old Gate.",
               "The Warden Loom still patrols. It was wound in 1861 and no one living knows how to make it stop."],
        warm: ["Your grandmother was robbed of her place in the palace ledger.",
               "I was a page then, and said nothing. Allow an old man to say something now."],
      },
    },
    corvin_alba: {
      id: 'corvin_alba', name: 'Corvin Alba', role: 'Of Alba & Sons, Royal Tailors', tier: 3,
      map: 'city', tx: 49, ty: 23, dir: 'up', approx: true,
      lines: {
        greet: ["Ah, the plaza shop. How... rustic.",
                "Do keep the moth population down, won't you? For the neighborhood."],
        hint: ["Grovesilk? You? Those hounds would eat a mountain girl whole.",
               "Though I suppose dogs do like anything sausage-fed."],
        warm: ["The gown was better than mine. Both of them were.",
               "...My grandfather kept her sketch, you know. He looked at it every day of his life."],
      },
    },
    pim: {
      id: 'pim', name: 'Pim', role: "Baker's Boy", tier: 1,
      map: 'city', tx: 29, ty: 25, dir: 'up', approx: true,
      lines: {
        greet: ["EXTRA! New tailor on the square! That's you! You're the extra!"],
        hint: ["The dye-rats at the docks? I seen a BLUE one.",
               "Blue as jam. Well jam's not blue but if it WAS."],
        warm: ["Mum says the patch on my elbow's so good I've got to stop climbing things.",
               "I'm not going to stop climbing things."],
      },
    },
    iva: {
      id: 'iva', name: 'Iva the Herb-Seller', role: 'Stall-Keeper by the Fountain', tier: 1,
      map: 'city', tx: 36, ty: 20, dir: 'down', approx: true,
      lines: {
        greet: ["Rosemary for remembrance, lavender for moths, and a good morning for free."],
        hint: ["Old proverb: 'What the palace forgets, the cellar keeps.'",
               "Made that one up in 1861, when a mountain girl went down under the Crownway and came up pale."],
        warm: ["Brida bought lavender here every market day.",
               "You stand just like her, you know. Like a needle: straight, and pointed somewhere."],
      },
    },
    princess_adelina: {
      id: 'princess_adelina', name: 'Princess Adelina', role: 'Heir to Auberlin', tier: 4,
      map: 'palace_hall', tx: 13, ty: 4, dir: 'down', approx: true,
      lines: {
        greet: ["Please don't bow, the crown isn't on yet and my neck aches just thinking of it."],
        hint: ["They say moonweave shows the wearer's true measure — it dims on liars.",
               "You understand my concern with being sewn into it."],
        warm: ["Make me a gown I can't lie in, Marielle.",
               "If I'm to be queen, let the cloth keep me honest."],
      },
    },
    mrs_tansy: {
      id: 'mrs_tansy', name: 'Mrs. Tansy', role: 'Neighbor from Cinder Row', tier: 1,
      map: 'shop', tx: 11, ty: 9, dir: 'down', approx: true, scripted: true,
      lines: {
        greet: ["Speak into the left ear, dearie — the right one retired in '58.",
                "Now, my old coat's gone at both elbows, and winter doesn't knock first."],
        hint: ["Burlap and good grey wool, that's what a working coat wants.",
               "The Weftworks is full of both, if the moths haven't had it first."],
        warm: ["Warm as fresh bread, this coat. My Henrik would've asked who I was showing off for.",
               "I've told all of Cinder Row about you — twice, in case they heard wrong the first time."],
      },
    },
  };

  // ------------------------------------------------------------------
  // ZONES — systems.md §1/§5 + CANON (display names, enemies, music).
  // nodeCount = nodes per visit (systems.md §5). hazard = hazard-tile flavor.
  // ------------------------------------------------------------------
  Data.zones = {
    old_mill: {
      id: 'old_mill', name: 'The Weftworks', theme: 'mill', mapId: 'old_mill', tier: 1, danger: 1,
      fabrics: ['rough_cotton', 'burlap', 'plain_wool', 'mill_linen'],
      enemies: [{ type: 'fabric_moth', count: 3 }, { type: 'mill_rat', count: 2 }],
      nodeCount: 7, hazard: 'loose_floorboard', music: 'mill',
      desc: 'An abandoned textile mill on the smoky edge of town — silent looms, slumped bolts of cloth, and shafts of dusty light. Bolt-ends the creditors never bothered to haul away still sleep in the storerooms.',
    },
    river_warehouse: {
      id: 'river_warehouse', name: 'The Madder Docks', theme: 'warehouse', mapId: 'river_warehouse', tier: 2, danger: 2,
      fabrics: ['indigo_calico', 'madder_wool', 'waxed_canvas', 'storm_flax'],
      enemies: [{ type: 'mill_rat', count: 3 }, { type: 'fabric_moth', count: 1 }],
      nodeCount: 7, hazard: 'dye_spill', music: 'warehouse',
      desc: "A riverside dye-warehouse district of brick vaults and rocking jetties, its puddles stained crimson, indigo, and gold. The excise office sells 'spoiled' lots cheap to anyone brave enough to fetch them.",
    },
    silk_grove: {
      id: 'silk_grove', name: 'The Larkspur Silk Garden', theme: 'grove', mapId: 'silk_grove', tier: 3, danger: 3,
      fabrics: ['raw_silk', 'dew_satin', 'emerald_brocade', 'mothwing_gauze'],
      enemies: [{ type: 'guard_hound', count: 2 }, { type: 'silk_spinner', count: 2 }],
      nodeCount: 6, hazard: 'thorn_bramble', music: 'grove',
      desc: "An overgrown silkworm estate behind the Countess's townhouse, cocoons glinting in the leaves like pale lanterns. Wild grovesilk waits in the untended nets — with the Countess's blessing, once earned.",
    },
    palace_vaults: {
      id: 'palace_vaults', name: 'The Underspool', theme: 'vault', mapId: 'palace_vaults', tier: 4, danger: 4,
      fabrics: ['midnight_velvet', 'cloth_of_gold', 'ermine_trim', 'moonweave'],
      enemies: [{ type: 'dust_wisp', count: 2 }, { type: 'clockwork_sentry', count: 2 }],
      nodeCount: 6, hazard: 'crumbling_floor', music: 'vault',
      desc: 'Forgotten vaults beneath the old palace, where the royal fabric reserve of a previous century sleeps under dust sheets. Here — and only here — lies moonweave.',
    },
  };

  // ------------------------------------------------------------------
  // ENEMIES — systems.md §5 roster (all deal 1 contact damage).
  // Speeds in px/s; telegraphTime in seconds before the attack.
  // ------------------------------------------------------------------
  Data.enemies = {
    fabric_moth:      { id: 'fabric_moth',      name: 'Fabric Moth',      hp: 1, speed: 40, damage: 1, behavior: 'drift_dive',    telegraphTime: 0.5, telegraph: 'wings shimmer gold before dive' },
    mill_rat:         { id: 'mill_rat',         name: 'Mill Rat',         hp: 1, speed: 70, damage: 1, behavior: 'patrol_charge', telegraphTime: 0.4, telegraph: 'squeaks and rears up', chargeRange: 48 },
    guard_hound:      { id: 'guard_hound',      name: 'Guard Hound',      hp: 3, speed: 85, damage: 1, behavior: 'guard_charge',  telegraphTime: 0.6, telegraph: 'bark + crouch' },
    silk_spinner:     { id: 'silk_spinner',     name: 'Silk Spinner',     hp: 2, speed: 30, damage: 1, behavior: 'drift_lunge',   telegraphTime: 0.5, telegraph: 'front legs curl' },
    dust_wisp:        { id: 'dust_wisp',        name: 'Dust Wisp',        hp: 1, speed: 55, damage: 1, behavior: 'sine_phase',    telegraphTime: 0.5, telegraph: 'brightens to white' },
    clockwork_sentry: { id: 'clockwork_sentry', name: 'Clockwork Sentry', hp: 3, speed: 50, damage: 1, behavior: 'patrol_burst',  telegraphTime: 0.6, telegraph: 'eye lamp turns red' },
  };

  // ------------------------------------------------------------------
  // TIERS — repNeed cumulative (systems.md §3), priceMult = tier-mood
  // mult (systems.md §7). color/light = G.Palette key strings.
  // ------------------------------------------------------------------
  Data.tiers = [
    { id: 'poor',   name: 'Poor',   district: 'Cinder Row',         repNeed: 0,   priceMult: 0.9,  color: 'poorIndigo',  light: 'poorFade' },
    { id: 'middle', name: 'Middle', district: 'Ribbon Row',         repNeed: 60,  priceMult: 1.0,  color: 'marketGreen', light: 'terracottaPale' },
    { id: 'noble',  name: 'Noble',  district: 'Larkspur Boulevard', repNeed: 200, priceMult: 1.1,  color: 'plum',        light: 'silver' },
    { id: 'royal',  name: 'Royal',  district: 'Crownway',           repNeed: 450, priceMult: 1.25, color: 'crimson',     light: 'goldRegal' },
  ];

  // ------------------------------------------------------------------
  // QUESTS — the exact 12-step CANON table, in order. goal.qty for
  // 'rep' goals = rep threshold to reach. reward.take = garment removed
  // (an NPC receives it); reward.unlock = recipe learned; reward.flag
  // set true on G.state.flags.
  // ------------------------------------------------------------------
  Data.quests = [
    {
      id: 'stitch_one', title: 'Stitch One',
      desc: 'Meet your landlady and take the keys to the shop.',
      hint: 'Talk to Odile Marchand in the shop',
      goal: { type: 'talk', target: 'odile_marchand' },
      reward: { rep: 5 },
      payoff: "Odile hands over the keys and marks the Weftworks on your map. 'Your grandmother stood in this doorway once. Didn't buy anything. Just looked.'",
    },
    {
      id: 'moths_in_the_weftworks', title: 'Moths in the Weftworks',
      desc: 'Brave the lintmoths and bring back cloth from the abandoned mill.',
      hint: 'Gather 8 fabrics in the Weftworks (west, past Cinder Row)',
      goal: { type: 'gather', tier: 1, qty: 8 },
      reward: { rep: 10, unlock: 'mended_work_coat' },
      payoff: 'Among the silent looms, a half-finished baby blanket — Marielle quietly finishes three stitches by hand. Berta hears about it by sundown.',
    },
    {
      id: 'tansys_coat', title: "Tansy's Coat",
      desc: "Mend Mrs. Tansy's poor torn coat — visible stitches and all.",
      hint: 'Craft a Mended Work Coat at the sewing table',
      goal: { type: 'craft', target: 'mended_work_coat', qty: 1 },
      reward: { gold: 40, rep: 35, take: 'mended_work_coat' },
      payoff: 'Mrs. Tansy pays in coin and gossip. By evening, all of Cinder Row knows the new needle on the square.',
    },
    {
      id: 'cinder_rows_own', title: "Cinder Row's Own",
      desc: 'Dress the poor quarter and earn your first regulars.',
      hint: 'Sell 3 garments to customers',
      goal: { type: 'sell', qty: 3 },
      reward: { rep: 10 },
      payoff: "'Cinder Row looks after its own,' Berta declares, 'and you're ours now.' Pim starts shouting about it immediately.",
    },
    {
      id: 'barely_spoiled', title: 'Barely Spoiled',
      desc: 'Earn enough of a name for Ribbon Row to open its stalls to you.',
      hint: 'Reach 60 reputation',
      goal: { type: 'rep', qty: 60 },
      reward: { gold: 20 },
      payoff: "Sylvie's father extends shop credit, and the Madder Docks open for business. The excise man still can't tell madder from mud.",
    },
    {
      id: 'the_fairday_dress', title: 'The Fairday Dress',
      desc: 'Sew Sylvie a dress fit for the Ribbon Fair.',
      hint: 'Craft a Calico Day Dress',
      goal: { type: 'craft', target: 'calico_day_dress', qty: 1 },
      reward: { rep: 15 },
      payoff: "Sylvie wears the dress under the Ribbon Arch, and a certain countess's housekeeper takes note. Corvin Alba pays his first sneering visit.",
    },
    {
      id: 'the_boulevard_beckons', title: 'The Boulevard Beckons',
      desc: 'Earn a reputation the boulevard cannot ignore.',
      hint: 'Reach 200 reputation',
      goal: { type: 'rep', qty: 200 },
      reward: { gold: 40 },
      payoff: "An invitation arrives in the Countess's spidery hand. The gate to the Silk Garden stands open.",
    },
    {
      id: 'tea_with_the_countess', title: 'Tea with the Countess',
      desc: "Gather wild grovesilk from the Countess's garden.",
      hint: 'Gather 6 Raw Silk in the Silk Garden',
      goal: { type: 'gather', target: 'raw_silk', qty: 6 },
      reward: { rep: 15 },
      payoff: "In the glasshouse waits a perfectly preserved silk rosebud. 'My sister made those,' Elowen says quietly — 'it's been waiting for hands like yours.'",
    },
    {
      id: 'the_boulevard_bows', title: 'The Boulevard Bows',
      desc: 'Sew the Countess an evening gown worthy of new silk.',
      hint: 'Craft a Satin Evening Gown',
      goal: { type: 'craft', target: 'satin_evening_gown', qty: 1 },
      reward: { gold: 220, rep: 20, take: 'satin_evening_gown' },
      payoff: 'Elowen wears new silk for the first time in decades, and Larkspur Boulevard bows. Corvin files a complaint — and Steward Quill comes to investigate personally.',
    },
    {
      id: 'the_name_in_the_ledger', title: 'The Name in the Ledger',
      desc: 'Earn a name that even the palace ledger must record.',
      hint: 'Reach 450 reputation',
      goal: { type: 'rep', qty: 450 },
      reward: {},
      payoff: "The truth of 1861: Brida Thimm sewed the old queen's coronation gown, and Alba's grandfather took the credit. Quill unlocks the Queen's Old Gate — 'Go and earn it twice.'",
    },
    {
      id: 'the_underspool', title: 'The Underspool',
      desc: 'Fetch moonweave from the vaults beneath the palace.',
      hint: 'Gather 3 Moonweave in the Underspool',
      goal: { type: 'gather', target: 'moonweave', qty: 3 },
      reward: { rep: 20, unlock: 'coronation_gown' },
      payoff: "Beside Brida's unreturned work docket, a hidden drawer: her original coronation sketch, initialed B.T. Marielle carries sketch and moonweave into the light.",
    },
    {
      id: 'a_gown_that_cant_lie', title: "A Gown That Can't Lie",
      desc: "Sew the gown that will crown a queen — and a tailor's name.",
      hint: 'Craft the Coronation Gown',
      goal: { type: 'craft', target: 'coronation_gown', qty: 1 },
      reward: { rep: 20, flag: 'readyForEnding' },
      payoff: "Corvin sees Brida's sketch and withdraws his own gown himself. The coronation will be dressed by The Gilded Needle — take it to the palace.",
    },
  ];

  // ------------------------------------------------------------------
  // CUSTOMERS — systems.md §7. Walk-ins only while player is in the
  // shop, 8:00–18:00. Intervals are in-game minutes; pick the entry
  // with the highest rep <= current rep (see Data.customerInterval).
  // ------------------------------------------------------------------
  Data.customers = {
    openHours: [480, 1080],          // 8:00–18:00 in minutes
    spawnMinutes: [65, 75],          // base interval (rep 0–59)
    spawnByRep: [
      { rep: 0,   min: 65, max: 75 },
      { rep: 60,  min: 55, max: 70 },
      { rep: 200, min: 50, max: 60 },
      { rep: 450, min: 45, max: 55 },
    ],
    // Tier roll: highest unlocked 50%, one below 30%, remaining lower tiers split 20%.
    tierWeights: { highest: 0.5, below: 0.3, rest: 0.2 },
    specificChance: 0.6,             // 60% ask for a specific unlocked garment of their tier
    moodMults: [0.9, 1.0, 1.1, 1.25],// tier-mood payment mult by 0-based tier index
    patience: 60,                    // in-game minutes a walk-in browses before leaving (sensible default; systems.md sets no penalty for leaving)
  };

  // ------------------------------------------------------------------
  // UPGRADES — systems.md §8 (gold sinks, bought at the shop counter).
  // ------------------------------------------------------------------
  Data.upgrades = {
    steel_shears:  { id: 'steel_shears',  name: 'Steel Shears',      price: 120, desc: 'Harvest hold time 0.8s becomes 0.5s.',                          effect: { harvestTime: 0.5 } },
    oak_mannequin: { id: 'oak_mannequin', name: 'Oak Mannequin',     price: 250, desc: '+10% on all garment sale payments.',                            effect: { saleBonus: 0.10 } },
    brass_bed:     { id: 'brass_bed',     name: 'Brass Bed',         price: 400, desc: 'Max stamina 100 becomes 120.',                                  effect: { maxSta: 120 } },
    gilded_sign:   { id: 'gilded_sign',   name: 'Gilded Shop Sign',  price: 600, desc: 'Customers arrive 10 in-game minutes sooner (floor 40).',       effect: { intervalReduce: 10, intervalFloor: 40 } },
  };

  // ------------------------------------------------------------------
  // BALANCE — systems.md §3–§6 constants, for systems/ui to share.
  // ------------------------------------------------------------------
  Data.balance = {
    qualityMults: [1.0, 1.3, 1.6],    // 1★ / 2★ / 3★ price & rep multiplier
    repPerSaleBase: 10,               // rep = tier(1..4) * 10 * qualityMult, rounded
    questTurnInRepBonus: 20,          // flat bonus rep on quest garment turn-ins
    hpMax: 6,                         // 6 half-hearts; all enemies/hazards deal 1
    staminaMax: 100,                  // 120 with brass_bed
    staminaCosts: { harvest: 8, swipe: 3, hitByEnemy: 5, craft: 6 },
    collapseFabricLoss: 0.25,         // lose 25% of carried fabrics (per stack, floor, min 0)
    clock: { dayStart: 360, dayEnd: 1440, secPerGameMinute: 0.35, sleepSkipAfter: 1080 },
    harvest: { holdTime: 0.8, holdTimeShears: 0.5, doubleYieldChance: 0.4 }, // rares always yield 1
    rarityWeights: { common: 55, uncommon: 30, rare: 15 },
    swipe: { damage: 1, cooldown: 0.4 },
    hazardTileDamage: 1,              // 'x' tiles; 1s immunity after any hit
    seam: {                            // crafting minigame, by 0-based tier index
      stitches:  [3, 3, 3, 5],
      goldWidth: [0.22, 0.18, 0.14, 0.10],  // fraction of bar
      sweepTime: [1.6, 1.4, 1.2, 1.0],      // seconds, one full traverse
      firstCraftGoldWidth: 0.30,            // widened for the first-ever craft
    },
  };

  // ------------------------------------------------------------------
  // START — systems.md §9 starting state.
  // ------------------------------------------------------------------
  Data.start = {
    gold: 25, rep: 0, tier: 0,
    day: 1, time: 360,
    map: 'shop',
    hp: 6, maxHp: 6, sta: 100, maxSta: 100,
    fabrics: { rough_cotton: 4 },
    garments: { simple_dress: [2] },   // grandmother's parting gift, pre-crafted at 2★
    // All tier-1 recipes known except mended_work_coat (granted by quest step 2).
    recipes: ['patch_cap', 'burlap_apron', 'simple_dress', 'wool_scarf', 'linen_shirt'],
  };

  // ------------------------------------------------------------------
  // STRINGS — world.md §2 intro beats, §7 ending + epilogue, plus UI text.
  // ------------------------------------------------------------------
  Data.strings = {
    // Opening cinematic — 9 beats, narration verbatim from world.md §2.
    intro: [
      { visual: 'stitch',         text: 'Grandmother always said a life is sewn one stitch at a time. She never said how far the thread might run.' },
      { visual: 'village',        text: 'Hartsfell gave me wool, weather, and everyone I had ever known. Grandmother Brida gave me the rest.' },
      { visual: 'tin',            text: 'She left me a ticket she never used, and a needle that never bends. I intended to be worthy of both.' },
      { visual: 'station_flag',   text: 'The 7:12 to Auberlin only stops in Hartsfell if you flag it down. I flagged.' },
      { visual: 'train_ride',     text: 'The mountains let go of me slowly, the way Grandmother folded cloth — never in a hurry, never by accident.' },
      { visual: 'train_interior', text: "Sixteen hours, one apple, and eleven dresses I drew for people I hadn't met yet." },
      { visual: 'night_lights',   text: 'And then — Auberlin. A city stitched entirely out of lamplight.' },
      { visual: 'station_city',   text: 'They say every street here wears a different coat. Well. Somebody has to mend them.' },
      { visual: 'shopfront',      text: 'Stitch one.' },
    ],

    // Coronation narration — verbatim from world.md §7, one line per slow beat.
    ending: [
      'The bell rang, and Auberlin held its breath the way a seamstress holds a thread — gently, and with everything.',
      'Queen Adelina walked the long carpet in a gown that could not lie, and it shone the whole way down.',
      'In the third row stood a washerwoman, a dye-merchant\'s daughter, a countess, and a baker\'s boy who would not stop waving.',
      'And in the palace ledger, in fresh ink under an entry sixty years old, the steward wrote two names: Brida Thimm. Marielle Thimm.',
      'Grandmother always said a life is sewn one stitch at a time.',
      'She never said the last stitch could shine.',
    ],
    epilogue: 'The Gilded Needle stands on Spindle Square to this day — and every street in Auberlin, from Cinder Row to the Crownway, wears its coats.',
    byRoyalAppointment: 'The shop of Marielle Thimm — by royal appointment',

    // Morning greetings — G.Time.sleep() picks one for the wake-up toast.
    morning: [
      'A new day on Spindle Square.',
      'Six o\'clock. Kettle first.',
      'The doorbell waits. Ting.',
      'Fresh thread, fresh morning.',
      'Auberlin is up before you.',
      'Light the lamp, thread the needle.',
    ],

    // Tier-up fanfare, indexed by the NEW 0-based tier index (1..3 used in play).
    tierUp: [
      'Cinder Row is open to you.',
      'Ribbon Row is open to you — and the Madder Docks with it!',
      'Larkspur Boulevard is open to you — and the Silk Garden with it!',
      'The Crownway is open to you — the Queen\'s Old Gate waits.',
    ],

    // Zone-locked lines, indexed by the ZONE's 0-based tier index (1..3 used).
    zoneLocked: [
      'The mill door hangs open. In you go.',
      'The dock gate is bolted. The excise men only deal with a name they know. (Reputation 60)',
      'The garden gate is locked. The Countess receives only tailors of standing. (Reputation 200)',
      'The Queen\'s Old Gate stays bricked to strangers. The palace must know your name first. (Reputation 450)',
    ],

    collapse: 'oh no...',
    collapseWake: 'You wake at home. Some of the satchel\'s fabric didn\'t make it back.',
    midnight: 'Midnight. The needle drops from her hand...',

    misc: {
      title: 'The Gilded Needle',
      subtitle: "A Tailor's Tale",
      newGame: 'New Game',
      continueGame: 'Continue',
      skip: 'Skip',
      saved: 'Stitched into the ledger. (Saved)',
      sleepPrompt: 'Turn in for the night?',
      staminaOut: 'Too tired to gather. Best sleep soon.',
      notEnoughFabric: 'Not enough fabric.',
      customerLeaves: 'The customer sighs kindly and leaves.',
      recipeUnlocked: 'New pattern learned!',
      shopClosed: 'The shop keeps hours: 8:00 to 18:00.',
      controls: 'WASD/Arrows — move · Space — swipe · E — interact · I — inventory · Esc — pause',
    },
  };

  // Heroine & world proper names (CANON).
  Data.heroine = { name: 'Marielle Thimm', nick: 'Mari' };
  Data.world = { city: 'Auberlin', village: 'Hartsfell', mentor: 'Grandmother Brida Thimm', shop: 'The Gilded Needle', square: 'Spindle Square' };

  // ------------------------------------------------------------------
  // Tiny helpers (pure lookups; no cross-module access).
  // ------------------------------------------------------------------

  // All fabric objects gatherable in a zone, in table order.
  Data.fabricsByZone = function (zoneId) {
    var zone = Data.zones[zoneId];
    if (!zone) return [];
    var out = [];
    for (var i = 0; i < zone.fabrics.length; i++) {
      var f = Data.fabrics[zone.fabrics[i]];
      if (f) out.push(f);
    }
    return out;
  };

  // Roll one fabric id for a node in a zone using rarity weights (55/30/15).
  Data.rollZoneFabric = function (zoneId) {
    var pool = Data.fabricsByZone(zoneId);
    if (!pool.length) return null;
    var weights = Data.balance.rarityWeights;
    var total = 0, i;
    for (i = 0; i < pool.length; i++) total += weights[pool[i].rarity] || 0;
    var r = Math.random() * total;
    for (i = 0; i < pool.length; i++) {
      r -= weights[pool[i].rarity] || 0;
      if (r < 0) return pool[i].id;
    }
    return pool[pool.length - 1].id;
  };

  // Garment objects of a given tier (1..4), in table order.
  Data.garmentsByTier = function (tier) {
    var out = [];
    for (var id in Data.garments) {
      if (Data.garments[id].tier === tier) out.push(Data.garments[id]);
    }
    return out;
  };

  // Highest 0-based tier index unlocked at a given rep.
  Data.tierForRep = function (rep) {
    var idx = 0;
    for (var i = 0; i < Data.tiers.length; i++) {
      if (rep >= Data.tiers[i].repNeed) idx = i;
    }
    return idx;
  };

  // Customer arrival interval [min,max] (in-game minutes) for a rep value.
  // Pass reduceBy (e.g. 10 for gilded_sign) to apply the upgrade, floored at 40.
  Data.customerInterval = function (rep, reduceBy) {
    var rows = Data.customers.spawnByRep;
    var row = rows[0];
    for (var i = 0; i < rows.length; i++) {
      if (rep >= rows[i].rep) row = rows[i];
    }
    var lo = row.min, hi = row.max;
    if (reduceBy) {
      lo = Math.max(40, lo - reduceBy);
      hi = Math.max(40, hi - reduceBy);
    }
    return [lo, hi];
  };

  // Quest lookup by id → index into Data.quests, or -1.
  Data.questIndex = function (id) {
    for (var i = 0; i < Data.quests.length; i++) {
      if (Data.quests[i].id === id) return i;
    }
    return -1;
  };

  G.Data = Data;

})();
