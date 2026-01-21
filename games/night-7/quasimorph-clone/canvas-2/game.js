// Quasimorph Clone - Canvas Implementation
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 32;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;

// Game state
const game = {
    state: 'menu', // menu, playing, gameover, extracted
    turn: 'player', // player, enemy
    corruption: 0,
    totalLoot: 0,
    highScore: 0
};

// Player
const player = {
    x: 1, y: 1,
    hp: 100, maxHp: 100,
    ap: 2, maxAp: 2,
    stance: 'walk', // sneak, walk, run
    bleeding: false,
    weapons: [{ name: 'Knife', damage: 15, range: 1, durability: 100, cost: 1 }],
    currentWeapon: 0,
    inventory: [],
    inventoryMax: 6
};

// Map
let map = [];
let visible = [];
let explored = [];

// Entities
let enemies = [];
let items = [];

// Enemy types
const ENEMY_TYPES = {
    guard: { hp: 30, damage: 10, range: 5, color: '#3498db', name: 'Guard' },
    soldier: { hp: 50, damage: 15, range: 6, color: '#27ae60', name: 'Soldier' },
    possessed: { hp: 40, damage: 20, range: 4, color: '#9b59b6', name: 'Possessed' },
    bloater: { hp: 80, damage: 30, range: 2, color: '#e67e22', name: 'Bloater' },
    stalker: { hp: 60, damage: 25, range: 5, color: '#e74c3c', name: 'Stalker' }
};

// Weapon data
const WEAPONS = {
    knife: { name: 'Knife', damage: 15, range: 1, durability: 100, cost: 1 },
    pistol: { name: 'Pistol', damage: 20, range: 6, durability: 30, cost: 1, ammo: true },
    smg: { name: 'SMG', damage: 15, range: 5, durability: 40, cost: 1, ammo: true, burst: 3 },
    shotgun: { name: 'Shotgun', damage: 35, range: 3, durability: 20, cost: 2, ammo: true }
};

// Generate map
function generateMap() {
    map = [];
    visible = [];
    explored = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        visible[y] = [];
        explored[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            map[y][x] = { type: 'wall', cover: false };
            visible[y][x] = false;
            explored[y][x] = false;
        }
    }

    // Generate rooms
    const rooms = [];
    for (let i = 0; i < 8; i++) {
        const w = 4 + Math.floor(Math.random() * 4);
        const h = 3 + Math.floor(Math.random() * 3);
        const x = 1 + Math.floor(Math.random() * (MAP_WIDTH - w - 2));
        const y = 1 + Math.floor(Math.random() * (MAP_HEIGHT - h - 2));

        // Carve room
        for (let ry = y; ry < y + h && ry < MAP_HEIGHT - 1; ry++) {
            for (let rx = x; rx < x + w && rx < MAP_WIDTH - 1; rx++) {
                map[ry][rx] = { type: 'floor', cover: false };
            }
        }

        rooms.push({ x: x + Math.floor(w / 2), y: y + Math.floor(h / 2), w, h });
    }

    // Connect rooms with corridors
    for (let i = 1; i < rooms.length; i++) {
        const r1 = rooms[i - 1];
        const r2 = rooms[i];

        let cx = r1.x;
        let cy = r1.y;

        while (cx !== r2.x) {
            map[cy][cx] = { type: 'floor', cover: false };
            cx += cx < r2.x ? 1 : -1;
        }
        while (cy !== r2.y) {
            map[cy][cx] = { type: 'floor', cover: false };
            cy += cy < r2.y ? 1 : -1;
        }
    }

    // Add cover objects
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
        for (let x = 1; x < MAP_WIDTH - 1; x++) {
            if (map[y][x].type === 'floor' && Math.random() < 0.05) {
                map[y][x].cover = true;
            }
        }
    }

    // Place extraction point
    const lastRoom = rooms[rooms.length - 1];
    map[lastRoom.y][lastRoom.x] = { type: 'extract', cover: false };

    // Place player in first room
    player.x = rooms[0].x;
    player.y = rooms[0].y;

    // Spawn enemies
    enemies = [];
    for (let i = 2; i < rooms.length - 1; i++) {
        const room = rooms[i];
        const types = ['guard', 'soldier'];
        const type = types[Math.floor(Math.random() * types.length)];
        const data = ENEMY_TYPES[type];

        enemies.push({
            type,
            x: room.x + Math.floor(Math.random() * 3) - 1,
            y: room.y + Math.floor(Math.random() * 2) - 1,
            hp: data.hp,
            maxHp: data.hp,
            damage: data.damage,
            range: data.range,
            color: data.color,
            name: data.name,
            awake: false
        });
    }

    // Spawn items
    items = [];
    for (const room of rooms) {
        if (Math.random() < 0.5) {
            const itemTypes = ['pistol', 'smg', 'shotgun', 'medkit', 'bandage', 'loot'];
            const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            items.push({
                type,
                x: room.x + Math.floor(Math.random() * 2) - 1,
                y: room.y + Math.floor(Math.random() * 2) - 1
            });
        }
    }
}

