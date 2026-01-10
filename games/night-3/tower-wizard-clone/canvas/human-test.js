const { chromium } = require('playwright');
const fs = require('fs');

const ITERATION = process.argv[2] || '01';
const DIR = `/workspace/screenshots/agent-5/tower-wizard-canvas/iter-${ITERATION}`;

async function test() {
    fs.mkdirSync(DIR, { recursive: true });
    const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader'] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    await page.goto('file:///workspace/games/night-3/tower-wizard-clone/canvas/index.html');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${DIR}/00s.png` });
    console.log('Captured 00s.png');

    for (let i = 0; i < 30; i++) {
        // Click various buttons (idle game)
        // Tab buttons at bottom
        const tabs = ['Orb', 'Study', 'Forest', 'Prestige', 'Academy', 'Dragon', 'Alchemy', 'Sorcery', 'Runes'];
        const tab = tabs[Math.floor(Math.random() * tabs.length)];
        await page.click(`text=${tab}`).catch(() => {});
        await page.waitForTimeout(500);
        // Click upgrade buttons
        await page.click('text=Assign +1').catch(() => {});
        await page.waitForTimeout(300);
        await page.click('text=Summon Spirit').catch(() => {});
        await page.waitForTimeout(300);
        if (i % 10 === 0 && i > 0) {
            await page.screenshot({ path: `${DIR}/${i * 2}s.png` });
            console.log(`Captured ${i * 2}s.png`);
        }
        await page.waitForTimeout(1700);
    }

    await page.screenshot({ path: `${DIR}/60s-final.png` });
    await page.screenshot({ path: '/workspace/games/night-3/tower-wizard-clone/canvas/screenshot.png' });
    console.log('Done!');
    await browser.close();
}
test().catch(console.error);
