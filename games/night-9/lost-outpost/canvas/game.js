// Lost Outpost - Survival Horror Shooter
// Canvas 2D Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const TILE_SIZE = 32;
const PLAYER_SIZE = 24;
const FLASHLIGHT_ANGLE = Math.PI / 4; // 45 degrees
const FLASHLIGHT_RANGE = 250;

// Game states
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'level_complete',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

// Weapon definitions
const WEAPONS = {
    assaultRifle: { name: 'Assault Rifle', damage: 15, fireRate: 0.15, magSize: 30, reloadTime: 2.0, spread: 0.08, auto: true, color: '#aaaaaa' },
    smg: { name: 'SMG', damage: 8, fireRate: 0.08, magSize: 45, reloadTime: 1.5, spread: 0.15, auto: true, color: '#888888' },
    shotgun: { name: 'Shotgun', damage: 8, fireRate: 0.7, magSize: 8, reloadTime: 2.5, spread: 0.25, pellets: 6, auto: false, color: '#aa8866' },
    flamethrower: { name: 'Flamethrower', damage: 5, fireRate: 0.05, magSize: 100, reloadTime: 3.0, spread: 0.2, auto: true, flame: true, color: '#ff6644' }
};

// Enemy definitions
const ENEMIES = {
    scorpion: { hp: 30, damage: 10, speed: 80, attackRate: 1.5, color: '#44aa44', size: 20, name: 'Scorpion' },
    scorpionLaser: { hp: 40, damage: 15, speed: 60, attackRate: 2.0, ranged: true, color: '#44ff44', size: 22, name: 'Scorpion (Laser)' },
    arachnid: { hp: 80, damage: 20, speed: 50, attackRate: 2.0, color: '#228822', size: 28, name: 'Arachnid' }
};

// Level definitions
const LEVELS = [
    { name: 'Arrival', subtitle: 'Docking Bay Alpha', width: 20, height: 15, enemies: { scorpion: 5 }, keycard: true, boss: null },
    { name: 'Engineering Deck', subtitle: 'Reactor Corridors', width: 25, height: 20, enemies: { scorpion: 8, scorpionLaser: 3 }, keycard: true, boss: null, unlocks: 'smg' },
    { name: 'Medical Bay', subtitle: 'Quarantine Zone', width: 25, height: 20, enemies: { scorpion: 6, arachnid: 4, scorpionLaser: 3 }, keycard: true, boss: null, unlocks: 'shotgun' },
    { name: 'Cargo Hold', subtitle: 'Warehouse', width: 30, height: 25, enemies: { scorpion: 10, arachnid: 6, scorpionLaser: 4 }, keycard: true, boss: null, unlocks: 'flamethrower' },
    { name: 'Hive Core', subtitle: 'Final Battle', width: 35, height: 30, enemies: { scorpion: 8, arachnid: 8, scorpionLaser: 6 }, keycard: false, boss: 'hiveCommander' }
];

// Boss definition
const BOSSES = {
    hiveCommander: { hp: 500, damage: 25, speed: 40, color: '#00ff00', size: 48, name: 'Hive Commander', phases: 3 }
};

// Game object
const game = {
    state: GameState.MENU,
    currentLevel: 0,
    debugMode: false,

    // Player
    player: {
        x: 100, y: 100,
        angle: 0,
        hp: 100, maxHp: 100,
        lives: 3,
        weapons: ['assaultRifle'],
        currentWeapon: 0,
        ammo: { assaultRifle: 300, smg: 0, shotgun: 0, flamethrower: 0 },
        currentMag: 30,
        reloading: false,
        reloadTimer: 0,
        fireCooldown: 0,
        credits: 0,
        hasKeycard: false,
        invincible: false,
        invincibleTimer: 0
    },

    // Level
    level: {
        tiles: [],
        enemies: [],
        bullets: [],
        playerBullets: [],
        pickups: [],
        doors: [],
        particles: [],
        floatingTexts: [],
        exit: null,
        keycardPos: null
    },

    // Boss
    boss: null,

    // Input
    keys: {},
    mouse: { x: 0, y: 0, down: false },

    // Stats
    stats: {
        enemiesKilled: 0,
        shotsFired: 0,
        timePlayed: 0,
        startTime: 0
    }
};

// Initialize
function init() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    game.stats.startTime = Date.now();
    requestAnimationFrame(gameLoop);
}

// Input handlers
function handleKeyDown(e) {
    game.keys[e.key.toLowerCase()] = true;

    if (e.key.toLowerCase() === 'q') {
        game.debugMode = !game.debugMode;
    }

    if (e.key === ' ' || e.key === 'Enter') {
        if (game.state === GameState.MENU) {
            startGame();
        } else if (game.state === GameState.LEVEL_COMPLETE) {
            nextLevel();
        } else if (game.state === GameState.GAME_OVER) {
            restartLevel();
        } else if (game.state === GameState.VICTORY) {
            resetGame();
        } else if (game.state === GameState.PLAYING) {
            interact();
        }
    }

    if (e.key.toLowerCase() === 'r' && game.state === GameState.PLAYING) {
        startReload();
    }

    // Weapon switching
    if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key) - 1;
        if (idx < game.player.weapons.length) {
            switchWeapon(idx);
        }
    }
}

function handleKeyUp(e) {
    game.keys[e.key.toLowerCase()] = false;
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    game.mouse.x = e.clientX - rect.left;
    game.mouse.y = e.clientY - rect.top;
}

function handleMouseDown(e) {
    if (e.button === 0) game.mouse.down = true;
}

function handleMouseUp(e) {
    if (e.button === 0) game.mouse.down = false;
}

// Game management
function startGame() {
    game.state = GameState.PLAYING;
    game.currentLevel = 0;
    game.player.lives = 3;
    game.player.hp = 100;
    game.player.credits = 0;
    game.player.weapons = ['assaultRifle'];
    game.player.currentWeapon = 0;
    game.player.ammo = { assaultRifle: 300, smg: 0, shotgun: 0, flamethrower: 0 };
    loadLevel();
}

function resetGame() {
    game.state = GameState.MENU;
    game.currentLevel = 0;
    game.stats = { enemiesKilled: 0, shotsFired: 0, timePlayed: 0, startTime: Date.now() };
}

