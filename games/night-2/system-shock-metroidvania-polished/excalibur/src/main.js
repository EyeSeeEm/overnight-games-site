// CITADEL POLISHED - Main Module

console.log('Main module loading');

const game = new ex.Engine({
  width: 800,
  height: 600,
  backgroundColor: ex.Color.fromHex(PALETTE.bgDark),
  displayMode: ex.DisplayMode.FitScreen,
  antialiasing: false
});

let player = null;
let enemies = [];
let lastTime = 0;

// ============================================
// MENU SCENE
// ============================================
class MenuScene extends ex.Scene {
  onInitialize(engine) {
    // Title with glow effect drawn in onPostDraw
  }

  onPreUpdate(engine) {
    if (engine.input.keyboard.wasPressed(ex.Keys.Space) ||
        engine.input.pointers.primary.wasPressed) {
      window.startGame();
      engine.goToScene('game');
    }
  }

  onPostDraw(exCtx) {
    const ctx = exCtx.__ctx;
    if (!ctx) return;

    const w = 800, h = 600;

    // Animated background
    const time = Date.now() / 1000;

    // Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 2);
    }

    // Title with glow
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glow layers
    ctx.shadowColor = PALETTE.uiDanger;
    ctx.shadowBlur = 30 + Math.sin(time * 2) * 10;
    ctx.fillStyle = PALETTE.uiDanger;
    ctx.font = 'bold 64px Orbitron, monospace';
    ctx.fillText('CITADEL', w/2, 120);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('CITADEL', w/2, 120);

    // Subtitle
    ctx.font = '18px "Share Tech Mono", monospace';
    ctx.fillStyle = PALETTE.uiTextDim;
    ctx.fillText('A SYSTEM SHOCK METROIDVANIA', w/2, 170);

    // Version
    ctx.fillStyle = PALETTE.uiPrimary;
    ctx.font = '12px "Share Tech Mono", monospace';
    ctx.fillText('POLISHED EDITION v2.0', w/2, 200);

    // Start prompt with pulse
    const pulse = 0.5 + 0.5 * Math.sin(time * 3);
    ctx.globalAlpha = 0.5 + pulse * 0.5;
    ctx.fillStyle = PALETTE.uiText;
    ctx.font = '20px "Share Tech Mono", monospace';
    ctx.fillText('[ PRESS SPACE TO INITIALIZE ]', w/2, 350);
    ctx.globalAlpha = 1;

    // Controls
    ctx.fillStyle = PALETTE.uiTextDim;
    ctx.font = '14px "Share Tech Mono", monospace';
    ctx.fillText('A/D - MOVE | SPACE/W - JUMP | J/Z - ATTACK | L/C - DASH', w/2, 450);

    // Credits
    ctx.fillStyle = PALETTE.uiTextDim;
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillText('BUILT WITH EXCALIBUR.JS', w/2, 560);

    ctx.restore();
  }
}

// ============================================
// GAME SCENE
// ============================================
class GameScene extends ex.Scene {
  onInitialize(engine) {
    const state = window.gameState;
    enemies = [];

    this.createPlatforms(engine);

    player = new ex.Actor({
      pos: ex.vec(state.x, state.y),
      width: 28,
      height: 44,
      color: ex.Color.fromHex(PALETTE.playerCore),
      collisionType: ex.CollisionType.Active
    });
    player.body.useGravity = true;
    this.add(player);

    // Spawn initial enemies
    const deck = window.DECKS[state.currentDeck];
    if (deck) {
      for (let i = 0; i < 3; i++) {
        const type = deck.enemies[Math.floor(Math.random() * deck.enemies.length)];
        this.spawnVisualEnemy(type);
      }
    }
  }

