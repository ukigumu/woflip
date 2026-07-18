import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Body, Caption, Heading, Title } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { HardCard } from '@/components/ui/hard-card';
import { PillButton } from '@/components/ui/pill-button';
import { Screen } from '@/components/ui/screen';
import { Palette } from '@/constants/palette';
import { BorderWidth, Fonts, Spacing } from '@/constants/theme';
import { useStoreVersion } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import { addDaysISO, mondayOf, monthOf, todayISO } from '@/lib/dates';
import { monthHours, weekHours } from '@/lib/hours';
import {
  getAssignments,
  getGroup,
  getMe,
  getShiftTypes,
  getShiftTypesById,
  listOffers,
  listRequests,
} from '@/lib/store';

const enter = (i: number) => FadeInDown.springify().damping(18).stiffness(180).delay(i * 60);

/** Perfil: quién soy, mis horas y mis stats. Turnos-tipo y ajustes en /ajustes. */
export default function PerfilScreen() {
  useStoreVersion();
  const colors = useTheme();
  const [countUpKey, setCountUpKey] = useState(0);
  const me = getMe();
  const group = getGroup();
  const typesById = getShiftTypesById();
  const today = todayISO();
  const month = monthOf(today);
  const monday = mondayOf(today);

  const monthAssignments = getAssignments(me.id, `${month}-01`, `${month}-31`);
  const hours = monthHours(monthAssignments, typesById, month);
  const weekH = weekHours(getAssignments(me.id, monday, addDaysISO(monday, 6)), typesById, monday);
  const worked = monthAssignments.filter((a) => typesById[a.shiftTypeId]?.kind === 'work').length;
  const free = monthAssignments.filter((a) => typesById[a.shiftTypeId]?.kind === 'rest').length;

  const countByType: Record<string, number> = {};
  for (const a of monthAssignments) {
    countByType[a.shiftTypeId] = (countByType[a.shiftTypeId] ?? 0) + 1;
  }
  const breakdown = getShiftTypes().filter((st) => st.kind === 'work' && countByType[st.id]);

  const openOffers = listOffers().filter((o) => o.status === 'open').length;
  const myPending = listRequests().filter(
    (r) => r.fromMemberId === me.id && r.status === 'pending',
  ).length;

  return (
    <Screen>
      <Animated.View
        entering={enter(0)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar name={me.name} photoUri={me.photoUri} size={56} />
        <View style={{ flex: 1 }}>
          <Title>{me.name}</Title>
          <Caption color="secondary">
            {`${group.name} · ${group.memberIds.length} personas`}
          </Caption>
        </View>
        <Pressable
          onPress={() => router.push('/ajustes')}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
          <SymbolView
            name="gearshape"
            size={26}
            tintColor={colors.text}
            fallback={<Text style={{ fontSize: 22, color: colors.text }}>⚙︎</Text>}
          />
        </Pressable>
      </Animated.View>

      {/* Horas del mes: la utilidad con N=1 (sin grupo también sirve) */}
      <Animated.View entering={enter(1)}>
        <HardCard
          color={colors.accent}
          onPress={() => setCountUpKey((k) => k + 1)}
          contentStyle={{ padding: 16, gap: 2 }}>
          <Text style={{ fontSize: 13, fontFamily: Fonts.bodyBold, color: '#2E2E2E' }}>
            Este mes llevas
          </Text>
          <CountUpText key={countUpKey} value={hours} />
        </HardCard>
      </Animated.View>

      <View style={{ gap: Spacing.two }}>
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          <StatCard
            color={Palette.sky}
            label="Esta semana"
            value={`${weekH} h`}
            sub="de lunes a domingo"
            delay={2}
          />
          <StatCard
            color={Palette.mint}
            label="Días trabajados"
            value={`${worked}`}
            sub="este mes"
            delay={3}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          <StatCard
            color={Palette.coral}
            label="Días libres"
            value={`${free}`}
            sub="este mes"
            delay={4}
          />
          <StatCard
            color={Palette.sun}
            label="Cambios"
            value={`${openOffers + myPending}`}
            sub={`${openOffers} ${openOffers === 1 ? 'oferta' : 'ofertas'} · ${myPending} ${myPending === 1 ? 'petición' : 'peticiones'}`}
            delay={5}
          />
        </View>
      </View>

      {breakdown.length > 0 ? (
        <Animated.View entering={enter(6)} style={{ gap: 8 }}>
          <Heading>Tu mes por turnos</Heading>
          <HardCard shadowOffset={4} contentStyle={{ padding: 14 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
              {breakdown.map((st) => (
                <View key={st.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      borderWidth: BorderWidth,
                      borderColor: '#2E2E2E',
                      backgroundColor: st.color,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text style={{ fontSize: 13, fontFamily: Fonts.display, color: '#2E2E2E' }}>
                      {st.code}
                    </Text>
                  </View>
                  <Body style={{ fontFamily: Fonts.bodyMedium }}>{`×${countByType[st.id]}`}</Body>
                </View>
              ))}
            </View>
          </HardCard>
        </Animated.View>
      ) : null}

      {__DEV__ ? (
        <PillButton label="Ver onboarding (dev)" onPress={() => router.push('/onboarding')} />
      ) : null}
    </Screen>
  );
}

/** Número del hero animado con count-up (~800ms, easeOutCubic). */
function CountUpText({ value }: { value: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const dur = 800;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - (1 - t) ** 3;
      // Enteros mientras anima; el valor exacto (puede tener .1) solo al final.
      setShown(t >= 1 ? value : Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <Text style={{ fontSize: 36, fontFamily: Fonts.display, color: '#2E2E2E' }}>
      {`${shown} horas`}
    </Text>
  );
}

function StatCard({
  color,
  label,
  value,
  sub,
  delay,
}: {
  color: string;
  label: string;
  value: string;
  sub?: string;
  delay: number;
}) {
  return (
    <Animated.View entering={enter(delay)} style={{ flex: 1 }}>
      <HardCard color={color} shadowOffset={4} contentStyle={{ padding: 14, gap: 2, flex: 1 }}>
        <Text style={{ fontSize: 12, fontFamily: Fonts.bodyBold, color: '#2E2E2E' }}>{label}</Text>
        <Text style={{ fontSize: 24, fontFamily: Fonts.display, color: '#2E2E2E' }}>{value}</Text>
        {sub ? (
          <Text style={{ fontSize: 12, fontFamily: Fonts.body, color: '#2E2E2E' }}>{sub}</Text>
        ) : null}
      </HardCard>
    </Animated.View>
  );
}
