const { chromium } = require('playwright');
const path = require('path');

async function test() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--use-gl=angle', '--use-angle=swiftshader']
    });
    const page = await browser.newPage();

    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('console', msg => console.log('CONSOLE:', msg.text()));

    await page.goto(`file://${path.join(__dirname, 'index.html')}`);
    await new Promise(r => setTimeout(r, 3000));

    const result = await page.evaluate(() => {
        return {
            hasHarness: typeof window.harness !== 'undefined',
            harnessFuncs: window.harness ? Object.keys(window.harness) : [],
            hasLittleJS: typeof engineInit !== 'undefined'
        };
    });

    console.log('Result:', JSON.stringify(result, null, 2));
    await browser.close();
}

test().catch(console.error);
