import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/colors';

const SortOption = ({ label, value, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.sortOption, isActive && styles.sortOptionActive]}
    onPress={() => onPress(value)}
    activeOpacity={0.7}
  >
    <Text style={[styles.sortOptionText, isActive && styles.sortOptionTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const SortOptions = ({ options = [], activeValue, onValueChange, style, horizontal = true }) => {
  const Container = horizontal ? ScrollView : View;
  const containerProps = horizontal
    ? {
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        contentContainerStyle: styles.horizontalContainer,
      }
    : {};

  return (
    <Container style={[styles.container, style]} {...containerProps}>
      {options.map((option) => (
        <SortOption
          key={option.value}
          label={option.label}
          value={option.value}
          isActive={activeValue === option.value}
          onPress={onValueChange}
        />
      ))}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: Colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.text.lighter,
  },
  horizontalContainer: {
    paddingHorizontal: 8,
  },
  sortOption: {
    marginHorizontal: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background.light,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  sortOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.dark,
  },
  sortOptionTextActive: {
    color: Colors.background.white,
  },
});

export default SortOptions;
