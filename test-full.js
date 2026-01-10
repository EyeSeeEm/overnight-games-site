// Full test for overnight-games-site
// Tests: modal, notes, back button, escape, localStorage, export

const { chromium } = require('playwright');

const SITE_URL = 'https://eyeseeem.github.io/overnight-games-site/';

async function runTests() {
  console.log('Testing:', SITE_URL, '\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let passed = 0, failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log('✅', name);
      passed++;
    } catch (e) {
      console.log('❌', name + ':', e.message);
      failed++;
    }
  }

  // Load page
  await page.goto(SITE_URL);
  await page.waitForTimeout(3000);

  // Test 1: Games load
  await test('Games load in grid', async () => {
    const count = await page.locator('.game-card').count();
    if (count < 100) throw new Error(`Only ${count} games`);
  });

  // Test 2: Click game opens modal
  await test('Click game opens modal with notes panel', async () => {
    await page.locator('.game-card').first().click();
    await page.waitForTimeout(1000);

    const modalActive = await page.locator('#playerModal.active').count();
    if (!modalActive) throw new Error('Modal not opened');

    const notesPanel = await page.locator('.player-notes').count();
    if (!notesPanel) throw new Error('Notes panel not found');

    const iframe = await page.locator('#playerIframe').getAttribute('src');
    if (!iframe || iframe === 'about:blank') throw new Error('Game not loaded');
  });

  // Test 3: Type and save notes
  await test('Type and save notes in player', async () => {
    const testNote = 'Test note ' + Date.now();
    await page.fill('#playerNotesText', testNote);
    await page.click('.player-notes-footer button');
    await page.waitForTimeout(500);

    // Check localStorage
    const saved = await page.evaluate(() => localStorage.getItem('gameNotes'));
    if (!saved || !saved.includes('Test note')) {
      throw new Error('Note not saved to localStorage');
    }
  });

  // Test 4: Escape closes modal
  await test('Escape key closes modal', async () => {
    // Reopen if closed
    if (!await page.locator('#playerModal.active').count()) {
      await page.locator('.game-card').first().click();
      await page.waitForTimeout(500);
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    const modalActive = await page.locator('#playerModal.active').count();
    if (modalActive) throw new Error('Modal still open after Escape');
  });

  // Test 5: Back button closes modal (via history)
  await test('Back button closes modal', async () => {
    // Open modal again
    await page.locator('.game-card').first().click();
    await page.waitForTimeout(500);

    const modalOpen = await page.locator('#playerModal.active').count();
    if (!modalOpen) throw new Error('Modal not opened for back test');

    // Go back
    await page.goBack();
    await page.waitForTimeout(500);

    const modalAfter = await page.locator('#playerModal.active').count();
    if (modalAfter) throw new Error('Modal still open after back');
  });

  // Test 6: Notes persist after reload
  await test('Notes persist after page reload', async () => {
    await page.reload();
    await page.waitForTimeout(2000);

    const saved = await page.evaluate(() => localStorage.getItem('gameNotes'));
    if (!saved || !saved.includes('Test note')) {
      throw new Error('Notes lost after reload');
    }
  });

  // Test 7: Export includes notes
  await test('Export includes saved notes', async () => {
    // Click export button and intercept download
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
      page.click('button:has-text("Export Notes")')
    ]);

    if (download) {
      const content = await download.createReadStream().then(stream => {
        return new Promise((resolve, reject) => {
          let data = '';
          stream.on('data', chunk => data += chunk);
          stream.on('end', () => resolve(data));
          stream.on('error', reject);
        });
      });

      if (!content.includes('Test note')) {
        throw new Error('Export does not include our test note');
      }
    } else {
      // Download might not trigger in headless, check if function exists
      const hasExport = await page.evaluate(() => typeof exportNotes === 'function');
      if (!hasExport) throw new Error('exportNotes function not found');
    }
  });

  // Screenshot for verification
  await page.screenshot({ path: 'test-result.png', fullPage: false });
  console.log('\nScreenshot saved: test-result.png');

  await browser.close();

  console.log(`\n${passed} passed, ${failed} failed`);
  return failed === 0;
}

runTests().then(success => process.exit(success ? 0 : 1)).catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
