'use strict';
// The Gilded Needle — scenes.js
// Registers: title, intro (train cinematic), world (all maps), ending
// (coronation). The cozy magic — parallax, particles, tint, glows — lives here.

window.G = window.G || {};

(function () {

  function P() { return G.Palette; }

  // =====================================================================
  // Shared: fade + particles
  // =====================================================================

  var fade = { a: 0, dir: 0, cb: null }; // dir 1 = to black, -1 = from black

  function startFade(cb) {
    fade.dir = 1;
    fade.cb = cb;
  }

  function updateFade(dt) {
    if (fade.dir === 1) {
      fade.a += dt / 0.3;
      if (fade.a >= 1) {
        fade.a = 1;
        fade.dir = -1;
        if (fade.cb) { var cb = fade.cb; fade.cb = null; cb(); }
      }
    } else if (fade.dir === -1) {
      fade.a -= dt / 0.3;
      if (fade.a <= 0) { fade.a = 0; fade.dir = 0; }
    }
  }

  function drawFade(ctx) {
    if (fade.a > 0.01) {
      ctx.globalAlpha = Math.min(1, fade.a);
      ctx.fillStyle = P().outline;
      ctx.fillRect(0, 0, G.W, G.H);
      ctx.globalAlpha = 1;
    }
  }

  function Particles(max) {
    this.list = [];
    this.max = max;
  }
  Particles.prototype.spawn = function (p) { if (this.list.length < this.max) this.list.push(p); };
  Particles.prototype.update = function (dt) {
    for (var i = this.list.length - 1; i >= 0; i--) {
      var p = this.list[i];
      p.life -= dt;
      p.t = (p.t || 0) + dt;
      p.x += (p.vx || 0) * dt + (p.sway ? Math.sin(p.t * 2 + (p.ph || 0)) * p.sway * dt : 0);
      p.y += (p.vy || 0) * dt;
      if (p.grow) p.size += p.grow * dt;
      if (p.life <= 0) this.list.splice(i, 1);
    }
  };
  Particles.prototype.draw = function (ctx) {
    for (var i = 0; i < this.list.length; i++) {
      var p = this.list[i];
      ctx.globalAlpha = p.fade ? Math.max(0, Math.min(1, p.life / p.fade)) : 1;
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  };

  // =====================================================================
  // TITLE
  // =====================================================================

  var title = {
    sel: 0, slotSel: 0, mode: 'main', parts: null, t: 0,

    enter: function () {
      this.parts = new Particles(14);
      this.t = 0;
      this.sel = 0;
      this.slotSel = 0;
      this.mode = 'main';
      G.Audio.playMusic('title');
    },

    update: function (dt) {
      this.t += dt;
      if (this.mode === 'main') {
        var items = this.items();
        if (G.Input.pressed('ArrowDown') || G.Input.pressed('KeyS')) { this.sel = (this.sel + 1) % items.length; G.Audio.sfx('ui'); }
        if (G.Input.pressed('ArrowUp') || G.Input.pressed('KeyW')) { this.sel = (this.sel + items.length - 1) % items.length; G.Audio.sfx('ui'); }
      } else {
        if (G.Input.pressed('ArrowDown') || G.Input.pressed('KeyS')) { this.slotSel = (this.slotSel + 1) % 3; G.Audio.sfx('ui'); }
        if (G.Input.pressed('ArrowUp') || G.Input.pressed('KeyW')) { this.slotSel = (this.slotSel + 2) % 3; G.Audio.sfx('ui'); }
        if (G.Input.pressed('Escape')) { this.mode = 'main'; G.Audio.sfx('ui'); }
        if (G.Input.pressed('Enter') || G.Input.pressed('KeyE')) this.pickSlot(this.slotSel + 1);
      }
      // drifting leaves
      if (Math.random() < dt * 3) {
        this.parts.spawn({
          x: Math.random() * G.W, y: -4, vy: G.Utils.rand(8, 14), sway: 8, ph: Math.random() * 6,
          c: Math.random() < 0.5 ? P().meadow3 : P().terracotta,
          size: G.Utils.rand(1, 3), life: 30, t: 0,
        });
      }
      this.parts.update(dt);
      updateFade(dt);
    },

    items: function () {
      var out = [{ label: G.Data.strings.misc.newGame, act: 'new' }];
      if (G.Save.has()) out.splice(0, 0, { label: G.Data.strings.misc.continueGame, act: 'continue' });
      out.push({ label: G.Audio.muted ? 'Unmute' : 'Mute', act: 'mute' });
      return out;
    },

    draw: function (ctx) {
      // dusk sky + drifting skyline
      ctx.drawImage(G.Tiles.strip('sky_dusk'), 0, 0);
      var sky = G.Tiles.strip('city_skyline');
      var off = Math.floor(this.t * 5) % 960;
      ctx.drawImage(sky, -off, G.H - 140);
      ctx.drawImage(sky, 960 - off, G.H - 140);
      this.parts.draw(ctx);

      // logo
      var ly = 62;
      G.Utils.text(ctx, G.Data.strings.misc.title, G.W / 2, ly, { size: 16, font: 'head', align: 'center', color: P().gold });
      // running-stitch underline drawing itself
      ctx.save();
      ctx.strokeStyle = P().gold;
      ctx.setLineDash([4, 3]);
      ctx.lineDashOffset = -Math.floor(G.Engine.time * 14);
      var uw = Math.min(220, this.t * 160);
      ctx.beginPath();
      ctx.moveTo(G.W / 2 - uw / 2, ly + 22.5);
      ctx.lineTo(G.W / 2 + uw / 2, ly + 22.5);
      ctx.stroke();
      ctx.restore();
      // needle at thread head
      if (uw < 220) G.UI.drawIcon(ctx, 'needle', G.W / 2 + uw / 2, ly + 17);
      G.Utils.text(ctx, G.Data.strings.misc.subtitle, G.W / 2, ly + 30, { size: 14, align: 'center', color: P().linen });

      // menu
      if (this.mode === 'main') {
        var items = this.items();
        for (var i = 0; i < items.length; i++) {
          if (G.UI.button(ctx, {
            x: G.W / 2 - 62, y: 148 + i * 27, w: 124, h: 21,
            label: items[i].label, selected: i === this.sel,
          })) this.pick(items[i].act);
        }
      } else {
        this.drawSlots(ctx);
      }
      G.Utils.text(ctx, 'a cozy tailor RPG · made with Thread Gold', G.W / 2, G.H - 16,
        { size: 10, align: 'center', color: P().poorFade });
      drawFade(ctx);
    },

    pick: function (act) {
      G.Audio.sfx('ui');
      if (act === 'new') {
        this.mode = 'new';
        this.slotSel = 0;
      } else if (act === 'continue') {
        this.mode = 'continue';
        this.slotSel = firstFilledSlot() - 1;
      } else if (act === 'mute') {
        G.Audio.toggleMute();
      }
    },

    drawSlots: function (ctx) {
      var x = G.W / 2 - 122, y = 134, w = 244, h = 92;
      G.UI.panel(ctx, x, y, w, h, { title: this.mode === 'new' ? 'Choose a slot' : 'Continue', animStitch: true });
      for (var i = 0; i < 3; i++) {
        var slot = i + 1;
        var s = G.Save.summary(slot);
        var label = 'Slot ' + slot + '  ';
        if (s) {
          var tier = G.Data.tiers[s.tier] ? G.Data.tiers[s.tier].name : 'Poor';
          label += 'Day ' + s.day + ' · ' + s.gold + 'g · ' + tier;
        } else {
          label += 'Empty';
        }
        if (this.mode === 'new' && s) label += '  overwrite';
        if (G.UI.button(ctx, {
          x: x + 12, y: y + 16 + i * 22, w: w - 24, h: 18,
          label: label, selected: i === this.slotSel,
          disabled: this.mode === 'continue' && !s, size: 10,
        })) this.pickSlot(slot);
      }
      G.Utils.text(ctx, 'Esc — back', x + 14, y + h - 14, { size: 10, color: P().taupe, shadow: false });
    },

    pickSlot: function (slot) {
      if (this.mode === 'continue') {
        if (G.Save.load(slot)) {
          G.Audio.sfx('ui');
          startFade(function () { G.setScene('world', { map: G.state.player.map }); });
        }
      } else if (this.mode === 'new') {
        G.Audio.sfx('ui');
        G.Save.activeSlot = slot;
        G.newGameState();
        G.Save.save(slot);
        startFade(function () { G.setScene('intro'); });
      }
    },
  };

  function firstFilledSlot() {
    for (var i = 1; i <= 3; i++) if (G.Save.has(i)) return i;
    return 1;
  }

  // =====================================================================
  // INTRO — nine beats to Auberlin
  // =====================================================================

  var intro = {
    beat: 0, beatT: 0, chars: 0, parts: null, whistled: false,

    enter: function () {
      this.beat = 0; this.beatT = 0; this.chars = 0;
      this.parts = new Particles(30);
      this.whistled = false;
      G.Audio.playMusic('train');
    },

    update: function (dt) {
      this.beatT += dt;
      this.chars += dt * 40;
      var beats = G.Data.strings.intro;
      var b = beats[this.beat];

      if (G.Input.pressed('Escape')) { this.finish(); return; }
      var adv = this.beatT > 0.4 && (G.Input.pressed('KeyE') || G.Input.pressed('Space') ||
                G.Input.pressed('Enter') || G.Input.mouse.clicked);
      if (adv) {
        if (this.chars < b.text.length) {
          this.chars = b.text.length;
        } else {
          this.beat++;
          this.beatT = 0; this.chars = 0;
          G.Audio.sfx('ui');
          if (this.beat >= beats.length) { this.finish(); return; }
        }
      }

      // steam for train beats
      var vis = beats[Math.min(this.beat, beats.length - 1)].visual;
      if ((vis === 'train_ride' || vis === 'station_flag' || vis === 'station_city') && Math.random() < dt * 8) {
        var sx = vis === 'train_ride' ? 150 : 250;
        this.parts.spawn({
          x: sx + Math.random() * 8, y: 120, vx: -18, vy: -22,
          c: P().linen, size: 4, grow: 6, life: 1.4, fade: 1.4,
        });
      }
      if (vis === 'station_flag' && !this.whistled) { this.whistled = true; G.Audio.sfx('whistle'); }
      if (vis === 'village' && Math.random() < dt * 6) {
        this.parts.spawn({ x: Math.random() * G.W, y: -3, vy: 14, sway: 5, c: '#ffffff', size: 1, life: 20, t: 0 });
      }
      this.parts.update(dt);
      updateFade(dt);
    },

    finish: function () {
      var self = this;
      startFade(function () {
        G.setScene('world', { map: 'shop' });
        // Odile's welcome starts quest 1
        var od = G.Data.npcs.odile_marchand;
        G.UI.dialogue.open(od.name, od.lines.greet.concat([
          'The old sewing table still sings. The Weftworks past Cinder Row will have cloth for it.',
        ]), { portrait: 'npc_odile_marchand' });
      });
    },

    draw: function (ctx) {
      ctx.fillStyle = P().outline;
      ctx.fillRect(0, 0, G.W, G.H);
      var beats = G.Data.strings.intro;
      var b = beats[Math.min(this.beat, beats.length - 1)];
      var t = this.beatT;

      switch (b.visual) {
        case 'stitch': {
          var len = Math.min(G.W - 80, t * 220);
          ctx.strokeStyle = P().gold;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(40, 120.5);
          ctx.lineTo(40 + len, 120.5);
          ctx.stroke();
          ctx.setLineDash([]);
          G.UI.drawIcon(ctx, 'needle', 40 + len, 112);
          break;
        }
        case 'village': {
          ctx.drawImage(G.Tiles.strip('sky_day'), 0, 0);
          ctx.drawImage(G.Tiles.strip('mountains'), 0, 40);
          ctx.drawImage(G.Tiles.strip('hills'), 0, 110);
          ctx.drawImage(G.Tiles.strip('fields'), 0, 165);
          // snowy hamlet
          for (var hx = 0; hx < 5; hx++) {
            var vx = 120 + hx * 52, vy = 150;
            ctx.drawImage(G.Tiles.get('B', 'village'), vx, vy);
            ctx.fillStyle = P().linen;
            ctx.fillRect(vx, vy - 2, 16, 3);
          }
          break;
        }
        case 'tin': {
          G.UI.panel(ctx, 150, 78, 180, 100, { animStitch: true });
          ctx.fillStyle = P().poorIndigo;                 // faded blue felt
          ctx.fillRect(162, 92, 156, 72);
          var ni = G.Sprites.get('needle');
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(ni, 0, 0, 8, 8, 200, 108, 32, 32); // the gilded needle, large
          ctx.restore();
          ctx.fillStyle = P().parchment;                  // the ticket
          ctx.fillRect(252, 112, 46, 26);
          ctx.fillStyle = P().outline;
          G.Utils.text(ctx, 'AUBERLIN', 255, 118, { size: 10, color: P().outline, shadow: false });
          G.Utils.text(ctx, '7:12', 255, 128, { size: 10, color: P().crimson, shadow: false });
          break;
        }
        case 'station_flag':
        case 'train_ride': {
          var scroll = b.visual === 'train_ride';
          var off = scroll ? this.beatT * 90 : 0;
          ctx.drawImage(G.Tiles.strip('sky_day'), 0, 0);
          drawLooped(ctx, G.Tiles.strip('mountains'), off * 0.05, 36);
          drawLooped(ctx, G.Tiles.strip('hills'), off * 0.15, 100);
          drawLooped(ctx, G.Tiles.strip('fields'), off * 0.35, 150);
          drawLooped(ctx, G.Tiles.strip('poles'), off * 0.7, 88);
          drawLooped(ctx, G.Tiles.strip('rails'), off * 1.0, 196);
          var trainX = scroll ? 60 : Math.min(160, -200 + t * 180);
          ctx.drawImage(G.Sprites.get('train_side'), trainX, 152);
          break;
        }
        case 'train_interior': {
          ctx.fillStyle = P().crimsonDeep;
          ctx.fillRect(0, 60, G.W, 150);
          ctx.fillStyle = P().goldRegal;
          ctx.fillRect(0, 60, G.W, 3);
          ctx.fillRect(0, 207, G.W, 3);
          // window with night rolling by
          ctx.fillStyle = P().outline;
          ctx.fillRect(90, 80, 120, 70);
          ctx.fillStyle = '#141020';
          ctx.fillRect(94, 84, 112, 62);
          ctx.fillStyle = P().gold;
          for (var w = 0; w < 8; w++) {
            var lx = 94 + ((w * 47 + Math.floor(t * 40)) % 112);
            ctx.fillRect(lx, 100 + (w % 3) * 14, 1, 1);
          }
          // sketchbook
          ctx.fillStyle = P().parchment;
          ctx.fillRect(250, 110, 90, 60);
          ctx.strokeStyle = P().outline;
          ctx.strokeRect(250.5, 110.5, 89, 59);
          G.UI.drawIcon(ctx, 'garment_simple_dress', 262, 122);
          G.UI.drawIcon(ctx, 'garment_calico_day_dress', 285, 122);
          G.UI.drawIcon(ctx, 'garment_satin_evening_gown', 308, 122);
          G.UI.drawIcon(ctx, 'garment_coronation_gown', 285, 145);
          break;
        }
        case 'night_lights': {
          var n = Math.min(160, t * 90);
          for (var i = 0; i < n; i++) {
            var seed = i * 127.1;
            var px = ((Math.sin(seed) * 43758.5453) % 1 + 1) % 1 * G.W;
            var py = 110 + ((Math.sin(seed * 1.7) * 24634.63) % 1 + 1) % 1 * 120;
            ctx.fillStyle = i % 7 === 0 ? P().linen : P().gold;
            ctx.fillRect(px, py, 1, 1);
          }
          break;
        }
        case 'station_city': {
          ctx.drawImage(G.Tiles.strip('sky_dusk'), 0, 0);
          ctx.drawImage(G.Tiles.strip('city_skyline'), 0, 40);
          // platform
          for (var px2 = 0; px2 < G.W; px2 += 16) {
            ctx.drawImage(G.Tiles.get('=', 'station'), px2, 208);
            ctx.drawImage(G.Tiles.get('=', 'station'), px2, 224);
            ctx.drawImage(G.Tiles.get(',', 'station'), px2, 240);
            ctx.drawImage(G.Tiles.get(',', 'station'), px2, 256);
          }
          ctx.drawImage(G.Sprites.get('train_side'), 250, 168);
          ctx.drawImage(G.Sprites.anim('player', 'right', 0), 120, 196);
          break;
        }
        case 'shopfront': {
          ctx.drawImage(G.Tiles.strip('sky_dusk'), 0, 0);
          // the dusty little shop
          for (var sx2 = 0; sx2 < G.W; sx2 += 16) ctx.drawImage(G.Tiles.get('=', 'city'), sx2, 224);
          for (var sy2 = 0; sy2 < 2; sy2++)
            for (var bx2 = 0; bx2 < 7; bx2++)
              ctx.drawImage(G.Tiles.get(bx2 === 3 && sy2 === 1 ? 'D' : 'B', 'city'), 184 + bx2 * 16, 176 + sy2 * 16 + 16);
          G.Utils.text(ctx, 'THE GILDED NEEDLE', G.W / 2, 160, { size: 8, font: 'head', align: 'center', color: P().gold });
          ctx.drawImage(G.Sprites.anim('player', 'up', 0), 232, 216);
          break;
        }
      }

      this.parts.draw(ctx);

      // letterbox + narration
      ctx.fillStyle = 'rgba(42,31,43,0.92)';
      ctx.fillRect(0, 0, G.W, 26);
      ctx.fillRect(0, G.H - 52, G.W, 52);
      var shown = b.text.substr(0, Math.floor(this.chars));
      var lines = G.Utils.wrapText(ctx, shown, G.W - 80, 12);
      for (var L = 0; L < lines.length && L < 3; L++) {
        G.Utils.text(ctx, lines[L], G.W / 2, G.H - 44 + L * 13, { size: 12, align: 'center', color: P().linen, shadow: false });
      }
      G.Utils.text(ctx, (this.beat + 1) + ' / ' + beats.length + '   ·   Esc — ' + G.Data.strings.misc.skip,
        G.W - 12, 8, { size: 10, align: 'right', color: P().taupe, shadow: false });
      drawFade(ctx);
    },
  };

  function drawLooped(ctx, strip, off, y) {
    var o = Math.floor(off) % 960;
    if (o < 0) o += 960;
    ctx.drawImage(strip, -o, y);
    ctx.drawImage(strip, 960 - o, y);
  }

  // =====================================================================
  // WORLD — the game
  // =====================================================================

  var world = {
    map: null, tileCache: null, npcs: [], banner: 0, parts: null, t: 0,

    enter: function (params) {
      params = params || {};
      var id = params.map || (G.state ? G.state.player.map : 'shop');
      this.map = G.Maps.get(id);
      this.tileCache = renderTileCache(this.map);
      this.t = 0;
      G.state.player.map = id;
      if (params.spawn) {
        G.state.player.x = params.spawn.tx * 16 + 8;
        G.state.player.y = params.spawn.ty * 16 + 8;
      }
      if (params.dir) G.state.player.dir = params.dir;
      G.Player.harvesting = null;

      // hazards & customers
      if (this.map.zone) G.Hazards.load(this.map.zone);
      else G.Hazards.clear();
      if (id === 'shop') G.Economy.resetCustomers();

      // resident NPCs
      this.npcs = [];
      for (var nid in G.Data.npcs) {
        var n = G.Data.npcs[nid];
        if (n.map !== id || n.cinematicOnly) continue;
        if (nid === 'mrs_tansy' && G.state.quests.step > 2) continue; // her coat is mended; she's home bragging
        var pos = (this.map.hints && this.map.hints[nid]) || { tx: n.tx, ty: n.ty };
        this.npcs.push({ id: nid, def: n, x: pos.tx * 16 + 8, y: pos.ty * 16 + 8, dir: n.dir || 'down' });
      }

      this.banner = 2.2;
      this.parts = new Particles(26);
      G.Audio.playMusic(this.map.music);
      if (fade.dir === 0) { fade.a = 1; fade.dir = -1; } // fade in on entry
    },

    exit: function () {
      G.Hazards.clear();
    },

    update: function (dt) {
      updateFade(dt);
      if (this.banner > 0) this.banner -= dt;
      this.t += dt;
      var modal = G.UI.modal() || fade.dir === 1;

      if (!modal) {
        G.Player.update(dt, this.map);
        if (this.map.zone) G.Hazards.update(dt, this.map);
        if (this.map.id === 'shop') G.Economy.customerTick(dt);
        G.Time.advance(dt);
        this.interact();
      } else {
        G.UI.prompt = null;
      }

      // NPCs face the player when near
      for (var i = 0; i < this.npcs.length; i++) {
        var n = this.npcs[i];
        var d = G.Utils.dist(n.x, n.y, G.state.player.x, G.state.player.y);
        if (d < 40) {
          var dx = G.state.player.x - n.x, dy = G.state.player.y - n.y;
          n.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
        }
      }

      this.updateParticles(dt);
    },

    updateParticles: function (dt) {
      var th = this.map.theme;
      if ((th === 'city' || th === 'grove' || th === 'village') && Math.random() < dt * 2.5) {
        this.parts.spawn({
          x: Math.random() * G.W, y: -4, vy: G.Utils.rand(8, 14), sway: 6, ph: Math.random() * 6,
          c: Math.random() < 0.5 ? P().meadow3 : P().terracotta, size: G.Utils.rand(1, 3), life: 25, t: 0,
        });
      }
      if ((th === 'mill' || th === 'warehouse') && Math.random() < dt * 5) {
        this.parts.spawn({
          x: Math.random() * G.W, y: Math.random() * G.H, vx: 3, vy: -3,
          c: P().parchment, size: 1, life: 3, fade: 3, t: 0,
        });
      }
      if (th === 'vault' && Math.random() < dt * 1.5) {
        this.parts.spawn({
          x: Math.random() * G.W, y: Math.random() * G.H, vy: -2,
          c: P().gold, size: 1, life: 2, fade: 2, t: 0,
        });
      }
      this.parts.update(dt);
    },

    // ----- interaction scan (priority per SPEC) -----
    interact: function () {
      var p = G.state.player;
      var map = this.map;
      G.UI.prompt = null;
      if (G.Player.harvesting) { G.UI.prompt = 'Gathering...'; return; }

      var f = G.Player.facingTile();
      var pressE = G.Input.pressed('KeyE');

      // 1. customer at counter
      if (map.id === 'shop') {
        var cust = G.Economy.customerAtCounter();
        if (cust && map.counter &&
            G.Utils.dist(p.x, p.y, map.counter.tx * 16 + 8, (map.counter.ty + 1) * 16 + 8) < 30) {
          G.UI.prompt = 'E — Serve the customer';
          if (pressE) G.UI.shopSell.open(cust);
          return;
        }
      }

      // 2. NPC — must be near AND roughly in the direction the player faces
      for (var i = 0; i < this.npcs.length; i++) {
        var n = this.npcs[i];
        var dxn = n.x - p.x, dyn = n.y - p.y;
        var inFacing =
          (p.dir === 'up' && dyn < 6) || (p.dir === 'down' && dyn > -6) ||
          (p.dir === 'left' && dxn < 6) || (p.dir === 'right' && dxn > -6);
        if (inFacing && G.Utils.dist(n.x, n.y, p.x, p.y) < 26) {
          G.UI.prompt = 'E — Talk to ' + n.def.name.split(' ')[0];
          if (pressE) this.talkTo(n);
          return;
        }
      }

      // 3. fabric node (facing or standing tile)
      if (map.zone) {
        var node = G.Hazards.nodeAt(f.tx, f.ty) ||
                   G.Hazards.nodeAt(Math.floor(p.x / 16), Math.floor(p.y / 16));
        if (node) {
          G.UI.prompt = 'Hold E — Gather';
          if (pressE) {
            if (p.sta <= 0) G.UI.notify(G.Data.strings.misc.staminaOut);
            else G.Player.harvesting = {
              node: node, t: 0,
              need: G.state.upgrades.steel_shears ? G.Data.balance.harvest.holdTimeShears : G.Data.balance.harvest.holdTime,
            };
          }
          return;
        }
      }

      // 3.5 mannequins & the coffee station
      var fch = map.charAt(f.tx, f.ty);
      if (fch === 'M') {
        G.UI.prompt = 'E — Dress the mannequin';
        if (pressE) G.UI.wardrobe.open(map.id + '_' + f.tx + '_' + f.ty);
        return;
      }
      if (fch === 'C') {
        G.UI.prompt = 'E — A cup of coffee';
        if (pressE) {
          if (!G.state.flags.coffeeToday) {
            G.state.flags.coffeeToday = true;
            p.sta = Math.min(p.maxSta, p.sta + 20);
            G.Audio.sfx('pickup');
            G.UI.notify('A proper cup. (+20 stamina)', { icon: 'bolt' });
          } else {
            G.UI.notify('The pot is empty until tomorrow.');
          }
        }
        return;
      }

      // 4. sewing table / 5. counter / 6. bed (shop only)
      if (map.id === 'shop') {
        if (map.catalogTable && (nearCluster(f, map.catalogTable, 1) || fch === 'a' || fch === 'd' || fch === 'A')) {
          G.UI.prompt = 'E — Browse catalog';
          if (pressE) G.UI.catalog.open();
          return;
        }
        if (map.sewingTable && (matches(f, map.sewingTable) || map.charAt(f.tx, f.ty) === 'm' || map.charAt(f.tx, f.ty) === 's')) {
          G.UI.prompt = 'E — Sew';
          if (pressE) G.UI.crafting.open();
          return;
        }
        if (map.counter && nearCluster(f, map.counter, 1)) {
          G.UI.prompt = 'E — Counter';
          if (pressE) G.UI.upgrades.open();
          return;
        }
        if (map.charAt(f.tx, f.ty) === 'e') {
          G.UI.prompt = 'E — Sleep';
          if (pressE) G.UI.sleepPrompt();
          return;
        }
      }

      // 7. portals
      var ptx = Math.floor(p.x / 16), pty = Math.floor(p.y / 16);
      for (var k = 0; k < map.portals.length; k++) {
        var por = map.portals[k];
        if ((por.tx === ptx && por.ty === pty) || (por.tx === f.tx && por.ty === f.ty) ||
            (Math.abs(por.tx - ptx) + Math.abs(por.ty - pty) === 1)) {
          var dest = G.Maps.get(por.to);
          // gates
          if (dest && dest.zone && !G.Systems.zoneUnlocked(dest.zone)) {
            G.UI.prompt = por.label + ' — locked';
            if (pressE) {
              var z = G.Data.zones[dest.zone];
              G.UI.notify(G.Data.strings.zoneLocked[z.tier - 1], { long: true });
              G.Audio.sfx('doorbell');
            }
            return;
          }
          if (por.to === 'palace_hall' && !G.state.flags.readyForEnding && !G.state.flags.endingSeen) {
            G.UI.prompt = 'The Palace — closed';
            if (pressE) {
              G.UI.notify('The palace doors open only for the coronation.', { long: true });
              G.Audio.sfx('doorbell');
            }
            return;
          }
          G.UI.prompt = 'E — ' + por.label;
          if (pressE) {
            G.Audio.sfx('doorbell');
            var target = por;
            if (por.to === 'palace_hall' && G.state.flags.readyForEnding && !G.state.flags.endingSeen) {
              startFade(function () { G.setScene('ending'); });
            } else {
              startFade(function () {
                G.setScene('world', { map: target.to, spawn: { tx: target.ttx, ty: target.tty }, dir: target.dir });
              });
            }
          }
          return;
        }
      }
    },

    talkTo: function (n) {
      var q = G.Quests.current();
      var lines, warm = G.state.tier + 1 > n.def.tier;
      if (q && q.goal.type === 'talk' && q.goal.target === n.id) lines = n.def.lines.greet;
      else if (warm) lines = n.def.lines.warm;
      else lines = (G.state.day % 2 === 0) ? n.def.lines.hint : n.def.lines.greet;
      var id = n.id;
      G.UI.dialogue.open(n.def.name, lines, {
        portrait: 'npc_' + id,
        onDone: function () { G.Quests.trigger('talk', { npc: id }); },
      });
    },

    // ----- draw -----
    draw: function (ctx) {
      var map = this.map;
      var p = G.state.player;
      G.Camera.follow(p.x, p.y, map.w * 16, map.h * 16);

      ctx.fillStyle = P().outline;
      ctx.fillRect(0, 0, G.W, G.H);

      G.Camera.begin(ctx);

      // tile layer: prerendered once on map entry, then blitted as a single canvas
      var x0 = Math.max(0, Math.floor(G.Camera.x / 16));
      var y0 = Math.max(0, Math.floor(G.Camera.y / 16));
      var x1 = Math.min(map.w - 1, Math.ceil((G.Camera.x + G.W) / 16));
      var y1 = Math.min(map.h - 1, Math.ceil((G.Camera.y + G.H) / 16));
      if (this.tileCache) ctx.drawImage(this.tileCache, 0, 0);

      // dressed mannequins wear their garments
      if (G.state.mannequins) {
        for (ty = y0; ty <= y1; ty++) {
          for (tx = x0; tx <= x1; tx++) {
            if (map.charAt(tx, ty) === 'M') {
              var worn = G.state.mannequins[map.id + '_' + tx + '_' + ty];
              if (worn) ctx.drawImage(G.Sprites.get('garment_' + worn), tx * 16 + 2, ty * 16 + 1);
            }
          }
        }
      }

      // nodes
      G.Hazards.draw(ctx);

      // y-sorted entities
      var ents = [];
      ents.push({ y: p.y, draw: function (c2) { G.Player.draw(c2); } });
      for (var i = 0; i < this.npcs.length; i++) {
        (function (n) {
          ents.push({ y: n.y, draw: function (c2) { drawNPC(c2, n); } });
        })(this.npcs[i]);
      }
      for (i = 0; i < G.Hazards.enemies.length; i++) {
        (function (e) {
          ents.push({ y: e.y, draw: function (c2) { G.Hazards.drawEnemy(c2, e); } });
        })(G.Hazards.enemies[i]);
      }
      for (i = 0; i < G.Economy.customers.length; i++) {
        (function (c) {
          ents.push({ y: c.y, draw: function (c2) { drawCustomer(c2, c); } });
        })(G.Economy.customers[i]);
      }
      ents.sort(function (a, b) { return a.y - b.y; });
      for (i = 0; i < ents.length; i++) ents[i].draw(ctx);

      // the hearth glows, always — warm flicker on the lounge
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (ty = y0; ty <= y1; ty++) {
        for (tx = x0; tx <= x1; tx++) {
          var hch = map.charAt(tx, ty);
          if (hch === 'k' || hch === 'K') {
            var hx = tx * 16 + (hch === 'k' ? 14 : 2), hy = ty * 16 + 9;
            var hr = 17 + Math.sin(G.Engine.time * 7 + tx) * 2;
            var hg = ctx.createRadialGradient(hx, hy, 2, hx, hy, hr);
            hg.addColorStop(0, 'rgba(242,193,78,0.20)');
            hg.addColorStop(1, 'rgba(242,193,78,0)');
            ctx.fillStyle = hg;
            ctx.fillRect(hx - hr, hy - hr, hr * 2, hr * 2);
          }
        }
      }
      ctx.restore();

      // night glows on lamps & windows
      if (G.state.time >= 1140 && map.id !== 'shop') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (ty = y0; ty <= y1; ty++) {
          for (tx = x0; tx <= x1; tx++) {
            var ch = map.charAt(tx, ty);
            if (ch === 'l' || ch === 'B') {
              var gx = tx * 16 + 8, gy = ty * 16 + (ch === 'l' ? 4 : 8);
              var gr = ctx.createRadialGradient(gx, gy, 1, gx, gy, 13);
              gr.addColorStop(0, 'rgba(242,193,78,0.32)');
              gr.addColorStop(1, 'rgba(242,193,78,0)');
              ctx.fillStyle = gr;
              ctx.fillRect(gx - 13, gy - 13, 26, 26);
            }
          }
        }
        ctx.restore();
      }

      G.Camera.end(ctx);

      // day tint (interiors at half strength)
      G.Time.tint(ctx, map.id !== 'city');

      // ambient particles
      this.parts.draw(ctx);

      // map-name banner
      if (this.banner > 0) {
        var a = Math.min(1, this.banner);
        ctx.globalAlpha = a;
        var bw = map.name.length * 7 + 26;
        ctx.fillStyle = P().parchment;
        ctx.fillRect((G.W - bw) / 2, 30, bw, 17);
        ctx.fillStyle = P().outline;
        ctx.strokeStyle = P().outline;
        ctx.strokeRect((G.W - bw) / 2 + 0.5, 30.5, bw - 1, 16);
        ctx.fillStyle = P().gold;
        ctx.fillRect((G.W - bw) / 2 + 3, 38, 3, 1);
        ctx.fillRect((G.W + bw) / 2 - 6, 38, 3, 1);
        G.Utils.text(ctx, map.name, G.W / 2, 33, { size: 12, align: 'center', color: P().outline, shadow: false });
        ctx.globalAlpha = 1;
      }

      drawFade(ctx);
    },
  };

  function matches(f, spot) { return f.tx === spot.tx && f.ty === spot.ty; }
  function nearCluster(f, spot, r) {
    return Math.abs(f.tx - spot.tx) <= r && Math.abs(f.ty - spot.ty) <= r;
  }

  function renderTileCache(map) {
    var c = document.createElement('canvas');
    c.width = map.w * 16;
    c.height = map.h * 16;
    var x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    for (var ty = 0; ty < map.h; ty++) {
      for (var tx = 0; tx < map.w; tx++) {
        x.drawImage(G.Tiles.get(map.charAt(tx, ty), map.theme), tx * 16, ty * 16);
      }
    }
    return c;
  }

  function drawNPC(ctx, n) {
    var spr = G.Sprites.anim('npc_' + n.id, n.dir, Math.floor(G.Engine.time * 1.6 + n.x));
    ctx.fillStyle = 'rgba(42,31,43,0.3)';
    ctx.fillRect(n.x - 5, n.y + 1, 10, 3);
    ctx.drawImage(spr, Math.round(n.x - 8), Math.round(n.y - spr.height + 4));
  }

  function drawCustomer(ctx, c) {
    var sitting = c.state === 'seated';
    var moving = c.state !== 'waiting' && !sitting;
    var spr = G.Sprites.anim(c.sprite, c.dir, moving ? Math.floor(c.animT / 0.2) : 0);
    ctx.fillStyle = 'rgba(42,31,43,0.3)';
    ctx.fillRect(c.x - 5, c.y + 1, 10, 3);
    if (sitting) {
      var visibleH = spr.height - 7;
      ctx.drawImage(spr, 0, 0, spr.width, visibleH,
        Math.round(c.x - 8), Math.round(c.y - spr.height + 8), spr.width, visibleH);
    } else {
      ctx.drawImage(spr, Math.round(c.x - 8), Math.round(c.y - spr.height + 4));
    }
    if (c.state === 'waiting') {
      // request bubble
      var t = Math.floor(G.Engine.time * 2) % 2;
      ctx.fillStyle = P().linen;
      ctx.fillRect(c.x - 8, c.y - spr.height - 10 + t, 16, 14);
      ctx.strokeStyle = P().outline;
      ctx.strokeRect(c.x - 7.5, c.y - spr.height - 9.5 + t, 15, 13);
      var icon = c.want.garmentId ? 'garment_' + c.want.garmentId : 'coin';
      ctx.drawImage(G.Sprites.get(icon), c.x - 6, c.y - spr.height - 9 + t);
    }
  }

  // =====================================================================
  // ENDING — the coronation
  // =====================================================================

  var ending = {
    t: 0, line: 0, chars: 0, done: false, parts: null, adelina: null, confettiT: 0,

    enter: function () {
      this.t = 0; this.line = -1; this.chars = 0; this.done = false;
      this.parts = new Particles(90);
      this.adelina = { x: 13 * 16, y: 13 * 16, target: 3.6 * 16 };
      this.confettiT = 0;
      G.state.flags.endingSeen = true;
      G.state.flags.readyForEnding = false;
      G.Inventory.takeGarment('coronation_gown');
      G.Save.save();
      G.Audio.playMusic('royal');
      G.Audio.sfx('fanfare');
      fade.a = 1; fade.dir = -1;
    },

    update: function (dt) {
      updateFade(dt);
      this.t += dt;
      this.chars += dt * 34;

      // Adelina walks the carpet
      if (this.adelina.y > this.adelina.target) {
        this.adelina.y -= dt * 14;
      }

      // narration pacing: a new line every 4s after a 1.5s hold
      var lines = G.Data.strings.ending;
      var target = Math.min(lines.length - 1, Math.floor((this.t - 1.5) / 4));
      if (target > this.line) { this.line = target; this.chars = 0; }
      if (this.line >= lines.length - 1 && this.t > 1.5 + lines.length * 4) this.done = true;
      if ((G.Input.pressed('Space') || G.Input.pressed('KeyE') || G.Input.mouse.clicked) && this.t > 2) {
        if (!this.done && this.line >= lines.length - 1) this.done = true;
        else this.t += 3; // hurry the ceremony along
      }

      // confetti
      this.confettiT -= dt;
      if (this.t > 3 && this.confettiT <= 0) {
        this.confettiT = 0.06;
        var cols = [P().crimson, P().goldRegal, P().linen, P().plum];
        this.parts.spawn({
          x: Math.random() * G.W, y: -4, vy: G.Utils.rand(16, 26), sway: 14, ph: Math.random() * 6,
          c: cols[(Math.random() * 4) | 0], size: 2, life: 14, t: 0,
        });
      }
      this.parts.update(dt);
    },

    draw: function (ctx) {
      var map = G.Maps.get('palace_hall');
      G.Camera.follow(map.w * 8, map.h * 8, map.w * 16, map.h * 16);
      ctx.fillStyle = P().outline;
      ctx.fillRect(0, 0, G.W, G.H);
      G.Camera.begin(ctx);
      for (var ty = 0; ty < map.h; ty++)
        for (var tx = 0; tx < map.w; tx++)
          ctx.drawImage(G.Tiles.get(map.charAt(tx, ty), map.theme), tx * 16, ty * 16);

      // the assembled rows — everyone she dressed
      var cast = [
        ['npc_berta_klee', 8, 8], ['npc_sylvie_marsh', 9, 10], ['npc_countess_elowen', 8, 12],
        ['npc_pim', 17, 8], ['npc_corvin_alba', 17, 12], ['npc_odile_marchand', 16, 10],
        ['npc_iva', 9, 6], ['npc_steward_quill', 16, 6],
      ];
      for (var i = 0; i < cast.length; i++) {
        var spr = G.Sprites.anim(cast[i][0], cast[i][1] < 13 ? 'right' : 'left', Math.floor(G.Engine.time * 2 + i));
        // pim can't stop waving
        var wob = cast[i][0] === 'npc_pim' ? Math.floor(G.Engine.time * 6) % 2 : 0;
        ctx.drawImage(spr, cast[i][1] * 16, cast[i][2] * 16 - spr.height + 12 - wob);
      }
      // Marielle near the dais
      ctx.drawImage(G.Sprites.anim('player', 'up', 0), 11 * 16, 5 * 16 - 12);

      // Queen Adelina in the gown that cannot lie
      var a = this.adelina;
      var aspr = G.Sprites.anim('npc_princess_adelina', 'up', Math.floor(G.Engine.time * 2));
      ctx.drawImage(aspr, a.x, a.y - aspr.height + 12);
      // moonweave glow — steady and bright, the whole way down
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var gr = ctx.createRadialGradient(a.x + 8, a.y - 6, 2, a.x + 8, a.y - 6, 18);
      var pulse = 0.22 + Math.sin(G.Engine.time * 2) * 0.05;
      gr.addColorStop(0, 'rgba(217,232,245,' + pulse.toFixed(2) + ')');
      gr.addColorStop(1, 'rgba(217,232,245,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(a.x - 12, a.y - 26, 40, 44);
      ctx.restore();

      G.Camera.end(ctx);
      this.parts.draw(ctx);

      // narration
      if (this.line >= 0 && !this.done) {
        ctx.fillStyle = 'rgba(42,31,43,0.9)';
        ctx.fillRect(0, G.H - 46, G.W, 46);
        var text = G.Data.strings.ending[this.line];
        var shown = text.substr(0, Math.floor(this.chars));
        var wrapped = G.Utils.wrapText(ctx, shown, G.W - 70, 12);
        for (var L = 0; L < wrapped.length && L < 3; L++) {
          G.Utils.text(ctx, wrapped[L], G.W / 2, G.H - 40 + L * 13, { size: 12, align: 'center', color: P().linen, shadow: false });
        }
      }

      // final stats card
      if (this.done) {
        var st = G.state.stats;
        G.UI.panel(ctx, 110, 42, 260, 172, { title: 'By Royal Appointment', animStitch: true });
        G.Utils.text(ctx, G.Data.strings.byRoyalAppointment, 240, 60, { size: 12, align: 'center', color: P().outline, shadow: false });
        var rows = [
          ['Days in Auberlin', String(G.state.day)],
          ['Gold earned', String(st.earned)],
          ['Garments sewn', String(st.crafted)],
          ['Fabrics gathered', String(st.gathered)],
          ['Garments sold', String(st.sold)],
        ];
        for (var r = 0; r < rows.length; r++) {
          G.Utils.text(ctx, rows[r][0], 130, 82 + r * 15, { size: 12, color: P().soot, shadow: false });
          G.Utils.text(ctx, rows[r][1], 350, 82 + r * 15, { size: 12, align: 'right', color: P().outline, shadow: false });
        }
        var ep = G.Utils.wrapText(ctx, G.Data.strings.epilogue, 230, 10);
        for (r = 0; r < ep.length && r < 3; r++) {
          G.Utils.text(ctx, ep[r], 240, 158 + r * 11, { size: 10, align: 'center', color: P().plum, shadow: false });
        }
        if (G.UI.button(ctx, { x: 190, y: 190, w: 100, h: 18, label: 'Return to Title', selected: true })) {
          startFade(function () { G.setScene('title'); });
        }
      }
      drawFade(ctx);
    },
  };

  // =====================================================================

  G.registerScene('title', title);
  G.registerScene('intro', intro);
  G.registerScene('world', world);
  G.registerScene('ending', ending);

})();
