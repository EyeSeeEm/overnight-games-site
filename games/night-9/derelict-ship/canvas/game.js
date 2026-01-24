// Derelict - Survival Horror Game
// Canvas 2D Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const TILE_SIZE = 32;
const PLAYER_SIZE = 32;
const VISION_CONE_ANGLE = Math.PI / 2; // 90 degrees
const VISION_RANGE = 300;

// Game state
const GameState = {
    MENU: 'menu',
    IN_SHIP: 'in_ship',
    SPACE: 'space',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

// Ship definitions
const SHIPS = [
    { name: 'Tutorial Ship', rooms: 5, enemies: ['crawler', 'crawler', 'crawler'], items: ['pipe', 'pistol', 'o2_small', 'o2_small', 'o2_small'], theme: '#2a1a1a' },
    { name: 'Derelict Alpha', rooms: 7, enemies: ['shambler', 'shambler', 'shambler', 'crawler', 'crawler'], items: ['shotgun', 'medkit_large', 'o2_large', 'o2_small', 'o2_small'], theme: '#1a1a2a' },
    { name: 'Final Vessel', rooms: 9, enemies: ['stalker', 'stalker', 'stalker', 'shambler', 'shambler', 'shambler'], items: ['smg', 'o2_large', 'o2_large', 'medkit_large', 'medkit_small'], hasBoss: true, theme: '#1a2a1a' }
];

// Enemy definitions
const ENEMY_TYPES = {
    crawler: { hp: 30, damage: 15, speed: 80, attackRate: 1.2, detectionRange: 250, color: '#4a3a2a', size: 28, name: 'Crawler' },
    shambler: { hp: 60, damage: 25, speed: 50, attackRate: 2.0, detectionRange: 200, color: '#3a4a3a', size: 32, name: 'Shambler' },
    stalker: { hp: 45, damage: 20, speed: 150, attackRate: 0.8, detectionRange: 350, color: '#2a2a4a', size: 30, name: 'Stalker' },
    boss: { hp: 150, damage: 35, speed: 80, attackRate: 1.5, detectionRange: 500, color: '#5a2a2a', size: 64, name: 'Ship Boss' }
};

// Weapon definitions
const WEAPONS = {
    pipe: { damage: 20, fireRate: 1.0, range: 50, ammoType: null, magSize: Infinity, melee: true, name: 'Pipe' },
    pistol: { damage: 25, fireRate: 0.5, range: 400, ammoType: '9mm', magSize: 12, melee: false, name: 'Pistol' },
    shotgun: { damage: 40, fireRate: 1.0, range: 250, ammoType: 'shells', magSize: 6, melee: false, spread: 5, name: 'Shotgun' },
    smg: { damage: 15, fireRate: 0.15, range: 350, ammoType: '9mm', magSize: 30, melee: false, name: 'SMG' }
};

// Game object
const game = {
    state: GameState.MENU,
    currentShipIndex: 0,
    debugMode: false,

    // Player state
    player: {
        x: 400, y: 300,
        angle: 0,
        hp: 100, maxHp: 100,
        o2: 100, maxO2: 100,
        speed: 120, runSpeed: 200,
        isRunning: false,
        weapon: 'pipe',
        ammo: { '9mm': 30, 'shells': 12 },
        currentMag: 12,
        inventory: [],
        invincibleTimer: 0,
        attackCooldown: 0,
        flashlight: true,
        flashlightBattery: 60,
        keys: []
    },

    // Current ship data
    ship: {
        rooms: [],
        doors: [],
        enemies: [],
        items: [],
        bullets: [],
        particles: [],
        floatingTexts: []
    },

    // Space mode data
    space: {
        playerShip: { x: 640, y: 360, angle: 0, speed: 0 },
        derelicts: [],
        stars: []
    },

    // O2 drain timers
    o2Timer: 0,
    o2DrainRate: 2000, // ms per O2 drain when idle

    // Stats
    stats: {
        enemiesKilled: 0,
        roomsExplored: 0,
        itemsUsed: 0,
        damageTaken: 0,
        timeStarted: 0
    },

    // Input
    keys: {},
    mouse: { x: 0, y: 0, down: false }
};

// Initialize game
function init() {
    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Start game loop
    game.stats.timeStarted = Date.now();
    requestAnimationFrame(gameLoop);
}

// Input handlers
function handleKeyDown(e) {
    game.keys[e.key.toLowerCase()] = true;

    if (e.key.toLowerCase() === 'q') {
        game.debugMode = !game.debugMode;
    }

    if (game.state === GameState.MENU && (e.key === ' ' || e.key === 'Enter')) {
        startGame();
    }

    if (game.state === GameState.IN_SHIP) {
        if (e.key.toLowerCase() === 'e') {
            interactWithDoor();
        }
        if (e.key.toLowerCase() === 'r') {
            reloadWeapon();
        }
        if (e.key.toLowerCase() === 'f') {
            game.player.flashlight = !game.player.flashlight;
        }
        if (e.key >= '1' && e.key <= '6') {
            useInventorySlot(parseInt(e.key) - 1);
        }
    }

    if (game.state === GameState.GAME_OVER || game.state === GameState.VICTORY) {
        if (e.key === ' ' || e.key === 'Enter') {
            resetGame();
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
    if (e.button === 0) {
        game.mouse.down = true;
        if (game.state === GameState.IN_SHIP) {
            attack();
        }
    }
}

function handleMouseUp(e) {
    if (e.button === 0) {
        game.mouse.down = false;
    }
}

// Game start
function startGame() {
    game.state = GameState.IN_SHIP;
    game.currentShipIndex = 0;
    generateShip(SHIPS[0]);
}

function resetGame() {
    game.state = GameState.MENU;
    game.currentShipIndex = 0;
    game.player.hp = 100;
    game.player.o2 = 100;
    game.player.weapon = 'pipe';
    game.player.ammo = { '9mm': 30, 'shells': 12 };
    game.player.inventory = [];
    game.stats = {
        enemiesKilled: 0,
        roomsExplored: 0,
        itemsUsed: 0,
        damageTaken: 0,
        timeStarted: Date.now()
    };
}

// Ship generation
function generateShip(shipDef) {
    game.ship = {
        rooms: [],
        corridors: [],
        doors: [],
        enemies: [],
        items: [],
        bullets: [],
        particles: [],
        floatingTexts: []
    };

    // Generate rooms with proper corridors between them
    const numRooms = shipDef.rooms;
    let x = 150;
    let y = 250;

    for (let i = 0; i < numRooms; i++) {
        const isLarge = i === numRooms - 1 || Math.random() < 0.25;
        const roomW = isLarge ? 10 : (6 + Math.floor(Math.random() * 2));
        const roomH = isLarge ? 8 : (5 + Math.floor(Math.random() * 2));

        const room = {
            x: x,
            y: y,
            width: roomW * TILE_SIZE,
            height: roomH * TILE_SIZE,
            explored: i === 0,
            type: i === 0 ? 'start' : (i === numRooms - 1 ? 'exit' : 'normal'),
            lifeSupport: i === Math.floor(numRooms / 2),
            name: getRoomName(i, numRooms)
        };

        game.ship.rooms.push(room);

        // Add corridor and door to next room
        if (i < numRooms - 1) {
            const corridorLen = 80 + Math.floor(Math.random() * 40);
            const corridorY = y + roomH * TILE_SIZE / 2 - 24;

            // Corridor connecting rooms
            game.ship.corridors.push({
                x: x + roomW * TILE_SIZE,
                y: corridorY,
                width: corridorLen,
                height: 48
            });

            // Door at start of corridor
            game.ship.doors.push({
                x: x + roomW * TILE_SIZE - 8,
                y: corridorY,
                width: 16,
                height: 48,
                open: false,
                connectsRoom: i + 1,
                horizontal: true
            });

            const nextX = x + roomW * TILE_SIZE + corridorLen;
            const nextY = 180 + Math.floor(Math.random() * 180);

            // Add vertical corridor section if Y changes significantly
            if (Math.abs(nextY - y) > 50) {
                const vertX = nextX - 24;
                const vertY = Math.min(corridorY + 24, nextY + roomH * TILE_SIZE / 2 - 24);
                const vertH = Math.abs((corridorY + 24) - (nextY + roomH * TILE_SIZE / 2 - 24)) + 48;
                game.ship.corridors.push({
                    x: vertX,
                    y: vertY,
                    width: 48,
                    height: vertH
                });
            }

            x = nextX;
            y = nextY;
        }
    }

    function getRoomName(index, total) {
        if (index === 0) return 'AWAKENING BAY';
        if (index === total - 1) return 'ESCAPE POD BAY';
        const names = ['CARGO HOLD', 'MEDICAL BAY', 'CREW QUARTERS', 'ENGINE ROOM', 'STORAGE', 'MAINTENANCE', 'BRIDGE ACCESS', 'ARMORY'];
        return names[index % names.length];
    }

    // Add escape pod in final room
    const lastRoom = game.ship.rooms[game.ship.rooms.length - 1];
    game.ship.escapePod = {
        x: lastRoom.x + lastRoom.width - 80,
        y: lastRoom.y + lastRoom.height / 2 - 30,
        width: 60,
        height: 60
    };

    // Place player in first room
    const firstRoom = game.ship.rooms[0];
    game.player.x = firstRoom.x + 64;
    game.player.y = firstRoom.y + firstRoom.height / 2;

    // Spawn enemies
    shipDef.enemies.forEach((type, idx) => {
        const roomIdx = Math.min(1 + idx % (numRooms - 1), numRooms - 1);
        const room = game.ship.rooms[roomIdx];
        const enemy = createEnemy(type,
            room.x + 64 + Math.random() * (room.width - 128),
            room.y + 64 + Math.random() * (room.height - 128)
        );
        game.ship.enemies.push(enemy);
    });

    // Add boss to final ship
    if (shipDef.hasBoss) {
        const bossRoom = game.ship.rooms[game.ship.rooms.length - 1];
        const boss = createEnemy('boss',
            bossRoom.x + bossRoom.width / 2,
            bossRoom.y + bossRoom.height / 2
        );
        game.ship.enemies.push(boss);
    }

    // Spawn items
    shipDef.items.forEach((type, idx) => {
        const roomIdx = Math.min(idx % numRooms, numRooms - 1);
        const room = game.ship.rooms[roomIdx];
        game.ship.items.push({
            type: type,
            x: room.x + 48 + Math.random() * (room.width - 96),
            y: room.y + 48 + Math.random() * (room.height - 96),
            collected: false
        });
    });
}

function createEnemy(type, x, y) {
    const def = ENEMY_TYPES[type];
    return {
        type: type,
        x: x,
        y: y,
        hp: def.hp,
        maxHp: def.hp,
        damage: def.damage,
        speed: def.speed,
        attackRate: def.attackRate,
        attackCooldown: 0,
        detectionRange: def.detectionRange,
        color: def.color,
        size: def.size,
        name: def.name,
        state: 'patrol',
        patrolTarget: { x: x, y: y },
        aggroTimer: 0,
        spawnedAdds: false
    };
}

// Space mode
function initSpaceMode() {
    game.state = GameState.SPACE;
    game.space.playerShip = { x: 200, y: 360, angle: 0, speed: 0 };
    game.space.derelicts = [];
    game.space.stars = [];

    // Generate stars
    for (let i = 0; i < 200; i++) {
        game.space.stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            brightness: Math.random()
        });
    }

    // Generate derelict ships to dock with
    const nextShipIdx = game.currentShipIndex + 1;
    if (nextShipIdx < SHIPS.length) {
        game.space.derelicts.push({
            x: 900,
            y: 300 + Math.random() * 200,
            size: 120,
            shipIndex: nextShipIdx,
            name: SHIPS[nextShipIdx].name
        });
    }

    // Add some other derelicts for atmosphere
    for (let i = 0; i < 3; i++) {
        game.space.derelicts.push({
            x: 400 + Math.random() * 600,
            y: 100 + Math.random() * 500,
            size: 60 + Math.random() * 40,
            shipIndex: -1, // Can't dock
            name: 'Destroyed Vessel'
        });
    }
}

// Main game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

// Update game state
function update(dt) {
    if (game.state === GameState.IN_SHIP) {
        updateInShip(dt);
    } else if (game.state === GameState.SPACE) {
        updateSpace(dt);
    }
}

function updateInShip(dt) {
    // Update player angle to face mouse
    const dx = game.mouse.x - canvas.width / 2;
    const dy = game.mouse.y - canvas.height / 2;
    game.player.angle = Math.atan2(dy, dx);

    // Player movement
    let moveX = 0, moveY = 0;
    if (game.keys['w']) moveY -= 1;
    if (game.keys['s']) moveY += 1;
    if (game.keys['a']) moveX -= 1;
    if (game.keys['d']) moveX += 1;

    game.player.isRunning = game.keys['shift'];
    const speed = game.player.isRunning ? game.player.runSpeed : game.player.speed;

    if (moveX !== 0 || moveY !== 0) {
        const len = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= len;
        moveY /= len;

        const newX = game.player.x + moveX * speed * dt;
        const newY = game.player.y + moveY * speed * dt;

        // Collision with walls
        if (!collidesWithWalls(newX, game.player.y, PLAYER_SIZE)) {
            game.player.x = newX;
        }
        if (!collidesWithWalls(game.player.x, newY, PLAYER_SIZE)) {
            game.player.y = newY;
        }
    }

    // O2 drain
    game.o2Timer += dt * 1000;
    let drainRate = game.player.isRunning ? 750 : ((moveX !== 0 || moveY !== 0) ? 1500 : 2000);

    // Life support room restores O2
    const currentRoom = getCurrentRoom();
    if (currentRoom && currentRoom.lifeSupport) {
        game.player.o2 = Math.min(game.player.maxO2, game.player.o2 + 5 * dt);
    } else if (game.o2Timer >= drainRate) {
        game.o2Timer = 0;
        game.player.o2 = Math.max(0, game.player.o2 - 1);
    }

    // Check O2 death
    if (game.player.o2 <= 0) {
        game.state = GameState.GAME_OVER;
    }

    // Update attack cooldown
    if (game.player.attackCooldown > 0) {
        game.player.attackCooldown -= dt;
    }

    // Update invincibility
    if (game.player.invincibleTimer > 0) {
        game.player.invincibleTimer -= dt;
    }

    // Continuous fire for ranged weapons
    if (game.mouse.down && !WEAPONS[game.player.weapon].melee && game.player.attackCooldown <= 0) {
        attack();
    }

    // Update enemies
    updateEnemies(dt);

    // Update bullets
    updateBullets(dt);

    // Update particles
    updateParticles(dt);

    // Update floating texts
    updateFloatingTexts(dt);

    // Check item pickups
    checkItemPickups();

    // Check escape pod
    checkEscapePod();

    // Update room exploration
    if (currentRoom && !currentRoom.explored) {
        currentRoom.explored = true;
        game.stats.roomsExplored++;
    }

    // Flashlight battery
    if (game.player.flashlight) {
        game.player.flashlightBattery = Math.max(0, game.player.flashlightBattery - dt);
    } else {
        game.player.flashlightBattery = Math.min(60, game.player.flashlightBattery + dt * 0.5);
    }
}

function updateSpace(dt) {
    const ship = game.space.playerShip;

    // Rotate ship
    if (game.keys['a']) ship.angle -= 2 * dt;
    if (game.keys['d']) ship.angle += 2 * dt;

    // Thrust
    if (game.keys['w']) {
        ship.speed = Math.min(200, ship.speed + 100 * dt);
    } else {
        ship.speed = Math.max(0, ship.speed - 50 * dt);
    }

    // Move ship
    ship.x += Math.cos(ship.angle) * ship.speed * dt;
    ship.y += Math.sin(ship.angle) * ship.speed * dt;

    // Wrap around screen
    if (ship.x < -50) ship.x = canvas.width + 50;
    if (ship.x > canvas.width + 50) ship.x = -50;
    if (ship.y < -50) ship.y = canvas.height + 50;
    if (ship.y > canvas.height + 50) ship.y = -50;

    // O2 drain in space (slower)
    game.o2Timer += dt * 1000;
    if (game.o2Timer >= 3000) {
        game.o2Timer = 0;
        game.player.o2 = Math.max(0, game.player.o2 - 1);
    }

    if (game.player.o2 <= 0) {
        game.state = GameState.GAME_OVER;
    }

    // Check docking with derelicts
    game.space.derelicts.forEach(derelict => {
        if (derelict.shipIndex >= 0) {
            const dist = Math.hypot(ship.x - derelict.x, ship.y - derelict.y);
            if (dist < derelict.size + 30) {
                // Dock with this ship
                game.currentShipIndex = derelict.shipIndex;
                game.state = GameState.IN_SHIP;
                generateShip(SHIPS[game.currentShipIndex]);
            }
        }
    });

    // Parallax stars
    game.space.stars.forEach(star => {
        star.x -= ship.speed * 0.1 * Math.cos(ship.angle) * dt;
        star.y -= ship.speed * 0.1 * Math.sin(ship.angle) * dt;
        if (star.x < 0) star.x += canvas.width;
        if (star.x > canvas.width) star.x -= canvas.width;
        if (star.y < 0) star.y += canvas.height;
        if (star.y > canvas.height) star.y -= canvas.height;
    });
}

function updateEnemies(dt) {
    game.ship.enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;

        const distToPlayer = Math.hypot(game.player.x - enemy.x, game.player.y - enemy.y);

        // Check if player is in detection range
        if (distToPlayer < enemy.detectionRange) {
            enemy.state = 'chase';
            enemy.aggroTimer = 5;
        } else if (enemy.aggroTimer > 0) {
            enemy.aggroTimer -= dt;
            if (enemy.aggroTimer <= 0) {
                enemy.state = 'patrol';
            }
        }

        // Movement
        if (enemy.state === 'chase') {
            const angle = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
            const newX = enemy.x + Math.cos(angle) * enemy.speed * dt;
            const newY = enemy.y + Math.sin(angle) * enemy.speed * dt;

            if (!collidesWithWalls(newX, enemy.y, enemy.size)) {
                enemy.x = newX;
            }
            if (!collidesWithWalls(enemy.x, newY, enemy.size)) {
                enemy.y = newY;
            }
        } else {
            // Patrol behavior
            const distToTarget = Math.hypot(enemy.patrolTarget.x - enemy.x, enemy.patrolTarget.y - enemy.y);
            if (distToTarget < 10) {
                // Pick new patrol target
                const room = findEnemyRoom(enemy);
                if (room) {
                    enemy.patrolTarget = {
                        x: room.x + 48 + Math.random() * (room.width - 96),
                        y: room.y + 48 + Math.random() * (room.height - 96)
                    };
                }
            } else {
                const angle = Math.atan2(enemy.patrolTarget.y - enemy.y, enemy.patrolTarget.x - enemy.x);
                enemy.x += Math.cos(angle) * enemy.speed * 0.3 * dt;
                enemy.y += Math.sin(angle) * enemy.speed * 0.3 * dt;
            }
        }

        // Attack player
        if (enemy.attackCooldown > 0) {
            enemy.attackCooldown -= dt;
        }

        if (distToPlayer < enemy.size + PLAYER_SIZE / 2 && enemy.attackCooldown <= 0) {
            if (game.player.invincibleTimer <= 0) {
                game.player.hp -= enemy.damage;
                game.stats.damageTaken += enemy.damage;
                game.player.invincibleTimer = 1.0;

                // Screen shake effect
                addParticle(game.player.x, game.player.y, 'damage');
                addFloatingText(game.player.x, game.player.y - 20, `-${enemy.damage}`, '#ff4444');
            }
            enemy.attackCooldown = enemy.attackRate;
        }

        // Boss spawns crawlers at 50% HP
        if (enemy.type === 'boss' && enemy.hp <= enemy.maxHp / 2 && !enemy.spawnedAdds) {
            enemy.spawnedAdds = true;
            for (let i = 0; i < 2; i++) {
                const crawler = createEnemy('crawler',
                    enemy.x + (Math.random() - 0.5) * 100,
                    enemy.y + (Math.random() - 0.5) * 100
                );
                crawler.state = 'chase';
                game.ship.enemies.push(crawler);
            }
            addFloatingText(enemy.x, enemy.y - 40, 'SPAWNING ADDS!', '#ff8800');
        }

        // Check HP death
        if (game.player.hp <= 0) {
            game.state = GameState.GAME_OVER;
        }
    });

    // Remove dead enemies
    game.ship.enemies = game.ship.enemies.filter(e => e.hp > 0);
}