function loadLevel() {
    const levelDef = LEVELS[game.currentLevel];

    game.level = {
        tiles: [],
        enemies: [],
        bullets: [],
        playerBullets: [],
        pickups: [],
        doors: [],
        particles: [],
        floatingTexts: [],
        exit: null,
        keycardPos: null
    };

    game.boss = null;
    game.player.hasKeycard = !levelDef.keycard;
    game.player.hp = game.player.maxHp;

    // Generate level
    generateLevel(levelDef);

    // Spawn enemies
    spawnEnemies(levelDef);

    // Add boss on level 5
    if (levelDef.boss) {
        spawnBoss(levelDef.boss);
    }

    // Unlock new weapon
    if (levelDef.unlocks && !game.player.weapons.includes(levelDef.unlocks)) {
        game.player.weapons.push(levelDef.unlocks);
        game.player.ammo[levelDef.unlocks] = WEAPONS[levelDef.unlocks].magSize * 3;
        addFloatingText(game.player.x, game.player.y - 40, 'NEW WEAPON: ' + WEAPONS[levelDef.unlocks].name.toUpperCase(), '#ffff44');
    }
}

function generateLevel(levelDef) {
    const w = levelDef.width;
    const h = levelDef.height;

    // Create tile grid
    for (let y = 0; y < h; y++) {
        game.level.tiles[y] = [];
        for (let x = 0; x < w; x++) {
            // Walls on edges
            const isWall = x === 0 || x === w - 1 || y === 0 || y === h - 1;
            game.level.tiles[y][x] = isWall ? 1 : 0;
        }
    }

    // Add interior walls and rooms
    addInteriorStructure(w, h);

    // Place player at start
    game.player.x = TILE_SIZE * 2.5;
    game.player.y = TILE_SIZE * (h / 2);

    // Place exit
    game.level.exit = {
        x: (w - 2) * TILE_SIZE,
        y: (h / 2) * TILE_SIZE,
        locked: levelDef.keycard
    };

    // Add door tile at exit
    game.level.tiles[Math.floor(h / 2)][w - 1] = 2;

    // Place keycard if needed
    if (levelDef.keycard) {
        game.level.keycardPos = {
            x: (w / 2 + Math.random() * w / 4) * TILE_SIZE,
            y: (h / 4 + Math.random() * h / 2) * TILE_SIZE,
            collected: false
        };
    }

    // Add pickups
    for (let i = 0; i < 5 + game.currentLevel * 2; i++) {
        const px = (2 + Math.random() * (w - 4)) * TILE_SIZE;
        const py = (2 + Math.random() * (h - 4)) * TILE_SIZE;
        const types = ['health', 'ammo', 'credits'];
        game.level.pickups.push({
            type: types[Math.floor(Math.random() * types.length)],
            x: px,
            y: py
        });
    }

    // Add destructible barrels
    for (let i = 0; i < 3 + game.currentLevel; i++) {
        const bx = (3 + Math.random() * (w - 6)) * TILE_SIZE;
        const by = (3 + Math.random() * (h - 6)) * TILE_SIZE;
        game.level.pickups.push({
            type: 'barrel',
            x: bx,
            y: by,
            hp: 20
        });
    }
}

function addInteriorStructure(w, h) {
    // Add some interior walls/corridors
    const numWalls = 3 + game.currentLevel;
    for (let i = 0; i < numWalls; i++) {
        const wallX = 4 + Math.floor(Math.random() * (w - 8));
        const wallY = 4 + Math.floor(Math.random() * (h - 8));
        const wallLen = 3 + Math.floor(Math.random() * 5);
        const vertical = Math.random() > 0.5;

        for (let j = 0; j < wallLen; j++) {
            const tx = vertical ? wallX : wallX + j;
            const ty = vertical ? wallY + j : wallY;
            if (tx > 0 && tx < w - 1 && ty > 0 && ty < h - 1) {
                // Leave gap for passage
                if (j !== Math.floor(wallLen / 2)) {
                    game.level.tiles[ty][tx] = 1;
                }
            }
        }
    }

    // Add some crates/cover
    for (let i = 0; i < 5 + game.currentLevel * 2; i++) {
        const cx = 3 + Math.floor(Math.random() * (w - 6));
        const cy = 3 + Math.floor(Math.random() * (h - 6));
        if (game.level.tiles[cy][cx] === 0) {
            game.level.tiles[cy][cx] = 3; // Crate
        }
    }
}

function spawnEnemies(levelDef) {
    const w = levelDef.width;
    const h = levelDef.height;

    Object.entries(levelDef.enemies).forEach(([type, count]) => {
        for (let i = 0; i < count; i++) {
            let x, y;
            do {
                x = (3 + Math.random() * (w - 6)) * TILE_SIZE;
                y = (3 + Math.random() * (h - 6)) * TILE_SIZE;
            } while (Math.hypot(x - game.player.x, y - game.player.y) < 200);

            const def = ENEMIES[type];
            game.level.enemies.push({
                type: type,
                x: x,
                y: y,
                hp: def.hp * (1 + game.currentLevel * 0.1),
                maxHp: def.hp * (1 + game.currentLevel * 0.1),
                damage: def.damage,
                speed: def.speed,
                attackRate: def.attackRate,
                attackCooldown: Math.random() * def.attackRate,
                color: def.color,
                size: def.size,
                name: def.name,
                ranged: def.ranged || false,
                state: 'idle',
                alertTimer: 0
            });
        }
    });
}

function spawnBoss(bossKey) {
    const bossDef = BOSSES[bossKey];
    const levelDef = LEVELS[game.currentLevel];

    game.boss = {
        type: bossKey,
        x: (levelDef.width - 5) * TILE_SIZE,
        y: (levelDef.height / 2) * TILE_SIZE,
        hp: bossDef.hp,
        maxHp: bossDef.hp,
        damage: bossDef.damage,
        speed: bossDef.speed,
        color: bossDef.color,
        size: bossDef.size,
        name: bossDef.name,
        phase: 1,
        attackTimer: 0,
        spawnTimer: 0
    };
}

