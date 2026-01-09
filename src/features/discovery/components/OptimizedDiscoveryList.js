import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import ErrorBoundary from '../Common/ErrorBoundary';

/**
 * Performance-optimized list component for discovery screens
 *
 * Features:
 * - Virtualized rendering for large datasets
 * - Intelligent preloading and caching
 * - Pull-to-refresh with customizable refresh logic
 * - Infinite scroll with debounced loading
 * - Memory-efficient recycling
 * - Loading states and error boundaries
 */
const OptimizedDiscoveryList = ({
  data = [],
  renderItem,
  keyExtractor,
  onEndReached,
  onRefresh,
  refreshing = false,
  loading = false,
  error = null,
  emptyComponent,
  headerComponent,
  footerComponent,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  numColumns = 1,
  horizontal = false,
  showsVerticalScrollIndicator = false,
  showsHorizontalScrollIndicator = false,
  contentContainerStyle,
  style,
  // Performance tuning
  initialNumToRender = 8,
  maxToRenderPerBatch = 5,
  windowSize = 10,
  updateCellsBatchingPeriod = 50,
  removeClippedSubviews = true,
  // Custom props
  endThreshold = 0.1,
  refreshEnabled = true,
  ...props
}) => {
  const listRef = useRef(null);
  const [isEndReached, setIsEndReached] = useState(false);

  // Memoized empty component
  const EmptyComponent = useMemo(() => {
    if (ListEmptyComponent) return ListEmptyComponent;
    if (emptyComponent) return emptyComponent;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No items to display</Text>
      </View>
    );
  }, [ListEmptyComponent, emptyComponent]);

  // Memoized key extractor with fallback
  const getKeyExtractor = useCallback((item, index) => {
    if (keyExtractor) return keyExtractor(item, index);
    return item.id || item._id || `item-${index}`;
  }, [keyExtractor]);

  // Memoized render item with error boundary
  const getRenderItem = useCallback(({ item, index }) => {
    try {
      const renderedItem = renderItem({ item, index });

      // Add accessibility wrapper if not already present
      if (renderedItem && !renderedItem.props.accessibilityLabel) {
        return React.cloneElement(renderedItem, {
          accessibilityLabel: `Item ${index + 1}`,
          accessibilityRole: 'button',
        });
      }

      return renderedItem;
    } catch (error) {
      console.error('Error rendering item:', error);
      return (
        <View
          style={styles.errorItem}
          accessibilityLabel="Error loading item"
          accessibilityRole="text"
        >
          <Text style={styles.errorText}>Failed to load item</Text>
        </View>
      );
    }
  }, [renderItem]);

  // Handle end reached with debouncing
  const handleEndReached = useCallback(() => {
    if (loading || isEndReached || !onEndReached) return;

    setIsEndReached(true);
    onEndReached();

    // Reset after a short delay to allow for more loading
    setTimeout(() => setIsEndReached(false), 1000);
  }, [loading, isEndReached, onEndReached]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (!onRefresh || loading) return;
    onRefresh();
  }, [onRefresh, loading]);

  // Memoized refresh control
  const refreshControl = useMemo(() => {
    if (!refreshEnabled) return null;

    return (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        tintColor={Colors.primary}
        colors={[Colors.primary]}
        progressBackgroundColor={Colors.background.white}
      />
    );
  }, [refreshEnabled, refreshing, handleRefresh]);

  // Loading footer
  const LoadingFooter = useMemo(() => {
    if (!loading) return footerComponent || ListFooterComponent || null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  }, [loading, footerComponent, ListFooterComponent]);

  // Error footer
  const ErrorFooter = useMemo(() => {
    if (!error) return null;

    return (
      <View style={styles.errorFooter}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }, [error]);

  // Combined footer component
  const FooterComponent = useMemo(() => {
    if (ErrorFooter) return ErrorFooter;
    return LoadingFooter;
  }, [ErrorFooter, LoadingFooter]);

  // Container style
  const containerStyle = useMemo(() => [
    styles.container,
    contentContainerStyle,
  ], [contentContainerStyle]);

  const listStyle = useMemo(() => [
    styles.list,
    style,
  ], [style]);

  return (
    <ErrorBoundary
      fallback={({ error, onRetry, onReset }) => (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load discovery list</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      maxRetries={2}
    >
      <FlatList
        ref={listRef}
        data={data}
        renderItem={getRenderItem}
        keyExtractor={getKeyExtractor}
        ListHeaderComponent={headerComponent || ListHeaderComponent}
        ListFooterComponent={FooterComponent}
        ListEmptyComponent={EmptyComponent}
        refreshControl={refreshControl}
        onEndReached={handleEndReached}
        onEndReachedThreshold={endThreshold}
        numColumns={numColumns}
        horizontal={horizontal}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
        contentContainerStyle={containerStyle}
        style={listStyle}
        // Performance optimizations
        initialNumToRender={initialNumToRender}
        maxToRenderPerBatch={maxToRenderPerBatch}
        windowSize={windowSize}
        updateCellsBatchingPeriod={updateCellsBatchingPeriod}
        removeClippedSubviews={removeClippedSubviews}
        // Disable expensive features when not needed
        // getItemLayout={numColumns === 1 && !horizontal ? undefined : undefined}
        // Additional props
        {...props}
      />
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  errorFooter: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    color: Colors.accent.red,
    textAlign: 'center',
  },
  errorItem: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.light,
    margin: 10,
    borderRadius: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background.white,
  },
  errorText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.background.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OptimizedDiscoveryList;