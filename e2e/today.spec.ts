import {test,expect,type Page} from './fixtures';
import { addDays, weekDates } from '../src/today/model';
async function enter(page:Page) {
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Make today meaningful.'})).toBeVisible();
}
test('task toggles, date switching and quantities remain independent',async({page})=>{
  await enter(page);
  const currentDate=await page.locator('[aria-pressed="true"][aria-label^="Select date"]').getAttribute('aria-label');
  const otherDay=page.locator('[aria-pressed="false"][aria-label^="Select date"]').first();
  const otherLabel=await otherDay.getAttribute('aria-label');
  await otherDay.click();
  await expect(page.getByRole('button',{name:otherLabel!,exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:currentDate!,exact:true}).click();
  const task=page.getByRole('checkbox',{name:'Mua thực phẩm cho tuần mới'});
  await expect(task).not.toBeChecked();
  await task.click(); await expect(task).toBeChecked();
  await task.click(); await expect(task).not.toBeChecked();
  await page.getByRole('button',{name:'Increase Uống nước',exact:true}).click();
  await expect(page.getByText('4 / 8 cốc',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Next week'}).click();
  await expect(page.getByText('No tasks for this day yet.')).toBeVisible();
  await expect(page.getByText('0 / 8 cốc',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Increase Uống nước',exact:true}).click();
  await page.getByRole('button',{name:'Go to today'}).click();
  await expect(page.getByText('4 / 8 cốc',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Update Uống nước',exact:true}).click();
  await page.getByRole('textbox',{name:'Amount Uống nước'}).fill('8');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect(page.getByText('8 / 8 cốc',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Decrease Uống nước',exact:true}).click();
  await expect(page.getByText('7 / 8 cốc',{exact:true})).toBeVisible();
});
test('habit form validates, creates a generic unit habit and preserves it across page navigation',async({page})=>{
  await enter(page);
  await page.getByRole('button',{name:'Go to Habits'}).click();
  await page.getByRole('button',{name:'Add habit'}).click();
  await page.getByRole('button',{name:'Create habit',exact:true}).click();
  await expect(page.getByText('Enter a habit name with 1 to 60 characters.')).toBeVisible();
  await page.getByRole('textbox',{name:'Habit name',exact:true}).fill('Thiền');
  await page.getByRole('spinbutton',{name:'Unit',exact:true}).press('ArrowUp');
  const target = page.getByRole('spinbutton',{name:'Daily target',exact:true});
  await target.press('Home');
  for (let i = 0; i < 15; i++) await target.press('ArrowUp');
  await page.getByRole('button',{name:'Create habit',exact:true}).click();
  await page.getByRole('button',{name:'Go to To do'}).click();
  await expect(page.getByText('0 / 15 steps',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Update Thiền',exact:true}).click();
  await page.getByRole('textbox',{name:'Amount Thiền'}).fill('-1');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect(page.getByText('Enter a whole number from 0 to 100,000.')).toBeVisible();
  await page.getByRole('textbox',{name:'Amount Thiền'}).fill('16');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect(page.getByText('16 / 15 steps',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Go to Calendar',exact:true}).click();
  await page.getByRole('button',{name:'Go to To do',exact:true}).click();
  await expect(page.getByText('16 / 15 steps',{exact:true})).toBeVisible();
});
test('task and habit lists can be collapsed independently',async({page})=>{
  await enter(page);
  const taskToggle=page.getByRole('button',{name:'Hide tasks',exact:true});
  const habitToggle=page.getByRole('button',{name:'Hide habits',exact:true});
  await taskToggle.click();
  await expect(page.getByRole('checkbox',{name:'Mua thực phẩm cho tuần mới'})).toBeHidden();
  await expect(page.getByText('0 / 20 trang',{exact:true})).toBeVisible();
  await habitToggle.click();
  await expect(page.getByText('0 / 20 trang',{exact:true})).toBeHidden();
  await expect(page.getByRole('button',{name:'Show tasks',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Show tasks',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'Mua thực phẩm cho tuần mới'})).toBeVisible();
});
for (const [initial,forward] of [['2026-09-20','2026-09-21'],['2026-09-23','2026-09-28'],['2026-09-30','2026-10-05']]) {
  test(`swiping selects the correct day in the next and previous week from ${initial}`, async ({page}) => {
    await page.clock.install({time:new Date(`${initial}T12:00:00+07:00`)});
    await page.setViewportSize({width:390,height:844});
    await enter(page);
    const swipe=async (forward:boolean) => {
      const box=(await page.getByTestId('week-calendar-viewport').boundingBox())!;
      const x=box.x+box.width*(forward?0.75:0.25), y=box.y+box.height/2;
      await page.mouse.move(x,y);
      await page.mouse.down();
      await page.mouse.move(x+(forward?-130:130),y,{steps:6});
      await page.mouse.up();
    };
    await swipe(true);
    await expect(page.getByRole('button',{name:`Select date ${forward}`,exact:true})).toHaveAttribute('aria-pressed','true');
    await swipe(false);
    await expect(page.getByRole('button',{name:`Select date ${initial}`,exact:true})).toHaveAttribute('aria-pressed','true');
  });
}
for(const width of [320,390,768,1280]) test(`To do navigation at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:844});
  await enter(page);
  const nav=page.getByTestId(width>=900?'navigation-top':'navigation-bottom');
  await expect(nav).toBeVisible();
  const box=await nav.boundingBox();
  if(width>=900) expect(box!.y).toBeLessThan(50);
  else expect(box!.y+box!.height).toBe(844);
  await expect(nav.getByRole('button')).toHaveCount(4);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Go to Calendar'}).click();
  await expect(page.getByRole('heading',{name:'Calendar',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Go to Habits'}).click();
  await expect(page.getByRole('heading',{name:'Habits',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Go to To do'}).click();
  await expect(page.getByRole('heading',{name:'Tasks',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Daily habits',exact:true})).toBeVisible();
});
test('returning to today cancels an in-flight week swipe', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await enter(page);
  const selected=page.locator('[aria-pressed="true"][aria-label^="Select date"]');
  const initial=await selected.getAttribute('aria-label');
  const box=await selected.boundingBox();
  const x=box!.x+box!.width/2,y=box!.y+box!.height/2;
  await page.mouse.move(x,y);
  await page.mouse.down();
  await page.mouse.move(x-110,y,{steps:6});
  await page.mouse.up();
  await page.getByRole('button',{name:'Go to today',exact:true}).evaluate(el=>(el as HTMLElement).click());
  // The canceled transition must not change the selected date afterwards.
  await page.waitForTimeout(650);
  await expect(page.getByRole('button',{name:initial!,exact:true})).toHaveAttribute('aria-pressed','true');
});

test('rapid week controls keep the final request and resize rebases the calendar', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await enter(page);
  const initial=(await page.locator('[aria-pressed="true"][aria-label^="Select date"]').getAttribute('aria-label'))!.replace('Select date ','');
  await page.getByRole('button',{name:'Next week',exact:true}).evaluate(el=>{
    (el as HTMLElement).click(); (el as HTMLElement).click();
  });
  await expect(page.getByRole('button',{name:`Select date ${weekDates(addDays(initial,14))[0]}`,exact:true})).toHaveAttribute('aria-pressed','true');
  await page.setViewportSize({width:1280,height:844});
  await page.getByRole('button',{name:'Previous week',exact:true}).click();
  await expect(page.getByRole('button',{name:`Select date ${weekDates(addDays(initial,7))[6]}`,exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Go to To do',exact:true}).click();
  await expect(page.getByRole('button',{name:`Select date ${initial}`,exact:true})).toHaveAttribute('aria-pressed','true');
});
test('collapsing a section retains drafts after expanding', async ({page}) => {
  await enter(page);
  await page.getByRole('button',{name:'Update Uống nước',exact:true}).click();
  await page.getByRole('textbox',{name:'Amount Uống nước'}).fill('6');
  await page.getByRole('button',{name:'Hide habits',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Amount Uống nước'})).toBeHidden();
  await page.getByRole('button',{name:'Show habits',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Amount Uống nước'})).toHaveValue('6');
});
test('reduced motion preserves all calendar and collapse interactions', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await enter(page);
  const initial=(await page.locator('[aria-pressed="true"][aria-label^="Select date"]').getAttribute('aria-label'))!.replace('Select date ','');
  await page.getByRole('button',{name:'Next week',exact:true}).click();
  await expect(page.getByRole('button',{name:`Select date ${weekDates(addDays(initial,7))[0]}`,exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Hide habits',exact:true}).click();
  await expect(page.getByText('0 / 8 cốc',{exact:true})).toBeHidden();
  await page.getByRole('button',{name:'Show habits',exact:true}).click();
  await expect(page.getByText('0 / 8 cốc',{exact:true})).toBeVisible();
});
test('To do navigation returns to the current day', async ({page}) => {
  await enter(page);
  await page.getByRole('button',{name:'Next week',exact:true}).click();
  await page.getByRole('button',{name:'Go to To do',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Tasks',exact:true})).toBeVisible();
});
