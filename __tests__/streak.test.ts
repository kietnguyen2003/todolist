import assert from 'node:assert/strict';
import { test } from 'node:test';
import { habitStreak, todayReducer, type TodayState } from '../src/today/model.ts';
const state:TodayState={tasks:[],habits:[{id:'water',name:'Uống nước',target:8,unit:'cốc',startDate:'2026-09-20',icon:'droplet'}],counts:{
  '2026-09-20':{water:8},'2026-09-21':{water:10},'2026-09-22':{water:8},'2026-09-23':{water:3},'2026-09-24':{water:8},
}};
test('counts completed consecutive days, not quantities or future entries',()=>{
  assert.equal(habitStreak(state,'water','2026-09-20'),1);
  assert.equal(habitStreak(state,'water','2026-09-21'),2);
  assert.equal(habitStreak(state,'water','2026-09-22'),3);
});
test('unfinished selected date keeps previous chain, missed day breaks it',()=>{
  assert.equal(habitStreak(state,'water','2026-09-23'),3);
  assert.equal(habitStreak(state,'water','2026-09-24'),1);
  assert.equal(habitStreak(state,'water','2026-09-25'),1);
  assert.equal(habitStreak(state,'water','2026-09-26'),0);
});
test('completion and undo recompute the chain without incrementing twice',()=>{
  const completed=todayReducer(state,{type:'setCount',id:'water',date:'2026-09-23',count:8});
  assert.equal(habitStreak(completed,'water','2026-09-24'),5);
  const extra=todayReducer(completed,{type:'setCount',id:'water',date:'2026-09-23',count:9});
  assert.equal(habitStreak(extra,'water','2026-09-24'),5);
  const undone=todayReducer(extra,{type:'setCount',id:'water',date:'2026-09-23',count:7});
  assert.equal(habitStreak(undone,'water','2026-09-24'),1);
});
test('does not count before creation or across different habits',()=>{
  assert.equal(habitStreak(state,'missing','2026-09-22'),0);
  assert.equal(habitStreak(state,'water','2026-09-19'),0);
  assert.equal(habitStreak({...state,counts:{'2026-09-19':{water:8},'2026-09-20':{water:8}}},'water','2026-09-20'),1);
});
test('continues across leap day and month/year boundaries',()=>{
  const historical={...state,habits:[{...state.habits[0],startDate:'2023-12-01'}],counts:{
    '2023-12-31':{water:8},'2024-01-01':{water:8},
    '2024-02-28':{water:8},'2024-02-29':{water:8},'2024-03-01':{water:8},
  }};
  assert.equal(habitStreak(historical,'water','2024-01-01'),2);
  assert.equal(habitStreak(historical,'water','2024-03-01'),3);
});
