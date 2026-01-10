// Minishoot Adventures Clone - Canvas Version (Expanded + Polished)
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
    bulletSuper: '#4080ff',
    bulletEnemy: '#ff6030',
    bulletEnemyDark: '#802010',
    bulletHoming: '#ff40ff',
    crystal: '#ff3050',
    crystalGlow: 'rgba(255, 48, 80, 0.5)',
    healthFull: '#ff4060',
    healthEmpty: '#402030',
    energyFull: '#50d0ff',
    energyEmpty: '#203040',
    enemyScout: '#50aa70',
    enemyTurret: '#8060a0',
    enemyHeavy: '#c06040',
    enemyGrasshopper: '#80c040',
    enemyBurrower: '#a08060',
    enemyMimic: '#406030',
    enemyElite: '#a040c0',
    pickup: '#50ff80',
    white: '#ffffff',
    black: '#000000',
    critical: '#ffff00',
    combo: '#ff8000'
};

// Game state
const game = {
    state: 'playing',
    camera: { x: 0, y: 0 },
    screenShake: 0,
    screenFlash: 0,
    screenFlashColor: '#ffffff',
    time: 0,
    crystals: 0,
    level: 1,
    xp: 0,
    xpToLevel: 15,
    wave: 1,
    maxWave: 10,
    combo: 0,
    comboTimer: 0,
    comboMultiplier: 1,
    bossActive: false,
    paused: false,
    slowMotion: 1,
    slowMotionTimer: 0
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
    maxEnergy: 6,
    damage: 1,
    fireRate: 5,
    fireCooldown: 0,
    range: 350,
    invincible: 0,
    dashCooldown: 0,
    hasDash: true,
    hasBoost: true,
    hasSupershot: true,
    hasTimeStop: true,
    boosting: false,
    bulletCount: 1,
    critChance: 0.1,
    superShotCharge: 0,
    trail: []
};

// Entity arrays
let playerBullets = [];
let enemyBullets = [];
let enemies = [];
let crystals = [];
let particles = [];
let trees = [];
let pickups = [];
let damageNumbers = [];
let muzzleFlashes = [];
let spawnWarnings = [];

// Boss state
let boss = null;

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

// EXPAND 1: More enemy types
function spawnEnemies() {
    enemies = [];
    const baseCount = 3 + game.wave;
    const enemyCount = Math.min(baseCount, 12);

    // EXPAND 14: Elite enemies appear in later waves
    const eliteChance = game.wave >= 5 ? 0.2 : 0;

    for (let i = 0; i < enemyCount; i++) {
        // EXPAND 2-4: New enemy types
        const typeRoll = Math.random();
        let type;
        if (typeRoll < 0.25) type = 'scout';
        else if (typeRoll < 0.4) type = 'turret';
        else if (typeRoll < 0.55) type = 'heavy';
        else if (typeRoll < 0.7) type = 'grasshopper';
        else if (typeRoll < 0.85) type = 'burrower';
        else type = 'mimic';

        const isElite = Math.random() < eliteChance;

        let x, y;
        do {
            x = 100 + Math.random() * 600;
            y = 100 + Math.random() * 400;
        } while (Math.hypot(x - player.x, y - player.y) < 200);

        // EXPAND 13: Spawn warning indicators
        spawnWarnings.push({
            x, y,
            timer: 1.0,
            type: type
        });

        setTimeout(() => {
            if (game.state === 'playing') {
                enemies.push(createEnemy(type, x, y, isElite));
            }
        }, 1000);
    }
}

function createEnemy(type, x, y, isElite = false) {
    const configs = {
        scout: { hp: 3, speed: 90, fireRate: 1.2, size: 18, color: COLORS.enemyScout, xp: 2 },
        turret: { hp: 6, speed: 0, fireRate: 0.8, size: 24, color: COLORS.enemyTurret, xp: 4 },
        heavy: { hp: 12, speed: 40, fireRate: 2, size: 30, color: COLORS.enemyHeavy, xp: 6 },
        // EXPAND 2: Grasshopper - hops toward player, burst fire
        grasshopper: { hp: 4, speed: 0, fireRate: 1.5, size: 20, color: COLORS.enemyGrasshopper, xp: 3 },
        // EXPAND 3: Burrower - emerges and fires homing shots
        burrower: { hp: 8, speed: 60, fireRate: 2.5, size: 22, color: COLORS.enemyBurrower, xp: 5 },
        // EXPAND 4: Tree mimic - disguised until player is close
        mimic: { hp: 5, speed: 100, fireRate: 1.0, size: 26, color: COLORS.enemyMimic, xp: 4 }
    };
    const cfg = configs[type];

    // EXPAND 14: Elite multipliers
    const eliteMultiplier = isElite ? 2 : 1;

    return {
        type, x, y, vx: 0, vy: 0,
        hp: cfg.hp * eliteMultiplier,
        maxHp: cfg.hp * eliteMultiplier,
        speed: cfg.speed,
        fireRate: cfg.fireRate / (isElite ? 1.3 : 1),
        fireCooldown: Math.random() * 2,
        size: cfg.size * (isElite ? 1.2 : 1),
        color: isElite ? COLORS.enemyElite : cfg.color,
        xp: cfg.xp * eliteMultiplier,
        angle: Math.random() * Math.PI * 2,
        hitFlash: 0,
        isElite,
        // Grasshopper specific
        hopCooldown: 1,
        // Burrower specific
        burrowed: type === 'burrower',
        emergeTimer: 2,
        // Mimic specific
        disguised: type === 'mimic',
        // POLISH 12: Spawn animation
        spawnScale: 0,
        aggroRange: type === 'mimic' ? 150 : 400
    };
}

