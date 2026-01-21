// Dome Keeper Clone - Mining + Tower Defense
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 16;
const MAP_WIDTH = 80;
const MAP_HEIGHT = 100;
const SURFACE_Y = 10;

// Game state
let gameState = 'mining'; // mining, defending, shop, victory, gameover
let wave = 0;
let maxWaves = 10;
let waveTimer = 75; // seconds until wave
let waveWarning = false;

// Camera
const camera = { x: 0, y: 0 };

// Player (Keeper)
const player = {
    x: MAP_WIDTH * TILE_SIZE / 2,
    y: SURFACE_Y * TILE_SIZE - 20,
    width: 20, height: 24,
    speed: 80,
    drillStrength: 2,
    drillSpeed: 1,
    carryCapacity: 5,
    inventory: [],
    drilling: false,
    drillTarget: null,
    drillProgress: 0
};

// Dome
const dome = {
    x: MAP_WIDTH * TILE_SIZE / 2,
    y: SURFACE_Y * TILE_SIZE,
    width: 64, height: 48,
    hp: 800, maxHp: 800,
    laserAngle: -Math.PI / 2,
    laserDamage: 15,
    laserSpeed: 2,
    firing: false
};

// Resources
let resources = { iron: 0, water: 0 };

// Map tiles
let map = [];

// Enemies
let enemies = [];

// Upgrades
const upgrades = {
    drillSpeed: { level: 0, maxLevel: 3, costs: [5, 12, 20], effect: () => player.drillSpeed += 0.3 },
    carryCapacity: { level: 0, maxLevel: 3, costs: [8, 15, 25], effect: () => player.carryCapacity += 3 },
    laserDamage: { level: 0, maxLevel: 3, costs: [10, 18, 30], effect: () => dome.laserDamage += 15 },
    domeHp: { level: 0, maxLevel: 2, costs: [15, 25], effect: () => { dome.maxHp += 200; dome.hp += 200; } }
};

// Input
const keys = {};
let mouse = { x: 400, y: 300, down: false };

document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'e') {
        if (gameState === 'mining' && isNearDome()) {
            gameState = 'shop';
        } else if (gameState === 'shop') {
            gameState = 'mining';
        }
    }
});
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', () => mouse.down = true);
canvas.addEventListener('mouseup', () => mouse.down = false);

// Generate map
function generateMap() {
    map = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (y < SURFACE_Y) {
                map[y][x] = { type: 'air', hp: 0, maxHp: 0 };
            } else if (y === MAP_HEIGHT - 1 || x === 0 || x === MAP_WIDTH - 1) {
                map[y][x] = { type: 'bedrock', hp: Infinity, maxHp: Infinity };
            } else {
                // Determine rock type by depth
                const depth = y - SURFACE_Y;
                let type, hp, contents;

                if (depth < 20) {
                    // Surface layer
                    type = Math.random() < 0.3 ? 'soft_stone' : 'dirt';
                    hp = type === 'dirt' ? 1 : 2;
                    contents = type === 'soft_stone' && Math.random() < 0.2 ? 'iron' : null;
                } else if (depth < 40) {
                    // Mid layer
                    type = Math.random() < 0.4 ? 'hard_stone' : 'soft_stone';
                    hp = type === 'hard_stone' ? 4 : 2;
                    contents = Math.random() < 0.3 ? 'iron' : (Math.random() < 0.1 ? 'water' : null);
                } else if (depth < 70) {
                    // Deep layer
                    type = Math.random() < 0.5 ? 'dense_rock' : 'hard_stone';
                    hp = type === 'dense_rock' ? 6 : 4;
                    contents = Math.random() < 0.35 ? 'iron' : (Math.random() < 0.15 ? 'water' : null);
                } else {
                    // Danger layer
                    type = Math.random() < 0.3 ? 'obsidian' : 'dense_rock';
                    hp = type === 'obsidian' ? 12 : 6;
                    contents = Math.random() < 0.2 ? 'water' : (Math.random() < 0.3 ? 'iron' : null);
                }

                map[y][x] = { type, hp, maxHp: hp, contents };
            }
        }
    }

    // Clear area around dome
    for (let y = SURFACE_Y - 3; y < SURFACE_Y + 3; y++) {
        for (let x = Math.floor(MAP_WIDTH / 2) - 3; x < Math.floor(MAP_WIDTH / 2) + 3; x++) {
            if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                map[y][x] = { type: 'air', hp: 0, maxHp: 0 };
            }
        }
    }
}

