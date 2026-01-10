// Using global crisp-game-lib from CDN

// Game title
const title = "SPICE ROUTE";

// Game description
const description = "[CLICK] Select/Buy/Sell";

// Game options
const options = {
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 42
};

// Characters (simple icons)
const characters = [
  // Ship
  `
  llllll
  llLLll
 lLLLLLl
 lLLLLLl
  llllll
   llll
  `,
  // Pepper
  `
   ll
  llll
   ll
   ll
   ll
  `,
  // Coin
  `
  llll
 llllll
 ll  ll
 llllll
  llll
  `
];

// Game state
let ducats;
let yearTime;
let cargo;
let maxCargo;
let currentPort;
let selectedOption;
let orderPepper;
let orderDeadline;
let orderNum;
let pepperInHold;
let textileInHold;
let menuMode;
let msgText;
let msgTimer;

// Ports data
const ports = [
  { name: "LISBON", pBuy: 0, pSell: 25, tBuy: 10, tSell: 0 },
  { name: "CAPE VERDE", pBuy: 15, pSell: 0, tBuy: 0, tSell: 15 },
  { name: "GOLD COAST", pBuy: 12, pSell: 0, tBuy: 0, tSell: 20 },
  { name: "CALICUT", pBuy: 8, pSell: 0, tBuy: 0, tSell: 30 }
];

// Orders
const ordersData = [
  { pepper: 20, deadline: 5, reward: 200 },
  { pepper: 40, deadline: 8, reward: 350 },
  { pepper: 60, deadline: 10, reward: 500 },
  { pepper: 100, deadline: 12, reward: 800 }
];

function update() {
  if (!ticks) {
    // Initialize game state
    ducats = 500;
    yearTime = 0;
    cargo = 0;
    maxCargo = 50;
    currentPort = 0;
    selectedOption = 0;
    orderNum = 0;
    pepperInHold = 0;
    textileInHold = 0;
    menuMode = 'port';
    msgText = "";
    msgTimer = 0;
    loadNextOrder();

    // Expose for testing
    window.gameState = {
      ducats,
      year: yearTime,
      cargo,
      pepperInHold,
      textileInHold,
      currentPort: ports[currentPort].name,
      orderPepper,
      orderNum: orderNum + 1
    };
  }

  // Time passes
  if (ticks % 60 === 0 && ticks > 0) {
    yearTime += 0.25;
    if (yearTime >= orderDeadline) {
      end("ORDER FAILED!");
      return;
    }
  }

  // Update exposed state
  window.gameState = {
    ducats,
    year: Math.floor(yearTime * 10) / 10,
    cargo,
    pepperInHold,
    textileInHold,
    currentPort: ports[currentPort].name,
    orderPepper,
    orderNum: orderNum + 1
  };

  // Clear background
  color("black");
  box(50, 50, 100, 100);

  // Header: Ducats
  color("cyan");
  text(`${Math.floor(ducats)}D`, 3, 6);

  // Header: Year
  color("yellow");
  text(`YR:${yearTime.toFixed(1)}/${orderDeadline}`, 55, 6);

  // Cargo display
  color("white");
  text(`CARGO:${cargo}/${maxCargo}`, 3, 14);
  color("green");
  bar(55, 14, (cargo / maxCargo) * 40, 3);

  // Order progress
  color("light_purple");
  const delivered = Math.max(0, ordersData[orderNum].pepper - orderPepper);
  text(`ORDER ${orderNum + 1}: ${delivered}/${ordersData[orderNum].pepper}`, 3, 22);
  color("purple");
  bar(55, 22, (delivered / ordersData[orderNum].pepper) * 40, 3);

  // Message
  if (msgTimer > 0) {
    msgTimer--;
    color("yellow");
    text(msgText, 50, 32, { isCenter: true });
  }

  // Draw current mode
  if (menuMode === 'port') {
    drawPorts();
  } else {
    drawTrade();
  }

  // Location
  color("light_black");
  text(`@ ${ports[currentPort].name}`, 50, 95, { isCenter: true });
}

function drawPorts() {
  color("white");
  text("SELECT PORT:", 3, 40);

  for (let i = 0; i < ports.length; i++) {
    const p = ports[i];
    const sel = i === selectedOption;
    const cur = i === currentPort;

    color(sel ? "yellow" : (cur ? "green" : "light_blue"));
    const pre = sel ? ">" : " ";
    const suf = cur ? "*" : "";
    text(`${pre}${p.name}${suf}`, 6, 48 + i * 8);

    if (sel && !cur) {
      color("light_cyan");
      const cost = Math.abs(i - currentPort) * 20;
      text(`${cost}D`, 75, 48 + i * 8);
    }
  }

  // Handle clicks
  if (input.isJustPressed) {
    const clickY = input.pos.y;
    const clickX = input.pos.x;

    // Check if clicking on a port option
    for (let i = 0; i < ports.length; i++) {
      const optY = 48 + i * 8;
      if (clickY >= optY - 4 && clickY < optY + 6) {
        if (i === currentPort) {
          // Enter trade mode
          menuMode = 'trade';
          selectedOption = 0;
          play("select");
        } else if (selectedOption === i) {
          // Travel if selected and clicked again
          const cost = Math.abs(i - currentPort) * 20;
          if (ducats >= cost) {
            ducats -= cost;
            currentPort = i;
            yearTime += 0.5;
            play("powerUp");
            showMsg(`SAILED TO ${ports[i].name}`);
          } else {
            play("hit");
            showMsg("NEED MORE DUCATS!");
          }
        } else {
          selectedOption = i;
          play("select");
        }
        return;
      }
    }
  }

  color("light_black");
  text("CLICK PORT TO SELECT", 50, 85, { isCenter: true });
}