// Line of sight
function updateVisibility() {
    // Reset visibility
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            visible[y][x] = false;
        }
    }

    // Shadowcasting (simplified)
    const range = 6;
    for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
            if (dx * dx + dy * dy > range * range) continue;

            const tx = player.x + dx;
            const ty = player.y + dy;

            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) continue;

            // Raycast
            let blocked = false;
            const steps = Math.max(Math.abs(dx), Math.abs(dy));
            for (let s = 1; s < steps; s++) {
                const cx = player.x + Math.round(dx * s / steps);
                const cy = player.y + Math.round(dy * s / steps);
                if (map[cy][cx].type === 'wall') {
                    blocked = true;
                    break;
                }
            }

            if (!blocked) {
                visible[ty][tx] = true;
                explored[ty][tx] = true;
            }
        }
    }
}

// Combat
function attack(attacker, target, weapon) {
    const damage = weapon.damage + Math.floor(Math.random() * 10) - 5;

    // Check cover
    let coverMod = 1;
    if (map[target.y] && map[target.y][target.x] && map[target.y][target.x].cover) {
        coverMod = 0.5;
    }

    const finalDamage = Math.floor(damage * coverMod);
    target.hp -= finalDamage;

    // Durability
    if (weapon.durability !== undefined) {
        weapon.durability -= 10;
        if (weapon.durability <= 0) {
            // Weapon breaks
            const idx = player.weapons.indexOf(weapon);
            if (idx > 0) {
                player.weapons.splice(idx, 1);
                if (player.currentWeapon >= player.weapons.length) {
                    player.currentWeapon = 0;
                }
            }
        }
    }

    // Bleed chance
    if (Math.random() < 0.2) {
        target.bleeding = true;
    }

    return finalDamage;
}

// Player actions
function movePlayer(dx, dy) {
    if (player.ap <= 0) return false;

    const nx = player.x + dx;
    const ny = player.y + dy;

    if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) return false;
    if (map[ny][nx].type === 'wall') return false;

    // Check for enemy collision
    for (const enemy of enemies) {
        if (enemy.x === nx && enemy.y === ny && enemy.hp > 0) {
            // Melee attack
            const weapon = player.weapons[player.currentWeapon];
            if (weapon.range <= 1) {
                playerAttack(enemy);
            }
            return false;
        }
    }

    player.x = nx;
    player.y = ny;
    player.ap--;

    // Check extraction
    if (map[ny][nx].type === 'extract') {
        game.state = 'extracted';
        game.highScore = Math.max(game.highScore, game.totalLoot);
    }

    // Check items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (item.x === nx && item.y === ny) {
            pickupItem(item, i);
        }
    }

    return true;
}

function playerAttack(target) {
    const weapon = player.weapons[player.currentWeapon];
    if (player.ap < weapon.cost) return;

    // Check range
    const dist = Math.abs(target.x - player.x) + Math.abs(target.y - player.y);
    if (dist > weapon.range) return;

    player.ap -= weapon.cost;

    const damage = attack(player, target, weapon);

    if (target.hp <= 0) {
        // Enemy died
        game.totalLoot += 10;
    }
}

