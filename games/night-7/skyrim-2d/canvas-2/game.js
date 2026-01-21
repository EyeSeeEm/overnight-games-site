// Frostfall - 2D Skyrim Demake
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'title'; // title, playing, inventory, dialogue, levelup, gameover, victory
let screenShake = 0;
let screenFlash = 0;

// Player
const player = {
    x: 400, y: 450,
    width: 24, height: 32,
    speed: 3, sprintSpeed: 5,
    hp: 100, maxHp: 100,
    stamina: 100, maxStamina: 100,
    gold: 50,
    level: 1, xp: 0, xpToLevel: 100,
    perkPoints: 0,
    facing: 'down',
    attacking: false, attackCooldown: 0,
    dodging: false, dodgeCooldown: 0, dodgeDir: {x: 0, y: 0},
    invincible: 0,
    combatSkill: 1,
    perks: { armsman: false, powerStrike: false, resolve: false },
    equipment: {
        weapon: { name: 'Iron Sword', damage: 8, type: 'sword' },
        body: { name: 'Leather Armor', armor: 15 },
        head: null,
        ring: null
    },
    inventory: [
        { name: 'Health Potion', type: 'consumable', effect: 'heal', value: 50, count: 3 }
    ]
};

// World areas
const areas = {
    village: { name: 'Riverwood', type: 'village', biome: 'neutral', cleared: false },
    forest: { name: 'Pine Forest', type: 'wilderness', biome: 'forest', cleared: false },
    snow: { name: 'Frozen Wastes', type: 'wilderness', biome: 'snow', cleared: false },
    mountain: { name: 'High Peaks', type: 'wilderness', biome: 'mountain', cleared: false },
    forestDungeon: { name: 'Embershard Mine', type: 'dungeon', biome: 'forest', boss: 'Bandit Chief', cleared: false },
    snowDungeon: { name: 'Bleak Falls Barrow', type: 'dungeon', biome: 'snow', boss: 'Draugr Wight', cleared: false },
    mountainDungeon: { name: "Giant's Camp", type: 'dungeon', biome: 'mountain', boss: 'Giant', cleared: false }
};

let currentArea = 'village';
let enemies = [];
let npcs = [];
let loot = [];
let projectiles = [];
let particles = [];
let damageNumbers = [];

// Quests
const quests = [
    { id: 1, name: 'Clear Embershard Mine', target: 'forestDungeon', status: 'active', reward: 100 },
    { id: 2, name: 'Clear Bleak Falls Barrow', target: 'snowDungeon', status: 'locked', reward: 200 },
    { id: 3, name: 'Defeat the Giant', target: 'mountainDungeon', status: 'locked', reward: 500 }
];

// Dialogue state
let dialogueState = { npc: null, lines: [], lineIndex: 0, options: [] };

// Map tiles and exits
let mapTiles = [];
let exits = [];
let interactables = [];

// Input
const keys = {};
let mouse = { x: 0, y: 0, down: false };

