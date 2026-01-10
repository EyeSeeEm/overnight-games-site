// Star of Providence Clone - Canvas Version (Expanded + Polished)
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Color palette - dark sci-fi pixel art
const COLORS = {
    background: '#0a0a15',
    floorDark: '#2a1a0a',
    floorLight: '#3a2810',
    wallDark: '#483018',
    wallLight: '#584020',
    wallHighlight: '#685028',
    uiGreen: '#00ff88',
    uiGreenDark: '#00aa55',
    uiRed: '#ff4444',
    uiOrange: '#ff8800',
    uiYellow: '#ffcc00',
    player: '#00ffaa',
    playerGlow: '#00ff88',
    bulletPlayer: '#ffff00',
    bulletPlayerSuper: '#ff8800',
    bulletEnemy: '#ff4444',
    bulletEnemyOrange: '#ff6600',
    bulletHoming: '#ff00ff',
    debris: '#ffcc00',
    ghost: '#4488aa',
    drone: '#888899',
    turret: '#aa6644',
    charger: '#cc4488',
    spawner: '#66aa66',
    boss: '#ff4466',
    bossElite: '#aa00ff',
    fireball: '#ff4400',
    heart: '#00ff66',
    energy: '#00ccff',
    elite: '#aa00ff',
    critical: '#ffff00'
};

// Game state
const game = {
    state: 'playing',
    floor: 1,
    room: 0,
    roomsCleared: 0,
    debris: 0,
    multiplier: 1.0,
    time: 0,
    wave: 1,
    maxWave: 5,
    combo: 0,
    comboTimer: 0,
    comboMultiplier: 1,
    bossActive: false,
    salvageChoices: [],
    screenShake: 0,
    screenFlash: 0,
    screenFlashColor: '#ffffff',
    slowMotion: 1,
    slowMotionTimer: 0,
    victory: false
};

// Player
const player = {
    x: 400,
    y: 450,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    speed: 250,
    focusSpeed: 100,
    hp: 4,
    maxHp: 4,
    bombs: 2,
    maxBombs: 3,
    energy: 100,
    maxEnergy: 100,
    damage: 1,
    fireRate: 10,
    fireCooldown: 0,
    bulletCount: 1,
    bulletSpeed: 600,
    range: 500,
    dashCooldown: 0,
    dashDuration: 0,
    invincible: 0,
    isFocused: false,
    weapon: 'PEASHOOTER',
    critChance: 0.1,
    lifesteal: 0,
    shield: 0,
    trail: [],
    superShotCharge: 0,
    hasHoming: false,
    hasPiercing: false
};

// Input
const keys = {};
const mouse = { x: 400, y: 300, down: false, rightDown: false };

// Entity arrays
let playerBullets = [];
let enemyBullets = [];
let enemies = [];
let pickups = [];
let particles = [];
let damageNumbers = [];

// Room layout
const TILE_SIZE = 32;
const ROOM_WIDTH = 20;
const ROOM_HEIGHT = 14;
let roomTiles = [];

// Salvage upgrades
const SALVAGES = [
    { id: 'damage', name: 'DAMAGE UP', desc: '+25% damage', apply: () => { player.damage *= 1.25; } },
    { id: 'speed', name: 'SPEED UP', desc: '+15% speed', apply: () => { player.speed *= 1.15; player.focusSpeed *= 1.15; } },
    { id: 'firerate', name: 'FIRE RATE', desc: '+20% fire rate', apply: () => { player.fireRate *= 1.2; } },
    { id: 'health', name: 'VITALITY', desc: '+1 max HP', apply: () => { player.maxHp++; player.hp++; } },
    { id: 'crit', name: 'CRITICAL', desc: '+10% crit chance', apply: () => { player.critChance += 0.1; } },
    { id: 'bullets', name: 'MULTI-SHOT', desc: '+1 bullet', apply: () => { player.bulletCount++; } },
    { id: 'lifesteal', name: 'LIFESTEAL', desc: 'Heal on kills', apply: () => { player.lifesteal += 0.1; } },
    { id: 'homing', name: 'HOMING', desc: 'Bullets track enemies', apply: () => { player.hasHoming = true; } },
    { id: 'piercing', name: 'PIERCING', desc: 'Bullets pierce', apply: () => { player.hasPiercing = true; } },
    { id: 'shield', name: 'SHIELD', desc: '+1 shield hit', apply: () => { player.shield++; } }
];

// Generate room
function generateRoom() {
    roomTiles = [];
    for (let y = 0; y < ROOM_HEIGHT; y++) {
        roomTiles[y] = [];
        for (let x = 0; x < ROOM_WIDTH; x++) {
            if (x === 0 || x === ROOM_WIDTH - 1 || y === 0 || y === ROOM_HEIGHT - 1) {
                roomTiles[y][x] = 1;
            } else {
                roomTiles[y][x] = 0;
            }
        }
    }

    // Doors
    roomTiles[0][10] = 2;
    roomTiles[ROOM_HEIGHT - 1][10] = 2;
    roomTiles[7][0] = 2;
    roomTiles[7][ROOM_WIDTH - 1] = 2;

    // Pillars
    const pillarCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < pillarCount; i++) {
        const px = 3 + Math.floor(Math.random() * (ROOM_WIDTH - 6));
        const py = 3 + Math.floor(Math.random() * (ROOM_HEIGHT - 6));
        roomTiles[py][px] = 1;
        if (Math.random() > 0.5 && px + 1 < ROOM_WIDTH - 1) roomTiles[py][px + 1] = 1;
        if (Math.random() > 0.5 && py + 1 < ROOM_HEIGHT - 1) roomTiles[py + 1][px] = 1;
    }

    player.x = 400;
    player.y = 450;
    game.wave = 1;
    game.bossActive = false;

    spawnWave();
}

