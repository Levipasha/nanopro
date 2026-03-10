export const GENERAL_THEMES = [
  { id: 'mint', label: 'Mint', name: 'James Willson', desc: 'Company owner', bg: 'linear-gradient(135deg,#7dd3b0,#a8e6cf)', text: '#2d5a4a', linkBg: 'rgba(255,255,255,0.5)' },
  { id: 'mono', label: 'Mono Dark', name: 'Jesse Jordan', desc: 'Rockstar, Activist', bg: '#0f172a', text: '#fff', linkBg: 'rgba(255,255,255,0.08)' },
  { id: 'gradient', label: 'Sunset', name: 'Mindy Frauke', desc: 'Community artist', bg: 'linear-gradient(180deg,#87CEEB,#FF6B6B)', text: '#1a1a1a', linkBg: 'rgba(255,255,255,0.4)' },
  { id: 'brown', label: 'Brown', name: 'Lowell Maxwell', desc: 'Local creator', bg: '#3d2914', text: '#f5f0e6', linkBg: 'rgba(255,255,255,0.08)' },
  { id: 'beige', label: 'Beige Red', name: 'Sergey Amir', desc: 'Designer', bg: '#f5f0e6', text: '#c41e3a', linkBg: 'rgba(255,255,255,0.8)' },
  { id: 'green', label: 'Forest', name: 'Roberto Leopoldo', desc: 'Nature artist', bg: '#0d2818', text: '#90EE90', linkBg: 'rgba(255,255,255,0.06)' },
  { id: 'grey', label: 'Grey', name: 'Salka Ruslan', desc: 'Minimalist', bg: '#e5e5e5', text: '#1a1a1a', linkBg: 'rgba(255,255,255,0.9)' },
  { id: 'wood', label: 'Wood', name: 'Monica Vera', desc: 'Craft artist', bg: '#2c1810', text: '#f5f0e6', linkBg: 'rgba(255,255,255,0.06)' },
  { id: 'purple', label: 'Purple', name: 'Newlove Store', desc: 'Creative store', bg: 'linear-gradient(180deg,#4a1942,#e879f9)', text: '#fff', linkBg: 'rgba(255,255,255,0.15)' },
  { id: 'midnight', label: 'Midnight', bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', text: '#fff', linkBg: 'rgba(255,255,255,0.06)' },
  { id: 'emerald', label: 'Emerald', bg: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)', text: '#ecfdf5', linkBg: 'rgba(255,255,255,0.1)' },
  { id: 'sunset', label: 'Ocean Sunset', bg: 'linear-gradient(135deg, #fbbf24 0%, #ef4444 100%)', text: '#fff', linkBg: 'rgba(255,255,255,0.2)' },
  { id: 'royal', label: 'Royal', bg: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)', text: '#fff', linkBg: 'rgba(255,255,255,0.12)' },
  { id: 'ocean', label: 'Ocean', bg: 'linear-gradient(135deg, #075985 0%, #0ea5e9 100%)', text: '#f0f9ff', linkBg: 'rgba(255,255,255,0.1)' },
  { id: 'aurora', label: 'Aurora Waves', name: 'Aurora', desc: 'Animated flow', bg: '#0f172a', text: '#fff', linkBg: 'rgba(255,255,255,0.15)', isAnimated: true, className: 'theme-anim-aurora' },
  { id: 'galaxy', label: '3D Galaxy', name: 'Cosmic', desc: 'Deep space 3D', bg: '#000', text: '#fff', linkBg: 'rgba(255,255,255,0.12)', isAnimated: true, className: 'theme-anim-galaxy' },
  { id: 'glass', label: 'Glassmorphism', name: 'Frost', desc: 'Animated glass', bg: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', text: '#1e293b', linkBg: 'rgba(255,255,255,0.4)', isAnimated: true, className: 'theme-anim-glass' },
  { id: 'cyber', label: 'Cyberpunk', name: 'Neon City', desc: 'Animated glow', bg: '#09090b', text: '#0ff', linkBg: 'rgba(0, 255, 255, 0.1)', isAnimated: true, className: 'theme-anim-cyber' }
];

export const getThemeById = (id) => GENERAL_THEMES.find(t => t.id === id) || GENERAL_THEMES[0];

export const AVAILABLE_FONTS = [
  { id: 'outfit', label: 'Outfit', desc: 'Modern & Geometric', sample: 'The quick brown fox', family: "'Outfit', sans-serif" },
  { id: 'playfair', label: 'Playfair Display', desc: 'Elegant & Classic', sample: 'Elevated Artistry', family: "'Playfair Display', serif" },
  { id: 'caveat', label: 'Caveat', desc: 'Creative & Personal', sample: 'Handwritten Style', family: "'Caveat', cursive" },
  { id: 'mono-font', label: 'Roboto Mono', desc: 'Clean & Technical', sample: 'function design() { }', family: "'Roboto Mono', monospace" },
  { id: 'inter', label: 'Inter', desc: 'Neutral & Professional', sample: 'Clean interfaces', family: "'Inter', sans-serif" },
  { id: 'bebas', label: 'Bebas Neue', desc: 'Bold & Impactful', sample: 'LOUD AND CLEAR', family: "'Bebas Neue', sans-serif" },
  { id: 'space', label: 'Space Grotesk', desc: 'Tech & Future', sample: 'Next Generation', family: "'Space Grotesk', sans-serif" },
  { id: 'pacifico', label: 'Pacifico', desc: 'Casual & Fun', sample: 'Good vibes only', family: "'Pacifico', cursive" },
  { id: 'cinzel', label: 'Cinzel', desc: 'Cinematic & Epic', sample: 'THE GRAND TALE', family: "'Cinzel', serif" },
  { id: 'anton', label: 'Anton', desc: 'Heavy & Industrial', sample: 'MAXIMUM IMPACT', family: "'Anton', sans-serif" }
];

export const resolveFontFamily = (fontId) => {
  const font = AVAILABLE_FONTS.find(f => f.id === fontId);
  return font ? font.family : "'Outfit', sans-serif";
};
