/**
 * Pagination Helper
 * Utilities for cursor-based and offset pagination
 * Optimized for infinite scroll and high-performance queries
 * @module utils/pagination
 */

/**
 * Pagination configuration limits
 * @constant {Object}
 * @property {number} defaultLimit - Default items per page (20)
 * @property {number} maxLimit - Maximum items per page (100)
 * @property {number} discoveryLimit - Limit for discovery queries (15)
 * @property {number} messagesLimit - Limit for message queries (50)
 * @property {number} matchesLimit - Limit for match queries (30)
 */
const PAGINATION_LIMITS = {
  defaultLimit: 20,
  maxLimit: 100,
  discoveryLimit: 15,
  messagesLimit: 50,
  matchesLimit: 30,
};

/**
 * Encode a MongoDB document into a cursor string for pagination
 * @param {Object} doc - The MongoDB document to encode
 * @param {string[]} [sortFields=['_id']] - Fields to include in cursor
 * @returns {string} Base64-encoded cursor string
 * @example
 * const cursor = encodeCursor(lastDoc, ['createdAt', '_id']);
 */
const encodeCursor = (doc, sortFields = ['_id']) => {
  const cursorData = {};
  sortFields.forEach((field) => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], doc);
    if (value !== undefined) {
      cursorData[field] = value instanceof Date ? value.toISOString() : value;
    }
  });
  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
};

/**
 * Decode a cursor string back to query parameters
 * @param {string} cursor - Base64-encoded cursor string
 * @returns {Object|null} Decoded cursor data or null if invalid
 * @example
 * const cursorData = decodeCursor('eyJjcmVhdGVkQXQiOiIyMDI0LTAxLTAxIn0=');
 */
const decodeCursor = (cursor) => {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8');
    const data = JSON.parse(decoded);

    // Convert ISO strings back to dates
    Object.keys(data).forEach((key) => {
      if (typeof data[key] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(data[key])) {
        data[key] = new Date(data[key]);
      }
    });

    return data;
  } catch (error) {
    return null;
  }
};

/**
 * Build a MongoDB query condition from a cursor for efficient seeking
 * @param {string} cursor - The cursor string to decode
 * @param {number} [sortDirection=-1] - Sort direction (-1 for desc, 1 for asc)
 * @returns {Object} MongoDB query condition
 */
const buildCursorQuery = (cursor, sortDirection = -1) => {
  if (!cursor) return {};

  const cursorData = decodeCursor(cursor);
  if (!cursorData) return {};

  const operator = sortDirection === -1 ? '$lt' : '$gt';
  const fields = Object.keys(cursorData);

  if (fields.length === 1) {
    return { [fields[0]]: { [operator]: cursorData[fields[0]] } };
  }

  // For compound sorts, use $or with compound conditions
  const conditions = [];
  for (let i = 0; i < fields.length; i++) {
    const condition = {};
    for (let j = 0; j < i; j++) {
      condition[fields[j]] = cursorData[fields[j]];
    }
    condition[fields[i]] = { [operator]: cursorData[fields[i]] };
    conditions.push(condition);
  }

  return conditions.length > 0 ? { $or: conditions } : {};
};

/**
 * Parse pagination parameters from an Express request object
 * @param {Object} req - Express request object
 * @param {Object} [defaults={}] - Default values for pagination params
 * @param {number} [defaults.page=1] - Default page number
 * @param {number} [defaults.limit=20] - Default items per page
 * @param {string} [defaults.sortBy='createdAt'] - Default sort field
 * @param {string} [defaults.sortOrder='desc'] - Default sort order
 * @returns {Object} Parsed pagination parameters
 * @example
 * const params = parsePaginationParams(req, { limit: 15 });
 * // Returns: { page, limit, cursor, skip, sortBy, sortOrder }
 */
