// Station Breach - Alien Breed Style Twin-Stick Shooter
// POLISHED VERSION with 20 expand + 20 polish passes
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = Math.max(1280, window.innerWidth);
canvas.height = Math.max(720, window.innerHeight);

const TILE = 32;
const MAP_W = 40;
const MAP_H = 30;

// Dark industrial color palette
const COLORS = {
    floor: '#3A2A1A', floorDark: '#2A1A0A', floorLight: '#4A3A2A',
    wall: '#5A5A5A', wallLight: '#7A7A7A', wallDark: '#3A3A3A',
    void: '#000000', hudBg: '#0A0A0A', hudText: '#CCCCCC', hudYellow: '#FFCC00',
    player: '#3A5A2A', playerLight: '#4A6A3A', playerDark: '#2A4A1A',
    alien: '#1A1A1A', alienEye: '#880000', alienBlood: '#00AA66',
    bullet: '#FFAA00', bulletEnemy: '#88FF88', muzzleFlash: '#FFFF44',
    health: '#CC2222', shield: '#3366CC', stamina: '#44AA44',
    keyGreen: '#00CC00', keyBlue: '#0066CC', keyYellow: '#CCCC00', keyRed: '#CC0000',
    terminal: '#00FFFF', doorLocked: '#880000', explosion: '#FF8844'
};

// Weapons database
const WEAPONS = {
    pistol: { name: 'Pistol', damage: 15, fireRate: 0.25, magSize: 12, spread: 0.05, bulletSpeed: 800, ammoType: '9mm', shake: 2 },
    shotgun: { name: 'Shotgun', damage: 10, fireRate: 0.8, magSize: 8, spread: 0.35, pellets: 6, bulletSpeed: 600, ammoType: 'shells', shake: 8 },
    smg: { name: 'SMG', damage: 8, fireRate: 0.08, magSize: 40, spread: 0.12, bulletSpeed: 700, ammoType: '9mm', shake: 1 },
    rifle: { name: 'Assault Rifle', damage: 20, fireRate: 0.15, magSize: 30, spread: 0.06, bulletSpeed: 850, ammoType: 'rifle', shake: 3 },
    plasma: { name: 'Plasma Rifle', damage: 40, fireRate: 0.5, magSize: 20, spread: 0, bulletSpeed: 500, ammoType: 'plasma', shake: 5, color: '#44AAFF' }
};

// Game state
let gameState = 'title';
let player = null;
let enemies = [];
let bullets = [];
let particles = [];
let pickups = [];
let doors = [];
let terminals = [];
let barrels = [];
let bloodStains = [];
let floatingTexts = [];
let map = [];
let explored = [];
let cameraX = 0, cameraY = 0;
let shakeAmount = 0, shakeDuration = 0;
let selfDestructTimer = 0;
let selfDestructActive = false;
let deck = 1;
let maxDecks = 4;
let roomsCleared = 0;
let totalRooms = 0;
let killCount = 0;
let killCombo = 0;
let comboTimer = 0;

