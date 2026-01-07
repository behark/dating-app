import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { UpdateService, UpdateStatus, APP_VERSION, BUILD_NUMBER } from '../../services/UpdateService';

/**
 * Hook for accessing update functionality in components
 *
 * Usage:
 * ```jsx
 * const {
 *   version,
 *   isUpdateAvailable,
 *   checkForUpdates,
 *   applyUpdate
 * } = useUpdate();
 * ```
 */
export const useUpdate = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isCriticalUpdate, setIsCriticalUpdate] = useState(false);
  const [updateManifest, setUpdateManifest] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const checkForUpdates = useCallback(async (silent = false) => {
    if (Platform.OS === 'web' || __DEV__) {
      return { status: UpdateStatus.NOT_SUPPORTED };
    }

    setIsChecking(true);
    try {
      const result = await UpdateService.checkForUpdates(silent);

      if (result.status === UpdateStatus.UPDATE_AVAILABLE) {
        setIsUpdateAvailable(true);
        setIsCriticalUpdate(false);
        setUpdateManifest(result.manifest);
      } else if (result.status === UpdateStatus.UPDATE_CRITICAL) {
        setIsUpdateAvailable(true);
        setIsCriticalUpdate(true);
        setUpdateManifest(result.manifest);
      } else {
        setIsUpdateAvailable(false);
        setIsCriticalUpdate(false);
        setUpdateManifest(null);
      }

      return result;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const applyUpdate = useCallback(async (immediate = true) => {
    if (Platform.OS === 'web' || __DEV__) {
      return false;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Simulate progress for better UX (actual download doesn't report progress)
      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const success = await UpdateService.downloadAndApplyUpdate(immediate);

      clearInterval(progressInterval);
      setDownloadProgress(100);

      if (success) {
        setIsUpdateAvailable(false);
      }

      return success;
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const showUpdateDialog = useCallback(() => {
    UpdateService.showUpdateDialog(isCriticalUpdate);
  }, [isCriticalUpdate]);

  // Auto-check for updates on mount (for screens like Settings)
  useEffect(() => {
    // Only check if not in development
    if (!__DEV__ && Platform.OS !== 'web') {
      checkForUpdates(true);
    }
  }, [checkForUpdates]);

  return {
    // Version info
    version: APP_VERSION,
    buildNumber: BUILD_NUMBER,
    displayVersion: UpdateService.getDisplayVersion(),
    versionInfo: UpdateService.getVersionInfo(),

    // Update state
    isChecking,
    isUpdateAvailable,
    isCriticalUpdate,
    updateManifest,
    isDownloading,
    downloadProgress,

    // Actions
    checkForUpdates,
    applyUpdate,
    showUpdateDialog,
  };
};

export default useUpdate;
