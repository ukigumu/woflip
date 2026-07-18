import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { BorderWidth, Fonts, Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'accent' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

const SHADOW = 3;

/**
 * Botón píldora neo-brutalista: borde 1.5px + sombra dura de 3px que se
 * "hunde" al pulsar. primary = ink sobre papel (invertido en dark),
 * accent = lavanda, ghost/danger = transparente con borde.
 */
export function PillButton({ label, onPress, variant = 'ghost', size = 'md', style }: Props) {
  const colors = useTheme();

  // ghost/danger necesitan fondo OPACO: la sombra dura va justo detrás y se
  // vería a través de un fondo transparente (el botón parecería un bloque ink).
  const bg =
    variant === 'primary'
      ? colors.text
      : variant === 'accent'
        ? colors.accent
        : colors.background;
  const fg =
    variant === 'primary'
      ? colors.onInverse
      : variant === 'accent'
        ? '#2E2E2E' // lavanda es clara en ambos modos: ink siempre legible
        : variant === 'danger'
          ? colors.danger
          : colors.text;
  const borderColor = variant === 'danger' ? colors.danger : colors.border;

  const paddingVertical = size === 'sm' ? 7 : 12;
  const paddingHorizontal = size === 'sm' ? 14 : 22;

  return (
    <View style={[{ paddingRight: SHADOW, paddingBottom: SHADOW }, style]}>
      <View
        style={{
          position: 'absolute',
          top: SHADOW,
          left: SHADOW,
          right: 0,
          bottom: 0,
          borderRadius: Radii.pill,
          backgroundColor: colors.shadow,
        }}
      />
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          {
            borderWidth: BorderWidth,
            borderColor,
            borderRadius: Radii.pill,
            backgroundColor: bg,
            paddingVertical,
            paddingHorizontal,
            alignItems: 'center',
          },
          pressed && { transform: [{ translateX: SHADOW - 1 }, { translateY: SHADOW - 1 }] },
        ]}>
        <Text
          style={{
            fontFamily: Fonts.bodyBold,
            fontSize: size === 'sm' ? 13 : 15,
            color: fg,
          }}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}
