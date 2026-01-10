// DERELICT - Survival Horror
// Pure Canvas 2D implementation for headless compatibility
// Top-down horror with vision cone, O2 management, and enemies

const WIDTH = 400;
const HEIGHT = 400;
const TILE = 16;

// Create canvas
const canvas = document.createElement('canvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

// Game state
let gameState = {
    screen: 'menu',
    sector: 1,
    maxSectors: 3,
    integrity: 100,
    message: '',
    messageTimer: 0
};

let player = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    angle: -Math.PI / 2,
    hp: 100,
    o2: 100,
    inventory: [],
    maxInventory: 4,
    weapon: 'pipe',
    weaponDamage: 25,
    hasKey: false,
    attackCooldown: 0,
    invincible: 0
};

let enemies = [];
let items = [];
let walls = [];
let doors = [];
let ticks = 0;

// Constants
const PLAYER_SPEED = 2;
const O2_DRAIN = 0.02;
const O2_DRAIN_RUN = 0.04;
const VISION_RANGE = 120;
const VISION_ANGLE = Math.PI * 0.6; // 108 degrees

// Input state
const keys = {};
document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (gameState.screen === 'menu' && e.code === 'KeyZ') {
        startGame();
    }
    if (gameState.screen === 'gameover' && e.code === 'KeyZ') {
        gameState.screen = 'menu';
    }
    if (gameState.screen === 'win' && e.code === 'KeyZ') {
        gameState.screen = 'menu';
    }
    if (e.code === 'KeyX' && gameState.screen === 'game') {
        useItem();
    }
});
document.addEventListener('keyup', e => keys[e.code] = false);

// Expose for testing
if (typeof window !== 'undefined') {
    window.getGameState = () => gameState;
    window.getPlayer = () => player;
    window.getEnemies = () => enemies;
}

function startGame() {
    gameState = {
        screen: 'game',
        sector: 1,
        maxSectors: 3,
        integrity: 100,
        message: '',
        messageTimer: 0
    };

    player = {
        x: WIDTH / 2,
        y: HEIGHT - 50,
        angle: -Math.PI / 2,
        hp: 100,
        o2: 100,
        inventory: [],
        maxInventory: 4,
        weapon: 'pipe',
        weaponDamage: 25,
        hasKey: false,
        attackCooldown: 0,
        invincible: 0
    };

    enemies = [];
    items = [];
    walls = [];
    doors = [];
    ticks = 0;

    generateSector(1);
}

