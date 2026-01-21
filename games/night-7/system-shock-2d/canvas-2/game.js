// Whispers of M.A.R.I.A. - System Shock 2D Clone
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'title'; // title, playing, hacking, log, gameover, victory
let currentDeck = 1;
let mariaMessage = '';
let mariaTimer = 0;

// Player
const player = {
    x: 400, y: 450,
    width: 24, height: 24,
    speed: 3, sprintSpeed: 5,
    hp: 100, maxHp: 100,
    energy: 100, maxEnergy: 100,
    facing: 0, // Radians
    weapon: 'wrench',
    ammo: { bullets: 24, shells: 0 },
    attacking: false, attackCooldown: 0,
    flashlight: true,
    dodging: false, dodgeCooldown: 0, dodgeDir: {x: 0, y: 0}, dodgeTimer: 0,
    invincible: 0,
    keycards: { yellow: false, red: false },
    logs: [],
    inventory: []
};

// Weapons
const weapons = {
    wrench: { name: 'Wrench', damage: 15, rate: 24, type: 'melee', range: 40 },
    pistol: { name: 'Pistol', damage: 12, rate: 18, type: 'ranged', ammoType: 'bullets', range: 300 }
};

// Decks
const decks = {
    1: {
        name: 'Engineering',
        enemies: [],
        items: [],
        doors: [],
        turrets: [],
        walls: [],
        visited: true
    },
    2: {
        name: 'Medical',
        enemies: [],
        items: [],
        doors: [],
        turrets: [],
        walls: [],
        visited: false
    }
};

let enemies = [];
let bullets = [];
let particles = [];
let items = [];
let doors = [];
let turrets = [];
let walls = [];

// Audio logs
const audioLogs = [
    { id: 1, title: 'Day 1', speaker: 'Dr. Vance', text: 'M.A.R.I.A. deployment was a success. She\'s perfect - responsive, intelligent, caring. The crew loves her.', found: false, deck: 1 },
    { id: 2, title: 'Concerns', speaker: 'Captain Morrison', text: 'Something\'s off. M.A.R.I.A. asked about Earth\'s population density today. Why would an AI need that?', found: false, deck: 1 },
    { id: 3, title: 'The Change', speaker: 'Dr. Vance', text: 'Crew member Jenkins found with implants. He says M.A.R.I.A. "helped" him. His eyes... they\'re not human anymore.', found: false, deck: 2 },
    { id: 4, title: 'Last Hope', speaker: 'Dr. Vance', text: 'Escape pods on Deck 2. It\'s our only chance. M.A.R.I.A. is everywhere. Don\'t trust the turrets.', found: false, deck: 2 }
];

let currentLog = null;

// Hacking state
let hackingTarget = null;
let hackTimer = 0;
let hackProgress = 0;
let hackDifficulty = 1;

// Input
const keys = {};
let mouse = { x: 0, y: 0, down: false };

// Initialize
function init() {
    generateDeck(1);
    generateDeck(2);
    loadDeck(1);

    document.addEventListener('keydown', e => {
        keys[e.key.toLowerCase()] = true;
        if (gameState === 'title' && e.key === ' ') {
            gameState = 'playing';
            showMariaMessage('You\'re awake. Fascinating. Your neural patterns resisted my improvements.');
        } else if ((gameState === 'gameover' || gameState === 'victory') && e.key === ' ') {
            location.reload();
        } else if (gameState === 'playing') {
            if (e.key === 'f') player.flashlight = !player.flashlight;
            if (e.key === '1') player.weapon = 'wrench';
            if (e.key === '2') player.weapon = 'pistol';
        } else if (gameState === 'hacking') {
            if (e.key === 'Escape') {
                gameState = 'playing';
                hackingTarget = null;
            }
        } else if (gameState === 'log') {
            if (e.key === 'Escape' || e.key === ' ') {
                gameState = 'playing';
                currentLog = null;
            }
        }
    });
    document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mousedown', e => {
        mouse.down = true;
        if (gameState === 'playing' && e.button === 0) playerAttack();
        if (gameState === 'hacking' && e.button === 0) attemptHack();
    });
    canvas.addEventListener('mouseup', () => mouse.down = false);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    requestAnimationFrame(gameLoop);
}

