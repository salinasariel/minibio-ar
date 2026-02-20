const prisma = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ========================================
// VALIDACIONES
// ========================================
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

// ========================================
// HELPER: ENVÍO DE EMAIL (SMTP config)
// ========================================
async function sendEmail(to, subject, html) {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
    APP_URL = 'http://localhost:3000',
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    console.log('SMTP no configurado, skipping email');
    return;
  }

  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT),
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html,
  });
}

async function sendVerificationEmail(email, token) {
  const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  await sendEmail(email, 'Verifica tu email en MiniBio.ar', `
    <h1>Bienvenido a MiniBio.ar</h1>
    <p>Haz clic en el siguiente enlace para verificar tu email:</p>
    <a href="${verificationUrl}">${verificationUrl}</a>
    <p>Si no solicitaste esta cuenta, ignora este email.</p>
  `);
}

async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  await sendEmail(email, 'Recuperar contraseña - MiniBio.ar', `
    <h1>Recuperación de contraseña</h1>
    <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>El enlace expira en 1 hora.</p>
    <p>Si no solicitaste este cambio, ignora este email.</p>
  `);
}

function generateToken(length = 32) {
  return require('crypto').randomBytes(length).toString('hex');
}

// ========================================
// REGISTRO
// ========================================
exports.register = async (req, res) => {
  const { email, password, username, display_name } = req.body;

  const validationErrors = validateRegister({ email, password, username });
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateToken();

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password_hash: hashedPassword,
        display_name: display_name || username,
        email_verified: false,
        verification_token: verificationToken,
        token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail(email, verificationToken).catch((err) => {
      console.error('Error enviando email de verificación:', err);
    });

    res.status(201).json({
      message: 'Usuario creado exitosamente. Revisa tu email para verificar.',
      userId: user.id,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'El email o username ya existe' });
    }
    res.status(500).json({ error: 'Error al registrar el usuario', details: error.message });
  }
};

// ========================================
// LOGIN (exigir email verificado)
// ========================================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!user.email_verified) {
      return res.status(403).json({ error: 'Por favor verifica tu email antes de iniciar sesión' });
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

// ========================================
// VERIFICAR EMAIL
// ========================================
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token no proporcionado' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { verification_token: token },
    });

    if (!user) {
      return res.status(404).json({ error: 'Token inválido o expirado' });
    }

    if (user.token_expires && new Date() > user.token_expires) {
      return res.status(410).json({ error: 'Token expirado' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email_verified: true,
        verification_token: null,
        token_expires: null,
      },
    });

    res.status(200).json({ message: 'Email verificado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar email', details: error.message });
  }
};

// ========================================
// REENVIAR EMAIL DE VERIFICACIÓN (sin auth)
// ========================================
exports.resendVerification = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email requerido' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Si no existe o ya verificado, respondemos OK para evitar enumeration
    if (!user || user.email_verified) {
      return res.status(200).json({ message: 'Si el email existe y no está verificado, se ha reenviado el enlace' });
    }

    const verificationToken = generateToken();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verification_token: verificationToken,
        token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail(user.email, verificationToken).catch((err) => {
      console.error('Error reenviando email de verificación:', err);
    });

    res.status(200).json({ message: 'Email de verificación reenviado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al reenviar verificación', details: error.message });
  }
};

// ========================================
// SOLICITAR RECUPERACIÓN DE CONTRASEÑA
// ========================================
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email requerido' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Si no existe, no informamos para evitar enumeration
    if (!user) {
      return res.status(200).json({ message: 'Si el email existe, se ha enviado el enlace de recuperación' });
    }

    // Generar token de reset
    const resetToken = generateToken();

    // Crear registro de password reset
    await prisma.passwordReset.create({
      data: {
        user_id: user.id,
        token: resetToken,
        expires_at: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hora
      },
    });

    // Enviar email
    await sendPasswordResetEmail(email, resetToken).catch((err) => {
      console.error('Error enviando email de recuperación:', err);
    });

    res.status(200).json({ message: 'Si el email existe, se ha enviado el enlace de recuperación' });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la solicitud', details: error.message });
  }
};

// ========================================
// VERIFICAR TOKEN DE RESET (para mostrar formulario)
// ========================================
exports.verifyResetToken = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token no proporcionado' });
  }

  try {
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!passwordReset) {
      return res.status(404).json({ error: 'Token inválido' });
    }

    if (passwordReset.expires_at < new Date()) {
      return res.status(410).json({ error: 'Token expirado' });
    }

    if (passwordReset.used_at) {
      return res.status(410).json({ error: 'Token ya utilizado' });
    }

    res.status(200).json({ valid: true, email: passwordReset.user.email });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar token', details: error.message });
  }
};

// ========================================
// RESTABLECER CONTRASEÑA
// ========================================
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
  }

  // Validar password (misma lógica que en registro)
  if (password.length < 8) {
    return res.status(400).json({ errors: ['Password debe tener al menos 8 caracteres'] });
  } else {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
      return res.status(400).json({ errors: ['Password debe incluir mayúscula, minúscula, número y carácter especial'] });
    }
  }

  try {
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!passwordReset) {
      return res.status(404).json({ error: 'Token inválido' });
    }

    if (passwordReset.expires_at < new Date()) {
      return res.status(410).json({ error: 'Token expirado' });
    }

    if (passwordReset.used_at) {
      return res.status(410).json({ error: 'Token ya utilizado' });
    }

    // Hash nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Actualizar contraseña del usuario
    await prisma.user.update({
      where: { id: passwordReset.user_id },
      data: { password_hash: hashedPassword },
    });

    // Marcar token como usado
    await prisma.passwordReset.update({
      where: { id: passwordReset.id },
      data: { used_at: new Date() },
    });

    res.status(200).json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al restablecer la contraseña', details: error.message });
  }
};