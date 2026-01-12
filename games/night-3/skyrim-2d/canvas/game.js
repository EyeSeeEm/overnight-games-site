// Frostfall: Skyrim 2D - Canvas Implementation
// Top-down action RPG

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 16;
const MAP_WIDTH = 150;
const MAP_HEIGHT = 150;
const CAMERA_ZOOM = 1.5; // Zoom in for better visibility

// Town data - generated during world creation
let towns = [];
const TOWN_NAMES = [
    'Whiterun', 'Riverwood', 'Falkreath', 'Morthal', 'Dawnstar',
    'Winterhold', 'Riften', 'Markarth', 'Solitude', 'Windhelm',
    'Rorikstead', 'Dragon Bridge', 'Ivarstead', 'Kynesgrove', 'Shor\'s Stone'
];

// Colors - Dark fantasy palette (Stoneshard inspired)
// Visual contrast: HIGH for collision objects, LOW for decoration
const COLORS = {
    // Terrain - mid tones for background
    GRASS_LIGHT: '#5a7a3a',
    GRASS: '#4a6a2a',
    GRASS_DARK: '#3a5a1a',
    GRASS_DARKER: '#2a4a0a',
    DIRT: '#6a5a4a',
    DIRT_DARK: '#5a4a3a',
    // Rocks/Stone - HIGH contrast (collision)
    STONE: '#8a8a8a',           // Brighter base
    STONE_LIGHT: '#a5a5a5',     // Highlight
    STONE_DARK: '#2a2a2a',      // Deep shadow
    SNOW: '#dde8e8',
    SNOW_DARK: '#bbd0d0',
    WATER: '#3a5a7a',
    WATER_DARK: '#2a4a6a',
    WOOD: '#8a6a4a',
    WOOD_DARK: '#5a4030',
    // Trees - HIGH contrast (collision) - more saturated and distinct
    TREE_LIGHT: '#5a9a4a',      // Brighter green highlight
    TREE_MID: '#2a6a2a',        // Darker mid
    TREE_DARK: '#1a4a1a',       // Very dark shadow
    TREE_TRUNK: '#5a4030',      // Darker trunk
    // Flowers/decoration - LOW contrast (no collision) - mid-tones only
    FLOWER_STEM: '#4a5a3a',     // Muted green
    FLOWER_RED: '#8a5555',      // Muted red
    FLOWER_YELLOW: '#8a8a55',   // Muted yellow
    FLOWER_BLUE: '#5555758',    // Muted blue
    // Characters - HIGHER value for visibility
    PLAYER: '#5588bb',
    ENEMY: '#cc5555',           // Brighter red - more visible
    ENEMY_DARK: '#882222',      // Shadow for enemies
    NPC: '#77cc66',             // Brighter green - more visible
    NPC_DARK: '#447733',        // Shadow for NPCs
    SKIN: '#e8c8a8',
    // UI
    UI_BG: '#12141a',
    UI_PANEL: '#1a1c24',
    UI_BORDER: '#3a3c44',
    UI_BORDER_LIGHT: '#5a5c64',
    HEALTH: '#aa3333',
    HEALTH_BG: '#331111',
    MANA: '#3355aa',
    MANA_BG: '#111133',
    STAMINA: '#55aa44',
    STAMINA_BG: '#113311',
    GOLD: '#d4aa44',
    // Effects
    SHADOW: 'rgba(0,0,0,0.3)'
};

// Terrain
const TERRAIN = {
    GRASS: 0, DIRT: 1, STONE: 2, WATER: 3, SNOW: 4, WALL: 5, TREE: 6, ROCK: 7,
    BUILDING: 8, ROOF: 9, BUSH: 10, FLOWER: 11, PATH: 12, FENCE: 13,
    FARMLAND: 14, HAY: 15, CAMPFIRE: 16
};

// Decoration layer for additional details
let decorations = [];

// Particle system for snow/ambient
let particles = [];
const MAX_PARTICLES = 50;

function updateParticles() {
    // Only create snow particles if camera is in snowy area
    if (game.camera.y < 12 * TILE_SIZE && particles.length < MAX_PARTICLES) {
        if (Math.random() < 0.3) {
            particles.push({
                x: game.camera.x + Math.random() * canvas.width,
                y: game.camera.y - 10,
                speed: 20 + Math.random() * 30,
                drift: (Math.random() - 0.5) * 20,
                size: 1 + Math.random() * 2
            });
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.y += p.speed * 0.016;
        p.x += p.drift * 0.016;

        // Remove if off screen
        if (p.y > game.camera.y + canvas.height + 20) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const p of particles) {
        const screenX = p.x - game.camera.x;
        const screenY = p.y - game.camera.y;
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Game state
const game = {
    state: 'playing',
    camera: { x: 0, y: 0 },
    tick: 0,
    currentZone: 'village',
    quests: [],
    dialogueActive: false,
    dialogueText: '',
    interactTarget: null
};

// Combat feedback effects
let screenShake = { intensity: 0, duration: 0 };
let damageFlash = { intensity: 0, duration: 0 };
let hitParticles = [];

// Screen shake helper
function triggerScreenShake(intensity, duration) {
    screenShake.intensity = intensity;
    screenShake.duration = duration;
}

// Damage flash helper
function triggerDamageFlash(intensity, duration) {
    damageFlash.intensity = intensity;
    damageFlash.duration = duration;
}

// Spawn hit particles at position
function spawnHitParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 100;
        hitParticles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.3 + Math.random() * 0.3,
            color,
            size: 2 + Math.random() * 3
        });
    }
}

// Update particles
function updateHitParticles(dt) {
    for (let i = hitParticles.length - 1; i >= 0; i--) {
        const p = hitParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= dt;
        if (p.life <= 0) {
            hitParticles.splice(i, 1);
        }
    }
}

// Draw hit particles
function drawHitParticles() {
    for (const p of hitParticles) {
        const screenX = p.x - game.camera.x;
        const screenY = p.y - game.camera.y;
        const alpha = p.life / 0.6;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// Player
const player = {
    x: 400, y: 400,
    width: 14, height: 14,
    speed: 80,
    facing: 2, // 0=up, 1=right, 2=down, 3=left
    hp: 100, maxHp: 100,
    mp: 50, maxMp: 50,
    stamina: 100, maxStamina: 100,
    level: 1, xp: 0, xpToNext: 100,
    gold: 50,
    damage: 10,
    armor: 5,
    attacking: false,
    attackTimer: 0,
    attackCooldown: 0,
    blocking: false,
    blockTimer: 0,
    dodging: false,
    dodgeTimer: 0,
    dodgeCooldown: 0,
    dodgeDir: { x: 0, y: 0 },
    castingSpell: null,
    spellCooldown: 0,
    inventory: ['Iron Sword', 'Health Potion', 'Health Potion'],
    equipped: {
        weapon: 'Iron Sword',
        head: null,
        body: null,
        hands: null,
        feet: null,
        shield: null
    },
    skills: { combat: 1, magic: 1, stealth: 1 },
    perks: [],
    spells: ['Flames', 'Healing'],
    selectedSpell: 0
};

// Projectiles (arrows, spells)
let projectiles = [];

// Weather system
const weather = {
    type: 'clear', // clear, rain, snow, fog
    intensity: 0,
    timer: 0,
    particles: []
};

// Day/night cycle
const dayNight = {
    time: 12, // Hours (0-24)
    rate: 0.001 // Hours per second
};

// Chests
let chests = [];

// Equipment definitions
const EQUIPMENT = {
    weapons: {
        'Iron Sword': { damage: 10, speed: 1.0, type: 'melee' },
        'Steel Sword': { damage: 15, speed: 1.0, type: 'melee' },
        'Iron Greatsword': { damage: 18, speed: 0.7, type: 'melee' },
        'Dagger': { damage: 6, speed: 1.5, type: 'melee', sneakBonus: 2 },
        'Hunting Bow': { damage: 12, speed: 0.8, type: 'bow', range: 200 },
        'Long Bow': { damage: 18, speed: 0.6, type: 'bow', range: 280 },
        'Elven Blade': { damage: 25, speed: 1.0, type: 'melee' },
        'Staff of Flames': { damage: 8, speed: 1.0, type: 'staff', spell: 'Flames' }
    },
    armor: {
        head: {
            'Leather Cap': { armor: 5 },
            'Iron Helmet': { armor: 10 },
            'Steel Helmet': { armor: 15 }
        },
        body: {
            'Leather Armor': { armor: 15 },
            'Iron Armor': { armor: 30 },
            'Steel Armor': { armor: 45 }
        },
        hands: {
            'Leather Bracers': { armor: 3 },
            'Iron Gauntlets': { armor: 6 }
        },
        feet: {
            'Leather Boots': { armor: 3 },
            'Iron Boots': { armor: 6 }
        },
        shield: {
            'Wooden Shield': { block: 50 },
            'Iron Shield': { block: 65 },
            'Steel Shield': { block: 75 }
        }
    }
};

// Spell definitions
const SPELLS = {
    'Flames': { damage: 5, cost: 3, range: 48, type: 'fire', dot: 2 },
    'Frostbite': { damage: 10, cost: 15, range: 120, type: 'frost', slow: 0.5 },
    'Sparks': { damage: 6, cost: 4, range: 64, type: 'shock', chain: true },
    'Healing': { heal: 30, cost: 20, type: 'restore' },
    'Firebolt': { damage: 25, cost: 25, speed: 250, range: 200, type: 'fire' }
};

// Perk definitions
const PERKS = {
    // Combat
    'Armsman': { skill: 'combat', req: 2, effect: { damageBonus: 0.25 } },
    'Power Strike': { skill: 'combat', req: 4, effect: { powerAttack: true } },
    'Warriors Resolve': { skill: 'combat', req: 7, effect: { hpBonus: 20 } },
    // Magic
    'Novice Mage': { skill: 'magic', req: 2, effect: { spellCostReduction: 0.25 } },
    'Impact': { skill: 'magic', req: 4, effect: { spellStagger: true } },
    'Arcane Mastery': { skill: 'magic', req: 7, effect: { mpBonus: 30 } },
    // Stealth
    'Stealth': { skill: 'stealth', req: 2, effect: { detectionReduction: 0.25 } },
    'Deadly Aim': { skill: 'stealth', req: 4, effect: { sneakDamage: 1.5 } },
    'Assassin': { skill: 'stealth', req: 7, effect: { sneakDamage: 3 } }
};

// Enemies
let enemies = [];
let npcs = [];
let items = [];
let map = [];

// Generate world
function generateWorld() {
    map = [];
    decorations = [];
    towns = [];

    // First pass: base terrain with biomes
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Determine biome based on position
            let terrain = TERRAIN.GRASS;
            let variant = Math.floor(Math.random() * 4);

            // Northern snow (top 30%)
            if (y < MAP_HEIGHT * 0.3) {
                terrain = TERRAIN.SNOW;
                variant = Math.floor(Math.random() * 2);
            }
            // Mountain ridges (perlin-like noise simulation)
            const mountainNoise = Math.sin(x * 0.1) * Math.cos(y * 0.08) + Math.sin(x * 0.05 + y * 0.05);
            if (mountainNoise > 0.8 && Math.random() < 0.3) {
                terrain = TERRAIN.ROCK;
                variant = Math.floor(Math.random() * 2);
            }

            map[y][x] = { terrain, variant };
        }
    }

    // Edge walls
    for (let x = 0; x < MAP_WIDTH; x++) {
        map[0][x] = { terrain: TERRAIN.WALL, variant: 0 };
        map[MAP_HEIGHT - 1][x] = { terrain: TERRAIN.WALL, variant: 0 };
    }
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y][0] = { terrain: TERRAIN.WALL, variant: 0 };
        map[y][MAP_WIDTH - 1] = { terrain: TERRAIN.WALL, variant: 0 };
    }

    // Generate multiple rivers
    generateRiver(30, 0, 30, MAP_HEIGHT - 1, 3); // Vertical river west
    generateRiver(100, 0, 110, MAP_HEIGHT - 1, 4); // Vertical river east
    generateRiver(0, 80, MAP_WIDTH - 1, 85, 3); // Horizontal river

    // Generate 8-12 towns
    const numTowns = 8 + Math.floor(Math.random() * 5);
    const usedNames = [];

    for (let i = 0; i < numTowns; i++) {
        let attempts = 0;
        while (attempts < 50) {
            const tx = 20 + Math.floor(Math.random() * (MAP_WIDTH - 40));
            const ty = 20 + Math.floor(Math.random() * (MAP_HEIGHT - 40));

            // Check distance from other towns (min 30 tiles apart)
            let tooClose = false;
            for (const town of towns) {
                const dist = Math.hypot(town.x - tx, town.y - ty);
                if (dist < 30) {
                    tooClose = true;
                    break;
                }
            }

            // Check not on water
            if (!tooClose && map[ty][tx].terrain !== TERRAIN.WATER) {
                // Pick unique name
                let name;
                do {
                    name = TOWN_NAMES[Math.floor(Math.random() * TOWN_NAMES.length)];
                } while (usedNames.includes(name) && usedNames.length < TOWN_NAMES.length);
                usedNames.push(name);

                // Determine town size (1=small, 2=medium, 3=large)
                const size = i === 0 ? 3 : (Math.random() < 0.3 ? 3 : Math.random() < 0.5 ? 2 : 1);

                towns.push({ x: tx, y: ty, name, size, isStartTown: i === 0 });
                generateTown(tx, ty, size, i === 0);
                break;
            }
            attempts++;
        }
    }

    // Generate roads connecting towns
    for (let i = 0; i < towns.length; i++) {
        // Connect to nearest 2-3 towns
        const sorted = [...towns].sort((a, b) => {
            const distA = Math.hypot(a.x - towns[i].x, a.y - towns[i].y);
            const distB = Math.hypot(b.x - towns[i].x, b.y - towns[i].y);
            return distA - distB;
        });

        for (let j = 1; j <= Math.min(3, sorted.length - 1); j++) {
            generateRoad(towns[i].x, towns[i].y, sorted[j].x, sorted[j].y);
        }
    }

    // Generate dungeon entrances (3-5)
    const numDungeons = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numDungeons; i++) {
        let dx, dy;
        let attempts = 0;
        while (attempts < 30) {
            dx = 10 + Math.floor(Math.random() * (MAP_WIDTH - 20));
            dy = 10 + Math.floor(Math.random() * (MAP_HEIGHT - 20));

            // Not too close to towns
            let nearTown = false;
            for (const town of towns) {
                if (Math.hypot(town.x - dx, town.y - dy) < 20) {
                    nearTown = true;
                    break;
                }
            }

            if (!nearTown && map[dy][dx].terrain !== TERRAIN.WATER) {
                generateDungeonEntrance(dx, dy);
                break;
            }
            attempts++;
        }
    }

    // Scatter trees in forests (away from towns)
    for (let y = 2; y < MAP_HEIGHT - 2; y++) {
        for (let x = 2; x < MAP_WIDTH - 2; x++) {
            if (map[y][x].terrain === TERRAIN.GRASS || map[y][x].terrain === TERRAIN.SNOW) {
                // Check distance from any town
                let minDistToTown = Infinity;
                for (const town of towns) {
                    const dist = Math.hypot(x - town.x, y - town.y);
                    if (dist < minDistToTown) minDistToTown = dist;
                }

                // More trees farther from towns
                const treeChance = minDistToTown > 25 ? 0.35 : minDistToTown > 18 ? 0.25 : minDistToTown > 12 ? 0.12 : 0.03;

                if (Math.random() < treeChance) {
                    map[y][x].terrain = TERRAIN.TREE;
                    map[y][x].variant = Math.floor(Math.random() * 3);
                } else if (Math.random() < 0.02) {
                    map[y][x].terrain = TERRAIN.ROCK;
                    map[y][x].variant = Math.floor(Math.random() * 2);
                } else if (Math.random() < 0.04 && map[y][x].terrain === TERRAIN.GRASS && minDistToTown > 10) {
                    map[y][x].terrain = TERRAIN.BUSH;
                    map[y][x].variant = Math.floor(Math.random() * 2);
                } else if (Math.random() < 0.02 && map[y][x].terrain === TERRAIN.GRASS) {
                    map[y][x].terrain = TERRAIN.FLOWER;
                    map[y][x].variant = Math.floor(Math.random() * 3);
                }
            }
        }
    }
}

