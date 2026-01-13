// Binding of Isaac Clone - Phaser 3
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const ROOM_WIDTH = 13;
const ROOM_HEIGHT = 7;
const TILE_SIZE = 48;
const ROOM_OFFSET_X = (GAME_WIDTH - ROOM_WIDTH * TILE_SIZE) / 2;
const ROOM_OFFSET_Y = 80;

let gameState = 'playing'; // AUTO-START: Skip menu
let gamePaused = new URLSearchParams(location.search).has('test');
let currentFloor = 1;

// Colors
const COLORS = {
    floor: 0x3d2817,
    wall: 0x2a1810,
    door: 0x5a4030,
    doorLocked: 0x8b0000,
    player: 0xffccaa,
    tear: 0x88ccff,
    enemy: 0x884422,
    item: 0xffff00,
    heart: 0xff4444,
    bomb: 0x333333,
    key: 0xffcc00,
    coin: 0xffdd44
};

// Room types
const ROOM_TYPES = {
    NORMAL: 'normal',
    TREASURE: 'treasure',
    SHOP: 'shop',
    BOSS: 'boss',
    START: 'start',
    SACRIFICE: 'sacrifice',
    CURSE: 'curse'
};

// Enemy types
const ENEMY_TYPES = {
    fly: { hp: 4, damage: 1, speed: 80, color: 0x444444, behavior: 'chase', size: 12 },
    gaper: { hp: 12, damage: 1, speed: 60, color: 0xaa8866, behavior: 'chase', size: 18 },
    pooter: { hp: 8, damage: 1, speed: 40, color: 0x664422, behavior: 'shoot', size: 16 },
    hopper: { hp: 6, damage: 1, speed: 100, color: 0x556644, behavior: 'hop', size: 14 },
    boss_monstro: { hp: 200, damage: 2, speed: 50, color: 0x996666, behavior: 'boss', size: 40 }
};

// Items - Expanded pool (50+ items)
const ITEMS = {
    // === DAMAGE UPS ===
    sad_onion: { name: 'Sad Onion', type: 'passive', effect: { tears: -1 }, desc: 'Tears up!' },
    inner_eye: { name: 'Inner Eye', type: 'passive', effect: { tears: 3, multishot: 3 }, desc: 'Triple shot' },
    magic_mushroom: { name: 'Magic Mushroom', type: 'passive', effect: { damage: 1.5, hp: 1 }, desc: 'All stats up!' },
    polyphemus: { name: 'Polyphemus', type: 'passive', effect: { damage: 4, tears: 4 }, desc: 'Mega tears!' },
    pentagram: { name: 'Pentagram', type: 'passive', effect: { damage: 1 }, desc: 'Damage up!' },
    blood_of_martyr: { name: 'Blood of the Martyr', type: 'passive', effect: { damage: 1 }, desc: 'Damage up!' },
    jesus_juice: { name: 'Jesus Juice', type: 'passive', effect: { damage: 0.5, range: 0.5 }, desc: 'Damage + range up' },
    max_brass: { name: "Max's Head", type: 'passive', effect: { damage: 1.5 }, desc: 'DMG up!' },
    stigmata: { name: 'Stigmata', type: 'passive', effect: { damage: 0.3, hp: 1 }, desc: 'DMG + HP up' },
    growth_hormones: { name: 'Growth Hormones', type: 'passive', effect: { damage: 1, speed: 0.4 }, desc: 'DMG + Speed up' },

    // === HEALTH UPS ===
    lunch: { name: 'Lunch', type: 'passive', effect: { hp: 1 }, desc: 'HP up' },
    dinner: { name: 'Dinner', type: 'passive', effect: { hp: 1 }, desc: 'HP up' },
    raw_liver: { name: 'Raw Liver', type: 'passive', effect: { hp: 2 }, desc: 'HP up x2' },
    breakfast: { name: 'Breakfast', type: 'passive', effect: { hp: 1 }, desc: 'HP up' },
    dessert: { name: 'Dessert', type: 'passive', effect: { hp: 1 }, desc: 'HP up' },
    rotten_meat: { name: 'Rotten Meat', type: 'passive', effect: { hp: 1 }, desc: 'HP up' },
    super_bandage: { name: 'Super Bandage', type: 'passive', effect: { hp: 2, soulHeart: 2 }, desc: 'HP + Soul hearts' },
    odd_mushroom: { name: 'Odd Mushroom', type: 'passive', effect: { hp: 1, speed: -0.1 }, desc: 'HP up, speed down' },

    // === SPEED UPS ===
    belt: { name: 'The Belt', type: 'passive', effect: { speed: 0.3 }, desc: 'Speed up!' },
    cat_o_nine: { name: 'Cat-o-nine-tails', type: 'passive', effect: { damage: 0.5, shotSpeed: 0.5 }, desc: 'DMG + shot speed up' },
    spoon_bender: { name: 'Spoon Bender', type: 'passive', effect: { homing: true }, desc: 'Homing tears!' },
    pony: { name: 'The Pony', type: 'passive', effect: { speed: 0.5, flying: true }, desc: 'Speed up + flying!' },
    wooden_spoon: { name: 'Wooden Spoon', type: 'passive', effect: { speed: 0.3 }, desc: 'Speed up!' },
    moms_heels: { name: "Mom's Heels", type: 'passive', effect: { range: 1.5, speed: 0.2 }, desc: 'Range + speed up' },

    // === RANGE UPS ===
    cupids_arrow: { name: "Cupid's Arrow", type: 'passive', effect: { piercing: true, range: 2 }, desc: 'Piercing tears!' },
    moms_lipstick: { name: "Mom's Lipstick", type: 'passive', effect: { range: 1.5 }, desc: 'Range up!' },
    magneto: { name: 'Magneto', type: 'passive', effect: { range: 1, magnetPickups: true }, desc: 'Range up + attract pickups' },
    distant_admiration: { name: 'Distant Admiration', type: 'passive', effect: { range: 2, orbitalFly: true }, desc: 'Orbital fly friend' },

    // === SPECIAL TRANSFORMATIVES ===
    brimstone: { name: 'Brimstone', type: 'passive', effect: { brimstone: true, damage: 3 }, desc: 'Blood laser!' },
    tech: { name: 'Technology', type: 'passive', effect: { tech: true, damage: 1 }, desc: 'Laser tears!' },
    moms_knife: { name: "Mom's Knife", type: 'passive', effect: { knife: true, damage: 6 }, desc: 'Deadly knife!' },
    epic_fetus: { name: 'Epic Fetus', type: 'passive', effect: { missile: true, damage: 20 }, desc: 'Air strike tears!' },
    ipecac: { name: 'Ipecac', type: 'passive', effect: { poison: true, damage: 4, tears: 2 }, desc: 'Explosive poison tears' },
    sacred_heart: { name: 'Sacred Heart', type: 'passive', effect: { damage: 2.3, homing: true, hp: 1 }, desc: 'Holy homing tears!' },

    // === UTILITY ===
    compass: { name: 'Compass', type: 'passive', effect: { revealMap: true }, desc: 'Reveal special rooms' },
    treasure_map: { name: 'Treasure Map', type: 'passive', effect: { revealMap: true }, desc: 'Reveal floor layout' },
    xray_vision: { name: 'X-Ray Vision', type: 'passive', effect: { seeSecretRooms: true }, desc: 'See secret rooms!' },
    nine_volt: { name: '9 Volt', type: 'passive', effect: { chargeReduction: 1 }, desc: 'Faster active item charge' },
    battery: { name: 'The Battery', type: 'passive', effect: { doubleCharge: true }, desc: 'Double active item charge' },

    // === SOUL HEARTS ===
    mitre: { name: 'Mitre', type: 'passive', effect: { soulHeartChance: 0.33 }, desc: 'Chance for soul hearts' },
    rosary: { name: 'Rosary', type: 'passive', effect: { soulHeart: 3 }, desc: '+3 soul hearts' },
    dead_dove: { name: 'Dead Dove', type: 'passive', effect: { spectral: true, flying: true }, desc: 'Flight + spectral tears!' },

    // === ACTIVE ITEMS ===
    book_of_belial: { name: 'Book of Belial', type: 'active', charges: 3, effect: { tempDamage: 2 }, desc: '+2 damage this room' },
    yum_heart: { name: 'Yum Heart', type: 'active', charges: 4, effect: { heal: 1 }, desc: 'Heal 1 heart' },
    nail: { name: 'The Nail', type: 'active', charges: 6, effect: { tempDamage: 0.7, soulHeart: 1 }, desc: 'DMG up + soul heart' },
    guppys_head: { name: "Guppy's Head", type: 'active', charges: 1, effect: { spawnFlies: 4 }, desc: 'Spawn 4 flies' },
    tammy_head: { name: "Tammy's Head", type: 'active', charges: 1, effect: { burstTears: 10 }, desc: 'Fire tears in all directions' },
    necronomicon: { name: 'Necronomicon', type: 'active', charges: 6, effect: { damageAll: 40 }, desc: 'Damage all enemies' },
    bobs_rotten_head: { name: "Bob's Rotten Head", type: 'active', charges: 3, effect: { throwBomb: true }, desc: 'Throw a poison bomb' },
    anarchist_cookbook: { name: 'Anarchist Cookbook', type: 'active', charges: 3, effect: { spawnBombs: 6 }, desc: 'Spawn troll bombs' },
    d6: { name: 'D6', type: 'active', charges: 6, effect: { rerollItems: true }, desc: 'Reroll item pedestals' },
    d20: { name: 'D20', type: 'active', charges: 6, effect: { rerollPickups: true }, desc: 'Reroll all pickups' }
};