// Initialize
function init() {
    generateArea(currentArea);
    document.addEventListener('keydown', e => {
        keys[e.key.toLowerCase()] = true;
        if (gameState === 'playing' && e.key === 'Tab') {
            e.preventDefault();
            gameState = 'inventory';
        } else if (gameState === 'inventory' && (e.key === 'Tab' || e.key === 'Escape')) {
            gameState = 'playing';
        } else if (gameState === 'dialogue') {
            handleDialogueInput(e.key);
        } else if (gameState === 'levelup') {
            handleLevelUpInput(e.key);
        } else if (gameState === 'title' && e.key === ' ') {
            gameState = 'playing';
        } else if ((gameState === 'gameover' || gameState === 'victory') && e.key === ' ') {
            location.reload();
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
        if (gameState === 'playing') playerAttack();
    });
    canvas.addEventListener('mouseup', () => mouse.down = false);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    requestAnimationFrame(gameLoop);
}

// Generate area
function generateArea(areaId) {
    const area = areas[areaId];
    enemies = [];
    npcs = [];
    loot = [];
    exits = [];
    interactables = [];
    mapTiles = [];

    // Generate base terrain
    for (let y = 0; y < 15; y++) {
        mapTiles[y] = [];
        for (let x = 0; x < 20; x++) {
            if (area.type === 'village') {
                mapTiles[y][x] = Math.random() < 0.1 ? 'path' : 'grass';
            } else if (area.biome === 'forest') {
                mapTiles[y][x] = Math.random() < 0.15 ? 'tree' : (Math.random() < 0.1 ? 'rock' : 'grass');
            } else if (area.biome === 'snow') {
                mapTiles[y][x] = Math.random() < 0.1 ? 'ice' : (Math.random() < 0.08 ? 'rock' : 'snow');
            } else if (area.biome === 'mountain') {
                mapTiles[y][x] = Math.random() < 0.2 ? 'rock' : (Math.random() < 0.1 ? 'cliff' : 'stone');
            } else {
                mapTiles[y][x] = Math.random() < 0.1 ? 'wall' : 'floor';
            }
        }
    }

    // Clear spawn area
    for (let y = 10; y < 14; y++) {
        for (let x = 8; x < 12; x++) {
            mapTiles[y][x] = area.type === 'dungeon' ? 'floor' : 'grass';
        }
    }

    // Add exits
    if (areaId === 'village') {
        exits.push({ x: 0, y: 7, width: 20, height: 80, target: 'forest', label: '← Forest' });
        exits.push({ x: 780, y: 7, width: 20, height: 80, target: 'snow', label: 'Frozen →' });
        exits.push({ x: 380, y: 0, width: 80, height: 20, target: 'mountain', label: '↑ Mountains' });

        // Add village NPCs
        npcs.push({
            x: 200, y: 200, width: 24, height: 32,
            name: 'Alvor', role: 'smith',
            dialogue: ["Welcome to Riverwood, traveler.", "I can upgrade your weapons if you have gold.", "The mine to the west has been overrun by bandits."]
        });
        npcs.push({
            x: 500, y: 300, width: 24, height: 32,
            name: 'Guard', role: 'quest',
            dialogue: ["Dangerous times. Bandits in the forest, draugr in the barrows, and giants in the mountains.", "Clear all three dungeons to prove yourself, Dragonborn."]
        });

        // Buildings
        interactables.push({ x: 180, y: 150, width: 60, height: 50, type: 'building', name: 'Smithy' });
        interactables.push({ x: 480, y: 250, width: 60, height: 50, type: 'building', name: 'Guard House' });

    } else if (area.type === 'wilderness') {
        exits.push({ x: 380, y: 560, width: 80, height: 40, target: 'village', label: '↓ Village' });

        // Add dungeon entrance
        const dungeonTarget = areaId + 'Dungeon';
        exits.push({ x: 350, y: 50, width: 100, height: 60, target: dungeonTarget, label: '⚔ ' + areas[dungeonTarget].name });
        interactables.push({ x: 350, y: 50, width: 100, height: 60, type: 'dungeon', name: areas[dungeonTarget].name });

        // Spawn wilderness enemies
        if (!area.cleared) {
            spawnWildernessEnemies(areaId);
        }

    } else if (area.type === 'dungeon') {
        // Return to wilderness
        const wildernessTarget = areaId.replace('Dungeon', '');
        exits.push({ x: 380, y: 560, width: 80, height: 40, target: wildernessTarget, label: '↓ Exit' });

        if (!area.cleared) {
            spawnDungeonEnemies(areaId, area.biome);
        }
    }

    // Reset player position
    player.x = 400;
    player.y = 480;
}

function spawnWildernessEnemies(areaId) {
    const biome = areas[areaId].biome;
    const enemyTypes = {
        forest: [
            { name: 'Wolf', hp: 25, damage: 6, speed: 2.5, color: '#666', size: 20 },
            { name: 'Bandit', hp: 40, damage: 8, speed: 1.8, color: '#8B4513', size: 24 }
        ],
        snow: [
            { name: 'Frost Wolf', hp: 35, damage: 8, speed: 2.5, color: '#88c', size: 22 },
            { name: 'Draugr', hp: 50, damage: 10, speed: 1.5, color: '#355', size: 26 }
        ],
        mountain: [
            { name: 'Bear', hp: 60, damage: 12, speed: 1.5, color: '#543', size: 32 },
            { name: 'Troll', hp: 80, damage: 15, speed: 1.2, color: '#393', size: 36 }
        ]
    };

    const types = enemyTypes[biome];
    for (let i = 0; i < 6; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const x = 100 + Math.random() * 600;
        const y = 100 + Math.random() * 350;
        enemies.push(createEnemy(type, x, y));
    }
}

function spawnDungeonEnemies(areaId, biome) {
    const bossTypes = {
        forest: { name: 'Bandit Chief', hp: 120, damage: 18, speed: 1.5, color: '#a44', size: 36, isBoss: true },
        snow: { name: 'Draugr Wight', hp: 150, damage: 22, speed: 1.3, color: '#28c', size: 40, isBoss: true },
        mountain: { name: 'Giant', hp: 250, damage: 35, speed: 0.8, color: '#766', size: 56, isBoss: true }
    };

    const minionTypes = {
        forest: { name: 'Bandit', hp: 35, damage: 7, speed: 1.5, color: '#854', size: 22 },
        snow: { name: 'Draugr', hp: 45, damage: 9, speed: 1.3, color: '#346', size: 24 },
        mountain: { name: 'Troll', hp: 70, damage: 14, speed: 1.0, color: '#383', size: 32 }
    };

    // Spawn minions
    for (let i = 0; i < 8; i++) {
        const x = 100 + Math.random() * 600;
        const y = 80 + Math.random() * 300;
        enemies.push(createEnemy(minionTypes[biome], x, y));
    }

    // Spawn boss
    enemies.push(createEnemy(bossTypes[biome], 400, 150));
}

function createEnemy(type, x, y) {
    return {
        x, y,
        width: type.size, height: type.size,
        name: type.name,
        hp: type.hp, maxHp: type.hp,
        damage: type.damage,
        speed: type.speed,
        color: type.color,
        isBoss: type.isBoss || false,
        state: 'idle',
        attackCooldown: 0,
        hitFlash: 0,
        stagger: 0
    };
}

// Player attack
function playerAttack() {
    if (player.attacking || player.attackCooldown > 0 || player.stamina < 10) return;

    player.attacking = true;
    player.attackCooldown = 25;
    player.stamina -= 10;

    // Calculate attack direction toward mouse
    const dx = mouse.x - player.x;
    const dy = mouse.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / dist;
    const ny = dy / dist;

    // Attack hitbox
    const attackRange = 40;
    const attackX = player.x + nx * 30;
    const attackY = player.y + ny * 30;

    // Check hits
    for (const enemy of enemies) {
        const ex = enemy.x + enemy.width / 2;
        const ey = enemy.y + enemy.height / 2;
        const edist = Math.sqrt((attackX - ex) ** 2 + (attackY - ey) ** 2);

        if (edist < attackRange + enemy.width / 2) {
            let damage = player.equipment.weapon.damage;
            damage *= (1 + player.combatSkill * 0.05);
            if (player.perks.armsman) damage *= 1.25;

            damage = Math.floor(damage + Math.random() * 4);
            dealDamageToEnemy(enemy, damage, nx, ny);
        }
    }

    // Spawn attack particle
    particles.push({
        x: attackX, y: attackY,
        vx: nx * 2, vy: ny * 2,
        life: 10, color: '#fff', size: 8, type: 'slash'
    });

    setTimeout(() => player.attacking = false, 200);
}

function dealDamageToEnemy(enemy, damage, nx, ny) {
    enemy.hp -= damage;
    enemy.hitFlash = 10;
    enemy.stagger = 15;

    // Knockback
    enemy.x += nx * 15;
    enemy.y += ny * 15;

    // Damage number
    damageNumbers.push({
        x: enemy.x + enemy.width / 2,
        y: enemy.y,
        value: damage,
        life: 40,
        color: '#ff0'
    });

    // Hit particles
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 20,
            color: '#f44',
            size: 4
        });
    }

    // Gain XP on kill
    if (enemy.hp <= 0) {
        const xpGain = enemy.isBoss ? 100 : 20;
        player.xp += xpGain;

        // Drop loot
        const goldDrop = enemy.isBoss ? 50 + Math.floor(Math.random() * 100) : 5 + Math.floor(Math.random() * 15);
        loot.push({
            x: enemy.x, y: enemy.y,
            type: 'gold', value: goldDrop,
            label: goldDrop + ' Gold'
        });

        if (Math.random() < 0.3 || enemy.isBoss) {
            loot.push({
                x: enemy.x + 20, y: enemy.y,
                type: 'potion',
                item: { name: 'Health Potion', type: 'consumable', effect: 'heal', value: 50 },
                label: 'Health Potion'
            });
        }

        // Check dungeon cleared
        checkDungeonCleared();
    }
}

