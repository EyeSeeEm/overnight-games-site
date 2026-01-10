// PIRATEERS - Naval Combat Clone
// Canvas Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const UI_WIDTH = 100;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Colors
const COLORS = {
    OCEAN: '#3080c0',
    OCEAN_DARK: '#2060a0',
    PLAYER_HULL: '#8a5030',
    PLAYER_DECK: '#c08050',
    ENEMY_HULL: '#505050',
    ENEMY_DECK: '#707070',
    CANNON_BALL: '#303030',
    GOLD: '#ffd700',
    LOOT: '#40aa40',
    UI_BG: '#5a3020',
    UI_BORDER: '#3a2010',
    HP_BAR: '#cc4040',
    HP_BG: '#400000'
};

// Game state
const game = {
    state: 'title', // title, sailing, base
    day: 1,
    dayTimer: 180, // 3 minutes
    gold: 100,
    cargo: [],
    cargoCapacity: 10,
    messages: [],
    startTime: Date.now()
};

// Stats tracking
const stats = {
    shipsSunk: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    critCount: 0,
    lootCollected: 0,
    cannonsFired: 0,
    maxKillStreak: 0,
    goldEarned: 0
};

// Kill streak
let killStreak = 0;
let killStreakTimer = 0;

// Visual effects
let damageFlashAlpha = 0;
let lowHealthPulse = 0;
let screenShake = { x: 0, y: 0, intensity: 0 };
let floatingTexts = [];

// Debug mode
let debugMode = false;

// Player ship
const player = {
    x: 600,
    y: 400,
    angle: -Math.PI / 2, // Facing up
    speed: 0,
    maxSpeed: 150,
    turnRate: 1.5,
    speedLevel: 0, // 0=stop, 1=slow, 2=half, 3=full
    armor: 100,
    maxArmor: 100,
    firepower: 10,
    reloadTime: 2000,
    lastFire: 0,
    width: 60,
    height: 30
};

// Enemies
let enemies = [];
const enemyTypes = {
    merchant: { hp: 50, speed: 60, damage: 5, gold: 30, color: COLORS.ENEMY_HULL, size: 50 },
    navySloop: { hp: 80, speed: 100, damage: 12, gold: 40, color: '#4a5a6a', size: 55 },
    pirate: { hp: 100, speed: 120, damage: 15, gold: 55, color: '#4a3040', size: 55 }
};

// Projectiles
let cannonballs = [];
let loot = [];
let particles = [];

// Camera
const camera = { x: 0, y: 0 };

// World bounds
const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1800;

// Input
const keys = {};

// Initialize
function init() {
    setupInput();
    // Don't spawn enemies yet - wait for title screen to be dismissed
    requestAnimationFrame(gameLoop);
}

// Title screen
function renderTitleScreen() {
    // Ocean background
    ctx.fillStyle = COLORS.OCEAN;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Ocean pattern
    ctx.strokeStyle = COLORS.OCEAN_DARK;
    ctx.lineWidth = 2;
    const time = Date.now() * 0.001;
    for (let y = 0; y < GAME_HEIGHT; y += 150) {
        for (let x = 0; x < GAME_WIDTH; x += 150) {
            ctx.beginPath();
            ctx.arc(x + Math.sin(time + y * 0.01) * 20, y, 40, 0, Math.PI * 1.5);
            ctx.stroke();
        }
    }

    // Title
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 72px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PIRATEERS', GAME_WIDTH / 2, 150);

    // Subtitle
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px serif';
    ctx.fillText('Naval Combat on the High Seas', GAME_WIDTH / 2, 210);

    // Draw a decorative ship
    ctx.save();
    ctx.translate(GAME_WIDTH / 2, 350);
    ctx.scale(2, 2);
    // Hull
    ctx.fillStyle = COLORS.PLAYER_HULL;
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(-30, -20);
    ctx.lineTo(-40, 0);
    ctx.lineTo(-30, 20);
    ctx.closePath();
    ctx.fill();
    // Sail
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-10, -35);
    ctx.lineTo(-10, 35);
    ctx.lineTo(20, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Controls box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(GAME_WIDTH / 2 - 200, 450, 400, 180);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(GAME_WIDTH / 2 - 200, 450, 400, 180);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('CONTROLS', GAME_WIDTH / 2, 480);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText('W / ↑  -  Increase Speed', GAME_WIDTH / 2, 515);
    ctx.fillText('S / ↓  -  Decrease Speed', GAME_WIDTH / 2, 545);
    ctx.fillText('A / ←  -  Turn Left', GAME_WIDTH / 2, 575);
    ctx.fillText('D / →  -  Turn Right', GAME_WIDTH / 2, 605);
    ctx.fillText('SPACE  -  Fire Cannons', GAME_WIDTH / 2, 635);

    // Start prompt (pulsing)
    const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
    ctx.font = 'bold 28px serif';
    ctx.fillText('Press any key or click to start', GAME_WIDTH / 2, GAME_HEIGHT - 50);
}

