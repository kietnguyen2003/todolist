import {test,expect} from '@playwright/test';

test('quick todo from Today stays off Calendar, then timed task appears on both',async({page})=>{
  await page.clock.install({time:new Date('2026-09-30T12:00:00+07:00')});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Thêm công việc',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Thêm công việc',exact:true})).toBeVisible();
  await expect(page.getByRole('radio',{name:'Không có giờ',exact:true})).toHaveAttribute('aria-checked','true');
  await expect(page.getByRole('spinbutton',{name:'Giờ bắt đầu'})).toHaveCount(0);
  await page.getByRole('textbox',{name:'Tên công việc',exact:true}).fill('Việc chưa lên lịch');
  await page.getByRole('button',{name:'Tạo công việc',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'Việc chưa lên lịch',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Đi đến Lịch',exact:true}).click();
  await expect(page.locator('[data-testid^="calendar-event-"]')).toHaveCount(0);
  await page.getByRole('button',{name:'Đi đến Công việc',exact:true}).click();
  await page.getByRole('button',{name:'Thêm công việc',exact:true}).click();
  await page.getByRole('radio',{name:'Có giờ',exact:true}).click();
  await expect(page.getByRole('spinbutton',{name:'Giờ bắt đầu'})).toBeVisible();
  await page.getByRole('textbox',{name:'Tên công việc',exact:true}).fill('Việc có giờ');
  await page.getByRole('button',{name:'Thời lượng 60 phút',exact:true}).click();
  await page.getByRole('button',{name:'Tạo công việc',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'Việc có giờ',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Đi đến Lịch',exact:true}).click();
  await expect(page.locator('[data-testid^="calendar-event-"]')).toHaveCount(1);
  await expect(page.getByRole('button',{name:/^Việc có giờ,.*09:00 đến 10:00/})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('checkbox',{name:'Việc chưa lên lịch',exact:true})).toBeVisible();
  await expect(page.getByRole('checkbox',{name:'Việc có giờ',exact:true})).toBeVisible();
});

test('editing the task date opens that day after creation',async({page})=>{
  await page.clock.install({time:new Date('2026-09-30T12:00:00+07:00')});
  await page.goto('/');
  await page.getByRole('button',{name:'Thêm công việc',exact:true}).click();
  await page.getByRole('textbox',{name:'Tên công việc',exact:true}).fill('Việc ngày mai');
  await page.getByRole('textbox',{name:'Ngày',exact:true}).fill('2026-10-01');
  await page.getByRole('button',{name:'Tạo công việc',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'Việc ngày mai',exact:true})).toBeVisible();
});
