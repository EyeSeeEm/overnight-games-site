// Frostfall - A 2D Skyrim Demake
// Phaser 3 Implementation

// Colors
const COLORS = {
    bg: 0x1a1a2e,
    grass: 0x2d4a2d,
    grassDark: 0x1f3a1f,
    dirt: 0x5a4a3a,
    stone: 0x4a4a5a,
    stoneDark: 0x3a3a4a,
    snow: 0xd8e8f0,
    snowDark: 0xb8c8d0,
    wall: 0x3a3a4a,
    floor: 0x5a5a6a,
    wood: 0x6a5040,
    tree: 0x1a3a1a,
    health: 0xcc3333,
    stamina: 0x33aa33,
    magicka: 0x3366cc,
    gold: 0xddaa33,
    ui: 0x2a2a3e,
    uiBorder: 0x5a5a7e,
    text: 0xe0e0e0,
    npc: 0x44aa44,
    player: 0x6688cc,
    enemy: 0xaa4444
};

const TILE_SIZE = 16;
const WORLD_SIZE = 100;

// Enemy definitions
const ENEMY_TYPES = {
    wolf: { name: 'Wolf', hp: 25, damage: 6, speed: 70, color: 0x666655, size: 12, xp: 15, loot: 'pelt' },
    bandit: { name: 'Bandit', hp: 40, damage: 8, speed: 50, color: 0x886644, size: 14, xp: 25, loot: 'gold' },
    banditChief: { name: 'Bandit Chief', hp: 80, damage: 15, speed: 45, color: 0xaa6644, size: 18, xp: 75, loot: 'weapon', boss: true },
    frostWolf: { name: 'Frost Wolf', hp: 35, damage: 8, speed: 75, color: 0x8899aa, size: 14, xp: 25, loot: 'pelt' },
    draugr: { name: 'Draugr', hp: 50, damage: 10, speed: 40, color: 0x557788, size: 16, xp: 35, loot: 'gold' },
    draugrWight: { name: 'Draugr Wight', hp: 100, damage: 18, speed: 35, color: 0x4488aa, size: 20, xp: 100, loot: 'enchanted', boss: true },
    bear: { name: 'Bear', hp: 60, damage: 12, speed: 55, color: 0x554433, size: 20, xp: 40, loot: 'pelt' },
    troll: { name: 'Troll', hp: 80, damage: 15, speed: 45, color: 0x445544, size: 22, xp: 60, loot: 'fat' },
    giant: { name: 'Giant', hp: 150, damage: 25, speed: 30, color: 0x887766, size: 32, xp: 150, loot: 'toe', boss: true }
};

// Global game data
const GameData = {
    player: {
        x: WORLD_SIZE * TILE_SIZE / 2,
        y: WORLD_SIZE * TILE_SIZE / 2,
        hp: 100, maxHp: 100,
        stamina: 100, maxStamina: 100,
        magicka: 50, maxMagicka: 50,
        gold: 50,
        level: 1, xp: 0, xpToLevel: 100,
        combatSkill: 1,
        weapon: { name: 'Iron Sword', damage: 8, speed: 0.3, range: 24 },
        armor: { name: 'Leather Armor', defense: 15 },
        inventory: [],
        inDungeon: false,
        currentDungeon: null
    },
    world: [],
    npcs: [],
    dungeons: [],
    quests: { active: [], completed: [] },
    showDebug: false
};

// Boot Scene
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        this.scene.start('MenuScene');
    }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x1a2a3a);

        // Snow particles
        this.snowParticles = [];
        for (let i = 0; i < 50; i++) {
            this.snowParticles.push({
                x: Math.random() * 640,
                y: Math.random() * 360,
                speed: 20 + Math.random() * 30
            });
        }

        // Title
        this.add.text(320, 80, 'FROSTFALL', {
            fontSize: '36px',
            fontFamily: 'Courier New',
            color: '#e0e0e0',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(320, 115, 'A 2D Skyrim Demake', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#8899aa'
        }).setOrigin(0.5);

        // Line
        this.add.rectangle(320, 135, 200, 2, 0x4a5a6a);

        // Start prompt
        this.add.text(320, 180, 'Press SPACE or Click to Start', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#aabbcc'
        }).setOrigin(0.5);

        // Controls
        this.add.text(320, 240, 'WASD - Move | Click - Attack | Shift - Sprint', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#778899'
        }).setOrigin(0.5);

        this.add.text(320, 260, 'E - Interact | Tab - Inventory | Q - Debug', {
            fontSize: '12px',
            fontFamily: 'Courier New',
            color: '#778899'
        }).setOrigin(0.5);

        // Objective
        this.add.text(320, 310, 'Clear all 3 dungeons to win!', {
            fontSize: '14px',
            fontFamily: 'Courier New',
            color: '#aabbcc'
        }).setOrigin(0.5);

        // Snow graphics
        this.snowGraphics = this.add.graphics();

        // Input
        this.input.keyboard.on('keydown-SPACE', () => {
            this.startGame();
        });

        this.input.on('pointerdown', () => {
            this.startGame();
        });
    }

    update() {
        // Animate snow
        this.snowGraphics.clear();
        this.snowGraphics.fillStyle(0xffffff, 0.5);

        this.snowParticles.forEach(p => {
            p.y += p.speed * 0.016;
            p.x += Math.sin(p.y * 0.02) * 0.5;
            if (p.y > 360) {
                p.y = 0;
                p.x = Math.random() * 640;
            }
            this.snowGraphics.fillRect(p.x, p.y, 2, 2);
        });
    }

    startGame() {
        resetGameData();
        this.scene.start('GameScene');
    }
}

