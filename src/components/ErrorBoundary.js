import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AnalyticsService } from '../services/AnalyticsService';
import { Colors } from '../constants/colors';
import logger from '../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to analytics
    AnalyticsService.logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // In production, you might want to send this to an error reporting service
    logger.error('Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReportError = () => {
    // In a real app, this could send error details to your support team
    alert('Error report sent. Thank you for helping us improve!');
  };

  render() {
    if (this.state.hasError) {
      return (
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.container}>
          <View style={styles.errorContainer}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={80} color={Colors.text.white} />
            </View>

            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.errorMessage}>
              We&apos;re sorry, but something unexpected happened. Our team has been notified.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.devErrorContainer}>
                <Text style={styles.devErrorTitle}>Development Error Details:</Text>
                <Text style={styles.devErrorText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.devErrorStack}>{this.state.errorInfo.componentStack}</Text>
                )}
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={this.handleRetry}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  style={styles.retryButtonGradient}
                >
                  <Ionicons
                    name="refresh"
                    size={20}
                    color={Colors.text.white}
                    style={styles.refreshIcon}
                  />
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reportButton}
                onPress={this.handleReportError}
                activeOpacity={0.8}
              >
                <Text style={styles.reportButtonText}>Report Issue</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.helpText}>
              If this problem persists, please contact support or try restarting the app.
            </Text>
          </View>
        </LinearGradient>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    marginBottom: 20,
    opacity: 0.8,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text.white,
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: Colors.shadow.black,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.text.white90,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  devErrorContainer: {
    backgroundColor: Colors.background.white10,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    maxWidth: 400,
  },
  devErrorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.white,
    marginBottom: 8,
  },
  devErrorText: {
    fontSize: 12,
    color: Colors.text.white,
    fontFamily: 'monospace',
    marginBottom: 8,
    lineHeight: 16,
  },
  devErrorStack: {
    fontSize: 10,
    color: Colors.text.white70,
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 15,
    marginBottom: 20,
  },
  retryButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: Colors.shadow.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '700',
  },
  reportButton: {
    backgroundColor: Colors.background.white20,
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.background.white30,
  },
  reportButtonText: {
    color: Colors.text.white,
    fontSize: 14,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: Colors.text.white70,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  refreshIcon: {
    marginRight: 8,
  },
});

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
