/**
 * Lazy Loading Utility for React Native
 * Provides code splitting capabilities for better performance
 *
 * Note: React.lazy() doesn't work in React Native, so we use dynamic imports
 * with a loading component wrapper for better performance
 */

import { Component } from 'react';
import { Colors } from '../constants/colors';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import logger from './logger';

/**
 * Create a lazy-loaded component with loading state
 * @param {Function} importFn - Function that returns a promise resolving to the component
 * @param {React.Component} LoadingComponent - Component to show while loading
 * @returns {React.Component} Lazy-loaded component
 */
export function createLazyComponent(importFn, LoadingComponent = null) {
  class LazyComponent extends Component {
    constructor(props) {
      super(props);
      this.state = {
        Component: null,
        loading: true,
        error: null,
      };
    }

    async componentDidMount() {
      try {
        const module = await importFn();
        const Component = module.default || module;
        this.setState({ Component, loading: false });
      } catch (error) {
        logger.error('Error loading component:', error);
        this.setState({ error, loading: false });
      }
    }

    render() {
      const { Component, loading, error } = this.state;

      if (loading) {
        return (
          LoadingComponent || (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          )
        );
      }

      if (error) {
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load screen</Text>
          </View>
        );
      }

      if (!Component) {
        return null;
      }

      return <Component {...this.props} />;
    }
  }

  return LazyComponent;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.white,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
  },
});

export default {
  createLazyComponent,
};
