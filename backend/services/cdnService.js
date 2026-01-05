/**
 * CDN Configuration Service
 * Handles CDN setup for CloudFront, Cloudflare, or custom CDN
 */

// CDN Configuration
const CDN_CONFIG = {
  // CloudFront distribution
  cloudfront: {
    distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
    domain: process.env.CLOUDFRONT_DOMAIN || process.env.CDN_URL,
    enabled: !!process.env.CLOUDFRONT_DOMAIN,
  },

  // Cloudflare (alternative)
  cloudflare: {
    zoneId: process.env.CLOUDFLARE_ZONE_ID,
    domain: process.env.CLOUDFLARE_CDN_DOMAIN,
    enabled: !!process.env.CLOUDFLARE_CDN_DOMAIN,
  },

  // Origin server (S3, etc.)
  origin: {
    bucket: process.env.S3_BUCKET_NAME,
    region: process.env.AWS_REGION || 'us-east-1',
    url: process.env.S3_BUCKET_URL,
  },
};

// Cache durations (in seconds)
const CACHE_DURATIONS = {
  images: {
    profile: 86400 * 30, // 30 days
    chat: 86400 * 7, // 7 days
    thumbnail: 86400 * 365, // 1 year
  },
  static: {
    js: 86400 * 30, // 30 days
    css: 86400 * 30, // 30 days
    fonts: 86400 * 365, // 1 year
    icons: 86400 * 365, // 1 year
  },
  api: {
    discovery: 60, // 1 minute
    profile: 300, // 5 minutes
    static: 3600, // 1 hour
  },
};

// Cache-Control header generators
const getCacheControl = {
  immutable: (maxAge) => `public, max-age=${maxAge}, immutable`,
  standard: (maxAge) => `public, max-age=${maxAge}`,
  private: (maxAge) => `private, max-age=${maxAge}`,
  noStore: () => 'no-store, no-cache, must-revalidate',
  staleWhileRevalidate: (maxAge, staleTime) =>
    `public, max-age=${maxAge}, stale-while-revalidate=${staleTime}`,
};

/**
 * Generate CDN URL for a resource
 */
const getCdnUrl = (path, options = {}) => {
  const { type = 'image', size = 'medium', format = 'webp' } = options;

  // Determine CDN domain
  let cdnDomain = null;
  if (CDN_CONFIG.cloudfront.enabled) {
    cdnDomain = CDN_CONFIG.cloudfront.domain;
  } else if (CDN_CONFIG.cloudflare.enabled) {
    cdnDomain = CDN_CONFIG.cloudflare.domain;
  }

  // If no CDN, return original path
  if (!cdnDomain) {
    return path;
  }

  // Build CDN URL with transformations
  const baseUrl = `https://${cdnDomain}`;

  // For images, add transformation parameters
  if (type === 'image') {
    const transformParams = new URLSearchParams();

    // Size presets
    const sizes = {
      thumbnail: { w: 150, h: 150, q: 70 },
      small: { w: 300, h: 400, q: 75 },
      medium: { w: 600, h: 800, q: 80 },
      large: { w: 1200, h: 1600, q: 85 },
    };

    const sizeConfig = sizes[size] || sizes.medium;
    transformParams.set('w', sizeConfig.w);
    transformParams.set('h', sizeConfig.h);
    transformParams.set('q', sizeConfig.q);
    transformParams.set('f', format);
    transformParams.set('fit', 'cover');

    return `${baseUrl}${path}?${transformParams.toString()}`;
  }

  return `${baseUrl}${path}`;
};

/**
 * Generate responsive image URLs
 */
const getResponsiveImageUrls = (basePath) => {
  return {
    thumbnail: getCdnUrl(basePath, { size: 'thumbnail' }),
    small: getCdnUrl(basePath, { size: 'small' }),
    medium: getCdnUrl(basePath, { size: 'medium' }),
    large: getCdnUrl(basePath, { size: 'large' }),
    // WebP versions
    thumbnailWebp: getCdnUrl(basePath, { size: 'thumbnail', format: 'webp' }),
    smallWebp: getCdnUrl(basePath, { size: 'small', format: 'webp' }),
    mediumWebp: getCdnUrl(basePath, { size: 'medium', format: 'webp' }),
    largeWebp: getCdnUrl(basePath, { size: 'large', format: 'webp' }),
    // JPEG fallbacks
    thumbnailJpeg: getCdnUrl(basePath, { size: 'thumbnail', format: 'jpeg' }),
    smallJpeg: getCdnUrl(basePath, { size: 'small', format: 'jpeg' }),
    mediumJpeg: getCdnUrl(basePath, { size: 'medium', format: 'jpeg' }),
    largeJpeg: getCdnUrl(basePath, { size: 'large', format: 'jpeg' }),
  };
};