function pickupItem(item, index) {
    if (item.type === 'pistol' || item.type === 'smg' || item.type === 'shotgun') {
        if (player.weapons.length < 4) {
            player.weapons.push({ ...WEAPONS[item.type] });
            items.splice(index, 1);
        }
    } else if (item.type === 'medkit') {
        if (player.inventory.length < player.inventoryMax) {
            player.inventory.push({ type: 'medkit', heal: 30 });
            items.splice(index, 1);
        }
    } else if (item.type === 'bandage') {
        if (player.inventory.length < player.inventoryMax) {
            player.inventory.push({ type: 'bandage', heal: 10 });
            items.splice(index, 1);
        }
    } else if (item.type === 'loot') {
        game.totalLoot += 25 + Math.floor(Math.random() * 25);
        items.splice(index, 1);
    }
}

function useItem(index) {
    if (player.ap <= 0) return;
    const item = player.inventory[index];
    if (!item) return;

    if (item.type === 'medkit' || item.type === 'bandage') {
        player.hp = Math.min(player.maxHp, player.hp + item.heal);
        player.bleeding = false;
        player.inventory.splice(index, 1);
        player.ap--;
    }
}

function endPlayerTurn() {
    game.turn = 'enemy';

    // Bleed damage
    if (player.bleeding) {
        player.hp -= 1;
    }

    // Process enemies
    setTimeout(processEnemyTurn, 300);
}

function processEnemyTurn() {
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;

        // Wake up if player visible
        if (visible[enemy.y][enemy.x]) {
            enemy.awake = true;
        }

        if (!enemy.awake) continue;

        // Check if can attack player
        const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
        if (dist <= enemy.range && visible[enemy.y][enemy.x]) {
            // Attack player
            player.hp -= enemy.damage;
            if (Math.random() < 0.15) player.bleeding = true;
        } else if (dist > 1) {
            // Move toward player
            const dx = Math.sign(player.x - enemy.x);
            const dy = Math.sign(player.y - enemy.y);

            const nx = enemy.x + dx;
            const ny = enemy.y + dy;

            if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT &&
                map[ny][nx].type !== 'wall') {
                let blocked = false;
                for (const other of enemies) {
                    if (other !== enemy && other.x === nx && other.y === ny) {
                        blocked = true;
                        break;
                    }
                }
                if (!blocked && !(nx === player.x && ny === player.y)) {
                    enemy.x = nx;
                    enemy.y = ny;
                }
            }
        }
    }

    // Corruption increases
    game.corruption += 5;

    // Spawn new enemies based on corruption
    if (game.corruption >= 200 && Math.random() < 0.2) {
        spawnCorruptionEnemy();
    }

    // Check player death
    if (player.hp <= 0) {
        game.state = 'gameover';
        return;
    }

    // Start player turn
    game.turn = 'player';
    player.ap = player.stance === 'walk' ? 2 : player.stance === 'run' ? 3 : 1;
}

function spawnCorruptionEnemy() {
    // Find valid spawn point
    for (let attempts = 0; attempts < 20; attempts++) {
        const x = Math.floor(Math.random() * MAP_WIDTH);
        const y = Math.floor(Math.random() * MAP_HEIGHT);

        if (map[y][x].type === 'floor' && !visible[y][x]) {
            const types = game.corruption >= 400 ? ['possessed', 'bloater', 'stalker'] : ['possessed'];
            const type = types[Math.floor(Math.random() * types.length)];
            const data = ENEMY_TYPES[type];

            enemies.push({
                type,
                x, y,
                hp: data.hp,
                maxHp: data.hp,
                damage: data.damage,
                range: data.range,
                color: data.color,
                name: data.name,
                awake: true
            });
            break;
        }
    }
}

// Drawing
function draw() {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === 'menu') {
        drawMenu();
    } else if (game.state === 'playing') {
        updateVisibility();
        drawGame();
        drawHUD();
    } else if (game.state === 'gameover') {
        drawGame();
        drawGameOver();
    } else if (game.state === 'extracted') {
        drawGame();
        drawExtracted();
    }
}

function drawMenu() {
    ctx.fillStyle = '#8b0000';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('QUASIMORPH', canvas.width / 2, 180);

    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Tactical Extraction Horror', canvas.width / 2, 220);

    // Corruption effect
    ctx.fillStyle = 'rgba(139, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 350, 60 + Math.sin(Date.now() * 0.003) * 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Click to Deploy', canvas.width / 2, 450);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('Arrow Keys / Click - Move | Space - End Turn', canvas.width / 2, 500);
    ctx.fillText('1-4 - Switch Weapon | Q/E - Use Item', canvas.width / 2, 520);
    ctx.fillText('Death = Lose Everything | Extract to Win', canvas.width / 2, 540);

    ctx.fillText(`High Score: ${game.highScore}`, canvas.width / 2, 580);
}

