// FTL Clone - Canvas Implementation
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const ROOM_SIZE = 40;
const TILE_SIZE = 40;

// Systems configuration
const SYSTEMS = {
    shields: { name: 'Shields', maxLevel: 8, color: '#4488ff', powerPerLevel: 2 },
    weapons: { name: 'Weapons', maxLevel: 8, color: '#ff4444', powerPerLevel: 1 },
    engines: { name: 'Engines', maxLevel: 8, color: '#ffaa00', powerPerLevel: 1 },
    piloting: { name: 'Piloting', maxLevel: 3, color: '#88ff88', powerPerLevel: 1, subsystem: true },
    oxygen: { name: 'Oxygen', maxLevel: 3, color: '#88ffff', powerPerLevel: 1 },
    medbay: { name: 'Medbay', maxLevel: 3, color: '#ff88ff', powerPerLevel: 1 },
    doors: { name: 'Doors', maxLevel: 3, color: '#888888', powerPerLevel: 1, subsystem: true },
    sensors: { name: 'Sensors', maxLevel: 3, color: '#ffff88', powerPerLevel: 1, subsystem: true }
};

// Weapons (faster charge for testing)
const WEAPONS = {
    burstLaser2: { name: 'Burst Laser II', damage: 1, shots: 3, chargeTime: 6, power: 2, type: 'laser' },
    artemisMissile: { name: 'Artemis', damage: 2, shots: 1, chargeTime: 5, power: 1, type: 'missile', bypassShields: true, missilesCost: 1 },
    basicLaser: { name: 'Basic Laser', damage: 1, shots: 1, chargeTime: 4, power: 1, type: 'laser' },
    heavyLaser: { name: 'Heavy Laser', damage: 2, shots: 1, chargeTime: 5, power: 1, type: 'laser' },
    miniBeam: { name: 'Mini Beam', damage: 1, chargeTime: 6, power: 1, type: 'beam', beamLength: 40 },
    ionBlast: { name: 'Ion Blast', damage: 0, ionDamage: 1, shots: 1, chargeTime: 4, power: 1, type: 'ion' }
};

// Crew races
const CREW_RACES = {
    human: { name: 'Human', health: 100, moveSpeed: 1.0, repairSpeed: 1.0, combatDamage: 1.0, color: '#ffcc88' },
    engi: { name: 'Engi', health: 100, moveSpeed: 1.0, repairSpeed: 2.0, combatDamage: 0.5, color: '#88ff88' },
    mantis: { name: 'Mantis', health: 100, moveSpeed: 1.2, repairSpeed: 0.5, combatDamage: 1.5, color: '#88ff44' },
    rockman: { name: 'Rockman', health: 150, moveSpeed: 0.5, repairSpeed: 1.0, combatDamage: 1.0, color: '#aa6633', fireImmune: true },
    zoltan: { name: 'Zoltan', health: 70, moveSpeed: 1.0, repairSpeed: 1.0, combatDamage: 1.0, color: '#ffff44', powerProvider: true }
};

// Enemy ship templates (easier for testing)
const ENEMY_SHIPS = {
    scout: { name: 'Rebel Scout', hull: 6, shields: 0, weapons: ['basicLaser'], crew: 2, reward: { scrap: [15, 25], fuel: [1, 3] } },
    fighter: { name: 'Pirate Fighter', hull: 8, shields: 1, weapons: ['basicLaser'], crew: 3, reward: { scrap: [20, 35], fuel: [1, 3], missiles: [1, 3] } },
    cruiser: { name: 'Rebel Cruiser', hull: 10, shields: 2, weapons: ['burstLaser2'], crew: 4, reward: { scrap: [30, 45], fuel: [2, 4], missiles: [2, 4] } }
};

// Game state
let gameState = 'menu'; // menu, sectorMap, combat, store, gameover, victory
let gamePaused = true;
let combatPaused = true;

// Player ship
let playerShip = null;
let enemyShip = null;

// Sector map
let sectorMap = null;
let currentSector = 1;
let rebelFleetPosition = 0;

// Resources
let scrap = 0;
let fuel = 16;
let missiles = 8;
let droneParts = 2;

// Selection state
let selectedCrew = null;
let selectedWeapon = null;
let selectedSystem = null;
let targetRoom = null;

// Input state
let keys = {};
let mouse = { x: 0, y: 0, clicked: false, rightClicked: false };

// Projectiles
let projectiles = [];

// Combat timer
let combatTimer = 0;

// ===================
// Ship Class
// ===================
class Ship {
    constructor(isPlayer, template) {
        this.isPlayer = isPlayer;
        this.hull = isPlayer ? 30 : template.hull;
        this.maxHull = this.hull;
        this.rooms = [];
        this.crew = [];
        this.weapons = [];
        this.systems = {};
        this.reactor = isPlayer ? 8 : 6;
        this.maxReactor = 25;
        this.shieldLayers = 0;
        this.maxShieldLayers = 0;
        this.shieldRechargeTimer = 0;
        this.evasion = 0;
        this.x = isPlayer ? 50 : 550;
        this.y = 200;

        if (isPlayer) {
            this.initPlayerShip();
        } else {
            this.initEnemyShip(template);
        }
    }

