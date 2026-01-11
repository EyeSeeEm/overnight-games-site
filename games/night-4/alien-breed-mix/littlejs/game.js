// Station Breach - Twin-Stick Shooter with Survival Horror Elements
// Built with LittleJS

'use strict';

// ==================== CONSTANTS ====================
const TILE_SIZE = 32;
const PLAYER_SPEED = 180 / 60; // pixels per frame
const PLAYER_SPRINT_SPEED = 270 / 60;
const PLAYER_RADIUS = 12;

// Colors
const COLOR_FLOOR = new Color(0.16, 0.16, 0.16);
const COLOR_WALL = new Color(0.29, 0.29, 0.29);
const COLOR_PLAYER = new Color(0, 0.8, 0.8);
const COLOR_ENEMY = new Color(0.4, 0.8, 0.2);
const COLOR_BULLET = new Color(1, 1, 0);
const COLOR_HEALTH = new Color(1, 0.3, 0.3);
const COLOR_AMMO = new Color(0.8, 0.8, 0.2);
const COLOR_KEYCARD_GREEN = new Color(0, 1, 0);
const COLOR_KEYCARD_BLUE = new Color(0, 0.5, 1);
const COLOR_DOOR = new Color(0.4, 0.27, 0.13);
const COLOR_TERMINAL = new Color(0, 1, 1);

// ==================== GAME STATE ====================
let player;
let enemies = [];
let bullets = [];
let pickups = [];
let doors = [];
let walls = [];
let explosiveBarrels = [];
let gameState = 'menu';
let currentLevel = 1;
let camera;

// Player stats
let playerStats = {
    health: 100,
    maxHealth: 100,
    shield: 0,
    maxShield: 0,
    stamina: 100,
    maxStamina: 100,
    credits: 0,
    keycards: { green: false, blue: false, yellow: false, red: false }
};

// Weapons data
const WEAPONS = {
    pistol: { damage: 15, fireRate: 0.25, magSize: 12, reloadTime: 1.2, spread: 3, speed: 800/60, range: 500, ammoType: '9mm' },
    shotgun: { damage: 8, pellets: 6, fireRate: 0.83, magSize: 8, reloadTime: 2.5, spread: 25, speed: 600/60, range: 250, ammoType: 'shells' },
    smg: { damage: 10, fireRate: 0.083, magSize: 40, reloadTime: 1.8, spread: 8, speed: 700/60, range: 400, ammoType: '9mm' },
    assault: { damage: 20, fireRate: 0.167, magSize: 30, reloadTime: 2.0, spread: 5, speed: 850/60, range: 600, ammoType: 'rifle' },
    plasma: { damage: 40, fireRate: 0.5, magSize: 20, reloadTime: 2.5, spread: 0, speed: 500/60, range: 700, ammoType: 'plasma' },
    flamethrower: { damage: 5, fireRate: 0.05, magSize: 100, reloadTime: 3.0, spread: 15, speed: 400/60, range: 200, ammoType: 'fuel', isFlame: true },
    rocket: { damage: 100, fireRate: 1.25, magSize: 4, reloadTime: 3.5, spread: 0, speed: 350/60, range: 800, ammoType: 'rockets', isExplosive: true, splashDamage: 50, splashRadius: 2.5 }
};

// Pause state
let gamePaused = false;
let pauseMenuIndex = 0;
const PAUSE_OPTIONS = ['Resume', 'Restart', 'Quit to Menu'];

// Blood decals
let bloodDecals = [];
const MAX_BLOOD_DECALS = 50;

// Vision system
let visibleTiles = [];

let currentWeapon = 'pistol';
let weaponInventory = ['pistol'];
let ammo = { '9mm': 999, 'shells': 0, 'rifle': 0, 'plasma': 0, 'fuel': 0, 'rockets': 0 };
let currentMag = 12;
let isReloading = false;
let reloadTimer = 0;
let shootCooldown = 0;

// Boss tracking
let bossHealthPercent = 0;
let bossActive = false;

// Self-destruct timer (starts at 10 minutes = 600 seconds)
let selfDestructTimer = 0;
let selfDestructActive = false;

// Minimap data
let visitedRooms = [];

// Shop/upgrades
let shopOpen = false;
let terminals = [];
let upgrades = {
    hpBoost1: false,
    hpBoost2: false,
    shieldModule: false,
    shieldBoost: false,
    damageBoost1: false,
    damageBoost2: false,
    reloadSpeed: false,
    ammoCapacity: false
};

const SHOP_ITEMS = [
    { id: 'medkit_small', name: 'Small Medkit', cost: 25, type: 'consumable' },
    { id: 'medkit_large', name: 'Large Medkit', cost: 60, type: 'consumable' },
    { id: 'shield_battery', name: 'Shield Battery', cost: 80, type: 'consumable' },
    { id: 'ammo_9mm', name: '9mm Ammo (30)', cost: 15, type: 'ammo' },
    { id: 'ammo_shells', name: 'Shells (16)', cost: 25, type: 'ammo' },
    { id: 'hp_boost', name: 'HP Boost (+25)', cost: 100, type: 'upgrade' },
    { id: 'damage_boost', name: 'Damage +10%', cost: 200, type: 'upgrade' },
    { id: 'reload_speed', name: 'Reload -20%', cost: 175, type: 'upgrade' }
];

// ==================== LEVEL DATA ====================
// Simple procedural level
let levelData = [];
const LEVEL_WIDTH = 40;
const LEVEL_HEIGHT = 30;

// ==================== CLASSES ====================

class Player extends EngineObject {
    constructor(pos) {
        super(pos, vec2(0.8, 0.8), undefined, 0, COLOR_PLAYER);
        this.facing = vec2(1, 0);
        this.isSprinting = false;
        this.meleeCooldown = 0;
    }

    update() {
        super.update();

        // Movement
        let moveDir = vec2(0, 0);
        if (keyIsDown('KeyW') || keyIsDown('ArrowUp')) moveDir.y += 1;
        if (keyIsDown('KeyS') || keyIsDown('ArrowDown')) moveDir.y -= 1;
        if (keyIsDown('KeyA') || keyIsDown('ArrowLeft')) moveDir.x -= 1;
        if (keyIsDown('KeyD') || keyIsDown('ArrowRight')) moveDir.x += 1;

        // Sprint
        this.isSprinting = keyIsDown('ShiftLeft') || keyIsDown('ShiftRight');
        if (this.isSprinting && playerStats.stamina > 0 && moveDir.length() > 0) {
            playerStats.stamina -= 25 / 60; // drain per frame
        } else if (playerStats.stamina < playerStats.maxStamina) {
            playerStats.stamina += 20 / 60; // regen per frame
        }
        playerStats.stamina = clamp(playerStats.stamina, 0, playerStats.maxStamina);

        // Apply movement
        if (moveDir.length() > 0) {
            moveDir = moveDir.normalize();
            const speed = this.isSprinting && playerStats.stamina > 0 ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;
            const newPos = this.pos.add(moveDir.scale(speed));

            // Wall collision
            if (!isWall(newPos.x, this.pos.y)) this.pos.x = newPos.x;
            if (!isWall(this.pos.x, newPos.y)) this.pos.y = newPos.y;
        }

        // Aiming (mouse position)
        const mouseWorld = screenToWorld(mousePos);
        const aimDir = mouseWorld.subtract(this.pos);
        if (aimDir.length() > 0) {
            this.facing = aimDir.normalize();
            this.angle = Math.atan2(this.facing.y, this.facing.x);
        }

        // Shooting
        if (shootCooldown > 0) shootCooldown -= 1/60;
        if (this.meleeCooldown > 0) this.meleeCooldown -= 1/60;

        if ((mouseIsDown(0) || keyIsDown('Space')) && !isReloading && shootCooldown <= 0) {
            this.shoot();
        }

        // Manual melee with F key
        if (keyWasPressed('KeyF') && this.meleeCooldown <= 0) {
            this.melee();
        }

        // Reload
        if (keyWasPressed('KeyR') && !isReloading) {
            this.startReload();
        }

        if (isReloading) {
            reloadTimer -= 1/60;
            if (reloadTimer <= 0) {
                this.finishReload();
            }
        }

        // Weapon switch
        if (keyWasPressed('KeyQ')) {
            this.cycleWeapon();
        }

        // Interact
        if (keyWasPressed('KeyE') || keyWasPressed('Space')) {
            this.interact();
        }
    }

    melee() {
        // Fallback melee attack
        if (this.meleeCooldown > 0) return;
        this.meleeCooldown = 0.5;

        // Punch effect
        const punchPos = this.pos.add(this.facing.scale(0.8));
        new ParticleEmitter(
            punchPos, 0.05, 0, 0.1, 0,
            PI/2, new Color(1, 1, 0.5), new Color(0.8, 0.8, 0.3),
            0.3, 0.15, 0.1, 0.05, 0,
            0.5, 0.5, 0, PI, 0.1,
            1, 0, 0, 0, 1e8
        );

        // Check for enemies in melee range
        for (const enemy of enemies) {
            if (this.pos.distance(enemy.pos) < 1.2) {
                enemy.takeDamage(10);
                showFloatingText(enemy.pos, 'PUNCH!', new Color(1, 1, 0));
            }
        }

        cameraShake = 0.05;
    }

