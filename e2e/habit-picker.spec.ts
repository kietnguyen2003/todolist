import {test,expect,type Page} from './fixtures';

async function openForm(page:Page) {
  await page.setViewportSize({width:320,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Add habit'}).click();
}

test('habit target and unit use side-by-side wheels, not free-text inputs',async({page})=>{
  await openForm(page);
  const target=page.getByRole('spinbutton',{name:'Daily target',exact:true});
  const unit=page.getByRole('spinbutton',{name:'Unit',exact:true});
  await expect(target).toBeVisible();
  await expect(unit).toBeVisible();
  await expect(page.getByRole('textbox',{name:'Daily target'})).toHaveCount(0);
  await expect(page.getByRole('textbox',{name:'Unit',exact:true})).toHaveCount(0);
  const left=(await target.boundingBox())!, right=(await unit.boundingBox())!;
  expect(left.x+left.width).toBeLessThanOrEqual(right.x);
  expect(Math.abs(left.y-right.y)).toBeLessThan(2);
  await target.press('End');
  await expect(target).toHaveAttribute('aria-valuetext','100');
  await target.press('Home');
  await expect(target).toHaveAttribute('aria-valuetext','0');
  await page.getByRole('textbox',{name:'Habit name',exact:true}).fill('Uống đủ nước');
  await target.press('ArrowUp');
  await target.press('ArrowUp');
  await page.getByRole('button',{name:'Create habit',exact:true}).click();
  await expect(page.getByText('0 / 2 liters',{exact:true})).toBeVisible();
});

test('mouse wheel updates the selected quantity and reopening resets the draft', async ({page}) => {
  await openForm(page);
  const target = page.getByRole('spinbutton', {name:'Daily target',exact:true});
  await target.hover();
  await page.mouse.wheel(0,132);
  await expect(target).not.toHaveAttribute('aria-valuetext','1');
  await expect.poll(async () => Number(await target.getAttribute('aria-valuetext'))).toBeGreaterThan(1);
  await page.screenshot({path:'/private/tmp/habit-wheel-320.png'});
  await page.getByRole('button',{name:'Close habit form'}).click();
  await page.getByRole('button',{name:'Add habit'}).click();
  await expect(target).toHaveAttribute('aria-valuetext','1');
  await expect(page.getByRole('spinbutton',{name:'Unit',exact:true})).toHaveAttribute('aria-valuetext','liter');
});

test('combined hours and minute unit reveals two wheels and stores duration correctly', async ({page}) => {
  await openForm(page);
  await page.getByRole('textbox',{name:'Habit name',exact:true}).fill('Học tập');
  const unit = page.getByRole('spinbutton',{name:'Unit',exact:true});
  await unit.press('ArrowUp');
  await unit.press('ArrowUp');
  await expect(unit).toHaveAttribute('aria-valuetext','hours and minute');
  const hours = page.getByRole('spinbutton',{name:'Target hours',exact:true});
  const minutes = page.getByRole('spinbutton',{name:'Target minutes',exact:true});
  await expect(hours).toBeVisible();
  await expect(minutes).toBeVisible();
  await hours.press('Home');
  await hours.press('ArrowUp');
  await minutes.press('Home');
  for(let i=0;i<30;i++) await minutes.press('ArrowUp');
  const h=(await hours.boundingBox())!, m=(await minutes.boundingBox())!, u=(await unit.boundingBox())!;
  expect(h.x+h.width).toBeLessThanOrEqual(m.x);
  expect(m.x+m.width).toBeLessThanOrEqual(u.x);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.waitForTimeout(400);
  await page.screenshot({path:'/private/tmp/habit-duration-320.png'});
  await unit.press('Home');
  await expect(hours).toHaveCount(0);
  await unit.press('ArrowUp');
  await unit.press('ArrowUp');
  await expect(hours).toHaveAttribute('aria-valuetext','1');
  await expect(minutes).toHaveAttribute('aria-valuetext','30');
  await page.getByRole('button',{name:'Create habit',exact:true}).click();
  await expect(page.getByText('0 hr 0 min / 1 hr 30 min',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Update Học tập',exact:true}).click();
  await page.getByRole('textbox',{name:'Amount Học tập'}).fill('90');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect(page.getByText('1 hr 30 min / 1 hr 30 min',{exact:true})).toBeVisible();
  await expect(page.getByLabel('Học tập: 1 day streak. Selected day complete.',{exact:true})).toBeVisible();
});

test('duration minutes stop at 59 and zero duration cannot be created', async ({page}) => {
  await openForm(page);
  await page.getByRole('textbox',{name:'Habit name',exact:true}).fill('Thiền');
  await page.getByRole('spinbutton',{name:'Unit',exact:true}).press('ArrowUp');
  await page.getByRole('spinbutton',{name:'Unit',exact:true}).press('ArrowUp');
  const hours=page.getByRole('spinbutton',{name:'Target hours',exact:true});
  const minutes=page.getByRole('spinbutton',{name:'Target minutes',exact:true});
  await minutes.press('End');
  await minutes.press('ArrowUp');
  await expect(minutes).toHaveAttribute('aria-valuetext','59');
  await hours.press('End');
  await expect(hours).toHaveAttribute('aria-valuetext','100');
  await hours.press('Home');
  await minutes.press('Home');
  await page.getByRole('button',{name:'Create habit',exact:true}).click();
  await expect(page.getByText('Choose at least one minute.',{exact:true})).toBeVisible();
});