// Generate a river between two points with width
function generateRiver(x1, y1, x2, y2, width) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = Math.floor(x1 + (x2 - x1) * t);
        const y = Math.floor(y1 + (y2 - y1) * t);
        const wobble = Math.floor(Math.sin(i * 0.2) * 3);

        for (let w = -Math.floor(width / 2); w <= Math.floor(width / 2); w++) {
            const rx = x + wobble + (Math.abs(y2 - y1) > Math.abs(x2 - x1) ? w : 0);
            const ry = y + (Math.abs(x2 - x1) > Math.abs(y2 - y1) ? w : 0);

            if (rx > 0 && rx < MAP_WIDTH - 1 && ry > 0 && ry < MAP_HEIGHT - 1) {
                map[ry][rx] = { terrain: TERRAIN.WATER, variant: Math.abs(w) === Math.floor(width / 2) ? 1 : 0 };
            }
        }
    }
}

// Generate a road between two points
function generateRoad(x1, y1, x2, y2) {
    // Simple line with some wobble
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        let x = Math.floor(x1 + (x2 - x1) * t);
        let y = Math.floor(y1 + (y2 - y1) * t);

        // Small random wobble
        x += Math.floor(Math.sin(i * 0.3) * 1);
        y += Math.floor(Math.cos(i * 0.3) * 1);

        if (x > 0 && x < MAP_WIDTH - 1 && y > 0 && y < MAP_HEIGHT - 1) {
            if (map[y][x].terrain !== TERRAIN.WATER && map[y][x].terrain !== TERRAIN.BUILDING &&
                map[y][x].terrain !== TERRAIN.ROOF) {
                map[y][x] = { terrain: TERRAIN.PATH, variant: Math.abs(y2 - y1) > Math.abs(x2 - x1) ? 1 : 0 };
            }
        }
    }
}

// Generate a town at position with size (1-3)
function generateTown(cx, cy, size, isStart) {
    const radius = size === 3 ? 8 : size === 2 ? 6 : 4;

    // Clear area with dirt
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const x = cx + dx;
            const y = cy + dy;
            if (x > 0 && x < MAP_WIDTH - 1 && y > 0 && y < MAP_HEIGHT - 1) {
                if (Math.hypot(dx, dy) <= radius) {
                    map[y][x] = { terrain: TERRAIN.DIRT, variant: Math.floor(Math.random() * 3) };
                }
            }
        }
    }

    // Main paths through town
    for (let i = -radius - 3; i <= radius + 3; i++) {
        if (cx + i > 0 && cx + i < MAP_WIDTH - 1) {
            map[cy][cx + i] = { terrain: TERRAIN.PATH, variant: 0 };
        }
        if (cy + i > 0 && cy + i < MAP_HEIGHT - 1) {
            map[cy + i][cx] = { terrain: TERRAIN.PATH, variant: 1 };
        }
    }

    // Buildings based on size
    const buildingCount = size === 3 ? 6 : size === 2 ? 4 : 2;
    const buildingPositions = [
        { dx: -4, dy: -4 }, { dx: 2, dy: -4 },
        { dx: -4, dy: 2 }, { dx: 2, dy: 2 },
        { dx: -4, dy: -1 }, { dx: 3, dy: -1 }
    ];

    const buildingTypes = ['inn', 'smith', 'shop', 'house', 'house', 'house'];

    for (let i = 0; i < buildingCount; i++) {
        const pos = buildingPositions[i];
        const bx = cx + pos.dx;
        const by = cy + pos.dy;
        const bType = buildingTypes[i];
        const bw = bType === 'house' ? 2 : 3;
        const bh = bType === 'house' ? 2 : 3;

        for (let dy = 0; dy < bh; dy++) {
            for (let dx = 0; dx < bw; dx++) {
                const x = bx + dx;
                const y = by + dy;
                if (x > 0 && x < MAP_WIDTH - 1 && y > 0 && y < MAP_HEIGHT - 1) {
                    if (dy === 0) {
                        map[y][x] = { terrain: TERRAIN.ROOF, variant: bType === 'inn' ? 1 : 0 };
                    } else {
                        map[y][x] = { terrain: TERRAIN.BUILDING, variant: dx === Math.floor(bw / 2) && dy === bh - 1 ? 1 : 0 };
                    }
                }
            }
        }
    }

    // Fences around town
    for (let dx = -radius - 1; dx <= radius + 1; dx++) {
        const fy1 = cy - radius - 1;
        const fy2 = cy + radius + 1;
        const fx = cx + dx;
        if (fx > 0 && fx < MAP_WIDTH - 1 && fy1 > 0 && map[fy1][fx].terrain === TERRAIN.GRASS) {
            map[fy1][fx] = { terrain: TERRAIN.FENCE, variant: 0 };
        }
        if (fx > 0 && fx < MAP_WIDTH - 1 && fy2 < MAP_HEIGHT - 1 && map[fy2][fx].terrain === TERRAIN.GRASS) {
            map[fy2][fx] = { terrain: TERRAIN.FENCE, variant: 0 };
        }
    }

    // Campfire in center
    map[cy][cx - 1] = { terrain: TERRAIN.CAMPFIRE, variant: 0 };

    // Farmland outside town (for larger towns)
    if (size >= 2) {
        for (let fy = cy + radius + 2; fy <= cy + radius + 6; fy++) {
            for (let fx = cx - 5; fx <= cx + 5; fx++) {
                if (fx > 0 && fx < MAP_WIDTH - 1 && fy > 0 && fy < MAP_HEIGHT - 1) {
                    if (map[fy][fx].terrain === TERRAIN.GRASS || map[fy][fx].terrain === TERRAIN.SNOW) {
                        map[fy][fx] = { terrain: TERRAIN.FARMLAND, variant: (fx + fy) % 2 };
                    }
                }
            }
        }
        // Hay bales
        if (cy + radius + 3 < MAP_HEIGHT - 1 && cx - 3 > 0) {
            map[cy + radius + 3][cx - 3] = { terrain: TERRAIN.HAY, variant: 0 };
        }
        if (cy + radius + 3 < MAP_HEIGHT - 1 && cx + 3 < MAP_WIDTH - 1) {
            map[cy + radius + 3][cx + 3] = { terrain: TERRAIN.HAY, variant: 1 };
        }
    }
}

// Generate dungeon entrance
function generateDungeonEntrance(cx, cy) {
    for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
            if (cy + dy > 0 && cy + dy < MAP_HEIGHT - 1 && cx + dx > 0 && cx + dx < MAP_WIDTH - 1) {
                map[cy + dy][cx + dx] = { terrain: TERRAIN.STONE, variant: 2 };
            }
        }
    }
    map[cy + 2][cx + 1] = { terrain: TERRAIN.STONE, variant: 3 }; // Entrance door
}

// Quest templates
const QUEST_TEMPLATES = [
    { type: 'kill', name: 'Clear the Bandits', target: 'bandit', count: 3, reward: 100, dialogue: 'Bandits have been attacking travelers. Slay {count} of them!' },
    { type: 'kill', name: 'Wolf Hunt', target: 'wolf', count: 4, reward: 75, dialogue: 'Wolves are threatening our livestock. Hunt {count} of them!' },
    { type: 'kill', name: 'Draugr Extermination', target: 'draugr', count: 3, reward: 150, dialogue: 'Undead draugr roam the northern wastes. Destroy {count} of them!' },
    { type: 'kill', name: 'Bandit Camp Raid', target: 'bandit', count: 5, reward: 200, dialogue: 'A bandit camp threatens our trade routes. Eliminate {count} bandits!' },
    { type: 'kill', name: 'Wolf Pack Culling', target: 'wolf', count: 6, reward: 120, dialogue: 'A large wolf pack hunts near the roads. Kill {count} wolves!' },
    { type: 'kill', name: 'Ancient Evil', target: 'draugr', count: 5, reward: 250, dialogue: 'An ancient burial site stirs with draugr. Destroy {count} of them!' },
    { type: 'explore', name: 'Scout the Roads', count: 3, reward: 80, dialogue: 'Scout the roads to {count} nearby towns to ensure they are safe.' },
    { type: 'collect', name: 'Gold Collection', item: 'gold', count: 100, reward: 50, dialogue: 'The town treasury is low. Collect {count} gold from the wilderness.' }
];

