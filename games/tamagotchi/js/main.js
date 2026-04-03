let canvas, ctx;
let lastFrameTime = 0;
let autoSaveTimer = 0;
let gamePhase = 'loading'; // 'loading' | 'select' | 'playing' | 'dead'

function init() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Check for existing save
  if (loadGame()) {
    // Simulate offline time
    simulateOfflineTime();

    if (gameState.isDead) {
      gamePhase = 'dead';
    } else {
      gamePhase = 'playing';
      setAnimation(getDefaultAnim());
    }
    hideSelectScreen();
  } else {
    gamePhase = 'select';
    showSelectScreen();
  }

  initInput();

  // Canvas click to clean poops
  canvas.addEventListener('click', handleCanvasClick);
  initSelectScreen();

  // Auto-save on tab close
  window.addEventListener('beforeunload', () => {
    if (gamePhase === 'playing') {
      gameState.lastUpdateTs = Date.now();
      saveGame();
    }
  });

  // Start game loop
  lastFrameTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

function gameLoop(timestamp) {
  let dt = timestamp - lastFrameTime;
  lastFrameTime = timestamp;

  // Cap dt at 50ms to avoid huge jumps
  if (dt > 50) dt = 50;

  if (gamePhase === 'playing' || gamePhase === 'dead') {
    if (gamePhase === 'playing') {
      updateStats(dt);
      checkEvolution();
      updateCooldowns(dt);
      updateButtonStates();

      // Auto-save
      autoSaveTimer += dt;
      if (autoSaveTimer >= CFG.autoSaveIntervalMs) {
        autoSaveTimer = 0;
        gameState.lastUpdateTs = Date.now();
        saveGame();
      }

      // Check if pet just died
      if (gameState.isDead) {
        gamePhase = 'dead';
        setAnimation('dead');
        saveGame();
      }
    }

    updateAnimation(dt);
    updateEffects();
    render(ctx, canvas);
  }

  requestAnimationFrame(gameLoop);
}

// Pet selection screen
function initSelectScreen() {
  const petOptions = document.querySelectorAll('.pet-option');
  let selectedType = null;

  petOptions.forEach(option => {
    option.addEventListener('click', () => {
      petOptions.forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      selectedType = option.dataset.type;
      document.getElementById('btnAdopt').disabled = false;
    });
  });

  document.getElementById('btnAdopt').addEventListener('click', () => {
    const nameInput = document.getElementById('petNameInput');
    const name = nameInput.value.trim() || PET_TYPES[selectedType].name;

    if (!selectedType) return;

    adoptPet(selectedType, name);
  });

  // New pet button on death screen
  document.getElementById('btnNewPetDeath').addEventListener('click', () => {
    resetGame();
    gamePhase = 'select';
    showSelectScreen();
  });

  // Reset button
  document.getElementById('btnReset').addEventListener('click', () => {
    document.getElementById('confirmModal').style.display = 'flex';
  });

  document.getElementById('btnConfirmYes').addEventListener('click', () => {
    gamePhase = 'select';
    document.getElementById('confirmModal').style.display = 'none';
    resetGame();
    showSelectScreen();
    // Reset adopt button and selection
    document.getElementById('btnAdopt').disabled = true;
    document.querySelectorAll('.pet-option').forEach(o => o.classList.remove('selected'));
    document.getElementById('petNameInput').value = '';
  });

  document.getElementById('btnConfirmNo').addEventListener('click', () => {
    document.getElementById('confirmModal').style.display = 'none';
  });
}

function adoptPet(type, name) {
  resetGame();
  gameState.petType = type;
  gameState.petName = name;
  gameState.bornTs = Date.now();
  gameState.lastUpdateTs = Date.now();
  gameState.stage = 'egg';
  gameState.totalAge = 0;

  saveGame();
  hideSelectScreen();
  setAnimation('idle');
  gamePhase = 'playing';
}

function showSelectScreen() {
  document.getElementById('selectScreen').style.display = 'flex';
  document.getElementById('gameUI').style.display = 'none';
}

function hideSelectScreen() {
  document.getElementById('selectScreen').style.display = 'none';
  document.getElementById('gameUI').style.display = 'flex';
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
