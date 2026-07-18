import { AppTabBar } from 'woflip';

// Mock estructural de React Navigation (la tab bar solo usa emit/navigate).
const routes = ['hoy', 'semana', 'equipo', 'cambios', 'perfil'].map((n) => ({ key: n, name: n }));
const navigation = {
  emit: () => ({ defaultPrevented: false }),
  navigate: () => {},
};

// La barra es position:absolute bottom — necesita un padre relative con alto.
const marco: React.CSSProperties = {
  position: 'relative',
  height: 110,
  width: 390,
};

export const InicioActivo = () => (
  <div style={marco}>
    <AppTabBar state={{ index: 0, routes }} navigation={navigation} />
  </div>
);

export const SemanaActiva = () => (
  <div style={marco}>
    <AppTabBar state={{ index: 1, routes }} navigation={navigation} />
  </div>
);