function updateBullets(dt) {
    game.ship.bullets.forEach(bullet => {
        bullet.x += Math.cos(bullet.angle) * bullet.speed * dt;
        bullet.y += Math.sin(bullet.angle) * bullet.speed * dt;
        bullet.life -= dt;

        // Check wall collision
        if (collidesWithWalls(bullet.x, bullet.y, 4)) {
            bullet.life = 0;
            addParticle(bullet.x, bullet.y, 'spark');
        }

        // Check enemy collision
        game.ship.enemies.forEach(enemy => {
            if (enemy.hp > 0) {
                const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
                if (dist < enemy.size / 2 + 4) {
                    enemy.hp -= bullet.damage;
                    bullet.life = 0;

                    addParticle(bullet.x, bullet.y, 'blood');
                    addFloatingText(enemy.x, enemy.y - 20, `-${bullet.damage}`, '#ffff00');

                    // Knockback (except boss)
                    if (enemy.type !== 'boss') {
                        const knockAngle = Math.atan2(enemy.y - game.player.y, enemy.x - game.player.x);
                        enemy.x += Math.cos(knockAngle) * 20;
                        enemy.y += Math.sin(knockAngle) * 20;
                    }

                    if (enemy.hp <= 0) {
                        game.stats.enemiesKilled++;
                        addFloatingText(enemy.x, enemy.y, `${enemy.name} KILLED!`, '#00ff00');

                        // Drop items
                        if (Math.random() < 0.5) {
                            game.ship.items.push({
                                type: Math.random() < 0.7 ? 'o2_small' : 'medkit_small',
                                x: enemy.x,
                                y: enemy.y,
                                collected: false
                            });
                        }
                    }
                }
            }
        });
    });

    // Remove dead bullets
    game.ship.bullets = game.ship.bullets.filter(b => b.life > 0);
}

