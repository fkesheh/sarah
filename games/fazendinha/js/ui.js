/* ui.js — HTML overlay management for Fazendinha */

var _sidePanelOpen = false;
var _inspectedTile = null;

function formatMoney(amount) {
  var n = Math.floor(amount);
  var str = n.toString();
  var result = '';
  var count = 0;
  for (var i = str.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) result = '.' + result;
    result = str[i] + result;
    count++;
  }
  return result;
}

function initUI() {
  // Seed selector buttons
  var seedSelector = document.getElementById('seedSelector');
  if (seedSelector) {
    var html = '';
    for (var key in CROPS) {
      var crop = CROPS[key];
      var seasonDots = '';
      for (var si = 0; si < CFG.seasons.length; si++) {
        var inS = crop.seasons.includes(CFG.seasons[si]);
        seasonDots += '<span style="opacity:' + (inS ? '1' : '0.2') + '">' + CFG.seasonEmojis[si] + '</span>';
      }
      var prefIcons = { sunny: '\u2600\uFE0F', cloudy: '\u2601\uFE0F', rainy: '\uD83C\uDF27\uFE0F', stormy: '\u26C8\uFE0F', drought: '\uD83C\uDFDC\uFE0F' };
      var likeStr = '', dislikeStr = '';
      if (crop.weatherMods) {
        for (var w in crop.weatherMods) {
          if (crop.weatherMods[w] >= 0.10) likeStr += prefIcons[w];
          else if (crop.weatherMods[w] <= -0.10) dislikeStr += prefIcons[w];
        }
      }
      html += '<button class="seed-btn" data-crop="' + key + '">'
            + '<div class="seed-top">'
            + '<span>' + crop.icon + ' ' + crop.name + '</span>'
            + '<span class="seed-trend neutral" data-trend>\u2192</span>'
            + '</div>'
            + '<div class="seed-bottom">'
            + '<span><span class="seed-price">$' + crop.seedCost + '</span> \u2192 <span class="seed-sell" data-sell>$' + crop.sellBase + '</span></span>'
            + '<span class="seed-seasons">' + seasonDots + '</span>'
            + '</div>'
            + '<div class="seed-prefs">'
            + (likeStr ? '<span class="seed-likes">\u2764\uFE0F' + likeStr + '</span>' : '')
            + (dislikeStr ? '<span class="seed-hates">\uD83D\uDEAB' + dislikeStr + '</span>' : '')
            + '</div>'
            + '</button>';
    }
    seedSelector.innerHTML = html;

    seedSelector.addEventListener('click', function (e) {
      var btn = e.target.closest('.seed-btn');
      if (!btn || btn.classList.contains('disabled')) return;
      var cropKey = btn.getAttribute('data-crop');
      if (cropKey) selectSeed(cropKey);
    });
  }

  // Tool buttons
  var tools = ['plow', 'plant', 'harvest', 'inspect'];
  var toolIds = ['toolPlow', 'toolPlant', 'toolHarvest', 'toolInspect'];
  for (var i = 0; i < tools.length; i++) {
    (function (tool) {
      var btn = document.getElementById(toolIds[tools.indexOf(tool)]);
      if (btn) {
        btn.addEventListener('click', function () { selectTool(tool); });
      }
    })(tools[i]);
  }

  // Time speed buttons
  var speedBtns = [
    { id: 'timePause', speed: 0 },
    { id: 'time1x',    speed: 1 },
    { id: 'time2x',    speed: 2 },
    { id: 'time3x',    speed: 3 },
  ];
  for (var s = 0; s < speedBtns.length; s++) {
    (function (entry) {
      var btn = document.getElementById(entry.id);
      if (btn) {
        btn.addEventListener('click', function () {
          setTimeSpeed(entry.speed);
          updateUIState();
        });
      }
    })(speedBtns[s]);
  }

  // Side panel toggle
  var panelToggle = document.getElementById('sidePanelToggle');
  if (panelToggle) {
    panelToggle.addEventListener('click', function () {
      var panel = document.getElementById('sidePanel');
      if (panel) {
        _sidePanelOpen = !_sidePanelOpen;
        panel.classList.toggle('open', _sidePanelOpen);
        panelToggle.textContent = _sidePanelOpen ? '▶' : '◀';
        if (_sidePanelOpen) updateSidePanel();
      }
    });
  }

  // Start button
  var startBtn = document.getElementById('startPlayBtn');
  if (startBtn) {
    startBtn.addEventListener('click', function () {
      startGame();
    });
  }

  // Sell all (via event delegation on inventory section)
  var invList = document.getElementById('inventoryList');
  if (invList) {
    invList.addEventListener('click', function (e) {
      var sellBtn = e.target.closest('.sell-btn');
      if (!sellBtn) return;
      var cropKey = sellBtn.getAttribute('data-crop');
      if (cropKey === '__all__') {
        sellAllCrops();
      } else if (cropKey) {
        sellCrop(cropKey, 1);
      }
      updateSidePanel();
      updateUIState();
    });
  }

  // Upgrade buy buttons (event delegation)
  var upgradeList = document.getElementById('upgradeList');
  if (upgradeList) {
    upgradeList.addEventListener('click', function (e) {
      var btn = e.target.closest('.buy-upgrade-btn');
      if (!btn || btn.disabled) return;
      var key = btn.getAttribute('data-upgrade');
      if (key) {
        buyUpgrade(key);
        updateSidePanel();
        updateUIState();
      }
    });
  }

  // Fullscreen button
  var fsBtn = document.getElementById('fullscreenBtn');
  if (fsBtn) {
    fsBtn.addEventListener('click', function () {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    });
  }

  // Encyclopedia button (if present in HUD)
  var encBtn = document.getElementById('encyclopediaBtn');
  if (encBtn) {
    encBtn.addEventListener('click', function () { showEncyclopedia(); });
  }

  // Encyclopedia close button
  var encClose = document.getElementById('encyclopediaCloseBtn');
  if (encClose) {
    encClose.addEventListener('click', function () { hideEncyclopedia(); });
  }

  // Close encyclopedia when clicking outside content
  var encModal = document.getElementById('encyclopediaModal');
  if (encModal) {
    encModal.addEventListener('click', function (e) {
      if (e.target === encModal) hideEncyclopedia();
    });
  }

  // Crop detail close button
  var cropDetailClose = document.getElementById('cropDetailCloseBtn');
  if (cropDetailClose) {
    cropDetailClose.addEventListener('click', function () { hideCropDetail(); });
  }
  var cropDetailModal = document.getElementById('cropDetailModal');
  if (cropDetailModal) {
    cropDetailModal.addEventListener('click', function (e) {
      if (e.target === cropDetailModal) hideCropDetail();
    });
  }

  updateUIState();
  updateToolbarUI();
}

