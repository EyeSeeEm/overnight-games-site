// Derelict - 2D Survival Horror (Excalibur)
// Top-down horror with vision cone and O2 management
// Using global ex from CDN

// Game constants
const TILE_SIZE = 32;
const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 600;

// Vision cone settings
const VISION_ANGLE = Math.PI / 2; // 90 degrees
const VISION_RANGE_LIT = 400;
const VISION_RANGE_DARK = 200;
const VISION_RANGE_NO_LIGHT = 60;

// O2 settings
const MAX_O2 = 100;
const O2_DRAIN_IDLE = 0.5; // per second
const O2_DRAIN_WALK = 0.67; // per second
const O2_DRAIN_RUN = 1.33; // per second
const O2_DRAIN_COMBAT = 2; // per attack

// Player settings
const PLAYER_SPEED = 120;
const PLAYER_RUN_SPEED = 200;
const PLAYER_HP = 100;
const ATTACK_COOLDOWN = 600; // ms
const ATTACK_DAMAGE = 20;
const ATTACK_RANGE = 50;

// Enemy settings
const CRAWLER_HP = 30;
const CRAWLER_DAMAGE = 15;
const CRAWLER_SPEED = 80;
const CRAWLER_DETECT_RANGE = 250;

// Collision groups
const PlayerGroup = ex.CollisionGroupManager.create('player');
const EnemyGroup = ex.CollisionGroupManager.create('enemy');
const WallGroup = ex.CollisionGroupManager.create('wall');
const ItemGroup = ex.CollisionGroupManager.create('item');

// Create the game
const game = new ex.Engine({
  width: VIEW_WIDTH,
  height: VIEW_HEIGHT,
  backgroundColor: ex.Color.fromHex('#0a0a0f'),
  displayMode: ex.DisplayMode.FitScreen,
  antialiasing: false
});

// Game state
let gameState = {
  hp: PLAYER_HP,
  maxHp: PLAYER_HP,
  o2: MAX_O2,
  maxO2: MAX_O2,
  flashlightOn: true,
  flashlightBattery: 60,
  isRunning: false,
  lastAttackTime: 0,
  enemiesKilled: 0,
  sector: 1,
  playing: true
};

// Expose for testing
window.gameState = gameState;

// Map data - simple layout for sector 1
const mapLayout = [
  '################',
  '#..............#',
  '#..###....###..#',
  '#..#........#..#',
  '#..#..C.....#..#',
  '#..###....###..#',
  '#..............#',
  '#....####......#',
  '#....#..#......#',
  '#....#..#..O...#',
  '#....####......#',
  '#..............#',
  '#..###....###..#',
  '#..#..C...#....#',
  '#..#......#....#',
  '#P.###....###..#',
  '#..............#',
  '################'
];

// Player class
class Player extends ex.Actor {
  constructor(x, y) {
    super({
      x: x,
      y: y,
      width: 24,
      height: 24,
      color: ex.Color.fromHex('#4fc3f7'),
      collisionType: ex.CollisionType.Active,
      collisionGroup: PlayerGroup
    });
    this.facingAngle = 0;
    this.isMoving = false;
  }

  onInitialize(engine) {
    // Collision handling
    this.on('collisionstart', (evt) => {
      if (evt.other instanceof Enemy) {
        // Damage is handled by enemy
      }
    });
  }

  onPreUpdate(engine, delta) {
    if (!gameState.playing) return;

    // Get mouse position for facing direction
    const mousePos = engine.input.pointers.primary.lastWorldPos;
    this.facingAngle = Math.atan2(mousePos.y - this.pos.y, mousePos.x - this.pos.x);

    // Movement
    let dx = 0;
    let dy = 0;
    const keyboard = engine.input.keyboard;

    if (keyboard.isHeld(ex.Keys.W) || keyboard.isHeld(ex.Keys.ArrowUp)) dy = -1;
    if (keyboard.isHeld(ex.Keys.S) || keyboard.isHeld(ex.Keys.ArrowDown)) dy = 1;
    if (keyboard.isHeld(ex.Keys.A) || keyboard.isHeld(ex.Keys.ArrowLeft)) dx = -1;
    if (keyboard.isHeld(ex.Keys.D) || keyboard.isHeld(ex.Keys.ArrowRight)) dx = 1;

    // Running
    gameState.isRunning = keyboard.isHeld(ex.Keys.ShiftLeft) || keyboard.isHeld(ex.Keys.ShiftRight);
    const speed = gameState.isRunning ? PLAYER_RUN_SPEED : PLAYER_SPEED;

    // Normalize and apply movement
    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      this.vel.x = (dx / len) * speed;
      this.vel.y = (dy / len) * speed;
      this.isMoving = true;
    } else {
      this.vel.x = 0;
      this.vel.y = 0;
      this.isMoving = false;
    }

