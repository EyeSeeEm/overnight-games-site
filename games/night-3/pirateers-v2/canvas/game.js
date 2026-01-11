// PIRATEERS - Naval Combat Clone
// Canvas Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const UI_WIDTH = 100;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Colors
const COLORS = {
    OCEAN: '#3080c0',
    OCEAN_DARK: '#2060a0',
    PLAYER_HULL: '#8a5030',
    PLAYER_DECK: '#c08050',
    ENEMY_HULL: '#505050',
    ENEMY_DECK: '#707070',
    CANNON_BALL: '#303030',
    GOLD: '#ffd700',
    LOOT: '#40aa40',
    UI_BG: '#5a3020',
    UI_BORDER: '#3a2010',
    HP_BAR: '#cc4040',
    HP_BG: '#400000'
};

// Game state
const game = {
    state: 'title', // title, sailing, base
    day: 1,
    dayTimer: 180, // 3 minutes
    gold: 100,
    cargo: [],
    cargoCapacity: 10,
    messages: [],
    startTime: Date.now()
};

// Stats tracking
const stats = {
    shipsSunk: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    critCount: 0,
    lootCollected: 0,
    cannonsFired: 0,
    maxKillStreak: 0,
    goldEarned: 0
};

// Kill streak
let killStreak = 0;
let killStreakTimer = 0;

// Visual effects
let damageFlashAlpha = 0;
let lowHealthPulse = 0;
let screenShake = { x: 0, y: 0, intensity: 0 };
let floatingTexts = [];

// Debug mode
let debugMode = false;

// Player ship
const player = {
    x: 600,
    y: 400,
    angle: -Math.PI / 2, // Facing up
    speed: 0,
    maxSpeed: 100, // Reduced from 150 for tighter gameplay
    turnRate: 1.5,
    speedLevel: 0, // 0=stop, 1=slow, 2=half, 3=full
    armor: 100,
    maxArmor: 100,
    firepower: 10,
    reloadTime: 2000,
    lastFire: 0,
    width: 60,
    height: 30
};

// Enemies
let enemies = [];
const enemyTypes = {
    merchant: { hp: 50, speed: 60, damage: 5, gold: 30, color: COLORS.ENEMY_HULL, size: 50 },
    navySloop: { hp: 80, speed: 100, damage: 12, gold: 40, color: '#4a5a6a', size: 55 },
    pirate: { hp: 100, speed: 120, damage: 15, gold: 55, color: '#4a3040', size: 55 },
    navyFrigate: { hp: 150, speed: 80, damage: 20, gold: 80, color: '#3a4a5a', size: 70 },
    pirateCaptain: { hp: 200, speed: 90, damage: 25, gold: 120, color: '#3a2030', size: 75 },
    ghostShip: { hp: 175, speed: 110, damage: 30, gold: 100, color: '#6080a0', size: 65, ghost: true }
};

// Special weapons
const specialWeapons = {
    fireballs: { damage: 40, charges: 5, cost: 500, speed: 450, dot: 5 },
    megashot: { damage: 80, charges: 3, cost: 750, speed: 300, range: 1.5 },
    chainshot: { damage: 25, charges: 6, cost: 400, speed: 400, slow: true }
};

// Player special weapon inventory
const playerWeapons = {
    activeWeapon: null,
    charges: {}
};

// Defensive items
const defensiveItems = {
    energyCloak: { duration: 10, cooldown: 60, active: false, timer: 0, cooldownTimer: 0, cost: 400 },
    tortoiseShield: { duration: 8, cooldown: 45, active: false, timer: 0, cooldownTimer: 0, cost: 350, damageReduction: 0.5 }
};

// Check if player has defensive items
let hasEnergyCloak = false;
let hasTortoiseShield = false;

// Quests
let activeQuests = [];
const questTypes = [
    { type: 'bounty', description: 'Sink {count} pirate ships', reward: 100 },
    { type: 'merchant', description: 'Sink {count} merchant ships', reward: 75 },
    { type: 'trade', description: 'Sell {count} cargo at ports', reward: 80 },
    { type: 'survive', description: 'Survive for {count} days', reward: 150 }
];

// Forts
let forts = [];

// Projectiles
let cannonballs = [];
let loot = [];
let particles = [];

// Islands and ports
let islands = [];
let ports = [];

// Camera
const camera = { x: 0, y: 0, zoom: 1.5 }; // 50% zoom in (1.5x scale)

// World bounds
const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1800;

// Input
const keys = {};

// Initialize
function init() {
    setupInput();
    // Don't spawn enemies yet - wait for title screen to be dismissed
    requestAnimationFrame(gameLoop);
}

// Title screen
function renderTitleScreen() {
    // Ocean background
    ctx.fillStyle = COLORS.OCEAN;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Ocean pattern
    ctx.strokeStyle = COLORS.OCEAN_DARK;
    ctx.lineWidth = 2;
    const time = Date.now() * 0.001;
    for (let y = 0; y < GAME_HEIGHT; y += 150) {
        for (let x = 0; x < GAME_WIDTH; x += 150) {
            ctx.beginPath();
            ctx.arc(x + Math.sin(time + y * 0.01) * 20, y, 40, 0, Math.PI * 1.5);
            ctx.stroke();
        }
    }

    // Title
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 72px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PIRATEERS', GAME_WIDTH / 2, 150);

    // Subtitle
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px serif';
    ctx.fillText('Naval Combat on the High Seas', GAME_WIDTH / 2, 210);

    // Draw a decorative ship
    ctx.save();
    ctx.translate(GAME_WIDTH / 2, 350);
    ctx.scale(2, 2);
    // Hull
    ctx.fillStyle = COLORS.PLAYER_HULL;
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(-30, -20);
    ctx.lineTo(-40, 0);
    ctx.lineTo(-30, 20);
    ctx.closePath();
    ctx.fill();
    // Sail
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-10, -35);
    ctx.lineTo(-10, 35);
    ctx.lineTo(20, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Controls box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(GAME_WIDTH / 2 - 200, 450, 400, 180);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(GAME_WIDTH / 2 - 200, 450, 400, 180);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('CONTROLS', GAME_WIDTH / 2, 480);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText('W / ↑  -  Increase Speed', GAME_WIDTH / 2, 515);
    ctx.fillText('S / ↓  -  Decrease Speed', GAME_WIDTH / 2, 545);
    ctx.fillText('A / ←  -  Turn Left', GAME_WIDTH / 2, 575);
    ctx.fillText('D / →  -  Turn Right', GAME_WIDTH / 2, 605);
    ctx.fillText('SPACE  -  Fire Cannons', GAME_WIDTH / 2, 635);

    // Start prompt (pulsing)
    const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
    ctx.font = 'bold 28px serif';
    ctx.fillText('Press any key or click to start', GAME_WIDTH / 2, GAME_HEIGHT - 50);
}

