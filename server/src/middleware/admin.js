const prisma = require('../models/db');

// Verifica contra la DB (no contra el JWT) que el usuario sea admin.
// Así, quitar el flag por DB revoca el acceso al instante.
const requireAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { is_admin: true },
    });

    if (!user?.is_admin) {
      return res.status(403).json({ error: 'Acceso solo para administradores' });
    }

    next();
  } catch (error) {
    console.error('requireAdmin error:', error);
    res.status(500).json({ error: 'Error de autorización' });
  }
};

module.exports = requireAdmin;