// Item pools for different rooms
const ITEM_POOLS = {
    treasure: ['sad_onion', 'inner_eye', 'magic_mushroom', 'polyphemus', 'cupids_arrow', 'spoon_bender',
               'moms_knife', 'epic_fetus', 'tech', 'brimstone', 'sacred_heart', 'compass', 'treasure_map',
               'belt', 'pony', 'dead_dove', 'ipecac', 'pentagram', 'growth_hormones'],
    boss: ['lunch', 'dinner', 'breakfast', 'dessert', 'raw_liver', 'super_bandage', 'stigmata',
           'jesus_juice', 'blood_of_martyr', 'wooden_spoon', 'moms_heels', 'moms_lipstick'],
    shop: ['belt', 'nine_volt', 'battery', 'compass', 'map', 'magneto', 'cat_o_nine', 'odd_mushroom',
           'mitre', 'rosary', 'd6', 'd20', 'book_of_belial', 'yum_heart'],
    devil: ['brimstone', 'moms_knife', 'pentagram', 'max_brass', 'necronomicon', 'nail', 'guppys_head'],
    angel: ['sacred_heart', 'dead_dove', 'mitre', 'rosary', 'super_bandage']
};

// Floor generator
class FloorGenerator {
    static generate(floorNum) {
        const rooms = new Map();
        const numRooms = 6 + Math.floor(floorNum * 1.5);

        // Start room at center
        rooms.set('0,0', { type: ROOM_TYPES.START, x: 0, y: 0, cleared: true, enemies: [] });

        // Generate connected rooms
        const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        const openList = [[0, 0]];
        let roomCount = 1;

        while (roomCount < numRooms && openList.length > 0) {
            const [cx, cy] = openList[Math.floor(Math.random() * openList.length)];

            for (const [dx, dy] of directions) {
                const nx = cx + dx;
                const ny = cy + dy;
                const key = `${nx},${ny}`;

                if (!rooms.has(key) && roomCount < numRooms) {
                    rooms.set(key, { type: ROOM_TYPES.NORMAL, x: nx, y: ny, cleared: false, enemies: [] });
                    openList.push([nx, ny]);
                    roomCount++;
                }
            }

            openList.splice(openList.indexOf(openList.find(p => p[0] === cx && p[1] === cy)), 1);
        }

        // Assign special rooms to dead ends
        const deadEnds = [];
        for (const [key, room] of rooms) {
            if (room.type === ROOM_TYPES.START) continue;
            let neighbors = 0;
            for (const [dx, dy] of directions) {
                if (rooms.has(`${room.x + dx},${room.y + dy}`)) neighbors++;
            }
            if (neighbors === 1) deadEnds.push(key);
        }

        // Boss room (furthest dead end)
        if (deadEnds.length > 0) {
            let furthest = deadEnds[0];
            let maxDist = 0;
            for (const key of deadEnds) {
                const room = rooms.get(key);
                const dist = Math.abs(room.x) + Math.abs(room.y);
                if (dist > maxDist) {
                    maxDist = dist;
                    furthest = key;
                }
            }
            rooms.get(furthest).type = ROOM_TYPES.BOSS;
            deadEnds.splice(deadEnds.indexOf(furthest), 1);
        }

        // Treasure room
        if (deadEnds.length > 0) {
            const treasureKey = deadEnds.splice(Math.floor(Math.random() * deadEnds.length), 1)[0];
            rooms.get(treasureKey).type = ROOM_TYPES.TREASURE;
        }

        // Shop
        if (deadEnds.length > 0) {
            const shopKey = deadEnds.splice(Math.floor(Math.random() * deadEnds.length), 1)[0];
            rooms.get(shopKey).type = ROOM_TYPES.SHOP;
        }

        // Sacrifice room (20% chance)
        if (deadEnds.length > 0 && Math.random() < 0.2) {
            const sacrificeKey = deadEnds.splice(Math.floor(Math.random() * deadEnds.length), 1)[0];
            rooms.get(sacrificeKey).type = ROOM_TYPES.SACRIFICE;
        }

        // Curse room (30% chance)
        if (deadEnds.length > 0 && Math.random() < 0.3) {
            const curseKey = deadEnds.splice(Math.floor(Math.random() * deadEnds.length), 1)[0];
            rooms.get(curseKey).type = ROOM_TYPES.CURSE;
        }

        // Generate enemies for normal rooms
        for (const [key, room] of rooms) {
            if (room.type === ROOM_TYPES.NORMAL) {
                room.enemies = this.generateEnemies(floorNum);
            } else if (room.type === ROOM_TYPES.BOSS) {
                room.enemies = [{ type: 'boss_monstro', x: 6, y: 3 }];
            }
        }

        return rooms;
    }