function setupInput() {
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;

        // Start game from title screen
        if (game.state === 'title') {
            game.state = 'sailing';
            generateIslands();
            spawnEnemies();
            spawnForts();
            generateQuests();
            addMessage("Day " + game.day + " - Set sail!");
            return;
        }

        if (e.key === ' ') {
            e.preventDefault();
            fireCanons();
        }
        if (e.key === 'q') {
            debugMode = !debugMode;
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    // Also start on click
    canvas.addEventListener('click', () => {
        if (game.state === 'title') {
            game.state = 'sailing';
            generateIslands();
            spawnEnemies();
            spawnForts();
            generateQuests();
            addMessage("Day " + game.day + " - Set sail!");
        }
    });

    // E key for trading at ports
    document.addEventListener('keydown', (e) => {
        if (e.key === 'e' && game.state === 'sailing') {
            tryDockAtPort();
        }
        // 1 key - activate energy cloak
        if (e.key === '1' && game.state === 'sailing' && hasEnergyCloak) {
            activateEnergyCloak();
        }
        // 2 key - activate tortoise shield
        if (e.key === '2' && game.state === 'sailing' && hasTortoiseShield) {
            activateTortoiseShield();
        }
        // F key - fire special weapon
        if (e.key === 'f' && game.state === 'sailing' && playerWeapons.activeWeapon) {
            fireSpecialWeapon();
        }
    });
}

function activateEnergyCloak() {
    if (defensiveItems.energyCloak.cooldownTimer > 0) {
        addMessage("Cloak on cooldown!");
        return;
    }
    defensiveItems.energyCloak.active = true;
    defensiveItems.energyCloak.timer = defensiveItems.energyCloak.duration;
    addMessage("Energy Cloak activated!");
    createFloatingText(player.x, player.y - 40, 'CLOAKED', '#8080ff', 16);
}

function activateTortoiseShield() {
    if (defensiveItems.tortoiseShield.cooldownTimer > 0) {
        addMessage("Shield on cooldown!");
        return;
    }
    defensiveItems.tortoiseShield.active = true;
    defensiveItems.tortoiseShield.timer = defensiveItems.tortoiseShield.duration;
    addMessage("Tortoise Shield activated!");
    createFloatingText(player.x, player.y - 40, 'SHIELDED', '#ffa040', 16);
}

function updateDefensiveItems(delta) {
    // Energy cloak
    if (defensiveItems.energyCloak.active) {
        defensiveItems.energyCloak.timer -= delta;
        if (defensiveItems.energyCloak.timer <= 0) {
            defensiveItems.energyCloak.active = false;
            defensiveItems.energyCloak.cooldownTimer = defensiveItems.energyCloak.cooldown;
            addMessage("Cloak deactivated");
        }
    } else if (defensiveItems.energyCloak.cooldownTimer > 0) {
        defensiveItems.energyCloak.cooldownTimer -= delta;
    }

    // Tortoise shield
    if (defensiveItems.tortoiseShield.active) {
        defensiveItems.tortoiseShield.timer -= delta;
        if (defensiveItems.tortoiseShield.timer <= 0) {
            defensiveItems.tortoiseShield.active = false;
            defensiveItems.tortoiseShield.cooldownTimer = defensiveItems.tortoiseShield.cooldown;
            addMessage("Shield deactivated");
        }
    } else if (defensiveItems.tortoiseShield.cooldownTimer > 0) {
        defensiveItems.tortoiseShield.cooldownTimer -= delta;
    }
}

function fireSpecialWeapon() {
    if (!playerWeapons.activeWeapon) return;
    const weapon = specialWeapons[playerWeapons.activeWeapon];
    if (!weapon) return;

    if (!playerWeapons.charges[playerWeapons.activeWeapon] || playerWeapons.charges[playerWeapons.activeWeapon] <= 0) {
        addMessage("No ammo for " + playerWeapons.activeWeapon + "!");
        return;
    }

    playerWeapons.charges[playerWeapons.activeWeapon]--;

    // Fire based on weapon type
    const angles = [-Math.PI/2, Math.PI/2];
    for (const sideAngle of angles) {
        const fireAngle = player.angle + sideAngle;

        if (playerWeapons.activeWeapon === 'fireballs') {
            cannonballs.push({
                x: player.x + Math.cos(fireAngle) * 25,
                y: player.y + Math.sin(fireAngle) * 25,
                vx: Math.cos(fireAngle) * weapon.speed,
                vy: Math.sin(fireAngle) * weapon.speed,
                damage: weapon.damage,
                life: 1.0,
                owner: 'player',
                type: 'fireball',
                dot: weapon.dot
            });
        } else if (playerWeapons.activeWeapon === 'megashot') {
            cannonballs.push({
                x: player.x + Math.cos(fireAngle) * 25,
                y: player.y + Math.sin(fireAngle) * 25,
                vx: Math.cos(fireAngle) * weapon.speed,
                vy: Math.sin(fireAngle) * weapon.speed,
                damage: weapon.damage,
                life: 1.2,
                owner: 'player',
                type: 'megashot',
                size: 12
            });
        } else if (playerWeapons.activeWeapon === 'chainshot') {
            cannonballs.push({
                x: player.x + Math.cos(fireAngle) * 25,
                y: player.y + Math.sin(fireAngle) * 25,
                vx: Math.cos(fireAngle) * weapon.speed,
                vy: Math.sin(fireAngle) * weapon.speed,
                damage: weapon.damage,
                life: 1.0,
                owner: 'player',
                type: 'chainshot',
                slow: true
            });
        }
    }

    // Effects
    triggerScreenShake(4);
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: player.x + (Math.random() - 0.5) * 40,
            y: player.y + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 120,
            vy: (Math.random() - 0.5) * 120,
            life: 0.4,
            color: playerWeapons.activeWeapon === 'fireballs' ? '#ff6030' : '#ffcc80',
            size: 6
        });
    }

    addMessage("Fired " + playerWeapons.activeWeapon + "!");
}

function generateIslands() {
    islands = [];
    ports = [];

    // Generate random islands
    const numIslands = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numIslands; i++) {
        let attempts = 0;
        while (attempts < 50) {
            const x = 200 + Math.random() * (WORLD_WIDTH - 400);
            const y = 200 + Math.random() * (WORLD_HEIGHT - 400);
            const size = 80 + Math.random() * 100;

            // Check not too close to other islands
            let valid = true;
            for (const island of islands) {
                if (Math.hypot(x - island.x, y - island.y) < island.size + size + 100) {
                    valid = false;
                    break;
                }
            }

            if (valid) {
                islands.push({
                    x, y, size,
                    color: '#6a8040',
                    sandColor: '#d8c080',
                    hasPort: i < 3 // First 3 islands have ports
                });

                // Add port if island has one
                if (i < 3) {
                    const portAngle = Math.random() * Math.PI * 2;
                    ports.push({
                        x: x + Math.cos(portAngle) * (size * 0.6),
                        y: y + Math.sin(portAngle) * (size * 0.6),
                        name: ['Port Royal', 'Tortuga', 'Nassau'][i],
                        goods: generatePortGoods()
                    });
                }
                break;
            }
            attempts++;
        }
    }
}

