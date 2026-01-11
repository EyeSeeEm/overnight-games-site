// Bulletstorm Depths - Enter the Gungeon Clone
// Built with LittleJS

'use strict';

// Game constants
const TILE_SIZE = 16;
const ROOM_WIDTH = 20;
const ROOM_HEIGHT = 15;
const CANVAS_WIDTH = ROOM_WIDTH * TILE_SIZE;
const CANVAS_HEIGHT = ROOM_HEIGHT * TILE_SIZE;

// Weapon definitions
const WEAPONS = {
    // D-Tier (Common)
    MARINE_SIDEARM: { name: 'Marine Sidearm', damage: 6, fireRate: 5, magSize: 10, maxAmmo: Infinity, spread: 0.05, speed: 15, type: 'semi', quality: 'D', color: '#888' },
    PEA_SHOOTER: { name: 'Pea Shooter', damage: 4, fireRate: 4, magSize: 6, maxAmmo: 80, spread: 0.1, speed: 12, type: 'semi', quality: 'D', color: '#4a4' },
    RUSTY_SIDEARM: { name: 'Rusty Sidearm', damage: 5, fireRate: 4, magSize: 7, maxAmmo: 90, spread: 0.15, speed: 12, type: 'semi', quality: 'D', color: '#a84' },
    SAWED_OFF: { name: 'Sawed-Off', damage: 3, fireRate: 1.5, magSize: 2, maxAmmo: 50, spread: 0.4, speed: 10, type: 'shotgun', pellets: 4, quality: 'D', color: '#864' },
    CROSSBOW: { name: 'Crossbow', damage: 12, fireRate: 1, magSize: 1, maxAmmo: 40, spread: 0, speed: 18, type: 'semi', pierce: true, quality: 'D', color: '#654' },
    BUDGET_REVOLVER: { name: 'Budget Revolver', damage: 7, fireRate: 3, magSize: 6, maxAmmo: 60, spread: 0.1, speed: 13, type: 'semi', quality: 'D', color: '#555' },
    FLARE_GUN: { name: 'Flare Gun', damage: 8, fireRate: 0.5, magSize: 1, maxAmmo: 30, spread: 0.05, speed: 8, type: 'semi', burning: true, quality: 'D', color: '#f60' },
    // C-Tier (Uncommon)
    M1911: { name: 'M1911', damage: 7, fireRate: 5, magSize: 10, maxAmmo: 100, spread: 0.05, speed: 14, type: 'semi', quality: 'C', color: '#666' },
    MACHINE_PISTOL: { name: 'Machine Pistol', damage: 3, fireRate: 12, magSize: 30, maxAmmo: 200, spread: 0.2, speed: 13, type: 'auto', quality: 'C', color: '#555' },
    SHOTGUN: { name: 'Shotgun', damage: 4, fireRate: 1.5, magSize: 8, maxAmmo: 60, spread: 0.3, speed: 11, type: 'shotgun', pellets: 6, quality: 'C', color: '#753' },
    BOW: { name: 'Bow', damage: 15, fireRate: 0.8, magSize: 1, maxAmmo: 50, spread: 0, speed: 16, type: 'charged', quality: 'C', color: '#542' },
    MEGA_DOUSER: { name: 'Mega Douser', damage: 3, fireRate: 15, magSize: 100, maxAmmo: 500, spread: 0.1, speed: 10, type: 'beam', quality: 'C', color: '#48f' },
    SMG: { name: 'SMG', damage: 4, fireRate: 10, magSize: 25, maxAmmo: 150, spread: 0.15, speed: 14, type: 'auto', quality: 'C', color: '#666' },
    GRENADE_LAUNCHER: { name: 'Grenade Launcher', damage: 25, fireRate: 0.8, magSize: 4, maxAmmo: 20, spread: 0.05, speed: 8, type: 'semi', explosive: true, quality: 'C', color: '#484' },
    // B-Tier (Rare)
    AK47: { name: 'AK-47', damage: 5, fireRate: 8, magSize: 30, maxAmmo: 180, spread: 0.12, speed: 15, type: 'auto', quality: 'B', color: '#643' },
    HUNTSMAN: { name: 'Huntsman', damage: 6, fireRate: 2, magSize: 4, maxAmmo: 40, spread: 0.25, speed: 12, type: 'shotgun', pellets: 5, quality: 'B', color: '#862' },
    LASER_RIFLE: { name: 'Laser Rifle', damage: 8, fireRate: 10, magSize: 40, maxAmmo: 200, spread: 0, speed: 25, type: 'beam', quality: 'B', color: '#f44' },
    DEMON_HEAD: { name: 'Demon Head', damage: 18, fireRate: 1.5, magSize: 6, maxAmmo: 36, spread: 0.1, speed: 10, type: 'charged', homing: true, burning: true, quality: 'B', color: '#f40' },
    HEXAGUN: { name: 'Hexagun', damage: 10, fireRate: 3, magSize: 6, maxAmmo: 48, spread: 0.05, speed: 14, type: 'semi', transmogrify: 0.1, quality: 'B', color: '#a4a' },
    SNIPER_RIFLE: { name: 'Sniper Rifle', damage: 30, fireRate: 0.7, magSize: 5, maxAmmo: 25, spread: 0, speed: 35, type: 'semi', pierce: true, quality: 'B', color: '#464' },
    // A-Tier (Epic)
    RAILGUN: { name: 'Railgun', damage: 70, fireRate: 0.5, magSize: 3, maxAmmo: 15, spread: 0, speed: 40, type: 'charged', pierce: true, quality: 'A', color: '#44f' },
    VULCAN_CANNON: { name: 'Vulcan Cannon', damage: 4, fireRate: 20, magSize: 200, maxAmmo: 800, spread: 0.15, speed: 14, type: 'auto', quality: 'A', color: '#888' },
    YARI_LAUNCHER: { name: 'Yari Launcher', damage: 28, fireRate: 3, magSize: 20, maxAmmo: 60, spread: 0.1, speed: 12, type: 'auto', homing: true, quality: 'A', color: '#f80' },
    MAKESHIFT_CANNON: { name: 'Makeshift Cannon', damage: 200, fireRate: 0.3, magSize: 1, maxAmmo: 10, spread: 0, speed: 20, type: 'semi', quality: 'A', color: '#444' },
    DISINTEGRATOR: { name: 'Disintegrator', damage: 25, fireRate: 8, magSize: 100, maxAmmo: 300, spread: 0, speed: 30, type: 'beam', destroysBullets: true, quality: 'A', color: '#f0f' },
    CORSAIR: { name: 'Corsair', damage: 15, fireRate: 4, magSize: 12, maxAmmo: 72, spread: 0.08, speed: 14, type: 'auto', bounce: 2, quality: 'A', color: '#4af' },
    // S-Tier (Legendary)
    BSG: { name: 'Big Shotgun', damage: 10, fireRate: 0.5, magSize: 30, maxAmmo: 90, spread: 0.5, speed: 10, type: 'shotgun', pellets: 10, quality: 'S', color: '#f00' },
    GUNTHER: { name: 'Gunther', damage: 8, fireRate: 10, magSize: Infinity, maxAmmo: Infinity, spread: 0.05, speed: 16, type: 'auto', homing: true, quality: 'S', color: '#ff0' },
    FINISHED_GUN: { name: 'Finished Gun', damage: 60, fireRate: 4, magSize: 100, maxAmmo: 500, spread: 0.03, speed: 20, type: 'semi', quality: 'S', color: '#fff' },
    GUNGINE: { name: 'Gungine', damage: 5, fireRate: 15, magSize: 300, maxAmmo: 900, spread: 0.1, speed: 14, type: 'auto', speedBoost: true, quality: 'S', color: '#f44' },
    CASEY: { name: 'Casey', damage: 100, fireRate: 0.5, magSize: Infinity, maxAmmo: Infinity, spread: 0, speed: 0, type: 'melee', reflect: true, quality: 'S', color: '#843' }
};