// Spawn entities
function spawnEntities() {
    enemies = [];
    npcs = [];
    items = [];

    // Track used quests so we don't duplicate
    const usedQuestIds = [];

    // Spawn NPCs in each town
    for (let townIndex = 0; townIndex < towns.length; townIndex++) {
        const town = towns[townIndex];

        // Innkeeper
        npcs.push({
            x: (town.x - 2) * TILE_SIZE, y: (town.y - 2) * TILE_SIZE,
            name: 'Innkeeper', type: 'merchant', town: town.name,
            dialogue: `Welcome to ${town.name}! Rest here to restore your health.`,
            quest: null
        });

        // Guard with quest
        let guardQuest = null;
        if (town.isStartTown) {
            // Start town always has bandit quest
            guardQuest = {
                id: 'kill_bandits_0', name: 'Clear the Bandits', target: 'bandit', type: 'kill',
                count: 3, current: 0, reward: 100
            };
            usedQuestIds.push('kill_bandits_0');
        } else if (Math.random() < 0.6) {
            // Other towns have 60% chance of guard quest
            const template = QUEST_TEMPLATES.filter(t => t.type === 'kill')[Math.floor(Math.random() * 3)];
            const questId = template.name.toLowerCase().replace(/ /g, '_') + '_' + townIndex;
            if (!usedQuestIds.includes(questId)) {
                guardQuest = {
                    id: questId, name: template.name, target: template.target, type: 'kill',
                    count: template.count, current: 0, reward: template.reward
                };
                usedQuestIds.push(questId);
            }
        }
        npcs.push({
            x: (town.x + 1) * TILE_SIZE, y: (town.y - 3) * TILE_SIZE,
            name: 'Guard Captain', type: 'questgiver', town: town.name,
            dialogue: guardQuest ? QUEST_TEMPLATES.find(t => t.name === guardQuest.name)?.dialogue.replace('{count}', guardQuest.count) || 'I have work for you.' : `${town.name} is peaceful... for now.`,
            quest: guardQuest
        });

        // Blacksmith in larger towns - sometimes has quests
        if (town.size >= 2) {
            let smithQuest = null;
            if (Math.random() < 0.4 && !town.isStartTown) {
                smithQuest = {
                    id: 'collect_gold_' + townIndex, name: 'Ore Collection', type: 'collect',
                    item: 'gold', count: 50 + Math.floor(Math.random() * 50), current: 0, reward: 60
                };
            }
            npcs.push({
                x: (town.x + 3) * TILE_SIZE, y: (town.y + 1) * TILE_SIZE,
                name: 'Blacksmith', type: 'merchant', town: town.name,
                dialogue: smithQuest ? 'I need materials! Bring me gold and I\'ll reward you.' : 'Need weapons? I forge the finest steel!',
                quest: smithQuest
            });
        }

        // Villager with exploration quest in larger towns
        if (town.size >= 2) {
            let villagerQuest = null;
            // Find nearby town for explore quest
            const otherTowns = towns.filter(t => t.name !== town.name);
            if (otherTowns.length > 0 && Math.random() < 0.5) {
                const targetTown = otherTowns[Math.floor(Math.random() * otherTowns.length)];
                villagerQuest = {
                    id: 'explore_' + townIndex, name: `Journey to ${targetTown.name}`, type: 'explore',
                    targetTown: targetTown.name, targetX: targetTown.x * TILE_SIZE, targetY: targetTown.y * TILE_SIZE,
                    count: 1, current: 0, reward: 80
                };
            }
            npcs.push({
                x: (town.x - 3) * TILE_SIZE, y: (town.y + 2) * TILE_SIZE,
                name: 'Villager', type: 'questgiver', town: town.name,
                dialogue: villagerQuest ? `I need someone to deliver a message to ${villagerQuest.targetTown}. Can you help?` : `${town.name} is a peaceful place... usually.`,
                quest: villagerQuest
            });
        }

        // Hunter NPC in some towns with wolf quests
        if (Math.random() < 0.4 && town.size >= 1) {
            const hunterQuest = {
                id: 'wolf_hunt_' + townIndex, name: 'Wolf Pelts', type: 'kill',
                target: 'wolf', count: 2 + Math.floor(Math.random() * 3), current: 0, reward: 50 + Math.floor(Math.random() * 30)
            };
            npcs.push({
                x: (town.x - 1) * TILE_SIZE, y: (town.y + 4) * TILE_SIZE,
                name: 'Hunter', type: 'questgiver', town: town.name,
                dialogue: 'I need wolf pelts! Hunt some wolves for me.',
                quest: hunterQuest
            });
        }
    }

    // Spawn enemies in wilderness
    const enemyTypes = ['bandit', 'wolf', 'draugr'];

    // Spawn 30-50 enemies across the map
    const numEnemies = 30 + Math.floor(Math.random() * 20);
    for (let i = 0; i < numEnemies; i++) {
        let ex, ey;
        let attempts = 0;

        while (attempts < 20) {
            ex = 5 + Math.floor(Math.random() * (MAP_WIDTH - 10));
            ey = 5 + Math.floor(Math.random() * (MAP_HEIGHT - 10));

            // Not too close to towns
            let nearTown = false;
            for (const town of towns) {
                if (Math.hypot(town.x - ex, town.y - ey) < 15) {
                    nearTown = true;
                    break;
                }
            }

            // Not on water or buildings
            if (!nearTown && map[ey] && map[ey][ex] &&
                map[ey][ex].terrain !== TERRAIN.WATER &&
                map[ey][ex].terrain !== TERRAIN.BUILDING &&
                map[ey][ex].terrain !== TERRAIN.ROOF) {

                // Choose enemy type based on location
                let type;
                if (ey < MAP_HEIGHT * 0.3) {
                    // Northern area - draugr more common
                    type = Math.random() < 0.5 ? 'draugr' : Math.random() < 0.5 ? 'wolf' : 'bandit';
                } else {
                    // Southern area - bandits and wolves
                    type = Math.random() < 0.4 ? 'bandit' : Math.random() < 0.6 ? 'wolf' : 'draugr';
                }

                enemies.push(createEnemy(ex * TILE_SIZE, ey * TILE_SIZE, type));
                break;
            }
            attempts++;
        }
    }

    // Spawn items in wilderness
    for (let i = 0; i < 20; i++) {
        let ix = 5 + Math.floor(Math.random() * (MAP_WIDTH - 10));
        let iy = 5 + Math.floor(Math.random() * (MAP_HEIGHT - 10));

        if (map[iy] && map[iy][ix] && map[iy][ix].terrain !== TERRAIN.WATER) {
            const itemType = Math.random();
            if (itemType < 0.5) {
                items.push({ x: ix * TILE_SIZE, y: iy * TILE_SIZE, type: 'gold', amount: 10 + Math.floor(Math.random() * 30) });
            } else if (itemType < 0.8) {
                items.push({ x: ix * TILE_SIZE, y: iy * TILE_SIZE, type: 'potion', name: 'Health Potion' });
            } else {
                const weapons = [
                    { name: 'Steel Sword', damage: 15 },
                    { name: 'Silver Sword', damage: 20 },
                    { name: 'Elven Blade', damage: 25 }
                ];
                const weapon = weapons[Math.floor(Math.random() * weapons.length)];
                items.push({ x: ix * TILE_SIZE, y: iy * TILE_SIZE, type: 'weapon', name: weapon.name, damage: weapon.damage });
            }
        }
    }
}

function createEnemy(x, y, type) {
    const stats = {
        bandit: { hp: 40, damage: 8, speed: 50, color: '#aa6644', loot: 15 },
        wolf: { hp: 25, damage: 6, speed: 70, color: '#888888', loot: 0 },
        draugr: { hp: 60, damage: 12, speed: 40, color: '#446666', loot: 25 }
    };

    const s = stats[type];
    return {
        x, y, type,
        hp: s.hp, maxHp: s.hp,
        damage: s.damage, speed: s.speed, color: s.color, loot: s.loot,
        state: 'idle',
        target: null,
        attackCooldown: 0,
        pathTimer: 0,
        facing: 2
    };
}

// Update player
function updatePlayer(dt) {
    let dx = 0, dy = 0;
    const speed = keys.shift ? player.speed * 1.5 : player.speed;

    if (keys.w || keys.arrowup) { dy = -1; player.facing = 0; }
    if (keys.s || keys.arrowdown) { dy = 1; player.facing = 2; }
    if (keys.a || keys.arrowleft) { dx = -1; player.facing = 3; }
    if (keys.d || keys.arrowright) { dx = 1; player.facing = 1; }

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;

        // Move player with circular collision and sliding
        let newX = player.x + dx * speed * dt;
        let newY = player.y + dy * speed * dt;

        // Use circular collider centered on player
        const playerRadius = 6; // Smaller than player.width/2 for easier navigation
        const centerX = newX + player.width / 2;
        const centerY = newY + player.height / 2;

        const collision = canMoveCircular(centerX, centerY, playerRadius);
        if (collision.blocked) {
            // Apply push-out for sliding effect
            newX += collision.pushX;
            newY += collision.pushY;
        }

        // Final bounds check
        newX = Math.max(playerRadius, Math.min(MAP_WIDTH * TILE_SIZE - playerRadius - player.width, newX));
        newY = Math.max(playerRadius, Math.min(MAP_HEIGHT * TILE_SIZE - playerRadius - player.height, newY));

        player.x = newX;
        player.y = newY;

        // Stamina drain while sprinting
        if (keys.shift && player.stamina > 0) {
            player.stamina -= 5 * dt;
        }
    }

    // Stamina regen
    if (!keys.shift && player.stamina < player.maxStamina) {
        player.stamina = Math.min(player.maxStamina, player.stamina + 10 * dt);
    }

    // Attack
    if (player.attacking) {
        player.attackTimer -= dt;
        if (player.attackTimer <= 0) {
            player.attacking = false;
        }
    }

    if (player.attackCooldown > 0) {
        player.attackCooldown -= dt;
    }

    // Update camera (with zoom - smaller viewport means zoomed in)
    const viewWidth = canvas.width / CAMERA_ZOOM;
    const viewHeight = canvas.height / CAMERA_ZOOM;
    game.camera.x = player.x - viewWidth / 2;
    game.camera.y = player.y - viewHeight / 2;
    game.camera.x = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - viewWidth, game.camera.x));
    game.camera.y = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - viewHeight, game.camera.y));

    // Check explore quest completion
    checkExploreQuests();
}

// Check if player has reached target town for explore quests
function checkExploreQuests() {
    for (const quest of game.quests) {
        if (quest.type === 'explore' && quest.current < quest.count) {
            const dist = Math.hypot(player.x - quest.targetX, player.y - quest.targetY);
            if (dist < 100) { // Within 100 pixels of target town
                quest.current = quest.count;
                showMessage(`Quest Complete: ${quest.name}! +${quest.reward} gold`);
                player.gold += quest.reward;
                player.xp += 30;
                if (player.xp >= player.xpToNext) levelUp();
            }
        }
    }
}

// Circular collision check with push-out for sliding
function canMoveCircular(cx, cy, radius) {
    // Check center tile and surrounding tiles
    const checkRadius = Math.ceil(radius / TILE_SIZE) + 1;
    const centerTileX = Math.floor(cx / TILE_SIZE);
    const centerTileY = Math.floor(cy / TILE_SIZE);

    for (let ty = centerTileY - checkRadius; ty <= centerTileY + checkRadius; ty++) {
        for (let tx = centerTileX - checkRadius; tx <= centerTileX + checkRadius; tx++) {
            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) {
                // Check distance to map boundary
                const nearestX = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE, cx));
                const nearestY = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE, cy));
                if (Math.hypot(cx - nearestX, cy - nearestY) < radius) {
                    return { blocked: true, pushX: 0, pushY: 0 };
                }
                continue;
            }

            const t = map[ty][tx].terrain;
            if (t === TERRAIN.WALL || t === TERRAIN.WATER || t === TERRAIN.TREE ||
                t === TERRAIN.ROCK || t === TERRAIN.BUILDING || t === TERRAIN.ROOF || t === TERRAIN.FENCE) {
                // Tile rectangle
                const tileLeft = tx * TILE_SIZE;
                const tileRight = (tx + 1) * TILE_SIZE;
                const tileTop = ty * TILE_SIZE;
                const tileBottom = (ty + 1) * TILE_SIZE;

                // Find nearest point on tile to circle center
                const nearestX = Math.max(tileLeft, Math.min(tileRight, cx));
                const nearestY = Math.max(tileTop, Math.min(tileBottom, cy));

                const dist = Math.hypot(cx - nearestX, cy - nearestY);
                if (dist < radius) {
                    // Calculate push direction
                    const overlap = radius - dist;
                    if (dist > 0) {
                        const pushX = (cx - nearestX) / dist * overlap;
                        const pushY = (cy - nearestY) / dist * overlap;
                        return { blocked: true, pushX, pushY };
                    } else {
                        // Circle center inside tile, push out in most open direction
                        return { blocked: true, pushX: 0, pushY: -overlap };
                    }
                }
            }
        }
    }

    return { blocked: false, pushX: 0, pushY: 0 };
}

// Legacy function for enemies (keep rectangular)
function canMove(x, y, w, h) {
    const tiles = [
        { x: Math.floor(x / TILE_SIZE), y: Math.floor(y / TILE_SIZE) },
        { x: Math.floor((x + w) / TILE_SIZE), y: Math.floor(y / TILE_SIZE) },
        { x: Math.floor(x / TILE_SIZE), y: Math.floor((y + h) / TILE_SIZE) },
        { x: Math.floor((x + w) / TILE_SIZE), y: Math.floor((y + h) / TILE_SIZE) }
    ];

    for (const tile of tiles) {
        if (tile.x < 0 || tile.x >= MAP_WIDTH || tile.y < 0 || tile.y >= MAP_HEIGHT) return false;
        const t = map[tile.y][tile.x].terrain;
        if (t === TERRAIN.WALL || t === TERRAIN.WATER || t === TERRAIN.TREE ||
            t === TERRAIN.ROCK || t === TERRAIN.BUILDING || t === TERRAIN.ROOF || t === TERRAIN.FENCE) {
            return false;
        }
    }

    return true;
}

