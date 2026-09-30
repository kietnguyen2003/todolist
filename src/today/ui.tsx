import { createContext, useContext } from 'react';
import { Text, type TextProps } from 'react-native';
import { COLORS, FONTS } from '../theme';
export const SystemFontContext=createContext(false);
export function Copy({weight='regular',style,...props}:TextProps & {weight?:keyof typeof FONTS}) {
  const system=useContext(SystemFontContext);
  return <Text {...props} style={[{color:COLORS.card,fontSize:14,fontFamily:system?undefined:FONTS[weight]},style]} />;
}
