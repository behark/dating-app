/**
 * Pagination Helper
 * Utilities for cursor-based and offset pagination
 * Optimized for infinite scroll and high-performance queries
 */

// Pagination configuration
const PAGINATION_LIMITS = {
  defaultLimit: 20,
  maxLimit: 100,
  discoveryLimit: 15,
  messagesLimit: 50,
  matchesLimit: 30,
};

/**
 * Encode cursor from document for cursor-based pagination
 */
const encodeCursor = (doc, sortFields = ['_id']) => {
  const cursorData = {};
  sortFields.forEach(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], doc);
    if (value !== undefined) {
      cursorData[field] = value instanceof Date ? value.toISOString() : value;
    }
  });
  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
};

/**
 * Decode cursor to query parameters
 */
const decodeCursor = (cursor) => {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8');
    const data = JSON.parse(decoded);
    
    // Convert ISO strings back to dates
    Object.keys(data).forEach(key => {
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
 * Build cursor-based query condition for efficient seeking
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
 * Parse pagination parameters from request
 */
const parsePaginationParams = (req, defaults = {}) => {
  const {
    page = defaults.page || 1,
    limit = defaults.limit || 20,
    cursor = defaults.cursor,
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
 * Build MongoDB sort object
 */
const buildSortObject = (sortBy, sortOrder) => {
  const sort = {};
  sort[sortBy] = sortOrder;
  return sort;
};

/**
 * Create paginated response
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
  let queryBuilder = model.find(finalQuery)
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

  const nextCursor = hasMore && items.length > 0 
    ? encodeCursor(items[items.length - 1], [sortBy])
    : null;

  return {
    items,
    hasMore,
    nextCursor,
  };
};

/**
 * Aggregate pagination helper
 */
const aggregatePaginate = async (model, pipeline, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  // Add count stage
  const countPipeline = [...pipeline, { $count: 'total' }];
  const countResult = await model.aggregate(countPipeline);
  const total = countResult[0]?.total || 0;

  // Add pagination stages
  const paginatedPipeline = [
    ...pipeline,
    { $skip: skip },
    { $limit: limit },
  ];

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
  return query
    .sort(buildSortObject(sortBy, sortOrder))
    .skip(skip)
    .limit(limit);
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
  const prefetchIds = prefetchItems.map(item => item._id?.toString() || item._id);

  return {
    items: mainItems,
    hasMore: result.items.length > limit,
    nextCursor: mainItems.length > 0 
      ? encodeCursor(mainItems[mainItems.length - 1], [sortBy])
      : null,
    prefetchIds,
    count: mainItems.length,
  };
};

/**
 * Batch cursor for streaming large datasets
 */
const createBatchCursor = (model, query, options = {}) => {
  const {
    batchSize = 100,
    sortBy = '_id',
    sortOrder = 1,
    select = '',
    lean = true,
  } = options;

  let queryBuilder = model.find(query)
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
