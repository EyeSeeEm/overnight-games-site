// Station Breach - Alien Breed Style Twin-Stick Shooter
// POLISHED VERSION with 20 expand + 20 polish passes
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = Math.max(1280, window.innerWidth);
canvas.height = Math.max(720, window.innerHeight);

const TILE = 32;
const MAP_W = 40;
const MAP_H = 30;

// Dark industrial color palette - Alien Breed style
const COLORS = {
    floor: '#2A2830', floorDark: '#1A1820', floorLight: '#3A3840',
    wall: '#4A4848', wallLight: '#6A6868', wallDark: '#2A2828',
    void: '#000000', hudBg: '#0A0A0A', hudText: '#CCCCCC', hudYellow: '#FFCC00',
    player: '#3A5A2A', playerLight: '#4A6A3A', playerDark: '#2A4A1A',
    alien: '#0A0A0A', alienEye: '#AA0000', alienBlood: '#00AA66',
    bullet: '#FFAA00', bulletEnemy: '#88FF88', muzzleFlash: '#FFFF44',
    health: '#CC2222', shield: '#3366CC', stamina: '#44AA44',
    keyGreen: '#00CC00', keyBlue: '#0066CC', keyYellow: '#CCCC00', keyRed: '#CC0000',
    terminal: '#00FFFF', doorLocked: '#880000', explosion: '#FF8844'
};

// Visibility radius for atmospheric darkness
let visibilityRadius = 350;

// Persistent upgrade storage (survives across runs)
function saveUpgrades(upgrades) {
    try {
        localStorage.setItem('stationBreach_upgrades', JSON.stringify(upgrades));
    } catch (e) { /* localStorage not available */ }
}

function loadUpgrades() {
    try {
        const saved = localStorage.getItem('stationBreach_upgrades');
        if (saved) {
            const parsed = JSON.parse(saved);
            return { damage: parsed.damage || 0, reload: parsed.reload || 0, armor: parsed.armor || 0 };
        }
    } catch (e) { /* localStorage not available */ }
    return { damage: 0, reload: 0, armor: 0 };
}