    shoot() {
        const weapon = WEAPONS[currentWeapon];
        if (currentMag <= 0) {
            // Check if we have any ammo at all
            const totalAmmo = ammo[weapon.ammoType] + (weapon.ammoType === '9mm' ? 999 : 0);
            if (totalAmmo <= 0 && weapon.ammoType !== '9mm') {
                showMessage('NO AMMO - Using melee!', 0.5);
                this.melee();
                return;
            }
            showMessage('OUT OF AMMO - Press R to reload', 1);
            this.startReload();
            return;
        }

        shootCooldown = weapon.fireRate;
        currentMag--;

        // Handle flamethrower specially
        if (weapon.isFlame) {
            for (let i = 0; i < 3; i++) {
                const spreadAngle = (Math.random() - 0.5) * weapon.spread * Math.PI / 180;
                const dir = vec2(
                    Math.cos(this.angle + spreadAngle),
                    Math.sin(this.angle + spreadAngle)
                );
                const bulletPos = this.pos.add(dir.scale(0.5));
                const flame = new Bullet(bulletPos, dir, weapon.damage, weapon.speed, weapon.range, true);
                flame.isFlame = true;
                flame.color = new Color(1, 0.5, 0);
                bullets.push(flame);
            }
            // Orange/red muzzle flash for flamethrower
            new ParticleEmitter(
                this.pos.add(this.facing.scale(0.5)),
                0.1, 0, 0.15, 0,
                PI, new Color(1, 0.4, 0), new Color(1, 0.1, 0),
                0.8, 0.3, 0.15, 0.1, 0,
                0.5, 1, 0, PI, 0.1,
                1, 0, 0, 0, 1e8
            );
        }
        // Handle rocket specially
        else if (weapon.isExplosive) {
            const dir = vec2(Math.cos(this.angle), Math.sin(this.angle));
            const bulletPos = this.pos.add(dir.scale(0.5));
            const rocket = new Bullet(bulletPos, dir, weapon.damage, weapon.speed, weapon.range, true);
            rocket.isRocket = true;
            rocket.splashDamage = weapon.splashDamage;
            rocket.splashRadius = weapon.splashRadius;
            rocket.color = new Color(0.5, 0.5, 0.5);
            bullets.push(rocket);

            // Bigger shake and flash for rockets
            cameraShake = Math.min(cameraShake + 0.15, 0.4);
            new ParticleEmitter(
                this.pos.add(this.facing.scale(0.5)),
                0.15, 0, 0.2, 0,
                PI, new Color(1, 1, 0), new Color(1, 0.3, 0),
                1.0, 0.5, 0.2, 0.1, 0,
                0.5, 1, 0, PI, 0.1,
                1, 0, 0, 0, 1e8
            );
        }
        // Normal weapons
        else {
            const pellets = weapon.pellets || 1;
            for (let i = 0; i < pellets; i++) {
                const spreadAngle = (Math.random() - 0.5) * weapon.spread * Math.PI / 180;
                const dir = vec2(
                    Math.cos(this.angle + spreadAngle),
                    Math.sin(this.angle + spreadAngle)
                );
                const bulletPos = this.pos.add(dir.scale(0.5));
                bullets.push(new Bullet(bulletPos, dir, weapon.damage, weapon.speed, weapon.range, true));
            }

            // Muzzle flash
            new ParticleEmitter(
                this.pos.add(this.facing.scale(0.5)),
                0.05, 0, 0.1, 0,
                PI, new Color(1, 0.8, 0), new Color(1, 0.5, 0),
                0.5, 0.2, 0.1, 0.05, 0,
                0.5, 1, 0, PI, 0.1,
                1, 0, 0, 0, 1e8
            );
        }

        // Screen shake (reduced by 50% per feedback)
        if (!weapon.isFlame && !weapon.isExplosive) {
            cameraShake = Math.min(cameraShake + 0.025, 0.15);
        }

        // Alert nearby enemies to gunfire sound
        alertEnemiesNearby(this.pos, 10);
    }

    startReload() {
        const weapon = WEAPONS[currentWeapon];
        if (ammo[weapon.ammoType] <= 0 && weapon.ammoType !== '9mm') {
            showMessage('No ammo for ' + currentWeapon.toUpperCase(), 1);
            return;
        }
        isReloading = true;
        reloadTimer = weapon.reloadTime - 0.25; // Reduced per feedback
        showMessage('RELOADING...', weapon.reloadTime);
    }

    finishReload() {
        isReloading = false;
        const weapon = WEAPONS[currentWeapon];
        const needed = weapon.magSize - currentMag;
        if (weapon.ammoType === '9mm') {
            currentMag = weapon.magSize; // Infinite pistol ammo
        } else {
            const toLoad = Math.min(needed, ammo[weapon.ammoType]);
            ammo[weapon.ammoType] -= toLoad;
            currentMag += toLoad;
        }
    }

    cycleWeapon() {
        const idx = weaponInventory.indexOf(currentWeapon);
        const newIdx = (idx + 1) % weaponInventory.length;
        currentWeapon = weaponInventory[newIdx];
        currentMag = Math.min(currentMag, WEAPONS[currentWeapon].magSize);
        showMessage(currentWeapon.toUpperCase(), 1);
    }

    interact() {
        // Check for nearby doors
        for (const door of doors) {
            if (this.pos.distance(door.pos) < 1.5) {
                door.tryOpen();
            }
        }

        // Check for nearby pickups
        for (let i = pickups.length - 1; i >= 0; i--) {
            if (this.pos.distance(pickups[i].pos) < 1) {
                pickups[i].collect();
            }
        }
    }

    takeDamage(amount) {
        // Shield first
        if (playerStats.shield > 0) {
            const shieldDmg = Math.min(amount, playerStats.shield);
            playerStats.shield -= shieldDmg;
            amount -= shieldDmg;
        }

        playerStats.health -= amount;
        cameraShake = 0.5;

        if (playerStats.health <= 0) {
            gameState = 'dead';
            showMessage('GAME OVER', 5);
        }
    }

    render() {
        // Body
        drawRect(this.pos, vec2(0.8, 0.8), COLOR_PLAYER, this.angle);

        // Direction indicator
        const gunPos = this.pos.add(this.facing.scale(0.5));
        drawRect(gunPos, vec2(0.3, 0.15), new Color(0.5, 0.5, 0.5), this.angle);
    }
}

class Enemy extends EngineObject {
    constructor(pos, type = 'drone') {
        super(pos, vec2(0.75, 0.75), undefined, 0, COLOR_ENEMY);
        this.type = type;
        this.facing = vec2(1, 0);
        this.state = 'patrol';
        this.patrolDir = vec2(Math.random() - 0.5, Math.random() - 0.5).normalize();
        this.stateTimer = 0;
        this.attackCooldown = 0;
        this.alertRange = 300 / TILE_SIZE;

        // Stats by type
        switch (type) {
            case 'drone':
                this.health = 20;
                this.damage = 10;
                this.speed = 120 / 60 / TILE_SIZE;
                this.color = new Color(0.4, 0.8, 0.2);
                break;
            case 'spitter':
                this.health = 30;
                this.damage = 15;
                this.speed = 80 / 60 / TILE_SIZE;
                this.color = new Color(0.6, 0.8, 0.2);
                this.canShoot = true;
                this.preferredDist = 6;
                break;
            case 'lurker':
                this.health = 40;
                this.damage = 20;
                this.speed = 200 / 60 / TILE_SIZE;
                this.color = new Color(0.3, 0.6, 0.3);
                this.isAmbusher = true;
                break;
            case 'brute':
                this.health = 100;
                this.damage = 30;
                this.speed = 60 / 60 / TILE_SIZE;
                this.size = vec2(1.2, 1.2);
                this.color = new Color(0.5, 0.4, 0.2);
                this.canCharge = true;
                break;
            case 'exploder':
                this.health = 15;
                this.damage = 50;
                this.speed = 150 / 60 / TILE_SIZE;
                this.color = new Color(1, 0.5, 0);
                this.explodes = true;
                break;
            case 'matriarch':
                this.health = 80;
                this.damage = 25;
                this.speed = 100 / 60 / TILE_SIZE;
                this.size = vec2(1.0, 1.0);
                this.color = new Color(0.2, 0.6, 0.4);
                this.canSpawnDrones = true;
                this.spawnCooldown = 5;
                this.maxSpawned = 4;
                this.spawnedCount = 0;
                break;
            case 'elite_drone':
                this.health = 50;
                this.damage = 15;
                this.speed = 150 / 60 / TILE_SIZE;
                this.color = new Color(0.6, 0.2, 0.2);
                this.isElite = true;
                this.armor = 0.2; // 20% damage reduction
                break;
            case 'queen':
                this.health = 500;
                this.maxHealth = 500;
                this.damage = 40;
                this.speed = 80 / 60 / TILE_SIZE;
                this.size = vec2(2.5, 2.5);
                this.color = new Color(0.3, 0.1, 0.3);
                this.isBoss = true;
                this.phase = 1;
                this.attackCooldown = 0;
                this.attackPattern = 0;
                break;
        }
    }

