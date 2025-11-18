require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// ========================================
// MIDDLEWARES GLOBALES
// ========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// HEALTH CHECK
// ========================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '🚀 MiniBio API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// ========================================
// RUTAS
// ========================================
const authRoutes = require('./src/routes/auth.routes');
const pageRoutes = require('./src/routes/page.routes');
const linkRoutes = require('./src/routes/link.routes');
const publicRoutes = require('./src/routes/public.routes');

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de páginas (protegidas)
app.use('/api/pages', pageRoutes);

// Rutas de links (protegidas)
app.use('/api/links', linkRoutes);

// Rutas públicas (sin autenticación)
app.use('/api/public', publicRoutes);

// ========================================
// RUTA PARA LISTAR TODOS LOS ENDPOINTS (Debug)
// ========================================
app.get('/api/routes', (req, res) => {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods).join(', ').toUpperCase(),
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const path = middleware.regexp.source
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '')
            .replace(/\\\//g, '/');
          
          routes.push({
            path: path + handler.route.path,
            methods: Object.keys(handler.route.methods).join(', ').toUpperCase(),
          });
        }
      });
    }
  });
  
  res.status(200).json({ 
    total: routes.length,
    routes: routes.sort((a, b) => a.path.localeCompare(b.path))
  });
});

// ========================================
// MANEJO DE RUTAS NO ENCONTRADAS
// ========================================
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

// ========================================
// MANEJO DE ERRORES GLOBAL
// ========================================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ========================================
// INICIAR SERVIDOR
// ========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 MiniBio API Server Running       ║
╠════════════════════════════════════════╣
║   Port: ${PORT.toString().padEnd(31)}║
║   URL:  http://localhost:${PORT.toString().padEnd(21)}║
║   Env:  ${(process.env.NODE_ENV || 'development').padEnd(31)}║
╚════════════════════════════════════════╝
  `);
  console.log('📋 Ver todas las rutas: http://localhost:' + PORT + '/api/routes\n');
});