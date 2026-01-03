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
      
      // Try to upload to Firebase Storage if available
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
        // If Storage is not available, use the local URI directly
        // Note: This works for local images but won't persist across devices
        console.warn('Firebase Storage not available, using local image:', storageError);
        setPhotoURL(uri);
        Alert.alert(
          'Storage Not Available',
          'Firebase Storage is not enabled. You can use an image URL instead. Go to profile settings to add a URL.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        }
      }
      
      // If Storage is not available, use the local URI directly
      // Note: This works for local images but won't persist across devices
      console.warn('Firebase Storage not available, using local image');
      setPhotoURL(uri);
      Alert.alert(
        'Storage Not Available',
        'Firebase Storage is not enabled. You can use an image URL instead. Paste a URL in the Photo URL field below.',
        [{ text: 'OK' }]
      );
      setLoading(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. You can add an image URL manually in the profile.');
      setLoading(false);
    }
  };

  const saveProfile = async () => {
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
      
      Alert.alert('Success', 'Profile updated!');
      setLoading(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>Tap to add photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Age"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />

        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="Bio"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
        />

        <TextInput
          style={styles.input}
          placeholder="Photo URL (paste image link here)"
          value={photoURL}
          onChangeText={setPhotoURL}
          autoCapitalize="none"
        />
        <Text style={styles.helpText}>
          💡 Tip: You can paste an image URL from the web (e.g., from imgur, imgbb, or any image hosting service)
        </Text>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveProfile}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Profile'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#FF6B6B',
  },
  placeholderImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ddd',
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: -10,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
});

export default ProfileScreen;
