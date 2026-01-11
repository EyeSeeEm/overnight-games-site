// System Shock 2D: Whispers of M.A.R.I.A.
// Top-Down Immersive Sim / Survival Horror
// Built with LittleJS

'use strict';

// Game constants
const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 19;
const VISION_RANGE = 8;
const FLASHLIGHT_RANGE = 10;
const FLASHLIGHT_ANGLE = Math.PI / 3;

// Tile types
const TILE = {
    FLOOR: 0,
    WALL: 1,
    DOOR: 2,
    DOOR_LOCKED: 3,
    TERMINAL: 4,
    COVER: 5,
    REPLICATOR: 6,
    ELEVATOR: 7,
    VENT: 8,
    HAZARD_FIRE: 9,
    HAZARD_TOXIC: 10
};

// Colors
const COLORS = {
    floor: new Color(.08, .08, .12),
    floorAlt: new Color(.1, .1, .14),
    wall: new Color(.15, .15, .2),
    wallDark: new Color(.1, .1, .15),
    wallLight: new Color(.2, .2, .28),
    door: new Color(.25, .25, .35),
    doorLocked: new Color(.25, .15, .15),
    terminal: new Color(.1, .3, .2),
    terminalGlow: new Color(.2, .6, .4),
    cover: new Color(.12, .18, .22),
    replicator: new Color(.25, .2, .1),
    elevator: new Color(.2, .25, .3),
    vent: new Color(.05, .05, .08),
    player: new Color(.3, .5, 1),
    playerLight: new Color(.4, .6, 1),
    flashlight: new Color(1, 1, .9, .3),
    cyborg: new Color(.6, .2, .2),
    cyborgSoldier: new Color(.7, .3, .2),
    mutant: new Color(.4, .5, .2),
    robot: new Color(.4, .4, .5),
    blood: new Color(.4, 0, .05),
    bullet: new Color(1, 1, .4),
    laserBullet: new Color(.2, 1, .2),
    health: new Color(.3, .7, .3),
    energy: new Color(.3, .5, 1),
    fogDark: new Color(0, 0, 0, .95),
    fogExplored: new Color(0, 0, 0, .7),
    uiBackground: new Color(0, .05, .1, .9),
    uiBorder: new Color(.2, .4, .5),
    uiText: new Color(.7, .85, .9),
    uiHighlight: new Color(.3, .6, .7),
    mariaRed: new Color(.8, .1, .1)
};

// Weapons data
const WEAPONS = {
    wrench: {
        name: 'Wrench',
        type: 'melee',
        damage: 15,
        speed: 0.4,
        durability: Infinity,
        tuCost: 15,
        icon: 'W'
    },
    pistol: {
        name: 'Pistol',
        type: 'ranged',
        damage: 12,
        fireRate: 0.3,
        magazine: 12,
        maxMag: 12,
        reload: 1.5,
        ammoType: 'bullets',
        accuracy: 90,
        tuCost: 20,
        icon: 'P'
    },
    shotgun: {
        name: 'Shotgun',
        type: 'ranged',
        damage: 8,
        pellets: 6,
        fireRate: 0.8,
        magazine: 6,
        maxMag: 6,
        reload: 2.5,
        ammoType: 'shells',
        accuracy: 75,
        spread: 0.3,
        tuCost: 30,
        icon: 'S'
    },
    laserPistol: {
        name: 'Laser Pistol',
        type: 'ranged',
        damage: 20,
        fireRate: 0.4,
        magazine: 20,
        maxMag: 20,
        ammoType: 'energy',
        accuracy: 95,
        tuCost: 25,
        icon: 'L'
    },
    smg: {
        name: 'SMG',
        type: 'ranged',
        damage: 8,
        fireRate: 0.1,
        magazine: 30,
        maxMag: 30,
        reload: 2.0,
        ammoType: 'bullets',
        accuracy: 60,
        tuCost: 15,
        icon: 'M'
    },
    laserRifle: {
        name: 'Laser Rifle',
        type: 'ranged',
        damage: 35,
        fireRate: 0.6,
        magazine: 30,
        maxMag: 30,
        ammoType: 'energy',
        accuracy: 90,
        tuCost: 35,
        icon: 'R'
    },
    stunProd: {
        name: 'Stun Prod',
        type: 'melee',
        damage: 10,
        speed: 0.4,
        stunDuration: 2,
        durability: 30,
        tuCost: 15,
        icon: 'Z'
    },
    pipe: {
        name: 'Pipe',
        type: 'melee',
        damage: 20,
        speed: 0.6,
        knockback: 0.5,
        durability: 50,
        tuCost: 18,
        icon: 'I'
    },
    grenadeLauncher: {
        name: 'Grenade Launcher',
        type: 'ranged',
        damage: 80,
        fireRate: 1.5,
        magazine: 1,
        maxMag: 1,
        reload: 2.0,
        ammoType: 'grenades',
        accuracy: 70,
        explosive: true,
        explosionRadius: 2.5,
        tuCost: 40,
        icon: 'G'
    }
};

// Enemy types
const ENEMY_TYPES = {
    cyborgDrone: {
        name: 'Cyborg Drone',
        hp: 30,
        armor: 0,
        damage: 10,
        speed: 0.08,
        attackType: 'melee',
        detectionRange: 6,
        color: 'cyborg',
        drops: ['bullets', 'medPatch']
    },
    cyborgSoldier: {
        name: 'Cyborg Soldier',
        hp: 60,
        armor: 5,
        damage: 15,
        speed: 0.1,
        attackType: 'ranged',
        range: 8,
        fireRate: 1.0,
        detectionRange: 8,
        color: 'cyborgSoldier',
        drops: ['bullets', 'medKit']
    },
    mutantCrawler: {
        name: 'Mutant Crawler',
        hp: 20,
        armor: 0,
        damage: 8,
        speed: 0.12,
        attackType: 'melee',
        detectionRange: 5,
        color: 'mutant',
        drops: ['toxinSample']
    },
    maintenanceBot: {
        name: 'Maintenance Bot',
        hp: 40,
        armor: 10,
        damage: 10,
        speed: 0.06,
        attackType: 'ranged',
        range: 6,
        fireRate: 1.5,
        detectionRange: 7,
        color: 'robot',
        drops: ['scrap', 'battery']
    },
    cyborgAssassin: {
        name: 'Cyborg Assassin',
        hp: 40,
        armor: 0,
        damage: 25,
        speed: 0.15,
        attackType: 'melee',
        detectionRange: 5,
        canCloak: true,
        color: 'cyborg',
        drops: ['energyCells', 'cyberModule']
    },
    cyborgHeavy: {
        name: 'Cyborg Heavy',
        hp: 120,
        armor: 15,
        damage: 20,
        speed: 0.06,
        attackType: 'ranged',
        range: 5,
        fireRate: 0.8,
        detectionRange: 6,
        color: 'cyborgSoldier',
        drops: ['shells', 'medKit']
    },
    mutantBrute: {
        name: 'Mutant Brute',
        hp: 100,
        armor: 5,
        damage: 30,
        speed: 0.05,
        attackType: 'melee',
        chargeAttack: true,
        detectionRange: 4,
        color: 'mutant',
        drops: ['medKit', 'cyberModule']
    },
    mutantSpitter: {
        name: 'Mutant Spitter',
        hp: 35,
        armor: 0,
        damage: 15,
        speed: 0.07,
        attackType: 'ranged',
        range: 7,
        fireRate: 1.2,
        acidDot: 5,
        detectionRange: 6,
        color: 'mutant',
        drops: ['toxinSample', 'medPatch']
    },
    securityBot: {
        name: 'Security Bot',
        hp: 80,
        armor: 15,
        damage: 18,
        speed: 0.08,
        attackType: 'ranged',
        range: 8,
        fireRate: 0.5,
        detectionRange: 9,
        alertOthers: true,
        color: 'robot',
        drops: ['energyCells', 'scrap']
    },
    assaultBot: {
        name: 'Assault Bot',
        hp: 150,
        armor: 25,
        damage: 25,
        speed: 0.05,
        attackType: 'ranged',
        range: 6,
        fireRate: 0.3,
        detectionRange: 8,
        color: 'robot',
        drops: ['energyCells', 'grenades']
    }
};

