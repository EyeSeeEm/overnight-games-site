// Spice Route - A Portuguese Trading Adventure - POLISHED VERSION
// Enhanced with particles, animations, sound, and visual polish
// Using global kaplay from CDN

const k = kaplay({
  width: 800,
  height: 500,
  scale: 1.5,
  background: [26, 58, 92],
  crisp: true,
  pixelDensity: 1,
});

// ============================================
// AUDIO SYSTEM (Web Audio API)
// ============================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type, volume = 0.3) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(volume, now);

  switch (type) {
    case 'coin':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1000, now + 0.05);
      osc.frequency.setValueAtTime(1200, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    case 'buy':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(500, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    case 'sell':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.05);
      osc.frequency.setValueAtTime(1000, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
      break;
    case 'sail':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.3);
      osc.frequency.linearRampToValueAtTime(100, now + 0.6);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
      break;
    case 'storm':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.5);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
      break;
    case 'pirate':
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.setValueAtTime(150, now + 0.1);
      osc.frequency.setValueAtTime(100, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    case 'success':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.1);
      osc.frequency.setValueAtTime(784, now + 0.2);
      osc.frequency.setValueAtTime(1047, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
      break;
    case 'fail':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
      break;
    case 'click':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;
  }
}

// ============================================
// ENHANCED COLOR PALETTE (Age of Sail theme)
// ============================================
const COLORS = {
  bg: [26, 58, 92],
  bgDark: [13, 31, 48],
  bgLight: [40, 80, 120],
  gold: [255, 215, 80],
  goldDark: [200, 160, 40],
  parchment: [245, 230, 211],
  parchmentDark: [212, 165, 116],
  navy: [26, 58, 92],
  navyLight: [50, 90, 130],
  red: [180, 60, 60],
  green: [60, 140, 80],
  white: [255, 255, 255],
  text: [60, 50, 40],
  textLight: [100, 90, 80],
  ocean: [40, 80, 130],
  oceanLight: [60, 110, 160],
};

// ============================================
// GAME CONSTANTS & DATA
// ============================================
const STARTING_YEAR = 1498;
const ENDING_YEAR = 1520;
const STARTING_DUCATS = 500;

const tradeGoods = {
  textiles: { name: 'Textiles', buyPrice: 10, sellPrices: { cape_verde: 15, gold_coast: 20, mombasa: 25, calicut: 30, ceylon: 30, malacca: 35 }, color: [150, 100, 200] },
  glassware: { name: 'Glassware', buyPrice: 20, sellPrices: { cape_verde: 30, gold_coast: 40, mombasa: 50, calicut: 60, ceylon: 60, malacca: 70 }, color: [100, 200, 220] },
  weapons: { name: 'Weapons', buyPrice: 40, sellPrices: { cape_verde: 60, gold_coast: 80, mombasa: 100, calicut: 120, ceylon: 120, malacca: 140 }, color: [180, 180, 180] }
};

const spices = {
  pepper: { name: 'Pepper', sellPrice: 25, buyPrices: { cape_verde: 15, gold_coast: 12, mombasa: 10, calicut: 8, ceylon: 8, malacca: 6 }, color: [80, 60, 40] },
  cinnamon: { name: 'Cinnamon', sellPrice: 40, buyPrices: { gold_coast: 25, mombasa: 22, calicut: 18, ceylon: 15, malacca: 12 }, color: [180, 100, 60] },
  cloves: { name: 'Cloves', sellPrice: 60, buyPrices: { calicut: 35, ceylon: 30, malacca: 25 }, color: [100, 60, 40] },
  nutmeg: { name: 'Nutmeg', sellPrice: 80, buyPrices: { malacca: 40 }, color: [140, 100, 70] }
};

const ports = {
  lisbon: { name: 'Lisbon', x: 60, y: 150, distance: 0, pirateRisk: 0, stormRisk: 0 },
  cape_verde: { name: 'Cape Verde', x: 130, y: 200, distance: 1, pirateRisk: 0.05, stormRisk: 0.10 },
  gold_coast: { name: 'Gold Coast', x: 210, y: 220, distance: 2, pirateRisk: 0.10, stormRisk: 0.10 },
  mombasa: { name: 'Mombasa', x: 350, y: 200, distance: 3, pirateRisk: 0.15, stormRisk: 0.15 },
  calicut: { name: 'Calicut', x: 480, y: 170, distance: 4, pirateRisk: 0.15, stormRisk: 0.10 },
  ceylon: { name: 'Ceylon', x: 540, y: 195, distance: 5, pirateRisk: 0.20, stormRisk: 0.15 },
  malacca: { name: 'Malacca', x: 620, y: 210, distance: 6, pirateRisk: 0.25, stormRisk: 0.15 }
};

