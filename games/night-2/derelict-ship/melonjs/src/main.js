// Using global me from CDN

// Game constants
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const PLAYER_WALK_SPEED = 2;
const PLAYER_RUN_SPEED = 3.5;
const VISION_CONE_ANGLE = 90;
const VISION_RANGE = 250;

// Game state for testing
window.gameState = {
  player: { x: 0, y: 0, hp: 100, maxHp: 100, o2: 100, maxO2: 100, facingAngle: 0 },
  enemies: 0,
  scene: 'loading'
};

// Keys state
const keys = { up: false, down: false, left: false, right: false, run: false };

// Player class using Renderable
class Player extends me.Renderable {
  constructor(x, y) {
    super(x, y, 28, 28);
    this.anchorPoint.set(0.5, 0.5);
    this.alwaysUpdate = true;

    // Stats
    this.hp = 100;
    this.maxHp = 100;
    this.o2 = 100;
    this.maxO2 = 100;
    this.flashlightOn = true;
    this.flashlightBattery = 60;

    // Movement
    this.vx = 0;
    this.vy = 0;
    this.facingAngle = 0;
    this.isMoving = false;
    this.isRunning = false;

    // Combat
    this.weaponDamage = 20;
    this.attackCooldown = 0;

    // O2 timer
    this.o2Timer = 0;
  }

  update(dt) {
    // Movement input
    let moveX = 0, moveY = 0;
    if (keys.up) moveY = -1;
    if (keys.down) moveY = 1;
    if (keys.left) moveX = -1;
    if (keys.right) moveX = 1;

    this.isMoving = moveX !== 0 || moveY !== 0;
    this.isRunning = keys.run && this.isMoving;

    const speed = this.isRunning ? PLAYER_RUN_SPEED : PLAYER_WALK_SPEED;

    // Normalize diagonal
    if (this.isMoving) {
      const len = Math.sqrt(moveX * moveX + moveY * moveY);
      this.vx = (moveX / len) * speed;
      this.vy = (moveY / len) * speed;
    } else {
      this.vx = 0;
      this.vy = 0;
    }

    // Apply movement
    this.pos.x += this.vx;
    this.pos.y += this.vy;

    // Clamp to bounds
    this.pos.x = Math.max(30, Math.min(GAME_WIDTH - 30, this.pos.x));
    this.pos.y = Math.max(30, Math.min(GAME_HEIGHT - 30, this.pos.y));

    // Wall collision
    const walls = me.game.world.getChildByName('wall');
    walls.forEach(wall => {
      if (this.overlaps(wall)) {
        // Push back
        this.pos.x -= this.vx;
        this.pos.y -= this.vy;
      }
    });

    // O2 drain
    this.o2Timer += dt;
    const drainRate = this.isRunning ? 750 : (this.isMoving ? 1500 : 2000);
    if (this.o2Timer >= drainRate) {
      this.o2 = Math.max(0, this.o2 - 1);
      this.o2Timer = 0;
    }

    // Flashlight drain
    if (this.flashlightOn) {
      this.flashlightBattery = Math.max(0, this.flashlightBattery - dt / 1000);
      if (this.flashlightBattery <= 0) this.flashlightOn = false;
    } else {
      this.flashlightBattery = Math.min(60, this.flashlightBattery + dt / 2000);
    }

    // Attack cooldown
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // Update game state
    window.gameState.player = {
      x: Math.round(this.pos.x),
      y: Math.round(this.pos.y),
      hp: this.hp,
      maxHp: this.maxHp,
      o2: this.o2,
      maxO2: this.maxO2,
      facingAngle: Math.round(this.facingAngle * 180 / Math.PI)
    };

    // Check death
    if (this.hp <= 0 || this.o2 <= 0) {
      window.gameState.scene = 'gameover';
    }

    return true;
  }

  overlaps(other) {
    return !(this.pos.x + 14 < other.pos.x ||
             this.pos.x - 14 > other.pos.x + other.width ||
             this.pos.y + 14 < other.pos.y ||
             this.pos.y - 14 > other.pos.y + other.height);
  }

  attack(enemies) {
    if (this.attackCooldown > 0) return;
    this.attackCooldown = 600;
    this.o2 = Math.max(0, this.o2 - 2);

    const attackRange = 60;
    enemies.forEach(enemy => {
      const dx = enemy.pos.x - this.pos.x;
      const dy = enemy.pos.y - this.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const angleDiff = Math.abs(angle - this.facingAngle);

      if (dist < attackRange && (angleDiff < Math.PI / 3 || angleDiff > Math.PI * 5 / 3)) {
        enemy.takeDamage(this.weaponDamage);
      }
    });
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }

