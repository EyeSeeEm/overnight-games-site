// Curious Expedition Clone - Phaser 3

// Color Palette
const PALETTE = {
    // Terrain
    grassland: '#7CB342',
    jungle: '#2E7D32',
    desert: '#D4A559',
    snow: '#E8EAF6',
    water: '#1565C0',
    mountain: '#5D4037',
    swamp: '#4E342E',

    // UI
    parchment: '#F5E6D3',
    inkBrown: '#3E2723',
    goldAccent: '#FFD700',
    dangerRed: '#C62828',
    sanityBlue: '#1976D2',

    // Status
    healthRed: '#E53935',
    loyaltyPink: '#EC407A',
    standingGold: '#FBC02D'
};

// Map Configuration
const MAP_CONFIG = {
    width: 16,
    height: 12,
    hexSize: 32,
    hexWidth: 56,
    hexHeight: 48
};

// Terrain Types
const TERRAIN = {
    grassland: { cost: 1, passable: true, color: '#7CB342' },
    lightJungle: { cost: 2, passable: true, color: '#43A047' },
    thickJungle: { cost: 8, passable: true, color: '#1B5E20' },
    desert: { cost: 10, passable: true, color: '#D4A559' },
    drylands: { cost: 1, passable: true, color: '#C8B88A' },
    hills: { cost: 15, passable: true, color: '#6D4C41' },
    swamp: { cost: 10, passable: true, color: '#4E342E' },
    frozenPlain: { cost: 2, passable: true, color: '#E3F2FD' },
    deepSnow: { cost: 10, passable: true, color: '#CFD8DC' },
    mountain: { cost: 0, passable: false, color: '#5D4037' },
    deepWater: { cost: 0, passable: false, color: '#1565C0' },
    beach: { cost: 1, passable: true, color: '#F5DEB3' },
    // Hazardous terrain
    fire: { cost: 10, passable: true, color: '#FF5722', hazard: 'fire', deathChance: 0.15 },
    fumarole: { cost: 0, passable: true, color: '#9E9E9E', hazard: 'gas', healthDrain: 2 },
    mosquito: { cost: 0, passable: true, color: '#8BC34A', hazard: 'disease', diseaseChance: 0.3 },
    lavaField: { cost: 0, passable: true, color: '#FF3D00', hazard: 'lava', deathChance: 0.25 },
    poisonSwamp: { cost: 8, passable: true, color: '#558B2F', hazard: 'poison', poisonChance: 0.4 },
    // Locations
    oasis: { cost: 0, passable: true, color: '#4FC3F7', location: true },
    cave: { cost: 0, passable: true, color: '#37474F', location: true },
    stoneCircle: { cost: 0, passable: true, color: '#78909C', location: true },
    altar: { cost: 0, passable: true, color: '#9C27B0', location: true },
    tradingPost: { cost: 0, passable: true, color: '#FF8A65', location: true },
    village: { cost: 0, passable: true, color: '#8D6E63', location: true },
    shrine: { cost: 0, passable: true, color: '#7E57C2', location: true },
    pyramid: { cost: 0, passable: true, color: '#FFD700', location: true },
    healingSpring: { cost: 0, passable: true, color: '#00BCD4', location: true },
    ruins: { cost: 0, passable: true, color: '#795548', location: true }
};

// Weather types
const WEATHER = {
    clear: { name: 'Clear', sanityCostMod: 1.0, encounterMod: 1.0, visibilityMod: 1.0 },
    cloudy: { name: 'Cloudy', sanityCostMod: 1.0, encounterMod: 0.8, visibilityMod: 1.0 },
    rain: { name: 'Rain', sanityCostMod: 1.3, encounterMod: 0.5, visibilityMod: 0.8 },
    storm: { name: 'Storm', sanityCostMod: 1.5, encounterMod: 0.3, visibilityMod: 0.5 },
    fog: { name: 'Fog', sanityCostMod: 1.1, encounterMod: 0.6, visibilityMod: 0.4 },
    heatwave: { name: 'Heat Wave', sanityCostMod: 1.4, encounterMod: 1.2, visibilityMod: 1.0 },
    blizzard: { name: 'Blizzard', sanityCostMod: 2.0, encounterMod: 0.2, visibilityMod: 0.3 }
};

// Zero sanity events
const INSANITY_EVENTS = [
    { type: 'cannibalism', chance: 0.25, effect: 'kill_companion_heal', message: 'Madness takes hold... a companion is consumed!' },
    { type: 'madness', chance: 0.2, effect: 'companion_attacks', message: 'A companion goes mad and attacks!' },
    { type: 'desertion', chance: 0.25, effect: 'companion_leaves', message: 'A companion flees into the wilderness!' },
    { type: 'collapse', chance: 0.15, effect: 'immobilize', message: 'The party collapses from exhaustion!' },
    { type: 'hallucination', chance: 0.15, effect: 'false_markers', message: 'Strange visions plague the party...' }
];

// Achievements
const ACHIEVEMENTS = {
    firstPyramid: { name: 'Pyramid Hunter', desc: 'Find your first Golden Pyramid', fame: 50 },
    fiveExpeditions: { name: 'Seasoned Explorer', desc: 'Complete 5 expeditions', fame: 100 },
    tenKills: { name: 'Beast Slayer', desc: 'Defeat 10 creatures', fame: 25 },
    noDeaths: { name: 'Safe Journey', desc: 'Complete expedition without companion deaths', fame: 75 },
    speedRun: { name: 'Swift Explorer', desc: 'Find pyramid in under 15 days', fame: 50 },
    treasureHunter: { name: 'Treasure Hunter', desc: 'Find 10 artifacts', fame: 100 },
    fullParty: { name: 'Fellowship', desc: 'Have 4 companions at once', fame: 25 }
};

// Location types with effects
const LOCATIONS = {
    village: {
        name: 'Native Village',
        sanity: 30,
        canTrade: true,
        canRest: true,
        standingCost: 1
    },
    shrine: {
        name: 'Ancient Shrine',
        fame: 20,
        canPray: true,
        artifact: true
    },
    cave: {
        name: 'Dark Cave',
        loot: true,
        danger: 0.3
    },
    oasis: {
        name: 'Desert Oasis',
        sanity: 20,
        water: true
    },
    stoneCircle: {
        name: 'Stone Circle',
        fame: 15,
        magic: true
    },
    altar: {
        name: 'Sacrificial Altar',
        fame: 25,
        sacrifice: true,
        danger: 0.4
    },
    tradingPost: {
        name: 'Trading Post',
        canTrade: true,
        discount: true
    },
    pyramid: {
        name: 'Golden Pyramid',
        fame: 100,
        sanity: 30,
        victory: true
    }
};

// Trading goods
const TRADE_GOODS = {
    whiteTigerPelt: { name: 'White Tiger Pelt', value: 15, fame: 5 },
    elephantTusk: { name: 'Elephant Tusk', value: 20, fame: 8 },
    dinosaurBone: { name: 'Dinosaur Bone', value: 30, fame: 15 },
    goldenIdol: { name: 'Golden Idol', value: 50, fame: 25 },
    ancientMap: { name: 'Ancient Map', value: 10, reveal: 5 },
    healingHerb: { name: 'Healing Herb', value: 5, heal: 5 },
    nativeArtifact: { name: 'Native Artifact', value: 25, fame: 10 }
};

// Random events
const EVENTS = {
    positive: [
        { name: 'Beautiful Vista', effect: 'sanity', value: 5, message: 'The stunning view lifts your spirits!' },
        { name: 'Lucky Find', effect: 'item', message: 'You discover something valuable!' },
        { name: 'Friendly Natives', effect: 'standing', value: 1, message: 'The locals welcome you warmly!' }
    ],
    neutral: [
        { name: 'Strange Markings', effect: 'fame', value: 5, message: 'You document curious rock carvings.' },
        { name: 'Animal Tracks', effect: 'warning', message: 'Fresh tracks indicate predators nearby.' },
        { name: 'Old Campsite', effect: 'info', message: 'Someone camped here recently.' }
    ],
    negative: [
        { name: 'Bad Weather', effect: 'sanity', value: -10, message: 'A sudden storm batters the party!' },
        { name: 'Poisonous Plant', effect: 'damage', value: 2, message: 'Someone touched a toxic plant!' },
        { name: 'Theft', effect: 'item_loss', message: 'Something went missing from your pack!' }
    ]
};

// Biome configurations
const BIOMES = {
    jungle: {
        name: 'Jungle',
        terrainWeights: {
            grassland: 15, lightJungle: 25, thickJungle: 20,
            swamp: 10, mosquito: 8, hills: 10, mountain: 5, poisonSwamp: 7
        },
        enemies: ['tiger', 'gorilla', 'giantSpider', 'crocodile', 'raptor'],
        weather: ['clear', 'rain', 'storm', 'fog']
    },
    desert: {
        name: 'Desert',
        terrainWeights: {
            desert: 45, drylands: 25, hills: 15, mountain: 5, fire: 5, fumarole: 5
        },
        enemies: ['giantScorpion', 'hyena', 'mummy'],
        weather: ['clear', 'heatwave', 'storm']
    },
    arctic: {
        name: 'Arctic',
        terrainWeights: {
            frozenPlain: 30, deepSnow: 25, hills: 15,
            mountain: 10, deepWater: 10, fire: 5, fumarole: 5
        },
        enemies: ['arcticWolf', 'polarBear', 'yeti'],
        weather: ['clear', 'fog', 'blizzard', 'storm']
    },
    prehistoric: {
        name: 'Prehistoric',
        terrainWeights: {
            lightJungle: 20, thickJungle: 20, swamp: 15,
            lavaField: 8, fumarole: 10, hills: 12, mountain: 8, poisonSwamp: 7
        },
        enemies: ['raptor', 'tiger', 'elephant', 'giantSpider'],
        weather: ['clear', 'rain', 'fog', 'heatwave']
    },
    volcanic: {
        name: 'Volcanic',
        terrainWeights: {
            hills: 25, lavaField: 20, fumarole: 20, fire: 15,
            mountain: 10, drylands: 10
        },
        enemies: ['giantScorpion', 'mummy', 'hyena'],
        weather: ['clear', 'heatwave', 'fog']
    }
};

