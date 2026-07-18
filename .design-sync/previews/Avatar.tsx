import { Avatar } from 'woflip';

const fila: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: 8,
};

// Foto de ejemplo autocontenida (sin red): un svg base64 con fondo lavanda.
const FOTO = `data:image/svg+xml;base64,${btoa(
  "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='#D7BDF6'/><circle cx='32' cy='24' r='12' fill='#2E2E2E'/><rect x='12' y='40' width='40' height='24' rx='12' fill='#2E2E2E'/></svg>",
)}`;

export const Equipo = () => (
  <div style={fila}>
    <Avatar name="María" />
    <Avatar name="Carlos" />
    <Avatar name="Lucía" />
    <Avatar name="Andrés" />
    <Avatar name="Tú" initial="T" />
  </div>
);

export const Tamanos = () => (
  <div style={fila}>
    <Avatar name="María" size={24} />
    <Avatar name="María" size={32} />
    <Avatar name="María" size={48} />
    <Avatar name="María" size={64} />
  </div>
);

export const ConFoto = () => (
  <div style={fila}>
    <Avatar name="Lucía" photoUri={FOTO} size={48} />
    <Avatar name="Lucía" size={48} />
  </div>
);
