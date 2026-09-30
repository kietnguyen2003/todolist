import {test,expect} from './fixtures';
for(const screen of ['today','calendar']) test(`${screen} follows the new local day at midnight`,async({page})=>{
  await page.clock.install({time:new Date('2026-09-30T23:59:50')});
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Make today meaningful.'})).toBeVisible();
  if(screen==='calendar') await page.getByRole('button',{name:'Go to Calendar',exact:true}).click();
  await page.clock.fastForward(11000);
  const selected=screen==='calendar'?page.getByTestId('calendar-day-2026-10-01'):page.getByRole('button',{name:'Select date 2026-10-01',exact:true});
  await expect(selected).toHaveAttribute('aria-pressed','true');
});

test('midnight does not override a manually selected day',async({page})=>{
  await page.clock.install({time:new Date('2026-09-30T23:59:50')});
  await page.goto('/');
  await page.getByRole('button',{name:'Select date 2026-09-29',exact:true}).click();
  await page.clock.fastForward(11000);
  await expect(page.getByRole('button',{name:'Select date 2026-09-29',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Go to today',exact:true}).click();
  await expect(page.getByRole('button',{name:'Select date 2026-10-01',exact:true})).toHaveAttribute('aria-pressed','true');
});
