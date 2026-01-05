import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';
import { SafetyService } from '../services/SafetyService';
import logger from '../utils/logger';

export default function ReportUserScreen({ route, navigation }) {
  const { userId: reportedUserId, userName = 'User' } = route.params || {};
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  React.useEffect(() => {
    const loadCategories = async () => {
      const cats = await SafetyService.getReportCategories();
      setCategories(cats);
    };
    loadCategories();
  }, []);

  const handleReport = async () => {
    // Validation
    const validation = SafetyService.validateReport(selectedCategory?.id, description);
    if (!validation.isValid) {
      Alert.alert('Invalid Report', validation.errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      const result = await SafetyService.reportUser(
        'currentUserId', // Would be from auth context
        reportedUserId,
        selectedCategory.id,
        description,
        []
      );

      if (result.success) {
        Alert.alert(
          'Report Submitted',
          'Thank you for helping keep our community safe. We will review your report shortly.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to submit report. Please try again.');
      }
    } catch (error) {
      logger.error('Error submitting report:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const CategoryPicker = () => (
    <Modal
      visible={showCategoryPicker}
      transparent
      animationType="fade"
      accessibilityLabel="Report category picker dialog"
      onRequestClose={() => setShowCategoryPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.categoryModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report Category</Text>
            <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
              <Ionicons name="close" size={28} color={Colors.text.dark} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryItem,
                  selectedCategory?.id === item.id && styles.categoryItemSelected,
                ]}
                onPress={() => {
                  setSelectedCategory(item);
                  setShowCategoryPicker(false);
                }}
              >
                <View
                  style={[
                    styles.categoryCheckbox,
                    selectedCategory?.id === item.id && styles.categoryCheckboxSelected,
                  ]}
                >
                  {selectedCategory?.id === item.id && (
                    <Ionicons name="checkmark" size={16} color={Colors.background.white} />
                  )}
                </View>
                <Text style={styles.categoryLabel}>{item.label}</Text>
              </TouchableOpacity>
            )}
            scrollEnabled={true}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <LinearGradient colors={Colors.gradient.primary} style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color={Colors.background.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report User</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Safety Notice */}
        <View style={styles.noticeBox}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <Text style={styles.noticeText}>
            Your report is confidential and will be reviewed by our safety team. False reports may
            result in account suspension.
          </Text>
        </View>

        {/* User Being Reported */}
        <View style={styles.reportingSection}>
          <Text style={styles.sectionLabel}>Reporting User</Text>
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Ionicons name="person-circle" size={48} color={Colors.text.tertiary} />
            </View>
            <Text style={styles.userName}>{userName}</Text>
            {reportedUserId && (
              <Text style={styles.userId}>ID: {reportedUserId.substring(0, 8)}...</Text>
            )}
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.reportingSection}>
          <Text style={styles.sectionLabel}>Reason for Report</Text>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setShowCategoryPicker(true)}
          >
            <View style={styles.categoryButtonContent}>
              <Text
                style={[
                  styles.categoryButtonText,
                  !selectedCategory && styles.categoryButtonPlaceholder,
                ]}
              >
                {selectedCategory ? selectedCategory.label : 'Select a category...'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.reportingSection}>
          <Text style={styles.sectionLabel}>Additional Details</Text>
          <Text style={styles.sectionHint}>
            Please provide specific details about why you&apos;re reporting this user
          </Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Describe the inappropriate behavior or content..."
            placeholderTextColor={Colors.text.tertiary}
            multiline
            numberOfLines={5}
            value={description}
            onChangeText={setDescription}
            maxLength={500}
          />
          <Text style={styles.characterCount}>{description.length}/500</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleReport}
          disabled={loading || !selectedCategory}
        >
          {loading ? (
            <ActivityIndicator color={Colors.background.white} size="small" />
          ) : (
            <>
              <Ionicons name="send" size={20} color={Colors.background.white} />
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpText}>
            If you feel threatened or unsafe, please contact local authorities immediately.
          </Text>
          <Text style={styles.helpSubtext}>
            For technical support with the app, contact our support team.
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <CategoryPicker />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.white,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.background.white,
  },
  noticeBox: {
    flexDirection: 'row',
    margin: 16,
    padding: 12,
    backgroundColor: Colors.background.white95,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  noticeText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: Colors.text.dark,
    lineHeight: 18,
  },
  reportingSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.background.white,
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  userCard: {
    backgroundColor: Colors.background.white95,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  userAvatar: {
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.dark,
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  categoryButton: {
    flexDirection: 'row',
    backgroundColor: Colors.background.white95,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryButtonContent: {
    flex: 1,
  },
  categoryButtonText: {
    fontSize: 14,
    color: Colors.text.dark,
    fontWeight: '500',
  },
  categoryButtonPlaceholder: {
    color: Colors.text.tertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  categoryModal: {
    backgroundColor: Colors.background.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.text.lighter,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.dark,
  },
  categoryItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.lighter,
  },
  categoryItemSelected: {
    backgroundColor: Colors.background.light,
  },
  categoryCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.text.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryCheckboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryLabel: {
    fontSize: 14,
    color: Colors.text.dark,
    fontWeight: '500',
    flex: 1,
  },
  descriptionInput: {
    backgroundColor: Colors.background.white95,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text.dark,
    textAlignVertical: 'top',
    maxHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 6,
    textAlign: 'right',
  },
  submitButton: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 20,
    paddingVertical: 14,
    backgroundColor: Colors.background.white95,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 8,
  },
  helpSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.background.white,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.background.white,
    marginBottom: 6,
  },
  helpText: {
    fontSize: 13,
    color: Colors.text.white90,
    lineHeight: 18,
    marginBottom: 6,
  },
  helpSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
