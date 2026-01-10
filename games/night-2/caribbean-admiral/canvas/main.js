// Caribbean Admiral - Turn-Based Naval Combat (Canvas)
const WIDTH = 1024;
const HEIGHT = 768;

const canvas = document.createElement('canvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

// Ship types
const SHIP_TYPES = {
  sloop: { name: 'Sloop', hull: 100, ap: 50, damage: 15, accuracy: 65, cost: 500, color: '#4a8' },
  brigantine: { name: 'Brigantine', hull: 220, ap: 70, damage: 32, accuracy: 70, cost: 4000, color: '#68a' },
  frigate: { name: 'Frigate', hull: 550, ap: 100, damage: 80, accuracy: 78, cost: 30000, color: '#86a' },
  galleon: { name: 'Galleon', hull: 700, ap: 90, damage: 95, accuracy: 72, cost: 50000, color: '#a68' },
  ghostship: { name: 'Ghost Ship', hull: 2500, ap: 200, damage: 250, accuracy: 90, cost: 0, color: '#848' }
};

// Game state
const game = {
  state: 'title',
  gold: 1000,
  playerShips: [],
  enemyShips: [],
  selectedShip: null,
  turn: 'player',
  battleNumber: 1,
  messages: [],
  battleLog: [],
  mouse: { x: 0, y: 0, clicked: false },
  keys: {},
  lastTime: 0,
  victories: 0,
  defeats: 0,
  ghostDefeated: false
};

// Create ship
function createShip(type, x, y, isPlayer) {
  const t = SHIP_TYPES[type];
  return {
    type,
    name: t.name,
    x,
    y,
    hull: t.hull,
    maxHull: t.hull,
    ap: t.ap,
    maxAp: t.ap,
    damage: t.damage,
    accuracy: t.accuracy,
    color: t.color,
    isPlayer,
    selected: false,
    hasActed: false
  };
}

// Message system
function addMessage(text, duration = 3) {
  game.messages.unshift({ text, time: duration });
  if (game.messages.length > 4) game.messages.pop();
}

function addLog(text) {
  game.battleLog.unshift(text);
  if (game.battleLog.length > 8) game.battleLog.pop();
}

// Input handlers
document.addEventListener('keydown', e => {
  game.keys[e.key.toLowerCase()] = true;

  // Store current state to prevent multiple transitions per keypress
  const currentState = game.state;

  if (currentState === 'title' && (e.key === ' ' || e.key === 'Enter')) {
    startGame();
    return;
  }
  if ((currentState === 'victory' || currentState === 'defeat' || currentState === 'gameover') && (e.key === ' ' || e.key === 'Enter')) {
    if (currentState === 'gameover' || game.ghostDefeated) {
      game.state = 'title';
    } else {
      game.state = 'port';
    }
    return;
  }
  if (currentState === 'battle' && game.turn === 'player') {
    if (e.key === 'Tab') {
      e.preventDefault();
      selectNextShip();
    }
    if (e.key === '1') {
      // Attack first enemy
      if (game.selectedShip && game.enemyShips.length > 0) {
        playerAttack(game.selectedShip, game.enemyShips[0]);
      }
    }
    if (e.key === '2') {
      // Attack second enemy if exists
      if (game.selectedShip && game.enemyShips.length > 1) {
        playerAttack(game.selectedShip, game.enemyShips[1]);
      }
    }
    if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
      endTurn();
    }
  }
  if (currentState === 'port') {
    if (e.key === '1') buyShip('sloop');
    if (e.key === '2') buyShip('brigantine');
    if (e.key === '3') buyShip('frigate');
    if (e.key === '4') buyShip('galleon');
    if (e.key === 'b' || e.key === 'B') buyShip('sloop'); // Quick buy sloop
    if (e.key === 's' || e.key === 'S' || e.key === ' ' || e.key === 'Enter') startBattle();
    if (e.key === 'r' || e.key === 'R') repairShips();
    if (e.key === 'g' || e.key === 'G') fightGhostShip();
  }
});