function checkDungeonCleared() {
    if (areas[currentArea].type === 'dungeon') {
        const bossAlive = enemies.some(e => e.isBoss && e.hp > 0);
        if (!bossAlive && !areas[currentArea].cleared) {
            areas[currentArea].cleared = true;

            // Update quest
            const quest = quests.find(q => q.target === currentArea);
            if (quest) {
                quest.status = 'completed';
                player.gold += quest.reward;

                // Unlock next quest
                const nextQuest = quests.find(q => q.status === 'locked');
                if (nextQuest) nextQuest.status = 'active';
            }

            // Check victory
            const allCleared = ['forestDungeon', 'snowDungeon', 'mountainDungeon'].every(d => areas[d].cleared);
            if (allCleared) {
                setTimeout(() => gameState = 'victory', 2000);
            }
        }
    }
}

// Update
function update() {
    if (gameState !== 'playing') return;

    // Screen effects decay
    if (screenShake > 0) screenShake *= 0.9;
    if (screenFlash > 0) screenFlash -= 0.05;

    // Player movement
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy = -1;
    if (keys['s'] || keys['arrowdown']) dy = 1;
    if (keys['a'] || keys['arrowleft']) dx = -1;
    if (keys['d'] || keys['arrowright']) dx = 1;

    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    // Sprinting
    const sprinting = keys['shift'] && player.stamina > 0;
    const speed = sprinting ? player.sprintSpeed : player.speed;
    if (sprinting && (dx !== 0 || dy !== 0)) {
        player.stamina -= 0.3;
    }

    // Dodge roll
    if (keys[' '] && player.dodgeCooldown <= 0 && player.stamina >= 20 && (dx !== 0 || dy !== 0)) {
        player.dodging = true;
        player.dodgeCooldown = 40;
        player.stamina -= 20;
        player.invincible = 20;
        player.dodgeDir = { x: dx, y: dy };
    }

    if (player.dodging) {
        player.x += player.dodgeDir.x * 8;
        player.y += player.dodgeDir.y * 8;
        player.invincible--;
        if (player.invincible <= 10) player.dodging = false;
    } else {
        player.x += dx * speed;
        player.y += dy * speed;
    }

    if (player.dodgeCooldown > 0) player.dodgeCooldown--;
    if (player.attackCooldown > 0) player.attackCooldown--;
    if (player.invincible > 0) player.invincible--;

    // Stamina regen
    if (!sprinting && player.stamina < player.maxStamina) {
        player.stamina += 0.2;
    }

    // Facing direction
    if (dx > 0.5) player.facing = 'right';
    else if (dx < -0.5) player.facing = 'left';
    else if (dy > 0.5) player.facing = 'down';
    else if (dy < -0.5) player.facing = 'up';

    // Bounds
    player.x = Math.max(20, Math.min(780 - player.width, player.x));
    player.y = Math.max(20, Math.min(580 - player.height, player.y));

    // Check exits
    for (const exit of exits) {
        if (rectCollision(player, exit)) {
            currentArea = exit.target;
            generateArea(currentArea);
            return;
        }
    }

    // Pick up loot
    for (let i = loot.length - 1; i >= 0; i--) {
        const l = loot[i];
        if (Math.abs(player.x - l.x) < 30 && Math.abs(player.y - l.y) < 30) {
            if (l.type === 'gold') {
                player.gold += l.value;
            } else if (l.type === 'potion') {
                const existing = player.inventory.find(it => it.name === l.item.name);
                if (existing) existing.count++;
                else player.inventory.push({ ...l.item, count: 1 });
            }
            loot.splice(i, 1);
        }
    }

    // Interact with NPCs
    if (keys['e']) {
        keys['e'] = false;
        for (const npc of npcs) {
            if (Math.abs(player.x - npc.x) < 50 && Math.abs(player.y - npc.y) < 50) {
                dialogueState.npc = npc;
                dialogueState.lines = npc.dialogue;
                dialogueState.lineIndex = 0;
                dialogueState.options = npc.role === 'smith' ?
                    ['Upgrade Weapon (100g)', 'Buy Health Potion (30g)', 'Leave'] :
                    ['Continue', 'Leave'];
                gameState = 'dialogue';
                return;
            }
        }

        // Use health potion
        const potion = player.inventory.find(it => it.name === 'Health Potion' && it.count > 0);
        if (potion && player.hp < player.maxHp) {
            player.hp = Math.min(player.maxHp, player.hp + potion.value);
            potion.count--;
            if (potion.count <= 0) {
                player.inventory = player.inventory.filter(it => it !== potion);
            }
        }
    }

    // Update enemies
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;

        if (enemy.hitFlash > 0) enemy.hitFlash--;
        if (enemy.stagger > 0) {
            enemy.stagger--;
            continue;
        }
        if (enemy.attackCooldown > 0) enemy.attackCooldown--;

        // AI
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 300) {
            enemy.state = 'chase';

            if (dist > 30) {
                enemy.x += (dx / dist) * enemy.speed;
                enemy.y += (dy / dist) * enemy.speed;
            } else if (enemy.attackCooldown <= 0) {
                // Attack player
                if (player.invincible <= 0) {
                    let damage = enemy.damage;
                    const armor = (player.equipment.body?.armor || 0) + (player.equipment.head?.armor || 0);
                    damage = Math.max(1, damage - armor / 2);

                    player.hp -= damage;
                    player.invincible = 30;
                    screenShake = 10;
                    screenFlash = 0.4;

                    damageNumbers.push({
                        x: player.x + player.width / 2,
                        y: player.y,
                        value: Math.floor(damage),
                        life: 40,
                        color: '#f44'
                    });

                    if (player.hp <= 0) {
                        gameState = 'gameover';
                    }
                }
                enemy.attackCooldown = enemy.isBoss ? 40 : 60;
            }
        } else {
            enemy.state = 'idle';
        }
    }

    // Remove dead enemies
    enemies = enemies.filter(e => e.hp > 0);

    // Update particles
    for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
    }
    particles = particles.filter(p => p.life > 0);

    // Update damage numbers
    for (const d of damageNumbers) {
        d.y -= 1;
        d.life--;
    }
    damageNumbers = damageNumbers.filter(d => d.life > 0);

    // Level up check
    if (player.xp >= player.xpToLevel) {
        player.xp -= player.xpToLevel;
        player.level++;
        player.combatSkill++;
        player.maxHp += 10;
        player.hp = player.maxHp;
        player.xpToLevel = Math.floor(player.xpToLevel * 1.5);
        player.perkPoints++;
        gameState = 'levelup';
    }
}

