let particles = [];

function worldToScreen(wx, wy) {
  var cvs = document.getElementById('gameCanvas');
  var sx = (wx + state.camX - cvs.width / 2) * state.zoom + cvs.width / 2;
  var sy = (wy + state.camY - cvs.height / 2) * state.zoom + cvs.height / 2;
  return { x: sx, y: sy };
}

function spawnParticles(type, col, row) {
  const pos = tileToScreen(col, row);
  const screen = worldToScreen(pos.x, pos.y);
  const sx = screen.x;
  const sy = screen.y;

  switch (type) {
    case 'dirt':
      for (let i = 0; i < 8; i++) {
        particles.push({
          type: 'dirt',
          x: sx + (Math.random() - 0.5) * 20,
          y: sy + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 3 - 1,
          gravity: 0.15,
          life: 1,
          decay: 0.03,
          size: 2 + Math.random() * 3,
          color: '#8B7355',
        });
      }
      break;

    case 'water':
      for (let i = 0; i < 6; i++) {
        particles.push({
          type: 'water',
          x: sx + (Math.random() - 0.5) * 20,
          y: sy - 10,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 2 - 1,
          gravity: 0.1,
          life: 1,
          decay: 0.025,
          size: 2 + Math.random() * 2,
          color: '#4FC3F7',
        });
      }
      break;

    case 'harvest':
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i;
        particles.push({
          type: 'sparkle',
          x: sx,
          y: sy - 8,
          vx: Math.cos(angle) * (1 + Math.random()),
          vy: Math.sin(angle) * (1 + Math.random()) - 2,
          gravity: 0.05,
          life: 1,
          decay: 0.02,
          size: 2 + Math.random() * 2,
          color: '#FFD700',
        });
      }
      break;

    case 'plant':
      for (let i = 0; i < 5; i++) {
        particles.push({
          type: 'leaf',
          x: sx + (Math.random() - 0.5) * 10,
          y: sy,
          vx: (Math.random() - 0.5) * 1,
          vy: -Math.random() * 2 - 0.5,
          gravity: 0.02,
          life: 1,
          decay: 0.03,
          size: 3,
          color: '#4CAF50',
        });
      }
      break;

    case 'death':
      for (let i = 0; i < 6; i++) {
        particles.push({
          type: 'leaf',
          x: sx + (Math.random() - 0.5) * 15,
          y: sy - 5,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 1.5 - 0.5,
          gravity: 0.08,
          life: 1,
          decay: 0.02,
          size: 3 + Math.random() * 2,
          color: '#6a5040',
        });
      }
      break;
  }
}

function spawnWeatherParticles() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;

  if (state.weather === 'rainy' || state.weather === 'stormy') {
    const count = state.weather === 'stormy' ? 8 : 3;
    for (let i = 0; i < count; i++) {
      particles.push({
        type: 'rain',
        x: Math.random() * canvas.width,
        y: -10,
        vx: state.weather === 'stormy' ? -3 - Math.random() * 2 : -0.5,
        vy: 8 + Math.random() * 4,
        gravity: 0,
        life: 1,
        decay: 0.015,
        size: state.weather === 'stormy' ? 3 : 2,
        color: state.weather === 'stormy' ? '#6688bb' : '#88aadd',
      });
    }
  }

  // Autumn leaves
  if (CFG.seasons[state.season] === 'outono' && Math.random() < 0.05) {
    particles.push({
      type: 'leaf',
      x: Math.random() * canvas.width,
      y: -10,
      vx: Math.random() * 2 - 1 + Math.sin(Date.now() * 0.001) * 0.5,
      vy: 1 + Math.random(),
      gravity: 0,
      life: 1,
      decay: 0.003,
      size: 4 + Math.random() * 3,
      color: ['#c0622a', '#d4843a', '#b85a20', '#e0963a'][Math.floor(Math.random() * 4)],
    });
  }

  // Winter snow (only when not sunny)
  if (CFG.seasons[state.season] === 'inverno' && state.weather !== 'sunny' && Math.random() < 0.08) {
    particles.push({
      type: 'snow',
      x: Math.random() * canvas.width,
      y: -10,
      vx: Math.sin(Date.now() * 0.0008 + Math.random() * 10) * 0.5,
      vy: 0.5 + Math.random() * 0.8,
      gravity: 0,
      life: 1,
      decay: 0.002,
      size: 2 + Math.random() * 3,
      color: '#ffffff',
    });
  }

  // Spring petals
  if (CFG.seasons[state.season] === 'primavera' && Math.random() < 0.03) {
    particles.push({
      type: 'petal',
      x: Math.random() * canvas.width,
      y: -10,
      vx: Math.sin(Date.now() * 0.001 + Math.random() * 10) * 0.8,
      vy: 0.8 + Math.random() * 0.5,
      gravity: 0,
      life: 1,
      decay: 0.003,
      size: 3 + Math.random() * 2,
      color: ['#ffb7c5', '#ff99aa', '#ffc0cb'][Math.floor(Math.random() * 3)],
    });
  }
}

function updateParticles(dt) {
  const dtSec = dt / 1000;

  spawnWeatherParticles();

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.life -= p.decay;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  // Cap particle count
  if (particles.length > 500) {
    particles.splice(0, particles.length - 500);
  }
}

function drawParticles(ctx) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);

    if (p.type === 'rain') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2);
      ctx.stroke();
    } else if (p.type === 'sparkle') {
      ctx.fillStyle = p.color;
      const s = p.size;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - s);
      ctx.lineTo(p.x + s * 0.3, p.y - s * 0.3);
      ctx.lineTo(p.x + s, p.y);
      ctx.lineTo(p.x + s * 0.3, p.y + s * 0.3);
      ctx.lineTo(p.x, p.y + s);
      ctx.lineTo(p.x - s * 0.3, p.y + s * 0.3);
      ctx.lineTo(p.x - s, p.y);
      ctx.lineTo(p.x - s * 0.3, p.y - s * 0.3);
      ctx.closePath();
      ctx.fill();
    } else if (p.type === 'snow' || p.type === 'petal') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      if (p.type === 'leaf') {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.6, Math.atan2(p.vy, p.vx), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
  }
  ctx.globalAlpha = 1;
}
