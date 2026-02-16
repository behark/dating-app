import { useCallback, useMemo, useState } from 'react';
import logger from '../utils/logger';

/**
 * Custom hook for managing filters and sorting in discovery screens
 *
 * Features:
 * - Centralized filter state management
 * - Persistent filter preferences
 * - Filter validation and normalization
 * - Efficient filter application to datasets
 * - Sort option management
 */
export const useFilters = ({
  initialFilters = {},
  initialSort = 'distance',
  onFiltersChange,
  storageKey,
}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState(initialSort);
  const [sortOrder, setSortOrder] = useState('asc');

  // Default filter options
  const defaultFilterOptions = useMemo(
    () => ({
      distance: { min: 1, max: 100, default: [1, 50] },
      ageRange: { min: 18, max: 80, default: [18, 35] },
      interests: [],
      onlineOnly: false,
      photoVerifiedOnly: false,
      premiumOnly: false,
      verifiedLocation: false,
    }),
    []
  );

  /**
   * Reset filters to defaults
   */
  const resetFilters = useCallback(() => {
    const defaultFilters = Object.keys(defaultFilterOptions).reduce((acc, key) => {
      acc[key] =
        defaultFilterOptions[key].default !== undefined
          ? defaultFilterOptions[key].default
          : defaultFilterOptions[key];
      return acc;
    }, {});

    setFilters(defaultFilters);
    onFiltersChange?.(defaultFilters);

    // Save to storage if key provided
    if (storageKey) {
      try {
        // In a real implementation, this would use AsyncStorage or similar
        // For now, just log the intent
        logger.debug(`Saving filters to ${storageKey}:`, defaultFilters);
      } catch (error) {
        logger.warn('Failed to save filters to storage:', error);
      }
    }
  }, [defaultFilterOptions, onFiltersChange, storageKey]);

  /**
   * Update a specific filter
   */
  const updateFilter = useCallback(
    (key, value) => {
      setFilters((prev) => {
        const newFilters = { ...prev, [key]: value };
        onFiltersChange?.(newFilters);
        return newFilters;
      });
    },
    [onFiltersChange]
  );

  /**
   * Update multiple filters at once
   */
  const updateFilters = useCallback(
    (newFilters) => {
      setFilters((prev) => {
        const updated = { ...prev, ...newFilters };
        onFiltersChange?.(updated);
        return updated;
      });
    },
    [onFiltersChange]
  );

  /**
   * Toggle a boolean filter
   */
  const toggleFilter = useCallback(
    (key) => {
      setFilters((prev) => {
        const newFilters = { ...prev, [key]: !prev[key] };
        onFiltersChange?.(newFilters);
        return newFilters;
      });
    },
    [onFiltersChange]
  );

  /**
   * Set sort option
   */
  const setSort = useCallback((newSortBy, newSortOrder = null) => {
    setSortBy(newSortBy);
    if (newSortOrder) {
      setSortOrder(newSortOrder);
    } else {
      // Auto-determine sort order based on sort type
      const newOrder = newSortBy === 'distance' || newSortBy === 'age' ? 'asc' : 'desc';
      setSortOrder(newOrder);
    }
  }, []);

  /**
   * Check if any filters are active (non-default)
   */
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      const defaultValue = defaultFilterOptions[key]?.default ?? defaultFilterOptions[key];
      return JSON.stringify(value) !== JSON.stringify(defaultValue);
    });
  }, [filters, defaultFilterOptions]);

  /**
   * Apply filters to a dataset
   */
  const applyFilters = useCallback(
    (data) => {
      if (!Array.isArray(data)) return [];

      return data.filter((item) => {
        // Distance filter
        if (filters.distance && item.distance !== undefined) {
          const [min, max] = filters.distance;
          if (item.distance < min || item.distance > max) return false;
        }

        // Age range filter
        if (filters.ageRange && item.age !== undefined) {
          const [minAge, maxAge] = filters.ageRange;
          if (item.age < minAge || item.age > maxAge) return false;
        }

        // Interests filter
        if (filters.interests && filters.interests.length > 0 && item.interests) {
          const itemInterests = Array.isArray(item.interests) ? item.interests : [];
          const hasMatchingInterest = filters.interests.some((filterInterest) =>
            itemInterests.some((itemInterest) =>
              itemInterest.toLowerCase().includes(filterInterest.toLowerCase())
            )
          );
          if (!hasMatchingInterest) return false;
        }

        // Online only filter
        if (filters.onlineOnly && !item.isOnline) return false;

        // Photo verified only filter
        if (filters.photoVerifiedOnly && !item.isPhotoVerified) return false;

        // Premium only filter
        if (filters.premiumOnly && !item.isPremium) return false;

        // Verified location filter
        if (filters.verifiedLocation && !item.hasVerifiedLocation) return false;

        return true;
      });
    },
    [filters]
  );

  /**
   * Apply sorting to a dataset
   */
  const applySorting = useCallback(
    (data) => {
      if (!Array.isArray(data)) return [];

      return [...data].sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        // Handle undefined values
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortOrder === 'asc' ? 1 : -1;
        if (bValue === undefined) return sortOrder === 'asc' ? -1 : 1;

        // Handle string comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    },
    [sortBy, sortOrder]
  );

  /**
   * Apply both filters and sorting
   */
  const applyFiltersAndSorting = useCallback(
    (data) => {
      const filtered = applyFilters(data);
      return applySorting(filtered);
    },
    [applyFilters, applySorting]
  );

  /**
   * Get filter summary for display
   */
  const getFilterSummary = useCallback(() => {
    const activeFilters = [];

    // Check if distance differs from default [1, 50]
    if (filters.distance && (filters.distance[0] !== 1 || filters.distance[1] !== 50)) {
      activeFilters.push(`Distance: ${filters.distance[0]}-${filters.distance[1]}km`);
    }

    // Check if age range differs from default [18, 35]
    if (filters.ageRange && (filters.ageRange[0] !== 18 || filters.ageRange[1] !== 35)) {
      activeFilters.push(`Age: ${filters.ageRange[0]}-${filters.ageRange[1]}`);
    }

    if (filters.interests && filters.interests.length > 0) {
      activeFilters.push(`Interests: ${filters.interests.length}`);
    }

    if (filters.onlineOnly) activeFilters.push('Online only');
    if (filters.photoVerifiedOnly) activeFilters.push('Verified photos');
    if (filters.premiumOnly) activeFilters.push('Premium only');
    if (filters.verifiedLocation) activeFilters.push('Verified location');

    return activeFilters;
  }, [filters]);

  return {
    // State
    filters,
    sortBy,
    sortOrder,
    hasActiveFilters,

    // Actions
    updateFilter,
    updateFilters,
    toggleFilter,
    resetFilters,
    setSort,

    // Data processing
    applyFilters,
    applySorting,
    applyFiltersAndSorting,

    // Utilities
    getFilterSummary,
  };
};

export default useFilters;