function setupInput() {
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;

        // Start game from title screen
        if (game.state === 'title') {
            game.state = 'sailing';
            spawnEnemies();
            addMessage("Day " + game.day + " - Set sail!");
            return;
        }

        if (e.key === ' ') {
            e.preventDefault();
            fireCanons();
        }
        if (e.key === 'q') {
            debugMode = !debugMode;
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    // Also start on click
    canvas.addEventListener('click', () => {
        if (game.state === 'title') {
            game.state = 'sailing';
            spawnEnemies();
            addMessage("Day " + game.day + " - Set sail!");
        }
    });
}

function spawnEnemies() {
    enemies = [];
    const count = 4 + game.day;

    for (let i = 0; i < count; i++) {
        const types = ['merchant', 'merchant', 'navySloop', 'pirate'];
        const type = types[Math.floor(Math.random() * types.length)];
        const data = enemyTypes[type];

        enemies.push({
            x: 200 + Math.random() * (WORLD_WIDTH - 400),
            y: 200 + Math.random() * (WORLD_HEIGHT - 400),
            angle: Math.random() * Math.PI * 2,
            speed: data.speed * (0.8 + Math.random() * 0.4),
            hp: data.hp,
            maxHp: data.hp,
            damage: data.damage,
            gold: data.gold,
            color: data.color,
            size: data.size,
            type: type,
            state: 'patrol',
            targetAngle: Math.random() * Math.PI * 2,
            lastFire: 0,
            reloadTime: 2500
        });
    }
}

function addMessage(text) {
    game.messages.unshift({ text, time: game.dayTimer });
    if (game.messages.length > 4) game.messages.pop();
}

let lastTime = 0;
function gameLoop(currentTime) {
    const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    if (game.state === 'title') {
        renderTitleScreen();
    } else if (game.state === 'sailing') {
        update(delta);
        render();
    } else {
        render();
    }

    requestAnimationFrame(gameLoop);
}

function update(delta) {
    // Day timer
    game.dayTimer -= delta;
    if (game.dayTimer <= 0) {
        endDay();
        return;
    }

    updatePlayer(delta);
    updateEnemies(delta);
    updateCannonballs(delta);
    updateLoot(delta);
    updateParticles(delta);
    updateVisualEffects(delta);
    updateFloatingTexts(delta);
    updateKillStreak(delta);

    // Camera follow
    camera.x = player.x - (GAME_WIDTH - UI_WIDTH) / 2;
    camera.y = player.y - GAME_HEIGHT / 2;
    camera.x = Math.max(0, Math.min(WORLD_WIDTH - GAME_WIDTH + UI_WIDTH, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_HEIGHT - GAME_HEIGHT, camera.y));

    // Check death
    if (player.armor <= 0) {
        addMessage("Ship destroyed! Returning to port...");
        game.gold = Math.floor(game.gold * 0.75);
        endDay();
    }
}

function updatePlayer(delta) {
    // Turning
    if (keys['a'] || keys['arrowleft']) {
        player.angle -= player.turnRate * delta;
    }
    if (keys['d'] || keys['arrowright']) {
        player.angle += player.turnRate * delta;
    }

    // Speed control
    if (keys['w'] || keys['arrowup']) {
        player.speedLevel = Math.min(3, player.speedLevel + 2 * delta);
    }
    if (keys['s'] || keys['arrowdown']) {
        player.speedLevel = Math.max(0, player.speedLevel - 2 * delta);
    }

    // Calculate actual speed
    const speedMultipliers = [0, 0.25, 0.5, 1.0];
    const targetSpeed = player.maxSpeed * speedMultipliers[Math.floor(player.speedLevel)];
    player.speed += (targetSpeed - player.speed) * 2 * delta;

    // Move
    player.x += Math.cos(player.angle) * player.speed * delta;
    player.y += Math.sin(player.angle) * player.speed * delta;

    // World bounds
    player.x = Math.max(50, Math.min(WORLD_WIDTH - 50, player.x));
    player.y = Math.max(50, Math.min(WORLD_HEIGHT - 50, player.y));

    // Collect loot
    for (let i = loot.length - 1; i >= 0; i--) {
        const l = loot[i];
        const dist = Math.hypot(player.x - l.x, player.y - l.y);
        if (dist < 50) {
            game.gold += l.value;
            stats.lootCollected++;
            stats.goldEarned += l.value;
            addMessage("+" + l.value + " gold!");
            createFloatingText(l.x, l.y - 20, '+' + l.value + ' GOLD', '#ffd700', 14);

            // Pickup sparkle
            for (let p = 0; p < 8; p++) {
                const angle = (Math.PI * 2 * p) / 8;
                particles.push({
                    x: l.x,
                    y: l.y,
                    vx: Math.cos(angle) * 60,
                    vy: Math.sin(angle) * 60,
                    life: 0.4,
                    color: '#ffd700',
                    size: 4
                });
            }

            loot.splice(i, 1);
        }
    }
}

function fireCanons() {
    const now = performance.now();
    if (now - player.lastFire < player.reloadTime) return;

    player.lastFire = now;
    stats.cannonsFired++;

    // Fire from both sides (broadside)
    const angles = [-Math.PI/2, Math.PI/2]; // Port and starboard

    for (const sideAngle of angles) {
        const fireAngle = player.angle + sideAngle;

        // 3 cannonballs per side with spread
        for (let i = 0; i < 3; i++) {
            const spread = (i - 1) * 0.15;
            const ballAngle = fireAngle + spread;

            cannonballs.push({
                x: player.x + Math.cos(fireAngle) * 20,
                y: player.y + Math.sin(fireAngle) * 20,
                vx: Math.cos(ballAngle) * 400 + player.speed * Math.cos(player.angle) * 0.3,
                vy: Math.sin(ballAngle) * 400 + player.speed * Math.sin(player.angle) * 0.3,
                damage: player.firepower,
                life: 0.75,
                owner: 'player'
            });
        }
    }

    // Muzzle flash particles
    for (let i = 0; i < 6; i++) {
        particles.push({
            x: player.x + (Math.random() - 0.5) * 30,
            y: player.y + (Math.random() - 0.5) * 30,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 0.3,
            color: '#ffcc80',
            size: 4
        });
    }
}

function updateEnemies(delta) {
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;

        const distToPlayer = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);

        // AI behavior
        if (enemy.type === 'merchant') {
            // Merchants flee from player
            if (distToPlayer < 300) {
                enemy.targetAngle = angleToPlayer + Math.PI; // Run away
            }
        } else {
            // Combat ships attack
            if (distToPlayer < 400) {
                enemy.state = 'attack';
                // Try to get broadside position
                const desiredAngle = angleToPlayer + Math.PI/2;
                enemy.targetAngle = desiredAngle;
            } else {
                enemy.state = 'patrol';
                if (Math.random() < 0.01) {
                    enemy.targetAngle = Math.random() * Math.PI * 2;
                }
            }
        }

        // Turn toward target angle
        const angleDiff = normalizeAngle(enemy.targetAngle - enemy.angle);
        enemy.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 1.2 * delta);

        // Move
        enemy.x += Math.cos(enemy.angle) * enemy.speed * delta;
        enemy.y += Math.sin(enemy.angle) * enemy.speed * delta;

        // World bounds
        enemy.x = Math.max(50, Math.min(WORLD_WIDTH - 50, enemy.x));
        enemy.y = Math.max(50, Math.min(WORLD_HEIGHT - 50, enemy.y));

        // Fire at player
        if (enemy.state === 'attack' && distToPlayer < 350) {
            const now = performance.now();
            if (now - enemy.lastFire > enemy.reloadTime) {
                enemy.lastFire = now;

                // Fire toward player
                const fireAngle = angleToPlayer + (Math.random() - 0.5) * 0.3;
                cannonballs.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(fireAngle) * 350,
                    vy: Math.sin(fireAngle) * 350,
                    damage: enemy.damage,
                    life: 0.8,
                    owner: 'enemy'
                });
            }
        }
    }
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function updateCannonballs(delta) {
    for (let i = cannonballs.length - 1; i >= 0; i--) {
        const ball = cannonballs[i];

        ball.x += ball.vx * delta;
        ball.y += ball.vy * delta;
        ball.life -= delta;

        if (ball.life <= 0) {
            cannonballs.splice(i, 1);
            continue;
        }

        // Hit detection
        if (ball.owner === 'player') {
            for (const enemy of enemies) {
                if (enemy.hp <= 0) continue;
                const dist = Math.hypot(ball.x - enemy.x, ball.y - enemy.y);
                if (dist < enemy.size / 2 + 10) {
                    damageEnemy(enemy, ball.damage);
                    cannonballs.splice(i, 1);
                    break;
                }
            }
        } else {
            const dist = Math.hypot(ball.x - player.x, ball.y - player.y);
            if (dist < 30) {
                damagePlayer(ball.damage);
                cannonballs.splice(i, 1);
            }
        }
    }
}

