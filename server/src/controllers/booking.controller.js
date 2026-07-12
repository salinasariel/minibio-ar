const prisma = require('../models/db');
const { getUserPlan, planHasFeature } = require('../lib/plan');
const {
  ACTIVE_STATUSES,
  getSettings,
  canClientCancel,
  getAvailability,
  validateSlot,
  createBookingSafe,
  isValidDateStr,
} = require('../lib/booking');

const MAX_RESOURCES_PER_PAGE = 20;
const MAX_ACTIVE_PER_PHONE = 3; // reservas futuras activas por teléfono por página

// Helper: página del usuario autenticado
async function getOwnedPage(pageId, userId) {
  const id = parseInt(pageId, 10);
  if (Number.isNaN(id)) return null;
  return prisma.page.findFirst({ where: { id, user_id: userId } });
}

// Helper: la página tiene reservas habilitadas para el público
// (plan del dueño con feature 'bookings' + settings.enabled)
async function pageAcceptsBookings(page) {
  if (!getSettings(page).enabled) return false;
  const plan = await getUserPlan(page.user_id);
  return planHasFeature(plan, 'bookings');
}

const publicBooking = (b) => ({
  id: b.id,
  starts_at: b.starts_at,
  ends_at: b.ends_at,
  status: b.status,
  customer_name: b.customer_name,
});

// ========================================
// PÚBLICO: info de reservas de una página
// GET /api/public/booking/:slug
// ========================================
exports.getPublicInfo = async (req, res) => {
  try {
    const page = await prisma.page.findUnique({
      where: { slug: String(req.params.slug).toLowerCase() },
    });
    if (!page || !(await pageAcceptsBookings(page))) {
      return res.status(404).json({ error: 'Reservas no disponibles' });
    }

    const resources = await prisma.bookingResource.findMany({
      where: { page_id: page.id, active: true },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true, description: true, duration: true, price: true, quantity: true },
    });

    const settings = getSettings(page);
    res.status(200).json({
      resources,
      whatsapp: page.whatsapp || null, // para la confirmación por WhatsApp del cliente
      settings: {
        auto_confirm: settings.auto_confirm,
        max_days: settings.max_days,
        min_minutes: settings.min_minutes,
        allow_cancel: settings.allow_cancel,
        cancel_hours: settings.cancel_hours,
      },
    });
  } catch (error) {
    console.error('booking getPublicInfo error:', error);
    res.status(500).json({ error: 'Error al obtener las reservas' });
  }
};

// ========================================
// PÚBLICO: disponibilidad de un recurso en una fecha
// GET /api/public/booking/:slug/availability?resource_id=&date=YYYY-MM-DD
// ========================================
exports.getPublicAvailability = async (req, res) => {
  const resourceId = parseInt(req.query.resource_id, 10);
  const date = String(req.query.date || '');

  if (Number.isNaN(resourceId) || !isValidDateStr(date)) {
    return res.status(400).json({ error: 'Parámetros inválidos' });
  }

  try {
    const page = await prisma.page.findUnique({
      where: { slug: String(req.params.slug).toLowerCase() },
    });
    if (!page || !(await pageAcceptsBookings(page))) {
      return res.status(404).json({ error: 'Reservas no disponibles' });
    }

    const resource = await prisma.bookingResource.findFirst({
      where: { id: resourceId, page_id: page.id, active: true },
    });
    if (!resource) return res.status(404).json({ error: 'Recurso no encontrado' });

    const slots = await getAvailability(resource, page, date);
    res.status(200).json({ date, slots });
  } catch (error) {
    console.error('booking availability error:', error);
    res.status(500).json({ error: 'Error al consultar disponibilidad' });
  }
};

