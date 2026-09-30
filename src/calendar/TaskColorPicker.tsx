import { Pressable, StyleSheet, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { COLORS, TASK_COLORS, type TaskColor } from '../theme';

type Props = {
  selected: TaskColor;
  onSelect: (color: TaskColor) => void;
  surface: 'dark' | 'light';
};

const colors = Object.keys(TASK_COLORS) as TaskColor[];
const rows = [colors.slice(0, 5), colors.slice(5)];

export function TaskColorPicker({ selected, onSelect, surface }: Props) {
  return <View style={styles.grid}>
    {rows.map((row, index) => <View key={index} style={styles.row}>
      {row.map(color => <Pressable
        key={color}
        accessibilityRole="button"
        accessibilityLabel={`Select ${color} color`}
        aria-pressed={selected === color}
        onPress={() => onSelect(color)}
        style={[styles.choice, {
          backgroundColor: TASK_COLORS[color].background,
          borderColor: selected === color ? (surface === 'dark' ? COLORS.white : COLORS.card) : TASK_COLORS[color].border,
        }]}
      >
        {selected === color && <Feather name="check" size={16} color={TASK_COLORS[color].text} />}
      </Pressable>)}
      {row.length < 5 && <View style={styles.spacer} />}
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  grid: { gap: 6 },
  row: { flexDirection: 'row', gap: 6 },
  choice: { flex: 1, minWidth: 0, height: 36, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  spacer: { flex: 1, minWidth: 0 },
});
