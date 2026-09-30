import { useEffect, useRef, useState } from 'react';
import {
  Animated, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { COLORS, FONTS } from '../theme';
import { validateHabitDraft, type Habit } from './model';
import { WheelPicker } from './WheelPicker';
import { displayUnit } from './quantity';
import { useReducedMotion } from './useReducedMotion';
import { usePopupEntrance } from './usePopupEntrance';

type Props = {
  visible: boolean;
  onClose: () => void;
  habit?: Habit | null;
  onSave: (draft: { name: string; target: number; unit: string }) => void;
  useSystemFont?: boolean;
};
type Field = 'name' | 'target' | 'unit';

const UNITS = ['liter', 'steps', 'hours and minute', 'time'] as const;
const TARGETS = Array.from({ length: 101 }, (_, value) => String(value));
const MINUTES = Array.from({ length: 60 }, (_, value) => String(value));
const INITIAL_VALUES = { name: '', quantity: 1, hours: 0, minutes: 1, unit: 'liter' };
function valuesFor(habit?:Habit|null) {
  if(!habit)return INITIAL_VALUES;
  return {name:habit.name,quantity:habit.target,hours:Math.floor(habit.target/60),minutes:habit.target%60,unit:habit.unit};
}

export function HabitForm({ visible, onClose, habit, onSave, useSystemFont = false }: Props) {
  const reducedMotion=useReducedMotion();
  const entrance=usePopupEntrance(visible,reducedMotion);
  const [values, setValues] = useState(INITIAL_VALUES);
  const units=habit && !UNITS.some(unit=>unit===habit.unit)?[...UNITS,habit.unit]:UNITS;
  const isTime = values.unit === 'hours and minute';
  // Keep older saved targets selectable while the picker for new values stays at 0–100.
  const quantityOptions=values.quantity>100?[...TARGETS,String(values.quantity)]:TARGETS;
  const hourOptions=values.hours>100?[...TARGETS,String(values.hours)]:TARGETS;
  const target = isTime ? values.hours * 60 + values.minutes : values.quantity;
  const unitLabels=units.map(unit=>displayUnit(unit,target));
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [focused, setFocused] = useState<Field | null>(null);
  const nameRef = useRef<TextInput>(null);
  const font = (weight: keyof typeof FONTS = 'regular') => ({
    fontFamily: useSystemFont ? undefined : FONTS[weight],
    ...(useSystemFont && weight === 'bold' ? { fontWeight: '700' as const } : {}),
  });

  useEffect(() => {
    if (visible) {
      setValues(valuesFor(habit));
      setErrors({});
      setFocused(null);
    }
  }, [visible,habit]);

  function submit() {
    const nextErrors = {
      ...validateHabitDraft(values.name, String(target), values.unit),
      ...(target === 0 ? { target: isTime ? 'Choose at least one minute.' : 'Choose a target greater than zero.' } : {}),
    };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      if (nextErrors.name) nameRef.current?.focus();
      return;
    }
    Keyboard.dismiss();
    onSave({ name: values.name.trim(), target, unit: values.unit });
    onClose();
  }

  function close() {
    Keyboard.dismiss();
    onClose();
  }

  function updateTarget(field: 'quantity' | 'hours' | 'minutes', value: number) {
    setValues(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, target: undefined }));
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <Animated.View pointerEvents="none" style={[styles.backdrop,entrance.scrimStyle]} />
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={styles.page}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Animated.View testID="habit-popup-card" style={[styles.card,entrance.cardStyle]} accessibilityViewIsModal>
              <View style={styles.heading}>
                <View style={styles.headingCopy}>
                  <Text style={[styles.eyebrow, font('semibold')]}>A LITTLE EVERY DAY</Text>
                  <Text accessibilityRole="header" style={[styles.title, font('bold')]}>{habit?'Edit habit':'New habit'}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Close habit form" onPress={close} style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
                  <Feather name="x" size={22} color={COLORS.muted} />
                </Pressable>
              </View>
              <Text style={[styles.description, font()]}>Start with one small thing you want to do each day.</Text>
              <View style={styles.fields}>
                <View style={styles.field}>
                  <Text style={[styles.label, font('semibold')]}>Habit name</Text>
                  <TextInput
                    ref={nameRef}
                    accessibilityLabel="Habit name"
                    accessibilityHint={errors.name}
                    value={values.name}
                    placeholder="For example: Drink water"
                    placeholderTextColor={COLORS.placeholder}
                    selectionColor={COLORS.accent}
                    style={[styles.input, font(), focused === 'name' && styles.focused, !!errors.name && styles.invalid]}
                    onChangeText={name => {
                      setValues(previous => ({ ...previous, name }));
                      setErrors(previous => ({ ...previous, name: undefined }));
                    }}
                    autoCapitalize="sentences"
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                  />
                  {!!errors.name && <Text role="alert" style={[styles.error, font()]}>{errors.name}</Text>}
                </View>
                <View style={styles.columns}>
                  <View style={styles.column}>
                    <Text style={[styles.label, styles.columnLabel, font('semibold')]}>Daily target</Text>
                    {isTime ? (
                      <View style={styles.timeColumns}>
                        <View style={styles.column}>
                          <Text style={[styles.timeLabel, font()]}>Hours</Text>
                          <WheelPicker label="Target hours" hint={errors.target} options={hourOptions}
                            selectedIndex={hourOptions.indexOf(String(values.hours))} useSystemFont={useSystemFont}
                            onChange={index => updateTarget('hours', Number(hourOptions[index]))} />
                        </View>
                        <View style={styles.column}>
                          <Text style={[styles.timeLabel, font()]}>Minutes</Text>
                          <WheelPicker label="Target minutes" hint={errors.target} options={MINUTES}
                            selectedIndex={values.minutes} useSystemFont={useSystemFont}
                            onChange={index => updateTarget('minutes', index)} />
                        </View>
                      </View>
                    ) : (
                      <WheelPicker label="Daily target" hint={errors.target} options={quantityOptions}
                        selectedIndex={quantityOptions.indexOf(String(values.quantity))} useSystemFont={useSystemFont}
                        onChange={index => updateTarget('quantity', Number(quantityOptions[index]))} />
                    )}
                  </View>
                  <View style={styles.column}>
                    <Text style={[styles.label, styles.columnLabel, font('semibold')]}>Unit</Text>
                    {isTime && <View style={styles.timeLabelSpacer} />}
                    <WheelPicker label="Unit" options={unitLabels}
                      selectedIndex={units.findIndex(unit => unit === values.unit)} useSystemFont={useSystemFont}
                      onChange={index => {
                        setValues(previous => ({ ...previous, unit: units[index] }));
                        setErrors(previous => ({ ...previous, target: undefined }));
                      }} />
                  </View>
                </View>
                {!!errors.target && <Text role="alert" style={[styles.error, font()]}>{errors.target}</Text>}
              </View>
              <Text style={[styles.hint, font()]}>Scroll to choose a target and unit. Progress is tracked for each day.</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={habit?'Save habit':'Create habit'} onPress={submit} style={({ pressed }) => [styles.submit, pressed && styles.submitPressed]}>
                <Feather name="plus" size={18} color={COLORS.card} />
                <Text style={[styles.submitText, font('bold')]}>{habit?'Save habit':'Create habit'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={close} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
                <Text style={[styles.cancelText, font('medium')]}>Not now</Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: COLORS.overlay },
  page: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 24 },
  card: { width: '100%', maxWidth: 440, borderRadius: 24, backgroundColor: COLORS.card, padding: 24 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headingCopy: { flex: 1 },
  eyebrow: { fontSize: 9, letterSpacing: 1.4, color: COLORS.accent, marginBottom: 8 },
  title: { color: COLORS.white, fontSize: 24, lineHeight: 34, letterSpacing: -0.6 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: COLORS.input },
  description: { color: COLORS.muted, fontSize: 13, lineHeight: 21, marginTop: 12, marginBottom: 24 },
  fields: { gap: 18 },
  field: { gap: 8 },
  columns: { flexDirection: 'row', gap: 12 },
  column: { flex: 1, minWidth: 0, gap: 8 },
  columnLabel: { minHeight: 36 },
  timeColumns: { flexDirection: 'row', gap: 6 },
  timeLabel: { color: COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  timeLabelSpacer: { height: 18 },
  label: { color: COLORS.white, fontSize: 13 },
  input: {
    minHeight: 52, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.input, paddingHorizontal: 16, paddingVertical: 14, color: COLORS.white, fontSize: 16,
    ...Platform.select({ web: { outlineStyle: 'solid' as const, outlineWidth: 0, outlineColor: COLORS.transparent } }),
  },
  focused: { borderColor: COLORS.accent, backgroundColor: COLORS.inputFocused },
  invalid: { borderColor: COLORS.error },
  error: { color: COLORS.error, fontSize: 12, lineHeight: 18 },
  hint: { color: COLORS.muted, fontSize: 11, lineHeight: 18, marginTop: 16 },
  submit: { minHeight: 52, backgroundColor: COLORS.accent, borderRadius: 999, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24, padding: 14 },
  submitPressed: { backgroundColor: COLORS.accentPressed },
  submitText: { color: COLORS.card, fontSize: 14 },
  cancel: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  cancelText: { color: COLORS.muted, fontSize: 13 },
  pressed: { opacity: 0.7 },
});
