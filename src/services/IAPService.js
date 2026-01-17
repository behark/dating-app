import { Platform } from 'react-native';

// Conditionally import IAP - not available on web
let IAP = null;
if (Platform.OS !== 'web') {
  try {
    IAP = require('react-native-iap');
  } catch (error) {
    console.warn('react-native-iap not available:', error);
  }
}

/**
 * In-App Purchase Service
 *
 * Handles subscriptions and consumable purchases for iOS and Android
 * Note: Not available on web platform
 * Uses react-native-iap library
 */
class IAPService {
  constructor() {
    this.isConnected = false;
    this.products = [];
    this.purchaseHistory = [];
    this.isAvailable = Platform.OS !== 'web' && IAP !== null;
    this.purchaseUpdateSubscription = null;
    this.purchaseErrorSubscription = null;
  }

  /**
   * Initialize IAP connection
   */
  async initialize() {
    if (!this.isAvailable) {
      console.warn('IAP not available on web platform');
      return;
    }

    try {
      if (this.isConnected) return;

      await IAP.initConnection();

      // Set up purchase listeners
      this.purchaseUpdateSubscription = IAP.purchaseUpdatedListener((purchase) => {
        this.handlePurchaseUpdate(purchase);
      });

      this.purchaseErrorSubscription = IAP.purchaseErrorListener((error) => {
        console.error('Purchase error:', error);
      });

      this.isConnected = true;
      console.log('IAP service initialized');
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      throw error;
    }
  }

  /**
   * Get available products
   */
  async getProducts(productIds) {
    if (!this.isAvailable) {
      console.warn('IAP not available on web platform');
      return [];
    }

    try {
      await this.initialize();

      const products = await IAP.getProducts(productIds);
      this.products = products;
      return products;
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  }

  /**
   * Get available subscriptions
   */
  async getSubscriptions(subscriptionIds) {
    if (!this.isAvailable) {
      console.warn('IAP not available on web platform');
      return [];
    }

    try {
      await this.initialize();

      const subscriptions = await IAP.getSubscriptions(subscriptionIds);
      return subscriptions;
    } catch (error) {
      console.error('Error getting subscriptions:', error);
      throw error;
    }
  }

  /**
   * Purchase a product
   */
  async purchaseProduct(productId, options = {}) {
    if (!this.isAvailable) {
      throw new Error('IAP not available on web platform');
    }

    try {
      await this.initialize();

      return await IAP.requestPurchase(productId, false);
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(subscriptionId, options = {}) {
    if (!this.isAvailable) {
      throw new Error('IAP not available on web platform');
    }

    try {
      await this.initialize();

      return await IAP.requestSubscription(subscriptionId, false);
    } catch (error) {
      console.error('Subscription purchase failed:', error);
      throw error;
    }
  }

  /**
   * Restore purchases (for subscriptions)
   */
  async restorePurchases() {
    if (!this.isAvailable) {
      console.warn('IAP not available on web platform');
      return [];
    }

    try {
      await this.initialize();

      const purchases = await IAP.getAvailablePurchases();
      this.purchaseHistory = purchases;
      return purchases;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  /**
   * Handle purchase updates
   */
  async handlePurchaseUpdate(purchase) {
    try {
      // Check if purchase is already acknowledged
      if (purchase.isAcknowledged) {
        return;
      }

      // Acknowledge the purchase
      await this.finishTransaction(purchase);
    } catch (error) {
      console.error('Error handling purchase update:', error);
    }
  }

  /**
   * Finish transaction (acknowledge purchase)
   */
  async finishTransaction(purchase) {
    if (!this.isAvailable) {
      return;
    }

    try {
      if (Platform.OS === 'ios') {
        await IAP.finishTransaction(purchase, false);
      } else {
        // Android
        await IAP.acknowledgePurchaseAndroid(purchase.purchaseToken);
      }
      console.log('Transaction finished:', purchase.productId);
    } catch (error) {
      console.error('Failed to finish transaction:', error);
      throw error;
    }
  }

  /**
   * Check if user has active subscription
   */
  async getActiveSubscription(productIds) {
    try {
      const purchases = await this.restorePurchases();

      // Find active subscriptions
      return purchases.filter(
        (purchase) =>
          productIds.includes(purchase.productId) &&
          (purchase.isAcknowledged || purchase.transactionState === 'purchased')
      );
    } catch (error) {
      console.error('Failed to get active subscription:', error);
      return [];
    }
  }

  /**
   * Disconnect IAP
   */
  async disconnect() {
    if (!this.isAvailable) {
      return;
    }

    try {
      if (this.isConnected) {
        // Remove listeners
        if (this.purchaseUpdateSubscription) {
          this.purchaseUpdateSubscription.remove();
          this.purchaseUpdateSubscription = null;
        }

        if (this.purchaseErrorSubscription) {
          this.purchaseErrorSubscription.remove();
          this.purchaseErrorSubscription = null;
        }

        await IAP.endConnection();
        this.isConnected = false;
        console.log('IAP service disconnected');
      }
    } catch (error) {
      console.error('Failed to disconnect IAP:', error);
    }
  }

  /**
   * Get product details by ID
   */
  getProductById(productId) {
    return this.products.find((product) => product.productId === productId);
  }
}

// Export singleton instance
export default new IAPService();
