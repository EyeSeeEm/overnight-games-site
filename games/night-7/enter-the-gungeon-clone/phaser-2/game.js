// Enter the Gungeon Clone - Bullet Hell Roguelike
// Built with Phaser 3

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        // Player (Marine)
        const player = this.add.graphics();
        player.fillStyle(0x4488ff);
        player.fillCircle(16, 16, 12);
        player.fillStyle(0x2266cc);
        player.fillCircle(16, 14, 6); // visor
        player.fillStyle(0x88aaff);
        player.fillCircle(16, 20, 4); // emblem
        player.generateTexture('player', 32, 32);
        player.destroy();

        // Bullet (player)
        const bullet = this.add.graphics();
        bullet.fillStyle(0xffff44);
        bullet.fillCircle(4, 4, 4);
        bullet.generateTexture('bullet', 8, 8);
        bullet.destroy();

        // Enemy bullet
        const enemyBullet = this.add.graphics();
        enemyBullet.fillStyle(0xff4444);
        enemyBullet.fillCircle(5, 5, 5);
        enemyBullet.generateTexture('enemyBullet', 10, 10);
        enemyBullet.destroy();

        // Bullet Kin (basic enemy - bullet shaped)
        const bulletKin = this.add.graphics();
        bulletKin.fillStyle(0xcc8844);
        bulletKin.fillRoundedRect(4, 0, 16, 24, { tl: 8, tr: 8, bl: 2, br: 2 });
        bulletKin.fillStyle(0xaa6622);
        bulletKin.fillRect(6, 20, 12, 4);
        bulletKin.fillStyle(0x000000);
        bulletKin.fillCircle(9, 10, 2);
        bulletKin.fillCircle(15, 10, 2);
        bulletKin.generateTexture('bulletKin', 24, 28);
        bulletKin.destroy();

        // Shotgun Kin (shell shaped)
        const shotgunKin = this.add.graphics();
        shotgunKin.fillStyle(0xdd4444);
        shotgunKin.fillRect(2, 0, 20, 28);
        shotgunKin.fillStyle(0xcc8822);
        shotgunKin.fillRect(2, 20, 20, 8);
        shotgunKin.fillStyle(0x000000);
        shotgunKin.fillCircle(8, 10, 2);
        shotgunKin.fillCircle(16, 10, 2);
        shotgunKin.generateTexture('shotgunKin', 24, 32);
        shotgunKin.destroy();

        // Gun Nut (armored bullet)
        const gunNut = this.add.graphics();
        gunNut.fillStyle(0x666688);
        gunNut.fillCircle(16, 16, 14);
        gunNut.fillStyle(0x888aaa);
        gunNut.fillRect(2, 8, 8, 16);
        gunNut.fillStyle(0xff4444);
        gunNut.fillCircle(16, 12, 4);
        gunNut.generateTexture('gunNut', 32, 32);
        gunNut.destroy();

        // Veteran Bullet
        const veteran = this.add.graphics();
        veteran.fillStyle(0x888888);
        veteran.fillRoundedRect(4, 0, 16, 24, { tl: 8, tr: 8, bl: 2, br: 2 });
        veteran.fillStyle(0x666666);
        veteran.fillRect(6, 20, 12, 4);
        veteran.fillStyle(0xff0000);
        veteran.fillCircle(9, 10, 2);
        veteran.fillCircle(15, 10, 2);
        veteran.generateTexture('veteran', 24, 28);
        veteran.destroy();

        // Gunjurer
        const gunjurer = this.add.graphics();
        gunjurer.fillStyle(0x6644aa);
        gunjurer.fillTriangle(16, 0, 0, 28, 32, 28);
        gunjurer.fillStyle(0xffff00);
        gunjurer.fillCircle(16, 16, 4);
        gunjurer.generateTexture('gunjurer', 32, 32);
        gunjurer.destroy();

        // Boss: Bullet King
        const bulletKing = this.add.graphics();
        bulletKing.fillStyle(0xddaa44);
        bulletKing.fillRoundedRect(10, 10, 40, 50, { tl: 20, tr: 20, bl: 4, br: 4 });
        bulletKing.fillStyle(0xffcc00);
        bulletKing.fillRect(14, 0, 32, 12);
        bulletKing.fillTriangle(14, 0, 22, -10, 22, 0);
        bulletKing.fillTriangle(30, 0, 30, -12, 38, 0);
        bulletKing.fillTriangle(46, 0, 38, -10, 38, 0);
        bulletKing.fillStyle(0x000000);
        bulletKing.fillCircle(22, 30, 4);
        bulletKing.fillCircle(38, 30, 4);
        bulletKing.generateTexture('bulletKing', 60, 70);
        bulletKing.destroy();

        // Boss: Beholster
        const beholster = this.add.graphics();
        beholster.fillStyle(0x44aa44);
        beholster.fillCircle(30, 30, 28);
        beholster.fillStyle(0xffffff);
        beholster.fillCircle(30, 25, 15);
        beholster.fillStyle(0x000000);
        beholster.fillCircle(30, 25, 8);
        // Tentacles
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            beholster.fillStyle(0x338833);
            beholster.fillRect(30 + Math.cos(angle) * 20, 30 + Math.sin(angle) * 20, 8, 8);
        }
        beholster.generateTexture('beholster', 60, 60);
        beholster.destroy();

        // Boss: High Dragun
        const dragun = this.add.graphics();
        dragun.fillStyle(0xaa4444);
        dragun.fillTriangle(40, 0, 0, 70, 80, 70);
        dragun.fillStyle(0xff6644);
        dragun.fillTriangle(40, 20, 15, 60, 65, 60);
        dragun.fillStyle(0xffff00);
        dragun.fillCircle(30, 40, 5);
        dragun.fillCircle(50, 40, 5);
        dragun.generateTexture('dragun', 80, 80);
        dragun.destroy();

        // Floor tile
        const tile = this.add.graphics();
        tile.fillStyle(0x333344);
        tile.fillRect(0, 0, 16, 16);
        tile.fillStyle(0x3a3a4a);
        tile.fillRect(1, 1, 14, 14);
        tile.generateTexture('floor', 16, 16);
        tile.destroy();

        // Wall tile
        const wall = this.add.graphics();
        wall.fillStyle(0x222233);
        wall.fillRect(0, 0, 16, 16);
        wall.fillStyle(0x1a1a2a);
        wall.fillRect(2, 2, 12, 12);
        wall.generateTexture('wall', 16, 16);
        wall.destroy();

        // Door
        const door = this.add.graphics();
        door.fillStyle(0x664422);
        door.fillRect(0, 0, 32, 16);
        door.fillStyle(0xffcc00);
        door.fillCircle(24, 8, 3);
        door.generateTexture('door', 32, 16);
        door.destroy();

        // Chest
        const chest = this.add.graphics();
        chest.fillStyle(0x8b4513);
        chest.fillRect(0, 8, 24, 16);
        chest.fillStyle(0xa0522d);
        chest.fillRoundedRect(0, 0, 24, 12, 4);
        chest.fillStyle(0xffd700);
        chest.fillRect(10, 6, 4, 8);
        chest.generateTexture('chest', 24, 24);
        chest.destroy();

        // Heart
        const heart = this.add.graphics();
        heart.fillStyle(0xff4444);
        heart.fillCircle(5, 5, 5);
        heart.fillCircle(11, 5, 5);
        heart.fillTriangle(0, 7, 16, 7, 8, 16);
        heart.generateTexture('heart', 16, 16);
        heart.destroy();

        // Ammo
        const ammo = this.add.graphics();
        ammo.fillStyle(0xcc8822);
        ammo.fillRect(2, 0, 6, 14);
        ammo.fillStyle(0xaa6611);
        ammo.fillRect(2, 10, 6, 4);
        ammo.generateTexture('ammo', 10, 14);
        ammo.destroy();

        // Blank
        const blank = this.add.graphics();
        blank.fillStyle(0x4488ff);
        blank.fillCircle(8, 8, 7);
        blank.fillStyle(0x88ccff);
        blank.fillCircle(8, 6, 4);
        blank.generateTexture('blank', 16, 16);
        blank.destroy();

        // Key
        const key = this.add.graphics();
        key.fillStyle(0xffd700);
        key.fillCircle(5, 5, 5);
        key.fillRect(3, 8, 4, 10);
        key.fillRect(1, 14, 8, 2);
        key.generateTexture('key', 10, 20);
        key.destroy();

        // Shell (currency)
        const shell = this.add.graphics();
        shell.fillStyle(0xcc8844);
        shell.fillCircle(6, 6, 5);
        shell.fillStyle(0xaa6622);
        shell.fillCircle(6, 6, 3);
        shell.generateTexture('shell', 12, 12);
        shell.destroy();

        // Table
        const table = this.add.graphics();
        table.fillStyle(0x8b4513);
        table.fillRect(0, 0, 32, 20);
        table.fillStyle(0x654321);
        table.fillRect(2, 16, 4, 8);
        table.fillRect(26, 16, 4, 8);
        table.generateTexture('table', 32, 24);
        table.destroy();

        // Crate
        const crate = this.add.graphics();
        crate.fillStyle(0x8b4513);
        crate.fillRect(0, 0, 24, 24);
        crate.fillStyle(0x654321);
        crate.fillRect(0, 8, 24, 2);
        crate.fillRect(0, 16, 24, 2);
        crate.fillRect(8, 0, 2, 24);
        crate.fillRect(16, 0, 2, 24);
        crate.generateTexture('crate', 24, 24);
        crate.destroy();

        // Barrel
        const barrel = this.add.graphics();
        barrel.fillStyle(0x444444);
        barrel.fillCircle(12, 12, 12);
        barrel.fillStyle(0x333333);
        barrel.fillCircle(12, 12, 8);
        barrel.fillStyle(0xff4400);
        barrel.fillCircle(12, 12, 4);
        barrel.generateTexture('barrel', 24, 24);
        barrel.destroy();

        // Particle
        const particle = this.add.graphics();
        particle.fillStyle(0xffffff);
        particle.fillRect(0, 0, 4, 4);
        particle.generateTexture('particle', 4, 4);
        particle.destroy();

        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const centerX = 400;

        this.add.text(centerX, 100, 'ENTER THE GUNGEON', {
            fontSize: '48px',
            fill: '#ffd700',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(centerX, 160, 'Clone', {
            fontSize: '24px',
            fill: '#888',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        const instructions = [
            'WASD / Arrows - Move',
            'Mouse - Aim',
            'Left Click - Shoot',
            'SPACE / Shift - Dodge Roll (i-frames!)',
            'Q - Use Blank (clears bullets)',
            'R - Reload',
            '1-4 - Switch Weapons',
            '',
            'Descend through 3 floors',
            'Defeat the High Dragun to win!',
            '',
            'Marine: +1 armor, starter pistol'
        ];

        instructions.forEach((text, i) => {
            this.add.text(centerX, 220 + i * 24, text, {
                fontSize: '16px',
                fill: '#aaa',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        });

        const startBtn = this.add.text(centerX, 520, '[ START ]', {
            fontSize: '32px',
            fill: '#4f4',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setFill('#8f8'));
        startBtn.on('pointerout', () => startBtn.setFill('#4f4'));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));

        this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene'));
        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Game state
        this.floor = 1;
        this.maxFloors = 3;
        this.roomIndex = 0;
        this.roomsPerFloor = [6, 8, 5]; // Rooms per floor (last is boss rush)
        this.totalRooms = this.roomsPerFloor[this.floor - 1];
        this.roomCleared = false;

        // Player stats
        this.health = 6; // 3 hearts = 6 half hearts
        this.maxHealth = 6;
        this.armor = 1; // Marine starts with 1 armor
        this.blanks = 2;
        this.keys = 1;
        this.shells = 0;

        // Weapons
        this.weapons = [
            { name: 'Marine Pistol', damage: 6, fireRate: 250, magSize: 12, ammo: Infinity, spread: 0.05, auto: false },
            { name: 'Shotgun', damage: 4, pellets: 5, fireRate: 600, magSize: 6, ammo: 40, spread: 0.3, auto: false },
            { name: 'AK-47', damage: 5, fireRate: 120, magSize: 30, ammo: 90, spread: 0.1, auto: true },
            { name: 'Railgun', damage: 40, fireRate: 1200, magSize: 3, ammo: 12, spread: 0, auto: false }
        ];
        this.currentWeapon = 0;
        this.currentMag = this.weapons[0].magSize;
        this.lastFire = 0;
        this.reloading = false;

        // Dodge roll
        this.dodgeRolling = false;
        this.dodgeDirection = { x: 0, y: 0 };
        this.dodgeTime = 0;
        this.dodgeDuration = 500;
        this.dodgeIFrames = 300;
        this.dodgeCooldown = 0;

        // Create room
        this.createRoom();

        // Player
        this.player = this.physics.add.sprite(400, 450, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.playerSpeed = 200;

        // Groups
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();

        // Spawn enemies for first room
        this.spawnEnemies();

        // UI
        this.createUI();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.reloadKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.blankKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
        this.key4 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);

        this.input.on('pointerdown', () => this.shooting = true);
        this.input.on('pointerup', () => this.shooting = false);

        // Collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.playerHitByBullet, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);

        // Collision with walls
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.player, this.obstacles);
        this.physics.add.collider(this.enemies, this.obstacles);
    }

    createRoom() {
        // Room dimensions
        const roomWidth = 800;
        const roomHeight = 600;
        const tileSize = 16;

        // Floor tiles
        for (let x = 32; x < roomWidth - 32; x += tileSize) {
            for (let y = 48; y < roomHeight - 48; y += tileSize) {
                this.add.sprite(x, y, 'floor').setOrigin(0);
            }
        }

        // Walls
        this.walls = this.physics.add.staticGroup();

        // Top wall
        for (let x = 0; x < roomWidth; x += tileSize) {
            const wall = this.walls.create(x, 32, 'wall').setOrigin(0).refreshBody();
            this.walls.create(x, 16, 'wall').setOrigin(0).refreshBody();
            this.walls.create(x, 0, 'wall').setOrigin(0).refreshBody();
        }

        // Bottom wall
        for (let x = 0; x < roomWidth; x += tileSize) {
            const wall = this.walls.create(x, roomHeight - 48, 'wall').setOrigin(0).refreshBody();
            this.walls.create(x, roomHeight - 32, 'wall').setOrigin(0).refreshBody();
            this.walls.create(x, roomHeight - 16, 'wall').setOrigin(0).refreshBody();
        }

        // Left wall
        for (let y = 0; y < roomHeight; y += tileSize) {
            this.walls.create(0, y, 'wall').setOrigin(0).refreshBody();
            this.walls.create(16, y, 'wall').setOrigin(0).refreshBody();
        }

        // Right wall
        for (let y = 0; y < roomHeight; y += tileSize) {
            this.walls.create(roomWidth - 16, y, 'wall').setOrigin(0).refreshBody();
            this.walls.create(roomWidth - 32, y, 'wall').setOrigin(0).refreshBody();
        }

        // Obstacles (cover)
        this.obstacles = this.physics.add.staticGroup();
        const numObstacles = Phaser.Math.Between(3, 7);

        for (let i = 0; i < numObstacles; i++) {
            const ox = Phaser.Math.Between(100, 700);
            const oy = Phaser.Math.Between(100, 450);
            const obstacleType = Phaser.Math.Between(0, 2);

            if (obstacleType === 0) {
                this.obstacles.create(ox, oy, 'crate').refreshBody();
            } else if (obstacleType === 1) {
                this.obstacles.create(ox, oy, 'barrel').refreshBody();
            } else {
                this.obstacles.create(ox, oy, 'table').refreshBody();
            }
        }

        // Door indicator (shown when room cleared)
        this.doorSprite = this.add.sprite(400, 64, 'door');
        this.doorSprite.setVisible(false);
    }

    createUI() {
        // Health display
        this.healthText = this.add.text(10, 10, '', { fontSize: '16px', fill: '#ff4444' }).setDepth(100);

        // Armor
        this.armorText = this.add.text(10, 30, '', { fontSize: '14px', fill: '#4488ff' }).setDepth(100);

        // Weapon info
        this.weaponText = this.add.text(10, 565, '', { fontSize: '14px', fill: '#fff' }).setDepth(100);
        this.ammoText = this.add.text(10, 582, '', { fontSize: '14px', fill: '#cc8822' }).setDepth(100);

        // Floor and room
        this.floorText = this.add.text(700, 10, '', { fontSize: '16px', fill: '#fff' }).setDepth(100);

        // Items
        this.itemsText = this.add.text(400, 10, '', { fontSize: '14px', fill: '#ffd700' }).setDepth(100).setOrigin(0.5, 0);

        this.updateUI();
    }

    updateUI() {
        // Health as hearts
        const hearts = Math.ceil(this.health / 2);
        const halfHeart = this.health % 2 === 1;
        let healthStr = '';
        for (let i = 0; i < Math.floor(this.health / 2); i++) healthStr += '♥';
        if (halfHeart) healthStr += '♡';
        for (let i = Math.ceil(this.health / 2); i < this.maxHealth / 2; i++) healthStr += '○';
        this.healthText.setText(healthStr);

        // Armor
        let armorStr = '';
        for (let i = 0; i < this.armor; i++) armorStr += '★';
        this.armorText.setText(armorStr);

        // Weapon
        const weapon = this.weapons[this.currentWeapon];
        this.weaponText.setText(`${weapon.name}`);
        const ammoStr = weapon.ammo === Infinity ? '∞' : weapon.ammo;
        this.ammoText.setText(`${this.currentMag}/${weapon.magSize} [${ammoStr}]`);

        // Floor
        const floorNames = ['Keep', 'Gungeon', 'Forge'];
        this.floorText.setText(`${floorNames[this.floor - 1]} ${this.roomIndex + 1}/${this.totalRooms}`);

        // Items
        this.itemsText.setText(`Blanks: ${this.blanks} | Keys: ${this.keys} | Shells: ${this.shells}`);
    }

    update(time, delta) {
        this.handleInput(time, delta);
        this.updateDodgeRoll(delta);
        this.updateEnemies(time);
        this.updateBullets();
        this.checkRoomClear();
        this.updateUI();
    }

    handleInput(time, delta) {
        if (this.dodgeRolling) return;

        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -1;
        if (this.cursors.right.isDown || this.wasd.D.isDown) vx = 1;
        if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -1;
        if (this.cursors.down.isDown || this.wasd.S.isDown) vy = 1;

        // Normalize
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx * this.playerSpeed, vy * this.playerSpeed);

        // Aim at mouse
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);
        this.player.setRotation(angle);

        // Dodge roll
        if ((Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.shiftKey))
            && this.dodgeCooldown <= 0) {
            this.startDodgeRoll(vx, vy);
        }

        this.dodgeCooldown -= delta;

        // Shooting
        if (this.shooting && !this.reloading) {
            this.fire(time);
        }

        // Reload
        if (Phaser.Input.Keyboard.JustDown(this.reloadKey)) {
            this.reload();
        }

        // Blank
        if (Phaser.Input.Keyboard.JustDown(this.blankKey)) {
            this.useBlank();
        }

        // Weapon switch
        if (Phaser.Input.Keyboard.JustDown(this.key1)) this.switchWeapon(0);
        if (Phaser.Input.Keyboard.JustDown(this.key2)) this.switchWeapon(1);
        if (Phaser.Input.Keyboard.JustDown(this.key3)) this.switchWeapon(2);
        if (Phaser.Input.Keyboard.JustDown(this.key4)) this.switchWeapon(3);

        // Check door interaction
        if (this.roomCleared && this.player.y < 80) {
            this.nextRoom();
        }
    }

    startDodgeRoll(vx, vy) {
        // Default to facing direction if not moving
        if (vx === 0 && vy === 0) {
            const pointer = this.input.activePointer;
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);
            vx = Math.cos(angle);
            vy = Math.sin(angle);
        }

        this.dodgeRolling = true;
        this.dodgeDirection = { x: vx, y: vy };
        this.dodgeTime = 0;
        this.dodgeCooldown = 800;

        // Visual feedback
        this.player.setAlpha(0.5);
    }

    updateDodgeRoll(delta) {
        if (!this.dodgeRolling) return;

        this.dodgeTime += delta;

        // Fast movement during roll
        const rollSpeed = 400;
        this.player.setVelocity(
            this.dodgeDirection.x * rollSpeed,
            this.dodgeDirection.y * rollSpeed
        );

        // End roll
        if (this.dodgeTime >= this.dodgeDuration) {
            this.dodgeRolling = false;
            this.player.setAlpha(1);
        }
    }

    fire(time) {
        const weapon = this.weapons[this.currentWeapon];

        if (time - this.lastFire < weapon.fireRate) return;
        if (this.currentMag <= 0) {
            this.reload();
            return;
        }

        this.lastFire = time;
        this.currentMag--;

        const pointer = this.input.activePointer;
        const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);

        const pellets = weapon.pellets || 1;

        for (let i = 0; i < pellets; i++) {
            const spread = (Math.random() - 0.5) * weapon.spread * 2;
            const angle = baseAngle + spread;

            const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet');
            bullet.setVelocity(
                Math.cos(angle) * 600,
                Math.sin(angle) * 600
            );
            bullet.damage = weapon.damage;
            bullet.setRotation(angle);

            // Auto destroy off screen
            this.time.delayedCall(2000, () => {
                if (bullet.active) bullet.destroy();
            });
        }
    }

    reload() {
        if (this.reloading) return;

        const weapon = this.weapons[this.currentWeapon];
        if (this.currentMag >= weapon.magSize) return;
        if (weapon.ammo <= 0 && weapon.ammo !== Infinity) return;

        this.reloading = true;

        this.time.delayedCall(800, () => {
            const needed = weapon.magSize - this.currentMag;
            const available = weapon.ammo === Infinity ? needed : Math.min(needed, weapon.ammo);

            this.currentMag += available;
            if (weapon.ammo !== Infinity) {
                weapon.ammo -= available;
            }

            this.reloading = false;
        });
    }

    switchWeapon(index) {
        if (index >= this.weapons.length) return;
        if (this.currentWeapon === index) return;

        this.currentWeapon = index;
        this.currentMag = Math.min(this.currentMag, this.weapons[index].magSize);
        this.reloading = false;
    }

    useBlank() {
        if (this.blanks <= 0) return;

        this.blanks--;

        // Clear all enemy bullets
        this.enemyBullets.children.iterate((bullet) => {
            if (bullet) {
                // Particle effect
                for (let i = 0; i < 3; i++) {
                    const p = this.add.sprite(bullet.x, bullet.y, 'particle');
                    p.setTint(0x4488ff);
                    this.tweens.add({
                        targets: p,
                        x: bullet.x + Phaser.Math.Between(-20, 20),
                        y: bullet.y + Phaser.Math.Between(-20, 20),
                        alpha: 0,
                        duration: 300,
                        onComplete: () => p.destroy()
                    });
                }
                bullet.destroy();
            }
        });

        // Visual blast effect
        const blast = this.add.circle(this.player.x, this.player.y, 10, 0x4488ff, 0.7);
        this.tweens.add({
            targets: blast,
            scaleX: 20,
            scaleY: 20,
            alpha: 0,
            duration: 400,
            onComplete: () => blast.destroy()
        });

        // Stun nearby enemies briefly
        this.enemies.children.iterate((enemy) => {
            if (enemy) {
                enemy.stunned = true;
                this.time.delayedCall(500, () => {
                    if (enemy.active) enemy.stunned = false;
                });
            }
        });
    }

    spawnEnemies() {
        // Boss room?
        if (this.roomIndex >= this.totalRooms - 1) {
            this.spawnBoss();
            return;
        }

        // Regular enemies
        const floorEnemies = [
            ['bulletKin', 'bulletKin', 'shotgunKin'],
            ['bulletKin', 'shotgunKin', 'veteran', 'gunNut'],
            ['veteran', 'shotgunKin', 'gunNut', 'gunjurer']
        ];

        const enemyTypes = floorEnemies[this.floor - 1];
        const count = Phaser.Math.Between(3, 5) + this.floor;

        for (let i = 0; i < count; i++) {
            const type = Phaser.Utils.Array.GetRandom(enemyTypes);
            const x = Phaser.Math.Between(100, 700);
            const y = Phaser.Math.Between(100, 350);

            const enemy = this.enemies.create(x, y, type);
            enemy.enemyType = type;
            enemy.lastFire = 0;
            enemy.stunned = false;

            switch (type) {
                case 'bulletKin':
                    enemy.health = 15;
                    enemy.speed = 60;
                    enemy.fireRate = 1500;
                    break;
                case 'shotgunKin':
                    enemy.health = 25;
                    enemy.speed = 40;
                    enemy.fireRate = 2000;
                    enemy.pellets = 5;
                    break;
                case 'veteran':
                    enemy.health = 20;
                    enemy.speed = 80;
                    enemy.fireRate = 1000;
                    break;
                case 'gunNut':
                    enemy.health = 50;
                    enemy.speed = 30;
                    enemy.fireRate = 1200;
                    enemy.shielded = true;
                    break;
                case 'gunjurer':
                    enemy.health = 40;
                    enemy.speed = 20;
                    enemy.fireRate = 2500;
                    enemy.summons = true;
                    break;
            }
        }
    }

    spawnBoss() {
        const bosses = ['bulletKing', 'beholster', 'dragun'];
        const bossType = bosses[this.floor - 1];

        const boss = this.enemies.create(400, 200, bossType);
        boss.enemyType = bossType;
        boss.isBoss = true;
        boss.lastFire = 0;
        boss.stunned = false;
        boss.phase = 1;
        boss.attackPattern = 0;
        boss.patternTimer = 0;

        switch (bossType) {
            case 'bulletKing':
                boss.health = 600;
                boss.maxHealth = 600;
                boss.speed = 40;
                break;
            case 'beholster':
                boss.health = 800;
                boss.maxHealth = 800;
                boss.speed = 50;
                break;
            case 'dragun':
                boss.health = 1500;
                boss.maxHealth = 1500;
                boss.speed = 30;
                break;
        }

        // Boss health bar
        this.bossHealthBar = this.add.rectangle(400, 30, 400, 12, 0xff4444).setDepth(100);
        this.bossHealthBarBg = this.add.rectangle(400, 30, 400, 12, 0x333333).setDepth(99);
    }

    updateEnemies(time) {
        this.enemies.children.iterate((enemy) => {
            if (!enemy || !enemy.active || enemy.stunned) return;

            if (enemy.isBoss) {
                this.updateBoss(enemy, time);
            } else {
                this.updateRegularEnemy(enemy, time);
            }
        });
    }

    updateRegularEnemy(enemy, time) {
        // Move toward player (basic AI)
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

        // Keep distance
        if (dist > 150) {
            enemy.setVelocity(
                Math.cos(angle) * enemy.speed,
                Math.sin(angle) * enemy.speed
            );
        } else if (dist < 100) {
            enemy.setVelocity(
                -Math.cos(angle) * enemy.speed,
                -Math.sin(angle) * enemy.speed
            );
        } else {
            enemy.setVelocity(0, 0);
        }

        // Fire at player
        if (time - enemy.lastFire > enemy.fireRate) {
            enemy.lastFire = time;
            this.enemyFire(enemy, angle);
        }
    }

    enemyFire(enemy, angle) {
        const pellets = enemy.pellets || 1;
        const spread = pellets > 1 ? 0.4 : 0.1;

        for (let i = 0; i < pellets; i++) {
            const bulletAngle = angle + (Math.random() - 0.5) * spread;
            const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
            bullet.setVelocity(
                Math.cos(bulletAngle) * 200,
                Math.sin(bulletAngle) * 200
            );

            this.time.delayedCall(4000, () => {
                if (bullet.active) bullet.destroy();
            });
        }
    }

    updateBoss(boss, time) {
        boss.patternTimer += 16;

        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);

        // Update health bar
        if (this.bossHealthBar) {
            const healthPercent = boss.health / boss.maxHealth;
            this.bossHealthBar.width = 400 * healthPercent;
        }

        switch (boss.enemyType) {
            case 'bulletKing':
                this.bulletKingAI(boss, time, angle);
                break;
            case 'beholster':
                this.beholsterAI(boss, time, angle);
                break;
            case 'dragun':
                this.dragunAI(boss, time, angle);
                break;
        }
    }

    bulletKingAI(boss, time, angle) {
        // Slowly move toward player
        const dist = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y);
        if (dist > 200) {
            boss.setVelocity(Math.cos(angle) * boss.speed, Math.sin(angle) * boss.speed);
        } else {
            boss.setVelocity(0, 0);
        }

        // Attack patterns
        if (time - boss.lastFire > 1500) {
            boss.lastFire = time;
            boss.attackPattern = (boss.attackPattern + 1) % 3;

            if (boss.attackPattern === 0) {
                // Burst ring
                for (let i = 0; i < 12; i++) {
                    const a = (i / 12) * Math.PI * 2;
                    const bullet = this.enemyBullets.create(boss.x, boss.y, 'enemyBullet');
                    bullet.setVelocity(Math.cos(a) * 150, Math.sin(a) * 150);
                    this.time.delayedCall(5000, () => { if (bullet.active) bullet.destroy(); });
                }
            } else if (boss.attackPattern === 1) {
                // Spread toward player
                for (let i = -2; i <= 2; i++) {
                    const a = angle + i * 0.2;
                    const bullet = this.enemyBullets.create(boss.x, boss.y, 'enemyBullet');
                    bullet.setVelocity(Math.cos(a) * 200, Math.sin(a) * 200);
                    this.time.delayedCall(5000, () => { if (bullet.active) bullet.destroy(); });
                }
            } else {
                // Spiral
                for (let i = 0; i < 8; i++) {
                    this.time.delayedCall(i * 100, () => {
                        if (!boss.active) return;
                        const a = boss.patternTimer * 0.05 + i * 0.5;
                        const bullet = this.enemyBullets.create(boss.x, boss.y, 'enemyBullet');
                        bullet.setVelocity(Math.cos(a) * 180, Math.sin(a) * 180);
                        this.time.delayedCall(5000, () => { if (bullet.active) bullet.destroy(); });
                    });
                }
            }
        }
    }

    beholsterAI(boss, time, angle) {
        // Float around
        const floatAngle = time * 0.001;
        boss.x = 400 + Math.cos(floatAngle) * 100;
        boss.y = 200 + Math.sin(floatAngle * 0.7) * 50;

        // Tentacle attacks
        if (time - boss.lastFire > 1200) {
            boss.lastFire = time;

            // Fire from multiple directions (tentacles)
            for (let i = 0; i < 6; i++) {
                const tentacleAngle = (i / 6) * Math.PI * 2;
                const startX = boss.x + Math.cos(tentacleAngle) * 20;
                const startY = boss.y + Math.sin(tentacleAngle) * 20;

                const toPlayer = Phaser.Math.Angle.Between(startX, startY, this.player.x, this.player.y);

                for (let j = 0; j < 3; j++) {
                    this.time.delayedCall(j * 150, () => {
                        if (!boss.active) return;
                        const bullet = this.enemyBullets.create(startX, startY, 'enemyBullet');
                        bullet.setVelocity(Math.cos(toPlayer) * 180, Math.sin(toPlayer) * 180);
                        this.time.delayedCall(5000, () => { if (bullet.active) bullet.destroy(); });
                    });
                }
            }
        }

        // Eye beam (occasional)
        if (boss.patternTimer % 5000 < 50 && boss.patternTimer > 2000) {
            for (let i = -5; i <= 5; i++) {
                const a = angle + i * 0.1;
                const bullet = this.enemyBullets.create(boss.x, boss.y, 'enemyBullet');
                bullet.setScale(1.5);
                bullet.setVelocity(Math.cos(a) * 250, Math.sin(a) * 250);
                this.time.delayedCall(5000, () => { if (bullet.active) bullet.destroy(); });
            }
        }
    }

    dragunAI(boss, time, angle) {
        // Phase check
        if (boss.health < boss.maxHealth * 0.3 && boss.phase === 1) {
            boss.phase = 2;
        }

        // Movement
        const targetY = boss.phase === 1 ? 150 : 250;
        if (Math.abs(boss.y - targetY) > 10) {
            boss.y += boss.y < targetY ? 1 : -1;
        }

        // Attack patterns
        if (time - boss.lastFire > (boss.phase === 1 ? 1000 : 600)) {
            boss.lastFire = time;
            boss.attackPattern = (boss.attackPattern + 1) % 4;

            if (boss.attackPattern === 0) {
                // Flame breath sweep
                for (let i = -8; i <= 8; i++) {
                    this.time.delayedCall(Math.abs(i) * 50, () => {
                        if (!boss.active) return;
                        const a = (i / 8) * 0.8 + Math.PI / 2;
                        const bullet = this.enemyBullets.create(boss.x, boss.y + 30, 'enemyBullet');
                        bullet.setTint(0xff6600);
                        bullet.setVelocity(Math.cos(a) * 200, Math.sin(a) * 200);
                        this.time.delayedCall(5000, () => { if (bullet.active) bullet.destroy(); });
                    });
                }
            } else if (boss.attackPattern === 1) {
                // Knife toss
                for (let i = 0; i < 5; i++) {
                    const a = angle + (i - 2) * 0.3;
                    const bullet = this.enemyBullets.create(boss.x, boss.y, 'enemyBullet');
                    bullet.setScale(1.3);
                    bullet.setVelocity(Math.cos(a) * 300, Math.sin(a) * 300);
                    this.time.delayedCall(5000, () => { if (bullet.active) bullet.destroy(); });
                }
            } else if (boss.attackPattern === 2) {
                // Bullet storm
                for (let i = 0; i < 16; i++) {
                    const a = (i / 16) * Math.PI * 2 + boss.patternTimer * 0.002;
                    const bullet = this.enemyBullets.create(boss.x, boss.y, 'enemyBullet');
                    bullet.setVelocity(Math.cos(a) * 150, Math.sin(a) * 150);
                    this.time.delayedCall(5000, () => { if (bullet.active) bullet.destroy(); });
                }
            } else {
                // Homing missiles (phase 2 only)
                if (boss.phase === 2) {
                    for (let i = 0; i < 3; i++) {
                        const bullet = this.enemyBullets.create(boss.x + (i - 1) * 30, boss.y, 'enemyBullet');
                        bullet.setScale(1.5);
                        bullet.setTint(0xff0000);
                        bullet.homing = true;
                        bullet.setVelocity(0, 100);
                        this.time.delayedCall(5000, () => { if (bullet.active) bullet.destroy(); });
                    }
                }
            }
        }

        // Update homing bullets
        this.enemyBullets.children.iterate((bullet) => {
            if (bullet && bullet.homing) {
                const toPlayer = Phaser.Math.Angle.Between(bullet.x, bullet.y, this.player.x, this.player.y);
                const speed = 180;
                bullet.setVelocity(
                    bullet.body.velocity.x * 0.95 + Math.cos(toPlayer) * speed * 0.05,
                    bullet.body.velocity.y * 0.95 + Math.sin(toPlayer) * speed * 0.05
                );
            }
        });
    }

    bulletHitEnemy(bullet, enemy) {
        bullet.destroy();

        // Gun Nut frontal shield
        if (enemy.shielded) {
            const bulletAngle = Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x);
            const enemyAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(bulletAngle - enemyAngle));
            if (angleDiff < Math.PI / 2) {
                // Blocked by shield
                return;
            }
        }

        enemy.health -= bullet.damage;

        // Flash red
        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (enemy.active) enemy.clearTint();
        });

        if (enemy.health <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        // Particle effect
        for (let i = 0; i < 8; i++) {
            const p = this.add.sprite(enemy.x, enemy.y, 'particle');
            p.setTint(0xcc8844);
            this.tweens.add({
                targets: p,
                x: enemy.x + Phaser.Math.Between(-40, 40),
                y: enemy.y + Phaser.Math.Between(-40, 40),
                alpha: 0,
                duration: 400,
                onComplete: () => p.destroy()
            });
        }

        // Drop shells
        const shellCount = enemy.isBoss ? 50 : Phaser.Math.Between(1, 3);
        for (let i = 0; i < shellCount; i++) {
            const pickup = this.pickups.create(
                enemy.x + Phaser.Math.Between(-20, 20),
                enemy.y + Phaser.Math.Between(-20, 20),
                'shell'
            );
            pickup.pickupType = 'shell';
        }

        // Chance for other drops
        if (Math.random() < 0.1) {
            const pickup = this.pickups.create(enemy.x, enemy.y, 'ammo');
            pickup.pickupType = 'ammo';
        }
        if (Math.random() < 0.05) {
            const pickup = this.pickups.create(enemy.x, enemy.y, 'heart');
            pickup.pickupType = 'heart';
        }

        // Boss drops
        if (enemy.isBoss) {
            // Chest drop
            const chest = this.pickups.create(enemy.x, enemy.y, 'chest');
            chest.pickupType = 'chest';

            // Destroy health bar
            if (this.bossHealthBar) {
                this.bossHealthBar.destroy();
                this.bossHealthBarBg.destroy();
            }
        }

        enemy.destroy();
    }

    playerHitByBullet(player, bullet) {
        // I-frames during dodge roll
        if (this.dodgeRolling && this.dodgeTime < this.dodgeIFrames) {
            return;
        }

        bullet.destroy();
        this.takeDamage(1);
    }

    takeDamage(amount) {
        // Armor first
        if (this.armor > 0) {
            this.armor -= amount;
            // Flash blue
            this.player.setTint(0x4488ff);
        } else {
            this.health -= amount;
            // Flash red
            this.player.setTint(0xff4444);
        }

        this.time.delayedCall(200, () => {
            this.player.clearTint();
        });

        // Screen shake
        this.cameras.main.shake(100, 0.01);

        if (this.health <= 0) {
            this.gameOver();
        }
    }

    collectPickup(player, pickup) {
        switch (pickup.pickupType) {
            case 'shell':
                this.shells++;
                break;
            case 'ammo':
                // Refill current weapon
                const weapon = this.weapons[this.currentWeapon];
                if (weapon.ammo !== Infinity) {
                    weapon.ammo += Math.floor(weapon.magSize * 0.5);
                }
                break;
            case 'heart':
                if (this.health < this.maxHealth) {
                    this.health = Math.min(this.health + 2, this.maxHealth);
                }
                break;
            case 'key':
                this.keys++;
                break;
            case 'blank':
                this.blanks++;
                break;
            case 'chest':
                // Give random weapon upgrade
                const weaponIndex = Phaser.Math.Between(1, 3);
                this.weapons[weaponIndex].ammo += 30;
                // Also give ammo for all weapons
                this.weapons.forEach(w => {
                    if (w.ammo !== Infinity) w.ammo += 20;
                });
                break;
        }
        pickup.destroy();
    }

    checkRoomClear() {
        if (this.roomCleared) return;

        if (this.enemies.countActive() === 0) {
            this.roomCleared = true;
            this.doorSprite.setVisible(true);
        }
    }

    nextRoom() {
        this.roomIndex++;

        if (this.roomIndex >= this.totalRooms) {
            // Next floor
            this.floor++;
            if (this.floor > this.maxFloors) {
                this.victory();
                return;
            }
            this.roomIndex = 0;
            this.totalRooms = this.roomsPerFloor[this.floor - 1];
            this.blanks = 2; // Reset blanks per floor
        }

        // Reset room
        this.roomCleared = false;
        this.doorSprite.setVisible(false);
        this.player.setPosition(400, 450);

        // Clear bullets
        this.bullets.clear(true, true);
        this.enemyBullets.clear(true, true);
        this.pickups.clear(true, true);

        // Clear and respawn obstacles
        this.obstacles.clear(true, true);
        const numObstacles = Phaser.Math.Between(3, 7);
        for (let i = 0; i < numObstacles; i++) {
            const ox = Phaser.Math.Between(100, 700);
            const oy = Phaser.Math.Between(100, 400);
            const obstacleType = Phaser.Math.Between(0, 2);
            if (obstacleType === 0) {
                this.obstacles.create(ox, oy, 'crate').refreshBody();
            } else if (obstacleType === 1) {
                this.obstacles.create(ox, oy, 'barrel').refreshBody();
            } else {
                this.obstacles.create(ox, oy, 'table').refreshBody();
            }
        }

        // Spawn new enemies
        this.spawnEnemies();
    }

    updateBullets() {
        // Remove bullets that are out of bounds
        this.bullets.children.iterate((bullet) => {
            if (bullet && (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600)) {
                bullet.destroy();
            }
        });
        this.enemyBullets.children.iterate((bullet) => {
            if (bullet && (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600)) {
                bullet.destroy();
            }
        });
    }

    gameOver() {
        this.scene.start('GameOverScene', { floor: this.floor, victory: false });
    }

    victory() {
        this.scene.start('GameOverScene', { floor: this.floor, victory: true });
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.floor = data.floor;
        this.victory = data.victory;
    }

    create() {
        const centerX = 400;

        if (this.victory) {
            this.add.text(centerX, 150, 'VICTORY!', {
                fontSize: '64px',
                fill: '#ffd700',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            this.add.text(centerX, 240, 'You defeated the High Dragun!', {
                fontSize: '24px',
                fill: '#8f8',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            this.add.text(centerX, 290, 'The Gungeon has been conquered.', {
                fontSize: '20px',
                fill: '#aaa',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        } else {
            this.add.text(centerX, 150, 'YOU DIED', {
                fontSize: '64px',
                fill: '#ff4444',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            const floorNames = ['Keep', 'Gungeon Proper', 'Forge'];
            this.add.text(centerX, 240, `Fell in the ${floorNames[this.floor - 1]}`, {
                fontSize: '24px',
                fill: '#f88',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        }

        const restartBtn = this.add.text(centerX, 400, '[ TRY AGAIN ]', {
            fontSize: '32px',
            fill: '#ff8',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive();

        restartBtn.on('pointerover', () => restartBtn.setFill('#ffa'));
        restartBtn.on('pointerout', () => restartBtn.setFill('#ff8'));
        restartBtn.on('pointerdown', () => this.scene.start('GameScene'));

        const menuBtn = this.add.text(centerX, 460, '[ MAIN MENU ]', {
            fontSize: '24px',
            fill: '#888',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerover', () => menuBtn.setFill('#aaa'));
        menuBtn.on('pointerout', () => menuBtn.setFill('#888'));
        menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);