    // O2 drain
    let o2Drain = O2_DRAIN_IDLE;
    if (this.isMoving) {
      o2Drain = gameState.isRunning ? O2_DRAIN_RUN : O2_DRAIN_WALK;
    }
    gameState.o2 -= o2Drain * (delta / 1000);
    gameState.o2 = Math.max(0, gameState.o2);

    // Flashlight drain
    if (gameState.flashlightOn) {
      gameState.flashlightBattery -= delta / 1000;
      if (gameState.flashlightBattery <= 0) {
        gameState.flashlightOn = false;
        gameState.flashlightBattery = 0;
      }
    } else {
      // Recharge when off
      gameState.flashlightBattery = Math.min(60, gameState.flashlightBattery + 0.5 * (delta / 1000));
    }

    // Flashlight toggle
    if (keyboard.wasPressed(ex.Keys.F)) {
      if (gameState.flashlightBattery > 0) {
        gameState.flashlightOn = !gameState.flashlightOn;
      }
    }

    // Attack
    if (engine.input.pointers.primary.wasPressed) {
      const now = Date.now();
      if (now - gameState.lastAttackTime >= ATTACK_COOLDOWN) {
        this.attack(engine);
        gameState.lastAttackTime = now;
        gameState.o2 -= O2_DRAIN_COMBAT;
      }
    }

    // Death checks
    if (gameState.o2 <= 0 || gameState.hp <= 0) {
      gameState.playing = false;
    }

    // Update window state
    window.gameState = {
      hp: Math.floor(gameState.hp),
      o2: Math.floor(gameState.o2),
      sector: gameState.sector,
      flashlight: gameState.flashlightOn,
      enemiesKilled: gameState.enemiesKilled,
      playing: gameState.playing
    };
  }

  attack(engine) {
    // Create attack visual
    const attackX = this.pos.x + Math.cos(this.facingAngle) * 30;
    const attackY = this.pos.y + Math.sin(this.facingAngle) * 30;

    const attackEffect = new ex.Actor({
      x: attackX,
      y: attackY,
      width: 30,
      height: 30,
      color: ex.Color.fromHex('#ffeb3b')
    });

    engine.currentScene.add(attackEffect);
    attackEffect.actions.delay(100).die();

    // Check for enemy hits
    const enemies = engine.currentScene.actors.filter(a => a instanceof Enemy);
    for (const enemy of enemies) {
      const dist = this.pos.distance(enemy.pos);
      const angleToEnemy = Math.atan2(enemy.pos.y - this.pos.y, enemy.pos.x - this.pos.x);
      let angleDiff = Math.abs(angleToEnemy - this.facingAngle);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

      if (dist < ATTACK_RANGE && angleDiff < Math.PI / 4) {
        enemy.takeDamage(ATTACK_DAMAGE);
      }
    }
  }

  onPostDraw(ctx, delta) {
    // Draw facing indicator
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(this.facingAngle) * 20, Math.sin(this.facingAngle) * 20);
    ctx.stroke();
    ctx.restore();
  }
}

// Enemy class - Crawler
class Enemy extends ex.Actor {
  constructor(x, y) {
    super({
      x: x,
      y: y,
      width: 28,
      height: 28,
      color: ex.Color.fromHex('#ff5722'),
      collisionType: ex.CollisionType.Active,
      collisionGroup: EnemyGroup
    });
    this.hp = CRAWLER_HP;
    this.maxHp = CRAWLER_HP;
    this.damage = CRAWLER_DAMAGE;
    this.speed = CRAWLER_SPEED;
    this.detectRange = CRAWLER_DETECT_RANGE;
    this.state = 'idle';
    this.attackCooldown = 0;
    this.patrolDir = Math.random() * Math.PI * 2;
    this.patrolTimer = 0;
  }

