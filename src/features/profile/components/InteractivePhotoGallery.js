import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TRANSLUCENT_WHITE_50 = 'rgba(255, 255, 255, 0.5)';

const InteractivePhotoGallery = ({
  photos = [],
  onPhotoPress,
  onAddPhoto,
  onRemovePhoto,
  editable = false,
  showProgress = true,
  maxPhotos = 9,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const flatListRef = useRef(null);

  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dotAnims = useRef(photos.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Update dot animations when active index changes
    dotAnims.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: index === activeIndex ? 1 : 0,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    });

    // Animate progress
    Animated.timing(progressAnim, {
      toValue: photos.length > 1 ? (activeIndex / (photos.length - 1)) * 100 : 100,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [activeIndex, photos.length, dotAnims, progressAnim]);

  const handleScroll = useCallback(
    (event) => {
      const contentOffset = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffset / (SCREEN_WIDTH - 80));
      if (index !== activeIndex && index >= 0 && index < photos.length) {
        setActiveIndex(index);
      }
    },
    [activeIndex, photos.length]
  );

  const handlePhotoPress = (index) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setFullscreenIndex(index);
    setFullscreenVisible(true);
    onPhotoPress?.(photos[index], index);
  };

  const goToPhoto = (index) => {
    if (flatListRef.current && index >= 0 && index < photos.length) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
      });
      setActiveIndex(index);
    }
  };

  const renderPhoto = ({ item, index }) => (
    <Animated.View
      style={[
        styles.photoContainer,
        { transform: [{ scale: index === activeIndex ? scaleAnim : 1 }] },
      ]}
    >
      <TouchableOpacity onPress={() => handlePhotoPress(index)} activeOpacity={0.9}>
        <Image source={{ uri: item.uri || item }} style={styles.photo} />

        {/* Photo index badge */}
        <View style={styles.photoBadge}>
          <Text style={styles.photoBadgeText}>
            {index + 1}/{photos.length}
          </Text>
        </View>

        {/* Primary photo badge */}
        {index === 0 && (
          <LinearGradient colors={Colors.gradient.gold} style={styles.primaryBadge}>
            <Ionicons name="star" size={12} color={Colors.background.white} />
            <Text style={styles.primaryBadgeText}>Main</Text>
          </LinearGradient>
        )}

        {/* Edit/Remove button */}
        {editable && (
          <TouchableOpacity style={styles.removeButton} onPress={() => onRemovePhoto?.(index)}>
            <Ionicons name="close-circle" size={28} color={Colors.accent.red} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {photos.map((_, index) => {
        const scale =
          dotAnims[index]?.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.3],
          }) || 1;

        const backgroundColor =
          dotAnims[index]?.interpolate({
            inputRange: [0, 1],
            outputRange: [TRANSLUCENT_WHITE_50, Colors.background.white],
          }) || TRANSLUCENT_WHITE_50;

        return (
          <TouchableOpacity key={index} onPress={() => goToPhoto(index)}>
            <Animated.View
              style={[
                styles.dot,
                {
                  transform: [{ scale }],
                  backgroundColor,
                },
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <Animated.View
        style={[
          styles.progressBar,
          {
            width: progressAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );

  const renderNavigationArrows = () => (
    <>
      {activeIndex > 0 && (
        <TouchableOpacity
          style={[styles.navArrow, styles.navArrowLeft]}
          onPress={() => goToPhoto(activeIndex - 1)}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.background.white} />
        </TouchableOpacity>
      )}
      {activeIndex < photos.length - 1 && (
        <TouchableOpacity
          style={[styles.navArrow, styles.navArrowRight]}
          onPress={() => goToPhoto(activeIndex + 1)}
        >
          <Ionicons name="chevron-forward" size={24} color={Colors.background.white} />
        </TouchableOpacity>
      )}
    </>
  );

  const renderFullscreenModal = () => (
    <Modal
      visible={fullscreenVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setFullscreenVisible(false)}
    >
      <View style={styles.fullscreenContainer}>
        <TouchableOpacity
          style={styles.closeFullscreen}
          onPress={() => setFullscreenVisible(false)}
        >
          <Ionicons name="close" size={28} color={Colors.background.white} />
        </TouchableOpacity>

        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={fullscreenIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          renderItem={({ item, index }) => (
            <View style={styles.fullscreenPhotoContainer}>
              <Image
                source={{ uri: item.uri || item }}
                style={styles.fullscreenPhoto}
                resizeMode="contain"
              />
              <View style={styles.fullscreenInfo}>
                <Text style={styles.fullscreenCounter}>
                  {index + 1} of {photos.length}
                </Text>
              </View>
            </View>
          )}
          keyExtractor={(_, index) => `fullscreen-${index}`}
        />
      </View>
    </Modal>
  );

  const renderAddPhotoButton = () => {
    if (!editable || photos.length >= maxPhotos) return null;

    return (
      <TouchableOpacity style={styles.addPhotoButton} onPress={onAddPhoto} activeOpacity={0.8}>
        <LinearGradient
          colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)']}
          style={styles.addPhotoGradient}
        >
          <View style={styles.addPhotoIcon}>
            <Ionicons name="add" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.addPhotoText}>Add Photo</Text>
          <Text style={styles.addPhotoSubtext}>
            {photos.length}/{maxPhotos}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient
          colors={['rgba(102, 126, 234, 0.05)', 'rgba(118, 75, 162, 0.05)']}
          style={styles.emptyGradient}
        >
          <View style={styles.emptyIconContainer}>
            <Ionicons name="images-outline" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Photos Yet</Text>
          <Text style={styles.emptySubtitle}>Add photos to make your profile stand out</Text>
          {editable && (
            <TouchableOpacity style={styles.addFirstPhotoButton} onPress={onAddPhoto}>
              <LinearGradient colors={Colors.gradient.primary} style={styles.addFirstPhotoGradient}>
                <Ionicons name="camera" size={20} color={Colors.background.white} />
                <Text style={styles.addFirstPhotoText}>Add Photos</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Photo carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={renderPhoto}
          keyExtractor={(_, index) => `photo-${index}`}
          snapToInterval={SCREEN_WIDTH - 80}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContent}
        />

        {/* Navigation arrows */}
        {renderNavigationArrows()}

        {/* Dots indicator */}
        {renderDots()}

        {/* Progress bar */}
        {showProgress && renderProgressBar()}
      </View>

      {/* Add photo button */}
      {renderAddPhotoButton()}

      {/* Fullscreen modal */}
      {renderFullscreenModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  carouselContainer: {
    position: 'relative',
    height: 400,
  },
  carouselContent: {
    paddingHorizontal: 40,
  },
  photoContainer: {
    width: SCREEN_WIDTH - 80,
    height: 380,
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 0,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  photoBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoBadgeText: {
    color: Colors.background.white,
    fontSize: 12,
    fontWeight: '600',
  },
  primaryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  primaryBadgeText: {
    color: Colors.background.white,
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: Colors.background.white90,
    borderRadius: 14,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 20,
    left: 60,
    right: 60,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.background.white,
    borderRadius: 1.5,
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrowLeft: {
    left: 8,
  },
  navArrowRight: {
    right: 8,
  },
  addPhotoButton: {
    marginTop: 16,
    marginHorizontal: 40,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderStyle: 'dashed',
  },
  addPhotoGradient: {
    padding: 20,
    alignItems: 'center',
  },
  addPhotoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  addPhotoSubtext: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  emptyContainer: {
    marginVertical: 16,
    marginHorizontal: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.2)',
    borderStyle: 'dashed',
  },
  emptyGradient: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  addFirstPhotoButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addFirstPhotoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  addFirstPhotoText: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '600',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  closeFullscreen: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullscreenPhotoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenPhoto: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  fullscreenInfo: {
    position: 'absolute',
    bottom: 100,
  },
  fullscreenCounter: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default InteractivePhotoGallery;