function rectCollision(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
}

function handleDialogueInput(key) {
    if (key === '1' || key === 'Enter') {
        if (dialogueState.npc.role === 'smith') {
            if (dialogueState.lineIndex === dialogueState.lines.length - 1) {
                // Shop options
                if (key === '1') {
                    // Upgrade weapon
                    if (player.gold >= 100) {
                        player.gold -= 100;
                        player.equipment.weapon.damage += 5;
                        player.equipment.weapon.name = player.equipment.weapon.name.replace('Iron', 'Steel').replace('Steel', 'Nordic');
                    }
                }
            }
        }
        dialogueState.lineIndex++;
        if (dialogueState.lineIndex >= dialogueState.lines.length) {
            gameState = 'playing';
        }
    } else if (key === '2' && dialogueState.npc.role === 'smith') {
        // Buy potion
        if (player.gold >= 30) {
            player.gold -= 30;
            const existing = player.inventory.find(it => it.name === 'Health Potion');
            if (existing) existing.count++;
            else player.inventory.push({ name: 'Health Potion', type: 'consumable', effect: 'heal', value: 50, count: 1 });
        }
    } else if (key === '3' || key === 'Escape') {
        gameState = 'playing';
    }
}

function handleLevelUpInput(key) {
    if (player.perkPoints > 0) {
        if (key === '1' && !player.perks.armsman && player.combatSkill >= 2) {
            player.perks.armsman = true;
            player.perkPoints--;
        } else if (key === '2' && !player.perks.powerStrike && player.combatSkill >= 4) {
            player.perks.powerStrike = true;
            player.perkPoints--;
        } else if (key === '3' && !player.perks.resolve && player.combatSkill >= 7) {
            player.perks.resolve = true;
            player.perkPoints--;
            player.maxHp += 20;
            player.hp += 20;
        }
    }
    if (key === 'Enter' || key === 'Escape' || key === ' ') {
        gameState = 'playing';
    }
}

