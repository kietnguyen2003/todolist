import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS } from '../theme';

type Props = {
  label: string;
  hint?: string;
  options: readonly string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  useSystemFont?: boolean;
  compact?: boolean;
  testID?: string;
};

const ROW_HEIGHT = 44;
const VISIBLE_ROWS = 3;

/** A controlled wheel: scrolling emits selection without restarting its momentum. */
export function WheelPicker({ label, hint, options, selectedIndex, onChange, useSystemFont = false, compact = false, testID }: Props) {
  const rowHeight=compact?40:ROW_HEIGHT;
  const edgePadding=rowHeight*((VISIBLE_ROWS-1)/2);
  const scrollRef = useRef<ScrollView>(null);
  const scrollIndex = useRef(selectedIndex);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focused, setFocused] = useState(false);
  const bound = (index: number) => Math.max(0, Math.min(options.length - 1, index));
  const currentIndex = bound(selectedIndex);
  const optionsKey = JSON.stringify(options);

  useEffect(() => {
    // User scroll already moved to this value; leave the native gesture alone.
    if (scrollIndex.current !== currentIndex) {
      scrollIndex.current = currentIndex;
      scrollRef.current?.scrollTo({ y: currentIndex * rowHeight, animated: false });
    }
  }, [currentIndex,rowHeight]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: scrollIndex.current * rowHeight, animated: false });
  }, [optionsKey,rowHeight]);

  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  function choose(index: number) {
    const nextIndex = bound(index);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    scrollIndex.current = nextIndex;
    scrollRef.current?.scrollTo({ y: nextIndex * rowHeight, animated: false });
    if (nextIndex !== currentIndex) onChange(nextIndex);
  }

  const webControl = Platform.OS === 'web' ? {
    role: 'spinbutton' as const,
    tabIndex: 0 as const,
    'aria-valuemin': 0,
    'aria-valuemax': Math.max(0, options.length - 1),
    'aria-valuenow': currentIndex,
    'aria-valuetext': options[currentIndex] ?? '',
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    onKeyDown: (event: { key: string; preventDefault: () => void }) => {
      const destinations: Record<string, number> = {
        ArrowUp: currentIndex + 1, ArrowDown: currentIndex - 1,
        Home: 0, End: options.length - 1,
      };
      if (event.key in destinations) {
        event.preventDefault();
        choose(destinations[event.key]);
      }
    },
  } : {};

  return (
    <View
      {...webControl}
      testID={testID}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityHint={hint ?? "Swipe up or down to choose."}
      accessibilityValue={{ min: 0, max: Math.max(0, options.length - 1), now: currentIndex, text: options[currentIndex] ?? '' }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={({ nativeEvent }) => choose(currentIndex + (nativeEvent.actionName === 'increment' ? 1 : -1))}
      style={[styles.wheel,{height:rowHeight*VISIBLE_ROWS+2},focused && styles.focused]}
    >
      <View pointerEvents="none" style={[styles.selection,{top:edgePadding,height:rowHeight}]} />
      <ScrollView
        ref={scrollRef}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={rowHeight}
        decelerationRate="fast"
        bounces={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content,{paddingVertical:edgePadding}]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        {...(Platform.OS === 'web' ? { tabIndex: -1, 'aria-hidden': true } : {})}
        onLayout={() => scrollRef.current?.scrollTo({ y: scrollIndex.current * rowHeight, animated: false })}
        onScroll={({ nativeEvent }) => {
          const nextIndex = bound(Math.round(nativeEvent.contentOffset.y / rowHeight));
          if (nextIndex !== scrollIndex.current) {
            scrollIndex.current = nextIndex;
            onChange(nextIndex);
          }
          // RN Web has no native snap-to-interval; finish wheel/trackpad gestures on a row.
          if (Platform.OS === 'web') {
            if (settleTimer.current) clearTimeout(settleTimer.current);
            settleTimer.current = setTimeout(() => {
              scrollRef.current?.scrollTo({ y: scrollIndex.current * rowHeight, animated: false });
            }, 120);
          }
        }}
      >
        {options.map((option, index) => (
          <Pressable
            key={`${index}-${option}`}
            accessible={false}
            focusable={false}
            {...(Platform.OS === 'web' ? { tabIndex: -1 } : {})}
            onPress={() => choose(index)}
            style={[styles.row,{height:rowHeight}]}
          >
            <Text style={[
              styles.text,
              { fontFamily: useSystemFont ? undefined : FONTS[index === currentIndex ? 'bold' : 'medium'] },
              index === currentIndex && styles.selectedText,
            ]}>{option}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: {
    borderRadius: 16, overflow: 'hidden',
    backgroundColor: COLORS.input, borderWidth: 1, borderColor: COLORS.inputBorder,
    ...Platform.select({ web: { outlineStyle: 'solid' as const, outlineWidth: 0 } }),
  },
  focused: { borderColor: COLORS.accent },
  selection: {
    position: 'absolute', left: 6, right: 6,
    borderRadius: 10, backgroundColor: COLORS.accent,
  },
  content: {},
  row: { alignItems: 'center', justifyContent: 'center' },
  text: { color: COLORS.muted, fontSize: 16, lineHeight: 20, textAlign: 'center', paddingHorizontal: 4, flexShrink: 1 },
  selectedText: { color: COLORS.card, fontWeight: '700' },
});
