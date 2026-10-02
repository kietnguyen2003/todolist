import { memo, useCallback, useMemo, useState } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { COLORS, TASK_COLORS } from '../theme';
import { localDate, type Habit, type TodayState } from '../today/model';
import { TodayNavigation, type Section } from '../today/TodayNavigation';
import { useCalendarDay } from '../today/useCalendarDay';
import { usePopupEntrance } from '../today/usePopupEntrance';
import { useReducedMotion } from '../today/useReducedMotion';
import { formatHabitProgress, formatHabitQuantity } from '../today/quantity';
import { Copy, SystemFontContext } from '../today/ui';
import { periodDates, shiftPeriod, trackerDay, trackerSummary, type TrackerView } from './model';
import { TrackerGrid, TRACKER_STATUS_LABEL } from './TrackerGrid';

type Props = { state: TodayState; onSelect: (section: Section) => void; onLoadDemo: () => void; useSystemFont?: boolean };
const VIEWS: { id: TrackerView; label: string }[] = [
  { id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }, { id: 'year', label: 'Year' },
];
const MONTH_NAMES = Array.from({ length: 12 }, (_, index) => new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2026, index, 1)));
const HABIT_COLORS = [TASK_COLORS.rose, TASK_COLORS.sage, TASK_COLORS.sand, TASK_COLORS.lilac];
const LEGEND = [
  { label: 'Not started', color: COLORS.white, border: COLORS.paperBorder },
  { label: '1–33%', color: COLORS.roseSoft, border: COLORS.roseSoft },
  { label: '34–66%', color: COLORS.accent, border: COLORS.accent },
  { label: '67–99%', color: COLORS.accentPressed, border: COLORS.accentPressed },
  { label: 'Goal met', color: COLORS.streakActive, border: COLORS.streakActive },
  { label: 'Not applicable', color: COLORS.background, border: COLORS.paperBorder },
] as const;

function periodLabel(view: TrackerView, anchor: string, dates: readonly string[]): string {
  if (view === 'year') return `Year ${anchor.slice(0, 4)}`;
  if (view === 'month') return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(localDate(anchor));
  const first = localDate(dates[0]);
  const last = localDate(dates.at(-1)!);
  return `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(first)} – ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(last)}`;
}

const HabitCard = memo(function HabitCard({ habit, index, state, view, anchor, today, dates, onDay, onZoom }: {
  habit: Habit; index: number; state: TodayState; view: TrackerView; anchor: string; today: string;
  dates: readonly string[]; onDay: (habit: Habit, date: string) => void; onZoom: (habit: Habit) => void;
}) {
  const summary = trackerSummary(state, habit, dates, today);
  const palette = HABIT_COLORS[index % HABIT_COLORS.length];
  return <View style={styles.card} testID={`tracker-habit-${habit.id}`}>
    <View style={styles.cardHeader}>
      <View style={[styles.habitIcon, { backgroundColor: palette.background }]}><Feather name={habit.icon} size={20} color={COLORS.card}/></View>
      <View style={styles.habitNameBlock}>
        <Copy weight="bold" style={styles.habitName}>{habit.name}</Copy>
        <Copy style={styles.goal}>{formatHabitQuantity(habit.target, habit.unit)}/day</Copy>
      </View>
      <View style={styles.rateBlock}>
        <Copy weight="bold" style={styles.rate}>{summary.percent === null ? '—' : `${summary.percent}%`}</Copy>
        <Copy style={styles.rateLabel}>Days meeting goal</Copy>
      </View>
    </View>
    <Copy style={styles.rateMeta}>{summary.eligible ? `${summary.completed}/${summary.eligible} eligible days` : 'No data yet'}</Copy>
    <TrackerGrid habit={habit} state={state} view={view} anchor={anchor} today={today} onSelect={date => onDay(habit, date)} onZoom={() => onZoom(habit)} />
  </View>;
});

