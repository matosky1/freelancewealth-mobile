export const COLORS = {
  cream: '#F7F3EC',
  ink: '#1A1612',
  gold: '#C8963E',
  goldLight: '#E8B86D',
  rust: '#B85C38',
  sage: '#4A6741',
  sageLight: '#D4E0D2',
  muted: '#8A7E72',
  card: '#2A2520',
  border: '#3A3530',
  darkBg: '#221E1A',
  background: '#1A1612',
  textMuted: '#8A7E72',
};

export const FONTS = {
  regular: 'DM-Sans',
  medium: 'DM-Sans-Medium',
  mono: 'DM-Mono',
};

export const fmt = (n) =>
  '$' + (parseFloat(n) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