// Draw
function draw() {
    // Apply screen shake
    ctx.save();
    if (screenShake > 0.5) {
        ctx.translate(
            (Math.random() - 0.5) * screenShake * 2,
            (Math.random() - 0.5) * screenShake * 2
        );
    }

    // Background
    const area = areas[currentArea];
    const bgColors = {
        village: '#2d4a2d',
        forest: '#1a3a1a',
        snow: '#4a5a6a',
        mountain: '#3a3a4a'
    };
    ctx.fillStyle = bgColors[area.biome] || bgColors.village;
    ctx.fillRect(0, 0, 800, 600);

    // Draw tiles
    for (let y = 0; y < mapTiles.length; y++) {
        for (let x = 0; x < mapTiles[y].length; x++) {
            const tile = mapTiles[y][x];
            const tx = x * 40;
            const ty = y * 40;

            if (tile === 'tree') {
                ctx.fillStyle = '#0a2a0a';
                ctx.fillRect(tx + 15, ty + 25, 10, 15);
                ctx.fillStyle = '#1a4a1a';
                ctx.beginPath();
                ctx.arc(tx + 20, ty + 15, 15, 0, Math.PI * 2);
                ctx.fill();
            } else if (tile === 'rock') {
                ctx.fillStyle = '#555';
                ctx.beginPath();
                ctx.arc(tx + 20, ty + 25, 12, 0, Math.PI * 2);
                ctx.fill();
            } else if (tile === 'ice') {
                ctx.fillStyle = '#8af';
                ctx.globalAlpha = 0.5;
                ctx.fillRect(tx, ty, 40, 40);
                ctx.globalAlpha = 1;
            } else if (tile === 'wall') {
                ctx.fillStyle = '#333';
                ctx.fillRect(tx, ty, 40, 40);
            }
        }
    }

    // Draw interactables (buildings, dungeon entrances)
    for (const int of interactables) {
        if (int.type === 'building') {
            ctx.fillStyle = '#543';
            ctx.fillRect(int.x, int.y, int.width, int.height);
            ctx.fillStyle = '#432';
            ctx.fillRect(int.x, int.y, int.width, 10);
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(int.name, int.x + int.width / 2, int.y + int.height + 12);
        } else if (int.type === 'dungeon') {
            ctx.fillStyle = '#222';
            ctx.fillRect(int.x, int.y, int.width, int.height);
            ctx.fillStyle = '#444';
            ctx.fillRect(int.x + 35, int.y + 20, 30, 40);
            ctx.fillStyle = '#f84';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(int.name, int.x + int.width / 2, int.y + int.height + 15);
        }
    }

    // Draw exits
    for (const exit of exits) {
        ctx.fillStyle = 'rgba(100, 200, 100, 0.3)';
        ctx.fillRect(exit.x, exit.y, exit.width, exit.height);
        ctx.fillStyle = '#8f8';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(exit.label, exit.x + exit.width / 2, exit.y + exit.height / 2 + 4);
    }

    // Draw loot
    for (const l of loot) {
        if (l.type === 'gold') {
            ctx.fillStyle = '#fd0';
            ctx.beginPath();
            ctx.arc(l.x + 10, l.y + 10, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#a80';
            ctx.fillText('$', l.x + 7, l.y + 14);
        } else {
            ctx.fillStyle = '#f44';
            ctx.fillRect(l.x, l.y, 16, 20);
            ctx.fillStyle = '#a22';
            ctx.fillRect(l.x + 4, l.y + 2, 8, 6);
        }
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(l.label, l.x + 8, l.y + 32);
    }

    // Draw NPCs
    for (const npc of npcs) {
        ctx.fillStyle = '#77f';
        ctx.fillRect(npc.x, npc.y, npc.width, npc.height);
        ctx.fillStyle = '#fda';
        ctx.beginPath();
        ctx.arc(npc.x + npc.width / 2, npc.y + 6, 8, 0, Math.PI * 2);
        ctx.fill();

        // Name
        ctx.fillStyle = '#fff';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, npc.x + npc.width / 2, npc.y - 5);

        // Interaction hint
        if (Math.abs(player.x - npc.x) < 60 && Math.abs(player.y - npc.y) < 60) {
            ctx.fillStyle = '#ff0';
            ctx.fillText('[E] Talk', npc.x + npc.width / 2, npc.y + npc.height + 15);
        }
    }

    // Draw enemies
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;

        ctx.fillStyle = enemy.hitFlash > 0 ? '#fff' : enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Enemy eyes
        ctx.fillStyle = enemy.isBoss ? '#f00' : '#ff0';
        ctx.fillRect(enemy.x + enemy.width * 0.25, enemy.y + enemy.height * 0.2, 4, 4);
        ctx.fillRect(enemy.x + enemy.width * 0.6, enemy.y + enemy.height * 0.2, 4, 4);

        // Health bar
        const hpRatio = enemy.hp / enemy.maxHp;
        ctx.fillStyle = '#400';
        ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 4);
        ctx.fillStyle = enemy.isBoss ? '#f80' : '#f00';
        ctx.fillRect(enemy.x, enemy.y - 8, enemy.width * hpRatio, 4);

        // Boss indicator
        if (enemy.isBoss) {
            ctx.fillStyle = '#ff0';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('★ ' + enemy.name, enemy.x + enemy.width / 2, enemy.y - 15);
        }
    }

    // Draw player
    if (player.invincible > 0 && Math.floor(player.invincible / 3) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    // Body
    ctx.fillStyle = player.dodging ? '#88f' : '#4a7';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Head
    ctx.fillStyle = '#fda';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + 8, 8, 0, Math.PI * 2);
    ctx.fill();

    // Weapon direction indicator
    const wdx = mouse.x - player.x - player.width / 2;
    const wdy = mouse.y - player.y - player.height / 2;
    const wdist = Math.sqrt(wdx * wdx + wdy * wdy);
    const wnx = wdx / wdist;
    const wny = wdy / wdist;

    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y + player.height / 2);
    ctx.lineTo(player.x + player.width / 2 + wnx * 20, player.y + player.height / 2 + wny * 20);
    ctx.stroke();

    if (player.attacking) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2 + wnx * 25, player.y + player.height / 2 + wny * 25, 15, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // Draw particles
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 20;
        if (p.type === 'slash') {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
    }
    ctx.globalAlpha = 1;

    // Draw damage numbers
    for (const d of damageNumbers) {
        ctx.fillStyle = d.color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.globalAlpha = d.life / 40;
        ctx.fillText(d.value, d.x, d.y);
    }
    ctx.globalAlpha = 1;

    // Screen flash (damage)
    if (screenFlash > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${screenFlash})`;
        ctx.fillRect(0, 0, 800, 600);
    }

    ctx.restore();

    // HUD
    drawHUD();

    // Game state overlays
    if (gameState === 'title') {
        drawTitle();
    } else if (gameState === 'inventory') {
        drawInventory();
    } else if (gameState === 'dialogue') {
        drawDialogue();
    } else if (gameState === 'levelup') {
        drawLevelUp();
    } else if (gameState === 'gameover') {
        drawGameOver();
    } else if (gameState === 'victory') {
        drawVictory();
    }
}

function drawHUD() {
    // Health bar
    ctx.fillStyle = '#400';
    ctx.fillRect(20, 550, 150, 16);
    ctx.fillStyle = '#f44';
    ctx.fillRect(20, 550, 150 * (player.hp / player.maxHp), 16);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(20, 550, 150, 16);
    ctx.fillStyle = '#fff';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`HP: ${Math.floor(player.hp)}/${player.maxHp}`, 95, 562);

    // Stamina bar
    ctx.fillStyle = '#040';
    ctx.fillRect(20, 570, 150, 10);
    ctx.fillStyle = '#4f4';
    ctx.fillRect(20, 570, 150 * (player.stamina / player.maxStamina), 10);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(20, 570, 150, 10);

    // Gold
    ctx.fillStyle = '#fd0';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Gold: ${player.gold}`, 200, 565);

    // Level/XP
    ctx.fillStyle = '#8af';
    ctx.fillText(`Lv ${player.level}`, 200, 580);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.fillText(`XP: ${player.xp}/${player.xpToLevel}`, 250, 580);

    // Area name
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(areas[currentArea].name, 400, 25);

    // Active quest
    const activeQuest = quests.find(q => q.status === 'active');
    if (activeQuest) {
        ctx.fillStyle = '#ff8';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Quest: ${activeQuest.name}`, 20, 25);
    }

    // Potions
    const potions = player.inventory.find(i => i.name === 'Health Potion');
    ctx.fillStyle = '#f44';
    ctx.fillRect(350, 555, 24, 28);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`[E]`, 362, 595);
    ctx.fillText(potions ? potions.count : 0, 362, 575);

    // Controls hint
    ctx.fillStyle = '#888';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('WASD: Move | Click: Attack | Space: Dodge | Shift: Sprint | Tab: Inventory', 780, 590);
}

function drawTitle() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#8cf';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FROSTFALL', 400, 180);

    ctx.fillStyle = '#aaa';
    ctx.font = '20px Arial';
    ctx.fillText('A 2D Skyrim Demake', 400, 220);

    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Clear all three dungeons to prove yourself, Dragonborn.', 400, 300);

    ctx.fillStyle = '#f84';
    ctx.fillText('Forest → Embershard Mine (Bandit Chief)', 400, 350);
    ctx.fillStyle = '#48f';
    ctx.fillText('Snow → Bleak Falls Barrow (Draugr Wight)', 400, 380);
    ctx.fillStyle = '#888';
    ctx.fillText('Mountain → Giant\'s Camp (Giant)', 400, 410);

    ctx.fillStyle = '#ff0';
    ctx.font = '24px Arial';
    ctx.fillText('Press SPACE to Begin', 400, 500);
}

function drawInventory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(100, 50, 600, 500);
    ctx.strokeStyle = '#888';
    ctx.strokeRect(100, 50, 600, 500);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('INVENTORY', 400, 90);

    // Equipment
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8cf';
    ctx.fillText('Equipment:', 130, 130);

    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(`Weapon: ${player.equipment.weapon?.name || 'None'} (${player.equipment.weapon?.damage || 0} dmg)`, 150, 160);
    ctx.fillText(`Body: ${player.equipment.body?.name || 'None'} (${player.equipment.body?.armor || 0} armor)`, 150, 185);
    ctx.fillText(`Head: ${player.equipment.head?.name || 'None'}`, 150, 210);
    ctx.fillText(`Ring: ${player.equipment.ring?.name || 'None'}`, 150, 235);

    // Stats
    ctx.fillStyle = '#8cf';
    ctx.font = '16px Arial';
    ctx.fillText('Stats:', 450, 130);

    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(`Level: ${player.level}`, 470, 160);
    ctx.fillText(`Combat Skill: ${player.combatSkill}`, 470, 185);
    ctx.fillText(`Health: ${player.maxHp}`, 470, 210);
    ctx.fillText(`Gold: ${player.gold}`, 470, 235);

    // Perks
    ctx.fillStyle = '#f84';
    ctx.font = '16px Arial';
    ctx.fillText('Perks:', 130, 280);
    ctx.font = '14px Arial';
    ctx.fillStyle = player.perks.armsman ? '#4f4' : '#666';
    ctx.fillText(`Armsman (+25% dmg) - Req: Combat 2`, 150, 310);
    ctx.fillStyle = player.perks.powerStrike ? '#4f4' : '#666';
    ctx.fillText(`Power Strike (2x dmg) - Req: Combat 4`, 150, 335);
    ctx.fillStyle = player.perks.resolve ? '#4f4' : '#666';
    ctx.fillText(`Warrior's Resolve (+20 HP) - Req: Combat 7`, 150, 360);

    // Items
    ctx.fillStyle = '#8cf';
    ctx.font = '16px Arial';
    ctx.fillText('Items:', 130, 400);

    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    let itemY = 430;
    for (const item of player.inventory) {
        ctx.fillText(`${item.name} x${item.count}`, 150, itemY);
        itemY += 25;
    }

    // Quests
    ctx.fillStyle = '#ff8';
    ctx.font = '16px Arial';
    ctx.fillText('Quests:', 450, 280);

    ctx.font = '14px Arial';
    let qy = 310;
    for (const quest of quests) {
        if (quest.status === 'completed') {
            ctx.fillStyle = '#4f4';
            ctx.fillText(`✓ ${quest.name}`, 470, qy);
        } else if (quest.status === 'active') {
            ctx.fillStyle = '#ff8';
            ctx.fillText(`▶ ${quest.name}`, 470, qy);
        } else {
            ctx.fillStyle = '#666';
            ctx.fillText(`◯ ${quest.name}`, 470, qy);
        }
        qy += 25;
    }

    ctx.fillStyle = '#888';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press TAB or ESC to close', 400, 530);
}

