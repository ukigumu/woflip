import { Pressable, Text, View } from 'react-native';

import { BorderWidth, Fonts, Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Option<T extends string> {
  value: T;
  label: string;
}

/** Control segmentado píldora: opción activa = "thumb" lavanda con borde. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const colors = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        borderWidth: BorderWidth,
        borderColor: colors.border,
        borderRadius: Radii.pill,
        backgroundColor: colors.backgroundElement,
        padding: 3,
      }}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              paddingVertical: 8,
              alignItems: 'center',
              borderRadius: Radii.pill,
              borderWidth: selected ? BorderWidth : 0,
              borderColor: colors.border,
              backgroundColor: selected ? colors.accent : 'transparent',
            }}>
            <Text
              style={{
                fontFamily: selected ? Fonts.bodyBold : Fonts.bodyMedium,
                fontSize: 14,
                color: selected ? '#2E2E2E' : colors.textSecondary,
              }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