function nextLevel() {
    game.currentLevel++;
    if (game.currentLevel >= LEVELS.length) {
        game.state = GameState.VICTORY;
    } else {
        game.state = GameState.PLAYING;
        loadLevel();
    }
}

function restartLevel() {
    if (game.player.lives > 0) {
        game.player.lives--;
        game.player.hp = game.player.maxHp;
        loadLevel();
        game.state = GameState.PLAYING;
    } else {
        game.state = GameState.GAME_OVER;
    }
}

// Combat
function shoot() {
    if (game.player.reloading || game.player.fireCooldown > 0) return;

    const weaponKey = game.player.weapons[game.player.currentWeapon];
    const weapon = WEAPONS[weaponKey];

    if (game.player.currentMag <= 0) {
        startReload();
        return;
    }

    game.player.currentMag--;
    game.player.fireCooldown = weapon.fireRate;
    game.stats.shotsFired++;

    const dx = game.mouse.x - canvas.width / 2;
    const dy = game.mouse.y - canvas.height / 2;
    const angle = Math.atan2(dy, dx);

    const pellets = weapon.pellets || 1;
    for (let i = 0; i < pellets; i++) {
        const spread = (Math.random() - 0.5) * weapon.spread * 2;
        const bulletAngle = angle + spread;

        game.level.playerBullets.push({
            x: game.player.x + Math.cos(angle) * 15,
            y: game.player.y + Math.sin(angle) * 15,
            vx: Math.cos(bulletAngle) * (weapon.flame ? 300 : 600),
            vy: Math.sin(bulletAngle) * (weapon.flame ? 300 : 600),
            damage: weapon.damage,
            flame: weapon.flame || false,
            color: weapon.flame ? '#ff6633' : '#ffff44',
            life: weapon.flame ? 0.4 : 1.5
        });
    }

    // Muzzle flash
    addParticle(game.player.x + Math.cos(angle) * 20, game.player.y + Math.sin(angle) * 20, 'muzzle');
}

function startReload() {
    if (game.player.reloading) return;

    const weaponKey = game.player.weapons[game.player.currentWeapon];
    const weapon = WEAPONS[weaponKey];

    if (game.player.ammo[weaponKey] <= 0) {
        addFloatingText(game.player.x, game.player.y - 30, 'NO AMMO', '#ff4444');
        return;
    }

    game.player.reloading = true;
    game.player.reloadTimer = weapon.reloadTime;
}

function finishReload() {
    const weaponKey = game.player.weapons[game.player.currentWeapon];
    const weapon = WEAPONS[weaponKey];

    const needed = weapon.magSize - game.player.currentMag;
    const available = game.player.ammo[weaponKey];
    const reload = Math.min(needed, available);

    game.player.ammo[weaponKey] -= reload;
    game.player.currentMag += reload;
    game.player.reloading = false;

    addFloatingText(game.player.x, game.player.y - 30, 'RELOADED', '#44ff44');
}

function switchWeapon(idx) {
    if (idx >= game.player.weapons.length) return;
    game.player.currentWeapon = idx;
    game.player.reloading = false;

    const weaponKey = game.player.weapons[idx];
    const weapon = WEAPONS[weaponKey];
    game.player.currentMag = Math.min(game.player.currentMag, weapon.magSize);

    addFloatingText(game.player.x, game.player.y - 30, weapon.name.toUpperCase(), '#44aaff');
}

function interact() {
    // Check exit
    if (game.level.exit) {
        const dist = Math.hypot(game.player.x - game.level.exit.x, game.player.y - game.level.exit.y);
        if (dist < TILE_SIZE * 2) {
            if (!game.level.exit.locked || game.player.hasKeycard) {
                // Check if boss is dead or no boss
                if (!game.boss || game.boss.hp <= 0) {
                    if (game.level.enemies.length === 0) {
                        game.state = GameState.LEVEL_COMPLETE;
                    } else {
                        addFloatingText(game.player.x, game.player.y - 30, 'CLEAR ALL ENEMIES!', '#ff4444');
                    }
                }
            } else {
                addFloatingText(game.player.x, game.player.y - 30, 'NEED KEYCARD!', '#ff4444');
            }
        }
    }

    // Check keycard
    if (game.level.keycardPos && !game.level.keycardPos.collected) {
        const dist = Math.hypot(game.player.x - game.level.keycardPos.x, game.player.y - game.level.keycardPos.y);
        if (dist < TILE_SIZE) {
            game.level.keycardPos.collected = true;
            game.player.hasKeycard = true;
            addFloatingText(game.level.keycardPos.x, game.level.keycardPos.y - 20, 'KEYCARD ACQUIRED!', '#44ffff');
        }
    }
}

function damagePlayer(amount) {
    if (game.player.invincible) return;

    game.player.hp -= amount;
    game.player.invincible = true;
    game.player.invincibleTimer = 1.0;

    addFloatingText(game.player.x, game.player.y - 20, '-' + amount, '#ff4444');
    addParticle(game.player.x, game.player.y, 'damage');

    if (game.player.hp <= 0) {
        game.player.lives--;
        if (game.player.lives <= 0) {
            game.state = GameState.GAME_OVER;
        } else {
            game.player.hp = game.player.maxHp;
            addFloatingText(game.player.x, game.player.y - 40, 'LIVES: ' + game.player.lives, '#ff8844');
        }
    }
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    if (game.state === GameState.PLAYING) {
        game.stats.timePlayed += dt;
    }

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    if (game.state !== GameState.PLAYING) return;

    updatePlayer(dt);
    updateEnemies(dt);
    updateBoss(dt);
    updateBullets(dt);
    updatePickups();
    updateParticles(dt);
    updateFloatingTexts(dt);
}

