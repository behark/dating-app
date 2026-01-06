# 🎯 PRODUCTION LAUNCH ACTION PLAN

**Dating App - Critical Issues & Remediation**

---

## EXECUTIVE SUMMARY

**Current Status:** ⚠️ NO-GO  
**Critical Blockers:** 8  
**High Priority Issues:** 6  
**Timeline to GO:** 4-6 weeks

This document outlines all issues found during QA audit and provides specific remediation steps.

---

## CRITICAL BLOCKERS (Must Fix Before Launch)

### 1. MESSAGE ENCRYPTION NOT IMPLEMENTED

**Severity:** 🔴 CRITICAL  
**Impact:** Privacy violation, GDPR non-compliance  
**Effort:** High (2-3 weeks)  
**Risk:** Legal liability, user trust

#### Current State

- Messages stored in plaintext in MongoDB
- No encryption in transit or at rest
- No key management system

#### Required Implementation

**Step 1: Implement E2E Encryption Library**

```bash
npm install --save tweetnacl-js libsodium.js
```

**Step 2: Add Encryption Keys to User Model**

```javascript
// backend/models/User.js
encryptionPublicKey: String,
encryptionPrivateKeyEncrypted: String,
encryptionKeyVersion: { type: Number, default: 1 }
```

**Step 3: Generate Keys on User Creation**

```javascript
// backend/controllers/authController.js
const sodium = require('libsodium.js');

// Generate keypair
const keypair = sodium.crypto_box_keypair();
user.encryptionPublicKey = Buffer.from(keypair.publicKey).toString('base64');
// Encrypt private key with user's password
user.encryptionPrivateKeyEncrypted = encryptPrivateKey(keypair.privateKey, password);
```

**Step 4: Encrypt Messages Before Storage**

```javascript
// backend/controllers/chatController.js
const encryptMessage = (content, recipientPublicKey) => {
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const encrypted = sodium.crypto_box(
    Buffer.from(content),
    nonce,
    Buffer.from(recipientPublicKey, 'base64'),
    Buffer.from(senderPrivateKey, 'base64')
  );
  return {
    encrypted: Buffer.from(encrypted).toString('base64'),
    nonce: Buffer.from(nonce).toString('base64'),
  };
};

// Save encrypted message
const message = new Message({
  matchId,
  senderId,
  receiverId,
  content: encryptMessage(content, recipientPublicKey).encrypted,
  nonce: encryptMessage(content, recipientPublicKey).nonce,
  type,
  isEncrypted: true,
});
```

**Step 5: Decrypt Messages on Retrieval**

```javascript
// backend/controllers/chatController.js
const decryptMessage = (encryptedContent, nonce, senderPublicKey, recipientPrivateKey) => {
  const decrypted = sodium.crypto_box_open(
    Buffer.from(encryptedContent, 'base64'),
    Buffer.from(nonce, 'base64'),
    Buffer.from(senderPublicKey, 'base64'),
    Buffer.from(recipientPrivateKey, 'base64')
  );
  return Buffer.from(decrypted).toString('utf-8');
};
```

**Step 6: Update Frontend to Handle Encryption**

```javascript
// src/services/EncryptionService.js
export class EncryptionService {
  static async generateKeyPair() {
    // Generate keypair on client
  }

  static async encryptMessage(content, recipientPublicKey) {
    // Encrypt before sending
  }

  static async decryptMessage(encryptedContent, nonce, senderPublicKey) {
    // Decrypt after receiving
  }
}
```

**Testing:**

- [ ] Unit tests for encryption/decryption
- [ ] Integration tests for message flow
- [ ] E2E tests for encrypted messaging
- [ ] Performance tests (encryption overhead)

**Timeline:** 2-3 weeks

---

### 2. TOKEN BLACKLIST NOT IMPLEMENTED

**Severity:** 🔴 CRITICAL  
**Impact:** Security vulnerability - logged out tokens can still be used  
**Effort:** Medium (1 week)  
**Risk:** Account takeover

#### Current State

- No server-side logout
- Tokens valid until expiry even after logout
- No way to revoke tokens

