function canBuyUpgrade(upgradeKey) {
  const current = state.upgrades[upgradeKey];
  const def = UPGRADE_DEFS[upgradeKey];
  if (!def || current >= def.levels.length) return false;
  return state.money >= def.levels[current].cost;
}

function buyUpgrade(upgradeKey) {
  if (!canBuyUpgrade(upgradeKey)) return false;
  const current = state.upgrades[upgradeKey];
  const cost = UPGRADE_DEFS[upgradeKey].levels[current].cost;
  state.money -= cost;
  state.upgrades[upgradeKey]++;
  return true;
}

function getUpgradeInfo(upgradeKey) {
  const current = state.upgrades[upgradeKey];
  const def = UPGRADE_DEFS[upgradeKey];
  const maxed = current >= def.levels.length;
  return {
    name: def.name,
    icon: def.icon,
    currentLevel: current,
    maxLevel: def.levels.length,
    maxed: maxed,
    nextCost: maxed ? null : def.levels[current].cost,
    nextDesc: maxed ? 'Maximo!' : def.levels[current].desc,
  };
}
