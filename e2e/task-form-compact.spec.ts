import { expect, test } from '@playwright/test';

test('timed task form stays compact and its submit action remains reachable on a small phone',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Add task'}).click();
  await page.getByRole('radio',{name:'Set time'}).click();
  const wheel=page.getByRole('spinbutton',{name:'Start hour'});
  const wheelBox=await wheel.boundingBox();
  expect(wheelBox).not.toBeNull();
  expect(wheelBox!.height).toBeLessThanOrEqual(122);
  const card=page.getByRole('heading',{name:'Add task'}).locator('xpath=../..');
  const cardBox=await card.boundingBox();
  expect(cardBox).not.toBeNull();
  expect(cardBox!.height).toBeLessThanOrEqual(720);
  await expect(page.getByRole('button',{name:'Create task'})).toBeInViewport();
  await page.setViewportSize({width:320,height:600});
  await page.getByRole('button',{name:'Create task'}).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button',{name:'Create task'})).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
