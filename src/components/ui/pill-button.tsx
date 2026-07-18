import { ArrowLeft02Icon, ArrowRight02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { BorderWidth, Fonts, Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'accent' | 'ghost' | 'danger';

interface Props {
  /** Texto visible. Opcional si hay icono (botón solo-icono). */
  label?: string;
  /** Icono Hugeicons a la izquierda del texto (o solo, sin label). */
  icon?: 'arrow-left' | 'arrow-right';
  /** Obligatorio en botones solo-icono para que el lector anuncie algo útil. */
  accessibilityLabel?: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

const SHADOW = 3;

const ICONS = {
  'arrow-left': ArrowLeft02Icon,
  'arrow-right': ArrowRight02Icon,
};

/**
 * Botón píldora neo-brutalista: borde 1.5px + sombra dura de 3px que se
 * "hunde" al pulsar. primary = ink sobre papel (invertido en dark),
 * accent = lavanda, ghost/danger = transparente con borde.
 */
export function PillButton({
  label,
  icon,
  accessibilityLabel,
  onPress,
  variant = 'ghost',
  size = 'md',
  style,
}: Props) {
  const colors = useTheme();

  // ghost/danger necesitan fondo OPACO: la sombra dura va justo detrás y se
  // vería a través de un fondo transparente (el botón parecería un bloque ink).
  const bg =
    variant === 'primary' ? colors.text : variant === 'accent' ? colors.accent : colors.background;
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
  const fontSize = size === 'sm' ? 13 : 15;

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
        accessibilityLabel={accessibilityLabel ?? label}
        style={({ pressed }) => [
          {
            borderWidth: BorderWidth,
            borderColor,
            borderRadius: Radii.pill,
            backgroundColor: bg,
            paddingVertical,
            paddingHorizontal,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          },
          pressed && { transform: [{ translateX: SHADOW - 1 }, { translateY: SHADOW - 1 }] },
        ]}>
        {icon ? (
          <HugeiconsIcon icon={ICONS[icon]} size={fontSize + 2} color={fg} strokeWidth={3} />
        ) : null}
        {label ? (
          <Text style={{ fontFamily: Fonts.bodyBold, fontSize, color: fg }}>{label}</Text>
        ) : null}
      </Pressable>
    </View>
  );
}