// ========================================
// PÚBLICO: crear reserva
// POST /api/public/booking/:slug
// body: { resource_id, starts_at, customer_name, customer_phone, notes }
// ========================================
exports.createPublicBooking = async (req, res) => {
  const { resource_id, starts_at, customer_name, customer_phone, notes } = req.body;

  try {
    const page = await prisma.page.findUnique({
      where: { slug: String(req.params.slug).toLowerCase() },
    });
    if (!page || !(await pageAcceptsBookings(page))) {
      return res.status(404).json({ error: 'Reservas no disponibles' });
    }

    const resource = await prisma.bookingResource.findFirst({
      where: { id: resource_id, page_id: page.id, active: true },
    });
    if (!resource) return res.status(404).json({ error: 'Recurso no encontrado' });

    const slot = await validateSlot(resource, page, starts_at);
    if (!slot.ok) return res.status(400).json({ error: slot.error });

    // Anti-abuso: tope de reservas futuras activas por teléfono en esta página
    const activeCount = await prisma.booking.count({
      where: {
        page_id: page.id,
        customer_phone,
        starts_at: { gte: new Date() },
        status: { in: ACTIVE_STATUSES },
      },
    });
    if (activeCount >= MAX_ACTIVE_PER_PHONE) {
      return res.status(429).json({
        error: `Ya tenés ${MAX_ACTIVE_PER_PHONE} reservas activas en esta página`,
      });
    }

    const settings = getSettings(page);
    const booking = await createBookingSafe({
      resource,
      page,
      startsAt: slot.startsAt,
      data: {
        customer_name,
        customer_phone,
        notes: notes || null,
        status: settings.auto_confirm ? 'confirmed' : 'pending',
        created_ip: req.ip || null,
      },
    });

    // Evento para estadísticas (no bloqueante)
    prisma.statEvent
      .create({ data: { page_id: page.id, type: 'booking' } })
      .catch((e) => console.error('statEvent booking error:', e.message));

    res.status(201).json({
      booking: publicBooking(booking),
      resource: { name: resource.name, duration: resource.duration },
      cancel_token: booking.cancel_token,
      auto_confirmed: settings.auto_confirm,
    });
  } catch (error) {
    if (error.code === 'FULL') {
      return res.status(409).json({ error: 'Ese horario acaba de llenarse, elegí otro' });
    }
    console.error('createPublicBooking error:', error);
    res.status(500).json({ error: 'Error al crear la reserva' });
  }
};

// ========================================
// PÚBLICO: cancelar con el token del cliente
// POST /api/public/booking/cancel/:token
// ========================================
exports.cancelByToken = async (req, res) => {
  const token = String(req.params.token || '');
  if (!/^[0-9a-f]{48}$/.test(token)) {
    return res.status(400).json({ error: 'Token inválido' });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { cancel_token: token },
      include: { resource: { select: { name: true } }, page: true },
    });
    if (!booking) return res.status(404).json({ error: 'Reserva no encontrada' });

    if (!ACTIVE_STATUSES.includes(booking.status)) {
      return res.status(410).json({ error: 'La reserva ya no está activa' });
    }

    // Política del negocio: cancelación online habilitada y dentro del plazo
    const allowed = canClientCancel(booking, booking.page);
    if (!allowed.ok) {
      return res.status(403).json({ error: allowed.reason });
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'cancelled' },
    });

    res.status(200).json({ message: 'Reserva cancelada', booking: publicBooking(updated) });
  } catch (error) {
    console.error('cancelByToken error:', error);
    res.status(500).json({ error: 'Error al cancelar la reserva' });
  }
};

// ========================================
// PÚBLICO: consultar una reserva con el token (para la página de cancelación)
// GET /api/public/booking/by-token/:token
// ========================================
exports.getByToken = async (req, res) => {
  const token = String(req.params.token || '');
  if (!/^[0-9a-f]{48}$/.test(token)) {
    return res.status(400).json({ error: 'Token inválido' });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { cancel_token: token },
      include: {
        resource: { select: { name: true, duration: true } },
        page: true,
      },
    });
    if (!booking) return res.status(404).json({ error: 'Reserva no encontrada' });

    const active = ACTIVE_STATUSES.includes(booking.status);
    const allowed = active ? canClientCancel(booking, booking.page) : { ok: false, reason: null };

    res.status(200).json({
      booking: publicBooking(booking),
      resource: booking.resource,
      page: { title: booking.page.title, slug: booking.page.slug, whatsapp: booking.page.whatsapp || null },
      can_cancel: allowed.ok,
      cancel_blocked_reason: allowed.ok ? null : allowed.reason,
    });
  } catch (error) {
    console.error('booking getByToken error:', error);
    res.status(500).json({ error: 'Error al consultar la reserva' });
  }
};

// ========================================
// DUEÑO: listar recursos de una página (incluye inactivos)
// GET /api/bookings/resources/:pageId
// ========================================
exports.listResources = async (req, res) => {
  try {
    const page = await getOwnedPage(req.params.pageId, req.user.userId);
    if (!page) return res.status(404).json({ error: 'Página no encontrada' });

    const resources = await prisma.bookingResource.findMany({
      where: { page_id: page.id },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
      include: { _count: { select: { bookings: true } } },
    });

    res.status(200).json({ resources, settings: getSettings(page) });
  } catch (error) {
    console.error('listResources error:', error);
    res.status(500).json({ error: 'Error al listar recursos' });
  }
};