// Weapons database
const WEAPONS = {
    pistol: { name: 'Pistol', damage: 15, fireRate: 0.25, magSize: 12, spread: 0.05, bulletSpeed: 800, ammoType: '9mm', shake: 2 },
    shotgun: { name: 'Shotgun', damage: 12, fireRate: 0.7, magSize: 8, spread: 0.3, pellets: 8, bulletSpeed: 600, ammoType: 'shells', shake: 6 },
    smg: { name: 'SMG', damage: 9, fireRate: 0.07, magSize: 40, spread: 0.1, bulletSpeed: 700, ammoType: '9mm', shake: 1 },
    rifle: { name: 'Assault Rifle', damage: 22, fireRate: 0.12, magSize: 30, spread: 0.04, bulletSpeed: 900, ammoType: 'rifle', shake: 2.5 },
    plasma: { name: 'Plasma Rifle', damage: 45, fireRate: 0.4, magSize: 20, spread: 0, bulletSpeed: 550, ammoType: 'plasma', shake: 4, color: '#44AAFF' }
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
let crates = [];        // Destructible crates (smaller than barrels)
let pillars = [];       // Vision-blocking pillars
let bloodStains = [];
let floatingTexts = [];
let map = [];
let explored = [];
let cameraX = 0, cameraY = 0;
let shakeAmount = 0, shakeDuration = 0;
let killFlash = 0;  // White flash on enemy kill
let slowMotion = 1;  // Time scale for hitlag effect
let selfDestructTimer = 0;
let selfDestructActive = false;
let deck = 1;
let maxDecks = 4;
let roomsCleared = 0;
let totalRooms = 0;
let killCount = 0;
let debugMode = false;
let exitPoint = null;       // Exit location when enemies are cleared
let exitLocked = false;     // Whether exit requires a key
let exitKeyColor = null;    // Which key is needed
let fps = 60;
let frameCount = 0;
let fpsTimer = 0;

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
        this.reloadDuration = 1.25; // Track total reload time for animation
        this.muzzleFlash = 0;
        this.invuln = 0;
        this.medkits = 0;
        // Load persisted upgrades from localStorage
        this.upgrades = loadUpgrades();
        this.dead = false;
        this.deathTimer = 0;
        this.respawnDelay = 2.0; // Time before respawning
        this.noAmmoPopupCooldown = 0; // Cooldown for "NO AMMO!" popup
        this.meleeCooldown = 0; // Cooldown for melee attack
    }

    getWeapon() { return this.weapons[this.currentWeapon]; }

    update(dt) {
        // Handle death state
        if (this.dead) {
            this.deathTimer -= dt;
            if (this.deathTimer <= 0) {
                this.respawn();
            }
            return; // No movement while dead
        }

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
        if (this.noAmmoPopupCooldown > 0) this.noAmmoPopupCooldown -= dt;
        if (this.meleeCooldown > 0) this.meleeCooldown -= dt;
    }

    shoot() {
        const weapon = this.getWeapon();
        if (weapon.ammo <= 0) {
            // Check if we have reserve ammo to reload
            if (this.ammo[weapon.ammoType] > 0) {
                this.startReload();
                return;
            }
            // No ammo at all - use melee attack
            this.meleeAttack();
            return;
        }

        const pellets = weapon.pellets || 1;
        const isPiercing = weapon.name === 'Plasma Rifle';
        for (let i = 0; i < pellets; i++) {
            const spread = (Math.random() - 0.5) * weapon.spread * 2;
            const angle = this.angle + spread;
            bullets.push({
                x: this.x + Math.cos(this.angle) * 20,
                y: this.y + Math.sin(this.angle) * 20,
                vx: Math.cos(angle) * weapon.bulletSpeed,
                vy: Math.sin(angle) * weapon.bulletSpeed,
                damage: weapon.damage * (1 + this.upgrades.damage * 0.1),
                life: isPiercing ? 1.5 : 0.8,  // Plasma travels longer
                fromPlayer: true,
                color: weapon.color,
                piercing: isPiercing
            });
        }

        weapon.ammo--;
        this.fireTimer = weapon.fireRate * (1 - this.upgrades.reload * 0.1);
        this.muzzleFlash = 0.05;
        screenShake(weapon.shake, 0.05);

        // Alert nearby enemies with gunshot sound
        alertEnemiesFromSound(this.x, this.y);

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

    meleeAttack() {
        if (this.meleeCooldown > 0) return;

        const meleeDamage = 25 * (1 + this.upgrades.damage * 0.1);
        const meleeRange = 50;
        const meleeArc = Math.PI / 3; // 60 degree arc

        // Find enemies in melee range and arc
        let hitAny = false;
        for (const enemy of enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < meleeRange) {
                // Check if enemy is in front arc
                const angleToEnemy = Math.atan2(dy, dx);
                let angleDiff = angleToEnemy - this.angle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                if (Math.abs(angleDiff) < meleeArc) {
                    enemy.takeDamage(meleeDamage, this.angle);
                    hitAny = true;
                }
            }
        }

        // Melee swing visual effect
        const swingX = this.x + Math.cos(this.angle) * 25;
        const swingY = this.y + Math.sin(this.angle) * 25;

        // Swing particles
        for (let i = 0; i < 5; i++) {
            const swingAngle = this.angle + (i - 2) * 0.3;
            particles.push({
                x: this.x + Math.cos(swingAngle) * 20,
                y: this.y + Math.sin(swingAngle) * 20,
                vx: Math.cos(swingAngle) * 150,
                vy: Math.sin(swingAngle) * 150,
                life: 0.15, maxLife: 0.15, color: '#AAAAAA', size: 4
            });
        }

        if (hitAny) {
            addFloatingText(swingX, swingY - 15, 'MELEE!', '#FFAA00');
            screenShake(2, 0.05);
        }

        this.meleeCooldown = 0.4; // Melee attack cooldown
        this.fireTimer = 0.4; // Also use fire timer to prevent instant switch to shooting
    }

    startReload() {
        const weapon = this.getWeapon();
        if (weapon.ammo >= weapon.magSize) return;
        if (this.ammo[weapon.ammoType] <= 0) {
            // Only show popup every 1 second
            if (this.noAmmoPopupCooldown <= 0) {
                addFloatingText(this.x, this.y - 20, 'NO AMMO!', COLORS.health);
                this.noAmmoPopupCooldown = 1.0; // 1 second cooldown
            }
            return;
        }
        this.reloading = true;
        this.reloadDuration = 1.25;
        this.reloadTimer = this.reloadDuration;
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
        screenShake(2.5, 0.1);

        for (let i = 0; i < 6; i++) {
            particles.push({
                x: this.x, y: this.y,
                vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200,
                life: 0.3, maxLife: 0.3, color: COLORS.health, size: 4
            });
        }

        addDamageText(this.x, this.y - 20, amount, COLORS.health);

        if (this.hp <= 0 && !this.dead) this.die();
    }

    die() {
        this.dead = true;
        this.hp = 0;
        this.deathTimer = this.respawnDelay;

        // Death particles
        for (let i = 0; i < 20; i++) {
            particles.push({
                x: this.x, y: this.y,
                vx: (Math.random() - 0.5) * 300,
                vy: (Math.random() - 0.5) * 300,
                life: 1.0, maxLife: 1.0, color: COLORS.health, size: 6
            });
        }

        screenShake(7.5, 0.3);
        addFloatingText(this.x, this.y - 30, 'DEATH!', COLORS.health, 1.5);

        this.lives--;
        if (this.lives <= 0) {
            // Delay game over by respawn delay
            setTimeout(() => {
                if (this.dead && this.lives <= 0) {
                    gameState = 'gameover';
                }
            }, this.respawnDelay * 1000);
        }
    }

    respawn() {
        if (this.lives <= 0) {
            gameState = 'gameover';
            return;
        }
        this.dead = false;
        this.hp = this.maxHp;
        this.invuln = 2.0; // Invulnerability after respawn
        addFloatingText(this.x, this.y - 30, `LIVES: ${this.lives}`, COLORS.hudYellow, 1.2);
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

        // Death state - collapsed/fallen sprite
        if (this.dead) {
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = COLORS.playerDark;
            ctx.beginPath();
            ctx.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = COLORS.health;
            ctx.beginPath();
            ctx.arc(-5, -2, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

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

        // Gun - with reload animation
        const reloadOffset = this.reloading ? Math.sin(Date.now() / 100) * 4 : 0;
        ctx.fillStyle = '#2A2A2A';
        ctx.fillRect(6, -4 + reloadOffset, 6, 8);
        ctx.fillRect(10, -3 + reloadOffset, 14, 6);
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(18, -2 + reloadOffset, 6, 4);

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

        // Draw reload progress bar above player
        if (this.reloading) {
            const progress = 1 - (this.reloadTimer / this.reloadDuration);
            const barWidth = 40;
            const barHeight = 6;
            const barX = this.x - cameraX - barWidth / 2;
            const barY = this.y - cameraY - 35;

            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

            // Progress fill
            ctx.fillStyle = COLORS.hudYellow;
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);

            // Border
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);

            // Text
            ctx.fillStyle = COLORS.hudYellow;
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('RELOAD', this.x - cameraX, barY - 4);
            ctx.textAlign = 'left';
        }
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

        // AI state
        this.alerted = false;
        this.lastKnownPlayerPos = null;
        this.alertTimer = 0; // How long to stay alerted after losing sight

        const stats = {
            drone: { hp: 22, speed: 140, damage: 12, cooldown: 0.9, range: 350, size: 24, credits: 5 },
            spitter: { hp: 35, speed: 100, damage: 18, cooldown: 1.5, range: 450, size: 28, credits: 10, preferDist: 180 },
            lurker: { hp: 45, speed: 240, damage: 22, cooldown: 0.6, range: 150, size: 26, credits: 15 },
            brute: { hp: 120, speed: 80, damage: 35, cooldown: 1.2, range: 300, size: 44, credits: 30 },
            exploder: { hp: 18, speed: 180, damage: 60, cooldown: 0, range: 400, size: 24, credits: 5, explodes: true },
            elite: { hp: 60, speed: 170, damage: 18, cooldown: 0.6, range: 450, size: 28, credits: 25 }
        };

        const s = stats[type] || stats.drone;
        this.hp = s.hp; this.maxHp = s.hp;
        this.speed = s.speed; this.damage = s.damage;
        this.attackCooldown = s.cooldown; this.detectionRange = s.range;
        this.soundRange = s.range * 1.5; // Hear sounds from 1.5x detection range
        this.width = s.size; this.height = s.size;
        this.credits = s.credits;
        this.preferredDistance = s.preferDist || 0;
        this.explodes = s.explodes || false;
    }

    // Check if enemy can see the player
    canSeePlayer() {
        if (!player) return false;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > this.detectionRange) return false;

        // Use raycasting to check line of sight
        const myTileX = Math.floor(this.x / TILE);
        const myTileY = Math.floor(this.y / TILE);
        const playerTileX = Math.floor(player.x / TILE);
        const playerTileY = Math.floor(player.y / TILE);

        return hasLineOfSight(myTileX, myTileY, playerTileX, playerTileY);
    }

    // Alert enemy from sound (called when player shoots)
    alertFromSound(soundX, soundY) {
        const dx = soundX - this.x;
        const dy = soundY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.soundRange) {
            this.alerted = true;
            this.lastKnownPlayerPos = { x: soundX, y: soundY };
            this.alertTimer = 5.0; // Stay alerted for 5 seconds
        }
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

        // Vision-based detection
        const canSee = this.canSeePlayer();
        if (canSee) {
            this.alerted = true;
            this.lastKnownPlayerPos = { x: player.x, y: player.y };
            this.alertTimer = 5.0;
        }

        // Alert timer countdown
        if (this.alertTimer > 0) {
            this.alertTimer -= dt;
            if (this.alertTimer <= 0 && !canSee) {
                this.alerted = false;
                this.lastKnownPlayerPos = null;
            }
        }

        // Only chase if alerted
        if (this.alerted && this.lastKnownPlayerPos) {
            const targetX = canSee ? player.x : this.lastKnownPlayerPos.x;
            const targetY = canSee ? player.y : this.lastKnownPlayerPos.y;

            const tdx = targetX - this.x;
            const tdy = targetY - this.y;
            const tdist = Math.sqrt(tdx * tdx + tdy * tdy);

            this.angle = Math.atan2(tdy, tdx);

            let move = true;
            if (this.preferredDistance && dist < this.preferredDistance && canSee) move = false;

            // Move toward target with smooth wall sliding
            if (move && tdist > 30) {
                const mx = (tdx / tdist) * this.speed * dt;
                const my = (tdy / tdist) * this.speed * dt;

                // Try full diagonal movement first
                const canMoveX = !isColliding(this.x + mx, this.y, this.width, this.height);
                const canMoveY = !isColliding(this.x, this.y + my, this.width, this.height);

                if (canMoveX && canMoveY) {
                    // Can move diagonally
                    this.x += mx;
                    this.y += my;
                } else if (canMoveX) {
                    // Slide along Y wall
                    this.x += mx;
                } else if (canMoveY) {
                    // Slide along X wall
                    this.y += my;
                } else {
                    // Stuck - try small offset movement to unstick
                    const offsetX = (Math.random() - 0.5) * 4;
                    const offsetY = (Math.random() - 0.5) * 4;
                    if (!isColliding(this.x + offsetX, this.y + offsetY, this.width, this.height)) {
                        this.x += offsetX;
                        this.y += offsetY;
                    }
                }
            }

            // If reached last known position and can't see player, stop being alerted
            if (!canSee && tdist < 30) {
                this.alerted = false;
                this.lastKnownPlayerPos = null;
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
        screenShake(5, 0.2);
        this.hp = 0;
    }

    takeDamage(amount, knockbackAngle) {
        const prevHp = this.hp;
        this.hp -= amount;
        this.hitFlash = 0.1;

        // Track overkill for bonus
        if (this.hp <= 0 && prevHp > 0) {
            this.overkillDamage = Math.abs(this.hp);
        }

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

        addDamageText(this.x, this.y - 20, amount, COLORS.alienBlood);

        if (this.hp <= 0) this.die();
    }

    die() {
        if (this.explodes) {
            this.explode();
        }

        // Base credits
        player.credits += this.credits;
        killCount++;

        // Overkill bonus (10% of overkill damage as credits)
        if (this.overkillDamage && this.overkillDamage > 10) {
            const bonus = Math.floor(this.overkillDamage / 10);
            player.credits += bonus;
            addFloatingText(this.x + 30, this.y - 30, `OVERKILL +$${bonus}`, '#FF6600', 1.2);
        }

        // Death particles - MORE for satisfying kills
        const particleCount = this.type === 'brute' ? 40 : (this.type === 'exploder' ? 25 : 25);
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
            const speed = 150 + Math.random() * 250;
            particles.push({
                x: this.x, y: this.y,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 0.8 + Math.random() * 0.6, maxLife: 1.4,
                color: COLORS.alienBlood, size: 4 + Math.random() * 6
            });
        }

        // Screen shake on kill - reduced for less excessive shake
        screenShake(this.type === 'brute' ? 2 : 0.75, 0.08);

        // Kill flash and hitlag for juicy kills - reduced intensity
        killFlash = this.type === 'brute' ? 0.15 : 0.05;
        slowMotion = this.type === 'brute' ? 0.5 : 0.85;

        // Blood stain - bigger
        bloodStains.push({ x: this.x, y: this.y, size: this.width * 1.5, alpha: 0.7 });
        if (bloodStains.length > 80) bloodStains.shift();

        // Drops - more generous loot
        if (Math.random() < 0.35) {
            const types = ['ammo', 'health', 'credits', 'credits'];
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

        // Eyes - more menacing with glow
        ctx.fillStyle = this.hitFlash > 0 ? '#FFF' : COLORS.alienEye;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#FF0000';
        const eyeOff = size * 0.3;
        ctx.beginPath();
        ctx.arc(Math.cos(this.angle) * eyeOff - 3, Math.sin(this.angle) * eyeOff, 3, 0, Math.PI * 2);
        ctx.arc(Math.cos(this.angle) * eyeOff + 3, Math.sin(this.angle) * eyeOff, 3, 0, Math.PI * 2);
        ctx.fill();
        // Inner eye glow
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.arc(Math.cos(this.angle) * eyeOff - 3, Math.sin(this.angle) * eyeOff, 1.5, 0, Math.PI * 2);
        ctx.arc(Math.cos(this.angle) * eyeOff + 3, Math.sin(this.angle) * eyeOff, 1.5, 0, Math.PI * 2);
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

        // Facing direction indicator - small arrow showing which way enemy is looking
        const indicatorDist = size + 12;
        const arrowLen = 8;
        const arrowWidth = 4;
        const dirX = Math.cos(this.angle);
        const dirY = Math.sin(this.angle);
        const tipX = dirX * indicatorDist;
        const tipY = dirY * indicatorDist;

        // Arrow color based on alert state
        if (this.alerted) {
            ctx.fillStyle = '#FF4444'; // Red when alerted
            ctx.strokeStyle = '#FF0000';
        } else {
            ctx.fillStyle = '#FFFF00'; // Yellow when idle
            ctx.strokeStyle = '#AAAA00';
        }

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - dirX * arrowLen - dirY * arrowWidth, tipY - dirY * arrowLen + dirX * arrowWidth);
        ctx.lineTo(tipX - dirX * arrowLen + dirY * arrowWidth, tipY - dirY * arrowLen - dirX * arrowWidth);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    isInVisibleArea() {
        if (!player) return true;
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Enemy is visible if within visibility radius AND has line of sight
        if (dist > visibilityRadius + 50) return false;

        // Use raycasting to check if enemy is actually visible
        const playerTileX = Math.floor(player.x / TILE);
        const playerTileY = Math.floor(player.y / TILE);
        const enemyTileX = Math.floor(this.x / TILE);
        const enemyTileY = Math.floor(this.y / TILE);

        return hasLineOfSight(playerTileX, playerTileY, enemyTileX, enemyTileY);
    }
}

