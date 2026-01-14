// Frostfall: A 2D Skyrim Demake - Phaser 3 Implementation
// Game Constants
const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const TILE_SIZE = 32;

// Player Constants
const PLAYER_SPEED = 150;
const PLAYER_SPRINT_SPEED = 220;
const PLAYER_DODGE_SPEED = 350;
const PLAYER_DODGE_DURATION = 250;
const PLAYER_BASE_HP = 100;
const PLAYER_BASE_MP = 50;
const PLAYER_BASE_STAMINA = 100;

// Combat Constants
const SWORD_DAMAGE = 12;
const SWORD_RANGE = 50;
const BOW_DAMAGE = 15;
const ARROW_SPEED = 400;
const SPELL_DAMAGE = 20;
const SPELL_COST = 15;

// Enemy Detection
const ENEMY_DETECT_RANGE = 150;
const ENEMY_CHASE_RANGE = 250;
const ENEMY_ATTACK_RANGE = 40;

// Game State
let gameState = 'menu';
let gamePaused = true;
let currentMap = 'riverwood';

// Color Palette
const COLORS = {
    grass: 0x4a7c4e,
    dirt: 0x8b7355,
    stone: 0x696969,
    water: 0x4682b4,
    snow: 0xe8e8e8,
    wood: 0x8b4513,
    darkStone: 0x3d3d3d,
    gold: 0xffd700,
    red: 0xff4444,
    blue: 0x4488ff,
    green: 0x44ff44,
    white: 0xffffff,
    black: 0x000000,
    ui_bg: 0x2a2a3a,
    ui_border: 0x4a4a6a
};

// World Maps Data
const WORLD_MAPS = {
    riverwood: {
        name: 'Riverwood',
        type: 'village',
        width: 30,
        height: 20,
        exits: [
            { x: 29, y: 10, targetMap: 'riverwood_forest', targetX: 1, targetY: 10 },
            { x: 15, y: 0, targetMap: 'whiterun_plains', targetX: 15, targetY: 18 }
        ],
        npcs: [
            { id: 'alvor', name: 'Alvor', type: 'blacksmith', x: 8, y: 8, dialogue: 'alvor_greeting' },
            { id: 'lucan', name: 'Lucan', type: 'merchant', x: 16, y: 6, dialogue: 'lucan_greeting' },
            { id: 'gerdur', name: 'Gerdur', type: 'quest_giver', x: 12, y: 12, dialogue: 'gerdur_greeting' }
        ],
        enemies: []
    },
    riverwood_forest: {
        name: 'Riverwood Forest',
        type: 'overworld',
        width: 40,
        height: 25,
        exits: [
            { x: 0, y: 10, targetMap: 'riverwood', targetX: 28, targetY: 10 },
            { x: 39, y: 12, targetMap: 'embershard_mine', targetX: 1, targetY: 5 },
            { x: 20, y: 0, targetMap: 'whiterun_plains', targetX: 20, targetY: 24 }
        ],
        npcs: [
            { id: 'hunter', name: 'Hunter', type: 'quest_giver', x: 25, y: 15, dialogue: 'hunter_greeting' }
        ],
        enemies: [
            { type: 'wolf', x: 15, y: 8 },
            { type: 'wolf', x: 17, y: 9 },
            { type: 'wolf', x: 30, y: 18 },
            { type: 'alpha_wolf', x: 32, y: 17 }
        ]
    },
    embershard_mine: {
        name: 'Embershard Mine',
        type: 'dungeon',
        width: 35,
        height: 30,
        exits: [
            { x: 0, y: 5, targetMap: 'riverwood_forest', targetX: 38, targetY: 12 }
        ],
        npcs: [],
        enemies: [
            { type: 'bandit', x: 8, y: 8 },
            { type: 'bandit', x: 12, y: 10 },
            { type: 'bandit_archer', x: 18, y: 6 },
            { type: 'bandit', x: 22, y: 15 },
            { type: 'bandit', x: 25, y: 18 },
            { type: 'bandit_archer', x: 28, y: 20 },
            { type: 'bandit_chief', x: 30, y: 25 }
        ],
        chests: [
            { x: 10, y: 5, loot: ['gold_50', 'health_potion'] },
            { x: 20, y: 12, loot: ['gold_30', 'iron_sword'] },
            { x: 32, y: 26, loot: ['gold_100', 'steel_sword', 'health_potion', 'health_potion'] }
        ]
    },
    whiterun_plains: {
        name: 'Whiterun Plains',
        type: 'overworld',
        width: 50,
        height: 30,
        exits: [
            { x: 15, y: 19, targetMap: 'riverwood', targetX: 15, targetY: 1 },
            { x: 20, y: 25, targetMap: 'riverwood_forest', targetX: 20, targetY: 1 },
            { x: 25, y: 0, targetMap: 'whiterun', targetX: 15, targetY: 18 },
            { x: 45, y: 15, targetMap: 'bleak_falls', targetX: 1, targetY: 10 }
        ],
        npcs: [],
        enemies: [
            { type: 'wolf', x: 10, y: 10 },
            { type: 'wolf', x: 12, y: 11 },
            { type: 'bandit', x: 35, y: 8 },
            { type: 'bandit', x: 37, y: 9 },
            { type: 'bandit_archer', x: 36, y: 7 }
        ]
    },
    whiterun: {
        name: 'Whiterun',
        type: 'city',
        width: 40,
        height: 30,
        exits: [
            { x: 15, y: 19, targetMap: 'whiterun_plains', targetX: 25, targetY: 1 },
            { x: 20, y: 0, targetMap: 'dragonsreach', targetX: 10, targetY: 18 }
        ],
        npcs: [
            { id: 'adrianne', name: 'Adrianne', type: 'blacksmith', x: 8, y: 15, dialogue: 'adrianne_greeting' },
            { id: 'belethor', name: 'Belethor', type: 'merchant', x: 18, y: 12, dialogue: 'belethor_greeting' },
            { id: 'guard1', name: 'Guard', type: 'guard', x: 15, y: 18, dialogue: 'guard_greeting' },
            { id: 'farengar', name: 'Farengar', type: 'court_wizard', x: 25, y: 8, dialogue: 'farengar_greeting' }
        ],
        enemies: []
    },
    dragonsreach: {
        name: 'Dragonsreach',
        type: 'interior',
        width: 25,
        height: 20,
        exits: [
            { x: 10, y: 19, targetMap: 'whiterun', targetX: 20, targetY: 1 }
        ],
        npcs: [
            { id: 'balgruuf', name: 'Jarl Balgruuf', type: 'jarl', x: 12, y: 5, dialogue: 'balgruuf_greeting' },
            { id: 'irileth', name: 'Irileth', type: 'housecarl', x: 10, y: 7, dialogue: 'irileth_greeting' }
        ],
        enemies: []
    },
    bleak_falls: {
        name: 'Bleak Falls Barrow',
        type: 'dungeon',
        width: 45,
        height: 35,
        exits: [
            { x: 0, y: 10, targetMap: 'whiterun_plains', targetX: 44, targetY: 15 }
        ],
        npcs: [],
        enemies: [
            { type: 'bandit', x: 5, y: 8 },
            { type: 'bandit', x: 7, y: 12 },
            { type: 'draugr', x: 15, y: 10 },
            { type: 'draugr', x: 18, y: 12 },
            { type: 'draugr', x: 20, y: 8 },
            { type: 'draugr_archer', x: 25, y: 15 },
            { type: 'draugr', x: 28, y: 18 },
            { type: 'draugr', x: 30, y: 20 },
            { type: 'draugr_wight', x: 35, y: 25 },
            { type: 'draugr_deathlord', x: 40, y: 30 }
        ],
        chests: [
            { x: 8, y: 6, loot: ['gold_30', 'health_potion'] },
            { x: 22, y: 14, loot: ['gold_50', 'ancient_sword'] },
            { x: 42, y: 32, loot: ['gold_150', 'dragonstone', 'golden_claw', 'health_potion', 'health_potion'] }
        ]
    }
};

// Enemy Types Data
const ENEMY_TYPES = {
    wolf: { name: 'Wolf', hp: 25, damage: 6, speed: 100, color: 0x8b8b8b, xp: 15, behavior: 'pack' },
    alpha_wolf: { name: 'Alpha Wolf', hp: 50, damage: 10, speed: 90, color: 0x5a5a5a, xp: 30, behavior: 'pack_leader' },
    bandit: { name: 'Bandit', hp: 40, damage: 8, speed: 80, color: 0xb5651d, xp: 25, behavior: 'patrol' },
    bandit_archer: { name: 'Bandit Archer', hp: 30, damage: 10, speed: 70, color: 0x8b4513, xp: 25, behavior: 'ranged' },
    bandit_chief: { name: 'Bandit Chief', hp: 80, damage: 15, speed: 75, color: 0x654321, xp: 75, behavior: 'aggressive' },
    draugr: { name: 'Draugr', hp: 50, damage: 10, speed: 60, color: 0x4a6a7a, xp: 35, behavior: 'guard' },
    draugr_archer: { name: 'Draugr Archer', hp: 35, damage: 12, speed: 55, color: 0x3a5a6a, xp: 35, behavior: 'ranged' },
    draugr_wight: { name: 'Draugr Wight', hp: 80, damage: 15, speed: 65, color: 0x2a4a5a, xp: 60, behavior: 'aggressive' },
    draugr_deathlord: { name: 'Draugr Deathlord', hp: 150, damage: 25, speed: 70, color: 0x1a3a4a, xp: 150, behavior: 'boss' }
};