  addO2(amount) {
    this.o2 = Math.min(this.maxO2, this.o2 + amount);
  }

  draw(renderer) {
    const ctx = renderer.getContext();

    // Player body
    ctx.fillStyle = '#44aaff';
    ctx.fillRect(this.pos.x - 14, this.pos.y - 14, 28, 28);

    // Direction indicator
    const indLen = 20;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.pos.x, this.pos.y);
    ctx.lineTo(
      this.pos.x + Math.cos(this.facingAngle) * indLen,
      this.pos.y + Math.sin(this.facingAngle) * indLen
    );
    ctx.stroke();
  }
}

// Crawler enemy
class Crawler extends me.Renderable {
  constructor(x, y) {
    super(x, y, 28, 28);
    this.anchorPoint.set(0.5, 0.5);
    this.alwaysUpdate = true;
    this.name = 'crawler';

    this.hp = 30;
    this.maxHp = 30;
    this.damage = 15;
    this.speed = 1.2;
    this.detectionRange = 250;
    this.attackCooldown = 0;
    this.state = 'patrol';
    this.patrolTarget = { x: x + Math.random() * 100 - 50, y: y + Math.random() * 100 - 50 };
  }

  update(dt) {
    const player = me.game.world.getChildByName('player')[0];
    if (!player) return true;

    const dx = player.pos.x - this.pos.x;
    const dy = player.pos.y - this.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    if (dist < this.detectionRange) {
      // Chase
      this.state = 'chase';
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        this.pos.x += (dx / len) * this.speed;
        this.pos.y += (dy / len) * this.speed;
      }

      // Attack
      if (dist < 40 && this.attackCooldown <= 0) {
        player.takeDamage(this.damage);
        this.attackCooldown = 1200;
      }
    } else {
      // Patrol
      this.state = 'patrol';
      const pdx = this.patrolTarget.x - this.pos.x;
      const pdy = this.patrolTarget.y - this.pos.y;
      const pDist = Math.sqrt(pdx * pdx + pdy * pdy);

      if (pDist < 20) {
        this.patrolTarget = {
          x: this.pos.x + Math.random() * 200 - 100,
          y: this.pos.y + Math.random() * 200 - 100
        };
      } else {
        this.pos.x += (pdx / pDist) * this.speed * 0.5;
        this.pos.y += (pdy / pDist) * this.speed * 0.5;
      }
    }

    // Bounds
    this.pos.x = Math.max(30, Math.min(GAME_WIDTH - 30, this.pos.x));
    this.pos.y = Math.max(30, Math.min(GAME_HEIGHT - 30, this.pos.y));

    return true;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      me.game.world.removeChild(this);
    }
  }

  draw(renderer) {
    const ctx = renderer.getContext();

    // Enemy body
    ctx.fillStyle = this.state === 'chase' ? '#ff2222' : '#aa4444';
    ctx.fillRect(this.pos.x - 14, this.pos.y - 14, 28, 28);

    // HP bar
    ctx.fillStyle = '#333';
    ctx.fillRect(this.pos.x - 14, this.pos.y - 22, 28, 4);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(this.pos.x - 14, this.pos.y - 22, 28 * (this.hp / this.maxHp), 4);
  }
}

// O2 Canister
class O2Canister extends me.Renderable {
  constructor(x, y, large = false) {
    super(x, y, 16, 16);
    this.anchorPoint.set(0.5, 0.5);
    this.alwaysUpdate = true;
    this.o2Amount = large ? 50 : 25;
    this.bobOffset = Math.random() * Math.PI * 2;
    this.baseY = y;
    this.large = large;
  }

  update(dt) {
    this.bobOffset += dt * 0.003;
    this.pos.y = this.baseY + Math.sin(this.bobOffset) * 3;

    const player = me.game.world.getChildByName('player')[0];
    if (player) {
      const dx = player.pos.x - this.pos.x;
      const dy = player.pos.y - this.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 30) {
        player.addO2(this.o2Amount);
        me.game.world.removeChild(this);
      }
    }
    return true;
  }

  draw(renderer) {
    const ctx = renderer.getContext();
    const size = this.large ? 14 : 10;
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(this.pos.x - size/2, this.pos.y - size/2, size, size);
    ctx.strokeStyle = '#88ffff';
    ctx.strokeRect(this.pos.x - size/2, this.pos.y - size/2, size, size);
  }
}