  onPreUpdate(engine, delta) {
    if (!gameState.playing) return;

    const player = engine.currentScene.actors.find(a => a instanceof Player);
    if (!player) return;

    const distToPlayer = this.pos.distance(player.pos);

    // AI state
    if (distToPlayer < this.detectRange) {
      this.state = 'chase';
    } else if (distToPlayer > this.detectRange * 1.5) {
      this.state = 'idle';
    }

    // Movement
    if (this.state === 'chase') {
      const angle = Math.atan2(player.pos.y - this.pos.y, player.pos.x - this.pos.x);
      this.vel.x = Math.cos(angle) * this.speed;
      this.vel.y = Math.sin(angle) * this.speed;
    } else {
      // Idle patrol
      this.patrolTimer -= delta;
      if (this.patrolTimer <= 0) {
        this.patrolDir = Math.random() * Math.PI * 2;
        this.patrolTimer = 2000 + Math.random() * 3000;
      }
      this.vel.x = Math.cos(this.patrolDir) * this.speed * 0.3;
      this.vel.y = Math.sin(this.patrolDir) * this.speed * 0.3;
    }

    // Attack player
    this.attackCooldown -= delta;
    if (distToPlayer < 30 && this.attackCooldown <= 0) {
      gameState.hp -= this.damage;
      this.attackCooldown = 1200;

      // Visual feedback
      const hitEffect = new ex.Actor({
        x: player.pos.x,
        y: player.pos.y,
        width: 40,
        height: 40,
        color: ex.Color.fromHex('#ff0000')
      });
      hitEffect.graphics.opacity = 0.5;
      engine.currentScene.add(hitEffect);
      hitEffect.actions.delay(100).die();
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.color = ex.Color.White;

    // Flash effect
    setTimeout(() => {
      if (this.hp > 0) {
        this.color = ex.Color.fromHex('#ff5722');
      }
    }, 100);

    if (this.hp <= 0) {
      gameState.enemiesKilled++;
      this.kill();

      // Death particles
      for (let i = 0; i < 5; i++) {
        const particle = new ex.Actor({
          x: this.pos.x + (Math.random() - 0.5) * 20,
          y: this.pos.y + (Math.random() - 0.5) * 20,
          width: 8,
          height: 8,
          color: ex.Color.fromHex('#ff5722')
        });
        this.scene.add(particle);
        particle.actions.moveTo(
          ex.vec(particle.pos.x + (Math.random() - 0.5) * 50, particle.pos.y + (Math.random() - 0.5) * 50),
          100
        ).fade(0, 500).die();
      }
    }
  }

  onPostDraw(ctx, delta) {
    // HP bar
    const barWidth = 24;
    const barHeight = 4;
    const hpPct = this.hp / this.maxHp;

    ctx.fillStyle = '#333';
    ctx.fillRect(-barWidth / 2, -20, barWidth, barHeight);

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(-barWidth / 2, -20, barWidth * hpPct, barHeight);
  }
}

// Wall class
class Wall extends ex.Actor {
  constructor(x, y, width, height) {
    super({
      x: x,
      y: y,
      width: width,
      height: height,
      color: ex.Color.fromHex('#37474f'),
      collisionType: ex.CollisionType.Fixed,
      collisionGroup: WallGroup
    });
  }

  onPostDraw(ctx, delta) {
    // Add some texture
    ctx.fillStyle = '#455a64';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(
        -this.width / 2 + Math.random() * this.width * 0.8,
        -this.height / 2 + Math.random() * this.height * 0.8,
        4, 4
      );
    }
  }
}

// O2 Canister item
class O2Canister extends ex.Actor {
  constructor(x, y) {
    super({
      x: x,
      y: y,
      width: 16,
      height: 24,
      color: ex.Color.fromHex('#00bcd4'),
      collisionType: ex.CollisionType.Passive,
      collisionGroup: ItemGroup
    });
    this.o2Amount = 25;
  }