document.addEventListener('keyup', e => {
  game.keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  game.mouse.x = (e.clientX - rect.left) * (WIDTH / rect.width);
  game.mouse.y = (e.clientY - rect.top) * (HEIGHT / rect.height);
});

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  game.mouse.x = (e.clientX - rect.left) * (WIDTH / rect.width);
  game.mouse.y = (e.clientY - rect.top) * (HEIGHT / rect.height);
  game.mouse.clicked = true;

  if (game.state === 'title') {
    startGame();
  } else if (game.state === 'battle' && game.turn === 'player') {
    handleBattleClick();
  } else if (game.state === 'port') {
    handlePortClick();
  } else if (game.state === 'victory' || game.state === 'defeat' || game.state === 'gameover') {
    if (game.ghostDefeated || game.state === 'gameover') {
      game.state = 'title';
    } else {
      startBattle();
    }
  }
});

function startGame() {
  game.gold = 1000;
  game.playerShips = [createShip('sloop', 100, 300, true)];
  game.battleNumber = 1;
  game.victories = 0;
  game.ghostDefeated = false;
  game.messages = [];
  game.state = 'port';
  addMessage('Welcome to port! Prepare for battle.');
}

function startBattle() {
  game.state = 'battle';
  game.battleLog = [];

  // Position player ships
  game.playerShips.forEach((ship, i) => {
    ship.x = 150;
    ship.y = 200 + i * 150;
    ship.hull = ship.maxHull;
    ship.ap = ship.maxAp;
    ship.hasActed = false;
    ship.selected = false;
  });

  // Generate enemy fleet based on battle number
  game.enemyShips = [];
  const enemyCount = Math.min(1 + Math.floor(game.battleNumber / 2), 3);

  for (let i = 0; i < enemyCount; i++) {
    let type = 'sloop';
    if (game.battleNumber >= 3) type = Math.random() < 0.5 ? 'brigantine' : 'sloop';
    if (game.battleNumber >= 5) type = Math.random() < 0.3 ? 'frigate' : type;
    if (game.battleNumber >= 7) type = Math.random() < 0.2 ? 'galleon' : type;

    const ship = createShip(type, 800, 200 + i * 150, false);
    game.enemyShips.push(ship);
  }

  // Select first player ship
  if (game.playerShips.length > 0) {
    game.playerShips[0].selected = true;
    game.selectedShip = game.playerShips[0];
  }

  game.turn = 'player';
  addLog('Battle ' + game.battleNumber + ' begins!');
  addMessage('Your turn! Click enemy ships to attack.');
}

function fightGhostShip() {
  if (game.victories < 5) {
    addMessage('Defeat 5 fleets first to challenge the Ghost Ship!');
    return;
  }

  game.state = 'battle';
  game.battleLog = [];

  // Position player ships
  game.playerShips.forEach((ship, i) => {
    ship.x = 150;
    ship.y = 200 + i * 150;
    ship.hull = ship.maxHull;
    ship.ap = ship.maxAp;
    ship.hasActed = false;
    ship.selected = false;
  });

  // Ghost Ship boss
  game.enemyShips = [createShip('ghostship', 800, 350, false)];

  if (game.playerShips.length > 0) {
    game.playerShips[0].selected = true;
    game.selectedShip = game.playerShips[0];
  }

  game.turn = 'player';
  addLog('THE GHOST SHIP APPEARS!');
  addMessage('Final battle! Destroy the Ghost Ship!');
}

function handleBattleClick() {
  // Check if clicking on enemy ship
  for (const enemy of game.enemyShips) {
    const dist = Math.sqrt((game.mouse.x - enemy.x) ** 2 + (game.mouse.y - enemy.y) ** 2);
    if (dist < 50 && game.selectedShip && !game.selectedShip.hasActed) {
      attackShip(game.selectedShip, enemy);
      return;
    }
  }

  // Check if clicking on player ship to select
  for (const ship of game.playerShips) {
    const dist = Math.sqrt((game.mouse.x - ship.x) ** 2 + (game.mouse.y - ship.y) ** 2);
    if (dist < 50) {
      selectShip(ship);
      return;
    }
  }
}