// Attack
function playerAttack() {
    if (player.attackCooldown > 0 || player.attacking) return;

    player.attacking = true;
    player.attackTimer = 0.3;
    player.attackCooldown = 0.5;

    // Find enemies in attack range
    const attackRange = 24;
    const attackAngle = Math.PI / 2;

    const angles = [Math.PI * 1.5, 0, Math.PI * 0.5, Math.PI]; // up, right, down, left
    const facingAngle = angles[player.facing];

    for (const enemy of enemies) {
        const dx = (enemy.x + 7) - (player.x + 7);
        const dy = (enemy.y + 7) - (player.y + 7);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < attackRange) {
            const angle = Math.atan2(dy, dx);
            let angleDiff = Math.abs(angle - facingAngle);
            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

            if (angleDiff < attackAngle / 2) {
                // Hit!
                const damage = player.damage + Math.floor(player.skills.combat * 0.5);
                enemy.hp -= damage;
                showDamageNumber(enemy.x, enemy.y, damage);

                // Hit feedback
                triggerScreenShake(3, 0.1);
                spawnHitParticles(enemy.x + 7, enemy.y + 7, '#ffaa44', 6);
                enemy.hitFlash = 0.15; // Flash white for 0.15s

                // Knockback
                const kbDist = 8;
                const kbX = (dx / dist) * kbDist;
                const kbY = (dy / dist) * kbDist;
                if (canMove(enemy.x + kbX, enemy.y, 14, 14)) enemy.x += kbX;
                if (canMove(enemy.x, enemy.y + kbY, 14, 14)) enemy.y += kbY;

                if (enemy.hp <= 0) {
                    // Death feedback
                    triggerScreenShake(6, 0.15);
                    spawnHitParticles(enemy.x + 7, enemy.y + 7, '#ff4444', 12);
                    killEnemy(enemy);
                }
            }
        }
    }
}

let damageNumbers = [];
function showDamageNumber(x, y, amount) {
    damageNumbers.push({ x, y, amount, timer: 1 });
}

function killEnemy(enemy) {
    // Drop loot
    if (enemy.loot > 0) {
        items.push({ x: enemy.x, y: enemy.y, type: 'gold', amount: enemy.loot });
    }

    // XP
    player.xp += 20;
    if (player.xp >= player.xpToNext) {
        levelUp();
    }

    // Quest progress for kill quests
    for (const quest of game.quests) {
        if ((quest.type === 'kill' || !quest.type) && quest.target === enemy.type && quest.current < quest.count) {
            quest.current++;
            if (quest.current >= quest.count) {
                // Quest complete!
                showMessage(`Quest Complete: ${quest.name}! +${quest.reward} gold`);
                player.gold += quest.reward;
                player.xp += 50;
                if (player.xp >= player.xpToNext) levelUp();
            } else {
                showMessage(`Quest progress: ${quest.name} ${quest.current}/${quest.count}`);
            }
        }
    }

    // Remove enemy
    enemies = enemies.filter(e => e !== enemy);
}

function levelUp() {
    player.level++;
    player.xp = 0;
    player.xpToNext = player.level * 100;
    player.maxHp += 10;
    player.hp = player.maxHp;
    player.maxMp += 5;
    player.mp = player.maxMp;
    player.damage += 2;
    triggerScreenShake(5, 0.2);
    showMessage(`Level Up! You are now level ${player.level}`);
}

// Dodge roll
function startDodge() {
    if (player.dodgeCooldown > 0 || player.stamina < 20 || player.dodging) return;

    let dx = 0, dy = 0;
    if (keys.w || keys.arrowup) dy = -1;
    if (keys.s || keys.arrowdown) dy = 1;
    if (keys.a || keys.arrowleft) dx = -1;
    if (keys.d || keys.arrowright) dx = 1;

    if (dx === 0 && dy === 0) {
        // Dodge in facing direction
        const angles = [-1, 0, 1, 0]; // up, right, down, left
        const anglesY = [0, -1, 0, 1];
        dx = angles[player.facing];
        dy = anglesY[player.facing];
    }

    const len = Math.sqrt(dx * dx + dy * dy);
    player.dodgeDir = { x: dx / len, y: dy / len };
    player.dodging = true;
    player.dodgeTimer = 0.3;
    player.dodgeCooldown = 0.5;
    player.stamina -= 20;

    // Invincibility during dodge
    spawnHitParticles(player.x + 7, player.y + 7, '#aaccff', 4);
}

function updateDodge(dt) {
    if (player.dodging) {
        const dodgeSpeed = 200;
        const newX = player.x + player.dodgeDir.x * dodgeSpeed * dt;
        const newY = player.y + player.dodgeDir.y * dodgeSpeed * dt;

        const collision = canMoveCircular(newX + player.width/2, newY + player.height/2, 6);
        if (!collision.blocked) {
            player.x = newX;
            player.y = newY;
        }

        player.dodgeTimer -= dt;
        if (player.dodgeTimer <= 0) {
            player.dodging = false;
        }
    }

    if (player.dodgeCooldown > 0) {
        player.dodgeCooldown -= dt;
    }
}

// Shield blocking
function updateBlock(dt) {
    player.blocking = keys.rightMouse && player.equipped.shield !== null;

    if (player.blocking && player.stamina > 0) {
        // Blocking drains stamina slowly
        player.stamina = Math.max(0, player.stamina - 2 * dt);
    }
}

function getBlockReduction() {
    if (!player.blocking || !player.equipped.shield) return 0;
    const shield = EQUIPMENT.armor.shield[player.equipped.shield];
    return shield ? shield.block / 100 : 0;
}

// Spell casting
function castSpell() {
    if (player.spellCooldown > 0 || player.spells.length === 0) return;

    const spellName = player.spells[player.selectedSpell];
    const spell = SPELLS[spellName];
    if (!spell) return;

    // Check mana cost
    let cost = spell.cost;
    if (player.perks.includes('Novice Mage')) cost *= 0.75;

    if (player.mp < cost) {
        showMessage('Not enough magicka!');
        return;
    }

    player.mp -= cost;
    player.spellCooldown = 0.4;

    // Cast based on spell type
    if (spell.type === 'restore') {
        // Healing spell
        player.hp = Math.min(player.maxHp, player.hp + spell.heal);
        spawnHitParticles(player.x + 7, player.y + 7, '#44ff44', 8);
        showMessage(`Healed for ${spell.heal} HP`);
    } else if (spell.speed) {
        // Projectile spell (Firebolt)
        const angles = [Math.PI * 1.5, 0, Math.PI * 0.5, Math.PI];
        const angle = angles[player.facing];

        projectiles.push({
            x: player.x + 7,
            y: player.y + 7,
            vx: Math.cos(angle) * spell.speed,
            vy: Math.sin(angle) * spell.speed,
            damage: spell.damage,
            type: spell.type,
            owner: 'player',
            life: spell.range / spell.speed
        });

        spawnHitParticles(player.x + 7, player.y + 7, spell.type === 'fire' ? '#ff6633' : '#6699ff', 4);
    } else {
        // Cone/touch spell (Flames)
        const attackRange = spell.range;
        const angles = [Math.PI * 1.5, 0, Math.PI * 0.5, Math.PI];
        const facingAngle = angles[player.facing];

        for (const enemy of enemies) {
            const dx = (enemy.x + 7) - (player.x + 7);
            const dy = (enemy.y + 7) - (player.y + 7);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < attackRange) {
                const angle = Math.atan2(dy, dx);
                let angleDiff = Math.abs(angle - facingAngle);
                if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

                if (angleDiff < Math.PI / 3) {
                    enemy.hp -= spell.damage;
                    showDamageNumber(enemy.x, enemy.y, spell.damage);
                    spawnHitParticles(enemy.x + 7, enemy.y + 7, spell.type === 'fire' ? '#ff6633' : '#6699ff', 4);

                    // Apply DOT for fire
                    if (spell.dot) {
                        enemy.burning = spell.dot;
                        enemy.burnTimer = 3;
                    }
                    // Apply slow for frost
                    if (spell.slow) {
                        enemy.slowed = spell.slow;
                        enemy.slowTimer = 2;
                    }

                    if (enemy.hp <= 0) {
                        killEnemy(enemy);
                    }
                }
            }
        }
    }

    // Gain magic XP
    player.skills.magic += 0.1;
}

// Update projectiles
function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];

        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;
        proj.life -= dt;

        // Check collisions
        if (proj.owner === 'player') {
            for (const enemy of enemies) {
                const dist = Math.hypot(proj.x - (enemy.x + 7), proj.y - (enemy.y + 7));
                if (dist < 12) {
                    enemy.hp -= proj.damage;
                    showDamageNumber(enemy.x, enemy.y, proj.damage);
                    triggerScreenShake(4, 0.1);
                    spawnHitParticles(enemy.x + 7, enemy.y + 7, proj.type === 'fire' ? '#ff6633' : '#ffaa44', 8);

                    if (enemy.hp <= 0) {
                        killEnemy(enemy);
                    }

                    projectiles.splice(i, 1);
                    break;
                }
            }
        } else {
            // Enemy projectile
            const dist = Math.hypot(proj.x - (player.x + 7), proj.y - (player.y + 7));
            if (dist < 10 && !player.dodging) {
                let damage = proj.damage;
                const blockReduction = getBlockReduction();
                if (blockReduction > 0) {
                    damage = Math.floor(damage * (1 - blockReduction));
                    player.stamina -= 5;
                    showMessage('Blocked!');
                }
                damage = Math.max(1, damage - player.armor);
                player.hp -= damage;
                showDamageNumber(player.x, player.y, damage);
                triggerScreenShake(6, 0.15);
                triggerDamageFlash(0.4, 0.1);

                if (player.hp <= 0) {
                    game.state = 'gameover';
                }

                projectiles.splice(i, 1);
                break;
            }
        }

        // Check terrain collision or life expired
        const tileX = Math.floor(proj.x / TILE_SIZE);
        const tileY = Math.floor(proj.y / TILE_SIZE);
        if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
            projectiles.splice(i, 1);
            continue;
        }
        const terrain = map[tileY][tileX].terrain;
        if (terrain === TERRAIN.WALL || terrain === TERRAIN.TREE || terrain === TERRAIN.ROCK ||
            terrain === TERRAIN.BUILDING || proj.life <= 0) {
            projectiles.splice(i, 1);
        }
    }
}

// Fire bow
function fireBow() {
    if (player.attackCooldown > 0) return;

    const weapon = EQUIPMENT.weapons[player.equipped.weapon];
    if (!weapon || weapon.type !== 'bow') return;

    player.attackCooldown = 1 / weapon.speed;

    const angles = [Math.PI * 1.5, 0, Math.PI * 0.5, Math.PI];
    const angle = angles[player.facing];
    const speed = 300;

    projectiles.push({
        x: player.x + 7,
        y: player.y + 7,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: weapon.damage + Math.floor(player.skills.combat * 0.5),
        type: 'arrow',
        owner: 'player',
        life: weapon.range / speed
    });

    spawnHitParticles(player.x + 7, player.y + 7, '#aa8866', 3);
    player.skills.combat += 0.05;
}

// Weather system
function updateWeather(dt) {
    weather.timer -= dt;
    if (weather.timer <= 0) {
        // Change weather
        const types = ['clear', 'clear', 'clear', 'rain', 'fog'];
        // Snow only in northern areas
        if (player.y < MAP_HEIGHT * TILE_SIZE * 0.3) {
            types.push('snow', 'snow');
        }
        weather.type = types[Math.floor(Math.random() * types.length)];
        weather.intensity = 0.3 + Math.random() * 0.7;
        weather.timer = 60 + Math.random() * 120; // 1-3 minutes
    }

    // Update weather particles
    if (weather.type === 'rain' || weather.type === 'snow') {
        if (weather.particles.length < 100 * weather.intensity) {
            weather.particles.push({
                x: game.camera.x + Math.random() * canvas.width / CAMERA_ZOOM,
                y: game.camera.y - 10,
                speed: weather.type === 'rain' ? 200 + Math.random() * 100 : 30 + Math.random() * 20,
                drift: weather.type === 'snow' ? (Math.random() - 0.5) * 30 : (Math.random() - 0.5) * 5,
                size: weather.type === 'rain' ? 1 : 2 + Math.random() * 2
            });
        }
    }

    for (let i = weather.particles.length - 1; i >= 0; i--) {
        const p = weather.particles[i];
        p.y += p.speed * dt;
        p.x += p.drift * dt;
        if (p.y > game.camera.y + canvas.height / CAMERA_ZOOM + 20) {
            weather.particles.splice(i, 1);
        }
    }
}

function drawWeather() {
    if (weather.type === 'clear') return;

    ctx.save();
    ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);

    if (weather.type === 'rain') {
        ctx.strokeStyle = 'rgba(150, 170, 200, 0.5)';
        ctx.lineWidth = 1;
        for (const p of weather.particles) {
            const sx = p.x - game.camera.x;
            const sy = p.y - game.camera.y;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + p.drift * 0.1, sy + 8);
            ctx.stroke();
        }
    } else if (weather.type === 'snow') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (const p of weather.particles) {
            const sx = p.x - game.camera.x;
            const sy = p.y - game.camera.y;
            ctx.beginPath();
            ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (weather.type === 'fog') {
        ctx.fillStyle = `rgba(180, 190, 200, ${weather.intensity * 0.3})`;
        ctx.fillRect(0, 0, canvas.width / CAMERA_ZOOM, canvas.height / CAMERA_ZOOM);
    }

    ctx.restore();
}

// Day/night cycle
function updateDayNight(dt) {
    dayNight.time += dayNight.rate * dt * 60;
    if (dayNight.time >= 24) dayNight.time -= 24;
}

function getDayNightOverlay() {
    // Calculate darkness based on time
    // 6-18 is daytime, 0-6 and 18-24 is night
    const hour = dayNight.time;
    let darkness = 0;

    if (hour < 6) {
        darkness = 0.4 - (hour / 6) * 0.2; // 0.4 to 0.2
    } else if (hour < 7) {
        darkness = 0.2 - ((hour - 6) / 1) * 0.2; // Dawn
    } else if (hour < 18) {
        darkness = 0; // Day
    } else if (hour < 19) {
        darkness = ((hour - 18) / 1) * 0.2; // Dusk
    } else {
        darkness = 0.2 + ((hour - 19) / 5) * 0.2; // 0.2 to 0.4
    }

    return darkness;
}

