import { ArrowRight01Icon, SquareLock02Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState, type PropsWithChildren } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ShiftTypeEditorSheet } from '@/components/shift-type-editor-sheet';
import { ThemeModePicker } from '@/components/theme-mode-picker';
import { Body, Caption, Heading, Title } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Field } from '@/components/ui/field';
import { HardCard } from '@/components/ui/hard-card';
import { PillButton } from '@/components/ui/pill-button';
import { Screen } from '@/components/ui/screen';
import { BorderWidth, Fonts, Spacing } from '@/constants/theme';
import { useStoreVersion } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { formatIntervals } from '@/lib/hours';
import { getMe, getShiftTypes, resetDemoData, updateMember } from '@/lib/store';
import type { ShiftType } from '@/lib/types';

/** Ajustes: nombre, foto de perfil, turnos-tipo, privacidad y datos de demo. */
export default function AjustesScreen() {
  useStoreVersion();
  const router = useRouter();
  const colors = useTheme();
  const me = getMe();
  const [editing, setEditing] = useState<ShiftType | null>(null);

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled) updateMember(me.id, { photoUri: res.assets[0].uri });
  }

  return (
    <Screen gap={Spacing.four}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <PillButton
          size="sm"
          icon="arrow-left"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
        />
        <Title>Ajustes</Title>
      </View>

      <View style={{ alignItems: 'center', gap: 12 }}>
        <Avatar name={me.name} photoUri={me.photoUri} size={96} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <PillButton size="sm" variant="accent" label="Cambiar foto" onPress={pickPhoto} />
          {me.photoUri ? (
            <PillButton
              size="sm"
              variant="ghost"
              label="Quitar foto"
              onPress={() => updateMember(me.id, { photoUri: undefined })}
            />
          ) : null}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Heading>Tu nombre</Heading>
        <Field
          defaultValue={me.name}
          placeholder="Tu nombre"
          onEndEditing={(e) => {
            const name = e.nativeEvent.text.trim();
            if (name) updateMember(me.id, { name });
          }}
        />
        <Caption color="secondary">Solo lo ve tu grupo. No hace falta tu nombre real.</Caption>
      </View>

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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Caption color="secondary">Editar</Caption>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={10}
                  color={colors.textSecondary}
                  strokeWidth={2}
                />
              </View>
            </Pressable>
          ))}
        </HardCard>
      </View>

      <View style={{ gap: Spacing.two }}>
        <Heading>Privacidad</Heading>
        <Caption color="secondary">¿Quién ve tu horario? Es tu decisión, no la del grupo.</Caption>
        <PrivacyCard
          icon={UserGroupIcon}
          title="Mi equipo"
          selected={me.shareFullSchedule}
          onPress={() => {
            haptics.selection();
            updateMember(me.id, { shareFullSchedule: true });
          }}>
          <Body color="secondary">Tus compañeros ven tus turnos y tus horas exactas.</Body>
        </PrivacyCard>
        <PrivacyCard
          icon={SquareLock02Icon}
          title="Solo yo"
          selected={!me.shareFullSchedule}
          onPress={() => {
            haptics.selection();
            updateMember(me.id, { shareFullSchedule: false });
          }}>
          <Body color="secondary">Nadie ve tus turnos ni tus horas.</Body>
          <Caption color="secondary">
            El emparejamiento ciego funciona igual: puedes pedir y ofrecer cambios sin enseñar tu
            horario a nadie.
          </Caption>
        </PrivacyCard>
      </View>

      <View style={{ gap: Spacing.two }}>
        <Heading>Tema</Heading>
        <ThemeModePicker />
      </View>

      <PillButton variant="danger" label="Restablecer datos de demo" onPress={resetDemoData} />

      <ShiftTypeEditorSheet shiftType={editing} onDismiss={() => setEditing(null)} />
    </Screen>
  );
}

/** Tarjeta de privacidad: mismo estilo que las del onboarding (paso 2). */
function PrivacyCard({
  icon,
  title,
  selected,
  onPress,
  children,
}: PropsWithChildren<{
  icon: typeof UserGroupIcon;
  title: string;
  selected: boolean;
  onPress: () => void;
}>) {
  const colors = useTheme();
  return (
    <HardCard
      onPress={onPress}
      shadowOffset={4}
      color={selected ? colors.backgroundSelected : undefined}
      pressedColor={colors.backgroundSelected}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected }}
      contentStyle={{ padding: Spacing.three, gap: Spacing.two }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: BorderWidth,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.accent,
            borderColor: colors.border,
          }}>
          <HugeiconsIcon icon={icon} size={20} color="#2E2E2E" strokeWidth={2} />
        </View>
        <Heading style={{ flex: 1 }}>{title}</Heading>
      </View>
      {children}
    </HardCard>
  );
}
