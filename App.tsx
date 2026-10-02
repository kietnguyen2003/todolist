import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, Text, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { COLORS } from './src/theme';
import { CalendarScreen } from './src/calendar/CalendarScreen';
import type { Section } from './src/today/TodayNavigation';
import { TodayScreen } from './src/today/TodayScreen';
import { TrackerScreen } from './src/tracker/TrackerScreen';
import { createTrackerDemo } from './src/tracker/sampleData';
import { usePersistentTodayState } from './src/storage/usePersistentTodayState';
import { dateKey, type Task } from './src/today/model';

export default function App() {
  const [screen, setScreen] = useState<Section>('todo');
  function navigate(section: Section) {
    setScreen(section);
  }
  const {state:todayState,dispatch,ready,error,retry}=usePersistentTodayState();
  const taskSequence=useRef(0);
  function addTask(draft:Pick<Task,'title'|'date'|'time'|'endTime'|'calendarStartTime'|'recurrence'|'color'>) {
    dispatch({type:'addTask',task:{...draft,id:`task-${Date.now()}-${taskSequence.current++}`,done:false,icon:'check-square'}});
  }
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen !== 'todo') { navigate('todo'); return true; }
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
        <Pressable accessibilityRole="button" accessibilityLabel="Retry storage" onPress={retry} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable>
      </View>}
      {(!fontsLoaded && !fontError) || !ready ? (
        <View style={styles.loading}>
          {!error && <ActivityIndicator color={COLORS.card} accessibilityLabel="Loading app" />}
        </View>
      ) : (
        screen === 'calendar' ? (
          <CalendarScreen onCreateTask={addTask} onChangeTaskColor={(id,color)=>dispatch({type:'setTaskColor',id,color})} onDeleteTask={id=>dispatch({type:'deleteTask',id})} tasks={todayState.tasks} useSystemFont={Boolean(fontError)} onSelect={navigate} />
        ) : screen === 'tracker' ? (
          <TrackerScreen state={todayState} onSelect={navigate} useSystemFont={Boolean(fontError)} onLoadDemo={()=>dispatch({type:'seedTrackerDemo',...createTrackerDemo(dateKey(new Date()))})}/>
        ) : (
          <TodayScreen onCreateTask={addTask} onCalendar={() => navigate('calendar')} onTracker={() => navigate('tracker')} useSystemFont={Boolean(fontError)} state={todayState} dispatch={dispatch} />
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
