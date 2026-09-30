import { dateKey, localDate, taskOccursOn, type TodayState, type Task } from '../today/model.ts';
import { isTaskColor } from '../theme.ts';

export const TODAY_STORAGE_KEY = 'tung-buoc:today:v1';
export const TODAY_STORAGE_VERSION = 1;
export function emptyTodayState(): TodayState { return { tasks: [], habits: [], counts: {} }; }

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function text(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}
function identifier(value: unknown): value is string {
  return text(value, 200) && !['__proto__', 'constructor', 'prototype'].includes(value);
}
function date(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && dateKey(localDate(value)) === value;
}
function quantity(value: unknown, min: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= 100000;
}
function clock(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
function validState(value: unknown): value is TodayState {
  if (!record(value) || !Array.isArray(value.tasks) || !Array.isArray(value.habits) || !record(value.counts)) return false;
  const taskIds = new Set<string>();
  for (const task of value.tasks) {
    if (!record(task) || !identifier(task.id) || taskIds.has(task.id) || !date(task.date)
      || !text(task.title, 120) || (task.time !== undefined && !clock(task.time))
      || (task.calendarStartTime !== undefined && !clock(task.calendarStartTime)) || typeof task.done !== 'boolean'
      || (task.recurrence !== undefined && !['weekly','monthly'].includes(String(task.recurrence)))
      || (task.color !== undefined && !isTaskColor(task.color))
      || !['book-open', 'shopping-bag', 'mail', 'check-square'].includes(String(task.icon))) return false;
    if (task.endTime !== undefined && (!task.time || !(clock(task.endTime) || task.endTime === '24:00') || task.endTime <= task.time)) return false;
    if (task.completedDates !== undefined && (!task.recurrence || !Array.isArray(task.completedDates)
      || new Set(task.completedDates).size !== task.completedDates.length
      || task.completedDates.some(day=>!date(day) || day<=(task.date as string) || !taskOccursOn(task as Task,day)))) return false;
    taskIds.add(task.id);
  }
  const habits = new Map<string, string>();
  for (const habit of value.habits) {
    if (!record(habit) || !identifier(habit.id) || habits.has(habit.id) || !date(habit.startDate)
      || !text(habit.name, 60) || !text(habit.unit, 20) || !quantity(habit.target, 1)
      || !['droplet', 'book-open', 'activity'].includes(String(habit.icon))) return false;
    habits.set(habit.id, habit.startDate);
  }
  for (const [day, counts] of Object.entries(value.counts)) {
    if (!date(day) || !record(counts)) return false;
    for (const [id, count] of Object.entries(counts)) {
      const start = habits.get(id);
      if (!start || day < start || !quantity(count, 0)) return false;
    }
  }
  return true;
}

export function decodeTodayState(raw: string | null): TodayState {
  if (raw === null) return emptyTodayState();
  const envelope: unknown = JSON.parse(raw);
  if (!record(envelope) || envelope.version !== TODAY_STORAGE_VERSION || !validState(envelope.state)) {
    throw new Error('Saved data is invalid or uses an unsupported version.');
  }
  return envelope.state;
}
export function encodeTodayState(state: TodayState): string {
  if (!validState(state)) throw new Error('Cannot save invalid data.');
  return JSON.stringify({ version: TODAY_STORAGE_VERSION, state });
}
