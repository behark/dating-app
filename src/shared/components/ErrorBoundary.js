import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import PropTypes from 'prop-types';
import React from 'react';
import {
  Animated,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';
import { Colors } from '../../constants/colors';
import { AnalyticsService } from '../../services/AnalyticsService';
import logger from '../../utils/logger';

// Constants for repeated color values
const SEMI_TRANSPARENT_WHITE_02 = 'rgba(255,255,255,0.2)';
const SEMI_TRANSPARENT_WHITE_01 = 'rgba(255,255,255,0.1)';

/**
 * Error categories for better error handling and recovery
 */
export const ErrorCategories = {
  NETWORK: 'network',
  AUTH: 'authentication',
  PERMISSION: 'permission',
  DATA: 'data',
  RENDER: 'render',
  UNKNOWN: 'unknown',
};

/**
 * Categorize error based on error message and type
 */
export const categorizeError = (error) => {
  const message = error?.message?.toLowerCase() || '';
  const name = error?.name?.toLowerCase() || '';

  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('connection')
  ) {
    return ErrorCategories.NETWORK;
  }

  if (
    message.includes('auth') ||
    message.includes('token') ||
    message.includes('unauthorized') ||
    message.includes('permission denied')
  ) {
    return ErrorCategories.AUTH;
  }

  if (message.includes('permission') || message.includes('access denied')) {
    return ErrorCategories.PERMISSION;
  }

  if (
    message.includes('undefined') ||
    message.includes('null') ||
    name.includes('typeerror') ||
    name.includes('referenceerror')
  ) {
    return ErrorCategories.DATA;
  }

  return ErrorCategories.UNKNOWN;
};

/**
 * Get recovery actions based on error category
 */
export const getRecoveryActions = (category) => {
  switch (category) {
    case ErrorCategories.NETWORK:
      return [
        { id: 'retry', label: 'Try Again', icon: 'refresh' },
        { id: 'offline', label: 'Continue Offline', icon: 'cloud-offline' },
      ];
    case ErrorCategories.AUTH:
      return [
        { id: 'login', label: 'Sign In Again', icon: 'log-in' },
        { id: 'retry', label: 'Retry', icon: 'refresh' },
      ];
    case ErrorCategories.PERMISSION:
      return [
        { id: 'settings', label: 'Open Settings', icon: 'settings' },
        { id: 'retry', label: 'Try Again', icon: 'refresh' },
      ];
    default:
      return [
        { id: 'retry', label: 'Try Again', icon: 'refresh' },
        { id: 'home', label: 'Go Home', icon: 'home' },
      ];
  }
};

/**
 * Get user-friendly error message based on category
 */
export const getErrorMessage = (category) => {
  switch (category) {
    case ErrorCategories.NETWORK:
      return {
        title: 'Connection Problem',
        message:
          "We're having trouble connecting to the server. Please check your internet connection and try again.",
        icon: 'cloud-offline',
      };
    case ErrorCategories.AUTH:
      return {
        title: 'Session Expired',
        message: 'Your session has expired. Please sign in again to continue.',
        icon: 'lock-closed',
      };
    case ErrorCategories.PERMISSION:
      return {
        title: 'Permission Required',
        message: 'This feature requires additional permissions. Please update your settings.',
        icon: 'shield',
      };
    case ErrorCategories.DATA:
      return {
        title: 'Something Went Wrong',
        message:
          "We encountered an unexpected issue. Our team has been notified and we're working on a fix.",
        icon: 'bug',
      };
    default:
      return {
        title: 'Oops! Something Went Wrong',
        message: "We're sorry, but something unexpected happened. Please try again.",
        icon: 'alert-circle',
      };
  }
};