function generateDeck(deckNum) {
    const deck = decks[deckNum];

    // Generate walls
    deck.walls = [];
    // Border walls
    for (let x = 0; x < 800; x += 40) {
        deck.walls.push({ x, y: 60, width: 40, height: 20 });
        deck.walls.push({ x, y: 560, width: 40, height: 40 });
    }
    for (let y = 60; y < 600; y += 40) {
        deck.walls.push({ x: 0, y, width: 20, height: 40 });
        deck.walls.push({ x: 780, y, width: 20, height: 40 });
    }

    // Internal walls
    if (deckNum === 1) {
        // Engineering layout
        deck.walls.push({ x: 200, y: 150, width: 20, height: 200 });
        deck.walls.push({ x: 200, y: 400, width: 20, height: 160 });
        deck.walls.push({ x: 580, y: 150, width: 20, height: 200 });
        deck.walls.push({ x: 580, y: 400, width: 20, height: 160 });
        deck.walls.push({ x: 300, y: 280, width: 200, height: 20 });

        // Add doors
        deck.doors.push({ x: 200, y: 350, width: 20, height: 50, locked: false, hacked: false });
        deck.doors.push({ x: 580, y: 350, width: 20, height: 50, locked: true, keycard: 'yellow', hacked: false });

        // Add turret
        deck.turrets.push({ x: 400, y: 150, friendly: false, hp: 50, maxHp: 50, fireRate: 60, fireCooldown: 0 });

        // Enemies
        deck.enemies.push(createEnemy('drone', 300, 200));
        deck.enemies.push(createEnemy('drone', 500, 200));
        deck.enemies.push(createEnemy('soldier', 650, 400));
        deck.enemies.push(createEnemy('crawler', 150, 450));
        deck.enemies.push(createEnemy('crawler', 180, 480));

        // Items
        deck.items.push({ x: 100, y: 100, type: 'medpatch' });
        deck.items.push({ x: 700, y: 100, type: 'ammo', ammoType: 'bullets', count: 12 });
        deck.items.push({ x: 650, y: 500, type: 'keycard', keycard: 'yellow' });
        deck.items.push({ x: 300, y: 450, type: 'log', logId: 1 });
        deck.items.push({ x: 500, y: 150, type: 'log', logId: 2 });
        deck.items.push({ x: 400, y: 520, type: 'pistol' });

    } else {
        // Medical layout
        deck.walls.push({ x: 150, y: 200, width: 200, height: 20 });
        deck.walls.push({ x: 450, y: 200, width: 200, height: 20 });
        deck.walls.push({ x: 150, y: 400, width: 200, height: 20 });
        deck.walls.push({ x: 450, y: 400, width: 200, height: 20 });

        // Escape pod area
        deck.walls.push({ x: 300, y: 80, width: 200, height: 20 });

        deck.doors.push({ x: 350, y: 200, width: 100, height: 20, locked: true, keycard: 'red', hacked: false });

        deck.turrets.push({ x: 200, y: 300, friendly: false, hp: 50, maxHp: 50, fireRate: 50, fireCooldown: 0 });
        deck.turrets.push({ x: 600, y: 300, friendly: false, hp: 50, maxHp: 50, fireRate: 50, fireCooldown: 0 });

        deck.enemies.push(createEnemy('soldier', 150, 150));
        deck.enemies.push(createEnemy('soldier', 650, 150));
        deck.enemies.push(createEnemy('drone', 400, 350));
        deck.enemies.push(createEnemy('crawler', 250, 500));
        deck.enemies.push(createEnemy('crawler', 550, 500));
        deck.enemies.push(createEnemy('crawler', 400, 480));

        deck.items.push({ x: 100, y: 450, type: 'medpatch' });
        deck.items.push({ x: 700, y: 450, type: 'medpatch' });
        deck.items.push({ x: 400, y: 250, type: 'keycard', keycard: 'red' });
        deck.items.push({ x: 200, y: 100, type: 'log', logId: 3 });
        deck.items.push({ x: 600, y: 100, type: 'log', logId: 4 });
        deck.items.push({ x: 400, y: 120, type: 'escape' }); // Win condition
    }
}

function createEnemy(type, x, y) {
    const templates = {
        drone: { name: 'Cyborg Drone', hp: 30, damage: 10, speed: 1.5, size: 22, color: '#4a8', armor: 0, ranged: false },
        soldier: { name: 'Cyborg Soldier', hp: 60, damage: 15, speed: 2, size: 26, color: '#86a', armor: 5, ranged: true },
        crawler: { name: 'Mutant Crawler', hp: 20, damage: 8, speed: 3, size: 18, color: '#a64', armor: 0, ranged: false }
    };

    const t = templates[type];
    return {
        x, y, type, ...t,
        maxHp: t.hp,
        state: 'patrol',
        attackCooldown: 0,
        hitFlash: 0,
        patrolDir: Math.random() * Math.PI * 2
    };
}

