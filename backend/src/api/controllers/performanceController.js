/**
 * Performance Controller - Stub
 * Placeholder for performance monitoring
 */

const getPerformanceMetrics = async (req, res) => {
  res.json({
    success: true,
    data: { metrics: {} },
    message: 'Performance metrics not implemented',
  });
};

const reportPerformance = async (req, res) => {
  res.json({
    success: false,
    message: 'Performance reporting not implemented',
  });
};

module.exports = {
  getPerformanceMetrics,
  reportPerformance,
};
