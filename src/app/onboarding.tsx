import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState, type PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DayRow } from '@/components/day-row';
import { ShiftTypeEditorSheet } from '@/components/shift-type-editor-sheet';
import { Body, Caption, Heading, Hero, Title } from '@/components/ui/app-text';
import { HardCard } from '@/components/ui/hard-card';
import { PillButton } from '@/components/ui/pill-button';
import { BorderWidth, Fonts, Radii, Spacing } from '@/constants/theme';
import { useStoreVersion } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import { todayISO, weekDates } from '@/lib/dates';
import { haptics } from '@/lib/haptics';
import { formatIntervals } from '@/lib/hours';
import {
  currentMonday,
  getAssignment,
  getMe,
  getShiftTypes,
  getShiftTypesById,
  setDayShift,
  updateMember,
  updateSettings,
} from '@/lib/store';
import type { ShiftType } from '@/lib/types';

const STEPS = ['name', 'privacy', 'explain', 'week'] as const;
type Step = (typeof STEPS)[number];

/**
 * Onboarding en tres pasos sobre una sola ruta:
 * 1) nombre (chapa "HOLA, ME LLAMO…"), 2) privacidad (dos tarjetas grandes),
 * 3) la semana real con las mismas DayRow de /semana, tap por día para ciclar.
 * El borrador es estado local (cero escrituras por tap); "Crear mi semana"
 * lo persiste y hace la coreografía de salida hacia /semana, cuyas filas
 * ocupan las mismas posiciones (el "morph" es continuidad geométrica).
 */
