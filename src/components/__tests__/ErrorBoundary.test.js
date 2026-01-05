import PropTypes from 'prop-types';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text, View } from 'react-native';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>No error</Text>;
};

ThrowError.propTypes = {
  shouldThrow: PropTypes.bool,
};

// Suppress console.error for expected errors
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render children when no error', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <Text>Child content</Text>
        </ErrorBoundary>
      );

      expect(getByText('Child content')).toBeTruthy();
    });

    it('should render fallback UI when error occurs', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getByText(/something went wrong/i)).toBeTruthy();
    });

    it('should render custom fallback when provided', () => {
      const CustomFallback = () => <Text>Custom error message</Text>;

      const { getByText } = render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getByText('Custom error message')).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should catch errors in child components', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalled();
    });

    it('should provide error info to onError callback', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });
  });

  describe('retry functionality', () => {
    it('should provide retry button in fallback', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getByText(/try again/i)).toBeTruthy();
    });

    it('should reset error state on retry', () => {
      let shouldThrow = true;

      const { getByText, rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      // Error should be shown
      expect(getByText(/something went wrong/i)).toBeTruthy();

      // Click retry and update component to not throw
      shouldThrow = false;
      const retryButton = getByText(/try again/i);
      fireEvent.press(retryButton);

      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      // Should now show content
      expect(getByText('No error')).toBeTruthy();
    });
  });

  describe('error logging', () => {
    it('should log error to console in development', () => {
      const consoleSpy = jest.spyOn(console, 'error');

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('nested error boundaries', () => {
    it('should handle errors in nested boundaries', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <View>
            <Text>Parent content</Text>
            <ErrorBoundary>
              <ThrowError shouldThrow={true} />
            </ErrorBoundary>
          </View>
        </ErrorBoundary>
      );

      // Parent content should still be visible
      expect(getByText('Parent content')).toBeTruthy();
      // Inner error boundary should catch the error
      expect(getByText(/something went wrong/i)).toBeTruthy();
    });
  });

  describe('error boundary state', () => {
    it('should have hasError state when error occurs', () => {
      const errorBoundaryRef = React.createRef();

      render(
        <ErrorBoundary ref={errorBoundaryRef}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // The error boundary should have caught the error
      expect(errorBoundaryRef.current?.state?.hasError).toBe(true);
    });
  });
});