function updateUIState() {
  // Money
  var hudMoney = document.getElementById('hudMoney');
  if (hudMoney) hudMoney.textContent = formatMoney(state.money);

  // Day
  var hudDay = document.getElementById('hudDay');
  if (hudDay) hudDay.textContent = state.day;

  // Season
  var hudSeasonIcon = document.getElementById('hudSeasonIcon');
  var hudSeasonName = document.getElementById('hudSeasonName');
  if (hudSeasonIcon) hudSeasonIcon.textContent = CFG.seasonEmojis[state.season];
  if (hudSeasonName) hudSeasonName.textContent = CFG.seasonNames[state.season];

  // Weather
  var weather = WEATHER_TYPES[state.weather];
  var hudWeatherIcon = document.getElementById('hudWeatherIcon');
  var hudWeatherName = document.getElementById('hudWeatherName');
  if (weather) {
    if (hudWeatherIcon) hudWeatherIcon.textContent = weather.icon;
    if (hudWeatherName) hudWeatherName.textContent = weather.name;
  }

  // Forecast
  if (state.forecast) {
    for (var f = 0; f < 3; f++) {
      var el = document.getElementById('forecast' + f);
      if (el && state.forecast[f]) {
        var fw = WEATHER_TYPES[state.forecast[f]];
        el.textContent = fw ? fw.icon : '?';
      }
    }
  }

  // Storage display
  var storageEl = document.getElementById('storageDisplay');
  if (storageEl) {
    storageEl.textContent = getTotalInventory() + '/' + getStorageCapacity();
  }

  // Time speed buttons
  var speedMap = { timePause: 0, time1x: 1, time2x: 2, time3x: 3 };
  for (var btnId in speedMap) {
    var btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.toggle('active', state.timeSpeed === speedMap[btnId]);
    }
  }

  updateSeedSelectorUI();

  if (_inspectedTile) {
    var cdModal = document.getElementById('cropDetailModal');
    if (cdModal && cdModal.classList.contains('visible')) {
      updateCropDetailContent();
    }
  }
}

