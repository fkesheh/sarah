let lastTime = 0;
let autoSaveTimer = 0;
let canvas, ctx;
let minimapCanvas, minimapCtx;

function init() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  minimapCanvas = document.getElementById('minimapCanvas');
  minimapCtx = minimapCanvas.getContext('2d');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  state = createFreshState();

  const hasLoad = loadGame();

  if (!hasLoad) {
    initWeather();
    regenerateMarketPrices();
  } else {
    if (!state.marketPrices || Object.keys(state.marketPrices).length === 0) {
      regenerateMarketPrices();
    }
    if (!state.forecast || state.forecast.length === 0) {
      initWeather();
    }
  }

  initUI();
  initInput();

  centerCamera();

  gameState = 'start';
  const startScreen = document.getElementById('startScreen');
  if (startScreen) startScreen.style.display = 'flex';

  requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function startGame() {
  gameState = 'playing';
  const startScreen = document.getElementById('startScreen');
  if (startScreen) startScreen.style.display = 'none';

  centerCamera();
  updateUIState();

  if (!state.tutorialDone) {
    setTimeout(function () { initTutorial(); }, 300);
  }
}

function gameLoop(timestamp) {
  const dt = Math.min(timestamp - lastTime, 50);
  lastTime = timestamp;

  if (gameState === 'playing') {
    updateKeyboardPan(dt);
    updateTime(dt);
    updateParticles(dt);
    checkAchievements();
    updateUIState();

    autoSaveTimer += dt;
    if (autoSaveTimer >= CFG.autoSaveIntervalMs) {
      autoSaveTimer = 0;
      saveGame();
    }
  }

  render(timestamp);

  requestAnimationFrame(gameLoop);
}

window.addEventListener('beforeunload', () => {
  if (gameState === 'playing') {
    saveGame();
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