// Enemy definitions
const ENEMIES = {
    tiger: { name: 'Tiger', health: 14, damage: 4, shield: 0, color: '#FF9800', effect: 'bleeding' },
    gorilla: { name: 'Gorilla', health: 18, damage: 6, shield: 1, color: '#5D4037' },
    giantSpider: { name: 'Giant Spider', health: 10, damage: 3, shield: 0, color: '#212121', effect: 'poison' },
    giantScorpion: { name: 'Scorpion', health: 12, damage: 4, shield: 2, color: '#BF360C', effect: 'poison' },
    hyena: { name: 'Hyena', health: 8, damage: 3, shield: 0, color: '#795548', pack: true },
    arcticWolf: { name: 'Arctic Wolf', health: 10, damage: 3, shield: 0, color: '#ECEFF1', pack: true },
    polarBear: { name: 'Polar Bear', health: 24, damage: 7, shield: 1, color: '#FAFAFA' },
    crocodile: { name: 'Crocodile', health: 12, damage: 5, shield: 1, color: '#558B2F', effect: 'bleeding' },
    raptor: { name: 'Raptor', health: 16, damage: 5, shield: 0, color: '#43A047', effect: 'bleeding' },
    elephant: { name: 'Elephant', health: 30, damage: 8, shield: 2, color: '#757575' },
    yeti: { name: 'Yeti', health: 28, damage: 8, shield: 1, color: '#E0E0E0' },
    mummy: { name: 'Mummy', health: 25, damage: 6, shield: 2, color: '#BDB76B', effect: 'curse' },
    angryNatives: { name: 'Angry Natives', health: 8, damage: 3, shield: 1, color: '#8D6E63', group: true }
};

// Status effects
const STATUS_EFFECTS = {
    bleeding: {
        name: 'Bleeding',
        damage: 2,
        duration: 2,
        color: '#C62828'
    },
    poison: {
        name: 'Poison',
        damage: 1,
        duration: 5,
        color: '#7CB342'
    },
    curse: {
        name: 'Cursed',
        dicePenalty: 1,
        duration: 3,
        color: '#7B1FA2'
    },
    stun: {
        name: 'Stunned',
        skipTurn: true,
        duration: 1,
        color: '#FFA000'
    },
    burning: {
        name: 'Burning',
        damage: 3,
        duration: 2,
        color: '#FF5722'
    }
};

// Explorer types
const EXPLORERS = {
    darwin: { name: 'Charles Darwin', perk: 'naturalist', sanityCost: -1, dice: ['green', 'blue'] },
    earhart: { name: 'Amelia Earhart', perk: 'navigator', sanityCost: -1, dice: ['red', 'blue'] },
    tesla: { name: 'Nikola Tesla', perk: 'inventor', sanityCost: 0, dice: ['blue', 'purple'] },
    curie: { name: 'Marie Curie', perk: 'scientist', sanityCost: 0, dice: ['purple', 'green'] }
};

// Companion types
const COMPANIONS = {
    scout: { name: 'Scout', health: 8, dice: ['red'], perk: 'scouting' },
    soldier: { name: 'Soldier', health: 12, dice: ['red', 'red'], perk: 'combat' },
    cook: { name: 'Cook', health: 6, dice: ['green'], perk: 'cooking' },
    translator: { name: 'Translator', health: 6, dice: ['blue'], perk: 'diplomacy' },
    shaman: { name: 'Shaman', health: 8, dice: ['purple'], perk: 'magic' },
    donkey: { name: 'Pack Donkey', health: 10, dice: [], perk: 'carrying', slots: 4 }
};

// Items
const ITEMS = {
    chocolate: { name: 'Chocolate', sanity: 10, stack: 10 },
    whisky: { name: 'Whisky', sanity: 20, stack: 5 },
    foodCans: { name: 'Food Cans', sanity: 10, stack: 10 },
    rope: { name: 'Rope', swampBonus: 3 },
    machete: { name: 'Machete', jungleBonus: 3 },
    compass: { name: 'Compass', revealRadius: 2 },
    pistol: { name: 'Pistol', damage: 6 },
    rifle: { name: 'Rifle', damage: 8 },
    torch: { name: 'Torch', lightRadius: 3 }
};

// Dice faces
const DICE_FACES = {
    red: ['attack', 'attack', 'attack', 'strength', 'agility', 'blank'],
    green: ['defense', 'defense', 'defense', 'strength', 'agility', 'blank'],
    blue: ['precision', 'precision', 'tactics', 'tactics', 'agility', 'blank'],
    purple: ['magic', 'magic', 'precision', 'tactics', 'agility', 'blank']
};

// Combat actions
const COMBAT_ACTIONS = {
    // Basic attacks
    attack: { dice: ['attack'], damage: 1, name: 'Attack' },
    doubleAttack: { dice: ['attack', 'attack'], damage: 2, name: 'Double Attack' },
    tripleAttack: { dice: ['attack', 'attack', 'attack'], damage: 3, name: 'Triple Attack' },

    // Defense
    defend: { dice: ['defense'], shield: 1, name: 'Defend' },
    strongDefense: { dice: ['defense', 'defense'], shield: 2, name: 'Strong Defense' },
    evade: { dice: ['agility', 'defense'], shield: 3, name: 'Evade' },

    // Weapon combos
    headshot: { dice: ['strength', 'strength'], damage: 6, requires: 'pistol', name: 'Headshot' },
    plannedShot: { dice: ['precision', 'tactics'], damage: 8, requires: 'rifle', name: 'Planned Shot' },
    masterfulShot: { dice: ['precision', 'precision'], damage: 12, requires: 'rifle', name: 'Masterful Shot' },
    shotgunBlast: { dice: ['strength', 'attack'], damage: 4, requires: 'shotgun', multiTarget: true, name: 'Shotgun Blast' },

    // Magic
    healing: { dice: ['magic', 'tactics'], heal: 3, name: 'Healing Rite' },
    curse: { dice: ['magic', 'magic'], damage: 4, effect: 'stun', name: 'Curse' },
    spiritStrike: { dice: ['magic', 'attack'], damage: 5, name: 'Spirit Strike' },

    // Combos
    powerStrike: { dice: ['strength', 'attack'], damage: 4, name: 'Power Strike' },
    preciseStrike: { dice: ['precision', 'attack'], damage: 3, name: 'Precise Strike' },
    counterStance: { dice: ['defense', 'agility'], shield: 2, counter: 2, name: 'Counter Stance' },

    // Animal attacks (for companion animals)
    claws: { dice: ['attack'], damage: 2, name: 'Claws' },
    fangs: { dice: ['attack'], damage: 2, effect: 'bleeding', name: 'Fangs' }
};

// Game state
let gameState = {
    expedition: 1,
    fame: 0,
    sanity: 100,
    maxSanity: 100,
    days: 0,
    standing: 3,
    maxStanding: 5,
    explorer: null,
    companions: [],
    inventory: [],
    inventorySlots: 6,
    currentBiome: 'jungle',
    pyramidFound: false,
    visitedLocations: new Set(),
    // New tracking
    funds: 50,
    artifacts: [],
    statusEffects: [],
    killCount: 0,
    distanceTraveled: 0,
    locationsDiscovered: 0,
    rivalPosition: 0,
    raceProgress: 0,
    totalDays: 0,
    // Weather system
    weather: 'clear',
    weatherDuration: 5,
    // Achievement tracking
    achievements: new Set(),
    companionDeaths: 0,
    artifactsFound: 0,
    expeditionsCompleted: 0,
    // Insanity tracking
    insanityCooldown: 0,
    immobilizedTurns: 0,
    // Trading
    tradeGoods: [],
    // Difficulty
    difficulty: 'normal' // easy, normal, hard
};

// Helper functions for new systems
function getWeatherForBiome(biome) {
    const biomeData = BIOMES[biome];
    if (!biomeData || !biomeData.weather) return 'clear';
    return biomeData.weather[Math.floor(Math.random() * biomeData.weather.length)];
}

function applyHazardEffect(terrain, scene) {
    if (!terrain.hazard) return;

    switch (terrain.hazard) {
        case 'fire':
            if (Math.random() < terrain.deathChance) {
                if (gameState.companions.length > 0) {
                    const victim = gameState.companions[Math.floor(Math.random() * gameState.companions.length)];
                    victim.health = 0;
                    scene.showMessage(`${victim.name} burned to death!`, '#FF5722');
                    gameState.companionDeaths++;
                }
            } else {
                gameState.companions.forEach(c => c.health = Math.max(1, c.health - 2));
                scene.showMessage('The flames sear the party!', '#FF5722');
            }
            break;
        case 'gas':
            gameState.companions.forEach(c => c.health = Math.max(1, c.health - terrain.healthDrain));
            scene.showMessage('Toxic fumes choke the party!', '#9E9E9E');
            break;
        case 'disease':
            if (Math.random() < terrain.diseaseChance) {
                gameState.statusEffects.push({ type: 'disease', duration: 10, damage: 1 });
                scene.showMessage('The mosquitoes spread disease!', '#8BC34A');
            }
            break;
        case 'lava':
            if (Math.random() < terrain.deathChance) {
                if (gameState.companions.length > 0) {
                    const victim = gameState.companions[Math.floor(Math.random() * gameState.companions.length)];
                    victim.health = 0;
                    scene.showMessage(`${victim.name} fell into the lava!`, '#FF3D00');
                    gameState.companionDeaths++;
                }
            }
            break;
        case 'poison':
            if (Math.random() < terrain.poisonChance) {
                gameState.statusEffects.push({ type: 'poison', duration: 5, damage: 2 });
                scene.showMessage('Poisonous vapors seep from the swamp!', '#558B2F');
            }
            break;
    }
}

