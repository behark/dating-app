import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { SocialFeaturesService } from '../services/SocialFeaturesService';
import logger from '../utils/logger';

const CreateGroupDateScreen = ({ navigation, route }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [eventType, setEventType] = useState('casual');
  const [maxParticipants, setMaxParticipants] = useState('');

  const handleCreateGroupDate = async () => {
    if (!title.trim() || !description.trim() || !locationName.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const groupDateData = {
        title: title.trim(),
        description: description.trim(),
        locationName: locationName.trim(),
        eventType,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        startTime: new Date().toISOString(), // Default to now, should add date picker
      };

      await SocialFeaturesService.createGroupDate(groupDateData);
      Alert.alert('Success', 'Group date created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      logger.error('Error creating group date:', error);
      Alert.alert('Error', error.message || 'Failed to create group date');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={Colors.gradient.light} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Group Date</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter group date title"
              placeholderTextColor={Colors.text.tertiary}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your group date..."
              placeholderTextColor={Colors.text.tertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="Meeting location"
              placeholderTextColor={Colors.text.tertiary}
              value={locationName}
              onChangeText={setLocationName}
              maxLength={200}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Type</Text>
            <View style={styles.typeContainer}>
              {['casual', 'activity', 'dining', 'entertainment', 'outdoor'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeButton, eventType === type && styles.typeButtonActive]}
                  onPress={() => setEventType(type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      eventType === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Max Participants (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Leave empty for unlimited"
              placeholderTextColor={Colors.text.tertiary}
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={[styles.createButton, loading && styles.disabledButton]}
            onPress={handleCreateGroupDate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.background.white} />
            ) : (
              <Text style={styles.createButtonText}>Create Group Date</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: Colors.background.white,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.dark,
  },
  placeholder: {
    width: 34,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.dark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.gray,
    fontSize: 16,
    color: Colors.text.dark,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background.lighter,
    borderWidth: 1,
    borderColor: Colors.border.gray,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: Colors.background.white,
  },
  createButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  createButtonText: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CreateGroupDateScreen;
