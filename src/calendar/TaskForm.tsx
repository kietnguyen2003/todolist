import { useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { TimeWheel } from './TimeWheel';
import { COLORS, FONTS, type TaskColor } from '../theme';
import { TaskColorPicker } from './TaskColorPicker';
import { validateTaskDraft } from '../today/model';
import { Copy, SystemFontContext } from '../today/ui';
import { useReducedMotion } from '../today/useReducedMotion';
import { usePopupEntrance } from '../today/usePopupEntrance';

type Draft={title:string;date:string;time?:string;endTime?:string;calendarStartTime?:string;recurrence?:'weekly'|'monthly';color?:TaskColor};
type Props={slot:{date:string;time?:string;calendarStartTime?:string}|null;onClose:()=>void;onCreate:(draft:Draft)=>void};
function clock(minutes:number) {return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;}
function addMinutes(time:string,amount:number) {
  const [hour,minute]=time.split(':').map(Number);
  return clock(Math.min(1440,hour*60+minute+amount));
}

export function TaskForm({slot,onClose,onCreate}:Props) {
  const systemFont=useContext(SystemFontContext);
  const reducedMotion=useReducedMotion();
  const entrance=usePopupEntrance(slot!==null,reducedMotion);
  const [values,setValues]=useState({title:'',date:'',time:'09:00',endTime:'09:30',timed:false,recurrence:'none' as 'none'|'weekly'|'monthly',color:'navy' as TaskColor});
  const [errors,setErrors]=useState<ReturnType<typeof validateTaskDraft>>({});
  const [focused,setFocused]=useState<'title'|'date'|null>(null);
  const reveal=useRef(new Animated.Value(0)).current;
  const submitted=useRef(false);
  const defaultEnd=useRef(true);
  useEffect(()=>{
    if(!slot) return;
    const time=slot.time??'09:00';
    setValues({title:'',date:slot.date,time,endTime:addMinutes(time,30),timed:Boolean(slot.time),recurrence:'none',color:'navy'});
    setErrors({});submitted.current=false;defaultEnd.current=true;reveal.setValue(slot.time?1:0);
  },[slot,reveal]);
  useEffect(()=>{
    const animation=Animated.timing(reveal,{toValue:values.timed?1:0,duration:reducedMotion?0:180,easing:Easing.out(Easing.cubic),useNativeDriver:true});
    animation.start();return ()=>animation.stop();
  },[values.timed,reducedMotion,reveal]);
  function close(){Keyboard.dismiss();onClose();}
  function update(field:'title'|'date'|'time'|'endTime',value:string){
    if(field==='endTime')defaultEnd.current=false;
    setValues(previous=>({...previous,[field]:value}));
    setErrors(previous=>({...previous,[field]:undefined}));
  }
  function addDuration(minutes:number){
    const fromStart=defaultEnd.current;
    defaultEnd.current=false;
    setValues(previous=>({...previous,endTime:addMinutes(fromStart?previous.time:previous.endTime,minutes)}));
    setErrors(previous=>({...previous,endTime:undefined}));
  }
  function submit(){
    if(!slot||submitted.current)return;
    const time=values.timed?values.time:undefined,endTime=values.timed?values.endTime:undefined;
    const next=validateTaskDraft(values.title,values.date,time,endTime);
    setErrors(next);
    if(Object.keys(next).length)return;
    submitted.current=true;
    const now=new Date();
    const calendarStartTime=values.timed?undefined:(slot.calendarStartTime??slot.time??clock(now.getHours()*60+now.getMinutes()));
    onCreate({title:values.title.trim(),date:values.date,time,endTime,calendarStartTime,recurrence:values.recurrence==='none'?undefined:values.recurrence,color:values.color});
    close();
  }
  return <Modal visible={slot!==null} transparent animationType="none" onRequestClose={close}>
    <Animated.View pointerEvents="none" style={[styles.backdrop,entrance.scrimStyle]}/>
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==='ios'?'padding':'height'}>
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <Animated.View testID="task-popup-card" style={[styles.card,entrance.cardStyle]} accessibilityViewIsModal>
            <View style={styles.heading}>
              <Copy accessibilityRole="header" weight="bold" style={styles.title}>Add task</Copy>
              <Pressable accessibilityRole="button" accessibilityLabel="Close task form" onPress={close} style={styles.close}><Feather name="x" size={20} color={COLORS.muted}/></Pressable>
            </View>
            <View style={styles.detailsRow}>
              <View style={[styles.field,styles.compactField]}>
                <Copy weight="semibold" style={styles.label}>Task name</Copy>
                <TextInput accessibilityLabel="Task name" accessibilityHint={errors.title} value={values.title} onChangeText={value=>update('title',value)} placeholder="What to do?" placeholderTextColor={COLORS.placeholder} selectionColor={COLORS.accent} autoCapitalize="sentences" returnKeyType="done" onSubmitEditing={()=>Keyboard.dismiss()} onFocus={()=>setFocused('title')} onBlur={()=>setFocused(null)} style={[styles.nameInput,{fontFamily:systemFont?undefined:FONTS.medium},focused==='title'&&styles.focused,!!errors.title&&styles.invalid]}/>
                {!!errors.title&&<Copy role="alert" style={styles.error}>{errors.title}</Copy>}
              </View>
              <View style={[styles.field,styles.compactField]}>
                <Copy weight="semibold" style={styles.label}>Date</Copy>
                <TextInput accessibilityLabel="Date" accessibilityHint="Use YYYY-MM-DD, for example 2026-09-30" value={values.date} onChangeText={value=>update('date',value)} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.placeholder} keyboardType="numbers-and-punctuation" autoCapitalize="none" autoCorrect={false} onFocus={()=>setFocused('date')} onBlur={()=>setFocused(null)} style={[styles.input,{fontFamily:systemFont?undefined:FONTS.regular},focused==='date'&&styles.focused,!!errors.date&&styles.invalid]}/>
                {!!errors.date&&<Copy role="alert" style={styles.error}>{errors.date}</Copy>}
              </View>
            </View>
            <View accessibilityRole="radiogroup" style={styles.modeRow}>
              {([false,true] as const).map(timed=><Pressable key={String(timed)} accessibilityRole="radio" aria-checked={values.timed===timed} onPress={()=>{Keyboard.dismiss();setValues(previous=>({...previous,timed}));setErrors(previous=>({...previous,time:undefined,endTime:undefined}));}} style={[styles.mode,values.timed===timed&&styles.modeSelected]}><Copy weight="semibold" style={[styles.modeText,values.timed===timed&&styles.modeTextSelected]}>{timed?'Set time':'No time'}</Copy></Pressable>)}
            </View>
            {values.timed&&<Animated.View style={{opacity:reveal,transform:[{translateY:reveal.interpolate({inputRange:[0,1],outputRange:[-6,0]})}]}}>
              <View style={styles.timeRow}>
                <TimeWheel value={values.time} error={errors.time} onChange={value=>update('time',value)}/>
                <TimeWheel value={values.endTime} end error={errors.endTime} onChange={value=>update('endTime',value)}/>
              </View>
              {!!errors.time&&<Copy role="alert" style={styles.error}>{errors.time}</Copy>}
              {!!errors.endTime&&<Copy role="alert" style={styles.error}>{errors.endTime}</Copy>}
              <View style={styles.shortcuts}>
                {[30,60,90].map(minutes=><Pressable key={minutes} accessibilityRole="button" accessibilityLabel={`Duration ${minutes} minutes`} onPress={()=>addDuration(minutes)} style={({pressed})=>[styles.shortcut,pressed&&styles.pressed]}><Copy style={styles.shortcutText}>+{minutes<60?`${minutes}m`:minutes===60?'1h':'1h30'}</Copy></Pressable>)}
              </View>
            </Animated.View>}
            <View style={styles.field}>
              <Copy weight="semibold" style={styles.label}>Repeat</Copy>
              <View accessibilityRole="radiogroup" style={styles.choiceRow}>
                {(['none','weekly','monthly'] as const).map(option=><Pressable key={option} accessibilityRole="radio" aria-checked={values.recurrence===option} onPress={()=>setValues(previous=>({...previous,recurrence:option}))} style={[styles.choice,values.recurrence===option&&styles.choiceSelected]}><Copy weight="semibold" style={[styles.choiceText,values.recurrence===option&&styles.choiceTextSelected]}>{option==='none'?'Never':option==='weekly'?'Weekly':'Monthly'}</Copy></Pressable>)}
              </View>
            </View>
            <View style={styles.field}>
              <Copy weight="semibold" style={styles.label}>Color</Copy>
              <TaskColorPicker selected={values.color} surface="dark" onSelect={color=>setValues(previous=>({...previous,color}))}/>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Create task" onPress={submit} style={({pressed})=>[styles.submit,pressed&&styles.submitPressed]}><Feather name="plus" size={18} color={COLORS.card}/><Copy weight="bold">Create task</Copy></Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
