import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  initialWindowMetrics,
  SafeAreaProvider,
  type Metrics,
} from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { StoreProvider } from '@/hooks/use-store';
import { ThemeModeProvider, useScheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

const IPHONE_PRO_MAX_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 430, height: 932 },
  insets: { top: 59, right: 0, bottom: 34, left: 0 },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <>
      <Head>
        <title>Woflip</title>
      </Head>
      <StoreProvider>
        <ThemeModeProvider>
          <ThemedApp />
        </ThemeModeProvider>
      </StoreProvider>
    </>
  );
}

/**
 * Scrollbar propia en web, a juego con el tema activo: pulgar píldora en el
 * gris del marco y raíl transparente. Propiedades estándar (Chrome/Firefox)
 * + pseudo-elementos WebKit (Safari viejo); Chrome ignora los segundos si
 * están las primeras, así que no compiten.
 */
function useWebScrollbar(isDark: boolean) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const thumb = isDark ? '#4A4742' : '#B8B3AB';
    const thumbHover = '#8A867E';
    let tag = document.getElementById('woflip-scrollbar');
    if (!tag) {
      tag = document.createElement('style');
      tag.id = 'woflip-scrollbar';
      document.head.appendChild(tag);
    }
    tag.textContent = `
      * { scrollbar-width: thin; scrollbar-color: ${thumb} transparent; }
      *::-webkit-scrollbar { width: 8px; height: 8px; background: transparent; }
      *::-webkit-scrollbar-thumb { background: ${thumb}; border-radius: 999px; }
      *::-webkit-scrollbar-thumb:hover { background: ${thumbHover}; }
      *::-webkit-scrollbar-button, *::-webkit-scrollbar-corner { display: none; }
    `;
  }, [isDark]);
}

/** Chrome de la app: necesita el esquema efectivo, así que vive bajo el provider. */
function ThemedApp() {
  const window = useWindowDimensions();
  const isDark = useScheme() === 'dark';
  useWebScrollbar(isDark);
  const useMobileFrame = Platform.OS === 'web' && window.width >= 526 && window.height >= 1028;
  const appBackground = Colors[isDark ? 'dark' : 'light'].background;
  const webMetrics: Metrics = useMobileFrame
    ? IPHONE_PRO_MAX_METRICS
    : {
        frame: { x: 0, y: 0, width: window.width, height: window.height },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      };

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <View
        style={[
          styles.viewport,
          {
            backgroundColor: useMobileFrame ? (isDark ? '#1C1B19' : '#D8D4CE') : appBackground,
          },
        ]}>
        <View
          style={[
            styles.app,
            useMobileFrame && styles.webApp,
            {
              backgroundColor: appBackground,
              borderColor: isDark ? '#4A4742' : '#B8B3AB',
            },
          ]}>
          <SafeAreaProvider
            key={useMobileFrame ? 'mobile-frame' : 'fluid-frame'}
            initialMetrics={Platform.OS === 'web' ? webMetrics : initialWindowMetrics}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="ajustes" options={{ presentation: 'modal' }} />
            </Stack>
          </SafeAreaProvider>
        </View>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  app: {
    flex: 1,
    width: '100%',
  },
  webApp: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 932,
    height: 932,
    maxWidth: 430,
    maxHeight: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 48,
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.32)',
  },
});
