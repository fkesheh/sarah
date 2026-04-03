let feedCooldown = 0;
let petCooldown = 0;
let activeEffects = [];

function initInput() {
  // Food buttons in action bar
  document.querySelectorAll('.food-option').forEach(btn => {
    btn.addEventListener('click', () => {
      doFeed(btn.dataset.food);
    });
  });
}

function doFeed(foodType) {
  if (gameState.isDead || gameState.stage === 'egg') return;
  if (feedCooldown > 0) return;
  if (gameState.hunger >= 100) return;

  const food = FOOD_TYPES[foodType];
  if (!food) return;

  gameState.hunger = Math.min(100, gameState.hunger + food.hunger);
  gameState.happiness = Math.min(100, gameState.happiness + food.happiness);
  gameState.cleanliness = Math.max(0, Math.min(100, gameState.cleanliness + food.cleanliness));

  feedCooldown = CFG.feedCooldownMs;

  queueAnimation('eating');
  addEffect('food_' + foodType, 160, 260, 1200);
  saveGame();
  updateButtonStates();
}

function doPet() {
  if (gameState.isDead || gameState.stage === 'egg') return;
  if (petCooldown > 0) return;

  gameState.happiness = Math.min(100, gameState.happiness + CFG.petAmount);
  petCooldown = CFG.petCooldownMs;

  if (gameState.isSick) {
    if (gameState.hunger >= CFG.sickHungerThreshold && gameState.cleanliness >= CFG.sickCleanlinessThreshold) {
      gameState.isSick = false;
      gameState.sickSinceTs = null;
    }
  }

  queueAnimation('happy');
  addEffect('hearts', 200, 140, 1500);
  saveGame();
  updateButtonStates();
}

function doClean() {
  if (gameState.isDead || gameState.stage === 'egg') return;
  if (gameState.poops.length === 0) return;

  gameState.poops = [];
  gameState.cleanliness = 100;

  if (gameState.isSick && gameState.hunger >= CFG.sickHungerThreshold) {
    gameState.isSick = false;
    gameState.sickSinceTs = null;
  }

  addEffect('sparkles', 200, 280, 1000);
  saveGame();
  updateButtonStates();
}

// Canvas click: clean poop or pet the animal
function handleCanvasClick(e) {
  if (gameState.isDead || gameState.stage === 'egg') return;

  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  // Transform to logical canvas coordinates (400x400)
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const canvasX = clickX * scaleX;
  const canvasY = clickY * scaleY;

  const scale = Math.min(canvas.width / CFG.canvasWidth, canvas.height / CFG.canvasHeight);
  const offsetX = (canvas.width - CFG.canvasWidth * scale) / 2;
  const offsetY = (canvas.height - CFG.canvasHeight * scale) / 2;
  const logicalX = (canvasX - offsetX) / scale;
  const logicalY = (canvasY - offsetY) / scale;

  // Check hit on any poop first (25px radius)
  const hitRadius = 25;
  for (let i = gameState.poops.length - 1; i >= 0; i--) {
    const poop = gameState.poops[i];
    const dx = logicalX - poop.x;
    const dy = logicalY - poop.y;
    if (dx * dx + dy * dy < hitRadius * hitRadius) {
      addEffect('sparkles', poop.x, poop.y, 800);
      gameState.poops.splice(i, 1);
      gameState.cleanliness = Math.min(100, gameState.cleanliness + 15);

      if (gameState.isSick && gameState.cleanliness >= CFG.sickCleanlinessThreshold && gameState.hunger >= CFG.sickHungerThreshold) {
        gameState.isSick = false;
        gameState.sickSinceTs = null;
      }

      saveGame();
      updateButtonStates();
      return;
    }
  }

  // Check hit on the pet (tap to pet)
  const petX = CFG.canvasWidth / 2;
  const petY = CFG.canvasHeight * 0.58;
  const petRadius = 75;
  const pdx = logicalX - petX;
  const pdy = logicalY - petY;
  if (pdx * pdx + pdy * pdy < petRadius * petRadius) {
    doPet();
  }
}

function addEffect(type, x, y, duration) {
  activeEffects.push({ type, x, y, startTime: Date.now(), duration });
}

function updateEffects() {
  const now = Date.now();
  activeEffects = activeEffects.filter(e => now - e.startTime < e.duration);
}

function updateCooldowns(dt) {
  if (feedCooldown > 0) feedCooldown = Math.max(0, feedCooldown - dt);
  if (petCooldown > 0) petCooldown = Math.max(0, petCooldown - dt);
}

function updateButtonStates() {
  const disabled = gameState.isDead || gameState.stage === 'egg';

  // Disable food buttons during cooldown or when full
  const foodDisabled = disabled || feedCooldown > 0 || gameState.hunger >= 100;
  document.querySelectorAll('.food-option').forEach(btn => {
    btn.disabled = foodDisabled;
  });
}