function handlePortClick() {
  // Ship buttons
  const buttonY = 500;
  const ships = [
    { type: 'sloop', x: 200 },
    { type: 'brigantine', x: 400 },
    { type: 'frigate', x: 600 },
    { type: 'galleon', x: 800 }
  ];

  for (const s of ships) {
    if (game.mouse.x > s.x - 80 && game.mouse.x < s.x + 80 &&
        game.mouse.y > buttonY - 20 && game.mouse.y < buttonY + 20) {
      buyShip(s.type);
      return;
    }
  }

  // Sail button
  if (game.mouse.x > WIDTH / 2 - 100 && game.mouse.x < WIDTH / 2 + 100 &&
      game.mouse.y > 620 && game.mouse.y < 660) {
    startBattle();
    return;
  }

  // Ghost Ship button
  if (game.victories >= 5 && game.mouse.x > WIDTH / 2 - 120 && game.mouse.x < WIDTH / 2 + 120 &&
      game.mouse.y > 680 && game.mouse.y < 720) {
    fightGhostShip();
  }
}

function selectShip(ship) {
  game.playerShips.forEach(s => s.selected = false);
  ship.selected = true;
  game.selectedShip = ship;
}

function selectNextShip() {
  const availableShips = game.playerShips.filter(s => !s.hasActed);
  if (availableShips.length === 0) return;

  const currentIndex = availableShips.indexOf(game.selectedShip);
  const nextIndex = (currentIndex + 1) % availableShips.length;
  selectShip(availableShips[nextIndex]);
}

// Player attack wrapper for keyboard controls
function playerAttack(attacker, defender) {
  if (!attacker || !defender) return;
  if (game.turn !== 'player') return;
  attackShip(attacker, defender);
}

function attackShip(attacker, defender) {
  if (attacker.ap < 20) {
    addMessage('Not enough AP!');
    return;
  }

  attacker.ap -= 20;

  // Calculate hit
  const hitRoll = Math.random() * 100;
  if (hitRoll < attacker.accuracy) {
    // Hit!
    const damage = Math.floor(attacker.damage * (0.8 + Math.random() * 0.4));
    defender.hull -= damage;
    addLog(`${attacker.name} hits ${defender.name} for ${damage} damage!`);

    if (defender.hull <= 0) {
      defender.hull = 0;
      addLog(`${defender.name} sunk!`);

      // Remove from appropriate array
      if (defender.isPlayer) {
        game.playerShips = game.playerShips.filter(s => s !== defender);
        if (game.selectedShip === defender) {
          game.selectedShip = game.playerShips[0] || null;
          if (game.selectedShip) game.selectedShip.selected = true;
        }
      } else {
        game.enemyShips = game.enemyShips.filter(s => s !== defender);
      }

      // Check win/lose
      if (game.enemyShips.length === 0) {
        checkVictory();
        return;
      }
      if (game.playerShips.length === 0) {
        checkDefeat();
        return;
      }
    }
  } else {
    addLog(`${attacker.name} misses ${defender.name}!`);
  }

  // Check if ship can still act
  if (attacker.ap < 20) {
    attacker.hasActed = true;
    selectNextShip();
  }

  // Auto end turn if all ships acted
  if (game.playerShips.every(s => s.hasActed)) {
    endTurn();
  }
}

function endTurn() {
  if (game.turn === 'player') {
    game.turn = 'enemy';
    addLog('Enemy turn...');
    setTimeout(enemyTurn, 500);
  } else {
    game.turn = 'player';
    game.playerShips.forEach(s => {
      s.ap = s.maxAp;
      s.hasActed = false;
    });
    game.enemyShips.forEach(s => {
      s.ap = s.maxAp;
    });
    addLog('Your turn!');
    addMessage('Your turn!');
  }
}