// Item definitions
const ITEMS = {
    // D-Tier
    PLUS_1_BULLETS: { name: '+1 Bullets', effect: 'damage', value: 1.25, quality: 'D', passive: true },
    BOUNCY_BULLETS: { name: 'Bouncy Bullets', effect: 'bounce', value: 1, quality: 'D', passive: true },
    SCOPE: { name: 'Scope', effect: 'accuracy', value: 0.5, quality: 'D', passive: true },
    MEATBUN: { name: 'Meatbun', effect: 'heal', value: 1, quality: 'D', passive: false },
    POTION_OF_GUN_FRIENDSHIP: { name: 'Potion of Gun Friendship', effect: 'fireRate', value: 1.15, quality: 'D', passive: true },
    // C-Tier
    MEDKIT: { name: 'Medkit', effect: 'heal', value: 2, quality: 'C', passive: false },
    AMMO_BELT: { name: 'Ammo Belt', effect: 'ammo', value: 1.2, quality: 'C', passive: true },
    ARMOR: { name: 'Armor', effect: 'armor', value: 1, quality: 'C', passive: false },
    EXPLOSIVE_ROUNDS: { name: 'Explosive Rounds', effect: 'explosive', value: 1, quality: 'C', passive: true },
    RING_OF_FIRE_RESIST: { name: 'Ring of Fire Resistance', effect: 'fireImmune', value: 1, quality: 'C', passive: true },
    MOLOTOV: { name: 'Molotov', effect: 'fireBomb', value: 1, quality: 'C', passive: false, cooldown: 400 },
    BOMB: { name: 'Bomb', effect: 'explosion', value: 50, quality: 'C', passive: false, cooldown: 300 },
    // B-Tier
    SHOCK_ROUNDS: { name: 'Shock Rounds', effect: 'chain', value: 2, quality: 'B', passive: true },
    SCATTERSHOT: { name: 'Scattershot', effect: 'scatter', value: 1.5, quality: 'B', passive: true },
    HIP_HOLSTER: { name: 'Hip Holster', effect: 'reload', value: 0.7, quality: 'B', passive: true },
    SHADOW_BULLETS: { name: 'Shadow Bullets', effect: 'shadowHoming', value: 0.2, quality: 'B', passive: true },
    HEART_LOCKET: { name: 'Heart Locket', effect: 'doubleHeart', value: 0.3, quality: 'B', passive: true },
    BULLET_TIME: { name: 'Bullet Time', effect: 'slowMo', value: 0.5, quality: 'B', passive: false, cooldown: 600 },
    BOX: { name: 'Box', effect: 'invisibility', value: 5, quality: 'B', passive: false, cooldown: 500 },
    // A-Tier
    RIDDLE_OF_LEAD: { name: 'Riddle of Lead', effect: 'tank', value: 2, quality: 'A', passive: true },
    BLANK_BULLETS: { name: 'Blank Bullets', effect: 'blankChance', value: 0.1, quality: 'A', passive: true },
    LICHS_EYE_BULLETS: { name: "Lich's Eye Bullets", effect: 'allSynergies', value: 1, quality: 'A', passive: true },
    RELODESTONE: { name: 'Relodestone', effect: 'bulletReturn', value: 0.3, quality: 'A', passive: true },
    OLD_KNIGHTS_HELM: { name: "Old Knight's Helm", effect: 'doubleArmor', value: 2, quality: 'A', passive: true },
    POTION_OF_LEAD_SKIN: { name: 'Potion of Lead Skin', effect: 'invincibility', value: 5, quality: 'A', passive: false, cooldown: 800 },
    // S-Tier
    CLONE: { name: 'Clone', effect: 'revive', value: 1, quality: 'S', passive: true },
    PLATINUM_BULLETS: { name: 'Platinum Bullets', effect: 'superDamage', value: 1.5, quality: 'S', passive: true },
    SEVEN_LEAF_CLOVER: { name: 'Seven-Leaf Clover', effect: 'luckyChests', value: 1, quality: 'S', passive: true },
    RESOURCEFUL_SACK: { name: 'Resourceful Sack', effect: 'generateItems', value: 1, quality: 'S', passive: true },
    NUMBER_2: { name: 'Number 2', effect: 'companion', value: 1, quality: 'S', passive: true }
};

// Enemy definitions
const ENEMIES = {
    // Floor 1 - Basic
    BULLET_KIN: { name: 'Bullet Kin', hp: 15, damage: 1, speed: 1.5, fireRate: 1.5, pattern: 'single', color: '#c84', size: 0.5 },
    BANDANA_KIN: { name: 'Bandana Bullet Kin', hp: 15, damage: 1, speed: 1.5, fireRate: 1.2, pattern: 'spread3', color: '#c44', size: 0.5 },
    VETERAN_KIN: { name: 'Veteran Bullet Kin', hp: 20, damage: 1, speed: 2, fireRate: 2, pattern: 'single', color: '#844', size: 0.5 },
    CARDINAL: { name: 'Cardinal', hp: 15, damage: 1, speed: 1.5, fireRate: 1, pattern: 'cross', color: '#c4c', size: 0.5 },
    SHROOMER: { name: 'Shroomer', hp: 20, damage: 1, speed: 1, fireRate: 0.8, pattern: 'spiral', color: '#8c4', size: 0.6 },
    SKULLET: { name: 'Skullet', hp: 15, damage: 1, speed: 1.5, fireRate: 1.2, pattern: 'bounce', color: '#888', size: 0.5 },
    // Floor 2 - Shotgun variants
    SHOTGUN_BLUE: { name: 'Shotgun Kin (Blue)', hp: 25, damage: 1, speed: 1.2, fireRate: 0.8, pattern: 'spread6', color: '#48c', size: 0.6 },
    SHOTGUN_RED: { name: 'Shotgun Kin (Red)', hp: 30, damage: 1, speed: 1.4, fireRate: 1, pattern: 'spread8', color: '#c48', size: 0.6 },
    SHOTGUN_MUTANT: { name: 'Mutant Shotgun Kin', hp: 40, damage: 1, speed: 1.6, fireRate: 1.2, pattern: 'spread12', color: '#c88', size: 0.7 },
    // Floor 2-3 - Special
    GUN_NUT: { name: 'Gun Nut', hp: 50, damage: 1, speed: 2, fireRate: 0.5, pattern: 'melee', color: '#666', size: 0.7 },
    BOOKLLET: { name: 'Bookllet', hp: 20, damage: 1, speed: 2.5, fireRate: 1.5, pattern: 'circle', color: '#a8a', flying: true, size: 0.4 },
    GUNJURER: { name: 'Gunjurer', hp: 40, damage: 0, speed: 1, fireRate: 0, pattern: 'summon', color: '#808', size: 0.6 },
    LEAD_MAIDEN: { name: 'Lead Maiden', hp: 60, damage: 1, speed: 1.5, fireRate: 1.2, pattern: 'homing', color: '#488', size: 0.6 },
    GRENADE_KIN: { name: 'Grenade Kin', hp: 20, damage: 2, speed: 1.5, fireRate: 0.5, pattern: 'grenade', color: '#484', size: 0.5 },
    RUBBER_KIN: { name: 'Rubber Kin', hp: 15, damage: 1, speed: 4, fireRate: 0, pattern: 'contact', color: '#ccc', size: 0.4 },
    // Floor 3 - Mine enemies
    SHOTGRUB: { name: 'Shotgrub', hp: 25, damage: 1, speed: 2, fireRate: 0.6, pattern: 'spread5', color: '#884', size: 0.5 },
    MINELET: { name: 'Minelet', hp: 10, damage: 2, speed: 0, fireRate: 0, pattern: 'mine', color: '#444', size: 0.3 },
    DYNAMITE_KIN: { name: 'Dynamite Kin', hp: 15, damage: 3, speed: 2.5, fireRate: 0, pattern: 'explodeOnDeath', color: '#f44', size: 0.5 },
    SNIPER_SHELL: { name: 'Sniper Shell', hp: 25, damage: 1, speed: 0.5, fireRate: 0.3, pattern: 'sniper', color: '#448', size: 0.6 },
    // Floor 4 - Ghost enemies
    HOLLOWPOINT: { name: 'Hollowpoint', hp: 35, damage: 1, speed: 2, fireRate: 1.5, pattern: 'ghost', color: '#8aa', size: 0.5, phasing: true },
    SPECTRE: { name: 'Spectre', hp: 30, damage: 1, speed: 3, fireRate: 1, pattern: 'teleport', color: '#aaf', size: 0.5, phasing: true },
    GUNREAPER: { name: 'Gunreaper', hp: 80, damage: 1, speed: 1, fireRate: 0.8, pattern: 'scythe', color: '#448', size: 0.8 },
    REVOLVENANT: { name: 'Revolvenant', hp: 50, damage: 1, speed: 1.5, fireRate: 2, pattern: 'revolve', color: '#888', size: 0.6 },
    // Floor 5 - Forge enemies
    METAL_KIN: { name: 'Metal Kin', hp: 45, damage: 1, speed: 1, fireRate: 1.5, pattern: 'single', color: '#666', size: 0.5, armor: 1 },
    FLAME_KIN: { name: 'Flame Kin', hp: 25, damage: 1, speed: 2, fireRate: 1, pattern: 'flame', color: '#f84', size: 0.5, burning: true },
    CHAIN_GUNNER: { name: 'Chain Gunner', hp: 60, damage: 1, speed: 0.8, fireRate: 4, pattern: 'chain', color: '#888', size: 0.7 },
    TANK: { name: 'Tank', hp: 100, damage: 2, speed: 0.5, fireRate: 0.5, pattern: 'cannon', color: '#484', size: 1.0, armor: 2 }
};