// Raycasting visibility - hasLineOfSight (needs to be before Enemy class usage)
function hasLineOfSight(x1, y1, x2, y2) {
    // Bresenham's line algorithm to check for blocking tiles
    const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
    let err = dx - dy, x = x1, y = y1;

    while (x !== x2 || y !== y2) {
        // Skip the starting point
        if (x !== x1 || y !== y1) {
            // Check if tile blocks vision
            const tile = map[y]?.[x];
            if (tile === 2 || tile === 0) return false; // Wall or void blocks vision

            // Check if closed door blocks vision
            for (const door of doors) {
                if (!door.open && door.x === x && door.y === y) return false;
            }
        }

        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
    }
    return true;
}

// Helper functions
function addFloatingText(x, y, text, color, scale = 1) {
    floatingTexts.push({ x, y, text, color, life: 1.2, vy: -80, scale: scale, startLife: 1.2 });
}

function addDamageText(x, y, amount, color) {
    // Bigger numbers for bigger damage
    const scale = Math.min(2, 1 + amount / 30);
    floatingTexts.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        text: `-${Math.floor(amount)}`,
        color: color,
        life: 1.0,
        vy: -100 - Math.random() * 50,
        scale: scale,
        startLife: 1.0
    });
}

function screenShake(amount, duration) {
    shakeAmount = Math.max(shakeAmount, amount);
    shakeDuration = Math.max(shakeDuration, duration);
}

