import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Text, View } from 'react-native';

import { Body, Caption, Heading, Title } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { HardCard } from '@/components/ui/hard-card';
import { Screen } from '@/components/ui/screen';
import { Palette } from '@/constants/palette';
import { BorderWidth, Fonts, Radii } from '@/constants/theme';
import { useStoreVersion } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import { addDaysISO, formatDayLong, formatDayShort, mondayOf, todayISO, weekDates } from '@/lib/dates';
import { effectiveIntervals, formatIntervals, weekHours } from '@/lib/hours';
import {
  getAllAssignments,
  getAssignment,
  getAssignments,
  getMe,
  getMembers,
  getShiftTypesById,
  listOffers,
  listRequests,
} from '@/lib/store';
import { buildTodayView } from '@/lib/today';

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function InicioScreen() {
  useStoreVersion();
  const colors = useTheme();
  const today = todayISO();
  const monday = mondayOf(today);
  const me = getMe();
  const typesById = getShiftTypesById();
  const assignment = getAssignment(me.id, today);
  const shift = assignment ? typesById[assignment.shiftTypeId] : undefined;
  const days = weekDates(monday);
  const team = buildTodayView(
    getMembers(),
    getAllAssignments(today, today),
    typesById,
    today,
  );
  const hours = weekHours(
    getAssignments(me.id, monday, addDaysISO(monday, 6)),
    typesById,
    monday,
  );
  const openOffers = listOffers().filter((offer) => offer.status === 'open').length;
  const pendingRequests = listRequests().filter(
    (request) => request.fromMemberId === me.id && request.status === 'pending',
  ).length;
  const nextAssignment = getAssignments(me.id, addDaysISO(today, 1), addDaysISO(today, 14)).find(
    (item) => typesById[item.shiftTypeId]?.kind === 'work',
  );

  const todayTitle = shift?.kind === 'work' ? shift.label : shift?.kind === 'rest' ? 'Día libre' : 'Sin turno';
  const todayHours = assignment && shift?.kind === 'work'
    ? formatIntervals(effectiveIntervals(assignment, typesById))
    : shift?.kind === 'rest'
      ? 'Disfruta del descanso'
      : 'Añádelo desde Mi semana';

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Image
          source={require('../../../assets/woflip-logo.svg')}
          contentFit="contain"
          style={{ width: 88, height: 30 }}
        />
        <View style={{ flex: 1 }} />
        <Avatar name={me.name} initial="T" photoUri={me.photoUri} size={42} />
      </View>

      <View style={{ gap: 3 }}>
        <Title>Hola, {me.name === 'Yo' ? '¿qué tal?' : me.name}</Title>
        <Caption color="secondary">{capitalize(formatDayLong(today))}</Caption>
      </View>

      <HardCard
        color={shift?.color ?? colors.backgroundSelected}
        shadowOffset={6}
        onPress={() => router.push('/(tabs)/semana')}
        contentStyle={{ padding: 18, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Caption style={{ color: '#2E2E2E', fontFamily: Fonts.bodyBold }}>TU TURNO DE HOY</Caption>
            <Text style={{ color: '#2E2E2E', fontFamily: Fonts.display, fontSize: 28 }}>
              {todayTitle}
            </Text>
            <Body style={{ color: '#2E2E2E', fontFamily: Fonts.bodyMedium }}>{todayHours}</Body>
          </View>
          <View style={{ backgroundColor: '#FFFFFF99', borderRadius: Radii.pill, paddingHorizontal: 11, paddingVertical: 6 }}>
            <Caption style={{ color: '#2E2E2E', fontFamily: Fonts.bodyBold }}>{hours} h</Caption>
          </View>
        </View>

        <View style={{ height: BorderWidth, backgroundColor: '#2E2E2E', opacity: 0.15 }} />

        <View style={{ flexDirection: 'row' }}>
          {days.map((date, index) => {
            const dayAssignment = getAssignment(me.id, date);
            const dayShift = dayAssignment ? typesById[dayAssignment.shiftTypeId] : undefined;
            const selected = date === today;
            return (
              <View key={date} style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 6 }}>
                <Text
                  style={{
                    color: selected ? '#2E2E2E' : '#6B6B66',
                    fontFamily: Fonts.bodyBold,
                    fontSize: 10,
                  }}>
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'][index]}
                </Text>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? '#2E2E2E' : 'transparent',
                  }}>
                  <Text
                    style={{
                      color: selected ? '#FAF9F5' : '#2E2E2E',
                      fontFamily: selected ? Fonts.display : Fonts.displaySemi,
                      fontSize: 15,
                    }}>
                    {Number(date.slice(8, 10))}
                  </Text>
                </View>
                <View
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 6,
                    borderWidth: BorderWidth,
                    borderColor: '#2E2E2E',
                    backgroundColor: dayShift?.color ?? 'transparent',
                    opacity: dayShift ? 1 : 0.3,
                  }}
                />
              </View>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Caption style={{ flex: 1, color: '#2E2E2E' }}>
            {nextAssignment
              ? `Próximo: ${formatDayShort(nextAssignment.date)} · ${typesById[nextAssignment.shiftTypeId]?.label}`
              : 'Mi semana'}
          </Caption>
          <Caption style={{ color: '#2E2E2E', fontFamily: Fonts.bodyBold }}>Editar</Caption>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right' }}
            size={12}
            tintColor="#2E2E2E"
          />
        </View>
      </HardCard>

      <View style={{ gap: 10 }}>
        <Heading>Accesos rápidos</Heading>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <QuickAction
            eyebrow="EQUIPO"
            value={`${team.working.length} trabajando`}
            detail={`${team.resting.length} libran hoy`}
            color={Palette.mint}
            icon={{ ios: 'person.2', android: 'groups' }}
            onPress={() => router.push('/(tabs)/equipo')}
          />
          <QuickAction
            eyebrow="CAMBIOS"
            value={openOffers ? `${openOffers} ${openOffers === 1 ? 'oferta' : 'ofertas'}` : 'Todo al día'}
            detail={pendingRequests ? `${pendingRequests} pendiente` : 'Sin pendientes'}
            color={Palette.sky}
            icon={{ ios: 'arrow.left.arrow.right', android: 'swap_horiz' }}
            onPress={() => router.push('/(tabs)/cambios')}
          />
        </View>
        <ActionRow
          title="Mi equipo"
          detail={team.unknownCount ? `${team.unknownCount} sin turno informado` : 'Todo el equipo ha informado su turno'}
          onPress={() => router.push('/(tabs)/equipo')}
        />
      </View>
    </Screen>
  );
}