#### Required Implementation

**Step 1: Set Up Redis for Token Blacklist**

```javascript
// backend/config/redis.js
const redis = require('ioredis');

const redisClient = new redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: 1, // Use separate DB for token blacklist
});

module.exports = { redisClient };
```

**Step 2: Add Logout Endpoint**

```javascript
// backend/routes/auth.js
router.post('/logout', authenticate, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add token to blacklist with expiry = token expiry
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    await redisClient.setex(`blacklist:${token}`, ttl, '1');

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
});
```

**Step 3: Check Blacklist in Auth Middleware**

```javascript
// backend/middleware/auth.js
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false });

    // Check if token is blacklisted
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ success: false, message: 'Token revoked' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false });
  }
};
```

**Step 4: Rotate Refresh Tokens**

```javascript
// backend/controllers/authController.js
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Blacklist old refresh token
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    await redisClient.setex(`blacklist:${refreshToken}`, ttl, '1');

    // Generate new tokens
    const user = await User.findById(decoded.userId);
    const newAuthToken = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();

    res.json({
      success: true,
      data: {
        authToken: newAuthToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    res.status(401).json({ success: false });
  }
};
```

**Step 5: Update Frontend Logout**

```javascript
// src/context/AuthContext.js
const logout = async () => {
  try {
    // Call logout endpoint to blacklist token
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
  } catch (error) {
    logger.error('Logout error:', error);
  } finally {
    // Clear local data
    setCurrentUser(null);
    setAuthToken(null);
    await AsyncStorage.removeItem('currentUser');
    await AsyncStorage.removeItem('authToken');
  }
};
```

**Testing:**

- [ ] Unit tests for blacklist logic
- [ ] Integration tests for logout flow
- [ ] E2E tests for token revocation
- [ ] Performance tests (Redis lookup overhead)

**Timeline:** 1 week

---

### 3. GDPR DATA EXPORT NOT IMPLEMENTED

**Severity:** 🔴 CRITICAL  
**Impact:** Legal violation - users can't export their data  
**Effort:** Medium (1 week)  
**Risk:** Legal action, fines

#### Current State

- No data export functionality
- Users can't access their data in portable format
- No GDPR compliance

#### Required Implementation

**Step 1: Create Data Export Endpoint**

```javascript
// backend/routes/user.js
router.get('/export', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all user data
    const user = await User.findById(userId);
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });
    const swipes = await Swipe.find({
      $or: [{ swiperId: userId }, { swipedId: userId }],
    });
    const matches = await Swipe.find({
      $or: [{ swiperId: userId }, { swipedId: userId }],
      action: 'like',
    });

    // Create export object
    const exportData = {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
        bio: user.bio,
        photos: user.photos,
        interests: user.interests,
        location: user.location,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      messages: messages.map((m) => ({
        _id: m._id,
        matchId: m.matchId,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        isRead: m.isRead,
        createdAt: m.createdAt,
      })),
      swipes: swipes.map((s) => ({
        _id: s._id,
        swiperId: s.swiperId,
        swipedId: s.swipedId,
        action: s.action,
        createdAt: s.createdAt,
      })),
      matches: matches.map((m) => ({
        _id: m._id,
        user1: m.swiperId,
        user2: m.swipedId,
        matchedAt: m.createdAt,
      })),
    };

    // Return as JSON file
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=data-export.json');
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});
```

**Step 2: Add Export Request Tracking**

```javascript
// backend/models/User.js
dataExportRequests: [
  {
    requestedAt: { type: Date, default: Date.now },
    completedAt: Date,
    status: { type: String, enum: ['pending', 'completed', 'failed'] },
    downloadUrl: String,
  },
];
```

**Step 3: Create Scheduled Export Job**