function resetGameData() {
    GameData.player = {
        x: WORLD_SIZE * TILE_SIZE / 2,
        y: WORLD_SIZE * TILE_SIZE / 2,
        hp: 100, maxHp: 100,
        stamina: 100, maxStamina: 100,
        magicka: 50, maxMagicka: 50,
        gold: 50,
        level: 1, xp: 0, xpToLevel: 100,
        combatSkill: 1,
        weapon: { name: 'Iron Sword', damage: 8, speed: 0.3, range: 24 },
        armor: { name: 'Leather Armor', defense: 15 },
        inventory: [],
        inDungeon: false,
        currentDungeon: null
    };
    GameData.quests = { active: [], completed: [] };
    GameData.showDebug = false;
}

// Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bg);

        // Generate world
        this.generateWorld();
        this.createNPCs();
        this.createDungeons();

        // Player state
        this.player = GameData.player;
        this.attacking = false;
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.blocking = false;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.shakeTimer = 0;
        this.flashTimer = 0;

        // Entities
        this.enemies = [];
        this.particles = [];
        this.messages = [];

        // Spawn enemies
        this.spawnWorldEnemies();

        // Graphics
        this.worldGraphics = this.add.graphics();
        this.entityGraphics = this.add.graphics();
        this.playerGraphics = this.add.graphics();
        this.hudGraphics = this.add.graphics();
        this.debugGraphics = this.add.graphics();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.keys = this.input.keyboard.addKeys('E,Q,SHIFT,SPACE,TAB,ESC,ONE,TWO,THREE');

        this.input.keyboard.on('keydown-Q', () => {
            GameData.showDebug = !GameData.showDebug;
        });

        this.input.keyboard.on('keydown-TAB', (e) => {
            e.preventDefault();
            this.scene.pause();
            this.scene.launch('InventoryScene');
        });

        this.input.keyboard.on('keydown-E', () => {
            this.interact();
        });

        this.input.keyboard.on('keydown-ESC', () => {
            // Pause handled elsewhere
        });

        this.input.keyboard.on('keydown-ONE', () => this.useQuickSlot(0));
        this.input.keyboard.on('keydown-TWO', () => this.useQuickSlot(1));
        this.input.keyboard.on('keydown-THREE', () => this.useQuickSlot(2));

        // Camera
        this.cameraX = this.player.x - 320;
        this.cameraY = this.player.y - 180;
    }

    generateWorld() {
        GameData.world = [];
        for (let y = 0; y < WORLD_SIZE; y++) {
            GameData.world[y] = [];
            for (let x = 0; x < WORLD_SIZE; x++) {
                const distFromCenter = Math.sqrt(Math.pow(x - WORLD_SIZE/2, 2) + Math.pow(y - WORLD_SIZE/2, 2));
                let tile = { type: 'grass', walkable: true, biome: 'forest' };

                if (distFromCenter < 12) {
                    tile = { type: Math.random() < 0.3 ? 'dirt' : 'grass', walkable: true, biome: 'village' };
                } else if (y > WORLD_SIZE * 0.6) {
                    tile = Math.random() < 0.15 ?
                        { type: 'tree', walkable: false, biome: 'forest' } :
                        { type: Math.random() < 0.7 ? 'grass' : 'dirt', walkable: true, biome: 'forest' };
                } else if (y < WORLD_SIZE * 0.35) {
                    tile = Math.random() < 0.08 ?
                        { type: 'tree', walkable: false, biome: 'snow' } :
                        { type: Math.random() < 0.8 ? 'snow' : 'stone', walkable: true, biome: 'snow' };
                } else if (x > WORLD_SIZE * 0.65) {
                    tile = Math.random() < 0.2 ?
                        { type: 'stone', walkable: false, biome: 'mountain' } :
                        { type: Math.random() < 0.6 ? 'stone' : 'grass', walkable: true, biome: 'mountain' };
                } else {
                    tile = Math.random() < 0.1 ?
                        { type: 'tree', walkable: false, biome: 'plains' } :
                        { type: Math.random() < 0.85 ? 'grass' : 'dirt', walkable: true, biome: 'plains' };
                }

                // Roads
                if (Math.abs(x - WORLD_SIZE/2) < 2 || Math.abs(y - WORLD_SIZE/2) < 2) {
                    tile = { type: 'dirt', walkable: true, biome: tile.biome };
                }

                GameData.world[y][x] = tile;
            }
        }

        // Buildings
        this.addBuilding(WORLD_SIZE/2 - 5, WORLD_SIZE/2 - 5, 4, 3, 'smithy');
        this.addBuilding(WORLD_SIZE/2 + 2, WORLD_SIZE/2 - 4, 3, 3, 'shop');
        this.addBuilding(WORLD_SIZE/2 - 3, WORLD_SIZE/2 + 3, 4, 3, 'inn');
    }

    addBuilding(bx, by, w, h, type) {
        for (let y = by; y < by + h; y++) {
            for (let x = bx; x < bx + w; x++) {
                if (x >= 0 && x < WORLD_SIZE && y >= 0 && y < WORLD_SIZE) {
                    GameData.world[y][x] = { type: 'building', walkable: false, biome: 'village' };
                }
            }
        }
    }

    createNPCs() {
        GameData.npcs = [
            {
                x: (WORLD_SIZE/2 - 4) * TILE_SIZE,
                y: (WORLD_SIZE/2 - 3) * TILE_SIZE,
                name: 'Alvor',
                type: 'blacksmith',
                dialogue: ['Welcome to my forge, friend.', 'Bandits took over the mine east of here.', 'Clear them out and I\'ll reward you.'],
                quest: { id: 'clear_mine', name: 'Trouble in the Mine', target: 'dungeon_forest', reward: { gold: 75, xp: 50 } }
            },
            {
                x: (WORLD_SIZE/2 + 3) * TILE_SIZE,
                y: (WORLD_SIZE/2 - 2) * TILE_SIZE,
                name: 'Lucan',
                type: 'merchant',
                dialogue: ['Welcome to Riverwood Trader!', 'Looking for supplies?']
            },
            {
                x: (WORLD_SIZE/2 - 1) * TILE_SIZE,
                y: (WORLD_SIZE/2 + 4) * TILE_SIZE,
                name: 'Farengar',
                type: 'wizard',
                dialogue: ['I study ancient Nordic ruins.', 'Bleak Falls Barrow holds secrets.', 'Explore it and I\'ll pay handsomely.'],
                quest: { id: 'clear_barrow', name: 'The Ancient Barrow', target: 'dungeon_snow', reward: { gold: 150, xp: 100 } }
            },
            {
                x: (WORLD_SIZE/2 + 5) * TILE_SIZE,
                y: (WORLD_SIZE/2) * TILE_SIZE,
                name: 'Guard Captain',
                type: 'guard',
                dialogue: ['A giant threatens the mountain pass.', 'It\'s too dangerous for my men.', 'Perhaps you could handle it.'],
                quest: { id: 'slay_giant', name: 'Giant\'s Problem', target: 'dungeon_mountain', reward: { gold: 250, xp: 150 } }
            }
        ];
    }

    createDungeons() {
        GameData.dungeons = [
            {
                id: 'dungeon_forest',
                name: 'Embershard Mine',
                worldX: WORLD_SIZE * 0.7,
                worldY: WORLD_SIZE * 0.75,
                biome: 'forest',
                enemies: ['bandit', 'bandit', 'bandit', 'banditChief'],
                boss: 'banditChief',
                cleared: false,
                rooms: this.generateDungeonRooms(5)
            },
            {
                id: 'dungeon_snow',
                name: 'Bleak Falls Barrow',
                worldX: WORLD_SIZE * 0.4,
                worldY: WORLD_SIZE * 0.2,
                biome: 'snow',
                enemies: ['draugr', 'draugr', 'frostWolf', 'draugrWight'],
                boss: 'draugrWight',
                cleared: false,
                rooms: this.generateDungeonRooms(6)
            },
            {
                id: 'dungeon_mountain',
                name: 'Giant\'s Camp',
                worldX: WORLD_SIZE * 0.85,
                worldY: WORLD_SIZE * 0.45,
                biome: 'mountain',
                enemies: ['bear', 'troll', 'giant'],
                boss: 'giant',
                cleared: false,
                rooms: this.generateDungeonRooms(4)
            }
        ];

        // Mark entrances
        GameData.dungeons.forEach(d => {
            const tx = Math.floor(d.worldX);
            const ty = Math.floor(d.worldY);
            if (GameData.world[ty] && GameData.world[ty][tx]) {
                GameData.world[ty][tx] = { type: 'dungeon_entrance', walkable: true, biome: d.biome, dungeonId: d.id };
            }
        });
    }

    generateDungeonRooms(count) {
        const rooms = [];
        let currentX = 0;
        for (let i = 0; i < count; i++) {
            const w = 12 + Math.floor(Math.random() * 8);
            const h = 8 + Math.floor(Math.random() * 4);
            rooms.push({
                x: currentX,
                y: 0,
                width: w,
                height: h,
                type: i === count - 1 ? 'boss' : 'combat'
            });
            currentX += w;
        }
        return rooms;
    }

    spawnWorldEnemies() {
        this.enemies = [];
        const biomeEnemies = {
            forest: ['wolf', 'bandit'],
            snow: ['frostWolf', 'draugr'],
            mountain: ['bear', 'troll'],
            plains: ['wolf']
        };

        for (let i = 0; i < 15; i++) {
            const x = Math.random() * WORLD_SIZE;
            const y = Math.random() * WORLD_SIZE;
            const tile = GameData.world[Math.floor(y)] && GameData.world[Math.floor(y)][Math.floor(x)];

            if (tile && tile.walkable && tile.biome !== 'village') {
                const types = biomeEnemies[tile.biome] || ['wolf'];
                const type = types[Math.floor(Math.random() * types.length)];
                this.spawnEnemy(x * TILE_SIZE, y * TILE_SIZE, type);
            }
        }
    }

    spawnEnemy(x, y, type, isBoss = false) {
        const def = ENEMY_TYPES[type];
        this.enemies.push({
            x, y, vx: 0, vy: 0,
            type, name: def.name,
            hp: def.hp, maxHp: def.hp,
            damage: def.damage,
            speed: def.speed,
            color: def.color,
            size: def.size,
            xp: def.xp,
            loot: def.loot,
            isBoss: isBoss || def.boss,
            state: 'idle',
            attackCooldown: 0
        });
    }

    interact() {
        // Check NPCs
        for (const npc of GameData.npcs) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
            if (dist < 40) {
                this.scene.pause();
                this.scene.launch('DialogueScene', { npc });
                return;
            }
        }

        // Check dungeon entrance
        const tileX = Math.floor(this.player.x / TILE_SIZE);
        const tileY = Math.floor(this.player.y / TILE_SIZE);
        const tile = GameData.world[tileY] && GameData.world[tileY][tileX];

        if (tile && tile.type === 'dungeon_entrance') {
            this.enterDungeon(tile.dungeonId);
        }

        // Check dungeon exit
        if (this.player.inDungeon && this.player.x < 20) {
            this.exitDungeon();
        }
    }

    enterDungeon(dungeonId) {
        const dungeon = GameData.dungeons.find(d => d.id === dungeonId);
        if (!dungeon) return;

        this.player.inDungeon = true;
        this.player.currentDungeon = dungeon;
        this.player.x = 32;
        this.player.y = dungeon.rooms[0].height * TILE_SIZE / 2;

        // Spawn dungeon enemies
        this.enemies = [];
        dungeon.enemies.forEach((type, i) => {
            const room = dungeon.rooms[Math.min(i, dungeon.rooms.length - 1)];
            const ex = (room.x + room.width/2 + Math.random() * 4) * TILE_SIZE;
            const ey = (room.height/2 + Math.random() * 2) * TILE_SIZE;
            this.spawnEnemy(ex, ey, type, type === dungeon.boss);
        });

        this.addMessage(`Entered ${dungeon.name}`);
    }

    exitDungeon() {
        const dungeon = this.player.currentDungeon;
        this.player.inDungeon = false;
        this.player.x = dungeon.worldX * TILE_SIZE + TILE_SIZE;
        this.player.y = dungeon.worldY * TILE_SIZE;
        this.player.currentDungeon = null;
        this.spawnWorldEnemies();
        this.addMessage('Exited dungeon');
    }

    useQuickSlot(slot) {
        const potions = this.player.inventory.filter(i => i.type === 'potion');
        if (potions[slot]) {
            if (potions[slot].effect === 'heal') {
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + potions[slot].value);
            } else if (potions[slot].effect === 'stamina') {
                this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + potions[slot].value);
            }
            this.player.inventory = this.player.inventory.filter(i => i !== potions[slot]);
            this.addMessage(`Used ${potions[slot].name}`);
        }
    }

    addMessage(text) {
        this.messages.push({ text, time: 180 });
        if (this.messages.length > 5) this.messages.shift();
    }

    update(time, delta) {
        const dt = delta / 1000;

        this.updatePlayer(dt);
        this.updateEnemies(dt);
        this.updateParticles(dt);
        this.updateCamera();

        // Update messages
        this.messages = this.messages.filter(m => {
            m.time--;
            return m.time > 0;
        });

        // Check win/lose
        if (GameData.dungeons.every(d => d.cleared)) {
            this.scene.start('VictoryScene');
        }
        if (this.player.hp <= 0) {
            this.scene.start('GameOverScene');
        }

        // Render
        this.render();
    }

    updatePlayer(dt) {
        let dx = 0, dy = 0;
        if (this.wasd.W.isDown || this.cursors.up.isDown) dy -= 1;
        if (this.wasd.S.isDown || this.cursors.down.isDown) dy += 1;
        if (this.wasd.A.isDown || this.cursors.left.isDown) dx -= 1;
        if (this.wasd.D.isDown || this.cursors.right.isDown) dx += 1;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        const sprinting = this.keys.SHIFT.isDown && this.player.stamina > 0 && (dx !== 0 || dy !== 0);
        const speed = sprinting ? 140 : 80;

        if (sprinting) {
            this.player.stamina = Math.max(0, this.player.stamina - 5 * dt);
        } else {
            this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + 10 * dt);
        }

        const newX = this.player.x + dx * speed * dt;
        const newY = this.player.y + dy * speed * dt;

        if (this.canMoveTo(newX, this.player.y)) this.player.x = newX;
        if (this.canMoveTo(this.player.x, newY)) this.player.y = newY;

        // Attack
        this.attackCooldown = Math.max(0, this.attackCooldown - dt);

        if (this.input.activePointer.isDown && !this.attacking && this.attackCooldown <= 0) {
            this.attacking = true;
            this.attackTimer = this.player.weapon.speed;
            this.player.stamina = Math.max(0, this.player.stamina - 10);

            // Damage enemies
            for (const enemy of this.enemies) {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                if (dist < this.player.weapon.range + enemy.size) {
                    const damage = this.calculateDamage();
                    enemy.hp -= damage;
                    this.spawnDamageNumber(enemy.x, enemy.y - 10, damage);
                    const angle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
                    enemy.x += Math.cos(angle) * 15;
                    enemy.y += Math.sin(angle) * 15;
                    this.shakeTimer = 0.1;
                }
            }
        }

        if (this.attacking) {
            this.attackTimer -= dt;
            if (this.attackTimer <= 0) {
                this.attacking = false;
                this.attackCooldown = 0.2;
            }
        }

        // Block
        this.blocking = this.input.activePointer.rightButtonDown() && !this.attacking;

        // Invulnerability
        if (this.invulnerable) {
            this.invulnerableTimer -= dt;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }
    }

    canMoveTo(x, y) {
        if (this.player.inDungeon) {
            return this.canMoveInDungeon(x, y);
        }

        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);

        if (tileX < 0 || tileX >= WORLD_SIZE || tileY < 0 || tileY >= WORLD_SIZE) return false;

        const tile = GameData.world[tileY][tileX];
        return tile && tile.walkable;
    }

    canMoveInDungeon(x, y) {
        if (!this.player.currentDungeon) return false;

        const dungeon = this.player.currentDungeon;
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);

        for (const room of dungeon.rooms) {
            if (tileX >= room.x && tileX < room.x + room.width) {
                const localX = tileX - room.x;
                const localY = tileY;
                if (localX > 0 && localX < room.width - 1 && localY > 0 && localY < room.height - 1) {
                    return true;
                }
                // Door
                if ((localX === 0 || localX === room.width - 1) && localY === Math.floor(room.height/2)) {
                    return true;
                }
            }
        }
        return false;
    }

    calculateDamage() {
        const skillMult = 1.0 + (this.player.combatSkill * 0.05);
        let damage = Math.floor(this.player.weapon.damage * skillMult);
        if (Math.random() < 0.1) damage *= 2;
        return damage;
    }

    updateEnemies(dt) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            const detectionRange = enemy.isBoss ? 300 : 150;

            if (enemy.state === 'idle' && dist < detectionRange) {
                enemy.state = 'chase';
            }

            if (enemy.state === 'chase') {
                if (dist > detectionRange * 2 && !this.player.inDungeon) {
                    enemy.state = 'idle';
                } else {
                    const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
                    enemy.x += Math.cos(angle) * enemy.speed * dt;
                    enemy.y += Math.sin(angle) * enemy.speed * dt;

                    enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);

                    if (dist < enemy.size + 15 && enemy.attackCooldown <= 0) {
                        if (!this.invulnerable) {
                            let damage = enemy.damage;
                            if (this.blocking) damage = Math.floor(damage * 0.3);
                            if (this.player.armor) damage = Math.max(1, damage - Math.floor(this.player.armor.defense / 2));

                            this.player.hp -= damage;
                            this.spawnDamageNumber(this.player.x, this.player.y - 10, damage, true);
                            this.invulnerable = true;
                            this.invulnerableTimer = 0.5;
                            this.shakeTimer = 0.2;
                            this.flashTimer = 0.1;
                        }
                        enemy.attackCooldown = 1.0;
                    }
                }
            }

            // Death
            if (enemy.hp <= 0) {
                this.player.xp += enemy.xp;
                this.checkLevelUp();
                this.dropLoot(enemy);

                if (enemy.isBoss && this.player.currentDungeon) {
                    this.player.currentDungeon.cleared = true;
                    const quest = GameData.quests.active.find(q => q.target === this.player.currentDungeon.id);
                    if (quest) {
                        GameData.quests.completed.push(quest);
                        GameData.quests.active = GameData.quests.active.filter(q => q !== quest);
                        this.player.gold += quest.reward.gold;
                        this.player.xp += quest.reward.xp;
                        this.addMessage(`Quest Complete: ${quest.name}!`);
                    }
                }

                // Particles
                for (let p = 0; p < 8; p++) {
                    this.particles.push({
                        x: enemy.x, y: enemy.y,
                        vx: (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        life: 0.5,
                        color: enemy.color,
                        size: 3
                    });
                }

                this.enemies.splice(i, 1);
                this.addMessage(`Defeated ${enemy.name}!`);
            }
        }
    }

    dropLoot(enemy) {
        if (enemy.loot === 'gold') {
            const amount = 5 + Math.floor(Math.random() * 15);
            this.player.gold += amount;
            this.addMessage(`Found ${amount} gold`);
        } else if (enemy.loot === 'pelt') {
            this.player.inventory.push({ name: `${enemy.name} Pelt`, type: 'misc', value: 10 });
        } else if (enemy.loot === 'weapon') {
            this.player.inventory.push({ name: 'Steel Sword', type: 'weapon', damage: 12 });
            this.addMessage('Found Steel Sword!');
        }

        if (Math.random() < 0.3) {
            this.player.inventory.push({ name: 'Health Potion', type: 'potion', effect: 'heal', value: 50 });
            this.addMessage('Found Health Potion');
        }
    }

    checkLevelUp() {
        while (this.player.xp >= this.player.xpToLevel) {
            this.player.xp -= this.player.xpToLevel;
            this.player.level++;
            this.player.combatSkill = Math.min(10, this.player.combatSkill + 1);
            this.player.maxHp += 10;
            this.player.hp = this.player.maxHp;
            this.player.xpToLevel = 100 * this.player.level;
            this.addMessage(`Level Up! Now level ${this.player.level}`);
        }
    }

    spawnDamageNumber(x, y, damage, isPlayer = false) {
        this.particles.push({
            x, y, vx: (Math.random() - 0.5) * 20, vy: -50,
            life: 1,
            text: damage.toString(),
            color: isPlayer ? 0xff4444 : 0xffff44,
            size: isPlayer ? 14 : 12
        });
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 100 * dt;
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updateCamera() {
        this.cameraX = this.player.x - 320;
        this.cameraY = this.player.y - 180;

        if (!this.player.inDungeon) {
            this.cameraX = Math.max(0, Math.min(WORLD_SIZE * TILE_SIZE - 640, this.cameraX));
            this.cameraY = Math.max(0, Math.min(WORLD_SIZE * TILE_SIZE - 360, this.cameraY));
        }

        if (this.shakeTimer > 0) {
            this.shakeTimer -= 0.016;
            this.cameraX += (Math.random() - 0.5) * 5;
            this.cameraY += (Math.random() - 0.5) * 5;
        }
    }

    render() {
        this.worldGraphics.clear();
        this.entityGraphics.clear();
        this.playerGraphics.clear();
        this.hudGraphics.clear();
        this.debugGraphics.clear();

        if (this.player.inDungeon) {
            this.renderDungeon();
        } else {
            this.renderWorld();
            this.renderNPCs();
        }

        this.renderEnemies();
        this.renderPlayer();
        this.renderParticles();
        this.renderHUD();

        // Flash effect
        if (this.flashTimer > 0) {
            this.flashTimer -= 0.016;
            this.hudGraphics.fillStyle(0xff0000, this.flashTimer * 2);
            this.hudGraphics.fillRect(0, 0, 640, 360);
        }

        if (GameData.showDebug) {
            this.renderDebug();
        }
    }

    renderWorld() {
        const startX = Math.floor(this.cameraX / TILE_SIZE) - 1;
        const startY = Math.floor(this.cameraY / TILE_SIZE) - 1;
        const endX = startX + 42;
        const endY = startY + 24;

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (x < 0 || x >= WORLD_SIZE || y < 0 || y >= WORLD_SIZE) continue;

                const tile = GameData.world[y][x];
                const screenX = x * TILE_SIZE - this.cameraX;
                const screenY = y * TILE_SIZE - this.cameraY;

                let color = COLORS.grass;
                switch (tile.type) {
                    case 'grass': color = (x + y) % 2 === 0 ? COLORS.grass : COLORS.grassDark; break;
                    case 'dirt': color = COLORS.dirt; break;
                    case 'stone': color = tile.walkable ? COLORS.stoneDark : COLORS.stone; break;
                    case 'snow': color = (x + y) % 2 === 0 ? COLORS.snow : COLORS.snowDark; break;
                    case 'tree': color = COLORS.tree; break;
                    case 'building': color = COLORS.wood; break;
                    case 'dungeon_entrance': color = 0x4a2a2a; break;
                }

                this.worldGraphics.fillStyle(color);
                this.worldGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

                if (tile.type === 'tree') {
                    this.worldGraphics.fillStyle(0x4a3a2a);
                    this.worldGraphics.fillRect(screenX + 6, screenY + 10, 4, 6);
                    this.worldGraphics.fillStyle(tile.biome === 'snow' ? 0x3a5a5a : 0x2a4a2a);
                    this.worldGraphics.fillTriangle(
                        screenX + 8, screenY,
                        screenX + 2, screenY + 12,
                        screenX + 14, screenY + 12
                    );
                }

                if (tile.type === 'dungeon_entrance') {
                    this.worldGraphics.fillStyle(0x1a0a0a);
                    this.worldGraphics.fillRect(screenX + 4, screenY + 4, 8, 8);
                }
            }
        }
    }

    renderDungeon() {
        const dungeon = this.player.currentDungeon;
        if (!dungeon) return;

        for (const room of dungeon.rooms) {
            for (let y = 0; y < room.height; y++) {
                for (let x = 0; x < room.width; x++) {
                    const worldX = (room.x + x) * TILE_SIZE;
                    const worldY = y * TILE_SIZE;
                    const screenX = worldX - this.cameraX;
                    const screenY = worldY - this.cameraY;

                    if (screenX < -TILE_SIZE || screenX > 640 || screenY < -TILE_SIZE || screenY > 360) continue;

                    const isWall = x === 0 || x === room.width - 1 || y === 0 || y === room.height - 1;
                    const isDoor = (x === room.width - 1 || x === 0) && y === Math.floor(room.height/2);

                    let color = COLORS.floor;
                    if (isWall && !isDoor) color = COLORS.wall;
                    if (isDoor) color = COLORS.wood;

                    this.worldGraphics.fillStyle(color);
                    this.worldGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                }
            }
        }

        // Exit marker
        this.hudGraphics.fillStyle(0x44aa44);
        const exitY = dungeon.rooms[0].height * TILE_SIZE / 2 - this.cameraY;
        this.debugGraphics.fillStyle(0x44aa44);
    }

    renderNPCs() {
        for (const npc of GameData.npcs) {
            const screenX = npc.x - this.cameraX;
            const screenY = npc.y - this.cameraY;

            if (screenX < -20 || screenX > 660 || screenY < -20 || screenY > 380) continue;

            // Body
            this.entityGraphics.fillStyle(COLORS.npc);
            this.entityGraphics.fillRect(screenX - 6, screenY - 12, 12, 16);

            // Head
            this.entityGraphics.fillStyle(0xddccaa);
            this.entityGraphics.fillRect(screenX - 4, screenY - 16, 8, 6);

            // Interaction prompt
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
            if (dist < 40) {
                // Draw interaction hint in HUD layer
            }
        }
    }

    renderEnemies() {
        for (const enemy of this.enemies) {
            const screenX = enemy.x - this.cameraX;
            const screenY = enemy.y - this.cameraY;

            if (screenX < -50 || screenX > 690 || screenY < -50 || screenY > 410) continue;

            // Shadow
            this.entityGraphics.fillStyle(0x000000, 0.3);
            this.entityGraphics.fillEllipse(screenX, screenY + enemy.size/2, enemy.size * 0.6, enemy.size * 0.3);

            // Body
            this.entityGraphics.fillStyle(enemy.color);
            this.entityGraphics.fillCircle(screenX, screenY, enemy.size/2);

            // Boss indicator
            if (enemy.isBoss) {
                this.entityGraphics.lineStyle(2, 0xffcc00);
                this.entityGraphics.strokeCircle(screenX, screenY, enemy.size/2 + 4);
            }

            // HP bar
            const hpPercent = enemy.hp / enemy.maxHp;
            this.entityGraphics.fillStyle(0x222222);
            this.entityGraphics.fillRect(screenX - 15, screenY - enemy.size/2 - 8, 30, 4);
            this.entityGraphics.fillStyle(hpPercent > 0.5 ? COLORS.stamina : (hpPercent > 0.25 ? 0xddaa33 : COLORS.health));
            this.entityGraphics.fillRect(screenX - 15, screenY - enemy.size/2 - 8, 30 * hpPercent, 4);
        }
    }

    renderPlayer() {
        const screenX = this.player.x - this.cameraX;
        const screenY = this.player.y - this.cameraY;

        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            return;
        }

        // Shadow
        this.playerGraphics.fillStyle(0x000000, 0.3);
        this.playerGraphics.fillEllipse(screenX, screenY + 6, 6, 3);

        // Body
        this.playerGraphics.fillStyle(COLORS.player);
        this.playerGraphics.fillRect(screenX - 6, screenY - 10, 12, 16);

        // Head
        this.playerGraphics.fillStyle(0xddccaa);
        this.playerGraphics.fillRect(screenX - 4, screenY - 14, 8, 6);

        // Weapon swing when attacking
        if (this.attacking) {
            this.playerGraphics.fillStyle(0xaaaaaa);
            this.playerGraphics.fillRect(screenX + 8, screenY - 12, 4, 20);
        }

        // Shield when blocking
        if (this.blocking) {
            this.playerGraphics.fillStyle(0x665544);
            this.playerGraphics.fillRect(screenX - 12, screenY - 6, 8, 12);
        }
    }

    renderParticles() {
        for (const p of this.particles) {
            const screenX = p.x - this.cameraX;
            const screenY = p.y - this.cameraY;

            if (p.text) {
                // Text particles rendered in HUD
            } else {
                this.entityGraphics.fillStyle(p.color);
                this.entityGraphics.fillRect(screenX - p.size/2, screenY - p.size/2, p.size, p.size);
            }
        }
    }

    renderHUD() {
        // Bottom bar
        this.hudGraphics.fillStyle(0x14141e, 0.9);
        this.hudGraphics.fillRect(0, 310, 640, 50);
        this.hudGraphics.lineStyle(1, COLORS.uiBorder);
        this.hudGraphics.strokeRect(0, 310, 640, 50);

        // Health bar
        this.hudGraphics.fillStyle(0x222222);
        this.hudGraphics.fillRect(10, 320, 120, 16);
        this.hudGraphics.fillStyle(COLORS.health);
        this.hudGraphics.fillRect(10, 320, 120 * (this.player.hp / this.player.maxHp), 16);
        this.hudGraphics.lineStyle(1, COLORS.uiBorder);
        this.hudGraphics.strokeRect(10, 320, 120, 16);

        // Stamina bar
        this.hudGraphics.fillStyle(0x222222);
        this.hudGraphics.fillRect(140, 320, 100, 12);
        this.hudGraphics.fillStyle(COLORS.stamina);
        this.hudGraphics.fillRect(140, 320, 100 * (this.player.stamina / this.player.maxStamina), 12);

        // Magicka bar
        this.hudGraphics.fillStyle(0x222222);
        this.hudGraphics.fillRect(140, 336, 100, 12);
        this.hudGraphics.fillStyle(COLORS.magicka);
        this.hudGraphics.fillRect(140, 336, 100 * (this.player.magicka / this.player.maxMagicka), 12);

        // Quick slots
        for (let i = 0; i < 3; i++) {
            this.hudGraphics.fillStyle(0x333333);
            this.hudGraphics.fillRect(260 + i * 36, 318, 32, 32);
            this.hudGraphics.lineStyle(1, COLORS.uiBorder);
            this.hudGraphics.strokeRect(260 + i * 36, 318, 32, 32);

            const potions = this.player.inventory.filter(item => item.type === 'potion');
            if (potions[i]) {
                this.hudGraphics.fillStyle(potions[i].effect === 'heal' ? COLORS.health : COLORS.stamina);
                this.hudGraphics.fillCircle(276 + i * 36, 334, 10);
            }
        }

        // Minimap
        this.renderMinimap();
    }

    renderMinimap() {
        const mapX = 570;
        const mapY = 10;
        const mapSize = 60;

        this.hudGraphics.fillStyle(0x14141e, 0.8);
        this.hudGraphics.fillRect(mapX, mapY, mapSize, mapSize);
        this.hudGraphics.lineStyle(1, COLORS.uiBorder);
        this.hudGraphics.strokeRect(mapX, mapY, mapSize, mapSize);

        if (!this.player.inDungeon) {
            const scale = mapSize / WORLD_SIZE;

            // Dungeons
            for (const d of GameData.dungeons) {
                this.hudGraphics.fillStyle(d.cleared ? 0x44aa44 : 0xaa4444);
                this.hudGraphics.fillRect(mapX + d.worldX * scale - 2, mapY + d.worldY * scale - 2, 4, 4);
            }

            // Player
            this.hudGraphics.fillStyle(0xffffff);
            this.hudGraphics.fillRect(mapX + (this.player.x / TILE_SIZE) * scale - 1, mapY + (this.player.y / TILE_SIZE) * scale - 1, 3, 3);
        }
    }

    renderDebug() {
        this.debugGraphics.fillStyle(0x000000, 0.8);
        this.debugGraphics.fillRect(5, 5, 180, 200);

        // Text rendered separately since Phaser graphics can't do text
        // For simplicity, we'll skip actual text and just show the panel
    }
}