const parsePaginationParams = (req, defaults = {}) => {
  const defaultCursor =
    defaults && typeof defaults === 'object' && 'cursor' in defaults ? defaults.cursor : undefined;
  const {
    page = defaults.page || 1,
    limit = defaults.limit || 20,
    cursor = defaultCursor,
    sortBy = defaults.sortBy || 'createdAt',
    sortOrder = defaults.sortOrder || 'desc',
  } = req.query;

  const parsedLimit = Math.min(PAGINATION_LIMITS.maxLimit, Math.max(1, parseInt(limit) || 20));
  const parsedPage = Math.max(1, parseInt(page) || 1);

  return {
    page: parsedPage,
    limit: parsedLimit,
    cursor,
    skip: (parsedPage - 1) * parsedLimit,
    sortBy,
    sortOrder: sortOrder === 'asc' ? 1 : -1,
  };
};

/**
 * Build a MongoDB sort object from field name and direction
 * @param {string} sortBy - Field name to sort by
 * @param {number} sortOrder - Sort direction (1 for asc, -1 for desc)
 * @returns {Object} MongoDB sort object
 */
const buildSortObject = (sortBy, sortOrder) => {
  const sort = {};
  sort[sortBy] = sortOrder;
  return sort;
};

/**
 * Create a standardized paginated response object
 * @param {Array} items - Array of items for current page
 * @param {number} total - Total number of items
 * @param {Object} pagination - Pagination parameters
 * @param {number} pagination.page - Current page number
 * @param {number} pagination.limit - Items per page
 * @param {number} pagination.skip - Items skipped
 * @returns {Object} Paginated response with items and metadata
 */
const createPaginatedResponse = (items, total, pagination) => {
  const { page, limit, skip } = pagination;
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;
  const hasPrev = page > 1;

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasMore,
      hasPrev,
      nextPage: hasMore ? page + 1 : null,
      prevPage: hasPrev ? page - 1 : null,
    },
  };
};

/**
 * Cursor-based pagination helper - optimized for infinite scroll
 * Uses cursor-based pagination for efficient deep pagination
 * @param {any} model - Mongoose model to query
 * @param {Object} query - Base MongoDB query object
 * @param {Object} [options={}] - Pagination options
 * @param {string} [options.cursor] - Cursor for next page
 * @param {number} [options.limit=20] - Items per page
 * @param {string} [options.sortBy='createdAt'] - Sort field
 * @param {number} [options.sortOrder=-1] - Sort direction
 * @param {string} [options.select=''] - Fields to select
 * @param {string} [options.populate=''] - Fields to populate
 * @param {boolean} [options.lean=true] - Return plain objects
 * @returns {Promise<Object>} Paginated result with items, hasMore, nextCursor
 * @example
 * const result = await cursorPaginate(User, { isActive: true }, {
 *   limit: 20,
 *   sortBy: 'lastActive',
 *   populate: 'profile'
 * });
 */
const cursorPaginate = async (model, query, options = {}) => {
  const {
    cursor,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = -1,
    select = '',
    populate = '',
    lean = true, // Use lean by default for better performance
  } = options;

  const actualLimit = Math.min(limit, PAGINATION_LIMITS.maxLimit);
  const finalQuery = { ...query };

  // Build cursor condition using encoded cursor
  if (cursor) {
    const cursorQuery = buildCursorQuery(cursor, sortOrder);
    Object.assign(finalQuery, cursorQuery);
  }

  // Execute query with one extra to check for more
  let queryBuilder = model
    .find(finalQuery)
    .sort({ [sortBy]: sortOrder })
    .limit(actualLimit + 1);

  if (select) queryBuilder = queryBuilder.select(select);
  if (populate) queryBuilder = queryBuilder.populate(populate);
  if (lean) queryBuilder = queryBuilder.lean();

  const items = await queryBuilder.exec();
  const hasMore = items.length > actualLimit;

  if (hasMore) {
    items.pop(); // Remove the extra item
  }

  const nextCursor =
    hasMore && items.length > 0 ? encodeCursor(items[items.length - 1], [sortBy]) : null;

  return {
    items,
    hasMore,
    nextCursor,
  };
};

