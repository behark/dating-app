import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

/**
 * ErrorBoundary component for catching and handling React component errors
 *
 * Features:
 * - Catches JavaScript errors in component tree
 * - Displays user-friendly error UI
 * - Provides retry functionality
 * - Logs errors for debugging
 * - Graceful fallback rendering
 */
class ErrorBoundary extends React.Component {
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
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // In production, you might want to send this to an error reporting service
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    const maxRetries = this.props.maxRetries || 3;

    if (retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
    } else {
      // Max retries reached, show persistent error
      this.setState({
        retryCount: retryCount + 1,
      });
    }
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
    const { hasError, error, retryCount } = this.state;
    const {
      children,
      fallback: FallbackComponent,
      showDetails = __DEV__, // Show error details in development
      style,
    } = this.props;

    if (hasError) {
      // Use custom fallback component if provided
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            retry={this.handleRetry}
            reset={this.handleReset}
            retryCount={retryCount}
          />
        );
      }

      // Default error boundary UI
      const maxRetries = this.props.maxRetries || 3;
      const canRetry = retryCount < maxRetries;

      return (
        <View style={[styles.container, style]}>
          <View style={styles.errorContent}>
            <Ionicons
              name="alert-circle"
              size={48}
              color={Colors.accent.red}
              style={styles.errorIcon}
            />
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorMessage}>
              We encountered an unexpected error. Please try again.
            </Text>

            {showDetails && error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorDetailsText}>
                  {error.toString()}
                </Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              {canRetry && (
                <TouchableOpacity
                  style={[styles.button, styles.retryButton]}
                  onPress={this.handleRetry}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={16} color={Colors.primary} />
                  <Text style={styles.retryButtonText}>
                    Try Again ({maxRetries - retryCount} left)
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, styles.resetButton]}
                onPress={this.handleReset}
                activeOpacity={0.7}
              >
                <Ionicons name="home" size={16} color={Colors.text.secondary} />
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export const withErrorBoundary = (
  Component,
  errorBoundaryProps = {}
) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.white,
    padding: 20,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  errorDetails: {
    backgroundColor: Colors.background.light,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  errorDetailsText: {
    fontSize: 12,
    color: Colors.text.primary,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: Colors.background.light,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retryButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  resetButton: {
    backgroundColor: Colors.background.light,
  },
  resetButtonText: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default ErrorBoundary;