// Inventory Scene
class InventoryScene extends Phaser.Scene {
    constructor() {
        super('InventoryScene');
    }

    create() {
        // Darken background
        this.add.rectangle(320, 180, 640, 360, 0x000000, 0.7);

        // Panel
        this.add.rectangle(320, 180, 440, 260, COLORS.ui);
        this.add.rectangle(320, 180, 440, 260, 0x000000, 0).setStrokeStyle(2, COLORS.uiBorder);

        // Title
        this.add.text(320, 60, 'INVENTORY', {
            fontSize: '16px',
            fontFamily: 'Courier New',
            color: '#e0e0e0',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Equipment
        this.add.text(115, 90, `Weapon: ${GameData.player.weapon ? GameData.player.weapon.name : 'None'}`, {
            fontSize: '12px', fontFamily: 'Courier New', color: '#e0e0e0'
        });
        this.add.text(115, 110, `Armor: ${GameData.player.armor ? GameData.player.armor.name : 'None'}`, {
            fontSize: '12px', fontFamily: 'Courier New', color: '#e0e0e0'
        });

        // Stats
        this.add.text(115, 150, `Damage: ${GameData.player.weapon ? GameData.player.weapon.damage : 0}`, {
            fontSize: '12px', fontFamily: 'Courier New', color: '#e0e0e0'
        });
        this.add.text(115, 170, `Defense: ${GameData.player.armor ? GameData.player.armor.defense : 0}`, {
            fontSize: '12px', fontFamily: 'Courier New', color: '#e0e0e0'
        });
        this.add.text(115, 190, `Level: ${GameData.player.level}`, {
            fontSize: '12px', fontFamily: 'Courier New', color: '#e0e0e0'
        });
        this.add.text(115, 210, `Gold: ${GameData.player.gold}`, {
            fontSize: '12px', fontFamily: 'Courier New', color: '#ddaa33'
        });

        // Items
        this.add.text(350, 90, 'ITEMS:', {
            fontSize: '12px', fontFamily: 'Courier New', color: '#8888aa'
        });

        GameData.player.inventory.slice(0, 10).forEach((item, i) => {
            this.add.text(350, 110 + i * 16, item.name, {
                fontSize: '11px', fontFamily: 'Courier New', color: '#e0e0e0'
            });
        });

        // Close hint
        this.add.text(320, 295, 'Press TAB or ESC to close', {
            fontSize: '11px', fontFamily: 'Courier New', color: '#8888aa'
        }).setOrigin(0.5);

        // Input
        this.input.keyboard.on('keydown-TAB', () => {
            this.scene.stop();
            this.scene.resume('GameScene');
        });

        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.stop();
            this.scene.resume('GameScene');
        });
    }
}