    initPlayerShip() {
        // Create rooms
        const layout = [
            { id: 'shields', system: 'shields', x: 0, y: 1, w: 2, h: 2 },
            { id: 'weapons', system: 'weapons', x: 3, y: 0, w: 2, h: 2 },
            { id: 'engines', system: 'engines', x: 5, y: 1, w: 2, h: 2 },
            { id: 'piloting', system: 'piloting', x: 7, y: 1, w: 1, h: 2 },
            { id: 'medbay', system: 'medbay', x: 1, y: 0, w: 2, h: 1 },
            { id: 'oxygen', system: 'oxygen', x: 1, y: 3, w: 2, h: 1 },
            { id: 'doors', system: 'doors', x: 5, y: 0, w: 2, h: 1 },
            { id: 'sensors', system: 'sensors', x: 5, y: 3, w: 2, h: 1 },
            { id: 'hall1', x: 2, y: 1, w: 1, h: 2 },
            { id: 'hall2', x: 4, y: 1, w: 1, h: 2 }
        ];

        for (const r of layout) {
            const room = new Room(r.id, this.x + r.x * ROOM_SIZE, this.y + r.y * ROOM_SIZE, r.w, r.h, r.system);
            this.rooms.push(room);
            if (r.system) {
                this.systems[r.system] = {
                    room: room,
                    level: r.system === 'piloting' || r.system === 'sensors' || r.system === 'doors' ? 1 : 2,
                    maxLevel: r.system === 'piloting' || r.system === 'sensors' || r.system === 'doors' ? 3 : 8,
                    power: 0,
                    damage: 0,
                    ionized: 0
                };
            }
        }

        // Set initial power
        this.systems.shields.power = 2;
        this.systems.weapons.power = 3;
        this.systems.engines.power = 2;
        this.systems.piloting.power = 1;
        this.systems.oxygen.power = 1;

        // Calculate shields
        this.maxShieldLayers = Math.floor(this.systems.shields.power / 2);
        this.shieldLayers = this.maxShieldLayers;

        // Add weapons
        this.weapons.push(new Weapon(WEAPONS.burstLaser2, this));
        this.weapons.push(new Weapon(WEAPONS.artemisMissile, this));

        // Add crew
        this.addCrew('human', 'Captain', this.getRoom('piloting'));
        this.addCrew('human', 'Engineer', this.getRoom('shields'));
        this.addCrew('human', 'Gunner', this.getRoom('weapons'));
    }

    initEnemyShip(template) {
        // Simpler enemy layout
        const layout = [
            { id: 'shields', system: 'shields', x: 0, y: 0, w: 2, h: 2 },
            { id: 'weapons', system: 'weapons', x: 2, y: 0, w: 2, h: 2 },
            { id: 'piloting', system: 'piloting', x: 4, y: 0, w: 1, h: 2 }
        ];

        for (const r of layout) {
            const room = new Room(r.id, this.x + r.x * ROOM_SIZE, this.y + r.y * ROOM_SIZE, r.w, r.h, r.system);
            this.rooms.push(room);
            if (r.system) {
                this.systems[r.system] = {
                    room: room,
                    level: r.system === 'shields' ? template.shields * 2 : 2,
                    maxLevel: 8,
                    power: r.system === 'shields' ? template.shields * 2 : 2,
                    damage: 0,
                    ionized: 0
                };
            }
        }

        this.maxShieldLayers = template.shields;
        this.shieldLayers = this.maxShieldLayers;

        // Add weapons
        for (const wid of template.weapons) {
            if (WEAPONS[wid]) {
                this.weapons.push(new Weapon(WEAPONS[wid], this));
            }
        }

        // Add crew
        for (let i = 0; i < template.crew; i++) {
            const room = this.rooms[i % this.rooms.length];
            this.addCrew('human', `Enemy ${i + 1}`, room);
        }
    }

    getRoom(id) {
        return this.rooms.find(r => r.id === id);
    }

    addCrew(race, name, room) {
        const crewMember = new CrewMember(race, name, this, room);
        this.crew.push(crewMember);
        room.crew.push(crewMember);
    }

    getUsedPower() {
        let used = 0;
        for (const sys of Object.values(this.systems)) {
            used += sys.power;
        }
        return used;
    }

    getAvailablePower() {
        return this.reactor - this.getUsedPower();
    }

    addPowerToSystem(systemName) {
        const sys = this.systems[systemName];
        if (!sys) return;
        const maxPower = Math.max(0, sys.level - sys.damage);
        if (sys.power < maxPower && this.getAvailablePower() > 0) {
            sys.power++;
            if (systemName === 'shields') {
                this.maxShieldLayers = Math.floor(sys.power / 2);
            }
        }
    }

    removePowerFromSystem(systemName) {
        const sys = this.systems[systemName];
        if (!sys) return;
        if (sys.power > 0) {
            sys.power--;
            if (systemName === 'shields') {
                this.maxShieldLayers = Math.floor(sys.power / 2);
                this.shieldLayers = Math.min(this.shieldLayers, this.maxShieldLayers);
            }
        }
    }

    calculateEvasion() {
        const engines = this.systems.engines;
        const piloting = this.systems.piloting;
        if (!engines || !piloting) return 0;

        const engineBonus = engines.power * 5;
        const pilotingManned = piloting.room.crew.length > 0 ? 1 : 0;

        return engineBonus * pilotingManned;
    }

    takeDamage(amount, bypassShields = false) {
        if (!bypassShields && this.shieldLayers > 0) {
            this.shieldLayers--;
            return false;
        }
        this.hull -= amount;
        return true;
    }

    update(dt) {
        // Update evasion
        this.evasion = this.calculateEvasion();

        // Update shields recharge
        if (this.shieldLayers < this.maxShieldLayers) {
            const shieldSys = this.systems.shields;
            if (shieldSys && shieldSys.power > 0) {
                this.shieldRechargeTimer += dt;
                const rechargeTime = 2.0; // seconds per layer
                if (this.shieldRechargeTimer >= rechargeTime) {
                    this.shieldRechargeTimer = 0;
                    this.shieldLayers++;
                }
            }
        }

        // Update weapons
        for (const weapon of this.weapons) {
            weapon.update(dt);
        }

        // Update crew
        for (const crew of this.crew) {
            crew.update(dt);
        }
    }

