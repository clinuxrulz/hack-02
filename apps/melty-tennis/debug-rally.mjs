import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: false,
  devtools: true,
  executablePath: '/usr/bin/google-chrome'
});
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();

let rallyCount = 0;
let maxRally = 0;
let p0Score = 0;
let p1Score = 0;

page.on('console', msg => {
  const text = msg.text();
  // Count individual bounces
  if (text.includes('Bounce on P')) {
    rallyCount++;
    console.log(`Bounce: ${rallyCount}`);
  }
  if (text.includes('double bounce')) {
    if (rallyCount > maxRally) maxRally = rallyCount;
    console.log(`RALLY END (${rallyCount} bounces): P0=${p0Score}, P1=${p1Score}, max=${maxRally}`);
  }
  if (text.includes('Point to P0')) {
    p0Score++;
    rallyCount = 0;
    console.log(`*** POINT P0! (total: ${p0Score})`);
  }
  if (text.includes('Point to P1')) {
    p1Score++;
    rallyCount = 0;
    console.log(`*** POINT P1! (total: ${p1Score})`);
  }
});

console.log('Navigating...');
await page.goto('http://localhost:3000');
await page.waitForTimeout(2000);

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

console.log('Watching for rallies...');
await page.waitForTimeout(30000);

console.log(`\n=== RESULTS ===`);
console.log(`Max rally in a point: ${maxRally}`);
console.log(`Final score: P0=${p0Score}, P1=${p1Score}`);

await browser.close();