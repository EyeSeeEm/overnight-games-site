// Quasi Sector - Turn-Based Tactical Extraction Roguelike
// Inspired by Quasimorph (2023)

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const TILE = 32;
const MAP_W = 35;
const MAP_H = 30;
const VISION_RANGE = 8;
const MAX_CORRUPTION = 1000;

// Dark sci-fi color palette
const COLORS = {
    bgDark: '#0a0a12',
    floor1: '#1a1a2e',
    floor2: '#16162a',
    floor3: '#1e1e32',
    wall: '#2a2a3e',
    wallDark: '#1e1e2e',
    wallLight: '#3a3a4e',
    coverHalf: '#2d3d4d',
    coverFull: '#1d2d3d',
    door: '#4a4a6a',
    extraction: '#22aa44',
    hazardFire: '#ff4422',
    hazardToxic: '#44ff44',
    player: '#4488ff',
    playerLight: '#66aaff',
    enemy: '#ff4444',
    enemyAlert: '#ff8844',
    enemySniper: '#ffaa00',
    enemyHeavy: '#aa4444',
    corrupted: '#aa22aa',
    corruptedElite: '#ff44ff',
    bullet: '#ffff44',
    bulletEnemy: '#ff6644',
    shotgunPellet: '#ffaa44',
    blood: '#880022',
    ui: '#88aacc',
    uiDark: '#446688',
    uiBright: '#aaccee',
    corruption: '#8844aa',
    corruptionHigh: '#cc44cc',
    health: '#44aa44',
    healthLow: '#aa4444',
    ap: '#4488ff',
    xp: '#ffcc44',
    terminal: '#44ffaa'
};

// Weapons database
const WEAPONS = {
    pistol: { name: 'Pistol', damage: [15, 20], accuracy: 75, range: 6, apCost: 1, magSize: 12, ammoType: '9mm' },
    smg: { name: 'SMG', damage: [10, 15], accuracy: 60, range: 5, apCost: 1, magSize: 30, burst: 3, ammoType: '9mm' },
    rifle: { name: 'Combat Rifle', damage: [25, 35], accuracy: 70, range: 8, apCost: 1, magSize: 20, ammoType: '7.62mm' },
    shotgun: { name: 'Shotgun', damage: [30, 45], accuracy: 80, range: 3, apCost: 2, magSize: 6, pellets: 5, ammoType: '12ga' },
    sniper: { name: 'Sniper Rifle', damage: [50, 70], accuracy: 85, range: 12, apCost: 2, magSize: 5, ammoType: '.50cal' }
};

// Game state
let gameState = 'menu';
let player = null;
let enemies = [];
let bullets = [];
let particles = [];
let floatingTexts = [];
let lootContainers = [];
let hazards = [];
let terminals = [];
let grenades = [];
let map = [];
let fogOfWar = [];
let explored = [];
let corruption = 0;
let turn = 0;
let floor = 1;
let maxFloors = 3;
let cameraX = 0;
let cameraY = 0;
let hoverTile = null;
let message = '';
let messageTimer = 0;
let actionLog = [];
let animating = false;
let screenShake = 0;
let corruptionFlicker = 0;
let killCount = 0;
let itemsCollected = 0;

// Textures cache
const textures = {};

function tex(w, h, fn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    fn(c.getContext('2d'), w, h);
    return c;
}

