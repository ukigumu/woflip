import { BottomSheet, RNHostView } from '@expo/ui';
import type { PropsWithChildren } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Modifiers SwiftUI solo en iOS: un import estático crashearía en Android.
const iosModifiers =
  Platform.OS === 'ios'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      (require('@expo/ui/swift-ui/modifiers') as typeof import('@expo/ui/swift-ui/modifiers'))
    : null;

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

/**
 * Bottom sheet nativo (@expo/ui): animación de muelle real, asa de arrastre
 * y swipe-para-cerrar del sistema. El contenido va en RN (RNHostView) para
 * conservar el estilo de la casa; el fondo del sheet se tinta a papel.
 */
export function Sheet({ visible, onDismiss, children }: PropsWithChildren<Props>) {
  const colors = useTheme();
  const { width } = useWindowDimensions();

  return (
    <BottomSheet
      isPresented={visible}
      onDismiss={onDismiss}
      modifiers={
        iosModifiers ? [iosModifiers.presentationBackground(colors.background)] : undefined
      }>
      <RNHostView matchContents>
        {/* Ancho explícito: RNHostView mide el contenido, no llena el sheet.
            El sheet nativo mete 16 de padding a cada lado. */}
        <View style={{ width: width - 32, gap: Spacing.three, paddingBottom: Spacing.three }}>
          {children}
        </View>
      </RNHostView>
    </BottomSheet>
  );
}