// EXPAND 16: Boss fight
function spawnBoss() {
    game.bossActive = true;
    boss = {
        type: 'forestGuardian',
        x: 400,
        y: 200,
        hp: 200 + game.wave * 50,
        maxHp: 200 + game.wave * 50,
        size: 60,
        angle: 0,
        phase: 1,
        attackTimer: 0,
        attackPattern: 0,
        hitFlash: 0,
        spawnScale: 0
    };

    // Clear enemies for boss fight
    enemies = [];
    enemyBullets = [];
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
    const { x, y, angle, invincible, boosting, trail } = player;

    if (invincible > 0 && Math.floor(invincible * 10) % 2 === 0) return;

    // POLISH 6: Player trail effect when moving
    if (trail.length > 1) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < trail.length - 1; i++) {
            const t = trail[i];
            const alpha = i / trail.length * 0.3;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.playerAccent;
            ctx.fill();
        }
        ctx.restore();
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Glow effect (stronger when boosting)
    ctx.shadowColor = boosting ? '#80ffff' : COLORS.playerGlow;
    ctx.shadowBlur = boosting ? 40 : 25;

    // Engine trail/glow
    const trailSize = boosting ? 1.5 : 1;
    ctx.beginPath();
    ctx.ellipse(-14 * trailSize, 0, 10 * trailSize, 5 * trailSize, 0, 0, Math.PI * 2);
    ctx.fillStyle = boosting ? 'rgba(128, 255, 255, 0.7)' : 'rgba(80, 200, 255, 0.5)';
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(-16 * trailSize, 0, 6 * trailSize, 3 * trailSize, 0, 0, Math.PI * 2);
    ctx.fillStyle = boosting ? 'rgba(200, 255, 255, 0.9)' : 'rgba(120, 220, 255, 0.8)';
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
    const { x, y, type, size, color, hp, maxHp, hitFlash, angle, isElite, disguised, burrowed, spawnScale } = enemy;

    // POLISH 12: Spawn animation
    const scale = Math.min(1, spawnScale);
    if (scale <= 0) return;

    // Mimic stays hidden when disguised
    if (disguised) {
        drawTree({ x, y, radius: size, color: COLORS.enemyMimic, shadowColor: '#203018', wobble: x });
        return;
    }

    // Burrower underground indicator
    if (burrowed) {
        ctx.save();
        ctx.globalAlpha = 0.5 + Math.sin(game.time * 5) * 0.2;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#604030';
        ctx.fill();
        ctx.restore();
        return;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Elite glow
    if (isElite) {
        ctx.shadowColor = COLORS.enemyElite;
        ctx.shadowBlur = 20;
    }

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
    } else if (type === 'grasshopper') {
        // EXPAND 2: Grasshopper - bouncy enemy
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.8, size * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = hitFlash > 0 ? '#ffffff' : color;
        ctx.fill();
        ctx.strokeStyle = '#406020';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Legs
        ctx.strokeStyle = '#608040';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-size * 0.3, size * 0.3);
        ctx.lineTo(-size * 0.6, size * 0.8);
        ctx.moveTo(size * 0.3, size * 0.3);
        ctx.lineTo(size * 0.6, size * 0.8);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(size * 0.4, -size * 0.1, 4, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'burrower') {
        // EXPAND 3: Burrower - worm-like
        ctx.rotate(angle);
        // Segments
        for (let i = 3; i >= 0; i--) {
            ctx.beginPath();
            ctx.arc(-i * size * 0.4, 0, size * (0.5 - i * 0.08), 0, Math.PI * 2);
            ctx.fillStyle = hitFlash > 0 ? '#ffffff' : (i === 0 ? color : '#806040');
            ctx.fill();
        }
        // Head details
        ctx.fillStyle = '#ff4040';
        ctx.beginPath();
        ctx.arc(size * 0.2, -size * 0.15, 3, 0, Math.PI * 2);
        ctx.arc(size * 0.2, size * 0.15, 3, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'mimic') {
        // EXPAND 4: Tree mimic revealed
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = hitFlash > 0 ? '#ffffff' : color;
        ctx.fill();
        ctx.strokeStyle = '#304020';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Angry face
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(-size * 0.25, -size * 0.2, 5, 0, Math.PI * 2);
        ctx.arc(size * 0.25, -size * 0.2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Angry mouth
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, size * 0.2, size * 0.3, 0.2, Math.PI - 0.2);
        ctx.stroke();
    }

    ctx.restore();

    // Health bar for damaged enemies
    if (hp < maxHp) {
        const barWidth = size * 2;
        const barHeight = 4;
        const hpRatio = hp / maxHp;

        ctx.fillStyle = '#400000';
        ctx.fillRect(x - barWidth / 2, y - size - 12, barWidth, barHeight);
        ctx.fillStyle = isElite ? '#c040ff' : '#ff4040';
        ctx.fillRect(x - barWidth / 2, y - size - 12, barWidth * hpRatio, barHeight);
    }

    // POLISH 20: Aggro indicator
    const distToPlayer = Math.hypot(player.x - x, player.y - y);
    if (distToPlayer < enemy.aggroRange && !disguised && !burrowed) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(player.x, player.y);
        ctx.stroke();
        ctx.restore();
    }
}

// EXPAND 16: Draw boss
function drawBoss() {
    if (!boss) return;

    const { x, y, hp, maxHp, size, angle, hitFlash, spawnScale, phase } = boss;
    const scale = Math.min(1, spawnScale);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Boss glow
    ctx.shadowColor = phase >= 3 ? '#ff4040' : '#40ff40';
    ctx.shadowBlur = 30;

    if (hitFlash > 0) {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 50;
    }

    // Forest Guardian - large tree spirit
    // Base
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fillStyle = hitFlash > 0 ? '#ffffff' : '#2a5a3a';
    ctx.fill();
    ctx.strokeStyle = '#1a3a2a';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Inner pattern
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = '#3a7a4a';
    ctx.fill();

    // Face
    ctx.fillStyle = phase >= 3 ? '#ff4040' : '#ffff00';
    ctx.beginPath();
    ctx.arc(-size * 0.25, -size * 0.15, 8, 0, Math.PI * 2);
    ctx.arc(size * 0.25, -size * 0.15, 8, 0, Math.PI * 2);
    ctx.fill();

    // Branches/arms
    ctx.strokeStyle = '#4a2a1a';
    ctx.lineWidth = 8;
    for (let i = 0; i < 4; i++) {
        const armAngle = angle + (i / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(armAngle) * size * 0.8, Math.sin(armAngle) * size * 0.8);
        ctx.lineTo(Math.cos(armAngle) * size * 1.5, Math.sin(armAngle) * size * 1.5);
        ctx.stroke();
    }

    ctx.restore();

    // Boss health bar
    const barWidth = 300;
    const barHeight = 20;
    const barX = (canvas.width - barWidth) / 2;
    const barY = 550;

    ctx.fillStyle = '#200000';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = phase >= 3 ? '#ff4040' : '#40ff40';
    ctx.fillRect(barX, barY, barWidth * (hp / maxHp), barHeight);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('FOREST GUARDIAN', canvas.width / 2, barY - 5);
}

