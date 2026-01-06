import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import Constants from 'expo-constants';

/**
 * ErrorBoundary Component
 * Catches React component errors and displays a fallback UI
 * Prevents the entire app from crashing on unhandled errors
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Store error details in state
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Log to Sentry when configured
    // import * as Sentry from '@sentry/react-native';
    // Sentry.captureException(error, {
    //   contexts: { react: errorInfo }
    // });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const isDev = __DEV__;

      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>⚠️</Text>
            </View>

            <Text style={styles.title}>Oops! Something went wrong</Text>

            <Text style={styles.message}>
              We're sorry, but something unexpected happened. The error has been logged and we'll
              look into it.
            </Text>

            <TouchableOpacity style={styles.button} onPress={this.handleReset} activeOpacity={0.8}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            {/* Show error details in development */}
            {isDev && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorDetailsText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorDetailsText}>{this.state.errorInfo.componentStack}</Text>
                )}
              </View>
            )}

            <Text style={styles.version}>Version: {Constants.expoConfig?.version || '1.0.0'}</Text>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorDetails: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '100%',
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorDetailsText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  version: {
    marginTop: 24,
    fontSize: 12,
    color: '#999',
  },
});

export default ErrorBoundary;
