const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

exports.uploadLocal = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
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
    res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
};
