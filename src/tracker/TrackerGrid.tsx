import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { COLORS } from '../theme';
import { localDate, type Habit, type TodayState } from '../today/model';
import { Copy } from '../today/ui';
import { gridDates, trackerDay, yearMonthMarkers, type TrackerDay, type TrackerView } from './model';

const YEAR_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const TRACKER_STATUS_LABEL = { inapplicable: 'Not applicable', missed: 'Not started', partial: 'In progress', complete: 'Completed' } as const;

function fill(day: TrackerDay) {
  if (day.status === 'inapplicable') return COLORS.background;
  if (day.status === 'missed') return COLORS.white;
  if (day.status === 'complete') return COLORS.streakActive;
  if (day.progress < 0.34) return COLORS.roseSoft;
  if (day.progress < 0.67) return COLORS.accent;
  return COLORS.accentPressed;
}

function Cell({ habit, day, size, outside, onSelect }: {
  habit: Habit; day: TrackerDay; size: 'week' | 'month' | 'year'; outside?: boolean; onSelect: (date: string) => void;
}) {
  const label = size === 'year' ? null : size === 'month' ? String(localDate(day.date).getDate()) : day.status === 'inapplicable' ? '–' : `${Math.min(day.percent, 100)}%`;
  return <Pressable
    testID={`tracker-cell-${habit.id}-${day.date}`}
    accessibilityRole="button"
    accessibilityLabel={`${habit.name}, ${day.date}, ${day.count}/${day.target}, ${TRACKER_STATUS_LABEL[day.status]}`}
    accessibilityHint="Tap to view daily progress"
    onPress={() => onSelect(day.date)}
    style={({ pressed }) => [styles.cell, size === 'week' && styles.weekCell, size === 'month' && styles.monthCell, size === 'year' && styles.yearCell,
      { backgroundColor: fill(day), borderColor: day.status === 'missed' ? COLORS.paperBorder : fill(day), opacity: outside ? 0.42 : pressed ? 0.75 : 1 }]}
  >
    {label !== null && <Copy weight="semibold" numberOfLines={1} style={[styles.cellText, size === 'week' && styles.weekText, day.status === 'complete' && styles.completeText]}>{label}</Copy>}
  </Pressable>;
}

export function TrackerGrid({ habit, state, view, anchor, today, onSelect, onZoom }: {
  habit: Habit; state: TodayState; view: TrackerView; anchor: string; today: string; onSelect: (date: string) => void; onZoom?: () => void;
}) {
  const { width } = useWindowDimensions();
  const dates = gridDates(view, anchor);
  if (view === 'year') {
    const columns = Array.from({ length: dates.length / 7 }, (_, index) => dates.slice(index * 7, index * 7 + 7));
    const markers = yearMonthMarkers(dates);
    const desktop = Platform.OS === 'web' && width >= 900;
    const cardWidth = Math.min(width - (desktop ? 80 : 36), desktop ? 1420 : 680) - 34;
    const compact = (cardWidth - 21 - 4 * (columns.length - 1)) / columns.length < 12;
    const labelWidth = compact ? 0 : 17;
    const gap = compact ? 1 : 4;
    const cellSize = Math.max(1, (cardWidth - labelWidth - (compact ? 0 : 4) - gap * (columns.length - 1)) / columns.length);
    const rowGap = cellSize < 12 ? 2 : 5;
    const monthHeight = compact ? 14 : 20;
    const cells = <View style={[styles.yearColumns, { gap }]}>{columns.map((column, index) => <View key={index} style={{ flex: 1, minWidth: 0, gap: rowGap }}>
      {column.map(date => {
        const day = trackerDay(state, habit, date, today);
        const outside = date.slice(0, 4) !== anchor.slice(0, 4);
        return compact ? <View key={date} style={{ width: '100%', aspectRatio: 1, borderRadius: Math.min(2, cellSize / 4), backgroundColor: day.status === 'missed' ? COLORS.paperBorder : fill(day), opacity: outside ? 0.42 : 1 }} />
          : <Cell key={date} habit={habit} day={day} size="year" outside={outside} onSelect={onSelect} />;
      })}
    </View>)}</View>;
    return <View testID={`tracker-year-grid-${habit.id}`} style={styles.yearLayout}>
      {!compact && <View style={{ width: labelWidth }}><View style={{ height: monthHeight }}/>{YEAR_DAYS.map((day, index) => <Copy key={day} style={{ height: cellSize, marginBottom: index === 6 ? 0 : rowGap, fontSize: 9, lineHeight: cellSize, color: COLORS.paperText }}>{day}</Copy>)}</View>}
      {compact ? <Pressable accessibilityRole="button" accessibilityLabel={`View year details for ${habit.name}, ${anchor.slice(0, 4)}`} onPress={onZoom} style={styles.yearBody}>
        <View style={{ height: monthHeight }}>{markers.map(marker => <Copy key={marker.label} style={[styles.marker, { left: `${marker.week / columns.length * 100}%`, fontSize: 7 }]}>{marker.label}</Copy>)}</View>
        {cells}
      </Pressable> : <View style={styles.yearBody}>
        <View style={{ height: monthHeight }}>{markers.map(marker => <Copy key={marker.label} style={[styles.marker, { left: `${marker.week / columns.length * 100}%` }]}>{marker.label}</Copy>)}</View>
        {cells}
      </View>}
    </View>;
  }

  const rows = Array.from({ length: dates.length / 7 }, (_, index) => dates.slice(index * 7, index * 7 + 7));
  return <View style={styles.calendarGrid}>
    <View style={styles.weekdayRow}>{YEAR_DAYS.map(day => <Copy key={day} weight="semibold" style={styles.weekday}>{day}</Copy>)}</View>
    {rows.map((row, index) => <View key={index} style={styles.dayRow}>
      {row.map(date => <Cell key={date} habit={habit} day={trackerDay(state, habit, date, today)} size={view} outside={view === 'month' && date.slice(0, 7) !== anchor.slice(0, 7)} onSelect={onSelect} />)}
    </View>)}
    {view === 'week' && <View style={styles.dateRow}>{dates.map(date => <Copy key={date} style={styles.dateLabel}>{localDate(date).getDate()}</Copy>)}</View>}
  </View>;
}

const styles = StyleSheet.create({
  calendarGrid: { gap: 6 }, weekdayRow: { flexDirection: 'row', gap: 5 }, weekday: { flex: 1, minWidth: 0, textAlign: 'center', fontSize: 10, color: COLORS.paperText },
  dayRow: { flexDirection: 'row', gap: 5 }, cell: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 9 }, weekCell: { flex: 1, minWidth: 0, height: 44 }, monthCell: { flex: 1, minWidth: 0, height: 34 }, yearCell: { width: '100%', aspectRatio: 1, borderRadius: 5 },
  cellText: { fontSize: 11, color: COLORS.card }, weekText: { fontSize: 9 }, completeText: { color: COLORS.white }, dateRow: { flexDirection: 'row', gap: 5 }, dateLabel: { flex: 1, minWidth: 0, textAlign: 'center', fontSize: 10, color: COLORS.paperText },
  yearLayout: { flexDirection: 'row', gap: 4, width: '100%' }, yearBody: { flex: 1, minWidth: 0 }, marker: { position: 'absolute', top: 0, fontSize: 9, color: COLORS.paperText }, yearColumns: { flexDirection: 'row', width: '100%' },
});
