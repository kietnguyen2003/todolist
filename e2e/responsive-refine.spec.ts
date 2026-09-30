import { expect, test } from '@playwright/test';

for (const width of [375, 390, 430, 768]) {
  test(`Today, task form and Calendar fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Một ngày có ý nghĩa.' })).toBeVisible();
    await expect(page.getByTestId('navigation-bottom')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.getByRole('button', { name: 'Thêm công việc', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Thêm công việc', exact: true })).toBeVisible();
    const form = page.getByRole('heading', { name: 'Thêm công việc', exact: true });
    const bounds = await form.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await page.getByRole('radio', { name: 'Có giờ', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Tạo công việc' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.getByRole('button', { name: 'Đóng thêm công việc' }).click();
    await page.getByRole('button', { name: 'Đi đến Lịch' }).click();
    await expect(page.getByRole('heading', { name: 'Lịch', exact: true })).toBeVisible();
    await expect(page.getByTestId('navigation-bottom')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}