    draw(ctx) {
        // Draw rooms
        for (const room of this.rooms) {
            room.draw(ctx, this);
        }

        // Draw shields
        if (this.shieldLayers > 0) {
            const centerX = this.x + 160;
            const centerY = this.y + 80;
            ctx.strokeStyle = '#4488ff';
            ctx.lineWidth = 2;
            for (let i = 0; i < this.shieldLayers; i++) {
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, 180 + i * 10, 100 + i * 5, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Draw crew
        for (const crew of this.crew) {
            crew.draw(ctx);
        }
    }
}

// ===================
// Room Class
// ===================
class Room {
    constructor(id, x, y, w, h, system = null) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = w * ROOM_SIZE;
        this.height = h * ROOM_SIZE;
        this.system = system;
        this.crew = [];
        this.oxygen = 100;
        this.fires = [];
        this.breaches = [];
    }

    draw(ctx, ship) {
        // Room background
        ctx.fillStyle = '#1a1a3a';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Room border
        ctx.strokeStyle = '#444466';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // System icon/name
        if (this.system && SYSTEMS[this.system]) {
            const sys = ship.systems[this.system];
            const sysConfig = SYSTEMS[this.system];

            // System color based on power
            const powered = sys && sys.power > 0;
            ctx.fillStyle = powered ? sysConfig.color : '#333355';
            ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, 12);

            // System name
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.fillText(sysConfig.name.substring(0, 6), this.x + 4, this.y + 11);

            // Damage indicator
            if (sys && sys.damage > 0) {
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(this.x + this.width - 15, this.y + 2, 12, 12);
                ctx.fillStyle = '#fff';
                ctx.fillText(sys.damage.toString(), this.x + this.width - 12, this.y + 11);
            }
        }

        // Highlight if selected
        if (selectedSystem && ship.systems[selectedSystem]?.room === this) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
        }

        // Target indicator
        if (targetRoom === this && !ship.isPlayer) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
        }
    }

    contains(px, py) {
        return px >= this.x && px < this.x + this.width && py >= this.y && py < this.y + this.height;
    }

    getCenter() {
        return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
    }
}

// ===================
// Weapon Class
// ===================
class Weapon {
    constructor(template, ship) {
        this.template = template;
        this.ship = ship;
        this.chargeProgress = 0;
        this.powered = false;
        this.autofire = false;
        this.targetRoom = null;
    }

    update(dt) {
        // Check if weapon system has enough power
        const weaponSys = this.ship.systems.weapons;
        if (!weaponSys) return;

        const weaponIndex = this.ship.weapons.indexOf(this);
        let powerNeeded = 0;
        for (let i = 0; i <= weaponIndex; i++) {
            powerNeeded += this.ship.weapons[i].template.power;
        }

        this.powered = weaponSys.power >= powerNeeded;

        if (this.powered && this.chargeProgress < this.template.chargeTime) {
            // Manning bonus
            const manned = weaponSys.room.crew.length > 0;
            const chargeSpeed = manned ? 1.1 : 1.0;
            this.chargeProgress += dt * chargeSpeed;
        }

        // Enemy auto-fire
        if (!this.ship.isPlayer && this.chargeProgress >= this.template.chargeTime) {
            this.fireAtPlayer();
        }
    }

    fire(target) {
        if (this.chargeProgress < this.template.chargeTime) return false;
        if (!this.powered) return false;

        // Check missile cost
        if (this.template.missilesCost) {
            if (missiles < this.template.missilesCost) return false;
            missiles -= this.template.missilesCost;
        }

        this.chargeProgress = 0;

        // Create projectile
        const shots = this.template.shots || 1;
        const weaponRoom = this.ship.systems.weapons.room;
        const startPos = weaponRoom.getCenter();

        for (let i = 0; i < shots; i++) {
            projectiles.push({
                x: startPos.x,
                y: startPos.y,
                targetX: target.x + target.width / 2,
                targetY: target.y + target.height / 2,
                speed: 300,
                damage: this.template.damage,
                ionDamage: this.template.ionDamage || 0,
                bypassShields: this.template.bypassShields || false,
                targetShip: this.ship.isPlayer ? enemyShip : playerShip,
                targetRoom: target,
                type: this.template.type,
                color: this.template.type === 'missile' ? '#ff8800' : this.template.type === 'ion' ? '#44ffff' : '#ff4444',
                delay: i * 0.15
            });
        }

        return true;
    }

    fireAtPlayer() {
        if (!playerShip) return;
        // Target random system
        const systemRooms = playerShip.rooms.filter(r => r.system);
        if (systemRooms.length > 0) {
            const target = systemRooms[Math.floor(Math.random() * systemRooms.length)];
            this.fire(target);
        }
    }

    getChargePercent() {
        return Math.min(1, this.chargeProgress / this.template.chargeTime);
    }
}

// ===================
// CrewMember Class
// ===================
class CrewMember {
    constructor(race, name, ship, room) {
        this.race = CREW_RACES[race];
        this.raceName = race;
        this.name = name;
        this.ship = ship;
        this.room = room;
        this.health = this.race.health;
        this.maxHealth = this.race.health;
        this.x = room.x + room.width / 2;
        this.y = room.y + room.height / 2;
        this.targetRoom = null;
        this.moving = false;
    }

    update(dt) {
        // Move towards target room
        if (this.targetRoom && this.targetRoom !== this.room) {
            const targetPos = this.targetRoom.getCenter();
            const dx = targetPos.x - this.x;
            const dy = targetPos.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                const speed = 80 * this.race.moveSpeed;
                this.x += (dx / dist) * speed * dt;
                this.y += (dy / dist) * speed * dt;
                this.moving = true;
            } else {
                // Arrived
                this.room.crew = this.room.crew.filter(c => c !== this);
                this.room = this.targetRoom;
                this.room.crew.push(this);
                this.targetRoom = null;
                this.moving = false;
            }
        }

        // Repair damaged system in room
        if (this.room.system && !this.moving) {
            const sys = this.ship.systems[this.room.system];
            if (sys && sys.damage > 0) {
                sys.damage -= dt * this.race.repairSpeed * 0.5;
                if (sys.damage < 0) sys.damage = 0;
            }
        }
    }

    draw(ctx) {
        // Crew circle
        ctx.fillStyle = this.race.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - 10, this.y - 18, 20, 4);
        ctx.fillStyle = healthPercent > 0.5 ? '#44ff44' : healthPercent > 0.25 ? '#ffff44' : '#ff4444';
        ctx.fillRect(this.x - 10, this.y - 18, 20 * healthPercent, 4);

        // Selection indicator
        if (selectedCrew === this) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 14, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    moveTo(room) {
        this.targetRoom = room;
    }
}

