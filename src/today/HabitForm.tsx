import { useEffect, useRef, useState } from 'react';
import {
  Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { COLORS, FONTS } from '../theme';
import { validateHabitDraft } from './model';
import { WheelPicker } from './WheelPicker';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (draft: { name: string; target: number; unit: string }) => void;
  useSystemFont?: boolean;
};
type Field = 'name' | 'target' | 'unit';

const UNITS = ['liter', 'steps', 'hours and minute'] as const;
const TARGETS = Array.from({ length: 101 }, (_, value) => String(value));
const MINUTES = Array.from({ length: 60 }, (_, value) => String(value));
const INITIAL_VALUES = { name: '', quantity: 1, hours: 0, minutes: 1, unit: 'liter' };

export function HabitForm({ visible, onClose, onCreate, useSystemFont = false }: Props) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const isTime = values.unit === 'hours and minute';
  const target = isTime ? values.hours * 60 + values.minutes : values.quantity;
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [focused, setFocused] = useState<Field | null>(null);
  const nameRef = useRef<TextInput>(null);
  const font = (weight: keyof typeof FONTS = 'regular') => ({
    fontFamily: useSystemFont ? undefined : FONTS[weight],
    ...(useSystemFont && weight === 'bold' ? { fontWeight: '700' as const } : {}),
  });

  useEffect(() => {
    if (visible) {
      setValues(INITIAL_VALUES);
      setErrors({});
      setFocused(null);
    }
  }, [visible]);

  function submit() {
    const nextErrors = {
      ...validateHabitDraft(values.name, String(target), values.unit),
      ...(target === 0 ? { target: isTime ? 'Hãy chọn thời lượng ít nhất 1 phút.' : 'Hãy chọn mục tiêu lớn hơn 0.' } : {}),
    };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      if (nextErrors.name) nameRef.current?.focus();
      return;
    }
    Keyboard.dismiss();
    onCreate({ name: values.name.trim(), target, unit: values.unit });
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop} />
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={styles.page}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={styles.card} accessibilityViewIsModal>
              <View style={styles.heading}>
                <View style={styles.headingCopy}>
                  <Text style={[styles.eyebrow, font('semibold')]}>TỪNG CHÚT, MỖI NGÀY</Text>
                  <Text accessibilityRole="header" style={[styles.title, font('bold')]}>Thói quen mới</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Đóng tạo thói quen" onPress={close} style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
                  <Feather name="x" size={22} color={COLORS.muted} />
                </Pressable>
              </View>
              <Text style={[styles.description, font()]}>Bắt đầu từ một việc nhỏ bạn muốn duy trì mỗi ngày.</Text>
              <View style={styles.fields}>
                <View style={styles.field}>
                  <Text style={[styles.label, font('semibold')]}>Tên thói quen</Text>
                  <TextInput
                    ref={nameRef}
                    accessibilityLabel="Tên thói quen"
                    accessibilityHint={errors.name}
                    value={values.name}
                    placeholder="Ví dụ: Uống nước"
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
                    <Text style={[styles.label, styles.columnLabel, font('semibold')]}>Mục tiêu mỗi ngày</Text>
                    {isTime ? (
                      <View style={styles.timeColumns}>
                        <View style={styles.column}>
                          <Text style={[styles.timeLabel, font()]}>Giờ</Text>
                          <WheelPicker label="Mục tiêu giờ" hint={errors.target} options={TARGETS}
                            selectedIndex={values.hours} useSystemFont={useSystemFont}
                            onChange={index => updateTarget('hours', index)} />
                        </View>
                        <View style={styles.column}>
                          <Text style={[styles.timeLabel, font()]}>Phút</Text>
                          <WheelPicker label="Mục tiêu phút" hint={errors.target} options={MINUTES}
                            selectedIndex={values.minutes} useSystemFont={useSystemFont}
                            onChange={index => updateTarget('minutes', index)} />
                        </View>
                      </View>
                    ) : (
                      <WheelPicker label="Mục tiêu mỗi ngày" hint={errors.target} options={TARGETS}
                        selectedIndex={values.quantity} useSystemFont={useSystemFont}
                        onChange={index => updateTarget('quantity', index)} />
                    )}
                  </View>
                  <View style={styles.column}>
                    <Text style={[styles.label, styles.columnLabel, font('semibold')]}>Đơn vị</Text>
                    {isTime && <View style={styles.timeLabelSpacer} />}
                    <WheelPicker label="Đơn vị" options={UNITS}
                      selectedIndex={UNITS.findIndex(unit => unit === values.unit)} useSystemFont={useSystemFont}
                      onChange={index => {
                        setValues(previous => ({ ...previous, unit: UNITS[index] }));
                        setErrors(previous => ({ ...previous, target: undefined }));
                      }} />
                  </View>
                </View>
                {!!errors.target && <Text role="alert" style={[styles.error, font()]}>{errors.target}</Text>}
              </View>
              <Text style={[styles.hint, font()]}>Kéo lên hoặc xuống để chọn mục tiêu và đơn vị. Bạn có thể cập nhật tiến độ riêng cho từng ngày.</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Tạo thói quen" onPress={submit} style={({ pressed }) => [styles.submit, pressed && styles.submitPressed]}>
                <Feather name="plus" size={18} color={COLORS.card} />
                <Text style={[styles.submitText, font('bold')]}>Tạo thói quen</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={close} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
                <Text style={[styles.cancelText, font('medium')]}>Để sau</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: COLORS.shadow, opacity: 0.6 },
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
    backgroundColor: COLORS.input, paddingHorizontal: 16, paddingVertical: 14, color: COLORS.white, fontSize: 14,
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
