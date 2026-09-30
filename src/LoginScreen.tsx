import { useRef, useState } from 'react';
import {
  AccessibilityInfo, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  Image, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { COLORS, FONTS } from './theme';
import { validateLogin, type LoginErrors } from './validation';

type Props = { useSystemFont?: boolean; onContinue?: () => void };

export function LoginScreen({ useSystemFont = false, onContinue }: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 375;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [ready, setReady] = useState(false);
  const [submitHovered, setSubmitHovered] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const font = (weight: keyof typeof FONTS = 'regular') => ({
    fontFamily: useSystemFont ? undefined : FONTS[weight],
    ...(useSystemFont && weight === 'bold' ? { fontWeight: '700' as const } : {}),
  });

  function submit() {
    const nextErrors = validateLogin(email, password);
    setErrors(nextErrors);
    setReady(false);
    if (Platform.OS === 'ios' && (nextErrors.email || nextErrors.password)) {
      AccessibilityInfo.announceForAccessibility(Object.values(nextErrors).join(' '));
    }
    if (nextErrors.email) return emailRef.current?.focus();
    if (nextErrors.password) return passwordRef.current?.focus();
    Keyboard.dismiss();
    if (onContinue) {
      onContinue();
      return;
    }
    setReady(true);
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility('The sign-in screen is ready');
    }
  }

  function update(field: 'email' | 'password', value: string) {
    if (field === 'email') setEmail(value);
    else setPassword(value);
    setErrors(previous => ({ ...previous, [field]: undefined }));
    setReady(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.page}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.layout}>
            <View style={[styles.card, compact && styles.compactCard]}>
              <View style={styles.brand}>
                <View style={styles.logo} accessible={false}>
                  <Image source={require('../logo.png')} style={styles.logoImage} resizeMode="contain" accessibilityLabel="Logo Tea Pret" />
                </View>
                <View style={styles.brandCopy}>
                  <Text style={[styles.brandName, font('bold')]}>Tea Pret</Text>
                  <Text style={[styles.brandCaption, font('medium')]}>SMALL STEPS. MEANINGFUL DAYS.</Text>
                </View>
              </View>

              <View style={styles.intro}>
                <Text style={[styles.eyebrow, font('semibold')]}>A NEW DAY, A NEW STEP</Text>
                <Text accessibilityRole="header" style={[styles.title, compact && styles.compactTitle, font('bold')]}>
                  Welcome{ '\n' }back.
                </Text>
                <Text style={[styles.description, font()]}>
                  Plan today's tasks,{ '\n' }make room for what matters.
                </Text>
              </View>

              <View style={styles.fields}>
                <View style={styles.field}>
                  <Text nativeID="email-label" style={[styles.label, font('semibold')]}>Email</Text>
                  <View style={[styles.inputShell, errors.email && styles.invalid, focused === 'email' && styles.focused]}>
                    <Feather name="mail" size={19} color={focused === 'email' ? COLORS.accent : COLORS.placeholder} />
                    <TextInput
                      ref={emailRef}
                      accessibilityLabel="Email"
                      accessibilityLabelledBy="email-label"
                      accessibilityHint={errors.email}
                      style={[styles.input, font()]}
                      value={email}
                      onChangeText={value => update('email', value)}
                      placeholder="you@email.com"
                      placeholderTextColor={COLORS.placeholder}
                      selectionColor={COLORS.accent}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      textContentType="emailAddress"
                      returnKeyType="next"
                      submitBehavior="submit"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                    />
                  </View>
                  {errors.email && <Text accessibilityLiveRegion="polite" role="alert" style={[styles.error, font()]}>{errors.email}</Text>}
                </View>

                <View style={styles.field}>
                  <Text nativeID="password-label" style={[styles.label, font('semibold')]}>Password</Text>
                  <View style={[styles.inputShell, errors.password && styles.invalid, focused === 'password' && styles.focused]}>
                    <Feather name="lock" size={19} color={focused === 'password' ? COLORS.accent : COLORS.placeholder} />
                    <TextInput
                      ref={passwordRef}
                      accessibilityLabel="Password"
                      accessibilityLabelledBy="password-label"
                      accessibilityHint={errors.password}
                      style={[styles.input, font()]}
                      value={password}
                      onChangeText={value => update('password', value)}
                      placeholder="Enter your password"
                      placeholderTextColor={COLORS.placeholder}
                      selectionColor={COLORS.accent}
                      secureTextEntry={!visible}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="current-password"
                      textContentType="password"
                      returnKeyType="done"
                      onSubmitEditing={submit}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={visible ? 'Hide password' : 'Show password'}
                      accessibilityState={{ checked: visible }}
                      onPress={() => setVisible(previous => !previous)}
                      style={({ pressed }) => [styles.eye, pressed && styles.pressed]}
                    >
                      <Feather name={visible ? 'eye-off' : 'eye'} size={19} color={focused === 'password' || visible ? COLORS.accent : COLORS.placeholder} />
                    </Pressable>
                  </View>
                  {errors.password && <Text accessibilityLiveRegion="polite" role="alert" style={[styles.error, font()]}>{errors.password}</Text>}
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign in"
                onPress={submit}
                onHoverIn={() => setSubmitHovered(true)}
                onHoverOut={() => setSubmitHovered(false)}
                style={({ pressed }) => [styles.submit, submitHovered && styles.submitHovered, pressed && styles.submitPressed]}
              >
                <Text style={[styles.submitText, font('bold')]}>Sign in</Text>
                <Feather name="arrow-right" size={19} color={COLORS.card} />
              </Pressable>

              {ready && (
                <View style={styles.notice}>
                  <Text accessibilityLiveRegion="polite" role="status" style={[styles.noticeText, font('medium')]}>
                    The sign-in screen is ready
                  </Text>
                </View>
              )}

              {onContinue && <Text style={[styles.demoNote, font()]}>Preview · No account verification</Text>}

              <View style={styles.cardFooter}>
                <Feather name="sun" size={16} color={COLORS.accent} />
                <Text style={[styles.footerText, font()]}>Small steps make lighter days.</Text>
              </View>
            </View>
            <Text style={[styles.outsideNote, font('medium')]}>You don't have to do it all. Just begin.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  page: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 32 },
  layout: { width: '100%', maxWidth: 440 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 24, padding: 32,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.13, shadowRadius: 28, elevation: 7,
  },
  compactCard: { paddingHorizontal: 22, paddingVertical: 28 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 46, height: 46, borderRadius: 15, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImage: { width: '100%', height: '100%' },
  brandCopy: { flex: 1, minWidth: 0 },
  brandName: { color: COLORS.white, fontSize: 23, letterSpacing: -0.8 },
  brandCaption: { color: COLORS.muted, fontSize: 8, letterSpacing: 1.6, marginTop: 4 },
  intro: { marginTop: 36, marginBottom: 30 },
  eyebrow: { color: COLORS.accent, fontSize: 9, letterSpacing: 1.6, marginBottom: 13 },
  title: { color: COLORS.white, fontSize: 32, lineHeight: 43, letterSpacing: -1.2 },
  compactTitle: { fontSize: 28, lineHeight: 38 },
  description: { color: COLORS.muted, fontSize: 14, lineHeight: 23, marginTop: 12 },
  fields: { gap: 20 },
  field: { gap: 9 },
  label: { color: COLORS.white, fontSize: 13 },
  inputShell: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 4, minHeight: 56, backgroundColor: COLORS.input, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.inputBorder, gap: 10 },
  focused: { borderColor: COLORS.accent, backgroundColor: COLORS.inputFocused },
  invalid: { borderColor: COLORS.error },
  input: { flex: 1, minWidth: 0, color: COLORS.white, fontSize: 16, paddingVertical: 16, paddingHorizontal: 0, backgroundColor: COLORS.transparent, borderWidth: 0,
    // Keep the surrounding field as the single focus indicator on web.
    ...Platform.select({ web: { outlineStyle: 'solid' as const, outlineWidth: 0, outlineColor: COLORS.transparent } }) },
  eye: { width: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  error: { color: COLORS.error, fontSize: 12, lineHeight: 19 },
  submit: { minHeight: 52, borderRadius: 999, backgroundColor: COLORS.accent, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14, marginTop: 26 },
  submitHovered: { backgroundColor: COLORS.accentHover },
  submitPressed: { backgroundColor: COLORS.accentPressed },
  submitText: { color: COLORS.card, fontSize: 14, lineHeight: 20 },
  pressed: { opacity: 0.76 },
  notice: { marginTop: 18, backgroundColor: COLORS.input, borderRadius: 12, padding: 14 },
  noticeText: { color: COLORS.accent, fontSize: 13, lineHeight: 21 },
  demoNote: { color: COLORS.muted, fontSize: 10, textAlign: 'center', lineHeight: 18, marginTop: 14 },
  cardFooter: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 28, paddingTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  footerText: { flexShrink: 1, color: COLORS.muted, fontSize: 10, lineHeight: 18 },
  outsideNote: { color: COLORS.paperText, textAlign: 'center', fontSize: 11, lineHeight: 20, marginTop: 25 },
});