function drawTrade() {
  const p = ports[currentPort];

  color("white");
  text(`${p.name} MARKET`, 3, 40);

  // Holdings display
  color("light_green");
  text(`PEPPER:${pepperInHold} TEXTILE:${textileInHold}`, 3, 48);

  // Build menu options
  let opts = [];

  if (p.tBuy > 0) {
    opts.push({ t: 'buy', i: 'textile', pr: p.tBuy, l: `BUY TEXTILE (${p.tBuy}D)` });
  }
  if (p.tSell > 0 && textileInHold > 0) {
    opts.push({ t: 'sell', i: 'textile', pr: p.tSell, l: `SELL TEXTILE (+${p.tSell}D)` });
  }
  if (p.pBuy > 0) {
    opts.push({ t: 'buy', i: 'pepper', pr: p.pBuy, l: `BUY PEPPER (${p.pBuy}D)` });
  }
  if (p.pSell > 0 && pepperInHold > 0) {
    opts.push({ t: 'sell', i: 'pepper', pr: p.pSell, l: `SELL PEPPER (+${p.pSell}D)` });
  }
  if (currentPort === 0 && pepperInHold > 0 && orderPepper > 0) {
    opts.push({ t: 'deliver', l: `DELIVER (${Math.min(pepperInHold, orderPepper)})` });
  }
  opts.push({ t: 'back', l: 'BACK' });

  // Draw options
  for (let i = 0; i < opts.length; i++) {
    const o = opts[i];
    color(i === selectedOption ? "yellow" : "light_blue");
    text((i === selectedOption ? ">" : " ") + o.l, 6, 58 + i * 8);
  }

  // Handle clicks
  if (input.isJustPressed) {
    const clickY = input.pos.y;

    for (let i = 0; i < opts.length; i++) {
      const optY = 58 + i * 8;
      if (clickY >= optY - 4 && clickY < optY + 6) {
        selectedOption = i;
        const o = opts[i];

        if (o.t === 'back') {
          menuMode = 'port';
          selectedOption = currentPort;
          play("select");
        } else if (o.t === 'buy') {
          if (ducats >= o.pr && cargo < maxCargo) {
            ducats -= o.pr;
            cargo++;
            if (o.i === 'pepper') pepperInHold++;
            else textileInHold++;
            play("coin");
            showMsg(`+1 ${o.i.toUpperCase()}`);
          } else {
            play("hit");
            showMsg(cargo >= maxCargo ? "FULL!" : "NO MONEY!");
          }
        } else if (o.t === 'sell') {
          if (o.i === 'pepper' && pepperInHold > 0) {
            pepperInHold--;
            cargo--;
            ducats += o.pr;
            addScore(o.pr);
            play("coin");
            showMsg(`+${o.pr}D`);
          } else if (o.i === 'textile' && textileInHold > 0) {
            textileInHold--;
            cargo--;
            ducats += o.pr;
            addScore(o.pr);
            play("coin");
            showMsg(`+${o.pr}D`);
          }
        } else if (o.t === 'deliver') {
          const amt = Math.min(pepperInHold, orderPepper);
          pepperInHold -= amt;
          cargo -= amt;
          orderPepper -= amt;
          addScore(amt * 10);
          play("powerUp");
          showMsg(`DELIVERED ${amt}!`);

          if (orderPepper <= 0) {
            ducats += ordersData[orderNum].reward;
            addScore(ordersData[orderNum].reward);
            orderNum++;
            if (orderNum >= ordersData.length) {
              play("powerUp");
              end("VICTORY!");
            } else {
              loadNextOrder();
              showMsg(`ORDER ${orderNum + 1}!`);
            }
          }
        }
        return;
      }
    }
  }
}

function loadNextOrder() {
  if (orderNum < ordersData.length) {
    orderPepper = ordersData[orderNum].pepper;
    orderDeadline = ordersData[orderNum].deadline;
  }
}

function showMsg(m) {
  msgText = m;
  msgTimer = 60;
}

// Start the game
init({
  update,
  title,
  description,
  characters,
  options
});
