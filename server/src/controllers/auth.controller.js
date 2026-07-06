const prisma = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const TOKEN_EXPIRY = '7d';

const signToken = (user) =>
  jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  display_name: user.display_name,
  ai_enabled: user.ai_enabled || false,
});

const generateToken = (length = 32) => crypto.randomBytes(length).toString('hex');

// ========================================
// HELPER: ENVÍO DE EMAIL (SMTP config)
// ========================================
const smtpConfigured = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM);
};

async function sendEmail(to, subject, html) {
  if (!smtpConfigured()) {
    console.log('SMTP no configurado, skipping email');
    return;
  }

  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
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

// ========================================
// REGISTRO
// Con SMTP configurado: requiere verificación por email.
// Sin SMTP (dev): auto-verifica y devuelve token (auto-login).
// ========================================
exports.register = async (req, res) => {
  const { email, password, username, display_name } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const requiresVerification = smtpConfigured();
    const verificationToken = requiresVerification ? generateToken() : null;

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password_hash: hashedPassword,
        display_name: display_name || username,
        email_verified: !requiresVerification,
        verification_token: verificationToken,
        token_expires: requiresVerification
          ? new Date(Date.now() + 24 * 60 * 60 * 1000)
          : null,
      },
    });

    if (requiresVerification) {
      await sendVerificationEmail(email, verificationToken).catch((err) => {
        console.error('Error enviando email de verificación:', err);
      });

      return res.status(201).json({
        message: 'Usuario creado exitosamente. Revisa tu email para verificar.',
        requiresVerification: true,
      });
    }

    // Sin verificación: auto-login
    const token = signToken(user);
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      token,
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'El email o username ya existe' });
    }
    console.error('register error:', error);
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
};

// ========================================
// LOGIN (exige email verificado)
// ========================================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Respuesta genérica: no revelar si el email existe o no
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        error: 'Por favor verifica tu email antes de iniciar sesión',
        requiresVerification: true,
      });
    }

    const token = signToken(user);

    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
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
    console.error('verifyEmail error:', error);
    res.status(500).json({ error: 'Error al verificar email' });
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
    const user = await prisma.user.findUnique({ where: { email } });

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
    console.error('resendVerification error:', error);
    res.status(500).json({ error: 'Error al reenviar verificación' });
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
    const user = await prisma.user.findUnique({ where: { email } });

    // Si no existe, no informamos para evitar enumeration
    if (!user) {
      return res.status(200).json({ message: 'Si el email existe, se ha enviado el enlace de recuperación' });
    }

    const resetToken = generateToken();

    await prisma.passwordReset.create({
      data: {
        user_id: user.id,
        token: resetToken,
        expires_at: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hora
      },
    });

    await sendPasswordResetEmail(email, resetToken).catch((err) => {
      console.error('Error enviando email de recuperación:', err);
    });

    res.status(200).json({ message: 'Si el email existe, se ha enviado el enlace de recuperación' });
  } catch (error) {
    console.error('forgotPassword error:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
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
    console.error('verifyResetToken error:', error);
    res.status(500).json({ error: 'Error al verificar token' });
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

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: passwordReset.user_id },
      data: { password_hash: hashedPassword },
    });

    await prisma.passwordReset.update({
      where: { id: passwordReset.id },
      data: { used_at: new Date() },
    });

    res.status(200).json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
};