```javascript
// backend/scripts/generateDataExports.js
const cron = require('node-cron');

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  const pendingRequests = await User.find({
    'dataExportRequests.status': 'pending',
  });

  for (const user of pendingRequests) {
    try {
      // Generate export
      const exportData = await generateUserExport(user._id);

      // Upload to S3
      const url = await uploadToS3(exportData, user._id);

      // Update request
      user.dataExportRequests[0].status = 'completed';
      user.dataExportRequests[0].downloadUrl = url;
      user.dataExportRequests[0].completedAt = new Date();
      await user.save();

      // Send email with download link
      await sendExportEmail(user.email, url);
    } catch (error) {
      logger.error('Export generation failed', { userId: user._id, error });
    }
  }
});
```

**Step 4: Update Frontend to Request Export**

```javascript
// src/screens/SettingsScreen.js
const requestDataExport = async () => {
  try {
    const response = await fetch(`${API_URL}/user/export-request`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      Alert.alert(
        'Export Requested',
        'You will receive an email with your data export within 24 hours'
      );
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to request export');
  }
};
```

**Testing:**

- [ ] Unit tests for export generation
- [ ] Integration tests for export endpoint
- [ ] E2E tests for export request flow
- [ ] Verify exported data completeness

**Timeline:** 1 week

---

### 4. CONSENT MANAGEMENT NOT IMPLEMENTED

**Severity:** 🔴 CRITICAL  
**Impact:** Legal violation - no consent tracking  
**Effort:** Medium (1 week)  
**Risk:** Legal action, fines

#### Current State

- No consent banner
- No consent tracking
- No privacy policy

#### Required Implementation

**Step 1: Add Consent Fields to User Model**

```javascript
// backend/models/User.js
privacySettings: {
  hasConsented: { type: Boolean, default: false },
  consentDate: Date,
  consentVersion: { type: String, default: '1.0' },
  consentHistory: [
    {
      timestamp: { type: Date, default: Date.now },
      action: String, // 'consent_given', 'consent_withdrawn'
      version: String,
      purposes: mongoose.Schema.Types.Mixed,
      ipAddress: String,
      userAgent: String
    }
  ],
  dataSharing: { type: Boolean, default: false },
  marketingEmails: { type: Boolean, default: false },
  analyticsTracking: { type: Boolean, default: true }
}
```

**Step 2: Create Consent Endpoint**

```javascript
// backend/routes/user.js
router.post('/consent', authenticate, async (req, res) => {
  try {
    const { dataSharing, marketingEmails, analyticsTracking } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);

    user.privacySettings.hasConsented = true;
    user.privacySettings.consentDate = new Date();
    user.privacySettings.consentVersion = '1.0';
    user.privacySettings.dataSharing = dataSharing;
    user.privacySettings.marketingEmails = marketingEmails;
    user.privacySettings.analyticsTracking = analyticsTracking;

    user.privacySettings.consentHistory.push({
      timestamp: new Date(),
      action: 'consent_given',
      version: '1.0',
      purposes: { dataSharing, marketingEmails, analyticsTracking },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    await user.save();

    res.json({ success: true, message: 'Consent recorded' });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});
```

**Step 3: Create Consent Banner Component**

```javascript
// src/components/ConsentBanner.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

export const ConsentBanner = ({ onConsent }) => {
  const [dataSharing, setDataSharing] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [analyticsTracking, setAnalyticsTracking] = useState(true);

  const handleConsent = async () => {
    await fetch(`${API_URL}/user/consent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        dataSharing,
        marketingEmails,
        analyticsTracking,
      }),
    });

    onConsent();
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Privacy & Consent</Text>

        <Text style={styles.description}>
          We respect your privacy. Please choose how you'd like us to use your data:
        </Text>

        <TouchableOpacity style={styles.checkbox} onPress={() => setDataSharing(!dataSharing)}>
          <Text>Share data with partners</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setMarketingEmails(!marketingEmails)}
        >
          <Text>Send marketing emails</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setAnalyticsTracking(!analyticsTracking)}
        >
          <Text>Analytics tracking</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleConsent}>
          <Text>Accept & Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
