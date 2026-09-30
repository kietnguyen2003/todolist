import { addDays, type TodayState, type Task } from '../../src/today/model.ts';

// Test-only examples; production always starts empty.
export function createSampleData(today:string):TodayState {
  const tasks:Task[] = [
    {id:'shopping',date:today,title:'Mua thực phẩm cho tuần mới',time:'09:00',done:false,icon:'shopping-bag'},
    {id:'planning',date:today,title:'Lên kế hoạch cho tuần mới',time:'10:30',done:true,icon:'check-square'},
    {id:'reading',date:today,title:'Đọc một chương sách',time:'15:00',done:false,icon:'book-open'},
    {id:'email',date:today,title:'Trả lời những email còn lại',time:'16:30',done:false,icon:'mail'},
    {id:'yesterday',date:addDays(today,-1),title:'Sắp xếp lại góc làm việc',time:'17:00',done:true,icon:'check-square'},
    {id:'tomorrow',date:addDays(today,1),title:'Chuẩn bị công việc ngày mới',time:'08:30',done:false,icon:'check-square'},
  ];
  return {tasks,habits:[
    {id:'water',name:'Uống nước',target:8,unit:'cốc',startDate:addDays(today,-30),icon:'droplet'},
    {id:'read',name:'Đọc sách',target:20,unit:'trang',startDate:addDays(today,-30),icon:'book-open'},
    {id:'move',name:'Vận động nhẹ',target:30,unit:'phút',startDate:addDays(today,-30),icon:'activity'},
  ], counts:{[today]:{water:3,read:0,move:30},[addDays(today,-1)]:{water:8,read:12,move:15}}};
}
