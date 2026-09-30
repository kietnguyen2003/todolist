import { expect, test } from '@playwright/test';

for (const width of [375, 390, 430, 768]) {
  test(`Today, task form and Calendar fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Make today meaningful.' })).toBeVisible();
    await expect(page.getByTestId('navigation-bottom')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Add task', exact: true })).toBeVisible();
    const form = page.getByRole('heading', { name: 'Add task', exact: true });
    const bounds = await form.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await page.getByRole('radio', { name: 'Set time', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Create task' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.getByRole('button', { name: 'Close task form' }).click();
    await page.getByRole('button', { name: 'Go to Calendar' }).click();
    await expect(page.getByRole('heading', { name: 'Calendar', exact: true })).toBeVisible();
    await expect(page.getByTestId('navigation-bottom')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}
