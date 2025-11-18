const prisma = require('../models/db');

// ========================================
// OBTENER TODAS LAS PÁGINAS (Admin - opcional)
// ========================================
exports.getAllPages = async (req, res) => {
  try {
    const pages = await prisma.page.findMany({
      include: { 
        links: true, 
        menus: true, 
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
    res.status(200).json(pages);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las páginas' });
  }
};

// ========================================
// CREAR NUEVA PÁGINA
// ========================================
exports.createPage = async (req, res) => {
  const { title, bio, theme } = req.body;
  const userId = req.user.userId;

  try {
    const newPage = await prisma.page.create({
      data: {
        title,
        bio: bio || '',
        theme: theme || null,
        user_id: userId,
      },
    });
    res.status(201).json(newPage);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la página', details: error.message });
  }
};

// ========================================
// OBTENER MIS PÁGINAS
// ========================================
exports.getMyPages = async (req, res) => {
  const userId = req.user.userId;

  try {
    const pages = await prisma.page.findMany({
      where: {
        user_id: userId,
      },
      include: {
        links: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    res.status(200).json(pages);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener las páginas', 
      details: error.message 
    });
  }
};

// ========================================
// OBTENER UNA PÁGINA ESPECÍFICA (Del usuario autenticado)
// ========================================
exports.getPageById = async (req, res) => {
  const { pageId } = req.params;
  const userId = req.user.userId;

  try {
    const page = await prisma.page.findFirst({
      where: {
        id: parseInt(pageId),
        user_id: userId,
      },
      include: {
        links: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!page) {
      return res.status(404).json({ error: 'Página no encontrada' });
    }

    res.status(200).json(page);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener la página', 
      details: error.message 
    });
  }
};

// ========================================
// ACTUALIZAR PÁGINA
// ========================================
exports.updatePage = async (req, res) => {
  const { pageId } = req.params;
  const { title, bio, theme } = req.body;
  const userId = req.user.userId;

  try {
    // Verificar propiedad
    const page = await prisma.page.findFirst({
      where: {
        id: parseInt(pageId),
        user_id: userId,
      },
    });

    if (!page) {
      return res.status(404).json({ error: 'Página no encontrada' });
    }

    const updatedPage = await prisma.page.update({
      where: { id: parseInt(pageId) },
      data: { title, bio, theme },
    });

    res.status(200).json(updatedPage);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al actualizar la página', 
      details: error.message 
    });
  }
};

// ========================================
// ELIMINAR PÁGINA
// ========================================
exports.deletePage = async (req, res) => {
  const { pageId } = req.params;
  const userId = req.user.userId;

  try {
    // Verificar propiedad
    const page = await prisma.page.findFirst({
      where: {
        id: parseInt(pageId),
        user_id: userId,
      },
    });

    if (!page) {
      return res.status(404).json({ error: 'Página no encontrada' });
    }

    await prisma.page.delete({
      where: { id: parseInt(pageId) },
    });

    res.status(200).json({ message: 'Página eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al eliminar la página', 
      details: error.message 
    });
  }
};