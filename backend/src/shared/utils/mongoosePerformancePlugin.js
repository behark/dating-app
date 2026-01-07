/**
 * Mongoose Performance Plugin
 * Tracks database query performance automatically
 */

const { trackDatabaseQuery } = require('../../api/middleware/performanceMonitoring');

/**
 * Mongoose plugin to track query performance
 * @param {import('mongoose').Schema} schema
 */
function performancePlugin(schema) {
  // Store start time before query execution
  const allOperations = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'findOneAndDelete',
    'save',
    'updateOne',
    'updateMany',
    'deleteOne',
    'deleteMany',
    'aggregate',
  ];
  allOperations.forEach((op) => {
    // @ts-ignore - Mongoose pre hook typing
    schema.pre(
      op,
      /** @this {any} */ function () {
        this._startTime = Date.now();
      }
    );
  });

  // Track find operations
  const findOperations = ['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete'];
  /** @this {any} @param {any} docs */
  const findPostHook = function (docs) {
    const startTime = this._startTime || Date.now();
    const duration = Date.now() - startTime;
    const collectionName = this.model?.collection?.name || schema.options.collection || 'unknown';

    trackDatabaseQuery(this.op || 'find', collectionName, duration, true, {
      query: this.getQuery ? this.getQuery() : {},
      resultCount: Array.isArray(docs) ? docs.length : docs ? 1 : 0,
    });
  };
  findOperations.forEach((op) => {
    // @ts-ignore - Mongoose post hook typing
    schema.post(op, findPostHook);
  });

  // Track save operations
  schema.post(
    'save',
    /** @this {any} @param {any} doc */ function (doc) {
      const startTime = this._startTime || Date.now();
      const duration = Date.now() - startTime;
      const collectionName = this.collection?.name || schema.options.collection || 'unknown';

      trackDatabaseQuery('save', collectionName, duration, true, {
        documentId: doc?._id || this._id,
        isNew: this.isNew,
      });
    }
  );

  // Track update operations
  const updateOperations = ['updateOne', 'updateMany', 'findOneAndUpdate'];
  /** @this {any} @param {any} result */
  const updatePostHook = function (result) {
    const startTime = this._startTime || Date.now();
    const duration = Date.now() - startTime;
    const collectionName = this.model?.collection?.name || schema.options.collection || 'unknown';

    trackDatabaseQuery(this.op || 'update', collectionName, duration, true, {
      query: this.getQuery ? this.getQuery() : {},
      modifiedCount: result?.modifiedCount || 0,
      matchedCount: result?.matchedCount || 0,
    });
  };
  updateOperations.forEach((op) => {
    // @ts-ignore - Mongoose post hook typing
    schema.post(op, updatePostHook);
  });

  // Track delete operations
  const deleteOperations = ['deleteOne', 'deleteMany', 'findOneAndDelete'];
  /** @this {any} @param {any} result */
  const deletePostHook = function (result) {
    const startTime = this._startTime || Date.now();
    const duration = Date.now() - startTime;
    const collectionName = this.model?.collection?.name || schema.options.collection || 'unknown';

    trackDatabaseQuery(this.op || 'delete', collectionName, duration, true, {
      query: this.getQuery ? this.getQuery() : {},
      deletedCount: result?.deletedCount || 0,
    });
  };
  deleteOperations.forEach((op) => {
    // @ts-ignore - Mongoose post hook typing
    schema.post(op, deletePostHook);
  });

  // Track aggregate operations
  schema.post(
    'aggregate',
    /** @this {any} @param {any} result */ function (result) {
      const startTime = this._startTime || Date.now();
      const duration = Date.now() - startTime;
      const collectionName = this.model?.collection?.name || schema.options.collection || 'unknown';

      trackDatabaseQuery('aggregate', collectionName, duration, true, {
        pipeline: this.pipeline || [],
        resultCount: Array.isArray(result) ? result.length : 0,
      });
    }
  );
}

module.exports = performancePlugin;
