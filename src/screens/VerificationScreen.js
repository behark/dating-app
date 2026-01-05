import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../constants/colors';
import { VerificationService } from '../services/VerificationService';
import { useAuth } from '../context/AuthContext';
import logger from '../utils/logger';

const VerificationScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadVerificationStatus();
  }, []);

  const loadVerificationStatus = async () => {
    try {
      const status = await VerificationService.getVerificationStatus(currentUser.uid);
      setVerificationStatus(status);
    } catch (error) {
      logger.error('Error loading verification status:', error);
      Alert.alert('Error', 'Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera roll permissions are required to select photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const newDoc = {
          uri: result.assets[0].uri,
          type: 'photo',
          name: `photo_${Date.now()}.jpg`,
          documentType: 'selfie',
        };
        setSelectedDocuments((prev) => [...prev, newDoc]);
      }
    } catch (error) {
      logger.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        const newDoc = {
          uri: result.uri,
          type: 'document',
          name: result.name,
          documentType: 'government_id',
        };
        setSelectedDocuments((prev) => [...prev, newDoc]);
      }
    } catch (error) {
      logger.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document');
    }
  };

  const removeDocument = (index) => {
    setSelectedDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const submitVerification = async () => {
    if (selectedDocuments.length === 0) {
      Alert.alert('Missing Documents', 'Please select at least one document for verification');
      return;
    }

    setSubmitting(true);
    try {
      // Upload all selected documents
      const uploadedDocuments = [];
      for (const doc of selectedDocuments) {
        const uploadResult = await VerificationService.uploadVerificationDocument(
          currentUser.uid,
          doc.uri,
          doc.name,
          doc.documentType
        );

        if (!uploadResult.success) {
          throw new Error(`Failed to upload ${doc.name}: ${uploadResult.error}`);
        }

        uploadedDocuments.push({
          url: uploadResult.url,
          fileName: uploadResult.fileName,
          documentType: uploadResult.documentType,
        });
      }

      // Submit verification request
      const result = await VerificationService.submitVerificationRequest(currentUser.uid, {
        type: 'document_verification',
        documents: uploadedDocuments,
        notes: notes.trim(),
      });

      if (result.success) {
        Alert.alert(
          'Verification Submitted',
          "Your verification request has been submitted. We'll review it within 24-48 hours.",
          [{ text: 'OK', onPress: loadVerificationStatus }]
        );
        setSelectedDocuments([]);
        setNotes('');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      logger.error('Error submitting verification:', error);
      Alert.alert('Error', 'Failed to submit verification request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRequest = async (requestId) => {
    Alert.alert(
      'Cancel Verification',
      'Are you sure you want to cancel this verification request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const result = await VerificationService.cancelVerificationRequest(
                requestId,
                currentUser.uid
              );
              if (result.success) {
                Alert.alert('Success', 'Verification request cancelled');
                loadVerificationStatus();
              } else {
                throw new Error(result.error);
              }
            } catch (error) {
              logger.error('Error cancelling request:', error);
              Alert.alert('Error', 'Failed to cancel verification request');
            }
          },
        },
      ]
    );
  };

  const renderStatusCard = () => {
    const getStatusInfo = () => {
      switch (verificationStatus.status) {
        case 'verified':
          return {
            title: 'Verified Account',
            subtitle: 'Your account has been verified',
            color: Colors.accent.teal,
            icon: 'checkmark-circle',
            showBadge: true,
          };
        case 'pending':
          return {
            title: 'Verification Pending',
            subtitle: 'We&apos;re reviewing your documents',
            color: '#FFA500',
            icon: 'time',
            showBadge: true,
          };
        case 'rejected':
          return {
            title: 'Verification Rejected',
            subtitle:
              verificationStatus.rejectionReason ||
              'Please try again with better quality documents',
            color: Colors.accent.red,
            icon: 'close-circle',
            showBadge: false,
          };
        default:
          return {
            title: 'Get Verified',
            subtitle: 'Verify your account to build trust',
            color: Colors.primary,
            icon: 'shield-checkmark',
            showBadge: false,
          };
      }
    };

    const statusInfo = getStatusInfo();

    return (
      <View style={[styles.statusCard, { borderColor: statusInfo.color }]}>
        <View style={[styles.statusIcon, { backgroundColor: statusInfo.color }]}>
          <Ionicons name={statusInfo.icon} size={30} color={Colors.background.white} />
        </View>
        <View style={styles.statusContent}>
          <Text style={styles.statusTitle}>{statusInfo.title}</Text>
          <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
          {statusInfo.showBadge && (
            <View style={[styles.verificationBadge, { backgroundColor: statusInfo.color }]}>
              <Ionicons name="checkmark" size={12} color={Colors.background.white} />
              <Text style={styles.badgeText}>VERIFIED</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderDocumentUpload = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Submit Verification Documents</Text>
      <Text style={styles.sectionSubtitle}>
        Upload a clear selfie and government-issued ID to verify your identity
      </Text>

      <View style={styles.uploadOptions}>
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Ionicons name="camera" size={24} color={Colors.primary} />
          <Text style={styles.uploadButtonText}>Take Selfie</Text>
          <Text style={styles.uploadButtonSubtext}>Clear photo of yourself</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
          <Ionicons name="document" size={24} color={Colors.primary} />
          <Text style={styles.uploadButtonText}>Upload ID</Text>
          <Text style={styles.uploadButtonSubtext}>Government ID or passport</Text>
        </TouchableOpacity>
      </View>

      {selectedDocuments.length > 0 && (
        <View style={styles.selectedDocuments}>
          <Text style={styles.documentsTitle}>Selected Documents:</Text>
          {selectedDocuments.map((doc, index) => (
            <View key={index} style={styles.documentItem}>
              <View style={styles.documentInfo}>
                <Ionicons
                  name={doc.type === 'photo' ? 'image' : 'document'}
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.documentName}>{doc.name}</Text>
              </View>
              <TouchableOpacity onPress={() => removeDocument(index)} style={styles.removeButton}>
                <Ionicons name="close" size={20} color={Colors.accent.red} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.submitButton,
          (selectedDocuments.length === 0 || submitting) && styles.submitButtonDisabled,
        ]}
        onPress={submitVerification}
        disabled={selectedDocuments.length === 0 || submitting}
      >
        <LinearGradient
          colors={
            selectedDocuments.length === 0 || submitting
              ? Colors.gradient.disabled
              : Colors.gradient.primary
          }
          style={styles.submitButtonGradient}
        >
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={Colors.background.white}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit for Verification'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderPendingRequests = () => {
    const pendingRequests = verificationStatus.requests.filter((req) => req.status === 'pending');

    if (pendingRequests.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Requests</Text>
        {pendingRequests.map((request) => (
          <View key={request.id} style={styles.requestCard}>
            <View style={styles.requestInfo}>
              <Ionicons name="time" size={20} color="#FFA500" />
              <View style={styles.requestDetails}>
                <Text style={styles.requestType}>Document Verification</Text>
                <Text style={styles.requestDate}>
                  Submitted {request.submittedAt.toDate().toLocaleDateString()}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => cancelRequest(request.id)} style={styles.cancelButton}>
              <Ionicons name="close" size={20} color={Colors.accent.red} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={Colors.gradient.primary} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="shield-checkmark" size={60} color={Colors.background.white} />
          <Text style={styles.loadingText}>Loading verification...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Colors.gradient.light} style={styles.container}>
      <LinearGradient colors={Colors.gradient.primary} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.background.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {renderStatusCard()}
          {renderPendingRequests()}
          {verificationStatus.status === 'unverified' && renderDocumentUpload()}
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
    padding: 15,
    paddingTop: 50,
    paddingBottom: 15,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.background.white,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: Colors.background.white,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 5,
  },
  statusSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  badgeText: {
    color: Colors.background.white,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  section: {
    backgroundColor: Colors.background.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  uploadButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 5,
    backgroundColor: Colors.background.lightest,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border.gray,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  uploadButtonSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  selectedDocuments: {
    marginBottom: 20,
  },
  documentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.dark,
    marginBottom: 10,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: Colors.background.lightest,
    borderRadius: 8,
    marginBottom: 8,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentName: {
    marginLeft: 10,
    fontSize: 14,
    color: Colors.text.dark,
    flex: 1,
  },
  removeButton: {
    padding: 5,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitButtonText: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '700',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: Colors.background.lightest,
    borderRadius: 10,
    marginBottom: 10,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestDetails: {
    marginLeft: 12,
    flex: 1,
  },
  requestType: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.dark,
  },
  requestDate: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  cancelButton: {
    padding: 5,
  },
});

export default VerificationScreen;
