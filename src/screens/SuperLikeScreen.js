import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

const SuperLikeScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const { user, authToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState(null);
  const [message, setMessage] = useState('');
  const [showMessageInput, setShowMessageInput] = useState(false);

  useEffect(() => {
    fetchQuota();
  }, []);

  const fetchQuota = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/interactions/super-like-quota`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (data.success) {
        setQuota(data.data);
      }
    } catch (error) {
      console.error('Error fetching quota:', error);
    }
  };

  const handleSuperLike = async () => {
    if (!user?.isPremium && quota?.remaining === 0) {
      Alert.alert('Limit Reached', 'You have used your daily super likes. Upgrade to premium for unlimited!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/interactions/super-like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          recipientId: userId,
          message: message || null
        })
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', data.message, [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]);

        if (data.data.isMatch) {
          setTimeout(() => {
            navigation.navigate('MatchAnimation', { matchedUser: data.data });
          }, 500);
        }
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send super like');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Send Super Like</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="star" size={40} color="#FFD700" style={styles.starIcon} />
          <Text style={styles.infoTitle}>Stand Out!</Text>
          <Text style={styles.infoText}>
            Super likes let them know you're extra interested. You get {user?.isPremium ? 'unlimited' : '5'} per day.
          </Text>
        </View>

        {/* Quota Info */}
        <View style={styles.quotaCard}>
          <View style={styles.quotaRow}>
            <Text style={styles.quotaLabel}>Remaining Today:</Text>
            <Text style={styles.quotaValue}>
              {user?.isPremium ? 'Unlimited' : `${quota?.remaining || 0}/5`}
            </Text>
          </View>
          {user?.isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="crown" size={16} color="#FFD700" />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
        </View>

        {/* Message Input */}
        <View style={styles.messageSection}>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowMessageInput(!showMessageInput)}
          >
            <Ionicons
              name={showMessageInput ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#667eea"
            />
            <Text style={styles.toggleText}>Add a Message (Optional)</Text>
          </TouchableOpacity>

          {showMessageInput && (
            <View style={styles.messageInput}>
              <TextInput
                style={styles.input}
                placeholder="Share why you're interested..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                maxLength={300}
                value={message}
                onChangeText={setMessage}
              />
              <Text style={styles.charCount}>{message.length}/300</Text>
            </View>
          )}
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Why Super Like?</Text>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.benefitText}>They'll know you really like them</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.benefitText}>2x more likely to match</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.benefitText}>Appears at the top of their likes</Text>
          </View>
        </View>
      </ScrollView>

      {/* Send Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.sendButton,
            loading && { opacity: 0.7 }
          ]}
          onPress={handleSuperLike}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="star" size={24} color="#fff" />
              <Text style={styles.sendButtonText}>Send Super Like</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 16,
    marginVertical: 20,
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderRadius: 16,
    alignItems: 'center',
  },
  starIcon: {
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  quotaCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quotaLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quotaValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  premiumText: {
    color: '#FFD700',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  toggleText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  messageInput: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    fontSize: 14,
    color: '#333',
    maxHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
  },
  benefitsSection: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 13,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendButton: {
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  sendButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default SuperLikeScreen;