// ========================================
// DUEÑO: crear recurso
// POST /api/bookings/resources
// ========================================
exports.createResource = async (req, res) => {
  const { page_id, name, description, quantity, duration, price, hours, active } = req.body;
  const userId = req.user.userId;

  try {
    const plan = await getUserPlan(userId);
    if (!planHasFeature(plan, 'bookings')) {
      return res.status(403).json({ error: `Tu plan (${plan.name}) no incluye reservas` });
    }

    const page = await getOwnedPage(page_id, userId);
    if (!page) return res.status(403).json({ error: 'No autorizado para modificar esta página' });

    const count = await prisma.bookingResource.count({ where: { page_id: page.id } });
    if (count >= MAX_RESOURCES_PER_PAGE) {
      return res.status(403).json({ error: `Máximo ${MAX_RESOURCES_PER_PAGE} recursos por página` });
    }

    const maxPos = await prisma.bookingResource.findFirst({
      where: { page_id: page.id },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const resource = await prisma.bookingResource.create({
      data: {
        page_id: page.id,
        name,
        description: description || null,
        quantity,
        duration,
        price: price ?? null,
        hours: hours || null,
        active: active !== false,
        position: maxPos ? maxPos.position + 1 : 0,
      },
    });

    res.status(201).json(resource);
  } catch (error) {
    console.error('createResource error:', error);
    res.status(500).json({ error: 'Error al crear el recurso' });
  }
};

// ========================================
// DUEÑO: modificar recurso
// PUT /api/bookings/resources/:id
// ========================================
exports.updateResource = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const resource = await prisma.bookingResource.findUnique({
      where: { id },
      include: { page: { select: { user_id: true } } },
    });
    if (!resource || resource.page.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { name, description, quantity, duration, price, hours, active } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description || null;
    if (quantity !== undefined) data.quantity = quantity;
    if (duration !== undefined) data.duration = duration;
    if (price !== undefined) data.price = price ?? null;
    if (hours !== undefined) data.hours = hours;
    if (active !== undefined) data.active = active;

    const updated = await prisma.bookingResource.update({ where: { id }, data });
    res.status(200).json(updated);
  } catch (error) {
    console.error('updateResource error:', error);
    res.status(500).json({ error: 'Error al modificar el recurso' });
  }
};

// ========================================
// DUEÑO: eliminar recurso (cascade borra sus reservas)
// DELETE /api/bookings/resources/:id
// ========================================
exports.deleteResource = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const resource = await prisma.bookingResource.findUnique({
      where: { id },
      include: { page: { select: { user_id: true } } },
    });
    if (!resource || resource.page.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await prisma.bookingResource.delete({ where: { id } });
    res.status(200).json({ message: 'Recurso eliminado' });
  } catch (error) {
    console.error('deleteResource error:', error);
    res.status(500).json({ error: 'Error al eliminar el recurso' });
  }
};

// ========================================
// DUEÑO: agenda de turnos
// GET /api/bookings/page/:pageId?from=YYYY-MM-DD&to=YYYY-MM-DD&status=
// ========================================
exports.listBookings = async (req, res) => {
  try {
    const page = await getOwnedPage(req.params.pageId, req.user.userId);
    if (!page) return res.status(404).json({ error: 'Página no encontrada' });

    const { from, to, status } = req.query;
    const where = { page_id: page.id };

    if (from && isValidDateStr(from)) where.starts_at = { gte: new Date(`${from}T00:00:00-03:00`) };
    if (to && isValidDateStr(to)) {
      where.starts_at = { ...(where.starts_at || {}), lt: new Date(`${to}T24:00:00-03:00`) };
    }
    if (status && ['pending', 'confirmed', 'cancelled', 'no_show', 'done'].includes(status)) {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { starts_at: 'asc' },
      take: 500,
      include: { resource: { select: { id: true, name: true } } },
    });

    res.status(200).json({ bookings });
  } catch (error) {
    console.error('listBookings error:', error);
    res.status(500).json({ error: 'Error al listar turnos' });
  }
};

// ========================================
// DUEÑO: turnos de TODAS sus páginas (vista global)
// GET /api/bookings/all?from=YYYY-MM-DD&to=YYYY-MM-DD&status=
// ========================================
exports.listAllBookings = async (req, res) => {
  try {
    const { from, to, status, page_id } = req.query;
    const where = { page: { user_id: req.user.userId } };

    if (from && isValidDateStr(from)) where.starts_at = { gte: new Date(`${from}T00:00:00-03:00`) };
    if (to && isValidDateStr(to)) {
      where.starts_at = { ...(where.starts_at || {}), lt: new Date(`${to}T24:00:00-03:00`) };
    }
    if (status && ['pending', 'confirmed', 'cancelled', 'no_show', 'done'].includes(status)) {
      where.status = status;
    }
    // Filtro opcional por página (la condición de dueño ya aplica igual)
    if (page_id && !Number.isNaN(parseInt(page_id, 10))) {
      where.page_id = parseInt(page_id, 10);
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { starts_at: 'asc' },
      take: 500,
      include: {
        resource: { select: { id: true, name: true } },
        page: { select: { id: true, title: true, slug: true } },
      },
    });

    res.status(200).json({ bookings });
  } catch (error) {
    console.error('listAllBookings error:', error);
    res.status(500).json({ error: 'Error al listar turnos' });
  }
};

