'use strict';
// The Gilded Needle — maps.js
// Owns G.Maps. Maps are built programmatically on a char grid (guaranteed
// rectangular), then parsed into { rows, solidAt, charAt, portals, spawn,
// nodeSpots, ... } per SPEC. Solidity table mirrors the SPEC legend exactly
// (art-tiles.js implements the same table; tools/check can diff them).

window.G = window.G || {};

(function () {

  // SPEC tile legend — solid chars. Must match art-tiles.js.
  var SOLID = {
    '#': 1, 'B': 1, 'w': 1, 't': 1, 'F': 1, 'l': 1, 'c': 1,
    'T': 1, 'S': 1, 'm': 1, 'r': 1, 'h': 1, 'e': 1, '_': 1, ' ': 1,
    // cozy-revamp props: sofa, fireplace, mannequin, coffee station,
    // clothes rack, plant, shopfront window, shop sign ('u' rug is walkable)
    'o': 1, 'k': 1, 'M': 1, 'C': 1, 'R': 1, 'P': 1, 'W': 1, 'Q': 1,
    'K': 1, 'O': 1, 'a': 1, 'd': 1, 'A': 1, 's': 1, 'N': 1, 'i': 1,
  };

  // ---------------------------------------------------------------- builder

  function mk(w, h, fill) {
    var g = { w: w, h: h, cells: new Array(w * h) };
    for (var i = 0; i < w * h; i++) g.cells[i] = fill;
    return g;
  }
  function set(g, x, y, ch) {
    if (x >= 0 && y >= 0 && x < g.w && y < g.h) g.cells[y * g.w + x] = ch;
  }
  function get(g, x, y) {
    if (x < 0 || y < 0 || x >= g.w || y >= g.h) return ' ';
    return g.cells[y * g.w + x];
  }
  function rect(g, x, y, w, h, ch) {
    for (var yy = y; yy < y + h; yy++)
      for (var xx = x; xx < x + w; xx++) set(g, xx, yy, ch);
  }
  function frame(g, x, y, w, h, ch) {
    for (var xx = x; xx < x + w; xx++) { set(g, xx, y, ch); set(g, xx, y + h - 1, ch); }
    for (var yy = y; yy < y + h; yy++) { set(g, x, yy, ch); set(g, x + w - 1, yy, ch); }
  }
  function put(g, ch, spots) { // spots: [[x,y],...]
    for (var i = 0; i < spots.length; i++) set(g, spots[i][0], spots[i][1], ch);
  }
  // replace some '.' with ',' for painterly ground variety
  function speckle(g, prob) {
    for (var i = 0; i < g.cells.length; i++) {
      if (g.cells[i] === '.' && Math.random() < prob) g.cells[i] = ',';
    }
  }
  function rows(g) {
    var out = [];
    for (var y = 0; y < g.h; y++) {
      var s = '';
      for (var x = 0; x < g.w; x++) s += g.cells[y * g.w + x];
      out.push(s);
    }
    return out;
  }

  // ---------------------------------------------------------------- city

  function buildCity() {
    var g = mk(64, 44, '#');

    // Spindle Square — central plaza
    rect(g, 22, 15, 20, 14, '=');
    rect(g, 30, 20, 4, 4, '=');
    rect(g, 31, 21, 2, 2, 'w');                       // spool fountain
    put(g, 'f', [[23, 16], [40, 16], [23, 27], [40, 27], [30, 19], [33, 24]]);
    put(g, 'l', [[24, 17], [39, 17], [24, 26], [39, 26]]);

    // The Gilded Needle — storybook shopfront NW of the plaza, now closer
    // to the reference facade: cream masonry, warm display windows, sign,
    // ivy/flower boxes, and an obvious center door.
    rect(g, 20, 8, 9, 6, 'B');
    put(g, 'W', [[21, 12], [22, 12], [26, 12], [27, 12]]);
    set(g, 24, 10, 'Q');
    set(g, 24, 13, 'Q');
    set(g, 24, 14, 'D');                              // shop door → landing (24,15)
    put(g, 'f', [[21, 14], [22, 14], [26, 14], [27, 14], [20, 15], [28, 15]]);
    put(g, 'P', [[19, 14], [29, 13]]);
    set(g, 19, 15, 't');                              // little topiary
    set(g, 29, 12, 'l');                              // warm lamp by hanging sign

    // West arm — Cinder Row (poor quarter)
    rect(g, 2, 18, 20, 6, '-');
    for (var cx = 2; cx <= 21; cx++) {
      set(g, cx, 17, (cx % 2 === 0) ? 'B' : '#');
      set(g, cx, 24, (cx % 3 === 0) ? 'B' : '#');
    }
    put(g, 'g', [[6, 19], [14, 22], [18, 19]]);
    put(g, 'f', [[9, 23]]);
    put(g, 'c', [[4, 23], [16, 18]]);                 // rag-carts & washing troughs
    set(g, 2, 20, 'D');                               // gate → The Weftworks

    // South arm — Ribbon Row (market)
    rect(g, 28, 29, 8, 13, '-');
    for (var ry = 30; ry <= 40; ry += 3) {
      set(g, 27, ry, 'c');                            // market stalls flanking
      set(g, 36, ry, 'T');
    }
    put(g, 'f', [[29, 31], [34, 37]]);
    put(g, 'l', [[28, 34], [35, 30]]);
    set(g, 31, 42, 'D');                              // river stairs → Madder Docks

    // East arm — Larkspur Boulevard (noble)
    rect(g, 42, 18, 20, 6, '-');
    for (var tx = 43; tx <= 59; tx += 4) {
      set(g, tx, 17, 't');                            // plane trees in iron cages
      set(g, tx + 2, 24, 'l');                        // gas lamps
    }
    rect(g, 56, 17, 3, 1, 'B');                       // Alba & Sons atelier
    put(g, 'F', [[44, 24], [48, 17], [52, 24]]);
    put(g, 'f', [[46, 19], [57, 22]]);
    set(g, 61, 20, 'D');                              // garden gate → Silk Garden

    // North arm — Crownway (palace approach)
    rect(g, 29, 2, 6, 13, '=');
    for (var ly = 3; ly <= 12; ly += 3) {
      set(g, 28, ly, 'l');                            // banner poles
      set(g, 35, ly, 'l');
    }
    set(g, 35, 5, 'D');                               // the Queen's Old Gate → Underspool
    set(g, 31, 1, 'D');                               // grand palace door → palace_hall
    put(g, 'f', [[30, 13], [33, 3]]);

    speckle(g, 0.0); // plaza/roads keep their chars; grass none here
    return {
      id: 'city', name: 'Spindle Square', theme: 'city', music: 'city',
      grid: g,
      spawn: { tx: 32, ty: 26 },
      portals: [
        { tx: 24, ty: 14, to: 'shop',            ttx: 14, tty: 28, dir: 'up',    label: 'The Gilded Needle' },
        { tx: 2,  ty: 20, to: 'old_mill',        ttx: 20, tty: 27, dir: 'up',    label: 'The Weftworks' },
        { tx: 31, ty: 42, to: 'river_warehouse', ttx: 21, tty: 27, dir: 'up',    label: 'The Madder Docks' },
        { tx: 61, ty: 20, to: 'silk_grove',      ttx: 20, tty: 29, dir: 'up',    label: 'The Larkspur Silk Garden' },
        { tx: 35, ty: 5,  to: 'palace_vaults',   ttx: 21, tty: 29, dir: 'up',    label: "The Queen's Old Gate" },
        { tx: 31, ty: 1,  to: 'palace_hall',     ttx: 13, tty: 13, dir: 'up',    label: 'The Palace' },
      ],
      hints: {
        berta_klee: { tx: 11, ty: 21 }, sylvie_marsh: { tx: 31, ty: 35 },
        countess_elowen: { tx: 52, ty: 19 }, corvin_alba: { tx: 49, ty: 23 },
        steward_quill: { tx: 33, ty: 6 }, pim: { tx: 29, ty: 25 }, iva: { tx: 36, ty: 20 },
      },
    };
  }

  // ---------------------------------------------------------------- shop

  function buildShop() {
    // The atelier — a long, cozy top-down shop: hearth lounge, work tables,
    // wardrobe displays, coffee/check-out counter, and a front door at bottom.
    var g = mk(28, 30, '#');
    rect(g, 1, 1, 26, 28, '.');

    // north wall: fireplace, hanging plants, shelves, coffee service
    put(g, 'k', [[2, 1]]);
    put(g, 'K', [[3, 1]]);
    put(g, 'i', [[7, 1], [12, 1], [17, 1]]);
    put(g, 'S', [[20, 1], [21, 1]]);
    set(g, 24, 1, 'C');
    set(g, 26, 2, 'P');

    // hearth lounge from the concept: rug, sofa, low table, plants
    rect(g, 1, 5, 7, 6, 'u');
    set(g, 2, 7, 'o');
    set(g, 3, 7, 'O');
    set(g, 5, 8, 'h');
    put(g, 'P', [[1, 11], [6, 4]]);

    // left-window sewing stations and fabric spools
    put(g, 'B', [[1, 14], [1, 18], [1, 22]]);
    put(g, 'm', [[4, 15], [4, 20]]);
    put(g, 's', [[5, 15], [5, 20]]);
    put(g, 'S', [[2, 24], [3, 24]]);
    rect(g, 3, 25, 3, 3, 'u');
    set(g, 4, 26, 'M');

    // central cutting/catalog tables: patterns, shears, bolts below
    put(g, 'a', [[12, 7], [12, 19]]);
    put(g, 'd', [[13, 7], [13, 19]]);
    put(g, 'A', [[14, 7], [14, 19]]);
    put(g, 'h', [[16, 8], [16, 20]]);
    put(g, 'S', [[12, 10], [13, 10], [14, 22]]);

    // right wall: wardrobe racks, try-on mannequins, counter and coffee
    put(g, 'R', [[26, 7], [26, 8], [26, 9], [26, 10], [26, 11], [26, 12]]);
    put(g, 'S', [[26, 17], [26, 18], [26, 22], [26, 23], [26, 24]]);
    rect(g, 22, 12, 3, 3, 'u');
    set(g, 23, 13, 'M');
    set(g, 24, 22, 'M');
    set(g, 24, 26, 'e');
    set(g, 22, 5, 'T');
    set(g, 23, 5, 'N');
    set(g, 24, 5, 'T');
    put(g, 'P', [[22, 16], [24, 20], [25, 27]]);

    // warm entry, with a little mat like the exterior reference
    rect(g, 12, 27, 5, 1, 'u');
    set(g, 14, 29, 'D');                              // door to the plaza
    speckle(g, 0.35);
    return {
      id: 'shop', name: 'The Gilded Needle', theme: 'shop', music: 'shop',
      grid: g,
      spawn: { tx: 14, ty: 28 },
      sewingTable: { tx: 4, ty: 15 },
      catalogTable: { tx: 13, ty: 7 },
      counter: { tx: 23, ty: 5 },
      sofa: { seats: [{ tx: 2, ty: 7 }, { tx: 3, ty: 7 }] },
      portals: [
        { tx: 14, ty: 29, to: 'city', ttx: 24, tty: 15, dir: 'down', label: 'Spindle Square' },
      ],
      hints: { odile_marchand: { tx: 9, ty: 12 }, mrs_tansy: { tx: 20, ty: 7 } },
    };
  }

  // ---------------------------------------------------------------- old_mill

  function buildMill() {
    var g = mk(42, 30, '#');
    rect(g, 2, 2, 38, 26, '.');
    // silent loom rows
    rect(g, 6, 5, 3, 1, 'm'); rect(g, 14, 5, 3, 1, 'm'); rect(g, 24, 5, 3, 1, 'm'); rect(g, 32, 5, 3, 1, 'm');
    rect(g, 8, 11, 3, 1, 'm'); rect(g, 18, 11, 3, 1, 'm'); rect(g, 28, 11, 3, 1, 'm');
    rect(g, 6, 17, 3, 1, 'm'); rect(g, 16, 17, 3, 1, 'm'); rect(g, 26, 17, 3, 1, 'm'); rect(g, 34, 17, 3, 1, 'm');
    // slumped bolts, rubble, crates
    put(g, 'r', [[12, 8], [30, 9], [5, 21], [22, 14], [36, 22], [10, 25]]);
    put(g, 'c', [[3, 9], [38, 7], [20, 22], [33, 25]]);
    put(g, 'g', [[7, 24], [28, 24], [17, 8], [4, 11], [36, 14], [24, 25]]);
    put(g, 'P', [[4, 24], [38, 21], [22, 3]]);
    // storeroom partitions (little rooms that make gathering feel like exploring)
    rect(g, 2, 13, 1, 3, '#'); rect(g, 12, 2, 1, 2, '#'); rect(g, 30, 26, 1, 2, '#');
    // rotten floorboards on the old walkways
    put(g, 'x', [[13, 9], [14, 9], [26, 15], [27, 15], [18, 20], [18, 21], [8, 14]]);
    // fabric nodes — tucked in corners and behind looms
    put(g, 'n', [[4, 4], [37, 4], [4, 25], [37, 25], [20, 4], [10, 14], [30, 14], [15, 24], [27, 20]]);
    set(g, 20, 28, 'D');
    speckle(g, 0.18);
    return {
      id: 'old_mill', name: 'The Weftworks', theme: 'mill', music: 'mill', zone: 'old_mill',
      grid: g,
      spawn: { tx: 20, ty: 27 },
      portals: [
        { tx: 20, ty: 28, to: 'city', ttx: 3, tty: 20, dir: 'right', label: 'Cinder Row' },
      ],
    };
  }

  // ------------------------------------------------------- river_warehouse

  function buildWarehouse() {
    var g = mk(44, 30, '#');
    rect(g, 2, 2, 40, 26, '.');
    // the canal, with plank bridges
    rect(g, 34, 2, 3, 26, 'w');
    rect(g, 34, 9, 3, 1, 'b');
    rect(g, 34, 20, 3, 1, 'b');
    // bonded storage partitions
    rect(g, 10, 2, 1, 6, '#'); rect(g, 20, 10, 6, 1, '#'); rect(g, 10, 18, 1, 8, '#'); rect(g, 26, 2, 1, 5, '#');
    // dye vats & crates staining the puddles
    put(g, 'c', [[5, 4], [6, 4], [14, 6], [22, 4], [30, 5], [13, 14], [23, 16], [5, 22], [17, 24], [30, 23]]);
    put(g, 'r', [[8, 12], [28, 12]]);
    put(g, 'g', [[3, 26], [32, 3], [12, 9], [31, 21], [39, 14]]);
    put(g, 'P', [[3, 3], [40, 26], [26, 8]]);
    // dye spills — stinging fumes
    put(g, 'x', [[7, 8], [8, 8], [24, 13], [25, 13], [15, 20], [15, 21], [29, 18]]);
    // impounded fabric lots
    put(g, 'n', [[4, 6], [15, 4], [9, 15], [20, 25], [28, 7], [30, 16], [39, 6], [39, 24], [25, 21]]);
    set(g, 21, 28, 'D');
    speckle(g, 0.16);
    return {
      id: 'river_warehouse', name: 'The Madder Docks', theme: 'warehouse', music: 'warehouse', zone: 'river_warehouse',
      grid: g,
      spawn: { tx: 21, ty: 27 },
      portals: [
        { tx: 21, ty: 28, to: 'city', ttx: 31, tty: 41, dir: 'up', label: 'Ribbon Row' },
      ],
    };
  }

  // ------------------------------------------------------------ silk_grove

  function buildGrove() {
    var g = mk(42, 32, '#');
    rect(g, 2, 2, 38, 28, '.');
    // mulberry stands
    put(g, 't', [[5, 4], [6, 5], [12, 3], [18, 6], [25, 4], [8, 10], [15, 13], [22, 11],
                 [5, 17], [12, 20], [20, 18], [28, 16], [7, 26], [16, 27], [26, 25], [33, 22], [36, 5]]);
    // hedge lines partitioning the garden rooms
    rect(g, 10, 8, 8, 1, 'F'); rect(g, 24, 14, 1, 8, 'F'); rect(g, 4, 22, 10, 1, 'F');
    // the milky glasshouse
    frame(g, 28, 4, 9, 7, 'B');
    set(g, 32, 10, '.');                              // its doorway
    // overgrowth & thorn brambles
    put(g, 'g', [[4, 8], [14, 5], [21, 24], [30, 27], [11, 16], [34, 18], [19, 21],
                 [8, 28], [24, 6], [36, 26]]);
    put(g, 'P', [[3, 12], [27, 12], [35, 28]]);
    put(g, 'f', [[9, 6], [17, 19], [29, 24], [35, 12]]);
    put(g, 'x', [[13, 10], [14, 10], [23, 22], [23, 23], [31, 19], [9, 24]]);
    // cocoon nets — wild grovesilk
    put(g, 'n', [[5, 6], [13, 12], [6, 24], [18, 28], [31, 6], [34, 8], [26, 19], [37, 26]]);
    set(g, 20, 30, 'D');
    speckle(g, 0.22);
    return {
      id: 'silk_grove', name: 'The Larkspur Silk Garden', theme: 'grove', music: 'grove', zone: 'silk_grove',
      grid: g,
      spawn: { tx: 20, ty: 29 },
      portals: [
        { tx: 20, ty: 30, to: 'city', ttx: 60, tty: 20, dir: 'left', label: 'Larkspur Boulevard' },
      ],
    };
  }

  // --------------------------------------------------------- palace_vaults

  function buildVaults() {
    var g = mk(44, 32, '#');
    // three vaulted halls joined by stairs — always at least one fair route
    rect(g, 2, 4, 40, 4, '.');    // north hall
    rect(g, 2, 14, 40, 4, '.');   // middle hall
    rect(g, 2, 24, 40, 4, '.');   // south hall
    rect(g, 5, 4, 3, 24, '.');    // west stair
    rect(g, 20, 4, 3, 24, '.');   // center stair
    rect(g, 36, 4, 3, 24, '.');   // east stair
    // alcoves off the corridors (hide from the Warden Loom)
    put(g, '.', [[4, 3], [15, 3], [30, 3], [10, 13], [28, 13], [15, 23], [33, 23], [41, 15]]);
    // black cisterns & crumbling floors
    rect(g, 12, 15, 3, 2, '_'); rect(g, 28, 25, 3, 2, '_');
    put(g, 'x', [[11, 15], [15, 16], [10, 5], [11, 5], [27, 25], [31, 26], [24, 15], [25, 15], [33, 5], [6, 25]]);
    // dust-sheeted reserve: crates, rubble, one spilling chest
    put(g, 'c', [[3, 5], [17, 6], [32, 6], [8, 16], [30, 17], [12, 26], [25, 27], [40, 26]]);
    put(g, 'r', [[26, 5], [18, 16], [38, 25], [7, 6]]);
    put(g, 'g', [[6, 8], [19, 14], [37, 18], [11, 24], [34, 27]]);
    put(g, 'P', [[4, 13], [39, 13]]);
    // the royal fabric reserve
    put(g, 'n', [[3, 6], [40, 5], [3, 26], [40, 24], [21, 15], [10, 26], [30, 5], [37, 15]]);
    set(g, 21, 30, 'D');
    rect(g, 21, 28, 1, 2, '.');   // stair up to the door
    set(g, 21, 30, 'D');
    speckle(g, 0.14);
    return {
      id: 'palace_vaults', name: 'The Underspool', theme: 'vault', music: 'vault', zone: 'palace_vaults',
      grid: g,
      spawn: { tx: 21, ty: 29 },
      portals: [
        { tx: 21, ty: 30, to: 'city', ttx: 34, tty: 5, dir: 'left', label: "The Queen's Old Gate" },
      ],
    };
  }

  // ----------------------------------------------------------- palace_hall

  function buildPalaceHall() {
    var g = mk(26, 16, '#');
    rect(g, 2, 2, 22, 12, '=');
    // the long carpet, door to dais
    rect(g, 12, 3, 2, 11, '-');
    // columns & banners
    put(g, '#', [[6, 5], [6, 10], [19, 5], [19, 10]]);
    put(g, 'l', [[4, 3], [21, 3], [4, 12], [21, 12]]);
    put(g, 'f', [[8, 3], [17, 3]]);
    // twin thrones on the dais
    put(g, 'T', [[12, 2], [13, 2]]);
    set(g, 13, 14, 'D');
    return {
      id: 'palace_hall', name: 'The Palace', theme: 'palace', music: 'royal',
      grid: g,
      spawn: { tx: 13, ty: 13 },
      portals: [
        { tx: 13, ty: 14, to: 'city', ttx: 31, tty: 2, dir: 'down', label: 'Crownway' },
      ],
      hints: { princess_adelina: { tx: 13, ty: 4 } },
    };
  }

  // ---------------------------------------------------------------- parse

  var maps = {};

  function finalize(def) {
    var g = def.grid;
    var m = {
      id: def.id, name: def.name, theme: def.theme, music: def.music,
      zone: def.zone || null,
      w: g.w, h: g.h,
      rows: rows(g),
      portals: def.portals || [],
      spawn: def.spawn,
      nodeSpots: [],
      hints: def.hints || {},
    };
    if (def.sewingTable) m.sewingTable = def.sewingTable;
    if (def.catalogTable) m.catalogTable = def.catalogTable;
    if (def.counter) m.counter = def.counter;
    if (def.sofa) m.sofa = def.sofa;

    // validate rectangularity + collect nodes
    for (var y = 0; y < m.h; y++) {
      if (m.rows[y].length !== m.w) {
        console.error('Map "' + m.id + '" row ' + y + ' length ' + m.rows[y].length + ' != ' + m.w);
      }
      for (var x = 0; x < m.w; x++) {
        if (m.rows[y].charAt(x) === 'n') m.nodeSpots.push({ tx: x, ty: y });
      }
    }

    m.charAt = function (tx, ty) {
      if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return ' ';
      return m.rows[ty].charAt(tx);
    };
    m.solidAt = function (tx, ty) {
      if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return true;
      return !!SOLID[m.rows[ty].charAt(tx)];
    };
    return m;
  }

  G.Maps = {
    SOLID: SOLID,

    init: function () {
      var defs = [buildCity(), buildShop(), buildMill(), buildWarehouse(),
                  buildGrove(), buildVaults(), buildPalaceHall()];
      for (var i = 0; i < defs.length; i++) {
        maps[defs[i].id] = finalize(defs[i]);
      }
      // sanity: every portal must land on a walkable tile of an existing map
      for (var id in maps) {
        var ps = maps[id].portals;
        for (var p = 0; p < ps.length; p++) {
          var dest = maps[ps[p].to];
          if (!dest) { console.error('Portal from ' + id + ' to unknown map ' + ps[p].to); continue; }
          if (dest.solidAt(ps[p].ttx, ps[p].tty)) {
            console.error('Portal ' + id + ' -> ' + ps[p].to + ' lands on solid tile ' + ps[p].ttx + ',' + ps[p].tty);
          }
        }
      }
    },

    get: function (id) { return maps[id] || null; },
  };

})();