  createPlatforms(engine) {
    // Ground
    const ground = new ex.Actor({
      pos: ex.vec(400, 570),
      width: 800,
      height: 60,
      color: ex.Color.fromHex(PALETTE.platform),
      collisionType: ex.CollisionType.Fixed
    });
    this.add(ground);

    // Platforms
    const platforms = [
      { x: 150, y: 420, w: 160 },
      { x: 400, y: 360, w: 120 },
      { x: 650, y: 420, w: 160 },
      { x: 250, y: 280, w: 140 },
      { x: 550, y: 220, w: 140 },
      { x: 400, y: 140, w: 120 }
    ];

    for (const p of platforms) {
      const plat = new ex.Actor({
        pos: ex.vec(p.x, p.y),
        width: p.w,
        height: 16,
        color: ex.Color.fromHex(PALETTE.platform),
        collisionType: ex.CollisionType.Fixed
      });
      this.add(plat);
    }

    // Walls
    const leftWall = new ex.Actor({
      pos: ex.vec(15, 300),
      width: 14,
      height: 500,
      color: ex.Color.fromHex(PALETTE.wall),
      collisionType: ex.CollisionType.Fixed
    });
    leftWall.addTag('wall');
    this.add(leftWall);

    const rightWall = new ex.Actor({
      pos: ex.vec(785, 300),
      width: 14,
      height: 500,
      color: ex.Color.fromHex(PALETTE.wall),
      collisionType: ex.CollisionType.Fixed
    });
    rightWall.addTag('wall');
    this.add(rightWall);
  }

  spawnVisualEnemy(type) {
    const enemyData = window.spawnEnemy(type);
    if (!enemyData) return;

    const sizes = {
      shambler: { w: 28, h: 40 },
      maintenance_bot: { w: 30, h: 30 },
      cyborg_drone: { w: 28, h: 28 },
      mutant_gorilla: { w: 44, h: 52 },
      elite_cyborg: { w: 30, h: 46 },
      cortex_reaver: { w: 34, h: 34 }
    };

    const size = sizes[type] || { w: 30, h: 30 };

    const enemy = new ex.Actor({
      pos: ex.vec(enemyData.x, enemyData.y),
      width: size.w,
      height: size.h,
      color: ex.Color.fromHex(enemyData.color),
      collisionType: ex.CollisionType.Active
    });
    enemy.addTag('enemy');
    enemy.enemyId = enemyData.id;
    enemy.enemyType = type;

    this.add(enemy);
    enemies.push(enemy);
  }

