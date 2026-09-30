import {test,expect,type Page} from './fixtures';
async function enterCalendar(page:Page,width=390) {
  await page.clock.install({time:new Date('2026-09-29T10:00:00+07:00')});
  await page.setViewportSize({width,height:844});
  await page.goto('/');
  await page.getByRole('checkbox',{name:'Mua thực phẩm cho tuần mới'}).click();
  await page.getByRole('button',{name:'Go to Calendar',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Calendar',exact:true})).toBeVisible();
}
for(const width of [320,900,1280]) test(`calendar fits ${width}px and preserves Today data`,async({page})=>{
  await enterCalendar(page,width);
  await expect(page.getByTestId(width>=900?'navigation-top':'navigation-bottom')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Go to To do',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'Mua thực phẩm cho tuần mới'})).toBeChecked();
  await page.getByRole('button',{name:'Go to Calendar',exact:true}).click();
  await page.getByRole('button',{name:'Go to To do',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Daily habits'})).toBeVisible();
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
  await expect(page.getByText('September 29, 2026',{exact:true})).toBeVisible();
  await expect(page.getByTestId('calendar-detail').getByText('09:00',{exact:true})).toBeVisible();
  await expect(page.getByText('09:30',{exact:true})).toBeVisible();
  await expect(page.getByText('End (estimated)',{exact:true})).toBeVisible();
  await expect(page.getByText('Complete',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Close details'}).click();
  await page.getByRole('button',{name:'Go to To do',exact:true}).click();
  await page.getByRole('checkbox',{name:'Mua thực phẩm cho tuần mới'}).click();
  await page.getByRole('button',{name:'Go to Calendar',exact:true}).click();
  await page.getByTestId('calendar-event-shopping').click();
  await expect(page.getByText('Incomplete',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Close details'}).click();
  await page.getByTestId('calendar-day-2026-09-30').click();
  await page.getByTestId('calendar-event-tomorrow').click();
  await expect(page.getByRole('heading',{name:'Chuẩn bị công việc ngày mới',exact:true})).toBeVisible();
  await expect(page.getByText('September 30, 2026',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Close details'}).click();
  await page.getByRole('button',{name:'Next week',exact:true}).click();
  await expect(page.locator('[data-testid^="calendar-event-"]')).toHaveCount(0);
  await page.getByRole('button',{name:'Today',exact:true}).click();
  await expect(page.getByTestId('calendar-day-2026-09-29')).toHaveAttribute('aria-pressed','true');
  await expect(page.getByTestId('calendar-event-shopping')).toBeVisible();
});

test('event details remain usable on a short landscape screen',async({page})=>{
  await enterCalendar(page,844);
  await page.getByTestId('calendar-event-shopping').click();
  await page.setViewportSize({width:844,height:390});
  await page.getByRole('button',{name:'Done',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Mua thực phẩm cho tuần mới',exact:true})).toBeHidden();
});

test('empty time slot creates a shared task and validates its times',async({page})=>{
  await enterCalendar(page,320);
  await page.getByTestId('calendar-slot-2026-09-29-11').click();
  await expect(page.getByRole('heading',{name:'Add task',exact:true})).toBeVisible();
  await expect(page.getByRole('spinbutton',{name:'Start hour',exact:true})).toHaveAttribute('aria-valuetext','11');
  await expect(page.getByRole('spinbutton',{name:'Start minute',exact:true})).toHaveAttribute('aria-valuetext','00');
  await expect(page.getByRole('spinbutton',{name:'End hour',exact:true})).toHaveAttribute('aria-valuetext','11');
  await expect(page.getByRole('spinbutton',{name:'End minute',exact:true})).toHaveAttribute('aria-valuetext','30');
  await page.getByRole('button',{name:'Create task',exact:true}).click();
  await expect(page.getByText('Enter a task name with 1 to 120 characters.',{exact:true})).toBeVisible();
  await page.getByRole('textbox',{name:'Task name',exact:true}).fill('Viết báo cáo');
  await page.getByRole('spinbutton',{name:'End hour',exact:true}).press('ArrowDown');
  await page.getByRole('button',{name:'Create task',exact:true}).click();
  await expect(page.getByText('End time must be after start time, up to 24:00.',{exact:true})).toBeVisible();
  await page.getByRole('spinbutton',{name:'End hour',exact:true}).press('ArrowUp');
  await page.getByRole('spinbutton',{name:'End hour',exact:true}).press('ArrowUp');
  await page.getByRole('spinbutton',{name:'End minute',exact:true}).press('Home');
  await page.getByRole('button',{name:'Create task',exact:true}).click();
  const event=page.getByRole('button',{name:/^Viết báo cáo, 2026-09-29, 11:00 to 12:00/});
  await expect(event).toBeVisible();
  await event.click();
  await expect(page.getByRole('heading',{name:'Viết báo cáo',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Add task',exact:true})).toBeHidden();
  await page.getByRole('button',{name:'Close details'}).click();
  await page.getByRole('button',{name:'Go to To do',exact:true}).click();
  const task=page.getByRole('checkbox',{name:'Viết báo cáo',exact:true});
  await expect(task).not.toBeChecked();
  await task.click();
  await page.getByRole('button',{name:'Go to Calendar',exact:true}).click();
  await expect(page.getByRole('button',{name:/^Viết báo cáo,.*complete$/})).toBeVisible();
});

test('canceling a new calendar task leaves no task behind',async({page})=>{
  await enterCalendar(page);
  await page.getByTestId('calendar-slot-2026-09-30-11').click();
  await page.getByRole('textbox',{name:'Task name',exact:true}).fill('Không lưu');
  await page.getByRole('button',{name:'Close task form',exact:true}).click();
  await expect(page.locator('[data-testid^="calendar-event-"]')).toHaveCount(6);
  await page.getByTestId('calendar-slot-2026-09-30-11').click();
  await expect(page.getByRole('textbox',{name:'Task name',exact:true})).toHaveValue('');
});

test('time wheels support scrolling, midnight and cancel reset at 320px',async({page})=>{
  await enterCalendar(page,320);
  await page.getByTestId('calendar-slot-2026-09-29-11').click();
  await expect(page.getByRole('textbox',{name:'Start hour',exact:true})).toHaveCount(0);
  const start=page.getByRole('spinbutton',{name:'Start hour',exact:true});
  const end=page.getByRole('spinbutton',{name:'End hour',exact:true});
  const minute=page.getByRole('spinbutton',{name:'End minute',exact:true});
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
  await page.getByRole('textbox',{name:'Task name',exact:true}).fill('Kết thúc ngày');
  await page.waitForTimeout(300);
  await page.screenshot({path:'/private/tmp/task-time-wheels-320.png'});
  await page.getByRole('button',{name:'Create task',exact:true}).click();
  await expect(page.getByRole('button',{name:/^Kết thúc ngày, 2026-09-29, 23:00 to 24:00/})).toHaveCount(1);
  await page.getByTestId('calendar-slot-2026-09-29-11').click();
  await expect(start).toHaveAttribute('aria-valuetext','11');
  await expect(minute).toHaveAttribute('aria-valuetext','30');
});
