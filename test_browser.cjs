const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[CONSOLE ERROR] ${msg.text()}`);
      console.log(`[CONSOLE ERROR] ${msg.text()}`);
    } else {
      console.log(`[CONSOLE] ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    errors.push(`[PAGE ERROR] ${error.message}`);
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  try {
    console.log('Navigating to register...');
    await page.goto('http://127.0.0.1:5174/register', { waitUntil: 'networkidle2' });
    
    console.log('Registering...');
    const randomId = Math.floor(Math.random() * 1000000);
    await page.type('input[id="name"]', 'Test User');
    await page.type('input[type="email"]', `test_${randomId}@test.com`);
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    console.log('Waiting for navigation to dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    console.log('Navigating to collaborate page...');
    await page.goto('http://127.0.0.1:5174/room/7b745284/collaborate', { waitUntil: 'networkidle2' });
    
    // Wait a bit to see if any react errors pop up
    await new Promise(r => setTimeout(r, 5000));
    
    console.log('Done collecting errors.');
    console.log('Captured Errors:', errors);
  } catch (err) {
    console.error('Script failed:', err);
  } finally {
    await browser.close();
  }
})();