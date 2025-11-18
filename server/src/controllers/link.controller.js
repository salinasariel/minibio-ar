const prisma = require('../models/db');

// ========================================
// CREAR LINK
// ========================================
exports.createLink = async (req, res) => {
  const { page_id, title, url } = req.body;
  const userId = req.user.userId;

  try {
    // Verificar que la página pertenece al usuario
    const page = await prisma.page.findUnique({
      where: { id: page_id },
    });

    if (!page || page.user_id !== userId) {
      return res.status(403).json({ error: 'No autorizado para modificar esta página' });
    }

    // Obtener la posición máxima actual
    const maxPosition = await prisma.link.findFirst({
      where: { page_id },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const newLink = await prisma.link.create({
      data: {
        page_id,
        title,
        url,
        position: maxPosition ? maxPosition.position + 1 : 0,
      },
    });

    res.status(201).json(newLink);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el link', details: error.message });
  }
};

// ========================================
// OBTENER LINKS DE UNA PÁGINA
// ========================================
exports.getLinksByPage = async (req, res) => {
  const { pageId } = req.params;
  const userId = req.user.userId;

  try {
    // Verificar que la página pertenece al usuario
    const page = await prisma.page.findUnique({
      where: { id: parseInt(pageId) },
    });

    if (!page || page.user_id !== userId) {
      return res.status(403).json({ error: 'No autorizado para ver esta página' });
    }

    const links = await prisma.link.findMany({
      where: { page_id: parseInt(pageId) },
      orderBy: { position: 'asc' },
    });

    res.status(200).json(links);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los links', details: error.message });
  }
};

// ========================================
// ACTUALIZAR LINK
// ========================================
exports.updateLink = async (req, res) => {
  const { id } = req.params;
  const { title, url } = req.body;
  const userId = req.user.userId;

  try {
    // Verificar que el link pertenece a una página del usuario
    const link = await prisma.link.findUnique({
      where: { id: parseInt(id) },
      include: { page: true },
    });

    if (!link || link.page.user_id !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const updatedLink = await prisma.link.update({
      where: { id: parseInt(id) },
      data: { title, url },
    });

    res.status(200).json(updatedLink);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el link', details: error.message });
  }
};

// ========================================
// ELIMINAR LINK
// ========================================
exports.deleteLink = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    // Verificar que el link pertenece a una página del usuario
    const link = await prisma.link.findUnique({
      where: { id: parseInt(id) },
      include: { page: true },
    });

    if (!link || link.page.user_id !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await prisma.link.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ message: 'Link eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el link', details: error.message });
  }
};

// ========================================
// REORDENAR LINKS (Drag & Drop)
// ========================================
exports.reorderLinks = async (req, res) => {
  const { links } = req.body; // Array de {id, position}
  const userId = req.user.userId;

  try {
    // Verificar que el primer link pertenece al usuario
    if (links.length > 0) {
      const firstLink = await prisma.link.findUnique({
        where: { id: links[0].id },
        include: { page: true },
      });

      if (!firstLink || firstLink.page.user_id !== userId) {
        return res.status(403).json({ error: 'No autorizado' });
      }
    }

    // Actualizar todas las posiciones en una transacción
    await prisma.$transaction(
      links.map((link) =>
        prisma.link.update({
          where: { id: link.id },
          data: { position: link.position },
        })
      )
    );

    res.status(200).json({ message: 'Links reordenados exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al reordenar links', details: error.message });
  }
};

// ========================================
// INCREMENTAR CONTADOR DE CLICKS (Público)
// ========================================
exports.trackClick = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.link.update({
      where: { id: parseInt(id) },
      data: { clicks: { increment: 1 } },
    });

    res.status(200).json({ message: 'Click registrado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar click' });
  }
};