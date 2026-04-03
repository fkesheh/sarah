// Called once on load when a save exists
function simulateOfflineTime() {
  if (!gameState.lastUpdateTs) return;

  const now = Date.now();
  let elapsedMs = now - gameState.lastUpdateTs;

  // Cap at max offline hours
  const maxMs = CFG.maxOfflineHours * 3600000;
  if (elapsedMs > maxMs) elapsedMs = maxMs;
  if (elapsedMs < 60000) { // less than 1 minute, skip
    gameState.lastUpdateTs = now;
    return;
  }

  const elapsedMin = elapsedMs / 60000;
  const petDef = PET_TYPES[gameState.petType];
  if (!petDef) return;

  // Skip simulation for eggs (they just age)
  if (gameState.stage === 'egg') {
    gameState.totalAge += elapsedMin;
    checkEvolution();
    gameState.lastUpdateTs = now;
    return;
  }

  // 1. Hunger decay
  const hungerLost = elapsedMin * CFG.hungerDecayPerMin * petDef.hungerMod;
  gameState.hunger = Math.max(0, gameState.hunger - hungerLost);

  // 2. Happiness decay
  const happinessLost = elapsedMin * CFG.happinessDecayPerMin * petDef.happinessMod;
  gameState.happiness = Math.max(0, gameState.happiness - happinessLost);

  // 3. Poop accumulation
  const numNewPoops = Math.floor(elapsedMin / CFG.poopIntervalMin);
  for (let i = 0; i < numNewPoops && gameState.poops.length < CFG.maxPoops; i++) {
    gameState.poops.push({
      x: 50 + Math.random() * 300,
      y: 270 + Math.random() * 80,
      ts: gameState.lastUpdateTs + (i + 1) * CFG.poopIntervalMin * 60000,
    });
  }

  // 4. Cleanliness decay based on poops
  const avgPoops = (gameState.poops.length + Math.max(0, gameState.poops.length - numNewPoops)) / 2;
  const cleanlinessLost = elapsedMin * Math.max(avgPoops, 0.5) * CFG.cleanlinessDecayPerPoopPerMin;
  gameState.cleanliness = Math.max(0, gameState.cleanliness - cleanlinessLost);

  // 5. Evolution
  gameState.totalAge += elapsedMin;
  checkEvolution();

  // 6. Sickness check
  checkSickness(elapsedMin);

  gameState.lastUpdateTs = now;
}

// Real-time stat update, called each frame. dt in ms.
function updateStats(dt) {
  if (gameState.isDead) return;

  const dtMin = dt / 60000;

  // Age always increases (needed for egg hatch progress)
  gameState.totalAge += dtMin;

  // Eggs only age, no stat decay
  if (gameState.stage === 'egg') return;
  const petDef = PET_TYPES[gameState.petType];
  if (!petDef) return;

  // Decay stats
  gameState.hunger = Math.max(0, gameState.hunger - dtMin * CFG.hungerDecayPerMin * petDef.hungerMod);
  gameState.happiness = Math.max(0, gameState.happiness - dtMin * CFG.happinessDecayPerMin * petDef.happinessMod);

  // Cleanliness decays based on number of poops
  if (gameState.poops.length > 0) {
    const cleanDecay = dtMin * gameState.poops.length * CFG.cleanlinessDecayPerPoopPerMin;
    gameState.cleanliness = Math.max(0, gameState.cleanliness - cleanDecay);
  }

  // Poop timer
  if (!gameState._poopTimer) gameState._poopTimer = 0;
  gameState._poopTimer += dt;
  if (gameState._poopTimer >= CFG.poopIntervalMin * 60000) {
    gameState._poopTimer = 0;
    if (gameState.poops.length < CFG.maxPoops) {
      gameState.poops.push({
        x: 50 + Math.random() * 300,
        y: 270 + Math.random() * 80,
        ts: Date.now(),
      });
    }
  }

  // Check sickness every frame
  checkSicknessRealtime();
}

function checkEvolution() {
  const age = gameState.totalAge;
  let newStage = 'egg';

  if (age >= CFG.eggDurationMin + CFG.babyDurationMin + CFG.teenDurationMin) {
    newStage = 'adult';
  } else if (age >= CFG.eggDurationMin + CFG.babyDurationMin) {
    newStage = 'teen';
  } else if (age >= CFG.eggDurationMin) {
    newStage = 'baby';
  }

  if (newStage !== gameState.stage) {
    const oldStage = gameState.stage;
    gameState.stage = newStage;
    gameState.lastEvolutionTs = Date.now();

    if (oldStage === 'egg') {
      gameState.hatchedTs = Date.now();
    }

    // Trigger evolution animation if game is running
    if (typeof queueAnimation === 'function') {
      if (oldStage === 'egg') {
        queueAnimation('hatching');
      } else {
        queueAnimation('evolving');
      }
    }
  }
}

// Sickness check for offline simulation
function checkSickness(elapsedMin) {
  const isLowHunger = gameState.hunger < CFG.sickHungerThreshold;
  const isLowClean = gameState.cleanliness < CFG.sickCleanlinessThreshold;

  if (isLowHunger || isLowClean) {
    if (!gameState.isSick) {
      gameState.isSick = true;
      // Estimate when sickness started during offline period
      const hungerTimeToSick = isLowHunger ?
        Math.max(0, elapsedMin - (CFG.sickHungerThreshold / (CFG.hungerDecayPerMin * (PET_TYPES[gameState.petType]?.hungerMod || 1)))) : elapsedMin;
      gameState.sickSinceTs = Date.now() - (elapsedMin - hungerTimeToSick) * 60000;
    }

    // Check if sick long enough to die
    if (gameState.sickSinceTs) {
      const sickMin = (Date.now() - gameState.sickSinceTs) / 60000;
      if (sickMin >= CFG.sickDurationBeforeDeathMin) {
        gameState.isDead = true;
      }
    }
  } else {
    // Recovered
    gameState.isSick = false;
    gameState.sickSinceTs = null;
  }
}

// Real-time sickness check
function checkSicknessRealtime() {
  const isLowHunger = gameState.hunger < CFG.sickHungerThreshold;
  const isLowClean = gameState.cleanliness < CFG.sickCleanlinessThreshold;

  if (isLowHunger || isLowClean) {
    if (!gameState.isSick) {
      gameState.isSick = true;
      gameState.sickSinceTs = Date.now();
    } else if (gameState.sickSinceTs) {
      const sickMin = (Date.now() - gameState.sickSinceTs) / 60000;
      if (sickMin >= CFG.sickDurationBeforeDeathMin) {
        gameState.isDead = true;
      }
    }
  } else if (gameState.isSick) {
    gameState.isSick = false;
    gameState.sickSinceTs = null;
  }
}