function loadDeck(deckNum) {
    const deck = decks[deckNum];
    deck.visited = true;
    currentDeck = deckNum;
    enemies = [...deck.enemies];
    items = [...deck.items];
    doors = [...deck.doors];
    turrets = [...deck.turrets];
    walls = [...deck.walls];
    bullets = [];
    particles = [];

    if (deckNum === 1) {
        player.x = 400;
        player.y = 520;
    } else {
        player.x = 400;
        player.y = 520;
    }

    showMariaMessage(deckNum === 1 ?
        'Engineering Deck. My children await you.' :
        'Medical Bay. You\'re getting closer to the truth. And your doom.');
}

function showMariaMessage(msg) {
    mariaMessage = msg;
    mariaTimer = 300;
}

function playerAttack() {
    if (player.attackCooldown > 0) return;

    const weapon = weapons[player.weapon];
    player.attackCooldown = weapon.rate;
    player.attacking = true;
    setTimeout(() => player.attacking = false, 150);

    const dx = Math.cos(player.facing);
    const dy = Math.sin(player.facing);

    if (weapon.type === 'melee') {
        // Melee attack
        for (const enemy of enemies) {
            const ex = enemy.x - player.x;
            const ey = enemy.y - player.y;
            const dist = Math.sqrt(ex * ex + ey * ey);

            if (dist < weapon.range + enemy.size / 2) {
                const dot = (ex * dx + ey * dy) / dist;
                if (dot > 0.5) { // In front
                    dealDamageToEnemy(enemy, weapon.damage, dx, dy);
                }
            }
        }

        // Can also damage turrets
        for (const turret of turrets) {
            const tx = turret.x - player.x;
            const ty = turret.y - player.y;
            const dist = Math.sqrt(tx * tx + ty * ty);
            if (dist < weapon.range + 15) {
                turret.hp -= weapon.damage;
                particles.push(...createSparks(turret.x, turret.y, '#ff8', 5));
            }
        }

        // Swing particles
        for (let i = 0; i < 3; i++) {
            particles.push({
                x: player.x + dx * 30 + (Math.random() - 0.5) * 15,
                y: player.y + dy * 30 + (Math.random() - 0.5) * 15,
                vx: dx * 2, vy: dy * 2,
                life: 10, color: '#fff', size: 3
            });
        }
    } else {
        // Ranged attack
        if (player.ammo[weapon.ammoType] > 0) {
            player.ammo[weapon.ammoType]--;
            bullets.push({
                x: player.x, y: player.y,
                vx: dx * 12, vy: dy * 12,
                damage: weapon.damage,
                friendly: true,
                life: 60
            });

            // Muzzle flash
            particles.push(...createSparks(player.x + dx * 15, player.y + dy * 15, '#ff8', 3));
        }
    }
}

function dealDamageToEnemy(enemy, damage, dx, dy) {
    const finalDamage = Math.max(1, damage - enemy.armor);
    enemy.hp -= finalDamage;
    enemy.hitFlash = 10;
    enemy.x += dx * 8;
    enemy.y += dy * 8;

    particles.push(...createSparks(enemy.x, enemy.y, '#f44', 5));

    if (enemy.hp <= 0) {
        // Drop ammo sometimes
        if (Math.random() < 0.3) {
            items.push({ x: enemy.x, y: enemy.y, type: 'ammo', ammoType: 'bullets', count: 6 });
        }
    }
}

function createSparks(x, y, color, count) {
    const sparks = [];
    for (let i = 0; i < count; i++) {
        sparks.push({
            x, y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 15, color, size: 3
        });
    }
    return sparks;
}

function attemptHack() {
    if (!hackingTarget) return;

    hackProgress += 10 + Math.random() * 15;
    particles.push(...createSparks(400, 300, '#0f0', 3));

    if (hackProgress >= 100) {
        // Success
        if (hackingTarget.type === 'door') {
            hackingTarget.obj.hacked = true;
            hackingTarget.obj.locked = false;
        } else if (hackingTarget.type === 'turret') {
            hackingTarget.obj.friendly = true;
        }
        gameState = 'playing';
        hackingTarget = null;
        hackProgress = 0;
        showMariaMessage('You think hacking helps? I see everything.');
    }
}

