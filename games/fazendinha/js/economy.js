function regenerateMarketPrices() {
  var season = CFG.seasons[state.season];
  for (var key in CROPS) {
    state.marketPrices[key] = calculateCropPrice(key, CROPS[key], season);
  }
}

function calculateCropPrice(cropKey, cropDef, season) {
  var price = cropDef.sellBase;

  if (cropDef.seasons.includes(season)) {
    price *= 1.2;
  } else {
    price *= 0.8;
  }

  var history = state.marketHistory[cropKey] || [];
  var recentSales = history.reduce(function (sum, v) { return sum + v; }, 0);
  var demandFactor = Math.max(0.5, 1 - recentSales * 0.02);
  price *= demandFactor;

  var marketLevel = state.upgrades.market;
  if (marketLevel > 0) {
    price *= (1 + UPGRADE_DEFS.market.levels[marketLevel - 1].bonus);
  }

  price *= (0.9 + Math.random() * 0.2);

  return Math.max(1, Math.round(price));
}

function getMarketPrice(cropKey) {
  return state.marketPrices[cropKey] || CROPS[cropKey].sellBase;
}

function sellCrop(cropKey, amount) {
  var available = state.inventory[cropKey] || 0;
  if (available < amount) amount = available;
  if (amount <= 0) return 0;

  var price = getMarketPrice(cropKey);
  var total = price * amount;

  state.money += total;
  state.inventory[cropKey] -= amount;
  if (state.inventory[cropKey] <= 0) delete state.inventory[cropKey];
  state.totalSold += total;

  if (!state.marketHistory[cropKey]) state.marketHistory[cropKey] = [];
  state.marketHistory[cropKey].push(amount);
  if (state.marketHistory[cropKey].length > 10) state.marketHistory[cropKey].shift();

  var season = CFG.seasons[state.season];
  state.marketPrices[cropKey] = calculateCropPrice(cropKey, CROPS[cropKey], season);

  return total;
}

function sellAllCrops() {
  var totalEarned = 0;
  for (var cropKey in state.inventory) {
    var amount = state.inventory[cropKey];
    if (amount > 0) {
      totalEarned += sellCrop(cropKey, amount);
    }
  }
  return totalEarned;
}
