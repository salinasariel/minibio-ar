const prisma = require('../models/db');

// ========================================
// OBTENER ESTADÍSTICAS DEL USUARIO
// ========================================
exports.getMyStats = async (req, res) => {
  const userId = req.user.userId;
  try {
    // ObtenerIDs de páginas del usuario
    const pages = await prisma.page.findMany({
      where: { user_id: userId },
      select: { id: true },
    });
    const pageIds = pages.map((p) => p.id);

    if (pageIds.length === 0) {
      return res.status(200).json({
        total_views: 0,
        total_clicks: 0,
        recent_views_30d: 0,
        top_pages_by_views: [],
        top_links_by_clicks: [],
      });
    }

    // Total visitas (page views)
    const totalViews = await prisma.pageView.count({
      where: { page_id: { in: pageIds } },
    });

    // Total clics (links)
    const totalClicksAgg = await prisma.link.aggregate({
      where: { page_id: { in: pageIds } },
      _sum: { clicks: true },
    });
    const totalClicks = totalClicksAgg._sum.clicks || 0;

    // Visitas en últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentViews = await prisma.pageView.count({
      where: {
        page_id: { in: pageIds },
        created_at: { gte: thirtyDaysAgo },
      },
    });

    // Top 5 páginas por vistas (unir Page + PageView)
    const viewsByPage = await prisma.pageView.groupBy({
      by: ['page_id'],
      where: { page_id: { in: pageIds } },
      _count: { page_id: true },
      orderBy: { _count: { page_id: 'desc' } },
      take: 5,
    });

    // Enriquecer con título de página
    const topPages = await Promise.all(
      viewsByPage.map(async (item) => {
        const page = await prisma.page.findUnique({
          where: { id: item.page_id },
          select: { title: true },
        });
        return {
          page_id: item.page_id,
          title: page?.title || 'Sin título',
          views: item._count.page_id,
        };
      })
    );

    // Top 5 links por clics
    const topLinks = await prisma.link.findMany({
      where: { page_id: { in: pageIds } },
      select: { id: true, title: true, url: true, clicks: true },
      orderBy: { clicks: 'desc' },
      take: 5,
    });

    res.status(200).json({
      total_views: totalViews,
      total_clicks: totalClicks,
      recent_views_30d: recentViews,
      top_pages_by_views: topPages,
      top_links_by_clicks: topLinks,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      details: error.message,
    });
  }
};

// ... (el resto del archivo original sin cambios)