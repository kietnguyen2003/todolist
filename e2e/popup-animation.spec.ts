import { expect, test } from '@playwright/test';

test('task popup fades and settles, while reduced motion opens without movement',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Add task'})).toBeVisible();
  const openingOpacity=await page.evaluate(()=>new Promise<number>(resolve=>{
    document.querySelector<HTMLElement>('[aria-label="Add task"]')!.click();
    const sample=()=>{
      const card=document.querySelector<HTMLElement>('[data-testid="task-popup-card"]');
      if(card)resolve(Number(getComputedStyle(card).opacity));
      else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
  expect(openingOpacity).toBeLessThan(1);
  await expect(page.getByTestId('task-popup-card')).toHaveCSS('opacity','1');

  await page.emulateMedia({reducedMotion:'reduce'});
  await page.reload();
  await expect(page.getByRole('button',{name:'Add task'})).toBeVisible();
  const reducedOpeningOpacity=await page.evaluate(()=>new Promise<number>(resolve=>{
    document.querySelector<HTMLElement>('[aria-label="Add task"]')!.click();
    const sample=()=>{
      const card=document.querySelector<HTMLElement>('[data-testid="task-popup-card"]');
      if(card)resolve(Number(getComputedStyle(card).opacity));
      else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
  expect(reducedOpeningOpacity).toBe(1);
  await expect(page.getByTestId('task-popup-card')).toHaveCSS('opacity','1');
});

test('task, habit, delete and event popups use the shared entrance and remain interactive',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Add task'}).click();
  await expect(page.getByTestId('task-popup-card')).toBeVisible();
  await page.getByRole('button',{name:'Close task form'}).click();

  await page.getByRole('button',{name:'Add habit'}).click();
  await expect(page.getByTestId('habit-popup-card')).toBeVisible();
  await page.getByRole('textbox',{name:'Habit name'}).fill('Stretch');
  await page.getByRole('button',{name:'Create habit'}).click();
  await page.getByRole('button',{name:'Manage Stretch'}).click();
  await page.getByRole('button',{name:'Delete habit'}).click();
  await expect(page.getByTestId('delete-popup-card')).toBeVisible();
  await page.getByRole('button',{name:'Cancel'}).click();

  await page.getByRole('button',{name:'Go to Calendar'}).click();
  const date=await page.locator('[data-testid^="calendar-day-"][aria-pressed="true"]').getAttribute('data-testid');
  const selected=date!.replace('calendar-day-','');
  await page.getByTestId(`calendar-slot-${selected}-11`).click();
  await page.getByRole('textbox',{name:'Task name'}).fill('Planning');
  await page.getByRole('button',{name:'Create task'}).click();
  await page.getByRole('button',{name:new RegExp(`^Planning, ${selected},`)}).click();
  await expect(page.getByTestId('calendar-detail')).toBeVisible();
  await expect(page.getByRole('button',{name:'Done'})).toBeVisible();
});