export function TrackerScreen({ state, onSelect, onLoadDemo, useSystemFont = false }: Props) {
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 900;
  const { today, selected: anchor, setSelected: setAnchor } = useCalendarDay();
  const [view, setView] = useState<TrackerView>('week');
  const [detail, setDetail] = useState<{ habitId: string; date: string } | null>(null);
  const [zoom, setZoom] = useState<{ habitId: string; month: number } | null>(null);
  const reducedMotion = useReducedMotion();
  const entrance = usePopupEntrance(detail !== null || zoom !== null, reducedMotion);
  const dates = useMemo(() => periodDates(view, anchor), [view, anchor]);
  const openDay = useCallback((selectedHabit: Habit, date: string) => setDetail({ habitId: selectedHabit.id, date }), []);
  const openZoom = useCallback((selectedHabit: Habit) => {
    setZoom({ habitId: selectedHabit.id, month: anchor.slice(0, 4) === today.slice(0, 4) ? Number(today.slice(5, 7)) : 1 });
  }, [anchor, today]);
  const habit = state.habits.find(item => item.id === detail?.habitId);
  const day = detail && habit ? trackerDay(state, habit, detail.date, today) : null;
  const zoomHabit = state.habits.find(item => item.id === zoom?.habitId);
  const closePopup = () => { setDetail(null); setZoom(null); };

  return <SystemFontContext.Provider value={useSystemFont}>
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {desktop && <TodayNavigation desktop active="tracker" onSelect={onSelect} />}
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.content, desktop && styles.desktopContent]}>
          <View style={styles.heading}>
            <View style={styles.headingIcon}><Feather name="activity" size={24} color={COLORS.card}/></View>
            <View style={styles.headingCopy}>
              <Copy accessibilityRole="header" weight="bold" style={styles.title}>Habit Tracker</Copy>
              <Copy style={styles.subtitle}>Small steps, steady progress.</Copy>
            </View>
          </View>

          <View accessibilityRole="tablist" style={styles.tabs}>
            {VIEWS.map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: view === item.id }} onPress={() => setView(item.id)} style={[styles.tab, view === item.id && styles.tabActive]}>
              <Copy weight="semibold" style={[styles.tabText, view === item.id && styles.tabTextActive]}>{item.label}</Copy>
            </Pressable>)}
          </View>

          <View style={styles.periodBar}>
            <View style={styles.periodCopy}><Copy weight="bold" style={styles.periodText}>{periodLabel(view, anchor, dates)}</Copy><Copy style={styles.periodHint}>{view === 'week' ? '7 days' : view === 'month' ? 'Monthly calendar' : 'Full-year heatmap'}</Copy></View>
            <View style={styles.periodControls}>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous period" onPress={() => setAnchor(shiftPeriod(view, anchor, -1))} style={styles.periodArrow}><Feather name="chevron-left" size={20} color={COLORS.card}/></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Current period" onPress={() => setAnchor(today)} style={styles.currentButton}><Copy weight="semibold" style={styles.currentText}>Current</Copy></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Next period" onPress={() => setAnchor(shiftPeriod(view, anchor, 1))} style={styles.periodArrow}><Feather name="chevron-right" size={20} color={COLORS.card}/></Pressable>
            </View>
          </View>

          <View style={styles.legend}>{LEGEND.map(item => <View key={item.label} style={styles.legendItem}><View style={[styles.legendSwatch, { backgroundColor: item.color, borderColor: item.border }]} /><Copy style={styles.legendText}>{item.label}</Copy></View>)}</View>

          {state.habits.length ? <View style={styles.cards}>
            {state.habits.map((item, index) => <HabitCard key={item.id} habit={item} index={index} state={state} view={view} anchor={anchor} today={today} dates={dates} onDay={openDay} onZoom={openZoom} />)}
          </View> : <View style={styles.emptyCard}>
            <Feather name="sun" size={26} color={COLORS.streakActive}/>
            <Copy weight="bold" style={styles.emptyTitle}>No habits to track yet</Copy>
            <Copy style={styles.emptyDescription}>Add a habit in To do, or load sample data to preview your progress.</Copy>
            <Pressable accessibilityRole="button" accessibilityLabel="Load sample data" onPress={onLoadDemo} style={styles.demoButton}><Copy weight="bold">Load sample data</Copy></Pressable>
          </View>}
        </View>
      </ScrollView>
      {!desktop && <SafeAreaView edges={['bottom']} style={styles.bottomBar}><TodayNavigation desktop={false} active="tracker" onSelect={onSelect} /></SafeAreaView>}

      <Modal visible={detail !== null || zoom !== null} transparent animationType="none" onRequestClose={closePopup}>
        <SafeAreaView style={styles.modalOverlay}>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.scrim, entrance.scrimStyle]} />
          <Animated.View style={[styles.detailCard, entrance.cardStyle]} accessibilityViewIsModal>
            {zoom && zoomHabit ? <View testID="tracker-year-zoom" style={styles.zoomContent}>
              <View style={styles.detailHeader}><Copy weight="bold" style={styles.detailTitle}>{zoomHabit.name}</Copy><Pressable accessibilityRole="button" accessibilityLabel="Close details" onPress={closePopup} style={styles.close}><Feather name="x" size={21} color={COLORS.card}/></Pressable></View>
              <Copy style={styles.detailDate}>Choose a month, then tap a day to view its progress.</Copy>
              <View style={styles.monthChoices}>{MONTH_NAMES.map((month, index) => <Pressable key={month} accessibilityRole="button" accessibilityLabel={month} onPress={() => setZoom({ ...zoom, month: index + 1 })} style={[styles.monthChoice, zoom.month === index + 1 && styles.monthChoiceActive]}><Copy weight="semibold" style={zoom.month === index + 1 && styles.monthChoiceTextActive}>{month.slice(0, 3)}</Copy></Pressable>)}</View>
              <TrackerGrid habit={zoomHabit} state={state} view="month" anchor={`${anchor.slice(0, 4)}-${String(zoom.month).padStart(2, '0')}-01`} today={today} onSelect={date => { setZoom(null); openDay(zoomHabit, date); }} />
            </View> : <View testID="tracker-detail" style={styles.zoomContent}>
            <View style={styles.detailHeader}><Copy weight="semibold" style={styles.detailEyebrow}>DAILY PROGRESS</Copy><Pressable accessibilityRole="button" accessibilityLabel="Close details" onPress={closePopup} style={styles.close}><Feather name="x" size={21} color={COLORS.card}/></Pressable></View>
            {habit && day && <>
              <Copy accessibilityRole="header" weight="bold" style={styles.detailTitle}>{habit.name}</Copy>
              <Copy style={styles.detailDate}>{new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(localDate(day.date))}</Copy>
              <Copy weight="bold" style={styles.detailProgress}>{formatHabitProgress(day.count, day.target, habit.unit)}</Copy>
              <View style={styles.detailStats}><View><Copy style={styles.detailCaption}>Daily progress</Copy><Copy weight="bold" style={styles.detailValue}>{day.percent}%</Copy></View><View><Copy style={styles.detailCaption}>Status</Copy><Copy weight="bold" style={styles.detailValue}>{TRACKER_STATUS_LABEL[day.status]}</Copy></View></View>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${day.progress * 100}%` }]} /></View>
            </>}
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={closePopup} style={styles.doneButton}><Copy weight="bold">Close</Copy></Pressable>
            </View>}
          </Animated.View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  </SystemFontContext.Provider>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background }, bottomBar: { backgroundColor: COLORS.card }, scroll: { flexGrow: 1, alignItems: 'center' }, content: { width: '100%', maxWidth: 680, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 28, gap: 18 }, desktopContent: { maxWidth: 1420, paddingHorizontal: 40, paddingTop: 32 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 14 }, headingIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' }, headingCopy: { flex: 1 }, title: { fontSize: 25, lineHeight: 34, letterSpacing: -0.6 }, subtitle: { color: COLORS.paperText, fontSize: 12, marginTop: 2 },
  tabs: { flexDirection: 'row', padding: 4, gap: 4, backgroundColor: COLORS.roseSoft, borderRadius: 15 }, tab: { flex: 1, minHeight: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, tabActive: { backgroundColor: COLORS.card }, tabText: { fontSize: 13 }, tabTextActive: { color: COLORS.white },
  periodBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }, periodCopy: { flexGrow: 1, minWidth: 130 }, periodText: { fontSize: 17 }, periodHint: { color: COLORS.paperText, fontSize: 11, marginTop: 2 }, periodControls: { flexDirection: 'row', gap: 5 }, periodArrow: { width: 38, height: 40, borderRadius: 12, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' }, currentButton: { minHeight: 40, paddingHorizontal: 10, borderRadius: 12, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' }, currentText: { fontSize: 11 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 }, legendSwatch: { width: 13, height: 13, borderWidth: 1, borderRadius: 4 }, legendText: { color: COLORS.paperText, fontSize: 10 }, cards: { gap: 14 }, card: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.paperBorder, borderRadius: 20, padding: 16, gap: 11 }, cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 }, habitIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, habitNameBlock: { flex: 1, minWidth: 0 }, habitName: { fontSize: 15 }, goal: { color: COLORS.paperText, fontSize: 11, marginTop: 3 }, rateBlock: { width: 98, alignItems: 'flex-end' }, rate: { fontSize: 24, color: COLORS.streakActive }, rateLabel: { color: COLORS.paperText, fontSize: 9, lineHeight: 13, textAlign: 'right' }, rateMeta: { color: COLORS.paperText, fontSize: 10 },
  emptyCard: { minHeight: 250, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.paperBorder, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }, emptyTitle: { fontSize: 17, textAlign: 'center' }, emptyDescription: { color: COLORS.paperText, fontSize: 12, lineHeight: 20, textAlign: 'center' }, demoButton: { minHeight: 44, paddingHorizontal: 18, borderRadius: 999, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }, scrim: { backgroundColor: COLORS.overlay }, detailCard: { width: '100%', maxWidth: 440, borderRadius: 24, backgroundColor: COLORS.background, padding: 22, gap: 14 }, zoomContent: { gap: 14 }, monthChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, monthChoice: { width: '22%', minHeight: 36, borderRadius: 10, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' }, monthChoiceActive: { backgroundColor: COLORS.card }, monthChoiceTextActive: { color: COLORS.white }, detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, detailEyebrow: { fontSize: 10, letterSpacing: 1.4, color: COLORS.streakActive }, close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, detailTitle: { fontSize: 22 }, detailDate: { color: COLORS.paperText, fontSize: 12 }, detailProgress: { fontSize: 18 }, detailStats: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderRadius: 14, backgroundColor: COLORS.white }, detailCaption: { color: COLORS.paperText, fontSize: 10, marginBottom: 5 }, detailValue: { fontSize: 13 }, progressTrack: { height: 8, borderRadius: 4, backgroundColor: COLORS.roseSoft, overflow: 'hidden' }, progressFill: { height: 8, backgroundColor: COLORS.streakActive }, doneButton: { minHeight: 46, borderRadius: 999, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
});
