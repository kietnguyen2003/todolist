import { addDays, type Habit, type TodayState } from '../today/model.ts';

/** Optional examples are written to the same local state as Today, never kept in a tracker-only store. */
export function createTrackerDemo(today: string): { habits: Habit[]; counts: TodayState['counts'] } {
  const startDate = addDays(today, -20);
  const habits: Habit[] = [
    { id: 'demo-water', name: 'Drink water', target: 8, unit: 'cups', startDate, icon: 'droplet' },
    { id: 'demo-reading', name: 'Read', target: 20, unit: 'pages', startDate, icon: 'book-open' },
    { id: 'demo-movement', name: 'Move', target: 30, unit: 'minutes', startDate, icon: 'activity' },
  ];
  const counts: TodayState['counts'] = {};
  for (let index = 0; index <= 20; index += 1) {
    const date = addDays(startDate, index);
    const water = index === 20 ? 4 : [10, 8, 3, 0][index % 4];
    const reading = index === 20 ? 20 : [0, 20, 7, 24, 0][index % 5];
    const movement = index === 20 ? 0 : [30, 12, 0][index % 3];
    const day: Record<string, number> = {};
    if (water > 0) day['demo-water'] = water;
    if (reading > 0) day['demo-reading'] = reading;
    if (movement > 0) day['demo-movement'] = movement;
    if (Object.keys(day).length) counts[date] = day;
  }
  return { habits, counts };
}