```

**Step 4: Show Consent Banner on First Login**

```javascript
// src/context/AuthContext.js
const login = async (email, password) => {
  // ... existing login code ...

  const user = data.data.user;

  // Check if user has given consent
  if (!user.privacySettings?.hasConsented) {
    // Show consent banner
    setShowConsentBanner(true);
  }
};
```

**Step 5: Create Privacy Policy Screen**

```javascript
// src/screens/PrivacyPolicyScreen.js
export const PrivacyPolicyScreen = () => {
  return (
    <ScrollView>
      <Text style={styles.title}>Privacy Policy</Text>

      <Text style={styles.section}>1. Data Collection</Text>
      <Text>We collect the following data...</Text>

      <Text style={styles.section}>2. Data Usage</Text>
      <Text>We use your data for...</Text>

      <Text style={styles.section}>3. Your Rights</Text>
      <Text>You have the right to...</Text>

      <Text style={styles.section}>4. Contact Us</Text>
      <Text>privacy@datingapp.com</Text>
    </ScrollView>
  );
};
```

**Testing:**

- [ ] Unit tests for consent logic
- [ ] Integration tests for consent endpoint
- [ ] E2E tests for consent flow
- [ ] Verify consent tracking

**Timeline:** 1 week

---

### 5. DATABASE CONNECTION POOL EXHAUSTION

**Severity:** 🔴 CRITICAL  
**Impact:** Operational risk - 50% of users get 503 errors under load  
**Effort:** Low (1 day)  
**Risk:** Service outage

#### Current State

- Pool size: 50 connections
- Expected concurrent users: 100+
- Result: 50% of requests fail

#### Required Implementation

**Step 1: Increase Connection Pool Size**

```javascript
// backend/config/database.js
const mongooseOptions = {
  maxPoolSize: 200, // Increase from 50 to 200
  minPoolSize: 50,
  maxIdleTimeMS: 45000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  waitQueueTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
};
```

**Step 2: Add Connection Pool Monitoring**

```javascript
// backend/middleware/metricsMiddleware.js
const monitorConnectionPool = () => {
  setInterval(() => {
    const client = mongoose.connection.getClient();
    const topology = client?.topology;

    if (topology?.description?.servers) {
      let totalConnections = 0;
      topology.description.servers.forEach((server) => {
        if (server.pool) {
          totalConnections += server.pool.totalConnectionCount || 0;
        }
      });

      // Log warning if pool usage > 80%
      const poolUsage = (totalConnections / 200) * 100;
      if (poolUsage > 80) {
        logger.warn('Connection pool usage high', { poolUsage });
        Sentry.captureMessage('Connection pool usage > 80%', 'warning');
      }
    }
  }, 60000); // Check every minute
};
```

**Step 3: Add Connection Pool Metrics**

```javascript
// backend/middleware/metricsMiddleware.js
app.get('/metrics/pool', (req, res) => {
  const client = mongoose.connection.getClient();
  const topology = client?.topology;

  let totalConnections = 0;
  if (topology?.description?.servers) {
    topology.description.servers.forEach((server) => {
      if (server.pool) {
        totalConnections += server.pool.totalConnectionCount || 0;
      }
    });
  }

  res.json({
    maxPoolSize: 200,
    totalConnections,
    availableConnections: 200 - totalConnections,
    poolUsage: ((totalConnections / 200) * 100).toFixed(2) + '%',
  });
});
```

**Step 4: Add Prometheus Metrics**

```javascript
// backend/services/MonitoringService.js
const poolSizeGauge = new prometheus.Gauge({
  name: 'mongodb_pool_size',
  help: 'MongoDB connection pool size',
  labelNames: ['status'],
});

