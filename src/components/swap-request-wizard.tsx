import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Pressable, Text, View } from 'react-native';

import { DateTile } from '@/components/date-tile';
import { TwoWeekGrid } from '@/components/two-week-grid';
import { Body, Caption, Heading } from '@/components/ui/app-text';
import { HardCard } from '@/components/ui/hard-card';
import { PillButton } from '@/components/ui/pill-button';
import { useState } from 'react';

import { Fonts, Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDaysISO, formatDayLong, todayISO } from '@/lib/dates';
import { effectiveIntervals, formatIntervals } from '@/lib/hours';
import {
  computeCandidates,
  createRequest,
  getAssignments,
  getMe,
  getRequestsThisWeek,
  getShiftTypesById,
} from '@/lib/store';
import type { Assignment, SwapRequestMode } from '@/lib/types';

const SOFT_WEEKLY_LIMIT = 3;

/**
 * Wizard ciego de 3 pasos (adaptado del RequestSwapModal de Woblip):
 * ① qué turno mío cedo → ② qué quiero a cambio → ③ nº de compatibles
 * (NUNCA nombres) y envío de la propuesta ciega.
 */
export function SwapRequestWizard({ onSent }: { onSent: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [shift, setShift] = useState<Assignment | null>(null);
  const [mode, setMode] = useState<SwapRequestMode | null>(null);

  const me = getMe();
  const typesById = getShiftTypesById();
  const today = todayISO();
  // Mis turnos de trabajo de los próximos 14 días (futuros: fecha > hoy).
  const myShifts = getAssignments(me.id, addDaysISO(today, 1), addDaysISO(today, 14)).filter(
    (a) => typesById[a.shiftTypeId]?.kind === 'work',
  );

  const requestsThisWeek = getRequestsThisWeek();

  function describeShift(a: Assignment): string {
    const type = typesById[a.shiftTypeId];
    return `${type?.label ?? ''} (${formatIntervals(effectiveIntervals(a, typesById))})`;
  }

  return (
    <View style={{ gap: 12 }}>
      <StepDots step={step} />

      {step === 1 ? (
        <View style={{ gap: 8 }}>
          <Heading>¿Qué turno tuyo cedes?</Heading>
          <Caption color="secondary">Toca un día con turno.</Caption>
          <TwoWeekGrid
            memberId={me.id}
            selectedDate={shift?.date}
            canSelect={(d, a, t) => d > today && !!a && t?.kind === 'work'}
            onSelectDay={(_, a) => {
              setShift(a);
              setStep(2);
            }}
          />
          {myShifts.length === 0 ? (
            <Caption color="secondary">
              No tienes turnos en los próximos 14 días. Mete tu semana primero.
            </Caption>
          ) : null}
        </View>
      ) : null}

      {step === 2 && shift ? (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <DateTile size="sm" date={shift.date} shiftType={typesById[shift.shiftTypeId]} />
            <View style={{ flex: 1 }}>
              <Body style={{ fontFamily: Fonts.bodyBold }}>
                {typesById[shift.shiftTypeId]?.label ?? ''}
              </Body>
              <Caption color="secondary">
                {formatIntervals(effectiveIntervals(shift, typesById))}
              </Caption>
            </View>
          </View>
          <Body>¿Qué quieres conseguir?</Body>
          <HardCard shadowOffset={4} contentStyle={{ paddingVertical: 2 }}>
            <RowItem
              first
              title="Librar ese día"
              subtitle="A cambio trabajarás un día que ahora libras"
              onPress={() => {
                setMode('rest_day');
                setStep(3);
              }}
            />
            <RowItem
              title="Cambiar de franja ese día"
              subtitle="Mismo día, otro horario (ej. mañana por tarde)"
              onPress={() => {
                setMode('change_slot');
                setStep(3);
              }}
            />
          </HardCard>
          <View style={{ flexDirection: 'row' }}>
            <PillButton size="sm" icon="arrow-left" label="Atrás" onPress={() => setStep(1)} />
          </View>
        </View>
      ) : null}

      {step === 3 && shift && mode ? (
        <ResultStep
          shift={shift}
          mode={mode}
          softLimitReached={requestsThisWeek >= SOFT_WEEKLY_LIMIT}
          describe={describeShift(shift)}
          onBack={() => setStep(2)}
          onSent={onSent}
        />
      ) : null}
    </View>
  );
}

/** Indicador de progreso: ● ● ● con el paso actual en lavanda. */
function StepDots({ step }: { step: 1 | 2 | 3 }) {
  const colors = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {([1, 2, 3] as const).map((s) => (
        <View
          key={s}
          style={{
            width: s === step ? 22 : 10,
            height: 10,
            borderRadius: Radii.pill,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: s <= step ? colors.accent : colors.backgroundElement,
          }}
        />
      ))}
      <Caption color="secondary" style={{ marginLeft: 4 }}>{`Paso ${step} de 3`}</Caption>
    </View>
  );
}