function drawBullet(bullet, isEnemy) {
    const { x, y, size, vx, vy, isHoming, isSuper } = bullet;

    ctx.save();
    ctx.translate(x, y);

    if (isEnemy) {
        // EXPAND 18: Homing bullets are purple
        if (isHoming) {
            ctx.shadowColor = 'rgba(255, 64, 255, 0.6)';
            ctx.shadowBlur = 10;

            ctx.beginPath();
            ctx.arc(0, 0, size + 2, 0, Math.PI * 2);
            ctx.strokeStyle = COLORS.bulletHoming;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.bulletHoming;
            ctx.fill();
        } else {
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
        }
    } else {
        // Player bullet - cyan with strong glow and trail
        const angle = Math.atan2(vy, vx);
        ctx.rotate(angle);

        // EXPAND 1: Supershot is bigger and blue
        const bulletColor = isSuper ? COLORS.bulletSuper : COLORS.bulletPlayer;
        const bulletSize = isSuper ? size * 1.5 : size;

        // Trail effect
        ctx.beginPath();
        ctx.ellipse(-8, 0, 12, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = isSuper ? 'rgba(64, 128, 255, 0.3)' : 'rgba(80, 200, 255, 0.3)';
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(-5, 0, 8, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = isSuper ? 'rgba(100, 160, 255, 0.5)' : 'rgba(120, 220, 255, 0.5)';
        ctx.fill();

        // Main bullet with glow
        ctx.shadowColor = bulletColor;
        ctx.shadowBlur = isSuper ? 25 : 15;

        ctx.beginPath();
        ctx.ellipse(0, 0, bulletSize + 2, bulletSize, 0, 0, Math.PI * 2);
        ctx.fillStyle = bulletColor;
        ctx.fill();

        // Bright core
        ctx.beginPath();
        ctx.ellipse(1, 0, bulletSize * 0.6, bulletSize * 0.5, 0, 0, Math.PI * 2);
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

    // POLISH 13: Crystal sparkle particles
    if (Math.random() < 0.1) {
        particles.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + bob + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 20,
            vy: -Math.random() * 30,
            life: 0.5,
            decay: 1,
            size: 2,
            color: '#ff80a0'
        });
    }

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

// EXPAND 5-6: Draw pickups
function drawPickup(pickup) {
    const { x, y, type } = pickup;
    const bob = Math.sin(game.time * 4 + x) * 4;

    ctx.save();
    ctx.translate(x, y + bob);

    ctx.shadowColor = type === 'health' ? '#ff4080' : '#40ff80';
    ctx.shadowBlur = 15;

    if (type === 'health') {
        // Heart shape
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.bezierCurveTo(-10, -5, -10, -12, 0, -5);
        ctx.bezierCurveTo(10, -12, 10, -5, 0, 5);
        ctx.fillStyle = COLORS.healthFull;
        ctx.fill();

        // Shine
        ctx.beginPath();
        ctx.arc(-3, -5, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
    } else {
        // Energy diamond
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, 10);
        ctx.lineTo(-8, 0);
        ctx.closePath();
        ctx.fillStyle = COLORS.energyFull;
        ctx.fill();

        // Shine
        ctx.beginPath();
        ctx.moveTo(-2, -5);
        ctx.lineTo(2, -2);
        ctx.lineTo(0, 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
    }

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

// POLISH 1: Muzzle flash
function drawMuzzleFlash(flash) {
    ctx.save();
    ctx.translate(flash.x, flash.y);
    ctx.rotate(flash.angle);
    ctx.globalAlpha = flash.life;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(15, -5);
    ctx.lineTo(25, 0);
    ctx.lineTo(15, 5);
    ctx.closePath();
    ctx.fillStyle = flash.isSuper ? '#80c0ff' : '#ffffff';
    ctx.fill();

    ctx.restore();
}

// POLISH 3: Damage numbers
function drawDamageNumber(dn) {
    ctx.save();
    ctx.globalAlpha = dn.life;
    ctx.font = `bold ${dn.isCrit ? 18 : 14}px Arial`;
    ctx.fillStyle = dn.isCrit ? COLORS.critical : '#ffffff';
    ctx.textAlign = 'center';

    if (dn.isCrit) {
        ctx.shadowColor = COLORS.critical;
        ctx.shadowBlur = 10;
    }

    ctx.fillText(dn.text, dn.x, dn.y);
    ctx.restore();
}

// EXPAND 13: Spawn warnings
function drawSpawnWarning(warning) {
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(game.time * 10) * 0.3;
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(warning.x, warning.y, 30, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '12px Arial';
    ctx.fillStyle = '#ff0000';
    ctx.textAlign = 'center';
    ctx.fillText('!', warning.x, warning.y + 5);
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

    // EXPAND 15: Combo multiplier
    if (game.combo > 0) {
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = COLORS.combo;
        ctx.textAlign = 'left';
        ctx.fillText(`COMBO x${game.comboMultiplier.toFixed(1)}`, startX, energyY + 85);

        // Combo timer bar
        ctx.fillStyle = 'rgba(255, 128, 0, 0.3)';
        ctx.fillRect(startX, energyY + 90, 80, 4);
        ctx.fillStyle = COLORS.combo;
        ctx.fillRect(startX, energyY + 90, 80 * (game.comboTimer / 2), 4);
    }

    // Ability icons at bottom center
    drawAbilityBar();

    // EXPAND 9: Wave indicator
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`Wave ${game.wave}/${game.maxWave}`, canvas.width - 20, 30);
    ctx.fillText(`Enemies: ${enemies.length}${game.bossActive ? ' + BOSS' : ''}`, canvas.width - 20, 50);

    // EXPAND 10: Minimap
    drawMinimap();

    // POLISH 9: Low health warning
    if (player.health <= 2) {
        ctx.save();
        ctx.globalAlpha = 0.2 + Math.sin(game.time * 8) * 0.1;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    // POLISH 18: Supershot charge indicator
    if (player.superShotCharge > 0 && mouse.rightDown) {
        ctx.fillStyle = 'rgba(64, 128, 255, 0.5)';
        ctx.fillRect(player.x - 25, player.y + 20, 50, 6);
        ctx.fillStyle = COLORS.bulletSuper;
        ctx.fillRect(player.x - 25, player.y + 20, 50 * Math.min(1, player.superShotCharge), 6);
    }
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
        { name: 'DASH', key: 'SPACE', ready: player.dashCooldown <= 0, has: player.hasDash },
        { name: 'SUPER', key: 'RMB', ready: player.energy >= 1, has: player.hasSupershot },
        { name: 'BOOST', key: 'SHIFT', ready: player.energy >= 0.1, has: player.hasBoost },
        { name: 'TIME', key: 'Q', ready: player.energy >= 3, has: player.hasTimeStop }
    ];

    const iconSize = 40;
    const spacing = 10;
    const availableAbilities = abilities.filter(a => a.has);
    const totalWidth = availableAbilities.length * iconSize + (availableAbilities.length - 1) * spacing;
    const startX = (canvas.width - totalWidth) / 2;
    const y = canvas.height - 55;

    availableAbilities.forEach((ability, i) => {
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

        // POLISH 14: Cooldown visual
        if (!ability.ready && ability.name === 'DASH' && player.dashCooldown > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.moveTo(x + iconSize / 2, y + iconSize / 2);
            ctx.arc(x + iconSize / 2, y + iconSize / 2, iconSize / 2, -Math.PI / 2, -Math.PI / 2 + (player.dashCooldown / 0.8) * Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }

        // Icon text
        ctx.font = '10px Arial';
        ctx.fillStyle = ability.ready ? '#ffffff' : '#606060';
        ctx.textAlign = 'center';
        ctx.fillText(ability.name, x + iconSize / 2, y + iconSize / 2 + 3);
    });
}

// EXPAND 10: Minimap
function drawMinimap() {
    const mapSize = 80;
    const mapX = canvas.width - mapSize - 20;
    const mapY = 70;
    const scale = mapSize / canvas.width;

    ctx.save();

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize * 0.75);
    ctx.strokeStyle = '#50c8ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapSize, mapSize * 0.75);

    // Player dot
    ctx.fillStyle = '#50c8ff';
    ctx.beginPath();
    ctx.arc(mapX + player.x * scale, mapY + player.y * scale * 0.75, 3, 0, Math.PI * 2);
    ctx.fill();

    // Enemy dots
    ctx.fillStyle = '#ff4040';
    enemies.forEach(e => {
        if (!e.disguised && !e.burrowed) {
            ctx.beginPath();
            ctx.arc(mapX + e.x * scale, mapY + e.y * scale * 0.75, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Boss dot
    if (boss) {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(mapX + boss.x * scale, mapY + boss.y * scale * 0.75, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Pickup dots
    ctx.fillStyle = '#50ff80';
    pickups.forEach(p => {
        ctx.beginPath();
        ctx.arc(mapX + p.x * scale, mapY + p.y * scale * 0.75, 2, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.restore();
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

    // EXPAND 7: Boost ability
    player.boosting = keys['shift'] && player.hasBoost && player.energy >= 0.1 * dt;
    const speedMult = player.boosting ? 2 : 1;

    if (player.boosting) {
        player.energy -= 2 * dt;
        if (player.energy < 0) player.energy = 0;
    }

    player.vx = dx * player.speed * speedMult;
    player.vy = dy * player.speed * speedMult;

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // POLISH 6: Update trail
    if (Math.abs(player.vx) > 10 || Math.abs(player.vy) > 10) {
        player.trail.push({ x: player.x, y: player.y });
        if (player.trail.length > 10) player.trail.shift();
    } else {
        if (player.trail.length > 0) player.trail.shift();
    }

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

    // EXPAND 1: Supershot (right-click)
    if (mouse.rightDown && player.hasSupershot) {
        player.superShotCharge += dt * 2;
        if (player.superShotCharge >= 1 && player.energy >= 1) {
            fireSupershot();
            player.superShotCharge = 0;
        }
    } else {
        player.superShotCharge = 0;
    }

    // EXPAND 17: Time stop (Q key)
    if (keys['q'] && player.hasTimeStop && player.energy >= 3 && game.slowMotion === 1) {
        player.energy -= 3;
        game.slowMotion = 0.2;
        game.slowMotionTimer = 3;

        // Time stop effect
        game.screenFlash = 0.3;
        game.screenFlashColor = '#8080ff';

        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            particles.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(angle) * 200,
                vy: Math.sin(angle) * 200,
                life: 1,
                decay: 1,
                size: 4,
                color: '#8080ff'
            });
        }
    }

    // Dash cooldown
    player.dashCooldown -= dt;

    // Invincibility
    if (player.invincible > 0) {
        player.invincible -= dt;
    }

    // Energy regen
    if (!player.boosting && player.energy < player.maxEnergy) {
        player.energy += 0.5 * dt;
        if (player.energy > player.maxEnergy) player.energy = player.maxEnergy;
    }
}

function dash() {
    const dashDist = 120;
    player.x += Math.cos(player.angle) * dashDist;
    player.y += Math.sin(player.angle) * dashDist;
    player.x = Math.max(60, Math.min(740, player.x));
    player.y = Math.max(60, Math.min(540, player.y));
    player.dashCooldown = 0.8;

    // EXPAND 19: Dash i-frames
    player.invincible = Math.max(player.invincible, 0.2);

    // POLISH 19: Dodge afterimage effect
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: player.x - Math.cos(player.angle) * dashDist * (i / 5),
            y: player.y - Math.sin(player.angle) * dashDist * (i / 5),
            vx: 0,
            vy: 0,
            life: 0.5,
            decay: 1,
            size: 12 - i * 2,
            color: 'rgba(80, 200, 255, 0.5)'
        });
    }

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
    const spread = 0.1;

    // EXPAND 8: Multiple bullets
    for (let i = 0; i < player.bulletCount; i++) {
        const angleOffset = player.bulletCount > 1 ? (i - (player.bulletCount - 1) / 2) * spread : 0;
        const angle = player.angle + angleOffset;

        playerBullets.push({
            x: player.x + Math.cos(angle) * 20,
            y: player.y + Math.sin(angle) * 20,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage: player.damage,
            range: player.range,
            traveled: 0,
            size: 5,
            isSuper: false
        });
    }

    // POLISH 1: Muzzle flash
    muzzleFlashes.push({
        x: player.x + Math.cos(player.angle) * 20,
        y: player.y + Math.sin(player.angle) * 20,
        angle: player.angle,
        life: 0.1,
        isSuper: false
    });
}

// EXPAND 1: Supershot
function fireSupershot() {
    player.energy -= 1;
    const speed = 400;

    playerBullets.push({
        x: player.x + Math.cos(player.angle) * 20,
        y: player.y + Math.sin(player.angle) * 20,
        vx: Math.cos(player.angle) * speed,
        vy: Math.sin(player.angle) * speed,
        damage: player.damage * 3,
        range: player.range * 1.5,
        traveled: 0,
        size: 10,
        isSuper: true,
        piercing: true
    });

    // Big muzzle flash
    muzzleFlashes.push({
        x: player.x + Math.cos(player.angle) * 20,
        y: player.y + Math.sin(player.angle) * 20,
        angle: player.angle,
        life: 0.2,
        isSuper: true
    });

    game.screenShake = 0.1;
}

function updateEnemies(dt) {
    const effectiveDt = dt * game.slowMotion;

    enemies.forEach(enemy => {
        enemy.hitFlash -= dt * 5;
        if (enemy.hitFlash < 0) enemy.hitFlash = 0;

        // POLISH 12: Spawn animation
        if (enemy.spawnScale < 1) {
            enemy.spawnScale += dt * 3;
            return;
        }

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        // Mimic activation
        if (enemy.type === 'mimic' && enemy.disguised) {
            if (dist < enemy.aggroRange) {
                enemy.disguised = false;
                // Surprise attack particles
                for (let i = 0; i < 10; i++) {
                    particles.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        life: 1,
                        decay: 2,
                        size: 4,
                        color: '#80ff80'
                    });
                }
            }
            return;
        }

        // Burrower mechanics
        if (enemy.type === 'burrower') {
            if (enemy.burrowed) {
                enemy.emergeTimer -= effectiveDt;
                // Move underground toward player
                if (dist > 50) {
                    enemy.x += (dx / dist) * 100 * effectiveDt;
                    enemy.y += (dy / dist) * 100 * effectiveDt;
                }
                if (enemy.emergeTimer <= 0) {
                    enemy.burrowed = false;
                    // Emerge particles
                    for (let i = 0; i < 8; i++) {
                        particles.push({
                            x: enemy.x,
                            y: enemy.y,
                            vx: (Math.random() - 0.5) * 80,
                            vy: (Math.random() - 0.5) * 80,
                            life: 1,
                            decay: 2,
                            size: 5,
                            color: '#a08060'
                        });
                    }
                }
                return;
            }
        }

        enemy.angle = Math.atan2(dy, dx);

        // AI behavior by type
        if (enemy.type === 'scout') {
            if (dist > 150) {
                enemy.x += (dx / dist) * enemy.speed * effectiveDt;
                enemy.y += (dy / dist) * enemy.speed * effectiveDt;
            } else if (dist < 100) {
                enemy.x -= (dx / dist) * enemy.speed * effectiveDt;
                enemy.y -= (dy / dist) * enemy.speed * effectiveDt;
            }
        } else if (enemy.type === 'heavy') {
            if (dist > 80) {
                enemy.x += (dx / dist) * enemy.speed * effectiveDt;
                enemy.y += (dy / dist) * enemy.speed * effectiveDt;
            }
        } else if (enemy.type === 'grasshopper') {
            // EXPAND 2: Grasshopper hops
            enemy.hopCooldown -= effectiveDt;
            if (enemy.hopCooldown <= 0 && dist > 50) {
                const hopDist = Math.min(100, dist);
                enemy.x += (dx / dist) * hopDist;
                enemy.y += (dy / dist) * hopDist;
                enemy.hopCooldown = 1.5;

                // Hop particles
                for (let i = 0; i < 5; i++) {
                    particles.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: (Math.random() - 0.5) * 50,
                        vy: 20 + Math.random() * 30,
                        life: 0.5,
                        decay: 1,
                        size: 3,
                        color: '#80c040'
                    });
                }
            }
        } else if (enemy.type === 'burrower') {
            // Chase when above ground
            if (dist > 100) {
                enemy.x += (dx / dist) * enemy.speed * effectiveDt;
                enemy.y += (dy / dist) * enemy.speed * effectiveDt;
            }
        } else if (enemy.type === 'mimic') {
            // Aggressive chase
            if (dist > 40) {
                enemy.x += (dx / dist) * enemy.speed * effectiveDt;
                enemy.y += (dy / dist) * enemy.speed * effectiveDt;
            }
        }

        // Firing
        enemy.fireCooldown -= effectiveDt;
        if (enemy.fireCooldown <= 0 && dist < 400 && !enemy.disguised && !enemy.burrowed) {
            fireEnemyBullet(enemy);
            enemy.fireCooldown = enemy.fireRate;
        }
    });
}

function fireEnemyBullet(enemy) {
    const speed = 150 * game.slowMotion;
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
    } else if (enemy.type === 'grasshopper') {
        // Burst 3 bullets
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (game.state === 'playing') {
                    enemyBullets.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: Math.cos(angle) * speed * 1.2,
                        vy: Math.sin(angle) * speed * 1.2,
                        size: 5
                    });
                }
            }, i * 100);
        }
    } else if (enemy.type === 'burrower') {
        // EXPAND 18: Homing bullet
        enemyBullets.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * speed * 0.8,
            vy: Math.sin(angle) * speed * 0.8,
            size: 6,
            isHoming: true,
            turnSpeed: 2
        });
    } else if (enemy.type === 'mimic') {
        // Fast double shot
        for (let i = -1; i <= 1; i += 2) {
            const a = angle + i * 0.15;
            enemyBullets.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(a) * speed * 1.3,
                vy: Math.sin(a) * speed * 1.3,
                size: 5
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

// EXPAND 16: Boss update
function updateBoss(dt) {
    if (!boss) return;

    const effectiveDt = dt * game.slowMotion;

    boss.hitFlash -= dt * 5;
    if (boss.hitFlash < 0) boss.hitFlash = 0;

    // Spawn animation
    if (boss.spawnScale < 1) {
        boss.spawnScale += dt * 1.5;
        return;
    }

    // Rotate arms
    boss.angle += effectiveDt * 0.5;

    // Phase transitions
    const hpPercent = boss.hp / boss.maxHp;
    if (hpPercent < 0.3) boss.phase = 3;
    else if (hpPercent < 0.6) boss.phase = 2;

    // Attack patterns
    boss.attackTimer -= effectiveDt;
    if (boss.attackTimer <= 0) {
        bossAttack();
        boss.attackTimer = boss.phase >= 3 ? 1.5 : (boss.phase >= 2 ? 2 : 2.5);
    }

    // Movement
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 150) {
        boss.x += (dx / dist) * 30 * effectiveDt;
        boss.y += (dy / dist) * 30 * effectiveDt;
    }

    // Keep in bounds
    boss.x = Math.max(100, Math.min(700, boss.x));
    boss.y = Math.max(100, Math.min(400, boss.y));
}

function bossAttack() {
    const patterns = boss.phase >= 3 ? 3 : (boss.phase >= 2 ? 2 : 1);
    const pattern = Math.floor(Math.random() * patterns);

    const speed = 120;

    if (pattern === 0) {
        // Circle spray
        for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2;
            enemyBullets.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                size: 8
            });
        }
    } else if (pattern === 1) {
        // Spiral
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                if (game.state === 'playing' && boss) {
                    const a = boss.angle + (i / 12) * Math.PI * 4;
                    enemyBullets.push({
                        x: boss.x,
                        y: boss.y,
                        vx: Math.cos(a) * speed * 1.2,
                        vy: Math.sin(a) * speed * 1.2,
                        size: 7
                    });
                }
            }, i * 80);
        }
    } else {
        // Targeted burst + circle
        const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
        for (let i = -2; i <= 2; i++) {
            enemyBullets.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angle + i * 0.15) * speed * 1.5,
                vy: Math.sin(angle + i * 0.15) * speed * 1.5,
                size: 9
            });
        }
        // Plus circle
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            enemyBullets.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(a) * speed * 0.8,
                vy: Math.sin(a) * speed * 0.8,
                size: 6
            });
        }
    }
}