function updateToolbarUI() {
  var toolIds = { plow: 'toolPlow', plant: 'toolPlant', harvest: 'toolHarvest', inspect: 'toolInspect' };
  for (var tool in toolIds) {
    var btn = document.getElementById(toolIds[tool]);
    if (btn) btn.classList.toggle('active', state.selectedTool === tool);
  }

  var seedSelector = document.getElementById('seedSelector');
  if (seedSelector) {
    seedSelector.classList.toggle('visible', state.selectedTool === 'plant');
  }
}

function updateSeedSelectorUI() {
  var seedSelector = document.getElementById('seedSelector');
  if (!seedSelector) return;

  var season = CFG.seasons[state.season];
  var btns = seedSelector.querySelectorAll('.seed-btn');
  for (var i = 0; i < btns.length; i++) {
    var btn = btns[i];
    var cropKey = btn.getAttribute('data-crop');
    var crop = CROPS[cropKey];
    var selected = state.selectedSeed === cropKey;
    var canAfford = state.money >= crop.seedCost;
    var inSeason = crop.seasons.includes(season);

    btn.classList.toggle('selected', selected);
    btn.classList.toggle('disabled', !canAfford);
    btn.classList.toggle('in-season', inSeason);
    btn.style.opacity = canAfford ? '1' : '0.4';

    var price = getMarketPrice(cropKey);
    var sellEl = btn.querySelector('[data-sell]');
    if (sellEl) sellEl.textContent = '$' + price;

    var trendEl = btn.querySelector('[data-trend]');
    if (trendEl) {
      var ratio = price / crop.sellBase;
      if (ratio > 1.1) {
        trendEl.textContent = '↑';
        trendEl.className = 'seed-trend up';
      } else if (ratio < 0.9) {
        trendEl.textContent = '↓';
        trendEl.className = 'seed-trend down';
      } else {
        trendEl.textContent = '→';
        trendEl.className = 'seed-trend neutral';
      }
    }
  }
}

function updateSidePanel() {
  updateTileInfoSection();
  updateInventorySection();
  updateMarketSection();
  updateUpgradeSection();
}

function updateTileInfoSection() {
  var el = document.getElementById('tileInfoText');
  if (!el) return;

  if (!inBounds(hoverTile.col, hoverTile.row)) {
    el.textContent = 'Passe o mouse sobre um tile';
    return;
  }

  var tile = state.tiles[hoverTile.row][hoverTile.col];
  var typeNames = { grass: 'Grama', plowed: 'Arado', planted: 'Plantado', dead: 'Morta' };
  var lines = [];
  lines.push('Tipo: ' + (typeNames[tile.type] || tile.type));

  if (tile.crop) {
    var crop = CROPS[tile.crop];
    var stageNames = ['Semente', 'Broto', 'Crescendo', 'Quase pronto', 'Pronto!'];
    lines.push('Cultura: ' + crop.icon + ' ' + crop.name);
    lines.push('Estagio: ' + stageNames[tile.cropStage]);
    if (tile.irrigated) lines.push('Irrigado');
    if (tile.withering) lines.push('Murchando!');
    if (isInGreenhouse(hoverTile.col, hoverTile.row)) {
      lines.push('Na estufa');
    }
  }

  if (tile.type === 'dead' && tile.deadCrop) {
    var deadCropDef = CROPS[tile.deadCrop];
    if (deadCropDef) {
      lines.push('Cultura morta: ' + deadCropDef.icon + ' ' + deadCropDef.name);
      var causeText = tile.deathCause === 'storm' ? 'Tempestade' : 'Murchou';
      lines.push('Causa: ' + causeText);
      lines.push('Use o arado para limpar');
    }
  }

  el.textContent = '';
  for (var i = 0; i < lines.length; i++) {
    if (i > 0) el.appendChild(document.createElement('br'));
    el.appendChild(document.createTextNode(lines[i]));
  }
}

