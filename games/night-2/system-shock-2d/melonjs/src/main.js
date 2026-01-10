// Game constants - Fixed shoot binding issue
const TILE_SIZE = 32;
// Global flag for input ready state
let inputReady = false;
const PLAYER_SPEED = 150;
const BULLET_SPEED = 400;

// Game state
const gameState = {
  health: 100,
  maxHealth: 100,
  energy: 100,
  maxEnergy: 100,
  ammo: 12,
  maxAmmo: 12,
  reserveAmmo: 48,
  scrap: 0,
  keycards: { yellow: false, red: false, blue: false, black: false },
  currentDeck: 1,
  hacking: false,
  gameOver: false,
  victory: false,
};

// Expose for testing
window.gameState = gameState;

// Player Entity
class PlayerEntity extends me.Entity {
  constructor(x, y) {
    super(x, y, {
      width: 24,
      height: 32,
      shapes: [new me.Rect(0, 0, 24, 32)],
    });
    this.body.collisionType = me.collision.types.PLAYER_OBJECT;
    this.body.setCollisionMask(me.collision.types.WORLD_SHAPE | me.collision.types.ENEMY_OBJECT);
    this.body.setMaxVelocity(PLAYER_SPEED, PLAYER_SPEED);
    this.body.setFriction(0.5, 0.5);
    this.alwaysUpdate = true;
    this.renderable = new me.Sprite(0, 0, {
      image: createPlayerImage(),
      framewidth: 24,
      frameheight: 32,
    });
    this.attackCooldown = 0;
    this.reloading = false;
    this.reloadTime = 0;
    this.angle = 0;
  }

  update(dt) {
    // Handle movement
    let vx = 0, vy = 0;
    if (me.input.isKeyPressed("left") || me.input.isKeyPressed("a")) vx = -1;
    if (me.input.isKeyPressed("right") || me.input.isKeyPressed("d")) vx = 1;
    if (me.input.isKeyPressed("up") || me.input.isKeyPressed("w")) vy = -1;
    if (me.input.isKeyPressed("down") || me.input.isKeyPressed("s")) vy = 1;

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.body.force.set(vx * PLAYER_SPEED * 5, vy * PLAYER_SPEED * 5);

    // Update angle to mouse
    const mousePos = me.input.pointer.pos;
    const worldMouse = me.game.viewport.localToWorld(mousePos.x, mousePos.y);
    this.angle = Math.atan2(worldMouse.y - this.pos.y, worldMouse.x - this.pos.x);

    // Cooldowns
    if (this.attackCooldown > 0) this.attackCooldown -= dt / 1000;
    if (this.reloading) {
      this.reloadTime -= dt / 1000;
      if (this.reloadTime <= 0) {
        this.reloading = false;
        const ammoNeeded = gameState.maxAmmo - gameState.ammo;
        const ammoToLoad = Math.min(ammoNeeded, gameState.reserveAmmo);
        gameState.ammo += ammoToLoad;
        gameState.reserveAmmo -= ammoToLoad;
      }
    }

    // Shooting
    if (inputReady && me.input.isKeyPressed("shoot") && !this.reloading && this.attackCooldown <= 0) {
      this.shoot();
    }

    // Reload
    if (inputReady && me.input.isKeyPressed("reload") && !this.reloading && gameState.ammo < gameState.maxAmmo && gameState.reserveAmmo > 0) {
      this.reloading = true;
      this.reloadTime = 1.5;
    }

    // Energy regen
    if (gameState.energy < gameState.maxEnergy) {
      gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + 2 * dt / 1000);
    }

