export const ModelBadge = ({ model }: { model: 'CNN' | 'LSTM' | 'Hybrid' }) => {
  const color = {
    CNN: 'bg-neonBlue',
    LSTM: 'bg-neonViolet',
    Hybrid: 'bg-neonGreen',
  }[model];
  return <span className={`badge ${color}`}>{model}</span>;
};