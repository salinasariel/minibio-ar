const prisma = require('../models/db');

// ========================================
// OBTENER PERFIL PÚBLICO POR USERNAME
// ========================================
exports.getPublicProfile = async (req, res) => {
  const { username } = req.params;

  try {
    // Buscar usuario por username
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        display_name: true,
        avatar_url: true,
        pages: {
          take: 1, // Solo tomamos la primera página por ahora
          include: {
            links: {
              orderBy: { position: 'asc' },
            },
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
// OBTENER PÁGINA PÚBLICA POR ID (Alternativa)
// ========================================
exports.getPublicPage = async (req, res) => {
  const { pageId } = req.params;

  try {
    const page = await prisma.page.findUnique({
      where: { id: parseInt(pageId) },
      include: {
        links: {
          orderBy: { position: 'asc' },
        },
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