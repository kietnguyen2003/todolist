// Hallmark · pre-emit critique: P4 H4 E4 S5 R5 V4
// User-specified palette: warm paper, navy surface, dusty rose accent.
export const COLORS = {
  background: '#F7F3E9',
  card: '#1B2A3E',
  input: '#152132',
  inputFocused: '#19273A',
  inputBorder: '#2D3B4F',
  accent: '#D9A3B8',
  accentHover: '#E4B5C7',
  accentPressed: '#C991A8',
  streakActive: '#9E3E61',
  white: '#F8F6F3',
  muted: '#BAC2CE',
  placeholder: '#9AA7B9',
  border: '#344155',
  error: '#FFC0BD',
  shadow: '#111C2B',
  paperText: '#736D68',
  transparent: 'transparent',
  paperBorder: '#E4DED4',
  roseSoft: '#F0DFE3',
  errorInk: '#9E344E',
  overlay: 'rgba(17, 28, 43, 0.48)',
} as const;

export const TASK_COLORS = {
  navy: { background: COLORS.card, border: COLORS.card, text: COLORS.white, muted: COLORS.muted },
  rose: { background: '#E9BDCD', border: '#D9A3B8', text: COLORS.card, muted: COLORS.paperText },
  sage: { background: '#B9D7C9', border: '#93BDAA', text: COLORS.card, muted: COLORS.paperText },
  sand: { background: '#EAD3A4', border: '#D6B977', text: COLORS.card, muted: COLORS.paperText },
} as const;
export type TaskColor = keyof typeof TASK_COLORS;

export const FONTS = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;
