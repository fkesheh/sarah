function updateTime(dt) {
  if (state.timeSpeed === 0) return;

  const advance = (dt / CFG.dayDurationMs) * state.timeSpeed;
  state.dayProgress += advance;

  while (state.dayProgress >= 1) {
    state.dayProgress -= 1;
    advanceDay();
  }
}

function advanceDay() {
  state.day++;
  state.totalDays++;

  for (let r = 0; r < CFG.gridH; r++) {
    for (let c = 0; c < CFG.gridW; c++) {
      processTileEndOfDay(state.tiles[r][c], r, c);
    }
  }

  advanceWeather();

  regenerateMarketPrices();

  if (state.day > CFG.daysPerSeason) {
    state.day = 1;
    state.season = (state.season + 1) % 4;
    if (state.season === 0) state.year++;
    onSeasonChange();
  }

  saveGame();
}

function onSeasonChange() {
  var season = CFG.seasons[state.season];
  for (let r = 0; r < CFG.gridH; r++) {
    for (let c = 0; c < CFG.gridW; c++) {
      var tile = state.tiles[r][c];
      if (tile.crop && tile.cropStage > 0) {
        var cropDef = CROPS[tile.crop];
        var inGreenhouse = isInGreenhouse(c, r);
        if (!cropDef.seasons.includes(season) && !inGreenhouse) {
          tile.withering = true;
        }
      }
    }
  }
}

function getDaylightLevel() {
  var t = state.dayProgress;
  if (t < 0.1) return 0.3 + (t / 0.1) * 0.7;
  if (t < 0.6) return 1.0;
  if (t < 0.75) return 1.0 - ((t - 0.6) / 0.15) * 0.7;
  if (t < 0.9) return 0.3;
  return 0.3 + ((t - 0.9) / 0.1) * 0.7;
}

function setTimeSpeed(speed) {
  state.timeSpeed = speed;
}