// Input
const keys = {};
let mouseX = 0, mouseY = 0;
let mouseDown = false;

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.speed = 180;
        this.sprintSpeed = 270;
        this.angle = 0;
        this.hp = 100;
        this.maxHp = 100;
        this.shield = 0;
        this.maxShield = 50;
        this.stamina = 100;
        this.maxStamina = 100;
        this.lives = 3;
        this.credits = 0;
        this.keys = { green: false, blue: false, yellow: false, red: false };
        this.weapons = [{ ...WEAPONS.pistol, ammo: 12 }];
        this.currentWeapon = 0;
        this.ammo = { '9mm': 60, 'shells': 0, 'rifle': 0, 'plasma': 0 };
        this.fireTimer = 0;
        this.reloading = false;
        this.reloadTimer = 0;
        this.muzzleFlash = 0;
        this.invuln = 0;
        this.medkits = 0;
        this.upgrades = { damage: 0, reload: 0, armor: 0 };
    }

    getWeapon() { return this.weapons[this.currentWeapon]; }

    update(dt) {
        let dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;

        if (dx && dy) { dx *= 0.707; dy *= 0.707; }

        let speed = this.speed;
        if (keys['shift'] && this.stamina > 0 && (dx || dy)) {
            speed = this.sprintSpeed;
            this.stamina -= 25 * dt;
        } else {
            this.stamina = Math.min(this.maxStamina, this.stamina + 20 * dt);
        }

        const newX = this.x + dx * speed * dt;
        const newY = this.y + dy * speed * dt;
        if (!isColliding(newX, this.y, this.width, this.height)) this.x = newX;
        if (!isColliding(this.x, newY, this.width, this.height)) this.y = newY;

        // Aim
        const worldMouseX = mouseX + cameraX;
        const worldMouseY = mouseY + cameraY;
        this.angle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);

        // Shooting
        this.fireTimer -= dt;
        if (this.reloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                this.finishReload();
            }
        } else if (mouseDown && this.fireTimer <= 0) {
            this.shoot();
        }

        if (this.muzzleFlash > 0) this.muzzleFlash -= dt;
        if (this.invuln > 0) this.invuln -= dt;
    }

    shoot() {
        const weapon = this.getWeapon();
        if (weapon.ammo <= 0) {
            this.startReload();
            return;
        }

        const pellets = weapon.pellets || 1;
        for (let i = 0; i < pellets; i++) {
            const spread = (Math.random() - 0.5) * weapon.spread * 2;
            const angle = this.angle + spread;
            bullets.push({
                x: this.x + Math.cos(this.angle) * 20,
                y: this.y + Math.sin(this.angle) * 20,
                vx: Math.cos(angle) * weapon.bulletSpeed,
                vy: Math.sin(angle) * weapon.bulletSpeed,
                damage: weapon.damage * (1 + this.upgrades.damage * 0.1),
                life: 0.8, fromPlayer: true, color: weapon.color
            });
        }

        weapon.ammo--;
        this.fireTimer = weapon.fireRate * (1 - this.upgrades.reload * 0.1);
        this.muzzleFlash = 0.05;
        screenShake(weapon.shake, 0.05);

        // Muzzle particles
        for (let i = 0; i < 4; i++) {
            particles.push({
                x: this.x + Math.cos(this.angle) * 22,
                y: this.y + Math.sin(this.angle) * 22,
                vx: Math.cos(this.angle + (Math.random() - 0.5) * 0.5) * 200,
                vy: Math.sin(this.angle + (Math.random() - 0.5) * 0.5) * 200,
                life: 0.1, maxLife: 0.1, color: COLORS.muzzleFlash, size: 5
            });
        }
    }

    startReload() {
        const weapon = this.getWeapon();
        if (weapon.ammo >= weapon.magSize) return;
        if (this.ammo[weapon.ammoType] <= 0) {
            addFloatingText(this.x, this.y - 20, 'NO AMMO!', COLORS.health);
            return;
        }
        this.reloading = true;
        this.reloadTimer = 1.5;
        addFloatingText(this.x, this.y - 20, 'RELOADING...', COLORS.hudYellow);
    }

    finishReload() {
        const weapon = this.getWeapon();
        const need = weapon.magSize - weapon.ammo;
        const take = Math.min(need, this.ammo[weapon.ammoType]);
        weapon.ammo += take;
        this.ammo[weapon.ammoType] -= take;
        this.reloading = false;
    }

    takeDamage(amount) {
        if (this.invuln > 0) return;

        const armor = this.upgrades.armor * 5;
        amount = Math.max(1, amount - armor);

        if (this.shield > 0) {
            if (this.shield >= amount) { this.shield -= amount; amount = 0; }
            else { amount -= this.shield; this.shield = 0; }
        }

        this.hp -= amount;
        this.invuln = 0.5;
        screenShake(5, 0.1);

        for (let i = 0; i < 6; i++) {
            particles.push({
                x: this.x, y: this.y,
                vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200,
                life: 0.3, maxLife: 0.3, color: COLORS.health, size: 4
            });
        }

        addFloatingText(this.x, this.y - 20, `-${Math.floor(amount)}`, COLORS.health);

        if (this.hp <= 0) this.die();
    }

    die() {
        this.lives--;
        if (this.lives > 0) {
            this.hp = this.maxHp;
            addFloatingText(this.x, this.y, 'RESPAWNING...', COLORS.hudYellow);
        } else {
            gameState = 'gameover';
        }
    }

    useMedkit() {
        if (this.medkits <= 0 || this.hp >= this.maxHp) return;
        this.medkits--;
        const heal = 50;
        this.hp = Math.min(this.maxHp, this.hp + heal);
        addFloatingText(this.x, this.y - 20, `+${heal} HP`, COLORS.stamina);
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - cameraX, this.y - cameraY);
        ctx.rotate(this.angle);

        if (this.invuln > 0 && Math.floor(this.invuln * 10) % 2 === 0) ctx.globalAlpha = 0.5;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-10, 2, 20, 12);

        // Body
        ctx.fillStyle = COLORS.playerDark;
        ctx.fillRect(-11, -9, 22, 18);
        ctx.fillStyle = COLORS.player;
        ctx.fillRect(-10, -8, 20, 16);
        ctx.fillStyle = COLORS.playerLight;
        ctx.fillRect(-8, -6, 16, 8);

        // Helmet
        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.arc(-2, -2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#224466';
        ctx.fillRect(-4, -4, 6, 3);

        // Gun
        ctx.fillStyle = '#2A2A2A';
        ctx.fillRect(6, -4, 6, 8);
        ctx.fillRect(10, -3, 14, 6);
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(18, -2, 6, 4);

        // Muzzle flash
        if (this.muzzleFlash > 0) {
            ctx.fillStyle = COLORS.muzzleFlash;
            ctx.shadowBlur = 15;
            ctx.shadowColor = COLORS.muzzleFlash;
            ctx.beginPath();
            ctx.arc(26, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(26, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type = 'drone') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.angle = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.hitFlash = 0;
        this.legPhase = Math.random() * Math.PI * 2;
        this.attackTimer = 0;

        const stats = {
            drone: { hp: 20, speed: 120, damage: 10, cooldown: 1, range: 300, size: 24, credits: 5 },
            spitter: { hp: 30, speed: 80, damage: 15, cooldown: 2, range: 400, size: 28, credits: 10, preferDist: 200 },
            lurker: { hp: 40, speed: 200, damage: 20, cooldown: 0.8, range: 100, size: 26, credits: 15 },
            brute: { hp: 100, speed: 60, damage: 30, cooldown: 1.5, range: 250, size: 44, credits: 30 },
            exploder: { hp: 15, speed: 150, damage: 50, cooldown: 0, range: 350, size: 24, credits: 5, explodes: true },
            elite: { hp: 50, speed: 150, damage: 15, cooldown: 0.8, range: 400, size: 28, credits: 25 }
        };

        const s = stats[type] || stats.drone;
        this.hp = s.hp; this.maxHp = s.hp;
        this.speed = s.speed; this.damage = s.damage;
        this.attackCooldown = s.cooldown; this.detectionRange = s.range;
        this.width = s.size; this.height = s.size;
        this.credits = s.credits;
        this.preferredDistance = s.preferDist || 0;
        this.explodes = s.explodes || false;
    }

    update(dt) {
        if (!player) return true;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Knockback
        if (this.knockbackX || this.knockbackY) {
            this.x += this.knockbackX * dt;
            this.y += this.knockbackY * dt;
            this.knockbackX *= 0.9;
            this.knockbackY *= 0.9;
            if (Math.abs(this.knockbackX) < 1) this.knockbackX = 0;
            if (Math.abs(this.knockbackY) < 1) this.knockbackY = 0;
        }

        if (dist < this.detectionRange) {
            this.angle = Math.atan2(dy, dx);

            let move = true;
            if (this.preferredDistance && dist < this.preferredDistance) move = false;

            if (move && dist > 30) {
                const mx = (dx / dist) * this.speed * dt;
                const my = (dy / dist) * this.speed * dt;
                if (!isColliding(this.x + mx, this.y, this.width, this.height)) this.x += mx;
                if (!isColliding(this.x, this.y + my, this.width, this.height)) this.y += my;
            }

            this.attackTimer -= dt;
            if (this.attackTimer <= 0) {
                if (this.type === 'spitter' || this.type === 'elite') {
                    this.shootAcid();
                    this.attackTimer = this.attackCooldown;
                } else if (this.explodes && dist < 40) {
                    this.explode();
                } else if (dist < 40) {
                    player.takeDamage(this.damage);
                    this.attackTimer = this.attackCooldown;
                }
            }
        }

        this.legPhase += dt * 10;
        if (this.hitFlash > 0) this.hitFlash -= dt;

        return this.hp > 0;
    }

    shootAcid() {
        bullets.push({
            x: this.x, y: this.y,
            vx: Math.cos(this.angle) * 300,
            vy: Math.sin(this.angle) * 300,
            damage: this.damage, life: 1.5, fromPlayer: false, color: COLORS.bulletEnemy
        });
    }

    explode() {
        // Explosion damage
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
            player.takeDamage(this.damage * (1 - dist / 80));
        }

        // Explosion particles
        for (let i = 0; i < 20; i++) {
            particles.push({
                x: this.x, y: this.y,
                vx: (Math.random() - 0.5) * 400, vy: (Math.random() - 0.5) * 400,
                life: 0.5, maxLife: 0.5, color: COLORS.explosion, size: 8
            });
        }
        screenShake(10, 0.2);
        this.hp = 0;
    }

    takeDamage(amount, knockbackAngle) {
        this.hp -= amount;
        this.hitFlash = 0.1;

        if (this.type !== 'brute') {
            const force = amount * 5;
            this.knockbackX = Math.cos(knockbackAngle) * force;
            this.knockbackY = Math.sin(knockbackAngle) * force;
        }

        // Blood
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: this.x, y: this.y,
                vx: Math.cos(knockbackAngle + (Math.random() - 0.5)) * 150,
                vy: Math.sin(knockbackAngle + (Math.random() - 0.5)) * 150,
                life: 0.5, maxLife: 0.5, color: COLORS.alienBlood, size: 4
            });
        }

        addFloatingText(this.x, this.y - 20, `-${Math.floor(amount)}`, COLORS.alienBlood);

        if (this.hp <= 0) this.die();
    }

    die() {
        if (this.explodes) {
            this.explode();
        }

        player.credits += this.credits;
        killCount++;
        killCombo++;
        comboTimer = 3;

        if (killCombo > 1) {
            addFloatingText(this.x, this.y - 30, `x${killCombo} COMBO!`, COLORS.hudYellow);
        }

        // Death particles
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: this.x, y: this.y,
                vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300,
                life: 1, maxLife: 1, color: COLORS.alienBlood, size: 6
            });
        }

        // Blood stain
        bloodStains.push({ x: this.x, y: this.y, size: this.width, alpha: 0.6 });
        if (bloodStains.length > 50) bloodStains.shift();

        // Drops
        if (Math.random() < 0.25) {
            const types = ['ammo', 'health', 'credits'];
            pickups.push({ x: this.x, y: this.y, type: types[Math.floor(Math.random() * types.length)] });
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - cameraX, this.y - cameraY);

        const size = this.width / 2;
        const legLen = size * 0.8;

        // Legs
        ctx.strokeStyle = this.hitFlash > 0 ? '#FFF' : COLORS.alien;
        ctx.lineWidth = this.type === 'brute' ? 3 : 2;
        for (let i = 0; i < 8; i++) {
            const baseAngle = (i / 8) * Math.PI * 2;
            const legOffset = Math.sin(this.legPhase + i * 0.8) * 4;
            const midX = Math.cos(baseAngle) * (size * 0.9);
            const midY = Math.sin(baseAngle) * (size * 0.9);
            const endX = Math.cos(baseAngle) * (size + legLen) + legOffset;
            const endY = Math.sin(baseAngle) * (size + legLen) + legOffset;

            ctx.beginPath();
            ctx.moveTo(Math.cos(baseAngle) * size * 0.5, Math.sin(baseAngle) * size * 0.5);
            ctx.lineTo(midX, midY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(midX, midY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        // Body
        ctx.fillStyle = this.hitFlash > 0 ? '#FFF' : '#000';
        ctx.beginPath();
        ctx.ellipse(2, 2, size, size * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.hitFlash > 0 ? '#FFF' : COLORS.alien;
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();

        // Carapace
        ctx.strokeStyle = this.hitFlash > 0 ? '#FFF' : '#2A2A2A';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.7, size * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = this.hitFlash > 0 ? '#FFF' : COLORS.alienEye;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#FF0000';
        const eyeOff = size * 0.3;
        ctx.beginPath();
        ctx.arc(Math.cos(this.angle) * eyeOff - 3, Math.sin(this.angle) * eyeOff, 2, 0, Math.PI * 2);
        ctx.arc(Math.cos(this.angle) * eyeOff + 3, Math.sin(this.angle) * eyeOff, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Exploder glow
        if (this.explodes) {
            const glow = Math.sin(Date.now() / 100) * 0.3 + 0.5;
            ctx.fillStyle = `rgba(255, 136, 68, ${glow})`;
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// Helper functions
function addFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 1, vy: -50 });
}

function screenShake(amount, duration) {
    shakeAmount = Math.max(shakeAmount, amount);
    shakeDuration = Math.max(shakeDuration, duration);
}

function isColliding(x, y, w, h) {
    const left = Math.floor((x - w/2) / TILE);
    const right = Math.floor((x + w/2) / TILE);
    const top = Math.floor((y - h/2) / TILE);
    const bottom = Math.floor((y + h/2) / TILE);

    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return true;
            const tile = map[ty]?.[tx];
            if (tile === 2 || tile === 0) return true;
        }
    }

    // Door collision
    for (const door of doors) {
        if (!door.open && Math.abs(x - door.x * TILE - TILE/2) < w/2 + TILE/2 &&
            Math.abs(y - door.y * TILE - TILE/2) < h/2 + TILE/2) {
            return true;
        }
    }

    return false;
}

// Level generation
function generateLevel() {
    map = Array(MAP_H).fill(null).map(() => Array(MAP_W).fill(0));
    explored = Array(MAP_H).fill(null).map(() => Array(MAP_W).fill(false));
    enemies = [];
    pickups = [];
    doors = [];
    terminals = [];
    barrels = [];
    bloodStains = [];

    const rooms = [];
    const roomCount = 8 + Math.floor(Math.random() * 4);

    // Generate rooms
    for (let attempt = 0; attempt < roomCount * 4; attempt++) {
        if (rooms.length >= roomCount) break;

        const w = 5 + Math.floor(Math.random() * 6);
        const h = 5 + Math.floor(Math.random() * 6);
        const x = 2 + Math.floor(Math.random() * (MAP_W - w - 4));
        const y = 2 + Math.floor(Math.random() * (MAP_H - h - 4));

        let overlap = false;
        for (const room of rooms) {
            if (x < room.x + room.w + 2 && x + w + 2 > room.x &&
                y < room.y + room.h + 2 && y + h + 2 > room.y) {
                overlap = true;
                break;
            }
        }

        if (!overlap) {
            rooms.push({ x, y, w, h });
            for (let ry = y; ry < y + h; ry++) {
                for (let rx = x; rx < x + w; rx++) {
                    map[ry][rx] = 1;
                }
            }
            // Walls
            for (let ry = y - 1; ry <= y + h; ry++) {
                for (let rx = x - 1; rx <= x + w; rx++) {
                    if (ry >= 0 && ry < MAP_H && rx >= 0 && rx < MAP_W && map[ry][rx] === 0) {
                        map[ry][rx] = 2;
                    }
                }
            }
        }
    }

    // Connect rooms
    for (let i = 1; i < rooms.length; i++) {
        const r1 = rooms[i - 1];
        const r2 = rooms[i];
        const x1 = Math.floor(r1.x + r1.w / 2);
        const y1 = Math.floor(r1.y + r1.h / 2);
        const x2 = Math.floor(r2.x + r2.w / 2);
        const y2 = Math.floor(r2.y + r2.h / 2);

        carveCorridor(x1, y1, x2, y1);
        carveCorridor(x2, y1, x2, y2);
    }

    // Spawn player in first room
    const startRoom = rooms[0];
    player = new Player(
        startRoom.x * TILE + startRoom.w * TILE / 2,
        startRoom.y * TILE + startRoom.h * TILE / 2
    );

    // Spawn enemies in other rooms
    for (let i = 1; i < rooms.length; i++) {
        const room = rooms[i];
        const enemyCount = 2 + Math.floor(Math.random() * 4);
        const types = ['drone', 'drone', 'drone', 'spitter', 'lurker', 'brute', 'exploder', 'elite'];
        for (let j = 0; j < enemyCount; j++) {
            const ex = room.x * TILE + Math.random() * room.w * TILE;
            const ey = room.y * TILE + Math.random() * room.h * TILE;
            const type = types[Math.floor(Math.random() * (4 + deck))]; // More enemy variety in later decks
            enemies.push(new Enemy(ex, ey, type));
        }

        // Add terminal
        if (i === Math.floor(rooms.length / 2)) {
            terminals.push({
                x: room.x + Math.floor(room.w / 2),
                y: room.y + Math.floor(room.h / 2),
                used: false
            });
        }

        // Add barrels
        if (Math.random() < 0.3) {
            barrels.push({
                x: room.x * TILE + Math.random() * room.w * TILE,
                y: room.y * TILE + Math.random() * room.h * TILE,
                hp: 20
            });
        }
    }

    // Add pickup in some rooms
    for (let i = 1; i < rooms.length; i++) {
        if (Math.random() < 0.4) {
            const room = rooms[i];
            const types = ['ammo', 'health', 'shield', 'medkit', 'weapon'];
            pickups.push({
                x: room.x * TILE + room.w * TILE / 2,
                y: room.y * TILE + room.h * TILE / 2,
                type: types[Math.floor(Math.random() * types.length)]
            });
        }
    }

    totalRooms = rooms.length;
    roomsCleared = 1;
}

function carveCorridor(x1, y1, x2, y2) {
    const dx = x2 > x1 ? 1 : x2 < x1 ? -1 : 0;
    const dy = y2 > y1 ? 1 : y2 < y1 ? -1 : 0;
    let x = x1, y = y1;

    while (x !== x2 || y !== y2) {
        for (let ox = -1; ox <= 0; ox++) {
            for (let oy = -1; oy <= 0; oy++) {
                const tx = x + ox, ty = y + oy;
                if (ty >= 0 && ty < MAP_H && tx >= 0 && tx < MAP_W && map[ty][tx] !== 1) {
                    map[ty][tx] = 1;
                }
            }
        }
        for (let ox = -2; ox <= 1; ox++) {
            for (let oy = -2; oy <= 1; oy++) {
                const tx = x + ox, ty = y + oy;
                if (ty >= 0 && ty < MAP_H && tx >= 0 && tx < MAP_W && map[ty][tx] === 0) {
                    map[ty][tx] = 2;
                }
            }
        }
        if (x !== x2) x += dx;
        else if (y !== y2) y += dy;
    }
}

// Drawing
function drawTiles() {
    const startX = Math.max(0, Math.floor(cameraX / TILE) - 1);
    const startY = Math.max(0, Math.floor(cameraY / TILE) - 1);
    const endX = Math.min(MAP_W, Math.floor((cameraX + canvas.width) / TILE) + 2);
    const endY = Math.min(MAP_H, Math.floor((cameraY + canvas.height) / TILE) + 2);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const screenX = x * TILE - cameraX;
            const screenY = y * TILE - cameraY;
            const tile = map[y]?.[x] || 0;
            const seed = x * 1000 + y;

            if (tile === 0) {
                ctx.fillStyle = COLORS.void;
                ctx.fillRect(screenX, screenY, TILE, TILE);
            } else if (tile === 1) {
                ctx.fillStyle = COLORS.floor;
                ctx.fillRect(screenX, screenY, TILE, TILE);
                ctx.fillStyle = COLORS.floorDark;
                ctx.fillRect(screenX, screenY, 2, TILE);
                ctx.fillRect(screenX, screenY, TILE, 2);
                ctx.fillRect(screenX + 15, screenY, 2, TILE);
                ctx.fillRect(screenX, screenY + 15, TILE, 2);

                // Variation
                if ((x + y * 7) % 5 === 0) {
                    ctx.fillStyle = COLORS.floorDark;
                    for (let i = 4; i < 28; i += 4) ctx.fillRect(screenX + i, screenY + 4, 1, 24);
                }
            } else if (tile === 2) {
                ctx.fillStyle = COLORS.wall;
                ctx.fillRect(screenX, screenY, TILE, TILE);
                ctx.fillStyle = COLORS.wallLight;
                ctx.fillRect(screenX, screenY, TILE, 3);
                ctx.fillRect(screenX, screenY, 3, TILE);
                ctx.fillStyle = COLORS.wallDark;
                ctx.fillRect(screenX + TILE - 3, screenY, 3, TILE);
                ctx.fillRect(screenX, screenY + TILE - 3, TILE, 3);

                // Panel detail
                if ((x + y) % 3 === 0) {
                    ctx.fillStyle = COLORS.hudYellow;
                    ctx.fillRect(screenX + 10, screenY + 10, 4, 12);
                }
            }
        }
    }
}