function drawDialogue() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(50, 400, 700, 180);
    ctx.strokeStyle = '#888';
    ctx.strokeRect(50, 400, 700, 180);

    ctx.fillStyle = '#8cf';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(dialogueState.npc.name, 80, 435);

    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    const line = dialogueState.lines[dialogueState.lineIndex] || '';
    ctx.fillText(line, 80, 470);

    ctx.fillStyle = '#ff8';
    ctx.font = '14px Arial';
    if (dialogueState.npc.role === 'smith' && dialogueState.lineIndex === dialogueState.lines.length - 1) {
        ctx.fillText('[1] Upgrade Weapon (100g) - Current: ' + player.equipment.weapon.name, 80, 510);
        ctx.fillText('[2] Buy Health Potion (30g)', 80, 530);
        ctx.fillText('[3] Leave', 80, 550);
    } else {
        ctx.fillText('[Enter] Continue', 80, 530);
        ctx.fillText('[Esc] Leave', 80, 550);
    }
}

function drawLevelUp() {
    ctx.fillStyle = 'rgba(0, 0, 50, 0.9)';
    ctx.fillRect(150, 150, 500, 300);
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 3;
    ctx.strokeRect(150, 150, 500, 300);
    ctx.lineWidth = 1;

    ctx.fillStyle = '#ff0';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL UP!', 400, 200);

    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.fillText(`You are now Level ${player.level}!`, 400, 240);
    ctx.fillText(`Combat Skill: ${player.combatSkill}`, 400, 270);
    ctx.fillText(`Perk Points: ${player.perkPoints}`, 400, 300);

    if (player.perkPoints > 0) {
        ctx.fillStyle = '#8cf';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';

        if (!player.perks.armsman && player.combatSkill >= 2) {
            ctx.fillText('[1] Armsman (+25% melee damage)', 200, 340);
        }
        if (!player.perks.powerStrike && player.combatSkill >= 4) {
            ctx.fillText('[2] Power Strike (2x damage)', 200, 365);
        }
        if (!player.perks.resolve && player.combatSkill >= 7) {
            ctx.fillText('[3] Warrior\'s Resolve (+20 HP)', 200, 390);
        }
    }

    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('Press SPACE to continue', 400, 430);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(50, 0, 0, 0.9)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#f44';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOU DIED', 400, 280);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`You reached Level ${player.level}`, 400, 340);

    ctx.fillStyle = '#888';
    ctx.font = '16px Arial';
    ctx.fillText('Press SPACE to try again', 400, 400);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 30, 50, 0.9)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#fd0';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', 400, 200);

    ctx.fillStyle = '#8cf';
    ctx.font = '24px Arial';
    ctx.fillText('You have proven yourself, Dragonborn!', 400, 260);

    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.fillText('All three dungeons have been cleared.', 400, 320);
    ctx.fillText(`Final Level: ${player.level}`, 400, 360);
    ctx.fillText(`Gold Collected: ${player.gold}`, 400, 390);

    ctx.fillStyle = '#888';
    ctx.font = '16px Arial';
    ctx.fillText('Press SPACE to play again', 400, 460);
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

init();
