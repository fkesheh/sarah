const TUTORIAL_STEPS = [
  {
    text: 'Bem-vindo a Fazendinha! Vamos aprender a cuidar da sua fazenda.',
    highlight: null,
  },
  {
    text: 'Use a ferramenta ARAR para preparar a terra. Clique no botao "Arar" abaixo.',
    highlight: '#toolPlow',
    action: 'selectPlow',
  },
  {
    text: 'Agora clique em um tile de grama verde para arar a terra.',
    highlight: null,
    waitFor: 'plow',
  },
  {
    text: 'Otimo! Agora selecione PLANTAR e escolha uma semente.',
    highlight: '#toolPlant',
    action: 'selectPlant',
  },
  {
    text: 'Escolha uma semente na barra acima da toolbar e clique na terra arada.',
    highlight: '#seedSelector',
    waitFor: 'plant',
  },
  {
    text: 'As plantas crescem com o tempo. A chuva e a irrigacao aceleram o crescimento!',
    highlight: null,
  },
  {
    text: 'Quando a planta estiver pronta (brilhando), use COLHER para colher e vender no mercado lateral.',
    highlight: '#toolHarvest',
  },
  {
    text: 'Use o painel lateral (→) para ver inventario, mercado e upgrades. Boa sorte, fazendeiro!',
    highlight: '#sidePanelToggle',
  },
];

function initTutorial() {
  if (state.tutorialDone) return;
  state.tutorialStep = 0;
  showTutorialStep();
}

function showTutorialStep() {
  var overlay = document.getElementById('tutorialOverlay');
  if (!overlay) return;

  if (state.tutorialStep >= TUTORIAL_STEPS.length) {
    state.tutorialDone = true;
    overlay.classList.remove('visible');
    clearTutorialHighlights();
    return;
  }

  var step = TUTORIAL_STEPS[state.tutorialStep];
  overlay.classList.add('visible');

  var textEl = document.getElementById('tutorialText');
  var nextBtn = document.getElementById('tutorialNextBtn');
  var skipBtn = document.getElementById('tutorialSkipBtn');

  if (textEl) textEl.textContent = step.text;

  clearTutorialHighlights();
  if (step.highlight) {
    var el = document.querySelector(step.highlight);
    if (el) el.classList.add('tutorial-highlight');
  }

  if (nextBtn) {
    nextBtn.onclick = function () { advanceTutorial(); };
  }
  if (skipBtn) {
    skipBtn.onclick = function () { skipTutorial(); };
  }
}

function advanceTutorial() {
  state.tutorialStep++;
  showTutorialStep();
}

function skipTutorial() {
  state.tutorialDone = true;
  var overlay = document.getElementById('tutorialOverlay');
  if (overlay) overlay.classList.remove('visible');
  clearTutorialHighlights();
}

function clearTutorialHighlights() {
  document.querySelectorAll('.tutorial-highlight').forEach(el => {
    el.classList.remove('tutorial-highlight');
  });
}

function notifyTutorialAction(action) {
  if (state.tutorialDone) return;
  const step = TUTORIAL_STEPS[state.tutorialStep];
  if (step && step.waitFor === action) {
    advanceTutorial();
  }
}
