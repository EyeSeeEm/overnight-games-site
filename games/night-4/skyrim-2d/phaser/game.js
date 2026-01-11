// Frostfall: A 2D Skyrim Demake - Phaser 3 Implementation

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TILE_SIZE = 32;

// Game constants
const PLAYER = {
    WALK_SPEED: 120,
    SPRINT_SPEED: 200,
    DODGE_SPEED: 300,
    DODGE_DURATION: 300,
    BASE_HP: 100,
    BASE_MP: 50,
    BASE_STAMINA: 100,
    HP_PER_LEVEL: 10,
    MP_PER_LEVEL: 5,
    STAMINA_PER_LEVEL: 5,
    STAMINA_REGEN: 15,
    STAMINA_REGEN_DELAY: 800
};

const COMBAT = {
    LIGHT_ATTACK_STAMINA: 10,
    POWER_ATTACK_STAMINA: 25,
    DODGE_STAMINA: 20,
    SPRINT_STAMINA_PER_SEC: 8,
    BLOCK_STAMINA_PER_HIT: 5,
    SNEAK_MULTIPLIER: 2.0
};

// Weapon definitions
const WEAPONS = {
    IRON_SWORD: { name: 'Iron Sword', damage: 12, speed: 300, range: 40, type: 'melee' },
    STEEL_SWORD: { name: 'Steel Sword', damage: 18, speed: 300, range: 40, type: 'melee' },
    ORCISH_SWORD: { name: 'Orcish Sword', damage: 24, speed: 300, range: 40, type: 'melee' },
    ELVEN_SWORD: { name: 'Elven Sword', damage: 28, speed: 280, range: 40, type: 'melee' },
    DAEDRIC_SWORD: { name: 'Daedric Sword', damage: 35, speed: 320, range: 45, type: 'melee' },
    IRON_DAGGER: { name: 'Iron Dagger', damage: 8, speed: 200, range: 30, type: 'melee', sneakBonus: 2 },
    STEEL_DAGGER: { name: 'Steel Dagger', damage: 12, speed: 180, range: 30, type: 'melee', sneakBonus: 2.5 },
    IRON_GREATSWORD: { name: 'Iron Greatsword', damage: 22, speed: 500, range: 50, type: 'melee' },
    STEEL_GREATSWORD: { name: 'Steel Greatsword', damage: 30, speed: 500, range: 55, type: 'melee' },
    IRON_AXE: { name: 'Iron War Axe', damage: 14, speed: 350, range: 35, type: 'melee' },
    STEEL_AXE: { name: 'Steel War Axe', damage: 20, speed: 350, range: 38, type: 'melee' },
    HUNTING_BOW: { name: 'Hunting Bow', damage: 15, speed: 600, range: 300, type: 'ranged' },
    LONG_BOW: { name: 'Long Bow', damage: 22, speed: 800, range: 400, type: 'ranged' },
    ELVEN_BOW: { name: 'Elven Bow', damage: 28, speed: 650, range: 450, type: 'ranged' },
    DAEDRIC_BOW: { name: 'Daedric Bow', damage: 38, speed: 750, range: 500, type: 'ranged' },
    CROSSBOW: { name: 'Crossbow', damage: 32, speed: 900, range: 350, type: 'ranged' },
    STAFF_FLAMES: { name: 'Staff of Flames', damage: 8, speed: 100, range: 100, type: 'magic', spell: 'flames' },
    STAFF_FROST: { name: 'Staff of Frost', damage: 12, speed: 400, range: 200, type: 'magic', spell: 'frost' },
    STAFF_SPARKS: { name: 'Staff of Sparks', damage: 10, speed: 150, range: 120, type: 'magic', spell: 'sparks' },
    STAFF_FIREBOLT: { name: 'Staff of Firebolt', damage: 25, speed: 600, range: 250, type: 'magic', spell: 'firebolt' }
};

// Spell definitions
const SPELLS = {
    FLAMES: { name: 'Flames', damage: 8, cost: 8, range: 80, type: 'stream', color: 0xff4400 },
    FROSTBITE: { name: 'Frostbite', damage: 10, cost: 12, range: 200, type: 'projectile', color: 0x44aaff, effect: 'slow' },
    SPARKS: { name: 'Sparks', damage: 6, cost: 10, range: 100, type: 'stream', color: 0xffff00 },
    FIREBOLT: { name: 'Firebolt', damage: 25, cost: 20, range: 300, type: 'projectile', color: 0xff6600, effect: 'burn' },
    ICE_SPIKE: { name: 'Ice Spike', damage: 30, cost: 25, range: 350, type: 'projectile', color: 0x88ddff },
    HEALING: { name: 'Healing', heal: 15, cost: 12, range: 0, type: 'self' },
    FAST_HEALING: { name: 'Fast Healing', heal: 35, cost: 25, range: 0, type: 'self' },
    CONJURE_FAMILIAR: { name: 'Conjure Familiar', cost: 30, duration: 30, type: 'summon' }
};

// Perk definitions
const PERKS = {
    ARMSMAN_1: { name: 'Armsman', skill: 'combat', level: 2, effect: 'damage', value: 1.2 },
    ARMSMAN_2: { name: 'Armsman II', skill: 'combat', level: 5, effect: 'damage', value: 1.4 },
    POWER_STRIKE: { name: 'Power Strike', skill: 'combat', level: 4, effect: 'powerAttack', value: 2 },
    WARRIOR_RESOLVE: { name: "Warrior's Resolve", skill: 'combat', level: 7, effect: 'maxHp', value: 20 },
    NOVICE_MAGE: { name: 'Novice Mage', skill: 'magic', level: 2, effect: 'spellCost', value: 0.75 },
    IMPACT: { name: 'Impact', skill: 'magic', level: 4, effect: 'stagger', value: true },
    ARCANE_MASTERY: { name: 'Arcane Mastery', skill: 'magic', level: 7, effect: 'maxMagicka', value: 30 },
    STEALTH_1: { name: 'Stealth', skill: 'stealth', level: 2, effect: 'detection', value: 0.75 },
    DEADLY_AIM: { name: 'Deadly Aim', skill: 'stealth', level: 4, effect: 'sneakDamage', value: 1.5 },
    ASSASSIN: { name: 'Assassin', skill: 'stealth', level: 7, effect: 'sneakDamage', value: 3 }
};

// Armor definitions
const ARMOR = {
    LEATHER_ARMOR: { name: 'Leather Armor', slot: 'body', armor: 15, weight: 'light' },
    IRON_ARMOR: { name: 'Iron Armor', slot: 'body', armor: 30, weight: 'heavy', speedPenalty: 0.1 },
    STEEL_ARMOR: { name: 'Steel Armor', slot: 'body', armor: 40, weight: 'heavy', speedPenalty: 0.1 },
    ELVEN_ARMOR: { name: 'Elven Armor', slot: 'body', armor: 35, weight: 'light' },
    LEATHER_HELMET: { name: 'Leather Helmet', slot: 'head', armor: 5, weight: 'light' },
    IRON_HELMET: { name: 'Iron Helmet', slot: 'head', armor: 10, weight: 'heavy' },
    LEATHER_BOOTS: { name: 'Leather Boots', slot: 'feet', armor: 3, weight: 'light' },
    IRON_BOOTS: { name: 'Iron Boots', slot: 'feet', armor: 6, weight: 'heavy' },
    LEATHER_BRACERS: { name: 'Leather Bracers', slot: 'hands', armor: 3, weight: 'light' },
    IRON_GAUNTLETS: { name: 'Iron Gauntlets', slot: 'hands', armor: 6, weight: 'heavy' },
    WOODEN_SHIELD: { name: 'Wooden Shield', slot: 'shield', block: 0.5 },
    IRON_SHIELD: { name: 'Iron Shield', slot: 'shield', block: 0.65 },
    STEEL_SHIELD: { name: 'Steel Shield', slot: 'shield', block: 0.75 }
};