function isNearDome() {
    return Math.abs(player.x - dome.x) < 60 && Math.abs(player.y - (dome.y - 30)) < 60;
}

// Spawn enemies
function spawnWave() {
    const baseWeight = 40 + wave * 50;
    let remainingWeight = baseWeight;

    const enemyTypes = [
        { type: 'walker', hp: 40, damage: 12, speed: 90, weight: 20 },
        { type: 'flyer', hp: 20, damage: 15, speed: 120, weight: 25, flying: true },
        { type: 'hornet', hp: 100, damage: 45, speed: 65, weight: 80 },
        { type: 'tick', hp: 5, damage: 15, speed: 40, weight: 10 },
        { type: 'diver', hp: 30, damage: 100, speed: 300, weight: 70, diving: true }
    ];

    while (remainingWeight > 0) {
        const available = enemyTypes.filter(e => e.weight <= remainingWeight && (wave >= 3 || e.type === 'walker' || e.type === 'flyer'));
        if (available.length === 0) break;

        const template = available[Math.floor(Math.random() * available.length)];
        const side = Math.random() > 0.5 ? -1 : 1;
        const x = dome.x + side * (400 + Math.random() * 200);
        const y = template.flying ? dome.y - 100 - Math.random() * 100 : dome.y;

        enemies.push({
            x, y,
            ...template,
            maxHp: template.hp,
            lastAttack: 0
        });

        remainingWeight -= template.weight;
    }
}

// Update functions
function update(dt) {
    if (gameState === 'mining') {
        updateMining(dt);
    } else if (gameState === 'defending') {
        updateDefending(dt);
    }
}

function updateMining(dt) {
    // Wave timer
    waveTimer -= dt;
    waveWarning = waveTimer <= 10;

    if (waveTimer <= 0) {
        gameState = 'defending';
        wave++;
        spawnWave();
        return;
    }

    // Player movement
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        const newX = player.x + (dx / len) * player.speed * dt;
        const newY = player.y + (dy / len) * player.speed * dt;

        // Check tile collision
        const tileX = Math.floor(newX / TILE_SIZE);
        const tileY = Math.floor(newY / TILE_SIZE);

        if (canMoveThrough(tileX, tileY)) {
            player.x = newX;
        }
        if (canMoveThrough(Math.floor(player.x / TILE_SIZE), tileY)) {
            player.y = Math.max(0, newY);
        }
    }

    // Drilling
    if (keys[' '] || keys['space']) {
        let drillDir = { x: 0, y: 0 };
        if (keys['w'] || keys['arrowup']) drillDir.y = -1;
        else if (keys['s'] || keys['arrowdown']) drillDir.y = 1;
        else if (keys['a'] || keys['arrowleft']) drillDir.x = -1;
        else if (keys['d'] || keys['arrowright']) drillDir.x = 1;
        else drillDir.y = 1; // Default down

        const targetX = Math.floor(player.x / TILE_SIZE) + drillDir.x;
        const targetY = Math.floor(player.y / TILE_SIZE) + drillDir.y;

        if (targetY >= 0 && targetY < MAP_HEIGHT && targetX >= 0 && targetX < MAP_WIDTH) {
            const tile = map[targetY][targetX];
            if (tile.type !== 'air' && tile.type !== 'bedrock') {
                tile.hp -= player.drillStrength * player.drillSpeed * dt;

                if (tile.hp <= 0) {
                    // Collect resource
                    if (tile.contents && player.inventory.length < player.carryCapacity) {
                        player.inventory.push(tile.contents);
                    }
                    tile.type = 'air';
                    tile.hp = 0;
                    tile.contents = null;
                }
            }
        }
    }

    // Deposit resources at dome
    if (isNearDome() && player.inventory.length > 0) {
        for (const res of player.inventory) {
            resources[res] = (resources[res] || 0) + 1;
        }
        player.inventory = [];
    }

    // Camera follow
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
    camera.x = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - canvas.width, camera.x));
    camera.y = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - canvas.height, camera.y));
}