function applyStatusEffects(scene) {
    let totalDamage = 0;
    gameState.statusEffects = gameState.statusEffects.filter(effect => {
        totalDamage += effect.damage || 0;
        effect.duration--;
        return effect.duration > 0;
    });

    if (totalDamage > 0 && gameState.companions.length > 0) {
        gameState.companions[0].health -= totalDamage;
        scene.showMessage(`Status effects deal ${totalDamage} damage!`, '#C62828');
    }
}

function triggerInsanityEvent(scene) {
    if (gameState.insanityCooldown > 0) return;
    if (gameState.sanity > 0) return;
    if (Math.random() > 0.2) return;

    // Select random insanity event
    const totalChance = INSANITY_EVENTS.reduce((sum, e) => sum + e.chance, 0);
    let roll = Math.random() * totalChance;
    let selectedEvent = INSANITY_EVENTS[0];

    for (const event of INSANITY_EVENTS) {
        roll -= event.chance;
        if (roll <= 0) {
            selectedEvent = event;
            break;
        }
    }

    scene.showMessage(selectedEvent.message, '#C62828');

    switch (selectedEvent.effect) {
        case 'kill_companion_heal':
            if (gameState.companions.length > 0) {
                const victim = gameState.companions.splice(Math.floor(Math.random() * gameState.companions.length), 1)[0];
                gameState.sanity = Math.min(gameState.maxSanity, gameState.sanity + 40);
                gameState.companionDeaths++;
            }
            break;
        case 'companion_attacks':
            if (gameState.companions.length > 1) {
                const attacker = gameState.companions[Math.floor(Math.random() * gameState.companions.length)];
                const target = gameState.companions.find(c => c !== attacker);
                if (target) target.health = Math.max(0, target.health - 5);
            }
            break;
        case 'companion_leaves':
            if (gameState.companions.length > 0) {
                const deserter = gameState.companions.splice(Math.floor(Math.random() * gameState.companions.length), 1)[0];
                // Take random item
                if (gameState.inventory.length > 0) {
                    gameState.inventory.splice(Math.floor(Math.random() * gameState.inventory.length), 1);
                }
            }
            break;
        case 'immobilize':
            gameState.immobilizedTurns = 3;
            break;
        case 'false_markers':
            // Handled in map display
            break;
    }

    gameState.insanityCooldown = 7;
}

function updateRivalPosition() {
    // Rival moves 0-2 hexes per turn
    gameState.rivalPosition += Math.floor(Math.random() * 3);
    // Rival reaches pyramid at around 40 progress
    return gameState.rivalPosition >= 40;
}

function checkAchievements(scene) {
    const newAchievements = [];

    if (!gameState.achievements.has('firstPyramid') && gameState.pyramidFound) {
        gameState.achievements.add('firstPyramid');
        newAchievements.push(ACHIEVEMENTS.firstPyramid);
    }
    if (!gameState.achievements.has('fiveExpeditions') && gameState.expeditionsCompleted >= 5) {
        gameState.achievements.add('fiveExpeditions');
        newAchievements.push(ACHIEVEMENTS.fiveExpeditions);
    }
    if (!gameState.achievements.has('tenKills') && gameState.killCount >= 10) {
        gameState.achievements.add('tenKills');
        newAchievements.push(ACHIEVEMENTS.tenKills);
    }
    if (!gameState.achievements.has('fullParty') && gameState.companions.length >= 4) {
        gameState.achievements.add('fullParty');
        newAchievements.push(ACHIEVEMENTS.fullParty);
    }
    if (!gameState.achievements.has('treasureHunter') && gameState.artifactsFound >= 10) {
        gameState.achievements.add('treasureHunter');
        newAchievements.push(ACHIEVEMENTS.treasureHunter);
    }

    newAchievements.forEach(ach => {
        gameState.fame += ach.fame;
        if (scene && scene.showMessage) {
            scene.showMessage(`Achievement: ${ach.name}! +${ach.fame} Fame`, '#FFD700');
        }
    });
}

// Utility functions
function randomEvent(sanityLevel) {
    const eventPool = sanityLevel > 70 ? EVENTS.positive :
                      sanityLevel > 30 ? EVENTS.neutral :
                      EVENTS.negative;

    if (Math.random() < 0.15) {
        return eventPool[Math.floor(Math.random() * eventPool.length)];
    }
    return null;
}

function applyEvent(event, scene) {
    switch (event.effect) {
        case 'sanity':
            gameState.sanity = Math.min(gameState.maxSanity, Math.max(0, gameState.sanity + event.value));
            break;
        case 'fame':
            gameState.fame += event.value;
            break;
        case 'standing':
            gameState.standing = Math.min(gameState.maxStanding, gameState.standing + event.value);
            break;
        case 'damage':
            if (gameState.companions.length > 0) {
                gameState.companions[0].health -= event.value;
            }
            break;
        case 'item':
            const goods = Object.keys(TRADE_GOODS);
            const randomGood = goods[Math.floor(Math.random() * goods.length)];
            gameState.inventory.push({ ...TRADE_GOODS[randomGood], key: randomGood });
            break;
        case 'item_loss':
            if (gameState.inventory.length > 0) {
                const idx = Math.floor(Math.random() * gameState.inventory.length);
                if (gameState.inventory[idx].quantity) {
                    gameState.inventory[idx].quantity--;
                    if (gameState.inventory[idx].quantity <= 0) {
                        gameState.inventory.splice(idx, 1);
                    }
                } else {
                    gameState.inventory.splice(idx, 1);
                }
            }
            break;
    }

    if (scene && scene.showMessage) {
        scene.showMessage(event.message, event.effect === 'sanity' && event.value < 0 ? '#ff4444' : '#44ff44');
    }
}

// Boot Scene
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.scene.start('TitleScene');
    }
}