// Item Data
const ITEMS = {
    health_potion: { name: 'Health Potion', type: 'consumable', effect: 'heal', value: 50, price: 30 },
    health_potion_minor: { name: 'Minor Health Potion', type: 'consumable', effect: 'heal', value: 25, price: 15 },
    magicka_potion: { name: 'Magicka Potion', type: 'consumable', effect: 'magicka', value: 30, price: 25 },
    stamina_potion: { name: 'Stamina Potion', type: 'consumable', effect: 'stamina', value: 50, price: 20 },
    iron_sword: { name: 'Iron Sword', type: 'weapon', subtype: 'melee', damage: 8, price: 50 },
    steel_sword: { name: 'Steel Sword', type: 'weapon', subtype: 'melee', damage: 12, price: 120 },
    ancient_sword: { name: 'Ancient Nord Sword', type: 'weapon', subtype: 'melee', damage: 10, price: 80 },
    hunting_bow: { name: 'Hunting Bow', type: 'weapon', subtype: 'ranged', damage: 10, price: 60 },
    iron_armor: { name: 'Iron Armor', type: 'armor', slot: 'body', armor: 30, price: 100 },
    leather_armor: { name: 'Leather Armor', type: 'armor', slot: 'body', armor: 15, price: 50 },
    iron_helmet: { name: 'Iron Helmet', type: 'armor', slot: 'head', armor: 10, price: 40 },
    dragonstone: { name: 'Dragonstone', type: 'quest', description: 'Ancient tablet with dragon burial locations' },
    golden_claw: { name: 'Golden Claw', type: 'quest', description: 'Ornate golden claw from Bleak Falls' },
    gold_30: { name: 'Gold', type: 'gold', value: 30 },
    gold_50: { name: 'Gold', type: 'gold', value: 50 },
    gold_100: { name: 'Gold', type: 'gold', value: 100 },
    gold_150: { name: 'Gold', type: 'gold', value: 150 }
};

// Dialogue Data
const DIALOGUES = {
    alvor_greeting: {
        speaker: 'Alvor',
        text: "Welcome to Riverwood, traveler. I'm the blacksmith here. Need any weapons or armor?",
        options: [
            { text: "I'd like to see your wares", action: 'shop', shopType: 'blacksmith' },
            { text: "Tell me about Riverwood", next: 'alvor_about' },
            { text: "Goodbye", action: 'close' }
        ]
    },
    alvor_about: {
        speaker: 'Alvor',
        text: "Riverwood is a quiet village. We've had some trouble with bandits at Embershard Mine to the east. The Jarl in Whiterun might want to know about the dragon attack at Helgen.",
        options: [
            { text: "I'll clear out that mine", action: 'quest', questId: 'clear_embershard' },
            { text: "I should head to Whiterun", action: 'close' },
            { text: "Goodbye", action: 'close' }
        ]
    },
    lucan_greeting: {
        speaker: 'Lucan',
        text: "Welcome to the Riverwood Trader! We've got a bit of everything. Say, I don't suppose you could help me with something?",
        options: [
            { text: "What do you need help with?", next: 'lucan_quest' },
            { text: "Let me see your wares", action: 'shop', shopType: 'general' },
            { text: "Goodbye", action: 'close' }
        ]
    },
    lucan_quest: {
        speaker: 'Lucan',
        text: "Thieves broke in and stole my golden claw. I'm sure they ran off to Bleak Falls Barrow. If you could get it back, I'd pay you well.",
        options: [
            { text: "I'll get your claw back", action: 'quest', questId: 'golden_claw' },
            { text: "I'll think about it", action: 'close' }
        ]
    },
    gerdur_greeting: {
        speaker: 'Gerdur',
        text: "You're new here. Take care on the roads - wolves and bandits are a problem. If you need work, speak to Alvor or head to Whiterun.",
        options: [
            { text: "Where is Whiterun?", next: 'gerdur_directions' },
            { text: "Thanks for the advice", action: 'close' }
        ]
    },
    gerdur_directions: {
        speaker: 'Gerdur',
        text: "Head north through the forest and across the plains. You'll see the city on the hill. Speak to Jarl Balgruuf - he needs to know about the dragons.",
        options: [
            { text: "I'll head there now", action: 'close' }
        ]
    },
    hunter_greeting: {
        speaker: 'Hunter',
        text: "Watch yourself out here. There's an alpha wolf leading a pack nearby. Dangerous beast. I'd pay good coin to see it dealt with. I also need wolf pelts if you're hunting.",
        options: [
            { text: "I'll kill the alpha wolf", action: 'quest', questId: 'wolf_problem' },
            { text: "I'll bring you wolf pelts", action: 'quest', questId: 'gather_pelts' },
            { text: "I'll be careful", action: 'close' }
        ]
    },
    guard_greeting: {
        speaker: 'Guard',
        text: "Welcome to Whiterun. Keep your weapons sheathed and don't cause any trouble. Say, we could use help with bandits on the roads.",
        options: [
            { text: "Where can I find the Jarl?", next: 'guard_directions' },
            { text: "I'll hunt those bandits", action: 'quest', questId: 'bandit_bounty' },
            { text: "I'll behave", action: 'close' }
        ]
    },
    guard_directions: {
        speaker: 'Guard',
        text: "Dragonsreach, up the stairs at the top of the city. The Jarl sees visitors, but be respectful.",
        options: [
            { text: "Thank you", action: 'close' }
        ]
    },
    adrianne_greeting: {
        speaker: 'Adrianne',
        text: "Looking for quality weapons? You've come to the right place. Warmaiden's has the finest steel in Whiterun.",
        options: [
            { text: "Show me what you have", action: 'shop', shopType: 'blacksmith_whiterun' },
            { text: "Just looking", action: 'close' }
        ]
    },
    belethor_greeting: {
        speaker: 'Belethor',
        text: "Everything's for sale, my friend! Everything! If I had a sister, I'd sell her in a second!",
        options: [
            { text: "Show me your goods", action: 'shop', shopType: 'general_whiterun' },
            { text: "That's... disturbing", action: 'close' }
        ]
    },
    farengar_greeting: {
        speaker: 'Farengar',
        text: "Ah, a visitor. I am Farengar Secret-Fire, the Jarl's court wizard. I study dragons. Do you have any information about them?",
        options: [
            { text: "I need magical supplies", action: 'shop', shopType: 'wizard' },
            { text: "What do you know about dragons?", next: 'farengar_dragons' },
            { text: "Not right now", action: 'close' }
        ]
    },
    farengar_dragons: {
        speaker: 'Farengar',
        text: "The dragons have returned. I need a Dragonstone from Bleak Falls Barrow - an ancient map of dragon burial sites. Bring it to me.",
        options: [
            { text: "I'll find this Dragonstone", action: 'quest', questId: 'dragonstone' },
            { text: "I'll think about it", action: 'close' }
        ]
    },
    balgruuf_greeting: {
        speaker: 'Jarl Balgruuf',
        text: "So you're the one who escaped Helgen. My court wizard Farengar is researching dragons. Speak with him - we need all the help we can get.",
        options: [
            { text: "I'll help however I can", next: 'balgruuf_thanks' },
            { text: "What's in it for me?", next: 'balgruuf_reward' }
        ]
    },
    balgruuf_thanks: {
        speaker: 'Jarl Balgruuf',
        text: "Good. Speak to Farengar about the Dragonstone. Return to me when you have it, and I'll see you're properly rewarded.",
        options: [
            { text: "I'll find it", action: 'close' }
        ]
    },
    balgruuf_reward: {
        speaker: 'Jarl Balgruuf',
        text: "Gold, weapons, the gratitude of Whiterun. Help us, and you'll be well compensated. Now speak to Farengar.",
        options: [
            { text: "Very well", action: 'close' }
        ]
    },
    irileth_greeting: {
        speaker: 'Irileth',
        text: "State your business with the Jarl quickly. These are dangerous times.",
        options: [
            { text: "I'm here to help with the dragons", action: 'close' },
            { text: "I'll speak to the Jarl", action: 'close' }
        ]
    }
};

// Quest Data
const QUESTS = {
    clear_embershard: {
        name: "Trouble in the Mine",
        description: "Clear Embershard Mine of bandits",
        objectives: [
            { type: 'clear_dungeon', target: 'embershard_mine', current: 0, required: 1 }
        ],
        rewards: { gold: 75, xp: 100, items: ['iron_sword'] }
    },
    golden_claw: {
        name: "The Golden Claw",
        description: "Retrieve the Golden Claw from Bleak Falls Barrow",
        objectives: [
            { type: 'find_item', target: 'golden_claw', current: 0, required: 1 }
        ],
        rewards: { gold: 100, xp: 150 }
    },
    wolf_problem: {
        name: "Wolf Problem",
        description: "Kill the Alpha Wolf in Riverwood Forest",
        objectives: [
            { type: 'kill_enemy', target: 'alpha_wolf', current: 0, required: 1 }
        ],
        rewards: { gold: 50, xp: 75, items: ['hunting_bow'] }
    },
    dragonstone: {
        name: "Bleak Falls Barrow",
        description: "Retrieve the Dragonstone for Farengar",
        objectives: [
            { type: 'find_item', target: 'dragonstone', current: 0, required: 1 }
        ],
        rewards: { gold: 200, xp: 250 }
    },
    main_quest: {
        name: "Before the Storm",
        description: "Speak to the Jarl of Whiterun about the dragon attack",
        objectives: [
            { type: 'talk_to', target: 'balgruuf', current: 0, required: 1 }
        ],
        rewards: { xp: 100 }
    },
    // New side quests
    bandit_bounty: {
        name: "Bandit Bounty",
        description: "Kill 5 bandits for the Whiterun Guard",
        objectives: [
            { type: 'kill_enemy', target: 'bandit', current: 0, required: 5 }
        ],
        rewards: { gold: 100, xp: 120 }
    },
    draugr_hunt: {
        name: "Draugr Hunt",
        description: "Slay 3 Draugr in Bleak Falls Barrow",
        objectives: [
            { type: 'kill_enemy', target: 'draugr', current: 0, required: 3 }
        ],
        rewards: { gold: 80, xp: 100, items: ['ancient_sword'] }
    },
    gather_pelts: {
        name: "Wolf Pelts",
        description: "Kill 3 wolves for the Riverwood hunter",
        objectives: [
            { type: 'kill_enemy', target: 'wolf', current: 0, required: 3 }
        ],
        rewards: { gold: 40, xp: 50, items: ['leather_armor'] }
    }
};