// Enemy definitions
const ENEMY_TYPES = {
    BANDIT: { name: 'Bandit', hp: 50, damage: 10, speed: 60, gold: [5, 20], behavior: 'patrol', color: 0x8b4513 },
    BANDIT_ARCHER: { name: 'Bandit Archer', hp: 35, damage: 12, speed: 50, gold: [5, 15], behavior: 'ranged', color: 0x654321 },
    BANDIT_CHIEF: { name: 'Bandit Chief', hp: 100, damage: 18, speed: 70, gold: [30, 60], behavior: 'aggressive', color: 0x5c3317, isBoss: true },
    BANDIT_MAGE: { name: 'Bandit Mage', hp: 45, damage: 15, speed: 45, gold: [10, 30], behavior: 'ranged', color: 0x6b4423, isMage: true },
    WOLF: { name: 'Wolf', hp: 30, damage: 8, speed: 100, gold: [0, 0], behavior: 'pack', color: 0x808080 },
    ALPHA_WOLF: { name: 'Alpha Wolf', hp: 60, damage: 12, speed: 90, gold: [0, 0], behavior: 'leader', color: 0x404040 },
    ICE_WOLF: { name: 'Ice Wolf', hp: 50, damage: 14, speed: 95, gold: [5, 15], behavior: 'pack', color: 0x88aacc },
    DRAUGR: { name: 'Draugr', hp: 60, damage: 14, speed: 40, gold: [5, 25], behavior: 'guard', color: 0x4a6670 },
    DRAUGR_ARCHER: { name: 'Draugr Archer', hp: 40, damage: 16, speed: 35, gold: [5, 20], behavior: 'ranged', color: 0x3d555c },
    DRAUGR_WIGHT: { name: 'Draugr Wight', hp: 90, damage: 20, speed: 45, gold: [20, 50], behavior: 'aggressive', color: 0x2f4045 },
    DRAUGR_DEATHLORD: { name: 'Draugr Deathlord', hp: 180, damage: 30, speed: 50, gold: [60, 120], behavior: 'boss', color: 0x1a2830, isBoss: true },
    SKELETON: { name: 'Skeleton', hp: 40, damage: 10, speed: 55, gold: [3, 15], behavior: 'patrol', color: 0xcccccc },
    SKELETON_ARCHER: { name: 'Skeleton Archer', hp: 30, damage: 12, speed: 45, gold: [3, 15], behavior: 'ranged', color: 0xbbbbbb },
    FROST_TROLL: { name: 'Frost Troll', hp: 200, damage: 35, speed: 60, gold: [40, 80], behavior: 'aggressive', color: 0x88ccff, isBoss: true },
    GIANT: { name: 'Giant', hp: 300, damage: 50, speed: 40, gold: [80, 150], behavior: 'patrol', color: 0x886644, isBoss: true },
    SABRE_CAT: { name: 'Sabre Cat', hp: 80, damage: 20, speed: 120, gold: [0, 0], behavior: 'chase', color: 0xcc9966 },
    BEAR: { name: 'Bear', hp: 120, damage: 25, speed: 70, gold: [0, 0], behavior: 'aggressive', color: 0x553322 },
    SPIDER: { name: 'Frostbite Spider', hp: 50, damage: 12, speed: 80, gold: [0, 5], behavior: 'chase', color: 0x334433 },
    GIANT_SPIDER: { name: 'Giant Frostbite Spider', hp: 100, damage: 18, speed: 60, gold: [10, 25], behavior: 'boss', color: 0x223322, isBoss: true },
    FALMER: { name: 'Falmer', hp: 70, damage: 16, speed: 65, gold: [5, 20], behavior: 'patrol', color: 0x778899 },
    FALMER_GLOOMLURKER: { name: 'Falmer Gloomlurker', hp: 100, damage: 22, speed: 70, gold: [15, 35], behavior: 'aggressive', color: 0x556677 },
    HAGRAVEN: { name: 'Hagraven', hp: 130, damage: 28, speed: 50, gold: [30, 60], behavior: 'ranged', color: 0x443333, isMage: true },
    VAMPIRE: { name: 'Vampire', hp: 100, damage: 18, speed: 75, gold: [25, 50], behavior: 'chase', color: 0x660033, drainLife: true }
};

// Quest definitions
const QUESTS = {
    // Main Quest
    MAIN_START: { id: 'main_start', name: 'Unbound', objective: 'Escape to Riverwood', reward: 50 },
    BEFORE_STORM: { id: 'before_storm', name: 'Before the Storm', objective: 'Speak to the Jarl in Whiterun', reward: 100 },
    BLEAK_FALLS: { id: 'bleak_falls', name: 'Bleak Falls Barrow', objective: 'Retrieve the Dragonstone', reward: 250 },
    DRAGON_RISING: { id: 'dragon_rising', name: 'Dragon Rising', objective: 'Witness the dragon attack', reward: 300 },
    // Riverwood Quests
    GOLDEN_CLAW: { id: 'golden_claw', name: 'The Golden Claw', objective: 'Return the Golden Claw to Lucan', reward: 150 },
    MINE_TROUBLE: { id: 'mine_trouble', name: 'Trouble in the Mine', objective: 'Clear Embershard Mine of bandits', reward: 100 },
    // Whiterun Quests
    WOLF_PROBLEM: { id: 'wolf_problem', name: 'Wolf Problem', objective: 'Kill the Alpha Wolf', reward: 75 },
    COMPANIONS_TRIAL: { id: 'companions_trial', name: "The Companions' Trial", objective: 'Prove your worth in combat', reward: 200 },
    MISSING_FARMER: { id: 'missing_farmer', name: 'Missing Farmer', objective: 'Find the missing farmer near the cave', reward: 100 },
    // Bounty Quests
    BOUNTY_BANDIT: { id: 'bounty_bandit', name: 'Bandit Leader Bounty', objective: 'Kill the bandit leader', reward: 150 },
    BOUNTY_GIANT: { id: 'bounty_giant', name: 'Giant Bounty', objective: 'Kill the giant threatening travelers', reward: 300 },
    BOUNTY_TROLL: { id: 'bounty_troll', name: 'Frost Troll Bounty', objective: 'Kill the frost troll', reward: 200 },
    // Fetch Quests
    HERB_GATHER: { id: 'herb_gather', name: 'Herb Gathering', objective: 'Collect 3 mountain flowers', reward: 50 },
    ORE_DELIVERY: { id: 'ore_delivery', name: 'Ore Delivery', objective: 'Deliver iron ore to the blacksmith', reward: 75 },
    LETTER_DELIVERY: { id: 'letter_delivery', name: 'Letter Delivery', objective: 'Deliver the letter to the next town', reward: 60 },
    // Exploration Quests
    RUINS_EXPLORE: { id: 'ruins_explore', name: 'Ancient Ruins', objective: 'Explore the ancient ruins', reward: 175 },
    CAVE_CLEAR: { id: 'cave_clear', name: 'Clear the Cave', objective: 'Clear the spider-infested cave', reward: 125 },
    TOWER_INVESTIGATE: { id: 'tower_investigate', name: 'Tower Investigation', objective: 'Investigate the abandoned tower', reward: 100 },
    // Combat Quests
    ARENA_CHAMPION: { id: 'arena_champion', name: 'Arena Champion', objective: 'Win 5 arena fights', reward: 400 },
    SLAY_VAMPIRE: { id: 'slay_vampire', name: 'Vampire Hunt', objective: 'Slay the vampire in the crypt', reward: 250 },
    DRAGON_PRIEST: { id: 'dragon_priest', name: 'Dragon Priest', objective: 'Defeat the dragon priest', reward: 500 }
};

// Quest types for procedural generation
const QUEST_TEMPLATES = {
    KILL: { verbs: ['Kill', 'Slay', 'Defeat', 'Eliminate'], targets: ['bandits', 'wolves', 'draugr', 'spiders'] },
    FETCH: { verbs: ['Retrieve', 'Find', 'Collect', 'Gather'], items: ['artifact', 'supplies', 'herbs', 'ore'] },
    DELIVER: { verbs: ['Deliver', 'Transport', 'Bring'], items: ['letter', 'package', 'supplies', 'weapon'] },
    EXPLORE: { verbs: ['Explore', 'Investigate', 'Search', 'Scout'], locations: ['ruins', 'cave', 'tower', 'camp'] },
    ESCORT: { verbs: ['Escort', 'Protect', 'Guard'], targets: ['merchant', 'traveler', 'pilgrim', 'courier'] }
};

