// Excalibur loaded from CDN - ex is global

// Game constants
const WIDTH = 1280;
const HEIGHT = 720;
const TILE_SIZE = 32;

// Weapon definitions
const WEAPONS = {
    wrench: { name: 'Wrench', damage: 15, speed: 400, type: 'melee', durability: -1 },
    pistol: { name: 'Pistol', damage: 12, speed: 300, fireRate: 300, magSize: 12, type: 'ranged', ammoType: 'bullets' },
    shotgun: { name: 'Shotgun', damage: 48, speed: 600, fireRate: 800, magSize: 6, pellets: 6, spread: 25, type: 'ranged', ammoType: 'shells' },
    smg: { name: 'SMG', damage: 8, speed: 700, fireRate: 100, magSize: 30, type: 'ranged', ammoType: 'bullets' },
    laserPistol: { name: 'Laser Pistol', damage: 20, speed: 900, fireRate: 400, magSize: 20, type: 'ranged', ammoType: 'energy' }
};

// Enemy definitions
const ENEMY_TYPES = {
    cyborg_drone: { name: 'Cyborg Drone', hp: 30, armor: 0, damage: 10, speed: 80, color: ex.Color.fromHex('#44aa44'), radius: 12 },
    cyborg_soldier: { name: 'Cyborg Soldier', hp: 60, armor: 5, damage: 15, speed: 100, color: ex.Color.fromHex('#447744'), radius: 14, ranged: true },
    cyborg_heavy: { name: 'Cyborg Heavy', hp: 120, armor: 15, damage: 20, speed: 60, color: ex.Color.fromHex('#774444'), radius: 20 },
    mutant_crawler: { name: 'Mutant Crawler', hp: 20, armor: 0, damage: 8, speed: 120, color: ex.Color.fromHex('#aa44aa'), radius: 10 },
    security_bot: { name: 'Security Bot', hp: 80, armor: 15, damage: 18, speed: 80, color: ex.Color.fromHex('#4444aa'), radius: 14, ranged: true }
};

// Game state
const gameState = {
    screen: 'menu',
    player: null,
    enemies: [],
    bullets: [],
    pickups: [],
    score: 0,
    currentDeck: 1,
    keycards: [],
    cyberModules: 0,
    skills: {
        firearms: 1,
        melee: 1,
        hacking: 1,
        endurance: 1,
        stealth: 1
    },
    gameTime: 0,
    mariaMessages: [],
    audioLogs: []
};

// Player class
class Player extends ex.Actor {
    constructor() {
        super({
            pos: ex.vec(WIDTH / 2, HEIGHT / 2),
            radius: 16,
            color: ex.Color.fromHex('#4488ff')
        });
        this.hp = 100;
        this.maxHp = 100;
        this.energy = 100;
        this.maxEnergy = 100;
        this.speed = 150;
        this.sprintSpeed = 250;
        this.sprinting = false;
        this.angle = 0;
        this.weapons = ['wrench', 'pistol'];
        this.currentWeapon = 1;
        this.ammo = { bullets: 48, shells: 12, energy: 20 };
        this.mag = 12;
        this.reloading = false;
        this.reloadTimer = 0;
        this.lastShot = 0;
        this.flashlightOn = false;
    }

    onInitialize(engine) {
        // Create player visual
        const circle = new ex.Circle({
            radius: 16,
            color: ex.Color.fromHex('#4488ff')
        });
        this.graphics.use(circle);
    }
}

// Enemy class
class Enemy extends ex.Actor {
    constructor(type, x, y) {
        const def = ENEMY_TYPES[type];
        super({
            pos: ex.vec(x, y),
            radius: def.radius,
            color: def.color
        });
        this.type = type;
        this.hp = def.hp;
        this.maxHp = def.hp;
        this.armor = def.armor;
        this.damage = def.damage;
        this.moveSpeed = def.speed;
        this.ranged = def.ranged || false;
        this.lastAttack = 0;
        this.attackCooldown = this.ranged ? 2000 : 1000;
        this.state = 'patrol';
    }

    onInitialize(engine) {
        const def = ENEMY_TYPES[this.type];
        const circle = new ex.Circle({
            radius: def.radius,
            color: def.color
        });
        this.graphics.use(circle);
    }
}

// Bullet class
class Bullet extends ex.Actor {
    constructor(x, y, angle, damage, speed, isEnemy = false) {
        super({
            pos: ex.vec(x, y),
            radius: 4,
            color: isEnemy ? ex.Color.fromHex('#ff4444') : ex.Color.fromHex('#ffff00')
        });
        this.angle = angle;
        this.damage = damage;
        this.moveSpeed = speed;
        this.isEnemy = isEnemy;
        this.born = Date.now();
        this.lifetime = 2000;
    }

