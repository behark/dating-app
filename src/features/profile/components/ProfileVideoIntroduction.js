import Ionicons from '@expo/vector-icons/Ionicons';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import logger from '../../../utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_VIDEO_DURATION = 30; // 30 seconds max
const MIN_VIDEO_DURATION = 15; // 15 seconds min

const ProfileVideoIntroduction = ({
  videoUrl,
  onVideoChange,
  onVideoRemove,
  editable = true,
  userName = 'User',
  showPreview = true,
}) => {
  const player = useVideoPlayer(videoUrl || null, (playerInstance) => {
    playerInstance.loop = true;
  });
  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player?.playing ?? false,
  });
  const [showModal, setShowModal] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoStatus, setVideoStatus] = useState({});
  const [loading, setLoading] = useState(false);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingAnim = useRef(new Animated.Value(0)).current;
  const playButtonAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (recording) {
      startRecordingPulse();
    } else {
      pulseAnim.setValue(1);
    }
  }, [recording]);

  useEffect(() => {
    if (!player) return undefined;

    const updateStatus = () => {
      const currentTime = typeof player.currentTime === 'number' ? player.currentTime : 0;
      const duration =
        typeof player.duration === 'number' && player.duration > 0 ? player.duration : 1;
      setVideoStatus({
        positionMillis: currentTime * 1000,
        durationMillis: duration * 1000,
        isMuted: !!player.muted,
        isPlaying: !!player.playing,
      });
    };

    updateStatus();
    const intervalId = setInterval(updateStatus, 250);
    return () => clearInterval(intervalId);
  }, [player, videoUrl]);

  const startRecordingPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animatePlayButton = () => {
    Animated.sequence([
      Animated.timing(playButtonAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(playButtonAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePlayPause = async () => {
    if (!player) return;

    animatePlayButton();

    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need media library permissions to select a video!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Videos,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
        videoMaxDuration: MAX_VIDEO_DURATION,
      });

      if (!result.canceled && result.assets?.[0]) {
        const video = result.assets[0];
        const duration = video.duration / 1000; // Convert to seconds

        if (duration < MIN_VIDEO_DURATION) {
          Alert.alert(
            'Video too short',
            `Please select a video at least ${MIN_VIDEO_DURATION} seconds long.`
          );
          return;
        }

        if (duration > MAX_VIDEO_DURATION) {
          Alert.alert(
            'Video too long',
            `Please select a video no longer than ${MAX_VIDEO_DURATION} seconds.`
          );
          return;
        }

        setLoading(true);
        await onVideoChange?.(video.uri);
        setLoading(false);
        setShowModal(false);
      }
    } catch (error) {
      logger.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
      setLoading(false);
    }
  };

  const recordVideo = async () => {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: micStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== 'granted' || micStatus !== 'granted') {
        Alert.alert('Permission needed', 'We need camera and microphone permissions to record!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaType.Videos,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
        videoMaxDuration: MAX_VIDEO_DURATION,
      });

      if (!result.canceled && result.assets?.[0]) {
        const video = result.assets[0];
        const duration = video.duration / 1000;

        if (duration < MIN_VIDEO_DURATION) {
          Alert.alert('Video too short', `Please record at least ${MIN_VIDEO_DURATION} seconds.`);
          return;
        }

        setLoading(true);
        await onVideoChange?.(video.uri);
        setLoading(false);
        setShowModal(false);
      }
    } catch (error) {
      logger.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video. Please try again.');
      setLoading(false);
    }
  };

  const handleRemoveVideo = () => {
    Alert.alert('Remove Video', 'Are you sure you want to remove your video introduction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => onVideoRemove?.(),
      },
    ]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderVideoPlayer = () => {
    if (!videoUrl) return null;

    const position = videoStatus.positionMillis || 0;
    const duration = videoStatus.durationMillis || 1;
    const progress = (position / duration) * 100;

    return (
      <View style={styles.videoContainer}>
        <VideoView
          style={styles.video}
          player={player}
          contentFit="cover"
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />

        {/* Video overlay controls */}
        <TouchableOpacity style={styles.videoOverlay} onPress={handlePlayPause} activeOpacity={0.9}>
          {!isPlaying && (
            <Animated.View
              style={[styles.playButtonContainer, { transform: [{ scale: playButtonAnim }] }]}
            >
              <LinearGradient
                colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
                style={styles.playButton}
              >
                <Ionicons name="play" size={32} color={Colors.background.white} />
              </LinearGradient>
            </Animated.View>
          )}
        </TouchableOpacity>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        {/* Duration indicator */}
        <View style={styles.durationBadge}>
          <Ionicons name="videocam" size={12} color={Colors.background.white} />
          <Text style={styles.durationText}>
            {formatTime(position / 1000)} / {formatTime(duration / 1000)}
          </Text>
        </View>

        {/* Sound indicator */}
        <TouchableOpacity style={styles.soundBadge}>
          <Ionicons
            name={videoStatus.isMuted ? 'volume-mute' : 'volume-high'}
            size={16}
            color={Colors.background.white}
          />
        </TouchableOpacity>

        {editable && (
          <TouchableOpacity style={styles.removeButton} onPress={handleRemoveVideo}>
            <Ionicons name="close-circle" size={24} color={Colors.accent.red} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderPlaceholder = () => (
    <TouchableOpacity
      style={styles.placeholder}
      onPress={() => setShowModal(true)}
      disabled={!editable}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)']}
        style={styles.placeholderGradient}
      >
        <View style={styles.placeholderIconContainer}>
          <LinearGradient colors={Colors.gradient.primary} style={styles.placeholderIcon}>
            <Ionicons name="videocam" size={32} color={Colors.background.white} />
          </LinearGradient>
        </View>
        <Text style={styles.placeholderTitle}>Add Video Introduction</Text>
        <Text style={styles.placeholderSubtitle}>
          Record a 15-30 second video to introduce yourself
        </Text>
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.accent.teal} />
            <Text style={styles.benefitText}>Get 3x more matches</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.accent.teal} />
            <Text style={styles.benefitText}>Stand out from the crowd</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.accent.teal} />
            <Text style={styles.benefitText}>Show your personality</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderModal = () => (
    <Modal
      visible={showModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Video Introduction</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={Colors.text.dark} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>
            Create a {MIN_VIDEO_DURATION}-{MAX_VIDEO_DURATION} second video to introduce yourself.
            Be authentic and show your personality!
          </Text>

          <View style={styles.tipsList}>
            <Text style={styles.tipsTitle}>💡 Tips for a great video:</Text>
            <Text style={styles.tipItem}>• Good lighting - face a window</Text>
            <Text style={styles.tipItem}>• Keep it natural and authentic</Text>
            <Text style={styles.tipItem}>• Share your hobbies and interests</Text>
            <Text style={styles.tipItem}>• Smile and be yourself!</Text>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalButton} onPress={recordVideo} disabled={loading}>
              <LinearGradient colors={Colors.gradient.redOrange} style={styles.modalButtonGradient}>
                <Ionicons name="camera" size={24} color={Colors.background.white} />
                <Text style={styles.modalButtonText}>Record Video</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButton} onPress={pickVideo} disabled={loading}>
              <LinearGradient colors={Colors.gradient.primary} style={styles.modalButtonGradient}>
                <Ionicons name="images" size={24} color={Colors.background.white} />
                <Text style={styles.modalButtonText}>Choose from Gallery</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Processing video...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="videocam" size={20} color={Colors.primary} />
          <Text style={styles.headerTitle}>Video Introduction</Text>
        </View>
        {videoUrl && editable && (
          <TouchableOpacity onPress={() => setShowModal(true)}>
            <Text style={styles.changeButton}>Change</Text>
          </TouchableOpacity>
        )}
      </View>

      {videoUrl ? renderVideoPlayer() : renderPlaceholder()}
      {renderModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    backgroundColor: Colors.background.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.dark,
  },
  changeButton: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 400,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.text.primary,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonContainer: {
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  durationText: {
    color: Colors.background.white,
    fontSize: 12,
    fontWeight: '500',
  },
  soundBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 20,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.background.white90,
    borderRadius: 12,
  },
  placeholder: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderStyle: 'dashed',
  },
  placeholderGradient: {
    padding: 24,
    alignItems: 'center',
  },
  placeholderIconContainer: {
    marginBottom: 16,
  },
  placeholderIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  benefitsList: {
    width: '100%',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: Colors.text.dark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.dark,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  tipsList: {
    backgroundColor: Colors.background.lightest,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.dark,
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  modalButtonText: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background.white90,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default ProfileVideoIntroduction;