  onPreUpdate(engine, delta) {
    const state = window.gameState;
    const dt = delta / 1000;

    if (state.scene !== 'game') {
      if (state.scene === 'gameover') engine.goToScene('gameover');
      if (state.scene === 'victory') engine.goToScene('victory');
      return;
    }

    // Input
    let inputX = 0;
    if (engine.input.keyboard.isHeld(ex.Keys.A) || engine.input.keyboard.isHeld(ex.Keys.Left)) {
      inputX = -1;
    }
    if (engine.input.keyboard.isHeld(ex.Keys.D) || engine.input.keyboard.isHeld(ex.Keys.Right)) {
      inputX = 1;
    }

    state.onGround = player.pos.y >= 520;

    window.updateMovement(dt, inputX);

    // Jump
    if (engine.input.keyboard.wasPressed(ex.Keys.Space) ||
        engine.input.keyboard.wasPressed(ex.Keys.W)) {
      window.jump();
    }

    // Dash
    if (engine.input.keyboard.wasPressed(ex.Keys.L) ||
        engine.input.keyboard.wasPressed(ex.Keys.C)) {
      window.dash();
    }

    // Attack
    if (engine.input.keyboard.wasPressed(ex.Keys.J) ||
        engine.input.keyboard.wasPressed(ex.Keys.Z)) {
      const result = window.attack();
      if (result.success) {
        for (const enemy of enemies) {
          const stateEnemy = state.enemies.find(e => e.id === enemy.enemyId);
          if (!stateEnemy) continue;

          const dist = player.pos.distance(enemy.pos);
          const range = result.type === 'melee' ? 65 : 350;

          if (dist < range) {
            const dir = player.pos.x < enemy.pos.x ? 1 : -1;
            const dmgResult = window.damageEnemy(enemy.enemyId, result.damage);
            if (dmgResult.killed) {
              window.killEnemy(enemy.enemyId);
              enemy.kill();
            }
          }
        }
      }
    }

    // Clamp position
    state.x = Math.max(35, Math.min(765, state.x));
    state.y = Math.max(30, Math.min(520, state.y));

    // Apply shake offset
    const shakeX = window.screenShake.offsetX;
    const shakeY = window.screenShake.offsetY;
    player.pos = ex.vec(state.x + shakeX, state.y + shakeY);

    // Player flash on damage
    if (state.hitFlashTimer > 0) {
      player.graphics.opacity = 0.3;
    } else if (state.invincible) {
      player.graphics.opacity = Math.sin(Date.now() / 40) > 0 ? 1 : 0.4;
    } else {
      player.graphics.opacity = 1;
    }

    // Update enemies
    for (const enemy of enemies) {
      const stateEnemy = state.enemies.find(e => e.id === enemy.enemyId);
      if (!stateEnemy) {
        enemy.kill();
        continue;
      }

      // Simple AI
      const dx = player.pos.x - enemy.pos.x;
      if (Math.abs(dx) > 25) {
        stateEnemy.x += Math.sign(dx) * stateEnemy.speed * dt;
      }
      enemy.pos = ex.vec(stateEnemy.x + shakeX, stateEnemy.y + shakeY);

      // Hit flash
      if (stateEnemy.hitFlash > 0) {
        stateEnemy.hitFlash -= dt;
        enemy.graphics.opacity = 0.5;
      } else {
        enemy.graphics.opacity = 1;
      }

      // Collision
      const dist = player.pos.distance(enemy.pos);
      if (dist < 35) {
        const died = window.takeDamage(stateEnemy.damage * dt * 2);
        if (died) {
          state.scene = 'gameover';
        }
      }
    }

    enemies = enemies.filter(e => !e.isKilled());

    // Energy regen
    if (state.energy < state.maxEnergy) {
      window.restoreEnergy(6 * dt);
    }

    // Respawn enemies
    if (state.enemies.length === 0) {
      const deck = window.DECKS[state.currentDeck];
      for (let i = 0; i < 2; i++) {
        const type = deck.enemies[Math.floor(Math.random() * deck.enemies.length)];
        this.spawnVisualEnemy(type);
      }
    }
  }

  onPostDraw(exCtx, delta) {
    const ctx = exCtx.__ctx;
    if (!ctx) return;

    const state = window.gameState;
    const shakeX = window.screenShake.offsetX;
    const shakeY = window.screenShake.offsetY;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Draw particles
    window.drawParticles(ctx);

    // Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let y = 0; y < 600; y += 4) {
      ctx.fillRect(0, y, 800, 1);
    }

    ctx.restore();