function generatePortGoods() {
    const goodTypes = ['Rum', 'Sugar', 'Spices', 'Silk', 'Tea', 'Coffee'];
    const goods = [];
    const numGoods = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numGoods; i++) {
        const type = goodTypes[Math.floor(Math.random() * goodTypes.length)];
        goods.push({
            type,
            buyPrice: 10 + Math.floor(Math.random() * 30),
            sellPrice: 20 + Math.floor(Math.random() * 40)
        });
    }
    return goods;
}

function tryDockAtPort() {
    for (const port of ports) {
        const dist = Math.hypot(player.x - port.x, player.y - port.y);
        if (dist < 80) {
            // Trade: sell cargo, buy goods
            if (game.cargo.length > 0) {
                let totalSale = 0;
                for (const item of game.cargo) {
                    const good = port.goods.find(g => g.type === item);
                    totalSale += good ? good.sellPrice : 15;
                }
                game.gold += totalSale;
                stats.goldEarned += totalSale;
                addMessage(`Sold cargo for ${totalSale} gold at ${port.name}!`);
                createFloatingText(port.x, port.y - 30, '+' + totalSale + ' GOLD', '#ffd700', 16);
                updateQuests('trade', game.cargo.length); // Track trade quest
                game.cargo = [];
            } else {
                // Buy random cargo if affordable
                const good = port.goods[Math.floor(Math.random() * port.goods.length)];
                if (game.gold >= good.buyPrice && game.cargo.length < game.cargoCapacity) {
                    game.gold -= good.buyPrice;
                    game.cargo.push(good.type);
                    addMessage(`Bought ${good.type} for ${good.buyPrice} gold at ${port.name}`);
                    createFloatingText(port.x, port.y - 30, '-' + good.buyPrice + ' GOLD', '#ff8844', 14);
                } else if (game.gold < good.buyPrice) {
                    addMessage(`Not enough gold to trade at ${port.name}`);
                } else {
                    addMessage(`Cargo hold full!`);
                }
            }
            return;
        }
    }
    addMessage("No port nearby to dock");
}

function checkIslandCollision(x, y, radius) {
    for (const island of islands) {
        const dist = Math.hypot(x - island.x, y - island.y);
        if (dist < island.size + radius) {
            return true;
        }
    }
    return false;
}

function spawnEnemies() {
    enemies = [];
    const count = 4 + game.day;

    // Enemy type weights based on day
    const getEnemyType = () => {
        const roll = Math.random();
        if (game.day >= 10 && roll < 0.1) return 'ghostShip';
        if (game.day >= 7 && roll < 0.15) return 'pirateCaptain';
        if (game.day >= 5 && roll < 0.2) return 'navyFrigate';
        if (roll < 0.4) return 'merchant';
        if (roll < 0.7) return 'navySloop';
        return 'pirate';
    };

    for (let i = 0; i < count; i++) {
        const type = getEnemyType();
        const data = enemyTypes[type];

        // Find spawn position avoiding islands
        let x, y, attempts = 0;
        do {
            x = 200 + Math.random() * (WORLD_WIDTH - 400);
            y = 200 + Math.random() * (WORLD_HEIGHT - 400);
            attempts++;
        } while (checkIslandCollision(x, y, data.size) && attempts < 50);

        enemies.push({
            x, y,
            angle: Math.random() * Math.PI * 2,
            speed: data.speed * (0.8 + Math.random() * 0.4),
            hp: data.hp,
            maxHp: data.hp,
            damage: data.damage,
            gold: data.gold,
            color: data.color,
            size: data.size,
            type: type,
            state: 'patrol',
            targetAngle: Math.random() * Math.PI * 2,
            lastFire: 0,
            reloadTime: data.ghost ? 1800 : 2500,
            ghost: data.ghost || false,
            slowTimer: 0
        });
    }
}

function spawnForts() {
    forts = [];
    if (game.day < 3) return; // No forts first 2 days

    const numForts = Math.min(3, Math.floor(game.day / 3));
    for (let i = 0; i < numForts; i++) {
        // Find position near island
        const island = islands[Math.floor(Math.random() * islands.length)];
        if (island) {
            const angle = Math.random() * Math.PI * 2;
            forts.push({
                x: island.x + Math.cos(angle) * (island.size + 50),
                y: island.y + Math.sin(angle) * (island.size + 50),
                hp: 150 + game.day * 20,
                maxHp: 150 + game.day * 20,
                damage: 20 + game.day * 2,
                range: 300,
                lastFire: 0,
                reloadTime: 3000,
                gold: 100 + game.day * 15
            });
        }
    }
}

function generateQuests() {
    activeQuests = [];
    const numQuests = Math.min(3, 1 + Math.floor(game.day / 2));

    for (let i = 0; i < numQuests; i++) {
        const template = questTypes[Math.floor(Math.random() * questTypes.length)];
        const count = 2 + Math.floor(Math.random() * 3) + Math.floor(game.day / 3);
        activeQuests.push({
            type: template.type,
            description: template.description.replace('{count}', count),
            reward: template.reward + game.day * 10,
            target: count,
            progress: 0,
            completed: false
        });
    }
}

function updateQuests(type, amount = 1) {
    for (const quest of activeQuests) {
        if (quest.completed) continue;

        let matches = false;
        if (quest.type === 'bounty' && type === 'pirate') matches = true;
        if (quest.type === 'merchant' && type === 'merchant') matches = true;
        if (quest.type === 'trade' && type === 'trade') matches = true;
        if (quest.type === 'survive' && type === 'day') matches = true;

        if (matches) {
            quest.progress += amount;
            if (quest.progress >= quest.target) {
                quest.completed = true;
                game.gold += quest.reward;
                stats.goldEarned += quest.reward;
                createFloatingText(player.x, player.y - 80, 'QUEST COMPLETE! +' + quest.reward, '#00ff88', 18);
                addMessage(`Quest complete! +${quest.reward} gold`);
            }
        }
    }
}