const updatePoolMetrics = () => {
  const client = mongoose.connection.getClient();
  const topology = client?.topology;

  let totalConnections = 0;
  if (topology?.description?.servers) {
    topology.description.servers.forEach((server) => {
      if (server.pool) {
        totalConnections += server.pool.totalConnectionCount || 0;
      }
    });
  }

  poolSizeGauge.set({ status: 'total' }, totalConnections);
  poolSizeGauge.set({ status: 'available' }, 200 - totalConnections);
};
```

**Testing:**

- [ ] Load test with 200 concurrent users
- [ ] Verify no 503 errors
- [ ] Monitor pool usage
- [ ] Verify metrics are accurate

**Timeline:** 1 day

---

### 6. TOKENS STORED IN PLAINTEXT

**Severity:** 🔴 CRITICAL  
**Impact:** Security vulnerability - if device compromised, attacker has access  
**Effort:** Medium (1 week)  
**Risk:** Account takeover

#### Current State

- JWT tokens stored in AsyncStorage/localStorage without encryption
- If device compromised, attacker has permanent access

#### Required Implementation

**Step 1: Implement Secure Storage**

```bash
npm install --save react-native-keychain
```

**Step 2: Create Secure Storage Service**

```javascript
// src/services/SecureStorageService.js
import * as Keychain from 'react-native-keychain';
import { Platform } from 'react-native';

export class SecureStorageService {
  static async setToken(key, value) {
    try {
      if (Platform.OS === 'web') {
        // Web: Use encrypted localStorage
        const encrypted = await this.encryptData(value);
        localStorage.setItem(key, encrypted);
      } else {
        // Mobile: Use Keychain
        await Keychain.setGenericPassword(key, value, {
          service: key,
          storage: Keychain.STORAGE_TYPE.KC_ACCESSIBLE_WHEN_UNLOCKED,
        });
      }
    } catch (error) {
      logger.error('Failed to store token securely', error);
      throw error;
    }
  }

  static async getToken(key) {
    try {
      if (Platform.OS === 'web') {
        // Web: Decrypt from localStorage
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;
        return await this.decryptData(encrypted);
      } else {
        // Mobile: Get from Keychain
        const credentials = await Keychain.getGenericPassword({
          service: key,
        });
        return credentials ? credentials.password : null;
      }
    } catch (error) {
      logger.error('Failed to retrieve token', error);
      return null;
    }
  }

  static async removeToken(key) {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await Keychain.resetGenericPassword({ service: key });
      }
    } catch (error) {
      logger.error('Failed to remove token', error);
    }
  }

  static async encryptData(data) {
    // Use TweetNaCl for encryption
    const sodium = require('libsodium.js');
    const key = await this.getDerivedKey();
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const encrypted = sodium.crypto_secretbox(Buffer.from(data), nonce, key);
    return JSON.stringify({
      encrypted: Buffer.from(encrypted).toString('base64'),
      nonce: Buffer.from(nonce).toString('base64'),
    });
  }

  static async decryptData(encryptedData) {
    const sodium = require('libsodium.js');
    const { encrypted, nonce } = JSON.parse(encryptedData);
    const key = await this.getDerivedKey();
    const decrypted = sodium.crypto_secretbox_open(
      Buffer.from(encrypted, 'base64'),
      Buffer.from(nonce, 'base64'),
      key
    );
    return Buffer.from(decrypted).toString('utf-8');
  }

  static async getDerivedKey() {
    // Derive key from device ID or similar
    // This ensures different devices have different encryption keys
    const deviceId = await getDeviceId();
    const sodium = require('libsodium.js');
    return sodium.crypto_pwhash(
      sodium.crypto_secretbox_KEYBYTES,
      deviceId,
      sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES),
      sodium.crypto_pwhash_OPSLIMIT_MODERATE,
      sodium.crypto_pwhash_MEMLIMIT_MODERATE,
      sodium.crypto_pwhash_ALG_DEFAULT
    );
  }
}
```

**Step 3: Update AuthContext to Use Secure Storage**

```javascript
// src/context/AuthContext.js
import { SecureStorageService } from '../services/SecureStorageService';

const saveUserSession = async (user, token, refToken) => {
  setCurrentUser(user);
  setAuthToken(token);
  setRefreshToken(refToken);

  // Use secure storage instead of AsyncStorage
  await SecureStorageService.setToken('authToken', token);
  if (refToken) {
    await SecureStorageService.setToken('refreshToken', refToken);
  }

  // Store user data in regular storage (not sensitive)
  await AsyncStorage.setItem('currentUser', JSON.stringify(user));
};

