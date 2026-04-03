function checkAchievements() {
  if (gameState !== 'playing') return;

  const checks = {
    first_harvest:  () => state.totalHarvested >= 1,
    money_1000:     () => state.money >= 1000,
    money_10000:    () => state.money >= 10000,
    all_crops:      () => Object.keys(state.cropsHarvestedByType).length >= Object.keys(CROPS).length,
    full_year:      () => state.year >= 2,
    first_upgrade:  () => Object.values(state.upgrades).some(v => v > 0),
    harvest_100:    () => state.totalHarvested >= 100,
    survive_storm:  () => state.survivedStorm === true,
  };

  for (const [key, check] of Object.entries(checks)) {
    if (!state.achievements[key] && check()) {
      state.achievements[key] = true;
      const def = ACHIEVEMENT_DEFS[key];
      if (def) {
        showAchievementToast(def.name, def.desc, def.icon);
      }
    }
  }
}