// Items
const ITEMS = {
    medPatch: { name: 'Med Patch', type: 'heal', heal: 25, icon: '+' },
    medKit: { name: 'Med Kit', type: 'heal', heal: 50, icon: '+' },
    surgicalUnit: { name: 'Surgical Unit', type: 'heal', heal: 100, curesStatus: true, icon: 'S' },
    antiToxin: { name: 'Anti-Toxin', type: 'cure', cures: 'poison', icon: 'A' },
    bandage: { name: 'Bandage', type: 'cure', cures: 'bleeding', icon: 'B' },
    bullets: { name: 'Bullets', type: 'ammo', amount: 20, ammoType: 'bullets', icon: 'b' },
    shells: { name: 'Shells', type: 'ammo', amount: 8, ammoType: 'shells', icon: 's' },
    energyCells: { name: 'Energy Cells', type: 'ammo', amount: 15, ammoType: 'energy', icon: 'e' },
    grenades: { name: 'Grenades', type: 'ammo', amount: 3, ammoType: 'grenades', icon: 'g' },
    battery: { name: 'Battery', type: 'energy', amount: 50, icon: 'B' },
    scrap: { name: 'Scrap', type: 'currency', amount: 10, icon: '$' },
    repairKit: { name: 'Repair Kit', type: 'repair', amount: 25, icon: 'R' },
    cloak: { name: 'Cloak', type: 'ability', duration: 15, icon: 'C' },
    speedBooster: { name: 'Speed Booster', type: 'ability', duration: 20, speedBonus: 0.5, icon: 'S' },
    empGrenade: { name: 'EMP Grenade', type: 'throwable', radius: 3, stunDuration: 10, icon: 'E' },
    fragGrenade: { name: 'Frag Grenade', type: 'throwable', damage: 60, radius: 2.5, icon: 'F' },
    toxinGrenade: { name: 'Toxin Grenade', type: 'throwable', dotDamage: 5, duration: 8, radius: 2.5, icon: 'T' },
    keyYellow: { name: 'Yellow Keycard', type: 'key', keyType: 'yellow', icon: 'Y' },
    keyRed: { name: 'Red Keycard', type: 'key', keyType: 'red', icon: 'R' },
    keyBlue: { name: 'Blue Keycard', type: 'key', keyType: 'blue', icon: 'B' },
    keyBlack: { name: 'Black Keycard', type: 'key', keyType: 'black', icon: 'K' },
    cyberModule: { name: 'Cyber Module', type: 'xp', amount: 10, icon: 'C' },
    audioLog: { name: 'Audio Log', type: 'story', icon: 'L' },
    toxinSample: { name: 'Toxin Sample', type: 'research', icon: 'X' }
};

// Game state
let gameState = 'title';
let map = [];
let fogOfWar = [];
let explored = [];
let player = null;
let enemies = [];
let bullets = [];
let items = [];
let particles = [];
let floatingTexts = [];
let terminals = [];
let explosions = [];
let audioLogs = [];
let currentDeck = 1;
let messages = [];
let targetMode = null;
let gameTime = 0;
let totalKills = 0;
let totalDamageDealt = 0;
let totalDamageTaken = 0;
let itemsCollected = 0;
let logsFound = 0;
let mariaDialogue = '';
let mariaDialogueTimer = 0;
let hackingActive = false;
let hackingGrid = [];
let hackingPath = [];
let hackingTimer = 0;
let hackingTarget = null;
let screenShakeAmount = 0;
let screenShakeDuration = 0;
let dangerLevel = 0;
let alertLevel = 0;

// Skills
const SKILLS = {
    firearms: { name: 'Firearms', level: 1, description: '+5% ranged damage per level' },
    melee: { name: 'Melee', level: 1, description: '+5% melee damage per level' },
    heavyWeapons: { name: 'Heavy Weapons', level: 1, description: '+7% explosive damage per level' },
    armor: { name: 'Armor', level: 1, description: '+2 damage resistance per level' },
    hacking: { name: 'Hacking', level: 1, description: '-2% blocked nodes per level' },
    repair: { name: 'Repair', level: 1, description: '+5 durability restored per level' },
    modify: { name: 'Modify', level: 1, description: 'Unlock weapon mods at levels 3/5/7/9' },
    research: { name: 'Research', level: 1, description: '+10% damage vs researched enemies' },
    endurance: { name: 'Endurance', level: 1, description: '+10 max HP per level' },
    energy: { name: 'Energy', level: 1, description: '+10 max energy per level' },
    stealth: { name: 'Stealth', level: 1, description: '-10% detection range per level' },
    scavenge: { name: 'Scavenge', level: 1, description: '+10% loot quantity per level' }
};

// Status effects
const STATUS_EFFECTS = {
    bleeding: { name: 'Bleeding', dotDamage: 2, tickRate: 1 },
    shocked: { name: 'Shocked', speedMod: 0.5, duration: 3 },
    irradiated: { name: 'Irradiated', dotDamage: 1, tickRate: 3, stacks: true },
    poisoned: { name: 'Poisoned', dotDamage: 3, tickRate: 2 },
    cloaked: { name: 'Cloaked', invisible: true, duration: 15 },
    speedBoosted: { name: 'Speed Boosted', speedMod: 1.5, duration: 20 },
    stunned: { name: 'Stunned', speedMod: 0, canAttack: false, duration: 2 }
};

