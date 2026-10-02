import { addDays, dateKey, habitCount, localDate, weekDates, type Habit, type TodayState } from '../today/model.ts';

export type TrackerView = 'week' | 'month' | 'year';
export type TrackerStatus = 'inapplicable' | 'missed' | 'partial' | 'complete';
export type TrackerDay = {
  date: string;
  count: number;
  target: number;
  percent: number;
  progress: number;
  status: TrackerStatus;
  eligible: boolean;
};

function datesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  for (let date = start; date <= end; date = addDays(date, 1)) dates.push(date);
  return dates;
}

export function periodDates(view: TrackerView, anchor: string): string[] {
  if (view === 'week') return weekDates(anchor);
  const date = localDate(anchor);
  const year = date.getFullYear();
  if (view === 'month') {
    const month = date.getMonth();
    return datesBetween(dateKey(new Date(year, month, 1, 12)), dateKey(new Date(year, month + 1, 0, 12)));
  }
  return datesBetween(`${year}-01-01`, `${year}-12-31`);
}

export function gridDates(view: TrackerView, anchor: string): string[] {
  const dates = periodDates(view, anchor);
  if (view === 'week') return dates;
  const firstWeek = weekDates(dates[0]);
  const lastWeek = weekDates(dates.at(-1)!);
  return datesBetween(firstWeek[0], lastWeek[6]);
}

export function shiftPeriod(view: TrackerView, anchor: string, direction: -1 | 1): string {
  if (view === 'week') return addDays(anchor, direction * 7);
  const date = localDate(anchor);
  if (view === 'month') return dateKey(new Date(date.getFullYear(), date.getMonth() + direction, 1, 12));
  return `${date.getFullYear() + direction}-01-01`;
}

export function trackerDay(state: TodayState, habit: Habit, date: string, today: string): TrackerDay {
  const count = habitCount(state, habit.id, date);
  const percent = Math.round(count / habit.target * 100);
  const applicable = date >= habit.startDate && date <= today;
  const status: TrackerStatus = !applicable ? 'inapplicable' : count >= habit.target ? 'complete' : count > 0 ? 'partial' : 'missed';
  return {
    date, count, target: habit.target, percent,
    progress: Math.min(1, count / habit.target), status,
    eligible: applicable && (date < today || status === 'complete'),
  };
}

export function trackerSummary(state: TodayState, habit: Habit, dates: readonly string[], today: string) {
  const days = dates.map(date => trackerDay(state, habit, date, today)).filter(day => day.eligible);
  const completed = days.filter(day => day.status === 'complete').length;
  return { completed, eligible: days.length, percent: days.length ? Math.round(completed / days.length * 100) : null };
}

export function yearMonthMarkers(dates: readonly string[]) {
  const year = Number(dates[Math.floor(dates.length / 2)].slice(0, 4));
  return Array.from({ length: 12 }, (_, index) => {
    const date = `${year}-${String(index + 1).padStart(2, '0')}-01`;
    return { label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(localDate(date)), week: Math.floor(dates.indexOf(date) / 7) };
  });
}
