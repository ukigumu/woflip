import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BorderWidth, Fonts, Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SHADOW = 4;
const PAD = 5;

const TABS: Record<string, { label: string; icon: { ios: 'calendar' | 'person.2' | 'arrow.left.arrow.right' | 'person.crop.circle'; android: 'calendar_month' | 'groups' | 'swap_horiz' | 'account_circle' } }> = {
  semana: { label: 'Semana', icon: { ios: 'calendar', android: 'calendar_month' } },
  hoy: { label: 'Hoy', icon: { ios: 'person.2', android: 'groups' } },
  cambios: { label: 'Cambios', icon: { ios: 'arrow.left.arrow.right', android: 'swap_horiz' } },
  perfil: { label: 'Perfil', icon: { ios: 'person.crop.circle', android: 'account_circle' } },
};

interface Route {
  key: string;
  name: string;
}

/** Subconjunto estructural de BottomTabBarProps (evita importar @react-navigation). */
interface Props {
  state: { index: number; routes: Route[] };
  navigation: {
    emit: (event: {
      type: 'tabPress';
      target?: string;
      canPreventDefault: true;
    }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

/**
 * Tab bar propia con el estilo de la casa: píldora flotante papel con borde
 * ink y sombra dura. La pestaña activa se marca con una píldora lavanda que
 * se DESLIZA con muelle entre pestañas. Sustituye a las NativeTabs.
 */
export function AppTabBar({ state, navigation }: Props) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [innerWidth, setInnerWidth] = useState(0);
  const count = state.routes.length;
  const itemWidth = count > 0 ? innerWidth / count : 0;

  // Deslizamiento de la píldora activa (sutil, con muelle).
  const x = useSharedValue(0);
  useEffect(() => {
    if (itemWidth > 0) {
      // Término medio: 300ms con un toque justo de muelle.
      x.value = withSpring(state.index * itemWidth, { duration: 300, dampingRatio: 0.8 });
    }
  }, [state.index, itemWidth, x]);
  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: Math.max(insets.bottom, 12),
        paddingRight: SHADOW,
        paddingBottom: SHADOW,
      }}>
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
      <View
        onLayout={(e) => setInnerWidth(e.nativeEvent.layout.width - PAD * 2 - BorderWidth * 2)}
        style={{
          flexDirection: 'row',
          borderWidth: BorderWidth,
          borderColor: colors.border,
          borderRadius: Radii.pill,
          backgroundColor: colors.background,
          padding: PAD,
        }}>
        {itemWidth > 0 ? (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: PAD,
                bottom: PAD,
                left: PAD,
                width: itemWidth,
                borderRadius: Radii.pill,
                borderWidth: BorderWidth,
                borderColor: colors.border,
                backgroundColor: colors.accent,
              },
              pillStyle,
            ]}
          />
        ) : null}
        {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = state.index === index;
          const color = focused ? '#2E2E2E' : colors.textSecondary;

          function onPress() {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 9 }}>
              <SymbolView
                name={tab.icon}
                size={24}
                tintColor={color}
                fallback={<Text style={{ fontSize: 20, color }}>•</Text>}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: focused ? Fonts.bodyBold : Fonts.bodyMedium,
                  color,
                }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
