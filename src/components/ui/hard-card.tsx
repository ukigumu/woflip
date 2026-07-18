import type { PropsWithChildren } from 'react';
import {
  Pressable,
  View,
  type AccessibilityRole,
  type AccessibilityState,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { BorderWidth, Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  /** Color de fondo de la card (default: surface del tema). */
  color?: string;
  /** Color de fondo mientras la card está pulsada (además del "hundido"). */
  pressedColor?: string;
  /** Desplazamiento de la sombra dura (px, sin blur). */
  shadowOffset?: number;
  radius?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
}

/**
 * Card neo-brutalista: borde ink 1.5px + sombra dura sin blur (una View
 * desplazada detrás, RN no sabe hacer sombras sin blur). Si recibe onPress,
 * al pulsar la card se "hunde" sobre su sombra.
 */
export function HardCard({
  children,
  color,
  pressedColor,
  shadowOffset = 5,
  radius = Radii.card,
  onPress,
  onLongPress,
  style,
  contentStyle,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
}: PropsWithChildren<Props>) {
  const colors = useTheme();
  const o = shadowOffset;

  const face = (pressed: boolean): StyleProp<ViewStyle> => [
    {
      borderWidth: BorderWidth,
      borderColor: colors.border,
      borderRadius: radius,
      backgroundColor: color ?? colors.surface,
      // Recorta los fondos de los hijos (p. ej. filas en pressed) al radio.
      overflow: 'hidden',
    },
    pressed && { transform: [{ translateX: o - 1 }, { translateY: o - 1 }] },
    pressed && pressedColor ? { backgroundColor: pressedColor } : null,
    contentStyle,
  ];

  return (
    <View style={[{ paddingRight: o, paddingBottom: o }, style]}>
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
          accessibilityRole={accessibilityRole}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityState={accessibilityState}
          style={({ pressed }) => face(pressed)}>
          {children}
        </Pressable>
      ) : (
        <View style={face(false)}>{children}</View>
      )}
    </View>
  );
}
