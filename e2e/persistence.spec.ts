import {test, expect, type Page} from '@playwright/test';

async function waitForToday(page:Page) {
  await expect(page.getByRole('heading',{name:'Một ngày có ý nghĩa.'})).toBeVisible();
}

test('fresh install is empty and task, habit, progress survive reloading',async({page})=>{
  await page.clock.install({time:new Date('2026-09-29T10:00:00+07:00')});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await waitForToday(page);
  await expect(page.getByText('Chưa có công việc cho ngày này.',{exact:true})).toBeVisible();
  await expect(page.getByText('Chưa có thói quen cho ngày này. Bắt đầu một điều nhỏ nhé.',{exact:true})).toBeVisible();
  await expect(page.getByTestId('today-header-logo')).toBeVisible();
  await page.screenshot({path:'/private/tmp/today-empty-logo.png'});
  await page.getByRole('button',{name:'Đi đến Lịch',exact:true}).click();
  await expect(page.locator('[data-testid^="calendar-event-"]')).toHaveCount(0);
  await page.getByTestId('calendar-slot-2026-09-29-11').click();
  await page.getByRole('textbox',{name:'Tên công việc',exact:true}).fill('Công việc của tôi');
  await page.getByRole('button',{name:'Tạo công việc',exact:true}).click();
  await page.getByRole('button',{name:'Đi đến Hôm nay',exact:true}).click();
  await page.getByRole('checkbox',{name:'Công việc của tôi',exact:true}).click();
  await page.getByRole('button',{name:'Thêm thói quen'}).click();
  await page.getByRole('textbox',{name:'Tên thói quen',exact:true}).fill('Uống đủ nước');
  await page.getByRole('spinbutton',{name:'Mục tiêu mỗi ngày',exact:true}).press('ArrowUp');
  await page.getByRole('button',{name:'Tạo thói quen',exact:true}).click();
  await page.getByRole('button',{name:'Tăng Uống đủ nước',exact:true}).click();
  await expect(page.getByText('1 / 2 liter',{exact:true})).toBeVisible();
  await expect.poll(async()=>page.evaluate(()=>{
    const saved=JSON.parse(localStorage.getItem('tung-buoc:today:v1')??'null');
    return saved?.state.counts['2026-09-29']?.[saved.state.habits[0]?.id];
  })).toBe(1);
  await page.reload();
  await waitForToday(page);
  await expect(page.getByRole('checkbox',{name:'Công việc của tôi',exact:true})).toBeChecked();
  await expect(page.getByText('1 / 2 liter',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Đi đến Lịch',exact:true}).click();
  await expect(page.locator('[data-testid^="calendar-event-"]')).toHaveCount(1);
  await expect(page.getByRole('button',{name:/^Công việc của tôi,.*đã hoàn thành$/})).toBeVisible();
  const stored = await page.evaluate(()=>localStorage.getItem('tung-buoc:today:v1'));
  expect(stored).not.toContain('local-password');
  expect(stored).not.toContain('local@example.com');
});

test('corrupted local data is preserved and a storage retry is offered',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('tung-buoc:today:v1','{bad'));
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Thử lại lưu trữ',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('tung-buoc:today:v1'))).toBe('{bad');
  await page.getByRole('button',{name:'Thử lại lưu trữ',exact:true}).click();
  await expect(page.getByRole('button',{name:'Thử lại lưu trữ',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('tung-buoc:today:v1'))).toBe('{bad');
});

test('failed local writes can be retried without losing the current task',async({page})=>{
  await page.clock.install({time:new Date('2026-09-29T10:00:00+07:00')});
  await page.addInitScript(()=>{
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value) {
      if(key==='tung-buoc:today:v1' && !sessionStorage.getItem('allow-write')) throw new Error('Storage unavailable');
      return original.call(this,key,value);
    };
  });
  await page.goto('/');
  await waitForToday(page);
  await page.getByRole('button',{name:'Đi đến Lịch',exact:true}).click();
  await page.getByTestId('calendar-slot-2026-09-29-11').click();
  await page.getByRole('textbox',{name:'Tên công việc',exact:true}).fill('Giữ lại khi lưu lỗi');
  await page.getByRole('button',{name:'Tạo công việc',exact:true}).click();
  await expect(page.getByRole('button',{name:'Thử lại lưu trữ',exact:true})).toBeVisible();
  await page.evaluate(()=>sessionStorage.setItem('allow-write','1'));
  await page.getByRole('button',{name:'Thử lại lưu trữ',exact:true}).click();
  await expect(page.getByRole('button',{name:'Thử lại lưu trữ',exact:true})).toBeHidden();
  await page.reload();
  await waitForToday(page);
  await expect(page.getByRole('checkbox',{name:'Giữ lại khi lưu lỗi',exact:true})).toBeVisible();
});