// Wall
class Wall extends me.Renderable {
  constructor(x, y, w, h) {
    super(x, y, w, h);
    this.name = 'wall';
  }

  draw(renderer) {
    const ctx = renderer.getContext();
    ctx.fillStyle = '#333344';
    ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
  }
}

// Vision overlay
class VisionOverlay extends me.Renderable {
  constructor() {
    super(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.alwaysUpdate = true;
    this.floating = true;
  }

  update(dt) {
    return true;
  }

  draw(renderer) {
    const player = me.game.world.getChildByName('player')[0];
    if (!player) return;

    const ctx = renderer.getContext();
    ctx.save();

    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Cut out vision cone
    ctx.globalCompositeOperation = 'destination-out';

    const range = player.flashlightOn ? VISION_RANGE : 80;
    const halfAngle = (VISION_CONE_ANGLE / 2) * Math.PI / 180;

    // Vision cone gradient
    const gradient = ctx.createRadialGradient(
      player.pos.x, player.pos.y, 0,
      player.pos.x, player.pos.y, range
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.moveTo(player.pos.x, player.pos.y);
    ctx.arc(player.pos.x, player.pos.y, range, player.facingAngle - halfAngle, player.facingAngle + halfAngle);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Ambient circle
    const ambientGradient = ctx.createRadialGradient(
      player.pos.x, player.pos.y, 0,
      player.pos.x, player.pos.y, 50
    );
    ambientGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    ambientGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.arc(player.pos.x, player.pos.y, 50, 0, Math.PI * 2);
    ctx.fillStyle = ambientGradient;
    ctx.fill();

    ctx.restore();
  }
}

// HUD
class HUD extends me.Renderable {
  constructor() {
    super(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.alwaysUpdate = true;
    this.floating = true;
  }

  update(dt) {
    return true;
  }

  draw(renderer) {
    const player = me.game.world.getChildByName('player')[0];
    if (!player) return;

    const ctx = renderer.getContext();

    // HP Bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 10, 200, 20);
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(10, 10, 200 * (player.hp / player.maxHp), 20);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 200, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, 15, 25);

    // O2 Bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 35, 200, 20);
    ctx.fillStyle = player.o2 < 20 ? '#ff0000' : '#00ccff';
    ctx.fillRect(10, 35, 200 * (player.o2 / player.maxO2), 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 35, 200, 20);
    ctx.fillStyle = '#fff';
    ctx.fillText(`O2: ${player.o2}/${player.maxO2}`, 15, 50);

    // Flashlight
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 60, 100, 15);
    ctx.fillStyle = player.flashlightOn ? '#ffff00' : '#666600';
    ctx.fillRect(10, 60, 100 * (player.flashlightBattery / 60), 15);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 60, 100, 15);
    ctx.font = '11px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(player.flashlightOn ? 'LIGHT: ON' : 'LIGHT: OFF', 12, 72);

    // Controls
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText('WASD: Move | SHIFT: Run | F: Flashlight | CLICK: Attack', 10, GAME_HEIGHT - 10);

    // Enemy count
    const enemies = me.game.world.getChildByName('crawler');
    window.gameState.enemies = enemies.length;
    ctx.fillText(`Enemies: ${enemies.length}`, GAME_WIDTH - 120, 25);

    // Low O2 warning
    if (player.o2 < 20) {
      ctx.fillStyle = `rgba(255, 0, 0, ${0.3 + Math.sin(Date.now() / 200) * 0.2})`;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = '#ff0000';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LOW OXYGEN!', GAME_WIDTH / 2, 100);
      ctx.textAlign = 'left';
    }

    // Game over
    if (window.gameState.scene === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(player.o2 <= 0 ? 'SUFFOCATED' : 'DEAD', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
      ctx.font = '18px monospace';
      ctx.fillStyle = '#888';
      ctx.fillText(player.o2 <= 0 ?
        'Your lungs burned for oxygen that never came.' :
        "Your body joins the ship's other victims.",
        GAME_WIDTH / 2, GAME_HEIGHT / 2);
      ctx.fillStyle = '#44ff44';
      ctx.fillText('Press SPACE to restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
      ctx.textAlign = 'left';
    }
  }
}

// Game scene
class PlayScreen extends me.Stage {
  onResetEvent() {
    window.gameState.scene = 'game';
    me.game.world.reset();

    // Background
    me.game.world.addChild(new me.ColorLayer('background', '#0a0a15'), 0);

    // Walls
    me.game.world.addChild(new Wall(0, 0, GAME_WIDTH, 20), 5);
    me.game.world.addChild(new Wall(0, GAME_HEIGHT - 20, GAME_WIDTH, 20), 5);
    me.game.world.addChild(new Wall(0, 0, 20, GAME_HEIGHT), 5);
    me.game.world.addChild(new Wall(GAME_WIDTH - 20, 0, 20, GAME_HEIGHT), 5);

    // Interior walls
    me.game.world.addChild(new Wall(300, 150, 200, 15), 5);
    me.game.world.addChild(new Wall(300, 150, 15, 180), 5);
    me.game.world.addChild(new Wall(750, 400, 15, 200), 5);
    me.game.world.addChild(new Wall(750, 400, 200, 15), 5);

    // Player
    const player = new Player(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    player.name = 'player';
    me.game.world.addChild(player, 10);

    // Enemies
    [{ x: 200, y: 150 }, { x: 950, y: 200 }, { x: 150, y: 550 }, { x: 1050, y: 600 }].forEach(pos => {
      me.game.world.addChild(new Crawler(pos.x, pos.y), 8);
    });

    // O2 canisters
    [{ x: 100, y: 100 }, { x: 1150, y: 120 }, { x: 180, y: 620 }, { x: 1100, y: 650 }].forEach(pos => {
      me.game.world.addChild(new O2Canister(pos.x, pos.y), 7);
    });
    me.game.world.addChild(new O2Canister(640, 360, true), 7);

    // Vision overlay
    me.game.world.addChild(new VisionOverlay(), 50);

    // HUD
    me.game.world.addChild(new HUD(), 100);
  }
}

// Title screen
class TitleScreen extends me.Stage {
  onResetEvent() {
    window.gameState.scene = 'title';
    me.game.world.reset();
    me.game.world.addChild(new me.ColorLayer('background', '#0a0a15'), 0);

    const titleText = new me.Text(GAME_WIDTH / 2, 200, {
      font: 'monospace', size: 64, fillStyle: '#ff4444', textAlign: 'center', text: 'DERELICT'
    });
    me.game.world.addChild(titleText, 10);

    const subText = new me.Text(GAME_WIDTH / 2, 280, {
      font: 'monospace', size: 18, fillStyle: '#888', textAlign: 'center',
      text: 'Alone on a dying ship. Every breath costs you.'
    });
    me.game.world.addChild(subText, 10);

    const startText = new me.Text(GAME_WIDTH / 2, 450, {
      font: 'monospace', size: 24, fillStyle: '#44ff44', textAlign: 'center', text: 'Press SPACE to Start'
    });
    me.game.world.addChild(startText, 10);

    const ctrlText = new me.Text(GAME_WIDTH / 2, 550, {
      font: 'monospace', size: 14, fillStyle: '#666', textAlign: 'center',
      text: 'WASD: Move | SHIFT: Run | F: Flashlight | CLICK: Attack'
    });
    me.game.world.addChild(ctrlText, 10);
  }
}

// Initialize
me.device.onReady(() => {
  if (!me.video.init(GAME_WIDTH, GAME_HEIGHT, {
    parent: 'game',
    renderer: me.video.CANVAS,
    scale: 'auto',
    scaleMethod: 'fit'
  })) {
    alert('Failed to initialize');
    return;
  }

  // Register stages
  me.state.set(me.state.MENU, new TitleScreen());
  me.state.set(me.state.PLAY, new PlayScreen());

  // Mouse tracking for player facing
  me.input.registerPointerEvent('pointermove', me.game.viewport, (e) => {
    const player = me.game.world.getChildByName('player')[0];
    if (player) {
      const dx = e.gameX - player.pos.x;
      const dy = e.gameY - player.pos.y;
      player.facingAngle = Math.atan2(dy, dx);
    }
  });

  // Mouse attack
  me.input.registerPointerEvent('pointerdown', me.game.viewport, () => {
    const player = me.game.world.getChildByName('player')[0];
    if (player) {
      const enemies = me.game.world.getChildByName('crawler');
      player.attack(enemies);
    }
  });

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.run = true;

    if (e.code === 'Space') {
      if (window.gameState.scene === 'title' || window.gameState.scene === 'gameover') {
        me.state.change(me.state.PLAY);
      }
    }
    if (e.code === 'KeyF') {
      const player = me.game.world.getChildByName('player')[0];
      if (player && player.flashlightBattery > 0) {
        player.flashlightOn = !player.flashlightOn;
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.run = false;
  });

  me.state.change(me.state.MENU);
  window.gameState.scene = 'ready';
});