    // HUD
    this.drawHUD(ctx, state);
  }

  drawHUD(ctx, state) {
    ctx.save();

    // Health bar
    const hbX = 20, hbY = 20, hbW = 200, hbH = 18;
    ctx.fillStyle = PALETTE.bgMid;
    ctx.fillRect(hbX, hbY, hbW, hbH);

    const hpRatio = state.health / state.maxHealth;
    const hpColor = hpRatio > 0.5 ? PALETTE.heal : hpRatio > 0.25 ? PALETTE.uiWarning : PALETTE.uiDanger;
    ctx.fillStyle = hpColor;
    ctx.fillRect(hbX, hbY, hbW * hpRatio, hbH);

    // Health glow
    ctx.shadowColor = hpColor;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = hpColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(hbX, hbY, hbW, hbH);
    ctx.shadowBlur = 0;

    ctx.fillStyle = PALETTE.uiText;
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillText(`HP ${Math.ceil(state.health)}/${state.maxHealth}`, hbX + 4, hbY + 13);

    // Energy bar
    const ebY = hbY + hbH + 5;
    ctx.fillStyle = PALETTE.bgMid;
    ctx.fillRect(hbX, ebY, hbW, 12);

    ctx.fillStyle = PALETTE.energy;
    ctx.fillRect(hbX, ebY, hbW * (state.energy / state.maxEnergy), 12);

    ctx.strokeStyle = PALETTE.energy;
    ctx.strokeRect(hbX, ebY, hbW, 12);

    // Weapon display
    const weapon = window.WEAPONS[state.currentWeapon];
    ctx.textAlign = 'right';
    ctx.fillStyle = weapon.color;
    ctx.font = 'bold 14px "Share Tech Mono", monospace';
    ctx.shadowColor = weapon.color;
    ctx.shadowBlur = 8;
    ctx.fillText(weapon.name.toUpperCase(), 780, 30);
    ctx.shadowBlur = 0;

    if (weapon.magSize) {
      ctx.fillStyle = state.currentMag > 2 ? PALETTE.uiText : PALETTE.uiDanger;
      ctx.font = '12px "Share Tech Mono", monospace';
      ctx.fillText(`${state.currentMag}/${weapon.magSize}`, 780, 48);
    }

    // Deck info
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.uiPrimary;
    ctx.font = '12px "Share Tech Mono", monospace';
    ctx.fillText(window.DECKS[state.currentDeck].name.toUpperCase(), 400, 25);

    // Augmentations
    ctx.textAlign = 'left';
    ctx.font = '9px "Share Tech Mono", monospace';
    let augY = 75;
    for (const augId in state.augmentations) {
      if (state.augmentations[augId]) {
        const aug = window.AUGMENTATIONS[augId];
        ctx.fillStyle = aug.color;
        ctx.shadowColor = aug.color;
        ctx.shadowBlur = 4;
        ctx.fillText(`[${aug.name.toUpperCase()}]`, 20, augY);
        ctx.shadowBlur = 0;
        augY += 14;
      }
    }

    // Combo counter
    if (state.comboCount > 1) {
      ctx.textAlign = 'center';
      ctx.fillStyle = PALETTE.uiWarning;
      ctx.font = 'bold 24px Orbitron, monospace';
      ctx.shadowColor = PALETTE.uiWarning;
      ctx.shadowBlur = 15;
      ctx.fillText(`${state.comboCount}x COMBO`, 400, 100);
      ctx.shadowBlur = 0;
    }

    // Stats
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.uiTextDim;
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillText(`KILLS: ${state.enemiesKilled} | DEATHS: ${state.deaths}`, 20, 580);

    // Enemy counter
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.uiDanger;
    ctx.fillText(`HOSTILES: ${state.enemies.length}`, 780, 580);

    // Boss health bar
    if (state.bossActive) {
      const bbX = 150, bbY = 65, bbW = 500, bbH = 22;

      ctx.fillStyle = PALETTE.bgMid;
      ctx.fillRect(bbX, bbY, bbW, bbH);

      const phase = state.bossPhase;
      const bossColor = phase >= 3 ? PALETTE.uiDanger : phase >= 2 ? PALETTE.uiWarning : PALETTE.enemyElite;

      ctx.fillStyle = bossColor;
      ctx.fillRect(bbX, bbY, bbW * (state.bossHp / state.bossMaxHp), bbH);

      ctx.shadowColor = bossColor;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = bossColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(bbX, bbY, bbW, bbH);
      ctx.shadowBlur = 0;

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Orbitron, monospace';
      ctx.fillText(`BOSS - PHASE ${state.bossPhase}`, 400, bbY + 16);
    }

    // Dash cooldown indicator
    if (state.augmentations.neural_dash && state.dashCooldown > 0) {
      ctx.fillStyle = PALETTE.uiTextDim;
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`DASH: ${state.dashCooldown.toFixed(1)}s`, 400, 560);
    }

    ctx.restore();
  }
}

// ============================================
// GAME OVER SCENE
// ============================================
class GameOverScene extends ex.Scene {
  onInitialize(engine) {}