function updateDefending(dt) {
    // Laser rotation towards mouse
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    const targetAngle = Math.atan2(worldMouseY - dome.y, worldMouseX - dome.x);

    let angleDiff = targetAngle - dome.laserAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    dome.laserAngle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), dome.laserSpeed * dt);

    // Firing laser
    if (mouse.down) {
        dome.firing = true;

        // Check enemy hits
        const laserEndX = dome.x + Math.cos(dome.laserAngle) * 500;
        const laserEndY = dome.y + Math.sin(dome.laserAngle) * 500;

        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            const dist = pointToLineDistance(e.x, e.y, dome.x, dome.y, laserEndX, laserEndY);
            if (dist < 20) {
                e.hp -= dome.laserDamage * dt;
                if (e.hp <= 0) {
                    enemies.splice(i, 1);
                }
            }
        }
    } else {
        dome.firing = false;
    }

    // Update enemies
    for (const e of enemies) {
        const dx = dome.x - e.x;
        const dy = dome.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (e.diving && dist < 50) {
            // Diver attack
            dome.hp -= e.damage;
            e.hp = 0;
        } else if (dist > 30) {
            e.x += (dx / dist) * e.speed * dt;
            if (!e.flying) {
                e.y = dome.y; // Ground enemies stay on surface
            } else {
                e.y += (dy / dist) * e.speed * dt;
            }
        } else {
            // Attack dome
            const now = Date.now();
            if (now - e.lastAttack > 1000) {
                dome.hp -= e.damage;
                e.lastAttack = now;
            }
        }
    }

    // Remove dead enemies
    enemies = enemies.filter(e => e.hp > 0);

    // Check wave end
    if (enemies.length === 0) {
        if (wave >= maxWaves) {
            gameState = 'victory';
        } else {
            gameState = 'mining';
            waveTimer = 60 + wave * 5;
        }
    }

    // Check game over
    if (dome.hp <= 0) {
        gameState = 'gameover';
    }

    // Camera on dome during defense
    camera.x = dome.x - canvas.width / 2;
    camera.y = dome.y - canvas.height / 2 - 50;
}

function canMoveThrough(tileX, tileY) {
    if (tileY < 0 || tileY >= MAP_HEIGHT || tileX < 0 || tileX >= MAP_WIDTH) return false;
    return map[tileY][tileX].type === 'air';
}

function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    const param = lenSq !== 0 ? dot / lenSq : -1;

    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }

    return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
}

// Purchase upgrade
function purchaseUpgrade(name) {
    const upgrade = upgrades[name];
    if (upgrade.level >= upgrade.maxLevel) return;

    const cost = upgrade.costs[upgrade.level];
    if (resources.iron >= cost) {
        resources.iron -= cost;
        upgrade.effect();
        upgrade.level++;
    }
}

// Render
function render() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'shop') {
        renderShop();
        return;
    }

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    renderMap();
    renderDome();
    renderPlayer();
    renderEnemies();

    ctx.restore();

    renderHUD();

    if (gameState === 'victory') renderVictory();
    if (gameState === 'gameover') renderGameOver();
}