// Town name generators
const TOWN_PREFIXES = ['River', 'White', 'Dragon', 'Winter', 'Frost', 'Iron', 'Stone', 'Oak', 'Pine', 'Snow', 'Cold', 'North', 'Dark', 'Grey', 'Silver'];
const TOWN_SUFFIXES = ['wood', 'run', 'hold', 'keep', 'fall', 'gate', 'guard', 'reach', 'bridge', 'haven', 'home', 'stead', 'dale', 'mere', 'watch'];

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        // Game state
        this.gameState = 'menu';
        this.screenFlash = 0;
        this.screenShake = { intensity: 0, duration: 0 };

        // Player data
        this.player = null;
        this.playerData = {
            hp: PLAYER.BASE_HP,
            maxHp: PLAYER.BASE_HP,
            magicka: PLAYER.BASE_MP,
            maxMagicka: PLAYER.BASE_MP,
            stamina: PLAYER.BASE_STAMINA,
            maxStamina: PLAYER.BASE_STAMINA,
            level: 1,
            gold: 50,
            skills: { combat: 1, magic: 1, stealth: 1 },
            skillXp: { combat: 0, magic: 0, stealth: 0 },
            perks: [],
            perkPoints: 0,
            weapon: { ...WEAPONS.IRON_SWORD },
            inventory: [],
            equipment: { head: null, body: null, hands: null, feet: null, shield: null },
            kills: 0,
            damageDealt: 0,
            isInvincible: false,
            invincibilityTimer: 0,
            isDodging: false,
            dodgeTimer: 0,
            dodgeCooldown: 0,
            isSprinting: false,
            lastActionTime: 0,
            attackCooldown: 0,
            facing: 'down'
        };

        // World data
        this.currentZone = null;
        this.zones = [];
        this.enemies = [];
        this.npcs = [];
        this.projectiles = [];
        this.pickups = [];
        this.particles = [];
        this.floatingTexts = [];
        this.worldX = 0;
        this.worldY = 0;

        // Quest data
        this.activeQuests = [];
        this.completedQuests = [];

        // Input
        this.keys = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D',
            sprint: 'SHIFT',
            dodge: 'SPACE',
            interact: 'E',
            inventory: 'TAB',
            attack: 'Q',
            ability: 'R',
            one: 'ONE',
            two: 'TWO',
            three: 'THREE'
        });

        this.input.on('pointerdown', (pointer) => {
            if (this.gameState === 'menu') {
                this.startGame();
            } else if (this.gameState === 'playing') {
                this.playerAttack(pointer);
            }
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.gameState === 'playing') {
                this.playerDodge();
            }
        });

        this.input.keyboard.on('keydown-E', () => {
            if (this.gameState === 'playing') {
                this.interact();
            }
        });

        this.input.keyboard.on('keydown-TAB', () => {
            if (this.gameState === 'playing') {
                this.gameState = 'inventory';
            } else if (this.gameState === 'inventory') {
                this.gameState = 'playing';
            }
        });

        this.input.keyboard.on('keydown-ESC', () => {
            if (this.gameState === 'playing') {
                this.gameState = 'paused';
            } else if (this.gameState === 'paused') {
                this.gameState = 'playing';
            }
        });

        // Generate world
        this.generateWorld();
    }

    generateWorld() {
        // Create zones
        this.zones = [];

        // Generate procedural towns
        const numTowns = 5 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numTowns; i++) {
            const townName = this.generateTownName();
            this.zones.push({
                id: 'town_' + i,
                name: townName,
                type: 'town',
                x: Math.floor(Math.random() * 8) - 4,
                y: Math.floor(Math.random() * 8) - 4,
                discovered: i === 0,
                cleared: false,
                npcs: this.generateTownNPCs(townName),
                quests: this.generateTownQuests(townName)
            });
        }

        // Add Riverwood as starting town (always at 0,0)
        this.zones[0] = {
            id: 'riverwood',
            name: 'Riverwood',
            type: 'town',
            x: 0, y: 0,
            discovered: true,
            cleared: false,
            npcs: [
                { id: 'alvor', name: 'Alvor', role: 'blacksmith', x: 300, y: 350, dialogue: ['Welcome to Riverwood, traveler.', 'I can sell you weapons and armor.'] },
                { id: 'lucan', name: 'Lucan Valerius', role: 'merchant', x: 500, y: 300, dialogue: ['Welcome to the Riverwood Trader!', 'Bandits stole my Golden Claw!'] },
                { id: 'guard', name: 'Riverwood Guard', role: 'guard', x: 150, y: 200, dialogue: ['Keep your wits about you, there are bandits nearby.'] }
            ],
            quests: ['mine_trouble', 'golden_claw']
        };

        // Add Whiterun
        this.zones.push({
            id: 'whiterun',
            name: 'Whiterun',
            type: 'town',
            x: 1, y: -1,
            discovered: false,
            cleared: false,
            npcs: [
                { id: 'jarl', name: 'Jarl Balgruuf', role: 'jarl', x: 400, y: 150, dialogue: ['I am Jarl Balgruuf the Greater.', 'Dragons have returned to Skyrim.'] },
                { id: 'farengar', name: 'Farengar Secret-Fire', role: 'wizard', x: 350, y: 200, dialogue: ['I study the arcane arts.', 'I need you to retrieve the Dragonstone.'] }
            ],
            quests: ['before_storm', 'bleak_falls']
        });

        // Generate wilderness areas
        for (let x = -5; x <= 5; x++) {
            for (let y = -5; y <= 5; y++) {
                if (!this.zones.find(z => z.x === x && z.y === y)) {
                    const hasContent = Math.random() < 0.6;
                    if (hasContent) {
                        const types = ['forest', 'plains', 'mountain', 'camp'];
                        const type = types[Math.floor(Math.random() * types.length)];
                        this.zones.push({
                            id: `wild_${x}_${y}`,
                            name: this.getWildernessName(type),
                            type: type,
                            x: x, y: y,
                            discovered: false,
                            cleared: false,
                            enemies: this.generateEnemiesForZone(type),
                            loot: this.generateLootForZone(type)
                        });
                    }
                }
            }
        }

        // Add dungeons
        this.zones.push({
            id: 'embershard',
            name: 'Embershard Mine',
            type: 'dungeon',
            x: -1, y: 1,
            discovered: false,
            cleared: false,
            enemies: [
                { type: 'BANDIT', x: 200, y: 200 },
                { type: 'BANDIT', x: 400, y: 300 },
                { type: 'BANDIT', x: 300, y: 400 },
                { type: 'BANDIT_ARCHER', x: 500, y: 200 },
                { type: 'BANDIT_ARCHER', x: 600, y: 350 },
                { type: 'BANDIT_CHIEF', x: 400, y: 500 }
            ],
            loot: [
                { type: 'gold', amount: 100 },
                { type: 'weapon', item: WEAPONS.STEEL_SWORD }
            ]
        });

        this.zones.push({
            id: 'bleak_falls',
            name: 'Bleak Falls Barrow',
            type: 'dungeon',
            x: 0, y: -2,
            discovered: false,
            cleared: false,
            enemies: [
                { type: 'BANDIT', x: 200, y: 150 },
                { type: 'BANDIT', x: 350, y: 200 },
                { type: 'DRAUGR', x: 300, y: 350 },
                { type: 'DRAUGR', x: 450, y: 400 },
                { type: 'DRAUGR', x: 250, y: 450 },
                { type: 'DRAUGR_ARCHER', x: 550, y: 300 },
                { type: 'DRAUGR_WIGHT', x: 400, y: 480 },
                { type: 'DRAUGR_DEATHLORD', x: 400, y: 550 }
            ],
            loot: [
                { type: 'gold', amount: 200 },
                { type: 'item', item: 'dragonstone' },
                { type: 'item', item: 'golden_claw' }
            ]
        });

        // Set starting zone
        this.currentZone = this.zones[0];
        this.worldX = 0;
        this.worldY = 0;

        // Initialize active quests
        this.activeQuests = [QUESTS.MAIN_START];
    }

    generateTownName() {
        const prefix = TOWN_PREFIXES[Math.floor(Math.random() * TOWN_PREFIXES.length)];
        const suffix = TOWN_SUFFIXES[Math.floor(Math.random() * TOWN_SUFFIXES.length)];
        return prefix + suffix;
    }

    generateTownNPCs(townName) {
        const roles = ['blacksmith', 'merchant', 'innkeeper', 'guard'];
        const npcs = [];
        const numNPCs = 2 + Math.floor(Math.random() * 3);

        for (let i = 0; i < numNPCs; i++) {
            const role = roles[i % roles.length];
            npcs.push({
                id: `npc_${townName}_${i}`,
                name: this.generateNPCName(),
                role: role,
                x: 150 + Math.random() * 500,
                y: 150 + Math.random() * 300,
                dialogue: this.getDialogueForRole(role)
            });
        }

        return npcs;
    }

    generateNPCName() {
        const firstNames = ['Erik', 'Sigurd', 'Bjorn', 'Ulfric', 'Lydia', 'Inga', 'Freya', 'Astrid', 'Harald', 'Sven'];
        const lastNames = ['the Strong', 'Battle-Born', 'Gray-Mane', 'Ice-Veins', 'Stone-Fist'];
        return firstNames[Math.floor(Math.random() * firstNames.length)] +
               (Math.random() < 0.3 ? ' ' + lastNames[Math.floor(Math.random() * lastNames.length)] : '');
    }

    getDialogueForRole(role) {
        const dialogues = {
            blacksmith: ['I can forge the finest weapons.', 'Need any armor repaired?'],
            merchant: ['Looking to buy or sell?', 'I have wares if you have coin.'],
            innkeeper: ['Welcome, traveler. Need a room?', 'I have mead and food.'],
            guard: ['Keep out of trouble.', 'I used to be an adventurer like you.']
        };
        return dialogues[role] || ['...'];
    }

    generateTownQuests(townName) {
        const questTypes = ['bandit_hunt', 'delivery', 'fetch', 'rescue'];
        const quests = [];
        if (Math.random() < 0.7) {
            quests.push(`side_${townName.toLowerCase()}`);
        }
        return quests;
    }

    getWildernessName(type) {
        const names = {
            forest: ['Pine Forest', 'Dark Woods', 'Tall Trees', 'Shadowy Grove'],
            plains: ['Whiterun Plains', 'Grassy Flats', 'Open Fields', 'Wind-Swept Plains'],
            mountain: ['Rocky Pass', 'Mountain Path', 'Stone Heights', 'Frost Peak'],
            camp: ['Bandit Camp', 'Hunter\'s Camp', 'Abandoned Camp', 'Outlaw\'s Den']
        };
        return names[type][Math.floor(Math.random() * names[type].length)];
    }

    generateEnemiesForZone(type) {
        const enemies = [];
        const configs = {
            forest: { types: ['WOLF', 'WOLF', 'ALPHA_WOLF'], count: [2, 5] },
            plains: { types: ['BANDIT', 'WOLF'], count: [1, 3] },
            mountain: { types: ['BANDIT', 'BANDIT_ARCHER'], count: [2, 4] },
            camp: { types: ['BANDIT', 'BANDIT', 'BANDIT_ARCHER', 'BANDIT_CHIEF'], count: [3, 6] }
        };

        const config = configs[type] || configs.plains;
        const count = config.count[0] + Math.floor(Math.random() * (config.count[1] - config.count[0] + 1));

        for (let i = 0; i < count; i++) {
            enemies.push({
                type: config.types[Math.floor(Math.random() * config.types.length)],
                x: 100 + Math.random() * 600,
                y: 100 + Math.random() * 400
            });
        }

        return enemies;
    }

    generateLootForZone(type) {
        const loot = [];
        if (Math.random() < 0.5) {
            loot.push({ type: 'gold', amount: 10 + Math.floor(Math.random() * 30) });
        }
        if (Math.random() < 0.2) {
            loot.push({ type: 'potion', item: 'health_minor' });
        }
        return loot;
    }

    startGame() {
        this.gameState = 'playing';

        // Create player
        this.player = {
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT / 2,
            width: 24,
            height: 32,
            vx: 0,
            vy: 0
        };

        // Spawn enemies for current zone
        this.loadZone(this.currentZone);
    }

    loadZone(zone) {
        this.currentZone = zone;
        this.enemies = [];
        this.npcs = [];
        this.pickups = [];

        if (zone.enemies && !zone.cleared) {
            for (const enemyData of zone.enemies) {
                this.spawnEnemy(enemyData.type, enemyData.x, enemyData.y);
            }
        }

        if (zone.npcs) {
            this.npcs = [...zone.npcs];
        }

        if (zone.loot && zone.cleared) {
            // Spawn loot if cleared
            for (const lootData of zone.loot) {
                this.spawnPickup(lootData, GAME_WIDTH / 2 + (Math.random() - 0.5) * 100, GAME_HEIGHT / 2);
            }
        }

        zone.discovered = true;
    }

    spawnEnemy(type, x, y) {
        const def = ENEMY_TYPES[type];
        if (!def) return;

        this.enemies.push({
            type: type,
            name: def.name,
            x: x,
            y: y,
            width: def.isBoss ? 40 : 28,
            height: def.isBoss ? 48 : 32,
            hp: def.hp,
            maxHp: def.hp,
            damage: def.damage,
            speed: def.speed,
            color: def.color,
            behavior: def.behavior,
            isBoss: def.isBoss || false,
            gold: def.gold,
            state: 'idle',
            stateTimer: 0,
            attackCooldown: 0,
            alertTimer: 0,
            patrolX: x,
            patrolY: y,
            vx: 0,
            vy: 0,
            facing: 'down',
            hitFlash: 0
        });
    }

    spawnPickup(data, x, y) {
        this.pickups.push({
            x: x,
            y: y,
            type: data.type,
            data: data,
            collected: false
        });
    }

    update(time, delta) {
        const dt = delta / 1000;

        // Update screen effects
        if (this.screenFlash > 0) {
            this.screenFlash -= dt * 3;
        }
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= delta;
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y -= 40 * dt;
            ft.life -= dt;
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.95;
            p.vy *= 0.95;
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        if (this.gameState === 'playing') {
            this.updatePlayer(dt);
            this.updateEnemies(dt);
            this.updateProjectiles(dt);
            this.checkCollisions();
            this.checkZoneTransition();
        }

        this.render();
    }

    updatePlayer(dt) {
        const pd = this.playerData;

        // Invincibility
        if (pd.isInvincible) {
            pd.invincibilityTimer -= dt;
            if (pd.invincibilityTimer <= 0) {
                pd.isInvincible = false;
            }
        }

        // Dodge
        if (pd.isDodging) {
            pd.dodgeTimer -= dt * 1000;
            if (pd.dodgeTimer <= 0) {
                pd.isDodging = false;
            }
        }

        if (pd.dodgeCooldown > 0) {
            pd.dodgeCooldown -= dt * 1000;
        }

        // Attack cooldown
        if (pd.attackCooldown > 0) {
            pd.attackCooldown -= dt * 1000;
        }

        // Movement
        let moveX = 0;
        let moveY = 0;

        if (this.keys.left.isDown) moveX -= 1;
        if (this.keys.right.isDown) moveX += 1;
        if (this.keys.up.isDown) moveY -= 1;
        if (this.keys.down.isDown) moveY += 1;

        // Normalize diagonal
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.7071;
            moveY *= 0.7071;
        }

        // Update facing direction
        if (moveX !== 0 || moveY !== 0) {
            if (Math.abs(moveX) > Math.abs(moveY)) {
                pd.facing = moveX > 0 ? 'right' : 'left';
            } else {
                pd.facing = moveY > 0 ? 'down' : 'up';
            }
        }

        // Speed calculation
        let speed = PLAYER.WALK_SPEED;
        pd.isSprinting = this.keys.sprint.isDown && pd.stamina > 0 && (moveX !== 0 || moveY !== 0);

        if (pd.isDodging) {
            speed = PLAYER.DODGE_SPEED;
        } else if (pd.isSprinting) {
            speed = PLAYER.SPRINT_SPEED;
            pd.stamina -= COMBAT.SPRINT_STAMINA_PER_SEC * dt;
            pd.lastActionTime = Date.now();
        }

        // Apply movement
        this.player.x += moveX * speed * dt;
        this.player.y += moveY * speed * dt;

        // Bounds
        this.player.x = Math.max(20, Math.min(GAME_WIDTH - 20, this.player.x));
        this.player.y = Math.max(20, Math.min(GAME_HEIGHT - 20, this.player.y));

        // Stamina regen
        if (!pd.isSprinting && Date.now() - pd.lastActionTime > PLAYER.STAMINA_REGEN_DELAY) {
            pd.stamina = Math.min(pd.maxStamina, pd.stamina + PLAYER.STAMINA_REGEN * dt);
        }
    }

    playerDodge() {
        const pd = this.playerData;
        if (pd.isDodging || pd.dodgeCooldown > 0 || pd.stamina < COMBAT.DODGE_STAMINA) return;

        pd.isDodging = true;
        pd.isInvincible = true;
        pd.invincibilityTimer = PLAYER.DODGE_DURATION / 1000;
        pd.dodgeTimer = PLAYER.DODGE_DURATION;
        pd.dodgeCooldown = 500;
        pd.stamina -= COMBAT.DODGE_STAMINA;
        pd.lastActionTime = Date.now();

        // Spawn dodge particles
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.player.x,
                y: this.player.y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                color: 0xccccff,
                size: 4,
                life: 0.3
            });
        }
    }

    playerAttack(pointer) {
        const pd = this.playerData;
        if (pd.attackCooldown > 0) return;

        const weapon = pd.weapon;
        pd.attackCooldown = weapon.speed;
        pd.lastActionTime = Date.now();

        if (pd.stamina < COMBAT.LIGHT_ATTACK_STAMINA) return;
        pd.stamina -= COMBAT.LIGHT_ATTACK_STAMINA;

        // Calculate direction
        const dx = pointer.x - this.player.x;
        const dy = pointer.y - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const dirX = dx / dist;
        const dirY = dy / dist;

        if (weapon.type === 'melee') {
            // Melee attack - check enemies in cone
            for (const enemy of this.enemies) {
                const ex = enemy.x - this.player.x;
                const ey = enemy.y - this.player.y;
                const eDist = Math.sqrt(ex * ex + ey * ey);

                if (eDist < weapon.range + enemy.width / 2) {
                    // Check if in attack cone
                    const dot = (ex * dirX + ey * dirY) / eDist;
                    if (dot > 0.5) { // ~60 degree cone
                        this.damageEnemy(enemy, this.calculateDamage(weapon.damage));
                    }
                }
            }

            // Swing particles
            for (let i = 0; i < 3; i++) {
                const angle = Math.atan2(dirY, dirX) + (Math.random() - 0.5) * 0.5;
                this.particles.push({
                    x: this.player.x + dirX * 20,
                    y: this.player.y + dirY * 20,
                    vx: Math.cos(angle) * 150,
                    vy: Math.sin(angle) * 150,
                    color: 0xffffaa,
                    size: 3,
                    life: 0.2
                });
            }
        } else if (weapon.type === 'ranged') {
            // Fire arrow
            this.projectiles.push({
                x: this.player.x,
                y: this.player.y,
                vx: dirX * 400,
                vy: dirY * 400,
                damage: this.calculateDamage(weapon.damage),
                isPlayerProjectile: true,
                color: 0x8b4513,
                size: 6,
                life: 2
            });
        } else if (weapon.type === 'magic') {
            if (pd.magicka < 10) return;
            pd.magicka -= 10;

            // Fire spell
            this.projectiles.push({
                x: this.player.x,
                y: this.player.y,
                vx: dirX * 300,
                vy: dirY * 300,
                damage: this.calculateDamage(weapon.damage),
                isPlayerProjectile: true,
                color: weapon.spell === 'flames' ? 0xff4400 : 0x44aaff,
                size: 10,
                life: 1.5
            });
        }
    }

    calculateDamage(baseDamage) {
        const pd = this.playerData;
        const skillMultiplier = 1.0 + (pd.skills.combat * 0.05);
        return Math.floor(baseDamage * skillMultiplier);
    }

    damageEnemy(enemy, damage) {
        enemy.hp -= damage;
        enemy.hitFlash = 0.15;
        enemy.state = 'chase';

        // Add floating damage text
        this.floatingTexts.push({
            x: enemy.x,
            y: enemy.y - 20,
            text: `-${damage}`,
            color: '#ff4444',
            life: 0.8
        });

        // Hit particles
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: enemy.x,
                y: enemy.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                color: 0xff0000,
                size: 4,
                life: 0.3
            });
        }

        // Screen shake
        this.addScreenShake(3, 100);

        // Track damage
        this.playerData.damageDealt += damage;

        // Combat XP
        this.gainSkillXP('combat', damage);

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }

        // Death particles
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: enemy.x,
                y: enemy.y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                color: enemy.color,
                size: 5,
                life: 0.5
            });
        }

        // Screen shake for boss
        if (enemy.isBoss) {
            this.addScreenShake(15, 500);
            this.floatingTexts.push({
                x: enemy.x,
                y: enemy.y - 30,
                text: 'BOSS DEFEATED!',
                color: '#ffff00',
                life: 2
            });
        }

        // Drop gold
        const goldAmount = enemy.gold[0] + Math.floor(Math.random() * (enemy.gold[1] - enemy.gold[0] + 1));
        if (goldAmount > 0) {
            this.pickups.push({
                x: enemy.x,
                y: enemy.y,
                type: 'gold',
                data: { amount: goldAmount },
                collected: false
            });
        }

        // Stats
        this.playerData.kills++;

        // Check zone clear
        if (this.enemies.length === 0) {
            this.currentZone.cleared = true;
            this.floatingTexts.push({
                x: GAME_WIDTH / 2,
                y: GAME_HEIGHT / 3,
                text: 'AREA CLEARED',
                color: '#00ff00',
                life: 2
            });

            // Drop zone loot
            if (this.currentZone.loot) {
                for (const lootData of this.currentZone.loot) {
                    this.spawnPickup(lootData, GAME_WIDTH / 2 + (Math.random() - 0.5) * 100, GAME_HEIGHT / 2);
                }
            }

            // Check quest objectives
            this.checkQuestProgress();
        }
    }

    gainSkillXP(skill, amount) {
        const pd = this.playerData;
        pd.skillXp[skill] += amount;

        const xpNeeded = 100 * pd.skills[skill];
        if (pd.skillXp[skill] >= xpNeeded) {
            pd.skillXp[skill] -= xpNeeded;
            pd.skills[skill]++;

            // Level up notification
            this.floatingTexts.push({
                x: GAME_WIDTH / 2,
                y: GAME_HEIGHT / 4,
                text: `${skill.toUpperCase()} INCREASED TO ${pd.skills[skill]}`,
                color: '#ffff00',
                life: 2
            });

            // Check for level up
            const avgSkill = Math.floor((pd.skills.combat + pd.skills.magic + pd.skills.stealth) / 3);
            if (avgSkill > pd.level) {
                this.levelUp();
            }
        }
    }

    levelUp() {
        const pd = this.playerData;
        pd.level++;
        pd.maxHp += PLAYER.HP_PER_LEVEL;
        pd.maxMagicka += PLAYER.MP_PER_LEVEL;
        pd.maxStamina += PLAYER.STAMINA_PER_LEVEL;
        pd.hp = pd.maxHp;
        pd.magicka = pd.maxMagicka;
        pd.stamina = pd.maxStamina;
        pd.perkPoints++;

        this.floatingTexts.push({
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT / 5,
            text: `LEVEL UP! NOW LEVEL ${pd.level}`,
            color: '#ffff00',
            life: 3
        });

        this.addScreenShake(10, 300);
    }

    updateEnemies(dt) {
        for (const enemy of this.enemies) {
            // Hit flash
            if (enemy.hitFlash > 0) {
                enemy.hitFlash -= dt;
            }

            // Attack cooldown
            if (enemy.attackCooldown > 0) {
                enemy.attackCooldown -= dt;
            }

            // State timer
            enemy.stateTimer -= dt;

            // Calculate distance to player
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // State machine
            switch (enemy.state) {
                case 'idle':
                    if (dist < 150) {
                        enemy.state = 'alert';
                        enemy.stateTimer = 1;
                    }
                    break;

                case 'alert':
                    if (enemy.stateTimer <= 0) {
                        enemy.state = 'chase';
                    }
                    break;

                case 'chase':
                    if (dist < 40) {
                        enemy.state = 'attack';
                    } else if (dist > 250) {
                        enemy.state = 'return';
                    } else {
                        // Move toward player
                        const speed = enemy.speed;
                        enemy.vx = (dx / dist) * speed;
                        enemy.vy = (dy / dist) * speed;
                        enemy.x += enemy.vx * dt;
                        enemy.y += enemy.vy * dt;

                        // Update facing
                        if (Math.abs(dx) > Math.abs(dy)) {
                            enemy.facing = dx > 0 ? 'right' : 'left';
                        } else {
                            enemy.facing = dy > 0 ? 'down' : 'up';
                        }
                    }
                    break;

                case 'attack':
                    if (enemy.attackCooldown <= 0) {
                        this.enemyAttack(enemy);
                        enemy.attackCooldown = 1.5;
                    }
                    if (dist > 50) {
                        enemy.state = 'chase';
                    }
                    break;

                case 'return':
                    const pdx = enemy.patrolX - enemy.x;
                    const pdy = enemy.patrolY - enemy.y;
                    const pDist = Math.sqrt(pdx * pdx + pdy * pdy);

                    if (pDist < 20) {
                        enemy.state = 'idle';
                    } else {
                        enemy.x += (pdx / pDist) * enemy.speed * 0.5 * dt;
                        enemy.y += (pdy / pDist) * enemy.speed * 0.5 * dt;
                    }

                    if (dist < 150) {
                        enemy.state = 'chase';
                    }
                    break;
            }

            // Bounds
            enemy.x = Math.max(20, Math.min(GAME_WIDTH - 20, enemy.x));
            enemy.y = Math.max(20, Math.min(GAME_HEIGHT - 20, enemy.y));
        }
    }

    enemyAttack(enemy) {
        const pd = this.playerData;

        // Check if in range
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 60) {
            this.damagePlayer(enemy.damage);
        }

        // Attack particles
        const dirX = dx / dist;
        const dirY = dy / dist;
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: enemy.x + dirX * 20,
                y: enemy.y + dirY * 20,
                vx: dirX * 100 + (Math.random() - 0.5) * 50,
                vy: dirY * 100 + (Math.random() - 0.5) * 50,
                color: 0xff8800,
                size: 4,
                life: 0.2
            });
        }
    }

    damagePlayer(damage) {
        const pd = this.playerData;

        if (pd.isInvincible || pd.isDodging) return;

        pd.hp -= damage;
        pd.isInvincible = true;
        pd.invincibilityTimer = 1;

        // Screen flash red
        this.screenFlash = 0.5;

        // Screen shake
        this.addScreenShake(8, 200);

        // Floating text
        this.floatingTexts.push({
            x: this.player.x,
            y: this.player.y - 30,
            text: `-${damage}`,
            color: '#ff0000',
            life: 0.8
        });

        // Hit particles
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.player.x,
                y: this.player.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                color: 0xff0000,
                size: 5,
                life: 0.4
            });
        }

        if (pd.hp <= 0) {
            this.gameOver();
        }
    }

    addScreenShake(intensity, duration) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
    }

    updateProjectiles(dt) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;

            // Remove if expired or out of bounds
            if (p.life <= 0 || p.x < 0 || p.x > GAME_WIDTH || p.y < 0 || p.y > GAME_HEIGHT) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Collision
            if (p.isPlayerProjectile) {
                for (const enemy of this.enemies) {
                    const dx = p.x - enemy.x;
                    const dy = p.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < enemy.width / 2 + p.size) {
                        this.damageEnemy(enemy, p.damage);
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
            } else {
                const dx = p.x - this.player.x;
                const dy = p.y - this.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 20) {
                    this.damagePlayer(p.damage);
                    this.projectiles.splice(i, 1);
                }
            }
        }
    }

    checkCollisions() {
        // Pickup collision
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            const dx = pickup.x - this.player.x;
            const dy = pickup.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 30) {
                this.collectPickup(pickup);
                this.pickups.splice(i, 1);
            }
        }

        // Enemy contact damage
        if (!this.playerData.isInvincible && !this.playerData.isDodging) {
            for (const enemy of this.enemies) {
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < enemy.width / 2 + 15) {
                    this.damagePlayer(Math.floor(enemy.damage * 0.5));
                    break;
                }
            }
        }
    }

    collectPickup(pickup) {
        const pd = this.playerData;

        switch (pickup.type) {
            case 'gold':
                pd.gold += pickup.data.amount;
                this.floatingTexts.push({
                    x: pickup.x,
                    y: pickup.y - 10,
                    text: `+${pickup.data.amount} Gold`,
                    color: '#ffff00',
                    life: 0.8
                });
                break;

            case 'potion':
                const healAmount = 25;
                pd.hp = Math.min(pd.maxHp, pd.hp + healAmount);
                this.floatingTexts.push({
                    x: pickup.x,
                    y: pickup.y - 10,
                    text: `+${healAmount} HP`,
                    color: '#00ff00',
                    life: 0.8
                });
                break;

            case 'weapon':
                pd.weapon = { ...pickup.data.item };
                this.floatingTexts.push({
                    x: pickup.x,
                    y: pickup.y - 10,
                    text: `Got ${pickup.data.item.name}!`,
                    color: '#ff88ff',
                    life: 1.2
                });
                break;

            case 'item':
                pd.inventory.push(pickup.data.item);
                this.floatingTexts.push({
                    x: pickup.x,
                    y: pickup.y - 10,
                    text: `Got ${pickup.data.item}!`,
                    color: '#88ffff',
                    life: 1.2
                });
                this.checkQuestProgress();
                break;
        }
    }

    checkZoneTransition() {
        const margin = 30;
        let newX = this.worldX;
        let newY = this.worldY;
        let newPlayerX = this.player.x;
        let newPlayerY = this.player.y;

        if (this.player.x < margin) {
            newX--;
            newPlayerX = GAME_WIDTH - margin - 10;
        } else if (this.player.x > GAME_WIDTH - margin) {
            newX++;
            newPlayerX = margin + 10;
        }

        if (this.player.y < margin) {
            newY--;
            newPlayerY = GAME_HEIGHT - margin - 10;
        } else if (this.player.y > GAME_HEIGHT - margin) {
            newY++;
            newPlayerY = margin + 10;
        }

        if (newX !== this.worldX || newY !== this.worldY) {
            this.worldX = newX;
            this.worldY = newY;
            this.player.x = newPlayerX;
            this.player.y = newPlayerY;

            // Find or create zone
            let zone = this.zones.find(z => z.x === newX && z.y === newY);
            if (!zone) {
                // Generate new wilderness zone
                zone = {
                    id: `wild_${newX}_${newY}`,
                    name: this.getWildernessName('plains'),
                    type: 'plains',
                    x: newX,
                    y: newY,
                    discovered: false,
                    cleared: false,
                    enemies: this.generateEnemiesForZone('plains'),
                    loot: this.generateLootForZone('plains')
                };
                this.zones.push(zone);
            }

            this.loadZone(zone);
        }
    }

    interact() {
        // Check NPCs
        for (const npc of this.npcs) {
            const dx = npc.x - this.player.x;
            const dy = npc.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 50) {
                this.showDialogue(npc);
                return;
            }
        }
    }

    showDialogue(npc) {
        // Simple dialogue display
        const dialogue = npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)];
        this.floatingTexts.push({
            x: npc.x,
            y: npc.y - 40,
            text: dialogue,
            color: '#ffffff',
            life: 3
        });

        // Check for quest giving
        if (npc.role === 'blacksmith' && this.currentZone.quests && this.currentZone.quests.includes('mine_trouble')) {
            if (!this.activeQuests.find(q => q.id === 'mine_trouble') && !this.completedQuests.includes('mine_trouble')) {
                this.activeQuests.push(QUESTS.MINE_TROUBLE);
                this.floatingTexts.push({
                    x: GAME_WIDTH / 2,
                    y: 100,
                    text: 'NEW QUEST: ' + QUESTS.MINE_TROUBLE.name,
                    color: '#ffff00',
                    life: 2
                });
            }
        }
    }

    checkQuestProgress() {
        const pd = this.playerData;

        // Check main quest
        if (this.currentZone.id === 'bleak_falls' && this.currentZone.cleared) {
            if (pd.inventory.includes('dragonstone')) {
                const quest = this.activeQuests.find(q => q.id === 'bleak_falls');
                if (quest) {
                    this.completeQuest(quest);
                }
            }
        }

        // Check mine quest
        if (this.currentZone.id === 'embershard' && this.currentZone.cleared) {
            const quest = this.activeQuests.find(q => q.id === 'mine_trouble');
            if (quest) {
                this.completeQuest(quest);
            }
        }
    }

    completeQuest(quest) {
        this.playerData.gold += quest.reward;
        this.activeQuests = this.activeQuests.filter(q => q.id !== quest.id);
        this.completedQuests.push(quest.id);

        this.floatingTexts.push({
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT / 4,
            text: `QUEST COMPLETE: ${quest.name}`,
            color: '#00ff00',
            life: 3
        });

        this.floatingTexts.push({
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT / 4 + 30,
            text: `+${quest.reward} Gold`,
            color: '#ffff00',
            life: 2
        });
    }

    gameOver() {
        this.gameState = 'gameover';
    }

    render() {
        const g = this.add.graphics();
        g.clear();

        // Apply screen shake
        let offsetX = 0;
        let offsetY = 0;
        if (this.screenShake.duration > 0) {
            offsetX = (Math.random() - 0.5) * this.screenShake.intensity * 2;
            offsetY = (Math.random() - 0.5) * this.screenShake.intensity * 2;
        }

        // Clear and fill background
        g.fillStyle(0x2a3a2a);
        g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        if (this.gameState === 'menu') {
            this.renderMenu(g);
        } else if (this.gameState === 'playing' || this.gameState === 'paused' || this.gameState === 'inventory') {
            this.renderGame(g, offsetX, offsetY);
        } else if (this.gameState === 'gameover') {
            this.renderGameOver(g);
        }

        // Screen flash
        if (this.screenFlash > 0) {
            g.fillStyle(0xff0000, this.screenFlash * 0.4);
            g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }

        g.destroy();
    }

    renderMenu(g) {
        // Title
        const titleText = this.add.text(GAME_WIDTH / 2, 150, 'FROSTFALL', {
            fontSize: '64px',
            fontFamily: 'Georgia, serif',
            color: '#88aacc',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        titleText.setDepth(100);

        const subtitleText = this.add.text(GAME_WIDTH / 2, 220, 'A 2D Skyrim Demake', {
            fontSize: '24px',
            fontFamily: 'Georgia, serif',
            color: '#aabbcc'
        }).setOrigin(0.5);

        const startText = this.add.text(GAME_WIDTH / 2, 350, 'Click to Start', {
            fontSize: '28px',
            fontFamily: 'Georgia, serif',
            color: '#ffffff'
        }).setOrigin(0.5);

        const controlsText = this.add.text(GAME_WIDTH / 2, 450, 'WASD: Move | SHIFT: Sprint | SPACE: Dodge | Click: Attack\nE: Interact | TAB: Inventory | ESC: Pause', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#888888',
            align: 'center'
        }).setOrigin(0.5);

        // Clean up text on next frame
        this.time.delayedCall(16, () => {
            titleText.destroy();
            subtitleText.destroy();
            startText.destroy();
            controlsText.destroy();
        });
    }

    renderGame(g, offsetX, offsetY) {
        // Ground
        g.fillStyle(0x3a4a3a);
        g.fillRect(offsetX, offsetY, GAME_WIDTH, GAME_HEIGHT);

        // Grid pattern for terrain
        g.lineStyle(1, 0x2a3a2a, 0.3);
        for (let x = 0; x < GAME_WIDTH; x += TILE_SIZE) {
            g.strokeLineShape(new Phaser.Geom.Line(x + offsetX, offsetY, x + offsetX, GAME_HEIGHT + offsetY));
        }
        for (let y = 0; y < GAME_HEIGHT; y += TILE_SIZE) {
            g.strokeLineShape(new Phaser.Geom.Line(offsetX, y + offsetY, GAME_WIDTH + offsetX, y + offsetY));
        }

        // Draw pickups
        for (const pickup of this.pickups) {
            if (pickup.type === 'gold') {
                g.fillStyle(0xffff00);
                g.fillCircle(pickup.x + offsetX, pickup.y + offsetY, 8);
            } else if (pickup.type === 'potion') {
                g.fillStyle(0xff0000);
                g.fillRect(pickup.x - 6 + offsetX, pickup.y - 8 + offsetY, 12, 16);
            } else if (pickup.type === 'weapon') {
                g.fillStyle(0x888888);
                g.fillRect(pickup.x - 8 + offsetX, pickup.y - 16 + offsetY, 16, 32);
            } else {
                g.fillStyle(0x00ffff);
                g.fillCircle(pickup.x + offsetX, pickup.y + offsetY, 10);
            }
        }

        // Draw NPCs
        for (const npc of this.npcs) {
            // Body
            g.fillStyle(0x6688aa);
            g.fillRect(npc.x - 10 + offsetX, npc.y - 14 + offsetY, 20, 28);

            // Head
            g.fillStyle(0xffcc99);
            g.fillCircle(npc.x + offsetX, npc.y - 18 + offsetY, 8);

            // Name
            const nameText = this.add.text(npc.x + offsetX, npc.y - 35 + offsetY, npc.name, {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#00ff00'
            }).setOrigin(0.5);
            this.time.delayedCall(16, () => nameText.destroy());
        }

        // Draw enemies
        for (const enemy of this.enemies) {
            const color = enemy.hitFlash > 0 ? 0xffffff : enemy.color;

            // Body
            g.fillStyle(color);
            g.fillRect(enemy.x - enemy.width / 2 + offsetX, enemy.y - enemy.height / 2 + offsetY, enemy.width, enemy.height);

            // Health bar
            if (enemy.hp < enemy.maxHp) {
                g.fillStyle(0x000000);
                g.fillRect(enemy.x - 15 + offsetX, enemy.y - enemy.height / 2 - 10 + offsetY, 30, 5);
                g.fillStyle(0xff0000);
                g.fillRect(enemy.x - 15 + offsetX, enemy.y - enemy.height / 2 - 10 + offsetY, 30 * (enemy.hp / enemy.maxHp), 5);
            }

            // Boss indicator
            if (enemy.isBoss) {
                const bossText = this.add.text(enemy.x + offsetX, enemy.y - enemy.height / 2 - 20 + offsetY, enemy.name, {
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    color: '#ff4444'
                }).setOrigin(0.5);
                this.time.delayedCall(16, () => bossText.destroy());
            }

            // Alert indicator
            if (enemy.state === 'alert') {
                const alertText = this.add.text(enemy.x + offsetX, enemy.y - enemy.height / 2 - 15 + offsetY, '?', {
                    fontSize: '20px',
                    fontFamily: 'monospace',
                    color: '#ffff00'
                }).setOrigin(0.5);
                this.time.delayedCall(16, () => alertText.destroy());
            }
        }

        // Draw player
        if (this.player) {
            const pd = this.playerData;
            const flashAlpha = pd.isInvincible ? (Math.sin(Date.now() / 50) > 0 ? 0.5 : 1) : 1;

            // Shadow
            g.fillStyle(0x000000, 0.3);
            g.fillEllipse(this.player.x + offsetX, this.player.y + 12 + offsetY, 20, 8);

            // Body
            g.fillStyle(0x2266aa, flashAlpha);
            g.fillRect(this.player.x - 10 + offsetX, this.player.y - 14 + offsetY, 20, 28);

            // Head
            g.fillStyle(0xffcc99, flashAlpha);
            g.fillCircle(this.player.x + offsetX, this.player.y - 18 + offsetY, 8);

            // Weapon indicator
            if (pd.weapon) {
                const weaponColor = pd.weapon.type === 'melee' ? 0x888888 :
                                   pd.weapon.type === 'ranged' ? 0x8b4513 : 0x4488ff;
                g.fillStyle(weaponColor);

                let wx = this.player.x;
                let wy = this.player.y;
                switch (pd.facing) {
                    case 'up': wy -= 20; break;
                    case 'down': wy += 5; break;
                    case 'left': wx -= 15; break;
                    case 'right': wx += 15; break;
                }

                if (pd.weapon.type === 'melee') {
                    g.fillRect(wx - 2 + offsetX, wy - 10 + offsetY, 4, 20);
                } else {
                    g.fillCircle(wx + offsetX, wy + offsetY, 6);
                }
            }

            // Dodge trail
            if (pd.isDodging) {
                g.fillStyle(0x4488ff, 0.3);
                g.fillEllipse(this.player.x + offsetX, this.player.y + offsetY, 30, 30);
            }
        }

        // Draw projectiles
        for (const p of this.projectiles) {
            g.fillStyle(p.color);
            g.fillCircle(p.x + offsetX, p.y + offsetY, p.size);

            // Glow
            g.fillStyle(p.color, 0.3);
            g.fillCircle(p.x + offsetX, p.y + offsetY, p.size * 1.5);
        }

        // Draw particles
        for (const p of this.particles) {
            g.fillStyle(p.color, p.life * 2);
            g.fillCircle(p.x + offsetX, p.y + offsetY, p.size * p.life * 2);
        }

        // Draw floating texts
        for (const ft of this.floatingTexts) {
            const text = this.add.text(ft.x + offsetX, ft.y + offsetY, ft.text, {
                fontSize: '16px',
                fontFamily: 'monospace',
                color: ft.color
            }).setOrigin(0.5).setAlpha(Math.min(1, ft.life * 2));
            this.time.delayedCall(16, () => text.destroy());
        }

        // Draw UI
        this.renderUI(g);

        // Paused overlay
        if (this.gameState === 'paused') {
            g.fillStyle(0x000000, 0.7);
            g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            const pauseText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'PAUSED\n\nPress ESC to Resume', {
                fontSize: '32px',
                fontFamily: 'Georgia, serif',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
            this.time.delayedCall(16, () => pauseText.destroy());
        }

        // Inventory overlay
        if (this.gameState === 'inventory') {
            this.renderInventory(g);
        }
    }

    renderUI(g) {
        const pd = this.playerData;

        // UI background
        g.fillStyle(0x000000, 0.7);
        g.fillRect(0, GAME_HEIGHT - 100, GAME_WIDTH, 100);

        // Health bar
        g.fillStyle(0x333333);
        g.fillRect(20, GAME_HEIGHT - 90, 200, 20);
        g.fillStyle(0xff0000);
        g.fillRect(20, GAME_HEIGHT - 90, 200 * (pd.hp / pd.maxHp), 20);

        const hpText = this.add.text(120, GAME_HEIGHT - 80, `${Math.ceil(pd.hp)}/${pd.maxHp}`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.time.delayedCall(16, () => hpText.destroy());

        // Magicka bar
        g.fillStyle(0x333333);
        g.fillRect(20, GAME_HEIGHT - 65, 150, 15);
        g.fillStyle(0x0044ff);
        g.fillRect(20, GAME_HEIGHT - 65, 150 * (pd.magicka / pd.maxMagicka), 15);

        // Stamina bar
        g.fillStyle(0x333333);
        g.fillRect(20, GAME_HEIGHT - 45, 150, 15);
        g.fillStyle(0x00ff00);
        g.fillRect(20, GAME_HEIGHT - 45, 150 * (pd.stamina / pd.maxStamina), 15);

        // Gold
        const goldText = this.add.text(250, GAME_HEIGHT - 80, `Gold: ${pd.gold}`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ffff00'
        });
        this.time.delayedCall(16, () => goldText.destroy());

        // Level
        const levelText = this.add.text(250, GAME_HEIGHT - 55, `Level: ${pd.level}`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });
        this.time.delayedCall(16, () => levelText.destroy());

        // Weapon
        const weaponText = this.add.text(400, GAME_HEIGHT - 80, pd.weapon.name, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#aaaaff'
        });
        this.time.delayedCall(16, () => weaponText.destroy());

        // Zone info
        const zoneText = this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 80, this.currentZone.name, {
            fontSize: '18px',
            fontFamily: 'Georgia, serif',
            color: '#88aacc'
        }).setOrigin(1, 0);
        this.time.delayedCall(16, () => zoneText.destroy());

        // Position
        const posText = this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 55, `(${this.worldX}, ${this.worldY})`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#666666'
        }).setOrigin(1, 0);
        this.time.delayedCall(16, () => posText.destroy());

        // Active quest
        if (this.activeQuests.length > 0) {
            const quest = this.activeQuests[0];
            const questText = this.add.text(GAME_WIDTH / 2, 20, quest.name + ': ' + quest.objective, {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#ffff88'
            }).setOrigin(0.5);
            this.time.delayedCall(16, () => questText.destroy());
        }

        // Nearby zone markers
        const nearbyZones = this.zones.filter(z => {
            const dx = z.x - this.worldX;
            const dy = z.y - this.worldY;
            return Math.abs(dx) <= 2 && Math.abs(dy) <= 2 && (dx !== 0 || dy !== 0) && z.type === 'town';
        });

        for (const zone of nearbyZones) {
            const dx = zone.x - this.worldX;
            const dy = zone.y - this.worldY;
            const angle = Math.atan2(dy, dx);
            const markerX = GAME_WIDTH / 2 + Math.cos(angle) * 300;
            const markerY = GAME_HEIGHT / 2 + Math.sin(angle) * 200;

            // Arrow
            g.fillStyle(zone.discovered ? 0x00ff00 : 0xffff00);
            g.fillTriangle(
                markerX + Math.cos(angle) * 15,
                markerY + Math.sin(angle) * 15,
                markerX + Math.cos(angle + 2.5) * 10,
                markerY + Math.sin(angle + 2.5) * 10,
                markerX + Math.cos(angle - 2.5) * 10,
                markerY + Math.sin(angle - 2.5) * 10
            );

            // Name
            const zoneMarkerText = this.add.text(markerX, markerY - 20, zone.name, {
                fontSize: '12px',
                fontFamily: 'monospace',
                color: zone.discovered ? '#00ff00' : '#ffff00'
            }).setOrigin(0.5);
            this.time.delayedCall(16, () => zoneMarkerText.destroy());
        }
    }

    renderInventory(g) {
        const pd = this.playerData;

        g.fillStyle(0x000000, 0.9);
        g.fillRect(50, 50, GAME_WIDTH - 100, GAME_HEIGHT - 100);

        g.strokeStyle = 0x888888;
        g.lineStyle(2, 0x888888);
        g.strokeRect(50, 50, GAME_WIDTH - 100, GAME_HEIGHT - 100);

        // Title
        const invTitle = this.add.text(GAME_WIDTH / 2, 70, 'INVENTORY', {
            fontSize: '28px',
            fontFamily: 'Georgia, serif',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.time.delayedCall(16, () => invTitle.destroy());

        // Stats
        const statsText = this.add.text(100, 110,
            `Level: ${pd.level}\nCombat: ${pd.skills.combat}\nMagic: ${pd.skills.magic}\nStealth: ${pd.skills.stealth}\n\nKills: ${pd.kills}\nDamage: ${pd.damageDealt}`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#aaaaaa'
        });
        this.time.delayedCall(16, () => statsText.destroy());

        // Equipment
        const equipText = this.add.text(300, 110,
            `Weapon: ${pd.weapon.name}\nDamage: ${pd.weapon.damage}\nSpeed: ${pd.weapon.speed}ms\nType: ${pd.weapon.type}`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#aaaaff'
        });
        this.time.delayedCall(16, () => equipText.destroy());

        // Items
        const itemsTitle = this.add.text(100, 280, 'Items:', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });
        this.time.delayedCall(16, () => itemsTitle.destroy());

        let itemY = 310;
        for (const item of pd.inventory) {
            const itemText = this.add.text(120, itemY, '- ' + item, {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#88ffff'
            });
            this.time.delayedCall(16, () => itemText.destroy());
            itemY += 20;
        }

        // Quests
        const questsTitle = this.add.text(400, 280, 'Active Quests:', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff'
        });
        this.time.delayedCall(16, () => questsTitle.destroy());

        let questY = 310;
        for (const quest of this.activeQuests) {
            const questText = this.add.text(420, questY, '- ' + quest.name, {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#ffff88'
            });
            this.time.delayedCall(16, () => questText.destroy());
            questY += 20;
        }

        // Close hint
        const closeText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 70, 'Press TAB to close', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#666666'
        }).setOrigin(0.5);
        this.time.delayedCall(16, () => closeText.destroy());
    }

    renderGameOver(g) {
        g.fillStyle(0x000000, 0.9);
        g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        const pd = this.playerData;

        const titleText = this.add.text(GAME_WIDTH / 2, 150, 'YOU DIED', {
            fontSize: '64px',
            fontFamily: 'Georgia, serif',
            color: '#ff0000'
        }).setOrigin(0.5);

        const statsText = this.add.text(GAME_WIDTH / 2, 280,
            `Level Reached: ${pd.level}\nEnemies Slain: ${pd.kills}\nDamage Dealt: ${pd.damageDealt}\nGold Collected: ${pd.gold}`, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#aaaaaa',
            align: 'center'
        }).setOrigin(0.5);

        const restartText = this.add.text(GAME_WIDTH / 2, 450, 'Refresh to try again', {
            fontSize: '24px',
            fontFamily: 'Georgia, serif',
            color: '#888888'
        }).setOrigin(0.5);

        this.time.delayedCall(16, () => {
            titleText.destroy();
            statsText.destroy();
            restartText.destroy();
        });
    }
}

// Game configuration
const config = {
    type: Phaser.CANVAS,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a2a1a',
    scene: MainScene,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

// Start game
const game = new Phaser.Game(config);
