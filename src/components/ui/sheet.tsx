import { BottomSheet, RNHostView } from '@expo/ui';
import type { PropsWithChildren } from 'react';
import { Modal, Platform, Pressable, useWindowDimensions, View } from 'react-native';

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
  const window = useWindowDimensions();
  const useMobileFrame = Platform.OS === 'web' && window.width >= 526 && window.height >= 1028;

  if (Platform.OS === 'web') {
    const modalWidth = useMobileFrame ? 430 : window.width;
    const modalHeight = useMobileFrame ? 932 : window.height;

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar diálogo"
            onPress={onDismiss}
            style={{
              width: modalWidth,
              height: modalHeight,
              maxWidth: '100%',
              maxHeight: '100%',
              justifyContent: 'flex-end',
              overflow: 'hidden',
              borderRadius: useMobileFrame ? 48 : 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
            }}>
            <Pressable
              onPress={(event) => event.stopPropagation()}
              style={{
                maxHeight: '82%',
                paddingHorizontal: Spacing.four,
                paddingTop: Spacing.three,
                paddingBottom: useMobileFrame ? 34 : Spacing.four,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                backgroundColor: colors.surface,
              }}>
              <View style={{ gap: Spacing.three }}>{children}</View>
            </Pressable>
          </Pressable>
        </View>
      </Modal>
    );
  }

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
        <View
          style={{
            width: window.width - 32,
            gap: Spacing.three,
            paddingHorizontal: Spacing.two,
            paddingTop: Spacing.two,
            paddingBottom: Spacing.four,
          }}>
          {children}
        </View>
      </RNHostView>
    </BottomSheet>
  );
}
