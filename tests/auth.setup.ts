import { test as setup, expect } from '@playwright/test';

const authFileAdmin = 'playwright/.auth/admin.json';
const authFileOps = 'playwright/.auth/ops.json';
const authFilePro = 'playwright/.auth/pro.json';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@demo.crm');
  await page.fill('input[name="password"]', 'Passw0rd!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: authFileAdmin });
});

setup('authenticate as ops manager', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'ops@demo.crm');
  await page.fill('input[name="password"]', 'Passw0rd!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: authFileOps });
});

setup('authenticate as pro agent', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'ahmed.pro@demo.crm');
  await page.fill('input[name="password"]', 'Passw0rd!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: authFilePro });
});
