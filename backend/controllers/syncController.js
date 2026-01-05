const OfflineAction = require('../models/OfflineAction');
const { logger } = require('../services/LoggingService');
const Message = require('../models/Message');
const Swipe = require('../models/Swipe');
const User = require('../models/User');
const SwipeService = require('../services/SwipeService');
const {
  sendSuccess,
  sendError,
  sendValidationError,
  asyncHandler,
} = require('../utils/responseHelpers');

/**
 * Execute queued offline actions
 * POST /api/sync/execute
 */
exports.executeSync = async (req, res) => {
  try {
    const userId = req.user._id;
    const { actions } = req.body;

    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Actions array is required',
      });
    }

    const results = [];
    const conflicts = [];

    for (const action of actions) {
      const { id: actionId, type, timestamp, data } = action;

      try {
        // Check if action already exists (deduplication)
        const existingAction = await OfflineAction.findOne({
          userId,
          actionId,
        });

        if (existingAction && existingAction.status === 'synced') {
          results.push({
            id: actionId,
            status: 'skipped',
            message: 'Action already synced',
          });
          continue;
        }

        // Execute action based on type
        let result;
        let conflict = null;

        switch (type) {
          case 'SEND_MESSAGE':
            result = await executeSendMessage(userId, data, timestamp);
            break;
          case 'SWIPE':
            result = await executeSwipe(userId, data, timestamp);
            break;
          case 'UPDATE_PROFILE':
            result = await executeUpdateProfile(userId, data, timestamp);
            break;
          case 'SUPER_LIKE':
            result = await executeSuperLike(userId, data, timestamp);
            break;
          case 'REWIND':
            result = await executeRewind(userId, data, timestamp);
            break;
          default:
            throw new Error(`Unknown action type: ${type}`);
        }

        // Check for conflicts
        if (result.conflict) {
          conflict = result.conflict;
          conflicts.push({
            actionId,
            type,
            conflict,
          });

          // Save as conflict
          await OfflineAction.findOneAndUpdate(
            { userId, actionId },
            {
              userId,
              actionId,
              type,
              data,
              timestamp: new Date(timestamp),
              status: 'conflict',
              conflict: {
                hasConflict: true,
                reason: conflict.reason,
                serverData: conflict.serverData,
                resolved: false,
              },
            },
            { upsert: true, new: true }
          );

          results.push({
            id: actionId,
            status: 'conflict',
            conflict,
          });
        } else if (result.success) {
          // Mark as synced
          await OfflineAction.findOneAndUpdate(
            { userId, actionId },
            {
              userId,
              actionId,
              type,
              data,
              timestamp: new Date(timestamp),
              status: 'synced',
              syncedAt: new Date(),
            },
            { upsert: true, new: true }
          );

          results.push({
            id: actionId,
            status: 'success',
            data: result.data,
          });
        } else {
          // Failed
          await OfflineAction.findOneAndUpdate(
            { userId, actionId },
            {
              userId,
              actionId,
              type,
              data,
              timestamp: new Date(timestamp),
              status: 'failed',
              error: {
                message: result.error,
                code: result.errorCode,
                timestamp: new Date(),
              },
              retryCount: (existingAction?.retryCount || 0) + 1,
            },
            { upsert: true, new: true }
          );

          results.push({
            id: actionId,
            status: 'error',
            error: result.error,
          });
        }
      } catch (error) {
        console.error(`Error executing action ${actionId}:`, error);
        results.push({
          id: actionId,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        conflicts,
        summary: {
          total: actions.length,
          success: results.filter((r) => r.status === 'success').length,
          conflicts: conflicts.length,
          errors: results.filter((r) => r.status === 'error').length,
          skipped: results.filter((r) => r.status === 'skipped').length,
        },
      },
    });
  } catch (error) {
    logger.error('Execute sync error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error executing sync',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Execute SEND_MESSAGE action
 */
async function executeSendMessage(userId, data, timestamp) {
  try {
    const { matchId, content, type = 'text' } = data;

    // Verify match exists and user is part of it
    const Swipe = require('../models/Swipe');
    const match = await Swipe.findOne({
      _id: matchId,
      $or: [{ swiperId: userId }, { swipedId: userId }],
      action: 'like',
    });

    if (!match) {
      return {
        success: false,
        error: 'Match not found or access denied',
        errorCode: 'MATCH_NOT_FOUND',
      };
    }

    // Check if message already exists (deduplication by timestamp)
    const existingMessage = await Message.findOne({
      matchId,
      senderId: userId,
      createdAt: {
        $gte: new Date(timestamp - 5000), // 5 second window
        $lte: new Date(timestamp + 5000),
      },
    });

    if (existingMessage) {
      return {
        success: true,
        data: { messageId: existingMessage._id, duplicate: true },
      };
    }

    // Determine receiver
    const receiverId =
      match.swiperId.toString() === userId.toString() ? match.swipedId : match.swiperId;

    // Create message
    const message = new Message({
      matchId,
      senderId: userId,
      receiverId,
      content,
      type,
    });

    await message.save();

    return {
      success: true,
      data: { messageId: message._id },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      errorCode: 'MESSAGE_SEND_FAILED',
    };
  }
}

/**
 * Execute SWIPE action
 */
async function executeSwipe(userId, data, timestamp) {
  try {
    const { targetId, action } = data;

    // Check if swipe already exists
    const existingSwipe = await Swipe.findOne({
      swiperId: userId,
      swipedId: targetId,
    });

    if (existingSwipe) {
      // Check for conflict if action is different
      if (existingSwipe.action !== action) {
        return {
          success: false,
          conflict: {
            reason: 'data_changed',
            serverData: {
              action: existingSwipe.action,
              createdAt: existingSwipe.createdAt,
            },
          },
        };
      }

      return {
        success: true,
        data: { swipeId: existingSwipe._id, duplicate: true },
      };
    }

    // Use SwipeService to process swipe
    const result = await SwipeService.processSwipe(userId, targetId, action, {
      isPriority: data.isPriority || false,
    });

    if (result.alreadyProcessed) {
      return {
        success: true,
        data: { swipeId: result.swipe.id, duplicate: true },
      };
    }

    return {
      success: true,
      data: {
        swipeId: result.swipe.id,
        isMatch: result.isMatch,
        matchData: result.matchData,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      errorCode: 'SWIPE_FAILED',
    };
  }
}

/**
 * Execute UPDATE_PROFILE action
 */
async function executeUpdateProfile(userId, data, timestamp) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found',
        errorCode: 'USER_NOT_FOUND',
      };
    }

    // Check for conflicts - compare timestamps
    if (user.updatedAt && new Date(user.updatedAt) > new Date(timestamp)) {
      return {
        success: false,
        conflict: {
          reason: 'timestamp_mismatch',
          serverData: {
            updatedAt: user.updatedAt,
            profile: {
              name: user.name,
              bio: user.bio,
              age: user.age,
            },
          },
        },
      };
    }

    // Update profile
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.age !== undefined) updateData.age = data.age;
    if (data.gender !== undefined) updateData.gender = data.gender;

    Object.assign(user, updateData);
    await user.save();

    return {
      success: true,
      data: { user: { name: user.name, bio: user.bio, age: user.age } },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      errorCode: 'PROFILE_UPDATE_FAILED',
    };
  }
}