    // Update parent
    super.update(dt);
    return true;
  }

  shoot() {
    if (gameState.ammo <= 0) return;

    gameState.ammo--;
    this.attackCooldown = 0.3;

    // Create bullet
    const bullet = new BulletEntity(
      this.pos.x + 12,
      this.pos.y + 16,
      this.angle
    );
    me.game.world.addChild(bullet, 5);
  }

  takeDamage(amount) {
    gameState.health -= amount;
    if (gameState.health <= 0) {
      gameState.health = 0;
      gameState.gameOver = true;
      me.state.change(me.state.GAMEOVER);
    }
  }

  draw(renderer) {
    // Draw player as colored rectangle
    renderer.setColor("#4488ff");
    renderer.fillRect(this.pos.x, this.pos.y, 24, 32);

    // Draw aim direction
    renderer.setColor("#88ff88");
    const aimX = this.pos.x + 12 + Math.cos(this.angle) * 30;
    const aimY = this.pos.y + 16 + Math.sin(this.angle) * 30;
    renderer.strokeLine(this.pos.x + 12, this.pos.y + 16, aimX, aimY);
  }
}

// Bullet Entity
class BulletEntity extends me.Entity {
  constructor(x, y, angle) {
    super(x, y, {
      width: 8,
      height: 8,
      shapes: [new me.Rect(0, 0, 8, 8)],
    });
    this.body.collisionType = me.collision.types.PROJECTILE_OBJECT;
    this.body.setCollisionMask(me.collision.types.WORLD_SHAPE | me.collision.types.ENEMY_OBJECT);
    this.alwaysUpdate = true;
    this.angle = angle;
    this.lifetime = 2;
    this.damage = 12;
  }

  update(dt) {
    this.pos.x += Math.cos(this.angle) * BULLET_SPEED * dt / 1000;
    this.pos.y += Math.sin(this.angle) * BULLET_SPEED * dt / 1000;

    this.lifetime -= dt / 1000;
    if (this.lifetime <= 0) {
      me.game.world.removeChild(this);
    }

    super.update(dt);
    return true;
  }

  onCollision(response, other) {
    if (other instanceof EnemyEntity) {
      other.takeDamage(this.damage);
      me.game.world.removeChild(this);
      return false;
    }
    if (other.body && other.body.collisionType === me.collision.types.WORLD_SHAPE) {
      me.game.world.removeChild(this);
      return false;
    }
    return true;
  }

  draw(renderer) {
    renderer.setColor("#ffff00");
    renderer.fillEllipse(this.pos.x + 4, this.pos.y + 4, 4, 4);
  }
}

// Enemy Entity (Cyborg Drone)
class EnemyEntity extends me.Entity {
  constructor(x, y) {
    super(x, y, {
      width: 24,
      height: 32,
      shapes: [new me.Rect(0, 0, 24, 32)],
    });
    this.body.collisionType = me.collision.types.ENEMY_OBJECT;
    this.body.setCollisionMask(me.collision.types.WORLD_SHAPE | me.collision.types.PLAYER_OBJECT);
    this.alwaysUpdate = true;
    this.hp = 30;
    this.maxHp = 30;
    this.damage = 10;
    this.speed = 80;
    this.state = "patrol";
    this.target = null;
    this.attackCooldown = 0;
    this.patrolDir = 1;
    this.patrolTime = 0;
    this.detectionRange = 200;
  }

