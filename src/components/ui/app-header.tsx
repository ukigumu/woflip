import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Title } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';

/** Cabecera común: logo Woflip a la izquierda, nombre de página (o nodo custom) a la derecha. */
export function AppHeader({ title, right }: { title?: string; right?: ReactNode }) {
  const colors = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Image
        source={require('../../../assets/woflip-logo.svg')}
        contentFit="contain"
        tintColor={colors.text}
        style={{ width: 88, height: 30 }}
      />
      <View style={{ flex: 1 }} />
      {right ?? (title ? <Title>{title}</Title> : null)}
    </View>
  );
}