// ===================
// Sector Map
// ===================
class SectorMapNode {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // start, empty, combat, store, distress, exit
        this.visited = false;
        this.current = false;
        this.connections = [];
        this.event = null;
    }
}

function generateSectorMap() {
    const nodes = [];
    const gridWidth = 6;
    const gridHeight = 3;
    const cellWidth = 130;
    const cellHeight = 120;
    const offsetX = 100;
    const offsetY = 250;

    // Generate nodes
    for (let gx = 0; gx < gridWidth; gx++) {
        for (let gy = 0; gy < gridHeight; gy++) {
            if (Math.random() < 0.75 || gx === 0 || gx === gridWidth - 1) {
                const x = offsetX + gx * cellWidth + (Math.random() - 0.5) * 40;
                const y = offsetY + gy * cellHeight + (Math.random() - 0.5) * 30;

                let type = 'empty';
                const roll = Math.random();
                if (gx === 0 && gy === 1) type = 'start';
                else if (gx === gridWidth - 1 && gy === 1) type = 'exit';
                else if (roll < 0.4) type = 'combat';
                else if (roll < 0.55) type = 'store';
                else if (roll < 0.7) type = 'distress';

                const node = new SectorMapNode(x, y, type);
                node.gridX = gx;
                node.gridY = gy;
                nodes.push(node);
            }
        }
    }

    // Connect nodes
    for (const node of nodes) {
        for (const other of nodes) {
            if (other.gridX === node.gridX + 1 && Math.abs(other.gridY - node.gridY) <= 1) {
                if (!node.connections.includes(other)) {
                    node.connections.push(other);
                }
            }
        }
    }

    // Mark start
    const start = nodes.find(n => n.type === 'start');
    if (start) {
        start.current = true;
        start.visited = true;
    }

    return nodes;
}

function drawSectorMap(ctx) {
    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`Sector ${currentSector}`, 400, 50);

    // Rebel fleet warning
    ctx.fillStyle = '#ff4444';
    ctx.font = '14px monospace';
    ctx.fillText(`Rebel Fleet: ${Math.floor(rebelFleetPosition)} jumps away`, 650, 50);

    // Resources bar
    ctx.fillStyle = '#aaa';
    ctx.font = '14px monospace';
    ctx.fillText(`Hull: ${playerShip.hull}/${playerShip.maxHull}`, 50, 30);
    ctx.fillText(`Scrap: ${scrap}`, 180, 30);
    ctx.fillText(`Fuel: ${fuel}`, 280, 30);
    ctx.fillText(`Missiles: ${missiles}`, 380, 30);

    // Draw connections
    ctx.strokeStyle = '#334466';
    ctx.lineWidth = 2;
    for (const node of sectorMap) {
        for (const conn of node.connections) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(conn.x, conn.y);
            ctx.stroke();
        }
    }

    // Draw nodes
    for (const node of sectorMap) {
        let color = '#666688';
        let radius = 12;

        if (node.type === 'combat') color = '#ff4444';
        else if (node.type === 'store') color = '#44ff44';
        else if (node.type === 'distress') color = '#4488ff';
        else if (node.type === 'exit') color = '#ff44ff';
        else if (node.type === 'start') color = '#ffff44';

        if (node.current) {
            color = '#ffff00';
            radius = 16;
        }

        // Can jump indicator
        const currentNode = sectorMap.find(n => n.current);
        const canJump = currentNode && currentNode.connections.includes(node) && fuel > 0;

        ctx.fillStyle = node.visited ? color : (canJump ? color : '#333355');
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = canJump ? '#ffffff' : '#444466';
        ctx.lineWidth = canJump ? 2 : 1;
        ctx.stroke();

        // Type label
        if (!node.visited && node.type !== 'empty') {
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.fillText(node.type.charAt(0).toUpperCase(), node.x - 3, node.y + 4);
        }
    }

    // Instructions
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText('Click a connected beacon to jump (costs 1 fuel)', 300, 650);
}

// ===================
// Combat Functions
// ===================
function startCombat(enemyTemplate) {
    enemyShip = new Ship(false, enemyTemplate);
    gameState = 'combat';
    combatPaused = true;
    combatTimer = 0;
    projectiles = [];
    selectedWeapon = null;
    targetRoom = null;
}

function updateCombat(dt) {
    if (combatPaused) return;

    combatTimer += dt;

    // Update ships
    playerShip.update(dt);
    enemyShip.update(dt);

    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];

        // Delay before moving
        if (p.delay > 0) {
            p.delay -= dt;
            continue;
        }

        // Move towards target
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 10) {
            p.x += (dx / dist) * p.speed * dt;
            p.y += (dy / dist) * p.speed * dt;
        } else {
            // Hit!
            const evadeRoll = Math.random() * 100;
            if (evadeRoll < p.targetShip.evasion && !p.bypassShields) {
                // Evaded
                showFloatingText(p.targetX, p.targetY, 'MISS', '#888888');
            } else {
                // Hit landed
                const hitHull = p.targetShip.takeDamage(p.damage, p.bypassShields);

                if (hitHull) {
                    showFloatingText(p.targetX, p.targetY, `-${p.damage}`, '#ff4444');

                    // System damage
                    if (p.targetRoom && p.targetRoom.system) {
                        const sys = p.targetShip.systems[p.targetRoom.system];
                        if (sys) {
                            sys.damage = Math.min(sys.level, sys.damage + p.damage);
                            sys.power = Math.min(sys.power, Math.max(0, sys.level - sys.damage));
                        }
                    }

                    // Ion damage
                    if (p.ionDamage && p.targetRoom && p.targetRoom.system) {
                        const sys = p.targetShip.systems[p.targetRoom.system];
                        if (sys) {
                            sys.ionized += p.ionDamage * 5;
                        }
                    }
                } else {
                    showFloatingText(p.targetX, p.targetY, 'BLOCKED', '#4488ff');
                }
            }

            projectiles.splice(i, 1);
        }
    }

    // Check victory/defeat
    if (playerShip.hull <= 0) {
        gameState = 'gameover';
    } else if (enemyShip.hull <= 0) {
        endCombat(true);
    }
}

