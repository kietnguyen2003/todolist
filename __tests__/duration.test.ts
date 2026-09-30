import test from 'node:test';
import assert from 'node:assert/strict';
import { formatHabitQuantity, formatHabitProgress, displayUnit } from '../src/today/quantity.ts';

test('duration quantities display hours and minutes from stored minutes', () => {
  assert.equal(formatHabitQuantity(90, 'hours and minute'), '1 hr 30 min');
  assert.equal(formatHabitQuantity(0, 'hours and minute'), '0 hr 0 min');
  assert.equal(formatHabitQuantity(6059, 'hours and minute'), '100 hr 59 min');
  assert.equal(formatHabitQuantity(8, 'liter'), '8 liters');
});

test('count units agree with the selected target and support time',()=>{
  assert.equal(displayUnit('steps',1),'step');
  assert.equal(displayUnit('steps',2),'steps');
  assert.equal(displayUnit('liter',2),'liters');
  assert.equal(displayUnit('time',1),'time');
  assert.equal(displayUnit('time',2),'times');
  assert.equal(formatHabitProgress(0,1,'steps'),'0 / 1 step');
  assert.equal(formatHabitProgress(1,2,'time'),'1 / 2 times');
});
