import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: false,
  devtools: true,
  executablePath: '/usr/bin/google-chrome'
});
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();

let lastLog = '';

page.on('console', msg => {
  const text = msg.text();
  // Filter for important messages
  if (text.includes('serve') || text.includes('Serve') || text.includes('phase') || 
      text.includes('ball') || text.includes('Ball') || text.includes('reset') ||
      text.includes('POINT') || text.includes('double') || text.includes('Bounce')) {
    console.log(text);
    lastLog = text;
  }
});

console.log('Navigating...');
await page.goto('http://localhost:3000');
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

// Enable NN (neural networks)
console.log('Enabling NN...');
await page.evaluate(() => {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  for (const cb of checkboxes) {
    const label = cb.closest('label')?.textContent || '';
    if (label.includes('NN')) {
      cb.checked = true;
      cb.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('NN enabled');
      break;
    }
  }
});

console.log('Watching game state...');
await page.waitForTimeout(45000);

console.log('\nDone');
await browser.close();