function initTextures() {
    // Floor variants
    for (let i = 0; i < 4; i++) {
        textures[`floor${i}`] = tex(TILE, TILE, (c, w, h) => {
            const colors = ['#1a1a2e', '#16162a', '#1e1e32', '#181828'];
            c.fillStyle = colors[i];
            c.fillRect(0, 0, w, h);
            c.strokeStyle = '#222233';
            c.lineWidth = 1;
            c.strokeRect(0.5, 0.5, w - 1, h - 1);
            // Panel rivets
            c.fillStyle = '#252538';
            [[4,4], [w-6,4], [4,h-6], [w-6,h-6]].forEach(([x,y]) => {
                c.beginPath();
                c.arc(x, y, 2, 0, Math.PI * 2);
                c.fill();
            });
            // Random scuff marks
            if (Math.random() > 0.7) {
                c.strokeStyle = '#151525';
                c.beginPath();
                c.moveTo(Math.random() * w, Math.random() * h);
                c.lineTo(Math.random() * w, Math.random() * h);
                c.stroke();
            }
        });
    }

    // Wall
    textures.wall = tex(TILE, TILE, (c, w, h) => {
        c.fillStyle = COLORS.wall;
        c.fillRect(0, 0, w, h);
        c.fillStyle = COLORS.wallLight;
        c.fillRect(0, 0, w, 3);
        c.fillRect(0, 0, 3, h);
        c.fillStyle = COLORS.wallDark;
        c.fillRect(w - 3, 0, 3, h);
        c.fillRect(0, h - 3, w, 3);
        // Pipes
        c.fillStyle = '#353545';
        c.fillRect(8, 6, 4, h - 12);
        c.fillRect(w - 12, 6, 4, h - 12);
    });

    // Cover (half and full)
    textures.coverHalf = tex(TILE, TILE, (c, w, h) => {
        c.fillStyle = COLORS.coverHalf;
        c.fillRect(4, 10, w - 8, h - 14);
        c.fillStyle = '#3d4d5d';
        c.fillRect(4, 10, w - 8, 4);
        c.strokeStyle = '#1d2d3d';
        c.lineWidth = 2;
        c.strokeRect(5, 11, w - 10, h - 16);
        c.fillStyle = '#5d6d7d';
        c.fillRect(12, 18, 8, 3);
    });

    textures.coverFull = tex(TILE, TILE, (c, w, h) => {
        c.fillStyle = COLORS.coverFull;
        c.fillRect(4, 2, w - 8, h - 4);
        c.fillStyle = '#2d3d4d';
        c.fillRect(4, 2, w - 8, 4);
        c.fillStyle = '#0d1d2d';
        c.fillRect(4, h - 6, w - 8, 4);
        // Warning stripes
        c.fillStyle = '#4a4a2a';
        for (let i = 0; i < 3; i++) {
            c.fillRect(8 + i * 8, h - 12, 4, 4);
        }
    });

    // Door
    textures.doorClosed = tex(TILE, TILE, (c, w, h) => {
        c.fillStyle = COLORS.floor1;
        c.fillRect(0, 0, w, h);
        c.fillStyle = COLORS.door;
        c.fillRect(4, 8, w - 8, h - 16);
        c.fillStyle = '#5a5a7a';
        c.fillRect(4, 8, w - 8, 3);
        c.fillStyle = '#44aa44';
        c.fillRect(w - 10, 14, 4, 4);
    });

    textures.doorOpen = tex(TILE, TILE, (c, w, h) => {
        c.fillStyle = COLORS.floor1;
        c.fillRect(0, 0, w, h);
        c.fillStyle = '#2a2a3a';
        c.fillRect(0, 10, 6, h - 20);
        c.fillRect(w - 6, 10, 6, h - 20);
    });

    // Extraction zone
    textures.extraction = tex(TILE, TILE, (c, w, h) => {
        c.fillStyle = COLORS.floor1;
        c.fillRect(0, 0, w, h);
        c.strokeStyle = COLORS.extraction;
        c.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            c.beginPath();
            c.moveTo(8 + i * 4, h - 8);
            c.lineTo(w/2, 8 + i * 4);
            c.lineTo(w - 8 - i * 4, h - 8);
            c.stroke();
        }
        c.fillStyle = COLORS.extraction;
        c.font = 'bold 8px Arial';
        c.textAlign = 'center';
        c.fillText('EXIT', w/2, h - 4);
    });

    // Hazards
    textures.hazardFire = tex(TILE, TILE, (c, w, h) => {
        c.fillStyle = '#1a1010';
        c.fillRect(0, 0, w, h);
        for (let i = 0; i < 5; i++) {
            c.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, 0.8)`;
            c.beginPath();
            c.moveTo(w/2 + (Math.random() - 0.5) * 20, h);
            c.lineTo(w/2 + (Math.random() - 0.5) * 10, h/2 + Math.random() * 10);
            c.lineTo(w/2 + (Math.random() - 0.5) * 20, h);
            c.fill();
        }
    });

    textures.hazardToxic = tex(TILE, TILE, (c, w, h) => {
        c.fillStyle = '#101a10';
        c.fillRect(0, 0, w, h);
        c.fillStyle = 'rgba(68, 255, 68, 0.3)';
        c.beginPath();
        c.arc(w/2, h/2, 12, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#44ff44';
        c.font = 'bold 12px Arial';
        c.textAlign = 'center';
        c.fillText('!', w/2, h/2 + 4);
    });

    // Terminal
    textures.terminal = tex(TILE, TILE, (c, w, h) => {
        c.fillStyle = COLORS.floor1;
        c.fillRect(0, 0, w, h);
        c.fillStyle = '#2a3a3a';
        c.fillRect(8, 6, w - 16, h - 12);
        c.fillStyle = '#0a2020';
        c.fillRect(10, 8, w - 20, h - 18);
        c.fillStyle = COLORS.terminal;
        c.font = '8px monospace';
        c.fillText('>', 14, 18);
        c.fillText('_', 22, 18);
    });

    // Loot container
    textures.loot = tex(TILE, TILE, (c, w, h) => {
        c.fillStyle = '#4a4a3a';
        c.fillRect(6, 10, w - 12, h - 14);
        c.fillStyle = '#5a5a4a';
        c.fillRect(6, 10, w - 12, 4);
        c.fillStyle = '#ffaa22';
        c.fillRect(13, 16, 6, 6);
    });

    // Player
    textures.player = tex(TILE, TILE, (c, w, h) => {
        // Shadow
        c.fillStyle = 'rgba(0,0,0,0.3)';
        c.beginPath();
        c.ellipse(w/2 + 2, h/2 + 4, 10, 6, 0, 0, Math.PI * 2);
        c.fill();
        // Body
        c.fillStyle = COLORS.player;
        c.beginPath();
        c.arc(w/2, h/2, 11, 0, Math.PI * 2);
        c.fill();
        // Armor plates
        c.fillStyle = '#3366cc';
        c.fillRect(10, 8, 12, 8);
        c.fillRect(11, 18, 10, 6);
        // Visor
        c.fillStyle = COLORS.playerLight;
        c.fillRect(11, 12, 10, 4);
    });

    // Enemy types
    ['enemy', 'enemyAlert', 'enemySniper', 'enemyHeavy'].forEach((type, idx) => {
        textures[type] = tex(TILE, TILE, (c, w, h) => {
            const colors = [COLORS.enemy, COLORS.enemyAlert, COLORS.enemySniper, COLORS.enemyHeavy];
            c.fillStyle = 'rgba(0,0,0,0.3)';
            c.beginPath();
            c.ellipse(w/2 + 2, h/2 + 4, 10, 6, 0, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = colors[idx];
            c.beginPath();
            c.arc(w/2, h/2, idx === 3 ? 13 : 10, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#aa0000';
            c.fillRect(11, 12, 10, 5);
            if (idx === 1) {
                c.fillStyle = '#ff0000';
                c.font = 'bold 14px Arial';
                c.fillText('!', w/2 - 3, 10);
            }
        });
    });

    // Corrupted
    textures.corrupted = tex(TILE, TILE, (c, w, h) => {
        c.fillStyle = COLORS.corrupted;
        c.beginPath();
        c.arc(w/2, h/2, 12, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#cc44cc';
        c.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + Date.now() / 500;
            c.beginPath();
            c.moveTo(w/2 + Math.cos(angle) * 10, h/2 + Math.sin(angle) * 10);
            c.lineTo(w/2 + Math.cos(angle) * 16, h/2 + Math.sin(angle) * 16);
            c.stroke();
        }
    });

    textures.corruptedElite = tex(TILE, TILE, (c, w, h) => {
        c.fillStyle = COLORS.corruptedElite;
        c.beginPath();
        c.arc(w/2, h/2, 14, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#ff88ff';
        c.beginPath();
        c.arc(w/2 - 4, h/2 - 2, 3, 0, Math.PI * 2);
        c.arc(w/2 + 4, h/2 - 2, 3, 0, Math.PI * 2);
        c.fill();
    });
}

// Tile types
const TileType = {
    FLOOR: 0, WALL: 1, COVER_HALF: 2, COVER_FULL: 3,
    DOOR_CLOSED: 4, DOOR_OPEN: 5, EXTRACTION: 6, LOOT: 7,
    HAZARD_FIRE: 8, HAZARD_TOXIC: 9, TERMINAL: 10
};

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hp = 100;
        this.maxHp = 100;
        this.ap = 2;
        this.maxAp = 2;
        this.stance = 'walk';
        this.xp = 0;
        this.level = 1;
        this.armor = 10;
        this.weapons = [
            { ...WEAPONS.rifle, ammo: 20 },
            { ...WEAPONS.pistol, ammo: 12 }
        ];
        this.currentWeapon = 0;
        this.inventory = {
            bandages: 2,
            medkits: 1,
            stimpacks: 1,
            grenades: 2,
            ammo: { '9mm': 30, '7.62mm': 40, '12ga': 12, '.50cal': 10 }
        };
        this.wounds = { head: 0, torso: 0, leftArm: 0, rightArm: 0, leftLeg: 0, rightLeg: 0 };
        this.bleeding = 0;
    }

    getWeapon() { return this.weapons[this.currentWeapon]; }

    getMaxAp() {
        let base = this.stance === 'sneak' ? 1 : this.stance === 'walk' ? 2 : 3;
        if (this.wounds.torso >= 2) base--;
        return Math.max(1, base);
    }

    takeDamage(amount, bodyPart = null) {
        const reduced = Math.max(1, amount - this.armor * 0.3);
        this.hp -= Math.floor(reduced);
        screenShake = 10;

        if (bodyPart && Math.random() < 0.25) {
            this.wounds[bodyPart] = Math.min(3, this.wounds[bodyPart] + 1);
            if (this.wounds[bodyPart] >= 2) this.bleeding += this.wounds[bodyPart];
            addFloatingText(this.x * TILE + TILE/2, this.y * TILE, `${bodyPart} wounded!`, '#ff4444');
        }

        // Blood particles
        for (let i = 0; i < 8; i++) {
            particles.push({
                x: this.x * TILE + TILE/2,
                y: this.y * TILE + TILE/2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                color: COLORS.blood,
                size: 3 + Math.random() * 3
            });
        }

        if (this.hp <= 0) gameState = 'dead';
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        addFloatingText(this.x * TILE + TILE/2, this.y * TILE, `+${amount} HP`, COLORS.health);
    }

    gainXP(amount) {
        this.xp += amount;
        const xpNeeded = this.level * 100;
        if (this.xp >= xpNeeded) {
            this.xp -= xpNeeded;
            this.level++;
            this.maxHp += 10;
            this.hp = Math.min(this.hp + 10, this.maxHp);
            this.armor += 2;
            addLog(`Level up! Now level ${this.level}`);
            addFloatingText(this.x * TILE + TILE/2, this.y * TILE - 20, 'LEVEL UP!', COLORS.xp);
        }
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type = 'guard') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.alerted = false;
        this.lastKnownPlayerPos = null;
        this.corrupted = type.includes('corrupted');
        this.patrolDir = Math.floor(Math.random() * 4);
        this.stunned = 0;

        const stats = {
            guard: { hp: 50, damage: [10, 15], accuracy: 55, range: 6, xp: 20 },
            soldier: { hp: 75, damage: [12, 18], accuracy: 65, range: 6, xp: 30 },
            heavy: { hp: 120, damage: [20, 30], accuracy: 50, range: 4, xp: 50 },
            sniper: { hp: 40, damage: [30, 45], accuracy: 80, range: 10, xp: 40 },
            corrupted: { hp: 80, damage: [15, 25], accuracy: 70, range: 1, xp: 35 },
            corruptedElite: { hp: 150, damage: [25, 40], accuracy: 75, range: 2, xp: 75 }
        };

        const s = stats[type] || stats.guard;
        Object.assign(this, s);
        this.maxHp = this.hp;
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.alerted = true;

        // Blood particles
        for (let i = 0; i < 6; i++) {
            particles.push({
                x: this.x * TILE + TILE/2,
                y: this.y * TILE + TILE/2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 25,
                color: this.corrupted ? '#aa22aa' : COLORS.blood,
                size: 2 + Math.random() * 3
            });
        }

        addFloatingText(this.x * TILE + TILE/2, this.y * TILE, `-${amount}`, '#ff4444');
        return this.hp <= 0;
    }
}

// Helper functions
function addFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 60, vy: -1 });
}

function addLog(msg) {
    actionLog.unshift({ msg, turn });
    if (actionLog.length > 8) actionLog.pop();
}

function showMessage(msg) {
    message = msg;
    messageTimer = 180;
    addLog(msg);
}

// Map generation
function generateMap() {
    map = Array(MAP_H).fill(null).map(() => Array(MAP_W).fill(TileType.WALL));
    fogOfWar = Array(MAP_H).fill(null).map(() => Array(MAP_W).fill(true));
    explored = Array(MAP_H).fill(null).map(() => Array(MAP_W).fill(false));

    const rooms = [];
    const roomCount = 8 + Math.floor(Math.random() * 5);

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
                    map[ry][rx] = TileType.FLOOR;
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

        if (Math.random() > 0.5) {
            carveCorridorH(x1, x2, y1);
            carveCorridorV(y1, y2, x2);
        } else {
            carveCorridorV(y1, y2, x1);
            carveCorridorH(x1, x2, y2);
        }
    }

    // Add room features
    rooms.forEach((room, idx) => {
        // Cover
        const coverCount = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < coverCount; i++) {
            const cx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const cy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
            if (map[cy][cx] === TileType.FLOOR) {
                map[cy][cx] = Math.random() > 0.6 ? TileType.COVER_FULL : TileType.COVER_HALF;
            }
        }

        // Hazards (not in first room)
        if (idx > 0 && Math.random() < 0.3) {
            const hx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const hy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
            if (map[hy][hx] === TileType.FLOOR) {
                hazards.push({ x: hx, y: hy, type: Math.random() > 0.5 ? 'fire' : 'toxic' });
            }
        }

        // Terminal
        if (idx > 0 && idx < rooms.length - 1 && Math.random() < 0.25) {
            const tx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const ty = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
            if (map[ty][tx] === TileType.FLOOR) {
                terminals.push({ x: tx, y: ty, hacked: false });
            }
        }
    });

    // Add doors
    for (let y = 1; y < MAP_H - 1; y++) {
        for (let x = 1; x < MAP_W - 1; x++) {
            if (map[y][x] === TileType.FLOOR) {
                const wallsV = (map[y-1][x] === TileType.WALL ? 1 : 0) + (map[y+1][x] === TileType.WALL ? 1 : 0);
                const wallsH = (map[y][x-1] === TileType.WALL ? 1 : 0) + (map[y][x+1] === TileType.WALL ? 1 : 0);
                if ((wallsV === 2 && wallsH === 0) || (wallsH === 2 && wallsV === 0)) {
                    if (Math.random() < 0.25) map[y][x] = TileType.DOOR_CLOSED;
                }
            }
        }
    }

    // Place player
    const startRoom = rooms[0];
    player = new Player(
        Math.floor(startRoom.x + startRoom.w / 2),
        Math.floor(startRoom.y + startRoom.h / 2)
    );

    // Place extraction
    const endRoom = rooms[rooms.length - 1];
    const extX = Math.floor(endRoom.x + endRoom.w / 2);
    const extY = Math.floor(endRoom.y + endRoom.h / 2);
    map[extY][extX] = TileType.EXTRACTION;

    // Spawn enemies
    enemies = [];
    for (let i = 1; i < rooms.length - 1; i++) {
        const room = rooms[i];
        const enemyCount = 1 + Math.floor(Math.random() * 3);
        for (let j = 0; j < enemyCount; j++) {
            const ex = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const ey = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
            if (map[ey][ex] === TileType.FLOOR && !hazards.some(h => h.x === ex && h.y === ey)) {
                const types = ['guard', 'guard', 'soldier', 'soldier', 'heavy', 'sniper'];
                const type = floor >= 2 && Math.random() < 0.2 ? 'corrupted' :
                            types[Math.floor(Math.random() * types.length)];
                enemies.push(new Enemy(ex, ey, type));
            }
        }
    }

    // Spawn loot
    lootContainers = [];
    for (const room of rooms) {
        if (Math.random() < 0.6) {
            const lx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const ly = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
            if (map[ly][lx] === TileType.FLOOR) {
                lootContainers.push({ x: lx, y: ly, looted: false });
            }
        }
    }

    corruption = 50 * (floor - 1);
    turn = 0;
}

function carveCorridorH(x1, x2, y) {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        if (y > 0 && y < MAP_H - 1 && x > 0 && x < MAP_W - 1) {
            if (map[y][x] === TileType.WALL) map[y][x] = TileType.FLOOR;
        }
    }
}

function carveCorridorV(y1, y2, x) {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        if (y > 0 && y < MAP_H - 1 && x > 0 && x < MAP_W - 1) {
            if (map[y][x] === TileType.WALL) map[y][x] = TileType.FLOOR;
        }
    }
}

// Line of sight
function hasLineOfSight(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
    let err = dx - dy, x = x1, y = y1;

    while (x !== x2 || y !== y2) {
        if (x !== x1 || y !== y1) {
            const tile = map[y]?.[x];
            if (tile === TileType.WALL || tile === TileType.COVER_FULL || tile === TileType.DOOR_CLOSED) {
                return false;
            }
        }
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
    }
    return true;
}

function updateFogOfWar() {
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            fogOfWar[y][x] = true;
        }
    }

    for (let dy = -VISION_RANGE; dy <= VISION_RANGE; dy++) {
        for (let dx = -VISION_RANGE; dx <= VISION_RANGE; dx++) {
            const x = player.x + dx, y = player.y + dy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= VISION_RANGE && x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) {
                if (hasLineOfSight(player.x, player.y, x, y)) {
                    fogOfWar[y][x] = false;
                    explored[y][x] = true;
                }
            }
        }
    }
}

// Cover calculation
function getCoverBonus(defX, defY, atkX, atkY) {
    const dx = Math.sign(atkX - defX), dy = Math.sign(atkY - defY);
    const checks = [
        { x: defX + dx, y: defY },
        { x: defX, y: defY + dy },
        { x: defX + dx, y: defY + dy }
    ];
    let best = 0;
    for (const tile of checks) {
        if (tile.x >= 0 && tile.x < MAP_W && tile.y >= 0 && tile.y < MAP_H) {
            const t = map[tile.y][tile.x];
            if (t === TileType.COVER_FULL || t === TileType.WALL) best = Math.max(best, 2);
            else if (t === TileType.COVER_HALF) best = Math.max(best, 1);
        }
    }
    return best;
}

function calculateHitChance(attacker, target, weapon, distance) {
    let accuracy = weapon.accuracy;
    if (distance > weapon.range) accuracy -= (distance - weapon.range) * 12;
    const cover = getCoverBonus(target.x, target.y, attacker.x, attacker.y);
    accuracy -= cover * 20;
    if (attacker.wounds) {
        accuracy -= (attacker.wounds.leftArm + attacker.wounds.rightArm) * 8;
    }
    return Math.max(5, Math.min(95, accuracy));
}

// Combat
function playerShoot(targetX, targetY) {
    const weapon = player.getWeapon();
    if (player.ap < weapon.apCost) { showMessage('Not enough AP!'); return; }
    if (weapon.ammo <= 0) { showMessage('Out of ammo! Press R to reload.'); return; }

    const dist = Math.sqrt(Math.pow(targetX - player.x, 2) + Math.pow(targetY - player.y, 2));
    if (dist > weapon.range + 3) { showMessage('Target out of range!'); return; }

    const enemy = enemies.find(e => e.x === targetX && e.y === targetY);
    if (!enemy) { showMessage('No target!'); return; }
    if (!hasLineOfSight(player.x, player.y, targetX, targetY)) { showMessage('No line of sight!'); return; }

    player.ap -= weapon.apCost;
    weapon.ammo--;
    corruption += 2;

    // Muzzle flash
    particles.push({
        x: player.x * TILE + TILE/2,
        y: player.y * TILE + TILE/2,
        vx: 0, vy: 0,
        life: 5,
        color: '#ffff88',
        size: 12
    });

    const hitChance = calculateHitChance(player, enemy, weapon, dist);
    const shots = weapon.burst || (weapon.pellets || 1);
    let totalDamage = 0;
    let hits = 0;

    for (let i = 0; i < shots; i++) {
        const roll = Math.random() * 100;
        const tx = targetX * TILE + TILE/2 + (Math.random() - 0.5) * 10;
        const ty = targetY * TILE + TILE/2 + (Math.random() - 0.5) * 10;

        bullets.push({
            x: player.x * TILE + TILE/2,
            y: player.y * TILE + TILE/2,
            targetX: tx, targetY: ty,
            progress: 0,
            color: weapon.pellets ? COLORS.shotgunPellet : COLORS.bullet
        });

        if (roll < hitChance) {
            const dmg = weapon.damage[0] + Math.floor(Math.random() * (weapon.damage[1] - weapon.damage[0]));
            totalDamage += dmg;
            hits++;
        }
    }

    setTimeout(() => {
        if (totalDamage > 0) {
            if (enemy.takeDamage(totalDamage)) {
                showMessage(`Enemy killed! +${enemy.xp} XP`);
                player.gainXP(enemy.xp);
                enemies = enemies.filter(e => e !== enemy);
                corruption += 5;
                killCount++;
            } else {
                showMessage(`${hits}/${shots} hits for ${totalDamage} damage!`);
            }
        } else {
            showMessage(`Missed! (${Math.floor(hitChance)}% hit chance)`);
        }
    }, 100);

    // Alert nearby enemies
    enemies.forEach(e => {
        const alertDist = Math.sqrt(Math.pow(e.x - player.x, 2) + Math.pow(e.y - player.y, 2));
        if (alertDist < 12) {
            e.alerted = true;
            e.lastKnownPlayerPos = { x: player.x, y: player.y };
        }
    });
}

function playerReload() {
    const weapon = player.getWeapon();
    if (weapon.ammo === weapon.magSize) { showMessage('Already full!'); return; }
    if (player.ap < 1) { showMessage('Not enough AP!'); return; }

    const ammoNeeded = weapon.magSize - weapon.ammo;
    const ammoHave = player.inventory.ammo[weapon.ammoType] || 0;
    const ammoToUse = Math.min(ammoNeeded, ammoHave);

    if (ammoToUse === 0) { showMessage(`No ${weapon.ammoType} ammo!`); return; }

    player.ap--;
    weapon.ammo += ammoToUse;
    player.inventory.ammo[weapon.ammoType] -= ammoToUse;
    showMessage(`Reloaded ${ammoToUse} rounds`);
}

function playerHeal() {
    if (player.inventory.medkits <= 0 && player.inventory.bandages <= 0) {
        showMessage('No healing items!'); return;
    }
    if (player.ap < 1) { showMessage('Not enough AP!'); return; }
    if (player.hp === player.maxHp && player.bleeding === 0) {
        showMessage('Already healthy!'); return;
    }

    player.ap--;
    if (player.inventory.medkits > 0) {
        player.inventory.medkits--;
        player.heal(40);
        player.bleeding = 0;
        showMessage('Used medkit! +40 HP, bleeding stopped');
    } else {
        player.inventory.bandages--;
        player.heal(15);
        player.bleeding = Math.max(0, player.bleeding - 2);
        showMessage('Used bandage! +15 HP');
    }
}

function useStimpack() {
    if (player.inventory.stimpacks <= 0) { showMessage('No stimpacks!'); return; }
    player.inventory.stimpacks--;
    player.ap += 2;
    addFloatingText(player.x * TILE + TILE/2, player.y * TILE, '+2 AP', COLORS.ap);
    showMessage('Stimpack used! +2 AP');
}

function throwGrenade(targetX, targetY) {
    if (player.inventory.grenades <= 0) { showMessage('No grenades!'); return; }
    if (player.ap < 1) { showMessage('Not enough AP!'); return; }

    const dist = Math.sqrt(Math.pow(targetX - player.x, 2) + Math.pow(targetY - player.y, 2));
    if (dist > 8) { showMessage('Target too far!'); return; }

    player.ap--;
    player.inventory.grenades--;
    corruption += 5;

    grenades.push({
        x: player.x * TILE + TILE/2,
        y: player.y * TILE + TILE/2,
        targetX: targetX * TILE + TILE/2,
        targetY: targetY * TILE + TILE/2,
        progress: 0
    });

    setTimeout(() => {
        // Explosion
        for (let i = 0; i < 20; i++) {
            particles.push({
                x: targetX * TILE + TILE/2,
                y: targetY * TILE + TILE/2,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                life: 30 + Math.random() * 20,
                color: Math.random() > 0.5 ? '#ff8844' : '#ffcc44',
                size: 4 + Math.random() * 6
            });
        }
        screenShake = 15;

        // Damage enemies in radius
        let kills = 0;
        enemies.forEach(e => {
            const eDist = Math.sqrt(Math.pow(e.x - targetX, 2) + Math.pow(e.y - targetY, 2));
            if (eDist <= 2) {
                const damage = Math.floor(50 - eDist * 15);
                if (e.takeDamage(damage)) {
                    player.gainXP(e.xp);
                    kills++;
                    killCount++;
                }
                e.alerted = true;
            }
        });
        enemies = enemies.filter(e => e.hp > 0);
        showMessage(`Grenade exploded! ${kills} kills`);
    }, 400);
}

function hackTerminal() {
    const terminal = terminals.find(t => t.x === player.x && t.y === player.y && !t.hacked);
    if (!terminal) { showMessage('No terminal here!'); return; }
    if (player.ap < 1) { showMessage('Not enough AP!'); return; }

    player.ap--;
    terminal.hacked = true;

    const reward = Math.random();
    if (reward < 0.4) {
        player.inventory.ammo['7.62mm'] += 20;
        showMessage('Terminal hacked: +20 rifle ammo!');
    } else if (reward < 0.7) {
        player.inventory.medkits++;
        showMessage('Terminal hacked: +1 medkit!');
    } else {
        corruption = Math.max(0, corruption - 50);
        showMessage('Terminal hacked: -50 corruption!');
    }
    addFloatingText(player.x * TILE + TILE/2, player.y * TILE, 'HACKED', COLORS.terminal);
}

// Enemy AI
function enemyTurn() {
    animating = true;

    enemies.forEach(enemy => {
        if (enemy.stunned > 0) { enemy.stunned--; return; }

        const dist = Math.sqrt(Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2));
        const canSee = dist <= VISION_RANGE && hasLineOfSight(enemy.x, enemy.y, player.x, player.y);

        if (canSee) {
            enemy.alerted = true;
            enemy.lastKnownPlayerPos = { x: player.x, y: player.y };
        }

        if (enemy.alerted) {
            if (canSee && dist <= enemy.range) {
                // Attack
                const hitChance = enemy.accuracy - getCoverBonus(player.x, player.y, enemy.x, enemy.y) * 15;
                if (Math.random() * 100 < hitChance) {
                    const damage = enemy.damage[0] + Math.floor(Math.random() * (enemy.damage[1] - enemy.damage[0]));
                    const bodyParts = ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
                    player.takeDamage(damage, bodyParts[Math.floor(Math.random() * bodyParts.length)]);

                    bullets.push({
                        x: enemy.x * TILE + TILE/2,
                        y: enemy.y * TILE + TILE/2,
                        targetX: player.x * TILE + TILE/2,
                        targetY: player.y * TILE + TILE/2,
                        progress: 0,
                        color: COLORS.bulletEnemy
                    });

                    showMessage(`${enemy.type} hit you for ${damage}!`);
                    corruption += 3;
                }
            } else if (enemy.lastKnownPlayerPos) {
                // Move toward player
                const dx = Math.sign(enemy.lastKnownPlayerPos.x - enemy.x);
                const dy = Math.sign(enemy.lastKnownPlayerPos.y - enemy.y);
                const moves = [[dx, 0], [0, dy], [dx, dy]].filter(([mx, my]) => {
                    const nx = enemy.x + mx, ny = enemy.y + my;
                    return canMove(nx, ny) && !enemies.some(e => e !== enemy && e.x === nx && e.y === ny);
                });
                if (moves.length > 0) {
                    const [mx, my] = moves[0];
                    enemy.x += mx;
                    enemy.y += my;
                }
            }
        } else {
            // Patrol
            if (Math.random() < 0.4) {
                const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
                if (Math.random() < 0.2) enemy.patrolDir = Math.floor(Math.random() * 4);
                const [dx, dy] = dirs[enemy.patrolDir];
                const nx = enemy.x + dx, ny = enemy.y + dy;
                if (canMove(nx, ny) && !enemies.some(e => e !== enemy && e.x === nx && e.y === ny)) {
                    enemy.x = nx;
                    enemy.y = ny;
                }
            }
        }
    });

    // Corruption transformations
    if (corruption >= 400) {
        const transformChance = (corruption - 300) / 2000;
        enemies.forEach(e => {
            if (!e.corrupted && e.alerted && Math.random() < transformChance) {
                e.corrupted = true;
                e.type = corruption >= 700 ? 'corruptedElite' : 'corrupted';
                e.hp = e.type === 'corruptedElite' ? 150 : 80;
                e.maxHp = e.hp;
                e.damage = e.type === 'corruptedElite' ? [25, 40] : [15, 25];
                e.accuracy = 70;
                e.range = e.type === 'corruptedElite' ? 2 : 1;
                e.xp = e.type === 'corruptedElite' ? 75 : 35;

                for (let i = 0; i < 15; i++) {
                    particles.push({
                        x: e.x * TILE + TILE/2,
                        y: e.y * TILE + TILE/2,
                        vx: (Math.random() - 0.5) * 10,
                        vy: (Math.random() - 0.5) * 10,
                        life: 40,
                        color: '#aa22aa',
                        size: 3 + Math.random() * 4
                    });
                }
                showMessage('An enemy has been corrupted!');
            }
        });
    }

    setTimeout(() => { animating = false; }, 300);
}

function canMove(x, y) {
    if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return false;
    const tile = map[y][x];
    return tile === TileType.FLOOR || tile === TileType.DOOR_OPEN || tile === TileType.EXTRACTION;
}

function playerMove(dx, dy) {
    if (player.ap <= 0) { showMessage('No AP! Press SPACE to end turn.'); return; }

    const newX = player.x + dx, newY = player.y + dy;

    if (canMove(newX, newY) || map[newY]?.[newX] === TileType.DOOR_CLOSED) {
        if (map[newY][newX] === TileType.DOOR_CLOSED) {
            map[newY][newX] = TileType.DOOR_OPEN;
            updateFogOfWar();
            showMessage('Door opened');
            return;
        }

        player.x = newX;
        player.y = newY;
        player.ap--;
        updateFogOfWar();

        // Check hazards
        const hazard = hazards.find(h => h.x === newX && h.y === newY);
        if (hazard) {
            const damage = hazard.type === 'fire' ? 15 : 10;
            player.takeDamage(damage);
            showMessage(`${hazard.type === 'fire' ? 'Burned' : 'Poisoned'}! -${damage} HP`);
        }

        // Check extraction
        if (map[newY][newX] === TileType.EXTRACTION) {
            if (floor < maxFloors) {
                floor++;
                hazards = [];
                terminals = [];
                grenades = [];
                generateMap();
                updateFogOfWar();
                showMessage(`Floor ${floor}/${maxFloors} - Deeper into the station...`);
            } else {
                gameState = 'win';
            }
        }

        // Check loot
        const loot = lootContainers.find(l => l.x === newX && l.y === newY && !l.looted);
        if (loot) showMessage('Press E to loot');

        // Check terminal
        const terminal = terminals.find(t => t.x === newX && t.y === newY && !t.hacked);
        if (terminal) showMessage('Press T to hack terminal');
    }
}

function lootContainer() {
    const loot = lootContainers.find(l => l.x === player.x && l.y === player.y && !l.looted);
    if (!loot) return;

    loot.looted = true;
    itemsCollected++;

    const roll = Math.random();
    if (roll < 0.25) {
        player.inventory.bandages++;
        showMessage('Found bandage!');
    } else if (roll < 0.45) {
        const ammo = Object.keys(player.inventory.ammo)[Math.floor(Math.random() * 4)];
        player.inventory.ammo[ammo] += 15;
        showMessage(`Found ${ammo} ammo!`);
    } else if (roll < 0.6) {
        player.inventory.medkits++;
        showMessage('Found medkit!');
    } else if (roll < 0.75) {
        player.inventory.grenades++;
        showMessage('Found grenade!');
    } else if (roll < 0.85) {
        player.inventory.stimpacks++;
        showMessage('Found stimpack!');
    } else {
        // New weapon
        const weaponKeys = Object.keys(WEAPONS);
        const newWeapon = { ...WEAPONS[weaponKeys[Math.floor(Math.random() * weaponKeys.length)]] };
        newWeapon.ammo = newWeapon.magSize;
        if (player.weapons.length < 3) {
            player.weapons.push(newWeapon);
        } else {
            player.weapons[player.currentWeapon] = newWeapon;
        }
        showMessage(`Found ${newWeapon.name}!`);
    }

    addFloatingText(player.x * TILE + TILE/2, player.y * TILE, 'LOOT!', COLORS.xp);
}

function endTurn() {
    if (animating) return;

    turn++;
    corruption += 1 + Math.floor(turn / 20);

    if (player.bleeding > 0) {
        player.hp -= player.bleeding;
        addFloatingText(player.x * TILE + TILE/2, player.y * TILE, `-${player.bleeding}`, COLORS.healthLow);
        if (player.hp <= 0) { gameState = 'dead'; return; }
    }

    player.ap = player.getMaxAp();
    enemyTurn();

    if (corruption >= 600) corruptionFlicker = Math.random() * 0.3;
}

// Input handling
const keys = {};
let mouseX = 0, mouseY = 0;

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    const worldX = (mouseX + cameraX) / TILE;
    const worldY = (mouseY + cameraY) / TILE;
    hoverTile = { x: Math.floor(worldX), y: Math.floor(worldY) };
});

canvas.addEventListener('mousedown', e => {
    if (gameState === 'menu') {
        gameState = 'playing';
        generateMap();
        updateFogOfWar();
        return;
    }

    if (gameState === 'dead' || gameState === 'win') {
        gameState = 'menu';
        floor = 1;
        killCount = 0;
        itemsCollected = 0;
        return;
    }

    if (gameState === 'playing' && hoverTile && !animating) {
        if (e.button === 2) {
            // Right click: throw grenade
            throwGrenade(hoverTile.x, hoverTile.y);
        } else {
            // Left click: shoot enemy
            const enemy = enemies.find(en => en.x === hoverTile.x && en.y === hoverTile.y);
            if (enemy && !fogOfWar[hoverTile.y]?.[hoverTile.x]) {
                playerShoot(hoverTile.x, hoverTile.y);
            }
        }
    }
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;

    if (gameState === 'menu' && e.key === ' ') {
        gameState = 'playing';
        generateMap();
        updateFogOfWar();
        return;
    }

    if ((gameState === 'dead' || gameState === 'win') && e.key === ' ') {
        gameState = 'menu';
        floor = 1;
        killCount = 0;
        itemsCollected = 0;
        return;
    }

    if (gameState === 'playing' && !animating) {
        if (e.key === 'w' || e.key === 'ArrowUp') playerMove(0, -1);
        if (e.key === 's' || e.key === 'ArrowDown') playerMove(0, 1);
        if (e.key === 'a' || e.key === 'ArrowLeft') playerMove(-1, 0);
        if (e.key === 'd' || e.key === 'ArrowRight') playerMove(1, 0);
        if (e.key === ' ') endTurn();
        if (e.key === 'r') playerReload();
        if (e.key === 'e') lootContainer();
        if (e.key === 'h') playerHeal();
        if (e.key === 'q') useStimpack();
        if (e.key === 't') hackTerminal();
        if (e.key === '1') player.stance = 'sneak';
        if (e.key === '2') player.stance = 'walk';
        if (e.key === '3') player.stance = 'run';
        if (e.key === 'Tab') {
            e.preventDefault();
            player.currentWeapon = (player.currentWeapon + 1) % player.weapons.length;
            showMessage(`Switched to ${player.getWeapon().name}`);
        }
    }
});

document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// Rendering
function render() {
    // Screen shake
    let shakeX = 0, shakeY = 0;
    if (screenShake > 0) {
        shakeX = (Math.random() - 0.5) * screenShake;
        shakeY = (Math.random() - 0.5) * screenShake;
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }

    ctx.fillStyle = COLORS.bgDark;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'menu') renderMenu();
    else if (gameState === 'playing') renderGame(shakeX, shakeY);
    else if (gameState === 'dead') renderDead();
    else if (gameState === 'win') renderWin();
}

function renderMenu() {
    ctx.fillStyle = COLORS.corruption;
    ctx.font = 'bold 52px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('QUASI SECTOR', canvas.width / 2, 180);

    ctx.fillStyle = COLORS.ui;
    ctx.font = '18px Courier New';
    ctx.fillText('Turn-Based Tactical Extraction Roguelike', canvas.width / 2, 220);

    ctx.fillStyle = COLORS.uiBright;
    ctx.font = '22px Courier New';
    ctx.fillText('Press SPACE to Deploy', canvas.width / 2, 340);

    ctx.fillStyle = COLORS.uiDark;
    ctx.font = '13px Courier New';
    const controls = [
        'WASD - Move  |  Click Enemy - Shoot  |  Right Click - Grenade',
        'SPACE - End Turn  |  R - Reload  |  E - Loot  |  H - Heal',
        'Q - Stimpack  |  T - Hack Terminal  |  TAB - Switch Weapon',
        '1/2/3 - Stance (Sneak/Walk/Run)'
    ];
    controls.forEach((line, i) => ctx.fillText(line, canvas.width / 2, 440 + i * 22));
}

function renderGame(shakeX, shakeY) {
    const targetCamX = player.x * TILE - canvas.width / 2 + TILE / 2;
    const targetCamY = player.y * TILE - canvas.height / 2 + TILE / 2;
    cameraX += (targetCamX - cameraX) * 0.1;
    cameraY += (targetCamY - cameraY) * 0.1;

    ctx.save();
    ctx.translate(-cameraX + shakeX, -cameraY + shakeY);

    const startX = Math.max(0, Math.floor(cameraX / TILE) - 1);
    const startY = Math.max(0, Math.floor(cameraY / TILE) - 1);
    const endX = Math.min(MAP_W, Math.floor((cameraX + canvas.width) / TILE) + 2);
    const endY = Math.min(MAP_H, Math.floor((cameraY + canvas.height) / TILE) + 2);

    // Render tiles
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const px = x * TILE, py = y * TILE;

            if (!explored[y][x]) {
                ctx.fillStyle = COLORS.bgDark;
                ctx.fillRect(px, py, TILE, TILE);
                continue;
            }

            const tile = map[y][x];
            let tex = null;

            switch (tile) {
                case TileType.FLOOR:
                    tex = textures[`floor${(x + y) % 4}`];
                    break;
                case TileType.WALL:
                    tex = textures.wall;
                    break;
                case TileType.COVER_HALF:
                    ctx.drawImage(textures.floor0, px, py);
                    tex = textures.coverHalf;
                    break;
                case TileType.COVER_FULL:
                    ctx.drawImage(textures.floor0, px, py);
                    tex = textures.coverFull;
                    break;
                case TileType.DOOR_CLOSED:
                    tex = textures.doorClosed;
                    break;
                case TileType.DOOR_OPEN:
                    tex = textures.doorOpen;
                    break;
                case TileType.EXTRACTION:
                    tex = textures.extraction;
                    break;
            }

            if (tex) ctx.drawImage(tex, px, py);

            // Fog overlay
            if (fogOfWar[y][x]) {
                ctx.fillStyle = 'rgba(10, 10, 18, 0.75)';
                ctx.fillRect(px, py, TILE, TILE);
            }
        }
    }

    // Render hazards
    hazards.forEach(h => {
        if (explored[h.y][h.x]) {
            ctx.drawImage(h.type === 'fire' ? textures.hazardFire : textures.hazardToxic, h.x * TILE, h.y * TILE);
            if (fogOfWar[h.y][h.x]) {
                ctx.fillStyle = 'rgba(10, 10, 18, 0.75)';
                ctx.fillRect(h.x * TILE, h.y * TILE, TILE, TILE);
            }
        }
    });

    // Render terminals
    terminals.forEach(t => {
        if (explored[t.y][t.x] && !t.hacked) {
            ctx.drawImage(textures.terminal, t.x * TILE, t.y * TILE);
            if (fogOfWar[t.y][t.x]) {
                ctx.fillStyle = 'rgba(10, 10, 18, 0.75)';
                ctx.fillRect(t.x * TILE, t.y * TILE, TILE, TILE);
            }
        }
    });

    // Render loot
    lootContainers.forEach(loot => {
        if (!loot.looted && explored[loot.y][loot.x]) {
            ctx.drawImage(textures.loot, loot.x * TILE, loot.y * TILE);
            if (fogOfWar[loot.y][loot.x]) {
                ctx.fillStyle = 'rgba(10, 10, 18, 0.75)';
                ctx.fillRect(loot.x * TILE, loot.y * TILE, TILE, TILE);
            }
        }
    });

    // Render enemies
    enemies.forEach(enemy => {
        if (!fogOfWar[enemy.y][enemy.x]) {
            let tex;
            if (enemy.corrupted) {
                tex = enemy.type === 'corruptedElite' ? textures.corruptedElite : textures.corrupted;
            } else if (enemy.alerted) {
                tex = textures.enemyAlert;
            } else {
                tex = enemy.type === 'sniper' ? textures.enemySniper :
                      enemy.type === 'heavy' ? textures.enemyHeavy : textures.enemy;
            }
            ctx.drawImage(tex, enemy.x * TILE, enemy.y * TILE);

            // Health bar
            const hpPct = enemy.hp / enemy.maxHp;
            ctx.fillStyle = '#000';
            ctx.fillRect(enemy.x * TILE + 4, enemy.y * TILE - 6, TILE - 8, 4);
            ctx.fillStyle = hpPct > 0.5 ? COLORS.health : COLORS.healthLow;
            ctx.fillRect(enemy.x * TILE + 4, enemy.y * TILE - 6, (TILE - 8) * hpPct, 4);
        }
    });

    // Render player
    ctx.drawImage(textures.player, player.x * TILE, player.y * TILE);

    // Render grenades
    grenades = grenades.filter(g => {
        g.progress += 0.08;
        if (g.progress >= 1) return false;

        const x = g.x + (g.targetX - g.x) * g.progress;
        const y = g.y + (g.targetY - g.y) * g.progress - Math.sin(g.progress * Math.PI) * 30;

        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        return true;
    });

    // Render bullets
    bullets = bullets.filter(b => {
        b.progress += 0.25;
        if (b.progress >= 1) return false;

        const x = b.x + (b.targetX - b.x) * b.progress;
        const y = b.y + (b.targetY - b.y) * b.progress;

        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        return true;
    });

    // Render particles
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life--;
        if (p.life <= 0) return false;

        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.life / 30), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
    });

    // Render floating texts
    floatingTexts = floatingTexts.filter(ft => {
        ft.y += ft.vy;
        ft.life--;
        if (ft.life <= 0) return false;

        ctx.globalAlpha = ft.life / 60;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
        return true;
    });

    // Hover highlight
    if (hoverTile && hoverTile.y >= 0 && hoverTile.y < MAP_H && hoverTile.x >= 0 && hoverTile.x < MAP_W && !fogOfWar[hoverTile.y]?.[hoverTile.x]) {
        const enemy = enemies.find(e => e.x === hoverTile.x && e.y === hoverTile.y);
        ctx.strokeStyle = enemy ? COLORS.enemy : COLORS.ui;
        ctx.lineWidth = 2;
        ctx.strokeRect(hoverTile.x * TILE + 1, hoverTile.y * TILE + 1, TILE - 2, TILE - 2);

        if (enemy) {
            const dist = Math.sqrt(Math.pow(hoverTile.x - player.x, 2) + Math.pow(hoverTile.y - player.y, 2));
            const hitChance = calculateHitChance(player, enemy, player.getWeapon(), dist);
            ctx.fillStyle = COLORS.uiBright;
            ctx.font = 'bold 14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.floor(hitChance)}%`, hoverTile.x * TILE + TILE / 2, hoverTile.y * TILE - 12);
        }
    }

    ctx.restore();

    // Corruption screen effect
    if (corruption >= 400) {
        const intensity = Math.min(0.3, (corruption - 400) / 2000);
        ctx.fillStyle = `rgba(136, 68, 170, ${intensity + corruptionFlicker})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    renderHUD();
}

function renderHUD() {
    const hudY = canvas.height - 100;

    // HUD background
    ctx.fillStyle = 'rgba(10, 10, 18, 0.92)';
    ctx.fillRect(0, hudY, canvas.width, 100);
    ctx.strokeStyle = COLORS.uiDark;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, hudY, canvas.width, 100);

    // Top bar
    ctx.fillStyle = 'rgba(20, 20, 40, 0.92)';
    ctx.fillRect(0, 0, canvas.width, 44);

    ctx.fillStyle = COLORS.ui;
    ctx.font = '14px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`FLOOR: ${floor}/${maxFloors}`, 20, 28);
    ctx.fillText(`LEVEL: ${player.level}`, 140, 28);

    // XP bar
    const xpPct = player.xp / (player.level * 100);
    ctx.fillStyle = '#333';
    ctx.fillRect(220, 16, 100, 14);
    ctx.fillStyle = COLORS.xp;
    ctx.fillRect(220, 16, 100 * xpPct, 14);
    ctx.fillStyle = COLORS.uiBright;
    ctx.font = '10px Courier New';
    ctx.fillText(`XP: ${player.xp}/${player.level * 100}`, 225, 26);

    // Corruption
    ctx.font = '14px Courier New';
    ctx.fillText('CORRUPTION:', 360, 28);
    ctx.fillStyle = '#333';
    ctx.fillRect(470, 14, 180, 18);
    ctx.fillStyle = corruption >= 600 ? COLORS.corruptionHigh : COLORS.corruption;
    ctx.fillRect(470, 14, 180 * (corruption / MAX_CORRUPTION), 18);
    ctx.fillStyle = COLORS.uiBright;
    ctx.textAlign = 'center';
    ctx.fillText(corruption.toString(), 560, 28);

    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.ui;
    ctx.fillText(`TURN: ${turn}`, canvas.width - 100, 28);
    ctx.fillText(`KILLS: ${killCount}`, canvas.width - 220, 28);

    // HP bar
    ctx.fillText('HP:', 20, hudY + 25);
    const hpPct = player.hp / player.maxHp;
    ctx.fillStyle = '#333';
    ctx.fillRect(50, hudY + 12, 140, 18);
    ctx.fillStyle = hpPct > 0.3 ? COLORS.health : COLORS.healthLow;
    ctx.fillRect(50, hudY + 12, 140 * hpPct, 18);
    ctx.fillStyle = COLORS.uiBright;
    ctx.fillText(`${player.hp}/${player.maxHp}`, 60, hudY + 26);

    // AP
    ctx.fillStyle = COLORS.ui;
    ctx.fillText('AP:', 210, hudY + 25);
    for (let i = 0; i < player.getMaxAp(); i++) {
        ctx.fillStyle = i < player.ap ? COLORS.ap : '#333';
        ctx.fillRect(240 + i * 24, hudY + 12, 20, 18);
    }

    // Stance
    ctx.fillStyle = COLORS.ui;
    ctx.fillText(`STANCE: ${player.stance.toUpperCase()}`, 340, hudY + 25);

    // Weapon
    const weapon = player.getWeapon();
    ctx.fillText(`[${weapon.name}]`, 20, hudY + 55);
    ctx.fillText(`Ammo: ${weapon.ammo}/${weapon.magSize}`, 20, hudY + 75);
    ctx.fillStyle = COLORS.uiDark;
    ctx.fillText(`(${weapon.ammoType}: ${player.inventory.ammo[weapon.ammoType]})`, 120, hudY + 75);

    // Inventory
    ctx.fillStyle = COLORS.ui;
    ctx.fillText(`Band:${player.inventory.bandages} Med:${player.inventory.medkits}`, 260, hudY + 55);
    ctx.fillText(`Stim:${player.inventory.stimpacks} Gren:${player.inventory.grenades}`, 260, hudY + 75);

    // Armor
    ctx.fillText(`Armor: ${player.armor}`, 440, hudY + 55);

    // Bleeding
    if (player.bleeding > 0) {
        ctx.fillStyle = COLORS.healthLow;
        ctx.fillText(`BLEEDING: -${player.bleeding}/turn`, 440, hudY + 75);
    }

    // Wounds
    const wounds = Object.entries(player.wounds).filter(([_, v]) => v > 0);
    if (wounds.length > 0) {
        ctx.fillStyle = COLORS.healthLow;
        ctx.font = '12px Courier New';
        ctx.fillText(`Wounds: ${wounds.map(([k, v]) => `${k}(${v})`).join(' ')}`, 560, hudY + 75);
    }

    // Message
    if (messageTimer > 0) {
        messageTimer--;
        ctx.fillStyle = COLORS.uiBright;
        ctx.font = '16px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvas.width / 2, hudY - 20);
    }

    // Minimap
    const mapSize = 120;
    const mapX = canvas.width - mapSize - 15;
    const mapY = hudY + 8;
    const tileSize = mapSize / Math.max(MAP_W, MAP_H);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(mapX - 3, mapY - 3, mapSize + 6, mapSize - 14);

    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            if (!explored[y][x]) continue;
            const px = mapX + x * tileSize;
            const py = mapY + y * tileSize;
            const tile = map[y][x];

            ctx.fillStyle = tile === TileType.WALL ? '#444' :
                           tile === TileType.EXTRACTION ? COLORS.extraction : '#222';
            ctx.fillRect(px, py, tileSize, tileSize);
        }
    }

    // Player on minimap
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(mapX + player.x * tileSize - 1, mapY + player.y * tileSize - 1, 3, 3);

    // Enemies on minimap
    enemies.forEach(e => {
        if (!fogOfWar[e.y][e.x]) {
            ctx.fillStyle = e.corrupted ? COLORS.corrupted : COLORS.enemy;
            ctx.fillRect(mapX + e.x * tileSize, mapY + e.y * tileSize, 2, 2);
        }
    });

    // Action log
    ctx.textAlign = 'left';
    ctx.font = '11px Courier New';
    actionLog.slice(0, 4).forEach((log, i) => {
        ctx.fillStyle = `rgba(136, 170, 204, ${1 - i * 0.2})`;
        ctx.fillText(`[${log.turn}] ${log.msg}`, canvas.width - mapSize - 180, hudY + 20 + i * 14);
    });
}

function renderDead() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.healthLow;
    ctx.font = 'bold 52px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('CLONE TERMINATED', canvas.width / 2, 260);

    ctx.fillStyle = COLORS.ui;
    ctx.font = '20px Courier New';
    ctx.fillText(`Survived ${turn} turns on floor ${floor}`, canvas.width / 2, 330);
    ctx.fillText(`Enemies killed: ${killCount}`, canvas.width / 2, 360);
    ctx.fillText(`Items collected: ${itemsCollected}`, canvas.width / 2, 390);

    ctx.fillStyle = COLORS.uiBright;
    ctx.font = '22px Courier New';
    ctx.fillText('Press SPACE to return', canvas.width / 2, 470);
}

function renderWin() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.extraction;
    ctx.font = 'bold 52px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('EXTRACTION SUCCESSFUL', canvas.width / 2, 260);

    ctx.fillStyle = COLORS.ui;
    ctx.font = '20px Courier New';
    ctx.fillText(`Completed in ${turn} turns`, canvas.width / 2, 330);
    ctx.fillText(`Final corruption: ${corruption}`, canvas.width / 2, 360);
    ctx.fillText(`Enemies killed: ${killCount}`, canvas.width / 2, 390);

    ctx.fillStyle = COLORS.uiBright;
    ctx.font = '22px Courier New';
    ctx.fillText('Press SPACE to continue', canvas.width / 2, 470);
}

// Game loop
function gameLoop() {
    render();
    requestAnimationFrame(gameLoop);
}

function init() {
    canvas.width = Math.max(1280, window.innerWidth);
    canvas.height = Math.max(720, window.innerHeight);
    initTextures();
    gameLoop();
}

window.addEventListener('resize', () => {
    canvas.width = Math.max(1280, window.innerWidth);
    canvas.height = Math.max(720, window.innerHeight);
});

init();
