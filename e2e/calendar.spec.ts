import {test,expect,type Page} from './fixtures';
async function enterCalendar(page:Page,width=390) {
  await page.clock.install({time:new Date('2026-09-29T10:00:00+07:00')});
  await page.setViewportSize({width,height:844});
  await page.goto('/');
  await page.getByRole('checkbox',{name:'Mua thực phẩm cho tuần mới'}).click();
  await page.getByRole('button',{name:'Đi đến Lịch',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Lịch',exact:true})).toBeVisible();
}
for(const width of [320,900,1280]) test(`calendar fits ${width}px and preserves Today data`,async({page})=>{
  await enterCalendar(page,width);
  await expect(page.getByTestId(width>=900?'navigation-top':'navigation-bottom')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Đi đến Hôm nay',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'Mua thực phẩm cho tuần mới'})).toBeChecked();
  await page.getByRole('button',{name:'Đi đến Lịch',exact:true}).click();
  await page.getByRole('button',{name:'Đi đến Thói quen',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Thói quen hằng ngày'})).toBeInViewport();
});

test('calendar shares only Today tasks, dates and completion',async({page})=>{
  await enterCalendar(page);
  await expect(page.locator('[data-testid^="calendar-event-"]')).toHaveCount(6);
  for(const id of ['shopping','planning','reading','email','yesterday','tomorrow'])
    await expect(page.getByTestId(`calendar-event-${id}`)).toHaveCount(1);
  for(const name of ['Uống nước','Đọc sách','Vận động nhẹ'])
    await expect(page.getByRole('button',{name:new RegExp(`^${name},`)})).toHaveCount(0);
  await page.getByTestId('calendar-event-shopping').click();
  await expect(page.getByRole('heading',{name:'Mua thực phẩm cho tuần mới',exact:true})).toBeVisible();
  await expect(page.getByText('Ngày 29/9/2026',{exact:true})).toBeVisible();
  await expect(page.getByTestId('calendar-detail').getByText('09:00',{exact:true})).toBeVisible();
  await expect(page.getByText('09:30',{exact:true})).toBeVisible();
  await expect(page.getByText('Kết thúc (tạm tính)',{exact:true})).toBeVisible();
  await expect(page.getByText('Đã hoàn thành',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Đóng chi tiết'}).click();
  await page.getByRole('button',{name:'Đi đến Hôm nay',exact:true}).click();
  await page.getByRole('checkbox',{name:'Mua thực phẩm cho tuần mới'}).click();
  await page.getByRole('button',{name:'Đi đến Lịch',exact:true}).click();
  await page.getByTestId('calendar-event-shopping').click();
  await expect(page.getByText('Chưa hoàn thành',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Đóng chi tiết'}).click();
  await page.getByTestId('calendar-day-2026-09-30').click();
  await page.getByTestId('calendar-event-tomorrow').click();
  await expect(page.getByRole('heading',{name:'Chuẩn bị công việc ngày mới',exact:true})).toBeVisible();
  await expect(page.getByText('Ngày 30/9/2026',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Đóng chi tiết'}).click();
  await page.getByRole('button',{name:'Tuần sau',exact:true}).click();
  await expect(page.locator('[data-testid^="calendar-event-"]')).toHaveCount(0);
  await page.getByRole('button',{name:'Hôm nay',exact:true}).click();
  await expect(page.getByTestId('calendar-day-2026-09-29')).toHaveAttribute('aria-pressed','true');
  await expect(page.getByTestId('calendar-event-shopping')).toBeVisible();
});

test('event details remain usable on a short landscape screen',async({page})=>{
  await enterCalendar(page,844);
  await page.getByTestId('calendar-event-shopping').click();
  await page.setViewportSize({width:844,height:390});
  await page.getByRole('button',{name:'Đã hiểu',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Mua thực phẩm cho tuần mới',exact:true})).toBeHidden();
});

test('empty time slot creates a shared task and validates its times',async({page})=>{
  await enterCalendar(page,320);
  await page.getByTestId('calendar-slot-2026-09-29-11').click();
  await expect(page.getByRole('heading',{name:'Thêm công việc',exact:true})).toBeVisible();
  await expect(page.getByRole('spinbutton',{name:'Giờ bắt đầu',exact:true})).toHaveAttribute('aria-valuetext','11');
  await expect(page.getByRole('spinbutton',{name:'Phút bắt đầu',exact:true})).toHaveAttribute('aria-valuetext','00');
  await expect(page.getByRole('spinbutton',{name:'Giờ kết thúc',exact:true})).toHaveAttribute('aria-valuetext','11');
  await expect(page.getByRole('spinbutton',{name:'Phút kết thúc',exact:true})).toHaveAttribute('aria-valuetext','30');
  await page.getByRole('button',{name:'Tạo công việc',exact:true}).click();
  await expect(page.getByText('Nhập tên công việc từ 1 đến 120 ký tự.',{exact:true})).toBeVisible();
  await page.getByRole('textbox',{name:'Tên công việc',exact:true}).fill('Viết báo cáo');
  await page.getByRole('spinbutton',{name:'Giờ kết thúc',exact:true}).press('ArrowDown');
  await page.getByRole('button',{name:'Tạo công việc',exact:true}).click();
  await expect(page.getByText('Giờ kết thúc phải sau giờ bắt đầu, tối đa 24:00.',{exact:true})).toBeVisible();
  await page.getByRole('spinbutton',{name:'Giờ kết thúc',exact:true}).press('ArrowUp');
  await page.getByRole('spinbutton',{name:'Giờ kết thúc',exact:true}).press('ArrowUp');
  await page.getByRole('spinbutton',{name:'Phút kết thúc',exact:true}).press('Home');
  await page.getByRole('button',{name:'Tạo công việc',exact:true}).click();
  const event=page.getByRole('button',{name:/^Viết báo cáo, 2026-09-29, 11:00 đến 12:00/});
  await expect(event).toBeVisible();
  await event.click();
  await expect(page.getByRole('heading',{name:'Viết báo cáo',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Thêm công việc',exact:true})).toBeHidden();
  await page.getByRole('button',{name:'Đóng chi tiết'}).click();
  await page.getByRole('button',{name:'Đi đến Công việc',exact:true}).click();
  const task=page.getByRole('checkbox',{name:'Viết báo cáo',exact:true});
  await expect(task).not.toBeChecked();
  await task.click();
  await page.getByRole('button',{name:'Đi đến Lịch',exact:true}).click();
  await expect(page.getByRole('button',{name:/^Viết báo cáo,.*đã hoàn thành$/})).toBeVisible();
});

test('canceling a new calendar task leaves no task behind',async({page})=>{
  await enterCalendar(page);
  await page.getByTestId('calendar-slot-2026-09-30-11').click();
  await page.getByRole('textbox',{name:'Tên công việc',exact:true}).fill('Không lưu');
  await page.getByRole('button',{name:'Đóng thêm công việc',exact:true}).click();
  await expect(page.locator('[data-testid^="calendar-event-"]')).toHaveCount(6);
  await page.getByTestId('calendar-slot-2026-09-30-11').click();
  await expect(page.getByRole('textbox',{name:'Tên công việc',exact:true})).toHaveValue('');
});

test('time wheels support scrolling, midnight and cancel reset at 320px',async({page})=>{
  await enterCalendar(page,320);
  await page.getByTestId('calendar-slot-2026-09-29-11').click();
  await expect(page.getByRole('textbox',{name:'Giờ bắt đầu',exact:true})).toHaveCount(0);
  const start=page.getByRole('spinbutton',{name:'Giờ bắt đầu',exact:true});
  const end=page.getByRole('spinbutton',{name:'Giờ kết thúc',exact:true});
  const minute=page.getByRole('spinbutton',{name:'Phút kết thúc',exact:true});
  await start.hover();
  await page.mouse.wheel(0,44);
  await expect(start).not.toHaveAttribute('aria-valuetext','11');
  await start.press('End');
  await expect(start).toHaveAttribute('aria-valuetext','23');
  await end.press('End');
  await expect(end).toHaveAttribute('aria-valuetext','24');
  await expect(minute).toHaveAttribute('aria-valuetext','00');
  await minute.press('ArrowUp');
  await expect(minute).toHaveAttribute('aria-valuetext','00');
  await end.press('ArrowDown');
  await minute.press('End');
  await expect(minute).toHaveAttribute('aria-valuetext','59');
  await end.press('End');
  await page.getByRole('textbox',{name:'Tên công việc',exact:true}).fill('Kết thúc ngày');
  await page.waitForTimeout(300);
  await page.screenshot({path:'/private/tmp/task-time-wheels-320.png'});
  await page.getByRole('button',{name:'Tạo công việc',exact:true}).click();
  await expect(page.getByRole('button',{name:/^Kết thúc ngày, 2026-09-29, 23:00 đến 24:00/})).toHaveCount(1);
  await page.getByTestId('calendar-slot-2026-09-29-11').click();
  await expect(start).toHaveAttribute('aria-valuetext','11');
  await expect(minute).toHaveAttribute('aria-valuetext','30');
});
