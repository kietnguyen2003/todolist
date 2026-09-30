import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatTime, formatWeekRange, layoutEvents, type CalendarEvent } from '../src/calendar/model.ts';
const event = (id:string,start:number,end:number,date='2026-09-29'):CalendarEvent => ({id,title:id,date,start,end,tone:'rose'});

test('calendar positions events by time and preserves input', () => {
  const input=[event('later',600,660),event('first',480,540)];
  const result=layoutEvents(input);
  assert.deepEqual(result.map(item=>[item.event.id,item.top,item.height,item.column,item.columns]),[
    ['first',576,72,0,1],['later',720,72,0,1],
  ]);
  assert.equal(input[0].id,'later');
  assert.equal(formatTime(0),'00:00');
  assert.equal(formatTime(1440),'24:00');
  assert.equal(formatTime(545),'09:05');
});
test('calendar packs chained overlaps into shared columns without obscuring events', () => {
  const result=layoutEvents([event('a',480,540),event('b',510,570),event('c',540,600)]);
  assert.deepEqual(result.map(item=>[item.column,item.columns]),[[0,2],[1,2],[0,2]]);
  const triple=layoutEvents([event('a',480,600),event('b',510,570),event('c',540,600)]);
  assert.ok(triple.every(item=>item.columns===3));
  assert.equal(new Set(triple.map(item=>item.column)).size,3);
});
test('calendar touching endpoints and different dates do not overlap', () => {
  assert.ok(layoutEvents([event('a',480,540),event('b',540,600)]).every(item=>item.columns===1));
  assert.ok(layoutEvents([event('a',480,540),event('b',480,540,'2026-09-30')]).every(item=>item.columns===1));
});
test('short and midnight events retain touch size without visual overlap or overflowing day', () => {
  const result=layoutEvents([event('short',480,485),event('next',490,495),event('late',1435,1440)]);
  assert.ok(result.every(item=>item.height>=44 && item.top+item.height<=1728));
  assert.equal(result[0].columns,2);
  assert.equal(result[1].columns,2);
  assert.equal(result[2].top,1684);
});
test('invalid dates and time ranges are ignored', () => {
  const invalid=[event('zero',10,10),event('negative',-1,10),event('over',1400,1441),event('nan',NaN,60),event('infinity',1,Infinity),event('date',1,60,'2026-02-30')];
  assert.deepEqual(layoutEvents(invalid),[]);
  assert.deepEqual(layoutEvents([]),[]);
});

test('week header uses dates rather than month-only labels',()=>{
  assert.equal(formatWeekRange('2026-10-05','2026-10-11'),'5 – 11 Thg 10');
  assert.equal(formatWeekRange('2026-09-28','2026-10-04'),'28 Thg 9 – 4 Thg 10');
  assert.equal(formatWeekRange('2026-12-28','2027-01-03'),'28 Thg 12, 2026 – 3 Thg 1, 2027');
});