// Title Scene
class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Background
        this.add.rectangle(0, 0, 960, 640, 0x2C1810).setOrigin(0);

        // Title
        this.add.text(centerX, 150, 'CURIOUS', {
            fontFamily: 'Georgia, serif',
            fontSize: '64px',
            color: '#FFD700',
            stroke: '#3E2723',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(centerX, 220, 'EXPEDITION', {
            fontFamily: 'Georgia, serif',
            fontSize: '48px',
            color: '#F5E6D3',
            stroke: '#3E2723',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(centerX, 290, 'A Victorian Exploration Roguelike', {
            fontFamily: 'Georgia, serif',
            fontSize: '18px',
            color: '#8D6E63'
        }).setOrigin(0.5);

        // Explorer selection
        this.add.text(centerX, 360, 'Choose Your Explorer:', {
            fontFamily: 'Georgia, serif',
            fontSize: '24px',
            color: '#FFD700'
        }).setOrigin(0.5);

        // Explorer buttons
        const explorerKeys = Object.keys(EXPLORERS);
        explorerKeys.forEach((key, i) => {
            const explorer = EXPLORERS[key];
            const y = 410 + i * 45;

            const btn = this.add.rectangle(centerX, y, 300, 38, 0x3E2723)
                .setInteractive()
                .on('pointerover', () => btn.setFillStyle(0x5D4037))
                .on('pointerout', () => btn.setFillStyle(0x3E2723))
                .on('pointerdown', () => this.selectExplorer(key));

            this.add.text(centerX, y, explorer.name, {
                fontFamily: 'Georgia, serif',
                fontSize: '18px',
                color: '#F5E6D3'
            }).setOrigin(0.5);
        });

        // Instructions
        this.add.text(centerX, 600, 'Click an explorer to begin your expedition', {
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            color: '#6D4C41'
        }).setOrigin(0.5);
    }

    selectExplorer(explorerKey) {
        gameState.explorer = { ...EXPLORERS[explorerKey], key: explorerKey };

        // Starting companions
        gameState.companions = [
            { ...COMPANIONS.scout, id: 1, loyalty: 3 },
            { ...COMPANIONS.cook, id: 2, loyalty: 3 }
        ];

        // Starting inventory
        gameState.inventory = [
            { ...ITEMS.chocolate, quantity: 5 },
            { ...ITEMS.foodCans, quantity: 3 },
            { ...ITEMS.torch, quantity: 1 }
        ];

        this.scene.start('ExpeditionScene');
    }
}

// Expedition Scene (Main gameplay)
class ExpeditionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ExpeditionScene' });
    }

    create() {
        this.map = [];
        this.hexes = [];
        this.partyX = 0;
        this.partyY = 0;
        this.revealedHexes = new Set();
        this.enemyZones = [];

        // Generate map
        this.generateMap();

        // Create hex grid
        this.createHexGrid();

        // Place party at edge
        this.placePartyAtEdge();

        // Reveal starting area
        this.revealArea(this.partyX, this.partyY, 3);

        // Create UI
        this.createUI();

        // Input
        this.input.on('pointerdown', this.handleClick, this);
    }

    generateMap() {
        const biome = BIOMES[gameState.currentBiome];
        const weights = biome.terrainWeights;
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

        // Generate terrain
        for (let y = 0; y < MAP_CONFIG.height; y++) {
            this.map[y] = [];
            for (let x = 0; x < MAP_CONFIG.width; x++) {
                let rand = Math.random() * totalWeight;
                let terrain = 'grassland';

                for (const [type, weight] of Object.entries(weights)) {
                    rand -= weight;
                    if (rand <= 0) {
                        terrain = type;
                        break;
                    }
                }

                this.map[y][x] = { type: terrain, explored: false, location: null };
            }
        }

        // Place villages
        const villageCount = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < villageCount; i++) {
            const x = 2 + Math.floor(Math.random() * (MAP_CONFIG.width - 4));
            const y = 2 + Math.floor(Math.random() * (MAP_CONFIG.height - 4));
            this.map[y][x] = { type: 'village', explored: false, location: 'village' };
        }

        // Place shrine
        const shrineX = 3 + Math.floor(Math.random() * (MAP_CONFIG.width - 6));
        const shrineY = 3 + Math.floor(Math.random() * (MAP_CONFIG.height - 6));
        this.map[shrineY][shrineX] = { type: 'shrine', explored: false, location: 'shrine' };

        // Place caves (2-3)
        const caveCount = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < caveCount; i++) {
            const x = 2 + Math.floor(Math.random() * (MAP_CONFIG.width - 4));
            const y = 2 + Math.floor(Math.random() * (MAP_CONFIG.height - 4));
            this.map[y][x] = { type: 'cave', explored: false, location: 'cave' };
        }

        // Place oasis (desert/volcanic only) or healing spring (other biomes)
        if (gameState.currentBiome === 'desert' || gameState.currentBiome === 'volcanic') {
            const oasisX = 3 + Math.floor(Math.random() * (MAP_CONFIG.width - 6));
            const oasisY = 3 + Math.floor(Math.random() * (MAP_CONFIG.height - 6));
            this.map[oasisY][oasisX] = { type: 'oasis', explored: false, location: 'oasis' };
        } else {
            const springX = 3 + Math.floor(Math.random() * (MAP_CONFIG.width - 6));
            const springY = 3 + Math.floor(Math.random() * (MAP_CONFIG.height - 6));
            this.map[springY][springX] = { type: 'healingSpring', explored: false, location: 'healingSpring' };
        }

        // Place stone circle
        const circleX = 4 + Math.floor(Math.random() * (MAP_CONFIG.width - 8));
        const circleY = 4 + Math.floor(Math.random() * (MAP_CONFIG.height - 8));
        this.map[circleY][circleX] = { type: 'stoneCircle', explored: false, location: 'stoneCircle' };

        // Place altar (50% chance)
        if (Math.random() < 0.5) {
            const altarX = 3 + Math.floor(Math.random() * (MAP_CONFIG.width - 6));
            const altarY = 3 + Math.floor(Math.random() * (MAP_CONFIG.height - 6));
            this.map[altarY][altarX] = { type: 'altar', explored: false, location: 'altar' };
        }

        // Place trading post
        const postX = 2 + Math.floor(Math.random() * (MAP_CONFIG.width - 4));
        const postY = 2 + Math.floor(Math.random() * (MAP_CONFIG.height - 4));
        this.map[postY][postX] = { type: 'tradingPost', explored: false, location: 'tradingPost' };

        // Place ruins (60% chance)
        if (Math.random() < 0.6) {
            const ruinsX = 3 + Math.floor(Math.random() * (MAP_CONFIG.width - 6));
            const ruinsY = 3 + Math.floor(Math.random() * (MAP_CONFIG.height - 6));
            this.map[ruinsY][ruinsX] = { type: 'ruins', explored: false, location: 'ruins' };
        }

        // Place Golden Pyramid (far from start)
        const pyramidX = MAP_CONFIG.width - 3 + Math.floor(Math.random() * 2);
        const pyramidY = MAP_CONFIG.height - 3 + Math.floor(Math.random() * 2);
        this.map[pyramidY][pyramidX] = { type: 'pyramid', explored: false, location: 'pyramid' };

        // Place enemy zones
        const enemyCount = 2 + gameState.expedition;
        for (let i = 0; i < enemyCount; i++) {
            const x = 2 + Math.floor(Math.random() * (MAP_CONFIG.width - 4));
            const y = 2 + Math.floor(Math.random() * (MAP_CONFIG.height - 4));
            const enemyType = biome.enemies[Math.floor(Math.random() * biome.enemies.length)];
            this.enemyZones.push({ x, y, type: enemyType, radius: 2 });
        }

        // Initialize weather
        gameState.weather = getWeatherForBiome(gameState.currentBiome);
        gameState.weatherDuration = 3 + Math.floor(Math.random() * 5);
        gameState.rivalPosition = 0;
    }

    createHexGrid() {
        const offsetX = 100;
        const offsetY = 80;

        for (let y = 0; y < MAP_CONFIG.height; y++) {
            this.hexes[y] = [];
            for (let x = 0; x < MAP_CONFIG.width; x++) {
                const pixelX = offsetX + x * MAP_CONFIG.hexWidth * 0.75;
                const pixelY = offsetY + y * MAP_CONFIG.hexHeight + (x % 2) * (MAP_CONFIG.hexHeight / 2);

                const hex = this.createHex(pixelX, pixelY, x, y);
                this.hexes[y][x] = hex;
            }
        }
    }

    createHex(px, py, gridX, gridY) {
        const hex = this.add.polygon(px, py, [
            -MAP_CONFIG.hexWidth/2, 0,
            -MAP_CONFIG.hexWidth/4, -MAP_CONFIG.hexHeight/2,
            MAP_CONFIG.hexWidth/4, -MAP_CONFIG.hexHeight/2,
            MAP_CONFIG.hexWidth/2, 0,
            MAP_CONFIG.hexWidth/4, MAP_CONFIG.hexHeight/2,
            -MAP_CONFIG.hexWidth/4, MAP_CONFIG.hexHeight/2
        ], 0x1a1a1a);

        hex.setStrokeStyle(1, 0x333333);
        hex.gridX = gridX;
        hex.gridY = gridY;
        hex.setInteractive(
            new Phaser.Geom.Polygon([
                -MAP_CONFIG.hexWidth/2, 0,
                -MAP_CONFIG.hexWidth/4, -MAP_CONFIG.hexHeight/2,
                MAP_CONFIG.hexWidth/4, -MAP_CONFIG.hexHeight/2,
                MAP_CONFIG.hexWidth/2, 0,
                MAP_CONFIG.hexWidth/4, MAP_CONFIG.hexHeight/2,
                -MAP_CONFIG.hexWidth/4, MAP_CONFIG.hexHeight/2
            ]),
            Phaser.Geom.Polygon.Contains
        );

        return hex;
    }

    placePartyAtEdge() {
        this.partyX = 0;
        this.partyY = Math.floor(MAP_CONFIG.height / 2);

        // Make starting area passable
        this.map[this.partyY][this.partyX].type = 'grassland';

        this.updatePartyPosition();
    }

    updatePartyPosition() {
        if (this.partyMarker) {
            this.partyMarker.destroy();
        }

        const hex = this.hexes[this.partyY][this.partyX];
        this.partyMarker = this.add.circle(hex.x, hex.y, 12, 0xFFD700);
        this.partyMarker.setStrokeStyle(2, 0x3E2723);
    }

    revealArea(centerX, centerY, radius) {
        for (let y = 0; y < MAP_CONFIG.height; y++) {
            for (let x = 0; x < MAP_CONFIG.width; x++) {
                const dist = this.hexDistance(centerX, centerY, x, y);
                if (dist <= radius) {
                    this.revealHex(x, y);
                }
            }
        }
    }

    revealHex(x, y) {
        const key = `${x},${y}`;
        if (this.revealedHexes.has(key)) return;

        this.revealedHexes.add(key);
        this.map[y][x].explored = true;

        const terrain = TERRAIN[this.map[y][x].type];
        const hex = this.hexes[y][x];
        const color = Phaser.Display.Color.HexStringToColor(terrain.color).color;
        hex.setFillStyle(color);

        // Draw hazard warning
        if (terrain.hazard) {
            this.add.text(hex.x, hex.y, '!', { fontSize: '14px', color: '#FF0000', fontStyle: 'bold' }).setOrigin(0.5);
        }

        // Draw location markers
        if (terrain.location) {
            const locationMarkers = {
                'village': { char: 'V', color: '#8D6E63' },
                'shrine': { char: 'S', color: '#7E57C2' },
                'pyramid': { char: 'P', color: '#FFD700' },
                'cave': { char: 'C', color: '#37474F' },
                'oasis': { char: 'O', color: '#4FC3F7' },
                'stoneCircle': { char: '*', color: '#78909C' },
                'altar': { char: 'A', color: '#9C27B0' },
                'tradingPost': { char: 'T', color: '#FF8A65' },
                'healingSpring': { char: 'H', color: '#00BCD4' },
                'ruins': { char: 'R', color: '#795548' }
            };
            const loc = this.map[y][x].location;
            const markerData = locationMarkers[loc] || { char: '?', color: '#888888' };
            this.add.text(hex.x, hex.y, markerData.char, {
                fontSize: '16px',
                color: markerData.color,
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 2
            }).setOrigin(0.5);
        }
    }

    hexDistance(x1, y1, x2, y2) {
        // Offset coordinates to cube
        const col1 = x1;
        const row1 = y1 - (x1 - (x1 & 1)) / 2;
        const col2 = x2;
        const row2 = y2 - (x2 - (x2 & 1)) / 2;

        const dx = col2 - col1;
        const dy = row2 - row1;

        return Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dx + dy));
    }

    handleClick(pointer) {
        // Find clicked hex
        for (let y = 0; y < MAP_CONFIG.height; y++) {
            for (let x = 0; x < MAP_CONFIG.width; x++) {
                const hex = this.hexes[y][x];
                if (hex.getBounds().contains(pointer.x, pointer.y)) {
                    this.handleHexClick(x, y);
                    return;
                }
            }
        }
    }

    handleHexClick(x, y) {
        const dist = this.hexDistance(this.partyX, this.partyY, x, y);

        // Can only move to adjacent hexes
        if (dist !== 1) return;

        // Check if passable
        const terrain = TERRAIN[this.map[y][x].type];
        if (!terrain.passable) return;

        // Calculate sanity cost
        const cost = terrain.cost + 5; // base cost + terrain

        if (gameState.sanity < cost && gameState.sanity > 0) {
            // Allow movement but trigger low sanity warning
            this.showMessage('Low sanity - dangerous!', '#ff4444');
        }

        // Move party
        this.moveParty(x, y, cost);
    }

    moveParty(x, y, cost) {
        // Check if immobilized
        if (gameState.immobilizedTurns > 0) {
            gameState.immobilizedTurns--;
            this.showMessage(`Party immobilized! ${gameState.immobilizedTurns} turns remaining`, '#FF8A00');
            return;
        }

        this.partyX = x;
        this.partyY = y;

        // Apply weather modifier to sanity cost
        const weatherMod = WEATHER[gameState.weather]?.sanityCostMod || 1.0;
        const adjustedCost = Math.ceil(cost * weatherMod);

        // Reduce sanity
        gameState.sanity = Math.max(0, gameState.sanity - adjustedCost);
        gameState.days++;
        gameState.distanceTraveled++;

        // Update weather
        gameState.weatherDuration--;
        if (gameState.weatherDuration <= 0) {
            gameState.weather = getWeatherForBiome(gameState.currentBiome);
            gameState.weatherDuration = 3 + Math.floor(Math.random() * 5);
            this.showMessage(`Weather: ${WEATHER[gameState.weather].name}`, '#4FC3F7');
        }

        // Decrement insanity cooldown
        if (gameState.insanityCooldown > 0) {
            gameState.insanityCooldown--;
        }

        // Update rival position
        if (updateRivalPosition()) {
            this.showMessage('Your rival has found the pyramid! Hurry!', '#C62828');
        }

        // Update visuals
        this.updatePartyPosition();
        const visibility = Math.ceil(3 * (WEATHER[gameState.weather]?.visibilityMod || 1.0));
        this.revealArea(x, y, visibility);
        this.updateUI();

        // Apply status effects
        applyStatusEffects(this);

        // Check for hazardous terrain
        const terrain = TERRAIN[this.map[y][x].type];
        if (terrain.hazard) {
            applyHazardEffect(terrain, this);
        }

        // Remove dead companions
        gameState.companions = gameState.companions.filter(c => c.health > 0);

        // Check for location
        const cell = this.map[y][x];
        if (cell.location) {
            this.handleLocation(cell.location, x, y);
        }

        // Check for enemy encounter (modified by weather)
        const encounterMod = WEATHER[gameState.weather]?.encounterMod || 1.0;
        this.checkEnemyEncounter(x, y, encounterMod);

        // Check for zero sanity event
        if (gameState.sanity === 0) {
            triggerInsanityEvent(this);
        }

        // Check achievements
        checkAchievements(this);
    }

    handleLocation(locationType, x, y) {
        const key = `${x},${y}`;

        switch (locationType) {
            case 'village':
                if (!gameState.visitedLocations.has(key)) {
                    gameState.sanity = Math.min(gameState.maxSanity, gameState.sanity + 30);
                    gameState.locationsDiscovered++;
                    this.showMessage('Village: +30 Sanity, Rest available', '#44ff44');
                    gameState.visitedLocations.add(key);
                    // Show trade option
                    this.openTradeMenu('village');
                }
                break;

            case 'shrine':
                if (!gameState.visitedLocations.has(key)) {
                    gameState.fame += 20;
                    gameState.locationsDiscovered++;
                    // Chance to find artifact
                    if (Math.random() < 0.5) {
                        const artifact = Object.keys(TRADE_GOODS)[Math.floor(Math.random() * Object.keys(TRADE_GOODS).length)];
                        gameState.inventory.push({ ...TRADE_GOODS[artifact], key: artifact });
                        gameState.artifactsFound++;
                        this.showMessage(`Shrine: +20 Fame, found ${TRADE_GOODS[artifact].name}!`, '#FFD700');
                    } else {
                        this.showMessage('Shrine discovered! +20 Fame', '#FFD700');
                    }
                    gameState.visitedLocations.add(key);
                }
                break;

            case 'cave':
                if (!gameState.visitedLocations.has(key)) {
                    gameState.locationsDiscovered++;
                    // Cave exploration - risk vs reward
                    if (Math.random() < 0.3) {
                        // Danger! Enemy encounter
                        this.showMessage('Something lurks in the cave!', '#C62828');
                        const biome = BIOMES[gameState.currentBiome];
                        const enemyType = biome.enemies[Math.floor(Math.random() * biome.enemies.length)];
                        this.startCombat(enemyType);
                    } else {
                        // Found treasure
                        const treasureValue = 10 + Math.floor(Math.random() * 30);
                        gameState.funds += treasureValue;
                        gameState.fame += 10;
                        this.showMessage(`Cave explored! Found ${treasureValue} funds, +10 Fame`, '#FFD700');
                    }
                    gameState.visitedLocations.add(key);
                }
                break;

            case 'oasis':
                if (!gameState.visitedLocations.has(key)) {
                    gameState.sanity = Math.min(gameState.maxSanity, gameState.sanity + 20);
                    gameState.locationsDiscovered++;
                    // Clear disease status effects
                    gameState.statusEffects = gameState.statusEffects.filter(e => e.type !== 'disease');
                    this.showMessage('Oasis: +20 Sanity, diseases cured!', '#4FC3F7');
                    gameState.visitedLocations.add(key);
                }
                break;

            case 'stoneCircle':
                if (!gameState.visitedLocations.has(key)) {
                    gameState.fame += 15;
                    gameState.locationsDiscovered++;
                    // Mystical effect - reveal nearby area
                    this.revealArea(x, y, 5);
                    this.showMessage('Stone Circle: +15 Fame, area revealed!', '#78909C');
                    gameState.visitedLocations.add(key);
                }
                break;

            case 'altar':
                if (!gameState.visitedLocations.has(key)) {
                    gameState.locationsDiscovered++;
                    // Sacrifice option
                    if (gameState.companions.length > 1) {
                        this.showSacrificePrompt(x, y);
                    } else {
                        gameState.fame += 25;
                        this.showMessage('Altar: +25 Fame (no sacrifice made)', '#9C27B0');
                        gameState.visitedLocations.add(key);
                    }
                }
                break;

            case 'tradingPost':
                if (!gameState.visitedLocations.has(key)) {
                    gameState.locationsDiscovered++;
                    this.showMessage('Trading Post found!', '#FF8A65');
                    this.openTradeMenu('tradingPost');
                    gameState.visitedLocations.add(key);
                }
                break;

            case 'healingSpring':
                if (!gameState.visitedLocations.has(key)) {
                    gameState.sanity = Math.min(gameState.maxSanity, gameState.sanity + 30);
                    gameState.locationsDiscovered++;
                    // Heal all companions
                    gameState.companions.forEach(c => {
                        const maxHP = COMPANIONS[Object.keys(COMPANIONS).find(k => COMPANIONS[k].name === c.name)]?.health || 10;
                        c.health = maxHP;
                    });
                    gameState.statusEffects = []; // Clear all status effects
                    this.showMessage('Healing Spring: Full party heal!', '#00BCD4');
                    gameState.visitedLocations.add(key);
                }
                break;

            case 'ruins':
                if (!gameState.visitedLocations.has(key)) {
                    gameState.locationsDiscovered++;
                    gameState.fame += 15;
                    // Random event at ruins
                    if (Math.random() < 0.6) {
                        const artifact = Object.keys(TRADE_GOODS)[Math.floor(Math.random() * Object.keys(TRADE_GOODS).length)];
                        gameState.inventory.push({ ...TRADE_GOODS[artifact], key: artifact });
                        gameState.artifactsFound++;
                        this.showMessage(`Ruins: +15 Fame, found ${TRADE_GOODS[artifact].name}!`, '#795548');
                    } else {
                        this.showMessage('Ruins explored: +15 Fame', '#795548');
                    }
                    gameState.visitedLocations.add(key);
                }
                break;

            case 'pyramid':
                if (!gameState.pyramidFound) {
                    gameState.pyramidFound = true;
                    // Bonus fame if faster than rival
                    const rivalBonus = gameState.rivalPosition < 40 ? 50 : 0;
                    const speedBonus = gameState.days < 15 ? 50 : 0;
                    gameState.fame += 100 + rivalBonus + speedBonus;
                    gameState.sanity = Math.min(gameState.maxSanity, gameState.sanity + 30);

                    let msg = 'GOLDEN PYRAMID FOUND! +100 Fame';
                    if (rivalBonus > 0) msg += `, +${rivalBonus} Race Bonus`;
                    if (speedBonus > 0) msg += `, +${speedBonus} Speed Bonus`;
                    this.showMessage(msg, '#FFD700');

                    // End expedition after delay
                    this.time.delayedCall(2000, () => {
                        this.endExpedition(true);
                    });
                }
                break;
        }

        this.updateUI();
    }

    openTradeMenu(locationType) {
        // Simple trade - restore sanity for standing
        if (gameState.standing > 0) {
            gameState.standing--;
            gameState.sanity = Math.min(gameState.maxSanity, gameState.sanity + 15);
            this.showMessage('Traded with locals: -1 Standing, +15 Sanity', '#FF8A65');
        }
    }

    showSacrificePrompt(x, y) {
        // Auto-sacrifice for simplicity (in a full game this would be a UI prompt)
        const sacrificed = gameState.companions.splice(0, 1)[0];
        gameState.fame += 75;
        gameState.sanity = Math.min(gameState.maxSanity, gameState.sanity + 50);
        gameState.companionDeaths++;
        this.showMessage(`${sacrificed.name} sacrificed! +75 Fame, +50 Sanity`, '#9C27B0');
        gameState.visitedLocations.add(`${x},${y}`);
    }

    checkEnemyEncounter(x, y, encounterMod = 1.0) {
        for (const zone of this.enemyZones) {
            const dist = this.hexDistance(x, y, zone.x, zone.y);
            if (dist <= zone.radius) {
                // Random chance of encounter modified by weather
                const baseChance = ENEMIES[zone.type]?.aggroChance || 0.3;
                if (Math.random() < baseChance * encounterMod) {
                    this.startCombat(zone.type);
                    return;
                }
            }
        }
    }

    checkInsanityEvent() {
        if (Math.random() < 0.2) {
            const events = [
                { text: 'A companion collapses from exhaustion!', effect: 'damage' },
                { text: 'Hallucinations plague the party!', effect: 'sanityDrain' },
                { text: 'Despair sets in...', effect: 'morale' }
            ];

            const event = events[Math.floor(Math.random() * events.length)];
            this.showMessage(event.text, '#ff4444');

            // Apply effect
            if (event.effect === 'damage' && gameState.companions.length > 0) {
                const c = gameState.companions[0];
                c.health = Math.max(0, c.health - 3);
            }
        }
    }

    startCombat(enemyType) {
        this.scene.pause();
        this.scene.launch('CombatScene', { enemyType });
    }

    endExpedition(success) {
        if (success) {
            gameState.expeditionsCompleted++;
            gameState.totalDays += gameState.days;
            gameState.expedition++;

            // Check for no deaths achievement
            if (gameState.companionDeaths === 0 && !gameState.achievements.has('noDeaths')) {
                gameState.achievements.add('noDeaths');
                gameState.fame += ACHIEVEMENTS.noDeaths.fame;
                this.showMessage(`Achievement: ${ACHIEVEMENTS.noDeaths.name}!`, '#FFD700');
            }

            // Check for speed run achievement
            if (gameState.days < 15 && !gameState.achievements.has('speedRun')) {
                gameState.achievements.add('speedRun');
                gameState.fame += ACHIEVEMENTS.speedRun.fame;
            }

            // Reset for next expedition
            gameState.sanity = gameState.maxSanity;
            gameState.days = 0;
            gameState.pyramidFound = false;
            gameState.visitedLocations.clear();
            gameState.statusEffects = [];
            gameState.rivalPosition = 0;
            gameState.companionDeaths = 0;
            gameState.immobilizedTurns = 0;
            gameState.insanityCooldown = 0;

            // Cycle biomes
            const biomeKeys = Object.keys(BIOMES);
            gameState.currentBiome = biomeKeys[(gameState.expedition - 1) % biomeKeys.length];

            if (gameState.expedition > 6) {
                this.scene.start('VictoryScene');
            } else {
                this.scene.start('LondonScene');
            }
        } else {
            this.scene.start('GameOverScene');
        }
    }

    showMessage(text, color) {
        const msg = this.add.text(480, 50, text, {
            fontFamily: 'Georgia, serif',
            fontSize: '18px',
            color: color,
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: msg,
            y: 30,
            alpha: 0,
            duration: 2000,
            onComplete: () => msg.destroy()
        });
    }

    createUI() {
        // UI Panel background
        this.add.rectangle(870, 320, 160, 600, 0x1a1a1a).setStrokeStyle(2, 0x3E2723);

        // Title
        this.add.text(870, 25, `Expedition ${gameState.expedition}`, {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#FFD700'
        }).setOrigin(0.5);

        // Explorer name
        this.add.text(870, 45, gameState.explorer.name, {
            fontFamily: 'Georgia, serif',
            fontSize: '12px',
            color: '#F5E6D3'
        }).setOrigin(0.5);

        // Weather display
        this.add.text(800, 65, 'Weather:', { fontSize: '12px', color: '#4FC3F7' });
        this.weatherText = this.add.text(940, 65, WEATHER[gameState.weather]?.name || 'Clear',
            { fontSize: '12px', color: '#ffffff' }).setOrigin(1, 0);

        // Stats labels
        this.add.text(800, 85, 'Sanity:', { fontSize: '12px', color: '#1976D2' });
        this.add.text(800, 105, 'Fame:', { fontSize: '12px', color: '#FFD700' });
        this.add.text(800, 125, 'Days:', { fontSize: '12px', color: '#8D6E63' });
        this.add.text(800, 145, 'Standing:', { fontSize: '12px', color: '#FBC02D' });
        this.add.text(800, 165, 'Rival:', { fontSize: '12px', color: '#C62828' });

        // Stats values
        this.sanityText = this.add.text(940, 85, `${gameState.sanity}/${gameState.maxSanity}`,
            { fontSize: '12px', color: '#ffffff' }).setOrigin(1, 0);
        this.fameText = this.add.text(940, 105, `${gameState.fame}`,
            { fontSize: '12px', color: '#ffffff' }).setOrigin(1, 0);
        this.daysText = this.add.text(940, 125, `${gameState.days}`,
            { fontSize: '12px', color: '#ffffff' }).setOrigin(1, 0);
        this.standingText = this.add.text(940, 145, `${gameState.standing}/${gameState.maxStanding}`,
            { fontSize: '12px', color: '#ffffff' }).setOrigin(1, 0);
        this.rivalText = this.add.text(940, 165, `${Math.floor(gameState.rivalPosition / 40 * 100)}%`,
            { fontSize: '12px', color: '#ffffff' }).setOrigin(1, 0);

        // Sanity bar
        this.add.rectangle(870, 190, 120, 10, 0x333333);
        this.sanityBar = this.add.rectangle(810, 190, 120 * (gameState.sanity / gameState.maxSanity), 8, 0x1976D2).setOrigin(0, 0.5);

        // Rival progress bar
        this.add.rectangle(870, 205, 120, 6, 0x333333);
        this.rivalBar = this.add.rectangle(810, 205, 120 * (gameState.rivalPosition / 40), 4, 0xC62828).setOrigin(0, 0.5);

        // Party section
        this.add.text(870, 225, 'PARTY', { fontSize: '12px', color: '#FFD700' }).setOrigin(0.5);

        this.partyTexts = [];
        gameState.companions.forEach((c, i) => {
            const txt = this.add.text(800, 245 + i * 18, `${c.name}: ${c.health} HP`,
                { fontSize: '11px', color: '#F5E6D3' });
            this.partyTexts.push(txt);
        });

        // Status effects
        this.add.text(870, 330, 'STATUS', { fontSize: '12px', color: '#FFD700' }).setOrigin(0.5);
        this.statusText = this.add.text(870, 350, 'None', { fontSize: '10px', color: '#888888' }).setOrigin(0.5);

        // Inventory section
        this.add.text(870, 375, 'INVENTORY', { fontSize: '12px', color: '#FFD700' }).setOrigin(0.5);

        this.inventoryTexts = [];
        gameState.inventory.forEach((item, i) => {
            if (i < 5) { // Limit display to 5 items
                const txt = this.add.text(800, 395 + i * 16,
                    `${item.name}${item.quantity ? ` x${item.quantity}` : ''}`,
                    { fontSize: '10px', color: '#F5E6D3' });
                this.inventoryTexts.push(txt);
            }
        });

        // Rest button
        const restBtn = this.add.rectangle(870, 500, 100, 28, 0x3E2723)
            .setInteractive()
            .on('pointerover', () => restBtn.setFillStyle(0x5D4037))
            .on('pointerout', () => restBtn.setFillStyle(0x3E2723))
            .on('pointerdown', () => this.useItem());
        this.add.text(870, 500, 'Use Item', { fontSize: '12px', color: '#F5E6D3' }).setOrigin(0.5);

        // Legend - more compact
        this.add.text(815, 535, 'V=Village S=Shrine', { fontSize: '9px', color: '#888888' });
        this.add.text(815, 548, 'C=Cave O=Oasis T=Trade', { fontSize: '9px', color: '#888888' });
        this.add.text(815, 561, 'A=Altar R=Ruins H=Heal', { fontSize: '9px', color: '#888888' });
        this.add.text(815, 574, 'P=PYRAMID (Goal)', { fontSize: '9px', color: '#FFD700' });

        // Biome info
        this.add.text(870, 595, `Biome: ${BIOMES[gameState.currentBiome].name}`, {
            fontSize: '10px', color: '#8D6E63'
        }).setOrigin(0.5);
    }

    updateUI() {
        this.sanityText.setText(`${gameState.sanity}/${gameState.maxSanity}`);
        this.fameText.setText(`${gameState.fame}`);
        this.daysText.setText(`${gameState.days}`);
        this.standingText.setText(`${gameState.standing}/${gameState.maxStanding}`);
        this.weatherText.setText(WEATHER[gameState.weather]?.name || 'Clear');
        this.rivalText.setText(`${Math.min(100, Math.floor(gameState.rivalPosition / 40 * 100))}%`);

        // Update sanity bar
        const sanityPercent = gameState.sanity / gameState.maxSanity;
        this.sanityBar.setScale(sanityPercent, 1);

        // Update rival bar
        const rivalPercent = Math.min(1, gameState.rivalPosition / 40);
        this.rivalBar.setScale(rivalPercent, 1);

        // Update status effects
        if (gameState.statusEffects.length > 0) {
            const effectNames = gameState.statusEffects.map(e => e.type).join(', ');
            this.statusText.setText(effectNames);
            this.statusText.setColor('#C62828');
        } else {
            this.statusText.setText('None');
            this.statusText.setColor('#888888');
        }

        // Change color based on sanity level
        if (sanityPercent < 0.3) {
            this.sanityBar.setFillStyle(0xC62828);
        } else if (sanityPercent < 0.5) {
            this.sanityBar.setFillStyle(0xFF8F00);
        } else {
            this.sanityBar.setFillStyle(0x1976D2);
        }
    }

    useItem() {
        // Find first consumable
        const consumableIdx = gameState.inventory.findIndex(i => i.sanity && i.quantity > 0);
        if (consumableIdx >= 0) {
            const item = gameState.inventory[consumableIdx];
            gameState.sanity = Math.min(gameState.maxSanity, gameState.sanity + item.sanity);
            item.quantity--;

            if (item.quantity <= 0) {
                gameState.inventory.splice(consumableIdx, 1);
            }

            this.showMessage(`Used ${item.name}: +${item.sanity} Sanity`, '#44ff44');
            this.updateUI();

            // Refresh inventory display
            this.inventoryTexts.forEach(t => t.destroy());
            this.inventoryTexts = [];
            gameState.inventory.forEach((item, i) => {
                const txt = this.add.text(800, 375 + i * 18,
                    `${item.name}${item.quantity ? ` x${item.quantity}` : ''}`,
                    { fontSize: '12px', color: '#F5E6D3' });
                this.inventoryTexts.push(txt);
            });
        }
    }
}