const loadUser = async () => {
  try {
    const storedUser = await AsyncStorage.getItem('currentUser');
    const storedAuthToken = await SecureStorageService.getToken('authToken');
    const storedRefreshToken = await SecureStorageService.getToken('refreshToken');

    if (storedUser && storedAuthToken) {
      setCurrentUser(JSON.parse(storedUser));
      setAuthToken(storedAuthToken);
      setRefreshToken(storedRefreshToken);
      api.setAuthToken(storedAuthToken);
    }
  } catch (error) {
    logger.error('Error loading user from storage:', error);
  } finally {
    setLoading(false);
  }
};

const logout = async () => {
  setCurrentUser(null);
  setAuthToken(null);
  setRefreshToken(null);

  api.clearAuthToken();

  await SecureStorageService.removeToken('authToken');
  await SecureStorageService.removeToken('refreshToken');
  await AsyncStorage.removeItem('currentUser');
};
```

**Testing:**

- [ ] Unit tests for secure storage
- [ ] Integration tests for token storage/retrieval
- [ ] E2E tests for login/logout flow
- [ ] Verify tokens are encrypted

**Timeline:** 1 week

---

### 7. NO HTTPS ENFORCEMENT

**Severity:** 🔴 CRITICAL  
**Impact:** Security vulnerability - man-in-the-middle attacks  
**Effort:** Low (1 day)  
**Risk:** Data interception

#### Current State

- API may accept HTTP requests
- No HTTPS enforcement
- Vulnerable to MITM attacks

#### Required Implementation

**Step 1: Add HTTPS Redirect Middleware**

```javascript
// backend/middleware/httpsRedirect.js
const httpsRedirect = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
  }
  next();
};

module.exports = httpsRedirect;
```

**Step 2: Add HTTPS Redirect to Server**

```javascript
// backend/server.js
const httpsRedirect = require('./middleware/httpsRedirect');
app.use(httpsRedirect);
```

**Step 3: Add HSTS Header**

```javascript
// backend/server.js
app.use(
  helmet.hsts({
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  })
);
```

**Step 4: Configure Frontend to Use HTTPS**

```javascript
// src/config/api.js
const getApiUrl = () => {
  const apiUrl = getConfigApiUrl() || getEnvApiUrl() || getDefaultApiUrl();

  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production' && apiUrl.startsWith('http://')) {
    return apiUrl.replace('http://', 'https://');
  }

  return apiUrl;
};
```

**Step 5: Configure Render for HTTPS**

```yaml
# render.yaml
services:
  - type: web
    name: dating-app-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: FORCE_HTTPS
        value: true
```

**Testing:**

- [ ] Verify HTTP requests redirect to HTTPS
- [ ] Verify HSTS header is present
- [ ] Test with curl: `curl -I https://api.example.com`
- [ ] Verify no mixed content warnings

**Timeline:** 1 day

---

### 8. EMAIL SERVICE DEPENDENCY

**Severity:** 🔴 CRITICAL  
**Impact:** Operational risk - users can't verify email or reset password  
**Effort:** Low (1 day)  
**Risk:** User onboarding failure

#### Current State

- Email sending fails silently if credentials missing
- No indication to user that email failed
- Users can't verify email or reset password

#### Required Implementation

**Step 1: Add Email Service Status Check**

```javascript
// backend/services/EmailService.js
class EmailService {
  static isConfigured() {
    return !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
  }

  static async sendEmail(to, subject, html) {
    if (!this.isConfigured()) {
      logger.error('Email service not configured', { to, subject });
      throw new Error('Email service not configured');
    }

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      logger.error('Email sending failed', { to, subject, error });
      throw error;
    }
  }
}
```

**Step 2: Update Register Endpoint to Handle Email Failure**

```javascript
// backend/controllers/authController.js
exports.register = async (req, res) => {
  try {
    // ... existing registration code ...

    // Send verification email
    const emailSent = await emailService.sendEmail(
      user.email,
      'Email Verification',
      `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`
    );

    if (!emailSent) {
      logger.warn('Email verification not sent', { userId: user._id });
      // Still return success but notify user
      return sendSuccess(res, 201, {
        message: 'User registered. Email verification not available - please contact support.',
        data: { user, authToken, refreshToken },
        warning: 'EMAIL_NOT_CONFIGURED',
      });
    }

    return sendSuccess(res, 201, {
      message: 'User registered successfully. Please verify your email.',
      data: { user, authToken, refreshToken },
    });
  } catch (error) {
    // ... error handling ...
  }
};
```