/**
 * Unified Error Boundary Component
 *
 * Combines features from all error boundary implementations:
 * - Error catching and user-friendly display
 * - Sentry logging for error tracking
 * - Analytics integration
 * - Error categorization
 * - Configurable retry behavior
 * - Recovery actions (retry, login, settings, offline, navigate)
 * - Development error details
 * - Multiple UI modes (simple, advanced with gradient)
 *
 * Features:
 * - Catches JavaScript errors in component tree
 * - Displays user-friendly error UI
 * - Provides retry functionality
 * - Logs errors to Sentry and Analytics
 * - Graceful fallback rendering
 * - Error categorization for better recovery
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCategory: ErrorCategories.UNKNOWN,
      retryCount: 0,
      isRetrying: false,
    };
    this.fadeAnim = new Animated.Value(0);
    this.slideAnim = new Animated.Value(50);
  }

  static getDerivedStateFromError(error) {
    const category = categorizeError(error);
    return {
      hasError: true,
      errorCategory: category,
    };
  }

  componentDidCatch(error, errorInfo) {
    const category = categorizeError(error);

    // Log to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
      logger.error('Error Boundary caught an error', error, {
        componentStack: errorInfo.componentStack,
        errorCategory: category,
      });
    }

    // Log to Sentry for error tracking
    try {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
            errorBoundary: true,
          },
          app: {
            version: Constants.expoConfig?.version || '1.0.0',
            platform: Constants.platform,
          },
        },
        tags: {
          component: 'ErrorBoundary',
          platform: Constants.platform,
          errorCategory: category,
        },
        level: 'error',
      });
    } catch (sentryError) {
      console.error('Failed to send error to Sentry:', sentryError);
    }

    // Log to Analytics (fire and forget - don't block error handling)
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    AnalyticsService.logError('error_boundary', errorMessage).catch((analyticsError) => {
      console.error('Failed to log error to Analytics:', analyticsError);
    });
    AnalyticsService.logEvent('error_boundary_caught', {
      error_category: category,
      retry_count: this.state.retryCount,
      has_component_stack: !!errorInfo.componentStack,
    }).catch((analyticsError) => {
      console.error('Failed to log error event to Analytics:', analyticsError);
    });

    this.setState({
      error: error,
      errorInfo: errorInfo,
      errorCategory: category,
    });

    // Animate error screen entry
    Animated.parallel([
      Animated.timing(this.fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(this.slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = async () => {
    const { maxRetries = 3, onRetry } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      // Max retries reached, show permanent error
      return;
    }

    this.setState({ isRetrying: true });

    // Log retry attempt (fire and forget)
    AnalyticsService.logEvent('error_recovery_attempt', {
      error_category: this.state.errorCategory,
      retry_count: retryCount + 1,
    }).catch((analyticsError) => {
      console.error('Failed to log retry to Analytics:', analyticsError);
    });

    // Small delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Call custom retry handler if provided
    if (onRetry) {
      await onRetry();
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1,
      isRetrying: false,
    });

    // Reset animations
    this.fadeAnim.setValue(0);
    this.slideAnim.setValue(50);
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    });

    // Reset animations
    this.fadeAnim.setValue(0);
    this.slideAnim.setValue(50);
  };

  handleAction = (actionId) => {
    const { onNavigate, onLogin, onSettings, onOfflineMode } = this.props;

    // Log recovery action (fire and forget)
    AnalyticsService.logEvent('error_recovery_action', {
      action: actionId,
      error_category: this.state.errorCategory,
    }).catch((analyticsError) => {
      console.error('Failed to log action to Analytics:', analyticsError);
    });

    switch (actionId) {
      case 'retry':
        this.handleRetry();
        break;
      case 'home':
        if (onNavigate) onNavigate('Home');
        this.handleRetry();
        break;
      case 'login':
        if (onLogin) onLogin();
        break;
      case 'settings':
        if (onSettings) onSettings();
        break;
      case 'offline':
        if (onOfflineMode) onOfflineMode();
        this.handleRetry();
        break;
      default:
        this.handleRetry();
    }
  };

  handleReportError = () => {
    const { error, errorCategory } = this.state;

    // Log error report (fire and forget)
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    AnalyticsService.logEvent('error_reported', {
      error_category: errorCategory,
      error_message: errorMessage.substring(0, 100),
    }).catch((analyticsError) => {
      console.error('Failed to log error report to Analytics:', analyticsError);
    });

    // In a real app, this could send error details to your support team
    alert('Error report sent. Thank you for helping us improve!');
  };

  render() {
    const { hasError, errorCategory, retryCount, isRetrying, error, errorInfo } = this.state;
    const {
      children,
      fallback,
      maxRetries = 3,
      showRetry = true,
      showDetails = __DEV__,
      title,
      message,
      icon,
      useAdvancedUI = true,
      enableCategorization = true,
      enableRecoveryActions = true,
      style,
    } = this.props;

    if (hasError) {
      // Custom fallback if provided
      if (fallback) {
        return fallback({
          error,
          errorInfo,
          onRetry: this.handleRetry,
          onReset: this.handleReset,
          retryCount,
          errorCategory: enableCategorization ? errorCategory : undefined,
        });
      }

      // Determine error details
      const errorDetails = enableCategorization
        ? getErrorMessage(errorCategory)
        : {
            title: title || 'Oops! Something went wrong',
            message: message || "We're sorry, but something unexpected happened. Please try again.",
            icon: icon || 'alert-circle',
          };

      // Override with props if provided
      if (title) errorDetails.title = title;
      if (message) errorDetails.message = message;
      if (icon) errorDetails.icon = icon;

      const recoveryActions = enableCategorization && enableRecoveryActions
        ? getRecoveryActions(errorCategory)
        : [{ id: 'retry', label: 'Try Again', icon: 'refresh' }];

      const canRetry = showRetry && retryCount < maxRetries;

      // Simple UI mode (for basic use cases)
      if (!useAdvancedUI) {
        return (
          <SafeAreaView style={[styles.container, style]}>
            <ScrollView contentContainerStyle={styles.simpleContent}>
              <View style={styles.simpleErrorContent}>
                <Ionicons
                  name={errorDetails.icon}
                  size={48}
                  color={Colors.accent.red}
                  style={styles.simpleErrorIcon}
                />
                <Text style={styles.simpleErrorTitle}>{errorDetails.title}</Text>
                <Text style={styles.simpleErrorMessage}>{errorDetails.message}</Text>

                {showDetails && error && (
                  <View style={styles.simpleErrorDetails}>
                    <Text style={styles.simpleErrorDetailsText}>{error.toString()}</Text>
                  </View>
                )}

                <View style={styles.simpleButtonContainer}>
                  {canRetry ? (
                    <TouchableOpacity
                      style={[styles.simpleButton, styles.simpleRetryButton]}
                      onPress={this.handleRetry}
                      activeOpacity={0.7}
                      disabled={isRetrying}
                    >
                      <Ionicons
                        name="refresh"
                        size={16}
                        color={Colors.primary}
                        style={isRetrying && styles.spinningIcon}
                      />
                      <Text style={styles.simpleRetryButtonText}>
                        {isRetrying ? 'Retrying...' : `Try Again (${maxRetries - retryCount} left)`}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.simpleButton, styles.simpleResetButton]}
                      onPress={this.handleReset}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="home" size={16} color={Colors.text.secondary} />
                      <Text style={styles.simpleResetButtonText}>Reset</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        );
      }

      // Advanced UI mode (with gradient and animations)
      return (
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={[styles.container, style]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.errorContainer,
                {
                  opacity: this.fadeAnim,
                  transform: [{ translateY: this.slideAnim }],
                },
              ]}
            >
              {/* Error Icon */}
              <View style={styles.errorIcon}>
                <Ionicons name={errorDetails.icon} size={80} color={Colors.text.white} />
              </View>

              {/* Error Title & Message */}
              <Text style={styles.errorTitle}>{errorDetails.title}</Text>
              <Text style={styles.errorMessage}>{errorDetails.message}</Text>

              {/* Retry Counter */}
              {retryCount > 0 && canRetry && (
                <View style={styles.retryCounter}>
                  <Text style={styles.retryCountText}>
                    Retry attempt {retryCount} of {maxRetries}
                  </Text>
                </View>
              )}

              {/* Development Error Details */}
              {showDetails && error && (
                <View style={styles.devErrorContainer}>
                  <Text style={styles.devErrorTitle}>Development Error Details:</Text>
                  <Text style={styles.devErrorText}>{error.toString()}</Text>
                  {errorInfo && (
                    <ScrollView style={styles.stackScroll} nestedScrollEnabled>
                      <Text style={styles.devErrorStack}>{errorInfo.componentStack}</Text>
                    </ScrollView>
                  )}
                </View>
              )}

              {/* Recovery Actions */}
              {enableRecoveryActions && (
                <View style={styles.buttonContainer}>
                  {canRetry ? (
                    recoveryActions.map((action) => (
                      <TouchableOpacity
                        key={action.id}
                        style={[styles.actionButton, action.id === 'retry' && styles.primaryButton]}
                        onPress={() => this.handleAction(action.id)}
                        activeOpacity={0.8}
                        disabled={isRetrying}
                      >
                        {action.id === 'retry' ? (
                          <LinearGradient
                            colors={[Colors.background.white, Colors.background.light]}
                            style={styles.primaryButtonGradient}
                          >
                            <Ionicons
                              name={isRetrying ? 'refresh' : action.icon}
                              size={20}
                              color={Colors.primary}
                              style={[styles.buttonIcon, isRetrying && styles.spinningIcon]}
                            />
                            <Text style={styles.primaryButtonText}>
                              {isRetrying ? 'Retrying...' : action.label}
                            </Text>
                          </LinearGradient>
                        ) : (
                          <View style={styles.secondaryButtonContent}>
                            <Ionicons
                              name={action.icon}
                              size={18}
                              color={Colors.text.white}
                              style={styles.buttonIcon}
                            />
                            <Text style={styles.secondaryButtonText}>{action.label}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.maxRetriesReached}>
                      <Ionicons name="warning" size={24} color={Colors.warning || '#ffc107'} />
                      <Text style={styles.maxRetriesText}>
                        Maximum retries reached. Please restart the app or contact support.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Simple retry button if recovery actions disabled */}
              {!enableRecoveryActions && (
                <View style={styles.buttonContainer}>
                  {canRetry ? (
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={this.handleRetry}
                      activeOpacity={0.8}
                      disabled={isRetrying}
                    >
                      <Text style={styles.primaryButtonText}>
                        {isRetrying ? 'Retrying...' : 'Try Again'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={this.handleReset}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.secondaryButtonText}>Start Over</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Report Error Button */}
              <TouchableOpacity
                style={styles.reportButton}
                onPress={this.handleReportError}
                activeOpacity={0.8}
              >
                <Text style={styles.reportButtonText}>Report Issue</Text>
              </TouchableOpacity>

              {/* Help Text */}
              <Text style={styles.helpText}>
                If this problem persists, please contact support or try restarting the app.
              </Text>

              {/* Version */}
              <Text style={styles.version}>
                Version: {Constants.expoConfig?.version || '1.0.0'}
              </Text>
            </Animated.View>
          </ScrollView>
        </LinearGradient>
      );
    }

    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.func,
  maxRetries: PropTypes.number,
  showRetry: PropTypes.bool,
  showDetails: PropTypes.bool,
  title: PropTypes.string,
  message: PropTypes.string,
  icon: PropTypes.string,
  useAdvancedUI: PropTypes.bool,
  enableCategorization: PropTypes.bool,
  enableRecoveryActions: PropTypes.bool,
  onError: PropTypes.func,
  onRetry: PropTypes.func,
  onNavigate: PropTypes.func,
  onLogin: PropTypes.func,
  onSettings: PropTypes.func,
  onOfflineMode: PropTypes.func,
  style: PropTypes.object,
};

/**
 * Higher-order component to wrap components with error boundary
 */
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

/**
 * Simple Error Boundary - Minimal configuration for basic use cases
 */
export const SimpleErrorBoundary = ({ children, ...props }) => (
  <ErrorBoundary
    maxRetries={1}
    showDetails={false}
    useAdvancedUI={false}
    enableCategorization={false}
    enableRecoveryActions={false}
    title="Something went wrong"
    message="Please try again or restart the app."
    {...props}
  >
    {children}
  </ErrorBoundary>
);

/**
 * Network Error Boundary - Specialized for network-related errors
 */
export const NetworkErrorBoundary = ({ children, ...props }) => (
  <ErrorBoundary
    maxRetries={3}
    enableCategorization={true}
    enableRecoveryActions={true}
    title="Connection Problem"
    message="Please check your internet connection and try again."
    icon="cloud-offline"
    {...props}
  >
    {children}
  </ErrorBoundary>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  errorIcon: {
    marginBottom: 20,
    opacity: 0.9,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text.white,
    textAlign: 'center',
    marginBottom: 15,
    ...Platform.select({
      web: {
        textShadow: '0px 2px 4px rgba(0,0,0,0.3)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      },
    }),
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.text?.white90 || 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    paddingHorizontal: 20,
    maxWidth: 400,
  },
  retryCounter: {
    backgroundColor: SEMI_TRANSPARENT_WHITE_02,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  retryCountText: {
    fontSize: 12,
    color: Colors.text?.white || Colors.background.white,
    fontWeight: '600',
  },
  devErrorContainer: {
    backgroundColor: SEMI_TRANSPARENT_WHITE_01,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    maxWidth: 400,
  },
  devErrorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text?.white || Colors.background.white,
    marginBottom: 8,
  },
  devErrorText: {
    fontSize: 12,
    color: Colors.text?.white || Colors.background.white,
    fontFamily: 'monospace',
    marginBottom: 8,
    lineHeight: 16,
  },
  stackScroll: {
    maxHeight: 150,
  },
  devErrorStack: {
    fontSize: 10,
    color: Colors.text?.white70 || 'rgba(255,255,255,0.7)',
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  primaryButton: {
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: Colors.background.light,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.gray,
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SEMI_TRANSPARENT_WHITE_02,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 15,
  },
  secondaryButtonText: {
    color: Colors.text?.white || Colors.background.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  spinningIcon: {
    // Animation would be handled differently in RN
  },
  maxRetriesReached: {
    alignItems: 'center',
    backgroundColor: SEMI_TRANSPARENT_WHITE_01,
    borderRadius: 15,
    padding: 20,
  },
  maxRetriesText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.text?.white || Colors.background.white,
    textAlign: 'center',
    lineHeight: 20,
  },
  reportButton: {
    backgroundColor: SEMI_TRANSPARENT_WHITE_02,
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 20,
  },
  reportButtonText: {
    color: Colors.text?.white || Colors.background.white,
    fontSize: 14,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: Colors.text?.white70 || 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    maxWidth: 400,
  },
  version: {
    marginTop: 24,
    fontSize: 12,
    color: Colors.text?.white70 || 'rgba(255,255,255,0.7)',
  },
  // Simple UI styles
  simpleContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  simpleErrorContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  simpleErrorIcon: {
    marginBottom: 16,
  },
  simpleErrorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  simpleErrorMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  simpleErrorDetails: {
    backgroundColor: Colors.background.light,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  simpleErrorDetailsText: {
    fontSize: 12,
    color: Colors.text.primary,
    fontFamily: 'monospace',
  },
  simpleButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  simpleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  simpleRetryButton: {
    backgroundColor: Colors.background.light,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  simpleRetryButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  simpleResetButton: {
    backgroundColor: Colors.background.light,
  },
  simpleResetButtonText: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default ErrorBoundary;
