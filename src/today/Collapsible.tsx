import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

/** Retains child state while smoothly changing the section's measured height. */
export function Collapsible({collapsed,reducedMotion,children,onExpanded}:{collapsed:boolean;reducedMotion:boolean;children:ReactNode;onExpanded?:()=>void}) {
  const height=useRef(new Animated.Value(0)).current;
  const opacity=useRef(new Animated.Value(1)).current;
  const [contentHeight,setContentHeight]=useState<number|null>(null);
  const [hidden,setHidden]=useState(collapsed);
  const generation=useRef(0);
  const expandedCallback=useRef(onExpanded);
  expandedCallback.current=onExpanded;

  useLayoutEffect(()=>{
    const current=++generation.current;
    height.stopAnimation();
    opacity.stopAnimation();
    if(!collapsed) setHidden(false);
    if(contentHeight===null) return;
    const animation=Animated.parallel([
      Animated.timing(height,{toValue:collapsed?0:contentHeight,duration:reducedMotion?0:200,easing:Easing.out(Easing.cubic),useNativeDriver:false}),
      Animated.timing(opacity,{toValue:collapsed?0:1,duration:reducedMotion?0:140,useNativeDriver:false}),
    ]);
    animation.start(({finished})=>{
      if(finished && current===generation.current) {
        setHidden(collapsed);
        if(!collapsed) expandedCallback.current?.();
      }
    });
    return ()=>{++generation.current;animation.stop();};
  },[collapsed,contentHeight,height,opacity,reducedMotion]);

  return <Animated.View
    style={[styles.clip,contentHeight!==null && {height,opacity}]}
    pointerEvents={collapsed?'none':'auto'}
    accessibilityElementsHidden={collapsed}
    importantForAccessibility={collapsed?'no-hide-descendants':'auto'}
    aria-hidden={collapsed}
  >
    <View style={hidden?styles.hidden:undefined} onLayout={event=>{
      const measured=event.nativeEvent.layout.height;
      if(measured<=0) return;
      if(contentHeight===null) height.setValue(collapsed?0:measured);
      setContentHeight(previous=>previous===measured?previous:measured);
    }}>{children}</View>
  </Animated.View>;
}
const styles=StyleSheet.create({clip:{overflow:'hidden'},hidden:{display:'none'}});
