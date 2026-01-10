// Spud Survivor - Brotato Style Arena Roguelike
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Colors matching Brotato palette
const COLORS = {
    floor: '#504540',        // Brown-gray dirt
    floorLight: '#5A504A',   // Lighter dirt variation
    floorDark: '#403530',    // Darker patches
    rock: '#706560',         // Small rocks
    rockDark: '#504540',     // Darker rocks
    grass: '#4A5030',        // Dead grass/weeds
    player: '#EEEEEE',
    playerOutline: '#AAAAAA',
    alien: '#7A6A9A',        // Purple-blue alien color
    alienDark: '#5A5A7A',
    alienEye: '#111111',
    material: '#66FF66',
    materialGlow: '#33AA33',
    hp: '#CC3333',
    hpBg: '#441111',
    xp: '#33CC33',
    xpBg: '#114411',
    bullet: '#FFFF88',
    damage: '#FFFFFF',
    deathMark: '#AA3333'     // Red X death marker
};

// Game state
let gameState = 'title';
let player = null;
let enemies = [];
let projectiles = [];
let pickups = [];
let particles = [];
let damageNumbers = [];
let deathMarkers = [];  // Red X marks where enemies die

// Wave system
let wave = 1;
let waveTimer = 0;
let waveDuration = 20;
let spawnTimer = 0;

// Ground details - scattered rocks and grass like in Brotato
const groundDetails = [];
// More rocks for rocky terrain feel
for (let i = 0; i < 120; i++) {
    const type = Math.random();
    if (type < 0.6) {
        // Small rocks
        groundDetails.push({
            x: Math.random() * 800,
            y: Math.random() * 600,
            type: 'rock',
            size: 2 + Math.random() * 4,
            color: Math.random() < 0.5 ? COLORS.rock : COLORS.rockDark
        });
    } else if (type < 0.85) {
        // Dead grass/weeds
        groundDetails.push({
            x: Math.random() * 800,
            y: Math.random() * 600,
            type: 'grass',
            size: 4 + Math.random() * 6,
            color: COLORS.grass,
            angle: Math.random() * 0.5 - 0.25
        });
    } else {
        // Larger rocks
        groundDetails.push({
            x: Math.random() * 800,
            y: Math.random() * 600,
            type: 'bigrock',
            size: 5 + Math.random() * 8,
            color: Math.random() < 0.5 ? '#605550' : '#554540'
        });
    }
}
// Add some yellowish patches like in reference
for (let i = 0; i < 30; i++) {
    groundDetails.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        type: 'patch',
        size: 3 + Math.random() * 5,
        color: '#8A7A50'  // Yellow-brown patches
    });
}

// Pre-generate floor variations (to avoid flickering)
const floorVariations = [];
for (let i = 0; i < 40; i++) {
    floorVariations.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        size: 20 + Math.random() * 50,
        light: Math.random() < 0.5
    });
}

// Pre-generate boundary edge sizes
const boundaryEdges = {
    top: [], bottom: [], left: [], right: []
};
for (let x = 0; x < 800; x += 20) {
    boundaryEdges.top.push(15 + Math.sin(x * 0.1) * 8 + Math.random() * 5);
    boundaryEdges.bottom.push(15 + Math.sin(x * 0.15) * 8 + Math.random() * 5);
}
for (let y = 0; y < 600; y += 20) {
    boundaryEdges.left.push(15 + Math.sin(y * 0.12) * 8 + Math.random() * 5);
    boundaryEdges.right.push(15 + Math.sin(y * 0.12) * 8 + Math.random() * 5);
}

// Input
const keys = {};

// Player class
class Player {
    constructor() {
        this.x = 400;
        this.y = 300;
        this.width = 24;
        this.height = 24;
        this.speed = 200;
        this.hp = 10;
        this.maxHp = 10;
        this.xp = 0;
        this.level = 1;
        this.xpToLevel = 16;
        this.materials = 0;
        this.damage = 5;
        this.attackSpeed = 1; // Attacks per second
        this.fireTimer = 0;
        this.invulnTimer = 0;
        this.weapons = [{ type: 'pistol', damage: 5, rate: 1, range: 300 }];
    }

