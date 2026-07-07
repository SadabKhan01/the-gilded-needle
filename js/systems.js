'use strict';
// The Gilded Needle — systems.js
// Owns G.newGameState, G.state, G.Player, G.Inventory, G.Craft, G.Economy,
// G.Time, G.Hazards, G.Quests, G.Systems. All persistent state lives in
// G.state only; nodes/enemies/customers are rebuilt, never saved.

window.G = window.G || {};

(function () {

  var U = null, B = null; // bound at first use: G.Utils, G.Data.balance

  function bal() { return G.Data.balance; }

  // =====================================================================
  // New game state
  // =====================================================================

  function copyObj(o) { return JSON.parse(JSON.stringify(o)); }

  G.newGameState = function () {
    var s = G.Data.start;
    G.state = {
      day: s.day, time: s.time,
      gold: s.gold, rep: s.rep, tier: s.tier,
      inv: { fabrics: copyObj(s.fabrics), garments: copyObj(s.garments) },
      recipes: s.recipes.slice(),
      player: {
        x: 17 * 16 + 8, y: 5 * 16 + 8, map: s.map, dir: 'down',
        hp: s.hp, maxHp: s.maxHp, sta: s.sta, maxSta: s.maxSta,
      },
      quests: { step: 0, count: 0, done: {} },
      upgrades: {},
      mannequins: {},
      flags: {},
      stats: { gathered: 0, crafted: 0, sold: 0, earned: 0, days: 1 },
    };
  };

  // =====================================================================
  // G.Player
  // =====================================================================

  var walkT = 0, walkFrame = 0, moving = false;
  var swipeT = 0, swipeCd = 0;
  var iframes = 0, hazardT = 0;
  var kbx = 0, kby = 0, kbT = 0;
  var stepT = 0;

  function feetRect(px0, py0) {
    return { x: px0 - 4, y: py0 - 3, w: 8, h: 6 };
  }

  function collides(map, px0, py0) {
    var r = feetRect(px0, py0);
    var x0 = Math.floor(r.x / 16), x1 = Math.floor((r.x + r.w - 1) / 16);
    var y0 = Math.floor(r.y / 16), y1 = Math.floor((r.y + r.h - 1) / 16);
    for (var ty = y0; ty <= y1; ty++)
      for (var tx = x0; tx <= x1; tx++)
        if (map.solidAt(tx, ty)) return true;
    return false;
  }

  G.Player = {
    harvesting: null,   // { node, t, need } while holding E on a node
    swipeActive: false,

    speed: function () {
      var sp = 85;
      if (G.state.player.sta <= 0) sp *= 0.5;
      return sp;
    },

    rect: function () {
      var p = G.state.player;
      return feetRect(p.x, p.y);
    },

    bodyRect: function () { // larger box for enemy contact
      var p = G.state.player;
      return { x: p.x - 6, y: p.y - 14, w: 12, h: 17 };
    },

    facingTile: function () {
      var p = G.state.player;
      var dx = 0, dy = 0;
      if (p.dir === 'left') dx = -1;
      else if (p.dir === 'right') dx = 1;
      else if (p.dir === 'up') dy = -1;
      else dy = 1;
      return { tx: Math.floor((p.x + dx * 14) / 16), ty: Math.floor((p.y + dy * 12) / 16) };
    },

    update: function (dt, map) {
      U = G.Utils;
      var p = G.state.player;
      if (iframes > 0) iframes -= dt;
      if (hazardT > 0) hazardT -= dt;
      if (swipeCd > 0) swipeCd -= dt;
      if (swipeT > 0) swipeT -= dt;
      this.swipeActive = swipeT > 0;

      // knockback
      if (kbT > 0) {
        kbT -= dt;
        var nx0 = p.x + kbx * dt, ny0 = p.y + kby * dt;
        if (!collides(map, nx0, p.y)) p.x = nx0;
        if (!collides(map, p.x, ny0)) p.y = ny0;
      }

      // harvesting hold (scenes manage starting/stopping)
      if (this.harvesting) {
        moving = false;
        if (!G.Input.down('KeyE')) { this.harvesting = null; }
        else {
          this.harvesting.t += dt;
          if (this.harvesting.t >= this.harvesting.need) {
            G.Hazards.harvest(this.harvesting.node);
            this.harvesting = null;
          }
        }
        return;
      }

      // movement
      var ax = G.Input.axis();
      moving = (ax.x !== 0 || ax.y !== 0);
      if (moving) {
        if (Math.abs(ax.x) > Math.abs(ax.y)) p.dir = ax.x < 0 ? 'left' : 'right';
        else p.dir = ax.y < 0 ? 'up' : 'down';
        var sp = this.speed();
        var nx = p.x + ax.x * sp * dt;
        var ny = p.y + ax.y * sp * dt;
        if (!collides(map, nx, p.y)) p.x = nx;
        if (!collides(map, p.x, ny)) p.y = ny;
        walkT += dt;
        if (walkT > 0.14) { walkT = 0; walkFrame = (walkFrame + 1) % 4; }
        stepT -= dt;
        if (stepT <= 0) { stepT = 0.32; G.Audio.sfx('step'); }
      } else {
        walkFrame = 0;
      }

      // scissor swipe
      if (G.Input.pressed('Space') && swipeCd <= 0) {
        swipeCd = bal().swipe.cooldown;
        swipeT = 0.18;
        this.spendStamina(bal().staminaCosts.swipe);
        G.Audio.sfx('snip');
        var f = this.facingTile();
        var rectAtk = { x: f.tx * 16 - 4, y: f.ty * 16 - 4, w: 24, h: 24 };
        G.Hazards.hit(rectAtk, bal().swipe.damage);
      }

      // hazard floor tiles
      var ftx = Math.floor(p.x / 16), fty = Math.floor(p.y / 16);
      var ch = map.charAt(ftx, fty);
      if (ch === 'x' && hazardT <= 0) {
        hazardT = 1.0;
        this.damage(bal().hazardTileDamage, p.x + (Math.random() * 20 - 10), p.y + 14);
      }
    },

    draw: function (ctx) {
      var p = G.state.player;
      // soft shadow
      ctx.fillStyle = 'rgba(42,31,43,0.3)';
      ctx.fillRect(p.x - 5, p.y + 1, 10, 3);
      var spr;
      if (this.harvesting) spr = G.Sprites.get('player_action_' + p.dir);
      else spr = G.Sprites.anim('player', p.dir, moving ? walkFrame : 0);
      var flash = iframes > 0 && (Math.floor(iframes * 12) % 2 === 0);
      if (flash) ctx.globalAlpha = 0.45;
      ctx.drawImage(spr, Math.round(p.x - 8), Math.round(p.y - spr.height + 4));
      if (flash) ctx.globalAlpha = 1;
      // swipe fx
      if (this.swipeActive) {
        var f = this.facingTile();
        ctx.drawImage(G.Sprites.get('swipe_' + p.dir), f.tx * 16, f.ty * 16);
      }
      // harvest progress ring
      if (this.harvesting) {
        var t = this.harvesting.t / this.harvesting.need;
        ctx.fillStyle = G.Palette.outline;
        ctx.fillRect(p.x - 9, p.y - 26, 18, 4);
        ctx.fillStyle = G.Palette.gold;
        ctx.fillRect(p.x - 8, p.y - 25, Math.round(16 * t), 2);
      }
    },

    damage: function (n, fx, fy) {
      if (iframes > 0) return;
      var p = G.state.player;
      p.hp -= n;
      iframes = 0.8;
      this.spendStamina(bal().staminaCosts.hitByEnemy);
      var dx = p.x - (fx === undefined ? p.x : fx);
      var dy = p.y - (fy === undefined ? p.y - 1 : fy);
      var d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      kbx = (dx / d) * 130; kby = (dy / d) * 130; kbT = 0.15;
      G.Engine.shake(3, 0.25);
      G.Audio.sfx('hurt');
      if (p.hp <= 0) { p.hp = 0; G.Systems.collapse(); }
    },

    heal: function (n) {
      var p = G.state.player;
      p.hp = Math.min(p.maxHp, p.hp + n);
    },

    spendStamina: function (n) {
      var p = G.state.player;
      p.sta = Math.max(0, p.sta - n);
      return true;
    },
  };

  // =====================================================================
  // G.Inventory
  // =====================================================================

  G.Inventory = {
    addFabric: function (id, n) {
      var f = G.state.inv.fabrics;
      f[id] = (f[id] || 0) + n;
    },
    removeFabric: function (id, n) {
      var f = G.state.inv.fabrics;
      if ((f[id] || 0) < n) return false;
      f[id] -= n;
      if (f[id] <= 0) delete f[id];
      return true;
    },
    fabricCount: function (id) { return G.state.inv.fabrics[id] || 0; },
    fabricTotal: function () {
      var t = 0, f = G.state.inv.fabrics;
      for (var id in f) t += f[id];
      return t;
    },
    addGarment: function (id, quality) {
      var g = G.state.inv.garments;
      if (!g[id]) g[id] = [];
      g[id].push(quality);
      g[id].sort(function (a, b) { return b - a; });
    },
    garmentCount: function (id) {
      var g = G.state.inv.garments[id];
      return g ? g.length : 0;
    },
    takeGarment: function (id) {
      var g = G.state.inv.garments[id];
      if (!g || !g.length) return null;
      var q = g.shift();
      if (!g.length) delete G.state.inv.garments[id];
      return q;
    },
    list: function (kind) {
      var out = [], id;
      if (kind === 'fabrics') {
        for (id in G.state.inv.fabrics) {
          var f = G.Data.fabrics[id];
          out.push({ id: id, qty: G.state.inv.fabrics[id], tier: f ? f.tier : 1 });
        }
      } else {
        for (id in G.state.inv.garments) {
          var g = G.Data.garments[id];
          out.push({ id: id, qualities: G.state.inv.garments[id].slice(), qty: G.state.inv.garments[id].length, tier: g ? g.tier : 1 });
        }
      }
      out.sort(function (a, b) { return a.tier - b.tier || (a.id < b.id ? -1 : 1); });
      return out;
    },
  };

  // =====================================================================
  // G.Craft
  // =====================================================================

  G.Craft = {
    available: function () {
      return G.state.recipes.slice();
    },
    canCraft: function (id) {
      var g = G.Data.garments[id];
      if (!g) return false;
      for (var fid in g.recipe) {
        if (G.Inventory.fabricCount(fid) < g.recipe[fid]) return false;
      }
      return true;
    },
    consume: function (id) {
      var g = G.Data.garments[id];
      for (var fid in g.recipe) G.Inventory.removeFabric(fid, g.recipe[fid]);
    },
    finish: function (id, quality) {
      G.Inventory.addGarment(id, quality);
      G.state.stats.crafted++;
      G.state.flags.firstCraftDone = true;
      G.Player.spendStamina(bal().staminaCosts.craft);
      var g = G.Data.garments[id];
      G.UI.notify('+1 ' + g.name + '  ' + quality + '★', { icon: 'garment_' + id });
      G.Quests.trigger('craft', { id: id });
    },
  };

  // =====================================================================
  // G.Economy (+ walk-in customers)
  // =====================================================================

  var nextCustomerIn = -1; // in-game minutes; -1 = roll on next tick

  G.Economy = {
    customers: [],

    priceFor: function (garmentId, quality, tierIdx) {
      var g = G.Data.garments[garmentId];
      var q = bal().qualityMults[(quality || 1) - 1] || 1;
      var mood = G.Data.customers.moodMults[tierIdx] || 1;
      var up = G.state.upgrades.oak_mannequin ? 1.10 : 1;
      return Math.round(g.price * q * mood * up);
    },

    sell: function (garmentId, quality, customer) {
      var g = G.Data.garments[garmentId];
      var tierIdx = customer ? customer.tier : (g.tier - 1);
      var gold = this.priceFor(garmentId, quality, tierIdx);
      var rep = Math.round(g.tier * bal().repPerSaleBase * (bal().qualityMults[(quality || 1) - 1] || 1));
      G.state.gold += gold;
      G.state.stats.sold++;
      G.state.stats.earned += gold;
      G.Audio.sfx('coin');
      G.UI.notify('+' + gold + 'g', { icon: 'coin' });
      this.addRep(rep);
      G.Quests.trigger('sell', { id: garmentId });
      return { gold: gold, rep: rep };
    },

    addRep: function (n) {
      if (!n) return;
      G.state.rep += n;
      var newTier = G.Data.tierForRep(G.state.rep);
      while (newTier > G.state.tier) {
        G.state.tier++;
        // unlock this tier's recipes (quest garments unlock via quests)
        var glist = G.Data.garmentsByTier(G.state.tier + 1);
        for (var i = 0; i < glist.length; i++) {
          if (!glist[i].quest && G.state.recipes.indexOf(glist[i].id) < 0) {
            G.state.recipes.push(glist[i].id);
          }
        }
        G.Audio.sfx('fanfare');
        G.UI.notify(G.Data.strings.tierUp[G.state.tier], { icon: 'rep', long: true });
      }
      G.Quests.trigger('rep', {});
    },

    buyUpgrade: function (id) {
      var up = G.Data.upgrades[id];
      if (!up || G.state.upgrades[id] || G.state.gold < up.price) return false;
      G.state.gold -= up.price;
      G.state.upgrades[id] = true;
      if (up.effect.maxSta) {
        G.state.player.maxSta = up.effect.maxSta;
        G.state.player.sta = Math.min(G.state.player.sta, up.effect.maxSta);
      }
      G.Audio.sfx('coin');
      G.UI.notify(up.name + '!', { icon: 'coin' });
      return true;
    },

    resetCustomers: function () {
      this.customers.length = 0;
      nextCustomerIn = -1;
    },

    customerTick: function (dt) {
      var t = G.state.time;
      var open = t >= G.Data.customers.openHours[0] && t < G.Data.customers.openHours[1];
      var gameMin = dt / bal().clock.secPerGameMinute;

      // spawn
      if (open) {
        if (nextCustomerIn < 0) {
          var iv = G.Data.customerInterval(G.state.rep, G.state.upgrades.gilded_sign ? 10 : 0);
          nextCustomerIn = G.Utils.rand(iv[0], iv[1]) * 0.4; // first of the day comes sooner
        }
        nextCustomerIn -= gameMin;
        if (nextCustomerIn <= 0 && this.customers.length < 2) {
          this.spawn();
          var iv2 = G.Data.customerInterval(G.state.rep, G.state.upgrades.gilded_sign ? 10 : 0);
          nextCustomerIn = G.Utils.rand(iv2[0], iv2[1]);
        }
      }

      // customer movement / lifecycle
      var map = G.Maps.get('shop');
      var doorX = 11 * 16 + 8, doorY = 12 * 16 + 8;
      var counterX = 10 * 16 + 8, counterY = 9 * 16 + 4;
      for (var i = this.customers.length - 1; i >= 0; i--) {
        var c = this.customers[i];
        c.animT = (c.animT || 0) + dt;
        if (c.state === 'entering') {
          var arrived = moveToward(c, counterX, counterY, 45 * dt);
          c.dir = c.y > counterY ? 'up' : (c.x < counterX ? 'right' : 'left');
          if (arrived) { c.state = 'waiting'; c.dir = 'up'; }
        } else if (c.state === 'waiting') {
          c.wait -= gameMin;
          if (c.wait <= 0 || !open) {
            c.state = 'leaving';
            G.UI.notify(G.Data.strings.misc.customerLeaves);
          }
        } else if (c.state === 'leaving') {
          var gone = moveToward(c, doorX, doorY + 8, 45 * dt);
          c.dir = 'down';
          if (gone) this.customers.splice(i, 1);
        }
      }
    },

    spawn: function () {
      var tierIdx = this.rollTier();
      var tierId = G.Data.tiers[tierIdx].id;
      var want = { tier: tierIdx + 1, garmentId: null };
      if (Math.random() < G.Data.customers.specificChance) {
        var opts = [];
        var glist = G.Data.garmentsByTier(tierIdx + 1);
        for (var i = 0; i < glist.length; i++) if (!glist[i].quest) opts.push(glist[i].id);
        if (opts.length) want.garmentId = G.Utils.pick(opts);
      }
      this.customers.push({
        sprite: 'customer_' + tierId + '_' + (Math.random() < 0.5 ? 0 : 1),
        tier: tierIdx, want: want, state: 'entering',
        x: 11 * 16 + 8, y: 12 * 16 + 8, dir: 'up',
        wait: G.Data.customers.patience, animT: 0,
      });
      G.Audio.sfx('doorbell');
    },

    rollTier: function () {
      var highest = G.state.tier;
      var r = Math.random(), w = G.Data.customers.tierWeights;
      if (highest === 0) return 0;
      if (r < w.highest) return highest;
      if (r < w.highest + w.below) return highest - 1;
      return G.Utils.irand(0, Math.max(0, highest - 1));
    },

    customerAtCounter: function () {
      for (var i = 0; i < this.customers.length; i++) {
        if (this.customers[i].state === 'waiting') return this.customers[i];
      }
      return null;
    },

    dismiss: function (customer) {
      customer.state = 'leaving';
    },
  };

  function moveToward(o, tx, ty, step) {
    var dx = tx - o.x, dy = ty - o.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d <= step) { o.x = tx; o.y = ty; return true; }
    o.x += (dx / d) * step;
    o.y += (dy / d) * step;
    return false;
  }

  // =====================================================================
  // G.Time
  // =====================================================================

  var TINT_STOPS = [
    [360,  [255, 190, 120, 0.18]],
    [660,  [0, 0, 0, 0]],
    [960,  [0, 0, 0, 0]],
    [1080, [255, 150, 80, 0.22]],
    [1320, [30, 40, 90, 0.42]],
    [1500, [30, 40, 90, 0.42]],
  ];

  G.Time = {
    advance: function (dt) {
      G.state.time += dt / bal().clock.secPerGameMinute;
      if (G.state.time >= bal().clock.dayEnd) {
        G.UI.notify(G.Data.strings.midnight);
        this.sleep();
      }
    },

    clock: function () {
      var t = Math.floor(G.state.time);
      var h = Math.floor(t / 60), m = t % 60;
      return h + ':' + (m < 10 ? '0' : '') + m;
    },

    phase: function () {
      var t = G.state.time;
      if (t < 1080) return 'day';
      if (t < 1260) return 'dusk';
      return 'night';
    },

    tintColor: function () {
      var t = G.Utils.clamp(G.state.time, 360, 1499);
      for (var i = 0; i < TINT_STOPS.length - 1; i++) {
        var a = TINT_STOPS[i], b = TINT_STOPS[i + 1];
        if (t >= a[0] && t <= b[0]) {
          var f = (t - a[0]) / (b[0] - a[0]);
          var c = [];
          for (var k = 0; k < 4; k++) c[k] = a[1][k] + (b[1][k] - a[1][k]) * f;
          return c;
        }
      }
      return [0, 0, 0, 0];
    },

    tint: function (ctx, interior) {
      var c = this.tintColor();
      var a = c[3] * (interior ? 0.5 : 1);
      if (a <= 0.004) return;
      ctx.fillStyle = 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + a.toFixed(3) + ')';
      ctx.fillRect(0, 0, G.W, G.H);
    },

    sleep: function () {
      var st = G.state;
      st.day++;
      st.stats.days = st.day;
      st.time = bal().clock.dayStart;
      st.player.hp = st.player.maxHp;
      st.player.sta = st.player.maxSta;
      delete st.flags.coffeeToday;
      G.Economy.resetCustomers();
      G.Save.save();
      G.UI.notify(G.Utils.pick(G.Data.strings.morning) + '  (Day ' + st.day + ')');
      G.UI.notify(G.Data.strings.misc.saved);
    },
  };

  // =====================================================================
  // G.Hazards — nodes & enemies in gathering zones
  // =====================================================================

  G.Hazards = {
    zone: null,
    nodes: [],
    enemies: [],

    clear: function () {
      this.zone = null;
      this.nodes.length = 0;
      this.enemies.length = 0;
    },

    load: function (zoneId) {
      this.clear();
      var zone = G.Data.zones[zoneId];
      if (!zone) return;
      this.zone = zone;
      var map = G.Maps.get(zone.mapId);

      // nodes: shuffle spots, take nodeCount
      var spots = map.nodeSpots.slice();
      for (var i = spots.length - 1; i > 0; i--) {
        var j = (Math.random() * (i + 1)) | 0;
        var tmp = spots[i]; spots[i] = spots[j]; spots[j] = tmp;
      }
      var n = Math.min(zone.nodeCount, spots.length);
      for (i = 0; i < n; i++) {
        this.nodes.push({
          tx: spots[i].tx, ty: spots[i].ty,
          fabricId: G.Data.rollZoneFabric(zoneId),
          taken: false, t: Math.random() * 2,
        });
      }

      // enemies
      for (i = 0; i < zone.enemies.length; i++) {
        var spec = zone.enemies[i];
        for (var k = 0; k < spec.count; k++) this.spawnEnemy(spec.type, map);
      }
    },

    spawnEnemy: function (type, map) {
      var def = G.Data.enemies[type];
      if (!def) return;
      // random walkable tile far from the entrance
      var sx = map.spawn.tx, sy = map.spawn.ty;
      for (var tries = 0; tries < 80; tries++) {
        var tx = G.Utils.irand(2, map.w - 3), ty = G.Utils.irand(2, map.h - 3);
        if (map.solidAt(tx, ty)) continue;
        if (map.charAt(tx, ty) === 'x' || map.charAt(tx, ty) === 'n') continue;
        var dd = Math.abs(tx - sx) + Math.abs(ty - sy);
        if (dd < 10) continue;
        this.enemies.push({
          type: type, def: def, hp: def.hp,
          x: tx * 16 + 8, y: ty * 16 + 8,
          homeX: tx * 16 + 8, homeY: ty * 16 + 8,
          dir: 'down', state: 'idle', t: Math.random() * 2,
          teleT: 0, atkT: 0, cd: G.Utils.rand(0.5, 2),
          vx: 0, vy: 0, flashT: 0, deadT: 0, animT: Math.random(),
        });
        return;
      }
    },

    nodeAt: function (tx, ty) {
      for (var i = 0; i < this.nodes.length; i++) {
        var nd = this.nodes[i];
        if (!nd.taken && nd.tx === tx && nd.ty === ty) return nd;
      }
      return null;
    },

    harvest: function (node) {
      var f = G.Data.fabrics[node.fabricId];
      var qty = (f.rarity !== 'rare' && Math.random() < bal().harvest.doubleYieldChance) ? 2 : 1;
      G.Inventory.addFabric(node.fabricId, qty);
      node.taken = true;
      G.state.stats.gathered += qty;
      G.Player.spendStamina(bal().staminaCosts.harvest);
      G.Audio.sfx('pickup');
      G.UI.notify('+' + qty + ' ' + f.name, { icon: 'fabric_' + node.fabricId });
      G.Quests.trigger('gather', { id: node.fabricId, qty: qty, tier: f.tier });
    },

    hit: function (rect, dmg) {
      for (var i = 0; i < this.enemies.length; i++) {
        var e = this.enemies[i];
        if (e.deadT > 0) continue;
        var er = enemyRect(e);
        if (G.Utils.aabb(rect, er)) {
          e.hp -= dmg;
          e.flashT = 0.12;
          // knock the critter back a touch
          var p = G.state.player;
          var dx = e.x - p.x, dy = e.y - p.y;
          var d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          e.x += (dx / d) * 8;
          e.y += (dy / d) * 8;
          if (e.hp <= 0) {
            e.deadT = 0.35;
            G.Audio.sfx('thud');
          }
        }
      }
    },

    update: function (dt, map) {
      var p = G.state.player;
      var pr = G.Player.bodyRect();

      for (var i = this.enemies.length - 1; i >= 0; i--) {
        var e = this.enemies[i];
        e.animT += dt;
        if (e.flashT > 0) e.flashT -= dt;
        if (e.deadT > 0) {
          e.deadT -= dt;
          if (e.deadT <= 0) this.enemies.splice(i, 1);
          continue;
        }
        if (e.cd > 0) e.cd -= dt;

        var dx = p.x - e.x, dy = p.y - e.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var b = e.def.behavior;

        if (e.state === 'telegraph') {
          e.teleT -= dt;
          if (e.teleT <= 0) {
            e.state = 'attack';
            e.atkT = 0.55;
            var d2 = Math.max(1, dist);
            var burst = (b === 'patrol_charge' || b === 'guard_charge') ? 2.0 : (b === 'patrol_burst' ? 1.8 : 2.4);
            e.vx = (dx / d2) * e.def.speed * burst;
            e.vy = (dy / d2) * e.def.speed * burst;
          }
        } else if (e.state === 'attack') {
          e.atkT -= dt;
          moveEnemy(e, e.vx * dt, e.vy * dt, map, b === 'sine_phase');
          if (e.atkT <= 0) { e.state = 'idle'; e.cd = G.Utils.rand(1.2, 2.2); }
        } else {
          // idle wander per behavior
          var trigger = false, range = 60;
          if (b === 'drift_dive') {
            driftToward(e, p, 0.55, dt, map, false);
            range = 64; trigger = dist < range && e.cd <= 0;
          } else if (b === 'patrol_charge') {
            patrol(e, dt, map, 40);
            range = e.def.chargeRange || 48; trigger = dist < range && e.cd <= 0;
          } else if (b === 'guard_charge') {
            patrol(e, dt, map, 24);
            range = 90; trigger = dist < range && e.cd <= 0;
          } else if (b === 'drift_lunge') {
            driftToward(e, p, 0.45, dt, map, false);
            range = 42; trigger = dist < range && e.cd <= 0;
          } else if (b === 'sine_phase') {
            var sway = Math.sin(e.animT * 3) * 22;
            var d3 = Math.max(1, dist);
            moveEnemy(e, (dx / d3) * e.def.speed * dt + Math.cos(e.animT * 3) * 0.4, (dy / d3) * e.def.speed * dt + sway * dt * 0.2, map, true);
            range = 46; trigger = dist < range && e.cd <= 0;
          } else if (b === 'patrol_burst') {
            patrol(e, dt, map, 56);
            range = 76; trigger = dist < range && e.cd <= 0;
          }
          if (trigger) {
            e.state = 'telegraph';
            e.teleT = e.def.telegraphTime;
          }
          e.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
        }

        // contact damage
        if (e.deadT <= 0 && G.Utils.aabb(enemyRect(e), pr)) {
          G.Player.damage(e.def.damage, e.x, e.y);
        }
      }
    },

    draw: function (ctx) {
      // fabric nodes with Thread Gold sparkle
      for (var i = 0; i < this.nodes.length; i++) {
        var nd = this.nodes[i];
        if (nd.taken) continue;
        nd.t += 0.016;
        var icon = G.Sprites.get('fabric_' + nd.fabricId);
        ctx.drawImage(icon, nd.tx * 16 + 2, nd.ty * 16 + 3);
        var ph = Math.floor(nd.t / 0.75) % 2;
        ctx.drawImage(G.Sprites.get('node_glint_' + ph), nd.tx * 16 + 7, nd.ty * 16 - 4);
      }
    },

    drawEnemy: function (ctx, e) {
      if (e.deadT > 0) {
        // thread-puff
        var t = 1 - e.deadT / 0.35;
        ctx.fillStyle = G.Palette.linen;
        for (var k = 0; k < 5; k++) {
          var a = k * 1.3 + e.animT;
          ctx.fillRect(e.x + Math.cos(a) * 8 * t, e.y - 6 + Math.sin(a) * 8 * t, 2, 2);
        }
        return;
      }
      ctx.fillStyle = 'rgba(42,31,43,0.25)';
      var spr;
      if (e.state === 'telegraph') spr = G.Sprites.get(e.type + '_telegraph');
      else spr = G.Sprites.anim(e.type, e.dir, Math.floor(e.animT / 0.22));
      ctx.fillRect(e.x - spr.width / 2 + 2, e.y + 2, spr.width - 4, 3);
      if (e.flashT > 0) ctx.globalAlpha = 0.5;
      ctx.drawImage(spr, Math.round(e.x - spr.width / 2), Math.round(e.y - spr.height + 4));
      if (e.flashT > 0) ctx.globalAlpha = 1;
    },
  };

  function enemyRect(e) {
    return { x: e.x - 6, y: e.y - 8, w: 12, h: 12 };
  }

  function moveEnemy(e, dx, dy, map, phases) {
    var nx = e.x + dx, ny = e.y + dy;
    if (phases) { e.x = nx; e.y = ny; return; }
    if (!map.solidAt(Math.floor(nx / 16), Math.floor(e.y / 16))) e.x = nx;
    if (!map.solidAt(Math.floor(e.x / 16), Math.floor(ny / 16))) e.y = ny;
  }

  function driftToward(e, p, mult, dt, map, phases) {
    var dx = p.x - e.x, dy = p.y - e.y;
    var d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    var wob = Math.sin(e.animT * 4) * 10;
    moveEnemy(e, (dx / d) * e.def.speed * mult * dt, ((dy + wob) / d) * e.def.speed * mult * dt, map, phases);
  }

  function patrol(e, dt, map, radius) {
    if (e.patrolDir === undefined) e.patrolDir = 1;
    var target = e.homeX + e.patrolDir * radius;
    var dx = target - e.x;
    if (Math.abs(dx) < 3) { e.patrolDir *= -1; return; }
    moveEnemy(e, Math.sign ? Math.sign(dx) * e.def.speed * 0.5 * dt : (dx > 0 ? 1 : -1) * e.def.speed * 0.5 * dt, 0, map, false);
  }

  // =====================================================================
  // G.Quests
  // =====================================================================

  G.Quests = {
    current: function () {
      return G.Data.quests[G.state.quests.step] || null;
    },

    progressText: function () {
      var q = this.current();
      if (!q) return G.state.flags.endingSeen ? 'Free play — the city is yours.' : 'To the palace — the coronation waits!';
      var g = q.goal;
      if (g.type === 'gather' || g.type === 'sell' || (g.type === 'craft' && g.qty > 1)) {
        return q.hint + ' (' + Math.min(G.state.quests.count, g.qty) + '/' + g.qty + ')';
      }
      if (g.type === 'rep') {
        return q.hint + ' (' + Math.min(G.state.rep, g.qty) + '/' + g.qty + ')';
      }
      return q.hint;
    },

    trigger: function (evt, payload) {
      var q = this.current();
      if (!q) return;
      var g = q.goal;
      var done = false;
      payload = payload || {};

      if (evt === 'talk' && g.type === 'talk') {
        if (payload.npc === g.target) done = true;
      } else if (evt === 'gather' && g.type === 'gather') {
        var counts = false;
        if (g.target) counts = payload.id === g.target;
        else if (g.tier) counts = payload.tier === g.tier;
        else counts = true;
        if (counts) {
          G.state.quests.count += payload.qty || 1;
          if (G.state.quests.count >= g.qty) done = true;
        }
      } else if (evt === 'craft' && g.type === 'craft') {
        if (payload.id === g.target) {
          G.state.quests.count += 1;
          if (G.state.quests.count >= (g.qty || 1)) done = true;
        }
      } else if (evt === 'sell' && g.type === 'sell') {
        G.state.quests.count += 1;
        if (G.state.quests.count >= g.qty) done = true;
      } else if (evt === 'rep' && g.type === 'rep') {
        if (G.state.rep >= g.qty) done = true;
      }

      if (done) this.complete(q);
    },

    complete: function (q) {
      var r = q.reward || {};
      G.state.quests.done[q.id] = true;
      G.state.quests.step++;
      G.state.quests.count = 0;

      if (r.take) G.Inventory.takeGarment(r.take);
      if (r.gold) {
        G.state.gold += r.gold;
        G.state.stats.earned += r.gold;
      }
      if (r.unlock && G.state.recipes.indexOf(r.unlock) < 0) {
        G.state.recipes.push(r.unlock);
        G.UI.notify(G.Data.strings.misc.recipeUnlocked, { icon: 'garment_' + r.unlock });
      }
      if (r.flag) G.state.flags[r.flag] = true;

      G.Audio.sfx('fanfare');
      G.UI.dialogue.open('✦ ' + q.title, [q.payoff], { portrait: null });
      G.Save.save();

      if (r.rep) G.Economy.addRep(r.rep);

      // chain: the next quest may already be satisfied (rep goals)
      var nq = this.current();
      if (nq && nq.goal.type === 'rep' && G.state.rep >= nq.goal.qty) {
        this.complete(nq);
      }
    },
  };

  // =====================================================================
  // G.Systems — collapse & zone gates
  // =====================================================================

  G.Systems = {
    collapse: function () {
      var f = G.state.inv.fabrics;
      for (var id in f) {
        var lose = Math.floor(f[id] * bal().collapseFabricLoss);
        f[id] -= lose;
        if (f[id] <= 0) delete f[id];
      }
      G.UI.notify(G.Data.strings.collapse);
      G.Time.sleep();
      var sp = G.Maps.get('shop').spawn;
      G.state.player.map = 'shop';
      G.state.player.x = sp.tx * 16 + 8;
      G.state.player.y = sp.ty * 16 + 8;
      G.setScene('world', { map: 'shop' });
      G.UI.notify(G.Data.strings.collapseWake);
    },

    zoneUnlocked: function (zoneId) {
      var z = G.Data.zones[zoneId];
      if (!z) return true;
      return G.state.tier >= (z.tier - 1);
    },
  };

})();
