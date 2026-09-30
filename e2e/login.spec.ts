import { test, expect } from '@playwright/test';

test('opens Today directly without an account and keeps navigation account-free', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', {name:'Make today meaningful.'})).toBeVisible();
  await expect(page.getByRole('textbox',{name:'Email',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Back to sign in'})).toHaveCount(0);
  await page.getByRole('button',{name:'Go to Calendar',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Calendar',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Back to sign in'})).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading',{name:'Make today meaningful.'})).toBeVisible();
  expect(errors).toEqual([]);
});
for (const width of [320,375,414,768]) test(`direct entry fits ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:600});
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Make today meaningful.'})).toBeVisible();
  await expect(page.getByTestId('navigation-bottom')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