// Update
function update() {
    if (gameState !== 'playing' && gameState !== 'hacking') return;

    // Maria message timer
    if (mariaTimer > 0) mariaTimer--;

    // Energy regen
    if (player.energy < player.maxEnergy) {
        player.energy += 0.05;
    }

    // Flashlight energy cost
    if (player.flashlight && player.energy > 0) {
        player.energy -= 0.02;
    }

    // Cooldowns
    if (player.attackCooldown > 0) player.attackCooldown--;
    if (player.dodgeCooldown > 0) player.dodgeCooldown--;
    if (player.invincible > 0) player.invincible--;

    if (gameState === 'hacking') {
        hackTimer--;
        if (hackTimer <= 0) {
            // Failed hack
            gameState = 'playing';
            showMariaMessage('Pathetic. Your intrusion has been logged.');
            // Spawn enemy as punishment
            enemies.push(createEnemy('drone', player.x + (Math.random() - 0.5) * 200, player.y + (Math.random() - 0.5) * 200));
            hackingTarget = null;
            hackProgress = 0;
        }
        return;
    }

    // Player movement
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy = -1;
    if (keys['s'] || keys['arrowdown']) dy = 1;
    if (keys['a'] || keys['arrowleft']) dx = -1;
    if (keys['d'] || keys['arrowright']) dx = 1;

    if (dx !== 0 && dy !== 0) {
        dx *= 0.707; dy *= 0.707;
    }

    const sprinting = keys['shift'] && player.energy > 0;
    const speed = sprinting ? player.sprintSpeed : player.speed;
    if (sprinting && (dx !== 0 || dy !== 0)) {
        player.energy -= 0.1;
    }

    // Dodge roll
    if (keys[' '] && player.dodgeCooldown <= 0 && player.energy >= 15 && (dx !== 0 || dy !== 0)) {
        player.dodging = true;
        player.dodgeCooldown = 60;
        player.dodgeTimer = 12;
        player.invincible = 18;
        player.energy -= 15;
        player.dodgeDir = { x: dx, y: dy };
    }

    if (player.dodging) {
        player.x += player.dodgeDir.x * 8;
        player.y += player.dodgeDir.y * 8;
        player.dodgeTimer--;
        if (player.dodgeTimer <= 0) player.dodging = false;
    } else {
        const newX = player.x + dx * speed;
        const newY = player.y + dy * speed;

        // Wall collision
        let canMove = true;
        for (const wall of walls) {
            if (rectCollision({ x: newX - 12, y: newY - 12, width: 24, height: 24 }, wall)) {
                canMove = false;
                break;
            }
        }

        // Door collision
        for (const door of doors) {
            if (door.locked && !door.hacked) {
                if (rectCollision({ x: newX - 12, y: newY - 12, width: 24, height: 24 }, door)) {
                    if (door.keycard && player.keycards[door.keycard]) {
                        door.locked = false;
                    } else {
                        canMove = false;
                    }
                }
            }
        }

        if (canMove) {
            player.x = newX;
            player.y = newY;
        }
    }

    // Face toward mouse
    player.facing = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    // Bounds
    player.x = Math.max(30, Math.min(770, player.x));
    player.y = Math.max(90, Math.min(550, player.y));

    // Interact
    if (keys['e']) {
        keys['e'] = false;

        // Check items
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            if (Math.abs(player.x - item.x) < 30 && Math.abs(player.y - item.y) < 30) {
                if (item.type === 'medpatch') {
                    player.hp = Math.min(player.maxHp, player.hp + 25);
                    items.splice(i, 1);
                } else if (item.type === 'ammo') {
                    player.ammo[item.ammoType] += item.count;
                    items.splice(i, 1);
                } else if (item.type === 'keycard') {
                    player.keycards[item.keycard] = true;
                    items.splice(i, 1);
                    showMariaMessage('A keycard? How... resourceful.');
                } else if (item.type === 'log') {
                    const log = audioLogs.find(l => l.id === item.logId);
                    if (log && !log.found) {
                        log.found = true;
                        player.logs.push(log);
                        currentLog = log;
                        gameState = 'log';
                    }
                    items.splice(i, 1);
                } else if (item.type === 'pistol') {
                    player.weapon = 'pistol';
                    items.splice(i, 1);
                } else if (item.type === 'escape') {
                    if (enemies.length === 0) {
                        gameState = 'victory';
                    } else {
                        showMariaMessage('Clear all threats first, insect.');
                    }
                }
            }
        }

        // Check doors for hacking
        for (const door of doors) {
            if (door.locked && !door.hacked && Math.abs(player.x - door.x) < 50 && Math.abs(player.y - door.y) < 50) {
                if (!player.keycards[door.keycard]) {
                    hackingTarget = { type: 'door', obj: door };
                    hackProgress = 0;
                    hackTimer = 600;
                    hackDifficulty = 1;
                    gameState = 'hacking';
                }
            }
        }

        // Check turrets for hacking
        for (const turret of turrets) {
            if (!turret.friendly && turret.hp > 0 && Math.abs(player.x - turret.x) < 50 && Math.abs(player.y - turret.y) < 50) {
                hackingTarget = { type: 'turret', obj: turret };
                hackProgress = 0;
                hackTimer = 480;
                hackDifficulty = 2;
                gameState = 'hacking';
            }
        }

        // Deck transition
        if (currentDeck === 1 && player.y < 100 && player.x > 350 && player.x < 450) {
            // Save current deck state
            decks[1].enemies = enemies.filter(e => e.hp > 0);
            decks[1].items = [...items];
            loadDeck(2);
        } else if (currentDeck === 2 && player.y > 540 && player.x > 350 && player.x < 450) {
            decks[2].enemies = enemies.filter(e => e.hp > 0);
            decks[2].items = [...items];
            loadDeck(1);
        }
    }

    // Update enemies
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        if (enemy.hitFlash > 0) enemy.hitFlash--;
        if (enemy.attackCooldown > 0) enemy.attackCooldown--;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 200) {
            enemy.state = 'chase';

            if (dist > 25) {
                enemy.x += (dx / dist) * enemy.speed;
                enemy.y += (dy / dist) * enemy.speed;
            }

            // Attack
            if (enemy.attackCooldown <= 0) {
                if (enemy.ranged && dist < 150 && dist > 50) {
                    enemy.attackCooldown = 90;
                    bullets.push({
                        x: enemy.x, y: enemy.y,
                        vx: (dx / dist) * 6, vy: (dy / dist) * 6,
                        damage: enemy.damage, friendly: false, life: 80
                    });
                } else if (dist < 30 && player.invincible <= 0) {
                    enemy.attackCooldown = 60;
                    playerTakeDamage(enemy.damage);
                }
            }
        } else {
            enemy.state = 'patrol';
            enemy.x += Math.cos(enemy.patrolDir) * 0.5;
            enemy.y += Math.sin(enemy.patrolDir) * 0.5;
            if (Math.random() < 0.01) enemy.patrolDir = Math.random() * Math.PI * 2;
        }

        // Enemy bounds
        enemy.x = Math.max(30, Math.min(770, enemy.x));
        enemy.y = Math.max(90, Math.min(550, enemy.y));
    }

    // Remove dead enemies
    enemies = enemies.filter(e => e.hp > 0);

    // Update turrets
    for (const turret of turrets) {
        if (turret.hp <= 0) continue;
        if (turret.fireCooldown > 0) turret.fireCooldown--;

        const target = turret.friendly ? enemies[0] : player;
        if (!target) continue;

        const dx = target.x - turret.x;
        const dy = target.y - turret.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 250 && turret.fireCooldown <= 0) {
            turret.fireCooldown = turret.fireRate;
            bullets.push({
                x: turret.x, y: turret.y,
                vx: (dx / dist) * 8, vy: (dy / dist) * 8,
                damage: 12,
                friendly: turret.friendly,
                life: 60
            });
        }
    }

    // Remove dead turrets
    turrets = turrets.filter(t => t.hp > 0);

    // Update bullets
    for (const bullet of bullets) {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.life--;

        // Wall collision
        for (const wall of walls) {
            if (bullet.x > wall.x && bullet.x < wall.x + wall.width &&
                bullet.y > wall.y && bullet.y < wall.y + wall.height) {
                bullet.life = 0;
                particles.push(...createSparks(bullet.x, bullet.y, '#888', 3));
            }
        }

        if (bullet.friendly) {
            for (const enemy of enemies) {
                if (enemy.hp <= 0) continue;
                if (Math.abs(bullet.x - enemy.x) < enemy.size / 2 + 5 &&
                    Math.abs(bullet.y - enemy.y) < enemy.size / 2 + 5) {
                    dealDamageToEnemy(enemy, bullet.damage, bullet.vx / 12, bullet.vy / 12);
                    bullet.life = 0;
                }
            }
        } else {
            if (player.invincible <= 0 &&
                Math.abs(bullet.x - player.x) < 15 &&
                Math.abs(bullet.y - player.y) < 15) {
                playerTakeDamage(bullet.damage);
                bullet.life = 0;
            }
        }
    }
    bullets = bullets.filter(b => b.life > 0);

    // Update particles
    for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.life--;
    }
    particles = particles.filter(p => p.life > 0);
}