// Combat Scene
class CombatScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CombatScene' });
    }

    init(data) {
        this.enemyType = data.enemyType;
    }

    create() {
        const enemy = ENEMIES[this.enemyType];
        this.enemy = { ...enemy, currentHealth: enemy.health };
        this.partyHealth = gameState.companions.reduce((sum, c) => sum + c.health, 0);
        this.maxPartyHealth = this.partyHealth;
        this.playerShield = 0;
        this.rolledDice = [];
        this.selectedDice = [];

        // Background
        this.add.rectangle(0, 0, 960, 640, 0x1a1a1a).setOrigin(0);
        this.add.rectangle(480, 320, 600, 450, 0x2C1810).setStrokeStyle(3, 0x8B4513);

        // Title
        this.add.text(480, 120, `COMBAT: ${enemy.name}`, {
            fontFamily: 'Georgia, serif',
            fontSize: '28px',
            color: '#C62828'
        }).setOrigin(0.5);

        // Enemy display
        this.add.circle(480, 200, 40, Phaser.Display.Color.HexStringToColor(enemy.color).color);
        this.enemyHealthText = this.add.text(480, 260, `HP: ${this.enemy.currentHealth}/${enemy.health}`, {
            fontSize: '18px',
            color: '#E53935'
        }).setOrigin(0.5);

        // Party health
        this.partyHealthText = this.add.text(480, 300, `Party HP: ${this.partyHealth}/${this.maxPartyHealth}`, {
            fontSize: '18px',
            color: '#4CAF50'
        }).setOrigin(0.5);

        // Shield display
        this.shieldText = this.add.text(480, 330, `Shield: ${this.playerShield}`, {
            fontSize: '16px',
            color: '#2196F3'
        }).setOrigin(0.5);

        // Dice area
        this.add.text(480, 370, 'Your Dice:', { fontSize: '16px', color: '#FFD700' }).setOrigin(0.5);
        this.diceContainer = this.add.container(280, 400);

        // Roll dice button
        this.rollBtn = this.add.rectangle(380, 500, 120, 40, 0x4CAF50)
            .setInteractive()
            .on('pointerdown', () => this.rollDice());
        this.add.text(380, 500, 'ROLL', { fontSize: '18px', color: '#fff' }).setOrigin(0.5);

        // Attack button
        this.attackBtn = this.add.rectangle(580, 500, 120, 40, 0xC62828)
            .setInteractive()
            .on('pointerdown', () => this.executeAttack());
        this.add.text(580, 500, 'ATTACK', { fontSize: '18px', color: '#fff' }).setOrigin(0.5);

        // Instructions
        this.add.text(480, 560, 'Roll dice, then click dice to select, then Attack', {
            fontSize: '14px',
            color: '#8D6E63'
        }).setOrigin(0.5);
    }

    rollDice() {
        // Clear previous dice
        this.diceContainer.removeAll(true);
        this.rolledDice = [];
        this.selectedDice = [];

        // Get party dice
        const partyDice = [];
        gameState.explorer.dice.forEach(d => partyDice.push(d));
        gameState.companions.forEach(c => {
            c.dice.forEach(d => partyDice.push(d));
        });

        // Roll each die
        partyDice.forEach((dieType, i) => {
            const faces = DICE_FACES[dieType];
            const face = faces[Math.floor(Math.random() * faces.length)];

            this.rolledDice.push({ type: dieType, face, selected: false });

            // Visual die
            const dieColor = dieType === 'red' ? 0xC62828 :
                            dieType === 'green' ? 0x388E3C :
                            dieType === 'blue' ? 0x1976D2 : 0x7B1FA2;

            const x = i * 55;
            const die = this.add.rectangle(x, 0, 45, 45, dieColor)
                .setInteractive()
                .on('pointerdown', () => this.selectDie(i));

            const faceText = this.add.text(x, 0, face.substring(0, 3), {
                fontSize: '12px',
                color: '#fff'
            }).setOrigin(0.5);

            this.diceContainer.add([die, faceText]);
        });
    }

    selectDie(index) {
        this.rolledDice[index].selected = !this.rolledDice[index].selected;

        // Update visuals
        const die = this.diceContainer.getAt(index * 2);
        if (this.rolledDice[index].selected) {
            die.setStrokeStyle(3, 0xFFD700);
        } else {
            die.setStrokeStyle(0);
        }

        // Update selected dice list
        this.selectedDice = this.rolledDice.filter(d => d.selected);
    }

    executeAttack() {
        if (this.selectedDice.length === 0) return;

        // Calculate damage based on selected dice
        let damage = 0;
        let shield = 0;
        let heal = 0;

        this.selectedDice.forEach(d => {
            switch (d.face) {
                case 'attack': damage += 1; break;
                case 'strength': damage += 2; break;
                case 'defense': shield += 1; break;
                case 'magic': damage += 1; heal += 1; break;
                case 'precision': damage += 1; break;
                case 'tactics': shield += 1; break;
                case 'agility': shield += 1; break;
            }
        });

        // Bonus for multiple attacks
        const attackCount = this.selectedDice.filter(d => d.face === 'attack').length;
        if (attackCount >= 3) damage += 2;
        if (attackCount >= 2) damage += 1;

        // Apply player damage to enemy
        this.enemy.currentHealth -= damage;
        this.playerShield = shield;

        // Apply healing
        this.partyHealth = Math.min(this.maxPartyHealth, this.partyHealth + heal);

        // Update displays
        this.enemyHealthText.setText(`HP: ${Math.max(0, this.enemy.currentHealth)}/${this.enemy.health}`);
        this.shieldText.setText(`Shield: ${this.playerShield}`);
        this.partyHealthText.setText(`Party HP: ${this.partyHealth}/${this.maxPartyHealth}`);

        // Clear dice selection
        this.diceContainer.removeAll(true);
        this.rolledDice = [];
        this.selectedDice = [];

        // Check victory
        if (this.enemy.currentHealth <= 0) {
            this.endCombat(true);
            return;
        }

        // Enemy turn
        this.enemyTurn();
    }

    enemyTurn() {
        let damage = this.enemy.damage;
        damage = Math.max(0, damage - this.playerShield);
        this.playerShield = 0;

        this.partyHealth -= damage;
        this.partyHealthText.setText(`Party HP: ${this.partyHealth}/${this.maxPartyHealth}`);
        this.shieldText.setText(`Shield: 0`);

        // Show damage
        const dmgText = this.add.text(480, 350, `-${damage}`, {
            fontSize: '24px',
            color: '#C62828'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: dmgText,
            y: 320,
            alpha: 0,
            duration: 1000,
            onComplete: () => dmgText.destroy()
        });

        // Check defeat
        if (this.partyHealth <= 0) {
            this.endCombat(false);
        }
    }

    endCombat(victory) {
        this.time.delayedCall(1000, () => {
            if (victory) {
                gameState.fame += 10;
                gameState.killCount++;

                // Check kill achievement
                checkAchievements(null);

                // Apply damage to companions
                const damageTaken = this.maxPartyHealth - this.partyHealth;
                let remaining = damageTaken;
                const beforeCount = gameState.companions.length;
                gameState.companions.forEach(c => {
                    const loss = Math.min(c.health, remaining);
                    c.health -= loss;
                    remaining -= loss;
                });

                // Remove dead companions and track deaths
                const aliveCompanions = gameState.companions.filter(c => c.health > 0);
                gameState.companionDeaths += (gameState.companions.length - aliveCompanions.length);
                gameState.companions = aliveCompanions;
            }

            this.scene.stop();

            if (victory) {
                this.scene.resume('ExpeditionScene');
            } else {
                this.scene.stop('ExpeditionScene');
                this.scene.start('GameOverScene');
            }
        });
    }
}

