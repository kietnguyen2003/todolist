import { Image, Pressable, StyleSheet, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { COLORS } from '../theme';
import { Copy } from './ui';
export type Section='todo'|'calendar'|'tracker';
export function TodayNavigation({desktop,active,onSelect}:{desktop:boolean;active:Section;onSelect:(section:Section)=>void}) {
  const items=[{id:'todo' as const,label:'To do',icon:'check-square' as const},{id:'calendar' as const,label:'Calendar',icon:'calendar' as const},{id:'tracker' as const,label:'Tracker',icon:'bar-chart-2' as const}];
  return <View testID={desktop?'navigation-top':'navigation-bottom'} style={[styles.bar,desktop && styles.top]}>
    {desktop && <View style={styles.brand}><View style={styles.logo}><Image source={require('../../logo.png')} style={styles.logoImage} resizeMode="contain" accessibilityLabel="Logo Tea Pret"/></View><Copy weight="bold" style={styles.brandText}>Tea Pret</Copy></View>}
    <View style={styles.items}>
      {items.map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Go to ${item.label}`} aria-pressed={active===item.id} onPress={()=>onSelect(item.id)} style={[styles.item,desktop && styles.wideItem,active===item.id && styles.active]}>
        <Feather name={item.icon} size={19} color={active===item.id?COLORS.accent:COLORS.muted}/><Copy weight="semibold" style={[styles.label,active===item.id && styles.activeLabel]}>{item.label}</Copy>
      </Pressable>)}
    </View>
  </View>;
}
const styles=StyleSheet.create({
  bar:{backgroundColor:COLORS.card,paddingHorizontal:10,paddingVertical:5},top:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:36,paddingVertical:12},
  brand:{flexDirection:'row',alignItems:'center',gap:10},logo:{backgroundColor:COLORS.accent,width:35,height:35,borderRadius:11,alignItems:'center',justifyContent:'center',overflow:'hidden'},logoImage:{width:'100%',height:'100%'},brandText:{color:COLORS.white,fontSize:21},
  items:{flexDirection:'row',gap:4},item:{flex:1,minHeight:48,alignItems:'center',justifyContent:'center',gap:3,borderRadius:11,paddingHorizontal:8},wideItem:{flexGrow:0,flexShrink:0,flexBasis:'auto',minWidth:112,flexDirection:'row',gap:9,paddingHorizontal:20,minHeight:44},
  active:{backgroundColor:COLORS.inputFocused},label:{fontSize:10,color:COLORS.muted},activeLabel:{color:COLORS.accent},
});
