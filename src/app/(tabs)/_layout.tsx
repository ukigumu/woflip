import { Tabs } from 'expo-router';

import { AppTabBar } from '@/components/ui/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <AppTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="hoy" />
      <Tabs.Screen name="semana" />
      <Tabs.Screen name="equipo" />
      <Tabs.Screen name="cambios" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