function updateForts(delta) {
    for (let i = forts.length - 1; i >= 0; i--) {
        const fort = forts[i];
        if (fort.hp <= 0) continue;

        const dist = Math.hypot(fort.x - player.x, fort.y - player.y);

        // Fire at player in range
        if (dist < fort.range) {
            const now = performance.now();
            if (now - fort.lastFire > fort.reloadTime) {
                fort.lastFire = now;

                const angle = Math.atan2(player.y - fort.y, player.x - fort.x);
                cannonballs.push({
                    x: fort.x,
                    y: fort.y,
                    vx: Math.cos(angle) * 300,
                    vy: Math.sin(angle) * 300,
                    damage: fort.damage,
                    life: 1.0,
                    owner: 'fort'
                });
            }
        }
    }
}

function damageFort(fort, damage) {
    fort.hp -= damage;
    stats.totalDamageDealt += damage;

    createFloatingText(fort.x, fort.y - 40, damage.toString(), '#ff6040', 14);
    triggerScreenShake(3);

    // Hit particles
    for (let i = 0; i < 3; i++) {
        particles.push({
            x: fort.x,
            y: fort.y,
            vx: (Math.random() - 0.5) * 60,
            vy: (Math.random() - 0.5) * 60,
            life: 0.4,
            color: '#8a6040',
            size: 5
        });
    }

    if (fort.hp <= 0) {
        destroyFort(fort);
    }
}

function destroyFort(fort) {
    // Drop loot
    loot.push({
        x: fort.x,
        y: fort.y,
        value: fort.gold,
        life: 20
    });

    // Big explosion
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: fort.x + (Math.random() - 0.5) * 50,
            y: fort.y + (Math.random() - 0.5) * 50,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 0.8 + Math.random() * 0.4,
            color: Math.random() < 0.5 ? '#ff8040' : '#ffcc60',
            size: 10 + Math.random() * 12
        });
    }

    triggerScreenShake(10);
    addMessage("Fort destroyed! Major loot dropped.");
    createFloatingText(fort.x, fort.y - 60, 'FORT DESTROYED!', '#ffaa00', 20);
}

function addMessage(text) {
    game.messages.unshift({ text, time: game.dayTimer });
    if (game.messages.length > 4) game.messages.pop();
}

let lastTime = 0;
function gameLoop(currentTime) {
    const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    if (game.state === 'title') {
        renderTitleScreen();
    } else if (game.state === 'sailing') {
        update(delta);
        render();
    } else {
        render();
    }

    requestAnimationFrame(gameLoop);
}

function update(delta) {
    // Day timer
    game.dayTimer -= delta;
    if (game.dayTimer <= 0) {
        endDay();
        return;
    }

    updatePlayer(delta);
    updateEnemies(delta);
    updateForts(delta);
    updateCannonballs(delta);
    updateLoot(delta);
    updateParticles(delta);
    updateVisualEffects(delta);
    updateFloatingTexts(delta);
    updateKillStreak(delta);
    updateDefensiveItems(delta);

    // Camera follow with zoom
    const viewW = (GAME_WIDTH - UI_WIDTH) / camera.zoom;
    const viewH = GAME_HEIGHT / camera.zoom;
    camera.x = player.x - viewW / 2;
    camera.y = player.y - viewH / 2;
    camera.x = Math.max(0, Math.min(WORLD_WIDTH - viewW, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_HEIGHT - viewH, camera.y));

    // Check death
    if (player.armor <= 0) {
        addMessage("Ship destroyed! Returning to port...");
        game.gold = Math.floor(game.gold * 0.75);
        endDay();
    }
}

function updatePlayer(delta) {
    // Turning
    if (keys['a'] || keys['arrowleft']) {
        player.angle -= player.turnRate * delta;
    }
    if (keys['d'] || keys['arrowright']) {
        player.angle += player.turnRate * delta;
    }

    // Speed control
    if (keys['w'] || keys['arrowup']) {
        player.speedLevel = Math.min(3, player.speedLevel + 2 * delta);
    }
    if (keys['s'] || keys['arrowdown']) {
        player.speedLevel = Math.max(0, player.speedLevel - 2 * delta);
    }

    // Calculate actual speed - faster acceleration (was 2, now 6)
    const speedMultipliers = [0, 0.25, 0.5, 1.0];
    const targetSpeed = player.maxSpeed * speedMultipliers[Math.floor(player.speedLevel)];
    player.speed += (targetSpeed - player.speed) * 6 * delta;

    // Move
    const newX = player.x + Math.cos(player.angle) * player.speed * delta;
    const newY = player.y + Math.sin(player.angle) * player.speed * delta;

    // Island collision
    if (!checkIslandCollision(newX, player.y, 30)) {
        player.x = newX;
    } else {
        player.speed *= 0.5; // Slow down on collision
    }
    if (!checkIslandCollision(player.x, newY, 30)) {
        player.y = newY;
    } else {
        player.speed *= 0.5;
    }

    // World bounds
    player.x = Math.max(50, Math.min(WORLD_WIDTH - 50, player.x));
    player.y = Math.max(50, Math.min(WORLD_HEIGHT - 50, player.y));

    // Collect loot
    for (let i = loot.length - 1; i >= 0; i--) {
        const l = loot[i];
        const dist = Math.hypot(player.x - l.x, player.y - l.y);
        if (dist < 50) {
            game.gold += l.value;
            stats.lootCollected++;
            stats.goldEarned += l.value;
            addMessage("+" + l.value + " gold!");
            createFloatingText(l.x, l.y - 20, '+' + l.value + ' GOLD', '#ffd700', 14);

            // Pickup sparkle
            for (let p = 0; p < 8; p++) {
                const angle = (Math.PI * 2 * p) / 8;
                particles.push({
                    x: l.x,
                    y: l.y,
                    vx: Math.cos(angle) * 60,
                    vy: Math.sin(angle) * 60,
                    life: 0.4,
                    color: '#ffd700',
                    size: 4
                });
            }

            loot.splice(i, 1);
        }
    }
}

function fireCanons() {
    const now = performance.now();
    if (now - player.lastFire < player.reloadTime) return;

    player.lastFire = now;
    stats.cannonsFired++;

    // Fire from both sides (broadside)
    const angles = [-Math.PI/2, Math.PI/2]; // Port and starboard

    for (const sideAngle of angles) {
        const fireAngle = player.angle + sideAngle;

        // 3 cannonballs per side with spread
        for (let i = 0; i < 3; i++) {
            const spread = (i - 1) * 0.15;
            const ballAngle = fireAngle + spread;

            cannonballs.push({
                x: player.x + Math.cos(fireAngle) * 20,
                y: player.y + Math.sin(fireAngle) * 20,
                vx: Math.cos(ballAngle) * 400 + player.speed * Math.cos(player.angle) * 0.3,
                vy: Math.sin(ballAngle) * 400 + player.speed * Math.sin(player.angle) * 0.3,
                damage: player.firepower,
                life: 0.75,
                owner: 'player'
            });
        }
    }

    // Muzzle flash particles
    for (let i = 0; i < 6; i++) {
        particles.push({
            x: player.x + (Math.random() - 0.5) * 30,
            y: player.y + (Math.random() - 0.5) * 30,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 0.3,
            color: '#ffcc80',
            size: 4
        });
    }
}

