import { test } from '@playwright/test';
const BASE = 'http://localhost:3000';

async function login(page) {
  await page.goto(`${BASE}/index.html`);
  await page.waitForSelector('#login-username', { timeout: 8000 });
  await page.fill('#login-username', 'admin');
  await page.fill('#login-password', 'admin123');
  await page.click('#login-btn');
  await page.waitForTimeout(1500);
}

test('UI Audit - All M01 screens', async ({ page }) => {
  page.setViewportSize({ width: 1440, height: 900 });
  await login(page);

  const screens = ['dashboard', 'users', 'groups', 'permissions', 'organizations', 'password', 'sessions', 'login-log', 'totp', 'register'];
  let totalIssues = 0;

  for (const s of screens) {
    await page.goto(`${BASE}/index.html#${s}`);
    await page.waitForTimeout(800);

    // Check all buttons for visual issues
    const btns = await page.$$eval('button, .btn, a.btn, input[type="submit"]', els => els.map((el) => {
      const r = el.getBoundingClientRect();
      const text = el.textContent?.trim().slice(0, 20) || '';
      return { text, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), overflow: el.scrollWidth > r.width + 2, visible: r.width > 0 && r.height > 0 };
    }));

    const forms = await page.$$eval('.form-control, input, select, textarea', els => els.map(el => {
      const r = el.getBoundingClientRect();
      return { id: el.id || '', w: Math.round(r.width), visible: r.width > 0 };
    }));

    const scrollX = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 2);

    const outOfView = await page.$$eval('*', els => {
      return els.filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.right > window.innerWidth + 10 || r.x < -10);
      }).slice(0, 3).map(el => ({ tag: el.tagName, x: Math.round(el.getBoundingClientRect().x), right: Math.round(el.getBoundingClientRect().right), winW: window.innerWidth }));
    });

    const issues = [];
    for (const b of btns) {
      if (b.overflow && b.visible) issues.push(`BTN '${b.text}' overflow @${b.x},${b.y}`);
      if (b.w < 20 && b.visible) issues.push(`BTN '${b.text}' narrow (${b.w}px)`);
    }
    for (const f of forms) {
      if (f.w < 50 && f.visible) issues.push(`${f.id} narrow (${f.w}px)`);
    }
    if (scrollX) issues.push('HORIZONTAL SCROLL');
    if (outOfView.length > 0) issues.push(`OUT-OF-VIEW: ${outOfView.map(o => `${o.tag}@${o.x}>${o.winW}`).join(',')}`);

    const vbtns = btns.filter(b => b.visible);
    console.log(`[${s}] visible_btns=${vbtns.length} forms=${forms.filter(f=>f.visible).length} issues=${issues.length}${issues.length>0?' ⚠️ '+issues.join(' | '):' ✅'}`);
    totalIssues += issues.length;
  }
  console.log(`\nTOTAL issues: ${totalIssues}`);
});