// Shop Inventories
const SHOPS = {
    blacksmith: {
        name: "Alvor's Forge",
        items: ['iron_sword', 'hunting_bow', 'iron_armor', 'leather_armor', 'iron_helmet']
    },
    general: {
        name: "Riverwood Trader",
        items: ['health_potion', 'health_potion_minor', 'stamina_potion']
    },
    blacksmith_whiterun: {
        name: "Warmaiden's",
        items: ['iron_sword', 'steel_sword', 'hunting_bow', 'iron_armor', 'leather_armor', 'iron_helmet']
    },
    general_whiterun: {
        name: "Belethor's General Goods",
        items: ['health_potion', 'health_potion_minor', 'magicka_potion', 'stamina_potion']
    },
    wizard: {
        name: "Court Wizard's Supplies",
        items: ['magicka_potion', 'health_potion']
    }
};

// Main Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Initialize game state
        this.player = null;
        this.enemies = [];
        this.npcs = [];
        this.projectiles = [];
        this.chests = [];
        this.pickups = [];
        this.damageNumbers = [];

        // Player data
        this.playerData = {
            health: PLAYER_BASE_HP,
            maxHealth: PLAYER_BASE_HP,
            magicka: PLAYER_BASE_MP,
            maxMagicka: PLAYER_BASE_MP,
            stamina: PLAYER_BASE_STAMINA,
            maxStamina: PLAYER_BASE_STAMINA,
            level: 1,
            xp: 0,
            xpToLevel: 100,
            gold: 50,
            skills: { combat: 1, magic: 1, stealth: 1 },
            perks: [],
            equipment: {
                weapon: 'iron_sword',
                armor: null,
                helmet: null
            },
            inventory: ['health_potion', 'health_potion'],
            direction: 'down'
        };

        // Quest tracking
        this.activeQuests = [];
        this.completedQuests = [];

        // Combat state
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.isDodging = false;
        this.dodgeCooldown = 0;
        this.isSprinting = false;
        this.staminaRegenDelay = 0;
        this.invincibleTime = 0;

        // UI state
        this.dialogueActive = false;
        this.currentDialogue = null;
        this.shopActive = false;
        this.inventoryOpen = false;

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            interact: Phaser.Input.Keyboard.KeyCodes.E,
            inventory: Phaser.Input.Keyboard.KeyCodes.TAB,
            slot1: Phaser.Input.Keyboard.KeyCodes.ONE,
            slot2: Phaser.Input.Keyboard.KeyCodes.TWO,
            slot3: Phaser.Input.Keyboard.KeyCodes.THREE,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            escape: Phaser.Input.Keyboard.KeyCodes.ESC
        });

        // Mouse input
        this.input.on('pointerdown', (pointer) => {
            if (gamePaused) return;
            if (this.dialogueActive || this.shopActive || this.inventoryOpen) return;
            if (pointer.leftButtonDown()) {
                this.playerAttack();
            }
        });

        // Create world
        this.loadMap(currentMap);

        // Create UI
        this.createUI();

        // Create navigation markers
        this.markerGraphics = this.add.graphics().setScrollFactor(0).setDepth(90);

        // Start game paused for harness
        gameState = 'playing';
        gamePaused = true;

        // Initialize harness
        this.initHarness();
    }

    loadMap(mapId) {
        currentMap = mapId;
        const mapData = WORLD_MAPS[mapId];

        // Clear existing entities
        this.enemies.forEach(e => e.sprite && e.sprite.destroy());
        this.npcs.forEach(n => n.sprite && n.sprite.destroy());
        this.chests.forEach(c => c.sprite && c.sprite.destroy());
        this.projectiles.forEach(p => p.sprite && p.sprite.destroy());
        this.pickups.forEach(p => p.sprite && p.sprite.destroy());

        this.enemies = [];
        this.npcs = [];
        this.chests = [];
        this.projectiles = [];
        this.pickups = [];

        // Clear old graphics
        if (this.mapGraphics) this.mapGraphics.destroy();
        if (this.wallGraphics) this.wallGraphics.destroy();

        // Create map graphics
        this.mapGraphics = this.add.graphics();
        this.wallGraphics = this.add.graphics();

        // Draw terrain
        this.drawTerrain(mapData);

        // Create player if not exists
        if (!this.player) {
            this.player = this.add.graphics();
            this.player.x = 100;
            this.player.y = 300;
        }

        // Create enemies
        mapData.enemies.forEach(enemyData => {
            this.spawnEnemy(enemyData.type, enemyData.x * TILE_SIZE, enemyData.y * TILE_SIZE);
        });

        // Create NPCs
        mapData.npcs.forEach(npcData => {
            this.spawnNPC(npcData);
        });

        // Create chests
        if (mapData.chests) {
            mapData.chests.forEach(chestData => {
                this.spawnChest(chestData);
            });
        }

        // Store exits
        this.exits = mapData.exits;

        // Update map bounds
        this.mapWidth = mapData.width * TILE_SIZE;
        this.mapHeight = mapData.height * TILE_SIZE;

        // Draw player
        this.drawPlayer();
    }

    drawTerrain(mapData) {
        const g = this.mapGraphics;
        g.clear();

        // Base terrain color based on map type
        let baseColor = COLORS.grass;
        if (mapData.type === 'dungeon') baseColor = COLORS.darkStone;
        else if (mapData.type === 'interior') baseColor = COLORS.stone;
        else if (mapData.type === 'city' || mapData.type === 'village') baseColor = COLORS.dirt;

        // Fill background
        g.fillStyle(baseColor, 1);
        g.fillRect(0, 0, mapData.width * TILE_SIZE, mapData.height * TILE_SIZE);

        // Add some terrain variation
        for (let x = 0; x < mapData.width; x++) {
            for (let y = 0; y < mapData.height; y++) {
                if (Math.random() < 0.1) {
                    g.fillStyle(Phaser.Display.Color.ValueToColor(baseColor).darken(10).color, 0.5);
                    g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }

        // Draw walls/boundaries
        const w = this.wallGraphics;
        w.clear();
        w.fillStyle(COLORS.stone, 1);

        // Perimeter walls (with gaps for exits)
        for (let x = 0; x < mapData.width; x++) {
            // Top wall
            if (!this.isExit(x, 0, mapData.exits)) {
                w.fillRect(x * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
            }
            // Bottom wall
            if (!this.isExit(x, mapData.height - 1, mapData.exits)) {
                w.fillRect(x * TILE_SIZE, (mapData.height - 1) * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
        for (let y = 0; y < mapData.height; y++) {
            // Left wall
            if (!this.isExit(0, y, mapData.exits)) {
                w.fillRect(0, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
            // Right wall
            if (!this.isExit(mapData.width - 1, y, mapData.exits)) {
                w.fillRect((mapData.width - 1) * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }

        // Draw exit markers
        mapData.exits.forEach(exit => {
            g.fillStyle(0x44aa44, 0.5);
            g.fillRect(exit.x * TILE_SIZE, exit.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        });

        // Add buildings/structures for villages and cities
        if (mapData.type === 'village' || mapData.type === 'city') {
            this.drawBuildings(mapData);
        }

        // Add dungeon features
        if (mapData.type === 'dungeon') {
            this.drawDungeonFeatures(mapData);
        }
    }

    isExit(x, y, exits) {
        return exits.some(e => e.x === x && e.y === y);
    }

    drawBuildings(mapData) {
        const g = this.mapGraphics;
        // Draw some simple building shapes
        const buildings = [
            { x: 5, y: 5, w: 4, h: 4 },
            { x: 14, y: 4, w: 5, h: 4 },
            { x: 10, y: 10, w: 4, h: 4 }
        ];

        buildings.forEach(b => {
            if (b.x + b.w < mapData.width && b.y + b.h < mapData.height) {
                g.fillStyle(COLORS.wood, 1);
                g.fillRect(b.x * TILE_SIZE, b.y * TILE_SIZE, b.w * TILE_SIZE, b.h * TILE_SIZE);
                g.fillStyle(0x654321, 1);
                g.fillRect(b.x * TILE_SIZE + 2, b.y * TILE_SIZE + 2, b.w * TILE_SIZE - 4, b.h * TILE_SIZE - 4);
            }
        });
    }

    drawDungeonFeatures(mapData) {
        const g = this.mapGraphics;
        // Add some dungeon decoration
        for (let i = 0; i < 10; i++) {
            const x = Phaser.Math.Between(2, mapData.width - 3);
            const y = Phaser.Math.Between(2, mapData.height - 3);
            g.fillStyle(0x2a2a2a, 0.7);
            g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE);
        }
    }

    drawPlayer() {
        this.player.clear();

        // Player body
        this.player.fillStyle(0x4488ff, 1);
        this.player.fillRect(-12, -16, 24, 32);

        // Player face direction indicator
        this.player.fillStyle(0xffddbb, 1);
        let headX = 0, headY = -8;
        this.player.fillCircle(headX, headY, 8);

        // Weapon indicator
        if (this.playerData.equipment.weapon) {
            this.player.fillStyle(0xaaaaaa, 1);
            switch (this.playerData.direction) {
                case 'up': this.player.fillRect(-2, -24, 4, 12); break;
                case 'down': this.player.fillRect(-2, 12, 4, 12); break;
                case 'left': this.player.fillRect(-24, -2, 12, 4); break;
                case 'right': this.player.fillRect(12, -2, 12, 4); break;
            }
        }
    }

    spawnEnemy(type, x, y) {
        const data = ENEMY_TYPES[type];
        const enemy = {
            type: type,
            x: x,
            y: y,
            health: data.hp,
            maxHealth: data.hp,
            damage: data.damage,
            speed: data.speed,
            color: data.color,
            xp: data.xp,
            behavior: data.behavior,
            state: 'idle',
            patrolPoint: { x: x, y: y },
            attackCooldown: 0,
            lastKnownPlayerPos: null,
            searchTime: 0,
            sprite: this.add.graphics()
        };

        this.drawEnemy(enemy);
        this.enemies.push(enemy);
        return enemy;
    }

    drawEnemy(enemy) {
        enemy.sprite.clear();
        enemy.sprite.x = enemy.x;
        enemy.sprite.y = enemy.y;

        // Body
        enemy.sprite.fillStyle(enemy.color, 1);
        if (enemy.type.includes('wolf')) {
            // Wolf shape
            enemy.sprite.fillEllipse(0, 0, 28, 18);
        } else {
            // Humanoid shape
            enemy.sprite.fillRect(-10, -14, 20, 28);
        }

        // Health bar background
        enemy.sprite.fillStyle(0x333333, 1);
        enemy.sprite.fillRect(-15, -22, 30, 4);

        // Health bar
        const healthPercent = enemy.health / enemy.maxHealth;
        enemy.sprite.fillStyle(healthPercent > 0.3 ? 0x44ff44 : 0xff4444, 1);
        enemy.sprite.fillRect(-15, -22, 30 * healthPercent, 4);
    }

    spawnNPC(npcData) {
        const npc = {
            id: npcData.id,
            name: npcData.name,
            type: npcData.type,
            x: npcData.x * TILE_SIZE,
            y: npcData.y * TILE_SIZE,
            dialogue: npcData.dialogue,
            sprite: this.add.graphics()
        };

        this.drawNPC(npc);
        this.npcs.push(npc);
        return npc;
    }

    drawNPC(npc) {
        npc.sprite.clear();
        npc.sprite.x = npc.x;
        npc.sprite.y = npc.y;

        // NPC color based on type
        let color = 0x88aa88;
        if (npc.type === 'blacksmith') color = 0xaa6644;
        else if (npc.type === 'merchant') color = 0x88aa44;
        else if (npc.type === 'jarl') color = 0xddaa44;
        else if (npc.type === 'guard') color = 0x666688;
        else if (npc.type === 'court_wizard') color = 0x8844aa;

        // Body
        npc.sprite.fillStyle(color, 1);
        npc.sprite.fillRect(-10, -14, 20, 28);

        // Head
        npc.sprite.fillStyle(0xffddbb, 1);
        npc.sprite.fillCircle(0, -8, 7);

        // Name tag
        if (!npc.nameText) {
            npc.nameText = this.add.text(npc.x, npc.y - 28, npc.name, {
                fontSize: '10px',
                fill: '#ffffff',
                backgroundColor: '#00000088',
                padding: { x: 2, y: 1 }
            }).setOrigin(0.5);
        }
    }

    spawnChest(chestData) {
        const chest = {
            x: chestData.x * TILE_SIZE,
            y: chestData.y * TILE_SIZE,
            loot: chestData.loot,
            opened: false,
            sprite: this.add.graphics()
        };

        this.drawChest(chest);
        this.chests.push(chest);
        return chest;
    }

    drawChest(chest) {
        chest.sprite.clear();
        chest.sprite.x = chest.x;
        chest.sprite.y = chest.y;

        if (chest.opened) {
            chest.sprite.fillStyle(0x654321, 1);
        } else {
            chest.sprite.fillStyle(0x8b4513, 1);
        }
        chest.sprite.fillRect(-12, -8, 24, 16);

        if (!chest.opened) {
            chest.sprite.fillStyle(COLORS.gold, 1);
            chest.sprite.fillRect(-3, -2, 6, 4);
        }
    }

    spawnPickup(x, y, itemId) {
        const pickup = {
            x: x,
            y: y,
            item: itemId,
            sprite: this.add.graphics()
        };

        pickup.sprite.x = x;
        pickup.sprite.y = y;

        // Draw pickup based on type
        const item = ITEMS[itemId];
        if (item.type === 'gold') {
            pickup.sprite.fillStyle(COLORS.gold, 1);
            pickup.sprite.fillCircle(0, 0, 8);
        } else {
            pickup.sprite.fillStyle(0x44ff44, 1);
            pickup.sprite.fillRect(-6, -6, 12, 12);
        }

        this.pickups.push(pickup);
        return pickup;
    }

    createUI() {
        // UI Container
        this.uiGraphics = this.add.graphics();
        this.uiGraphics.setScrollFactor(0);
        this.uiGraphics.setDepth(100);

        // Health bar
        this.healthBarBg = this.add.graphics().setScrollFactor(0).setDepth(100);
        this.healthBar = this.add.graphics().setScrollFactor(0).setDepth(101);

        // Magicka bar
        this.magickaBarBg = this.add.graphics().setScrollFactor(0).setDepth(100);
        this.magickaBar = this.add.graphics().setScrollFactor(0).setDepth(101);

        // Stamina bar
        this.staminaBarBg = this.add.graphics().setScrollFactor(0).setDepth(100);
        this.staminaBar = this.add.graphics().setScrollFactor(0).setDepth(101);

        // UI Text
        this.goldText = this.add.text(GAME_WIDTH - 100, 10, 'Gold: 0', {
            fontSize: '16px',
            fill: '#ffd700'
        }).setScrollFactor(0).setDepth(102);

        this.levelText = this.add.text(GAME_WIDTH - 100, 30, 'Level: 1', {
            fontSize: '14px',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(102);

        this.locationText = this.add.text(10, 10, 'Location', {
            fontSize: '14px',
            fill: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 4, y: 2 }
        }).setScrollFactor(0).setDepth(102);

        this.questText = this.add.text(10, 50, '', {
            fontSize: '12px',
            fill: '#ffff88',
            backgroundColor: '#00000088',
            padding: { x: 4, y: 2 }
        }).setScrollFactor(0).setDepth(102);

        // Interaction prompt
        this.interactPrompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, '[E] Interact', {
            fontSize: '14px',
            fill: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
        this.interactPrompt.setVisible(false);

        // Dialogue box (hidden initially)
        this.dialogueBox = this.add.graphics().setScrollFactor(0).setDepth(200);
        this.dialogueSpeaker = this.add.text(80, GAME_HEIGHT - 200, '', {
            fontSize: '18px',
            fill: '#ffd700',
            fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(201).setVisible(false);
        this.dialogueText = this.add.text(80, GAME_HEIGHT - 170, '', {
            fontSize: '14px',
            fill: '#ffffff',
            wordWrap: { width: 800 }
        }).setScrollFactor(0).setDepth(201).setVisible(false);
        this.dialogueOptions = [];

        // Inventory UI (hidden initially)
        this.inventoryBox = this.add.graphics().setScrollFactor(0).setDepth(200);
        this.inventoryItems = [];

        // Shop UI (hidden initially)
        this.shopBox = this.add.graphics().setScrollFactor(0).setDepth(200);
        this.shopItems = [];

        this.updateUI();
    }

    updateUI() {
        // Update health bar
        this.healthBarBg.clear();
        this.healthBarBg.fillStyle(0x333333, 1);
        this.healthBarBg.fillRect(10, GAME_HEIGHT - 40, 200, 20);

        this.healthBar.clear();
        const healthPercent = this.playerData.health / this.playerData.maxHealth;
        this.healthBar.fillStyle(0xff4444, 1);
        this.healthBar.fillRect(12, GAME_HEIGHT - 38, 196 * healthPercent, 16);

        // Update magicka bar
        this.magickaBarBg.clear();
        this.magickaBarBg.fillStyle(0x333333, 1);
        this.magickaBarBg.fillRect(220, GAME_HEIGHT - 40, 150, 20);

        this.magickaBar.clear();
        const magickaPercent = this.playerData.magicka / this.playerData.maxMagicka;
        this.magickaBar.fillStyle(0x4488ff, 1);
        this.magickaBar.fillRect(222, GAME_HEIGHT - 38, 146 * magickaPercent, 16);

        // Update stamina bar
        this.staminaBarBg.clear();
        this.staminaBarBg.fillStyle(0x333333, 1);
        this.staminaBarBg.fillRect(380, GAME_HEIGHT - 40, 150, 20);

        this.staminaBar.clear();
        const staminaPercent = this.playerData.stamina / this.playerData.maxStamina;
        this.staminaBar.fillStyle(0x44ff44, 1);
        this.staminaBar.fillRect(382, GAME_HEIGHT - 38, 146 * staminaPercent, 16);

        // Update text
        this.goldText.setText(`Gold: ${this.playerData.gold}`);
        this.levelText.setText(`Level: ${this.playerData.level}`);
        this.locationText.setText(WORLD_MAPS[currentMap].name);

        // Update quest text
        if (this.activeQuests.length > 0) {
            const quest = QUESTS[this.activeQuests[0]];
            this.questText.setText(`Quest: ${quest.name}`);
        } else {
            this.questText.setText('');
        }
    }

    playerAttack() {
        if (this.attackCooldown > 0 || this.isDodging) return;

        this.isAttacking = true;
        this.attackCooldown = 400;

        const weapon = this.playerData.equipment.weapon;
        const weaponData = weapon ? ITEMS[weapon] : { damage: 5 };

        // Determine attack direction based on mouse position
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);

        // Skill damage bonus
        const skillBonus = 1 + (this.playerData.skills.combat * 0.05);
        const damage = Math.floor((weaponData.damage || SWORD_DAMAGE) * skillBonus);

        // Check for hits
        this.enemies.forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist < SWORD_RANGE + 20) {
                const angleToEnemy = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angle - angleToEnemy));
                if (angleDiff < 0.8) {
                    this.damageEnemy(enemy, damage);
                }
            }
        });

        // Gain combat XP
        this.gainSkillXP('combat', 5);

        // Visual feedback
        this.flashPlayer(0xffffff);

        // Use stamina
        this.playerData.stamina = Math.max(0, this.playerData.stamina - 10);
        this.staminaRegenDelay = 1000;
    }

    damageEnemy(enemy, damage) {
        enemy.health -= damage;

        // Damage number
        this.showDamageNumber(enemy.x, enemy.y - 20, damage, 0xff4444);

        // Flash enemy
        const originalColor = enemy.color;
        enemy.color = 0xffffff;
        this.drawEnemy(enemy);

        this.time.delayedCall(100, () => {
            enemy.color = originalColor;
            this.drawEnemy(enemy);
        });

        // Knockback - push enemy away from player
        const knockbackForce = enemy.behavior === 'boss' ? 40 : 100;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        enemy.knockbackVx = Math.cos(angle) * knockbackForce;
        enemy.knockbackVy = Math.sin(angle) * knockbackForce;
        enemy.knockbackTime = 150;

        // Stagger - enemy can't act while staggered
        enemy.isStaggered = true;
        this.time.delayedCall(200, () => {
            enemy.isStaggered = false;
        });

        // Hit impact effect
        this.showHitEffect(enemy.x, enemy.y);

        // Screen shake on powerful hits
        if (damage > 15) {
            this.cameras.main.shake(50, 0.005);
        }

        // Alert enemy
        enemy.state = 'chase';
        enemy.lastKnownPlayerPos = { x: this.player.x, y: this.player.y };

        if (enemy.health <= 0) {
            this.killEnemy(enemy);
        }
    }

    showHitEffect(x, y) {
        // Create hit spark effect
        const spark = this.add.graphics();
        spark.x = x;
        spark.y = y;
        spark.fillStyle(0xffffff, 0.8);
        spark.fillCircle(0, 0, 15);
        spark.fillStyle(0xffff00, 0.6);
        spark.fillCircle(0, 0, 10);

        this.tweens.add({
            targets: spark,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 150,
            onComplete: () => spark.destroy()
        });
    }

    killEnemy(enemy) {
        // Grant XP
        this.gainXP(enemy.xp);

        // Check quest objectives
        this.checkKillObjective(enemy.type);

        // Drop loot
        if (Math.random() < 0.3) {
            this.spawnPickup(enemy.x, enemy.y, 'gold_30');
        }
        if (Math.random() < 0.2) {
            this.spawnPickup(enemy.x + 20, enemy.y, 'health_potion_minor');
        }

        // Remove enemy
        enemy.sprite.destroy();
        const idx = this.enemies.indexOf(enemy);
        if (idx > -1) this.enemies.splice(idx, 1);

        // Check if dungeon cleared
        this.checkDungeonCleared();
    }

    checkDungeonCleared() {
        const mapData = WORLD_MAPS[currentMap];
        if (mapData.type === 'dungeon' && this.enemies.length === 0) {
            // Mark dungeon as cleared for quests
            this.activeQuests.forEach(questId => {
                const quest = QUESTS[questId];
                quest.objectives.forEach(obj => {
                    if (obj.type === 'clear_dungeon' && obj.target === currentMap) {
                        obj.current = 1;
                    }
                });
            });
            this.checkQuestCompletion();
        }
    }

    damagePlayer(amount) {
        if (this.invincibleTime > 0) return;

        this.playerData.health -= amount;

        // Screen flash red
        this.cameras.main.flash(200, 255, 0, 0, true);

        // Screen shake
        this.cameras.main.shake(100, 0.01);

        // Damage number
        this.showDamageNumber(this.player.x, this.player.y - 20, amount, 0xffff00);

        // Invincibility frames
        this.invincibleTime = 500;

        if (this.playerData.health <= 0) {
            this.playerDeath();
        }

        this.updateUI();
    }

    playerDeath() {
        gameState = 'gameover';
        this.showGameOver();
    }

    showGameOver() {
        const overlay = this.add.graphics().setScrollFactor(0).setDepth(300);
        overlay.fillStyle(0x000000, 0.8);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'YOU DIED', {
            fontSize: '48px',
            fill: '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'Press SPACE to restart', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    }

    showDamageNumber(x, y, amount, color) {
        const text = this.add.text(x, y, `-${amount}`, {
            fontSize: '16px',
            fill: Phaser.Display.Color.IntegerToColor(color).rgba,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: y - 30,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });
    }

    flashPlayer(color) {
        const flash = this.add.graphics();
        flash.x = this.player.x;
        flash.y = this.player.y;
        flash.fillStyle(color, 0.5);
        flash.fillRect(-15, -18, 30, 36);

        this.time.delayedCall(100, () => flash.destroy());
    }

    gainXP(amount) {
        this.playerData.xp += amount;

        while (this.playerData.xp >= this.playerData.xpToLevel) {
            this.playerData.xp -= this.playerData.xpToLevel;
            this.levelUp();
        }
    }

    levelUp() {
        this.playerData.level++;
        this.playerData.maxHealth += 10;
        this.playerData.health = this.playerData.maxHealth;
        this.playerData.maxMagicka += 5;
        this.playerData.magicka = this.playerData.maxMagicka;
        this.playerData.maxStamina += 5;
        this.playerData.stamina = this.playerData.maxStamina;
        this.playerData.xpToLevel = 100 * this.playerData.level;

        // Level up notification
        const text = this.add.text(GAME_WIDTH / 2, 100, `LEVEL UP! Level ${this.playerData.level}`, {
            fontSize: '24px',
            fill: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150);

        this.tweens.add({
            targets: text,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });

        this.updateUI();
    }

    gainSkillXP(skill, amount) {
        // Simplified skill progression
        if (this.playerData.skills[skill] < 10) {
            // Random chance to level up skill
            if (Math.random() < 0.1) {
                this.playerData.skills[skill]++;
            }
        }
    }

    checkKillObjective(enemyType) {
        this.activeQuests.forEach(questId => {
            const quest = QUESTS[questId];
            quest.objectives.forEach(obj => {
                if (obj.type === 'kill_enemy' && obj.target === enemyType) {
                    obj.current = Math.min(obj.current + 1, obj.required);
                }
            });
        });
        this.checkQuestCompletion();
    }

    checkQuestCompletion() {
        const completed = [];
        this.activeQuests.forEach(questId => {
            const quest = QUESTS[questId];
            const allDone = quest.objectives.every(obj => obj.current >= obj.required);
            if (allDone) {
                completed.push(questId);
            }
        });

        completed.forEach(questId => {
            this.completeQuest(questId);
        });
    }

    completeQuest(questId) {
        const quest = QUESTS[questId];

        // Grant rewards
        if (quest.rewards.gold) this.playerData.gold += quest.rewards.gold;
        if (quest.rewards.xp) this.gainXP(quest.rewards.xp);
        if (quest.rewards.items) {
            quest.rewards.items.forEach(item => this.playerData.inventory.push(item));
        }

        // Move to completed
        const idx = this.activeQuests.indexOf(questId);
        if (idx > -1) this.activeQuests.splice(idx, 1);
        this.completedQuests.push(questId);

        // Notification
        const text = this.add.text(GAME_WIDTH / 2, 150, `Quest Complete: ${quest.name}`, {
            fontSize: '20px',
            fill: '#44ff44',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150);

        this.tweens.add({
            targets: text,
            alpha: 0,
            duration: 3000,
            onComplete: () => text.destroy()
        });

        this.updateUI();
    }

    startQuest(questId) {
        if (this.activeQuests.includes(questId) || this.completedQuests.includes(questId)) return;

        // Reset objectives
        const quest = QUESTS[questId];
        quest.objectives.forEach(obj => obj.current = 0);

        this.activeQuests.push(questId);

        // Notification
        const text = this.add.text(GAME_WIDTH / 2, 150, `New Quest: ${quest.name}`, {
            fontSize: '20px',
            fill: '#ffff44',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(150);

        this.tweens.add({
            targets: text,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });

        this.updateUI();
    }

    openDialogue(dialogueId) {
        const dialogue = DIALOGUES[dialogueId];
        if (!dialogue) return;

        this.dialogueActive = true;
        this.currentDialogue = dialogue;

        // Draw dialogue box
        this.dialogueBox.clear();
        this.dialogueBox.fillStyle(COLORS.ui_bg, 0.95);
        this.dialogueBox.fillRect(50, GAME_HEIGHT - 220, GAME_WIDTH - 100, 200);
        this.dialogueBox.lineStyle(2, COLORS.ui_border);
        this.dialogueBox.strokeRect(50, GAME_HEIGHT - 220, GAME_WIDTH - 100, 200);

        // Update text
        this.dialogueSpeaker.setText(dialogue.speaker);
        this.dialogueSpeaker.setVisible(true);
        this.dialogueText.setText(dialogue.text);
        this.dialogueText.setVisible(true);

        // Clear old options
        this.dialogueOptions.forEach(opt => opt.destroy());
        this.dialogueOptions = [];

        // Create option buttons
        dialogue.options.forEach((opt, i) => {
            const y = GAME_HEIGHT - 120 + i * 25;
            const text = this.add.text(100, y, `${i + 1}. ${opt.text}`, {
                fontSize: '14px',
                fill: '#ffffff'
            }).setScrollFactor(0).setDepth(202).setInteractive();

            text.on('pointerover', () => text.setFill('#ffff00'));
            text.on('pointerout', () => text.setFill('#ffffff'));
            text.on('pointerdown', () => this.selectDialogueOption(opt));

            this.dialogueOptions.push(text);
        });
    }

    selectDialogueOption(option) {
        if (option.action === 'close') {
            this.closeDialogue();
        } else if (option.action === 'quest') {
            this.startQuest(option.questId);
            this.closeDialogue();
        } else if (option.action === 'shop') {
            this.closeDialogue();
            this.openShop(option.shopType);
        } else if (option.next) {
            this.openDialogue(option.next);
        }

        // Check talk_to objectives
        if (this.currentNPC) {
            this.activeQuests.forEach(questId => {
                const quest = QUESTS[questId];
                quest.objectives.forEach(obj => {
                    if (obj.type === 'talk_to' && obj.target === this.currentNPC.id) {
                        obj.current = 1;
                    }
                });
            });
            this.checkQuestCompletion();
        }
    }

    closeDialogue() {
        this.dialogueActive = false;
        this.currentDialogue = null;
        this.currentNPC = null;

        this.dialogueBox.clear();
        this.dialogueSpeaker.setVisible(false);
        this.dialogueText.setVisible(false);
        this.dialogueOptions.forEach(opt => opt.destroy());
        this.dialogueOptions = [];
    }

    openShop(shopType) {
        const shop = SHOPS[shopType];
        if (!shop) return;

        this.shopActive = true;

        // Draw shop box
        this.shopBox.clear();
        this.shopBox.fillStyle(COLORS.ui_bg, 0.95);
        this.shopBox.fillRect(100, 50, GAME_WIDTH - 200, GAME_HEIGHT - 100);
        this.shopBox.lineStyle(2, COLORS.ui_border);
        this.shopBox.strokeRect(100, 50, GAME_WIDTH - 200, GAME_HEIGHT - 100);

        // Title
        const title = this.add.text(GAME_WIDTH / 2, 70, shop.name, {
            fontSize: '24px',
            fill: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
        this.shopItems.push(title);

        // Gold display
        const goldText = this.add.text(GAME_WIDTH / 2, 100, `Your Gold: ${this.playerData.gold}`, {
            fontSize: '16px',
            fill: '#ffd700'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
        this.shopItems.push(goldText);

        // Items
        shop.items.forEach((itemId, i) => {
            const item = ITEMS[itemId];
            const y = 140 + i * 35;

            const itemText = this.add.text(150, y, `${item.name} - ${item.price} gold`, {
                fontSize: '14px',
                fill: '#ffffff'
            }).setScrollFactor(0).setDepth(201).setInteractive();

            itemText.on('pointerover', () => itemText.setFill('#ffff00'));
            itemText.on('pointerout', () => itemText.setFill('#ffffff'));
            itemText.on('pointerdown', () => this.buyItem(itemId));

            this.shopItems.push(itemText);
        });

        // Close button
        const closeBtn = this.add.text(GAME_WIDTH - 150, 70, '[X] Close', {
            fontSize: '16px',
            fill: '#ff4444'
        }).setScrollFactor(0).setDepth(201).setInteractive();

        closeBtn.on('pointerdown', () => this.closeShop());
        this.shopItems.push(closeBtn);
    }

    buyItem(itemId) {
        const item = ITEMS[itemId];
        if (this.playerData.gold >= item.price) {
            this.playerData.gold -= item.price;
            this.playerData.inventory.push(itemId);

            // Update gold display
            this.shopItems[1].setText(`Your Gold: ${this.playerData.gold}`);
            this.updateUI();
        }
    }

    closeShop() {
        this.shopActive = false;
        this.shopBox.clear();
        this.shopItems.forEach(item => item.destroy());
        this.shopItems = [];
    }

    openInventory() {
        this.inventoryOpen = true;

        // Draw inventory box
        this.inventoryBox.clear();
        this.inventoryBox.fillStyle(COLORS.ui_bg, 0.95);
        this.inventoryBox.fillRect(100, 50, GAME_WIDTH - 200, GAME_HEIGHT - 100);
        this.inventoryBox.lineStyle(2, COLORS.ui_border);
        this.inventoryBox.strokeRect(100, 50, GAME_WIDTH - 200, GAME_HEIGHT - 100);

        // Title
        const title = this.add.text(GAME_WIDTH / 2, 70, 'INVENTORY', {
            fontSize: '24px',
            fill: '#ffd700',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
        this.inventoryItems.push(title);

        // Stats
        const stats = this.add.text(150, 100,
            `Health: ${this.playerData.health}/${this.playerData.maxHealth}\n` +
            `Magicka: ${this.playerData.magicka}/${this.playerData.maxMagicka}\n` +
            `Stamina: ${this.playerData.stamina}/${this.playerData.maxStamina}\n` +
            `Level: ${this.playerData.level}\n` +
            `Combat: ${this.playerData.skills.combat} | Magic: ${this.playerData.skills.magic} | Stealth: ${this.playerData.skills.stealth}`,
            { fontSize: '12px', fill: '#ffffff' }
        ).setScrollFactor(0).setDepth(201);
        this.inventoryItems.push(stats);

        // Equipment
        const equipTitle = this.add.text(500, 100, 'Equipment:', {
            fontSize: '14px',
            fill: '#88aaff'
        }).setScrollFactor(0).setDepth(201);
        this.inventoryItems.push(equipTitle);

        const weapon = this.playerData.equipment.weapon ? ITEMS[this.playerData.equipment.weapon].name : 'None';
        const weaponText = this.add.text(500, 120, `Weapon: ${weapon}`, {
            fontSize: '12px',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(201);
        this.inventoryItems.push(weaponText);

        // Inventory items
        const invTitle = this.add.text(150, 200, 'Items:', {
            fontSize: '14px',
            fill: '#88aaff'
        }).setScrollFactor(0).setDepth(201);
        this.inventoryItems.push(invTitle);

        this.playerData.inventory.forEach((itemId, i) => {
            const item = ITEMS[itemId];
            const y = 220 + Math.floor(i / 3) * 25;
            const x = 150 + (i % 3) * 200;

            const itemText = this.add.text(x, y, item.name, {
                fontSize: '12px',
                fill: '#ffffff'
            }).setScrollFactor(0).setDepth(201).setInteractive();

            itemText.on('pointerover', () => itemText.setFill('#ffff00'));
            itemText.on('pointerout', () => itemText.setFill('#ffffff'));
            itemText.on('pointerdown', () => this.useItem(itemId, i));

            this.inventoryItems.push(itemText);
        });

        // Close button
        const closeBtn = this.add.text(GAME_WIDTH - 150, 70, '[TAB] Close', {
            fontSize: '16px',
            fill: '#ff4444'
        }).setScrollFactor(0).setDepth(201);
        this.inventoryItems.push(closeBtn);
    }

    useItem(itemId, index) {
        const item = ITEMS[itemId];

        if (item.type === 'consumable') {
            if (item.effect === 'heal') {
                this.playerData.health = Math.min(this.playerData.maxHealth, this.playerData.health + item.value);
            } else if (item.effect === 'magicka') {
                this.playerData.magicka = Math.min(this.playerData.maxMagicka, this.playerData.magicka + item.value);
            } else if (item.effect === 'stamina') {
                this.playerData.stamina = Math.min(this.playerData.maxStamina, this.playerData.stamina + item.value);
            }

            // Remove from inventory
            this.playerData.inventory.splice(index, 1);
            this.closeInventory();
            this.openInventory(); // Refresh
            this.updateUI();
        } else if (item.type === 'weapon') {
            this.playerData.equipment.weapon = itemId;
            this.closeInventory();
            this.openInventory(); // Refresh
        }
    }

    closeInventory() {
        this.inventoryOpen = false;
        this.inventoryBox.clear();
        this.inventoryItems.forEach(item => item.destroy());
        this.inventoryItems = [];
    }

    openChest(chest) {
        if (chest.opened) return;

        chest.opened = true;
        this.drawChest(chest);

        // Give loot
        chest.loot.forEach(itemId => {
            const item = ITEMS[itemId];
            if (item.type === 'gold') {
                this.playerData.gold += item.value;
            } else {
                this.playerData.inventory.push(itemId);

                // Check for quest items
                this.activeQuests.forEach(questId => {
                    const quest = QUESTS[questId];
                    quest.objectives.forEach(obj => {
                        if (obj.type === 'find_item' && obj.target === itemId) {
                            obj.current = 1;
                        }
                    });
                });
            }
        });

        this.checkQuestCompletion();
        this.updateUI();

        // Loot notification
        const text = this.add.text(chest.x, chest.y - 30, 'Loot!', {
            fontSize: '14px',
            fill: '#ffd700'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: chest.y - 60,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });
    }

    collectPickup(pickup) {
        const item = ITEMS[pickup.item];

        if (item.type === 'gold') {
            this.playerData.gold += item.value;
        } else {
            this.playerData.inventory.push(pickup.item);
        }

        pickup.sprite.destroy();
        const idx = this.pickups.indexOf(pickup);
        if (idx > -1) this.pickups.splice(idx, 1);

        this.updateUI();
    }

    update(time, delta) {
        if (gamePaused || gameState !== 'playing') return;

        // Update cooldowns
        if (this.attackCooldown > 0) this.attackCooldown -= delta;
        if (this.dodgeCooldown > 0) this.dodgeCooldown -= delta;
        if (this.invincibleTime > 0) this.invincibleTime -= delta;
        if (this.staminaRegenDelay > 0) this.staminaRegenDelay -= delta;

        // Stamina regeneration
        if (this.staminaRegenDelay <= 0 && !this.isSprinting) {
            this.playerData.stamina = Math.min(this.playerData.maxStamina, this.playerData.stamina + 10 * (delta / 1000));
        }

        // Magicka regeneration
        this.playerData.magicka = Math.min(this.playerData.maxMagicka, this.playerData.magicka + 5 * (delta / 1000));

        // Handle player movement
        if (!this.dialogueActive && !this.shopActive && !this.inventoryOpen) {
            this.handleMovement(delta);
            this.handleInteraction();
        }

        // Handle UI toggles
        if (Phaser.Input.Keyboard.JustDown(this.cursors.inventory)) {
            if (this.inventoryOpen) {
                this.closeInventory();
            } else if (!this.dialogueActive && !this.shopActive) {
                this.openInventory();
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.escape)) {
            if (this.dialogueActive) this.closeDialogue();
            if (this.shopActive) this.closeShop();
            if (this.inventoryOpen) this.closeInventory();
        }

        // Quick slots
        if (Phaser.Input.Keyboard.JustDown(this.cursors.slot1)) this.useQuickSlot(0);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.slot2)) this.useQuickSlot(1);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.slot3)) this.useQuickSlot(2);

        // Restart on death
        if (gameState === 'gameover' && Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            this.scene.restart();
            gameState = 'playing';
            gamePaused = true;
        }

        // Update enemies
        this.updateEnemies(delta);

        // Check map exits
        this.checkExits();

        // Draw navigation markers
        this.drawNavigationMarkers();

        // Update UI
        this.updateUI();
    }

    drawNavigationMarkers() {
        this.markerGraphics.clear();

        // Show markers for exits that are off-screen
        this.exits.forEach(exit => {
            const exitX = exit.x * TILE_SIZE;
            const exitY = exit.y * TILE_SIZE;

            // Calculate distance to exit
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, exitX, exitY);

            // If exit is far enough, show directional marker at edge of screen
            if (dist > 100) {
                const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, exitX, exitY);

                // Calculate marker position on screen edge
                const markerDist = 80;
                const markerX = GAME_WIDTH / 2 + Math.cos(angle) * markerDist;
                const markerY = GAME_HEIGHT / 2 + Math.sin(angle) * markerDist;

                // Draw arrow pointing to exit
                this.markerGraphics.fillStyle(0x44ff44, 0.7);
                this.markerGraphics.save();

                // Draw triangular arrow
                const arrowSize = 8;
                const x1 = markerX + Math.cos(angle) * arrowSize;
                const y1 = markerY + Math.sin(angle) * arrowSize;
                const x2 = markerX + Math.cos(angle + 2.5) * arrowSize;
                const y2 = markerY + Math.sin(angle + 2.5) * arrowSize;
                const x3 = markerX + Math.cos(angle - 2.5) * arrowSize;
                const y3 = markerY + Math.sin(angle - 2.5) * arrowSize;

                this.markerGraphics.fillTriangle(x1, y1, x2, y2, x3, y3);

                // Show target map name if close enough
                if (dist < 300) {
                    const targetName = WORLD_MAPS[exit.targetMap]?.name || exit.targetMap;
                    if (!this.exitLabels) this.exitLabels = {};
                    const labelKey = `${exit.targetMap}_${exit.x}_${exit.y}`;

                    if (!this.exitLabels[labelKey]) {
                        this.exitLabels[labelKey] = this.add.text(0, 0, targetName, {
                            fontSize: '10px',
                            fill: '#88ff88',
                            backgroundColor: '#00000088'
                        }).setOrigin(0.5).setScrollFactor(0).setDepth(91);
                    }
                    this.exitLabels[labelKey].setPosition(markerX, markerY - 15);
                    this.exitLabels[labelKey].setVisible(true);
                }
            }
        });

        // Hide labels for far exits
        if (this.exitLabels) {
            Object.entries(this.exitLabels).forEach(([key, label]) => {
                const parts = key.split('_');
                const x = parseInt(parts[parts.length - 2]) * TILE_SIZE;
                const y = parseInt(parts[parts.length - 1]) * TILE_SIZE;
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y);
                if (dist >= 300) {
                    label.setVisible(false);
                }
            });
        }

        // Show markers for nearby chests
        this.chests.forEach(chest => {
            if (chest.opened) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, chest.x, chest.y);
            if (dist > 60 && dist < 200) {
                const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, chest.x, chest.y);
                const markerX = GAME_WIDTH / 2 + Math.cos(angle) * 60;
                const markerY = GAME_HEIGHT / 2 + Math.sin(angle) * 60;

                this.markerGraphics.fillStyle(0xffd700, 0.5);
                this.markerGraphics.fillCircle(markerX, markerY, 5);
            }
        });
    }

    handleMovement(delta) {
        let dx = 0, dy = 0;

        if (this.cursors.up.isDown) dy = -1;
        if (this.cursors.down.isDown) dy = 1;
        if (this.cursors.left.isDown) dx = -1;
        if (this.cursors.right.isDown) dx = 1;

        // Update direction
        if (dx !== 0 || dy !== 0) {
            if (Math.abs(dx) > Math.abs(dy)) {
                this.playerData.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.playerData.direction = dy > 0 ? 'down' : 'up';
            }
        }

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        // Sprint
        this.isSprinting = this.cursors.shift.isDown && this.playerData.stamina > 0 && (dx !== 0 || dy !== 0);
        let speed = this.isSprinting ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;

        if (this.isSprinting) {
            this.playerData.stamina = Math.max(0, this.playerData.stamina - 5 * (delta / 1000));
            this.staminaRegenDelay = 1000;
        }

        // Move
        const moveX = dx * speed * (delta / 1000);
        const moveY = dy * speed * (delta / 1000);

        // Collision check with walls
        const newX = this.player.x + moveX;
        const newY = this.player.y + moveY;

        if (newX > 20 && newX < this.mapWidth - 20) {
            this.player.x = newX;
        }
        if (newY > 20 && newY < this.mapHeight - 20) {
            this.player.y = newY;
        }

        // Redraw player
        this.drawPlayer();
    }

    handleInteraction() {
        // Check for nearby NPCs
        let nearNPC = null;
        let nearChest = null;
        let nearPickup = null;

        this.npcs.forEach(npc => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
            if (dist < 50) nearNPC = npc;
        });

        this.chests.forEach(chest => {
            if (chest.opened) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, chest.x, chest.y);
            if (dist < 40) nearChest = chest;
        });

        this.pickups.forEach(pickup => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, pickup.x, pickup.y);
            if (dist < 30) nearPickup = pickup;
        });

        // Show interaction prompt
        if (nearNPC || nearChest) {
            this.interactPrompt.setVisible(true);
            this.interactPrompt.setText(nearNPC ? `[E] Talk to ${nearNPC.name}` : '[E] Open Chest');
        } else {
            this.interactPrompt.setVisible(false);
        }

        // Auto-collect pickups
        if (nearPickup) {
            this.collectPickup(nearPickup);
        }

        // E to interact
        if (Phaser.Input.Keyboard.JustDown(this.cursors.interact)) {
            if (nearNPC) {
                this.currentNPC = nearNPC;
                this.openDialogue(nearNPC.dialogue);
            } else if (nearChest) {
                this.openChest(nearChest);
            }
        }
    }

    useQuickSlot(slot) {
        // Find consumable items
        const consumables = this.playerData.inventory.filter(id => ITEMS[id].type === 'consumable');
        if (consumables[slot]) {
            const idx = this.playerData.inventory.indexOf(consumables[slot]);
            this.useItem(consumables[slot], idx);
        }
    }

    updateEnemies(delta) {
        this.enemies.forEach(enemy => {
            // Update attack cooldown
            if (enemy.attackCooldown > 0) enemy.attackCooldown -= delta;

            // Handle knockback
            if (enemy.knockbackTime > 0) {
                enemy.knockbackTime -= delta;
                enemy.x += enemy.knockbackVx * (delta / 1000);
                enemy.y += enemy.knockbackVy * (delta / 1000);
                // Friction
                enemy.knockbackVx *= 0.85;
                enemy.knockbackVy *= 0.85;
                // Keep in map bounds
                enemy.x = Math.max(30, Math.min(this.mapWidth - 30, enemy.x));
                enemy.y = Math.max(30, Math.min(this.mapHeight - 30, enemy.y));
                this.drawEnemy(enemy);
                return;
            }

            // Skip AI while staggered
            if (enemy.isStaggered) {
                this.drawEnemy(enemy);
                return;
            }

            const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            switch (enemy.state) {
                case 'idle':
                    // Patrol around spawn point
                    if (distToPlayer < ENEMY_DETECT_RANGE) {
                        enemy.state = 'chase';
                        enemy.lastKnownPlayerPos = { x: this.player.x, y: this.player.y };
                    } else {
                        // Small random movement
                        if (Math.random() < 0.01) {
                            enemy.x += (Math.random() - 0.5) * 20;
                            enemy.y += (Math.random() - 0.5) * 20;
                        }
                    }
                    break;

                case 'chase':
                    enemy.lastKnownPlayerPos = { x: this.player.x, y: this.player.y };

                    if (distToPlayer < ENEMY_ATTACK_RANGE) {
                        enemy.state = 'attack';
                    } else if (distToPlayer > ENEMY_CHASE_RANGE) {
                        enemy.state = 'return';
                    } else {
                        // Move towards player
                        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                        enemy.x += Math.cos(angle) * enemy.speed * (delta / 1000);
                        enemy.y += Math.sin(angle) * enemy.speed * (delta / 1000);
                    }
                    break;

                case 'attack':
                    if (enemy.attackCooldown <= 0) {
                        // Attack player
                        if (distToPlayer < ENEMY_ATTACK_RANGE + 10) {
                            this.damagePlayer(enemy.damage);
                            enemy.attackCooldown = 1000;
                        }
                    }

                    if (distToPlayer > ENEMY_ATTACK_RANGE + 20) {
                        enemy.state = 'chase';
                    }
                    break;

                case 'return':
                    // Return to patrol point
                    const distToHome = Phaser.Math.Distance.Between(enemy.x, enemy.y, enemy.patrolPoint.x, enemy.patrolPoint.y);

                    if (distToHome < 20) {
                        enemy.state = 'idle';
                    } else {
                        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, enemy.patrolPoint.x, enemy.patrolPoint.y);
                        enemy.x += Math.cos(angle) * enemy.speed * 0.5 * (delta / 1000);
                        enemy.y += Math.sin(angle) * enemy.speed * 0.5 * (delta / 1000);
                    }

                    // Re-detect player
                    if (distToPlayer < ENEMY_DETECT_RANGE) {
                        enemy.state = 'chase';
                    }
                    break;
            }

            // Update enemy sprite position
            this.drawEnemy(enemy);
        });
    }

    checkExits() {
        this.exits.forEach(exit => {
            const exitX = exit.x * TILE_SIZE;
            const exitY = exit.y * TILE_SIZE;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, exitX, exitY);

            if (dist < 30) {
                // Transition to new map
                this.player.x = exit.targetX * TILE_SIZE;
                this.player.y = exit.targetY * TILE_SIZE;
                this.loadMap(exit.targetMap);
            }
        });
    }

    // Harness Implementation
    initHarness() {
        const scene = this;

        window.harness = {
            pause: () => {
                gamePaused = true;
            },

            resume: () => {
                gamePaused = false;
            },

            isPaused: () => gamePaused,

            execute: (action, durationMs) => {
                return new Promise((resolve) => {
                    // Apply inputs
                    if (action.keys) {
                        action.keys.forEach(key => {
                            const keyCode = scene.getKeyCode(key);
                            if (keyCode && scene.cursors[keyCode]) {
                                scene.cursors[keyCode].isDown = true;
                            }
                        });
                    }

                    if (action.click) {
                        scene.input.activePointer.x = action.click.x;
                        scene.input.activePointer.y = action.click.y;
                        scene.input.activePointer.worldX = action.click.x;
                        scene.input.activePointer.worldY = action.click.y;
                        scene.playerAttack();
                    }

                    // Resume game
                    gamePaused = false;

                    // After duration, pause and release inputs
                    setTimeout(() => {
                        if (action.keys) {
                            action.keys.forEach(key => {
                                const keyCode = scene.getKeyCode(key);
                                if (keyCode && scene.cursors[keyCode]) {
                                    scene.cursors[keyCode].isDown = false;
                                }
                            });
                        }
                        gamePaused = true;
                        resolve();
                    }, durationMs);
                });
            },

            getState: () => {
                return {
                    gameState: gameState,
                    currentMap: currentMap,
                    mapInfo: WORLD_MAPS[currentMap],
                    player: {
                        x: scene.player ? scene.player.x : 0,
                        y: scene.player ? scene.player.y : 0,
                        health: scene.playerData.health,
                        maxHealth: scene.playerData.maxHealth,
                        magicka: scene.playerData.magicka,
                        maxMagicka: scene.playerData.maxMagicka,
                        stamina: scene.playerData.stamina,
                        maxStamina: scene.playerData.maxStamina,
                        level: scene.playerData.level,
                        gold: scene.playerData.gold,
                        xp: scene.playerData.xp,
                        direction: scene.playerData.direction,
                        skills: scene.playerData.skills,
                        equipment: scene.playerData.equipment,
                        inventory: scene.playerData.inventory
                    },
                    enemies: scene.enemies.map(e => ({
                        type: e.type,
                        x: e.x,
                        y: e.y,
                        health: e.health,
                        maxHealth: e.maxHealth,
                        state: e.state,
                        isStaggered: e.isStaggered || false,
                        knockbackTime: e.knockbackTime || 0
                    })),
                    npcs: scene.npcs.map(n => ({
                        id: n.id,
                        name: n.name,
                        type: n.type,
                        x: n.x,
                        y: n.y
                    })),
                    chests: scene.chests.map(c => ({
                        x: c.x,
                        y: c.y,
                        opened: c.opened
                    })),
                    pickups: scene.pickups.map(p => ({
                        x: p.x,
                        y: p.y,
                        item: p.item
                    })),
                    exits: scene.exits,
                    quests: {
                        active: scene.activeQuests,
                        completed: scene.completedQuests
                    },
                    ui: {
                        dialogueActive: scene.dialogueActive,
                        shopActive: scene.shopActive,
                        inventoryOpen: scene.inventoryOpen
                    }
                };
            },

            getPhase: () => {
                if (scene.dialogueActive) return 'dialogue';
                if (scene.shopActive) return 'shop';
                if (scene.inventoryOpen) return 'inventory';
                return gameState;
            },

            debug: {
                setHealth: (hp) => {
                    scene.playerData.health = hp;
                    scene.updateUI();
                },
                setPosition: (x, y) => {
                    if (scene.player) {
                        scene.player.x = x;
                        scene.player.y = y;
                    }
                },
                setGodMode: (enabled) => {
                    scene.godMode = enabled;
                },
                skipToLevel: (mapId) => {
                    scene.loadMap(mapId);
                },
                spawnEnemy: (type, x, y) => {
                    scene.spawnEnemy(type, x, y);
                },
                clearEnemies: () => {
                    scene.enemies.forEach(e => e.sprite.destroy());
                    scene.enemies = [];
                },
                giveItem: (itemId) => {
                    scene.playerData.inventory.push(itemId);
                },
                giveGold: (amount) => {
                    scene.playerData.gold += amount;
                    scene.updateUI();
                },
                startQuest: (questId) => {
                    scene.startQuest(questId);
                },
                forceStart: () => {
                    gameState = 'playing';
                    gamePaused = false;
                },
                forceGameOver: () => {
                    scene.playerDeath();
                },
                log: (msg) => {
                    console.log('[HARNESS]', msg);
                }
            },

            version: '1.0',

            gameInfo: {
                name: 'Frostfall: A 2D Skyrim Demake',
                type: 'action_rpg',
                controls: {
                    movement: ['w', 'a', 's', 'd'],
                    sprint: ['Shift'],
                    attack: ['click'],
                    interact: ['e'],
                    inventory: ['Tab'],
                    quickSlots: ['1', '2', '3'],
                    actions: {
                        dodge: 'Shift',
                        interact: 'e',
                        inventory: 'Tab'
                    }
                }
            }
        };

        console.log('[HARNESS] Frostfall harness initialized, game paused');
    }

    getKeyCode(key) {
        const keyMap = {
            'w': 'up',
            'W': 'up',
            's': 'down',
            'S': 'down',
            'a': 'left',
            'A': 'left',
            'd': 'right',
            'D': 'right',
            'Shift': 'shift',
            'shift': 'shift',
            'e': 'interact',
            'E': 'interact',
            'Tab': 'inventory',
            'tab': 'inventory',
            '1': 'slot1',
            '2': 'slot2',
            '3': 'slot3',
            'Space': 'space',
            ' ': 'space',
            'Escape': 'escape',
            'Esc': 'escape'
        };
        return keyMap[key];
    }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        gameState = 'menu';

        // Background
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);

        // Title
        this.add.text(GAME_WIDTH / 2, 100, 'FROSTFALL', {
            fontSize: '64px',
            fill: '#88aaff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 160, 'A 2D Skyrim Demake', {
            fontSize: '24px',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        // Start button
        const startBtn = this.add.text(GAME_WIDTH / 2, 300, '[ START GAME ]', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setFill('#ffff00'));
        startBtn.on('pointerout', () => startBtn.setFill('#ffffff'));
        startBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Instructions
        this.add.text(GAME_WIDTH / 2, 420, 'WASD - Move | Left Click - Attack | E - Interact | Tab - Inventory', {
            fontSize: '14px',
            fill: '#888888'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 450, 'Shift - Sprint | 1/2/3 - Quick Slots', {
            fontSize: '14px',
            fill: '#888888'
        }).setOrigin(0.5);

        // Space to start
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });

        // Initialize harness for menu
        this.initMenuHarness();
    }

    initMenuHarness() {
        const scene = this;

        window.harness = {
            pause: () => { gamePaused = true; },
            resume: () => { gamePaused = false; },
            isPaused: () => gamePaused,
            execute: (action, durationMs) => {
                return new Promise((resolve) => {
                    if (action.keys && (action.keys.includes('Space') || action.keys.includes(' '))) {
                        scene.scene.start('GameScene');
                    }
                    setTimeout(resolve, durationMs);
                });
            },
            getState: () => ({ gameState: 'menu' }),
            getPhase: () => 'menu',
            debug: {
                forceStart: () => {
                    scene.scene.start('GameScene');
                },
                log: (msg) => console.log('[HARNESS]', msg)
            },
            version: '1.0',
            gameInfo: {
                name: 'Frostfall: A 2D Skyrim Demake',
                type: 'action_rpg'
            }
        };
    }
}

// Phaser Configuration
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [MenuScene, GameScene],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

// Initialize Game
const game = new Phaser.Game(config);