    update(dt) {
        // Movement
        let dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup']) dy = -1;
        if (keys['s'] || keys['arrowdown']) dy = 1;
        if (keys['a'] || keys['arrowleft']) dx = -1;
        if (keys['d'] || keys['arrowright']) dx = 1;

        if (dx && dy) {
            dx *= 0.707;
            dy *= 0.707;
        }

        this.x += dx * this.speed * dt;
        this.y += dy * this.speed * dt;

        // Keep in bounds
        this.x = Math.max(50, Math.min(750, this.x));
        this.y = Math.max(80, Math.min(550, this.y));

        // Auto-fire weapons
        this.fireTimer -= dt;
        if (this.fireTimer <= 0 && enemies.length > 0) {
            this.fire();
        }

        // Invulnerability
        if (this.invulnTimer > 0) {
            this.invulnTimer -= dt;
        }

        // Collect pickups
        for (let i = pickups.length - 1; i >= 0; i--) {
            const p = pickups[i];
            const dist = Math.sqrt((this.x - p.x) ** 2 + (this.y - p.y) ** 2);
            if (dist < 40) {
                if (p.type === 'material') {
                    this.materials += p.value;
                    this.xp += p.value;
                    // Check level up
                    while (this.xp >= this.xpToLevel) {
                        this.xp -= this.xpToLevel;
                        this.levelUp();
                    }
                } else if (p.type === 'health') {
                    this.hp = Math.min(this.hp + 3, this.maxHp);
                }
                pickups.splice(i, 1);
            }
        }
    }

    fire() {
        // Find nearest enemy
        let nearest = null;
        let nearestDist = Infinity;
        for (let e of enemies) {
            const dist = Math.sqrt((this.x - e.x) ** 2 + (this.y - e.y) ** 2);
            if (dist < nearestDist && dist < 400) {
                nearest = e;
                nearestDist = dist;
            }
        }

        if (nearest) {
            const angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
            projectiles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 500,
                vy: Math.sin(angle) * 500,
                damage: this.damage,
                range: 400,
                traveled: 0
            });

            // Muzzle flash particle
            particles.push({
                x: this.x + Math.cos(angle) * 15,
                y: this.y + Math.sin(angle) * 15,
                vx: Math.cos(angle) * 50,
                vy: Math.sin(angle) * 50,
                life: 0.1,
                maxLife: 0.1,
                color: COLORS.bullet,
                size: 5
            });

