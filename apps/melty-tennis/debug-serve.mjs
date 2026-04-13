import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: false,
  devtools: true,
  executablePath: '/usr/bin/google-chrome'
});
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();

let lastBallState = '';

page.on('console', msg => {
  const text = msg.text();
  // Only show serve/rally related messages
  if (text.includes('serve') || text.includes('Serve') || text.includes('phase') || text.includes('rally') || text.includes('Rally')) {
    console.log(text);
  }
});

page.on('console', msg => {
  const text = msg.text();
  if (!lastBallState || !text.includes(lastBallState)) {
    if (text.includes('P0') || text.includes('P1') || text.includes('ball')) {
      console.log(text.substring(0, 150));
      lastBallState = text;
    }
  }
});

console.log('Navigating...');
await page.goto('http://localhost:3001');
await page.waitForTimeout(1000);
await page.waitForTimeout(2000);

// Enable AI vs AI
console.log('Enabling AI vs AI...');
await page.evaluate(() => {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  for (const cb of checkboxes) {
    const label = cb.closest('label')?.textContent || '';
    if (label.includes('AI')) {
      cb.checked = true;
      cb.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('AI vs AI enabled');
      break;
    }
  }
});

await page.waitForTimeout(3000);
console.log('AI vs AI should be running now...');
console.log('Watch for ball movement - checking every 2 seconds...');

// Wait and check ball state periodically
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(2000);
  
  const state = await page.evaluate(() => {
    // Try to get some game state from the window
    const gameDiv = document.querySelector('#game');
    return gameDiv ? 'game div found' : 'no game div';
  });
  
  if (i % 5 === 0) {
    console.log(`Tick ${i * 2}s...`);
  }
}

console.log('\nDone watching');
await browser.close();