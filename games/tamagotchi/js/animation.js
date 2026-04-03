const ANIM_STATES = {
  idle:      { frames: 4, frameMs: 400 },
  eating:    { frames: 6, frameMs: 200 },
  happy:     { frames: 5, frameMs: 250 },
  sleeping:  { frames: 3, frameMs: 800 },
  sick:      { frames: 2, frameMs: 600 },
  hatching:  { frames: 8, frameMs: 300 },
  evolving:  { frames: 10, frameMs: 200 },
  dead:      { frames: 1, frameMs: 0 },
};

let currentAnim = 'idle';
let animFrame = 0;
let animTimer = 0;
let animQueue = [];      // queue of {name, onComplete}
let animOnComplete = null;

function setAnimation(name) {
  if (!ANIM_STATES[name]) return;
  currentAnim = name;
  animFrame = 0;
  animTimer = 0;
  animOnComplete = null;
}

function queueAnimation(name, onComplete) {
  // Play this animation, then return to idle (or call onComplete)
  animQueue.push({ name, onComplete: onComplete || null });
  if (animQueue.length === 1) {
    // Start it immediately if nothing else playing (besides idle)
    if (currentAnim === 'idle' || currentAnim === 'sick' || currentAnim === 'sleeping') {
      const next = animQueue.shift();
      currentAnim = next.name;
      animFrame = 0;
      animTimer = 0;
      animOnComplete = next.onComplete;
    }
  }
}

function updateAnimation(dt) {
  const state = ANIM_STATES[currentAnim];
  if (!state || state.frameMs === 0) return;

  animTimer += dt;
  if (animTimer >= state.frameMs) {
    animTimer -= state.frameMs;
    animFrame++;
    if (animFrame >= state.frames) {
      // Animation cycle complete
      if (animOnComplete) {
        animOnComplete();
        animOnComplete = null;
      }
      // Check queue for next animation
      if (animQueue.length > 0) {
        const next = animQueue.shift();
        currentAnim = next.name;
        animFrame = 0;
        animTimer = 0;
        animOnComplete = next.onComplete;
      } else {
        // Return to default based on game state
        currentAnim = getDefaultAnim();
        animFrame = 0;
      }
    }
  }
}

function getDefaultAnim() {
  if (gameState.isDead) return 'dead';
  if (gameState.isSick) return 'sick';
  return 'idle';
}

function getCurrentAnimFrame() {
  return animFrame;
}

function getCurrentAnim() {
  return currentAnim;
}
