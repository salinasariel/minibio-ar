// Temas de las páginas públicas.
// page.theme puede ser:
//   { preset: "ocean" }                  → tema predefinido
//   { from: "#3b82f6", to: "#ec4899" }   → degradado personalizado de 2 colores

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

const HEX = /^#[0-9a-fA-F]{6}$/;

// Devuelve { className, style } para aplicar al fondo de la página pública
export function getThemeView(theme) {
  if (theme?.from && theme?.to && HEX.test(theme.from) && HEX.test(theme.to)) {
    return {
      className: '',
      style: { background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` },
    };
  }
  const preset = THEMES[theme?.preset] || THEMES[DEFAULT_THEME];
  return { className: preset.background, style: undefined };
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const c = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Par de colores aleatorio que combina (tonos separados 40-140°, saturados)
export function randomGradient() {
  const h1 = Math.floor(Math.random() * 360);
  const h2 = (h1 + 40 + Math.floor(Math.random() * 100)) % 360;
  return {
    from: hslToHex(h1, 70 + Math.floor(Math.random() * 20), 45 + Math.floor(Math.random() * 15)),
    to: hslToHex(h2, 70 + Math.floor(Math.random() * 20), 40 + Math.floor(Math.random() * 15)),
  };
}