// Dialogue Scene
class DialogueScene extends Phaser.Scene {
    constructor() {
        super('DialogueScene');
    }

    init(data) {
        this.npc = data.npc;
        this.dialogueIndex = 0;
    }

    create() {
        // Dialogue box
        this.add.rectangle(320, 290, 540, 120, COLORS.ui, 0.95);
        this.add.rectangle(320, 290, 540, 120, 0x000000, 0).setStrokeStyle(2, COLORS.uiBorder);

        // NPC portrait
        this.add.rectangle(80, 270, 60, 60, 0x333333);
        this.add.rectangle(80, 270, 40, 40, COLORS.npc);

        // NPC name
        this.add.text(130, 240, this.npc.name, {
            fontSize: '14px', fontFamily: 'Courier New', color: '#ddaa33', fontStyle: 'bold'
        });

        // Dialogue text
        this.dialogueText = this.add.text(130, 265, this.npc.dialogue[0], {
            fontSize: '12px', fontFamily: 'Courier New', color: '#e0e0e0'
        });

        // Continue prompt
        this.add.text(130, 320, 'Press E to continue', {
            fontSize: '10px', fontFamily: 'Courier New', color: '#8888aa'
        });

        // Input
        this.input.keyboard.on('keydown-E', () => {
            this.advanceDialogue();
        });

        this.input.keyboard.on('keydown-ESC', () => {
            this.closeDialogue();
        });
    }

