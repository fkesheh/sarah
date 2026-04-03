function tileToScreen(col, row) {
  const px = (col - row) * (CFG.tileW / 2);
  const py = (col + row) * (CFG.tileH / 2);
  return { x: px, y: py };
}

function screenToTile(px, py, camX, camY, zoom) {
  zoom = zoom || 1;
  var cvs = document.getElementById('gameCanvas');
  var wx = (px - cvs.width / 2) / zoom + cvs.width / 2 - camX;
  var wy = (py - cvs.height / 2) / zoom + cvs.height / 2 - camY;
  var col = (wx / (CFG.tileW / 2) + wy / (CFG.tileH / 2)) / 2;
  var row = (wy / (CFG.tileH / 2) - wx / (CFG.tileW / 2)) / 2;
  return { col: Math.floor(col), row: Math.floor(row) };
}

function inBounds(col, row) {
  return col >= 0 && col < CFG.gridW && row >= 0 && row < CFG.gridH;
}

function tileDistance(c1, r1, c2, r2) {
  return Math.abs(c1 - c2) + Math.abs(r1 - r2);
}

function getAdjacentTiles(col, row, range) {
  const tiles = [];
  for (let dr = -range; dr <= range; dr++) {
    for (let dc = -range; dc <= range; dc++) {
      if (dc === 0 && dr === 0) continue;
      const nc = col + dc;
      const nr = row + dr;
      if (inBounds(nc, nr)) tiles.push({ col: nc, row: nr });
    }
  }
  return tiles;
}