// London Scene (between expeditions)
class LondonScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LondonScene' });
    }

    create() {
        const centerX = 480;

        // Background
        this.add.rectangle(0, 0, 960, 640, 0x1a1a1a).setOrigin(0);

        // Title
        this.add.text(centerX, 60, 'LONDON', {
            fontFamily: 'Georgia, serif',
            fontSize: '48px',
            color: '#FFD700'
        }).setOrigin(0.5);

        this.add.text(centerX, 110, `Expedition ${gameState.expedition - 1} Complete!`, {
            fontFamily: 'Georgia, serif',
            fontSize: '24px',
            color: '#4CAF50'
        }).setOrigin(0.5);

        // Stats
        this.add.text(centerX, 170, `Total Fame: ${gameState.fame}`, {
            fontSize: '20px',
            color: '#FFD700'
        }).setOrigin(0.5);

        // Next expedition info
        this.add.text(centerX, 250, `Next: Expedition ${gameState.expedition}`, {
            fontSize: '24px',
            color: '#F5E6D3'
        }).setOrigin(0.5);

        this.add.text(centerX, 290, `Biome: ${BIOMES[gameState.currentBiome].name}`, {
            fontSize: '18px',
            color: '#8D6E63'
        }).setOrigin(0.5);

        // Recruit companion
        this.add.text(centerX, 360, 'Recruit a Companion:', {
            fontSize: '18px',
            color: '#FFD700'
        }).setOrigin(0.5);

        const companionKeys = Object.keys(COMPANIONS).slice(0, 4);
        companionKeys.forEach((key, i) => {
            const companion = COMPANIONS[key];
            const x = 280 + (i % 2) * 200;
            const y = 400 + Math.floor(i / 2) * 50;

            const btn = this.add.rectangle(x, y, 180, 40, 0x3E2723)
                .setInteractive()
                .on('pointerover', () => btn.setFillStyle(0x5D4037))
                .on('pointerout', () => btn.setFillStyle(0x3E2723))
                .on('pointerdown', () => this.recruitCompanion(key));

            this.add.text(x, y, `${companion.name} (${companion.health} HP)`, {
                fontSize: '14px',
                color: '#F5E6D3'
            }).setOrigin(0.5);
        });

        // Continue button
        const continueBtn = this.add.rectangle(centerX, 550, 200, 50, 0x4CAF50)
            .setInteractive()
            .on('pointerover', () => continueBtn.setFillStyle(0x66BB6A))
            .on('pointerout', () => continueBtn.setFillStyle(0x4CAF50))
            .on('pointerdown', () => this.startExpedition());

        this.add.text(centerX, 550, 'START EXPEDITION', {
            fontSize: '18px',
            color: '#fff'
        }).setOrigin(0.5);

        // Restore supplies
        gameState.inventory = [
            { ...ITEMS.chocolate, quantity: 5 },
            { ...ITEMS.foodCans, quantity: 3 },
            { ...ITEMS.torch, quantity: 1 }
        ];
    }

    recruitCompanion(key) {
        if (gameState.companions.length < 4) {
            const newCompanion = {
                ...COMPANIONS[key],
                id: Date.now(),
                loyalty: 3
            };
            gameState.companions.push(newCompanion);
        }
    }

    startExpedition() {
        this.scene.start('ExpeditionScene');
    }
}

