import { Platform } from 'react-native';

/**
 * PWA Service - Manages Progressive Web App functionality
 */
class PWAServiceClass {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isInstallable = false;
    this.registration = null;
  }

  /**
   * Initialize PWA features
   */
  async initialize() {
    if (Platform.OS !== 'web') {
      return;
    }

    // Register service worker
    await this.registerServiceWorker();

    // Check if already installed
    this.checkInstallStatus();

    // Listen for install prompt
    this.listenForInstallPrompt();

    // Listen for app installed
    this.listenForAppInstalled();
  }

  /**
   * Register the service worker
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      this.registration = registration;
      console.log('Service Worker registered:', registration);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            this.onUpdateAvailable(registration);
          }
        });
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Check if app is already installed
   */
  checkInstallStatus() {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      return true;
    }

    // iOS Safari check
    if (window.navigator.standalone === true) {
      this.isInstalled = true;
      return true;
    }

    return false;
  }

  /**
   * Listen for beforeinstallprompt event
   */
  listenForInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing
      e.preventDefault();
      // Store the event for later use
      this.deferredPrompt = e;
      this.isInstallable = true;
      console.log('App is installable');
    });
  }

  /**
   * Listen for appinstalled event
   */
  listenForAppInstalled() {
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.isInstallable = false;
      this.deferredPrompt = null;
      console.log('App was installed');
    });
  }

  /**
   * Prompt user to install the app
   */
  async promptInstall() {
    if (!this.deferredPrompt) {
      console.log('Install prompt not available');
      return { outcome: 'unavailable' };
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log('Install prompt outcome:', outcome);

    // Clear the deferred prompt
    this.deferredPrompt = null;
    this.isInstallable = false;

    return { outcome };
  }

  /**
   * Handle service worker update
   */
  onUpdateAvailable(registration) {
    console.log('New version available');
    
    // You can show a notification to the user here
    // For automatic updates:
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  /**
   * Force update the service worker
   */
  async forceUpdate() {
    if (this.registration) {
      await this.registration.update();
    }
  }

  /**
   * Clear all caches
   */
  async clearCache() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
      console.log('All caches cleared');
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(vapidPublicKey) {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    const subscription = await this.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
    });

    return subscription;
  }

  /**
   * Get push subscription
   */
  async getPushSubscription() {
    if (!this.registration) {
      return null;
    }

    return await this.registration.pushManager.getSubscription();
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush() {
    const subscription = await this.getPushSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
  }

  /**
   * Check if app can be shared to
   */
  canShare() {
    return navigator.share !== undefined;
  }

  /**
   * Share content using Web Share API
   */
  async share(data) {
    if (!this.canShare()) {
      throw new Error('Web Share API not supported');
    }

    await navigator.share(data);
  }

  /**
   * Register for background sync
   */
  async registerBackgroundSync(tag) {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    if ('sync' in this.registration) {
      await this.registration.sync.register(tag);
      console.log('Background sync registered:', tag);
    }
  }

  /**
   * Convert VAPID key for push subscription
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Get installation status
   */
  getInstallStatus() {
    return {
      isInstalled: this.isInstalled,
      isInstallable: this.isInstallable,
      hasServiceWorker: this.registration !== null,
    };
  }
}

export const PWAService = new PWAServiceClass();
export default PWAService;