// Boss definitions
const BOSSES = {
    // Floor 1 Bosses
    BULLET_KING: {
        name: 'Bullet King',
        hp: 600,
        phases: [
            { threshold: 1.0, attacks: ['throne_spin', 'spread_volley'] },
            { threshold: 0.6, attacks: ['throne_spin', 'bullet_burst', 'rain'] },
            { threshold: 0.3, attacks: ['all'] }
        ],
        color: '#fc0', size: 1.5, floor: 1
    },
    GATLING_GULL: {
        name: 'Gatling Gull',
        hp: 700,
        phases: [
            { threshold: 1.0, attacks: ['gatling_spray', 'wide_sweep'] },
            { threshold: 0.5, attacks: ['charged_shot', 'missile_barrage'] },
            { threshold: 0.25, attacks: ['all'] }
        ],
        color: '#666', size: 1.8, floor: 1
    },
    TRIGGER_TWINS: {
        name: 'Trigger Twins',
        hp: 400,
        phases: [
            { threshold: 1.0, attacks: ['alternating', 'spread'] },
            { threshold: 0.5, attacks: ['aggressive', 'enraged'] }
        ],
        color: '#c44', size: 1.2, floor: 1
    },
    // Floor 2 Bosses
    BEHOLSTER: {
        name: 'Beholster',
        hp: 800,
        phases: [
            { threshold: 1.0, attacks: ['tentacle_spray', 'eye_beam'] },
            { threshold: 0.6, attacks: ['spawn_beadies', 'bullet_ring'] },
            { threshold: 0.3, attacks: ['all'] }
        ],
        color: '#a4a', size: 2.0, floor: 2
    },
    AMMOCONDA: {
        name: 'Ammoconda',
        hp: 900,
        phases: [
            { threshold: 1.0, attacks: ['segment_fire', 'lunge'] },
            { threshold: 0.5, attacks: ['spray_attack', 'consume_turrets'] },
            { threshold: 0.25, attacks: ['all'] }
        ],
        color: '#4c4', size: 1.8, floor: 2
    },
    GORGUN: {
        name: 'Gorgun',
        hp: 750,
        phases: [
            { threshold: 1.0, attacks: ['snake_hair_shots', 'spread_patterns'] },
            { threshold: 0.5, attacks: ['gaze_attack', 'petrify'] },
            { threshold: 0.25, attacks: ['all'] }
        ],
        color: '#484', size: 1.6, floor: 2
    },
    // Floor 3 Bosses
    MINE_FLAYER: {
        name: 'Mine Flayer',
        hp: 850,
        phases: [
            { threshold: 1.0, attacks: ['vanish_reappear', 'claymore_deploy'] },
            { threshold: 0.5, attacks: ['bell_summons', 'rapid_teleport'] },
            { threshold: 0.25, attacks: ['all'] }
        ],
        color: '#848', size: 1.5, floor: 3
    },
    TREADNAUGHT: {
        name: 'Treadnaught',
        hp: 1000,
        phases: [
            { threshold: 1.0, attacks: ['cannon_fire', 'machine_gun'] },
            { threshold: 0.5, attacks: ['treads', 'minion_deployment'] },
            { threshold: 0.25, attacks: ['all'] }
        ],
        color: '#686', size: 2.2, floor: 3
    },
    // Floor 4 Bosses
    HIGH_PRIEST: {
        name: 'High Priest',
        hp: 1100,
        phases: [
            { threshold: 1.0, attacks: ['teleport_strike', 'hand_summons'] },
            { threshold: 0.5, attacks: ['bullet_bible', 'holy_beam'] },
            { threshold: 0.25, attacks: ['all'] }
        ],
        color: '#ff8', size: 1.8, floor: 4
    },
    KILL_PILLARS: {
        name: 'Kill Pillars',
        hp: 1200,
        phases: [
            { threshold: 1.0, attacks: ['pillar_fire', 'synchronized'] },
            { threshold: 0.5, attacks: ['slam_attack', 'revival'] },
            { threshold: 0.25, attacks: ['all'] }
        ],
        color: '#aaa', size: 1.2, floor: 4
    },
    WALLMONGER: {
        name: 'Wallmonger',
        hp: 1000,
        phases: [
            { threshold: 1.0, attacks: ['face_fire', 'bullet_wall'] },
            { threshold: 0.5, attacks: ['wall_advance', 'crush_attack'] },
            { threshold: 0.25, attacks: ['all'] }
        ],
        color: '#844', size: 3.0, floor: 4
    },
    // Floor 5 Boss
    HIGH_DRAGUN: {
        name: 'High Dragun',
        hp: 2000,
        phases: [
            { threshold: 1.0, attacks: ['flame_breath', 'knife_toss'] },
            { threshold: 0.6, attacks: ['rocket_barrage', 'bullet_storm'] },
            { threshold: 0.3, attacks: ['ground_fire', 'desperate_attacks'] },
            { threshold: 0.1, attacks: ['all_out_barrage'] }
        ],
        color: '#f44', size: 2.5, floor: 5
    }
};

// Character definitions
const CHARACTERS = {
    MARINE: {
        name: 'Marine',
        startingGun: 'MARINE_SIDEARM',
        startingItem: 'SUPPLY_DROP',
        passive: 'Faster reload, +1 armor',
        color: '#4af',
        armor: 1,
        reloadBonus: 0.8
    },
    PILOT: {
        name: 'Pilot',
        startingGun: 'RUSTY_SIDEARM',
        startingItem: 'LOCKPICKS',
        passive: 'Lockpicks (50% free chest), shop discount',
        color: '#848',
        shopDiscount: 0.85,
        lockpicks: 0.5
    },
    CONVICT: {
        name: 'Convict',
        startingGun: 'BUDGET_REVOLVER',
        startingItem: 'MOLOTOV',
        passive: 'Enraging Photo: +damage when hit',
        color: '#f84',
        enrage: 1.5
    },
    HUNTER: {
        name: 'Hunter',
        startingGun: 'RUSTY_SIDEARM',
        startingItem: 'DOG',
        passive: 'Dog companion finds items',
        color: '#484',
        hasDog: true
    }
};

