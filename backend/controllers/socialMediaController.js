const User = require('../models/User');

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

// @route   POST /api/profile/social-media/connect-spotify
// @desc    Connect Spotify to user profile
// @access  Private
exports.connectSpotify = async (req, res) => {
  try {
    const userId = req.user._id;
    const { spotifyId, username, profileUrl } = req.body;

    if (!spotifyId || !username) {
      return res.status(400).json({
        success: false,
        message: 'Spotify ID and username are required',
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        'socialMedia.spotify': {
          id: spotifyId,
          username,
          profileUrl: profileUrl || `https://open.spotify.com/user/${spotifyId}`,
          isVerified: true,
        },
      },
      { new: true }
    ).select('socialMedia');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Spotify connected successfully',
      data: {
        spotify: user?.socialMedia.spotify,
      },
    });
  } catch (error) {
    console.error('Connect Spotify error:', error);
    res.status(500).json({
      success: false,
      message: 'Error connecting Spotify',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   POST /api/profile/social-media/connect-instagram
// @desc    Connect Instagram to user profile
// @access  Private
exports.connectInstagram = async (req, res) => {
  try {
    const userId = req.user._id;
    const { instagramId, username, profileUrl } = req.body;

    if (!instagramId || !username) {
      return res.status(400).json({
        success: false,
        message: 'Instagram ID and username are required',
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        'socialMedia.instagram': {
          id: instagramId,
          username,
          profileUrl: profileUrl || `https://instagram.com/${username}`,
          isVerified: true,
        },
      },
      { new: true }
    ).select('socialMedia');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Instagram connected successfully',
      data: {
        instagram: user?.socialMedia.instagram,
      },
    });
  } catch (error) {
    console.error('Connect Instagram error:', error);
    res.status(500).json({
      success: false,
      message: 'Error connecting Instagram',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   DELETE /api/profile/social-media/disconnect-spotify
// @desc    Disconnect Spotify from profile
// @access  Private
exports.disconnectSpotify = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        'socialMedia.spotify': {
          id: undefined,
          username: undefined,
          profileUrl: undefined,
          isVerified: false,
        },
      },
      { new: true }
    ).select('socialMedia');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Spotify disconnected successfully',
    });
  } catch (error) {
    console.error('Disconnect Spotify error:', error);
    res.status(500).json({
      success: false,
      message: 'Error disconnecting Spotify',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   DELETE /api/profile/social-media/disconnect-instagram
// @desc    Disconnect Instagram from profile
// @access  Private
exports.disconnectInstagram = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        'socialMedia.instagram': {
          id: undefined,
          username: undefined,
          profileUrl: undefined,
          isVerified: false,
        },
      },
      { new: true }
    ).select('socialMedia');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Instagram disconnected successfully',
    });
  } catch (error) {
    console.error('Disconnect Instagram error:', error);
    res.status(500).json({
      success: false,
      message: 'Error disconnecting Instagram',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// @route   GET /api/profile/:userId/social-media
// @desc    Get user's connected social media accounts (public)
// @access  Public
exports.getSocialMedia = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('socialMedia');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Only return verified connections
    const socialMedia = {
      spotify: user?.socialMedia.spotify.isVerified
        ? {
            username: user?.socialMedia.spotify.username,
            profileUrl: user?.socialMedia.spotify.profileUrl,
          }
        : null,
      instagram: user?.socialMedia.instagram.isVerified
        ? {
            username: user?.socialMedia.instagram.username,
            profileUrl: user?.socialMedia.instagram.profileUrl,
          }
        : null,
    };

    res.json({
      success: true,
      data: {
        socialMedia,
      },
    });
  } catch (error) {
    console.error('Get social media error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching social media',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
