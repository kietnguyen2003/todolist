import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { dateKey } from './model';

/** Keep an open screen's notion of today current across midnight and app resume. */
export function useCalendarDay() {
  const [today,setToday]=useState(()=>dateKey(new Date()));
  const [selected,setSelected]=useState(today);
  const todayRef=useRef(today);
  useEffect(()=>{
    let timer:ReturnType<typeof setTimeout>;
    function refresh() {
      const next=dateKey(new Date());
      const previous=todayRef.current;
      if(previous!==next){
        todayRef.current=next;
        setSelected(current=>current===previous?next:current);
        setToday(next);
      }
      const now=new Date();
      timer=setTimeout(refresh, new Date(now.getFullYear(),now.getMonth(),now.getDate()+1).getTime()-now.getTime()+50);
    }
    refresh();
    const subscription=AppState.addEventListener('change',state=>{if(state==='active'){clearTimeout(timer);refresh();}});
    return ()=>{clearTimeout(timer);subscription.remove();};
  },[]);
  return {today,selected,setSelected};
}