/**
 * Aggregate pagination helper for complex queries
 * @param {any} model - Mongoose model to query
 * @param {Array} pipeline - MongoDB aggregation pipeline
 * @param {Object} [options={}] - Pagination options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @returns {Promise<Object>} Paginated aggregation result
 */
const aggregatePaginate = async (model, pipeline, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  // Add count stage
  const countPipeline = [...pipeline, { $count: 'total' }];
  const countResult = await model.aggregate(countPipeline);
  const total = countResult[0]?.total || 0;

  // Add pagination stages
  const paginatedPipeline = [...pipeline, { $skip: skip }, { $limit: limit }];

  const items = await model.aggregate(paginatedPipeline);

  return createPaginatedResponse(items, total, { page, limit, skip });
};

/**
 * Offset pagination middleware
 */
const paginationMiddleware = (defaults = {}) => {
  return (req, res, next) => {
    req.pagination = parsePaginationParams(req, defaults);
    next();
  };
};

/**
 * Apply pagination to mongoose query
 */
const applyPagination = (query, pagination) => {
  const { skip, limit, sortBy, sortOrder } = pagination;
  return query.sort(buildSortObject(sortBy, sortOrder)).skip(skip).limit(limit);
};

/**
 * Infinite scroll response builder - optimized for discovery
 */
const buildInfiniteScrollResponse = (items, options = {}) => {
  const { hasMore = false, nextCursor = null, total = null, prefetchIds = [] } = options;

  return {
    success: true,
    data: {
      items,
      hasMore,
      nextCursor,
      ...(total !== null && { total }),
      ...(prefetchIds.length > 0 && { prefetchIds }), // IDs for client-side prefetch
    },
  };
};

/**
 * Optimized infinite scroll pagination for discovery
 * Includes prefetch hints for smoother scrolling
 */
const infiniteScrollPaginate = async (model, query, options = {}) => {
  const {
    cursor,
    limit = PAGINATION_LIMITS.discoveryLimit,
    sortBy = 'createdAt',
    sortOrder = -1,
    select = '',
    populate = '',
    lean = true,
    prefetchCount = 3, // Number of items to hint for prefetch
  } = options;

  const fetchLimit = limit + prefetchCount;
  const result = await cursorPaginate(model, query, {
    cursor,
    limit: fetchLimit,
    sortBy,
    sortOrder,
    select,
    populate,
    lean,
  });

  const mainItems = result.items.slice(0, limit);
  const prefetchItems = result.items.slice(limit);
  const prefetchIds = prefetchItems.map((item) => item._id?.toString() || item._id);

  return {
    items: mainItems,
    hasMore: result.items.length > limit,
    nextCursor:
      mainItems.length > 0 ? encodeCursor(mainItems[mainItems.length - 1], [sortBy]) : null,
    prefetchIds,
    count: mainItems.length,
  };
};

/**
 * Batch cursor for streaming large datasets
 */
const createBatchCursor = (model, query, options = {}) => {
  const { batchSize = 100, sortBy = '_id', sortOrder = 1, select = '', lean = true } = options;

  let queryBuilder = model
    .find(query)
    .sort({ [sortBy]: sortOrder })
    .lean(lean)
    .batchSize(batchSize);

  if (select) queryBuilder = queryBuilder.select(select);

  return queryBuilder.cursor();
};

module.exports = {
  parsePaginationParams,
  buildSortObject,
  createPaginatedResponse,
  cursorPaginate,
  aggregatePaginate,
  paginationMiddleware,
  applyPagination,
  buildInfiniteScrollResponse,
  // New exports
  encodeCursor,
  decodeCursor,
  buildCursorQuery,
  infiniteScrollPaginate,
  createBatchCursor,
  PAGINATION_LIMITS,
};
