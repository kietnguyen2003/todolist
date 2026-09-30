import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, Text, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { COLORS } from './src/theme';
import { CalendarScreen } from './src/calendar/CalendarScreen';
import { tasksToCalendarEvents } from './src/calendar/taskEvents';
import type { Section } from './src/today/TodayNavigation';
import { TodayScreen } from './src/today/TodayScreen';
import { usePersistentTodayState } from './src/storage/usePersistentTodayState';
import type { Task } from './src/today/model';

export default function App() {
  const [screen, setScreen] = useState<'today' | 'calendar'>('today');
  const [todaySection, setTodaySection] = useState<Exclude<Section,'calendar'>>('today');
  function navigate(section: Section) {
    if(section==='calendar') {setScreen('calendar');return;}
    setTodaySection(section);setScreen('today');
  }
  const {state:todayState,dispatch,ready,error,retry}=usePersistentTodayState();
  const taskSequence=useRef(0);
  function addTask(draft:Pick<Task,'title'|'date'|'time'|'endTime'>) {
    dispatch({type:'addTask',task:{...draft,id:`task-${Date.now()}-${taskSequence.current++}`,done:false,icon:'check-square'}});
  }
  const events = useMemo(() => tasksToCalendarEvents(todayState.tasks), [todayState.tasks]);
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'calendar') { navigate('today'); return true; }
      return false;
    });
    return () => listener.remove();
  }, [screen]);
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      {error && <View accessibilityRole="alert" style={styles.storageError}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Thử lại lưu trữ" onPress={retry} style={styles.retry}><Text style={styles.retryText}>Thử lại</Text></Pressable>
      </View>}
      {(!fontsLoaded && !fontError) || !ready ? (
        <View style={styles.loading}>
          {!error && <ActivityIndicator color={COLORS.card} accessibilityLabel="Đang tải giao diện" />}
        </View>
      ) : (
        screen === 'calendar' ? (
          <CalendarScreen onCreateTask={addTask} events={events} useSystemFont={Boolean(fontError)} onSelect={navigate} />
        ) : (
          <TodayScreen onCreateTask={addTask} initialSection={todaySection} onCalendar={() => navigate('calendar')} useSystemFont={Boolean(fontError)} state={todayState} dispatch={dispatch} />
        )
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  storageError:{backgroundColor:COLORS.roseSoft,padding:16,gap:8},
  errorText:{color:COLORS.errorInk,fontSize:14},retry:{alignSelf:'flex-start',minHeight:44,justifyContent:'center',paddingHorizontal:16,borderRadius:12,backgroundColor:COLORS.card},retryText:{color:COLORS.white},
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
});