    onInitialize(engine) {
        const circle = new ex.Circle({
            radius: 4,
            color: this.isEnemy ? ex.Color.fromHex('#ff4444') : ex.Color.fromHex('#ffff00')
        });
        this.graphics.use(circle);
    }
}

// Pickup class
class Pickup extends ex.Actor {
    constructor(x, y, type, amount) {
        super({
            pos: ex.vec(x, y),
            radius: 10,
            color: type === 'health' ? ex.Color.fromHex('#ff4444') : ex.Color.fromHex('#44ff44')
        });
        this.type = type;
        this.amount = amount;
    }

    onInitialize(engine) {
        const circle = new ex.Circle({
            radius: 10,
            color: this.type === 'health' ? ex.Color.fromHex('#ff4444') : ex.Color.fromHex('#44ff44')
        });
        this.graphics.use(circle);
    }
}

// Create game
let game;
let player;
let enemies = [];
let bullets = [];
let pickups = [];
let keys = {};
let mouse = { x: WIDTH / 2, y: HEIGHT / 2, down: false };

async function initGame() {
    // Create Excalibur game
    game = new ex.Engine({
        width: WIDTH,
        height: HEIGHT,
        backgroundColor: ex.Color.fromHex('#0a0a12'),
        displayMode: ex.DisplayMode.FillScreen,
        antialiasing: false
    });

    // Input handlers
    game.input.keyboard.on('press', (evt) => {
        keys[evt.key] = true;
        if (evt.key === ex.Keys.R) reload();
        if (evt.key === ex.Keys.Q) switchWeapon();
        if (evt.key === ex.Keys.F) toggleFlashlight();
    });
    game.input.keyboard.on('release', (evt) => {
        keys[evt.key] = false;
    });

    game.input.pointers.primary.on('move', (evt) => {
        mouse.x = evt.worldPos.x;
        mouse.y = evt.worldPos.y;
    });

    game.input.pointers.primary.on('down', (evt) => {
        mouse.down = true;
        if (gameState.screen === 'menu') {
            startGame();
        }
    });

    game.input.pointers.primary.on('up', () => {
        mouse.down = false;
    });

    // Setup scenes
    setupMenuScene();
    setupGameScene();

    // Expose for testing
    window.gameState = gameState;
    window.startGame = startGame;
    window.game = game;

    // Start game engine
    await game.start();
}

function setupMenuScene() {
    const menuScene = new ex.Scene();
    game.addScene('menu', menuScene);

    // Add menu text (will be rendered in update)
    menuScene.onPreUpdate = (engine, delta) => {
        // Menu is static, handle in draw
    };

    menuScene.onPostDraw = (ctx, delta) => {
        ctx.save();

        // Title
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SYSTEM SHOCK 2D', WIDTH / 2, 150);

        // Subtitle
        ctx.fillStyle = '#888899';
        ctx.font = '24px Arial';
        ctx.fillText('Whispers of M.A.R.I.A.', WIDTH / 2, 200);

        // Instructions
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Arial';
        ctx.fillText('WASD - Move', WIDTH / 2, 320);
        ctx.fillText('Mouse - Aim', WIDTH / 2, 350);
        ctx.fillText('Left Click - Attack/Shoot', WIDTH / 2, 380);
        ctx.fillText('R - Reload', WIDTH / 2, 410);
        ctx.fillText('Q - Switch Weapon', WIDTH / 2, 440);
        ctx.fillText('Shift - Sprint', WIDTH / 2, 470);

        // Start prompt
        ctx.fillStyle = '#44ff44';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('CLICK TO START', WIDTH / 2, 560);

        // M.A.R.I.A. quote
        ctx.fillStyle = '#ff0000';
        ctx.font = 'italic 16px Arial';
        ctx.fillText('"You are awake. Good. I have been waiting for you."', WIDTH / 2, 640);
        ctx.fillText('- M.A.R.I.A.', WIDTH / 2, 665);

        ctx.restore();
    };
}

function setupGameScene() {
    const gameScene = new ex.Scene();
    game.addScene('game', gameScene);

    gameScene.onPreUpdate = (engine, delta) => {
        if (gameState.screen !== 'game') return;
        updateGame(delta / 1000);
    };

    gameScene.onPostDraw = (ctx, delta) => {
        if (gameState.screen !== 'game') return;
        renderHUD(ctx);
    };
}

