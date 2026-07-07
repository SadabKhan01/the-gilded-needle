'use strict';
// The Gilded Needle — boot. Owned by the orchestrator; module init order matters.
window.addEventListener('load', function () {
  try {
    G.Engine.init('game');
    G.Sprites.init();
    G.Tiles.init();
    G.Maps.init();
    G.Audio.init();
    G.setScene('title');
    G.Engine.start();
  } catch (err) {
    console.error('Boot failed:', err);
    var c = document.getElementById('game');
    if (c) {
      var x = c.getContext('2d');
      x.fillStyle = '#2a1f2b';
      x.fillRect(0, 0, 480, 270);
      x.fillStyle = '#e8d5b0';
      x.font = '12px monospace';
      x.fillText('Boot error — see console: ' + err.message, 12, 40);
    }
  }
});
