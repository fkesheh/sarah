const CFG = {
  gridW: 20,
  gridH: 20,
  tileW: 64,
  tileH: 32,
  dayDurationMs: 12000,
  daysPerSeason: 30,
  seasons: ['primavera', 'verao', 'outono', 'inverno'],
  seasonNames: ['Primavera', 'Verao', 'Outono', 'Inverno'],
  seasonEmojis: ['🌸', '☀️', '🍂', '❄️'],
  startMoney: 500,
  startStorage: 50,
  saveKey: 'fazendinhaSave',
  autoSaveIntervalMs: 30000,
  minZoom: 0.5,
  maxZoom: 2.0,
  defaultZoom: 1.0,
  seasonColors: {
    primavera: { sky: '#87CEEB', grass: '#5a9e3a', grassDark: '#4a8e2a', ambient: 'rgba(200,255,200,0.05)' },
    verao:     { sky: '#5BA3D9', grass: '#6aae2a', grassDark: '#5a9e1a', ambient: 'rgba(255,240,180,0.08)' },
    outono:    { sky: '#B8860B', grass: '#8a7e3a', grassDark: '#7a6e2a', ambient: 'rgba(255,180,100,0.06)' },
    inverno:   { sky: '#708090', grass: '#6a8a6a', grassDark: '#5a7a5a', ambient: 'rgba(180,200,255,0.06)' },
  },
};

const CROPS = {
  wheat: {
    name: 'Trigo', icon: '🌾', seedCost: 10, sellBase: 25, growthDays: 6,
    seasons: ['primavera', 'outono'], color: '#d4a843', colorDark: '#b08830',
    weatherMods: { sunny: 0.12, cloudy: 0.08, rainy: 0.05, stormy: -0.15, drought: -0.10 },
    irrigationMod: 0.08, greenhouseMod: 0.05,
  },
  corn: {
    name: 'Milho', icon: '🌽', seedCost: 15, sellBase: 35, growthDays: 8,
    seasons: ['verao'], color: '#e8c840', colorDark: '#c0a030',
    weatherMods: { sunny: 0.15, cloudy: 0.05, rainy: 0.08, stormy: -0.20, drought: -0.15 },
    irrigationMod: 0.12, greenhouseMod: 0.03,
  },
  tomato: {
    name: 'Tomate', icon: '🍅', seedCost: 20, sellBase: 45, growthDays: 7,
    seasons: ['primavera', 'verao'], color: '#e04030', colorDark: '#c03020',
    weatherMods: { sunny: 0.15, cloudy: 0.05, rainy: -0.05, stormy: -0.25, drought: -0.10 },
    irrigationMod: 0.10, greenhouseMod: 0.08,
  },
  carrot: {
    name: 'Cenoura', icon: '🥕', seedCost: 12, sellBase: 30, growthDays: 5,
    seasons: ['primavera', 'outono'], color: '#e87830', colorDark: '#c06020',
    weatherMods: { sunny: 0.08, cloudy: 0.10, rainy: 0.10, stormy: -0.10, drought: -0.15 },
    irrigationMod: 0.10, greenhouseMod: 0.05,
  },
  sunflower: {
    name: 'Girassol', icon: '🌻', seedCost: 25, sellBase: 60, growthDays: 10,
    seasons: ['verao'], color: '#f0c020', colorDark: '#d0a010',
    weatherMods: { sunny: 0.20, cloudy: -0.05, rainy: -0.10, stormy: -0.25, drought: 0.0 },
    irrigationMod: 0.05, greenhouseMod: 0.03,
  },
  lettuce: {
    name: 'Alface', icon: '🥬', seedCost: 8, sellBase: 18, growthDays: 4,
    seasons: ['primavera', 'outono'], color: '#60c040', colorDark: '#40a020',
    weatherMods: { sunny: -0.05, cloudy: 0.12, rainy: 0.15, stormy: -0.10, drought: -0.25 },
    irrigationMod: 0.15, greenhouseMod: 0.05,
  },
  potato: {
    name: 'Batata', icon: '🥔', seedCost: 14, sellBase: 32, growthDays: 7,
    seasons: ['primavera', 'outono', 'inverno'], color: '#b08850', colorDark: '#907040',
    weatherMods: { sunny: 0.08, cloudy: 0.08, rainy: 0.06, stormy: -0.08, drought: -0.10 },
    irrigationMod: 0.08, greenhouseMod: 0.03,
  },
  strawberry: {
    name: 'Morango', icon: '🍓', seedCost: 30, sellBase: 70, growthDays: 9,
    seasons: ['primavera'], color: '#d03040', colorDark: '#b02030',
    weatherMods: { sunny: 0.12, cloudy: 0.05, rainy: -0.08, stormy: -0.20, drought: -0.15 },
    irrigationMod: 0.10, greenhouseMod: 0.10,
  },
};

