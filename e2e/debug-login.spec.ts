import { test } from '@playwright/test';

test('DEBUG: Check error display', async ({ page }) => {
  await page.goto('http://localhost:3000/index.html');
  await page.waitForSelector('#login-username');
  await page.fill('#login-username', 'admin');
  await page.fill('#login-password', 'WRONG_PASSWORD');
  
  // Listen for console messages
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  
  await page.click('#login-btn');
  await page.waitForTimeout(2000);

  // Check DOM state
  const errHtml = await page.locator('#login-error').evaluate(el => {
    return JSON.stringify({
      outerHTML: el.outerHTML,
      display: window.getComputedStyle(el).display,
      text: el.textContent,
      offsetHeight: el.offsetHeight
    });
  });
  console.log('#login-error state:', errHtml);
  
  // Check if AUTH.login exists
  const authExists = await page.evaluate(() => typeof AUTH !== 'undefined');
  console.log('AUTH exists:', authExists);
  
  // Check current hash
  const hash = await page.evaluate(() => window.location.hash);
  console.log('Current hash:', hash);
  
  await page.screenshot({ path: 'docs/modules/M01-user-management/screenshots/debug-error.png', fullPage: true });
});