export default function OnboardingScreen() {
  useStoreVersion();
  const router = useRouter();
  const colors = useTheme();
  const reduceMotion = useReducedMotion();

  const me = getMe();
  const days = weekDates(currentMonday());
  const typesById = getShiftTypesById();
  const ordered = [...getShiftTypes()].sort((a, b) => a.sortOrder - b.sortOrder);

  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [draft, setDraft] = useState<(string | null)[]>(() =>
    days.map((d) => getAssignment(me.id, d)?.shiftTypeId ?? null),
  );
  const [editing, setEditing] = useState<ShiftType | null>(null);
  const [chosen, setChosen] = useState<boolean | null>(null);
  const [leaving, setLeaving] = useState(false);
  const exit = useSharedValue(0);

  const firstName = name.trim().split(/\s+/)[0];

  function submitName() {
    haptics.selection();
    if (name.trim()) updateMember(me.id, { name: name.trim() });
    setStep('privacy');
  }

  function choosePrivacy(shareFullSchedule: boolean) {
    if (chosen !== null) return;
    haptics.selection();
    setChosen(shareFullSchedule);
    updateMember(me.id, { shareFullSchedule });
    // Breve pausa con el fondo activo visible antes de avanzar.
    setTimeout(() => {
      setChosen(null);
      setStep('explain');
    }, 180);
  }

  /** Tap: mismo ciclo que /semana (sortOrder; tras el último, vacío). */
  function cycleDraft(i: number) {
    if (leaving) return;
    haptics.selection();
    setDraft((prev) => {
      const cur = prev[i];
      const idx = ordered.findIndex((t) => t.id === cur);
      const next = cur === null ? ordered[0].id : (ordered[idx + 1]?.id ?? null);
      return prev.map((v, j) => (j === i ? next : v));
    });
  }

  function createWeek() {
    if (leaving) return;
    setLeaving(true);
    haptics.impact();
    // Persistir ANTES de animar: si matan la app a mitad, el estado es coherente.
    days.forEach((date, i) => setDayShift(me.id, date, draft[i]));
    updateSettings({ onboardingDone: true });
    if (reduceMotion) {
      router.replace('/(tabs)/semana');
      return;
    }
    exit.value = withTiming(1, { duration: 200 });
    setTimeout(() => router.replace('/(tabs)/semana'), 420);
  }

  const chromeTopStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ translateY: -8 * exit.value }],
  }));
  const chromeBottomStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ translateY: 12 * exit.value }],
  }));

  if (step === 'name') {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.three }}>
          <Animated.View exiting={FadeOutUp.duration(180)} style={{ flex: 1 }}>
            <Header step="name" />
            <View style={{ flex: 1, paddingTop: Spacing.six, gap: Spacing.four }}>
              <Animated.View entering={FadeInDown.springify(300)} style={{ gap: Spacing.two }}>
                <Hero numberOfLines={1}>Primero, tú</Hero>
                <Body color="secondary">
                  Escribe tu nombre: es lo único que verá tu equipo.
                </Body>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(140).springify(300)}>
                <HardCard shadowOffset={5}>
                  <View
                    style={[
                      styles.tagHeader,
                      { backgroundColor: colors.accent, borderBottomColor: colors.border },
                    ]}>
                    <Text style={styles.tagHeaderText}>HOLA, ME LLAMO…</Text>
                  </View>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Tu nombre"
                    placeholderTextColor={colors.textSecondary}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={submitName}
                    accessibilityLabel="Tu nombre"
                    style={[styles.tagInput, { color: colors.text }]}
                  />
                </HardCard>
              </Animated.View>
            </View>
            <PillButton variant="primary" label="¡Vamos!" onPress={submitName} />
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (step === 'privacy') {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={['top', 'bottom']}>
        <View style={{ flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.three }}>
          <Animated.View exiting={FadeOutUp.duration(180)} style={{ flex: 1 }}>
            <Header step="privacy" onBack={() => setStep('name')} />
            <View style={{ flex: 1, paddingTop: Spacing.six, gap: Spacing.three }}>
              <Animated.View entering={FadeInDown.springify(300)} style={{ gap: Spacing.two }}>
                <Hero>¿Quién ve tu horario?</Hero>
                <Body color="secondary">Tú decides. Puedes cambiarlo cuando quieras en Perfil.</Body>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(120).springify(300)}>
                <HardCard
                  onPress={() => choosePrivacy(true)}
                  shadowOffset={4}
                  color={chosen === true ? colors.backgroundSelected : undefined}
                  pressedColor={colors.backgroundSelected}
                  accessibilityRole="button"
                  accessibilityLabel="Mi equipo. Tus compañeros ven tus turnos y tus horas exactas."
                  contentStyle={styles.privacyCard}>
                  <View style={styles.privacyHeader}>
                    <PrivacyIcon symbol="person.2.fill" />
                    <Heading style={{ flex: 1 }}>Mi equipo</Heading>
                  </View>
                  <Body color="secondary">Tus compañeros ven tus turnos y tus horas exactas.</Body>
                </HardCard>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).springify(300)}>
                <HardCard
                  onPress={() => choosePrivacy(false)}
                  shadowOffset={4}
                  color={chosen === false ? colors.backgroundSelected : undefined}
                  pressedColor={colors.backgroundSelected}
                  accessibilityRole="button"
                  accessibilityLabel="Solo yo. Nadie ve tus turnos ni tus horas. El emparejamiento ciego funciona igual."
                  contentStyle={styles.privacyCard}>
                  <View style={styles.privacyHeader}>
                    <PrivacyIcon symbol="lock.fill" />
                    <Heading style={{ flex: 1 }}>Solo yo</Heading>
                  </View>
                  <Body color="secondary">Nadie ve tus turnos ni tus horas.</Body>
                  <Caption color="secondary">
                    El emparejamiento ciego funciona igual: puedes pedir y ofrecer cambios sin
                    enseñar tu horario a nadie.
                  </Caption>
                </HardCard>
              </Animated.View>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'explain') {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={['top', 'bottom']}>
        <View style={{ flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.three }}>
          <Animated.View exiting={FadeOutUp.duration(180)} style={{ flex: 1 }}>
            <Header step="explain" onBack={() => setStep('privacy')} />
            <View style={{ flex: 1, paddingTop: Spacing.six, gap: Spacing.four }}>
              <Animated.View entering={FadeInDown.springify(300)} style={{ gap: Spacing.two }}>
                <Hero>Así funciona</Hero>
                <Body color="secondary">
                  Cada día es una pegatina. Tócala y cambia de turno: mira.
                </Body>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(140).springify(300)}>
                <DemoDay date={days[0]} ordered={ordered} typesById={typesById} />
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(220).springify(300)}
                style={{ gap: Spacing.two }}>
                <Body color="secondary">
                  •  Mantén pulsado un día para ajustar sus horas exactas.
                </Body>
                <Body color="secondary">
                  •  Tu semana viene con un ejemplo: cámbiala a tu patrón real.
                </Body>
              </Animated.View>
            </View>
            <PillButton
              variant="primary"
              label="Montar mi semana"
              onPress={() => {
                haptics.selection();
                setStep('week');
              }}
            />
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.three }}>
        <Animated.View entering={FadeIn} style={[{ gap: Spacing.three }, chromeTopStyle]}>
          <Header step="week" onBack={leaving ? undefined : () => setStep('explain')} />
          <Title>Tu semana, de un vistazo</Title>
          <Caption color="secondary">
            {firstName
              ? `Genial, ${firstName}. Toca cada día para cambiar el turno.`
              : 'Toca cada día para cambiar el turno.'}
          </Caption>
        </Animated.View>

        <View style={{ flex: 1, justifyContent: 'center' }}>
          {days.map((date, i) => {
            const id = draft[i];
            return (
              <SettleRow key={date} index={i} celebrate={leaving} reduceMotion={reduceMotion}>
                <DayRow
                  date={date}
                  assignment={
                    id
                      ? { id: `${me.id}:${date}`, memberId: me.id, date, shiftTypeId: id }
                      : undefined
                  }
                  shiftTypesById={typesById}
                  isToday={date === todayISO()}
                  onCycle={() => cycleDraft(i)}
                  onEditHours={() => {
                    const t = id ? typesById[id] : undefined;
                    if (t?.kind === 'work') setEditing(t);
                  }}
                />
              </SettleRow>
            );
          })}
        </View>

        <Animated.View
          entering={FadeIn.delay(300)}
          style={[{ gap: Spacing.three }, chromeBottomStyle]}>
          <Caption color="secondary">Toca un turno para ajustar sus horas.</Caption>
          <View style={{ flexDirection: 'row', gap: Spacing.two }}>
            {ordered.map((st) => (
              <ShiftChip key={st.id} shiftType={st} onPress={() => setEditing(st)} />
            ))}
          </View>
          <PillButton variant="primary" label="Crear mi semana" onPress={createWeek} />
        </Animated.View>
      </View>

      <ShiftTypeEditorSheet shiftType={editing} onDismiss={() => setEditing(null)} />
    </SafeAreaView>
  );
}

