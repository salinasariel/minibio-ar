const prisma = require('../models/db');

// ========================================
// OBTENER PÁGINA PÚBLICA POR SLUG (endpoint canónico del perfil)
// GET /api/public/page-by-slug/:slug
// ========================================
exports.getPageBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const page = await prisma.page.findUnique({
      where: { slug: String(slug).toLowerCase() },
      include: {
        links: { orderBy: { position: 'asc' } },
        menus: {
          where: { status: 'active' },
          orderBy: { created_at: 'asc' },
        },
        user: {
          select: { username: true, display_name: true, avatar_url: true },
        },
      },
    });

    if (!page) {
      return res.status(404).json({ error: 'Página no encontrada' });
    }

    // Reservas: habilitadas si el plan del dueño lo permite, la config está
    // activa y hay al menos un recurso reservable
    let bookingEnabled = false;
    try {
      const { getSettings } = require('../lib/booking');
      const { getUserPlan, planHasFeature } = require('../lib/plan');
      if (getSettings(page).enabled) {
        const plan = await getUserPlan(page.user_id);
        if (planHasFeature(plan, 'bookings')) {
          const resourceCount = await prisma.bookingResource.count({
            where: { page_id: page.id, active: true },
          });
          bookingEnabled = resourceCount > 0;
        }
      }
    } catch (e) {
      console.error('booking flag error:', e.message);
    }

    res.status(200).json({
      booking_enabled: bookingEnabled,
      profile: {
        username: page.user.username,
        display_name: page.user.display_name || page.user.username,
        avatar_url: page.avatar_url || page.user.avatar_url,
        title: page.title,
        slug: page.slug,
        bio: page.bio,
        whatsapp: page.whatsapp,
        address: page.address,
        payment_alias: page.payment_alias,
        payment_link: page.payment_link,
        reviews_url: page.reviews_url,
        hours: page.hours,
        theme: page.theme,
      },
      links: page.links,
      menus: page.menus,
    });
  } catch (error) {
    console.error('getPageBySlug error:', error);
    res.status(500).json({ error: 'Error al obtener la página' });
  }
};

// ========================================
// OBTENER PERFIL PÚBLICO POR USERNAME (primera página del usuario)
// GET /api/public/:username
// ========================================
exports.getPublicProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { username: String(username).toLowerCase() },
      select: {
        username: true,
        display_name: true,
        avatar_url: true,
        pages: {
          take: 1,
          orderBy: { created_at: 'asc' },
          include: {
            links: { orderBy: { position: 'asc' } },
            menus: { where: { status: 'active' }, orderBy: { created_at: 'asc' } },
          },
        },
      },
    });

    if (!user || user.pages.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const page = user.pages[0];

    res.status(200).json({
      profile: {
        username: user.username,
        display_name: user.display_name || user.username,
        avatar_url: page.avatar_url || user.avatar_url,
        title: page.title,
        slug: page.slug,
        bio: page.bio,
        whatsapp: page.whatsapp,
        address: page.address,
        payment_alias: page.payment_alias,
        payment_link: page.payment_link,
        reviews_url: page.reviews_url,
        hours: page.hours,
        theme: page.theme,
      },
      links: page.links,
      menus: page.menus,
    });
  } catch (error) {
    console.error('getPublicProfile error:', error);
    res.status(500).json({ error: 'Error al obtener perfil público' });
  }
};

// ========================================
// PARÁMETROS PÚBLICOS (i18n / textos), number_3 = 0
// ========================================
exports.getPublicParams = async (req, res) => {
  const { paramCode, language } = req.params;

  if (!paramCode || !language) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }

  try {
    const params = await prisma.minibioParam.findFirst({
      where: { param_code: paramCode, param_code_2: language, number_3: 0 },
    });

    if (!params) {
      return res.status(404).json({ error: 'Parámetro no encontrado' });
    }

    res.status(200).json({ param: params });
  } catch (error) {
    console.error('getPublicParams error:', error);
    res.status(500).json({ error: 'Error al obtener el parámetro' });
  }
};
