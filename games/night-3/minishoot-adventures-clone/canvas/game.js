// Minishoot Adventures Clone - Canvas Version
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Color palette matching reference
const COLORS = {
    background: '#1a2a35',
    forestDark: '#1e3a3a',
    forestLight: '#2d5a4a',
    path: '#d4a864',
    pathDark: '#a67c42',
    treeTeal: '#3a7a8a',
    treeBlue: '#2a5a7a',
    treeOrange: '#e87830',
    playerBody: '#e8f4f8',
    playerAccent: '#50c8ff',
    playerGlow: 'rgba(80, 200, 255, 0.4)',
    bulletPlayer: '#50c8ff',
    bulletEnemy: '#ff6030',
    bulletEnemyDark: '#802010',
    crystal: '#ff3050',
    crystalGlow: 'rgba(255, 48, 80, 0.5)',
    healthFull: '#ff4060',
    healthEmpty: '#402030',
    energyFull: '#50d0ff',
    energyEmpty: '#203040',
    enemyScout: '#50aa70',
    enemyTurret: '#8060a0',
    enemyHeavy: '#c06040',
    white: '#ffffff',
    black: '#000000'
};

// Game state
const game = {
    state: 'playing',
    camera: { x: 0, y: 0 },
    screenShake: 0,
    time: 0,
    crystals: 0,
    level: 1,
    xp: 0,
    xpToLevel: 15
};

// Input
const keys = {};
const mouse = { x: 400, y: 300, down: false, rightDown: false };

// Player
const player = {
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    angle: 0,
    speed: 200,
    health: 5,
    maxHealth: 5,
    energy: 4,
    maxEnergy: 4,
    damage: 1,
    fireRate: 4,
    fireCooldown: 0,
    range: 350,
    invincible: 0,
    dashCooldown: 0,
    hasDash: true
};

// Entity arrays
let playerBullets = [];
let enemyBullets = [];
let enemies = [];
let crystals = [];
let particles = [];
let trees = [];

// World generation - create forest environment
function generateWorld() {
    trees = [];

    // Create fluffy trees around the edges and scattered
    const treePositions = [
        // Top border
        ...Array(12).fill(0).map((_, i) => ({ x: 50 + i * 65, y: 30 + Math.random() * 40 })),
        // Bottom border
        ...Array(12).fill(0).map((_, i) => ({ x: 50 + i * 65, y: 530 + Math.random() * 40 })),
        // Left border
        ...Array(8).fill(0).map((_, i) => ({ x: 20 + Math.random() * 40, y: 80 + i * 65 })),
        // Right border
        ...Array(8).fill(0).map((_, i) => ({ x: 740 + Math.random() * 40, y: 80 + i * 65 })),
        // Scattered in play area
        { x: 150, y: 150 }, { x: 650, y: 150 },
        { x: 200, y: 400 }, { x: 600, y: 420 },
        { x: 350, y: 200 }, { x: 450, y: 450 }
    ];

    treePositions.forEach(pos => {
        const isOrange = Math.random() > 0.7;
        trees.push({
            x: pos.x,
            y: pos.y,
            radius: 30 + Math.random() * 20,
            color: isOrange ? COLORS.treeOrange : (Math.random() > 0.5 ? COLORS.treeTeal : COLORS.treeBlue),
            shadowColor: isOrange ? '#a05018' : '#1a3a4a',
            wobble: Math.random() * Math.PI * 2
        });
    });
}

// Spawn enemies
function spawnEnemies() {
    enemies = [];
    const enemyCount = 4 + game.level * 2;

    for (let i = 0; i < enemyCount; i++) {
        const type = Math.random() < 0.6 ? 'scout' : (Math.random() < 0.7 ? 'turret' : 'heavy');
        let x, y;
        do {
            x = 100 + Math.random() * 600;
            y = 100 + Math.random() * 400;
        } while (Math.hypot(x - player.x, y - player.y) < 200);

        enemies.push(createEnemy(type, x, y));
    }
}

