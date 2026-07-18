import { Host, Switch } from '@expo/ui';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ShiftTypeEditorSheet } from '@/components/shift-type-editor-sheet';
import { Body, Caption, Heading, Title } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Field } from '@/components/ui/field';
import { HardCard } from '@/components/ui/hard-card';
import { PillButton } from '@/components/ui/pill-button';
import { Screen } from '@/components/ui/screen';
import { BorderWidth, Fonts } from '@/constants/theme';
import { useStoreVersion } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import { formatIntervals } from '@/lib/hours';
import { getMe, getShiftTypes, resetDemoData, updateMember } from '@/lib/store';
import type { ShiftType } from '@/lib/types';

/** Ajustes: nombre, foto de perfil, turnos-tipo, privacidad y datos de demo. */
export default function AjustesScreen() {
  useStoreVersion();
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
    <Screen>
      <Title>Ajustes</Title>

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
              <Caption color="secondary">Editar ›</Caption>
            </Pressable>
          ))}
        </HardCard>
      </View>

      <View style={{ gap: 4 }}>
        <Heading>Privacidad</Heading>
        <Host matchContents>
          <Switch
            value={me.shareFullSchedule}
            onValueChange={(v) => updateMember(me.id, { shareFullSchedule: v })}
            label="Mostrar mi horario completo al grupo"
          />
        </Host>
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