function updateInventorySection() {
  var el = document.getElementById('inventoryList');
  if (!el) return;

  var keys = Object.keys(state.inventory).filter(function (k) {
    return state.inventory[k] > 0;
  });

  if (keys.length === 0) {
    el.textContent = '';
    var empty = document.createElement('div');
    empty.style.cssText = 'color:rgba(255,255,255,0.4);font-size:12px;';
    empty.textContent = 'Vazio';
    el.appendChild(empty);
    return;
  }

  var total = getTotalInventory();
  var cap = getStorageCapacity();

  el.textContent = '';

  var summary = document.createElement('div');
  summary.style.cssText = 'font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:8px;';
  summary.textContent = total + '/' + cap + ' itens';
  el.appendChild(summary);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var crop = CROPS[key];
    var count = state.inventory[key];

    var row = document.createElement('div');
    row.className = 'inventory-item';

    var label = document.createElement('span');
    label.textContent = crop.icon + ' ' + crop.name + ' x' + count;
    row.appendChild(label);

    var sellBtn = document.createElement('button');
    sellBtn.className = 'sell-btn';
    sellBtn.setAttribute('data-crop', key);
    sellBtn.textContent = 'Vender $' + getMarketPrice(key);
    row.appendChild(sellBtn);

    el.appendChild(row);
  }

  var sellAllWrap = document.createElement('div');
  sellAllWrap.style.marginTop = '8px';
  var sellAllBtn = document.createElement('button');
  sellAllBtn.className = 'sell-btn';
  sellAllBtn.setAttribute('data-crop', '__all__');
  sellAllBtn.style.cssText = 'width:100%;padding:6px;';
  sellAllBtn.textContent = 'Vender Tudo';
  sellAllWrap.appendChild(sellAllBtn);
  el.appendChild(sellAllWrap);
}

function updateMarketSection() {
  var el = document.getElementById('marketList');
  if (!el) return;

  el.textContent = '';

  for (var key in CROPS) {
    var crop = CROPS[key];
    var price = getMarketPrice(key);
    var base = crop.sellBase;
    var color = '#fff';
    if (price > base) color = '#4CAF50';
    else if (price < base) color = '#e04030';

    var row = document.createElement('div');
    row.className = 'market-item';

    var nameSpan = document.createElement('span');
    nameSpan.className = 'market-name';
    nameSpan.textContent = crop.icon + ' ' + crop.name;
    row.appendChild(nameSpan);

    var priceSpan = document.createElement('span');
    priceSpan.className = 'market-price';
    priceSpan.style.color = color;
    priceSpan.textContent = '$ ' + formatMoney(price);
    row.appendChild(priceSpan);

    el.appendChild(row);
  }
}

