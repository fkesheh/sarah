const CFG = {
  saveKey: 'tamagotchiSave',
  autoSaveIntervalMs: 15000,

  // Stat decay per real minute
  hungerDecayPerMin: 0.8,
  happinessDecayPerMin: 0.5,
  poopIntervalMin: 20,
  maxPoops: 8,
  cleanlinessDecayPerPoopPerMin: 1.5,

  // Action effects
  feedAmount: 30,
  petAmount: 25,
  feedCooldownMs: 3000,
  petCooldownMs: 2000,

  // Evolution thresholds (real minutes since born)
  eggDurationMin: 2,
  babyDurationMin: 30,
  teenDurationMin: 120,

  // Sickness
  sickHungerThreshold: 15,
  sickCleanlinessThreshold: 15,
  sickDurationBeforeDeathMin: 30,

  // Offline
  maxOfflineHours: 48,

  // Canvas logical size
  canvasWidth: 400,
  canvasHeight: 400,
};

const FOOD_TYPES = {
  meat:  { emoji: '🍖', label: 'Carne',  hunger: 30, happiness: 0,  cleanliness: 0 },
  fruit: { emoji: '🍎', label: 'Fruta',  hunger: 15, happiness: 10, cleanliness: 0 },
  cake:  { emoji: '🍰', label: 'Bolo',   hunger: 10, happiness: 20, cleanliness: -5 },
  salad: { emoji: '🥗', label: 'Salada', hunger: 20, happiness: 5,  cleanliness: 5 },
};