function updatePlayer(dt) {
    // Face mouse
    const dx = game.mouse.x - canvas.width / 2;
    const dy = game.mouse.y - canvas.height / 2;
    game.player.angle = Math.atan2(dy, dx);

    // Movement
    let mx = 0, my = 0;
    if (game.keys['w'] || game.keys['arrowup']) my -= 1;
    if (game.keys['s'] || game.keys['arrowdown']) my += 1;
    if (game.keys['a'] || game.keys['arrowleft']) mx -= 1;
    if (game.keys['d'] || game.keys['arrowright']) mx += 1;

    if (mx !== 0 || my !== 0) {
        const len = Math.hypot(mx, my);
        mx /= len;
        my /= len;

        const speed = 150;
        const newX = game.player.x + mx * speed * dt;
        const newY = game.player.y + my * speed * dt;

        if (!collidesWithWalls(newX, game.player.y, PLAYER_SIZE)) {
            game.player.x = newX;
        }
        if (!collidesWithWalls(game.player.x, newY, PLAYER_SIZE)) {
            game.player.y = newY;
        }
    }

    // Fire cooldown
    if (game.player.fireCooldown > 0) {
        game.player.fireCooldown -= dt;
    }

    // Reload
    if (game.player.reloading) {
        game.player.reloadTimer -= dt;
        if (game.player.reloadTimer <= 0) {
            finishReload();
        }
    }

    // Invincibility
    if (game.player.invincibleTimer > 0) {
        game.player.invincibleTimer -= dt;
        if (game.player.invincibleTimer <= 0) {
            game.player.invincible = false;
        }
    }

    // Shooting
    const weaponKey = game.player.weapons[game.player.currentWeapon];
    const weapon = WEAPONS[weaponKey];
    if (game.mouse.down && (weapon.auto || game.player.fireCooldown <= 0)) {
        shoot();
    }
}

function updateEnemies(dt) {
    game.level.enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;

        const distToPlayer = Math.hypot(game.player.x - enemy.x, game.player.y - enemy.y);
        const angleToPlayer = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);

        // Check if player is in detection range (or always active if close)
        const inRange = distToPlayer < 300 || enemy.state === 'alert';
        if (inRange) {
            enemy.state = 'alert';
            enemy.alertTimer = 5;

            // Move toward player
            if (distToPlayer > (enemy.ranged ? 150 : 40)) {
                const moveX = Math.cos(angleToPlayer) * enemy.speed * dt;
                const moveY = Math.sin(angleToPlayer) * enemy.speed * dt;

                if (!collidesWithWalls(enemy.x + moveX, enemy.y, enemy.size)) {
                    enemy.x += moveX;
                }
                if (!collidesWithWalls(enemy.x, enemy.y + moveY, enemy.size)) {
                    enemy.y += moveY;
                }
            }

            // Attack
            enemy.attackCooldown -= dt;
            if (enemy.attackCooldown <= 0) {
                if (enemy.ranged && distToPlayer < 300) {
                    // Ranged attack
                    game.level.bullets.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: Math.cos(angleToPlayer) * 250,
                        vy: Math.sin(angleToPlayer) * 250,
                        damage: enemy.damage,
                        color: '#44ff44',
                        size: 6
                    });
                    enemy.attackCooldown = enemy.attackRate;
                } else if (!enemy.ranged && distToPlayer < enemy.size + PLAYER_SIZE) {
                    // Melee attack
                    damagePlayer(enemy.damage);
                    enemy.attackCooldown = enemy.attackRate;
                }
            }
        } else {
            enemy.alertTimer -= dt;
            if (enemy.alertTimer <= 0) {
                enemy.state = 'idle';
            }
        }
    });

    // Remove dead enemies
    game.level.enemies = game.level.enemies.filter(e => {
        if (e.hp <= 0) {
            game.player.credits += 50 + game.currentLevel * 10;
            game.stats.enemiesKilled++;
            addParticle(e.x, e.y, 'death');
            addFloatingText(e.x, e.y, '+' + (50 + game.currentLevel * 10) + ' CREDITS', '#ffff44');
            return false;
        }
        return true;
    });
}

function updateBoss(dt) {
    if (!game.boss || game.boss.hp <= 0) return;

    const boss = game.boss;
    const distToPlayer = Math.hypot(game.player.x - boss.x, game.player.y - boss.y);
    const angleToPlayer = Math.atan2(game.player.y - boss.y, game.player.x - boss.x);

    // Move toward player
    if (distToPlayer > 100) {
        boss.x += Math.cos(angleToPlayer) * boss.speed * dt;
        boss.y += Math.sin(angleToPlayer) * boss.speed * dt;
    }

    // Attack patterns
    boss.attackTimer -= dt;
    if (boss.attackTimer <= 0) {
        // Burst attack
        for (let i = 0; i < 8 + boss.phase * 4; i++) {
            const angle = (i / (8 + boss.phase * 4)) * Math.PI * 2;
            game.level.bullets.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angle) * 200,
                vy: Math.sin(angle) * 200,
                damage: boss.damage,
                color: '#00ff00',
                size: 8
            });
        }
        boss.attackTimer = 2.5 - boss.phase * 0.3;
    }

    // Spawn minions
    boss.spawnTimer -= dt;
    if (boss.spawnTimer <= 0 && game.level.enemies.length < 8) {
        const spawnAngle = Math.random() * Math.PI * 2;
        const def = ENEMIES.scorpion;
        game.level.enemies.push({
            type: 'scorpion',
            x: boss.x + Math.cos(spawnAngle) * 60,
            y: boss.y + Math.sin(spawnAngle) * 60,
            hp: def.hp,
            maxHp: def.hp,
            damage: def.damage,
            speed: def.speed,
            attackRate: def.attackRate,
            attackCooldown: 1,
            color: def.color,
            size: def.size,
            name: def.name,
            ranged: false,
            state: 'alert',
            alertTimer: 10
        });
        boss.spawnTimer = 8 - boss.phase;
        addFloatingText(boss.x, boss.y - 40, 'SPAWNING MINIONS!', '#ff8800');
    }

    // Phase transitions
    const hpPercent = boss.hp / boss.maxHp;
    if (hpPercent < 0.66 && boss.phase === 1) {
        boss.phase = 2;
        boss.speed *= 1.2;
        addFloatingText(boss.x, boss.y - 50, 'PHASE 2!', '#ff4444');
    } else if (hpPercent < 0.33 && boss.phase === 2) {
        boss.phase = 3;
        boss.speed *= 1.2;
        addFloatingText(boss.x, boss.y - 50, 'FINAL PHASE!', '#ff0000');
    }

    // Contact damage
    if (distToPlayer < boss.size / 2 + PLAYER_SIZE / 2) {
        damagePlayer(boss.damage);
    }

    // Check death
    if (boss.hp <= 0) {
        game.player.credits += 1000;
        addFloatingText(boss.x, boss.y, boss.name + ' DEFEATED!', '#ffff00');
        addParticle(boss.x, boss.y, 'explosion');
    }
}