function updateEnemies(delta) {
    // Energy cloak hides player from enemies
    const playerCloaked = defensiveItems.energyCloak.active;

    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;

        const distToPlayer = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);

        // AI behavior - ignore player if cloaked
        if (playerCloaked) {
            enemy.state = 'patrol';
            if (Math.random() < 0.01) {
                enemy.targetAngle = Math.random() * Math.PI * 2;
            }
        } else if (enemy.type === 'merchant') {
            // Merchants flee from player
            if (distToPlayer < 300) {
                enemy.targetAngle = angleToPlayer + Math.PI; // Run away
            }
        } else {
            // Combat ships attack
            if (distToPlayer < 400) {
                enemy.state = 'attack';
                // Try to get broadside position
                const desiredAngle = angleToPlayer + Math.PI/2;
                enemy.targetAngle = desiredAngle;
            } else {
                enemy.state = 'patrol';
                if (Math.random() < 0.01) {
                    enemy.targetAngle = Math.random() * Math.PI * 2;
                }
            }
        }

        // Turn toward target angle
        const angleDiff = normalizeAngle(enemy.targetAngle - enemy.angle);
        enemy.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 1.2 * delta);

        // Move
        enemy.x += Math.cos(enemy.angle) * enemy.speed * delta;
        enemy.y += Math.sin(enemy.angle) * enemy.speed * delta;

        // World bounds
        enemy.x = Math.max(50, Math.min(WORLD_WIDTH - 50, enemy.x));
        enemy.y = Math.max(50, Math.min(WORLD_HEIGHT - 50, enemy.y));

        // Fire at player (not when cloaked)
        if (enemy.state === 'attack' && distToPlayer < 350 && !playerCloaked) {
            const now = performance.now();
            if (now - enemy.lastFire > enemy.reloadTime) {
                enemy.lastFire = now;

                // Fire toward player
                const fireAngle = angleToPlayer + (Math.random() - 0.5) * 0.3;
                cannonballs.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(fireAngle) * 350,
                    vy: Math.sin(fireAngle) * 350,
                    damage: enemy.damage,
                    life: 0.8,
                    owner: 'enemy'
                });
            }
        }
    }
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function updateCannonballs(delta) {
    for (let i = cannonballs.length - 1; i >= 0; i--) {
        const ball = cannonballs[i];

        ball.x += ball.vx * delta;
        ball.y += ball.vy * delta;
        ball.life -= delta;

        if (ball.life <= 0) {
            cannonballs.splice(i, 1);
            continue;
        }

        // Hit detection
        if (ball.owner === 'player') {
            // Check enemy hits
            let hit = false;
            for (const enemy of enemies) {
                if (enemy.hp <= 0) continue;
                const dist = Math.hypot(ball.x - enemy.x, ball.y - enemy.y);
                if (dist < enemy.size / 2 + 10) {
                    damageEnemy(enemy, ball.damage);
                    cannonballs.splice(i, 1);
                    hit = true;
                    break;
                }
            }
            // Check fort hits
            if (!hit) {
                for (const fort of forts) {
                    if (fort.hp <= 0) continue;
                    const dist = Math.hypot(ball.x - fort.x, ball.y - fort.y);
                    if (dist < 40) {
                        damageFort(fort, ball.damage);
                        cannonballs.splice(i, 1);
                        break;
                    }
                }
            }
        } else {
            // Enemy/fort projectiles hit player
            const dist = Math.hypot(ball.x - player.x, ball.y - player.y);
            if (dist < 30) {
                damagePlayer(ball.damage);
                cannonballs.splice(i, 1);
            }
        }
    }
}

function damageEnemy(enemy, damage) {
    // Critical hit system (15% chance, 2x damage)
    const isCrit = Math.random() < 0.15;
    if (isCrit) {
        damage *= 2;
        stats.critCount++;
    }

    enemy.hp -= damage;
    stats.totalDamageDealt += damage;

    // Floating damage number
    createFloatingText(
        enemy.x, enemy.y - 30,
        damage.toString() + (isCrit ? '!' : ''),
        isCrit ? '#ffff00' : '#ff6040',
        isCrit ? 18 : 14
    );

    // Screen shake
    triggerScreenShake(isCrit ? 5 : 2);

    // Hit particles (more for crits)
    const particleCount = isCrit ? 5 : 2;
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 80,
            life: 0.4,
            color: isCrit ? '#ffcc60' : '#606060',
            size: isCrit ? 8 : 6
        });
    }

    if (enemy.hp <= 0) {
        killEnemy(enemy, isCrit);
    }
}

function killEnemy(enemy, wasCrit) {
    stats.shipsSunk++;

    // Update quests based on enemy type
    if (enemy.type === 'pirate' || enemy.type === 'pirateCaptain') {
        updateQuests('pirate');
    } else if (enemy.type === 'merchant') {
        updateQuests('merchant');
    }

    // Kill streak
    killStreak++;
    killStreakTimer = 3;
    if (killStreak > stats.maxKillStreak) {
        stats.maxKillStreak = killStreak;
    }

    // Kill streak messages
    if (killStreak >= 3) {
        const streakMessages = { 3: 'TRIPLE SINK!', 4: 'QUAD SINK!', 5: 'RAMPAGE!', 6: 'ADMIRAL!' };
        const msg = streakMessages[Math.min(killStreak, 6)] || 'LEGENDARY!';
        createFloatingText(player.x, player.y - 60, msg, '#ffaa00', 20);
    }

    // Drop loot
    const goldDrop = enemy.gold + Math.floor(Math.random() * 20);
    loot.push({
        x: enemy.x,
        y: enemy.y,
        value: goldDrop,
        life: 15
    });

    // Explosion particles (more for bigger effect)
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: enemy.x + (Math.random() - 0.5) * 40,
            y: enemy.y + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 180,
            vy: (Math.random() - 0.5) * 180,
            life: 0.6 + Math.random() * 0.4,
            color: Math.random() < 0.5 ? '#ff8040' : '#ffcc60',
            size: 8 + Math.random() * 10
        });
    }

    // Death burst ring
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * 100,
            vy: Math.sin(angle) * 100,
            life: 0.5,
            color: '#ff6040',
            size: 6
        });
    }

    triggerScreenShake(8);
    addMessage("Enemy sunk!" + (wasCrit ? " CRITICAL!" : "") + " Loot dropped.");
}