// Game state
let gameState = 'menu';
let player = null;
let enemies = [];
let bullets = [];
let pickups = [];
let rooms = [];
let currentRoom = null;
let currentFloor = 1;
let shells = 0;
let keys = 1;
let blanks = 2;
let hegemonyCredits = 0;
let boss = null;
let minimap = [];
let floatingTexts = [];
let particles = [];
let doors = [];
let tables = [];
let chests = [];

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.hp = 6;
        this.maxHp = 6;
        this.armor = 0;
        this.speed = 4;
        this.weapons = [{ ...WEAPONS.MARINE_SIDEARM, ammo: WEAPONS.MARINE_SIDEARM.magSize, totalAmmo: Infinity }];
        this.currentWeapon = 0;
        this.items = [];
        this.activeItem = null;
        this.isRolling = false;
        this.rollTime = 0;
        this.rollDir = { x: 0, y: 0 };
        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.fireCooldown = 0;
        this.reloading = false;
        this.reloadTime = 0;
        this.angle = 0;
        this.size = 0.5;
        this.character = 'marine';
        this.damageMultiplier = 1;
        this.fireRateMultiplier = 1;
        this.spreadMultiplier = 1;
        this.reloadMultiplier = 1;
        this.blinkTimer = 0;
    }

    get weapon() {
        return this.weapons[this.currentWeapon];
    }

    update(dt) {
        // Handle rolling
        if (this.isRolling) {
            this.rollTime -= dt;
            if (this.rollTime <= 0) {
                this.isRolling = false;
                this.invulnerable = false;
            } else if (this.rollTime < 0.35) {
                this.invulnerable = false;
            }
            this.x += this.rollDir.x * 8 * dt;
            this.y += this.rollDir.y * 8 * dt;
        } else {
            // Normal movement
            this.x += this.vx * this.speed * dt;
            this.y += this.vy * this.speed * dt;
        }

        // Bounds
        this.x = Math.max(0.5, Math.min(ROOM_WIDTH - 0.5, this.x));
        this.y = Math.max(0.5, Math.min(ROOM_HEIGHT - 0.5, this.y));

        // Invulnerability timer
        if (this.invulnerableTime > 0) {
            this.invulnerableTime -= dt;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }

        // Fire cooldown
        if (this.fireCooldown > 0) {
            this.fireCooldown -= dt;
        }

        // Reload
        if (this.reloading) {
            this.reloadTime -= dt;
            if (this.reloadTime <= 0) {
                this.reloading = false;
                const needed = this.weapon.magSize - this.weapon.ammo;
                const available = Math.min(needed, this.weapon.totalAmmo);
                this.weapon.ammo += available;
                if (this.weapon.totalAmmo !== Infinity) {
                    this.weapon.totalAmmo -= available;
                }
            }
        }

        // Blink when invulnerable
        this.blinkTimer += dt * 10;
    }

    dodge(dx, dy) {
        if (this.isRolling) return;

        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            this.rollDir = { x: dx / len, y: dy / len };
        } else {
            // Roll in facing direction
            this.rollDir = { x: Math.cos(this.angle), y: Math.sin(this.angle) };
        }

        this.isRolling = true;
        this.rollTime = 0.7;
        this.invulnerable = true;

        // Particle trail
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 0.3,
                color: '#88f',
                size: 0.2
            });
        }
    }

    fire() {
        if (this.isRolling || this.reloading || this.fireCooldown > 0) return;
        if (this.weapon.ammo <= 0) {
            this.reload();
            return;
        }

        const weapon = this.weapon;
        const spread = weapon.spread * this.spreadMultiplier;
        const damage = weapon.damage * this.damageMultiplier;
        const pellets = weapon.pellets || 1;

        for (let i = 0; i < pellets; i++) {
            const angle = this.angle + (Math.random() - 0.5) * spread;
            bullets.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * weapon.speed,
                vy: Math.sin(angle) * weapon.speed,
                damage: damage,
                owner: 'player',
                color: weapon.color,
                size: 0.15,
                pierce: weapon.pierce || false,
                homing: weapon.homing || false,
                bounce: this.hasItem('Bouncy Bullets') ? 1 : 0,
                explosive: this.hasItem('Explosive Rounds'),
                chain: this.hasItem('Shock Rounds') ? 2 : 0
            });
        }

        weapon.ammo--;
        this.fireCooldown = 1 / (weapon.fireRate * this.fireRateMultiplier);

        // Screen shake
        screenShake(0.1, 0.1);

        // Muzzle flash
        particles.push({
            x: this.x + Math.cos(this.angle) * 0.5,
            y: this.y + Math.sin(this.angle) * 0.5,
            vx: 0,
            vy: 0,
            life: 0.05,
            color: '#ff8',
            size: 0.3
        });
    }

    reload() {
        if (this.reloading || this.weapon.ammo === this.weapon.magSize) return;
        if (this.weapon.totalAmmo === 0) return;

        this.reloading = true;
        this.reloadTime = 1.0 * this.reloadMultiplier;
    }

    switchWeapon(dir) {
        this.currentWeapon = (this.currentWeapon + dir + this.weapons.length) % this.weapons.length;
        this.reloading = false;
    }

    useBlank() {
        if (blanks <= 0) return;
        blanks--;

        // Clear all enemy bullets
        bullets = bullets.filter(b => b.owner === 'player');

        // Knockback and stun enemies
        for (const enemy of enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 5) {
                enemy.stunned = 0.5;
                enemy.x += (dx / dist) * 2;
                enemy.y += (dy / dist) * 2;
            }
        }

        // Visual effect
        particles.push({
            x: this.x,
            y: this.y,
            vx: 0,
            vy: 0,
            life: 0.3,
            color: '#fff',
            size: 10,
            type: 'ring'
        });

        this.invulnerable = true;
        this.invulnerableTime = 1.0;
    }

    takeDamage(amount) {
        if (this.invulnerable) return;

        // Armor absorbs hit
        if (this.armor > 0) {
            this.armor--;
            this.invulnerable = true;
            this.invulnerableTime = 1.0;
            floatText(this.x, this.y - 0.5, 'ARMOR!', '#88f');
            return;
        }

        // Blank bullets chance
        if (this.hasItem('Blank Bullets') && Math.random() < 0.1) {
            this.useBlank();
            floatText(this.x, this.y - 0.5, 'AUTO BLANK!', '#fff');
            return;
        }

        this.hp -= amount;
        this.invulnerable = true;
        this.invulnerableTime = 1.5;

        screenShake(0.3, 0.2);
        floatText(this.x, this.y - 0.5, `-${amount}`, '#f44');

        if (this.hp <= 0) {
            if (this.hasItem('Clone')) {
                // Revive at floor 1
                this.hp = this.maxHp;
                currentFloor = 1;
                this.removeItem('Clone');
                floatText(this.x, this.y, 'CLONE ACTIVATED!', '#ff0');
            } else {
                gameState = 'gameover';
            }
        }
    }

    hasItem(name) {
        return this.items.some(i => i.name === name);
    }

    removeItem(name) {
        const idx = this.items.findIndex(i => i.name === name);
        if (idx >= 0) this.items.splice(idx, 1);
    }

    addItem(item) {
        this.items.push(item);

        // Apply passive effects
        if (item.passive) {
            switch (item.effect) {
                case 'damage':
                    this.damageMultiplier *= item.value;
                    break;
                case 'accuracy':
                    this.spreadMultiplier *= item.value;
                    break;
                case 'reload':
                    this.reloadMultiplier *= item.value;
                    break;
                case 'tank':
                    this.maxHp += 4;
                    this.hp += 4;
                    this.armor += 2;
                    break;
                case 'superDamage':
                    this.damageMultiplier *= item.value;
                    this.fireRateMultiplier *= item.value;
                    break;
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
        const def = ENEMIES[type];
        this.name = def.name;
        this.hp = def.hp;
        this.maxHp = def.hp;
        this.damage = def.damage;
        this.speed = def.speed;
        this.fireRate = def.fireRate;
        this.pattern = def.pattern;
        this.color = def.color;
        this.size = def.size;
        this.flying = def.flying || false;
        this.fireCooldown = Math.random() * 2;
        this.stunned = 0;
        this.vx = 0;
        this.vy = 0;
        this.patternAngle = 0;
        this.target = null;
    }

    update(dt) {
        if (this.stunned > 0) {
            this.stunned -= dt;
            return;
        }

        // AI behavior
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Movement
            if (this.pattern !== 'contact') {
                // Keep distance
                const preferredDist = 4;
                if (dist > preferredDist + 1) {
                    this.vx = (dx / dist) * this.speed;
                    this.vy = (dy / dist) * this.speed;
                } else if (dist < preferredDist - 1) {
                    this.vx = -(dx / dist) * this.speed;
                    this.vy = -(dy / dist) * this.speed;
                } else {
                    // Strafe
                    this.vx = (-dy / dist) * this.speed * 0.5;
                    this.vy = (dx / dist) * this.speed * 0.5;
                }
            } else {
                // Contact enemy - chase directly
                if (dist > 0.5) {
                    this.vx = (dx / dist) * this.speed;
                    this.vy = (dy / dist) * this.speed;
                }
            }

            this.x += this.vx * dt;
            this.y += this.vy * dt;

            // Bounds
            this.x = Math.max(0.5, Math.min(ROOM_WIDTH - 0.5, this.x));
            this.y = Math.max(0.5, Math.min(ROOM_HEIGHT - 0.5, this.y));

            // Firing
            this.fireCooldown -= dt;
            if (this.fireCooldown <= 0 && this.fireRate > 0) {
                this.fire();
                this.fireCooldown = 1 / this.fireRate;
            }
        }
    }

    fire() {
        if (!player) return;
        const angle = Math.atan2(player.y - this.y, player.x - this.x);

        switch (this.pattern) {
            case 'single':
                this.spawnBullet(angle, 8);
                break;
            case 'spread3':
                for (let i = -1; i <= 1; i++) {
                    this.spawnBullet(angle + i * 0.2, 7);
                }
                break;
            case 'spread6':
                for (let i = -2; i <= 2; i++) {
                    this.spawnBullet(angle + i * 0.15, 6);
                }
                break;
            case 'spread8':
                for (let i = -3; i <= 3; i++) {
                    this.spawnBullet(angle + i * 0.12, 6);
                }
                break;
            case 'cross':
                for (let i = 0; i < 4; i++) {
                    this.spawnBullet(i * Math.PI / 2, 6);
                }
                break;
            case 'spiral':
                for (let i = 0; i < 3; i++) {
                    this.spawnBullet(this.patternAngle + i * 2 * Math.PI / 3, 5);
                }
                this.patternAngle += 0.3;
                break;
            case 'bounce':
                const b = this.spawnBullet(angle, 7);
                if (b) b.bounce = 3;
                break;
            case 'homing':
                const h = this.spawnBullet(angle, 5);
                if (h) h.homing = true;
                break;
            case 'grenade':
                const g = this.spawnBullet(angle, 4);
                if (g) {
                    g.grenade = true;
                    g.fuseTime = 1.5;
                }
                break;
            case 'circle':
                for (let i = 0; i < 8; i++) {
                    this.spawnBullet(i * Math.PI / 4, 5);
                }
                break;
            case 'summon':
                // Spawn a weak enemy
                if (enemies.length < 15) {
                    enemies.push(new Enemy(
                        this.x + (Math.random() - 0.5) * 2,
                        this.y + (Math.random() - 0.5) * 2,
                        'BULLET_KIN'
                    ));
                }
                break;
        }
    }

    spawnBullet(angle, speed) {
        const bullet = {
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage: this.damage,
            owner: 'enemy',
            color: '#f84',
            size: 0.2
        };
        bullets.push(bullet);
        return bullet;
    }

    takeDamage(amount, source) {
        this.hp -= amount;
        floatText(this.x, this.y - 0.3, Math.floor(amount).toString(), '#ff0');

        // Flash white
        this.flashTime = 0.1;

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        // Drop shells
        const shellCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < shellCount; i++) {
            pickups.push({
                x: this.x + (Math.random() - 0.5),
                y: this.y + (Math.random() - 0.5),
                type: 'shell',
                value: 1
            });
        }

        // Rare drops
        if (Math.random() < 0.05) {
            pickups.push({
                x: this.x,
                y: this.y,
                type: 'heart',
                value: 1
            });
        }
        if (Math.random() < 0.03) {
            pickups.push({
                x: this.x,
                y: this.y,
                type: 'ammo',
                value: 0.2
            });
        }

        // Death particles
        for (let i = 0; i < 8; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 0.5,
                color: this.color,
                size: 0.2
            });
        }

        // Remove from enemies array
        const idx = enemies.indexOf(this);
        if (idx >= 0) enemies.splice(idx, 1);

        // Check room clear
        if (enemies.length === 0 && currentRoom && !currentRoom.cleared) {
            currentRoom.cleared = true;
            openDoors();
        }
    }
}