function drawBloodStains() {
    bloodStains.forEach(b => {
        ctx.globalAlpha = b.alpha;
        ctx.fillStyle = COLORS.alienBlood;
        ctx.beginPath();
        ctx.arc(b.x - cameraX, b.y - cameraY, b.size / 2, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function drawBarrels() {
    barrels.forEach(b => {
        ctx.save();
        ctx.translate(b.x - cameraX, b.y - cameraY);

        ctx.fillStyle = '#3A3A3A';
        ctx.fillRect(-10, -14, 20, 28);
        ctx.fillStyle = '#2A2A2A';
        ctx.fillRect(-8, -12, 16, 24);
        ctx.fillStyle = COLORS.explosion;
        ctx.fillRect(-6, -8, 12, 4);
        ctx.fillRect(-6, 0, 12, 4);

        ctx.restore();
    });
}

function drawTerminals() {
    terminals.forEach(t => {
        const screenX = t.x * TILE - cameraX;
        const screenY = t.y * TILE - cameraY;

        ctx.fillStyle = '#2A2A2A';
        ctx.fillRect(screenX + 4, screenY + 4, TILE - 8, TILE - 8);
        ctx.fillStyle = t.used ? '#1A1A1A' : COLORS.terminal;
        ctx.fillRect(screenX + 6, screenY + 6, TILE - 12, TILE - 16);

        if (!t.used) {
            ctx.fillStyle = '#00FF00';
            ctx.font = '10px monospace';
            ctx.fillText('>', screenX + 8, screenY + 16);
        }
    });
}

function drawPickups() {
    pickups.forEach(p => {
        ctx.save();
        ctx.translate(p.x - cameraX, p.y - cameraY);

        const bob = Math.sin(Date.now() / 200) * 3;
        ctx.translate(0, bob);

        ctx.shadowBlur = 10;

        switch (p.type) {
            case 'health':
                ctx.shadowColor = COLORS.health;
                ctx.fillStyle = COLORS.health;
                ctx.fillRect(-8, -3, 16, 6);
                ctx.fillRect(-3, -8, 6, 16);
                break;
            case 'ammo':
                ctx.shadowColor = COLORS.hudYellow;
                ctx.fillStyle = COLORS.hudYellow;
                ctx.fillRect(-6, -8, 12, 16);
                ctx.fillStyle = '#AA8800';
                ctx.fillRect(-4, -6, 8, 12);
                break;
            case 'shield':
                ctx.shadowColor = COLORS.shield;
                ctx.fillStyle = COLORS.shield;
                ctx.beginPath();
                ctx.moveTo(0, -10);
                ctx.lineTo(8, -4);
                ctx.lineTo(8, 4);
                ctx.lineTo(0, 10);
                ctx.lineTo(-8, 4);
                ctx.lineTo(-8, -4);
                ctx.closePath();
                ctx.fill();
                break;
            case 'medkit':
                ctx.shadowColor = '#FFFFFF';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(-10, -6, 20, 12);
                ctx.fillStyle = COLORS.health;
                ctx.fillRect(-6, -3, 12, 6);
                ctx.fillRect(-3, -6, 6, 12);
                break;
            case 'weapon':
                ctx.shadowColor = '#FFAA00';
                ctx.fillStyle = '#4A4A4A';
                ctx.fillRect(-12, -4, 24, 8);
                ctx.fillStyle = '#2A2A2A';
                ctx.fillRect(6, -2, 6, 4);
                break;
            case 'credits':
                ctx.shadowColor = COLORS.hudYellow;
                ctx.fillStyle = COLORS.hudYellow;
                ctx.font = 'bold 16px Arial';
                ctx.fillText('$', -5, 6);
                break;
        }

        ctx.restore();
    });
}

function drawBullets() {
    bullets.forEach(b => {
        ctx.save();
        ctx.translate(b.x - cameraX, b.y - cameraY);
        ctx.rotate(Math.atan2(b.vy, b.vx));

        if (b.fromPlayer) {
            ctx.fillStyle = b.color || COLORS.bullet;
            ctx.shadowBlur = 10;
            ctx.shadowColor = b.color || COLORS.bullet;
            ctx.fillRect(-8, -2, 16, 4);
        } else {
            ctx.fillStyle = b.color || COLORS.bulletEnemy;
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });
}

function drawParticles() {
    particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x - cameraX, p.y - cameraY, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function drawFloatingTexts() {
    floatingTexts.forEach(ft => {
        ctx.globalAlpha = ft.life;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x - cameraX, ft.y - cameraY);
    });
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
}

function drawMinimap() {
    const mapSize = 150;
    const mapX = canvas.width - mapSize - 20;
    const mapY = 60;
    const scale = mapSize / Math.max(MAP_W, MAP_H);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX - 5, mapY - 5, mapSize + 10, mapSize * (MAP_H / MAP_W) + 10);

    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            const tile = map[y]?.[x];
            if (tile === 1) ctx.fillStyle = '#333';
            else if (tile === 2) ctx.fillStyle = '#666';
            else continue;
            ctx.fillRect(mapX + x * scale, mapY + y * scale, scale, scale);
        }
    }

    // Player
    ctx.fillStyle = COLORS.playerLight;
    ctx.fillRect(mapX + (player.x / TILE) * scale - 2, mapY + (player.y / TILE) * scale - 2, 4, 4);

    // Enemies
    ctx.fillStyle = COLORS.alienEye;
    enemies.forEach(e => {
        ctx.fillRect(mapX + (e.x / TILE) * scale - 1, mapY + (e.y / TILE) * scale - 1, 2, 2);
    });
}

function drawHUD() {
    // Top bar
    ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
    ctx.fillRect(0, 0, canvas.width, 50);

    ctx.font = '14px monospace';
    ctx.fillStyle = COLORS.hudYellow;
    ctx.fillText('1UP', 20, 20);

    // Lives
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText('LIVES', 70, 20);
    for (let i = 0; i < player.lives; i++) {
        ctx.fillStyle = COLORS.health;
        ctx.fillRect(130 + i * 24, 8, 18, 18);
    }

    // Ammo
    const weapon = player.getWeapon();
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText('AMMO', 230, 20);
    ctx.fillStyle = COLORS.hudYellow;
    ctx.fillRect(290, 10, (weapon.ammo / weapon.magSize) * 100, 14);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(290, 10, 100, 14);
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText(`${weapon.ammo}`, 400, 20);

    // Weapon name
    ctx.fillText(`[${weapon.name}]`, 450, 20);

    // Keys
    ctx.fillText('KEYS', 600, 20);
    const keyColors = [
        { key: 'green', color: COLORS.keyGreen },
        { key: 'blue', color: COLORS.keyBlue },
        { key: 'yellow', color: COLORS.keyYellow },
        { key: 'red', color: COLORS.keyRed }
    ];
    keyColors.forEach((k, i) => {
        ctx.fillStyle = player.keys[k.key] ? k.color : '#1A1A1A';
        ctx.fillRect(660 + i * 24, 8, 18, 18);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(660 + i * 24, 8, 18, 18);
    });

    // Deck
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText(`DECK ${deck}/${maxDecks}`, 780, 20);

    // Kill combo
    if (killCombo > 1 && comboTimer > 0) {
        ctx.fillStyle = COLORS.hudYellow;
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`x${killCombo} COMBO!`, canvas.width / 2 - 60, 80);
    }

    // Bottom bar
    ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
    ctx.fillRect(0, canvas.height - 45, canvas.width, 45);

    ctx.font = '12px monospace';

    // Health
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText('HEALTH', 20, canvas.height - 15);
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(90, canvas.height - 28, 150, 16);
    ctx.fillStyle = player.hp < 30 ? (Math.sin(Date.now() / 100) > 0 ? COLORS.health : '#FF6666') : COLORS.health;
    ctx.fillRect(91, canvas.height - 27, (player.hp / player.maxHp) * 148, 14);

    // Shield
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText('SHIELD', 260, canvas.height - 15);
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(330, canvas.height - 28, 100, 16);
    ctx.fillStyle = COLORS.shield;
    ctx.fillRect(331, canvas.height - 27, (player.shield / player.maxShield) * 98, 14);

    // Stamina
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText('STAM', 450, canvas.height - 15);
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(500, canvas.height - 26, 80, 12);
    ctx.fillStyle = COLORS.stamina;
    ctx.fillRect(501, canvas.height - 25, (player.stamina / player.maxStamina) * 78, 10);

    // Medkits
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText(`MEDKITS: ${player.medkits}`, 600, canvas.height - 15);

    // Credits
    ctx.fillStyle = COLORS.hudYellow;
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`$${player.credits}`, 720, canvas.height - 15);

    // Kills
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText(`KILLS: ${killCount}`, 800, canvas.height - 15);

    // Reloading indicator
    if (player.reloading) {
        ctx.fillStyle = COLORS.hudYellow;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('RELOADING...', canvas.width / 2, canvas.height / 2 + 50);
        ctx.textAlign = 'left';
    }

    // Low HP warning
    if (player.hp < 30) {
        ctx.fillStyle = `rgba(255, 0, 0, ${Math.sin(Date.now() / 100) * 0.2})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Self-destruct timer
    if (selfDestructActive) {
        const mins = Math.floor(selfDestructTimer / 60);
        const secs = Math.floor(selfDestructTimer % 60);
        ctx.fillStyle = selfDestructTimer < 60 ? COLORS.health : COLORS.hudYellow;
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, canvas.width / 2, 40);
        ctx.font = '14px monospace';
        ctx.fillText('SELF-DESTRUCT', canvas.width / 2, 55);
        ctx.textAlign = 'left';
    }
}

function drawTitle() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 52px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STATION BREACH', canvas.width / 2, 200);

    ctx.fillStyle = COLORS.hudYellow;
    ctx.font = '20px monospace';
    ctx.fillText('A Top-Down Twin-Stick Shooter', canvas.width / 2, 250);

    ctx.fillStyle = COLORS.hudText;
    ctx.font = '14px monospace';
    ctx.fillText('WASD - Move | Mouse - Aim | Click - Shoot', canvas.width / 2, 350);
    ctx.fillText('Shift - Sprint | R - Reload | H - Use Medkit', canvas.width / 2, 380);
    ctx.fillText('Q - Switch Weapon | E - Interact', canvas.width / 2, 410);

    ctx.fillStyle = Math.sin(Date.now() / 300) > 0 ? COLORS.hudYellow : COLORS.hudText;
    ctx.font = 'bold 24px monospace';
    ctx.fillText('CLICK TO START', canvas.width / 2, 500);

    ctx.textAlign = 'left';
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.health;
    ctx.font = 'bold 52px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION FAILED', canvas.width / 2, 250);

    ctx.fillStyle = COLORS.hudText;
    ctx.font = '20px monospace';
    ctx.fillText(`Enemies Killed: ${killCount}`, canvas.width / 2, 330);
    ctx.fillText(`Credits Earned: $${player.credits}`, canvas.width / 2, 360);
    ctx.fillText(`Deck Reached: ${deck}`, canvas.width / 2, 390);

    ctx.fillStyle = Math.sin(Date.now() / 300) > 0 ? COLORS.hudYellow : COLORS.hudText;
    ctx.font = 'bold 22px monospace';
    ctx.fillText('CLICK TO RESTART', canvas.width / 2, 480);

    ctx.textAlign = 'left';
}

function drawWin() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.stamina;
    ctx.font = 'bold 52px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPED!', canvas.width / 2, 250);

    ctx.fillStyle = COLORS.hudText;
    ctx.font = '20px monospace';
    ctx.fillText(`Enemies Killed: ${killCount}`, canvas.width / 2, 330);
    ctx.fillText(`Credits Earned: $${player.credits}`, canvas.width / 2, 360);

    ctx.fillStyle = COLORS.hudYellow;
    ctx.font = 'bold 22px monospace';
    ctx.fillText('CLICK TO PLAY AGAIN', canvas.width / 2, 480);

    ctx.textAlign = 'left';
}

// Update functions
function update(dt) {
    player.update(dt);

    // Combo timer
    if (comboTimer > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) killCombo = 0;
    }

    // Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (!enemies[i].update(dt)) enemies.splice(i, 1);
    }

    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;

        if (isColliding(b.x, b.y, 4, 4)) {
            for (let j = 0; j < 5; j++) {
                particles.push({
                    x: b.x, y: b.y,
                    vx: (Math.random() - 0.5) * 150, vy: (Math.random() - 0.5) * 150,
                    life: 0.2, maxLife: 0.2, color: b.fromPlayer ? COLORS.hudYellow : COLORS.bulletEnemy, size: 3
                });
            }
            bullets.splice(i, 1);
            continue;
        }

        if (b.fromPlayer) {
            // Hit enemies
            for (let e of enemies) {
                const dx = b.x - e.x, dy = b.y - e.y;
                if (Math.sqrt(dx * dx + dy * dy) < e.width / 2 + 4) {
                    e.takeDamage(b.damage, Math.atan2(b.vy, b.vx));
                    bullets.splice(i, 1);
                    break;
                }
            }
            // Hit barrels
            for (let j = barrels.length - 1; j >= 0; j--) {
                const bar = barrels[j];
                const dx = b.x - bar.x, dy = b.y - bar.y;
                if (Math.sqrt(dx * dx + dy * dy) < 15) {
                    bar.hp -= b.damage;
                    if (bar.hp <= 0) {
                        // Explode barrel
                        for (let k = 0; k < 20; k++) {
                            particles.push({
                                x: bar.x, y: bar.y,
                                vx: (Math.random() - 0.5) * 400, vy: (Math.random() - 0.5) * 400,
                                life: 0.6, maxLife: 0.6, color: COLORS.explosion, size: 8
                            });
                        }
                        screenShake(12, 0.2);
                        // Damage nearby
                        enemies.forEach(e => {
                            const edx = e.x - bar.x, edy = e.y - bar.y;
                            const edist = Math.sqrt(edx * edx + edy * edy);
                            if (edist < 100) e.takeDamage(80 * (1 - edist / 100), Math.atan2(edy, edx));
                        });
                        const pdx = player.x - bar.x, pdy = player.y - bar.y;
                        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
                        if (pdist < 100) player.takeDamage(40 * (1 - pdist / 100));
                        barrels.splice(j, 1);
                    }
                    bullets.splice(i, 1);
                    break;
                }
            }
        } else {
            const dx = b.x - player.x, dy = b.y - player.y;
            if (Math.sqrt(dx * dx + dy * dy) < 20) {
                player.takeDamage(b.damage);
                bullets.splice(i, 1);
                continue;
            }
        }

        if (b.life <= 0) bullets.splice(i, 1);
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.life -= dt;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // Pickups
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dx = p.x - player.x, dy = p.y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) < 32) {
            let take = false;
            switch (p.type) {
                case 'health':
                    if (player.hp < player.maxHp) { player.hp = Math.min(player.maxHp, player.hp + 25); take = true; }
                    break;
                case 'ammo':
                    player.ammo['9mm'] += 30; take = true;
                    break;
                case 'shield':
                    if (player.shield < player.maxShield) { player.shield = Math.min(player.maxShield, player.shield + 25); take = true; }
                    break;
                case 'medkit':
                    player.medkits++; take = true;
                    break;
                case 'credits':
                    player.credits += 25; take = true;
                    break;
                case 'weapon':
                    const weaponKeys = Object.keys(WEAPONS).filter(w => w !== 'pistol');
                    const newWeapon = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
                    player.weapons.push({ ...WEAPONS[newWeapon], ammo: WEAPONS[newWeapon].magSize });
                    addFloatingText(player.x, player.y - 30, `Got ${WEAPONS[newWeapon].name}!`, COLORS.hudYellow);
                    take = true;
                    break;
            }
            if (take) pickups.splice(i, 1);
        }
    }

    // Terminal interaction
    if (keys['e']) {
        for (const t of terminals) {
            const dx = player.x - (t.x * TILE + TILE/2), dy = player.y - (t.y * TILE + TILE/2);
            if (Math.sqrt(dx * dx + dy * dy) < 40 && !t.used) {
                t.used = true;
                // Shop menu (simplified: just give stuff)
                const options = ['health', 'ammo', 'upgrade'];
                const choice = options[Math.floor(Math.random() * options.length)];
                if (choice === 'health' && player.credits >= 25) {
                    player.credits -= 25;
                    player.hp = Math.min(player.maxHp, player.hp + 50);
                    addFloatingText(t.x * TILE, t.y * TILE, '+50 HP', COLORS.stamina);
                } else if (choice === 'ammo' && player.credits >= 15) {
                    player.credits -= 15;
                    player.ammo['9mm'] += 60;
                    addFloatingText(t.x * TILE, t.y * TILE, '+60 Ammo', COLORS.hudYellow);
                } else if (choice === 'upgrade' && player.credits >= 100) {
                    player.credits -= 100;
                    player.upgrades.damage++;
                    addFloatingText(t.x * TILE, t.y * TILE, 'DAMAGE UP!', COLORS.hudYellow);
                } else {
                    addFloatingText(t.x * TILE, t.y * TILE, 'NOT ENOUGH $', COLORS.health);
                    t.used = false;
                }
            }
        }
        keys['e'] = false;
    }

    // Camera
    const targetX = player.x - canvas.width / 2;
    const targetY = player.y - canvas.height / 2;
    cameraX += (targetX - cameraX) * 0.1;
    cameraY += (targetY - cameraY) * 0.1;

    // Screen shake
    if (shakeDuration > 0) {
        cameraX += (Math.random() - 0.5) * shakeAmount * 2;
        cameraY += (Math.random() - 0.5) * shakeAmount * 2;
        shakeDuration -= dt;
        if (shakeDuration <= 0) shakeAmount = 0;
    }

    // Win condition
    if (enemies.length === 0) {
        if (deck < maxDecks) {
            deck++;
            generateLevel();
            addFloatingText(player.x, player.y - 30, `DECK ${deck}`, COLORS.hudYellow);
        } else {
            gameState = 'win';
        }
    }
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'title') {
        drawTitle();
    } else if (gameState === 'playing') {
        update(dt);

        drawTiles();
        drawBloodStains();
        drawBarrels();
        drawTerminals();
        drawPickups();
        enemies.forEach(e => e.draw());
        player.draw();
        drawBullets();
        drawParticles();
        drawFloatingTexts();
        drawHUD();
        drawMinimap();
    } else if (gameState === 'gameover') {
        drawGameOver();
    } else if (gameState === 'win') {
        drawWin();
    }

    requestAnimationFrame(gameLoop);
}

// Input handlers
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'r' && gameState === 'playing') player.startReload();
    if (e.key.toLowerCase() === 'h' && gameState === 'playing') player.useMedkit();
    if (e.key.toLowerCase() === 'q' && gameState === 'playing') {
        player.currentWeapon = (player.currentWeapon + 1) % player.weapons.length;
        addFloatingText(player.x, player.y - 20, player.getWeapon().name, COLORS.hudYellow);
    }
});

document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', e => {
    mouseDown = true;
    if (gameState === 'title') {
        gameState = 'playing';
        deck = 1;
        killCount = 0;
        generateLevel();
    } else if (gameState === 'gameover' || gameState === 'win') {
        gameState = 'title';
    }
});

canvas.addEventListener('mouseup', () => { mouseDown = false; });

window.addEventListener('resize', () => {
    canvas.width = Math.max(1280, window.innerWidth);
    canvas.height = Math.max(720, window.innerHeight);
});

// Start
gameLoop(0);