    update() {
        super.update();
        if (!player) return;

        const distToPlayer = this.pos.distance(player.pos);
        const canSeePlayer = this.hasLineOfSight(player.pos);

        this.attackCooldown -= 1/60;
        this.stateTimer -= 1/60;

        // State machine
        switch (this.state) {
            case 'patrol':
                this.patrol();
                if (canSeePlayer && distToPlayer < this.alertRange) {
                    this.state = 'chase';
                }
                break;

            case 'chase':
                this.chasePlayer(distToPlayer);

                // Attack when close
                if (distToPlayer < 1 && this.attackCooldown <= 0) {
                    this.attack();
                }

                // Ranged attack
                if (this.canShoot && distToPlayer < 8 && distToPlayer > 3 && this.attackCooldown <= 0) {
                    this.shootAcid();
                }

                // Lost sight
                if (!canSeePlayer) {
                    this.stateTimer = 3;
                    this.state = 'search';
                }
                break;

            case 'search':
                this.moveTowards(this.lastKnownPos || player.pos);
                if (canSeePlayer) {
                    this.state = 'chase';
                } else if (this.stateTimer <= 0) {
                    this.state = 'patrol';
                }
                break;

            case 'charge':
                if (this.chargeDir) {
                    this.pos = this.pos.add(this.chargeDir.scale(this.speed * 4));
                    if (this.stateTimer <= 0 || isWall(this.pos.x, this.pos.y)) {
                        this.state = 'stunned';
                        this.stateTimer = 1;
                    }
                }
                break;

            case 'stunned':
                if (this.stateTimer <= 0) {
                    this.state = 'chase';
                }
                break;
        }

        // Exploder proximity
        if (this.explodes && distToPlayer < 1) {
            this.explode();
        }

        // Matriarch spawning
        if (this.canSpawnDrones && this.state === 'chase') {
            this.spawnCooldown -= 1/60;
            if (this.spawnCooldown <= 0 && this.spawnedCount < this.maxSpawned) {
                this.spawnDrone();
                this.spawnCooldown = 5;
            }
        }

        // Queen boss AI
        if (this.isBoss) {
            this.updateBossAI(distToPlayer);
        }

        // Elite strafing
        if (this.isElite && this.state === 'chase' && distToPlayer < 5) {
            // Strafe around player
            const strafeDir = vec2(-this.facing.y, this.facing.x);
            const strafePos = this.pos.add(strafeDir.scale(this.speed * 0.5));
            if (!isWall(strafePos.x, strafePos.y)) {
                this.pos = strafePos;
            }
        }
    }

    spawnDrone() {
        const spawnPos = this.pos.add(vec2(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ));
        if (!isWall(spawnPos.x, spawnPos.y)) {
            const drone = new Enemy(spawnPos, 'drone');
            drone.parentMatriarch = this;
            enemies.push(drone);
            this.spawnedCount++;

            // Spawn effect
            new ParticleEmitter(
                spawnPos, 0.1, 0, 0.2, 0,
                PI * 2, new Color(0, 1, 0.5), new Color(0, 0.5, 0.2),
                0.3, 0.2, 0.1, 0.05, 0,
                0.5, 0.5, 0, PI, 0.1,
                1, 0, 0, 0, 1e8
            );
        }
    }

    updateBossAI(dist) {
        if (!player) return;

        // Phase transitions
        const healthPercent = this.health / this.maxHealth;
        if (healthPercent <= 0.3 && this.phase < 3) {
            this.phase = 3;
            showMessage('THE QUEEN IS ENRAGED!', 3);
        } else if (healthPercent <= 0.7 && this.phase < 2) {
            this.phase = 2;
            showMessage('THE QUEEN CHARGES!', 2);
        }

        this.attackCooldown -= 1/60;

        // Boss attacks
        if (this.attackCooldown <= 0) {
            this.attackPattern = (this.attackPattern + 1) % 4;

            switch (this.attackPattern) {
                case 0: // Claw swipe
                    if (dist < 3) {
                        this.queenSwipe();
                        this.attackCooldown = 1.5 - this.phase * 0.2;
                    }
                    break;
                case 1: // Acid spray
                    if (dist < 10) {
                        this.queenAcidSpray();
                        this.attackCooldown = 2 - this.phase * 0.3;
                    }
                    break;
                case 2: // Charge (phase 2+)
                    if (this.phase >= 2 && dist > 4) {
                        this.queenCharge();
                        this.attackCooldown = 3;
                    }
                    break;
                case 3: // Summon (phase 3)
                    if (this.phase >= 3) {
                        this.queenSummon();
                        this.attackCooldown = 5;
                    }
                    break;
            }
        }

        // Move towards player slowly
        if (dist > 2) {
            this.moveTowards(player.pos);
        }
    }

    queenSwipe() {
        if (!player) return;
        if (this.pos.distance(player.pos) < 3) {
            const damage = this.phase === 3 ? 35 : 25;
            player.takeDamage(damage);
            cameraShake = 0.6;

            // Swipe effect
            const dir = player.pos.subtract(this.pos).normalize();
            for (let i = -2; i <= 2; i++) {
                const angle = Math.atan2(dir.y, dir.x) + i * 0.3;
                const effectPos = this.pos.add(vec2(Math.cos(angle), Math.sin(angle)).scale(2));
                new ParticleEmitter(
                    effectPos, 0.1, 0, 0.15, 0,
                    PI, new Color(1, 0, 0), new Color(0.5, 0, 0),
                    0.5, 0.2, 0.1, 0.05, 0,
                    0.5, 1, 0, PI, 0.1,
                    1, 0, 0, 0, 1e8
                );
            }
        }
    }

    queenAcidSpray() {
        if (!player) return;
        const baseDir = player.pos.subtract(this.pos).normalize();

        for (let i = -2; i <= 2; i++) {
            const angle = Math.atan2(baseDir.y, baseDir.x) + i * 0.2;
            const dir = vec2(Math.cos(angle), Math.sin(angle));
            bullets.push(new Bullet(this.pos.add(dir), dir, 15, 6/60, 10, false));
        }
    }

    queenCharge() {
        if (!player) return;
        this.chargeDir = player.pos.subtract(this.pos).normalize();
        this.state = 'charge';
        this.stateTimer = 1.5;
        showFloatingText(this.pos, 'CHARGING!', new Color(1, 0.5, 0));
    }

    queenSummon() {
        showFloatingText(this.pos, 'SUMMONING!', new Color(0.5, 0, 0.5));
        for (let i = 0; i < 3; i++) {
            const spawnAngle = (i / 3) * Math.PI * 2;
            const spawnPos = this.pos.add(vec2(
                Math.cos(spawnAngle) * 3,
                Math.sin(spawnAngle) * 3
            ));
            if (!isWall(spawnPos.x, spawnPos.y)) {
                enemies.push(new Enemy(spawnPos, 'drone'));
            }
        }
        if (this.phase === 3) {
            enemies.push(new Enemy(this.pos.add(vec2(2, 2)), 'lurker'));
        }
    }

    patrol() {
        const newPos = this.pos.add(this.patrolDir.scale(this.speed * 0.5));
        if (!isWall(newPos.x, newPos.y)) {
            this.pos = newPos;
        } else {
            this.patrolDir = vec2(Math.random() - 0.5, Math.random() - 0.5).normalize();
        }
    }

    chasePlayer(dist) {
        if (!player) return;

        // Brute charge
        if (this.canCharge && dist < 6 && dist > 2 && this.attackCooldown <= 0) {
            this.chargeDir = player.pos.subtract(this.pos).normalize();
            this.state = 'charge';
            this.stateTimer = 1.5;
            this.attackCooldown = 3;
            return;
        }

        // Spitter keeps distance
        if (this.canShoot && dist < this.preferredDist) {
            const awayDir = this.pos.subtract(player.pos).normalize();
            this.moveTowards(this.pos.add(awayDir));
        } else {
            this.moveTowards(player.pos);
        }

        this.lastKnownPos = player.pos.copy();
    }

    moveTowards(target) {
        const dir = target.subtract(this.pos);
        if (dir.length() > 0.1) {
            const moveDir = dir.normalize();
            this.facing = moveDir;
            this.angle = Math.atan2(moveDir.y, moveDir.x);

            const newPos = this.pos.add(moveDir.scale(this.speed));

            // Wall sliding
            if (!isWall(newPos.x, this.pos.y)) {
                this.pos.x = newPos.x;
            } else if (!isWall(this.pos.x, newPos.y)) {
                this.pos.y = newPos.y;
            }
        }
    }

