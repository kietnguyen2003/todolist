import {test,expect} from '@playwright/test';

test('an untimed task fills the calendar from creation until midnight; timed tasks keep exact hours',async({page})=>{
  await page.clock.install({time:new Date('2026-09-30T12:00:00+07:00')});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Add task',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Add task',exact:true})).toBeVisible();
  await expect(page.getByRole('radio',{name:'No time',exact:true})).toHaveAttribute('aria-checked','true');
  await expect(page.getByRole('spinbutton',{name:'Start hour'})).toHaveCount(0);
  await page.getByRole('textbox',{name:'Task name',exact:true}).fill('Open task');
  await page.getByRole('button',{name:'Create task',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'Open task',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Go to Calendar',exact:true}).click();
  await expect(page.locator('[data-testid^="calendar-event-"]')).toHaveCount(1);
  await expect(page.getByRole('button',{name:/^Open task,.*12:00 to 24:00/})).toBeVisible();
  await page.getByRole('button',{name:'Go to To do',exact:true}).click();
  await page.getByRole('button',{name:'Add task',exact:true}).click();
  await page.getByRole('radio',{name:'Set time',exact:true}).click();
  await expect(page.getByRole('spinbutton',{name:'Start hour'})).toBeVisible();
  await page.getByRole('textbox',{name:'Task name',exact:true}).fill('Timed task');
  await page.getByRole('button',{name:'Duration 60 minutes',exact:true}).click();
  await page.getByRole('button',{name:'Create task',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'Timed task',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Go to Calendar',exact:true}).click();
  await expect(page.locator('[data-testid^="calendar-event-"]')).toHaveCount(2);
  await expect(page.getByRole('button',{name:/^Timed task,.*09:00 to 10:00/})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('checkbox',{name:'Open task',exact:true})).toBeVisible();
  await expect(page.getByRole('checkbox',{name:'Timed task',exact:true})).toBeVisible();
});

test('editing the task date opens that day after creation',async({page})=>{
  await page.clock.install({time:new Date('2026-09-30T12:00:00+07:00')});
  await page.goto('/');
  await page.getByRole('button',{name:'Add task',exact:true}).click();
  await page.getByRole('textbox',{name:'Task name',exact:true}).fill('Tomorrow task');
  await page.getByRole('textbox',{name:'Date',exact:true}).fill('2026-10-01');
  await page.getByRole('button',{name:'Create task',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'Tomorrow task',exact:true})).toBeVisible();
});

test('an untimed task added from a calendar slot starts at that slot',async({page})=>{
  await page.clock.install({time:new Date('2026-09-30T10:00:00+07:00')});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Go to Calendar',exact:true}).click();
  await page.getByTestId('calendar-slot-2026-09-30-15').click();
  await page.getByRole('radio',{name:'No time',exact:true}).click();
  await page.getByRole('textbox',{name:'Task name',exact:true}).fill('Afternoon task');
  await page.getByRole('button',{name:'Create task',exact:true}).click();
  await expect(page.getByRole('button',{name:/^Afternoon task, 2026-09-30, 15:00 to 24:00, no time set/})).toBeVisible();
});
