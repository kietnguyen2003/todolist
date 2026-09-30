export type Habit = { id:string; name:string; target:number; unit:string; startDate:string; icon:'droplet'|'book-open'|'activity' };
export type Task = { id:string; date:string; title:string; time?:string; endTime?:string; calendarStartTime?:string; recurrence?:'weekly'|'monthly'; completedDates?:string[]; color?:'navy'|'rose'|'sage'|'sand'; done:boolean; icon:'book-open'|'shopping-bag'|'mail'|'check-square' };
export type TodayState = {tasks:Task[]; habits:Habit[]; counts:Record<string,Record<string,number>>};
export type TodayAction = {type:'addTask';task:Task}|{type:'toggleTask';id:string;date:string}|{type:'setTaskColor';id:string;color:NonNullable<Task['color']>}|{type:'setCount';id:string;date:string;count:number}|{type:'addHabit';habit:Habit}|{type:'updateHabit';id:string;name:string;target:number;unit:string}|{type:'deleteHabit';id:string};

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
export function taskOccursOn(task:Task,date:string):boolean {
  if(date<task.date)return false;
  if(date===task.date)return true;
  if(task.recurrence==='monthly')return Number(date.slice(8))===Number(task.date.slice(8));
  if(task.recurrence==='weekly') {
    const utc=(key:string)=>Date.UTC(Number(key.slice(0,4)),Number(key.slice(5,7))-1,Number(key.slice(8)));
    return (utc(date)-utc(task.date))%604800000===0;
  }
  return false;
}
export function taskForDate(task:Task,date:string):Task {
  return {...task,date,done:date===task.date?task.done:Boolean(task.completedDates?.includes(date))};
}
export function validateHabitDraft(name:string,target:string,unit:string):{name?:string;target?:string;unit?:string} {
  return {
    ...(!name.trim() || name.trim().length>60 ? {name:'Enter a habit name with 1 to 60 characters.'}:{}),
    ...(!/^\d+$/.test(target.trim()) || Number(target)<1 || Number(target)>100000 ? {target:'The target must be a whole number from 1 to 100,000.'}:{}),
    ...(!unit.trim() || unit.trim().length>20 ? {unit:'Enter a unit with 1 to 20 characters.'}:{}),
  };
}
export function validateTaskDraft(title:string,date:string,time?:string,endTime?:string):{title?:string;date?:string;time?:string;endTime?:string} {
  const timed=Boolean(time || endTime);
  const startValid=typeof time==='string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
  const endValid=typeof endTime==='string' && (/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || endTime==='24:00');
  return {
    ...(!title.trim() || title.trim().length>120 ? {title:'Enter a task name with 1 to 120 characters.'}:{}),
    ...(!/^\d{4}-\d{2}-\d{2}$/.test(date) || dateKey(localDate(date))!==date ? {date:'Enter a valid date.'}:{}),
    ...(timed && !startValid ? {time:'Enter a start time from 00:00 to 23:59.'}:{}),
    ...(timed && (!endValid || (startValid && endTime!<=time!)) ? {endTime:'End time must be after start time, up to 24:00.'}:{}),
  };
}
export function todayReducer(state:TodayState,action:TodayAction):TodayState {
  switch(action.type) {
    case 'addTask': {
      const {task}=action;
      if(state.tasks.some(item=>item.id===task.id) || Object.keys(validateTaskDraft(task.title,task.date,task.time,task.endTime)).length
        || (task.recurrence!==undefined && !['weekly','monthly'].includes(task.recurrence))
        || (task.color!==undefined && !['navy','rose','sage','sand'].includes(task.color))
        || (task.calendarStartTime!==undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(task.calendarStartTime))) return state;
      return {...state,tasks:[...state.tasks,{...task,title:task.title.trim(),done:false}]};
    }
    case 'toggleTask': return {...state,tasks:state.tasks.map(task=>{
      if(task.id!==action.id || !taskOccursOn(task,action.date))return task;
      if(action.date===task.date)return {...task,done:!task.done};
      const dates=task.completedDates??[];
      return {...task,completedDates:dates.includes(action.date)?dates.filter(date=>date!==action.date):[...dates,action.date].sort()};
    })};
    case 'setTaskColor': {
      if(!['navy','rose','sage','sand'].includes(action.color) || !state.tasks.some(task=>task.id===action.id))return state;
      return {...state,tasks:state.tasks.map(task=>task.id===action.id?{...task,color:action.color}:task)};
    }
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
    case 'updateHabit': {
      if(!state.habits.some(habit=>habit.id===action.id) || Object.keys(validateHabitDraft(action.name,String(action.target),action.unit)).length) return state;
      return {...state,habits:state.habits.map(habit=>habit.id===action.id?{...habit,name:action.name.trim(),target:action.target,unit:action.unit.trim()}:habit)};
    }
    case 'deleteHabit': {
      if(!state.habits.some(habit=>habit.id===action.id)) return state;
      const counts=Object.fromEntries(Object.entries(state.counts).map(([date,values])=>[date,Object.fromEntries(Object.entries(values).filter(([id])=>id!==action.id))]).filter(([,values])=>Object.keys(values).length));
      return {...state,habits:state.habits.filter(habit=>habit.id!==action.id),counts};
    }
  }
}
export function habitCount(state:TodayState,id:string,date:string):number {return state.counts[date]?.[id] ?? 0;}
export function tasksForDate(state:TodayState,date:string):Task[] {return state.tasks.filter(task=>taskOccursOn(task,date)).map(task=>taskForDate(task,date)).sort((a,b)=>(a.time ?? '99:99').localeCompare(b.time ?? '99:99'));}

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
