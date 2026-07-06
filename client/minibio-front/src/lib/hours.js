// Utilidades de horarios de atención.
// Formato: { mon: { closed: bool, open: "HH:MM", close: "HH:MM" }, ... }

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DAY_NAMES = {
  mon: 'Lunes',
  tue: 'Martes',
  wed: 'Miércoles',
  thu: 'Jueves',
  fri: 'Viernes',
  sat: 'Sábado',
  sun: 'Domingo',
};

// Date.getDay(): 0=domingo ... 6=sábado
const JS_DAY_TO_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
};

// ¿Hay algún día con horario cargado?
export function hasHours(hours) {
  if (!hours) return false;
  return DAY_KEYS.some((k) => {
    const d = hours[k];
    return d && !d.closed && d.open && d.close;
  });
}

// ¿Está abierto ahora? Contempla horarios que cruzan medianoche (ej: 20:00-02:00)
export function isOpenNow(hours, now = new Date()) {
  if (!hasHours(hours)) return null;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayKey = JS_DAY_TO_KEY[now.getDay()];
  const yesterdayKey = JS_DAY_TO_KEY[(now.getDay() + 6) % 7];

  // Horario de hoy
  const today = hours[todayKey];
  if (today && !today.closed && today.open && today.close) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    if (close > open) {
      if (nowMin >= open && nowMin < close) return true;
    } else if (close < open) {
      // Cruza medianoche: abierto desde open hasta 24:00
      if (nowMin >= open) return true;
    }
  }

  // Horario de ayer que cruza medianoche (ej: ayer 20:00-02:00 y son las 01:00)
  const yesterday = hours[yesterdayKey];
  if (yesterday && !yesterday.closed && yesterday.open && yesterday.close) {
    const open = toMinutes(yesterday.open);
    const close = toMinutes(yesterday.close);
    if (close < open && nowMin < close) return true;
  }

  return false;
}
