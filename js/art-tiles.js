'use strict';
// The Gilded Needle — art-tiles.js
// Owns G.Tiles: themed 16x16 procedural tiles for the SPEC legend, plus
// parallax backdrop strips (train cinematic + title). Colors from G.Palette
// per design/art.md §2/§7. Solidity table mirrors SPEC (and maps.js).

window.G = window.G || {};

(function () {

  var TILE = 16;

  var SOLID = {
    '#': 1, 'B': 1, 'w': 1, 't': 1, 'F': 1, 'l': 1, 'c': 1,
    'T': 1, 'S': 1, 'm': 1, 'r': 1, 'h': 1, 'e': 1, '_': 1, ' ': 1,
    'o': 1, 'k': 1, 'M': 1, 'C': 1, 'R': 1, 'P': 1, 'W': 1, 'Q': 1,
    // atelier detail pass: fireplace/sofa right halves, cutting table
    // left/mid/right, sewing side table, register, hanging plant
    'K': 1, 'O': 1, 'a': 1, 'd': 1, 'A': 1, 's': 1, 'N': 1, 'i': 1,
  };

  // fixed speckle patterns (deterministic — tiles must not shimmer per load)
  var SPECK_A = [[3, 2], [9, 5], [13, 11], [5, 12], [11, 14], [1, 7]];
  var SPECK_B = [[2, 9], [7, 3], [12, 7], [4, 14], [14, 2], [8, 11], [10, 1]];

  function prand(i) { // deterministic pseudo-random 0..1
    var v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  }

  function mkCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  // ------------------------------------------------------------- themes
  // t = { g:[dark,mid,light] ground, path:[d,m,l], wall:[dark,mid,light],
  //       accent, accent2, glass }
  function themes() {
    var P = G.Palette;
    return {
      village:     { g: [P.meadow1, P.meadow2, P.meadow3], path: [P.bark1, P.bark2, P.bark3],   wall: [P.bark1, P.bark2, P.parchment],  accent: P.poorIndigo, accent2: P.terracotta },
      train:       { g: [P.stone1, P.stone2, P.taupe],     path: [P.stone1, P.stone2, P.stone3], wall: [P.crimsonDeep, P.crimsonDeep, P.goldRegal], accent: P.goldRegal, accent2: P.bark3 },
      station:     { g: [P.stone1, P.stone2, P.stone3],    path: [P.stone1, P.stone2, P.stone3], wall: [P.soot, P.stone1, P.stone2],    accent: P.gold, accent2: P.silver },
      city_poor:   { g: [P.soot, P.stone2, P.taupe],       path: [P.soot, P.taupe, P.stone3],    wall: [P.bark1, P.patchBrown, P.poorFade], accent: P.poorIndigo, accent2: P.patchBrown },
      city_market: { g: [P.stone1, P.stone2, P.stone3],    path: [P.stone1, P.stone2, P.stone3], wall: [P.bark1, P.bark2, P.parchment], accent: P.marketGreen, accent2: P.terracotta },
      city_noble:  { g: [P.taupe, P.stone3, P.silver],     path: [P.taupe, P.stone3, P.silver],  wall: [P.stone1, P.parchment, P.linen], accent: P.plum, accent2: P.silver },
      city_royal:  { g: [P.stone3, P.silver, P.linen],     path: [P.stone3, P.silver, P.linen],  wall: [P.stone2, P.linen, P.goldRegal], accent: P.crimson, accent2: P.goldRegal },
      city:        { g: [P.taupe, P.bark3, P.parchment],   path: [P.bark1, P.bark2, P.bark3],    wall: [P.bark1, P.parchment, P.bark2], accent: P.gold, accent2: P.terracotta },
      shop:        { g: [P.bark1, P.bark3, P.parchment],   path: [P.bark1, P.bark2, P.bark3],    wall: [P.bark1, P.parchment, P.linen], accent: P.gold, accent2: P.crimson, plank: true, wainscot: true },
      mill:        { g: [P.soot, P.bark1, P.bark2],        path: [P.soot, P.bark1, P.bark2],     wall: [P.soot, P.patchBrown, P.stone2], accent: P.poorFade, accent2: P.taupe },
      warehouse:   { g: [P.river1, P.stone1, P.stone2],    path: [P.stone1, P.stone2, P.stone3], wall: [P.soot, P.patchBrown, P.stone1], accent: P.poorIndigo, accent2: P.plum },
      grove:       { g: [P.meadow1, P.meadow2, P.meadow3], path: [P.bark1, P.bark2, P.bark3],    wall: [P.meadow1, P.bark2, P.meadow2], accent: P.gold, accent2: P.river3 },
      vault:       { g: [P.outline, P.soot, P.stone1],     path: [P.outline, P.soot, P.stone1],  wall: [P.outline, P.stone1, P.marketGreen], accent: P.gold, accent2: P.bark2 },
      palace:      { g: [P.stone3, P.silver, P.linen],     path: [P.crimsonDeep, P.crimson, P.goldRegal], wall: [P.stone2, P.linen, P.goldRegal], accent: P.crimson, accent2: P.goldRegal },
    };
  }

  // ------------------------------------------------------------- tile draws

  function px(x, xx, yy, c) { x.fillStyle = c; x.fillRect(xx, yy, 1, 1); }
  function rr(x, xx, yy, w, h, c) { x.fillStyle = c; x.fillRect(xx, yy, w, h); }

  function drawGround(x, t, variant) {
    if (t.plank) { // honey plank flooring — board seams + grain
      rr(x, 0, 0, 16, 16, t.g[1]);
      for (var by = 3; by < 16; by += 4) rr(x, 0, by, 16, 1, t.g[0]);
      // board joints, staggered per variant so rows read as offset planks
      if (variant) { rr(x, 5, 0, 1, 3, t.g[0]); rr(x, 11, 8, 1, 3, t.g[0]); }
      else { rr(x, 10, 4, 1, 3, t.g[0]); rr(x, 3, 12, 1, 3, t.g[0]); }
      // grain + warm highlights
      px(x, 2, 1, t.g[2]); px(x, 8, 6, t.g[2]); px(x, 13, 9, t.g[2]); px(x, 6, 13, t.g[2]);
      px(x, 12, 1, G.Palette.bark2); px(x, 4, 5, G.Palette.bark2); px(x, 9, 13, G.Palette.bark2);
      return;
    }
    rr(x, 0, 0, 16, 16, t.g[1]);
    var sp = variant ? SPECK_B : SPECK_A;
    for (var i = 0; i < sp.length; i++) px(x, sp[i][0], sp[i][1], i % 2 ? t.g[0] : t.g[2]);
    if (variant) rr(x, 10, 9, 3, 2, t.g[0]); // worn patch
    else { px(x, 6, 8, t.g[2]); px(x, 7, 8, t.g[2]); }
  }

  var DRAW = {
    '.': function (x, t) { drawGround(x, t, false); },
    ',': function (x, t) { drawGround(x, t, true); },
    'n': function (x, t) { drawGround(x, t, false); },

    '-': function (x, t) {
      rr(x, 0, 0, 16, 16, t.path[1]);
      rr(x, 0, 5, 16, 1, t.path[0]);
      rr(x, 0, 11, 16, 1, t.path[0]);
      px(x, 3, 2, t.path[2]); px(x, 12, 8, t.path[2]); px(x, 7, 14, t.path[2]);
      px(x, 9, 3, t.path[0]); px(x, 4, 9, t.path[0]);
    },

    '=': function (x, t) {
      rr(x, 0, 0, 16, 16, t.g[2]);
      rr(x, 0, 7, 16, 1, t.g[1]);
      rr(x, 7, 0, 1, 8, t.g[1]);
      rr(x, 3, 8, 1, 8, t.g[1]);
      rr(x, 11, 8, 1, 8, t.g[1]);
      px(x, 0, 0, t.g[0]); px(x, 15, 15, t.g[0]); px(x, 13, 3, t.g[1]);
    },

    '#': function (x, t) {
      if (t.wainscot) { // cream plaster over walnut wainscot panelling
        rr(x, 0, 0, 16, 16, t.wall[1]);
        px(x, 4, 3, t.wall[2]); px(x, 11, 5, t.wall[2]); px(x, 7, 7, G.Palette.taupe);
        rr(x, 0, 9, 16, 1, G.Palette.bark3);       // chair rail
        rr(x, 0, 10, 16, 6, G.Palette.bark1);      // walnut panel
        rr(x, 3, 11, 1, 4, G.Palette.outline);     // grooves
        rr(x, 8, 11, 1, 4, G.Palette.outline);
        rr(x, 13, 11, 1, 4, G.Palette.outline);
        rr(x, 0, 10, 16, 1, G.Palette.bark2);
        return;
      }
      rr(x, 0, 0, 16, 16, t.wall[1]);
      rr(x, 0, 0, 16, 2, t.wall[2]);
      rr(x, 0, 14, 16, 2, t.wall[0]);
      rr(x, 0, 6, 16, 1, t.wall[0]);
      rr(x, 0, 10, 16, 1, t.wall[0]);
      rr(x, 5, 2, 1, 4, t.wall[0]);
      rr(x, 11, 7, 1, 3, t.wall[0]);
      rr(x, 8, 11, 1, 3, t.wall[0]);
    },

    'B': function (x, t) {
      DRAW['#'](x, t);
      rr(x, 5, 4, 6, 8, G.Palette.outline);       // window frame
      rr(x, 6, 5, 4, 6, G.Palette.parchment);     // glass
      px(x, 6, 5, G.Palette.linen); px(x, 7, 6, G.Palette.linen);
      rr(x, 6, 8, 4, 1, G.Palette.outline);       // mullion
      rr(x, 4, 12, 8, 1, t.wall[0]);              // sill
      px(x, 8, 7, G.Palette.gold);                // warm light
    },

    'D': function (x, t) {
      rr(x, 0, 0, 16, 16, t.wall[0]);
      rr(x, 2, 1, 12, 15, G.Palette.outline);     // frame
      rr(x, 3, 2, 10, 14, G.Palette.bark1);       // door
      rr(x, 4, 3, 3, 12, G.Palette.bark2);
      rr(x, 9, 3, 3, 12, G.Palette.bark2);
      px(x, 11, 9, G.Palette.gold);               // knob
      rr(x, 3, 2, 10, 1, G.Palette.bark3);
    },

    'w': function (x, t) {
      rr(x, 0, 0, 16, 16, G.Palette.river1);
      rr(x, 0, 3, 16, 2, G.Palette.river2);
      rr(x, 0, 9, 16, 2, G.Palette.river2);
      px(x, 4, 4, G.Palette.river3); px(x, 12, 10, G.Palette.river3);
      px(x, 8, 6, G.Palette.river3); px(x, 2, 13, G.Palette.river2);
      rr(x, 0, 0, 16, 1, G.Palette.river3);
    },

    't': function (x, t) {
      drawGround(x, t, false);
      rr(x, 7, 10, 2, 5, G.Palette.bark1);        // trunk
      rr(x, 2, 2, 12, 8, G.Palette.meadow1);      // canopy dark
      rr(x, 3, 1, 10, 8, G.Palette.meadow2);
      rr(x, 4, 2, 6, 4, G.Palette.meadow3);       // sunlit tips
      px(x, 11, 3, G.Palette.meadow3); px(x, 3, 6, G.Palette.meadow1);
      if (t === themeCache.grove) { px(x, 10, 6, G.Palette.gold); px(x, 5, 7, G.Palette.linen); } // cocoons
      rr(x, 2, 9, 12, 1, G.Palette.outline);      // canopy underside
    },

    'f': function (x, t) {
      drawGround(x, t, false);
      px(x, 3, 10, G.Palette.meadow2); px(x, 3, 9, t.accent);
      px(x, 8, 12, G.Palette.meadow2); px(x, 8, 11, G.Palette.terracottaPale);
      px(x, 12, 9, G.Palette.meadow2); px(x, 12, 8, G.Palette.linen);
      px(x, 6, 7, t.accent2);
    },

    'F': function (x, t) {
      drawGround(x, t, false);
      var iron = (t.accent === G.Palette.plum || t.accent === G.Palette.crimson);
      var post = iron ? G.Palette.outline : G.Palette.bark2;
      var rail = iron ? G.Palette.soot : G.Palette.bark3;
      rr(x, 2, 4, 2, 10, post);
      rr(x, 12, 4, 2, 10, post);
      rr(x, 0, 7, 16, 2, rail);
      px(x, 2, 4, iron ? G.Palette.silver : G.Palette.bark3);
      px(x, 12, 4, iron ? G.Palette.silver : G.Palette.bark3);
    },

    'l': function (x, t) {
      drawGround(x, t, false);
      rr(x, 7, 5, 2, 10, G.Palette.outline);      // post
      rr(x, 5, 1, 6, 5, G.Palette.outline);       // lamp housing
      rr(x, 6, 2, 4, 3, G.Palette.gold);          // flame
      px(x, 7, 2, G.Palette.linen);
      px(x, 4, 3, G.Palette.gold); px(x, 11, 3, G.Palette.gold); // glow hints
    },

    'c': function (x, t) {
      drawGround(x, t, false);
      if (t === themeCache.warehouse) {           // dye vat
        rr(x, 2, 4, 12, 10, G.Palette.stone2);
        rr(x, 2, 4, 12, 2, G.Palette.stone3);
        rr(x, 4, 6, 8, 6, G.Palette.poorIndigo);  // dye
        px(x, 5, 7, G.Palette.plum); px(x, 9, 8, G.Palette.river3); px(x, 7, 10, G.Palette.crimson);
        rr(x, 2, 4, 12, 1, G.Palette.outline);
      } else {                                    // crate/barrel
        rr(x, 2, 5, 12, 10, G.Palette.bark2);
        rr(x, 2, 5, 12, 1, G.Palette.bark3);
        rr(x, 2, 14, 12, 1, G.Palette.bark1);
        rr(x, 7, 5, 1, 10, G.Palette.bark1);
        rr(x, 2, 9, 12, 1, G.Palette.bark1);
        px(x, 3, 6, G.Palette.bark3);
        rr(x, 2, 5, 1, 10, G.Palette.outline); rr(x, 13, 5, 1, 10, G.Palette.outline);
      }
    },

    'T': function (x, t) {
      drawGround(x, t, false);
      if (t === themeCache.palace) {              // throne
        rr(x, 3, 1, 10, 13, G.Palette.goldRegal);
        rr(x, 4, 2, 8, 11, G.Palette.crimson);
        rr(x, 4, 2, 8, 3, G.Palette.crimsonDeep);
        px(x, 7, 0, G.Palette.goldRegal); px(x, 8, 0, G.Palette.goldRegal);
        rr(x, 3, 1, 1, 13, G.Palette.outline); rr(x, 12, 1, 1, 13, G.Palette.outline);
      } else {                                    // table / counter / stall
        rr(x, 1, 4, 14, 8, G.Palette.bark3);
        rr(x, 1, 4, 14, 2, G.Palette.parchment);  // worn top / runner
        rr(x, 1, 11, 14, 1, G.Palette.bark1);
        rr(x, 2, 12, 2, 3, G.Palette.bark1);
        rr(x, 12, 12, 2, 3, G.Palette.bark1);
        rr(x, 1, 4, 1, 8, G.Palette.outline); rr(x, 14, 4, 1, 8, G.Palette.outline);
      }
    },

    'S': function (x, t) {
      rr(x, 0, 0, 16, 16, t.wall[1]);
      rr(x, 1, 1, 14, 14, G.Palette.bark1);       // shelf frame
      rr(x, 2, 2, 12, 5, G.Palette.bark2);
      rr(x, 2, 9, 12, 5, G.Palette.bark2);
      // fabric bolts
      rr(x, 3, 3, 3, 3, G.Palette.poorIndigo); px(x, 3, 3, G.Palette.poorFade);
      rr(x, 7, 3, 3, 3, G.Palette.terracotta); px(x, 7, 3, G.Palette.terracottaPale);
      rr(x, 11, 3, 2, 3, G.Palette.plum); px(x, 11, 3, G.Palette.silver);
      rr(x, 3, 10, 3, 3, G.Palette.marketGreen); px(x, 3, 10, G.Palette.meadow3);
      rr(x, 7, 10, 3, 3, G.Palette.crimson); px(x, 7, 10, G.Palette.goldRegal);
      rr(x, 11, 10, 2, 3, G.Palette.linen);
    },

    'm': function (x, t) {
      if (t.plank) { // the shop: a black sewing machine with gingham cloth in work
        var P = G.Palette;
        drawGround(x, t, false);
        rr(x, 1, 5, 14, 8, P.bark3);              // work table
        rr(x, 1, 5, 14, 1, P.parchment);
        rr(x, 1, 12, 14, 1, P.bark1);
        rr(x, 2, 13, 2, 2, P.bark1); rr(x, 12, 13, 2, 2, P.bark1);
        rr(x, 4, 1, 3, 5, P.outline);             // machine pillar
        rr(x, 4, 1, 8, 2, P.outline);             // arm
        rr(x, 10, 2, 2, 3, P.outline);            // needle head
        px(x, 10, 5, P.silver);                   // needle
        rr(x, 3, 5, 5, 2, P.outline);             // base
        px(x, 5, 2, P.goldRegal);                 // gold filigree
        px(x, 12, 1, P.goldRegal);                // balance wheel
        // red gingham cloth feeding through, spilling off the table
        rr(x, 8, 6, 7, 4, P.crimson);
        px(x, 9, 7, P.linen); px(x, 11, 7, P.linen); px(x, 13, 7, P.linen);
        px(x, 10, 8, P.linen); px(x, 12, 8, P.linen); px(x, 14, 8, P.linen);
        rr(x, 12, 10, 3, 3, P.crimson);
        px(x, 13, 11, P.linen);
        return;
      }
      drawGround(x, t, false);
      rr(x, 2, 3, 12, 11, G.Palette.stone2);      // loom body
      rr(x, 2, 3, 12, 2, G.Palette.stone3);
      rr(x, 3, 6, 10, 6, G.Palette.bark1);        // frame
      // warp threads
      for (var i = 0; i < 4; i++) rr(x, 4 + i * 2, 6, 1, 6, G.Palette.linen);
      if (t === themeCache.mill) {                // broken: snapped threads, tilt
        rr(x, 6, 6, 1, 3, G.Palette.stone2);
        rr(x, 10, 9, 1, 3, G.Palette.stone2);
        px(x, 13, 2, G.Palette.taupe);
      } else {
        px(x, 12, 4, G.Palette.gold);             // thread spool glint
      }
      rr(x, 2, 3, 1, 11, G.Palette.outline); rr(x, 13, 3, 1, 11, G.Palette.outline);
    },

    'r': function (x, t) {
      drawGround(x, t, false);
      rr(x, 2, 9, 5, 4, G.Palette.stone1); px(x, 3, 9, G.Palette.stone3);
      rr(x, 8, 6, 4, 4, G.Palette.stone2); px(x, 9, 6, G.Palette.stone3);
      rr(x, 11, 11, 4, 3, G.Palette.stone1); px(x, 12, 11, G.Palette.stone2);
      px(x, 6, 13, G.Palette.stone2);
    },

    'b': function (x, t) {
      rr(x, 0, 0, 16, 16, G.Palette.river1);
      for (var i = 0; i < 4; i++) {
        rr(x, 0, i * 4, 16, 3, G.Palette.bark2);
        rr(x, 0, i * 4 + 3, 16, 1, G.Palette.bark1);
        px(x, 3 + i * 3, i * 4 + 1, G.Palette.bark3);
      }
    },

    'x': function (x, t) {
      drawGround(x, t, false);
      if (t === themeCache.warehouse) {           // dye sheen
        rr(x, 3, 4, 6, 4, G.Palette.plum);
        rr(x, 8, 9, 5, 4, G.Palette.poorIndigo);
        px(x, 5, 5, G.Palette.river3); px(x, 10, 10, G.Palette.silver);
      } else if (t === themeCache.grove) {        // thorn brambles
        px(x, 3, 4, G.Palette.meadow1); px(x, 4, 5, G.Palette.outline); px(x, 5, 4, G.Palette.meadow1);
        px(x, 10, 7, G.Palette.meadow1); px(x, 11, 8, G.Palette.outline); px(x, 12, 7, G.Palette.meadow1);
        px(x, 6, 11, G.Palette.outline); px(x, 7, 12, G.Palette.meadow1); px(x, 8, 11, G.Palette.outline);
        px(x, 13, 12, G.Palette.meadow1); px(x, 2, 9, G.Palette.outline);
      } else {                                    // cracked boards / crumbling stone
        px(x, 4, 3, G.Palette.outline); px(x, 5, 4, G.Palette.outline); px(x, 6, 5, G.Palette.outline);
        px(x, 7, 5, G.Palette.soot); px(x, 8, 6, G.Palette.outline); px(x, 9, 7, G.Palette.outline);
        rr(x, 10, 8, 3, 1, G.Palette.outline);
        px(x, 3, 11, G.Palette.outline); px(x, 4, 12, G.Palette.soot); px(x, 12, 12, G.Palette.outline);
        px(x, 11, 3, G.Palette.soot);
      }
    },

    'g': function (x, t) {
      drawGround(x, t, false);
      var c = (t.g[1] === G.Palette.meadow2) ? G.Palette.meadow3 : G.Palette.taupe;
      var d = (t.g[1] === G.Palette.meadow2) ? G.Palette.meadow1 : t.g[0];
      rr(x, 3, 9, 1, 4, c); rr(x, 4, 8, 1, 5, d);
      rr(x, 7, 10, 1, 4, c); rr(x, 8, 9, 1, 5, c);
      rr(x, 11, 8, 1, 5, d); rr(x, 12, 10, 1, 3, c);
    },

    'h': function (x, t) {
      drawGround(x, t, false);
      rr(x, 5, 6, 6, 5, G.Palette.bark3);
      rr(x, 5, 6, 6, 1, G.Palette.parchment);
      rr(x, 5, 11, 1, 4, G.Palette.bark1);
      rr(x, 10, 11, 1, 4, G.Palette.bark1);
      rr(x, 5, 6, 1, 5, G.Palette.outline); rr(x, 10, 6, 1, 5, G.Palette.outline);
    },

    'e': function (x, t) {
      drawGround(x, t, false);
      rr(x, 2, 1, 12, 14, G.Palette.bark1);       // frame
      rr(x, 3, 2, 10, 12, G.Palette.linen);
      rr(x, 3, 2, 10, 4, G.Palette.parchment);    // pillow
      rr(x, 3, 6, 10, 8, G.Palette.crimson);      // quilt
      rr(x, 3, 6, 10, 1, G.Palette.crimsonDeep);
      px(x, 5, 9, G.Palette.gold); px(x, 8, 11, G.Palette.gold); px(x, 11, 9, G.Palette.gold); // stitching
      rr(x, 2, 1, 12, 1, G.Palette.bark3);
    },

    '_': function (x, t) {
      rr(x, 0, 0, 16, 16, G.Palette.outline);
      rr(x, 0, 0, 16, 2, G.Palette.soot);
      px(x, 3, 2, G.Palette.stone1); px(x, 11, 2, G.Palette.stone1);
    },

    '~': function (x, t) {
      rr(x, 0, 0, 16, 16, G.Palette.stone2);
      for (var i = 0; i < SPECK_A.length; i++) px(x, SPECK_A[i][0], SPECK_A[i][1], G.Palette.stone1);
      rr(x, 2, 2, 3, 12, G.Palette.bark1);        // sleepers
      rr(x, 10, 2, 3, 12, G.Palette.bark1);
      rr(x, 0, 4, 16, 2, G.Palette.stone3);       // rails
      rr(x, 0, 10, 16, 2, G.Palette.stone3);
      px(x, 6, 4, G.Palette.linen); px(x, 13, 10, G.Palette.linen);
    },

    ' ': function (x, t) {
      rr(x, 0, 0, 16, 16, G.Palette.outline);
    },

    // ---- cozy-revamp props -------------------------------------------

    'u': function (x, t) { // woven rug — walkable, seamless across tiles
      var P = G.Palette;
      rr(x, 0, 0, 16, 16, P.parchment);
      rr(x, 0, 5, 16, 1, P.terracottaPale);
      rr(x, 0, 11, 16, 1, P.terracottaPale);
      px(x, 3, 2, P.terracotta); px(x, 9, 3, P.terracotta); px(x, 13, 2, P.terracotta);
      px(x, 5, 8, P.bark3); px(x, 11, 8, P.bark3);
      px(x, 3, 13, P.terracotta); px(x, 8, 14, P.terracotta); px(x, 14, 13, P.terracotta);
    },

    'o': function (x, t) { // sofa LEFT half — arm, back cushion, gingham pillow
      var P = G.Palette;
      rr(x, 0, 0, 16, 16, P.parchment);   // sits on the rug
      rr(x, 0, 5, 16, 1, P.terracottaPale);
      rr(x, 3, 2, 13, 5, P.linen);        // backrest (continues right)
      rr(x, 3, 2, 13, 1, '#fbf3dd');
      rr(x, 8, 3, 1, 3, P.parchment);     // cushion split
      rr(x, 3, 7, 13, 6, P.parchment);    // seat
      rr(x, 3, 7, 13, 1, P.taupe);
      rr(x, 0, 2, 3, 11, P.bark2);        // left arm
      rr(x, 0, 2, 3, 1, P.bark3);
      rr(x, 0, 2, 1, 11, P.outline);
      rr(x, 3, 13, 13, 2, P.bark1);       // wooden base
      rr(x, 5, 4, 6, 5, P.crimson);       // gingham pillow
      px(x, 6, 5, P.linen); px(x, 8, 5, P.linen); px(x, 10, 5, P.linen);
      px(x, 7, 6, P.linen); px(x, 9, 6, P.linen);
      px(x, 6, 7, P.linen); px(x, 8, 7, P.linen); px(x, 10, 7, P.linen);
      rr(x, 5, 4, 6, 1, P.crimsonDeep);
    },

    'O': function (x, t) { // sofa RIGHT half — plaid throw over the back, right arm
      var P = G.Palette;
      rr(x, 0, 0, 16, 16, P.parchment);
      rr(x, 0, 5, 16, 1, P.terracottaPale);
      rr(x, 0, 2, 13, 5, P.linen);        // backrest (continues left)
      rr(x, 0, 2, 13, 1, '#fbf3dd');
      rr(x, 6, 3, 1, 3, P.parchment);
      rr(x, 0, 7, 13, 6, P.parchment);    // seat
      rr(x, 0, 7, 13, 1, P.taupe);
      rr(x, 13, 2, 3, 11, P.bark2);       // right arm
      rr(x, 13, 2, 3, 1, P.bark3);
      rr(x, 15, 2, 1, 11, P.outline);
      rr(x, 0, 13, 13, 2, P.bark1);
      // folded plaid throw draped on the back
      rr(x, 2, 1, 7, 6, P.plum);
      rr(x, 2, 3, 7, 1, P.silver); rr(x, 2, 5, 7, 1, P.silver);
      rr(x, 4, 1, 1, 6, P.silver); rr(x, 7, 1, 1, 6, P.silver);
      rr(x, 2, 1, 7, 1, P.plumDeep);
    },

    'k': function (x, t) { // stone fireplace LEFT — arch stones, fire spans the seam
      var P = G.Palette;
      rr(x, 0, 0, 16, 16, P.stone1);
      // rounded fieldstones
      rr(x, 0, 0, 5, 4, P.stone2); rr(x, 6, 0, 6, 3, P.stone3); rr(x, 13, 0, 3, 4, P.stone2);
      rr(x, 0, 5, 4, 5, P.stone3); rr(x, 0, 11, 5, 5, P.stone2);
      px(x, 2, 2, '#fbf3dd'); px(x, 8, 1, P.stone2); px(x, 1, 7, P.stone2); px(x, 2, 13, P.stone3);
      rr(x, 5, 4, 11, 12, P.outline);            // hearth opening (opens rightward)
      rr(x, 6, 12, 10, 2, P.bark1);              // log
      px(x, 7, 12, P.bark3);
      rr(x, 10, 8, 6, 4, P.terracotta);          // fire — right edge, meets K
      rr(x, 12, 6, 4, 5, P.goldRegal);
      rr(x, 14, 5, 2, 3, P.gold);
      px(x, 13, 9, '#fbf3dd'); px(x, 11, 7, P.gold);
      px(x, 8, 14, P.goldRegal);                 // ember
    },

    'K': function (x, t) { // stone fireplace RIGHT — mirror of k
      var P = G.Palette;
      rr(x, 0, 0, 16, 16, P.stone1);
      rr(x, 11, 0, 5, 4, P.stone2); rr(x, 4, 0, 6, 3, P.stone3); rr(x, 0, 0, 3, 4, P.stone2);
      rr(x, 12, 5, 4, 5, P.stone3); rr(x, 11, 11, 5, 5, P.stone2);
      px(x, 13, 2, '#fbf3dd'); px(x, 7, 1, P.stone2); px(x, 14, 7, P.stone2); px(x, 13, 13, P.stone3);
      rr(x, 0, 4, 11, 12, P.outline);
      rr(x, 0, 12, 10, 2, P.bark1);
      px(x, 8, 12, P.bark3);
      rr(x, 0, 8, 6, 4, P.terracotta);
      rr(x, 0, 6, 4, 5, P.goldRegal);
      rr(x, 0, 5, 2, 3, P.gold);
      px(x, 2, 9, '#fbf3dd'); px(x, 4, 7, P.gold);
      px(x, 7, 14, P.goldRegal);
    },

    'M': function (x, t) { // dress-form mannequin in a gingham top (scenes overlay owned garments)
      var P = G.Palette;
      drawGround(x, t, false);
      rr(x, 6, 13, 4, 1, P.bark2);               // tripod base
      rr(x, 5, 14, 6, 1, P.bark1);
      rr(x, 7, 11, 2, 2, P.bark2);               // pole
      rr(x, 4, 3, 8, 8, P.linen);                // torso
      rr(x, 5, 10, 6, 1, P.linen);               // waist taper
      rr(x, 5, 2, 6, 1, P.linen);                // shoulder line
      px(x, 7, 1, P.bark3); px(x, 8, 1, P.bark3); // neck cap
      // red gingham top
      rr(x, 4, 4, 8, 5, P.crimson);
      px(x, 5, 5, P.linen); px(x, 7, 5, P.linen); px(x, 9, 5, P.linen); px(x, 11, 5, P.linen);
      px(x, 6, 6, P.linen); px(x, 8, 6, P.linen); px(x, 10, 6, P.linen);
      px(x, 5, 7, P.linen); px(x, 7, 7, P.linen); px(x, 9, 7, P.linen); px(x, 11, 7, P.linen);
      rr(x, 4, 4, 8, 1, P.crimsonDeep);
      px(x, 6, 9, '#fbf3dd'); px(x, 9, 9, '#fbf3dd'); // linen peeking below
    },

    'C': function (x, t) { // coffee station — kettle, cups, steam
      var P = G.Palette;
      rr(x, 0, 0, 16, 16, t.wall[1]);
      rr(x, 0, 6, 16, 10, P.bark2);              // counter
      rr(x, 0, 6, 16, 1, P.bark3);
      rr(x, 2, 8, 5, 6, P.soot);                 // kettle
      rr(x, 3, 7, 3, 1, P.soot);
      px(x, 7, 9, P.soot);                        // spout
      rr(x, 3, 10, 3, 1, P.goldRegal);            // brass band
      rr(x, 10, 10, 2, 3, P.linen);               // cups
      rr(x, 13, 10, 2, 3, P.linen);
      px(x, 10, 10, '#fbf3dd'); px(x, 13, 10, '#fbf3dd');
      px(x, 4, 4, P.taupe); px(x, 5, 2, P.taupe); // steam
      px(x, 11, 8, P.taupe);
      rr(x, 0, 14, 16, 2, P.bark1);
    },

    'R': function (x, t) { // open wardrobe of hanging gingham tops
      var P = G.Palette;
      rr(x, 0, 0, 16, 16, P.bark1);              // wardrobe carcass
      rr(x, 1, 1, 14, 14, P.parchment);          // back panel
      rr(x, 0, 0, 16, 1, P.bark3);
      rr(x, 1, 2, 14, 1, P.bark2);               // rail
      // three hangers with checked tops
      px(x, 3, 2, P.bark3); px(x, 8, 2, P.bark3); px(x, 12, 2, P.bark3);
      rr(x, 2, 4, 4, 6, P.crimson);
      px(x, 3, 5, P.linen); px(x, 5, 5, P.linen); px(x, 4, 6, P.linen);
      px(x, 3, 7, P.linen); px(x, 5, 7, P.linen); px(x, 4, 8, P.linen);
      rr(x, 7, 4, 4, 6, P.poorIndigo);
      px(x, 8, 5, P.poorFade); px(x, 10, 5, P.poorFade); px(x, 9, 6, P.poorFade);
      px(x, 8, 7, P.poorFade); px(x, 10, 7, P.poorFade); px(x, 9, 8, P.poorFade);
      rr(x, 11, 4, 4, 6, P.marketGreen);
      px(x, 12, 5, P.meadow3); px(x, 14, 5, P.meadow3); px(x, 13, 6, P.meadow3);
      px(x, 12, 7, P.meadow3); px(x, 14, 7, P.meadow3);
      rr(x, 1, 13, 14, 2, P.bark2);              // folded fabric at the bottom
      rr(x, 2, 13, 4, 1, P.terracotta); rr(x, 8, 13, 4, 1, P.plum);
      rr(x, 0, 15, 16, 1, P.outline);
    },

    'a': function (x, t) { // cutting table LEFT — wood edge + shears on the mat
      var P = G.Palette;
      drawGround(x, t, false);
      rr(x, 0, 2, 16, 12, P.bark2);              // table
      rr(x, 0, 2, 16, 1, P.bark3);
      rr(x, 3, 4, 13, 8, P.marketGreen);         // cutting mat (continues right)
      rr(x, 3, 4, 13, 1, P.meadow1);
      rr(x, 3, 8, 13, 1, P.meadow1);             // mat grid
      rr(x, 8, 4, 1, 8, P.meadow1);
      rr(x, 13, 4, 1, 8, P.meadow1);
      // tailor's shears
      px(x, 5, 6, P.silver); px(x, 6, 7, P.silver); px(x, 7, 8, P.silver);
      px(x, 8, 9, P.silver); px(x, 6, 9, P.silver); px(x, 5, 10, P.crimson);
      rr(x, 0, 13, 16, 1, P.bark1);
      rr(x, 1, 14, 2, 2, P.bark1); // leg
    },

    'd': function (x, t) { // cutting table MID — pattern papers + measuring tape
      var P = G.Palette;
      drawGround(x, t, false);
      rr(x, 0, 2, 16, 12, P.bark2);
      rr(x, 0, 2, 16, 1, P.bark3);
      rr(x, 0, 4, 16, 8, P.marketGreen);
      rr(x, 0, 4, 16, 1, P.meadow1);
      rr(x, 0, 8, 16, 1, P.meadow1);
      rr(x, 4, 4, 1, 8, P.meadow1);
      rr(x, 10, 4, 1, 8, P.meadow1);
      // pattern papers, slightly askew
      rr(x, 2, 5, 6, 5, P.linen);
      rr(x, 6, 7, 7, 5, '#fbf3dd');
      px(x, 3, 6, P.taupe); px(x, 5, 7, P.taupe); px(x, 8, 9, P.taupe); px(x, 10, 10, P.taupe);
      px(x, 4, 8, P.outline); px(x, 9, 8, P.outline);
      // measuring tape curl
      px(x, 13, 5, P.gold); px(x, 14, 6, P.gold); px(x, 13, 7, P.gold); px(x, 12, 6, P.gold);
      rr(x, 0, 13, 16, 1, P.bark1);
    },

    'A': function (x, t) { // cutting table RIGHT — thread spools + pincushion
      var P = G.Palette;
      drawGround(x, t, false);
      rr(x, 0, 2, 16, 12, P.bark2);
      rr(x, 0, 2, 16, 1, P.bark3);
      rr(x, 0, 4, 13, 8, P.marketGreen);
      rr(x, 0, 4, 13, 1, P.meadow1);
      rr(x, 0, 8, 13, 1, P.meadow1);
      rr(x, 6, 4, 1, 8, P.meadow1);
      // standing spools
      rr(x, 2, 5, 2, 3, P.crimson); px(x, 2, 5, P.bark3);
      rr(x, 5, 5, 2, 3, P.poorIndigo); px(x, 5, 5, P.bark3);
      rr(x, 8, 5, 2, 3, P.gold); px(x, 8, 5, P.bark3);
      // pincushion
      rr(x, 3, 9, 4, 3, P.crimson);
      px(x, 4, 8, P.silver); px(x, 6, 8, P.silver);
      rr(x, 0, 13, 16, 1, P.bark1);
      rr(x, 13, 14, 2, 2, P.bark1); // leg
    },

    's': function (x, t) { // sewing side table — spools, shears, pincushion
      var P = G.Palette;
      drawGround(x, t, false);
      rr(x, 1, 3, 14, 10, P.bark3);              // table top
      rr(x, 1, 3, 14, 1, P.parchment);
      rr(x, 1, 12, 14, 1, P.bark1);
      rr(x, 2, 13, 2, 2, P.bark1); rr(x, 12, 13, 2, 2, P.bark1);
      rr(x, 3, 5, 2, 3, P.crimson); px(x, 3, 5, P.bark2);   // spools
      rr(x, 6, 5, 2, 3, P.marketGreen); px(x, 6, 5, P.bark2);
      rr(x, 9, 5, 2, 3, P.poorIndigo); px(x, 9, 5, P.bark2);
      px(x, 12, 6, P.silver); px(x, 13, 7, P.silver);        // needle
      rr(x, 4, 9, 4, 3, P.crimson);                          // pincushion
      px(x, 5, 8, P.silver); px(x, 7, 8, P.silver);
      px(x, 10, 10, P.gold);                                 // thimble
    },

    'N': function (x, t) { // checkout — brass register on the counter
      var P = G.Palette;
      drawGround(x, t, false);
      rr(x, 1, 4, 14, 8, P.bark3);               // counter top (joins T neighbors)
      rr(x, 1, 4, 14, 2, P.parchment);
      rr(x, 1, 11, 14, 1, P.bark1);
      rr(x, 2, 12, 2, 3, P.bark1); rr(x, 12, 12, 2, 3, P.bark1);
      rr(x, 4, 1, 8, 6, P.soot);                 // register body
      rr(x, 4, 1, 8, 1, P.stone3);
      rr(x, 5, 3, 6, 1, P.goldRegal);            // keys
      px(x, 5, 4, P.gold); px(x, 7, 4, P.gold); px(x, 9, 4, P.gold);
      rr(x, 6, 0, 4, 1, P.parchment);            // receipt
      px(x, 13, 5, P.gold);                       // service bell
      rr(x, 4, 1, 1, 6, P.outline); rr(x, 11, 1, 1, 6, P.outline);
    },

    'i': function (x, t) { // hanging plant against the wall
      var P = G.Palette;
      rr(x, 0, 0, 16, 16, t.wall ? t.wall[1] : P.parchment);
      if (t.wainscot) { px(x, 3, 2, t.wall[2]); px(x, 12, 4, t.wall[2]); }
      px(x, 7, 0, P.outline); px(x, 8, 1, P.outline); px(x, 7, 2, P.outline); // chain
      rr(x, 5, 3, 6, 3, P.terracotta);           // hanging pot
      rr(x, 5, 3, 6, 1, P.terracottaPale);
      rr(x, 4, 5, 8, 4, P.meadow2);              // foliage ball
      rr(x, 5, 4, 6, 2, P.meadow3);
      // trailing vines
      px(x, 4, 9, P.meadow2); px(x, 3, 10, P.meadow3); px(x, 4, 11, P.meadow1); px(x, 3, 12, P.meadow2);
      px(x, 11, 9, P.meadow2); px(x, 12, 10, P.meadow3); px(x, 11, 11, P.meadow2); px(x, 12, 12, P.meadow1);
      px(x, 7, 9, P.meadow1); px(x, 8, 10, P.meadow3);
    },

    'P': function (x, t) { // potted plant — the touch of greenery
      var P = G.Palette;
      drawGround(x, t, false);
      rr(x, 5, 10, 6, 5, P.terracotta);          // pot
      rr(x, 4, 10, 8, 2, P.terracottaPale);
      rr(x, 3, 3, 10, 6, P.meadow2);             // leaves
      rr(x, 5, 2, 6, 3, P.meadow3);
      px(x, 4, 4, P.meadow1); px(x, 10, 6, P.meadow1); px(x, 7, 3, P.meadow3);
      rr(x, 7, 8, 2, 2, P.meadow1);              // stems
      rr(x, 3, 8, 10, 1, P.outline);
    },

    'W': function (x, t) { // shopfront display window, warm and lit
      var P = G.Palette;
      rr(x, 0, 0, 16, 16, t.wall[1]);
      rr(x, 0, 0, 16, 3, P.bark1);               // awning
      px(x, 2, 2, P.bark2); px(x, 6, 2, P.bark2); px(x, 10, 2, P.bark2); px(x, 14, 2, P.bark2);
      rr(x, 1, 4, 14, 11, P.outline);            // frame
      rr(x, 2, 5, 12, 9, P.parchment);           // lit glass
      px(x, 3, 6, '#fbf3dd'); px(x, 4, 7, '#fbf3dd');
      rr(x, 4, 8, 2, 5, P.linen);                // little mannequin
      px(x, 4, 7, P.linen);
      rr(x, 8, 9, 2, 4, P.crimson);              // fabric bolts
      rr(x, 11, 9, 2, 4, P.poorIndigo);
      px(x, 9, 6, P.gold);                        // warm lamp
      rr(x, 1, 15, 14, 1, P.bark1);              // sill
    },

    'Q': function (x, t) { // hanging shop sign — the gilded needle
      var P = G.Palette;
      rr(x, 0, 0, 16, 16, t.wall[1]);
      rr(x, 7, 0, 2, 3, P.bark1);                // bracket
      rr(x, 2, 3, 12, 10, P.bark1);              // walnut board
      rr(x, 3, 4, 10, 8, P.crimsonDeep);
      rr(x, 2, 3, 12, 1, P.outline); rr(x, 2, 12, 12, 1, P.outline);
      rr(x, 2, 3, 1, 10, P.outline); rr(x, 13, 3, 1, 10, P.outline);
      // the gilded needle, diagonal
      px(x, 10, 5, P.goldRegal);                  // eye
      px(x, 9, 6, P.gold); px(x, 8, 7, P.gold); px(x, 7, 8, P.gold);
      px(x, 6, 9, P.linen);
      px(x, 4, 5, P.gold); px(x, 11, 10, P.gold); // stitch corners
    },
  };

  // ------------------------------------------------------------- strips

  function lerpHex(a, b, t) {
    function h(s) { return [parseInt(s.substr(1, 2), 16), parseInt(s.substr(3, 2), 16), parseInt(s.substr(5, 2), 16)]; }
    var A = h(a), B = h(b), o = '#';
    for (var i = 0; i < 3; i++) {
      var v = Math.round(A[i] + (B[i] - A[i]) * t).toString(16);
      o += (v.length < 2 ? '0' : '') + v;
    }
    return o;
  }

  function skyStrip(top, bottom) {
    var c = mkCanvas(960, 270), x = c.getContext('2d');
    var bands = 12, bh = Math.ceil(270 / bands);
    for (var b = 0; b < bands; b++) {
      x.fillStyle = lerpHex(top, bottom, b / (bands - 1));
      x.fillRect(0, b * bh, 960, bh);
      // 2x2 checker dither into the next band
      if (b < bands - 1) {
        x.fillStyle = lerpHex(top, bottom, (b + 1) / (bands - 1));
        for (var dx = 0; dx < 960; dx += 4) {
          x.fillRect(dx + ((b % 2) ? 2 : 0), (b + 1) * bh - 2, 2, 2);
        }
      }
    }
    return c;
  }

  function mountainsStrip() {
    var P = G.Palette, c = mkCanvas(960, 90), x = c.getContext('2d');
    x.fillStyle = P.poorIndigo;
    var peaks = [];
    for (var i = 0; i <= 12; i++) peaks.push({ px: i * 80, py: 20 + prand(i) * 45 });
    x.beginPath();
    x.moveTo(0, 90);
    for (i = 0; i <= 12; i++) x.lineTo(peaks[i].px, peaks[i].py);
    x.lineTo(960, 90);
    x.closePath();
    x.fill();
    // snow caps on local maxima
    x.fillStyle = P.linen;
    for (i = 1; i < 12; i++) {
      if (peaks[i].py < peaks[i - 1].py && peaks[i].py < peaks[i + 1].py) {
        x.beginPath();
        x.moveTo(peaks[i].px - 9, peaks[i].py + 7);
        x.lineTo(peaks[i].px, peaks[i].py);
        x.lineTo(peaks[i].px + 9, peaks[i].py + 7);
        x.closePath();
        x.fill();
      }
    }
    return c;
  }

  function hillsStrip() {
    var P = G.Palette, c = mkCanvas(960, 70), x = c.getContext('2d');
    x.fillStyle = P.meadow2;
    x.beginPath();
    x.moveTo(0, 70);
    for (var i = 0; i <= 960; i += 8) {
      x.lineTo(i, 26 + Math.sin(i * 0.011) * 9 + Math.sin(i * 0.037 + 2) * 5);
    }
    x.lineTo(960, 70);
    x.closePath();
    x.fill();
    // tree clumps
    x.fillStyle = P.meadow1;
    for (i = 0; i < 26; i++) {
      var tx = prand(i + 40) * 950, ty = 34 + prand(i + 90) * 24;
      x.fillRect(tx, ty, 7, 5);
      x.fillRect(tx + 2, ty - 2, 3, 2);
    }
    return c;
  }

  function fieldsStrip() {
    var P = G.Palette, c = mkCanvas(960, 60), x = c.getContext('2d');
    x.fillStyle = P.meadow3;
    x.fillRect(0, 0, 960, 60);
    x.fillStyle = P.meadow2;
    for (var y = 6; y < 60; y += 9) x.fillRect(0, y, 960, 2);
    // hay bales
    for (var i = 0; i < 16; i++) {
      var bx = prand(i + 7) * 940, by = 12 + prand(i + 17) * 40;
      x.fillStyle = P.bark3;
      x.fillRect(bx, by, 8, 6);
      x.fillStyle = P.parchment;
      x.fillRect(bx, by, 8, 2);
      x.fillStyle = P.bark1;
      x.fillRect(bx, by + 5, 8, 1);
    }
    return c;
  }

  function polesStrip() {
    var P = G.Palette, c = mkCanvas(960, 120), x = c.getContext('2d');
    for (var px0 = 20; px0 < 960; px0 += 90) {
      x.fillStyle = P.soot;
      x.fillRect(px0, 8, 3, 112);
      x.fillRect(px0 - 6, 16, 15, 3);            // crossarm
      x.fillStyle = P.outline;
      x.fillRect(px0, 8, 1, 112);
      // sagging wire to the next pole
      var nx = px0 + 90;
      x.fillStyle = P.soot;
      for (var s = 0; s <= 30; s++) {
        var t = s / 30;
        var wx = px0 + 3 + (nx - px0 - 3) * t;
        var wy = 18 + Math.sin(t * Math.PI) * 9;
        x.fillRect(wx, wy, 2, 1);
      }
    }
    return c;
  }

  function railsStrip() {
    var P = G.Palette, c = mkCanvas(960, 40), x = c.getContext('2d');
    x.fillStyle = P.stone2;
    x.fillRect(0, 0, 960, 40);
    x.fillStyle = P.stone1;
    for (var i = 0; i < 200; i++) x.fillRect(prand(i) * 958, prand(i + 300) * 38, 2, 1);
    x.fillStyle = P.bark1;
    for (var sx = 0; sx < 960; sx += 14) x.fillRect(sx, 10, 6, 22);
    x.fillStyle = P.stone3;
    x.fillRect(0, 12, 960, 3);
    x.fillRect(0, 26, 960, 3);
    x.fillStyle = P.linen;
    for (i = 0; i < 30; i++) x.fillRect(prand(i + 77) * 950, 12, 4, 1);
    return c;
  }

  function skylineStrip() {
    var P = G.Palette, c = mkCanvas(960, 140), x = c.getContext('2d');
    x.fillStyle = P.soot;
    // building blocks
    var bx = 0, bi = 0;
    while (bx < 960) {
      var bw = 24 + prand(bi) * 50;
      var bh = 36 + prand(bi + 50) * 70;
      x.fillRect(bx, 140 - bh, bw, bh);
      // chimneys
      if (prand(bi + 100) > 0.4) {
        x.fillRect(bx + 4 + prand(bi + 150) * (bw - 10), 140 - bh - 8, 4, 8);
      }
      bx += bw + 2 + prand(bi + 200) * 8;
      bi++;
    }
    // cathedral spire
    x.beginPath();
    x.moveTo(368, 140); x.lineTo(368, 40); x.lineTo(376, 8); x.lineTo(384, 40); x.lineTo(384, 140);
    x.closePath(); x.fill();
    // palace dome
    x.fillRect(500, 70, 64, 70);
    x.beginPath(); x.arc(532, 70, 32, Math.PI, 0); x.fill();
    x.fillRect(529, 30, 6, 12);
    // chimney smoke curls
    x.fillStyle = P.taupe;
    for (var i = 0; i < 22; i++) {
      var sx0 = prand(i + 500) * 940, sy0 = 20 + prand(i + 600) * 50;
      x.globalAlpha = 0.5;
      x.fillRect(sx0, sy0, 3, 2);
      x.fillRect(sx0 + 3, sy0 - 3, 2, 2);
      x.globalAlpha = 1;
    }
    // window pinpricks — Thread Gold constellation
    x.fillStyle = P.gold;
    for (i = 0; i < 130; i++) {
      var wx = prand(i + 900) * 950, wy = 60 + prand(i + 1300) * 75;
      x.fillRect(wx, wy, 1, 1);
    }
    return c;
  }

  // ------------------------------------------------------------- API

  var themeCache = null;   // name -> theme obj (also used for identity checks)
  var cache = {};          // ch|theme -> canvas
  var strips = {};
  var warned = {};

  function magenta() {
    var c = mkCanvas(16, 16), x = c.getContext('2d');
    x.fillStyle = '#ff00ff';
    x.fillRect(0, 0, 16, 16);
    x.fillStyle = '#000';
    x.fillRect(0, 0, 8, 8); x.fillRect(8, 8, 8, 8);
    return c;
  }

  G.Tiles = {
    TILE: TILE,

    init: function () {
      themeCache = themes();
      // remap identity handles used by theme-conditional draws
      themeCache.grove = themeCache.grove;
      strips.sky_day = skyStrip('#7fb7c7', '#ffd9a0');
      strips.sky_dusk = skyStrip('#6d3a67', '#ffb070');
      strips.mountains = mountainsStrip();
      strips.hills = hillsStrip();
      strips.fields = fieldsStrip();
      strips.poles = polesStrip();
      strips.rails = railsStrip();
      strips.city_skyline = skylineStrip();
    },

    get: function (ch, theme) {
      var key = ch + '|' + theme;
      var got = cache[key];
      if (got) return got;
      var t = themeCache[theme];
      var fn = DRAW[ch];
      if (!t || !fn) {
        if (!warned[key]) {
          warned[key] = true;
          console.warn('G.Tiles: unknown tile "' + ch + '" theme "' + theme + '"');
        }
        cache[key] = magenta();
        return cache[key];
      }
      var c = mkCanvas(16, 16);
      fn(c.getContext('2d'), t);
      cache[key] = c;
      return c;
    },

    solid: function (ch) { return !!SOLID[ch]; },

    strip: function (name) {
      if (strips[name]) return strips[name];
      if (!warned['strip|' + name]) {
        warned['strip|' + name] = true;
        console.warn('G.Tiles: unknown strip "' + name + '"');
      }
      strips[name] = magenta();
      return strips[name];
    },
  };

})();