  update(dt) {
    const player = me.game.world.getChildByType(PlayerEntity)[0];
    if (!player) return super.update(dt);

    const dx = player.pos.x - this.pos.x;
    const dy = player.pos.y - this.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (this.attackCooldown > 0) this.attackCooldown -= dt / 1000;

    if (dist < this.detectionRange) {
      this.state = "chase";
      // Move toward player
      const vx = (dx / dist) * this.speed;
      const vy = (dy / dist) * this.speed;
      this.pos.x += vx * dt / 1000;
      this.pos.y += vy * dt / 1000;

      // Attack if close
      if (dist < 40 && this.attackCooldown <= 0) {
        player.takeDamage(this.damage);
        this.attackCooldown = 1.5;
      }
    } else {
      this.state = "patrol";
      // Simple patrol
      this.patrolTime += dt / 1000;
      if (this.patrolTime > 2) {
        this.patrolDir *= -1;
        this.patrolTime = 0;
      }
      this.pos.x += this.patrolDir * 30 * dt / 1000;
    }

    super.update(dt);
    return true;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      // Drop loot
      gameState.scrap += 10;
      gameState.reserveAmmo += 5;
      me.game.world.removeChild(this);
    }
  }

  draw(renderer) {
    // Body
    renderer.setColor(this.state === "chase" ? "#ff4444" : "#884444");
    renderer.fillRect(this.pos.x, this.pos.y, 24, 32);

    // Health bar
    if (this.hp < this.maxHp) {
      renderer.setColor("#333333");
      renderer.fillRect(this.pos.x, this.pos.y - 8, 24, 4);
      renderer.setColor("#00ff00");
      renderer.fillRect(this.pos.x, this.pos.y - 8, 24 * (this.hp / this.maxHp), 4);
    }
  }
}

// Exit Entity
class ExitEntity extends me.Entity {
  constructor(x, y) {
    super(x, y, {
      width: 48,
      height: 48,
      shapes: [new me.Rect(0, 0, 48, 48)],
    });
    this.body.collisionType = me.collision.types.ACTION_OBJECT;
    this.alwaysUpdate = true;
  }

  onCollision(response, other) {
    if (other instanceof PlayerEntity) {
      gameState.victory = true;
      me.state.change(me.state.CREDITS);
    }
    return false;
  }

  draw(renderer) {
    renderer.setColor("#00ff88");
    renderer.fillRect(this.pos.x, this.pos.y, 48, 48);
    renderer.setColor("#ffffff");
    me.video.renderer.getContext().fillText( "EXIT", this.pos.x + 8, this.pos.y + 28);
  }
}

// Wall Entity
class WallEntity extends me.Entity {
  constructor(x, y, w, h) {
    super(x, y, {
      width: w,
      height: h,
      shapes: [new me.Rect(0, 0, w, h)],
    });
    this.body.collisionType = me.collision.types.WORLD_SHAPE;
    this.body.isStatic = true;
    this.w = w;
    this.h = h;
  }

  draw(renderer) {
    renderer.setColor("#333344");
    renderer.fillRect(this.pos.x, this.pos.y, this.w, this.h);
  }
}

// HUD Container
class HUDContainer extends me.Container {
  constructor() {
    super(0, 0, me.game.viewport.width, me.game.viewport.height);
    this.floating = true;
    this.isPersistent = true;
    this.alwaysUpdate = true;
  }

  draw(renderer) {
    // Health bar
    renderer.setColor("#333333");
    renderer.fillRect(10, 10, 200, 20);
    renderer.setColor("#cc2222");
    renderer.fillRect(10, 10, 200 * (gameState.health / gameState.maxHealth), 20);
    renderer.setColor("#ffffff");
    me.video.renderer.getContext().fillText( `HP: ${Math.floor(gameState.health)}/${gameState.maxHealth}`, 15, 25);

    // Energy bar
    renderer.setColor("#333333");
    renderer.fillRect(10, 35, 200, 15);
    renderer.setColor("#2244cc");
    renderer.fillRect(10, 35, 200 * (gameState.energy / gameState.maxEnergy), 15);
    renderer.setColor("#ffffff");
    me.video.renderer.getContext().fillText( `Energy: ${Math.floor(gameState.energy)}`, 15, 47);

    // Ammo
    renderer.setColor("#ffffff");
    me.video.renderer.getContext().fillText( `Ammo: ${gameState.ammo}/${gameState.reserveAmmo}`, 10, 70);

    // Scrap
    me.video.renderer.getContext().fillText( `Scrap: ${gameState.scrap}`, 10, 90);

    // Deck
    me.video.renderer.getContext().fillText( `Deck ${gameState.currentDeck}: Engineering`, 10, 110);

    // Reloading indicator
    if (me.game.world.getChildByType(PlayerEntity)[0]?.reloading) {
      renderer.setColor("#ffff00");
      me.video.renderer.getContext().fillText( "RELOADING...", me.game.viewport.width / 2 - 40, 50);
    }

    // Controls help
    renderer.setColor("#888888");
    me.video.renderer.getContext().fillText( "WASD: Move | Space/X/Z: Shoot | R: Reload | Reach EXIT to win", 10, me.game.viewport.height - 15);
  }
}