/**
 * CDN Middleware for Express
 * Sets appropriate cache headers
 */
const cdnCacheMiddleware = (req, res, next) => {
  const url = req.url;

  // Images
  if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url)) {
    if (url.includes('profile') || url.includes('avatar')) {
      res.set('Cache-Control', getCacheControl.immutable(CACHE_DURATIONS.images.profile));
    } else if (url.includes('chat') || url.includes('message')) {
      res.set('Cache-Control', getCacheControl.standard(CACHE_DURATIONS.images.chat));
    } else if (url.includes('thumb') || url.includes('thumbnail')) {
      res.set('Cache-Control', getCacheControl.immutable(CACHE_DURATIONS.images.thumbnail));
    } else {
      res.set('Cache-Control', getCacheControl.standard(CACHE_DURATIONS.images.profile));
    }
  }
  // Static assets
  else if (/\.(js|css)$/i.test(url)) {
    // Hashed assets can be cached indefinitely
    if (/\.[a-f0-9]{8,}\.(js|css)$/i.test(url)) {
      res.set('Cache-Control', getCacheControl.immutable(CACHE_DURATIONS.static.js));
    } else {
      res.set('Cache-Control', getCacheControl.standard(CACHE_DURATIONS.static.js));
    }
  }
  // Fonts
  else if (/\.(woff|woff2|ttf|eot|otf)$/i.test(url)) {
    res.set('Cache-Control', getCacheControl.immutable(CACHE_DURATIONS.static.fonts));
  }
  // API responses
  else if (url.startsWith('/api/')) {
    // Don't cache by default - let specific routes set their own headers
    res.set('Cache-Control', getCacheControl.noStore());
  }

  // Security headers
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'SAMEORIGIN');

  next();
};

/**
 * Generate CloudFront signed URL for private content
 */
const getSignedUrl = async (path, expiresInSeconds = 3600) => {
  const { CloudFront } = require('@aws-sdk/client-cloudfront');
  const { getSignedUrl } = require('@aws-sdk/cloudfront-signer');

  if (!CDN_CONFIG.cloudfront.enabled) {
    return getCdnUrl(path);
  }

  try {
    const url = getCdnUrl(path);
    const dateLessThan = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    const signedUrl = getSignedUrl({
      url,
      dateLessThan,
      keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
      privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
    });

    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return getCdnUrl(path);
  }
};

/**
 * Invalidate CDN cache for specific paths
 */
const invalidateCache = async (paths) => {
  if (!CDN_CONFIG.cloudfront.enabled) {
    console.log('CDN invalidation skipped - CloudFront not configured');
    return;
  }

  try {
    const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');

    const client = new CloudFrontClient({
      region: 'us-east-1', // CloudFront is global but uses us-east-1
    });

    const command = new CreateInvalidationCommand({
      DistributionId: CDN_CONFIG.cloudfront.distributionId,
      InvalidationBatch: {
        CallerReference: `invalidation-${Date.now()}`,
        Paths: {
          Quantity: paths.length,
          Items: paths.map((p) => (p.startsWith('/') ? p : `/${p}`)),
        },
      },
    });

    const response = await client.send(command);
    console.log('CDN invalidation created:', response.Invalidation.Id);
    return response;
  } catch (error) {
    console.error('CDN invalidation error:', error);
    throw error;
  }
};

/**
 * Preload critical images
 */
const getPreloadHeaders = (images) => {
  return images.map((img) => ({
    key: 'Link',
    value: `<${getCdnUrl(img, { size: 'medium' })}>; rel=preload; as=image`,
  }));
};

/**
 * Transform user photos to use CDN URLs
 */
const transformPhotosForCdn = (photos) => {
  if (!photos || !Array.isArray(photos)) {
    return [];
  }

  return photos.map((photo) => {
    if (typeof photo === 'string') {
      return {
        url: photo,
        ...getResponsiveImageUrls(photo),
      };
    }

    return {
      ...photo,
      ...getResponsiveImageUrls(photo.url || photo),
    };
  });
};

module.exports = {
  CDN_CONFIG,
  CACHE_DURATIONS,
  getCacheControl,
  getCdnUrl,
  getResponsiveImageUrls,
  cdnCacheMiddleware,
  getSignedUrl,
  invalidateCache,
  getPreloadHeaders,
  transformPhotosForCdn,
};
