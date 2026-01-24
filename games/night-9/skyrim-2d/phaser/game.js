// Frostfall: A 2D Skyrim Demake
// Built with Phaser 3

const CONFIG = {
    width: 640,
    height: 360,
    tileSize: 16,
    playerSpeed: 80,
    sprintSpeed: 140,

    // Player stats
    baseHealth: 100,
    baseStamina: 100,
    baseMagicka: 50,

    // Combat
    lightAttackDamage: 8,
    powerAttackDamage: 16,
    lightAttackStamina: 10,
    powerAttackStamina: 25,
    dodgeStamina: 20,

    // Weapons
    weapons: {
        ironSword: { name: 'Iron Sword', damage: 8, speed: 0.3, range: 24 },
        steelSword: { name: 'Steel Sword', damage: 12, speed: 0.3, range: 24 },
        ironGreatsword: { name: 'Iron Greatsword', damage: 15, speed: 0.5, range: 32 },
        huntingBow: { name: 'Hunting Bow', damage: 10, speed: 0.5, range: 200, ranged: true }
    },

    // Armor
    armor: {
        leather: { name: 'Leather', defense: 20 },
        iron: { name: 'Iron', defense: 40 },
        steel: { name: 'Steel', defense: 60 }
    },

    // Biomes
    biomes: ['forest', 'snow', 'mountain']
};