function createEnemy(type, x, y) {
    const configs = {
        scout: { hp: 3, speed: 80, fireRate: 1.2, size: 18, color: COLORS.enemyScout, xp: 2 },
        turret: { hp: 6, speed: 0, fireRate: 0.8, size: 24, color: COLORS.enemyTurret, xp: 4 },
        heavy: { hp: 12, speed: 40, fireRate: 2, size: 30, color: COLORS.enemyHeavy, xp: 6 }
    };
    const cfg = configs[type];
    return {
        type, x, y, vx: 0, vy: 0,
        hp: cfg.hp, maxHp: cfg.hp,
        speed: cfg.speed,
        fireRate: cfg.fireRate,
        fireCooldown: Math.random() * 2,
        size: cfg.size,
        color: cfg.color,
        xp: cfg.xp,
        angle: Math.random() * Math.PI * 2,
        hitFlash: 0
    };
}

// Drawing functions
function drawBackground() {
    // Dark space/void background with stars
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw some stars in background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 50; i++) {
        const sx = (i * 73) % canvas.width;
        const sy = (i * 47) % canvas.height;
        const size = (i % 3) + 1;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw darker forest edge
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(70, 70);
    ctx.bezierCurveTo(200, 45, 600, 45, 730, 70);
    ctx.lineTo(755, 530);
    ctx.bezierCurveTo(650, 565, 150, 565, 45, 530);
    ctx.closePath();
    ctx.fillStyle = COLORS.forestDark;
    ctx.fill();
    ctx.restore();

    // Draw forest ground layer
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(85, 85);
    ctx.bezierCurveTo(200, 60, 600, 60, 715, 85);
    ctx.lineTo(735, 515);
    ctx.bezierCurveTo(650, 545, 150, 545, 65, 515);
    ctx.closePath();
    ctx.fillStyle = COLORS.forestLight;
    ctx.fill();
    ctx.restore();

    // Draw path/ground area
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(100, 100);
    ctx.bezierCurveTo(200, 80, 600, 80, 700, 100);
    ctx.lineTo(720, 500);
    ctx.bezierCurveTo(650, 530, 150, 530, 80, 500);
    ctx.closePath();

    // Path gradient
    const pathGrad = ctx.createLinearGradient(0, 100, 0, 500);
    pathGrad.addColorStop(0, COLORS.path);
    pathGrad.addColorStop(1, COLORS.pathDark);
    ctx.fillStyle = pathGrad;
    ctx.fill();

    // Path outline (edge lighting)
    ctx.strokeStyle = '#8a6030';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
}