function updateBullets(dt) {
    const effectiveDt = dt * game.slowMotion;

    // Player bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const b = playerBullets[i];
        b.x += b.vx * dt;  // Player bullets not affected by slow
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

        // Hit boss
        if (boss && Math.hypot(b.x - boss.x, b.y - boss.y) < boss.size + b.size) {
            // EXPAND 11: Critical hits
            const isCrit = Math.random() < player.critChance;
            const damage = isCrit ? b.damage * 2 : b.damage;

            boss.hp -= damage;
            boss.hitFlash = 1;

            // POLISH 3: Damage numbers
            damageNumbers.push({
                x: b.x,
                y: b.y - 20,
                text: Math.floor(damage).toString() + (isCrit ? '!' : ''),
                life: 1,
                vy: -50,
                isCrit
            });

            // POLISH 5: Hit particles
            for (let k = 0; k < 8; k++) {
                particles.push({
                    x: b.x,
                    y: b.y,
                    vx: (Math.random() - 0.5) * 150,
                    vy: (Math.random() - 0.5) * 150,
                    life: 1,
                    decay: 3,
                    size: 4,
                    color: isCrit ? COLORS.critical : '#4a8a4a'
                });
            }

            if (!b.piercing) {
                playerBullets.splice(i, 1);
            }

            // EXPAND 15: Combo system
            game.combo++;
            game.comboTimer = 2;
            game.comboMultiplier = 1 + Math.floor(game.combo / 5) * 0.5;

            if (boss.hp <= 0) {
                defeatBoss();
            }
            continue;
        }

        // Hit enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (e.disguised || e.burrowed) continue;

            if (Math.hypot(b.x - e.x, b.y - e.y) < e.size + b.size) {
                // EXPAND 11: Critical hits
                const isCrit = Math.random() < player.critChance;
                const damage = isCrit ? b.damage * 2 : b.damage;

                e.hp -= damage;
                e.hitFlash = 1;

                // POLISH 3: Damage numbers
                damageNumbers.push({
                    x: b.x,
                    y: b.y - 20,
                    text: Math.floor(damage).toString() + (isCrit ? '!' : ''),
                    life: 1,
                    vy: -50,
                    isCrit
                });

                // POLISH 5: Hit particles
                for (let k = 0; k < 5; k++) {
                    particles.push({
                        x: b.x,
                        y: b.y,
                        vx: (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        life: 1,
                        decay: 3,
                        size: 3,
                        color: isCrit ? COLORS.critical : e.color
                    });
                }

                if (!b.piercing) {
                    playerBullets.splice(i, 1);
                }

                // EXPAND 15: Combo system
                game.combo++;
                game.comboTimer = 2;
                game.comboMultiplier = 1 + Math.floor(game.combo / 5) * 0.5;

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

        // EXPAND 18: Homing bullets
        if (b.isHoming) {
            const dx = player.x - b.x;
            const dy = player.y - b.y;
            const targetAngle = Math.atan2(dy, dx);
            const currentAngle = Math.atan2(b.vy, b.vx);
            let angleDiff = targetAngle - currentAngle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            const turn = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), b.turnSpeed * effectiveDt);
            const newAngle = currentAngle + turn;
            const speed = Math.hypot(b.vx, b.vy);
            b.vx = Math.cos(newAngle) * speed;
            b.vy = Math.sin(newAngle) * speed;
        }

        b.x += b.vx * effectiveDt;
        b.y += b.vy * effectiveDt;

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

            // POLISH 17: Blood splatter
            for (let k = 0; k < 12; k++) {
                particles.push({
                    x: player.x,
                    y: player.y,
                    vx: (Math.random() - 0.5) * 200,
                    vy: (Math.random() - 0.5) * 200,
                    life: 1,
                    decay: 2,
                    size: 5,
                    color: COLORS.healthFull
                });
            }

            // Reset combo
            game.combo = 0;
            game.comboMultiplier = 1;

            if (player.health <= 0) {
                game.state = 'gameover';
            }
        }
    }
}

