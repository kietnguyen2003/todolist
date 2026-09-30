import { dateKey, localDate } from '../today/model.ts';
import type { TaskColor } from '../theme.ts';

export type CalendarEvent = {
  id: string;
  taskId?: string;
  title: string;
  date: string;
  /** Minutes since local midnight; end may be 1440 (24:00). */
  start: number;
  end: number;
  done?: boolean;
  endEstimated?: boolean;
  untimed?: boolean;
  recurrence?: 'weekly' | 'monthly';
  color?: TaskColor;
  tone: 'rose' | 'navy' | 'cream';
};
export type PositionedEvent = {
  event: CalendarEvent;
  column: number;
  columns: number;
  top: number;
  height: number;
};
export const PIXELS_PER_MINUTE = 1.2;
export const DAY_HEIGHT = 1440 * PIXELS_PER_MINUTE;
export const MIN_EVENT_HEIGHT = 44;

export function formatWeekRange(start:string,end:string):string {
  const first=localDate(start),last=localDate(end);
  const month=(date:Date)=>new Intl.DateTimeFormat('en',{month:'short'}).format(date);
  const a=`${month(first)} ${first.getDate()}`;
  const b=`${month(last)} ${last.getDate()}`;
  if(first.getFullYear()!==last.getFullYear()) return `${a}, ${first.getFullYear()} – ${b}, ${last.getFullYear()}`;
  if(first.getMonth()===last.getMonth()) return `${month(first)} ${first.getDate()}–${last.getDate()}`;
  return `${a} – ${b}`;
}

export function formatTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function isValidEvent(event: CalendarEvent): boolean {
  return Boolean(event.id && event.title.trim())
    && /^\d{4}-\d{2}-\d{2}$/.test(event.date)
    && dateKey(localDate(event.date)) === event.date
    && Number.isInteger(event.start) && Number.isInteger(event.end)
    && event.start >= 0 && event.end <= 1440 && event.start < event.end;
}

function positionCluster(cluster: Omit<PositionedEvent, 'column' | 'columns'>[]): PositionedEvent[] {
  const ends: number[] = [];
  const positioned = cluster.map(item => {
    const available = ends.findIndex(end => end <= item.top);
    const column = available < 0 ? ends.length : available;
    ends[column] = item.top + item.height;
    return { ...item, column };
  });
  return positioned.map(item => ({ ...item, columns: ends.length }));
}

/** Layout each date independently; visual touch bounds also participate in collisions. */
export function layoutEvents(events: readonly CalendarEvent[]): PositionedEvent[] {
  const boxes = events.filter(isValidEvent).map(event => ({
    event,
    top: Math.min(event.start * PIXELS_PER_MINUTE, DAY_HEIGHT - MIN_EVENT_HEIGHT),
    height: Math.max(MIN_EVENT_HEIGHT, (event.end - event.start) * PIXELS_PER_MINUTE),
  })).sort((a, b) => a.event.date.localeCompare(b.event.date) || a.top - b.top || b.height - a.height || a.event.id.localeCompare(b.event.id));
  const result: PositionedEvent[] = [];
  let cluster: typeof boxes = [];
  let clusterEnd = 0;
  for (const box of boxes) {
    if (cluster.length && (box.event.date !== cluster[0].event.date || box.top >= clusterEnd)) {
      result.push(...positionCluster(cluster));
      cluster = [];
      clusterEnd = 0;
    }
    cluster.push(box);
    clusterEnd = Math.max(clusterEnd, box.top + box.height);
  }
  return [...result, ...positionCluster(cluster)];
}