function updateUpgradeSection() {
  var el = document.getElementById('upgradeList');
  if (!el) return;

  el.textContent = '';

  for (var key in UPGRADE_DEFS) {
    var info = getUpgradeInfo(key);

    var card = document.createElement('div');
    card.className = 'upgrade-item';

    var header = document.createElement('div');
    header.className = 'upgrade-header';
    header.textContent = info.icon + ' ' + info.name;
    card.appendChild(header);

    var desc = document.createElement('div');
    desc.className = 'upgrade-desc';
    desc.textContent = info.nextDesc;
    card.appendChild(desc);

    var level = document.createElement('div');
    level.className = 'upgrade-level';
    level.textContent = 'Nivel ' + info.currentLevel + '/' + info.maxLevel;
    card.appendChild(level);

    if (info.maxed) {
      var maxLabel = document.createElement('span');
      maxLabel.style.cssText = 'color:#f0c020;font-size:12px;font-weight:700;';
      maxLabel.textContent = 'MAX';
      card.appendChild(maxLabel);
    } else {
      var buyBtn = document.createElement('button');
      buyBtn.className = 'buy-upgrade-btn';
      buyBtn.setAttribute('data-upgrade', key);
      buyBtn.textContent = '$ ' + formatMoney(info.nextCost);
      if (!canBuyUpgrade(key)) buyBtn.disabled = true;
      card.appendChild(buyBtn);
    }

    el.appendChild(card);
  }
}

