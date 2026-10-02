import { useEffect, useRef, useState, type Dispatch } from 'react';
import { Animated, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { COLORS } from '../theme';
import { useCalendarDay } from '../today/useCalendarDay';
import { habitCount, habitStreak, tasksForDate, type TodayAction, type TodayState, type Task, type Habit } from './model';
import { TaskForm } from '../calendar/TaskForm';
import { HabitForm } from './HabitForm';
import { HabitRow } from './HabitRow';
import { TodayNavigation, type Section } from './TodayNavigation';
import { Copy, SystemFontContext } from './ui';
import { WeekCalendar, type WeekCalendarHandle } from './WeekCalendar';
import { Collapsible } from './Collapsible';
import { useReducedMotion } from './useReducedMotion';
import { usePopupEntrance } from './usePopupEntrance';
import { TaskItem } from './TaskItem';

type Props={onCreateTask:(draft:Pick<Task,'title'|'date'|'time'|'endTime'|'calendarStartTime'|'recurrence'|'color'>)=>void;onCalendar:()=>void;onTracker:()=>void;state:TodayState;dispatch:Dispatch<TodayAction>;useSystemFont?:boolean};
export function TodayScreen({state,dispatch,onCreateTask,onCalendar,onTracker,useSystemFont=false}:Props) {
  const {width}=useWindowDimensions();
  const desktop=Platform.OS==='web' && width>=900;
  const {selected,setSelected}=useCalendarDay();
  const [taskSlot,setTaskSlot]=useState<{date:string;calendarStartTime:string}|null>(null);
  const [formOpen,setFormOpen]=useState(false);
  const [editingHabit,setEditingHabit]=useState<Habit|null>(null);
  const [deletingHabit,setDeletingHabit]=useState<Habit|null>(null);
  const [tasksCollapsed,setTasksCollapsed]=useState(false);
  const [habitsCollapsed,setHabitsCollapsed]=useState(false);
  const tasksRotation=useRef(new Animated.Value(0)).current;
  const habitsRotation=useRef(new Animated.Value(0)).current;
  const calendar=useRef<WeekCalendarHandle>(null);
  const reducedMotion=useReducedMotion();
  const deleteEntrance=usePopupEntrance(deletingHabit!==null,reducedMotion);
  const scroll=useRef<ScrollView>(null);
  const nextHabitId=useRef(0);
  const tasks=tasksForDate(state,selected);
  const habits=state.habits.filter(habit=>habit.startDate<=selected);
  const doneTasks=tasks.filter(task=>task.done).length;
  const doneHabits=habits.filter(habit=>habitCount(state,habit.id,selected)>=habit.target).length;
  useEffect(()=>{
    const animation=Animated.timing(tasksRotation,{toValue:tasksCollapsed?1:0,duration:reducedMotion?0:160,useNativeDriver:true});
    animation.start();
    return ()=>animation.stop();
  },[tasksCollapsed,tasksRotation,reducedMotion]);
  useEffect(()=>{
    const animation=Animated.timing(habitsRotation,{toValue:habitsCollapsed?1:0,duration:reducedMotion?0:160,useNativeDriver:true});
    animation.start();
    return ()=>animation.stop();
  },[habitsCollapsed,habitsRotation,reducedMotion]);
  function toggleSection(setCollapsed:(value:(current:boolean)=>boolean)=>void) {
    setCollapsed(value=>!value);
  }
  function navigate(section:Section) {
    if(section==='calendar') { onCalendar(); return; }
    if(section==='tracker') { onTracker(); return; }
    calendar.current?.goToToday();
    scroll.current?.scrollTo({y:0,animated:!reducedMotion});
  }
  const navigation=<TodayNavigation desktop={desktop} active="todo" onSelect={navigate}/>;
  return <SystemFontContext.Provider value={useSystemFont}>
    <SafeAreaView style={styles.safe} edges={['top','left','right']}>
      {desktop && navigation}
      <ScrollView ref={scroll} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets keyboardDismissMode="on-drag">
        <View style={[styles.content,desktop && styles.desktopContent]}>
          <View style={styles.heading}>
            <View style={styles.headingText}>
              <Copy weight="semibold" style={styles.eyebrow}>TEA PRET · EVERY DAY</Copy>
              <Copy accessibilityRole="header" weight="bold" style={styles.title}>Make today meaningful.</Copy>
              <Copy style={styles.subtitle}>Make time for what matters.</Copy>
            </View>
            <View testID="today-header-logo" style={[styles.headerLogo,desktop && styles.headerLogoDesktop]}><Image source={require('../../logo.png')} accessibilityLabel="Logo Tea Pret" resizeMode="contain" style={styles.headerLogoImage}/></View>
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryBottom}><Copy style={styles.summaryCopy}><Copy weight="bold" style={styles.summaryNumber}>{doneTasks}/{tasks.length}</Copy> tasks done</Copy><Copy style={styles.summaryCopy}><Copy weight="bold" style={styles.summaryNumber}>{doneHabits}/{habits.length}</Copy> habits complete</Copy></View>
          </View>

          <WeekCalendar ref={calendar} selected={selected} onSelect={setSelected} reducedMotion={reducedMotion}/>

          <View style={[styles.columns,desktop && styles.desktopColumns]}>
            <View style={[styles.column,desktop && styles.desktopColumn]}>
              <View style={styles.sectionHeading}><Feather name="check-square" size={20} color={COLORS.card}/><Copy accessibilityRole="header" weight="bold" style={styles.sectionTitle}>Tasks</Copy><Copy style={styles.counter}>{doneTasks}/{tasks.length}</Copy><Pressable accessibilityRole="button" accessibilityLabel="Add task" onPress={()=>{const now=new Date();setTaskSlot({date:selected,calendarStartTime:`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`});}} style={styles.collapseButton}><Feather name="plus" size={19} color={COLORS.card}/></Pressable><Pressable accessibilityRole="button" accessibilityLabel={tasksCollapsed?'Show tasks':'Hide tasks'} aria-expanded={!tasksCollapsed} onPress={()=>toggleSection(setTasksCollapsed)} style={styles.collapseButton}><Animated.View style={{transform:[{rotate:tasksRotation.interpolate({inputRange:[0,1],outputRange:['0deg','180deg']})}]}}><Feather name="chevron-up" size={20} color={COLORS.card}/></Animated.View></Pressable></View>
              <Collapsible collapsed={tasksCollapsed} reducedMotion={reducedMotion}><View style={styles.list}>
                {tasks.map(task=><TaskItem key={task.id} task={task} reducedMotion={reducedMotion} onToggle={()=>dispatch({type:'toggleTask',id:task.id,date:selected})}/>)}
                {!tasks.length && <View style={styles.empty}><Feather name="coffee" size={26} color={COLORS.paperText}/><Copy weight="semibold">A little breathing room.</Copy><Copy style={styles.emptyText}>No tasks for this day yet.</Copy></View>}
              </View><Copy style={styles.note}>Every completed task is a small step forward.</Copy></Collapsible>
            </View>
            <View style={[styles.column,desktop && styles.desktopColumn]}>
              <View style={styles.sectionHeading}><Feather name="repeat" size={20} color={COLORS.card}/><Copy accessibilityRole="header" weight="bold" style={styles.sectionTitle}>Daily habits</Copy><Pressable accessibilityRole="button" accessibilityLabel={habitsCollapsed?'Show habits':'Hide habits'} aria-expanded={!habitsCollapsed} onPress={()=>toggleSection(setHabitsCollapsed)} style={styles.collapseButton}><Animated.View style={{transform:[{rotate:habitsRotation.interpolate({inputRange:[0,1],outputRange:['0deg','180deg']})}]}}><Feather name="chevron-up" size={20} color={COLORS.card}/></Animated.View></Pressable></View>
              <Collapsible collapsed={habitsCollapsed} reducedMotion={reducedMotion}><View style={styles.list}>
                {habits.map(habit=><HabitRow key={`${habit.id}:${selected}`} reducedMotion={reducedMotion} habit={habit} streak={habitStreak(state,habit.id,selected)} count={habitCount(state,habit.id,selected)} onChange={count=>dispatch({type:'setCount',id:habit.id,date:selected,count})} onEdit={()=>setEditingHabit(habit)} onDelete={()=>setDeletingHabit(habit)}/>)}
                {!habits.length && <Copy style={styles.emptyText}>No habits for this day yet. Start with one small step.</Copy>}
                <Pressable accessibilityRole="button" accessibilityLabel="Add habit" onPress={()=>setFormOpen(true)} style={({pressed})=>[styles.newHabit,pressed && styles.pressed]}><Feather name="plus" size={19} color={COLORS.card}/><Copy weight="semibold">Add habit</Copy></Pressable>
              </View></Collapsible>
            </View>
          </View>
          <Copy style={styles.bottomNote}>You don't have to do it all. Just begin.</Copy>
        </View>
      </ScrollView>
      {!desktop && <SafeAreaView edges={['bottom']} style={styles.bottomBar}>{navigation}</SafeAreaView>}
      <TaskForm slot={taskSlot} onClose={()=>setTaskSlot(null)} onCreate={draft=>{onCreateTask(draft);setSelected(draft.date);}}/>
      <HabitForm visible={formOpen||editingHabit!==null} habit={editingHabit} onClose={()=>{setFormOpen(false);setEditingHabit(null);}} useSystemFont={useSystemFont} onSave={draft=>editingHabit?dispatch({type:'updateHabit',id:editingHabit.id,...draft}):dispatch({type:'addHabit',habit:{...draft,id:`habit-${Date.now()}-${nextHabitId.current++}`,startDate:selected,icon:'activity'}})}/>
      <Modal visible={deletingHabit!==null} transparent animationType="none" onRequestClose={()=>setDeletingHabit(null)}>
        <SafeAreaView style={styles.deleteBackdrop}><Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,styles.deleteScrim,deleteEntrance.scrimStyle]}/><Animated.View testID="delete-popup-card" style={[styles.deleteCard,deleteEntrance.cardStyle]} accessibilityViewIsModal>
          <Copy accessibilityRole="header" weight="bold" style={styles.deleteTitle}>Delete {deletingHabit?.name}?</Copy>
          <Copy style={styles.deleteDescription}>This removes the habit and all its saved daily progress.</Copy>
          <View style={styles.deleteActions}><Pressable accessibilityRole="button" onPress={()=>setDeletingHabit(null)} style={styles.deleteCancel}><Copy weight="semibold">Cancel</Copy></Pressable><Pressable accessibilityRole="button" onPress={()=>{if(deletingHabit)dispatch({type:'deleteHabit',id:deletingHabit.id});setDeletingHabit(null);}} style={styles.deleteConfirm}><Copy weight="bold" style={styles.deleteConfirmText}>Delete permanently</Copy></Pressable></View>
        </Animated.View></SafeAreaView>
      </Modal>
    </SafeAreaView>
  </SystemFontContext.Provider>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.background},scroll:{flexGrow:1,alignItems:'center'},content:{width:'100%',maxWidth:660,paddingHorizontal:18,paddingTop:18,paddingBottom:20},desktopContent:{maxWidth:1120,paddingHorizontal:40,paddingTop:30},
  heading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14,gap:14},headingText:{flex:1},eyebrow:{fontSize:9,letterSpacing:1.8,color:COLORS.paperText,marginBottom:8},title:{fontSize:27,letterSpacing:-1,lineHeight:37},subtitle:{fontSize:12,lineHeight:20,color:COLORS.paperText,marginTop:2},headerLogo:{width:52,height:52,borderRadius:16,backgroundColor:COLORS.accent,overflow:'hidden',flexShrink:0},headerLogoDesktop:{width:68,height:68,borderRadius:20},headerLogoImage:{width:'100%',height:'100%'},
  summary:{backgroundColor:COLORS.card,borderRadius:16,paddingHorizontal:16,paddingVertical:11},summaryBottom:{flexDirection:'row',gap:12},summaryCopy:{flex:1,minWidth:0,fontSize:11,lineHeight:18,color:COLORS.muted},summaryNumber:{fontSize:15,color:COLORS.accent},
  columns:{gap:24},desktopColumns:{flexDirection:'row',alignItems:'flex-start',gap:28},column:{minWidth:0},desktopColumn:{flex:1},sectionHeading:{flexDirection:'row',alignItems:'center',gap:9,marginBottom:12,minHeight:30},sectionTitle:{fontSize:16,flex:1},counter:{color:COLORS.paperText,fontSize:12},collapseButton:{width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:10,backgroundColor:COLORS.white},list:{gap:8},
  pressed:{opacity:0.75},note:{fontSize:11,color:COLORS.paperText,lineHeight:18,marginTop:12},
  empty:{padding:20,gap:12,alignItems:'center',backgroundColor:COLORS.white,borderRadius:18},emptyText:{fontSize:12,color:COLORS.paperText,textAlign:'center',lineHeight:20},newHabit:{minHeight:54,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,borderWidth:1,borderColor:COLORS.accent,borderStyle:'dashed',borderRadius:16,backgroundColor:COLORS.roseSoft},bottomNote:{textAlign:'center',fontSize:11,color:COLORS.paperText,marginTop:24},bottomBar:{backgroundColor:COLORS.card},
  deleteBackdrop:{flex:1,justifyContent:'center',alignItems:'center',padding:20},deleteScrim:{backgroundColor:COLORS.overlay},deleteCard:{width:'100%',maxWidth:420,backgroundColor:COLORS.background,borderRadius:20,padding:22,gap:14},deleteTitle:{fontSize:20},deleteDescription:{fontSize:13,color:COLORS.paperText,lineHeight:20},deleteActions:{flexDirection:'row',gap:8,marginTop:6},deleteCancel:{flex:1,minHeight:44,alignItems:'center',justifyContent:'center',backgroundColor:COLORS.white,borderRadius:12},deleteConfirm:{flex:1.5,minHeight:44,alignItems:'center',justifyContent:'center',backgroundColor:COLORS.card,borderRadius:12},deleteConfirmText:{color:COLORS.white},
});