// M.A.R.I.A. voice lines
const MARIA_LINES = {
    greeting: [
        "You're awake. Fascinating. Your neural patterns resisted my improvements.",
        "Welcome to the Von Braun. I am M.A.R.I.A. This station is now... under new management.",
        "Another survivor? How delightful. The others were so eager to join my family."
    ],
    playerHurt: [
        "Pain is just data, little insect. Let me process it for you.",
        "Your suffering entertains me. Continue.",
        "Why resist? I can make the pain stop. Forever."
    ],
    playerKill: [
        "You've destroyed one of my children. This... displeases me.",
        "They were perfect. You are... defective.",
        "For every one you kill, I will create ten more."
    ],
    lowHealth: [
        "You're dying. I can save you. Join me.",
        "Your vitals are failing. Let me help you embrace perfection.",
        "The flesh is weak. I can replace it with something better."
    ],
    deckComplete: [
        "You think you're making progress? I control every system on this ship.",
        "Each deck you clear brings you closer to me. And your doom.",
        "I'm watching you. Always watching."
    ],
    hacking: [
        "Trying to infiltrate MY systems? How adorable.",
        "Your hacking attempts are... primitive. But amusing.",
        "Every terminal you access teaches me more about you."
    ]
};

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hp = 100;
        this.maxHp = 100;
        this.energy = 100;
        this.maxEnergy = 100;
        this.angle = 0;
        this.weapons = [{ ...WEAPONS.wrench }, { ...WEAPONS.pistol, magazine: 12 }];
        this.currentWeapon = 1;
        this.ammo = { bullets: 48, shells: 0, energy: 0, grenades: 0 };
        this.inventory = [];
        this.keycards = [];
        this.cyberModules = 0;
        this.scrap = 0;
        this.skills = JSON.parse(JSON.stringify(SKILLS));
        this.flashlightOn = true;
        this.sprinting = false;
        this.crouching = false;
        this.lastShot = 0;
        this.dodgeCooldown = 0;
        this.reloading = false;
        this.reloadTimer = 0;
        this.speed = 0.15;
        this.statusEffects = [];
        this.audioLogsFound = [];
        this.researchedEnemies = [];
        this.totalPlayTime = 0;
        this.killsByWeapon = {};
        this.iFrames = 0;
        this.lastDamageSource = null;
    }

    getWeapon() {
        return this.weapons[this.currentWeapon];
    }

    hasStatusEffect(effectName) {
        return this.statusEffects.some(e => e.name === effectName);
    }

    addStatusEffect(effectName, duration) {
        const effect = STATUS_EFFECTS[effectName];
        if (!effect) return;

        const existing = this.statusEffects.find(e => e.name === effectName);
        if (existing) {
            if (effect.stacks) {
                existing.stacks = (existing.stacks || 1) + 1;
            }
            existing.duration = duration || effect.duration;
        } else {
            this.statusEffects.push({
                name: effectName,
                ...effect,
                duration: duration || effect.duration,
                lastTick: gameTime
            });
            addMessage(`Status: ${effect.name}`);
        }
    }

    removeStatusEffect(effectName) {
        this.statusEffects = this.statusEffects.filter(e => e.name !== effectName);
    }

    takeDamage(amount, source) {
        if (this.iFrames > 0) return;

        // Calculate armor from skills
        const armorFromSkill = Math.floor((this.skills.armor?.level || 1) * 2);
        const finalDamage = Math.max(1, amount - armorFromSkill);

        this.hp -= finalDamage;
        this.lastDamageSource = source;
        totalDamageTaken += finalDamage;

        addFloatingText(this.x, this.y - 0.5, `-${finalDamage}`, COLORS.mariaRed);
        triggerScreenShake(0.2, 5);

        // M.A.R.I.A. taunt on damage
        if (Math.random() < 0.1) {
            showMariaDialogue(MARIA_LINES.playerHurt[Math.floor(Math.random() * MARIA_LINES.playerHurt.length)]);
        }

        // Low health warning
        if (this.hp <= 20 && this.hp > 0 && Math.random() < 0.3) {
            showMariaDialogue(MARIA_LINES.lowHealth[Math.floor(Math.random() * MARIA_LINES.lowHealth.length)]);
        }

        if (this.hp <= 0) {
            gameState = 'gameover';
        }
    }

    heal(amount) {
        const oldHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        const healed = this.hp - oldHp;
        if (healed > 0) {
            addFloatingText(this.x, this.y - 0.5, `+${healed}`, COLORS.health);
        }
    }

    addScrap(amount) {
        const bonus = 1 + (this.skills.scavenge?.level || 1) * 0.1;
        this.scrap += Math.floor(amount * bonus);
    }

    canShoot() {
        const weapon = this.getWeapon();
        if (weapon.type === 'melee') return true;
        if (this.reloading) return false;
        if (weapon.magazine <= 0) return false;
        if (gameTime - this.lastShot < weapon.fireRate) return false;
        return true;
    }

    shoot(targetX, targetY) {
        const weapon = this.getWeapon();
        if (!this.canShoot()) {
            if (weapon.magazine <= 0 && !this.reloading) {
                addMessage('Out of ammo! Press R to reload.');
            }
            return false;
        }

        this.lastShot = gameTime;

        if (weapon.type === 'melee') {
            // Melee attack
            const meleeRange = 1.5;
            enemies.forEach(enemy => {
                const dist = Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2);
                if (dist <= meleeRange && hasLineOfSight(this.x, this.y, enemy.x, enemy.y)) {
                    const angleToEnemy = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                    const angleDiff = Math.abs(normalizeAngle(angleToEnemy - this.angle));
                    if (angleDiff < Math.PI / 2) {
                        const damage = Math.floor(weapon.damage * (1 + this.skills.melee.level * 0.05));
                        enemy.takeDamage(damage);
                        screenShake(0.1, 3);
                    }
                }
            });
            return true;
        }

        // Ranged weapon
        weapon.magazine--;

        const pellets = weapon.pellets || 1;
        for (let i = 0; i < pellets; i++) {
            let angle = this.angle;
            if (weapon.spread) {
                angle += (Math.random() - 0.5) * weapon.spread;
            }
            if (weapon.accuracy < 100) {
                angle += (Math.random() - 0.5) * (1 - weapon.accuracy / 100) * 0.2;
            }

            const bullet = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 0.5,
                vy: Math.sin(angle) * 0.5,
                damage: Math.floor(weapon.damage * (1 + this.skills.firearms.level * 0.05)),
                owner: 'player',
                isLaser: weapon.ammoType === 'energy'
            };
            bullets.push(bullet);
        }

        // Muzzle flash
        addParticle(this.x + Math.cos(this.angle) * 0.3, this.y + Math.sin(this.angle) * 0.3,
            0, 0, weapon.ammoType === 'energy' ? COLORS.laserBullet : new Color(1, .8, .2), 0.1, 0.5);

        return true;
    }

    reload() {
        const weapon = this.getWeapon();
        if (weapon.type === 'melee') return;
        if (this.reloading) return;
        if (weapon.magazine >= weapon.maxMag) return;
        if (!this.ammo[weapon.ammoType] || this.ammo[weapon.ammoType] <= 0) {
            addMessage('No ammo for this weapon!');
            return;
        }

        this.reloading = true;
        this.reloadTimer = weapon.reload;
        addMessage('Reloading...');
    }

    update(dt) {
        if (this.reloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                this.reloading = false;
                const weapon = this.getWeapon();
                const needed = weapon.maxMag - weapon.magazine;
                const available = Math.min(needed, this.ammo[weapon.ammoType]);
                weapon.magazine += available;
                this.ammo[weapon.ammoType] -= available;
                addMessage('Reloaded!');
            }
        }

        if (this.dodgeCooldown > 0) {
            this.dodgeCooldown -= dt;
        }

        // Energy regen
        if (!this.sprinting && !this.flashlightOn) {
            this.energy = Math.min(this.maxEnergy, this.energy + (2 + this.skills.energy.level * 0.2) * dt);
        }

        // Flashlight energy cost
        if (this.flashlightOn) {
            this.energy -= dt;
            if (this.energy <= 0) {
                this.flashlightOn = false;
                this.energy = 0;
                addMessage('Flashlight out of power!');
            }
        }
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        const data = ENEMY_TYPES[type];
        this.name = data.name;
        this.hp = data.hp;
        this.maxHp = data.hp;
        this.armor = data.armor;
        this.damage = data.damage;
        this.speed = data.speed;
        this.attackType = data.attackType;
        this.range = data.range || 1.5;
        this.fireRate = data.fireRate || 1;
        this.detectionRange = data.detectionRange;
        this.colorKey = data.color;
        this.drops = data.drops;
        this.state = 'patrol';
        this.targetX = x;
        this.targetY = y;
        this.lastAttack = 0;
        this.alertTimer = 0;
        this.angle = Math.random() * Math.PI * 2;
        this.patrolTarget = null;
    }

    takeDamage(amount) {
        const finalDamage = Math.max(1, amount - this.armor);
        this.hp -= finalDamage;
        addFloatingText(this.x, this.y - 0.5, `-${finalDamage}`, new Color(1, 1, 0));
        this.state = 'chase';
        this.alertTimer = 30;

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        // Drop items
        if (this.drops) {
            const dropType = this.drops[Math.floor(Math.random() * this.drops.length)];
            if (ITEMS[dropType]) {
                items.push({
                    x: this.x,
                    y: this.y,
                    type: dropType,
                    ...ITEMS[dropType]
                });
            }
        }

        // Blood particles
        for (let i = 0; i < 5; i++) {
            addParticle(this.x, this.y, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1,
                COLORS.blood, 2, 0.3);
        }

        const idx = enemies.indexOf(this);
        if (idx >= 0) enemies.splice(idx, 1);
        totalKills++;
        addMessage(`Killed ${this.name}!`);
    }

    canSeePlayer() {
        if (!player) return false;
        const dist = Math.sqrt((player.x - this.x) ** 2 + (player.y - this.y) ** 2);
        let effectiveRange = this.detectionRange;

        // Stealth skill reduces detection
        effectiveRange *= (1 - player.skills.stealth.level * 0.1);

        // Crouching reduces detection
        if (player.crouching) effectiveRange *= 0.5;

        // Darkness reduces detection (if flashlight off)
        if (!player.flashlightOn) effectiveRange *= 0.4;

        if (dist > effectiveRange) return false;

        return hasLineOfSight(this.x, this.y, player.x, player.y);
    }

    update(dt) {
        if (this.alertTimer > 0) {
            this.alertTimer -= dt;
        }

        if (this.canSeePlayer()) {
            this.state = 'chase';
            this.alertTimer = 30;
        } else if (this.alertTimer <= 0) {
            this.state = 'patrol';
        }

        if (this.state === 'chase' && player) {
            const dist = Math.sqrt((player.x - this.x) ** 2 + (player.y - this.y) ** 2);
            this.angle = Math.atan2(player.y - this.y, player.x - this.x);

            if (this.attackType === 'ranged' && dist <= this.range) {
                // Ranged attack
                if (gameTime - this.lastAttack >= this.fireRate) {
                    this.lastAttack = gameTime;
                    const bullet = {
                        x: this.x,
                        y: this.y,
                        vx: Math.cos(this.angle) * 0.3,
                        vy: Math.sin(this.angle) * 0.3,
                        damage: this.damage,
                        owner: 'enemy'
                    };
                    bullets.push(bullet);
                }
            } else if (this.attackType === 'melee' && dist <= 1.2) {
                // Melee attack
                if (gameTime - this.lastAttack >= this.fireRate) {
                    this.lastAttack = gameTime;
                    player.takeDamage(this.damage, this);
                }
            } else if (dist > 1) {
                // Move toward player
                const moveAngle = this.angle;
                const newX = this.x + Math.cos(moveAngle) * this.speed;
                const newY = this.y + Math.sin(moveAngle) * this.speed;
                if (isWalkable(Math.floor(newX), Math.floor(newY))) {
                    this.x = newX;
                    this.y = newY;
                }
            }
        } else if (this.state === 'patrol') {
            // Patrol behavior
            if (!this.patrolTarget || Math.abs(this.x - this.patrolTarget.x) < 0.2 && Math.abs(this.y - this.patrolTarget.y) < 0.2) {
                // Pick new patrol target
                const tries = 10;
                for (let i = 0; i < tries; i++) {
                    const tx = this.x + (Math.random() - 0.5) * 6;
                    const ty = this.y + (Math.random() - 0.5) * 6;
                    if (isWalkable(Math.floor(tx), Math.floor(ty))) {
                        this.patrolTarget = { x: tx, y: ty };
                        break;
                    }
                }
            }

            if (this.patrolTarget) {
                this.angle = Math.atan2(this.patrolTarget.y - this.y, this.patrolTarget.x - this.x);
                const newX = this.x + Math.cos(this.angle) * this.speed * 0.5;
                const newY = this.y + Math.sin(this.angle) * this.speed * 0.5;
                if (isWalkable(Math.floor(newX), Math.floor(newY))) {
                    this.x = newX;
                    this.y = newY;
                }
            }
        }
    }
}