function updateParticles(dt) {
    game.ship.particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        p.vy += 100 * dt; // Gravity
    });

    game.ship.particles = game.ship.particles.filter(p => p.life > 0);
}

function updateFloatingTexts(dt) {
    game.ship.floatingTexts.forEach(t => {
        t.y -= 30 * dt;
        t.life -= dt;
    });

    game.ship.floatingTexts = game.ship.floatingTexts.filter(t => t.life > 0);
}

function checkItemPickups() {
    game.ship.items.forEach(item => {
        if (item.collected) return;

        const dist = Math.hypot(game.player.x - item.x, game.player.y - item.y);
        if (dist < PLAYER_SIZE) {
            item.collected = true;

            switch (item.type) {
                case 'o2_small':
                    game.player.o2 = Math.min(game.player.maxO2, game.player.o2 + 25);
                    addFloatingText(item.x, item.y, '+25 O2', '#44aaff');
                    break;
                case 'o2_large':
                    game.player.o2 = Math.min(game.player.maxO2, game.player.o2 + 50);
                    addFloatingText(item.x, item.y, '+50 O2', '#44aaff');
                    break;
                case 'medkit_small':
                    game.player.hp = Math.min(game.player.maxHp, game.player.hp + 30);
                    addFloatingText(item.x, item.y, '+30 HP', '#44ff44');
                    break;
                case 'medkit_large':
                    game.player.hp = Math.min(game.player.maxHp, game.player.hp + 60);
                    addFloatingText(item.x, item.y, '+60 HP', '#44ff44');
                    break;
                case 'pipe':
                case 'pistol':
                case 'shotgun':
                case 'smg':
                    game.player.weapon = item.type;
                    addFloatingText(item.x, item.y, `GOT ${WEAPONS[item.type].name.toUpperCase()}!`, '#ffff00');
                    if (item.type === 'pistol') game.player.currentMag = 12;
                    if (item.type === 'shotgun') game.player.currentMag = 6;
                    if (item.type === 'smg') game.player.currentMag = 30;
                    break;
                case '9mm':
                    game.player.ammo['9mm'] = Math.min(60, game.player.ammo['9mm'] + 12);
                    addFloatingText(item.x, item.y, '+12 9mm', '#ffaa00');
                    break;
                case 'shells':
                    game.player.ammo['shells'] = Math.min(30, game.player.ammo['shells'] + 6);
                    addFloatingText(item.x, item.y, '+6 Shells', '#ffaa00');
                    break;
            }

            game.stats.itemsUsed++;
        }
    });

    game.ship.items = game.ship.items.filter(i => !i.collected);
}

