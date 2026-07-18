import { Segmented } from 'woflip';

const col: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 8,
  maxWidth: 340,
};

export const DosOpciones = () => (
  <div style={col}>
    <Segmented
      options={[
        { value: 'semana', label: 'Semana' },
        { value: 'mes', label: 'Mes' },
      ]}
      value="semana"
      onChange={() => {}}
    />
  </div>
);

export const TresOpciones = () => (
  <div style={col}>
    <Segmented
      options={[
        { value: 'todos', label: 'Todos' },
        { value: 'libran', label: 'Libran hoy' },
        { value: 'trabajan', label: 'Trabajan' },
      ]}
      value="libran"
      onChange={() => {}}
    />
  </div>
);
