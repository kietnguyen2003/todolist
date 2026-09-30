import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTaskDraft,todayReducer,type Task} from '../src/today/model.ts';
import {createSampleData} from './fixtures/sampleData.ts';
import {tasksToCalendarEvents} from '../src/calendar/taskEvents.ts';
test('new calendar task is added immutably with exact time and no habit changes',()=>{
  const state=createSampleData('2026-09-29');
  const task:Task={id:'new',title:' Viết báo cáo ',date:'2026-09-30',time:'11:00',endTime:'12:00',done:false,icon:'check-square'};
  const next=todayReducer(state,{type:'addTask',task});
  assert.equal(next.tasks.length,state.tasks.length+1);
  assert.equal(next.tasks.at(-1)?.title,'Viết báo cáo');
  assert.equal(next.habits,state.habits);
  assert.equal(next.counts,state.counts);
  assert.equal(tasksToCalendarEvents(next.tasks).at(-1)?.end,720);
  assert.equal(todayReducer(next,{type:'addTask',task}),next);
  assert.equal(todayReducer(state,{type:'addTask',task:{...task,title:' '}}),state);
});
test('task draft requires valid title date and increasing same-day hours',()=>{
  assert.deepEqual(validateTaskDraft('Tên','2026-09-29','23:30','24:00'),{});
  assert.ok(validateTaskDraft(' ','2026-09-29','11:00','12:00').title);
  assert.ok(validateTaskDraft('a'.repeat(121),'2026-09-29','11:00','12:00').title);
  assert.ok(validateTaskDraft('Tên','2026-02-30','11:00','12:00').date);
  assert.ok(validateTaskDraft('Tên','2026-09-29','24:00','24:00').time);
  for(const end of ['10:00','11:00','99:00','12:99','']) assert.ok(validateTaskDraft('Tên','2026-09-29','11:00',end).endTime);
});

test('legacy tasks without a time remain in todo and display all day on the calendar',()=>{
  const state=createSampleData('2026-09-29');
  const task:Task={id:'untimed',title:'Mua bánh mì',date:'2026-09-29',done:false,icon:'check-square'};
  assert.deepEqual(validateTaskDraft(task.title,task.date),{});
  const next=todayReducer(state,{type:'addTask',task});
  assert.ok(next.tasks.some(item=>item.id==='untimed'));
  const event=tasksToCalendarEvents(next.tasks).find(item=>item.id==='untimed');
  assert.equal(event?.start,0);
  assert.equal(event?.end,1440);
});