/** Logo + atrás + stepper: presente en todos los pasos, lenguaje de píldoras. */
function Header({ step, onBack }: { step: Step; onBack?: () => void }) {
  const colors = useTheme();
  const current = STEPS.indexOf(step);
  return (
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        {onBack ? <PillButton size="sm" label="‹" onPress={onBack} /> : null}
        <Image
          source={require('../../assets/woflip-logo.svg')}
          contentFit="contain"
          style={{ width: 96, height: 32 }}
        />
      </View>
      <View
        style={styles.stepper}
        accessibilityLabel={`Paso ${current + 1} de ${STEPS.length}`}
        accessibilityRole="progressbar">
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[
              styles.stepPill,
              {
                borderColor: colors.border,
                backgroundColor:
                  i < current
                    ? colors.text
                    : i === current
                      ? colors.accent
                      : colors.backgroundElement,
              },
              i === current && styles.stepPillActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

/** Círculo lavanda con SF Symbol (fallback de punto, como la tab bar). */
function PrivacyIcon({ symbol }: { symbol: 'lock.fill' | 'person.2.fill' }) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.privacyIcon,
        { backgroundColor: colors.accent, borderColor: colors.border },
      ]}>
      <SymbolView
        name={symbol}
        size={20}
        tintColor="#2E2E2E"
        fallback={<Text style={{ fontSize: 16, color: '#2E2E2E' }}>•</Text>}
      />
    </View>
  );
}

