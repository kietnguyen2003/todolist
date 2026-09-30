import test from 'node:test';
import assert from 'node:assert/strict';
import { formatHabitQuantity } from '../src/today/quantity.ts';

test('duration quantities display hours and minutes from stored minutes', () => {
  assert.equal(formatHabitQuantity(90, 'hours and minute'), '1 hr 30 min');
  assert.equal(formatHabitQuantity(0, 'hours and minute'), '0 hr 0 min');
  assert.equal(formatHabitQuantity(6059, 'hours and minute'), '100 hr 59 min');
  assert.equal(formatHabitQuantity(8, 'liter'), '8 liter');
});