function updateBullets(dt) {
    // Player bullets
    game.level.playerBullets.forEach(bullet => {
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.life -= dt;

        // Hit enemies
        game.level.enemies.forEach(enemy => {
            if (enemy.hp > 0) {
                const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
                if (dist < enemy.size / 2 + 4) {
                    enemy.hp -= bullet.damage;
                    if (!bullet.flame) bullet.life = 0;
                    addParticle(bullet.x, bullet.y, 'hit');
                    addFloatingText(enemy.x, enemy.y - 15, '-' + bullet.damage, '#ffff00');
                }
            }
        });

        // Hit boss
        if (game.boss && game.boss.hp > 0) {
            const dist = Math.hypot(bullet.x - game.boss.x, bullet.y - game.boss.y);
            if (dist < game.boss.size / 2 + 4) {
                game.boss.hp -= bullet.damage;
                if (!bullet.flame) bullet.life = 0;
                addParticle(bullet.x, bullet.y, 'hit');
            }
        }

        // Hit barrels
        game.level.pickups.forEach(pickup => {
            if (pickup.type === 'barrel' && pickup.hp > 0) {
                const dist = Math.hypot(bullet.x - pickup.x, bullet.y - pickup.y);
                if (dist < TILE_SIZE / 2) {
                    pickup.hp -= bullet.damage;
                    if (pickup.hp <= 0) {
                        // Explode
                        game.level.enemies.forEach(e => {
                            const eDist = Math.hypot(e.x - pickup.x, e.y - pickup.y);
                            if (eDist < TILE_SIZE * 3) {
                                e.hp -= 50;
                            }
                        });
                        addParticle(pickup.x, pickup.y, 'explosion');
                        addFloatingText(pickup.x, pickup.y, 'BOOM!', '#ff8800');
                    }
                    bullet.life = 0;
                }
            }
        });

        // Hit walls
        if (collidesWithWalls(bullet.x, bullet.y, 4)) {
            bullet.life = 0;
        }
    });

    // Enemy bullets
    game.level.bullets.forEach(bullet => {
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;

        const distToPlayer = Math.hypot(bullet.x - game.player.x, bullet.y - game.player.y);
        if (distToPlayer < PLAYER_SIZE / 2 + bullet.size / 2) {
            damagePlayer(bullet.damage);
            bullet.vx = 0;
            bullet.vy = 0;
        }

        if (collidesWithWalls(bullet.x, bullet.y, bullet.size)) {
            bullet.vx = 0;
            bullet.vy = 0;
        }
    });

    // Remove dead bullets
    game.level.playerBullets = game.level.playerBullets.filter(b => b.life > 0);
    game.level.bullets = game.level.bullets.filter(b => b.vx !== 0 || b.vy !== 0);
}

function updatePickups() {
    game.level.pickups = game.level.pickups.filter(pickup => {
        if (pickup.type === 'barrel') {
            return pickup.hp > 0;
        }

        const dist = Math.hypot(game.player.x - pickup.x, game.player.y - pickup.y);
        if (dist < TILE_SIZE) {
            if (pickup.type === 'health') {
                game.player.hp = Math.min(game.player.maxHp, game.player.hp + 25);
                addFloatingText(pickup.x, pickup.y - 20, '+25 HP', '#44ff44');
            } else if (pickup.type === 'ammo') {
                const weaponKey = game.player.weapons[game.player.currentWeapon];
                game.player.ammo[weaponKey] += 30;
                addFloatingText(pickup.x, pickup.y - 20, '+30 AMMO', '#ffaa00');
            } else if (pickup.type === 'credits') {
                game.player.credits += 100;
                addFloatingText(pickup.x, pickup.y - 20, '+100 CREDITS', '#ffff44');
            }
            return false;
        }
        return true;
    });
}

function updateParticles(dt) {
    game.level.particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
    });
    game.level.particles = game.level.particles.filter(p => p.life > 0);
}

function updateFloatingTexts(dt) {
    game.level.floatingTexts.forEach(t => {
        t.y -= 30 * dt;
        t.life -= dt;
    });
    game.level.floatingTexts = game.level.floatingTexts.filter(t => t.life > 0);
}

// Helpers
function collidesWithWalls(x, y, size) {
    const half = size / 2;
    const checks = [
        [x - half, y - half],
        [x + half, y - half],
        [x - half, y + half],
        [x + half, y + half]
    ];

    for (const [cx, cy] of checks) {
        const tx = Math.floor(cx / TILE_SIZE);
        const ty = Math.floor(cy / TILE_SIZE);
        if (tx < 0 || ty < 0 || ty >= game.level.tiles.length || tx >= game.level.tiles[0]?.length) {
            return true;
        }
        const tile = game.level.tiles[ty]?.[tx];
        if (tile === 1 || tile === 3) {
            return true;
        }
    }
    return false;
}

function addParticle(x, y, type) {
    const count = type === 'explosion' ? 25 : (type === 'death' ? 15 : 5);
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = type === 'explosion' ? 200 : 100;
        game.level.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed * Math.random(),
            vy: Math.sin(angle) * speed * Math.random(),
            color: type === 'muzzle' ? '#ffff44' : (type === 'explosion' ? '#ff8844' : (type === 'death' ? '#44aa44' : '#ff4444')),
            life: 0.4,
            size: type === 'explosion' ? 4 : 3
        });
    }
}

function addFloatingText(x, y, text, color) {
    game.level.floatingTexts.push({ x, y, text, color, life: 1.5 });
}

function isInFlashlight(px, py, tx, ty, playerAngle) {
    const angleToTarget = Math.atan2(ty - py, tx - px);
    let angleDiff = Math.abs(angleToTarget - playerAngle);
    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
    const dist = Math.hypot(tx - px, ty - py);

    return angleDiff <= FLASHLIGHT_ANGLE && dist <= FLASHLIGHT_RANGE;
}