function QuickAction({
  eyebrow,
  value,
  detail,
  color,
  icon,
  onPress,
}: {
  eyebrow: string;
  value: string;
  detail: string;
  color: string;
  icon:
    | { ios: 'person.2'; android: 'groups' }
    | { ios: 'arrow.left.arrow.right'; android: 'swap_horiz' };
  onPress: () => void;
}) {
  return (
    <HardCard color={color} onPress={onPress} shadowOffset={4} style={{ flex: 1 }} contentStyle={{ padding: 14, gap: 5, minHeight: 112 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <View
          style={{
            width: 29,
            height: 29,
            borderRadius: 9,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF99',
          }}>
          <SymbolView name={icon} size={17} tintColor="#2E2E2E" />
        </View>
        <Caption style={{ color: '#2E2E2E', fontFamily: Fonts.bodyBold }}>{eyebrow}</Caption>
      </View>
      <Heading style={{ color: '#2E2E2E' }}>{value}</Heading>
      <Caption style={{ color: '#2E2E2E' }}>{detail}</Caption>
    </HardCard>
  );
}

function ActionRow({ title, detail, onPress }: { title: string; detail: string; onPress: () => void }) {
  const colors = useTheme();
  return (
    <HardCard
      onPress={onPress}
      shadowOffset={3}
      contentStyle={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Body style={{ fontFamily: Fonts.bodyBold }}>{title}</Body>
          <Caption color="secondary">{detail}</Caption>
        </View>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right' }}
          size={20}
          tintColor={colors.textSecondary}
        />
    </HardCard>
  );
}