// Chest system
function generateChests() {
    chests = [];

    // Add chests near dungeon entrances and in wilderness
    for (let i = 0; i < 15; i++) {
        let cx, cy;
        let attempts = 0;
        while (attempts < 20) {
            cx = 10 + Math.floor(Math.random() * (MAP_WIDTH - 20));
            cy = 10 + Math.floor(Math.random() * (MAP_HEIGHT - 20));

            if (map[cy][cx].terrain === TERRAIN.GRASS || map[cy][cx].terrain === TERRAIN.DIRT) {
                chests.push({
                    x: cx * TILE_SIZE,
                    y: cy * TILE_SIZE,
                    opened: false,
                    tier: Math.floor(Math.random() * 3) // 0=common, 1=rare, 2=boss
                });
                break;
            }
            attempts++;
        }
    }
}

function openChest(chest) {
    if (chest.opened) return;

    chest.opened = true;
    triggerScreenShake(2, 0.1);

    // Generate loot based on tier
    const gold = (chest.tier + 1) * (10 + Math.floor(Math.random() * 30));
    player.gold += gold;
    showMessage(`Found ${gold} gold!`);

    // Chance for item
    if (Math.random() < 0.3 + chest.tier * 0.2) {
        const itemTypes = ['Health Potion', 'Magicka Potion', 'Stamina Potion'];
        if (chest.tier >= 1) itemTypes.push('Iron Helmet', 'Leather Armor');
        if (chest.tier >= 2) itemTypes.push('Steel Sword', 'Iron Armor');

        const item = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        player.inventory.push(item);
        showMessage(`Found ${item}!`);
    }
}

function drawChests() {
    for (const chest of chests) {
        const screenX = (chest.x - game.camera.x);
        const screenY = (chest.y - game.camera.y);

        if (screenX < -20 || screenX > canvas.width / CAMERA_ZOOM + 20 ||
            screenY < -20 || screenY > canvas.height / CAMERA_ZOOM + 20) continue;

        // Draw chest
        if (chest.opened) {
            ctx.fillStyle = '#4a3a2a';
        } else {
            ctx.fillStyle = '#8a6a3a';
        }
        ctx.fillRect(screenX, screenY, 12, 10);

        // Chest lid
        ctx.fillStyle = chest.opened ? '#3a2a1a' : '#6a5030';
        ctx.fillRect(screenX - 1, screenY - 3, 14, 4);

        // Gold highlight for unopened
        if (!chest.opened) {
            ctx.fillStyle = '#d4aa44';
            ctx.fillRect(screenX + 4, screenY + 3, 4, 3);
        }
    }
}

function checkChestInteraction() {
    for (const chest of chests) {
        const dist = Math.hypot(player.x - chest.x, player.y - chest.y);
        if (dist < 30 && !chest.opened) {
            openChest(chest);
            return;
        }
    }
}

let messageText = '';
let messageTimer = 0;
function showMessage(text) {
    messageText = text;
    messageTimer = 3;
}

// Update enemies
function updateEnemies(dt) {
    for (const enemy of enemies) {
        const dist = distance(player.x, player.y, enemy.x, enemy.y);

        if (enemy.state === 'idle' && dist < 100) {
            enemy.state = 'chase';
            enemy.target = player;
        }

        if (enemy.state === 'chase') {
            if (dist > 200) {
                enemy.state = 'idle';
            } else if (dist < 20) {
                // Attack player
                enemy.attackCooldown -= dt;
                if (enemy.attackCooldown <= 0) {
                    const actualDamage = Math.max(1, enemy.damage - player.armor);
                    player.hp -= actualDamage;
                    showDamageNumber(player.x, player.y, enemy.damage);
                    enemy.attackCooldown = 1;

                    // Combat feedback effects
                    triggerScreenShake(8, 0.2);
                    triggerDamageFlash(0.5, 0.15);
                    spawnHitParticles(player.x + 7, player.y + 7, '#ff4444', 8);

                    if (player.hp <= 0) {
                        triggerScreenShake(15, 0.5);
                        triggerDamageFlash(1.0, 0.3);
                        game.state = 'gameover';
                    }
                }
            } else {
                // Move toward player
                const dx = player.x - enemy.x;
                const dy = player.y - enemy.y;
                const len = Math.sqrt(dx * dx + dy * dy);

                const newX = enemy.x + (dx / len) * enemy.speed * dt;
                const newY = enemy.y + (dy / len) * enemy.speed * dt;

                if (canMove(newX, enemy.y, 14, 14)) enemy.x = newX;
                if (canMove(enemy.x, newY, 14, 14)) enemy.y = newY;

                enemy.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
            }
        }
    }
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Draw functions
function draw() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply screen shake
    ctx.save();
    if (screenShake.duration > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake.intensity * 2;
        const shakeY = (Math.random() - 0.5) * screenShake.intensity * 2;
        ctx.translate(shakeX, shakeY);
    }

    // Apply camera zoom for game world rendering
    ctx.save();
    ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);

    drawMap();
    drawItems();
    drawEntities();
    drawPlayer();
    drawProjectiles();
    drawDamageNumbers();
    drawHitParticles();

    ctx.restore(); // Restore to draw UI at normal scale

    // Draw damage flash overlay
    if (damageFlash.duration > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${damageFlash.intensity * 0.4})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.restore(); // Restore from screen shake

    drawUI();

    if (game.dialogueActive) {
        drawDialogue();
    }

    if (game.state === 'gameover') {
        drawGameOver();
    }
}

function drawMap() {
    const viewWidth = canvas.width / CAMERA_ZOOM;
    const viewHeight = canvas.height / CAMERA_ZOOM;
    const startX = Math.floor(game.camera.x / TILE_SIZE);
    const startY = Math.floor(game.camera.y / TILE_SIZE);
    const endX = Math.min(MAP_WIDTH, startX + Math.ceil(viewWidth / TILE_SIZE) + 2);
    const endY = Math.min(MAP_HEIGHT, startY + Math.ceil(viewHeight / TILE_SIZE) + 2);

    // First pass: ground tiles
    for (let y = Math.max(0, startY); y < endY; y++) {
        for (let x = Math.max(0, startX); x < endX; x++) {
            const tile = map[y][x];
            const screenX = Math.floor(x * TILE_SIZE - game.camera.x);
            const screenY = Math.floor(y * TILE_SIZE - game.camera.y);

            drawTile(tile, screenX, screenY, x, y);
        }
    }

    // Second pass: tall objects (trees, buildings) drawn with depth
    for (let y = Math.max(0, startY); y < endY; y++) {
        for (let x = Math.max(0, startX); x < endX; x++) {
            const tile = map[y][x];
            const screenX = Math.floor(x * TILE_SIZE - game.camera.x);
            const screenY = Math.floor(y * TILE_SIZE - game.camera.y);

            if (tile.terrain === TERRAIN.TREE) {
                drawTree(screenX, screenY, tile.variant);
            }
        }
    }
}