const royalOrders = [
  { requirements: { pepper: 30 }, deadline: 1500, reward: 200, unlocks: ['gold_coast'] },
  { requirements: { pepper: 50 }, deadline: 1502, reward: 300, unlocks: ['mombasa'] },
  { requirements: { pepper: 40, cinnamon: 20 }, deadline: 1504, reward: 500, unlocks: ['calicut'] },
  { requirements: { pepper: 60, cinnamon: 30 }, deadline: 1506, reward: 700, unlocks: [] },
  { requirements: { pepper: 50, cinnamon: 40, cloves: 10 }, deadline: 1508, reward: 1000, unlocks: ['ceylon'] },
  { requirements: { cinnamon: 60, cloves: 40 }, deadline: 1512, reward: 2000, unlocks: ['malacca'] },
  { requirements: { cinnamon: 50, cloves: 50, nutmeg: 10 }, deadline: 1516, reward: 3000, unlocks: [] },
  { requirements: { pepper: 100, cinnamon: 50, cloves: 30, nutmeg: 20 }, deadline: 1520, reward: 5000, unlocks: [] }
];

// ============================================
// GAME STATE
// ============================================
const gameState = {
  year: STARTING_YEAR,
  ducats: STARTING_DUCATS,
  reputation: 1,
  currentPort: 'lisbon',
  selectedPort: null,
  cargo: { textiles: 0, glassware: 0, weapons: 0 },
  cargoSpices: {},
  cargoCapacity: 50,
  warehouse: { pepper: 0, cinnamon: 0, cloves: 0, nutmeg: 0 },
  currentOrder: 0,
  orderProgress: {},
  unlockedPorts: ['lisbon', 'cape_verde'],
  stats: { voyages: 0, spicesTraded: 0 },
  message: null,
  messageTimer: 0
};

window.gameState = gameState;

// ============================================
// PARTICLE SYSTEM
// ============================================
function spawnCoins(pos, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 80;
    k.add([
      k.circle(3),
      k.pos(pos),
      k.anchor("center"),
      k.color(...COLORS.gold),
      k.opacity(1),
      k.lifespan(0.8, { fade: 0.4 }),
      k.z(100),
      {
        vel: k.vec2(Math.cos(angle) * speed, Math.sin(angle) * speed - 50),
        update() {
          this.pos = this.pos.add(this.vel.scale(k.dt()));
          this.vel.y += 150 * k.dt();
        }
      }
    ]);
  }
}

function spawnSpiceParticles(pos, color, count = 6) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 50;
    k.add([
      k.rect(2, 2),
      k.pos(pos),
      k.anchor("center"),
      k.color(...color),
      k.opacity(1),
      k.lifespan(0.6, { fade: 0.3 }),
      k.z(100),
      {
        vel: k.vec2(Math.cos(angle) * speed, Math.sin(angle) * speed - 30),
        update() {
          this.pos = this.pos.add(this.vel.scale(k.dt()));
          this.vel.y += 80 * k.dt();
        }
      }
    ]);
  }
}

function spawnWaveParticles(x) {
  k.add([
    k.rect(4, 2),
    k.pos(x, 240 + Math.random() * 20),
    k.anchor("center"),
    k.color(150, 200, 255),
    k.opacity(0.5),
    k.lifespan(1, { fade: 0.5 }),
    k.z(5),
    {
      vel: k.vec2(-20 + Math.random() * 10, -5),
      update() {
        this.pos = this.pos.add(this.vel.scale(k.dt()));
      }
    }
  ]);
}