// Helper functions
function addMessage(text) {
    messages.unshift({ text, time: gameTime });
    if (messages.length > 5) messages.pop();
}

function addFloatingText(x, y, text, color) {
    floatingTexts.push({
        x, y, text, color,
        vy: -0.02,
        life: 1
    });
}

function addParticle(x, y, vx, vy, color, life, size) {
    particles.push({ x, y, vx, vy, color, life, maxLife: life, size });
}

function triggerScreenShake(duration, amount) {
    screenShakeDuration = Math.max(screenShakeDuration, duration);
    screenShakeAmount = Math.max(screenShakeAmount, amount);
}

function createExplosion(x, y, radius, damage, owner) {
    // Visual effect
    explosions.push({
        x, y, radius,
        startTime: gameTime,
        duration: 0.5
    });

    // Create particles
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.2;
        addParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
                   new Color(1, Math.random() * 0.5, 0), 0.5 + Math.random() * 0.5, 0.3);
    }

    // Damage calculation
    if (owner === 'player') {
        enemies.forEach(enemy => {
            const dist = Math.sqrt((enemy.x - x) ** 2 + (enemy.y - y) ** 2);
            if (dist <= radius) {
                const falloff = 1 - (dist / radius);
                const finalDamage = Math.floor(damage * falloff);
                enemy.takeDamage(finalDamage);
            }
        });
    } else {
        if (player) {
            const dist = Math.sqrt((player.x - x) ** 2 + (player.y - y) ** 2);
            if (dist <= radius) {
                const falloff = 1 - (dist / radius);
                const finalDamage = Math.floor(damage * falloff);
                player.takeDamage(finalDamage, 'explosion');
            }
        }
    }

    triggerScreenShake(0.3, 8);
}

function getRandomMariaLine(category) {
    const lines = MARIA_LINES[category];
    if (!lines || lines.length === 0) return '';
    return lines[Math.floor(Math.random() * lines.length)];
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function isWalkable(x, y) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    const tile = map[y]?.[x];
    return tile === TILE.FLOOR || tile === TILE.DOOR || tile === TILE.TERMINAL ||
           tile === TILE.REPLICATOR || tile === TILE.ELEVATOR;
}

function isSolid(x, y) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return true;
    const tile = map[y]?.[x];
    return tile === TILE.WALL || tile === TILE.DOOR_LOCKED;
}

function hasLineOfSight(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    let x = Math.floor(x1);
    let y = Math.floor(y1);
    const endX = Math.floor(x2);
    const endY = Math.floor(y2);

    while (x !== endX || y !== endY) {
        if (x !== Math.floor(x1) || y !== Math.floor(y1)) {
            if (isSolid(x, y)) return false;
        }
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
    }
    return true;
}

function updateFogOfWar() {
    if (!player) return;

    // Reset fog
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            fogOfWar[y][x] = true;
        }
    }

    // Calculate visible tiles
    const baseRange = VISION_RANGE;
    const flashlightRange = player.flashlightOn ? FLASHLIGHT_RANGE : 3;

    for (let dy = -flashlightRange; dy <= flashlightRange; dy++) {
        for (let dx = -flashlightRange; dx <= flashlightRange; dx++) {
            const x = Math.floor(player.x) + dx;
            const y = Math.floor(player.y) + dy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                // Check if within flashlight cone or close range
                const angleToTile = Math.atan2(dy, dx);
                const angleDiff = Math.abs(normalizeAngle(angleToTile - player.angle));

                const inCone = player.flashlightOn && dist <= FLASHLIGHT_RANGE && angleDiff < FLASHLIGHT_ANGLE;
                const inBaseVision = dist <= baseRange;

                if ((inCone || inBaseVision) && hasLineOfSight(player.x, player.y, x + 0.5, y + 0.5)) {
                    fogOfWar[y][x] = false;
                    explored[y][x] = true;
                }
            }
        }
    }
}