function killEnemy(index) {
    const e = enemies[index];

    // POLISH 7: Death explosion particles
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: e.x,
            y: e.y,
            vx: (Math.random() - 0.5) * 250,
            vy: (Math.random() - 0.5) * 250,
            life: 1,
            decay: 2,
            size: 6,
            color: e.color
        });
    }

    // More dramatic death ring
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        particles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(angle) * 150,
            vy: Math.sin(angle) * 150,
            life: 0.8,
            decay: 1.5,
            size: 4,
            color: '#ffffff'
        });
    }

    // Drop crystals with combo bonus
    const xpValue = Math.floor(e.xp * game.comboMultiplier);
    const crystalCount = Math.ceil(xpValue / 2);
    for (let i = 0; i < crystalCount; i++) {
        crystals.push({
            x: e.x + (Math.random() - 0.5) * 30,
            y: e.y + (Math.random() - 0.5) * 30,
            value: Math.ceil(xpValue / crystalCount),
            magnetRange: 80
        });
    }

    // EXPAND 5-6: Chance to drop pickups
    if (Math.random() < 0.15) {
        pickups.push({
            x: e.x,
            y: e.y,
            type: Math.random() < 0.5 ? 'health' : 'energy'
        });
    }

    enemies.splice(index, 1);
    game.screenShake = 0.15;

    // Check wave complete
    if (enemies.length === 0 && !game.bossActive) {
        if (game.wave >= game.maxWave) {
            // EXPAND 16: Spawn boss
            setTimeout(() => {
                if (game.state === 'playing') {
                    spawnBoss();
                }
            }, 2000);
        } else {
            game.wave++;
            setTimeout(() => {
                if (game.state === 'playing') {
                    spawnEnemies();
                }
            }, 1500);
        }
    }
}

