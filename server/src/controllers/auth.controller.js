const prisma = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { email, password, username, display_name } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password_hash: hashedPassword,
        display_name,
      },
    });

    res.status(201).json({ message: 'Usuario creado exitosamente', userId: user.id });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'El email o username ya existe' });
    }
    res.status(500).json({ error: 'Error al registrar el usuario', details: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' } 
    );

    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión', details: error.message });
  }
};