// Rendering
function render() {
    ctx.fillStyle = '#0a0808';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === GameState.MENU) {
        renderMenu();
    } else if (game.state === GameState.PLAYING) {
        renderGame();
    } else if (game.state === GameState.LEVEL_COMPLETE) {
        renderLevelComplete();
    } else if (game.state === GameState.GAME_OVER) {
        renderGameOver();
    } else if (game.state === GameState.VICTORY) {
        renderVictory();
    }

    if (game.debugMode && game.state === GameState.PLAYING) {
        renderDebug();
    }
}

function renderMenu() {
    ctx.fillStyle = '#44aaff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LOST OUTPOST', canvas.width / 2, 150);

    ctx.fillStyle = '#888888';
    ctx.font = '20px Arial';
    ctx.fillText('Survival Horror Shooter', canvas.width / 2, 190);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px Arial';
    const instructions = [
        'WASD - Move',
        'Mouse - Aim',
        'Left Click - Shoot',
        'R - Reload',
        'Space - Interact',
        '1-4 - Switch Weapons',
        'Q - Debug overlay'
    ];
    instructions.forEach((text, i) => {
        ctx.fillText(text, canvas.width / 2, 280 + i * 28);
    });

    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Press SPACE to Start', canvas.width / 2, 530);
}

