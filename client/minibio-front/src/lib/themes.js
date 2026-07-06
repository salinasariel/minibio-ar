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

// Dirección del degradado (token IA): br=diagonal, b=vertical, r=horizontal, tr=diagonal inversa
const DIRECTIONS = { br: '135deg', b: '180deg', r: '90deg', tr: '45deg' };

// Tipografías permitidas (token IA)
const FONTS = { sans: 'font-sans', serif: 'font-serif', mono: 'font-mono' };

// Devuelve { className, style, fontClass } para el fondo de la página pública
export function getThemeView(theme) {
  const fontClass = FONTS[theme?.font] || '';

  if (theme?.from && theme?.to && HEX.test(theme.from) && HEX.test(theme.to)) {
    const deg = DIRECTIONS[theme?.direction] || '135deg';
    return {
      className: '',
      style: { background: `linear-gradient(${deg}, ${theme.from}, ${theme.to})` },
      fontClass,
    };
  }
  const preset = THEMES[theme?.preset] || THEMES[DEFAULT_THEME];
  return { className: preset.background, style: undefined, fontClass };
}

// Estilo de los botones de links según tokens (variant/radius/color).
// Sin tokens devuelve el look "glass" de siempre.
export function getButtonView(theme) {
  const b = theme?.button || {};
  const radius = { full: 'rounded-full', '2xl': 'rounded-2xl', lg: 'rounded-lg' }[b.radius] || 'rounded-2xl';
  const color = b.color && HEX.test(b.color) ? b.color : null;

  if (b.variant === 'solid') {
    return {
      className: `${radius} border-2 border-transparent`,
      style: { backgroundColor: color || 'rgba(255,255,255,0.92)', color: color ? '#ffffff' : '#111827' },
    };
  }
  if (b.variant === 'outline') {
    return {
      className: `${radius} bg-transparent border-2`,
      style: { borderColor: color || 'rgba(255,255,255,0.8)', color: '#ffffff' },
    };
  }
  // glass (default)
  return {
    className: `${radius} bg-white/20 backdrop-blur-md border-2 border-white/30 text-white`,
    style: undefined,
  };
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
