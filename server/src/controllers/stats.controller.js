const prisma = require('../models/db');
const { getUserPlan, planHasFeature } = require('../lib/plan');

// ========================================
// ESTADÍSTICAS DE TODAS MIS PÁGINAS
// GET /api/stats
// ========================================
exports.getMyStats = async (req, res) => {
  const userId = req.user.userId;

  try {
    const plan = await getUserPlan(userId);
    if (!planHasFeature(plan, 'stats')) {
      return res.status(403).json({ error: `Tu plan (${plan.name}) no incluye estadísticas` });
    }

    const pages = await prisma.page.findMany({
      where: { user_id: userId },
      include: {
        links: { orderBy: { clicks: 'desc' } },
        menus: { select: { id: true, status: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const pageIds = pages.map((p) => p.id);

    // Eventos agrupados por página y tipo (histórico total)
    const eventTotals = pageIds.length
      ? await prisma.statEvent.groupBy({
          by: ['page_id', 'type'],
          where: { page_id: { in: pageIds } },
          _count: { _all: true },
        })
      : [];

    // Últimos 7 días, por página y tipo
    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const eventLast7 = pageIds.length
      ? await prisma.statEvent.groupBy({
          by: ['page_id', 'type'],
          where: { page_id: { in: pageIds }, created_at: { gte: since7 } },
          _count: { _all: true },
        })
      : [];

    // Reservas: por página y estado, próximas y creadas en los últimos 7 días
    const { ACTIVE_STATUSES } = require('../lib/booking');
    const now = new Date();
    const [bookingByStatus, bookingUpcoming, bookingLast7] = pageIds.length
      ? await Promise.all([
          prisma.booking.groupBy({
            by: ['page_id', 'status'],
            where: { page_id: { in: pageIds } },
            _count: { _all: true },
          }),
          prisma.booking.groupBy({
            by: ['page_id'],
            where: { page_id: { in: pageIds }, starts_at: { gte: now }, status: { in: ACTIVE_STATUSES } },
            _count: { _all: true },
          }),
          prisma.booking.groupBy({
            by: ['page_id'],
            where: { page_id: { in: pageIds }, created_at: { gte: since7 } },
            _count: { _all: true },
          }),
        ])
      : [[], [], []];

    const bookingCount = (arr, pageId) => arr.find((b) => b.page_id === pageId)?._count?._all || 0;
    const bookingStatusCount = (pageId, status) =>
      bookingByStatus.find((b) => b.page_id === pageId && b.status === status)?._count?._all || 0;

    // Serie diaria de los últimos 30 días (todas las páginas juntas)
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyRaw = pageIds.length
      ? await prisma.$queryRaw`
          SELECT to_char(date(created_at), 'YYYY-MM-DD') AS day, type, COUNT(*)::int AS count
          FROM stat_events
          WHERE page_id = ANY(${pageIds}) AND created_at >= ${since30}
          GROUP BY 1, 2
          ORDER BY 1
        `
      : [];

    const countFor = (arr, pageId, type) =>
      arr.find((e) => e.page_id === pageId && e.type === type)?._count?._all || 0;

    const pageStats = pages.map((p) => {
      const views = countFor(eventTotals, p.id, 'view');
      const clicks = p.links.reduce((s, l) => s + (l.clicks || 0), 0);
      const topLinks = p.links.slice(0, 5).map((l) => ({
        id: l.id,
        title: l.title,
        url: l.url,
        clicks: l.clicks,
      }));

      // Reservas de esta página
      const bookingsDone = bookingStatusCount(p.id, 'done');
      const bookingsNoShow = bookingStatusCount(p.id, 'no_show');
      const bookingsCancelled = bookingStatusCount(p.id, 'cancelled');
      const bookingsTotal =
        bookingsDone +
        bookingsNoShow +
        bookingsCancelled +
        bookingStatusCount(p.id, 'pending') +
        bookingStatusCount(p.id, 'confirmed');

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        created_at: p.created_at,
        views,
        views_last7: countFor(eventLast7, p.id, 'view'),
        clicks,
        clicks_last7: countFor(eventLast7, p.id, 'click'),
        ctr: views > 0 ? Math.round((clicks / views) * 100) : null, // % clicks/visitas
        links_count: p.links.length,
        menu_count: p.menus.length,
        menu_active: p.menus.filter((m) => m.status === 'active').length,
        top_links: topLinks,
        bookings: {
          total: bookingsTotal,
          upcoming: bookingCount(bookingUpcoming, p.id),
          last7: bookingCount(bookingLast7, p.id),
          pending: bookingStatusCount(p.id, 'pending'),
          done: bookingsDone,
          no_show: bookingsNoShow,
          cancelled: bookingsCancelled,
        },
      };
    });

    // Totales globales
    const totals = {
      pages: pages.length,
      links: pageStats.reduce((s, p) => s + p.links_count, 0),
      menu_items: pageStats.reduce((s, p) => s + p.menu_count, 0),
      views: pageStats.reduce((s, p) => s + p.views, 0),
      views_last7: pageStats.reduce((s, p) => s + p.views_last7, 0),
      clicks: pageStats.reduce((s, p) => s + p.clicks, 0),
      clicks_last7: pageStats.reduce((s, p) => s + p.clicks_last7, 0),
      bookings: pageStats.reduce((s, p) => s + p.bookings.total, 0),
      bookings_upcoming: pageStats.reduce((s, p) => s + p.bookings.upcoming, 0),
      bookings_last7: pageStats.reduce((s, p) => s + p.bookings.last7, 0),
      bookings_pending: pageStats.reduce((s, p) => s + p.bookings.pending, 0),
      bookings_no_show: pageStats.reduce((s, p) => s + p.bookings.no_show, 0),
    };
    totals.ctr = totals.views > 0 ? Math.round((totals.clicks / totals.views) * 100) : null;

    // Top 5 links de todas las páginas
    const topLinksGlobal = pages
      .flatMap((p) => p.links.map((l) => ({ ...l, page_title: p.title, page_slug: p.slug })))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5)
      .map((l) => ({
        id: l.id,
        title: l.title,
        url: l.url,
        clicks: l.clicks,
        page_title: l.page_title,
        page_slug: l.page_slug,
      }));

    res.status(200).json({
      totals,
      pages: pageStats,
      top_links: topLinksGlobal,
      daily: dailyRaw, // [{day:'2026-07-01', type:'view'|'click', count}]
    });
  } catch (error) {
    console.error('getMyStats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// ========================================
// REGISTRAR VISITA DE PÁGINA (público)
// POST /api/public/track/view  body: { slug }
// ========================================
exports.trackView = async (req, res) => {
  const { slug } = req.body || {};

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Slug requerido' });
  }

  try {
    const page = await prisma.page.findUnique({
      where: { slug: slug.toLowerCase() },
      select: { id: true },
    });

    if (!page) {
      return res.status(404).json({ error: 'Página no encontrada' });
    }

    await prisma.statEvent.create({
      data: { page_id: page.id, type: 'view' },
    });

    res.status(200).json({ message: 'ok' });
  } catch (error) {
    console.error('trackView error:', error);
    res.status(500).json({ error: 'Error al registrar visita' });
  }
};
