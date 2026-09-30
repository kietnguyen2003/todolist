import { taskForDate, taskOccursOn, type Task } from '../today/model.ts';
import type { CalendarEvent } from './model.ts';

const DEFAULT_DURATION_MINUTES = 30;
function minutes(time: string | undefined): number | null {
  if (!time || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}
/** A projection of the shared task state; habits never enter this adapter. */
export function tasksToCalendarEvents(tasks: readonly Task[], dates?: readonly string[]): CalendarEvent[] {
  return tasks.flatMap(source => (dates??[source.date]).filter(date=>taskOccursOn(source,date)).map(date=>({task:taskForDate(source,date),originalDate:source.date}))).flatMap(({task,originalDate}) => {
    const untimed=!task.time;
    const start = untimed ? minutes(task.calendarStartTime) ?? 0 : minutes(task.time);
    if (start === null) return [];
    const explicitEnd = task.endTime === '24:00' ? 1440 : minutes(task.endTime);
    const endEstimated = !untimed && (explicitEnd === null || explicitEnd <= start);
    return [{
      id: task.date===originalDate?task.id:`${task.id}@${task.date}`, taskId:task.id, title: task.title, date: task.date, start,
      end: untimed ? 1440 : endEstimated ? Math.min(start + DEFAULT_DURATION_MINUTES, 1440) : explicitEnd!,
      endEstimated, untimed, done: task.done, recurrence:task.recurrence, color:task.color??'navy', tone: task.done ? 'cream' as const : 'navy' as const,
    }];
  });
}