const styles=StyleSheet.create({
  flex:{flex:1},backdrop:{position:'absolute',top:0,right:0,bottom:0,left:0,backgroundColor:COLORS.overlay},page:{flexGrow:1,alignItems:'center',justifyContent:'center',paddingHorizontal:12,paddingVertical:8},card:{width:'100%',maxWidth:400,borderRadius:20,backgroundColor:COLORS.card,padding:16,gap:10},
  heading:{flexDirection:'row',alignItems:'center',gap:8},title:{flex:1,color:COLORS.white,fontSize:20},close:{width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:13,backgroundColor:COLORS.input},
  field:{gap:4},detailsRow:{flexDirection:'row',gap:8},compactField:{flex:1,minWidth:0},label:{color:COLORS.white,fontSize:12},input:{height:42,borderRadius:12,borderWidth:1,borderColor:COLORS.inputBorder,backgroundColor:COLORS.input,paddingHorizontal:10,color:COLORS.white,fontSize:14},nameInput:{height:42,borderRadius:12,borderWidth:1,borderColor:COLORS.inputBorder,backgroundColor:COLORS.input,paddingHorizontal:10,color:COLORS.white,fontSize:14},focused:{borderColor:COLORS.accent},invalid:{borderColor:COLORS.error},error:{color:COLORS.error,fontSize:12},
  modeRow:{flexDirection:'row',gap:4,padding:3,backgroundColor:COLORS.input,borderRadius:13},mode:{flex:1,minHeight:44,borderRadius:10,alignItems:'center',justifyContent:'center'},modeSelected:{backgroundColor:COLORS.accent},modeText:{fontSize:12,color:COLORS.muted},modeTextSelected:{color:COLORS.card},
  choiceRow:{flexDirection:'row',gap:6},choice:{flex:1,minHeight:44,borderRadius:12,backgroundColor:COLORS.input,alignItems:'center',justifyContent:'center',paddingHorizontal:4},choiceSelected:{backgroundColor:COLORS.accent},choiceText:{fontSize:12,color:COLORS.muted},choiceTextSelected:{color:COLORS.card},
  timeRow:{flexDirection:'row',gap:8,marginTop:2},shortcuts:{flexDirection:'row',gap:8,marginTop:8},shortcut:{minHeight:40,minWidth:64,paddingHorizontal:12,alignItems:'center',justifyContent:'center',borderRadius:11,backgroundColor:COLORS.input},shortcutText:{fontSize:12,color:COLORS.muted},pressed:{opacity:0.65},
  submit:{minHeight:48,marginTop:2,borderRadius:999,backgroundColor:COLORS.accent,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8},submitPressed:{backgroundColor:COLORS.accentPressed},
});