function drawTree(tree) {
    const wobble = Math.sin(game.time * 2 + tree.wobble) * 2;

    // Shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(tree.x + 5, tree.y + tree.radius * 0.8, tree.radius * 0.8, tree.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 20, 20, 0.4)';
    ctx.fill();
    ctx.restore();

    // Tree trunk hint
    ctx.fillStyle = '#503020';
    ctx.fillRect(tree.x - 4, tree.y, 8, tree.radius * 0.5);

    // Main fluffy foliage (multiple overlapping circles)
    const fluffCount = 6;
    for (let i = 0; i < fluffCount; i++) {
        const angle = (i / fluffCount) * Math.PI * 2;
        const dist = tree.radius * 0.4;
        const fx = tree.x + Math.cos(angle) * dist + wobble;
        const fy = tree.y - tree.radius * 0.3 + Math.sin(angle) * dist * 0.6;
        const r = tree.radius * 0.6;

        ctx.beginPath();
        ctx.arc(fx, fy, r, 0, Math.PI * 2);
        ctx.fillStyle = tree.shadowColor;
        ctx.fill();
    }

    // Center highlight
    ctx.beginPath();
    ctx.arc(tree.x + wobble, tree.y - tree.radius * 0.3, tree.radius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = tree.color;
    ctx.fill();

    // Highlight circle
    ctx.beginPath();
    ctx.arc(tree.x - tree.radius * 0.2 + wobble, tree.y - tree.radius * 0.5, tree.radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
}

function drawPlayer() {
    const { x, y, angle, invincible } = player;

    if (invincible > 0 && Math.floor(invincible * 10) % 2 === 0) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Glow effect
    ctx.shadowColor = COLORS.playerGlow;
    ctx.shadowBlur = 25;

    // Engine trail/glow
    ctx.beginPath();
    ctx.ellipse(-14, 0, 10, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(80, 200, 255, 0.5)';
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(-16, 0, 6, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(120, 220, 255, 0.8)';
    ctx.fill();

    // Ship shadow
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(2, 4, 12, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 20, 40, 0.3)';
    ctx.fill();

    // Wings (back part)
    ctx.beginPath();
    ctx.moveTo(-8, -12);
    ctx.quadraticCurveTo(-10, -8, -8, 0);
    ctx.quadraticCurveTo(-10, 8, -8, 12);
    ctx.lineTo(-4, 8);
    ctx.lineTo(-4, -8);
    ctx.closePath();
    ctx.fillStyle = '#90c8d8';
    ctx.fill();
    ctx.strokeStyle = '#60a0b8';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Main body (cute rounded spaceship)
    ctx.beginPath();
    ctx.moveTo(14, 0);  // Nose
    ctx.quadraticCurveTo(16, -4, 10, -8);  // Top curve
    ctx.lineTo(-4, -8);  // Top back
    ctx.quadraticCurveTo(-8, -6, -8, 0);  // Back curve top
    ctx.quadraticCurveTo(-8, 6, -4, 8);   // Back curve bottom
    ctx.lineTo(10, 8);  // Bottom back
    ctx.quadraticCurveTo(16, 4, 14, 0);   // Bottom curve to nose
    ctx.closePath();

    // Body gradient (white to light cyan)
    const bodyGrad = ctx.createLinearGradient(-8, -10, 14, 10);
    bodyGrad.addColorStop(0, '#b8e0f0');
    bodyGrad.addColorStop(0.3, '#e8f8ff');
    bodyGrad.addColorStop(0.6, '#ffffff');
    bodyGrad.addColorStop(1, '#d0e8f4');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Body outline
    ctx.strokeStyle = '#70b8d0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cockpit window (cute eye-like)
    ctx.beginPath();
    ctx.ellipse(6, 0, 5, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.playerAccent;
    ctx.fill();
    ctx.strokeStyle = '#40a0c0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Cockpit inner glow
    ctx.beginPath();
    ctx.ellipse(6, 0, 3, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#80e0ff';
    ctx.fill();

    // Cockpit highlight (makes it look shiny/cute)
    ctx.beginPath();
    ctx.ellipse(4, -2, 2, 1.5, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();

    // Small decorative lines on body
    ctx.strokeStyle = 'rgba(80, 180, 220, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-2, -5);
    ctx.lineTo(8, -5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-2, 5);
    ctx.lineTo(8, 5);
    ctx.stroke();

    ctx.restore();
}

function drawEnemy(enemy) {
    const { x, y, type, size, color, hp, maxHp, hitFlash, angle } = enemy;

    ctx.save();
    ctx.translate(x, y);

    // Hit flash effect
    if (hitFlash > 0) {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 20;
    }

    if (type === 'scout') {
        ctx.rotate(angle);
        // Scout - small triangular enemy
        ctx.beginPath();
        ctx.moveTo(size * 0.8, 0);
        ctx.lineTo(-size * 0.5, -size * 0.6);
        ctx.lineTo(-size * 0.3, 0);
        ctx.lineTo(-size * 0.5, size * 0.6);
        ctx.closePath();
        ctx.fillStyle = hitFlash > 0 ? '#ffffff' : color;
        ctx.fill();
        ctx.strokeStyle = '#204030';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eye
        ctx.beginPath();
        ctx.arc(size * 0.2, 0, size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ff8040';
        ctx.fill();
    } else if (type === 'turret') {
        // Turret - hexagonal base with rotating gun
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const px = Math.cos(a) * size;
            const py = Math.sin(a) * size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = hitFlash > 0 ? '#ffffff' : color;
        ctx.fill();
        ctx.strokeStyle = '#402050';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Gun barrel
        ctx.rotate(angle);
        ctx.fillStyle = '#503060';
        ctx.fillRect(0, -4, size * 1.2, 8);

        // Core
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6040';
        ctx.fill();
    } else if (type === 'heavy') {
        // Heavy - large rounded enemy
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = hitFlash > 0 ? '#ffffff' : color;
        ctx.fill();
        ctx.strokeStyle = '#602020';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Face/core
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4020';
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#200000';
        ctx.beginPath();
        ctx.arc(-size * 0.2, -size * 0.1, 4, 0, Math.PI * 2);
        ctx.arc(size * 0.2, -size * 0.1, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    // Health bar for damaged enemies
    if (hp < maxHp) {
        const barWidth = size * 2;
        const barHeight = 4;
        const hpRatio = hp / maxHp;

        ctx.fillStyle = '#400000';
        ctx.fillRect(x - barWidth / 2, y - size - 12, barWidth, barHeight);
        ctx.fillStyle = '#ff4040';
        ctx.fillRect(x - barWidth / 2, y - size - 12, barWidth * hpRatio, barHeight);
    }
}

function drawBullet(bullet, isEnemy) {
    const { x, y, size, vx, vy } = bullet;

    ctx.save();
    ctx.translate(x, y);

    if (isEnemy) {
        // Enemy bullet - orange with dark center and glow ring
        ctx.shadowColor = 'rgba(255, 96, 48, 0.6)';
        ctx.shadowBlur = 8;

        // Outer glow ring
        ctx.beginPath();
        ctx.arc(0, 0, size + 3, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.bulletEnemy;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Main bullet
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.bulletEnemy;
        ctx.fill();

        // Dark center
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.bulletEnemyDark;
        ctx.fill();
    } else {
        // Player bullet - cyan with strong glow and trail
        const angle = Math.atan2(vy, vx);
        ctx.rotate(angle);

        // Trail effect
        ctx.beginPath();
        ctx.ellipse(-8, 0, 12, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(80, 200, 255, 0.3)';
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(-5, 0, 8, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(120, 220, 255, 0.5)';
        ctx.fill();

        // Main bullet with glow
        ctx.shadowColor = COLORS.bulletPlayer;
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.ellipse(0, 0, size + 2, size, 0, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.bulletPlayer;
        ctx.fill();

        // Bright core
        ctx.beginPath();
        ctx.ellipse(1, 0, size * 0.6, size * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }

    ctx.restore();
}

function drawCrystal(crystal) {
    const { x, y, value } = crystal;
    const bob = Math.sin(game.time * 5 + x) * 3;

    ctx.save();
    ctx.translate(x, y + bob);

    // Glow
    ctx.shadowColor = COLORS.crystalGlow;
    ctx.shadowBlur = 15;

    // Crystal shape (diamond)
    const size = 6 + value * 2;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.7, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.7, 0);
    ctx.closePath();
    ctx.fillStyle = COLORS.crystal;
    ctx.fill();

    // Highlight
    ctx.beginPath();
    ctx.moveTo(-2, -size * 0.6);
    ctx.lineTo(2, -size * 0.3);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();

    ctx.restore();
}

function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
}

function drawHUD() {
    // Health hearts
    const heartSize = 18;
    const heartSpacing = 24;
    const startX = 20;
    const startY = 20;

    for (let i = 0; i < player.maxHealth; i++) {
        drawHeart(startX + i * heartSpacing, startY, heartSize, i < player.health);
    }

    // Energy diamonds
    const energyY = 48;
    for (let i = 0; i < player.maxEnergy; i++) {
        drawEnergy(startX + i * heartSpacing, energyY, i < player.energy);
    }

    // Crystal counter
    ctx.fillStyle = COLORS.crystal;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';

    // Crystal icon
    ctx.save();
    ctx.translate(startX + 8, energyY + 35);
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 8);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(game.crystals.toString(), startX + 22, energyY + 40);

    // XP bar
    const xpBarWidth = 150;
    const xpBarHeight = 8;
    const xpRatio = game.xp / game.xpToLevel;

    ctx.fillStyle = '#203040';
    ctx.fillRect(startX, energyY + 52, xpBarWidth, xpBarHeight);
    ctx.fillStyle = '#50ff80';
    ctx.fillRect(startX, energyY + 52, xpBarWidth * xpRatio, xpBarHeight);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(startX, energyY + 52, xpBarWidth, xpBarHeight);

    ctx.font = '12px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`LVL ${game.level}`, startX + xpBarWidth + 8, energyY + 60);

    // Ability icons at bottom center
    drawAbilityBar();

    // Wave indicator
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`Enemies: ${enemies.length}`, canvas.width - 20, 30);
}

function drawHeart(x, y, size, filled) {
    ctx.save();
    ctx.translate(x, y);

    ctx.beginPath();
    ctx.moveTo(0, size * 0.3);
    ctx.bezierCurveTo(-size * 0.5, -size * 0.3, -size * 0.5, -size * 0.6, 0, -size * 0.3);
    ctx.bezierCurveTo(size * 0.5, -size * 0.6, size * 0.5, -size * 0.3, 0, size * 0.3);

    ctx.fillStyle = filled ? COLORS.healthFull : COLORS.healthEmpty;
    ctx.fill();

    if (filled) {
        ctx.beginPath();
        ctx.arc(-size * 0.15, -size * 0.2, size * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
    }

    ctx.restore();
}

function drawEnergy(x, y, filled) {
    ctx.save();
    ctx.translate(x, y);

    // Diamond shape
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-8, 0);
    ctx.closePath();

    ctx.fillStyle = filled ? COLORS.energyFull : COLORS.energyEmpty;
    ctx.fill();
    ctx.strokeStyle = filled ? '#80e0ff' : '#304050';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (filled) {
        ctx.beginPath();
        ctx.moveTo(-2, -5);
        ctx.lineTo(2, -2);
        ctx.lineTo(-1, 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
    }

    ctx.restore();
}

function drawAbilityBar() {
    const abilities = [
        { name: 'DASH', key: 'SPACE', ready: player.dashCooldown <= 0 },
        { name: 'SUPER', key: 'RMB', ready: player.energy >= 1 },
        { name: 'MAP', key: 'TAB', ready: true }
    ];

    const iconSize = 40;
    const spacing = 10;
    const totalWidth = abilities.length * iconSize + (abilities.length - 1) * spacing;
    const startX = (canvas.width - totalWidth) / 2;
    const y = canvas.height - 55;

    abilities.forEach((ability, i) => {
        const x = startX + i * (iconSize + spacing);

        // Hexagon background
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
            const angle = (j / 6) * Math.PI * 2 - Math.PI / 2;
            const px = x + iconSize / 2 + Math.cos(angle) * iconSize / 2;
            const py = y + iconSize / 2 + Math.sin(angle) * iconSize / 2;
            if (j === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = ability.ready ? 'rgba(80, 200, 255, 0.3)' : 'rgba(40, 60, 80, 0.5)';
        ctx.fill();
        ctx.strokeStyle = ability.ready ? '#50c8ff' : '#405060';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Icon text
        ctx.font = '10px Arial';
        ctx.fillStyle = ability.ready ? '#ffffff' : '#606060';
        ctx.textAlign = 'center';
        ctx.fillText(ability.name, x + iconSize / 2, y + iconSize / 2 + 3);
    });
}

// Update functions
function updatePlayer(dt) {
    // Movement
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    // Normalize diagonal
    if (dx && dy) {
        dx *= 0.707;
        dy *= 0.707;
    }

    player.vx = dx * player.speed;
    player.vy = dy * player.speed;

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Bounds
    player.x = Math.max(60, Math.min(740, player.x));
    player.y = Math.max(60, Math.min(540, player.y));

    // Aim toward mouse
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    // Shooting
    player.fireCooldown -= dt;
    if (mouse.down && player.fireCooldown <= 0) {
        firePlayerBullet();
        player.fireCooldown = 1 / player.fireRate;
    }

    // Dash (Space)
    player.dashCooldown -= dt;
    if (keys[' '] && player.dashCooldown <= 0 && player.hasDash) {
        dash();
    }

    // Invincibility
    if (player.invincible > 0) {
        player.invincible -= dt;
    }
}

function dash() {
    const dashDist = 120;
    player.x += Math.cos(player.angle) * dashDist;
    player.y += Math.sin(player.angle) * dashDist;
    player.x = Math.max(60, Math.min(740, player.x));
    player.y = Math.max(60, Math.min(540, player.y));
    player.dashCooldown = 0.8;

    // Dash particles
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: player.x - Math.cos(player.angle) * dashDist * Math.random(),
            y: player.y - Math.sin(player.angle) * dashDist * Math.random(),
            vx: (Math.random() - 0.5) * 50,
            vy: (Math.random() - 0.5) * 50,
            life: 1,
            decay: 2,
            size: 4,
            color: COLORS.playerAccent
        });
    }
}

function firePlayerBullet() {
    const speed = 500;
    playerBullets.push({
        x: player.x + Math.cos(player.angle) * 20,
        y: player.y + Math.sin(player.angle) * 20,
        vx: Math.cos(player.angle) * speed,
        vy: Math.sin(player.angle) * speed,
        damage: player.damage,
        range: player.range,
        traveled: 0,
        size: 5
    });
}

function updateEnemies(dt) {
    enemies.forEach(enemy => {
        enemy.hitFlash -= dt * 5;
        if (enemy.hitFlash < 0) enemy.hitFlash = 0;

        // AI behavior
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        enemy.angle = Math.atan2(dy, dx);

        if (enemy.type === 'scout') {
            // Chase player but keep distance
            if (dist > 150) {
                enemy.x += (dx / dist) * enemy.speed * dt;
                enemy.y += (dy / dist) * enemy.speed * dt;
            } else if (dist < 100) {
                enemy.x -= (dx / dist) * enemy.speed * dt;
                enemy.y -= (dy / dist) * enemy.speed * dt;
            }
        } else if (enemy.type === 'heavy') {
            // Slow advance
            if (dist > 80) {
                enemy.x += (dx / dist) * enemy.speed * dt;
                enemy.y += (dy / dist) * enemy.speed * dt;
            }
        }

        // Firing
        enemy.fireCooldown -= dt;
        if (enemy.fireCooldown <= 0 && dist < 400) {
            fireEnemyBullet(enemy);
            enemy.fireCooldown = enemy.fireRate;
        }
    });
}

function fireEnemyBullet(enemy) {
    const speed = 150;
    const angle = enemy.angle;

    if (enemy.type === 'turret') {
        // Spray 8 bullets
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            enemyBullets.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                size: 6
            });
        }
    } else if (enemy.type === 'heavy') {
        // Spread 5 bullets
        for (let i = -2; i <= 2; i++) {
            const a = angle + i * 0.2;
            enemyBullets.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                size: 7
            });
        }
    } else {
        // Single bullet
        enemyBullets.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 6
        });
    }
}

function updateBullets(dt) {
    // Player bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const b = playerBullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.traveled += Math.hypot(b.vx, b.vy) * dt;

        // Range check
        if (b.traveled > b.range) {
            playerBullets.splice(i, 1);
            continue;
        }

        // Bounds
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            playerBullets.splice(i, 1);
            continue;
        }

        // Hit enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (Math.hypot(b.x - e.x, b.y - e.y) < e.size + b.size) {
                e.hp -= b.damage;
                e.hitFlash = 1;
                playerBullets.splice(i, 1);

                // Hit particles
                for (let k = 0; k < 5; k++) {
                    particles.push({
                        x: b.x,
                        y: b.y,
                        vx: (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        life: 1,
                        decay: 3,
                        size: 3,
                        color: e.color
                    });
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
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Bounds
        if (b.x < -20 || b.x > canvas.width + 20 || b.y < -20 || b.y > canvas.height + 20) {
            enemyBullets.splice(i, 1);
            continue;
        }

        // Hit player
        if (player.invincible <= 0 && Math.hypot(b.x - player.x, b.y - player.y) < 15 + b.size) {
            player.health--;
            player.invincible = 1.5;
            enemyBullets.splice(i, 1);
            game.screenShake = 0.3;

            // Hit particles
            for (let k = 0; k < 8; k++) {
                particles.push({
                    x: player.x,
                    y: player.y,
                    vx: (Math.random() - 0.5) * 150,
                    vy: (Math.random() - 0.5) * 150,
                    life: 1,
                    decay: 2,
                    size: 4,
                    color: COLORS.healthFull
                });
            }

            if (player.health <= 0) {
                game.state = 'gameover';
            }
        }
    }
}

function killEnemy(index) {
    const e = enemies[index];

    // Death particles
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: e.x,
            y: e.y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 1,
            decay: 2,
            size: 5,
            color: e.color
        });
    }

    // Drop crystals
    const crystalCount = Math.ceil(e.xp / 2);
    for (let i = 0; i < crystalCount; i++) {
        crystals.push({
            x: e.x + (Math.random() - 0.5) * 30,
            y: e.y + (Math.random() - 0.5) * 30,
            value: Math.ceil(e.xp / crystalCount),
            magnetRange: 80
        });
    }

    enemies.splice(index, 1);
    game.screenShake = 0.15;

    // Check wave complete
    if (enemies.length === 0) {
        game.level++;
        setTimeout(() => {
            if (game.state === 'playing') {
                spawnEnemies();
            }
        }, 1500);
    }
}