function updateLoot(delta) {
    for (let i = loot.length - 1; i >= 0; i--) {
        loot[i].life -= delta;
        if (loot[i].life <= 0) {
            loot.splice(i, 1);
        }
    }
}

function updateParticles(delta) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.life -= delta;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function endDay() {
    game.day++;
    game.dayTimer = 180;
    player.armor = player.maxArmor;
    player.x = WORLD_WIDTH / 2;
    player.y = WORLD_HEIGHT / 2;
    player.speed = 0;
    player.speedLevel = 0;
    spawnEnemies();
    spawnForts();
    generateQuests();
    updateQuests('day');
    addMessage("Day " + game.day + " begins!");
}

// Helper functions for visual effects
function damagePlayer(damage) {
    // Energy cloak makes player invisible - attacks miss
    if (defensiveItems.energyCloak.active) {
        createFloatingText(player.x, player.y - 30, 'MISS', '#8080ff', 12);
        return;
    }

    // Tortoise shield reduces damage
    if (defensiveItems.tortoiseShield.active) {
        damage = Math.floor(damage * (1 - defensiveItems.tortoiseShield.damageReduction));
        createFloatingText(player.x, player.y - 50, 'BLOCKED!', '#ffa040', 12);
    }

    player.armor -= damage;
    stats.totalDamageTaken += damage;

    // Damage flash
    damageFlashAlpha = 0.4;

    // Screen shake
    triggerScreenShake(4);

    // Damage particles
    for (let i = 0; i < 4; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 0.4,
            color: '#8a5030',
            size: 6
        });
    }

    // Floating damage text
    createFloatingText(player.x, player.y - 30, '-' + damage, '#ff4444', 14);
    addMessage("Hit! -" + damage + " armor");
}

function createFloatingText(x, y, text, color, size) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        size: size,
        life: 1.0,
        maxLife: 1.0,
        vy: -40
    });
}

function triggerScreenShake(intensity) {
    screenShake.intensity = Math.max(screenShake.intensity, intensity);
}

function updateVisualEffects(delta) {
    // Damage flash decay
    if (damageFlashAlpha > 0) {
        damageFlashAlpha = Math.max(0, damageFlashAlpha - delta * 2);
    }

    // Low armor pulsing
    if (player.armor < 30) {
        lowHealthPulse += delta * 4;
    }

    // Screen shake decay
    if (screenShake.intensity > 0) {
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.intensity = Math.max(0, screenShake.intensity - delta * 25);
    } else {
        screenShake.x = 0;
        screenShake.y = 0;
    }
}

function updateFloatingTexts(delta) {
    floatingTexts = floatingTexts.filter(ft => {
        ft.life -= delta;
        ft.y += ft.vy * delta;
        return ft.life > 0;
    });
}

function updateKillStreak(delta) {
    if (killStreakTimer > 0) {
        killStreakTimer -= delta;
        if (killStreakTimer <= 0) {
            killStreak = 0;
        }
    }
}