// ========================================
// DUEÑO: cambiar estado de un turno
// PATCH /api/bookings/:id  { status }
// ========================================
exports.updateBookingStatus = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { page: { select: { user_id: true } } },
    });
    if (!booking || booking.page.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: req.body.status },
      include: { resource: { select: { id: true, name: true } } },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error('updateBookingStatus error:', error);
    res.status(500).json({ error: 'Error al actualizar el turno' });
  }
};

// ========================================
// DUEÑO: carga manual de un turno (cliente por teléfono)
// POST /api/bookings/manual
// ========================================
exports.createManualBooking = async (req, res) => {
  const { page_id, resource_id, starts_at, customer_name, customer_phone, notes } = req.body;

  try {
    const page = await getOwnedPage(page_id, req.user.userId);
    if (!page) return res.status(403).json({ error: 'No autorizado' });

    const resource = await prisma.bookingResource.findFirst({
      where: { id: resource_id, page_id: page.id },
    });
    if (!resource) return res.status(404).json({ error: 'Recurso no encontrado' });

    const slot = await validateSlot(resource, page, starts_at);
    if (!slot.ok) return res.status(400).json({ error: slot.error });

    const booking = await createBookingSafe({
      resource,
      page,
      startsAt: slot.startsAt,
      data: {
        customer_name,
        customer_phone,
        notes: notes || null,
        status: 'confirmed', // carga manual = ya acordado con el cliente
        created_by_owner: true,
      },
    });

    const withResource = { ...booking, resource: { id: resource.id, name: resource.name } };
    res.status(201).json(withResource);
  } catch (error) {
    if (error.code === 'FULL') {
      return res.status(409).json({ error: 'Ese horario ya está completo' });
    }
    console.error('createManualBooking error:', error);
    res.status(500).json({ error: 'Error al crear el turno' });
  }
};

// ========================================
// DUEÑO: configuración de reservas de la página
// PUT /api/bookings/settings/:pageId
// ========================================
exports.updateSettings = async (req, res) => {
  try {
    const page = await getOwnedPage(req.params.pageId, req.user.userId);
    if (!page) return res.status(404).json({ error: 'Página no encontrada' });

    const settings = { ...getSettings(page), ...req.body };
    const updated = await prisma.page.update({
      where: { id: page.id },
      data: { booking_settings: settings },
      select: { booking_settings: true },
    });

    res.status(200).json({ settings: updated.booking_settings });
  } catch (error) {
    console.error('booking updateSettings error:', error);
    res.status(500).json({ error: 'Error al guardar la configuración' });
  }
};

// ========================================
// DUEÑO: excepciones (feriados / bloqueos)
// GET /api/bookings/exceptions/:pageId
// POST /api/bookings/exceptions
// DELETE /api/bookings/exceptions/:id
// ========================================
exports.listExceptions = async (req, res) => {
  try {
    const page = await getOwnedPage(req.params.pageId, req.user.userId);
    if (!page) return res.status(404).json({ error: 'Página no encontrada' });

    const exceptions = await prisma.bookingException.findMany({
      where: { page_id: page.id, date: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      orderBy: { date: 'asc' },
      include: { resource: { select: { id: true, name: true } } },
    });

    res.status(200).json({ exceptions });
  } catch (error) {
    console.error('listExceptions error:', error);
    res.status(500).json({ error: 'Error al listar bloqueos' });
  }
};

exports.createException = async (req, res) => {
  const { page_id, resource_id, date, reason } = req.body;

  try {
    const page = await getOwnedPage(page_id, req.user.userId);
    if (!page) return res.status(403).json({ error: 'No autorizado' });

    if (resource_id) {
      const resource = await prisma.bookingResource.findFirst({
        where: { id: resource_id, page_id: page.id },
      });
      if (!resource) return res.status(404).json({ error: 'Recurso no encontrado' });
    }

    const exception = await prisma.bookingException.create({
      data: {
        page_id: page.id,
        resource_id: resource_id || null,
        date: new Date(`${date}T00:00:00Z`),
        reason: reason || null,
      },
      include: { resource: { select: { id: true, name: true } } },
    });

    res.status(201).json(exception);
  } catch (error) {
    console.error('createException error:', error);
    res.status(500).json({ error: 'Error al crear el bloqueo' });
  }
};

exports.deleteException = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const exception = await prisma.bookingException.findUnique({
      where: { id },
      include: { page: { select: { user_id: true } } },
    });
    if (!exception || exception.page.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await prisma.bookingException.delete({ where: { id } });
    res.status(200).json({ message: 'Bloqueo eliminado' });
  } catch (error) {
    console.error('deleteException error:', error);
    res.status(500).json({ error: 'Error al eliminar el bloqueo' });
  }
};