// ============================================
// UI HELPERS
// ============================================
function drawButton(x, y, w, h, text, bgColor, textColor, enabled = true) {
  // Button shadow
  k.drawRect({
    pos: k.vec2(x + 2, y + 2),
    width: w,
    height: h,
    color: k.rgb(0, 0, 0),
    opacity: 0.3,
    radius: 4,
    fixed: true
  });

  // Button background
  k.drawRect({
    pos: k.vec2(x, y),
    width: w,
    height: h,
    color: enabled ? k.rgb(...bgColor) : k.rgb(100, 100, 100),
    radius: 4,
    fixed: true
  });

  // Button highlight
  k.drawRect({
    pos: k.vec2(x, y),
    width: w,
    height: h / 3,
    color: k.rgb(255, 255, 255),
    opacity: enabled ? 0.15 : 0.05,
    radius: 4,
    fixed: true
  });

  // Button text
  k.drawText({
    text: text,
    pos: k.vec2(x + w / 2, y + h / 2),
    size: 10,
    anchor: "center",
    color: k.rgb(...textColor),
    fixed: true
  });

  return { x, y, w, h, enabled };
}

function drawBar(x, y, w, h, current, max, color, label) {
  // Background
  k.drawRect({
    pos: k.vec2(x, y),
    width: w,
    height: h,
    color: k.rgb(30, 30, 40),
    radius: 2,
    fixed: true
  });

  // Fill
  const fillW = Math.max(0, (current / max) * w);
  if (fillW > 0) {
    k.drawRect({
      pos: k.vec2(x, y),
      width: fillW,
      height: h,
      color: k.rgb(...color),
      radius: 2,
      fixed: true
    });
  }

  // Label
  if (label) {
    k.drawText({
      text: label,
      pos: k.vec2(x + 4, y + h / 2),
      size: 8,
      anchor: "left",
      color: k.rgb(255, 255, 255),
      fixed: true
    });
  }
}

function showMessage(msg, duration = 2) {
  gameState.message = msg;
  gameState.messageTimer = duration;
}

// ============================================
// TITLE SCENE
// ============================================
k.scene("title", () => {
  // Animated ocean waves
  for (let i = 0; i < 30; i++) {
    k.add([
      k.rect(3 + Math.random() * 4, 1),
      k.pos(Math.random() * k.width(), 200 + Math.random() * 100),
      k.anchor("center"),
      k.color(80, 140, 200),
      k.opacity(0.3 + Math.random() * 0.3),
      k.z(0),
      {
        baseY: 200 + Math.random() * 100,
        speed: 10 + Math.random() * 30,
        offset: Math.random() * Math.PI * 2,
        update() {
          this.pos.x -= this.speed * k.dt();
          this.pos.y = this.baseY + Math.sin(k.time() * 2 + this.offset) * 3;
          if (this.pos.x < -10) {
            this.pos.x = k.width() + 10;
          }
        }
      }
    ]);
  }

  // Ship silhouette
  k.add([
    k.rect(60, 30),
    k.pos(k.width() / 2 - 80, 280),
    k.anchor("center"),
    k.color(40, 35, 30),
    k.opacity(0.4),
    k.z(1),
    {
      update() {
        this.pos.y = 280 + Math.sin(k.time() * 1.5) * 5;
      }
    }
  ]);

  // Title glow
  for (let i = 3; i >= 0; i--) {
    k.add([
      k.text("SPICE ROUTE", { size: 32 + i * 3 }),
      k.pos(k.width() / 2, 80),
      k.anchor("center"),
      k.color(...COLORS.gold),
      k.opacity(i === 0 ? 1 : 0.1),
      k.z(10 - i)
    ]);
  }

  // Subtitle
  k.add([
    k.text("A Portuguese Trading Adventure", { size: 12 }),
    k.pos(k.width() / 2, 120),
    k.anchor("center"),
    k.color(...COLORS.parchmentDark)
  ]);

  // Instructions
  k.add([
    k.text("Buy trade goods in Lisbon, sail to exotic ports,", { size: 9 }),
    k.pos(k.width() / 2, 180),
    k.anchor("center"),
    k.color(180, 180, 200)
  ]);

  k.add([
    k.text("trade for valuable spices, fulfill Royal Orders!", { size: 9 }),
    k.pos(k.width() / 2, 195),
    k.anchor("center"),
    k.color(180, 180, 200)
  ]);

  // Start prompt
  const startText = k.add([
    k.text("[ CLICK TO BEGIN YOUR VOYAGE ]", { size: 14 }),
    k.pos(k.width() / 2, 340),
    k.anchor("center"),
    k.color(...COLORS.gold),
    k.z(10)
  ]);

  startText.onUpdate(() => {
    startText.opacity = 0.5 + 0.5 * Math.sin(k.time() * 4);
  });

  k.onClick(() => {
    audioCtx.resume();
    playSound('click');
    k.go("game");
  });
});

