// sprites.js - Canvas 2D drawing functions for Tamagotchi pet game
// All drawing uses Canvas primitives only - no external images
// Canvas logical size: 400x400

// PET_TYPES is defined in pets.js (loaded before this file)

// --- Utility helpers ---

function hexToRgb(color) {
    if (color.startsWith('rgb')) {
        var parts = color.match(/\d+/g);
        return { r: parseInt(parts[0]), g: parseInt(parts[1]), b: parseInt(parts[2]) };
    }
    var r = parseInt(color.slice(1, 3), 16);
    var g = parseInt(color.slice(3, 5), 16);
    var b = parseInt(color.slice(5, 7), 16);
    return { r: r, g: g, b: b };
}

function blendColor(hex1, hex2, t) {
    var c1 = hexToRgb(hex1);
    var c2 = hexToRgb(hex2);
    var r = Math.round(c1.r + (c2.r - c1.r) * t);
    var g = Math.round(c1.g + (c2.g - c1.g) * t);
    var b = Math.round(c1.b + (c2.b - c1.b) * t);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function drawHeart(ctx, cx, cy, size) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.moveTo(0, size * 0.3);
    ctx.bezierCurveTo(-size * 0.5, -size * 0.3, -size, size * 0.1, 0, size);
    ctx.bezierCurveTo(size, size * 0.1, size * 0.5, -size * 0.3, 0, size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawStar(ctx, cx, cy, size) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    var armLen = size;
    var thin = size * 0.25;
    // 4-pointed star / cross sparkle
    ctx.moveTo(0, -armLen);
    ctx.lineTo(thin, -thin);
    ctx.lineTo(armLen, 0);
    ctx.lineTo(thin, thin);
    ctx.lineTo(0, armLen);
    ctx.lineTo(-thin, thin);
    ctx.lineTo(-armLen, 0);
    ctx.lineTo(-thin, -thin);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// --- Background ---

function drawBackground(ctx, w, h) {
    ctx.save();

    // Wall - pastel pink/cream gradient
    var wallGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    wallGrad.addColorStop(0, '#FDE8E0');
    wallGrad.addColorStop(1, '#FFF5EE');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, w, h * 0.6);

    // Floor - light wood
    var floorGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
    floorGrad.addColorStop(0, '#E8C9A0');
    floorGrad.addColorStop(1, '#D4AD78');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);

    // Floor line
    ctx.strokeStyle = '#C89B6E';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.6);
    ctx.lineTo(w, h * 0.6);
    ctx.stroke();

    // Wood plank lines
    ctx.strokeStyle = 'rgba(160, 120, 70, 0.15)';
    ctx.lineWidth = 1;
    for (var py = h * 0.65; py < h; py += 20) {
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(w, py);
        ctx.stroke();
    }

    // Arched window
    var wx = 55;
    var wy = 60;
    var ww = 60;
    var wh = 80;

    // Window shadow
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.beginPath();
    ctx.moveTo(wx - ww / 2 + 3, wy + wh / 2 + 3);
    ctx.lineTo(wx + ww / 2 + 3, wy + wh / 2 + 3);
    ctx.lineTo(wx + ww / 2 + 3, wy - 3);
    ctx.arc(wx + 3, wy - 3, ww / 2, 0, -Math.PI, true);
    ctx.closePath();
    ctx.fill();

    // Window frame (outer)
    ctx.fillStyle = '#F0E0D0';
    ctx.beginPath();
    ctx.moveTo(wx - ww / 2 - 4, wy + wh / 2 + 4);
    ctx.lineTo(wx + ww / 2 + 4, wy + wh / 2 + 4);
    ctx.lineTo(wx + ww / 2 + 4, wy);
    ctx.arc(wx, wy, ww / 2 + 4, 0, -Math.PI, true);
    ctx.closePath();
    ctx.fill();

    // Sky inside window
    var skyGrad = ctx.createLinearGradient(wx, wy - wh / 2, wx, wy + wh / 2);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(1, '#B8E4F9');
    ctx.fillStyle = skyGrad;
    ctx.beginPath();
    ctx.moveTo(wx - ww / 2, wy + wh / 2);
    ctx.lineTo(wx + ww / 2, wy + wh / 2);
    ctx.lineTo(wx + ww / 2, wy);
    ctx.arc(wx, wy, ww / 2, 0, -Math.PI, true);
    ctx.closePath();
    ctx.fill();

    // Sun
    ctx.fillStyle = '#FFE066';
    ctx.beginPath();
    ctx.arc(wx + 12, wy - 12, 10, 0, Math.PI * 2);
    ctx.fill();

    // Sun rays
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1.5;
    for (var ra = 0; ra < Math.PI * 2; ra += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(wx + 12 + Math.cos(ra) * 12, wy - 12 + Math.sin(ra) * 12);
        ctx.lineTo(wx + 12 + Math.cos(ra) * 16, wy - 12 + Math.sin(ra) * 16);
        ctx.stroke();
    }

    // Small cloud
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(wx - 10, wy + 5, 6, 0, Math.PI * 2);
    ctx.arc(wx - 3, wy + 2, 7, 0, Math.PI * 2);
    ctx.arc(wx + 5, wy + 5, 5, 0, Math.PI * 2);
    ctx.fill();

    // Window crossbars
    ctx.strokeStyle = '#E0CFC0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wx, wy - ww / 2);
    ctx.lineTo(wx, wy + wh / 2);
    ctx.moveTo(wx - ww / 2, wy + 8);
    ctx.lineTo(wx + ww / 2, wy + 8);
    ctx.stroke();

    // Small potted plant on the floor near window
    var px = 58;
    var pfY = h * 0.6;

    // Pot
    ctx.fillStyle = '#D4836A';
    ctx.beginPath();
    ctx.moveTo(px - 10, pfY - 18);
    ctx.lineTo(px - 8, pfY);
    ctx.lineTo(px + 8, pfY);
    ctx.lineTo(px + 10, pfY - 18);
    ctx.closePath();
    ctx.fill();

    // Pot rim
    ctx.fillStyle = '#C4735A';
    ctx.fillRect(px - 11, pfY - 20, 22, 4);

    // Plant leaves
    ctx.fillStyle = '#7CB87C';
    ctx.beginPath();
    ctx.ellipse(px, pfY - 30, 5, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px - 5, pfY - 26, 4, 9, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px + 5, pfY - 26, 4, 9, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6DA86D';
    ctx.beginPath();
    ctx.ellipse(px + 2, pfY - 32, 3, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// --- Egg ---

function drawEgg(ctx, x, y, frame, petType, crackLevelOverride) {
    ctx.save();

    var pt = PET_TYPES[petType] || PET_TYPES.cat;
    var eggW = 38;
    var eggH = 50;

    // Wobble based on frame
    var wobbleAngles = [0, 0.06, 0, -0.06];
    var angle = wobbleAngles[frame % 4];

    ctx.translate(x, y);
    ctx.rotate(angle);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.ellipse(2, eggH / 2 + 2, eggW / 2 - 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Egg body with gradient
    var eggGrad = ctx.createRadialGradient(-5, -8, 3, 0, 0, eggH / 1.5);
    eggGrad.addColorStop(0, '#FFFFFF');
    eggGrad.addColorStop(0.4, blendColor('#FFF8F0', pt.bodyColor, 0.2));
    eggGrad.addColorStop(1, blendColor('#F0E0D0', pt.bodyColor, 0.3));
    ctx.fillStyle = eggGrad;

    // Egg shape using bezier
    ctx.beginPath();
    ctx.moveTo(0, -eggH / 2);
    ctx.bezierCurveTo(eggW / 2 + 4, -eggH / 3, eggW / 2, eggH / 3, 0, eggH / 2);
    ctx.bezierCurveTo(-eggW / 2, eggH / 3, -eggW / 2 - 4, -eggH / 3, 0, -eggH / 2);
    ctx.closePath();
    ctx.fill();

    // Outline
    ctx.strokeStyle = 'rgba(180,150,120,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Speckles
    ctx.fillStyle = blendColor(pt.color, '#FFFFFF', 0.5);
    var speckles = [
        [-8, -10, 2], [6, -5, 1.5], [-3, 8, 2], [10, 3, 1.5],
        [-10, 2, 1.5], [4, 12, 1.8], [-6, 15, 1.2], [8, -14, 1.3]
    ];
    for (var i = 0; i < speckles.length; i++) {
        ctx.beginPath();
        ctx.arc(speckles[i][0], speckles[i][1], speckles[i][2], 0, Math.PI * 2);
        ctx.fill();
    }

    // Crack lines based on crackLevelOverride or frame
    var crackLevel = (crackLevelOverride !== undefined) ? crackLevelOverride : (frame % 4);
    ctx.strokeStyle = 'rgba(120,100,80,0.5)';
    ctx.lineWidth = 1.2;

    if (crackLevel >= 1) {
        ctx.beginPath();
        ctx.moveTo(-2, 2);
        ctx.lineTo(-6, 6);
        ctx.lineTo(-3, 10);
        ctx.stroke();
    }
    if (crackLevel >= 2) {
        ctx.beginPath();
        ctx.moveTo(3, 0);
        ctx.lineTo(7, 5);
        ctx.lineTo(4, 9);
        ctx.lineTo(8, 13);
        ctx.stroke();
    }
    if (crackLevel >= 3) {
        ctx.beginPath();
        ctx.moveTo(-5, -3);
        ctx.lineTo(-10, 2);
        ctx.lineTo(-7, 7);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(1, -5);
        ctx.lineTo(5, -1);
        ctx.lineTo(2, 4);
        ctx.stroke();
    }

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(-7, -12, 4, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// --- Pet drawing ---

function drawPet(ctx, x, y, frame, petType, stage, action) {
    ctx.save();
    ctx.translate(x, y);

    var pt = PET_TYPES[petType] || PET_TYPES.cat;
    var bodySize, eyeSize, limbSize;

    if (stage === 'baby') {
        bodySize = 40;
        eyeSize = 12;
        limbSize = 12;
    } else if (stage === 'teen') {
        bodySize = 50;
        eyeSize = 13;
        limbSize = 16;
    } else {
        bodySize = 65;
        eyeSize = 16;
        limbSize = 20;
    }

    // Bounce for idle/default
    var bounceOffsets = [0, -2, -4, -2];
    var bounceY = 0;
    if (!action || action === 'idle' || action === 'happy') {
        bounceY = bounceOffsets[frame % 4];
    }

    // Eating lean
    var leanX = 0;
    if (action === 'eating') {
        leanX = 3;
        bounceY = 0;
    }

    // Sick: no bounce
    if (action === 'sick') {
        bounceY = 0;
    }
    if (action === 'sleeping') {
        bounceY = 0;
    }

    ctx.translate(leanX, bounceY);

    // Shadow under pet
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.ellipse(0, bodySize + limbSize - 2, bodySize * 0.8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sick: slightly desaturated but still visible
    var bodyColor = pt.bodyColor;
    var accentColor = pt.color;
    if (action === 'sick') {
        bodyColor = blendColor(pt.bodyColor, '#D0D0D0', 0.2);
        accentColor = blendColor(pt.color, '#AAAAAA', 0.2);
    }

    // --- Limbs (drawn behind body) ---
    ctx.fillStyle = accentColor;

    // Feet/legs
    var legSpread = bodySize * 0.5;
    // Left leg
    ctx.beginPath();
    ctx.ellipse(-legSpread, bodySize - 2, limbSize * 0.6, limbSize * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Right leg
    ctx.beginPath();
    ctx.ellipse(legSpread, bodySize - 2, limbSize * 0.6, limbSize * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Arms/front paws
    var armY = bodySize * 0.2;
    ctx.beginPath();
    ctx.ellipse(-bodySize - limbSize * 0.3, armY, limbSize * 0.5, limbSize * 0.7, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(bodySize + limbSize * 0.3, armY, limbSize * 0.5, limbSize * 0.7, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // --- Body ---
    var bodyGrad = ctx.createRadialGradient(-bodySize * 0.2, -bodySize * 0.2, bodySize * 0.1, 0, 0, bodySize);
    bodyGrad.addColorStop(0, blendColor('#FFFFFF', bodyColor, 0.3));
    bodyGrad.addColorStop(0.5, bodyColor);
    bodyGrad.addColorStop(1, blendColor(bodyColor, accentColor, 0.3));

    ctx.fillStyle = bodyGrad;
    if (stage === 'adult') {
        ctx.beginPath();
        ctx.ellipse(0, 0, bodySize * 0.9, bodySize, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = blendColor(accentColor, '#000000', 0.15);
        ctx.lineWidth = 1;
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.arc(0, 0, bodySize, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = blendColor(accentColor, '#000000', 0.15);
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Belly patch
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, bodySize * 0.2, bodySize * 0.5, bodySize * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- Pet-type features ---
    _drawPetFeatures(ctx, petType, bodySize, accentColor, stage);

    // --- Face ---
    _drawPetFace(ctx, eyeSize, bodySize, action, frame, petType, stage);

    ctx.restore();

    // --- Action effects drawn outside the pet transform ---
    if (action === 'eating') {
        drawFood(ctx, x + bodySize + 20 + leanX, y + bodySize - 5 + bounceY);
    }
    if (action === 'happy') {
        drawHearts(ctx, x, y - bodySize - 15, frame);
    }
    if (action === 'sleeping') {
        drawZzz(ctx, x + bodySize, y - bodySize - 10, frame);
    }
    if (action === 'sick') {
        // Sweat drop
        ctx.save();
        ctx.fillStyle = '#88CCEE';
        ctx.beginPath();
        ctx.moveTo(x + bodySize + 3, y - bodySize * 0.5);
        ctx.quadraticCurveTo(x + bodySize + 7, y - bodySize * 0.3, x + bodySize + 3, y - bodySize * 0.1);
        ctx.quadraticCurveTo(x + bodySize - 1, y - bodySize * 0.3, x + bodySize + 3, y - bodySize * 0.5);
        ctx.fill();
        ctx.restore();
    }
}

function _drawPetFeatures(ctx, petType, bodySize, accentColor, stage) {
    ctx.save();

    var earScale = stage === 'baby' ? 0.7 : stage === 'teen' ? 0.85 : 1.0;

    if (petType === 'cat') {
        // Triangle ears
        ctx.fillStyle = accentColor;
        var earH = bodySize * 0.8 * earScale;
        var earW = bodySize * 0.4 * earScale;

        // Left ear
        ctx.beginPath();
        ctx.moveTo(-bodySize * 0.6, -bodySize * 0.6);
        ctx.lineTo(-bodySize * 0.6 - earW / 2, -bodySize * 0.6 - earH);
        ctx.lineTo(-bodySize * 0.6 + earW, -bodySize * 0.6);
        ctx.closePath();
        ctx.fill();
        // Inner ear
        ctx.fillStyle = '#FFB0B0';
        ctx.beginPath();
        ctx.moveTo(-bodySize * 0.6, -bodySize * 0.6 - 1);
        ctx.lineTo(-bodySize * 0.6 - earW * 0.2, -bodySize * 0.6 - earH * 0.6);
        ctx.lineTo(-bodySize * 0.6 + earW * 0.5, -bodySize * 0.6 - 1);
        ctx.closePath();
        ctx.fill();

        // Right ear
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(bodySize * 0.6, -bodySize * 0.6);
        ctx.lineTo(bodySize * 0.6 + earW / 2, -bodySize * 0.6 - earH);
        ctx.lineTo(bodySize * 0.6 - earW, -bodySize * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FFB0B0';
        ctx.beginPath();
        ctx.moveTo(bodySize * 0.6, -bodySize * 0.6 - 1);
        ctx.lineTo(bodySize * 0.6 + earW * 0.2, -bodySize * 0.6 - earH * 0.6);
        ctx.lineTo(bodySize * 0.6 - earW * 0.5, -bodySize * 0.6 - 1);
        ctx.closePath();
        ctx.fill();

        // Tail - curved
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = bodySize * 0.15;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bodySize * 0.8, bodySize * 0.2);
        ctx.quadraticCurveTo(bodySize * 1.8, -bodySize * 0.3, bodySize * 1.5, -bodySize * 0.9);
        ctx.stroke();

        // Whiskers
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        var whiskLen = bodySize * 0.6;
        ctx.beginPath();
        ctx.moveTo(-bodySize * 0.3, bodySize * 0.05);
        ctx.lineTo(-bodySize * 0.3 - whiskLen, bodySize * 0.05 - 3);
        ctx.moveTo(-bodySize * 0.3, bodySize * 0.15);
        ctx.lineTo(-bodySize * 0.3 - whiskLen, bodySize * 0.15 + 3);
        ctx.moveTo(bodySize * 0.3, bodySize * 0.05);
        ctx.lineTo(bodySize * 0.3 + whiskLen, bodySize * 0.05 - 3);
        ctx.moveTo(bodySize * 0.3, bodySize * 0.15);
        ctx.lineTo(bodySize * 0.3 + whiskLen, bodySize * 0.15 + 3);
        ctx.stroke();

    } else if (petType === 'dog') {
        // Floppy rounded ears
        ctx.fillStyle = accentColor;
        var dEarW = bodySize * 0.4 * earScale;
        var dEarH = bodySize * 0.7 * earScale;

        // Left ear (floppy)
        ctx.beginPath();
        ctx.ellipse(-bodySize * 0.7, -bodySize * 0.15, dEarW * 0.5, dEarH, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Right ear
        ctx.beginPath();
        ctx.ellipse(bodySize * 0.7, -bodySize * 0.15, dEarW * 0.5, dEarH, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Wagging tail (short)
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = bodySize * 0.15;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bodySize * 0.7, bodySize * 0.1);
        ctx.quadraticCurveTo(bodySize * 1.4, -bodySize * 0.5, bodySize * 1.2, -bodySize * 0.7);
        ctx.stroke();

        // Tongue
        ctx.fillStyle = '#FF8888';
        ctx.beginPath();
        ctx.ellipse(2, bodySize * 0.35, 3 * earScale, 5 * earScale, 0, 0, Math.PI * 2);
        ctx.fill();

    } else if (petType === 'bunny') {
        // Long oval ears sitting on top of head
        ctx.fillStyle = accentColor;
        var bEarH = bodySize * 1.1 * earScale;
        var bEarW = bodySize * 0.28 * earScale;
        var earBaseY = -bodySize * 0.7;

        // Left ear (upright)
        ctx.beginPath();
        ctx.ellipse(-bodySize * 0.25, earBaseY - bEarH * 0.45, bEarW, bEarH * 0.5, -0.1, 0, Math.PI * 2);
        ctx.fill();
        // Inner
        ctx.fillStyle = '#FFB8C6';
        ctx.beginPath();
        ctx.ellipse(-bodySize * 0.25, earBaseY - bEarH * 0.45, bEarW * 0.5, bEarH * 0.38, -0.1, 0, Math.PI * 2);
        ctx.fill();

        // Right ear (slightly flopped)
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.ellipse(bodySize * 0.25, earBaseY - bEarH * 0.35, bEarW, bEarH * 0.5, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFB8C6';
        ctx.beginPath();
        ctx.ellipse(bodySize * 0.25, earBaseY - bEarH * 0.35, bEarW * 0.5, bEarH * 0.38, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Cotton ball tail
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(bodySize * 0.8, bodySize * 0.3, bodySize * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(220,220,220,0.5)';
        ctx.beginPath();
        ctx.arc(bodySize * 0.8 + 1, bodySize * 0.3 + 1, bodySize * 0.12, 0, Math.PI * 2);
        ctx.fill();

    } else if (petType === 'chick') {
        // Beak
        ctx.fillStyle = '#FF8C00';
        var beakSize = bodySize * 0.25 * earScale;
        ctx.beginPath();
        ctx.moveTo(0, bodySize * 0.1);
        ctx.lineTo(-beakSize, bodySize * 0.1 + beakSize);
        ctx.lineTo(beakSize, bodySize * 0.1 + beakSize);
        ctx.closePath();
        ctx.fill();

        // Wing nubs
        ctx.fillStyle = blendColor(accentColor, '#FFFFFF', 0.2);
        // Left wing
        ctx.beginPath();
        ctx.ellipse(-bodySize * 0.85, bodySize * 0.1, bodySize * 0.3, bodySize * 0.45 * earScale, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // Right wing
        ctx.beginPath();
        ctx.ellipse(bodySize * 0.85, bodySize * 0.1, bodySize * 0.3, bodySize * 0.45 * earScale, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Small crest/tuft on top
        ctx.fillStyle = '#FFB700';
        ctx.beginPath();
        ctx.ellipse(0, -bodySize - 3, 3, 6 * earScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(3, -bodySize - 1, 2, 5 * earScale, 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function _drawPetFace(ctx, eyeSize, bodySize, action, frame, petType, stage) {
    ctx.save();

    var eyeSpacing = bodySize * 0.35;
    var eyeY = -bodySize * 0.15;

    if (action === 'sleeping') {
        // Closed eyes (horizontal lines)
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-eyeSpacing - eyeSize * 0.5, eyeY);
        ctx.lineTo(-eyeSpacing + eyeSize * 0.5, eyeY);
        ctx.moveTo(eyeSpacing - eyeSize * 0.5, eyeY);
        ctx.lineTo(eyeSpacing + eyeSize * 0.5, eyeY);
        ctx.stroke();

        // Small mouth
        ctx.beginPath();
        ctx.arc(0, eyeY + eyeSize * 1.5, 2, 0, Math.PI);
        ctx.stroke();

        // Blush
        ctx.fillStyle = 'rgba(255,150,150,0.3)';
        ctx.beginPath();
        ctx.ellipse(-eyeSpacing - 2, eyeY + eyeSize, eyeSize * 0.6, eyeSize * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeSpacing + 2, eyeY + eyeSize, eyeSize * 0.6, eyeSize * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

    } else if (action === 'happy') {
        // Happy ^_^ eyes
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(-eyeSpacing, eyeY + 2, eyeSize * 0.5, Math.PI, 0, true);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(eyeSpacing, eyeY + 2, eyeSize * 0.5, Math.PI, 0, true);
        ctx.stroke();

        // Open smile
        ctx.beginPath();
        ctx.arc(0, eyeY + eyeSize * 1.2, eyeSize * 0.6, 0, Math.PI);
        ctx.stroke();

        // Blush
        ctx.fillStyle = 'rgba(255,130,130,0.35)';
        ctx.beginPath();
        ctx.ellipse(-eyeSpacing - 3, eyeY + eyeSize * 0.7, eyeSize * 0.7, eyeSize * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeSpacing + 3, eyeY + eyeSize * 0.7, eyeSize * 0.7, eyeSize * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

    } else if (action === 'sick') {
        // Droopy half-closed eyes
        ctx.fillStyle = '#333333';
        // Left eye - half
        ctx.beginPath();
        ctx.arc(-eyeSpacing, eyeY, eyeSize * 0.6, 0.3, Math.PI - 0.3);
        ctx.closePath();
        ctx.fill();
        // Right eye - half
        ctx.beginPath();
        ctx.arc(eyeSpacing, eyeY, eyeSize * 0.6, 0.3, Math.PI - 0.3);
        ctx.closePath();
        ctx.fill();

        // Frown
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, eyeY + eyeSize * 2.2, eyeSize * 0.5, Math.PI, 0, true);
        ctx.stroke();

    } else if (action === 'eating') {
        // Eyes looking at food
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(-eyeSpacing + 1, eyeY, eyeSize * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSpacing + 1, eyeY, eyeSize * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // White highlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-eyeSpacing + eyeSize * 0.2 + 1, eyeY - eyeSize * 0.2, eyeSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSpacing + eyeSize * 0.2 + 1, eyeY - eyeSize * 0.2, eyeSize * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Open mouth
        ctx.fillStyle = '#FF8888';
        ctx.beginPath();
        ctx.arc(0, eyeY + eyeSize * 1.5, eyeSize * 0.5, 0, Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();

    } else {
        // Default/idle - mood-based face from gameState
        var hunger = (typeof gameState !== 'undefined') ? gameState.hunger : 100;
        var happiness = (typeof gameState !== 'undefined') ? gameState.happiness : 100;
        var mood = (hunger + happiness) / 2;

        if (mood < 20) {
            // Very sad: teary droopy eyes, frown
            ctx.fillStyle = '#333333';
            ctx.beginPath();
            ctx.arc(-eyeSpacing, eyeY, eyeSize * 0.55, 0.4, Math.PI - 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeSpacing, eyeY, eyeSize * 0.55, 0.4, Math.PI - 0.4);
            ctx.closePath();
            ctx.fill();
            // Tear drop
            ctx.fillStyle = '#64B5F6';
            ctx.beginPath();
            ctx.arc(-eyeSpacing - eyeSize * 0.4, eyeY + eyeSize * 0.7, eyeSize * 0.18, 0, Math.PI * 2);
            ctx.fill();
            // Frown
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, eyeY + eyeSize * 2.2, eyeSize * 0.4, Math.PI + 0.3, -0.3);
            ctx.stroke();
        } else if (mood < 40) {
            // Unhappy: smaller eyes, slight frown
            ctx.fillStyle = '#333333';
            ctx.beginPath();
            ctx.arc(-eyeSpacing, eyeY, eyeSize * 0.55, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeSpacing, eyeY, eyeSize * 0.55, 0, Math.PI * 2);
            ctx.fill();
            // Small highlights
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(-eyeSpacing + eyeSize * 0.15, eyeY - eyeSize * 0.15, eyeSize * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeSpacing + eyeSize * 0.15, eyeY - eyeSize * 0.15, eyeSize * 0.2, 0, Math.PI * 2);
            ctx.fill();
            // Flat/slight frown
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-eyeSize * 0.3, eyeY + eyeSize * 1.4);
            ctx.lineTo(eyeSize * 0.3, eyeY + eyeSize * 1.4);
            ctx.stroke();
        } else if (mood < 65) {
            // Neutral: normal eyes, straight mouth
            ctx.fillStyle = '#333333';
            ctx.beginPath();
            ctx.arc(-eyeSpacing, eyeY, eyeSize * 0.65, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeSpacing, eyeY, eyeSize * 0.65, 0, Math.PI * 2);
            ctx.fill();
            // Highlights
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(-eyeSpacing + eyeSize * 0.2, eyeY - eyeSize * 0.2, eyeSize * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeSpacing + eyeSize * 0.2, eyeY - eyeSize * 0.2, eyeSize * 0.25, 0, Math.PI * 2);
            ctx.fill();
            // Tiny smile
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, eyeY + eyeSize * 1.2, eyeSize * 0.3, 0.2, Math.PI - 0.2);
            ctx.stroke();
        } else {
            // Happy: big sparkly eyes, smile, blush
            ctx.fillStyle = '#333333';
            ctx.beginPath();
            ctx.arc(-eyeSpacing, eyeY, eyeSize * 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeSpacing, eyeY, eyeSize * 0.7, 0, Math.PI * 2);
            ctx.fill();
            // Big sparkly highlights
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(-eyeSpacing + eyeSize * 0.2, eyeY - eyeSize * 0.2, eyeSize * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeSpacing + eyeSize * 0.2, eyeY - eyeSize * 0.2, eyeSize * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(-eyeSpacing - eyeSize * 0.15, eyeY + eyeSize * 0.15, eyeSize * 0.12, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeSpacing - eyeSize * 0.15, eyeY + eyeSize * 0.15, eyeSize * 0.12, 0, Math.PI * 2);
            ctx.fill();
            // Nice smile
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, eyeY + eyeSize * 1.2, eyeSize * 0.4, 0.1, Math.PI - 0.1);
            ctx.stroke();
            // Blush
            ctx.fillStyle = 'rgba(255,150,150,0.2)';
            ctx.beginPath();
            ctx.ellipse(-eyeSpacing - 2, eyeY + eyeSize * 0.6, eyeSize * 0.55, eyeSize * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(eyeSpacing + 2, eyeY + eyeSize * 0.6, eyeSize * 0.55, eyeSize * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Nose (not for chick)
    if (petType !== 'chick' && action !== 'eating') {
        ctx.fillStyle = petType === 'dog' ? '#333333' : '#FFB0B0';
        var noseSize = eyeSize * 0.2;
        ctx.beginPath();
        if (petType === 'dog') {
            ctx.ellipse(0, eyeY + eyeSize * 0.6, noseSize * 1.5, noseSize, 0, 0, Math.PI * 2);
        } else {
            ctx.moveTo(0, eyeY + eyeSize * 0.4);
            ctx.lineTo(-noseSize, eyeY + eyeSize * 0.6);
            ctx.lineTo(noseSize, eyeY + eyeSize * 0.6);
            ctx.closePath();
        }
        ctx.fill();
    }

    ctx.restore();
}

// --- Poop ---

function drawPoop(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Stink lines
    ctx.strokeStyle = 'rgba(100,100,50,0.3)';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    var stinkOffsets = [-5, 2, 8];
    for (var i = 0; i < stinkOffsets.length; i++) {
        ctx.beginPath();
        ctx.moveTo(stinkOffsets[i], -14);
        ctx.quadraticCurveTo(stinkOffsets[i] - 2, -18, stinkOffsets[i] + 1, -22);
        ctx.stroke();
    }

    // Bottom layer
    ctx.fillStyle = '#8B6508';
    ctx.beginPath();
    ctx.ellipse(0, 8, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6B4E06';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Middle layer
    ctx.fillStyle = '#9B7518';
    ctx.beginPath();
    ctx.ellipse(0, 2, 8, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6B4E06';
    ctx.stroke();

    // Top layer
    ctx.fillStyle = '#A08020';
    ctx.beginPath();
    ctx.ellipse(0, -3, 5.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6B4E06';
    ctx.stroke();

    // Tip/point
    ctx.fillStyle = '#A08020';
    ctx.beginPath();
    ctx.moveTo(-2, -6);
    ctx.quadraticCurveTo(0, -12, 2, -6);
    ctx.fill();
    ctx.strokeStyle = '#6B4E06';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.ellipse(-3, -3, 2, 1.5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// --- Food ---

function drawFood(ctx, x, y, foodType) {
    ctx.save();
    ctx.translate(x, y);

    if (foodType === 'fruit') {
        // Apple
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.arc(0, 2, 10, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(-3, -1, 4, 0, Math.PI * 2);
        ctx.fill();
        // Stem
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(1, -12);
        ctx.stroke();
        // Leaf
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.ellipse(4, -10, 5, 3, 0.5, 0, Math.PI * 2);
        ctx.fill();
    } else if (foodType === 'cake') {
        // Cake slice
        ctx.fillStyle = '#FFE0B2';
        ctx.fillRect(-10, -2, 20, 14);
        // Frosting top
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(-10, -2, 20, 5);
        // Cherry
        ctx.fillStyle = '#FF1744';
        ctx.beginPath();
        ctx.arc(0, -5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(-1, -6, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Stem
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(2, -12);
        ctx.stroke();
    } else if (foodType === 'salad') {
        // Bowl
        ctx.fillStyle = '#A5D6A7';
        ctx.beginPath();
        ctx.ellipse(0, 4, 14, 8, 0, 0, Math.PI);
        ctx.fill();
        // Lettuce leaves
        ctx.fillStyle = '#66BB6A';
        ctx.beginPath();
        ctx.ellipse(-5, -1, 7, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#81C784';
        ctx.beginPath();
        ctx.ellipse(4, -2, 6, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        // Tomato slice
        ctx.fillStyle = '#EF5350';
        ctx.beginPath();
        ctx.arc(0, -3, 4, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Default: meat/bowl (original design)
        // Bowl shadow
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.beginPath();
        ctx.ellipse(1, 7, 16, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Bowl body
        ctx.fillStyle = '#A8D8EA';
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.quadraticCurveTo(-12, 12, 0, 12);
        ctx.quadraticCurveTo(12, 12, 14, 0);
        ctx.closePath();
        ctx.fill();
        // Bowl rim
        ctx.fillStyle = '#7EC8E3';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Bowl inner
        ctx.fillStyle = '#C8E6F0';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Food pellets
        var pelletColors = ['#FF6B6B', '#FFB347', '#77DD77', '#FFD700', '#FF8888'];
        var pellets = [
            [-6, -1, 2.2], [-2, -2, 2.5], [3, -1, 2.2], [7, -1.5, 2],
            [-4, -3, 2], [1, -3.5, 2.3], [5, -2.5, 1.8], [-1, -1, 2]
        ];
        for (var i = 0; i < pellets.length; i++) {
            ctx.fillStyle = pelletColors[i % pelletColors.length];
            ctx.beginPath();
            ctx.arc(pellets[i][0], pellets[i][1], pellets[i][2], 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

// --- Hearts ---

function drawHearts(ctx, x, y, frame) {
    ctx.save();

    var heartData = [
        { dx: -10, size: 5, speed: 1.0 },
        { dx: 5,   size: 4, speed: 0.7 },
        { dx: 15,  size: 3.5, speed: 1.3 }
    ];

    for (var i = 0; i < heartData.length; i++) {
        var h = heartData[i];
        var progress = ((frame * 0.25 + i * 0.3) % 1);
        var hx = x + h.dx + Math.sin(progress * Math.PI * 2) * 3;
        var hy = y - progress * 30;
        var alpha = 1 - progress;

        ctx.fillStyle = 'rgba(255,' + (80 + i * 30) + ',' + (100 + i * 20) + ',' + alpha + ')';
        drawHeart(ctx, hx, hy, h.size);
    }

    ctx.restore();
}

// --- Sparkles ---

function drawSparkles(ctx, x, y, frame) {
    ctx.save();

    var sparkleData = [
        { dx: -15, dy: -5 },
        { dx: 10, dy: -15 },
        { dx: 20, dy: 5 },
        { dx: -8, dy: 10 }
    ];

    for (var i = 0; i < sparkleData.length; i++) {
        var s = sparkleData[i];
        var progress = ((frame * 0.3 + i * 0.25) % 1);
        var scale = Math.sin(progress * Math.PI);
        var alpha = scale;

        ctx.fillStyle = 'rgba(255,255,' + (150 + Math.floor(i * 30)) + ',' + alpha + ')';
        ctx.save();
        ctx.translate(x + s.dx, y + s.dy);
        ctx.scale(scale, scale);
        drawStar(ctx, 0, 0, 5);
        ctx.restore();
    }

    ctx.restore();
}

// --- Zzz ---

function drawZzz(ctx, x, y, frame) {
    ctx.save();

    var letters = [
        { size: 8,  offset: 0 },
        { size: 11, offset: 1 },
        { size: 14, offset: 2 }
    ];

    for (var i = 0; i < letters.length; i++) {
        var z = letters[i];
        var progress = ((frame * 0.2 + z.offset * 0.3) % 1);
        var zx = x + i * 12 + progress * 5;
        var zy = y - i * 12 - progress * 10;
        var alpha = 1 - progress * 0.5;

        ctx.font = 'bold ' + z.size + 'px sans-serif';
        ctx.fillStyle = 'rgba(100,120,180,' + alpha + ')';
        ctx.fillText('Z', zx, zy);
    }

    ctx.restore();
}

// --- Stats bar ---

function drawStatsBar(ctx, x, y, w, h, value, color) {
    ctx.save();

    var radius = h / 2;
    var clampedValue = Math.max(0, Math.min(100, value));
    var fillW = (w - 2) * (clampedValue / 100);

    // Background rounded rect
    ctx.fillStyle = '#3A3A4A';
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.arc(x + w - radius, y + radius, radius, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(x + radius, y + h);
    ctx.arc(x + radius, y + radius, radius, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
    ctx.fill();

    // Fill portion
    if (fillW > 2) {
        var fillRadius = Math.min(radius - 1, fillW / 2);
        var fx = x + 1;
        var fy = y + 1;
        var fh = h - 2;
        var fr = fh / 2;

        var grad = ctx.createLinearGradient(fx, fy, fx, fy + fh);
        grad.addColorStop(0, blendColor(color, '#FFFFFF', 0.3));
        grad.addColorStop(0.5, color);
        grad.addColorStop(1, blendColor(color, '#000000', 0.2));

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(fx + fr, fy);
        ctx.lineTo(fx + fillW - fillRadius, fy);
        ctx.arc(fx + fillW - fillRadius, fy + fr, fillRadius, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(fx + fr, fy + fh);
        ctx.arc(fx + fr, fy + fr, fr, Math.PI / 2, -Math.PI / 2);
        ctx.closePath();
        ctx.fill();

        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.rect(fx + fr, fy + 1, fillW - fr - fillRadius, fh * 0.35);
        ctx.fill();
    }

    ctx.restore();
}

// --- Death / angel scene ---

function drawDeathScene(ctx, x, y, petType) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = 0.5;

    var pt = PET_TYPES[petType] || PET_TYPES.cat;
    var bodySize = 40;

    // Ghost glow
    ctx.fillStyle = 'rgba(200,220,255,0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, bodySize + 12, 0, Math.PI * 2);
    ctx.fill();

    // Pale body
    var paleBody = blendColor(pt.bodyColor, '#FFFFFF', 0.6);
    ctx.fillStyle = paleBody;
    ctx.beginPath();
    ctx.arc(0, 0, bodySize, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    // Left wing
    ctx.beginPath();
    ctx.moveTo(-bodySize * 0.6, -bodySize * 0.2);
    ctx.quadraticCurveTo(-bodySize * 1.8, -bodySize * 0.8, -bodySize * 1.4, bodySize * 0.3);
    ctx.quadraticCurveTo(-bodySize * 0.8, bodySize * 0.1, -bodySize * 0.6, -bodySize * 0.2);
    ctx.fill();
    // Right wing
    ctx.beginPath();
    ctx.moveTo(bodySize * 0.6, -bodySize * 0.2);
    ctx.quadraticCurveTo(bodySize * 1.8, -bodySize * 0.8, bodySize * 1.4, bodySize * 0.3);
    ctx.quadraticCurveTo(bodySize * 0.8, bodySize * 0.1, bodySize * 0.6, -bodySize * 0.2);
    ctx.fill();

    // Halo
    ctx.strokeStyle = '#FFE066';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, -bodySize - 8, 12, 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Halo glow
    ctx.strokeStyle = 'rgba(255,224,102,0.3)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, -bodySize - 8, 13, 5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Peaceful closed eyes
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    var eyeSpacing = bodySize * 0.3;
    var eyeY = -bodySize * 0.1;
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing - 4, eyeY);
    ctx.lineTo(-eyeSpacing + 4, eyeY);
    ctx.moveTo(eyeSpacing - 4, eyeY);
    ctx.lineTo(eyeSpacing + 4, eyeY);
    ctx.stroke();

    // Small smile
    ctx.beginPath();
    ctx.arc(0, eyeY + 7, 3, 0.1, Math.PI - 0.1);
    ctx.stroke();

    ctx.restore();
}
