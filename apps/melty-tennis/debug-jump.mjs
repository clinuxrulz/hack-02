import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  headless: false,
  devtools: true,
  executablePath: '/usr/bin/google-chrome'
});
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();

let jumpCount = 0;

page.on('console', msg => {
  const text = msg.text();
  if (text.includes('AUTO JUMP') || (text.includes('P0:') || text.includes('P1:'))) {
    console.log(text);
    if (text.includes('AUTO JUMP')) {
      jumpCount++;
    }
  }
});

console.log('Navigating...');
await page.goto('http://localhost:3001');
await page.waitForTimeout(3000);

// Enable AI vs AI
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

console.log('Watching for auto-jumps...');
await page.waitForTimeout(40000);

console.log(`\n=== RESULTS ===`);
console.log(`Auto-jumps detected: ${jumpCount}`);

await browser.close();