  onInitialize(engine) {
    this.on('collisionstart', (evt) => {
      if (evt.other instanceof Player) {
        gameState.o2 = Math.min(gameState.maxO2, gameState.o2 + this.o2Amount);
        this.kill();

        // Pickup effect
        const effect = new ex.Actor({
          x: this.pos.x,
          y: this.pos.y,
          width: 30,
          height: 30,
          color: ex.Color.fromHex('#00bcd4')
        });
        effect.graphics.opacity = 0.5;
        engine.currentScene.add(effect);
        effect.actions.scaleTo(ex.vec(2, 2), ex.vec(2, 2)).fade(0, 300).die();
      }
    });
  }

  onPreUpdate(engine, delta) {
    // Bobbing animation
    this.pos.y += Math.sin(Date.now() / 300) * 0.3;
  }

  onPostDraw(ctx, delta) {
    // O2 symbol
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('O2', 0, 3);
  }
}

// Vision cone overlay
class VisionOverlay extends ex.Actor {
  constructor() {
    super({
      x: VIEW_WIDTH / 2,
      y: VIEW_HEIGHT / 2,
      anchor: ex.vec(0, 0),
      z: 1000
    });
  }

  onPostDraw(ctx, delta) {
    const player = game.currentScene.actors.find(a => a instanceof Player);
    if (!player) return;

    const visionRange = gameState.flashlightOn ? VISION_RANGE_DARK : VISION_RANGE_NO_LIGHT;

    // Draw darkness with vision cone cut out
    ctx.save();

    // Create clipping path for vision cone (inverted)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(-VIEW_WIDTH / 2, -VIEW_HEIGHT / 2, VIEW_WIDTH, VIEW_HEIGHT);

    // Cut out vision cone using composite operation
    ctx.globalCompositeOperation = 'destination-out';

    const playerScreenX = player.pos.x - game.currentScene.camera.pos.x + VIEW_WIDTH / 2;
    const playerScreenY = player.pos.y - game.currentScene.camera.pos.y + VIEW_HEIGHT / 2;

    // Draw vision cone
    ctx.beginPath();
    ctx.moveTo(playerScreenX - VIEW_WIDTH / 2, playerScreenY - VIEW_HEIGHT / 2);
    const segments = 20;
    for (let i = 0; i <= segments; i++) {
      const angle = player.facingAngle - VISION_ANGLE / 2 + (VISION_ANGLE * i / segments);
      const x = playerScreenX + Math.cos(angle) * visionRange - VIEW_WIDTH / 2;
      const y = playerScreenY + Math.sin(angle) * visionRange - VIEW_HEIGHT / 2;
      ctx.lineTo(x, y);
    }
    ctx.closePath();

    // Create gradient for smooth edge
    const gradient = ctx.createRadialGradient(
      playerScreenX - VIEW_WIDTH / 2, playerScreenY - VIEW_HEIGHT / 2, 0,
      playerScreenX - VIEW_WIDTH / 2, playerScreenY - VIEW_HEIGHT / 2, visionRange
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
  }
}

// HUD class
class HUD extends ex.ScreenElement {
  constructor() {
    super({
      x: 0,
      y: 0,
      z: 2000
    });
  }

