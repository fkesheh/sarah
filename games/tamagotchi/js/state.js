// Fresh state factory
function createFreshState() {
  return {
    petType: null,
    petName: '',
    stage: 'egg',
    hunger: 100,
    happiness: 100,
    cleanliness: 100,
    isSick: false,
    sickSinceTs: null,
    isDead: false,
    bornTs: null,
    hatchedTs: null,
    lastEvolutionTs: null,
    poops: [],          // [{x, y, ts}]
    lastUpdateTs: null,
    totalAge: 0,        // real minutes alive
  };
}

let gameState = createFreshState();

function saveGame() {
  try {
    const data = {
      version: 1,
      timestamp: Date.now(),
      state: gameState,
    };
    localStorage.setItem(CFG.saveKey, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save:', e);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(CFG.saveKey);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data && data.state) {
      gameState = data.state;
      return true;
    }
  } catch (e) {
    console.warn('Failed to load:', e);
  }
  return false;
}

function hasExistingSave() {
  return localStorage.getItem(CFG.saveKey) !== null;
}

function resetGame() {
  localStorage.removeItem(CFG.saveKey);
  gameState = createFreshState();
}