            this.fireTimer = 1 / this.attackSpeed;
        }
    }

    levelUp() {
        this.level++;
        this.maxHp++;
        this.hp = Math.min(this.hp + 1, this.maxHp);
        this.damage += 1;
        this.xpToLevel = Math.pow(this.level + 3, 2);

        // Level up effect
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 100,
                vy: Math.sin(angle) * 100,
                life: 0.5,
                maxLife: 0.5,
                color: COLORS.xp,
                size: 6
            });
        }
    }

    takeDamage(amount) {
        if (this.invulnTimer > 0) return;

        this.hp -= amount;
        this.invulnTimer = 0.5;

        // Damage particles
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                life: 0.3,
                maxLife: 0.3,
                color: COLORS.hp,
                size: 4
            });
        }

        if (this.hp <= 0) {
            gameState = 'gameover';
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Flash when invulnerable
        if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 12, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (potato shape)
        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = COLORS.playerOutline;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eyes (determined expression)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-4, -3, 2.5, 0, Math.PI * 2);
        ctx.arc(4, -3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Eyebrows (angry)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-7, -8);
        ctx.lineTo(-2, -6);
        ctx.moveTo(7, -8);
        ctx.lineTo(2, -6);
        ctx.stroke();

        // Mouth
        ctx.beginPath();
        ctx.arc(0, 4, 4, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Arms (holding weapons)
        ctx.strokeStyle = COLORS.player;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-10, 2);
        ctx.lineTo(-18, 0);
        ctx.moveTo(10, 2);
        ctx.lineTo(18, 0);
        ctx.stroke();

        // Weapon in hands
        ctx.fillStyle = '#666';
        ctx.fillRect(-22, -3, 8, 6);
        ctx.fillRect(14, -3, 8, 6);

        ctx.restore();
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 24;
        this.height = 24;
        this.speed = 80 + Math.random() * 40;
        this.hp = 5 + wave * 2;
        this.maxHp = this.hp;
        this.damage = 1;
        this.hitFlash = 0;

        if (type === 'charger') {
            this.hp = 3 + wave;
            this.speed = 180;
            this.width = 20;
            this.height = 20;
        } else if (type === 'bruiser') {
            this.hp = 15 + wave * 3;
            this.speed = 50;
            this.width = 36;
            this.height = 36;
            this.damage = 2;
        }
    }

    update(dt) {
        // Move toward player
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            }

            // Damage player on contact
            if (dist < (this.width + player.width) / 2) {
                player.takeDamage(this.damage);
            }
        }

        // Hit flash
        if (this.hitFlash > 0) {
            this.hitFlash -= dt;
        }

        return this.hp > 0;
    }

    takeDamage(amount, projX, projY) {
        this.hp -= amount;
        this.hitFlash = 0.1;

        // Damage number
        damageNumbers.push({
            x: this.x + (Math.random() - 0.5) * 10,
            y: this.y - 15,
            value: amount,
            life: 0.5,
            vy: -50
        });

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        // Death marker (red X)
        deathMarkers.push({
            x: this.x,
            y: this.y,
            life: 2.0,  // Fade out over 2 seconds
            maxLife: 2.0,
            size: this.type === 'bruiser' ? 20 : 12
        });

        // Blood particles
        for (let i = 0; i < 6; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                life: 0.4,
                maxLife: 0.4,
                color: COLORS.alien,
                size: 5
            });
        }

        // Drop materials
        const dropCount = this.type === 'bruiser' ? 3 : 1;
        for (let i = 0; i < dropCount; i++) {
            pickups.push({
                x: this.x + (Math.random() - 0.5) * 20,
                y: this.y + (Math.random() - 0.5) * 20,
                type: 'material',
                value: 1 + Math.floor(wave / 5),
                glow: 0
            });
        }

        // Small chance for health
        if (Math.random() < 0.1) {
            pickups.push({
                x: this.x,
                y: this.y,
                type: 'health',
                value: 3
            });
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        const scale = this.type === 'bruiser' ? 1.5 : this.type === 'charger' ? 0.8 : 1;
        ctx.scale(scale, scale);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 12, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (alien blob)
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : COLORS.alien;
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Darker center
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : COLORS.alienDark;
        ctx.beginPath();
        ctx.ellipse(0, 2, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Big eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(-5, -4, 5, 6, -0.2, 0, Math.PI * 2);
        ctx.ellipse(5, -4, 5, 6, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = COLORS.alienEye;
        ctx.beginPath();
        ctx.arc(-4, -3, 2.5, 0, Math.PI * 2);
        ctx.arc(6, -3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Mouth (varies by type)
        if (this.type === 'bruiser') {
            ctx.fillStyle = '#331122';
            ctx.beginPath();
            ctx.ellipse(0, 6, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            // Teeth
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(-4, 4, 2, 3);
            ctx.fillRect(2, 4, 2, 3);
        }

        ctx.restore();
    }
}

// Update functions
function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        const dx = p.vx * dt;
        const dy = p.vy * dt;
        p.x += dx;
        p.y += dy;
        p.traveled += Math.sqrt(dx * dx + dy * dy);

        // Check enemy hits
        let hit = false;
        for (let e of enemies) {
            const dist = Math.sqrt((p.x - e.x) ** 2 + (p.y - e.y) ** 2);
            if (dist < e.width / 2 + 5) {
                e.takeDamage(p.damage, p.x, p.y);
                hit = true;
                break;
            }
        }

        // Remove if hit, out of range, or out of bounds
        if (hit || p.traveled > p.range ||
            p.x < 0 || p.x > 800 || p.y < 0 || p.y > 600) {
            projectiles.splice(i, 1);
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
        p.life -= dt;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updateDamageNumbers(dt) {
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const d = damageNumbers[i];
        d.y += d.vy * dt;
        d.life -= dt;
        if (d.life <= 0) {
            damageNumbers.splice(i, 1);
        }
    }
}

function updatePickups(dt) {
    for (let p of pickups) {
        p.glow = (p.glow || 0) + dt * 5;
    }
}

function updateDeathMarkers(dt) {
    for (let i = deathMarkers.length - 1; i >= 0; i--) {
        deathMarkers[i].life -= dt;
        if (deathMarkers[i].life <= 0) {
            deathMarkers.splice(i, 1);
        }
    }
}

function spawnEnemy() {
    // Spawn from edge
    let x, y;
    const side = Math.floor(Math.random() * 4);
    switch (side) {
        case 0: x = -30; y = Math.random() * 600; break;
        case 1: x = 830; y = Math.random() * 600; break;
        case 2: x = Math.random() * 800; y = -30; break;
        case 3: x = Math.random() * 800; y = 630; break;
    }

    // Enemy type based on wave
    let type = 'basic';
    if (wave >= 3 && Math.random() < 0.2) type = 'charger';
    if (wave >= 5 && Math.random() < 0.1) type = 'bruiser';

    enemies.push(new Enemy(x, y, type));
}

function updateWave(dt) {
    waveTimer += dt;

    // Spawn enemies
    spawnTimer -= dt;
    const spawnRate = 1.5 - wave * 0.05; // Faster spawns each wave
    if (spawnTimer <= 0 && enemies.length < 50 + wave * 5) {
        spawnEnemy();
        spawnTimer = Math.max(0.3, spawnRate);
    }

    // Check wave end
    if (waveTimer >= waveDuration) {
        wave++;
        waveTimer = 0;
        waveDuration = Math.min(60, 20 + wave * 2);

        // Wave bonus
        player.materials += wave * 5;

        // Victory check
        if (wave > 20) {
            gameState = 'victory';
        }
    }
}

// Draw functions
function drawBackground() {
    // Base floor - brown-gray dirt color matching Brotato
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(0, 0, 800, 600);

    // Add subtle variations in floor (using pre-generated values)
    for (let v of floorVariations) {
        ctx.fillStyle = v.light ? COLORS.floorLight : COLORS.floorDark;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(v.x, v.y, v.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Ground details (rocks, grass, patches)
    for (let detail of groundDetails) {
        ctx.fillStyle = detail.color;
        if (detail.type === 'rock') {
            ctx.beginPath();
            ctx.arc(detail.x, detail.y, detail.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (detail.type === 'bigrock') {
            // Larger irregular rocks
            ctx.beginPath();
            ctx.ellipse(detail.x, detail.y, detail.size * 1.2, detail.size * 0.8, 0.3, 0, Math.PI * 2);
            ctx.fill();
            // Highlight
            ctx.fillStyle = '#807570';
            ctx.beginPath();
            ctx.arc(detail.x - detail.size * 0.3, detail.y - detail.size * 0.3, detail.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        } else if (detail.type === 'grass') {
            // Dead grass/weeds - like in reference
            ctx.save();
            ctx.translate(detail.x, detail.y);
            ctx.rotate(detail.angle || 0);
            ctx.fillRect(-1, -detail.size, 2, detail.size);
            ctx.fillRect(-2, -detail.size + 1, 1, 3);
            ctx.fillRect(1, -detail.size + 2, 1, 2);
            ctx.restore();
        } else if (detail.type === 'patch') {
            // Yellowish patches
            ctx.globalAlpha = 0.5;
            ctx.fillRect(detail.x - detail.size, detail.y - detail.size * 0.3, detail.size * 2, detail.size * 0.6);
            ctx.globalAlpha = 1;
        }
    }

    // Jagged dark arena boundary like in reference (using pre-generated values)
    ctx.fillStyle = '#1A1A1A';
    // Top edge
    let idx = 0;
    for (let x = 0; x < 800; x += 20) {
        ctx.fillRect(x, 0, 20, boundaryEdges.top[idx++]);
    }
    // Bottom edge
    idx = 0;
    for (let x = 0; x < 800; x += 20) {
        ctx.fillRect(x, 600 - boundaryEdges.bottom[idx++], 20, boundaryEdges.bottom[idx - 1]);
    }
    // Left edge
    idx = 0;
    for (let y = 0; y < 600; y += 20) {
        ctx.fillRect(0, y, boundaryEdges.left[idx++], 20);
    }
    // Right edge
    idx = 0;
    for (let y = 0; y < 600; y += 20) {
        ctx.fillRect(800 - boundaryEdges.right[idx++], y, boundaryEdges.right[idx - 1], 20);
    }

    // Arena edge darkening gradient
    const gradient = ctx.createRadialGradient(400, 300, 250, 400, 300, 450);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);
}

function drawDeathMarkers() {
    for (let d of deathMarkers) {
        const alpha = d.life / d.maxLife;
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.globalAlpha = alpha * 0.7;
        ctx.strokeStyle = COLORS.deathMark;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        // Draw X
        ctx.beginPath();
        ctx.moveTo(-d.size, -d.size);
        ctx.lineTo(d.size, d.size);
        ctx.moveTo(d.size, -d.size);
        ctx.lineTo(-d.size, d.size);
        ctx.stroke();
        ctx.restore();
    }
    ctx.globalAlpha = 1;
}

function drawPickups() {
    for (let p of pickups) {
        ctx.save();
        ctx.translate(p.x, p.y);

        // Glow
        const glowSize = 15 + Math.sin(p.glow) * 3;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        gradient.addColorStop(0, p.type === 'health' ? 'rgba(255, 100, 100, 0.5)' : 'rgba(100, 255, 100, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2);

        // Pickup
        if (p.type === 'material') {
            ctx.fillStyle = COLORS.material;
            ctx.beginPath();
            // Diamond shape
            ctx.moveTo(0, -6);
            ctx.lineTo(6, 0);
            ctx.lineTo(0, 6);
            ctx.lineTo(-6, 0);
            ctx.closePath();
            ctx.fill();

            // Shine
            ctx.fillStyle = '#AAFFAA';
            ctx.beginPath();
            ctx.moveTo(0, -4);
            ctx.lineTo(2, 0);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
        } else if (p.type === 'health') {
            ctx.fillStyle = COLORS.hp;
            // Cross shape
            ctx.fillRect(-2, -6, 4, 12);
            ctx.fillRect(-6, -2, 12, 4);
        }

        ctx.restore();
    }
}

function drawProjectiles() {
    for (let p of projectiles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));

        // Bullet trail
        ctx.fillStyle = COLORS.bullet;
        ctx.shadowBlur = 5;
        ctx.shadowColor = COLORS.bullet;
        ctx.fillRect(-8, -2, 16, 4);

        ctx.restore();
    }
    ctx.shadowBlur = 0;
}

function drawParticles() {
    for (let p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawDamageNumbers() {
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    for (let d of damageNumbers) {
        const alpha = d.life / 0.5;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = COLORS.damage;
        ctx.fillText(d.value.toString(), d.x, d.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
}

function drawHUD() {
    // HP Bar
    ctx.fillStyle = COLORS.hpBg;
    ctx.fillRect(10, 10, 200, 20);
    ctx.fillStyle = COLORS.hp;
    const hpWidth = (player.hp / player.maxHp) * 196;
    ctx.fillRect(12, 12, hpWidth, 16);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${player.hp} / ${player.maxHp}`, 16, 24);

    // XP Bar
    ctx.fillStyle = COLORS.xpBg;
    ctx.fillRect(10, 35, 200, 14);
    ctx.fillStyle = COLORS.xp;
    const xpWidth = (player.xp / player.xpToLevel) * 196;
    ctx.fillRect(12, 37, xpWidth, 10);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px monospace';
    ctx.fillText(`LV.${player.level}`, 170, 46);

    // Materials
    ctx.fillStyle = COLORS.material;
    ctx.beginPath();
    ctx.arc(25, 65, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(player.materials.toString(), 40, 70);

    // Wave info
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${wave}`, 400, 30);

    // Timer
    const timeLeft = Math.ceil(waveDuration - waveTimer);
    ctx.font = 'bold 32px monospace';
    ctx.fillText(timeLeft.toString(), 400, 60);

    ctx.textAlign = 'left';
}

function drawTitle() {
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#EEEEEE';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SPUD SURVIVOR', 400, 180);

    ctx.font = '20px monospace';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('An Arena Roguelike', 400, 220);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('WASD or Arrow Keys - Move', 400, 320);
    ctx.fillText('Auto-aim weapons', 400, 350);
    ctx.fillText('Survive 20 waves!', 400, 380);

    ctx.fillStyle = Math.sin(Date.now() / 300) > 0 ? COLORS.xp : '#88FF88';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('Press SPACE to Start', 400, 480);

    ctx.textAlign = 'left';
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = COLORS.hp;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', 400, 200);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px monospace';
    ctx.fillText(`Reached Wave ${wave}`, 400, 280);
    ctx.fillText(`Level ${player.level}`, 400, 310);
    ctx.fillText(`Materials: ${player.materials}`, 400, 340);

    ctx.fillStyle = Math.sin(Date.now() / 300) > 0 ? COLORS.xp : '#88FF88';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('Press SPACE to Restart', 400, 450);

    ctx.textAlign = 'left';
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 50, 0, 0.9)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = COLORS.xp;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', 400, 200);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px monospace';
    ctx.fillText('You survived all 20 waves!', 400, 280);
    ctx.fillText(`Final Level: ${player.level}`, 400, 320);
    ctx.fillText(`Materials: ${player.materials}`, 400, 350);

    ctx.fillStyle = Math.sin(Date.now() / 300) > 0 ? COLORS.xp : '#FFFF88';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('Press SPACE to Play Again', 400, 450);

    ctx.textAlign = 'left';
}

// Game initialization
function initGame() {
    player = new Player();
    enemies = [];
    projectiles = [];
    pickups = [];
    particles = [];
    damageNumbers = [];
    deathMarkers = [];
    wave = 1;
    waveTimer = 0;
    waveDuration = 20;
    spawnTimer = 0;
    gameState = 'playing';
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 800, 600);

    if (gameState === 'title') {
        drawTitle();
    } else if (gameState === 'playing') {
        // Update
        player.update(dt);

        for (let i = enemies.length - 1; i >= 0; i--) {
            if (!enemies[i].update(dt)) {
                enemies.splice(i, 1);
            }
        }

        updateProjectiles(dt);
        updateParticles(dt);
        updateDamageNumbers(dt);
        updatePickups(dt);
        updateDeathMarkers(dt);
        updateWave(dt);

        // Draw
        drawBackground();
        drawDeathMarkers();
        drawPickups();
        enemies.forEach(e => e.draw());
        player.draw();
        drawProjectiles();
        drawParticles();
        drawDamageNumbers();
        drawHUD();
    } else if (gameState === 'gameover') {
        drawBackground();
        enemies.forEach(e => e.draw());
        drawHUD();
        drawGameOver();
    } else if (gameState === 'victory') {
        drawBackground();
        player.draw();
        drawHUD();
        drawVictory();
    }

    requestAnimationFrame(gameLoop);
}

// Input
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;

    if (e.key === ' ') {
        if (gameState === 'title' || gameState === 'gameover' || gameState === 'victory') {
            initGame();
        }
    }
});

document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

// Expose for testing
window.gameState = () => ({
    state: gameState,
    wave: wave,
    playerHp: player ? player.hp : 0,
    playerLevel: player ? player.level : 0,
    enemies: enemies.length,
    materials: player ? player.materials : 0
});
window.startGame = initGame;

// Start
requestAnimationFrame(gameLoop);
