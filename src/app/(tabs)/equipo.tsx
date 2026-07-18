import { View } from 'react-native';

import { Body, Caption, Heading, Title } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { HardCard } from '@/components/ui/hard-card';
import { Screen } from '@/components/ui/screen';
import { Fonts } from '@/constants/theme';
import { useStoreVersion } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import { formatDayLong, todayISO } from '@/lib/dates';
import { getAllAssignments, getMembers, getShiftTypesById } from '@/lib/store';
import { buildTodayView, type TodayEntry } from '@/lib/today';

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function EquipoScreen() {
  useStoreVersion();
  const today = todayISO();
  const view = buildTodayView(getMembers(), getAllAssignments(today, today), getShiftTypesById(), today);

  return (
    <Screen>
      <View style={{ gap: 2 }}>
        <Title>Mi equipo</Title>
        <Caption color="secondary">{capitalize(formatDayLong(today))}</Caption>
      </View>
      <Section title="Trabajan hoy" entries={view.working} emptyText="Nadie por ahora" />
      <Section title="Libran hoy" entries={view.resting} emptyText="Hoy trabaja todo el mundo" />
      {view.unknownCount > 0 ? (
        <Caption color="secondary">
          {`${view.unknownCount} ${view.unknownCount === 1 ? 'compañero no ha metido' : 'compañeros no han metido'} su turno de hoy`}
        </Caption>
      ) : null}
    </Screen>
  );
}

function Section({ title, entries, emptyText }: { title: string; entries: TodayEntry[]; emptyText: string }) {
  const colors = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Heading>{title}</Heading>
      {entries.length === 0 ? <Caption color="secondary">{emptyText}</Caption> : (
        <HardCard shadowOffset={4} contentStyle={{ paddingVertical: 4 }}>
          {entries.map((entry, index) => (
            <View key={entry.memberId} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: colors.backgroundElement }}>
              <Avatar name={entry.name} initial={entry.isMe ? 'T' : undefined} />
              <View style={{ flex: 1 }}>
                <Body style={{ fontFamily: Fonts.bodyMedium }}>{entry.isMe ? 'Tú' : entry.name}</Body>
                {entry.visibleHours ? <Caption color="secondary">{entry.visibleHours}</Caption> : null}
              </View>
            </View>
          ))}
        </HardCard>
      )}
    </View>
  );
}
