'use strict';
// The Gilded Needle — engine.js
// Owns: G.W / G.H / G.TILE, G.Engine (rAF loop, shake), G.Input, G.Camera,
// the scene registry, G.Save, G.Audio (procedural WebAudio music + SFX), G.Utils.
//
// Contract deviations: none, with one judgment call noted for the integrator —
//   art.md §9 says SFX duck music -4dB for 200ms; the 'step' sfx is exempted from
//   ducking so continuous walking does not hold the music permanently ducked.

window.G = window.G || {};

G.W = 480;
G.H = 270;
G.TILE = 16;

(function () {

  // =====================================================================
  // G.Utils
  // =====================================================================

  var axisObj = { x: 0, y: 0 }; // reused every call — no per-frame allocation

  G.Utils = {
    clamp: function (v, a, b) { return v < a ? a : (v > b ? b : v); },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    dist: function (x1, y1, x2, y2) {
      var dx = x2 - x1, dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy);
    },
    aabb: function (a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    },
    rand: function (a, b) { return a + Math.random() * (b - a); },
    irand: function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    pick: function (arr) { return arr[(Math.random() * arr.length) | 0]; },
    chance: function (p) { return Math.random() < p; },

    // Text: body → VT323, head → "Press Start 2P". Baseline is 'top'.
    // opts: { size=10, color, align:'left'|'center'|'right', font:'body'|'head', shadow=true }
    text: function (ctx, str, x, y, opts) {
      opts = opts || {};
      var size = opts.size || 10;
      ctx.font = (opts.font === 'head')
        ? size + 'px "Press Start 2P"'
        : size + 'px VT323';
      ctx.textAlign = opts.align || 'left';
      ctx.textBaseline = 'top';
      if (opts.shadow !== false) {
        ctx.fillStyle = G.Palette.outline;
        ctx.fillText(str, x + 1, y + 1);
      }
      ctx.fillStyle = opts.color || G.Palette.linen;
      ctx.fillText(str, x, y);
    },

    wrapText: function (ctx, str, maxWidth, size, font) {
      size = size || 10;
      ctx.font = (font === 'head')
        ? size + 'px "Press Start 2P"'
        : size + 'px VT323';
      var out = [];
      var paras = String(str).split('\n');
      for (var p = 0; p < paras.length; p++) {
        var words = paras[p].split(' ');
        var line = '';
        for (var i = 0; i < words.length; i++) {
          var test = line ? line + ' ' + words[i] : words[i];
          if (line && ctx.measureText(test).width > maxWidth) {
            out.push(line);
            line = words[i];
          } else {
            line = test;
          }
        }
        out.push(line);
      }
      return out;
    },

    roundRect: function (ctx, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      if (r < 0) r = 0;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },
  };

  // =====================================================================
  // G.Input
  // =====================================================================

  var keysDown = {};      // code -> true while held
  var keysPressed = {};   // code -> true only on the frame the key went down
  var PREVENT = {
    ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, Space: 1, Tab: 1,
  };
  var inputWired = false;

  function canvasCoords(e) {
    var c = G.Engine.canvas;
    if (!c) return;
    var r = c.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    G.Input.mouse.x = G.Utils.clamp((e.clientX - r.left) * (G.W / r.width), 0, G.W - 1);
    G.Input.mouse.y = G.Utils.clamp((e.clientY - r.top) * (G.H / r.height), 0, G.H - 1);
  }

  function wireInput(canvas) {
    if (inputWired) return;
    inputWired = true;

    window.addEventListener('keydown', function (e) {
      if (G.Audio && G.Audio.unlock) G.Audio.unlock();
      if (PREVENT[e.code]) e.preventDefault();
      if (!e.repeat && !keysDown[e.code]) keysPressed[e.code] = true;
      keysDown[e.code] = true;
    });

    window.addEventListener('keyup', function (e) {
      delete keysDown[e.code];
    });

    window.addEventListener('blur', function () {
      keysDown = {};
      keysPressed = {};
      G.Input.mouse.down = false;
    });

    canvas.addEventListener('pointerdown', function (e) {
      if (G.Audio && G.Audio.unlock) G.Audio.unlock();
      canvasCoords(e);
      G.Input.mouse.down = true;
      G.Input.mouse.clicked = true;
    });

    canvas.addEventListener('pointermove', function (e) {
      canvasCoords(e);
    });

    window.addEventListener('pointerup', function () {
      G.Input.mouse.down = false;
    });
  }

  G.Input = {
    mouse: { x: 0, y: 0, down: false, clicked: false },

    down: function (code) { return !!keysDown[code]; },
    pressed: function (code) { return !!keysPressed[code]; },

    axis: function () {
      var x = 0, y = 0;
      if (keysDown.KeyA || keysDown.ArrowLeft) x -= 1;
      if (keysDown.KeyD || keysDown.ArrowRight) x += 1;
      if (keysDown.KeyW || keysDown.ArrowUp) y -= 1;
      if (keysDown.KeyS || keysDown.ArrowDown) y += 1;
      if (x !== 0 && y !== 0) { x *= 0.70710678; y *= 0.70710678; }
      axisObj.x = x; axisObj.y = y;
      return axisObj;
    },

    endFrame: function () {
      // reuse the object: delete keys instead of reallocating
      for (var k in keysPressed) {
        if (keysPressed.hasOwnProperty(k)) delete keysPressed[k];
      }
      this.mouse.clicked = false;
    },
  };

  // =====================================================================
  // G.Camera
  // =====================================================================

  var shakeI = 0, shakeT = 0, shakeDur = 0;

  G.Camera = {
    x: 0, y: 0,

    follow: function (px, py, mapWpx, mapHpx) {
      if (mapWpx <= G.W) this.x = (mapWpx - G.W) / 2;
      else this.x = G.Utils.clamp(px - G.W / 2, 0, mapWpx - G.W);
      if (mapHpx <= G.H) this.y = (mapHpx - G.H) / 2;
      else this.y = G.Utils.clamp(py - G.H / 2, 0, mapHpx - G.H);
    },

    begin: function (ctx) {
      ctx.save();
      var ox = 0, oy = 0;
      if (shakeT > 0 && shakeDur > 0) {
        var m = shakeI * (shakeT / shakeDur);
        ox = (Math.random() * 2 - 1) * m;
        oy = (Math.random() * 2 - 1) * m;
      }
      ctx.translate(Math.round(-this.x + ox), Math.round(-this.y + oy));
    },

    end: function (ctx) {
      ctx.restore();
    },
  };

  // =====================================================================
  // Scene registry
  // =====================================================================

  var scenes = {};

  G.scene = null;
  G.sceneName = '';

  G.registerScene = function (name, scene) {
    scenes[name] = scene;
  };

  G.setScene = function (name, params) {
    var next = scenes[name];
    if (!next) {
      console.warn('G.setScene: unknown scene "' + name + '"');
      return;
    }
    if (G.scene && G.scene.exit) G.scene.exit();
    G.scene = next;
    G.sceneName = name;
    if (next.enter) next.enter(params || {});
  };

  // =====================================================================
  // G.Engine
  // =====================================================================

  var rafLast = -1;
  var running = false;

  function frame(ts) {
    requestAnimationFrame(frame);
    var now = ts / 1000;
    if (rafLast < 0) rafLast = now;
    var dt = now - rafLast;
    rafLast = now;
    if (dt < 0) dt = 0;
    if (dt > 0.05) dt = 0.05;

    G.Engine.time += dt;
    if (shakeT > 0) shakeT -= dt;

    var ctx = G.Engine.ctx;

    // exact per-frame order per SPEC:
    if (G.scene && G.scene.update) G.scene.update(dt);
    if (G.UI && G.UI.update) G.UI.update(dt);

    ctx.setTransform(1, 0, 0, 1, 0, 0); // defensive reset
    ctx.fillStyle = G.Palette.outline;
    ctx.fillRect(0, 0, G.W, G.H);

    if (G.scene && G.scene.draw) G.scene.draw(ctx);
    if (G.UI && G.UI.draw) G.UI.draw(ctx);

    G.Input.endFrame();
  }

  G.Engine = {
    canvas: null,
    ctx: null,
    time: 0,

    init: function (canvasId) {
      var c = document.getElementById(canvasId);
      this.canvas = c;
      this.ctx = c.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
      this.time = 0;
      wireInput(c);
    },

    start: function () {
      if (running) return;
      running = true;
      rafLast = -1;
      requestAnimationFrame(frame);
    },

    shake: function (intensity, duration) {
      shakeI = intensity || 3;
      shakeDur = shakeT = duration || 0.3;
    },
  };

  // =====================================================================
  // G.Save
  // =====================================================================

  function deepMerge(dst, src) {
    for (var k in src) {
      if (!src.hasOwnProperty(k)) continue;
      var v = src[k];
      if (v && typeof v === 'object' && !Array.isArray(v) &&
          dst[k] && typeof dst[k] === 'object' && !Array.isArray(dst[k])) {
        deepMerge(dst[k], v);
      } else {
        dst[k] = v;
      }
    }
  }

  G.Save = {
    KEY: 'gilded_needle_save',
    SLOT_PREFIX: 'gilded_needle_save_slot_',
    activeSlot: 1,

    key: function (slot) {
      return this.SLOT_PREFIX + normalizeSlot(slot || this.activeSlot);
    },

    migrateLegacy: function () {
      try {
        var slotKey = this.key(1);
        if (localStorage.getItem(slotKey) === null) {
          var raw = localStorage.getItem(this.KEY);
          if (raw !== null) {
            localStorage.setItem(slotKey, raw);
            localStorage.removeItem(this.KEY);
          }
        }
      } catch (e) { /* no-op */ }
    },

    save: function (slot) {
      if (!G.state) return false;
      slot = normalizeSlot(slot || this.activeSlot);
      this.activeSlot = slot;
      try {
        localStorage.setItem(this.key(slot), JSON.stringify(G.state));
        return true;
      } catch (e) {
        console.warn('G.Save.save failed:', e);
        return false;
      }
    },

    load: function (slot) {
      this.migrateLegacy();
      slot = normalizeSlot(slot || this.activeSlot);
      var raw;
      try { raw = localStorage.getItem(this.key(slot)); } catch (e) { return false; }
      if (!raw) return false;
      var data;
      try { data = JSON.parse(raw); } catch (e) { return false; }
      if (!data || typeof data !== 'object') return false;
      // merge over fresh defaults for forward-compat
      if (typeof G.newGameState === 'function') G.newGameState();
      if (!G.state || typeof G.state !== 'object') G.state = {};
      deepMerge(G.state, data);
      this.activeSlot = slot;
      return true;
    },

    has: function (slot) {
      this.migrateLegacy();
      try {
        if (slot) return localStorage.getItem(this.key(slot)) !== null;
        for (var i = 1; i <= 3; i++) if (localStorage.getItem(this.key(i)) !== null) return true;
        return false;
      } catch (e) { return false; }
    },

    summary: function (slot) {
      this.migrateLegacy();
      var raw;
      try { raw = localStorage.getItem(this.key(slot)); } catch (e) { return null; }
      if (!raw) return null;
      var data;
      try { data = JSON.parse(raw); } catch (e) { return null; }
      if (!data || typeof data !== 'object') return null;
      return {
        day: data.day || 1,
        gold: data.gold || 0,
        tier: data.tier || 0,
        map: data.player && data.player.map ? data.player.map : 'shop',
      };
    },

    clear: function (slot) {
      try {
        if (slot) localStorage.removeItem(this.key(slot));
        else {
          localStorage.removeItem(this.KEY);
          for (var i = 1; i <= 3; i++) localStorage.removeItem(this.key(i));
        }
      } catch (e) { /* no-op */ }
    },
  };

  function normalizeSlot(slot) {
    slot = Number(slot) | 0;
    if (slot < 1 || slot > 3) slot = 1;
    return slot;
  }

  // =====================================================================
  // G.Audio — procedural WebAudio chiptune (art.md §8) + SFX (art.md §9)
  // =====================================================================

  var actx = null;
  var unlocked = false;
  var masterGain = null, musicGain = null, sfxGain = null;
  var noiseBuf = null;
  var waves = {};            // 'p25' / 'p125' PeriodicWaves (pulse duty)
  var currentId = null;      // requested music id (may be pending pre-unlock)
  var inst = null;           // active playing track instance
  var stepToggle = false;    // footstep L/R volume alternation
  var MUSIC_VOL = 0.12;
  var SFX_VOL = 0.4;
  var DUCK = 0.63;           // -4 dB

  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  // Track definitions per art.md §8. prog = [rootMidi, thirdInterval(3=min,4=maj)] × 4,
  // each chord lasts 2 bars; loop = 8 bars. pat = lead phrase per 2-bar chord as
  // [beatOffset, chordTone(0=root,1=3rd,2=5th,3=oct), durationBeats].
  var TRACKS = {
    title: { // C major, warm & hopeful: C – Am – F – G
      bpm: 92, beats: 4, perc: 'full',
      prog: [[48, 4], [45, 3], [41, 4], [43, 4]],
      bass: 'half', bassWave: 'triangle', bassVol: 0.55,
      lead: { wave: 'triangle', attack: 0.08, vol: 0.5, vib: { hz: 5, depth: 3, delay: 0.05 } },
      pat: [[0, 0, 2], [2, 1, 1], [3, 2, 1], [4, 3, 2], [6, 2, 1], [7, 1, 1]],
      pad: 0.12,
    },
    train: { // D major, chugging optimism: D – Bm – G – A (echo lead)
      bpm: 112, beats: 4, perc: 'full',
      prog: [[50, 4], [47, 3], [43, 4], [45, 4]],
      bass: 'chug', bassWave: 'p25', bassVol: 0.5,
      lead: { wave: 'p25', attack: 0.005, vol: 0.42, shape: 'pluck', gate: 0.55 },
      pat: [[0, 0, 0.5], [1, 2, 0.5], [1.5, 1, 0.5], [2, 3, 0.5], [3, 2, 0.5],
            [4, 0, 0.5], [5, 2, 0.5], [6, 3, 1], [7, 2, 0.5]],
      echo: { time: 0.15, fb: 0.25, send: 0.35 },
      pad: 0,
    },
    city: { // G major, bustling folk market: G – Em – C – D
      bpm: 100, beats: 4, perc: 'full',
      prog: [[43, 4], [40, 3], [48, 4], [50, 4]],
      bass: 'walk', bassWave: 'triangle', bassVol: 0.55,
      lead: { wave: 'square', attack: 0.01, vol: 0.3, gate: 0.85 },
      pat: [[0, 0, 0.5], [0.5, 1, 0.5], [1, 2, 0.5], [2, 3, 0.5], [2.5, 2, 0.5],
            [3, 1, 0.5], [4, 2, 0.5], [5, 3, 0.5], [6, 2, 1], [7, 1, 0.5]],
      pad: 0.08,
    },
    shop: { // F major 3/4, cozy hearth waltz: F – Dm – Bb – C
      bpm: 76, beats: 3, perc: 'waltz',
      prog: [[41, 4], [38, 3], [46, 4], [48, 4]],
      bass: 'waltz', bassWave: 'triangle', bassVol: 0.6,
      lead: { wave: 'sine', attack: 0.12, vol: 0.55 },
      pat: [[0, 3, 2], [3, 2, 1.5], [4.5, 1, 1.5]],
      pad: 0,
    },
    mill: { // A minor, dusty-mysterious: Am – F – C – E
      bpm: 84, beats: 4, perc: 'nohat',
      prog: [[45, 3], [41, 4], [48, 4], [40, 4]],
      bass: 'drone', bassWave: 'triangle', bassVol: 0.42,
      lead: { wave: 'triangle', attack: 0.06, vol: 0.5, vib: { hz: 4, depth: 4, delay: 0.3 } },
      pat: [[0, 3, 3], [4, 2, 2], [6, 1, 2]],
      pad: 0.1,
    },
    warehouse: { // D minor, watery playful-sneaky: Dm – Bb – F – C (plucky drips)
      bpm: 96, beats: 4, perc: 'nohat',
      prog: [[50, 3], [46, 4], [41, 4], [48, 4]],
      bass: 'hop', bassWave: 'p25', bassVol: 0.5,
      lead: { wave: 'p125', attack: 0.004, vol: 0.45, shape: 'pluck' },
      pat: [[0, 3, 0.5], [1.5, 2, 0.5], [2, 3, 0.5], [3.5, 1, 0.5],
            [4, 2, 0.5], [5.5, 3, 0.5], [6, 0, 0.5], [7, 2, 0.5]],
      pad: 0,
    },
    grove: { // E minor, lush & dreamy: Em – C – G – D (sine + soft square echo double)
      bpm: 72, beats: 4, perc: 'nohat',
      prog: [[40, 3], [48, 4], [43, 4], [50, 4]],
      bass: 'arp', bassWave: 'triangle', bassVol: 0.5,
      lead: { wave: 'sine', attack: 0.09, vol: 0.55, vib: { hz: 3, depth: 3, delay: 0.2 },
              double: { wave: 'square', vol: 0.1, oct: 0 } },
      pat: [[0, 0, 2], [2, 2, 2], [4, 3, 3]],
      echo: { time: 0.26, fb: 0.3, send: 0.5 },
      pad: 0.1,
    },
    vault: { // C minor, tense held-breath: Cm – Ab – Fm – G (kick heartbeat only)
      bpm: 100, beats: 4, perc: 'kick',
      prog: [[48, 3], [44, 4], [41, 3], [43, 4]],
      bass: 'pulse', bassWave: 'p25', bassVol: 0.5,
      lead: { wave: 'p25', attack: 0.004, vol: 0.4, shape: 'pluck', gate: 0.5, oct: 12 },
      pat: [[0, 0, 0.5], [3, 1, 0.5], [5.5, 0, 0.5]],
      pad: 0.06,
    },
    royal: { // C major 120, triumphant coronation march: C – F – Am – G
      bpm: 120, beats: 4, perc: 'full',
      prog: [[48, 4], [41, 4], [45, 3], [43, 4]],
      bass: 'march', bassWave: 'square', bassVol: 0.4,
      lead: { wave: 'square', attack: 0.005, vol: 0.28,
              double: { wave: 'square', vol: 0.14, oct: 12 } },
      pat: [[0, 3, 1], [1, 2, 1], [2, 3, 1], [3, 2, 0.5], [3.5, 1, 0.5],
            [4, 3, 2], [6, 2, 1], [7, 3, 1]],
      pad: 0.08,
    },
  };

  function pulseWave(duty) {
    var n = 32;
    var real = new Float32Array(n);
    var imag = new Float32Array(n);
    for (var i = 1; i < n; i++) {
      real[i] = (2 / (i * Math.PI)) * Math.sin(Math.PI * i * duty);
    }
    return actx.createPeriodicWave(real, imag);
  }

  function setWave(o, w) {
    if (w === 'p25' || w === 'p125') o.setPeriodicWave(waves[w]);
    else o.type = w || 'triangle';
  }

  function buildBus() {
    masterGain = actx.createGain();
    masterGain.gain.value = G.Audio.muted ? 0 : 1;

    var lowpass = actx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 9000;

    var comp = actx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 30;      // soft knee — keeps chiptune warm, not shrill
    comp.ratio.value = 4;

    masterGain.connect(lowpass);
    lowpass.connect(comp);
    comp.connect(actx.destination);

    musicGain = actx.createGain();
    musicGain.gain.value = MUSIC_VOL;
    musicGain.connect(masterGain);

    sfxGain = actx.createGain();
    sfxGain.gain.value = SFX_VOL;
    sfxGain.connect(masterGain);

    // 1s white-noise buffer for percussion / footsteps
    var len = actx.sampleRate | 0;
    noiseBuf = actx.createBuffer(1, len, actx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    waves.p25 = pulseWave(0.25);
    waves.p125 = pulseWave(0.125);
  }

  // ---- music voices ---------------------------------------------------

  // spec: { wave, freq, t, dur, vol, attack, shape:'sus'|'pluck', vib:{hz,depth,delay}, echo }
  function mnote(i, spec) {
    var o = actx.createOscillator();
    setWave(o, spec.wave);
    o.frequency.setValueAtTime(spec.freq, spec.t);
    var g = actx.createGain();
    var a = spec.attack || 0.01;
    var end = spec.t + spec.dur;
    g.gain.setValueAtTime(0.0001, spec.t);
    g.gain.linearRampToValueAtTime(spec.vol, spec.t + a);
    if (spec.shape === 'pluck') {
      g.gain.exponentialRampToValueAtTime(0.001, end);
    } else {
      var rel = Math.min(0.1, spec.dur * 0.25);
      if (end - rel > spec.t + a) g.gain.setValueAtTime(spec.vol, end - rel);
      g.gain.linearRampToValueAtTime(0.0001, end);
    }
    o.connect(g);
    g.connect(i.gain);
    if (spec.echo && i.echo) g.connect(i.echo.send);
    if (spec.vib) {
      var lf = actx.createOscillator();
      lf.type = 'sine';
      lf.frequency.value = spec.vib.hz;
      var lg = actx.createGain();
      lg.gain.value = spec.vib.depth;
      lf.connect(lg);
      lg.connect(o.frequency);
      lf.start(spec.t + (spec.vib.delay || 0));
      lf.stop(end + 0.05);
    }
    o.start(spec.t);
    o.stop(end + 0.06);
  }

  function bnote(i, t, m, durBeats, volMult, shape) {
    mnote(i, {
      wave: i.def.bassWave, freq: midi(m), t: t, dur: durBeats * i.beatDur,
      vol: i.def.bassVol * (volMult || 1), attack: 0.008, shape: shape || 'sus',
    });
  }

  function lnote(i, t, m, durBeats) {
    var L = i.def.lead;
    var dur = Math.max(0.06, durBeats * i.beatDur * (L.gate || 0.92));
    mnote(i, {
      wave: L.wave, freq: midi(m), t: t, dur: dur, vol: L.vol,
      attack: L.attack, shape: L.shape, vib: L.vib, echo: !L.double,
    });
    if (L.double) {
      mnote(i, {
        wave: L.double.wave, freq: midi(m + (L.double.oct || 0)), t: t, dur: dur,
        vol: L.double.vol, attack: L.attack, shape: L.shape, echo: true,
      });
    }
  }

  // ---- percussion (filtered noise per art.md §8) ------------------------

  function noiseHit(dest, t, type, freq, q, dur, vol) {
    var src = actx.createBufferSource();
    src.buffer = noiseBuf;
    var f = actx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    var g = actx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  function hatHit(i, t, vol) { noiseHit(i.gain, t, 'highpass', 6000, 1, 0.03, vol); }
  function snareHit(i, t, vol) { noiseHit(i.gain, t, 'bandpass', 1800, 0.8, 0.08, vol); }

  function kickHit(dest, t, vol) {
    var o = actx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(50, t + 0.09);
    var g = actx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + 0.12);
  }

  // ---- step sequencer (8th-note grid, 8-bar loop) -----------------------

  function scheduleStep(i, stepAbs, t) {
    var def = i.def;
    var spb = def.beats * 2;               // 8th steps per bar
    var s = stepAbs % (spb * 8);
    var bar = (s / spb) | 0;               // 0..7
    var sib = s % spb;                     // step within bar
    var beat = sib / 2;
    var ci = bar >> 1;                     // chord index 0..3
    var root = def.prog[ci][0];
    var third = def.prog[ci][1];
    var second = (bar & 1) === 1;          // second bar of the chord
    var pos = (second ? def.beats : 0) + beat; // beat position within 2-bar chord

    // --- bass ---
    switch (def.bass) {
      case 'half': // root half-notes, walk up fifth on bar ends
        if (sib === 0) bnote(i, t, root, 2);
        else if (sib === 4) bnote(i, t, root, 1.5);
        else if (sib === 7) bnote(i, t, root + 7, 0.5);
        break;
      case 'chug': // eighth-note root-root-fifth-root wheel rhythm
        bnote(i, t, root + (sib % 4 === 2 ? 7 : 0), 0.3, 1, 'pluck');
        break;
      case 'walk': // walking quarters root-3rd-5th-3rd
        if (sib % 2 === 0) {
          bnote(i, t, root + [0, third, 7, third][beat | 0], 0.9);
        }
        break;
      case 'waltz': // oom-pah-pah: bass root beat 1, triangle 5th+octave stabs 2-3
        if (sib === 0) bnote(i, t, root, 1);
        else if (sib === 2 || sib === 4) {
          mnote(i, { wave: 'triangle', freq: midi(root + 7 + 12), t: t, dur: 0.4 * i.beatDur,
                     vol: def.bassVol * 0.45, attack: 0.01, shape: 'sus' });
          mnote(i, { wave: 'triangle', freq: midi(root + 24), t: t, dur: 0.4 * i.beatDur,
                     vol: def.bassVol * 0.4, attack: 0.01, shape: 'sus' });
        }
        break;
      case 'drone': // root+fifth drone half-notes, octave drop each 4th bar
        if (sib === 0 || sib === 4) {
          var dr = (bar % 4 === 3) ? root - 12 : root;
          bnote(i, t, dr, 2, 0.85);
          bnote(i, t, dr + 7, 2, 0.65);
        }
        break;
      case 'hop': // syncopated root-octave hops on off-beats
        if (sib % 2 === 1) {
          bnote(i, t, root + (((beat | 0) % 2) ? 12 : 0), 0.3, 1, 'pluck');
        }
        break;
      case 'arp': // slow rising arpeggio root-5th-octave over each chord
        if (sib % 4 === 0) {
          bnote(i, t, root + [0, 7, 12, 7][(pos / 2) | 0], 1.9);
        }
        break;
      case 'pulse': // 8th-note root ostinato; slips to Db for 2 beats each 4th bar
        var pr = (bar % 4 === 3 && beat >= 2) ? 49 : root;
        bnote(i, t, pr, 0.3, (sib % 2) ? 0.7 : 1, 'pluck');
        break;
      case 'march': // quarter root-root-fifth-octave + triangle timpani-thud on 1
        if (sib % 2 === 0) bnote(i, t, root + [0, 0, 7, 12][beat | 0], 0.8);
        if (sib === 0) {
          mnote(i, { wave: 'triangle', freq: midi(root - 12), t: t, dur: 0.3,
                     vol: 0.5, attack: 0.005, shape: 'pluck' });
        }
        break;
    }

    // --- lead phrase (per 2-bar chord) ---
    var pat = def.pat;
    for (var k = 0; k < pat.length; k++) {
      if (pat[k][0] === pos) {
        var off = [0, third, 7, 12][pat[k][1]];
        lnote(i, t, root + (def.lead.oct || 24) + off, pat[k][2]);
      }
    }

    // --- soft pad (2-bar sustained triad an octave above bass) ---
    if (def.pad && sib === 0 && !second) {
      var pd = 2 * def.beats * i.beatDur - 0.1;
      mnote(i, { wave: 'sine', freq: midi(root + 12), t: t, dur: pd, vol: def.pad, attack: 0.5 });
      mnote(i, { wave: 'sine', freq: midi(root + 12 + third), t: t, dur: pd, vol: def.pad, attack: 0.5 });
      mnote(i, { wave: 'sine', freq: midi(root + 19), t: t, dur: pd, vol: def.pad * 0.8, attack: 0.5 });
    }

    // --- percussion (zones drop hats; vault keeps only the kick) ---
    switch (def.perc) {
      case 'full':
        hatHit(i, t, sib % 2 === 0 ? 0.08 : 0.05);
        if (sib === 0 || sib === 4) kickHit(i.gain, t, 0.5);
        if (sib === 2 || sib === 6) snareHit(i, t, 0.18);
        break;
      case 'waltz':
        if (sib === 0) kickHit(i.gain, t, 0.4);
        else if (sib === 2 || sib === 4) hatHit(i, t, 0.06);
        break;
      case 'nohat':
        if (sib === 0 || sib === 4) kickHit(i.gain, t, 0.4);
        if (sib === 2 || sib === 6) snareHit(i, t, 0.12);
        break;
      case 'kick': // heartbeat: lub-dub
        if (sib === 0) kickHit(i.gain, t, 0.45);
        else if (sib === 1) kickHit(i.gain, t, 0.2);
        break;
    }
  }

  function tickTrack(i) {
    if (!actx) return;
    // lookahead scheduler: fill ~0.25s ahead on the AudioContext clock
    var horizon = actx.currentTime + 0.25;
    var guard = 0;
    while (i.next < horizon && guard++ < 128) {
      scheduleStep(i, i.step, i.next);
      i.next += i.stepDur;
      i.step++;
    }
  }

  function startTrack(id) {
    var def = TRACKS[id];
    if (!def) {
      console.warn('G.Audio: unknown music id "' + id + '"');
      return null;
    }
    var now = actx.currentTime;
    var i = {
      id: id, def: def, step: 0, next: now + 0.1,
      beatDur: 60 / def.bpm, stepDur: 30 / def.bpm,
      gain: actx.createGain(), echo: null, timer: 0,
    };
    i.gain.gain.setValueAtTime(0.0001, now);
    i.gain.gain.linearRampToValueAtTime(1, now + 0.4); // quick fade-in on switch
    i.gain.connect(musicGain);
    if (def.echo) {
      var dl = actx.createDelay(1);
      dl.delayTime.value = def.echo.time;
      var fb = actx.createGain();
      fb.gain.value = def.echo.fb;
      var send = actx.createGain();
      send.gain.value = def.echo.send;
      send.connect(dl);
      dl.connect(fb);
      fb.connect(dl);
      dl.connect(i.gain);
      i.echo = { send: send, delay: dl, fb: fb };
    }
    i.timer = setInterval(function () { tickTrack(i); }, 100);
    tickTrack(i);
    return i;
  }

  function fadeOutTrack(i) {
    clearInterval(i.timer);
    var now = actx.currentTime;
    i.gain.gain.cancelScheduledValues(now);
    i.gain.gain.setValueAtTime(i.gain.gain.value, now);
    i.gain.gain.linearRampToValueAtTime(0.0001, now + 0.35);
    setTimeout(function () {
      try {
        i.gain.disconnect();
        if (i.echo) {
          i.echo.send.disconnect();
          i.echo.delay.disconnect();
          i.echo.fb.disconnect();
        }
      } catch (e) { /* already gone */ }
    }, 800);
  }

  // ---- SFX (art.md §9 recipes) ------------------------------------------

  // spec: { wave, f, f1, tf, t, a, hold, dur, vol, vib:{hz,depth} }
  function tone(spec) {
    var o = actx.createOscillator();
    setWave(o, spec.wave);
    o.frequency.setValueAtTime(spec.f, spec.t);
    if (spec.f1) o.frequency.exponentialRampToValueAtTime(spec.f1, spec.t + (spec.tf || spec.dur));
    var g = actx.createGain();
    var a = spec.a || 0.005;
    g.gain.setValueAtTime(0.0001, spec.t);
    g.gain.linearRampToValueAtTime(spec.vol, spec.t + a);
    var sus = spec.t + Math.max(spec.hold || 0, a);
    if (sus > spec.t + a) g.gain.setValueAtTime(spec.vol, sus);
    g.gain.exponentialRampToValueAtTime(0.001, spec.t + spec.dur);
    if (spec.vib) {
      var lf = actx.createOscillator();
      lf.type = 'sine';
      lf.frequency.value = spec.vib.hz;
      var lg = actx.createGain();
      lg.gain.value = spec.vib.depth;
      lf.connect(lg);
      lg.connect(o.frequency);
      lf.start(spec.t);
      lf.stop(spec.t + spec.dur + 0.05);
    }
    o.connect(g);
    g.connect(sfxGain);
    o.start(spec.t);
    o.stop(spec.t + spec.dur + 0.05);
  }

  function duckMusic() {
    if (!musicGain) return;
    var now = actx.currentTime;
    var g = musicGain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(MUSIC_VOL * DUCK, now + 0.03); // -4 dB
    g.setValueAtTime(MUSIC_VOL * DUCK, now + 0.2);           // hold 200ms
    g.linearRampToValueAtTime(MUSIC_VOL, now + 0.35);
  }

  var SFX = {
    snip: function (t) { // two square down-sweep blips: "shk-shk"
      tone({ wave: 'square', f: 2200, f1: 1400, t: t, dur: 0.06, vol: 0.35 });
      tone({ wave: 'square', f: 2200, f1: 1400, t: t + 0.09, dur: 0.06, vol: 0.35 });
    },
    stitch: function (t) { // sine up-chirp
      tone({ wave: 'sine', f: 660, f1: 880, tf: 0.08, t: t, dur: 0.09, vol: 0.4 });
    },
    stitch_perfect: function (t) { // brighter chirp + square sparkle tail
      tone({ wave: 'sine', f: 880, f1: 1320, tf: 0.1, t: t, dur: 0.12, vol: 0.4 });
      tone({ wave: 'square', f: 1760, t: t + 0.07, dur: 0.05, vol: 0.15 });
    },
    coin: function (t) { // classic two-tone chime B5 → E6
      tone({ wave: 'square', f: 988, t: t, dur: 0.05, vol: 0.28 });
      tone({ wave: 'square', f: 1319, t: t + 0.05, dur: 0.13, vol: 0.28 });
    },
    pickup: function (t) { // triangle sweep pop of delight
      tone({ wave: 'triangle', f: 523, f1: 1046, tf: 0.1, t: t, a: 0.03, dur: 0.13, vol: 0.4 });
    },
    hurt: function (t) { // "oof" — square down-slide with slight wobble
      tone({ wave: 'square', f: 220, f1: 110, tf: 0.2, t: t, dur: 0.22, vol: 0.35,
             vib: { hz: 8, depth: 8 } });
    },
    step: function (t) { // lowpassed noise burst, alternating volume per foot
      stepToggle = !stepToggle;
      noiseHit(sfxGain, t, 'lowpass', 500, 1, 0.045, stepToggle ? 0.16 : 0.2);
    },
    ui: function (t) { // dry thimble tap
      tone({ wave: 'square', f: 1200, t: t, dur: 0.035, vol: 0.22 });
    },
    doorbell: function (t) { // G6 + E6 struck 80ms apart, detune shimmer
      tone({ wave: 'sine', f: 1568, t: t, dur: 0.3, vol: 0.28 });
      tone({ wave: 'sine', f: 1571, t: t, dur: 0.3, vol: 0.1 });
      tone({ wave: 'sine', f: 1319, t: t + 0.08, dur: 0.3, vol: 0.28 });
      tone({ wave: 'sine', f: 1316, t: t + 0.08, dur: 0.3, vol: 0.1 });
    },
    whistle: function (t) { // two detuned triangles A4 + C#5, swell-hold-fall
      tone({ wave: 'triangle', f: 440, t: t, a: 0.3, hold: 0.55, dur: 1.2, vol: 0.3 });
      tone({ wave: 'triangle', f: 554, t: t, a: 0.3, hold: 0.55, dur: 1.2, vol: 0.24 });
    },
    fanfare: function (t) { // C5-E5-G5 ascent → C6 held with vibrato + triangle octave under
      tone({ wave: 'square', f: 523, t: t, dur: 0.13, vol: 0.28 });
      tone({ wave: 'square', f: 659, t: t + 0.12, dur: 0.13, vol: 0.28 });
      tone({ wave: 'square', f: 784, t: t + 0.24, dur: 0.13, vol: 0.28 });
      tone({ wave: 'square', f: 1046, t: t + 0.36, a: 0.02, hold: 0.45, dur: 0.65,
             vol: 0.28, vib: { hz: 6, depth: 10 } });
      tone({ wave: 'triangle', f: 523, t: t + 0.36, a: 0.02, hold: 0.45, dur: 0.65, vol: 0.26 });
    },
    thud: function (t) { // heavy soft impact
      tone({ wave: 'sine', f: 100, f1: 40, tf: 0.12, t: t, dur: 0.14, vol: 0.6 });
      noiseHit(sfxGain, t, 'lowpass', 300, 1, 0.06, 0.25);
    },
  };

  // ---- public API --------------------------------------------------------

  G.Audio = {
    muted: false,

    init: function () {
      // AudioContext is built lazily in unlock() (first user gesture).
      // Pause/resume audio with tab visibility so the scheduler never gaps.
      document.addEventListener('visibilitychange', function () {
        if (!actx) return;
        try {
          if (document.hidden) {
            if (actx.state === 'running') actx.suspend();
          } else if (unlocked && actx.state === 'suspended') {
            actx.resume();
          }
        } catch (e) { /* no-op */ }
      });
    },

    unlock: function () {
      if (!unlocked) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        try {
          actx = new AC();
          buildBus();
        } catch (e) {
          actx = null;
          return;
        }
        unlocked = true;
      }
      if (actx.state === 'suspended') {
        try { actx.resume(); } catch (e) { /* no-op */ }
      }
      if (currentId && !inst) inst = startTrack(currentId);
    },

    playMusic: function (id) {
      if (id === currentId) return; // same id = no restart
      currentId = id;
      if (!unlocked || !actx) return; // pending — starts on unlock
      if (inst) { fadeOutTrack(inst); inst = null; }
      inst = startTrack(id);
    },

    stopMusic: function () {
      currentId = null;
      if (inst) { fadeOutTrack(inst); inst = null; }
    },

    sfx: function (id) {
      if (!unlocked || !actx || G.Audio.muted) return;
      if (actx.state !== 'running') return;
      var fn = SFX[id];
      if (!fn) {
        console.warn('G.Audio: unknown sfx id "' + id + '"');
        return;
      }
      if (id !== 'step') duckMusic(); // see deviation note at top of file
      fn(actx.currentTime + 0.001);
    },

    toggleMute: function () {
      G.Audio.muted = !G.Audio.muted;
      if (actx && masterGain) {
        masterGain.gain.setTargetAtTime(G.Audio.muted ? 0 : 1, actx.currentTime, 0.02);
      }
      return G.Audio.muted;
    },
  };

})();
