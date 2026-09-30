import { useContext, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, FONTS } from '../theme';
import type { Habit } from './model';
import { Copy, SystemFontContext } from './ui';
import { DURATION_UNIT, formatHabitProgress } from './quantity';
import { HabitProgress } from './HabitProgress';

export function HabitRow({habit,count,streak,onChange,onEdit,onDelete,reducedMotion=false}:{habit:Habit;count:number;streak:number;onChange:(count:number)=>void;onEdit:()=>void;onDelete:()=>void;reducedMotion?:boolean}) {
  const useSystemFont=useContext(SystemFontContext);
  const [editing,setEditing]=useState(false);
  const [menuOpen,setMenuOpen]=useState(false);
  const [cardWidth,setCardWidth]=useState(0);
  const [draft,setDraft]=useState(String(count));
  const [error,setError]=useState('');
  const complete=count>=habit.target;
  const duration=habit.unit===DURATION_UNIT;
  const progressText=formatHabitProgress(count,habit.target,habit.unit);
  function save() {
    if(!/^\d+$/.test(draft.trim()) || Number(draft)>100000) return setError('Enter a whole number from 0 to 100,000.');
    onChange(Number(draft));setEditing(false);setError('');Keyboard.dismiss();
  }
  return <View style={[styles.card,complete && styles.cardComplete]} onLayout={event=>setCardWidth(event.nativeEvent.layout.width)}>
    <View style={styles.row}>
      {cardWidth>=420 && <View style={styles.icon}><Feather name={habit.icon} size={20} color={COLORS.card}/></View>}
      <View style={styles.body}>
        <Copy weight="semibold" style={styles.name}>{habit.name}</Copy>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Update ${habit.name}`}
          accessibilityHint={`Currently ${progressText}. Tap to edit your progress.`}
          aria-expanded={editing}
          onPress={()=>{setDraft(String(count));setError('');setEditing(true);}}
          style={({pressed})=>[styles.quantity,pressed && styles.quantityPressed]}
        >
          <Copy weight="medium" style={styles.meta}>{progressText}</Copy>
        </Pressable>
        <Copy style={[styles.status,complete && styles.statusComplete]}>{complete?'✓ Complete':'In progress'}</Copy>
      </View>
      <View style={styles.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${habit.name}`} accessibilityHint={duration ? 'Decrease by one minute' : undefined} disabled={count===0} onPress={()=>onChange(count-1)} style={({pressed})=>[styles.step,count===0 && styles.disabled,pressed && styles.quantityPressed]}><Feather name="minus" size={18} color={COLORS.card}/></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${habit.name}`} accessibilityHint={duration ? 'Increase by one minute' : undefined} disabled={count>=100000} onPress={()=>onChange(count+1)} style={({pressed})=>[styles.step,styles.add,count>=100000 && styles.disabled,pressed && styles.quantityPressed]}><Feather name="plus" size={18} color={COLORS.card}/></Pressable>
      </View>
      <View testID={`streak-${habit.id}`} accessible accessibilityLabel={`${habit.name}: ${streak} day streak. ${complete?'Selected day complete.':'Selected day incomplete.'}`} style={[styles.streak,complete && styles.streakComplete]}>
        <Ionicons name="flame" size={20} color={complete?COLORS.streakActive:COLORS.white} accessible={false}/>
        <Copy weight="bold" style={[styles.streakCount,complete && styles.streakCountComplete]}>{streak}</Copy>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Manage ${habit.name}`} aria-expanded={menuOpen} onPress={()=>setMenuOpen(open=>!open)} style={styles.manage}><Feather name="more-vertical" size={18} color={COLORS.card}/></Pressable>
    </View>
    <HabitProgress name={habit.name} count={count} target={habit.target} unit={habit.unit} reducedMotion={reducedMotion}/>
    {menuOpen&&<View style={styles.menu}>
      <Pressable accessibilityRole="button" onPress={()=>{setMenuOpen(false);onEdit();}} style={styles.menuButton}><Feather name="edit-2" size={16} color={COLORS.card}/><Copy weight="semibold">Edit habit</Copy></Pressable>
      <Pressable accessibilityRole="button" onPress={()=>{setMenuOpen(false);onDelete();}} style={styles.menuButton}><Feather name="trash-2" size={16} color={COLORS.errorInk}/><Copy weight="semibold" style={styles.deleteText}>Delete habit</Copy></Pressable>
    </View>}
    {editing && <View style={styles.editor}>
      <Copy>{duration ? 'Time completed (total minutes)' : `Amount completed (${habit.unit})`}</Copy>
      <View style={styles.row}>
        <TextInput autoFocus selectTextOnFocus accessibilityLabel={`Amount ${habit.name}`} accessibilityHint={duration ? 'Enter total minutes completed. For example, 90 for 1 hour 30 minutes.' : undefined} value={draft} onChangeText={setDraft} keyboardType="number-pad" returnKeyType="done" onSubmitEditing={save} style={[styles.input,{fontFamily:useSystemFont?undefined:FONTS.regular}]}/>
        <Pressable accessibilityRole="button" onPress={save} style={styles.save}><Copy weight="bold" style={styles.saveText}>Save</Copy></Pressable>
        <Pressable accessibilityRole="button" onPress={()=>{setEditing(false);setError('');Keyboard.dismiss();}} style={styles.edit}><Copy>Cancel</Copy></Pressable>
      </View>
      {!!error && <Copy role="alert" style={styles.error}>{error}</Copy>}
    </View>}
  </View>;
}
const styles=StyleSheet.create({
  card:{backgroundColor:COLORS.white,borderRadius:20,padding:14,gap:10,borderWidth:1,borderColor:COLORS.paperBorder},cardComplete:{borderColor:COLORS.accent},
  row:{flexDirection:'row',alignItems:'center',gap:8},
  icon:{backgroundColor:COLORS.roseSoft,width:36,height:36,borderRadius:13,alignItems:'center',justifyContent:'center'},
  streak:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:8,paddingVertical:10,borderRadius:12,backgroundColor:COLORS.card},
  streakComplete:{backgroundColor:COLORS.roseSoft},streakCount:{color:COLORS.white,fontSize:13},streakCountComplete:{color:COLORS.streakActive},
  body:{flex:1,minWidth:0},name:{fontSize:14,lineHeight:20},meta:{fontSize:12,lineHeight:18,color:COLORS.paperText,textDecorationLine:'underline'},
  quantity:{minHeight:44,justifyContent:'center',alignSelf:'flex-start',borderRadius:6},quantityPressed:{opacity:0.65},controls:{flexDirection:'row',gap:4},
  status:{fontSize:10,lineHeight:15,color:COLORS.paperText},statusComplete:{color:COLORS.streakActive},step:{width:44,height:44,borderRadius:14,backgroundColor:COLORS.background,alignItems:'center',justifyContent:'center'},
  add:{backgroundColor:COLORS.accent},disabled:{opacity:0.4},edit:{minHeight:44,justifyContent:'center',paddingHorizontal:7},
  manage:{width:40,minHeight:44,alignItems:'center',justifyContent:'center'},menu:{flexDirection:'row',gap:8},menuButton:{flex:1,minHeight:44,borderRadius:12,backgroundColor:COLORS.background,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6},deleteText:{color:COLORS.errorInk},
  editor:{gap:10},input:{flex:1,minWidth:0,borderWidth:1,borderColor:COLORS.paperText,borderRadius:12,padding:12,color:COLORS.card,fontSize:16},
  save:{backgroundColor:COLORS.card,padding:14,borderRadius:12},saveText:{color:COLORS.white},error:{color:COLORS.errorInk,fontSize:12},
});