// Boss class
class Boss {
    constructor(type) {
        this.type = type;
        const def = BOSSES[type];
        this.name = def.name;
        this.hp = def.hp;
        this.maxHp = def.hp;
        this.phases = def.phases;
        this.color = def.color;
        this.size = def.size;
        this.x = ROOM_WIDTH / 2;
        this.y = ROOM_HEIGHT / 3;
        this.attackCooldown = 2;
        this.currentAttack = null;
        this.attackTimer = 0;
        this.invulnerable = false;
        this.patternAngle = 0;
    }

    update(dt) {
        if (!player) return;

        this.attackCooldown -= dt;
        if (this.attackCooldown <= 0 && !this.currentAttack) {
            this.chooseAttack();
        }

        if (this.currentAttack) {
            this.attackTimer -= dt;
            this.executeAttack(dt);
            if (this.attackTimer <= 0) {
                this.currentAttack = null;
                this.attackCooldown = 1.5;
            }
        }

        this.patternAngle += dt;
    }

    chooseAttack() {
        const hpPercent = this.hp / this.maxHp;
        let availableAttacks = [];

        for (const phase of this.phases) {
            if (hpPercent <= phase.threshold) {
                availableAttacks = phase.attacks;
            }
        }

        if (availableAttacks.includes('all')) {
            availableAttacks = ['throne_spin', 'spread_volley', 'bullet_burst', 'rain', 'gatling_spray', 'wide_sweep'];
        }

        this.currentAttack = availableAttacks[Math.floor(Math.random() * availableAttacks.length)];
        this.attackTimer = 3;
    }

    executeAttack(dt) {
        switch (this.currentAttack) {
            case 'throne_spin':
                if (Math.random() < 0.3) {
                    for (let i = 0; i < 12; i++) {
                        const angle = this.patternAngle + i * Math.PI / 6;
                        this.spawnBullet(angle, 6);
                    }
                }
                break;

            case 'spread_volley':
                if (Math.random() < 0.2) {
                    const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
                    for (let i = -2; i <= 2; i++) {
                        this.spawnBullet(baseAngle + i * 0.15, 8);
                    }
                }
                break;

            case 'bullet_burst':
                if (this.attackTimer > 2.5 && Math.random() < 0.1) {
                    for (let i = 0; i < 24; i++) {
                        this.spawnBullet(i * Math.PI / 12, 4);
                    }
                }
                break;

            case 'rain':
                if (Math.random() < 0.15) {
                    for (let i = 0; i < 5; i++) {
                        bullets.push({
                            x: Math.random() * ROOM_WIDTH,
                            y: 0,
                            vx: 0,
                            vy: 6,
                            damage: 1,
                            owner: 'enemy',
                            color: '#f84',
                            size: 0.25
                        });
                    }
                }
                break;

            case 'gatling_spray':
                if (Math.random() < 0.4) {
                    const angle = Math.atan2(player.y - this.y, player.x - this.x) + (Math.random() - 0.5) * 0.5;
                    this.spawnBullet(angle, 10);
                }
                break;

            case 'wide_sweep':
                if (Math.random() < 0.2) {
                    const sweep = Math.sin(this.attackTimer * 3) * 1.5;
                    const baseAngle = Math.atan2(player.y - this.y, player.x - this.x) + sweep;
                    for (let i = -1; i <= 1; i++) {
                        this.spawnBullet(baseAngle + i * 0.1, 7);
                    }
                }
                break;
        }
    }

    spawnBullet(angle, speed) {
        bullets.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage: 1,
            owner: 'enemy',
            color: '#fc4',
            size: 0.25
        });
    }

    takeDamage(amount) {
        if (this.invulnerable) return;

        this.hp -= amount;
        floatText(this.x, this.y - 1, Math.floor(amount).toString(), '#ff0');
        screenShake(0.05, 0.1);

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        // Drop rewards
        for (let i = 0; i < 20; i++) {
            pickups.push({
                x: this.x + (Math.random() - 0.5) * 3,
                y: this.y + (Math.random() - 0.5) * 3,
                type: 'shell',
                value: Math.floor(Math.random() * 3) + 2
            });
        }

        // Drop key
        pickups.push({
            x: this.x,
            y: this.y,
            type: 'key',
            value: 1
        });

        // Hegemony credits
        hegemonyCredits += 5 + currentFloor * 2;

        // Death particles
        for (let i = 0; i < 30; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1,
                color: this.color,
                size: 0.4
            });
        }

        boss = null;
        currentRoom.cleared = true;
        openDoors();

        floatText(this.x, this.y, 'BOSS DEFEATED!', '#ff0');
    }
}

// Room generation
function generateFloor(floorNum) {
    rooms = [];
    minimap = [];

    const roomCount = 8 + floorNum * 2;

    // Create room layout (simple linear + branches)
    const layout = [];
    let x = 0, y = 0;

    // Main path
    for (let i = 0; i < roomCount; i++) {
        layout.push({ x, y, type: i === 0 ? 'entrance' : i === roomCount - 1 ? 'boss' : 'combat' });

        // Random direction
        if (Math.random() < 0.5) {
            x += Math.random() < 0.5 ? 1 : -1;
        } else {
            y += Math.random() < 0.5 ? 1 : -1;
        }
    }

    // Add shop
    const shopIdx = Math.floor(roomCount / 3);
    layout.splice(shopIdx, 0, { x: layout[shopIdx].x + 1, y: layout[shopIdx].y, type: 'shop' });

    // Add treasure rooms
    const treasureIdx = Math.floor(roomCount * 2 / 3);
    layout.splice(treasureIdx, 0, { x: layout[treasureIdx].x - 1, y: layout[treasureIdx].y, type: 'treasure' });

    // Create rooms
    for (const pos of layout) {
        const room = createRoom(pos.type, floorNum);
        room.gridX = pos.x;
        room.gridY = pos.y;
        rooms.push(room);
        minimap.push({ x: pos.x, y: pos.y, type: pos.type, visited: false });
    }

    // Set starting room
    currentRoom = rooms[0];
    currentRoom.visited = true;
    minimap[0].visited = true;

    return rooms[0];
}

function createRoom(type, floorNum) {
    const room = {
        type: type,
        enemies: [],
        cleared: type === 'entrance' || type === 'shop' || type === 'treasure',
        doors: [],
        objects: []
    };

    // Spawn enemies based on type and floor
    if (type === 'combat') {
        const enemyCount = 3 + floorNum + Math.floor(Math.random() * 3);
        const enemyTypes = getEnemyTypesForFloor(floorNum);

        for (let i = 0; i < enemyCount; i++) {
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            room.enemies.push({
                type: type,
                x: 2 + Math.random() * (ROOM_WIDTH - 4),
                y: 2 + Math.random() * (ROOM_HEIGHT - 4)
            });
        }
    }

    // Add tables for cover
    if (type === 'combat') {
        const tableCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < tableCount; i++) {
            room.objects.push({
                type: 'table',
                x: 3 + Math.random() * (ROOM_WIDTH - 6),
                y: 3 + Math.random() * (ROOM_HEIGHT - 6),
                flipped: false,
                hp: 30
            });
        }
    }

    // Add chest to treasure room
    if (type === 'treasure') {
        const quality = rollChestQuality(floorNum);
        room.objects.push({
            type: 'chest',
            x: ROOM_WIDTH / 2,
            y: ROOM_HEIGHT / 2,
            quality: quality,
            locked: quality !== 'D' || Math.random() > 0.5,
            opened: false
        });
    }

    return room;
}

