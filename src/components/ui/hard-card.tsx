import type { PropsWithChildren } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { BorderWidth, Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  /** Color de fondo de la card (default: surface del tema). */
  color?: string;
  /** Desplazamiento de la sombra dura (px, sin blur). */
  shadowOffset?: number;
  /** Rotación en grados para efecto "pegatina" (ej. -1.5). */
  rotate?: number;
  radius?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Card neo-brutalista: borde ink 1.5px + sombra dura sin blur (una View
 * desplazada detrás, RN no sabe hacer sombras sin blur). Si recibe onPress,
 * al pulsar la card se "hunde" sobre su sombra.
 */
export function HardCard({
  children,
  color,
  shadowOffset = 5,
  rotate = 0,
  radius = Radii.card,
  onPress,
  onLongPress,
  style,
  contentStyle,
}: PropsWithChildren<Props>) {
  const colors = useTheme();
  const o = shadowOffset;

  const face = (pressed: boolean): StyleProp<ViewStyle> => [
    {
      borderWidth: BorderWidth,
      borderColor: colors.border,
      borderRadius: radius,
      backgroundColor: color ?? colors.surface,
    },
    pressed && { transform: [{ translateX: o - 1 }, { translateY: o - 1 }] },
    contentStyle,
  ];

  return (
    <View
      style={[
        { paddingRight: o, paddingBottom: o },
        rotate !== 0 && { transform: [{ rotate: `${rotate}deg` }] },
        style,
      ]}>
      <View
        style={{
          position: 'absolute',
          top: o,
          left: o,
          right: 0,
          bottom: 0,
          borderRadius: radius,
          backgroundColor: colors.shadow,
        }}
      />
      {onPress || onLongPress ? (
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          delayLongPress={350}
          style={({ pressed }) => face(pressed)}>
          {children}
        </Pressable>
      ) : (
        <View style={face(false)}>{children}</View>
      )}
    </View>
  );
}
