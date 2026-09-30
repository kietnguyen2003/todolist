import {test,expect} from './fixtures';
import {COLORS} from '../src/theme';
const rgb=(hex:string)=>`rgb(${parseInt(hex.slice(1,3),16)}, ${parseInt(hex.slice(3,5),16)}, ${parseInt(hex.slice(5,7),16)})`;

test('habit flame reflects completion and consecutive daily progress, including undo',async({page})=>{
  await page.clock.install({time:new Date('2026-09-28T12:00:00+07:00')});
  await page.setViewportSize({width:320,height:844});
  await page.goto('/');
  const badge=page.getByTestId('streak-water');
  await expect(badge).toHaveAttribute('aria-label','Uống nước: 1 ngày liên tiếp. Chưa hoàn thành ngày đang chọn.');
  await expect(badge.locator('div').first()).toHaveCSS('color',rgb(COLORS.white));
  const setWater=async(count:string)=>{
    await page.getByRole('button',{name:'Cập nhật Uống nước',exact:true}).click();
    await page.getByRole('textbox',{name:'Số lượng Uống nước'}).fill(count);
    await page.getByRole('button',{name:'Lưu',exact:true}).click();
  };
  await setWater('8');
  await expect(badge).toHaveAttribute('aria-label','Uống nước: 2 ngày liên tiếp. Đã hoàn thành ngày đang chọn.');
  await expect(badge.locator('div').first()).toHaveCSS('color',rgb(COLORS.streakActive));
  await page.getByRole('button',{name:'Chọn ngày 2026-09-29',exact:true}).click();
  await expect(badge).toHaveAttribute('aria-label','Uống nước: 2 ngày liên tiếp. Chưa hoàn thành ngày đang chọn.');
  await setWater('9');
  await expect(badge).toHaveAttribute('aria-label','Uống nước: 3 ngày liên tiếp. Đã hoàn thành ngày đang chọn.');
  await page.getByRole('button',{name:'Chọn ngày 2026-09-28',exact:true}).click();
  await page.getByRole('button',{name:'Giảm Uống nước',exact:true}).click();
  await expect(badge).toHaveAttribute('aria-label','Uống nước: 1 ngày liên tiếp. Chưa hoàn thành ngày đang chọn.');
  await page.getByRole('button',{name:'Chọn ngày 2026-09-29',exact:true}).click();
  await expect(badge).toHaveAttribute('aria-label','Uống nước: 1 ngày liên tiếp. Đã hoàn thành ngày đang chọn.');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