// Boot Scene
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        const { width, height } = this.cameras.main;
        const loadText = this.add.text(width/2, height/2, 'Loading Frostfall...', {
            font: '16px Georgia',
            fill: '#d4af37'
        }).setOrigin(0.5);
    }

    create() {
        this.createTextures();
        this.scene.start('MenuScene');
    }

    createTextures() {
        // Player sprite (16x24) - detailed adventurer
        const playerGfx = this.make.graphics({ add: false });
        playerGfx.fillStyle(0x3a2a1a);
        playerGfx.fillRect(4, 0, 8, 24);
        playerGfx.fillStyle(0xc9a875); // skin
        playerGfx.fillRect(5, 2, 6, 6); // head
        playerGfx.fillStyle(0x5a4030); // hair
        playerGfx.fillRect(5, 1, 6, 3);
        playerGfx.fillStyle(0x4a6a3a); // green tunic
        playerGfx.fillRect(4, 8, 8, 8);
        playerGfx.fillStyle(0x3a5a2a);
        playerGfx.fillRect(5, 9, 6, 6);
        playerGfx.fillStyle(0x6a5a4a); // belt
        playerGfx.fillRect(4, 14, 8, 2);
        playerGfx.fillStyle(0x5a4a3a); // pants
        playerGfx.fillRect(5, 16, 2, 6);
        playerGfx.fillRect(9, 16, 2, 6);
        playerGfx.fillStyle(0x3a2a1a); // boots
        playerGfx.fillRect(5, 21, 2, 3);
        playerGfx.fillRect(9, 21, 2, 3);
        playerGfx.generateTexture('player', 16, 24);

        // Grass tile - darker, more natural
        const grassGfx = this.make.graphics({ add: false });
        grassGfx.fillStyle(0x3a5a3a);
        grassGfx.fillRect(0, 0, 16, 16);
        grassGfx.fillStyle(0x4a6a4a);
        for (let i = 0; i < 6; i++) {
            grassGfx.fillRect(Math.random() * 14, Math.random() * 14, 2, 2);
        }
        grassGfx.fillStyle(0x2a4a2a);
        for (let i = 0; i < 4; i++) {
            grassGfx.fillRect(Math.random() * 14, Math.random() * 14, 1, 1);
        }
        grassGfx.generateTexture('grass', 16, 16);

        // Grass variation 2
        const grass2Gfx = this.make.graphics({ add: false });
        grass2Gfx.fillStyle(0x3a5535);
        grass2Gfx.fillRect(0, 0, 16, 16);
        grass2Gfx.fillStyle(0x4a6545);
        for (let i = 0; i < 5; i++) {
            grass2Gfx.fillRect(Math.random() * 14, Math.random() * 14, 2, 3);
        }
        grass2Gfx.generateTexture('grass2', 16, 16);

        // Dirt path - earthy brown
        const dirtGfx = this.make.graphics({ add: false });
        dirtGfx.fillStyle(0x5a4a3a);
        dirtGfx.fillRect(0, 0, 16, 16);
        dirtGfx.fillStyle(0x6a5a4a);
        for (let i = 0; i < 4; i++) {
            dirtGfx.fillRect(Math.random() * 12, Math.random() * 12, 3, 3);
        }
        dirtGfx.fillStyle(0x4a3a2a);
        for (let i = 0; i < 3; i++) {
            dirtGfx.fillRect(Math.random() * 14, Math.random() * 14, 2, 2);
        }
        dirtGfx.generateTexture('dirt', 16, 16);

        // Cobblestone path
        const cobbleGfx = this.make.graphics({ add: false });
        cobbleGfx.fillStyle(0x5a5a5a);
        cobbleGfx.fillRect(0, 0, 16, 16);
        cobbleGfx.lineStyle(1, 0x4a4a4a);
        cobbleGfx.strokeRect(1, 1, 6, 6);
        cobbleGfx.strokeRect(8, 1, 7, 7);
        cobbleGfx.strokeRect(1, 8, 7, 7);
        cobbleGfx.strokeRect(9, 9, 6, 6);
        cobbleGfx.generateTexture('cobble', 16, 16);

        // Snow tile - icy
        const snowGfx = this.make.graphics({ add: false });
        snowGfx.fillStyle(0xcacad8);
        snowGfx.fillRect(0, 0, 16, 16);
        snowGfx.fillStyle(0xdadaec);
        for (let i = 0; i < 6; i++) {
            snowGfx.fillRect(Math.random() * 14, Math.random() * 14, 2, 2);
        }
        snowGfx.fillStyle(0xb8b8c8);
        for (let i = 0; i < 3; i++) {
            snowGfx.fillRect(Math.random() * 14, Math.random() * 14, 1, 1);
        }
        snowGfx.generateTexture('snow', 16, 16);

        // Stone/mountain tile - rocky texture
        const stonGfx = this.make.graphics({ add: false });
        stonGfx.fillStyle(0x5a5a5a);
        stonGfx.fillRect(0, 0, 16, 16);
        stonGfx.fillStyle(0x4a4a4a);
        stonGfx.fillRect(0, 0, 8, 8);
        stonGfx.fillRect(8, 8, 8, 8);
        stonGfx.fillStyle(0x6a6a6a);
        stonGfx.fillRect(2, 10, 4, 4);
        stonGfx.fillRect(10, 2, 4, 4);
        stonGfx.generateTexture('stone', 16, 16);

        // Boulder/rock
        const boulderGfx = this.make.graphics({ add: false });
        boulderGfx.fillStyle(0x6a6a6a);
        boulderGfx.fillCircle(8, 10, 7);
        boulderGfx.fillStyle(0x7a7a7a);
        boulderGfx.fillCircle(6, 8, 4);
        boulderGfx.fillStyle(0x5a5a5a);
        boulderGfx.fillCircle(10, 12, 3);
        boulderGfx.generateTexture('boulder', 16, 16);

        // Water tile
        const waterGfx = this.make.graphics({ add: false });
        waterGfx.fillStyle(0x3a5a7a);
        waterGfx.fillRect(0, 0, 16, 16);
        waterGfx.fillStyle(0x4a6a8a);
        waterGfx.fillRect(2, 4, 12, 2);
        waterGfx.fillRect(0, 10, 10, 2);
        waterGfx.generateTexture('water', 16, 16);

        // Bridge tile
        const bridgeGfx = this.make.graphics({ add: false });
        bridgeGfx.fillStyle(0x5a4a3a);
        bridgeGfx.fillRect(0, 0, 16, 16);
        bridgeGfx.fillStyle(0x6a5a4a);
        bridgeGfx.fillRect(0, 0, 16, 3);
        bridgeGfx.fillRect(0, 13, 16, 3);
        bridgeGfx.lineStyle(1, 0x4a3a2a);
        bridgeGfx.strokeRect(2, 0, 4, 16);
        bridgeGfx.strokeRect(10, 0, 4, 16);
        bridgeGfx.generateTexture('bridge', 16, 16);

        // Tree - large deciduous
        const treeGfx = this.make.graphics({ add: false });
        treeGfx.fillStyle(0x3a2a15);
        treeGfx.fillRect(6, 18, 4, 14); // trunk
        treeGfx.fillStyle(0x2a4a25);
        treeGfx.fillCircle(8, 10, 9); // main foliage
        treeGfx.fillStyle(0x3a5a35);
        treeGfx.fillCircle(5, 8, 5);
        treeGfx.fillCircle(11, 8, 5);
        treeGfx.fillCircle(8, 5, 5);
        treeGfx.fillStyle(0x1a3a15);
        treeGfx.fillCircle(8, 12, 4); // shadow
        treeGfx.generateTexture('tree', 16, 32);

        // Oak tree variant
        const oakGfx = this.make.graphics({ add: false });
        oakGfx.fillStyle(0x4a3a20);
        oakGfx.fillRect(5, 20, 6, 12);
        oakGfx.fillStyle(0x3a5530);
        oakGfx.fillCircle(8, 12, 10);
        oakGfx.fillStyle(0x4a6540);
        oakGfx.fillCircle(4, 10, 5);
        oakGfx.fillCircle(12, 10, 5);
        oakGfx.fillCircle(8, 6, 6);
        oakGfx.generateTexture('oak', 16, 32);

        // Pine tree (for snow biome) - taller, narrower
        const pineGfx = this.make.graphics({ add: false });
        pineGfx.fillStyle(0x3a2a15);
        pineGfx.fillRect(6, 22, 4, 10);
        pineGfx.fillStyle(0x1a4035);
        pineGfx.fillTriangle(8, 0, 0, 24, 16, 24);
        pineGfx.fillStyle(0x2a5045);
        pineGfx.fillTriangle(8, 6, 2, 20, 14, 20);
        pineGfx.fillTriangle(8, 2, 4, 14, 12, 14);
        pineGfx.generateTexture('pine', 16, 32);

        // Dead tree
        const deadTreeGfx = this.make.graphics({ add: false });
        deadTreeGfx.fillStyle(0x4a4035);
        deadTreeGfx.fillRect(6, 10, 4, 22);
        deadTreeGfx.fillRect(2, 8, 5, 3);
        deadTreeGfx.fillRect(9, 12, 6, 2);
        deadTreeGfx.fillRect(1, 4, 4, 2);
        deadTreeGfx.fillRect(11, 6, 4, 2);
        deadTreeGfx.generateTexture('deadtree', 16, 32);

        // Bush
        const bushGfx = this.make.graphics({ add: false });
        bushGfx.fillStyle(0x2a4a25);
        bushGfx.fillCircle(8, 10, 7);
        bushGfx.fillStyle(0x3a5a35);
        bushGfx.fillCircle(5, 9, 4);
        bushGfx.fillCircle(11, 9, 4);
        bushGfx.fillCircle(8, 6, 3);
        bushGfx.generateTexture('bush', 16, 16);

        // Flower patch
        const flowerGfx = this.make.graphics({ add: false });
        flowerGfx.fillStyle(0x3a5a3a);
        flowerGfx.fillRect(0, 0, 16, 16);
        flowerGfx.fillStyle(0xaa4444);
        flowerGfx.fillCircle(4, 6, 2);
        flowerGfx.fillStyle(0xaaaa44);
        flowerGfx.fillCircle(10, 4, 2);
        flowerGfx.fillStyle(0x8844aa);
        flowerGfx.fillCircle(7, 11, 2);
        flowerGfx.fillStyle(0x44aa44);
        flowerGfx.fillRect(4, 8, 1, 4);
        flowerGfx.fillRect(10, 6, 1, 4);
        flowerGfx.fillRect(7, 13, 1, 3);
        flowerGfx.generateTexture('flowers', 16, 16);

        // Campfire
        const fireGfx = this.make.graphics({ add: false });
        fireGfx.fillStyle(0x4a3a2a);
        fireGfx.fillCircle(8, 12, 5);
        fireGfx.fillStyle(0xff6600);
        fireGfx.fillTriangle(8, 2, 4, 12, 12, 12);
        fireGfx.fillStyle(0xffaa00);
        fireGfx.fillTriangle(8, 4, 5, 10, 11, 10);
        fireGfx.fillStyle(0xffff44);
        fireGfx.fillTriangle(8, 6, 6, 10, 10, 10);
        fireGfx.generateTexture('campfire', 16, 16);

        // Tombstone
        const tombGfx = this.make.graphics({ add: false });
        tombGfx.fillStyle(0x5a5a5a);
        tombGfx.fillRect(4, 6, 8, 10);
        tombGfx.fillStyle(0x6a6a6a);
        tombGfx.fillRect(5, 2, 6, 5);
        tombGfx.fillCircle(8, 4, 3);
        tombGfx.fillStyle(0x4a4a4a);
        tombGfx.fillRect(6, 8, 4, 1);
        tombGfx.fillRect(7, 9, 2, 4);
        tombGfx.generateTexture('tomb', 16, 16);

        // Sign post
        const signGfx = this.make.graphics({ add: false });
        signGfx.fillStyle(0x5a4030);
        signGfx.fillRect(7, 8, 2, 12);
        signGfx.fillStyle(0x6a5040);
        signGfx.fillRect(2, 2, 12, 8);
        signGfx.fillStyle(0x4a3020);
        signGfx.lineStyle(1, 0x3a2010);
        signGfx.strokeRect(2, 2, 12, 8);
        signGfx.generateTexture('sign', 16, 20);

        // Wall tile
        const wallGfx = this.make.graphics({ add: false });
        wallGfx.fillStyle(0x5a5a5a);
        wallGfx.fillRect(0, 0, 16, 16);
        wallGfx.lineStyle(1, 0x4a4a4a);
        wallGfx.strokeRect(0, 0, 16, 16);
        wallGfx.strokeRect(8, 0, 8, 8);
        wallGfx.generateTexture('wall', 16, 16);

        // Building - detailed house
        const buildGfx = this.make.graphics({ add: false });
        buildGfx.fillStyle(0x5a4a35);
        buildGfx.fillRect(0, 12, 48, 28);
        buildGfx.fillStyle(0x4a3525);
        buildGfx.fillTriangle(24, 0, -4, 14, 52, 14);
        buildGfx.fillStyle(0x5a4535);
        buildGfx.fillTriangle(24, 2, 0, 14, 48, 14);
        buildGfx.fillStyle(0x3a2515);
        buildGfx.fillRect(18, 26, 12, 14); // door
        buildGfx.fillStyle(0x4a3525);
        buildGfx.fillRect(19, 27, 10, 12);
        buildGfx.fillStyle(0xaaaa66);
        buildGfx.fillCircle(26, 33, 1); // door handle
        buildGfx.fillStyle(0x6a7a9a);
        buildGfx.fillRect(6, 18, 8, 6); // windows
        buildGfx.fillRect(34, 18, 8, 6);
        buildGfx.fillStyle(0x4a5a7a);
        buildGfx.fillRect(7, 19, 6, 4);
        buildGfx.fillRect(35, 19, 6, 4);
        buildGfx.lineStyle(1, 0x3a2a1a);
        buildGfx.strokeRect(6, 18, 8, 6);
        buildGfx.strokeRect(34, 18, 8, 6);
        buildGfx.generateTexture('building', 48, 40);

        // Inn/tavern building
        const innGfx = this.make.graphics({ add: false });
        innGfx.fillStyle(0x5a4535);
        innGfx.fillRect(0, 14, 56, 30);
        innGfx.fillStyle(0x4a3020);
        innGfx.fillTriangle(28, 0, -4, 16, 60, 16);
        innGfx.fillStyle(0x3a2515);
        innGfx.fillRect(22, 28, 12, 16);
        innGfx.fillStyle(0x6a7a9a);
        for (let i = 0; i < 4; i++) {
            innGfx.fillRect(4 + i * 13, 20, 6, 5);
        }
        innGfx.fillStyle(0xffaa44);
        innGfx.fillCircle(28, 8, 3); // lamp
        innGfx.generateTexture('inn', 56, 44);

        // Blacksmith building
        const smithGfx = this.make.graphics({ add: false });
        smithGfx.fillStyle(0x4a4040);
        smithGfx.fillRect(0, 12, 48, 28);
        smithGfx.fillStyle(0x3a3030);
        smithGfx.fillRect(0, 10, 48, 6);
        smithGfx.fillStyle(0x2a2020);
        smithGfx.fillRect(16, 24, 16, 16);
        smithGfx.fillStyle(0xff6644);
        smithGfx.fillRect(20, 30, 8, 8); // forge glow
        smithGfx.fillStyle(0xffaa44);
        smithGfx.fillRect(22, 32, 4, 4);
        smithGfx.generateTexture('smithy', 48, 40);

        // NPC
        const npcGfx = this.make.graphics({ add: false });
        npcGfx.fillStyle(0x5a5a6a);
        npcGfx.fillRect(2, 0, 12, 24);
        npcGfx.fillStyle(0xaa9a8a);
        npcGfx.fillRect(4, 2, 8, 8);
        npcGfx.fillStyle(0x6a4a3a);
        npcGfx.fillRect(3, 10, 10, 10);
        npcGfx.fillStyle(0x4a3a2a);
        npcGfx.fillRect(4, 20, 3, 4);
        npcGfx.fillRect(9, 20, 3, 4);
        npcGfx.generateTexture('npc', 16, 24);

        // Enemy - Wolf
        const wolfGfx = this.make.graphics({ add: false });
        wolfGfx.fillStyle(0x5a5a5a);
        wolfGfx.fillRect(2, 4, 12, 8);
        wolfGfx.fillStyle(0x4a4a4a);
        wolfGfx.fillRect(0, 6, 4, 4); // head
        wolfGfx.fillRect(12, 8, 4, 2); // tail
        wolfGfx.fillStyle(0x3a3a3a);
        wolfGfx.fillRect(3, 12, 2, 4); // legs
        wolfGfx.fillRect(9, 12, 2, 4);
        wolfGfx.generateTexture('wolf', 16, 16);

        // Enemy - Bandit
        const banditGfx = this.make.graphics({ add: false });
        banditGfx.fillStyle(0x4a3a3a);
        banditGfx.fillRect(2, 0, 12, 24);
        banditGfx.fillStyle(0x8a6a5a);
        banditGfx.fillRect(4, 2, 8, 8);
        banditGfx.fillStyle(0x3a2a2a);
        banditGfx.fillRect(3, 10, 10, 10);
        banditGfx.fillStyle(0x2a2a2a);
        banditGfx.fillRect(4, 20, 3, 4);
        banditGfx.fillRect(9, 20, 3, 4);
        banditGfx.generateTexture('bandit', 16, 24);

        // Enemy - Draugr
        const draugrGfx = this.make.graphics({ add: false });
        draugrGfx.fillStyle(0x4a5a5a);
        draugrGfx.fillRect(2, 0, 12, 24);
        draugrGfx.fillStyle(0x5a6a6a);
        draugrGfx.fillRect(4, 2, 8, 8);
        draugrGfx.fillStyle(0x3a7a7a);
        draugrGfx.fillCircle(6, 5, 2); // glowing eyes
        draugrGfx.fillCircle(10, 5, 2);
        draugrGfx.fillStyle(0x3a4a4a);
        draugrGfx.fillRect(3, 10, 10, 14);
        draugrGfx.generateTexture('draugr', 16, 24);

        // Enemy - Bear
        const bearGfx = this.make.graphics({ add: false });
        bearGfx.fillStyle(0x5a3a2a);
        bearGfx.fillRect(0, 4, 20, 14);
        bearGfx.fillStyle(0x4a2a1a);
        bearGfx.fillRect(-2, 6, 6, 8); // head
        bearGfx.fillCircle(0, 5, 3); // ears
        bearGfx.fillCircle(0, 13, 3);
        bearGfx.fillStyle(0x3a2a1a);
        bearGfx.fillRect(2, 18, 4, 6); // legs
        bearGfx.fillRect(14, 18, 4, 6);
        bearGfx.generateTexture('bear', 20, 24);

        // Enemy - Troll
        const trollGfx = this.make.graphics({ add: false });
        trollGfx.fillStyle(0x6a6a5a);
        trollGfx.fillRect(2, 0, 20, 28);
        trollGfx.fillStyle(0x5a5a4a);
        trollGfx.fillRect(4, 2, 16, 12);
        trollGfx.fillStyle(0xffaa44);
        trollGfx.fillCircle(8, 6, 2); // eyes
        trollGfx.fillCircle(12, 6, 2);
        trollGfx.fillCircle(10, 10, 2);
        trollGfx.fillStyle(0x4a4a3a);
        trollGfx.fillRect(4, 22, 6, 8);
        trollGfx.fillRect(14, 22, 6, 8);
        trollGfx.generateTexture('troll', 24, 30);

        // Boss enemy
        const bossGfx = this.make.graphics({ add: false });
        bossGfx.fillStyle(0x4a2a4a);
        bossGfx.fillRect(4, 0, 24, 32);
        bossGfx.fillStyle(0x3a1a3a);
        bossGfx.fillRect(8, 4, 16, 12);
        bossGfx.fillStyle(0xff4444);
        bossGfx.fillCircle(14, 8, 3);
        bossGfx.fillCircle(22, 8, 3);
        bossGfx.fillStyle(0x5a3a5a);
        bossGfx.fillRect(6, 26, 8, 10);
        bossGfx.fillRect(18, 26, 8, 10);
        bossGfx.generateTexture('boss', 32, 36);

        // Chest
        const chestGfx = this.make.graphics({ add: false });
        chestGfx.fillStyle(0x6a4a2a);
        chestGfx.fillRect(0, 4, 16, 12);
        chestGfx.fillStyle(0x8a6a4a);
        chestGfx.fillRect(0, 0, 16, 6);
        chestGfx.fillStyle(0xaaaa4a);
        chestGfx.fillRect(6, 6, 4, 4); // lock
        chestGfx.lineStyle(2, 0x4a3a2a);
        chestGfx.strokeRect(0, 4, 16, 12);
        chestGfx.generateTexture('chest', 16, 16);

        // Sword swing effect
        const swingGfx = this.make.graphics({ add: false });
        swingGfx.lineStyle(3, 0xcccccc);
        swingGfx.arc(16, 16, 14, -0.5, 1.5);
        swingGfx.generateTexture('swing', 32, 32);

        // Dungeon entrance
        const dungeonGfx = this.make.graphics({ add: false });
        dungeonGfx.fillStyle(0x3a3a3a);
        dungeonGfx.fillRect(0, 0, 32, 32);
        dungeonGfx.fillStyle(0x1a1a1a);
        dungeonGfx.fillRect(6, 8, 20, 24);
        dungeonGfx.fillStyle(0x4a4a4a);
        dungeonGfx.fillTriangle(16, 2, 0, 12, 32, 12);
        dungeonGfx.generateTexture('dungeon', 32, 32);

        // Quest marker
        const markerGfx = this.make.graphics({ add: false });
        markerGfx.fillStyle(0xffcc00);
        markerGfx.fillTriangle(8, 0, 0, 16, 16, 16);
        markerGfx.generateTexture('marker', 16, 16);

        // Potion
        const potionGfx = this.make.graphics({ add: false });
        potionGfx.fillStyle(0xaa4444);
        potionGfx.fillRect(4, 4, 8, 12);
        potionGfx.fillStyle(0x6a3a3a);
        potionGfx.fillRect(5, 0, 6, 4);
        potionGfx.generateTexture('potion', 16, 16);

        // Gold coin
        const goldGfx = this.make.graphics({ add: false });
        goldGfx.fillStyle(0xddaa44);
        goldGfx.fillCircle(8, 8, 6);
        goldGfx.fillStyle(0xaa8822);
        goldGfx.fillCircle(8, 8, 4);
        goldGfx.generateTexture('gold', 16, 16);
    }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.cameras.main;

        this.cameras.main.setBackgroundColor(0x1a2a3a);

        // Title
        this.add.text(width/2, 80, 'FROSTFALL', {
            font: 'bold 36px Georgia',
            fill: '#d4af37',
            stroke: '#2a1a0a',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(width/2, 120, 'A 2D Skyrim Demake', {
            font: '14px Georgia',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        // Lore text
        const loreBox = this.add.rectangle(width/2, 200, 500, 100, 0x1a1a2a, 0.8);
        loreBox.setStrokeStyle(2, 0x4a3a2a);

        this.add.text(width/2, 200, 'Skyrim is in peril. Ancient evil stirs in the dungeons.\nYou are the Dragonborn, destined to save the realm.\nClear the three dungeons and prove your worth.', {
            font: '12px Georgia',
            fill: '#cccccc',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);

        // Start button
        const startBtn = this.add.rectangle(width/2, 300, 180, 45, 0x3a5a3a);
        startBtn.setStrokeStyle(2, 0x6a8a6a);
        startBtn.setInteractive({ useHandCursor: true });

        const startText = this.add.text(width/2, 300, 'BEGIN JOURNEY', {
            font: 'bold 16px Georgia',
            fill: '#aaffaa'
        }).setOrigin(0.5);

        startBtn.on('pointerover', () => startBtn.setFillStyle(0x4a7a4a));
        startBtn.on('pointerout', () => startBtn.setFillStyle(0x3a5a3a));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));

        // Controls
        this.add.text(width/2, 340, 'WASD: Move | Click: Attack | Shift: Dodge | E: Interact | Tab: Inventory | Q: Debug', {
            font: '10px Georgia',
            fill: '#666666'
        }).setOrigin(0.5);

        // Keyboard start
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.start('GameScene');
        });
    }
}