    hasLineOfSight(target) {
        const dir = target.subtract(this.pos);
        const dist = dir.length();
        const step = dir.normalize().scale(0.5);
        let checkPos = this.pos.copy();

        for (let i = 0; i < dist * 2; i++) {
            checkPos = checkPos.add(step);
            if (isWall(checkPos.x, checkPos.y)) return false;
        }
        return true;
    }

    attack() {
        if (!player) return;
        player.takeDamage(this.damage);
        this.attackCooldown = 1;
    }

    shootAcid() {
        if (!player) return;
        const dir = player.pos.subtract(this.pos).normalize();
        bullets.push(new Bullet(this.pos.add(dir.scale(0.5)), dir, this.damage, 5/60, 8, false));
        this.attackCooldown = 2;
    }

    takeDamage(amount) {
        // Apply armor reduction
        if (this.armor) {
            amount = Math.floor(amount * (1 - this.armor));
        }

        this.health -= amount;

        // Add blood decal
        addBloodDecal(this.pos.add(vec2(Math.random() * 0.5 - 0.25, Math.random() * 0.5 - 0.25)));

        // Damage flash
        const originalColor = this.color;
        this.color = new Color(1, 1, 1);
        setTimeout(() => {
            if (this.type === 'drone') this.color = new Color(0.4, 0.8, 0.2);
            else if (this.type === 'spitter') this.color = new Color(0.6, 0.8, 0.2);
            else if (this.type === 'brute') this.color = new Color(0.5, 0.4, 0.2);
            else if (this.type === 'matriarch') this.color = new Color(0.2, 0.6, 0.4);
            else if (this.type === 'elite_drone') this.color = new Color(0.6, 0.2, 0.2);
            else if (this.type === 'queen') this.color = new Color(0.3, 0.1, 0.3);
            else this.color = originalColor;
        }, 100);

        // Damage number (larger for boss)
        const textSize = this.isBoss ? 0.6 : 0.4;
        showFloatingText(this.pos, '-' + amount, new Color(1, 0, 0));

        // Boss health event
        if (this.isBoss) {
            bossHealthPercent = this.health / this.maxHealth;
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        // Death particles
        new ParticleEmitter(
            this.pos, 0.2, 0, 0.3, 0,
            PI, new Color(0, 1, 0.5), new Color(0, 0.5, 0.2),
            0.5, 0.2, 0.1, 0.05, 0.1,
            1, 1, 0, PI, 0.1,
            1, 0, 1, 0, 1e8
        );

        // Drop loot
        if (Math.random() < 0.3) {
            pickups.push(new Pickup(this.pos, 'health'));
        }
        if (Math.random() < 0.25) {
            pickups.push(new Pickup(this.pos.add(vec2(0.3, 0)), 'ammo'));
        }

        // Credits
        playerStats.credits += this.type === 'brute' ? 30 : this.type === 'spitter' ? 10 : 5;

        // Exploder death
        if (this.explodes) {
            this.explode();
        }

        // Remove from array
        const idx = enemies.indexOf(this);
        if (idx > -1) enemies.splice(idx, 1);
        this.destroy();
    }

    explode() {
        // Explosion effect
        new ParticleEmitter(
            this.pos, 0.3, 0, 0.5, 0,
            PI * 2, new Color(1, 0.5, 0), new Color(1, 0, 0),
            1, 0.5, 0.2, 0.1, 0.1,
            2, 1, 0, PI, 0.1,
            1, 0, 1, 0, 1e8
        );

        // Damage player if close
        if (player && this.pos.distance(player.pos) < 2.5) {
            player.takeDamage(this.damage);
        }

        // Damage other enemies
        for (const enemy of enemies) {
            if (enemy !== this && this.pos.distance(enemy.pos) < 2.5) {
                enemy.takeDamage(30);
            }
        }

        cameraShake = 0.8;
    }

    render() {
        drawRect(this.pos, this.size || vec2(0.75, 0.75), this.color, this.angle);

        // Direction indicator
        if (this.state === 'chase' || this.state === 'charge') {
            const eyePos = this.pos.add(this.facing.scale(0.3));
            drawRect(eyePos, vec2(0.15, 0.15), new Color(1, 0, 0));
        }
    }
}

class Bullet extends EngineObject {
    constructor(pos, dir, damage, speed, range, isPlayerBullet) {
        super(pos, vec2(0.2, 0.2));
        this.dir = dir;
        this.damage = damage;
        this.speed = speed;
        this.range = range / TILE_SIZE;
        this.isPlayerBullet = isPlayerBullet;
        this.distTraveled = 0;
        this.color = isPlayerBullet ? COLOR_BULLET : new Color(0, 1, 0.5);
    }

    update() {
        super.update();

        const move = this.dir.scale(this.speed);
        this.pos = this.pos.add(move);
        this.distTraveled += this.speed;

        // Wall collision
        if (isWall(this.pos.x, this.pos.y)) {
            if (this.isRocket) {
                this.explodeRocket();
            }
            this.destroy();
            return;
        }

        // Range limit
        if (this.distTraveled >= this.range) {
            if (this.isRocket) {
                this.explodeRocket();
            }
            this.destroy();
            return;
        }

        // Hit detection
        if (this.isPlayerBullet) {
            for (const enemy of enemies) {
                if (this.pos.distance(enemy.pos) < 0.5) {
                    if (this.isRocket) {
                        this.explodeRocket();
                        this.destroy();
                        return;
                    }
                    enemy.takeDamage(this.damage);
                    this.destroy();
                    return;
                }
            }
            // Check barrel hits
            for (const barrel of explosiveBarrels) {
                if (this.pos.distance(barrel.pos) < 0.5) {
                    if (this.isRocket) {
                        this.explodeRocket();
                        this.destroy();
                        return;
                    }
                    barrel.health -= this.damage;
                    if (barrel.health <= 0) {
                        explodeBarrel(barrel);
                    }
                    this.destroy();
                    return;
                }
            }
        } else {
            if (player && this.pos.distance(player.pos) < 0.5) {
                player.takeDamage(this.damage);
                this.destroy();
                return;
            }
        }
    }

    explodeRocket() {
        // Explosion visual
        new ParticleEmitter(
            this.pos, 0.2, 0, 0.3, 0,
            PI, new Color(1, 0.5, 0), new Color(1, 0.2, 0),
            2, 1, 0.5, 0.2, 0.1,
            0.5, 1, 0, PI, 0.1,
            1, 0, 0, 0, 1e8
        );

        // Screen shake
        cameraShake = 0.8;

        // Splash damage to enemies
        for (const enemy of enemies) {
            if (this.pos.distance(enemy.pos) < this.splashRadius) {
                const dist = this.pos.distance(enemy.pos);
                const falloff = 1 - (dist / this.splashRadius);
                const dmg = dist < 0.5 ? this.damage : Math.floor(this.splashDamage * falloff);
                enemy.takeDamage(dmg);
            }
        }

        // Splash damage to player if close (self damage)
        if (player && this.pos.distance(player.pos) < this.splashRadius) {
            const dist = this.pos.distance(player.pos);
            const falloff = 1 - (dist / this.splashRadius);
            player.takeDamage(Math.floor(this.splashDamage * falloff * 0.5)); // Self damage reduced
        }

        // Chain explosions on barrels
        for (const barrel of explosiveBarrels) {
            if (this.pos.distance(barrel.pos) < this.splashRadius) {
                barrel.health = 0;
                setTimeout(() => explodeBarrel(barrel), 50);
            }
        }
    }

    destroy() {
        const idx = bullets.indexOf(this);
        if (idx > -1) bullets.splice(idx, 1);
        super.destroy();
    }

    render() {
        drawRect(this.pos, vec2(0.2, 0.2), this.color, Math.atan2(this.dir.y, this.dir.x));
    }
}

class Door extends EngineObject {
    constructor(pos, keyRequired = null, isVertical = false) {
        super(pos, isVertical ? vec2(0.5, 2) : vec2(2, 0.5));
        this.keyRequired = keyRequired;
        this.isOpen = false;
        this.isVertical = isVertical;
    }