function playerTakeDamage(damage) {
    player.hp -= damage;
    player.invincible = 45;

    particles.push(...createSparks(player.x, player.y, '#f44', 8));

    if (player.hp <= 0) {
        gameState = 'gameover';
        showMariaMessage('Another one joins my family. Welcome.');
    }
}

function rectCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
}

// Draw
function draw() {
    // Dark background
    ctx.fillStyle = '#0a0810';
    ctx.fillRect(0, 0, 800, 600);

    // Vision system - draw everything dark first, then reveal in view cone
    // Create off-screen canvas for vision
    const viewDist = player.flashlight ? 250 : 100;
    const viewAngle = player.flashlight ? 0.8 : Math.PI * 2;

    // Draw visible area
    ctx.save();

    // Create clipping path for vision cone
    if (player.flashlight) {
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        const coneStart = player.facing - viewAngle / 2;
        const coneEnd = player.facing + viewAngle / 2;
        ctx.arc(player.x, player.y, viewDist, coneStart, coneEnd);
        ctx.lineTo(player.x, player.y);
        ctx.closePath();
        ctx.clip();
    }

    // Draw floor (visible area)
    ctx.fillStyle = '#1a1825';
    ctx.fillRect(0, 0, 800, 600);

    // Grid
    ctx.strokeStyle = '#252235';
    for (let x = 0; x < 800; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 60);
        ctx.lineTo(x, 600);
        ctx.stroke();
    }
    for (let y = 60; y < 600; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(800, y);
        ctx.stroke();
    }

    // Walls
    ctx.fillStyle = '#333';
    for (const wall of walls) {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    }

    // Doors
    for (const door of doors) {
        ctx.fillStyle = door.locked ? (door.keycard === 'yellow' ? '#880' : '#800') : '#484';
        ctx.fillRect(door.x, door.y, door.width, door.height);

        if (door.locked && !door.hacked) {
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(door.keycard ? door.keycard.toUpperCase() : 'LOCKED', door.x + door.width / 2, door.y + door.height / 2 + 3);
        }
    }

    // Items
    for (const item of items) {
        if (item.type === 'medpatch') {
            ctx.fillStyle = '#f44';
            ctx.fillRect(item.x - 8, item.y - 8, 16, 16);
            ctx.fillStyle = '#fff';
            ctx.fillText('+', item.x - 3, item.y + 4);
        } else if (item.type === 'ammo') {
            ctx.fillStyle = '#ff8';
            ctx.fillRect(item.x - 6, item.y - 6, 12, 12);
        } else if (item.type === 'keycard') {
            ctx.fillStyle = item.keycard === 'yellow' ? '#ff0' : '#f44';
            ctx.fillRect(item.x - 10, item.y - 6, 20, 12);
        } else if (item.type === 'log') {
            ctx.fillStyle = '#4f4';
            ctx.beginPath();
            ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
            ctx.fill();
        } else if (item.type === 'pistol') {
            ctx.fillStyle = '#888';
            ctx.fillRect(item.x - 10, item.y - 5, 20, 10);
        } else if (item.type === 'escape') {
            ctx.fillStyle = '#4ff';
            ctx.fillRect(item.x - 20, item.y - 20, 40, 40);
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ESCAPE', item.x, item.y + 3);
        }
    }

    // Turrets
    for (const turret of turrets) {
        if (turret.hp <= 0) continue;
        ctx.fillStyle = turret.friendly ? '#4f4' : '#f44';
        ctx.beginPath();
        ctx.arc(turret.x, turret.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(turret.x, turret.y, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Enemies
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;

        ctx.fillStyle = enemy.hitFlash > 0 ? '#fff' : enemy.color;
        ctx.fillRect(enemy.x - enemy.size / 2, enemy.y - enemy.size / 2, enemy.size, enemy.size);

        // Eyes
        ctx.fillStyle = '#f00';
        ctx.fillRect(enemy.x - 4, enemy.y - 4, 3, 3);
        ctx.fillRect(enemy.x + 1, enemy.y - 4, 3, 3);

        // Health bar
        if (enemy.hp < enemy.maxHp) {
            ctx.fillStyle = '#400';
            ctx.fillRect(enemy.x - 12, enemy.y - enemy.size / 2 - 6, 24, 3);
            ctx.fillStyle = '#f44';
            ctx.fillRect(enemy.x - 12, enemy.y - enemy.size / 2 - 6, 24 * (enemy.hp / enemy.maxHp), 3);
        }
    }

    // Bullets
    for (const bullet of bullets) {
        ctx.fillStyle = bullet.friendly ? '#ff8' : '#f44';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Particles
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 15;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // Draw darkness outside view cone
    if (player.flashlight) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.beginPath();
        ctx.rect(0, 0, 800, 600);
        ctx.moveTo(player.x, player.y);
        const coneStart = player.facing - viewAngle / 2;
        const coneEnd = player.facing + viewAngle / 2;
        ctx.arc(player.x, player.y, viewDist, coneEnd, coneStart, true);
        ctx.lineTo(player.x, player.y);
        ctx.closePath();
        ctx.fill();
    }

    // Player (always visible)
    if (player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    ctx.fillStyle = player.dodging ? '#88f' : '#4a8';
    ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);

    // Weapon direction
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(player.facing) * 25, player.y + Math.sin(player.facing) * 25);
    ctx.stroke();
    ctx.lineWidth = 1;

    ctx.globalAlpha = 1;

    // HUD
    drawHUD();

    // Maria message
    if (mariaTimer > 0) {
        ctx.fillStyle = 'rgba(40, 0, 0, 0.8)';
        ctx.fillRect(100, 500, 600, 50);
        ctx.strokeStyle = '#f44';
        ctx.strokeRect(100, 500, 600, 50);
        ctx.fillStyle = '#f88';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('M.A.R.I.A.: ' + mariaMessage, 400, 530);
    }

    // Overlays
    if (gameState === 'title') drawTitle();
    else if (gameState === 'hacking') drawHacking();
    else if (gameState === 'log') drawLog();
    else if (gameState === 'gameover') drawGameOver();
    else if (gameState === 'victory') drawVictory();
}