// Game Play Screen
class PlayScreen extends me.Stage {
  onResetEvent() {
    // Reset game state
    gameState.health = 100;
    gameState.energy = 100;
    gameState.ammo = 12;
    gameState.reserveAmmo = 48;
    gameState.scrap = 0;
    gameState.gameOver = false;
    gameState.victory = false;

    // Set background
    me.game.world.addChild(new me.ColorLayer("background", "#111122", 0), 0);

    // Create level bounds
    const mapWidth = 800;
    const mapHeight = 600;

    // Create walls (border)
    me.game.world.addChild(new WallEntity(0, 0, mapWidth, 20), 2); // Top
    me.game.world.addChild(new WallEntity(0, mapHeight - 20, mapWidth, 20), 2); // Bottom
    me.game.world.addChild(new WallEntity(0, 0, 20, mapHeight), 2); // Left
    me.game.world.addChild(new WallEntity(mapWidth - 20, 0, 20, mapHeight), 2); // Right

    // Interior walls
    me.game.world.addChild(new WallEntity(200, 100, 20, 200), 2);
    me.game.world.addChild(new WallEntity(400, 200, 20, 250), 2);
    me.game.world.addChild(new WallEntity(600, 50, 20, 300), 2);
    me.game.world.addChild(new WallEntity(100, 400, 300, 20), 2);
    me.game.world.addChild(new WallEntity(500, 450, 200, 20), 2);

    // Add player
    const player = new PlayerEntity(100, 300);
    me.game.world.addChild(player, 4);

    // Add enemies
    me.game.world.addChild(new EnemyEntity(300, 150), 3);
    me.game.world.addChild(new EnemyEntity(500, 350), 3);
    me.game.world.addChild(new EnemyEntity(650, 200), 3);
    me.game.world.addChild(new EnemyEntity(250, 500), 3);
    me.game.world.addChild(new EnemyEntity(700, 500), 3);

    // Add exit
    me.game.world.addChild(new ExitEntity(720, 530), 3);

    // Camera
    me.game.viewport.follow(player, me.game.viewport.AXIS.BOTH, 0.4);
    me.game.viewport.setBounds(0, 0, mapWidth, mapHeight);

    // HUD
    me.game.world.addChild(new HUDContainer(), 100);
  }
}

// Title Screen
class TitleScreen extends me.Stage {
  onResetEvent() {
    me.game.world.addChild(new me.ColorLayer("background", "#000022", 0), 0);
  }

  draw(renderer) {
    renderer.setColor("#00ff88");
    me.video.renderer.getContext().fillText( "SYSTEM SHOCK 2D", me.game.viewport.width / 2 - 100, me.game.viewport.height / 2 - 50);
    renderer.setColor("#ffffff");
    me.video.renderer.getContext().fillText( "WHISPERS OF M.A.R.I.A.", me.game.viewport.width / 2 - 90, me.game.viewport.height / 2 - 20);
    renderer.setColor("#888888");
    me.video.renderer.getContext().fillText( "Click to start", me.game.viewport.width / 2 - 40, me.game.viewport.height / 2 + 50);
  }

  onClick() {
    me.state.change(me.state.PLAY);
    return true;
  }
}

// Game Over Screen
class GameOverScreen extends me.Stage {
  onResetEvent() {
    me.game.world.addChild(new me.ColorLayer("background", "#220000", 0), 0);
  }

