// Shim web de react-native-safe-area-context para el bundle de design-sync:
// en navegador no hay notch, así que los insets son 0 (mismo comportamiento
// que el fallback web real del paquete). El paquete real requiere resolución
// .web.js de Metro que esbuild no hace.
import { createElement } from 'react';
import { View } from 'react-native';

const ZERO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 };

export function useSafeAreaInsets() {
  return ZERO_INSETS;
}

export function SafeAreaProvider({ children }) {
  return children;
}

export function SafeAreaView({ children, ...props }) {
  return createElement(View, props, children);
}