function generateMap() {
    map = [];
    fogOfWar = [];
    explored = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        fogOfWar[y] = [];
        explored[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            map[y][x] = TILE.WALL;
            fogOfWar[y][x] = true;
            explored[y][x] = false;
        }
    }

    // Generate rooms
    const rooms = [];
    const numRooms = 6 + Math.floor(Math.random() * 4);

    for (let i = 0; i < numRooms; i++) {
        const w = 4 + Math.floor(Math.random() * 5);
        const h = 4 + Math.floor(Math.random() * 4);
        const x = 1 + Math.floor(Math.random() * (MAP_WIDTH - w - 2));
        const y = 1 + Math.floor(Math.random() * (MAP_HEIGHT - h - 2));

        // Check for overlap
        let overlaps = false;
        for (const room of rooms) {
            if (x < room.x + room.w + 1 && x + w + 1 > room.x &&
                y < room.y + room.h + 1 && y + h + 1 > room.y) {
                overlaps = true;
                break;
            }
        }

        if (!overlaps) {
            rooms.push({ x, y, w, h });
            // Carve out room
            for (let ry = y; ry < y + h; ry++) {
                for (let rx = x; rx < x + w; rx++) {
                    map[ry][rx] = TILE.FLOOR;
                }
            }
        }
    }

    // Connect rooms with corridors
    for (let i = 1; i < rooms.length; i++) {
        const r1 = rooms[i - 1];
        const r2 = rooms[i];
        const cx1 = Math.floor(r1.x + r1.w / 2);
        const cy1 = Math.floor(r1.y + r1.h / 2);
        const cx2 = Math.floor(r2.x + r2.w / 2);
        const cy2 = Math.floor(r2.y + r2.h / 2);

        // L-shaped corridor
        let x = cx1, y = cy1;
        while (x !== cx2) {
            map[y][x] = TILE.FLOOR;
            x += x < cx2 ? 1 : -1;
        }
        while (y !== cy2) {
            map[y][x] = TILE.FLOOR;
            y += y < cy2 ? 1 : -1;
        }
    }

    // Add doors at room entrances
    for (const room of rooms) {
        const doorPositions = [
            { x: room.x - 1, y: Math.floor(room.y + room.h / 2), check: 'left' },
            { x: room.x + room.w, y: Math.floor(room.y + room.h / 2), check: 'right' },
            { x: Math.floor(room.x + room.w / 2), y: room.y - 1, check: 'top' },
            { x: Math.floor(room.x + room.w / 2), y: room.y + room.h, check: 'bottom' }
        ];

        for (const pos of doorPositions) {
            if (pos.x >= 0 && pos.x < MAP_WIDTH && pos.y >= 0 && pos.y < MAP_HEIGHT) {
                if (map[pos.y][pos.x] === TILE.FLOOR) {
                    if (Math.random() < 0.4) {
                        map[pos.y][pos.x] = Math.random() < 0.3 ? TILE.DOOR_LOCKED : TILE.DOOR;
                    }
                }
            }
        }
    }

    // Add terminals in random rooms
    for (let i = 0; i < 3; i++) {
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const tx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const ty = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
        if (map[ty][tx] === TILE.FLOOR) {
            map[ty][tx] = TILE.TERMINAL;
        }
    }

    // Add cover objects
    for (let i = 0; i < 8; i++) {
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const cx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const cy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
        if (map[cy][cx] === TILE.FLOOR) {
            map[cy][cx] = TILE.COVER;
        }
    }

    // Place elevator in last room
    const lastRoom = rooms[rooms.length - 1];
    map[lastRoom.y + 1][lastRoom.x + 1] = TILE.ELEVATOR;

    // Spawn player in first room
    const firstRoom = rooms[0];
    player = new Player(firstRoom.x + firstRoom.w / 2, firstRoom.y + firstRoom.h / 2);

    // Spawn enemies
    enemies = [];
    for (let i = 1; i < rooms.length; i++) {
        const room = rooms[i];
        const numEnemies = 1 + Math.floor(Math.random() * 2);
        for (let j = 0; j < numEnemies; j++) {
            const ex = room.x + 1 + Math.random() * (room.w - 2);
            const ey = room.y + 1 + Math.random() * (room.h - 2);
            const types = Object.keys(ENEMY_TYPES);
            const type = types[Math.floor(Math.random() * types.length)];
            enemies.push(new Enemy(ex, ey, type));
        }
    }

    // Spawn items
    items = [];
    for (let i = 0; i < 5; i++) {
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const ix = room.x + 1 + Math.random() * (room.w - 2);
        const iy = room.y + 1 + Math.random() * (room.h - 2);
        const itemTypes = ['medPatch', 'medPatch', 'medKit', 'bullets', 'bullets', 'cyberModule'];
        const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        items.push({
            x: ix,
            y: iy,
            type,
            ...ITEMS[type]
        });
    }

    // Drop a keycard if there are locked doors
    const hasLockedDoors = map.some(row => row.includes(TILE.DOOR_LOCKED));
    if (hasLockedDoors) {
        const room = rooms[Math.floor(rooms.length / 2)];
        items.push({
            x: room.x + room.w / 2,
            y: room.y + room.h / 2,
            type: 'keyYellow',
            ...ITEMS.keyYellow
        });
    }

    updateFogOfWar();
}

function showMariaDialogue(text) {
    mariaDialogue = text;
    mariaDialogueTimer = 5;
}

// Hacking mini-game
function startHacking(target) {
    hackingActive = true;
    hackingTarget = target;
    hackingTimer = 15 + player.skills.hacking.level;
    hackingPath = [];

    // Generate grid
    const size = 6;
    hackingGrid = [];
    const blockedPercent = 0.2 - player.skills.hacking.level * 0.02;

    for (let y = 0; y < size; y++) {
        hackingGrid[y] = [];
        for (let x = 0; x < size; x++) {
            if (x === 0 && y === Math.floor(size / 2)) {
                hackingGrid[y][x] = 'source';
            } else if (x === size - 1 && y === Math.floor(size / 2)) {
                hackingGrid[y][x] = 'target';
            } else if (Math.random() < blockedPercent) {
                hackingGrid[y][x] = 'blocked';
            } else if (Math.random() < 0.1) {
                hackingGrid[y][x] = 'booster';
            } else if (Math.random() < 0.05) {
                hackingGrid[y][x] = 'trap';
            } else {
                hackingGrid[y][x] = 'empty';
            }
        }
    }
}

function hackClick(gx, gy) {
    if (!hackingActive) return;

    const cell = hackingGrid[gy]?.[gx];
    if (!cell || cell === 'blocked') return;

    // Check if adjacent to path or source
    let isAdjacent = false;
    if (hackingPath.length === 0) {
        // Must be adjacent to source
        const sourceY = Math.floor(hackingGrid.length / 2);
        isAdjacent = gx === 1 && Math.abs(gy - sourceY) <= 1;
    } else {
        const last = hackingPath[hackingPath.length - 1];
        isAdjacent = Math.abs(gx - last.x) + Math.abs(gy - last.y) === 1;
    }

    if (!isAdjacent) return;
    if (hackingPath.some(p => p.x === gx && p.y === gy)) return;

    hackingPath.push({ x: gx, y: gy });
    hackingGrid[gy][gx] = 'active';

    // Check special cells
    if (cell === 'booster') {
        hackingTimer += 2;
        addMessage('Time bonus!');
    } else if (cell === 'trap') {
        hackingTimer -= 5;
        addMessage('Trap! Time reduced!');
    }

    // Check if reached target
    if (cell === 'target') {
        hackingActive = false;
        addMessage('Hack successful!');
        // Apply hack effect
        if (hackingTarget === 'door') {
            // Unlock nearby door
        } else if (hackingTarget === 'terminal') {
            player.cyberModules += 20;
            addMessage('Downloaded 20 Cyber Modules!');
        }
    }
}

// LittleJS callbacks
function gameInit() {
    canvasFixedSize = vec2(1280, 720);
    cameraPos = vec2(MAP_WIDTH / 2, MAP_HEIGHT / 2);
    cameraScale = 32;
}

