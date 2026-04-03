let gameState = 'start';

let state = {};

function createFreshState() {
  return {
    day: 1,
    season: 0,
    year: 1,
    dayProgress: 0,
    timeSpeed: 1,
    totalDays: 0,
    money: CFG.startMoney,
    tiles: initGrid(),
    inventory: {},
    marketHistory: {},
    marketPrices: {},
    upgrades: {
      irrigation: 0,
      greenhouse: 0,
      tools: 0,
      silo: 0,
      market: 0,
    },
    weather: 'sunny',
    forecast: [],
    selectedTool: 'plow',
    selectedSeed: null,
    camX: 0,
    camY: 0,
    zoom: 1.0,
    achievements: {},
    tutorialStep: 0,
    tutorialDone: false,
    totalHarvested: 0,
    totalSold: 0,
    cropsHarvestedByType: {},
    survivedStorm: false,
  };
}

function initGrid() {
  const grid = [];
  for (let r = 0; r < CFG.gridH; r++) {
    grid[r] = [];
    for (let c = 0; c < CFG.gridW; c++) {
      grid[r][c] = createEmptyTile();
    }
  }
  const cx = Math.floor(CFG.gridW / 2);
  const cy = Math.floor(CFG.gridH / 2);
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      grid[cy + dr][cx + dc].type = 'plowed';
    }
  }
  return grid;
}

function createEmptyTile() {
  return {
    type: 'grass',
    crop: null,
    cropStage: 0,
    growthProgress: 0,
    irrigated: false,
    withering: false,
    witherDays: 0,
    quality: 0,
    deadCrop: null,
    deathCause: null,
  };
}

function getStorageCapacity() {
  let cap = CFG.startStorage;
  const lvl = state.upgrades.silo;
  for (let i = 0; i < lvl; i++) {
    cap += UPGRADE_DEFS.silo.levels[i].bonus;
  }
  return cap;
}

function getTotalInventory() {
  return Object.values(state.inventory).reduce((sum, v) => sum + v, 0);
}

function saveGame() {
  const saveData = {
    version: 1,
    timestamp: Date.now(),
    state: {
      day: state.day,
      season: state.season,
      year: state.year,
      dayProgress: state.dayProgress,
      timeSpeed: state.timeSpeed,
      totalDays: state.totalDays,
      money: state.money,
      tiles: state.tiles,
      inventory: state.inventory,
      marketHistory: state.marketHistory,
      upgrades: state.upgrades,
      weather: state.weather,
      forecast: state.forecast,
      achievements: state.achievements,
      totalHarvested: state.totalHarvested,
      totalSold: state.totalSold,
      cropsHarvestedByType: state.cropsHarvestedByType,
      tutorialDone: state.tutorialDone,
      survivedStorm: state.survivedStorm,
    },
  };
  try {
    localStorage.setItem(CFG.saveKey, JSON.stringify(saveData));
  } catch (e) { /* storage full */ }
}

function loadGame() {
  const raw = localStorage.getItem(CFG.saveKey);
  if (!raw) return false;
  try {
    const saveData = JSON.parse(raw);
    if (saveData.version === 1) {
      const fresh = createFreshState();
      Object.assign(state, fresh, saveData.state);
      return true;
    }
  } catch (e) { /* corrupt save */ }
  return false;
}

function resetGame() {
  localStorage.removeItem(CFG.saveKey);
  state = createFreshState();
}
