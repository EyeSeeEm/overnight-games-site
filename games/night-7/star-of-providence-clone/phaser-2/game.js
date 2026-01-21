// Star of Providence Clone
// Bullet-hell Roguelike Shooter

class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Player ship
        g.fillStyle(0x4488ff);
        g.beginPath();
        g.moveTo(16, 0);
        g.lineTo(0, 28);
        g.lineTo(16, 20);
        g.lineTo(32, 28);
        g.closePath();
        g.fill();
        g.fillStyle(0x88bbff);
        g.fillRect(12, 8, 8, 12);
        g.generateTexture('ship', 32, 32);
        g.clear();

        // Bullets
        g.fillStyle(0xffff44);
        g.fillCircle(4, 4, 4);
        g.generateTexture('bullet', 8, 8);
        g.clear();

        g.fillStyle(0xff4444);
        g.fillCircle(6, 6, 6);
        g.generateTexture('enemyBullet', 12, 12);
        g.clear();

        g.fillStyle(0x44ffff);
        g.fillRect(0, 0, 4, 16);
        g.generateTexture('laser', 4, 16);
        g.clear();

        g.fillStyle(0xff8844);
        g.fillCircle(8, 8, 8);
        g.fillStyle(0xffaa00);
        g.fillCircle(8, 8, 5);
        g.generateTexture('fireball', 16, 16);
        g.clear();

        // Enemies
        g.fillStyle(0x884488);
        g.fillCircle(12, 12, 12);
        g.fillStyle(0xaa66aa);
        g.fillCircle(12, 12, 6);
        g.generateTexture('ghost', 24, 24);
        g.clear();

        g.fillStyle(0x666688);
        g.fillRect(4, 4, 16, 16);
        g.fillStyle(0xff4444);
        g.fillCircle(12, 12, 4);
        g.generateTexture('drone', 24, 24);
        g.clear();

        g.fillStyle(0x555577);
        g.fillRect(0, 0, 24, 24);
        g.fillStyle(0xff6666);
        g.fillRect(8, 4, 8, 16);
        g.generateTexture('turret', 24, 24);
        g.clear();

        g.fillStyle(0x446644);
        g.fillCircle(12, 12, 12);
        g.fillStyle(0x66aa66);
        g.fillCircle(8, 8, 3);
        g.fillCircle(16, 8, 3);
        g.generateTexture('seeker', 24, 24);
        g.clear();

        g.fillStyle(0xffaa44);
        g.fillCircle(8, 8, 8);
        g.generateTexture('swarmer', 16, 16);
        g.clear();

        g.fillStyle(0x44aa88);
        g.fillCircle(16, 16, 16);
        g.fillStyle(0x66ccaa);
        g.fillCircle(16, 16, 8);
        g.generateTexture('blob', 32, 32);
        g.clear();

        // Bosses
        g.fillStyle(0x8844aa);
        g.fillRect(0, 0, 64, 64);
        g.fillStyle(0xaa66cc);
        g.fillCircle(32, 32, 20);
        g.fillStyle(0xff4444);
        g.fillCircle(32, 32, 8);
        g.generateTexture('boss1', 64, 64);
        g.clear();

        g.fillStyle(0x6666aa);
        g.fillRect(0, 0, 80, 48);
        g.fillStyle(0x8888cc);
        g.fillRect(10, 10, 60, 28);
        g.fillStyle(0xffff44);
        g.fillCircle(40, 24, 12);
        g.generateTexture('boss2', 80, 48);
        g.clear();

        g.fillStyle(0x444488);
        g.fillCircle(48, 48, 48);
        g.fillStyle(0x6666aa);
        g.fillCircle(48, 48, 32);
        g.fillStyle(0xff0000);
        g.fillCircle(48, 48, 16);
        g.generateTexture('boss3', 96, 96);
        g.clear();

        // Floor tile
        g.fillStyle(0x1a1a2a);
        g.fillRect(0, 0, 16, 16);
        g.fillStyle(0x222233);
        g.fillRect(0, 0, 1, 16);
        g.fillRect(0, 0, 16, 1);
        g.generateTexture('floor', 16, 16);
        g.clear();

        // Wall
        g.fillStyle(0x333355);
        g.fillRect(0, 0, 16, 16);
        g.fillStyle(0x444466);
        g.fillRect(2, 2, 12, 12);
        g.generateTexture('wall', 16, 16);
        g.clear();

        // Door
        g.fillStyle(0x885500);
        g.fillRect(0, 0, 32, 16);
        g.fillStyle(0xaa7700);
        g.fillRect(12, 4, 8, 8);
        g.generateTexture('door', 32, 16);
        g.clear();

        // Door (open)
        g.fillStyle(0x222244);
        g.fillRect(0, 0, 32, 16);
        g.generateTexture('doorOpen', 32, 16);
        g.clear();

        // Heart
        g.fillStyle(0xff4444);
        g.fillCircle(6, 6, 6);
        g.fillCircle(14, 6, 6);
        g.beginPath();
        g.moveTo(0, 8);
        g.lineTo(10, 20);
        g.lineTo(20, 8);
        g.closePath();
        g.fill();
        g.generateTexture('heart', 20, 20);
        g.clear();

        // Bomb
        g.fillStyle(0x444444);
        g.fillCircle(10, 12, 10);
        g.fillStyle(0xff4400);
        g.fillRect(8, 0, 4, 6);
        g.generateTexture('bomb', 20, 20);
        g.clear();

        // Weapon pickup
        g.fillStyle(0x44ff44);
        g.fillRect(4, 0, 8, 20);
        g.fillStyle(0x888888);
        g.fillRect(2, 16, 12, 8);
        g.generateTexture('weaponPickup', 16, 24);
        g.clear();

        // Debris (currency)
        g.fillStyle(0xffdd44);
        g.beginPath();
        g.moveTo(6, 0);
        g.lineTo(12, 4);
        g.lineTo(12, 10);
        g.lineTo(6, 14);
        g.lineTo(0, 10);
        g.lineTo(0, 4);
        g.closePath();
        g.fill();
        g.generateTexture('debris', 12, 14);
        g.clear();

        // Explosion
        g.fillStyle(0xffaa00);
        g.fillCircle(16, 16, 16);
        g.fillStyle(0xff4400);
        g.fillCircle(16, 16, 10);
        g.fillStyle(0xffff88);
        g.fillCircle(16, 16, 4);
        g.generateTexture('explosion', 32, 32);
        g.clear();

        // Sword swing
        g.fillStyle(0xaaaaaa);
        g.lineStyle(4, 0xdddddd);
        g.beginPath();
        g.arc(0, 16, 24, -Math.PI/3, Math.PI/3, false);
        g.stroke();
        g.generateTexture('swordSwing', 28, 32);
        g.clear();

        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;

        this.cameras.main.setBackgroundColor('#0a0a18');

        this.add.text(cx, cy - 120, 'STAR OF PROVIDENCE', {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#8888ff',
            stroke: '#222244',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(cx, cy - 70, 'Bullet-Hell Roguelike', {
            fontSize: '18px',
            color: '#6666aa'
        }).setOrigin(0.5);

        const instructions = [
            'WASD / Arrows - Move',
            'Space / Click - Fire',
            'Shift - Focus (slow for dodging)',
            'Z / Q - Dash (i-frames)',
            'X - Bomb (clears bullets)',
            '1-6 - Switch Weapons',
            '',
            'Clear rooms, defeat bosses,',
            'reach Floor 3 to win!'
        ];

        instructions.forEach((line, i) => {
            this.add.text(cx, cy - 20 + i * 22, line, {
                fontSize: '14px',
                color: '#888899'
            }).setOrigin(0.5);
        });

        this.add.text(cx, cy + 180, 'Press SPACE to Begin', {
            fontSize: '20px',
            color: '#ffdd88'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => this.startGame());
        this.input.once('pointerdown', () => this.startGame());
    }

    startGame() {
        this.scene.start('GameScene', { floor: 1 });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.currentFloor = data.floor || 1;
        this.playerHP = data.hp || 4;
        this.maxHP = data.maxHP || 4;
        this.bombs = data.bombs || 2;
        this.debris = data.debris || 0;
        this.weapons = data.weapons || ['peashooter'];
        this.currentWeapon = 0;
        this.multiplier = 1.0;
    }

    create() {
        // Room settings
        this.roomWidth = 400;
        this.roomHeight = 300;
        this.offsetX = (800 - this.roomWidth) / 2;
        this.offsetY = 60;

        // Generate floor layout
        this.generateFloor();

        // Create room background
        this.createRoom();

        // Player
        this.player = this.physics.add.sprite(
            this.offsetX + this.roomWidth / 2,
            this.offsetY + this.roomHeight - 40,
            'ship'
        );
        this.player.setCollideWorldBounds(false);
        this.player.setDepth(10);
        this.player.body.setSize(16, 16);

        // Player state
        this.isDashing = false;
        this.dashCooldown = 0;
        this.iFrames = 0;
        this.fireTimer = 0;
        this.focusMode = false;

        // Groups
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();

        // Physics
        this.physics.add.overlap(this.playerBullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.bulletHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.enemyHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.keys = this.input.keyboard.addKeys({
            space: 'SPACE',
            shift: 'SHIFT',
            z: 'Z',
            q: 'Q',
            x: 'X',
            one: 'ONE',
            two: 'TWO',
            three: 'THREE',
            four: 'FOUR',
            five: 'FIVE',
            six: 'SIX'
        });

        // Weapon definitions
        this.weaponDefs = {
            peashooter: { damage: 5, fireRate: 100, speed: 600, ammo: Infinity, name: 'Peashooter' },
            vulcan: { damage: 15, fireRate: 130, speed: 500, ammo: 500, name: 'Vulcan' },
            laser: { damage: 115, fireRate: 670, speed: 1200, ammo: 100, name: 'Laser', pierce: true },
            fireball: { damage: 80, fireRate: 830, speed: 300, ammo: 90, name: 'Fireball', explosive: true },
            revolver: { damage: 28, fireRate: 130, speed: 450, ammo: 250, name: 'Revolver' },
            sword: { damage: 70, fireRate: 530, speed: 0, ammo: 125, name: 'Sword', melee: true }
        };

        // Ammo tracking
        this.ammo = {};
        for (const w in this.weaponDefs) {
            this.ammo[w] = this.weaponDefs[w].ammo;
        }

        // Create HUD
        this.createHUD();

        // Start in empty starting room
        this.roomCleared = true;
        this.bossRoom = false;
        this.bossActive = false;
        this.boss = null;

        // Available weapons (unlock more as you progress)
        if (this.currentFloor >= 1 && !this.weapons.includes('vulcan')) {
            this.weapons.push('vulcan');
        }
        if (this.currentFloor >= 2) {
            if (!this.weapons.includes('laser')) this.weapons.push('laser');
            if (!this.weapons.includes('fireball')) this.weapons.push('fireball');
        }
        if (this.currentFloor >= 3) {
            if (!this.weapons.includes('revolver')) this.weapons.push('revolver');
            if (!this.weapons.includes('sword')) this.weapons.push('sword');
        }
    }

    generateFloor() {
        // Simple floor layout: 5-7 rooms + boss
        this.floorRooms = [];
        const numRooms = 4 + this.currentFloor;

        for (let i = 0; i < numRooms; i++) {
            this.floorRooms.push({
                id: i,
                cleared: i === 0, // Start room is cleared
                isBoss: false
            });
        }

        // Add boss room
        this.floorRooms.push({
            id: numRooms,
            cleared: false,
            isBoss: true
        });

        this.currentRoomIndex = 0;
    }

    createRoom() {
        // Clear existing room elements
        if (this.roomGraphics) {
            this.roomGraphics.forEach(g => g.destroy());
        }
        this.roomGraphics = [];

        // Floor tiles
        for (let y = 0; y < this.roomHeight; y += 16) {
            for (let x = 0; x < this.roomWidth; x += 16) {
                const tile = this.add.image(this.offsetX + x, this.offsetY + y, 'floor').setOrigin(0);
                this.roomGraphics.push(tile);
            }
        }

        // Walls
        for (let x = 0; x < this.roomWidth; x += 16) {
            const topWall = this.add.image(this.offsetX + x, this.offsetY - 16, 'wall').setOrigin(0);
            const botWall = this.add.image(this.offsetX + x, this.offsetY + this.roomHeight, 'wall').setOrigin(0);
            this.roomGraphics.push(topWall, botWall);
        }
        for (let y = -16; y < this.roomHeight + 16; y += 16) {
            const leftWall = this.add.image(this.offsetX - 16, this.offsetY + y, 'wall').setOrigin(0);
            const rightWall = this.add.image(this.offsetX + this.roomWidth, this.offsetY + y, 'wall').setOrigin(0);
            this.roomGraphics.push(leftWall, rightWall);
        }

        // Doors
        this.doors = [];
        const room = this.floorRooms[this.currentRoomIndex];

        // Top door (previous room)
        if (this.currentRoomIndex > 0) {
            const topDoor = this.add.image(this.offsetX + this.roomWidth/2, this.offsetY - 8, 'doorOpen').setOrigin(0.5);
            this.doors.push({ sprite: topDoor, direction: 'up' });
            this.roomGraphics.push(topDoor);
        }

        // Bottom door (next room)
        if (this.currentRoomIndex < this.floorRooms.length - 1 || room.cleared) {
            const isOpen = room.cleared || this.currentRoomIndex === 0;
            const botDoor = this.add.image(
                this.offsetX + this.roomWidth/2,
                this.offsetY + this.roomHeight + 8,
                isOpen ? 'doorOpen' : 'door'
            ).setOrigin(0.5);
            this.doors.push({ sprite: botDoor, direction: 'down', locked: !isOpen });
            this.roomGraphics.push(botDoor);
        }
    }

    createHUD() {
        // HP display
        this.hpDisplay = [];
        for (let i = 0; i < this.maxHP; i++) {
            const heart = this.add.image(20 + i * 24, 25, 'heart').setScrollFactor(0).setDepth(100);
            this.hpDisplay.push(heart);
        }

        // Bombs
        this.bombDisplay = [];
        for (let i = 0; i < 6; i++) {
            const bomb = this.add.image(650 + i * 24, 25, 'bomb').setScrollFactor(0).setDepth(100);
            this.bombDisplay.push(bomb);
        }

        // Weapon display
        this.weaponText = this.add.text(300, 15, '', {
            fontSize: '14px',
            color: '#88ff88'
        }).setScrollFactor(0).setDepth(100);

        this.ammoText = this.add.text(300, 35, '', {
            fontSize: '12px',
            color: '#aaaaaa'
        }).setScrollFactor(0).setDepth(100);

        // Bottom HUD
        this.floorText = this.add.text(20, 560, `Floor ${this.currentFloor}`, {
            fontSize: '16px',
            color: '#8888aa'
        }).setScrollFactor(0).setDepth(100);

        this.debrisText = this.add.text(20, 580, `Debris: ${this.debris}`, {
            fontSize: '14px',
            color: '#ffdd44'
        }).setScrollFactor(0).setDepth(100);

        this.multiplierText = this.add.text(700, 560, `x${this.multiplier.toFixed(2)}`, {
            fontSize: '18px',
            color: '#ff8844'
        }).setScrollFactor(0).setDepth(100);

        this.roomText = this.add.text(400, 560, '', {
            fontSize: '14px',
            color: '#888888'
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

        // Boss HP bar (hidden by default)
        this.bossHpBg = this.add.rectangle(400, 420, 304, 18, 0x333333)
            .setScrollFactor(0).setDepth(100).setVisible(false);
        this.bossHpBar = this.add.rectangle(250, 420, 300, 14, 0xff0000)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(101).setVisible(false);
        this.bossNameText = this.add.text(400, 440, '', {
            fontSize: '14px',
            color: '#ff6666'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);
    }

    update(time, delta) {
        this.handleMovement(delta);
        this.handleCombat(delta);
        this.handleWeaponSwitch();
        this.updateEnemies(delta);
        this.checkRoomTransition();
        this.updateHUD();

        // Update timers
        if (this.dashCooldown > 0) this.dashCooldown -= delta;
        if (this.iFrames > 0) this.iFrames -= delta;
        if (this.fireTimer > 0) this.fireTimer -= delta;

        // Decay multiplier slowly
        this.multiplier = Math.max(1.0, this.multiplier - delta * 0.0001);

        // Constrain player to room
        this.player.x = Phaser.Math.Clamp(
            this.player.x,
            this.offsetX + 20,
            this.offsetX + this.roomWidth - 20
        );
        this.player.y = Phaser.Math.Clamp(
            this.player.y,
            this.offsetY + 20,
            this.offsetY + this.roomHeight - 20
        );
    }

    handleMovement(delta) {
        const baseSpeed = 250;
        const focusSpeed = 100;
        const speed = this.keys.shift.isDown ? focusSpeed : baseSpeed;
        this.focusMode = this.keys.shift.isDown;

        let vx = 0, vy = 0;

        if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -speed;
        if (this.cursors.right.isDown || this.wasd.D.isDown) vx = speed;
        if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -speed;
        if (this.cursors.down.isDown || this.wasd.S.isDown) vy = speed;

        // Normalize diagonal
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        // Dash
        if ((Phaser.Input.Keyboard.JustDown(this.keys.z) || Phaser.Input.Keyboard.JustDown(this.keys.q))
            && this.dashCooldown <= 0 && !this.isDashing) {
            this.dash(vx, vy);
        }

        if (!this.isDashing) {
            this.player.setVelocity(vx, vy);
        }

        // Focus mode visual
        if (this.focusMode) {
            this.player.setTint(0x88ffff);
        } else {
            this.player.clearTint();
        }
    }

    dash(vx, vy) {
        this.isDashing = true;
        this.iFrames = 150;
        this.dashCooldown = 500;

        // Dash direction
        let dashX = 0, dashY = -1;
        if (vx !== 0 || vy !== 0) {
            const len = Math.sqrt(vx * vx + vy * vy);
            dashX = vx / len;
            dashY = vy / len;
        }

        const dashDist = 120;
        this.player.setVelocity(dashX * dashDist * 10, dashY * dashDist * 10);

        // Visual effect
        this.player.setAlpha(0.5);

        this.time.delayedCall(100, () => {
            this.isDashing = false;
            this.player.setAlpha(1);
            this.player.setVelocity(0, 0);
        });
    }

    handleCombat(delta) {
        // Fire
        if ((this.keys.space.isDown || this.input.activePointer.isDown) && this.fireTimer <= 0) {
            this.fire();
        }

        // Bomb
        if (Phaser.Input.Keyboard.JustDown(this.keys.x) && this.bombs > 0) {
            this.useBomb();
        }
    }

    fire() {
        const weapon = this.weapons[this.currentWeapon];
        const def = this.weaponDefs[weapon];

        if (this.ammo[weapon] <= 0) return;

        this.fireTimer = def.fireRate;
        if (this.ammo[weapon] !== Infinity) this.ammo[weapon]--;

        if (def.melee) {
            // Sword attack
            const swing = this.add.image(this.player.x, this.player.y - 20, 'swordSwing').setDepth(15);
            this.tweens.add({
                targets: swing,
                alpha: 0,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 200,
                onComplete: () => swing.destroy()
            });

            // Damage enemies in range
            this.enemies.getChildren().forEach(enemy => {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                if (dist < 50) {
                    this.damageEnemy(enemy, def.damage);
                }
            });
        } else {
            // Projectile weapon
            const bullet = this.playerBullets.create(this.player.x, this.player.y - 10,
                weapon === 'laser' ? 'laser' : weapon === 'fireball' ? 'fireball' : 'bullet');
            bullet.setVelocity(0, -def.speed);
            bullet.damage = def.damage;
            bullet.pierce = def.pierce || false;
            bullet.explosive = def.explosive || false;
            bullet.setDepth(5);

            // Auto-destroy when out of bounds
            this.time.delayedCall(3000, () => {
                if (bullet.active) bullet.destroy();
            });
        }
    }

    useBomb() {
        this.bombs--;

        // Create explosion
        const exp = this.add.image(this.player.x, this.player.y, 'explosion').setDepth(20).setScale(3);
        this.tweens.add({
            targets: exp,
            alpha: 0,
            scaleX: 6,
            scaleY: 6,
            duration: 500,
            onComplete: () => exp.destroy()
        });

        // Clear all enemy bullets
        this.enemyBullets.clear(true, true);

        // Damage all enemies
        this.enemies.getChildren().forEach(enemy => {
            this.damageEnemy(enemy, 50);
        });

        // Brief invincibility
        this.iFrames = 500;
    }

    handleWeaponSwitch() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.one) && this.weapons[0]) this.currentWeapon = 0;
        if (Phaser.Input.Keyboard.JustDown(this.keys.two) && this.weapons[1]) this.currentWeapon = 1;
        if (Phaser.Input.Keyboard.JustDown(this.keys.three) && this.weapons[2]) this.currentWeapon = 2;
        if (Phaser.Input.Keyboard.JustDown(this.keys.four) && this.weapons[3]) this.currentWeapon = 3;
        if (Phaser.Input.Keyboard.JustDown(this.keys.five) && this.weapons[4]) this.currentWeapon = 4;
        if (Phaser.Input.Keyboard.JustDown(this.keys.six) && this.weapons[5]) this.currentWeapon = 5;
    }

    bulletHitEnemy(bullet, enemy) {
        if (!bullet.pierce) {
            if (bullet.explosive) {
                // Explosion effect
                const exp = this.add.image(bullet.x, bullet.y, 'explosion').setDepth(20);
                this.tweens.add({
                    targets: exp,
                    alpha: 0,
                    scaleX: 2,
                    scaleY: 2,
                    duration: 300,
                    onComplete: () => exp.destroy()
                });

                // AoE damage
                this.enemies.getChildren().forEach(e => {
                    const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, e.x, e.y);
                    if (dist < 50) {
                        this.damageEnemy(e, bullet.damage * 0.5);
                    }
                });
            }
            bullet.destroy();
        }

        this.damageEnemy(enemy, bullet.damage);
    }

    damageEnemy(enemy, damage) {
        enemy.hp -= damage;

        // Flash
        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => {
            if (enemy.active) enemy.clearTint();
        });

        // Damage number
        const dmgText = this.add.text(enemy.x, enemy.y - 15, Math.floor(damage).toString(), {
            fontSize: '12px',
            color: '#ffff44'
        }).setOrigin(0.5).setDepth(20);

        this.tweens.add({
            targets: dmgText,
            y: enemy.y - 40,
            alpha: 0,
            duration: 500,
            onComplete: () => dmgText.destroy()
        });

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        // Increase multiplier
        this.multiplier = Math.min(10, this.multiplier + 0.1);

        // Drop debris
        const debrisAmount = Math.floor((enemy.debrisValue || 10) * this.multiplier);
        this.debris += debrisAmount;

        // Debris visual
        const deb = this.add.image(enemy.x, enemy.y, 'debris').setDepth(15);
        this.tweens.add({
            targets: deb,
            x: this.player.x,
            y: this.player.y,
            alpha: 0,
            duration: 300,
            onComplete: () => deb.destroy()
        });

        // Check if boss
        if (enemy === this.boss) {
            this.defeatBoss();
        }

        enemy.destroy();

        // Check room clear
        if (this.enemies.countActive() === 0 && !this.roomCleared) {
            this.clearRoom();
        }
    }

    bulletHitPlayer(player, bullet) {
        if (this.iFrames > 0) return;

        bullet.destroy();
        this.takeDamage();
    }

    enemyHitPlayer(player, enemy) {
        if (this.iFrames > 0) return;
        this.takeDamage();
    }

    takeDamage() {
        this.playerHP--;
        this.iFrames = 1000;
        this.multiplier = Math.max(1.0, this.multiplier - 1);

        // Flash player
        this.player.setTint(0xff0000);
        this.time.delayedCall(100, () => this.player.clearTint());

        // Screen shake
        this.cameras.main.shake(100, 0.02);

        if (this.playerHP <= 0) {
            this.gameOver();
        }
    }

    collectPickup(player, pickup) {
        if (pickup.type === 'health') {
            this.playerHP = Math.min(this.maxHP, this.playerHP + 1);
        } else if (pickup.type === 'bomb') {
            this.bombs = Math.min(6, this.bombs + 1);
        }
        pickup.destroy();
    }

    updateEnemies(delta) {
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.attackTimer > 0) enemy.attackTimer -= delta;

            switch (enemy.behavior) {
                case 'chase':
                    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                    enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
                    break;

                case 'turret':
                    enemy.setVelocity(0, 0);
                    if (enemy.attackTimer <= 0) {
                        this.enemyShoot(enemy);
                        enemy.attackTimer = enemy.fireRate;
                    }
                    break;

                case 'wander':
                    if (!enemy.wanderTimer || enemy.wanderTimer <= 0) {
                        const wanderAngle = Math.random() * Math.PI * 2;
                        enemy.setVelocity(
                            Math.cos(wanderAngle) * enemy.speed,
                            Math.sin(wanderAngle) * enemy.speed
                        );
                        enemy.wanderTimer = 1000;
                    }
                    enemy.wanderTimer -= delta;

                    if (enemy.attackTimer <= 0) {
                        this.enemyShoot(enemy);
                        enemy.attackTimer = enemy.fireRate;
                    }
                    break;

                case 'boss':
                    this.updateBoss(enemy, delta);
                    break;
            }

            // Keep in bounds
            if (enemy.x < this.offsetX + 20) enemy.x = this.offsetX + 20;
            if (enemy.x > this.offsetX + this.roomWidth - 20) enemy.x = this.offsetX + this.roomWidth - 20;
            if (enemy.y < this.offsetY + 20) enemy.y = this.offsetY + 20;
            if (enemy.y > this.offsetY + this.roomHeight - 20) enemy.y = this.offsetY + this.roomHeight - 20;
        });
    }

    enemyShoot(enemy) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
        bullet.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
        bullet.setDepth(5);

        this.time.delayedCall(5000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    updateBoss(boss, delta) {
        if (!boss.phaseTimer) boss.phaseTimer = 0;
        boss.phaseTimer += delta;

        // Update boss HP bar
        this.bossHpBar.width = 300 * (boss.hp / boss.maxHp);

        const cx = this.offsetX + this.roomWidth / 2;
        const cy = this.offsetY + 80;

        switch (boss.phase) {
            case 1:
                // Move side to side
                boss.x = cx + Math.sin(boss.phaseTimer * 0.002) * 150;
                boss.y = cy;

                // Shoot periodically
                if (boss.attackTimer <= 0) {
                    // Spread shot
                    for (let i = -2; i <= 2; i++) {
                        const bullet = this.enemyBullets.create(boss.x, boss.y + 30, 'enemyBullet');
                        const angle = Math.PI / 2 + i * 0.2;
                        bullet.setVelocity(Math.cos(angle) * 150, Math.sin(angle) * 150);
                        bullet.setDepth(5);
                    }
                    boss.attackTimer = 1000;
                }

                // Phase transition
                if (boss.hp < boss.maxHp * 0.5) {
                    boss.phase = 2;
                    boss.phaseTimer = 0;
                }
                break;

            case 2:
                // More aggressive
                boss.x = cx + Math.sin(boss.phaseTimer * 0.003) * 150;
                boss.y = cy + Math.sin(boss.phaseTimer * 0.004) * 30;

                if (boss.attackTimer <= 0) {
                    // Ring pattern
                    for (let i = 0; i < 12; i++) {
                        const angle = (i / 12) * Math.PI * 2;
                        const bullet = this.enemyBullets.create(boss.x, boss.y, 'enemyBullet');
                        bullet.setVelocity(Math.cos(angle) * 120, Math.sin(angle) * 120);
                        bullet.setDepth(5);
                    }
                    boss.attackTimer = 800;
                }
                break;
        }

        boss.attackTimer -= delta;
    }

    defeatBoss() {
        this.bossActive = false;
        this.bossHpBg.setVisible(false);
        this.bossHpBar.setVisible(false);
        this.bossNameText.setVisible(false);

        // Boss reward
        if (Math.random() < 0.5) {
            this.maxHP += 2;
            this.playerHP = Math.min(this.maxHP, this.playerHP + 2);
        }

        // Clear enemy bullets
        this.enemyBullets.clear(true, true);

        // Victory message
        const msg = this.add.text(400, 300, 'BOSS DEFEATED!', {
            fontSize: '32px',
            color: '#ffdd00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(100);

        this.time.delayedCall(2000, () => msg.destroy());
    }

    clearRoom() {
        this.roomCleared = true;
        this.floorRooms[this.currentRoomIndex].cleared = true;

        // Open doors
        this.doors.forEach(door => {
            if (door.locked) {
                door.sprite.setTexture('doorOpen');
                door.locked = false;
            }
        });

        // Spawn pickups
        if (Math.random() < 0.3) {
            const pickup = this.pickups.create(
                this.offsetX + Phaser.Math.Between(50, this.roomWidth - 50),
                this.offsetY + Phaser.Math.Between(50, this.roomHeight - 50),
                Math.random() < 0.5 ? 'heart' : 'bomb'
            );
            pickup.type = pickup.texture.key === 'heart' ? 'health' : 'bomb';
        }
    }

    checkRoomTransition() {
        // Check door collisions
        this.doors.forEach(door => {
            if (door.locked) return;

            const doorBounds = door.sprite.getBounds();
            const playerBounds = this.player.getBounds();

            if (Phaser.Geom.Rectangle.Overlaps(doorBounds, playerBounds)) {
                if (door.direction === 'down' && this.currentRoomIndex < this.floorRooms.length - 1) {
                    this.nextRoom();
                } else if (door.direction === 'up' && this.currentRoomIndex > 0) {
                    this.prevRoom();
                }
            }
        });
    }

    nextRoom() {
        this.currentRoomIndex++;
        this.transitionRoom('down');
    }

    prevRoom() {
        this.currentRoomIndex--;
        this.transitionRoom('up');
    }

    transitionRoom(direction) {
        // Clear bullets
        this.playerBullets.clear(true, true);
        this.enemyBullets.clear(true, true);
        this.enemies.clear(true, true);
        this.pickups.clear(true, true);

        // Recreate room
        this.createRoom();

        // Position player
        if (direction === 'down') {
            this.player.y = this.offsetY + 40;
        } else {
            this.player.y = this.offsetY + this.roomHeight - 40;
        }

        // Check if new room needs enemies
        const room = this.floorRooms[this.currentRoomIndex];
        if (!room.cleared) {
            if (room.isBoss) {
                this.spawnBoss();
            } else {
                this.spawnEnemies();
            }
            this.roomCleared = false;
        } else {
            this.roomCleared = true;
        }

        // Check floor completion
        if (room.isBoss && room.cleared) {
            this.completeFloor();
        }
    }

    spawnEnemies() {
        const numEnemies = 3 + this.currentFloor + Phaser.Math.Between(0, 2);
        const enemyTypes = ['ghost', 'drone', 'turret', 'seeker', 'swarmer'];

        for (let i = 0; i < numEnemies; i++) {
            const type = Phaser.Utils.Array.GetRandom(enemyTypes);
            const x = this.offsetX + Phaser.Math.Between(50, this.roomWidth - 50);
            const y = this.offsetY + Phaser.Math.Between(50, this.roomHeight - 100);

            this.spawnEnemy(x, y, type);
        }
    }

    spawnEnemy(x, y, type) {
        const defs = {
            ghost: { hp: 50, speed: 60, behavior: 'chase', debrisValue: 15 },
            drone: { hp: 70, speed: 100, behavior: 'chase', debrisValue: 20 },
            turret: { hp: 90, speed: 0, behavior: 'turret', fireRate: 2000, debrisValue: 25 },
            seeker: { hp: 120, speed: 50, behavior: 'wander', fireRate: 1500, debrisValue: 30 },
            swarmer: { hp: 12, speed: 150, behavior: 'chase', debrisValue: 5 },
            blob: { hp: 150, speed: 40, behavior: 'chase', debrisValue: 35 }
        };

        const def = defs[type];
        const enemy = this.enemies.create(x, y, type);
        enemy.hp = def.hp * (1 + this.currentFloor * 0.2);
        enemy.maxHp = enemy.hp;
        enemy.speed = def.speed;
        enemy.behavior = def.behavior;
        enemy.fireRate = def.fireRate || 0;
        enemy.attackTimer = def.fireRate || 0;
        enemy.debrisValue = def.debrisValue;
        enemy.setDepth(8);

        return enemy;
    }

    spawnBoss() {
        this.bossActive = true;
        this.bossRoom = true;

        const bossNames = ['Chamberlord', 'Wraithking', 'Core Guardian'];
        const bossTextures = ['boss1', 'boss2', 'boss3'];
        const bossHP = [1500, 2000, 2500];

        const bossIndex = this.currentFloor - 1;
        const boss = this.enemies.create(
            this.offsetX + this.roomWidth / 2,
            this.offsetY + 80,
            bossTextures[bossIndex]
        );

        boss.hp = bossHP[bossIndex];
        boss.maxHp = boss.hp;
        boss.behavior = 'boss';
        boss.phase = 1;
        boss.attackTimer = 1000;
        boss.debrisValue = 500 * this.currentFloor;
        boss.setDepth(8);

        this.boss = boss;

        // Show boss HP bar
        this.bossHpBg.setVisible(true);
        this.bossHpBar.setVisible(true);
        this.bossHpBar.width = 300;
        this.bossNameText.setText(bossNames[bossIndex]);
        this.bossNameText.setVisible(true);
    }

    completeFloor() {
        if (this.currentFloor >= 3) {
            // Victory!
            this.scene.start('VictoryScene', {
                debris: this.debris,
                floor: this.currentFloor
            });
        } else {
            // Next floor
            this.time.delayedCall(1000, () => {
                this.scene.restart({
                    floor: this.currentFloor + 1,
                    hp: this.playerHP,
                    maxHP: this.maxHP,
                    bombs: Math.min(6, this.bombs + 1),
                    debris: this.debris,
                    weapons: this.weapons
                });
            });
        }
    }

    gameOver() {
        this.scene.start('GameOverScene', {
            debris: this.debris,
            floor: this.currentFloor
        });
    }

    updateHUD() {
        // HP
        for (let i = 0; i < this.hpDisplay.length; i++) {
            this.hpDisplay[i].setVisible(i < this.maxHP);
            this.hpDisplay[i].setAlpha(i < this.playerHP ? 1 : 0.3);
        }

        // Bombs
        for (let i = 0; i < this.bombDisplay.length; i++) {
            this.bombDisplay[i].setAlpha(i < this.bombs ? 1 : 0.3);
        }

        // Weapon
        const weapon = this.weapons[this.currentWeapon];
        const def = this.weaponDefs[weapon];
        this.weaponText.setText(`[${this.currentWeapon + 1}] ${def.name}`);
        this.ammoText.setText(this.ammo[weapon] === Infinity ? 'Infinite' : `Ammo: ${this.ammo[weapon]}`);

        // Debris and multiplier
        this.debrisText.setText(`Debris: ${this.debris}`);
        this.multiplierText.setText(`x${this.multiplier.toFixed(2)}`);

        // Room info
        const room = this.floorRooms[this.currentRoomIndex];
        this.roomText.setText(`Room ${this.currentRoomIndex + 1}/${this.floorRooms.length}${room.isBoss ? ' (BOSS)' : ''}`);
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.debris = data.debris;
        this.floor = data.floor;
    }

    create() {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;

        this.cameras.main.setBackgroundColor('#0a0008');

        this.add.text(cx, cy - 80, 'DESTROYED', {
            fontSize: '42px',
            color: '#ff4444'
        }).setOrigin(0.5);

        this.add.text(cx, cy - 20, `Reached Floor ${this.floor}`, {
            fontSize: '20px',
            color: '#888888'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 20, `Debris Collected: ${this.debris}`, {
            fontSize: '18px',
            color: '#ffdd44'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 100, 'Press SPACE to Retry', {
            fontSize: '18px',
            color: '#888888'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('MenuScene'));
        this.input.once('pointerdown', () => this.scene.start('MenuScene'));
    }
}

class VictoryScene extends Phaser.Scene {
    constructor() {
        super('VictoryScene');
    }

    init(data) {
        this.debris = data.debris;
        this.floor = data.floor;
    }

    create() {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;

        this.cameras.main.setBackgroundColor('#0a1008');

        this.add.text(cx, cy - 100, 'VICTORY!', {
            fontSize: '48px',
            color: '#44ff44'
        }).setOrigin(0.5);

        this.add.text(cx, cy - 40, 'The facility has been cleared!', {
            fontSize: '18px',
            color: '#88aa88'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 10, `Floors Conquered: ${this.floor}`, {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 50, `Total Debris: ${this.debris}`, {
            fontSize: '18px',
            color: '#ffdd44'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 120, 'Press SPACE to Play Again', {
            fontSize: '18px',
            color: '#888888'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('MenuScene'));
        this.input.once('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// Config at end
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0a18',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene, VictoryScene]
};

const game = new Phaser.Game(config);
