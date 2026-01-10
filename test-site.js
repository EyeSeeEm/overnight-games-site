// Simple smoke tests for overnight-games-site
// Run with: node test-site.js (requires playwright)

const { chromium } = require('playwright');

const SITE_URL = process.argv[2] || 'https://eyeseeem.github.io/overnight-games-site/';

async function runTests() {
  console.log(`Testing: ${SITE_URL}\n`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (e) {
      console.log(`❌ ${name}: ${e.message}`);
      failed++;
    }
  }

  await page.goto(SITE_URL);
  await page.waitForTimeout(2000); // Wait for games to load

  // Test 1: Page loads with games
  await test('Page loads with games', async () => {
    const gameCount = await page.locator('.game-card').count();
    if (gameCount < 100) throw new Error(`Only ${gameCount} games loaded`);
  });

  // Test 2: Notes save to localStorage
  await test('Notes save to localStorage', async () => {
    // Open notes modal for first game
    await page.locator('.notes-btn').first().click();
    await page.waitForTimeout(500);

    // Type a note
    const testNote = 'Test note ' + Date.now();
    await page.fill('#notesText', testNote);
    await page.click('.notes-save');
    await page.waitForTimeout(500);

    // Check localStorage
    const savedNotes = await page.evaluate(() => localStorage.getItem('gameNotes'));
    if (!savedNotes || !savedNotes.includes('Test note')) {
      throw new Error('Note not saved to localStorage');
    }
  });

  // Test 3: Game opens in player modal
  await test('Game opens in player modal', async () => {
    await page.locator('.game-card').first().click();
    await page.waitForTimeout(1000);

    const modal = await page.locator('#playerModal.active').count();
    if (modal === 0) throw new Error('Player modal not opened');

    const iframe = await page.locator('#playerIframe').getAttribute('src');
    if (!iframe || iframe === 'about:blank') throw new Error('Game not loaded in iframe');

    await page.click('.player-close');
  });

  // Test 4: Export notes button exists
  await test('Export notes button exists', async () => {
    const exportBtn = await page.locator('button:has-text("Export Notes")').count();
    if (exportBtn === 0) throw new Error('Export button not found');
  });

  // Test 5: Filters work
  await test('Filters work', async () => {
    const initialCount = await page.locator('.game-card').count();
    await page.selectOption('#filterFramework', 'canvas');
    await page.waitForTimeout(500);
    const filteredCount = await page.locator('.game-card').count();
    if (filteredCount >= initialCount) throw new Error('Filter did not reduce count');
    await page.selectOption('#filterFramework', ''); // Reset
  });

  await browser.close();

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
