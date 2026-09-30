import test from 'node:test';
import assert from 'node:assert/strict';
import { tasksToCalendarEvents } from '../src/calendar/taskEvents.ts';
import { createSampleData } from './fixtures/sampleData.ts';
import { todayReducer } from '../src/today/model.ts';

test('calendar derives only tasks and tracks completion without copying state',()=>{
  const state=createSampleData('2026-09-29');
  const events=tasksToCalendarEvents(state.tasks);
  assert.equal(events.length,state.tasks.length);
  assert.deepEqual(events.map(e=>e.id),state.tasks.map(t=>t.id));
  assert.equal(events[0].title,state.tasks[0].title);
  assert.equal(events[0].start,540);
  assert.equal(events[0].end,570);
  assert.equal(events[0].endEstimated,true);
  const updated=todayReducer(state,{type:'toggleTask',id:'shopping',date:'2026-09-29'});
  assert.equal(tasksToCalendarEvents(updated.tasks)[0].done,true);
  assert.equal(events[0].done,false);
});
test('task calendar validates times, supports explicit ends and caps at midnight',()=>{
  const task=createSampleData('2026-09-29').tasks[0];
  assert.equal(tasksToCalendarEvents([{...task,time:'23:50'}])[0].end,1440);
  assert.equal(tasksToCalendarEvents([{...task,endTime:'10:00'}])[0].end,600);
  assert.equal(tasksToCalendarEvents([{...task,endTime:'10:00'}])[0].endEstimated,false);
  assert.deepEqual(tasksToCalendarEvents([{...task,time:'25:00'},{...task,time:'09:99'}]),[]);
  assert.equal(tasksToCalendarEvents([{...task,endTime:'08:00'}])[0].endEstimated,true);
});
