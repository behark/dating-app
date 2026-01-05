/**
 * Optimized List Component
 * High-performance virtualized list with infinite scroll
 */

import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Default configuration
const DEFAULT_CONFIG = {
  pageSize: 20,
  initialNumToRender: 10,
  maxToRenderPerBatch: 10,
  windowSize: 5,
  updateCellsBatchingPeriod: 50,
  removeClippedSubviews: Platform.OS === 'android',
  onEndReachedThreshold: 0.5,
};

/**
 * Optimized FlatList wrapper with built-in infinite scroll
 */
const OptimizedList = memo(
  ({
    data,
    renderItem,
    keyExtractor,
    onLoadMore,
    onRefresh,
    isLoading = false,
    isRefreshing = false,
    hasMore = true,
    ListEmptyComponent,
    ListHeaderComponent,
    ListFooterComponent,
    ItemSeparatorComponent,
    estimatedItemSize = 100,
    numColumns = 1,
    horizontal = false,
    config = {},
    style,
    contentContainerStyle,
    ...restProps
  }) => {
    const flatListRef = useRef(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Merge config with defaults
    const listConfig = useMemo(
      () => ({
        ...DEFAULT_CONFIG,
        ...config,
      }),
      [config]
    );

    // Optimized key extractor
    const optimizedKeyExtractor = useCallback(
      (item, index) => {
        if (keyExtractor) {
          return keyExtractor(item, index);
        }
        return item._id || item.id || `item-${index}`;
      },
      [keyExtractor]
    );

    // Get item layout for fixed-size items (massive performance boost)
    const getItemLayout = useCallback(
      (data, index) => ({
        length: estimatedItemSize,
        offset: estimatedItemSize * index,
        index,
      }),
      [estimatedItemSize]
    );

    // Handle end reached with debounce
    const handleEndReached = useCallback(async () => {
      if (isLoadingMore || !hasMore || !onLoadMore) {
        return;
      }

      setIsLoadingMore(true);
      try {
        await onLoadMore();
      } finally {
        setIsLoadingMore(false);
      }
    }, [isLoadingMore, hasMore, onLoadMore]);

    // Handle refresh
    const handleRefresh = useCallback(async () => {
      if (onRefresh) {
        await onRefresh();
      }
    }, [onRefresh]);

    // Loading footer component
    const LoadingFooter = useMemo(() => {
      if (!isLoadingMore && !isLoading) {
        return null;
      }

      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading more...</Text>
        </View>
      );
    }, [isLoadingMore, isLoading]);

    // End of list indicator
    const EndOfList = useMemo(() => {
      if (hasMore || data.length === 0) {
        return null;
      }

      return (
        <View style={styles.endOfList}>
          <Text style={styles.endOfListText}>You&apos;ve reached the end</Text>
        </View>
      );
    }, [hasMore, data.length]);

    // Combined footer
    const Footer = useCallback(() => {
      if (ListFooterComponent) {
        return (
          <>
            {LoadingFooter}
            {EndOfList}
            {ListFooterComponent}
          </>
        );
      }
      return (
        <>
          {LoadingFooter}
          {EndOfList}
        </>
      );
    }, [ListFooterComponent, LoadingFooter, EndOfList]);

    // Empty component
    const EmptyComponent = useMemo(() => {
      if (isLoading) {
        return (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        );
      }

      if (ListEmptyComponent) {
        return ListEmptyComponent;
      }

      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items found</Text>
        </View>
      );
    }, [isLoading, ListEmptyComponent]);

    // Refresh control
    const refreshControl = useMemo(() => {
      if (!onRefresh) {
        return undefined;
      }

      return (
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={Colors.gradient.primary}
          tintColor={Colors.primary}
        />
      );
    }, [onRefresh, isRefreshing, handleRefresh]);

    return (
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={optimizedKeyExtractor}
        getItemLayout={estimatedItemSize ? getItemLayout : undefined}
        onEndReached={handleEndReached}
        onEndReachedThreshold={listConfig.onEndReachedThreshold}
        refreshControl={refreshControl}
        ListEmptyComponent={EmptyComponent}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={Footer}
        ItemSeparatorComponent={ItemSeparatorComponent}
        numColumns={numColumns}
        horizontal={horizontal}
        // Performance optimizations
        initialNumToRender={listConfig.initialNumToRender}
        maxToRenderPerBatch={listConfig.maxToRenderPerBatch}
        windowSize={listConfig.windowSize}
        updateCellsBatchingPeriod={listConfig.updateCellsBatchingPeriod}
        removeClippedSubviews={listConfig.removeClippedSubviews}
        // Memory optimization
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        // Disable scroll indicators for cleaner look
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        // Style
        style={[styles.list, style]}
        contentContainerStyle={[
          styles.contentContainer,
          data.length === 0 && styles.emptyContentContainer,
          contentContainerStyle,
        ]}
        {...restProps}
      />
    );
  }
);