/**
 * Demo autoexplicativa: una DayRow real que va ciclando de turno sola
 * (y también al tocarla), enseñando la interacción antes de pedirla.
 */
function DemoDay({
  date,
  ordered,
  typesById,
}: {
  date: string;
  ordered: ShiftType[];
  typesById: Record<string, ShiftType>;
}) {
  const reduceMotion = useReducedMotion();
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % ordered.length), 1200);
    return () => clearInterval(timer);
  }, [reduceMotion, ordered.length]);

  const shiftType = ordered[idx];
  return (
    <DayRow
      date={date}
      assignment={{ id: 'demo', memberId: 'demo', date, shiftTypeId: shiftType.id }}
      shiftTypesById={typesById}
      isToday={false}
      onCycle={() => setIdx((i) => (i + 1) % ordered.length)}
      onEditHours={() => {}}
    />
  );
}

/**
 * Entrada en cascada + "asentamiento" al pulsar el CTA, envolviendo la
 * DayRow real de /semana sin tocarla.
 */
function SettleRow({
  index,
  celebrate,
  reduceMotion,
  children,
}: PropsWithChildren<{ index: number; celebrate: boolean; reduceMotion: boolean }>) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (celebrate && !reduceMotion) {
      scale.value = withDelay(
        index * 40,
        withSequence(
          withTiming(1.03, { duration: 70 }),
          withSpring(1, { duration: 300, dampingRatio: 0.7 }),
        ),
      );
    }
  }, [celebrate, reduceMotion, index, scale]);
  const settleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      entering={FadeInDown.delay(60 + index * 45).springify(300).dampingRatio(0.8)}
      style={settleStyle}>
      {children}
    </Animated.View>
  );
}

/** Chip compacto de turno-tipo: tap = editar horas en el sheet existente. */
function ShiftChip({ shiftType, onPress }: { shiftType: ShiftType; onPress: () => void }) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Editar turno ${shiftType.label}${
        shiftType.kind === 'work' ? `, ${formatIntervals(shiftType.intervals)}` : ''
      }`}
      style={({ pressed }) => [
        styles.shiftChip,
        { borderColor: colors.border, backgroundColor: colors.surface },
        pressed && { backgroundColor: colors.backgroundElement },
      ]}>
      <View style={[styles.codeBadge, { borderColor: '#2E2E2E', backgroundColor: shiftType.color }]}>
        <Text style={styles.codeText}>{shiftType.code}</Text>
      </View>
      <Text style={[styles.shiftChipLabel, { color: colors.textSecondary }]} numberOfLines={1}>
        {shiftType.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: { flexDirection: 'row', gap: 6 },
  stepPill: {
    width: 22,
    height: 10,
    borderRadius: Radii.pill,
    borderWidth: BorderWidth,
  },
  stepPillActive: { width: 34 },
  tagHeader: {
    borderBottomWidth: BorderWidth,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  tagHeaderText: {
    fontSize: 13,
    fontFamily: Fonts.display,
    color: '#2E2E2E',
    letterSpacing: 2,
  },
  tagInput: {
    fontSize: 24,
    fontFamily: Fonts.display,
    textAlign: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  privacyCard: { padding: Spacing.three, gap: Spacing.two },
  privacyHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  privacyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: BorderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: BorderWidth,
    backgroundColor: '#FFFFFF88',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: { fontSize: 14, fontFamily: Fonts.display, color: '#2E2E2E' },
  shiftChip: {
    flex: 1,
    minHeight: 44,
    borderWidth: BorderWidth,
    borderRadius: Radii.inner,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  shiftChipLabel: { fontSize: 11, fontFamily: Fonts.bodyMedium },
});
