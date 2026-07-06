const prisma = require('../models/db');

async function getOwnedPage(pageId, userId) {
  const id = parseInt(pageId, 10);
  if (Number.isNaN(id)) return null;
  return prisma.page.findFirst({ where: { id, user_id: userId } });
}

// Trae un ítem de menú verificando que pertenezca al usuario
async function getOwnedMenuItem(menuId, userId) {
  const id = parseInt(menuId, 10);
  if (Number.isNaN(id)) return null;
  const item = await prisma.menu.findUnique({
    where: { id },
    include: { page: { select: { user_id: true } } },
  });
  if (!item || item.page.user_id !== userId) return null;
  return item;
}

// ========================================
// CREAR ÍTEM DE MENÚ
// POST /api/menus
// ========================================
exports.createMenuItem = async (req, res) => {
  const { page_id, product_name, product_description, category, image, price, status } = req.body;
  const userId = req.user.userId;

  try {
    const page = await getOwnedPage(page_id, userId);
    if (!page) {
      return res.status(403).json({ error: 'No autorizado para modificar esta página' });
    }

    const item = await prisma.menu.create({
      data: {
        page_id: page.id,
        product_name,
        product_description: product_description || null,
        category: category || null,
        image: image || null,
        price: price ?? null,
        status: status || 'active',
      },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('createMenuItem error:', error);
    res.status(500).json({ error: 'Error al crear el ítem del menú' });
  }
};

// ========================================
// LISTAR MENÚ DE UNA PÁGINA (privado: dueño)
// GET /api/menus/page/:pageId
// ========================================
exports.getMenuByPage = async (req, res) => {
  const { pageId } = req.params;
  const userId = req.user.userId;

  try {
    const page = await getOwnedPage(pageId, userId);
    if (!page) {
      return res.status(404).json({ error: 'Página no encontrada' });
    }

    const items = await prisma.menu.findMany({
      where: { page_id: page.id },
      orderBy: { created_at: 'asc' },
    });

    res.status(200).json({ items, page });
  } catch (error) {
    console.error('getMenuByPage error:', error);
    res.status(500).json({ error: 'Error al obtener el menú' });
  }
};

// ========================================
// ACTUALIZAR ÍTEM
// PUT /api/menus/:id
// ========================================
exports.updateMenuItem = async (req, res) => {
  const { id } = req.params;
  const { product_name, product_description, category, image, price, status } = req.body;
  const userId = req.user.userId;

  try {
    const item = await getOwnedMenuItem(id, userId);
    if (!item) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const data = {};
    if (product_name !== undefined) data.product_name = product_name;
    if (product_description !== undefined) data.product_description = product_description;
    if (category !== undefined) data.category = category || null;
    if (image !== undefined) data.image = image || null;
    if (price !== undefined) data.price = price;
    if (status !== undefined) data.status = status;

    const updated = await prisma.menu.update({
      where: { id: item.id },
      data,
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error('updateMenuItem error:', error);
    res.status(500).json({ error: 'Error al actualizar el ítem' });
  }
};

// ========================================
// ELIMINAR ÍTEM
// DELETE /api/menus/:id
// ========================================
exports.deleteMenuItem = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const item = await getOwnedMenuItem(id, userId);
    if (!item) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await prisma.menu.delete({ where: { id: item.id } });

    res.status(200).json({ message: 'Ítem eliminado exitosamente' });
  } catch (error) {
    console.error('deleteMenuItem error:', error);
    res.status(500).json({ error: 'Error al eliminar el ítem' });
  }
};
