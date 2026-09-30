// Duration targets and daily progress share the same base unit: whole minutes.
export const DURATION_UNIT = 'hours and minute';
export function displayUnit(unit:string,target:number):string {
  if(unit==='steps')return target===1?'step':'steps';
  if(unit==='liter')return target===1?'liter':'liters';
  if(unit==='time')return target===1?'time':'times';
  if(unit===DURATION_UNIT) {
    const hours=Math.floor(target/60);
    const minutes=target%60;
    return `${hours===1?'hour':'hours'} and ${minutes===1?'minute':'minutes'}`;
  }
  return unit;
}
export function formatHabitQuantity(value: number, unit: string): string {
  return unit === DURATION_UNIT
    ? `${Math.floor(value / 60)} hr ${value % 60} min`
    : `${value} ${displayUnit(unit,value).toLowerCase()}`;
}
export function formatHabitProgress(count: number, target: number, unit: string): string {
  return unit === DURATION_UNIT
    ? `${formatHabitQuantity(count, unit)} / ${formatHabitQuantity(target, unit)}`
    : `${count} / ${target} ${displayUnit(unit,target).toLowerCase()}`;
}
