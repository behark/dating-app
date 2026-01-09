import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

/**
 * DemoOverlay component for indicating demo content
 *
 * @param {Object} props
 * @param {string} props.text - Text to display in the overlay badge
 * @param {string} props.icon - Icon name from Ionicons (default: 'information-circle')
 * @param {Object} props.style - Additional styling for the overlay container
 */
const DemoOverlay = ({
  text = 'Demo Profile',
  icon = 'information-circle',
  style,
}) => (
  <View style={[styles.container, style]}>
    <View style={styles.badge}>
      <Ionicons name={icon} size={16} color={Colors.background.white} />
      <Text style={styles.text}>{text}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  text: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.background.white,
  },
});

export default DemoOverlay;