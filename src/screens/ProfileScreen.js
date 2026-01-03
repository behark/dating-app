import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

const ProfileScreen = () => {
  const { currentUser, logout } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setName(data.name || '');
        setAge(data.age?.toString() || '');
        setBio(data.bio || '');
        setPhotoURL(data.photoURL || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    try {
      setLoading(true);
      
      if (storage) {
        try {
          const response = await fetch(uri);
          const blob = await response.blob();
          const imageRef = ref(storage, `profiles/${currentUser.uid}/${Date.now()}.jpg`);
          
          await uploadBytes(imageRef, blob);
          const downloadURL = await getDownloadURL(imageRef);
          setPhotoURL(downloadURL);
          setLoading(false);
          return;
        } catch (storageError) {
          console.warn('Firebase Storage not available:', storageError);
          setPhotoURL(uri);
          Alert.alert(
            'Storage Not Available',
            'Firebase Storage is not enabled. You can use an image URL instead.',
            [{ text: 'OK' }]
          );
          setLoading(false);
        }
      }
      
      setPhotoURL(uri);
      Alert.alert(
        'Storage Not Available',
        'Firebase Storage is not enabled. You can use an image URL instead.',
        [{ text: 'OK' }]
      );
      setLoading(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. You can add an image URL manually.');
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!name || !age) {
      Alert.alert('Error', 'Please fill in name and age');
      return;
    }
    try {
      setLoading(true);
      await setDoc(doc(db, 'users', currentUser.uid), {
        name,
        age: parseInt(age),
        bio,
        photoURL,
        email: currentUser.email,
        createdAt: new Date(),
      }, { merge: true });
      
      Alert.alert('Success', 'Profile updated successfully!');
      setLoading(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Text style={styles.headerSubtitle}>Make your profile stand out</Text>
        </View>

        <View style={styles.card}>
          <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.image} />
            ) : (
              <LinearGradient
                colors={['#f093fb', '#f5576c']}
                style={styles.placeholderImage}
              >
                <Ionicons name="camera" size={40} color="#fff" />
                <Text style={styles.placeholderText}>Tap to add photo</Text>
              </LinearGradient>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={16} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Ionicons name="person-outline" size={20} color="#667eea" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Your Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="calendar-outline" size={20} color="#667eea" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Age"
              placeholderTextColor="#999"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="document-text-outline" size={20} color="#667eea" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#999"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="image-outline" size={20} color="#667eea" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Or paste image URL here"
              placeholderTextColor="#999"
              value={photoURL}
              onChangeText={setPhotoURL}
              autoCapitalize="none"
            />
          </View>
          <Text style={styles.helpText}>
            💡 Tip: Upload to Imgur or ImgBB and paste the URL
          </Text>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveProfile}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.saveButtonGradient}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Profile'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={logout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" style={{ marginRight: 8 }} />
            <Text style={styles.logoutButtonText}>Logout</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    padding: 25,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: '#667eea',
  },
  placeholderImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#667eea',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: -10,
    marginBottom: 20,
    paddingHorizontal: 5,
    fontStyle: 'italic',
  },
  saveButton: {
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderRadius: 15,
    paddingVertical: 15,
  },
  logoutButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