/**
 * Execute SUPER_LIKE action
 */
async function executeSuperLike(userId, data, timestamp) {
  try {
    const { targetId } = data;

    // Check if super like already exists
    const SuperLike = require('../models/SuperLike');
    const existing = await SuperLike.findOne({
      userId,
      targetId,
    });

    if (existing) {
      return {
        success: true,
        data: { superLikeId: existing._id, duplicate: true },
      };
    }

    // Create super like
    const superLike = new SuperLike({
      userId,
      targetId,
    });

    await superLike.save();

    // Also create a swipe
    await SwipeService.processSwipe(userId, targetId, 'superlike', {
      isPriority: true,
    });

    return {
      success: true,
      data: { superLikeId: superLike._id },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      errorCode: 'SUPER_LIKE_FAILED',
    };
  }
}

/**
 * Execute REWIND action
 */
async function executeRewind(userId, data, timestamp) {
  try {
    // Get last swipe
    const lastSwipe = await Swipe.findOne({ swiperId: userId })
      .sort({ createdAt: -1 })
      .lean();

    if (!lastSwipe) {
      return {
        success: false,
        error: 'No swipe to rewind',
        errorCode: 'NO_SWIPE_TO_REWIND',
      };
    }

    // Delete the swipe
    await Swipe.deleteOne({ _id: lastSwipe._id });

    return {
      success: true,
      data: { rewindedSwipeId: lastSwipe._id },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      errorCode: 'REWIND_FAILED',
    };
  }
}

