// Capture screenshots of dashboard + superadmin by injecting demo session
const { chromium } = require('/home/z/.npm-global/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const DEMO_PROFILE = {
  uid: 'demo-super',
  email: 'superadmin@demo.devforge',
  name: 'Demo Superadmin',
  role: 'superadmin',
  isDemo: true,
};

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });

  // Add init script to set localStorage BEFORE the page loads
  await context.addInitScript((profile) => {
    try {
      localStorage.setItem('devforge:demo-session', JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to set localStorage:', e);
    }
  }, DEMO_PROFILE);

  const page = await context.newPage();

  // Capture home
  console.log('→ Capturing home...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/z/my-project/download/devforge-home.png', fullPage: false });
  console.log('  ✓ home captured');

  // Capture dashboard (will require clicking login → demo superadmin OR setView)
  // Since the app uses internal state-based routing, we need to click the demo button
  console.log('→ Navigating to login + clicking demo superadmin...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Click "Login" button in navbar
  const loginBtn = await page.$('button:has-text("Login")');
  if (loginBtn) {
    await loginBtn.click();
    await page.waitForTimeout(1500);
  }

  // Click "Demo Superadmin" button
  const demoBtn = await page.$('button:has-text("Demo Superadmin")');
  if (demoBtn) {
    await demoBtn.click();
    await page.waitForTimeout(2500);
  }

  await page.screenshot({ path: '/home/z/my-project/download/devforge-superadmin.png', fullPage: false });
  console.log('  ✓ superadmin captured');

  // Click "Dashboard" in navbar (if visible) to switch to dashboard view
  const dashBtn = await page.$('button:has-text("Dashboard")');
  if (dashBtn) {
    await dashBtn.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: '/home/z/my-project/download/devforge-dashboard.png', fullPage: false });
  console.log('  ✓ dashboard captured');

  await browser.close();
  console.log('All screenshots saved to /home/z/my-project/download/');
})().catch((e) => {
  console.error('Failed:', e);
  process.exit(1);
});
