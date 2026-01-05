import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import logger from '../../utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CHAT_THEMES = {
  default: {
    id: 'default',
    name: 'Classic',
    description: 'Clean and simple',
    isPremium: false,
    background: { type: 'gradient', colors: ['#f5f7fa', '#c3cfe2'] },
    myMessage: { gradient: ['#667eea', '#764ba2'], textColor: '#fff' },
    theirMessage: { backgroundColor: '#fff', textColor: '#333' },
    inputBackground: 'rgba(255, 255, 255, 0.95)',
    accentColor: '#667eea',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm orange vibes',
    isPremium: false,
    background: { type: 'gradient', colors: ['#ff9a9e', '#fecfef'] },
    myMessage: { gradient: ['#FF6B6B', '#FF8E53'], textColor: '#fff' },
    theirMessage: { backgroundColor: 'rgba(255, 255, 255, 0.9)', textColor: '#333' },
    inputBackground: 'rgba(255, 255, 255, 0.9)',
    accentColor: '#FF6B6B',
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool blue tones',
    isPremium: false,
    background: { type: 'gradient', colors: ['#667eea', '#764ba2'] },
    myMessage: { gradient: ['#4ECDC4', '#44A08D'], textColor: '#fff' },
    theirMessage: { backgroundColor: 'rgba(255, 255, 255, 0.95)', textColor: '#333' },
    inputBackground: 'rgba(255, 255, 255, 0.9)',
    accentColor: '#4ECDC4',
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    description: 'Nature-inspired greens',
    isPremium: true,
    background: { type: 'gradient', colors: ['#134E5E', '#71B280'] },
    myMessage: { gradient: ['#56ab2f', '#a8e063'], textColor: '#fff' },
    theirMessage: { backgroundColor: 'rgba(255, 255, 255, 0.95)', textColor: '#333' },
    inputBackground: 'rgba(255, 255, 255, 0.9)',
    accentColor: '#56ab2f',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark and elegant',
    isPremium: true,
    background: { type: 'gradient', colors: ['#232526', '#414345'] },
    myMessage: { gradient: ['#8B5CF6', '#7C3AED'], textColor: '#fff' },
    theirMessage: { backgroundColor: 'rgba(255, 255, 255, 0.1)', textColor: '#fff' },
    inputBackground: 'rgba(255, 255, 255, 0.1)',
    accentColor: '#8B5CF6',
  },
  romance: {
    id: 'romance',
    name: 'Romance',
    description: 'Love is in the air',
    isPremium: true,
    background: { type: 'gradient', colors: ['#ee9ca7', '#ffdde1'] },
    myMessage: { gradient: ['#ec4899', '#be185d'], textColor: '#fff' },
    theirMessage: { backgroundColor: 'rgba(255, 255, 255, 0.9)', textColor: '#333' },
    inputBackground: 'rgba(255, 255, 255, 0.9)',
    accentColor: '#ec4899',
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora',
    description: 'Northern lights magic',
    isPremium: true,
    background: { type: 'gradient', colors: ['#00c6ff', '#0072ff', '#8B5CF6'] },
    myMessage: { gradient: ['#00c6ff', '#0072ff'], textColor: '#fff' },
    theirMessage: { backgroundColor: 'rgba(255, 255, 255, 0.9)', textColor: '#333' },
    inputBackground: 'rgba(255, 255, 255, 0.9)',
    accentColor: '#00c6ff',
  },
  golden: {
    id: 'golden',
    name: 'Golden Hour',
    description: 'Premium luxury feel',
    isPremium: true,
    background: { type: 'gradient', colors: ['#f7971e', '#ffd200'] },
    myMessage: { gradient: ['#FFD700', '#FFA500'], textColor: '#333' },
    theirMessage: { backgroundColor: 'rgba(255, 255, 255, 0.95)', textColor: '#333' },
    inputBackground: 'rgba(255, 255, 255, 0.95)',
    accentColor: '#FFD700',
  },
};

const BACKGROUND_PATTERNS = [
  { id: 'none', name: 'None', icon: 'ban-outline' },
  { id: 'hearts', name: 'Hearts', icon: 'heart', emoji: '❤️' },
  { id: 'stars', name: 'Stars', icon: 'star', emoji: '⭐' },
  { id: 'bubbles', name: 'Bubbles', icon: 'ellipse', emoji: '🫧' },
  { id: 'sparkles', name: 'Sparkles', icon: 'sparkles', emoji: '✨' },
];

