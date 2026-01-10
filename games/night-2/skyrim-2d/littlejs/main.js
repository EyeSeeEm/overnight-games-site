// Frostfall - 2D Skyrim Demake (LittleJS)
// Uses globals from CDN (engineInit, vec2, Color, etc.)

// Game constants
const TILE_SIZE = 16;
const PLAYER_SPEED = 1.5;
const SPRINT_MULTIPLIER = 1.6;

// Game state
const gs = {
  hp: 100,
  maxHp: 100,
  stamina: 100,
  maxStamina: 100,
  magicka: 50,
  maxMagicka: 50,
  gold: 50,
  level: 1,
  xp: 0,
  xpToLevel: 100,
  combatSkill: 1,
  questStage: 0,
  kills: 0,
  started: false,
  paused: false,
  inventory: []
};

// Arrays
let player;
let enemies = [];
let items = [];
let projectiles = [];
let damageNumbers = [];

// Expose for testing
window.gameState = gs;
function updateGameState() {
  window.gameState = {
    hp: gs.hp,
    maxHp: gs.maxHp,
    stamina: gs.stamina,
    maxStamina: gs.maxStamina,
    gold: gs.gold,
    level: gs.level,
    xp: gs.xp,
    kills: gs.kills,
    questStage: gs.questStage
  };
}

// Player class
class Player extends EngineObject {
  constructor(pos) {
    super(pos, vec2(0.8, 0.8));
    this.setCollision(true, true);
    this.attackTimer = new Timer();
    this.dodgeTimer = new Timer();
    this.invulnTimer = new Timer();
    this.angle = 0;
    this.attacking = false;
  }

  update() {
    if (!gs.started || gs.paused) return;

    // Movement
    let moveDir = vec2(0, 0);
    if (keyIsDown('KeyW') || keyIsDown('ArrowUp')) moveDir.y += 1;
    if (keyIsDown('KeyS') || keyIsDown('ArrowDown')) moveDir.y -= 1;
    if (keyIsDown('KeyA') || keyIsDown('ArrowLeft')) moveDir.x -= 1;
    if (keyIsDown('KeyD') || keyIsDown('ArrowRight')) moveDir.x += 1;

    // Sprint
    const sprinting = keyIsDown('ShiftLeft') && gs.stamina > 5;
    let speed = PLAYER_SPEED;
    if (sprinting && moveDir.length() > 0) {
      speed *= SPRINT_MULTIPLIER;
      gs.stamina = Math.max(0, gs.stamina - 0.3);
    } else if (gs.stamina < gs.maxStamina) {
      gs.stamina = Math.min(gs.maxStamina, gs.stamina + 0.15);
    }

    if (moveDir.length() > 0) {
      moveDir = moveDir.normalize();
      this.velocity = moveDir.scale(speed * 0.1);
      this.angle = Math.atan2(moveDir.y, moveDir.x);
    } else {
      this.velocity = vec2(0, 0);
    }

    // Face mouse
    const worldMouse = mousePos;
    const toMouse = worldMouse.subtract(this.pos);
    if (toMouse.length() > 0.5) {
      this.angle = Math.atan2(toMouse.y, toMouse.x);
    }

    // Attack
    if (mouseWasPressed(0) && this.attackTimer.elapsed() && gs.stamina >= 10) {
      this.attack();
    }

    // Dodge roll (Space)
    if (keyWasPressed('Space') && this.dodgeTimer.elapsed() && gs.stamina >= 20) {
      this.dodge();
    }

    super.update();

    // Camera follow
    setCameraPos(this.pos);
  }

  attack() {
    this.attackTimer.set(0.4);
    gs.stamina -= 10;
    this.attacking = true;

    // Swing damage
    setTimeout(() => {
      this.attacking = false;
      // Check for enemy hits
      const attackDir = vec2(Math.cos(this.angle), Math.sin(this.angle));
      const attackPos = this.pos.add(attackDir.scale(1.2));

      for (const enemy of enemies) {
        const dist = enemy.pos.subtract(attackPos).length();
        if (dist < 1.5) {
          const damage = 10 + gs.combatSkill * 2;
          enemy.takeDamage(damage);
          gs.xp += 5;
          checkLevelUp();
        }
      }
    }, 150);
  }

  dodge() {
    const dir = vec2(Math.cos(this.angle), Math.sin(this.angle));
    this.velocity = dir.scale(0.5);
    this.dodgeTimer.set(0.6);
    this.invulnTimer.set(0.3);
    gs.stamina -= 20;
  }