function render() {
    // Clear
    ctx.fillStyle = COLORS.OCEAN;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw game world with zoom
    ctx.save();
    ctx.translate(UI_WIDTH, 0); // Move past UI panel
    ctx.scale(camera.zoom, camera.zoom); // Apply zoom
    ctx.translate(-camera.x + screenShake.x / camera.zoom, -camera.y + screenShake.y / camera.zoom);

    // Ocean pattern
    renderOcean();

    // Islands
    for (const island of islands) {
        // Sand ring (beach)
        ctx.fillStyle = island.sandColor;
        ctx.beginPath();
        ctx.arc(island.x, island.y, island.size + 15, 0, Math.PI * 2);
        ctx.fill();

        // Island body (green)
        ctx.fillStyle = island.color;
        ctx.beginPath();
        ctx.arc(island.x, island.y, island.size, 0, Math.PI * 2);
        ctx.fill();

        // Palm trees (simple)
        if (island.size > 60) {
            const numTrees = Math.floor(island.size / 40);
            for (let t = 0; t < numTrees; t++) {
                const angle = (Math.PI * 2 * t) / numTrees + island.x * 0.01;
                const dist = island.size * 0.5 * (0.3 + Math.random() * 0.5);
                const tx = island.x + Math.cos(angle) * dist;
                const ty = island.y + Math.sin(angle) * dist;
                ctx.fillStyle = '#4a6020';
                ctx.beginPath();
                ctx.arc(tx, ty, 12, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Ports
    for (const port of ports) {
        // Dock
        ctx.fillStyle = '#8a6040';
        ctx.fillRect(port.x - 20, port.y - 8, 40, 16);

        // Building
        ctx.fillStyle = '#c0a080';
        ctx.fillRect(port.x - 12, port.y - 25, 24, 20);
        ctx.fillStyle = '#6a4020';
        ctx.beginPath();
        ctx.moveTo(port.x - 15, port.y - 25);
        ctx.lineTo(port.x, port.y - 40);
        ctx.lineTo(port.x + 15, port.y - 25);
        ctx.closePath();
        ctx.fill();

        // Port name
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(port.name, port.x, port.y + 25);
        ctx.textAlign = 'left';

        // Dock indicator if player is nearby
        const dist = Math.hypot(player.x - port.x, player.y - port.y);
        if (dist < 100) {
            ctx.fillStyle = '#ffd700';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('[E] Trade', port.x, port.y + 40);
            ctx.textAlign = 'left';
        }
    }

    // Forts
    for (const fort of forts) {
        if (fort.hp <= 0) continue;

        // Fort base (stone)
        ctx.fillStyle = '#606060';
        ctx.beginPath();
        ctx.arc(fort.x, fort.y, 35, 0, Math.PI * 2);
        ctx.fill();

        // Fort walls
        ctx.fillStyle = '#404040';
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 * i) / 4;
            ctx.fillRect(
                fort.x + Math.cos(angle) * 25 - 10,
                fort.y + Math.sin(angle) * 25 - 10,
                20, 20
            );
        }

        // Cannon turret
        ctx.fillStyle = '#303030';
        ctx.beginPath();
        ctx.arc(fort.x, fort.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        const barW = 60;
        ctx.fillStyle = COLORS.HP_BG;
        ctx.fillRect(fort.x - barW/2, fort.y - 55, barW, 6);
        ctx.fillStyle = '#cc8040';
        ctx.fillRect(fort.x - barW/2, fort.y - 55, barW * (fort.hp / fort.maxHp), 6);

        // Fort label
        ctx.fillStyle = '#cc4040';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FORT', fort.x, fort.y - 60);
        ctx.textAlign = 'left';
    }

    // Loot
    for (const l of loot) {
        ctx.fillStyle = COLORS.GOLD;
        ctx.beginPath();
        ctx.arc(l.x, l.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffa000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Enemies
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        renderShip(enemy.x, enemy.y, enemy.angle, enemy.color, enemy.size, false);

        // Health bar
        if (enemy.hp < enemy.maxHp) {
            const barW = enemy.size;
            ctx.fillStyle = COLORS.HP_BG;
            ctx.fillRect(enemy.x - barW/2, enemy.y - enemy.size/2 - 12, barW, 6);
            ctx.fillStyle = COLORS.HP_BAR;
            ctx.fillRect(enemy.x - barW/2, enemy.y - enemy.size/2 - 12, barW * (enemy.hp / enemy.maxHp), 6);
        }
    }

    // Player
    renderShip(player.x, player.y, player.angle, COLORS.PLAYER_HULL, 60, true);

    // Cannonballs
    ctx.fillStyle = COLORS.CANNON_BALL;
    for (const ball of cannonballs) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Particles
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Floating texts (world space)
    for (const ft of floatingTexts) {
        ctx.font = `bold ${ft.size}px monospace`;
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.life / ft.maxLife;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';

    ctx.restore();

    // UI
    renderUI();
}

function renderOcean() {
    // Draw swirl patterns on ocean
    ctx.strokeStyle = COLORS.OCEAN_DARK;
    ctx.lineWidth = 2;

    const spacing = 150;
    const offsetX = (camera.x % spacing);
    const offsetY = (camera.y % spacing);

    for (let y = -spacing; y < GAME_HEIGHT + spacing; y += spacing) {
        for (let x = -spacing; x < GAME_WIDTH + spacing; x += spacing) {
            const wx = x - offsetX + camera.x;
            const wy = y - offsetY + camera.y;

            ctx.beginPath();
            ctx.arc(wx, wy, 40 + Math.sin(wx * 0.01 + wy * 0.01) * 10, 0, Math.PI * 1.5);
            ctx.stroke();
        }
    }
}

function renderShip(x, y, angle, hullColor, size, isPlayer) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Hull
    ctx.fillStyle = hullColor;
    ctx.beginPath();
    ctx.moveTo(size * 0.5, 0);
    ctx.lineTo(-size * 0.4, -size * 0.25);
    ctx.lineTo(-size * 0.5, 0);
    ctx.lineTo(-size * 0.4, size * 0.25);
    ctx.closePath();
    ctx.fill();

    // Deck
    ctx.fillStyle = isPlayer ? COLORS.PLAYER_DECK : COLORS.ENEMY_DECK;
    ctx.fillRect(-size * 0.3, -size * 0.15, size * 0.6, size * 0.3);

    // Mast
    ctx.fillStyle = '#5a4030';
    ctx.fillRect(-size * 0.05, -size * 0.02, size * 0.1, size * 0.04);

    // Sail (simplified)
    ctx.fillStyle = '#e0d8c8';
    ctx.beginPath();
    ctx.moveTo(-size * 0.1, -size * 0.2);
    ctx.lineTo(size * 0.15, 0);
    ctx.lineTo(-size * 0.1, size * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function renderUI() {
    // Left panel background
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(0, 0, UI_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = COLORS.UI_BORDER;
    ctx.fillRect(UI_WIDTH - 4, 0, 4, GAME_HEIGHT);

    // Day
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText('Day ' + game.day, 10, 30);

    // Gold
    ctx.fillStyle = COLORS.GOLD;
    ctx.fillText('$' + game.gold, 10, 55);

    // Armor bar
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ARMOR', 10, 85);
    ctx.fillStyle = COLORS.HP_BG;
    ctx.fillRect(10, 90, 80, 12);
    ctx.fillStyle = COLORS.HP_BAR;
    ctx.fillRect(10, 90, 80 * (player.armor / player.maxArmor), 12);

    // Speed indicator
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SPEED', 10, 125);
    const speedNames = ['STOP', 'SLOW', 'HALF', 'FULL'];
    ctx.fillText(speedNames[Math.floor(player.speedLevel)], 10, 145);

    // Time remaining
    ctx.fillStyle = '#ffffff';
    ctx.fillText('TIME', 10, 180);
    const mins = Math.floor(game.dayTimer / 60);
    const secs = Math.floor(game.dayTimer % 60);
    ctx.fillText(mins + ':' + secs.toString().padStart(2, '0'), 10, 200);

    // Cargo display
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.fillText('CARGO', 10, 230);
    ctx.fillStyle = '#aaaaaa';
    if (game.cargo.length === 0) {
        ctx.fillText('Empty', 10, 248);
    } else {
        for (let i = 0; i < Math.min(game.cargo.length, 5); i++) {
            ctx.fillText(game.cargo[i], 10, 248 + i * 14);
        }
        if (game.cargo.length > 5) {
            ctx.fillText('...+' + (game.cargo.length - 5), 10, 318);
        }
    }

    // Controls hint
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '10px monospace';
    ctx.fillText('A/D Turn', 10, GAME_HEIGHT - 95);
    ctx.fillText('W/S Speed', 10, GAME_HEIGHT - 80);
    ctx.fillText('SPACE Fire', 10, GAME_HEIGHT - 65);
    ctx.fillText('E Trade', 10, GAME_HEIGHT - 50);

    // Messages
    ctx.font = '12px monospace';
    for (let i = 0; i < game.messages.length; i++) {
        const msg = game.messages[i];
        ctx.fillStyle = `rgba(100, 200, 100, ${Math.max(0, 1 - i * 0.3)})`;
        ctx.fillText(msg.text, UI_WIDTH + 10, GAME_HEIGHT - 60 + i * 15);
    }

    // Top bar - Active quests
    ctx.fillStyle = 'rgba(90, 48, 32, 0.9)';
    ctx.fillRect(UI_WIDTH, 0, GAME_WIDTH - UI_WIDTH, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';

    // Display active quests
    let questX = UI_WIDTH + 10;
    for (const quest of activeQuests) {
        if (quest.completed) {
            ctx.fillStyle = '#40cc40';
            ctx.fillText(`✓ ${quest.type}`, questX, 25);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`${quest.type}: ${quest.progress}/${quest.target}`, questX, 25);
        }
        questX += 150;
    }

    // Enemies alive
    const aliveEnemies = enemies.filter(e => e.hp > 0).length;
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.fillText('Ships: ' + aliveEnemies, GAME_WIDTH - 100, 25);

    // Minimap (bottom right corner)
    renderMinimap();

    // Kill streak display
    if (killStreak >= 2) {
        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = '#ffaa00';
        ctx.textAlign = 'center';
        ctx.fillText(`${killStreak}x STREAK`, GAME_WIDTH / 2 + UI_WIDTH / 2, 70);
        ctx.textAlign = 'left';
    }

    // Damage flash overlay
    if (damageFlashAlpha > 0) {
        ctx.fillStyle = `rgba(200, 50, 30, ${damageFlashAlpha})`;
        ctx.fillRect(UI_WIDTH, 0, GAME_WIDTH - UI_WIDTH, GAME_HEIGHT);
    }

    // Low armor vignette
    if (player.armor < 30) {
        const pulseAlpha = 0.15 + Math.sin(lowHealthPulse) * 0.1;
        ctx.fillStyle = `rgba(100, 30, 20, ${pulseAlpha})`;
        ctx.fillRect(UI_WIDTH, 0, GAME_WIDTH - UI_WIDTH, GAME_HEIGHT);
    }

    // Debug overlay
    if (debugMode) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(GAME_WIDTH - 200, 50, 190, 200);
        ctx.fillStyle = '#00ff00';
        ctx.font = '11px monospace';
        const lines = [
            `SHIPS SUNK: ${stats.shipsSunk}`,
            `DMG DEALT: ${stats.totalDamageDealt}`,
            `DMG TAKEN: ${stats.totalDamageTaken}`,
            `CRITS: ${stats.critCount}`,
            `LOOT: ${stats.lootCollected}`,
            `CANNONS: ${stats.cannonsFired}`,
            `MAX STREAK: ${stats.maxKillStreak}`,
            `STREAK: ${killStreak}`,
            `GOLD EARNED: ${stats.goldEarned}`,
            `---`,
            `ARMOR: ${Math.floor(player.armor)}`,
            `GOLD: ${game.gold}`,
            `DAY: ${game.day}`
        ];
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], GAME_WIDTH - 190, 65 + i * 14);
        }
    }

    // Day transition screen (when player is destroyed)
    if (player.armor <= 0 && game.state === 'sailing') {
        const timePlayed = Math.floor((Date.now() - game.startTime) / 1000);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = '#cc6040';
        ctx.font = '40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SHIP DESTROYED!', GAME_WIDTH / 2, 100);

        // Performance rating
        let rating = 'DECKHAND';
        let ratingColor = '#cc4040';
        if (stats.shipsSunk >= 2) { rating = 'SAILOR'; ratingColor = '#aaaa40'; }
        if (stats.shipsSunk >= 4 && stats.critCount >= 1) { rating = 'CAPTAIN'; ratingColor = '#40aa60'; }
        if (stats.shipsSunk >= 6 && stats.critCount >= 3) { rating = 'ADMIRAL'; ratingColor = '#40aaff'; }

        ctx.fillStyle = ratingColor;
        ctx.font = '28px monospace';
        ctx.fillText(`RATING: ${rating}`, GAME_WIDTH / 2, 150);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '16px monospace';
        const statsLines = [
            `TIME SAILED: ${Math.floor(timePlayed / 60)}:${(timePlayed % 60).toString().padStart(2, '0')}`,
            ``,
            `SHIPS SUNK: ${stats.shipsSunk}`,
            `DAMAGE DEALT: ${stats.totalDamageDealt}`,
            `DAMAGE TAKEN: ${stats.totalDamageTaken}`,
            `CRITICAL HITS: ${stats.critCount}`,
            `MAX KILL STREAK: ${stats.maxKillStreak}`,
            ``,
            `LOOT COLLECTED: ${stats.lootCollected}`,
            `CANNONS FIRED: ${stats.cannonsFired}`,
            `TOTAL GOLD EARNED: ${stats.goldEarned}`,
            ``,
            `DAY: ${game.day}  GOLD: ${game.gold}`
        ];
        for (let i = 0; i < statsLines.length; i++) {
            ctx.fillText(statsLines[i], GAME_WIDTH / 2, 200 + i * 24);
        }

        ctx.textAlign = 'left';
    }
}

function renderMinimap() {
    const mapSize = 120;
    const mapX = GAME_WIDTH - mapSize - 10;
    const mapY = GAME_HEIGHT - mapSize - 10;
    const scaleX = mapSize / WORLD_WIDTH;
    const scaleY = mapSize / WORLD_HEIGHT;

    // Background
    ctx.fillStyle = 'rgba(32, 48, 64, 0.8)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    ctx.strokeStyle = '#8a5030';
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    // Islands
    ctx.fillStyle = '#6a8040';
    for (const island of islands) {
        const ix = mapX + island.x * scaleX;
        const iy = mapY + island.y * scaleY;
        const ir = Math.max(3, island.size * scaleX);
        ctx.beginPath();
        ctx.arc(ix, iy, ir, 0, Math.PI * 2);
        ctx.fill();
    }

    // Ports
    ctx.fillStyle = '#ffd700';
    for (const port of ports) {
        const px = mapX + port.x * scaleX;
        const py = mapY + port.y * scaleY;
        ctx.fillRect(px - 2, py - 2, 4, 4);
    }

    // Forts
    ctx.fillStyle = '#cc4040';
    for (const fort of forts) {
        if (fort.hp <= 0) continue;
        const fx = mapX + fort.x * scaleX;
        const fy = mapY + fort.y * scaleY;
        ctx.fillRect(fx - 2, fy - 2, 4, 4);
    }

    // Enemies
    ctx.fillStyle = '#cc6060';
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const ex = mapX + enemy.x * scaleX;
        const ey = mapY + enemy.y * scaleY;
        ctx.beginPath();
        ctx.arc(ex, ey, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Loot
    ctx.fillStyle = '#ffcc00';
    for (const l of loot) {
        const lx = mapX + l.x * scaleX;
        const ly = mapY + l.y * scaleY;
        ctx.fillRect(lx - 1, ly - 1, 2, 2);
    }

    // Player
    ctx.fillStyle = '#40ff40';
    const playerMX = mapX + player.x * scaleX;
    const playerMY = mapY + player.y * scaleY;
    ctx.beginPath();
    ctx.moveTo(playerMX + Math.cos(player.angle) * 5, playerMY + Math.sin(player.angle) * 5);
    ctx.lineTo(playerMX + Math.cos(player.angle + 2.5) * 4, playerMY + Math.sin(player.angle + 2.5) * 4);
    ctx.lineTo(playerMX + Math.cos(player.angle - 2.5) * 4, playerMY + Math.sin(player.angle - 2.5) * 4);
    ctx.closePath();
    ctx.fill();

    // Camera view rectangle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    const viewW = (GAME_WIDTH - UI_WIDTH) / camera.zoom;
    const viewH = GAME_HEIGHT / camera.zoom;
    ctx.strokeRect(
        mapX + camera.x * scaleX,
        mapY + camera.y * scaleY,
        viewW * scaleX,
        viewH * scaleY
    );
}

// Start
init();