// Victory Scene
class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    create() {
        const centerX = 480;

        // Background
        this.add.rectangle(0, 0, 960, 640, 0x1a1a1a).setOrigin(0);

        // Title
        this.add.text(centerX, 80, 'VICTORY!', {
            fontFamily: 'Georgia, serif',
            fontSize: '64px',
            color: '#FFD700'
        }).setOrigin(0.5);

        this.add.text(centerX, 140, 'All Expeditions Complete', {
            fontFamily: 'Georgia, serif',
            fontSize: '24px',
            color: '#4CAF50'
        }).setOrigin(0.5);

        // Stats
        this.add.text(centerX, 200, `Explorer: ${gameState.explorer.name}`, {
            fontSize: '20px',
            color: '#F5E6D3'
        }).setOrigin(0.5);

        this.add.text(centerX, 240, `Final Fame: ${gameState.fame}`, {
            fontSize: '28px',
            color: '#FFD700'
        }).setOrigin(0.5);

        // Detailed stats
        const stats = [
            `Expeditions: ${gameState.expeditionsCompleted}`,
            `Total Days: ${gameState.totalDays}`,
            `Creatures Defeated: ${gameState.killCount}`,
            `Locations Discovered: ${gameState.locationsDiscovered}`,
            `Artifacts Found: ${gameState.artifactsFound}`,
            `Distance Traveled: ${gameState.distanceTraveled} hexes`,
            `Achievements: ${gameState.achievements.size}`
        ];