    advanceDialogue() {
        this.dialogueIndex++;

        if (this.dialogueIndex >= this.npc.dialogue.length) {
            // Give quest if available
            if (this.npc.quest && !GameData.quests.active.find(q => q.id === this.npc.quest.id) &&
                !GameData.quests.completed.find(q => q.id === this.npc.quest.id)) {
                GameData.quests.active.push(this.npc.quest);
            }
            this.closeDialogue();
        } else {
            this.dialogueText.setText(this.npc.dialogue[this.dialogueIndex]);
        }
    }

    closeDialogue() {
        this.scene.stop();
        this.scene.resume('GameScene');
    }
}

// Game Over Scene
class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x1a0a0a);

        this.add.text(320, 140, 'YOU DIED', {
            fontSize: '36px', fontFamily: 'Courier New', color: '#cc3333', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(320, 200, `Level: ${GameData.player.level}`, {
            fontSize: '14px', fontFamily: 'Courier New', color: '#e0e0e0'
        }).setOrigin(0.5);

        this.add.text(320, 225, `Dungeons Cleared: ${GameData.dungeons.filter(d => d.cleared).length}/3`, {
            fontSize: '14px', fontFamily: 'Courier New', color: '#e0e0e0'
        }).setOrigin(0.5);

        this.add.text(320, 280, 'Press R to restart', {
            fontSize: '14px', fontFamily: 'Courier New', color: '#8888aa'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-R', () => {
            this.scene.start('MenuScene');
        });
    }
}