const WEATHER_TYPES = {
  sunny:   { name: 'Ensolarado', icon: '☀️',  probability: { primavera: 0.40, verao: 0.50, outono: 0.30, inverno: 0.20 } },
  cloudy:  { name: 'Nublado',    icon: '☁️',  probability: { primavera: 0.25, verao: 0.15, outono: 0.30, inverno: 0.30 } },
  rainy:   { name: 'Chuvoso',    icon: '🌧️', probability: { primavera: 0.25, verao: 0.15, outono: 0.25, inverno: 0.20 } },
  stormy:  { name: 'Tempestade', icon: '⛈️',  probability: { primavera: 0.05, verao: 0.15, outono: 0.10, inverno: 0.15 } },
  drought: { name: 'Seca',       icon: '🏜️', probability: { primavera: 0.05, verao: 0.05, outono: 0.05, inverno: 0.15 } },
};

const UPGRADE_DEFS = {
  irrigation: {
    name: 'Irrigacao',
    icon: '💧',
    levels: [
      { cost: 200,  desc: 'Irrigacao acelera crescimento adjacente', range: 1 },
      { cost: 500,  desc: 'Irrigacao 2 tiles de distancia', range: 2 },
      { cost: 1200, desc: 'Irrigacao em toda a fazenda', range: 99 },
    ],
  },
  greenhouse: {
    name: 'Estufa',
    icon: '🏠',
    levels: [
      { cost: 400,  desc: 'Protege area 3x3 do clima', range: 1 },
      { cost: 1000, desc: 'Protege area 5x5 do clima', range: 2 },
    ],
  },
  tools: {
    name: 'Ferramentas',
    icon: '🔧',
    levels: [
      { cost: 150, desc: 'Ara/colhe 2 tiles por click', multi: 2 },
      { cost: 400, desc: 'Ara/colhe 3 tiles por click', multi: 3 },
      { cost: 800, desc: 'Ara/colhe fileira inteira', multi: 'row' },
    ],
  },
  silo: {
    name: 'Silo',
    icon: '🏗️',
    levels: [
      { cost: 200,  desc: '+50 armazenamento', bonus: 50 },
      { cost: 500,  desc: '+100 armazenamento', bonus: 100 },
      { cost: 1000, desc: '+200 armazenamento', bonus: 200 },
    ],
  },
  market: {
    name: 'Barraca',
    icon: '🏪',
    levels: [
      { cost: 300,  desc: '+15% preco de venda', bonus: 0.15 },
      { cost: 700,  desc: '+30% preco de venda', bonus: 0.30 },
      { cost: 1500, desc: '+50% preco de venda', bonus: 0.50 },
    ],
  },
};

const ACHIEVEMENT_DEFS = {
  first_harvest:   { name: 'Primeira Colheita',  desc: 'Colha sua primeira plantacao',       icon: '🌾' },
  money_1000:      { name: 'Mil Moedas',          desc: 'Acumule 1000 moedas',               icon: '💰' },
  money_10000:     { name: 'Fazendeiro Rico',      desc: 'Acumule 10000 moedas',              icon: '🤑' },
  all_crops:       { name: 'Colecionador',         desc: 'Colha todos os tipos de cultura',   icon: '🏆' },
  full_year:       { name: 'Ano Completo',         desc: 'Sobreviva um ano inteiro',          icon: '📅' },
  first_upgrade:   { name: 'Modernizacao',         desc: 'Compre seu primeiro upgrade',       icon: '⬆️' },
  harvest_100:     { name: 'Colheita Centenaria',  desc: 'Colha 100 culturas',                icon: '💯' },
  survive_storm:   { name: 'Resistente',           desc: 'Sobreviva a uma tempestade',        icon: '⛈️' },
};