        stats.forEach((stat, i) => {
            this.add.text(centerX, 290 + i * 25, stat, {
                fontSize: '16px',
                color: '#8D6E63'
            }).setOrigin(0.5);
        });

        // Rating
        let rating = 'D';
        if (gameState.fame >= 1000) rating = 'S';
        else if (gameState.fame >= 700) rating = 'A';
        else if (gameState.fame >= 500) rating = 'B';
        else if (gameState.fame >= 300) rating = 'C';

        this.add.text(centerX, 500, `Rating: ${rating}`, {
            fontFamily: 'Georgia, serif',
            fontSize: '36px',
            color: rating === 'S' ? '#FFD700' : rating === 'A' ? '#4CAF50' : '#F5E6D3'
        }).setOrigin(0.5);

        // Restart button
        const restartBtn = this.add.rectangle(centerX, 570, 200, 50, 0x3E2723)
            .setInteractive()
            .on('pointerover', () => restartBtn.setFillStyle(0x5D4037))
            .on('pointerout', () => restartBtn.setFillStyle(0x3E2723))
            .on('pointerdown', () => this.restart());

        this.add.text(centerX, 570, 'NEW GAME', {
            fontSize: '20px',
            color: '#F5E6D3'
        }).setOrigin(0.5);
    }

    restart() {
        // Reset game state
        gameState = {
            expedition: 1,
            fame: 0,
            sanity: 100,
            maxSanity: 100,
            days: 0,
            standing: 3,
            maxStanding: 5,
            explorer: null,
            companions: [],
            inventory: [],
            inventorySlots: 6,
            currentBiome: 'jungle',
            pyramidFound: false,
            visitedLocations: new Set()
        };

        this.scene.start('TitleScene');
    }
}

// Game Over Scene
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        const centerX = 480;

        // Background
        this.add.rectangle(0, 0, 960, 640, 0x1a1a1a).setOrigin(0);

        // Title
        this.add.text(centerX, 150, 'EXPEDITION FAILED', {
            fontFamily: 'Georgia, serif',
            fontSize: '48px',
            color: '#C62828'
        }).setOrigin(0.5);

        this.add.text(centerX, 220, 'Your party has perished in the wilderness...', {
            fontFamily: 'Georgia, serif',
            fontSize: '20px',
            color: '#8D6E63'
        }).setOrigin(0.5);

        // Stats
        this.add.text(centerX, 300, `Explorer: ${gameState.explorer ? gameState.explorer.name : 'Unknown'}`, {
            fontSize: '18px',
            color: '#F5E6D3'
        }).setOrigin(0.5);

        this.add.text(centerX, 340, `Expeditions Completed: ${gameState.expedition - 1}`, {
            fontSize: '18px',
            color: '#F5E6D3'
        }).setOrigin(0.5);

        this.add.text(centerX, 380, `Fame Earned: ${gameState.fame}`, {
            fontSize: '20px',
            color: '#FFD700'
        }).setOrigin(0.5);

        this.add.text(centerX, 420, `Days Survived: ${gameState.days}`, {
            fontSize: '18px',
            color: '#F5E6D3'
        }).setOrigin(0.5);

        // Restart button
        const restartBtn = this.add.rectangle(centerX, 520, 200, 50, 0x3E2723)
            .setInteractive()
            .on('pointerover', () => restartBtn.setFillStyle(0x5D4037))
            .on('pointerout', () => restartBtn.setFillStyle(0x3E2723))
            .on('pointerdown', () => this.restart());

        this.add.text(centerX, 520, 'TRY AGAIN', {
            fontSize: '20px',
            color: '#F5E6D3'
        }).setOrigin(0.5);
    }

    restart() {
        // Reset game state
        gameState = {
            expedition: 1,
            fame: 0,
            sanity: 100,
            maxSanity: 100,
            days: 0,
            standing: 3,
            maxStanding: 5,
            explorer: null,
            companions: [],
            inventory: [],
            inventorySlots: 6,
            currentBiome: 'jungle',
            pyramidFound: false,
            visitedLocations: new Set()
        };

        this.scene.start('TitleScene');
    }
}

// Game configuration
const config = {
    type: Phaser.CANVAS,
    width: 960,
    height: 640,
    parent: 'game',
    backgroundColor: '#1a1a1a',
    scene: [BootScene, TitleScene, ExpeditionScene, CombatScene, LondonScene, VictoryScene, GameOverScene]
};

// Create game
const game = new Phaser.Game(config);

// Expose for testing
window.game = game;
window.gameState = gameState;
