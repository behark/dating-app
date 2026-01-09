import React, { useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

const FilterSection = ({ title, children, expanded, onToggle }) => (
  <View style={styles.filterSection}>
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={20}
        color={Colors.text.secondary}
      />
    </TouchableOpacity>
    {expanded && <View style={styles.sectionContent}>{children}</View>}
  </View>
);

const RangeSlider = ({
  label,
  min,
  max,
  value,
  onValueChange,
  step = 1,
  unit = '',
}) => {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(null); // 'min' or 'max'

  // Convert value to percentage position
  const valueToPercent = (val) => ((val - min) / (max - min)) * 100;

  // Convert percentage position to value
  const percentToValue = (percent) => {
    const rawValue = min + ((percent / 100) * (max - min));
    const stepped = Math.round(rawValue / step) * step;
    return Math.max(min, Math.min(max, stepped));
  };

  // Create pan responder for a thumb
  const createPanResponder = (thumbType) => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setDragging(thumbType);
    },
    onPanResponderMove: (evt, gestureState) => {
      if (!trackRef.current) return;

      trackRef.current.measure((x, y, width, height, pageX, pageY) => {
        const touchX = evt.nativeEvent.pageX - pageX;
        const percent = Math.max(0, Math.min(100, (touchX / width) * 100));
        const newValue = percentToValue(percent);

        if (thumbType === 'min') {
          // Ensure min thumb doesn't go past max thumb (maintain minimum gap)
          const maxValue = value[1];
          const minGap = step * 2; // Minimum gap between thumbs
          const constrainedValue = Math.min(newValue, maxValue - minGap);
          // Ensure doesn't go below minimum
          const finalValue = Math.max(min, constrainedValue);
          onValueChange([finalValue, maxValue]);
        } else {
          // Ensure max thumb doesn't go before min thumb
          const minValue = value[0];
          const minGap = step * 2; // Minimum gap between thumbs
          const constrainedValue = Math.max(newValue, minValue + minGap);
          // Ensure doesn't go above maximum
          const finalValue = Math.min(max, constrainedValue);
          onValueChange([minValue, finalValue]);
        }
      });
    },
    onPanResponderRelease: () => {
      setDragging(null);
    },
    onPanResponderTerminate: () => {
      setDragging(null);
    },
  });

  const minPanResponder = createPanResponder('min');
  const maxPanResponder = createPanResponder('max');

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderLabel}>
        <Text style={styles.sliderText}>{label}</Text>
        <Text style={styles.sliderValue}>
          {value[0]} - {value[1]} {unit}
        </Text>
      </View>
      <View
        ref={trackRef}
        style={styles.sliderTrack}
        {...(dragging ? (dragging === 'min' ? minPanResponder.panHandlers : maxPanResponder.panHandlers) : {})}
      >
        <View
          style={[
            styles.sliderRange,
            {
              left: `${valueToPercent(value[0])}%`,
              width: `${valueToPercent(value[1]) - valueToPercent(value[0])}%`,
            },
          ]}
        />
        <View
          style={[
            styles.sliderThumb,
            {
              left: `${valueToPercent(value[0])}%`,
              backgroundColor: dragging === 'min' ? Colors.primary : Colors.primary,
              transform: [{ scale: dragging === 'min' ? 1.2 : 1 }],
            },
          ]}
          {...minPanResponder.panHandlers}
          accessibilityRole="adjustable"
          accessibilityLabel={`Minimum ${label}: ${value[0]} ${unit}`}
          accessibilityHint={`Swipe to adjust minimum ${label.toLowerCase()}`}
          accessibilityValue={{ min, max, now: value[0] }}
        />
        <View
          style={[
            styles.sliderThumb,
            {
              left: `${valueToPercent(value[1])}%`,
              backgroundColor: dragging === 'max' ? Colors.primary : Colors.primary,
              transform: [{ scale: dragging === 'max' ? 1.2 : 1 }],
            },
          ]}
          {...maxPanResponder.panHandlers}
          accessibilityRole="adjustable"
          accessibilityLabel={`Maximum ${label}: ${value[1]} ${unit}`}
          accessibilityHint={`Swipe to adjust maximum ${label.toLowerCase()}`}
          accessibilityValue={{ min, max, now: value[1] }}
        />
      </View>
    </View>
  );
};

