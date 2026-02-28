export const GENERAL_THEMES = [
  { id: 'mint', label: 'Mint', name: 'James Willson', desc: 'Company owner', bg: 'linear-gradient(135deg,#7dd3b0,#a8e6cf)', text: '#2d5a4a', linkBg: 'rgba(255,255,255,0.5)' },
  { id: 'mono', label: 'Mono Dark', name: 'Jesse Jordan', desc: 'Rockstar, Activist', bg: '#0f172a', text: '#fff', linkBg: 'rgba(255,255,255,0.08)' },
  { id: 'gradient', label: 'Sunset', name: 'Mindy Frauke', desc: 'Community artist', bg: 'linear-gradient(180deg,#87CEEB,#FF6B6B)', text: '#1a1a1a', linkBg: 'rgba(255,255,255,0.4)' },
  { id: 'brown', label: 'Brown', name: 'Lowell Maxwell', desc: 'Local creator', bg: '#3d2914', text: '#f5f0e6', linkBg: 'rgba(255,255,255,0.08)' },
  { id: 'beige', label: 'Beige Red', name: 'Sergey Amir', desc: 'Designer', bg: '#f5f0e6', text: '#c41e3a', linkBg: 'rgba(255,255,255,0.8)' },
  { id: 'green', label: 'Forest', name: 'Roberto Leopoldo', desc: 'Nature artist', bg: '#0d2818', text: '#90EE90', linkBg: 'rgba(255,255,255,0.06)' },
  { id: 'grey', label: 'Grey', name: 'Salka Ruslan', desc: 'Minimalist', bg: '#e5e5e5', text: '#1a1a1a', linkBg: 'rgba(255,255,255,0.9)' },
  { id: 'wood', label: 'Wood', name: 'Monica Vera', desc: 'Craft artist', bg: '#2c1810', text: '#f5f0e6', linkBg: 'rgba(255,255,255,0.06)' },
  { id: 'purple', label: 'Purple', name: 'Newlove Store', desc: 'Creative store', bg: 'linear-gradient(180deg,#4a1942,#e879f9)', text: '#fff', linkBg: 'rgba(255,255,255,0.15)' }
];

export const getThemeById = (id) => GENERAL_THEMES.find(t => t.id === id) || GENERAL_THEMES[0];
