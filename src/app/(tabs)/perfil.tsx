import { Host, Switch } from '@expo/ui';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ShiftTypeEditorSheet } from '@/components/shift-type-editor-sheet';
import { Body, Caption, Heading, Title } from '@/components/ui/app-text';
import { HardCard } from '@/components/ui/hard-card';
import { PillButton } from '@/components/ui/pill-button';
import { Screen } from '@/components/ui/screen';
import { BorderWidth, Fonts } from '@/constants/theme';
import { useStoreVersion } from '@/hooks/use-store';
import { useTabFocused } from '@/hooks/use-tab-focused';
import { useTheme } from '@/hooks/use-theme';
import { monthOf, todayISO } from '@/lib/dates';
import { formatIntervals, monthHours } from '@/lib/hours';
import {
  getAssignments,
  getMe,
  getShiftTypes,
  getShiftTypesById,
  resetDemoData,
  updateMember,
} from '@/lib/store';
import type { ShiftType } from '@/lib/types';

/** Perfil: mis turnos-tipo, horas del mes y el opt-in de privacidad. */
export default function PerfilScreen() {
  useStoreVersion();
  const focused = useTabFocused();
  const colors = useTheme();
  const [editing, setEditing] = useState<ShiftType | null>(null);
  const me = getMe();
  const typesById = getShiftTypesById();
  const today = todayISO();
  const month = monthOf(today);
  const hours = monthHours(getAssignments(me.id, `${month}-01`, `${month}-31`), typesById, month);

  return (
    <Screen>
      <Title>Perfil</Title>

      {/* Horas del mes: la utilidad con N=1 (sin grupo también sirve) */}
      <HardCard color={colors.accent} contentStyle={{ padding: 16, gap: 2 }}>
        <Text style={{ fontSize: 13, fontFamily: Fonts.bodyBold, color: '#2E2E2E' }}>
          Este mes llevas
        </Text>
        <Text style={{ fontSize: 36, fontFamily: Fonts.display, color: '#2E2E2E' }}>
          {`${hours} horas`}
        </Text>
      </HardCard>

      <View style={{ gap: 8 }}>
        <Heading>Mis turnos-tipo</Heading>
        <HardCard shadowOffset={4} contentStyle={{ paddingVertical: 2 }}>
          {getShiftTypes().map((st, i) => (
            <Pressable
              key={st.id}
              onPress={() => setEditing(st)}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.backgroundElement,
                },
                pressed && { backgroundColor: colors.backgroundElement },
              ]}>
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
              <View style={{ flex: 1 }}>
                <Body style={{ fontFamily: Fonts.bodyMedium }}>{st.label}</Body>
                <Caption color="secondary">
                  {st.kind === 'rest' ? 'Día libre' : formatIntervals(st.intervals)}
                </Caption>
              </View>
              <Caption color="secondary">Editar ›</Caption>
            </Pressable>
          ))}
        </HardCard>
      </View>

      <View style={{ gap: 4 }}>
        {focused ? (
          <Host matchContents>
            <Switch
              value={me.shareFullSchedule}
              onValueChange={(v) => updateMember(me.id, { shareFullSchedule: v })}
              label="Mostrar mi horario completo al grupo"
            />
          </Host>
        ) : null}
        <Caption color="secondary">
          Apagado, el grupo solo ve si trabajas o libras cada día. Es tu decisión, no la del
          grupo.
        </Caption>
      </View>

      <PillButton variant="danger" label="Restablecer datos de demo" onPress={resetDemoData} />

      <ShiftTypeEditorSheet shiftType={editing} onDismiss={() => setEditing(null)} />
    </Screen>
  );
}