function renderGame() {
    const camX = canvas.width / 2 - game.player.x;
    const camY = canvas.height / 2 - game.player.y;

    ctx.save();
    ctx.translate(camX, camY);

    // Render tiles with darkness
    const levelDef = LEVELS[game.currentLevel];
    for (let y = 0; y < game.level.tiles.length; y++) {
        for (let x = 0; x < game.level.tiles[y].length; x++) {
            const tile = game.level.tiles[y][x];
            const tileX = x * TILE_SIZE;
            const tileY = y * TILE_SIZE;
            const tileCenterX = tileX + TILE_SIZE / 2;
            const tileCenterY = tileY + TILE_SIZE / 2;

            // Check if in flashlight
            const visible = isInFlashlight(game.player.x, game.player.y, tileCenterX, tileCenterY, game.player.angle);
            const dist = Math.hypot(tileCenterX - game.player.x, tileCenterY - game.player.y);
            const nearPlayer = dist < 80;

            let brightness = nearPlayer ? 0.6 : (visible ? 0.8 : 0.15);

            if (tile === 1) {
                ctx.fillStyle = `rgb(${Math.floor(50 * brightness)}, ${Math.floor(50 * brightness)}, ${Math.floor(60 * brightness)})`;
            } else if (tile === 2) {
                ctx.fillStyle = game.player.hasKeycard ? `rgb(${Math.floor(50 * brightness)}, ${Math.floor(100 * brightness)}, ${Math.floor(50 * brightness)})` : `rgb(${Math.floor(100 * brightness)}, ${Math.floor(50 * brightness)}, ${Math.floor(50 * brightness)})`;
            } else if (tile === 3) {
                ctx.fillStyle = `rgb(${Math.floor(80 * brightness)}, ${Math.floor(60 * brightness)}, ${Math.floor(40 * brightness)})`;
            } else {
                // Floor - metallic industrial
                const checker = (x + y) % 2 === 0;
                const r = checker ? 25 : 30;
                const g = checker ? 25 : 30;
                const b = checker ? 30 : 35;
                ctx.fillStyle = `rgb(${Math.floor(r * brightness)}, ${Math.floor(g * brightness)}, ${Math.floor(b * brightness)})`;
            }
            ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);

            // Wall details
            if (tile === 1) {
                ctx.strokeStyle = `rgb(${Math.floor(70 * brightness)}, ${Math.floor(70 * brightness)}, ${Math.floor(80 * brightness)})`;
                ctx.lineWidth = 1;
                ctx.strokeRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
            }

            // Crate details
            if (tile === 3) {
                ctx.strokeStyle = `rgb(${Math.floor(60 * brightness)}, ${Math.floor(45 * brightness)}, ${Math.floor(30 * brightness)})`;
                ctx.lineWidth = 2;
                ctx.strokeRect(tileX + 2, tileY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            }
        }
    }

    // Keycard
    if (game.level.keycardPos && !game.level.keycardPos.collected) {
        const kc = game.level.keycardPos;
        const kcVisible = isInFlashlight(game.player.x, game.player.y, kc.x, kc.y, game.player.angle);
        if (kcVisible || Math.hypot(kc.x - game.player.x, kc.y - game.player.y) < 80) {
            ctx.fillStyle = '#44ffff';
            ctx.fillRect(kc.x - 10, kc.y - 6, 20, 12);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(kc.x - 10, kc.y - 6, 20, 12);

            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('KEY', kc.x, kc.y + 3);
        }
    }

    // Exit
    if (game.level.exit) {
        const ex = game.level.exit;
        const exVisible = isInFlashlight(game.player.x, game.player.y, ex.x, ex.y, game.player.angle);
        if (exVisible || Math.hypot(ex.x - game.player.x, ex.y - game.player.y) < 80) {
            ctx.fillStyle = game.player.hasKeycard ? '#44ff44' : '#ff4444';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('EXIT', ex.x, ex.y - 20);

            // Glow
            const glow = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, 40);
            glow.addColorStop(0, game.player.hasKeycard ? 'rgba(68, 255, 68, 0.3)' : 'rgba(255, 68, 68, 0.3)');
            glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(ex.x, ex.y, 40, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Pickups
    game.level.pickups.forEach(pickup => {
        const visible = isInFlashlight(game.player.x, game.player.y, pickup.x, pickup.y, game.player.angle);
        const near = Math.hypot(pickup.x - game.player.x, pickup.y - game.player.y) < 80;
        if (!visible && !near) return;

        if (pickup.type === 'health') {
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(pickup.x, pickup.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(pickup.x - 5, pickup.y - 1.5, 10, 3);
            ctx.fillRect(pickup.x - 1.5, pickup.y - 5, 3, 10);
        } else if (pickup.type === 'ammo') {
            ctx.fillStyle = '#ffaa44';
            ctx.fillRect(pickup.x - 8, pickup.y - 5, 16, 10);
            ctx.fillStyle = '#cc8833';
            ctx.fillRect(pickup.x - 6, pickup.y - 7, 12, 14);
        } else if (pickup.type === 'credits') {
            ctx.fillStyle = '#ffff44';
            ctx.beginPath();
            ctx.arc(pickup.x, pickup.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#888800';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('$', pickup.x, pickup.y + 3);
        } else if (pickup.type === 'barrel') {
            ctx.fillStyle = '#884422';
            ctx.beginPath();
            ctx.arc(pickup.x, pickup.y, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#664411';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#ffaa00';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('!', pickup.x, pickup.y + 5);
        }
    });

    // Enemy bullets
    game.level.bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Enemies (only visible in flashlight or near)
    game.level.enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;

        const visible = isInFlashlight(game.player.x, game.player.y, enemy.x, enemy.y, game.player.angle);
        const near = Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y) < 100;
        if (!visible && !near) {
            // Show red eyes in darkness
            if (enemy.state === 'alert') {
                ctx.fillStyle = '#ff0000';
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#ff0000';
                ctx.beginPath();
                ctx.arc(enemy.x - 4, enemy.y - 2, 2, 0, Math.PI * 2);
                ctx.arc(enemy.x + 4, enemy.y - 2, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            return;
        }

        // Alien body (scorpion/arachnid style)
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.ellipse(enemy.x, enemy.y, enemy.size / 2, enemy.size / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const legAngle = (i / 6) * Math.PI * 2 + Date.now() / 200;
            ctx.beginPath();
            ctx.moveTo(enemy.x, enemy.y);
            ctx.lineTo(
                enemy.x + Math.cos(legAngle) * enemy.size * 0.8,
                enemy.y + Math.sin(legAngle) * enemy.size * 0.8
            );
            ctx.stroke();
        }

        // Eyes (glowing red)
        ctx.fillStyle = '#ff0000';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ff0000';
        ctx.beginPath();
        ctx.arc(enemy.x - 4, enemy.y - 2, 3, 0, Math.PI * 2);
        ctx.arc(enemy.x + 4, enemy.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Health bar
        const barWidth = enemy.size;
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = '#330000';
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size / 2 - 10, barWidth, 4);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size / 2 - 10, barWidth * hpPercent, 4);
    });

    // Boss
    if (game.boss && game.boss.hp > 0) {
        const boss = game.boss;

        // Large alien body
        ctx.fillStyle = boss.color;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Armor plates
        ctx.fillStyle = '#005500';
        for (let i = 0; i < 8; i++) {
            const plateAngle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(
                boss.x + Math.cos(plateAngle) * boss.size / 3,
                boss.y + Math.sin(plateAngle) * boss.size / 3,
                8, 0, Math.PI * 2
            );
            ctx.fill();
        }

        // Glowing eyes
        ctx.fillStyle = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0000';
        ctx.beginPath();
        ctx.arc(boss.x - 12, boss.y - 8, 6, 0, Math.PI * 2);
        ctx.arc(boss.x + 12, boss.y - 8, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Boss name
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(boss.name.toUpperCase(), boss.x, boss.y - boss.size / 2 - 20);
    }

    // Player bullets
    game.level.playerBullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.shadowBlur = bullet.flame ? 15 : 5;
        ctx.shadowColor = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.flame ? 6 : 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Particles
    game.level.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Player
    renderPlayer();

    // Flashlight cone overlay
    renderFlashlightOverlay();

    // Floating texts
    game.level.floatingTexts.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.globalAlpha = t.life / 1.5;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;

    ctx.restore();

    // HUD
    renderHUD();
}

function renderPlayer() {
    const p = game.player;

    // Invincibility flash
    if (p.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    // Body
    ctx.fillStyle = '#4488aa';
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    // Armor details
    ctx.fillStyle = '#336688';
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER_SIZE / 3, 0, Math.PI * 2);
    ctx.fill();

    // Helmet visor
    ctx.fillStyle = '#88ccff';
    const visorX = p.x + Math.cos(p.angle) * 5;
    const visorY = p.y + Math.sin(p.angle) * 5;
    ctx.beginPath();
    ctx.arc(visorX, visorY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Weapon
    const gunLen = 15;
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(p.angle) * 8, p.y + Math.sin(p.angle) * 8);
    ctx.lineTo(p.x + Math.cos(p.angle) * gunLen, p.y + Math.sin(p.angle) * gunLen);
    ctx.stroke();

    // Laser sight
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(p.angle) * gunLen, p.y + Math.sin(p.angle) * gunLen);
    ctx.lineTo(p.x + Math.cos(p.angle) * 200, p.y + Math.sin(p.angle) * 200);
    ctx.stroke();

    ctx.globalAlpha = 1;
}

function renderFlashlightOverlay() {
    const p = game.player;

    // Dark overlay with flashlight cutout
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.rect(p.x - canvas.width, p.y - canvas.height, canvas.width * 2, canvas.height * 2);

    // Cut out flashlight cone
    ctx.moveTo(p.x, p.y);
    for (let a = p.angle - FLASHLIGHT_ANGLE; a <= p.angle + FLASHLIGHT_ANGLE; a += 0.05) {
        ctx.lineTo(p.x + Math.cos(a) * FLASHLIGHT_RANGE, p.y + Math.sin(a) * FLASHLIGHT_RANGE);
    }
    ctx.lineTo(p.x, p.y);

    // Cut out immediate area
    ctx.moveTo(p.x + 80, p.y);
    ctx.arc(p.x, p.y, 80, 0, Math.PI * 2, true);

    ctx.fill('evenodd');
    ctx.restore();

    // Flashlight edge glow
    ctx.strokeStyle = 'rgba(255, 255, 200, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(p.angle - FLASHLIGHT_ANGLE) * FLASHLIGHT_RANGE, p.y + Math.sin(p.angle - FLASHLIGHT_ANGLE) * FLASHLIGHT_RANGE);
    ctx.arc(p.x, p.y, FLASHLIGHT_RANGE, p.angle - FLASHLIGHT_ANGLE, p.angle + FLASHLIGHT_ANGLE);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
}

function renderHUD() {
    // Top bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, 45);

    // Lives
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('LIVES: ' + game.player.lives, 20, 28);

    // Health bar
    ctx.fillStyle = '#333333';
    ctx.fillRect(120, 15, 150, 18);
    const hpPercent = game.player.hp / game.player.maxHp;
    ctx.fillStyle = hpPercent > 0.5 ? '#44ff44' : (hpPercent > 0.25 ? '#ffaa00' : '#ff4444');
    ctx.fillRect(120, 15, 150 * hpPercent, 18);
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.strokeRect(120, 15, 150, 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(game.player.hp + '/' + game.player.maxHp, 195, 28);

    // Credits
    ctx.fillStyle = '#ffff44';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('$' + game.player.credits, 290, 28);

    // Level name
    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Level ' + (game.currentLevel + 1) + ': ' + LEVELS[game.currentLevel].name, canvas.width / 2, 28);

    // Keycard indicator
    if (LEVELS[game.currentLevel].keycard) {
        ctx.fillStyle = game.player.hasKeycard ? '#44ffff' : '#444444';
        ctx.fillText(game.player.hasKeycard ? 'KEYCARD [OK]' : 'KEYCARD [NEEDED]', canvas.width / 2, 42);
    }

    // Bottom bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    // Weapon info
    const weaponKey = game.player.weapons[game.player.currentWeapon];
    const weapon = WEAPONS[weaponKey];
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(weapon.name, 20, canvas.height - 25);

    ctx.fillStyle = '#44aaff';
    ctx.font = '14px Arial';
    ctx.fillText(game.player.currentMag + ' | ' + game.player.ammo[weaponKey], 20, canvas.height - 8);

    // Reload indicator
    if (game.player.reloading) {
        ctx.fillStyle = '#ffaa00';
        ctx.fillText('RELOADING...', 150, canvas.height - 16);
    }

    // Weapon slots
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    game.player.weapons.forEach((w, i) => {
        ctx.fillStyle = i === game.player.currentWeapon ? '#44ff44' : '#666666';
        ctx.fillText('[' + (i + 1) + '] ' + WEAPONS[w].name, canvas.width - 20, canvas.height - 30 + i * 14);
    });

    // Boss health bar
    if (game.boss && game.boss.hp > 0) {
        const barWidth = 400;
        const barHeight = 20;
        const barX = (canvas.width - barWidth) / 2;
        const barY = 55;

        ctx.fillStyle = '#220000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        const bossHpPercent = game.boss.hp / game.boss.maxHp;
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(barX, barY, barWidth * bossHpPercent, barHeight);
        ctx.strokeStyle = '#ff6666';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(game.boss.name + ' - Phase ' + game.boss.phase, canvas.width / 2, barY + 15);
    }

    // Exit prompt
    if (game.level.exit) {
        const dist = Math.hypot(game.player.x - game.level.exit.x, game.player.y - game.level.exit.y);
        if (dist < TILE_SIZE * 3) {
            ctx.fillStyle = '#44ff44';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            if (game.level.enemies.length > 0) {
                ctx.fillStyle = '#ff4444';
                ctx.fillText('CLEAR ALL ENEMIES TO EXIT (' + game.level.enemies.length + ' remaining)', canvas.width / 2, canvas.height - 70);
            } else {
                ctx.fillText('[SPACE] Enter Exit', canvas.width / 2, canvas.height - 70);
            }
        }
    }
}

function renderLevelComplete() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL COMPLETE!', canvas.width / 2, 150);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '20px Arial';
    ctx.fillText(LEVELS[game.currentLevel].name, canvas.width / 2, 200);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.fillText('Enemies Killed: ' + game.stats.enemiesKilled, canvas.width / 2, 280);
    ctx.fillText('Credits Earned: $' + game.player.credits, canvas.width / 2, 320);

    if (game.currentLevel < LEVELS.length - 1 && LEVELS[game.currentLevel + 1].unlocks) {
        ctx.fillStyle = '#ffff44';
        ctx.fillText('NEW WEAPON UNLOCKED: ' + WEAPONS[LEVELS[game.currentLevel + 1].unlocks].name.toUpperCase(), canvas.width / 2, 380);
    }

    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Press SPACE to Continue', canvas.width / 2, 480);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, 200);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '20px Arial';
    ctx.fillText('You were overwhelmed by the alien swarm.', canvas.width / 2, 280);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.fillText('Level Reached: ' + LEVELS[game.currentLevel].name, canvas.width / 2, 340);
    ctx.fillText('Enemies Killed: ' + game.stats.enemiesKilled, canvas.width / 2, 380);

    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Press SPACE to Retry', canvas.width / 2, 480);
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#44ffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, 150);

    ctx.fillStyle = '#44ff44';
    ctx.font = '24px Arial';
    ctx.fillText('You have destroyed the Hive!', canvas.width / 2, 220);

    const timePlayed = Math.floor(game.stats.timePlayed);
    const minutes = Math.floor(timePlayed / 60);
    const seconds = timePlayed % 60;

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.fillText('Time: ' + minutes + ':' + seconds.toString().padStart(2, '0'), canvas.width / 2, 300);
    ctx.fillText('Enemies Killed: ' + game.stats.enemiesKilled, canvas.width / 2, 340);
    ctx.fillText('Total Credits: $' + game.player.credits, canvas.width / 2, 380);

    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Press SPACE to Play Again', canvas.width / 2, 500);
}

function renderDebug() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 50, 200, 260);

    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    const p = game.player;
    const info = [
        '=== DEBUG (Q toggle) ===',
        'Level: ' + (game.currentLevel + 1) + '/' + LEVELS.length,
        'Player X: ' + Math.floor(p.x),
        'Player Y: ' + Math.floor(p.y),
        'HP: ' + p.hp + '/' + p.maxHp,
        'Lives: ' + p.lives,
        'Weapon: ' + WEAPONS[p.weapons[p.currentWeapon]].name,
        'Mag: ' + p.currentMag,
        'Reloading: ' + p.reloading,
        'Enemies: ' + game.level.enemies.length,
        'Bullets: ' + game.level.bullets.length,
        'Player Bullets: ' + game.level.playerBullets.length,
        'Has Keycard: ' + p.hasKeycard,
        'Boss HP: ' + (game.boss ? game.boss.hp : 'N/A'),
        'FPS: ~60'
    ];

    info.forEach((text, i) => {
        ctx.fillText(text, 20, 68 + i * 16);
    });
}

// Start
init();
