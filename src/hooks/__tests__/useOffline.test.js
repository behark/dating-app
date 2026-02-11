import { act, renderHook, waitFor } from '@testing-library/react';
import { useOffline } from '../useOffline';
import { OfflineService } from '../../services/OfflineService';

jest.mock('../../services/OfflineService', () => ({
  OfflineService: {
    initialize: jest.fn(),
    getNetworkStatus: jest.fn(),
    subscribe: jest.fn(),
    queueAction: jest.fn(),
    getCachedProfiles: jest.fn(),
    getCachedMatches: jest.fn(),
    getCachedMessages: jest.fn(),
    clearCache: jest.fn(),
    cacheProfiles: jest.fn(),
    cacheMatches: jest.fn(),
    cacheMessages: jest.fn(),
  },
}));

describe('useOffline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    OfflineService.initialize.mockResolvedValue(OfflineService);
    OfflineService.getNetworkStatus.mockReturnValue(true);
    OfflineService.subscribe.mockImplementation(() => jest.fn());
  });

  it('initializes and exposes online status', async () => {
    OfflineService.getNetworkStatus.mockReturnValue(false);

    const { result } = renderHook(() => useOffline());

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
    });

    expect(OfflineService.initialize).toHaveBeenCalled();
    expect(OfflineService.subscribe).toHaveBeenCalled();
  });

  it('updates status from subscription callback', async () => {
    let listener;
    OfflineService.subscribe.mockImplementation((cb) => {
      listener = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useOffline());

    await waitFor(() => {
      expect(OfflineService.subscribe).toHaveBeenCalled();
    });

    act(() => {
      listener(false);
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('queues an action through OfflineService', async () => {
    const action = { type: 'LIKE_PROFILE', data: { profileId: 'profile_123' } };
    OfflineService.queueAction.mockResolvedValue('queued_1');

    const { result } = renderHook(() => useOffline());

    let queuedId;
    await act(async () => {
      queuedId = await result.current.queueAction(action);
    });

    expect(queuedId).toBe('queued_1');
    expect(OfflineService.queueAction).toHaveBeenCalledWith(action);
  });

  it('reads cached data through OfflineService', async () => {
    OfflineService.getCachedProfiles.mockResolvedValue([{ id: 'p1' }]);
    OfflineService.getCachedMatches.mockResolvedValue([{ id: 'm1' }]);
    OfflineService.getCachedMessages.mockResolvedValue([{ id: 'msg1' }]);

    const { result } = renderHook(() => useOffline());

    await act(async () => {
      await result.current.getCachedProfiles();
      await result.current.getCachedMatches();
      await result.current.getCachedMessages('match_1');
    });

    expect(OfflineService.getCachedProfiles).toHaveBeenCalled();
    expect(OfflineService.getCachedMatches).toHaveBeenCalled();
    expect(OfflineService.getCachedMessages).toHaveBeenCalledWith('match_1');
  });

  it('clears cache through OfflineService', async () => {
    OfflineService.clearCache.mockResolvedValue(undefined);

    const { result } = renderHook(() => useOffline());

    await act(async () => {
      await result.current.clearCache();
    });

    expect(OfflineService.clearCache).toHaveBeenCalled();
  });
});
