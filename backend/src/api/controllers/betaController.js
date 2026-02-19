/**
 * Beta Controller - Stub
 * Placeholder for beta testing features
 */

const getBetaFeatures = async (req, res) => {
  res.json({
    success: true,
    data: { features: [] },
    message: 'Beta features not implemented',
  });
};

const enrollInBeta = async (req, res) => {
  res.json({
    success: false,
    message: 'Beta enrollment not implemented',
  });
};

module.exports = {
  getBetaFeatures,
  enrollInBeta,
};