// Victory Scene
class VictoryScene extends Phaser.Scene {
    constructor() {
        super('VictoryScene');
    }

    create() {
        this.cameras.main.setBackgroundColor(0x1a2a1a);

        this.add.text(320, 120, 'VICTORY!', {
            fontSize: '36px', fontFamily: 'Courier New', color: '#44cc44', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(320, 170, 'You have cleared all dungeons!', {
            fontSize: '16px', fontFamily: 'Courier New', color: '#e0e0e0'
        }).setOrigin(0.5);

        this.add.text(320, 210, `Final Level: ${GameData.player.level}`, {
            fontSize: '14px', fontFamily: 'Courier New', color: '#e0e0e0'
        }).setOrigin(0.5);

        this.add.text(320, 235, `Gold Collected: ${GameData.player.gold}`, {
            fontSize: '14px', fontFamily: 'Courier New', color: '#ddaa33'
        }).setOrigin(0.5);

        this.add.text(320, 290, 'Press R to play again', {
            fontSize: '14px', fontFamily: 'Courier New', color: '#8888aa'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-R', () => {
            this.scene.start('MenuScene');
        });
    }
}

// Game config - defined after all scenes
const config = {
    type: Phaser.CANVAS,
    width: 640,
    height: 360,
    parent: 'game-container',
    pixelArt: true,
    scene: [BootScene, MenuScene, GameScene, InventoryScene, DialogueScene, GameOverScene, VictoryScene]
};

// Start game
const game = new Phaser.Game(config);
