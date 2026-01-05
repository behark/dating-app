import { useEffect, useState } from 'react';
import { Colors } from '../constants/colors';
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

// Tab Content Components
const PromptsTab = ({
  availablePrompts,
  selectedPrompts,
  promptAnswers,
  loading,
  onSelectPrompt,
  onAnswerChange,
  onSave,
}) => (
  <View style={styles.tabContent}>
    <Text style={styles.sectionTitle}>Select Profile Prompts</Text>
    <Text style={styles.sectionSubtitle}>Choose up to 3 prompts and answer them</Text>

    <FlatList
      scrollEnabled={false}
      data={availablePrompts}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.promptCard, selectedPrompts.includes(item) && styles.selectedPrompt]}
          onPress={() => onSelectPrompt(item)}
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
          onChangeText={(text) => onAnswerChange(prompt, text)}
          multiline
          maxLength={300}
        />
        <Text style={styles.characterCount}>{(promptAnswers[prompt] || '').length}/300</Text>
      </View>
    ))}

    <TouchableOpacity
      style={[styles.saveButton, loading && styles.disabledButton]}
      onPress={onSave}
      disabled={loading}
    >
      <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Prompts'}</Text>
    </TouchableOpacity>
  </View>
);

const EducationTab = ({ education, loading, onEducationChange, onSave }) => (
  <View style={styles.tabContent}>
    <Text style={styles.sectionTitle}>Education</Text>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>School/University</Text>
      <TextInput
        style={styles.input}
        placeholder="Harvard University"
        value={education.school}
        onChangeText={(text) => onEducationChange({ ...education, school: text })}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Degree</Text>
      <TextInput
        style={styles.input}
        placeholder="Bachelor's"
        value={education.degree}
        onChangeText={(text) => onEducationChange({ ...education, degree: text })}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Field of Study</Text>
      <TextInput
        style={styles.input}
        placeholder="Computer Science"
        value={education.fieldOfStudy}
        onChangeText={(text) => onEducationChange({ ...education, fieldOfStudy: text })}
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
          onEducationChange({ ...education, graduationYear: year });
        }}
        keyboardType="numeric"
      />
    </View>

    <TouchableOpacity
      style={[styles.saveButton, loading && styles.disabledButton]}
      onPress={onSave}
      disabled={loading}
    >
      <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Education'}</Text>
    </TouchableOpacity>
  </View>
);

const OccupationTab = ({ occupation, loading, onOccupationChange, onSave }) => (
  <View style={styles.tabContent}>
    <Text style={styles.sectionTitle}>Occupation</Text>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Job Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Software Engineer"
        value={occupation.jobTitle}
        onChangeText={(text) => onOccupationChange({ ...occupation, jobTitle: text })}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Company</Text>
      <TextInput
        style={styles.input}
        placeholder="Tech Company Inc."
        value={occupation.company}
        onChangeText={(text) => onOccupationChange({ ...occupation, company: text })}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Industry</Text>
      <TextInput
        style={styles.input}
        placeholder="Technology"
        value={occupation.industry}
        onChangeText={(text) => onOccupationChange({ ...occupation, industry: text })}
      />
    </View>

    <TouchableOpacity
      style={[styles.saveButton, loading && styles.disabledButton]}
      onPress={onSave}
      disabled={loading}
    >
      <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Occupation'}</Text>
    </TouchableOpacity>
  </View>
);

const HeightTab = ({ height, loading, onHeightChange, onSave }) => (
  <View style={styles.tabContent}>
    <Text style={styles.sectionTitle}>Height</Text>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Height Value</Text>
      <TextInput
        style={styles.input}
        placeholder="180"
        value={height.value}
        onChangeText={(text) => onHeightChange({ ...height, value: text })}
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
            onPress={() => onHeightChange({ ...height, unit })}
          >
            <Text
              style={[styles.unitButtonText, height.unit === unit && styles.unitButtonTextActive]}
            >
              {unit}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    <TouchableOpacity
      style={[styles.saveButton, loading && styles.disabledButton]}
      onPress={onSave}
      disabled={loading}
    >
      <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Height'}</Text>
    </TouchableOpacity>
  </View>
);

const EthnicityTab = ({ selectedEthnicities, loading, onEthnicityToggle, onSave }) => (
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
          onPress={() => onEthnicityToggle(ethnicity)}
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
      onPress={onSave}
      disabled={loading}
    >
      <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Ethnicities'}</Text>
    </TouchableOpacity>
  </View>
);

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

  const handleAnswerChange = (prompt, text) => {
    if (text.length <= 300) {
      setPromptAnswers({
        ...promptAnswers,
        [prompt]: text,
      });
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
        {activeTab === 'prompts' && (
          <PromptsTab
            availablePrompts={availablePrompts}
            selectedPrompts={selectedPrompts}
            promptAnswers={promptAnswers}
            loading={loading}
            onSelectPrompt={handleSelectPrompt}
            onAnswerChange={handleAnswerChange}
            onSave={savePrompts}
          />
        )}

        {activeTab === 'education' && (
          <EducationTab
            education={education}
            loading={loading}
            onEducationChange={setEducation}
            onSave={saveEducation}
          />
        )}

        {activeTab === 'occupation' && (
          <OccupationTab
            occupation={occupation}
            loading={loading}
            onOccupationChange={setOccupation}
            onSave={saveOccupation}
          />
        )}

        {activeTab === 'height' && (
          <HeightTab
            height={height}
            loading={loading}
            onHeightChange={setHeight}
            onSave={saveHeight}
          />
        )}

        {activeTab === 'ethnicity' && (
          <EthnicityTab
            selectedEthnicities={selectedEthnicities}
            loading={loading}
            onEthnicityToggle={handleEthnicityToggle}
            onSave={saveEthnicities}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.lighter,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.white,
    borderBottomColor: Colors.border.light,
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
    color: Colors.text.secondary,
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
    color: Colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  promptCard: {
    backgroundColor: Colors.background.white,
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderColor: Colors.border.light,
    borderWidth: 1,
  },
  selectedPrompt: {
    backgroundColor: Colors.status.infoLight,
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  promptText: {
    fontSize: 14,
    color: Colors.text.dark,
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
    color: Colors.text.primary,
  },
  answerInput: {
    backgroundColor: Colors.background.white,
    borderColor: Colors.border.light,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: Colors.text.primary,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.text.tertiary,
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
    color: Colors.text.primary,
  },
  input: {
    backgroundColor: Colors.background.white,
    borderColor: Colors.border.light,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text.primary,
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
    borderColor: Colors.border.light,
    borderWidth: 1,
    backgroundColor: Colors.background.white,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  unitButtonTextActive: {
    color: Colors.background.white,
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
    borderColor: Colors.border.light,
    borderWidth: 1,
    backgroundColor: Colors.background.white,
  },
  ethnicityChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  ethnicityChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text.dark,
  },
  ethnicityChipTextActive: {
    color: Colors.background.white,
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
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