/** Fila tocable de lista dentro de una HardCard. */
function RowItem({
  title,
  subtitle,
  onPress,
  first = false,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
  first?: boolean;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderTopWidth: first ? 0 : 1,
          borderTopColor: colors.backgroundElement,
        },
        pressed && { backgroundColor: colors.backgroundElement },
      ]}>
      <View style={{ flex: 1 }}>
        <Body style={{ fontFamily: Fonts.bodyMedium }}>{title}</Body>
        {subtitle ? <Caption color="secondary">{subtitle}</Caption> : null}
      </View>
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        size={14}
        color={colors.textSecondary}
        strokeWidth={2}
      />
    </Pressable>
  );
}

function ResultStep({
  shift,
  mode,
  softLimitReached,
  describe,
  onBack,
  onSent,
}: {
  shift: Assignment;
  mode: SwapRequestMode;
  softLimitReached: boolean;
  describe: string;
  onBack: () => void;
  onSent: () => void;
}) {
  const colors = useTheme();
  // El motor corre EN LOCAL; la UI solo enseña el número (matching ciego).
  const count = new Set(computeCandidates(shift.id, mode).map((c) => c.memberId)).size;

  function send() {
    createRequest(shift.id, mode);
    onSent();
  }

  if (count === 0) {
    return (
      <View style={{ gap: 10 }}>
        <Heading>Nadie encaja con ese cambio ahora mismo 😕</Heading>
        <Caption color="secondary">
          Nadie puede cubrirlo cumpliendo los descansos (12 h entre jornadas, máximo 6 días
          seguidos). Prueba con otro turno u otra opción — o anima al grupo a meter su semana.
        </Caption>
        <View style={{ flexDirection: 'row' }}>
          <PillButton size="sm" icon="arrow-left" label="Probar otra opción" onPress={onBack} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <HardCard color={colors.accent} contentStyle={{ padding: 16, gap: 2 }}>
        <Text style={{ fontSize: 32, fontFamily: Fonts.display, color: '#2E2E2E' }}>
          {`${count} ${count === 1 ? 'compañero' : 'compañeros'}`}
        </Text>
        <Text style={{ fontSize: 15, fontFamily: Fonts.bodyBold, color: '#2E2E2E' }}>
          {count === 1 ? 'compatible con tu cambio' : 'compatibles con tu cambio'}
        </Text>
      </HardCard>
      <Caption color="secondary">
        No verás quiénes son: la propuesta es ciega y su identidad solo se revela si alguien acepta.
      </Caption>
      <HardCard shadowOffset={4} contentStyle={{ padding: 14, gap: 8 }}>
        <Caption style={{ fontFamily: Fonts.bodyBold }}>Tu parte del cambio</Caption>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <DateTile
            size="sm"
            date={shift.date}
            shiftType={getShiftTypesById()[shift.shiftTypeId]}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Body>{`Cedes: ${describe}`}</Body>
            <Body>
              {mode === 'rest_day'
                ? `Libras el ${formatDayLong(shift.date)} y trabajas un día que ahora libras`
                : `Sigues trabajando el ${formatDayLong(shift.date)}, en otra franja`}
            </Body>
          </View>
        </View>
      </HardCard>
      {softLimitReached ? (
        <Caption color={colors.danger}>
          Ya has enviado varias propuestas esta semana. El límite evita sondear horarios ajenos.
        </Caption>
      ) : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <PillButton size="sm" icon="arrow-left" label="Atrás" onPress={onBack} />
        <PillButton variant="primary" label="Enviar propuesta ciega" onPress={send} />
      </View>
    </View>
  );
}
