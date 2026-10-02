import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions, type GestureResponderEvent, type ViewStyle } from 'react-native';
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
import { TaskColorPicker } from './TaskColorPicker';
import { tasksToCalendarEvents } from './taskEvents';
import { TASK_COLORS, type TaskColor } from '../theme';
import type { Task } from '../today/model';

const GUTTER=48;
const MAX_COLUMN_ZOOM=2;
const ZOOM_STEP=0.25;
const WEB_TOUCH_STYLE={touchAction:'pan-x pan-y'} as unknown as ViewStyle;
const HOURS=Array.from({length:25},(_,hour)=>hour);
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
function touchDistance(touches: readonly {pageX:number;pageY:number}[]):number {
  return Math.abs(touches[0].pageX-touches[1].pageX);
}
type Props={onCreateTask:(draft:{title:string;date:string;time?:string;endTime?:string;calendarStartTime?:string;recurrence?:Task['recurrence'];color?:Task['color']})=>void;onChangeTaskColor:(id:string,color:TaskColor)=>void;onDeleteTask:(id:string)=>void;tasks:Task[];onSelect:(section:Section)=>void;useSystemFont?:boolean};

export function CalendarScreen({tasks,onCreateTask,onChangeTaskColor,onDeleteTask,onSelect,useSystemFont=false}:Props) {
  const {width}=useWindowDimensions();
  const desktop=Platform.OS==='web' && width>=900;
  const {today,selected,setSelected}=useCalendarDay();
  const [availableWidth,setAvailableWidth]=useState(width);
  const [detail,setDetail]=useState<CalendarEvent|null>(null);
  const [confirmDelete,setConfirmDelete]=useState(false);
  const [slot,setSlot]=useState<{date:string;time:string}|null>(null);
  const [columnZoom,setColumnZoom]=useState<number|'fit'>(1);
  const [pinching,setPinching]=useState(false);
  const vertical=useRef<ScrollView>(null);
  const horizontal=useRef<ScrollView>(null);
  const columnZoomRef=useRef<number|'fit'>(1);
  const columnWidthRef=useRef(160);
  const scrollX=useRef(0);
  const zoomFrame=useRef<number|null>(null);
  const pinch=useRef<{distance:number;zoom:number}|null>(null);
  const offset=useRef(new Animated.Value(0)).current;
  const initialized=useRef(false);
  const reducedMotion=useReducedMotion();
  const detailEntrance=usePopupEntrance(detail!==null,reducedMotion);
  const dates=useMemo(()=>weekDates(selected),[selected]);
  const events=useMemo(()=>tasksToCalendarEvents(tasks,dates),[tasks,dates]);
  const positioned=useMemo(()=>dates.map(date=>layoutEvents(events.filter(event=>event.date===date))),[dates,events]);
  const maxOverlap=Math.max(1,...positioned.flatMap(day=>day.map(item=>item.columns)));
  const fitColumnWidth=Math.max(1,(availableWidth-GUTTER)/7);
  const defaultColumnWidth=Math.max(desktop?80:160,maxOverlap*72+8,fitColumnWidth);
  const columnWidth=desktop?defaultColumnWidth:columnZoom==='fit'?fitColumnWidth:Math.max(fitColumnWidth,Math.min(defaultColumnWidth*MAX_COLUMN_ZOOM,defaultColumnWidth*columnZoom));
  columnWidthRef.current=columnWidth;
  const timelineWidth=columnWidth*7;
  const dayHeight=1440*PIXELS_PER_MINUTE;
  const monthLabel=formatWeekRange(dates[0],dates[6]);

  useEffect(()=>()=>{if(zoomFrame.current!==null)cancelAnimationFrame(zoomFrame.current);},[]);

  function zoomTo(requested:number|'fit') {
    const fitRatio=fitColumnWidth/defaultColumnWidth;
    const nextZoom=requested==='fit'||requested<=fitRatio?'fit':Math.min(MAX_COLUMN_ZOOM,Math.round(requested*100)/100);
    const nextWidth=nextZoom==='fit'?fitColumnWidth:defaultColumnWidth*nextZoom;
    const previous=columnWidthRef.current;
    if(Math.abs(nextWidth-previous)<0.5)return;
    const visibleWidth=availableWidth-GUTTER;
    const focalX=visibleWidth/2;
    const target=Math.max(0,Math.min(nextWidth*7-visibleWidth,(scrollX.current+focalX)*nextWidth/previous-focalX));
    columnZoomRef.current=nextZoom;
    columnWidthRef.current=nextWidth;
    scrollX.current=target;
    setColumnZoom(nextZoom);
    offset.setValue(target);
    if(zoomFrame.current!==null)cancelAnimationFrame(zoomFrame.current);
    zoomFrame.current=requestAnimationFrame(()=>{horizontal.current?.scrollTo({x:target,animated:false});zoomFrame.current=null;});
  }
  function handleTouchStart(event:GestureResponderEvent) {
    if(desktop || event.nativeEvent.touches.length<2)return;
    if(pinch.current)return;
    pinch.current={distance:touchDistance(event.nativeEvent.touches),zoom:columnWidthRef.current/defaultColumnWidth};
    setPinching(true);
  }
  function handleTouchMove(event:GestureResponderEvent) {
    if(desktop || event.nativeEvent.touches.length<2)return;
    if(!pinch.current)handleTouchStart(event);
    if(!pinch.current || pinch.current.distance<12)return;
    zoomTo(pinch.current.zoom*touchDistance(event.nativeEvent.touches)/pinch.current.distance);
    event.preventDefault();
  }
  function handleTouchEnd(event:GestureResponderEvent) {
    if(event.nativeEvent.touches.length>=2)return;
    pinch.current=null;
    setPinching(false);
  }

  useEffect(()=>{
    const frame=requestAnimationFrame(()=>{
      const index=weekDates(selected).indexOf(selected);
      horizontal.current?.scrollTo({x:Math.min(index*columnWidth,Math.max(0,timelineWidth-availableWidth+GUTTER)),animated:!reducedMotion});
    });
    return ()=>cancelAnimationFrame(frame);
  },[selected,availableWidth,reducedMotion]);

  function selectDate(date:string) {
    setSelected(date);
    const index=weekDates(date).indexOf(date);
    horizontal.current?.scrollTo({x:Math.min(index*columnWidth,Math.max(0,timelineWidth-availableWidth+GUTTER)),animated:!reducedMotion});
  }
  const closeDetail=()=>{setDetail(null);setConfirmDelete(false);};
  const deleteSelectedTask=()=>{
    if(!detail?.taskId)return;
    onDeleteTask(detail.taskId);
    closeDetail();
  };
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
        {!desktop && <View style={styles.zoomToolbar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Fit week" onPress={()=>zoomTo('fit')} style={[styles.fitButton,columnZoom==='fit' && styles.fitButtonActive]}><Copy weight="semibold" style={styles.fitText}>Fit week</Copy></Pressable>
          <View style={styles.zoomControls}>
            <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" disabled={columnZoom==='fit'} onPress={()=>zoomTo((columnZoomRef.current==='fit'?fitColumnWidth/defaultColumnWidth:columnZoomRef.current)-ZOOM_STEP)} style={[styles.zoomButton,columnZoom==='fit' && styles.zoomDisabled]}><Feather name="minus" size={18} color={COLORS.card}/></Pressable>
            <Copy testID="calendar-zoom-level" weight="semibold" style={styles.zoomLevel}>{Math.round(columnWidth/defaultColumnWidth*100)}%</Copy>
            <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" disabled={columnZoom===MAX_COLUMN_ZOOM} onPress={()=>zoomTo((columnZoomRef.current==='fit'?fitColumnWidth/defaultColumnWidth:columnZoomRef.current)+ZOOM_STEP)} style={[styles.zoomButton,columnZoom===MAX_COLUMN_ZOOM && styles.zoomDisabled]}><Feather name="plus" size={18} color={COLORS.card}/></Pressable>
          </View>
        </View>}
        <View testID="calendar-viewport" style={[styles.calendar,!desktop && Platform.OS==='web' && WEB_TOUCH_STYLE]} onLayout={event=>setAvailableWidth(event.nativeEvent.layout.width)} onMoveShouldSetResponderCapture={event=>!desktop && event.nativeEvent.touches.length>=2} onResponderGrant={handleTouchStart} onResponderMove={handleTouchMove} onResponderRelease={handleTouchEnd} onResponderTerminate={handleTouchEnd} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd}>
          <View style={styles.columnLabels}>
            <View style={{width:GUTTER}}><Copy style={styles.hourCaption}>Time</Copy></View>
            <View style={styles.clip}>
              <Animated.View style={{width:timelineWidth,flexDirection:'row',transform:[{translateX:Animated.multiply(offset,-1)}]}}>
                {dates.map((date,index)=><Pressable key={date} testID={`calendar-day-${date}`} accessibilityRole="button" accessibilityLabel={`${DAYS[index]}, ${localDate(date).getDate()}/${localDate(date).getMonth()+1}/${localDate(date).getFullYear()}${date===today?', today':''}`} aria-pressed={date===selected} accessibilityState={{selected:date===selected}} onPress={()=>selectDate(date)} style={[styles.columnLabel,{width:columnWidth},date===selected && styles.selectedColumnLabel]}>{columnWidth<80?<><Copy weight="semibold" numberOfLines={1} style={styles.compactDayName}>{DAYS[index]}</Copy><Copy weight="bold" style={styles.compactDayNumber}>{localDate(date).getDate()}</Copy></>:<Copy weight="semibold" numberOfLines={1} style={styles.columnLabelText}>{DAYS[index]} · {localDate(date).getDate()}/{localDate(date).getMonth()+1}{date===today?' · Today':''}</Copy>}</Pressable>)}
              </Animated.View>
            </View>
          </View>
          <ScrollView ref={vertical} testID="calendar-timeline" style={styles.verticalScroll} nestedScrollEnabled scrollEnabled={!pinching} onLayout={()=>{if(!initialized.current){initialized.current=true;requestAnimationFrame(()=>vertical.current?.scrollTo({y:8*60*PIXELS_PER_MINUTE,animated:false}));}}}>
            <View style={styles.timelineRow}>
              <View style={{width:GUTTER,height:dayHeight+20}}>
                {HOURS.map(hour=><Copy key={hour} style={[styles.hour,{top:hour*60*PIXELS_PER_MINUTE}]}>{String(hour).padStart(2,'0')}:00</Copy>)}
              </View>
              <ScrollView ref={horizontal} horizontal nestedScrollEnabled directionalLockEnabled scrollEnabled={!pinching} style={styles.horizontalScroll} contentContainerStyle={{width:timelineWidth,height:dayHeight+20}} scrollEventThrottle={16} onScroll={event=>{const x=event.nativeEvent.contentOffset.x;scrollX.current=x;offset.setValue(x);}}>
                {dates.map((date,index)=><View key={date} style={[styles.dayColumn,{width:columnWidth,height:dayHeight},date===selected && styles.selectedColumn]}>
                  {HOURS.slice(0,24).map(hour=><Pressable key={hour} testID={`calendar-slot-${date}-${hour}`} accessibilityRole="button" accessibilityLabel={`Add task on ${date} at ${formatTime(hour*60)}`} onPress={()=>{setSelected(date);setSlot({date,time:formatTime(hour*60)});}} style={({pressed})=>[styles.slot,{top:hour*60*PIXELS_PER_MINUTE,height:60*PIXELS_PER_MINUTE},pressed && {backgroundColor:COLORS.roseSoft}]}/>)}
                  {positioned[index].map(({event,column,columns,top,height})=>{
                    const palette=TASK_COLORS[event.color??'navy'];
                    const textColor=palette.text;
                    const eventWidth=(columnWidth-8)/columns;
                    return <Pressable key={event.id} testID={`calendar-event-${event.id}`} accessibilityRole="button" accessibilityLabel={`${event.title}, ${event.date}, ${formatTime(event.start)} to ${formatTime(event.end)}${event.untimed?', no time set':event.endEstimated?' (estimated end)':''}${event.done ? ', complete' : ', incomplete'}`} onPress={()=>{setConfirmDelete(false);setDetail(event);}} style={[styles.event,{top,height,left:4+column*eventWidth,width:eventWidth-3,backgroundColor:palette.background,borderColor:palette.border,opacity:event.done?0.72:1}]}>
                      <Copy weight="semibold" numberOfLines={columnWidth<80?1:height>=65?2:1} style={[styles.eventName,columnWidth<80 && styles.compactEventName,{color:textColor},event.done && {textDecorationLine:'line-through'}]}>{event.title}</Copy>
                      {columnWidth>=80 && height>=65 && <Copy numberOfLines={1} style={[styles.eventTime,{color:palette.muted}]}>{formatTime(event.start)}–{event.untimed?'end of day':formatTime(event.end)}</Copy>}
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
            <View style={styles.detailHeader}><Copy weight="bold" style={styles.detailHeading}>{confirmDelete?'Delete task':'Task details'}</Copy><Pressable accessibilityRole="button" accessibilityLabel="Close details" onPress={closeDetail} style={styles.close}><Feather name="x" size={22} color={COLORS.card}/></Pressable></View>
            {confirmDelete ? <>
              <Copy accessibilityRole="header" weight="bold" style={styles.detailTitle}>Delete {detail?.title}?</Copy>
              <Copy style={styles.deleteDescription}>{detail?.recurrence?`This deletes the entire ${detail.recurrence} series from To do and Calendar.`:'This removes the task from To do and Calendar.'}</Copy>
              <View style={styles.deleteActions}>
                <Pressable accessibilityRole="button" onPress={()=>setConfirmDelete(false)} style={styles.deleteCancel}><Copy weight="semibold">Cancel</Copy></Pressable>
                <Pressable accessibilityRole="button" onPress={deleteSelectedTask} style={styles.deleteConfirm}><Copy weight="bold" style={styles.deleteConfirmText}>Delete permanently</Copy></Pressable>
              </View>
            </> : <>
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
              <View style={styles.detailColorGrid}>
                <TaskColorPicker selected={detail.color??'navy'} surface="light" onSelect={color=>{if(detail.taskId)onChangeTaskColor(detail.taskId,color);setDetail(current=>current?{...current,color}:current);}}/>
              </View>
              {detail.taskId&&<Pressable accessibilityRole="button" accessibilityLabel="Delete task" onPress={()=>setConfirmDelete(true)} style={styles.deleteButton}><Feather name="trash-2" size={17} color={COLORS.errorInk}/><Copy weight="semibold" style={styles.deleteButtonText}>Delete task</Copy></Pressable>}
            </>}
            <Pressable accessibilityRole="button" onPress={closeDetail} style={styles.doneButton}><Copy weight="bold">Done</Copy></Pressable>
            </>}
          </Animated.ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  </SystemFontContext.Provider>;
}

const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background},bottomBar:{backgroundColor:COLORS.card},content:{flex:1,minHeight:0},desktopContent:{paddingHorizontal:32,paddingBottom:18},
  header:{paddingHorizontal:18,paddingTop:16,paddingBottom:10,gap:12},heading:{gap:5},title:{fontSize:28},subtitle:{fontSize:12,color:COLORS.paperText},toolbar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8},month:{fontSize:15},controls:{flexDirection:'row',alignItems:'center',gap:4},arrow:{height:44,width:40,alignItems:'center',justifyContent:'center',borderRadius:13,backgroundColor:COLORS.white},todayButton:{height:44,paddingHorizontal:12,justifyContent:'center',borderRadius:13,backgroundColor:COLORS.roseSoft},
  scrollHint:{fontSize:10,color:COLORS.paperText,paddingHorizontal:18,paddingBottom:10},zoomToolbar:{minHeight:48,paddingHorizontal:18,paddingBottom:6,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},fitButton:{minHeight:38,paddingHorizontal:12,borderRadius:12,backgroundColor:COLORS.white,alignItems:'center',justifyContent:'center'},fitButtonActive:{backgroundColor:COLORS.roseSoft},fitText:{fontSize:12},zoomControls:{flexDirection:'row',alignItems:'center',gap:5},zoomButton:{width:44,height:44,borderRadius:12,backgroundColor:COLORS.roseSoft,alignItems:'center',justifyContent:'center'},zoomDisabled:{opacity:0.4},zoomLevel:{width:48,textAlign:'center',fontSize:12},
  calendar:{flex:1,minHeight:0,borderTopWidth:1,borderColor:COLORS.paperBorder,backgroundColor:COLORS.white},columnLabels:{height:42,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderColor:COLORS.paperBorder},hourCaption:{fontSize:10,color:COLORS.paperText,textAlign:'center'},clip:{flex:1,overflow:'hidden'},columnLabel:{height:42,alignItems:'center',justifyContent:'center',borderLeftWidth:1,borderColor:COLORS.paperBorder},selectedColumnLabel:{backgroundColor:COLORS.roseSoft},columnLabelText:{fontSize:12},compactDayName:{fontSize:10,lineHeight:13},compactDayNumber:{fontSize:14,lineHeight:17},verticalScroll:{flex:1},timelineRow:{flexDirection:'row'},hour:{position:'absolute',right:6,fontSize:10,color:COLORS.paperText},horizontalScroll:{flex:1},dayColumn:{borderLeftWidth:1,borderColor:COLORS.paperBorder},selectedColumn:{backgroundColor:COLORS.background},slot:{borderTopWidth:1,borderColor:COLORS.paperBorder,position:'absolute',left:0,right:0,},event:{position:'absolute',borderWidth:1,borderRadius:9,paddingHorizontal:6,paddingVertical:5,overflow:'hidden',justifyContent:'flex-start'},eventName:{fontSize:12,lineHeight:17},compactEventName:{fontSize:10,lineHeight:13},eventTime:{fontSize:10,marginTop:4},
  modalOverlay:{flex:1,justifyContent:'center',alignItems:'center',padding:22},detailScrim:{backgroundColor:COLORS.overlay},detailScroll:{width:'100%',maxWidth:440,maxHeight:'100%',flexGrow:0,flexShrink:1,borderRadius:24,backgroundColor:COLORS.background},detail:{padding:22},detailHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},detailHeading:{fontSize:13,color:COLORS.paperText},close:{width:44,height:44,justifyContent:'center',alignItems:'center'},detailTitle:{fontSize:24,marginTop:12},detailDate:{color:COLORS.paperText,marginTop:10},detailTimes:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:COLORS.roseSoft,padding:18,borderRadius:16,marginVertical:24},detailCaption:{fontSize:12,color:COLORS.paperText},detailTime:{fontSize:23,marginTop:5},detailColorGrid:{marginBottom:20,marginTop:12},deleteButton:{height:44,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,borderRadius:12,backgroundColor:COLORS.roseSoft,marginBottom:10},deleteButtonText:{color:COLORS.errorInk},deleteDescription:{color:COLORS.paperText,lineHeight:20,marginVertical:16},deleteActions:{flexDirection:'row',gap:8},deleteCancel:{flex:1,height:48,alignItems:'center',justifyContent:'center',borderRadius:12,backgroundColor:COLORS.white},deleteConfirm:{flex:1.5,height:48,alignItems:'center',justifyContent:'center',borderRadius:12,backgroundColor:COLORS.errorInk},deleteConfirmText:{color:COLORS.white},doneButton:{height:48,borderRadius:24,backgroundColor:COLORS.accent,alignItems:'center',justifyContent:'center'},
});