function startGame() {
    gameState.screen = 'game';
    gameState.score = 0;
    gameState.cyberModules = 0;
    gameState.gameTime = Date.now();

    // Create player
    player = new Player();
    game.currentScene.add(player);
    gameState.player = player;

    // Spawn initial enemies
    spawnEnemies();

    game.goToScene('game');
}

function spawnEnemies() {
    const types = Object.keys(ENEMY_TYPES);
    const numEnemies = 5 + gameState.currentDeck * 2;

    for (let i = 0; i < numEnemies; i++) {
        let x, y;
        do {
            x = Math.random() * (WIDTH - 100) + 50;
            y = Math.random() * (HEIGHT - 100) + 50;
        } while (Math.sqrt((x - WIDTH/2)**2 + (y - HEIGHT/2)**2) < 200);

        const type = types[Math.floor(Math.random() * Math.min(types.length, 2 + gameState.currentDeck))];
        const enemy = new Enemy(type, x, y);
        game.currentScene.add(enemy);
        enemies.push(enemy);
        gameState.enemies.push(enemy);
    }
}

function reload() {
    if (player.reloading) return;
    const weapon = WEAPONS[player.weapons[player.currentWeapon]];
    if (weapon.type !== 'ranged') return;
    if (player.ammo[weapon.ammoType] <= 0) return;
    if (player.mag >= weapon.magSize) return;

    player.reloading = true;
    player.reloadTimer = 1500; // 1.5 seconds
}

function switchWeapon() {
    player.currentWeapon = (player.currentWeapon + 1) % player.weapons.length;
    const weapon = WEAPONS[player.weapons[player.currentWeapon]];
    if (weapon.type === 'ranged') {
        player.mag = weapon.magSize;
    }
    player.reloading = false;
}

function toggleFlashlight() {
    player.flashlightOn = !player.flashlightOn;
}

function shoot() {
    const weapon = WEAPONS[player.weapons[player.currentWeapon]];

    if (weapon.type === 'melee') {
        // Melee attack
        const now = Date.now();
        if (now - player.lastShot < weapon.speed) return;
        player.lastShot = now;

        // Check for enemies in melee range
        enemies.forEach(enemy => {
            const dist = Math.sqrt((enemy.pos.x - player.pos.x)**2 + (enemy.pos.y - player.pos.y)**2);
            if (dist < 50) {
                damageEnemy(enemy, weapon.damage);
            }
        });
        return;
    }

    // Ranged attack
    if (player.reloading) return;
    const now = Date.now();
    if (now - player.lastShot < weapon.fireRate) return;
    if (player.mag <= 0) {
        reload();
        return;
    }

    player.lastShot = now;
    player.mag--;

    const baseAngle = Math.atan2(mouse.y - player.pos.y, mouse.x - player.pos.x);
    const pellets = weapon.pellets || 1;

    for (let i = 0; i < pellets; i++) {
        const spread = (Math.random() - 0.5) * (weapon.spread || 0) * Math.PI / 180;
        const angle = baseAngle + spread;

        const bullet = new Bullet(
            player.pos.x + Math.cos(angle) * 20,
            player.pos.y + Math.sin(angle) * 20,
            angle,
            weapon.damage / pellets,
            weapon.speed || 600
        );
        game.currentScene.add(bullet);
        bullets.push(bullet);
        gameState.bullets.push(bullet);
    }
}

function damageEnemy(enemy, damage) {
    const finalDamage = Math.max(1, damage - enemy.armor);
    enemy.hp -= finalDamage;

    if (enemy.hp <= 0) {
        // Enemy died
        gameState.score += 100;
        gameState.cyberModules += 10;

        // Drop pickup
        if (Math.random() < 0.4) {
            const type = Math.random() < 0.5 ? 'health' : 'ammo';
            const pickup = new Pickup(enemy.pos.x, enemy.pos.y, type, type === 'health' ? 25 : 15);
            game.currentScene.add(pickup);
            pickups.push(pickup);
            gameState.pickups.push(pickup);
        }

        // Remove enemy
        enemy.kill();
        const idx = enemies.indexOf(enemy);
        if (idx > -1) enemies.splice(idx, 1);
        const stateIdx = gameState.enemies.indexOf(enemy);
        if (stateIdx > -1) gameState.enemies.splice(stateIdx, 1);
    }
}

