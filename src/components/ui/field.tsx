import { TextInput, type TextInputProps } from 'react-native';

import { BorderWidth, Fonts, Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** TextInput con el estilo de la casa: borde ink, radio interior, Inter. */
export function Field(props: TextInputProps) {
  const colors = useTheme();

  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      {...props}
      style={[
        {
          borderWidth: BorderWidth,
          borderColor: colors.border,
          borderRadius: Radii.inner,
          backgroundColor: colors.surface,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontFamily: Fonts.body,
          fontSize: 15,
          color: colors.text,
        },
        props.style,
      ]}
    />
  );
}