function damageEnemy(enemy, damage) {
    // Critical hit system (15% chance, 2x damage)
    const isCrit = Math.random() < 0.15;
    if (isCrit) {
        damage *= 2;
        stats.critCount++;
    }

    enemy.hp -= damage;
    stats.totalDamageDealt += damage;

    // Floating damage number
    createFloatingText(
        enemy.x, enemy.y - 30,
        damage.toString() + (isCrit ? '!' : ''),
        isCrit ? '#ffff00' : '#ff6040',
        isCrit ? 18 : 14
    );

    // Screen shake
    triggerScreenShake(isCrit ? 5 : 2);

    // Hit particles (more for crits)
    const particleCount = isCrit ? 5 : 2;
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 80,
            life: 0.4,
            color: isCrit ? '#ffcc60' : '#606060',
            size: isCrit ? 8 : 6
        });
    }

    if (enemy.hp <= 0) {
        killEnemy(enemy, isCrit);
    }
}

function killEnemy(enemy, wasCrit) {
    stats.shipsSunk++;

    // Kill streak
    killStreak++;
    killStreakTimer = 3;
    if (killStreak > stats.maxKillStreak) {
        stats.maxKillStreak = killStreak;
    }

    // Kill streak messages
    if (killStreak >= 3) {
        const streakMessages = { 3: 'TRIPLE SINK!', 4: 'QUAD SINK!', 5: 'RAMPAGE!', 6: 'ADMIRAL!' };
        const msg = streakMessages[Math.min(killStreak, 6)] || 'LEGENDARY!';
        createFloatingText(player.x, player.y - 60, msg, '#ffaa00', 20);
    }

    // Drop loot
    const goldDrop = enemy.gold + Math.floor(Math.random() * 20);
    loot.push({
        x: enemy.x,
        y: enemy.y,
        value: goldDrop,
        life: 15
    });

    // Explosion particles (more for bigger effect)
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: enemy.x + (Math.random() - 0.5) * 40,
            y: enemy.y + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 180,
            vy: (Math.random() - 0.5) * 180,
            life: 0.6 + Math.random() * 0.4,
            color: Math.random() < 0.5 ? '#ff8040' : '#ffcc60',
            size: 8 + Math.random() * 10
        });
    }

    // Death burst ring
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * 100,
            vy: Math.sin(angle) * 100,
            life: 0.5,
            color: '#ff6040',
            size: 6
        });
    }

    triggerScreenShake(8);
    addMessage("Enemy sunk!" + (wasCrit ? " CRITICAL!" : "") + " Loot dropped.");
}

