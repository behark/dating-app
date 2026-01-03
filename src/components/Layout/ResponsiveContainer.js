import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { BREAKPOINTS, useResponsive } from '../../hooks/useResponsive';

/**
 * ResponsiveContainer - A layout component that provides consistent 
 * responsive behavior across iOS, Android, Web, and Tablet devices.
 * 
 * Platform Support:
 * - iOS 14+ (with iPad optimization)
 * - Android 8+ (with tablet optimization)
 * - Web (responsive with breakpoints)
 * 
 * Features:
 * - Automatic max-width constraints on larger screens
 * - Centered content on tablets and desktops
 * - Optional sidebar support for tablet layouts
 * - Safe area insets handling
 */
export const ResponsiveContainer = ({
  children,
  style,
  scrollable = false,
  maxWidth = BREAKPOINTS.lg, // Default max width for content
  centerContent = true,
  padded = true,
  safeArea = true,
  testID,
}) => {
  const { width, deviceType, isLandscape, isWeb, isIOS, isAndroid } = useResponsive();
  
  // Calculate responsive padding based on device and orientation
  const getResponsivePadding = () => {
    if (deviceType === 'mobile') {
      return { paddingHorizontal: 16 };
    }
    if (deviceType === 'tablet') {
      return { paddingHorizontal: isLandscape ? 48 : 32 };
    }
    // Desktop
    return { paddingHorizontal: 64 };
  };

  // Calculate max width for content containment
  const getMaxWidth = () => {
    if (width <= maxWidth) return '100%';
    return maxWidth;
  };

  const containerStyle = [
    styles.container,
    safeArea && styles.safeArea,
    centerContent && width > maxWidth && styles.centered,
    style,
  ];

  const contentStyle = [
    styles.content,
    padded && getResponsivePadding(),
    { maxWidth: getMaxWidth() },
    centerContent && width > maxWidth && styles.centeredContent,
  ];

  const ContentWrapper = scrollable ? ScrollView : View;
  const wrapperProps = scrollable ? {
    contentContainerStyle: contentStyle,
    showsVerticalScrollIndicator: false,
    bounces: isIOS,
    overScrollMode: isAndroid ? 'never' : undefined,
  } : {
    style: contentStyle,
  };

  return (
    <View style={containerStyle} testID={testID}>
      <ContentWrapper {...wrapperProps}>
        {children}
      </ContentWrapper>
    </View>
  );
};

/**
 * TabletSplitView - Two-panel layout for tablet devices
 * Shows master-detail or side-by-side views on larger screens
 */
export const TabletSplitView = ({
  leftPanel,
  rightPanel,
  leftWidth = 320, // Default sidebar width
  minRightWidth = 400,
  showLeftOnMobile = true,
  style,
  testID,
}) => {
  const { width, deviceType, isLandscape } = useResponsive();
  
  // Only show split view on tablet+ in landscape or desktop
  const showSplitView = 
    (deviceType === 'tablet' && isLandscape) || 
    deviceType === 'desktop';

  // On mobile or tablet portrait, show single panel
  if (!showSplitView) {
    return (
      <View style={[styles.container, style]} testID={testID}>
        {showLeftOnMobile ? leftPanel : rightPanel}
      </View>
    );
  }

  // Calculate responsive widths
  const actualLeftWidth = Math.min(leftWidth, width * 0.35);
  const rightWidth = width - actualLeftWidth;

  return (
    <View style={[styles.splitContainer, style]} testID={testID}>
      <View style={[styles.leftPanel, { width: actualLeftWidth }]}>
        {leftPanel}
      </View>
      <View style={[styles.rightPanel, { width: rightWidth }]}>
        {rightPanel}
      </View>
    </View>
  );
};

/**
 * ResponsiveGrid - Grid layout that adapts columns based on screen size
 */
export const ResponsiveGrid = ({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 16,
  style,
  testID,
}) => {
  const { width } = useResponsive();
  
  // Determine number of columns based on current width
  const getColumnCount = () => {
    if (width >= BREAKPOINTS.lg) return columns.lg || columns.md || 4;
    if (width >= BREAKPOINTS.md) return columns.md || columns.sm || 3;
    if (width >= BREAKPOINTS.sm) return columns.sm || 2;
    return columns.xs || 1;
  };

  const columnCount = getColumnCount();
  const itemWidth = (width - gap * (columnCount + 1)) / columnCount;

  return (
    <View style={[styles.grid, { gap }, style]} testID={testID}>
      {React.Children.map(children, (child, index) => (
        <View key={index} style={{ width: itemWidth }}>
          {child}
        </View>
      ))}
    </View>
  );
};

/**
 * PlatformInfo - Utility component to display platform info (dev only)
 */
export const PlatformInfo = ({ visible = __DEV__ }) => {
  const { width, height, deviceType, platform, isLandscape } = useResponsive();
  
  if (!visible) return null;
  
  return (
    <View style={styles.platformInfo}>
      <View style={styles.platformBadge}>
        <View style={styles.platformText}>
          {/* Display is handled by text children */}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeArea: {
    ...Platform.select({
      ios: {
        paddingTop: 44, // Safe area top
        paddingBottom: 34, // Safe area bottom (home indicator)
      },
      android: {
        paddingTop: 24, // Status bar
      },
      web: {
        // Web handles safe areas via CSS env()
      },
    }),
  },
  centered: {
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
  },
  centeredContent: {
    alignSelf: 'center',
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    borderRightWidth: 1,
    borderRightColor: '#e5e5e5',
    backgroundColor: '#f9f9f9',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
  },
  platformInfo: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 1000,
  },
  platformBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  platformText: {
    color: '#fff',
    fontSize: 10,
  },
});

export default ResponsiveContainer;