function endCombat(victory) {
    if (victory && enemyShip) {
        // Collect rewards
        const template = Object.values(ENEMY_SHIPS).find(t => t.name === enemyShip.name) || ENEMY_SHIPS.scout;
        const reward = template.reward;

        const scrapGain = reward.scrap[0] + Math.floor(Math.random() * (reward.scrap[1] - reward.scrap[0]));
        const fuelGain = reward.fuel[0] + Math.floor(Math.random() * (reward.fuel[1] - reward.fuel[0]));
        const missileGain = reward.missiles ? reward.missiles[0] + Math.floor(Math.random() * (reward.missiles[1] - reward.missiles[0])) : 0;

        scrap += scrapGain;
        fuel += fuelGain;
        missiles += missileGain;

        showFloatingText(500, 350, `+${scrapGain} scrap, +${fuelGain} fuel`, '#ffff00');
    }

    enemyShip = null;
    gameState = 'sectorMap';
}

function drawCombat(ctx) {
    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ships
    playerShip.draw(ctx);
    if (enemyShip) {
        enemyShip.draw(ctx);
    }

    // Draw projectiles
    for (const p of projectiles) {
        if (p.delay > 0) continue;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // UI: Resources
    ctx.fillStyle = '#aaa';
    ctx.font = '14px monospace';
    ctx.fillText(`Hull: ${playerShip.hull}/${playerShip.maxHull}`, 20, 25);
    ctx.fillText(`Shields: ${playerShip.shieldLayers}/${playerShip.maxShieldLayers}`, 150, 25);
    ctx.fillText(`Evasion: ${playerShip.evasion}%`, 280, 25);
    ctx.fillText(`Missiles: ${missiles}`, 400, 25);
    ctx.fillText(`Scrap: ${scrap}`, 500, 25);

    // Enemy stats
    if (enemyShip) {
        ctx.fillText(`Enemy Hull: ${enemyShip.hull}`, 700, 25);
        ctx.fillText(`Shields: ${enemyShip.shieldLayers}/${enemyShip.maxShieldLayers}`, 850, 25);
    }

    // Power panel
    drawPowerPanel(ctx);

    // Weapon panel
    drawWeaponPanel(ctx);

    // Pause indicator
    if (combatPaused) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px monospace';
        ctx.fillText('PAUSED', 450, 350);
        ctx.font = '16px monospace';
        ctx.fillText('Press SPACE to resume', 420, 390);
    }

    // Instructions
    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    ctx.fillText('SPACE=pause | 1-4=select crew | Q/W=select weapon | Click enemy room=target | Click player room=move crew', 100, 690);
}

function drawPowerPanel(ctx) {
    const x = 20;
    let y = 500;

    ctx.fillStyle = '#333';
    ctx.fillRect(x - 5, y - 20, 200, 180);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('POWER', x, y);
    y += 20;

    ctx.font = '12px monospace';
    ctx.fillText(`Reactor: ${playerShip.getUsedPower()}/${playerShip.reactor}`, x, y);
    y += 20;

    for (const [name, sys] of Object.entries(playerShip.systems)) {
        const config = SYSTEMS[name];
        if (!config) continue;

        // Highlight selected
        if (selectedSystem === name) {
            ctx.fillStyle = '#555';
            ctx.fillRect(x - 2, y - 12, 190, 16);
        }

        ctx.fillStyle = config.color;
        ctx.fillText(config.name.padEnd(10), x, y);

        // Power bars
        const maxPower = Math.max(0, sys.level - Math.floor(sys.damage));
        for (let i = 0; i < sys.level; i++) {
            const barX = x + 85 + i * 12;
            ctx.fillStyle = i < sys.damage ? '#ff0000' : i < sys.power ? config.color : '#333';
            ctx.fillRect(barX, y - 10, 10, 12);
            ctx.strokeStyle = '#666';
            ctx.strokeRect(barX, y - 10, 10, 12);
        }

        y += 18;
    }
}

function drawWeaponPanel(ctx) {
    const x = 250;
    const y = 550;

    ctx.fillStyle = '#333';
    ctx.fillRect(x - 5, y - 20, 500, 100);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('WEAPONS', x, y);

    for (let i = 0; i < playerShip.weapons.length; i++) {
        const weapon = playerShip.weapons[i];
        const wx = x + i * 120;
        const wy = y + 20;

        // Background
        ctx.fillStyle = selectedWeapon === i ? '#555' : '#222';
        ctx.fillRect(wx, wy, 110, 60);

        // Name
        ctx.fillStyle = weapon.powered ? '#fff' : '#666';
        ctx.font = '11px monospace';
        ctx.fillText(weapon.template.name, wx + 5, wy + 15);

        // Charge bar
        const chargePercent = weapon.getChargePercent();
        ctx.fillStyle = '#333';
        ctx.fillRect(wx + 5, wy + 25, 100, 10);
        ctx.fillStyle = chargePercent >= 1 ? '#44ff44' : '#ffaa00';
        ctx.fillRect(wx + 5, wy + 25, 100 * chargePercent, 10);

        // Power cost
        ctx.fillStyle = '#888';
        ctx.font = '10px monospace';
        ctx.fillText(`PWR: ${weapon.template.power}`, wx + 5, wy + 50);

        // Hotkey
        ctx.fillStyle = '#aaa';
        ctx.fillText(['Q', 'W', 'E', 'R'][i], wx + 95, wy + 50);
    }
}

// ===================
// Store System
// ===================
let storeItems = [];