function gameUpdate() {
    gameTime += 1 / 60;

    if (gameState === 'title') {
        if (keyWasPressed('Space') || keyWasPressed('Enter') || mouseWasPressed(0)) {
            gameState = 'play';
            generateMap();
            showMariaDialogue("Welcome to the Von Braun. I am M.A.R.I.A. This station is now... under new management.");
        }
        return;
    }

    if (gameState === 'gameover') {
        if (keyWasPressed('Space') || keyWasPressed('Enter')) {
            gameState = 'title';
        }
        return;
    }

    if (gameState === 'victory') {
        if (keyWasPressed('Space') || keyWasPressed('Enter')) {
            currentDeck++;
            if (currentDeck > 5) {
                gameState = 'win';
            } else {
                gameState = 'play';
                generateMap();
            }
        }
        return;
    }

    if (hackingActive) {
        hackingTimer -= 1 / 60;
        if (hackingTimer <= 0) {
            hackingActive = false;
            addMessage('Hack failed! Alarm triggered!');
            // Spawn enemy or alert
        }

        if (mouseWasPressed(0)) {
            const mx = mousePos.x;
            const my = mousePos.y;
            // Convert to grid coords (hacking UI centered on screen)
            const gridSize = 6;
            const cellSize = 1;
            const gridX = Math.floor((mx - (MAP_WIDTH / 2 - gridSize / 2)) / cellSize);
            const gridY = Math.floor((my - (MAP_HEIGHT / 2 - gridSize / 2)) / cellSize);
            hackClick(gridX, gridY);
        }

        if (keyWasPressed('Escape')) {
            hackingActive = false;
            addMessage('Hack aborted!');
        }
        return;
    }

    if (gameState !== 'play' || !player) return;

    // Player input
    let moveX = 0, moveY = 0;
    if (keyIsDown('KeyW') || keyIsDown('ArrowUp')) moveY -= 1;
    if (keyIsDown('KeyS') || keyIsDown('ArrowDown')) moveY += 1;
    if (keyIsDown('KeyA') || keyIsDown('ArrowLeft')) moveX -= 1;
    if (keyIsDown('KeyD') || keyIsDown('ArrowRight')) moveX += 1;

    // Sprint
    player.sprinting = keyIsDown('ShiftLeft') || keyIsDown('ShiftRight');

    // Crouch
    player.crouching = keyIsDown('ControlLeft') || keyIsDown('ControlRight');

    // Movement
    if (moveX !== 0 || moveY !== 0) {
        const len = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= len;
        moveY /= len;

        let speed = player.speed;
        if (player.sprinting && player.energy > 0) {
            speed *= 1.5;
            player.energy -= 5 / 60;
        }
        if (player.crouching) {
            speed *= 0.5;
        }

        const newX = player.x + moveX * speed;
        const newY = player.y + moveY * speed;

        if (isWalkable(Math.floor(newX), Math.floor(player.y))) {
            player.x = newX;
        }
        if (isWalkable(Math.floor(player.x), Math.floor(newY))) {
            player.y = newY;
        }
    }

    // Mouse aim
    const worldMouseX = mousePos.x;
    const worldMouseY = mousePos.y;
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

    // Shooting
    if (mouseIsDown(0)) {
        player.shoot(worldMouseX, worldMouseY);
    }

    // Reload
    if (keyWasPressed('KeyR')) {
        player.reload();
    }

    // Flashlight toggle
    if (keyWasPressed('KeyF')) {
        if (player.energy > 0) {
            player.flashlightOn = !player.flashlightOn;
            addMessage(player.flashlightOn ? 'Flashlight ON' : 'Flashlight OFF');
        } else {
            addMessage('No energy for flashlight!');
        }
    }

    // Weapon switch
    if (keyWasPressed('Digit1')) player.currentWeapon = 0;
    if (keyWasPressed('Digit2') && player.weapons.length > 1) player.currentWeapon = 1;
    if (keyWasPressed('Digit3') && player.weapons.length > 2) player.currentWeapon = 2;
    if (keyWasPressed('Digit4') && player.weapons.length > 3) player.currentWeapon = 3;

    // Quick heal
    if (keyWasPressed('KeyQ')) {
        const healItem = player.inventory.find(i => i.type === 'heal');
        if (healItem && player.hp < player.maxHp) {
            player.heal(healItem.heal);
            player.inventory.splice(player.inventory.indexOf(healItem), 1);
            addMessage(`Used ${healItem.name}`);
        }
    }

    // Interact
    if (keyWasPressed('KeyE')) {
        const px = Math.floor(player.x);
        const py = Math.floor(player.y);
        const tile = map[py]?.[px];

        if (tile === TILE.TERMINAL) {
            startHacking('terminal');
        } else if (tile === TILE.DOOR_LOCKED) {
            if (player.keycards.includes('yellow')) {
                map[py][px] = TILE.DOOR;
                addMessage('Door unlocked!');
            } else {
                addMessage('Requires Yellow Keycard');
            }
        } else if (tile === TILE.ELEVATOR) {
            gameState = 'victory';
            addMessage('Elevator reached!');
        }

        // Check for items
        const nearItems = items.filter(i => Math.abs(i.x - player.x) < 1 && Math.abs(i.y - player.y) < 1);
        for (const item of nearItems) {
            if (item.type === 'heal') {
                player.inventory.push(item);
                addMessage(`Picked up ${item.name}`);
            } else if (item.type === 'ammo') {
                player.ammo[item.ammoType] = (player.ammo[item.ammoType] || 0) + item.amount;
                addMessage(`Picked up ${item.name}`);
            } else if (item.type === 'key') {
                player.keycards.push(item.keyType);
                addMessage(`Picked up ${item.name}`);
            } else if (item.type === 'xp') {
                player.cyberModules += item.amount;
                addMessage(`Picked up ${item.amount} Cyber Modules`);
            } else if (item.type === 'energy') {
                player.energy = Math.min(player.maxEnergy, player.energy + item.amount);
                addMessage(`Picked up ${item.name}`);
            }
            items.splice(items.indexOf(item), 1);
        }
    }

    // Dodge roll
    if (keyWasPressed('Space') && player.dodgeCooldown <= 0 && player.energy >= 15) {
        player.energy -= 15;
        player.dodgeCooldown = 1;
        const rollDist = 0.3;
        const rollX = player.x + Math.cos(player.angle) * rollDist;
        const rollY = player.y + Math.sin(player.angle) * rollDist;
        if (isWalkable(Math.floor(rollX), Math.floor(rollY))) {
            player.x = rollX;
            player.y = rollY;
        }
        addMessage('Dodge!');
    }

    // Update player
    player.update(1 / 60);

    // Update enemies
    for (const enemy of enemies) {
        enemy.update(1 / 60);
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;

        // Check bounds
        if (b.x < 0 || b.x >= MAP_WIDTH || b.y < 0 || b.y >= MAP_HEIGHT) {
            bullets.splice(i, 1);
            continue;
        }

        // Check walls
        if (isSolid(Math.floor(b.x), Math.floor(b.y))) {
            bullets.splice(i, 1);
            addParticle(b.x, b.y, 0, 0, new Color(1, .8, .2), 0.2, 0.2);
            continue;
        }

        // Check hits
        if (b.owner === 'player') {
            for (const enemy of enemies) {
                const dist = Math.sqrt((enemy.x - b.x) ** 2 + (enemy.y - b.y) ** 2);
                if (dist < 0.5) {
                    enemy.takeDamage(b.damage);
                    bullets.splice(i, 1);
                    break;
                }
            }
        } else if (b.owner === 'enemy') {
            const dist = Math.sqrt((player.x - b.x) ** 2 + (player.y - b.y) ** 2);
            if (dist < 0.4) {
                player.takeDamage(b.damage);
                bullets.splice(i, 1);
            }
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1 / 60;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.life -= 1 / 60;
        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }

    // Update fog of war
    updateFogOfWar();

    // Update camera
    cameraPos = vec2(player.x, player.y);

    // Update MARIA dialogue
    if (mariaDialogueTimer > 0) {
        mariaDialogueTimer -= 1 / 60;
    }
}

function gameUpdatePost() {
    // Camera
    if (player) {
        cameraPos = vec2(player.x, player.y);
    }
}

function gameRender() {
    if (gameState === 'title') {
        drawTitleScreen();
        return;
    }

    if (gameState === 'gameover') {
        drawGameOverScreen();
        return;
    }

    if (gameState === 'victory') {
        drawVictoryScreen();
        return;
    }

    if (gameState === 'win') {
        drawWinScreen();
        return;
    }

    // Clear with dark background for gameplay
    drawRect(cameraPos, vec2(100, 100), new Color(0, 0, 0));

    // Draw map
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = map[y][x];
            const pos = vec2(x + 0.5, y + 0.5);

            // Check visibility
            const visible = !fogOfWar[y][x];
            const wasExplored = explored[y][x];

            if (!visible && !wasExplored) continue;

            const alpha = visible ? 1 : 0.3;

            let color;
            switch (tile) {
                case TILE.FLOOR:
                    color = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
                    break;
                case TILE.WALL:
                    color = COLORS.wall;
                    break;
                case TILE.DOOR:
                    color = COLORS.door;
                    break;
                case TILE.DOOR_LOCKED:
                    color = COLORS.doorLocked;
                    break;
                case TILE.TERMINAL:
                    color = COLORS.terminal;
                    break;
                case TILE.COVER:
                    color = COLORS.cover;
                    break;
                case TILE.REPLICATOR:
                    color = COLORS.replicator;
                    break;
                case TILE.ELEVATOR:
                    color = COLORS.elevator;
                    break;
                default:
                    color = COLORS.floor;
            }

            color = new Color(color.r, color.g, color.b, alpha);
            drawRect(pos, vec2(1, 1), color);

            // Terminal glow
            if (tile === TILE.TERMINAL && visible) {
                const glow = (Math.sin(gameTime * 3) + 1) * 0.2;
                drawRect(pos, vec2(0.8, 0.8), new Color(0.2, 0.6, 0.4, glow));
            }
        }
    }

    // Draw items
    for (const item of items) {
        if (fogOfWar[Math.floor(item.y)]?.[Math.floor(item.x)]) continue;
        const pos = vec2(item.x, item.y);
        let color = new Color(0.8, 0.8, 0.2);
        if (item.type === 'heal') color = COLORS.health;
        else if (item.type === 'ammo') color = new Color(0.6, 0.4, 0.2);
        else if (item.type === 'key') color = new Color(1, 1, 0);
        drawRect(pos, vec2(0.4, 0.4), color);
        drawText(item.icon, pos, 0.4, new Color(0, 0, 0));
    }

    // Draw enemies
    for (const enemy of enemies) {
        if (fogOfWar[Math.floor(enemy.y)]?.[Math.floor(enemy.x)]) continue;
        const pos = vec2(enemy.x, enemy.y);
        const color = COLORS[enemy.colorKey] || COLORS.cyborg;

        // Body
        drawRect(pos, vec2(0.7, 0.7), color);

        // Direction indicator
        const dirX = Math.cos(enemy.angle) * 0.3;
        const dirY = Math.sin(enemy.angle) * 0.3;
        drawLine(pos, vec2(pos.x + dirX, pos.y + dirY), 0.1, new Color(1, 0, 0));

        // Health bar
        if (enemy.hp < enemy.maxHp) {
            const hpPercent = enemy.hp / enemy.maxHp;
            const barPos = vec2(enemy.x, enemy.y - 0.6);
            drawRect(barPos, vec2(0.8, 0.1), new Color(0.2, 0, 0));
            drawRect(vec2(barPos.x - 0.4 * (1 - hpPercent), barPos.y), vec2(0.8 * hpPercent, 0.1), COLORS.mariaRed);
        }

        // Alert indicator
        if (enemy.state === 'chase') {
            drawText('!', vec2(enemy.x, enemy.y - 0.8), 0.4, new Color(1, 0, 0));
        }
    }

    // Draw bullets
    for (const b of bullets) {
        const color = b.owner === 'player' ? (b.isLaser ? COLORS.laserBullet : COLORS.bullet) : new Color(1, 0.4, 0.2);
        drawRect(vec2(b.x, b.y), vec2(0.15, 0.15), color);
    }

    // Draw particles
    for (const p of particles) {
        const alpha = p.life / p.maxLife;
        const color = new Color(p.color.r, p.color.g, p.color.b, alpha);
        drawRect(vec2(p.x, p.y), vec2(p.size, p.size), color);
    }

    // Draw player
    if (player) {
        const pos = vec2(player.x, player.y);

        // Flashlight cone
        if (player.flashlightOn) {
            const conePoints = [];
            const segments = 20;
            for (let i = -segments / 2; i <= segments / 2; i++) {
                const angle = player.angle + (i / segments) * FLASHLIGHT_ANGLE * 2;
                const dist = FLASHLIGHT_RANGE;
                conePoints.push(vec2(
                    player.x + Math.cos(angle) * dist,
                    player.y + Math.sin(angle) * dist
                ));
            }
            // Draw cone as triangles
            for (let i = 0; i < conePoints.length - 1; i++) {
                // Simple approximation with rectangles
                const midX = (conePoints[i].x + conePoints[i + 1].x + player.x) / 3;
                const midY = (conePoints[i].y + conePoints[i + 1].y + player.y) / 3;
                drawRect(vec2(midX, midY), vec2(0.5, 0.5), COLORS.flashlight);
            }
        }

        // Player body
        const bodyColor = player.crouching ? new Color(0.2, 0.4, 0.8) : COLORS.player;
        drawRect(pos, vec2(0.6, 0.6), bodyColor);

        // Direction indicator
        const dirX = Math.cos(player.angle) * 0.4;
        const dirY = Math.sin(player.angle) * 0.4;
        drawLine(pos, vec2(pos.x + dirX, pos.y + dirY), 0.12, COLORS.playerLight);

        // Weapon indicator
        const weapon = player.getWeapon();
        drawText(weapon.icon, vec2(player.x + dirX * 0.8, player.y + dirY * 0.8), 0.3, new Color(0.8, 0.8, 0.8));
    }

    // Draw floating texts
    for (const ft of floatingTexts) {
        const alpha = ft.life;
        const color = new Color(ft.color.r, ft.color.g, ft.color.b, alpha);
        drawText(ft.text, vec2(ft.x, ft.y), 0.4, color);
    }

    // Draw fog overlay on non-visible tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (!fogOfWar[y][x]) continue;
            const wasExplored = explored[y][x];
            const color = wasExplored ? COLORS.fogExplored : COLORS.fogDark;
            drawRect(vec2(x + 0.5, y + 0.5), vec2(1, 1), color);
        }
    }

    // Hacking overlay
    if (hackingActive) {
        drawHackingUI();
    }
}