const ChatThemes = ({
  visible,
  onClose,
  onSelectTheme,
  currentThemeId = 'default',
  isPremiumUser = false,
  matchId,
}) => {
  const [selectedTheme, setSelectedTheme] = useState(currentThemeId);
  const [selectedPattern, setSelectedPattern] = useState('none');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadSavedTheme();
  }, [matchId]);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(`chat_theme_${matchId}`);
      const savedPattern = await AsyncStorage.getItem(`chat_pattern_${matchId}`);
      if (savedTheme) setSelectedTheme(savedTheme);
      if (savedPattern) setSelectedPattern(savedPattern);
    } catch (error) {
      logger.error('Error loading theme', error, { matchId });
    }
  };

  const handleSelectTheme = async (themeId) => {
    const theme = CHAT_THEMES[themeId];
    
    if (theme.isPremium && !isPremiumUser) {
      // Show premium upsell
      return;
    }

    setSelectedTheme(themeId);
  };

  const handleApply = async () => {
    try {
      await AsyncStorage.setItem(`chat_theme_${matchId}`, selectedTheme);
      await AsyncStorage.setItem(`chat_pattern_${matchId}`, selectedPattern);
      
      onSelectTheme?.({
        themeId: selectedTheme,
        theme: CHAT_THEMES[selectedTheme],
        pattern: selectedPattern,
      });
      
      onClose?.();
    } catch (error) {
      logger.error('Error saving theme', error, { matchId, themeId: selectedTheme });
    }
  };

  const renderThemeCard = ({ item }) => {
    const theme = CHAT_THEMES[item];
    const isSelected = selectedTheme === item;
    const isLocked = theme.isPremium && !isPremiumUser;

    return (
      <TouchableOpacity
        style={[styles.themeCard, isSelected && styles.themeCardSelected]}
        onPress={() => handleSelectTheme(item)}
        activeOpacity={0.8}
      >
        {/* Theme preview */}
        <LinearGradient
          colors={theme.background.colors}
          style={styles.themePreview}
        >
          {/* Sample messages */}
          <View style={styles.sampleMessages}>
            <LinearGradient
              colors={theme.myMessage.gradient}
              style={styles.sampleMyMessage}
            >
              <Text style={{ color: theme.myMessage.textColor, fontSize: 10 }}>
                Hey! 👋
              </Text>
            </LinearGradient>
            <View
              style={[
                styles.sampleTheirMessage,
                { backgroundColor: theme.theirMessage.backgroundColor },
              ]}
            >
              <Text style={{ color: theme.theirMessage.textColor, fontSize: 10 }}>
                Hi there!
              </Text>
            </View>
          </View>

          {/* Locked overlay */}
          {isLocked && (
            <View style={styles.lockedOverlay}>
              <Ionicons name="diamond" size={20} color="#FFD700" />
              <Text style={styles.lockedText}>Premium</Text>
            </View>
          )}
        </LinearGradient>

        {/* Theme info */}
        <View style={styles.themeInfo}>
          <Text style={styles.themeName}>{theme.name}</Text>
          <Text style={styles.themeDescription}>{theme.description}</Text>
        </View>

        {/* Selection indicator */}
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderPatternOption = (pattern) => {
    const isSelected = selectedPattern === pattern.id;

    return (
      <TouchableOpacity
        key={pattern.id}
        style={[styles.patternOption, isSelected && styles.patternOptionSelected]}
        onPress={() => setSelectedPattern(pattern.id)}
      >
        {pattern.emoji ? (
          <Text style={styles.patternEmoji}>{pattern.emoji}</Text>
        ) : (
          <Ionicons name={pattern.icon} size={20} color={isSelected ? '#667eea' : '#999'} />
        )}
        <Text style={[styles.patternName, isSelected && styles.patternNameSelected]}>
          {pattern.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPreview = () => {
    const theme = CHAT_THEMES[selectedTheme];

    return (
      <View style={styles.previewContainer}>
        <LinearGradient
          colors={theme.background.colors}
          style={styles.previewScreen}
        >
          {/* Pattern overlay */}
          {selectedPattern !== 'none' && (
            <View style={styles.patternOverlay}>
              {[...Array(20)].map((_, i) => (
                <Text
                  key={i}
                  style={[
                    styles.patternEmoji,
                    {
                      position: 'absolute',
                      left: `${(i % 5) * 25}%`,
                      top: `${Math.floor(i / 5) * 25}%`,
                      opacity: 0.1,
                      fontSize: 24,
                    },
                  ]}
                >
                  {BACKGROUND_PATTERNS.find((p) => p.id === selectedPattern)?.emoji}
                </Text>
              ))}
            </View>
          )}

          {/* Sample conversation */}
          <View style={styles.previewMessages}>
            <View style={styles.previewTheirMessageContainer}>
              <View
                style={[
                  styles.previewTheirMessage,
                  { backgroundColor: theme.theirMessage.backgroundColor },
                ]}
              >
                <Text style={{ color: theme.theirMessage.textColor }}>
                  Hey! How are you? 😊
                </Text>
              </View>
            </View>

            <View style={styles.previewMyMessageContainer}>
              <LinearGradient
                colors={theme.myMessage.gradient}
                style={styles.previewMyMessage}
              >
                <Text style={{ color: theme.myMessage.textColor }}>
                  I'm great! Just checking out these themes! 🎨
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.previewTheirMessageContainer}>
              <View
                style={[
                  styles.previewTheirMessage,
                  { backgroundColor: theme.theirMessage.backgroundColor },
                ]}
              >
                <Text style={{ color: theme.theirMessage.textColor }}>
                  They look amazing! 💜
                </Text>
              </View>
            </View>
          </View>

          {/* Input preview */}
          <View style={[styles.previewInput, { backgroundColor: theme.inputBackground }]}>
            <Text style={styles.previewInputText}>Type a message...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Chat Themes</Text>
              <Text style={styles.subtitle}>Personalize your conversation</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Preview toggle */}
          <TouchableOpacity
            style={styles.previewToggle}
            onPress={() => setPreviewMode(!previewMode)}
          >
            <Ionicons
              name={previewMode ? 'grid' : 'eye'}
              size={18}
              color="#667eea"
            />
            <Text style={styles.previewToggleText}>
              {previewMode ? 'Show Themes' : 'Preview Chat'}
            </Text>
          </TouchableOpacity>

          {previewMode ? (
            renderPreview()
          ) : (
            <>
              {/* Themes grid */}
              <FlatList
                data={Object.keys(CHAT_THEMES)}
                renderItem={renderThemeCard}
                keyExtractor={(item) => item}
                numColumns={2}
                columnWrapperStyle={styles.themesRow}
                contentContainerStyle={styles.themesContainer}
                showsVerticalScrollIndicator={false}
              />

              {/* Background patterns */}
              <View style={styles.patternsSection}>
                <Text style={styles.sectionTitle}>Background Pattern</Text>
                <View style={styles.patternsContainer}>
                  {BACKGROUND_PATTERNS.map(renderPatternOption)}
                </View>
              </View>
            </>
          )}

          {/* Apply button */}
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <LinearGradient
              colors={CHAT_THEMES[selectedTheme].myMessage.gradient}
              style={styles.applyButtonGradient}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.applyButtonText}>Apply Theme</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Hook to use theme in chat
export const useChatTheme = (matchId, defaultTheme = 'default') => {
  const [theme, setTheme] = useState(CHAT_THEMES[defaultTheme]);
  const [pattern, setPattern] = useState('none');

  useEffect(() => {
    loadTheme();
  }, [matchId]);

  const loadTheme = async () => {
    try {
      const savedThemeId = await AsyncStorage.getItem(`chat_theme_${matchId}`);
      const savedPattern = await AsyncStorage.getItem(`chat_pattern_${matchId}`);
      
      if (savedThemeId && CHAT_THEMES[savedThemeId]) {
        setTheme(CHAT_THEMES[savedThemeId]);
      }
      if (savedPattern) {
        setPattern(savedPattern);
      }
    } catch (error) {
      logger.error('Error loading theme', error, { matchId });
    }
  };

  return { theme, pattern, refreshTheme: loadTheme };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  previewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  previewToggleText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  themesContainer: {
    paddingBottom: 16,
  },
  themesRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  themeCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardSelected: {
    borderColor: '#4ECDC4',
  },
  themePreview: {
    height: 100,
    padding: 12,
    justifyContent: 'center',
  },
  sampleMessages: {
    gap: 8,
  },
  sampleMyMessage: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderTopRightRadius: 4,
  },
  sampleTheirMessage: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderTopLeftRadius: 4,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  lockedText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  themeInfo: {
    padding: 12,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  themeDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  patternsSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  patternsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  patternOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  patternOptionSelected: {
    borderColor: '#667eea',
    backgroundColor: '#E8F0FE',
  },
  patternEmoji: {
    fontSize: 16,
  },
  patternName: {
    fontSize: 12,
    color: '#666',
  },
  patternNameSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    marginBottom: 16,
  },
  previewScreen: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 300,
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  previewMessages: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    gap: 12,
  },
  previewMyMessageContainer: {
    alignItems: 'flex-end',
  },
  previewTheirMessageContainer: {
    alignItems: 'flex-start',
  },
  previewMyMessage: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderTopRightRadius: 4,
    maxWidth: '75%',
  },
  previewTheirMessage: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    maxWidth: '75%',
  },
  previewInput: {
    margin: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  },
  previewInputText: {
    color: '#999',
    fontSize: 14,
  },
  applyButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  applyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export { CHAT_THEMES };
export default ChatThemes;
