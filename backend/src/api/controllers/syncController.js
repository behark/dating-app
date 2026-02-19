/**
 * Sync Controller
 * Handles offline action synchronization
 */

const executeOfflineActions = async (req, res) => {
  try {
    const { actions } = req.body;

    if (!Array.isArray(actions)) {
      return res.status(400).json({
        success: false,
        message: 'Actions must be an array',
      });
    }

    const results = actions.map((action) => ({
      id: action.id,
      status: 'skipped',
      message: 'Sync not fully implemented',
    }));

    res.json({
      success: true,
      data: { results },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

module.exports = {
  executeOfflineActions,
};
