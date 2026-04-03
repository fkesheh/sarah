var lightningFlash = 0;

function getCropPositions(count, hw, hh, seed) {
  var positions = [];
  var rows = Math.ceil(Math.sqrt(count));
  var cols = Math.ceil(count / rows);
  var idx = 0;
  for (var r = 0; r < rows && idx < count; r++) {
    var ry = -hh + (r + 0.5) * (2 * hh / rows);
    var widthAtY = hw * (1 - Math.abs(ry) / (hh + 2));
    var colsInRow = Math.min(cols, count - idx);
    for (var c = 0; c < colsInRow && idx < count; c++) {
      var rx = -widthAtY + (c + 0.5) * (2 * widthAtY / colsInRow);
      var jx = ((seed * 7 + idx * 13) % 5) - 2;
      var jy = ((seed * 11 + idx * 17) % 3) - 1;
      positions.push({ x: rx + jx, y: ry + jy });
      idx++;
    }
  }
  return positions;
}

function render(timestamp) {
  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawSky(ctx, canvas);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(state.zoom, state.zoom);
  ctx.translate(-canvas.width / 2 + state.camX, -canvas.height / 2 + state.camY);

  for (var r = 0; r < CFG.gridH; r++) {
    for (var c = 0; c < CFG.gridW; c++) {
      var pos = tileToScreen(c, r);
      var cx = pos.x;
      var cy = pos.y;

      drawTile(ctx, c, r, cx, cy);

      var tile = state.tiles[r][c];
      if (tile.crop) {
        drawCrop(ctx, c, r, cx, cy, tile, timestamp);
      }

      if (hoverTile.col === c && hoverTile.row === r && inBounds(c, r)) {
        drawHoverHighlight(ctx, cx, cy);
      }
    }
  }

  ctx.restore();

  drawWeatherOverlay(ctx, canvas, timestamp);
  drawNightOverlay(ctx, canvas);
  drawParticles(ctx);
  drawMinimap();
}

