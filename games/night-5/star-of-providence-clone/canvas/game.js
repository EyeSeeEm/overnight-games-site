/**
 * Star of Providence Clone
 * A top-down bullet-hell roguelike shooter
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const ROOM_WIDTH = 800;
const ROOM_HEIGHT = 500;
const UI_HEIGHT = 100;

const COLORS = {
  background: '#0a0a12',
  floor: '#1a1a2a',
  wall: '#2a2a3a',
  player: '#00ff88',
  playerBullet: '#ffff00',
  enemyBullet: '#ff4444',
  enemyBulletDestructible: '#ff8844',
  health: '#ff0000',
  shield: '#0088ff',
  ammo: '#ffaa00',
  debris: '#ffff00',
  door: '#4444ff',
  doorLocked: '#444444'
};

// ═══════════════════════════════════════════════════════════════════════════
// FLOOR THEMES
// ═══════════════════════════════════════════════════════════════════════════

const FLOOR_THEMES = {
  1: {
    name: 'Catacombs',
    background: '#0a0a12',
    floor: '#1a1a2a',
    wall: '#2a2a3a',
    grid: '#222233',
    accent: '#4444ff',
    ambientParticles: '#333366'
  },
  2: {
    name: 'Archives',
    background: '#0a100a',
    floor: '#1a2a1a',
    wall: '#2a3a2a',
    grid: '#223322',
    accent: '#44ff44',
    ambientParticles: '#336633'
  },
  3: {
    name: 'Maintenance',
    background: '#120a0a',
    floor: '#2a1a1a',
    wall: '#3a2a2a',
    grid: '#332222',
    accent: '#ff4444',
    ambientParticles: '#663333'
  }
};

// Get current floor theme
function getFloorTheme() {
  return FLOOR_THEMES[currentFloor] || FLOOR_THEMES[1];
}

// ═══════════════════════════════════════════════════════════════════════════
// DIFFICULTY SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

const DIFFICULTY_SETTINGS = {
  MILD: {
    name: 'Mild',
    description: 'Relaxed combat for casual play',
    enemyHealthMult: 0.7,
    enemyDamageMult: 0.5,
    enemySpawnMult: 0.8,
    playerDamageMult: 1.2,
    debrisMultiplier: 1.5,
    color: '#44ff44'
  },
  NORMAL: {
    name: 'Normal',
    description: 'Standard difficulty, recommended',
    enemyHealthMult: 1.0,
    enemyDamageMult: 1.0,
    enemySpawnMult: 1.0,
    playerDamageMult: 1.0,
    debrisMultiplier: 1.0,
    color: '#4488ff'
  },
  INTENSE: {
    name: 'Intense',
    description: 'For experienced players',
    enemyHealthMult: 1.3,
    enemyDamageMult: 1.5,
    enemySpawnMult: 1.3,
    playerDamageMult: 0.9,
    debrisMultiplier: 1.2,
    color: '#ff8844'
  },
  SUDDEN_DEATH: {
    name: 'Sudden Death',
    description: 'One hit = death',
    enemyHealthMult: 0.8,
    enemyDamageMult: 999,
    enemySpawnMult: 1.0,
    playerDamageMult: 1.5,
    debrisMultiplier: 2.0,
    color: '#ff4444'
  }
};

let selectedDifficulty = 'NORMAL';

function getDifficulty() {
  return DIFFICULTY_SETTINGS[selectedDifficulty] || DIFFICULTY_SETTINGS.NORMAL;
}

// ═══════════════════════════════════════════════════════════════════════════
// SHIP DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const SHIPS = {
  STANDARD: {
    name: 'Standard',
    description: 'Balanced stats, good for beginners',
    color: '#00ff88',
    hp: 4,
    shields: 0,
    speed: 250,
    focusSpeed: 100,
    dashDistance: 120,
    startWeapon: 'PEASHOOTER',
    passive: null
  },
  TANK: {
    name: 'Tank',
    description: 'High HP and shields, slower movement',
    color: '#4488ff',
    hp: 6,
    shields: 2,
    speed: 180,
    focusSpeed: 70,
    dashDistance: 80,
    startWeapon: 'PEASHOOTER',
    passive: 'ARMOR' // Takes 20% less damage
  },
  SPEEDSTER: {
    name: 'Speedster',
    description: 'Fast movement, extra dashes, low HP',
    color: '#ffff44',
    hp: 2,
    shields: 0,
    speed: 350,
    focusSpeed: 150,
    dashDistance: 180,
    startWeapon: 'PEASHOOTER',
    passive: 'QUICK_DASH' // 50% reduced dash cooldown
  },
  BOMBER: {
    name: 'Bomber',
    description: 'Extra bombs, bomb recharge faster',
    color: '#ff44ff',
    hp: 3,
    shields: 0,
    speed: 230,
    focusSpeed: 90,
    dashDistance: 120,
    startWeapon: 'PEASHOOTER',
    passive: 'EXPLOSIVE' // Starts with 4 bombs, recharge every 2 rooms
  },
  GLASS_CANNON: {
    name: 'Glass Cannon',
    description: 'Massive damage, very fragile',
    color: '#ff4444',
    hp: 2,
    shields: 0,
    speed: 250,
    focusSpeed: 100,
    dashDistance: 120,
    startWeapon: 'CHARGE',
    passive: 'DAMAGE_BOOST' // +50% damage
  },
  VAMPIRE: {
    name: 'Vampire',
    description: 'Drains HP from enemies on kill',
    color: '#880088',
    hp: 3,
    shields: 0,
    speed: 250,
    focusSpeed: 100,
    dashDistance: 120,
    startWeapon: 'PEASHOOTER',
    passive: 'LIFESTEAL' // Heal on enemy kill
  },
  ROGUE: {
    name: 'Rogue',
    description: 'Starts with random weapon, bonus debris',
    color: '#888888',
    hp: 3,
    shields: 1,
    speed: 270,
    focusSpeed: 110,
    dashDistance: 140,
    startWeapon: 'RANDOM',
    passive: 'SCAVENGER' // +50% debris drops
  }
};

let selectedShip = 'STANDARD';

function getShip() {
  return SHIPS[selectedShip] || SHIPS.STANDARD;
}

// ═══════════════════════════════════════════════════════════════════════════
// WEAPON DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const WEAPONS = {
  PEASHOOTER: {
    name: 'Peashooter',
    damage: 5,
    maxAmmo: Infinity,
    fireRate: 100,
    velocity: 720,
    projectileSize: 4,
    projectileColor: '#ffff00',
    piercing: false,
    canHaveKeywords: false
  },
  VULCAN: {
    name: 'Vulcan',
    damage: 15,
    maxAmmo: 500,
    fireRate: 133,
    velocity: 600,
    projectileSize: 6,
    projectileColor: '#ff6600',
    piercing: false,
    canHaveKeywords: true
  },
  LASER: {
    name: 'Laser',
    damage: 115,
    maxAmmo: 100,
    fireRate: 667,
    velocity: 2000,
    projectileSize: 4,
    projectileColor: '#00ffff',
    piercing: true,
    canHaveKeywords: true,
    isHitscan: false,
    beamWidth: 8
  },
  FIREBALL: {
    name: 'Fireball',
    damage: 80,
    maxAmmo: 90,
    fireRate: 833,
    velocity: 360,
    projectileSize: 16,
    projectileColor: '#ff4400',
    piercing: false,
    canHaveKeywords: true,
    explosionRadius: 48
  },
  SWORD: {
    name: 'Sword',
    damage: 70,
    projectileDamage: 35,
    maxAmmo: 125,
    fireRate: 533,
    velocity: 400,
    projectileSize: 12,
    projectileColor: '#aaaaff',
    canHaveKeywords: true,
    isMelee: true,
    coneAngle: 90,
    coneRange: 80
  },
  CHARGE: {
    name: 'Charge',
    damage: 20, // Base damage, scales with charge
    maxAmmo: 200,
    fireRate: 100, // Minimum time between shots
    velocity: 800,
    projectileSize: 8,
    projectileColor: '#ff00ff',
    piercing: false,
    canHaveKeywords: true,
    isCharge: true,
    maxChargeTime: 1500, // Max charge time in ms
    maxChargeDamage: 200, // Damage at full charge
    maxChargeSize: 24 // Projectile size at full charge
  },
  RAILGUN: {
    name: 'Railgun',
    damage: 250,
    maxAmmo: 30,
    fireRate: 1500, // Slow fire rate
    velocity: 1500, // Fast but not instant
    projectileSize: 6,
    projectileColor: '#88ffff',
    piercing: true,
    canHaveKeywords: true,
    isRailgun: true,
    trailLength: 40
  },
  REVOLVER: {
    name: 'Revolver',
    damage: 80,
    maxAmmo: 36, // Total ammo pool
    fireRate: 400, // Fast for single shots
    velocity: 600,
    projectileSize: 6,
    projectileColor: '#ffaa44',
    canHaveKeywords: true,
    clipSize: 6, // 6 shots per clip
    reloadTime: 1200, // 1.2 seconds to reload
    isRevolver: true
  },
  PULSAR: {
    name: 'Pulsar',
    damage: 3, // Low damage per shot
    maxAmmo: 1500, // Large ammo pool for rapid fire
    fireRate: 25, // Extremely rapid fire (40 shots/sec)
    velocity: 500,
    projectileSize: 3, // Small projectiles
    projectileColor: '#ff44ff',
    canHaveKeywords: true,
    maxRange: 200, // Limited range
    isPulsar: true
  },
  SPEAR: {
    name: 'Spear',
    damage: 25, // Initial hit damage
    maxAmmo: 80,
    fireRate: 600, // Moderate fire rate
    velocity: 700,
    projectileSize: 12, // Long thin projectile
    projectileColor: '#88ff44',
    canHaveKeywords: true,
    isSpear: true,
    dotDamage: 15, // Damage per tick
    dotDuration: 2000, // 2 seconds
    dotTicks: 4 // 4 ticks over 2 seconds
  },
  RAZOR: {
    name: 'Razor',
    damage: 40,
    maxAmmo: 100,
    fireRate: 350,
    velocity: 450,
    projectileSize: 8,
    projectileColor: '#ff8844',
    canHaveKeywords: true,
    isRazor: true,
    bounceCount: 3, // Max bounces before disappearing
    bounceDamageDecay: 0.8 // 80% damage retained per bounce
  },
  THUNDERHEAD: {
    name: 'Thunderhead',
    damage: 8, // Damage per tick
    maxAmmo: 60,
    fireRate: 800,
    velocity: 300,
    projectileSize: 6,
    projectileColor: '#44ffff',
    canHaveKeywords: true,
    isThunderhead: true,
    fieldRadius: 40, // Electric field radius
    fieldDuration: 2000, // Field lasts 2 seconds
    fieldTickRate: 200 // Damage every 200ms
  },
  RUNIC: {
    name: 'Runic',
    damage: 35,
    maxAmmo: 120, // Each fire uses ammo to spawn runes
    fireRate: 300, // Can spawn runes quickly
    velocity: 400, // Homing speed
    projectileSize: 6,
    projectileColor: '#aa44ff',
    canHaveKeywords: true,
    isRunic: true,
    maxOrbitRunes: 12, // Max runes orbiting at once
    orbitRadius: 60, // Distance from player
    homingStrength: 5 // Turn rate for homing
  },
  DRILL: {
    name: 'Drill',
    damage: 5, // DPS per tick
    maxAmmo: 200,
    fireRate: 0, // Continuous while held
    velocity: 0,
    projectileSize: 20,
    projectileColor: '#888888',
    canHaveKeywords: false,
    isDrill: true,
    drillLength: 60, // Length of drill beam
    drillWidth: 16,
    dragStrength: 120, // How fast enemies are pulled
    ammoPerSecond: 30 // Ammo consumed per second while active
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// WEAPON KEYWORDS
// ═══════════════════════════════════════════════════════════════════════════

const WEAPON_KEYWORDS = {
  HOMING: {
    name: 'Homing',
    description: 'Bullets track enemies',
    color: '#ff88ff',
    apply: (weapon) => ({ homingStrength: 3 })
  },
  TRIPLE: {
    name: 'Triple',
    description: 'Fire 3 bullets in spread',
    color: '#88ff88',
    apply: (weapon) => ({ tripleShot: true, spreadAngle: 15 })
  },
  HIGH_CALIBER: {
    name: 'High-Caliber',
    description: '+50% damage, -25% fire rate',
    color: '#ffaa44',
    apply: (weapon) => ({ damageMultiplier: 1.5, fireRateMultiplier: 0.75 })
  },
  RAPID: {
    name: 'Rapid',
    description: '+50% fire rate, -20% damage',
    color: '#44ffff',
    apply: (weapon) => ({ damageMultiplier: 0.8, fireRateMultiplier: 1.5 })
  },
  PIERCING: {
    name: 'Piercing',
    description: 'Bullets pierce enemies',
    color: '#ff4444',
    apply: (weapon) => ({ piercing: true })
  },
  EXPLOSIVE: {
    name: 'Explosive',
    description: 'Bullets explode on hit',
    color: '#ff8800',
    apply: (weapon) => ({ explosive: true, explosionRadius: 40 })
  },
  GIANT: {
    name: 'Giant',
    description: '+100% bullet size',
    color: '#8844ff',
    apply: (weapon) => ({ sizeMultiplier: 2.0 })
  },
  VAMPIRIC: {
    name: 'Vampiric',
    description: 'Small chance to heal on kill',
    color: '#ff0044',
    apply: (weapon) => ({ vampiric: true, healChance: 0.15 })
  }
};

// Apply keyword modifiers to weapon stats
function applyWeaponKeyword(weapon, keywordKey) {
  if (!weapon.canHaveKeywords) return weapon;

  const keyword = WEAPON_KEYWORDS[keywordKey];
  if (!keyword) return weapon;

  const modifiers = keyword.apply(weapon);
  const modifiedWeapon = { ...weapon };

  // Initialize keywords array
  modifiedWeapon.keywords = modifiedWeapon.keywords || [];
  if (!modifiedWeapon.keywords.includes(keywordKey)) {
    modifiedWeapon.keywords.push(keywordKey);
  }

  // Apply modifiers
  if (modifiers.damageMultiplier) {
    modifiedWeapon.damage = (modifiedWeapon.damage || 0) * modifiers.damageMultiplier;
  }
  if (modifiers.fireRateMultiplier) {
    modifiedWeapon.fireRate = (modifiedWeapon.fireRate || 0) / modifiers.fireRateMultiplier;
  }
  if (modifiers.sizeMultiplier) {
    modifiedWeapon.projectileSize = (modifiedWeapon.projectileSize || 0) * modifiers.sizeMultiplier;
  }
  if (modifiers.homingStrength) {
    modifiedWeapon.homingStrength = modifiers.homingStrength;
  }
  if (modifiers.tripleShot) {
    modifiedWeapon.tripleShot = true;
    modifiedWeapon.spreadAngle = modifiers.spreadAngle;
  }
  if (modifiers.piercing) {
    modifiedWeapon.piercing = true;
  }
  if (modifiers.explosive) {
    modifiedWeapon.explosive = true;
    modifiedWeapon.explosionRadius = modifiers.explosionRadius;
  }
  if (modifiers.vampiric) {
    modifiedWeapon.vampiric = true;
    modifiedWeapon.healChance = modifiers.healChance;
  }

  // Update weapon name
  modifiedWeapon.name = keyword.name + ' ' + modifiedWeapon.name;

  return modifiedWeapon;
}

// Get display name with all keywords
function getWeaponDisplayName(weapon) {
  return weapon.name;
}

// ═══════════════════════════════════════════════════════════════════════════
// SHOP ITEMS
// ═══════════════════════════════════════════════════════════════════════════

const SHOP_ITEMS = {
  // Consumables
  HEALTH: {
    name: 'Health Pack',
    description: 'Restore 1 HP',
    price: 30,
    color: '#ff4444',
    icon: '❤',
    effect: (player) => {
      if (player.hp < player.maxHP) {
        player.hp = Math.min(player.maxHP, player.hp + 1);
        return true;
      }
      return false; // Can't buy if full
    },
    canBuy: (player) => player.hp < player.maxHP
  },
  SHIELD: {
    name: 'Shield Cell',
    description: 'Restore 1 Shield',
    price: 40,
    color: '#4488ff',
    icon: '🛡',
    effect: (player) => {
      if (player.shields < player.maxShields) {
        player.shields = Math.min(player.maxShields, player.shields + 1);
        return true;
      }
      return false;
    },
    canBuy: (player) => player.shields < player.maxShields
  },
  BOMB: {
    name: 'Bomb',
    description: 'Add 1 Bomb',
    price: 50,
    color: '#ffaa00',
    icon: '💣',
    effect: (player) => {
      if (player.bombs < player.maxBombs) {
        player.bombs++;
        return true;
      }
      return false;
    },
    canBuy: (player) => player.bombs < player.maxBombs
  },
  AMMO: {
    name: 'Ammo Pack',
    description: 'Restore 50 ammo',
    price: 25,
    color: '#88ff88',
    icon: '🔋',
    effect: (player) => {
      if (player.ammo < player.maxAmmo) {
        player.ammo = Math.min(player.maxAmmo, player.ammo + 50);
        return true;
      }
      return false;
    },
    canBuy: (player) => player.ammo < player.maxAmmo
  },
  // Upgrades
  MAX_HP_UP: {
    name: 'HP Container',
    description: '+1 Max HP',
    price: 100,
    color: '#ff8888',
    icon: '♥+',
    effect: (player) => {
      player.maxHP++;
      player.hp++;
      return true;
    },
    canBuy: () => true
  },
  MAX_SHIELD_UP: {
    name: 'Shield Upgrade',
    description: '+1 Max Shield',
    price: 120,
    color: '#88aaff',
    icon: '🛡+',
    effect: (player) => {
      player.maxShields++;
      player.shields++;
      return true;
    },
    canBuy: () => true
  },
  DAMAGE_UP: {
    name: 'Power Cell',
    description: '+10% damage',
    price: 80,
    color: '#ff88ff',
    icon: '⚡',
    effect: (player) => {
      player.damageBonus = (player.damageBonus || 0) + 0.1;
      return true;
    },
    canBuy: () => true
  },
  SPEED_UP: {
    name: 'Thruster Mod',
    description: '+10% speed',
    price: 60,
    color: '#88ffff',
    icon: '🚀',
    effect: (player) => {
      player.speedBonus = (player.speedBonus || 0) + 0.1;
      return true;
    },
    canBuy: () => true
  }
};

// Current shop inventory (regenerated per shop room)
let shopInventory = [];
let selectedShopItem = 0;

// ═══════════════════════════════════════════════════════════════════════════
// UPGRADE TERMINAL
// ═══════════════════════════════════════════════════════════════════════════

const UPGRADES = {
  // Combat upgrades
  DAMAGE_BOOST: {
    name: 'Damage Boost',
    description: '+15% weapon damage',
    color: '#ff4488',
    icon: '⚔',
    effect: (player) => {
      player.damageBonus = (player.damageBonus || 0) + 0.15;
    }
  },
  FIRE_RATE: {
    name: 'Rapid Fire',
    description: '+20% fire rate',
    color: '#ff8844',
    icon: '🔥',
    effect: (player) => {
      player.fireRateBonus = (player.fireRateBonus || 0) + 0.2;
    }
  },
  CRITICAL_HIT: {
    name: 'Critical Strike',
    description: '10% chance for 2x damage',
    color: '#ffff44',
    icon: '💥',
    effect: (player) => {
      player.critChance = (player.critChance || 0) + 0.1;
    }
  },
  // Defense upgrades
  ARMOR_PLATING: {
    name: 'Armor Plating',
    description: '-20% damage taken',
    color: '#4488ff',
    icon: '🛡',
    effect: (player) => {
      player.damageReduction = (player.damageReduction || 0) + 0.2;
    }
  },
  REGENERATION: {
    name: 'Regeneration',
    description: 'Heal 1 HP per room cleared',
    color: '#44ff44',
    icon: '💚',
    effect: (player) => {
      player.hasRegeneration = true;
    }
  },
  SHIELD_BATTERY: {
    name: 'Shield Battery',
    description: '+1 Max shield, restore shields',
    color: '#44aaff',
    icon: '🔋',
    effect: (player) => {
      player.maxShields++;
      player.shields = player.maxShields;
    }
  },
  // Mobility upgrades
  SPEED_BOOST: {
    name: 'Thruster Upgrade',
    description: '+15% movement speed',
    color: '#44ffff',
    icon: '🚀',
    effect: (player) => {
      player.speedBonus = (player.speedBonus || 0) + 0.15;
    }
  },
  DASH_MASTERY: {
    name: 'Dash Mastery',
    description: '-30% dash cooldown',
    color: '#aa44ff',
    icon: '💨',
    effect: (player) => {
      player.dashCooldownReduction = (player.dashCooldownReduction || 0) + 0.3;
    }
  },
  // Resource upgrades
  DEBRIS_MAGNET: {
    name: 'Debris Magnet',
    description: '+50% pickup range',
    color: '#88ff88',
    icon: '🧲',
    effect: (player) => {
      player.pickupRangeBonus = (player.pickupRangeBonus || 0) + 0.5;
    }
  },
  AMMO_EFFICIENCY: {
    name: 'Ammo Efficiency',
    description: '-25% ammo consumption',
    color: '#88ffaa',
    icon: '📦',
    effect: (player) => {
      player.ammoEfficiency = (player.ammoEfficiency || 0) + 0.25;
    }
  },
  BOMB_MASTERY: {
    name: 'Bomb Mastery',
    description: '+1 Max bomb, +25% bomb damage',
    color: '#ffaa44',
    icon: '💣',
    effect: (player) => {
      player.maxBombs++;
      player.bombDamageBonus = (player.bombDamageBonus || 0) + 0.25;
    }
  },
  // Special upgrades
  SCANNER: {
    name: 'Floor Scanner',
    description: 'Reveal all room types on map',
    color: '#ffff88',
    icon: '📡',
    effect: (player) => {
      player.hasScanner = true;
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CARTRIDGES - Collectible passive items
// ═══════════════════════════════════════════════════════════════════════════

const CARTRIDGES = {
  // Offensive cartridges
  HOT_SHOT: {
    name: 'Hot Shot',
    description: 'Bullets have 15% chance to ignite enemies',
    color: '#ff6644',
    icon: '🔥',
    rarity: 'common'
  },
  PIERCING_ROUNDS: {
    name: 'Piercing Rounds',
    description: 'Bullets pierce 1 additional enemy',
    color: '#88ffff',
    icon: '➤',
    rarity: 'uncommon'
  },
  LUCKY_SEVEN: {
    name: 'Lucky Seven',
    description: '7% chance for 3x critical damage',
    color: '#ffff44',
    icon: '🍀',
    rarity: 'rare'
  },
  OVERCHARGE: {
    name: 'Overcharge',
    description: '+25% damage at full HP',
    color: '#ff88ff',
    icon: '⚡',
    rarity: 'uncommon'
  },
  // Defensive cartridges
  IRON_SKIN: {
    name: 'Iron Skin',
    description: '15% chance to ignore damage',
    color: '#aaaaaa',
    icon: '🛡',
    rarity: 'uncommon'
  },
  SECOND_WIND: {
    name: 'Second Wind',
    description: 'Revive once with 1 HP (per floor)',
    color: '#44ff88',
    icon: '💫',
    rarity: 'rare'
  },
  SHIELD_CAPACITOR: {
    name: 'Shield Capacitor',
    description: 'Shields regenerate when room is cleared',
    color: '#4488ff',
    icon: '🔄',
    rarity: 'uncommon'
  },
  HARDENED_HULL: {
    name: 'Hardened Hull',
    description: 'Take -1 damage from all sources (min 1)',
    color: '#666666',
    icon: '🔩',
    rarity: 'rare'
  },
  // Utility cartridges
  TREASURE_HUNTER: {
    name: 'Treasure Hunter',
    description: '+30% debris from all sources',
    color: '#ffcc00',
    icon: '💰',
    rarity: 'common'
  },
  AMMO_RECYCLER: {
    name: 'Ammo Recycler',
    description: '20% chance to not consume ammo',
    color: '#88ff88',
    icon: '♻',
    rarity: 'uncommon'
  },
  MAP_CHIP: {
    name: 'Map Chip',
    description: 'Reveal adjacent room types',
    color: '#88aaff',
    icon: '📍',
    rarity: 'common'
  },
  QUICK_LOADER: {
    name: 'Quick Loader',
    description: '-30% reload time',
    color: '#ffaa44',
    icon: '📥',
    rarity: 'common'
  }
};

// Cartridge inventory state
let cartridgeInventory = [];
const MAX_CARTRIDGES = 8;

// Add cartridge to inventory
function addCartridge(cartridgeKey) {
  if (cartridgeInventory.length >= MAX_CARTRIDGES) {
    console.log('Cartridge inventory full!');
    return false;
  }
  if (!CARTRIDGES[cartridgeKey]) {
    console.log('Unknown cartridge:', cartridgeKey);
    return false;
  }

  cartridgeInventory.push(cartridgeKey);

  // Visual feedback
  for (let i = 0; i < 15; i++) {
    particles.push(createParticle(player.x, player.y, CARTRIDGES[cartridgeKey].color));
  }

  return true;
}

// Check if player has cartridge
function hasCartridge(cartridgeKey) {
  return cartridgeInventory.includes(cartridgeKey);
}

// Count cartridges of type
function countCartridge(cartridgeKey) {
  return cartridgeInventory.filter(c => c === cartridgeKey).length;
}

// Get random cartridge for spawn
function getRandomCartridge() {
  const keys = Object.keys(CARTRIDGES);
  const weights = keys.map(key => {
    const rarity = CARTRIDGES[key].rarity;
    switch (rarity) {
      case 'common': return 50;
      case 'uncommon': return 30;
      case 'rare': return 15;
      default: return 25;
    }
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < keys.length; i++) {
    random -= weights[i];
    if (random <= 0) return keys[i];
  }
  return keys[0];
}

// ═══════════════════════════════════════════════════════════════════════════
// BLESSINGS - Elemental weapon enhancements
// ═══════════════════════════════════════════════════════════════════════════

const BLESSINGS = {
  FLAME: {
    name: 'Flame Blessing',
    description: 'Bullets ignite enemies, dealing fire damage over time',
    color: '#ff4400',
    icon: '🔥',
    element: 'fire',
    effectChance: 0.3, // 30% chance per hit
    dotDamage: 0.5, // Damage per tick
    dotDuration: 2000, // 2 seconds
    dotTicks: 4 // Number of ticks
  },
  FROST: {
    name: 'Frost Blessing',
    description: 'Bullets slow enemies for 2 seconds',
    color: '#00ccff',
    icon: '❄',
    element: 'ice',
    effectChance: 0.25, // 25% chance per hit
    slowAmount: 0.5, // 50% speed reduction
    slowDuration: 2000 // 2 seconds
  },
  STORM: {
    name: 'Storm Blessing',
    description: 'Bullets chain lightning to nearby enemies',
    color: '#ffff00',
    icon: '⚡',
    element: 'lightning',
    effectChance: 0.2, // 20% chance per hit
    chainDamage: 1, // Damage to chained enemies
    chainRange: 100, // Range to chain
    chainCount: 2 // Max enemies hit
  },
  EARTH: {
    name: 'Earth Blessing',
    description: 'Bullets knock back enemies on hit',
    color: '#88aa44',
    icon: '🪨',
    element: 'earth',
    effectChance: 0.35, // 35% chance per hit
    knockbackForce: 200 // Knockback strength
  },
  VOID: {
    name: 'Void Blessing',
    description: 'Bullets pierce through enemies',
    color: '#8844ff',
    icon: '🌀',
    element: 'void',
    effectChance: 0.4, // 40% chance to pierce
    pierceDamageReduction: 0.25 // 25% damage loss per pierce
  },
  HOLY: {
    name: 'Holy Blessing',
    description: 'Critical hits heal 1 HP',
    color: '#ffffff',
    icon: '✨',
    element: 'light',
    healChance: 0.1, // 10% chance on crit
    healAmount: 1
  }
};

// Active blessing state
let activeBlessing = null;
let blessingEffects = []; // Active DoT effects, slows, etc.

// Apply blessing to player
function applyBlessing(blessingKey) {
  if (!BLESSINGS[blessingKey]) {
    console.log('Unknown blessing:', blessingKey);
    return false;
  }

  activeBlessing = blessingKey;

  // Visual feedback
  const blessing = BLESSINGS[blessingKey];
  for (let i = 0; i < 30; i++) {
    particles.push(createParticle(player.x, player.y, blessing.color));
  }

  return true;
}

// Get current blessing
function getActiveBlessing() {
  return activeBlessing ? { key: activeBlessing, ...BLESSINGS[activeBlessing] } : null;
}

// Remove blessing
function removeBlessing() {
  activeBlessing = null;
  blessingEffects = [];
}

// Apply blessing effect when hitting enemy
function applyBlessingEffect(enemy, damage) {
  if (!activeBlessing || !enemy || !enemy.active) return;

  const blessing = BLESSINGS[activeBlessing];
  if (Math.random() > blessing.effectChance) return;

  switch (activeBlessing) {
    case 'FLAME':
      // Add fire DoT effect
      enemy.fireStacks = (enemy.fireStacks || 0) + 1;
      enemy.fireDuration = blessing.dotDuration;
      enemy.fireDamage = blessing.dotDamage * enemy.fireStacks;
      enemy.fireTickTimer = 0;
      enemy.fireTicks = blessing.dotTicks;
      // Visual
      for (let i = 0; i < 8; i++) {
        particles.push(createParticle(enemy.x, enemy.y, '#ff6600'));
      }
      break;

    case 'FROST':
      // Apply slow
      enemy.slowed = true;
      enemy.slowAmount = blessing.slowAmount;
      enemy.slowTimer = blessing.slowDuration;
      enemy.originalSpeed = enemy.originalSpeed || enemy.speed;
      enemy.speed = enemy.originalSpeed * (1 - blessing.slowAmount);
      // Visual
      for (let i = 0; i < 6; i++) {
        particles.push(createParticle(enemy.x, enemy.y, '#aaddff'));
      }
      break;

    case 'STORM':
      // Chain lightning to nearby enemies
      let chainCount = 0;
      for (const target of enemies) {
        if (target === enemy || !target.active || chainCount >= blessing.chainCount) continue;
        const dist = Math.hypot(target.x - enemy.x, target.y - enemy.y);
        if (dist <= blessing.chainRange) {
          target.hp -= blessing.chainDamage;
          damageNumbers.push({
            x: target.x,
            y: target.y - target.size,
            damage: blessing.chainDamage,
            timer: 0,
            color: '#ffff00'
          });
          // Lightning line effect
          for (let i = 0; i < 5; i++) {
            const t = i / 5;
            particles.push(createParticle(
              enemy.x + (target.x - enemy.x) * t,
              enemy.y + (target.y - enemy.y) * t,
              '#ffff88'
            ));
          }
          chainCount++;
        }
      }
      break;

    case 'EARTH':
      // Knockback
      const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
      enemy.knockbackX = Math.cos(angle) * blessing.knockbackForce;
      enemy.knockbackY = Math.sin(angle) * blessing.knockbackForce;
      enemy.knockbackTimer = 200;
      // Visual
      for (let i = 0; i < 5; i++) {
        particles.push(createParticle(enemy.x, enemy.y, '#aabb66'));
      }
      break;

    case 'HOLY':
      // Check for heal on crit (handled separately in damage calculation)
      break;
  }
}

// Update blessing effects on enemies
function updateBlessingEffects(deltaTime) {
  for (const enemy of enemies) {
    if (!enemy.active) continue;

    // Fire DoT
    if (enemy.fireDuration > 0) {
      enemy.fireDuration -= deltaTime;
      enemy.fireTickTimer = (enemy.fireTickTimer || 0) + deltaTime;
      if (enemy.fireTickTimer >= enemy.fireDuration / enemy.fireTicks) {
        enemy.fireTickTimer = 0;
        enemy.hp -= enemy.fireDamage;
        damageNumbers.push({
          x: enemy.x + (Math.random() - 0.5) * 20,
          y: enemy.y - enemy.size,
          damage: enemy.fireDamage,
          timer: 0,
          color: '#ff6600'
        });
        particles.push(createParticle(enemy.x, enemy.y, '#ff4400'));
      }
    }

    // Frost slow expiration
    if (enemy.slowed && enemy.slowTimer !== undefined) {
      enemy.slowTimer -= deltaTime;
      if (enemy.slowTimer <= 0) {
        enemy.slowed = false;
        enemy.speed = enemy.originalSpeed || enemy.speed;
      }
    }

    // Knockback
    if (enemy.knockbackTimer > 0) {
      enemy.knockbackTimer -= deltaTime;
      const kb = Math.min(1, enemy.knockbackTimer / 200);
      enemy.x += enemy.knockbackX * kb * deltaTime / 1000;
      enemy.y += enemy.knockbackY * kb * deltaTime / 1000;
      // Clamp to room bounds
      enemy.x = Math.max(50, Math.min(GAME_WIDTH - 50, enemy.x));
      enemy.y = Math.max(UI_HEIGHT + 50, Math.min(ROOM_HEIGHT - 50, enemy.y));
    }
  }
}

// Current upgrade choices
let upgradeChoices = [];
let selectedUpgrade = 0;
let upgradeUsed = false;

// Generate random upgrade choices
function generateUpgradeChoices() {
  const allUpgrades = Object.keys(UPGRADES);
  const choices = [];

  while (choices.length < 3 && choices.length < allUpgrades.length) {
    const upgrade = allUpgrades[Math.floor(Math.random() * allUpgrades.length)];
    if (!choices.includes(upgrade)) {
      choices.push(upgrade);
    }
  }

  upgradeChoices = choices.map(key => ({
    key,
    ...UPGRADES[key]
  }));
  selectedUpgrade = 0;
  upgradeUsed = false;
}

// Select and apply upgrade
function selectUpgrade() {
  if (upgradeChoices.length === 0 || upgradeUsed) return false;
  if (selectedUpgrade < 0 || selectedUpgrade >= upgradeChoices.length) return false;

  const upgrade = upgradeChoices[selectedUpgrade];
  upgrade.effect(player);
  upgradeUsed = true;

  // Visual feedback
  for (let i = 0; i < 20; i++) {
    particles.push(createParticle(player.x, player.y, upgrade.color));
  }

  // Track acquired upgrades
  player.acquiredUpgrades = player.acquiredUpgrades || [];
  player.acquiredUpgrades.push(upgrade.key);

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// SHRINE SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const SHRINES = {
  BLOOD_SHRINE: {
    name: 'Blood Shrine',
    description: 'Sacrifice HP for power',
    color: '#ff4444',
    icon: '🩸',
    cost: { type: 'hp', amount: 1 },
    reward: { type: 'damage', amount: 0.25, desc: '+25% damage' }
  },
  WEALTH_SHRINE: {
    name: 'Wealth Shrine',
    description: 'Pay debris for healing',
    color: '#ffff44',
    icon: '💰',
    cost: { type: 'debris', amount: 100 },
    reward: { type: 'heal', amount: 2, desc: 'Heal 2 HP' }
  },
  GUARDIAN_SHRINE: {
    name: 'Guardian Shrine',
    description: 'Trade speed for defense',
    color: '#4488ff',
    icon: '🛡',
    cost: { type: 'speed', amount: -0.1 },
    reward: { type: 'shield', amount: 2, desc: '+2 Max shields' }
  },
  CHAOS_SHRINE: {
    name: 'Chaos Shrine',
    description: 'Random transformation',
    color: '#ff44ff',
    icon: '🎲',
    cost: { type: 'bomb', amount: 1 },
    reward: { type: 'random', amount: 1, desc: 'Random effect' }
  },
  SPEED_SHRINE: {
    name: 'Speed Shrine',
    description: 'Trade HP for velocity',
    color: '#44ffff',
    icon: '⚡',
    cost: { type: 'hp', amount: 1 },
    reward: { type: 'speed', amount: 0.3, desc: '+30% speed' }
  },
  AMMO_SHRINE: {
    name: 'Ammo Shrine',
    description: 'Trade shields for ammo',
    color: '#88ff88',
    icon: '📦',
    cost: { type: 'shield', amount: 1 },
    reward: { type: 'ammo_cap', amount: 50, desc: '+50 max ammo' }
  }
};

let currentShrine = null;
let shrineUsed = false;

function generateShrine() {
  const shrineKeys = Object.keys(SHRINES);
  const randomKey = shrineKeys[Math.floor(Math.random() * shrineKeys.length)];
  currentShrine = {
    key: randomKey,
    ...SHRINES[randomKey]
  };
  shrineUsed = false;
}

function canUseShrine() {
  if (!currentShrine || shrineUsed) return false;

  const cost = currentShrine.cost;
  switch (cost.type) {
    case 'hp': return player.hp > cost.amount;
    case 'debris': return player.debris >= cost.amount;
    case 'bomb': return player.bombs >= cost.amount;
    case 'shield': return player.shields >= cost.amount || player.maxShields >= cost.amount;
    case 'speed': return true;
    default: return true;
  }
}

function useShrine() {
  if (!canUseShrine()) return false;

  const cost = currentShrine.cost;
  const reward = currentShrine.reward;

  // Pay cost
  switch (cost.type) {
    case 'hp':
      player.hp -= cost.amount;
      break;
    case 'debris':
      player.debris -= cost.amount;
      break;
    case 'bomb':
      player.bombs -= cost.amount;
      break;
    case 'shield':
      if (player.shields >= cost.amount) {
        player.shields -= cost.amount;
      } else {
        player.maxShields -= cost.amount;
      }
      break;
    case 'speed':
      player.speedBonus = (player.speedBonus || 0) + cost.amount;
      break;
  }

  // Receive reward
  switch (reward.type) {
    case 'damage':
      player.damageBonus = (player.damageBonus || 0) + reward.amount;
      break;
    case 'heal':
      player.hp = Math.min(player.maxHP, player.hp + reward.amount);
      break;
    case 'shield':
      player.maxShields += reward.amount;
      player.shields = Math.min(player.maxShields, player.shields + reward.amount);
      break;
    case 'speed':
      player.speedBonus = (player.speedBonus || 0) + reward.amount;
      break;
    case 'ammo_cap':
      player.maxAmmo += reward.amount;
      break;
    case 'random':
      // Random effect
      const effects = ['heal', 'damage', 'speed', 'shield'];
      const randomEffect = effects[Math.floor(Math.random() * effects.length)];
      switch (randomEffect) {
        case 'heal':
          player.hp = player.maxHP;
          break;
        case 'damage':
          player.damageBonus = (player.damageBonus || 0) + 0.2;
          break;
        case 'speed':
          player.speedBonus = (player.speedBonus || 0) + 0.2;
          break;
        case 'shield':
          player.maxShields++;
          player.shields = player.maxShields;
          break;
      }
      break;
  }

  // Visual feedback
  for (let i = 0; i < 15; i++) {
    particles.push(createParticle(player.x, player.y, currentShrine.color));
  }

  shrineUsed = true;
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECRET ROOM SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

// Secret walls per room (direction: north/south/east/west)
let secretWalls = [];
let revealedSecretWalls = [];

// Check if player is near a wall (for bomb reveal)
function checkSecretWalls() {
  if (!currentRoom || !floorMap) return [];

  const nearWalls = [];
  const px = player.x;
  const py = player.y;
  const checkRadius = 100;

  // Check each direction for potential secret rooms
  const [roomX, roomY] = floorMap.currentRoomKey.split(',').map(Number);

  // North wall (top)
  if (py < UI_HEIGHT + checkRadius) {
    const secretKey = `${roomX},${roomY + 1}`;
    if (!floorMap.rooms[secretKey] && !revealedSecretWalls.includes(`${floorMap.currentRoomKey}-north`)) {
      nearWalls.push({ direction: 'north', x: GAME_WIDTH / 2, y: UI_HEIGHT });
    }
  }

  // South wall (bottom)
  if (py > ROOM_HEIGHT - checkRadius) {
    const secretKey = `${roomX},${roomY - 1}`;
    if (!floorMap.rooms[secretKey] && !revealedSecretWalls.includes(`${floorMap.currentRoomKey}-south`)) {
      nearWalls.push({ direction: 'south', x: GAME_WIDTH / 2, y: ROOM_HEIGHT });
    }
  }

  // East wall (right)
  if (px > GAME_WIDTH - checkRadius) {
    const secretKey = `${roomX + 1},${roomY}`;
    if (!floorMap.rooms[secretKey] && !revealedSecretWalls.includes(`${floorMap.currentRoomKey}-east`)) {
      nearWalls.push({ direction: 'east', x: GAME_WIDTH, y: (UI_HEIGHT + ROOM_HEIGHT) / 2 });
    }
  }

  // West wall (left)
  if (px < checkRadius) {
    const secretKey = `${roomX - 1},${roomY}`;
    if (!floorMap.rooms[secretKey] && !revealedSecretWalls.includes(`${floorMap.currentRoomKey}-west`)) {
      nearWalls.push({ direction: 'west', x: 0, y: (UI_HEIGHT + ROOM_HEIGHT) / 2 });
    }
  }

  return nearWalls;
}

// Reveal a secret room with bomb
function revealSecretRoom(direction) {
  if (!currentRoom || !floorMap) return false;

  const [roomX, roomY] = floorMap.currentRoomKey.split(',').map(Number);
  let secretX, secretY;

  switch (direction) {
    case 'north': secretX = roomX; secretY = roomY + 1; break;
    case 'south': secretX = roomX; secretY = roomY - 1; break;
    case 'east': secretX = roomX + 1; secretY = roomY; break;
    case 'west': secretX = roomX - 1; secretY = roomY; break;
    default: return false;
  }

  const secretKey = `${secretX},${secretY}`;
  if (floorMap.rooms[secretKey]) return false; // Room already exists

  // Create secret room
  const secretRoom = {
    x: secretX,
    y: secretY,
    type: 'secret',
    enemies: [],
    cleared: true,
    visited: false,
    doors: [],
    pickups: generateSecretRoomLoot()
  };

  // Add door connections
  const oppositeDir = {
    'north': 'south',
    'south': 'north',
    'east': 'west',
    'west': 'east'
  };

  secretRoom.doors.push({
    direction: oppositeDir[direction],
    key: floorMap.currentRoomKey,
    locked: false
  });

  currentRoom.doors.push({
    direction: direction,
    key: secretKey,
    locked: false
  });

  floorMap.rooms[secretKey] = secretRoom;

  // Mark wall as revealed
  revealedSecretWalls.push(`${floorMap.currentRoomKey}-${direction}`);

  // Visual effect
  let wallX, wallY;
  switch (direction) {
    case 'north': wallX = GAME_WIDTH / 2; wallY = UI_HEIGHT + 20; break;
    case 'south': wallX = GAME_WIDTH / 2; wallY = ROOM_HEIGHT - 20; break;
    case 'east': wallX = GAME_WIDTH - 20; wallY = (UI_HEIGHT + ROOM_HEIGHT) / 2; break;
    case 'west': wallX = 20; wallY = (UI_HEIGHT + ROOM_HEIGHT) / 2; break;
  }

  // Spawn reveal particles
  for (let i = 0; i < 30; i++) {
    particles.push(createParticle(wallX, wallY, '#ffff00'));
    particles.push(createParticle(wallX, wallY, '#00ff88'));
  }

  screenShake = 300;
  screenShakeIntensity = 10;

  return true;
}

// Draw cracked wall indicators
function drawCrackedWalls() {
  if (!currentRoom || !floorMap) return;

  const secretWalls = checkSecretWalls();
  if (secretWalls.length === 0) return;

  // Animate cracks
  const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;

  ctx.strokeStyle = `rgba(128, 128, 64, ${pulse})`;
  ctx.lineWidth = 2;

  for (const wall of secretWalls) {
    let startX, startY, endX, endY;

    switch (wall.direction) {
      case 'north':
        // Draw cracks on top wall
        startX = GAME_WIDTH / 2 - 30;
        startY = UI_HEIGHT;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(startX + i * 12, startY);
          ctx.lineTo(startX + i * 12 + 6, startY + 8);
          ctx.lineTo(startX + i * 12 + 12, startY + 3);
          ctx.stroke();
        }
        break;

      case 'south':
        // Draw cracks on bottom wall
        startX = GAME_WIDTH / 2 - 30;
        startY = ROOM_HEIGHT - 10;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(startX + i * 12, startY + 10);
          ctx.lineTo(startX + i * 12 + 6, startY + 2);
          ctx.lineTo(startX + i * 12 + 12, startY + 7);
          ctx.stroke();
        }
        break;

      case 'east':
        // Draw cracks on right wall
        startX = GAME_WIDTH - 10;
        startY = (UI_HEIGHT + ROOM_HEIGHT) / 2 - 30;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(startX + 10, startY + i * 12);
          ctx.lineTo(startX + 2, startY + i * 12 + 6);
          ctx.lineTo(startX + 7, startY + i * 12 + 12);
          ctx.stroke();
        }
        break;

      case 'west':
        // Draw cracks on left wall
        startX = 0;
        startY = (UI_HEIGHT + ROOM_HEIGHT) / 2 - 30;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(startX, startY + i * 12);
          ctx.lineTo(startX + 8, startY + i * 12 + 6);
          ctx.lineTo(startX + 3, startY + i * 12 + 12);
          ctx.stroke();
        }
        break;
    }
  }
}

// Generate loot for secret rooms
function generateSecretRoomLoot() {
  const loot = [];
  const centerX = GAME_WIDTH / 2;
  const centerY = (UI_HEIGHT + ROOM_HEIGHT) / 2;

  // Always have good rewards in secret rooms
  // Random high-value pickup
  const pickupTypes = [
    { type: 'health', value: 1, color: '#ff4444' },
    { type: 'shield', value: 1, color: '#4488ff' },
    { type: 'bomb', value: 1, color: '#ff8800' },
    { type: 'debris', value: 150, color: '#88ff88' }
  ];

  // Add 3-5 valuable pickups
  const numPickups = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numPickups; i++) {
    const pickup = pickupTypes[Math.floor(Math.random() * pickupTypes.length)];
    const angle = (i / numPickups) * Math.PI * 2;
    const dist = 50 + Math.random() * 30;
    loot.push({
      x: centerX + Math.cos(angle) * dist,
      y: centerY + Math.sin(angle) * dist,
      type: pickup.type,
      value: pickup.value,
      size: 12,
      color: pickup.color
    });
  }

  // 50% chance of a cartridge in secret rooms
  if (Math.random() < 0.5) {
    const cartridgeKey = getRandomCartridge();
    const cartridge = CARTRIDGES[cartridgeKey];
    loot.push({
      x: centerX,
      y: centerY,
      type: 'cartridge',
      cartridge: cartridgeKey,
      size: 14,
      color: cartridge.color
    });
  }

  return loot;
}

// Generate random shop inventory
function generateShopInventory() {
  const allItems = Object.keys(SHOP_ITEMS);
  const inventory = [];

  // Always include at least one consumable
  const consumables = ['HEALTH', 'SHIELD', 'BOMB', 'AMMO'];
  inventory.push(consumables[Math.floor(Math.random() * consumables.length)]);

  // Add 2-3 more random items
  const numItems = 2 + Math.floor(Math.random() * 2);
  while (inventory.length < numItems + 1) {
    const item = allItems[Math.floor(Math.random() * allItems.length)];
    if (!inventory.includes(item)) {
      inventory.push(item);
    }
  }

  shopInventory = inventory.map(key => ({
    key,
    ...SHOP_ITEMS[key],
    purchased: false
  }));
  selectedShopItem = 0;
}

// Try to purchase selected item
function purchaseShopItem() {
  if (shopInventory.length === 0) return false;
  if (selectedShopItem < 0 || selectedShopItem >= shopInventory.length) return false;

  const item = shopInventory[selectedShopItem];
  if (item.purchased) return false;
  if (player.debris < item.price) return false;
  if (!item.canBuy(player)) return false;

  // Make purchase
  player.debris -= item.price;
  const success = item.effect(player);

  if (success) {
    item.purchased = true;
    // Spawn purchase particles
    for (let i = 0; i < 10; i++) {
      particles.push(createParticle(player.x, player.y, item.color));
    }
    return true;
  }

  // Refund if effect failed
  player.debris += item.price;
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// ENEMY DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const ENEMIES = {
  GHOST: {
    name: 'Ghost',
    type: 'undead',
    hp: 50,
    debris: 10,
    speed: 80,
    behavior: 'chase',
    size: 16,
    color: '#88ff88',
    attacks: []
  },
  DRONE: {
    name: 'Drone',
    type: 'machine',
    hp: 70,
    debris: 30,
    speed: 150,
    behavior: 'dash_to_player',
    size: 16,
    color: '#8888ff',
    attacks: [{
      type: 'spread',
      damage: 1,
      count: 3,
      angle: 30,
      cooldown: 2000,
      bulletSpeed: 200
    }]
  },
  TURRET: {
    name: 'Turret',
    type: 'machine',
    hp: 90,
    debris: 25,
    speed: 0,
    behavior: 'stationary',
    size: 20,
    color: '#ff8800',
    attacks: [{
      type: 'aimed',
      damage: 1,
      cooldown: 1500,
      bulletSpeed: 250
    }]
  },
  SEEKER: {
    name: 'Seeker',
    type: 'construct',
    hp: 120,
    debris: 37,
    speed: 100,
    behavior: 'wander',
    size: 18,
    color: '#ff00ff',
    attacks: [{
      type: 'spread',
      damage: 1,
      count: 2,
      angle: 20,
      cooldown: 2500,
      bulletSpeed: 180
    }]
  },
  SWARMER: {
    name: 'Swarmer',
    type: 'creature',
    hp: 12,
    debris: 0,
    speed: 200,
    behavior: 'chase',
    size: 10,
    color: '#ffff00',
    attacks: []
  },
  PYROMANCER: {
    name: 'Pyromancer',
    type: 'mage',
    hp: 110,
    debris: 80,
    speed: 60,
    behavior: 'wander',
    size: 20,
    color: '#ff4400',
    attacks: [{
      type: 'fireball',
      damage: 1,
      cooldown: 3000,
      bulletSpeed: 150,
      explosive: true
    }]
  },
  BLOB: {
    name: 'Blob',
    type: 'creature',
    hp: 150,
    debris: 55,
    speed: 80,
    behavior: 'bounce',
    size: 24,
    color: '#00ff00',
    attacks: [],
    splitsOnDeath: true,
    splitCount: 3,
    splitInto: 'JELLY'
  },
  JELLY: {
    name: 'Jelly',
    type: 'creature',
    hp: 30,
    debris: 10,
    speed: 140,
    behavior: 'chase',
    size: 12,
    color: '#66ff66',
    attacks: [],
    splitsOnDeath: true,
    splitCount: 2,
    splitInto: 'MINI_JELLY'
  },
  MINI_JELLY: {
    name: 'Mini Jelly',
    type: 'creature',
    hp: 15,
    debris: 5,
    speed: 180,
    behavior: 'chase',
    size: 8,
    color: '#88ff88',
    attacks: []
  },
  WRAITH: {
    name: 'Wraith',
    type: 'undead',
    hp: 100,
    debris: 45,
    speed: 120,
    behavior: 'horizontal_hover',
    size: 22,
    color: '#6644aa',
    attacks: [
      {
        type: 'spread',
        damage: 1,
        count: 5,
        angle: 45,
        cooldown: 2500,
        bulletSpeed: 180
      },
      {
        type: 'charge',
        damage: 2,
        cooldown: 4000
      }
    ]
  },
  HEAVY_TURRET_BLUE: {
    name: 'Heavy Turret (Blue)',
    type: 'machine',
    hp: 180,
    debris: 55,
    speed: 0,
    behavior: 'stationary',
    size: 28,
    color: '#4488ff',
    attacks: [{
      type: 'spread',
      damage: 1,
      count: 5,
      angle: 60,
      cooldown: 2000,
      bulletSpeed: 200
    }]
  },
  HEAVY_TURRET_GREEN: {
    name: 'Heavy Turret (Green)',
    type: 'machine',
    hp: 150,
    debris: 50,
    speed: 0,
    behavior: 'stationary',
    size: 28,
    color: '#44ff88',
    attacks: [{
      type: 'aimed',
      damage: 1,
      cooldown: 400,
      bulletSpeed: 350
    }]
  },
  HEAVY_TURRET_ORANGE: {
    name: 'Heavy Turret (Orange)',
    type: 'machine',
    hp: 200,
    debris: 60,
    speed: 0,
    behavior: 'stationary',
    size: 28,
    color: '#ff8844',
    attacks: [{
      type: 'spread',
      damage: 2,
      count: 3,
      angle: 20,
      cooldown: 2500,
      bulletSpeed: 280
    }]
  },
  HEAVY_TURRET_PURPLE: {
    name: 'Heavy Turret (Purple)',
    type: 'machine',
    hp: 220,
    debris: 65,
    speed: 0,
    behavior: 'stationary',
    size: 28,
    color: '#aa44ff',
    attacks: [{
      type: 'ring',
      damage: 1,
      count: 12,
      cooldown: 3000,
      bulletSpeed: 150
    }]
  },
  MIMIC: {
    name: 'Mimic',
    type: 'construct',
    hp: 130,
    debris: 70,
    speed: 180,
    behavior: 'mirror_player',
    size: 18,
    color: '#ff88ff',
    attacks: [{
      type: 'vulcan_burst',
      damage: 1,
      count: 8,
      cooldown: 3500,
      bulletSpeed: 300
    }]
  },
  CRYOMANCER: {
    name: 'Cryomancer',
    type: 'mage',
    hp: 120,
    debris: 85,
    speed: 50,
    behavior: 'wander',
    size: 20,
    color: '#88ddff',
    attacks: [
      {
        type: 'ice',
        damage: 1,
        cooldown: 2000,
        bulletSpeed: 200,
        slowDuration: 2000,
        slowAmount: 0.5
      },
      {
        type: 'ice_spread',
        damage: 1,
        count: 3,
        angle: 30,
        cooldown: 4000,
        bulletSpeed: 160,
        slowDuration: 1500,
        slowAmount: 0.4
      }
    ]
  },
  NECROMANCER: {
    name: 'Necromancer',
    type: 'undead',
    hp: 160,
    debris: 100,
    speed: 40,
    behavior: 'retreat',
    size: 22,
    color: '#8844aa',
    attacks: [
      {
        type: 'ring',
        damage: 1,
        count: 8,
        cooldown: 3000,
        bulletSpeed: 150
      },
      {
        type: 'summon_ghost',
        cooldown: 5000,
        maxSummons: 3
      }
    ]
  },
  HERMIT: {
    name: 'Hermit',
    type: 'undead',
    hp: 80,
    debris: 60,
    speed: 90,
    behavior: 'flee',
    size: 18,
    color: '#5566aa',
    attacks: [
      {
        type: 'summon_ghost',
        cooldown: 3500,
        maxSummons: 4
      }
    ]
  },
  GIANT_GHOST: {
    name: 'Giant Ghost',
    type: 'undead',
    hp: 250,
    debris: 150,
    speed: 50,
    behavior: 'slow_chase',
    size: 32,
    color: '#aaffaa',
    attacks: [
      {
        type: 'ring',
        damage: 1,
        count: 8,
        cooldown: 4000,
        bulletSpeed: 120
      }
    ],
    hasOrbitingMinions: true,
    orbitMinionCount: 4,
    orbitRadius: 50
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// BOSS DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const BOSSES = {
  CHAMBERLORD: {
    name: 'Chamberlord',
    type: 'construct',
    hp: 1500,
    debris: 500,
    speed: 0,
    size: 64,
    color: '#ff00ff',
    phases: [
      {
        hpThreshold: 1.0,
        attacks: [
          { type: 'spread', count: 5, damage: 1, cooldown: 2000, bulletSpeed: 200 },
          { type: 'ring', count: 8, damage: 1, cooldown: 3000, bulletSpeed: 150 }
        ],
        movement: 'teleport'
      },
      {
        hpThreshold: 0.33,
        attacks: [
          { type: 'spiral', damage: 1, cooldown: 100, bulletSpeed: 180 },
          { type: 'ring', count: 12, damage: 1, cooldown: 2000, bulletSpeed: 200 }
        ],
        movement: 'center'
      }
    ]
  },
  GUARDIAN: {
    name: 'Guardian',
    type: 'undead',
    hp: 1400,
    debris: 500,
    speed: 60,
    size: 56,
    color: '#aaaaff',
    phases: [
      {
        hpThreshold: 1.0,
        attacks: [
          { type: 'aimed', damage: 1, cooldown: 1000, bulletSpeed: 300 },
          { type: 'spread', count: 7, damage: 1, cooldown: 2500, bulletSpeed: 180 }
        ],
        movement: 'chase_slow'
      }
    ]
  },
  GRINDER: {
    name: 'Grinder',
    type: 'machine',
    hp: 1800,
    debris: 600,
    speed: 100,
    size: 60,
    color: '#ff6633',
    phases: [
      {
        hpThreshold: 1.0,
        attacks: [
          { type: 'charge', damage: 2, cooldown: 3500 },
          { type: 'spawn_saw', maxSaws: 4, sawSpeed: 150, sawDamage: 1, cooldown: 5000 }
        ],
        movement: 'chase'
      },
      {
        hpThreshold: 0.5,
        attacks: [
          { type: 'charge', damage: 2, cooldown: 2500 },
          { type: 'spawn_saw', maxSaws: 6, sawSpeed: 200, sawDamage: 1, cooldown: 3500 },
          { type: 'ring', count: 10, damage: 1, cooldown: 4000, bulletSpeed: 150 }
        ],
        movement: 'chase'
      }
    ]
  },
  RINGLEADER: {
    name: 'Ringleader',
    type: 'undead',
    hp: 1600,
    debris: 550,
    speed: 50,
    size: 52,
    color: '#9944cc',
    hasRotatingRing: true,
    ringRadius: 80,
    ringBulletCount: 12,
    ringRotationSpeed: 1.5,
    phases: [
      {
        hpThreshold: 1.0,
        attacks: [
          { type: 'summon_ghost', maxSummons: 4, cooldown: 4000 },
          { type: 'spread', count: 5, damage: 1, cooldown: 2500, bulletSpeed: 180, angle: 60 }
        ],
        movement: 'wander'
      },
      {
        hpThreshold: 0.5,
        attacks: [
          { type: 'summon_ghost', maxSummons: 6, cooldown: 3000 },
          { type: 'ring', count: 16, damage: 1, cooldown: 3000, bulletSpeed: 200 },
          { type: 'spiral', damage: 1, cooldown: 80, bulletSpeed: 180 }
        ],
        movement: 'chase_slow'
      }
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PICKUP DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const PICKUPS = {
  HP_SMALL: { type: 'health', value: 1, color: '#ff4444', size: 12 },
  HP_LARGE: { type: 'health', value: 2, color: '#ff0000', size: 16 },
  SHIELD: { type: 'shield', value: 1, color: '#0088ff', size: 14 },
  AMMO_SMALL: { type: 'ammo', value: 0.1, color: '#ffaa00', size: 10 },
  AMMO_LARGE: { type: 'ammo', value: 0.25, color: '#ffcc00', size: 14 },
  BOMB: { type: 'bomb', value: 1, color: '#ff00ff', size: 14 },
  DEBRIS_SMALL: { type: 'debris', value: 50, color: '#ffff00', size: 8 },
  DEBRIS_LARGE: { type: 'debris', value: 200, color: '#ffff88', size: 12 }
};

// ═══════════════════════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════════════════════

let canvas, ctx;
let gameState = 'menu'; // menu, playing, paused, gameover, victory
let lastTime = 0;
let deltaTime = 0;

// Input state
const keys = {};
const mouse = { x: 0, y: 0, down: false };

// Player
let player = null;

// Game objects
let playerBullets = [];
let enemyBullets = [];
let enemies = [];
let pickups = [];
let particles = [];
let damageNumbers = [];
let muzzleFlashes = [];
let bombExplosions = [];
let dashTrails = [];
let electricFields = []; // Thunderhead weapon fields
let saws = []; // Grinder boss sawblade hazards
let orbitRunes = []; // Runic weapon orbiting runes

// Floor/Room system
let currentFloor = 1;
let currentRoom = null;
let floorMap = null;
let roomsCleared = 0;
let minibossesKilled = 0;
let floorExitPortal = null;
let floorTransitionTimer = 0;

// Boss reward choice system
let bossRewardChoices = null;
let selectedBossReward = 0;
let bossRewardChosen = false;

const BOSS_REWARDS = {
  HP: {
    name: 'Vitality',
    description: '+1 Max HP, Full Heal',
    icon: '❤',
    color: '#ff4444',
    effect: (player) => {
      player.maxHP += 1;
      player.hp = player.maxHP;
    }
  },
  DAMAGE: {
    name: 'Power',
    description: '+15% Damage',
    icon: '⚔',
    color: '#ff8844',
    effect: (player) => {
      player.permanentDamageBonus += 0.15;
    }
  },
  SHIELD: {
    name: 'Protection',
    description: '+2 Shields',
    icon: '🛡',
    color: '#4488ff',
    effect: (player) => {
      player.shields = Math.min(player.maxShields, player.shields + 2);
    }
  }
};

function generateBossRewards() {
  // Always offer HP and Damage, plus one random bonus
  const rewardKeys = ['HP', 'DAMAGE', 'SHIELD'];
  return rewardKeys.map(key => ({ key, ...BOSS_REWARDS[key] }));
}

function selectBossReward(index) {
  if (!bossRewardChoices || bossRewardChosen || index < 0 || index >= bossRewardChoices.length) {
    return false;
  }

  const reward = bossRewardChoices[index];
  reward.effect(player);
  bossRewardChosen = true;

  // Particles
  for (let i = 0; i < 30; i++) {
    particles.push(createParticle(player.x, player.y, reward.color));
  }

  // Spawn floor exit portal now
  floorExitPortal = {
    x: GAME_WIDTH / 2,
    y: ROOM_HEIGHT / 2 + 80,
    radius: 30,
    active: true,
    pulseTimer: 0
  };

  return true;
}

// Timing
let roomClearTimer = 0;
let screenShake = 0;
let screenShakeIntensity = 0;
let hitFlashTimer = 0; // Red flash on player damage
let phaseFlashTimer = 0; // White flash on boss phase change

// Map overlay
let showMap = false;
let showFullFloorMap = false;
let fullMapTimer = 0;
const FULL_MAP_DURATION = 3000; // 3 seconds

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER CLASS
// ═══════════════════════════════════════════════════════════════════════════

class Player {
  constructor() {
    // Get ship settings
    const ship = getShip();
    this.shipType = selectedShip;
    this.shipColor = ship.color;
    this.passive = ship.passive;

    this.x = GAME_WIDTH / 2;
    this.y = ROOM_HEIGHT - 80;
    this.vx = 0;
    this.vy = 0;
    this.width = 32;
    this.height = 32;
    this.hitboxRadius = 4;

    // Stats from ship
    this.hp = ship.hp;
    this.maxHP = ship.hp;
    this.shields = ship.shields;
    this.maxShields = Math.max(4, ship.shields);

    // Weapons from ship
    let startWeapon = ship.startWeapon;
    if (startWeapon === 'RANDOM') {
      const weaponKeys = Object.keys(WEAPONS);
      startWeapon = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
    }
    this.currentWeapon = { ...WEAPONS[startWeapon] || WEAPONS.PEASHOOTER };
    this.ammo = 100;
    this.maxAmmo = 100;
    this.damageMultiplier = 1.0;
    this.permanentDamageBonus = ship.passive === 'DAMAGE_BOOST' ? 0.5 : 0;

    // Bombs (modified by ship passive)
    this.bombs = ship.passive === 'EXPLOSIVE' ? 4 : 2;
    this.maxBombs = ship.passive === 'EXPLOSIVE' ? 8 : 6;
    this.bombRechargeRooms = ship.passive === 'EXPLOSIVE' ? 2 : 3;
    this.roomsSinceBombRecharge = 0;

    // Movement from ship
    this.normalSpeed = ship.speed;
    this.focusSpeed = ship.focusSpeed;
    this.isFocused = false;

    // Dash from ship
    this.dashDistance = ship.dashDistance;
    this.dashDuration = 100;
    this.dashCooldown = ship.passive === 'QUICK_DASH' ? 250 : 500;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.isDashing = false;
    this.dashVx = 0;
    this.dashVy = 0;

    // Invincibility
    this.isInvincible = false;
    this.invincibilityTimer = 0;
    this.invincibilityTime = 1000;

    // Firing
    this.fireTimer = 0;
    this.isFiring = false;

    // Charge weapon
    this.chargeTime = 0;
    this.isCharging = false;

    // Drill weapon
    this.isDrilling = false;
    this.drillAngle = -Math.PI / 2; // Pointing up initially
    this.drillTickTimer = 0;

    // Clip/Reload system
    this.clipAmmo = 0; // Current ammo in clip
    this.maxClip = 0; // Max clip size (0 = no clip)
    this.reloadTimer = 0;
    this.isReloading = false;

    // Slow effect
    this.slowTimer = 0;
    this.slowAmount = 1.0; // 1.0 = no slow, 0.5 = 50% slower

    // Economy
    this.debris = 0;
    this.multiplier = 1.0;
    this.maxMultiplier = 3.0;

    // UI display values (for smooth transitions)
    this.displayHP = this.hp;
    this.displayShields = this.shields;
    this.displayAmmo = this.ammo;
    this.hpFlashTimer = 0; // Flash when damaged
    this.ammoRefillTimer = 0; // Flash when ammo refilled

    // Upgrades
    this.hasAutobomb = false;
    this.hasScanner = false;
  }

  get speed() {
    const baseSpeed = this.isFocused ? this.focusSpeed : this.normalSpeed;
    return baseSpeed * this.slowAmount;
  }

  get totalDamageMultiplier() {
    const difficulty = getDifficulty();
    return this.damageMultiplier * (1 + this.permanentDamageBonus) * difficulty.playerDamageMult;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENEMY CLASS
// ═══════════════════════════════════════════════════════════════════════════

class Enemy {
  constructor(template, x, y) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.template = template;
    this.name = template.name;
    this.type = template.type;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    // Apply difficulty multipliers to health
    const difficulty = getDifficulty();
    const baseHP = Math.floor(template.hp * difficulty.enemyHealthMult);
    this.hp = baseHP;
    this.maxHP = baseHP;
    this.debris = Math.floor(template.debris * difficulty.debrisMultiplier);
    this.speed = template.speed;
    this.behavior = template.behavior;
    this.size = template.size;
    this.color = template.color;
    this.attacks = template.attacks ? template.attacks.map(a => ({ ...a, timer: Math.random() * a.cooldown })) : [];

    // Boss properties
    this.isBoss = !!template.phases;
    this.phases = template.phases ? template.phases.map(phase => ({
      ...phase,
      attacks: phase.attacks.map(a => ({ ...a, timer: Math.random() * a.cooldown }))
    })) : null;
    this.currentPhase = 0;
    this.spiralAngle = 0;

    // Rotating ring (for Ringleader boss)
    this.hasRotatingRing = template.hasRotatingRing || false;
    this.ringRadius = template.ringRadius || 80;
    this.ringBulletCount = template.ringBulletCount || 12;
    this.ringRotationSpeed = template.ringRotationSpeed || 1;
    this.ringAngle = 0;

    // Behavior state
    this.behaviorTimer = 0;
    this.targetX = x;
    this.targetY = y;
    this.wanderAngle = Math.random() * Math.PI * 2;

    // Split on death
    this.splitsOnDeath = template.splitsOnDeath || false;
    this.splitCount = template.splitCount || 0;
    this.splitInto = template.splitInto || 'SWARMER';

    // Flash on hit
    this.flashTimer = 0;

    // Spawn animation
    this.spawnTimer = 400; // 400ms spawn animation
    this.spawning = true;

    // Damage over time
    this.dotEffects = []; // Array of {damage, ticksRemaining, tickInterval, tickTimer}

    // Orbiting minions
    this.hasOrbitingMinions = template.hasOrbitingMinions || false;
    this.orbitMinionCount = template.orbitMinionCount || 0;
    this.orbitRadius = template.orbitRadius || 40;
    this.orbitAngle = 0;
    this.orbitMinions = []; // Array of {alive: bool, hp: number}
    if (this.hasOrbitingMinions) {
      for (let i = 0; i < this.orbitMinionCount; i++) {
        this.orbitMinions.push({ alive: true, hp: 20 });
      }
    }

    // Active state
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;

    // Update spawn animation
    if (this.spawning) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawning = false;
        this.spawnTimer = 0;
      }
      return; // Don't move/attack while spawning
    }

    this.flashTimer = Math.max(0, this.flashTimer - dt);
    this.behaviorTimer += dt;

    // Process damage over time effects
    this.updateDoT(dt);

    // Update orbiting minions
    if (this.hasOrbitingMinions) {
      this.orbitAngle += dt * 0.002; // Rotate orbit
    }

    // Update rotating ring (Ringleader)
    if (this.hasRotatingRing) {
      this.ringAngle += this.ringRotationSpeed * dt / 1000;

      // Check player collision with ring bullets
      if (player && !player.isInvincible) {
        for (let i = 0; i < this.ringBulletCount; i++) {
          const angle = this.ringAngle + (i / this.ringBulletCount) * Math.PI * 2;
          const bulletX = this.x + Math.cos(angle) * this.ringRadius;
          const bulletY = this.y + Math.sin(angle) * this.ringRadius;

          const dx = player.x - bulletX;
          const dy = player.y - bulletY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < player.hitboxSize + 6) {
            playerTakeDamage(1);
            break; // Only hit once per frame
          }
        }
      }
    }

    // Update phase for bosses
    if (this.isBoss && this.phases) {
      const hpPercent = this.hp / this.maxHP;
      for (let i = this.phases.length - 1; i >= 0; i--) {
        if (hpPercent <= this.phases[i].hpThreshold) {
          if (i > this.currentPhase) {
            this.currentPhase = i;
            this.onPhaseChange();
          }
          break;
        }
      }
    }

    // Execute behavior
    this.executeBehavior(dt);

    // Execute attacks
    this.executeAttacks(dt);

    // Apply velocity
    this.x += this.vx * dt / 1000;
    this.y += this.vy * dt / 1000;

    // Clamp to room bounds
    this.x = Math.max(this.size, Math.min(GAME_WIDTH - this.size, this.x));
    this.y = Math.max(UI_HEIGHT + this.size, Math.min(ROOM_HEIGHT - this.size, this.y));
  }

  onPhaseChange() {
    // Reset attack timers
    const phase = this.phases[this.currentPhase];
    this.attacks = phase.attacks.map(a => ({ ...a, timer: 0 }));

    // Enhanced phase change effect
    // Particle burst from boss
    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 / 40) * i;
      const speed = 100 + Math.random() * 150;
      particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 600 + Math.random() * 400,
        maxLife: 1000,
        size: 4 + Math.random() * 6,
        color: this.color
      });
    }

    // White flash particles
    for (let i = 0; i < 15; i++) {
      particles.push(createParticle(this.x, this.y, '#ffffff'));
    }

    // Create phase transition ring effect (using bomb explosion system)
    bombExplosions.push({
      x: this.x,
      y: this.y,
      radius: 0,
      maxRadius: 200,
      life: 400,
      maxLife: 400,
      color: this.color
    });

    // Screen flash
    phaseFlashTimer = 200;

    // Strong screen shake
    screenShake = 500;
    screenShakeIntensity = 12;

    // Log event
    if (window.testHarness) {
      window.testHarness.logEvent('boss_phase_change', {
        bossName: this.name,
        newPhase: this.currentPhase,
        hpPercent: Math.round((this.hp / this.maxHP) * 100)
      });
    }
  }

  executeBehavior(dt) {
    const phase = this.isBoss && this.phases ? this.phases[this.currentPhase] : null;
    const movement = phase ? phase.movement : this.behavior;

    switch (movement) {
      case 'chase':
        this.chasePlayer();
        break;
      case 'chase_slow':
        this.chasePlayer(0.5);
        break;
      case 'stationary':
        this.vx = 0;
        this.vy = 0;
        break;
      case 'wander':
        this.wander(dt);
        break;
      case 'bounce':
        this.bounce();
        break;
      case 'dash_to_player':
        this.dashToPlayer(dt);
        break;
      case 'teleport':
        this.teleportBehavior(dt);
        break;
      case 'center':
        this.moveToCenter();
        break;
      case 'horizontal_hover':
        this.horizontalHover(dt);
        break;
      case 'mirror_player':
        this.mirrorPlayer();
        break;
      case 'retreat':
        this.retreatFromPlayer();
        break;
      case 'flee':
        this.fleeFromPlayer();
        break;
      case 'slow_chase':
        this.chasePlayer(0.5); // Chase at half speed
        break;
    }
  }

  retreatFromPlayer() {
    if (!player) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If player is close, retreat away
    if (dist < 200) {
      const angle = Math.atan2(dy, dx);
      this.vx = -Math.cos(angle) * this.speed;
      this.vy = -Math.sin(angle) * this.speed;
    } else {
      // Otherwise, slow wander
      this.vx *= 0.9;
      this.vy *= 0.9;
      if (Math.random() < 0.01) {
        this.vx = (Math.random() - 0.5) * this.speed * 0.5;
        this.vy = (Math.random() - 0.5) * this.speed * 0.5;
      }
    }
  }

  fleeFromPlayer() {
    if (!player) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Always flee from player, faster when closer
    const fleeAngle = Math.atan2(dy, dx) + Math.PI; // Opposite direction
    const speedMod = dist < 150 ? 1.5 : (dist < 300 ? 1.2 : 1.0);

    // Add some jitter to make movement less predictable
    const jitter = (Math.random() - 0.5) * 0.5;
    const finalAngle = fleeAngle + jitter;

    this.vx = Math.cos(finalAngle) * this.speed * speedMod;
    this.vy = Math.sin(finalAngle) * this.speed * speedMod;

    // If near wall, try to find corner
    const margin = 50;
    if (this.x < margin || this.x > GAME_WIDTH - margin ||
        this.y < UI_HEIGHT + margin || this.y > ROOM_HEIGHT + UI_HEIGHT - margin) {
      // Slow down in corners (safety)
      this.vx *= 0.7;
      this.vy *= 0.7;
    }
  }

  chasePlayer(speedMod = 1) {
    if (!player) return;
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    this.vx = Math.cos(angle) * this.speed * speedMod;
    this.vy = Math.sin(angle) * this.speed * speedMod;
  }

  wander(dt) {
    this.behaviorTimer += dt;
    if (this.behaviorTimer > 2000) {
      this.wanderAngle = Math.random() * Math.PI * 2;
      this.behaviorTimer = 0;
    }
    this.vx = Math.cos(this.wanderAngle) * this.speed * 0.5;
    this.vy = Math.sin(this.wanderAngle) * this.speed * 0.5;
  }

  bounce() {
    if (this.vx === 0 && this.vy === 0) {
      const angle = Math.random() * Math.PI * 2;
      this.vx = Math.cos(angle) * this.speed;
      this.vy = Math.sin(angle) * this.speed;
    }

    if (this.x <= this.size || this.x >= GAME_WIDTH - this.size) {
      this.vx *= -1;
    }
    if (this.y <= UI_HEIGHT + this.size || this.y >= ROOM_HEIGHT - this.size) {
      this.vy *= -1;
    }
  }

  dashToPlayer(dt) {
    if (!player) return;

    this.behaviorTimer += dt;
    if (this.behaviorTimer > 3000) {
      // Dash towards player
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      this.vx = Math.cos(angle) * this.speed * 2;
      this.vy = Math.sin(angle) * this.speed * 2;
      this.behaviorTimer = 0;
    } else if (this.behaviorTimer > 500) {
      // Slow down
      this.vx *= 0.95;
      this.vy *= 0.95;
    }
  }

  teleportBehavior(dt) {
    this.behaviorTimer += dt;
    if (this.behaviorTimer > 4000) {
      this.x = 100 + Math.random() * (GAME_WIDTH - 200);
      this.y = UI_HEIGHT + 100 + Math.random() * (ROOM_HEIGHT - UI_HEIGHT - 200);
      this.behaviorTimer = 0;

      for (let i = 0; i < 10; i++) {
        particles.push(createParticle(this.x, this.y, this.color));
      }
    }
  }

  moveToCenter() {
    const centerX = GAME_WIDTH / 2;
    const centerY = (UI_HEIGHT + ROOM_HEIGHT) / 2;
    const dx = centerX - this.x;
    const dy = centerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 10) {
      this.vx = (dx / dist) * 100;
      this.vy = (dy / dist) * 100;
    } else {
      this.vx = 0;
      this.vy = 0;
    }
  }

  horizontalHover(dt) {
    // Initialize hover direction
    if (this.hoverDir === undefined) {
      this.hoverDir = Math.random() > 0.5 ? 1 : -1;
      this.hoverY = this.y;
    }

    // Horizontal movement
    this.vx = this.speed * this.hoverDir;

    // Reverse at walls
    if (this.x < this.size + 50 || this.x > GAME_WIDTH - this.size - 50) {
      this.hoverDir *= -1;
    }

    // Slight vertical bob
    const targetY = this.hoverY + Math.sin(Date.now() * 0.002) * 30;
    this.vy = (targetY - this.y) * 2;

    // Occasionally adjust hover height towards player
    if (Math.random() < 0.005) {
      this.hoverY = Math.max(UI_HEIGHT + 80, Math.min(ROOM_HEIGHT - 80, player.y + (Math.random() - 0.5) * 100));
    }
  }

  mirrorPlayer() {
    if (!player) return;

    // Mirror player's position across the center of the room
    const centerX = GAME_WIDTH / 2;
    const centerY = (UI_HEIGHT + ROOM_HEIGHT) / 2;

    const targetX = centerX + (centerX - player.x);
    const targetY = centerY + (centerY - player.y);

    // Move towards mirror position
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      this.vx = (dx / dist) * this.speed;
      this.vy = (dy / dist) * this.speed;
    } else {
      this.vx = 0;
      this.vy = 0;
    }
  }

  executeAttacks(dt) {
    if (!player || !this.active) return;

    const attacks = this.isBoss && this.phases
      ? this.phases[this.currentPhase].attacks
      : this.attacks;

    for (const attack of attacks) {
      attack.timer = (attack.timer || 0) + dt;

      if (attack.timer >= attack.cooldown) {
        attack.timer = 0;
        this.fireAttack(attack);
      }
    }
  }

  fireAttack(attack) {
    const bulletSpeed = attack.bulletSpeed || 200;
    const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);

    switch (attack.type) {
      case 'aimed':
        this.fireAimedBullet(angleToPlayer, bulletSpeed, attack.damage);
        break;

      case 'spread':
        this.fireSpread(angleToPlayer, attack.count, attack.angle, bulletSpeed, attack.damage);
        break;

      case 'ring':
        this.fireRing(attack.count, bulletSpeed, attack.damage);
        break;

      case 'spiral':
        this.spiralAngle += 0.3;
        this.fireAimedBullet(this.spiralAngle, bulletSpeed, attack.damage);
        break;

      case 'fireball':
        this.fireFireball(angleToPlayer, bulletSpeed, attack.damage, attack.explosive);
        break;

      case 'charge':
        this.performCharge(attack.damage);
        break;

      case 'vulcan_burst':
        // Rapid fire burst at player
        this.fireVulcanBurst(angleToPlayer, attack.count, bulletSpeed, attack.damage);
        break;

      case 'ice':
        // Ice projectile that slows on hit
        this.fireIceBullet(angleToPlayer, bulletSpeed, attack.damage, attack.slowDuration, attack.slowAmount);
        break;

      case 'ice_spread':
        // Spread of ice projectiles
        this.fireIceSpread(angleToPlayer, attack.count, attack.angle, bulletSpeed, attack.damage, attack.slowDuration, attack.slowAmount);
        break;

      case 'summon_ghost':
        // Summon ghost minions
        this.summonGhost(attack.maxSummons);
        break;

      case 'spawn_saw':
        // Spawn sawblade hazards
        this.spawnSaw(attack.maxSaws, attack.sawSpeed, attack.sawDamage);
        break;
    }
  }

  fireVulcanBurst(baseAngle, count, speed, damage) {
    // Fire multiple bullets in quick succession with slight spread
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!this.active) return;
        const spreadAngle = baseAngle + (Math.random() - 0.5) * 0.3;
        enemyBullets.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(spreadAngle) * speed,
          vy: Math.sin(spreadAngle) * speed,
          damage: damage,
          size: 5,
          color: this.color,
          destructible: false
        });
      }, i * 60); // 60ms between each bullet
    }
  }

  fireIceBullet(angle, speed, damage, slowDuration, slowAmount) {
    enemyBullets.push({
      x: this.x,
      y: this.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: damage,
      size: 8,
      color: '#88ddff',
      destructible: false,
      isIce: true,
      slowDuration: slowDuration,
      slowAmount: slowAmount
    });
  }

  fireIceSpread(baseAngle, count, spreadAngle, speed, damage, slowDuration, slowAmount) {
    const angleStep = (spreadAngle * Math.PI / 180) / (count - 1);
    const startAngle = baseAngle - (spreadAngle * Math.PI / 180) / 2;

    for (let i = 0; i < count; i++) {
      const angle = startAngle + angleStep * i;
      enemyBullets.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: damage,
        size: 8,
        color: '#88ddff',
        destructible: false,
        isIce: true,
        slowDuration: slowDuration,
        slowAmount: slowAmount
      });
    }
  }

  summonGhost(maxSummons) {
    // Count current summoned ghosts from this necromancer
    this.summonCount = this.summonCount || 0;
    const currentGhosts = enemies.filter(e => e.active && e.name === 'Ghost').length;

    if (currentGhosts < maxSummons) {
      // Spawn ghost near necromancer
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 30;
      const spawnX = this.x + Math.cos(angle) * dist;
      const spawnY = this.y + Math.sin(angle) * dist;

      const ghostTemplate = ENEMIES.GHOST;
      const ghost = new Enemy(
        ghostTemplate,
        Math.max(this.size, Math.min(GAME_WIDTH - this.size, spawnX)),
        Math.max(UI_HEIGHT + this.size, Math.min(ROOM_HEIGHT - this.size, spawnY))
      );
      ghost.id = Date.now() + Math.random();
      enemies.push(ghost);

      // Summoning particles
      for (let i = 0; i < 15; i++) {
        particles.push({
          x: spawnX,
          y: spawnY,
          vx: (Math.random() - 0.5) * 100,
          vy: (Math.random() - 0.5) * 100 - 50,
          life: 500,
          maxLife: 500,
          size: 4 + Math.random() * 4,
          color: this.color
        });
      }

      // Log event
      if (window.testHarness) {
        window.testHarness.logEvent('ghost_summoned', {
          summonerName: this.name,
          position: { x: spawnX, y: spawnY }
        });
      }
    }
  }

  spawnSaw(maxSaws, speed, damage) {
    // Count current saws
    if (saws.length >= maxSaws) return;

    // Spawn saw at random position around boss
    const angle = Math.random() * Math.PI * 2;
    const dist = this.size + 30;
    const spawnX = this.x + Math.cos(angle) * dist;
    const spawnY = this.y + Math.sin(angle) * dist;

    // Random initial direction
    const moveAngle = Math.random() * Math.PI * 2;

    saws.push({
      x: spawnX,
      y: spawnY,
      vx: Math.cos(moveAngle) * speed,
      vy: Math.sin(moveAngle) * speed,
      speed: speed,
      damage: damage,
      size: 24,
      color: '#ff8844',
      rotation: 0,
      rotationSpeed: 8, // radians per second
      life: 8000, // 8 seconds
      bounces: 0,
      maxBounces: 10
    });

    // Spawn particles
    for (let i = 0; i < 10; i++) {
      particles.push({
        x: spawnX,
        y: spawnY,
        vx: (Math.random() - 0.5) * 150,
        vy: (Math.random() - 0.5) * 150,
        life: 400,
        maxLife: 400,
        size: 3 + Math.random() * 3,
        color: '#ff6633'
      });
    }

    // Log event
    if (window.testHarness) {
      window.testHarness.logEvent('saw_spawned', {
        position: { x: spawnX, y: spawnY }
      });
    }
  }

  performCharge(damage) {
    if (!player) return;

    // Visual warning
    this.isCharging = true;
    this.chargeTarget = { x: player.x, y: player.y };

    // Brief pause before charge
    setTimeout(() => {
      if (!this.active) return;

      // Calculate charge direction
      const dx = this.chargeTarget.x - this.x;
      const dy = this.chargeTarget.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // High-speed charge
      this.vx = (dx / dist) * 400;
      this.vy = (dy / dist) * 400;
      this.chargeTimer = 400;

      // Create charge particles
      for (let i = 0; i < 10; i++) {
        particles.push({
          x: this.x,
          y: this.y,
          vx: (Math.random() - 0.5) * 200,
          vy: (Math.random() - 0.5) * 200,
          life: 300,
          maxLife: 300,
          size: 4,
          color: this.color
        });
      }

      // Stop after brief charge
      setTimeout(() => {
        this.isCharging = false;
        this.chargeTimer = 0;
      }, 400);
    }, 300);
  }

  fireAimedBullet(angle, speed, damage) {
    enemyBullets.push({
      x: this.x,
      y: this.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: damage,
      size: 6,
      color: COLORS.enemyBullet,
      destructible: false
    });
  }

  fireSpread(baseAngle, count, spreadAngle, speed, damage) {
    const startAngle = baseAngle - (spreadAngle * Math.PI / 180) / 2;
    const angleStep = (spreadAngle * Math.PI / 180) / (count - 1);

    for (let i = 0; i < count; i++) {
      const angle = startAngle + angleStep * i;
      this.fireAimedBullet(angle, speed, damage);
    }
  }

  fireRing(count, speed, damage) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      this.fireAimedBullet(angle, speed, damage);
    }
  }

  fireFireball(angle, speed, damage, explosive) {
    enemyBullets.push({
      x: this.x,
      y: this.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: damage,
      size: 14,
      color: '#ff4400',
      destructible: true,
      explosive: explosive
    });
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.flashTimer = 120;
    this.lastHitDamage = amount;

    // Create damage number
    createDamageNumber(this.x, this.y - this.size, amount, amount >= 50);

    // Create hit particles
    const hitParticleCount = Math.min(8, Math.ceil(amount / 5));
    for (let i = 0; i < hitParticleCount; i++) {
      particles.push(createParticle(this.x, this.y, '#ffffff'));
    }

    // Apply blessing effect
    applyBlessingEffect(this, amount);

    // Log event
    if (window.testHarness) {
      window.testHarness.logEvent('damage_dealt', {
        enemyId: this.id,
        enemyType: this.name,
        damage: amount,
        remainingHP: this.hp
      });
    }

    if (this.hp <= 0) {
      this.die();
    }
  }

  applyDoT(damage, duration, ticks) {
    // Apply damage over time effect
    const tickInterval = duration / ticks;
    this.dotEffects.push({
      damage: damage,
      ticksRemaining: ticks,
      tickInterval: tickInterval,
      tickTimer: tickInterval // First tick after interval
    });
  }

  updateDoT(dt) {
    // Process all active DoT effects
    for (let i = this.dotEffects.length - 1; i >= 0; i--) {
      const dot = this.dotEffects[i];
      dot.tickTimer -= dt;

      if (dot.tickTimer <= 0) {
        // Apply DoT damage
        this.hp -= dot.damage;
        this.flashTimer = 60;

        // Create green poison damage number
        createDamageNumber(this.x, this.y - this.size - 10, dot.damage, false, '#88ff44');

        // Create poison particles
        for (let j = 0; j < 3; j++) {
          particles.push({
            x: this.x + (Math.random() - 0.5) * this.size,
            y: this.y + (Math.random() - 0.5) * this.size,
            vx: (Math.random() - 0.5) * 50,
            vy: -30 - Math.random() * 30,
            life: 300,
            maxLife: 300,
            size: 3 + Math.random() * 2,
            color: '#88ff44'
          });
        }

        dot.ticksRemaining--;
        dot.tickTimer = dot.tickInterval;

        if (dot.ticksRemaining <= 0) {
          this.dotEffects.splice(i, 1);
        }

        // Check if dead from DoT
        if (this.hp <= 0) {
          this.die();
          return;
        }
      }
    }
  }

  hasDoT() {
    return this.dotEffects.length > 0;
  }

  die() {
    this.active = false;

    // LIFESTEAL passive - heal on kill
    if (player.passive === 'LIFESTEAL' && player.hp < player.maxHP) {
      // 20% chance to heal 1 HP on kill (higher for bosses)
      const healChance = this.isBoss ? 1.0 : 0.2;
      if (Math.random() < healChance) {
        player.hp = Math.min(player.maxHP, player.hp + 1);
        // Heal particles
        for (let i = 0; i < 5; i++) {
          particles.push(createParticle(player.x, player.y, '#ff4444'));
        }
      }
    }

    // Spawn debris (with SCAVENGER bonus)
    let debrisMultiplier = player.multiplier;
    if (player.passive === 'SCAVENGER') {
      debrisMultiplier *= 1.5;
    }
    const debrisValue = Math.floor(this.debris * debrisMultiplier);
    if (debrisValue > 0) {
      spawnDebris(this.x, this.y, debrisValue);
    }

    // Update multiplier
    if (player.multiplier < 2.5) {
      player.multiplier = Math.min(player.maxMultiplier, player.multiplier + 0.05);
    } else {
      player.multiplier = Math.min(player.maxMultiplier, player.multiplier + 0.01);
    }

    // Death particles - burst effect
    const particleCount = this.isBoss ? 50 : 20;
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(this.x, this.y, this.color));
    }
    // Add white flash particles
    for (let i = 0; i < 5; i++) {
      particles.push(createParticle(this.x, this.y, '#ffffff'));
    }

    // Add debris particles (smaller, yellow)
    for (let i = 0; i < 8; i++) {
      particles.push(createParticle(this.x, this.y, '#ffff00'));
    }

    // Split on death
    if (this.splitsOnDeath && this.splitCount > 0 && ENEMIES[this.splitInto]) {
      for (let i = 0; i < this.splitCount; i++) {
        const angle = (Math.PI * 2 / this.splitCount) * i + Math.random() * 0.5;
        const dist = 15 + this.size * 0.5;
        const newEnemy = new Enemy(
          ENEMIES[this.splitInto],
          this.x + Math.cos(angle) * dist,
          this.y + Math.sin(angle) * dist
        );
        newEnemy.id = Date.now() + Math.random();
        // Give split enemies initial velocity away from center
        newEnemy.vx = Math.cos(angle) * 100;
        newEnemy.vy = Math.sin(angle) * 100;
        enemies.push(newEnemy);
      }
    }

    // Release orbiting minions as ghosts on death
    if (this.hasOrbitingMinions) {
      for (let i = 0; i < this.orbitMinions.length; i++) {
        const minion = this.orbitMinions[i];
        if (!minion.alive) continue;

        const pos = this.getOrbitMinionPosition(i);
        const ghost = new Enemy(
          ENEMIES.GHOST,
          pos.x,
          pos.y
        );
        ghost.id = Date.now() + Math.random() + i;
        // Give ghosts velocity away from center
        const angle = Math.atan2(pos.y - this.y, pos.x - this.x);
        ghost.vx = Math.cos(angle) * 100;
        ghost.vy = Math.sin(angle) * 100;
        enemies.push(ghost);
      }
    }

    // Screen shake
    screenShake = this.isBoss ? 500 : 100;
    screenShakeIntensity = this.isBoss ? 10 : 3;

    // Log event
    if (window.testHarness) {
      window.testHarness.logEvent('enemy_killed', {
        id: this.id,
        enemyType: this.name,
        isBoss: this.isBoss
      });
    }
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();

    // Spawn animation
    if (this.spawning && this.spawnTimer > 0) {
      const progress = 1 - (this.spawnTimer / 400);
      const eased = progress * progress; // Ease in

      // Rising from ground effect
      const riseOffset = (1 - eased) * 30;
      ctx.translate(0, riseOffset);

      // Fade in + scale up
      ctx.globalAlpha = eased;
      const scale = 0.5 + eased * 0.5;
      ctx.translate(this.x, this.y);
      ctx.scale(scale, scale);
      ctx.translate(-this.x, -this.y);

      // Spawn portal/shadow effect
      ctx.fillStyle = `rgba(100, 0, 150, ${(1 - eased) * 0.5})`;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + this.size + riseOffset * 0.3, this.size * 1.5 * (1 - eased * 0.5), this.size * 0.3 * (1 - eased * 0.5), 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Flash white when hit
    if (this.flashTimer > 0) {
      const flashIntensity = this.flashTimer / 120;

      // Scale bump effect
      if (!this.spawning) {
        const scaleBump = 1 + flashIntensity * 0.15;
        ctx.translate(this.x, this.y);
        ctx.scale(scaleBump, scaleBump);
        ctx.translate(-this.x, -this.y);
      }

      // Hit glow effect
      const glowAlpha = flashIntensity * 0.6;
      ctx.fillStyle = `rgba(255, 255, 255, ${glowAlpha})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 1.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = this.color;
    }

    // Draw enemy body
    if (this.isBoss) {
      // Boss - draw as octagon
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i - Math.PI / 8;
        const px = this.x + Math.cos(angle) * this.size;
        const py = this.y + Math.sin(angle) * this.size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Boss health bar
      const barWidth = this.size * 2;
      const barHeight = 6;
      const barX = this.x - barWidth / 2;
      const barY = this.y - this.size - 15;

      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(barX, barY, barWidth * (this.hp / this.maxHP), barHeight);
    } else {
      // Regular enemy - draw as circle
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw eye/core
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Draw DoT effect (poison drip)
    if (this.hasDoT()) {
      const pulse = Math.sin(Date.now() / 100) * 0.3 + 0.7;
      ctx.strokeStyle = `rgba(136, 255, 68, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 4, 0, Math.PI * 2);
      ctx.stroke();

      // Inner glow
      ctx.fillStyle = `rgba(136, 255, 68, ${pulse * 0.3})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw orbiting minions
    if (this.hasOrbitingMinions) {
      for (let i = 0; i < this.orbitMinions.length; i++) {
        const minion = this.orbitMinions[i];
        if (!minion.alive) continue;

        const angle = this.orbitAngle + (Math.PI * 2 / this.orbitMinionCount) * i;
        const mx = this.x + Math.cos(angle) * this.orbitRadius;
        const my = this.y + Math.sin(angle) * this.orbitRadius;

        // Orbit trail
        ctx.fillStyle = 'rgba(170, 255, 170, 0.3)';
        ctx.beginPath();
        ctx.arc(mx, my, 10, 0, Math.PI * 2);
        ctx.fill();

        // Mini ghost body
        ctx.fillStyle = '#88ff88';
        ctx.beginPath();
        ctx.arc(mx, my, 8, 0, Math.PI * 2);
        ctx.fill();

        // Mini ghost eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(mx, my, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw rotating ring (Ringleader)
    if (this.hasRotatingRing) {
      // Ring orbit path
      ctx.strokeStyle = 'rgba(153, 68, 204, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ring bullets
      for (let i = 0; i < this.ringBulletCount; i++) {
        const angle = this.ringAngle + (i / this.ringBulletCount) * Math.PI * 2;
        const bx = this.x + Math.cos(angle) * this.ringRadius;
        const by = this.y + Math.sin(angle) * this.ringRadius;

        // Bullet glow
        ctx.fillStyle = 'rgba(200, 100, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(bx, by, 10, 0, Math.PI * 2);
        ctx.fill();

        // Bullet core
        ctx.fillStyle = '#cc66ff';
        ctx.beginPath();
        ctx.arc(bx, by, 6, 0, Math.PI * 2);
        ctx.fill();

        // Bullet center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, by, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // Get orbiting minion position
  getOrbitMinionPosition(index) {
    const angle = this.orbitAngle + (Math.PI * 2 / this.orbitMinionCount) * index;
    return {
      x: this.x + Math.cos(angle) * this.orbitRadius,
      y: this.y + Math.sin(angle) * this.orbitRadius
    };
  }

  // Damage orbiting minion
  damageOrbitMinion(index, damage) {
    if (index < 0 || index >= this.orbitMinions.length) return false;
    const minion = this.orbitMinions[index];
    if (!minion.alive) return false;

    minion.hp -= damage;
    if (minion.hp <= 0) {
      minion.alive = false;
      // Death particles
      const pos = this.getOrbitMinionPosition(index);
      for (let i = 0; i < 10; i++) {
        particles.push(createParticle(pos.x, pos.y, '#88ff88'));
      }
      // Damage number
      createDamageNumber(pos.x, pos.y, damage);
    }
    return true;
  }

  // Count alive orbiting minions
  aliveOrbitMinions() {
    return this.orbitMinions.filter(m => m.alive).length;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOM GENERATION
// ═══════════════════════════════════════════════════════════════════════════

function generateFloor(floorNum) {
  const roomCount = 8 + floorNum * 2;
  const gridSize = Math.ceil(Math.sqrt(roomCount * 2));

  const map = {
    rooms: {},
    startRoom: null,
    bossRoom: null,
    currentRoomKey: null,
    gridSize: gridSize
  };

  // Create rooms in a grid pattern
  const centerX = Math.floor(gridSize / 2);
  const centerY = gridSize - 1;

  // Start room
  const startKey = `${centerX},${centerY}`;
  map.rooms[startKey] = createRoom('start', centerX, centerY);
  map.startRoom = startKey;
  map.currentRoomKey = startKey;

  // Generate path to boss
  let currentX = centerX;
  let currentY = centerY;
  const path = [{ x: currentX, y: currentY }];

  while (currentY > 1) {
    const directions = [];
    if (currentX > 1) directions.push({ dx: -1, dy: 0 });
    if (currentX < gridSize - 2) directions.push({ dx: 1, dy: 0 });
    directions.push({ dx: 0, dy: -1 });
    directions.push({ dx: 0, dy: -1 }); // Bias towards going up

    const dir = directions[Math.floor(Math.random() * directions.length)];
    currentX += dir.dx;
    currentY += dir.dy;

    const key = `${currentX},${currentY}`;
    if (!map.rooms[key]) {
      const roomType = currentY <= 2 ? 'miniboss' : 'normal';
      map.rooms[key] = createRoom(roomType, currentX, currentY);
      path.push({ x: currentX, y: currentY });
    }
  }

  // Boss room
  const bossKey = `${currentX},0`;
  map.rooms[bossKey] = createRoom('boss', currentX, 0);
  map.bossRoom = bossKey;

  // Add some side rooms
  for (let i = 0; i < Math.floor(roomCount / 3); i++) {
    const pathRoom = path[Math.floor(Math.random() * path.length)];
    const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const offset = offsets[Math.floor(Math.random() * offsets.length)];
    const newX = pathRoom.x + offset[0];
    const newY = pathRoom.y + offset[1];
    const key = `${newX},${newY}`;

    if (!map.rooms[key] && newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
      const roomTypes = ['normal', 'normal', 'shop', 'upgrade', 'shrine'];
      const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
      map.rooms[key] = createRoom(roomType, newX, newY);
    }
  }

  // Connect adjacent rooms
  for (const [key, room] of Object.entries(map.rooms)) {
    const [x, y] = key.split(',').map(Number);
    const adjacent = [
      `${x-1},${y}`,
      `${x+1},${y}`,
      `${x},${y-1}`,
      `${x},${y+1}`
    ];

    room.doors = adjacent.filter(k => map.rooms[k]).map(k => ({
      key: k,
      direction: getDirection(x, y, ...k.split(',').map(Number)),
      locked: map.rooms[k].type === 'boss' && minibossesKilled < 1
    }));
  }

  return map;
}

function getDirection(x1, y1, x2, y2) {
  if (x2 < x1) return 'west';
  if (x2 > x1) return 'east';
  if (y2 < y1) return 'north';
  return 'south';
}

function createRoom(type, gridX, gridY) {
  const room = {
    type: type,
    gridX: gridX,
    gridY: gridY,
    cleared: type === 'start',
    enemies: [],
    pickups: [],
    doors: [],
    visited: false
  };

  // Populate enemies based on room type
  if (type === 'normal') {
    const enemyCount = 3 + Math.floor(Math.random() * 4);
    const enemyTypes = Object.keys(ENEMIES);

    for (let i = 0; i < enemyCount; i++) {
      const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      room.enemies.push({
        type: enemyType,
        x: 100 + Math.random() * (GAME_WIDTH - 200),
        y: UI_HEIGHT + 100 + Math.random() * (ROOM_HEIGHT - UI_HEIGHT - 200)
      });
    }
  } else if (type === 'miniboss') {
    // Spawn a tougher enemy as miniboss
    room.enemies.push({
      type: 'BLOB',
      x: GAME_WIDTH / 2,
      y: (UI_HEIGHT + ROOM_HEIGHT) / 2 - 50
    });
    room.enemies.push({
      type: 'DRONE',
      x: GAME_WIDTH / 2 - 100,
      y: (UI_HEIGHT + ROOM_HEIGHT) / 2
    });
    room.enemies.push({
      type: 'DRONE',
      x: GAME_WIDTH / 2 + 100,
      y: (UI_HEIGHT + ROOM_HEIGHT) / 2
    });
  } else if (type === 'boss') {
    const bossTypes = Object.keys(BOSSES);
    const bossType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
    room.bossType = bossType;
  } else if (type === 'shop') {
    room.shopItems = generateShopItems();
  } else if (type === 'upgrade') {
    room.upgradeOptions = generateUpgradeOptions();
  }

  return room;
}

function generateShopItems() {
  const items = [];
  const available = [
    { name: 'Health +1', type: 'health', value: 1, price: 150 },
    { name: 'Shield +1', type: 'shield', value: 1, price: 100 },
    { name: 'Ammo +25%', type: 'ammo', value: 0.25, price: 100 },
    { name: 'Bomb', type: 'bomb', value: 1, price: 150 },
    { name: 'Max HP +1', type: 'max_hp', value: 1, price: 400 }
  ];

  for (let i = 0; i < 4; i++) {
    const item = available[Math.floor(Math.random() * available.length)];
    items.push({ ...item, x: 150 + i * 150, y: 300, purchased: false });
  }

  return items;
}

function generateUpgradeOptions() {
  const upgrades = [
    { name: 'Autobomb', description: 'Auto-bomb when hit', effect: 'autobomb' },
    { name: 'Scanner', description: 'Reveal map & HP', effect: 'scanner' },
    { name: 'Focus', description: 'Extended i-frames', effect: 'focus' }
  ];

  const selected = [];
  while (selected.length < 3 && upgrades.length > 0) {
    const idx = Math.floor(Math.random() * upgrades.length);
    selected.push(upgrades.splice(idx, 1)[0]);
  }

  return selected.map((u, i) => ({
    ...u,
    x: 200 + i * 200,
    y: 300
  }));
}

function enterRoom(roomKey) {
  const room = floorMap.rooms[roomKey];
  if (!room) return;

  floorMap.currentRoomKey = roomKey;
  currentRoom = room;
  room.visited = true;

  // Clear current enemies, bullets, and hazards
  enemies.length = 0;
  enemyBullets.length = 0;
  saws.length = 0;
  electricFields.length = 0;
  pickups = room.pickups || [];

  // Generate shop inventory for shop rooms
  if (room.type === 'shop' && !room.shopGenerated) {
    generateShopInventory();
    room.shopGenerated = true;
    room.shopInventory = shopInventory;
  } else if (room.type === 'shop' && room.shopInventory) {
    // Restore shop inventory if revisiting
    shopInventory = room.shopInventory;
  }

  // Generate upgrade choices for upgrade rooms
  if (room.type === 'upgrade' && !room.upgradeGenerated) {
    generateUpgradeChoices();
    room.upgradeGenerated = true;
    room.upgradeChoices = upgradeChoices;
    room.upgradeUsed = false;
    upgradeUsed = false;
  } else if (room.type === 'upgrade' && room.upgradeChoices) {
    // Restore upgrade state if revisiting
    upgradeChoices = room.upgradeChoices;
    upgradeUsed = room.upgradeUsed || false;
  }

  // Generate shrine for shrine rooms
  if (room.type === 'shrine' && !room.shrineGenerated) {
    generateShrine();
    room.shrineGenerated = true;
    room.shrine = currentShrine;
    room.shrineUsed = false;
    shrineUsed = false;
  } else if (room.type === 'shrine' && room.shrine) {
    // Restore shrine state if revisiting
    currentShrine = room.shrine;
    shrineUsed = room.shrineUsed || false;
  }

  // Spawn enemies
  if (!room.cleared) {
    if (room.type === 'boss' && room.bossType) {
      const bossTemplate = BOSSES[room.bossType];
      enemies.push(new Enemy(bossTemplate, GAME_WIDTH / 2, UI_HEIGHT + 150));
    } else {
      for (const enemyData of room.enemies) {
        const template = ENEMIES[enemyData.type];
        if (template) {
          enemies.push(new Enemy(template, enemyData.x, enemyData.y));
        }
      }
    }
  }

  // Position player at entrance
  const [roomX, roomY] = roomKey.split(',').map(Number);
  const [prevX, prevY] = floorMap.currentRoomKey ? floorMap.currentRoomKey.split(',').map(Number) : [roomX, roomY + 1];

  if (prevX < roomX) {
    player.x = 50;
    player.y = ROOM_HEIGHT / 2;
  } else if (prevX > roomX) {
    player.x = GAME_WIDTH - 50;
    player.y = ROOM_HEIGHT / 2;
  } else if (prevY > roomY) {
    player.x = GAME_WIDTH / 2;
    player.y = ROOM_HEIGHT - 50;
  } else {
    player.x = GAME_WIDTH / 2;
    player.y = UI_HEIGHT + 50;
  }

  // Log event
  if (window.testHarness) {
    window.testHarness.logEvent('room_entered', {
      roomKey: roomKey,
      roomType: room.type,
      enemyCount: enemies.length
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GAME FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function spawnDebris(x, y, value) {
  const count = Math.min(10, Math.ceil(value / 50));
  const valuePerPickup = value / count;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 30;
    const spreadSpeed = 50 + Math.random() * 100;

    pickups.push({
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      vx: Math.cos(angle) * spreadSpeed,
      vy: Math.sin(angle) * spreadSpeed,
      type: 'debris',
      value: valuePerPickup,
      size: valuePerPickup > 100 ? 12 : 8,
      color: COLORS.debris,
      magnetized: false,
      magnetStrength: 0
    });
  }
}

// Utility function for smooth movement interpolation
function moveTowards(current, target, maxDelta) {
  if (Math.abs(target - current) <= maxDelta) {
    return target;
  }
  return current + Math.sign(target - current) * maxDelta;
}

function createParticle(x, y, color) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 50 + Math.random() * 150;

  return {
    x: x,
    y: y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 500 + Math.random() * 500,
    maxLife: 1000,
    size: 2 + Math.random() * 4,
    color: color
  };
}

function createDamageNumber(x, y, damage, isCrit = false, customColor = null) {
  damageNumbers.push({
    x: x + (Math.random() - 0.5) * 20,
    y: y,
    damage: Math.floor(damage),
    vy: -80,
    life: 800,
    maxLife: 800,
    isCrit: isCrit,
    scale: isCrit ? 1.5 : 1.0,
    customColor: customColor
  });
}

function createMuzzleFlash(x, y, color) {
  muzzleFlashes.push({
    x: x,
    y: y,
    life: 50,
    maxLife: 50,
    size: 8 + Math.random() * 4,
    color: color || '#ffff00'
  });
}

function createBombExplosion(x, y) {
  bombExplosions.push({
    x: x,
    y: y,
    radius: 0,
    maxRadius: 300,
    life: 600,
    maxLife: 600
  });
}

function firePlayerWeapon() {
  const weapon = player.currentWeapon;

  // Can't fire while reloading
  if (player.isReloading) return;

  // Check clip ammo for revolver-type weapons
  if (weapon.clipSize && player.clipAmmo <= 0) {
    startReload();
    return;
  }

  // Check ammo
  if (weapon.maxAmmo !== Infinity && player.ammo <= 0) {
    player.currentWeapon = { ...WEAPONS.PEASHOOTER };
    return;
  }

  // Calculate damage and size (account for charge weapons)
  let damage = weapon.damage * player.totalDamageMultiplier;
  let projectileSize = weapon.projectileSize;

  if (weapon.isCharge && player.chargeTime > 0) {
    const chargePercent = player.chargeTime / weapon.maxChargeTime;
    // Scale damage from base to max based on charge
    damage = (weapon.damage + (weapon.maxChargeDamage - weapon.damage) * chargePercent) * player.totalDamageMultiplier;
    projectileSize = weapon.projectileSize + (weapon.maxChargeSize - weapon.projectileSize) * chargePercent;

    // Create charge release particles
    const particleCount = Math.floor(chargePercent * 10);
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: player.x + (Math.random() - 0.5) * 20,
        y: player.y - 20 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 100,
        vy: -50 + Math.random() * -100,
        life: 200 + Math.random() * 200,
        maxLife: 400,
        size: 3 + Math.random() * 4,
        color: weapon.projectileColor
      });
    }

    // Screen shake for full charge
    if (chargePercent > 0.8) {
      screenShake = 100;
      screenShakeIntensity = 3;
    }
  }

  // Runic weapon - spawn orbiting rune instead of firing
  if (weapon.isRunic) {
    if (orbitRunes.length < weapon.maxOrbitRunes) {
      const angle = (orbitRunes.length / weapon.maxOrbitRunes) * Math.PI * 2;
      orbitRunes.push({
        orbitAngle: angle,
        orbitRadius: weapon.orbitRadius,
        damage: damage,
        size: weapon.projectileSize,
        color: weapon.projectileColor,
        homingStrength: weapon.homingStrength,
        velocity: weapon.velocity,
        state: 'orbiting', // 'orbiting' or 'homing'
        target: null,
        vx: 0,
        vy: 0,
        x: 0,
        y: 0
      });

      // Spawn particles
      const runeX = player.x + Math.cos(angle) * weapon.orbitRadius;
      const runeY = player.y + Math.sin(angle) * weapon.orbitRadius;
      for (let i = 0; i < 5; i++) {
        particles.push({
          x: runeX,
          y: runeY,
          vx: (Math.random() - 0.5) * 80,
          vy: (Math.random() - 0.5) * 80,
          life: 200,
          maxLife: 200,
          size: 2 + Math.random() * 2,
          color: weapon.projectileColor
        });
      }

      // Consume ammo
      if (weapon.maxAmmo !== Infinity) {
        player.ammo -= 1;
      }

      // Create muzzle flash
      createMuzzleFlash(runeX, runeY, weapon.projectileColor);
    }
    return; // Don't fire normal bullet
  }

  if (weapon.isMelee) {
    // Melee attack - damage in cone
    for (const enemy of enemies) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < weapon.coneRange) {
        enemy.takeDamage(damage);
      }
    }

    // Still fire a projectile
    playerBullets.push({
      x: player.x,
      y: player.y - 20,
      vx: 0,
      vy: -weapon.velocity,
      damage: weapon.projectileDamage * player.totalDamageMultiplier,
      size: weapon.projectileSize,
      color: weapon.projectileColor,
      piercing: false
    });
  } else {
    // Triple shot - fire 3 bullets with spread
    const bulletCount = weapon.tripleShot ? 3 : 1;
    const baseAngle = -Math.PI / 2; // Straight up

    for (let i = 0; i < bulletCount; i++) {
      let angle = baseAngle;
      if (weapon.tripleShot) {
        const spread = (weapon.spreadAngle || 15) * Math.PI / 180;
        angle = baseAngle + (i - 1) * spread;
      }

      // Add slight spread for Pulsar
      if (weapon.isPulsar) {
        angle += (Math.random() - 0.5) * 0.15;
      }

      const vx = Math.sin(angle) * weapon.velocity;
      const vy = Math.cos(angle) * weapon.velocity;

      playerBullets.push({
        x: player.x,
        y: player.y - 20,
        vx: vx,
        vy: vy,
        damage: damage,
        size: projectileSize,
        color: weapon.projectileColor,
        piercing: weapon.piercing || false,
        maxRange: weapon.maxRange || 0,
        distanceTraveled: 0,
        // Spear DoT properties
        isSpear: weapon.isSpear || false,
        dotDamage: weapon.dotDamage || 0,
        dotDuration: weapon.dotDuration || 0,
        dotTicks: weapon.dotTicks || 0,
        // Razor bounce properties
        isRazor: weapon.isRazor || false,
        bouncesRemaining: weapon.bounceCount || 0,
        bounceDamageDecay: weapon.bounceDamageDecay || 1.0,
        // Thunderhead electric field properties
        isThunderhead: weapon.isThunderhead || false,
        fieldRadius: weapon.fieldRadius || 0,
        fieldDuration: weapon.fieldDuration || 0,
        fieldTickRate: weapon.fieldTickRate || 0,
        // Keyword properties
        isHoming: weapon.homingStrength > 0,
        homingStrength: weapon.homingStrength || 0,
        isExplosive: weapon.explosive || false,
        explosionRadius: weapon.explosionRadius || 0,
        isVampiric: weapon.vampiric || false,
        healChance: weapon.healChance || 0
      });
    }
  }

  // Create muzzle flash
  createMuzzleFlash(player.x, player.y - 20, weapon.projectileColor);

  // Consume ammo (from clip for revolver, from pool otherwise)
  if (weapon.clipSize) {
    player.clipAmmo -= 1;
  } else if (weapon.maxAmmo !== Infinity) {
    player.ammo -= 1;
  }

  // Log event
  if (window.testHarness) {
    window.testHarness.logEvent('bullet_fired', {
      weapon: weapon.name,
      damage: damage,
      clipAmmo: player.clipAmmo
    });
  }
}

function startReload() {
  const weapon = player.currentWeapon;
  if (!weapon.clipSize || player.isReloading) return;
  if (player.clipAmmo >= weapon.clipSize) return;
  if (player.ammo <= 0) return;

  player.isReloading = true;
  player.reloadTimer = weapon.reloadTime;

  // Log event
  if (window.testHarness) {
    window.testHarness.logEvent('reload_started', {
      weapon: weapon.name
    });
  }
}

function finishReload() {
  const weapon = player.currentWeapon;
  if (!weapon.clipSize) return;

  // Calculate how much ammo to load
  const neededAmmo = weapon.clipSize - player.clipAmmo;
  const availableAmmo = Math.min(neededAmmo, player.ammo);

  player.clipAmmo += availableAmmo;
  player.ammo -= availableAmmo;
  player.isReloading = false;
  player.reloadTimer = 0;

  // Log event
  if (window.testHarness) {
    window.testHarness.logEvent('reload_finished', {
      weapon: weapon.name,
      clipAmmo: player.clipAmmo
    });
  }
}

function useBomb() {
  if (player.bombs <= 0) return;

  player.bombs--;

  // Clear all enemy bullets
  enemyBullets = [];

  // Damage all enemies
  for (const enemy of enemies) {
    enemy.takeDamage(50);
  }

  // Screen effect
  screenShake = 500;
  screenShakeIntensity = 15;

  // Particles
  for (let i = 0; i < 50; i++) {
    particles.push(createParticle(player.x, player.y, '#ff00ff'));
  }

  // Bomb explosion ring
  createBombExplosion(player.x, player.y);

  // Brief invincibility
  player.isInvincible = true;
  player.invincibilityTimer = 500;

  // Check for secret walls and reveal them
  const secretWalls = checkSecretWalls();
  if (secretWalls.length > 0) {
    // Reveal the first secret wall found
    const revealed = revealSecretRoom(secretWalls[0].direction);
    if (revealed) {
      // Extra particles for secret room reveal
      for (let i = 0; i < 40; i++) {
        particles.push(createParticle(secretWalls[0].x, secretWalls[0].y, '#ffff00'));
      }
    }
  }

  // Log event
  if (window.testHarness) {
    window.testHarness.logEvent('bomb_used', {
      bombsRemaining: player.bombs,
      secretRevealed: secretWalls.length > 0
    });
  }
}

function playerDash(dx, dy) {
  if (player.dashCooldownTimer > 0) return;

  const magnitude = Math.sqrt(dx * dx + dy * dy);
  if (magnitude === 0) {
    dx = 0;
    dy = -1;
  } else {
    dx /= magnitude;
    dy /= magnitude;
  }

  player.isDashing = true;
  player.isInvincible = true;
  player.dashTimer = player.dashDuration;
  player.dashCooldownTimer = player.dashCooldown;
  player.dashVx = dx * player.dashDistance / (player.dashDuration / 1000);
  player.dashVy = dy * player.dashDistance / (player.dashDuration / 1000);

  // Log event
  if (window.testHarness) {
    window.testHarness.logEvent('player_dashed', {
      direction: { dx, dy }
    });
  }
}

function playerTakeDamage(amount) {
  if (player.isInvincible) return;

  // Apply difficulty multiplier to damage
  const difficulty = getDifficulty();
  amount = Math.ceil(amount * difficulty.enemyDamageMult);

  // Apply ARMOR passive (20% damage reduction)
  if (player.passive === 'ARMOR') {
    amount = Math.max(1, Math.ceil(amount * 0.8));
  }

  // Check autobomb
  if (player.hasAutobomb && player.bombs > 0) {
    useBomb();
    player.multiplier = Math.max(1.0, player.multiplier - 0.5);
    return;
  }

  // Shields first
  if (player.shields > 0) {
    player.shields -= amount;
    if (player.shields < 0) {
      player.hp += player.shields;
      player.shields = 0;
    }
  } else {
    player.hp -= amount;
  }

  // Multiplier penalty
  player.multiplier = Math.max(1.0, player.multiplier - 1.0);

  // Invincibility
  player.isInvincible = true;
  player.invincibilityTimer = player.invincibilityTime;

  // Screen shake with intensity variation based on damage
  const baseShake = 150;
  const baseIntensity = 5;
  const damageMultiplier = Math.min(amount, 3); // Cap at 3 damage for shake scaling
  screenShake = baseShake + (damageMultiplier * 50);
  screenShakeIntensity = baseIntensity + (damageMultiplier * 4);

  // Red hit flash effect
  hitFlashTimer = 80 + (amount * 20);

  // UI health bar flash
  player.hpFlashTimer = 500;

  // Log event
  if (window.testHarness) {
    window.testHarness.logEvent('damage_taken', {
      damage: amount,
      remainingHP: player.hp,
      shields: player.shields
    });
  }

  // Check death
  if (player.hp <= 0) {
    gameState = 'gameover';

    if (window.testHarness) {
      window.testHarness.logEvent('player_died', {
        floor: currentFloor,
        roomsCleared: roomsCleared
      });
    }
  }
}

function checkRoomCleared() {
  if (!currentRoom || currentRoom.cleared) return;

  const activeEnemies = enemies.filter(e => e.active);

  if (activeEnemies.length === 0) {
    currentRoom.cleared = true;
    roomsCleared++;

    // Room clear celebration effect
    roomClearTimer = 500;
    screenShake = 200;
    screenShakeIntensity = 5;

    // Show full floor map briefly
    showFullFloorMap = true;
    fullMapTimer = FULL_MAP_DURATION;

    // Spawn celebration particles from center
    const centerX = GAME_WIDTH / 2;
    const centerY = (UI_HEIGHT + ROOM_HEIGHT) / 2;
    for (let i = 0; i < 30; i++) {
      particles.push(createParticle(centerX, centerY, '#00ff88'));
    }
    // Spawn particles from player
    for (let i = 0; i < 15; i++) {
      particles.push(createParticle(player.x, player.y, '#ffff00'));
    }

    // Miniboss kill tracking
    if (currentRoom.type === 'miniboss') {
      minibossesKilled++;

      // Unlock boss room doors
      for (const room of Object.values(floorMap.rooms)) {
        for (const door of room.doors) {
          if (floorMap.rooms[door.key]?.type === 'boss') {
            door.locked = false;
          }
        }
      }
    }

    // Boss rewards
    if (currentRoom.type === 'boss') {
      // Victory! Go to next floor or win
      if (currentFloor >= 3) {
        gameState = 'victory';
        if (window.testHarness) {
          window.testHarness.logEvent('game_won', {
            floor: currentFloor,
            debris: player.debris
          });
        }
      } else {
        // Show boss reward choice
        bossRewardChoices = generateBossRewards();
        selectedBossReward = 0;
        bossRewardChosen = false;
        // Portal spawns after choice is made
      }
    }

    // Bomb recharge
    player.roomsSinceBombRecharge++;
    if (player.roomsSinceBombRecharge >= player.bombRechargeRooms && player.bombs < player.maxBombs) {
      player.bombs++;
      player.roomsSinceBombRecharge = 0;
    }

    // Log event
    if (window.testHarness) {
      window.testHarness.logEvent('room_cleared', {
        roomType: currentRoom.type,
        roomsCleared: roomsCleared
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function update(dt) {
  if (gameState !== 'playing') return;

  updatePlayer(dt);
  updateBullets(dt);
  updateEnemies(dt);
  updateBlessingEffects(dt);
  updatePickups(dt);
  updateParticles(dt);
  updateDamageNumbers(dt);
  updateMuzzleFlashes(dt);
  updateBombExplosions(dt);
  updateDashTrails(dt);
  updateElectricFields(dt);
  updateSaws(dt);
  updateOrbitRunes(dt);
  checkCollisions();
  checkRoomCleared();
  updateFloorExitPortal(dt);

  // Update screen shake
  if (screenShake > 0) {
    screenShake -= dt;
  }

  // Update hit flash timer
  if (hitFlashTimer > 0) {
    hitFlashTimer -= dt;
  }

  // Update phase flash timer
  if (phaseFlashTimer > 0) {
    phaseFlashTimer -= dt;
  }

  // Update room clear timer
  if (roomClearTimer > 0) {
    roomClearTimer -= dt;
  }

  // Update full floor map timer
  if (fullMapTimer > 0) {
    fullMapTimer -= dt;
    if (fullMapTimer <= 0) {
      showFullFloorMap = false;
    }
  }
}

function updatePlayer(dt) {
  // Handle dash
  if (player.isDashing) {
    player.dashTimer -= dt;
    player.x += player.dashVx * dt / 1000;
    player.y += player.dashVy * dt / 1000;

    // Spawn dash trail afterimage
    dashTrails.push({
      x: player.x,
      y: player.y,
      life: 150,
      maxLife: 150
    });

    // Spawn dash particles
    if (Math.random() < 0.5) {
      particles.push({
        x: player.x + (Math.random() - 0.5) * 20,
        y: player.y + (Math.random() - 0.5) * 20,
        vx: -player.dashVx * 0.1 + (Math.random() - 0.5) * 50,
        vy: -player.dashVy * 0.1 + (Math.random() - 0.5) * 50,
        life: 200,
        maxLife: 200,
        size: 3 + Math.random() * 3,
        color: '#00ff88'
      });
    }

    if (player.dashTimer <= 0) {
      player.isDashing = false;
      // Keep invincibility slightly after dash
      setTimeout(() => {
        if (!player.isDashing) {
          player.isInvincible = false;
        }
      }, 50);
    }
  } else {
    // Normal movement with velocity-based control
    let inputX = 0, inputY = 0;

    if (keys['ArrowLeft'] || keys['KeyA']) inputX -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) inputX += 1;
    if (keys['ArrowUp'] || keys['KeyW']) inputY -= 1;
    if (keys['ArrowDown'] || keys['KeyS']) inputY += 1;

    // Normalize diagonal
    if (inputX !== 0 && inputY !== 0) {
      const factor = 0.7071;
      inputX *= factor;
      inputY *= factor;
    }

    // Focus mode
    player.isFocused = keys['ShiftLeft'] || keys['ShiftRight'] || mouse.down && keys['ShiftLeft'];

    // Velocity-based movement with acceleration/deceleration
    const targetVx = inputX * player.speed;
    const targetVy = inputY * player.speed;
    const accel = 2500; // Acceleration rate (pixels/sec^2)
    const decel = 3000; // Deceleration rate (faster than accel for snappy stops)

    // Accelerate towards target velocity
    if (inputX !== 0) {
      if (Math.sign(player.vx) !== Math.sign(targetVx) && player.vx !== 0) {
        // Turning around - use higher decel
        player.vx = moveTowards(player.vx, targetVx, decel * dt / 1000);
      } else {
        player.vx = moveTowards(player.vx, targetVx, accel * dt / 1000);
      }
    } else {
      // Decelerate when no input
      player.vx = moveTowards(player.vx, 0, decel * dt / 1000);
    }

    if (inputY !== 0) {
      if (Math.sign(player.vy) !== Math.sign(targetVy) && player.vy !== 0) {
        player.vy = moveTowards(player.vy, targetVy, decel * dt / 1000);
      } else {
        player.vy = moveTowards(player.vy, targetVy, accel * dt / 1000);
      }
    } else {
      player.vy = moveTowards(player.vy, 0, decel * dt / 1000);
    }

    player.x += player.vx * dt / 1000;
    player.y += player.vy * dt / 1000;
  }

  // Clamp to room bounds
  player.x = Math.max(20, Math.min(GAME_WIDTH - 20, player.x));
  player.y = Math.max(UI_HEIGHT + 20, Math.min(ROOM_HEIGHT - 20, player.y));

  // Update dash cooldown
  if (player.dashCooldownTimer > 0) {
    player.dashCooldownTimer -= dt;
  }

  // Update slow effect timer
  if (player.slowTimer > 0) {
    player.slowTimer -= dt;
    if (player.slowTimer <= 0) {
      player.slowAmount = 1.0; // Reset to normal speed
    }
  }

  // Update UI display values with smooth interpolation
  const uiLerpSpeed = dt * 0.008; // Smooth interpolation speed
  player.displayHP += (player.hp - player.displayHP) * uiLerpSpeed;
  player.displayShields += (player.shields - player.displayShields) * uiLerpSpeed;
  player.displayAmmo += (player.ammo - player.displayAmmo) * uiLerpSpeed;

  // Update UI flash timers
  if (player.hpFlashTimer > 0) {
    player.hpFlashTimer -= dt;
  }
  if (player.ammoRefillTimer > 0) {
    player.ammoRefillTimer -= dt;
  }

  // Update invincibility
  if (player.invincibilityTimer > 0) {
    player.invincibilityTimer -= dt;
    if (player.invincibilityTimer <= 0 && !player.isDashing) {
      player.isInvincible = false;
    }
  }

  // Handle reload timer
  if (player.isReloading) {
    player.reloadTimer -= dt;
    if (player.reloadTimer <= 0) {
      finishReload();
    }
  }

  // Handle manual reload (R key)
  if (keys['KeyR'] && !player.reloadUsedThisFrame && !player.isReloading) {
    startReload();
    player.reloadUsedThisFrame = true;
  }
  if (!keys['KeyR']) {
    player.reloadUsedThisFrame = false;
  }

  // Handle firing
  player.fireTimer -= dt;
  const isFiring = keys['Space'] || mouse.down;

  // Update drill angle towards mouse
  if (player.currentWeapon.isDrill) {
    player.drillAngle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  }

  if (player.currentWeapon.isDrill) {
    // Drill weapon mechanics - continuous damage while held
    if (isFiring && player.ammo > 0) {
      player.isDrilling = true;
      updateDrill(dt);
    } else {
      player.isDrilling = false;
    }
  } else if (player.currentWeapon.isCharge) {
    // Charge weapon mechanics
    if (isFiring && !player.isReloading) {
      player.isCharging = true;
      player.chargeTime = Math.min(player.chargeTime + dt, player.currentWeapon.maxChargeTime);
    } else if (player.isCharging) {
      // Release charged shot
      firePlayerWeapon();
      player.isCharging = false;
      player.chargeTime = 0;
      player.fireTimer = player.currentWeapon.fireRate;
    }
  } else {
    // Normal weapon mechanics
    player.isCharging = false;
    player.chargeTime = 0;
    if (isFiring && player.fireTimer <= 0 && !player.isReloading) {
      firePlayerWeapon();
      player.fireTimer = player.currentWeapon.fireRate;
    }
  }

  // Handle bomb
  if (keys['KeyX'] && !player.bombUsedThisFrame) {
    useBomb();
    player.bombUsedThisFrame = true;
  }
  if (!keys['KeyX']) {
    player.bombUsedThisFrame = false;
  }

  // Handle dash
  if (keys['KeyZ'] && !player.dashUsedThisFrame) {
    let dx = 0, dy = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
    if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
    if (keys['ArrowDown'] || keys['KeyS']) dy += 1;
    playerDash(dx, dy);
    player.dashUsedThisFrame = true;
  }
  if (!keys['KeyZ']) {
    player.dashUsedThisFrame = false;
  }
}

function updateBullets(dt) {
  // Player bullets
  for (let i = playerBullets.length - 1; i >= 0; i--) {
    const bullet = playerBullets[i];
    const moveX = bullet.vx * dt / 1000;
    const moveY = bullet.vy * dt / 1000;
    bullet.x += moveX;
    bullet.y += moveY;

    // Track distance for range-limited weapons
    if (bullet.maxRange > 0) {
      bullet.distanceTraveled += Math.sqrt(moveX * moveX + moveY * moveY);

      // Fade out at max range
      if (bullet.distanceTraveled >= bullet.maxRange) {
        // Create small dissipate particle
        particles.push({
          x: bullet.x,
          y: bullet.y,
          vx: (Math.random() - 0.5) * 50,
          vy: (Math.random() - 0.5) * 50,
          life: 100,
          maxLife: 100,
          size: bullet.size,
          color: bullet.color
        });
        playerBullets.splice(i, 1);
        continue;
      }
    }

    // Handle homing bullets (keyword)
    if (bullet.isHoming && bullet.homingStrength > 0) {
      // Find nearest enemy
      let nearestDist = Infinity;
      let nearestEnemy = null;
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const dx = enemy.x - bullet.x;
        const dy = enemy.y - bullet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist && dist < 400) { // 400px detection range
          nearestDist = dist;
          nearestEnemy = enemy;
        }
      }

      if (nearestEnemy) {
        const targetAngle = Math.atan2(nearestEnemy.y - bullet.y, nearestEnemy.x - bullet.x);
        const currentAngle = Math.atan2(bullet.vy, bullet.vx);

        // Calculate angle difference
        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Gradually turn toward target
        const turnAmount = bullet.homingStrength * dt / 1000;
        const newAngle = currentAngle + Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnAmount);

        const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
        bullet.vx = Math.cos(newAngle) * speed;
        bullet.vy = Math.sin(newAngle) * speed;
      }
    }

    // Handle wall bouncing for Razor bullets
    if (bullet.isRazor && bullet.bouncesRemaining > 0) {
      let bounced = false;

      // Left or right wall
      if (bullet.x < 0 || bullet.x > GAME_WIDTH) {
        bullet.vx *= -1;
        bullet.x = Math.max(0, Math.min(GAME_WIDTH, bullet.x));
        bounced = true;
      }

      // Top or bottom wall (play area)
      if (bullet.y < UI_HEIGHT || bullet.y > ROOM_HEIGHT + UI_HEIGHT) {
        bullet.vy *= -1;
        bullet.y = Math.max(UI_HEIGHT, Math.min(ROOM_HEIGHT + UI_HEIGHT, bullet.y));
        bounced = true;
      }

      if (bounced) {
        bullet.bouncesRemaining--;
        bullet.damage *= bullet.bounceDamageDecay;

        // Bounce particle effect
        for (let j = 0; j < 5; j++) {
          particles.push({
            x: bullet.x,
            y: bullet.y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 150,
            maxLife: 150,
            size: 2 + Math.random() * 2,
            color: '#ffaa44'
          });
        }
      }
    } else {
      // Remove if off screen (non-Razor bullets or out of bounces)
      if (bullet.y < 0 || bullet.y > GAME_HEIGHT || bullet.x < 0 || bullet.x > GAME_WIDTH) {
        playerBullets.splice(i, 1);
      }
    }
  }

  // Enemy bullets
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const bullet = enemyBullets[i];
    bullet.x += bullet.vx * dt / 1000;
    bullet.y += bullet.vy * dt / 1000;

    // Remove if off screen
    if (bullet.y < 0 || bullet.y > GAME_HEIGHT || bullet.x < 0 || bullet.x > GAME_WIDTH) {
      enemyBullets.splice(i, 1);
    }
  }
}

function updateEnemies(dt) {
  for (const enemy of enemies) {
    enemy.update(dt);
  }
}

function updatePickups(dt) {
  const MAGNET_RADIUS = 150;
  const MAX_MAGNET_SPEED = 500;
  const MAGNET_ACCEL = 800;
  const FRICTION = 0.92;

  for (const pickup of pickups) {
    // Initialize velocity if not present
    if (pickup.vx === undefined) pickup.vx = 0;
    if (pickup.vy === undefined) pickup.vy = 0;
    if (pickup.magnetStrength === undefined) pickup.magnetStrength = 0;

    const dx = player.x - pickup.x;
    const dy = player.y - pickup.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < MAGNET_RADIUS && dist > 0) {
      // Smooth magnet strength ramp-up
      pickup.magnetized = true;
      pickup.magnetStrength = Math.min(1, pickup.magnetStrength + dt / 200);

      // Calculate attraction force with easing
      const t = 1 - (dist / MAGNET_RADIUS);
      const eased = t * t * t; // Cubic easing - stronger pull when closer
      const force = MAGNET_ACCEL * eased * pickup.magnetStrength;

      // Apply force towards player
      pickup.vx += (dx / dist) * force * dt / 1000;
      pickup.vy += (dy / dist) * force * dt / 1000;

      // Clamp max speed
      const speed = Math.sqrt(pickup.vx * pickup.vx + pickup.vy * pickup.vy);
      if (speed > MAX_MAGNET_SPEED) {
        pickup.vx = (pickup.vx / speed) * MAX_MAGNET_SPEED;
        pickup.vy = (pickup.vy / speed) * MAX_MAGNET_SPEED;
      }
    } else {
      // Apply friction when outside magnet range
      pickup.vx *= FRICTION;
      pickup.vy *= FRICTION;
      pickup.magnetized = false;
      pickup.magnetStrength = Math.max(0, pickup.magnetStrength - dt / 100);
    }

    // Update position
    pickup.x += pickup.vx * dt / 1000;
    pickup.y += pickup.vy * dt / 1000;

    // Keep pickups in bounds
    pickup.x = Math.max(10, Math.min(GAME_WIDTH - 10, pickup.x));
    pickup.y = Math.max(UI_HEIGHT + 10, Math.min(ROOM_HEIGHT - 10, pickup.y));
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt / 1000;
    p.y += p.vy * dt / 1000;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life -= dt;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function updateDamageNumbers(dt) {
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    const d = damageNumbers[i];
    d.y += d.vy * dt / 1000;
    d.vy *= 0.95; // Slow down rise
    d.life -= dt;

    if (d.life <= 0) {
      damageNumbers.splice(i, 1);
    }
  }
}

function updateMuzzleFlashes(dt) {
  for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
    const f = muzzleFlashes[i];
    f.life -= dt;

    if (f.life <= 0) {
      muzzleFlashes.splice(i, 1);
    }
  }
}

function updateBombExplosions(dt) {
  for (let i = bombExplosions.length - 1; i >= 0; i--) {
    const e = bombExplosions[i];
    e.life -= dt;

    // Expand radius
    const progress = 1 - (e.life / e.maxLife);
    e.radius = e.maxRadius * Math.pow(progress, 0.5); // Fast initial expansion

    if (e.life <= 0) {
      bombExplosions.splice(i, 1);
    }
  }
}

function updateDashTrails(dt) {
  for (let i = dashTrails.length - 1; i >= 0; i--) {
    const trail = dashTrails[i];
    trail.life -= dt;

    if (trail.life <= 0) {
      dashTrails.splice(i, 1);
    }
  }
}

function createElectricField(x, y, radius, duration, tickRate, damage) {
  electricFields.push({
    x: x,
    y: y,
    radius: radius,
    life: duration,
    maxLife: duration,
    tickRate: tickRate,
    tickTimer: 0,
    damage: damage
  });
}

function updateDrill(dt) {
  const weapon = player.currentWeapon;

  // Consume ammo
  const ammoToConsume = weapon.ammoPerSecond * dt / 1000;
  player.ammo = Math.max(0, player.ammo - ammoToConsume);

  // Calculate drill tip position
  const drillTipX = player.x + Math.cos(player.drillAngle) * weapon.drillLength;
  const drillTipY = player.y + Math.sin(player.drillAngle) * weapon.drillLength;

  // Update damage tick timer
  player.drillTickTimer += dt;
  const tickInterval = 100; // 100ms between damage ticks

  // Check collision with enemies
  for (const enemy of enemies) {
    if (!enemy.active) continue;

    // Check if enemy is within drill beam
    const drillHit = lineCircleIntersect(
      player.x, player.y,
      drillTipX, drillTipY,
      enemy.x, enemy.y,
      enemy.size + weapon.drillWidth / 2
    );

    if (drillHit) {
      // Deal damage on tick
      if (player.drillTickTimer >= tickInterval) {
        const damage = weapon.damage * player.damageMultiplier;
        enemy.takeDamage(damage);

        // Spark particles
        for (let i = 0; i < 3; i++) {
          particles.push({
            x: drillTipX,
            y: drillTipY,
            vx: (Math.random() - 0.5) * 150,
            vy: (Math.random() - 0.5) * 150,
            life: 150,
            maxLife: 150,
            size: 2 + Math.random() * 2,
            color: '#ffcc44'
          });
        }
      }

      // Drag enemy towards player
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        const dragSpeed = weapon.dragStrength * dt / 1000;
        enemy.x += (dx / dist) * dragSpeed;
        enemy.y += (dy / dist) * dragSpeed;
      }
    }
  }

  // Reset tick timer
  if (player.drillTickTimer >= tickInterval) {
    player.drillTickTimer = 0;
  }

  // Spawn continuous particles at drill tip
  if (Math.random() < 0.3) {
    particles.push({
      x: drillTipX + (Math.random() - 0.5) * 10,
      y: drillTipY + (Math.random() - 0.5) * 10,
      vx: Math.cos(player.drillAngle + Math.PI) * 50 + (Math.random() - 0.5) * 30,
      vy: Math.sin(player.drillAngle + Math.PI) * 50 + (Math.random() - 0.5) * 30,
      life: 200,
      maxLife: 200,
      size: 2 + Math.random() * 2,
      color: '#888888'
    });
  }
}

// Helper function for line-circle intersection
function lineCircleIntersect(x1, y1, x2, y2, cx, cy, r) {
  // Vector from start to end of line
  const dx = x2 - x1;
  const dy = y2 - y1;

  // Vector from start to circle center
  const fx = x1 - cx;
  const fy = y1 - cy;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return false;

  const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
  const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

  // Check if intersection is on the line segment
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1) || (t1 < 0 && t2 > 1);
}

function updateOrbitRunes(dt) {
  const ORBIT_SPEED = 2; // Radians per second
  const TARGET_RANGE = 200; // Detection range for enemies

  for (let i = orbitRunes.length - 1; i >= 0; i--) {
    const rune = orbitRunes[i];

    if (rune.state === 'orbiting') {
      // Update orbit angle
      rune.orbitAngle += ORBIT_SPEED * dt / 1000;

      // Update position to orbit around player
      rune.x = player.x + Math.cos(rune.orbitAngle) * rune.orbitRadius;
      rune.y = player.y + Math.sin(rune.orbitAngle) * rune.orbitRadius;

      // Look for target enemy
      let nearestEnemy = null;
      let nearestDist = TARGET_RANGE;

      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const dx = enemy.x - rune.x;
        const dy = enemy.y - rune.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = enemy;
        }
      }

      // Launch at target if found
      if (nearestEnemy) {
        rune.state = 'homing';
        rune.target = nearestEnemy;
        const angle = Math.atan2(nearestEnemy.y - rune.y, nearestEnemy.x - rune.x);
        rune.vx = Math.cos(angle) * rune.velocity;
        rune.vy = Math.sin(angle) * rune.velocity;
      }
    } else if (rune.state === 'homing') {
      // Update homing behavior
      if (rune.target && rune.target.active) {
        const dx = rune.target.x - rune.x;
        const dy = rune.target.y - rune.y;
        const targetAngle = Math.atan2(dy, dx);
        const currentAngle = Math.atan2(rune.vy, rune.vx);

        // Turn towards target
        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const turnAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), rune.homingStrength * dt / 1000);
        const newAngle = currentAngle + turnAmount;

        rune.vx = Math.cos(newAngle) * rune.velocity;
        rune.vy = Math.sin(newAngle) * rune.velocity;
      }

      // Move rune
      rune.x += rune.vx * dt / 1000;
      rune.y += rune.vy * dt / 1000;

      // Check collision with enemies
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const dx = enemy.x - rune.x;
        const dy = enemy.y - rune.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < enemy.size + rune.size) {
          enemy.takeDamage(rune.damage);
          // Impact particles
          for (let j = 0; j < 8; j++) {
            particles.push({
              x: rune.x,
              y: rune.y,
              vx: (Math.random() - 0.5) * 150,
              vy: (Math.random() - 0.5) * 150,
              life: 200,
              maxLife: 200,
              size: 3 + Math.random() * 2,
              color: rune.color
            });
          }
          orbitRunes.splice(i, 1);
          break;
        }
      }

      // Remove if off screen
      if (rune.x < -50 || rune.x > GAME_WIDTH + 50 ||
          rune.y < -50 || rune.y > GAME_HEIGHT + 50) {
        orbitRunes.splice(i, 1);
      }
    }
  }
}

function updateElectricFields(dt) {
  for (let i = electricFields.length - 1; i >= 0; i--) {
    const field = electricFields[i];
    field.life -= dt;
    field.tickTimer += dt;

    // Damage enemies in field
    if (field.tickTimer >= field.tickRate) {
      field.tickTimer = 0;

      for (const enemy of enemies) {
        if (!enemy.active) continue;

        const dx = enemy.x - field.x;
        const dy = enemy.y - field.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < field.radius + enemy.size) {
          enemy.takeDamage(field.damage);

          // Electric spark particles
          for (let j = 0; j < 3; j++) {
            particles.push({
              x: enemy.x + (Math.random() - 0.5) * enemy.size,
              y: enemy.y + (Math.random() - 0.5) * enemy.size,
              vx: (Math.random() - 0.5) * 100,
              vy: (Math.random() - 0.5) * 100,
              life: 150,
              maxLife: 150,
              size: 2 + Math.random() * 2,
              color: '#88ffff'
            });
          }
        }
      }
    }

    if (field.life <= 0) {
      electricFields.splice(i, 1);
    }
  }
}

function updateSaws(dt) {
  for (let i = saws.length - 1; i >= 0; i--) {
    const saw = saws[i];

    // Update position
    saw.x += saw.vx * dt / 1000;
    saw.y += saw.vy * dt / 1000;

    // Update rotation
    saw.rotation += saw.rotationSpeed * dt / 1000;

    // Update lifetime
    saw.life -= dt;

    // Wall bouncing
    if (saw.x - saw.size < 0) {
      saw.x = saw.size;
      saw.vx = Math.abs(saw.vx);
      saw.bounces++;
      spawnSawBounceParticles(saw);
    } else if (saw.x + saw.size > GAME_WIDTH) {
      saw.x = GAME_WIDTH - saw.size;
      saw.vx = -Math.abs(saw.vx);
      saw.bounces++;
      spawnSawBounceParticles(saw);
    }

    if (saw.y - saw.size < UI_HEIGHT) {
      saw.y = UI_HEIGHT + saw.size;
      saw.vy = Math.abs(saw.vy);
      saw.bounces++;
      spawnSawBounceParticles(saw);
    } else if (saw.y + saw.size > ROOM_HEIGHT) {
      saw.y = ROOM_HEIGHT - saw.size;
      saw.vy = -Math.abs(saw.vy);
      saw.bounces++;
      spawnSawBounceParticles(saw);
    }

    // Player collision
    if (player && !player.isInvincible) {
      const dx = player.x - saw.x;
      const dy = player.y - saw.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < saw.size + player.hitboxSize) {
        playerTakeDamage(saw.damage);
      }
    }

    // Remove saw if expired or too many bounces
    if (saw.life <= 0 || saw.bounces > saw.maxBounces) {
      // Death particles
      for (let j = 0; j < 8; j++) {
        particles.push({
          x: saw.x,
          y: saw.y,
          vx: (Math.random() - 0.5) * 200,
          vy: (Math.random() - 0.5) * 200,
          life: 300,
          maxLife: 300,
          size: 3 + Math.random() * 3,
          color: saw.color
        });
      }
      saws.splice(i, 1);
    }
  }
}

function spawnSawBounceParticles(saw) {
  for (let i = 0; i < 5; i++) {
    particles.push({
      x: saw.x,
      y: saw.y,
      vx: (Math.random() - 0.5) * 100,
      vy: (Math.random() - 0.5) * 100,
      life: 200,
      maxLife: 200,
      size: 2 + Math.random() * 2,
      color: '#ffaa44'
    });
  }
}

function checkCollisions() {
  // Player bullets vs enemies
  for (let i = playerBullets.length - 1; i >= 0; i--) {
    const bullet = playerBullets[i];
    let hitEnemy = false;
    let hitOrbitMinion = false;

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      // First check orbiting minions if enemy has them
      if (enemy.hasOrbitingMinions && enemy.aliveOrbitMinions() > 0) {
        for (let m = 0; m < enemy.orbitMinions.length; m++) {
          const minion = enemy.orbitMinions[m];
          if (!minion.alive) continue;

          const minionPos = enemy.getOrbitMinionPosition(m);
          const mdx = bullet.x - minionPos.x;
          const mdy = bullet.y - minionPos.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

          if (mdist < 8 + bullet.size) { // Minion size is 8
            enemy.damageOrbitMinion(m, bullet.damage);
            hitOrbitMinion = true;
            if (!bullet.piercing) break;
          }
        }
        if (hitOrbitMinion && !bullet.piercing) break;
      }

      const dx = bullet.x - enemy.x;
      const dy = bullet.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < enemy.size + bullet.size) {
        enemy.takeDamage(bullet.damage);

        // Apply DoT for Spear weapon
        if (bullet.isSpear && bullet.dotDamage && bullet.dotDuration && bullet.dotTicks) {
          enemy.applyDoT(bullet.dotDamage, bullet.dotDuration, bullet.dotTicks);
        }

        // Create electric field for Thunderhead weapon
        if (bullet.isThunderhead && bullet.fieldRadius > 0) {
          createElectricField(
            bullet.x, bullet.y,
            bullet.fieldRadius,
            bullet.fieldDuration,
            bullet.fieldTickRate,
            bullet.damage
          );
        }

        // Handle explosive bullets (keyword)
        if (bullet.isExplosive && bullet.explosionRadius > 0) {
          // Create explosion effect
          for (let j = 0; j < 15; j++) {
            const angle = (j / 15) * Math.PI * 2;
            particles.push({
              x: bullet.x,
              y: bullet.y,
              vx: Math.cos(angle) * (100 + Math.random() * 100),
              vy: Math.sin(angle) * (100 + Math.random() * 100),
              life: 300,
              maxLife: 300,
              size: 4 + Math.random() * 4,
              color: '#ff8800'
            });
          }

          // Damage all enemies in explosion radius
          for (const e of enemies) {
            if (!e.active || e === enemy) continue;
            const ex = e.x - bullet.x;
            const ey = e.y - bullet.y;
            const eDist = Math.sqrt(ex * ex + ey * ey);
            if (eDist < bullet.explosionRadius) {
              e.takeDamage(bullet.damage * 0.5); // 50% splash damage
            }
          }
        }

        // Handle vampiric bullets (keyword) - check for enemy death
        if (bullet.isVampiric && bullet.healChance > 0) {
          if (!enemy.active && Math.random() < bullet.healChance) {
            if (player.hp < player.maxHP) {
              player.hp = Math.min(player.maxHP, player.hp + 1);
              // Heal particles
              for (let j = 0; j < 8; j++) {
                particles.push({
                  x: player.x,
                  y: player.y,
                  vx: (Math.random() - 0.5) * 50,
                  vy: -30 - Math.random() * 50,
                  life: 400,
                  maxLife: 400,
                  size: 3 + Math.random() * 2,
                  color: '#ff0044'
                });
              }
            }
          }
        }

        hitEnemy = true;

        if (!bullet.piercing) {
          break;
        }
      }
    }

    if ((hitEnemy || hitOrbitMinion) && !bullet.piercing) {
      playerBullets.splice(i, 1);
    }
  }

  // Enemy bullets vs player
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const bullet = enemyBullets[i];

    const dx = bullet.x - player.x;
    const dy = bullet.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < player.hitboxRadius + bullet.size) {
      playerTakeDamage(bullet.damage);

      // Apply slow effect from ice bullets
      if (bullet.isIce && bullet.slowDuration && bullet.slowAmount) {
        player.slowTimer = bullet.slowDuration;
        player.slowAmount = bullet.slowAmount;
        // Ice particles on hit
        for (let j = 0; j < 8; j++) {
          particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 150,
            vy: (Math.random() - 0.5) * 150,
            life: 400,
            maxLife: 400,
            size: 3 + Math.random() * 3,
            color: '#88ddff'
          });
        }
      }

      enemyBullets.splice(i, 1);
    }
  }

  // Enemies vs player (contact damage)
  for (const enemy of enemies) {
    if (!enemy.active) continue;

    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < player.hitboxRadius + enemy.size) {
      playerTakeDamage(1);
    }
  }

  // Player vs pickups
  for (let i = pickups.length - 1; i >= 0; i--) {
    const pickup = pickups[i];

    const dx = pickup.x - player.x;
    const dy = pickup.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 20 + pickup.size) {
      collectPickup(pickup);
      pickups.splice(i, 1);
    }
  }

  // Player vs doors
  if (currentRoom && currentRoom.cleared) {
    for (const door of currentRoom.doors) {
      if (door.locked) continue;

      let doorX, doorY, doorWidth, doorHeight;

      switch (door.direction) {
        case 'north':
          doorX = GAME_WIDTH / 2 - 30;
          doorY = UI_HEIGHT;
          doorWidth = 60;
          doorHeight = 20;
          break;
        case 'south':
          doorX = GAME_WIDTH / 2 - 30;
          doorY = ROOM_HEIGHT - 20;
          doorWidth = 60;
          doorHeight = 20;
          break;
        case 'east':
          doorX = GAME_WIDTH - 20;
          doorY = (UI_HEIGHT + ROOM_HEIGHT) / 2 - 30;
          doorWidth = 20;
          doorHeight = 60;
          break;
        case 'west':
          doorX = 0;
          doorY = (UI_HEIGHT + ROOM_HEIGHT) / 2 - 30;
          doorWidth = 20;
          doorHeight = 60;
          break;
      }

      if (player.x > doorX && player.x < doorX + doorWidth &&
          player.y > doorY && player.y < doorY + doorHeight) {
        enterRoom(door.key);
        break;
      }
    }
  }
}

function collectPickup(pickup) {
  switch (pickup.type) {
    case 'health':
      player.hp = Math.min(player.maxHP, player.hp + pickup.value);
      break;
    case 'shield':
      player.shields = Math.min(player.maxShields, player.shields + pickup.value);
      break;
    case 'ammo':
      player.ammo = Math.min(player.maxAmmo, player.ammo + player.maxAmmo * pickup.value);
      player.ammoRefillTimer = 300; // Trigger refill animation
      break;
    case 'bomb':
      player.bombs = Math.min(player.maxBombs, player.bombs + pickup.value);
      break;
    case 'debris':
      player.debris += pickup.value;
      break;
    case 'max_hp':
      player.maxHP += pickup.value;
      player.hp += pickup.value;
      break;
    case 'weapon':
      // Switch to new weapon
      if (pickup.weapon && WEAPONS[pickup.weapon]) {
        player.currentWeapon = { ...WEAPONS[pickup.weapon] };
        player.ammo = player.currentWeapon.maxAmmo === Infinity ? 100 : player.currentWeapon.maxAmmo;
        // Initialize clip for clip-based weapons
        if (player.currentWeapon.clipSize) {
          player.maxClip = player.currentWeapon.clipSize;
          player.clipAmmo = player.currentWeapon.clipSize;
          player.isReloading = false;
          player.reloadTimer = 0;
        } else {
          player.maxClip = 0;
          player.clipAmmo = 0;
        }
        // Celebration particles
        for (let i = 0; i < 20; i++) {
          particles.push(createParticle(player.x, player.y, '#00ffff'));
        }
      }
      break;
    case 'cartridge':
      if (pickup.cartridge && addCartridge(pickup.cartridge)) {
        // Celebration particles
        const cartridgeData = CARTRIDGES[pickup.cartridge];
        for (let i = 0; i < 25; i++) {
          particles.push(createParticle(player.x, player.y, cartridgeData.color));
        }
      }
      break;
  }

  // Log event
  if (window.testHarness) {
    window.testHarness.logEvent('item_picked_up', {
      itemType: pickup.type,
      value: pickup.value
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════════════════════

function draw() {
  const theme = getFloorTheme();
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Apply screen shake
  ctx.save();
  if (screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * screenShakeIntensity;
    const shakeY = (Math.random() - 0.5) * screenShakeIntensity;
    ctx.translate(shakeX, shakeY);
  }

  if (gameState === 'playing' || gameState === 'paused') {
    drawRoom();
    drawPickups();
    drawFloorExitPortal();
    drawEnemies();
    drawDashTrails();
    drawPlayer();
    drawDrill();
    drawMuzzleFlashes();
    drawBullets();
    drawBombExplosions();
    drawElectricFields();
    drawSaws();
    drawOrbitRunes();
    drawParticles();
    drawDamageNumbers();
    drawUI();
    drawShop();
    drawUpgradeTerminal();
    drawShrine();
    drawBossRewardChoice();

    if (showMap) {
      drawMap();
    }

    // Full floor map on room clear
    if (showFullFloorMap && fullMapTimer > 0) {
      drawFullFloorMap();
    }

    // Room clear text flash
    if (roomClearTimer > 0) {
      const alpha = roomClearTimer / 500;
      const scale = 1 + (1 - alpha) * 0.5;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#00ff88';
      ctx.font = `bold ${Math.floor(32 * scale)}px Courier New`;
      ctx.textAlign = 'center';
      ctx.fillText('ROOM CLEARED!', GAME_WIDTH / 2, (UI_HEIGHT + ROOM_HEIGHT) / 2);
      ctx.restore();
    }

    // Draw pause overlay if paused
    if (gameState === 'paused') {
      drawPaused();
    }
  } else if (gameState === 'gameover') {
    drawGameOver();
  } else if (gameState === 'victory') {
    drawVictory();
  }

  // Red hit flash overlay
  if (hitFlashTimer > 0) {
    const flashAlpha = (hitFlashTimer / 150) * 0.4; // Max 40% opacity, fades out
    ctx.fillStyle = `rgba(255, 0, 0, ${Math.min(flashAlpha, 0.4)})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  // White boss phase transition flash
  if (phaseFlashTimer > 0) {
    const flashAlpha = (phaseFlashTimer / 200) * 0.6; // Max 60% opacity, fades out
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(flashAlpha, 0.6)})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  ctx.restore();
}

function drawRoom() {
  const theme = getFloorTheme();

  // Floor
  ctx.fillStyle = theme.floor;
  ctx.fillRect(0, UI_HEIGHT, GAME_WIDTH, ROOM_HEIGHT - UI_HEIGHT);

  // Grid pattern
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= GAME_WIDTH; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, UI_HEIGHT);
    ctx.lineTo(x, ROOM_HEIGHT);
    ctx.stroke();
  }
  for (let y = UI_HEIGHT; y <= ROOM_HEIGHT; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(GAME_WIDTH, y);
    ctx.stroke();
  }

  // Walls
  ctx.fillStyle = theme.wall;
  ctx.fillRect(0, UI_HEIGHT, GAME_WIDTH, 10);
  ctx.fillRect(0, ROOM_HEIGHT - 10, GAME_WIDTH, 10);
  ctx.fillRect(0, UI_HEIGHT, 10, ROOM_HEIGHT - UI_HEIGHT);
  ctx.fillRect(GAME_WIDTH - 10, UI_HEIGHT, 10, ROOM_HEIGHT - UI_HEIGHT);

  // Draw cracked walls for potential secret rooms
  drawCrackedWalls();

  // Doors
  if (currentRoom) {
    for (const door of currentRoom.doors) {
      ctx.fillStyle = door.locked ? COLORS.doorLocked : theme.accent;

      switch (door.direction) {
        case 'north':
          ctx.fillRect(GAME_WIDTH / 2 - 30, UI_HEIGHT, 60, 10);
          break;
        case 'south':
          ctx.fillRect(GAME_WIDTH / 2 - 30, ROOM_HEIGHT - 10, 60, 10);
          break;
        case 'east':
          ctx.fillRect(GAME_WIDTH - 10, (UI_HEIGHT + ROOM_HEIGHT) / 2 - 30, 10, 60);
          break;
        case 'west':
          ctx.fillRect(0, (UI_HEIGHT + ROOM_HEIGHT) / 2 - 30, 10, 60);
          break;
      }
    }
  }

  // Room type indicator
  if (currentRoom) {
    ctx.fillStyle = '#666';
    ctx.font = '12px Courier New';
    ctx.fillText(`${currentRoom.type.toUpperCase()} ROOM`, 20, UI_HEIGHT + 25);
  }
}

function drawDashTrails() {
  for (const trail of dashTrails) {
    const alpha = (trail.life / trail.maxLife) * 0.5;
    const scale = 0.8 + (trail.life / trail.maxLife) * 0.2;

    ctx.save();
    ctx.translate(trail.x, trail.y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    // Draw player shape as afterimage
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(12, 16);
    ctx.lineTo(0, 10);
    ctx.lineTo(-12, 16);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  // Blink when invincible
  if (player.isInvincible && Math.floor(Date.now() / 50) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  // Check if moving
  const isMoving = keys['ArrowUp'] || keys['KeyW'] || keys['ArrowDown'] || keys['KeyS'] ||
                   keys['ArrowLeft'] || keys['KeyA'] || keys['ArrowRight'] || keys['KeyD'];

  // Draw thruster flame when moving (behind ship)
  if (isMoving && !player.isDashing) {
    const flameFlicker = Math.sin(Date.now() * 0.03) * 0.3 + 0.7;
    const flameLength = 12 + Math.random() * 8;

    // Outer flame (orange)
    ctx.fillStyle = `rgba(255, 150, 0, ${flameFlicker * 0.8})`;
    ctx.beginPath();
    ctx.moveTo(-6, 16);
    ctx.lineTo(6, 16);
    ctx.lineTo(0, 16 + flameLength);
    ctx.closePath();
    ctx.fill();

    // Inner flame (yellow)
    ctx.fillStyle = `rgba(255, 255, 100, ${flameFlicker})`;
    ctx.beginPath();
    ctx.moveTo(-3, 16);
    ctx.lineTo(3, 16);
    ctx.lineTo(0, 16 + flameLength * 0.6);
    ctx.closePath();
    ctx.fill();
  }

  // Dash effect - leave trail
  if (player.isDashing) {
    ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(12, 16);
    ctx.lineTo(0, 10);
    ctx.lineTo(-12, 16);
    ctx.closePath();
    ctx.fill();
  }

  // Charge weapon indicator
  if (player.isCharging && player.currentWeapon.isCharge) {
    const chargePercent = player.chargeTime / player.currentWeapon.maxChargeTime;
    const radius = 20 + chargePercent * 15;
    const pulseIntensity = 0.5 + Math.sin(Date.now() * 0.01) * 0.2;

    // Outer charging glow
    ctx.fillStyle = `rgba(255, 0, 255, ${chargePercent * 0.4 * pulseIntensity})`;
    ctx.beginPath();
    ctx.arc(0, -10, radius, 0, Math.PI * 2);
    ctx.fill();

    // Charging ring
    ctx.strokeStyle = `rgba(255, 100, 255, ${0.5 + chargePercent * 0.5})`;
    ctx.lineWidth = 2 + chargePercent * 3;
    ctx.beginPath();
    ctx.arc(0, -10, radius * 0.7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * chargePercent);
    ctx.stroke();

    // Full charge flash
    if (chargePercent >= 0.95) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(Date.now() * 0.02) * 0.3})`;
      ctx.beginPath();
      ctx.arc(0, -10, radius * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Slow effect ice aura
  if (player.slowTimer > 0) {
    const pulseIntensity = 0.4 + Math.sin(Date.now() * 0.008) * 0.2;
    // Outer ice glow
    ctx.fillStyle = `rgba(136, 221, 255, ${pulseIntensity * 0.6})`;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
    // Ice crystals effect
    ctx.strokeStyle = `rgba(200, 240, 255, ${pulseIntensity})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + Date.now() * 0.001;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
      ctx.lineTo(Math.cos(angle) * 30, Math.sin(angle) * 30);
      ctx.stroke();
    }
  }

  // Ship body (use ship-specific color)
  ctx.fillStyle = player.shipColor || COLORS.player;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(12, 16);
  ctx.lineTo(0, 10);
  ctx.lineTo(-12, 16);
  ctx.closePath();
  ctx.fill();

  // Ship core
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  // Hitbox (when focused)
  if (player.isFocused) {
    // Pulsing glow effect
    const pulseAlpha = Math.sin(Date.now() * 0.008) * 0.3 + 0.5;

    // Outer glow
    ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha * 0.3})`;
    ctx.beginPath();
    ctx.arc(0, 0, player.hitboxRadius + 8, 0, Math.PI * 2);
    ctx.fill();

    // Inner glow
    ctx.fillStyle = `rgba(0, 255, 136, ${pulseAlpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(0, 0, player.hitboxRadius + 4, 0, Math.PI * 2);
    ctx.fill();

    // Hitbox circle
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, player.hitboxRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawDrill() {
  if (!player || !player.isDrilling || !player.currentWeapon.isDrill) return;

  const weapon = player.currentWeapon;
  const drillTipX = player.x + Math.cos(player.drillAngle) * weapon.drillLength;
  const drillTipY = player.y + Math.sin(player.drillAngle) * weapon.drillLength;

  ctx.save();

  // Drill beam glow
  const gradient = ctx.createLinearGradient(
    player.x, player.y,
    drillTipX, drillTipY
  );
  gradient.addColorStop(0, 'rgba(150, 150, 150, 0.8)');
  gradient.addColorStop(0.5, 'rgba(200, 200, 200, 0.9)');
  gradient.addColorStop(1, 'rgba(255, 255, 200, 1)');

  // Draw drill beam
  ctx.strokeStyle = gradient;
  ctx.lineWidth = weapon.drillWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(drillTipX, drillTipY);
  ctx.stroke();

  // Inner core
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = weapon.drillWidth * 0.4;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(drillTipX, drillTipY);
  ctx.stroke();

  // Drill tip spinning effect
  const spin = Date.now() * 0.02;
  const tipRadius = weapon.drillWidth * 0.6;
  for (let i = 0; i < 4; i++) {
    const angle = spin + (i / 4) * Math.PI * 2;
    ctx.fillStyle = i % 2 === 0 ? '#666666' : '#999999';
    ctx.beginPath();
    ctx.moveTo(drillTipX, drillTipY);
    ctx.arc(drillTipX, drillTipY, tipRadius, angle, angle + Math.PI / 2);
    ctx.closePath();
    ctx.fill();
  }

  // Tip highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(drillTipX, drillTipY, tipRadius * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawMuzzleFlashes() {
  for (const f of muzzleFlashes) {
    const alpha = f.life / f.maxLife;
    const size = f.size * (0.5 + 0.5 * alpha);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Outer glow
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.arc(f.x, f.y, size * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(f.x, f.y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawBullets() {
  // Player bullets with trail
  for (const bullet of playerBullets) {
    // Trail effect - draw fading circles behind
    const trailLength = 3;
    const trailSpacing = 8;

    for (let i = trailLength; i >= 0; i--) {
      const alpha = 0.3 * (1 - i / trailLength);
      const trailX = bullet.x - (bullet.vx * i * trailSpacing) / 720;
      const trailY = bullet.y - (bullet.vy * i * trailSpacing) / 720;
      const trailSize = bullet.size * (1 - i * 0.2);

      ctx.fillStyle = bullet.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main bullet
    ctx.globalAlpha = 1;
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
    ctx.fill();

    // Glow core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Enemy bullets
  for (const bullet of enemyBullets) {
    // Special glow for ice bullets
    if (bullet.isIce) {
      ctx.fillStyle = 'rgba(136, 221, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.size + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
    ctx.fill();

    // Ice bullet inner glow
    if (bullet.isIce) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outline for destructible
    if (bullet.destructible) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    enemy.draw(ctx);
  }
}

function drawPickups() {
  for (const pickup of pickups) {
    // Magnet glow effect
    if (pickup.magnetized && pickup.magnetStrength > 0) {
      const glowAlpha = pickup.magnetStrength * 0.6;
      const glowSize = pickup.size + 8 + Math.sin(Date.now() * 0.01) * 3;

      ctx.fillStyle = `rgba(255, 255, 100, ${glowAlpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(pickup.x, pickup.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Particle trail when moving fast
      const speed = Math.sqrt((pickup.vx || 0) ** 2 + (pickup.vy || 0) ** 2);
      if (speed > 100) {
        ctx.fillStyle = `rgba(255, 255, 150, ${glowAlpha * 0.2})`;
        ctx.beginPath();
        ctx.arc(pickup.x - (pickup.vx || 0) * 0.02, pickup.y - (pickup.vy || 0) * 0.02, pickup.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (pickup.type === 'cartridge') {
      // Special cartridge rendering
      const cartridge = CARTRIDGES[pickup.cartridge];
      const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.8;

      // Glow effect
      ctx.fillStyle = `rgba(${hexToRgb(cartridge.color)}, ${0.3 * pulse})`;
      ctx.beginPath();
      ctx.arc(pickup.x, pickup.y, pickup.size + 6, 0, Math.PI * 2);
      ctx.fill();

      // Background box
      ctx.fillStyle = '#222';
      ctx.fillRect(pickup.x - pickup.size, pickup.y - pickup.size, pickup.size * 2, pickup.size * 2);
      ctx.strokeStyle = cartridge.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(pickup.x - pickup.size, pickup.y - pickup.size, pickup.size * 2, pickup.size * 2);

      // Icon
      ctx.fillStyle = cartridge.color;
      ctx.font = `${pickup.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(cartridge.icon, pickup.x, pickup.y + pickup.size * 0.3);
      ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = pickup.color;
      ctx.beginPath();

      if (pickup.type === 'debris') {
        // Diamond shape for debris
        ctx.moveTo(pickup.x, pickup.y - pickup.size);
        ctx.lineTo(pickup.x + pickup.size, pickup.y);
        ctx.lineTo(pickup.x, pickup.y + pickup.size);
        ctx.lineTo(pickup.x - pickup.size, pickup.y);
      } else {
        // Circle for other pickups
        ctx.arc(pickup.x, pickup.y, pickup.size, 0, Math.PI * 2);
      }

      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawFloorExitPortal() {
  if (!floorExitPortal || !floorExitPortal.active) return;

  const portal = floorExitPortal;
  const theme = getFloorTheme();
  const pulse = Math.sin(portal.pulseTimer / 200) * 0.3 + 0.7;

  ctx.save();

  // Outer glow
  const gradient = ctx.createRadialGradient(
    portal.x, portal.y, portal.radius * 0.5,
    portal.x, portal.y, portal.radius * 1.5
  );
  gradient.addColorStop(0, `rgba(255, 255, 255, ${0.4 * pulse})`);
  gradient.addColorStop(0.5, `rgba(100, 255, 255, ${0.2 * pulse})`);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(portal.x, portal.y, portal.radius * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Portal rings
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(portal.x, portal.y, portal.radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = `rgba(100, 255, 255, ${0.6 * pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(portal.x, portal.y, portal.radius * 0.7, 0, Math.PI * 2);
  ctx.stroke();

  // Inner swirl effect
  ctx.fillStyle = `rgba(200, 255, 255, ${0.3 * pulse})`;
  ctx.beginPath();
  ctx.arc(portal.x, portal.y, portal.radius * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Text label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('NEXT FLOOR', portal.x, portal.y + portal.radius + 25);

  const nextTheme = FLOOR_THEMES[currentFloor + 1];
  if (nextTheme) {
    ctx.fillStyle = '#888888';
    ctx.font = '12px Courier New';
    ctx.fillText(nextTheme.name, portal.x, portal.y + portal.radius + 40);
  }

  ctx.restore();
}

function updateFloorExitPortal(dt) {
  if (!floorExitPortal || !floorExitPortal.active) return;

  floorExitPortal.pulseTimer += dt;

  // Check player collision with portal
  const dx = player.x - floorExitPortal.x;
  const dy = player.y - floorExitPortal.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < floorExitPortal.radius + 15) {
    // Player entered portal - advance to next floor
    advanceToNextFloor();
  }
}

function advanceToNextFloor() {
  currentFloor++;
  floorExitPortal = null;

  // Generate new floor
  floorMap = generateFloor(currentFloor);
  enterRoom(floorMap.startRoom);

  // Visual effect
  screenShake = 300;
  screenShakeIntensity = 8;

  // Spawn particles
  for (let i = 0; i < 40; i++) {
    particles.push(createParticle(player.x, player.y, '#00ffff'));
  }

  // Reset secret walls for new floor
  secretWalls = [];
  revealedSecretWalls = [];

  // Log event
  if (window.testHarness) {
    window.testHarness.logEvent('floor_advanced', {
      floor: currentFloor,
      theme: getFloorTheme().name
    });
  }
}

function drawBombExplosions() {
  for (const e of bombExplosions) {
    const alpha = e.life / e.maxLife;

    ctx.save();

    // Outer ring (magenta)
    ctx.strokeStyle = `rgba(255, 0, 255, ${alpha * 0.8})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner ring (white)
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glow
    ctx.fillStyle = `rgba(255, 0, 255, ${alpha * 0.1})`;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawElectricFields() {
  for (const field of electricFields) {
    const alpha = field.life / field.maxLife;
    const pulse = Math.sin(Date.now() / 50) * 0.3 + 0.7;

    ctx.save();

    // Outer electric ring
    ctx.strokeStyle = `rgba(68, 255, 255, ${alpha * pulse * 0.8})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(field.x, field.y, field.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Inner glow
    const gradient = ctx.createRadialGradient(
      field.x, field.y, 0,
      field.x, field.y, field.radius
    );
    gradient.addColorStop(0, `rgba(68, 255, 255, ${alpha * 0.3})`);
    gradient.addColorStop(0.5, `rgba(68, 255, 255, ${alpha * 0.1})`);
    gradient.addColorStop(1, 'rgba(68, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(field.x, field.y, field.radius, 0, Math.PI * 2);
    ctx.fill();

    // Electric sparks
    for (let i = 0; i < 4; i++) {
      const angle = (Date.now() / 200 + i * Math.PI / 2) % (Math.PI * 2);
      const sparkX = field.x + Math.cos(angle) * field.radius * 0.7;
      const sparkY = field.y + Math.sin(angle) * field.radius * 0.7;

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * pulse})`;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawSaws() {
  for (const saw of saws) {
    ctx.save();
    ctx.translate(saw.x, saw.y);
    ctx.rotate(saw.rotation);

    // Sawblade outer ring
    ctx.fillStyle = saw.color;
    ctx.beginPath();
    ctx.arc(0, 0, saw.size, 0, Math.PI * 2);
    ctx.fill();

    // Inner darker circle
    ctx.fillStyle = '#cc4422';
    ctx.beginPath();
    ctx.arc(0, 0, saw.size * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Center hole
    ctx.fillStyle = '#331100';
    ctx.beginPath();
    ctx.arc(0, 0, saw.size * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Teeth
    ctx.fillStyle = '#ffcc44';
    const numTeeth = 8;
    for (let i = 0; i < numTeeth; i++) {
      const angle = (i / numTeeth) * Math.PI * 2;
      const outerX = Math.cos(angle) * saw.size;
      const outerY = Math.sin(angle) * saw.size;
      const innerX = Math.cos(angle) * saw.size * 0.7;
      const innerY = Math.sin(angle) * saw.size * 0.7;

      // Triangle tooth
      const toothAngle = angle + Math.PI / numTeeth * 0.5;
      const tipX = Math.cos(toothAngle) * saw.size * 1.15;
      const tipY = Math.sin(toothAngle) * saw.size * 1.15;

      ctx.beginPath();
      ctx.moveTo(outerX, outerY);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(innerX, innerY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    // Glow effect
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = saw.color;
    ctx.beginPath();
    ctx.arc(saw.x, saw.y, saw.size * 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawOrbitRunes() {
  for (const rune of orbitRunes) {
    ctx.save();

    // Glow effect
    const gradient = ctx.createRadialGradient(
      rune.x, rune.y, 0,
      rune.x, rune.y, rune.size * 2
    );
    gradient.addColorStop(0, rune.color);
    gradient.addColorStop(0.5, `${rune.color}66`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(rune.x, rune.y, rune.size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Rune body (diamond shape)
    ctx.fillStyle = rune.color;
    ctx.beginPath();
    ctx.moveTo(rune.x, rune.y - rune.size);
    ctx.lineTo(rune.x + rune.size * 0.7, rune.y);
    ctx.lineTo(rune.x, rune.y + rune.size);
    ctx.lineTo(rune.x - rune.size * 0.7, rune.y);
    ctx.closePath();
    ctx.fill();

    // Inner glow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(rune.x, rune.y, rune.size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawParticles() {
  for (const p of particles) {
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
  for (const d of damageNumbers) {
    const alpha = d.life / d.maxLife;
    const scale = d.scale * (0.8 + 0.2 * alpha);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${Math.floor(14 * scale)}px Courier New`;
    ctx.textAlign = 'center';

    // Shadow
    ctx.fillStyle = '#000';
    ctx.fillText(d.damage, d.x + 1, d.y + 1);

    // Text color based on damage (yellow for normal, red for crits, or custom)
    ctx.fillStyle = d.customColor || (d.isCrit ? '#ff4444' : '#ffff00');
    ctx.fillText(d.damage, d.x, d.y);

    ctx.restore();
  }
}

function drawUI() {
  // UI Background
  ctx.fillStyle = '#111118';
  ctx.fillRect(0, 0, GAME_WIDTH, UI_HEIGHT);
  ctx.fillRect(0, ROOM_HEIGHT, GAME_WIDTH, GAME_HEIGHT - ROOM_HEIGHT);

  // Health (with smooth transitions and flash effect)
  ctx.fillStyle = '#888';
  ctx.font = '14px Courier New';
  ctx.fillText('HP:', 10, 25);

  const hpFlashIntensity = player.hpFlashTimer > 0 ? (player.hpFlashTimer / 500) : 0;
  const lowHpPulse = player.hp <= 1 && player.hp > 0 ? 0.3 + Math.sin(Date.now() * 0.01) * 0.3 : 0;

  for (let i = 0; i < player.maxHP; i++) {
    // Background bar (empty)
    ctx.fillStyle = '#333';
    ctx.fillRect(45 + i * 18, 12, 14, 14);

    // Filled health with smooth transition
    if (i < Math.ceil(player.displayHP)) {
      const fillAmount = Math.min(1, player.displayHP - i);

      // Flash effect on damage
      if (hpFlashIntensity > 0) {
        ctx.fillStyle = `rgb(${255}, ${Math.floor(68 + hpFlashIntensity * 187)}, ${Math.floor(68 + hpFlashIntensity * 187)})`;
      } else if (lowHpPulse > 0) {
        // Low HP warning pulse
        ctx.fillStyle = `rgb(255, ${Math.floor(68 + lowHpPulse * 100)}, ${Math.floor(68 + lowHpPulse * 50)})`;
      } else {
        ctx.fillStyle = COLORS.health;
      }

      ctx.fillRect(45 + i * 18, 12, 14 * fillAmount, 14);
    }

    // Draining health indicator (when damage was taken)
    if (i >= player.hp && i < Math.ceil(player.displayHP)) {
      ctx.fillStyle = 'rgba(255, 68, 68, 0.5)';
      ctx.fillRect(45 + i * 18, 12, 14, 14);
    }
  }

  // Shields (with smooth transitions)
  ctx.fillStyle = '#888';
  ctx.fillText('SH:', 10, 50);

  for (let i = 0; i < player.maxShields; i++) {
    ctx.fillStyle = '#333';
    ctx.fillRect(45 + i * 18, 37, 14, 14);

    if (i < Math.ceil(player.displayShields)) {
      const fillAmount = Math.min(1, player.displayShields - i);
      ctx.fillStyle = COLORS.shield;
      ctx.fillRect(45 + i * 18, 37, 14 * fillAmount, 14);
    }
  }

  // Bombs
  ctx.fillStyle = '#888';
  ctx.fillText('BOMB:', 10, 75);

  for (let i = 0; i < player.maxBombs; i++) {
    ctx.fillStyle = i < player.bombs ? '#ff00ff' : '#333';
    ctx.beginPath();
    ctx.arc(65 + i * 18, 68, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Weapon & Ammo
  ctx.fillStyle = '#888';
  ctx.fillText(`WEAPON: ${player.currentWeapon.name}`, 200, 25);

  if (player.currentWeapon.maxAmmo !== Infinity) {
    ctx.fillText('AMMO:', 200, 50);
    const ammoPercent = player.displayAmmo / player.maxAmmo;
    const actualPercent = player.ammo / player.maxAmmo;

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(265, 38, 100, 14);

    // Refill flash indicator (shows where ammo is being added)
    if (player.ammoRefillTimer > 0 && ammoPercent < actualPercent) {
      ctx.fillStyle = `rgba(255, 255, 255, ${player.ammoRefillTimer / 300})`;
      ctx.fillRect(265 + 100 * ammoPercent, 38, 100 * (actualPercent - ammoPercent), 14);
    }

    // Smooth ammo bar
    ctx.fillStyle = COLORS.ammo;
    ctx.fillRect(265, 38, 100 * ammoPercent, 14);

    // Clip indicator for revolver-type weapons
    if (player.currentWeapon.clipSize) {
      // Draw clip bullets
      ctx.fillStyle = '#888';
      ctx.fillText('CLIP:', 380, 50);
      for (let i = 0; i < player.maxClip; i++) {
        ctx.fillStyle = i < player.clipAmmo ? '#ffaa44' : '#333';
        ctx.fillRect(425 + i * 14, 38, 10, 14);
      }

      // Reload indicator
      if (player.isReloading) {
        const reloadPercent = 1 - (player.reloadTimer / player.currentWeapon.reloadTime);
        ctx.fillStyle = '#ff4444';
        ctx.fillText('RELOADING', 380, 25);
        // Progress bar
        ctx.fillStyle = '#333';
        ctx.fillRect(425, 13, player.maxClip * 14, 10);
        ctx.fillStyle = '#ffaa44';
        ctx.fillRect(425, 13, player.maxClip * 14 * reloadPercent, 10);
      }
    }
  } else {
    ctx.fillText('AMMO: INFINITE', 200, 50);
  }

  // Multiplier
  ctx.fillStyle = '#888';
  ctx.fillText(`MULT: x${player.multiplier.toFixed(2)}`, 200, 75);

  // Debris
  ctx.fillStyle = COLORS.debris;
  ctx.fillText(`DEBRIS: ${Math.floor(player.debris)}`, 400, 25);

  // Floor info
  ctx.fillStyle = '#888';
  ctx.fillText(`FLOOR ${currentFloor}`, 400, 50);
  ctx.fillText(`ROOMS: ${roomsCleared}`, 400, 75);

  // Cartridge inventory display
  if (cartridgeInventory.length > 0) {
    ctx.fillStyle = '#888';
    ctx.font = '11px Courier New';
    ctx.fillText('CARTRIDGES:', 550, 50);

    for (let i = 0; i < cartridgeInventory.length; i++) {
      const cartridge = CARTRIDGES[cartridgeInventory[i]];
      const slotX = 640 + (i % 4) * 24;
      const slotY = 35 + Math.floor(i / 4) * 24;

      // Slot background
      ctx.fillStyle = '#222';
      ctx.fillRect(slotX, slotY, 20, 20);
      ctx.strokeStyle = cartridge.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(slotX, slotY, 20, 20);

      // Cartridge icon
      ctx.fillStyle = cartridge.color;
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(cartridge.icon, slotX + 10, slotY + 15);
    }
    ctx.textAlign = 'left';
  }

  // Blessing display (bottom bar)
  if (activeBlessing) {
    const blessing = BLESSINGS[activeBlessing];
    ctx.fillStyle = blessing.color;
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'right';
    ctx.fillText(`${blessing.icon} ${blessing.name}`, GAME_WIDTH - 10, ROOM_HEIGHT + 20);
    ctx.textAlign = 'left';
  }

  // Bottom UI
  ctx.fillStyle = '#888';
  ctx.font = '12px Courier New';
  ctx.fillText('TAB: Map | Z: Dash | X: Bomb | SHIFT: Focus', 10, ROOM_HEIGHT + 20);

  // Dash cooldown indicator
  if (player.dashCooldownTimer > 0) {
    ctx.fillStyle = '#666';
    ctx.fillText(`DASH: ${(player.dashCooldownTimer / 1000).toFixed(1)}s`, 600, 25);
  } else {
    ctx.fillStyle = '#00ff88';
    ctx.fillText('DASH: READY', 600, 25);
  }
}

function drawMap() {
  if (!floorMap) return;

  const mapWidth = 200;
  const mapHeight = 200;
  const mapX = GAME_WIDTH - mapWidth - 20;
  const mapY = UI_HEIGHT + 40;
  const cellSize = 20;

  // Background panel
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(mapX - 10, mapY - 30, mapWidth + 20, mapHeight + 80);
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 1;
  ctx.strokeRect(mapX - 10, mapY - 30, mapWidth + 20, mapHeight + 80);

  // Title
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 14px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('FLOOR ' + currentFloor, mapX + mapWidth / 2, mapY - 12);
  ctx.textAlign = 'left';

  // Draw room connections first (behind rooms)
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  for (const [key, room] of Object.entries(floorMap.rooms)) {
    if (!room.visited && !player.hasScanner) continue;
    const [x, y] = key.split(',').map(Number);
    const rx = mapX + x * cellSize + cellSize / 2;
    const ry = mapY + (floorMap.gridSize - 1 - y) * cellSize + cellSize / 2;

    // Draw connections to adjacent rooms
    if (room.doors) {
      for (const door of room.doors) {
        const [dx, dy] = door.key.split(',').map(Number);
        const destRoom = floorMap.rooms[door.key];
        if (!destRoom || (!destRoom.visited && !player.hasScanner)) continue;

        const drx = mapX + dx * cellSize + cellSize / 2;
        const dry = mapY + (floorMap.gridSize - 1 - dy) * cellSize + cellSize / 2;

        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(drx, dry);
        ctx.stroke();
      }
    }
  }

  // Draw rooms
  for (const [key, room] of Object.entries(floorMap.rooms)) {
    const [x, y] = key.split(',').map(Number);
    const rx = mapX + x * cellSize;
    const ry = mapY + (floorMap.gridSize - 1 - y) * cellSize;

    // Room color based on type
    if (!room.visited && !player.hasScanner) {
      ctx.fillStyle = '#333';
    } else {
      switch (room.type) {
        case 'start': ctx.fillStyle = '#00ff88'; break;
        case 'boss': ctx.fillStyle = '#ff0000'; break;
        case 'miniboss': ctx.fillStyle = '#ff8800'; break;
        case 'shop': ctx.fillStyle = '#ffff00'; break;
        case 'upgrade': ctx.fillStyle = '#00ffff'; break;
        case 'shrine': ctx.fillStyle = '#ff44ff'; break;
        case 'secret': ctx.fillStyle = '#88ff88'; break;
        default: ctx.fillStyle = room.cleared ? '#4444ff' : '#666';
      }
    }

    ctx.fillRect(rx + 2, ry + 2, cellSize - 4, cellSize - 4);

    // Current room indicator (pulsing)
    if (key === floorMap.currentRoomKey) {
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + pulse * 0.5})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(rx + 1, ry + 1, cellSize - 2, cellSize - 2);
    }
  }

  // Legend
  const legendY = mapY + mapHeight + 5;
  ctx.font = '10px Courier New';

  const legend = [
    { color: '#00ff88', label: 'Start' },
    { color: '#ff0000', label: 'Boss' },
    { color: '#4444ff', label: 'Clear' },
    { color: '#666', label: '???' }
  ];

  let legendX = mapX;
  for (const item of legend) {
    ctx.fillStyle = item.color;
    ctx.fillRect(legendX, legendY, 8, 8);
    ctx.fillStyle = '#888';
    ctx.fillText(item.label, legendX + 12, legendY + 8);
    legendX += 50;
  }
}

function drawFullFloorMap() {
  if (!floorMap) return;

  const alpha = Math.min(1, fullMapTimer / 500); // Fade in first 0.5s
  const fadeOut = fullMapTimer < 500 ? fullMapTimer / 500 : 1; // Fade out last 0.5s

  ctx.save();
  ctx.globalAlpha = Math.min(alpha, fadeOut) * 0.95;

  // Full screen overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, UI_HEIGHT, GAME_WIDTH, ROOM_HEIGHT);

  // Calculate map dimensions to fit the screen
  const cellSize = 40;
  const gridSize = floorMap.gridSize || 10;
  const mapWidth = gridSize * cellSize;
  const mapHeight = gridSize * cellSize;
  const mapX = (GAME_WIDTH - mapWidth) / 2;
  const mapY = UI_HEIGHT + (ROOM_HEIGHT - mapHeight) / 2;

  // Panel background
  ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
  ctx.fillRect(mapX - 30, mapY - 50, mapWidth + 60, mapHeight + 100);
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 2;
  ctx.strokeRect(mapX - 30, mapY - 50, mapWidth + 60, mapHeight + 100);

  // Title
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 24px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText(`FLOOR ${currentFloor} - ROOM CLEARED`, GAME_WIDTH / 2, mapY - 20);

  // Draw room connections
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 3;
  for (const [key, room] of Object.entries(floorMap.rooms)) {
    const [x, y] = key.split(',').map(Number);
    const rx = mapX + x * cellSize + cellSize / 2;
    const ry = mapY + (gridSize - 1 - y) * cellSize + cellSize / 2;

    if (room.doors) {
      for (const door of room.doors) {
        const [dx, dy] = door.key.split(',').map(Number);
        const destRoom = floorMap.rooms[door.key];
        if (!destRoom) continue;

        const drx = mapX + dx * cellSize + cellSize / 2;
        const dry = mapY + (gridSize - 1 - dy) * cellSize + cellSize / 2;

        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(drx, dry);
        ctx.stroke();
      }
    }
  }

  // Draw rooms
  for (const [key, room] of Object.entries(floorMap.rooms)) {
    const [x, y] = key.split(',').map(Number);
    const rx = mapX + x * cellSize;
    const ry = mapY + (gridSize - 1 - y) * cellSize;

    // Room color based on type and visited status
    if (!room.visited && !player.hasScanner) {
      ctx.fillStyle = '#222';
    } else {
      switch (room.type) {
        case 'start': ctx.fillStyle = '#00ff88'; break;
        case 'boss': ctx.fillStyle = '#ff0000'; break;
        case 'miniboss': ctx.fillStyle = '#ff8800'; break;
        case 'shop': ctx.fillStyle = '#ffff00'; break;
        case 'upgrade': ctx.fillStyle = '#00ffff'; break;
        case 'shrine': ctx.fillStyle = '#ff44ff'; break;
        case 'secret': ctx.fillStyle = '#88ff88'; break;
        default: ctx.fillStyle = room.cleared ? '#4466ff' : '#666';
      }
    }

    // Draw room square
    ctx.fillRect(rx + 4, ry + 4, cellSize - 8, cellSize - 8);

    // Current room glow
    if (key === floorMap.currentRoomKey) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(rx + 2, ry + 2, cellSize - 4, cellSize - 4);
      ctx.shadowBlur = 0;
    }

    // Draw room type icon
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'center';
    if (room.visited || player.hasScanner) {
      let icon = '';
      switch (room.type) {
        case 'start': icon = 'S'; break;
        case 'boss': icon = 'B'; break;
        case 'miniboss': icon = 'M'; break;
        case 'shop': icon = '$'; break;
        case 'upgrade': icon = 'U'; break;
        case 'shrine': icon = '†'; break;
        case 'secret': icon = '?'; break;
        default: icon = room.cleared ? '✓' : '';
      }
      ctx.fillText(icon, rx + cellSize / 2, ry + cellSize / 2 + 5);
    }
  }

  // Legend at bottom
  const legendY = mapY + mapHeight + 15;
  ctx.font = '12px Courier New';
  ctx.textAlign = 'left';

  const legend = [
    { color: '#00ff88', label: 'Start (S)', icon: 'S' },
    { color: '#ff0000', label: 'Boss (B)', icon: 'B' },
    { color: '#ff8800', label: 'Mini (M)', icon: 'M' },
    { color: '#ffff00', label: 'Shop ($)', icon: '$' },
    { color: '#00ffff', label: 'Upgrade (U)', icon: 'U' },
    { color: '#4466ff', label: 'Cleared (✓)', icon: '✓' }
  ];

  let legendX = mapX;
  for (const item of legend) {
    ctx.fillStyle = item.color;
    ctx.fillRect(legendX, legendY, 12, 12);
    ctx.fillStyle = '#888';
    ctx.fillText(item.label, legendX + 16, legendY + 10);
    legendX += 100;
  }

  // Instructions
  ctx.fillStyle = '#666';
  ctx.font = '14px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('Press TAB to toggle minimap | Auto-hiding in ' + Math.ceil(fullMapTimer / 1000) + 's', GAME_WIDTH / 2, legendY + 35);

  ctx.restore();
}

function drawShop() {
  if (!currentRoom || currentRoom.type !== 'shop') return;
  if (shopInventory.length === 0) return;

  const shopWidth = 350;
  const shopHeight = 60 + shopInventory.length * 70;
  const shopX = (GAME_WIDTH - shopWidth) / 2;
  const shopY = UI_HEIGHT + 50;

  // Shop background panel
  ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
  ctx.fillRect(shopX, shopY, shopWidth, shopHeight);
  ctx.strokeStyle = '#ffff00';
  ctx.lineWidth = 2;
  ctx.strokeRect(shopX, shopY, shopWidth, shopHeight);

  // Title
  ctx.fillStyle = '#ffff00';
  ctx.font = 'bold 20px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('SHOP', shopX + shopWidth / 2, shopY + 30);

  // Debris display
  ctx.fillStyle = '#88ff88';
  ctx.font = '14px Courier New';
  ctx.fillText(`Debris: ${Math.floor(player.debris)}`, shopX + shopWidth / 2, shopY + 50);

  // Draw items
  ctx.textAlign = 'left';
  for (let i = 0; i < shopInventory.length; i++) {
    const item = shopInventory[i];
    const itemY = shopY + 70 + i * 70;
    const isSelected = i === selectedShopItem;

    // Selection highlight
    if (isSelected) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
      ctx.fillRect(shopX + 10, itemY - 5, shopWidth - 20, 60);
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 1;
      ctx.strokeRect(shopX + 10, itemY - 5, shopWidth - 20, 60);
    }

    // Item icon background
    ctx.fillStyle = item.purchased ? '#333' : item.color;
    ctx.fillRect(shopX + 20, itemY, 45, 45);

    // Item icon
    ctx.fillStyle = item.purchased ? '#666' : '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(item.icon, shopX + 42, itemY + 32);

    // Item name
    ctx.textAlign = 'left';
    ctx.font = item.purchased ? '14px Courier New' : 'bold 14px Courier New';
    ctx.fillStyle = item.purchased ? '#666' : '#fff';
    ctx.fillText(item.purchased ? item.name + ' [SOLD]' : item.name, shopX + 75, itemY + 18);

    // Item description
    ctx.font = '12px Courier New';
    ctx.fillStyle = item.purchased ? '#444' : '#888';
    ctx.fillText(item.description, shopX + 75, itemY + 34);

    // Price
    const canAfford = player.debris >= item.price;
    const canUse = item.canBuy(player);
    ctx.font = 'bold 14px Courier New';
    if (item.purchased) {
      ctx.fillStyle = '#444';
      ctx.fillText('---', shopX + 75, itemY + 50);
    } else if (!canAfford) {
      ctx.fillStyle = '#ff4444';
      ctx.fillText(`${item.price} (need ${item.price - Math.floor(player.debris)})`, shopX + 75, itemY + 50);
    } else if (!canUse) {
      ctx.fillStyle = '#ff8800';
      ctx.fillText(`${item.price} (MAX)`, shopX + 75, itemY + 50);
    } else {
      ctx.fillStyle = '#88ff88';
      ctx.fillText(`${item.price}`, shopX + 75, itemY + 50);
    }
  }

  // Instructions
  ctx.textAlign = 'center';
  ctx.font = '12px Courier New';
  ctx.fillStyle = '#666';
  ctx.fillText('W/S: Select | E/SPACE: Purchase', shopX + shopWidth / 2, shopY + shopHeight - 10);
}

function drawUpgradeTerminal() {
  if (!currentRoom || currentRoom.type !== 'upgrade') return;
  if (upgradeChoices.length === 0) return;

  const termWidth = 500;
  const termHeight = upgradeUsed ? 150 : 280;
  const termX = (GAME_WIDTH - termWidth) / 2;
  const termY = UI_HEIGHT + 50;

  // Terminal background panel
  ctx.fillStyle = 'rgba(20, 30, 40, 0.95)';
  ctx.fillRect(termX, termY, termWidth, termHeight);
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(termX, termY, termWidth, termHeight);

  // Title
  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold 20px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('UPGRADE TERMINAL', termX + termWidth / 2, termY + 30);

  if (upgradeUsed) {
    // Show "upgrade selected" message
    ctx.fillStyle = '#888';
    ctx.font = '16px Courier New';
    ctx.fillText('Upgrade acquired. Terminal depleted.', termX + termWidth / 2, termY + 80);

    // Show selected upgrade
    const selectedChoice = upgradeChoices[selectedUpgrade];
    if (selectedChoice) {
      ctx.fillStyle = selectedChoice.color;
      ctx.font = 'bold 18px Courier New';
      ctx.fillText(selectedChoice.name, termX + termWidth / 2, termY + 110);
      ctx.fillStyle = '#666';
      ctx.font = '14px Courier New';
      ctx.fillText(selectedChoice.description, termX + termWidth / 2, termY + 130);
    }
    return;
  }

  // Subtitle
  ctx.fillStyle = '#888';
  ctx.font = '14px Courier New';
  ctx.fillText('Choose one upgrade (FREE)', termX + termWidth / 2, termY + 50);

  // Draw upgrade choices side by side
  const choiceWidth = 140;
  const choiceGap = 20;
  const startX = termX + (termWidth - (choiceWidth * 3 + choiceGap * 2)) / 2;
  const choiceY = termY + 70;

  for (let i = 0; i < upgradeChoices.length; i++) {
    const choice = upgradeChoices[i];
    const choiceX = startX + i * (choiceWidth + choiceGap);
    const isSelected = i === selectedUpgrade;

    // Choice box
    if (isSelected) {
      ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
      ctx.fillRect(choiceX, choiceY, choiceWidth, 170);
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(choiceX, choiceY, choiceWidth, 170);
    } else {
      ctx.fillStyle = 'rgba(40, 50, 60, 0.8)';
      ctx.fillRect(choiceX, choiceY, choiceWidth, 170);
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      ctx.strokeRect(choiceX, choiceY, choiceWidth, 170);
    }

    // Icon background
    ctx.fillStyle = choice.color;
    ctx.fillRect(choiceX + choiceWidth / 2 - 25, choiceY + 15, 50, 50);

    // Icon
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(choice.icon, choiceX + choiceWidth / 2, choiceY + 52);

    // Name
    ctx.fillStyle = isSelected ? '#fff' : '#aaa';
    ctx.font = isSelected ? 'bold 12px Courier New' : '12px Courier New';
    ctx.fillText(choice.name, choiceX + choiceWidth / 2, choiceY + 85);

    // Description (wrapped)
    ctx.fillStyle = '#888';
    ctx.font = '10px Courier New';
    const words = choice.description.split(' ');
    let line = '';
    let lineY = choiceY + 105;
    for (const word of words) {
      const testLine = line + word + ' ';
      if (ctx.measureText(testLine).width > choiceWidth - 10) {
        ctx.fillText(line.trim(), choiceX + choiceWidth / 2, lineY);
        line = word + ' ';
        lineY += 14;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), choiceX + choiceWidth / 2, lineY);
  }

  // Instructions
  ctx.fillStyle = '#666';
  ctx.font = '12px Courier New';
  ctx.fillText('A/D: Select | E/ENTER: Confirm', termX + termWidth / 2, termY + termHeight - 15);
}

function drawShrine() {
  if (!currentRoom || currentRoom.type !== 'shrine') return;
  if (!currentShrine) return;

  const shrineWidth = 350;
  const shrineHeight = shrineUsed ? 180 : 250;
  const shrineX = (GAME_WIDTH - shrineWidth) / 2;
  const shrineY = UI_HEIGHT + 80;

  // Shrine background with glow
  ctx.shadowColor = currentShrine.color;
  ctx.shadowBlur = 20;
  ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
  ctx.fillRect(shrineX, shrineY, shrineWidth, shrineHeight);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = currentShrine.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(shrineX, shrineY, shrineWidth, shrineHeight);

  // Shrine icon (large)
  ctx.fillStyle = currentShrine.color;
  ctx.font = '60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(currentShrine.icon, shrineX + shrineWidth / 2, shrineY + 70);

  // Shrine name
  ctx.fillStyle = currentShrine.color;
  ctx.font = 'bold 20px Courier New';
  ctx.fillText(currentShrine.name, shrineX + shrineWidth / 2, shrineY + 100);

  // Description
  ctx.fillStyle = '#888';
  ctx.font = '14px Courier New';
  ctx.fillText(currentShrine.description, shrineX + shrineWidth / 2, shrineY + 125);

  if (shrineUsed) {
    // Used state
    ctx.fillStyle = '#666';
    ctx.font = '16px Courier New';
    ctx.fillText('Shrine depleted', shrineX + shrineWidth / 2, shrineY + 160);
  } else {
    // Cost
    const cost = currentShrine.cost;
    let costText = '';
    switch (cost.type) {
      case 'hp': costText = `Cost: ${cost.amount} HP`; break;
      case 'debris': costText = `Cost: ${cost.amount} Debris`; break;
      case 'bomb': costText = `Cost: ${cost.amount} Bomb`; break;
      case 'shield': costText = `Cost: ${cost.amount} Shield`; break;
      case 'speed': costText = `Cost: ${Math.abs(cost.amount) * 100}% Speed`; break;
    }

    ctx.fillStyle = canUseShrine() ? '#ff8888' : '#ff4444';
    ctx.font = '14px Courier New';
    ctx.fillText(costText, shrineX + shrineWidth / 2, shrineY + 155);

    // Reward
    ctx.fillStyle = '#88ff88';
    ctx.fillText('Reward: ' + currentShrine.reward.desc, shrineX + shrineWidth / 2, shrineY + 180);

    // Use instruction
    if (canUseShrine()) {
      ctx.fillStyle = currentShrine.color;
      ctx.font = 'bold 14px Courier New';
      ctx.fillText('Press E to accept the trade', shrineX + shrineWidth / 2, shrineY + 215);
    } else {
      ctx.fillStyle = '#ff4444';
      ctx.font = '12px Courier New';
      ctx.fillText('Cannot afford this trade', shrineX + shrineWidth / 2, shrineY + 215);
    }

    // Instructions
    ctx.fillStyle = '#666';
    ctx.font = '12px Courier New';
    ctx.fillText('E: Accept Trade', shrineX + shrineWidth / 2, shrineY + shrineHeight - 10);
  }
}

function drawBossRewardChoice() {
  if (!bossRewardChoices || bossRewardChosen) return;
  if (!currentRoom || currentRoom.type !== 'boss') return;

  // Dim background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  const panelWidth = 500;
  const panelHeight = 300;
  const panelX = (GAME_WIDTH - panelWidth) / 2;
  const panelY = UI_HEIGHT + 80;

  // Panel background
  ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
  ctx.strokeStyle = '#ffcc00';
  ctx.lineWidth = 3;
  ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

  // Title
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 24px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('BOSS DEFEATED!', panelX + panelWidth / 2, panelY + 35);

  // Subtitle
  ctx.fillStyle = '#888';
  ctx.font = '14px Courier New';
  ctx.fillText('Choose your reward', panelX + panelWidth / 2, panelY + 60);

  // Draw reward choices
  const choiceWidth = 140;
  const choiceGap = 20;
  const startX = panelX + (panelWidth - (choiceWidth * 3 + choiceGap * 2)) / 2;
  const choiceY = panelY + 80;

  for (let i = 0; i < bossRewardChoices.length; i++) {
    const reward = bossRewardChoices[i];
    const choiceX = startX + i * (choiceWidth + choiceGap);
    const isSelected = i === selectedBossReward;

    // Choice box
    if (isSelected) {
      ctx.fillStyle = `rgba(${hexToRgb(reward.color)}, 0.3)`;
      ctx.fillRect(choiceX, choiceY, choiceWidth, 170);
      ctx.strokeStyle = reward.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(choiceX, choiceY, choiceWidth, 170);
    } else {
      ctx.fillStyle = 'rgba(40, 50, 60, 0.8)';
      ctx.fillRect(choiceX, choiceY, choiceWidth, 170);
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      ctx.strokeRect(choiceX, choiceY, choiceWidth, 170);
    }

    // Icon
    ctx.fillStyle = reward.color;
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(reward.icon, choiceX + choiceWidth / 2, choiceY + 60);

    // Name
    ctx.fillStyle = isSelected ? reward.color : '#aaa';
    ctx.font = 'bold 14px Courier New';
    ctx.fillText(reward.name, choiceX + choiceWidth / 2, choiceY + 100);

    // Description
    ctx.fillStyle = '#888';
    ctx.font = '11px Courier New';
    const lines = wrapText(reward.description, choiceWidth - 10);
    lines.forEach((line, li) => {
      ctx.fillText(line, choiceX + choiceWidth / 2, choiceY + 120 + li * 14);
    });

    // Number hint
    ctx.fillStyle = isSelected ? reward.color : '#555';
    ctx.font = 'bold 18px Courier New';
    ctx.fillText(`[${i + 1}]`, choiceX + choiceWidth / 2, choiceY + 160);
  }

  // Instructions
  ctx.fillStyle = '#ffcc00';
  ctx.font = '14px Courier New';
  ctx.fillText('A/D or 1/2/3 to select | E or Enter to confirm', panelX + panelWidth / 2, panelY + panelHeight - 20);
}

// Helper to convert hex color to rgb for rgba()
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '255, 255, 255';
}

// Helper for text wrapping
function wrapText(text, maxWidth) {
  // Simple word-based wrapping for short descriptions
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    if (testLine.length * 6 > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawPaused() {
  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Title
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);

  // Stats
  ctx.fillStyle = '#888';
  ctx.font = '18px Courier New';
  ctx.fillText(`Floor: ${currentFloor}  |  Rooms: ${roomsCleared}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);
  ctx.fillText(`Weapon: ${player.currentWeapon.name}  |  Debris: ${Math.floor(player.debris)}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);

  // Instructions
  ctx.fillStyle = '#666';
  ctx.font = '14px Courier New';
  ctx.fillText('Press ESC to resume', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
  ctx.fillText('WASD: Move | Space: Fire | Z: Dash | X: Bomb | Shift: Focus', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 110);

  ctx.textAlign = 'left';
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = '#ff0000';
  ctx.font = '48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);

  ctx.fillStyle = '#888';
  ctx.font = '20px Courier New';
  ctx.fillText(`Floor: ${currentFloor}  Rooms: ${roomsCleared}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
  ctx.fillText(`Debris: ${Math.floor(player.debris)}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);

  ctx.fillStyle = '#00ff88';
  ctx.font = '16px Courier New';
  ctx.fillText('Press SPACE to restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);

  ctx.textAlign = 'left';
}

function drawVictory() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = '#00ff88';
  ctx.font = '48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('VICTORY!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);

  ctx.fillStyle = '#888';
  ctx.font = '20px Courier New';
  ctx.fillText(`Floors Cleared: ${currentFloor}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
  ctx.fillText(`Total Debris: ${Math.floor(player.debris)}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);

  ctx.fillStyle = '#00ff88';
  ctx.font = '16px Courier New';
  ctx.fillText('Press SPACE to play again', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);

  ctx.textAlign = 'left';
}

// ═══════════════════════════════════════════════════════════════════════════
// GAME LOOP
// ═══════════════════════════════════════════════════════════════════════════

function gameLoop(timestamp) {
  deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  // Cap delta time to prevent huge jumps
  deltaTime = Math.min(deltaTime, 50);

  update(deltaTime);
  draw();

  requestAnimationFrame(gameLoop);
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

function init() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  // Input handlers
  document.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    // Map toggle
    if (e.code === 'Tab') {
      e.preventDefault();
      showMap = !showMap;
    }

    // Pause toggle
    if (e.code === 'Escape') {
      if (gameState === 'playing') {
        gameState = 'paused';
      } else if (gameState === 'paused') {
        gameState = 'playing';
      }
    }

    // Restart on game over / victory
    if ((gameState === 'gameover' || gameState === 'victory') && e.code === 'Space') {
      startGame();
    }

    // Shop navigation
    if (gameState === 'playing' && currentRoom && currentRoom.type === 'shop' && shopInventory.length > 0) {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        selectedShopItem = (selectedShopItem - 1 + shopInventory.length) % shopInventory.length;
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        selectedShopItem = (selectedShopItem + 1) % shopInventory.length;
      }
      if (e.code === 'KeyE' || e.code === 'Enter') {
        const success = purchaseShopItem();
        if (success) {
          console.log('Purchase successful!');
        }
      }
    }

    // Upgrade terminal navigation
    if (gameState === 'playing' && currentRoom && currentRoom.type === 'upgrade' && upgradeChoices.length > 0 && !upgradeUsed) {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        selectedUpgrade = (selectedUpgrade - 1 + upgradeChoices.length) % upgradeChoices.length;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        selectedUpgrade = (selectedUpgrade + 1) % upgradeChoices.length;
      }
      if (e.code === 'KeyE' || e.code === 'Enter') {
        const success = selectUpgrade();
        if (success) {
          console.log('Upgrade selected!');
          if (currentRoom) {
            currentRoom.upgradeUsed = true;
          }
        }
      }
    }

    // Shrine interaction
    if (gameState === 'playing' && currentRoom && currentRoom.type === 'shrine' && currentShrine && !shrineUsed) {
      if (e.code === 'KeyE' || e.code === 'Enter') {
        const success = useShrine();
        if (success) {
          console.log('Shrine used!');
          if (currentRoom) {
            currentRoom.shrineUsed = true;
          }
        }
      }
    }

    // Boss reward selection
    if (gameState === 'playing' && currentRoom && currentRoom.type === 'boss' && bossRewardChoices && !bossRewardChosen) {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        selectedBossReward = (selectedBossReward - 1 + bossRewardChoices.length) % bossRewardChoices.length;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        selectedBossReward = (selectedBossReward + 1) % bossRewardChoices.length;
      }
      if (e.code === 'Digit1') {
        selectedBossReward = 0;
      }
      if (e.code === 'Digit2') {
        selectedBossReward = 1;
      }
      if (e.code === 'Digit3') {
        selectedBossReward = 2;
      }
      if (e.code === 'KeyE' || e.code === 'Enter') {
        const success = selectBossReward(selectedBossReward);
        if (success) {
          console.log('Boss reward selected!');
        }
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener('mousedown', () => {
    mouse.down = true;
  });

  canvas.addEventListener('mouseup', () => {
    mouse.down = false;
  });

  // Difficulty selector
  const difficultyBtns = document.querySelectorAll('.diff-btn');
  const difficultyDesc = document.getElementById('difficultyDesc');

  difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove selected from all
      difficultyBtns.forEach(b => b.classList.remove('selected'));
      // Add selected to clicked
      btn.classList.add('selected');
      // Set difficulty
      selectedDifficulty = btn.dataset.difficulty;
      // Update description
      const diff = DIFFICULTY_SETTINGS[selectedDifficulty];
      if (diff && difficultyDesc) {
        difficultyDesc.textContent = diff.description;
      }
      console.log('Difficulty set to:', selectedDifficulty);
    });
  });

  // Ship selector
  const shipBtns = document.querySelectorAll('.ship-btn');
  const shipDesc = document.getElementById('shipDesc');

  shipBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove selected from all
      shipBtns.forEach(b => b.classList.remove('selected'));
      // Add selected to clicked
      btn.classList.add('selected');
      // Set ship
      selectedShip = btn.dataset.ship;
      // Update description
      const ship = SHIPS[selectedShip];
      if (ship && shipDesc) {
        shipDesc.textContent = ship.description;
      }
      console.log('Ship set to:', selectedShip);
    });
  });

  // Start button
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      document.getElementById('startScreen').classList.add('hidden');
      startGame();
    });
  }

  // Start game loop
  requestAnimationFrame(gameLoop);
}

function startGame() {
  player = new Player();
  playerBullets = [];
  enemyBullets = [];
  enemies = [];
  pickups = [];
  particles = [];
  currentFloor = 1;
  roomsCleared = 0;
  minibossesKilled = 0;
  cartridgeInventory = []; // Reset cartridge inventory
  activeBlessing = null; // Reset blessing
  blessingEffects = [];

  floorMap = generateFloor(currentFloor);
  enterRoom(floorMap.startRoom);

  gameState = 'playing';

  if (window.testHarness) {
    window.testHarness.logEvent('game_started', {
      floor: currentFloor
    });
  }
}

// Expose for test harness
window.startGame = startGame;

// ═══════════════════════════════════════════════════════════════════════════
// DEBUG COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

window.debugCommands = {
  // Level/Stage control
  skipToLevel: (level) => {
    currentFloor = level;
    floorMap = generateFloor(currentFloor);
    enterRoom(floorMap.startRoom);
    console.log(`Skipped to floor ${level}`);
  },

  skipToRoom: (roomKey) => {
    if (floorMap && floorMap.rooms[roomKey]) {
      enterRoom(roomKey);
      console.log(`Skipped to room ${roomKey}`);
    } else {
      console.log('Room not found');
    }
  },

  skipToBoss: () => {
    if (floorMap && floorMap.bossRoom) {
      // Unlock boss room
      for (const room of Object.values(floorMap.rooms)) {
        for (const door of room.doors) {
          door.locked = false;
        }
      }
      enterRoom(floorMap.bossRoom);
      console.log('Skipped to boss room');
    }
  },

  // Player state
  godMode: (enabled) => {
    if (player) {
      player.isInvincible = enabled;
      player.invincibilityTimer = enabled ? Infinity : 0;
      console.log(`God mode: ${enabled}`);
    }
  },

  setHealth: (amount) => {
    if (player) {
      player.hp = Math.min(player.maxHP, Math.max(0, amount));
      console.log(`Health set to ${player.hp}`);
    }
  },

  setMaxHealth: (amount) => {
    if (player) {
      player.maxHP = amount;
      player.hp = Math.min(player.hp, player.maxHP);
      console.log(`Max health set to ${player.maxHP}`);
    }
  },

  // Resources
  giveCoins: (amount) => {
    if (player) {
      player.debris += amount;
      console.log(`Debris: ${player.debris}`);
    }
  },

  giveAmmo: (amount) => {
    if (player) {
      player.ammo = Math.min(player.maxAmmo, player.ammo + amount);
      console.log(`Ammo: ${player.ammo}`);
    }
  },

  giveAllWeapons: () => {
    console.log('Available weapons:', Object.keys(WEAPONS));
  },

  setWeapon: (weaponName) => {
    if (player && WEAPONS[weaponName]) {
      player.currentWeapon = { ...WEAPONS[weaponName] };
      player.ammo = player.currentWeapon.maxAmmo === Infinity ? 100 : player.currentWeapon.maxAmmo;
      // Initialize clip for clip-based weapons
      if (player.currentWeapon.clipSize) {
        player.maxClip = player.currentWeapon.clipSize;
        player.clipAmmo = player.currentWeapon.clipSize;
        player.isReloading = false;
        player.reloadTimer = 0;
      } else {
        player.maxClip = 0;
        player.clipAmmo = 0;
      }
      console.log(`Weapon set to ${weaponName}`);
    }
  },

  addKeyword: (keywordName) => {
    if (player && WEAPON_KEYWORDS[keywordName]) {
      if (player.currentWeapon.canHaveKeywords) {
        player.currentWeapon = applyWeaponKeyword(player.currentWeapon, keywordName);
        console.log(`Added keyword ${keywordName} to weapon`);
        console.log(`Weapon is now: ${player.currentWeapon.name}`);
      } else {
        console.log('This weapon cannot have keywords');
      }
    } else {
      console.log('Unknown keyword. Available:', Object.keys(WEAPON_KEYWORDS));
    }
  },

  listKeywords: () => {
    console.log('Available keywords:');
    for (const [key, keyword] of Object.entries(WEAPON_KEYWORDS)) {
      console.log(`  ${key}: ${keyword.description}`);
    }
  },

  spawnWeaponPickup: (weaponName, x, y) => {
    if (WEAPONS[weaponName]) {
      pickups.push({
        x: x || GAME_WIDTH / 2,
        y: y || ROOM_HEIGHT / 2,
        type: 'weapon',
        weapon: weaponName,
        size: 16,
        color: WEAPONS[weaponName].projectileColor
      });
      console.log(`Spawned ${weaponName} pickup`);
    } else {
      console.log('Unknown weapon. Available:', Object.keys(WEAPONS));
    }
  },

  giveItem: (itemType) => {
    if (player) {
      switch (itemType) {
        case 'bomb':
          player.bombs = Math.min(player.maxBombs, player.bombs + 1);
          break;
        case 'shield':
          player.shields = Math.min(player.maxShields, player.shields + 1);
          break;
      }
      console.log(`Gave item: ${itemType}`);
    }
  },

  // Game state
  clearRoom: () => {
    for (const enemy of enemies) {
      enemy.active = false;
    }
    enemies = [];
    enemyBullets = [];
    if (currentRoom) {
      currentRoom.cleared = true;
    }
    console.log('Room cleared');
  },

  spawnEnemy: (type, x, y) => {
    const template = ENEMIES[type];
    if (template) {
      const enemy = new Enemy(template, x || GAME_WIDTH / 2, y || ROOM_HEIGHT / 2);
      enemies.push(enemy);
      console.log(`Spawned ${type} at (${enemy.x}, ${enemy.y})`);
    } else {
      console.log('Unknown enemy type. Available:', Object.keys(ENEMIES));
    }
  },

  spawnBoss: (type) => {
    const template = BOSSES[type];
    if (template) {
      const boss = new Enemy(template, GAME_WIDTH / 2, UI_HEIGHT + 150);
      enemies.push(boss);
      console.log(`Spawned boss ${type}`);
    } else {
      console.log('Unknown boss type. Available:', Object.keys(BOSSES));
    }
  },

  // Testing
  showHitboxes: (enabled) => {
    // Would need to modify draw functions
    console.log(`Hitboxes display: ${enabled}`);
  },

  showGrid: (enabled) => {
    console.log(`Grid display: ${enabled}`);
  },

  slowMotion: (factor) => {
    // Would need to modify game loop
    console.log(`Slow motion factor: ${factor}`);
  },

  // Multiplier
  setMultiplier: (value) => {
    if (player) {
      player.multiplier = Math.max(1, Math.min(player.maxMultiplier, value));
      console.log(`Multiplier set to ${player.multiplier}`);
    }
  },

  // Upgrades
  giveUpgrade: (upgrade) => {
    if (player) {
      switch (upgrade) {
        case 'autobomb':
          player.hasAutobomb = true;
          break;
        case 'scanner':
          player.hasScanner = true;
          break;
      }
      console.log(`Gave upgrade: ${upgrade}`);
    }
  },

  // Map
  toggleMap: () => {
    showMap = !showMap;
    console.log(`Map display: ${showMap}`);
    return showMap;
  },

  showFullMap: () => {
    if (floorMap) {
      for (const room of Object.values(floorMap.rooms)) {
        room.visited = true;
      }
      showMap = true;
      console.log('Full map revealed');
    }
  },

  triggerFullFloorMap: (duration = 3000) => {
    showFullFloorMap = true;
    fullMapTimer = duration;
    console.log(`Full floor map displayed for ${duration}ms`);
  },

  // Shop
  enterShop: () => {
    // Find a shop room or create shop state
    generateShopInventory();
    if (currentRoom) {
      currentRoom.type = 'shop';
    }
    console.log('Entered shop with', shopInventory.length, 'items');
    return shopInventory;
  },

  getShopInventory: () => shopInventory,

  selectShopItem: (index) => {
    if (index >= 0 && index < shopInventory.length) {
      selectedShopItem = index;
      console.log('Selected shop item:', shopInventory[index].name);
    }
  },

  buyShopItem: () => {
    return purchaseShopItem();
  },

  // Upgrade Terminal
  enterUpgradeRoom: () => {
    generateUpgradeChoices();
    if (currentRoom) {
      currentRoom.type = 'upgrade';
    }
    console.log('Entered upgrade room with choices:', upgradeChoices.map(u => u.name));
    return upgradeChoices;
  },

  getUpgradeChoices: () => upgradeChoices,

  selectUpgradeChoice: (index) => {
    if (index >= 0 && index < upgradeChoices.length) {
      selectedUpgrade = index;
      console.log('Selected upgrade:', upgradeChoices[index].name);
    }
  },

  confirmUpgrade: () => {
    const success = selectUpgrade();
    if (success && currentRoom) {
      currentRoom.upgradeUsed = true;
    }
    return success;
  },

  isUpgradeUsed: () => upgradeUsed,

  // Shrine
  enterShrineRoom: () => {
    generateShrine();
    if (currentRoom) {
      currentRoom.type = 'shrine';
    }
    console.log('Entered shrine room:', currentShrine.name);
    return currentShrine;
  },

  getShrine: () => currentShrine,

  useShrineDebug: () => {
    const success = useShrine();
    if (success && currentRoom) {
      currentRoom.shrineUsed = true;
    }
    return success;
  },

  isShrineUsed: () => shrineUsed,

  canUseShrineDebug: () => canUseShrine(),

  // Secret room debug commands
  checkSecretWalls: () => checkSecretWalls(),

  revealSecretWall: (direction) => {
    const secretWalls = checkSecretWalls();
    const wall = secretWalls.find(w => w.direction === direction);
    if (wall) {
      return revealSecretRoom(direction);
    }
    return false;
  },

  revealAnySecretWall: () => {
    const secretWalls = checkSecretWalls();
    if (secretWalls.length > 0) {
      return revealSecretRoom(secretWalls[0].direction);
    }
    return false;
  },

  enterSecretRoom: () => {
    // First check and reveal a secret wall if available
    const secretWalls = checkSecretWalls();
    if (secretWalls.length > 0) {
      revealSecretRoom(secretWalls[0].direction);
    }

    // Now find any revealed secret room and teleport to it
    if (floorMap) {
      for (const [key, room] of Object.entries(floorMap.rooms)) {
        if (room.type === 'secret') {
          enterRoom(key);
          return true;
        }
      }
    }
    return false;
  },

  createSecretRoom: () => {
    // Force create a secret room at a valid wall
    const directions = ['north', 'south', 'east', 'west'];
    for (const dir of directions) {
      const result = revealSecretRoom(dir);
      if (result) {
        return { success: true, direction: dir };
      }
    }
    return { success: false, reason: 'No valid walls for secret room' };
  },

  // Floor progression debug commands
  advanceFloor: () => {
    advanceToNextFloor();
    console.log(`Advanced to floor ${currentFloor} (${getFloorTheme().name})`);
  },

  spawnExitPortal: () => {
    floorExitPortal = {
      x: GAME_WIDTH / 2,
      y: ROOM_HEIGHT / 2 + 80,
      radius: 30,
      active: true,
      pulseTimer: 0
    };
    console.log('Floor exit portal spawned');
  },

  getFloorInfo: () => ({
    floor: currentFloor,
    theme: getFloorTheme(),
    portal: floorExitPortal
  }),

  setFloor: (floor) => {
    currentFloor = Math.max(1, Math.min(3, floor));
    floorMap = generateFloor(currentFloor);
    enterRoom(floorMap.startRoom);
    floorExitPortal = null;
    secretWalls = [];
    revealedSecretWalls = [];
    console.log(`Set to floor ${currentFloor} (${getFloorTheme().name})`);
  },

  // Difficulty commands
  setDifficulty: (diff) => {
    if (DIFFICULTY_SETTINGS[diff]) {
      selectedDifficulty = diff;
      console.log(`Difficulty set to: ${diff} (${DIFFICULTY_SETTINGS[diff].name})`);
    } else {
      console.log('Invalid difficulty. Use: MILD, NORMAL, INTENSE, SUDDEN_DEATH');
    }
  },

  getDifficultyInfo: () => ({
    selected: selectedDifficulty,
    settings: getDifficulty()
  }),

  // Ship commands
  setShip: (ship) => {
    if (SHIPS[ship]) {
      selectedShip = ship;
      console.log(`Ship set to: ${ship} (${SHIPS[ship].name})`);
    } else {
      console.log('Invalid ship. Use: STANDARD, TANK, SPEEDSTER, BOMBER, GLASS_CANNON, VAMPIRE, ROGUE');
    }
  },

  getShipInfo: () => ({
    selected: selectedShip,
    settings: getShip(),
    playerPassive: player ? player.passive : null
  }),

  // Boss reward commands
  showBossRewards: () => {
    bossRewardChoices = generateBossRewards();
    selectedBossReward = 0;
    bossRewardChosen = false;
    if (currentRoom) {
      currentRoom.type = 'boss'; // Needed for UI to show
    }
    console.log('Boss rewards shown:', bossRewardChoices.map(r => r.name));
    return bossRewardChoices;
  },

  getBossRewards: () => bossRewardChoices,

  selectBossRewardIndex: (index) => {
    if (bossRewardChoices && index >= 0 && index < bossRewardChoices.length) {
      selectedBossReward = index;
      console.log('Selected reward:', bossRewardChoices[index].name);
    }
  },

  confirmBossReward: () => {
    return selectBossReward(selectedBossReward);
  },

  isBossRewardChosen: () => bossRewardChosen,

  // Cartridge commands
  addCartridge: (key) => {
    if (addCartridge(key)) {
      console.log('Added cartridge:', CARTRIDGES[key].name);
      return true;
    }
    console.log('Failed to add cartridge. Available:', Object.keys(CARTRIDGES));
    return false;
  },

  listCartridges: () => {
    console.log('Available cartridges:');
    for (const [key, cart] of Object.entries(CARTRIDGES)) {
      console.log(`  ${key}: ${cart.name} (${cart.rarity}) - ${cart.description}`);
    }
  },

  getInventory: () => cartridgeInventory.map(k => ({
    key: k,
    name: CARTRIDGES[k].name,
    description: CARTRIDGES[k].description
  })),

  spawnCartridgePickup: (key, x, y) => {
    const cartridgeKey = key || getRandomCartridge();
    const cartridge = CARTRIDGES[cartridgeKey];
    if (cartridge) {
      pickups.push({
        x: x || GAME_WIDTH / 2,
        y: y || ROOM_HEIGHT / 2,
        type: 'cartridge',
        cartridge: cartridgeKey,
        size: 14,
        color: cartridge.color
      });
      console.log(`Spawned ${cartridge.name} cartridge pickup`);
    }
  },

  clearCartridges: () => {
    cartridgeInventory = [];
    console.log('Cartridge inventory cleared');
  },

  // Blessing commands
  applyBlessing: (key) => {
    if (applyBlessing(key)) {
      console.log('Applied blessing:', BLESSINGS[key].name);
      return true;
    }
    console.log('Failed to apply blessing. Available:', Object.keys(BLESSINGS));
    return false;
  },

  listBlessings: () => {
    console.log('Available blessings:');
    for (const [key, blessing] of Object.entries(BLESSINGS)) {
      console.log(`  ${key}: ${blessing.name} - ${blessing.description}`);
    }
  },

  getBlessing: () => getActiveBlessing(),

  removeBlessing: () => {
    removeBlessing();
    console.log('Blessing removed');
  },

  // State
  getState: () => ({
    gameState,
    currentFloor,
    roomsCleared,
    player: player ? {
      x: player.x,
      y: player.y,
      hp: player.hp,
      maxHP: player.maxHP,
      shields: player.shields,
      ammo: player.ammo,
      bombs: player.bombs,
      debris: player.debris,
      multiplier: player.multiplier,
      weapon: player.currentWeapon.name
    } : null,
    enemies: enemies.map(e => ({
      id: e.id,
      type: e.name,
      x: e.x,
      y: e.y,
      hp: e.hp,
      isBoss: e.isBoss
    })),
    roomType: currentRoom?.type
  })
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS FOR TEST HARNESS
// ═══════════════════════════════════════════════════════════════════════════

window.getPlayer = () => player;
window.getEnemies = () => enemies;
window.getProjectiles = () => ({ player: playerBullets, enemy: enemyBullets });
window.getPickups = () => pickups;
window.getDamageNumbers = () => damageNumbers;
window.getGameState = () => gameState;
window.getCurrentFloor = () => currentFloor;
window.getCurrentRoom = () => currentRoom;
window.getFloorMap = () => floorMap;
window.orbitRunes = orbitRunes;
window.saws = saws;
window.isMapVisible = () => showMap;
window.toggleMap = () => { showMap = !showMap; return showMap; };
window.isFullMapVisible = () => showFullFloorMap;
window.getFullMapTimer = () => fullMapTimer;

window.Enemy = Enemy;
window.Player = Player;
window.WEAPONS = WEAPONS;
window.ENEMIES = ENEMIES;
window.BOSSES = BOSSES;
window.WEAPON_KEYWORDS = WEAPON_KEYWORDS;
window.applyWeaponKeyword = applyWeaponKeyword;
window.SHOP_ITEMS = SHOP_ITEMS;
window.getShopInventory = () => shopInventory;
window.getSelectedShopItem = () => selectedShopItem;
window.UPGRADES = UPGRADES;
window.getUpgradeChoices = () => upgradeChoices;
window.getSelectedUpgrade = () => selectedUpgrade;
window.isUpgradeUsed = () => upgradeUsed;
window.SHRINES = SHRINES;
window.getShrine = () => currentShrine;
window.isShrineUsed = () => shrineUsed;
window.checkSecretWalls = checkSecretWalls;
window.revealSecretRoom = revealSecretRoom;
window.getSecretRooms = () => {
  if (!floorMap) return [];
  return Object.entries(floorMap.rooms)
    .filter(([key, room]) => room.type === 'secret')
    .map(([key, room]) => ({ key, ...room }));
};
window.FLOOR_THEMES = FLOOR_THEMES;
window.getFloorTheme = getFloorTheme;
window.advanceToNextFloor = advanceToNextFloor;
window.getFloorExitPortal = () => floorExitPortal;
window.DIFFICULTY_SETTINGS = DIFFICULTY_SETTINGS;
window.getDifficulty = getDifficulty;
window.getSelectedDifficulty = () => selectedDifficulty;
window.setDifficulty = (diff) => {
  if (DIFFICULTY_SETTINGS[diff]) {
    selectedDifficulty = diff;
  }
};
window.SHIPS = SHIPS;
window.getShip = getShip;
window.getSelectedShip = () => selectedShip;
window.setShip = (ship) => {
  if (SHIPS[ship]) {
    selectedShip = ship;
  }
};
window.BOSS_REWARDS = BOSS_REWARDS;
window.getBossRewards = () => bossRewardChoices;
window.getSelectedBossReward = () => selectedBossReward;
window.isBossRewardChosen = () => bossRewardChosen;
window.selectBossReward = selectBossReward;
window.generateBossRewards = generateBossRewards;
window.CARTRIDGES = CARTRIDGES;
window.getCartridgeInventory = () => cartridgeInventory;
window.addCartridge = addCartridge;
window.hasCartridge = hasCartridge;
window.countCartridge = countCartridge;
window.getRandomCartridge = getRandomCartridge;
window.BLESSINGS = BLESSINGS;
window.getActiveBlessing = getActiveBlessing;
window.applyBlessing = applyBlessing;
window.removeBlessing = removeBlessing;

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