    tryOpen() {
        if (this.isOpen) return;

        if (this.keyRequired) {
            if (playerStats.keycards[this.keyRequired]) {
                this.open();
                showFloatingText(this.pos, 'DOOR OPENED', new Color(0, 1, 0));
            } else {
                showFloatingText(this.pos, 'NEED ' + this.keyRequired.toUpperCase() + ' KEYCARD', new Color(1, 0, 0));
            }
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        showFloatingText(this.pos, 'OPENED', new Color(0, 1, 0));
    }

    render() {
        if (this.isOpen) return;

        let color = COLOR_DOOR;
        if (this.keyRequired === 'green') color = COLOR_KEYCARD_GREEN;
        else if (this.keyRequired === 'blue') color = COLOR_KEYCARD_BLUE;
        else if (this.keyRequired === 'yellow') color = new Color(1, 1, 0);
        else if (this.keyRequired === 'red') color = new Color(1, 0, 0);

        drawRect(this.pos, this.size, color);

        // "SPACE to open" prompt when player is near
        if (player && this.pos.distance(player.pos) < 1.5) {
            drawText('SPACE', this.pos.add(vec2(0, 1)), 0.3, new Color(1, 1, 1));
        }
    }
}

class Pickup extends EngineObject {
    constructor(pos, type) {
        super(pos, vec2(0.5, 0.5));
        this.type = type;
        this.bobOffset = Math.random() * Math.PI * 2;
    }

    collect() {
        let message = '';
        switch (this.type) {
            case 'health':
                const heal = 25;
                playerStats.health = Math.min(playerStats.health + heal, playerStats.maxHealth);
                message = '+' + heal + ' HP';
                break;
            case 'health_large':
                const healLarge = 50;
                playerStats.health = Math.min(playerStats.health + healLarge, playerStats.maxHealth);
                message = '+' + healLarge + ' HP';
                break;
            case 'shield_battery':
                const shieldAmt = 25;
                if (playerStats.maxShield === 0) {
                    playerStats.maxShield = 25;
                }
                playerStats.shield = Math.min(playerStats.shield + shieldAmt, playerStats.maxShield);
                message = '+' + shieldAmt + ' SHIELD';
                break;
            case 'ammo':
                const ammoAmt = 30;
                ammo['9mm'] += ammoAmt;
                message = '+' + ammoAmt + ' AMMO';
                break;
            case 'ammo_rifle':
                ammo['rifle'] += 30;
                message = '+30 RIFLE AMMO';
                break;
            case 'ammo_plasma':
                ammo['plasma'] += 20;
                message = '+20 PLASMA';
                break;
            case 'keycard_green':
                playerStats.keycards.green = true;
                message = 'GREEN KEYCARD';
                break;
            case 'keycard_blue':
                playerStats.keycards.blue = true;
                message = 'BLUE KEYCARD';
                break;
            case 'keycard_yellow':
                playerStats.keycards.yellow = true;
                message = 'YELLOW KEYCARD';
                break;
            case 'keycard_red':
                playerStats.keycards.red = true;
                message = 'RED KEYCARD';
                break;
            case 'shotgun':
                if (!weaponInventory.includes('shotgun')) {
                    weaponInventory.push('shotgun');
                    ammo['shells'] = 24;
                    message = 'SHOTGUN ACQUIRED';
                }
                break;
            case 'smg':
                if (!weaponInventory.includes('smg')) {
                    weaponInventory.push('smg');
                    ammo['9mm'] += 40;
                    message = 'SMG ACQUIRED';
                }
                break;
            case 'assault':
                if (!weaponInventory.includes('assault')) {
                    weaponInventory.push('assault');
                    ammo['rifle'] = 60;
                    message = 'ASSAULT RIFLE ACQUIRED';
                }
                break;
            case 'plasma':
                if (!weaponInventory.includes('plasma')) {
                    weaponInventory.push('plasma');
                    ammo['plasma'] = 40;
                    message = 'PLASMA RIFLE ACQUIRED';
                }
                break;
        }

        showFloatingText(this.pos, message, new Color(0, 1, 0.5));

        const idx = pickups.indexOf(this);
        if (idx > -1) pickups.splice(idx, 1);
        this.destroy();
    }

    render() {
        const bob = Math.sin(time * 3 + this.bobOffset) * 0.1;
        const renderPos = this.pos.add(vec2(0, bob));

        let color;
        switch (this.type) {
            case 'health': color = COLOR_HEALTH; break;
            case 'health_large': color = new Color(1, 0.2, 0.4); break;
            case 'shield_battery': color = new Color(0.3, 0.5, 1); break;
            case 'ammo': color = COLOR_AMMO; break;
            case 'ammo_rifle': color = new Color(0.6, 0.6, 0.3); break;
            case 'ammo_plasma': color = new Color(0.5, 0.8, 1); break;
            case 'keycard_green': color = COLOR_KEYCARD_GREEN; break;
            case 'keycard_blue': color = COLOR_KEYCARD_BLUE; break;
            case 'keycard_yellow': color = new Color(1, 1, 0); break;
            case 'keycard_red': color = new Color(1, 0, 0); break;
            case 'shotgun': color = new Color(0.5, 0.4, 0.3); break;
            case 'smg': color = new Color(0.4, 0.4, 0.4); break;
            case 'assault': color = new Color(0.3, 0.35, 0.3); break;
            case 'plasma': color = new Color(0.4, 0.6, 0.8); break;
            default: color = new Color(1, 1, 1);
        }

        drawRect(renderPos, vec2(0.5, 0.5), color);

        // "E to pickup" prompt
        if (player && this.pos.distance(player.pos) < 1.5) {
            drawText('E', renderPos.add(vec2(0, 0.7)), 0.3, new Color(1, 1, 1));
        }
    }
}

// ==================== SHOP TERMINAL ====================

class Terminal extends EngineObject {
    constructor(pos) {
        super(pos, vec2(1, 1.5));
        this.color = COLOR_TERMINAL;
    }

    interact() {
        shopOpen = true;
        showMessage('INTEX TERMINAL - Press 1-8 to buy, ESC to close', 3);
    }

