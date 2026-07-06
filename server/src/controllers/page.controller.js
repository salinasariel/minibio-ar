const prisma = require('../models/db');
const { uniqueSlug } = require('../lib/slug');

// ========================================
// CREAR NUEVA PÁGINA
// ========================================
exports.createPage = async (req, res) => {
  const { title, bio, theme, slug, avatar_url } = req.body;
  const userId = req.user.userId;

  try {
    const finalSlug = await uniqueSlug(slug || title);

    const newPage = await prisma.page.create({
      data: {
        title,
        slug: finalSlug,
        bio: bio || '',
        avatar_url: avatar_url || null,
        theme: theme || null,
        user_id: userId,
      },
      include: { links: true },
    });
    res.status(201).json(newPage);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ese slug ya está en uso' });
    }
    console.error('createPage error:', error);
    res.status(500).json({ error: 'Error al crear la página' });
  }
};

// ========================================
// OBTENER MIS PÁGINAS
// ========================================
exports.getMyPages = async (req, res) => {
  const userId = req.user.userId;

  try {
    const pages = await prisma.page.findMany({
      where: { user_id: userId },
      include: {
        links: { orderBy: { position: 'asc' } },
      },
      orderBy: { created_at: 'desc' },
    });

    res.status(200).json(pages);
  } catch (error) {
    console.error('getMyPages error:', error);
    res.status(500).json({ error: 'Error al obtener las páginas' });
  }
};

// ========================================
// OBTENER UNA PÁGINA ESPECÍFICA (del usuario autenticado)
// ========================================
exports.getPageById = async (req, res) => {
  const { pageId } = req.params;
  const userId = req.user.userId;

  const id = parseInt(pageId, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID de página inválido' });
  }

  try {
    const page = await prisma.page.findFirst({
      where: { id, user_id: userId },
      include: {
        links: { orderBy: { position: 'asc' } },
        menus: { orderBy: { created_at: 'asc' } },
      },
    });

    if (!page) {
      return res.status(404).json({ error: 'Página no encontrada' });
    }

    res.status(200).json(page);
  } catch (error) {
    console.error('getPageById error:', error);
    res.status(500).json({ error: 'Error al obtener la página' });
  }
};

// ========================================
// ACTUALIZAR PÁGINA
// ========================================
exports.updatePage = async (req, res) => {
  const { pageId } = req.params;
  const { title, bio, theme, slug, avatar_url } = req.body;
  const userId = req.user.userId;

  const id = parseInt(pageId, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID de página inválido' });
  }

  try {
    const page = await prisma.page.findFirst({
      where: { id, user_id: userId },
    });

    if (!page) {
      return res.status(404).json({ error: 'Página no encontrada' });
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (bio !== undefined) data.bio = bio;
    if (avatar_url !== undefined) data.avatar_url = avatar_url || null;
    if (theme !== undefined) data.theme = theme;
    if (slug !== undefined && slug !== page.slug) {
      data.slug = await uniqueSlug(slug, page.id);
    }

    const updatedPage = await prisma.page.update({
      where: { id },
      data,
    });

    res.status(200).json(updatedPage);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ese slug ya está en uso' });
    }
    console.error('updatePage error:', error);
    res.status(500).json({ error: 'Error al actualizar la página' });
  }
};

// ========================================
// ELIMINAR PÁGINA
// ========================================
exports.deletePage = async (req, res) => {
  const { pageId } = req.params;
  const userId = req.user.userId;

  const id = parseInt(pageId, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID de página inválido' });
  }

  try {
    const page = await prisma.page.findFirst({
      where: { id, user_id: userId },
    });

    if (!page) {
      return res.status(404).json({ error: 'Página no encontrada' });
    }

    await prisma.page.delete({ where: { id } });

    res.status(200).json({ message: 'Página eliminada exitosamente' });
  } catch (error) {
    console.error('deletePage error:', error);
    res.status(500).json({ error: 'Error al eliminar la página' });
  }
};