// ============================================
// GAME SCENE
// ============================================
k.scene("game", () => {
  let buttons = [];

  // Wave particle spawner
  k.loop(0.3, () => {
    if (Math.random() < 0.5) {
      spawnWaveParticles(k.width() + 10);
    }
  });

  // Message timer
  k.onUpdate(() => {
    if (gameState.messageTimer > 0) {
      gameState.messageTimer -= k.dt();
      if (gameState.messageTimer <= 0) {
        gameState.message = null;
      }
    }
  });

  // Draw everything
  k.onDraw(() => {
    buttons = [];

    // Ocean background
    k.drawRect({
      pos: k.vec2(0, 130),
      width: k.width(),
      height: 150,
      color: k.rgb(...COLORS.ocean),
      fixed: true
    });

    // Header bar
    k.drawRect({
      pos: k.vec2(0, 0),
      width: k.width(),
      height: 55,
      color: k.rgb(...COLORS.navy),
      fixed: true
    });

    // Decorative header line
    k.drawRect({
      pos: k.vec2(0, 53),
      width: k.width(),
      height: 2,
      color: k.rgb(...COLORS.gold),
      opacity: 0.5,
      fixed: true
    });

    // Ducats with icon
    k.drawText({
      text: `Ducats: ${gameState.ducats}`,
      pos: k.vec2(20, 18),
      size: 14,
      color: k.rgb(...COLORS.gold),
      fixed: true
    });

    // Year
    k.drawText({
      text: `Year: ${gameState.year}`,
      pos: k.vec2(180, 18),
      size: 14,
      color: k.rgb(...COLORS.white),
      fixed: true
    });

    // Reputation stars
    k.drawText({
      text: `Reputation: ${'*'.repeat(gameState.reputation)}`,
      pos: k.vec2(320, 18),
      size: 12,
      color: k.rgb(...COLORS.parchmentDark),
      fixed: true
    });

    // Current port
    k.drawText({
      text: `At: ${ports[gameState.currentPort].name}`,
      pos: k.vec2(500, 18),
      size: 14,
      color: k.rgb(...COLORS.white),
      fixed: true
    });

    // Draw ports on map
    for (const [portId, port] of Object.entries(ports)) {
      const unlocked = gameState.unlockedPorts.includes(portId);
      const isCurrent = gameState.currentPort === portId;
      const isSelected = gameState.selectedPort === portId;

      // Port glow for current/selected
      if (isCurrent || isSelected) {
        k.drawCircle({
          pos: k.vec2(port.x, port.y),
          radius: 20,
          color: isCurrent ? k.rgb(60, 180, 80) : k.rgb(255, 200, 80),
          opacity: 0.3 + Math.sin(k.time() * 4) * 0.1,
          fixed: true
        });
      }

      // Port dot
      k.drawCircle({
        pos: k.vec2(port.x, port.y),
        radius: unlocked ? 8 : 5,
        color: unlocked
          ? (isCurrent ? k.rgb(80, 200, 100) : k.rgb(100, 150, 200))
          : k.rgb(80, 80, 80),
        fixed: true
      });

      // Port name
      k.drawText({
        text: port.name,
        pos: k.vec2(port.x, port.y - 15),
        size: 8,
        anchor: "center",
        color: unlocked ? k.rgb(255, 255, 255) : k.rgb(120, 120, 120),
        fixed: true
      });

      // Clickable area for unlocked ports
      if (unlocked && !isCurrent) {
        buttons.push({
          x: port.x - 30,
          y: port.y - 20,
          w: 60,
          h: 40,
          action: () => selectPort(portId)
        });
      }
    }

    // Trade route lines
    k.drawLine({
      p1: k.vec2(ports.lisbon.x, ports.lisbon.y),
      p2: k.vec2(ports.cape_verde.x, ports.cape_verde.y),
      width: 1,
      color: k.rgb(100, 140, 180),
      opacity: 0.4,
      fixed: true
    });

    // Order panel
    k.drawRect({
      pos: k.vec2(15, 290),
      width: 250,
      height: 130,
      color: k.rgb(30, 25, 20),
      opacity: 0.95,
      radius: 6,
      fixed: true
    });

    k.drawRect({
      pos: k.vec2(15, 290),
      width: 250,
      height: 130,
      outline: { color: k.rgb(...COLORS.parchmentDark), width: 2 },
      fill: false,
      radius: 6,
      fixed: true
    });

    if (gameState.currentOrder < royalOrders.length) {
      const order = royalOrders[gameState.currentOrder];

      k.drawText({
        text: `Royal Order #${gameState.currentOrder + 1}`,
        pos: k.vec2(25, 300),
        size: 12,
        color: k.rgb(...COLORS.gold),
        fixed: true
      });

      k.drawText({
        text: `Deadline: ${order.deadline}`,
        pos: k.vec2(25, 316),
        size: 9,
        color: k.rgb(200, 150, 100),
        fixed: true
      });

      let y = 335;
      for (const [spice, amount] of Object.entries(order.requirements)) {
        const delivered = gameState.orderProgress[spice] || 0;
        const have = gameState.warehouse[spice] || 0;
        const complete = delivered >= amount;

        k.drawText({
          text: `${spices[spice].name}: ${delivered}/${amount} (have: ${have})`,
          pos: k.vec2(25, y),
          size: 9,
          color: complete ? k.rgb(...COLORS.green) : k.rgb(200, 200, 220),
          fixed: true
        });
        y += 16;
      }

      // Deliver button
      if (gameState.currentPort === 'lisbon') {
        const canDeliver = Object.entries(order.requirements).some(([sp, amt]) => {
          return (gameState.orderProgress[sp] || 0) < amt && gameState.warehouse[sp] > 0;
        });
        if (canDeliver) {
          buttons.push(drawButton(175, 385, 80, 25, "DELIVER", COLORS.green, COLORS.white, true));
          buttons[buttons.length - 1].action = deliverSpices;
        }
      }
    } else {
      k.drawText({
        text: "VICTORY!",
        pos: k.vec2(140, 340),
        size: 20,
        anchor: "center",
        color: k.rgb(...COLORS.gold),
        fixed: true
      });
      k.drawText({
        text: "All orders complete!",
        pos: k.vec2(140, 365),
        size: 11,
        anchor: "center",
        color: k.rgb(...COLORS.green),
        fixed: true
      });
    }

    // Trading panel
    k.drawRect({
      pos: k.vec2(280, 290),
      width: 380,
      height: 130,
      color: k.rgb(30, 25, 20),
      opacity: 0.95,
      radius: 6,
      fixed: true
    });

    // Trading content
    if (gameState.currentPort !== 'lisbon') {
      // Foreign port - sell goods, buy spices
      k.drawText({
        text: "SELL GOODS:",
        pos: k.vec2(290, 300),
        size: 10,
        color: k.rgb(...COLORS.parchmentDark),
        fixed: true
      });

      let x = 290;
      for (const [goodId, good] of Object.entries(tradeGoods)) {
        if (gameState.cargo[goodId] > 0) {
          const price = good.sellPrices[gameState.currentPort] || 0;
          if (price > 0) {
            buttons.push(drawButton(x, 315, 75, 22, `${good.name} +${price}`, COLORS.green, COLORS.white));
            buttons[buttons.length - 1].action = () => sellGood(goodId);
            x += 82;
          }
        }
      }

      k.drawText({
        text: "BUY SPICES:",
        pos: k.vec2(290, 350),
        size: 10,
        color: k.rgb(...COLORS.parchmentDark),
        fixed: true
      });

      x = 290;
      for (const [spiceId, spice] of Object.entries(spices)) {
        const price = spice.buyPrices[gameState.currentPort];
        if (price && gameState.ducats >= price) {
          buttons.push(drawButton(x, 365, 75, 22, `${spice.name} -${price}`, COLORS.navyLight, COLORS.white));
          buttons[buttons.length - 1].action = () => buySpice(spiceId);
          x += 82;
        }
      }
    } else {
      // Lisbon - buy goods, sell spices
      k.drawText({
        text: "BUY GOODS:",
        pos: k.vec2(290, 300),
        size: 10,
        color: k.rgb(...COLORS.parchmentDark),
        fixed: true
      });

      let x = 290;
      for (const [goodId, good] of Object.entries(tradeGoods)) {
        if (gameState.ducats >= good.buyPrice) {
          buttons.push(drawButton(x, 315, 75, 22, `${good.name} -${good.buyPrice}`, COLORS.navyLight, COLORS.white));
          buttons[buttons.length - 1].action = () => buyGood(goodId);
          x += 82;
        }
      }

      k.drawText({
        text: "SELL SPICES:",
        pos: k.vec2(290, 350),
        size: 10,
        color: k.rgb(...COLORS.parchmentDark),
        fixed: true
      });

      x = 290;
      for (const [spiceId, spice] of Object.entries(spices)) {
        if (gameState.warehouse[spiceId] > 0) {
          buttons.push(drawButton(x, 365, 75, 22, `${spice.name} +${spice.sellPrice}`, COLORS.green, COLORS.white));
          buttons[buttons.length - 1].action = () => sellSpice(spiceId);
          x += 82;
        }
      }
    }

    // Sail button
    if (gameState.selectedPort && gameState.selectedPort !== gameState.currentPort) {
      buttons.push(drawButton(560, 300, 90, 35, `SAIL TO\n${ports[gameState.selectedPort].name}`, COLORS.red, COLORS.white));
      buttons[buttons.length - 1].action = startVoyage;
    }

    // Cargo bar
    k.drawRect({
      pos: k.vec2(15, 430),
      width: k.width() - 30,
      height: 55,
      color: k.rgb(...COLORS.navy),
      opacity: 0.9,
      radius: 4,
      fixed: true
    });

    const totalCargo = Object.values(gameState.cargo).reduce((a, b) => a + b, 0) +
                       Object.values(gameState.cargoSpices || {}).reduce((a, b) => a + b, 0);

    drawBar(25, 438, 120, 12, totalCargo, gameState.cargoCapacity, COLORS.parchmentDark, `Cargo: ${totalCargo}/${gameState.cargoCapacity}`);

    // Cargo contents
    let cargoText = "";
    for (const [goodId, amount] of Object.entries(gameState.cargo)) {
      if (amount > 0) cargoText += `${tradeGoods[goodId].name}: ${amount}  `;
    }
    for (const [spiceId, amount] of Object.entries(gameState.cargoSpices || {})) {
      if (amount > 0) cargoText += `${spices[spiceId].name}: ${amount}  `;
    }
    if (cargoText) {
      k.drawText({
        text: cargoText,
        pos: k.vec2(160, 442),
        size: 8,
        color: k.rgb(200, 200, 220),
        fixed: true
      });
    }

    // Warehouse
    let warehouseText = "Warehouse: ";
    for (const [spiceId, amount] of Object.entries(gameState.warehouse)) {
      if (amount > 0) warehouseText += `${spices[spiceId].name}: ${amount}  `;
    }
    k.drawText({
      text: warehouseText,
      pos: k.vec2(25, 465),
      size: 9,
      color: k.rgb(...COLORS.parchmentDark),
      fixed: true
    });

    // Message popup
    if (gameState.message) {
      k.drawRect({
        pos: k.vec2(k.width() / 2 - 150, 140),
        width: 300,
        height: 50,
        color: k.rgb(30, 25, 20),
        opacity: 0.95,
        radius: 8,
        fixed: true
      });
      k.drawRect({
        pos: k.vec2(k.width() / 2 - 150, 140),
        width: 300,
        height: 50,
        outline: { color: k.rgb(...COLORS.gold), width: 2 },
        fill: false,
        radius: 8,
        fixed: true
      });
      k.drawText({
        text: gameState.message,
        pos: k.vec2(k.width() / 2, 165),
        size: 12,
        anchor: "center",
        color: k.rgb(...COLORS.white),
        fixed: true
      });
    }
  });

  // Click handling
  k.onClick((pos) => {
    for (const btn of buttons) {
      if (btn.action && btn.enabled !== false &&
          pos.x >= btn.x && pos.x <= btn.x + btn.w &&
          pos.y >= btn.y && pos.y <= btn.y + btn.h) {
        playSound('click');
        btn.action();
        return;
      }
    }
  });

  // Game functions
  function selectPort(portId) {
    gameState.selectedPort = portId;
  }

  function buyGood(goodId) {
    const good = tradeGoods[goodId];
    const totalCargo = Object.values(gameState.cargo).reduce((a, b) => a + b, 0) +
                       Object.values(gameState.cargoSpices || {}).reduce((a, b) => a + b, 0);
    const amount = Math.min(5, gameState.cargoCapacity - totalCargo, Math.floor(gameState.ducats / good.buyPrice));

    if (amount > 0) {
      gameState.ducats -= amount * good.buyPrice;
      gameState.cargo[goodId] += amount;
      playSound('buy');
      spawnSpiceParticles(k.vec2(400, 320), good.color);
      showMessage(`Bought ${amount} ${good.name}`);
    }
  }

  function sellGood(goodId) {
    const good = tradeGoods[goodId];
    const price = good.sellPrices[gameState.currentPort];
    const amount = Math.min(5, gameState.cargo[goodId]);

    if (amount > 0 && price) {
      gameState.ducats += amount * price;
      gameState.cargo[goodId] -= amount;
      playSound('sell');
      spawnCoins(k.vec2(400, 320));
      showMessage(`Sold ${amount} ${good.name} for ${amount * price} ducats!`);
    }
  }

  function buySpice(spiceId) {
    const spice = spices[spiceId];
    const price = spice.buyPrices[gameState.currentPort];
    const totalCargo = Object.values(gameState.cargo).reduce((a, b) => a + b, 0) +
                       Object.values(gameState.cargoSpices || {}).reduce((a, b) => a + b, 0);
    const amount = Math.min(5, gameState.cargoCapacity - totalCargo, Math.floor(gameState.ducats / price));

    if (amount > 0 && price) {
      gameState.ducats -= amount * price;
      if (!gameState.cargoSpices) gameState.cargoSpices = {};
      gameState.cargoSpices[spiceId] = (gameState.cargoSpices[spiceId] || 0) + amount;
      gameState.stats.spicesTraded += amount;
      playSound('buy');
      spawnSpiceParticles(k.vec2(400, 370), spice.color);
      showMessage(`Bought ${amount} ${spice.name}`);
    }
  }

  function sellSpice(spiceId) {
    const spice = spices[spiceId];
    const amount = Math.min(5, gameState.warehouse[spiceId]);

    if (amount > 0) {
      gameState.ducats += amount * spice.sellPrice;
      gameState.warehouse[spiceId] -= amount;
      playSound('sell');
      spawnCoins(k.vec2(400, 370));
      showMessage(`Sold ${amount} ${spice.name} for ${amount * spice.sellPrice} ducats!`);
    }
  }

  function deliverSpices() {
    const order = royalOrders[gameState.currentOrder];
    let delivered = false;

    for (const [spice, required] of Object.entries(order.requirements)) {
      const needed = required - (gameState.orderProgress[spice] || 0);
      const have = gameState.warehouse[spice] || 0;
      const toDeliver = Math.min(needed, have);

      if (toDeliver > 0) {
        gameState.warehouse[spice] -= toDeliver;
        gameState.orderProgress[spice] = (gameState.orderProgress[spice] || 0) + toDeliver;
        delivered = true;
      }
    }

    const complete = Object.entries(order.requirements).every(([spice, required]) => {
      return (gameState.orderProgress[spice] || 0) >= required;
    });

    if (complete) {
      gameState.ducats += order.reward;
      gameState.reputation = Math.min(5, gameState.reputation + 1);
      for (const port of order.unlocks) {
        if (!gameState.unlockedPorts.includes(port)) {
          gameState.unlockedPorts.push(port);
        }
      }
      gameState.currentOrder++;
      gameState.orderProgress = {};
      playSound('success');
      spawnCoins(k.vec2(140, 350), 15);
      showMessage(`Order Complete! +${order.reward} Ducats!`);
    } else if (delivered) {
      playSound('coin');
      showMessage("Spices delivered to the Royal Court");
    }
  }

  function startVoyage() {
    const destPort = ports[gameState.selectedPort];
    const currentPort = ports[gameState.currentPort];
    const distance = Math.abs(destPort.distance - currentPort.distance);

    playSound('sail');

    // Random events
    const pirateRoll = Math.random();
    const stormRoll = Math.random();

    let event = null;
    if (pirateRoll < destPort.pirateRisk) {
      event = 'pirates';
    } else if (stormRoll < destPort.stormRisk) {
      event = 'storm';
    }

    // Process voyage
    gameState.year += distance * 0.5;
    gameState.stats.voyages++;

    // Handle events
    if (event === 'pirates') {
      playSound('pirate');
      const lossPercent = 0.3;
      for (const good in gameState.cargo) {
        gameState.cargo[good] = Math.floor(gameState.cargo[good] * (1 - lossPercent));
      }
      if (gameState.cargoSpices) {
        for (const spice in gameState.cargoSpices) {
          gameState.cargoSpices[spice] = Math.floor(gameState.cargoSpices[spice] * (1 - lossPercent));
        }
      }
      showMessage("Pirates attacked! Lost 30% of cargo!", 3);
    } else if (event === 'storm') {
      playSound('storm');
      const lossPercent = 0.15;
      for (const good in gameState.cargo) {
        gameState.cargo[good] = Math.floor(gameState.cargo[good] * (1 - lossPercent));
      }
      showMessage("Storm damage! Lost 15% of cargo!", 3);
    }

    // Arrive
    gameState.currentPort = gameState.selectedPort;
    gameState.selectedPort = null;

    // Transfer spices to warehouse in Lisbon
    if (gameState.currentPort === 'lisbon' && gameState.cargoSpices) {
      for (const [spice, amount] of Object.entries(gameState.cargoSpices)) {
        gameState.warehouse[spice] = (gameState.warehouse[spice] || 0) + amount;
      }
      gameState.cargoSpices = {};
      if (!event) {
        showMessage(`Arrived in Lisbon! Spices stored in warehouse.`);
      }
    } else if (!event) {
      showMessage(`Arrived at ${ports[gameState.currentPort].name}!`);
    }

    // Check defeat
    if (gameState.year >= ENDING_YEAR || gameState.ducats <= 0) {
      k.go("gameover", false);
      return;
    }

    // Check order deadline
    if (gameState.currentOrder < royalOrders.length) {
      const order = royalOrders[gameState.currentOrder];
      if (gameState.year > order.deadline) {
        playSound('fail');
        k.go("gameover", false);
        return;
      }
    }

    // Check victory
    if (gameState.currentOrder >= royalOrders.length) {
      k.go("gameover", true);
    }
  }
});

