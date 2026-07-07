const prisma = require('../models/db');
const bcrypt = require('bcryptjs');

// ========================================
// LISTAR USUARIOS (con búsqueda y conteo de páginas)
// GET /api/admin/users?search=
// ========================================
exports.listUsers = async (req, res) => {
  const search = (req.query.search || '').trim();

  try {
    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { username: { contains: search, mode: 'insensitive' } },
              { display_name: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        email_verified: true,
        ai_enabled: true,
        is_admin: true,
        created_at: true,
        _count: { select: { pages: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 200,
    });

    res.status(200).json(users);
  } catch (error) {
    console.error('admin listUsers error:', error);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
};

// ========================================
// CREAR USUARIO (alta manual, ya verificado)
// POST /api/admin/users
// ========================================
exports.createUser = async (req, res) => {
  const { email, password, username, display_name } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password_hash: hashedPassword,
        display_name: display_name || username,
        email_verified: true, // alta manual = confiamos en el admin
      },
      select: { id: true, email: true, username: true },
    });

    res.status(201).json(user);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'El email o username ya existe' });
    }
    console.error('admin createUser error:', error);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

// ========================================
// MODIFICAR USUARIO (nombre, verificación, IA)
// PUT /api/admin/users/:id
// Nota: is_admin NO se toca desde acá, solo por DB.
// ========================================
exports.updateUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { display_name, email_verified, ai_enabled } = req.body;

  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const data = {};
    if (display_name !== undefined) data.display_name = String(display_name).slice(0, 60) || null;
    if (typeof email_verified === 'boolean') data.email_verified = email_verified;
    if (typeof ai_enabled === 'boolean') data.ai_enabled = ai_enabled;

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, email: true, username: true, display_name: true,
        email_verified: true, ai_enabled: true, is_admin: true, created_at: true,
        _count: { select: { pages: true } },
      },
    });

    res.status(200).json(user);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Usuario no encontrado' });
    console.error('admin updateUser error:', error);
    res.status(500).json({ error: 'Error al modificar el usuario' });
  }
};

// ========================================
// ELIMINAR USUARIO (baja; cascade borra páginas, links, etc.)
// DELETE /api/admin/users/:id
// ========================================
exports.deleteUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  if (id === req.user.userId) {
    return res.status(400).json({ error: 'No podés borrar tu propia cuenta desde acá' });
  }

  try {
    const target = await prisma.user.findUnique({ where: { id }, select: { is_admin: true } });
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (target.is_admin) {
      return res.status(400).json({ error: 'No se puede borrar a otro admin desde el panel' });
    }

    await prisma.user.delete({ where: { id } });
    res.status(200).json({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error('admin deleteUser error:', error);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
};

// ========================================
// PÁGINAS DE UN USUARIO
// GET /api/admin/users/:id/pages
// ========================================
exports.listUserPages = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const pages = await prisma.page.findMany({
      where: { user_id: id },
      select: {
        id: true,
        title: true,
        slug: true,
        created_at: true,
        _count: { select: { links: true, menus: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    res.status(200).json(pages);
  } catch (error) {
    console.error('admin listUserPages error:', error);
    res.status(500).json({ error: 'Error al listar páginas' });
  }
};

// ========================================
// ELIMINAR PÁGINA DE CUALQUIER USUARIO
// DELETE /api/admin/pages/:id
// ========================================
exports.deletePage = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    await prisma.page.delete({ where: { id } });
    res.status(200).json({ message: 'Página eliminada' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Página no encontrada' });
    console.error('admin deletePage error:', error);
    res.status(500).json({ error: 'Error al eliminar la página' });
  }
};