function drawGame() {
    const offsetX = (canvas.width - MAP_WIDTH * TILE_SIZE) / 2;
    const offsetY = 50;

    // Draw map
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = map[y][x];
            const px = offsetX + x * TILE_SIZE;
            const py = offsetY + y * TILE_SIZE;

            if (!explored[y][x]) {
                ctx.fillStyle = '#0a0a0f';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                continue;
            }

            if (!visible[y][x]) {
                ctx.fillStyle = '#1a1a2a';
            } else if (tile.type === 'floor') {
                ctx.fillStyle = '#2a2a3a';
            } else if (tile.type === 'wall') {
                ctx.fillStyle = '#4a4a5a';
            } else if (tile.type === 'extract') {
                ctx.fillStyle = '#27ae60';
            }

            ctx.fillRect(px, py, TILE_SIZE - 1, TILE_SIZE - 1);

            // Cover
            if (tile.cover && visible[y][x]) {
                ctx.fillStyle = '#5a5a6a';
                ctx.fillRect(px + 8, py + 8, 16, 16);
            }
        }
    }

    // Draw items
    for (const item of items) {
        if (!visible[item.y][item.x]) continue;
        const px = offsetX + item.x * TILE_SIZE + TILE_SIZE / 2;
        const py = offsetY + item.y * TILE_SIZE + TILE_SIZE / 2;

        if (item.type === 'pistol' || item.type === 'smg' || item.type === 'shotgun') {
            ctx.fillStyle = '#3498db';
        } else if (item.type === 'medkit') {
            ctx.fillStyle = '#e74c3c';
        } else if (item.type === 'bandage') {
            ctx.fillStyle = '#f39c12';
        } else if (item.type === 'loot') {
            ctx.fillStyle = '#f1c40f';
        }

        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw enemies
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        if (!visible[enemy.y][enemy.x]) continue;

        const px = offsetX + enemy.x * TILE_SIZE + TILE_SIZE / 2;
        const py = offsetY + enemy.y * TILE_SIZE + TILE_SIZE / 2;

        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(px, py, 12, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        ctx.fillStyle = '#333';
        ctx.fillRect(px - 12, py - 18, 24, 4);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(px - 12, py - 18, 24 * (enemy.hp / enemy.maxHp), 4);
    }

    // Draw player
    const ppx = offsetX + player.x * TILE_SIZE + TILE_SIZE / 2;
    const ppy = offsetY + player.y * TILE_SIZE + TILE_SIZE / 2;

    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(ppx, ppy, 12, 0, Math.PI * 2);
    ctx.fill();

    // Player direction indicator
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(ppx - 4, ppy - 4, 8, 8);
}

