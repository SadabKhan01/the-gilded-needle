'use strict';
// The Gilded Needle — master palette (from design/art.md §1). Orchestrator-owned.
window.G = window.G || {};

G.Palette = {
  // warm neutrals
  outline:    '#2a1f2b', // Warm Ink — universal outline, never pure black
  soot:       '#463a4b',
  taupe:      '#8c7f78',
  linen:      '#f3e5c8',
  parchment:  '#e6cfa3',
  // meadow (grass/foliage)
  meadow1: '#35592b', meadow2: '#4f7a3a', meadow3: '#7aa74f',
  // bark (earth/wood)
  bark1: '#5e3a22', bark2: '#8a5a33', bark3: '#b5824a',
  // stone
  stone1: '#4c4852', stone2: '#6f6a75', stone3: '#9a94a0',
  // river (water)
  river1: '#2e5d73', river2: '#4a86a0', river3: '#7fb7c7',
  // skin
  skin: '#f0c8a0', skinShade: '#c98a62',
  skinB: '#a9714b', skinBShade: '#7c4e33',
  // tier 1 — poor
  poorIndigo: '#5a6b8c', poorFade: '#8fa0b5', patchBrown: '#7a5c48',
  // tier 2 — middle
  marketGreen: '#5f8f4e', terracotta: '#c46a3f', terracottaPale: '#e09a6a',
  // tier 3 — noble
  plum: '#6d3a67', plumDeep: '#4a2748', silver: '#c0c3cf',
  // tier 4 — royal
  crimson: '#a32638', crimsonDeep: '#701a28', goldRegal: '#e0a933',
  // THE signature accent
  gold: '#f2c14e', // Thread Gold — stitch borders, sparkles, quest markers, perfect-stitch flash
};

// tier accents indexed by tier (0 = poor .. 3 = royal)
G.Palette.tierAccent = [G.Palette.poorIndigo, G.Palette.marketGreen, G.Palette.plum, G.Palette.crimson];
G.Palette.tierLight  = [G.Palette.poorFade, G.Palette.terracottaPale, G.Palette.silver, G.Palette.goldRegal];

G.Palette.ramp = function (name) {
  var P = G.Palette;
  return { meadow: [P.meadow1, P.meadow2, P.meadow3], bark: [P.bark1, P.bark2, P.bark3],
           stone: [P.stone1, P.stone2, P.stone3], river: [P.river1, P.river2, P.river3] }[name] || [P.taupe];
};
