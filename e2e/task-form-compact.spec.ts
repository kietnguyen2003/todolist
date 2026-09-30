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

test('task name and date share two columns, with colors in two compact rows',async({page})=>{
  await page.setViewportSize({width:320,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Add task'}).click();
  const name=(await page.getByRole('textbox',{name:'Task name'}).boundingBox())!;
  const date=(await page.getByRole('textbox',{name:'Date'}).boundingBox())!;
  expect(name.x+name.width).toBeLessThanOrEqual(date.x);
  expect(Math.abs(name.y-date.y)).toBeLessThan(2);
  const navy=(await page.getByRole('button',{name:'Select navy color'}).boundingBox())!;
  const lilac=(await page.getByRole('button',{name:'Select lilac color'}).boundingBox())!;
  const teal=(await page.getByRole('button',{name:'Select teal color'}).boundingBox())!;
  expect(Math.abs(navy.y-lilac.y)).toBeLessThan(2);
  expect(teal.y).toBeGreaterThan(lilac.y);
  expect(teal.height).toBeLessThanOrEqual(38);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('duration shortcuts accumulate after the first choice and stop at midnight',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Add task'}).click();
  await page.getByRole('radio',{name:'Set time'}).click();
  const endHour=page.getByRole('spinbutton',{name:'End hour'});
  const endMinute=page.getByRole('spinbutton',{name:'End minute'});
  await page.getByRole('button',{name:'Duration 30 minutes'}).click();
  await expect(endHour).toHaveAttribute('aria-valuetext','09');
  await expect(endMinute).toHaveAttribute('aria-valuetext','30');
  await page.getByRole('button',{name:'Duration 30 minutes'}).click();
  await expect(endHour).toHaveAttribute('aria-valuetext','10');
  await expect(endMinute).toHaveAttribute('aria-valuetext','00');
  await page.getByRole('button',{name:'Duration 60 minutes'}).click();
  await expect(endHour).toHaveAttribute('aria-valuetext','11');
  await page.getByRole('button',{name:'Duration 90 minutes'}).click();
  await expect(endHour).toHaveAttribute('aria-valuetext','12');
  await expect(endMinute).toHaveAttribute('aria-valuetext','30');
  await endHour.press('ArrowUp');
  await page.getByRole('button',{name:'Duration 30 minutes'}).click();
  await expect(endHour).toHaveAttribute('aria-valuetext','14');
  await expect(endMinute).toHaveAttribute('aria-valuetext','00');
  await endHour.press('End');
  await page.getByRole('button',{name:'Duration 30 minutes'}).click();
  await expect(endHour).toHaveAttribute('aria-valuetext','24');
  await expect(endMinute).toHaveAttribute('aria-valuetext','00');
});
