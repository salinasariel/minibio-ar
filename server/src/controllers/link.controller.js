const prisma = require('../models/db');

// Helper: verifica que la página exista y pertenezca al usuario
async function getOwnedPage(pageId, userId) {
  const id = parseInt(pageId, 10);
  if (Number.isNaN(id)) return null;
  return prisma.page.findFirst({ where: { id, user_id: userId } });
}

// ========================================
// CREAR LINK
// ========================================
exports.createLink = async (req, res) => {
  const { page_id, title, url } = req.body;
  const userId = req.user.userId;

  try {
    const page = await getOwnedPage(page_id, userId);
    if (!page) {
      return res.status(403).json({ error: 'No autorizado para modificar esta página' });
    }

    const maxPosition = await prisma.link.findFirst({
      where: { page_id: page.id },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const newLink = await prisma.link.create({
      data: {
        page_id: page.id,
        title,
        url,
        position: maxPosition ? maxPosition.position + 1 : 0,
      },
    });

    res.status(201).json(newLink);
  } catch (error) {
    console.error('createLink error:', error);
    res.status(500).json({ error: 'Error al crear el link' });
  }
};

// ========================================
// OBTENER LINKS DE UNA PÁGINA (privado: solo el dueño)
// ========================================
exports.getLinksByPage = async (req, res) => {
  const { pageId } = req.params;
  const userId = req.user.userId;

  try {
    const page = await getOwnedPage(pageId, userId);
    if (!page) {
      return res.status(404).json({ error: 'Página no encontrada' });
    }

    const links = await prisma.link.findMany({
      where: { page_id: page.id },
      orderBy: { position: 'asc' },
    });

    res.status(200).json({ links, page });
  } catch (error) {
    console.error('getLinksByPage error:', error);
    res.status(500).json({ error: 'Error al obtener los links' });
  }
};

// ========================================
// ACTUALIZAR LINK
// ========================================
exports.updateLink = async (req, res) => {
  const { id } = req.params;
  const { title, url } = req.body;
  const userId = req.user.userId;

  const linkId = parseInt(id, 10);
  if (Number.isNaN(linkId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      include: { page: true },
    });

    if (!link || link.page.user_id !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (url !== undefined) data.url = url;

    const updatedLink = await prisma.link.update({
      where: { id: linkId },
      data,
    });

    res.status(200).json(updatedLink);
  } catch (error) {
    console.error('updateLink error:', error);
    res.status(500).json({ error: 'Error al actualizar el link' });
  }
};

// ========================================
// ELIMINAR LINK
// ========================================
exports.deleteLink = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const linkId = parseInt(id, 10);
  if (Number.isNaN(linkId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      include: { page: true },
    });

    if (!link || link.page.user_id !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await prisma.link.delete({ where: { id: linkId } });

    res.status(200).json({ message: 'Link eliminado exitosamente' });
  } catch (error) {
    console.error('deleteLink error:', error);
    res.status(500).json({ error: 'Error al eliminar el link' });
  }
};

// ========================================
// REORDENAR LINKS (Drag & Drop)
// Verifica ownership de TODOS los links del payload
// ========================================
exports.reorderLinks = async (req, res) => {
  const { links } = req.body; // Array de {id, position}
  const userId = req.user.userId;

  try {
    const ids = links.map((l) => l.id);

    const dbLinks = await prisma.link.findMany({
      where: { id: { in: ids } },
      include: { page: { select: { user_id: true } } },
    });

    if (dbLinks.length !== ids.length || dbLinks.some((l) => l.page.user_id !== userId)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

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
    console.error('reorderLinks error:', error);
    res.status(500).json({ error: 'Error al reordenar links' });
  }
};

// ========================================
// INCREMENTAR CONTADOR DE CLICKS (Público)
// ========================================
exports.trackClick = async (req, res) => {
  const { id } = req.params;

  const linkId = parseInt(id, 10);
  if (Number.isNaN(linkId)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const link = await prisma.link.update({
      where: { id: linkId },
      data: { clicks: { increment: 1 } },
      select: { id: true, page_id: true },
    });

    // Evento con timestamp para las estadísticas (no bloqueante si falla)
    prisma.statEvent
      .create({ data: { page_id: link.page_id, link_id: link.id, type: 'click' } })
      .catch((e) => console.error('statEvent click error:', e.message));

    res.status(200).json({ message: 'Click registrado' });
  } catch (error) {
    // P2025 = registro no encontrado
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Link no encontrado' });
    }
    console.error('trackClick error:', error);
    res.status(500).json({ error: 'Error al registrar click' });
  }
};
