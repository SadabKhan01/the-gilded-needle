'use strict';
// The Gilded Needle — art-sprites.js
// Owns G.Sprites: heroine, NPCs, customers, enemies, item icons, set pieces.
// Characters are drawn by a parametric compositor (spec -> pixels), then an
// automatic outline pass wraps every opaque region in G.Palette.outline.

window.G = window.G || {};

(function () {

  var SP = {};          // name -> canvas (statics + frame keys 'base|dir|frame')
  var FRAMES = {};      // base -> frame count
  var warned = {};

  function mkCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  function rr(x, xx, yy, w, h, c) { if (w > 0 && h > 0) { x.fillStyle = c; x.fillRect(xx, yy, w, h); } }
  function px(x, xx, yy, c) { rr(x, xx, yy, 1, 1, c); }

  function shade(hex, f) { // f<1 darken, f>1 lighten
    var r = parseInt(hex.substr(1, 2), 16), g = parseInt(hex.substr(3, 2), 16), b = parseInt(hex.substr(5, 2), 16);
    function s(v) { v = Math.round(v * f); return v > 255 ? 255 : v; }
    function h2(v) { var s2 = v.toString(16); return s2.length < 2 ? '0' + s2 : s2; }
    return '#' + h2(s(r)) + h2(s(g)) + h2(s(b));
  }

  // wrap opaque regions in the warm-ink outline
  function outlinePass(c) {
    var w = c.width, h = c.height;
    var x = c.getContext('2d');
    var img = x.getImageData(0, 0, w, h);
    var d = img.data;
    var P = G.Palette.outline;
    var or_ = parseInt(P.substr(1, 2), 16), og = parseInt(P.substr(3, 2), 16), ob = parseInt(P.substr(5, 2), 16);
    var mark = [];
    function alpha(ix, iy) {
      if (ix < 0 || iy < 0 || ix >= w || iy >= h) return 0;
      return d[(iy * w + ix) * 4 + 3];
    }
    for (var iy = 0; iy < h; iy++) {
      for (var ix = 0; ix < w; ix++) {
        if (alpha(ix, iy) < 40 &&
            (alpha(ix - 1, iy) > 40 || alpha(ix + 1, iy) > 40 ||
             alpha(ix, iy - 1) > 40 || alpha(ix, iy + 1) > 40)) {
          mark.push(ix, iy);
        }
      }
    }
    for (var i = 0; i < mark.length; i += 2) {
      var o = (mark[i + 1] * w + mark[i]) * 4;
      d[o] = or_; d[o + 1] = og; d[o + 2] = ob; d[o + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return c;
  }

  function mirror(c) {
    var m = mkCanvas(c.width, c.height);
    var x = m.getContext('2d');
    x.translate(c.width, 0);
    x.scale(-1, 1);
    x.drawImage(c, 0, 0);
    return m;
  }

  // =====================================================================
  // Person compositor
  // spec: { h, skin, skinShade, hair, hairDark, hairLight, style, capColor,
  //   top, topDark, bottom, dress:bool, apron, trim, ermine, chain, child,
  //   heroine:bool, patch:bool }
  // dir: 'down'|'up'|'right' (left mirrored). frame: 0..3 walk (0 idle).
  // =====================================================================

  function drawPerson(x, s, dir, frame, kneel) {
    var P = G.Palette;
    var h = s.h;
    var bob = (frame === 1 || frame === 3) ? -1 : 0;
    if (kneel) bob = 2;
    var hairTop = 1 + bob;
    var faceTop = hairTop + 3;
    var faceH = 5;
    var tTop = faceTop + faceH;            // torso top
    var tH = s.child ? 4 : 6;
    var lTop = tTop + tH;                  // legs top
    var feetY = h - 1;
    var side = (dir === 'right');
    var up = (dir === 'up');

    // ---- legs / skirt ----
    if (kneel) {
      // pooled skirt / crouched legs
      rr(x, 3, lTop - 1, 10, h - lTop, s.dress ? s.bottom : s.bottom);
      rr(x, 2, h - 3, 12, 2, s.dress ? s.bottom : s.topDark);
      rr(x, 4, h - 4, 2, 1, shade(s.bottom, 1.25));
    } else if (s.dress) {
      var skirtH = feetY - lTop;
      rr(x, 4, lTop, 8, skirtH, s.bottom);
      rr(x, 3, lTop + Math.max(1, skirtH - 3), 10, 3, s.bottom);
      // hem sway
      var hemShift = frame === 1 ? 1 : (frame === 3 ? -1 : 0);
      rr(x, 3 + hemShift, feetY - 1, 10, 1, s.topDark || shade(s.bottom, 0.7));
      // feet peeking
      if (frame === 1) px(x, 6, feetY, s.boots || P.bark1);
      else if (frame === 3) px(x, 9, feetY, s.boots || P.bark1);
      else { px(x, 6, feetY, s.boots || P.bark1); px(x, 9, feetY, s.boots || P.bark1); }
      // skirt shadow line
      rr(x, 4, lTop, 8, 1, shade(s.bottom, 0.75));
    } else {
      var legH = feetY - lTop;
      var offA = 0, offB = 0;
      if (frame === 1) { offA = -1; offB = 1; }
      if (frame === 3) { offA = 1; offB = -1; }
      if (side) {
        rr(x, 6 + offA, lTop, 2, legH + 1, s.bottom);
        rr(x, 8 + offB, lTop, 2, legH + 1, shade(s.bottom, 0.8));
        rr(x, 6 + offA, feetY, 3, 1, s.boots || P.bark1);
        rr(x, 8 + offB, feetY, 3, 1, s.boots || P.bark1);
      } else {
        rr(x, 5, lTop, 2, legH + 1 + offA, s.bottom);
        rr(x, 9, lTop, 2, legH + 1 + offB, s.bottom);
        rr(x, 5, feetY + (offA < 0 ? -1 : 0), 2, 1, s.boots || P.bark1);
        rr(x, 9, feetY + (offB < 0 ? -1 : 0), 2, 1, s.boots || P.bark1);
      }
    }

    // ---- torso ----
    var tw = s.wide ? 12 : 8;
    var tx0 = 8 - tw / 2;
    rr(x, tx0, tTop, tw, tH, s.top);
    rr(x, tx0, tTop + tH - 1, tw, 1, s.topDark || shade(s.top, 0.75));
    // mantle / trim
    if (s.trim) {
      rr(x, tx0 - 1, tTop, tw + 2, 2, s.trim);
      if (s.ermine) {
        for (var e = tx0 - 1; e < tx0 + tw + 1; e += 3) px(x, e, tTop + 1, P.outline);
      }
    }
    if (s.chain) { px(x, 6, tTop + 2, P.goldRegal); px(x, 8, tTop + 3, P.goldRegal); px(x, 10, tTop + 2, P.goldRegal); }
    // apron
    if (s.apron && !up) {
      rr(x, 6, tTop + 2, 4, tH - 2 + (s.dress ? 3 : 0), s.apron);
      if (s.heroine) {
        px(x, 7, tTop + 3, P.outline); px(x, 8, tTop + 4, P.outline); // pin dashes
        var ahem = tTop + tH + (s.dress ? 0 : -1);
        px(x, 6, ahem, P.crimson); px(x, 8, ahem, P.crimson);         // gingham apron trim
        px(x, 7, ahem + 1, P.crimson);
      }
    }
    if (s.patch && !up) px(x, tx0 + 1, tTop + 2, P.patchBrown);
    // heroine details: measuring-tape sash + pincushion wristband
    if (s.heroine && !up) {
      for (var sy = 0; sy < 4; sy++) px(x, 10 - sy, tTop + sy + 1, sy % 2 ? P.outline : P.parchment);
    }

    // ---- arms ----
    var armY = tTop + 1;
    var armLen = tH - 1;
    if (kneel) {
      // one arm extended toward facing
      if (side) { rr(x, 11, armY + 2, 5, 2, s.top); px(x, 15, armY + 2, s.skin); }
      else { rr(x, 12, armY + 1, 2, 4, s.top); px(x, 13, armY + 5, s.skin); rr(x, 2, armY + 1, 1, armLen, s.top); }
    } else if (side) {
      var swing = frame === 1 ? 1 : (frame === 3 ? -1 : 0);
      rr(x, 7 + swing, armY, 2, armLen, shade(s.top, 0.85));
      px(x, 7 + swing, armY + armLen, s.skin);
    } else {
      rr(x, tx0 - 1, armY, 1, armLen, shade(s.top, 0.85));
      rr(x, tx0 + tw, armY, 1, armLen, shade(s.top, 0.85));
      px(x, tx0 - 1, armY + armLen, s.skin);
      px(x, tx0 + tw, armY + armLen, s.skin);
      if (s.heroine) { px(x, tx0 - 1, armY + armLen - 1, P.crimson); } // pincushion wristband
    }

    // ---- head ----
    rr(x, 4, faceTop, 8, faceH, up ? s.hair : s.skin);
    if (!up) {
      rr(x, 4, faceTop + faceH - 1, 8, 1, s.skinShade); // jaw
      if (side) {
        rr(x, 4, faceTop, 4, faceH, s.hair);            // hair covers back of head
        px(x, 9, faceTop + 2, P.outline);               // eye
        px(x, 10, faceTop + 1, G.Palette.linen);        // catchlight
      } else {
        px(x, 6, faceTop + 2, P.outline);
        px(x, 9, faceTop + 2, P.outline);
        px(x, 7, faceTop + 1, G.Palette.linen);
        if (s.heroine) { px(x, 4, faceTop + 3, G.Palette.terracottaPale); px(x, 11, faceTop + 3, G.Palette.terracottaPale); } // blush
      }
    }

    // ---- hair / headwear ----
    var st = s.style || 'short';
    if (st === 'bun') {
      rr(x, 4, hairTop, 8, 3, s.hair);
      rr(x, 4, hairTop + 2, 1, 2, s.hair); rr(x, 11, hairTop + 2, 1, 2, s.hair);
      var bx = up ? 6 : 6;
      rr(x, bx, hairTop - 1, 4, 2, s.hairDark || shade(s.hair, 0.8)); // the bun
      px(x, bx + 1, hairTop - 1, s.hairLight || shade(s.hair, 1.25));
      if (!up) { px(x, 4, faceTop + 1, s.hair); px(x, 11, faceTop + 1, s.hair); } // loose strands
    } else if (st === 'long') {
      rr(x, 4, hairTop, 8, 3, s.hair);
      rr(x, 3, hairTop + 1, 1, 7, s.hair);
      rr(x, 12, hairTop + 1, 1, 7, s.hair);
      px(x, 5, hairTop, s.hairLight || shade(s.hair, 1.25));
    } else if (st === 'powder') {
      rr(x, 4, hairTop - 1, 8, 4, s.hair);
      rr(x, 5, hairTop - 2, 6, 2, s.hair);
      px(x, 6, hairTop - 2, G.Palette.linen);
    } else if (st === 'cap') {
      rr(x, 4, hairTop, 8, 3, s.capColor);
      rr(x, 3, hairTop + 2, 10, 1, shade(s.capColor, 0.8));
    } else if (st === 'scarf') {
      rr(x, 4, hairTop, 8, 3, s.capColor);
      px(x, 3, faceTop + 1, s.capColor); px(x, 12, faceTop + 1, s.capColor);
      px(x, 12, faceTop + 3, s.capColor); // knot
    } else if (st === 'bald') {
      rr(x, 4, hairTop + 1, 8, 2, s.skin);
      rr(x, 4, hairTop + 2, 1, 1, s.hair); rr(x, 11, hairTop + 2, 1, 1, s.hair);
    } else if (st === 'crown') {
      rr(x, 4, hairTop, 8, 3, s.hair);
      rr(x, 3, hairTop + 1, 1, 5, s.hair); rr(x, 12, hairTop + 1, 1, 5, s.hair);
      px(x, 5, hairTop - 1, G.Palette.goldRegal); px(x, 8, hairTop - 1, G.Palette.goldRegal); px(x, 10, hairTop - 1, G.Palette.goldRegal);
    } else { // short
      rr(x, 4, hairTop, 8, 3, s.hair);
      px(x, 10, hairTop, s.hairLight || shade(s.hair, 1.2));
    }
  }

  function buildPersonFrames(base, spec, nframes) {
    FRAMES[base] = nframes;
    var dirs = ['down', 'up', 'right'];
    for (var d = 0; d < dirs.length; d++) {
      for (var f = 0; f < nframes; f++) {
        var c = mkCanvas(16, spec.h);
        drawPerson(c.getContext('2d'), spec, dirs[d], f, false);
        outlinePass(c);
        SP[base + '|' + dirs[d] + '|' + f] = c;
        if (dirs[d] === 'right') SP[base + '|left|' + f] = mirror(c);
      }
    }
  }

  // =====================================================================
  // Enemies
  // =====================================================================

  var MOTH_WING = '#9b8bb0', MOTH_WING_D = '#6d5f85'; // art.md §4 one-offs

  function buildEnemy(base, w, h, fn, telegraphFn) {
    FRAMES[base] = 2;
    var dirs = ['down', 'up', 'right'];
    for (var d = 0; d < dirs.length; d++) {
      for (var f = 0; f < 2; f++) {
        var c = mkCanvas(w, h);
        fn(c.getContext('2d'), f, dirs[d]);
        outlinePass(c);
        SP[base + '|' + dirs[d] + '|' + f] = c;
        if (dirs[d] === 'right') SP[base + '|left|' + f] = mirror(c);
      }
    }
    var t = mkCanvas(w, h);
    telegraphFn(t.getContext('2d'));
    outlinePass(t);
    SP[base + '_telegraph'] = t;
  }

  function buildEnemies() {
    var P = G.Palette;

    buildEnemy('fabric_moth', 12, 10, function (x, f) {
      var wy = f ? 1 : 0;
      rr(x, 0, 2 + wy, 4, 5 - wy, MOTH_WING);
      rr(x, 8, 2 + wy, 4, 5 - wy, MOTH_WING);
      px(x, 1, 3 + wy, MOTH_WING_D); px(x, 10, 3 + wy, MOTH_WING_D);
      rr(x, 4, 3, 4, 6, P.taupe);
      rr(x, 4, 3, 4, 2, shade(P.taupe, 1.15));
      px(x, 5, 4, P.outline); px(x, 6, 4, P.outline);
    }, function (x) {
      rr(x, 0, 1, 4, 6, P.linen);
      rr(x, 8, 1, 4, 6, P.linen);
      rr(x, 4, 3, 4, 6, P.taupe);
      px(x, 5, 4, P.outline); px(x, 6, 4, P.outline);
    });

    buildEnemy('mill_rat', 14, 8, function (x, f) {
      rr(x, 2, 2, 9, 5, P.soot);
      rr(x, 3, 5, 7, 2, P.taupe);
      rr(x, 10, 3, 3, 3, P.soot);              // head
      px(x, 12, 4, P.outline);                 // eye
      px(x, 11, 2, P.soot);                    // ear
      px(x, 4, 3, P.river2); px(x, 7, 4, P.plum); // dye splotches
      rr(x, 0, 3, 2, 1, P.skinShade);          // tail
      px(x, 5 + (f ? 1 : 0), 7, P.outline); px(x, 9 - (f ? 1 : 0), 7, P.outline); // feet
    }, function (x) {
      rr(x, 3, 1, 8, 5, P.soot);               // reared up
      rr(x, 9, 0, 3, 3, P.soot);
      px(x, 11, 1, P.outline);
      px(x, 4, 2, P.river2); px(x, 6, 3, P.plum);
      rr(x, 1, 0, 1, 4, P.skinShade);          // tail snapped vertical
      rr(x, 4, 6, 6, 2, P.taupe);
    });

    buildEnemy('guard_hound', 18, 14, function (x, f) {
      rr(x, 2, 4, 11, 6, P.bark2);
      rr(x, 2, 8, 11, 2, P.bark1);
      rr(x, 11, 2, 5, 5, P.bark2);             // head
      rr(x, 13, 5, 3, 2, P.parchment);         // muzzle
      px(x, 13, 3, P.outline);                 // eye
      rr(x, 11, 1, 2, 2, P.bark1);             // ear up
      rr(x, 10, 4, 2, 4, P.goldRegal);         // brass collar
      px(x, 11, 7, P.gold);                    // tag glint
      rr(x, 3 + (f ? 1 : 0), 10, 2, 4, P.bark1);
      rr(x, 8 - (f ? 1 : 0), 10, 2, 4, P.bark1);
      rr(x, 0, 4, 2, 2, P.bark2);              // tail
    }, function (x) {
      rr(x, 2, 7, 11, 5, P.bark2);             // crouched — front dropped
      rr(x, 11, 6, 5, 5, P.bark2);
      rr(x, 13, 9, 3, 2, P.parchment);
      px(x, 13, 7, P.crimson);                 // eye intent
      rr(x, 11, 6, 2, 1, P.bark1);             // ears flat
      rr(x, 10, 8, 2, 4, P.goldRegal);
      px(x, 11, 11, P.gold);
      rr(x, 3, 12, 2, 2, P.bark1); rr(x, 8, 12, 2, 2, P.bark1);
      rr(x, 0, 6, 2, 1, P.bark2);
    });

    buildEnemy('silk_spinner', 14, 12, function (x, f) {
      rr(x, 4, 3, 6, 6, P.linen);
      rr(x, 5, 2, 4, 2, P.silver);
      px(x, 6, 5, P.outline); px(x, 8, 5, P.outline);
      var lo = f ? 1 : 0;
      for (var i = 0; i < 3; i++) {
        px(x, 2, 4 + i * 2 + lo, P.taupe); px(x, 3, 5 + i * 2, P.taupe);
        px(x, 11, 4 + i * 2 + (1 - lo), P.taupe); px(x, 10, 5 + i * 2, P.taupe);
      }
      px(x, 7, 9, P.silver);                   // spinneret
    }, function (x) {
      rr(x, 4, 4, 6, 6, P.linen);
      rr(x, 5, 3, 4, 2, P.silver);
      px(x, 6, 6, P.outline); px(x, 8, 6, P.outline);
      rr(x, 3, 1, 2, 3, P.taupe);              // front legs curled up
      rr(x, 9, 1, 2, 3, P.taupe);
      px(x, 2, 6, P.taupe); px(x, 11, 6, P.taupe);
    });

    buildEnemy('dust_wisp', 12, 14, function (x, f) {
      var o = f ? 1 : 0;
      x.globalAlpha = 0.7;
      rr(x, 3 + o, 1, 6, 3, P.parchment);
      rr(x, 2 + o, 3, 8, 6, P.parchment);
      rr(x, 3 - o, 8, 6, 3, P.parchment);
      rr(x, 4 - o, 11, 3, 2, P.parchment);
      x.globalAlpha = 1;
      px(x, 5 + o, 5, P.gold);                 // core
      px(x, 4 + o, 4, P.outline); px(x, 7 + o, 4, P.outline);
    }, function (x) {
      rr(x, 3, 1, 6, 3, P.linen);
      rr(x, 2, 3, 8, 6, P.linen);
      rr(x, 3, 8, 6, 3, P.linen);
      px(x, 5, 5, P.gold);
      px(x, 4, 4, P.outline); px(x, 7, 4, P.outline);
    });

    buildEnemy('clockwork_sentry', 20, 28, function (x, f) {
      var ao = f ? 1 : 0;
      rr(x, 5, 2, 10, 8, P.marketGreen);       // verdigris head/hood
      rr(x, 6, 4, 8, 3, P.bark2);
      rr(x, 8, 5, 4, 2, P.linen);              // eye lamp (idle)
      rr(x, 4, 10, 12, 12, P.marketGreen);     // body
      rr(x, 5, 11, 10, 10, P.bark2);
      rr(x, 8, 13, 4, 5, P.crimson);           // chest bobbin
      px(x, 9, 14, P.crimsonDeep);
      rr(x, 2, 11 + ao, 2, 8, P.soot);         // arms with shear-hands
      rr(x, 16, 11 + (1 - ao), 2, 8, P.soot);
      px(x, 2, 19 + ao, P.silver); px(x, 17, 19 + (1 - ao), P.silver);
      rr(x, 6, 22, 3, 6, P.soot);              // legs / rail carriage
      rr(x, 11, 22, 3, 6, P.soot);
      rr(x, 5, 27, 10, 1, P.bark1);
    }, function (x) {
      rr(x, 5, 2, 10, 8, P.marketGreen);
      rr(x, 6, 4, 8, 3, P.bark2);
      rr(x, 8, 5, 4, 2, P.gold);               // eye charging Thread Gold
      px(x, 9, 5, P.linen);
      rr(x, 4, 10, 12, 12, P.marketGreen);
      rr(x, 5, 11, 10, 10, P.bark2);
      rr(x, 8, 13, 4, 5, P.crimson);
      rr(x, 1, 9, 3, 10, P.soot);              // arms raised
      rr(x, 16, 9, 3, 10, P.soot);
      px(x, 2, 9, P.silver); px(x, 17, 9, P.silver);
      rr(x, 6, 22, 3, 6, P.soot);
      rr(x, 11, 22, 3, 6, P.soot);
      rr(x, 5, 27, 10, 1, P.bark1);
    });
  }

  // =====================================================================
  // Icons
  // =====================================================================

  function buildFabricIcon(id, color) {
    var c = mkCanvas(12, 12), x = c.getContext('2d');
    // a little bolt of cloth: rolled end + draped tail
    rr(x, 1, 2, 10, 5, color);
    rr(x, 1, 2, 10, 1, shade(color, 1.25));
    rr(x, 1, 6, 10, 1, shade(color, 0.7));
    rr(x, 8, 3, 3, 3, shade(color, 0.8));       // roll core
    px(x, 9, 4, shade(color, 1.3));
    rr(x, 1, 7, 7, 3, shade(color, 0.9));       // draped tail
    rr(x, 1, 9, 5, 1, shade(color, 0.7));
    if (id === 'moonweave') { px(x, 4, 4, '#ffffff'); px(x, 3, 8, G.Palette.linen); }
    if (id === 'cloth_of_gold') px(x, 4, 4, G.Palette.gold);
    if (id === 'ermine_trim') { px(x, 3, 4, G.Palette.outline); px(x, 6, 4, G.Palette.outline); }
    outlinePass(c);
    SP['fabric_' + id] = c;
  }

  var GARMENT_SHAPE = {
    patch_cap: 'cap', burlap_apron: 'apron', simple_dress: 'dress', wool_scarf: 'scarf',
    mended_work_coat: 'coat', linen_shirt: 'shirt', calico_day_dress: 'dress',
    canvas_work_jacket: 'coat', madder_cloak: 'cloak', storm_coat: 'coat',
    silk_blouse: 'shirt', brocade_waistcoat: 'waistcoat', satin_evening_gown: 'gown',
    gauze_ballgown: 'gown', velvet_court_robe: 'robe', gold_ceremony_mantle: 'mantle',
    moonlit_stole: 'scarf', coronation_gown: 'gown',
  };

  function buildGarmentIcon(id, g) {
    var c = mkCanvas(12, 12), x = c.getContext('2d');
    var firstFab = null;
    for (var fid in g.recipe) { firstFab = fid; break; }
    var col = (G.Data && G.Data.fabrics[firstFab]) ? G.Data.fabrics[firstFab].color : G.Palette.poorIndigo;
    var lite = shade(col, 1.25), dark = shade(col, 0.72);
    var shapeKind = GARMENT_SHAPE[id] || 'shirt';

    switch (shapeKind) {
      case 'cap':
        rr(x, 2, 4, 8, 4, col); rr(x, 1, 7, 10, 2, dark); px(x, 4, 5, lite); px(x, 7, 5, G.Palette.patchBrown);
        break;
      case 'apron':
        rr(x, 4, 1, 4, 3, col); rr(x, 2, 4, 8, 7, col); rr(x, 2, 4, 8, 1, dark);
        px(x, 3, 6, lite); rr(x, 5, 7, 2, 2, dark);
        break;
      case 'dress':
        rr(x, 4, 1, 4, 4, col); rr(x, 3, 5, 6, 3, col); rr(x, 2, 8, 8, 3, col);
        rr(x, 2, 10, 8, 1, dark); px(x, 5, 2, lite);
        break;
      case 'scarf':
        rr(x, 2, 3, 8, 3, col); rr(x, 7, 5, 3, 6, col); rr(x, 7, 10, 3, 1, dark);
        px(x, 3, 4, lite); px(x, 8, 7, dark);
        break;
      case 'coat':
        rr(x, 2, 2, 8, 9, col); rr(x, 1, 2, 2, 6, dark); rr(x, 9, 2, 2, 6, dark);
        rr(x, 5, 2, 2, 9, dark); px(x, 3, 4, lite);
        if (id === 'mended_work_coat') { px(x, 8, 7, G.Palette.gold); px(x, 3, 8, G.Palette.gold); }
        break;
      case 'shirt':
        rr(x, 2, 2, 8, 7, col); rr(x, 1, 2, 2, 4, col); rr(x, 9, 2, 2, 4, col);
        rr(x, 5, 2, 2, 2, dark); px(x, 3, 4, lite); rr(x, 2, 8, 8, 1, dark);
        break;
      case 'cloak':
        rr(x, 3, 1, 6, 2, dark); rr(x, 2, 3, 8, 8, col); rr(x, 1, 8, 10, 3, col);
        rr(x, 1, 10, 10, 1, dark); px(x, 6, 2, G.Palette.gold);
        break;
      case 'waistcoat':
        rr(x, 3, 2, 6, 8, col); rr(x, 5, 2, 2, 8, dark);
        px(x, 4, 4, G.Palette.gold); px(x, 4, 6, G.Palette.gold); px(x, 3, 3, lite);
        break;
      case 'gown':
        rr(x, 4, 1, 4, 3, col); rr(x, 3, 4, 6, 2, col); rr(x, 2, 6, 8, 4, col); rr(x, 1, 10, 10, 1, col);
        px(x, 5, 2, lite); rr(x, 2, 9, 8, 1, dark);
        if (id === 'coronation_gown') {
          px(x, 3, 7, G.Palette.gold); px(x, 8, 8, G.Palette.gold); px(x, 5, 5, '#ffffff');
          rr(x, 4, 0, 4, 1, G.Palette.goldRegal);
        }
        break;
      case 'robe':
        rr(x, 2, 1, 8, 10, col); rr(x, 5, 1, 2, 10, G.Palette.goldRegal);
        rr(x, 1, 1, 2, 9, dark); rr(x, 9, 1, 2, 9, dark); px(x, 3, 3, lite);
        break;
      case 'mantle':
        rr(x, 1, 2, 10, 8, col); rr(x, 1, 2, 10, 2, G.Palette.linen);
        px(x, 2, 3, G.Palette.outline); px(x, 5, 3, G.Palette.outline); px(x, 8, 3, G.Palette.outline);
        rr(x, 1, 9, 10, 1, dark); px(x, 6, 6, lite);
        break;
    }
    outlinePass(c);
    SP['garment_' + id] = c;
  }

  function buildSmallIcons() {
    var P = G.Palette;
    function icon(name, w, h, fn) {
      var c = mkCanvas(w, h);
      fn(c.getContext('2d'));
      outlinePass(c);
      SP[name] = c;
    }
    icon('heart', 8, 8, function (x) {
      rr(x, 1, 1, 2, 2, P.crimson); rr(x, 5, 1, 2, 2, P.crimson);
      rr(x, 0, 2, 8, 3, P.crimson); rr(x, 1, 5, 6, 1, P.crimson);
      rr(x, 2, 6, 4, 1, P.crimson); rr(x, 3, 7, 2, 1, P.crimsonDeep);
      px(x, 1, 2, P.terracottaPale);
    });
    icon('heart_empty', 8, 8, function (x) {
      rr(x, 1, 1, 2, 2, P.soot); rr(x, 5, 1, 2, 2, P.soot);
      rr(x, 0, 2, 8, 3, P.soot); rr(x, 1, 5, 6, 1, P.soot);
      rr(x, 2, 6, 4, 1, P.soot); rr(x, 3, 7, 2, 1, P.soot);
    });
    icon('coin', 8, 8, function (x) {
      rr(x, 1, 1, 6, 6, P.bark3);
      rr(x, 2, 1, 4, 6, P.goldRegal); rr(x, 1, 2, 6, 4, P.goldRegal);
      px(x, 2, 2, P.linen); rr(x, 4, 3, 1, 3, P.bark3);
    });
    icon('bolt', 8, 8, function (x) { // stamina lightning-bobbin
      px(x, 4, 0, P.gold); px(x, 3, 1, P.gold); rr(x, 2, 2, 3, 2, P.gold);
      rr(x, 3, 4, 3, 2, P.gold); px(x, 4, 6, P.gold); px(x, 5, 7, P.linen);
    });
    icon('star', 8, 8, function (x) {
      px(x, 4, 0, P.gold); rr(x, 3, 1, 3, 2, P.gold);
      rr(x, 0, 3, 8, 2, P.gold); rr(x, 2, 5, 4, 1, P.gold);
      px(x, 1, 6, P.gold); px(x, 6, 6, P.gold); px(x, 4, 2, P.linen);
    });
    icon('star_empty', 8, 8, function (x) {
      px(x, 4, 0, P.soot); rr(x, 3, 1, 3, 2, P.soot);
      rr(x, 0, 3, 8, 2, P.soot); rr(x, 2, 5, 4, 1, P.soot);
      px(x, 1, 6, P.soot); px(x, 6, 6, P.soot);
    });
    icon('rep', 8, 8, function (x) { // thread spool
      rr(x, 1, 0, 6, 2, P.bark2); rr(x, 1, 6, 6, 2, P.bark2);
      rr(x, 2, 2, 4, 4, P.gold); px(x, 2, 3, P.linen);
      rr(x, 6, 3, 2, 1, P.gold); // trailing thread
    });
    icon('needle', 8, 8, function (x) {
      px(x, 6, 1, P.goldRegal); // eye
      px(x, 5, 2, P.silver); px(x, 4, 3, P.silver); px(x, 3, 4, P.silver);
      px(x, 2, 5, P.silver); px(x, 1, 6, P.linen);
    });
    icon('cursor', 8, 8, function (x) {
      px(x, 0, 0, P.linen); rr(x, 0, 1, 2, 1, P.linen); rr(x, 0, 2, 3, 1, P.linen);
      rr(x, 0, 3, 4, 1, P.linen); rr(x, 0, 4, 3, 1, P.linen); px(x, 0, 5, P.linen);
    });
    icon('node_glint_0', 10, 10, function (x) {
      px(x, 4, 3, P.gold); px(x, 4, 5, P.gold); px(x, 3, 4, P.gold); px(x, 5, 4, P.gold);
      px(x, 4, 4, P.linen);
    });
    icon('node_glint_1', 10, 10, function (x) {
      rr(x, 4, 1, 1, 3, P.gold); rr(x, 4, 6, 1, 3, P.gold);
      rr(x, 1, 4, 3, 1, P.gold); rr(x, 6, 4, 3, 1, P.gold);
      px(x, 4, 4, '#ffffff'); px(x, 4, 5, P.linen);
    });
  }

  // scissor swipe arcs, one per direction
  function buildSwipes() {
    var P = G.Palette;
    var dirs = { down: Math.PI / 2, up: -Math.PI / 2, right: 0, left: Math.PI };
    for (var d in dirs) {
      var c = mkCanvas(16, 16), x = c.getContext('2d');
      x.translate(8, 8);
      x.rotate(dirs[d]);
      x.strokeStyle = P.gold;
      x.lineWidth = 2;
      x.beginPath(); x.arc(0, 0, 7, -0.7, 0.7); x.stroke();
      x.strokeStyle = P.linen;
      x.beginPath(); x.arc(0, 0, 5, -0.6, 0.6); x.stroke();
      x.strokeStyle = P.gold;
      x.lineWidth = 1;
      x.beginPath(); x.arc(0, 0, 3, -0.5, 0.5); x.stroke();
      SP['swipe_' + d] = c;
    }
  }

  // the 7:12 to Auberlin — green-and-brass engine + one crimson carriage
  function buildTrain() {
    var P = G.Palette;
    var c = mkCanvas(192, 48), x = c.getContext('2d');
    // engine (right-facing), x 100..190
    rr(x, 104, 14, 60, 22, P.marketGreen);          // boiler
    rr(x, 104, 14, 60, 4, shade(P.marketGreen, 1.2));
    rr(x, 104, 32, 60, 4, shade(P.marketGreen, 0.7));
    rr(x, 160, 8, 26, 28, P.meadow1);               // cab
    rr(x, 164, 12, 8, 8, P.parchment);              // cab window
    rr(x, 158, 6, 30, 3, P.outline);                // cab roof
    rr(x, 110, 4, 8, 12, P.soot);                   // funnel
    rr(x, 108, 2, 12, 3, P.goldRegal);              // funnel crown
    rr(x, 128, 8, 10, 7, P.goldRegal);              // steam dome
    rr(x, 104, 22, 60, 2, P.goldRegal);             // brass lining
    rr(x, 98, 26, 8, 10, P.crimsonDeep);            // cowcatcher
    px(x, 100, 20, P.gold);                         // headlamp
    // carriage, x 2..92
    rr(x, 4, 12, 88, 24, P.crimsonDeep);
    rr(x, 4, 12, 88, 3, P.goldRegal);
    rr(x, 4, 33, 88, 3, P.outline);
    for (var wx = 10; wx < 86; wx += 16) {
      rr(x, wx, 18, 9, 9, P.parchment);
      px(x, wx + 1, 19, P.linen);
      rr(x, wx, 27, 9, 1, P.goldRegal);
    }
    rr(x, 92, 20, 12, 4, P.soot);                   // coupling
    // wheels
    function wheel(cx0, cy0, r) {
      x.fillStyle = P.outline;
      x.beginPath(); x.arc(cx0, cy0, r, 0, Math.PI * 2); x.fill();
      x.fillStyle = P.soot;
      x.beginPath(); x.arc(cx0, cy0, r - 2, 0, Math.PI * 2); x.fill();
      x.fillStyle = P.silver;
      x.fillRect(cx0 - r + 2, cy0, (r - 2) * 2, 1);
      x.fillRect(cx0, cy0 - r + 2, 1, (r - 2) * 2);
      x.fillStyle = P.goldRegal;
      x.fillRect(cx0, cy0, 1, 1);
    }
    wheel(120, 40, 7); wheel(146, 40, 7); wheel(170, 40, 6);
    wheel(20, 40, 6); wheel(44, 40, 6); wheel(72, 40, 6);
    SP.train_side = c;
  }

  // =====================================================================
  // Character roster
  // =====================================================================

  function buildCharacters() {
    var P = G.Palette;

    // ---- Marielle Thimm ----
    var heroine = {
      h: 24, skin: P.skin, skinShade: P.skinShade,
      hair: P.bark2, hairDark: P.bark1, hairLight: P.bark3, style: 'bun',
      top: P.poorIndigo, topDark: P.soot, bottom: P.poorIndigo, dress: true,
      apron: P.linen, boots: P.bark1, heroine: true,
    };
    buildPersonFrames('player', heroine, 4);
    // action pose (kneel-reach), one per dir
    var dirs = ['down', 'up', 'right'];
    for (var d = 0; d < dirs.length; d++) {
      var c = mkCanvas(16, 24);
      drawPerson(c.getContext('2d'), heroine, dirs[d], 0, true);
      outlinePass(c);
      SP['player_action_' + dirs[d]] = c;
      if (dirs[d] === 'right') SP['player_action_left'] = mirror(c);
    }

    // ---- NPCs ----
    var npcSpecs = {
      odile_marchand: { h: 24, skin: P.skin, skinShade: P.skinShade, hair: P.stone3, style: 'bun',
        top: P.terracotta, bottom: P.terracotta, dress: true, apron: P.linen },
      berta_klee: { h: 24, skin: P.skinB, skinShade: P.skinBShade, hair: P.bark1, style: 'scarf', capColor: P.poorFade,
        top: P.poorIndigo, bottom: P.patchBrown, dress: true, apron: P.linen, patch: true },
      sylvie_marsh: { h: 24, skin: P.skin, skinShade: P.skinShade, hair: P.bark1, style: 'long',
        top: P.marketGreen, bottom: P.marketGreen, dress: true, trim: P.terracotta },
      countess_elowen: { h: 26, skin: P.skin, skinShade: P.skinShade, hair: P.silver, style: 'powder',
        top: P.plum, topDark: P.plumDeep, bottom: P.plumDeep, dress: true, trim: P.silver },
      steward_quill: { h: 26, skin: P.skin, skinShade: P.skinShade, hair: P.stone3, style: 'bald',
        top: P.crimsonDeep, bottom: P.soot, dress: false, chain: true, trim: P.goldRegal },
      corvin_alba: { h: 26, skin: P.skin, skinShade: P.skinShade, hair: P.outline, style: 'short',
        top: P.plumDeep, bottom: P.outline, dress: false, trim: P.silver },
      pim: { h: 18, skin: P.skinB, skinShade: P.skinBShade, hair: P.bark3, style: 'short',
        top: P.poorFade, bottom: P.patchBrown, dress: false, child: true, patch: true },
      iva: { h: 22, skin: P.skinB, skinShade: P.skinBShade, hair: P.stone3, style: 'scarf', capColor: P.patchBrown,
        top: P.patchBrown, bottom: P.soot, dress: true },
      mrs_tansy: { h: 22, skin: P.skin, skinShade: P.skinShade, hair: P.stone3, style: 'bun',
        top: P.poorIndigo, bottom: P.patchBrown, dress: true, patch: true },
      princess_adelina: { h: 26, skin: P.skin, skinShade: P.skinShade, hair: P.goldRegal, style: 'crown',
        top: P.crimson, topDark: P.crimsonDeep, bottom: P.crimsonDeep, dress: true, trim: P.linen, ermine: true },
    };
    for (var id in npcSpecs) buildPersonFrames('npc_' + id, npcSpecs[id], 2);

    // ---- generic customers per tier ----
    var custSpecs = {
      customer_poor_0: { h: 24, skin: P.skin, skinShade: P.skinShade, hair: P.bark1, style: 'cap', capColor: P.patchBrown,
        top: P.poorIndigo, bottom: P.patchBrown, dress: false, patch: true },
      customer_poor_1: { h: 24, skin: P.skinB, skinShade: P.skinBShade, hair: P.soot, style: 'scarf', capColor: P.poorFade,
        top: P.patchBrown, bottom: P.poorIndigo, dress: true, patch: true },
      customer_middle_0: { h: 24, skin: P.skin, skinShade: P.skinShade, hair: P.bark2, style: 'short',
        top: P.terracotta, bottom: P.bark1, dress: false, apron: P.linen },
      customer_middle_1: { h: 24, skin: P.skinB, skinShade: P.skinBShade, hair: P.bark1, style: 'long',
        top: P.marketGreen, bottom: P.terracotta, dress: true },
      customer_noble_0: { h: 26, skin: P.skin, skinShade: P.skinShade, hair: P.silver, style: 'powder',
        top: P.plum, topDark: P.plumDeep, bottom: P.plumDeep, dress: true, trim: P.silver },
      customer_noble_1: { h: 26, skin: P.skin, skinShade: P.skinShade, hair: P.soot, style: 'short',
        top: P.plumDeep, bottom: P.outline, dress: false, trim: P.silver },
      customer_royal_0: { h: 26, skin: P.skin, skinShade: P.skinShade, hair: P.bark3, style: 'long',
        top: P.crimson, topDark: P.crimsonDeep, bottom: P.crimsonDeep, dress: true, trim: P.linen, ermine: true, wide: true },
      customer_royal_1: { h: 26, skin: P.skinB, skinShade: P.skinBShade, hair: P.stone3, style: 'short',
        top: P.crimsonDeep, bottom: P.soot, dress: false, trim: P.goldRegal, ermine: true, chain: true, wide: true },
    };
    for (id in custSpecs) buildPersonFrames(id, custSpecs[id], 2);
  }

  // =====================================================================
  // API
  // =====================================================================

  function magenta(w, h) {
    var c = mkCanvas(w || 12, h || 12), x = c.getContext('2d');
    x.fillStyle = '#ff00ff';
    x.fillRect(0, 0, c.width, c.height);
    return c;
  }

  G.Sprites = {
    init: function () {
      buildCharacters();
      buildEnemies();
      buildSmallIcons();
      buildSwipes();
      buildTrain();
      var id;
      if (G.Data) {
        for (id in G.Data.fabrics) buildFabricIcon(id, G.Data.fabrics[id].color);
        for (id in G.Data.garments) buildGarmentIcon(id, G.Data.garments[id]);
      }
    },

    has: function (name) { return !!SP[name]; },

    get: function (name) {
      var s = SP[name];
      if (s) return s;
      if (!warned[name]) {
        warned[name] = true;
        console.warn('G.Sprites: unknown sprite "' + name + '"');
      }
      SP[name] = magenta();
      return SP[name];
    },

    anim: function (base, dir, frame) {
      var n = FRAMES[base] || 1;
      var f = ((frame | 0) % n + n) % n;
      var s = SP[base + '|' + (dir || 'down') + '|' + f] || SP[base + '|down|' + f] || SP[base + '|down|0'];
      if (s) return s;
      return this.get(base); // magenta + warn path
    },
  };

})();
