/**
 * Optimistic UI Update Utilities
 * Allows UI to update immediately before API response
 */

/**
 * Create an optimistic update handler
 * @param {Function} updateFn - Function to update local state optimistically
 * @param {Function} rollbackFn - Function to rollback on error (optional)
 * @returns {Function} Handler function
 */
export const createOptimisticUpdate = (updateFn, rollbackFn = null) => {
  return async (apiCall, ...args) => {
    // Store previous state for rollback
    let previousState = null;
    
    try {
      // Apply optimistic update
      if (rollbackFn) {
        previousState = updateFn();
      } else {
        updateFn();
      }

      // Make API call
      const result = await apiCall(...args);

      // Update with actual response (in case it differs)
      if (result && result.data) {
        updateFn(result.data);
      }

      return result;
    } catch (error) {
      // Rollback on error
      if (rollbackFn && previousState !== null) {
        rollbackFn(previousState);
      } else if (rollbackFn) {
        rollbackFn();
      }

      throw error;
    }
  };
};

/**
 * Optimistic list update (add item)
 * @param {Array} list - Current list
 * @param {Function} setList - State setter
 * @param {object} newItem - Item to add optimistically
 * @returns {Function} Handler function
 */
export const optimisticAdd = (list, setList, newItem) => {
  return createOptimisticUpdate(
    () => {
      setList([...list, { ...newItem, _optimistic: true }]);
    },
    () => {
      setList(list);
    }
  );
};

/**
 * Optimistic list update (update item)
 * @param {Array} list - Current list
 * @param {Function} setList - State setter
 * @param {string|number} itemId - ID of item to update
 * @param {object} updates - Updates to apply
 * @returns {Function} Handler function
 */
export const optimisticUpdate = (list, setList, itemId, updates) => {
  const itemIndex = list.findIndex((item) => item.id === itemId || item._id === itemId);
  const previousItem = itemIndex >= 0 ? list[itemIndex] : null;
  const previousList = [...list];

  return createOptimisticUpdate(
    () => {
      if (itemIndex >= 0) {
        const updatedList = [...list];
        updatedList[itemIndex] = { ...updatedList[itemIndex], ...updates, _optimistic: true };
        setList(updatedList);
      }
    },
    () => {
      setList(previousList);
    }
  );
};

/**
 * Optimistic list update (remove item)
 * @param {Array} list - Current list
 * @param {Function} setList - State setter
 * @param {string|number} itemId - ID of item to remove
 * @returns {Function} Handler function
 */
export const optimisticRemove = (list, setList, itemId) => {
  const itemIndex = list.findIndex((item) => item.id === itemId || item._id === itemId);
  const removedItem = itemIndex >= 0 ? list[itemIndex] : null;
  const previousList = [...list];

  return createOptimisticUpdate(
    () => {
      if (itemIndex >= 0) {
        setList(list.filter((item) => (item.id || item._id) !== itemId));
      }
    },
    () => {
      setList(previousList);
    }
  );
};

export default {
  createOptimisticUpdate,
  optimisticAdd,
  optimisticUpdate,
  optimisticRemove,
};
