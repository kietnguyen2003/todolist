import type { Task } from '../today/model.ts';
import type { CalendarEvent } from './model.ts';

const DEFAULT_DURATION_MINUTES = 30;
function minutes(time: string | undefined): number | null {
  if (!time || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}
/** A projection of the shared task state; habits never enter this adapter. */
export function tasksToCalendarEvents(tasks: readonly Task[]): CalendarEvent[] {
  return tasks.flatMap(task => {
    const start = minutes(task.time);
    if (start === null) return [];
    const explicitEnd = task.endTime === '24:00' ? 1440 : minutes(task.endTime);
    const endEstimated = explicitEnd === null || explicitEnd <= start;
    return [{
      id: task.id, title: task.title, date: task.date, start,
      end: endEstimated ? Math.min(start + DEFAULT_DURATION_MINUTES, 1440) : explicitEnd,
      endEstimated, done: task.done, tone: task.done ? 'cream' as const : 'navy' as const,
    }];
  });
}