function updateLoot(delta) {
    for (let i = loot.length - 1; i >= 0; i--) {
        loot[i].life -= delta;
        if (loot[i].life <= 0) {
            loot.splice(i, 1);
        }
    }
}

function updateParticles(delta) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.life -= delta;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function endDay() {
    game.day++;
    game.dayTimer = 180;
    player.armor = player.maxArmor;
    player.x = 600;
    player.y = 400;
    spawnEnemies();
    addMessage("Day " + game.day + " begins!");
}

// Helper functions for visual effects
function damagePlayer(damage) {
    player.armor -= damage;
    stats.totalDamageTaken += damage;

    // Damage flash
    damageFlashAlpha = 0.4;

    // Screen shake
    triggerScreenShake(4);

    // Damage particles
    for (let i = 0; i < 4; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 0.4,
            color: '#8a5030',
            size: 6
        });
    }

    // Floating damage text
    createFloatingText(player.x, player.y - 30, '-' + damage, '#ff4444', 14);
    addMessage("Hit! -" + damage + " armor");
}

function createFloatingText(x, y, text, color, size) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        size: size,
        life: 1.0,
        maxLife: 1.0,
        vy: -40
    });
}

function triggerScreenShake(intensity) {
    screenShake.intensity = Math.max(screenShake.intensity, intensity);
}