// Alert enemies from sound (gunfire, explosions)
function alertEnemiesFromSound(soundX, soundY) {
    for (const enemy of enemies) {
        enemy.alertFromSound(soundX, soundY);
    }
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

    // Pillar collision (vision blockers)
    for (const pillar of pillars) {
        if (Math.abs(x - pillar.x) < w/2 + 14 &&
            Math.abs(y - pillar.y) < h/2 + 14) {
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
    crates = [];
    pillars = [];
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

    // Connect rooms and place doors
    const doorPositions = [];
    for (let i = 1; i < rooms.length; i++) {
        const r1 = rooms[i - 1];
        const r2 = rooms[i];
        const x1 = Math.floor(r1.x + r1.w / 2);
        const y1 = Math.floor(r1.y + r1.h / 2);
        const x2 = Math.floor(r2.x + r2.w / 2);
        const y2 = Math.floor(r2.y + r2.h / 2);

        // Carve corridors and track potential door positions
        const corridor1End = carveCorridor(x1, y1, x2, y1, true);
        const corridor2End = carveCorridor(x2, y1, x2, y2, true);

        // Add door at corridor entrance (95% chance - most rooms have doors)
        if (Math.random() < 0.95) {
            doorPositions.push({
                x: corridor1End.doorX,
                y: corridor1End.doorY,
                horizontal: y1 === y2
            });
        }
    }

    // Place doors with keycard requirements
    const keyColors = ['green', 'blue', 'yellow', 'red'];
    const requiredKeys = Math.min(deck, 3); // 1-3 keys needed based on deck

    for (let i = 0; i < doorPositions.length; i++) {
        const pos = doorPositions[i];
        const requiresKey = i < requiredKeys; // First few doors require keys
        const keyColor = requiresKey ? keyColors[i % keyColors.length] : null;

        doors.push({
            x: pos.x,
            y: pos.y,
            open: false,
            requiresKey: requiresKey,
            keyColor: keyColor,
            horizontal: pos.horizontal
        });

        // Spawn the keycard for locked doors in earlier rooms
        if (requiresKey && i > 0) {
            const keyRoom = rooms[Math.max(1, i - 1)]; // Place key in previous room
            pickups.push({
                x: keyRoom.x * TILE + keyRoom.w * TILE / 2 + (Math.random() - 0.5) * 40,
                y: keyRoom.y * TILE + keyRoom.h * TILE / 2 + (Math.random() - 0.5) * 40,
                type: 'key',
                keyColor: keyColor
            });
        }
    }

    // Spawn player in first room (rooms[0] is always empty - safe start zone)
    const startRoom = rooms[0];
    player = new Player(
        startRoom.x * TILE + startRoom.w * TILE / 2,
        startRoom.y * TILE + startRoom.h * TILE / 2
    );

    // Spawn enemies in other rooms (starting from i=1, so room 0 stays empty)
    // Difficulty scales with deck: more enemies, tougher types
    const baseEnemyCount = 2 + deck; // Deck 1: 3-6, Deck 2: 4-7, etc.
    const enemyVariance = 3 + Math.floor(deck / 2);
    const difficultyMult = 1 + (deck - 1) * 0.15; // 15% harder per deck

    for (let i = 1; i < rooms.length; i++) {
        const room = rooms[i];
        const enemyCount = baseEnemyCount + Math.floor(Math.random() * enemyVariance);
        // Enemy pool shifts toward tougher types on higher decks
        const types = deck === 1
            ? ['drone', 'drone', 'drone', 'spitter', 'lurker']
            : deck === 2
            ? ['drone', 'drone', 'spitter', 'spitter', 'lurker', 'brute']
            : deck === 3
            ? ['drone', 'spitter', 'lurker', 'brute', 'exploder', 'elite']
            : ['spitter', 'lurker', 'brute', 'brute', 'exploder', 'elite', 'elite'];

        for (let j = 0; j < enemyCount; j++) {
            const ex = room.x * TILE + Math.random() * room.w * TILE;
            const ey = room.y * TILE + Math.random() * room.h * TILE;
            const type = types[Math.floor(Math.random() * types.length)];
            const enemy = new Enemy(ex, ey, type);
            // Scale enemy stats with deck
            enemy.hp = Math.floor(enemy.hp * difficultyMult);
            enemy.maxHp = enemy.hp;
            enemy.damage = Math.floor(enemy.damage * difficultyMult);
            enemies.push(enemy);
        }

        // Add stations in various rooms
        // Heal station in early rooms, upgrade station in mid rooms, ammo station later
        if (i === 2 || (i > 2 && Math.random() < 0.2)) {
            const stationTypes = ['heal', 'heal', 'upgrade', 'ammo'];
            terminals.push({
                x: room.x + Math.floor(room.w / 2),
                y: room.y + Math.floor(room.h / 2),
                used: false,
                type: stationTypes[Math.floor(Math.random() * stationTypes.length)]
            });
        } else if (i === Math.floor(rooms.length / 2)) {
            // Guaranteed upgrade station in middle room
            terminals.push({
                x: room.x + Math.floor(room.w / 2),
                y: room.y + Math.floor(room.h / 2),
                used: false,
                type: 'upgrade'
            });
        }

        // Add destructibles and vision blockers for room variety
        // Barrels (explosive)
        if (Math.random() < 0.35) {
            barrels.push({
                x: room.x * TILE + 24 + Math.random() * (room.w * TILE - 48),
                y: room.y * TILE + 24 + Math.random() * (room.h * TILE - 48),
                hp: 20
            });
        }

        // Crates (destructible, smaller)
        const crateCount = Math.floor(Math.random() * 3);
        for (let c = 0; c < crateCount; c++) {
            crates.push({
                x: room.x * TILE + 20 + Math.random() * (room.w * TILE - 40),
                y: room.y * TILE + 20 + Math.random() * (room.h * TILE - 40),
                hp: 15,
                type: Math.random() < 0.3 ? 'ammo' : (Math.random() < 0.5 ? 'health' : 'credits') // Contains loot
            });
        }

        // Pillars (vision blockers, indestructible)
        if (room.w >= 6 && room.h >= 6 && Math.random() < 0.5) {
            // Add 1-2 pillars in larger rooms
            const pillarCount = Math.random() < 0.5 ? 1 : 2;
            for (let p = 0; p < pillarCount; p++) {
                pillars.push({
                    x: room.x * TILE + TILE * 2 + Math.random() * (room.w * TILE - TILE * 4),
                    y: room.y * TILE + TILE * 2 + Math.random() * (room.h * TILE - TILE * 4)
                });
            }
        }

        // Pickups in room corners and edges
        if (Math.random() < 0.5) {
            const types = ['ammo', 'health', 'credits'];
            const cornerX = Math.random() < 0.5 ? room.x * TILE + 20 : (room.x + room.w) * TILE - 20;
            const cornerY = Math.random() < 0.5 ? room.y * TILE + 20 : (room.y + room.h) * TILE - 20;
            pickups.push({
                x: cornerX,
                y: cornerY,
                type: types[Math.floor(Math.random() * types.length)]
            });
        }
    }

    // Add pickup in some rooms (main pickups)
    for (let i = 1; i < rooms.length; i++) {
        if (Math.random() < 0.5) {
            const room = rooms[i];
            const types = ['ammo', 'health', 'shield', 'medkit', 'weapon', 'credits'];
            pickups.push({
                x: room.x * TILE + room.w * TILE / 2 + (Math.random() - 0.5) * 40,
                y: room.y * TILE + room.h * TILE / 2 + (Math.random() - 0.5) * 40,
                type: types[Math.floor(Math.random() * types.length)]
            });
        }
    }

    totalRooms = rooms.length;
    roomsCleared = 1;

    // Reset exit state
    exitPoint = null;
    exitLocked = false;
    exitKeyColor = null;
}

function carveCorridor(x1, y1, x2, y2, trackDoorPosition = false) {
    const dx = x2 > x1 ? 1 : x2 < x1 ? -1 : 0;
    const dy = y2 > y1 ? 1 : y2 < y1 ? -1 : 0;
    let x = x1, y = y1;
    let doorX = x1, doorY = y1;
    let stepCount = 0;

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

        // Track midpoint for door placement
        stepCount++;
        if (stepCount === 3) {
            doorX = x;
            doorY = y;
        }

        if (x !== x2) x += dx;
        else if (y !== y2) y += dy;
    }

    return { doorX, doorY };
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
            const seed = (x * 7919 + y * 6271) % 100;

            if (tile === 0) {
                ctx.fillStyle = COLORS.void;
                ctx.fillRect(screenX, screenY, TILE, TILE);
            } else if (tile === 1) {
                // Metal floor base - darker Alien Breed style
                ctx.fillStyle = '#2A2A2E';
                ctx.fillRect(screenX, screenY, TILE, TILE);

                // Metal grating pattern - more visible
                ctx.fillStyle = '#1E1E22';
                // Horizontal lines
                for (let i = 0; i < 4; i++) {
                    ctx.fillRect(screenX, screenY + i * 8, TILE, 2);
                }
                // Vertical lines
                for (let i = 0; i < 4; i++) {
                    ctx.fillRect(screenX + i * 8, screenY, 2, TILE);
                }

                // Highlight corners for depth
                ctx.fillStyle = '#3A3A3E';
                ctx.fillRect(screenX, screenY, TILE, 2);
                ctx.fillRect(screenX, screenY, 2, TILE);

                // Rivets at corners - more prominent
                ctx.fillStyle = '#4A4A50';
                ctx.fillRect(screenX + 2, screenY + 2, 3, 3);
                ctx.fillRect(screenX + 27, screenY + 2, 3, 3);
                ctx.fillRect(screenX + 2, screenY + 27, 3, 3);
                ctx.fillRect(screenX + 27, screenY + 27, 3, 3);

                // Random floor variation
                if (seed < 15) {
                    // Rust stain
                    ctx.fillStyle = 'rgba(60, 40, 20, 0.4)';
                    ctx.fillRect(screenX + 6, screenY + 6, 20, 20);
                } else if (seed < 30) {
                    // Oil stain - larger
                    ctx.fillStyle = 'rgba(15, 15, 20, 0.5)';
                    ctx.beginPath();
                    ctx.arc(screenX + 16, screenY + 16, 12, 0, Math.PI * 2);
                    ctx.fill();
                } else if (seed < 40) {
                    // Blood splatter (alien green)
                    ctx.fillStyle = 'rgba(0, 100, 60, 0.3)';
                    ctx.beginPath();
                    ctx.arc(screenX + 16 + (seed % 8) - 4, screenY + 16 + (seed % 6) - 3, 8, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (tile === 2) {
                // Wall base - darker metallic look
                ctx.fillStyle = '#3A3A3C';
                ctx.fillRect(screenX, screenY, TILE, TILE);

                // 3D depth effect - more pronounced
                ctx.fillStyle = '#5A5A5C';
                ctx.fillRect(screenX, screenY, TILE, 3);
                ctx.fillRect(screenX, screenY, 3, TILE);
                ctx.fillStyle = '#1A1A1C';
                ctx.fillRect(screenX + TILE - 3, screenY, 3, TILE);
                ctx.fillRect(screenX, screenY + TILE - 3, TILE, 3);

                // Panel lines - more visible
                ctx.fillStyle = '#2A2A2C';
                ctx.fillRect(screenX + 8, screenY + 3, 2, TILE - 6);
                ctx.fillRect(screenX + TILE - 10, screenY + 3, 2, TILE - 6);
                ctx.fillRect(screenX + 3, screenY + 10, TILE - 6, 2);

                // Hazard stripes on certain walls
                if ((x + y * 3) % 7 === 0) {
                    ctx.fillStyle = '#FF8800';
                    for (let i = 0; i < 6; i++) {
                        const stripeX = screenX + i * 6 - 2;
                        ctx.beginPath();
                        ctx.moveTo(stripeX, screenY + 10);
                        ctx.lineTo(stripeX + 4, screenY + 10);
                        ctx.lineTo(stripeX + 8, screenY + 22);
                        ctx.lineTo(stripeX + 4, screenY + 22);
                        ctx.closePath();
                        ctx.fill();
                    }
                }

                // Panel indicator lights
                if ((x + y) % 4 === 0) {
                    ctx.fillStyle = COLORS.hudYellow;
                    ctx.shadowBlur = 3;
                    ctx.shadowColor = COLORS.hudYellow;
                    ctx.fillRect(screenX + 14, screenY + 12, 4, 8);
                    ctx.shadowBlur = 0;
                } else if ((x + y) % 5 === 0) {
                    // Red warning light
                    ctx.fillStyle = '#CC0000';
                    ctx.shadowBlur = 3;
                    ctx.shadowColor = '#FF0000';
                    ctx.fillRect(screenX + 14, screenY + 12, 4, 8);
                    ctx.shadowBlur = 0;
                }

                // Vent grating on some walls
                if (seed < 10) {
                    ctx.fillStyle = '#1A1A1A';
                    ctx.fillRect(screenX + 6, screenY + 6, 20, 20);
                    ctx.fillStyle = '#3A3A3A';
                    for (let i = 0; i < 4; i++) {
                        ctx.fillRect(screenX + 8, screenY + 8 + i * 5, 16, 2);
                    }
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

function drawCrates() {
    crates.forEach(c => {
        ctx.save();
        ctx.translate(c.x - cameraX, c.y - cameraY);

        // Crate base - wooden/metallic color
        ctx.fillStyle = '#5A4A3A';
        ctx.fillRect(-12, -12, 24, 24);

        // Crate detail - planks
        ctx.fillStyle = '#4A3A2A';
        ctx.fillRect(-12, -4, 24, 2);
        ctx.fillRect(-12, 4, 24, 2);
        ctx.fillRect(-4, -12, 2, 24);
        ctx.fillRect(4, -12, 2, 24);

        // Crate highlight
        ctx.fillStyle = '#6A5A4A';
        ctx.fillRect(-12, -12, 24, 2);
        ctx.fillRect(-12, -12, 2, 24);

        // Loot indicator glow
        const glowColor = c.type === 'ammo' ? COLORS.hudYellow :
                          c.type === 'health' ? COLORS.health : COLORS.hudYellow;
        ctx.fillStyle = glowColor;
        ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 300) * 0.2;
        ctx.fillRect(-6, -6, 12, 12);
        ctx.globalAlpha = 1;

        ctx.restore();
    });
}

function drawPillars() {
    pillars.forEach(p => {
        ctx.save();
        ctx.translate(p.x - cameraX, p.y - cameraY);

        // Pillar shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(-12, 4, 28, 12);

        // Pillar base
        ctx.fillStyle = '#4A4A4C';
        ctx.fillRect(-14, -14, 28, 28);

        // Pillar face
        ctx.fillStyle = '#5A5A5C';
        ctx.fillRect(-12, -12, 24, 24);

        // Pillar highlight
        ctx.fillStyle = '#6A6A6C';
        ctx.fillRect(-12, -12, 24, 3);
        ctx.fillRect(-12, -12, 3, 24);

        // Pillar detail - industrial rivets
        ctx.fillStyle = '#3A3A3C';
        ctx.fillRect(-8, -8, 4, 4);
        ctx.fillRect(4, -8, 4, 4);
        ctx.fillRect(-8, 4, 4, 4);
        ctx.fillRect(4, 4, 4, 4);

        ctx.restore();
    });
}

function drawTerminals() {
    // Station type colors and labels
    const stationConfig = {
        heal: { color: COLORS.stamina, label: 'HEAL', cost: 25, icon: '+' },
        upgrade: { color: COLORS.hudYellow, label: 'UPGRADE', cost: 100, icon: '^' },
        ammo: { color: '#FFAA00', label: 'AMMO', cost: 15, icon: 'A' }
    };

    terminals.forEach(t => {
        const screenX = t.x * TILE - cameraX;
        const screenY = t.y * TILE - cameraY;
        const config = stationConfig[t.type] || stationConfig.upgrade;

        ctx.fillStyle = '#2A2A2A';
        ctx.fillRect(screenX + 4, screenY + 4, TILE - 8, TILE - 8);
        ctx.fillStyle = t.used ? '#1A1A1A' : config.color;
        ctx.fillRect(screenX + 6, screenY + 6, TILE - 12, TILE - 16);

        if (!t.used) {
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(config.icon, screenX + TILE/2, screenY + 18);
            ctx.textAlign = 'left';

            // Show station type label
            ctx.fillStyle = config.color;
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(config.label, screenX + TILE/2, screenY + TILE + 8);
            ctx.textAlign = 'left';

            // Show [E] prompt and cost when player is near
            if (player) {
                const dx = player.x - (t.x * TILE + TILE/2);
                const dy = player.y - (t.y * TILE + TILE/2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 50) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '10px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(`[E] ${config.label} ($${config.cost})`, screenX + TILE/2, screenY - 10);
                    ctx.textAlign = 'left';
                }
            }
        }
    });
}

function drawDoors() {
    doors.forEach(door => {
        if (door.open) return; // Don't draw open doors

        const screenX = door.x * TILE - cameraX;
        const screenY = door.y * TILE - cameraY;

        // Door frame
        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(screenX - 4, screenY - 4, TILE + 8, TILE + 8);

        // Door panel
        const doorColor = door.requiresKey ?
            (COLORS[`key${door.keyColor.charAt(0).toUpperCase() + door.keyColor.slice(1)}`] || '#880000') :
            '#666666';

        ctx.fillStyle = doorColor;
        ctx.fillRect(screenX, screenY, TILE, TILE);

        // Door details
        ctx.fillStyle = '#2A2A2A';
        ctx.fillRect(screenX + TILE/2 - 2, screenY + 4, 4, TILE - 8);

        // Lock indicator for locked doors
        if (door.requiresKey) {
            ctx.fillStyle = '#1A1A1A';
            ctx.beginPath();
            ctx.arc(screenX + TILE/2, screenY + TILE/2, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = doorColor;
            ctx.fillRect(screenX + TILE/2 - 4, screenY + TILE/2 - 2, 8, 6);

            // Keyhole
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(screenX + TILE/2, screenY + TILE/2 - 2, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(screenX + TILE/2 - 1, screenY + TILE/2 - 1, 2, 5);
        }

        // "PRESS SPACE" prompt if player is near
        if (player) {
            const dx = player.x - (door.x * TILE + TILE/2);
            const dy = player.y - (door.y * TILE + TILE/2);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 60) {
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                if (door.requiresKey && !player.keys[door.keyColor]) {
                    ctx.fillStyle = doorColor;
                    ctx.fillText(`[${door.keyColor.toUpperCase()} KEY]`, screenX + TILE/2, screenY - 10);
                } else {
                    ctx.fillText('[E] OPEN', screenX + TILE/2, screenY - 10);
                }
                ctx.textAlign = 'left';
            }
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
            case 'key':
                const keyColor = COLORS[`key${p.keyColor.charAt(0).toUpperCase() + p.keyColor.slice(1)}`] || COLORS.keyGreen;
                ctx.shadowColor = keyColor;
                ctx.fillStyle = keyColor;
                // Key shape
                ctx.fillRect(-4, -10, 8, 14);
                ctx.fillRect(-8, 2, 16, 6);
                ctx.fillStyle = '#1A1A1A';
                ctx.fillRect(-2, -6, 4, 8);
                break;
        }

        ctx.restore();
    });
}

function drawExit() {
    if (!exitPoint) return;

    ctx.save();
    ctx.translate(exitPoint.x - cameraX, exitPoint.y - cameraY);

    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;

    // Exit platform
    ctx.fillStyle = exitLocked ? `rgba(136, 0, 0, ${pulse})` : `rgba(0, 200, 100, ${pulse})`;
    ctx.shadowBlur = 20;
    ctx.shadowColor = exitLocked ? COLORS.doorLocked : COLORS.stamina;

    // Draw exit circle
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();

    // Inner ring
    ctx.strokeStyle = exitLocked ? '#FF4444' : '#44FF88';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.stroke();

    // Arrow or lock symbol
    ctx.fillStyle = '#FFFFFF';
    if (exitLocked && exitKeyColor && !player.keys[exitKeyColor]) {
        // Lock symbol
        ctx.fillRect(-5, -3, 10, 8);
        ctx.beginPath();
        ctx.arc(0, -5, 6, Math.PI, 0, false);
        ctx.stroke();
    } else {
        // Up arrow
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(8, 0);
        ctx.lineTo(3, 0);
        ctx.lineTo(3, 10);
        ctx.lineTo(-3, 10);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-8, 0);
        ctx.closePath();
        ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();

    // Label
    ctx.fillStyle = exitLocked ? COLORS.doorLocked : COLORS.stamina;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(exitLocked ? 'LOCKED EXIT' : 'EXIT', exitPoint.x - cameraX, exitPoint.y - cameraY - 45);

    // Show [E] prompt when player is near and exit is unlocked
    if (player && !exitLocked) {
        const dx = player.x - exitPoint.x;
        const dy = player.y - exitPoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 60) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '10px monospace';
            ctx.fillText('[E] ESCAPE', exitPoint.x - cameraX, exitPoint.y - cameraY - 60);
        }
    }
    ctx.textAlign = 'left';
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
        ctx.save();
        const scale = ft.scale || 1;
        const alpha = ft.startLife ? (ft.life / ft.startLife) : ft.life;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ft.color;

        // Scale effect - bigger numbers pop more
        const fontSize = Math.floor(14 * scale);
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textAlign = 'center';

        // Slight outline for readability
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(ft.text, ft.x - cameraX, ft.y - cameraY);
        ctx.fillText(ft.text, ft.x - cameraX, ft.y - cameraY);

        ctx.restore();
    });
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

    // Dead indicator
    if (player.dead) {
        ctx.fillStyle = COLORS.health;
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        if (player.lives > 0) {
            ctx.fillText('RESPAWNING...', canvas.width / 2, canvas.height / 2);
            ctx.font = '16px monospace';
            ctx.fillText(`${Math.ceil(player.deathTimer)}s`, canvas.width / 2, canvas.height / 2 + 30);
        } else {
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        }
        ctx.textAlign = 'left';
    }

    // Low HP warning - dramatic vignette effect
    if (player.hp < 30) {
        const pulse = Math.sin(Date.now() / 100) * 0.15 + 0.15;
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 100,
            canvas.width / 2, canvas.height / 2, canvas.width / 1.5
        );
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        gradient.addColorStop(0.5, `rgba(255, 0, 0, ${pulse * 0.3})`);
        gradient.addColorStop(1, `rgba(200, 0, 0, ${pulse})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Heartbeat text
        if (Math.sin(Date.now() / 200) > 0.7) {
            ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('! LOW HEALTH !', canvas.width / 2, 90);
            ctx.textAlign = 'left';
        }
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

    // Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (!enemies[i].update(dt)) enemies.splice(i, 1);
    }

    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];

        // Auto-aim assist for player bullets (gentle homing)
        if (b.fromPlayer && enemies.length > 0) {
            let nearest = null;
            let nearestDist = 150;  // Max homing range
            for (const e of enemies) {
                const dx = e.x - b.x, dy = e.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = e;
                }
            }
            if (nearest) {
                const targetAngle = Math.atan2(nearest.y - b.y, nearest.x - b.x);
                const bulletAngle = Math.atan2(b.vy, b.vx);
                let angleDiff = targetAngle - bulletAngle;
                // Normalize angle diff
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                // Only curve if within 45 degrees
                if (Math.abs(angleDiff) < Math.PI / 4) {
                    const homeStrength = 2.5 * dt;  // Subtle homing
                    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                    const newAngle = bulletAngle + angleDiff * homeStrength;
                    b.vx = Math.cos(newAngle) * speed;
                    b.vy = Math.sin(newAngle) * speed;
                }
            }
        }

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
            let hitEnemy = false;
            for (let e of enemies) {
                const dx = b.x - e.x, dy = b.y - e.y;
                if (Math.sqrt(dx * dx + dy * dy) < e.width / 2 + 4) {
                    // Critical hit chance (15%)
                    const isCrit = Math.random() < 0.15;
                    const finalDamage = isCrit ? b.damage * 2 : b.damage;

                    if (isCrit) {
                        addFloatingText(e.x, e.y - 40, 'CRITICAL!', '#FF4400', 1.5);
                        screenShake(4, 0.1);
                    }

                    e.takeDamage(finalDamage, Math.atan2(b.vy, b.vx));
                    hitEnemy = true;

                    // Piercing plasma goes through enemies
                    if (!b.piercing) {
                        bullets.splice(i, 1);
                    }
                    break;
                }
            }
            if (hitEnemy && b.piercing) continue;
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
                        screenShake(6, 0.2);
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

            // Hit crates
            for (let j = crates.length - 1; j >= 0; j--) {
                const crate = crates[j];
                const dx = b.x - crate.x, dy = b.y - crate.y;
                if (Math.sqrt(dx * dx + dy * dy) < 15) {
                    crate.hp -= b.damage;
                    if (crate.hp <= 0) {
                        // Destroy crate - spawn particles
                        for (let k = 0; k < 10; k++) {
                            particles.push({
                                x: crate.x, y: crate.y,
                                vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200,
                                life: 0.4, maxLife: 0.4, color: '#6A5A4A', size: 5
                            });
                        }
                        // Drop loot from crate
                        pickups.push({
                            x: crate.x,
                            y: crate.y,
                            type: crate.type
                        });
                        addFloatingText(crate.x, crate.y - 20, 'LOOT!', COLORS.hudYellow);
                        crates.splice(j, 1);
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
                    if (player.hp < player.maxHp) {
                        player.hp = Math.min(player.maxHp, player.hp + 25);
                        addFloatingText(player.x, player.y - 30, '+25 HP', COLORS.stamina);
                        take = true;
                    }
                    break;
                case 'ammo':
                    player.ammo['9mm'] += 30;
                    addFloatingText(player.x, player.y - 30, '+30 AMMO', COLORS.hudYellow);
                    take = true;
                    break;
                case 'shield':
                    if (player.shield < player.maxShield) {
                        player.shield = Math.min(player.maxShield, player.shield + 25);
                        addFloatingText(player.x, player.y - 30, '+25 SHIELD', '#00AAFF');
                        take = true;
                    }
                    break;
                case 'medkit':
                    player.medkits++;
                    addFloatingText(player.x, player.y - 30, '+1 MEDKIT', COLORS.stamina);
                    take = true;
                    break;
                case 'credits':
                    player.credits += 25;
                    addFloatingText(player.x, player.y - 30, '+$25', COLORS.hudYellow);
                    take = true;
                    break;
                case 'weapon':
                    const weaponKeys = Object.keys(WEAPONS).filter(w => w !== 'pistol');
                    const newWeapon = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
                    player.weapons.push({ ...WEAPONS[newWeapon], ammo: WEAPONS[newWeapon].magSize });
                    addFloatingText(player.x, player.y - 30, `Got ${WEAPONS[newWeapon].name}!`, COLORS.hudYellow);
                    take = true;
                    break;
                case 'key':
                    player.keys[p.keyColor] = true;
                    addFloatingText(player.x, player.y - 30, `${p.keyColor.toUpperCase()} KEY!`, COLORS[`key${p.keyColor.charAt(0).toUpperCase() + p.keyColor.slice(1)}`]);
                    take = true;
                    break;
            }
            if (take) pickups.splice(i, 1);
        }
    }

    // Station interaction (heal, upgrade, ammo stations)
    if (keys['e']) {
        for (const t of terminals) {
            const dx = player.x - (t.x * TILE + TILE/2), dy = player.y - (t.y * TILE + TILE/2);
            if (Math.sqrt(dx * dx + dy * dy) < 40 && !t.used) {
                const stationType = t.type || 'upgrade';
                const costs = { heal: 25, upgrade: 100, ammo: 15 };
                const cost = costs[stationType];

                if (player.credits >= cost) {
                    player.credits -= cost;
                    t.used = true;

                    switch (stationType) {
                        case 'heal':
                            const healAmount = 50;
                            player.hp = Math.min(player.maxHp, player.hp + healAmount);
                            addFloatingText(t.x * TILE, t.y * TILE, `+${healAmount} HP`, COLORS.stamina);
                            break;
                        case 'ammo':
                            player.ammo['9mm'] += 60;
                            addFloatingText(t.x * TILE, t.y * TILE, '+60 AMMO', '#FFAA00');
                            break;
                        case 'upgrade':
                            // Randomly upgrade one stat
                            const statTypes = ['damage', 'reload', 'armor'];
                            const stat = statTypes[Math.floor(Math.random() * statTypes.length)];
                            player.upgrades[stat]++;
                            saveUpgrades(player.upgrades); // Persist upgrades
                            const statNames = { damage: 'DAMAGE', reload: 'RELOAD', armor: 'ARMOR' };
                            addFloatingText(t.x * TILE, t.y * TILE, `${statNames[stat]} UP!`, COLORS.hudYellow);
                            break;
                    }
                    screenShake(0.5, 0.1);
                } else {
                    addFloatingText(t.x * TILE, t.y * TILE, `NEED $${cost}`, COLORS.health);
                }
            }
        }
        keys['e'] = false;
    }

    // Door interaction (E key - same as other interactions)
    if (keys['e']) {
        for (const door of doors) {
            if (door.open) continue;

            const dx = player.x - (door.x * TILE + TILE/2);
            const dy = player.y - (door.y * TILE + TILE/2);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 60) {
                if (door.requiresKey && door.keyColor) {
                    if (player.keys[door.keyColor]) {
                        // Has key, open door
                        door.open = true;
                        addFloatingText(door.x * TILE, door.y * TILE, 'DOOR OPENED!', COLORS.stamina);
                        screenShake(1, 0.1);
                    } else {
                        // Missing key
                        addFloatingText(door.x * TILE, door.y * TILE - 20, `NEED ${door.keyColor.toUpperCase()} KEY!`, COLORS.doorLocked);
                    }
                } else {
                    // Regular door, open it
                    door.open = true;
                    addFloatingText(door.x * TILE, door.y * TILE, 'DOOR OPENED!', COLORS.hudText);
                }
                keys['e'] = false;
                break; // Only interact with one door at a time
            }
        }
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

    // Spawn exit when all enemies cleared
    if (enemies.length === 0 && !exitPoint) {
        spawnExit();
    }

    // Check if player reaches exit (E to interact)
    if (exitPoint && !player.dead && keys['e']) {
        const dx = player.x - exitPoint.x;
        const dy = player.y - exitPoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 60) {
            // Check if locked
            if (exitLocked && exitKeyColor && !player.keys[exitKeyColor]) {
                addFloatingText(player.x, player.y - 30, `NEED ${exitKeyColor.toUpperCase()} KEY!`, COLORS.doorLocked);
            } else {
                // Advance to next level
                if (deck < maxDecks) {
                    deck++;
                    generateLevel();
                    addFloatingText(player.x, player.y - 30, `DECK ${deck}`, COLORS.hudYellow);
                } else {
                    gameState = 'win';
                }
            }
            keys['e'] = false;
        }
    }
}

function spawnExit() {
    // Find a far point from the player to place the exit
    let bestX = player.x + 300;
    let bestY = player.y + 300;
    let bestDist = 0;

    // Search for a valid floor tile far from the player
    for (let attempts = 0; attempts < 50; attempts++) {
        const tx = Math.floor(Math.random() * (MAP_W - 4)) + 2;
        const ty = Math.floor(Math.random() * (MAP_H - 4)) + 2;

        if (map[ty] && map[ty][tx] === 1) { // Floor tile
            const px = tx * TILE + TILE / 2;
            const py = ty * TILE + TILE / 2;
            const dx = px - player.x;
            const dy = py - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > bestDist && dist > 200) {
                bestDist = dist;
                bestX = px;
                bestY = py;
            }
        }
    }

    exitPoint = { x: bestX, y: bestY };

    // Exit keycard progression system:
    // Deck 1: Exit unlocked (tutorial, easy start)
    // Deck 2+: Exit always locked, requiring a keycard
    if (deck >= 2) {
        exitLocked = true;
        const keyColors = ['green', 'blue', 'yellow', 'red'];
        // Key color based on deck (green -> blue -> yellow -> red)
        exitKeyColor = keyColors[Math.min(deck - 2, keyColors.length - 1)];

        // Place key in a cleared room (far from exit, near player)
        const keyX = player.x + (Math.random() - 0.5) * 300;
        const keyY = player.y + (Math.random() - 0.5) * 300;
        pickups.push({ x: keyX, y: keyY, type: 'key', keyColor: exitKeyColor });

        addFloatingText(player.x, player.y - 30, 'AREA CLEARED!', COLORS.hudYellow);
        addFloatingText(player.x, player.y - 50, `FIND ${exitKeyColor.toUpperCase()} KEY TO ESCAPE`, COLORS.doorLocked);
    } else {
        // Deck 1: Unlocked exit
        addFloatingText(player.x, player.y - 30, 'AREA CLEARED! REACH THE EXIT!', COLORS.stamina);
    }

    screenShake(1.5, 0.2);
}

// Game loop
let lastTime = 0;
// Atmospheric darkness overlay - Alien Breed style limited visibility
// Check if a world position is visible to the player (pixel coords)
function isPositionVisible(worldX, worldY) {
    if (!player) return false;

    const dx = worldX - player.x;
    const dy = worldY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Outside visibility radius
    if (dist > visibilityRadius) return false;

    // Convert to tile coords for raycasting
    const playerTileX = Math.floor(player.x / TILE);
    const playerTileY = Math.floor(player.y / TILE);
    const targetTileX = Math.floor(worldX / TILE);
    const targetTileY = Math.floor(worldY / TILE);

    // Same tile is always visible
    if (playerTileX === targetTileX && playerTileY === targetTileY) return true;

    // Check pillars blocking vision
    for (const pillar of pillars) {
        // Check if pillar is between player and target
        const pillarTileX = Math.floor(pillar.x / TILE);
        const pillarTileY = Math.floor(pillar.y / TILE);

        // Simple check: pillar on the line blocks vision
        const t1 = (pillar.x - player.x) / (worldX - player.x);
        const t2 = (pillar.y - player.y) / (worldY - player.y);

        if (t1 > 0.1 && t1 < 0.9 && t2 > 0.1 && t2 < 0.9) {
            const lineX = player.x + t1 * (worldX - player.x);
            const lineY = player.y + t1 * (worldY - player.y);
            const pillarDist = Math.sqrt((pillar.x - lineX) ** 2 + (pillar.y - lineY) ** 2);
            if (pillarDist < 20) return false;
        }
    }

    return hasLineOfSight(playerTileX, playerTileY, targetTileX, targetTileY);
}

function drawDarknessOverlay() {
    if (!player) return;

    const playerScreenX = player.x - cameraX;
    const playerScreenY = player.y - cameraY;

    // Draw darkness tile by tile with raycasting
    const startX = Math.max(0, Math.floor(cameraX / TILE) - 1);
    const startY = Math.max(0, Math.floor(cameraY / TILE) - 1);
    const endX = Math.min(MAP_W, Math.floor((cameraX + canvas.width) / TILE) + 2);
    const endY = Math.min(MAP_H, Math.floor((cameraY + canvas.height) / TILE) + 2);

    // First pass: draw base darkness gradient (for smooth falloff)
    const gradient = ctx.createRadialGradient(
        playerScreenX, playerScreenY, 0,
        playerScreenX, playerScreenY, visibilityRadius
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Second pass: darken tiles with no line of sight (raycasting)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    for (let ty = startY; ty < endY; ty++) {
        for (let tx = startX; tx < endX; tx++) {
            const worldX = tx * TILE + TILE / 2;
            const worldY = ty * TILE + TILE / 2;

            // Check if this tile is blocked from view
            const dx = worldX - player.x;
            const dy = worldY - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Only apply raycasting within visibility range
            if (dist < visibilityRadius) {
                if (!isPositionVisible(worldX, worldY)) {
                    const screenX = tx * TILE - cameraX;
                    const screenY = ty * TILE - cameraY;
                    ctx.fillRect(screenX, screenY, TILE, TILE);
                }
            }
        }
    }

    // Add a subtle scan line effect for retro feel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    for (let y = 0; y < canvas.height; y += 3) {
        ctx.fillRect(0, y, canvas.width, 1);
    }
}

function drawDebugOverlay() {
    if (!debugMode || !player) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 60, 280, 240);

    ctx.fillStyle = '#0f0';
    ctx.font = '14px monospace';
    let y = 80;
    const line = (text) => { ctx.fillText(text, 20, y); y += 18; };

    line('=== DEBUG (` to close) ===');
    line(`Player: (${Math.round(player.x)}, ${Math.round(player.y)})`);
    line(`Health: ${player.hp}/${player.maxHp}`);
    line(`Shield: ${player.shield}/${player.maxShield}`);
    line(`Stamina: ${Math.round(player.stamina)}/${player.maxStamina}`);
    line(`Enemies: ${enemies.length}`);
    line(`Bullets: ${bullets.length}`);
    line(`Pickups: ${pickups.length}`);
    line(`Deck: ${deck}/${maxDecks}`);
    line(`Kills: ${killCount}`);
    line(`State: ${gameState}`);
    line(`FPS: ${Math.round(fps)}`);

    ctx.restore();
}

function gameLoop(timestamp) {
    let dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    // Apply slow motion effect (hitlag on kills)
    dt *= slowMotion;
    slowMotion = Math.min(1, slowMotion + 0.05);  // Gradually return to normal

    // FPS tracking
    frameCount++;
    fpsTimer += dt / slowMotion;  // Track real FPS
    if (fpsTimer >= 1) {
        fps = frameCount / fpsTimer;
        frameCount = 0;
        fpsTimer = 0;
    }

    // Fade kill flash
    if (killFlash > 0) killFlash -= 0.02;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'title') {
        drawTitle();
    } else if (gameState === 'playing') {
        update(dt);

        drawTiles();
        drawBloodStains();
        drawBarrels();
        drawCrates();
        drawPillars();
        drawTerminals();
        drawDoors();
        drawPickups();
        drawExit();
        enemies.forEach(e => { if (e.isInVisibleArea()) e.draw(); });
        player.draw();
        drawBullets();
        drawParticles();
        drawFloatingTexts();
        drawDarknessOverlay();

        // Kill flash effect for satisfying kills
        if (killFlash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${killFlash * 0.5})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        drawHUD();
        drawMinimap();
        drawDebugOverlay();
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
    if (e.key === '`' || e.key === 'Backquote') {
        debugMode = !debugMode;
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
