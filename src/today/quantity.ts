// Duration targets and daily progress share the same base unit: whole minutes.
export const DURATION_UNIT = 'hours and minute';
export function formatHabitQuantity(value: number, unit: string): string {
  return unit === DURATION_UNIT
    ? `${Math.floor(value / 60)} giờ ${value % 60} phút`
    : `${value} ${unit}`;
}
export function formatHabitProgress(count: number, target: number, unit: string): string {
  return unit === DURATION_UNIT
    ? `${formatHabitQuantity(count, unit)} / ${formatHabitQuantity(target, unit)}`
    : `${count} / ${target} ${unit}`;
}