  takeDamage(amount) {
    if (!this.invulnTimer.elapsed()) return;
    gs.hp -= amount;
    this.invulnTimer.set(0.5);
    spawnDamageNumber(this.pos, amount, '#ff4444');

    if (gs.hp <= 0) {
      gs.hp = 0;
      // Death - respawn
      setTimeout(() => {
        gs.hp = gs.maxHp;
        gs.stamina = gs.maxStamina;
        this.pos = vec2(0, 0);
      }, 2000);
    }
  }

  render() {
    // Body
    const color = this.invulnTimer.elapsed() ? new Color(0.3, 0.5, 0.8) : new Color(0.5, 0.5, 0.8);
    drawRect(this.pos, vec2(0.8, 1), color);

    // Direction indicator
    const dir = vec2(Math.cos(this.angle), Math.sin(this.angle));
    const weaponPos = this.pos.add(dir.scale(0.6));
    drawRect(weaponPos, vec2(0.6, 0.2), new Color(0.7, 0.7, 0.7), this.angle);

    // Attack swing
    if (this.attacking) {
      const swingPos = this.pos.add(dir.scale(1));
      drawCircle(swingPos, 0.8, new Color(1, 1, 1, 0.3));
    }
  }
}

// Enemy base class
class Enemy extends EngineObject {
  constructor(pos, type) {
    super(pos, vec2(0.7, 0.7));
    this.setCollision(true, true);
    this.type = type;
    this.hp = type === 'bandit' ? 40 : 25;
    this.maxHp = this.hp;
    this.damage = type === 'bandit' ? 8 : 6;
    this.speed = type === 'bandit' ? 0.8 : 1.2;
    this.state = 'idle';
    this.attackTimer = new Timer();
    this.stateTimer = new Timer();
    this.homePos = pos.copy();
    this.aggroRange = type === 'bandit' ? 6 : 5;
    this.attackRange = type === 'bandit' ? 1.2 : 1;
    this.goldDrop = type === 'bandit' ? randInt(5, 15) : 0;
  }

  update() {
    if (!gs.started || gs.paused || !player) return;

    const toPlayer = player.pos.subtract(this.pos);
    const dist = toPlayer.length();

    switch (this.state) {
      case 'idle':
        if (dist < this.aggroRange) {
          this.state = 'chase';
        }
        break;

      case 'chase':
        if (dist > this.aggroRange * 2) {
          this.state = 'return';
        } else if (dist < this.attackRange) {
          this.state = 'attack';
        } else {
          const dir = toPlayer.normalize();
          this.velocity = dir.scale(this.speed * 0.1);
        }
        break;

      case 'attack':
        this.velocity = vec2(0, 0);
        if (this.attackTimer.elapsed()) {
          if (dist < this.attackRange * 1.5) {
            player.takeDamage(this.damage);
            this.attackTimer.set(1);
          } else {
            this.state = 'chase';
          }
        }
        break;

      case 'return':
        const toHome = this.homePos.subtract(this.pos);
        if (toHome.length() < 0.5) {
          this.state = 'idle';
          this.velocity = vec2(0, 0);
        } else {
          this.velocity = toHome.normalize().scale(this.speed * 0.08);
        }
        if (dist < this.aggroRange) {
          this.state = 'chase';
        }
        break;
    }

    super.update();
  }

  takeDamage(amount) {
    this.hp -= amount;
    spawnDamageNumber(this.pos, amount, '#ffff00');

    if (this.hp <= 0) {
      this.destroy();
      enemies = enemies.filter(e => e !== this);
      gs.kills++;
      gs.gold += this.goldDrop;

      // Drop loot
      if (rand() < 0.3) {
        items.push(new Item(this.pos, 'potion'));
      }
    }
  }

  render() {
    const color = this.type === 'bandit'
      ? new Color(0.6, 0.3, 0.3)
      : new Color(0.5, 0.4, 0.3);
    drawRect(this.pos, vec2(0.7, 0.8), color);

    // Health bar
    if (this.hp < this.maxHp) {
      const barWidth = 0.8;
      const barY = this.pos.y + 0.6;
      drawRect(vec2(this.pos.x, barY), vec2(barWidth, 0.1), new Color(0.3, 0.3, 0.3));
      drawRect(vec2(this.pos.x - barWidth/2 + (barWidth * this.hp/this.maxHp)/2, barY),
               vec2(barWidth * this.hp/this.maxHp, 0.1), new Color(0.8, 0.2, 0.2));
    }

    // State indicator
    if (this.state === 'chase' || this.state === 'attack') {
      drawRect(vec2(this.pos.x, this.pos.y + 0.8), vec2(0.2, 0.2), new Color(1, 0, 0));
    }
  }
}

