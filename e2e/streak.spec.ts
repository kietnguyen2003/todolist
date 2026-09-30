import {test,expect} from './fixtures';
import {COLORS} from '../src/theme';
const rgb=(hex:string)=>`rgb(${parseInt(hex.slice(1,3),16)}, ${parseInt(hex.slice(3,5),16)}, ${parseInt(hex.slice(5,7),16)})`;

test('habit flame reflects completion and consecutive daily progress, including undo',async({page})=>{
  await page.clock.install({time:new Date('2026-09-28T12:00:00+07:00')});
  await page.setViewportSize({width:320,height:844});
  await page.goto('/');
  const badge=page.getByTestId('streak-water');
  await expect(badge).toHaveAttribute('aria-label','Uống nước: 1 day streak. Selected day incomplete.');
  await expect(badge.locator('div').first()).toHaveCSS('color',rgb(COLORS.white));
  const setWater=async(count:string)=>{
    await page.getByRole('button',{name:'Update Uống nước',exact:true}).click();
    await page.getByRole('textbox',{name:'Amount Uống nước'}).fill(count);
    await page.getByRole('button',{name:'Save',exact:true}).click();
  };
  await setWater('8');
  await expect(badge).toHaveAttribute('aria-label','Uống nước: 2 day streak. Selected day complete.');
  await expect(badge.locator('div').first()).toHaveCSS('color',rgb(COLORS.streakActive));
  await page.getByRole('button',{name:'Select date 2026-09-29',exact:true}).click();
  await expect(badge).toHaveAttribute('aria-label','Uống nước: 2 day streak. Selected day incomplete.');
  await setWater('9');
  await expect(badge).toHaveAttribute('aria-label','Uống nước: 3 day streak. Selected day complete.');
  await page.getByRole('button',{name:'Select date 2026-09-28',exact:true}).click();
  await page.getByRole('button',{name:'Decrease Uống nước',exact:true}).click();
  await expect(badge).toHaveAttribute('aria-label','Uống nước: 1 day streak. Selected day incomplete.');
  await page.getByRole('button',{name:'Select date 2026-09-29',exact:true}).click();
  await expect(badge).toHaveAttribute('aria-label','Uống nước: 1 day streak. Selected day complete.');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
