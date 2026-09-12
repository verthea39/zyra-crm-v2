import { test, expect } from '@playwright/test';

test.describe('Executive Cash Flow Cockpit - Functional Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finance/cockpit');
  });

  test('should render the cockpit header and corporate tax standard tag', async ({ page }) => {
    await expect(page.locator('text=AED Live Finance')).toBeVisible();
    await expect(page.locator('text=Dubai Corporate Standard')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('Executive Cash Flow Cockpit');
  });

  test('should accurately display the 5 primary financial KPI cards', async ({ page }) => {
    await expect(page.locator('text=Revenue (Billed)')).toBeVisible();
    await expect(page.locator('text=Total Expenses')).toBeVisible();
    await expect(page.locator('text=Net Profit')).toBeVisible();
    await expect(page.locator('text=Receivables (AR)')).toBeVisible();
    await expect(page.locator('text=Payables (AP)')).toBeVisible();
  });

  test('should open Add Income modal and compute balance dynamically', async ({ page }) => {
    // Click the top green + Add Income button
    await page.getByRole('button', { name: '+ Add Income' }).first().click();

    // Verify modal appears
    await expect(page.locator('h2')).toHaveText('Record New Income');

    // Fill Total and Paid amounts
    await page.locator('input[placeholder="0.00"]').first().fill('5000');
    await page.locator('input[placeholder="0.00"]').nth(1).fill('2000');

    // Verify dynamic balance preview reflects AED 3,000.00
    await expect(page.locator('text=AED 3000.00')).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('h2')).not.toBeVisible();
  });

  test('should toggle between Ledger and Clients Directory views', async ({ page }) => {
    // Switch to Clients Directory
    await page.getByRole('button', { name: /Clients Directory/i }).first().click();
    await expect(page.locator('text=Clients & Counterparties Directory')).toBeVisible();

    // Switch back to Ledger
    await page.getByRole('button', { name: /Transactions Ledger/i }).first().click();
    await expect(page.locator('text=Latest / last added records first by default')).toBeVisible();
  });

  test('should filter ledger entries by status pills', async ({ page }) => {
    // Click 'Pending' filter
    await page.getByRole('button', { name: 'pending', exact: true }).click();
    
    // Validate table only displays Pending status badges
    const statusBadges = page.locator('table tbody tr');
    await expect(statusBadges.first()).toContainText('Pending');
  });
});
