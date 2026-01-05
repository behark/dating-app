import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { EnhancedProfileService } from '../services/EnhancedProfileService';

const ETHNICITIES = [
  'Asian',
  'Black',
  'Hispanic/Latin',
  'Middle Eastern',
  'Native American',
  'Pacific Islander',
  'White',
  'Mixed',
  'Other',
];

const HEIGHT_UNITS = ['cm', 'ft'];

export default function EnhancedProfileEditScreen() {
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [availablePrompts, setAvailablePrompts] = useState([]);
  const [selectedPrompts, setSelectedPrompts] = useState([]);
  const [education, setEducation] = useState({
    school: '',
    degree: '',
    fieldOfStudy: '',
    graduationYear: new Date().getFullYear(),
  });
  const [occupation, setOccupation] = useState({
    jobTitle: '',
    company: '',
    industry: '',
  });
  const [height, setHeight] = useState({
    value: '',
    unit: 'cm',
  });
  const [selectedEthnicities, setSelectedEthnicities] = useState([]);
  const [promptAnswers, setPromptAnswers] = useState({});
  const [activeTab, setActiveTab] = useState('prompts');

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const allPrompts = await EnhancedProfileService.getAllPrompts();
      setAvailablePrompts(allPrompts);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrompt = (prompt) => {
    if (selectedPrompts.includes(prompt)) {
      setSelectedPrompts(selectedPrompts.filter((p) => p !== prompt));
      const newAnswers = { ...promptAnswers };
      delete newAnswers[prompt];
      setPromptAnswers(newAnswers);
    } else if (selectedPrompts.length < 3) {
      setSelectedPrompts([...selectedPrompts, prompt]);
    } else {
      Alert.alert('Limit', 'You can only select up to 3 prompts');
    }
  };

  const handleEthnicityToggle = (ethnicity) => {
    if (selectedEthnicities.includes(ethnicity)) {
      setSelectedEthnicities(selectedEthnicities.filter((e) => e !== ethnicity));
    } else if (selectedEthnicities.length < 3) {
      setSelectedEthnicities([...selectedEthnicities, ethnicity]);
    } else {
      Alert.alert('Limit', 'You can only select up to 3 ethnicities');
    }
  };

  const saveEducation = async () => {
    try {
      setLoading(true);
      await EnhancedProfileService.updateEducation(education);
      Alert.alert('Success', 'Education information saved');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveOccupation = async () => {
    try {
      setLoading(true);
      await EnhancedProfileService.updateOccupation(occupation);
      Alert.alert('Success', 'Occupation information saved');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveHeight = async () => {
    try {
      if (!height.value) {
        Alert.alert('Error', 'Please enter a height value');
        return;
      }
      setLoading(true);
      await EnhancedProfileService.updateHeight(height);
      Alert.alert('Success', 'Height saved');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveEthnicities = async () => {
    try {
      setLoading(true);
      await EnhancedProfileService.updateEthnicity(selectedEthnicities);
      Alert.alert('Success', 'Ethnicities saved');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const savePrompts = async () => {
    try {
      if (selectedPrompts.length === 0) {
        Alert.alert('Error', 'Please select at least one prompt');
        return;
      }

      const promptsToSave = selectedPrompts.map((prompt) => ({
        prompt,
        answer: promptAnswers[prompt] || '',
      }));

      // Validate answers
      for (const p of promptsToSave) {
        if (!p.answer || p.answer.trim().length === 0) {
          Alert.alert('Error', `Please provide an answer for "${p.prompt}"`);
          return;
        }
        if (p.answer.length > 300) {
          Alert.alert('Error', `Answer for "${p.prompt}" must be 300 characters or less`);
          return;
        }
      }

      setLoading(true);
      await EnhancedProfileService.updatePrompts(promptsToSave);
      Alert.alert('Success', 'Profile prompts saved');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && activeTab === 'initial') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'prompts' && styles.activeTab]}
          onPress={() => setActiveTab('prompts')}
        >
          <Text style={[styles.tabText, activeTab === 'prompts' && styles.activeTabText]}>
            Prompts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'education' && styles.activeTab]}
          onPress={() => setActiveTab('education')}
        >
          <Text style={[styles.tabText, activeTab === 'education' && styles.activeTabText]}>
            Education
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'occupation' && styles.activeTab]}
          onPress={() => setActiveTab('occupation')}
        >
          <Text style={[styles.tabText, activeTab === 'occupation' && styles.activeTabText]}>
            Work
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'height' && styles.activeTab]}
          onPress={() => setActiveTab('height')}
        >
          <Text style={[styles.tabText, activeTab === 'height' && styles.activeTabText]}>
            Height
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ethnicity' && styles.activeTab]}
          onPress={() => setActiveTab('ethnicity')}
        >
          <Text style={[styles.tabText, activeTab === 'ethnicity' && styles.activeTabText]}>
            Ethnicity
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Prompts Tab */}
        {activeTab === 'prompts' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Select Profile Prompts</Text>
            <Text style={styles.sectionSubtitle}>Choose up to 3 prompts and answer them</Text>

            <FlatList
              scrollEnabled={false}
              data={availablePrompts}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.promptCard,
                    selectedPrompts.includes(item) && styles.selectedPrompt,
                  ]}
                  onPress={() => handleSelectPrompt(item)}
                >
                  <Text style={styles.promptText}>{item}</Text>
                </TouchableOpacity>
              )}
            />

            {selectedPrompts.map((prompt, index) => (
              <View key={index} style={styles.answerContainer}>
                <Text style={styles.answerLabel}>Your answer to &quot;{prompt}&quot;</Text>
                <TextInput
                  style={styles.answerInput}
                  placeholder="Type your answer here..."
                  value={promptAnswers[prompt] || ''}
                  onChangeText={(text) => {
                    if (text.length <= 300) {
                      setPromptAnswers({
                        ...promptAnswers,
                        [prompt]: text,
                      });
                    }
                  }}
                  multiline
                  maxLength={300}
                />
                <Text style={styles.characterCount}>
                  {(promptAnswers[prompt] || '').length}/300
                </Text>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={savePrompts}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Prompts'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Education Tab */}
        {activeTab === 'education' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Education</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>School/University</Text>
              <TextInput
                style={styles.input}
                placeholder="Harvard University"
                value={education.school}
                onChangeText={(text) => setEducation({ ...education, school: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Degree</Text>
              <TextInput
                style={styles.input}
                placeholder="Bachelor's"
                value={education.degree}
                onChangeText={(text) => setEducation({ ...education, degree: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Field of Study</Text>
              <TextInput
                style={styles.input}
                placeholder="Computer Science"
                value={education.fieldOfStudy}
                onChangeText={(text) => setEducation({ ...education, fieldOfStudy: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Graduation Year</Text>
              <TextInput
                style={styles.input}
                placeholder="2023"
                value={education.graduationYear.toString()}
                onChangeText={(text) => {
                  const year = parseInt(text) || new Date().getFullYear();
                  setEducation({ ...education, graduationYear: year });
                }}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={saveEducation}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Education'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Occupation Tab */}
        {activeTab === 'occupation' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Occupation</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Job Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Software Engineer"
                value={occupation.jobTitle}
                onChangeText={(text) => setOccupation({ ...occupation, jobTitle: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company</Text>
              <TextInput
                style={styles.input}
                placeholder="Tech Company Inc."
                value={occupation.company}
                onChangeText={(text) => setOccupation({ ...occupation, company: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Industry</Text>
              <TextInput
                style={styles.input}
                placeholder="Technology"
                value={occupation.industry}
                onChangeText={(text) => setOccupation({ ...occupation, industry: text })}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={saveOccupation}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Occupation'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Height Tab */}
        {activeTab === 'height' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Height</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height Value</Text>
              <TextInput
                style={styles.input}
                placeholder="180"
                value={height.value}
                onChangeText={(text) => setHeight({ ...height, value: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.unitContainer}>
                {HEIGHT_UNITS.map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[styles.unitButton, height.unit === unit && styles.unitButtonActive]}
                    onPress={() => setHeight({ ...height, unit })}
                  >
                    <Text
                      style={[
                        styles.unitButtonText,
                        height.unit === unit && styles.unitButtonTextActive,
                      ]}
                    >
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={saveHeight}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Height'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ethnicity Tab */}
        {activeTab === 'ethnicity' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Ethnicity</Text>
            <Text style={styles.sectionSubtitle}>Select up to 3</Text>

            <View style={styles.ethnicityGrid}>
              {ETHNICITIES.map((ethnicity) => (
                <TouchableOpacity
                  key={ethnicity}
                  style={[
                    styles.ethnicityChip,
                    selectedEthnicities.includes(ethnicity) && styles.ethnicityChipActive,
                  ]}
                  onPress={() => handleEthnicityToggle(ethnicity)}
                >
                  <Text
                    style={[
                      styles.ethnicityChipText,
                      selectedEthnicities.includes(ethnicity) && styles.ethnicityChipTextActive,
                    ]}
                  >
                    {ethnicity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={saveEthnicities}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Ethnicities'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomColor: 'transparent',
    borderBottomWidth: 3,
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  promptCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  selectedPrompt: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  promptText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  answerContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  answerLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  answerInput: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#000',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#000',
  },
  unitContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  unitButtonTextActive: {
    color: '#fff',
  },
  ethnicityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  ethnicityChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderColor: '#ddd',
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  ethnicityChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  ethnicityChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  ethnicityChipTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
