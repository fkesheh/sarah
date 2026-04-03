function generateWeather() {
  var season = CFG.seasons[state.season];
  var roll = Math.random();
  var cumulative = 0;
  for (var type in WEATHER_TYPES) {
    cumulative += WEATHER_TYPES[type].probability[season];
    if (roll <= cumulative) return type;
  }
  return 'sunny';
}

function initWeather() {
  state.weather = generateWeather();
  state.forecast = [];
  for (let i = 0; i < 3; i++) {
    state.forecast.push(generateWeather());
  }
}

function advanceWeather() {
  if (state.forecast.length > 0) {
    state.weather = state.forecast.shift();
  } else {
    state.weather = generateWeather();
  }
  while (state.forecast.length < 3) {
    state.forecast.push(generateWeather());
  }

  applyWeatherEffects();
}

function applyWeatherEffects() {
  if (state.weather === 'rainy') {
    rainBonusGrowth();
  }
  if (state.weather === 'stormy') {
    rainBonusGrowth();
    applyStormDamage();
    state.survivedStorm = true;
  }
}

function rainBonusGrowth() {
  for (let r = 0; r < CFG.gridH; r++) {
    for (let c = 0; c < CFG.gridW; c++) {
      var tile = state.tiles[r][c];
      if (tile.crop && tile.cropStage < 4) {
        tile.growthProgress += 0.5;
      }
    }
  }
}

function applyStormDamage() {
  for (let r = 0; r < CFG.gridH; r++) {
    for (let c = 0; c < CFG.gridW; c++) {
      var tile = state.tiles[r][c];
      if (tile.crop && tile.cropStage > 0) {
        var inGH = isInGreenhouse(c, r);
        if (!inGH && Math.random() < 0.2) {
          if (tile.cropStage > 1) {
            tile.cropStage--;
            tile.growthProgress = 0;
          } else {
            tile.deadCrop = tile.crop;
            tile.deathCause = 'storm';
            tile.crop = null;
            tile.cropStage = 0;
            tile.growthProgress = 0;
            tile.type = 'dead';
            tile.withering = false;
            tile.witherDays = 0;
            tile.quality = 0;
            spawnParticles('death', c, r);
          }
        }
      }
    }
  }
}
