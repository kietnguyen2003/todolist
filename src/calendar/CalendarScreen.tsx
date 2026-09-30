import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { COLORS } from '../theme';
import { useCalendarDay } from '../today/useCalendarDay';
import { addDays, localDate, weekDates } from '../today/model';
import { TodayNavigation, type Section } from '../today/TodayNavigation';
import { Copy, SystemFontContext } from '../today/ui';
import { useReducedMotion } from '../today/useReducedMotion';
import { usePopupEntrance } from '../today/usePopupEntrance';
import { formatTime, formatWeekRange, layoutEvents, PIXELS_PER_MINUTE, type CalendarEvent } from './model';

import { TaskForm } from './TaskForm';
import { tasksToCalendarEvents } from './taskEvents';
import { TASK_COLORS, type TaskColor } from '../theme';
import type { Task } from '../today/model';

const GUTTER=48;
const HOURS=Array.from({length:25},(_,hour)=>hour);
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
type Props={onCreateTask:(draft:{title:string;date:string;time?:string;endTime?:string;calendarStartTime?:string;recurrence?:Task['recurrence'];color?:Task['color']})=>void;onChangeTaskColor:(id:string,color:TaskColor)=>void;tasks:Task[];onSelect:(section:Section)=>void;useSystemFont?:boolean};