  draw(renderer) {
    renderer.setColor("#ff4444");
    me.video.renderer.getContext().fillText( "GAME OVER", me.game.viewport.width / 2 - 60, me.game.viewport.height / 2 - 20);
    renderer.setColor("#ffffff");
    me.video.renderer.getContext().fillText( "M.A.R.I.A. has won...", me.game.viewport.width / 2 - 70, me.game.viewport.height / 2 + 10);
    renderer.setColor("#888888");
    me.video.renderer.getContext().fillText( "Click to try again", me.game.viewport.width / 2 - 60, me.game.viewport.height / 2 + 50);
  }

  onClick() {
    me.state.change(me.state.PLAY);
    return true;
  }
}

// Victory Screen
class VictoryScreen extends me.Stage {
  onResetEvent() {
    me.game.world.addChild(new me.ColorLayer("background", "#002200", 0), 0);
  }

  draw(renderer) {
    renderer.setColor("#00ff88");
    me.video.renderer.getContext().fillText( "ESCAPED!", me.game.viewport.width / 2 - 50, me.game.viewport.height / 2 - 20);
    renderer.setColor("#ffffff");
    me.video.renderer.getContext().fillText( "You made it to the elevator!", me.game.viewport.width / 2 - 90, me.game.viewport.height / 2 + 10);
    renderer.setColor("#888888");
    me.video.renderer.getContext().fillText( "Click to play again", me.game.viewport.width / 2 - 60, me.game.viewport.height / 2 + 50);
  }

  onClick() {
    me.state.change(me.state.PLAY);
    return true;
  }
}

// Helper function to create player sprite (placeholder)
function createPlayerImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#4488ff";
  ctx.fillRect(0, 0, 24, 32);
  return canvas;
}

// Initialize game
function initGame() {
  // Initialize melonJS
  me.device.onReady(() => {
    if (!me.video.init(800, 600, {
      parent: "screen",
      scale: "auto",
      renderer: me.video.CANVAS,
    })) {
      alert("Your browser does not support canvas rendering.");
      return;
    }

    // Register input
    me.input.bindKey(me.input.KEY.LEFT, "left");
    me.input.bindKey(me.input.KEY.RIGHT, "right");
    me.input.bindKey(me.input.KEY.UP, "up");
    me.input.bindKey(me.input.KEY.DOWN, "down");
    me.input.bindKey(me.input.KEY.A, "a");
    me.input.bindKey(me.input.KEY.D, "d");
    me.input.bindKey(me.input.KEY.W, "w");
    me.input.bindKey(me.input.KEY.S, "s");
    me.input.bindKey(me.input.KEY.R, "reload");
    me.input.bindKey(me.input.KEY.SPACE, "shoot");
    me.input.bindKey(me.input.KEY.X, "shoot");
    me.input.bindKey(me.input.KEY.Z, "shoot");
    // Note: bindPointer removed as it was causing issues with isKeyPressed

    // Mark input as ready
    inputReady = true;

    // Register collision types
    me.collision.types.PLAYER_OBJECT = me.collision.types.USER << 0;
    me.collision.types.ENEMY_OBJECT = me.collision.types.USER << 1;
    me.collision.types.PROJECTILE_OBJECT = me.collision.types.USER << 2;
    me.collision.types.ACTION_OBJECT = me.collision.types.USER << 3;

    // Set up screens
    me.state.set(me.state.MENU, new TitleScreen());
    me.state.set(me.state.PLAY, new PlayScreen());
    me.state.set(me.state.GAMEOVER, new GameOverScreen());
    me.state.set(me.state.CREDITS, new VictoryScreen());

    // Enable pointer events for menus
    me.input.registerPointerEvent("pointerdown", me.game.viewport, (event) => {
      const currentState = me.state.current();
      if (currentState.onClick) {
        currentState.onClick(event);
      }
    });

    // Start at menu
    me.state.change(me.state.MENU);
  });
}

// Run init
initGame();