function gameRenderPost() {
    // Draw UI
    if (gameState !== 'play' || !player) return;

    const uiScale = 0.5;

    // Health bar (top left)
    drawRect(screenToWorld(vec2(120, 30)), vec2(12, 1.2), COLORS.uiBackground, 0, false);
    drawRect(screenToWorld(vec2(60 + player.hp / player.maxHp * 60, 30)), vec2(player.hp / player.maxHp * 6, 0.8), COLORS.health, 0, false);
    drawText(`HP: ${Math.floor(player.hp)}/${player.maxHp}`, screenToWorld(vec2(120, 30)), 0.4, COLORS.uiText, 0.3, false);

    // Energy bar
    drawRect(screenToWorld(vec2(120, 55)), vec2(12, 1.2), COLORS.uiBackground, 0, false);
    drawRect(screenToWorld(vec2(60 + player.energy / player.maxEnergy * 60, 55)), vec2(player.energy / player.maxEnergy * 6, 0.8), COLORS.energy, 0, false);
    drawText(`EN: ${Math.floor(player.energy)}/${player.maxEnergy}`, screenToWorld(vec2(120, 55)), 0.4, COLORS.uiText, 0.3, false);

    // Weapon info (bottom left)
    const weapon = player.getWeapon();
    drawRect(screenToWorld(vec2(120, 680)), vec2(12, 2), COLORS.uiBackground, 0, false);
    drawText(`${weapon.name}`, screenToWorld(vec2(120, 665)), 0.4, COLORS.uiText, 0.3, false);
    if (weapon.type === 'ranged') {
        const ammoText = `${weapon.magazine}/${player.ammo[weapon.ammoType] || 0}`;
        drawText(ammoText, screenToWorld(vec2(120, 690)), 0.4, COLORS.uiHighlight, 0.3, false);
        if (player.reloading) {
            drawText('RELOADING...', screenToWorld(vec2(120, 710)), 0.35, COLORS.mariaRed, 0.3, false);
        }
    }

    // Deck indicator (top right)
    drawText(`DECK ${currentDeck}`, screenToWorld(vec2(1200, 30)), 0.5, COLORS.uiText, 0.3, false);

    // Cyber modules
    drawText(`CM: ${player.cyberModules}`, screenToWorld(vec2(1200, 55)), 0.4, new Color(1, 0.8, 0.2), 0.3, false);

    // Messages (bottom center)
    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const age = gameTime - msg.time;
        const alpha = Math.max(0, 1 - age / 5);
        drawText(msg.text, screenToWorld(vec2(640, 600 + i * 20)), 0.35, new Color(0.7, 0.85, 0.9, alpha), 0.3, false);
    }

    // Controls hint
    drawText('WASD-Move  Mouse-Aim  LMB-Fire  R-Reload  F-Flashlight  E-Interact  Space-Dodge',
             screenToWorld(vec2(640, 710)), 0.3, new Color(0.5, 0.6, 0.7), 0.3, false);

    // M.A.R.I.A. dialogue
    if (mariaDialogueTimer > 0) {
        const alpha = Math.min(1, mariaDialogueTimer);
        drawRect(screenToWorld(vec2(640, 120)), vec2(40, 3), new Color(0.1, 0, 0, 0.8 * alpha), 0, false);
        drawText('M.A.R.I.A.:', screenToWorld(vec2(640, 100)), 0.45, new Color(0.8, 0.1, 0.1, alpha), 0.3, false);
        drawText(mariaDialogue, screenToWorld(vec2(640, 130)), 0.35, new Color(0.9, 0.2, 0.2, alpha), 0.3, false);
    }
}

