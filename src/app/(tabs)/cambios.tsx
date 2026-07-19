import { useState } from 'react';
import { View } from 'react-native';

import { DateTile } from '@/components/date-tile';
import { SwapRequestWizard } from '@/components/swap-request-wizard';
import { TwoWeekGrid } from '@/components/two-week-grid';
import { AppHeader } from '@/components/ui/app-header';
import { Body, Caption, Heading, Title } from '@/components/ui/app-text';
import { HardCard } from '@/components/ui/hard-card';
import { PillButton } from '@/components/ui/pill-button';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { Sheet } from '@/components/ui/sheet';
import { Palette } from '@/constants/palette';
import { Fonts } from '@/constants/theme';
import { useStoreVersion } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import { addDaysISO, todayISO } from '@/lib/dates';
import { effectiveIntervals, formatIntervals } from '@/lib/hours';
import {
  cancelOffer,
  cancelRequest,
  createOffer,
  getAssignments,
  getMe,
  getMembers,
  getShiftTypesById,
  listOffers,
  listRequests,
  simulateResponse,
  takeOffer,
} from '@/lib/store';
import type { Assignment, SwapRequest } from '@/lib/types';

/** Cambios: ofertas broadcast (con nombre) + peticiones con matching ciego. */
export default function CambiosScreen() {
  useStoreVersion();
  const [tab, setTab] = useState<'offers' | 'request'>('offers');

  return (
    <Screen>
      <AppHeader title="Cambios" />
      <Segmented
        options={[
          { value: 'offers', label: 'Ofertas' },
          { value: 'request', label: 'Pedir cambio' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'offers' ? <OffersTab /> : <RequestTab />}
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Ofertas broadcast
// ---------------------------------------------------------------------------

function OffersTab() {
  const [choosing, setChoosing] = useState(false);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const colors = useTheme();
  const me = getMe();
  const typesById = getShiftTypesById();
  const today = todayISO();
  const memberNames = Object.fromEntries(getMembers().map((m) => [m.id, m.name]));

  const offers = listOffers().filter((o) => o.date > today);
  const myShifts = getAssignments(me.id, addDaysISO(today, 1), addDaysISO(today, 14)).filter(
    (a) => typesById[a.shiftTypeId]?.kind === 'work',
  );

  function dismissSheet() {
    setChoosing(false);
    setSelected(null);
  }

  return (
    <View style={{ gap: 12 }}>
      <PillButton variant="primary" label="Ofrecer un turno" onPress={() => setChoosing(true)} />
      <Caption color="secondary">
        El turno que ofrezcas lo puede coger cualquiera del grupo. Funciona aunque los demás no
        hayan metido su horario.
      </Caption>

      {offers.length === 0 ? (
        <Caption color="secondary">No hay turnos ofrecidos ahora</Caption>
      ) : (
        offers.map((o) => {
          const mine = o.fromMemberId === me.id;
          return (
            <HardCard
              key={o.id}
              shadowOffset={4}
              color={mine ? colors.backgroundSelected : undefined}
              contentStyle={{ padding: 12, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <DateTile date={o.date} shiftType={typesById[o.shiftTypeId]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Body style={{ fontFamily: Fonts.bodyBold }}>
                    {mine ? 'Tú ofreces' : `${memberNames[o.fromMemberId] ?? '¿?'} ofrece`}
                  </Body>
                  <Caption color="secondary">{typesById[o.shiftTypeId]?.label ?? ''}</Caption>
                  {o.note ? <Caption color="secondary">{o.note}</Caption> : null}
                </View>
              </View>
              {o.status === 'open' ? (
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  {mine ? (
                    <PillButton size="sm" label="Cancelar" onPress={() => cancelOffer(o.id)} />
                  ) : (
                    <PillButton
                      size="sm"
                      variant="accent"
                      label="Me lo quedo"
                      onPress={() => takeOffer(o.id, me.id)}
                    />
                  )}
                </View>
              ) : (
                <Caption color="secondary">
                  {o.status === 'taken'
                    ? `Se lo queda ${memberNames[o.takenByMemberId ?? ''] ?? 'alguien'}`
                    : 'Cancelada'}
                </Caption>
              )}
            </HardCard>
          );
        })
      )}

      {/* Selector de turno propio a ofrecer */}
      <Sheet visible={choosing} onDismiss={dismissSheet}>
        <Heading>¿Qué turno ofreces?</Heading>
        <Caption color="secondary">
          Toca un día con turno. Los días de descanso o sin turno no se pueden ofrecer.
        </Caption>
        <TwoWeekGrid
          memberId={me.id}
          selectedDate={selected?.date}
          canSelect={(d, a, t) => d > today && !!a && t?.kind === 'work'}
          onSelectDay={(_, a) => setSelected(a)}
        />
        {myShifts.length === 0 ? (
          <Caption color="secondary">
            No tienes turnos próximos que ofrecer. Mete tu semana primero.
          </Caption>
        ) : selected ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <DateTile date={selected.date} shiftType={typesById[selected.shiftTypeId]} />
            <View style={{ flex: 1 }}>
              <Body style={{ fontFamily: Fonts.bodyBold }}>
                {typesById[selected.shiftTypeId]?.label ?? ''}
              </Body>
              <Caption color="secondary">
                {formatIntervals(effectiveIntervals(selected, typesById))}
              </Caption>
            </View>
          </View>
        ) : null}
        {selected ? (
          <PillButton
            variant="primary"
            label="Ofrecer este turno"
            onPress={() => {
              createOffer(selected.id);
              dismissSheet();
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Pedir cambio (matching ciego)
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<SwapRequest['status'], string> = {
  pending: 'Esperando respuesta',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
};

function RequestTab() {
  const colors = useTheme();
  const memberNames = Object.fromEntries(getMembers().map((m) => [m.id, m.name]));
  const me = getMe();
  const requests = listRequests().filter((r) => r.fromMemberId === me.id);
  const active = requests.find((r) => r.status === 'pending');
  const history = requests.filter((r) => r.status !== 'pending');
  // Fuerza remontar el wizard tras enviar/cancelar (vuelve al paso 1 limpio).
  const [wizardKey, setWizardKey] = useState(0);
  // Resultado de la simulación: se muestra aunque la petición ya no esté pendiente.
  const [lastResult, setLastResult] = useState<SwapRequest | null>(null);

  const statusColor: Record<SwapRequest['status'], string> = {
    pending: colors.warning,
    accepted: colors.success,
    rejected: colors.danger,
    cancelled: colors.textSecondary,
  };

  return (
    <View style={{ gap: 14 }}>
      {active ? (
        <ActiveRequestCard request={active} onResult={setLastResult} />
      ) : lastResult ? (
        <ResultCard
          result={lastResult}
          memberNames={memberNames}
          onDismiss={() => {
            setLastResult(null);
            setWizardKey((k) => k + 1);
          }}
        />
      ) : (
        <SwapRequestWizard key={wizardKey} onSent={() => setWizardKey((k) => k + 1)} />
      )}

      {history.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Heading>Historial</Heading>
          <HardCard shadowOffset={4} contentStyle={{ paddingVertical: 4 }}>
            {history.map((r, i) => (
              <View
                key={r.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.backgroundElement,
                }}>
                <DateTile size="sm" date={r.targetDate} />
                <View style={{ flex: 1 }}>
                  <Body style={{ fontFamily: Fonts.bodyMedium }}>
                    {r.mode === 'rest_day' ? 'Librar' : 'Cambiar franja'}
                  </Body>
                  {r.status === 'accepted' && r.acceptedByMemberId ? (
                    <Caption color="secondary">
                      {`Aceptó ${memberNames[r.acceptedByMemberId] ?? '¿?'}`}
                    </Caption>
                  ) : null}
                </View>
                <Caption color={statusColor[r.status]}>{STATUS_LABEL[r.status]}</Caption>
              </View>
            ))}
          </HardCard>
        </View>
      ) : null}
    </View>
  );
}

function ActiveRequestCard({
  request,
  onResult,
}: {
  request: SwapRequest;
  onResult: (result: SwapRequest | null) => void;
}) {
  const count = request.candidateMemberIds.length;

  return (
    <HardCard color={Palette.sun} contentStyle={{ padding: 14, gap: 8 }}>
      <Heading style={{ color: '#2E2E2E' }}>Propuesta enviada</Heading>
      <Body style={{ color: '#2E2E2E' }}>
        {`${count} ${count === 1 ? 'compañero compatible la ha recibido' : 'compañeros compatibles la han recibido'}. Sin nombres hasta que alguien acepte.`}
      </Body>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <PillButton size="sm" label="Cancelar" onPress={() => cancelRequest(request.id)} />
        <PillButton
          size="sm"
          variant="primary"
          label="Simular respuesta (demo)"
          onPress={() => onResult(simulateResponse(request.id) ?? null)}
        />
      </View>
    </HardCard>
  );
}

function ResultCard({
  result,
  memberNames,
  onDismiss,
}: {
  result: SwapRequest;
  memberNames: Record<string, string>;
  onDismiss: () => void;
}) {
  if (result.status === 'accepted' && result.acceptedByMemberId) {
    // Identidad revelada SOLO tras aceptar.
    return (
      <HardCard color={Palette.mint} contentStyle={{ padding: 16, gap: 8 }}>
        <Title style={{ color: '#2E2E2E' }}>
          {`¡${memberNames[result.acceptedByMemberId] ?? 'Alguien'} ha aceptado!`}
        </Title>
        <Body style={{ color: '#2E2E2E' }}>
          El cambio ya está aplicado: revisa tu semana. Enseña este acuerdo a tu encargado si lo
          necesitas.
        </Body>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <PillButton size="sm" variant="primary" label="Entendido" onPress={onDismiss} />
        </View>
      </HardCard>
    );
  }

  return (
    <HardCard shadowOffset={4} contentStyle={{ padding: 14, gap: 8 }}>
      <Heading>Nadie ha aceptado esta vez 😔</Heading>
      <Caption color="secondary">Puedes intentarlo con otro turno u otra opción.</Caption>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <PillButton size="sm" label="Volver a intentar" onPress={onDismiss} />
      </View>
    </HardCard>
  );
}
