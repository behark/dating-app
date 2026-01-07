import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

/**
 * PreviewBadge component for indicating preview/demo mode
 *
 * @param {Object} props
 * @param {string} props.text - Text to display in the badge
 * @param {string} props.icon - Icon name from Ionicons (default: 'eye')
 * @param {Object} props.style - Additional styling for the badge container
 */
const PreviewBadge = ({
  text = 'Preview Mode',
  icon = 'eye',
  style,
}) => (
  <View style={[styles.container, style]}>
    <Ionicons name={icon} size={14} color={Colors.primary} />
    <Text style={styles.text}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.white90,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
});

export default PreviewBadge;