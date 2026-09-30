import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { COLORS, TASK_COLORS } from '../theme';
import type { Task } from './model';
import { Copy } from './ui';

export function TaskItem({task,onToggle,reducedMotion}:{task:Task;onToggle:()=>void;reducedMotion:boolean}) {
  const completion=useRef(new Animated.Value(task.done?1:0)).current;
  useEffect(()=>{
    const animation=Animated.timing(completion,{toValue:task.done?1:0,duration:reducedMotion?0:190,easing:Easing.out(Easing.cubic),useNativeDriver:true});
    animation.start();
    return ()=>animation.stop();
  },[task.done,reducedMotion,completion]);
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={task.title} aria-checked={task.done} onPress={onToggle} style={({pressed})=>[styles.task,pressed && styles.pressed]}>
    <View style={[styles.icon,task.color&&{backgroundColor:TASK_COLORS[task.color].background},task.done && styles.doneIcon]}><Feather name={task.icon} size={20} color={task.done?COLORS.paperText:task.color?TASK_COLORS[task.color].text:COLORS.card}/></View>
    <Animated.View style={[styles.body,{opacity:completion.interpolate({inputRange:[0,1],outputRange:[1,0.7]})}]}>
      <Copy weight="medium" style={[styles.title,task.done && styles.doneTitle]}>{task.title}</Copy>
      {(task.time||task.recurrence)&&<Copy style={styles.time}>{[task.time,task.recurrence==='weekly'?'Weekly':task.recurrence==='monthly'?'Monthly':undefined].filter(Boolean).join(' · ')}</Copy>}
    </Animated.View>
    <View style={[styles.checkbox,task.done && styles.checked]}><Animated.View style={{opacity:completion}}><Feather name="check" size={17} color={COLORS.card}/></Animated.View></View>
  </Pressable>;
}

const styles=StyleSheet.create({
  task:{flexDirection:'row',alignItems:'center',gap:10,padding:14,minHeight:76,borderRadius:18,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.paperBorder},
  icon:{height:40,width:40,borderRadius:12,backgroundColor:COLORS.roseSoft,alignItems:'center',justifyContent:'center'},
  doneIcon:{backgroundColor:COLORS.background},
  body:{flex:1,minWidth:0},title:{fontSize:13,lineHeight:21},doneTitle:{textDecorationLine:'line-through',color:COLORS.paperText},
  time:{color:COLORS.paperText,fontSize:10,marginTop:5},
  checkbox:{width:26,height:26,borderWidth:1.5,borderColor:COLORS.placeholder,borderRadius:9,alignItems:'center',justifyContent:'center'},
  checked:{backgroundColor:COLORS.accent,borderColor:COLORS.accent},pressed:{opacity:0.75},
});