**Step 3: Add Email Status Endpoint**

```javascript
// backend/routes/auth.js
router.get('/email-status', (req, res) => {
  const isConfigured = EmailService.isConfigured();
  res.json({
    success: true,
    data: {
      emailConfigured: isConfigured,
      message: isConfigured ? 'Email service is configured' : 'Email service not configured',
    },
  });
});
```

**Step 4: Update Frontend to Check Email Status**

```javascript
// src/screens/SignupScreen.js
useEffect(() => {
  const checkEmailStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/email-status`);
      const data = await response.json();

      if (!data.data.emailConfigured) {
        Alert.alert(
          'Email Service Unavailable',
          'Email verification is not available. Please contact support.'
        );
      }
    } catch (error) {
      logger.error('Failed to check email status', error);
    }
  };

  checkEmailStatus();
}, []);
```

**Step 5: Add Fallback Notification Method**

```javascript
// backend/services/NotificationService.js
class NotificationService {
  static async notifyEmailVerification(user, verificationUrl) {
    // Try email first
    try {
      await EmailService.sendEmail(
        user.email,
        'Email Verification',
        `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`
      );
      return;
    } catch (error) {
      logger.warn('Email failed, trying SMS', { userId: user._id });
    }

    // Fallback to SMS if available
    if (user.phoneNumber) {
      try {
        await SMSService.sendSMS(user.phoneNumber, `Verify your email: ${verificationUrl}`);
        return;
      } catch (error) {
        logger.warn('SMS also failed', { userId: user._id });
      }
    }

    // Last resort: in-app notification
    logger.warn('All notification methods failed', { userId: user._id });
    throw new Error('Unable to send verification notification');
  }
}
```

**Testing:**

- [ ] Test with email configured
- [ ] Test with email not configured
- [ ] Verify error messages are user-friendly
- [ ] Verify fallback notifications work

**Timeline:** 1 day

---

## HIGH PRIORITY ISSUES (Should Fix Before Launch)

### 1. Token Expiration on App Restart

**Severity:** 🟠 HIGH  
**Impact:** User sees stale data, then 401 error  
**Effort:** Low (1 day)

**Fix:**

```javascript
// src/context/AuthContext.js
const loadUser = async () => {
  try {
    const storedAuthToken = await SecureStorageService.getToken('authToken');

    if (storedAuthToken) {
      // Decode JWT and check expiry
      const decoded = jwt.decode(storedAuthToken);
      const now = Math.floor(Date.now() / 1000);

      if (decoded.exp < now) {
        // Token expired, try to refresh
        const refreshToken = await SecureStorageService.getToken('refreshToken');
        if (refreshToken) {
          const newToken = await api.refreshAuthToken();
          if (newToken) {
            setAuthToken(newToken);
            api.setAuthToken(newToken);
          } else {
            // Refresh failed, clear session
            await logout();
          }
        } else {
          // No refresh token, clear session
          await logout();
        }
      } else {
        // Token still valid
        setAuthToken(storedAuthToken);
        api.setAuthToken(storedAuthToken);
      }
    }
  } catch (error) {
    logger.error('Error loading user from storage:', error);
  } finally {
    setLoading(false);
  }
};
```

---

### 2. WebSocket Cleanup on Logout

**Severity:** 🟠 HIGH  
**Impact:** User still receives updates after logout  
**Effort:** Low (1 day)

**Fix:**

```javascript
// src/contexts/SocketContext.js
const logout = async () => {
  // Disconnect socket
  if (socket) {
    socket.disconnect();
    setSocket(null);
  }

  // Clear auth
  await AuthContext.logout();
};
```

---

### 3. Duplicate Swipe Prevention

**Severity:** 🟠 HIGH  
**Impact:** Data inconsistency  
**Effort:** Low (1 day)

**Fix:**

```javascript
// backend/models/Swipe.js
swipeSchema.index({ swiperId: 1, swipedId: 1 }, { unique: true });
```

---

### 4. Swipe Limit Enforcement

**Severity:** 🟠 HIGH  
**Impact:** Revenue loss  
**Effort:** Low (1 day)

**Fix:**

```javascript
// backend/controllers/swipeController.js
exports.createSwipe = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Check daily swipe limit for free users
    if (!user.isPremium) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const swipesToday = await Swipe.countDocuments({
        swiperId: userId,
        createdAt: { $gte: today },
      });

      if (swipesToday >= 50) {
        // 50 swipes per day for free users
        return res.status(429).json({
          success: false,
          message: 'Daily swipe limit reached. Upgrade to premium for unlimited swipes.',
          remaining: 0,
        });
      }
    }

    // ... rest of swipe creation ...
  } catch (error) {
    // ... error handling ...
  }
};
```

---

### 5. Rate Limiting on Auth Endpoints

**Severity:** 🟠 HIGH  
**Impact:** Account takeover via brute force  
**Effort:** Low (1 day)

**Fix:**

```javascript
// backend/middleware/authRateLimiter.js
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for successful requests
    return req.method === 'GET';
  },
});

