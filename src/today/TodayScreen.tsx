import { useEffect, useRef, useState, type Dispatch } from 'react';
import { Animated, Image, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { COLORS } from '../theme';
import { useCalendarDay } from '../today/useCalendarDay';
import { habitCount, habitStreak, tasksForDate, type TodayAction, type TodayState, type Task } from './model';
import { TaskForm } from '../calendar/TaskForm';
import { HabitForm } from './HabitForm';
import { HabitRow } from './HabitRow';
import { TodayNavigation, type Section } from './TodayNavigation';
import { Copy, SystemFontContext } from './ui';
import { WeekCalendar, type WeekCalendarHandle } from './WeekCalendar';
import { Collapsible } from './Collapsible';
import { useReducedMotion } from './useReducedMotion';
import { TaskItem } from './TaskItem';

type TodaySection=Exclude<Section,'calendar'>;
type Props={onCreateTask:(draft:Pick<Task,'title'|'date'|'time'|'endTime'>)=>void;initialSection?:TodaySection;onCalendar:()=>void;state:TodayState;dispatch:Dispatch<TodayAction>;useSystemFont?:boolean};
export function TodayScreen({state,dispatch,onCreateTask,onCalendar,initialSection='today',useSystemFont=false}:Props) {
  const {width}=useWindowDimensions();
  const desktop=Platform.OS==='web' && width>=900;
  const {selected,setSelected}=useCalendarDay();
  const [active,setActive]=useState<TodaySection>(initialSection);
  const [taskSlot,setTaskSlot]=useState<{date:string}|null>(null);
  const [formOpen,setFormOpen]=useState(false);
  const [tasksCollapsed,setTasksCollapsed]=useState(false);
  const [habitsCollapsed,setHabitsCollapsed]=useState(false);
  const tasksRotation=useRef(new Animated.Value(0)).current;
  const habitsRotation=useRef(new Animated.Value(0)).current;
  const calendar=useRef<WeekCalendarHandle>(null);
  const reducedMotion=useReducedMotion();
  const scroll=useRef<ScrollView>(null);
  const positions=useRef({top:0,tasks:0,habits:0});
  const nextHabitId=useRef(0);
  const pendingNavigation=useRef<TodaySection|null>(null);
  const navigationFrame=useRef<number|null>(null);
  useEffect(()=>()=>{if(navigationFrame.current!==null) cancelAnimationFrame(navigationFrame.current);},[]);
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
  function scrollToSection(section:TodaySection) {
    scroll.current?.scrollTo({y:section==='today'?0:positions.current.top+positions.current[section],animated:!reducedMotion});
  }
  function afterExpand(section:TodaySection) {
    if(pendingNavigation.current!==section) return;
    if(navigationFrame.current!==null) cancelAnimationFrame(navigationFrame.current);
    navigationFrame.current=requestAnimationFrame(()=>{
      if(pendingNavigation.current!==section) return;
      pendingNavigation.current=null;
      scrollToSection(section);
    });
  }
  function navigate(section:Section) {
    if(section==='calendar') { onCalendar(); return; }
    setActive(section);
    pendingNavigation.current=null;
    if(section==='today') calendar.current?.goToToday();
    if((section==='tasks' && tasksCollapsed) || (section==='habits' && habitsCollapsed)) {
      pendingNavigation.current=section;
      if(section==='tasks') setTasksCollapsed(false);
      else setHabitsCollapsed(false);
      return;
    }
    scrollToSection(section);
  }
  const entryHandled=useRef(false);
  function handleEntryLayout() {
    if(entryHandled.current) return;
    entryHandled.current=true;
    if(initialSection!=='today') navigationFrame.current=requestAnimationFrame(()=>navigate(initialSection));
  }
  const navigation=<TodayNavigation desktop={desktop} active={active} onSelect={navigate}/>;
  return <SystemFontContext.Provider value={useSystemFont}>
    <SafeAreaView style={styles.safe} edges={['top','left','right']}>
      {desktop && navigation}
      <ScrollView ref={scroll} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets keyboardDismissMode="on-drag">
        <View onLayout={handleEntryLayout} style={[styles.content,desktop && styles.desktopContent]}>
          <View style={styles.heading}>
            <View style={styles.headingText}>
              <Copy weight="semibold" style={styles.eyebrow}>TỪNG BƯỚC MỖI NGÀY</Copy>
              <Copy accessibilityRole="header" weight="bold" style={styles.title}>Một ngày có ý nghĩa.</Copy>
              <Copy style={styles.subtitle}>Dành thời gian cho những điều quan trọng.</Copy>
            </View>
            <View testID="today-header-logo" style={[styles.headerLogo,desktop && styles.headerLogoDesktop]}><Image source={require('../../logo.png')} accessibilityLabel="Logo Từng bước" resizeMode="contain" style={styles.headerLogoImage}/></View>
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryBottom}><Copy style={styles.summaryCopy}><Copy weight="bold" style={styles.summaryNumber}>{doneTasks}/{tasks.length}</Copy> công việc hoàn thành</Copy><Copy style={styles.summaryCopy}><Copy weight="bold" style={styles.summaryNumber}>{doneHabits}/{habits.length}</Copy> thói quen đạt mục tiêu</Copy></View>
          </View>

          <WeekCalendar ref={calendar} selected={selected} onSelect={setSelected} reducedMotion={reducedMotion}/>

          <View style={[styles.columns,desktop && styles.desktopColumns]} onLayout={event=>{positions.current.top=event.nativeEvent.layout.y;}}>
            <View style={[styles.column,desktop && styles.desktopColumn]} onLayout={event=>{positions.current.tasks=event.nativeEvent.layout.y;}}>
              <View style={styles.sectionHeading}><Feather name="check-square" size={20} color={COLORS.card}/><Copy accessibilityRole="header" weight="bold" style={styles.sectionTitle}>Công việc</Copy><Copy style={styles.counter}>{doneTasks}/{tasks.length}</Copy><Pressable accessibilityRole="button" accessibilityLabel="Thêm công việc" onPress={()=>setTaskSlot({date:selected})} style={styles.collapseButton}><Feather name="plus" size={19} color={COLORS.card}/></Pressable><Pressable accessibilityRole="button" accessibilityLabel={tasksCollapsed?'Hiện công việc':'Ẩn công việc'} aria-expanded={!tasksCollapsed} onPress={()=>toggleSection(setTasksCollapsed)} style={styles.collapseButton}><Animated.View style={{transform:[{rotate:tasksRotation.interpolate({inputRange:[0,1],outputRange:['0deg','180deg']})}]}}><Feather name="chevron-up" size={20} color={COLORS.card}/></Animated.View></Pressable></View>
              <Collapsible collapsed={tasksCollapsed} reducedMotion={reducedMotion} onExpanded={()=>afterExpand('tasks')}><View style={styles.list}>
                {tasks.map(task=><TaskItem key={task.id} task={task} reducedMotion={reducedMotion} onToggle={()=>dispatch({type:'toggleTask',id:task.id,date:selected})}/>)}
                {!tasks.length && <View style={styles.empty}><Feather name="coffee" size={26} color={COLORS.paperText}/><Copy weight="semibold">Một khoảng trống dễ chịu.</Copy><Copy style={styles.emptyText}>Chưa có công việc cho ngày này.</Copy></View>}
              </View><Copy style={styles.note}>Mỗi việc hoàn thành là một bước tiến nhỏ.</Copy></Collapsible>
            </View>
            <View style={[styles.column,desktop && styles.desktopColumn]} onLayout={event=>{positions.current.habits=event.nativeEvent.layout.y;}}>
              <View style={styles.sectionHeading}><Feather name="repeat" size={20} color={COLORS.card}/><Copy accessibilityRole="header" weight="bold" style={styles.sectionTitle}>Thói quen hằng ngày</Copy><Pressable accessibilityRole="button" accessibilityLabel={habitsCollapsed?'Hiện thói quen':'Ẩn thói quen'} aria-expanded={!habitsCollapsed} onPress={()=>toggleSection(setHabitsCollapsed)} style={styles.collapseButton}><Animated.View style={{transform:[{rotate:habitsRotation.interpolate({inputRange:[0,1],outputRange:['0deg','180deg']})}]}}><Feather name="chevron-up" size={20} color={COLORS.card}/></Animated.View></Pressable></View>
              <Collapsible collapsed={habitsCollapsed} reducedMotion={reducedMotion} onExpanded={()=>afterExpand('habits')}><View style={styles.list}>
                {habits.map(habit=><HabitRow key={`${habit.id}:${selected}`} reducedMotion={reducedMotion} habit={habit} streak={habitStreak(state,habit.id,selected)} count={habitCount(state,habit.id,selected)} onChange={count=>dispatch({type:'setCount',id:habit.id,date:selected,count})}/>)}
                {!habits.length && <Copy style={styles.emptyText}>Chưa có thói quen cho ngày này. Bắt đầu một điều nhỏ nhé.</Copy>}
                <Pressable accessibilityRole="button" onPress={()=>setFormOpen(true)} style={({pressed})=>[styles.newHabit,pressed && styles.pressed]}><Feather name="plus" size={19} color={COLORS.card}/><Copy weight="semibold">Thêm thói quen</Copy></Pressable>
              </View></Collapsible>
            </View>
          </View>
          <Copy style={styles.bottomNote}>Không cần làm tất cả. Chỉ cần bắt đầu.</Copy>
        </View>
      </ScrollView>
      {!desktop && <SafeAreaView edges={['bottom']} style={styles.bottomBar}>{navigation}</SafeAreaView>}
      <TaskForm slot={taskSlot} onClose={()=>setTaskSlot(null)} onCreate={draft=>{onCreateTask(draft);setSelected(draft.date);}}/>
      <HabitForm visible={formOpen} onClose={()=>setFormOpen(false)} useSystemFont={useSystemFont} onCreate={draft=>dispatch({type:'addHabit',habit:{...draft,id:`habit-${Date.now()}-${nextHabitId.current++}`,startDate:selected,icon:'activity'}})}/>
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
});