    render() {
        drawRect(this.pos, vec2(1, 1.5), this.color);
        drawRect(this.pos.add(vec2(0, 0.3)), vec2(0.6, 0.6), new Color(0, 0.3, 0.3));

        // Prompt when near
        if (player && this.pos.distance(player.pos) < 2) {
            drawText('E: SHOP', this.pos.add(vec2(0, 1.2)), 0.3, new Color(0, 1, 1));
        }
    }
}

function explodeBarrel(barrel) {
    const idx = explosiveBarrels.indexOf(barrel);
    if (idx > -1) explosiveBarrels.splice(idx, 1);

    // Explosion effect
    new ParticleEmitter(
        barrel.pos, 0.3, 0, 0.5, 0,
        PI * 2, new Color(1, 0.5, 0), new Color(1, 0, 0),
        1.5, 0.8, 0.3, 0.1, 0.1,
        2.5, 1.5, 0, PI, 0.1,
        1, 0, 1, 0, 1e8
    );

    // Damage in radius
    const explosionRadius = 3;
    const explosionDamage = 80;

    // Damage player
    if (player && barrel.pos.distance(player.pos) < explosionRadius) {
        const dist = barrel.pos.distance(player.pos);
        const falloff = 1 - (dist / explosionRadius);
        player.takeDamage(Math.floor(explosionDamage * falloff));
    }

    // Damage enemies
    for (const enemy of enemies) {
        if (barrel.pos.distance(enemy.pos) < explosionRadius) {
            const dist = barrel.pos.distance(enemy.pos);
            const falloff = 1 - (dist / explosionRadius);
            enemy.takeDamage(Math.floor(explosionDamage * falloff));
        }
    }

    // Chain reaction - explode nearby barrels
    for (const otherBarrel of explosiveBarrels.slice()) {
        if (barrel.pos.distance(otherBarrel.pos) < explosionRadius) {
            setTimeout(() => explodeBarrel(otherBarrel), 100);
        }
    }

    cameraShake = 1.0;
    showFloatingText(barrel.pos, 'BOOM!', new Color(1, 0.5, 0));
}

function purchaseItem(index) {
    if (index < 0 || index >= SHOP_ITEMS.length) return;

    const item = SHOP_ITEMS[index];
    if (playerStats.credits < item.cost) {
        showFloatingText(player.pos, 'NOT ENOUGH CREDITS', new Color(1, 0, 0));
        return;
    }

    playerStats.credits -= item.cost;
    let message = '';

    switch (item.id) {
        case 'medkit_small':
            playerStats.health = Math.min(playerStats.health + 25, playerStats.maxHealth);
            message = '+25 HP';
            break;
        case 'medkit_large':
            playerStats.health = Math.min(playerStats.health + 50, playerStats.maxHealth);
            message = '+50 HP';
            break;
        case 'shield_battery':
            playerStats.shield = Math.min(playerStats.shield + 25, playerStats.maxShield);
            message = '+25 SHIELD';
            break;
        case 'ammo_9mm':
            ammo['9mm'] += 30;
            message = '+30 9mm';
            break;
        case 'ammo_shells':
            ammo['shells'] += 16;
            message = '+16 SHELLS';
            break;
        case 'hp_boost':
            if (!upgrades.hpBoost1) {
                upgrades.hpBoost1 = true;
                playerStats.maxHealth += 25;
                playerStats.health = playerStats.maxHealth;
                message = 'MAX HP +25';
            } else {
                showFloatingText(player.pos, 'ALREADY OWNED', new Color(1, 0.5, 0));
                playerStats.credits += item.cost;
                return;
            }
            break;
        case 'damage_boost':
            if (!upgrades.damageBoost1) {
                upgrades.damageBoost1 = true;
                message = 'DAMAGE +10%';
            } else {
                showFloatingText(player.pos, 'ALREADY OWNED', new Color(1, 0.5, 0));
                playerStats.credits += item.cost;
                return;
            }
            break;
        case 'reload_speed':
            if (!upgrades.reloadSpeed) {
                upgrades.reloadSpeed = true;
                message = 'RELOAD -20%';
            } else {
                showFloatingText(player.pos, 'ALREADY OWNED', new Color(1, 0.5, 0));
                playerStats.credits += item.cost;
                return;
            }
            break;
    }

    showFloatingText(player.pos, message, new Color(0, 1, 0.5));
}

// ==================== LEVEL GENERATION ====================

function generateLevel() {
    walls = [];
    doors = [];
    pickups = [];
    enemies = [];
    bullets = [];
    terminals = [];
    explosiveBarrels = [];
    bossActive = false;
    bossHealthPercent = 0;

    levelData = [];
    for (let y = 0; y < LEVEL_HEIGHT; y++) {
        levelData[y] = [];
        for (let x = 0; x < LEVEL_WIDTH; x++) {
            // Border walls
            if (x === 0 || x === LEVEL_WIDTH - 1 || y === 0 || y === LEVEL_HEIGHT - 1) {
                levelData[y][x] = 1; // wall
            } else {
                levelData[y][x] = 0; // floor
            }
        }
    }

    // Create rooms
    const rooms = [];

    // Starting room (empty, safe)
    rooms.push(createRoom(2, 2, 8, 8, 'start'));

    // Room A - enemies
    rooms.push(createRoom(12, 2, 10, 8, 'combat'));

    // Keycard room
    rooms.push(createRoom(24, 2, 8, 8, 'keycard'));

    // Room B - requires green keycard
    rooms.push(createRoom(2, 14, 12, 10, 'locked'));

    // Exit room
    rooms.push(createRoom(18, 14, 10, 10, 'exit'));

    // Connect rooms with corridors
    createCorridor(10, 5, 12, 5);
    createCorridor(22, 5, 24, 5);
    createCorridor(6, 10, 6, 14);
    createCorridor(14, 19, 18, 19);

    // Add doors
    doors.push(new Door(vec2(11, 5), null, true)); // Normal door
    doors.push(new Door(vec2(23, 5), null, true));
    doors.push(new Door(vec2(6, 12), 'green', false)); // Green keycard door
    doors.push(new Door(vec2(16, 19), null, true));

    // Spawn player in starting room
    player = new Player(vec2(6, 6));

    // Spawn enemies in combat rooms
    spawnEnemies(17, 6, 3, 'drone'); // Room A
    spawnEnemies(28, 6, 2, 'spitter'); // Keycard room
    spawnEnemies(17, 5, 1, 'lurker'); // Add lurker

    // Place keycards
    pickups.push(new Pickup(vec2(28, 5), 'keycard_green'));
    pickups.push(new Pickup(vec2(10, 20), 'keycard_blue')); // Blue keycard in locked area

    // Health and ammo pickups
    pickups.push(new Pickup(vec2(5, 5), 'health'));
    pickups.push(new Pickup(vec2(16, 4), 'ammo'));
    pickups.push(new Pickup(vec2(6, 17), 'health_large'));
    pickups.push(new Pickup(vec2(24, 17), 'shield_battery'));

    // Weapon pickups
    pickups.push(new Pickup(vec2(8, 18), 'shotgun'));
    pickups.push(new Pickup(vec2(22, 20), 'smg'));
    pickups.push(new Pickup(vec2(25, 20), 'assault'));
    pickups.push(new Pickup(vec2(20, 22), 'plasma'));

    // Ammo pickups
    pickups.push(new Pickup(vec2(14, 5), 'ammo'));
    pickups.push(new Pickup(vec2(4, 17), 'ammo_rifle'));
    pickups.push(new Pickup(vec2(24, 20), 'ammo_plasma'));

    // Add shop terminal near start
    terminals.push(new Terminal(vec2(4, 4)));

    // More enemies in locked area
    spawnEnemies(8, 18, 4, 'drone');
    spawnEnemies(22, 18, 2, 'brute');
    spawnEnemies(20, 20, 2, 'exploder');
    spawnEnemies(6, 20, 1, 'matriarch');

    // Add explosive barrels
    explosiveBarrels.push({ pos: vec2(15, 5), health: 30 });
    explosiveBarrels.push({ pos: vec2(25, 18), health: 30 });
    explosiveBarrels.push({ pos: vec2(10, 18), health: 30 });
    explosiveBarrels.push({ pos: vec2(20, 17), health: 30 });
}

function createRoom(x, y, w, h, type) {
    // Clear room area
    for (let ry = y; ry < y + h; ry++) {
        for (let rx = x; rx < x + w; rx++) {
            if (ry >= 0 && ry < LEVEL_HEIGHT && rx >= 0 && rx < LEVEL_WIDTH) {
                levelData[ry][rx] = 0;
            }
        }
    }

    // Add room walls
    for (let rx = x - 1; rx <= x + w; rx++) {
        if (rx >= 0 && rx < LEVEL_WIDTH) {
            if (y - 1 >= 0) levelData[y - 1][rx] = 1;
            if (y + h < LEVEL_HEIGHT) levelData[y + h][rx] = 1;
        }
    }
    for (let ry = y; ry < y + h; ry++) {
        if (ry >= 0 && ry < LEVEL_HEIGHT) {
            if (x - 1 >= 0) levelData[ry][x - 1] = 1;
            if (x + w < LEVEL_WIDTH) levelData[ry][x + w] = 1;
        }
    }

    // Add room contents based on type
    if (type === 'combat' || type === 'locked') {
        // Add some obstacles (crates)
        const numObstacles = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numObstacles; i++) {
            const ox = x + 2 + Math.floor(Math.random() * (w - 4));
            const oy = y + 2 + Math.floor(Math.random() * (h - 4));
            if (ox < LEVEL_WIDTH && oy < LEVEL_HEIGHT) {
                levelData[oy][ox] = 2; // Crate
            }
        }
    }

    return { x, y, w, h, type };
}

function createCorridor(x1, y1, x2, y2) {
    const startX = Math.min(x1, x2);
    const endX = Math.max(x1, x2);
    const startY = Math.min(y1, y2);
    const endY = Math.max(y1, y2);

    // Horizontal corridor
    for (let x = startX; x <= endX; x++) {
        if (x >= 0 && x < LEVEL_WIDTH && y1 >= 0 && y1 < LEVEL_HEIGHT) {
            levelData[y1][x] = 0;
            if (y1 - 1 >= 0 && levelData[y1 - 1][x] !== 0) levelData[y1 - 1][x] = 1;
            if (y1 + 1 < LEVEL_HEIGHT && levelData[y1 + 1][x] !== 0) levelData[y1 + 1][x] = 1;
        }
    }

    // Vertical corridor
    for (let y = startY; y <= endY; y++) {
        if (y >= 0 && y < LEVEL_HEIGHT && x2 >= 0 && x2 < LEVEL_WIDTH) {
            levelData[y][x2] = 0;
            if (x2 - 1 >= 0 && levelData[y][x2 - 1] !== 0) levelData[y][x2 - 1] = 1;
            if (x2 + 1 < LEVEL_WIDTH && levelData[y][x2 + 1] !== 0) levelData[y][x2 + 1] = 1;
        }
    }
}

function spawnEnemies(x, y, count, type) {
    for (let i = 0; i < count; i++) {
        const spawnX = x + (Math.random() - 0.5) * 3;
        const spawnY = y + (Math.random() - 0.5) * 3;
        enemies.push(new Enemy(vec2(spawnX, spawnY), type));
    }
}

function isWall(x, y) {
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);

    if (tileX < 0 || tileX >= LEVEL_WIDTH || tileY < 0 || tileY >= LEVEL_HEIGHT) {
        return true;
    }

    const tile = levelData[tileY]?.[tileX];

    // Check doors
    for (const door of doors) {
        if (!door.isOpen) {
            const dx = Math.abs(x - door.pos.x);
            const dy = Math.abs(y - door.pos.y);
            if (dx < door.size.x / 2 + 0.3 && dy < door.size.y / 2 + 0.3) {
                return true;
            }
        }
    }

    return tile === 1 || tile === 2;
}

// ==================== UI & MESSAGES ====================

let messageText = '';
let messageTimer = 0;
let floatingTexts = [];
let cameraShake = 0;

function showMessage(text, duration) {
    messageText = text;
    messageTimer = duration;
}