// Item class
class Item extends EngineObject {
  constructor(pos, type) {
    super(pos, vec2(0.4, 0.4));
    this.type = type;
    this.bobOffset = rand() * PI * 2;
  }

  update() {
    if (!player) return;

    const dist = player.pos.subtract(this.pos).length();
    if (dist < 1) {
      this.collect();
    }
  }

  collect() {
    if (this.type === 'potion') {
      gs.hp = Math.min(gs.maxHp, gs.hp + 25);
      spawnDamageNumber(this.pos, '+25', '#44ff44');
    } else if (this.type === 'gold') {
      gs.gold += 10;
      spawnDamageNumber(this.pos, '+10g', '#ffdd00');
    }
    items = items.filter(i => i !== this);
    this.destroy();
  }

  render() {
    const bob = Math.sin(time * 3 + this.bobOffset) * 0.1;
    const pos = vec2(this.pos.x, this.pos.y + bob);
    const color = this.type === 'potion'
      ? new Color(0.8, 0.2, 0.2)
      : new Color(1, 0.85, 0);
    drawRect(pos, vec2(0.4, 0.4), color);
  }
}

// Damage number
function spawnDamageNumber(pos, text, color) {
  damageNumbers.push({
    pos: pos.copy(),
    text: String(text),
    color,
    life: 60,
    vy: 0.03
  });
}

function checkLevelUp() {
  while (gs.xp >= gs.xpToLevel) {
    gs.xp -= gs.xpToLevel;
    gs.level++;
    gs.xpToLevel = 100 * gs.level;
    gs.maxHp += 10;
    gs.hp = gs.maxHp;
    gs.maxStamina += 5;
    gs.combatSkill = Math.min(10, gs.combatSkill + 1);
    spawnDamageNumber(player.pos, 'LEVEL UP!', '#00ffff');
  }
}

// Spawn enemies
function spawnEnemies() {
  // Bandits
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * PI * 2;
    const dist = 8 + rand() * 5;
    const pos = vec2(Math.cos(angle) * dist, Math.sin(angle) * dist);
    enemies.push(new Enemy(pos, 'bandit'));
  }

  // Wolves
  for (let i = 0; i < 4; i++) {
    const angle = rand() * PI * 2;
    const dist = 12 + rand() * 8;
    const pos = vec2(Math.cos(angle) * dist, Math.sin(angle) * dist);
    enemies.push(new Enemy(pos, 'wolf'));
  }

  // Items
  for (let i = 0; i < 3; i++) {
    const pos = vec2(rand(-10, 10), rand(-10, 10));
    items.push(new Item(pos, rand() < 0.5 ? 'potion' : 'gold'));
  }
}

// Draw ground tiles
function drawGround() {
  const camPos = cameraPos;
  const range = 15;

  for (let x = Math.floor(camPos.x - range); x < camPos.x + range; x++) {
    for (let y = Math.floor(camPos.y - range); y < camPos.y + range; y++) {
      // Grass variation
      const shade = 0.3 + ((x * 7 + y * 13) % 10) / 50;
      drawRect(vec2(x + 0.5, y + 0.5), vec2(1, 1), new Color(shade * 0.6, shade, shade * 0.4));

      // Random details
      if ((x * 17 + y * 23) % 20 === 0) {
        drawRect(vec2(x + 0.5, y + 0.5), vec2(0.3, 0.3), new Color(0.4, 0.25, 0.1));
      }
    }
  }
}

