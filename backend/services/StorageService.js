/**
 * Storage Service
 * Handles file uploads to AWS S3 or Cloudinary with CDN support
 */

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const path = require('path');

// Storage provider type
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'cloudinary'; // 's3' or 'cloudinary'

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const S3_BUCKET = process.env.AWS_S3_BUCKET;
const CDN_URL = process.env.CDN_URL; // CloudFront distribution URL

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// File type configurations
const FILE_CONFIG = {
  image: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
    folder: 'photos',
    transformations: {
      thumbnail: { width: 150, height: 150, crop: 'fill', quality: 80 },
      medium: { width: 600, height: 800, crop: 'limit', quality: 85 },
      large: { width: 1200, height: 1600, crop: 'limit', quality: 90 },
    },
  },
  video: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
    folder: 'videos',
    maxDuration: 15, // seconds
    transformations: {
      preview: { width: 480, height: 854, crop: 'limit', quality: 'auto' },
      thumbnail: { width: 300, height: 300, crop: 'fill', start_offset: '2' },
    },
  },
  document: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['application/pdf'],
    folder: 'documents',
  },
};

/**
 * Generate unique file name
 */
const generateFileName = (userId, fileType, originalName) => {
  const timestamp = Date.now();
  const hash = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName).toLowerCase();
  return `${userId}/${fileType}/${timestamp}-${hash}${ext}`;
};

/**
 * Validate file before upload
 */
const validateFile = (file, fileType) => {
  const config = FILE_CONFIG[fileType];

  if (!config) {
    throw new Error(`Invalid file type: ${fileType}`);
  }

  if (file.size > config.maxSize) {
    throw new Error(`File size exceeds maximum allowed (${config.maxSize / 1024 / 1024}MB)`);
  }

  if (!config.allowedTypes.includes(file.mimetype)) {
    throw new Error(`File type ${file.mimetype} is not allowed`);
  }

  return true;
};

/**
 * Upload to AWS S3
 */
const uploadToS3 = async (file, fileName, fileType) => {
  const config = FILE_CONFIG[fileType];
  const key = `${config.folder}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    CacheControl: 'max-age=31536000', // 1 year cache
    Metadata: {
      originalName: file.originalname,
      uploadedAt: new Date().toISOString(),
    },
  });

  await s3Client.send(command);

  // Return CDN URL if configured, otherwise S3 URL
  const url = CDN_URL
    ? `${CDN_URL}/${key}`
    : `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return {
    url,
    key,
    bucket: S3_BUCKET,
    provider: 's3',
  };
};

/**
 * Upload to Cloudinary
 */
const uploadToCloudinary = async (file, fileName, fileType, userId) => {
  const config = FILE_CONFIG[fileType];

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: `dating-app/${config.folder}/${userId}`,
      public_id: path.basename(fileName, path.extname(fileName)),
      resource_type: fileType === 'video' ? 'video' : 'image',
      overwrite: false,
      invalidate: true,
      // Eager transformations for images
      ...(fileType === 'image' && {
        eager: [
          { transformation: [config.transformations.thumbnail] },
          { transformation: [config.transformations.medium] },
        ],
        eager_async: true,
      }),
      // Video specific options
      ...(fileType === 'video' && {
        eager: [
          { format: 'mp4', video_codec: 'h264', transformation: [config.transformations.preview] },
        ],
        eager_async: true,
      }),
    };

    const uploadStream = cloudinary.uploader.upload_stream(/** @type {any} */(uploadOptions), (error, result) => {
      if (error) {
        reject(error);
      } else if (!result) {
        reject(new Error('Upload failed: No result returned'));
      } else {
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          duration: result.duration, // For videos
          thumbnailUrl:
            fileType === 'video'
              ? cloudinary.url(result.public_id, {
                  resource_type: 'video',
                  format: 'jpg',
                  ...config.transformations.thumbnail,
                })
              : undefined,
          variants:
            fileType === 'image'
              ? {
                  thumbnail: cloudinary.url(result.public_id, config.transformations.thumbnail),
                  medium: cloudinary.url(result.public_id, config.transformations.medium),
                  large: cloudinary.url(result.public_id, config.transformations.large),
                }
              : undefined,
          provider: 'cloudinary',
        });
      }
    });

    uploadStream.end(file.buffer);
  });
};

/**
 * Delete from S3
 */
const deleteFromS3 = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
};

/**
 * Delete from Cloudinary
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

/**
 * Get signed URL for private S3 objects
 */
const getSignedS3Url = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