  onPreUpdate(engine) {
    if (engine.input.keyboard.wasPressed(ex.Keys.Space)) {
      location.reload();
    }
  }

  onPostDraw(exCtx) {
    const ctx = exCtx.__ctx;
    if (!ctx) return;

    const state = window.gameState;
    const w = 800, h = 600;
    const time = Date.now() / 1000;

    // Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 2);
    }

    ctx.save();
    ctx.textAlign = 'center';

    // Title
    ctx.font = 'bold 56px Orbitron, monospace';
    ctx.fillStyle = PALETTE.uiDanger;
    ctx.shadowColor = PALETTE.uiDanger;
    ctx.shadowBlur = 20 + Math.sin(time * 3) * 8;
    ctx.fillText('TERMINATED', w/2, 150);
    ctx.shadowBlur = 0;

    // Stats
    ctx.font = '16px "Share Tech Mono", monospace';
    ctx.fillStyle = PALETTE.uiText;
    ctx.fillText(`HOSTILES NEUTRALIZED: ${state.enemiesKilled}`, w/2, 280);
    ctx.fillText(`SYSTEM FAILURES: ${state.deaths}`, w/2, 310);

    // Prompt
    const pulse = 0.5 + 0.5 * Math.sin(time * 3);
    ctx.globalAlpha = 0.5 + pulse * 0.5;
    ctx.fillStyle = PALETTE.uiTextDim;
    ctx.font = '14px "Share Tech Mono", monospace';
    ctx.fillText('[ PRESS SPACE TO REBOOT ]', w/2, 450);

    ctx.restore();
  }
}

// ============================================
// VICTORY SCENE
// ============================================
class VictoryScene extends ex.Scene {
  onInitialize(engine) {}

  onPostDraw(exCtx) {
    const ctx = exCtx.__ctx;
    if (!ctx) return;

    const state = window.gameState;
    const w = 800, h = 600;
    const time = Date.now() / 1000;

    ctx.save();
    ctx.textAlign = 'center';

    // Title
    ctx.font = 'bold 36px Orbitron, monospace';
    ctx.fillStyle = PALETTE.uiPrimary;
    ctx.shadowColor = PALETTE.uiPrimary;
    ctx.shadowBlur = 25;
    ctx.fillText('SHODAN TERMINATED', w/2, 100);

    ctx.font = 'bold 52px Orbitron, monospace';
    ctx.fillStyle = PALETTE.uiWarning;
    ctx.shadowColor = PALETTE.uiWarning;
    ctx.fillText('CITADEL LIBERATED', w/2, 160);
    ctx.shadowBlur = 0;

    // Stats
    ctx.font = '18px "Share Tech Mono", monospace';
    ctx.fillStyle = PALETTE.uiText;
    ctx.fillText(`TOTAL KILLS: ${state.enemiesKilled}`, w/2, 280);
    ctx.fillText(`DEATHS: ${state.deaths}`, w/2, 310);

    let augCount = 0;
    for (const aug in state.augmentations) {
      if (state.augmentations[aug]) augCount++;
    }
    ctx.fillText(`AUGMENTATIONS: ${augCount}/9`, w/2, 340);

    // Rating
    const rating = augCount >= 7 ? 'S' : augCount >= 5 ? 'A' : augCount >= 3 ? 'B' : 'C';
    ctx.font = 'bold 48px Orbitron, monospace';
    ctx.fillStyle = rating === 'S' ? PALETTE.uiWarning : PALETTE.uiPrimary;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 20;
    ctx.fillText(`RANK: ${rating}`, w/2, 420);

    ctx.restore();
  }
}

// Register scenes
game.addScene('menu', new MenuScene());
game.addScene('game', new GameScene());
game.addScene('gameover', new GameOverScene());
game.addScene('victory', new VictoryScene());

game.start().then(() => {
  game.goToScene('menu');
  console.log('Game started');
});

console.log('Main module loaded');
