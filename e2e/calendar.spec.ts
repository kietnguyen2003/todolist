import {test,expect,type Page} from './fixtures';
test('phone calendar fits all seven days horizontally and slot taps keep the correct time', async ({page})=>{
  await page.clock.install({time:new Date('2026-10-02T10:00:00+07:00')});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Go to Calendar'}).click();
  const slot=page.getByTestId('calendar-slot-2026-10-02-12');
  const initial=(await slot.boundingBox())!.width;
  await page.getByRole('button',{name:'Zoom out'}).click();
  await expect.poll(async()=>(await slot.boundingBox())!.width).toBeLessThan(initial);
  await page.getByRole('button',{name:'Fit week'}).click();
  const calendar=(await page.getByTestId('calendar-viewport').boundingBox())!;
  const days=page.locator('[data-testid^="calendar-day-"]');
  await expect(days).toHaveCount(7);
  for(const day of await days.all()) {
    const box=(await day.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(calendar.x-1);
    expect(box.x+box.width).toBeLessThanOrEqual(calendar.x+calendar.width+1);
  }
  const fitted=(await slot.boundingBox())!.width;
  await page.getByRole('button',{name:'Zoom in'}).click();
  await expect.poll(async()=>(await slot.boundingBox())!.width).toBeGreaterThan(fitted);
  await page.getByRole('button',{name:'Fit week'}).click();
  await slot.click();
  await expect(page.getByRole('spinbutton',{name:'Start hour'})).toHaveAttribute('aria-valuetext','12');
});
test('Fit week also displays all seven days on a narrow phone',async({page})=>{
  await page.setViewportSize({width:320,height:700});
  await page.goto('/');
  await page.getByRole('button',{name:'Go to Calendar'}).click();
  await page.getByRole('button',{name:'Fit week'}).click();
  const viewport=(await page.getByTestId('calendar-viewport').boundingBox())!;
  const last=(await page.locator('[data-testid^="calendar-day-"]').last().boundingBox())!;
  expect(last.x+last.width).toBeLessThanOrEqual(viewport.x+viewport.width+1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('pinching the phone calendar changes day widths without changing hour heights',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Go to Calendar'}).click();
  const slot=page.locator('[data-testid^="calendar-slot-"]').first();
  const initialWidth=(await slot.boundingBox())!.width;
  const initialHeight=(await slot.boundingBox())!.height;
  const box=(await page.getByTestId('calendar-timeline').boundingBox())!;
  const x=box.x+box.width/2,y=box.y+box.height/2;
  const session=await page.context().newCDPSession(page);
  await session.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-25,y,id:1},{x:x+25,y,id:2}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-60,y,id:1},{x:x+60,y,id:2}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(async()=>(await slot.boundingBox())!.width).toBeGreaterThan(initialWidth);
  const expanded=(await slot.boundingBox())!.width;
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-60,y,id:3},{x:x+60,y,id:4}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-25,y,id:3},{x:x+25,y,id:4}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(async()=>(await slot.boundingBox())!.width).toBeLessThan(expanded);
  expect((await slot.boundingBox())!.height).toBeCloseTo(initialHeight,0);
});
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
