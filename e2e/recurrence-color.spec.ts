import { expect, test } from '@playwright/test';

test('a weekly task keeps its color and completion is separate for each week',async({page})=>{
  await page.clock.install({time:new Date('2026-09-29T10:00:00+07:00')});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Go to Calendar'}).click();
  await page.getByTestId('calendar-slot-2026-09-29-11').click();
  await page.getByRole('textbox',{name:'Task name'}).fill('Standup');
  await page.getByRole('radio',{name:'Weekly'}).click();
  await page.getByRole('button',{name:'Select rose color'}).click();
  await page.getByRole('button',{name:'Create task'}).click();
  const first=page.getByRole('button',{name:/^Standup, 2026-09-29, 11:00 to 11:30/});
  await expect(first).toBeVisible();
  await expect(first).toHaveCSS('background-color','rgb(233, 189, 205)');
  await page.getByRole('button',{name:'Next week'}).click();
  const next=page.getByRole('button',{name:/^Standup, 2026-10-06, 11:00 to 11:30/});
  await expect(next).toBeVisible();
  await expect(next).toHaveCSS('background-color','rgb(233, 189, 205)');
  await page.getByRole('button',{name:'Go to To do'}).click();
  await page.getByRole('button',{name:'Next week'}).click();
  await page.getByRole('button',{name:'Select date 2026-10-06'}).click();
  await page.getByRole('checkbox',{name:'Standup'}).click();
  await page.getByRole('button',{name:'Go to Calendar'}).click();
  await page.getByRole('button',{name:'Next week'}).click();
  await expect(page.getByRole('button',{name:/^Standup, 2026-10-06,.*complete$/})).toBeVisible();
  await page.getByRole('button',{name:/^Standup, 2026-10-06,.*complete$/}).click();
  await page.getByRole('button',{name:'Select sand color'}).click();
  await page.getByRole('button',{name:'Close details'}).click();
  await expect(page.getByRole('button',{name:/^Standup, 2026-10-06,.*complete$/})).toHaveCSS('background-color','rgb(234, 211, 164)');
  await page.reload();
  await page.getByRole('button',{name:'Go to Calendar'}).click();
  await page.getByRole('button',{name:'Next week'}).click();
  await expect(page.getByRole('button',{name:/^Standup, 2026-10-06,.*complete$/})).toHaveCSS('background-color','rgb(234, 211, 164)');
});

test('a monthly task recurs on the same calendar day',async({page})=>{
  await page.clock.install({time:new Date('2026-09-30T10:00:00+07:00')});
  await page.goto('/');
  await page.getByRole('button',{name:'Add task'}).click();
  await page.getByRole('textbox',{name:'Task name'}).fill('Pay rent');
  await page.getByRole('radio',{name:'Monthly'}).click();
  await page.getByRole('button',{name:'Select sage color'}).click();
  await page.getByRole('button',{name:'Create task'}).click();
  await page.getByRole('button',{name:'Go to Calendar'}).click();
  for(let i=0;i<4;i++)await page.getByRole('button',{name:'Next week'}).click();
  const event=page.getByRole('button',{name:/^Pay rent, 2026-10-30,/});
  await expect(event).toBeVisible();
  await expect(event).toHaveCSS('background-color','rgb(185, 215, 201)');
});

test('habit unit labels follow the target and Time is available',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Add habit'}).click();
  const target=page.getByRole('spinbutton',{name:'Daily target'});
  const unit=page.getByRole('spinbutton',{name:'Unit'});
  await unit.press('ArrowUp');
  await expect(unit).toHaveAttribute('aria-valuetext','step');
  await target.press('ArrowUp');
  await expect(unit).toHaveAttribute('aria-valuetext','steps');
  await unit.press('End');
  await expect(unit).toHaveAttribute('aria-valuetext','Times');
  await target.press('ArrowDown');
  await expect(unit).toHaveAttribute('aria-valuetext','Time');
  await page.getByRole('textbox',{name:'Habit name'}).fill('Stretch');
  await page.getByRole('button',{name:'Create habit'}).click();
  await expect(page.getByText('0 / 1 time',{exact:true})).toBeVisible();
});
