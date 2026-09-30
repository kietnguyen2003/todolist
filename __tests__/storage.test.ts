import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeTodayState, encodeTodayState, emptyTodayState } from '../src/storage/codec.ts';
import { createSampleData } from './fixtures/sampleData.ts';

test('local storage round trips empty and existing state without seeding data', () => {
  for (const state of [emptyTodayState(), createSampleData('2026-09-29')]) {
    assert.deepEqual(decodeTodayState(encodeTodayState(state)), state);
  }
  assert.deepEqual(decodeTodayState(null), { tasks: [], habits: [], counts: {} });
});

test('local storage rejects corrupt and unsupported envelopes', () => {
  for (const raw of ['{', '{}', 'null', JSON.stringify({ version: 2, state: emptyTodayState() })]) {
    assert.throws(() => decodeTodayState(raw));
  }
});

test('local storage validates dates, identities, quantities and icons before hydration', () => {
  const sample = createSampleData('2026-09-29');
  const invalid = [
    { ...sample, tasks: [{ ...sample.tasks[0], date: '2026-02-30' }] },
    { ...sample, tasks: [{ ...sample.tasks[0], time: '25:00' }] },
    { ...sample, tasks: [{ ...sample.tasks[0], endTime: '08:00' }] },
    { ...sample, tasks: [{ ...sample.tasks[0], done: 'false' }] },
    { ...sample, tasks: [sample.tasks[0], sample.tasks[0]] },
    { ...sample, habits: [{ ...sample.habits[0], target: 0 }] },
    { ...sample, habits: [{ ...sample.habits[0], icon: 'unknown' }] },
    { ...sample, habits: [{ ...sample.habits[0], id: '__proto__' }] },
    { ...sample, counts: { '2026-02-30': { water: 1 } } },
    { ...sample, counts: { '2026-09-29': { water: -1 } } },
    { ...sample, counts: { '2026-09-29': { water: 1.5 } } },
    { ...sample, counts: { '2026-09-29': { water: 100001 } } },
    { ...sample, counts: { '2026-09-29': { missing: 1 } } },
    { ...sample, counts: { '2025-01-01': { water: 1 } } },
  ];
  for (const state of invalid) assert.throws(() => decodeTodayState(JSON.stringify({ version: 1, state })));
});

test('untimed task survives storage roundtrip',()=>{
  const state=emptyTodayState();
  state.tasks=[{id:'untimed',title:'Chỉ to-do',date:'2026-09-29',done:false,icon:'check-square'}];
  assert.deepEqual(decodeTodayState(encodeTodayState(state)),state);
});

test('repeating colored tasks survive storage and reject invalid occurrence data',()=>{
  const base={id:'repeat',title:'Review',date:'2026-09-29',time:'09:00',endTime:'10:00',done:false,icon:'check-square' as const,recurrence:'weekly' as const,color:'sage' as const,completedDates:['2026-10-06']};
  const state={...emptyTodayState(),tasks:[base]};
  assert.deepEqual(decodeTodayState(encodeTodayState(state)),state);
  for(const task of [{...base,color:'blue'},{...base,recurrence:'daily'},{...base,completedDates:['2026-10-07']},{...base,completedDates:['2026-10-06','2026-10-06']}]) {
    assert.throws(()=>encodeTodayState({...state,tasks:[task as typeof base]}));
  }
});