function getEnemyTypesForFloor(floor) {
    const types = ['BULLET_KIN', 'BANDANA_KIN'];
    if (floor >= 1) types.push('VETERAN_KIN', 'CARDINAL', 'SHROOMER', 'SKULLET');
    if (floor >= 2) types.push('SHOTGUN_BLUE', 'SHOTGUN_RED', 'SHOTGUN_MUTANT', 'BOOKLLET', 'GUN_NUT');
    if (floor >= 3) types.push('GUNJURER', 'LEAD_MAIDEN', 'GRENADE_KIN', 'RUBBER_KIN', 'SHOTGRUB', 'MINELET', 'DYNAMITE_KIN', 'SNIPER_SHELL');
    if (floor >= 4) types.push('HOLLOWPOINT', 'SPECTRE', 'GUNREAPER', 'REVOLVENANT');
    if (floor >= 5) types.push('METAL_KIN', 'FLAME_KIN', 'CHAIN_GUNNER', 'TANK');
    return types;
}

function rollChestQuality(floor) {
    const roll = Math.random() * 100;
    const weights = {
        1: { D: 50, C: 35, B: 12, A: 2.5, S: 0.5 },
        2: { D: 35, C: 40, B: 18, A: 5, S: 2 },
        3: { D: 25, C: 35, B: 25, A: 10, S: 5 },
        4: { D: 15, C: 30, B: 30, A: 17, S: 8 },
        5: { D: 10, C: 25, B: 30, A: 22, S: 13 }
    }[Math.min(floor, 5)];

    let cumulative = 0;
    for (const [quality, weight] of Object.entries(weights)) {
        cumulative += weight;
        if (roll < cumulative) return quality;
    }
    return 'D';
}

function enterRoom(room) {
    currentRoom = room;
    room.visited = true;

    // Update minimap
    for (const m of minimap) {
        if (m.x === room.gridX && m.y === room.gridY) {
            m.visited = true;
        }
    }

    // Spawn enemies
    enemies = [];
    for (const e of room.enemies) {
        enemies.push(new Enemy(e.x, e.y, e.type));
    }

    // Spawn objects
    tables = [];
    chests = [];
    for (const obj of room.objects) {
        if (obj.type === 'table') {
            tables.push({ ...obj });
        } else if (obj.type === 'chest') {
            chests.push({ ...obj });
        }
    }

    // Boss room
    if (room.type === 'boss' && !room.cleared) {
        const bossTypes = Object.keys(BOSSES);
        boss = new Boss(bossTypes[Math.floor(Math.random() * bossTypes.length)]);
    }

    // Close doors if enemies present
    if (!room.cleared && enemies.length > 0) {
        closeDoors();
    }

    // Position player
    player.x = ROOM_WIDTH / 2;
    player.y = ROOM_HEIGHT - 2;
}

function openDoors() {
    doors = [
        { x: ROOM_WIDTH / 2, y: 0.5, dir: 'up', locked: false },
        { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT - 0.5, dir: 'down', locked: false },
        { x: 0.5, y: ROOM_HEIGHT / 2, dir: 'left', locked: false },
        { x: ROOM_WIDTH - 0.5, y: ROOM_HEIGHT / 2, dir: 'right', locked: false }
    ];
}

function closeDoors() {
    doors = [
        { x: ROOM_WIDTH / 2, y: 0.5, dir: 'up', locked: true },
        { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT - 0.5, dir: 'down', locked: true },
        { x: 0.5, y: ROOM_HEIGHT / 2, dir: 'left', locked: true },
        { x: ROOM_WIDTH - 0.5, y: ROOM_HEIGHT / 2, dir: 'right', locked: true }
    ];
}

// Utility functions
function floatText(x, y, text, color) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        life: 1
    });
}

let shakeIntensity = 0;
let shakeDuration = 0;

function screenShake(intensity, duration) {
    shakeIntensity = Math.max(shakeIntensity, intensity);
    shakeDuration = Math.max(shakeDuration, duration);
}

function updateShake(dt) {
    if (shakeDuration > 0) {
        shakeDuration -= dt;
        if (shakeDuration <= 0) {
            shakeIntensity = 0;
        }
    }
}

// Main update
function update(dt) {
    if (gameState === 'menu') {
        // Menu logic
        return;
    }

    if (gameState === 'gameover') {
        return;
    }

    if (gameState !== 'playing') return;

    // Update player
    player.update(dt);

    // Update enemies
    for (const enemy of [...enemies]) {
        enemy.update(dt);
    }

    // Update boss
    if (boss) {
        boss.update(dt);
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];

        // Homing
        if (b.homing) {
            let target = null;
            let minDist = Infinity;

            if (b.owner === 'player') {
                for (const e of enemies) {
                    const d = Math.sqrt((e.x - b.x) ** 2 + (e.y - b.y) ** 2);
                    if (d < minDist) {
                        minDist = d;
                        target = e;
                    }
                }
                if (boss) {
                    const d = Math.sqrt((boss.x - b.x) ** 2 + (boss.y - b.y) ** 2);
                    if (d < minDist) target = boss;
                }
            } else {
                target = player;
            }

            if (target) {
                const angle = Math.atan2(target.y - b.y, target.x - b.x);
                const speed = Math.sqrt(b.vx ** 2 + b.vy ** 2);
                b.vx += Math.cos(angle) * 0.3;
                b.vy += Math.sin(angle) * 0.3;
                const newSpeed = Math.sqrt(b.vx ** 2 + b.vy ** 2);
                b.vx = (b.vx / newSpeed) * speed;
                b.vy = (b.vy / newSpeed) * speed;
            }
        }

        // Movement
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Grenade timer
        if (b.grenade) {
            b.fuseTime -= dt;
            if (b.fuseTime <= 0) {
                // Explode
                for (let a = 0; a < 8; a++) {
                    bullets.push({
                        x: b.x,
                        y: b.y,
                        vx: Math.cos(a * Math.PI / 4) * 5,
                        vy: Math.sin(a * Math.PI / 4) * 5,
                        damage: 1,
                        owner: 'enemy',
                        color: '#f84',
                        size: 0.2
                    });
                }
                bullets.splice(i, 1);
                continue;
            }
        }

        // Bounds check / bounce
        if (b.x < 0 || b.x > ROOM_WIDTH || b.y < 0 || b.y > ROOM_HEIGHT) {
            if (b.bounce > 0) {
                b.bounce--;
                if (b.x < 0 || b.x > ROOM_WIDTH) b.vx *= -1;
                if (b.y < 0 || b.y > ROOM_HEIGHT) b.vy *= -1;
                b.x = Math.max(0, Math.min(ROOM_WIDTH, b.x));
                b.y = Math.max(0, Math.min(ROOM_HEIGHT, b.y));
            } else {
                bullets.splice(i, 1);
                continue;
            }
        }

        // Collision with player
        if (b.owner === 'enemy' && !player.invulnerable && !player.isRolling) {
            const dx = player.x - b.x;
            const dy = player.y - b.y;
            if (dx * dx + dy * dy < (player.size + b.size) ** 2) {
                player.takeDamage(b.damage);
                bullets.splice(i, 1);
                continue;
            }
        }

        // Collision with enemies
        if (b.owner === 'player') {
            let hit = false;

            for (const enemy of enemies) {
                const dx = enemy.x - b.x;
                const dy = enemy.y - b.y;
                if (dx * dx + dy * dy < (enemy.size + b.size) ** 2) {
                    enemy.takeDamage(b.damage);

                    // Chain lightning
                    if (b.chain > 0) {
                        for (const other of enemies) {
                            if (other !== enemy) {
                                const d = Math.sqrt((other.x - enemy.x) ** 2 + (other.y - enemy.y) ** 2);
                                if (d < 3) {
                                    other.takeDamage(b.damage * 0.5);
                                    // Visual chain
                                    particles.push({
                                        x: enemy.x,
                                        y: enemy.y,
                                        vx: (other.x - enemy.x) / 0.1,
                                        vy: (other.y - enemy.y) / 0.1,
                                        life: 0.1,
                                        color: '#88f',
                                        size: 0.1,
                                        type: 'chain'
                                    });
                                    break;
                                }
                            }
                        }
                    }

                    // Explosive
                    if (b.explosive) {
                        for (const other of enemies) {
                            const d = Math.sqrt((other.x - b.x) ** 2 + (other.y - b.y) ** 2);
                            if (d < 2) {
                                other.takeDamage(b.damage * 0.5);
                            }
                        }
                        particles.push({
                            x: b.x,
                            y: b.y,
                            vx: 0,
                            vy: 0,
                            life: 0.3,
                            color: '#f80',
                            size: 2,
                            type: 'explosion'
                        });
                    }

                    if (!b.pierce) {
                        hit = true;
                        break;
                    }
                }
            }

            // Boss collision
            if (boss && !hit) {
                const dx = boss.x - b.x;
                const dy = boss.y - b.y;
                if (dx * dx + dy * dy < (boss.size + b.size) ** 2) {
                    boss.takeDamage(b.damage);
                    if (!b.pierce) hit = true;
                }
            }

            if (hit) {
                bullets.splice(i, 1);
            }
        }
    }

    // Update pickups
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dx = player.x - p.x;
        const dy = player.y - p.y;

        if (dx * dx + dy * dy < 1) {
            switch (p.type) {
                case 'shell':
                    shells += p.value;
                    floatText(p.x, p.y, `+${p.value}`, '#fc0');
                    break;
                case 'heart':
                    if (player.hp < player.maxHp) {
                        player.hp = Math.min(player.hp + p.value, player.maxHp);
                        floatText(p.x, p.y, '+HEART', '#f44');
                    }
                    break;
                case 'ammo':
                    player.weapon.totalAmmo = Math.floor(player.weapon.totalAmmo * (1 + p.value));
                    floatText(p.x, p.y, '+AMMO', '#4a4');
                    break;
                case 'key':
                    keys += p.value;
                    floatText(p.x, p.y, '+KEY', '#ff0');
                    break;
                case 'blank':
                    blanks += p.value;
                    floatText(p.x, p.y, '+BLANK', '#fff');
                    break;
            }
            pickups.splice(i, 1);
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const t = floatingTexts[i];
        t.y -= dt * 2;
        t.life -= dt;
        if (t.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }

    // Update screen shake
    updateShake(dt);

    // Check door transitions
    if (currentRoom && currentRoom.cleared) {
        for (const door of doors) {
            if (!door.locked) {
                const dx = player.x - door.x;
                const dy = player.y - door.y;
                if (dx * dx + dy * dy < 1) {
                    // Find next room
                    let nextGridX = currentRoom.gridX;
                    let nextGridY = currentRoom.gridY;
                    if (door.dir === 'up') nextGridY--;
                    if (door.dir === 'down') nextGridY++;
                    if (door.dir === 'left') nextGridX--;
                    if (door.dir === 'right') nextGridX++;

                    for (const room of rooms) {
                        if (room.gridX === nextGridX && room.gridY === nextGridY) {
                            enterRoom(room);
                            break;
                        }
                    }
                }
            }
        }
    }

    // Check chest interaction
    for (const chest of chests) {
        if (!chest.opened) {
            const dx = player.x - chest.x;
            const dy = player.y - chest.y;
            if (dx * dx + dy * dy < 1.5) {
                chest.nearPlayer = true;
            } else {
                chest.nearPlayer = false;
            }
        }
    }
}

