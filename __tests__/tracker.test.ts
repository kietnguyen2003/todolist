import assert from 'node:assert/strict';
import test from 'node:test';
import { addDays, type Habit, type TodayState } from '../src/today/model.ts';
import { gridDates, periodDates, shiftPeriod, trackerDay, trackerSummary, yearMonthMarkers } from '../src/tracker/model.ts';
import { createTrackerDemo } from '../src/tracker/sampleData.ts';
import { todayReducer } from '../src/today/model.ts';

const today='2026-10-02';
const habit:Habit={id:'water',name:'Uống nước',target:8,unit:'cốc',startDate:'2026-09-28',icon:'droplet'};
const state:TodayState={tasks:[],habits:[habit],counts:{
  '2026-09-29':{water:8},
  '2026-09-30':{water:3},
  '2026-10-01':{water:10},
  '2026-10-02':{water:4},
}};

test('daily progress distinguishes inapplicable, missed, partial, complete and over-target days',()=>{
  assert.equal(trackerDay(state,habit,'2026-09-27',today).status,'inapplicable');
  assert.equal(trackerDay(state,habit,'2026-10-03',today).status,'inapplicable');
  assert.equal(trackerDay(state,habit,'2026-09-28',today).status,'missed');
  assert.equal(trackerDay(state,habit,'2026-09-30',today).status,'partial');
  assert.equal(trackerDay(state,habit,'2026-09-29',today).status,'complete');
  const exceeded=trackerDay(state,habit,'2026-10-01',today);
  assert.equal(exceeded.count,10);
  assert.equal(exceeded.progress,1);
  assert.equal(exceeded.percent,125);
  assert.equal(exceeded.status,'complete');
});

test('completion rate excludes unfinished today but includes completed today and past missed days',()=>{
  const dates=periodDates('week',today);
  assert.deepEqual(dates,['2026-09-28','2026-09-29','2026-09-30','2026-10-01','2026-10-02','2026-10-03','2026-10-04']);
  assert.deepEqual(trackerSummary(state,habit,dates,today),{completed:2,eligible:4,percent:50});
  const finished={...state,counts:{...state.counts,[today]:{water:8}}};
  assert.deepEqual(trackerSummary(finished,habit,dates,today),{completed:3,eligible:5,percent:60});
  const newHabit={...habit,startDate:today};
  assert.deepEqual(trackerSummary(state,newHabit,dates,today),{completed:0,eligible:0,percent:null});
});

test('month and year grids include complete Monday to Sunday weeks, while summaries use only period days',()=>{
  const month=periodDates('month','2026-10-02');
  assert.equal(month.length,31);
  assert.equal(month[0],'2026-10-01');
  assert.equal(month.at(-1),'2026-10-31');
  const grid=gridDates('month','2026-10-02');
  assert.equal(grid[0],'2026-09-28');
  assert.equal(grid.at(-1),'2026-11-01');
  assert.equal(grid.length%7,0);
  const year=periodDates('year','2024-06-01');
  assert.equal(year.length,366);
  const yearGrid=gridDates('year','2024-06-01');
  assert.equal(yearGrid.length%7,0);
  assert.equal(yearGrid[0],addDays('2024-01-01',0));
  assert.equal(yearGrid.at(-1),'2025-01-05');
  assert.equal(yearMonthMarkers(yearGrid).length,12);
});

test('period controls move by exactly one week, month or year',()=>{
  assert.equal(shiftPeriod('week','2026-10-02',-1),'2026-09-25');
  assert.equal(shiftPeriod('month','2026-10-02',-1),'2026-09-01');
  assert.equal(shiftPeriod('year','2026-10-02',1),'2027-01-01');
});

test('demo history uses shared state only when requested and preserves existing data',()=>{
  const demo=createTrackerDemo(today);
  const empty:TodayState={tasks:[],habits:[],counts:{}};
  const loaded=todayReducer(empty,{type:'seedTrackerDemo',...demo});
  assert.equal(loaded.habits.length,3);
  const start=addDays(today,-20);
  assert.equal(loaded.counts[start]['demo-water'],10);
  assert.equal(loaded.counts[addDays(start,1)]['demo-water'],8);
  assert.equal(loaded.counts[addDays(start,2)]['demo-water'],3);
  assert.equal(loaded.counts[addDays(start,3)]?.['demo-water']??0,0);
  assert.equal(todayReducer(loaded,{type:'seedTrackerDemo',...demo}),loaded);
  assert.equal(todayReducer(state,{type:'seedTrackerDemo',...demo}),state);
});
