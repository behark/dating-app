const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
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

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

exports.uploadLocal = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, { message: 'No file uploaded' });
    }

    // Since we're using multer diskStorage, the file is already saved
    // We just need to return the URL
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      url: fileUrl,
      fileName: req.file.filename,
      fileId: req.file.filename.split('.')[0]
    });
  } catch (error) {
    console.error('Local upload error:', error);
    sendError(res, 500, { message: 'Upload failed', error: error.message });
  }
};
