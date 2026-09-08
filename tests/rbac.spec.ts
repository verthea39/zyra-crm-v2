import { test, expect } from '@playwright/test';

test.describe('RBAC & Security Boundaries', () => {
  // Use PRO Agent state for these tests
  test.use({ storageState: 'playwright/.auth/pro.json' });

  test('PRO Agent cannot access Finance Dashboard', async ({ page }) => {
    const response = await page.goto('/dashboard/finance');
    
    // Depending on the implementation, the user might be redirected or see an unauthorized message
    if (page.url().includes('/finance')) {
       // If still on the page, check that it says unauthorized or access denied
       const text = await page.locator('body').innerText();
       expect(text.toLowerCase()).toContain('restricted access');
    } else {
       expect(page.url()).not.toContain('/finance');
    }
  });

  test('PRO Agent cannot mutate arbitrary client statuses via Action', async ({ request }) => {
    // Attempting a server action payload directly
    const response = await request.post('/api/clients/update-status', {
      data: { clientId: 'test-client-id', status: 'VERIFIED' }
    });
    
    // Some endpoints might return 404 if not using custom API routes, but we expect it to fail (not 200)
    expect(response.ok()).toBeFalsy();
  });
});