function generateSector(sector) {
    enemies = [];
    items = [];
    walls = [];
    doors = [];

    // Create border walls
    for (let x = 0; x < WIDTH; x += TILE) {
        walls.push({ x, y: 0, w: TILE, h: TILE });
        walls.push({ x, y: HEIGHT - TILE, w: TILE, h: TILE });
    }
    for (let y = TILE; y < HEIGHT - TILE; y += TILE) {
        walls.push({ x: 0, y, w: TILE, h: TILE });
        walls.push({ x: WIDTH - TILE, y, w: TILE, h: TILE });
    }

    // Add internal walls based on sector
    if (sector === 1) {
        // Corridor layout
        for (let x = 80; x < 160; x += TILE) {
            walls.push({ x, y: 100, w: TILE, h: TILE });
            walls.push({ x, y: 260, w: TILE, h: TILE });
        }
        for (let x = 240; x < 320; x += TILE) {
            walls.push({ x, y: 100, w: TILE, h: TILE });
            walls.push({ x, y: 260, w: TILE, h: TILE });
        }
    } else if (sector === 2) {
        // Room layout
        for (let x = 60; x < 180; x += TILE) {
            walls.push({ x, y: 140, w: TILE, h: TILE });
        }
        for (let y = 140; y < 260; y += TILE) {
            walls.push({ x: 180, y, w: TILE, h: TILE });
        }
        for (let x = 220; x < 340; x += TILE) {
            walls.push({ x, y: 200, w: TILE, h: TILE });
        }
    } else if (sector === 3) {
        // Final area
        for (let x = 100; x < 300; x += TILE) {
            if (x < 180 || x > 220) {
                walls.push({ x, y: 150, w: TILE, h: TILE });
            }
        }
    }

    // Add enemies
    const enemyCount = 2 + sector;
    for (let i = 0; i < enemyCount; i++) {
        let ex, ey;
        let attempts = 0;
        do {
            ex = TILE * 2 + Math.random() * (WIDTH - TILE * 4);
            ey = TILE * 2 + Math.random() * (HEIGHT - TILE * 4);
            attempts++;
        } while (attempts < 50 && (distToPlayer(ex, ey) < 100 || collidesWithWall(ex, ey, 12)));

        const type = Math.random() < 0.3 + sector * 0.1 ? 'shambler' : 'crawler';
        enemies.push({
            x: ex,
            y: ey,
            type,
            hp: type === 'shambler' ? 60 : 30,
            damage: type === 'shambler' ? 20 : 10,
            speed: type === 'shambler' ? 0.8 : 1.5,
            state: 'patrol',
            patrolAngle: Math.random() * Math.PI * 2,
            alertTimer: 0,
            attackCooldown: 0
        });
    }

    // Add items
    // O2 canisters
    for (let i = 0; i < 2; i++) {
        let ix, iy;
        do {
            ix = TILE * 2 + Math.random() * (WIDTH - TILE * 4);
            iy = TILE * 2 + Math.random() * (HEIGHT - TILE * 4);
        } while (collidesWithWall(ix, iy, 10));
        items.push({ x: ix, y: iy, type: 'o2', value: 30 });
    }

    // Medkit
    if (Math.random() < 0.7) {
        let ix, iy;
        do {
            ix = TILE * 2 + Math.random() * (WIDTH - TILE * 4);
            iy = TILE * 2 + Math.random() * (HEIGHT - TILE * 4);
        } while (collidesWithWall(ix, iy, 10));
        items.push({ x: ix, y: iy, type: 'medkit', value: 40 });
    }

    // Keycard in sector 2
    if (sector === 2) {
        items.push({ x: 50, y: 50, type: 'keycard' });
    }

    // Door to next sector
    if (sector < 3) {
        doors.push({ x: WIDTH / 2, y: TILE, w: TILE * 2, h: TILE, toSector: sector + 1, locked: sector === 2 });
    }

    // Escape pod in sector 3
    if (sector === 3) {
        doors.push({ x: WIDTH / 2 - TILE, y: 50, w: TILE * 2, h: TILE * 2, isEscape: true });
    }

    // Reset player position
    player.x = WIDTH / 2;
    player.y = HEIGHT - 50;
}

function distToPlayer(x, y) {
    return Math.sqrt((x - player.x) ** 2 + (y - player.y) ** 2);
}

function collidesWithWall(x, y, radius) {
    for (const wall of walls) {
        if (x + radius > wall.x && x - radius < wall.x + wall.w &&
            y + radius > wall.y && y - radius < wall.y + wall.h) {
            return true;
        }
    }
    return false;
}

function isInVisionCone(x, y) {
    const dx = x - player.x;
    const dy = y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > VISION_RANGE) return false;
    const angleToPoint = Math.atan2(dy, dx);
    let angleDiff = Math.abs(angleToPoint - player.angle);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
    return angleDiff < VISION_ANGLE / 2;
}

function useItem() {
    if (player.inventory.length > 0) {
        const item = player.inventory.shift();
        if (item.type === 'o2') {
            player.o2 = Math.min(100, player.o2 + item.value);
            showMessage('+O2');
        } else if (item.type === 'medkit') {
            player.hp = Math.min(100, player.hp + item.value);
            showMessage('+HP');
        }
    }
}

function showMessage(msg) {
    gameState.message = msg;
    gameState.messageTimer = 60;
}

