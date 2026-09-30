import { useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../theme';
import { Copy, SystemFontContext } from '../today/ui';
import { WheelPicker } from '../today/WheelPicker';

const HOURS = Array.from({length:24},(_,n)=>String(n).padStart(2,'0'));
const END_HOURS = [...HOURS,'24'];
const MINUTES = Array.from({length:60},(_,n)=>String(n).padStart(2,'0'));
const MIDNIGHT_MINUTES = ['00'];

type Props={value:string;end?:boolean;error?:string;onChange:(value:string)=>void};
export function TimeWheel({value,end=false,error,onChange}:Props) {
  const system=useContext(SystemFontContext);
  const [hour,minute]=(value || '00:00').split(':').map(Number);
  function change(nextHour:number,nextMinute:number) {
    onChange(`${String(nextHour).padStart(2,'0')}:${String(nextHour===24?0:nextMinute).padStart(2,'0')}`);
  }
  return <View style={styles.group}>
    <Copy weight="semibold" style={styles.label}>{end?'End':'Start'}</Copy>
    <View style={styles.columns}>
      <View style={styles.column}>
        <Copy style={styles.caption}>Hour</Copy>
        <WheelPicker label={`${end?'End':'Start'} hour`} hint={error} options={end?END_HOURS:HOURS} selectedIndex={hour} onChange={index=>change(index,minute)} useSystemFont={system}/>
      </View>
      <View style={styles.column}>
        <Copy style={styles.caption}>Minute</Copy>
        <WheelPicker label={`${end?'End':'Start'} minute`} hint={hour===24?'End of day at 24:00.':error} options={hour===24?MIDNIGHT_MINUTES:MINUTES} selectedIndex={hour===24?0:minute} onChange={index=>change(hour,index)} useSystemFont={system}/>
      </View>
    </View>
  </View>;
}
const styles=StyleSheet.create({
  group:{flex:1,minWidth:0,gap:8},label:{color:COLORS.white,fontSize:13},
  columns:{flexDirection:'row',gap:6},column:{flex:1,minWidth:0,gap:6},caption:{color:COLORS.muted,fontSize:11,textAlign:'center'},
});