function generateStore() {
    storeItems = [];

    // Fuel
    storeItems.push({ type: 'fuel', name: 'Fuel (5)', cost: 15, amount: 5 });

    // Missiles
    storeItems.push({ type: 'missiles', name: 'Missiles (5)', cost: 25, amount: 5 });

    // Repairs
    storeItems.push({ type: 'repair', name: 'Hull Repair (5)', cost: 10, amount: 5 });

    // Random weapon
    const weaponKeys = Object.keys(WEAPONS);
    const randomWeapon = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
    storeItems.push({ type: 'weapon', name: WEAPONS[randomWeapon].name, cost: 40 + Math.floor(Math.random() * 40), weapon: randomWeapon });

    // System upgrade
    const upgradeable = Object.keys(playerShip.systems).filter(s => {
        const sys = playerShip.systems[s];
        return sys.level < sys.maxLevel;
    });
    if (upgradeable.length > 0) {
        const sysToUpgrade = upgradeable[Math.floor(Math.random() * upgradeable.length)];
        storeItems.push({ type: 'upgrade', name: `Upgrade ${SYSTEMS[sysToUpgrade].name}`, cost: 30 + playerShip.systems[sysToUpgrade].level * 15, system: sysToUpgrade });
    }

    // Reactor
    if (playerShip.reactor < playerShip.maxReactor) {
        storeItems.push({ type: 'reactor', name: 'Reactor Upgrade', cost: 25 + playerShip.reactor * 5 });
    }
}

function buyItem(index) {
    const item = storeItems[index];
    if (!item || scrap < item.cost) return;

    scrap -= item.cost;

    switch (item.type) {
        case 'fuel':
            fuel += item.amount;
            break;
        case 'missiles':
            missiles += item.amount;
            break;
        case 'repair':
            playerShip.hull = Math.min(playerShip.maxHull, playerShip.hull + item.amount);
            break;
        case 'weapon':
            if (playerShip.weapons.length < 4) {
                playerShip.weapons.push(new Weapon(WEAPONS[item.weapon], playerShip));
            }
            break;
        case 'upgrade':
            playerShip.systems[item.system].level++;
            break;
        case 'reactor':
            playerShip.reactor++;
            break;
    }

    storeItems[index] = null;
}

function drawStore(ctx) {
    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('STORE', 450, 60);

    // Scrap
    ctx.fillStyle = '#ffff00';
    ctx.font = '18px monospace';
    ctx.fillText(`Scrap: ${scrap}`, 450, 100);

    // Items
    let y = 150;
    for (let i = 0; i < storeItems.length; i++) {
        const item = storeItems[i];
        if (!item) continue;

        const affordable = scrap >= item.cost;

        ctx.fillStyle = affordable ? '#333' : '#222';
        ctx.fillRect(300, y, 400, 50);

        ctx.fillStyle = affordable ? '#fff' : '#666';
        ctx.font = '16px monospace';
        ctx.fillText(item.name, 320, y + 30);

        ctx.fillStyle = affordable ? '#ffff00' : '#884400';
        ctx.fillText(`${item.cost} scrap`, 600, y + 30);

        // Hotkey
        ctx.fillStyle = '#888';
        ctx.fillText(`[${i + 1}]`, 720, y + 30);

        y += 60;
    }

    // Leave button
    ctx.fillStyle = '#444';
    ctx.fillRect(400, y + 40, 200, 50);
    ctx.fillStyle = '#fff';
    ctx.fillText('[SPACE] Leave Store', 420, y + 72);
}

// ===================
// Menu/Game Over
// ===================
function drawMenu(ctx) {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#4488ff';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('FTL CLONE', 380, 200);

    ctx.fillStyle = '#888';
    ctx.font = '18px monospace';
    ctx.fillText('A space roguelike adventure', 360, 250);

    // Start button
    ctx.fillStyle = '#335566';
    ctx.fillRect(400, 350, 200, 60);
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Start Game', 440, 390);

    ctx.fillStyle = '#666';
    ctx.font = '14px monospace';
    ctx.fillText('Click to start or press SPACE', 390, 450);
}

function drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('GAME OVER', 370, 300);

    ctx.fillStyle = '#888';
    ctx.font = '18px monospace';
    ctx.fillText(`Reached Sector ${currentSector}`, 420, 360);
    ctx.fillText(`Final Score: ${scrap}`, 440, 400);

    ctx.fillStyle = '#666';
    ctx.font = '14px monospace';
    ctx.fillText('Press SPACE to restart', 410, 480);
}

function drawVictory(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('VICTORY!', 400, 300);

    ctx.fillStyle = '#888';
    ctx.font = '18px monospace';
    ctx.fillText(`Completed ${currentSector} sectors`, 400, 360);
    ctx.fillText(`Final Score: ${scrap}`, 440, 400);

    ctx.fillStyle = '#666';
    ctx.font = '14px monospace';
    ctx.fillText('Press SPACE to play again', 400, 480);
}

// ===================
// Floating Text
// ===================
function showFloatingText(x, y, text, color) {
    const container = document.getElementById('floatingTexts');
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.color = color;
    el.textContent = text;
    container.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

// ===================
// Input Handling
// ===================
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (gameState === 'menu') {
        startGame();
    } else if (gameState === 'sectorMap') {
        handleSectorMapClick(x, y);
    } else if (gameState === 'combat') {
        handleCombatClick(x, y);
    } else if (gameState === 'store') {
        handleStoreClick(x, y);
    } else if (gameState === 'gameover' || gameState === 'victory') {
        startGame();
    }
});

function handleSectorMapClick(x, y) {
    const currentNode = sectorMap.find(n => n.current);

    for (const node of sectorMap) {
        const dx = node.x - x;
        const dy = node.y - y;
        if (dx * dx + dy * dy < 256) { // 16^2
            // Check if can jump
            if (currentNode.connections.includes(node) && fuel > 0) {
                jumpToNode(node);
            }
            break;
        }
    }
}