// Rendering
function render() {
    const ctx = mainContext;
    const scale = TILE_SIZE;

    // Clear
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply screen shake
    ctx.save();
    if (shakeIntensity > 0) {
        ctx.translate(
            (Math.random() - 0.5) * shakeIntensity * scale,
            (Math.random() - 0.5) * shakeIntensity * scale
        );
    }

    // Draw floor tiles
    ctx.fillStyle = '#252542';
    for (let x = 0; x < ROOM_WIDTH; x++) {
        for (let y = 0; y < ROOM_HEIGHT; y++) {
            if ((x + y) % 2 === 0) {
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
    }

    // Draw walls
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 0, CANVAS_WIDTH, scale * 0.3);
    ctx.fillRect(0, CANVAS_HEIGHT - scale * 0.3, CANVAS_WIDTH, scale * 0.3);
    ctx.fillRect(0, 0, scale * 0.3, CANVAS_HEIGHT);
    ctx.fillRect(CANVAS_WIDTH - scale * 0.3, 0, scale * 0.3, CANVAS_HEIGHT);

    // Draw doors
    for (const door of doors) {
        ctx.fillStyle = door.locked ? '#844' : '#484';
        ctx.fillRect(
            (door.x - 0.5) * scale,
            (door.y - 0.5) * scale,
            scale,
            scale
        );
    }

    // Draw tables
    for (const table of tables) {
        ctx.fillStyle = table.flipped ? '#654' : '#863';
        ctx.fillRect(
            (table.x - 0.5) * scale,
            (table.y - 0.3) * scale,
            scale,
            scale * 0.6
        );
    }

    // Draw chests
    for (const chest of chests) {
        if (chest.opened) {
            ctx.fillStyle = '#333';
        } else {
            switch (chest.quality) {
                case 'S': ctx.fillStyle = '#000'; break;
                case 'A': ctx.fillStyle = '#c44'; break;
                case 'B': ctx.fillStyle = '#4c4'; break;
                case 'C': ctx.fillStyle = '#44c'; break;
                default: ctx.fillStyle = '#864'; break;
            }
        }
        ctx.fillRect(
            (chest.x - 0.4) * scale,
            (chest.y - 0.3) * scale,
            scale * 0.8,
            scale * 0.6
        );

        // Lock indicator
        if (chest.locked && !chest.opened) {
            ctx.fillStyle = '#fc0';
            ctx.fillRect(
                (chest.x - 0.1) * scale,
                (chest.y - 0.15) * scale,
                scale * 0.2,
                scale * 0.3
            );
        }

        // Interaction prompt
        if (chest.nearPlayer && !chest.opened) {
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('[E] Open', chest.x * scale, (chest.y - 0.6) * scale);
        }
    }

    // Draw pickups
    for (const p of pickups) {
        switch (p.type) {
            case 'shell': ctx.fillStyle = '#fc0'; break;
            case 'heart': ctx.fillStyle = '#f44'; break;
            case 'ammo': ctx.fillStyle = '#4c4'; break;
            case 'key': ctx.fillStyle = '#ff0'; break;
            case 'blank': ctx.fillStyle = '#fff'; break;
        }
        ctx.beginPath();
        ctx.arc(p.x * scale, p.y * scale, scale * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw enemies
    for (const enemy of enemies) {
        ctx.fillStyle = enemy.flashTime > 0 ? '#fff' : enemy.color;
        if (enemy.flashTime > 0) enemy.flashTime -= 0.016;

        ctx.beginPath();
        ctx.arc(enemy.x * scale, enemy.y * scale, enemy.size * scale, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        const hpPercent = enemy.hp / enemy.maxHp;
        if (hpPercent < 1) {
            ctx.fillStyle = '#400';
            ctx.fillRect((enemy.x - 0.4) * scale, (enemy.y - enemy.size - 0.3) * scale, scale * 0.8, 3);
            ctx.fillStyle = '#f44';
            ctx.fillRect((enemy.x - 0.4) * scale, (enemy.y - enemy.size - 0.3) * scale, scale * 0.8 * hpPercent, 3);
        }
    }

    // Draw boss
    if (boss) {
        ctx.fillStyle = boss.color;
        ctx.beginPath();
        ctx.arc(boss.x * scale, boss.y * scale, boss.size * scale, 0, Math.PI * 2);
        ctx.fill();

        // Boss health bar
        ctx.fillStyle = '#400';
        ctx.fillRect(scale * 2, scale * 0.5, CANVAS_WIDTH - scale * 4, 8);
        ctx.fillStyle = '#f44';
        ctx.fillRect(scale * 2, scale * 0.5, (CANVAS_WIDTH - scale * 4) * (boss.hp / boss.maxHp), 8);

        // Boss name
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(boss.name, CANVAS_WIDTH / 2, scale * 0.5 - 4);
    }

    // Draw player
    if (player && gameState === 'playing') {
        // Don't draw if blinking
        if (!player.invulnerable || Math.floor(player.blinkTimer) % 2 === 0) {
            // Body
            ctx.fillStyle = player.isRolling ? '#88f' : '#4af';
            ctx.beginPath();
            ctx.arc(player.x * scale, player.y * scale, player.size * scale, 0, Math.PI * 2);
            ctx.fill();

            // Gun
            ctx.strokeStyle = player.weapon.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(player.x * scale, player.y * scale);
            ctx.lineTo(
                (player.x + Math.cos(player.angle) * 0.6) * scale,
                (player.y + Math.sin(player.angle) * 0.6) * scale
            );
            ctx.stroke();
        }
    }

    // Draw bullets
    for (const b of bullets) {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x * scale, b.y * scale, b.size * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw particles
    for (const p of particles) {
        ctx.fillStyle = p.color;
        if (p.type === 'ring') {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x * scale, p.y * scale, p.size * scale * (1 - p.life / 0.3), 0, Math.PI * 2);
            ctx.stroke();
        } else if (p.type === 'explosion') {
            ctx.globalAlpha = p.life / 0.3;
            ctx.beginPath();
            ctx.arc(p.x * scale, p.y * scale, p.size * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else {
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x * scale, p.y * scale, p.size * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    // Draw floating texts
    for (const t of floatingTexts) {
        ctx.fillStyle = t.color;
        ctx.globalAlpha = t.life;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x * scale, t.y * scale);
        ctx.globalAlpha = 1;
    }

    ctx.restore();

    // Draw HUD
    drawHUD(ctx);

    // Draw minimap
    drawMinimap(ctx);

    // Draw menu
    if (gameState === 'menu') {
        drawMenu(ctx);
    }

    // Draw game over
    if (gameState === 'gameover') {
        drawGameOver(ctx);
    }
}

function drawHUD(ctx) {
    if (!player) return;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 24);
    ctx.fillRect(0, CANVAS_HEIGHT - 24, CANVAS_WIDTH, 24);

    // Top bar
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    // Hearts
    for (let i = 0; i < Math.ceil(player.maxHp / 2); i++) {
        const hp = player.hp - i * 2;
        if (hp >= 2) ctx.fillStyle = '#f44';
        else if (hp >= 1) ctx.fillStyle = '#844';
        else ctx.fillStyle = '#444';
        ctx.fillText('\u2665', 5 + i * 14, 16);
    }

    // Armor
    ctx.fillStyle = '#88f';
    for (let i = 0; i < player.armor; i++) {
        ctx.fillText('\u25a0', 100 + i * 14, 16);
    }

    // Blanks
    ctx.fillStyle = '#fff';
    ctx.fillText(`Blanks: ${blanks}`, 160, 16);

    // Keys
    ctx.fillStyle = '#fc0';
    ctx.fillText(`Keys: ${keys}`, 240, 16);

    // Shells (currency)
    ctx.fillStyle = '#fc0';
    ctx.fillText(`$${shells}`, CANVAS_WIDTH - 60, 16);

    // Floor
    ctx.fillStyle = '#888';
    ctx.fillText(`Floor ${currentFloor}`, CANVAS_WIDTH - 140, 16);

    // Bottom bar - weapon info
    ctx.fillStyle = '#fff';
    ctx.fillText(player.weapon.name, 5, CANVAS_HEIGHT - 8);

    // Ammo
    if (player.weapon.totalAmmo === Infinity) {
        ctx.fillText(`${player.weapon.ammo}/${player.weapon.magSize} [\u221e]`, 120, CANVAS_HEIGHT - 8);
    } else {
        ctx.fillText(`${player.weapon.ammo}/${player.weapon.magSize} [${player.weapon.totalAmmo}]`, 120, CANVAS_HEIGHT - 8);
    }

    // Reloading indicator
    if (player.reloading) {
        ctx.fillStyle = '#ff0';
        ctx.fillText('RELOADING...', 220, CANVAS_HEIGHT - 8);
    }

    // Room type
    if (currentRoom) {
        ctx.fillStyle = '#888';
        ctx.textAlign = 'right';
        ctx.fillText(currentRoom.type.toUpperCase(), CANVAS_WIDTH - 5, CANVAS_HEIGHT - 8);
    }
}

function drawMinimap(ctx) {
    const mapSize = 60;
    const cellSize = 8;
    const startX = CANVAS_WIDTH - mapSize - 5;
    const startY = 30;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(startX - 5, startY - 5, mapSize + 10, mapSize + 10);

    // Find bounds
    let minX = Infinity, minY = Infinity;
    for (const m of minimap) {
        minX = Math.min(minX, m.x);
        minY = Math.min(minY, m.y);
    }

    for (const m of minimap) {
        const x = startX + (m.x - minX) * cellSize;
        const y = startY + (m.y - minY) * cellSize;

        if (m.visited) {
            switch (m.type) {
                case 'entrance': ctx.fillStyle = '#484'; break;
                case 'boss': ctx.fillStyle = '#c44'; break;
                case 'shop': ctx.fillStyle = '#44c'; break;
                case 'treasure': ctx.fillStyle = '#fc0'; break;
                default: ctx.fillStyle = '#666'; break;
            }
        } else {
            ctx.fillStyle = '#333';
        }

        ctx.fillRect(x, y, cellSize - 1, cellSize - 1);

        // Current room indicator
        if (currentRoom && m.x === currentRoom.gridX && m.y === currentRoom.gridY) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 2, y + 2, cellSize - 5, cellSize - 5);
        }
    }
}

function drawMenu(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#fc0';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BULLETSTORM DEPTHS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);

    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.fillText('Enter the Gungeon Clone', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + 30);

    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Press SPACE or CLICK to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    ctx.fillText('WASD - Move    Mouse - Aim    Click - Shoot', CANVAS_WIDTH / 2, CANVAS_HEIGHT * 2 / 3);
    ctx.fillText('SPACE - Dodge Roll    R - Reload    Q - Blank', CANVAS_WIDTH / 2, CANVAS_HEIGHT * 2 / 3 + 20);
    ctx.fillText('E - Interact    Scroll - Switch Weapon', CANVAS_WIDTH / 2, CANVAS_HEIGHT * 2 / 3 + 40);
}

function drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#f44';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);

    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.fillText(`You reached Floor ${currentFloor}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + 30);
    ctx.fillText(`Hegemony Credits: ${hegemonyCredits}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + 50);

    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Press SPACE to Try Again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

// Input handling
let keys_pressed = {};
let mouseX = 0, mouseY = 0;
let mouseDown = false;

function handleInput() {
    if (gameState !== 'playing') return;

    // Movement
    player.vx = 0;
    player.vy = 0;
    if (keys_pressed['KeyW'] || keys_pressed['ArrowUp']) player.vy = -1;
    if (keys_pressed['KeyS'] || keys_pressed['ArrowDown']) player.vy = 1;
    if (keys_pressed['KeyA'] || keys_pressed['ArrowLeft']) player.vx = -1;
    if (keys_pressed['KeyD'] || keys_pressed['ArrowRight']) player.vx = 1;

    // Normalize diagonal movement
    if (player.vx !== 0 && player.vy !== 0) {
        player.vx *= 0.707;
        player.vy *= 0.707;
    }

    // Aim at mouse
    const rect = mainCanvas.getBoundingClientRect();
    const mx = (mouseX - rect.left) / TILE_SIZE;
    const my = (mouseY - rect.top) / TILE_SIZE;
    player.angle = Math.atan2(my - player.y, mx - player.x);

    // Firing
    if (mouseDown) {
        player.fire();
    }
}

// LittleJS setup
function gameInit() {
    // Set canvas size
    setCanvasFixedSize(vec2(CANVAS_WIDTH, CANVAS_HEIGHT));
}

function gameUpdate() {
    const dt = 1/60;

    handleInput();
    update(dt);
}

function gameRender() {
    render();
}

function gameRenderPost() {}

// Input event handlers
document.addEventListener('keydown', (e) => {
    keys_pressed[e.code] = true;

    if (gameState === 'menu') {
        if (e.code === 'Space') {
            startGame();
        }
    } else if (gameState === 'gameover') {
        if (e.code === 'Space') {
            startGame();
        }
    } else if (gameState === 'playing') {
        if (e.code === 'Space') {
            player.dodge(player.vx, player.vy);
        }
        if (e.code === 'KeyR') {
            player.reload();
        }
        if (e.code === 'KeyQ') {
            player.useBlank();
        }
        if (e.code === 'KeyE') {
            interactWithChest();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys_pressed[e.code] = false;
});

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

document.addEventListener('mousedown', (e) => {
    mouseDown = true;
    if (gameState === 'menu') {
        startGame();
    }
});

document.addEventListener('mouseup', () => {
    mouseDown = false;
});

document.addEventListener('wheel', (e) => {
    if (gameState === 'playing') {
        player.switchWeapon(e.deltaY > 0 ? 1 : -1);
    }
});

function interactWithChest() {
    for (const chest of chests) {
        if (chest.nearPlayer && !chest.opened) {
            if (chest.locked) {
                if (keys > 0) {
                    keys--;
                    chest.locked = false;
                    openChest(chest);
                } else {
                    floatText(chest.x, chest.y, 'NEED KEY', '#f44');
                }
            } else {
                openChest(chest);
            }
            break;
        }
    }
}

function openChest(chest) {
    chest.opened = true;

    // Get item based on quality
    const weapons = Object.entries(WEAPONS).filter(([k, w]) => w.quality === chest.quality);
    const items = Object.entries(ITEMS).filter(([k, i]) => i.quality === chest.quality);
    const all = [...weapons.map(([k, w]) => ({ type: 'weapon', data: { ...w, key: k } })),
                 ...items.map(([k, i]) => ({ type: 'item', data: { ...i, key: k } }))];

    if (all.length > 0) {
        const reward = all[Math.floor(Math.random() * all.length)];

        if (reward.type === 'weapon') {
            const weapon = { ...reward.data, ammo: reward.data.magSize, totalAmmo: reward.data.maxAmmo };
            player.weapons.push(weapon);
            floatText(chest.x, chest.y, `+${weapon.name}`, '#ff0');
        } else {
            player.addItem(reward.data);
            floatText(chest.x, chest.y, `+${reward.data.name}`, '#ff0');
        }
    }
}

function startGame() {
    gameState = 'playing';
    currentFloor = 1;
    shells = 0;
    keys = 1;
    blanks = 2;
    hegemonyCredits = 0;

    player = new Player(ROOM_WIDTH / 2, ROOM_HEIGHT - 2);
    enemies = [];
    bullets = [];
    pickups = [];
    particles = [];
    floatingTexts = [];
    boss = null;

    generateFloor(currentFloor);
    enterRoom(rooms[0]);
    openDoors();
}

// Start LittleJS
engineInit(gameInit, gameUpdate, gameRender, gameRenderPost);