function spawnWave() {
    enemies = [];

    // Boss wave every 5 rooms
    if (game.roomsCleared > 0 && game.roomsCleared % 5 === 0 && game.wave === game.maxWave) {
        spawnBoss();
        return;
    }

    const count = 3 + game.floor + game.wave + Math.floor(game.roomsCleared / 3);

    for (let i = 0; i < count; i++) {
        const types = ['ghost', 'drone', 'turret', 'charger', 'spawner'];
        const weights = [0.35, 0.25, 0.2, 0.12, 0.08];
        const rand = Math.random();
        let cumulative = 0;
        let type = 'ghost';
        for (let j = 0; j < weights.length; j++) {
            cumulative += weights[j];
            if (rand < cumulative) {
                type = types[j];
                break;
            }
        }

        let x, y;
        let valid = false;
        while (!valid) {
            x = 80 + Math.random() * 560;
            y = 80 + Math.random() * 280;
            if (Math.hypot(x - player.x, y - player.y) > 150) {
                valid = true;
            }
        }

        // Elite chance
        const isElite = Math.random() < 0.1 + game.floor * 0.02;
        enemies.push(createEnemy(type, x, y, isElite));
    }
}

function spawnBoss() {
    game.bossActive = true;

    const boss = createEnemy('boss', 400, 200, false);
    boss.hp = 80 + game.floor * 30;
    boss.maxHp = boss.hp;
    boss.phase = 1;
    boss.attackPattern = 0;
    enemies.push(boss);
}

function createEnemy(type, x, y, isElite = false) {
    const configs = {
        ghost: { hp: 3, speed: 80, fireRate: 2000, size: 16, debris: 10, color: COLORS.ghost },
        drone: { hp: 5, speed: 120, fireRate: 1500, size: 14, debris: 30, color: COLORS.drone },
        turret: { hp: 8, speed: 0, fireRate: 1000, size: 18, debris: 25, color: COLORS.turret },
        charger: { hp: 6, speed: 200, fireRate: 0, size: 16, debris: 20, color: COLORS.charger },
        spawner: { hp: 10, speed: 30, fireRate: 3000, size: 22, debris: 40, color: COLORS.spawner },
        boss: { hp: 100, speed: 40, fireRate: 800, size: 40, debris: 200, color: COLORS.boss }
    };
    const cfg = configs[type];
    return {
        type, x, y,
        vx: (Math.random() - 0.5) * cfg.speed,
        vy: (Math.random() - 0.5) * cfg.speed,
        hp: cfg.hp * (isElite ? 2 : 1),
        maxHp: cfg.hp * (isElite ? 2 : 1),
        speed: cfg.speed,
        fireRate: cfg.fireRate,
        lastFire: Math.random() * 1000,
        size: cfg.size * (isElite ? 1.3 : 1),
        color: isElite ? COLORS.elite : cfg.color,
        debris: cfg.debris * (isElite ? 2 : 1),
        hitFlash: 0,
        angle: Math.random() * Math.PI * 2,
        isElite,
        chargeTimer: 0,
        spawnTimer: 0,
        phase: 1,
        attackPattern: 0
    };
}

// Drawing
function drawRoom() {
    const offsetX = (canvas.width - ROOM_WIDTH * TILE_SIZE) / 2 + (Math.random() - 0.5) * game.screenShake * 2;
    const offsetY = 80 + (Math.random() - 0.5) * game.screenShake * 2;

    for (let y = 0; y < ROOM_HEIGHT; y++) {
        for (let x = 0; x < ROOM_WIDTH; x++) {
            const tile = roomTiles[y][x];
            const tx = offsetX + x * TILE_SIZE;
            const ty = offsetY + y * TILE_SIZE;

            if (tile === 0) {
                const isLight = (x + y) % 2 === 0;
                ctx.fillStyle = isLight ? COLORS.floorLight : COLORS.floorDark;
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
            } else if (tile === 1) {
                ctx.fillStyle = COLORS.wallDark;
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.wallLight;
                ctx.fillRect(tx + 2, ty + 2, 12, 10);
                ctx.fillRect(tx + 18, ty + 2, 12, 10);
                ctx.fillRect(tx + 8, ty + 16, 16, 10);
                ctx.fillStyle = COLORS.wallHighlight;
                ctx.fillRect(tx + 2, ty + 2, 12, 3);
            } else if (tile === 2) {
                ctx.fillStyle = COLORS.floorDark;
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#444444';
                ctx.fillRect(tx + 8, ty + 4, 16, 24);
            }
        }
    }

    ctx.strokeStyle = COLORS.uiGreenDark;
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX, offsetY, ROOM_WIDTH * TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);
}

function drawPlayer() {
    const { x, y, angle, invincible, isFocused, dashDuration, shield } = player;

    if (invincible > 0 && Math.floor(invincible * 10) % 2 === 0) return;

    // Trail
    player.trail.forEach((t, i) => {
        ctx.save();
        ctx.globalAlpha = t.alpha * 0.3;
        ctx.translate(t.x, t.y);
        ctx.rotate(t.angle + Math.PI / 2);
        ctx.fillStyle = COLORS.playerGlow;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(-8, 8);
        ctx.lineTo(0, 4);
        ctx.lineTo(8, 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    });

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);

    if (dashDuration > 0) {
        ctx.shadowColor = COLORS.playerGlow;
        ctx.shadowBlur = 20;
    }

    // Engine glow
    ctx.fillStyle = isFocused ? '#ff4488' : COLORS.playerGlow;
    ctx.fillRect(-4, 8, 8, 6 + Math.sin(game.time * 20) * 2);

    // Ship body
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-8, 8);
    ctx.lineTo(0, 4);
    ctx.lineTo(8, 8);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -4, 4, 4);

    // Shield indicator
    if (shield > 0) {
        ctx.strokeStyle = COLORS.energy;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Focus hitbox
    if (isFocused) {
        ctx.strokeStyle = '#ff4488';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Charge indicator
    if (player.superShotCharge > 0) {
        ctx.strokeStyle = COLORS.bulletPlayerSuper;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 12 + player.superShotCharge * 8, 0, Math.PI * 2 * player.superShotCharge);
        ctx.stroke();
    }

    ctx.restore();
}

