import { expect, test } from '@playwright/test';

test('habits are managed on Habits while To do only updates progress', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-02T10:00:00+07:00') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Add habit' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Go to Habits' }).click();
  await expect(page.getByRole('heading', { name: 'Habits' })).toBeVisible();
  await page.getByRole('button', { name: 'Add habit' }).click();
  const name = page.getByRole('textbox', { name: 'Habit name' });
  expect(await name.evaluate(input => parseFloat(getComputedStyle(input).fontSize))).toBeGreaterThanOrEqual(16);
  await name.fill('Read');
  await page.getByRole('button', { name: 'Create habit' }).click();

  await expect(page.getByTestId('managed-habit-Read')).toBeVisible();
  await page.getByRole('button', { name: 'Go to To do' }).click();
  await page.getByRole('button', { name: 'Increase Read' }).click();
  await expect(page.getByText('✓ Complete', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Manage Read' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add habit' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Go to Habits' }).click();
  await page.getByRole('button', { name: 'Edit Read' }).click();
  await expect(page.getByRole('heading', { name: 'Edit habit' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Habit name' }).fill('Read books');
  await page.getByRole('spinbutton', { name: 'Daily target' }).press('ArrowUp');
  await page.getByRole('button', { name: 'Save habit' }).click();
  await page.getByRole('button', { name: 'Go to To do' }).click();
  await expect(page.getByText('Read books', { exact: true })).toBeVisible();
  await expect(page.getByText('1 / 2 liters', { exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Go to Habits' }).click();
  await expect(page.getByText('Read books', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Delete Read books' }).click();
  await expect(page.getByText('Delete Read books?')).toBeVisible();
  await page.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(page.getByTestId('managed-habit-Read books')).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Go to Habits' }).click();
  await expect(page.getByText('Read books', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Go to Tracker' }).click();
  await expect(page.getByText('Read books', { exact: true })).toHaveCount(0);
});

for (const width of [320, 1280]) {
  test(`Habits page fits ${width}px and keeps navigation in place`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Go to Habits' }).click();
    await expect(page.getByRole('heading', { name: 'Habits' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add habit' })).toBeVisible();
    await expect(page.getByTestId(width >= 900 ? 'navigation-top' : 'navigation-bottom')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
