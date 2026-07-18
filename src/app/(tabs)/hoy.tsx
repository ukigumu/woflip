import { ArrowRight01Icon, Exchange01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Body, Caption, Heading, Hero, Title } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { HardCard } from '@/components/ui/hard-card';
import { Screen } from '@/components/ui/screen';
import { Palette } from '@/constants/palette';
import { BorderWidth, Fonts, Radii } from '@/constants/theme';
import { useStoreVersion } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import {
  addDaysISO,
  formatDayLong,
  formatDayShort,
  mondayOf,
  todayISO,
  weekDates,
} from '@/lib/dates';
import { effectiveIntervals, formatIntervals, intervalsTotalMinutes } from '@/lib/hours';
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
  const team = buildTodayView(getMembers(), getAllAssignments(today, today), typesById, today);
  const openOffers = listOffers().filter((offer) => offer.status === 'open').length;
  const pendingRequests = listRequests().filter(
    (request) => request.fromMemberId === me.id && request.status === 'pending',
  ).length;
  const nextAssignment = getAssignments(me.id, addDaysISO(today, 1), addDaysISO(today, 14)).find(
    (item) => typesById[item.shiftTypeId]?.kind === 'work',
  );

  const todayTitle =
    shift?.kind === 'work' ? shift.label : shift?.kind === 'rest' ? 'Día libre' : 'Sin turno';
  const todayIntervals =
    assignment && shift?.kind === 'work' ? effectiveIntervals(assignment, typesById) : [];
  const todayHoursCount = Math.round((intervalsTotalMinutes(todayIntervals) / 60) * 10) / 10;
  const todayHours = todayIntervals.length
    ? formatIntervals(todayIntervals)
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
        color={shift?.color ?? '#E8E6DD'}
        shadowOffset={6}
        onPress={() => router.push('/(tabs)/semana')}
        contentStyle={{ padding: 18, gap: 6, minHeight: 150, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Caption style={{ flex: 1, color: '#2E2E2E', fontFamily: Fonts.bodyBold }}>
            TU TURNO DE HOY
          </Caption>
          {todayHoursCount > 0 ? (
            <View
              style={{
                backgroundColor: '#FFFFFF99',
                borderRadius: Radii.pill,
                paddingHorizontal: 11,
                paddingVertical: 6,
              }}>
              <Caption style={{ color: '#2E2E2E', fontFamily: Fonts.bodyBold }}>
                {todayHoursCount} h
              </Caption>
            </View>
          ) : null}
        </View>
        <Hero style={{ color: '#2E2E2E' }}>{todayTitle}</Hero>
        <Body style={{ color: '#2E2E2E', fontFamily: Fonts.bodyMedium }}>{todayHours}</Body>
      </HardCard>

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Heading style={{ flex: 1 }}>Mi semana</Heading>
          <Pressable
            onPress={() => router.push('/(tabs)/semana')}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Caption style={{ fontFamily: Fonts.bodyBold }}>Editar</Caption>
            <HugeiconsIcon icon={ArrowRight01Icon} size={12} color={colors.text} strokeWidth={2} />
          </Pressable>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/semana')}
          style={{ flexDirection: 'row', gap: 6 }}>
          {days.map((date, index) => {
            const dayAssignment = getAssignment(me.id, date);
            const dayShift = dayAssignment ? typesById[dayAssignment.shiftTypeId] : undefined;
            const selected = date === today;
            return (
              <View key={date} style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 6 }}>
                <Text
                  style={{
                    color: selected ? colors.text : colors.textSecondary,
                    fontFamily: Fonts.bodyBold,
                    fontSize: 10,
                  }}>
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'][index]}
                </Text>
                <View style={{ alignSelf: 'stretch', paddingRight: 3, paddingBottom: 3 }}>
                  {selected ? (
                    <View
                      style={{
                        position: 'absolute',
                        top: 3,
                        left: 3,
                        right: 0,
                        bottom: 0,
                        borderRadius: Radii.inner,
                        backgroundColor: colors.shadow,
                      }}
                    />
                  ) : null}
                  <View
                    style={{
                      height: 46,
                      borderRadius: Radii.inner,
                      borderWidth: BorderWidth,
                      borderStyle: dayShift ? 'solid' : 'dashed',
                      borderColor: dayShift ? colors.border : colors.textSecondary,
                      backgroundColor: dayShift?.color ?? colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text
                      style={{
                        color: dayShift ? '#2E2E2E' : colors.textSecondary,
                        fontFamily: selected ? Fonts.display : Fonts.displaySemi,
                        fontSize: 16,
                      }}>
                      {Number(date.slice(8, 10))}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </Pressable>
        {nextAssignment ? (
          <Caption color="secondary">
            Próximo turno: {formatDayShort(nextAssignment.date)} ·{' '}
            {typesById[nextAssignment.shiftTypeId]?.label}
          </Caption>
        ) : null}
      </View>

      <View style={{ gap: 10 }}>
        <Heading>Accesos rápidos</Heading>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <QuickAction
            eyebrow="EQUIPO"
            value={`${team.working.length} trabajando`}
            detail={
              team.unknownCount
                ? `${team.unknownCount} sin turno informado`
                : `${team.resting.length} libran hoy`
            }
            color={Palette.mint}
            icon={UserGroupIcon}
            onPress={() => router.push('/(tabs)/equipo')}
          />
          <QuickAction
            eyebrow="CAMBIOS"
            value={
              openOffers
                ? `${openOffers} ${openOffers === 1 ? 'oferta' : 'ofertas'}`
                : 'Todo al día'
            }
            detail={pendingRequests ? `${pendingRequests} pendiente` : 'Sin pendientes'}
            color={Palette.sky}
            icon={Exchange01Icon}
            onPress={() => router.push('/(tabs)/cambios')}
          />
        </View>
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
  icon: typeof UserGroupIcon;
  onPress: () => void;
}) {
  return (
    <HardCard
      color={color}
      onPress={onPress}
      shadowOffset={4}
      style={{ flex: 1 }}
      contentStyle={{ padding: 14, gap: 5, minHeight: 112 }}>
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
          <HugeiconsIcon icon={icon} size={17} color="#2E2E2E" strokeWidth={2} />
        </View>
        <Caption style={{ color: '#2E2E2E', fontFamily: Fonts.bodyBold }}>{eyebrow}</Caption>
      </View>
      <Heading style={{ color: '#2E2E2E' }}>{value}</Heading>
      <Caption style={{ color: '#2E2E2E' }}>{detail}</Caption>
    </HardCard>
  );
}