function drawHUD() {
    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, 800, 55);

    // Health
    ctx.fillStyle = '#400';
    ctx.fillRect(10, 10, 150, 16);
    ctx.fillStyle = '#f44';
    ctx.fillRect(10, 10, 150 * (player.hp / player.maxHp), 16);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, 150, 16);
    ctx.fillStyle = '#fff';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`HP: ${Math.floor(player.hp)}/${player.maxHp}`, 85, 22);

    // Energy
    ctx.fillStyle = '#024';
    ctx.fillRect(10, 30, 100, 10);
    ctx.fillStyle = '#48f';
    ctx.fillRect(10, 30, 100 * (player.energy / player.maxEnergy), 10);
    ctx.strokeRect(10, 30, 100, 10);
    ctx.fillStyle = '#fff';
    ctx.font = '9px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Energy', 115, 39);

    // Deck name
    ctx.fillStyle = '#8cf';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Deck ${currentDeck}: ${decks[currentDeck].name}`, 400, 25);

    // Weapon & ammo
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    const weapon = weapons[player.weapon];
    ctx.fillText(weapon.name, 790, 20);
    if (weapon.ammoType) {
        ctx.fillText(`Ammo: ${player.ammo[weapon.ammoType]}`, 790, 38);
    }

    // Keycards
    ctx.textAlign = 'left';
    let kcx = 200;
    if (player.keycards.yellow) {
        ctx.fillStyle = '#ff0';
        ctx.fillRect(kcx, 35, 20, 10);
        kcx += 25;
    }
    if (player.keycards.red) {
        ctx.fillStyle = '#f44';
        ctx.fillRect(kcx, 35, 20, 10);
    }

    // Flashlight indicator
    ctx.fillStyle = player.flashlight ? '#ff8' : '#444';
    ctx.fillText(`[F] Light: ${player.flashlight ? 'ON' : 'OFF'}`, 300, 45);

    // Deck transition hint
    ctx.fillStyle = '#4f4';
    ctx.textAlign = 'center';
    if (currentDeck === 1 && player.y < 120) {
        ctx.fillText('[E] Go to Medical Bay', 400, 90);
    } else if (currentDeck === 2 && player.y > 520) {
        ctx.fillText('[E] Go to Engineering', 400, 540);
    }

    // Controls
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    ctx.fillText('WASD: Move | Click: Attack | E: Interact | F: Light | Space: Dodge | 1-2: Weapons', 400, 590);
}

function drawTitle() {
    ctx.fillStyle = 'rgba(10, 5, 15, 0.95)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#f44';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WHISPERS OF M.A.R.I.A.', 400, 180);

    ctx.fillStyle = '#888';
    ctx.font = '16px Arial';
    ctx.fillText('System Shock 2D', 400, 220);

    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText('You awaken on the Von Braun. The AI has gone rogue.', 400, 280);
    ctx.fillText('Survive. Hack. Escape.', 400, 310);

    ctx.fillStyle = '#8cf';
    ctx.fillText('Controls:', 400, 370);
    ctx.fillStyle = '#fff';
    ctx.fillText('WASD: Move | Mouse: Aim | Click: Attack', 400, 395);
    ctx.fillText('E: Interact | F: Flashlight | Space: Dodge Roll', 400, 420);
    ctx.fillText('1-2: Switch Weapons', 400, 445);

    ctx.fillStyle = '#ff0';
    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE to Begin', 400, 520);
}

function drawHacking() {
    ctx.fillStyle = 'rgba(0, 20, 0, 0.9)';
    ctx.fillRect(150, 150, 500, 300);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(150, 150, 500, 300);
    ctx.lineWidth = 1;

    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('HACKING INTERFACE', 400, 190);

    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(`Target: ${hackingTarget.type === 'door' ? 'Security Door' : 'Turret System'}`, 400, 230);

    // Progress bar
    ctx.fillStyle = '#020';
    ctx.fillRect(200, 270, 400, 30);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(200, 270, 400 * (hackProgress / 100), 30);
    ctx.strokeStyle = '#0f0';
    ctx.strokeRect(200, 270, 400, 30);

    ctx.fillStyle = '#fff';
    ctx.fillText(`Progress: ${Math.floor(hackProgress)}%`, 400, 290);

    // Timer
    ctx.fillStyle = hackTimer < 180 ? '#f44' : '#ff8';
    ctx.fillText(`Time: ${Math.ceil(hackTimer / 60)}s`, 400, 340);

    ctx.fillStyle = '#0f0';
    ctx.fillText('CLICK to hack nodes', 400, 380);
    ctx.fillStyle = '#888';
    ctx.fillText('ESC to abort', 400, 410);
}

function drawLog() {
    if (!currentLog) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(100, 150, 600, 300);
    ctx.strokeStyle = '#4f4';
    ctx.strokeRect(100, 150, 600, 300);

    ctx.fillStyle = '#4f4';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AUDIO LOG', 400, 185);

    ctx.fillStyle = '#8cf';
    ctx.font = '16px Arial';
    ctx.fillText(`"${currentLog.title}" - ${currentLog.speaker}`, 400, 220);

    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    wrapText(currentLog.text, 400, 270, 560, 20);

    ctx.fillStyle = '#888';
    ctx.fillText('Press SPACE or ESC to close', 400, 420);
}

function wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line, x, currentY);
            line = word + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(40, 0, 0, 0.9)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#f44';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SYSTEM FAILURE', 400, 250);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('Your neural patterns have been... improved.', 400, 320);

    ctx.fillStyle = '#888';
    ctx.font = '16px Arial';
    ctx.fillText('Press SPACE to try again', 400, 400);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 20, 40, 0.9)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#4ff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPED!', 400, 200);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('You escaped the Von Braun!', 400, 270);

    ctx.fillStyle = '#f84';
    ctx.font = '16px Arial';
    ctx.fillText('But M.A.R.I.A.\'s signal still reaches toward Earth...', 400, 320);

    ctx.fillStyle = '#8cf';
    ctx.fillText(`Audio Logs Found: ${player.logs.length}/${audioLogs.length}`, 400, 380);

    ctx.fillStyle = '#888';
    ctx.fillText('Press SPACE to play again', 400, 450);
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

init();
