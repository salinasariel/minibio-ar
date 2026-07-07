const crypto = require('crypto');
const prisma = require('../models/db');

// ========================================
// Reglas del programa de referidos
// ========================================
const QUALIFY_CLICKS = 10; // clicks totales para que un referido "califique"
const MAINTAIN_CLICKS_30D = 5; // clicks en 30 días para mantener el premio activo

// Devuelve (y genera si falta) el código de referido del usuario
async function ensureReferralCode(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referral_code: true },
  });
  if (user?.referral_code) return user.referral_code;

  // Código corto único
  for (let i = 0; i < 5; i++) {
    const code = crypto.randomBytes(4).toString('hex'); // 8 chars
    try {
      await prisma.user.update({ where: { id: userId }, data: { referral_code: code } });
      return code;
    } catch (e) {
      if (e.code !== 'P2002') throw e; // colisión: reintentar
    }
  }
  throw new Error('No se pudo generar el código de referido');
}

// Estadísticas de los referidos de un usuario
async function getReferralStats(userId) {
  const referred = await prisma.user.findMany({
    where: { referred_by: userId },
    select: { id: true, username: true, created_at: true },
    orderBy: { created_at: 'desc' },
  });

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = [];

  for (const r of referred) {
    // Clicks totales (contador de links de todas sus páginas)
    const totals = await prisma.link.aggregate({
      _sum: { clicks: true },
      where: { page: { user_id: r.id } },
    });
    const totalClicks = totals._sum.clicks || 0;

    // Clicks de los últimos 30 días (eventos con timestamp)
    const clicks30 = await prisma.statEvent.count({
      where: {
        type: 'click',
        created_at: { gte: since30 },
        page: { user_id: r.id },
      },
    });

    result.push({
      username: r.username,
      created_at: r.created_at,
      total_clicks: totalClicks,
      clicks_30d: clicks30,
      qualifies: totalClicks >= QUALIFY_CLICKS,
      active: totalClicks >= QUALIFY_CLICKS && clicks30 >= MAINTAIN_CLICKS_30D,
    });
  }

  return result;
}

// Evalúa y aplica el premio: Pro si hay al menos un referido activo.
// Nunca pisa un plan asignado manualmente por un admin.
async function evaluateReferralReward(userId) {
  const referrals = await getReferralStats(userId);
  const hasActive = referrals.some((r) => r.active);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan_id: true, pro_by_referral: true },
  });
  if (!user) return { referrals, rewarded: false };

  const proPlan = await prisma.plan.findUnique({ where: { code: 'pro' } });
  if (!proPlan) return { referrals, rewarded: false };

  if (hasActive) {
    // Otorgar solo si no tiene un plan asignado a mano
    if (user.plan_id === null || user.pro_by_referral) {
      await prisma.user.update({
        where: { id: userId },
        data: { plan_id: proPlan.id, pro_by_referral: true },
      });
      return { referrals, rewarded: true };
    }
    return { referrals, rewarded: user.plan_id === proPlan.id };
  }

  // Sin referidos activos: quitar el Pro SOLO si vino de referidos
  if (user.pro_by_referral) {
    await prisma.user.update({
      where: { id: userId },
      data: { plan_id: null, pro_by_referral: false },
    });
  }
  return { referrals, rewarded: false };
}

module.exports = {
  QUALIFY_CLICKS,
  MAINTAIN_CLICKS_30D,
  ensureReferralCode,
  getReferralStats,
  evaluateReferralReward,
};
