// Frostfall - 2D Skyrim Demake (crisp-game-lib)
// Top-down action RPG
// Uses crisp-game-lib from CDN

const title = "FROSTFALL";

const description = `
[Arrows] Move
[Z] Attack
[X] Interact
`;

// Character sprites
const characters = [
  // a: Player (nord warrior)
  `
 cccc
cCCCCc
cCBBCc
 cCCc
 cCCc
  cc
`,
  // b: Bandit
  `
 rrrr
rRRRRr
rRyyRr
 rRRr
 rrrr
  rr
`,
  // c: Wolf
  `
ll  ll
 llll
llllll
  ll
 l  l
`,
  // d: Draugr (undead)
  `
 pppp
pPPPPp
pPccPp
 pPPp
 pppp
  pp
`,
  // e: Tree
  `
 llll
llLLll
 llll
  bb
  bb
`,
  // f: Rock
  `

 bbbb
bBBBBb
bBBBBb
 bbbb
`,
  // g: House
  `
 rrrr
rrrrrr
yYYYYy
yYYYYy
yYYYYy
`,
  // h: Sword swing
  `
   y
  yy
 yyy
yyyy
`,
  // i: Chest
  `
yyyyyy
yYYYYy
yYYYYy
`
];

const options = {
  viewSize: { x: 150, y: 150 },
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 1,
  theme: "dark"
};

// Game constants
const ZONE_SIZE = 150;

// Game state
let player;
let enemies;
let items;
let currentZone;
let hp;
let maxHp;
let stamina;
let gold;
let xp;
let level;
let attackCooldown;
let zones;
let trees;
let rocks;

// Expose for testing
window.gameState = {
  hp: 0,
  zone: '',
  level: 0,
  gold: 0,
  enemies: 0
};

function initZones() {
  zones = {
    village: {
      name: 'Whiterun Village',
      enemies: [],
      color: 'green'
    },
    wilderness: {
      name: 'Wilderness',
      enemies: ['wolf', 'bandit'],
      color: 'light_green'
    },
    dungeon: {
      name: 'Ancient Tomb',
      enemies: ['draugr', 'draugr'],
      color: 'purple'
    }
  };
}

function generateZone() {
  enemies = [];
  items = [];
  trees = [];
  rocks = [];

  const zone = zones[currentZone];

  // Generate trees
  if (currentZone !== 'dungeon') {
    const numTrees = currentZone === 'wilderness' ? 8 : 4;
    for (let i = 0; i < numTrees; i++) {
      trees.push({
        x: rnd(20, 130),
        y: rnd(20, 130)
      });
    }
  }

  // Generate rocks
  const numRocks = currentZone === 'dungeon' ? 6 : 3;
  for (let i = 0; i < numRocks; i++) {
    rocks.push({
      x: rnd(20, 130),
      y: rnd(20, 130)
    });
  }

  // Generate enemies based on zone
  for (const enemyType of zone.enemies) {
    let ex, ey;
    do {
      ex = rnd(30, 120);
      ey = rnd(30, 120);
    } while (sqrt(pow(ex - player.x, 2) + pow(ey - player.y, 2)) < 40);

    let ehp = 30;
    let speed = 0.3;
    let damage = 10;

    if (enemyType === 'wolf') {
      ehp = 20;
      speed = 0.5;
      damage = 8;
    } else if (enemyType === 'draugr') {
      ehp = 50;
      speed = 0.25;
      damage = 15;
    }

    enemies.push({
      x: ex,
      y: ey,
      type: enemyType,
      hp: ehp,
      maxHp: ehp,
      speed: speed,
      damage: damage,
      state: 'idle',
      dir: rnd(0, PI * 2),
      attackCooldown: 0
    });
  }

  // Generate items
  if (currentZone !== 'village') {
    // Chest with gold
    items.push({
      x: rnd(40, 110),
      y: rnd(40, 110),
      type: 'chest',
      gold: rndi(10, 30)
    });
  }
}

