import { useRef, useState, type Dispatch } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { COLORS } from '../theme';
import { HabitForm } from '../today/HabitForm';
import { TodayNavigation, type Section } from '../today/TodayNavigation';
import { dateKey, localDate, type Habit, type TodayAction, type TodayState } from '../today/model';
import { formatHabitQuantity } from '../today/quantity';
import { Copy, SystemFontContext } from '../today/ui';
import { usePopupEntrance } from '../today/usePopupEntrance';
import { useReducedMotion } from '../today/useReducedMotion';

type Props = {
  state: TodayState;
  dispatch: Dispatch<TodayAction>;
  onSelect: (section: Section) => void;
  useSystemFont?: boolean;
};

export function HabitsScreen({ state, dispatch, onSelect, useSystemFont = false }: Props) {
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 900;
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);
  const nextHabitId = useRef(0);
  const reducedMotion = useReducedMotion();
  const deleteEntrance = usePopupEntrance(deletingHabit !== null, reducedMotion);

  function saveHabit(draft: Pick<Habit, 'name' | 'target' | 'unit'>) {
    if (editingHabit) {
      dispatch({ type: 'updateHabit', id: editingHabit.id, ...draft });
      return;
    }
    dispatch({ type: 'addHabit', habit: { ...draft, id: `habit-${Date.now()}-${nextHabitId.current++}`, startDate: dateKey(new Date()), icon: 'activity' } });
  }

  return <SystemFontContext.Provider value={useSystemFont}>
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {desktop && <TodayNavigation desktop active="habits" onSelect={onSelect} />}
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.content, desktop && styles.desktopContent]}>
          <View style={styles.heading}>
            <View style={styles.headingText}>
              <Copy accessibilityRole="header" weight="bold" style={styles.title}>Habits</Copy>
              <Copy style={styles.subtitle}>Make room for the routines that matter.</Copy>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Add habit" onPress={() => setFormOpen(true)} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
              <Feather name="plus" size={18} color={COLORS.card} />
              <Copy weight="bold" style={styles.addText}>Add habit</Copy>
            </Pressable>
          </View>

          <Copy style={styles.count}>{state.habits.length} {state.habits.length === 1 ? 'habit' : 'habits'}</Copy>
          {state.habits.length ? <View style={styles.cards}>
            {state.habits.map(habit => <View key={habit.id} testID={`managed-habit-${habit.name}`} style={[styles.card, desktop && styles.desktopCard]}>
              <View style={styles.cardTop}>
                <View style={styles.icon}><Feather name={habit.icon} size={22} color={COLORS.card} /></View>
                <View style={styles.cardCopy}>
                  <Copy weight="bold" style={styles.habitName}>{habit.name}</Copy>
                  <Copy style={styles.goal}>{formatHabitQuantity(habit.target, habit.unit)} per day</Copy>
                </View>
              </View>
              <Copy style={styles.since}>Since {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(localDate(habit.startDate))}</Copy>
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${habit.name}`} onPress={() => setEditingHabit(habit)} style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
                  <Feather name="edit-2" size={16} color={COLORS.card} /><Copy weight="semibold">Edit</Copy>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${habit.name}`} onPress={() => setDeletingHabit(habit)} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
                  <Feather name="trash-2" size={16} color={COLORS.errorInk} /><Copy weight="semibold" style={styles.deleteText}>Delete</Copy>
                </Pressable>
              </View>
            </View>)}
          </View> : <View style={styles.empty}>
            <Feather name="sun" size={28} color={COLORS.streakActive} />
            <Copy weight="bold" style={styles.emptyTitle}>No habits yet</Copy>
            <Copy style={styles.emptyText}>Start with one small thing you want to do every day.</Copy>
          </View>}
        </View>
      </ScrollView>
      {!desktop && <SafeAreaView edges={['bottom']} style={styles.bottomBar}><TodayNavigation desktop={false} active="habits" onSelect={onSelect} /></SafeAreaView>}

      <HabitForm visible={formOpen || editingHabit !== null} habit={editingHabit} useSystemFont={useSystemFont} onClose={() => { setFormOpen(false); setEditingHabit(null); }} onSave={saveHabit} />
      <Modal visible={deletingHabit !== null} transparent animationType="none" onRequestClose={() => setDeletingHabit(null)}>
        <SafeAreaView style={styles.deleteBackdrop}>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.deleteScrim, deleteEntrance.scrimStyle]} />
          <Animated.View testID="delete-popup-card" style={[styles.deleteCard, deleteEntrance.cardStyle]} accessibilityViewIsModal>
            <Copy accessibilityRole="header" weight="bold" style={styles.deleteTitle}>Delete {deletingHabit?.name}?</Copy>
            <Copy style={styles.deleteDescription}>This removes the habit and all its saved daily progress.</Copy>
            <View style={styles.deleteActions}>
              <Pressable accessibilityRole="button" onPress={() => setDeletingHabit(null)} style={styles.deleteCancel}><Copy weight="semibold">Cancel</Copy></Pressable>
              <Pressable accessibilityRole="button" onPress={() => { if (deletingHabit) dispatch({ type: 'deleteHabit', id: deletingHabit.id }); setDeletingHabit(null); }} style={styles.deleteConfirm}><Copy weight="bold" style={styles.deleteConfirmText}>Delete permanently</Copy></Pressable>
            </View>
          </Animated.View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  </SystemFontContext.Provider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background }, scroll: { flexGrow: 1, alignItems: 'center' }, content: { width: '100%', maxWidth: 680, paddingHorizontal: 18, paddingTop: 24, paddingBottom: 30, gap: 18 }, desktopContent: { maxWidth: 1200, paddingHorizontal: 40, paddingTop: 36 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12 }, headingText: { flex: 1, minWidth: 0 }, title: { fontSize: 27, lineHeight: 36 }, subtitle: { color: COLORS.paperText, fontSize: 12, lineHeight: 19 }, addButton: { minHeight: 44, paddingHorizontal: 13, borderRadius: 999, backgroundColor: COLORS.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }, addText: { fontSize: 11 }, pressed: { opacity: 0.72 }, count: { color: COLORS.paperText, fontSize: 12 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 }, card: { width: '100%', backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.paperBorder, borderRadius: 20, padding: 16, gap: 14 }, desktopCard: { width: '48%', flexGrow: 1 }, cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 }, icon: { width: 46, height: 46, borderRadius: 14, backgroundColor: COLORS.roseSoft, alignItems: 'center', justifyContent: 'center' }, cardCopy: { flex: 1, minWidth: 0 }, habitName: { fontSize: 16 }, goal: { color: COLORS.paperText, fontSize: 12, marginTop: 3 }, since: { color: COLORS.paperText, fontSize: 11 }, actions: { flexDirection: 'row', gap: 8 }, editButton: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: COLORS.roseSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, deleteButton: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: COLORS.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, deleteText: { color: COLORS.errorInk },
  empty: { minHeight: 230, borderWidth: 1, borderColor: COLORS.paperBorder, borderRadius: 20, backgroundColor: COLORS.white, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 10 }, emptyTitle: { fontSize: 17 }, emptyText: { color: COLORS.paperText, fontSize: 12, textAlign: 'center', lineHeight: 20 }, bottomBar: { backgroundColor: COLORS.card },
  deleteBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }, deleteScrim: { backgroundColor: COLORS.overlay }, deleteCard: { width: '100%', maxWidth: 420, backgroundColor: COLORS.background, borderRadius: 20, padding: 22, gap: 14 }, deleteTitle: { fontSize: 20 }, deleteDescription: { fontSize: 13, color: COLORS.paperText, lineHeight: 20 }, deleteActions: { flexDirection: 'row', gap: 8, marginTop: 6 }, deleteCancel: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, borderRadius: 12 }, deleteConfirm: { flex: 1.5, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card, borderRadius: 12 }, deleteConfirmText: { color: COLORS.white },
});