module.exports = authLimiter;
```

```javascript
// backend/routes/auth.js
const authLimiter = require('../middleware/authRateLimiter');

router.post('/login', authLimiter, login);
router.post('/register', authLimiter, register);
router.post('/forgot-password', authLimiter, forgotPassword);
```

---

### 6. CORS Too Permissive

**Severity:** 🟠 HIGH  
**Impact:** Attacker can deploy malicious preview  
**Effort:** Low (1 day)

**Fix:**

```javascript
// backend/server.js
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://dating-app-seven-peach.vercel.app',
  // Only allow specific preview URLs, not all *.vercel.app
  'https://dating-app-pr-123.vercel.app',
  'https://dating-app-pr-124.vercel.app',
  // Don't use regex for all Vercel deployments
].filter(Boolean);
```

---

## SUMMARY TABLE

| Issue                      | Severity | Effort | Timeline  | Status  |
| -------------------------- | -------- | ------ | --------- | ------- |
| Message Encryption         | CRITICAL | High   | 2-3 weeks | ❌ TODO |
| Token Blacklist            | CRITICAL | Medium | 1 week    | ❌ TODO |
| GDPR Data Export           | CRITICAL | Medium | 1 week    | ❌ TODO |
| Consent Management         | CRITICAL | Medium | 1 week    | ❌ TODO |
| Connection Pool            | CRITICAL | Low    | 1 day     | ❌ TODO |
| Secure Token Storage       | CRITICAL | Medium | 1 week    | ❌ TODO |
| HTTPS Enforcement          | CRITICAL | Low    | 1 day     | ❌ TODO |
| Email Error Handling       | CRITICAL | Low    | 1 day     | ❌ TODO |
| Token Expiration Check     | HIGH     | Low    | 1 day     | ❌ TODO |
| WebSocket Cleanup          | HIGH     | Low    | 1 day     | ❌ TODO |
| Duplicate Swipe Prevention | HIGH     | Low    | 1 day     | ❌ TODO |
| Swipe Limit Enforcement    | HIGH     | Low    | 1 day     | ❌ TODO |
| Auth Rate Limiting         | HIGH     | Low    | 1 day     | ❌ TODO |
| CORS Whitelist             | HIGH     | Low    | 1 day     | ❌ TODO |

**Total Effort:** ~8-10 weeks  
**Critical Path:** Message Encryption (2-3 weeks)  
**Recommended Timeline:** 4-6 weeks with parallel work

---

**Next Steps:**

1. Prioritize critical blockers
2. Assign team members to each issue
3. Create GitHub issues for tracking
4. Set up CI/CD for automated testing
5. Schedule weekly progress reviews
6. Plan rollout strategy
