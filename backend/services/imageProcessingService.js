/**
 * Image Processing Service
 * Handles image compression, optimization, and CDN delivery
 */

const crypto = require('crypto');
const path = require('path');
const sharp = require('sharp');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'dating-app-images';
const CDN_URL = process.env.CDN_URL || process.env.CLOUDFRONT_URL;

// Image size configurations
const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, quality: 70 },
  small: { width: 300, height: 400, quality: 75 },
  medium: { width: 600, height: 800, quality: 80 },
  large: { width: 1200, height: 1600, quality: 85 },
  original: { width: 2400, height: 3200, quality: 90 },
};

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed formats
const ALLOWED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'heic', 'heif'];

/**
 * Generate unique filename
 */
const generateFileName = (userId, originalName) => {
  const timestamp = Date.now();
  const hash = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName).toLowerCase() || '.jpg';
  return `${userId}/${timestamp}-${hash}${ext}`;
};

/**
 * Compress and optimize image
 */
const compressImage = async (buffer, size = 'medium', format = 'webp') => {
  const config = IMAGE_SIZES[size] || IMAGE_SIZES.medium;

  let pipeline = sharp(buffer)
    .rotate() // Auto-rotate based on EXIF
    .resize(config.width, config.height, {
      fit: 'inside',
      withoutEnlargement: true,
    });

  // Convert to WebP for best compression, fallback to JPEG
  if (format === 'webp') {
    pipeline = pipeline.webp({ quality: config.quality, effort: 4 });
  } else {
    pipeline = pipeline.jpeg({ quality: config.quality, mozjpeg: true });
  }

  return pipeline.toBuffer();
};

/**
 * Generate multiple sizes of an image
 */
const generateImageVariants = async (buffer) => {
  const variants = {};

  // Generate WebP versions
  const sizes = ['thumbnail', 'small', 'medium', 'large'];

  await Promise.all(
    sizes.map(async (size) => {
      const webpBuffer = await compressImage(buffer, size, 'webp');
      const jpegBuffer = await compressImage(buffer, size, 'jpeg');

      variants[size] = {
        webp: webpBuffer,
        jpeg: jpegBuffer,
      };
    })
  );

  return variants;
};

/**
 * Upload image to S3 with CDN optimization
 */
const uploadToS3 = async (buffer, key, contentType = 'image/webp') => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // 1 year cache
    Metadata: {
      'x-amz-meta-processed': 'true',
    },
  });

  await s3Client.send(command);

  // Return CDN URL if available, otherwise S3 URL
  if (CDN_URL) {
    return `${CDN_URL}/${key}`;
  }
  return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
};

/**
 * Delete image from S3
 */
const deleteFromS3 = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
};

/**
 * Process and upload profile image with all variants
 */