export function CalendarScreen({tasks,onCreateTask,onChangeTaskColor,onSelect,useSystemFont=false}:Props) {
  const {width}=useWindowDimensions();
  const desktop=Platform.OS==='web' && width>=900;
  const {today,selected,setSelected}=useCalendarDay();
  const [availableWidth,setAvailableWidth]=useState(width);
  const [detail,setDetail]=useState<CalendarEvent|null>(null);
  const [slot,setSlot]=useState<{date:string;time:string}|null>(null);
  const vertical=useRef<ScrollView>(null);
  const horizontal=useRef<ScrollView>(null);
  const offset=useRef(new Animated.Value(0)).current;
  const initialized=useRef(false);
  const reducedMotion=useReducedMotion();
  const detailEntrance=usePopupEntrance(detail!==null,reducedMotion);
  const dates=useMemo(()=>weekDates(selected),[selected]);
  const events=useMemo(()=>tasksToCalendarEvents(tasks,dates),[tasks,dates]);
  const positioned=useMemo(()=>dates.map(date=>layoutEvents(events.filter(event=>event.date===date))),[dates,events]);
  const maxOverlap=Math.max(1,...positioned.flatMap(day=>day.map(item=>item.columns)));
  const columnWidth=Math.max(desktop?80:160,maxOverlap*72+8,(availableWidth-GUTTER)/7);
  const timelineWidth=columnWidth*7;
  const monthLabel=formatWeekRange(dates[0],dates[6]);

  useEffect(()=>{
    const frame=requestAnimationFrame(()=>{
      const index=weekDates(selected).indexOf(selected);
      horizontal.current?.scrollTo({x:Math.min(index*columnWidth,Math.max(0,timelineWidth-availableWidth+GUTTER)),animated:!reducedMotion});
    });
    return ()=>cancelAnimationFrame(frame);
  },[selected,columnWidth,timelineWidth,availableWidth,reducedMotion]);

  function selectDate(date:string) {
    setSelected(date);
    const index=weekDates(date).indexOf(date);
    horizontal.current?.scrollTo({x:Math.min(index*columnWidth,Math.max(0,timelineWidth-availableWidth+GUTTER)),animated:!reducedMotion});
  }
  const closeDetail=()=>setDetail(null);
  return <SystemFontContext.Provider value={useSystemFont}>
    <SafeAreaView style={styles.screen} edges={['top','left','right']}>
      {desktop && <TodayNavigation desktop active="calendar" onSelect={onSelect}/>}
      <View style={[styles.content,desktop && styles.desktopContent]}>
        <View style={styles.header}>
          <View style={styles.heading}><Copy accessibilityRole="header" weight="bold" style={styles.title}>Calendar</Copy><Copy style={styles.subtitle}>Make time for what matters.</Copy></View>
          <View style={styles.toolbar}>
            <Copy weight="semibold" style={styles.month}>{monthLabel}</Copy>
            <View style={styles.controls}>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous week" onPress={()=>setSelected(addDays(selected,-7))} style={styles.arrow}><Feather name="chevron-left" size={20} color={COLORS.card}/></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Today" onPress={()=>selectDate(today)} style={styles.todayButton}><Copy weight="semibold">Today</Copy></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Next week" onPress={()=>setSelected(addDays(selected,7))} style={styles.arrow}><Feather name="chevron-right" size={20} color={COLORS.card}/></Pressable>
            </View>
          </View>
        </View>
        {timelineWidth>availableWidth-GUTTER+1 && <Copy style={styles.scrollHint}>Swipe to see all 7 days · Tap an empty slot to add a task</Copy>}
        <View style={styles.calendar} onLayout={event=>setAvailableWidth(event.nativeEvent.layout.width)}>
          <View style={styles.columnLabels}>
            <View style={{width:GUTTER}}><Copy style={styles.hourCaption}>Time</Copy></View>
            <View style={styles.clip}>
              <Animated.View style={{width:timelineWidth,flexDirection:'row',transform:[{translateX:Animated.multiply(offset,-1)}]}}>
                {dates.map((date,index)=><Pressable key={date} testID={`calendar-day-${date}`} accessibilityRole="button" accessibilityLabel={`${DAYS[index]}, ${localDate(date).getDate()}/${localDate(date).getMonth()+1}/${localDate(date).getFullYear()}${date===today?', today':''}`} aria-pressed={date===selected} accessibilityState={{selected:date===selected}} onPress={()=>selectDate(date)} style={[styles.columnLabel,{width:columnWidth},date===selected && styles.selectedColumnLabel]}><Copy weight="semibold" numberOfLines={1} style={styles.columnLabelText}>{DAYS[index]} · {localDate(date).getDate()}/{localDate(date).getMonth()+1}{date===today?' · Today':''}</Copy></Pressable>)}
              </Animated.View>
            </View>
          </View>
          <ScrollView ref={vertical} testID="calendar-timeline" style={styles.verticalScroll} nestedScrollEnabled onLayout={()=>{if(!initialized.current){initialized.current=true;requestAnimationFrame(()=>vertical.current?.scrollTo({y:8*60*PIXELS_PER_MINUTE,animated:false}));}}}>
            <View style={styles.timelineRow}>
              <View style={{width:GUTTER,height:1440*PIXELS_PER_MINUTE+20}}>
                {HOURS.map(hour=><Copy key={hour} style={[styles.hour,{top:hour*60*PIXELS_PER_MINUTE}]}>{String(hour).padStart(2,'0')}:00</Copy>)}
              </View>
              <ScrollView ref={horizontal} horizontal nestedScrollEnabled directionalLockEnabled style={styles.horizontalScroll} contentContainerStyle={{width:timelineWidth,height:1440*PIXELS_PER_MINUTE+20}} scrollEventThrottle={16} onScroll={Animated.event([{nativeEvent:{contentOffset:{x:offset}}}],{useNativeDriver:false})}>
                {dates.map((date,index)=><View key={date} style={[styles.dayColumn,{width:columnWidth,height:1440*PIXELS_PER_MINUTE},date===selected && styles.selectedColumn]}>
                  {HOURS.slice(0,24).map(hour=><Pressable key={hour} testID={`calendar-slot-${date}-${hour}`} accessibilityRole="button" accessibilityLabel={`Add task on ${date} at ${formatTime(hour*60)}`} onPress={()=>{setSelected(date);setSlot({date,time:formatTime(hour*60)});}} style={({pressed})=>[styles.slot,{top:hour*60*PIXELS_PER_MINUTE,height:60*PIXELS_PER_MINUTE},pressed && {backgroundColor:COLORS.roseSoft}]}/>)}
                  {positioned[index].map(({event,column,columns,top,height})=>{
                    const palette=TASK_COLORS[event.color??'navy'];
                    const textColor=palette.text;
                    const eventWidth=(columnWidth-8)/columns;
                    return <Pressable key={event.id} testID={`calendar-event-${event.id}`} accessibilityRole="button" accessibilityLabel={`${event.title}, ${event.date}, ${formatTime(event.start)} to ${formatTime(event.end)}${event.untimed?', no time set':event.endEstimated?' (estimated end)':''}${event.done ? ', complete' : ', incomplete'}`} onPress={()=>setDetail(event)} style={[styles.event,{top,height,left:4+column*eventWidth,width:eventWidth-3,backgroundColor:palette.background,borderColor:palette.border,opacity:event.done?0.72:1}]}>
                      <Copy weight="semibold" numberOfLines={height>=65?2:1} style={[styles.eventName,{color:textColor},event.done && {textDecorationLine:'line-through'}]}>{event.title}</Copy>
                      {height>=65 && <Copy numberOfLines={1} style={[styles.eventTime,{color:palette.muted}]}>{formatTime(event.start)}–{event.untimed?'end of day':formatTime(event.end)}</Copy>}
                    </Pressable>;
                  })}
                </View>)}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </View>
      {!desktop && <SafeAreaView edges={['bottom']} style={styles.bottomBar}><TodayNavigation desktop={false} active="calendar" onSelect={onSelect}/></SafeAreaView>}
      <TaskForm slot={slot} onClose={()=>setSlot(null)} onCreate={onCreateTask}/>
      <Modal visible={detail!==null} transparent animationType="none" onRequestClose={closeDetail}>
        <SafeAreaView style={styles.modalOverlay}>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,styles.detailScrim,detailEntrance.scrimStyle]}/>
          <Animated.ScrollView testID="calendar-detail" style={[styles.detailScroll,detailEntrance.cardStyle]} contentContainerStyle={styles.detail} accessibilityViewIsModal>
            <View style={styles.detailHeader}><Copy weight="bold" style={styles.detailHeading}>Task details</Copy><Pressable accessibilityRole="button" accessibilityLabel="Close details" onPress={closeDetail} style={styles.close}><Feather name="x" size={22} color={COLORS.card}/></Pressable></View>
            {detail && <>
              <Copy accessibilityRole="header" weight="bold" style={styles.detailTitle}>{detail.title}</Copy>
              <Copy style={styles.detailDate}>{detail.done?'Complete':'Incomplete'}{detail.untimed?' · No time set':''}</Copy>
              <Copy style={styles.detailDate}>{new Intl.DateTimeFormat('en',{dateStyle:'long'}).format(localDate(detail.date))}</Copy>
              {detail.recurrence&&<Copy style={styles.detailDate}>Repeats {detail.recurrence}</Copy>}
              <View style={styles.detailTimes}>
                <View><Copy style={styles.detailCaption}>{detail.untimed?'Shown from':'Start'}</Copy><Copy weight="bold" style={styles.detailTime}>{formatTime(detail.start)}</Copy></View>
                <Feather name="arrow-right" size={20} color={COLORS.paperText}/>
                <View><Copy style={styles.detailCaption}>{detail.untimed?'End of day':detail.endEstimated?'End (estimated)':'End'}</Copy><Copy weight="bold" style={styles.detailTime}>{formatTime(detail.end)}</Copy></View>
              </View>
              <Copy weight="semibold">Color</Copy>
              <View style={styles.detailColors}>
                {(Object.keys(TASK_COLORS) as TaskColor[]).map(color=><Pressable key={color} accessibilityRole="button" accessibilityLabel={`Select ${color} color`} aria-pressed={(detail.color??'navy')===color} onPress={()=>{if(detail.taskId)onChangeTaskColor(detail.taskId,color);setDetail(current=>current?{...current,color}:current);}} style={[styles.detailColor,{backgroundColor:TASK_COLORS[color].background,borderColor:(detail.color??'navy')===color?COLORS.card:TASK_COLORS[color].border}]}>{(detail.color??'navy')===color&&<Feather name="check" size={18} color={TASK_COLORS[color].text}/>}</Pressable>)}
              </View>
            </>}
            <Pressable accessibilityRole="button" onPress={closeDetail} style={styles.doneButton}><Copy weight="bold">Done</Copy></Pressable>
          </Animated.ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  </SystemFontContext.Provider>;
}

