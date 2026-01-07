/**
 * Payment Configuration
 *
 * Centralized configuration for all payment providers:
 * - Stripe (credit cards, Apple Pay, Google Pay)
 * - PayPal
 * - Apple App Store (In-App Purchases)
 * - Google Play Store (In-App Purchases)
 */

module.exports = {
  // Stripe Configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    currency: 'usd',
    // Subscription price IDs (create these in Stripe Dashboard)
    prices: {
      monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly_premium',
      yearly: process.env.STRIPE_PRICE_YEARLY || 'price_yearly_premium',
    },
    // Product IDs for one-time purchases
    products: {
      superLikePack5: process.env.STRIPE_PRODUCT_SUPER_LIKES_5 || 'prod_super_likes_5',
      superLikePack15: process.env.STRIPE_PRODUCT_SUPER_LIKES_15 || 'prod_super_likes_15',
      boostPack1: process.env.STRIPE_PRODUCT_BOOST_1 || 'prod_boost_1',
      boostPack5: process.env.STRIPE_PRODUCT_BOOST_5 || 'prod_boost_5',
    },
  },

  // PayPal Configuration
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    mode: process.env.PAYPAL_MODE || 'sandbox', // 'sandbox' or 'live'
    webhookId: process.env.PAYPAL_WEBHOOK_ID,
    // PayPal Plan IDs (create these in PayPal Dashboard)
    plans: {
      monthly: process.env.PAYPAL_PLAN_MONTHLY || 'P-MONTHLY-PREMIUM',
      yearly: process.env.PAYPAL_PLAN_YEARLY || 'P-YEARLY-PREMIUM',
    },
  },

  // Apple App Store Configuration
  apple: {
    bundleId: process.env.APPLE_BUNDLE_ID || 'com.datingapp.app',
    sharedSecret: process.env.APPLE_SHARED_SECRET,
    environment: process.env.APPLE_ENVIRONMENT || 'sandbox', // 'sandbox' or 'production'
    // App Store Server Notifications v2
    keyId: process.env.APPLE_KEY_ID,
    issuerId: process.env.APPLE_ISSUER_ID,
    privateKey: process.env.APPLE_PRIVATE_KEY,
    // Product IDs (configure in App Store Connect)
    products: {
      monthlySubscription: 'com.datingapp.premium.monthly',
      yearlySubscription: 'com.datingapp.premium.yearly',
      superLikePack5: 'com.datingapp.superlikes.5',
      superLikePack15: 'com.datingapp.superlikes.15',
      boostPack1: 'com.datingapp.boost.1',
      boostPack5: 'com.datingapp.boost.5',
    },
    // Verification URLs
    verifyReceiptUrl: {
      sandbox: 'https://sandbox.itunes.apple.com/verifyReceipt',
      production: 'https://buy.itunes.apple.com/verifyReceipt',
    },
  },

  // Google Play Store Configuration
  google: {
    packageName: process.env.GOOGLE_PACKAGE_NAME || 'com.datingapp.app',
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    serviceAccountPrivateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    // Product IDs (configure in Google Play Console)
    products: {
      monthlySubscription: 'premium_monthly',
      yearlySubscription: 'premium_yearly',
      superLikePack5: 'super_likes_5',
      superLikePack15: 'super_likes_15',
      boostPack1: 'boost_1',
      boostPack5: 'boost_5',
    },
    // Real-time Developer Notifications
    rtdnTopicName: process.env.GOOGLE_RTDN_TOPIC,
  },

  // Subscription Tiers Configuration
  subscriptionTiers: {
    free: {
      name: 'Free',
      price: 0,
      features: {
        dailyLikes: 50,
        superLikesPerDay: 1,
        rewindsPerDay: 0,
        unlimitedSwipes: false,
        seeWhoLikedYou: false,
        passport: false,
        advancedFilters: false,
        priorityLikes: false,
        hideAds: false,
        profileBoostAnalytics: false,
        profileBoostsPerMonth: 0,
        messageBeforeMatch: false,
        readReceipts: false,
        incognitoMode: false,
      },
    },
    premium: {
      monthly: {
        name: 'Premium Monthly',
        price: 14.99,
        currency: 'USD',
        interval: 'month',
        intervalCount: 1,
        features: {
          dailyLikes: -1, // Unlimited
          superLikesPerDay: 5,
          rewindsPerDay: 5,
          unlimitedSwipes: true,
          seeWhoLikedYou: true,
          passport: true,
          advancedFilters: true,
          priorityLikes: true,
          hideAds: true,
          profileBoostAnalytics: true,
          profileBoostsPerMonth: 1,
          messageBeforeMatch: false,
          readReceipts: true,
          incognitoMode: false,
        },
      },
      yearly: {
        name: 'Premium Yearly',
        price: 99.99, // ~$8.33/month
        currency: 'USD',
        interval: 'year',
        intervalCount: 1,
        savings: '44%',
        features: {
          dailyLikes: -1,
          superLikesPerDay: 5,
          rewindsPerDay: 5,
          unlimitedSwipes: true,
          seeWhoLikedYou: true,
          passport: true,
          advancedFilters: true,
          priorityLikes: true,
          hideAds: true,
          profileBoostAnalytics: true,
          profileBoostsPerMonth: 1,
          messageBeforeMatch: false,
          readReceipts: true,
          incognitoMode: false,
        },
      },
    },
    platinum: {
      monthly: {
        name: 'Platinum Monthly',
        price: 29.99,
        currency: 'USD',
        interval: 'month',
        intervalCount: 1,
        features: {
          dailyLikes: -1,
          superLikesPerDay: -1, // Unlimited
          rewindsPerDay: -1,
          unlimitedSwipes: true,
          seeWhoLikedYou: true,
          passport: true,
          advancedFilters: true,
          priorityLikes: true,
          hideAds: true,
          profileBoostAnalytics: true,
          profileBoostsPerMonth: 5,
          messageBeforeMatch: true,
          readReceipts: true,
          incognitoMode: true,
        },
      },
      yearly: {
        name: 'Platinum Yearly',
        price: 179.99, // ~$15/month
        currency: 'USD',
        interval: 'year',
        intervalCount: 1,
        savings: '50%',
        features: {
          dailyLikes: -1,
          superLikesPerDay: -1,
          rewindsPerDay: -1,
          unlimitedSwipes: true,
          seeWhoLikedYou: true,
          passport: true,
          advancedFilters: true,
          priorityLikes: true,
          hideAds: true,
          profileBoostAnalytics: true,
          profileBoostsPerMonth: 5,
          messageBeforeMatch: true,
          readReceipts: true,
          incognitoMode: true,
        },
      },
    },
  },

  // Consumable Products (one-time purchases)
  consumableProducts: {
    superLikes: {
      pack5: { quantity: 5, price: 4.99, currency: 'USD' },
      pack15: { quantity: 15, price: 9.99, currency: 'USD' },
      pack30: { quantity: 30, price: 14.99, currency: 'USD' },
    },
    boosts: {
      pack1: { quantity: 1, price: 3.99, currency: 'USD', duration: 30 }, // 30 minutes
      pack5: { quantity: 5, price: 14.99, currency: 'USD', duration: 30 },
      pack10: { quantity: 10, price: 24.99, currency: 'USD', duration: 30 },
    },
    rewinds: {
      pack5: { quantity: 5, price: 2.99, currency: 'USD' },
      pack15: { quantity: 15, price: 6.99, currency: 'USD' },
    },
  },

  // Refund Configuration
  refund: {
    // Auto-approve refunds within this window (hours)
    autoApproveWindow: 48,
    // Maximum refund amount without manual review
    maxAutoRefundAmount: 50,
    // Grace period after subscription cancellation (days)
    gracePeriodDays: 3,
  },

  // Webhook verification settings
  webhooks: {
    // Tolerance for timestamp verification (seconds)
    timestampTolerance: 300,
    // Maximum age for processing events (hours)
    maxEventAge: 24,
  },
};
