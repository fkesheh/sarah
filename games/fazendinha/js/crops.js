function processTileEndOfDay(tile, row, col) {
  if (!tile.crop) return;

  var cropDef = CROPS[tile.crop];
  var season = CFG.seasons[state.season];
  var inGH = isInGreenhouse(col, row);
  var inSeason = cropDef.seasons.includes(season) || inGH;

  if (!inSeason) {
    tile.withering = true;
  } else {
    tile.withering = false;
  }

  if (inSeason && !tile.withering && tile.cropStage < 4) {
    var bonus = tile.irrigated ? 1.5 : 1;
    tile.growthProgress += bonus;
    var daysPerStage = cropDef.growthDays / 4;
    if (tile.growthProgress >= daysPerStage) {
      tile.growthProgress = 0;
      tile.cropStage++;
    }
  }

  var envScore = 0.7;
  if (cropDef.seasons.includes(season)) envScore += 0.15;
  if (tile.irrigated) envScore += (cropDef.irrigationMod || 0.08);
  if (inGH) envScore += (cropDef.greenhouseMod || 0.05);
  var wMods = cropDef.weatherMods;
  if (wMods && wMods[state.weather] !== undefined) {
    envScore += wMods[state.weather];
  }
  envScore = Math.min(1, Math.max(0.1, envScore));

  var growthPerDay = tile.irrigated ? 1.5 : 1;
  var expectedDays = cropDef.growthDays / growthPerDay;
  var maxDaily = Math.pow(100, 1 / expectedDays);
  tile.quality = Math.min(100, Math.max(0, (tile.quality || 1) * maxDaily * envScore));

  if (tile.withering) {
    tile.witherDays = (tile.witherDays || 0) + 1;
    if (tile.witherDays > 5) {
      tile.deadCrop = tile.crop;
      tile.deathCause = 'wither';
      tile.crop = null;
      tile.cropStage = 0;
      tile.growthProgress = 0;
      tile.type = 'dead';
      tile.withering = false;
      tile.witherDays = 0;
      tile.quality = 0;
    }
  } else {
    tile.witherDays = 0;
  }

  applyIrrigation(col, row);
}

function isInGreenhouse(col, row) {
  var level = state.upgrades.greenhouse;
  if (level <= 0) return false;
  var range = UPGRADE_DEFS.greenhouse.levels[level - 1].range;
  var cx = Math.floor(CFG.gridW / 2);
  var cy = Math.floor(CFG.gridH / 2);
  return Math.abs(col - cx) <= range && Math.abs(row - cy) <= range;
}

function applyIrrigation(col, row) {
  var level = state.upgrades.irrigation;
  var tile = state.tiles[row][col];
  if (level <= 0) {
    tile.irrigated = false;
    return;
  }
  var range = UPGRADE_DEFS.irrigation.levels[level - 1].range;

  var cx = Math.floor(CFG.gridW / 2);
  var cy = Math.floor(CFG.gridH / 2);

  tile.irrigated = range >= 99 || (Math.abs(col - cx) <= range && Math.abs(row - cy) <= range);
}

function plantCrop(col, row, cropKey) {
  if (!inBounds(col, row)) return false;
  var tile = state.tiles[row][col];
  if (tile.type !== 'plowed' || tile.crop) return false;

  var cropDef = CROPS[cropKey];
  if (!cropDef) return false;
  if (state.money < cropDef.seedCost) return false;

  state.money -= cropDef.seedCost;
  tile.type = 'planted';
  tile.crop = cropKey;
  tile.cropStage = 0;
  tile.growthProgress = 0;
  tile.withering = false;
  tile.witherDays = 0;
  tile.quality = 1;
  return true;
}

function plowTile(col, row) {
  if (!inBounds(col, row)) return false;
  var tile = state.tiles[row][col];
  if (tile.type === 'dead') {
    tile.type = 'plowed';
    tile.deadCrop = null;
    tile.deathCause = null;
    return true;
  }
  if (tile.type !== 'grass') return false;
  tile.type = 'plowed';
  return true;
}

function harvestTile(col, row) {
  if (!inBounds(col, row)) return false;
  var tile = state.tiles[row][col];
  if (!tile.crop || tile.cropStage < 4) return false;

  var cropKey = tile.crop;
  var quality = Math.round(Math.min(100, Math.max(0, tile.quality || 0)));
  var qualityMultiplier = 0.5 + (quality / 100) * 1.5;
  var price = Math.max(1, Math.round(getMarketPrice(cropKey) * qualityMultiplier));
  state.money += price;
  state.totalSold += price;
  state.totalHarvested++;
  state.cropsHarvestedByType[cropKey] = (state.cropsHarvestedByType[cropKey] || 0) + 1;

  if (!state.marketHistory[cropKey]) state.marketHistory[cropKey] = [];
  state.marketHistory[cropKey].push(1);
  if (state.marketHistory[cropKey].length > 10) state.marketHistory[cropKey].shift();

  var season = CFG.seasons[state.season];
  state.marketPrices[cropKey] = calculateCropPrice(cropKey, CROPS[cropKey], season);

  tile.type = 'plowed';
  tile.crop = null;
  tile.cropStage = 0;
  tile.growthProgress = 0;
  tile.withering = false;
  tile.witherDays = 0;
  tile.quality = 0;

  return true;
}

function getToolTargetTiles(col, row) {
  var targets = [{ col: col, row: row }];
  var level = state.upgrades.tools;
  if (level <= 0) return targets;

  var def = UPGRADE_DEFS.tools.levels[level - 1];
  if (def.multi === 'row') {
    for (let c = 0; c < CFG.gridW; c++) {
      if (c !== col) targets.push({ col: c, row: row });
    }
  } else {
    var adj = getAdjacentTiles(col, row, 1);
    for (let i = 0; i < def.multi - 1 && i < adj.length; i++) {
      targets.push(adj[i]);
    }
  }
  return targets;
}