const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background},bottomBar:{backgroundColor:COLORS.card},content:{flex:1,minHeight:0},desktopContent:{paddingHorizontal:32,paddingBottom:18},
  header:{paddingHorizontal:18,paddingTop:16,paddingBottom:10,gap:12},heading:{gap:5},title:{fontSize:28},subtitle:{fontSize:12,color:COLORS.paperText},toolbar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8},month:{fontSize:15},controls:{flexDirection:'row',alignItems:'center',gap:4},arrow:{height:44,width:40,alignItems:'center',justifyContent:'center',borderRadius:13,backgroundColor:COLORS.white},todayButton:{height:44,paddingHorizontal:12,justifyContent:'center',borderRadius:13,backgroundColor:COLORS.roseSoft},
  scrollHint:{fontSize:10,color:COLORS.paperText,paddingHorizontal:18,paddingBottom:10},
  calendar:{flex:1,minHeight:0,borderTopWidth:1,borderColor:COLORS.paperBorder,backgroundColor:COLORS.white},columnLabels:{height:42,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderColor:COLORS.paperBorder},hourCaption:{fontSize:10,color:COLORS.paperText,textAlign:'center'},clip:{flex:1,overflow:'hidden'},columnLabel:{height:42,alignItems:'center',justifyContent:'center',borderLeftWidth:1,borderColor:COLORS.paperBorder},selectedColumnLabel:{backgroundColor:COLORS.roseSoft},columnLabelText:{fontSize:12},verticalScroll:{flex:1},timelineRow:{flexDirection:'row'},hour:{position:'absolute',right:6,fontSize:10,color:COLORS.paperText},horizontalScroll:{flex:1},dayColumn:{borderLeftWidth:1,borderColor:COLORS.paperBorder},selectedColumn:{backgroundColor:COLORS.background},slot:{borderTopWidth:1,borderColor:COLORS.paperBorder,position:'absolute',left:0,right:0,},event:{position:'absolute',borderWidth:1,borderRadius:9,paddingHorizontal:6,paddingVertical:5,overflow:'hidden',justifyContent:'flex-start'},eventName:{fontSize:12,lineHeight:17},eventTime:{fontSize:10,marginTop:4},
  modalOverlay:{flex:1,justifyContent:'center',alignItems:'center',padding:22},detailScrim:{backgroundColor:COLORS.overlay},detailScroll:{width:'100%',maxWidth:440,maxHeight:'100%',flexGrow:0,flexShrink:1,borderRadius:24,backgroundColor:COLORS.background},detail:{padding:22},detailHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},detailHeading:{fontSize:13,color:COLORS.paperText},close:{width:44,height:44,justifyContent:'center',alignItems:'center'},detailTitle:{fontSize:24,marginTop:12},detailDate:{color:COLORS.paperText,marginTop:10},detailTimes:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:COLORS.roseSoft,padding:18,borderRadius:16,marginVertical:24},detailCaption:{fontSize:12,color:COLORS.paperText},detailTime:{fontSize:23,marginTop:5},detailColors:{flexDirection:'row',gap:10,marginBottom:20,marginTop:12},detailColor:{width:48,height:44,borderRadius:12,borderWidth:2,alignItems:'center',justifyContent:'center'},doneButton:{height:48,borderRadius:24,backgroundColor:COLORS.accent,alignItems:'center',justifyContent:'center'},
});
