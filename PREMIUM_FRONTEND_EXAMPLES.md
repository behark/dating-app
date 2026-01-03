# Premium Features - Frontend Implementation Examples

## Component Examples for React Native / React Web

### 1. Premium Status Indicator Component

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Badge } from 'react-native';
import { PremiumService } from '../services/PremiumService';

export const PremiumStatusBadge = ({ userId, token }) => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const premiumStatus = await PremiumService.checkPremiumStatus(userId, token);
    setStatus(premiumStatus);
  };

  if (!status?.isPremium) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {status.planType === 'trial' ? '🎁 Trial' : '👑 Premium'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
});
```

### 2. Unlimited Swipes UI

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ProgressBar } from 'react-native';

export const SwipeCounter = ({ token }) => {
  const [swipeData, setSwipeData] = useState(null);

  useEffect(() => {
    loadSwipeCount();
    // Refresh every 30 seconds
    const interval = setInterval(loadSwipeCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSwipeCount = async () => {
    const response = await fetch(
      'http://localhost:3000/api/swipes/count',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    setSwipeData(data.data);
  };

  if (!swipeData) return null;

  const isPremium = swipeData.isPremium;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isPremium ? '♾️ Unlimited Swipes' : 'Daily Swipes'}
      </Text>
      {!isPremium ? (
        <>
          <ProgressBar
            progress={swipeData.used / swipeData.limit}
            color="#667eea"
            style={styles.progressBar}
          />
          <Text style={styles.text}>
            {swipeData.remaining} swipes remaining today
          </Text>
        </>
      ) : (
        <Text style={styles.text}>Swipe away! No limits today.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 16 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  progressBar: { height: 8, marginBottom: 8 },
  text: { fontSize: 14, color: '#666' },
});
```

### 3. See Who Liked You Screen

```javascript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { PremiumService } from '../services/PremiumService';
import { useAuth } from '../context/AuthContext';

export const SeeWhoLikedYouScreen = ({ navigation }) => {
  const { currentUser, token } = useAuth();
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    loadLikes();
  }, []);

  const loadLikes = async () => {
    setLoading(true);
    try {
      // Check premium status first
      const status = await PremiumService.checkPremiumStatus(currentUser.uid, token);
      setIsPremium(status.isPremium && status.features.seeWhoLikedYou);

      if (!status.features.seeWhoLikedYou) {
        return;
      }

      const data = await PremiumService.getReceivedLikes(currentUser.uid, token);
      setLikes(data.likes || []);
    } catch (error) {
      console.error('Error loading likes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>See Who Liked You</Text>
        <View style={styles.premiumRequired}>
          <Text style={styles.premiumText}>Premium Feature Required</Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('Premium')}
          >
            <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (likes.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>See Who Liked You</Text>
        <Text style={styles.emptyText}>No likes yet. Keep swiping!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Who Liked You</Text>
      <Text style={styles.subtitle}>{likes.length} people liked you</Text>
      <ScrollView>
        {likes.map((like) => (
          <TouchableOpacity
            key={like._id}
            style={styles.likeCard}
            onPress={() =>
              navigation.navigate('ProfileDetail', { userId: like.user._id })
            }
          >
            <Image
              source={{ uri: like.user.photos?.[0]?.url }}
              style={styles.photo}
            />
            <View style={styles.info}>
              <Text style={styles.name}>
                {like.user.name}, {like.user.age}
              </Text>
              <Text style={styles.action}>
                {like.action === 'superlike' ? '💗 Super Liked' : '❤️ Liked'}
              </Text>
              <Text style={styles.time}>
                {new Date(like.receivedAt).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  premiumRequired: { alignItems: 'center', marginTop: 32 },
  premiumText: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  upgradeButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  upgradeButtonText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 32 },
  likeCard: { flexDirection: 'row', marginBottom: 12, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 12 },
  photo: { width: 80, height: 80, borderRadius: 40, marginRight: 12 },
  info: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: 'bold' },
  action: { fontSize: 14, color: '#667eea', marginTop: 4 },
  time: { fontSize: 12, color: '#999', marginTop: 4 },
});
```

### 4. Passport (Location Override)

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  TextInput,
  StyleSheet,
} from 'react-native';
import { PremiumService } from '../services/PremiumService';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';

