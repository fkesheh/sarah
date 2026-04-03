function render(ctx, canvas) {
  const w = canvas.width;
  const h = canvas.height;

  // Clear
  ctx.clearRect(0, 0, w, h);

  ctx.save();

  // Scale to fit logical size into canvas
  const scaleX = w / CFG.canvasWidth;
  const scaleY = h / CFG.canvasHeight;
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (w - CFG.canvasWidth * scale) / 2;
  const offsetY = (h - CFG.canvasHeight * scale) / 2;
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // Background
  drawBackground(ctx, CFG.canvasWidth, CFG.canvasHeight);

  // Draw poops
  for (const poop of gameState.poops) {
    drawPoop(ctx, poop.x, poop.y);
  }

  // Draw pet
  const petX = CFG.canvasWidth / 2;
  const petY = CFG.canvasHeight * 0.58;
  const anim = getCurrentAnim();
  const frame = getCurrentAnimFrame();

  if (gameState.isDead) {
    drawDeathScene(ctx, petX, petY, gameState.petType);
  } else if (gameState.stage === 'egg') {
    // Use totalAge to determine crack level
    const crackLevel = Math.min(3, Math.floor((gameState.totalAge / CFG.eggDurationMin) * 3));
    drawEgg(ctx, petX, petY, frame, gameState.petType, crackLevel);
  } else {
    drawPet(ctx, petX, petY, frame, gameState.petType, gameState.stage, anim);
  }

  // Draw active effects
  const now = Date.now();
  for (const effect of activeEffects) {
    const progress = (now - effect.startTime) / effect.duration;
    if (progress >= 1) continue;

    if (effect.type === 'hearts') {
      drawHearts(ctx, effect.x, effect.y, progress);
    } else if (effect.type === 'sparkles') {
      drawSparkles(ctx, effect.x, effect.y, progress);
    } else if (effect.type.startsWith('food_')) {
      drawFood(ctx, effect.x, effect.y, effect.type.replace('food_', ''));
    }
  }

  // Sleeping Zzz
  if (anim === 'sleeping') {
    drawZzz(ctx, petX + 30, petY - 40, frame);
  }

  ctx.restore();

  // Update HTML UI
  updateUI();
}

function updateUI() {
  // Egg hatch progress bar
  const eggRow = document.getElementById('eggProgressRow');
  if (eggRow) {
    if (gameState.stage === 'egg') {
      eggRow.style.display = 'flex';
      const progress = Math.min(100, (gameState.totalAge / CFG.eggDurationMin) * 100);
      setBarValue('eggBar', progress, '#FFA726');
    } else {
      eggRow.style.display = 'none';
    }
  }

  // Stage label
  const stageNames = { egg: '🥚 Ovo', baby: '🐣 Bebê', teen: '🌟 Jovem', adult: '👑 Adulto' };
  const stageEl = document.getElementById('stageLabel');
  if (stageEl) {
    stageEl.textContent = stageNames[gameState.stage] || '';
  }

  // Pet name
  const nameEl = document.getElementById('petNameLabel');
  if (nameEl) {
    nameEl.textContent = gameState.petName || '';
  }

  // Sick indicator
  const sickEl = document.getElementById('sickIndicator');
  if (sickEl) {
    sickEl.style.display = gameState.isSick ? 'block' : 'none';
  }

  // Show/hide action buttons vs death screen
  const actionsEl = document.getElementById('actions');
  const deathEl = document.getElementById('deathScreen');
  if (gameState.isDead) {
    if (actionsEl) actionsEl.style.display = 'none';
    if (deathEl) deathEl.style.display = 'flex';
  } else {
    if (actionsEl) actionsEl.style.display = 'flex';
    if (deathEl) deathEl.style.display = 'none';
  }
}

function setBarValue(id, value, color) {
  const bar = document.getElementById(id);
  if (!bar) return;
  const fill = bar.querySelector('.bar-fill');
  if (!fill) return;
  fill.style.width = Math.max(0, Math.min(100, value)) + '%';
  fill.style.backgroundColor = color;

  // Change color when low
  if (value < 20) {
    fill.style.backgroundColor = '#FF4444';
  } else if (value < 40) {
    fill.style.backgroundColor = '#FFA000';
  }
}
