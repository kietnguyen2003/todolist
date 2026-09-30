import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDays, dateKey, weekDates, validateHabitDraft, todayReducer, habitCount, tasksForDate, type TodayState } from '../src/today/model.ts';
const state: TodayState = {
  tasks: [{id:'t1',date:'2026-09-27',title:'Việc đầu tiên',time:'09:00',done:false,icon:'book-open'}],
  habits: [{id:'h1',name:'Uống nước',target:8,unit:'cốc',startDate:'2026-09-26',icon:'droplet'}],
  counts: {},
};
test('local calendar safely crosses months and years', () => {
  assert.equal(dateKey(new Date(2026,8,27)), '2026-09-27');
  assert.equal(addDays('2026-12-31',1),'2027-01-01');
  assert.equal(addDays('2026-03-01',-1),'2026-02-28');
  assert.deepEqual(weekDates('2026-09-27'), ['2026-09-21','2026-09-22','2026-09-23','2026-09-24','2026-09-25','2026-09-26','2026-09-27']);
});
test('task completion is reversible and scoped by date', () => {
  const next=todayReducer(state,{type:'toggleTask',id:'t1',date:'2026-09-27'});
  assert.equal(next.tasks[0].done,true);
  assert.equal(state.tasks[0].done,false);
  assert.equal(todayReducer(next,{type:'toggleTask',id:'t1',date:'2026-09-27'}).tasks[0].done,false);
  assert.equal(todayReducer(state,{type:'toggleTask',id:'t1',date:'2026-09-28'}).tasks[0].done,false);
  assert.equal(tasksForDate(state,'2026-09-28').length,0);
});
test('habit quantity persists by date, permits exceeding target and rejects invalid input', () => {
  const next=todayReducer(state,{type:'setCount',id:'h1',date:'2026-09-27',count:10});
  assert.equal(habitCount(next,'h1','2026-09-27'),10);
  assert.equal(habitCount(next,'h1','2026-09-28'),0);
  assert.equal(habitCount(state,'h1','2026-09-27'),0);
  for(const count of [-1,NaN,Infinity,1.5,100001]) assert.deepEqual(todayReducer(next,{type:'setCount',id:'h1',date:'2026-09-27',count}),next);
  assert.deepEqual(todayReducer(state,{type:'setCount',id:'missing',date:'2026-09-27',count:3}),state);
  assert.deepEqual(todayReducer(state,{type:'setCount',id:'h1',date:'2026-09-25',count:3}),state);
});
test('validates daily habits with generic units', () => {
  assert.deepEqual(validateHabitDraft(' Uống nước ','8','cốc'),{});
  assert.deepEqual(validateHabitDraft('Đọc sách','30','phút'),{});
  for(const target of ['','0','-1','2.5','1e3','Infinity','100001']) assert.ok(validateHabitDraft('Tên',target,'lần').target);
  assert.ok(validateHabitDraft(' ','8',' ').name);
  assert.ok(validateHabitDraft('a'.repeat(61),'8','a'.repeat(21)).unit);
});
test('creates immutable daily habit and rejects duplicate or invalid drafts', () => {
  const habit={id:'h2',name:'Đọc sách',target:20,unit:'trang',startDate:'2026-09-27',icon:'book-open' as const};
  const next=todayReducer(state,{type:'addHabit',habit});
  assert.equal(next.habits.length,2);
  assert.equal(state.habits.length,1);
  assert.deepEqual(todayReducer(next,{type:'addHabit',habit}),next);
  assert.deepEqual(todayReducer(state,{type:'addHabit',habit:{...habit,target:0}}),state);
});

test('editing a habit keeps its identity, start date and existing daily progress', () => {
  const withProgress=todayReducer(state,{type:'setCount',id:'h1',date:'2026-09-27',count:8});
  const updated=todayReducer(withProgress,{type:'updateHabit',id:'h1',name:'Read',target:12,unit:'pages'});
  assert.deepEqual(updated.habits[0],{...state.habits[0],name:'Read',target:12,unit:'pages'});
  assert.equal(habitCount(updated,'h1','2026-09-27'),8);
  assert.deepEqual(withProgress.habits,state.habits);
  assert.equal(todayReducer(updated,{type:'updateHabit',id:'h1',name:' ',target:12,unit:'pages'}),updated);
});

test('deleting a habit removes its daily counts without touching other habits', () => {
  const second={id:'h2',name:'Walk',target:5,unit:'steps',startDate:'2026-09-26',icon:'activity' as const};
  const populated={...state,habits:[...state.habits,second],counts:{'2026-09-27':{h1:8,h2:4},'2026-09-28':{h1:7,h2:5}}};
  const deleted=todayReducer(populated,{type:'deleteHabit',id:'h1'});
  assert.deepEqual(deleted.habits,[second]);
  assert.deepEqual(deleted.counts,{'2026-09-27':{h2:4},'2026-09-28':{h2:5}});
  assert.deepEqual(populated.counts['2026-09-27'],{h1:8,h2:4});
});

test('daily tasks are sorted by start time without mutating saved order',()=>{
  const tasks=[
    {...state.tasks[0],id:'late',time:'18:00'},
    {...state.tasks[0],id:'early',time:'08:00'},
    {...state.tasks[0],id:'middle',time:'12:00'},
  ];
  assert.deepEqual(tasksForDate({...state,tasks},'2026-09-27').map(task=>task.id),['early','middle','late']);
  assert.deepEqual(tasks.map(task=>task.id),['late','early','middle']);
});

test('weekly and monthly tasks appear only on matching dates and completion is per occurrence',()=>{
  const recurring={...state.tasks[0],date:'2026-01-31',recurrence:'monthly' as const,done:false};
  const weekly={...state.tasks[0],id:'weekly',date:'2026-09-28',recurrence:'weekly' as const,done:false};
  const seeded={...state,tasks:[recurring,weekly]};
  assert.deepEqual(tasksForDate(seeded,'2026-02-28'),[]);
  assert.deepEqual(tasksForDate(seeded,'2026-03-31').map(task=>task.id),['t1']);
  assert.deepEqual(tasksForDate(seeded,'2026-10-05').map(task=>task.id),['weekly']);
  const completed=todayReducer(seeded,{type:'toggleTask',id:'weekly',date:'2026-10-05'});
  assert.equal(tasksForDate(completed,'2026-10-05')[0].done,true);
  assert.equal(tasksForDate(completed,'2026-09-28')[0].done,false);
  assert.deepEqual(completed.tasks[1].completedDates,['2026-10-05']);
  assert.equal(todayReducer(completed,{type:'toggleTask',id:'weekly',date:'2026-10-05'}).tasks[1].completedDates?.length,0);
});
test('changing a task color updates the saved task without changing completion',()=>{
  const updated=todayReducer(state,{type:'setTaskColor',id:'t1',color:'sage'});
  assert.equal(updated.tasks[0].color,'sage');
  assert.equal(updated.tasks[0].done,false);
  assert.equal(state.tasks[0].color,undefined);
});