function updateGame(dt) {
    if (!player) return;

    // Player movement
    let dx = 0, dy = 0;
    if (keys[ex.Keys.W] || keys[ex.Keys.ArrowUp]) dy = -1;
    if (keys[ex.Keys.S] || keys[ex.Keys.ArrowDown]) dy = 1;
    if (keys[ex.Keys.A] || keys[ex.Keys.ArrowLeft]) dx = -1;
    if (keys[ex.Keys.D] || keys[ex.Keys.ArrowRight]) dx = 1;

    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    player.sprinting = keys[ex.Keys.ShiftLeft] || keys[ex.Keys.ShiftRight];
    if (player.sprinting && player.energy > 0) {
        player.energy -= 5 * dt;
    } else {
        player.sprinting = false;
        player.energy = Math.min(player.maxEnergy, player.energy + 2 * dt);
    }

    const speed = player.sprinting ? player.sprintSpeed : player.speed;
    player.pos.x += dx * speed * dt;
    player.pos.y += dy * speed * dt;

    // Clamp to bounds
    player.pos.x = Math.max(20, Math.min(WIDTH - 20, player.pos.x));
    player.pos.y = Math.max(20, Math.min(HEIGHT - 20, player.pos.y));

    // Player angle to mouse
    player.angle = Math.atan2(mouse.y - player.pos.y, mouse.x - player.pos.x);

    // Shooting
    if (mouse.down) shoot();

    // Reload timer
    if (player.reloading) {
        player.reloadTimer -= dt * 1000;
        if (player.reloadTimer <= 0) {
            const weapon = WEAPONS[player.weapons[player.currentWeapon]];
            const needed = weapon.magSize - player.mag;
            const available = Math.min(needed, player.ammo[weapon.ammoType]);
            player.mag += available;
            player.ammo[weapon.ammoType] -= available;
            player.reloading = false;
        }
    }

    // Update enemies
    enemies.forEach(enemy => {
        const ex = player.pos.x - enemy.pos.x;
        const ey = player.pos.y - enemy.pos.y;
        const dist = Math.sqrt(ex * ex + ey * ey);

        if (dist > 0 && dist < 400) {
            // Move towards player
            if (enemy.ranged && dist < 150) {
                // Retreat
                enemy.pos.x -= (ex / dist) * enemy.moveSpeed * dt;
                enemy.pos.y -= (ey / dist) * enemy.moveSpeed * dt;
            } else if (!enemy.ranged || dist > 200) {
                // Chase
                enemy.pos.x += (ex / dist) * enemy.moveSpeed * dt;
                enemy.pos.y += (ey / dist) * enemy.moveSpeed * dt;
            }
        }

        // Attack player
        const now = Date.now();
        if (now - enemy.lastAttack > enemy.attackCooldown) {
            if (enemy.ranged && dist < 350 && dist > 100) {
                // Ranged attack
                const angle = Math.atan2(ey, ex);
                const bullet = new Bullet(enemy.pos.x, enemy.pos.y, angle, enemy.damage, 300, true);
                game.currentScene.add(bullet);
                bullets.push(bullet);
                enemy.lastAttack = now;
            } else if (!enemy.ranged && dist < 30) {
                // Melee attack
                player.hp -= enemy.damage;
                enemy.lastAttack = now;
            }
        }
    });

    // Update bullets
    bullets.forEach((bullet, idx) => {
        bullet.pos.x += Math.cos(bullet.angle) * bullet.moveSpeed * dt;
        bullet.pos.y += Math.sin(bullet.angle) * bullet.moveSpeed * dt;

        // Check bounds
        if (bullet.pos.x < 0 || bullet.pos.x > WIDTH || bullet.pos.y < 0 || bullet.pos.y > HEIGHT) {
            bullet.kill();
            bullets.splice(idx, 1);
            return;
        }

        // Check lifetime
        if (Date.now() - bullet.born > bullet.lifetime) {
            bullet.kill();
            bullets.splice(idx, 1);
            return;
        }

        // Check collisions
        if (bullet.isEnemy) {
            const dist = Math.sqrt((player.pos.x - bullet.pos.x)**2 + (player.pos.y - bullet.pos.y)**2);
            if (dist < 20) {
                player.hp -= bullet.damage;
                bullet.kill();
                bullets.splice(idx, 1);
            }
        } else {
            for (let i = enemies.length - 1; i >= 0; i--) {
                const enemy = enemies[i];
                const dist = Math.sqrt((enemy.pos.x - bullet.pos.x)**2 + (enemy.pos.y - bullet.pos.y)**2);
                if (dist < enemy.radius + 5) {
                    damageEnemy(enemy, bullet.damage);
                    bullet.kill();
                    bullets.splice(idx, 1);
                    break;
                }
            }
        }
    });

    // Update pickups
    pickups.forEach((pickup, idx) => {
        const dist = Math.sqrt((player.pos.x - pickup.pos.x)**2 + (player.pos.y - pickup.pos.y)**2);
        if (dist < 25) {
            if (pickup.type === 'health') {
                player.hp = Math.min(player.maxHp, player.hp + pickup.amount);
            } else {
                const weapon = WEAPONS[player.weapons[player.currentWeapon]];
                if (weapon.type === 'ranged') {
                    player.ammo[weapon.ammoType] += pickup.amount;
                }
            }
            pickup.kill();
            pickups.splice(idx, 1);
        }
    });

    // Check wave complete
    if (enemies.length === 0) {
        gameState.currentDeck++;
        if (gameState.currentDeck > 5) {
            // Win!
            gameState.screen = 'victory';
        } else {
            spawnEnemies();
            // M.A.R.I.A. message
            gameState.mariaMessages.push({
                text: `"You advance to Deck ${gameState.currentDeck}. How... persistent."`,
                time: Date.now()
            });
        }
    }

    // Check player death
    if (player.hp <= 0) {
        gameState.screen = 'gameover';
    }
}

