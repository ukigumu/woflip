// Shim web de expo-image para el bundle de design-sync: en la app solo se usa
// <Image source={{ uri }} style={…}> (avatar), que la Image de react-native-web
// cubre 1:1. expo-image real requiere resolución .web.js de Metro.
export { Image } from 'react-native';