// Main Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.initGameState();
        this.generateWorld();
        this.createPlayer();
        this.spawnEnemies();
        this.createUI();
        this.setupInput();
        this.setupCamera();
    }

    initGameState() {
        this.player = null;
        this.enemies = [];
        this.npcs = [];
        this.items = [];
        this.chests = [];

        this.currentZone = 'village';
        this.dungeonProgress = { forest: false, snow: false, mountain: false };

        this.combatCooldown = 0;
        this.dodgeCooldown = 0;
        this.isAttacking = false;
        this.debugMode = false;

        // World dimensions
        this.worldWidth = 80;
        this.worldHeight = 60;
        this.map = [];

        this.floatingTexts = [];
        this.dialogueActive = false;
    }

    generateWorld() {
        // Initialize map
        for (let y = 0; y < this.worldHeight; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.worldWidth; x++) {
                this.map[y][x] = { type: 'grass', walkable: true };
            }
        }

        // Create zones
        this.createVillage();
        this.createForestZone();
        this.createSnowZone();
        this.createMountainZone();

        // Render map
        this.renderMap();
    }

    createVillage() {
        // Village area (center of map)
        const vx = 35, vy = 25;

        // Clear area for village with dirt
        for (let dy = -8; dy < 8; dy++) {
            for (let dx = -12; dx < 12; dx++) {
                const x = vx + dx, y = vy + dy;
                if (x >= 0 && x < this.worldWidth && y >= 0 && y < this.worldHeight) {
                    this.map[y][x] = { type: 'dirt', walkable: true };
                }
            }
        }

        // Main cobblestone paths through village
        for (let dx = -10; dx < 10; dx++) {
            this.map[vy][vx + dx] = { type: 'cobble', walkable: true };
            this.map[vy + 1][vx + dx] = { type: 'cobble', walkable: true };
        }
        for (let dy = -6; dy < 6; dy++) {
            this.map[vy + dy][vx] = { type: 'cobble', walkable: true };
            this.map[vy + dy][vx + 1] = { type: 'cobble', walkable: true };
        }

        // Village well/fountain (decorative center)
        this.map[vy][vx] = { type: 'water', walkable: false };

        // Add buildings
        this.addBuilding(vx - 8, vy - 4, 'Blacksmith');
        this.addBuilding(vx + 4, vy - 4, 'General Store');
        this.addBuilding(vx - 2, vy + 3, 'Inn');

        // Campfire in village square
        this.map[vy + 2][vx - 3] = { type: 'campfire', walkable: false };

        // Add NPCs
        this.npcs.push({
            x: (vx - 6) * CONFIG.tileSize,
            y: (vy - 1) * CONFIG.tileSize,
            name: 'Alvor',
            type: 'blacksmith',
            dialogue: [
                'Welcome to Riverwood, traveler.',
                'I can forge you better weapons if you have gold.',
                'Clear the dungeon in the forest and I\'ll reward you.',
            ],
            sprite: null
        });

        this.npcs.push({
            x: (vx + 6) * CONFIG.tileSize,
            y: (vy - 1) * CONFIG.tileSize,
            name: 'Lucan',
            type: 'merchant',
            dialogue: [
                'Looking to trade? I have goods from all of Skyrim.',
                'Potions, supplies, whatever you need.',
            ],
            sprite: null
        });

        this.npcs.push({
            x: (vx) * CONFIG.tileSize,
            y: (vy + 6) * CONFIG.tileSize,
            name: 'Jarl\'s Guard',
            type: 'questgiver',
            dialogue: [
                'The Jarl needs heroes. Clear the three dungeons.',
                'One in the forest, one in the snowy north, one in the mountains.',
                'Return when all three are cleared for your reward.',
            ],
            sprite: null
        });

        this.villageCenter = { x: vx * CONFIG.tileSize, y: vy * CONFIG.tileSize };
    }

    addBuilding(x, y, name) {
        // Mark building tiles as not walkable
        for (let dy = 0; dy < 3; dy++) {
            for (let dx = 0; dx < 3; dx++) {
                if (y + dy < this.worldHeight && x + dx < this.worldWidth) {
                    this.map[y + dy][x + dx] = { type: 'building', walkable: false, name: name };
                }
            }
        }
    }

    createForestZone() {
        // Forest zone (west of village)
        for (let y = 5; y < 55; y++) {
            for (let x = 0; x < 25; x++) {
                // Varied ground
                if (Math.random() < 0.3) {
                    this.map[y][x] = { type: 'grass2', walkable: true };
                }
                // Trees with variety
                if (Math.random() < 0.12) {
                    const treeType = Math.random() < 0.7 ? 'tree' : 'oak';
                    this.map[y][x] = { type: treeType, walkable: false };
                }
                // Bushes
                else if (Math.random() < 0.05) {
                    this.map[y][x] = { type: 'bush', walkable: false };
                }
                // Flowers
                else if (Math.random() < 0.03) {
                    this.map[y][x] = { type: 'flowers', walkable: true };
                }
                // Boulders
                else if (Math.random() < 0.02) {
                    this.map[y][x] = { type: 'boulder', walkable: false };
                }
            }
        }

        // Add a small stream
        for (let y = 15; y < 45; y++) {
            const streamX = 18 + Math.floor(Math.sin(y / 5) * 2);
            if (streamX < 25) {
                this.map[y][streamX] = { type: 'water', walkable: false };
            }
        }

        // Bridge over stream
        this.map[30][18] = { type: 'bridge', walkable: true };
        this.map[30][19] = { type: 'bridge', walkable: true };

        // Signpost near dungeon
        this.map[28][8] = { type: 'sign', walkable: false };

        // Dungeon entrance
        this.map[30][5] = { type: 'dungeon', walkable: true, dungeon: 'forest' };
        this.map[30][6] = { type: 'dungeon', walkable: true, dungeon: 'forest' };

        // Campfire near dungeon
        this.map[32][7] = { type: 'campfire', walkable: false };
    }

    createSnowZone() {
        // Snow zone (north of village)
        for (let y = 0; y < 15; y++) {
            for (let x = 20; x < 60; x++) {
                this.map[y][x] = { type: 'snow', walkable: true };
                // Pine trees
                if (Math.random() < 0.08) {
                    this.map[y][x] = { type: 'pine', walkable: false };
                }
                // Dead trees
                else if (Math.random() < 0.03) {
                    this.map[y][x] = { type: 'deadtree', walkable: false };
                }
                // Boulders
                else if (Math.random() < 0.02) {
                    this.map[y][x] = { type: 'boulder', walkable: false };
                }
            }
        }

        // Graveyard near dungeon
        for (let dy = 0; dy < 3; dy++) {
            for (let dx = 0; dx < 4; dx++) {
                if (Math.random() < 0.6) {
                    this.map[3 + dy][35 + dx] = { type: 'tomb', walkable: false };
                }
            }
        }

        // Signpost
        this.map[8][42] = { type: 'sign', walkable: false };

        // Dungeon entrance
        this.map[5][40] = { type: 'dungeon', walkable: true, dungeon: 'snow' };
        this.map[5][41] = { type: 'dungeon', walkable: true, dungeon: 'snow' };
    }

    createMountainZone() {
        // Mountain zone (east of village)
        for (let y = 15; y < 50; y++) {
            for (let x = 60; x < 80; x++) {
                this.map[y][x] = { type: 'stone', walkable: true };
                // Rocky walls
                if (Math.random() < 0.15) {
                    this.map[y][x] = { type: 'wall', walkable: false };
                }
                // Boulders
                else if (Math.random() < 0.05) {
                    this.map[y][x] = { type: 'boulder', walkable: false };
                }
                // Dead trees (sparse)
                else if (Math.random() < 0.02) {
                    this.map[y][x] = { type: 'deadtree', walkable: false };
                }
            }
        }

        // Ruins/ruins near dungeon
        for (let dy = 0; dy < 4; dy++) {
            for (let dx = 0; dx < 5; dx++) {
                if (Math.random() < 0.4) {
                    this.map[26 + dy][70 + dx] = { type: 'wall', walkable: false };
                }
            }
        }

        // Signpost
        this.map[32][72] = { type: 'sign', walkable: false };

        // Campfire at ruins
        this.map[28][72] = { type: 'campfire', walkable: false };

        // Dungeon entrance
        this.map[30][75] = { type: 'dungeon', walkable: true, dungeon: 'mountain' };
        this.map[30][76] = { type: 'dungeon', walkable: true, dungeon: 'mountain' };
    }

    renderMap() {
        this.tileGroup = this.add.group();
        this.objectGroup = this.add.group();

        for (let y = 0; y < this.worldHeight; y++) {
            for (let x = 0; x < this.worldWidth; x++) {
                const tile = this.map[y][x];
                let texture = 'grass';
                let overlayTexture = null;

                // Determine base ground texture
                switch (tile.type) {
                    case 'grass2': texture = 'grass2'; break;
                    case 'dirt': texture = 'dirt'; break;
                    case 'cobble': texture = 'cobble'; break;
                    case 'snow': texture = 'snow'; break;
                    case 'stone': texture = 'stone'; break;
                    case 'wall': texture = 'wall'; break;
                    case 'water': texture = 'water'; break;
                    case 'bridge': texture = 'bridge'; break;
                    case 'flowers': texture = 'flowers'; break;
                    case 'building': texture = 'cobble'; break;
                    case 'tree': texture = 'grass'; overlayTexture = 'tree'; break;
                    case 'oak': texture = 'grass'; overlayTexture = 'oak'; break;
                    case 'pine': texture = 'snow'; overlayTexture = 'pine'; break;
                    case 'deadtree': texture = tile.type === 'snow' ? 'snow' : 'stone'; overlayTexture = 'deadtree'; break;
                    case 'bush': texture = 'grass'; overlayTexture = 'bush'; break;
                    case 'boulder': texture = 'stone'; overlayTexture = 'boulder'; break;
                    case 'campfire': texture = 'dirt'; overlayTexture = 'campfire'; break;
                    case 'tomb': texture = 'snow'; overlayTexture = 'tomb'; break;
                    case 'sign': texture = 'grass'; overlayTexture = 'sign'; break;
                    case 'dungeon': texture = 'stone'; break;
                }

                const sprite = this.add.sprite(x * CONFIG.tileSize, y * CONFIG.tileSize, texture);
                sprite.setOrigin(0);
                sprite.setDepth(0);
                this.tileGroup.add(sprite);

                // Add overlay objects
                if (overlayTexture) {
                    const yOffset = (overlayTexture === 'tree' || overlayTexture === 'oak' || overlayTexture === 'pine' || overlayTexture === 'deadtree' || overlayTexture === 'sign') ? -1 : 0;
                    const obj = this.add.sprite(x * CONFIG.tileSize, (y + yOffset) * CONFIG.tileSize, overlayTexture);
                    obj.setOrigin(0);
                    obj.setDepth(y * CONFIG.tileSize);
                    this.objectGroup.add(obj);

                    // Animate campfire
                    if (overlayTexture === 'campfire') {
                        this.tweens.add({
                            targets: obj,
                            alpha: 0.7,
                            duration: 200,
                            yoyo: true,
                            repeat: -1
                        });
                    }
                }

                // Dungeon entrance special handling
                if (tile.type === 'dungeon') {
                    const dungeon = this.add.sprite(x * CONFIG.tileSize, (y - 1) * CONFIG.tileSize, 'dungeon');
                    dungeon.setOrigin(0);
                    dungeon.setDepth(5);
                    this.objectGroup.add(dungeon);

                    // Add marker
                    const marker = this.add.sprite(x * CONFIG.tileSize + 8, (y - 2) * CONFIG.tileSize, 'marker');
                    marker.setOrigin(0.5);
                    marker.setDepth(1000);
                    this.tweens.add({
                        targets: marker,
                        y: marker.y - 8,
                        duration: 500,
                        yoyo: true,
                        repeat: -1
                    });
                }
            }
        }

        // Add NPC sprites
        this.npcs.forEach(npc => {
            npc.sprite = this.add.sprite(npc.x, npc.y, 'npc');
            npc.sprite.setOrigin(0);
            npc.sprite.setDepth(npc.y);
        });

        // Add chests near dungeons
        this.addChest(8, 32, 'forest');
        this.addChest(38, 8, 'snow');
        this.addChest(72, 32, 'mountain');
    }

    addChest(x, y, zone) {
        const chest = this.add.sprite(x * CONFIG.tileSize, y * CONFIG.tileSize, 'chest');
        chest.setOrigin(0);
        chest.setDepth(y * CONFIG.tileSize);
        chest.zone = zone;
        chest.opened = false;
        chest.setInteractive();
        this.chests.push(chest);
    }

    createPlayer() {
        const startX = 35 * CONFIG.tileSize;
        const startY = 28 * CONFIG.tileSize;

        this.player = this.add.sprite(startX, startY, 'player');
        this.player.setOrigin(0);
        this.player.setDepth(100);

        // Player stats
        this.player.hp = CONFIG.baseHealth;
        this.player.maxHp = CONFIG.baseHealth;
        this.player.stamina = CONFIG.baseStamina;
        this.player.maxStamina = CONFIG.baseStamina;
        this.player.magicka = CONFIG.baseMagicka;
        this.player.maxMagicka = CONFIG.baseMagicka;

        this.player.gold = 50;
        this.player.level = 1;
        this.player.xp = 0;
        this.player.xpToLevel = 100;

        this.player.weapon = { ...CONFIG.weapons.ironSword };
        this.player.armor = { ...CONFIG.armor.leather };

        this.player.inventory = ['potion', 'potion'];
        this.player.perks = [];

        this.player.facing = 'down';
        this.player.isMoving = false;
        this.player.isSprinting = false;
        this.player.isDodging = false;
    }

    spawnEnemies() {
        // Forest enemies
        for (let i = 0; i < 8; i++) {
            this.createEnemy(
                5 + Math.floor(Math.random() * 18),
                10 + Math.floor(Math.random() * 40),
                Math.random() < 0.5 ? 'wolf' : 'bandit'
            );
        }

        // Snow enemies
        for (let i = 0; i < 8; i++) {
            this.createEnemy(
                25 + Math.floor(Math.random() * 30),
                2 + Math.floor(Math.random() * 10),
                Math.random() < 0.5 ? 'wolf' : 'draugr'
            );
        }

        // Mountain enemies
        for (let i = 0; i < 8; i++) {
            this.createEnemy(
                62 + Math.floor(Math.random() * 15),
                18 + Math.floor(Math.random() * 28),
                Math.random() < 0.5 ? 'bear' : 'troll'
            );
        }
    }

    createEnemy(tileX, tileY, type) {
        // Check if tile is walkable
        if (!this.map[tileY] || !this.map[tileY][tileX] || !this.map[tileY][tileX].walkable) return;

        const enemyData = {
            wolf: { hp: 25, damage: 6, speed: 60, xp: 15, gold: 0, texture: 'wolf' },
            bandit: { hp: 40, damage: 8, speed: 50, xp: 25, gold: 15, texture: 'bandit' },
            draugr: { hp: 50, damage: 10, speed: 40, xp: 35, gold: 20, texture: 'draugr' },
            bear: { hp: 60, damage: 12, speed: 45, xp: 40, gold: 0, texture: 'bear' },
            troll: { hp: 80, damage: 15, speed: 35, xp: 60, gold: 0, texture: 'troll' }
        };

        const data = enemyData[type];
        const enemy = this.add.sprite(tileX * CONFIG.tileSize, tileY * CONFIG.tileSize, data.texture);
        enemy.setOrigin(0);
        enemy.setDepth(tileY * CONFIG.tileSize);

        enemy.type = type;
        enemy.hp = data.hp;
        enemy.maxHp = data.hp;
        enemy.damage = data.damage;
        enemy.speed = data.speed;
        enemy.xp = data.xp;
        enemy.gold = data.gold;
        enemy.alerted = false;
        enemy.attackCooldown = 0;
        enemy.state = 'idle';

        this.enemies.push(enemy);
    }

    createUI() {
        this.uiContainer = this.add.container(0, 0);
        this.uiContainer.setScrollFactor(0);
        this.uiContainer.setDepth(1000);

        const { width, height } = this.cameras.main;

        // Bottom HUD bar - Stoneshard style dark metallic
        const hudBg = this.add.rectangle(width/2, height - 28, width, 56, 0x1a1a20, 0.95);
        this.uiContainer.add(hudBg);

        // HUD border
        const hudBorder = this.add.rectangle(width/2, height - 28, width - 4, 52, 0x000000, 0);
        hudBorder.setStrokeStyle(2, 0x3a3a4a);
        this.uiContainer.add(hudBorder);

        // Left panel - bars
        const barPanel = this.add.rectangle(110, height - 28, 200, 48, 0x15151a, 0.9);
        barPanel.setStrokeStyle(1, 0x2a2a3a);
        this.uiContainer.add(barPanel);

        // HP Bar - red gradient look
        const hpBg = this.add.rectangle(110, height - 40, 180, 14, 0x2a1515);
        hpBg.setStrokeStyle(1, 0x4a2525);
        this.hpBar = this.add.rectangle(21, height - 40, 176, 10, 0x8a2525);
        this.hpBar.setOrigin(0, 0.5);
        const hpLabel = this.add.text(14, height - 40, '♥', { font: '10px Georgia', fill: '#aa4444' }).setOrigin(0.5, 0.5);
        this.hpText = this.add.text(110, height - 40, '100/100', { font: '9px Georgia', fill: '#ffffff' }).setOrigin(0.5, 0.5);
        this.uiContainer.add([hpBg, this.hpBar, hpLabel, this.hpText]);

        // Stamina Bar - green
        const stBg = this.add.rectangle(110, height - 24, 180, 14, 0x152a15);
        stBg.setStrokeStyle(1, 0x254a25);
        this.stBar = this.add.rectangle(21, height - 24, 176, 10, 0x258a25);
        this.stBar.setOrigin(0, 0.5);
        const stLabel = this.add.text(14, height - 24, '⚡', { font: '9px Georgia', fill: '#44aa44' }).setOrigin(0.5, 0.5);
        this.stText = this.add.text(110, height - 24, '100/100', { font: '9px Georgia', fill: '#ffffff' }).setOrigin(0.5, 0.5);
        this.uiContainer.add([stBg, this.stBar, stLabel, this.stText]);

        // XP Bar - yellow (under stamina, smaller)
        const xpBg = this.add.rectangle(110, height - 10, 180, 8, 0x2a2a15);
        xpBg.setStrokeStyle(1, 0x4a4a25);
        this.xpBar = this.add.rectangle(21, height - 10, 0, 6, 0x8a8a25);
        this.xpBar.setOrigin(0, 0.5);
        this.xpText = this.add.text(110, height - 10, 'XP: 0/100', { font: '7px Georgia', fill: '#aaaa44' }).setOrigin(0.5, 0.5);
        this.uiContainer.add([xpBg, this.xpBar, this.xpText]);

        // Center panel - quick slots
        const centerPanel = this.add.rectangle(width/2, height - 28, 120, 48, 0x15151a, 0.9);
        centerPanel.setStrokeStyle(1, 0x2a2a3a);
        this.uiContainer.add(centerPanel);

        // Quick slot boxes
        for (let i = 0; i < 4; i++) {
            const slotX = width/2 - 45 + i * 30;
            const slot = this.add.rectangle(slotX, height - 28, 26, 26, 0x1a1a20);
            slot.setStrokeStyle(1, 0x3a3a4a);
            this.uiContainer.add(slot);
            const keyLabel = this.add.text(slotX, height - 16, `${i+1}`, { font: '8px Georgia', fill: '#555555' }).setOrigin(0.5);
            this.uiContainer.add(keyLabel);
        }

        // Right panel - stats
        const rightPanel = this.add.rectangle(width - 90, height - 28, 160, 48, 0x15151a, 0.9);
        rightPanel.setStrokeStyle(1, 0x2a2a3a);
        this.uiContainer.add(rightPanel);

        // Gold with icon
        const goldIcon = this.add.text(width - 160, height - 38, '●', { font: '10px Georgia', fill: '#d4af37' });
        this.goldText = this.add.text(width - 148, height - 38, '50', { font: '11px Georgia', fill: '#d4af37' });
        this.uiContainer.add([goldIcon, this.goldText]);

        // Level
        this.levelText = this.add.text(width - 160, height - 22, 'Lv. 1', { font: '11px Georgia', fill: '#aaaaaa' });
        this.uiContainer.add(this.levelText);

        // Weapon display
        this.weaponText = this.add.text(width - 90, height - 38, 'Iron Sword', { font: '9px Georgia', fill: '#8888aa' });
        this.uiContainer.add(this.weaponText);

        // Armor display
        this.armorText = this.add.text(width - 90, height - 22, 'Leather', { font: '9px Georgia', fill: '#8888aa' });
        this.uiContainer.add(this.armorText);

        // Minimap
        this.minimapGraphics = this.add.graphics();
        this.minimapGraphics.setScrollFactor(0);
        this.minimapGraphics.setDepth(1000);

        // Quest objective (top)
        this.questText = this.add.text(10, 10, 'Quest: Clear the three dungeons', {
            font: '11px Georgia',
            fill: '#d4af37'
        });
        this.uiContainer.add(this.questText);

        // Dungeon progress
        this.progressText = this.add.text(10, 25, 'Dungeons: [_] [_] [_]', {
            font: '10px Georgia',
            fill: '#aaaaaa'
        });
        this.uiContainer.add(this.progressText);

        // Interaction prompt (hidden by default)
        this.interactPrompt = this.add.text(width/2, height - 80, '[E] Interact', {
            font: '12px Georgia',
            fill: '#ffffff',
            backgroundColor: '#1a1a1a',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);
        this.interactPrompt.setVisible(false);
        this.uiContainer.add(this.interactPrompt);

        // Debug overlay
        this.createDebugOverlay();

        // Dialogue box (hidden)
        this.createDialogueBox();
    }

    createDebugOverlay() {
        const { height } = this.cameras.main;

        this.debugOverlay = this.add.container(10, 50);
        this.debugOverlay.setScrollFactor(0);
        this.debugOverlay.setDepth(2000);
        this.debugOverlay.setVisible(false);

        const bg = this.add.rectangle(0, 0, 180, 140, 0x000000, 0.8);
        bg.setOrigin(0);
        bg.setStrokeStyle(1, 0x4aaa4a);
        this.debugOverlay.add(bg);

        const header = this.add.text(5, 5, 'DEBUG (Q to toggle)', {
            font: 'bold 10px Georgia',
            fill: '#4aff4a'
        });
        this.debugOverlay.add(header);

        this.debugText = this.add.text(5, 20, '', {
            font: '9px Georgia',
            fill: '#aaffaa',
            lineSpacing: 2
        });
        this.debugOverlay.add(this.debugText);
    }

    createDialogueBox() {
        const { width, height } = this.cameras.main;

        this.dialogueBox = this.add.container(width/2, height - 120);
        this.dialogueBox.setScrollFactor(0);
        this.dialogueBox.setDepth(3000);
        this.dialogueBox.setVisible(false);

        const bg = this.add.rectangle(0, 0, 500, 100, 0x1a1a2a, 0.95);
        bg.setStrokeStyle(2, 0x4a4a6a);
        this.dialogueBox.add(bg);

        this.dialogueName = this.add.text(-230, -40, '', {
            font: 'bold 14px Georgia',
            fill: '#d4af37'
        });
        this.dialogueBox.add(this.dialogueName);

        this.dialogueText = this.add.text(-230, -15, '', {
            font: '12px Georgia',
            fill: '#cccccc',
            wordWrap: { width: 460 }
        });
        this.dialogueBox.add(this.dialogueText);

        this.dialogueContinue = this.add.text(230, 35, '[E] Continue', {
            font: '10px Georgia',
            fill: '#888888'
        }).setOrigin(1, 0.5);
        this.dialogueBox.add(this.dialogueContinue);
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D'
        });

        this.input.keyboard.on('keydown-E', () => this.interact());
        this.input.keyboard.on('keydown-TAB', (e) => {
            e.preventDefault();
            this.toggleInventory();
        });
        this.input.keyboard.on('keydown-Q', () => {
            this.debugMode = !this.debugMode;
            this.debugOverlay.setVisible(this.debugMode);
        });
        this.input.keyboard.on('keydown-ONE', () => this.useItem(0));
        this.input.keyboard.on('keydown-TWO', () => this.useItem(1));
        this.input.keyboard.on('keydown-THREE', () => this.useItem(2));

        this.input.on('pointerdown', (pointer) => {
            if (!this.dialogueActive) {
                this.attack(pointer);
            }
        });

        this.shiftKey = this.input.keyboard.addKey('SHIFT');
    }

    setupCamera() {
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, this.worldWidth * CONFIG.tileSize, this.worldHeight * CONFIG.tileSize);
    }

    update(time, delta) {
        if (this.dialogueActive) return;

        this.handleMovement(delta);
        this.updateEnemies(delta);
        this.updateCombat(delta);
        this.updateUI();
        this.checkInteractions();
        this.checkDungeonEntrance();

        if (this.debugMode) {
            this.updateDebug();
        }

        this.updateFloatingTexts(delta);

        // Regenerate stamina
        if (!this.player.isSprinting && this.combatCooldown <= 0) {
            this.player.stamina = Math.min(this.player.stamina + 10 * delta / 1000, this.player.maxStamina);
        }
    }

    handleMovement(delta) {
        let dx = 0, dy = 0;

        if (this.wasd.left.isDown || this.cursors.left.isDown) dx = -1;
        else if (this.wasd.right.isDown || this.cursors.right.isDown) dx = 1;
        if (this.wasd.up.isDown || this.cursors.up.isDown) dy = -1;
        else if (this.wasd.down.isDown || this.cursors.down.isDown) dy = 1;

        // Dodge roll
        if (this.shiftKey.isDown && !this.player.isDodging && this.dodgeCooldown <= 0 && (dx !== 0 || dy !== 0)) {
            if (this.player.stamina >= CONFIG.dodgeStamina) {
                this.player.stamina -= CONFIG.dodgeStamina;
                this.player.isDodging = true;
                this.dodgeCooldown = 800;

                const dodgeSpeed = 200;
                const dodgeDuration = 300;

                this.tweens.add({
                    targets: this.player,
                    x: this.player.x + dx * dodgeSpeed * dodgeDuration / 1000,
                    y: this.player.y + dy * dodgeSpeed * dodgeDuration / 1000,
                    duration: dodgeDuration,
                    onComplete: () => {
                        this.player.isDodging = false;
                    }
                });

                return;
            }
        }

        if (this.player.isDodging) return;

        // Normal movement
        this.player.isSprinting = this.shiftKey.isDown && this.player.stamina > 0;
        const speed = this.player.isSprinting ? CONFIG.sprintSpeed : CONFIG.playerSpeed;

        if (this.player.isSprinting) {
            this.player.stamina -= 5 * delta / 1000;
            if (this.player.stamina < 0) this.player.stamina = 0;
        }

        if (dx !== 0 || dy !== 0) {
            // Normalize diagonal movement
            if (dx !== 0 && dy !== 0) {
                dx *= 0.707;
                dy *= 0.707;
            }

            const newX = this.player.x + dx * speed * delta / 1000;
            const newY = this.player.y + dy * speed * delta / 1000;

            // Check collision
            if (this.canMoveTo(newX, this.player.y)) {
                this.player.x = newX;
            }
            if (this.canMoveTo(this.player.x, newY)) {
                this.player.y = newY;
            }

            // Update facing direction
            if (Math.abs(dx) > Math.abs(dy)) {
                this.player.facing = dx > 0 ? 'right' : 'left';
            } else {
                this.player.facing = dy > 0 ? 'down' : 'up';
            }

            this.player.setDepth(this.player.y);
        }

        // Update cooldowns
        if (this.dodgeCooldown > 0) this.dodgeCooldown -= delta;
        if (this.combatCooldown > 0) this.combatCooldown -= delta;
    }

    canMoveTo(x, y) {
        const tileX = Math.floor(x / CONFIG.tileSize);
        const tileY = Math.floor((y + 20) / CONFIG.tileSize); // Offset for sprite height

        if (tileX < 0 || tileX >= this.worldWidth || tileY < 0 || tileY >= this.worldHeight) {
            return false;
        }

        return this.map[tileY][tileX].walkable;
    }

    attack(pointer) {
        if (this.combatCooldown > 0 || this.isAttacking) return;

        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.player.x + 8, this.player.y + 12, worldPoint.x, worldPoint.y);

        // Check stamina for attack
        const staminaCost = pointer.leftButtonDown() ? CONFIG.lightAttackStamina : CONFIG.powerAttackStamina;
        if (this.player.stamina < staminaCost) {
            this.showFloatingText(this.player.x, this.player.y, 'No Stamina!', '#ff8844');
            return;
        }

        this.player.stamina -= staminaCost;
        this.isAttacking = true;

        // Show swing effect
        const swing = this.add.sprite(this.player.x + 8, this.player.y + 12, 'swing');
        swing.setRotation(angle);
        swing.setDepth(this.player.depth + 1);
        swing.setAlpha(0.7);

        this.tweens.add({
            targets: swing,
            alpha: 0,
            scale: 1.3,
            duration: 200,
            onComplete: () => {
                swing.destroy();
                this.isAttacking = false;
            }
        });

        // Check for hits
        const damage = this.player.weapon.damage;
        const range = this.player.weapon.range;

        this.enemies.forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(
                this.player.x + 8, this.player.y + 12,
                enemy.x + 8, enemy.y + 12
            );

            if (dist <= range) {
                const angleToEnemy = Phaser.Math.Angle.Between(
                    this.player.x + 8, this.player.y + 12,
                    enemy.x + 8, enemy.y + 12
                );

                // Check if enemy is in front of player (within 90 degree arc)
                const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angle - angleToEnemy));
                if (angleDiff < Math.PI / 2) {
                    this.hitEnemy(enemy, damage);
                }
            }
        });

        this.combatCooldown = this.player.weapon.speed * 1000;
    }

    hitEnemy(enemy, damage) {
        // Apply damage
        const finalDamage = Math.max(1, damage - Math.floor(enemy.type === 'troll' ? 5 : 0));
        enemy.hp -= finalDamage;

        // Floating damage number with size based on damage
        const fontSize = Math.min(16, 10 + Math.floor(finalDamage / 5));
        this.showFloatingText(enemy.x + 8, enemy.y, `-${finalDamage}`, '#ff4444', fontSize);

        // Screen shake - intensity based on damage
        this.cameras.main.shake(60, 0.003 + finalDamage * 0.0005);

        // Hitstop effect (brief pause)
        this.time.timeScale = 0.1;
        this.time.delayedCall(30, () => { this.time.timeScale = 1; });

        // Blood particles
        this.createBloodParticles(enemy.x + 8, enemy.y + 8, 5);

        // Flash enemy red
        enemy.setTint(0xff4444);
        this.time.delayedCall(80, () => { enemy.clearTint(); });

        // Knockback
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        enemy.x += Math.cos(angle) * 4;
        enemy.y += Math.sin(angle) * 4;

        // Alert enemy
        enemy.alerted = true;

        // Check death
        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    createBloodParticles(x, y, count) {
        for (let i = 0; i < count; i++) {
            const particle = this.add.circle(x, y, 2, 0x8a2222);
            particle.setDepth(500);

            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 30;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            this.tweens.add({
                targets: particle,
                x: particle.x + vx,
                y: particle.y + vy,
                alpha: 0,
                scale: 0.5,
                duration: 300 + Math.random() * 200,
                onComplete: () => particle.destroy()
            });
        }
    }

    killEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }

        // XP and gold
        this.player.xp += enemy.xp;
        this.player.gold += enemy.gold;

        this.showFloatingText(enemy.x, enemy.y, `+${enemy.xp} XP`, '#ffff44');
        if (enemy.gold > 0) {
            this.showFloatingText(enemy.x + 10, enemy.y + 10, `+${enemy.gold}g`, '#d4af37');
        }

        // Check level up
        if (this.player.xp >= this.player.xpToLevel) {
            this.levelUp();
        }

        enemy.destroy();
    }

    levelUp() {
        this.player.level++;
        this.player.xp -= this.player.xpToLevel;
        this.player.xpToLevel = Math.floor(this.player.xpToLevel * 1.5);

        this.player.maxHp += 10;
        this.player.hp = this.player.maxHp;
        this.player.maxStamina += 5;
        this.player.stamina = this.player.maxStamina;

        this.showFloatingText(this.player.x, this.player.y - 20, 'LEVEL UP!', '#44ff44');

        // Flash effect
        this.cameras.main.flash(300, 255, 255, 200);
    }

    updateEnemies(delta) {
        this.enemies.forEach(enemy => {
            if (enemy.attackCooldown > 0) {
                enemy.attackCooldown -= delta;
            }

            const distToPlayer = Phaser.Math.Distance.Between(
                enemy.x, enemy.y, this.player.x, this.player.y
            );

            // Detection range
            const detectionRange = 150;
            const attackRange = 24;

            if (distToPlayer < detectionRange) {
                enemy.alerted = true;
            }

            if (enemy.alerted) {
                // Move toward player
                if (distToPlayer > attackRange && distToPlayer < 300) {
                    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                    const dx = Math.cos(angle) * enemy.speed * delta / 1000;
                    const dy = Math.sin(angle) * enemy.speed * delta / 1000;

                    if (this.canMoveTo(enemy.x + dx, enemy.y)) {
                        enemy.x += dx;
                    }
                    if (this.canMoveTo(enemy.x, enemy.y + dy)) {
                        enemy.y += dy;
                    }

                    enemy.setDepth(enemy.y);
                }

                // Attack player
                if (distToPlayer <= attackRange && enemy.attackCooldown <= 0) {
                    this.enemyAttackPlayer(enemy);
                    enemy.attackCooldown = 1000;
                }
            }
        });
    }

    enemyAttackPlayer(enemy) {
        if (this.player.isDodging) return;

        const damage = Math.max(1, enemy.damage - Math.floor(this.player.armor.defense / 4));
        this.player.hp -= damage;

        this.showFloatingText(this.player.x + 8, this.player.y, `-${damage}`, '#ff4444');

        // Screen effects
        this.cameras.main.flash(100, 100, 0, 0);
        this.cameras.main.shake(100, 0.01);

        // Flash player
        this.tweens.add({
            targets: this.player,
            alpha: 0.5,
            duration: 50,
            yoyo: true,
            repeat: 2
        });

        // Check death
        if (this.player.hp <= 0) {
            this.playerDeath();
        }
    }

    playerDeath() {
        const { width, height } = this.cameras.main;

        // Death overlay
        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.9);
        overlay.setScrollFactor(0);
        overlay.setDepth(5000);

        const deathText = this.add.text(width/2, height/2 - 30, 'YOU DIED', {
            font: 'bold 32px Georgia',
            fill: '#aa3333'
        }).setOrigin(0.5);
        deathText.setScrollFactor(0);
        deathText.setDepth(5001);

        const restartText = this.add.text(width/2, height/2 + 30, 'Click to restart', {
            font: '14px Georgia',
            fill: '#888888'
        }).setOrigin(0.5);
        restartText.setScrollFactor(0);
        restartText.setDepth(5001);

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }

    updateCombat(delta) {
        // Combat cooldown handled in update
    }

    checkInteractions() {
        let canInteract = false;
        let interactTarget = null;

        // Check NPCs
        this.npcs.forEach(npc => {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, npc.x, npc.y
            );
            if (dist < 40) {
                canInteract = true;
                interactTarget = npc;
            }
        });

        // Check chests
        this.chests.forEach(chest => {
            if (chest.opened) return;
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, chest.x, chest.y
            );
            if (dist < 30) {
                canInteract = true;
                interactTarget = chest;
            }
        });

        this.interactPrompt.setVisible(canInteract);
        this.currentInteractTarget = interactTarget;
    }

    interact() {
        if (this.dialogueActive) {
            // Advance dialogue
            this.advanceDialogue();
            return;
        }

        if (!this.currentInteractTarget) return;

        if (this.currentInteractTarget.dialogue) {
            // NPC interaction
            this.startDialogue(this.currentInteractTarget);
        } else if (this.currentInteractTarget.zone) {
            // Chest interaction
            this.openChest(this.currentInteractTarget);
        }
    }

    startDialogue(npc) {
        this.dialogueActive = true;
        this.currentDialogueNPC = npc;
        this.currentDialogueLine = 0;

        this.dialogueName.setText(npc.name);
        this.dialogueText.setText(npc.dialogue[0]);
        this.dialogueBox.setVisible(true);
    }

    advanceDialogue() {
        this.currentDialogueLine++;

        if (this.currentDialogueLine >= this.currentDialogueNPC.dialogue.length) {
            this.endDialogue();
        } else {
            this.dialogueText.setText(this.currentDialogueNPC.dialogue[this.currentDialogueLine]);
        }
    }

    endDialogue() {
        this.dialogueActive = false;
        this.dialogueBox.setVisible(false);
        this.currentDialogueNPC = null;
    }

    openChest(chest) {
        if (chest.opened) return;

        chest.opened = true;
        chest.setTint(0x666666);

        // Give loot
        const goldAmount = 20 + Math.floor(Math.random() * 40);
        this.player.gold += goldAmount;
        this.showFloatingText(chest.x, chest.y, `+${goldAmount} Gold`, '#d4af37');

        if (Math.random() < 0.5) {
            this.player.inventory.push('potion');
            this.showFloatingText(chest.x + 10, chest.y + 10, '+Potion', '#aa4444');
        }
    }

    checkDungeonEntrance() {
        const tileX = Math.floor((this.player.x + 8) / CONFIG.tileSize);
        const tileY = Math.floor((this.player.y + 20) / CONFIG.tileSize);

        if (this.map[tileY] && this.map[tileY][tileX] && this.map[tileY][tileX].dungeon) {
            const dungeon = this.map[tileY][tileX].dungeon;
            if (!this.dungeonProgress[dungeon]) {
                this.enterDungeon(dungeon);
            }
        }
    }

    enterDungeon(dungeonType) {
        this.scene.start('DungeonScene', {
            type: dungeonType,
            playerStats: {
                hp: this.player.hp,
                maxHp: this.player.maxHp,
                stamina: this.player.stamina,
                maxStamina: this.player.maxStamina,
                gold: this.player.gold,
                level: this.player.level,
                xp: this.player.xp,
                xpToLevel: this.player.xpToLevel,
                weapon: this.player.weapon,
                armor: this.player.armor,
                inventory: this.player.inventory
            },
            dungeonProgress: this.dungeonProgress
        });
    }

    useItem(slot) {
        if (this.player.inventory[slot]) {
            const item = this.player.inventory[slot];
            if (item === 'potion') {
                const heal = 50;
                this.player.hp = Math.min(this.player.hp + heal, this.player.maxHp);
                this.showFloatingText(this.player.x, this.player.y, `+${heal} HP`, '#44aa44');
                this.player.inventory.splice(slot, 1);
            }
        }
    }

    toggleInventory() {
        // Simple inventory toggle - could be expanded
        console.log('Inventory:', this.player.inventory);
        this.showFloatingText(this.player.x, this.player.y - 30,
            `Items: ${this.player.inventory.length}`, '#aaaaaa');
    }

    showFloatingText(x, y, text, color, fontSize = 11) {
        const floatText = this.add.text(x, y, text, {
            font: `bold ${fontSize}px Georgia`,
            fill: color,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        floatText.setDepth(4000);
        floatText.life = 1000;
        floatText.startY = y;
        this.floatingTexts.push(floatText);

        // Pop-in effect
        floatText.setScale(1.5);
        this.tweens.add({
            targets: floatText,
            scaleX: 1,
            scaleY: 1,
            duration: 100
        });
    }

    updateFloatingTexts(delta) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const text = this.floatingTexts[i];
            text.life -= delta;
            text.y = text.startY - (1000 - text.life) * 0.03;
            text.alpha = text.life / 1000;

            if (text.life <= 0) {
                text.destroy();
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    updateUI() {
        // HP bar
        const hpPercent = this.player.hp / this.player.maxHp;
        this.hpBar.width = 176 * hpPercent;
        this.hpText.setText(`${Math.floor(this.player.hp)}/${this.player.maxHp}`);

        // Change HP bar color based on health
        if (hpPercent < 0.25) {
            this.hpBar.setFillStyle(0xaa2525);
            // Low HP warning vignette
            if (!this.lowHpVignette) {
                this.lowHpVignette = this.add.rectangle(
                    this.cameras.main.width/2, this.cameras.main.height/2,
                    this.cameras.main.width, this.cameras.main.height,
                    0xff0000, 0
                );
                this.lowHpVignette.setScrollFactor(0);
                this.lowHpVignette.setDepth(999);
            }
            this.lowHpVignette.setAlpha(0.15 + Math.sin(this.time.now / 200) * 0.1);
        } else {
            this.hpBar.setFillStyle(0x8a2525);
            if (this.lowHpVignette) {
                this.lowHpVignette.setAlpha(0);
            }
        }

        // Stamina bar
        const stPercent = this.player.stamina / this.player.maxStamina;
        this.stBar.width = 176 * stPercent;
        this.stText.setText(`${Math.floor(this.player.stamina)}/${this.player.maxStamina}`);

        // XP bar
        const xpPercent = this.player.xp / this.player.xpToLevel;
        this.xpBar.width = 176 * xpPercent;
        this.xpText.setText(`XP: ${this.player.xp}/${this.player.xpToLevel}`);

        // Gold and level
        this.goldText.setText(`${this.player.gold}`);
        this.levelText.setText(`Lv. ${this.player.level}`);

        // Weapon and armor
        this.weaponText.setText(this.player.weapon.name);
        this.armorText.setText(this.player.armor.name);

        // Dungeon progress
        const f = this.dungeonProgress.forest ? '✓' : '○';
        const s = this.dungeonProgress.snow ? '✓' : '○';
        const m = this.dungeonProgress.mountain ? '✓' : '○';
        this.progressText.setText(`Dungeons: ${f} ${s} ${m}`);

        // Update minimap
        this.updateMinimap();
    }

    updateMinimap() {
        if (!this.minimapGraphics) return;

        this.minimapGraphics.clear();

        const mapX = this.cameras.main.width - 75;
        const mapY = 75;
        const scale = 0.8;

        // Background
        this.minimapGraphics.fillStyle(0x1a1a1a, 0.8);
        this.minimapGraphics.fillRect(mapX - 35, mapY - 35, 70, 70);
        this.minimapGraphics.lineStyle(1, 0x3a3a4a);
        this.minimapGraphics.strokeRect(mapX - 35, mapY - 35, 70, 70);

        // Draw terrain (simplified)
        const playerTileX = Math.floor(this.player.x / CONFIG.tileSize);
        const playerTileY = Math.floor(this.player.y / CONFIG.tileSize);

        for (let dy = -20; dy <= 20; dy++) {
            for (let dx = -20; dx <= 20; dx++) {
                const tx = playerTileX + dx;
                const ty = playerTileY + dy;
                if (tx >= 0 && tx < this.worldWidth && ty >= 0 && ty < this.worldHeight) {
                    const tile = this.map[ty][tx];
                    let color = 0x3a5a3a; // grass
                    if (tile.type === 'snow' || tile.type === 'pine') color = 0xaaaacc;
                    else if (tile.type === 'stone' || tile.type === 'mountain') color = 0x6a6a6a;
                    else if (tile.type === 'dirt' || tile.type === 'cobble') color = 0x6a5a4a;
                    else if (tile.type === 'water') color = 0x3a5a8a;
                    else if (tile.type === 'dungeon') color = 0xaa4444;
                    else if (!tile.walkable) color = 0x2a2a2a;

                    this.minimapGraphics.fillStyle(color);
                    this.minimapGraphics.fillRect(mapX + dx * scale, mapY + dy * scale, scale, scale);
                }
            }
        }

        // Draw enemies
        this.enemies.forEach(enemy => {
            const ex = Math.floor(enemy.x / CONFIG.tileSize) - playerTileX;
            const ey = Math.floor(enemy.y / CONFIG.tileSize) - playerTileY;
            if (Math.abs(ex) <= 20 && Math.abs(ey) <= 20) {
                this.minimapGraphics.fillStyle(0xff4444);
                this.minimapGraphics.fillRect(mapX + ex * scale - 1, mapY + ey * scale - 1, 3, 3);
            }
        });

        // Draw player (center)
        this.minimapGraphics.fillStyle(0x44ff44);
        this.minimapGraphics.fillRect(mapX - 2, mapY - 2, 4, 4);
    }

    updateDebug() {
        const tileX = Math.floor(this.player.x / CONFIG.tileSize);
        const tileY = Math.floor(this.player.y / CONFIG.tileSize);

        const text = [
            `Pos: (${Math.floor(this.player.x)}, ${Math.floor(this.player.y)})`,
            `Tile: (${tileX}, ${tileY})`,
            `HP: ${Math.floor(this.player.hp)}/${this.player.maxHp}`,
            `Stamina: ${Math.floor(this.player.stamina)}/${this.player.maxStamina}`,
            `Level: ${this.player.level}`,
            `XP: ${this.player.xp}/${this.player.xpToLevel}`,
            `Gold: ${this.player.gold}`,
            `Enemies: ${this.enemies.length}`,
            `Weapon: ${this.player.weapon.name}`,
            `FPS: ${Math.round(this.game.loop.actualFps)}`
        ].join('\n');

        this.debugText.setText(text);
    }
}

// Dungeon Scene
class DungeonScene extends Phaser.Scene {
    constructor() {
        super('DungeonScene');
    }

    init(data) {
        this.dungeonType = data.type;
        this.playerStats = data.playerStats;
        this.dungeonProgress = data.dungeonProgress;
    }

    create() {
        this.generateDungeon();
        this.createPlayer();
        this.spawnDungeonEnemies();
        this.createUI();
        this.setupInput();

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, this.dungeonWidth * CONFIG.tileSize, this.dungeonHeight * CONFIG.tileSize);

        this.floatingTexts = [];
        this.combatCooldown = 0;
        this.isAttacking = false;
        this.bossDefeated = false;
    }

    generateDungeon() {
        this.dungeonWidth = 40;
        this.dungeonHeight = 30;
        this.map = [];

        // Initialize with walls
        for (let y = 0; y < this.dungeonHeight; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.dungeonWidth; x++) {
                this.map[y][x] = { type: 'wall', walkable: false };
            }
        }

        // Generate rooms
        this.rooms = [];
        for (let i = 0; i < 8; i++) {
            const roomW = 5 + Math.floor(Math.random() * 5);
            const roomH = 4 + Math.floor(Math.random() * 4);
            const roomX = 2 + Math.floor(Math.random() * (this.dungeonWidth - roomW - 4));
            const roomY = 2 + Math.floor(Math.random() * (this.dungeonHeight - roomH - 4));

            if (this.canPlaceRoom(roomX, roomY, roomW, roomH)) {
                this.carveRoom(roomX, roomY, roomW, roomH);
                this.rooms.push({ x: roomX, y: roomY, w: roomW, h: roomH });
            }
        }

        // Connect rooms
        for (let i = 1; i < this.rooms.length; i++) {
            this.connectRooms(this.rooms[i-1], this.rooms[i]);
        }

        // Place boss room
        const lastRoom = this.rooms[this.rooms.length - 1];
        this.bossRoom = lastRoom;

        // Render dungeon
        this.renderDungeon();
    }

    canPlaceRoom(x, y, w, h) {
        for (let dy = -1; dy <= h; dy++) {
            for (let dx = -1; dx <= w; dx++) {
                const tx = x + dx, ty = y + dy;
                if (tx < 0 || tx >= this.dungeonWidth || ty < 0 || ty >= this.dungeonHeight) return false;
                if (this.map[ty][tx].type === 'floor') return false;
            }
        }
        return true;
    }

    carveRoom(x, y, w, h) {
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                this.map[y + dy][x + dx] = { type: 'floor', walkable: true };
            }
        }
    }

    connectRooms(room1, room2) {
        let x = Math.floor(room1.x + room1.w / 2);
        let y = Math.floor(room1.y + room1.h / 2);
        const targetX = Math.floor(room2.x + room2.w / 2);
        const targetY = Math.floor(room2.y + room2.h / 2);

        while (x !== targetX) {
            this.map[y][x] = { type: 'floor', walkable: true };
            x += (targetX > x) ? 1 : -1;
        }
        while (y !== targetY) {
            this.map[y][x] = { type: 'floor', walkable: true };
            y += (targetY > y) ? 1 : -1;
        }
    }

    renderDungeon() {
        for (let y = 0; y < this.dungeonHeight; y++) {
            for (let x = 0; x < this.dungeonWidth; x++) {
                const tile = this.map[y][x];
                const texture = tile.type === 'floor' ? 'stone' : 'wall';

                const sprite = this.add.sprite(x * CONFIG.tileSize, y * CONFIG.tileSize, texture);
                sprite.setOrigin(0);
                sprite.setDepth(0);

                // Tint based on dungeon type
                if (this.dungeonType === 'snow') {
                    sprite.setTint(0xaabbcc);
                } else if (this.dungeonType === 'mountain') {
                    sprite.setTint(0x8888aa);
                }
            }
        }
    }

    createPlayer() {
        const startRoom = this.rooms[0];
        const startX = (startRoom.x + startRoom.w / 2) * CONFIG.tileSize;
        const startY = (startRoom.y + startRoom.h / 2) * CONFIG.tileSize;

        this.player = this.add.sprite(startX, startY, 'player');
        this.player.setOrigin(0);
        this.player.setDepth(100);

        // Copy stats
        Object.assign(this.player, this.playerStats);
    }

    spawnDungeonEnemies() {
        this.enemies = [];

        const enemyTypes = {
            forest: ['wolf', 'bandit'],
            snow: ['wolf', 'draugr'],
            mountain: ['bear', 'troll']
        };

        const types = enemyTypes[this.dungeonType];

        // Spawn enemies in each room except first
        for (let i = 1; i < this.rooms.length - 1; i++) {
            const room = this.rooms[i];
            const numEnemies = 2 + Math.floor(Math.random() * 2);

            for (let e = 0; e < numEnemies; e++) {
                const ex = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
                const ey = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
                this.createEnemy(ex, ey, types[Math.floor(Math.random() * types.length)]);
            }
        }

        // Spawn boss in last room
        const bossTypes = {
            forest: { hp: 80, damage: 15, speed: 40, xp: 100, gold: 50, texture: 'boss', name: 'Bandit Chief' },
            snow: { hp: 100, damage: 18, speed: 35, xp: 150, gold: 80, texture: 'boss', name: 'Draugr Overlord' },
            mountain: { hp: 150, damage: 25, speed: 30, xp: 200, gold: 100, texture: 'boss', name: 'Giant' }
        };

        const bossData = bossTypes[this.dungeonType];
        const bossX = this.bossRoom.x + this.bossRoom.w / 2;
        const bossY = this.bossRoom.y + this.bossRoom.h / 2;

        this.boss = this.add.sprite(bossX * CONFIG.tileSize, bossY * CONFIG.tileSize, 'boss');
        this.boss.setOrigin(0);
        this.boss.setDepth(bossY * CONFIG.tileSize);
        this.boss.setScale(1.5);
        this.boss.setTint(this.dungeonType === 'snow' ? 0x88aacc : (this.dungeonType === 'mountain' ? 0xccaa88 : 0xcc8888));

        Object.assign(this.boss, bossData);
        this.boss.alerted = false;
        this.boss.attackCooldown = 0;
        this.boss.isBoss = true;
    }

    createEnemy(tileX, tileY, type) {
        const enemyData = {
            wolf: { hp: 25, damage: 6, speed: 60, xp: 15, gold: 0, texture: 'wolf' },
            bandit: { hp: 40, damage: 8, speed: 50, xp: 25, gold: 15, texture: 'bandit' },
            draugr: { hp: 50, damage: 10, speed: 40, xp: 35, gold: 20, texture: 'draugr' },
            bear: { hp: 60, damage: 12, speed: 45, xp: 40, gold: 0, texture: 'bear' },
            troll: { hp: 80, damage: 15, speed: 35, xp: 60, gold: 0, texture: 'troll' }
        };

        const data = enemyData[type];
        const enemy = this.add.sprite(tileX * CONFIG.tileSize, tileY * CONFIG.tileSize, data.texture);
        enemy.setOrigin(0);
        enemy.setDepth(tileY * CONFIG.tileSize);

        Object.assign(enemy, data);
        enemy.type = type;
        enemy.alerted = false;
        enemy.attackCooldown = 0;

        this.enemies.push(enemy);
    }

    createUI() {
        this.uiContainer = this.add.container(0, 0);
        this.uiContainer.setScrollFactor(0);
        this.uiContainer.setDepth(1000);

        const { width, height } = this.cameras.main;

        // HUD
        const hudBg = this.add.rectangle(width/2, height - 25, width, 50, 0x1a1a1a, 0.9);
        this.uiContainer.add(hudBg);

        // HP Bar
        const hpBg = this.add.rectangle(120, height - 30, 150, 16, 0x3a1a1a);
        this.hpBar = this.add.rectangle(46, height - 30, 148, 14, 0xaa3333);
        this.hpBar.setOrigin(0, 0.5);
        this.hpText = this.add.text(195, height - 30, '100/100', { font: '10px Georgia', fill: '#ffffff' }).setOrigin(0, 0.5);
        this.uiContainer.add([hpBg, this.hpBar, this.hpText]);

        // Dungeon name
        const dungeonNames = { forest: 'Embershard Mine', snow: 'Bleak Falls Barrow', mountain: 'Labyrinthian' };
        this.add.text(width/2, 15, dungeonNames[this.dungeonType], {
            font: 'bold 14px Georgia',
            fill: '#d4af37'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

        // Exit hint
        this.exitHint = this.add.text(width/2, height - 60, 'Defeat the boss to clear the dungeon!', {
            font: '11px Georgia',
            fill: '#aaaaaa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
    }

    setupInput() {
        this.wasd = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D'
        });
        this.shiftKey = this.input.keyboard.addKey('SHIFT');

        this.input.on('pointerdown', (pointer) => this.attack(pointer));

        this.input.keyboard.on('keydown-ONE', () => this.useItem(0));
    }

    update(time, delta) {
        this.handleMovement(delta);
        this.updateEnemies(delta);
        this.updateBoss(delta);
        this.updateUI();
        this.updateFloatingTexts(delta);

        if (this.combatCooldown > 0) this.combatCooldown -= delta;

        // Check win
        if (this.bossDefeated) {
            this.exitHint.setText('Dungeon cleared! Press E to exit.');

            if (this.input.keyboard.checkDown(this.input.keyboard.addKey('E'), 500)) {
                this.returnToOverworld();
            }
        }
    }

    handleMovement(delta) {
        let dx = 0, dy = 0;

        if (this.wasd.left.isDown) dx = -1;
        else if (this.wasd.right.isDown) dx = 1;
        if (this.wasd.up.isDown) dy = -1;
        else if (this.wasd.down.isDown) dy = 1;

        const speed = this.shiftKey.isDown ? CONFIG.sprintSpeed : CONFIG.playerSpeed;

        if (dx !== 0 || dy !== 0) {
            if (dx !== 0 && dy !== 0) {
                dx *= 0.707;
                dy *= 0.707;
            }

            const newX = this.player.x + dx * speed * delta / 1000;
            const newY = this.player.y + dy * speed * delta / 1000;

            if (this.canMoveTo(newX, this.player.y)) this.player.x = newX;
            if (this.canMoveTo(this.player.x, newY)) this.player.y = newY;

            this.player.setDepth(this.player.y);
        }
    }

    canMoveTo(x, y) {
        const tileX = Math.floor(x / CONFIG.tileSize);
        const tileY = Math.floor((y + 20) / CONFIG.tileSize);

        if (tileX < 0 || tileX >= this.dungeonWidth || tileY < 0 || tileY >= this.dungeonHeight) {
            return false;
        }

        return this.map[tileY][tileX].walkable;
    }

    attack(pointer) {
        if (this.combatCooldown > 0 || this.isAttacking) return;

        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.player.x + 8, this.player.y + 12, worldPoint.x, worldPoint.y);

        this.isAttacking = true;

        const swing = this.add.sprite(this.player.x + 8, this.player.y + 12, 'swing');
        swing.setRotation(angle);
        swing.setDepth(this.player.depth + 1);
        swing.setAlpha(0.7);

        this.tweens.add({
            targets: swing,
            alpha: 0,
            scale: 1.3,
            duration: 200,
            onComplete: () => {
                swing.destroy();
                this.isAttacking = false;
            }
        });

        const damage = this.player.weapon.damage;
        const range = this.player.weapon.range;

        // Check enemies
        [...this.enemies, this.boss].forEach(enemy => {
            if (!enemy || !enemy.active) return;

            const dist = Phaser.Math.Distance.Between(
                this.player.x + 8, this.player.y + 12,
                enemy.x + 8, enemy.y + 12
            );

            if (dist <= range * (enemy.isBoss ? 1.5 : 1)) {
                this.hitEnemy(enemy, damage);
            }
        });

        this.combatCooldown = this.player.weapon.speed * 1000;
    }

    hitEnemy(enemy, damage) {
        enemy.hp -= damage;
        this.showFloatingText(enemy.x + 8, enemy.y, `-${damage}`, '#ff4444');

        this.cameras.main.shake(50, 0.005);

        this.tweens.add({
            targets: enemy,
            alpha: 0.5,
            duration: 50,
            yoyo: true
        });

        enemy.alerted = true;

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        if (enemy.isBoss) {
            this.bossDefeated = true;
            this.showFloatingText(enemy.x, enemy.y, `BOSS DEFEATED!`, '#ffff44');
            this.cameras.main.flash(500, 255, 255, 200);
        } else {
            const index = this.enemies.indexOf(enemy);
            if (index > -1) this.enemies.splice(index, 1);
        }

        this.player.xp += enemy.xp;
        this.player.gold += enemy.gold;

        this.showFloatingText(enemy.x, enemy.y, `+${enemy.xp} XP`, '#ffff44');

        enemy.destroy();
    }

    updateEnemies(delta) {
        this.enemies.forEach(enemy => {
            if (enemy.attackCooldown > 0) enemy.attackCooldown -= delta;

            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            if (dist < 100) enemy.alerted = true;

            if (enemy.alerted) {
                if (dist > 24 && dist < 200) {
                    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                    enemy.x += Math.cos(angle) * enemy.speed * delta / 1000;
                    enemy.y += Math.sin(angle) * enemy.speed * delta / 1000;
                    enemy.setDepth(enemy.y);
                }

                if (dist <= 24 && enemy.attackCooldown <= 0) {
                    this.enemyAttack(enemy);
                    enemy.attackCooldown = 1000;
                }
            }
        });
    }

    updateBoss(delta) {
        if (!this.boss || !this.boss.active) return;

        if (this.boss.attackCooldown > 0) this.boss.attackCooldown -= delta;

        const dist = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);

        if (dist < 150) this.boss.alerted = true;

        if (this.boss.alerted) {
            if (dist > 32 && dist < 250) {
                const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
                this.boss.x += Math.cos(angle) * this.boss.speed * delta / 1000;
                this.boss.y += Math.sin(angle) * this.boss.speed * delta / 1000;
                this.boss.setDepth(this.boss.y);
            }

            if (dist <= 40 && this.boss.attackCooldown <= 0) {
                this.enemyAttack(this.boss);
                this.boss.attackCooldown = 1500;
            }
        }
    }

    enemyAttack(enemy) {
        const damage = Math.max(1, enemy.damage - Math.floor(this.player.armor.defense / 4));
        this.player.hp -= damage;

        this.showFloatingText(this.player.x + 8, this.player.y, `-${damage}`, '#ff4444');
        this.cameras.main.flash(100, 100, 0, 0);
        this.cameras.main.shake(100, 0.01);

        if (this.player.hp <= 0) {
            this.playerDeath();
        }
    }

    playerDeath() {
        const { width, height } = this.cameras.main;

        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.9);
        overlay.setScrollFactor(0);
        overlay.setDepth(5000);

        this.add.text(width/2, height/2, 'YOU DIED', {
            font: 'bold 32px Georgia',
            fill: '#aa3333'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(5001);

        this.input.once('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }

    useItem(slot) {
        if (this.player.inventory[slot] === 'potion') {
            this.player.hp = Math.min(this.player.hp + 50, this.player.maxHp);
            this.showFloatingText(this.player.x, this.player.y, '+50 HP', '#44aa44');
            this.player.inventory.splice(slot, 1);
        }
    }

    returnToOverworld() {
        this.dungeonProgress[this.dungeonType] = true;

        // Check win condition
        if (this.dungeonProgress.forest && this.dungeonProgress.snow && this.dungeonProgress.mountain) {
            this.scene.start('WinScene');
        } else {
            this.scene.start('GameScene');
            // Note: Would need to properly pass state back
        }
    }

    showFloatingText(x, y, text, color) {
        const floatText = this.add.text(x, y, text, {
            font: 'bold 11px Georgia',
            fill: color,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        floatText.setDepth(4000);
        floatText.life = 1000;
        floatText.startY = y;
        this.floatingTexts.push(floatText);
    }

    updateFloatingTexts(delta) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const text = this.floatingTexts[i];
            text.life -= delta;
            text.y = text.startY - (1000 - text.life) * 0.03;
            text.alpha = text.life / 1000;

            if (text.life <= 0) {
                text.destroy();
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    updateUI() {
        const hpPercent = this.player.hp / this.player.maxHp;
        this.hpBar.width = 148 * hpPercent;
        this.hpText.setText(`${Math.floor(this.player.hp)}/${this.player.maxHp}`);
    }
}

// Win Scene
class WinScene extends Phaser.Scene {
    constructor() {
        super('WinScene');
    }

    create() {
        const { width, height } = this.cameras.main;

        this.cameras.main.setBackgroundColor(0x1a2a3a);

        this.add.text(width/2, 100, 'VICTORY!', {
            font: 'bold 48px Georgia',
            fill: '#d4af37',
            stroke: '#2a1a0a',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(width/2, 160, 'You have proven yourself, Dragonborn.', {
            font: '16px Georgia',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        this.add.text(width/2, 200, 'All three dungeons have been cleared.\nSkyrim is saved!', {
            font: '14px Georgia',
            fill: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);

        const restartBtn = this.add.rectangle(width/2, 280, 180, 45, 0x3a5a3a);
        restartBtn.setStrokeStyle(2, 0x6a8a6a);
        restartBtn.setInteractive({ useHandCursor: true });

        this.add.text(width/2, 280, 'PLAY AGAIN', {
            font: 'bold 16px Georgia',
            fill: '#aaffaa'
        }).setOrigin(0.5);

        restartBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// Game configuration
const config = {
    type: Phaser.CANVAS,
    width: CONFIG.width,
    height: CONFIG.height,
    parent: 'game-container',
    pixelArt: true,
    backgroundColor: '#1a1a1a',
    scene: [BootScene, MenuScene, GameScene, DungeonScene, WinScene]
};

// Start game
const game = new Phaser.Game(config);
