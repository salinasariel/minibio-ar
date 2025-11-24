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


// ========================================
// Parametros publicos, number_3 = 0
// ========================================

exports.getPublicParams = async (req, res) => {
  const { paramCode, language } = req.params;


  try {
    const params = await prisma.MinibioParam.findFirst({
      where: { param_code: paramCode, param_code_2: language, number_3: 0 }

    });

    if (!paramCode || !language) {
      return res.status(400).json({ error: "Faltan parámetros" });
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
        date_2: params.date_2
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener el parametro',
      details: error.message
    });
  }
};