function defeatBoss() {
    // EXPAND 20: Victory!
    game.bossActive = false;

    // Massive death explosion
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: boss.x,
            y: boss.y,
            vx: (Math.random() - 0.5) * 400,
            vy: (Math.random() - 0.5) * 400,
            life: 1.5,
            decay: 1,
            size: 8,
            color: ['#40ff40', '#80ff80', '#ffff00', '#ffffff'][i % 4]
        });
    }

    // Drop lots of crystals
    for (let i = 0; i < 20; i++) {
        crystals.push({
            x: boss.x + (Math.random() - 0.5) * 100,
            y: boss.y + (Math.random() - 0.5) * 100,
            value: 10,
            magnetRange: 100
        });
    }

    game.screenShake = 0.5;
    game.screenFlash = 0.5;
    game.screenFlashColor = '#ffffff';

    boss = null;

    // Victory after a delay
    setTimeout(() => {
        if (game.state === 'playing') {
            game.state = 'victory';
        }
    }, 2000);
}

function updateCrystals(dt) {
    for (let i = crystals.length - 1; i >= 0; i--) {
        const c = crystals[i];
        const dx = player.x - c.x;
        const dy = player.y - c.y;
        const dist = Math.hypot(dx, dy);

        // Magnet effect
        if (dist < c.magnetRange) {
            const pull = (c.magnetRange - dist) / c.magnetRange * 400;
            c.x += (dx / dist) * pull * dt;
            c.y += (dy / dist) * pull * dt;
        }

        // Collect
        if (dist < 20) {
            game.crystals += c.value;
            game.xp += c.value;

            // POLISH 13: Collect sparkle
            for (let k = 0; k < 5; k++) {
                particles.push({
                    x: player.x,
                    y: player.y,
                    vx: (Math.random() - 0.5) * 50,
                    vy: (Math.random() - 0.5) * 50,
                    life: 0.5,
                    decay: 1,
                    size: 3,
                    color: COLORS.crystal
                });
            }

            // Level up check
            while (game.xp >= game.xpToLevel) {
                game.xp -= game.xpToLevel;
                game.level++;
                game.xpToLevel = Math.floor(game.xpToLevel * 1.15);
                player.damage += 0.15;

                // EXPAND 8: Every 3 levels, extra bullet
                if (game.level % 3 === 0 && player.bulletCount < 5) {
                    player.bulletCount++;
                }

                // EXPAND 11: Every 5 levels, more crit
                if (game.level % 5 === 0) {
                    player.critChance += 0.05;
                }

                // POLISH 8: Level up screen flash
                game.screenFlash = 0.3;
                game.screenFlashColor = '#50ff80';

                // Level up effect
                for (let k = 0; k < 30; k++) {
                    const angle = (k / 30) * Math.PI * 2;
                    particles.push({
                        x: player.x,
                        y: player.y,
                        vx: Math.cos(angle) * 200,
                        vy: Math.sin(angle) * 200,
                        life: 1,
                        decay: 1.5,
                        size: 5,
                        color: '#50ff80'
                    });
                }
            }

            crystals.splice(i, 1);
        }
    }
}