function drawSky(ctx, canvas) {
  var seasonKey = CFG.seasons[state.season];
  var colors = CFG.seasonColors[seasonKey];
  var daylight = getDaylightLevel();

  var skyHex = colors.sky;
  var skyR = parseInt(skyHex.slice(1, 3), 16);
  var skyG = parseInt(skyHex.slice(3, 5), 16);
  var skyB = parseInt(skyHex.slice(5, 7), 16);

  var nightFactor = daylight * 0.7 + 0.3;
  var topR = Math.floor(skyR * nightFactor);
  var topG = Math.floor(skyG * nightFactor);
  var topB = Math.floor(skyB * nightFactor);

  var botR = Math.floor(topR * 0.5);
  var botG = Math.floor(topG * 0.5);
  var botB = Math.floor(topB * 0.55);

  if (state.weather === 'stormy') {
    topR = Math.floor(topR * 0.5);
    topG = Math.floor(topG * 0.5);
    topB = Math.floor(topB * 0.55);
    botR = Math.floor(botR * 0.6);
    botG = Math.floor(botG * 0.6);
    botB = Math.floor(botB * 0.65);
  } else if (state.weather === 'rainy') {
    topR = Math.floor(topR * 0.7);
    topG = Math.floor(topG * 0.7);
    topB = Math.floor(topB * 0.75);
    botR = Math.floor(botR * 0.75);
    botG = Math.floor(botG * 0.75);
    botB = Math.floor(botB * 0.8);
  }

  var grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, 'rgb(' + topR + ',' + topG + ',' + topB + ')');
  grad.addColorStop(1, 'rgb(' + botR + ',' + botG + ',' + botB + ')');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawTile(ctx, col, row, cx, cy) {
  var tile = state.tiles[row][col];
  var hw = CFG.tileW / 2;
  var hh = CFG.tileH / 2;

  ctx.beginPath();
  ctx.moveTo(cx, cy - hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();

  var tileType = tile.type;
  if (tileType === 'grass') {
    var seasonKey = CFG.seasons[state.season];
    var colors = CFG.seasonColors[seasonKey];
    var hash = ((col * 7 + row * 13) % 17) / 17;
    var baseHex = hash > 0.5 ? colors.grass : colors.grassDark;
    var bR = parseInt(baseHex.slice(1, 3), 16);
    var bG = parseInt(baseHex.slice(3, 5), 16);
    var bB = parseInt(baseHex.slice(5, 7), 16);
    var variation = Math.floor(hash * 12) - 6;
    bR = Math.max(0, Math.min(255, bR + variation));
    bG = Math.max(0, Math.min(255, bG + variation));
    bB = Math.max(0, Math.min(255, bB + variation));
    ctx.fillStyle = 'rgb(' + bR + ',' + bG + ',' + bB + ')';
  } else if (tileType === 'plowed') {
    ctx.fillStyle = '#7a5c3a';
  } else if (tileType === 'dead') {
    ctx.fillStyle = '#5a4a3a';
  } else {
    ctx.fillStyle = '#6a4c2a';
  }
  ctx.fill();

  if (tileType === 'dead') {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy - hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();
    ctx.clip();
    ctx.strokeStyle = 'rgba(80,60,40,0.6)';
    ctx.lineWidth = 1.5;
    var seed = col * 7 + row * 13;
    var positions = getCropPositions(3, hw * 0.6, hh * 0.4, seed);
    for (var p = 0; p < positions.length; p++) {
      var sx = cx + positions[p].x;
      var sy = cy + positions[p].y - 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy + 4);
      ctx.lineTo(sx, sy - 2);
      ctx.lineTo(sx + 3, sy);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (tileType === 'plowed') {
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(60,40,20,0.25)';
    ctx.lineWidth = 1;
    for (var i = -3; i <= 3; i++) {
      var offset = i * 6;
      ctx.beginPath();
      ctx.moveTo(cx - hw + offset, cy - hh + offset * 0.5);
      ctx.lineTo(cx + hw + offset, cy + hh + offset * 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (isInGreenhouse(col, row)) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();
    ctx.fillStyle = 'rgba(200,255,200,0.1)';
    ctx.fill();
  }

  ctx.beginPath();
  ctx.moveTo(cx, cy - hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawCrop(ctx, col, row, cx, cy, tile, timestamp) {
  var cropDef = CROPS[tile.crop];
  if (!cropDef) return;

  var stage = tile.cropStage;
  var color = cropDef.color;
  var colorDark = cropDef.colorDark;
  var cropType = tile.crop;

  var quality = Math.min(100, Math.max(0, tile.quality || 0));

  if (tile.withering) {
    ctx.save();
    ctx.globalAlpha = 0.5;
  } else if (quality < 25 && stage > 0) {
    ctx.save();
    ctx.globalAlpha = 0.6;
  }

  var baseY = cy - 2;

  if (stage === 0) {
    drawSeedStage(ctx, cx, baseY, col, row);
  } else if (stage === 1) {
    drawSproutStage(ctx, cx, baseY, col, row);
  } else if (stage === 2) {
    drawGrowingStage(ctx, cx, baseY, color, colorDark, col, row);
  } else if (stage === 3) {
    drawMatureStage(ctx, cx, baseY, color, colorDark, cropType, timestamp, col, row);
  } else if (stage === 4) {
    drawHarvestableStage(ctx, cx, baseY, color, colorDark, cropType, timestamp, col, row);
  }

  if (tile.withering) {
    ctx.restore();
  } else if (quality < 25 && stage > 0) {
    ctx.restore();
  }

  if (quality > 75 && stage >= 3) {
    var sparklePhase = (timestamp / 400 + col * 3 + row * 7) % (Math.PI * 2);
    var sparkleAlpha = 0.15 + Math.sin(sparklePhase) * 0.15;
    ctx.fillStyle = 'rgba(255,215,0,' + sparkleAlpha + ')';
    ctx.beginPath();
    ctx.arc(cx, cy - 6, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSeedStage(ctx, cx, baseY, col, row) {
  var seed = col * 7 + row * 13;
  var positions = getCropPositions(9, 18, 8, seed);
  ctx.fillStyle = '#8B6914';
  for (var i = 0; i < positions.length; i++) {
    ctx.beginPath();
    ctx.arc(cx + positions[i].x, baseY + positions[i].y + 1, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSproutStage(ctx, cx, baseY, col, row) {
  var seed = col * 7 + row * 13;
  var positions = getCropPositions(7, 16, 7, seed);
  for (var i = 0; i < positions.length; i++) {
    var sx = cx + positions[i].x;
    var sy = baseY + positions[i].y;
    ctx.strokeStyle = '#3a8a2a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, sy + 2);
    ctx.lineTo(sx, sy - 3);
    ctx.stroke();
    ctx.fillStyle = '#50b030';
    ctx.beginPath();
    ctx.ellipse(sx + 1.5, sy - 3, 1.5, 1, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGrowingStage(ctx, cx, baseY, color, colorDark, col, row) {
  var seed = col * 7 + row * 13;
  var positions = getCropPositions(6, 16, 7, seed);
  for (var i = 0; i < positions.length; i++) {
    var sx = cx + positions[i].x;
    var sy = baseY + positions[i].y;
    ctx.strokeStyle = '#3a7a2a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy + 2);
    ctx.lineTo(sx, sy - 6);
    ctx.stroke();
    ctx.fillStyle = '#48a030';
    ctx.beginPath();
    ctx.ellipse(sx - 2, sy - 3, 2, 1, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx + 2, sy - 5, 2, 1, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colorDark;
    ctx.beginPath();
    ctx.arc(sx, sy - 6, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMatureStage(ctx, cx, baseY, color, colorDark, cropType, timestamp, col, row) {
  var sway = Math.sin(timestamp * 0.002 + cx * 0.1) * 0.5;
  if (cropType === 'wheat' || cropType === 'corn') {
    drawTallStalks(ctx, cx, baseY, color, colorDark, sway, cropType, col, row);
  } else if (cropType === 'tomato' || cropType === 'strawberry') {
    drawBushyFruits(ctx, cx, baseY, color, colorDark, sway, 3, col, row);
  } else if (cropType === 'carrot' || cropType === 'potato') {
    drawLowLeafy(ctx, cx, baseY, color, colorDark, sway, false, col, row);
  } else if (cropType === 'sunflower') {
    drawSunflower(ctx, cx, baseY, color, colorDark, sway, false, col, row);
  } else if (cropType === 'lettuce') {
    drawLettuce(ctx, cx, baseY, color, colorDark, sway, false, col, row);
  } else {
    drawTallStalks(ctx, cx, baseY, color, colorDark, sway, cropType, col, row);
  }
}

function drawHarvestableStage(ctx, cx, baseY, color, colorDark, cropType, timestamp, col, row) {
  var sway = Math.sin(timestamp * 0.003 + col + row) * 1.2;

  if (cropType === 'wheat' || cropType === 'corn') {
    drawTallStalks(ctx, cx, baseY, color, colorDark, sway, cropType, col, row);
  } else if (cropType === 'tomato' || cropType === 'strawberry') {
    drawBushyFruits(ctx, cx, baseY, color, colorDark, sway, 4, col, row);
  } else if (cropType === 'carrot' || cropType === 'potato') {
    drawLowLeafy(ctx, cx, baseY, color, colorDark, sway, true, col, row);
  } else if (cropType === 'sunflower') {
    drawSunflower(ctx, cx, baseY, color, colorDark, sway, true, col, row);
  } else if (cropType === 'lettuce') {
    drawLettuce(ctx, cx, baseY, color, colorDark, sway, true, col, row);
  } else {
    drawTallStalks(ctx, cx, baseY, color, colorDark, sway, cropType, col, row);
  }

  var sparkleY = baseY - 24 + Math.sin(timestamp * 0.005 + col * 3 + row * 5) * 3;
  var sparkleAlpha = 0.6 + Math.sin(timestamp * 0.008 + col) * 0.4;
  ctx.save();
  ctx.globalAlpha = sparkleAlpha;
  ctx.fillStyle = '#FFD700';
  var ss = 3;
  ctx.beginPath();
  ctx.moveTo(cx, sparkleY - ss);
  ctx.lineTo(cx + ss * 0.35, sparkleY - ss * 0.35);
  ctx.lineTo(cx + ss, sparkleY);
  ctx.lineTo(cx + ss * 0.35, sparkleY + ss * 0.35);
  ctx.lineTo(cx, sparkleY + ss);
  ctx.lineTo(cx - ss * 0.35, sparkleY + ss * 0.35);
  ctx.lineTo(cx - ss, sparkleY);
  ctx.lineTo(cx - ss * 0.35, sparkleY - ss * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTallStalks(ctx, cx, baseY, color, colorDark, sway, cropType, col, row) {
  var seed = col * 7 + row * 13;
  var positions = getCropPositions(5, 14, 6, seed);
  var height = cropType === 'corn' ? 14 : 12;

  for (var i = 0; i < positions.length; i++) {
    var sx = cx + positions[i].x + sway;
    var sy = baseY + positions[i].y;
    var topY = sy - height;

    ctx.strokeStyle = '#3a7a2a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx - sway, sy + 2);
    ctx.quadraticCurveTo(sx - sway * 0.5, sy - height * 0.5, sx, topY);
    ctx.stroke();

    ctx.fillStyle = '#48a030';
    ctx.beginPath();
    ctx.ellipse(sx - 3, sy - 4, 3, 1.2, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx + 3, sy - 7, 3, 1.2, 0.4, 0, Math.PI * 2);
    ctx.fill();

    if (cropType === 'corn') {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(sx, topY + 1, 2, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colorDark;
      ctx.beginPath();
      ctx.ellipse(sx, topY + 1, 1.2, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(sx, topY, 2, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colorDark;
      ctx.lineWidth = 0.5;
      for (var a = 0; a < 3; a++) {
        var angle = (a / 3) * Math.PI - Math.PI * 0.5;
        ctx.beginPath();
        ctx.moveTo(sx, topY - 2);
        ctx.lineTo(sx + Math.cos(angle) * 2, topY - 3 + Math.sin(angle) * 1);
        ctx.stroke();
      }
    }
  }
}

function drawBushyFruits(ctx, cx, baseY, color, colorDark, sway, fruitCount, col, row) {
  var seed = col * 7 + row * 13;
  var positions = getCropPositions(3, 12, 5, seed);

  for (var p = 0; p < positions.length; p++) {
    var bx = cx + positions[p].x + sway * 0.5;
    var by = baseY + positions[p].y;

    ctx.fillStyle = '#3a8a2a';
    ctx.beginPath();
    ctx.ellipse(bx, by - 3, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#48a030';
    ctx.beginPath();
    ctx.ellipse(bx - 1, by - 4, 3, 2, -0.2, 0, Math.PI * 2);
    ctx.fill();

    var fc = Math.min(fruitCount > 3 ? 2 : 1, 2);
    var fruitOffsets = [{ x: -2, y: -2 }, { x: 2, y: -3 }];
    for (var f = 0; f < fc; f++) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(bx + fruitOffsets[f].x, by + fruitOffsets[f].y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#2a6a1a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, by + 2);
    ctx.lineTo(bx, by - 1);
    ctx.stroke();
  }
}

function drawLowLeafy(ctx, cx, baseY, color, colorDark, sway, full, col, row) {
  var seed = col * 7 + row * 13;
  var positions = getCropPositions(full ? 5 : 4, 14, 6, seed);

  for (var p = 0; p < positions.length; p++) {
    var lx = cx + positions[p].x + sway * 0.3;
    var ly = baseY + positions[p].y;
    var leafCount = full ? 4 : 3;
    var spread = full ? 4 : 3;

    for (var i = 0; i < leafCount; i++) {
      var angle = (i / leafCount) * Math.PI * 2;
      var px = lx + Math.cos(angle) * spread;
      var py = ly - 2 + Math.sin(angle) * 1.2;
      ctx.fillStyle = i % 2 === 0 ? '#48a030' : '#3a8a2a';
      ctx.beginPath();
      ctx.ellipse(px, py, 2.5, 1.2, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#50b838';
    ctx.beginPath();
    ctx.ellipse(lx, ly - 2, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    if (full) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(lx, ly + 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSunflower(ctx, cx, baseY, color, colorDark, sway, full, col, row) {
  var seed = col * 7 + row * 13;
  var positions = getCropPositions(3, 12, 5, seed);

  for (var p = 0; p < positions.length; p++) {
    var fx = cx + positions[p].x;
    var fy = baseY + positions[p].y;
    var stemH = full ? 16 : 13;
    var topY = fy - stemH;

    ctx.strokeStyle = '#3a7a2a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fx, fy + 2);
    ctx.quadraticCurveTo(fx + sway * 0.3, fy - stemH * 0.5, fx + sway, topY);
    ctx.stroke();

    ctx.fillStyle = '#48a030';
    ctx.beginPath();
    ctx.ellipse(fx - 3, fy - 4, 3, 1.2, -0.5, 0, Math.PI * 2);
    ctx.fill();

    var headX = fx + sway;
    var headY = topY;
    var petalCount = full ? 8 : 6;
    var petalR = full ? 4 : 3;

    for (var pe = 0; pe < petalCount; pe++) {
      var a = (pe / petalCount) * Math.PI * 2;
      var px = headX + Math.cos(a) * petalR;
      var py = headY + Math.sin(a) * petalR * 0.7;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(px, py, 2, 1, a, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = colorDark;
    ctx.beginPath();
    ctx.arc(headX, headY, full ? 2.5 : 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLettuce(ctx, cx, baseY, color, colorDark, sway, full, col, row) {
  var seed = col * 7 + row * 13;
  var positions = getCropPositions(full ? 5 : 4, 14, 6, seed);

  for (var p = 0; p < positions.length; p++) {
    var lx = cx + positions[p].x + sway * 0.2;
    var ly = baseY + positions[p].y;
    var radius = full ? 4.5 : 3.5;
    var layers = full ? 3 : 2;

    for (var l = layers; l >= 1; l--) {
      var r = radius * (l / layers);
      ctx.fillStyle = l % 2 === 0 ? color : colorDark;
      ctx.beginPath();
      ctx.ellipse(lx, ly - 2 - l * 0.3, r, r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#90e870';
    ctx.beginPath();
    ctx.arc(lx, ly - 3, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHoverHighlight(ctx, cx, cy) {
  var hw = CFG.tileW / 2;
  var hh = CFG.tileH / 2;

  ctx.beginPath();
  ctx.moveTo(cx, cy - hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();

  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fill();

  ctx.strokeStyle = 'rgba(200,255,200,0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawNightOverlay(ctx, canvas) {
  var daylight = getDaylightLevel();
  var alpha = (1 - daylight) * 0.4;
  if (alpha <= 0.005) return;

  ctx.fillStyle = 'rgba(0,0,30,' + alpha.toFixed(3) + ')';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawWeatherOverlay(ctx, canvas, timestamp) {
  if (state.weather === 'stormy') {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (lightningFlash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + (lightningFlash * 0.3).toFixed(3) + ')';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      lightningFlash -= 0.05;
    } else if (Math.random() < 0.005) {
      lightningFlash = 1;
    }
  } else if (state.weather === 'drought') {
    ctx.fillStyle = 'rgba(200,150,0,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (state.weather === 'cloudy') {
    ctx.fillStyle = 'rgba(100,100,100,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawMinimap() {
  var mmCanvas = document.getElementById('minimapCanvas');
  if (!mmCanvas) return;
  var mmCtx = mmCanvas.getContext('2d');

  var mw = mmCanvas.width;
  var mh = mmCanvas.height;

  mmCtx.clearRect(0, 0, mw, mh);

  mmCtx.fillStyle = 'rgba(0,0,0,0.6)';
  mmCtx.fillRect(0, 0, mw, mh);

  var tileW = mw / CFG.gridW;
  var tileH = mh / CFG.gridH;
  var seasonKey = CFG.seasons[state.season];
  var seasonGrass = CFG.seasonColors[seasonKey].grass;

  for (var r = 0; r < CFG.gridH; r++) {
    for (var c = 0; c < CFG.gridW; c++) {
      var tile = state.tiles[r][c];
      var mx = c * tileW;
      var my = r * tileH;

      if (tile.type === 'grass') {
        mmCtx.fillStyle = seasonGrass;
      } else if (tile.type === 'plowed') {
        mmCtx.fillStyle = '#7a5c3a';
      } else if (tile.type === 'dead') {
        mmCtx.fillStyle = '#4a3a2a';
      } else if (tile.crop && CROPS[tile.crop]) {
        mmCtx.fillStyle = CROPS[tile.crop].color;
      } else {
        mmCtx.fillStyle = '#6a4c2a';
      }

      mmCtx.fillRect(mx, my, tileW, tileH);
    }
  }

  var gameCanvas = document.getElementById('gameCanvas');
  var worldW = CFG.gridW * CFG.tileW;
  var worldH = CFG.gridH * CFG.tileH;

  var vpLeft = -state.camX;
  var vpTop = -state.camY;
  var vpW = gameCanvas.width;
  var vpH = gameCanvas.height;

  var totalIsoW = (CFG.gridW + CFG.gridH) * (CFG.tileW / 2);
  var totalIsoH = (CFG.gridW + CFG.gridH) * (CFG.tileH / 2);

  var isoOriginX = -CFG.gridH * (CFG.tileW / 2);
  var isoOriginY = 0;

  var normLeft = (vpLeft - isoOriginX) / totalIsoW;
  var normTop = (vpTop - isoOriginY) / totalIsoH;
  var normW = vpW / totalIsoW;
  var normH = vpH / totalIsoH;

  mmCtx.strokeStyle = 'rgba(255,255,255,0.8)';
  mmCtx.lineWidth = 1.5;
  mmCtx.strokeRect(
    normLeft * mw,
    normTop * mh,
    normW * mw,
    normH * mh
  );

  mmCtx.strokeStyle = 'rgba(255,255,255,0.3)';
  mmCtx.lineWidth = 1;
  mmCtx.strokeRect(0, 0, mw, mh);
}