function showFloatingText(pos, text, color) {
    floatingTexts.push({
        pos: pos.copy(),
        text: text,
        color: color || new Color(1, 1, 1),
        timer: 1.5
    });
}

function activateSelfDestruct() {
    if (!selfDestructActive) {
        selfDestructActive = true;
        selfDestructTimer = 600; // 10 minutes
        showMessage('WARNING: SELF-DESTRUCT SEQUENCE ACTIVATED', 5);
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
}

// Sound-based enemy alert system
function alertEnemiesNearby(pos, radius) {
    for (const enemy of enemies) {
        if (enemy.state === 'patrol' && enemy.pos.distance(pos) < radius) {
            // Check if there's line of sight to the sound
            enemy.lastKnownPos = pos.copy();
            enemy.state = 'search';
            enemy.stateTimer = 5;
        }
    }
}

// ==================== RENDERING ====================

function drawLevel() {
    // Draw floor first
    for (let y = 0; y < LEVEL_HEIGHT; y++) {
        for (let x = 0; x < LEVEL_WIDTH; x++) {
            const tile = levelData[y]?.[x];
            const pos = vec2(x + 0.5, y + 0.5);

            if (tile !== 1) {
                drawRect(pos, vec2(1, 1), COLOR_FLOOR);
            }
        }
    }

    // Draw blood decals on floor
    drawBloodDecals();

    // Draw walls and crates on top
    for (let y = 0; y < LEVEL_HEIGHT; y++) {
        for (let x = 0; x < LEVEL_WIDTH; x++) {
            const tile = levelData[y]?.[x];
            const pos = vec2(x + 0.5, y + 0.5);

            if (tile === 1) {
                drawRect(pos, vec2(1, 1), COLOR_WALL);
            } else if (tile === 2) {
                // Crate
                drawRect(pos, vec2(0.9, 0.9), new Color(0.4, 0.3, 0.2));
            }
        }
    }
}

function drawHUD() {
    const hudLeft = cameraPos.x - 12;
    const hudTop = cameraPos.y + 8;
    const hudBottom = cameraPos.y - 8;
    const hudRight = cameraPos.x + 12;

    // Health bar background
    drawRect(vec2(hudLeft + 4, hudTop - 0.5), vec2(6, 0.6), new Color(0.3, 0, 0));
    // Health bar fill
    const healthPercent = playerStats.health / playerStats.maxHealth;
    drawRect(vec2(hudLeft + 1 + healthPercent * 3, hudTop - 0.5), vec2(6 * healthPercent, 0.6), new Color(1, 0.2, 0.2));
    // Health text
    drawText('HP: ' + Math.floor(playerStats.health) + '/' + playerStats.maxHealth, vec2(hudLeft + 4, hudTop - 0.5), 0.25, new Color(1, 1, 1));

    // Shield bar (if any)
    if (playerStats.maxShield > 0) {
        drawRect(vec2(hudLeft + 4, hudTop - 1.3), vec2(5, 0.4), new Color(0, 0, 0.3));
        const shieldPercent = playerStats.shield / playerStats.maxShield;
        drawRect(vec2(hudLeft + 1.5 + shieldPercent * 2.5, hudTop - 1.3), vec2(5 * shieldPercent, 0.4), new Color(0.3, 0.5, 1));
    }

    // Stamina bar
    const staminaPercent = playerStats.stamina / playerStats.maxStamina;
    drawRect(vec2(hudLeft + 3.5, hudTop - 2), vec2(4, 0.3), new Color(0.2, 0.2, 0));
    drawRect(vec2(hudLeft + 1.5 + staminaPercent * 2, hudTop - 2), vec2(4 * staminaPercent, 0.3), new Color(0.8, 0.8, 0.2));

    // Weapon & Ammo (bottom left)
    const weapon = WEAPONS[currentWeapon];
    drawText(currentWeapon.toUpperCase(), vec2(hudLeft + 2, hudBottom + 1.5), 0.35, new Color(0.8, 0.8, 0.8));
    drawText(currentMag + '/' + weapon.magSize, vec2(hudLeft + 2, hudBottom + 1), 0.3, new Color(1, 1, 0));

    // Reserve ammo
    const reserve = weapon.ammoType === '9mm' ? 'INF' : ammo[weapon.ammoType];
    drawText('Reserve: ' + reserve, vec2(hudLeft + 2, hudBottom + 0.5), 0.25, new Color(0.6, 0.6, 0.6));

    // Credits (bottom left)
    drawText('$' + playerStats.credits, vec2(hudLeft + 1.5, hudBottom + 2.2), 0.4, new Color(1, 0.85, 0));

    // Keycards (bottom right)
    const keycardY = hudBottom + 1;
    const keycardX = hudRight - 2;
    if (playerStats.keycards.green) drawRect(vec2(keycardX - 2.5, keycardY), vec2(0.5, 0.7), COLOR_KEYCARD_GREEN);
    if (playerStats.keycards.blue) drawRect(vec2(keycardX - 1.5, keycardY), vec2(0.5, 0.7), COLOR_KEYCARD_BLUE);
    if (playerStats.keycards.yellow) drawRect(vec2(keycardX - 0.5, keycardY), vec2(0.5, 0.7), new Color(1, 1, 0));
    if (playerStats.keycards.red) drawRect(vec2(keycardX + 0.5, keycardY), vec2(0.5, 0.7), new Color(1, 0, 0));

    // Self-destruct timer (top center)
    if (selfDestructActive) {
        const timerColor = selfDestructTimer < 60 ? new Color(1, 0, 0) :
                          selfDestructTimer < 300 ? new Color(1, 0.5, 0) : new Color(1, 1, 0);
        const pulse = selfDestructTimer < 60 ? Math.sin(time * 8) * 0.2 + 0.8 : 1;
        drawText('SELF-DESTRUCT', vec2(cameraPos.x, hudTop + 0.5), 0.3, timerColor.scale(pulse, 1));
        drawText(formatTime(selfDestructTimer), vec2(cameraPos.x, hudTop - 0.3), 0.6, timerColor.scale(pulse, 1));
    }

    // Boss health bar (below self-destruct if active)
    if (bossActive && bossHealthPercent > 0) {
        const bossY = selfDestructActive ? hudTop - 1.5 : hudTop - 0.5;
        drawRect(vec2(cameraPos.x, bossY), vec2(10, 0.8), new Color(0.3, 0, 0.3));
        drawRect(vec2(cameraPos.x - 5 + bossHealthPercent * 5, bossY), vec2(10 * bossHealthPercent, 0.8), new Color(0.8, 0.1, 0.8));
        drawText('THE QUEEN', vec2(cameraPos.x, bossY + 0.7), 0.35, new Color(1, 0.5, 1));
    }

    // Minimap (top right)
    const minimapX = hudRight - 3;
    const minimapY = hudTop - 2.5;
    const minimapScale = 0.15;

    // Minimap background
    drawRect(vec2(minimapX, minimapY), vec2(5, 4), new Color(0, 0, 0, 0.7));

    // Draw level tiles on minimap
    for (let y = 0; y < LEVEL_HEIGHT; y++) {
        for (let x = 0; x < LEVEL_WIDTH; x++) {
            const tile = levelData[y]?.[x];
            if (tile === 1) {
                const mx = minimapX - 2.5 + x * minimapScale;
                const my = minimapY + 2 - y * minimapScale;
                drawRect(vec2(mx, my), vec2(minimapScale, minimapScale), new Color(0.4, 0.4, 0.4, 0.8));
            }
        }
    }

    // Player position on minimap
    if (player) {
        const px = minimapX - 2.5 + player.pos.x * minimapScale;
        const py = minimapY + 2 - player.pos.y * minimapScale;
        drawRect(vec2(px, py), vec2(0.2, 0.2), new Color(0, 1, 1));
    }

    // Enemy positions on minimap (red dots)
    for (const enemy of enemies) {
        const ex = minimapX - 2.5 + enemy.pos.x * minimapScale;
        const ey = minimapY + 2 - enemy.pos.y * minimapScale;
        const enemyColor = enemy.isBoss ? new Color(1, 0, 1) : new Color(1, 0, 0, 0.7);
        drawRect(vec2(ex, ey), vec2(0.1, 0.1), enemyColor);
    }

    // Shop UI when open
    if (shopOpen) {
        drawShopUI();
    }

    // Center message
    if (messageTimer > 0) {
        messageTimer -= 1/60;
    }
}

function drawShopUI() {
    // Darken background
    drawRect(cameraPos, vec2(18, 14), new Color(0, 0, 0, 0.85));

    // Title
    drawText('INTEX TERMINAL v2.1', cameraPos.add(vec2(0, 5.5)), 0.5, new Color(0, 1, 1));
    drawText('Credits: $' + playerStats.credits, cameraPos.add(vec2(0, 4.5)), 0.4, new Color(1, 0.85, 0));

    // Items
    for (let i = 0; i < SHOP_ITEMS.length; i++) {
        const item = SHOP_ITEMS[i];
        const y = 3 - i * 1.1;
        const canAfford = playerStats.credits >= item.cost;
        const color = canAfford ? new Color(1, 1, 1) : new Color(0.5, 0.5, 0.5);

        drawText((i + 1) + '. ' + item.name, cameraPos.add(vec2(-6, y)), 0.3, color);
        drawText('$' + item.cost, cameraPos.add(vec2(5, y)), 0.3, canAfford ? new Color(1, 0.85, 0) : new Color(0.5, 0.4, 0));
    }

    // Instructions
    drawText('Press 1-8 to buy | ESC to close', cameraPos.add(vec2(0, -5.5)), 0.25, new Color(0.6, 0.6, 0.6));
}

function drawMenu() {
    // Clear with dark background
    drawRect(vec2(LEVEL_WIDTH/2, LEVEL_HEIGHT/2), vec2(LEVEL_WIDTH, LEVEL_HEIGHT), new Color(0.05, 0.05, 0.1));

    // Title
    drawText('STATION BREACH', vec2(LEVEL_WIDTH/2, LEVEL_HEIGHT/2 + 5), 1.5, new Color(0, 0.8, 0.8));

    // Subtitle
    drawText('A Twin-Stick Survival Horror', vec2(LEVEL_WIDTH/2, LEVEL_HEIGHT/2 + 2), 0.5, new Color(0.5, 0.5, 0.5));

    // Start prompt
    const blink = Math.sin(time * 3) > 0;
    if (blink) {
        drawText('CLICK or PRESS SPACE TO START', vec2(LEVEL_WIDTH/2, LEVEL_HEIGHT/2 - 3), 0.4, new Color(1, 1, 1));
    }

    // Controls
    drawText('WASD: Move | Mouse: Aim | LMB: Shoot | F: Melee', vec2(LEVEL_WIDTH/2, LEVEL_HEIGHT/2 - 6), 0.3, new Color(0.6, 0.6, 0.6));
    drawText('R: Reload | Q: Switch Weapon | E: Interact | Shift: Sprint', vec2(LEVEL_WIDTH/2, LEVEL_HEIGHT/2 - 7.5), 0.3, new Color(0.6, 0.6, 0.6));
}

// ==================== LITTLEJS ENGINE HOOKS ====================

function gameInit() {
    // Initialize LittleJS
    canvasFixedSize = vec2(1280, 720);
    cameraPos = vec2(LEVEL_WIDTH/2, LEVEL_HEIGHT/2);
    cameraScale = 24;
}

function gameUpdate() {
    if (gameState === 'menu') {
        if (mouseWasPressed(0) || keyWasPressed('Space')) {
            gameState = 'playing';
            generateLevel();
        }
        return;
    }

    if (gameState === 'dead') {
        if (mouseWasPressed(0) || keyWasPressed('Space')) {
            gameState = 'playing';
            playerStats.health = playerStats.maxHealth;
            playerStats.shield = playerStats.maxShield;
            generateLevel();
        }
        return;
    }

    // Pause toggle
    if (keyWasPressed('Escape') && !shopOpen) {
        gamePaused = !gamePaused;
        pauseMenuIndex = 0;
    }

    // Pause menu handling
    if (gamePaused) {
        if (keyWasPressed('KeyW') || keyWasPressed('ArrowUp')) {
            pauseMenuIndex = (pauseMenuIndex - 1 + PAUSE_OPTIONS.length) % PAUSE_OPTIONS.length;
        }
        if (keyWasPressed('KeyS') || keyWasPressed('ArrowDown')) {
            pauseMenuIndex = (pauseMenuIndex + 1) % PAUSE_OPTIONS.length;
        }
        if (keyWasPressed('Space') || keyWasPressed('Enter')) {
            switch (pauseMenuIndex) {
                case 0: // Resume
                    gamePaused = false;
                    break;
                case 1: // Restart
                    gamePaused = false;
                    gameState = 'playing';
                    playerStats.health = playerStats.maxHealth;
                    generateLevel();
                    break;
                case 2: // Quit to Menu
                    gamePaused = false;
                    gameState = 'menu';
                    break;
            }
        }
        return;
    }

    // Shop input handling
    if (shopOpen) {
        if (keyWasPressed('Escape')) {
            shopOpen = false;
        }
        for (let i = 1; i <= 8; i++) {
            if (keyWasPressed('Digit' + i)) {
                purchaseItem(i - 1);
            }
        }
        return; // Don't process other input while shop is open
    }

    // Terminal interaction
    if (keyWasPressed('KeyE') && player) {
        for (const terminal of terminals) {
            if (player.pos.distance(terminal.pos) < 2) {
                terminal.interact();
            }
        }
    }

    // Update self-destruct timer
    if (selfDestructActive && selfDestructTimer > 0) {
        selfDestructTimer -= 1/60;
        if (selfDestructTimer <= 0) {
            gameState = 'dead';
            showMessage('STATION DESTROYED - YOU FAILED TO ESCAPE', 5);
        }
    }

    // Update camera to follow player
    if (player) {
        cameraPos = cameraPos.lerp(player.pos, 0.1);

        // Camera shake
        if (cameraShake > 0) {
            cameraPos = cameraPos.add(vec2(
                (Math.random() - 0.5) * cameraShake,
                (Math.random() - 0.5) * cameraShake
            ));
            cameraShake *= 0.9;
        }
    }

    // Update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].timer -= 1/60;
        floatingTexts[i].pos.y += 0.02;
        if (floatingTexts[i].timer <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function gameUpdatePost() {
    // Post-update
}

function gameRender() {
    if (gameState === 'menu') {
        drawMenu();
        return;
    }

    // Draw level
    drawLevel();

    // Draw explosive barrels
    for (const barrel of explosiveBarrels) {
        drawRect(barrel.pos, vec2(0.8, 0.8), new Color(0.8, 0.3, 0.1));
        // Hazard stripes
        drawRect(barrel.pos.add(vec2(0, 0.2)), vec2(0.6, 0.15), new Color(1, 0.8, 0));
    }

    // Draw doors
    for (const door of doors) {
        door.render();
    }

    // Draw pickups
    for (const pickup of pickups) {
        pickup.render();
    }

    // Draw terminals
    for (const terminal of terminals) {
        terminal.render();
    }

    // Draw enemies
    for (const enemy of enemies) {
        enemy.render();
    }

    // Draw player
    if (player) {
        player.render();
    }

    // Draw bullets
    for (const bullet of bullets) {
        bullet.render();
    }

    // Draw floating texts
    for (const ft of floatingTexts) {
        const alpha = ft.timer / 1.5;
        drawText(ft.text, ft.pos, 0.4, ft.color.scale(alpha, 1));
    }

    // Draw center message
    if (messageTimer > 0) {
        drawText(messageText, vec2(cameraPos.x, cameraPos.y + 5), 0.6, new Color(1, 1, 0));
    }

    // Draw game over
    if (gameState === 'dead') {
        drawRect(cameraPos, vec2(20, 10), new Color(0, 0, 0, 0.8));
        drawText('GAME OVER', cameraPos.add(vec2(0, 2)), 1, new Color(1, 0, 0));
        drawText('Click to Restart', cameraPos.add(vec2(0, -1)), 0.4, new Color(1, 1, 1));
    }

    // Draw pause menu
    if (gamePaused) {
        drawRect(cameraPos, vec2(20, 14), new Color(0, 0, 0, 0.85));
        drawText('PAUSED', cameraPos.add(vec2(0, 4)), 0.8, new Color(0, 1, 1));

        for (let i = 0; i < PAUSE_OPTIONS.length; i++) {
            const y = 1 - i * 1.5;
            const color = i === pauseMenuIndex ? new Color(1, 1, 0) : new Color(0.7, 0.7, 0.7);
            const prefix = i === pauseMenuIndex ? '> ' : '  ';
            drawText(prefix + PAUSE_OPTIONS[i], cameraPos.add(vec2(0, y)), 0.5, color);
        }

        drawText('W/S to navigate, SPACE to select', cameraPos.add(vec2(0, -4)), 0.3, new Color(0.5, 0.5, 0.5));
    }
}

// Blood decal functions
function addBloodDecal(pos) {
    bloodDecals.push({
        pos: pos.copy(),
        size: 0.3 + Math.random() * 0.4,
        alpha: 0.8
    });

    // Limit decals
    if (bloodDecals.length > MAX_BLOOD_DECALS) {
        bloodDecals.shift();
    }
}

function drawBloodDecals() {
    for (const decal of bloodDecals) {
        drawRect(decal.pos, vec2(decal.size, decal.size * 0.6), new Color(0, 0.8, 0.3, decal.alpha));
    }
}

function gameRenderPost() {
    // Draw HUD in screen space (after world rendering)
    if (gameState === 'playing') {
        drawHUD();
    }
}

// Start the engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
