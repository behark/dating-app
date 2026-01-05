const mongoose = require('mongoose');
const User = require('../models/User');
const { logger } = require('../services/LoggingService');

const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendRateLimit,
  asyncHandler,
} = require('../utils/responseHelpers');

// @route   PUT /api/profile/update
// @desc    Update user profile information
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, age, gender, bio, interests, pushToken, notificationsEnabled } = req.body;

    // Validate bio length
    if (bio && bio.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Bio must not exceed 500 characters',
      });
    }

    // Build update object
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (age) updateData.age = age;
    if (gender) updateData.gender = gender;
    if (bio) updateData.bio = bio.trim();
    if (interests && Array.isArray(interests)) {
      updateData.interests = interests.filter((i) => i.trim()).slice(0, 20); // Max 20 interests
    }
    // Handle push token registration (for notifications)
    if (pushToken !== undefined) {
      updateData.pushToken = pushToken;
    }
    if (notificationsEnabled !== undefined) {
      // Update notification preferences to enable/disable all
      updateData.notificationPreferences = {
        matchNotifications: notificationsEnabled,
        messageNotifications: notificationsEnabled,
        likeNotifications: notificationsEnabled,
        systemNotifications: notificationsEnabled,
        updatedAt: new Date(),
      };
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          age: user.age,
          gender: user.gender,
          bio: user.bio,
          interests: user.interests,
          photos: user.photos,
          profileCompleteness: user.profileCompleteness,
        },
      },
    });
  } catch (error) {
    logger.error('Profile update error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   GET /api/profile/:userId
// @desc    Get user profile
// @access  Private - Can only view own profile or matched users' profiles
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user._id?.toString() || req.user.id?.toString();
    const isOwnProfile = requestingUserId === userId;

    const user = await User.findById(userId).select(
      '-password -passwordResetToken -emailVerificationToken -phoneVerificationCode'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If viewing own profile, return full details
    if (isOwnProfile) {
      return res.json({
        success: true,
        data: {
          user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            age: user.age,
            gender: user.gender,
            bio: user.bio,
            interests: user.interests,
            photos: user.photos,
            phoneNumber: user.phoneNumber,
            isPhoneVerified: user.isPhoneVerified,
            isEmailVerified: user.isEmailVerified,
            profileCompleteness: user.profileCompleteness,
            createdAt: user.createdAt,
          },
        },
      });
    }

    // For matched users, return limited profile info (no email, phone, verification status)
    // SECURITY: Email and phone should never be exposed to other users
    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          age: user.age,
          gender: user.gender,
          bio: user.bio,
          interests: user.interests,
          photos: user.photos,
          profileCompleteness: user.profileCompleteness,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    logger.error('Get profile error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   GET /api/profile/me
// @desc    Get current user profile
// @access  Private
exports.getMyProfile = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          age: user.age,
          gender: user.gender,
          bio: user.bio,
          interests: user.interests,
          photos: user.photos,
          phoneNumber: user.phoneNumber,
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified,
          profileCompleteness: user.profileCompleteness,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    logger.error('Get my profile error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   POST /api/profile/photos/upload
// @desc    Upload multiple photos
// @access  Private
exports.uploadPhotos = async (req, res) => {
  try {
    const userId = req.user._id;
    const { photos } = req.body; // photos: [{ url, order }]

    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Photos array is required',
      });
    }

    if (photos.length > 6) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 6 photos allowed',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Add new photos with moderation status
    const newPhotos = photos.map((photo, index) => ({
      _id: mongoose.Types.ObjectId.createFromTime
        ? mongoose.Types.ObjectId.createFromTime(Math.floor(Date.now() / 1000))
        : new mongoose.Types.ObjectId(),
      url: photo.url,
      order: photo.order || index,
      moderationStatus: 'pending',
      uploadedAt: new Date(),
    }));

    user.photos = [...user.photos, ...newPhotos].map((photo) => {
      const modStatus = photo.moderationStatus || 'pending';
      return {
        ...photo,
        moderationStatus: (modStatus === 'pending' || modStatus === 'approved' || modStatus === 'rejected') ? modStatus : 'pending',
      };
    });

    // Keep only 6 most recent photos
    user.photos = user.photos
      .sort((a, b) => {
        const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 6);

    // Re-order photos
    user.photos.forEach((photo, index) => {
      photo.order = index;
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Photos uploaded successfully. They are pending moderation.',
      data: {
        photos: user.photos,
      },
    });
  } catch (error) {
    logger.error('Photo upload error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error uploading photos',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   PUT /api/profile/photos/reorder
// @desc    Reorder user photos
// @access  Private
exports.reorderPhotos = async (req, res) => {
  try {
    const userId = req.user._id;
    const { photoIds } = req.body; // photoIds: [photoId1, photoId2, ...]

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Photo IDs array is required',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Create order map
    const orderMap = new Map();
    photoIds.forEach((photoId, index) => {
      orderMap.set(photoId.toString(), index);
    });

    // Update photo orders
    user.photos.forEach((photo) => {
      if (photo._id) {
        const newOrder = orderMap.get(photo._id.toString());
        if (newOrder !== undefined) {
          photo.order = newOrder;
        }
      }
    });

    // Sort by order
    user.photos.sort((a, b) => {
      const orderA = a?.order ?? 0;
      const orderB = b?.order ?? 0;
      return orderA - orderB;
    });

    await user.save();

    res.json({
      success: true,
      message: 'Photos reordered successfully',
      data: {
        photos: user.photos,
      },
    });
  } catch (error) {
    logger.error('Photo reorder error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error reordering photos',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   DELETE /api/profile/photos/:photoId
// @desc    Delete a photo
// @access  Private
exports.deletePhoto = async (req, res) => {
  try {
    const userId = req.user._id;
    const { photoId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.photos = user.photos.filter((photo) => photo._id?.toString() !== photoId);

    await user.save();

    res.json({
      success: true,
      message: 'Photo deleted successfully',
      data: {
        photos: user.photos,
      },
    });
  } catch (error) {
    logger.error('Photo delete error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error deleting photo',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   PUT /api/profile/photos/:photoId/approve
// @desc    Approve a photo (admin only)
// @access  Private/Admin
exports.approvePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;

    // Check if user is admin (you'll need to add admin flag to User model)
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can approve photos',
      });
    }

    // Find user with this photo
    const user = await User.findOne({ 'photos._id': photoId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found',
      });
    }

    const photo = user.photos.find((p) => p._id && p._id.toString() === photoId);
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found',
      });
    }

    photo.moderationStatus = 'approved';
    await user.save();

    res.json({
      success: true,
      message: 'Photo approved',
    });
  } catch (error) {
    logger.error('Approve photo error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error approving photo',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   PUT /api/profile/photos/:photoId/reject
// @desc    Reject a photo (admin only)
// @access  Private/Admin
exports.rejectPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const { reason } = req.body;

    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can reject photos',
      });
    }

    // Find user with this photo
    const user = await User.findOne({ 'photos._id': photoId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found',
      });
    }

    const photo = user.photos.find((p) => p._id && p._id.toString() === photoId);
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found',
      });
    }

    photo.moderationStatus = 'rejected';
    photo.rejectionReason = reason;
    await user.save();

    res.json({
      success: true,
      message: 'Photo rejected',
    });
  } catch (error) {
    logger.error('Reject photo error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error rejecting photo',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   GET /api/admin/photos/pending
// @desc    Get pending photos for moderation
// @access  Private/Admin
exports.getPendingPhotos = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access this',
      });
    }

    const users = await User.find({ 'photos.moderationStatus': 'pending' });

    const pendingPhotos = [];
    users.forEach((user) => {
      user.photos.forEach((photo) => {
        if (photo.moderationStatus === 'pending') {
          pendingPhotos.push({
            _id: photo._id,
            userId: user._id,
            userName: user.name,
            url: photo.url,
            uploadedAt: photo.uploadedAt,
          });
        }
      });
    });

    res.json({
      success: true,
      data: {
        photos: pendingPhotos,
        total: pendingPhotos.length,
      },
    });
  } catch (error) {
    logger.error('Get pending photos error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Error fetching pending photos',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
