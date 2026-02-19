const prisma = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Validación helper
function validateRegister(data) {
  const errors = [];

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email inválido');
  }

  if (!data.username || !/^[a-zA-Z0-9_-]{3,30}$/.test(data.username)) {
    errors.push('Username debe tener 3-30 caracteres, solo letras, números, guiones y guiones bajos');
  }

  if (!data.password || data.password.length < 8) {
    errors.push('Password debe tener al menos 8 caracteres');
  } else {
    const hasUpper = /[A-Z]/.test(data.password);
    const hasLower = /[a-z]/.test(data.password);
    const hasNumber = /[0-9]/.test(data.password);
    const hasSpecial = /[^A-Za-z0-9]/.test(data.password);
    if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
      errors.push('Password debe incluir mayúscula, minúscula, número y carácter especial');
    }
  }

  return errors;
}

exports.register = async (req, res) => {
  const { email, password, username, display_name } = req.body;

  const validationErrors = validateRegister({ email, password, username });
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password_hash: hashedPassword,
        display_name: display_name || username,
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