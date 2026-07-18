import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const canBuzz = Platform.OS === 'ios' || Platform.OS === 'android';

/** Háptica sutil, segura en web (no-op) y sin promesas colgantes. */
export const haptics = {
  selection: () => {
    if (canBuzz) Haptics.selectionAsync().catch(() => {});
  },
  impact: (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    if (canBuzz) Haptics.impactAsync(style).catch(() => {});
  },
};
