import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { SocialMediaService } from '../services/SocialMediaService';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;

export default function SocialMediaConnectionScreen() {
  const [loading, setLoading] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState({
    spotify: null,
    instagram: null,
  });
  const [loadingConnection, setLoadingConnection] = useState({
    spotify: false,
    instagram: false,
  });

  useEffect(() => {
    // Load connected accounts on screen mount
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    // This would fetch the user's connected accounts
    // For now, we'll initialize as empty
    setConnectedAccounts({
      spotify: null,
      instagram: null,
    });
  };

  const connectSpotify = async () => {
    try {
      setLoadingConnection({ ...loadingConnection, spotify: true });

      // In a real app, you'd use Spotify OAuth flow
      // This is a simplified version
      Alert.prompt('Connect Spotify', 'Enter your Spotify username', [
        {
          text: 'Cancel',
          onPress: () => setLoadingConnection({ ...loadingConnection, spotify: false }),
          style: 'cancel',
        },
        {
          text: 'Connect',
          onPress: async (username) => {
            try {
              await SocialMediaService.connectSpotify({
                username,
                profileUrl: `https://open.spotify.com/user/${username}`,
              });

              setConnectedAccounts({
                ...connectedAccounts,
                spotify: { username, isVerified: false },
              });

              Alert.alert('Success', 'Spotify account connected');
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setLoadingConnection({ ...loadingConnection, spotify: false });
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
      setLoadingConnection({ ...loadingConnection, spotify: false });
    }
  };

  const connectInstagram = async () => {
    try {
      setLoadingConnection({ ...loadingConnection, instagram: true });

      // In a real app, you'd use Instagram OAuth flow
      // This is a simplified version
      Alert.prompt('Connect Instagram', 'Enter your Instagram username', [
        {
          text: 'Cancel',
          onPress: () => setLoadingConnection({ ...loadingConnection, instagram: false }),
          style: 'cancel',
        },
        {
          text: 'Connect',
          onPress: async (username) => {
            try {
              await SocialMediaService.connectInstagram({
                username,
                profileUrl: `https://instagram.com/${username}`,
              });

              setConnectedAccounts({
                ...connectedAccounts,
                instagram: { username, isVerified: false },
              });

              Alert.alert('Success', 'Instagram account connected');
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setLoadingConnection({ ...loadingConnection, instagram: false });
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
      setLoadingConnection({ ...loadingConnection, instagram: false });
    }
  };

  const disconnectSpotify = async () => {
    Alert.alert(
      'Disconnect Spotify?',
      'Are you sure you want to disconnect your Spotify account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoadingConnection({ ...loadingConnection, spotify: true });
              await SocialMediaService.disconnectSpotify();
              setConnectedAccounts({ ...connectedAccounts, spotify: null });
              Alert.alert('Success', 'Spotify account disconnected');
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setLoadingConnection({ ...loadingConnection, spotify: false });
            }
          },
        },
      ]
    );
  };

  const disconnectInstagram = async () => {
    Alert.alert(
      'Disconnect Instagram?',
      'Are you sure you want to disconnect your Instagram account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoadingConnection({ ...loadingConnection, instagram: true });
              await SocialMediaService.disconnectInstagram();
              setConnectedAccounts({ ...connectedAccounts, instagram: null });
              Alert.alert('Success', 'Instagram account disconnected');
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setLoadingConnection({ ...loadingConnection, instagram: false });
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Social Media Connections</Text>
        <Text style={styles.headerSubtitle}>
          Connect your social media accounts to enhance your profile
        </Text>
      </View>

      {/* Spotify Section */}
      <View style={styles.section}>
        <View style={styles.socialMediaCard}>
          <View style={styles.cardHeader}>
            <View style={styles.platformInfo}>
              <Text style={styles.platformEmoji}>🎵</Text>
              <View>
                <Text style={styles.platformName}>Spotify</Text>
                <Text style={styles.platformDescription}>Share your music taste</Text>
              </View>
            </View>
            {connectedAccounts.spotify ? (
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedText}>✓ Connected</Text>
              </View>
            ) : (
              <View style={styles.disconnectedBadge}>
                <Text style={styles.disconnectedText}>Not Connected</Text>
              </View>
            )}
          </View>

          {connectedAccounts.spotify && (
            <View style={styles.accountInfo}>
              <Text style={styles.accountUsername}>@{connectedAccounts.spotify.username}</Text>
              {connectedAccounts.spotify.isVerified && (
                <Text style={styles.verifiedBadge}>✓ Verified</Text>
              )}
            </View>
          )}

          {connectedAccounts.spotify ? (
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={disconnectSpotify}
              disabled={loadingConnection.spotify}
            >
              {loadingConnection.spotify ? (
                <ActivityIndicator size="small" color="#d32f2f" />
              ) : (
                <Text style={styles.disconnectButtonText}>Disconnect</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.connectButton}
              onPress={connectSpotify}
              disabled={loadingConnection.spotify}
            >
              {loadingConnection.spotify ? (
                <ActivityIndicator size="small" color={Colors.background.white} />
              ) : (
                <Text style={styles.connectButtonText}>Connect Spotify</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Instagram Section */}
      <View style={styles.section}>
        <View style={styles.socialMediaCard}>
          <View style={styles.cardHeader}>
            <View style={styles.platformInfo}>
              <Text style={styles.platformEmoji}>📸</Text>
              <View>
                <Text style={styles.platformName}>Instagram</Text>
                <Text style={styles.platformDescription}>Show your best photos</Text>
              </View>
            </View>
            {connectedAccounts.instagram ? (
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedText}>✓ Connected</Text>
              </View>
            ) : (
              <View style={styles.disconnectedBadge}>
                <Text style={styles.disconnectedText}>Not Connected</Text>
              </View>
            )}
          </View>

          {connectedAccounts.instagram && (
            <View style={styles.accountInfo}>
              <Text style={styles.accountUsername}>@{connectedAccounts.instagram.username}</Text>
              {connectedAccounts.instagram.isVerified && (
                <Text style={styles.verifiedBadge}>✓ Verified</Text>
              )}
            </View>
          )}

          {connectedAccounts.instagram ? (
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={disconnectInstagram}
              disabled={loadingConnection.instagram}
            >
              {loadingConnection.instagram ? (
                <ActivityIndicator size="small" color="#d32f2f" />
              ) : (
                <Text style={styles.disconnectButtonText}>Disconnect</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.connectButton}
              onPress={connectInstagram}
              disabled={loadingConnection.instagram}
            >
              {loadingConnection.instagram ? (
                <ActivityIndicator size="small" color={Colors.background.white} />
              ) : (
                <Text style={styles.connectButtonText}>Connect Instagram</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Privacy Notice */}
      <View style={styles.privacyNotice}>
        <Text style={styles.privacyTitle}>🔒 Your Privacy</Text>
        <Text style={styles.privacyText}>
          Only verified social accounts are visible on your profile. We never post on your behalf.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.lighter,
  },
  header: {
    backgroundColor: Colors.background.white,
    padding: 16,
    borderBottomColor: Colors.text.lighter,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  socialMediaCard: {
    backgroundColor: Colors.background.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderColor: Colors.text.lighter,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  platformEmoji: {
    fontSize: 28,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  platformDescription: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  connectedBadge: {
    backgroundColor: Colors.status.successLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  connectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.status.successDark,
  },
  disconnectedBadge: {
    backgroundColor: Colors.background.lighter,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  disconnectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.tertiary,
  },
  accountInfo: {
    marginVertical: 12,
    paddingVertical: 12,
    borderTopColor: Colors.background.light,
    borderTopWidth: 1,
    borderBottomColor: Colors.background.light,
    borderBottomWidth: 1,
  },
  accountUsername: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.dark,
    marginBottom: 4,
  },
  verifiedBadge: {
    fontSize: 12,
    color: Colors.status.successDark,
    fontWeight: '600',
  },
  connectButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  connectButtonText: {
    color: Colors.background.white,
    fontWeight: '600',
    fontSize: 14,
  },
  disconnectButton: {
    backgroundColor: Colors.status.errorLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    borderColor: '#FFCDD2',
    borderWidth: 1,
  },
  disconnectButtonText: {
    color: '#d32f2f',
    fontWeight: '600',
    fontSize: 14,
  },
  privacyNotice: {
    backgroundColor: Colors.status.infoLight,
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftColor: Colors.status.info,
    borderLeftWidth: 4,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 13,
    color: Colors.status.infoBlue,
    lineHeight: 18,
  },
});
