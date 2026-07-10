const crypto = require('crypto');
const prisma = require('../models/db');

// ========================================
// Motor de disponibilidad del turnero.
// Un recurso tiene N unidades simultáneas (quantity) y turnos de
// `duration` minutos. Un slot está libre si las reservas activas
// en ese horario son menos que quantity.
// ========================================

// Argentina no tiene horario de verano: offset fijo
const TZ_OFFSET = '-03:00';

const ACTIVE_STATUSES = ['pending', 'confirmed'];

const DEFAULT_SETTINGS = {
  enabled: true,
  auto_confirm: true, // false = el dueño aprueba cada turno
  max_days: 30, // anticipación máxima para reservar
  min_minutes: 60, // anticipación mínima
  allow_cancel: true, // el cliente puede cancelar online con su link
  cancel_hours: 0, // hasta cuántas horas antes del turno puede cancelar (0 = hasta el inicio)
};

// ¿Esta reserva puede cancelarla el cliente ahora?
// Devuelve { ok, reason } — reason solo cuando ok es false.
function canClientCancel(booking, page) {
  const settings = getSettings(page);
  if (!settings.allow_cancel) {
    return { ok: false, reason: 'El negocio no permite cancelar online. Contactalo directamente.' };
  }
  const limit = new Date(booking.starts_at.getTime() - settings.cancel_hours * 60 * 60 * 1000);
  if (new Date() > limit) {
    return {
      ok: false,
      reason:
        settings.cancel_hours > 0
          ? `Solo se puede cancelar hasta ${settings.cancel_hours} h antes del turno. Contactá al negocio.`
          : 'El turno ya comenzó, no se puede cancelar.',
    };
  }
  return { ok: true };
}

function getSettings(page) {
  return { ...DEFAULT_SETTINGS, ...(page.booking_settings || {}) };
}

// 'YYYY-MM-DD' → 'mon'..'sun' (día calendario, independiente del server)
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
function dayKeyFor(dateStr) {
  return DAY_KEYS[new Date(`${dateStr}T00:00:00Z`).getUTCDay()];
}

// Fecha calendario argentina (YYYY-MM-DD) de un Date
function arDateString(date) {
  return new Date(date.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const isValidDateStr = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));

// Slots teóricos de un recurso para una fecha (sin mirar reservas)
function slotsForDate(resource, page, dateStr) {
  const hours = resource.hours || page.hours;
  if (!hours) return [];

  const day = hours[dayKeyFor(dateStr)];
  if (!day || day.closed || !day.open || !day.close) return [];

  const toMin = (s) => {
    const [h, m] = String(s).split(':').map(Number);
    return h * 60 + m;
  };
  const open = toMin(day.open);
  const close = toMin(day.close);
  if (!(open >= 0) || !(close > open)) return [];

  const slots = [];
  for (let t = open; t + resource.duration <= close; t += resource.duration) {
    const hh = String(Math.floor(t / 60)).padStart(2, '0');
    const mm = String(t % 60).padStart(2, '0');
    slots.push({
      time: `${hh}:${mm}`,
      starts_at: new Date(`${dateStr}T${hh}:${mm}:00${TZ_OFFSET}`),
    });
  }
  return slots;
}

// ¿La fecha está bloqueada (feriado de página o mantenimiento del recurso)?
async function isDateBlocked(pageId, resourceId, dateStr) {
  const exception = await prisma.bookingException.findFirst({
    where: {
      page_id: pageId,
      date: new Date(`${dateStr}T00:00:00Z`),
      OR: [{ resource_id: null }, { resource_id: resourceId }],
    },
    select: { id: true },
  });
  return Boolean(exception);
}

// ¿La fecha está dentro de la ventana de reserva? (hoy .. hoy + max_days)
function isDateInWindow(dateStr, settings) {
  const today = arDateString(new Date());
  const max = arDateString(new Date(Date.now() + settings.max_days * 24 * 60 * 60 * 1000));
  return dateStr >= today && dateStr <= max;
}