function enemyTurn() {
  // Simple AI: each enemy attacks random player ship
  for (const enemy of game.enemyShips) {
    if (game.playerShips.length === 0) break;

    while (enemy.ap >= 20 && game.playerShips.length > 0) {
      const target = game.playerShips[Math.floor(Math.random() * game.playerShips.length)];

      enemy.ap -= 20;
      const hitRoll = Math.random() * 100;

      if (hitRoll < enemy.accuracy) {
        const damage = Math.floor(enemy.damage * (0.8 + Math.random() * 0.4));
        target.hull -= damage;
        addLog(`${enemy.name} hits ${target.name} for ${damage}!`);

        if (target.hull <= 0) {
          target.hull = 0;
          addLog(`${target.name} sunk!`);
          game.playerShips = game.playerShips.filter(s => s !== target);
        }
      } else {
        addLog(`${enemy.name} misses!`);
      }
    }
  }

  // Check lose condition
  if (game.playerShips.length === 0) {
    checkDefeat();
    return;
  }

  setTimeout(endTurn, 500);
}

function checkVictory() {
  const isGhostShip = game.enemyShips.length === 0 && game.battleLog.some(l => l.includes('GHOST'));

  if (isGhostShip) {
    game.ghostDefeated = true;
    game.gold += 100000;
    game.state = 'victory';
    addMessage('VICTORY! You defeated the Ghost Ship!');
  } else {
    const loot = 500 + game.battleNumber * 200 + Math.floor(Math.random() * 500);
    game.gold += loot;
    game.victories++;
    game.battleNumber++;
    game.state = 'victory';
    addMessage(`Victory! +${loot} gold. Total victories: ${game.victories}`);
  }
}

function checkDefeat() {
  if (game.playerShips.length === 0) {
    // Lose 25% gold, reset ships
    game.gold = Math.floor(game.gold * 0.75);
    game.playerShips = [createShip('sloop', 100, 300, true)];

    if (game.gold < 100) {
      game.state = 'gameover';
      addMessage('Game Over! You lost everything.');
    } else {
      game.state = 'defeat';
      addMessage('Defeat! Lost 25% gold. Press SPACE to continue.');
    }
  }
}

function buyShip(type) {
  if (game.playerShips.length >= 3) {
    addMessage('Max 3 ships in fleet!');
    return;
  }

  const cost = SHIP_TYPES[type].cost;
  if (game.gold < cost) {
    addMessage('Not enough gold!');
    return;
  }

  game.gold -= cost;
  game.playerShips.push(createShip(type, 0, 0, true));
  addMessage(`Bought ${SHIP_TYPES[type].name}!`);
}

function repairShips() {
  let repairCost = 0;
  game.playerShips.forEach(ship => {
    const damage = ship.maxHull - ship.hull;
    repairCost += Math.floor(damage * 0.5);
  });

  if (repairCost === 0) {
    addMessage('All ships are at full health!');
    return;
  }

  if (game.gold < repairCost) {
    addMessage(`Need ${repairCost} gold for repairs!`);
    return;
  }

  game.gold -= repairCost;
  game.playerShips.forEach(ship => {
    ship.hull = ship.maxHull;
  });
  addMessage(`Ships repaired for ${repairCost} gold!`);
}

function updateMessages(dt) {
  for (let i = game.messages.length - 1; i >= 0; i--) {
    game.messages[i].time -= dt;
    if (game.messages[i].time <= 0) {
      game.messages.splice(i, 1);
    }
  }
}

