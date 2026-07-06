// Temas predefinidos para las páginas públicas.
// Se guardan en page.theme como { preset: "ocean" }.

export const THEMES = {
  ocean: {
    name: 'Océano',
    background: 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500',
    swatch: 'linear-gradient(135deg, #3b82f6, #a855f7, #ec4899)',
  },
  sunset: {
    name: 'Atardecer',
    background: 'bg-gradient-to-br from-orange-400 via-rose-500 to-purple-600',
    swatch: 'linear-gradient(135deg, #fb923c, #f43f5e, #9333ea)',
  },
  forest: {
    name: 'Bosque',
    background: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700',
    swatch: 'linear-gradient(135deg, #10b981, #0d9488, #0e7490)',
  },
  night: {
    name: 'Noche',
    background: 'bg-gradient-to-br from-gray-800 via-slate-900 to-black',
    swatch: 'linear-gradient(135deg, #1f2937, #0f172a, #000000)',
  },
};

export const DEFAULT_THEME = 'ocean';

export function getTheme(theme) {
  const preset = theme?.preset;
  return THEMES[preset] || THEMES[DEFAULT_THEME];
}
