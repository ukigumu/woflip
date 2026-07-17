import { Text, View } from 'react-native';

import { Body, Caption, Heading, Title } from '@/components/ui/app-text';
import { HardCard } from '@/components/ui/hard-card';
import { Screen } from '@/components/ui/screen';
import { Palette } from '@/constants/palette';
import { BorderWidth, Fonts } from '@/constants/theme';
import { useStoreVersion } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import { formatDayLong, todayISO } from '@/lib/dates';
import { getAllAssignments, getMembers, getShiftTypesById } from '@/lib/store';
import { buildTodayView, type TodayEntry } from '@/lib/today';

/** Colores de avatar por inicial (deterministas, de la paleta sticker). */
const AVATAR_COLORS = [Palette.sun, Palette.primary, Palette.coral, Palette.sky, Palette.mint];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function avatarColor(name: string): string {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

/**
 * Quién trabaja / libra hoy. SOLO nombres y estado: las horas de los demás
 * no se muestran salvo opt-in individual (regla aplicada en lib/today.ts).
 */
export default function HoyScreen() {
  useStoreVersion();
  const today = todayISO();
  const view = buildTodayView(
    getMembers(),
    getAllAssignments(today, today),
    getShiftTypesById(),
    today,
  );

  return (
    <Screen>
      <Title>{capitalize(formatDayLong(today))}</Title>

      <Section title="Trabajan hoy" entries={view.working} emptyText="Nadie por ahora 🦥" />
      <Section title="Libran hoy" entries={view.resting} emptyText="Hoy trabaja todo el mundo 💪" />

      {view.unknownCount > 0 ? (
        <Caption color="secondary">
          {`${view.unknownCount} ${view.unknownCount === 1 ? 'compañero no ha metido' : 'compañeros no han metido'} su turno de hoy`}
        </Caption>
      ) : null}
    </Screen>
  );
}

function Section({
  title,
  entries,
  emptyText,
}: {
  title: string;
  entries: TodayEntry[];
  emptyText: string;
}) {
  const colors = useTheme();

  return (
    <View style={{ gap: 8 }}>
      <Heading>{title}</Heading>
      {entries.length === 0 ? (
        <Caption color="secondary">{emptyText}</Caption>
      ) : (
        <HardCard shadowOffset={4} contentStyle={{ paddingVertical: 4 }}>
          {entries.map((e, i) => (
            <View
              key={e.memberId}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: colors.backgroundElement,
              }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  borderWidth: BorderWidth,
                  borderColor: '#2E2E2E',
                  backgroundColor: avatarColor(e.name),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{ fontSize: 14, fontFamily: Fonts.display, color: '#2E2E2E' }}>
                  {(e.isMe ? 'T' : e.name[0] ?? '?').toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Body style={{ fontFamily: Fonts.bodyMedium }}>{e.isMe ? 'Tú' : e.name}</Body>
                {e.visibleHours ? <Caption color="secondary">{e.visibleHours}</Caption> : null}
              </View>
            </View>
          ))}
        </HardCard>
      )}
    </View>
  );
}
