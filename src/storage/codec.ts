import { dateKey, localDate, type TodayState } from '../today/model.ts';

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
      || !text(task.title, 120) || (task.time !== undefined && !clock(task.time)) || typeof task.done !== 'boolean'
      || !['book-open', 'shopping-bag', 'mail', 'check-square'].includes(String(task.icon))) return false;
    if (task.endTime !== undefined && (!task.time || !(clock(task.endTime) || task.endTime === '24:00') || task.endTime <= task.time)) return false;
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
    throw new Error('Dữ liệu lưu trên máy không hợp lệ hoặc thuộc phiên bản chưa hỗ trợ.');
  }
  return envelope.state;
}
export function encodeTodayState(state: TodayState): string {
  if (!validState(state)) throw new Error('Không thể lưu dữ liệu không hợp lệ.');
  return JSON.stringify({ version: TODAY_STORAGE_VERSION, state });
}
