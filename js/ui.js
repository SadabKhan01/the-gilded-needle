'use strict';
// The Gilded Needle — ui.js
// Owns G.UI: stitched walnut/linen panels, HUD, dialogue, toasts, inventory,
// crafting + "The Seam" minigame, shop selling, upgrades, pause, prompts.
// Design: art.md §5. Numbers: systems.md §6-§8 via G.Data.balance.

window.G = window.G || {};

(function () {

  var layers = [];     // modal stack; each: {kind, update(dt), draw(ctx)}
  var toasts = [];     // {text, icon, t, y}
  var dlg = null;      // dialogue state
  var uiInteractive = true; // false while drawing non-top layers (their buttons must not fire)

  function pushLayer(l) {
    layers.push(l);
    G.Input.endFrame(); // consume the keypress/click that opened this layer
  }

  function P() { return G.Palette; }

  // =====================================================================
  // Primitives
  // =====================================================================

  function panel(ctx, x, y, w, h, opts) {
    opts = opts || {};
    ctx.fillStyle = 'rgba(42,31,43,0.4)';
    ctx.fillRect(x + 2, y + 2, w, h);
    ctx.fillStyle = P().bark1;                       // walnut frame
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = P().outline;
    ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
    ctx.fillStyle = opts.fill || P().linen;          // linen fill
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    // golden running-stitch border
    ctx.save();
    ctx.strokeStyle = P().gold;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    ctx.lineDashOffset = opts.animStitch ? -Math.floor(G.Engine.time * 10) : 0;
    ctx.strokeRect(x + 4.5, y + 4.5, w - 9, h - 9);
    ctx.restore();
    if (opts.title) {
      var tw = opts.title.length * 6 + 12;
      ctx.fillStyle = P().parchment;
      ctx.fillRect(x + 8, y - 5, tw, 12);
      ctx.fillStyle = P().outline;
      ctx.fillRect(x + 8, y - 5, tw, 1); ctx.fillRect(x + 8, y + 6, tw, 1);
      ctx.fillRect(x + 8, y - 5, 1, 12); ctx.fillRect(x + 7 + tw, y - 5, 1, 12);
      G.Utils.text(ctx, opts.title, x + 14, y - 3, { size: 10, color: P().outline, shadow: false });
      ctx.fillStyle = P().gold;
      ctx.fillRect(x + 10, y, 2, 1); ctx.fillRect(x + tw + 2, y, 2, 1);
    }
  }

  function inBox(mx, my, b) {
    return mx >= b.x && mx < b.x + b.w && my >= b.y && my < b.y + b.h;
  }

  // returns true when clicked (or keyboard-activated via b.selected + Enter/E)
  function button(ctx, b) {
    var m = G.Input.mouse;
    var hover = uiInteractive && inBox(m.x, m.y, b) && !b.disabled;
    var active = hover || b.selected;
    ctx.fillStyle = 'rgba(42,31,43,0.35)';
    ctx.fillRect(b.x + 1, b.y + 1, b.w, b.h);
    ctx.fillStyle = b.disabled ? P().taupe : (m.down && hover ? P().bark3 : (active ? P().parchment : P().linen));
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = P().outline;
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    if (active && !b.disabled) {
      ctx.save();
      ctx.strokeStyle = P().gold;
      ctx.setLineDash([3, 2]);
      ctx.lineDashOffset = -Math.floor(G.Engine.time * 10);
      ctx.strokeRect(b.x + 2.5, b.y + 2.5, b.w - 5, b.h - 5);
      ctx.restore();
    }
    var ty = b.y + Math.floor((b.h - (b.size || 12)) / 2) + (m.down && hover ? 1 : 0);
    G.Utils.text(ctx, b.label, b.x + b.w / 2, ty, {
      size: b.size || 12, align: 'center', shadow: false,
      color: b.disabled ? P().soot : P().outline, font: b.font || 'body',
    });
    var clicked = hover && m.clicked;
    var keyed = uiInteractive && b.selected && (G.Input.pressed('Enter') || G.Input.pressed('KeyE'));
    return !b.disabled && (clicked || keyed);
  }

  function drawIcon(ctx, name, x, y) {
    ctx.drawImage(G.Sprites.get(name), x, y);
  }

  function chip(ctx, text, x, y, opts) { // small dark label chip
    opts = opts || {};
    var w = text.length * 5.4 + 10;
    if (opts.align === 'center') x -= w / 2;
    ctx.fillStyle = 'rgba(42,31,43,0.82)';
    ctx.fillRect(x, y, w, 13);
    ctx.fillStyle = P().gold;
    ctx.fillRect(x, y, 2, 1); ctx.fillRect(x + w - 2, y + 12, 2, 1);
    G.Utils.text(ctx, text, x + 5, y + 2, { size: 12, color: opts.color || P().linen, shadow: false });
    return w;
  }

  // =====================================================================
  // Dialogue
  // =====================================================================

  var dialogue = {
    active: false,
    open: function (name, lines, opts) {
      dlg = {
        name: name, lines: lines.slice(), page: 0, chars: 0, age: 0,
        opts: opts || {},
      };
      dialogue.active = true;
    },
    update: function (dt) {
      if (!dlg) return;
      dlg.chars += dt * 40;
      dlg.age += dt;
      var adv = dlg.age > 0.15 && (G.Input.pressed('KeyE') || G.Input.pressed('Space') ||
                G.Input.pressed('Enter') || G.Input.mouse.clicked);
      if (adv) {
        var full = dlg.lines[dlg.page].length;
        if (dlg.chars < full) {
          dlg.chars = full;
        } else {
          dlg.page++;
          dlg.chars = 0;
          G.Audio.sfx('ui');
          if (dlg.page >= dlg.lines.length) {
            var cb = dlg.opts.onDone;
            dlg = null;
            dialogue.active = false;
            if (cb) cb();
          }
        }
      }
    },
    draw: function (ctx) {
      if (!dlg) return;
      var x = 12, y = G.H - 76, w = G.W - 24, h = 64;
      panel(ctx, x, y, w, h, { title: dlg.name, animStitch: true });
      var tx = x + 12, tw = w - 24;
      if (dlg.opts.portrait) {
        ctx.fillStyle = P().parchment;
        ctx.fillRect(x + 8, y + 12, 30, 34);
        ctx.strokeStyle = P().gold;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(x + 9.5, y + 13.5, 27, 31);
        ctx.setLineDash([]);
        var spr = G.Sprites.anim(dlg.opts.portrait, 'down', 0);
        ctx.drawImage(spr, x + 15, y + 17);
        tx = x + 46; tw = w - 58;
      }
      var line = dlg.lines[dlg.page] || '';
      var shown = line.substr(0, Math.floor(dlg.chars));
      var wrapped = G.Utils.wrapText(ctx, shown, tw, 12);
      for (var i = 0; i < wrapped.length && i < 3; i++) {
        G.Utils.text(ctx, wrapped[i], tx, y + 13 + i * 13, { size: 12, color: P().outline, shadow: false });
      }
      if (dlg.chars >= line.length) {
        var bounce = Math.floor(G.Engine.time * 3) % 2;
        G.Utils.text(ctx, '▼', x + w - 16, y + h - 14 + bounce, { size: 10, color: P().bark1, shadow: false });
      }
    },
  };

  // =====================================================================
  // The Seam — crafting minigame layer
  // =====================================================================

  function openSeam(garment) {
    var tierIdx = garment.tier - 1;
    var b = G.Data.balance.seam;
    var goldW = G.state.flags.firstCraftDone ? b.goldWidth[tierIdx] : b.firstCraftGoldWidth;
    var layer = {
      kind: 'seam',
      g: garment,
      need: b.stitches[tierIdx],
      idx: 0, hits: 0,
      pos: 0, dir: 1,
      speed: 2 / b.sweepTime[tierIdx],   // full traverses per second... pos units/s
      goldC: 0.3 + Math.random() * 0.4,
      goldW: goldW,
      marks: [],                          // {at, good}
      resultT: 0, stars: 0,
      noEsc: true,
      update: function (dt) {
        if (this.resultT > 0) {
          this.resultT -= dt;
          if (this.resultT <= 0) {
            layers.pop();
            G.Craft.consume(this.g.id);
            G.Craft.finish(this.g.id, this.stars);
          }
          return;
        }
        this.pos += this.dir * this.speed * dt * 0.5;
        if (this.pos >= 1) { this.pos = 1; this.dir = -1; }
        if (this.pos <= 0) { this.pos = 0; this.dir = 1; }
        if (G.Input.pressed('Space') || G.Input.mouse.clicked) {
          var inGold = Math.abs(this.pos - this.goldC) <= this.goldW / 2;
          var perfect = Math.abs(this.pos - this.goldC) <= this.goldW / 5;
          if (inGold) this.hits++;
          this.marks.push({ at: this.pos, good: inGold, perfect: perfect });
          G.Audio.sfx(inGold ? (perfect ? 'stitch_perfect' : 'stitch') : 'ui');
          this.idx++;
          this.goldC = 0.12 + Math.random() * 0.76;
          if (this.idx >= this.need) {
            if (this.need === 5) this.stars = this.hits >= 5 ? 3 : (this.hits >= 3 ? 2 : 1);
            else this.stars = this.hits >= 3 ? 3 : (this.hits >= 2 ? 2 : 1);
            this.resultT = 1.1;
            G.Audio.sfx(this.stars === 3 ? 'fanfare' : 'snip');
          }
        }
      },
      draw: function (ctx) {
        var x = 90, y = 70, w = 300, h = 130;
        panel(ctx, x, y, w, h, { title: 'The Seam — ' + this.g.name, animStitch: true });
        // fabric swatch
        var firstFab = null;
        for (var fid in this.g.recipe) { firstFab = fid; break; }
        var col = G.Data.fabrics[firstFab] ? G.Data.fabrics[firstFab].color : P().poorIndigo;
        ctx.fillStyle = col;
        ctx.fillRect(x + 14, y + 22, w - 28, 62);
        ctx.fillStyle = 'rgba(42,31,43,0.18)';
        for (var wy = y + 26; wy < y + 82; wy += 6) ctx.fillRect(x + 14, wy, w - 28, 1);

        if (this.resultT > 0) {
          var stars = '';
          for (var s = 0; s < 3; s++) stars += s < this.stars ? '★' : '☆';
          G.Utils.text(ctx, stars, x + w / 2, y + 40, { size: 16, align: 'center', font: 'head', color: P().gold });
          G.Utils.text(ctx, this.stars === 3 ? 'A perfect seam!' : (this.stars === 2 ? 'A fine seam.' : 'It holds. It counts.'),
            x + w / 2, y + 66, { size: 12, align: 'center', color: P().linen });
          return;
        }
        // seam bar
        var bx = x + 20, bw = w - 40, by = y + 52;
        ctx.fillStyle = P().outline;
        ctx.fillRect(bx - 1, by - 1, bw + 2, 10);
        ctx.fillStyle = P().parchment;
        ctx.fillRect(bx, by, bw, 8);
        // gold zone
        var gx = bx + (this.goldC - this.goldW / 2) * bw;
        ctx.fillStyle = P().gold;
        ctx.fillRect(gx, by, this.goldW * bw, 8);
        ctx.fillStyle = P().linen;
        ctx.fillRect(gx + this.goldW * bw / 2 - 1, by, 2, 8);
        // past stitches
        for (var m = 0; m < this.marks.length; m++) {
          var mk = this.marks[m];
          ctx.fillStyle = mk.good ? (mk.perfect ? '#ffffff' : P().gold) : P().soot;
          ctx.fillRect(bx + mk.at * bw - 1, by + 12 + m * 3 - m * 3, 2, 4);
          ctx.fillRect(bx + mk.at * bw - 3, by + 14, 6, 1);
        }
        // needle marker
        var nx = bx + this.pos * bw;
        ctx.fillStyle = P().silver;
        ctx.fillRect(nx - 1, by - 8, 2, 8);
        ctx.fillStyle = P().goldRegal;
        ctx.fillRect(nx - 1, by - 10, 2, 2);
        // stitch count + prompt
        G.Utils.text(ctx, 'Stitch ' + (this.idx + 1) + ' / ' + this.need, x + w / 2, y + 92,
          { size: 12, align: 'center', color: P().linen });
        G.Utils.text(ctx, 'SPACE to stitch in the gold', x + w / 2, y + 106,
          { size: 10, align: 'center', color: P().gold });
      },
    };
    pushLayer(layer);
  }

  // =====================================================================
  // Crafting menu
  // =====================================================================

  function openCrafting() {
    var layer = {
      kind: 'craft', sel: 0, scroll: 0,
      list: function () {
        var known = G.Craft.available();
        var out = [];
        for (var id in G.Data.garments) {
          var g = G.Data.garments[id];
          var unlocked = known.indexOf(id) >= 0;
          out.push({ g: g, unlocked: unlocked });
        }
        out.sort(function (a, b) { return a.g.tier - b.g.tier || a.g.price - b.g.price; });
        return out;
      },
      update: function (dt) {
        var list = this.list();
        if (G.Input.pressed('ArrowDown') || G.Input.pressed('KeyS')) { this.sel = Math.min(list.length - 1, this.sel + 1); G.Audio.sfx('ui'); }
        if (G.Input.pressed('ArrowUp') || G.Input.pressed('KeyW')) { this.sel = Math.max(0, this.sel - 1); G.Audio.sfx('ui'); }
        var vis = 7;
        if (this.sel < this.scroll) this.scroll = this.sel;
        if (this.sel >= this.scroll + vis) this.scroll = this.sel - vis + 1;
      },
      draw: function (ctx) {
        var x = 50, y = 22, w = 380, h = 226;
        panel(ctx, x, y, w, h, { title: 'Sewing Table', animStitch: true });
        var list = this.list();
        var vis = 7;
        var rowY = y + 14;
        for (var i = this.scroll; i < Math.min(list.length, this.scroll + vis); i++) {
          var it = list[i], g = it.g;
          var selected = i === this.sel;
          var can = it.unlocked && G.Craft.canCraft(g.id);
          if (selected) {
            ctx.fillStyle = P().parchment;
            ctx.fillRect(x + 8, rowY - 2, w - 16, 26);
            ctx.save();
            ctx.strokeStyle = P().gold;
            ctx.setLineDash([3, 2]);
            ctx.lineDashOffset = -Math.floor(G.Engine.time * 10);
            ctx.strokeRect(x + 9.5, rowY - 0.5, w - 19, 23);
            ctx.restore();
          }
          drawIcon(ctx, 'garment_' + g.id, x + 14, rowY + 4);
          var nameCol = !it.unlocked ? P().taupe : (can ? P().outline : P().soot);
          G.Utils.text(ctx, g.name, x + 32, rowY + 1, { size: 12, color: nameCol, shadow: false });
          // ingredients
          var ix = x + 32, iy = rowY + 13;
          for (var fid in g.recipe) {
            var have = G.Inventory.fabricCount(fid), need = g.recipe[fid];
            drawIcon(ctx, 'fabric_' + fid, ix, iy - 2);
            G.Utils.text(ctx, have + '/' + need, ix + 13, iy - 1, {
              size: 10, shadow: false, color: have >= need ? P().marketGreen : P().crimson,
            });
            ix += 44;
          }
          if (!it.unlocked) {
            var tierName = G.Data.tiers[g.tier - 1] ? G.Data.tiers[g.tier - 1].name : '?';
            chip(ctx, g.quest ? 'Quest' : tierName + ' tier', x + w - 78, rowY + 2, {});
          } else {
            drawIcon(ctx, 'coin', x + w - 70, rowY + 4);
            G.Utils.text(ctx, String(g.price), x + w - 58, rowY + 2, { size: 12, color: P().outline, shadow: false });
          }
          rowY += 28;
        }
        // footer
        var sel = list[this.sel];
        var canCraft = sel && sel.unlocked && G.Craft.canCraft(sel.g.id);
        if (button(ctx, { x: x + w - 110, y: y + h - 26, w: 96, h: 18, label: 'Craft (E)', disabled: !canCraft, selected: true })) {
          openSeam(sel.g);
        }
        if (sel) {
          G.Utils.text(ctx, sel.g.desc, x + 14, y + h - 22, { size: 10, color: P().soot, shadow: false });
        }
        G.Utils.text(ctx, 'Esc — close', x + 14, y + h - 11, { size: 10, color: P().taupe, shadow: false });
      },
    };
    pushLayer(layer);
  }

  // =====================================================================
  // Inventory
  // =====================================================================

  function openInventory() {
    var layer = {
      kind: 'inv', tab: 0, sel: 0,
      update: function (dt) {
        if (G.Input.pressed('ArrowLeft') || G.Input.pressed('ArrowRight') || G.Input.pressed('Tab')) {
          this.tab = 1 - this.tab; this.sel = 0; G.Audio.sfx('ui');
        }
        var n = G.Inventory.list(this.tab === 0 ? 'fabrics' : 'garments').length;
        if (G.Input.pressed('ArrowDown')) this.sel = Math.min(Math.max(0, n - 1), this.sel + 1);
        if (G.Input.pressed('ArrowUp')) this.sel = Math.max(0, this.sel - 1);
        if (G.Input.pressed('KeyI')) closeTop();
      },
      draw: function (ctx) {
        var x = 60, y = 26, w = 360, h = 218;
        panel(ctx, x, y, w, h, { title: 'Satchel', animStitch: true });
        // tabs
        if (button(ctx, { x: x + 12, y: y + 10, w: 80, h: 16, label: 'Fabrics', selected: this.tab === 0 })) { this.tab = 0; this.sel = 0; }
        if (button(ctx, { x: x + 96, y: y + 10, w: 80, h: 16, label: 'Garments', selected: this.tab === 1 })) { this.tab = 1; this.sel = 0; }
        var list = G.Inventory.list(this.tab === 0 ? 'fabrics' : 'garments');
        var rowY = y + 34;
        if (!list.length) {
          G.Utils.text(ctx, this.tab === 0 ? 'No fabric yet. The Weftworks waits.' : 'Nothing sewn yet.',
            x + 16, rowY + 6, { size: 12, color: P().soot, shadow: false });
        }
        for (var i = 0; i < Math.min(list.length, 8); i++) {
          var it = list[i];
          var selected = i === this.sel;
          if (selected) {
            ctx.fillStyle = P().parchment;
            ctx.fillRect(x + 8, rowY - 2, w - 140, 20);
          }
          var def, label, tint;
          if (this.tab === 0) {
            def = G.Data.fabrics[it.id];
            drawIcon(ctx, 'fabric_' + it.id, x + 12, rowY);
            label = def.name + '  ×' + it.qty;
          } else {
            def = G.Data.garments[it.id];
            drawIcon(ctx, 'garment_' + it.id, x + 12, rowY);
            var qs = '';
            for (var q = 0; q < Math.min(it.qualities.length, 5); q++) qs += it.qualities[q] + '★ ';
            label = def.name + '  ×' + it.qty + '  ' + qs;
          }
          tint = P().tierAccent[(def.tier || 1) - 1] || P().outline;
          G.Utils.text(ctx, label, x + 30, rowY + 3, { size: 12, color: P().outline, shadow: false });
          ctx.fillStyle = tint;
          ctx.fillRect(x + 30, rowY + 15, 24, 1);
          rowY += 21;
        }
        // detail card
        var sel = list[this.sel];
        if (sel) {
          var dx = x + w - 126, dy = y + 34;
          ctx.fillStyle = P().parchment;
          ctx.fillRect(dx, dy, 114, 128);
          ctx.strokeStyle = P().bark1;
          ctx.strokeRect(dx + 0.5, dy + 0.5, 113, 127);
          var d2 = this.tab === 0 ? G.Data.fabrics[sel.id] : G.Data.garments[sel.id];
          G.Utils.text(ctx, d2.name, dx + 6, dy + 6, { size: 12, color: P().outline, shadow: false });
          var lines = G.Utils.wrapText(ctx, d2.desc, 102, 10);
          for (var L = 0; L < Math.min(lines.length, 6); L++) {
            G.Utils.text(ctx, lines[L], dx + 6, dy + 22 + L * 11, { size: 10, color: P().soot, shadow: false });
          }
          drawIcon(ctx, 'coin', dx + 6, dy + 104);
          G.Utils.text(ctx, String(d2.value || d2.price), dx + 18, dy + 103, { size: 10, color: P().outline, shadow: false });
        }
        G.Utils.text(ctx, '←/→ tabs · Esc/I close', x + 14, y + h - 13, { size: 10, color: P().taupe, shadow: false });
      },
    };
    pushLayer(layer);
  }

  // =====================================================================
  // Shop: selling to a customer
  // =====================================================================

  function openShopSell(customer) {
    var layer = {
      kind: 'sell', sel: 0, customer: customer,
      stock: function () {
        var want = this.customer.want;
        var out = [];
        var list = G.Inventory.list('garments');
        for (var i = 0; i < list.length; i++) {
          var g = G.Data.garments[list[i].id];
          if (want.garmentId ? list[i].id === want.garmentId : g.tier === want.tier) {
            out.push({ id: list[i].id, g: g, quality: list[i].qualities[0], qty: list[i].qty });
          }
        }
        return out;
      },
      update: function (dt) {
        var n = this.stock().length;
        if (G.Input.pressed('ArrowDown')) this.sel = Math.min(Math.max(0, n - 1), this.sel + 1);
        if (G.Input.pressed('ArrowUp')) this.sel = Math.max(0, this.sel - 1);
      },
      draw: function (ctx) {
        var x = 80, y = 40, w = 320, h = 190;
        var c = this.customer;
        var tierName = G.Data.tiers[c.tier].name;
        panel(ctx, x, y, w, h, { title: tierName + ' customer', animStitch: true });
        // request card
        var spr = G.Sprites.anim(c.sprite, 'down', 0);
        ctx.drawImage(spr, x + 16, y + 14);
        var wantText;
        if (c.want.garmentId) wantText = '"' + G.Data.garments[c.want.garmentId].name + ', if you have one."';
        else wantText = '"Anything fine of ' + tierName.toLowerCase() + ' taste."';
        G.Utils.text(ctx, wantText, x + 42, y + 20, { size: 12, color: P().outline, shadow: false });
        if (c.want.garmentId) drawIcon(ctx, 'garment_' + c.want.garmentId, x + 42, y + 34);

        var stock = this.stock();
        var rowY = y + 56;
        if (!stock.length) {
          G.Utils.text(ctx, 'You have nothing they need — yet.', x + 20, rowY + 4, { size: 12, color: P().soot, shadow: false });
        }
        for (var i = 0; i < Math.min(stock.length, 4); i++) {
          var it = stock[i];
          var price = G.Economy.priceFor(it.id, it.quality, c.tier);
          var selected = i === this.sel;
          if (selected) {
            ctx.fillStyle = P().parchment;
            ctx.fillRect(x + 10, rowY - 2, w - 20, 22);
          }
          drawIcon(ctx, 'garment_' + it.id, x + 16, rowY);
          G.Utils.text(ctx, it.g.name + '  ' + it.quality + '★  ×' + it.qty, x + 34, rowY + 3, { size: 12, color: P().outline, shadow: false });
          drawIcon(ctx, 'coin', x + w - 78, rowY + 2);
          G.Utils.text(ctx, String(price), x + w - 64, rowY + 2, { size: 12, color: P().outline, shadow: false });
          if (selected && (G.Input.pressed('Enter') || G.Input.pressed('KeyE'))) {
            this.sellIt(it);
          }
          if (inBox(G.Input.mouse.x, G.Input.mouse.y, { x: x + 10, y: rowY - 2, w: w - 20, h: 22 }) && G.Input.mouse.clicked) {
            this.sellIt(it);
          }
          rowY += 24;
        }
        if (button(ctx, { x: x + 14, y: y + h - 26, w: 130, h: 18, label: 'Politely decline' })) {
          G.Economy.dismiss(this.customer);
          closeTop();
        }
        G.Utils.text(ctx, 'E/Enter — sell', x + w - 100, y + h - 22, { size: 10, color: P().taupe, shadow: false });
      },
      sellIt: function (it) {
        var q = G.Inventory.takeGarment(it.id);
        if (q === null) return;
        G.Economy.sell(it.id, q, this.customer);
        G.Economy.dismiss(this.customer);
        closeTop();
      },
    };
    pushLayer(layer);
  }

  // =====================================================================
  // Wardrobe — dress a mannequin from your stock (showcase shelves)
  // =====================================================================

  function openWardrobe(mannequinKey) {
    var COLS = 4;
    var layer = {
      kind: 'wardrobe', sel: 0, key: mannequinKey,
      items: function () {
        var out = [{ id: null, name: '(bare form)' }];
        var list = G.Inventory.list('garments');
        for (var i = 0; i < list.length; i++) {
          var g = G.Data.garments[list[i].id];
          out.push({ id: list[i].id, name: g.name, qty: list[i].qty, tier: g.tier });
        }
        return out;
      },
      update: function (dt) {
        var n = this.items().length;
        if (G.Input.pressed('ArrowRight')) this.sel = Math.min(n - 1, this.sel + 1);
        if (G.Input.pressed('ArrowLeft')) this.sel = Math.max(0, this.sel - 1);
        if (G.Input.pressed('ArrowDown')) this.sel = Math.min(n - 1, this.sel + COLS);
        if (G.Input.pressed('ArrowUp')) this.sel = Math.max(0, this.sel - COLS);
        if (G.Input.pressed('Enter') || G.Input.pressed('KeyE')) this.dress();
      },
      dress: function () {
        var it = this.items()[this.sel];
        if (!it) return;
        if (!G.state.mannequins) G.state.mannequins = {};
        if (it.id) {
          G.state.mannequins[this.key] = it.id;
          notify(it.name + ' — on display!', { icon: 'garment_' + it.id });
        } else {
          delete G.state.mannequins[this.key];
          notify('The form stands bare.');
        }
        G.Audio.sfx('ui');
        closeTop();
      },
      draw: function (ctx) {
        var x = 44, y = 20, w = 392, h = 230;
        panel(ctx, x, y, w, h, { title: 'Wardrobe — dress the mannequin', animStitch: true });
        var items = this.items();
        // showcase shelves (left)
        var gx = x + 12, gy = y + 16, cw = 58, chh = 44;
        for (var i = 0; i < Math.min(items.length, 16); i++) {
          var cx = gx + (i % COLS) * cw, cy = gy + Math.floor(i / COLS) * chh;
          ctx.fillStyle = P().parchment;                 // shelf niche
          ctx.fillRect(cx, cy, cw - 6, chh - 6);
          ctx.fillStyle = P().bark2;                     // shelf lip
          ctx.fillRect(cx, cy + chh - 8, cw - 6, 2);
          if (i === this.sel) {
            ctx.save();
            ctx.strokeStyle = P().gold;
            ctx.setLineDash([3, 2]);
            ctx.lineDashOffset = -Math.floor(G.Engine.time * 10);
            ctx.strokeRect(cx + 1.5, cy + 1.5, cw - 9, chh - 9);
            ctx.restore();
          }
          if (items[i].id) {
            var icon = G.Sprites.get('garment_' + items[i].id);
            ctx.drawImage(icon, 0, 0, 12, 12, cx + 14, cy + 6, 24, 24);
            G.Utils.text(ctx, '×' + items[i].qty, cx + cw - 20, cy + chh - 20, { size: 10, color: P().soot, shadow: false });
            ctx.fillStyle = P().tierAccent[(items[i].tier || 1) - 1];
            ctx.fillRect(cx + 4, cy + chh - 12, cw - 14, 2);
          } else {
            G.Utils.text(ctx, '—', cx + 22, cy + 12, { size: 14, color: P().taupe, shadow: false });
          }
        }
        if (items.length === 1) {
          G.Utils.text(ctx, 'Nothing sewn yet — the shelves wait.', gx, gy + 8, { size: 12, color: P().soot, shadow: false });
        }
        // preview alcove (right)
        var px0 = x + 258, py0 = y + 16, pw = 120, ph = 172;
        ctx.fillStyle = P().parchment;
        ctx.fillRect(px0, py0, pw, ph);
        ctx.strokeStyle = P().bark1;
        ctx.strokeRect(px0 + 0.5, py0 + 0.5, pw - 1, ph - 1);
        // warm string lights
        for (var L = 0; L < 5; L++) {
          ctx.fillStyle = P().gold;
          ctx.fillRect(px0 + 12 + L * 22, py0 + 6 + (L % 2) * 2, 2, 2);
        }
        // the dress form, large
        var fx = px0 + pw / 2, fy = py0 + 34;
        ctx.fillStyle = P().bark1;
        ctx.fillRect(fx - 12, py0 + ph - 26, 24, 5);       // base
        ctx.fillRect(fx - 2, py0 + ph - 50, 4, 26);        // pole
        ctx.fillStyle = P().linen;
        ctx.fillRect(fx - 16, fy + 8, 32, 12);             // shoulders
        ctx.fillRect(fx - 12, fy, 24, 58);                 // torso
        ctx.fillStyle = P().bark3;
        ctx.fillRect(fx - 3, fy - 6, 6, 6);                // neck cap
        var sel2 = items[this.sel];
        if (sel2 && sel2.id) {
          var big = G.Sprites.get('garment_' + sel2.id);
          ctx.drawImage(big, 0, 0, 12, 12, fx - 24, fy + 2, 48, 48);
        }
        G.Utils.text(ctx, sel2 ? sel2.name : '', px0 + pw / 2, py0 + ph - 16, { size: 10, align: 'center', color: P().outline, shadow: false });
        // footer
        if (button(ctx, { x: x + 258, y: y + h - 34, w: 120, h: 20, label: 'Dress (E)', selected: true })) {
          this.dress();
        }
        G.Utils.text(ctx, 'Arrows — browse · Esc — close', x + 14, y + h - 15, { size: 10, color: P().taupe, shadow: false });
      },
    };
    pushLayer(layer);
  }

  // =====================================================================
  // Upgrades (shop counter, no customer waiting)
  // =====================================================================

  function openUpgrades() {
    var layer = {
      kind: 'upgrades', sel: 0,
      ids: ['steel_shears', 'oak_mannequin', 'brass_bed', 'gilded_sign'],
      update: function (dt) {
        if (G.Input.pressed('ArrowDown')) this.sel = Math.min(this.ids.length - 1, this.sel + 1);
        if (G.Input.pressed('ArrowUp')) this.sel = Math.max(0, this.sel - 1);
        if (G.Input.pressed('Enter') || G.Input.pressed('KeyE')) {
          G.Economy.buyUpgrade(this.ids[this.sel]);
        }
      },
      draw: function (ctx) {
        var x = 80, y = 44, w = 320, h = 172;
        panel(ctx, x, y, w, h, { title: 'Shop Counter — Improvements', animStitch: true });
        var rowY = y + 16;
        for (var i = 0; i < this.ids.length; i++) {
          var up = G.Data.upgrades[this.ids[i]];
          var owned = !!G.state.upgrades[up.id];
          var selected = i === this.sel;
          if (selected) {
            ctx.fillStyle = P().parchment;
            ctx.fillRect(x + 10, rowY - 2, w - 20, 30);
          }
          G.Utils.text(ctx, up.name, x + 16, rowY + 1, { size: 12, color: owned ? P().marketGreen : P().outline, shadow: false });
          G.Utils.text(ctx, up.desc, x + 16, rowY + 14, { size: 10, color: P().soot, shadow: false });
          if (owned) {
            G.Utils.text(ctx, 'Owned', x + w - 60, rowY + 4, { size: 12, color: P().marketGreen, shadow: false });
          } else {
            drawIcon(ctx, 'coin', x + w - 76, rowY + 3);
            G.Utils.text(ctx, String(up.price), x + w - 62, rowY + 2, {
              size: 12, shadow: false, color: G.state.gold >= up.price ? P().outline : P().crimson,
            });
          }
          rowY += 33;
        }
        G.Utils.text(ctx, 'E/Enter — buy · Esc — close', x + 14, y + h - 13, { size: 10, color: P().taupe, shadow: false });
      },
    };
    pushLayer(layer);
  }

  // =====================================================================
  // Pause & confirm
  // =====================================================================

  function openPause() {
    var layer = {
      kind: 'pause', sel: 0,
      items: ['Resume', 'Save', 'Mute', 'Controls', 'Quit to Title'],
      update: function (dt) {
        if (G.Input.pressed('ArrowDown')) { this.sel = (this.sel + 1) % this.items.length; G.Audio.sfx('ui'); }
        if (G.Input.pressed('ArrowUp')) { this.sel = (this.sel + this.items.length - 1) % this.items.length; G.Audio.sfx('ui'); }
      },
      draw: function (ctx) {
        var x = 170, y = 60, w = 140, h = 150;
        panel(ctx, x, y, w, h, { title: 'Paused', animStitch: true });
        for (var i = 0; i < this.items.length; i++) {
          var label = this.items[i];
          if (label === 'Mute') label = G.Audio.muted ? 'Unmute' : 'Mute';
          if (button(ctx, { x: x + 14, y: y + 14 + i * 26, w: w - 28, h: 20, label: label, selected: i === this.sel })) {
            this.pick(i);
          }
        }
      },
      pick: function (i) {
        G.Audio.sfx('ui');
        if (i === 0) closeTop();
        else if (i === 1) { G.Save.save(); notify(G.Data.strings.misc.saved); }
        else if (i === 2) G.Audio.toggleMute();
        else if (i === 3) dialogue.open('Controls', [G.Data.strings.misc.controls]);
        else if (i === 4) { layers.length = 0; G.setScene('title'); }
      },
    };
    pushLayer(layer);
  }

  function confirm(text, onYes) {
    var layer = {
      kind: 'confirm', sel: 0,
      update: function (dt) {
        if (G.Input.pressed('ArrowLeft') || G.Input.pressed('ArrowRight')) this.sel = 1 - this.sel;
        if (G.Input.pressed('Enter') || G.Input.pressed('KeyE')) {
          var yes = this.sel === 0;
          closeTop();
          if (yes && onYes) onYes();
        }
      },
      draw: function (ctx) {
        var x = 140, y = 90, w = 200, h = 78;
        panel(ctx, x, y, w, h, { animStitch: true });
        G.Utils.text(ctx, text, x + w / 2, y + 14, { size: 12, align: 'center', color: P().outline, shadow: false });
        if (button(ctx, { x: x + 22, y: y + 42, w: 70, h: 20, label: 'Yes', selected: this.sel === 0 })) {
          closeTop(); if (onYes) onYes();
        }
        if (button(ctx, { x: x + 108, y: y + 42, w: 70, h: 20, label: 'No', selected: this.sel === 1 })) {
          closeTop();
        }
      },
    };
    pushLayer(layer);
  }

  function closeTop() {
    layers.pop();
    G.Audio.sfx('ui');
  }

  // =====================================================================
  // Toasts
  // =====================================================================

  function notify(text, opts) {
    opts = opts || {};
    toasts.push({ text: text, icon: opts.icon || null, t: opts.long ? 4.2 : 2.5, y: -16 });
    if (toasts.length > 4) toasts.shift();
  }

  // =====================================================================
  // HUD
  // =====================================================================

  function drawHUD(ctx) {
    var st = G.state;
    if (!st) return;
    // hearts
    for (var i = 0; i < st.player.maxHp; i++) {
      drawIcon(ctx, i < st.player.hp ? 'heart' : 'heart_empty', 8 + i * 10, 8);
    }
    // stamina
    drawIcon(ctx, 'bolt', 8, 19);
    ctx.fillStyle = P().outline;
    ctx.fillRect(18, 21, 52, 5);
    ctx.fillStyle = st.player.sta > 25 ? P().gold : P().crimson;
    ctx.fillRect(19, 22, Math.round(50 * st.player.sta / st.player.maxSta), 3);
    // gold + rep top-right
    var gx = G.W - 8;
    var goldStr = String(st.gold);
    G.Utils.text(ctx, goldStr, gx, 9, { size: 12, align: 'right', color: P().linen });
    drawIcon(ctx, 'coin', gx - goldStr.length * 6 - 12, 8);
    var repStr = String(st.rep);
    G.Utils.text(ctx, repStr, gx, 21, { size: 12, align: 'right', color: P().linen });
    drawIcon(ctx, 'rep', gx - repStr.length * 6 - 12, 20);
    // tier badge
    var tier = G.Data.tiers[st.tier];
    var badge = tier.name;
    var bw = badge.length * 5.4 + 10;
    ctx.fillStyle = P()[tier.color] || P().poorIndigo;
    ctx.fillRect(gx - bw, 32, bw, 11);
    ctx.fillStyle = P().outline;
    ctx.strokeStyle = P().outline;
    ctx.strokeRect(gx - bw + 0.5, 32.5, bw - 1, 10);
    G.Utils.text(ctx, badge, gx - bw / 2, 33, { size: 10, align: 'center', color: P().linen, shadow: false });
    // clock plaque
    ctx.fillStyle = P().bark1;
    ctx.fillRect(G.W / 2 - 34, 6, 68, 13);
    ctx.fillStyle = P().outline;
    ctx.strokeRect(G.W / 2 - 33.5, 6.5, 67, 12);
    G.Utils.text(ctx, 'Day ' + st.day + ' · ' + G.Time.clock(), G.W / 2, 8, { size: 12, align: 'center', color: P().linen, shadow: false });
    // quest hint
    var hint = G.Quests.progressText();
    if (hint) chip(ctx, hint, 8, G.H - 18, { color: P().gold });
    // context prompt
    if (G.UI.prompt) chip(ctx, G.UI.prompt, G.W / 2, G.H - 34, { align: 'center' });
  }

  // =====================================================================
  // Public API
  // =====================================================================

  G.UI = {
    prompt: null,
    _layers: layers, // debug/testing introspection



    panel: panel,
    button: button,
    drawIcon: drawIcon,
    notify: notify,
    confirm: confirm,
    dialogue: dialogue,

    modal: function () {
      return layers.length > 0 || dialogue.active;
    },

    crafting: { open: openCrafting },
    wardrobe: { open: openWardrobe },
    inventory: { open: openInventory },
    shopSell: { open: openShopSell },
    upgrades: { open: openUpgrades },
    pause: { open: openPause },
    sleepPrompt: function () {
      confirm(G.Data.strings.misc.sleepPrompt, function () { G.Time.sleep(); });
    },

    update: function (dt) {
      if (dialogue.active) {
        dialogue.update(dt);
      } else if (layers.length) {
        var top = layers[layers.length - 1];
        top.update(dt);
        if (G.Input.pressed('Escape') && !top.noEsc) closeTop();
      } else if (G.sceneName === 'world') {
        if (G.Input.pressed('Escape')) openPause();
        if (G.Input.pressed('KeyI')) openInventory();
      }
      // toasts
      for (var i = toasts.length - 1; i >= 0; i--) {
        var t = toasts[i];
        t.t -= dt;
        t.y = Math.min(0, t.y + dt * 120);
        if (t.t <= 0) toasts.splice(i, 1);
      }
    },

    draw: function (ctx) {
      if (G.sceneName === 'world' && G.state) drawHUD(ctx);
      for (var i = 0; i < layers.length; i++) {
        uiInteractive = (i === layers.length - 1) && !dialogue.active;
        layers[i].draw(ctx);
      }
      uiInteractive = true;
      dialogue.draw(ctx);
      // toasts on top
      var ty = 24;
      for (var k = 0; k < toasts.length; k++) {
        var t = toasts[k];
        var w = t.text.length * 6 + (t.icon ? 30 : 14);
        var x = (G.W - w) / 2, y = ty + t.y;
        ctx.fillStyle = 'rgba(42,31,43,0.88)';
        ctx.fillRect(x, y, w, 17);
        ctx.strokeStyle = P().gold;
        ctx.setLineDash([3, 2]);
        ctx.strokeRect(x + 1.5, y + 1.5, w - 3, 14);
        ctx.setLineDash([]);
        var tx = x + 7;
        if (t.icon) { drawIcon(ctx, t.icon, tx, y + 2); tx += 16; }
        G.Utils.text(ctx, t.text, tx, y + 3, { size: 12, color: P().linen, shadow: false });
        ty += 20;
      }
    },
  };

})();