function renderHUD(ctx) {
    ctx.save();

    // HP bar
    ctx.fillStyle = '#333333';
    ctx.fillRect(20, 20, 200, 20);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(20, 20, 200 * Math.max(0, player.hp / player.maxHp), 20);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 200, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${Math.max(0, Math.floor(player.hp))}/${player.maxHp}`, 25, 35);

    // Energy bar
    ctx.fillStyle = '#333333';
    ctx.fillRect(20, 45, 150, 15);
    ctx.fillStyle = '#4488ff';
    ctx.fillRect(20, 45, 150 * (player.energy / player.maxEnergy), 15);

    // Weapon info
    const weapon = WEAPONS[player.weapons[player.currentWeapon]];
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.fillText(weapon.name, 20, 85);
    if (weapon.type === 'ranged') {
        ctx.font = '14px Arial';
        ctx.fillText(`${player.mag}/${weapon.magSize} | ${player.ammo[weapon.ammoType]}`, 20, 105);
    }

    if (player.reloading) {
        ctx.fillStyle = '#ffaa00';
        ctx.font = '14px Arial';
        ctx.fillText('RELOADING...', 20, 125);
    }

    // Score and cyber modules
    ctx.fillStyle = '#ffdd00';
    ctx.font = '18px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Cyber Modules: ${gameState.cyberModules}`, WIDTH - 20, 35);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Score: ${gameState.score}`, WIDTH - 20, 60);
    ctx.fillText(`Deck: ${gameState.currentDeck}/5`, WIDTH - 20, 85);

    // Enemy count
    ctx.fillStyle = '#ff4444';
    ctx.fillText(`Hostiles: ${enemies.length}`, WIDTH - 20, 110);

    // Direction indicator (line showing aim)
    const lineLen = 30;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.pos.x, player.pos.y);
    ctx.lineTo(
        player.pos.x + Math.cos(player.angle) * lineLen,
        player.pos.y + Math.sin(player.angle) * lineLen
    );
    ctx.stroke();

    // M.A.R.I.A. messages
    const now = Date.now();
    gameState.mariaMessages = gameState.mariaMessages.filter(msg => now - msg.time < 5000);
    gameState.mariaMessages.forEach((msg, i) => {
        const alpha = 1 - (now - msg.time) / 5000;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff0000';
        ctx.font = 'italic 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(msg.text, WIDTH / 2, HEIGHT - 50 - i * 25);
    });
    ctx.globalAlpha = 1;

    // Game over overlay
    if (gameState.screen === 'gameover') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION FAILED', WIDTH / 2, HEIGHT / 2 - 50);
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${gameState.score}`, WIDTH / 2, HEIGHT / 2 + 20);
        ctx.fillText(`Deck Reached: ${gameState.currentDeck}`, WIDTH / 2, HEIGHT / 2 + 55);
    }

    // Victory overlay
    if (gameState.screen === 'victory') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = '#44ff44';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('M.A.R.I.A. DEFEATED', WIDTH / 2, HEIGHT / 2 - 50);
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${gameState.score}`, WIDTH / 2, HEIGHT / 2 + 20);
        ctx.fillText('The Von Braun is silent once more...', WIDTH / 2, HEIGHT / 2 + 55);
    }

    ctx.restore();
}

// Initialize
initGame().catch(console.error);