function update() {
  // Initialize
  if (!ticks) {
    initZones();
    player = { x: 75, y: 120, dx: 0, dy: 0, facing: 0 };
    currentZone = 'village';
    hp = 100;
    maxHp = 100;
    stamina = 100;
    gold = 0;
    xp = 0;
    level = 1;
    attackCooldown = 0;
    generateZone();
  }

  // Update game state for testing
  window.gameState = {
    hp: hp,
    zone: currentZone,
    level: level,
    gold: gold,
    enemies: enemies.length
  };

  // Draw background based on zone
  const zone = zones[currentZone];
  if (currentZone === 'village') {
    color("green");
  } else if (currentZone === 'wilderness') {
    color("light_green");
  } else {
    color("black");
  }
  rect(0, 0, 150, 150);

  // Draw zone transition areas
  color("cyan");
  // North exit
  rect(60, 0, 30, 5);
  // South exit
  rect(60, 145, 30, 5);

  // Draw trees
  color("green");
  for (const tree of trees) {
    char("e", tree.x, tree.y);
  }

  // Draw rocks
  color("light_black");
  for (const rock of rocks) {
    char("f", rock.x, rock.y);
  }

  // Draw house in village
  if (currentZone === 'village') {
    color("yellow");
    char("g", 75, 40);
  }

  // Draw items
  color("yellow");
  remove(items, (item) => {
    char("i", item.x, item.y);

    // Pickup detection
    const dist = sqrt(pow(player.x - item.x, 2) + pow(player.y - item.y, 2));
    if (dist < 10) {
      play("coin");
      gold += item.gold;
      addScore(item.gold, item.x, item.y);
      return true;
    }
    return false;
  });

  // Player movement
  const speed = 0.8;
  if (keyboard.code["ArrowUp"].isPressed || keyboard.code["KeyW"].isPressed) {
    player.dy = -speed;
    player.facing = -PI / 2;
  } else if (keyboard.code["ArrowDown"].isPressed || keyboard.code["KeyS"].isPressed) {
    player.dy = speed;
    player.facing = PI / 2;
  } else {
    player.dy *= 0.7;
  }

  if (keyboard.code["ArrowLeft"].isPressed || keyboard.code["KeyA"].isPressed) {
    player.dx = -speed;
    player.facing = PI;
  } else if (keyboard.code["ArrowRight"].isPressed || keyboard.code["KeyD"].isPressed) {
    player.dx = speed;
    player.facing = 0;
  } else {
    player.dx *= 0.7;
  }

  // Apply movement
  player.x += player.dx;
  player.y += player.dy;

  // Zone transitions
  if (player.y < 5 && player.x > 55 && player.x < 95) {
    // North transition
    if (currentZone === 'village') {
      currentZone = 'wilderness';
      player.y = 140;
      generateZone();
    } else if (currentZone === 'wilderness') {
      currentZone = 'dungeon';
      player.y = 140;
      generateZone();
    }
  }
  if (player.y > 145 && player.x > 55 && player.x < 95) {
    // South transition
    if (currentZone === 'dungeon') {
      currentZone = 'wilderness';
      player.y = 10;
      generateZone();
    } else if (currentZone === 'wilderness') {
      currentZone = 'village';
      player.y = 10;
      generateZone();
    }
  }

  // Keep player in bounds
  player.x = clamp(player.x, 8, 142);
  player.y = clamp(player.y, 8, 142);

  // Collision with trees and rocks
  for (const tree of trees) {
    const dist = sqrt(pow(player.x - tree.x, 2) + pow(player.y - tree.y, 2));
    if (dist < 10) {
      const angle = atan2(player.y - tree.y, player.x - tree.x);
      player.x = tree.x + cos(angle) * 10;
      player.y = tree.y + sin(angle) * 10;
    }
  }
  for (const rock of rocks) {
    const dist = sqrt(pow(player.x - rock.x, 2) + pow(player.y - rock.y, 2));
    if (dist < 8) {
      const angle = atan2(player.y - rock.y, player.x - rock.x);
      player.x = rock.x + cos(angle) * 8;
      player.y = rock.y + sin(angle) * 8;
    }
  }

  // Combat
  attackCooldown = max(0, attackCooldown - 1);
  if ((keyboard.code["KeyZ"].isJustPressed || keyboard.code["Space"].isJustPressed) && attackCooldown <= 0 && stamina >= 10) {
    play("laser");
    attackCooldown = 20;
    stamina -= 10;

    // Sword swing effect
    color("yellow");
    const swingX = player.x + cos(player.facing) * 10;
    const swingY = player.y + sin(player.facing) * 10;
    char("h", swingX, swingY);

    // Check for enemy hits
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      const dist = sqrt(pow(swingX - e.x, 2) + pow(swingY - e.y, 2));
      if (dist < 15) {
        e.hp -= 20 + level * 5;
        particle(e.x, e.y, { count: 5, speed: 1 });

        if (e.hp <= 0) {
          play("explosion");
          xp += e.maxHp;
          addScore(e.maxHp, e.x, e.y);
          particle(e.x, e.y, { count: 15, speed: 2 });
          enemies.splice(i, 1);

          // Level up
          if (xp >= level * 100) {
            level++;
            maxHp += 20;
            hp = maxHp;
            play("powerUp");
          }
        }
      }
    }
  }

  // Regenerate stamina
  stamina = min(100, stamina + 0.2);

  // Update enemies
  for (const e of enemies) {
    const distToPlayer = sqrt(pow(e.x - player.x, 2) + pow(e.y - player.y, 2));

    // AI state
    if (distToPlayer < 50) {
      e.state = 'chase';
    } else if (distToPlayer > 70) {
      e.state = 'idle';
    }

    // Movement
    if (e.state === 'idle') {
      if (rndi(100) < 2) {
        e.dir = rnd(0, PI * 2);
      }
      e.x += cos(e.dir) * e.speed * 0.3;
      e.y += sin(e.dir) * e.speed * 0.3;
    } else {
      const angle = atan2(player.y - e.y, player.x - e.x);
      e.x += cos(angle) * e.speed;
      e.y += sin(angle) * e.speed;
    }

    // Keep enemy in bounds
    e.x = clamp(e.x, 10, 140);
    e.y = clamp(e.y, 10, 140);

    // Attack player
    e.attackCooldown = max(0, e.attackCooldown - 1);
    if (distToPlayer < 12 && e.attackCooldown <= 0) {
      e.attackCooldown = 60;
      hp -= e.damage;
      play("hit");
      particle(player.x, player.y, { count: 5, speed: 1 });
    }

    // Draw enemy
    if (e.type === 'bandit') {
      color("red");
      char("b", e.x, e.y);
    } else if (e.type === 'wolf') {
      color("light_black");
      char("c", e.x, e.y);
    } else if (e.type === 'draugr') {
      color("purple");
      char("d", e.x, e.y);
    }

    // HP bar
    color("black");
    box(e.x, e.y - 8, 12, 3);
    color("red");
    const hpPct = e.hp / e.maxHp;
    box(e.x - 6 + hpPct * 6, e.y - 8, hpPct * 12, 3);
  }

  // Draw player
  color("cyan");
  char("a", player.x, player.y);

  // HUD
  color("white");
  text(`HP:${floor(hp)}/${maxHp}`, 3, 3);
  text(`ST:${floor(stamina)}`, 3, 12);
  text(`LV:${level}`, 3, 21);
  text(`G:${gold}`, 125, 3);
  text(`XP:${xp}`, 125, 12);

  // Zone name
  color("cyan");
  text(zone.name, 40, 3);

  // Death check
  if (hp <= 0) {
    play("lucky");
    end();
  }
}

// Initialize crisp-game-lib
addEventListener("load", onLoad);