function drawEnemy(enemy) {
    const { x, y, type, size, color, hp, maxHp, hitFlash, angle, isElite, phase } = enemy;

    ctx.save();
    ctx.translate(x, y);

    const drawColor = hitFlash > 0 ? '#ffffff' : color;

    // Elite glow
    if (isElite) {
        ctx.shadowColor = COLORS.elite;
        ctx.shadowBlur = 10;
    }

    if (type === 'ghost') {
        ctx.fillStyle = drawColor;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.fillRect(-6, -4, 4, 4);
        ctx.fillRect(2, -4, 4, 4);
        ctx.fillStyle = drawColor;
        for (let i = -2; i <= 2; i++) {
            ctx.fillRect(i * 6 - 2, size - 4 + Math.sin(game.time * 5 + i) * 2, 4, 6);
        }
    } else if (type === 'drone') {
        ctx.rotate(angle);
        ctx.fillStyle = drawColor;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size * 0.7, size * 0.7);
        ctx.lineTo(0, size * 0.3);
        ctx.lineTo(size * 0.7, size * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-2, -4, 4, 4);
    } else if (type === 'turret') {
        ctx.fillStyle = drawColor;
        ctx.fillRect(-size, -size, size * 2, size * 2);
        ctx.rotate(angle);
        ctx.fillStyle = '#666666';
        ctx.fillRect(-3, -size - 8, 6, 12);
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'charger') {
        ctx.rotate(angle);
        ctx.fillStyle = drawColor;
        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.lineTo(-size * 0.5, -size * 0.8);
        ctx.lineTo(-size * 0.5, size * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(size * 0.3, -2, 6, 4);
    } else if (type === 'spawner') {
        ctx.fillStyle = drawColor;
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + game.time;
            const px = Math.cos(a) * size;
            const py = Math.sin(a) * size;
            ctx.beginPath();
            ctx.arc(px, py, size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'boss') {
        // Boss - large menacing design
        ctx.fillStyle = drawColor;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();

        // Inner details
        ctx.fillStyle = '#200020';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-size * 0.4, -size * 0.2, size * 0.2, size * 0.15);
        ctx.fillRect(size * 0.2, -size * 0.2, size * 0.2, size * 0.15);

        // Mouth
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(-size * 0.3, size * 0.1, size * 0.6, size * 0.2);

        // Phase indicator
        for (let i = 0; i < phase; i++) {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(-size * 0.5 + i * size * 0.4, -size - 10, size * 0.3, 6);
        }
    }

    ctx.restore();

    // HP bar
    if (hp < maxHp) {
        const barWidth = size * 2;
        ctx.fillStyle = '#400000';
        ctx.fillRect(x - barWidth / 2, y - size - 12, barWidth, 4);
        ctx.fillStyle = type === 'boss' ? COLORS.boss : COLORS.uiRed;
        ctx.fillRect(x - barWidth / 2, y - size - 12, barWidth * (hp / maxHp), 4);
    }
}

function drawBullet(bullet, isEnemy) {
    ctx.save();
    ctx.translate(bullet.x, bullet.y);

    if (isEnemy) {
        ctx.fillStyle = bullet.color || COLORS.bulletEnemy;
        ctx.beginPath();
        ctx.arc(0, 0, bullet.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#800000';
        ctx.beginPath();
        ctx.arc(0, 0, bullet.size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Homing trail
        if (bullet.homing) {
            ctx.strokeStyle = COLORS.bulletHoming;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-bullet.size * 2, 0);
            ctx.lineTo(-bullet.size * 4, 0);
            ctx.stroke();
        }
    } else {
        const angle = Math.atan2(bullet.vy, bullet.vx);
        ctx.rotate(angle);

        ctx.fillStyle = bullet.isSuper ? COLORS.bulletPlayerSuper : COLORS.bulletPlayer;
        if (bullet.isCrit) {
            ctx.shadowColor = COLORS.critical;
            ctx.shadowBlur = 10;
        }
        ctx.fillRect(-bullet.size * 1.5, -bullet.size / 2, bullet.size * 3, bullet.size);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bullet.size * 0.5, -1, bullet.size, 2);
    }

    ctx.restore();
}

function drawPickup(pickup) {
    const { x, y, type, value } = pickup;
    const bob = Math.sin(game.time * 5 + x) * 3;

    ctx.save();
    ctx.translate(x, y + bob);

    if (type === 'debris') {
        ctx.fillStyle = COLORS.debris;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const r = 6 + Math.min(value, 5);
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    } else if (type === 'health') {
        ctx.fillStyle = COLORS.heart;
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.bezierCurveTo(-8, -4, -8, -8, 0, -4);
        ctx.bezierCurveTo(8, -8, 8, -4, 0, 4);
        ctx.fill();
    } else if (type === 'energy') {
        ctx.fillStyle = COLORS.energy;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(6, 0);
        ctx.lineTo(0, 8);
        ctx.lineTo(-6, 0);
        ctx.closePath();
        ctx.fill();
    } else if (type === 'bomb') {
        ctx.fillStyle = COLORS.uiOrange;
        ctx.fillRect(-6, -6, 12, 12);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-4, -8, 2, 4);
    }

    ctx.restore();
}

function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size * p.life, p.size * p.life);
    ctx.restore();
}

function drawDamageNumber(dn) {
    ctx.save();
    ctx.globalAlpha = dn.life;
    ctx.font = `bold ${dn.isCrit ? 16 : 12}px monospace`;
    ctx.fillStyle = dn.isCrit ? COLORS.critical : '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(dn.value, dn.x, dn.y);
    ctx.restore();
}