function renderMap() {
    const startX = Math.floor(camera.x / TILE_SIZE);
    const startY = Math.floor(camera.y / TILE_SIZE);
    const endX = Math.ceil((camera.x + canvas.width) / TILE_SIZE);
    const endY = Math.ceil((camera.y + canvas.height) / TILE_SIZE);

    for (let y = Math.max(0, startY); y < Math.min(MAP_HEIGHT, endY); y++) {
        for (let x = Math.max(0, startX); x < Math.min(MAP_WIDTH, endX); x++) {
            const tile = map[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            switch (tile.type) {
                case 'air':
                    ctx.fillStyle = y < SURFACE_Y ? '#2a3a5e' : '#1a1a25';
                    break;
                case 'dirt':
                    ctx.fillStyle = '#6b5a3a';
                    break;
                case 'soft_stone':
                    ctx.fillStyle = tile.contents === 'iron' ? '#7a8899' : '#8a7a6a';
                    break;
                case 'hard_stone':
                    ctx.fillStyle = tile.contents === 'iron' ? '#6a7888' : (tile.contents === 'water' ? '#5a7a8a' : '#5a5a5a');
                    break;
                case 'dense_rock':
                    ctx.fillStyle = tile.contents === 'iron' ? '#5a6877' : (tile.contents === 'water' ? '#4a6a7a' : '#4a4a4a');
                    break;
                case 'obsidian':
                    ctx.fillStyle = tile.contents === 'water' ? '#3a5a6a' : '#2a2a3a';
                    break;
                case 'bedrock':
                    ctx.fillStyle = '#1a1a1a';
                    break;
            }

            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

            // Resource indicator
            if (tile.contents) {
                ctx.fillStyle = tile.contents === 'iron' ? '#ffa500' : '#4af';
                ctx.beginPath();
                ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Damage indicator
            if (tile.hp > 0 && tile.hp < tile.maxHp) {
                const damageRatio = 1 - tile.hp / tile.maxHp;
                ctx.strokeStyle = `rgba(255,255,255,${damageRatio * 0.5})`;
                ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
            }
        }
    }

    // Surface line
    ctx.strokeStyle = '#4a5a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, SURFACE_Y * TILE_SIZE);
    ctx.lineTo(MAP_WIDTH * TILE_SIZE, SURFACE_Y * TILE_SIZE);
    ctx.stroke();
}

function renderDome() {
    // Dome body
    ctx.fillStyle = '#3a4a5a';
    ctx.beginPath();
    ctx.arc(dome.x, dome.y, dome.width / 2, Math.PI, 0);
    ctx.fill();

    // Glass dome
    ctx.fillStyle = 'rgba(100,150,200,0.4)';
    ctx.beginPath();
    ctx.arc(dome.x, dome.y, dome.width / 2 - 5, Math.PI, 0);
    ctx.fill();

    // Laser turret
    ctx.save();
    ctx.translate(dome.x, dome.y - 10);
    ctx.rotate(dome.laserAngle);

    ctx.fillStyle = '#666';
    ctx.fillRect(-8, -4, 30, 8);

    // Firing effect
    if (dome.firing) {
        ctx.strokeStyle = '#f44';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(25, 0);
        ctx.lineTo(500, 0);
        ctx.stroke();

        ctx.strokeStyle = '#ff8';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    ctx.restore();

    // HP bar
    ctx.fillStyle = '#333';
    ctx.fillRect(dome.x - 40, dome.y - dome.height / 2 - 15, 80, 8);
    ctx.fillStyle = dome.hp / dome.maxHp > 0.3 ? '#4a4' : '#a44';
    ctx.fillRect(dome.x - 40, dome.y - dome.height / 2 - 15, 80 * (dome.hp / dome.maxHp), 8);
}

function renderPlayer() {
    ctx.fillStyle = '#6a8a6a';
    ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);

    // Helmet
    ctx.fillStyle = '#8aa';
    ctx.beginPath();
    ctx.arc(player.x, player.y - player.height / 4, 8, 0, Math.PI * 2);
    ctx.fill();

    // Inventory indicator
    if (player.inventory.length > 0) {
        ctx.fillStyle = '#fa0';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${player.inventory.length}/${player.carryCapacity}`, player.x, player.y + player.height / 2 + 12);
    }
}

function renderEnemies() {
    for (const e of enemies) {
        let color;
        switch (e.type) {
            case 'walker': color = '#a64'; break;
            case 'flyer': color = '#6a4'; break;
            case 'hornet': color = '#aa4'; break;
            case 'tick': color = '#666'; break;
            case 'diver': color = '#a4a'; break;
            default: color = '#a44';
        }

        ctx.fillStyle = color;
        const size = e.type === 'tick' ? 8 : (e.type === 'hornet' ? 24 : 16);
        ctx.beginPath();
        ctx.arc(e.x, e.y - size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();

        // HP bar for bigger enemies
        if (e.type === 'hornet' || e.type === 'diver') {
            ctx.fillStyle = '#333';
            ctx.fillRect(e.x - 15, e.y - size - 8, 30, 4);
            ctx.fillStyle = '#f44';
            ctx.fillRect(e.x - 15, e.y - size - 8, 30 * (e.hp / e.maxHp), 4);
        }
    }
}

function renderHUD() {
    // Resources
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Iron: ${resources.iron}`, 10, 25);
    ctx.fillStyle = '#4af';
    ctx.fillText(`Water: ${resources.water}`, 100, 25);

    // Wave info
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`Wave ${wave}/${maxWaves}`, 400, 25);

    if (gameState === 'mining') {
        // Timer
        ctx.fillStyle = waveWarning ? '#f44' : '#fff';
        ctx.fillText(`Next wave: ${Math.ceil(waveTimer)}s`, 400, 50);

        if (waveWarning) {
            ctx.fillStyle = 'rgba(255,0,0,0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#f44';
            ctx.font = 'bold 24px Arial';
            ctx.fillText('WAVE INCOMING!', 400, 100);
        }

        // Inventory
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Carrying: ${player.inventory.length}/${player.carryCapacity}`, 10, 580);

        if (isNearDome()) {
            ctx.fillStyle = '#4f4';
            ctx.textAlign = 'center';
            ctx.fillText('Press E for upgrades', 400, 580);
        }
    } else if (gameState === 'defending') {
        ctx.fillStyle = '#f44';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`Enemies: ${enemies.length}`, 400, 50);
    }

    // Dome HP
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Dome: ${Math.ceil(dome.hp)}/${dome.maxHp}`, 790, 25);

    // Controls hint
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WASD: Move | SPACE+Dir: Drill | Mouse: Aim | Click: Fire', 400, 595);
}

function renderShop() {
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('UPGRADES', 400, 60);

    ctx.font = '18px Arial';
    ctx.fillStyle = '#fa0';
    ctx.fillText(`Iron: ${resources.iron}  Water: ${resources.water}`, 400, 100);

    const upgradeList = [
        { key: 'drillSpeed', name: 'Drill Speed', desc: '+30% mining speed' },
        { key: 'carryCapacity', name: 'Carry Capacity', desc: '+3 slots' },
        { key: 'laserDamage', name: 'Laser Damage', desc: '+15 damage' },
        { key: 'domeHp', name: 'Dome HP', desc: '+200 max HP' }
    ];

    for (let i = 0; i < upgradeList.length; i++) {
        const u = upgradeList[i];
        const upgrade = upgrades[u.key];
        const y = 150 + i * 100;

        ctx.fillStyle = '#333';
        ctx.fillRect(150, y, 500, 80);

        ctx.fillStyle = '#fff';
        ctx.font = '18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${u.name} (Lv ${upgrade.level}/${upgrade.maxLevel})`, 170, y + 30);

        ctx.fillStyle = '#aaa';
        ctx.font = '14px Arial';
        ctx.fillText(u.desc, 170, y + 55);

        if (upgrade.level < upgrade.maxLevel) {
            const cost = upgrade.costs[upgrade.level];
            ctx.fillStyle = resources.iron >= cost ? '#4f4' : '#a44';
            ctx.fillText(`Cost: ${cost} Iron`, 500, y + 30);

            // Click to buy
            if (mouse.down && mouse.x > 150 && mouse.x < 650 && mouse.y > y && mouse.y < y + 80) {
                purchaseUpgrade(u.key);
                mouse.down = false;
            }
        } else {
            ctx.fillStyle = '#4f4';
            ctx.fillText('MAX', 500, y + 30);
        }
    }

    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press E to close', 400, 570);
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#4f4';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', 400, 250);

    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('You survived all 10 waves!', 400, 320);
    ctx.fillText('Press R to play again', 400, 400);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f44';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DOME DESTROYED', 400, 250);

    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText(`Survived ${wave} waves`, 400, 320);
    ctx.fillText('Press R to try again', 400, 400);
}

// Restart
document.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'r' && (gameState === 'gameover' || gameState === 'victory')) {
        wave = 0;
        waveTimer = 75;
        dome.hp = dome.maxHp = 800;
        dome.laserDamage = 15;
        player.drillSpeed = 1;
        player.carryCapacity = 5;
        player.inventory = [];
        resources = { iron: 0, water: 0 };
        enemies = [];
        for (const key in upgrades) {
            upgrades[key].level = 0;
        }
        generateMap();
        player.x = MAP_WIDTH * TILE_SIZE / 2;
        player.y = SURFACE_Y * TILE_SIZE - 20;
        gameState = 'mining';
    }
});

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

// Start
generateMap();
requestAnimationFrame(gameLoop);
