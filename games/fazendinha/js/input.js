var keysPressed = {};
var PAN_SPEED = 0.4;

let hoverTile = { col: -1, row: -1 };
let isPanning = false;
let panStartX = 0, panStartY = 0;
let panStartCamX = 0, panStartCamY = 0;
let pointerDown = false;
let pointerMoved = false;
let lastPointerX = 0, lastPointerY = 0;

function updateKeyboardPan(dt) {
  var dx = 0;
  var dy = 0;
  if (keysPressed['w'] || keysPressed['ArrowUp']) dy += 1;
  if (keysPressed['s'] || keysPressed['ArrowDown']) dy -= 1;
  if (keysPressed['a'] || keysPressed['ArrowLeft']) dx += 1;
  if (keysPressed['d'] || keysPressed['ArrowRight']) dx -= 1;

  if (dx !== 0 || dy !== 0) {
    var speed = PAN_SPEED * dt / state.zoom;
    state.camX += dx * speed;
    state.camY += dy * speed;
    clampCamera();
  }
}

function initInput() {
  const canvas = document.getElementById('gameCanvas');

  // Mouse events
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    lastPointerX = x;
    lastPointerY = y;

    if (isPanning) {
      state.camX = panStartCamX + (e.clientX - panStartX);
      state.camY = panStartCamY + (e.clientY - panStartY);
      pointerMoved = true;
      return;
    }

    hoverTile = screenToTile(x, y, state.camX, state.camY, state.zoom);
  });

  canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    pointerDown = true;
    pointerMoved = false;

    if (e.button === 1 || e.button === 2) {
      isPanning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      panStartCamX = state.camX;
      panStartCamY = state.camY;
      return;
    }
  });

  canvas.addEventListener('mouseup', (e) => {
    if (isPanning) {
      isPanning = false;
      pointerDown = false;
      return;
    }

    if (!pointerMoved && e.button === 0) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const tile = screenToTile(x, y, state.camX, state.camY, state.zoom);
      if (inBounds(tile.col, tile.row)) {
        applyCurrentTool(tile.col, tile.row);
      }
    }
    pointerDown = false;
  });

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.shiftKey) {
      state.camX -= e.deltaX * 0.5;
      state.camY -= e.deltaY * 0.5;
      clampCamera();
    } else {
      state.zoom = Math.max(CFG.minZoom, Math.min(CFG.maxZoom, state.zoom - e.deltaY * 0.001));
    }
  }, { passive: false });

  // Touch events
  let touchStartTime = 0;
  let touchCount = 0;
  let lastTouchDist = 0;

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchCount = e.touches.length;

    if (touchCount === 1) {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      lastPointerX = touch.clientX - rect.left;
      lastPointerY = touch.clientY - rect.top;
      panStartX = touch.clientX;
      panStartY = touch.clientY;
      panStartCamX = state.camX;
      panStartCamY = state.camY;
      pointerDown = true;
      pointerMoved = false;
      touchStartTime = Date.now();
    }

    if (touchCount === 2) {
      isPanning = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      panStartX = (t1.clientX + t2.clientX) / 2;
      panStartY = (t1.clientY + t2.clientY) / 2;
      panStartCamX = state.camX;
      panStartCamY = state.camY;
      lastTouchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();

    if (e.touches.length === 1 && !isPanning) {
      const touch = e.touches[0];
      const dx = touch.clientX - panStartX;
      const dy = touch.clientY - panStartY;

      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        isPanning = true;
        pointerMoved = true;
      }

      if (isPanning) {
        state.camX = panStartCamX + dx;
        state.camY = panStartCamY + dy;
      }

      const rect = canvas.getBoundingClientRect();
      lastPointerX = touch.clientX - rect.left;
      lastPointerY = touch.clientY - rect.top;
      hoverTile = screenToTile(lastPointerX, lastPointerY, state.camX, state.camY, state.zoom);
    }

    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const cx = (t1.clientX + t2.clientX) / 2;
      const cy = (t1.clientY + t2.clientY) / 2;
      state.camX = panStartCamX + (cx - panStartX);
      state.camY = panStartCamY + (cy - panStartY);

      var dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      if (lastTouchDist > 0) {
        var scale = dist / lastTouchDist;
        state.zoom = Math.max(CFG.minZoom, Math.min(CFG.maxZoom, state.zoom * scale));
      }
      lastTouchDist = dist;
    }
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();

    if (!pointerMoved && touchCount === 1 && !isPanning) {
      const tile = screenToTile(lastPointerX, lastPointerY, state.camX, state.camY, state.zoom);
      if (inBounds(tile.col, tile.row)) {
        applyCurrentTool(tile.col, tile.row);
      }
    }

    isPanning = false;
    pointerDown = false;
    touchCount = 0;
  }, { passive: false });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (gameState !== 'playing') return;

    switch (e.key) {
      case '1': selectTool('plow'); break;
      case '2': selectTool('plant'); break;
      case '3': selectTool('harvest'); break;
      case '4': selectTool('inspect'); break;
      case ' ': togglePause(); e.preventDefault(); break;
      case '+': case '=': setTimeSpeed(Math.min(3, state.timeSpeed + 1)); break;
      case '-': setTimeSpeed(Math.max(0, state.timeSpeed - 1)); break;
    }

    if (['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key) >= 0) {
      keysPressed[e.key] = true;
      e.preventDefault();
    }
  });

  document.addEventListener('keyup', (e) => {
    delete keysPressed[e.key];
  });

  window.addEventListener('blur', () => {
    keysPressed = {};
  });
}

