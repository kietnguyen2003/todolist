import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { formatHabitProgress } from './quantity';
import { COLORS } from '../theme';

export function HabitProgress({name,count,target,unit,reducedMotion}:{name:string;count:number;target:number;unit:string;reducedMotion:boolean}) {
  const progress=useRef(new Animated.Value(Math.min(count/target,1))).current;
  useEffect(()=>{
    const animation=Animated.timing(progress,{toValue:Math.min(count/target,1),duration:reducedMotion?0:230,easing:Easing.out(Easing.cubic),useNativeDriver:false});
    animation.start();
    return ()=>animation.stop();
  },[count,target,reducedMotion,progress]);
  return <View accessibilityRole="progressbar" accessibilityLabel={`Progress ${name}`} aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(count,target)} aria-valuetext={formatHabitProgress(count,target,unit)} style={styles.track}>
    <Animated.View style={[styles.fill,{width:progress.interpolate({inputRange:[0,1],outputRange:['0%','100%']})}]}/>
  </View>;
}
const styles=StyleSheet.create({track:{height:5,backgroundColor:COLORS.paperBorder,borderRadius:9,overflow:'hidden'},fill:{height:'100%',backgroundColor:COLORS.accent,borderRadius:9}});
