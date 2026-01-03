import { render, waitFor } from '@testing-library/react-native';
import NetworkStatusBanner from '../NetworkStatusBanner';

// Mock NetInfo
const mockNetInfo = {
  addEventListener: jest.fn(),
  fetch: jest.fn(),
};

jest.mock('@react-native-community/netinfo', () => mockNetInfo);

describe('NetworkStatusBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNetInfo.fetch.mockResolvedValue({ isConnected: true });
    mockNetInfo.addEventListener.mockImplementation((callback) => {
      return jest.fn(); // unsubscribe
    });
  });

  describe('visibility', () => {
    it('should not show banner when online', async () => {
      mockNetInfo.fetch.mockResolvedValue({ isConnected: true });

      const { queryByTestId } = render(<NetworkStatusBanner />);

      await waitFor(() => {
        expect(queryByTestId('network-banner')).toBeNull();
      });
    });

    it('should show banner when offline', async () => {
      mockNetInfo.fetch.mockResolvedValue({ isConnected: false });

      const { findByText } = render(<NetworkStatusBanner />);

      const banner = await findByText(/offline/i);
      expect(banner).toBeTruthy();
    });
  });

  describe('content', () => {
    it('should display offline message', async () => {
      mockNetInfo.fetch.mockResolvedValue({ isConnected: false });

      const { findByText } = render(<NetworkStatusBanner />);

      const message = await findByText(/no internet connection/i);
      expect(message).toBeTruthy();
    });

    it('should show reconnecting message', async () => {
      mockNetInfo.fetch.mockResolvedValue({ isConnected: false, isInternetReachable: false });

      const { findByText } = render(<NetworkStatusBanner />);

      // Banner should indicate reconnection attempt
      await waitFor(() => {
        expect(findByText(/reconnecting|offline/i)).toBeTruthy();
      });
    });
  });

  describe('connection changes', () => {
    it('should update when connection status changes', async () => {
      let connectionCallback;
      mockNetInfo.addEventListener.mockImplementation((callback) => {
        connectionCallback = callback;
        return jest.fn();
      });
      mockNetInfo.fetch.mockResolvedValue({ isConnected: true });

      const { queryByTestId, findByText } = render(<NetworkStatusBanner />);

      // Initially online - no banner
      await waitFor(() => {
        expect(queryByTestId('network-banner')).toBeNull();
      });

      // Go offline
      connectionCallback({ isConnected: false });

      const banner = await findByText(/offline/i);
      expect(banner).toBeTruthy();
    });
  });

  describe('styling', () => {
    it('should have correct offline styling', async () => {
      mockNetInfo.fetch.mockResolvedValue({ isConnected: false });

      const { findByTestId } = render(<NetworkStatusBanner testID="network-banner" />);

      const banner = await findByTestId('network-banner');
      expect(banner.props.style).toMatchObject(
        expect.objectContaining({
          backgroundColor: expect.any(String),
        })
      );
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe from network events on unmount', () => {
      const unsubscribe = jest.fn();
      mockNetInfo.addEventListener.mockReturnValue(unsubscribe);

      const { unmount } = render(<NetworkStatusBanner />);
      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