const processProfileImage = async (file, userId) => {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 5MB limit');
    }

    // Get image metadata
    const metadata = await sharp(file.buffer).metadata();

    // Validate format
    const format = metadata.format?.toLowerCase();
    if (!ALLOWED_FORMATS.includes(format)) {
      throw new Error(`Invalid image format: ${format}`);
    }

    // Generate unique base filename
    const baseName = `profiles/${generateFileName(userId, file.originalname)}`;

    // Generate all size variants
    const variants = await generateImageVariants(file.buffer);

    // Upload all variants to S3
    const uploadedUrls = {};

    for (const [size, formats] of Object.entries(variants)) {
      const webpKey = `${baseName.replace(/\.\w+$/, '')}_${size}.webp`;
      const jpegKey = `${baseName.replace(/\.\w+$/, '')}_${size}.jpg`;

      const [webpUrl, jpegUrl] = await Promise.all([
        uploadToS3(formats.webp, webpKey, 'image/webp'),
        uploadToS3(formats.jpeg, jpegKey, 'image/jpeg'),
      ]);

      uploadedUrls[size] = {
        webp: webpUrl,
        jpeg: jpegUrl,
      };
    }

    return {
      success: true,
      urls: uploadedUrls,
      metadata: {
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        format: metadata.format,
        processedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Image processing error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Process chat media (images/videos)
 */
const processChatImage = async (file, senderId, receiverId) => {
  try {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 5MB limit');
    }

    const baseName = `chat/${senderId}/${receiverId}/${Date.now()}`;

    // Generate medium and thumbnail only for chat
    const [mediumBuffer, thumbnailBuffer] = await Promise.all([
      compressImage(file.buffer, 'medium', 'webp'),
      compressImage(file.buffer, 'thumbnail', 'webp'),
    ]);

    const [mediumUrl, thumbnailUrl] = await Promise.all([
      uploadToS3(mediumBuffer, `${baseName}_medium.webp`, 'image/webp'),
      uploadToS3(thumbnailBuffer, `${baseName}_thumb.webp`, 'image/webp'),
    ]);

    return {
      success: true,
      urls: {
        medium: mediumUrl,
        thumbnail: thumbnailUrl,
      },
    };
  } catch (error) {
    console.error('Chat image processing error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate responsive image srcset
 */
const generateSrcSet = (urls) => {
  const sizes = ['thumbnail', 'small', 'medium', 'large'];
  const widths = { thumbnail: 150, small: 300, medium: 600, large: 1200 };

  const srcset = sizes
    .filter((size) => urls[size])
    .map((size) => `${urls[size].webp} ${widths[size]}w`)
    .join(', ');

  return {
    srcset,
    fallback: urls.medium?.jpeg || urls.small?.jpeg,
    thumbnail: urls.thumbnail?.webp || urls.thumbnail?.jpeg,
  };
};

/**
 * Get optimized image URL based on device/viewport
 */
const getOptimalImageUrl = (urls, viewportWidth = 600, supportWebP = true) => {
  let size = 'medium';

  if (viewportWidth <= 200) size = 'thumbnail';
  else if (viewportWidth <= 400) size = 'small';
  else if (viewportWidth <= 800) size = 'medium';
  else size = 'large';

  const format = supportWebP ? 'webp' : 'jpeg';
  return urls[size]?.[format] || urls.medium?.jpeg;
};

/**
 * Batch process multiple images
 */
const batchProcessImages = async (files, userId, options = {}) => {
  const { concurrency = 3, onProgress } = options;
  const results = [];

  // Process in batches to limit concurrency
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((file) => processProfileImage(file, userId)));

    results.push(...batchResults);

    if (onProgress) {
      onProgress({
        processed: Math.min(i + concurrency, files.length),
        total: files.length,
      });
    }
  }

  return results;
};

/**
 * Extract dominant colors from image
 */
const extractDominantColors = async (buffer, count = 5) => {
  try {
    const { dominant, channels } = await sharp(buffer).resize(100, 100, { fit: 'cover' }).stats();

    return {
      dominant: {
        r: Math.round(dominant.r),
        g: Math.round(dominant.g),
        b: Math.round(dominant.b),
      },
      mean: channels.map((c) => Math.round(c.mean)),
    };
  } catch (error) {
    return null;
  }
};

/**
 * Generate blur hash placeholder
 */
const generateBlurPlaceholder = async (buffer) => {
  try {
    const tiny = await sharp(buffer).resize(20, 20, { fit: 'inside' }).blur(5).toBuffer();

    return `data:image/jpeg;base64,${tiny.toString('base64')}`;
  } catch (error) {
    return null;
  }
};

module.exports = {
  compressImage,
  generateImageVariants,
  uploadToS3,
  deleteFromS3,
  processProfileImage,
  processChatImage,
  generateSrcSet,
  getOptimalImageUrl,
  batchProcessImages,
  extractDominantColors,
  generateBlurPlaceholder,
  IMAGE_SIZES,
  MAX_FILE_SIZE,
  ALLOWED_FORMATS,
};