// Main Storage Service API
const StorageService = {
  /**
   * Upload a file
   * @param {Object} file - File object from multer
   * @param {string} userId - User ID
   * @param {string} fileType - Type of file (image, video, document)
   * @returns {Promise<Object>} Upload result with URL and metadata
   */
  async upload(file, userId, fileType = 'image') {
    // Validate inputs
    if (!file) {
      throw new Error('File is required');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!fileType || typeof fileType !== 'string') {
      throw new Error('File type must be a string');
    }

    // Validate file
    validateFile(file, fileType);

    // Generate file name
    const fileName = generateFileName(userId, fileType, file.originalname);

    // Upload based on provider
    if (STORAGE_PROVIDER === 's3') {
      if (!S3_BUCKET) {
        throw new Error('S3 bucket not configured. Set AWS_S3_BUCKET environment variable.');
      }
      return uploadToS3(file, fileName, fileType);
    } else {
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
      }
      return uploadToCloudinary(file, fileName, fileType, userId);
    }
  },

  /**
   * Upload multiple files
   */
  async uploadMultiple(files, userId, fileType = 'image') {
    const results = [];

    for (const file of files) {
      try {
        const result = await this.upload(file, userId, fileType);
        results.push({ success: true, ...result });
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : String(error),
          fileName: file.originalname,
        });
      }
    }

    return results;
  },

  /**
   * Delete a file
   */
  async delete(identifier, provider = STORAGE_PROVIDER, resourceType = 'image') {
    if (provider === 's3') {
      return deleteFromS3(identifier);
    } else {
      return deleteFromCloudinary(identifier, resourceType);
    }
  },

  /**
   * Get optimized image URL
   */
  getOptimizedUrl(url, options = {}) {
    if (STORAGE_PROVIDER === 'cloudinary' && url.includes('cloudinary')) {
      // Extract public ID from URL
      const publicId = url
        .split('/')
        .slice(-2)
        .join('/')
        .replace(/\.[^.]+$/, '');

      return cloudinary.url(publicId, {
        quality: options.quality || 'auto',
        fetch_format: options.format || 'auto',
        width: options.width,
        height: options.height,
        crop: options.crop || 'limit',
        ...options,
      });
    }

    // For S3 with CloudFront, URL stays the same (transformations handled at edge)
    return url;
  },

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl(url, width = 150, height = 150) {
    return this.getOptimizedUrl(url, { width, height, crop: 'fill' });
  },

  /**
   * Generate upload signature for direct client upload
   */
  async getUploadSignature(userId, fileType = 'image') {
    if (STORAGE_PROVIDER === 'cloudinary') {
      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;

      if (!apiSecret || !cloudName || !apiKey) {
        throw new Error('Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
      }

      const timestamp = Math.round(new Date().getTime() / 1000);
      const config = FILE_CONFIG[fileType];

      if (!config) {
        throw new Error(`Invalid file type: ${fileType}`);
      }

      const params = {
        timestamp,
        folder: `dating-app/${config.folder}/${userId}`,
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
      };

      const signature = cloudinary.utils.api_sign_request(
        params,
        apiSecret
      );

      return {
        signature,
        timestamp,
        cloudName,
        apiKey,
        folder: params.folder,
        uploadPreset: params.upload_preset,
      };
    } else {
      // For S3, generate presigned URL
      const fileName = generateFileName(userId, fileType, 'upload.tmp');
      const key = `${FILE_CONFIG[fileType].folder}/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        ContentType: 'application/octet-stream',
      });

      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      return {
        presignedUrl,
        key,
        bucket: S3_BUCKET,
        expiresIn: 3600,
      };
    }
  },

  /**
   * Moderate image using Cloudinary AI
   */
  async moderateImage(publicId) {
    if (STORAGE_PROVIDER !== 'cloudinary') {
      return { safe: true, moderation: null };
    }

    try {
      const result = await cloudinary.api.resource(publicId, {
        moderation: 'aws_rek',
      });

      const moderation = result.moderation?.[0];
      const safe = moderation?.status === 'approved';

      return { safe, moderation };
    } catch (error) {
      console.error('Moderation error:', error);
      return {
        safe: true,
        moderation: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  /**
   * Get file info
   */
  async getFileInfo(identifier) {
    if (STORAGE_PROVIDER === 'cloudinary') {
      return cloudinary.api.resource(identifier);
    } else {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: identifier,
      });

      const response = await s3Client.send(command);
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    }
  },

  // Expose configurations
  FILE_CONFIG,
  STORAGE_PROVIDER,
};

module.exports = StorageService;