function checkEscapePod() {
    if (!game.ship.escapePod) return;

    const pod = game.ship.escapePod;
    const dist = Math.hypot(game.player.x - (pod.x + pod.width/2), game.player.y - (pod.y + pod.height/2));

    if (dist < 60) {
        // Check if all enemies in this ship are dead for final ship
        const enemies = game.ship.enemies.filter(e => e.hp > 0);
        if (game.currentShipIndex === SHIPS.length - 1) {
            if (enemies.length === 0) {
                game.state = GameState.VICTORY;
            }
        } else {
            // Go to space mode
            initSpaceMode();
        }
    }
}

// Combat
function attack() {
    const weapon = WEAPONS[game.player.weapon];

    if (game.player.attackCooldown > 0) return;

    game.player.attackCooldown = weapon.fireRate;
    game.player.o2 = Math.max(0, game.player.o2 - 2); // Combat drain

    if (weapon.melee) {
        // Melee attack
        game.ship.enemies.forEach(enemy => {
            if (enemy.hp <= 0) return;

            const dist = Math.hypot(game.player.x - enemy.x, game.player.y - enemy.y);
            const angleToEnemy = Math.atan2(enemy.y - game.player.y, enemy.x - game.player.x);
            const angleDiff = Math.abs(normalizeAngle(angleToEnemy - game.player.angle));

            if (dist < weapon.range + enemy.size && angleDiff < Math.PI / 3) {
                enemy.hp -= weapon.damage;
                addParticle(enemy.x, enemy.y, 'blood');
                addFloatingText(enemy.x, enemy.y - 20, `-${weapon.damage}`, '#ffff00');

                if (enemy.hp <= 0) {
                    game.stats.enemiesKilled++;
                    addFloatingText(enemy.x, enemy.y, `${enemy.name} KILLED!`, '#00ff00');
                }
            }
        });

        // Swing effect
        addParticle(
            game.player.x + Math.cos(game.player.angle) * 30,
            game.player.y + Math.sin(game.player.angle) * 30,
            'swing'
        );
    } else {
        // Ranged attack
        if (game.player.currentMag <= 0) {
            addFloatingText(game.player.x, game.player.y - 30, 'RELOAD!', '#ff4444');
            return;
        }

        game.player.currentMag--;

        const spread = weapon.spread || 0;
        const bulletCount = weapon.spread ? 5 : 1;

        for (let i = 0; i < bulletCount; i++) {
            const angle = game.player.angle + (spread ? (Math.random() - 0.5) * 0.3 : 0);
            game.ship.bullets.push({
                x: game.player.x + Math.cos(game.player.angle) * 20,
                y: game.player.y + Math.sin(game.player.angle) * 20,
                angle: angle,
                speed: 600,
                damage: weapon.damage / bulletCount,
                life: weapon.range / 600
            });
        }

        // Muzzle flash
        addParticle(
            game.player.x + Math.cos(game.player.angle) * 25,
            game.player.y + Math.sin(game.player.angle) * 25,
            'muzzle'
        );
    }
}

function reloadWeapon() {
    const weapon = WEAPONS[game.player.weapon];
    if (weapon.melee) return;

    const ammoType = weapon.ammoType;
    const needed = weapon.magSize - game.player.currentMag;
    const available = game.player.ammo[ammoType];
    const reload = Math.min(needed, available);

    game.player.ammo[ammoType] -= reload;
    game.player.currentMag += reload;

    addFloatingText(game.player.x, game.player.y - 30, 'RELOADED', '#44ff44');
}

function interactWithDoor() {
    game.ship.doors.forEach(door => {
        const dist = Math.hypot(game.player.x - (door.x + door.width/2), game.player.y - (door.y + door.height/2));
        if (dist < 80) {
            door.open = !door.open;
        }
    });
}

function useInventorySlot(slot) {
    // Quick use items from inventory
    if (game.player.inventory[slot]) {
        const item = game.player.inventory[slot];
        // Use item logic here
        game.player.inventory.splice(slot, 1);
    }
}

// Helpers
function collidesWithWalls(x, y, size) {
    const halfSize = size / 2;

    // Check if inside any room
    let insideRoom = false;
    for (const room of game.ship.rooms) {
        if (x - halfSize >= room.x && x + halfSize <= room.x + room.width &&
            y - halfSize >= room.y && y + halfSize <= room.y + room.height) {
            insideRoom = true;
            break;
        }
    }

    // Check if inside any corridor
    if (!insideRoom && game.ship.corridors) {
        for (const corridor of game.ship.corridors) {
            if (x - halfSize >= corridor.x && x + halfSize <= corridor.x + corridor.width &&
                y - halfSize >= corridor.y && y + halfSize <= corridor.y + corridor.height) {
                insideRoom = true;
                break;
            }
        }
    }

    // Check if inside any open door
    for (const door of game.ship.doors) {
        if (door.open) {
            if (x - halfSize >= door.x && x + halfSize <= door.x + door.width &&
                y - halfSize >= door.y && y + halfSize <= door.y + door.height) {
                insideRoom = true;
                break;
            }
        }
    }

    return !insideRoom;
}

function getCurrentRoom() {
    for (const room of game.ship.rooms) {
        if (game.player.x >= room.x && game.player.x <= room.x + room.width &&
            game.player.y >= room.y && game.player.y <= room.y + room.height) {
            return room;
        }
    }
    return null;
}

function findEnemyRoom(enemy) {
    for (const room of game.ship.rooms) {
        if (enemy.x >= room.x && enemy.x <= room.x + room.width &&
            enemy.y >= room.y && enemy.y <= room.y + room.height) {
            return room;
        }
    }
    return game.ship.rooms[0];
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function addParticle(x, y, type) {
    const count = type === 'blood' ? 8 : (type === 'spark' ? 5 : 3);
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 100;
        game.ship.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.3 + Math.random() * 0.3,
            type: type,
            color: type === 'blood' ? '#8a2020' : (type === 'muzzle' ? '#ffff44' : '#888888')
        });
    }
}

function addFloatingText(x, y, text, color) {
    game.ship.floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        life: 1.5
    });
}

function isInVisionCone(px, py, tx, ty, playerAngle) {
    const angleToTarget = Math.atan2(ty - py, tx - px);
    const angleDiff = Math.abs(normalizeAngle(angleToTarget - playerAngle));
    const dist = Math.hypot(tx - px, ty - py);

    return angleDiff <= VISION_CONE_ANGLE / 2 && dist <= VISION_RANGE;
}

function raycastToPoint(px, py, tx, ty) {
    // Simple raycast - check if line of sight is blocked by walls
    const dist = Math.hypot(tx - px, ty - py);
    const steps = Math.ceil(dist / 10);
    const dx = (tx - px) / steps;
    const dy = (ty - py) / steps;

    for (let i = 0; i < steps; i++) {
        const checkX = px + dx * i;
        const checkY = py + dy * i;

        // Check if point is inside any room
        let inRoom = false;
        for (const room of game.ship.rooms) {
            if (checkX >= room.x && checkX <= room.x + room.width &&
                checkY >= room.y && checkY <= room.y + room.height) {
                inRoom = true;
                break;
            }
        }

        // Check if in corridor
        if (!inRoom && game.ship.corridors) {
            for (const corridor of game.ship.corridors) {
                if (checkX >= corridor.x && checkX <= corridor.x + corridor.width &&
                    checkY >= corridor.y && checkY <= corridor.y + corridor.height) {
                    inRoom = true;
                    break;
                }
            }
        }

        // Check if in open door
        for (const door of game.ship.doors) {
            if (door.open) {
                if (checkX >= door.x && checkX <= door.x + door.width &&
                    checkY >= door.y && checkY <= door.y + door.height) {
                    inRoom = true;
                    break;
                }
            }
        }

        if (!inRoom) return false;
    }

    return true;
}

// Rendering
function render() {
    ctx.fillStyle = '#0a0808';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === GameState.MENU) {
        renderMenu();
    } else if (game.state === GameState.IN_SHIP) {
        renderInShip();
    } else if (game.state === GameState.SPACE) {
        renderSpace();
    } else if (game.state === GameState.GAME_OVER) {
        renderGameOver();
    } else if (game.state === GameState.VICTORY) {
        renderVictory();
    }

    if (game.debugMode) {
        renderDebug();
    }
}