    static generateEnemies(floorNum) {
        const enemies = [];
        const count = 2 + Math.floor(Math.random() * 3) + Math.floor(floorNum / 2);
        const types = ['fly', 'fly', 'gaper', 'hopper'];
        if (floorNum >= 2) types.push('pooter');

        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            enemies.push({
                type,
                x: 2 + Math.floor(Math.random() * (ROOM_WIDTH - 4)),
                y: 1 + Math.floor(Math.random() * (ROOM_HEIGHT - 2))
            });
        }
        return enemies;
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Player stats
        this.playerStats = {
            maxHearts: 3,
            hearts: 3,
            soulHearts: 0,
            damage: 3.5,
            tearDelay: 10,
            range: 150,
            shotSpeed: 300,
            speed: 150,
            bombs: 1,
            keys: 1,
            coins: 0
        };

        this.inventory = {
            passive: [],
            active: null,
            activeCharges: 0
        };

        // Game objects
        this.tears = [];
        this.enemies = [];
        this.pickups = [];
        this.itemPedestals = [];

        // Room state
        this.floor = null;
        this.currentRoomKey = '0,0';
        this.doorsOpen = true;

        // Combat
        this.fireCooldown = 0;
        this.invincibleTime = 0;

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            fireUp: Phaser.Input.Keyboard.KeyCodes.UP,
            fireDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
            fireLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
            fireRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            bomb: Phaser.Input.Keyboard.KeyCodes.E,
            item: Phaser.Input.Keyboard.KeyCodes.SPACE,
            pill: Phaser.Input.Keyboard.KeyCodes.Q
        });

        // Graphics
        this.roomGraphics = this.add.graphics();
        this.player = this.add.graphics();

        // Generate floor
        this.generateNewFloor();

        // Create UI
        this.createUI();

        // Start paused
        gameState = 'playing';
        // gamePaused stays as set by URL param

        this.initHarness();
    }

    generateNewFloor() {
        this.floor = FloorGenerator.generate(currentFloor);
        this.currentRoomKey = '0,0';
        this.loadRoom(this.currentRoomKey);

        // Player position
        this.player.x = ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2;
        this.player.y = ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2;
        this.playerDir = { x: 0, y: 1 };
    }

    loadRoom(roomKey) {
        const room = this.floor.get(roomKey);
        if (!room) return;

        // Clear entities
        this.tears.forEach(t => t.sprite?.destroy());
        this.enemies.forEach(e => e.sprite?.destroy());
        this.pickups.forEach(p => p.sprite?.destroy());
        this.itemPedestals.forEach(i => i.sprite?.destroy());

        this.tears = [];
        this.enemies = [];
        this.pickups = [];
        this.itemPedestals = [];

        // Draw room
        this.drawRoom(room);

        // Spawn enemies if not cleared
        if (!room.cleared && room.enemies) {
            room.enemies.forEach(e => this.spawnEnemy(e.type, e.x, e.y));
        }

        // Add items for treasure room
        if (room.type === ROOM_TYPES.TREASURE && !room.cleared) {
            this.spawnItemPedestal(6, 3);
        }

        // Add items for shop
        if (room.type === ROOM_TYPES.SHOP && !room.cleared) {
            this.spawnShopItem(4, 3, 15);
            this.spawnShopItem(6, 3, 15);
            this.spawnShopItem(8, 3, 15);
        }

        // Update doors
        this.doorsOpen = room.cleared || this.enemies.length === 0;
    }

    drawRoom(room) {
        const g = this.roomGraphics;
        g.clear();

        // Floor
        g.fillStyle(COLORS.floor, 1);
        g.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, ROOM_WIDTH * TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);

        // Walls
        g.fillStyle(COLORS.wall, 1);
        // Top wall
        g.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y - TILE_SIZE, ROOM_WIDTH * TILE_SIZE, TILE_SIZE);
        // Bottom wall
        g.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE, ROOM_WIDTH * TILE_SIZE, TILE_SIZE);
        // Left wall
        g.fillRect(ROOM_OFFSET_X - TILE_SIZE, ROOM_OFFSET_Y - TILE_SIZE, TILE_SIZE, (ROOM_HEIGHT + 2) * TILE_SIZE);
        // Right wall
        g.fillRect(ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE, ROOM_OFFSET_Y - TILE_SIZE, TILE_SIZE, (ROOM_HEIGHT + 2) * TILE_SIZE);

        // Doors
        const directions = [
            { dx: 0, dy: -1, x: 6, y: -0.5, dir: 'up' },
            { dx: 0, dy: 1, x: 6, y: 7, dir: 'down' },
            { dx: -1, dy: 0, x: -0.5, y: 3, dir: 'left' },
            { dx: 1, dy: 0, x: 13, y: 3, dir: 'right' }
        ];

        directions.forEach(d => {
            const neighborKey = `${room.x + d.dx},${room.y + d.dy}`;
            if (this.floor.has(neighborKey)) {
                const doorColor = this.doorsOpen ? COLORS.door : COLORS.doorLocked;
                g.fillStyle(doorColor, 1);
                g.fillRect(
                    ROOM_OFFSET_X + d.x * TILE_SIZE,
                    ROOM_OFFSET_Y + d.y * TILE_SIZE,
                    TILE_SIZE, TILE_SIZE
                );
            }
        });

        // Room type indicator
        if (room.type === ROOM_TYPES.TREASURE) {
            g.fillStyle(0xffff00, 0.2);
            g.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, ROOM_WIDTH * TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);
        } else if (room.type === ROOM_TYPES.BOSS) {
            g.fillStyle(0xff0000, 0.2);
            g.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, ROOM_WIDTH * TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);
        } else if (room.type === ROOM_TYPES.SHOP) {
            g.fillStyle(0x00ff00, 0.2);
            g.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, ROOM_WIDTH * TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);
        } else if (room.type === ROOM_TYPES.SACRIFICE) {
            g.fillStyle(0x880000, 0.3);
            g.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, ROOM_WIDTH * TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);
            // Draw spikes in center
            this.drawSpikes(g, ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2 - 24, ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2 - 24);
        } else if (room.type === ROOM_TYPES.CURSE) {
            g.fillStyle(0x550055, 0.3);
            g.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, ROOM_WIDTH * TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);
        }
    }

    drawSpikes(g, x, y) {
        g.fillStyle(0x888888, 1);
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                g.fillTriangle(
                    x + i * 16, y + j * 16 + 16,
                    x + i * 16 + 8, y + j * 16,
                    x + i * 16 + 16, y + j * 16 + 16
                );
            }
        }
    }

    drawPlayer() {
        this.player.clear();

        // Body
        this.player.fillStyle(COLORS.player, 1);
        this.player.fillCircle(0, 0, 16);

        // Face direction
        const eyeX = this.playerDir.x * 6;
        const eyeY = this.playerDir.y * 6 - 2;
        this.player.fillStyle(0x000000, 1);
        this.player.fillCircle(eyeX - 3, eyeY, 3);
        this.player.fillCircle(eyeX + 3, eyeY, 3);

        // Flash if invincible
        if (this.invincibleTime > 0 && Math.floor(this.invincibleTime / 100) % 2 === 0) {
            this.player.fillStyle(0xffffff, 0.5);
            this.player.fillCircle(0, 0, 18);
        }
    }

    spawnEnemy(type, gridX, gridY) {
        const data = ENEMY_TYPES[type];
        if (!data) return;

        const enemy = {
            type,
            x: ROOM_OFFSET_X + gridX * TILE_SIZE + TILE_SIZE / 2,
            y: ROOM_OFFSET_Y + gridY * TILE_SIZE + TILE_SIZE / 2,
            health: data.hp,
            maxHealth: data.hp,
            damage: data.damage,
            speed: data.speed,
            color: data.color,
            behavior: data.behavior,
            size: data.size,
            attackCooldown: 0,
            spawnAnim: 30, // Spawn animation frames
            sprite: this.add.graphics()
        };

        this.drawEnemy(enemy);
        this.enemies.push(enemy);
    }

    drawEnemy(enemy) {
        enemy.sprite.clear();
        enemy.sprite.x = enemy.x;
        enemy.sprite.y = enemy.y;

        // Spawn animation
        const scale = enemy.spawnAnim > 0 ? (30 - enemy.spawnAnim) / 30 : 1;

        enemy.sprite.fillStyle(enemy.color, 1);
        enemy.sprite.fillCircle(0, 0, enemy.size * scale);

        // Health bar for bosses
        if (enemy.type.includes('boss')) {
            enemy.sprite.fillStyle(0x333333, 1);
            enemy.sprite.fillRect(-30, -enemy.size - 10, 60, 6);
            const hp = enemy.health / enemy.maxHealth;
            enemy.sprite.fillStyle(0xff0000, 1);
            enemy.sprite.fillRect(-30, -enemy.size - 10, 60 * hp, 6);
        }
    }

    spawnItemPedestal(gridX, gridY) {
        const itemKeys = Object.keys(ITEMS).filter(k => ITEMS[k].type === 'passive');
        const itemKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
        const item = ITEMS[itemKey];

        const pedestal = {
            x: ROOM_OFFSET_X + gridX * TILE_SIZE + TILE_SIZE / 2,
            y: ROOM_OFFSET_Y + gridY * TILE_SIZE + TILE_SIZE / 2,
            itemKey,
            item,
            price: 0,
            sprite: this.add.graphics()
        };

        pedestal.sprite.x = pedestal.x;
        pedestal.sprite.y = pedestal.y;
        pedestal.sprite.fillStyle(0x888888, 1);
        pedestal.sprite.fillRect(-16, 8, 32, 8);
        pedestal.sprite.fillStyle(0xffff00, 1);
        pedestal.sprite.fillCircle(0, 0, 12);

        // Item name
        pedestal.text = this.add.text(pedestal.x, pedestal.y - 30, item.name, {
            fontSize: '12px',
            fill: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.itemPedestals.push(pedestal);
    }

    spawnShopItem(gridX, gridY, price) {
        const itemKeys = Object.keys(ITEMS);
        const itemKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
        const item = ITEMS[itemKey];

        const pedestal = {
            x: ROOM_OFFSET_X + gridX * TILE_SIZE + TILE_SIZE / 2,
            y: ROOM_OFFSET_Y + gridY * TILE_SIZE + TILE_SIZE / 2,
            itemKey,
            item,
            price,
            sprite: this.add.graphics()
        };

        pedestal.sprite.x = pedestal.x;
        pedestal.sprite.y = pedestal.y;
        pedestal.sprite.fillStyle(0x888888, 1);
        pedestal.sprite.fillRect(-16, 8, 32, 8);
        pedestal.sprite.fillStyle(0x00ff00, 1);
        pedestal.sprite.fillCircle(0, 0, 12);

        pedestal.text = this.add.text(pedestal.x, pedestal.y - 30, `${item.name} ($${price})`, {
            fontSize: '10px',
            fill: '#ffff00',
            backgroundColor: '#000000aa',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.itemPedestals.push(pedestal);
    }

    spawnPickup(x, y, type) {
        const pickup = {
            x, y, type,
            sprite: this.add.graphics()
        };

        pickup.sprite.x = x;
        pickup.sprite.y = y;

        switch (type) {
            case 'heart':
                pickup.sprite.fillStyle(COLORS.heart, 1);
                pickup.sprite.fillCircle(0, 0, 8);
                break;
            case 'coin':
                pickup.sprite.fillStyle(COLORS.coin, 1);
                pickup.sprite.fillCircle(0, 0, 6);
                break;
            case 'bomb':
                pickup.sprite.fillStyle(COLORS.bomb, 1);
                pickup.sprite.fillCircle(0, 0, 8);
                break;
            case 'key':
                pickup.sprite.fillStyle(COLORS.key, 1);
                pickup.sprite.fillRect(-4, -8, 8, 16);
                break;
        }

        this.pickups.push(pickup);
    }

    fireTear(dx, dy) {
        if (this.fireCooldown > 0) return;

        this.fireCooldown = this.playerStats.tearDelay * 16; // Convert to ms

        const tear = {
            x: this.player.x,
            y: this.player.y,
            vx: dx * this.playerStats.shotSpeed,
            vy: dy * this.playerStats.shotSpeed,
            damage: this.playerStats.damage,
            range: this.playerStats.range,
            traveled: 0,
            sprite: this.add.graphics()
        };

        tear.sprite.fillStyle(COLORS.tear, 1);
        tear.sprite.fillCircle(0, 0, 8);
        tear.sprite.x = tear.x;
        tear.sprite.y = tear.y;

        this.tears.push(tear);

        // Update player direction
        this.playerDir = { x: dx, y: dy };
    }

    collectItem(pedestal) {
        const item = pedestal.item;

        // Check if can afford
        if (pedestal.price > 0 && this.playerStats.coins < pedestal.price) {
            return;
        }

        // Pay
        this.playerStats.coins -= pedestal.price;

        // Apply item effects
        if (item.effect) {
            if (item.effect.damage) this.playerStats.damage += item.effect.damage;
            if (item.effect.tears) this.playerStats.tearDelay += item.effect.tears;
            if (item.effect.range) this.playerStats.range += item.effect.range * 10;
            if (item.effect.shotSpeed) this.playerStats.shotSpeed += item.effect.shotSpeed * 50;
            if (item.effect.speed) this.playerStats.speed += item.effect.speed * 50;
            if (item.effect.hp) this.playerStats.maxHearts += item.effect.hp;
        }

        // Add to inventory
        if (item.type === 'passive') {
            this.inventory.passive.push(pedestal.itemKey);
        } else if (item.type === 'active') {
            this.inventory.active = pedestal.itemKey;
            this.inventory.activeCharges = item.charges;
        }

        // Remove pedestal
        pedestal.sprite.destroy();
        pedestal.text.destroy();
        const idx = this.itemPedestals.indexOf(pedestal);
        if (idx > -1) this.itemPedestals.splice(idx, 1);

        this.updateUI();
    }

    damagePlayer(amount) {
        if (this.invincibleTime > 0) return;

        // Remove soul hearts first
        if (this.playerStats.soulHearts > 0) {
            this.playerStats.soulHearts -= amount;
        } else {
            this.playerStats.hearts -= amount;
        }

        this.invincibleTime = 1000;

        // Screen effects
        this.cameras.main.flash(200, 255, 0, 0, true);
        this.cameras.main.shake(100, 0.01);

        if (this.playerStats.hearts <= 0) {
            this.playerDeath();
        }

        this.updateUI();
    }

    playerDeath() {
        gameState = 'gameover';

        const overlay = this.add.graphics().setScrollFactor(0).setDepth(300);
        overlay.fillStyle(0x000000, 0.9);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'YOU DIED', {
            fontSize: '48px',
            fill: '#ff0000'
        }).setOrigin(0.5).setDepth(301);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, `Floor ${currentFloor}`, {
            fontSize: '24px',
            fill: '#888888'
        }).setOrigin(0.5).setDepth(301);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'Press SPACE to restart', {
            fontSize: '16px',
            fill: '#888888'
        }).setOrigin(0.5).setDepth(301);
    }

    createUI() {
        // Hearts
        this.heartsText = this.add.text(20, 20, '', {
            fontSize: '20px',
            fill: '#ff4444'
        }).setDepth(100);

        // Resources
        this.resourcesText = this.add.text(20, 50, '', {
            fontSize: '14px',
            fill: '#ffffff'
        }).setDepth(100);

        // Floor
        this.floorText = this.add.text(GAME_WIDTH - 100, 20, '', {
            fontSize: '16px',
            fill: '#888888'
        }).setDepth(100);

        // Minimap
        this.minimapGraphics = this.add.graphics().setDepth(100);

        this.updateUI();
    }

    updateUI() {
        // Hearts display
        let heartStr = '';
        for (let i = 0; i < this.playerStats.maxHearts; i++) {
            heartStr += i < this.playerStats.hearts ? '\u2665' : '\u2661';
        }
        for (let i = 0; i < this.playerStats.soulHearts; i++) {
            heartStr += '\u2764';
        }
        this.heartsText.setText(heartStr);

        // Resources
        this.resourcesText.setText(
            `Coins: ${this.playerStats.coins} | Keys: ${this.playerStats.keys} | Bombs: ${this.playerStats.bombs}`
        );

        // Floor
        this.floorText.setText(`Floor ${currentFloor}`);

        // Minimap
        this.drawMinimap();
    }

    drawMinimap() {
        const g = this.minimapGraphics;
        g.clear();

        const mapX = GAME_WIDTH - 120;
        const mapY = 60;
        const roomSize = 12;

        for (const [key, room] of this.floor) {
            const rx = mapX + room.x * (roomSize + 2);
            const ry = mapY + room.y * (roomSize + 2);

            let color = 0x444444;
            if (room.type === ROOM_TYPES.BOSS) color = 0xff0000;
            else if (room.type === ROOM_TYPES.TREASURE) color = 0xffff00;
            else if (room.type === ROOM_TYPES.SHOP) color = 0x00ff00;
            else if (room.type === ROOM_TYPES.SACRIFICE) color = 0x880000;
            else if (room.type === ROOM_TYPES.CURSE) color = 0x550055;
            else if (room.cleared) color = 0x888888;

            g.fillStyle(color, 1);
            g.fillRect(rx, ry, roomSize, roomSize);

            // Current room indicator
            if (key === this.currentRoomKey) {
                g.lineStyle(2, 0xffffff);
                g.strokeRect(rx - 1, ry - 1, roomSize + 2, roomSize + 2);
            }
        }
    }

    update(time, delta) {
        if (gamePaused || gameState !== 'playing') return;

        // Cooldowns
        if (this.fireCooldown > 0) this.fireCooldown -= delta;
        if (this.invincibleTime > 0) this.invincibleTime -= delta;

        // Player movement
        this.handleMovement(delta);

        // Firing
        this.handleFiring();

        // Update tears
        this.updateTears(delta);

        // Update enemies
        this.updateEnemies(delta);

        // Check pickups
        this.checkPickups();

        // Check items
        this.checkItems();

        // Check room doors
        this.checkDoors();

        // Check room clear
        this.checkRoomClear();

        // Restart
        if (gameState === 'gameover' && Phaser.Input.Keyboard.JustDown(this.cursors.item)) {
            currentFloor = 1;
            this.scene.restart();
            gameState = 'playing';
            gamePaused = true;
        }

        // Draw player
        this.drawPlayer();
    }

    handleMovement(delta) {
        let dx = 0, dy = 0;
        if (this.cursors.up.isDown) dy = -1;
        if (this.cursors.down.isDown) dy = 1;
        if (this.cursors.left.isDown) dx = -1;
        if (this.cursors.right.isDown) dx = 1;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        const moveX = dx * this.playerStats.speed * (delta / 1000);
        const moveY = dy * this.playerStats.speed * (delta / 1000);

        const newX = this.player.x + moveX;
        const newY = this.player.y + moveY;

        // Room bounds
        const minX = ROOM_OFFSET_X + 24;
        const maxX = ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE - 24;
        const minY = ROOM_OFFSET_Y + 24;
        const maxY = ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE - 24;

        if (newX > minX && newX < maxX) this.player.x = newX;
        if (newY > minY && newY < maxY) this.player.y = newY;
    }

    handleFiring() {
        if (this.cursors.fireUp.isDown) this.fireTear(0, -1);
        else if (this.cursors.fireDown.isDown) this.fireTear(0, 1);
        else if (this.cursors.fireLeft.isDown) this.fireTear(-1, 0);
        else if (this.cursors.fireRight.isDown) this.fireTear(1, 0);
    }

    updateTears(delta) {
        for (let i = this.tears.length - 1; i >= 0; i--) {
            const tear = this.tears[i];
            tear.x += tear.vx * (delta / 1000);
            tear.y += tear.vy * (delta / 1000);
            tear.traveled += Math.sqrt(tear.vx * tear.vx + tear.vy * tear.vy) * (delta / 1000);
            tear.sprite.x = tear.x;
            tear.sprite.y = tear.y;

            // Check enemy collision
            let hit = false;
            for (const enemy of this.enemies) {
                if (enemy.spawnAnim > 0) continue;
                const dist = Phaser.Math.Distance.Between(tear.x, tear.y, enemy.x, enemy.y);
                if (dist < enemy.size + 8) {
                    this.damageEnemy(enemy, tear.damage, tear.x, tear.y);
                    hit = true;
                    break;
                }
            }

            // Remove if out of range or hit
            if (hit || tear.traveled > tear.range ||
                tear.x < ROOM_OFFSET_X || tear.x > ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE ||
                tear.y < ROOM_OFFSET_Y || tear.y > ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE) {
                tear.sprite.destroy();
                this.tears.splice(i, 1);
            }
        }
    }

    damageEnemy(enemy, damage, tearX, tearY) {
        enemy.health -= damage;

        // Knockback
        if (tearX !== undefined && tearY !== undefined) {
            const angle = Phaser.Math.Angle.Between(tearX, tearY, enemy.x, enemy.y);
            const knockbackForce = 30;
            enemy.knockbackX = Math.cos(angle) * knockbackForce;
            enemy.knockbackY = Math.sin(angle) * knockbackForce;
            enemy.stunTime = 200; // Stun for 200ms
        }

        // Flash
        const origColor = enemy.color;
        enemy.color = 0xffffff;
        this.drawEnemy(enemy);
        this.time.delayedCall(100, () => {
            enemy.color = origColor;
            this.drawEnemy(enemy);
        });

        if (enemy.health <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        // Drop pickups
        if (Math.random() < 0.2) {
            const drops = ['heart', 'coin', 'coin', 'bomb', 'key'];
            this.spawnPickup(enemy.x, enemy.y, drops[Math.floor(Math.random() * drops.length)]);
        }

        // Boss drops
        if (enemy.type.includes('boss')) {
            // Spawn trapdoor
            const td = this.add.graphics();
            td.x = enemy.x;
            td.y = enemy.y;
            td.fillStyle(0x222222, 1);
            td.fillCircle(0, 0, 24);
            td.fillStyle(0x000000, 1);
            td.fillCircle(0, 0, 16);
            this.trapdoor = { x: enemy.x, y: enemy.y, sprite: td };
        }

        enemy.sprite.destroy();
        const idx = this.enemies.indexOf(enemy);
        if (idx > -1) this.enemies.splice(idx, 1);
    }

    updateEnemies(delta) {
        this.enemies.forEach(enemy => {
            // Spawn animation
            if (enemy.spawnAnim > 0) {
                enemy.spawnAnim--;
                this.drawEnemy(enemy);
                return;
            }

            // Handle stun
            if (enemy.stunTime > 0) {
                enemy.stunTime -= delta;
                // Apply knockback during stun
                if (enemy.knockbackX) {
                    enemy.x += enemy.knockbackX;
                    enemy.knockbackX *= 0.8; // Friction
                }
                if (enemy.knockbackY) {
                    enemy.y += enemy.knockbackY;
                    enemy.knockbackY *= 0.8;
                }
                // Keep in bounds
                enemy.x = Phaser.Math.Clamp(enemy.x, ROOM_OFFSET_X + 24, ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE - 24);
                enemy.y = Phaser.Math.Clamp(enemy.y, ROOM_OFFSET_Y + 24, ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE - 24);
                enemy.sprite.x = enemy.x;
                enemy.sprite.y = enemy.y;
                return; // Don't move while stunned
            }

            if (enemy.attackCooldown > 0) enemy.attackCooldown -= delta;

            const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            switch (enemy.behavior) {
                case 'chase':
                    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                    enemy.x += Math.cos(angle) * enemy.speed * (delta / 1000);
                    enemy.y += Math.sin(angle) * enemy.speed * (delta / 1000);
                    break;

                case 'hop':
                    if (enemy.attackCooldown <= 0) {
                        const hopAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                        enemy.x += Math.cos(hopAngle) * 60;
                        enemy.y += Math.sin(hopAngle) * 60;
                        enemy.attackCooldown = 1000;
                    }
                    break;

                case 'shoot':
                    if (enemy.attackCooldown <= 0 && distToPlayer < 200) {
                        this.enemyShoot(enemy);
                        enemy.attackCooldown = 2000;
                    }
                    break;

                case 'boss':
                    const bossAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                    enemy.x += Math.cos(bossAngle) * enemy.speed * (delta / 1000);
                    enemy.y += Math.sin(bossAngle) * enemy.speed * (delta / 1000);

                    if (enemy.attackCooldown <= 0) {
                        for (let i = 0; i < 8; i++) {
                            const a = (Math.PI * 2 / 8) * i;
                            this.spawnEnemyTear(enemy.x, enemy.y, Math.cos(a), Math.sin(a), 10);
                        }
                        enemy.attackCooldown = 2000;
                    }
                    break;
            }

            // Damage player on contact
            if (distToPlayer < enemy.size + 16) {
                this.damagePlayer(enemy.damage);
            }

            // Keep in room bounds
            enemy.x = Phaser.Math.Clamp(enemy.x, ROOM_OFFSET_X + 20, ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE - 20);
            enemy.y = Phaser.Math.Clamp(enemy.y, ROOM_OFFSET_Y + 20, ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE - 20);

            this.drawEnemy(enemy);
        });
    }

    enemyShoot(enemy) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        this.spawnEnemyTear(enemy.x, enemy.y, Math.cos(angle), Math.sin(angle), 8);
    }

    spawnEnemyTear(x, y, dx, dy, damage) {
        const tear = {
            x, y,
            vx: dx * 200,
            vy: dy * 200,
            damage,
            enemy: true,
            lifetime: 2000,
            sprite: this.add.graphics()
        };

        tear.sprite.fillStyle(0xff6666, 1);
        tear.sprite.fillCircle(0, 0, 6);
        tear.sprite.x = x;
        tear.sprite.y = y;

        this.tears.push(tear);
    }

    checkPickups() {
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, pickup.x, pickup.y);

            if (dist < 30) {
                switch (pickup.type) {
                    case 'heart':
                        if (this.playerStats.hearts < this.playerStats.maxHearts) {
                            this.playerStats.hearts++;
                        }
                        break;
                    case 'coin':
                        this.playerStats.coins++;
                        break;
                    case 'bomb':
                        this.playerStats.bombs++;
                        break;
                    case 'key':
                        this.playerStats.keys++;
                        break;
                }

                pickup.sprite.destroy();
                this.pickups.splice(i, 1);
                this.updateUI();
            }
        }

        // Check enemy tears hitting player
        for (let i = this.tears.length - 1; i >= 0; i--) {
            const tear = this.tears[i];
            if (!tear.enemy) continue;

            tear.lifetime -= 16;
            tear.x += tear.vx * 0.016;
            tear.y += tear.vy * 0.016;
            tear.sprite.x = tear.x;
            tear.sprite.y = tear.y;

            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, tear.x, tear.y);
            if (dist < 20) {
                this.damagePlayer(tear.damage);
                tear.sprite.destroy();
                this.tears.splice(i, 1);
            } else if (tear.lifetime <= 0 || tear.x < ROOM_OFFSET_X || tear.x > ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE) {
                tear.sprite.destroy();
                this.tears.splice(i, 1);
            }
        }
    }

    checkItems() {
        for (const pedestal of this.itemPedestals) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, pedestal.x, pedestal.y);
            if (dist < 40 && Phaser.Input.Keyboard.JustDown(this.cursors.item)) {
                this.collectItem(pedestal);
            }
        }

        // Trapdoor to next floor
        if (this.trapdoor) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.trapdoor.x, this.trapdoor.y);
            if (dist < 30) {
                currentFloor++;
                this.trapdoor.sprite.destroy();
                this.trapdoor = null;
                this.generateNewFloor();
            }
        }
    }

    checkDoors() {
        if (!this.doorsOpen) return;

        const room = this.floor.get(this.currentRoomKey);
        const doorSize = TILE_SIZE;

        // Check each door
        const transitions = [
            { dx: 0, dy: -1, checkY: ROOM_OFFSET_Y, entryY: ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE - 40 },
            { dx: 0, dy: 1, checkY: ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE, entryY: ROOM_OFFSET_Y + 40 },
            { dx: -1, dy: 0, checkX: ROOM_OFFSET_X, entryX: ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE - 40 },
            { dx: 1, dy: 0, checkX: ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE, entryX: ROOM_OFFSET_X + 40 }
        ];

        for (const t of transitions) {
            const neighborKey = `${room.x + t.dx},${room.y + t.dy}`;
            if (!this.floor.has(neighborKey)) continue;

            let inDoor = false;
            if (t.checkX !== undefined) {
                inDoor = Math.abs(this.player.x - t.checkX) < 30 &&
                    this.player.y > ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2 - 30 &&
                    this.player.y < ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2 + 30;
            } else {
                inDoor = Math.abs(this.player.y - t.checkY) < 30 &&
                    this.player.x > ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2 - 30 &&
                    this.player.x < ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2 + 30;
            }

            if (inDoor) {
                this.currentRoomKey = neighborKey;
                this.loadRoom(neighborKey);

                // Position player at entry point
                if (t.entryX !== undefined) this.player.x = t.entryX;
                else this.player.x = ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2;

                if (t.entryY !== undefined) this.player.y = t.entryY;
                else this.player.y = ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2;

                break;
            }
        }
    }

    checkRoomClear() {
        if (this.enemies.length === 0 && !this.doorsOpen) {
            this.doorsOpen = true;
            const room = this.floor.get(this.currentRoomKey);
            room.cleared = true;

            // Award room clear bonus
            if (Math.random() < 0.3) {
                const drops = ['heart', 'coin', 'bomb', 'key'];
                this.spawnPickup(
                    ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2,
                    ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2,
                    drops[Math.floor(Math.random() * drops.length)]
                );
            }

            this.drawRoom(room);
            this.updateUI();
        }
    }

    initHarness() {
        const scene = this;

        window.harness = {
            pause: () => { gamePaused = true; },
            resume: () => { gamePaused = false; },
            isPaused: () => gamePaused,

            execute: (action, durationMs) => {
                return new Promise(resolve => {
                    if (action.keys) {
                        action.keys.forEach(key => {
                            const k = scene.getKeyCode(key);
                            if (k && scene.cursors[k]) scene.cursors[k].isDown = true;
                        });
                    }
                    gamePaused = false;

                    setTimeout(() => {
                        if (action.keys) {
                            action.keys.forEach(key => {
                                const k = scene.getKeyCode(key);
                                if (k && scene.cursors[k]) scene.cursors[k].isDown = false;
                            });
                        }
                        gamePaused = true;
                        resolve();
                    }, durationMs);
                });
            },

            getState: () => ({
                gameState,
                currentFloor,
                currentRoom: scene.currentRoomKey,
                roomCleared: scene.doorsOpen,
                player: {
                    x: scene.player?.x || 0,
                    y: scene.player?.y || 0,
                    hearts: scene.playerStats.hearts,
                    maxHearts: scene.playerStats.maxHearts,
                    soulHearts: scene.playerStats.soulHearts,
                    damage: scene.playerStats.damage,
                    coins: scene.playerStats.coins,
                    bombs: scene.playerStats.bombs,
                    keys: scene.playerStats.keys
                },
                enemies: scene.enemies.map(e => ({
                    type: e.type,
                    x: e.x,
                    y: e.y,
                    health: e.health,
                    maxHealth: e.maxHealth
                })),
                items: scene.itemPedestals.map(p => ({
                    x: p.x,
                    y: p.y,
                    item: p.itemKey,
                    price: p.price
                })),
                pickups: scene.pickups.map(p => ({ x: p.x, y: p.y, type: p.type })),
                inventory: scene.inventory
            }),

            getPhase: () => gameState,

            debug: {
                setHealth: hp => { scene.playerStats.hearts = hp; scene.updateUI(); },
                setPosition: (x, y) => { scene.player.x = x; scene.player.y = y; },
                clearEnemies: () => {
                    scene.enemies.forEach(e => e.sprite.destroy());
                    scene.enemies = [];
                    scene.checkRoomClear();
                },
                giveItem: key => {
                    if (ITEMS[key]) {
                        scene.inventory.passive.push(key);
                        const item = ITEMS[key];
                        if (item.effect) {
                            if (item.effect.damage) scene.playerStats.damage += item.effect.damage;
                            if (item.effect.tears) scene.playerStats.tearDelay += item.effect.tears;
                        }
                    }
                },
                forceStart: () => { gameState = 'playing'; gamePaused = false; },
                forceGameOver: () => { scene.playerDeath(); },
                nextFloor: () => {
                    currentFloor++;
                    scene.generateNewFloor();
                },
                log: msg => console.log('[HARNESS]', msg)
            },

            version: '1.0',
            gameInfo: {
                name: 'Binding of Isaac Clone',
                type: 'twin_stick_roguelike',
                controls: {
                    movement: ['w', 'a', 's', 'd'],
                    fire: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
                    actions: { bomb: 'e', item: 'Space', pill: 'q' }
                }
            }
        };

        console.log('[HARNESS] Binding of Isaac Clone harness initialized');
    }

    getKeyCode(key) {
        const map = {
            'w': 'up', 'W': 'up',
            's': 'down', 'S': 'down',
            'a': 'left', 'A': 'left',
            'd': 'right', 'D': 'right',
            'ArrowUp': 'fireUp',
            'ArrowDown': 'fireDown',
            'ArrowLeft': 'fireLeft',
            'ArrowRight': 'fireRight',
            'e': 'bomb', 'E': 'bomb',
            'Space': 'item', ' ': 'item',
            'q': 'pill', 'Q': 'pill'
        };
        return map[key];
    }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        gameState = 'menu';

        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a0a0a);

        this.add.text(GAME_WIDTH / 2, 100, 'BINDING OF ISAAC', {
            fontSize: '48px',
            fill: '#884422'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 150, 'CLONE', {
            fontSize: '32px',
            fill: '#664422'
        }).setOrigin(0.5);

        const startBtn = this.add.text(GAME_WIDTH / 2, 300, '[ NEW RUN ]', {
            fontSize: '28px',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setFill('#ffff00'));
        startBtn.on('pointerout', () => startBtn.setFill('#ffffff'));
        startBtn.on('pointerdown', () => {
            currentFloor = 1;
            this.scene.start('GameScene');
        });

        this.add.text(GAME_WIDTH / 2, 450, 'WASD - Move | Arrow Keys - Shoot', {
            fontSize: '14px',
            fill: '#666666'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-SPACE', () => {
            currentFloor = 1;
            this.scene.start('GameScene');
        });

        // Menu harness
        window.harness = {
            pause: () => { gamePaused = true; },
            resume: () => { gamePaused = false; },
            isPaused: () => gamePaused,
            execute: (action, duration) => {
                return new Promise(resolve => {
                    if (action.keys?.includes('Space')) {
                        currentFloor = 1;
                        this.scene.start('GameScene');
                    }
                    setTimeout(resolve, duration);
                });
            },
            getState: () => ({ gameState: 'menu' }),
            getPhase: () => 'menu',
            debug: {
                forceStart: () => { currentFloor = 1; this.scene.start('GameScene'); },
                log: msg => console.log('[HARNESS]', msg)
            },
            version: '1.0',
            gameInfo: { name: 'Binding of Isaac Clone', type: 'twin_stick_roguelike' }
        };
    }
}

// Config
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a0a0a',
    scene: [GameScene] // AUTO-START: Skip MenuScene
};

const game = new Phaser.Game(config);
