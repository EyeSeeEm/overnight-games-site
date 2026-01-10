// Motherload - 2D Mining Game (crisp-game-lib)
// Dig, collect minerals, sell, upgrade!

const title = "MOTHERLOAD";

const description = `
[Arrows] Move/Dig
[Z] Fly Up
[X] Interact
`;

// Character sprites
const characters = [
  // a: Mining pod
  `
 yyyy
yYYYYy
yYrrYy
 yyyy
 yYYy
  rr
`,
  // b: Dirt tile
  `
bbbbbb
bBBBBb
bBBBBb
bBBBBb
bBBBBb
bbbbbb
`,
  // c: Rock tile
  `
llllll
lLLLLl
lLLLLl
lLLLLl
lLLLLl
llllll
`,
  // d: Ironium
  `
 bbbb
bBBBBb
bBrrBb
bBrrBb
bBBBBb
 bbbb
`,
  // e: Goldium
  `
 yyyy
yYYYYy
yYYYYy
yYYYYy
yYYYYy
 yyyy
`,
  // f: Diamond
  `
 cccc
cCCCCc
cCCCCc
cCCCCc
cCCCCc
 cccc
`,
  // g: Building
  `
 llll
lLLLLl
lLyyLl
lLyyLl
lLLLLl
llllll
`,
  // h: Fuel station
  `
 rrrr
rRRRRr
rRyyRr
rRyyRr
rRRRRr
rrrrrr
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
const WORLD_WIDTH = 25;
const WORLD_HEIGHT = 100;
const TILE_SIZE = 6;
const SURFACE_Y = 3;

// Tile types
const TILE_EMPTY = 0;
const TILE_DIRT = 1;
const TILE_ROCK = 2;
const TILE_IRON = 3;
const TILE_GOLD = 4;
const TILE_DIAMOND = 5;

// Mineral values
const MINERAL_VALUES = {
  [TILE_IRON]: 30,
  [TILE_GOLD]: 250,
  [TILE_DIAMOND]: 5000
};

// Game state
let player;
let world;
let fuel;
let maxFuel;
let money;
let cargo;
let cargoMax;
let drillLevel;
let fuelLevel;
let cargoLevel;
let depth;
let cameraY;
let drilling;
let drillTimer;
let atSurface;
let showShop;
let showSell;

// Expose for testing
window.gameState = {
  fuel: 0,
  money: 0,
  depth: 0,
  cargo: 0
};

function generateWorld() {
  world = [];
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    world[y] = [];
    for (let x = 0; x < WORLD_WIDTH; x++) {
      if (y < SURFACE_Y) {
        world[y][x] = TILE_EMPTY;
      } else {
        // Generate terrain based on depth
        const r = rnd();
        const depthFactor = y / WORLD_HEIGHT;

        if (r < 0.03 + depthFactor * 0.02) {
          // Diamond - rare, increases with depth
          if (y > 50 && rnd() < 0.3) {
            world[y][x] = TILE_DIAMOND;
          } else if (y > 20 && rnd() < 0.5) {
            world[y][x] = TILE_GOLD;
          } else {
            world[y][x] = TILE_IRON;
          }
        } else if (r < 0.2 + depthFactor * 0.3) {
          world[y][x] = TILE_ROCK;
        } else {
          world[y][x] = TILE_DIRT;
        }
      }
    }
  }

  // Clear starting area
  for (let x = 10; x < 15; x++) {
    world[SURFACE_Y][x] = TILE_EMPTY;
  }
}

function getTile(x, y) {
  if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) {
    return TILE_ROCK; // Boundaries are solid
  }
  return world[y][x];
}

function setTile(x, y, type) {
  if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
    world[y][x] = type;
  }
}

function canMoveTo(x, y) {
  return getTile(x, y) === TILE_EMPTY;
}

function update() {
  // Initialize
  if (!ticks) {
    generateWorld();
    player = {
      x: 12,
      y: SURFACE_Y - 1,
      vx: 0,
      vy: 0
    };
    fuel = 10;
    maxFuel = 10;
    money = 0;
    cargo = [];
    cargoMax = 7;
    drillLevel = 0;
    fuelLevel = 0;
    cargoLevel = 0;
    cameraY = 0;
    drilling = false;
    drillTimer = 0;
    showShop = false;
    showSell = false;
  }

  // Calculate depth and surface status
  depth = Math.max(0, (player.y - SURFACE_Y) * 10);
  atSurface = player.y < SURFACE_Y + 2;

  // Update game state for testing
  window.gameState = {
    fuel: floor(fuel),
    maxFuel: maxFuel,
    money: money,
    depth: depth,
    cargo: cargo.length,
    cargoMax: cargoMax,
    atSurface: atSurface
  };

  // Draw sky
  color("cyan");
  rect(0, 0, 150, (SURFACE_Y * TILE_SIZE) - cameraY + 10);

  // Draw surface buildings
  const buildingY = (SURFACE_Y - 1) * TILE_SIZE - cameraY;
  if (buildingY > -10 && buildingY < 160) {
    color("red");
    char("h", 3 * TILE_SIZE, buildingY); // Fuel station
    color("yellow");
    char("g", 8 * TILE_SIZE, buildingY); // Shop
    color("green");
    char("g", 18 * TILE_SIZE, buildingY); // Sell station
  }

  // Draw ground surface line
  color("green");
  rect(0, SURFACE_Y * TILE_SIZE - cameraY, 150, 2);

  // Draw visible world tiles
  const startY = floor(cameraY / TILE_SIZE);
  const endY = startY + 30;

  for (let y = Math.max(SURFACE_Y, startY); y < Math.min(WORLD_HEIGHT, endY); y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const tile = world[y][x];
      const screenX = x * TILE_SIZE;
      const screenY = y * TILE_SIZE - cameraY;

      if (screenY < -10 || screenY > 160) continue;

      switch (tile) {
        case TILE_DIRT:
          color("light_red");
          box(screenX + 3, screenY + 3, TILE_SIZE, TILE_SIZE);
          break;
        case TILE_ROCK:
          color("light_black");
          box(screenX + 3, screenY + 3, TILE_SIZE, TILE_SIZE);
          break;
        case TILE_IRON:
          color("light_red");
          box(screenX + 3, screenY + 3, TILE_SIZE, TILE_SIZE);
          color("red");
          box(screenX + 3, screenY + 3, 3, 3);
          break;
        case TILE_GOLD:
          color("light_red");
          box(screenX + 3, screenY + 3, TILE_SIZE, TILE_SIZE);
          color("yellow");
          box(screenX + 3, screenY + 3, 3, 3);
          break;
        case TILE_DIAMOND:
          color("light_red");
          box(screenX + 3, screenY + 3, TILE_SIZE, TILE_SIZE);
          color("cyan");
          box(screenX + 3, screenY + 3, 3, 3);
          break;
      }
    }
  }

  // UI menus
  if (showShop) {
    drawShop();
    return;
  }
  if (showSell) {
    drawSell();
    return;
  }

  // Player input
  const drillSpeed = 0.5 + drillLevel * 0.25;

  if (!drilling) {
    // Horizontal movement
    if (keyboard.code["ArrowLeft"].isPressed || keyboard.code["KeyA"].isPressed) {
      const newX = player.x - 1;
      const tile = getTile(newX, player.y);
      if (tile === TILE_EMPTY) {
        player.x = newX;
        fuel -= 0.02;
      } else if (tile !== TILE_ROCK || drillLevel > 0) {
        // Start drilling sideways
        drilling = { x: newX, y: player.y };
        drillTimer = tile === TILE_ROCK ? 1.5 / drillSpeed : 1.0 / drillSpeed;
        fuel -= 0.04;
      }
    } else if (keyboard.code["ArrowRight"].isPressed || keyboard.code["KeyD"].isPressed) {
      const newX = player.x + 1;
      const tile = getTile(newX, player.y);
      if (tile === TILE_EMPTY) {
        player.x = newX;
        fuel -= 0.02;
      } else if (tile !== TILE_ROCK || drillLevel > 0) {
        drilling = { x: newX, y: player.y };
        drillTimer = tile === TILE_ROCK ? 1.5 / drillSpeed : 1.0 / drillSpeed;
        fuel -= 0.04;
      }
    }

    // Drilling down
    if (keyboard.code["ArrowDown"].isPressed || keyboard.code["KeyS"].isPressed) {
      const newY = player.y + 1;
      const tile = getTile(player.x, newY);
      if (tile === TILE_EMPTY) {
        player.y = newY;
      } else if (tile !== TILE_ROCK || drillLevel > 0) {
        drilling = { x: player.x, y: newY };
        drillTimer = tile === TILE_ROCK ? 1.5 / drillSpeed : 1.0 / drillSpeed;
        fuel -= 0.03;
      }
    }

    // Flying up
    if ((keyboard.code["ArrowUp"].isPressed || keyboard.code["KeyW"].isPressed ||
         keyboard.code["KeyZ"].isPressed) && fuel > 0) {
      const newY = player.y - 1;
      if (canMoveTo(player.x, newY)) {
        player.y = newY;
        fuel -= 0.05;
        play("select");
      } else if (getTile(player.x, newY) !== TILE_ROCK) {
        // Drill up
        drilling = { x: player.x, y: newY };
        drillTimer = 1.5 / drillSpeed;
        fuel -= 0.06;
      }
    }

    // Gravity - fall if empty below
    if (getTile(player.x, player.y + 1) === TILE_EMPTY && !keyboard.code["KeyZ"].isPressed &&
        !keyboard.code["ArrowUp"].isPressed && !keyboard.code["KeyW"].isPressed) {
      player.y += 1;
    }

    // Interact with buildings
    if ((keyboard.code["KeyX"].isJustPressed || keyboard.code["Space"].isJustPressed) && atSurface) {
      // Fuel station (x around 3)
      if (player.x >= 1 && player.x <= 5) {
        const fuelNeeded = maxFuel - fuel;
        const cost = floor(fuelNeeded * 2);
        if (money >= cost && fuelNeeded > 0) {
          money -= cost;
          fuel = maxFuel;
          play("powerUp");
        }
      }
      // Shop (x around 8)
      if (player.x >= 6 && player.x <= 10) {
        showShop = true;
      }
      // Sell station (x around 18)
      if (player.x >= 16 && player.x <= 20) {
        showSell = true;
      }
    }
  } else {
    // Drilling in progress
    drillTimer -= 1 / 60;
    if (drillTimer <= 0) {
      const tile = getTile(drilling.x, drilling.y);
      // Collect mineral
      if (tile >= TILE_IRON && cargo.length < cargoMax) {
        cargo.push(tile);
        play("coin");
      }
      setTile(drilling.x, drilling.y, TILE_EMPTY);
      player.x = drilling.x;
      player.y = drilling.y;
      drilling = false;
      play("hit");
    }
  }

  // Camera follow
  const targetCameraY = player.y * TILE_SIZE - 75;
  cameraY = cameraY * 0.9 + targetCameraY * 0.1;
  cameraY = Math.max(0, cameraY);

  // Draw player
  const playerScreenX = player.x * TILE_SIZE;
  const playerScreenY = player.y * TILE_SIZE - cameraY;
  color("yellow");
  char("a", playerScreenX + 3, playerScreenY + 3);

  // Drill effect
  if (drilling) {
    color("light_yellow");
    particle(
      drilling.x * TILE_SIZE + 3,
      drilling.y * TILE_SIZE - cameraY + 3,
      { count: 2, speed: 1 }
    );
  }

  // Fuel depletion check
  fuel = Math.max(0, fuel);
  if (fuel <= 0 && !atSurface) {
    // Stranded!
    color("red");
    text("STRANDED!", 50, 75);
    text("No Fuel!", 55, 85);
    if (ticks % 120 < 60) {
      end("Ran out of fuel!");
    }
  }

  // HUD
  color("white");
  text(`$${money}`, 3, 10);
  text(`Depth:${depth}ft`, 3, 140);

  // Fuel bar
  color("black");
  rect(100, 3, 45, 8);
  color(fuel / maxFuel < 0.2 ? "red" : "green");
  rect(101, 4, 43 * (fuel / maxFuel), 6);
  color("white");
  text(`F:${floor(fuel)}`, 105, 10);

  // Cargo indicator
  color("white");
  text(`Cargo:${cargo.length}/${cargoMax}`, 70, 140);
}

function drawShop() {
  color("black");
  rect(10, 20, 130, 110);
  color("yellow");
  text("MARS SHOP", 50, 30);
  color("white");
  text(`Cash: $${money}`, 20, 45);

  const upgradeCosts = [750, 2000, 5000, 20000];

  // Drill upgrade
  const drillCost = drillLevel < 4 ? upgradeCosts[drillLevel] : "MAX";
  color(drillLevel < 4 && money >= upgradeCosts[drillLevel] ? "cyan" : "light_black");
  text(`[1] Drill Lv${drillLevel} $${drillCost}`, 20, 60);

  // Fuel upgrade
  const fuelCost = fuelLevel < 4 ? upgradeCosts[fuelLevel] : "MAX";
  color(fuelLevel < 4 && money >= upgradeCosts[fuelLevel] ? "cyan" : "light_black");
  text(`[2] Fuel Lv${fuelLevel} $${fuelCost}`, 20, 75);

  // Cargo upgrade
  const cargoCost = cargoLevel < 4 ? upgradeCosts[cargoLevel] : "MAX";
  color(cargoLevel < 4 && money >= upgradeCosts[cargoLevel] ? "cyan" : "light_black");
  text(`[3] Cargo Lv${cargoLevel} $${cargoCost}`, 20, 90);

  color("light_black");
  text("[X] Close", 20, 115);

  // Purchase handling
  if (keyboard.code["Digit1"].isJustPressed && drillLevel < 4 && money >= upgradeCosts[drillLevel]) {
    money -= upgradeCosts[drillLevel];
    drillLevel++;
    play("powerUp");
  }
  if (keyboard.code["Digit2"].isJustPressed && fuelLevel < 4 && money >= upgradeCosts[fuelLevel]) {
    money -= upgradeCosts[fuelLevel];
    fuelLevel++;
    maxFuel = 10 + fuelLevel * 15;
    play("powerUp");
  }
  if (keyboard.code["Digit3"].isJustPressed && cargoLevel < 4 && money >= upgradeCosts[cargoLevel]) {
    money -= upgradeCosts[cargoLevel];
    cargoLevel++;
    cargoMax = 7 + cargoLevel * 5;
    play("powerUp");
  }
  if (keyboard.code["KeyX"].isJustPressed || keyboard.code["Escape"].isJustPressed) {
    showShop = false;
  }
}

function drawSell() {
  color("black");
  rect(10, 20, 130, 110);
  color("green");
  text("SELL MINERALS", 40, 30);

  let totalValue = 0;
  const mineralCounts = {};

  for (const m of cargo) {
    mineralCounts[m] = (mineralCounts[m] || 0) + 1;
    totalValue += MINERAL_VALUES[m] || 0;
  }

  let yPos = 50;
  color("white");
  if (mineralCounts[TILE_IRON]) {
    text(`Iron x${mineralCounts[TILE_IRON]} = $${mineralCounts[TILE_IRON] * 30}`, 20, yPos);
    yPos += 12;
  }
  if (mineralCounts[TILE_GOLD]) {
    text(`Gold x${mineralCounts[TILE_GOLD]} = $${mineralCounts[TILE_GOLD] * 250}`, 20, yPos);
    yPos += 12;
  }
  if (mineralCounts[TILE_DIAMOND]) {
    text(`Diamond x${mineralCounts[TILE_DIAMOND]} = $${mineralCounts[TILE_DIAMOND] * 5000}`, 20, yPos);
    yPos += 12;
  }

  color("yellow");
  text(`TOTAL: $${totalValue}`, 20, 100);

  color("cyan");
  text("[Z] Sell All", 20, 115);
  color("light_black");
  text("[X] Close", 80, 115);

  if (keyboard.code["KeyZ"].isJustPressed && cargo.length > 0) {
    money += totalValue;
    cargo = [];
    addScore(totalValue, 75, 75);
    play("coin");
    showSell = false;
  }
  if (keyboard.code["KeyX"].isJustPressed || keyboard.code["Escape"].isJustPressed) {
    showSell = false;
  }
}

// Initialize crisp-game-lib
addEventListener("load", onLoad);