function renderMenu() {
    // Background
    ctx.fillStyle = '#0a0808';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#cc4444';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DERELICT', canvas.width / 2, 200);

    ctx.fillStyle = '#888888';
    ctx.font = '24px Arial';
    ctx.fillText('A Survival Horror Experience', canvas.width / 2, 250);

    // Instructions
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '18px Arial';
    const instructions = [
        'WASD - Move',
        'Mouse - Aim',
        'Left Click - Attack',
        'Shift - Run (uses more O2)',
        'E - Interact with doors',
        'R - Reload',
        'F - Toggle flashlight',
        'Q - Debug overlay'
    ];

    instructions.forEach((text, i) => {
        ctx.fillText(text, canvas.width / 2, 340 + i * 28);
    });

    // Start prompt
    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('Press SPACE or ENTER to Start', canvas.width / 2, 620);

    // Flickering effect
    if (Math.random() > 0.95) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function renderInShip() {
    // Camera offset to center on player
    const camX = canvas.width / 2 - game.player.x;
    const camY = canvas.height / 2 - game.player.y;

    ctx.save();
    ctx.translate(camX, camY);

    // Render base ambient (increased brightness per GDD feedback)
    ctx.fillStyle = '#1a1815';
    ctx.fillRect(-1000, -1000, 4000, 3000);

    // Render rooms with better visibility (GDD: increase brightness)
    game.ship.rooms.forEach(room => {
        // Floor - visible enough to see room layouts
        ctx.fillStyle = room.lifeSupport ? '#252830' : '#201c18';
        ctx.fillRect(room.x, room.y, room.width, room.height);

        // Floor tiles pattern
        ctx.strokeStyle = '#302a25';
        ctx.lineWidth = 1;
        for (let tx = room.x; tx < room.x + room.width; tx += TILE_SIZE) {
            for (let ty = room.y; ty < room.y + room.height; ty += TILE_SIZE) {
                ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);
            }
        }

        // Room label
        ctx.fillStyle = room.type === 'exit' ? '#446644' : '#555555';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(room.name || 'ROOM', room.x + room.width/2, room.y + 18);

        // Life support indicator
        if (room.lifeSupport) {
            ctx.fillStyle = '#44aa44';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('LIFE SUPPORT ACTIVE', room.x + room.width/2, room.y + room.height - 10);

            // Glowing effect
            const grad = ctx.createRadialGradient(
                room.x + room.width/2, room.y + room.height/2, 0,
                room.x + room.width/2, room.y + room.height/2, 100
            );
            grad.addColorStop(0, 'rgba(68, 170, 68, 0.2)');
            grad.addColorStop(1, 'rgba(68, 170, 68, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(room.x, room.y, room.width, room.height);
        }

        // Walls
        ctx.strokeStyle = '#3a3530';
        ctx.lineWidth = 4;
        ctx.strokeRect(room.x, room.y, room.width, room.height);
    });

    // Render corridors
    if (game.ship.corridors) {
        game.ship.corridors.forEach(corridor => {
            // Floor
            ctx.fillStyle = '#1a1815';
            ctx.fillRect(corridor.x, corridor.y, corridor.width, corridor.height);

            // Floor pattern
            ctx.strokeStyle = '#282420';
            ctx.lineWidth = 1;
            for (let tx = corridor.x; tx < corridor.x + corridor.width; tx += TILE_SIZE) {
                for (let ty = corridor.y; ty < corridor.y + corridor.height; ty += TILE_SIZE) {
                    ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);
                }
            }

            // Walls
            ctx.strokeStyle = '#3a3530';
            ctx.lineWidth = 3;
            ctx.strokeRect(corridor.x, corridor.y, corridor.width, corridor.height);

            // Warning stripes on corridor walls
            ctx.fillStyle = '#4a3a20';
            for (let i = 0; i < corridor.width; i += 20) {
                ctx.fillRect(corridor.x + i, corridor.y, 10, 3);
                ctx.fillRect(corridor.x + i, corridor.y + corridor.height - 3, 10, 3);
            }
        });
    }

    // Render doors
    game.ship.doors.forEach(door => {
        if (door.open) {
            ctx.fillStyle = '#0a0808';
        } else {
            ctx.fillStyle = '#4a4540';
        }
        ctx.fillRect(door.x, door.y, door.width, door.height);

        // Door frame
        ctx.strokeStyle = '#5a5550';
        ctx.lineWidth = 2;
        ctx.strokeRect(door.x, door.y, door.width, door.height);

        // Door indicator
        ctx.fillStyle = door.open ? '#44ff44' : '#ff4444';
        ctx.beginPath();
        ctx.arc(door.x + door.width/2, door.y + 10, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Render escape pod
    if (game.ship.escapePod) {
        const pod = game.ship.escapePod;

        // Pod base
        ctx.fillStyle = '#3a5050';
        ctx.fillRect(pod.x, pod.y, pod.width, pod.height);

        // Pod details
        ctx.fillStyle = '#4a6060';
        ctx.fillRect(pod.x + 10, pod.y + 10, pod.width - 20, pod.height - 20);

        // Glowing indicator
        ctx.fillStyle = '#44ffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ESCAPE POD', pod.x + pod.width/2, pod.y - 10);

        // Glow
        const podGrad = ctx.createRadialGradient(
            pod.x + pod.width/2, pod.y + pod.height/2, 0,
            pod.x + pod.width/2, pod.y + pod.height/2, 80
        );
        podGrad.addColorStop(0, 'rgba(68, 255, 255, 0.3)');
        podGrad.addColorStop(1, 'rgba(68, 255, 255, 0)');
        ctx.fillStyle = podGrad;
        ctx.beginPath();
        ctx.arc(pod.x + pod.width/2, pod.y + pod.height/2, 80, 0, Math.PI * 2);
        ctx.fill();
    }

    // Items - only visible in vision cone
    game.ship.items.forEach(item => {
        if (item.collected) return;

        const inCone = isInVisionCone(game.player.x, game.player.y, item.x, item.y, game.player.angle);
        const canSee = raycastToPoint(game.player.x, game.player.y, item.x, item.y);

        if (inCone && canSee) {
            let color = '#ffffff';
            let label = '';

            switch (item.type) {
                case 'o2_small':
                case 'o2_large':
                    color = '#44aaff';
                    label = 'O2';
                    break;
                case 'medkit_small':
                case 'medkit_large':
                    color = '#44ff44';
                    label = 'MED';
                    break;
                case 'pipe':
                case 'pistol':
                case 'shotgun':
                case 'smg':
                    color = '#ffaa44';
                    label = item.type.toUpperCase();
                    break;
                case '9mm':
                case 'shells':
                    color = '#ffff44';
                    label = item.type;
                    break;
            }

            // Item glow
            const itemGrad = ctx.createRadialGradient(item.x, item.y, 0, item.x, item.y, 20);
            itemGrad.addColorStop(0, color);
            itemGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = itemGrad;
            ctx.beginPath();
            ctx.arc(item.x, item.y, 20, 0, Math.PI * 2);
            ctx.fill();

            // Item icon
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.fillStyle = color;
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label, item.x, item.y + 22);
        }
    });

    // Enemies - only visible in vision cone (GDD: fix enemy visibility - MUST be clearly visible!)
    game.ship.enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;

        const inCone = isInVisionCone(game.player.x, game.player.y, enemy.x, enemy.y, game.player.angle);
        const canSee = raycastToPoint(game.player.x, game.player.y, enemy.x, enemy.y);

        if (inCone && canSee) {
            // Outer glow for visibility
            const glowGrad = ctx.createRadialGradient(enemy.x, enemy.y, 0, enemy.x, enemy.y, enemy.size);
            glowGrad.addColorStop(0, 'rgba(255, 80, 80, 0.4)');
            glowGrad.addColorStop(1, 'rgba(255, 80, 80, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
            ctx.fill();

            // Enemy body with better contrast
            ctx.fillStyle = enemy.color;
            ctx.strokeStyle = '#ff6666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Enemy details based on type
            if (enemy.type === 'crawler') {
                // Spider-like body
                ctx.fillStyle = '#5a4a3a';
                ctx.beginPath();
                ctx.ellipse(enemy.x, enemy.y, enemy.size / 2.5, enemy.size / 3.5, 0, 0, Math.PI * 2);
                ctx.fill();

                // Animated legs (8 legs)
                ctx.strokeStyle = '#7a6a5a';
                ctx.lineWidth = 3;
                for (let i = 0; i < 8; i++) {
                    const legAngle = (i / 8) * Math.PI * 2 + Date.now() / 150;
                    const legLen = enemy.size * 0.9;
                    const midX = enemy.x + Math.cos(legAngle) * enemy.size * 0.3;
                    const midY = enemy.y + Math.sin(legAngle) * enemy.size * 0.3;
                    const endX = enemy.x + Math.cos(legAngle) * legLen;
                    const endY = enemy.y + Math.sin(legAngle) * legLen;
                    ctx.beginPath();
                    ctx.moveTo(enemy.x, enemy.y);
                    ctx.quadraticCurveTo(midX, midY - 5, endX, endY);
                    ctx.stroke();
                }

                // Mandibles
                ctx.fillStyle = '#8a7a6a';
                const faceAngle = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
                ctx.beginPath();
                ctx.arc(enemy.x + Math.cos(faceAngle - 0.3) * 10, enemy.y + Math.sin(faceAngle - 0.3) * 10, 4, 0, Math.PI * 2);
                ctx.arc(enemy.x + Math.cos(faceAngle + 0.3) * 10, enemy.y + Math.sin(faceAngle + 0.3) * 10, 4, 0, Math.PI * 2);
                ctx.fill();

            } else if (enemy.type === 'shambler') {
                // Hunched humanoid body
                ctx.fillStyle = '#4a5a4a';
                ctx.beginPath();
                ctx.ellipse(enemy.x, enemy.y + 5, enemy.size / 2.5, enemy.size / 2, 0, 0, Math.PI * 2);
                ctx.fill();

                // Head
                ctx.fillStyle = '#5a6a5a';
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y - enemy.size / 3, enemy.size / 4, 0, Math.PI * 2);
                ctx.fill();

                // Arms reaching forward
                ctx.strokeStyle = '#4a5a4a';
                ctx.lineWidth = 6;
                const armAngle = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
                ctx.beginPath();
                ctx.moveTo(enemy.x - 8, enemy.y);
                ctx.lineTo(enemy.x + Math.cos(armAngle - 0.2) * 20, enemy.y + Math.sin(armAngle - 0.2) * 20);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(enemy.x + 8, enemy.y);
                ctx.lineTo(enemy.x + Math.cos(armAngle + 0.2) * 20, enemy.y + Math.sin(armAngle + 0.2) * 20);
                ctx.stroke();

                // Dripping slime
                ctx.fillStyle = '#6a8a6a';
                for (let i = 0; i < 4; i++) {
                    const dripY = enemy.y + enemy.size/2 + Math.sin(Date.now() / 200 + i) * 8 + i * 4;
                    ctx.beginPath();
                    ctx.arc(enemy.x - 8 + i * 5, dripY, 3 + Math.sin(Date.now() / 300 + i) * 1, 0, Math.PI * 2);
                    ctx.fill();
                }

            } else if (enemy.type === 'stalker') {
                // Thin elongated predator
                ctx.fillStyle = '#3a3a5a';
                const stalkAngle = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
                ctx.save();
                ctx.translate(enemy.x, enemy.y);
                ctx.rotate(stalkAngle);

                // Body
                ctx.beginPath();
                ctx.ellipse(0, 0, enemy.size / 1.5, enemy.size / 4, 0, 0, Math.PI * 2);
                ctx.fill();

                // Claws
                ctx.strokeStyle = '#5a5a7a';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(enemy.size / 2, -5);
                ctx.lineTo(enemy.size / 1.2, -10);
                ctx.moveTo(enemy.size / 2, 5);
                ctx.lineTo(enemy.size / 1.2, 10);
                ctx.stroke();

                ctx.restore();

                // Stealth shimmer effect
                if (enemy.state !== 'chase') {
                    ctx.fillStyle = `rgba(100, 100, 150, ${0.2 + Math.sin(Date.now() / 100) * 0.1})`;
                    ctx.beginPath();
                    ctx.arc(enemy.x, enemy.y, enemy.size / 2 + 5, 0, Math.PI * 2);
                    ctx.fill();
                }

            } else if (enemy.type === 'boss') {
                // Large mutated creature
                ctx.fillStyle = '#6a2a2a';
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.size / 2, 0, Math.PI * 2);
                ctx.fill();

                // Armor plates
                ctx.fillStyle = '#4a1a1a';
                for (let i = 0; i < 6; i++) {
                    const plateAngle = (i / 6) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.arc(
                        enemy.x + Math.cos(plateAngle) * enemy.size / 3,
                        enemy.y + Math.sin(plateAngle) * enemy.size / 3,
                        8, 0, Math.PI * 2
                    );
                    ctx.fill();
                }

                // Crown/crests
                ctx.fillStyle = '#aa4444';
                ctx.beginPath();
                ctx.moveTo(enemy.x - 25, enemy.y - enemy.size / 2);
                ctx.lineTo(enemy.x - 15, enemy.y - enemy.size / 2 - 25);
                ctx.lineTo(enemy.x - 5, enemy.y - enemy.size / 2);
                ctx.lineTo(enemy.x + 5, enemy.y - enemy.size / 2 - 30);
                ctx.lineTo(enemy.x + 15, enemy.y - enemy.size / 2);
                ctx.lineTo(enemy.x + 25, enemy.y - enemy.size / 2 - 25);
                ctx.lineTo(enemy.x + 30, enemy.y - enemy.size / 2);
                ctx.closePath();
                ctx.fill();

                // Glowing weak points
                const pulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
                ctx.fillStyle = `rgba(255, 100, 50, ${pulse})`;
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#ff4400';
                ctx.beginPath();
                ctx.arc(enemy.x - 15, enemy.y + 10, 8, 0, Math.PI * 2);
                ctx.arc(enemy.x + 15, enemy.y + 10, 8, 0, Math.PI * 2);
                ctx.arc(enemy.x, enemy.y - 15, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Pulsing aura
                ctx.fillStyle = `rgba(255, 50, 50, ${pulse * 0.2})`;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, enemy.size / 2 + 15, 0, Math.PI * 2);
                ctx.fill();
            }

            // Glowing eyes (all enemies)
            ctx.fillStyle = '#ff4444';
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#ff0000';
            const eyeSize = enemy.type === 'boss' ? 6 : 4;
            const eyeSpacing = enemy.type === 'boss' ? 12 : 6;
            ctx.beginPath();
            ctx.arc(enemy.x - eyeSpacing, enemy.y - (enemy.type === 'boss' ? 10 : 5), eyeSize, 0, Math.PI * 2);
            ctx.arc(enemy.x + eyeSpacing, enemy.y - (enemy.type === 'boss' ? 10 : 5), eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Health bar for all enemies (better visibility)
            const barWidth = enemy.size * 1.2;
            const barHeight = 5;
            const healthPercent = enemy.hp / enemy.maxHp;
            const barY = enemy.y - enemy.size / 2 - 15;

            // Background
            ctx.fillStyle = '#220000';
            ctx.fillRect(enemy.x - barWidth/2, barY, barWidth, barHeight);
            // Health fill
            ctx.fillStyle = healthPercent > 0.5 ? '#44ff44' : (healthPercent > 0.25 ? '#ffaa00' : '#ff4444');
            ctx.fillRect(enemy.x - barWidth/2, barY, barWidth * healthPercent, barHeight);
            // Border
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 1;
            ctx.strokeRect(enemy.x - barWidth/2, barY, barWidth, barHeight);

            // Enemy name label
            ctx.fillStyle = enemy.type === 'boss' ? '#ff4444' : '#aaaaaa';
            ctx.font = enemy.type === 'boss' ? 'bold 16px Arial' : '11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(enemy.name.toUpperCase(), enemy.x, barY - 5);
        }
    });

    // Bullets
    game.ship.bullets.forEach(bullet => {
        ctx.fillStyle = '#ffff44';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        ctx.strokeStyle = 'rgba(255, 255, 68, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bullet.x, bullet.y);
        ctx.lineTo(
            bullet.x - Math.cos(bullet.angle) * 15,
            bullet.y - Math.sin(bullet.angle) * 15
        );
        ctx.stroke();
    });

    // Particles
    game.ship.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Player
    renderPlayer();

    // Vision cone overlay (darkness outside cone)
    renderVisionOverlay();

    // Floating texts
    game.ship.floatingTexts.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.globalAlpha = t.life / 1.5;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;

    ctx.restore();

    // HUD (screen space)
    renderHUD();
}