// Render functions
function renderTitle() {
  // Ocean background
  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Waves
  for (let y = 0; y < HEIGHT; y += 50) {
    ctx.strokeStyle = `rgba(30, 80, 120, ${0.3 + Math.sin(y / 30 + Date.now() / 1000) * 0.1})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < WIDTH; x += 20) {
      ctx.lineTo(x, y + Math.sin(x / 50 + Date.now() / 500) * 5);
    }
    ctx.stroke();
  }

  ctx.fillStyle = '#fc0';
  ctx.font = 'bold 56px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('CARIBBEAN ADMIRAL', WIDTH / 2, 150);

  ctx.fillStyle = '#8ac';
  ctx.font = '24px Courier New';
  ctx.fillText('Turn-Based Naval Combat', WIDTH / 2, 200);

  ctx.fillStyle = '#aaa';
  ctx.font = '16px Courier New';
  ctx.fillText('Build your fleet and defeat the Ghost Ship!', WIDTH / 2, 300);
  ctx.fillText('Win 5 battles to unlock the final boss', WIDTH / 2, 330);

  ctx.fillStyle = '#4a8';
  ctx.font = '14px Courier New';
  ctx.fillText('Click enemy ships to attack', WIDTH / 2, 420);
  ctx.fillText('TAB to select next ship | SPACE to end turn', WIDTH / 2, 450);

  ctx.fillStyle = '#fff';
  ctx.font = '24px Courier New';
  ctx.fillText('Click or Press SPACE to Start', WIDTH / 2, 550);
}

function renderPort() {
  // Background
  ctx.fillStyle = '#1a2838';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Port scene
  ctx.fillStyle = '#3a2818';
  ctx.fillRect(0, HEIGHT - 150, WIDTH, 150);

  ctx.fillStyle = '#fc0';
  ctx.font = 'bold 36px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('PORT NASSAU', WIDTH / 2, 50);

  // Gold
  ctx.fillStyle = '#ff0';
  ctx.font = '20px Courier New';
  ctx.fillText(`Gold: ${game.gold}`, WIDTH / 2, 90);

  // Fleet
  ctx.fillStyle = '#fff';
  ctx.font = '16px Courier New';
  ctx.fillText(`Your Fleet (${game.playerShips.length}/3):`, WIDTH / 2, 130);

  game.playerShips.forEach((ship, i) => {
    ctx.fillStyle = ship.color;
    ctx.fillText(`${ship.name} - Hull: ${ship.hull} | Damage: ${ship.damage}`, WIDTH / 2, 160 + i * 25);
  });

  // Victories
  ctx.fillStyle = '#4f4';
  ctx.font = '18px Courier New';
  ctx.fillText(`Victories: ${game.victories}/5`, WIDTH / 2, 280);

  // Ship shop
  ctx.fillStyle = '#888';
  ctx.font = '16px Courier New';
  ctx.fillText('Buy Ships:', WIDTH / 2, 400);

  const ships = [
    { type: 'sloop', x: 200, label: '[1] Sloop - 500g' },
    { type: 'brigantine', x: 400, label: '[2] Brigantine - 4000g' },
    { type: 'frigate', x: 600, label: '[3] Frigate - 30000g' },
    { type: 'galleon', x: 800, label: '[4] Galleon - 50000g' }
  ];

  ships.forEach(s => {
    const cost = SHIP_TYPES[s.type].cost;
    const canAfford = game.gold >= cost;
    ctx.fillStyle = canAfford ? '#4a8' : '#666';
    ctx.fillRect(s.x - 80, 480, 160, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Courier New';
    ctx.fillText(s.label, s.x, 505);
  });

  // Sail button
  ctx.fillStyle = '#48a';
  ctx.fillRect(WIDTH / 2 - 100, 620, 200, 40);
  ctx.fillStyle = '#fff';
  ctx.font = '18px Courier New';
  ctx.fillText('SAIL TO BATTLE', WIDTH / 2, 645);

  // Ghost Ship button (if unlocked)
  if (game.victories >= 5) {
    ctx.fillStyle = '#848';
    ctx.fillRect(WIDTH / 2 - 120, 680, 240, 40);
    ctx.fillStyle = '#fff';
    ctx.fillText('[G] FIGHT GHOST SHIP', WIDTH / 2, 705);
  }

  // Messages
  renderMessages();
}

function renderBattle() {
  // Ocean background
  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Waves
  for (let y = 0; y < HEIGHT; y += 60) {
    ctx.strokeStyle = 'rgba(30, 80, 120, 0.3)';
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < WIDTH; x += 30) {
      ctx.lineTo(x, y + Math.sin(x / 50 + game.lastTime / 500) * 5);
    }
    ctx.stroke();
  }

  // Draw ships
  const drawShip = (ship) => {
    const isHovered = Math.sqrt((game.mouse.x - ship.x) ** 2 + (game.mouse.y - ship.y) ** 2) < 50;

    // Ship body
    ctx.save();
    ctx.translate(ship.x, ship.y);

    // Selection indicator
    if (ship.selected) {
      ctx.strokeStyle = '#ff0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 55, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Hover indicator for enemies
    if (isHovered && !ship.isPlayer && game.turn === 'player') {
      ctx.strokeStyle = '#f44';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 52, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Ship body
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    if (ship.isPlayer) {
      // Facing right
      ctx.moveTo(-30, -15);
      ctx.lineTo(40, 0);
      ctx.lineTo(-30, 15);
    } else {
      // Facing left
      ctx.moveTo(30, -15);
      ctx.lineTo(-40, 0);
      ctx.lineTo(30, 15);
    }
    ctx.closePath();
    ctx.fill();

    // Mast
    ctx.fillStyle = '#654';
    ctx.fillRect(-5, -30, 10, 40);

    // Sail
    ctx.fillStyle = ship.isPlayer ? '#fff' : '#844';
    ctx.beginPath();
    ctx.moveTo(-5, -25);
    ctx.lineTo(ship.isPlayer ? 20 : -20, -15);
    ctx.lineTo(-5, -5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // HP bar
    ctx.fillStyle = '#300';
    ctx.fillRect(ship.x - 30, ship.y - 50, 60, 8);
    ctx.fillStyle = ship.hull > ship.maxHull * 0.3 ? '#4a4' : '#f44';
    ctx.fillRect(ship.x - 30, ship.y - 50, 60 * (ship.hull / ship.maxHull), 8);

    // AP bar
    ctx.fillStyle = '#003';
    ctx.fillRect(ship.x - 30, ship.y - 40, 60, 6);
    ctx.fillStyle = '#48f';
    ctx.fillRect(ship.x - 30, ship.y - 40, 60 * (ship.ap / ship.maxAp), 6);

    // Ship name
    ctx.fillStyle = '#fff';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(ship.name, ship.x, ship.y + 40);
    ctx.fillText(`${ship.hull}/${ship.maxHull}`, ship.x, ship.y + 55);
  };

  // Draw player ships
  game.playerShips.forEach(drawShip);

  // Draw enemy ships
  game.enemyShips.forEach(drawShip);

  // Turn indicator
  ctx.fillStyle = game.turn === 'player' ? '#4f4' : '#f44';
  ctx.font = 'bold 20px Courier New';
  ctx.textAlign = 'left';
  ctx.fillText(game.turn === 'player' ? 'YOUR TURN' : 'ENEMY TURN', 20, 30);

  // Battle log
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(WIDTH - 300, 10, 290, 200);
  ctx.fillStyle = '#fff';
  ctx.font = '12px Courier New';
  ctx.textAlign = 'left';
  ctx.fillText('Battle Log:', WIDTH - 290, 30);
  game.battleLog.forEach((log, i) => {
    ctx.fillStyle = `rgba(255, 255, 255, ${1 - i * 0.1})`;
    ctx.fillText(log.substring(0, 35), WIDTH - 290, 50 + i * 18);
  });

  // Instructions
  ctx.fillStyle = '#888';
  ctx.font = '14px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('Click enemy ships to attack | TAB: Select ship | SPACE: End turn', WIDTH / 2, HEIGHT - 20);

  // Selected ship info
  if (game.selectedShip) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, HEIGHT - 100, 200, 80);
    ctx.fillStyle = '#ff0';
    ctx.textAlign = 'left';
    ctx.fillText(`Selected: ${game.selectedShip.name}`, 20, HEIGHT - 80);
    ctx.fillStyle = '#fff';
    ctx.fillText(`AP: ${game.selectedShip.ap}/${game.selectedShip.maxAp}`, 20, HEIGHT - 60);
    ctx.fillText(`Damage: ${game.selectedShip.damage}`, 20, HEIGHT - 40);
    ctx.fillText(`Accuracy: ${game.selectedShip.accuracy}%`, 20, HEIGHT - 20);
  }

  renderMessages();
}

function renderVictory() {
  ctx.fillStyle = 'rgba(0, 50, 0, 0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#0f0';
  ctx.font = 'bold 48px Courier New';
  ctx.textAlign = 'center';

  if (game.ghostDefeated) {
    ctx.fillText('GHOST SHIP DEFEATED!', WIDTH / 2, 200);
    ctx.fillStyle = '#8f8';
    ctx.font = '20px Courier New';
    ctx.fillText('You saved your sister and became', WIDTH / 2, 280);
    ctx.fillText('the greatest Admiral of the Caribbean!', WIDTH / 2, 310);
    ctx.fillText('+100,000 gold bonus!', WIDTH / 2, 350);
  } else {
    ctx.fillText('VICTORY!', WIDTH / 2, 200);
    ctx.fillStyle = '#8f8';
    ctx.font = '20px Courier New';
    ctx.fillText(`Battle ${game.battleNumber - 1} won!`, WIDTH / 2, 280);
    ctx.fillText(`Victories: ${game.victories}/5`, WIDTH / 2, 320);
  }

  ctx.fillStyle = '#ff0';
  ctx.font = '24px Courier New';
  ctx.fillText(`Gold: ${game.gold}`, WIDTH / 2, 400);

  ctx.fillStyle = '#fff';
  ctx.font = '20px Courier New';
  ctx.fillText('Press SPACE to continue', WIDTH / 2, 500);
}

function renderDefeat() {
  ctx.fillStyle = 'rgba(50, 0, 0, 0.9)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#f44';
  ctx.font = 'bold 48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('DEFEAT', WIDTH / 2, 200);

  ctx.fillStyle = '#f88';
  ctx.font = '20px Courier New';
  ctx.fillText('Your fleet was destroyed!', WIDTH / 2, 280);
  ctx.fillText('Lost 25% gold. Starting ship restored.', WIDTH / 2, 320);

  ctx.fillStyle = '#ff0';
  ctx.font = '24px Courier New';
  ctx.fillText(`Remaining Gold: ${game.gold}`, WIDTH / 2, 400);

  ctx.fillStyle = '#fff';
  ctx.font = '20px Courier New';
  ctx.fillText('Press SPACE to return to port', WIDTH / 2, 500);
}

function renderGameOver() {
  ctx.fillStyle = 'rgba(20, 0, 0, 0.95)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#f00';
  ctx.font = 'bold 48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', WIDTH / 2, 200);

  ctx.fillStyle = '#888';
  ctx.font = '20px Courier New';
  ctx.fillText('You lost everything...', WIDTH / 2, 280);
  ctx.fillText(`Victories achieved: ${game.victories}`, WIDTH / 2, 320);

  ctx.fillStyle = '#fff';
  ctx.font = '20px Courier New';
  ctx.fillText('Press SPACE to return to title', WIDTH / 2, 450);
}

function renderMessages() {
  ctx.textAlign = 'center';
  for (let i = 0; i < game.messages.length; i++) {
    const alpha = Math.min(1, game.messages[i].time);
    ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
    ctx.font = '16px Courier New';
    ctx.fillText(game.messages[i].text, WIDTH / 2, 100 + i * 25);
  }
}

// Main loop
function update(timestamp) {
  const dt = Math.min((timestamp - game.lastTime) / 1000, 0.1);
  game.lastTime = timestamp;

  updateMessages(dt);

  // Render
  if (game.state === 'title') {
    renderTitle();
  } else if (game.state === 'port') {
    renderPort();
  } else if (game.state === 'battle') {
    renderBattle();
  } else if (game.state === 'victory') {
    renderVictory();
  } else if (game.state === 'defeat') {
    renderDefeat();
  } else if (game.state === 'gameover') {
    renderGameOver();
  }

  game.mouse.clicked = false;

  requestAnimationFrame(update);
}

// Expose for testing with compatible property names
Object.defineProperty(window, 'gameState', {
  get: function() {
    // Map internal state names to test-expected names
    let screenName = game.state;
    if (screenName === 'battle') screenName = 'combat';

    return {
      screen: screenName,
      gold: game.gold,
      playerFleet: game.playerShips,
      enemyFleet: game.enemyShips,
      isPlayerTurn: game.turn === 'player',
      victories: game.victories,
      defeats: game.defeats,
      shipTypes: SHIP_TYPES,
      battleNumber: game.battleNumber,
      selectedShip: game.selectedShip,
      messages: game.messages,
      ghostDefeated: game.ghostDefeated
    };
  }
});

requestAnimationFrame(update);
