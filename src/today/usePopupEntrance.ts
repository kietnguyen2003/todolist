import { useLayoutEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/** A short shared entrance for modal surfaces and their scrim. */
export function usePopupEntrance(visible:boolean,reducedMotion:boolean) {
  const progress=useRef(new Animated.Value(0)).current;

  useLayoutEffect(()=>{
    progress.stopAnimation();
    if(!visible) {
      progress.setValue(0);
      return;
    }
    if(reducedMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation=Animated.timing(progress,{
      toValue:1,
      duration:220,
      easing:Easing.out(Easing.cubic),
      useNativeDriver:true,
    });
    animation.start();
    return ()=>animation.stop();
  },[visible,reducedMotion,progress]);

  return {
    scrimStyle:{opacity:progress},
    cardStyle:{
      opacity:progress,
      transform:[
        {translateY:progress.interpolate({inputRange:[0,1],outputRange:[12,0]})},
        {scale:progress.interpolate({inputRange:[0,1],outputRange:[0.98,1]})},
      ],
    },
  };
}