  onPostDraw(ctx, delta) {
    ctx.save();

    // O2 bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 10, 150, 20);
    const o2Pct = gameState.o2 / gameState.maxO2;
    ctx.fillStyle = o2Pct < 0.2 ? '#ff0000' : '#00bcd4';
    ctx.fillRect(10, 10, 150 * o2Pct, 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, 150, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`O2: ${Math.floor(gameState.o2)}/${gameState.maxO2}`, 15, 25);

    // HP bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 35, 150, 20);
    const hpPct = gameState.hp / gameState.maxHp;
    ctx.fillStyle = hpPct < 0.25 ? '#ff0000' : '#4caf50';
    ctx.fillRect(10, 35, 150 * hpPct, 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 35, 150, 20);
    ctx.fillStyle = '#fff';
    ctx.fillText(`HP: ${Math.floor(gameState.hp)}/${gameState.maxHp}`, 15, 50);

    // Flashlight indicator
    ctx.fillStyle = gameState.flashlightOn ? '#ffeb3b' : '#666';
    ctx.fillRect(10, 60, 80, 16);
    ctx.fillStyle = '#000';
    ctx.font = '10px monospace';
    ctx.fillText(`FLASH: ${Math.floor(gameState.flashlightBattery)}s`, 15, 72);

    // Sector info
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(`SECTOR ${gameState.sector}: CREW QUARTERS`, 10, VIEW_HEIGHT - 30);

    // Controls hint
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.fillText('WASD: Move | SHIFT: Run | F: Flashlight | CLICK: Attack', 10, VIEW_HEIGHT - 10);

    // Enemies killed
    ctx.fillStyle = '#fff';
    ctx.fillText(`Kills: ${gameState.enemiesKilled}`, VIEW_WIDTH - 80, 25);

    // Game over or low O2 warning
    if (!gameState.playing) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
      ctx.fillStyle = '#ff0000';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      if (gameState.o2 <= 0) {
        ctx.fillText('SUFFOCATED', VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
      } else {
        ctx.fillText('DECEASED', VIEW_WIDTH / 2, VIEW_HEIGHT / 2);
      }
      ctx.font = '16px monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText('Your body joins the ship\'s other victims.', VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 40);
    } else if (gameState.o2 < 20) {
      // Low O2 warning - pulse red at edges
      const pulse = Math.abs(Math.sin(Date.now() / 200));
      ctx.fillStyle = `rgba(255, 0, 0, ${pulse * 0.3})`;
      ctx.fillRect(0, 0, 20, VIEW_HEIGHT);
      ctx.fillRect(VIEW_WIDTH - 20, 0, 20, VIEW_HEIGHT);
      ctx.fillRect(0, 0, VIEW_WIDTH, 20);
      ctx.fillRect(0, VIEW_HEIGHT - 20, VIEW_WIDTH, 20);
    }

    ctx.restore();
  }
}

// Game scene
class GameScene extends ex.Scene {
  onInitialize(engine) {
    // Parse map and create entities
    let playerStart = { x: 0, y: 0 };
    const enemies = [];
    const items = [];

    for (let row = 0; row < mapLayout.length; row++) {
      for (let col = 0; col < mapLayout[row].length; col++) {
        const char = mapLayout[row][col];
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;

        switch (char) {
          case '#':
            this.add(new Wall(x, y, TILE_SIZE, TILE_SIZE));
            break;
          case 'P':
            playerStart = { x, y };
            break;
          case 'C':
            enemies.push({ x, y });
            break;
          case 'O':
            items.push({ x, y, type: 'o2' });
            break;
        }
      }
    }

    // Floor tiles
    for (let row = 0; row < mapLayout.length; row++) {
      for (let col = 0; col < mapLayout[row].length; col++) {
        if (mapLayout[row][col] !== '#') {
          const floor = new ex.Actor({
            x: col * TILE_SIZE + TILE_SIZE / 2,
            y: row * TILE_SIZE + TILE_SIZE / 2,
            width: TILE_SIZE,
            height: TILE_SIZE,
            color: ex.Color.fromHex('#1a1a2e'),
            z: -1
          });
          this.add(floor);
        }
      }
    }

    // Create player
    const player = new Player(playerStart.x, playerStart.y);
    this.add(player);

    // Create enemies
    for (const e of enemies) {
      this.add(new Enemy(e.x, e.y));
    }

    // Create items
    for (const item of items) {
      if (item.type === 'o2') {
        this.add(new O2Canister(item.x, item.y));
      }
    }

    // Camera follows player
    this.camera.strategy.lockToActor(player);
    this.camera.strategy.limitCameraBounds(new ex.BoundingBox({
      left: VIEW_WIDTH / 2,
      right: mapLayout[0].length * TILE_SIZE - VIEW_WIDTH / 2,
      top: VIEW_HEIGHT / 2,
      bottom: mapLayout.length * TILE_SIZE - VIEW_HEIGHT / 2
    }));

    // Add vision overlay
    this.add(new VisionOverlay());

    // Add HUD
    this.add(new HUD());
  }
}

// Start game
game.add('game', new GameScene());
game.goToScene('game');
game.start();

console.log('Derelict - Survival Horror started');
console.log('Controls: WASD to move, SHIFT to run, F for flashlight, Click to attack');
