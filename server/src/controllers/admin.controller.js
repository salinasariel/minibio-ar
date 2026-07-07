const prisma = require('../models/db');
const bcrypt = require('bcryptjs');
const { FEATURES, FEATURE_KEYS } = require('../lib/plan');

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
        plan: { select: { id: true, code: true, name: true } },
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
  const { display_name, email_verified, ai_enabled, plan_id } = req.body;

  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const data = {};
    if (display_name !== undefined) data.display_name = String(display_name).slice(0, 60) || null;
    if (typeof email_verified === 'boolean') data.email_verified = email_verified;
    if (typeof ai_enabled === 'boolean') data.ai_enabled = ai_enabled;

    // Asignar / quitar plan (null = vuelve al default)
    if (plan_id !== undefined) {
      if (plan_id === null) {
        data.plan_id = null;
      } else {
        const pid = parseInt(plan_id, 10);
        const plan = await prisma.plan.findUnique({ where: { id: pid } });
        if (!plan) return res.status(400).json({ error: 'Plan inexistente' });
        data.plan_id = pid;
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, email: true, username: true, display_name: true,
        email_verified: true, ai_enabled: true, is_admin: true, created_at: true,
        plan: { select: { id: true, code: true, name: true } },
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
// PLANES: listar (con catálogo de features)
// GET /api/admin/plans
// ========================================
exports.listPlans = async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { users: true } } },
    });
    res.status(200).json({ plans, catalog: FEATURES });
  } catch (error) {
    console.error('admin listPlans error:', error);
    res.status(500).json({ error: 'Error al listar planes' });
  }
};

// ========================================
// PLANES: modificar (nombre, features, límites)
// PUT /api/admin/plans/:id
// ========================================
exports.updatePlan = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, features, max_pages, max_links } = req.body;

  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const data = {};
    if (name !== undefined) {
      const n = String(name).trim().slice(0, 40);
      if (!n) return res.status(400).json({ error: 'Nombre requerido' });
      data.name = n;
    }
    if (features !== undefined) {
      if (!Array.isArray(features) || features.some((f) => !FEATURE_KEYS.includes(f))) {
        return res.status(400).json({ error: 'Features inválidas' });
      }
      data.features = features;
    }
    if (max_pages !== undefined) {
      const v = parseInt(max_pages, 10);
      if (Number.isNaN(v) || v < 1 || v > 100) return res.status(400).json({ error: 'max_pages inválido (1-100)' });
      data.max_pages = v;
    }
    if (max_links !== undefined) {
      const v = parseInt(max_links, 10);
      if (Number.isNaN(v) || v < 1 || v > 500) return res.status(400).json({ error: 'max_links inválido (1-500)' });
      data.max_links = v;
    }

    const plan = await prisma.plan.update({
      where: { id },
      data,
      include: { _count: { select: { users: true } } },
    });

    res.status(200).json(plan);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Plan no encontrado' });
    console.error('admin updatePlan error:', error);
    res.status(500).json({ error: 'Error al modificar el plan' });
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