// Grilla de disponibilidad de un recurso para una fecha
async function getAvailability(resource, page, dateStr) {
  const settings = getSettings(page);

  if (!isDateInWindow(dateStr, settings)) return [];
  if (await isDateBlocked(page.id, resource.id, dateStr)) return [];

  const slots = slotsForDate(resource, page, dateStr);
  if (slots.length === 0) return [];

  const dayStart = slots[0].starts_at;
  const dayEnd = new Date(slots[slots.length - 1].starts_at.getTime() + resource.duration * 60000);

  const grouped = await prisma.booking.groupBy({
    by: ['starts_at'],
    where: {
      resource_id: resource.id,
      starts_at: { gte: dayStart, lt: dayEnd },
      status: { in: ACTIVE_STATUSES },
    },
    _count: { _all: true },
  });
  const countAt = (d) =>
    grouped.find((g) => g.starts_at.getTime() === d.getTime())?._count._all || 0;

  const minStart = Date.now() + settings.min_minutes * 60000;

  return slots.map((s) => ({
    time: s.time,
    starts_at: s.starts_at.toISOString(),
    available: s.starts_at.getTime() < minStart ? 0 : Math.max(0, resource.quantity - countAt(s.starts_at)),
  }));
}

// Crea la reserva verificando capacidad DENTRO de una transacción
// serializable: dos clientes no pueden quedarse con el último lugar.
// Lanza Error con code='FULL' si el horario se llenó.
async function createBookingSafe({ resource, page, startsAt, data }) {
  const endsAt = new Date(startsAt.getTime() + resource.duration * 60000);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const count = await tx.booking.count({
            where: {
              resource_id: resource.id,
              starts_at: startsAt,
              status: { in: ACTIVE_STATUSES },
            },
          });
          if (count >= resource.quantity) {
            const err = new Error('Ese horario acaba de llenarse');
            err.code = 'FULL';
            throw err;
          }
          return tx.booking.create({
            data: {
              resource_id: resource.id,
              page_id: page.id,
              starts_at: startsAt,
              ends_at: endsAt,
              cancel_token: crypto.randomBytes(24).toString('hex'),
              ...data,
            },
          });
        },
        { isolationLevel: 'Serializable' }
      );
    } catch (err) {
      if (err.code === 'FULL') throw err;
      // P2034 = conflicto de serialización: reintentar
      if (err.code === 'P2034' && attempt < 2) continue;
      throw err;
    }
  }
}

// Valida que un starts_at corresponda a un slot real y disponible.
// Devuelve { ok, error, startsAt }.
async function validateSlot(resource, page, startsAtIso) {
  const startsAt = new Date(startsAtIso);
  if (Number.isNaN(startsAt.getTime())) return { ok: false, error: 'Horario inválido' };

  const dateStr = arDateString(startsAt);
  const settings = getSettings(page);

  if (!isDateInWindow(dateStr, settings)) {
    return { ok: false, error: `Solo se puede reservar hasta ${settings.max_days} días de anticipación` };
  }
  if (startsAt.getTime() < Date.now() + settings.min_minutes * 60000) {
    return { ok: false, error: 'Ese horario ya no está disponible' };
  }
  if (await isDateBlocked(page.id, resource.id, dateStr)) {
    return { ok: false, error: 'Esa fecha no está disponible' };
  }

  const slots = slotsForDate(resource, page, dateStr);
  const match = slots.find((s) => s.starts_at.getTime() === startsAt.getTime());
  if (!match) return { ok: false, error: 'El horario no corresponde a un turno válido' };

  return { ok: true, startsAt: match.starts_at };
}

module.exports = {
  ACTIVE_STATUSES,
  DEFAULT_SETTINGS,
  getSettings,
  canClientCancel,
  slotsForDate,
  getAvailability,
  validateSlot,
  createBookingSafe,
  arDateString,
  isValidDateStr,
};