function drawHUD() {
    const offsetX = (canvas.width - ROOM_WIDTH * TILE_SIZE) / 2;

    // Weapon panel (left)
    ctx.strokeStyle = COLORS.uiGreen;
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX, 15, 120, 50);
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(offsetX + 2, 17, 116, 46);

    ctx.fillStyle = COLORS.uiGreen;
    ctx.fillRect(offsetX + 10, 25, 30, 20);
    ctx.fillStyle = '#000000';
    ctx.fillRect(offsetX + 12, 27, 26, 16);
    ctx.fillStyle = COLORS.bulletPlayer;
    ctx.fillRect(offsetX + 15, 32, 20, 6);

    ctx.fillStyle = COLORS.uiGreen;
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('∞', offsetX + 50, 40);

    // Bombs
    ctx.fillStyle = COLORS.uiOrange;
    for (let i = 0; i < player.maxBombs; i++) {
        if (i < player.bombs) {
            ctx.fillRect(offsetX + 10 + i * 12, 52, 8, 8);
        } else {
            ctx.strokeStyle = COLORS.uiOrange;
            ctx.lineWidth = 1;
            ctx.strokeRect(offsetX + 10 + i * 12, 52, 8, 8);
        }
    }

    // HP hearts (center)
    const hpStartX = 280;
    for (let i = 0; i < player.maxHp; i++) {
        const hx = hpStartX + i * 24;
        if (i < player.hp) {
            ctx.fillStyle = COLORS.heart;
            ctx.beginPath();
            ctx.moveTo(hx, 38);
            ctx.bezierCurveTo(hx - 10, 20, hx - 10, 14, hx, 24);
            ctx.bezierCurveTo(hx + 10, 14, hx + 10, 20, hx, 38);
            ctx.fill();
        } else {
            ctx.strokeStyle = COLORS.uiGreenDark;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(hx, 38);
            ctx.bezierCurveTo(hx - 10, 20, hx - 10, 14, hx, 24);
            ctx.bezierCurveTo(hx + 10, 14, hx + 10, 20, hx, 38);
            ctx.stroke();
        }
    }

    // Shield indicators
    for (let i = 0; i < player.shield; i++) {
        ctx.strokeStyle = COLORS.energy;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hpStartX + player.maxHp * 24 + 15 + i * 20, 30, 8, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Multiplier & debris panel (right)
    const rightX = offsetX + ROOM_WIDTH * TILE_SIZE - 120;
    ctx.strokeStyle = COLORS.uiGreen;
    ctx.lineWidth = 2;
    ctx.strokeRect(rightX, 15, 120, 50);
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(rightX + 2, 17, 116, 46);

    ctx.fillStyle = COLORS.uiGreen;
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`x${game.multiplier.toFixed(1)}`, rightX + 110, 38);
    ctx.fillStyle = COLORS.debris;
    ctx.fillText(`${game.debris}G`, rightX + 110, 55);

    // Floor/wave indicator
    ctx.fillStyle = COLORS.uiGreen;
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`FLOOR ${game.floor} - ROOM ${game.roomsCleared + 1} - WAVE ${game.wave}/${game.maxWave}`, canvas.width / 2, canvas.height - 20);

    // Enemy count
    ctx.textAlign = 'right';
    ctx.fillText(`ENEMIES: ${enemies.length}`, canvas.width - 20, canvas.height - 20);

    // Combo display
    if (game.combo > 1) {
        ctx.fillStyle = COLORS.uiOrange;
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${game.combo}x COMBO`, canvas.width / 2, 75);
    }

    // Dash cooldown
    if (player.dashCooldown > 0) {
        ctx.fillStyle = '#444444';
        ctx.fillRect(canvas.width / 2 - 30, canvas.height - 45, 60, 6);
        ctx.fillStyle = COLORS.uiGreen;
        ctx.fillRect(canvas.width / 2 - 30, canvas.height - 45, 60 * (1 - player.dashCooldown / 0.5), 6);
    }

    // Boss health bar
    if (game.bossActive) {
        const boss = enemies.find(e => e.type === 'boss');
        if (boss) {
            ctx.fillStyle = '#200020';
            ctx.fillRect(200, 65, 400, 16);
            ctx.fillStyle = COLORS.boss;
            ctx.fillRect(202, 67, 396 * (boss.hp / boss.maxHp), 12);
            ctx.fillStyle = COLORS.uiRed;
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('FLOOR GUARDIAN', canvas.width / 2, 60);
        }
    }

    // Key hints
    ctx.fillStyle = '#444444';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('WASD:Move | LMB:Shoot | RMB:Focus | Z:Dash | E:Bomb', 10, canvas.height - 5);
}

function drawSalvageScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.uiGreen;
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CHOOSE ONE SALVAGE', canvas.width / 2, 150);

    // Draw 3 choices
    game.salvageChoices.forEach((salvage, i) => {
        const x = 150 + i * 250;
        const y = 300;
        const isHovered = mouse.x > x - 80 && mouse.x < x + 80 && mouse.y > y - 60 && mouse.y < y + 60;

        ctx.strokeStyle = isHovered ? COLORS.uiGreen : COLORS.uiOrange;
        ctx.lineWidth = isHovered ? 4 : 2;
        ctx.strokeRect(x - 80, y - 60, 160, 120);

        ctx.fillStyle = isHovered ? '#1a1a2a' : COLORS.background;
        ctx.fillRect(x - 78, y - 58, 156, 116);

        ctx.fillStyle = COLORS.uiOrange;
        ctx.font = 'bold 14px monospace';
        ctx.fillText(salvage.name, x, y - 20);

        ctx.fillStyle = COLORS.uiGreen;
        ctx.font = '12px monospace';
        ctx.fillText(salvage.desc, x, y + 20);

        ctx.fillStyle = '#666666';
        ctx.font = '10px monospace';
        ctx.fillText(`[${i + 1}]`, x, y + 50);
    });
}

// Update functions
function updatePlayer(dt) {
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (dx && dy) {
        dx *= 0.707;
        dy *= 0.707;
    }

    player.isFocused = keys['shift'] || mouse.rightDown;
    const speed = player.isFocused ? player.focusSpeed : player.speed;

    if (player.dashDuration > 0) {
        player.dashDuration -= dt;
    } else {
        player.vx = dx * speed;
        player.vy = dy * speed;
    }

    player.x += player.vx * dt * game.slowMotion;
    player.y += player.vy * dt * game.slowMotion;

    // Bounds
    const offsetX = (canvas.width - ROOM_WIDTH * TILE_SIZE) / 2;
    const offsetY = 80;
    player.x = Math.max(offsetX + 20, Math.min(offsetX + ROOM_WIDTH * TILE_SIZE - 20, player.x));
    player.y = Math.max(offsetY + 20, Math.min(offsetY + ROOM_HEIGHT * TILE_SIZE - 20, player.y));

    // Trail
    if (Math.abs(player.vx) > 10 || Math.abs(player.vy) > 10) {
        player.trail.push({ x: player.x, y: player.y, angle: player.angle, alpha: 1 });
        if (player.trail.length > 5) player.trail.shift();
    }
    player.trail.forEach(t => t.alpha -= dt * 3);
    player.trail = player.trail.filter(t => t.alpha > 0);

    // Aim
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    // Shooting
    player.fireCooldown -= dt;
    if ((mouse.down || keys[' ']) && player.fireCooldown <= 0) {
        firePlayerBullet();
        player.fireCooldown = 1 / player.fireRate;
    }

    // Super shot charge
    if (mouse.rightDown && player.isFocused) {
        player.superShotCharge = Math.min(1, player.superShotCharge + dt);
    } else if (player.superShotCharge >= 1) {
        fireSuperShot();
        player.superShotCharge = 0;
    } else {
        player.superShotCharge = 0;
    }

    // Cooldowns
    player.dashCooldown -= dt;
    if (player.dashCooldown < 0) player.dashCooldown = 0;
    if (player.invincible > 0) player.invincible -= dt;
}

function dash() {
    if (player.dashCooldown > 0) return;

    const dashDist = 120;
    const dashSpeed = dashDist / 0.1;

    player.vx = Math.cos(player.angle) * dashSpeed;
    player.vy = Math.sin(player.angle) * dashSpeed;
    player.dashDuration = 0.1;
    player.dashCooldown = 0.5;
    player.invincible = 0.15;

    for (let i = 0; i < 8; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 1,
            decay: 3,
            size: 4,
            color: COLORS.playerGlow
        });
    }
}

function useBomb() {
    if (player.bombs <= 0) return;
    player.bombs--;

    // Clear bullets
    enemyBullets = [];

    // Damage all enemies
    enemies.forEach(e => {
        e.hp -= 10;
        e.hitFlash = 1;
        if (e.hp <= 0) {
            killEnemy(enemies.indexOf(e));
        }
    });

    // Screen effect
    game.screenFlash = 0.3;
    game.screenFlashColor = COLORS.uiOrange;
    game.screenShake = 10;

    // Particles
    for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        particles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * 300,
            vy: Math.sin(angle) * 300,
            life: 1,
            decay: 2,
            size: 6,
            color: COLORS.uiOrange
        });
    }
}

function firePlayerBullet() {
    const spread = player.isFocused ? 0 : 0.1;

    for (let i = 0; i < player.bulletCount; i++) {
        const offset = player.bulletCount > 1 ? (i - (player.bulletCount - 1) / 2) * 0.15 : 0;
        const angle = player.angle + (Math.random() - 0.5) * spread + offset;

        const isCrit = Math.random() < player.critChance;

        playerBullets.push({
            x: player.x + Math.cos(angle) * 15,
            y: player.y + Math.sin(angle) * 15,
            vx: Math.cos(angle) * player.bulletSpeed,
            vy: Math.sin(angle) * player.bulletSpeed,
            damage: player.damage * (isCrit ? 2 : 1),
            size: 4,
            isCrit,
            homing: player.hasHoming,
            piercing: player.hasPiercing,
            pierceCount: 3
        });
    }

    // Muzzle flash
    particles.push({
        x: player.x + Math.cos(player.angle) * 18,
        y: player.y + Math.sin(player.angle) * 18,
        vx: 0,
        vy: 0,
        life: 1,
        decay: 10,
        size: 8,
        color: COLORS.bulletPlayer
    });
}

function fireSuperShot() {
    const angle = player.angle;

    for (let i = -3; i <= 3; i++) {
        const a = angle + i * 0.1;
        playerBullets.push({
            x: player.x + Math.cos(a) * 15,
            y: player.y + Math.sin(a) * 15,
            vx: Math.cos(a) * player.bulletSpeed * 1.5,
            vy: Math.sin(a) * player.bulletSpeed * 1.5,
            damage: player.damage * 3,
            size: 6,
            isSuper: true,
            piercing: true,
            pierceCount: 5
        });
    }

    game.screenShake = 5;
}

function updateEnemies(dt) {
    enemies.forEach((enemy, index) => {
        enemy.hitFlash -= dt * 5;
        if (enemy.hitFlash < 0) enemy.hitFlash = 0;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        enemy.angle = Math.atan2(dy, dx);

        const offsetX = (canvas.width - ROOM_WIDTH * TILE_SIZE) / 2;
        const offsetY = 80;

        if (enemy.type === 'ghost') {
            if (dist > 50) {
                enemy.x += (dx / dist) * enemy.speed * dt * game.slowMotion;
                enemy.y += (dy / dist) * enemy.speed * dt * game.slowMotion;
            }
        } else if (enemy.type === 'drone') {
            if (dist > 200) {
                enemy.x += (dx / dist) * enemy.speed * dt * game.slowMotion;
                enemy.y += (dy / dist) * enemy.speed * dt * game.slowMotion;
            } else {
                enemy.x += enemy.vx * dt * game.slowMotion;
                enemy.y += enemy.vy * dt * game.slowMotion;
                if (enemy.x < offsetX + 30 || enemy.x > offsetX + ROOM_WIDTH * TILE_SIZE - 30) enemy.vx *= -1;
                if (enemy.y < offsetY + 30 || enemy.y > offsetY + ROOM_HEIGHT * TILE_SIZE - 30) enemy.vy *= -1;
            }
        } else if (enemy.type === 'charger') {
            enemy.chargeTimer -= dt;
            if (enemy.chargeTimer <= 0) {
                enemy.vx = (dx / dist) * enemy.speed * 2;
                enemy.vy = (dy / dist) * enemy.speed * 2;
                enemy.chargeTimer = 2 + Math.random();
            }
            enemy.x += enemy.vx * dt * game.slowMotion;
            enemy.y += enemy.vy * dt * game.slowMotion;
            enemy.vx *= 0.98;
            enemy.vy *= 0.98;
        } else if (enemy.type === 'spawner') {
            enemy.x += (dx / dist) * enemy.speed * dt * game.slowMotion;
            enemy.y += (dy / dist) * enemy.speed * dt * game.slowMotion;

            enemy.spawnTimer -= dt * 1000;
            if (enemy.spawnTimer <= 0 && enemies.length < 15) {
                enemies.push(createEnemy('ghost', enemy.x, enemy.y, false));
                enemy.spawnTimer = 5000;
            }
        } else if (enemy.type === 'boss') {
            updateBoss(enemy, dt, dx, dy, dist);
        }

        // Bounds
        enemy.x = Math.max(offsetX + 30, Math.min(offsetX + ROOM_WIDTH * TILE_SIZE - 30, enemy.x));
        enemy.y = Math.max(offsetY + 30, Math.min(offsetY + ROOM_HEIGHT * TILE_SIZE - 30, enemy.y));

        // Firing
        if (enemy.type !== 'charger' && enemy.type !== 'boss') {
            enemy.lastFire -= dt * 1000;
            if (enemy.lastFire <= 0 && dist < 500) {
                fireEnemyBullet(enemy);
                enemy.lastFire = enemy.fireRate;
            }
        }

        // Contact damage
        if (player.invincible <= 0 && dist < enemy.size + 10) {
            playerHit();
        }
    });
}

function updateBoss(boss, dt, dx, dy, dist) {
    // Phase transitions
    const hpRatio = boss.hp / boss.maxHp;
    if (hpRatio < 0.3 && boss.phase < 3) {
        boss.phase = 3;
        boss.fireRate = 400;
    } else if (hpRatio < 0.6 && boss.phase < 2) {
        boss.phase = 2;
        boss.fireRate = 600;
    }

    // Movement
    const targetDist = 200;
    if (dist > targetDist + 50) {
        boss.x += (dx / dist) * boss.speed * dt * game.slowMotion;
        boss.y += (dy / dist) * boss.speed * dt * game.slowMotion;
    } else if (dist < targetDist - 50) {
        boss.x -= (dx / dist) * boss.speed * dt * game.slowMotion;
        boss.y -= (dy / dist) * boss.speed * dt * game.slowMotion;
    }

    // Attacks
    boss.lastFire -= dt * 1000;
    if (boss.lastFire <= 0) {
        boss.attackPattern = (boss.attackPattern + 1) % 3;

        if (boss.attackPattern === 0) {
            // Spiral
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * Math.PI * 2 + game.time;
                enemyBullets.push({
                    x: boss.x, y: boss.y,
                    vx: Math.cos(a) * 120,
                    vy: Math.sin(a) * 120,
                    size: 6, color: COLORS.bulletEnemy
                });
            }
        } else if (boss.attackPattern === 1) {
            // Aimed burst
            for (let i = -3; i <= 3; i++) {
                const a = boss.angle + i * 0.15;
                enemyBullets.push({
                    x: boss.x, y: boss.y,
                    vx: Math.cos(a) * 180,
                    vy: Math.sin(a) * 180,
                    size: 6, color: COLORS.bulletEnemyOrange
                });
            }
        } else {
            // Homing missiles
            for (let i = 0; i < boss.phase + 1; i++) {
                const a = (i / (boss.phase + 1)) * Math.PI * 2;
                enemyBullets.push({
                    x: boss.x, y: boss.y,
                    vx: Math.cos(a) * 60,
                    vy: Math.sin(a) * 60,
                    size: 8, color: COLORS.bulletHoming,
                    homing: true, homingStrength: 2
                });
            }
        }

        boss.lastFire = boss.fireRate;
    }
}

function fireEnemyBullet(enemy) {
    const speed = 150;

    if (enemy.type === 'turret') {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            enemyBullets.push({
                x: enemy.x, y: enemy.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 6, color: COLORS.bulletEnemyOrange
            });
        }
    } else if (enemy.type === 'drone') {
        for (let i = -1; i <= 1; i++) {
            const angle = enemy.angle + i * 0.3;
            enemyBullets.push({
                x: enemy.x, y: enemy.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 5, color: COLORS.bulletEnemy
            });
        }
    } else if (enemy.type === 'spawner') {
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            enemyBullets.push({
                x: enemy.x, y: enemy.y,
                vx: Math.cos(angle) * speed * 0.8,
                vy: Math.sin(angle) * speed * 0.8,
                size: 4, color: COLORS.spawner
            });
        }
    } else {
        enemyBullets.push({
            x: enemy.x, y: enemy.y,
            vx: Math.cos(enemy.angle) * speed,
            vy: Math.sin(enemy.angle) * speed,
            size: 5, color: COLORS.bulletEnemy
        });
    }
}

function updateBullets(dt) {
    const offsetX = (canvas.width - ROOM_WIDTH * TILE_SIZE) / 2;
    const offsetY = 80;
    const minX = offsetX;
    const maxX = offsetX + ROOM_WIDTH * TILE_SIZE;
    const minY = offsetY;
    const maxY = offsetY + ROOM_HEIGHT * TILE_SIZE;

    // Player bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const b = playerBullets[i];

        // Homing
        if (b.homing && enemies.length > 0) {
            let closest = null;
            let closestDist = Infinity;
            enemies.forEach(e => {
                const d = Math.hypot(e.x - b.x, e.y - b.y);
                if (d < closestDist) {
                    closestDist = d;
                    closest = e;
                }
            });
            if (closest && closestDist < 200) {
                const targetAngle = Math.atan2(closest.y - b.y, closest.x - b.x);
                const currentAngle = Math.atan2(b.vy, b.vx);
                let angleDiff = targetAngle - currentAngle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                const newAngle = currentAngle + angleDiff * dt * 5;
                const speed = Math.hypot(b.vx, b.vy);
                b.vx = Math.cos(newAngle) * speed;
                b.vy = Math.sin(newAngle) * speed;
            }
        }

        b.x += b.vx * dt * game.slowMotion;
        b.y += b.vy * dt * game.slowMotion;

        if (b.x < minX || b.x > maxX || b.y < minY || b.y > maxY) {
            playerBullets.splice(i, 1);
            continue;
        }

        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (Math.hypot(b.x - e.x, b.y - e.y) < e.size + b.size) {
                e.hp -= b.damage;
                e.hitFlash = 1;

                // Damage number
                damageNumbers.push({
                    x: e.x, y: e.y - 20,
                    value: Math.round(b.damage),
                    life: 1,
                    isCrit: b.isCrit
                });

                // Hit particles
                for (let k = 0; k < 4; k++) {
                    particles.push({
                        x: b.x, y: b.y,
                        vx: (Math.random() - 0.5) * 80,
                        vy: (Math.random() - 0.5) * 80,
                        life: 1, decay: 4, size: 3,
                        color: b.isCrit ? COLORS.critical : COLORS.bulletPlayer
                    });
                }

                if (!b.piercing || b.pierceCount <= 0) {
                    playerBullets.splice(i, 1);
                } else {
                    b.pierceCount--;
                }

                if (e.hp <= 0) {
                    killEnemy(j);
                }
                break;
            }
        }
    }

    // Enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];

        // Homing
        if (b.homing) {
            const targetAngle = Math.atan2(player.y - b.y, player.x - b.x);
            const currentAngle = Math.atan2(b.vy, b.vx);
            let angleDiff = targetAngle - currentAngle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            const newAngle = currentAngle + angleDiff * dt * (b.homingStrength || 2);
            const speed = Math.hypot(b.vx, b.vy);
            b.vx = Math.cos(newAngle) * speed;
            b.vy = Math.sin(newAngle) * speed;
        }

        b.x += b.vx * dt * game.slowMotion;
        b.y += b.vy * dt * game.slowMotion;

        if (b.x < minX - 20 || b.x > maxX + 20 || b.y < minY - 20 || b.y > maxY + 20) {
            enemyBullets.splice(i, 1);
            continue;
        }

        if (player.invincible <= 0 && Math.hypot(b.x - player.x, b.y - player.y) < 8 + b.size) {
            playerHit();
            enemyBullets.splice(i, 1);
        }
    }
}

function killEnemy(index) {
    const e = enemies[index];
    if (!e) return;

    // Combo
    game.combo++;
    game.comboTimer = 2;
    game.comboMultiplier = Math.min(5, 1 + game.combo * 0.1);

    // Particles
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: e.x, y: e.y,
            vx: (Math.random() - 0.5) * 150,
            vy: (Math.random() - 0.5) * 150,
            life: 1, decay: 2, size: 5,
            color: e.color
        });
    }

    // Drops
    const debrisValue = Math.floor(e.debris * game.multiplier * game.comboMultiplier);
    pickups.push({
        x: e.x, y: e.y,
        type: 'debris',
        value: Math.min(15, Math.ceil(debrisValue / 10))
    });

    // Health drop
    if (Math.random() < 0.1) {
        pickups.push({ x: e.x + 20, y: e.y, type: 'health', value: 1 });
    }

    // Bomb drop
    if (Math.random() < 0.05) {
        pickups.push({ x: e.x - 20, y: e.y, type: 'bomb', value: 1 });
    }

    // Lifesteal
    if (player.lifesteal > 0 && Math.random() < player.lifesteal) {
        player.hp = Math.min(player.maxHp, player.hp + 1);
        particles.push({
            x: player.x, y: player.y,
            vx: 0, vy: -50,
            life: 1, decay: 2, size: 8,
            color: COLORS.heart
        });
    }

    game.multiplier = Math.min(3.0, game.multiplier + 0.05);
    game.screenShake = Math.max(game.screenShake, e.type === 'boss' ? 15 : 3);

    enemies.splice(index, 1);

    // Wave/room check
    if (enemies.length === 0) {
        if (game.bossActive) {
            game.bossActive = false;
            bossDefeated();
        } else if (game.wave < game.maxWave) {
            game.wave++;
            setTimeout(() => spawnWave(), 1000);
        } else {
            roomCleared();
        }
    }
}

function bossDefeated() {
    // Extra drops
    for (let i = 0; i < 10; i++) {
        pickups.push({
            x: 400 + (Math.random() - 0.5) * 100,
            y: 250 + (Math.random() - 0.5) * 100,
            type: 'debris',
            value: 15
        });
    }

    // Show salvage screen
    setTimeout(() => {
        game.state = 'salvage';
        game.salvageChoices = [];
        const shuffled = [...SALVAGES].sort(() => Math.random() - 0.5);
        game.salvageChoices = shuffled.slice(0, 3);
    }, 1500);
}

function playerHit() {
    // Shield check
    if (player.shield > 0) {
        player.shield--;
        player.invincible = 0.5;
        game.screenFlash = 0.1;
        game.screenFlashColor = COLORS.energy;
        return;
    }

    player.hp--;
    player.invincible = 1.0;
    game.multiplier = Math.max(1.0, game.multiplier - 0.5);
    game.combo = 0;

    for (let i = 0; i < 10; i++) {
        particles.push({
            x: player.x, y: player.y,
            vx: (Math.random() - 0.5) * 150,
            vy: (Math.random() - 0.5) * 150,
            life: 1, decay: 2, size: 4,
            color: COLORS.uiRed
        });
    }

    game.screenShake = 8;
    game.screenFlash = 0.2;
    game.screenFlashColor = COLORS.uiRed;

    if (player.hp <= 0) {
        game.state = 'gameover';
    }
}

function roomCleared() {
    game.roomsCleared++;
    game.floor = Math.floor(game.roomsCleared / 5) + 1;

    // Salvage screen
    game.state = 'salvage';
    game.salvageChoices = [];
    const shuffled = [...SALVAGES].sort(() => Math.random() - 0.5);
    game.salvageChoices = shuffled.slice(0, 3);
}

function selectSalvage(index) {
    if (game.salvageChoices[index]) {
        game.salvageChoices[index].apply();
        game.state = 'playing';
        setTimeout(() => generateRoom(), 500);
    }
}

function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dist = Math.hypot(p.x - player.x, p.y - player.y);

        if (dist < 100) {
            const angle = Math.atan2(player.y - p.y, player.x - p.x);
            const pull = (100 - dist) / 100 * 300;
            p.x += Math.cos(angle) * pull * dt;
            p.y += Math.sin(angle) * pull * dt;
        }

        if (dist < 20) {
            if (p.type === 'debris') {
                game.debris += p.value * 10;
            } else if (p.type === 'health') {
                player.hp = Math.min(player.maxHp, player.hp + 1);
            } else if (p.type === 'energy') {
                player.energy = Math.min(player.maxEnergy, player.energy + 25);
            } else if (p.type === 'bomb') {
                player.bombs = Math.min(player.maxBombs, player.bombs + 1);
            }
            pickups.splice(i, 1);
        }
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updateDamageNumbers(dt) {
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const dn = damageNumbers[i];
        dn.y -= 30 * dt;
        dn.life -= dt * 2;
        if (dn.life <= 0) {
            damageNumbers.splice(i, 1);
        }
    }
}

function updateEffects(dt) {
    if (game.screenShake > 0) game.screenShake -= dt * 30;
    if (game.screenShake < 0) game.screenShake = 0;

    if (game.screenFlash > 0) game.screenFlash -= dt * 3;
    if (game.screenFlash < 0) game.screenFlash = 0;

    if (game.comboTimer > 0) {
        game.comboTimer -= dt;
        if (game.comboTimer <= 0) {
            game.combo = 0;
            game.comboMultiplier = 1;
        }
    }

    if (game.slowMotionTimer > 0) {
        game.slowMotionTimer -= dt;
        if (game.slowMotionTimer <= 0) {
            game.slowMotion = 1;
        }
    }
}

// Main loop
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    game.time += dt;

    // Clear
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === 'playing') {
        updatePlayer(dt);
        updateEnemies(dt);
        updateBullets(dt);
        updatePickups(dt);
        updateParticles(dt);
        updateDamageNumbers(dt);
        updateEffects(dt);
    }

    // Draw
    drawRoom();
    pickups.forEach(drawPickup);
    enemies.forEach(drawEnemy);
    drawPlayer();
    playerBullets.forEach(b => drawBullet(b, false));
    enemyBullets.forEach(b => drawBullet(b, true));
    particles.forEach(drawParticle);
    damageNumbers.forEach(drawDamageNumber);
    drawHUD();

    // Screen flash
    if (game.screenFlash > 0) {
        ctx.fillStyle = game.screenFlashColor;
        ctx.globalAlpha = game.screenFlash;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
    }

    // Salvage screen
    if (game.state === 'salvage') {
        drawSalvageScreen();
    }

    // Game over
    if (game.state === 'gameover') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = 'bold 40px monospace';
        ctx.fillStyle = COLORS.uiRed;
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

        ctx.font = '20px monospace';
        ctx.fillStyle = COLORS.uiGreen;
        ctx.fillText(`DEBRIS: ${game.debris}G`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText(`ROOMS CLEARED: ${game.roomsCleared}`, canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText(`FLOOR: ${game.floor}`, canvas.width / 2, canvas.height / 2 + 70);
        ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 110);
    }

    requestAnimationFrame(gameLoop);
}

// Input
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    if ((e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'q') && game.state === 'playing') {
        dash();
    }

    if (e.key.toLowerCase() === 'e' && game.state === 'playing') {
        useBomb();
    }

    if (e.key === ' ' && game.state === 'gameover') {
        resetGame();
    }

    // Salvage selection
    if (game.state === 'salvage') {
        if (e.key === '1') selectSalvage(0);
        if (e.key === '2') selectSalvage(1);
        if (e.key === '3') selectSalvage(2);
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        mouse.down = true;
        if (game.state === 'salvage') {
            game.salvageChoices.forEach((_, i) => {
                const x = 150 + i * 250;
                const y = 300;
                if (mouse.x > x - 80 && mouse.x < x + 80 && mouse.y > y - 60 && mouse.y < y + 60) {
                    selectSalvage(i);
                }
            });
        }
    }
    if (e.button === 2) mouse.rightDown = true;
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.rightDown = false;
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function resetGame() {
    game.state = 'playing';
    game.floor = 1;
    game.roomsCleared = 0;
    game.debris = 0;
    game.multiplier = 1.0;
    game.combo = 0;
    game.comboTimer = 0;
    game.wave = 1;
    game.bossActive = false;

    player.hp = 4;
    player.maxHp = 4;
    player.bombs = 2;
    player.invincible = 0;
    player.dashCooldown = 0;
    player.damage = 1;
    player.fireRate = 10;
    player.bulletCount = 1;
    player.critChance = 0.1;
    player.lifesteal = 0;
    player.shield = 0;
    player.hasHoming = false;
    player.hasPiercing = false;
    player.speed = 250;
    player.focusSpeed = 100;

    playerBullets = [];
    enemyBullets = [];
    pickups = [];
    particles = [];
    damageNumbers = [];

    generateRoom();
}

// Expose for testing
window.gameState = game;
window.player = player;
window.enemies = enemies;

// Initialize
generateRoom();
requestAnimationFrame(gameLoop);
