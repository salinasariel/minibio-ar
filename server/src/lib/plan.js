const prisma = require('../models/db');

// ========================================
// Catálogo de funcionalidades gateables por plan.
// Las keys son estables: los planes guardan un array de estas keys.
// ========================================
const FEATURES = [
  { key: 'products', name: 'Productos / carta con fotos y precios' },
  { key: 'stats', name: 'Estadísticas de visitas y clicks' },
  { key: 'whatsapp', name: 'Botón destacado de WhatsApp' },
  { key: 'address', name: 'Ubicación con Google Maps' },
  { key: 'hours', name: 'Horarios de atención' },
  { key: 'payment', name: 'Datos de pago (alias + MercadoPago)' },
  { key: 'reviews', name: 'Reseñas de Google' },
  { key: 'custom_theme', name: 'Colores y estilos personalizados' },
  { key: 'ai', name: 'Asistente IA' },
];

const FEATURE_KEYS = FEATURES.map((f) => f.key);

// Fallback si la tabla plans está vacía (no debería pasar tras la migración)
const FALLBACK_PLAN = {
  id: null,
  code: 'free',
  name: 'Gratis',
  features: ['whatsapp', 'address', 'hours', 'products', 'stats'],
  max_pages: 2,
  max_links: 10,
};

// Devuelve el plan efectivo de un usuario (el asignado, o el default)
async function getUserPlan(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (user?.plan) return user.plan;

  const def = await prisma.plan.findFirst({ where: { is_default: true } });
  return def || FALLBACK_PLAN;
}

function planHasFeature(plan, key) {
  return Array.isArray(plan?.features) && plan.features.includes(key);
}

// Forma pública del plan (para mandar al front en login/registro)
function publicPlan(plan) {
  if (!plan) return null;
  return {
    code: plan.code,
    name: plan.name,
    features: Array.isArray(plan.features) ? plan.features : [],
    max_pages: plan.max_pages,
    max_links: plan.max_links,
  };
}

module.exports = { FEATURES, FEATURE_KEYS, getUserPlan, planHasFeature, publicPlan, FALLBACK_PLAN };
