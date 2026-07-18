// Shim web estático de react-native-reanimated para el bundle de design-sync.
// El paquete real importa rutas Flow internas de react-native que esbuild no
// puede parsear. Aquí las animaciones saltan directamente al valor final:
// asignar `.value` fuerza un re-render y useAnimatedStyle se re-evalúa.
// Cubre exactamente la superficie usada por la app (day-row, tab-bar).
import { useRef, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';

export function useSharedValue(init) {
  const [, force] = useState(0);
  const ref = useRef(null);
  if (!ref.current) {
    let v = init;
    ref.current = {
      get value() {
        return v;
      },
      set value(nv) {
        v = nv;
        force((c) => c + 1);
      },
    };
  }
  return ref.current;
}

export function useAnimatedStyle(factory) {
  return factory();
}

export const withSpring = (v) => v;
export const withTiming = (v) => v;
export const withDelay = (_d, v) => v;
export const withSequence = (...vals) => vals[vals.length - 1];

export function createAnimatedComponent(C) {
  return C;
}

const Animated = { View, Text, ScrollView, Image, createAnimatedComponent };
export default Animated;
