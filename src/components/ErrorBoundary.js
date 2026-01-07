import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';
import { Colors } from '../constants/colors';
import logger from '../utils/logger';

/**
 * Error Boundary - Simplified, configurable error boundary component
 *
 * Features:
 * - Error catching and user-friendly display
 * - Configurable retry behavior
 * - Error categorization
 * - Sentry logging
 * - Development error details
 */

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Store error details
    this.setState({
      error,
      errorInfo,
    });

    // Log to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
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
        },
        level: 'error',
      });
    } catch (sentryError) {
      console.error('Failed to send error to Sentry:', sentryError);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3, onRetry } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    // Call custom retry handler if provided
    if (onRetry) {
      onRetry();
    }

    // Reset error state to retry
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1,
    });
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  render() {
    const { hasError, retryCount, error, errorInfo } = this.state;
    const {
      children,
      fallback,
      maxRetries = 3,
      showRetry = true,
      showDetails = __DEV__,
      title = 'Oops! Something went wrong',
      message = 'We\'re sorry, but something unexpected happened. Please try again.',
      icon = '⚠️',
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
        });
      }

      // Default error UI
      const canRetry = showRetry && retryCount < maxRetries;

      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{icon}</Text>
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {retryCount > 0 && canRetry && (
              <View style={styles.retryCounter}>
                <Text style={styles.retryCountText}>
                  Retry attempt {retryCount} of {maxRetries}
                </Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              {canRetry ? (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={this.handleRetry}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>Try Again</Text>
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

            {/* Development error details */}
            {showDetails && error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorDetailsText}>{error.toString()}</Text>
                {errorInfo && (
                  <Text style={styles.errorDetailsText}>{errorInfo.componentStack}</Text>
                )}
              </View>
            )}

            <Text style={styles.version}>
              Version: {Constants.expoConfig?.version || '1.0.0'}
            </Text>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return children;
  }
}

/**
 * Simple Error Boundary - Minimal configuration for basic use cases
 */
export const SimpleErrorBoundary = ({ children, ...props }) => (
  <ErrorBoundary
    maxRetries={1}
    showDetails={false}
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
    title="Connection Problem"
    message="Please check your internet connection and try again."
    icon="📶"
    {...props}
  >
    {children}
  </ErrorBoundary>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.dark,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  retryCounter: {
    backgroundColor: Colors.background.light,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  retryCountText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 250,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '600',
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
  secondaryButtonText: {
    color: Colors.text.dark,
    fontSize: 14,
    fontWeight: '500',
  },
  errorDetails: {
    marginTop: 32,
    padding: 16,
    backgroundColor: Colors.background.lightest,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
    width: '100%',
    maxWidth: 400,
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.accent.red,
    marginBottom: 8,
  },
  errorDetailsText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
    lineHeight: 16,
  },
  version: {
    marginTop: 24,
    fontSize: 12,
    color: Colors.text.tertiary,
  },
});

export default ErrorBoundary;