function drawTile(tile, screenX, screenY, tileX, tileY) {
    const t = tile.terrain;
    const v = tile.variant;

    switch (t) {
        case TERRAIN.GRASS:
            // Varied grass colors
            const grassColors = [COLORS.GRASS, COLORS.GRASS_DARK, COLORS.GRASS_LIGHT, COLORS.GRASS_DARKER];
            ctx.fillStyle = grassColors[v] || COLORS.GRASS;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Grass detail - tufts
            const tuftSeed = (tileX * 17 + tileY * 31) % 7;
            if (tuftSeed === 0) {
                ctx.fillStyle = COLORS.GRASS_DARK;
                ctx.fillRect(screenX + 2, screenY + 10, 2, 5);
                ctx.fillRect(screenX + 4, screenY + 9, 1, 6);
                ctx.fillRect(screenX + 6, screenY + 11, 2, 4);
            } else if (tuftSeed === 1) {
                ctx.fillStyle = COLORS.GRASS_DARKER;
                ctx.fillRect(screenX + 9, screenY + 8, 2, 6);
                ctx.fillRect(screenX + 11, screenY + 9, 1, 5);
                ctx.fillRect(screenX + 13, screenY + 10, 2, 4);
            } else if (tuftSeed === 2) {
                // Small stones
                ctx.fillStyle = '#5a5a5a';
                ctx.fillRect(screenX + 5, screenY + 11, 3, 2);
                ctx.fillStyle = '#6a6a6a';
                ctx.fillRect(screenX + 11, screenY + 13, 2, 2);
            } else if (tuftSeed === 3) {
                // Dirt patch
                ctx.fillStyle = COLORS.DIRT_DARK;
                ctx.fillRect(screenX + 4, screenY + 6, 5, 4);
            }
            break;

        case TERRAIN.DIRT:
            ctx.fillStyle = v === 0 ? COLORS.DIRT : v === 1 ? COLORS.DIRT_DARK : '#7a6a5a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Dirt texture
            ctx.fillStyle = COLORS.DIRT_DARK;
            ctx.fillRect(screenX + 3, screenY + 5, 2, 2);
            ctx.fillRect(screenX + 10, screenY + 12, 2, 2);
            break;

        case TERRAIN.PATH:
            ctx.fillStyle = COLORS.STONE;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.STONE_LIGHT;
            ctx.fillRect(screenX + 2, screenY + 2, 4, 4);
            ctx.fillRect(screenX + 10, screenY + 8, 4, 4);
            ctx.fillStyle = COLORS.STONE_DARK;
            ctx.fillRect(screenX + 8, screenY + 2, 3, 3);
            break;

        case TERRAIN.STONE:
            if (v === 2) {
                // Dungeon floor
                ctx.fillStyle = COLORS.STONE_DARK;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.STONE;
                ctx.fillRect(screenX + 1, screenY + 1, 6, 6);
                ctx.fillRect(screenX + 9, screenY + 9, 6, 6);
            } else if (v === 3) {
                // Dungeon entrance
                ctx.fillStyle = COLORS.STONE_DARK;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(screenX + 3, screenY + 3, 10, 10);
                ctx.fillStyle = '#333';
                ctx.fillRect(screenX + 4, screenY + 8, 8, 2);
            } else {
                ctx.fillStyle = COLORS.STONE;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
            break;

        case TERRAIN.WATER:
            ctx.fillStyle = v === 0 ? COLORS.WATER : COLORS.WATER_DARK;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Animated water waves
            const wave1 = Math.sin((game.tick * 0.08) + tileX * 0.5 + tileY * 0.3);
            const wave2 = Math.sin((game.tick * 0.05) + tileX * 0.3 - tileY * 0.2);
            if (wave1 > 0.3) {
                ctx.fillStyle = 'rgba(100,150,200,0.25)';
                ctx.fillRect(screenX + 2, screenY + 4, 8, 2);
            }
            if (wave2 > 0.4) {
                ctx.fillStyle = 'rgba(80,130,180,0.2)';
                ctx.fillRect(screenX + 6, screenY + 10, 6, 2);
            }
            // Water sparkle
            if ((tileX * 13 + tileY * 7) % 11 === Math.floor(game.tick / 30) % 11) {
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.fillRect(screenX + 7, screenY + 3, 2, 2);
            }
            break;

        case TERRAIN.SNOW:
            ctx.fillStyle = v === 0 ? COLORS.SNOW : COLORS.SNOW_DARK;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Snow sparkle
            if ((tileX * 7 + tileY * 11) % 5 === 0) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(screenX + 5, screenY + 5, 2, 2);
            }
            break;

        case TERRAIN.WALL:
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, 2);
            break;

        case TERRAIN.BUILDING:
            // Wood wall
            ctx.fillStyle = COLORS.WOOD_DARK;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.WOOD;
            ctx.fillRect(screenX + 1, screenY + 2, TILE_SIZE - 2, 4);
            ctx.fillRect(screenX + 1, screenY + 10, TILE_SIZE - 2, 4);
            // Door
            if (v === 1) {
                ctx.fillStyle = '#5a4a3a';
                ctx.fillRect(screenX + 4, screenY + 2, 8, 14);
                ctx.fillStyle = COLORS.GOLD;
                ctx.fillRect(screenX + 10, screenY + 8, 2, 2);
            }
            break;

        case TERRAIN.ROOF:
            // Slanted roof
            ctx.fillStyle = v === 1 ? '#7a5040' : '#6a4535';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = v === 1 ? '#8a6050' : '#7a5545';
            ctx.fillRect(screenX, screenY + 4, TILE_SIZE, 4);
            ctx.fillRect(screenX, screenY + 12, TILE_SIZE, 4);
            break;

        case TERRAIN.BUSH:
            // Draw grass beneath
            ctx.fillStyle = COLORS.GRASS;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Bush
            ctx.fillStyle = COLORS.TREE_DARK;
            ctx.beginPath();
            ctx.arc(screenX + 8, screenY + 10, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = COLORS.TREE_MID;
            ctx.beginPath();
            ctx.arc(screenX + 6, screenY + 8, 4, 0, Math.PI * 2);
            ctx.fill();
            break;

        case TERRAIN.FLOWER:
            // Draw grass beneath
            ctx.fillStyle = COLORS.GRASS;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Flower - LOW contrast (no collision) - muted colors
            const flowerColors = ['#8a6666', '#8a8a66', '#666688']; // Muted tones
            ctx.fillStyle = COLORS.FLOWER_STEM || '#4a5a3a';
            ctx.fillRect(screenX + 7, screenY + 8, 2, 6);
            ctx.fillStyle = flowerColors[v];
            ctx.fillRect(screenX + 5, screenY + 5, 6, 4);
            ctx.fillStyle = '#9a9a66'; // Muted center
            ctx.fillRect(screenX + 7, screenY + 6, 2, 2);
            break;

        case TERRAIN.FENCE:
            // Draw grass beneath
            ctx.fillStyle = COLORS.GRASS;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Fence post
            ctx.fillStyle = COLORS.WOOD_DARK;
            ctx.fillRect(screenX, screenY + 6, TILE_SIZE, 4);
            ctx.fillStyle = COLORS.WOOD;
            ctx.fillRect(screenX + 2, screenY + 4, 2, 8);
            ctx.fillRect(screenX + 12, screenY + 4, 2, 8);
            break;

        case TERRAIN.ROCK:
            // Draw grass beneath
            ctx.fillStyle = COLORS.GRASS;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Rock
            ctx.fillStyle = COLORS.STONE;
            ctx.beginPath();
            ctx.moveTo(screenX + 2, screenY + 14);
            ctx.lineTo(screenX + 4, screenY + 6);
            ctx.lineTo(screenX + 12, screenY + 6);
            ctx.lineTo(screenX + 14, screenY + 14);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = COLORS.STONE_LIGHT;
            ctx.fillRect(screenX + 5, screenY + 8, 4, 3);
            break;

        case TERRAIN.TREE:
            // Just draw grass base, tree is drawn in second pass
            ctx.fillStyle = COLORS.GRASS;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            break;

        case TERRAIN.FARMLAND:
            // Tilled soil rows
            ctx.fillStyle = v === 0 ? '#4a3a2a' : '#5a4a3a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Furrows
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(screenX, screenY + 2, TILE_SIZE, 2);
            ctx.fillRect(screenX, screenY + 8, TILE_SIZE, 2);
            ctx.fillRect(screenX, screenY + 14, TILE_SIZE, 2);
            // Some crops
            if ((tileX * 3 + tileY * 7) % 4 === 0) {
                ctx.fillStyle = '#5a8a4a';
                ctx.fillRect(screenX + 4, screenY + 4, 3, 4);
                ctx.fillRect(screenX + 10, screenY + 10, 3, 4);
            }
            break;

        case TERRAIN.HAY:
            // Draw dirt beneath
            ctx.fillStyle = COLORS.DIRT;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Hay bale
            ctx.fillStyle = '#c4a444';
            ctx.fillRect(screenX + 2, screenY + 4, 12, 10);
            ctx.fillStyle = '#d4b454';
            ctx.fillRect(screenX + 3, screenY + 5, 10, 4);
            // Hay strands
            ctx.fillStyle = '#e4c464';
            ctx.fillRect(screenX + 4, screenY + 2, 2, 4);
            ctx.fillRect(screenX + 10, screenY + 3, 2, 3);
            break;

        case TERRAIN.CAMPFIRE:
            // Draw dirt beneath
            ctx.fillStyle = COLORS.DIRT;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Stone ring
            ctx.fillStyle = COLORS.STONE;
            ctx.fillRect(screenX + 2, screenY + 10, 12, 4);
            ctx.fillRect(screenX + 4, screenY + 8, 8, 2);
            // Fire
            const flicker = Math.sin(game.tick * 0.2) * 2;
            ctx.fillStyle = '#ff6622';
            ctx.beginPath();
            ctx.moveTo(screenX + 8, screenY + 2 + flicker);
            ctx.lineTo(screenX + 12, screenY + 10);
            ctx.lineTo(screenX + 4, screenY + 10);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ffaa44';
            ctx.beginPath();
            ctx.moveTo(screenX + 8, screenY + 4 + flicker);
            ctx.lineTo(screenX + 10, screenY + 9);
            ctx.lineTo(screenX + 6, screenY + 9);
            ctx.closePath();
            ctx.fill();
            // Glow effect
            ctx.fillStyle = 'rgba(255,100,0,0.15)';
            ctx.beginPath();
            ctx.arc(screenX + 8, screenY + 8, 12, 0, Math.PI * 2);
            ctx.fill();
            // Logs
            ctx.fillStyle = '#4a3020';
            ctx.fillRect(screenX + 3, screenY + 11, 4, 2);
            ctx.fillRect(screenX + 9, screenY + 11, 4, 2);
            break;

        default:
            ctx.fillStyle = COLORS.GRASS;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
}

function drawTree(screenX, screenY, variant) {
    const size = variant === 2 ? 1.4 : variant === 1 ? 1.2 : 1.0;
    const trunkColor = variant === 2 ? '#5a4030' : '#4a3525';

    // Shadow
    ctx.fillStyle = COLORS.SHADOW;
    ctx.beginPath();
    ctx.ellipse(screenX + 8, screenY + 15, 7 * size, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk - more prominent
    ctx.fillStyle = trunkColor;
    ctx.fillRect(screenX + 5, screenY + 6, 6, 10);
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(screenX + 5, screenY + 6, 2, 10); // Dark side

    // Pine tree layers - fuller
    ctx.fillStyle = COLORS.TREE_DARK;
    // Bottom layer
    ctx.beginPath();
    ctx.moveTo(screenX + 8, screenY - 2 * size);
    ctx.lineTo(screenX + 16, screenY + 12);
    ctx.lineTo(screenX, screenY + 12);
    ctx.closePath();
    ctx.fill();

    // Middle layer
    ctx.fillStyle = COLORS.TREE_MID;
    ctx.beginPath();
    ctx.moveTo(screenX + 8, screenY - 6 * size);
    ctx.lineTo(screenX + 14, screenY + 6);
    ctx.lineTo(screenX + 2, screenY + 6);
    ctx.closePath();
    ctx.fill();

    // Top layer
    ctx.fillStyle = COLORS.TREE_LIGHT;
    ctx.beginPath();
    ctx.moveTo(screenX + 8, screenY - 10 * size);
    ctx.lineTo(screenX + 12, screenY);
    ctx.lineTo(screenX + 4, screenY);
    ctx.closePath();
    ctx.fill();

    // Tree detail - small branches
    ctx.fillStyle = COLORS.TREE_DARK;
    ctx.fillRect(screenX + 2, screenY + 3, 3, 2);
    ctx.fillRect(screenX + 11, screenY + 5, 3, 2);

    // Snow on tree if in snowy area
    if (screenY + game.camera.y < 12 * TILE_SIZE) {
        ctx.fillStyle = COLORS.SNOW;
        ctx.fillRect(screenX + 5, screenY - 8 * size, 6, 3);
        ctx.fillRect(screenX + 3, screenY - 2, 4, 2);
        ctx.fillRect(screenX + 10, screenY + 2, 4, 2);
        ctx.fillRect(screenX + 1, screenY + 8, 3, 2);
    }
}

function drawItems() {
    for (const item of items) {
        const screenX = item.x - game.camera.x;
        const screenY = item.y - game.camera.y;

        if (item.type === 'gold') {
            ctx.fillStyle = COLORS.GOLD;
            ctx.beginPath();
            ctx.arc(screenX + 8, screenY + 8, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (item.type === 'potion') {
            ctx.fillStyle = '#cc4466';
            ctx.fillRect(screenX + 5, screenY + 3, 6, 10);
            ctx.fillStyle = '#aa2244';
            ctx.fillRect(screenX + 6, screenY + 0, 4, 4);
        } else if (item.type === 'weapon') {
            ctx.fillStyle = '#aaaaaa';
            ctx.fillRect(screenX + 7, screenY + 2, 2, 12);
            ctx.fillStyle = '#664422';
            ctx.fillRect(screenX + 5, screenY + 12, 6, 3);
        }
    }

    // Draw chests
    drawChests();
}

function drawProjectiles() {
    for (const proj of projectiles) {
        const screenX = proj.x - game.camera.x;
        const screenY = proj.y - game.camera.y;

        if (proj.type === 'arrow') {
            // Draw arrow
            ctx.save();
            ctx.translate(screenX, screenY);
            const angle = Math.atan2(proj.vy, proj.vx);
            ctx.rotate(angle);
            ctx.fillStyle = '#aa8866';
            ctx.fillRect(-6, -1, 12, 2);
            ctx.fillStyle = '#444444';
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(3, -2);
            ctx.lineTo(3, 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else if (proj.type === 'fire') {
            // Fire projectile
            ctx.fillStyle = '#ff6633';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffaa44';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (proj.type === 'frost') {
            // Frost projectile
            ctx.fillStyle = '#6699ff';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#aaccff';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawEntities() {
    // NPCs - BRIGHTER for visibility
    for (const npc of npcs) {
        const screenX = npc.x - game.camera.x;
        const screenY = npc.y - game.camera.y;

        // Shadow
        ctx.fillStyle = COLORS.SHADOW;
        ctx.beginPath();
        ctx.ellipse(screenX + 8, screenY + 14, 5, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body - brighter colors for visibility
        const bodyColor = npc.type === 'merchant' ? '#8a7a6a' : npc.type === 'questgiver' ? '#6a7a8a' : COLORS.NPC;
        ctx.fillStyle = bodyColor;
        ctx.fillRect(screenX + 4, screenY + 4, 8, 10);

        // Clothes detail
        ctx.fillStyle = '#444';
        ctx.fillRect(screenX + 6, screenY + 8, 4, 1);

        // Head - brighter skin
        ctx.fillStyle = '#f0d8b8';
        ctx.fillRect(screenX + 5, screenY - 1, 6, 6);

        // Hair
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(screenX + 5, screenY - 2, 6, 3);

        // Green outline to indicate friendly NPC
        ctx.strokeStyle = '#55aa55';
        ctx.strokeRect(screenX + 3, screenY - 3, 10, 17);

        // Quest marker
        if (npc.quest && !game.quests.some(q => q.id === npc.quest.id)) {
            ctx.fillStyle = COLORS.GOLD;
            ctx.font = 'bold 14px Arial';
            ctx.fillText('!', screenX + 5, screenY - 8);
        }

        // Name on hover (if close)
        const distToPlayer = distance(player.x, player.y, npc.x, npc.y);
        if (distToPlayer < 40) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(screenX - 10, screenY - 20, ctx.measureText(npc.name).width + 8, 12);
            ctx.fillStyle = '#fff';
            ctx.font = '9px Arial';
            ctx.fillText(npc.name, screenX - 6, screenY - 11);
        }
    }

    // Enemies
    for (const enemy of enemies) {
        const screenX = enemy.x - game.camera.x;
        const screenY = enemy.y - game.camera.y;

        // Shadow
        ctx.fillStyle = COLORS.SHADOW;
        ctx.beginPath();
        ctx.ellipse(screenX + 8, screenY + 14, 5, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        if (enemy.type === 'wolf') {
            // Wolf body - BRIGHTER for visibility
            ctx.fillStyle = '#8a8a8a';  // Brighter gray
            ctx.fillRect(screenX + 2, screenY + 6, 12, 6);
            ctx.fillStyle = '#7a7a7a';
            ctx.fillRect(screenX + 3, screenY + 8, 10, 4);
            // Wolf head
            ctx.fillStyle = '#9a9a9a';  // Brighter
            ctx.fillRect(screenX + 10, screenY + 4, 5, 5);
            // Ears
            ctx.fillStyle = '#8a8a8a';
            ctx.fillRect(screenX + 10, screenY + 2, 2, 3);
            ctx.fillRect(screenX + 13, screenY + 2, 2, 3);
            // Eye - glowing red
            ctx.fillStyle = '#ff5555';
            ctx.fillRect(screenX + 13, screenY + 5, 1, 1);
            // Red outline to indicate enemy
            ctx.strokeStyle = '#aa4444';
            ctx.strokeRect(screenX + 1, screenY + 1, 14, 12);
        } else if (enemy.type === 'draugr') {
            // Draugr - undead warrior - BRIGHTER
            ctx.fillStyle = '#6a7a7a';  // Lighter
            ctx.fillRect(screenX + 4, screenY + 4, 8, 10);
            // Tattered armor
            ctx.fillStyle = '#5a6a6a';
            ctx.fillRect(screenX + 5, screenY + 6, 6, 4);
            // Skull face - lighter
            ctx.fillStyle = '#8a9a9a';
            ctx.fillRect(screenX + 5, screenY - 1, 6, 6);
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(screenX + 6, screenY + 1, 2, 2);
            ctx.fillRect(screenX + 9, screenY + 1, 2, 2);
            // Glowing eyes - brighter
            ctx.fillStyle = '#66aaff';
            ctx.fillRect(screenX + 6, screenY + 1, 1, 1);
            ctx.fillRect(screenX + 9, screenY + 1, 1, 1);
            // Blue outline
            ctx.strokeStyle = '#4488aa';
            ctx.strokeRect(screenX + 3, screenY - 2, 10, 16);
        } else {
            // Bandit - BRIGHTER
            ctx.fillStyle = '#9a7a6a';  // Lighter
            ctx.fillRect(screenX + 4, screenY + 4, 8, 10);
            // Leather armor
            ctx.fillStyle = '#7a5040';
            ctx.fillRect(screenX + 5, screenY + 6, 6, 6);
            // Head
            ctx.fillStyle = '#e8c8a8';
            ctx.fillRect(screenX + 5, screenY - 1, 6, 6);
            // Hood
            ctx.fillStyle = '#6a5a4a';
            ctx.fillRect(screenX + 4, screenY - 2, 8, 4);
            // Red outline to indicate enemy
            ctx.strokeStyle = '#aa4444';
            ctx.strokeRect(screenX + 3, screenY - 3, 10, 17);
        }

        // Hit flash overlay (white flash when hit)
        if (enemy.hitFlash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${enemy.hitFlash * 4})`;
            ctx.fillRect(screenX + 2, screenY - 2, 12, 16);
        }

        // Health bar
        if (enemy.hp < enemy.maxHp) {
            ctx.fillStyle = COLORS.HEALTH_BG;
            ctx.fillRect(screenX, screenY - 6, 16, 4);
            ctx.fillStyle = COLORS.HEALTH;
            ctx.fillRect(screenX, screenY - 6, 16 * (enemy.hp / enemy.maxHp), 4);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(screenX, screenY - 6, 16, 4);
        }

        // Alert indicator
        if (enemy.state === 'chase') {
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('!', screenX + 6, screenY - 10);
        }
    }
}

function drawPlayer() {
    const screenX = player.x - game.camera.x;
    const screenY = player.y - game.camera.y;

    // Shadow
    ctx.fillStyle = COLORS.SHADOW;
    ctx.beginPath();
    ctx.ellipse(screenX + 8, screenY + 14, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body - armor/clothes
    ctx.fillStyle = '#5577aa'; // Blue tunic
    ctx.fillRect(screenX + 4, screenY + 4, 8, 10);

    // Armor detail
    ctx.fillStyle = '#4466aa';
    ctx.fillRect(screenX + 5, screenY + 6, 6, 4);

    // Belt
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(screenX + 4, screenY + 10, 8, 2);

    // Head
    ctx.fillStyle = COLORS.SKIN;
    ctx.fillRect(screenX + 5, screenY - 1, 6, 6);

    // Hair
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(screenX + 5, screenY - 2, 6, 3);

    // Eyes (based on facing)
    ctx.fillStyle = '#222';
    if (player.facing === 0) { // Up
        // Show back of head
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(screenX + 5, screenY, 6, 4);
    } else if (player.facing === 2) { // Down
        ctx.fillRect(screenX + 6, screenY + 1, 1, 1);
        ctx.fillRect(screenX + 9, screenY + 1, 1, 1);
    } else {
        // Side view
        const eyeX = player.facing === 1 ? screenX + 9 : screenX + 6;
        ctx.fillRect(eyeX, screenY + 1, 1, 1);
    }

    // Weapon swing
    if (player.attacking) {
        ctx.fillStyle = '#aaa';
        ctx.save();
        ctx.translate(screenX + 8, screenY + 8);
        const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
        ctx.rotate(angles[player.facing] + Math.sin(player.attackTimer * 20) * 0.8);

        // Sword
        ctx.fillStyle = '#888';
        ctx.fillRect(-2, -18, 3, 16);
        // Sword hilt
        ctx.fillStyle = '#5a4030';
        ctx.fillRect(-3, -3, 5, 4);
        // Crossguard
        ctx.fillStyle = '#666';
        ctx.fillRect(-4, -4, 7, 2);

        ctx.restore();
    } else {
        // Show sword at side when not attacking
        ctx.fillStyle = '#888';
        const swordOffsets = [
            { x: 12, y: 2, r: 0.3 },     // Up
            { x: 12, y: 6, r: 0.5 },      // Right
            { x: 0, y: 6, r: -0.5 },      // Down
            { x: 0, y: 6, r: -0.5 }       // Left
        ];
        const so = swordOffsets[player.facing];
        ctx.save();
        ctx.translate(screenX + so.x, screenY + so.y);
        ctx.rotate(so.r);
        ctx.fillRect(0, 0, 2, 10);
        ctx.restore();
    }
}

function drawDamageNumbers() {
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const dn = damageNumbers[i];
        const screenX = dn.x - game.camera.x;
        const screenY = dn.y - game.camera.y - (1 - dn.timer) * 20;

        ctx.fillStyle = `rgba(255, 100, 100, ${dn.timer})`;
        ctx.font = 'bold 12px Arial';
        ctx.fillText(dn.amount.toString(), screenX, screenY);

        dn.timer -= 0.03;
        if (dn.timer <= 0) {
            damageNumbers.splice(i, 1);
        }
    }
}

function drawUI() {
    // Bottom panel (Stoneshard style)
    const panelHeight = 70;
    const panelY = canvas.height - panelHeight;

    // Dark panel background
    ctx.fillStyle = COLORS.UI_PANEL;
    ctx.fillRect(0, panelY, canvas.width, panelHeight);

    // Panel top border
    ctx.fillStyle = COLORS.UI_BORDER;
    ctx.fillRect(0, panelY, canvas.width, 2);
    ctx.fillStyle = COLORS.UI_BORDER_LIGHT;
    ctx.fillRect(0, panelY + 2, canvas.width, 1);

    // Left section: Bars
    const barX = 15;
    const barWidth = 120;
    const barHeight = 14;

    // Health bar
    ctx.fillStyle = COLORS.HEALTH_BG;
    ctx.fillRect(barX, panelY + 10, barWidth, barHeight);
    ctx.fillStyle = COLORS.HEALTH;
    ctx.fillRect(barX, panelY + 10, barWidth * (player.hp / player.maxHp), barHeight);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(barX, panelY + 10, barWidth, barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.fillText(`${Math.floor(player.hp)}/${player.maxHp}`, barX + 40, panelY + 21);

    // Mana bar
    ctx.fillStyle = COLORS.MANA_BG;
    ctx.fillRect(barX, panelY + 28, barWidth, barHeight);
    ctx.fillStyle = COLORS.MANA;
    ctx.fillRect(barX, panelY + 28, barWidth * (player.mp / player.maxMp), barHeight);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(barX, panelY + 28, barWidth, barHeight);
    ctx.fillText(`${Math.floor(player.mp)}/${player.maxMp}`, barX + 40, panelY + 39);

    // Stamina bar
    ctx.fillStyle = COLORS.STAMINA_BG;
    ctx.fillRect(barX, panelY + 46, barWidth, barHeight);
    ctx.fillStyle = COLORS.STAMINA;
    ctx.fillRect(barX, panelY + 46, barWidth * (player.stamina / player.maxStamina), barHeight);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(barX, panelY + 46, barWidth, barHeight);

    // Center section: Inventory slots
    const slotSize = 28;
    const slotStartX = canvas.width / 2 - (slotSize * 4);
    for (let i = 0; i < 8; i++) {
        const sx = slotStartX + i * (slotSize + 4);
        ctx.fillStyle = COLORS.UI_BG;
        ctx.fillRect(sx, panelY + 20, slotSize, slotSize);
        ctx.strokeStyle = COLORS.UI_BORDER;
        ctx.strokeRect(sx, panelY + 20, slotSize, slotSize);

        // Show quick slot numbers
        if (i < 3) {
            ctx.fillStyle = '#888';
            ctx.font = '9px Arial';
            ctx.fillText(`${i + 1}`, sx + 2, panelY + 30);
        }

        // Show inventory item icon
        if (i < player.inventory.length) {
            const item = player.inventory[i];
            if (item.includes('Potion')) {
                ctx.fillStyle = '#cc4466';
                ctx.fillRect(sx + 8, panelY + 26, 12, 14);
                ctx.fillStyle = '#aa2244';
                ctx.fillRect(sx + 10, panelY + 23, 8, 4);
            } else if (item.includes('Sword')) {
                ctx.fillStyle = '#aaa';
                ctx.fillRect(sx + 12, panelY + 24, 4, 18);
                ctx.fillStyle = '#664422';
                ctx.fillRect(sx + 10, panelY + 38, 8, 4);
            }
        }
    }

    // Right section: Stats
    const statsX = canvas.width - 110;
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(statsX, panelY + 8, 100, 54);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(statsX, panelY + 8, 100, 54);

    ctx.fillStyle = '#ccc';
    ctx.font = 'bold 11px Arial';
    ctx.fillText(`Level ${player.level}`, statsX + 10, panelY + 24);

    ctx.font = '10px Arial';
    ctx.fillStyle = '#999';
    ctx.fillText(`XP: ${player.xp}/${player.xpToNext}`, statsX + 10, panelY + 38);

    ctx.fillStyle = COLORS.GOLD;
    ctx.fillText(`Gold: ${player.gold}`, statsX + 10, panelY + 52);

    // Top UI: Quest tracker
    if (game.quests.length > 0) {
        ctx.fillStyle = 'rgba(18,20,26,0.9)';
        ctx.fillRect(10, 10, 200, 25 + game.quests.length * 18);
        ctx.strokeStyle = COLORS.UI_BORDER;
        ctx.strokeRect(10, 10, 200, 25 + game.quests.length * 18);

        ctx.fillStyle = COLORS.GOLD;
        ctx.font = 'bold 11px Arial';
        ctx.fillText('ACTIVE QUESTS', 20, 26);

        ctx.fillStyle = '#ccc';
        ctx.font = '10px Arial';
        for (let i = 0; i < game.quests.length; i++) {
            const q = game.quests[i];
            const complete = q.current >= q.count;
            ctx.fillStyle = complete ? '#4a4' : '#ccc';
            ctx.fillText(`${complete ? '✓' : '○'} ${q.name}: ${q.current}/${q.count}`, 20, 42 + i * 18);
        }
    }

    // Top center: Minimap frame (optional)
    const minimapSize = 60;
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(canvas.width / 2 - minimapSize / 2, 10, minimapSize, minimapSize);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(canvas.width / 2 - minimapSize / 2, 10, minimapSize, minimapSize);

    // Draw minimap
    const mmScale = minimapSize / (MAP_WIDTH * TILE_SIZE);
    const mmX = canvas.width / 2 - minimapSize / 2;
    const mmY = 10;
    ctx.fillStyle = COLORS.GRASS_DARK;
    ctx.fillRect(mmX + 1, mmY + 1, minimapSize - 2, minimapSize - 2);

    // Player position on minimap
    ctx.fillStyle = '#fff';
    ctx.fillRect(mmX + player.x * mmScale, mmY + player.y * mmScale, 3, 3);

    // Quest target markers on minimap and screen arrow
    for (const quest of game.quests) {
        if (quest.current >= quest.count) continue; // Quest complete

        // Find enemies matching quest target
        for (const enemy of enemies) {
            if (enemy.type === quest.target) {
                // Draw on minimap (yellow dot)
                ctx.fillStyle = COLORS.GOLD;
                ctx.fillRect(mmX + enemy.x * mmScale - 1, mmY + enemy.y * mmScale - 1, 4, 4);
            }
        }
    }

    // Draw arrow pointing to nearest quest target (edge of screen indicator)
    drawQuestArrow();

    // Draw town markers on minimap and direction arrows
    drawTownMarkers();

    // Message popup
    if (messageTimer > 0) {
        const msgWidth = ctx.measureText(messageText).width + 40;
        ctx.fillStyle = 'rgba(18,20,26,0.95)';
        ctx.fillRect(canvas.width / 2 - msgWidth / 2, 80, msgWidth, 30);
        ctx.strokeStyle = COLORS.GOLD;
        ctx.strokeRect(canvas.width / 2 - msgWidth / 2, 80, msgWidth, 30);

        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(messageText, canvas.width / 2, 100);
        ctx.textAlign = 'left';
        messageTimer -= 0.016;
    }

    // Controls hint (detailed)
    ctx.fillStyle = '#666';
    ctx.font = '9px Arial';
    ctx.fillText('WASD: Move | Space: Attack | E: Interact/Use | Q: Cast Spell | 1-3: Select Spell', 145, panelY + 62);

    // Show current spell indicator
    if (player.spells.length > 0) {
        const spell = player.spells[player.selectedSpell] || player.spells[0];
        ctx.fillStyle = '#5588cc';
        ctx.font = 'bold 9px Arial';
        ctx.fillText(`[Q] Spell: ${spell}`, 145, panelY + 12);
    }
}

// Quest arrow indicator pointing toward nearest quest target
function drawQuestArrow() {
    if (game.quests.length === 0) return;

    let nearestTarget = null;
    let nearestDist = Infinity;

    // Find nearest quest target enemy
    for (const quest of game.quests) {
        if (quest.current >= quest.count) continue;

        for (const enemy of enemies) {
            if (enemy.type === quest.target) {
                const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestTarget = enemy;
                }
            }
        }
    }

    if (!nearestTarget) return;

    // Check if target is off screen
    const viewWidth = canvas.width / CAMERA_ZOOM;
    const viewHeight = canvas.height / CAMERA_ZOOM;
    const screenX = (nearestTarget.x - game.camera.x) * CAMERA_ZOOM;
    const screenY = (nearestTarget.y - game.camera.y) * CAMERA_ZOOM;

    // If on screen, don't show arrow
    if (screenX > 50 && screenX < canvas.width - 50 &&
        screenY > 100 && screenY < canvas.height - 150) {
        return;
    }

    // Calculate arrow position at edge of screen
    const angle = Math.atan2(nearestTarget.y - player.y, nearestTarget.x - player.x);
    const arrowDist = 120;
    const centerX = canvas.width / 2;
    const centerY = (canvas.height - 70) / 2; // Account for UI panel

    let arrowX = centerX + Math.cos(angle) * arrowDist;
    let arrowY = centerY + Math.sin(angle) * arrowDist;

    // Clamp to screen edges
    arrowX = Math.max(40, Math.min(canvas.width - 40, arrowX));
    arrowY = Math.max(100, Math.min(canvas.height - 130, arrowY));

    // Draw arrow
    ctx.save();
    ctx.translate(arrowX, arrowY);
    ctx.rotate(angle);

    // Arrow shape
    ctx.fillStyle = COLORS.GOLD;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-8, -10);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 10);
    ctx.closePath();
    ctx.fill();

    // Arrow outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // Distance indicator
    const distText = Math.floor(nearestDist / TILE_SIZE) + 'm';
    ctx.fillStyle = COLORS.GOLD;
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(distText, arrowX, arrowY + 25);
    ctx.textAlign = 'left';
}

// Check if player is inside any town
function isPlayerInsideTown() {
    for (const town of towns) {
        const radius = town.size === 3 ? 8 : town.size === 2 ? 6 : 4;
        const dist = Math.hypot(player.x / TILE_SIZE - town.x, player.y / TILE_SIZE - town.y);
        if (dist < radius + 2) {
            return town;
        }
    }
    return null;
}

// Town markers on minimap and screen edges
function drawTownMarkers() {
    const mmScale = 60 / (MAP_WIDTH * TILE_SIZE);
    const mmX = canvas.width / 2 - 30;
    const mmY = 10;

    // Draw towns on minimap
    for (const town of towns) {
        const townMmX = mmX + town.x * TILE_SIZE * mmScale;
        const townMmY = mmY + town.y * TILE_SIZE * mmScale;

        // Town dot color based on size
        ctx.fillStyle = town.size === 3 ? '#ffaa44' : town.size === 2 ? '#88cc88' : '#aaaaaa';
        ctx.beginPath();
        ctx.arc(townMmX, townMmY, town.size + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Don't show direction arrows when player is inside a town
    const currentTown = isPlayerInsideTown();
    if (currentTown) {
        // Player is in a town - don't show navigation arrows
        return;
    }

    // Draw direction arrows to nearby towns (not on screen)
    const nearbyTowns = towns
        .map(t => ({
            ...t,
            dist: Math.hypot(t.x * TILE_SIZE - player.x, t.y * TILE_SIZE - player.y)
        }))
        .filter(t => t.dist > 100 && t.dist < 800) // 100-800 pixel range
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3); // Show up to 3 nearest towns

    for (const town of nearbyTowns) {
        const townWorldX = town.x * TILE_SIZE;
        const townWorldY = town.y * TILE_SIZE;

        // Check if town is off screen
        const screenX = (townWorldX - game.camera.x) * CAMERA_ZOOM;
        const screenY = (townWorldY - game.camera.y) * CAMERA_ZOOM;

        if (screenX > 80 && screenX < canvas.width - 80 &&
            screenY > 120 && screenY < canvas.height - 170) {
            // Town is on screen - show name label
            ctx.fillStyle = 'rgba(18,20,26,0.85)';
            const nameWidth = ctx.measureText(town.name).width + 10;
            ctx.fillRect(screenX - nameWidth / 2, screenY - 35, nameWidth, 16);
            ctx.strokeStyle = '#88cc88';
            ctx.strokeRect(screenX - nameWidth / 2, screenY - 35, nameWidth, 16);

            ctx.fillStyle = '#88cc88';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(town.name, screenX, screenY - 23);
            ctx.textAlign = 'left';
            continue;
        }

        // Town is off screen - draw directional arrow at screen edge
        const angle = Math.atan2(townWorldY - player.y, townWorldX - player.x);
        const arrowDist = 130;
        const centerX = canvas.width / 2;
        const centerY = (canvas.height - 70) / 2;

        let arrowX = centerX + Math.cos(angle) * arrowDist;
        let arrowY = centerY + Math.sin(angle) * arrowDist;

        // Clamp to screen edges
        arrowX = Math.max(60, Math.min(canvas.width - 60, arrowX));
        arrowY = Math.max(120, Math.min(canvas.height - 150, arrowY));

        // Draw arrow
        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angle);

        // Arrow shape - green for towns
        ctx.fillStyle = '#88cc88';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(-6, -8);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-6, 8);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#336633';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();

        // Town name and distance
        const distText = Math.floor(town.dist / TILE_SIZE) + 'm';
        ctx.fillStyle = '#88cc88';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(town.name, arrowX, arrowY + 18);
        ctx.fillStyle = '#668866';
        ctx.font = '8px Arial';
        ctx.fillText(distText, arrowX, arrowY + 28);
        ctx.textAlign = 'left';
    }
}

function drawDialogue() {
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(50, canvas.height - 150, canvas.width - 100, 120);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(50, canvas.height - 150, canvas.width - 100, 120);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(game.interactTarget?.name || 'NPC', 70, canvas.height - 125);

    ctx.font = '12px Arial';
    const lines = wrapText(game.dialogueText, canvas.width - 140);
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], 70, canvas.height - 105 + i * 16);
    }

    ctx.fillStyle = '#888';
    ctx.fillText('Press E to close', canvas.width - 160, canvas.height - 40);
}

function wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine + word + ' ';
        if (ctx.measureText(testLine).width > maxWidth && currentLine !== '') {
            lines.push(currentLine);
            currentLine = word + ' ';
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);
    return lines;
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOU DIED', canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 20);
    ctx.textAlign = 'left';
}

// Input
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    if (game.state === 'gameover' && e.key.toLowerCase() === 'r') {
        initGame();
        return;
    }

    // Space - Attack (melee or bow)
    if (e.key === ' ') {
        e.preventDefault();
        if (!game.dialogueActive && game.state === 'playing') {
            const weapon = EQUIPMENT.weapons[player.equipped.weapon];
            if (weapon && weapon.type === 'bow') {
                fireBow();
            } else {
                playerAttack();
            }
        }
    }

    // Shift - Dodge roll
    if (e.shiftKey && !keys['shift_held']) {
        keys['shift_held'] = true;
        if (!game.dialogueActive && game.state === 'playing') {
            startDodge();
        }
    }

    // Q - Cast selected spell
    if (e.key.toLowerCase() === 'q') {
        if (!game.dialogueActive && game.state === 'playing') {
            castSpell();
        }
    }

    // 1-3 - Select spell
    if (e.key === '1' && player.spells.length > 0) {
        player.selectedSpell = 0;
        showMessage(`Spell: ${player.spells[0]}`);
    }
    if (e.key === '2' && player.spells.length > 1) {
        player.selectedSpell = 1;
        showMessage(`Spell: ${player.spells[1]}`);
    }
    if (e.key === '3' && player.spells.length > 2) {
        player.selectedSpell = 2;
        showMessage(`Spell: ${player.spells[2]}`);
    }

    // F - Use health potion
    if (e.key.toLowerCase() === 'f') {
        const potionIdx = player.inventory.indexOf('Health Potion');
        if (potionIdx !== -1) {
            player.inventory.splice(potionIdx, 1);
            player.hp = Math.min(player.maxHp, player.hp + 50);
            showMessage('Used Health Potion (+50 HP)');
            spawnHitParticles(player.x + 7, player.y + 7, '#ff4444', 6);
        }
    }

    // Tab - Toggle inventory (placeholder)
    if (e.key === 'Tab') {
        e.preventDefault();
        showMessage(`Inventory: ${player.inventory.join(', ') || 'Empty'}`);
    }

    // E - Interact
    if (e.key.toLowerCase() === 'e') {
        if (game.dialogueActive) {
            game.dialogueActive = false;
            // Accept quest if available
            if (game.interactTarget?.quest && !game.quests.some(q => q.id === game.interactTarget.quest.id)) {
                game.quests.push({ ...game.interactTarget.quest });
                showMessage(`Quest accepted: ${game.interactTarget.quest.name}`);
            }
        } else {
            interact();
            checkChestInteraction();
        }
    }
});

// Mouse input for blocking
document.addEventListener('mousedown', (e) => {
    if (e.button === 2) { // Right click
        keys.rightMouse = true;
    }
});

document.addEventListener('mouseup', (e) => {
    if (e.button === 2) {
        keys.rightMouse = false;
    }
});

// Prevent context menu on right-click
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    if (e.key === 'Shift') {
        keys['shift_held'] = false;
    }
});

function interact() {
    // Check NPCs
    for (const npc of npcs) {
        if (distance(player.x, player.y, npc.x, npc.y) < 30) {
            game.dialogueActive = true;
            game.dialogueText = npc.dialogue;
            game.interactTarget = npc;
            return;
        }
    }

    // Check items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (distance(player.x, player.y, item.x, item.y) < 24) {
            if (item.type === 'gold') {
                player.gold += item.amount;
                showMessage(`Picked up ${item.amount} gold`);

                // Check collect quests
                for (const quest of game.quests) {
                    if (quest.type === 'collect' && quest.item === 'gold' && quest.current < quest.count) {
                        quest.current += item.amount;
                        if (quest.current >= quest.count) {
                            showMessage(`Quest Complete: ${quest.name}! +${quest.reward} gold`);
                            player.gold += quest.reward;
                            player.xp += 30;
                            if (player.xp >= player.xpToNext) levelUp();
                        }
                    }
                }
            } else if (item.type === 'potion') {
                player.inventory.push(item.name);
                showMessage(`Picked up ${item.name}`);
            } else if (item.type === 'weapon') {
                player.inventory.push(item.name);
                player.damage = item.damage;
                showMessage(`Equipped ${item.name}!`);
            }
            items.splice(i, 1);
            return;
        }
    }
}

// Initialize
function initGame() {
    generateWorld();
    spawnEntities();
    generateChests();

    // Spawn player at start town (first town in array)
    const startTown = towns.find(t => t.isStartTown) || towns[0];
    if (startTown) {
        player.x = startTown.x * TILE_SIZE;
        player.y = startTown.y * TILE_SIZE;
    } else {
        player.x = 75 * TILE_SIZE;
        player.y = 75 * TILE_SIZE;
    }

    player.hp = player.maxHp;
    player.mp = player.maxMp;
    player.stamina = player.maxStamina;
    player.level = 1;
    player.xp = 0;
    player.gold = 50;
    player.damage = 10;
    player.blocking = false;
    player.dodging = false;
    player.dodgeCooldown = 0;
    player.spellCooldown = 0;
    projectiles = [];
    weather.timer = 0;
    weather.particles = [];

    game.state = 'playing';
    game.quests = [];
    game.dialogueActive = false;
    damageNumbers = [];

    // Show welcome message with town name
    if (startTown) {
        showMessage(`Welcome to ${startTown.name}!`);
    }
}

// Game loop
let lastTime = 0;
function gameLoop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap delta at 100ms
    lastTime = currentTime;

    if (game.state === 'playing' && !game.dialogueActive) {
        updatePlayer(dt);
        updateDodge(dt);
        updateBlock(dt);
        updateEnemies(dt);
        updateProjectiles(dt);
        updateWeather(dt);
        updateDayNight(dt);
        updateParticles();
        updateHitParticles(dt);
        game.tick++;

        // Update spell cooldown
        if (player.spellCooldown > 0) {
            player.spellCooldown -= dt;
        }

        // Update mana regeneration
        if (player.mp < player.maxMp) {
            player.mp = Math.min(player.maxMp, player.mp + 3 * dt);
        }

        // Update enemy DOT and slow effects
        for (const enemy of enemies) {
            if (enemy.burning && enemy.burnTimer > 0) {
                enemy.hp -= enemy.burning * dt;
                enemy.burnTimer -= dt;
                if (enemy.hp <= 0) {
                    killEnemy(enemy);
                }
            }
            if (enemy.slowTimer > 0) {
                enemy.slowTimer -= dt;
            }
        }
    }

    // Update combat effects (always update, even when paused for visual continuity)
    if (screenShake.duration > 0) {
        screenShake.duration -= dt;
        screenShake.intensity *= 0.9; // Decay intensity
    }
    if (damageFlash.duration > 0) {
        damageFlash.duration -= dt;
        damageFlash.intensity *= 0.85; // Decay flash
    }

    // Update enemy hit flash
    for (const enemy of enemies) {
        if (enemy.hitFlash > 0) {
            enemy.hitFlash -= dt;
        }
    }

    draw();
    drawParticles();
    drawWeather();

    // Draw day/night overlay
    const darkness = getDayNightOverlay();
    if (darkness > 0) {
        ctx.fillStyle = `rgba(0, 0, 30, ${darkness})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    requestAnimationFrame(gameLoop);
}

// Expose for testing
window.gameState = game;
window.player = player;
Object.defineProperty(window, 'enemies', { get: () => enemies });

initGame();
requestAnimationFrame(gameLoop);