function update() {
    if (gameState.screen !== 'game') return;

    ticks++;

    // Decrease message timer
    if (gameState.messageTimer > 0) gameState.messageTimer--;

    // Player movement
    let dx = 0, dy = 0;
    const isRunning = keys['ShiftLeft'] || keys['ShiftRight'];

    if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
    if (keys['KeyS'] || keys['ArrowDown']) dy = 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx = -1;
    if (keys['KeyD'] || keys['ArrowRight']) dx = 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    const speed = isRunning ? PLAYER_SPEED * 1.5 : PLAYER_SPEED;

    // Update facing angle based on movement
    if (dx !== 0 || dy !== 0) {
        player.angle = Math.atan2(dy, dx);
    }

    // Try to move
    const newX = player.x + dx * speed;
    const newY = player.y + dy * speed;

    if (!collidesWithWall(newX, player.y, 8)) player.x = newX;
    if (!collidesWithWall(player.x, newY, 8)) player.y = newY;

    // Keep in bounds
    player.x = Math.max(TILE + 8, Math.min(WIDTH - TILE - 8, player.x));
    player.y = Math.max(TILE + 8, Math.min(HEIGHT - TILE - 8, player.y));

    // O2 drain
    if (isRunning && (dx !== 0 || dy !== 0)) {
        player.o2 -= O2_DRAIN_RUN;
    } else {
        player.o2 -= O2_DRAIN;
    }

    // O2 depleted = take damage
    if (player.o2 <= 0) {
        player.o2 = 0;
        player.hp -= 0.3;
    }

    // Attack
    if (player.attackCooldown > 0) player.attackCooldown--;

    if (keys['KeyZ'] && player.attackCooldown <= 0) {
        player.attackCooldown = 20;
        player.o2 -= 2;

        // Check if hitting enemies
        for (const enemy of enemies) {
            const dist = distToPlayer(enemy.x, enemy.y);
            if (dist < 30) {
                const angleToEnemy = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                let angleDiff = Math.abs(angleToEnemy - player.angle);
                if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
                if (angleDiff < Math.PI / 3) {
                    enemy.hp -= player.weaponDamage;
                    enemy.state = 'chase';
                }
            }
        }
    }

    // Update invincibility
    if (player.invincible > 0) player.invincible--;

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        if (enemy.hp <= 0) {
            enemies.splice(i, 1);
            continue;
        }

        // Enemy AI
        const distToP = distToPlayer(enemy.x, enemy.y);

        if (enemy.state === 'patrol') {
            // Move in patrol direction
            enemy.x += Math.cos(enemy.patrolAngle) * enemy.speed * 0.5;
            enemy.y += Math.sin(enemy.patrolAngle) * enemy.speed * 0.5;

            // Change direction if hitting wall
            if (collidesWithWall(enemy.x, enemy.y, 10)) {
                enemy.patrolAngle += Math.PI / 2 + Math.random();
                enemy.x = Math.max(TILE + 10, Math.min(WIDTH - TILE - 10, enemy.x));
                enemy.y = Math.max(TILE + 10, Math.min(HEIGHT - TILE - 10, enemy.y));
            }

            // Alert if player nearby and visible
            if (distToP < 80 && isInVisionCone(enemy.x, enemy.y)) {
                enemy.state = 'alert';
                enemy.alertTimer = 30;
            }
        } else if (enemy.state === 'alert') {
            enemy.alertTimer--;
            if (enemy.alertTimer <= 0) {
                enemy.state = 'chase';
            }
        } else if (enemy.state === 'chase') {
            // Move toward player
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            const newEX = enemy.x + Math.cos(angle) * enemy.speed;
            const newEY = enemy.y + Math.sin(angle) * enemy.speed;

            if (!collidesWithWall(newEX, enemy.y, 10)) enemy.x = newEX;
            if (!collidesWithWall(enemy.x, newEY, 10)) enemy.y = newEY;

            // Attack player
            if (distToP < 20 && enemy.attackCooldown <= 0 && player.invincible <= 0) {
                player.hp -= enemy.damage;
                player.invincible = 30;
                enemy.attackCooldown = 40;
                showMessage('-' + enemy.damage + ' HP');
            }

            // Lose player
            if (distToP > 150) {
                enemy.state = 'patrol';
                enemy.patrolAngle = Math.random() * Math.PI * 2;
            }
        }

        if (enemy.attackCooldown > 0) enemy.attackCooldown--;
    }

    // Collect items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dist = Math.sqrt((item.x - player.x) ** 2 + (item.y - player.y) ** 2);

        if (dist < 15) {
            if (item.type === 'keycard') {
                player.hasKey = true;
                showMessage('GOT KEYCARD');
                items.splice(i, 1);
            } else if (player.inventory.length < player.maxInventory) {
                player.inventory.push(item);
                showMessage('PICKED UP ' + item.type.toUpperCase());
                items.splice(i, 1);
            }
        }
    }

    // Check doors
    for (const door of doors) {
        const dist = Math.sqrt((door.x + door.w / 2 - player.x) ** 2 + (door.y + door.h / 2 - player.y) ** 2);

        if (dist < 25) {
            if (door.isEscape) {
                gameState.screen = 'win';
            } else if (door.locked && !player.hasKey) {
                showMessage('NEED KEYCARD');
            } else {
                gameState.sector = door.toSector;
                generateSector(door.toSector);
                showMessage('SECTOR ' + door.toSector);
            }
        }
    }

    // Check game over
    if (player.hp <= 0) {
        gameState.screen = 'gameover';
    }
}