function updateVisualEffects(delta) {
    // Damage flash decay
    if (damageFlashAlpha > 0) {
        damageFlashAlpha = Math.max(0, damageFlashAlpha - delta * 2);
    }

    // Low armor pulsing
    if (player.armor < 30) {
        lowHealthPulse += delta * 4;
    }

    // Screen shake decay
    if (screenShake.intensity > 0) {
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.intensity = Math.max(0, screenShake.intensity - delta * 25);
    } else {
        screenShake.x = 0;
        screenShake.y = 0;
    }
}

function updateFloatingTexts(delta) {
    floatingTexts = floatingTexts.filter(ft => {
        ft.life -= delta;
        ft.y += ft.vy * delta;
        return ft.life > 0;
    });
}

function updateKillStreak(delta) {
    if (killStreakTimer > 0) {
        killStreakTimer -= delta;
        if (killStreakTimer <= 0) {
            killStreak = 0;
        }
    }
}

function render() {
    // Clear
    ctx.fillStyle = COLORS.OCEAN;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw game world
    ctx.save();
    // Apply screen shake
    ctx.translate(-camera.x + UI_WIDTH + screenShake.x, -camera.y + screenShake.y);

    // Ocean pattern
    renderOcean();

    // Loot
    for (const l of loot) {
        ctx.fillStyle = COLORS.GOLD;
        ctx.beginPath();
        ctx.arc(l.x, l.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffa000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Enemies
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        renderShip(enemy.x, enemy.y, enemy.angle, enemy.color, enemy.size, false);

        // Health bar
        if (enemy.hp < enemy.maxHp) {
            const barW = enemy.size;
            ctx.fillStyle = COLORS.HP_BG;
            ctx.fillRect(enemy.x - barW/2, enemy.y - enemy.size/2 - 12, barW, 6);
            ctx.fillStyle = COLORS.HP_BAR;
            ctx.fillRect(enemy.x - barW/2, enemy.y - enemy.size/2 - 12, barW * (enemy.hp / enemy.maxHp), 6);
        }
    }

    // Player
    renderShip(player.x, player.y, player.angle, COLORS.PLAYER_HULL, 60, true);

    // Cannonballs
    ctx.fillStyle = COLORS.CANNON_BALL;
    for (const ball of cannonballs) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Particles
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Floating texts (world space)
    for (const ft of floatingTexts) {
        ctx.font = `bold ${ft.size}px monospace`;
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.life / ft.maxLife;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';

    ctx.restore();

    // UI
    renderUI();
}

function renderOcean() {
    // Draw swirl patterns on ocean
    ctx.strokeStyle = COLORS.OCEAN_DARK;
    ctx.lineWidth = 2;

    const spacing = 150;
    const offsetX = (camera.x % spacing);
    const offsetY = (camera.y % spacing);

    for (let y = -spacing; y < GAME_HEIGHT + spacing; y += spacing) {
        for (let x = -spacing; x < GAME_WIDTH + spacing; x += spacing) {
            const wx = x - offsetX + camera.x;
            const wy = y - offsetY + camera.y;

            ctx.beginPath();
            ctx.arc(wx, wy, 40 + Math.sin(wx * 0.01 + wy * 0.01) * 10, 0, Math.PI * 1.5);
            ctx.stroke();
        }
    }
}

function renderShip(x, y, angle, hullColor, size, isPlayer) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Hull
    ctx.fillStyle = hullColor;
    ctx.beginPath();
    ctx.moveTo(size * 0.5, 0);
    ctx.lineTo(-size * 0.4, -size * 0.25);
    ctx.lineTo(-size * 0.5, 0);
    ctx.lineTo(-size * 0.4, size * 0.25);
    ctx.closePath();
    ctx.fill();

    // Deck
    ctx.fillStyle = isPlayer ? COLORS.PLAYER_DECK : COLORS.ENEMY_DECK;
    ctx.fillRect(-size * 0.3, -size * 0.15, size * 0.6, size * 0.3);

    // Mast
    ctx.fillStyle = '#5a4030';
    ctx.fillRect(-size * 0.05, -size * 0.02, size * 0.1, size * 0.04);

    // Sail (simplified)
    ctx.fillStyle = '#e0d8c8';
    ctx.beginPath();
    ctx.moveTo(-size * 0.1, -size * 0.2);
    ctx.lineTo(size * 0.15, 0);
    ctx.lineTo(-size * 0.1, size * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function renderUI() {
    // Left panel background
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(0, 0, UI_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = COLORS.UI_BORDER;
    ctx.fillRect(UI_WIDTH - 4, 0, 4, GAME_HEIGHT);

    // Day
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText('Day ' + game.day, 10, 30);

    // Gold
    ctx.fillStyle = COLORS.GOLD;
    ctx.fillText('$' + game.gold, 10, 55);

    // Armor bar
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ARMOR', 10, 85);
    ctx.fillStyle = COLORS.HP_BG;
    ctx.fillRect(10, 90, 80, 12);
    ctx.fillStyle = COLORS.HP_BAR;
    ctx.fillRect(10, 90, 80 * (player.armor / player.maxArmor), 12);

    // Speed indicator
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SPEED', 10, 125);
    const speedNames = ['STOP', 'SLOW', 'HALF', 'FULL'];
    ctx.fillText(speedNames[Math.floor(player.speedLevel)], 10, 145);

    // Time remaining
    ctx.fillStyle = '#ffffff';
    ctx.fillText('TIME', 10, 180);
    const mins = Math.floor(game.dayTimer / 60);
    const secs = Math.floor(game.dayTimer % 60);
    ctx.fillText(mins + ':' + secs.toString().padStart(2, '0'), 10, 200);

    // Controls hint
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '10px monospace';
    ctx.fillText('A/D Turn', 10, GAME_HEIGHT - 80);
    ctx.fillText('W/S Speed', 10, GAME_HEIGHT - 65);
    ctx.fillText('SPACE Fire', 10, GAME_HEIGHT - 50);

    // Messages
    ctx.font = '12px monospace';
    for (let i = 0; i < game.messages.length; i++) {
        const msg = game.messages[i];
        ctx.fillStyle = `rgba(100, 200, 100, ${Math.max(0, 1 - i * 0.3)})`;
        ctx.fillText(msg.text, UI_WIDTH + 10, GAME_HEIGHT - 60 + i * 15);
    }

    // Top bar - Quests placeholder
    ctx.fillStyle = 'rgba(90, 48, 32, 0.9)';
    ctx.fillRect(UI_WIDTH, 0, GAME_WIDTH - UI_WIDTH, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.fillText('Quests: Z-Bounty Hunt  X-Merchant Raid  C-Pirate Hunt', UI_WIDTH + 10, 25);

    // Enemies alive
    const aliveEnemies = enemies.filter(e => e.hp > 0).length;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Ships: ' + aliveEnemies, GAME_WIDTH - 100, 25);

    // Kill streak display
    if (killStreak >= 2) {
        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = '#ffaa00';
        ctx.textAlign = 'center';
        ctx.fillText(`${killStreak}x STREAK`, GAME_WIDTH / 2 + UI_WIDTH / 2, 70);
        ctx.textAlign = 'left';
    }

    // Damage flash overlay
    if (damageFlashAlpha > 0) {
        ctx.fillStyle = `rgba(200, 50, 30, ${damageFlashAlpha})`;
        ctx.fillRect(UI_WIDTH, 0, GAME_WIDTH - UI_WIDTH, GAME_HEIGHT);
    }

    // Low armor vignette
    if (player.armor < 30) {
        const pulseAlpha = 0.15 + Math.sin(lowHealthPulse) * 0.1;
        ctx.fillStyle = `rgba(100, 30, 20, ${pulseAlpha})`;
        ctx.fillRect(UI_WIDTH, 0, GAME_WIDTH - UI_WIDTH, GAME_HEIGHT);
    }

    // Debug overlay
    if (debugMode) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(GAME_WIDTH - 200, 50, 190, 200);
        ctx.fillStyle = '#00ff00';
        ctx.font = '11px monospace';
        const lines = [
            `SHIPS SUNK: ${stats.shipsSunk}`,
            `DMG DEALT: ${stats.totalDamageDealt}`,
            `DMG TAKEN: ${stats.totalDamageTaken}`,
            `CRITS: ${stats.critCount}`,
            `LOOT: ${stats.lootCollected}`,
            `CANNONS: ${stats.cannonsFired}`,
            `MAX STREAK: ${stats.maxKillStreak}`,
            `STREAK: ${killStreak}`,
            `GOLD EARNED: ${stats.goldEarned}`,
            `---`,
            `ARMOR: ${Math.floor(player.armor)}`,
            `GOLD: ${game.gold}`,
            `DAY: ${game.day}`
        ];
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], GAME_WIDTH - 190, 65 + i * 14);
        }
    }

    // Day transition screen (when player is destroyed)
    if (player.armor <= 0 && game.state === 'sailing') {
        const timePlayed = Math.floor((Date.now() - game.startTime) / 1000);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = '#cc6040';
        ctx.font = '40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SHIP DESTROYED!', GAME_WIDTH / 2, 100);

        // Performance rating
        let rating = 'DECKHAND';
        let ratingColor = '#cc4040';
        if (stats.shipsSunk >= 2) { rating = 'SAILOR'; ratingColor = '#aaaa40'; }
        if (stats.shipsSunk >= 4 && stats.critCount >= 1) { rating = 'CAPTAIN'; ratingColor = '#40aa60'; }
        if (stats.shipsSunk >= 6 && stats.critCount >= 3) { rating = 'ADMIRAL'; ratingColor = '#40aaff'; }

        ctx.fillStyle = ratingColor;
        ctx.font = '28px monospace';
        ctx.fillText(`RATING: ${rating}`, GAME_WIDTH / 2, 150);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '16px monospace';
        const statsLines = [
            `TIME SAILED: ${Math.floor(timePlayed / 60)}:${(timePlayed % 60).toString().padStart(2, '0')}`,
            ``,
            `SHIPS SUNK: ${stats.shipsSunk}`,
            `DAMAGE DEALT: ${stats.totalDamageDealt}`,
            `DAMAGE TAKEN: ${stats.totalDamageTaken}`,
            `CRITICAL HITS: ${stats.critCount}`,
            `MAX KILL STREAK: ${stats.maxKillStreak}`,
            ``,
            `LOOT COLLECTED: ${stats.lootCollected}`,
            `CANNONS FIRED: ${stats.cannonsFired}`,
            `TOTAL GOLD EARNED: ${stats.goldEarned}`,
            ``,
            `DAY: ${game.day}  GOLD: ${game.gold}`
        ];
        for (let i = 0; i < statsLines.length; i++) {
            ctx.fillText(statsLines[i], GAME_WIDTH / 2, 200 + i * 24);
        }

        ctx.textAlign = 'left';
    }
}

// Start
init();