const CheckboxOption = ({ label, checked, onPress }) => (
  <TouchableOpacity
    style={styles.checkboxContainer}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="checkbox"
    accessibilityLabel={label}
    accessibilityState={{ checked }}
    accessibilityHint={`${checked ? 'Uncheck' : 'Check'} ${label.toLowerCase()}`}
  >
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && (
        <Ionicons name="checkmark" size={16} color={Colors.background.white} />
      )}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
);

const FilterOptions = ({
  visible,
  onClose,
  filters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    location: true,
    age: false,
    interests: false,
    preferences: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleRangeChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleCheckboxChange = (key, option) => {
    const currentValues = filters[key] || [];
    const newValues = currentValues.includes(option)
      ? currentValues.filter(v => v !== option)
      : [...currentValues, option];

    onFiltersChange({
      ...filters,
      [key]: newValues,
    });
  };

  const resetFilters = () => {
    onResetFilters();
    onClose();
  };

  const applyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      accessibilityViewIsModal
      accessibilityModalLabel="Filter options"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={resetFilters} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <FilterSection
            title="Location"
            expanded={expandedSections.location}
            onToggle={() => toggleSection('location')}
          >
            <RangeSlider
              label="Distance"
              min={1}
              max={100}
              value={filters.distance || [1, 50]}
              onValueChange={(value) => handleRangeChange('distance', value)}
              unit="km"
            />
            <CheckboxOption
              label="Show only verified locations"
              checked={filters.verifiedLocation || false}
              onPress={() => onFiltersChange({
                ...filters,
                verifiedLocation: !filters.verifiedLocation,
              })}
            />
          </FilterSection>

          <FilterSection
            title="Age Range"
            expanded={expandedSections.age}
            onToggle={() => toggleSection('age')}
          >
            <RangeSlider
              label="Age"
              min={18}
              max={80}
              value={filters.ageRange || [18, 35]}
              onValueChange={(value) => handleRangeChange('ageRange', value)}
              unit="years"
            />
          </FilterSection>

          <FilterSection
            title="Interests"
            expanded={expandedSections.interests}
            onToggle={() => toggleSection('interests')}
          >
            {['Sports', 'Music', 'Travel', 'Food', 'Art', 'Technology'].map((interest) => (
              <CheckboxOption
                key={interest}
                label={interest}
                checked={(filters.interests || []).includes(interest)}
                onPress={() => handleCheckboxChange('interests', interest)}
              />
            ))}
          </FilterSection>

          <FilterSection
            title="Preferences"
            expanded={expandedSections.preferences}
            onToggle={() => toggleSection('preferences')}
          >
            <CheckboxOption
              label="Show online users only"
              checked={filters.onlineOnly || false}
              onPress={() => onFiltersChange({
                ...filters,
                onlineOnly: !filters.onlineOnly,
              })}
            />
            <CheckboxOption
              label="Photo verified only"
              checked={filters.photoVerifiedOnly || false}
              onPress={() => onFiltersChange({
                ...filters,
                photoVerifiedOnly: !filters.photoVerifiedOnly,
              })}
            />
            <CheckboxOption
              label="Premium users only"
              checked={filters.premiumOnly || false}
              onPress={() => onFiltersChange({
                ...filters,
                premiumOnly: !filters.premiumOnly,
              })}
            />
          </FilterSection>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.applyButton]}
            onPress={applyFilters}
            activeOpacity={0.7}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  resetButton: {
    padding: 8,
  },
  resetText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterSection: {
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  sectionContent: {
    paddingTop: 8,
  },
  sliderContainer: {
    marginVertical: 12,
  },
  sliderLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  sliderValue: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  sliderTrack: {
    height: 4,
    backgroundColor: Colors.background.light,
    borderRadius: 2,
    position: 'relative',
  },
  sliderRange: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
    position: 'absolute',
  },
  sliderThumb: {
    width: 24,
    height: 24,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    position: 'absolute',
    top: -10,
    borderWidth: 3,
    borderColor: Colors.background.white,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.text.primary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    backgroundColor: Colors.background.white,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: Colors.background.light,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  applyButton: {
    backgroundColor: Colors.primary,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background.white,
  },
});

export default FilterOptions;