export const PassportScreen = () => {
  const { currentUser, token } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPassportStatus();
  }, []);

  const loadPassportStatus = async () => {
    const status = await PremiumService.getPassportStatus(currentUser.uid, token);
    setEnabled(status.enabled || false);
    if (status.currentLocation) {
      setCity(status.currentLocation.city || '');
      setCountry(status.currentLocation.country || '');
    }
  };

  const handleToggle = async (value) => {
    if (!value) {
      await PremiumService.disablePassport(currentUser.uid, token);
      setEnabled(false);
      return;
    }

    if (!city || !country) {
      alert('Please enter city and country');
      return;
    }

    setLoading(true);
    try {
      // Use geocoding to get coordinates
      const location = await Location.geocodeAsync(`${city}, ${country}`);
      if (location.length === 0) {
        alert('Location not found');
        return;
      }

      const { latitude, longitude } = location[0];
      const result = await PremiumService.setPassportLocation(
        longitude,
        latitude,
        city,
        country,
        token
      );

      if (result.success) {
        setEnabled(true);
        alert('Passport activated!');
      }
    } catch (error) {
      alert('Error setting location: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Passport</Text>
      <Text style={styles.subtitle}>
        Temporarily change your location to match with people anywhere
      </Text>

      <View style={styles.toggleContainer}>
        <Text style={styles.label}>Enable Passport</Text>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          disabled={loading}
        />
      </View>

      {enabled && (
        <View style={styles.details}>
          <Text style={styles.currentLocation}>
            Current Location: {city}, {country}
          </Text>
          <TouchableOpacity
            style={styles.changeButton}
            onPress={() => setEnabled(false)}
          >
            <Text style={styles.changeButtonText}>Change Location</Text>
          </TouchableOpacity>
        </View>
      )}

      {!enabled && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="City"
            value={city}
            onChangeText={setCity}
          />
          <TextInput
            style={styles.input}
            placeholder="Country"
            value={country}
            onChangeText={setCountry}
          />
          <TouchableOpacity
            style={styles.activateButton}
            onPress={() => handleToggle(true)}
            disabled={loading}
          >
            <Text style={styles.activateButtonText}>
              {loading ? 'Setting up...' : 'Activate'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  toggleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  label: { fontSize: 16, fontWeight: 'bold' },
  details: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, marginBottom: 16 },
  currentLocation: { fontSize: 14, marginBottom: 12 },
  changeButton: { backgroundColor: '#667eea', padding: 10, borderRadius: 6 },
  changeButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  form: { marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  activateButton: { backgroundColor: '#667eea', padding: 12, borderRadius: 8 },
  activateButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});
```

### 5. Priority Like Button

```javascript
import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Text, Alert } from 'react-native';
import { PremiumService } from '../services/PremiumService';
import { useAuth } from '../context/AuthContext';

export const PriorityLikeButton = ({ targetUserId, onSuccess }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePriorityLike = async () => {
    setLoading(true);
    try {
      const result = await PremiumService.sendPriorityLike(targetUserId, token);
      if (result.success) {
        Alert.alert('Success', 'Priority like sent!');
        onSuccess?.();
      } else {
        Alert.alert('Error', result.message || 'Failed to send priority like');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePriorityLike}
      disabled={loading}
    >
      <Text style={styles.text}>
        {loading ? '...' : '⭐ Priority Like'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  text: {
    fontWeight: 'bold',
    color: '#333',
  },
});
```

### 6. Boost Analytics Dashboard

```javascript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { PremiumService } from '../services/PremiumService';
import { useAuth } from '../context/AuthContext';

export const BoostAnalyticsScreen = () => {
  const { currentUser, token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await PremiumService.getBoostAnalytics(currentUser.uid, token);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>No analytics data available</Text>
      </View>
    );
  }

  const chartData = {
    labels: analytics.boostHistory.map((_, i) => `Boost ${i + 1}`).slice(-7),
    datasets: [
      {
        data: analytics.boostHistory.map((b) => b.viewsGained).slice(-7),
      },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Boost Analytics</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{analytics.totalBoosts}</Text>
          <Text style={styles.statLabel}>Total Boosts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{analytics.totalProfileViews}</Text>
          <Text style={styles.statLabel}>Profile Views</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {analytics.totalLikesReceivedDuringBoosts}
          </Text>
          <Text style={styles.statLabel}>Likes Received</Text>
        </View>
      </View>

      <View style={styles.averageContainer}>
        <Text style={styles.averageTitle}>Average Performance</Text>
        <View style={styles.averageRow}>
          <Text style={styles.averageLabel}>Avg Views per Boost:</Text>
          <Text style={styles.averageValue}>
            {analytics.averageViewsPerBoost}
          </Text>
        </View>
        <View style={styles.averageRow}>
          <Text style={styles.averageLabel}>Avg Likes per Boost:</Text>
          <Text style={styles.averageValue}>
            {analytics.averageLikesPerBoost}
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={350}
          height={220}
          yAxisLabel=""
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
          }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '30%',
  },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#667eea' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  averageContainer: { backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 24 },
  averageTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  averageRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  averageLabel: { fontSize: 14, color: '#666' },
  averageValue: { fontSize: 14, fontWeight: 'bold', color: '#667eea' },
  chartContainer: { alignItems: 'center', marginBottom: 24 },
  error: { fontSize: 16, textAlign: 'center', color: '#999' },
});
```

---

## Integration Tips

1. **Use PremiumService** for all API calls
2. **Always check token validity** before making requests
3. **Handle 403 Forbidden** responses - indicate user needs premium
4. **Cache subscription status** to reduce API calls
5. **Refresh status** when user returns to app (in useEffect)
6. **Graceful degradation** - hide premium UI for non-premium users
7. **Loading states** - show spinners during API calls
8. **Error handling** - user-friendly error messages

---

## Authentication
All service methods expect `token` parameter (JWT from auth context).

Add to your Auth context:
```javascript
const token = await currentUser.getIdToken();
```
