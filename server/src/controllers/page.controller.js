const prisma = require('../models/db');

exports.getAllPages = async (req, res) => {
  try {
    const pages = await prisma.page.findMany({
      include: { links: true, menus: true }, 
    });
    res.status(200).json(pages);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las páginas' });
  }
};

exports.createPage = async (req, res) => {
  const { title, bio, theme } = req.body;
  const userId = req.user.userId; 

  try {
    const newPage = await prisma.page.create({
      data: {
        title,
        bio,
        theme,
        user_id: userId,
      },
    });
    res.status(201).json(newPage);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la página', details: error.message });
  }
};