function applyCurrentTool(col, row) {
  if (gameState !== 'playing') return;

  var cropDetailModal = document.getElementById('cropDetailModal');
  if (cropDetailModal && cropDetailModal.classList.contains('visible')) {
    hideCropDetail();
    return;
  }

  const targets = getToolTargetTiles(col, row);
  let success = false;

  for (const t of targets) {
    switch (state.selectedTool) {
      case 'plow':
        if (plowTile(t.col, t.row)) {
          spawnParticles('dirt', t.col, t.row);
          success = true;
        }
        break;
      case 'plant':
        if (state.selectedSeed) {
          if (plantCrop(t.col, t.row, state.selectedSeed)) {
            spawnParticles('plant', t.col, t.row);
            success = true;
          }
        }
        break;
      case 'harvest':
        if (harvestTile(t.col, t.row)) {
          spawnParticles('harvest', t.col, t.row);
          success = true;
        }
        break;
      case 'inspect':
        var inspectTile = state.tiles[t.row][t.col];
        if (inspectTile.crop || inspectTile.type === 'dead') {
          showCropDetail(t.col, t.row);
          success = true;
        }
        break;
    }
  }

  if (success) {
    updateUIState();
  }
}

function selectTool(tool) {
  state.selectedTool = tool;

  if (tool === 'plant' && !state.selectedSeed) {
    for (var key in CROPS) {
      if (state.money >= CROPS[key].seedCost) {
        state.selectedSeed = key;
        break;
      }
    }
  }

  updateToolbarUI();

  const seedSelector = document.getElementById('seedSelector');
  if (seedSelector) {
    seedSelector.classList.toggle('visible', tool === 'plant');
  }
}

function selectSeed(cropKey) {
  state.selectedSeed = cropKey;
  updateSeedSelectorUI();
}

function togglePause() {
  if (state.timeSpeed === 0) {
    state.timeSpeed = 1;
  } else {
    state.timeSpeed = 0;
  }
}

function clampCamera() {
  const canvas = document.getElementById('gameCanvas');
  const maxOffset = CFG.gridW * CFG.tileW;
  state.camX = Math.max(-maxOffset, Math.min(maxOffset, state.camX));
  state.camY = Math.max(-maxOffset / 2, Math.min(maxOffset, state.camY));
}

function centerCamera() {
  const canvas = document.getElementById('gameCanvas');
  const midCol = CFG.gridW / 2;
  const midRow = CFG.gridH / 2;
  const center = tileToScreen(midCol, midRow);
  state.camX = canvas.width / 2 - center.x;
  state.camY = canvas.height / 3 - center.y;
}