/**
 * Memoized list item wrapper for performance
 */
export const MemoizedListItem = memo(
  ({ children, style }) => <View style={style}>{children}</View>,
  (prevProps, nextProps) => {
    // Custom comparison - only re-render if children changed
    return prevProps.children === nextProps.children;
  }
);
MemoizedListItem.displayName = 'MemoizedListItem';

/**
 * Hook for infinite scroll pagination
 */
export const useInfiniteScroll = ({ fetchFn, pageSize = 20, enabled = true }) => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  // Initial load
  const loadInitial = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn({ page: 1, pageSize });
      setData(result.items || result.data || []);
      setHasMore(result.hasMore ?? result.items?.length === pageSize);
      setPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, fetchFn, pageSize]);

  // Load more
  const loadMore = useCallback(async () => {
    if (!enabled || !hasMore || isLoading) return;

    setIsLoading(true);

    try {
      const nextPage = page + 1;
      const result = await fetchFn({ page: nextPage, pageSize });
      const newItems = result.items || result.data || [];

      setData((prev) => [...prev, ...newItems]);
      setHasMore(result.hasMore ?? newItems.length === pageSize);
      setPage(nextPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, hasMore, isLoading, page, fetchFn, pageSize]);

  // Refresh
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const result = await fetchFn({ page: 1, pageSize });
      setData(result.items || result.data || []);
      setHasMore(result.hasMore ?? result.items?.length === pageSize);
      setPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchFn, pageSize]);

  // Prepend item (for real-time updates)
  const prependItem = useCallback((item) => {
    setData((prev) => [item, ...prev]);
  }, []);

  // Remove item
  const removeItem = useCallback((id) => {
    setData((prev) => prev.filter((item) => (item._id || item.id) !== id));
  }, []);

  // Update item
  const updateItem = useCallback((id, updates) => {
    setData((prev) =>
      prev.map((item) => ((item._id || item.id) === id ? { ...item, ...updates } : item))
    );
  }, []);

  return {
    data,
    isLoading,
    isRefreshing,
    hasMore,
    error,
    loadInitial,
    loadMore,
    refresh,
    prependItem,
    removeItem,
    updateItem,
  };
};

/**
 * Optimized image list with lazy loading
 */
export const OptimizedImageList = memo(
  ({ images, onImagePress, numColumns = 3, spacing = 2, ...restProps }) => {
    const imageSize = useMemo(
      () => (SCREEN_WIDTH - spacing * (numColumns + 1)) / numColumns,
      [numColumns, spacing]
    );

    const renderImage = useCallback(
      ({ item, index }) => (
        <MemoizedListItem
          style={[
            styles.imageItem,
            {
              width: imageSize,
              height: imageSize,
              marginLeft: spacing,
              marginTop: spacing,
            },
          ]}
        >
          <OptimizedImage
            source={{ uri: item.url || item }}
            style={styles.image}
            onPress={() => onImagePress?.(item, index)}
          />
        </MemoizedListItem>
      ),
      [imageSize, spacing, onImagePress]
    );

    return (
      <OptimizedList
        data={images}
        renderItem={renderImage}
        numColumns={numColumns}
        estimatedItemSize={imageSize}
        {...restProps}
      />
    );
  }
);
OptimizedImageList.displayName = 'OptimizedImageList';

/**
 * Optimized Image component with progressive loading
 */
const OptimizedImage = memo(({ source, style, onPress }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <View style={[styles.imageContainer, style]}>
      {!loaded && (
        <View style={styles.imagePlaceholder}>
          <ActivityIndicator size="small" color={Colors.text.light} />
        </View>
      )}
      <Image
        source={source}
        style={[styles.image, !loaded && styles.imageHidden]}
        onLoad={() => setLoaded(true)}
        resizeMode="cover"
      />
    </View>
  );
});
OptimizedImage.displayName = 'OptimizedImage';

// Image is imported at the top with other react-native imports

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  emptyContentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: Colors.text.secondary,
    fontSize: 14,
  },
  endOfList: {
    alignItems: 'center',
    padding: 16,
  },
  endOfListText: {
    color: Colors.text.tertiary,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    color: Colors.text.secondary,
    fontSize: 16,
  },
  imageItem: {
    backgroundColor: Colors.background.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.light,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageHidden: {
    opacity: 0,
  },
});

OptimizedList.displayName = 'OptimizedList';

export default OptimizedList;