function showAchievementToast(name, desc, icon) {
  var container = document.getElementById('achievementContainer');
  if (!container) return;

  var toast = document.createElement('div');
  toast.className = 'achievement-toast';

  var title = document.createElement('div');
  title.className = 'toast-title';
  title.textContent = 'Conquista Desbloqueada!';
  toast.appendChild(title);

  var body = document.createElement('div');
  body.className = 'toast-body';

  var iconSpan = document.createElement('span');
  iconSpan.style.fontSize = '20px';
  iconSpan.textContent = icon;
  body.appendChild(iconSpan);

  var textWrap = document.createElement('span');
  var nameB = document.createElement('b');
  nameB.textContent = name;
  textWrap.appendChild(nameB);
  textWrap.appendChild(document.createElement('br'));
  var descSpan = document.createElement('span');
  descSpan.style.cssText = 'font-size:11px;color:rgba(255,255,255,0.6);';
  descSpan.textContent = desc;
  textWrap.appendChild(descSpan);
  body.appendChild(textWrap);

  toast.appendChild(body);
  container.appendChild(toast);

  setTimeout(function () {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 4000);
}

function showEncyclopedia() {
  var modal = document.getElementById('encyclopediaModal');
  var list = document.getElementById('encyclopediaCropList');
  if (!modal || !list) return;

  list.textContent = '';

  for (var key in CROPS) {
    var crop = CROPS[key];
    var seasonLabels = crop.seasons.map(function (s) {
      var idx = CFG.seasons.indexOf(s);
      return idx >= 0 ? CFG.seasonEmojis[idx] + ' ' + CFG.seasonNames[idx] : s;
    }).join(', ');

    var card = document.createElement('div');
    card.className = 'crop-card';

    var iconDiv = document.createElement('div');
    iconDiv.className = 'crop-icon';
    iconDiv.textContent = crop.icon;
    card.appendChild(iconDiv);

    var details = document.createElement('div');
    details.className = 'crop-details';

    var nameDiv = document.createElement('div');
    nameDiv.className = 'crop-name';
    nameDiv.textContent = crop.name;
    details.appendChild(nameDiv);

    var stats = [
      'Semente: $ ' + crop.seedCost,
      'Venda base: $ ' + crop.sellBase,
      'Dias de crescimento: ' + crop.growthDays,
      'Estacoes: ' + seasonLabels,
    ];

    for (var si = 0; si < stats.length; si++) {
      var stat = document.createElement('div');
      stat.className = 'crop-stat';
      stat.textContent = stats[si];
      details.appendChild(stat);
    }

    card.appendChild(details);
    list.appendChild(card);
  }

  modal.classList.add('visible');
}

function hideEncyclopedia() {
  var modal = document.getElementById('encyclopediaModal');
  if (modal) modal.classList.remove('visible');
}

function updateTileInfoForHover(col, row) {
  hoverTile.col = col;
  hoverTile.row = row;

  if (!_sidePanelOpen) return;
  updateTileInfoSection();
}

function showCropDetail(col, row) {
  if (!inBounds(col, row)) return;
  var tile = state.tiles[row][col];
  if (!tile.crop && tile.type !== 'dead') return;

  _inspectedTile = { col: col, row: row };
  updateCropDetailContent();

  var modal = document.getElementById('cropDetailModal');
  modal.classList.add('visible');
}

function updateCropDetailContent() {
  if (!_inspectedTile) return;
  var col = _inspectedTile.col;
  var row = _inspectedTile.row;

  if (!inBounds(col, row)) { hideCropDetail(); return; }
  var tile = state.tiles[row][col];

  if (tile.type === 'dead' && tile.deadCrop) {
    updateDeadCropDetailContent(tile);
    return;
  }

  if (!tile.crop) { hideCropDetail(); return; }

  var cropDef = CROPS[tile.crop];
  var stageNames = ['Semente', 'Broto', 'Crescendo', 'Quase pronto', 'Pronto para colher!'];
  var seasonLabels = cropDef.seasons.map(function (s) {
    var idx = CFG.seasons.indexOf(s);
    return idx >= 0 ? CFG.seasonEmojis[idx] + ' ' + CFG.seasonNames[idx] : s;
  }).join(', ');

  var header = document.getElementById('cropDetailHeader');
  var body = document.getElementById('cropDetailBody');

  header.innerHTML = '';
  var iconSpan = document.createElement('span');
  iconSpan.className = 'detail-icon';
  iconSpan.textContent = cropDef.icon;
  header.appendChild(iconSpan);
  var nameDiv = document.createElement('div');
  nameDiv.className = 'detail-name';
  nameDiv.textContent = cropDef.name;
  header.appendChild(nameDiv);

  body.innerHTML = '';
  var rows = [
    { label: 'Estagio', value: stageNames[tile.cropStage] },
    { label: 'Dias de crescimento', value: cropDef.growthDays + ' dias' },
    { label: 'Custo da semente', value: '$ ' + cropDef.seedCost },
    { label: 'Preco de venda', value: '$ ' + getMarketPrice(tile.crop) },
    { label: 'Estacoes', value: seasonLabels },
    { label: 'Irrigado', value: tile.irrigated ? 'Sim' : 'Nao' },
  ];

  var quality = Math.round(Math.min(100, Math.max(0, tile.quality || 0)));
  var qualityMultiplier = 0.5 + (quality / 100) * 1.5;
  var adjustedPrice = Math.max(1, Math.round(getMarketPrice(tile.crop) * qualityMultiplier));

  rows.push({ label: 'Qualidade', value: quality + '%' });
  rows.push({ label: 'Preco c/ qualidade', value: '$ ' + adjustedPrice });

  if (cropDef.weatherMods) {
    var weatherIcons = { sunny: '\u2600\uFE0F', cloudy: '\u2601\uFE0F', rainy: '\uD83C\uDF27\uFE0F', stormy: '\u26C8\uFE0F', drought: '\uD83C\uDFDC\uFE0F' };
    var likes = [];
    var dislikes = [];
    for (var w in cropDef.weatherMods) {
      var mod = cropDef.weatherMods[w];
      if (mod >= 0.10) likes.push(weatherIcons[w]);
      else if (mod <= -0.10) dislikes.push(weatherIcons[w]);
    }
    if (cropDef.irrigationMod >= 0.10) likes.push('\uD83D\uDCA7');
    if (likes.length > 0) rows.push({ label: 'Gosta', value: likes.join(' ') });
    if (dislikes.length > 0) rows.push({ label: 'Nao gosta', value: dislikes.join(' ') });
  }

  if (isInGreenhouse(col, row)) {
    rows.push({ label: 'Estufa', value: 'Sim' });
  }
  if (tile.withering) {
    rows.push({ label: 'Status', value: 'Murchando!' });
  }

  for (var i = 0; i < rows.length; i++) {
    var rowDiv = document.createElement('div');
    rowDiv.className = 'detail-row';
    var labelSpan = document.createElement('span');
    labelSpan.className = 'label';
    labelSpan.textContent = rows[i].label;
    rowDiv.appendChild(labelSpan);
    var valueSpan = document.createElement('span');
    valueSpan.className = 'value';
    valueSpan.textContent = rows[i].value;
    rowDiv.appendChild(valueSpan);
    body.appendChild(rowDiv);
  }

  var totalStages = 5;
  var daysPerStage = cropDef.growthDays / 4;
  var currentProgress = tile.cropStage + (tile.growthProgress / daysPerStage);
  var percent = Math.min(100, (currentProgress / totalStages) * 100);

  var barWrap = document.createElement('div');
  barWrap.className = 'progress-bar';
  var barFill = document.createElement('div');
  barFill.className = 'progress-fill';
  barFill.style.width = percent + '%';
  barWrap.appendChild(barFill);
  body.appendChild(barWrap);

  var pctLabel = document.createElement('div');
  pctLabel.style.cssText = 'text-align:center;font-size:11px;color:rgba(255,255,255,0.5);margin-top:4px;';
  pctLabel.textContent = Math.round(percent) + '% crescido';
  body.appendChild(pctLabel);

  var qColor = quality < 30 ? '#e04030' : quality < 70 ? '#f0c020' : '#4CAF50';
  var qBarWrap = document.createElement('div');
  qBarWrap.className = 'progress-bar';
  qBarWrap.style.marginTop = '8px';
  var qBarFill = document.createElement('div');
  qBarFill.className = 'progress-fill';
  qBarFill.style.width = quality + '%';
  qBarFill.style.background = qColor;
  qBarWrap.appendChild(qBarFill);
  body.appendChild(qBarWrap);

  var qLabel = document.createElement('div');
  qLabel.style.cssText = 'text-align:center;font-size:11px;color:rgba(255,255,255,0.5);margin-top:4px;';
  qLabel.textContent = quality + '% qualidade';
  body.appendChild(qLabel);
}

function updateDeadCropDetailContent(tile) {
  var cropDef = CROPS[tile.deadCrop];
  if (!cropDef) { hideCropDetail(); return; }

  var header = document.getElementById('cropDetailHeader');
  var body = document.getElementById('cropDetailBody');

  header.innerHTML = '';
  var iconSpan = document.createElement('span');
  iconSpan.className = 'detail-icon';
  iconSpan.textContent = '\uD83D\uDC80';
  header.appendChild(iconSpan);
  var nameDiv = document.createElement('div');
  nameDiv.className = 'detail-name dead';
  nameDiv.textContent = cropDef.name + ' (Morta)';
  header.appendChild(nameDiv);

  body.innerHTML = '';

  var causeLabels = {
    storm: '\u26C8\uFE0F Destruida pela tempestade',
    wither: '\uD83E\uDD40 Murchou fora de estacao'
  };
  var causeText = causeLabels[tile.deathCause] || 'Causa desconhecida';

  var rows = [
    { label: 'Cultura', value: cropDef.icon + ' ' + cropDef.name },
    { label: 'Causa da morte', value: causeText },
    { label: 'Acao', value: '\uD83D\uDD28 Use o arado para limpar' },
  ];

  for (var i = 0; i < rows.length; i++) {
    var rowDiv = document.createElement('div');
    rowDiv.className = 'detail-row';
    var labelSpan = document.createElement('span');
    labelSpan.className = 'label';
    labelSpan.textContent = rows[i].label;
    rowDiv.appendChild(labelSpan);
    var valueSpan = document.createElement('span');
    valueSpan.className = 'value';
    valueSpan.textContent = rows[i].value;
    rowDiv.appendChild(valueSpan);
    body.appendChild(rowDiv);
  }
}

function hideCropDetail() {
  _inspectedTile = null;
  var modal = document.getElementById('cropDetailModal');
  if (modal) modal.classList.remove('visible');
}
