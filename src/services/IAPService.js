import { Platform } from 'react-native';

// Conditionally import IAP - not available on web
let InAppPurchases = null;
if (Platform.OS !== 'web') {
  try {
    InAppPurchases = require('expo-in-app-purchases');
  } catch (error) {
    console.warn('expo-in-app-purchases not available:', error);
  }
}

/**
 * In-App Purchase Service
 *
 * Handles subscriptions and consumable purchases for iOS and Android
 * Note: Not available on web platform
 */
class IAPService {
  constructor() {
    this.isConnected = false;
    this.products = [];
    this.purchaseHistory = [];
    this.isAvailable = Platform.OS !== 'web' && InAppPurchases !== null;
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

      await InAppPurchases.connectAsync();

      if (Platform.OS === 'ios') {
        // iOS requires purchase listener
        InAppPurchases.setPurchaseListener(this.handlePurchaseUpdate.bind(this));
      }

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

      const { responseCode, results } = await InAppPurchases.getProductsAsync(productIds);

      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        this.products = results;
        return results;
      } else {
        throw new Error(`Failed to get products: ${responseCode}`);
      }
    } catch (error) {
      console.error('Error getting products:', error);
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

      return await InAppPurchases.purchaseItemAsync(productId, options);
    } catch (error) {
      console.error('Purchase failed:', error);
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

      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();

      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        this.purchaseHistory = results;
        return results;
      } else {
        throw new Error(`Failed to restore purchases: ${responseCode}`);
      }
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  /**
   * Handle purchase updates (iOS)
   */
  handlePurchaseUpdate(purchase) {
    const { responseCode, results } = purchase;

    if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      results.forEach(async (purchase) => {
        if (purchase.acknowledged) return;

        // Acknowledge the purchase
        await this.finishTransaction(purchase);
      });
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
      await InAppPurchases.finishTransactionAsync(purchase, false);
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
      const history = await this.restorePurchases();

      // Find active subscriptions
      return history.filter(
        (purchase) =>
          productIds.includes(purchase.productId) &&
          (purchase.acknowledged ||
            purchase.purchaseState === InAppPurchases.InAppPurchaseState.PURCHASED)
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
        await InAppPurchases.disconnectAsync();
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
