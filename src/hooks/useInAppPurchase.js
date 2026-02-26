/**
 * useInAppPurchase Hook
 *
 * React Native hook for handling in-app purchases with:
 * - iOS App Store
 * - Google Play Store
 *
 * Uses react-native-iap library (must be installed separately)
 */

import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { PaymentService } from '../services/PaymentService';
import logger from '../utils/logger';

// Product IDs - these must match App Store Connect / Google Play Console
const SUBSCRIPTION_SKUS = Platform.select({
  ios: ['com.datingapp.premium.monthly', 'com.datingapp.premium.yearly'],
  android: ['premium_monthly', 'premium_yearly'],
  default: [],
});

const CONSUMABLE_SKUS = Platform.select({
  ios: [
    'com.datingapp.superlikes.5',
    'com.datingapp.superlikes.15',
    'com.datingapp.boost.1',
    'com.datingapp.boost.5',
  ],
  android: ['super_likes_5', 'super_likes_15', 'boost_1', 'boost_5'],
  default: [],
});

export const useInAppPurchase = () => {
  const { authToken } = useAuth();
  const [products, setProducts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);

  // Initialize IAP connection and fetch products
  useEffect(() => {
    let iapModule = null;
    let purchaseUpdateSubscription = null;
    let purchaseErrorSubscription = null;

    const initIAP = async () => {
      try {
        // Only import react-native-iap on native platforms
        if (Platform.OS === 'web') {
          setLoading(false);
          return;
        }

        // Dynamic import to avoid issues on web
        iapModule = await import('react-native-iap');
        const {
          initConnection,
          getProducts,
          getSubscriptions,
          purchaseUpdatedListener,
          purchaseErrorListener,
          flushFailedPurchasesCachedAsPendingAndroid,
        } = iapModule;

        // Initialize connection
        await initConnection();

        // Clear any pending purchases on Android
        if (Platform.OS === 'android') {
          await flushFailedPurchasesCachedAsPendingAndroid();
        }

        // Fetch products
        const [fetchedProducts, fetchedSubscriptions] = await Promise.all([
          getProducts({ skus: CONSUMABLE_SKUS }),
          getSubscriptions({ skus: SUBSCRIPTION_SKUS }),
        ]);

        setProducts(fetchedProducts);
        setSubscriptions(fetchedSubscriptions);

        // Set up purchase listeners
        purchaseUpdateSubscription = purchaseUpdatedListener(handlePurchaseUpdate);
        purchaseErrorSubscription = purchaseErrorListener(handlePurchaseError);

        setLoading(false);
      } catch (err) {
        logger.error('Error initializing IAP', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initIAP();

    // Cleanup
    return () => {
      if (purchaseUpdateSubscription) {
        purchaseUpdateSubscription.remove();
      }
      if (purchaseErrorSubscription) {
        purchaseErrorSubscription.remove();
      }
      if (iapModule) {
        iapModule.endConnection();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle successful purchase
  const handlePurchaseUpdate = async (purchase) => {
    try {
      setPurchasing(true);
      const token = authToken;

      // Get receipt data
      const receipt = purchase.transactionReceipt;

      if (Platform.OS === 'ios') {
        // Validate with our server
        const result = await PaymentService.validateAppleReceipt(
          receipt,
          purchase.productId,
          token
        );

        if (result.success) {
          // Finish the transaction
          const { finishTransaction } = await import('react-native-iap');
          await finishTransaction({ purchase, isConsumable: isConsumable(purchase.productId) });

          Alert.alert('Success', 'Your purchase was successful!');
        } else {
          throw new Error(result.error || 'Validation failed');
        }
      } else if (Platform.OS === 'android') {
        // Validate with our server
        const isSubscription = SUBSCRIPTION_SKUS.includes(purchase.productId);
        const result = await PaymentService.validateGooglePurchase(
          purchase.purchaseToken,
          purchase.productId,
          isSubscription,
          token
        );

        if (result.success) {
          // Acknowledge the purchase (server should have done this, but just in case)
          const { finishTransaction } = await import('react-native-iap');
          await finishTransaction({
            purchase,
            isConsumable: !isSubscription,
          });

          Alert.alert('Success', 'Your purchase was successful!');
        } else {
          throw new Error(result.error || 'Validation failed');
        }
      }
    } catch (err) {
      logger.error('Error processing purchase', err, { productId: purchase.productId });
      Alert.alert('Error', `Failed to process purchase: ${err.message}`);
    } finally {
      setPurchasing(false);
    }
  };

  // Handle purchase error
  const handlePurchaseError = (error) => {
    logger.error('Purchase error', error);
    setPurchasing(false);

    // Don't show alert for user cancellation
    if (error.code !== 'E_USER_CANCELLED') {
      Alert.alert('Purchase Failed', error.message || 'An error occurred during purchase');
    }
  };

  // Check if product is consumable
  const isConsumable = (productId) => {
    return CONSUMABLE_SKUS.includes(productId);
  };

  // Purchase a subscription
  const purchaseSubscription = useCallback(
    async (productId) => {
      try {
        setPurchasing(true);
        setError(null);

        const { requestSubscription } = await import('react-native-iap');

        if (Platform.OS === 'android') {
          // Get offer token for Android
          const subscription = subscriptions.find((s) => s.productId === productId);
          const offerToken = subscription?.subscriptionOfferDetails?.[0]?.offerToken;

          await requestSubscription({
            sku: productId,
            subscriptionOffers: [{ sku: productId, offerToken }],
          });
        } else {
          await requestSubscription({ sku: productId });
        }
      } catch (err) {
        logger.error('Error purchasing subscription', err, { productId });
        setError(err.message);
        setPurchasing(false);

        if (err.code !== 'E_USER_CANCELLED') {
          Alert.alert('Error', err.message || 'Failed to start purchase');
        }
      }
    },
    [subscriptions]
  );

  // Purchase a consumable product
  const purchaseProduct = useCallback(async (productId) => {
    try {
      setPurchasing(true);
      setError(null);

      const { requestPurchase } = await import('react-native-iap');
      await requestPurchase({ sku: productId });
    } catch (err) {
      logger.error('Error purchasing product', err, { productId });
      setError(err.message);
      setPurchasing(false);

      if (err.code !== 'E_USER_CANCELLED') {
        Alert.alert('Error', err.message || 'Failed to start purchase');
      }
    }
  }, []);

  // Restore iOS purchases
  const restoreIosPurchases = useCallback(async (token) => {
    const { getAvailablePurchases } = await import('react-native-iap');
    const purchases = await getAvailablePurchases();

    if (purchases.length === 0) {
      Alert.alert('Info', 'No purchases found to restore');
      return;
    }

    // Find the latest receipt
    const latestPurchase = purchases.reduce((a, b) =>
      new Date(a.transactionDate) > new Date(b.transactionDate) ? a : b
    );

    const result = await PaymentService.restoreApplePurchases(
      latestPurchase.transactionReceipt,
      token
    );

    if (result.success) {
      Alert.alert('Success', 'Purchases restored successfully!');
    } else {
      Alert.alert('Info', 'No purchases to restore');
    }
  }, []);

  // Restore Android purchases
  const restoreAndroidPurchases = useCallback(async (token) => {
    const { getAvailablePurchases } = await import('react-native-iap');
    const purchases = await getAvailablePurchases();

    if (purchases.length === 0) {
      Alert.alert('Info', 'No purchases found to restore');
      return;
    }

    const purchaseData = purchases.map((p) => ({
      purchaseToken: p.purchaseToken,
      productId: p.productId,
    }));

    const result = await PaymentService.restoreGooglePurchases(purchaseData);

    if (result.success) {
      Alert.alert('Success', 'Purchases restored successfully!');
    } else {
      Alert.alert('Info', 'No active purchases to restore');
    }
  }, []);

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (Platform.OS === 'ios') {
        await restoreIosPurchases(authToken);
      } else if (Platform.OS === 'android') {
        await restoreAndroidPurchases(authToken);
      }
    } catch (err) {
      logger.error('Error restoring purchases', err);
      setError(err.message);
      Alert.alert('Error', 'Failed to restore purchases');
    } finally {
      setLoading(false);
    }
  }, [authToken, restoreIosPurchases, restoreAndroidPurchases]);

  // Get product by ID
  const getProduct = useCallback(
    (productId) => {
      return (
        products.find((p) => p.productId === productId) ||
        subscriptions.find((s) => s.productId === productId)
      );
    },
    [products, subscriptions]
  );

  // Format price for display
  const formatPrice = useCallback((product) => {
    if (!product) return '';

    if (Platform.OS === 'ios') {
      return product.localizedPrice;
    } else if (Platform.OS === 'android') {
      // For subscriptions, get the price from the first offer
      if (product.subscriptionOfferDetails && product.subscriptionOfferDetails.length > 0) {
        const offer = product.subscriptionOfferDetails[0];
        if (
          offer?.pricingPhases?.pricingPhaseList &&
          offer.pricingPhases.pricingPhaseList.length > 0
        ) {
          const pricing = offer.pricingPhases.pricingPhaseList[0];
          return pricing?.formattedPrice || '';
        }
      }
      return product.localizedPrice || '';
    }

    return '';
  }, []);

  return {
    // State
    products,
    subscriptions,
    loading,
    purchasing,
    error,

    // Actions
    purchaseSubscription,
    purchaseProduct,
    restorePurchases,

    // Helpers
    getProduct,
    formatPrice,
    isIAPAvailable: Platform.OS !== 'web',

    // Product SKUs for reference
    SUBSCRIPTION_SKUS,
    CONSUMABLE_SKUS,
  };
};

export default useInAppPurchase;
