import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { Palette } from '@/constants/palette';
import { BorderWidth, Fonts } from '@/constants/theme';

/** Colores de avatar por inicial (deterministas, de la paleta sticker). */
const AVATAR_COLORS = [Palette.sun, Palette.primary, Palette.coral, Palette.sky, Palette.mint];

function avatarColor(name: string): string {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

interface Props {
  /** Nombre real: determina el color aunque se muestre otra inicial. */
  name: string;
  /** Inicial a mostrar (p. ej. 'T' de "Tú" para isMe). Default: name[0]. */
  initial?: string;
  /** Foto de perfil; si existe sustituye a la inicial. */
  photoUri?: string;
  size?: number;
}

/** Avatar circular: foto si la hay, si no inicial con color determinista y borde ink. */
export function Avatar({ name, initial, photoUri, size = 32 }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: BorderWidth,
        borderColor: '#2E2E2E',
        backgroundColor: avatarColor(name),
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} />
      ) : (
        <Text
          style={{
            fontSize: Math.round(size * 0.44),
            fontFamily: Fonts.display,
            color: '#2E2E2E',
          }}>
          {(initial ?? name[0] ?? '?').toUpperCase()}
        </Text>
      )}
    </View>
  );
}