// Draw HUD
function drawHUD() {
  const screenWidth = 1280;
  const screenHeight = 720;

  // Health bar
  drawTextScreen('HP', vec2(20, 30), 20, new Color(1, 1, 1));
  drawRect(vec2(80, screenHeight - 35), vec2(150 / cameraScale, 15 / cameraScale), new Color(0.3, 0.3, 0.3));
  const hpWidth = 150 * (gs.hp / gs.maxHp);
  if (hpWidth > 0) {
    drawRect(vec2(5 + hpWidth/2, screenHeight - 35), vec2(hpWidth / cameraScale, 13 / cameraScale), new Color(0.8, 0.2, 0.2));
  }
  drawTextScreen(`${Math.floor(gs.hp)}/${gs.maxHp}`, vec2(80, 30), 14, new Color(1, 1, 1));

  // Stamina bar
  drawTextScreen('ST', vec2(20, 55), 20, new Color(1, 1, 1));
  drawRect(vec2(80, screenHeight - 60), vec2(150 / cameraScale, 15 / cameraScale), new Color(0.3, 0.3, 0.3));
  const stWidth = 150 * (gs.stamina / gs.maxStamina);
  if (stWidth > 0) {
    drawRect(vec2(5 + stWidth/2, screenHeight - 60), vec2(stWidth / cameraScale, 13 / cameraScale), new Color(0.2, 0.7, 0.2));
  }

  // Gold and Level
  drawTextScreen(`Gold: ${gs.gold}`, vec2(20, 85), 18, new Color(1, 0.85, 0));
  drawTextScreen(`Level: ${gs.level}`, vec2(20, 110), 18, new Color(0.6, 0.8, 1));
  drawTextScreen(`XP: ${gs.xp}/${gs.xpToLevel}`, vec2(20, 135), 14, new Color(0.8, 0.8, 0.8));

  // Kills
  drawTextScreen(`Kills: ${gs.kills}`, vec2(screenWidth - 100, 30), 18, new Color(1, 0.5, 0.5));

  // Quest
  const questText = gs.questStage === 0 ? 'Quest: Explore the wilderness'
                  : gs.questStage === 1 ? 'Quest: Defeat the bandits'
                  : 'Quest: Return to village';
  drawTextScreen(questText, vec2(screenWidth / 2, 30), 16, new Color(1, 1, 0.6), 0, undefined, 'center');

  // Controls help
  drawTextScreen('[WASD] Move  [Click] Attack  [Space] Dodge  [Shift] Sprint',
                 vec2(screenWidth / 2, screenHeight - 30), 14, new Color(0.7, 0.7, 0.7), 0, undefined, 'center');
}

// Draw start screen
function drawStartScreen() {
  drawTextScreen('FROSTFALL', vec2(640, 200), 64, new Color(0.6, 0.8, 1), 0, undefined, 'center');
  drawTextScreen('A 2D Skyrim Demake', vec2(640, 270), 24, new Color(0.7, 0.7, 0.8), 0, undefined, 'center');

  drawTextScreen('[WASD] Move', vec2(640, 350), 20, new Color(0.8, 0.8, 0.8), 0, undefined, 'center');
  drawTextScreen('[Left Click] Attack', vec2(640, 380), 20, new Color(0.8, 0.8, 0.8), 0, undefined, 'center');
  drawTextScreen('[Space] Dodge Roll', vec2(640, 410), 20, new Color(0.8, 0.8, 0.8), 0, undefined, 'center');
  drawTextScreen('[Shift] Sprint', vec2(640, 440), 20, new Color(0.8, 0.8, 0.8), 0, undefined, 'center');

  drawTextScreen('Click to Begin Your Adventure', vec2(640, 520), 28, new Color(0.4, 1, 0.4), 0, undefined, 'center');
}

// Game functions
function gameInit() {
  setCameraScale(40);
  player = new Player(vec2(0, 0));
  spawnEnemies();
  updateGameState();
}

function gameUpdate() {
  if (!gs.started) {
    if (mouseWasPressed(0)) {
      gs.started = true;
    }
    return;
  }

  // Update damage numbers
  damageNumbers = damageNumbers.filter(d => {
    d.pos.y += d.vy;
    d.life--;
    return d.life > 0;
  });

  // Quest progression
  if (gs.kills >= 3 && gs.questStage === 0) {
    gs.questStage = 1;
    spawnDamageNumber(player.pos, 'Quest Updated!', '#ffff00');
  }
  if (gs.kills >= 7 && gs.questStage === 1) {
    gs.questStage = 2;
    spawnDamageNumber(player.pos, 'Quest Complete!', '#00ff00');
  }

  updateGameState();
}

function gameUpdatePost() {
  // Post update
}

function gameRender() {
  // Draw ground
  drawGround();
}

function gameRenderPost() {
  if (!gs.started) {
    drawStartScreen();
    return;
  }

  // Render items
  for (const item of items) {
    item.render();
  }

  // Render enemies
  for (const enemy of enemies) {
    enemy.render();
  }

  // Render player
  if (player) {
    player.render();
  }

  // Render damage numbers
  for (const d of damageNumbers) {
    const alpha = d.life / 60;
    drawTextScreen(d.text, vec2(
      640 + (d.pos.x - cameraPos.x) * cameraScale,
      360 - (d.pos.y - cameraPos.y) * cameraScale
    ), 20, new Color(1, 1, 1, alpha));
  }

  // HUD
  drawHUD();
}

// Initialize engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
console.log('Frostfall (LittleJS) initialized');