// EXPAND 5-6: Update pickups
function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dx = player.x - p.x;
        const dy = player.y - p.y;
        const dist = Math.hypot(dx, dy);

        // Collect
        if (dist < 25) {
            if (p.type === 'health' && player.health < player.maxHealth) {
                player.health++;
                // Health pickup effect
                for (let k = 0; k < 10; k++) {
                    particles.push({
                        x: player.x,
                        y: player.y,
                        vx: (Math.random() - 0.5) * 60,
                        vy: (Math.random() - 0.5) * 60,
                        life: 0.8,
                        decay: 1,
                        size: 4,
                        color: COLORS.healthFull
                    });
                }
                pickups.splice(i, 1);
            } else if (p.type === 'energy' && player.energy < player.maxEnergy) {
                player.energy = Math.min(player.maxEnergy, player.energy + 2);
                // Energy pickup effect
                for (let k = 0; k < 10; k++) {
                    particles.push({
                        x: player.x,
                        y: player.y,
                        vx: (Math.random() - 0.5) * 60,
                        vy: (Math.random() - 0.5) * 60,
                        life: 0.8,
                        decay: 1,
                        size: 4,
                        color: COLORS.energyFull
                    });
                }
                pickups.splice(i, 1);
            }
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

// POLISH 1: Update muzzle flashes
function updateMuzzleFlashes(dt) {
    for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
        muzzleFlashes[i].life -= dt * 10;
        if (muzzleFlashes[i].life <= 0) {
            muzzleFlashes.splice(i, 1);
        }
    }
}

