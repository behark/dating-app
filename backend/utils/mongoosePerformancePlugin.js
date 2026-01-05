/**
 * Mongoose Performance Plugin
 * Tracks database query performance automatically
 */

const { trackDatabaseQuery } = require('../middleware/performanceMonitoring');

/**
 * Mongoose plugin to track query performance
 */
function performancePlugin(schema) {
  // Store start time before query execution
  schema.pre(['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 'save', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'aggregate'], function () {
    this._startTime = Date.now();
  });

  // Track find operations
  schema.post(['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete'], function (docs) {
    const startTime = this._startTime || Date.now();
    const duration = Date.now() - startTime;
    const collectionName = this.model?.collection?.name || schema.options.collection || 'unknown';

    trackDatabaseQuery(
      this.op || 'find',
      collectionName,
      duration,
      true,
      {
        query: this.getQuery ? this.getQuery() : {},
        resultCount: Array.isArray(docs) ? docs.length : docs ? 1 : 0,
      }
    );
  });

  // Track save operations
  schema.post('save', function (doc) {
    const startTime = this._startTime || Date.now();
    const duration = Date.now() - startTime;
    const collectionName = this.collection?.name || schema.options.collection || 'unknown';

    trackDatabaseQuery(
      'save',
      collectionName,
      duration,
      true,
      {
        documentId: doc?._id || this._id,
        isNew: this.isNew,
      }
    );
  });

  // Track update operations
  schema.post(['updateOne', 'updateMany', 'findOneAndUpdate'], function (result) {
    const startTime = this._startTime || Date.now();
    const duration = Date.now() - startTime;
    const collectionName = this.model?.collection?.name || schema.options.collection || 'unknown';

    trackDatabaseQuery(
      this.op || 'update',
      collectionName,
      duration,
      true,
      {
        query: this.getQuery ? this.getQuery() : {},
        modifiedCount: result?.modifiedCount || 0,
        matchedCount: result?.matchedCount || 0,
      }
    );
  });

  // Track delete operations
  schema.post(['deleteOne', 'deleteMany', 'findOneAndDelete'], function (result) {
    const startTime = this._startTime || Date.now();
    const duration = Date.now() - startTime;
    const collectionName = this.model?.collection?.name || schema.options.collection || 'unknown';

    trackDatabaseQuery(
      this.op || 'delete',
      collectionName,
      duration,
      true,
      {
        query: this.getQuery ? this.getQuery() : {},
        deletedCount: result?.deletedCount || 0,
      }
    );
  });

  // Track aggregate operations
  schema.post('aggregate', function (result) {
    const startTime = this._startTime || Date.now();
    const duration = Date.now() - startTime;
    const collectionName = this.model?.collection?.name || schema.options.collection || 'unknown';

    trackDatabaseQuery(
      'aggregate',
      collectionName,
      duration,
      true,
      {
        pipeline: this.pipeline || [],
        resultCount: Array.isArray(result) ? result.length : 0,
      }
    );
  });
}

module.exports = performancePlugin;