function jumpToNode(node) {
    // Deduct fuel
    fuel--;

    // Move current
    const current = sectorMap.find(n => n.current);
    if (current) current.current = false;
    node.current = true;
    node.visited = true;

    // Advance rebel fleet
    rebelFleetPosition = Math.max(0, rebelFleetPosition - 1);

    // Handle event
    if (node.type === 'combat') {
        // Random enemy based on sector
        const enemies = ['scout', 'fighter'];
        if (currentSector >= 2) enemies.push('cruiser');
        const enemyKey = enemies[Math.floor(Math.random() * enemies.length)];
        startCombat(ENEMY_SHIPS[enemyKey]);
    } else if (node.type === 'store') {
        generateStore();
        gameState = 'store';
    } else if (node.type === 'distress') {
        // Random reward
        const scrapGain = 10 + Math.floor(Math.random() * 20);
        scrap += scrapGain;
        showFloatingText(node.x, node.y - 30, `+${scrapGain} scrap`, '#ffff00');
    } else if (node.type === 'exit') {
        // Next sector
        currentSector++;
        if (currentSector > 8) {
            gameState = 'victory';
        } else {
            rebelFleetPosition = 6;
            sectorMap = generateSectorMap();
        }
    }

    // Check rebel fleet
    if (rebelFleetPosition <= 0) {
        // Force combat with tough enemy
        startCombat(ENEMY_SHIPS.cruiser);
    }
}

function handleCombatClick(x, y) {
    // Check player rooms (move crew)
    if (selectedCrew) {
        for (const room of playerShip.rooms) {
            if (room.contains(x, y)) {
                selectedCrew.moveTo(room);
                return;
            }
        }
    }

    // Check enemy rooms (target weapon)
    if (selectedWeapon !== null && enemyShip) {
        for (const room of enemyShip.rooms) {
            if (room.contains(x, y)) {
                targetRoom = room;
                const weapon = playerShip.weapons[selectedWeapon];
                if (weapon && weapon.getChargePercent() >= 1) {
                    weapon.fire(room);
                }
                return;
            }
        }
    }

    // Select crew
    for (const crew of playerShip.crew) {
        const dx = crew.x - x;
        const dy = crew.y - y;
        if (dx * dx + dy * dy < 196) { // 14^2
            selectedCrew = crew;
            return;
        }
    }

    // Select system
    for (const room of playerShip.rooms) {
        if (room.contains(x, y) && room.system) {
            selectedSystem = room.system;
            return;
        }
    }
}

