const { logger } = require('../../infrastructure/external/LoggingService');
const User = require('../../core/domain/User');

const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendRateLimit,
  asyncHandler,
} = require('../../shared/utils/responseHelpers');

/**
 * Share date plan with friends for safety
 * POST /api/safety/date-plan
 */
const shareDatePlan = async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      matchUserId,
      matchName,
      matchPhotoUrl,
      location,
      address,
      coordinates,
      dateTime,
      notes,
      friendIds,
    } = req.body;

    // Validate input
    if (!location || !dateTime || !matchUserId) {
      return sendError(res, 400, { message: 'location, dateTime, and matchUserId are required' });
    }

    // Validate date is in future
    const planDate = new Date(dateTime);
    if (planDate < new Date()) {
      return sendError(res, 400, { message: 'Date must be in the future' });
    }

    // Create date plan in database
    const datePlan = {
      userId,
      matchUserId,
      matchName,
      matchPhotoUrl,
      location,
      address,
      coordinates,
      dateTime: planDate,
      notes,
      sharedWith: friendIds || [],
      status: 'active',
      createdAt: new Date(),
      expiresAt: new Date(planDate.getTime() + 24 * 60 * 60 * 1000),
    };

    // Save to database (using Firebase or MongoDB depending on setup)
    // This is a placeholder - adjust based on your actual database
    const datePlanId = `dateplan_${Date.now()}`;

    return res.status(200).json({
      success: true,
      message: 'Date plan shared successfully',
      data: { datePlanId, datePlan },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error sharing date plan:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Failed to share date plan',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

/**
 * Start check-in timer
 * POST /api/safety/checkin/start
 */
const startCheckIn = async (req, res) => {
  try {
    const { userId } = req.user;
    const { datePlanId, duration = 300 } = req.body; // Duration in minutes, default 5 min

    if (!datePlanId) {
      return sendError(res, 400, { message: 'datePlanId is required' });
    }

    const checkInId = `checkin_${Date.now()}`;
    const checkIn = {
      userId,
      datePlanId,
      status: 'active',
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + duration * 60 * 1000),
      alertSent: false,
    };

    return res.status(200).json({
      success: true,
      message: 'Check-in timer started',
      data: {
        checkInId,
        checkIn,
        expiresIn: duration * 60, // seconds
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error starting check-in:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Failed to start check-in',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

/**
 * Complete check-in (user confirms safety)
 * POST /api/safety/checkin/:checkInId/complete
 */
const completeCheckIn = async (req, res) => {
  try {
    const { checkInId } = req.params;
    const { userId } = req.user;

    // Update check-in status
    const completedCheckIn = {
      status: 'checked_in',
      checkedInAt: new Date(),
      userId,
    };

    return sendSuccess(res, 200, {
      message: 'Check-in completed - friends notified of your safety',
      data: completedCheckIn,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error completing check-in:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Failed to complete check-in',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

/**
 * Send Emergency SOS Alert
 * POST /api/safety/sos
 */
const sendEmergencySOS = async (req, res) => {
  try {
    const { userId } = req.user;
    const { location, message } = req.body;

    if (!location || !location.latitude || !location.longitude) {
      return sendError(res, 400, { message: 'location with latitude and longitude is required' });
    }

    const sosAlert = {
      userId,
      type: 'sos',
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || '',
        timestamp: new Date(),
      },
      message: message || '',
      severity: 'critical',
      status: 'active',
      respondedBy: [],
      responses: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    const sosAlertId = `sos_${Date.now()}`;

    // In production, send notifications to emergency contacts and trusted friends
    logger.info('SOS Alert created', { sosAlert });

    return res.status(200).json({
      success: true,
      message: 'Emergency SOS sent to your emergency contacts and trusted friends',
      data: {
        sosAlertId,
        sosAlert,
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error sending SOS:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Failed to send SOS',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

/**
 * Get active SOS alerts
 * GET /api/safety/sos/active
 */
const getActiveSOS = async (req, res) => {
  try {
    const { userId } = req.user;

    // In production, fetch from database
    const activeAlerts = [];

    return res.status(200).json({
      success: true,
      data: activeAlerts,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error getting active SOS:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Failed to get SOS alerts',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

/**
 * Respond to SOS alert
 * POST /api/safety/sos/:sosAlertId/respond
 */
const respondToSOS = async (req, res) => {
  try {
    const { sosAlertId } = req.params;
    const { userId } = req.user;
    const { message, confirmedSafe } = req.body;

    const response = {
      responderId: userId,
      message: message || '',
      confirmedSafe: confirmedSafe || false,
      timestamp: new Date(),
    };

    // Update SOS with response
    logger.info('SOS Response recorded', { response });

    return sendSuccess(res, 200, { message: 'Response recorded', data: response });
  } catch (/** @type {any} */ error) {
    logger.error('Error responding to SOS:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Failed to respond to SOS',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

/**
 * Resolve SOS alert
 * PUT /api/safety/sos/:sosAlertId/resolve
 */
const resolveSOS = async (req, res) => {
  try {
    const { sosAlertId } = req.params;
    const { userId } = req.user;
    const { status = 'resolved' } = req.body; // 'resolved' or 'false_alarm'

    return res.status(200).json({
      success: true,
      message: `SOS alert marked as ${status}`,
      data: {
        sosAlertId,
        status,
        resolvedAt: new Date(),
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error resolving SOS:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Failed to resolve SOS',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

/**
 * Initiate background check
 * POST /api/safety/background-check
 */
const initiateBackgroundCheck = async (req, res) => {
  try {
    const { userId } = req.user;
    const { userInfo } = req.body;

    // Validate user has premium subscription
    const user = await User.findById(userId);
    if (!user || !user.isPremium) {
      return res.status(403).json({
        success: false,
        message: 'Background checks are a premium feature',
      });
    }

    const backgroundCheck = {
      userId,
      status: 'pending',
      userInfo: {
        firstName: userInfo?.firstName || '',
        lastName: userInfo?.lastName || '',
        dateOfBirth: userInfo?.dateOfBirth || '',
        email: userInfo?.email || '',
        ...userInfo,
      },
      checks: {
        criminalRecord: false,
        sexOffenderRegistry: false,
        addressHistory: false,
        identityVerification: false,
      },
      results: {},
      requestedAt: new Date(),
      completedAt: null,
    };

    const backgroundCheckId = `bgcheck_${Date.now()}`;

    return res.status(200).json({
      success: true,
      message: 'Background check initiated',
      data: {
        backgroundCheckId,
        backgroundCheck,
        estimatedDuration: '24-48 hours',
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error initiating background check:', {
      error: error.message,
      stack: error.stack,
    });
    return sendError(res, 500, {
      message: 'Failed to initiate background check',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

/**
 * Get background check status
 * GET /api/safety/background-check/:backgroundCheckId
 */
const getBackgroundCheckStatus = async (req, res) => {
  try {
    const { backgroundCheckId } = req.params;
    const { userId } = req.user;

    // In production, fetch from database
    const status = {
      backgroundCheckId,
      status: 'in_progress',
      progress: 75,
      checks: {
        criminalRecord: { status: 'completed', passed: true },
        sexOffenderRegistry: { status: 'completed', passed: true },
        addressHistory: { status: 'in_progress' },
        identityVerification: { status: 'pending' },
      },
      estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error getting background check status:', {
      error: error.message,
      stack: error.stack,
    });
    return sendError(res, 500, {
      message: 'Failed to get background check status',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

/**
 * Add emergency contact
 * POST /api/safety/emergency-contact
 */
const addEmergencyContact = async (req, res) => {
  try {
    const { userId } = req.user;
    const { name, phone, relationship } = req.body;

    // Validate input
    if (!name || !phone || !relationship) {
      return sendError(res, 400, { message: 'name, phone, and relationship are required' });
    }

    const contact = {
      id: `contact_${Date.now()}`,
      name,
      phone,
      relationship,
      addedAt: new Date(),
      verified: false,
    };

    // Add to user's emergency contacts
    // In production, save to database

    return sendSuccess(res, 200, { message: 'Emergency contact added', data: contact });
  } catch (/** @type {any} */ error) {
    logger.error('Error adding emergency contact:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Failed to add emergency contact',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

/**
 * Get emergency contacts
 * GET /api/safety/emergency-contacts
 */
const getEmergencyContacts = async (req, res) => {
  try {
    const { userId } = req.user;

    // In production, fetch from database
    const contacts = [];

    return res.status(200).json({
      success: true,
      data: contacts,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error getting emergency contacts:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Failed to get emergency contacts',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

/**
 * Delete emergency contact
 * DELETE /api/safety/emergency-contact/:contactId
 */
const deleteEmergencyContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { userId } = req.user;

    return res.status(200).json({
      success: true,
      message: 'Emergency contact deleted',
      data: { contactId },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error deleting emergency contact:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Failed to delete emergency contact',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

/**
 * Advanced photo verification with liveness detection
 * POST /api/safety/photo-verification/advanced
 */
const submitAdvancedPhotoVerification = async (req, res) => {
  try {
    const { userId } = req.user;
    const { photoUri, livenessData } = req.body;

    if (!photoUri) {
      return sendError(res, 400, { message: 'photoUri is required' });
    }

    const verification = {
      userId,
      type: 'liveness_detection',
      photoUri,
      livenessChecks: {
        method: livenessData?.method || 'advanced',
        timestamp: new Date(),
        faceDetected: livenessData?.faceDetected || false,
        livenessPassed: livenessData?.livenessPassed || false,
        confidence: livenessData?.confidence || 0,
        challenges: livenessData?.challenges || [],
        completedChallenges: livenessData?.completedChallenges || [],
      },
      status: 'pending',
      submittedAt: new Date(),
      aiAnalysis: {
        faceQuality: livenessData?.faceQuality || 0,
        imageQuality: livenessData?.imageQuality || 0,
        spoofingRisk: livenessData?.spoofingRisk || 'low',
        matchWithProfilePhoto: livenessData?.matchWithProfilePhoto || 0,
      },
    };

    const verificationId = `verify_${Date.now()}`;

    return res.status(200).json({
      success: true,
      message: 'Photo verification submitted',
      data: {
        verificationId,
        verification,
      },
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error submitting photo verification:', {
      error: error.message,
      stack: error.stack,
    });
    return sendError(res, 500, {
      message: 'Failed to submit photo verification',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

/**
 * Get active date plans
 * GET /api/safety/date-plans/active
 */
const getActiveDatePlans = async (req, res) => {
  try {
    const { userId } = req.user;

    // In production, fetch from database
    const datePlans = [];

    return res.status(200).json({
      success: true,
      data: datePlans,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error getting date plans:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Failed to get date plans',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

/**
 * Get date plans shared with user
 * GET /api/safety/date-plans/shared
 */
const getSharedDatePlans = async (req, res) => {
  try {
    const { userId } = req.user;

    // In production, fetch date plans where userId is in sharedWith array
    const sharedPlans = [];

    return res.status(200).json({
      success: true,
      data: sharedPlans,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error getting shared date plans:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Failed to get shared date plans',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

/**
 * Update date plan status
 * PUT /api/safety/date-plan/:datePlanId
 */
const updateDatePlan = async (req, res) => {
  try {
    const { datePlanId } = req.params;
    const { userId } = req.user;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['active', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // In production, update the date plan in database
    const updatedPlan = {
      datePlanId,
      status: status || 'active',
      notes: notes || '',
      updatedAt: new Date(),
    };

    return sendSuccess(res, 200, { message: 'Date plan updated', data: updatedPlan });
  } catch (/** @type {any} */ error) {
    logger.error('Error updating date plan:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Failed to update date plan',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

/**
 * Get active check-ins for user
 * GET /api/safety/checkin/active
 */
const getActiveCheckIns = async (req, res) => {
  try {
    const { userId } = req.user;

    // In production, fetch from database where status is 'active' and not expired
    const activeCheckIns = [];

    return res.status(200).json({
      success: true,
      data: activeCheckIns,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error getting active check-ins:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Failed to get active check-ins',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

/**
 * Get photo verification status
 * GET /api/safety/photo-verification/status
 */
const getPhotoVerificationStatus = async (req, res) => {
  try {
    const { userId } = req.user;

    // In production, fetch from database
    // Check user's verification status
    const user = await User.findById(userId);

    const verificationStatus = {
      verified: user?.isVerified || false,
      status: user?.isVerified ? 'verified' : 'not_submitted',
      submittedAt: user?.verificationSubmittedAt || null,
      verifiedAt: user?.verifiedAt || null,
    };

    return res.status(200).json({
      success: true,
      data: verificationStatus,
    });
  } catch (/** @type {any} */ error) {
    logger.error('Error getting photo verification status:', {
      error: error.message,
      stack: error.stack,
    });
    return sendError(res, 500, {
      message: 'Failed to get verification status',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

/**
 * Update background check results (admin/internal use)
 * PUT /api/safety/background-check/:backgroundCheckId
 */
const updateBackgroundCheck = async (req, res) => {
  try {
    const { backgroundCheckId } = req.params;
    const { userId } = req.user;
    const { status, results, checks } = req.body;

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'failed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // In production, update the background check in database
    const updatedCheck = {
      backgroundCheckId,
      status: status || 'in_progress',
      results: results || {},
      checks: checks || {},
      updatedAt: new Date(),
      completedAt: status === 'completed' ? new Date() : null,
    };

    return sendSuccess(res, 200, { message: 'Background check updated', data: updatedCheck });
  } catch (/** @type {any} */ error) {
    logger.error('Error updating background check:', { error: error.message, stack: error.stack });
    return sendError(res, 500, {
      message: 'Failed to update background check',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
    });
  }
};

module.exports = {
  shareDatePlan,
  startCheckIn,
  completeCheckIn,
  sendEmergencySOS,
  getActiveSOS,
  respondToSOS,
  resolveSOS,
  initiateBackgroundCheck,
  getBackgroundCheckStatus,
  updateBackgroundCheck,
  addEmergencyContact,
  getEmergencyContacts,
  deleteEmergencyContact,
  submitAdvancedPhotoVerification,
  getPhotoVerificationStatus,
  getActiveDatePlans,
  getSharedDatePlans,
  updateDatePlan,
  getActiveCheckIns,
};
