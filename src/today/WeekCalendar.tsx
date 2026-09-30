import { forwardRef, memo, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Platform, Pressable, StyleSheet, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { COLORS } from '../theme';
import { addDays, dateKey, localDate, weekDates } from './model';
import { Copy } from './ui';

type Props = { selected:string; onSelect:(date:string)=>void; reducedMotion:boolean };
export type WeekCalendarHandle = { goToToday:()=>void };

export const WeekCalendar = memo(forwardRef<WeekCalendarHandle,Props>(function WeekCalendar({selected,onSelect,reducedMotion},ref) {
  const [width,setWidth]=useState(0);
  const [preview,setPreview]=useState<string|null>(null);
  const offset=useRef(new Animated.Value(0)).current;
  const live=useRef({selected,onSelect,reducedMotion,width});
  live.current={selected,onSelect,reducedMotion,width};
  const generation=useRef(0);
  const position=useRef(0);
  const origin=useRef(0);
  const pending=useRef<string|null>(null);
  // RN Web can synthesize a day click after a drag ends over that same day.
  const dragged=useRef(false);
  const today=dateKey(new Date());

  function cancel(reset:boolean) {
    generation.current+=1;
    pending.current=null;
    offset.stopAnimation();
    if(reset) { offset.setValue(0); position.current=0; setPreview(null); }
    return generation.current;
  }
  function choose(date:string) {
    cancel(true);
    live.current.onSelect(date);
  }
  function swipeDestination(direction:number,from=live.current.selected) {
    const currentWeek=weekDates(from);
    const destinationWeek=weekDates(addDays(currentWeek[0],direction*7));
    const todayDate=dateKey(new Date());
    if(destinationWeek.includes(todayDate)) return todayDate;
    return destinationWeek[direction>0?0:6];
  }
  function settle(direction:number,days=1,weekSwipe=false) {
    const current=live.current;
    const token=cancel(false);
    const destination=direction ? weekSwipe ? swipeDestination(direction) : addDays(current.selected,direction*days) : current.selected;
    pending.current=direction ? destination : null;
    if(current.reducedMotion || !current.width) {
      choose(destination);
      return;
    }
    // Both swipe directions move one week and preview its destination selection.
    const currentWeek=weekDates(current.selected)[0];
    const destinationWeek=weekDates(destination)[0];
    const pageDirection=destinationWeek===currentWeek?0:destinationWeek>currentWeek?1:-1;
    setPreview(destination);
    const target=-pageDirection*current.width;
    const distance=Math.abs(target-position.current)/current.width;
    Animated.timing(offset,{
      toValue:target,duration:Math.round(150+Math.min(distance,1)*110),
      easing:Easing.out(Easing.cubic),useNativeDriver:true,
    }).start(({finished})=>{
      if(!finished || token!==generation.current) return;
      pending.current=null;
      if(direction) live.current.onSelect(destination);
    });
  }
  function moveWeek(direction:number) {
    // A second tap during settling supersedes the old callback and keeps every tap.
    if(pending.current) choose(swipeDestination(direction,pending.current));
    else settle(direction,1,true);
  }
  const handlers=useRef({settle,cancel});
  handlers.current={settle,cancel};
  const pan=useRef(PanResponder.create({
    onMoveShouldSetPanResponder:(_,gesture)=>Math.abs(gesture.dx)>10 && Math.abs(gesture.dx)>Math.abs(gesture.dy)*1.5,
    onPanResponderGrant:()=>{
      dragged.current=true;
      const token=handlers.current.cancel(false);
      origin.current=position.current;
      offset.stopAnimation(value=>{
        if(token===generation.current) origin.current=value;
      });
    },
    onPanResponderMove:(_,gesture)=>{
      const span=live.current.width;
      offset.setValue(Math.max(-span,Math.min(span,origin.current+gesture.dx)));
    },
    onPanResponderRelease:(_,gesture)=>{
      const span=live.current.width;
      const distance=origin.current+gesture.dx;
      const projected=distance+gesture.vx*120;
      const commit=span>0 && (Math.abs(distance)>Math.min(span*.22,48) || (Math.abs(gesture.dx)>12 && Math.abs(projected)>span*.28));
      const direction=projected<0?1:-1;
      handlers.current.settle(commit ? direction : 0,1,commit);
    },
    onPanResponderTerminate:()=>handlers.current.settle(0),
    onPanResponderTerminationRequest:()=>true,
  })).current;

  useImperativeHandle(ref,()=>({goToToday:()=>choose(dateKey(new Date()))}));
  useLayoutEffect(()=>{
    // Rebase alongside the new week before paint, preserving the page that just arrived.
    cancel(true);
  },[selected,width,reducedMotion]);
  useEffect(()=>{
    const listener=offset.addListener(({value})=>{position.current=value;});
    return ()=>{generation.current+=1;offset.stopAnimation();offset.removeListener(listener);};
  },[offset]);

  return <View style={styles.calendar}>
    <View style={styles.header}>
      <Copy weight="semibold">Tháng {localDate(selected).getMonth()+1}, {localDate(selected).getFullYear()}</Copy>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Về hôm nay" onPress={()=>choose(dateKey(new Date()))} style={styles.todayButton}><Copy weight="semibold" style={styles.small}>Hôm nay</Copy></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Tuần trước" onPress={()=>moveWeek(-1)} style={styles.arrow}><Feather name="chevron-left" size={19} color={COLORS.card}/></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Tuần sau" onPress={()=>moveWeek(1)} style={styles.arrow}><Feather name="chevron-right" size={19} color={COLORS.card}/></Pressable>
      </View>
    </View>
    <View testID="week-calendar-viewport" style={styles.viewport} onLayout={event=>{
      const measured=event.nativeEvent.layout.width;
      if(measured!==live.current.width) {cancel(true);setWidth(measured);}
    }} {...pan.panHandlers}>
      <Animated.View style={[styles.track,width>0 && {width:width*3,left:-width}, {transform:[{translateX:offset}]}]}>
        {(width>0?[-1,0,1]:[0]).map(page=><View key={page} style={[styles.days,width>0 && {width}]} pointerEvents={page===0?'auto':'none'} accessibilityElementsHidden={page!==0} importantForAccessibility={page===0?'auto':'no-hide-descendants'} aria-hidden={page!==0}>
          {weekDates(addDays(selected,page*7)).map((date,index)=>{
            const chosen=date===(page===0?selected:preview);
            return <Pressable key={date} accessible={page===0} disabled={page!==0} accessibilityRole="button" accessibilityLabel={page===0?`Chọn ngày ${date}`:undefined} {...(page===0 ? Platform.OS==='web'?{'aria-pressed':date===selected}:{accessibilityState:{selected:date===selected}} : {})} onPressIn={()=>{dragged.current=false;}} onPress={()=>{if(!dragged.current) choose(date);}} style={[styles.day,chosen && styles.selectedDay]}>
              <Copy style={[styles.weekday,chosen && styles.selectedDayText]}>{['T2','T3','T4','T5','T6','T7','CN'][index]}</Copy>
              <Copy weight="bold" style={[styles.dayNumber,chosen && styles.selectedDayText]}>{localDate(date).getDate()}</Copy>
              <View style={[styles.dayDot,{backgroundColor:date===today?COLORS.accent:COLORS.transparent}]}/>
            </Pressable>;
          })}
        </View>)}
      </Animated.View>
    </View>
  </View>;
}));

const styles=StyleSheet.create({
  calendar:{marginTop:8,marginBottom:12},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:4,flexWrap:'wrap'},actions:{flexDirection:'row',alignItems:'center'},todayButton:{paddingHorizontal:10,minHeight:44,justifyContent:'center'},small:{fontSize:11},arrow:{width:44,height:44,alignItems:'center',justifyContent:'center'},
  viewport:{overflow:'hidden'},track:{flexDirection:'row'},days:{flexDirection:'row',gap:5,flexShrink:0},day:{flex:1,minWidth:0,minHeight:52,borderRadius:12,alignItems:'center',justifyContent:'center',gap:1,paddingBottom:4,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.paperBorder},selectedDay:{backgroundColor:COLORS.card,borderColor:COLORS.card},weekday:{fontSize:10,lineHeight:14,color:COLORS.paperText},dayNumber:{fontSize:17,lineHeight:22},selectedDayText:{color:COLORS.white},dayDot:{position:'absolute',bottom:4,height:4,width:4,borderRadius:3},
});