function draw() {
    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (gameState.screen === 'menu') {
        drawMenu();
        return;
    }

    if (gameState.screen === 'gameover') {
        drawGameOver();
        return;
    }

    if (gameState.screen === 'win') {
        drawWin();
        return;
    }

    // Draw floor
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(TILE, TILE, WIDTH - TILE * 2, HEIGHT - TILE * 2);

    // Draw vision cone
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#445566';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.arc(player.x, player.y, VISION_RANGE, player.angle - VISION_ANGLE / 2, player.angle + VISION_ANGLE / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw walls
    ctx.fillStyle = '#334455';
    for (const wall of walls) {
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    }

    // Draw doors
    for (const door of doors) {
        if (door.isEscape) {
            ctx.fillStyle = '#00ff88';
        } else if (door.locked && !player.hasKey) {
            ctx.fillStyle = '#ff4444';
        } else {
            ctx.fillStyle = '#4488ff';
        }
        ctx.fillRect(door.x, door.y, door.w, door.h);
    }

    // Draw items (only in vision cone or close)
    for (const item of items) {
        const dist = Math.sqrt((item.x - player.x) ** 2 + (item.y - player.y) ** 2);
        if (isInVisionCone(item.x, item.y) || dist < 30) {
            if (item.type === 'o2') {
                ctx.fillStyle = '#00aaff';
            } else if (item.type === 'medkit') {
                ctx.fillStyle = '#ff4444';
            } else if (item.type === 'keycard') {
                ctx.fillStyle = '#ffaa00';
            }
            ctx.beginPath();
            ctx.arc(item.x, item.y, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw enemies (only if in vision cone or close)
    for (const enemy of enemies) {
        const dist = distToPlayer(enemy.x, enemy.y);
        if (isInVisionCone(enemy.x, enemy.y) || dist < 30) {
            if (enemy.type === 'crawler') {
                ctx.fillStyle = enemy.state === 'chase' ? '#ff3333' : '#aa3333';
            } else {
                ctx.fillStyle = enemy.state === 'chase' ? '#33ff33' : '#33aa33';
            }
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, 8, 0, Math.PI * 2);
            ctx.fill();

            // Health bar
            if (enemy.hp < (enemy.type === 'shambler' ? 60 : 30)) {
                ctx.fillStyle = '#333';
                ctx.fillRect(enemy.x - 10, enemy.y - 15, 20, 3);
                ctx.fillStyle = '#ff3333';
                const maxHp = enemy.type === 'shambler' ? 60 : 30;
                ctx.fillRect(enemy.x - 10, enemy.y - 15, 20 * (enemy.hp / maxHp), 3);
            }
        }
    }

    // Draw player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Flash when invincible
    if (player.invincible > 0 && Math.floor(ticks / 4) % 2 === 0) {
        ctx.fillStyle = '#ffffff';
    } else {
        ctx.fillStyle = '#88aaff';
    }

    // Body
    ctx.fillRect(-6, -6, 12, 12);

    // Direction indicator
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, -2, 6, 4);

    ctx.restore();

    // Attack indicator
    if (player.attackCooldown > 15) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.angle);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(30, 0);
        ctx.stroke();
        ctx.restore();
    }

    // UI
    drawUI();
}

