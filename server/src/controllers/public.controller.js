const prisma = require('../models/db');

// ========================================
// OBTENER PERFIL PÚBLICO POR USERNAME + TRACKING
// ========================================
exports.getPublicProfile = async (req, res) => {
  const { username } = req.params;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        display_name: true,
        avatar_url: true,
        pages: {
          take: 1,
          include: {
            links: { orderBy: { position: 'asc' } },
          },
        },
      },
    });

    if (!user || user.pages.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const page = user.pages[0];

    // Registrar vista (fire and forget, no bloquea la respuesta)
    prisma.pageView.create({
      data: {
        page_id: page.id,
        ip,
        user_agent: userAgent,
      },
    }).catch((err) => console.error('Error registrando vista:', err));

    res.status(200).json({
      profile: {
        username: user.username,
        display_name: user.display_name || user.username,
        avatar_url: user.avatar_url,
        bio: page.bio,
        theme: page.theme,
      },
      links: page.links,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener perfil público',
      details: error.message
    });
  }
};

// ========================================
// OBTENER PÁGINA PÚBLICA POR ID (con tracking)
// ========================================
exports.getPublicPage = async (req, res) => {
  const { pageId } = req.params;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const page = await prisma.page.findUnique({
      where: { id: parseInt(pageId) },
      include: {
        links: { orderBy: { position: 'asc' } },
        user: {
          select: {
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
    });

    if (!page) {
      return res.status(404).json({ error: 'Página no encontrada' });
    }

    // Registrar vista
    prisma.pageView.create({
      data: {
        page_id: page.id,
        ip,
        user_agent: userAgent,
      },
    }).catch((err) => console.error('Error registrando vista:', err));

    res.status(200).json({
      profile: {
        username: page.user.username,
        display_name: page.user.display_name || page.user.username,
        avatar_url: page.user.avatar_url,
        bio: page.bio,
        theme: page.theme,
        title: page.title,
      },
      links: page.links,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener página pública',
      details: error.message
    });
  }
};

// ========================================
// ESTADÍSTICAS DEL USUARIO AUTENTICADO
// ========================================
exports.getMyStats = async (req, res) => {
  const userId = req.user.userId;
  try {
    // Obtener todas las páginas del usuario con IDs
    const pages = await prisma.page.findMany({
      where: { user_id: userId },
      select: { id: true },
    });
    const pageIds = pages.map((p) => p.id);

    // Total visitas (únicas por día podrían ser más elaboradas, por ahora count)
    const totalViews = await prisma.pageView.count({
      where: { page_id: { in: pageIds } },
    });

    // Total clics de todos los links de las páginas
    const totalClicks = await prisma.link.sum({
      where: { page_id: { in: pageIds } },
      field: 'clicks',
    }) || 0;

    // Visitas por página (top 5)
    const viewsByPage = await prisma.pageView.groupBy({
      by: ['page_id'],
      where: { page_id: { in: pageIds } },
      _count: { page_id: true },
      orderBy: { _count: { page_id: 'desc' } },
      take: 5,
    });

    // Clics por link (top 5)
    const clicksByLink = await prisma.link.findMany({
      where: { page_id: { in: pageIds } },
      select: { title: true, url: true, clicks: true },
      orderBy: { clicks: 'desc' },
      take: 5,
    });

    // Visit在上个月
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentViews = await prisma.pageView.count({
      where: {
        page_id: { in: pageIds },
        created_at: { gte: thirtyDaysAgo },
      },
    });

    res.status(200).json({
      total_views: totalViews,
      total_clicks: totalClicks,
      recent_views_30d: recentViews,
      top_pages_by_views: viewsByPage,
      top_links_by_clicks: clicksByLink,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      details: error.message,
    });
  }
};

// ========================================
// Parametros publicos, number_3 = 0
// ========================================
exports.getPublicParams = async (req, res) => {
  const { paramCode, language } = req.params;

  try {
    const params = await prisma.MinibioParam.findFirst({
      where: { param_code: paramCode, param_code_2: language, number_3: 0 },
    });

    if (!paramCode || !language) {
      return res.status(400).json({ error: 'Faltan parámetros' });
    }

    if (!params) {
      return res.status(404).json({ error: 'Parametro no encontrado' });
    }

    res.status(200).json({
      param: {
        param_code: params.param_code,
        param_code_2: params.param_code_2,
        varchar_1: params.varchar_1,
        varchar_2: params.varchar_2,
        varchar_3: params.varchar_3,
        json_1: params.json_1,
        number_1: params.number_1,
        number_2: params.number_2,
        number_3: params.number_3,
        date_1: params.date_1,
        date_2: params.date_2,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener el parametro',
      details: error.message,
    });
  }
};