/**
 * Get sync conflicts
 * GET /api/sync/conflicts
 */
exports.getConflicts = async (req, res) => {
  try {
    const userId = req.user._id;

    // @ts-ignore - Custom static method defined on schema
    const conflicts = await OfflineAction.getConflicts(userId);

    res.json({
      success: true,
      data: {
        conflicts: conflicts.map((action) => ({
          actionId: action.actionId,
          type: action.type,
          timestamp: action.timestamp,
          localData: action.data,
          serverData: action.conflict.serverData,
          conflictReason: action.conflict.reason,
        })),
        count: conflicts.length,
      },
    });
  } catch (error) {
    logger.error('Get conflicts error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching conflicts',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Resolve sync conflict
 * POST /api/sync/resolve
 */
exports.resolveConflict = async (req, res) => {
  try {
    const userId = req.user._id;
    const { actionId, resolution, mergedData } = req.body;

    if (!actionId || !resolution) {
      return res.status(400).json({
        success: false,
        message: 'actionId and resolution are required',
      });
    }

    if (!['use_local', 'use_server', 'merge'].includes(resolution)) {
      return res.status(400).json({
        success: false,
        message: 'resolution must be one of: use_local, use_server, merge',
      });
    }

    const action = await OfflineAction.findOne({
      userId,
      actionId,
      status: 'conflict',
    });

    if (!action) {
      return res.status(404).json({
        success: false,
        message: 'Conflict not found',
      });
    }

    // Execute based on resolution
    let result;
    if (resolution === 'use_local') {
      // Re-execute with local data
      result = await executeActionByType(userId, action.type, action.data, action.timestamp);
    } else if (resolution === 'use_server') {
      // Mark as resolved, keep server data
      result = { success: true, data: action.conflict?.serverData };
    } else if (resolution === 'merge' && mergedData) {
      // Merge data and execute
      result = await executeActionByType(userId, action.type, mergedData, action.timestamp);
    } else {
      return res.status(400).json({
        success: false,
        message: 'mergedData is required for merge resolution',
      });
    }

    // Update action
    action.status = result.success ? 'synced' : 'failed';
    if (action.conflict) {
      action.conflict.resolved = true;
      action.conflict.resolution = resolution;
    }
    action.syncedAt = new Date();
    if (result.error) {
      action.error = {
        message: result.error,
        timestamp: new Date(),
      };
    }
    await action.save();

    res.json({
      success: true,
      message: 'Conflict resolved',
      data: {
        actionId,
        resolution,
        result: result.success ? 'success' : 'failed',
      },
    });
  } catch (error) {
    logger.error('Resolve conflict error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error resolving conflict',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Helper to execute action by type
 */
async function executeActionByType(userId, type, data, timestamp) {
  switch (type) {
    case 'SEND_MESSAGE':
      return executeSendMessage(userId, data, timestamp);
    case 'SWIPE':
      return executeSwipe(userId, data, timestamp);
    case 'UPDATE_PROFILE':
      return executeUpdateProfile(userId, data, timestamp);
    case 'SUPER_LIKE':
      return executeSuperLike(userId, data, timestamp);
    case 'REWIND':
      return executeRewind(userId, data, timestamp);
    default:
      return {
        success: false,
        error: `Unknown action type: ${type}`,
      };
  }
}

/**
 * Get sync status
 * GET /api/sync/status
 */
exports.getSyncStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const [pendingCount, conflictCount, lastSyncedAction] = await Promise.all([
      OfflineAction.countDocuments({ userId, status: 'pending' }),
      OfflineAction.countDocuments({
        userId,
        status: 'conflict',
        'conflict.resolved': false,
      }),
      OfflineAction.findOne({ userId, status: 'synced' })
        .sort({ syncedAt: -1 })
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        lastSyncTimestamp: lastSyncedAction?.syncedAt || null,
        pendingActionsCount: pendingCount,
        conflictsCount: conflictCount,
        syncInProgress: false, // Could be tracked in Redis if needed
      },
    });
  } catch (error) {
    logger.error('Get sync status error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching sync status',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
