const prisma = require('../models/db');

exports.createLink = async (req, res) => {
  const { page_id, title, url } = req.body;
  const userId = req.user.userId; 

  try {
    const page = await prisma.page.findUnique({
      where: { id: page_id },
    });

    if (!page || page.user_id !== userId) {
      return res.status(403).json({ error: 'No autorizado para modificar esta página' });
    }

    const newLink = await prisma.link.create({
      data: {
        page_id,
        title,
        url,
      },
    });
    res.status(201).json(newLink);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el link', details: error.message });
  }
};