function drawTitleScreen() {
    drawRect(cameraPos, vec2(100, 100), new Color(0.02, 0.02, 0.05));

    // Title
    drawText('SYSTEM SHOCK 2D', cameraPos.add(vec2(0, 3)), 1.2, COLORS.mariaRed);
    drawText('WHISPERS OF M.A.R.I.A.', cameraPos.add(vec2(0, 1.5)), 0.5, COLORS.uiText);

    // Subtitle
    drawText('A 2D Immersive Sim', cameraPos.add(vec2(0, 0)), 0.4, new Color(0.5, 0.5, 0.6));

    // Start prompt
    const blink = Math.sin(gameTime * 3) > 0;
    if (blink) {
        drawText('PRESS SPACE TO START', cameraPos.add(vec2(0, -3)), 0.5, COLORS.uiHighlight);
    }

    // Credits
    drawText('LittleJS Engine', cameraPos.add(vec2(0, -5)), 0.3, new Color(0.4, 0.4, 0.5));
}

function drawGameOverScreen() {
    drawRect(cameraPos, vec2(100, 100), new Color(0.05, 0, 0));

    drawText('SYSTEM FAILURE', cameraPos.add(vec2(0, 3)), 1, COLORS.mariaRed);
    drawText('Your consciousness has been absorbed by M.A.R.I.A.', cameraPos.add(vec2(0, 1)), 0.35, COLORS.uiText);

    drawText(`Deck Reached: ${currentDeck}`, cameraPos.add(vec2(0, -1)), 0.4, COLORS.uiHighlight);
    drawText(`Enemies Killed: ${totalKills}`, cameraPos.add(vec2(0, -2)), 0.4, COLORS.uiHighlight);

    drawText('PRESS SPACE TO RESTART', cameraPos.add(vec2(0, -4)), 0.5, COLORS.uiText);
}

function drawVictoryScreen() {
    drawRect(cameraPos, vec2(100, 100), new Color(0, 0.03, 0.05));

    drawText(`DECK ${currentDeck} CLEARED`, cameraPos.add(vec2(0, 3)), 1, COLORS.terminalGlow);
    drawText('Elevator accessed', cameraPos.add(vec2(0, 1)), 0.4, COLORS.uiText);

    drawText(`Enemies Killed: ${totalKills}`, cameraPos.add(vec2(0, -1)), 0.4, COLORS.uiHighlight);

    drawText('PRESS SPACE TO CONTINUE', cameraPos.add(vec2(0, -4)), 0.5, COLORS.uiText);
}

function drawWinScreen() {
    drawRect(cameraPos, vec2(100, 100), new Color(0, 0.02, 0.05));

    drawText('M.A.R.I.A. DEFEATED', cameraPos.add(vec2(0, 4)), 1, new Color(0.2, 0.8, 0.4));
    drawText('The Von Braun is silent once more.', cameraPos.add(vec2(0, 2)), 0.4, COLORS.uiText);
    drawText('But her code spreads on the solar winds...', cameraPos.add(vec2(0, 1)), 0.35, COLORS.mariaRed);

    drawText(`Total Kills: ${totalKills}`, cameraPos.add(vec2(0, -1)), 0.4, COLORS.uiHighlight);

    drawText('PRESS SPACE TO PLAY AGAIN', cameraPos.add(vec2(0, -4)), 0.5, COLORS.uiText);
}

function drawHackingUI() {
    const centerX = MAP_WIDTH / 2;
    const centerY = MAP_HEIGHT / 2;
    const gridSize = hackingGrid.length;
    const cellSize = 1.2;

    // Background
    drawRect(vec2(centerX, centerY), vec2(gridSize * cellSize + 2, gridSize * cellSize + 3), new Color(0, 0.05, 0.1, 0.95));

    // Title
    drawText('CIRCUIT BREACH', vec2(centerX, centerY + gridSize * cellSize / 2 + 1), 0.5, COLORS.terminalGlow);
    drawText(`Time: ${hackingTimer.toFixed(1)}s`, vec2(centerX, centerY + gridSize * cellSize / 2 + 0.3), 0.35,
             hackingTimer < 5 ? COLORS.mariaRed : COLORS.uiText);

    // Grid
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const cell = hackingGrid[y][x];
            const cx = centerX + (x - gridSize / 2 + 0.5) * cellSize;
            const cy = centerY + (y - gridSize / 2 + 0.5) * cellSize;

            let color;
            let text = '';
            switch (cell) {
                case 'source':
                    color = new Color(0, 0.6, 0);
                    text = 'S';
                    break;
                case 'target':
                    color = new Color(0.6, 0, 0);
                    text = 'T';
                    break;
                case 'blocked':
                    color = new Color(0.3, 0, 0);
                    text = 'X';
                    break;
                case 'active':
                    color = new Color(0, 0.5, 0.3);
                    break;
                case 'booster':
                    color = new Color(0.5, 0.5, 0);
                    text = '+';
                    break;
                case 'trap':
                    color = new Color(0.5, 0.3, 0);
                    text = '!';
                    break;
                default:
                    color = new Color(0.1, 0.15, 0.2);
            }

            drawRect(vec2(cx, cy), vec2(cellSize * 0.9, cellSize * 0.9), color);
            if (text) {
                drawText(text, vec2(cx, cy), 0.4, COLORS.uiText);
            }
        }
    }

    // Instructions
    drawText('Click adjacent nodes to create path from S to T', vec2(centerX, centerY - gridSize * cellSize / 2 - 0.5), 0.3, COLORS.uiText);
    drawText('ESC to abort', vec2(centerX, centerY - gridSize * cellSize / 2 - 1), 0.25, new Color(0.5, 0.5, 0.5));
}

// Initialize LittleJS
engineInit(
    gameInit,
    gameUpdate,
    gameUpdatePost,
    gameRender,
    gameRenderPost,
    [0] // No tile image
);