function handleStoreClick(x, y) {
    // Check item clicks
    let itemY = 150;
    for (let i = 0; i < storeItems.length; i++) {
        if (storeItems[i] && x >= 300 && x <= 700 && y >= itemY && y <= itemY + 50) {
            buyItem(i);
            return;
        }
        itemY += 60;
    }

    // Leave button
    if (x >= 400 && x <= 600 && y >= itemY + 40 && y <= itemY + 90) {
        gameState = 'sectorMap';
    }
}

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    if (e.key === ' ') {
        e.preventDefault();
        if (gameState === 'menu') {
            startGame();
        } else if (gameState === 'combat') {
            combatPaused = !combatPaused;
        } else if (gameState === 'store') {
            gameState = 'sectorMap';
        } else if (gameState === 'gameover' || gameState === 'victory') {
            startGame();
        }
    }

    if (gameState === 'combat') {
        // Crew selection
        if (e.key >= '1' && e.key <= '4') {
            const index = parseInt(e.key) - 1;
            if (playerShip.crew[index]) {
                selectedCrew = playerShip.crew[index];
            }
        }

        // Weapon selection
        if (e.key.toLowerCase() === 'q') selectedWeapon = 0;
        if (e.key.toLowerCase() === 'w') selectedWeapon = 1;
        if (e.key.toLowerCase() === 'e') selectedWeapon = 2;
        if (e.key.toLowerCase() === 'r') selectedWeapon = 3;

        // Power management
        if (selectedSystem) {
            if (e.key === 'ArrowUp') {
                playerShip.addPowerToSystem(selectedSystem);
            }
            if (e.key === 'ArrowDown') {
                playerShip.removePowerFromSystem(selectedSystem);
            }
        }
    }

    if (gameState === 'store') {
        // Quick buy
        if (e.key >= '1' && e.key <= '6') {
            buyItem(parseInt(e.key) - 1);
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

// ===================
// Game Start
// ===================
function startGame() {
    gameState = 'sectorMap';
    currentSector = 1;
    scrap = 0;
    fuel = 16;
    missiles = 8;
    droneParts = 2;
    rebelFleetPosition = 6;

    playerShip = new Ship(true);
    enemyShip = null;
    sectorMap = generateSectorMap();

    selectedCrew = null;
    selectedWeapon = null;
    selectedSystem = null;
    targetRoom = null;
}

// ===================
// Game Loop
// ===================
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min(0.1, (timestamp - lastTime) / 1000);
    lastTime = timestamp;

    // Clear
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw based on state
    switch (gameState) {
        case 'menu':
            drawMenu(ctx);
            break;
        case 'sectorMap':
            drawSectorMap(ctx);
            break;
        case 'combat':
            updateCombat(dt);
            drawCombat(ctx);
            break;
        case 'store':
            drawStore(ctx);
            break;
        case 'gameover':
            drawGameOver(ctx);
            break;
        case 'victory':
            drawVictory(ctx);
            break;
    }

    requestAnimationFrame(gameLoop);
}

// ===================
// Harness Interface
// ===================
window.harness = {
    pause: () => {
        gamePaused = true;
        combatPaused = true;
    },

    resume: () => {
        gamePaused = false;
        combatPaused = false;
    },

    isPaused: () => gamePaused || combatPaused,

    execute: async (action, durationMs) => {
        // Unpause during execution
        gamePaused = false;
        combatPaused = false;

        const startTime = performance.now();
        const duration = durationMs || 500;

        // Process one-time actions immediately
        if (action.jump && gameState === 'sectorMap') {
            if (action.jump.nodeIndex !== undefined) {
                const node = sectorMap[action.jump.nodeIndex];
                if (node) {
                    const currentNode = sectorMap.find(n => n.current);
                    if (currentNode && currentNode.connections.includes(node) && fuel > 0) {
                        jumpToNode(node);
                    }
                }
            }
        }

        if (action.selectCrew !== undefined && playerShip) {
            selectedCrew = playerShip.crew[action.selectCrew];
        }

        if (action.selectWeapon !== undefined) {
            selectedWeapon = action.selectWeapon;
        }

        if (action.selectSystem && playerShip) {
            selectedSystem = action.selectSystem;
        }

        if (action.powerUp && selectedSystem && playerShip) {
            playerShip.addPowerToSystem(selectedSystem);
        }

        if (action.powerDown && selectedSystem && playerShip) {
            playerShip.removePowerFromSystem(selectedSystem);
        }

        if (action.targetRoom !== undefined && enemyShip && playerShip) {
            const room = enemyShip.rooms[action.targetRoom];
            if (room) {
                targetRoom = room;
                if (selectedWeapon !== null) {
                    const weapon = playerShip.weapons[selectedWeapon];
                    if (weapon && weapon.getChargePercent() >= 1) {
                        weapon.fire(room);
                    }
                }
            }
        }

        if (action.buyItem !== undefined && gameState === 'store') {
            buyItem(action.buyItem);
        }

        if (action.leaveStore && gameState === 'store') {
            gameState = 'sectorMap';
        }

        return new Promise((resolve) => {
            function step() {
                const elapsed = performance.now() - startTime;

                // Keep keys pressed
                if (action.keys) {
                    for (const key of action.keys) {
                        keys[key.toLowerCase()] = true;
                    }
                }

                // Click handling
                if (action.click && gameState === 'combat') {
                    handleCombatClick(action.click.x, action.click.y);
                }

                // Try to fire charged weapons at target
                if (targetRoom && selectedWeapon !== null && playerShip && enemyShip) {
                    const weapon = playerShip.weapons[selectedWeapon];
                    if (weapon && weapon.getChargePercent() >= 1) {
                        weapon.fire(targetRoom);
                    }
                }

                if (elapsed >= duration) {
                    // Clear keys
                    if (action.keys) {
                        for (const key of action.keys) {
                            keys[key.toLowerCase()] = false;
                        }
                    }
                    // Pause after execution
                    gamePaused = true;
                    combatPaused = true;
                    resolve();
                } else {
                    requestAnimationFrame(step);
                }
            }
            step();
        });
    },

    getState: () => {
        const state = {
            gameState: gameState,
            sector: currentSector,
            scrap: scrap,
            fuel: fuel,
            missiles: missiles,
            rebelFleetPosition: rebelFleetPosition
        };

        if (playerShip) {
            state.player = {
                hull: playerShip.hull,
                maxHull: playerShip.maxHull,
                shields: playerShip.shieldLayers,
                maxShields: playerShip.maxShieldLayers,
                evasion: playerShip.evasion,
                reactor: playerShip.reactor,
                usedPower: playerShip.getUsedPower(),
                systems: {},
                weapons: playerShip.weapons.map((w, i) => ({
                    name: w.template.name,
                    charged: w.getChargePercent() >= 1,
                    chargePercent: w.getChargePercent(),
                    powered: w.powered,
                    selected: selectedWeapon === i
                })),
                crew: playerShip.crew.map((c, i) => ({
                    name: c.name,
                    race: c.raceName,
                    health: c.health,
                    maxHealth: c.maxHealth,
                    room: c.room.id,
                    selected: selectedCrew === c
                }))
            };

            for (const [name, sys] of Object.entries(playerShip.systems)) {
                state.player.systems[name] = {
                    level: sys.level,
                    power: sys.power,
                    damage: sys.damage,
                    selected: selectedSystem === name
                };
            }
        }

        if (enemyShip) {
            state.enemy = {
                name: enemyShip.name || 'Enemy Ship',
                hull: enemyShip.hull,
                maxHull: enemyShip.maxHull,
                shields: enemyShip.shieldLayers,
                maxShields: enemyShip.maxShieldLayers,
                rooms: enemyShip.rooms.map((r, i) => ({
                    id: r.id,
                    system: r.system,
                    x: r.x,
                    y: r.y,
                    width: r.width,
                    height: r.height,
                    targeted: targetRoom === r
                }))
            };
        }

        if (gameState === 'sectorMap' && sectorMap) {
            state.sectorMap = {
                nodes: sectorMap.map((n, i) => ({
                    index: i,
                    x: n.x,
                    y: n.y,
                    type: n.type,
                    visited: n.visited,
                    current: n.current,
                    canJump: sectorMap.find(node => node.current)?.connections.includes(n) && fuel > 0
                }))
            };
        }

        if (gameState === 'store') {
            state.store = {
                items: storeItems.map((item, i) => item ? {
                    index: i,
                    name: item.name,
                    cost: item.cost,
                    type: item.type,
                    affordable: scrap >= item.cost
                } : null).filter(Boolean)
            };
        }

        state.combatPaused = combatPaused;
        state.selectedWeapon = selectedWeapon;
        state.selectedSystem = selectedSystem;
        state.targetRoom = targetRoom ? targetRoom.id : null;

        return state;
    },

    getPhase: () => {
        if (gameState === 'menu') return 'menu';
        if (gameState === 'gameover') return 'gameover';
        if (gameState === 'victory') return 'victory';
        return 'playing';
    },

    debug: {
        setHealth: (hp) => {
            if (playerShip) playerShip.hull = Math.min(hp, playerShip.maxHull);
        },
        forceStart: () => {
            // Always restart fresh
            startGame();
            gamePaused = false;
            combatPaused = false;
        },
        restart: () => {
            startGame();
            gamePaused = false;
            combatPaused = false;
        },
        skipToSector: (sector) => {
            currentSector = sector;
            sectorMap = generateSectorMap();
            gameState = 'sectorMap';
        },
        addScrap: (amount) => {
            scrap += amount;
        },
        addFuel: (amount) => {
            fuel += amount;
        },
        killEnemy: () => {
            if (enemyShip) {
                enemyShip.hull = 0;
            }
        }
    }
};

// Start game loop
requestAnimationFrame(gameLoop);