function drawHUD() {
    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, 45);

    // HP
    ctx.fillStyle = '#e74c3c';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${player.hp}/${player.maxHp}${player.bleeding ? ' [BLEEDING]' : ''}`, 20, 25);

    // AP
    ctx.fillStyle = '#3498db';
    ctx.fillText(`AP: ${player.ap}/${player.maxAp}`, 200, 25);

    // Corruption
    ctx.fillStyle = game.corruption >= 400 ? '#e74c3c' : game.corruption >= 200 ? '#f39c12' : '#27ae60';
    ctx.fillText(`Corruption: ${game.corruption}`, 300, 25);

    // Loot
    ctx.fillStyle = '#f1c40f';
    ctx.fillText(`Loot: ${game.totalLoot}`, 450, 25);

    // Turn
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText(game.turn === 'player' ? 'YOUR TURN' : 'ENEMY TURN', canvas.width - 20, 25);

    // Bottom bar
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

    // Weapons
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Weapons:', 20, canvas.height - 60);

    for (let i = 0; i < player.weapons.length; i++) {
        const w = player.weapons[i];
        ctx.fillStyle = i === player.currentWeapon ? '#3498db' : '#666';
        ctx.fillRect(20 + i * 100, canvas.height - 50, 90, 35);
        ctx.fillStyle = '#fff';
        ctx.fillText(`${i + 1}: ${w.name}`, 25 + i * 100, canvas.height - 35);
        if (w.durability !== undefined) {
            ctx.fillStyle = w.durability < 30 ? '#e74c3c' : '#27ae60';
            ctx.fillText(`Dur: ${w.durability}%`, 25 + i * 100, canvas.height - 20);
        }
    }

    // Inventory
    ctx.fillStyle = '#fff';
    ctx.fillText('Items:', 450, canvas.height - 60);
    for (let i = 0; i < player.inventory.length; i++) {
        const item = player.inventory[i];
        ctx.fillStyle = item.type === 'medkit' ? '#e74c3c' : '#f39c12';
        ctx.fillRect(450 + i * 50, canvas.height - 50, 40, 35);
        ctx.fillStyle = '#fff';
        ctx.fillText(item.type === 'medkit' ? 'MED' : 'BND', 455 + i * 50, canvas.height - 30);
    }

    // Instructions
    ctx.fillStyle = '#888';
    ctx.textAlign = 'right';
    ctx.fillText('Space: End Turn | Click enemy to attack', canvas.width - 20, canvas.height - 10);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION FAILED', canvas.width / 2, 250);

    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Your clone was terminated.', canvas.width / 2, 310);
    ctx.fillText('All equipment lost.', canvas.width / 2, 340);

    ctx.fillText('Click to try again', canvas.width / 2, 420);
}

function drawExtracted() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#27ae60';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXTRACTED!', canvas.width / 2, 220);

    ctx.fillStyle = '#fff';
    ctx.font = '24px monospace';
    ctx.fillText(`Loot Value: ${game.totalLoot}`, canvas.width / 2, 290);

    if (game.totalLoot >= game.highScore) {
        ctx.fillStyle = '#f1c40f';
        ctx.fillText('NEW HIGH SCORE!', canvas.width / 2, 340);
    }

    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Click to deploy again', canvas.width / 2, 420);
}

// Input
document.addEventListener('keydown', e => {
    if (game.state !== 'playing' || game.turn !== 'player') return;

    let moved = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') moved = movePlayer(0, -1);
    if (e.code === 'ArrowDown' || e.code === 'KeyS') moved = movePlayer(0, 1);
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') moved = movePlayer(-1, 0);
    if (e.code === 'ArrowRight' || e.code === 'KeyD') moved = movePlayer(1, 0);

    if (e.code === 'Space') endPlayerTurn();

    // Weapon switching
    if (e.code === 'Digit1' && player.weapons[0]) player.currentWeapon = 0;
    if (e.code === 'Digit2' && player.weapons[1]) player.currentWeapon = 1;
    if (e.code === 'Digit3' && player.weapons[2]) player.currentWeapon = 2;
    if (e.code === 'Digit4' && player.weapons[3]) player.currentWeapon = 3;

    // Use items
    if (e.code === 'KeyQ' && player.inventory[0]) useItem(0);
    if (e.code === 'KeyE' && player.inventory[1]) useItem(1);
});

canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (game.state === 'menu') {
        game.state = 'playing';
        game.corruption = 0;
        game.totalLoot = 0;
        player.hp = 100;
        player.ap = 2;
        player.bleeding = false;
        player.weapons = [{ ...WEAPONS.knife }];
        player.currentWeapon = 0;
        player.inventory = [];
        generateMap();
        return;
    }

    if (game.state === 'gameover' || game.state === 'extracted') {
        game.state = 'menu';
        return;
    }

    if (game.state === 'playing' && game.turn === 'player') {
        const offsetX = (canvas.width - MAP_WIDTH * TILE_SIZE) / 2;
        const offsetY = 50;

        const tx = Math.floor((mx - offsetX) / TILE_SIZE);
        const ty = Math.floor((my - offsetY) / TILE_SIZE);

        // Check for enemy click (attack)
        for (const enemy of enemies) {
            if (enemy.x === tx && enemy.y === ty && enemy.hp > 0 && visible[ty][tx]) {
                playerAttack(enemy);
                return;
            }
        }

        // Move toward clicked tile
        if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
            const dx = Math.sign(tx - player.x);
            const dy = Math.sign(ty - player.y);
            if (dx !== 0 || dy !== 0) {
                movePlayer(dx, dy);
            }
        }
    }
});

// Game loop
function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