function renderPlayer() {
    const p = game.player;

    // Player body (space suit)
    ctx.fillStyle = '#44aa44';
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    // Suit details
    ctx.fillStyle = '#338833';
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER_SIZE / 3, 0, Math.PI * 2);
    ctx.fill();

    // Helmet visor
    ctx.fillStyle = '#ffcc00';
    const visorX = p.x + Math.cos(p.angle) * 5;
    const visorY = p.y + Math.sin(p.angle) * 5;
    ctx.beginPath();
    ctx.arc(visorX, visorY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Visor reflection
    ctx.fillStyle = '#ffffaa';
    ctx.beginPath();
    ctx.arc(visorX - 2, visorY - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Weapon
    const weaponX = p.x + Math.cos(p.angle) * 18;
    const weaponY = p.y + Math.sin(p.angle) * 18;

    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(p.angle) * 10, p.y + Math.sin(p.angle) * 10);
    ctx.lineTo(weaponX, weaponY);
    ctx.stroke();

    // Invincibility flash
    if (p.invincibleTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, PLAYER_SIZE / 2 + 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Flashlight beam
    if (p.flashlight && p.flashlightBattery > 0) {
        const beamGrad = ctx.createRadialGradient(
            p.x + Math.cos(p.angle) * 50, p.y + Math.sin(p.angle) * 50, 0,
            p.x + Math.cos(p.angle) * 50, p.y + Math.sin(p.angle) * 50, 150
        );
        beamGrad.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
        beamGrad.addColorStop(1, 'rgba(255, 255, 200, 0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.arc(p.x, p.y, 200, p.angle - 0.3, p.angle + 0.3);
        ctx.closePath();
        ctx.fill();
    }
}

function renderVisionOverlay() {
    const p = game.player;

    // Create darkness overlay with vision cone cut out
    ctx.save();

    // Draw black overlay for entire visible area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.rect(p.x - canvas.width, p.y - canvas.height, canvas.width * 2, canvas.height * 2);

    // Cut out vision cone (counter-clockwise to subtract)
    ctx.moveTo(p.x, p.y);
    const startAngle = p.angle - VISION_CONE_ANGLE / 2;
    const endAngle = p.angle + VISION_CONE_ANGLE / 2;

    // Draw arc counter-clockwise to create a "hole"
    for (let a = endAngle; a >= startAngle; a -= 0.05) {
        ctx.lineTo(
            p.x + Math.cos(a) * VISION_RANGE,
            p.y + Math.sin(a) * VISION_RANGE
        );
    }
    ctx.closePath();

    ctx.fill('evenodd');
    ctx.restore();

    // Vision cone edge glow
    ctx.strokeStyle = 'rgba(100, 150, 100, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(
        p.x + Math.cos(startAngle) * VISION_RANGE,
        p.y + Math.sin(startAngle) * VISION_RANGE
    );
    ctx.arc(p.x, p.y, VISION_RANGE, startAngle, endAngle);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
}

function renderHUD() {
    const p = game.player;

    // Top bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, 50);

    // O2 bar
    ctx.fillStyle = '#333333';
    ctx.fillRect(20, 15, 200, 20);
    const o2Percent = p.o2 / p.maxO2;
    ctx.fillStyle = o2Percent < 0.2 ? '#ff4444' : '#44aaff';
    ctx.fillRect(20, 15, 200 * o2Percent, 20);
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 15, 200, 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`O2: ${Math.floor(p.o2)}/${p.maxO2}`, 25, 30);

    // Health bar
    ctx.fillStyle = '#333333';
    ctx.fillRect(240, 15, 200, 20);
    const hpPercent = p.hp / p.maxHp;
    ctx.fillStyle = hpPercent < 0.3 ? '#ff4444' : '#44ff44';
    ctx.fillRect(240, 15, 200 * hpPercent, 20);
    ctx.strokeStyle = '#666666';
    ctx.strokeRect(240, 15, 200, 20);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(`HP: ${p.hp}/${p.maxHp}`, 245, 30);

    // Weapon info
    const weapon = WEAPONS[p.weapon];
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(weapon.name, canvas.width - 20, 25);

    if (!weapon.melee) {
        ctx.font = '14px Arial';
        ctx.fillText(`${p.currentMag}/${weapon.magSize} | ${p.ammo[weapon.ammoType]}`, canvas.width - 20, 42);
    }

    // Ship name
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(SHIPS[game.currentShipIndex].name, canvas.width / 2, 30);

    // Bottom bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    // Flashlight indicator
    ctx.fillStyle = p.flashlight ? '#ffff44' : '#444444';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`[F] Flashlight: ${p.flashlight ? 'ON' : 'OFF'} (${Math.floor(p.flashlightBattery)}s)`, 20, canvas.height - 20);

    // Controls reminder
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'right';
    ctx.fillText('[E] Interact  [R] Reload  [Q] Debug', canvas.width - 20, canvas.height - 20);

    // Minimap
    renderMinimap();

    // O2 warning
    if (p.o2 <= 20) {
        ctx.fillStyle = `rgba(255, 0, 0, ${0.3 + Math.sin(Date.now() / 200) * 0.2})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('LOW OXYGEN!', canvas.width / 2, canvas.height / 2 - 200);
    }

    // Door prompt
    game.ship.doors.forEach(door => {
        const dist = Math.hypot(
            game.player.x - (door.x + door.width/2),
            game.player.y - (door.y + door.height/2)
        );
        if (dist < 100) {
            ctx.fillStyle = '#44ff44';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`[E] ${door.open ? 'CLOSE' : 'OPEN'} DOOR`, canvas.width / 2, canvas.height - 80);
        }
    });

    // Escape pod prompt
    if (game.ship.escapePod) {
        const pod = game.ship.escapePod;
        const dist = Math.hypot(
            game.player.x - (pod.x + pod.width/2),
            game.player.y - (pod.y + pod.height/2)
        );
        if (dist < 100) {
            const enemies = game.ship.enemies.filter(e => e.hp > 0);
            if (game.currentShipIndex === SHIPS.length - 1 && enemies.length > 0) {
                ctx.fillStyle = '#ff4444';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('DEFEAT ALL ENEMIES TO ESCAPE!', canvas.width / 2, canvas.height - 80);
            } else {
                ctx.fillStyle = '#44ffff';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('APPROACH TO BOARD ESCAPE POD', canvas.width / 2, canvas.height - 80);
            }
        }
    }
}

function renderMinimap() {
    const mapW = 180;
    const mapH = 120;
    const mapX = canvas.width - mapW - 15;
    const mapY = 60;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(mapX - 5, mapY - 5, mapW + 10, mapH + 10);
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX - 5, mapY - 5, mapW + 10, mapH + 10);

    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    game.ship.rooms.forEach(room => {
        minX = Math.min(minX, room.x);
        minY = Math.min(minY, room.y);
        maxX = Math.max(maxX, room.x + room.width);
        maxY = Math.max(maxY, room.y + room.height);
    });
    if (game.ship.corridors) {
        game.ship.corridors.forEach(c => {
            minX = Math.min(minX, c.x);
            minY = Math.min(minY, c.y);
            maxX = Math.max(maxX, c.x + c.width);
            maxY = Math.max(maxY, c.y + c.height);
        });
    }

    const worldW = maxX - minX + 100;
    const worldH = maxY - minY + 100;
    const scale = Math.min(mapW / worldW, mapH / worldH);

    function toMapX(x) { return mapX + (x - minX + 50) * scale; }
    function toMapY(y) { return mapY + (y - minY + 50) * scale; }

    // Draw rooms
    game.ship.rooms.forEach(room => {
        if (room.explored) {
            ctx.fillStyle = room.lifeSupport ? '#1a2a1a' : (room.type === 'exit' ? '#1a2a2a' : '#1a1a1a');
        } else {
            ctx.fillStyle = '#0a0a0a';
        }
        ctx.fillRect(
            toMapX(room.x), toMapY(room.y),
            room.width * scale, room.height * scale
        );
        ctx.strokeStyle = room.explored ? '#444444' : '#222222';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            toMapX(room.x), toMapY(room.y),
            room.width * scale, room.height * scale
        );

        // Room type indicator
        if (room.explored) {
            if (room.type === 'exit') {
                ctx.fillStyle = '#44ffff';
                ctx.beginPath();
                ctx.arc(toMapX(room.x + room.width/2), toMapY(room.y + room.height/2), 3, 0, Math.PI * 2);
                ctx.fill();
            }
            if (room.lifeSupport) {
                ctx.fillStyle = '#44ff44';
                ctx.fillText('+', toMapX(room.x + room.width/2) - 3, toMapY(room.y + room.height/2) + 3);
            }
        }
    });

    // Draw corridors
    if (game.ship.corridors) {
        game.ship.corridors.forEach(corridor => {
            ctx.fillStyle = '#151515';
            ctx.fillRect(
                toMapX(corridor.x), toMapY(corridor.y),
                corridor.width * scale, corridor.height * scale
            );
        });
    }

    // Draw doors
    game.ship.doors.forEach(door => {
        ctx.fillStyle = door.open ? '#44ff44' : '#ff4444';
        ctx.fillRect(
            toMapX(door.x), toMapY(door.y),
            Math.max(2, door.width * scale), Math.max(2, door.height * scale)
        );
    });

    // Draw enemies (if visible)
    game.ship.enemies.forEach(enemy => {
        if (enemy.hp > 0) {
            const inCone = isInVisionCone(game.player.x, game.player.y, enemy.x, enemy.y, game.player.angle);
            if (inCone) {
                ctx.fillStyle = enemy.type === 'boss' ? '#ff4444' : '#ff8844';
                ctx.beginPath();
                ctx.arc(toMapX(enemy.x), toMapY(enemy.y), enemy.type === 'boss' ? 4 : 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });

    // Draw player
    ctx.fillStyle = '#44ff44';
    ctx.beginPath();
    ctx.arc(toMapX(game.player.x), toMapY(game.player.y), 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw vision cone indicator
    ctx.strokeStyle = 'rgba(68, 255, 68, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(toMapX(game.player.x), toMapY(game.player.y));
    ctx.lineTo(
        toMapX(game.player.x + Math.cos(game.player.angle - VISION_CONE_ANGLE/2) * 60),
        toMapY(game.player.y + Math.sin(game.player.angle - VISION_CONE_ANGLE/2) * 60)
    );
    ctx.moveTo(toMapX(game.player.x), toMapY(game.player.y));
    ctx.lineTo(
        toMapX(game.player.x + Math.cos(game.player.angle + VISION_CONE_ANGLE/2) * 60),
        toMapY(game.player.y + Math.sin(game.player.angle + VISION_CONE_ANGLE/2) * 60)
    );
    ctx.stroke();

    // Map label
    ctx.fillStyle = '#888888';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SHIP MAP', mapX + mapW/2, mapY - 10);
}

function renderSpace() {
    // Space background
    ctx.fillStyle = '#000005';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    game.space.stars.forEach(star => {
        const brightness = 0.3 + star.brightness * 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Derelict ships
    game.space.derelicts.forEach(derelict => {
        // Ship hull
        ctx.fillStyle = derelict.shipIndex >= 0 ? '#3a3a3a' : '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(derelict.x, derelict.y, derelict.size, derelict.size * 0.5, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Details
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Docking indicator for valid targets
        if (derelict.shipIndex >= 0) {
            ctx.fillStyle = '#44ff44';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(derelict.name, derelict.x, derelict.y - derelict.size - 10);
            ctx.fillText('[DOCK]', derelict.x, derelict.y - derelict.size + 5);

            // Glow
            const dockGrad = ctx.createRadialGradient(derelict.x, derelict.y, 0, derelict.x, derelict.y, derelict.size + 20);
            dockGrad.addColorStop(0, 'rgba(68, 255, 68, 0)');
            dockGrad.addColorStop(1, 'rgba(68, 255, 68, 0.2)');
            ctx.fillStyle = dockGrad;
            ctx.beginPath();
            ctx.arc(derelict.x, derelict.y, derelict.size + 20, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#666666';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(derelict.name, derelict.x, derelict.y - derelict.size - 5);
        }
    });

    // Player ship
    const ship = game.space.playerShip;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);

    // Ship body
    ctx.fillStyle = '#44aa44';
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(-15, -12);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-15, 12);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(10, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // Engine glow when thrusting
    if (game.keys['w']) {
        ctx.fillStyle = '#ff8844';
        ctx.beginPath();
        ctx.moveTo(-15, -8);
        ctx.lineTo(-25 - Math.random() * 10, 0);
        ctx.lineTo(-15, 8);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();

    // Space HUD
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, 50);

    // O2 bar
    ctx.fillStyle = '#333333';
    ctx.fillRect(20, 15, 200, 20);
    const o2Percent = game.player.o2 / game.player.maxO2;
    ctx.fillStyle = o2Percent < 0.2 ? '#ff4444' : '#44aaff';
    ctx.fillRect(20, 15, 200 * o2Percent, 20);
    ctx.strokeStyle = '#666666';
    ctx.strokeRect(20, 15, 200, 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`O2: ${Math.floor(game.player.o2)}/${game.player.maxO2}`, 25, 30);

    // Mode indicator
    ctx.fillStyle = '#44ffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE MODE - Find a Derelict to Dock', canvas.width / 2, 30);

    // Controls
    ctx.fillStyle = '#666666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WASD - Fly | Approach green ships to dock', canvas.width / 2, canvas.height - 20);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, 200);

    ctx.fillStyle = '#888888';
    ctx.font = '24px Arial';
    if (game.player.o2 <= 0) {
        ctx.fillText('Your lungs burned for oxygen that never came.', canvas.width / 2, 260);
    } else {
        ctx.fillText('Your body joins the ship\'s other victims.', canvas.width / 2, 260);
    }

    renderStats();

    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Press SPACE to Try Again', canvas.width / 2, 550);
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPED!', canvas.width / 2, 200);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '24px Arial';
    ctx.fillText('You made it off the derelict vessels alive.', canvas.width / 2, 260);

    renderStats();

    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Press SPACE to Play Again', canvas.width / 2, 550);
}

function renderStats() {
    const elapsed = Math.floor((Date.now() - game.stats.timeStarted) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';

    const stats = [
        `Time Survived: ${minutes}:${seconds.toString().padStart(2, '0')}`,
        `Ships Explored: ${game.currentShipIndex + 1}/${SHIPS.length}`,
        `Enemies Killed: ${game.stats.enemiesKilled}`,
        `Damage Taken: ${game.stats.damageTaken}`,
        `Rooms Explored: ${game.stats.roomsExplored}`
    ];

    stats.forEach((text, i) => {
        ctx.fillText(text, canvas.width / 2, 340 + i * 35);
    });
}

function renderDebug() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 60, 250, 280);

    ctx.fillStyle = '#00ff00';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';

    const p = game.player;
    const info = [
        `=== DEBUG (Q to toggle) ===`,
        `State: ${game.state}`,
        `Ship: ${game.currentShipIndex + 1}/${SHIPS.length}`,
        `Player X: ${Math.floor(p.x)}`,
        `Player Y: ${Math.floor(p.y)}`,
        `Player Angle: ${(p.angle * 180 / Math.PI).toFixed(1)}°`,
        `HP: ${p.hp}/${p.maxHp}`,
        `O2: ${p.o2.toFixed(1)}/${p.maxO2}`,
        `Weapon: ${p.weapon}`,
        `Ammo: ${p.currentMag}/${WEAPONS[p.weapon].magSize || '-'}`,
        `Running: ${p.isRunning}`,
        `Invincible: ${p.invincibleTimer > 0}`,
        `Flashlight: ${p.flashlight}`,
        `Enemies: ${game.ship.enemies.filter(e => e.hp > 0).length}`,
        `Items: ${game.ship.items.filter(i => !i.collected).length}`,
        `Bullets: ${game.ship.bullets.length}`,
        `FPS: ${Math.round(1000 / (Date.now() - lastTime + 1))}`
    ];

    info.forEach((text, i) => {
        ctx.fillText(text, 20, 80 + i * 16);
    });
}

// Start the game
init();
