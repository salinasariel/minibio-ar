const {
  QUALIFY_CLICKS,
  MAINTAIN_CLICKS_30D,
  ensureReferralCode,
  evaluateReferralReward,
} = require('../lib/referrals');

// ========================================
// MIS REFERIDOS (evalúa el premio al consultar)
// GET /api/referrals
// ========================================
exports.getMyReferrals = async (req, res) => {
  const userId = req.user.userId;

  try {
    const code = await ensureReferralCode(userId);
    const { referrals, rewarded } = await evaluateReferralReward(userId);

    res.status(200).json({
      code,
      rules: {
        qualify_clicks: QUALIFY_CLICKS,
        maintain_clicks_30d: MAINTAIN_CLICKS_30D,
      },
      rewarded, // true = tiene Pro por referidos ahora mismo
      referrals,
    });
  } catch (error) {
    console.error('getMyReferrals error:', error);
    res.status(500).json({ error: 'Error al obtener tus referidos' });
  }
};
