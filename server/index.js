require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ========================================
// CHEQUEO DE VARIABLES DE ENTORNO
// ========================================
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`❌ Faltan variables de entorno: ${missing.join(', ')}`);
  process.exit(1);
}

const isProd = process.env.NODE_ENV === 'production';
const app = express();

// Confía en el proxy (Railway/Render) para que rate-limit vea la IP real
app.set('trust proxy', 1);

// ========================================
// MIDDLEWARES GLOBALES
// ========================================
app.use(helmet());

// CORS: en producción, solo orígenes de la whitelist (CORS_ORIGINS separados por coma)
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors(
    isProd && corsOrigins.length > 0
      ? {
          origin: (origin, cb) => {
            // Permitir requests sin Origin (curl, apps móviles) y subdominios del root domain
            if (!origin) return cb(null, true);
            const allowed = corsOrigins.some((o) =>
              o.startsWith('*.')
                ? origin.endsWith(o.slice(1)) // "*.minibio.ar" → acepta cualquier subdominio
                : origin === o
            );
            cb(allowed ? null : new Error('No permitido por CORS'), allowed);
          },
        }
      : {} // desarrollo: abierto
  )
);

// 2mb: las imágenes del menú viajan como data-URL base64 comprimidas en el cliente
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Rate limiting general
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120, // 120 req/min por IP
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Rate limiting estricto para auth (anti fuerza bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 intentos cada 15 min por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos, probá de nuevo más tarde' },
});

// ========================================
// HEALTH CHECK
// ========================================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MiniBio API funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// RUTAS
// ========================================
const authRoutes = require('./src/routes/auth.routes');
const pageRoutes = require('./src/routes/page.routes');
const linkRoutes = require('./src/routes/link.routes');
const menuRoutes = require('./src/routes/menu.routes');
const statsRoutes = require('./src/routes/stats.routes');
const aiRoutes = require('./src/routes/ai.routes');
const publicRoutes = require('./src/routes/public.routes');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/public', publicRoutes);

// ========================================
// MANEJO DE RUTAS NO ENCONTRADAS
// ========================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method,
  });
});

// ========================================
// MANEJO DE ERRORES GLOBAL
// ========================================
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    ...(isProd ? {} : { message: err.message }),
  });
});

// ========================================
// INICIAR SERVIDOR
// ========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 MiniBio API en http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
});