function updateCrystals(dt) {
    for (let i = crystals.length - 1; i >= 0; i--) {
        const c = crystals[i];
        const dx = player.x - c.x;
        const dy = player.y - c.y;
        const dist = Math.hypot(dx, dy);

        // Magnet effect
        if (dist < c.magnetRange) {
            const pull = (c.magnetRange - dist) / c.magnetRange * 300;
            c.x += (dx / dist) * pull * dt;
            c.y += (dy / dist) * pull * dt;
        }

        // Collect
        if (dist < 20) {
            game.crystals += c.value;
            game.xp += c.value;

            // Level up check
            while (game.xp >= game.xpToLevel) {
                game.xp -= game.xpToLevel;
                game.level++;
                game.xpToLevel = Math.floor(game.xpToLevel * 1.2);
                player.damage += 0.2;

                // Level up effect
                for (let k = 0; k < 20; k++) {
                    const angle = (k / 20) * Math.PI * 2;
                    particles.push({
                        x: player.x,
                        y: player.y,
                        vx: Math.cos(angle) * 150,
                        vy: Math.sin(angle) * 150,
                        life: 1,
                        decay: 1.5,
                        size: 4,
                        color: '#50ff80'
                    });
                }
            }

            crystals.splice(i, 1);
        }
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= p.decay * dt;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Main game loop
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    game.time += dt;

    // Update
    if (game.state === 'playing') {
        updatePlayer(dt);
        updateEnemies(dt);
        updateBullets(dt);
        updateCrystals(dt);
        updateParticles(dt);

        if (game.screenShake > 0) {
            game.screenShake -= dt;
        }
    }

    // Draw
    ctx.save();

    // Screen shake
    if (game.screenShake > 0) {
        const shake = game.screenShake * 10;
        ctx.translate(
            (Math.random() - 0.5) * shake,
            (Math.random() - 0.5) * shake
        );
    }

    drawBackground();

    // Draw trees (back layer)
    trees.filter(t => t.y < player.y).forEach(drawTree);

    // Draw crystals
    crystals.forEach(drawCrystal);

    // Draw player
    drawPlayer();

    // Draw enemies
    enemies.forEach(drawEnemy);

    // Draw trees (front layer)
    trees.filter(t => t.y >= player.y).forEach(drawTree);

    // Draw bullets
    playerBullets.forEach(b => drawBullet(b, false));
    enemyBullets.forEach(b => drawBullet(b, true));

    // Draw particles
    particles.forEach(drawParticle);

    ctx.restore();

    // Draw HUD (no shake)
    drawHUD();

    // Game over screen
    if (game.state === 'gameover') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = '#ff4060';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);

        ctx.font = '24px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Crystals: ${game.crystals}  Level: ${game.level}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 60);
    }

    requestAnimationFrame(gameLoop);
}

// Input handlers
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    // Handle dash on keydown for responsive feel
    if ((e.key === ' ' || e.code === 'Space') && game.state === 'playing') {
        if (player.dashCooldown <= 0 && player.hasDash) {
            dash();
        }
    }

    if (e.key === ' ' && game.state === 'gameover') {
        resetGame();
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
    if (e.button === 0) mouse.down = true;
    if (e.button === 2) mouse.rightDown = true;
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.rightDown = false;
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function resetGame() {
    game.state = 'playing';
    game.crystals = 0;
    game.level = 1;
    game.xp = 0;
    game.xpToLevel = 15;
    game.screenShake = 0;

    player.x = 400;
    player.y = 300;
    player.health = player.maxHealth;
    player.energy = player.maxEnergy;
    player.damage = 1;
    player.invincible = 0;

    playerBullets = [];
    enemyBullets = [];
    crystals = [];
    particles = [];

    spawnEnemies();
}

// Initialize
generateWorld();
spawnEnemies();
requestAnimationFrame(gameLoop);

// Expose for testing
window.gameState = game;
window.player = player;
window.enemies = enemies;