// POLISH 3: Update damage numbers
function updateDamageNumbers(dt) {
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const dn = damageNumbers[i];
        dn.y += dn.vy * dt;
        dn.vy *= 0.95;
        dn.life -= dt;

        if (dn.life <= 0) {
            damageNumbers.splice(i, 1);
        }
    }
}

// EXPAND 13: Update spawn warnings
function updateSpawnWarnings(dt) {
    for (let i = spawnWarnings.length - 1; i >= 0; i--) {
        spawnWarnings[i].timer -= dt;
        if (spawnWarnings[i].timer <= 0) {
            spawnWarnings.splice(i, 1);
        }
    }
}

// EXPAND 15: Update combo
function updateCombo(dt) {
    if (game.comboTimer > 0) {
        game.comboTimer -= dt;
        if (game.comboTimer <= 0) {
            game.combo = 0;
            game.comboMultiplier = 1;
        }
    }
}

// EXPAND 17: Update slow motion
function updateSlowMotion(dt) {
    if (game.slowMotionTimer > 0) {
        game.slowMotionTimer -= dt;
        if (game.slowMotionTimer <= 0) {
            game.slowMotion = 1;
        }
    }
}

// Main game loop
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    game.time += dt;

    // Screen flash decay
    if (game.screenFlash > 0) {
        game.screenFlash -= dt * 3;
    }

    // Update
    if (game.state === 'playing') {
        updatePlayer(dt);
        updateEnemies(dt);
        updateBoss(dt);
        updateBullets(dt);
        updateCrystals(dt);
        updatePickups(dt);
        updateParticles(dt);
        updateMuzzleFlashes(dt);
        updateDamageNumbers(dt);
        updateSpawnWarnings(dt);
        updateCombo(dt);
        updateSlowMotion(dt);

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

    // Draw spawn warnings
    spawnWarnings.forEach(drawSpawnWarning);

    // Draw trees (back layer)
    trees.filter(t => t.y < player.y).forEach(drawTree);

    // Draw pickups
    pickups.forEach(drawPickup);

    // Draw crystals
    crystals.forEach(drawCrystal);

    // Draw player
    drawPlayer();

    // Draw enemies
    enemies.forEach(drawEnemy);

    // Draw boss
    drawBoss();

    // Draw trees (front layer)
    trees.filter(t => t.y >= player.y).forEach(drawTree);

    // Draw bullets
    playerBullets.forEach(b => drawBullet(b, false));
    enemyBullets.forEach(b => drawBullet(b, true));

    // Draw muzzle flashes
    muzzleFlashes.forEach(drawMuzzleFlash);

    // Draw particles
    particles.forEach(drawParticle);

    // Draw damage numbers
    damageNumbers.forEach(drawDamageNumber);

    ctx.restore();

    // Screen flash effect
    if (game.screenFlash > 0) {
        ctx.save();
        ctx.globalAlpha = game.screenFlash * 0.5;
        ctx.fillStyle = game.screenFlashColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    // Time slow visual effect
    if (game.slowMotion < 1) {
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#4040ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#8080ff';
        ctx.lineWidth = 5;
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
        ctx.restore();
    }

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
        ctx.fillText(`Crystals: ${game.crystals}  Level: ${game.level}  Wave: ${game.wave}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 60);
    }

    // EXPAND 20: Victory screen
    if (game.state === 'victory') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = '#50ff80';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', canvas.width / 2, canvas.height / 2 - 50);

        ctx.font = '24px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Forest Guardian Defeated!', canvas.width / 2, canvas.height / 2);
        ctx.fillText(`Crystals: ${game.crystals}  Level: ${game.level}`, canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText('Press SPACE to play again', canvas.width / 2, canvas.height / 2 + 80);
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

    if (e.key === ' ' && (game.state === 'gameover' || game.state === 'victory')) {
        resetGame();
    }

    // Prevent default for game keys
    if (['w', 'a', 's', 'd', ' ', 'q', 'shift'].includes(e.key.toLowerCase())) {
        e.preventDefault();
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
    game.wave = 1;
    game.screenShake = 0;
    game.screenFlash = 0;
    game.combo = 0;
    game.comboTimer = 0;
    game.comboMultiplier = 1;
    game.bossActive = false;
    game.slowMotion = 1;
    game.slowMotionTimer = 0;

    player.x = 400;
    player.y = 300;
    player.health = player.maxHealth;
    player.energy = player.maxEnergy;
    player.damage = 1;
    player.invincible = 0;
    player.bulletCount = 1;
    player.critChance = 0.1;
    player.trail = [];

    playerBullets = [];
    enemyBullets = [];
    crystals = [];
    particles = [];
    pickups = [];
    damageNumbers = [];
    muzzleFlashes = [];
    spawnWarnings = [];
    boss = null;

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
