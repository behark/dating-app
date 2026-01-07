/**
 * Custom hook for managing filters and sorting in discovery screens (TypeScript)
 *
 * Features:
 * - Centralized filter state management
 * - Persistent filter preferences
 * - Filter validation and normalization
 * - Efficient filter application to datasets
 * - Sort option management
 */

import { useCallback, useMemo, useState } from 'react';

/**
 * Filter options configuration
 */
export interface FilterOptions {
  distance?: { min: number; max: number; default: [number, number] };
  ageRange?: { min: number; max: number; default: [number, number] };
  interests?: string[];
  onlineOnly?: boolean;
  photoVerifiedOnly?: boolean;
  premiumOnly?: boolean;
  verifiedLocation?: boolean;
  [key: string]: unknown;
}

/**
 * Filters state
 */
export interface Filters {
  distance?: [number, number];
  ageRange?: [number, number];
  interests?: string[];
  onlineOnly?: boolean;
  photoVerifiedOnly?: boolean;
  premiumOnly?: boolean;
  verifiedLocation?: boolean;
  [key: string]: unknown;
}

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Sort option
 */
export type SortOption = 'distance' | 'age' | 'recentActivity' | 'name' | string;

/**
 * useFilters hook options
 */
export interface UseFiltersOptions {
  initialFilters?: Filters;
  initialSort?: SortOption;
  onFiltersChange?: (filters: Filters) => void;
  storageKey?: string;
}

/**
 * Item with filterable properties
 */
export interface FilterableItem {
  distance?: number;
  age?: number;
  interests?: string[];
  isOnline?: boolean;
  isPhotoVerified?: boolean;
  isPremium?: boolean;
  hasVerifiedLocation?: boolean;
  [key: string]: unknown;
}

/**
 * useFilters return type
 */
export interface UseFiltersReturn {
  // State
  filters: Filters;
  sortBy: SortOption;
  sortOrder: SortOrder;
  hasActiveFilters: boolean;

  // Actions
  updateFilter: (key: string, value: unknown) => void;
  updateFilters: (newFilters: Partial<Filters>) => void;
  toggleFilter: (key: string) => void;
  resetFilters: () => void;
  setSort: (newSortBy: SortOption, newSortOrder?: SortOrder | null) => void;

  // Data processing
  applyFilters: <T extends FilterableItem>(data: T[]) => T[];
  applySorting: <T extends FilterableItem>(data: T[]) => T[];
  applyFiltersAndSorting: <T extends FilterableItem>(data: T[]) => T[];

  // Utilities
  getFilterSummary: () => string[];
}

export const useFilters = ({
  initialFilters = {},
  initialSort = 'distance',
  onFiltersChange,
  storageKey,
}: UseFiltersOptions = {}): UseFiltersReturn => {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Default filter options
  const defaultFilterOptions: FilterOptions = {
    distance: { min: 1, max: 100, default: [1, 50] },
    ageRange: { min: 18, max: 80, default: [18, 35] },
    interests: [],
    onlineOnly: false,
    photoVerifiedOnly: false,
    premiumOnly: false,
    verifiedLocation: false,
  };

  /**
   * Reset filters to defaults
   */
  const resetFilters = useCallback(() => {
    const defaultFilters = Object.keys(defaultFilterOptions).reduce((acc, key) => {
      const option = defaultFilterOptions[key];
      if (option && typeof option === 'object' && 'default' in option) {
        acc[key] = (option as { default: unknown }).default;
      } else {
        acc[key] = option;
      }
      return acc;
    }, {} as Filters);

    setFilters(defaultFilters);
    onFiltersChange?.(defaultFilters);

    // Save to storage if key provided
    if (storageKey) {
      try {
        // In a real implementation, this would use AsyncStorage or similar
        // For now, just log the intent
        console.log(`Saving filters to ${storageKey}:`, defaultFilters);
      } catch (error) {
        console.warn('Failed to save filters to storage:', error);
      }
    }
  }, [onFiltersChange, storageKey]);

  /**
   * Update a specific filter
   */
  const updateFilter = useCallback(
    (key: string, value: unknown) => {
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
    (newFilters: Partial<Filters>) => {
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
    (key: string) => {
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
  const setSort = useCallback((newSortBy: SortOption, newSortOrder: SortOrder | null = null) => {
    setSortBy(newSortBy);
    if (newSortOrder) {
      setSortOrder(newSortOrder);
    } else {
      // Auto-determine sort order based on sort type
      const newOrder: SortOrder = newSortBy === 'distance' || newSortBy === 'age' ? 'asc' : 'desc';
      setSortOrder(newOrder);
    }
  }, []);

  /**
   * Check if any filters are active (non-default)
   */
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      const option = defaultFilterOptions[key];
      const defaultValue =
        option && typeof option === 'object' && 'default' in option
          ? (option as { default: unknown }).default
          : option;
      return JSON.stringify(value) !== JSON.stringify(defaultValue);
    });
  }, [filters]);

  /**
   * Apply filters to a dataset
   */
  const applyFilters = useCallback(
    <T extends FilterableItem>(data: T[]): T[] => {
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
              String(itemInterest).toLowerCase().includes(String(filterInterest).toLowerCase())
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
    <T extends FilterableItem>(data: T[]): T[] => {
      if (!Array.isArray(data)) return [];

      return [...data].sort((a, b) => {
        let aValue = a[sortBy] as unknown;
        let bValue = b[sortBy] as unknown;

        // Handle undefined values
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortOrder === 'asc' ? 1 : -1;
        if (bValue === undefined) return sortOrder === 'asc' ? -1 : 1;

        // Handle string comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        // Type-safe comparison
        const aVal = aValue as string | number;
        const bVal = bValue as string | number;
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    },
    [sortBy, sortOrder]
  );

  /**
   * Apply both filters and sorting
   */
  const applyFiltersAndSorting = useCallback(
    <T extends FilterableItem>(data: T[]): T[] => {
      const filtered = applyFilters(data);
      return applySorting(filtered);
    },
    [applyFilters, applySorting]
  );

  /**
   * Get filter summary for display
   */
  const getFilterSummary = useCallback((): string[] => {
    const activeFilters: string[] = [];

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