// ============================================
// GAME OVER SCENE
// ============================================
k.scene("gameover", (won) => {
  // Background particles
  for (let i = 0; i < 20; i++) {
    k.add([
      k.circle(2),
      k.pos(Math.random() * k.width(), Math.random() * k.height()),
      k.color(...(won ? COLORS.gold : [150, 50, 50])),
      k.opacity(0.3),
      k.z(0),
      {
        vel: k.vec2(k.rand(-20, 20), k.rand(-30, -10)),
        update() {
          this.pos = this.pos.add(this.vel.scale(k.dt()));
          if (this.pos.y < -10) this.pos.y = k.height() + 10;
        }
      }
    ]);
  }

  // Title
  k.add([
    k.text(won ? "VICTORY!" : "GAME OVER", { size: 36 }),
    k.pos(k.width() / 2, 80),
    k.anchor("center"),
    k.color(...(won ? COLORS.gold : [255, 100, 100]))
  ]);

  // Stats
  const statsText = won
    ? `You completed all Royal Orders!\n\nVoyages: ${gameState.stats.voyages}\nSpices Traded: ${gameState.stats.spicesTraded}\nFinal Ducats: ${gameState.ducats}\nReputation: ${'*'.repeat(gameState.reputation)}`
    : `Your trading empire has fallen.\n\nYear: ${Math.floor(gameState.year)}\nOrders Completed: ${gameState.currentOrder}\nDucats: ${gameState.ducats}`;

  k.add([
    k.text(statsText, { size: 12, lineSpacing: 6 }),
    k.pos(k.width() / 2, 200),
    k.anchor("center"),
    k.color(220, 220, 240)
  ]);

  // Restart prompt
  const restartText = k.add([
    k.text("[ CLICK TO PLAY AGAIN ]", { size: 14 }),
    k.pos(k.width() / 2, 350),
    k.anchor("center"),
    k.color(...COLORS.gold)
  ]);

  restartText.onUpdate(() => {
    restartText.opacity = 0.5 + 0.5 * Math.sin(k.time() * 4);
  });

  k.onClick(() => {
    // Reset game state
    gameState.year = STARTING_YEAR;
    gameState.ducats = STARTING_DUCATS;
    gameState.reputation = 1;
    gameState.currentPort = 'lisbon';
    gameState.selectedPort = null;
    gameState.cargo = { textiles: 0, glassware: 0, weapons: 0 };
    gameState.cargoSpices = {};
    gameState.warehouse = { pepper: 0, cinnamon: 0, cloves: 0, nutmeg: 0 };
    gameState.currentOrder = 0;
    gameState.orderProgress = {};
    gameState.unlockedPorts = ['lisbon', 'cape_verde'];
    gameState.stats = { voyages: 0, spicesTraded: 0 };
    gameState.message = null;

    playSound('click');
    k.go("title");
  });
});

// Start game
k.go("title");
