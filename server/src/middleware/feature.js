const { getUserPlan, planHasFeature } = require('../lib/plan');

// Gate por plan para la API pública: el usuario debe tener la feature
// en su plan para usar el endpoint.
const requireFeature = (key) => async (req, res, next) => {
  try {
    const plan = await getUserPlan(req.user.userId);
    if (!planHasFeature(plan, key)) {
      return res.status(403).json({
        error: `Tu plan (${plan.name}) no incluye esta funcionalidad`,
        feature: key,
      });
    }
    next();
  } catch (error) {
    console.error('requireFeature error:', error);
    res.status(500).json({ error: 'Error de autorización' });
  }
};

module.exports = requireFeature;
