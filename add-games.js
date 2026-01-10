const fs = require('fs');
const path = require('path');
const games = JSON.parse(fs.readFileSync('games-index.json'));

// Get existing night-3 paths
const existingPaths = new Set(games.filter(g => g.night === 'night-3').map(g => g.path));

// Get all night-3 game folders with index.html
const night3Dir = 'games/night-3';
const gameNames = fs.readdirSync(night3Dir);

const newGames = [];

for (const gameName of gameNames) {
  const gameDir = path.join(night3Dir, gameName);
  if (!fs.statSync(gameDir).isDirectory()) continue;

  const frameworks = fs.readdirSync(gameDir);
  for (const fw of frameworks) {
    const fwDir = path.join(gameDir, fw);
    if (!fs.statSync(fwDir).isDirectory()) continue;

    const gamePath = fwDir.split(path.sep).join('/') + '/';
    if (existingPaths.has(gamePath)) continue;

    const indexPath = path.join(fwDir, 'index.html');
    if (!fs.existsSync(indexPath)) continue;

    const screenshotPath = path.join(fwDir, 'screenshot.png');
    const hasScreenshot = fs.existsSync(screenshotPath);

    // Create new game entry
    const newGame = {
      id: gameName + '-' + fw + '-night-3',
      night: 'night-3',
      gameDir: gameName,
      framework: fw,
      name: gameName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      genre: 'action',
      description: gameName + ' (' + fw + ')',
      polished: false,
      expanded: false,
      playable: true,
      rating: 3,
      screenshot: hasScreenshot ? 'screenshot.png' : null,
      path: gamePath,
      createdDate: '2026-01-10',
      played: false,
      playedDate: null
    };

    newGames.push(newGame);
    console.log('Adding:', gamePath, hasScreenshot ? '(has screenshot)' : '(NO screenshot)');
  }
}

// Add new games to the array
games.push(...newGames);

// Write back
fs.writeFileSync('games-index.json', JSON.stringify(games, null, 2));
console.log('\nAdded', newGames.length, 'new games');
console.log('Total games now:', games.length);