function drawUI() {
    // O2 bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, HEIGHT - 30, 100, 12);
    ctx.fillStyle = player.o2 < 30 ? '#ff4444' : '#00aaff';
    ctx.fillRect(10, HEIGHT - 30, player.o2, 12);
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText('O2', 12, HEIGHT - 21);

    // HP bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, HEIGHT - 45, 100, 12);
    ctx.fillStyle = player.hp < 30 ? '#ff4444' : '#44ff44';
    ctx.fillRect(10, HEIGHT - 45, player.hp, 12);
    ctx.fillStyle = '#fff';
    ctx.fillText('HP', 12, HEIGHT - 36);

    // Inventory
    ctx.fillStyle = '#fff';
    ctx.fillText('INV: ' + player.inventory.length + '/' + player.maxInventory, WIDTH - 80, HEIGHT - 36);

    // Sector
    ctx.fillText('SECTOR ' + gameState.sector + '/' + gameState.maxSectors, WIDTH - 90, HEIGHT - 21);

    // Keycard indicator
    if (player.hasKey) {
        ctx.fillStyle = '#ffaa00';
        ctx.fillText('KEYCARD', WIDTH - 90, HEIGHT - 51);
    }

    // Message
    if (gameState.messageTimer > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(gameState.message, WIDTH / 2, 40);
        ctx.textAlign = 'left';
    }
}

function drawMenu() {
    ctx.fillStyle = '#ff3322';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DERELICT', WIDTH / 2, HEIGHT / 2 - 40);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px monospace';
    ctx.fillText('Survive the abandoned ship', WIDTH / 2, HEIGHT / 2);

    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText('[WASD] Move', WIDTH / 2, HEIGHT / 2 + 40);
    ctx.fillText('[Z] Attack  [X] Use Item', WIDTH / 2, HEIGHT / 2 + 60);

    ctx.fillStyle = '#88ff88';
    ctx.fillText('Press Z to Start', WIDTH / 2, HEIGHT / 2 + 100);

    ctx.textAlign = 'left';
}

function drawGameOver() {
    ctx.fillStyle = '#ff3322';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 20);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px monospace';
    ctx.fillText('You succumbed to the void', WIDTH / 2, HEIGHT / 2 + 20);

    ctx.fillStyle = '#fff';
    ctx.fillText('Press Z to retry', WIDTH / 2, HEIGHT / 2 + 60);

    ctx.textAlign = 'left';
}

function drawWin() {
    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPED!', WIDTH / 2, HEIGHT / 2 - 20);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px monospace';
    ctx.fillText('You made it off the derelict', WIDTH / 2, HEIGHT / 2 + 20);

    ctx.fillStyle = '#fff';
    ctx.fillText('Press Z for menu', WIDTH / 2, HEIGHT / 2 + 60);

    ctx.textAlign = 'left';
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
