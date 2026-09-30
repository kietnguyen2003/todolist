export type Habit = { id:string; name:string; target:number; unit:string; startDate:string; icon:'droplet'|'book-open'|'activity' };
export type Task = { id:string; date:string; title:string; time?:string; endTime?:string; done:boolean; icon:'book-open'|'shopping-bag'|'mail'|'check-square' };
export type TodayState = {tasks:Task[]; habits:Habit[]; counts:Record<string,Record<string,number>>};
export type TodayAction = {type:'addTask';task:Task}|{type:'toggleTask';id:string;date:string}|{type:'setCount';id:string;date:string;count:number}|{type:'addHabit';habit:Habit};

export function dateKey(date:Date):string {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function localDate(key:string):Date {
  const [year,month,day]=key.split('-').map(Number);
  return new Date(year,month-1,day,12);
}
export function addDays(date:string,days:number):string {
  const result=localDate(date);
  return dateKey(new Date(result.getFullYear(),result.getMonth(),result.getDate()+days,12));
}
export function weekDates(date:string):string[] {
  const monday=addDays(date,-((localDate(date).getDay()+6)%7));
  return Array.from({length:7},(_,i)=>addDays(monday,i));
}
export function validateHabitDraft(name:string,target:string,unit:string):{name?:string;target?:string;unit?:string} {
  return {
    ...(!name.trim() || name.trim().length>60 ? {name:'Nhập tên thói quen từ 1 đến 60 ký tự.'}:{}),
    ...(!/^\d+$/.test(target.trim()) || Number(target)<1 || Number(target)>100000 ? {target:'Mục tiêu phải là số nguyên từ 1 đến 100.000.'}:{}),
    ...(!unit.trim() || unit.trim().length>20 ? {unit:'Nhập đơn vị từ 1 đến 20 ký tự, ví dụ: cốc, phút, trang.'}:{}),
  };
}
export function validateTaskDraft(title:string,date:string,time?:string,endTime?:string):{title?:string;date?:string;time?:string;endTime?:string} {
  const timed=Boolean(time || endTime);
  const startValid=typeof time==='string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
  const endValid=typeof endTime==='string' && (/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || endTime==='24:00');
  return {
    ...(!title.trim() || title.trim().length>120 ? {title:'Nhập tên công việc từ 1 đến 120 ký tự.'}:{}),
    ...(!/^\d{4}-\d{2}-\d{2}$/.test(date) || dateKey(localDate(date))!==date ? {date:'Ngày không hợp lệ.'}:{}),
    ...(timed && !startValid ? {time:'Nhập giờ bắt đầu theo HH:mm, từ 00:00 đến 23:59.'}:{}),
    ...(timed && (!endValid || (startValid && endTime!<=time!)) ? {endTime:'Giờ kết thúc phải sau giờ bắt đầu, tối đa 24:00.'}:{}),
  };
}
export function todayReducer(state:TodayState,action:TodayAction):TodayState {
  switch(action.type) {
    case 'addTask': {
      const {task}=action;
      if(state.tasks.some(item=>item.id===task.id) || Object.keys(validateTaskDraft(task.title,task.date,task.time,task.endTime)).length) return state;
      return {...state,tasks:[...state.tasks,{...task,title:task.title.trim(),done:false}]};
    }
    case 'toggleTask': return {...state,tasks:state.tasks.map(task=>task.id===action.id && task.date===action.date ? {...task,done:!task.done}:task)};
    case 'setCount': {
      const habit=state.habits.find(item=>item.id===action.id);
      if(!habit || action.date<habit.startDate || !Number.isInteger(action.count) || action.count<0 || action.count>100000) return state;
      return {...state,counts:{...state.counts,[action.date]:{...state.counts[action.date],[action.id]:action.count}}};
    }
    case 'addHabit': {
      const {habit}=action;
      if(state.habits.some(item=>item.id===habit.id) || Object.keys(validateHabitDraft(habit.name,String(habit.target),habit.unit)).length) return state;
      return {...state,habits:[...state.habits,{...habit,name:habit.name.trim(),unit:habit.unit.trim()}]};
    }
  }
}
export function habitCount(state:TodayState,id:string,date:string):number {return state.counts[date]?.[id] ?? 0;}
export function tasksForDate(state:TodayState,date:string):Task[] {return state.tasks.filter(task=>task.date===date).sort((a,b)=>(a.time ?? '99:99').localeCompare(b.time ?? '99:99'));}

// The unfinished selected day can still extend the chain completed yesterday.
// Derive from daily quantities so edits/undo never leave a stale cached streak.
export function habitStreak(state:TodayState,id:string,date:string):number {
  const habit=state.habits.find(item=>item.id===id);
  if(!habit || date<habit.startDate) return 0;
  let cursor=habitCount(state,id,date)>=habit.target?date:addDays(date,-1);
  let days=0;
  while(cursor>=habit.startDate && habitCount(state,id,cursor)>=habit.target) {
    days+=1;
    cursor=addDays(cursor,-1);
  }
  return days;
}
