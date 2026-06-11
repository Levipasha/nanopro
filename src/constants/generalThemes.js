export const GENERAL_THEMES = [
  { id: 'custom-theme', label: 'Profile Signature', name: 'Signature', desc: 'Your current profile colors', bg: '#F7F3EE', text: '#0A0A0A', linkBg: '#C8001A', isDark: false, palette: 'linear-gradient(135deg, #C8001A 33%, #0A0A0A 33%, #0A0A0A 66%, #F7F3EE 66%)' }
];

export const getThemeById = (id) => GENERAL_THEMES.find(t => t.id === id) || GENERAL_THEMES[0];

export const AVAILABLE_FONTS = [
  { id: 'outfit', label: 'Outfit', desc: 'Modern & Geometric', sample: 'The quick brown fox', family: "'Outfit', sans-serif" }
];

export const resolveFontFamily = (fontId) => {
  const font = AVAILABLE_FONTS.find(f => f.id === fontId);
  return font ? font.family : "'Outfit', sans-serif";
};

